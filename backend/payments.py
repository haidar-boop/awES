"""Payment-provider glue: verify webhooks and turn a paid order into a license.

We support two providers, both of which sign their webhooks so we can trust
them. On a verified "purchase succeeded" event we mint a signed license key
(see :mod:`licensing`), persist a record, and (TODO) email it to the buyer.

No provider SDK is required — signature verification is plain HMAC.

Environment
-----------
``LEMONSQUEEZY_WEBHOOK_SECRET``   Lemon Squeezy signing secret.
``STRIPE_WEBHOOK_SECRET``         Stripe webhook signing secret (whsec_...).
``LICENSE_STORE``                 Path to a JSON file logging issued keys
                                  (default: backend/.license_store.json).
``CHECKOUT_URL``                  Hosted checkout link shown to buyers.
``PRICE_LABEL``                   Human label for the Pro purchase.
"""
from __future__ import annotations

import hmac
import hashlib
import json
import os
import time
import urllib.parse
import urllib.request

from licensing import issue_license


# ---------------------------------------------------------------------------
# webhook signature verification
# ---------------------------------------------------------------------------

def verify_lemonsqueezy(raw_body: bytes, signature: str | None) -> bool:
    """Lemon Squeezy signs with ``X-Signature = hex(HMAC_SHA256(body, secret))``."""
    secret = os.environ.get("LEMONSQUEEZY_WEBHOOK_SECRET", "")
    if not secret or not signature:
        return False
    expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature.strip())


def verify_stripe(raw_body: bytes, sig_header: str | None, tolerance: int = 300) -> bool:
    """Stripe signs with ``Stripe-Signature: t=<ts>,v1=<hex>`` over ``"{t}.{body}"``."""
    secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
    if not secret or not sig_header:
        return False
    parts = dict(p.split("=", 1) for p in sig_header.split(",") if "=" in p)
    ts, v1 = parts.get("t"), parts.get("v1")
    if not ts or not v1:
        return False
    try:
        if abs(time.time() - int(ts)) > tolerance:
            return False
    except ValueError:
        return False
    signed = ts.encode() + b"." + raw_body
    expected = hmac.new(secret.encode(), signed, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, v1)


# ---------------------------------------------------------------------------
# issuing + recording keys
# ---------------------------------------------------------------------------

def _store_path() -> str:
    return os.environ.get(
        "LICENSE_STORE",
        os.path.join(os.path.dirname(os.path.abspath(__file__)), ".license_store.json"),
    )


def _record(entry: dict) -> None:
    path = _store_path()
    data = []
    try:
        with open(path, "r") as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        data = []
    data.append(entry)
    try:
        with open(path, "w") as f:
            json.dump(data, f, indent=2)
    except OSError:
        pass  # store is best-effort; the key itself is stateless


def find_paid_key_by_email(email: str | None) -> str | None:
    """Return a previously-issued key for ``email`` from the store, if any."""
    if not email:
        return None
    target = email.strip().lower()
    try:
        with open(_store_path(), "r") as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return None
    for rec in reversed(data):  # most recent first
        if (rec.get("email") or "").strip().lower() == target and rec.get("key"):
            return rec["key"]
    return None


def lemonsqueezy_has_paid_email(email: str | None) -> bool:
    """Ask the Lemon Squeezy API whether ``email`` has a paid order.

    Durable source of truth — survives server restarts / ephemeral disks where
    the local store would be lost. No-ops (returns False) unless
    ``LEMONSQUEEZY_API_KEY`` is set, and fails closed on any error.
    """
    api = os.environ.get("LEMONSQUEEZY_API_KEY")
    if not api or not email:
        return False
    params = {"filter[user_email]": email.strip()}
    store_id = os.environ.get("LEMONSQUEEZY_STORE_ID")
    if store_id:
        params["filter[store_id]"] = store_id
    url = "https://api.lemonsqueezy.com/v1/orders?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {api}",
                 "Accept": "application/vnd.api+json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            payload = json.load(resp)
        for order in payload.get("data", []):
            status = (order.get("attributes") or {}).get("status", "")
            if status in ("paid", "active", "completed"):
                return True
    except Exception:
        return False
    return False


def claim_license(email: str | None) -> str | None:
    """Return a Pro key for a paid ``email`` (store first, then LS API), else None."""
    if not email:
        return None
    key = find_paid_key_by_email(email)
    if key:
        return key
    if lemonsqueezy_has_paid_email(email):
        return fulfill_purchase(email, "lemonsqueezy-claim", "api-verified")
    return None


def _stripe_get(url: str, sk: str) -> dict:
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {sk}"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.load(resp)


def stripe_has_paid_email(email: str | None) -> bool:
    """Whether ``email`` has a paid Stripe Checkout session.

    Scans recent Checkout Sessions (what Payment Links create) for a ``paid``
    one matching the email -- reliable regardless of whether a Customer object
    was created. Durable source of truth; no webhook required. Returns False
    unless ``STRIPE_API_KEY`` is set, and fails closed on any error.
    """
    sk = os.environ.get("STRIPE_API_KEY")
    if not sk or not email:
        return False
    target = email.strip().lower()
    url = "https://api.stripe.com/v1/checkout/sessions?limit=100"
    try:
        for _ in range(3):  # up to ~300 most-recent sessions
            data = _stripe_get(url, sk)
            for s in data.get("data", []):
                cd = s.get("customer_details") or {}
                em = (cd.get("email") or s.get("customer_email") or "").strip().lower()
                if em == target and s.get("payment_status") == "paid":
                    return True
            if data.get("has_more") and data.get("data"):
                last = data["data"][-1]["id"]
                url = (
                    "https://api.stripe.com/v1/checkout/sessions"
                    f"?limit=100&starting_after={last}"
                )
            else:
                break
    except Exception:
        return False
    return False


# Comp'd Pro access (no purchase required) for the owner, plus any addresses in
# the PRO_EMAILS env var (comma-separated). This is safe: Pro still requires a
# *verified* account, so only someone who controls the inbox can activate it --
# it can't be used to grant strangers free Pro.
_COMP_PRO_EMAILS = {"bigmoehaidar@gmail.com"} | {
    e.strip().lower()
    for e in os.environ.get("PRO_EMAILS", "").split(",")
    if e.strip()
}


def email_has_pro(email: str | None) -> bool:
    """Has this email completed a purchase (or is it comp'd for the owner)?

    Checks the owner allowlist, then the local webhook record (fast), then the
    provider APIs (durable, survives restarts): Lemon Squeezy, then Stripe.
    """
    if not email:
        return False
    if email.strip().lower() in _COMP_PRO_EMAILS:
        return True
    if find_paid_key_by_email(email):
        return True
    if lemonsqueezy_has_paid_email(email):
        return True
    return stripe_has_paid_email(email)


def fulfill_purchase(
    email: str | None, provider: str, reference: str | None = None,
    days: int | None = None,
) -> str:
    """Mint + record a Pro license for a verified purchase. Returns the key.

    TODO(email): send the key to ``email`` via your transactional email
    provider. For now it is recorded to the store file and returned/logged so
    you can wire delivery without changing this signature.
    """
    key = issue_license(tier="pro", days=days, email=email, note=f"{provider}:{reference or ''}")
    _record({
        "key": key,
        "email": email,
        "provider": provider,
        "reference": reference,
        "issued_at": int(time.time()),
    })
    print(f"[payments] issued Pro license for {email or '<no-email>'} via {provider}")
    return key


# ---------------------------------------------------------------------------
# event extraction (kept defensive — providers nest fields differently)
# ---------------------------------------------------------------------------

def extract_lemonsqueezy(event: dict) -> tuple[str, str | None, str | None]:
    """Return (event_name, email, order_id) from a Lemon Squeezy payload."""
    name = (event.get("meta") or {}).get("event_name", "")
    attrs = ((event.get("data") or {}).get("attributes")) or {}
    email = attrs.get("user_email") or attrs.get("email")
    order_id = str((event.get("data") or {}).get("id") or attrs.get("order_id") or "")
    return name, email, order_id


def extract_stripe(event: dict) -> tuple[str, str | None, str | None]:
    """Return (event_type, email, session/payment id) from a Stripe payload."""
    etype = event.get("type", "")
    obj = ((event.get("data") or {}).get("object")) or {}
    email = (
        obj.get("customer_email")
        or (obj.get("customer_details") or {}).get("email")
    )
    ref = obj.get("id")
    return etype, email, ref


# Events that mean "grant Pro".
LEMONSQUEEZY_PAID_EVENTS = {"order_created", "subscription_created", "subscription_payment_success"}
STRIPE_PAID_EVENTS = {"checkout.session.completed", "invoice.paid"}


def public_config() -> dict:
    """Non-secret config the frontend needs to render the unlock UI."""
    return {
        "checkout_url": os.environ.get("CHECKOUT_URL", ""),
        "payments_enabled": bool(os.environ.get("CHECKOUT_URL")),
        "price_label": os.environ.get("PRICE_LABEL", "Pro — full report"),
        # Query-param name used to prefill the buyer's email at checkout.
        # Lemon Squeezy: "checkout[email]"; Stripe Payment Links: "prefilled_email".
        "checkout_email_param": os.environ.get("CHECKOUT_EMAIL_PARAM", "checkout[email]"),
    }
