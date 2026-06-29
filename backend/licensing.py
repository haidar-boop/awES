"""License keys for the Pro tier — stateless, signed, no database required.

A license key is an HMAC-signed token of the form::

    brc_<base64url(payload)>.<base64url(signature)>

``payload`` is a small JSON blob ``{v, tier, iat, exp, id, email?}`` and the
signature is ``HMAC-SHA256(payload, LICENSE_SECRET)``. Because the key is
self-contained and signed, the server can verify entitlement with **no
database** — it just checks the signature and expiry.

Security model
--------------
* The browser never decides the tier. It sends a key; the *server* verifies it.
* Keys cannot be forged without ``LICENSE_SECRET``.
* Keys can be time-limited (``exp``) and individually revoked (``LICENSE_REVOKED``).
* A static allow-list (``LICENSE_KEYS``) lets you hand out keys manually without
  signing, useful for comps/testing.

Environment
-----------
``LICENSE_SECRET``    HMAC secret. **Set this in production.**
``LICENSE_KEYS``      Comma-separated literal keys that are always valid Pro.
``LICENSE_REVOKED``   Comma-separated key ids to reject even if otherwise valid.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import time

_DEFAULT_DEV_SECRET = "dev-insecure-license-secret-change-me"


def secret_is_default() -> bool:
    return not os.environ.get("LICENSE_SECRET")


def _secret() -> bytes:
    return (os.environ.get("LICENSE_SECRET") or _DEFAULT_DEV_SECRET).encode()


def _b64e(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _b64d(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def _sign(body: str) -> str:
    return _b64e(hmac.new(_secret(), body.encode(), hashlib.sha256).digest())


def issue_license(
    tier: str = "pro",
    days: int | None = None,
    email: str | None = None,
    note: str | None = None,
    key_id: str | None = None,
) -> str:
    """Mint a signed license key. ``days=None`` means it never expires."""
    now = int(time.time())
    payload = {
        "v": 1,
        "tier": tier,
        "iat": now,
        "exp": (now + days * 86400) if days else 0,
        "id": key_id or secrets.token_hex(6),
    }
    if email:
        payload["email"] = email
    if note:
        payload["note"] = note
    body = _b64e(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode())
    return f"brc_{body}.{_sign(body)}"


def verify_license(key: str | None) -> dict:
    """Verify a key. Returns a dict with at least ``valid`` and ``tier``.

    ``tier`` is always present so callers can use it directly; it is ``"free"``
    whenever the key is missing/invalid/expired/revoked.
    """
    if not key or not isinstance(key, str):
        return {"valid": False, "tier": "free", "reason": "missing"}
    key = key.strip()

    # Static manual allow-list (always Pro).
    static = [k.strip() for k in os.environ.get("LICENSE_KEYS", "").split(",") if k.strip()]
    if key in static:
        return {"valid": True, "tier": "pro", "reason": "static", "id": "static"}

    if not key.startswith("brc_") or "." not in key:
        return {"valid": False, "tier": "free", "reason": "bad_format"}

    try:
        body, sig = key[len("brc_"):].split(".", 1)
        if not hmac.compare_digest(sig, _sign(body)):
            return {"valid": False, "tier": "free", "reason": "bad_signature"}
        payload = json.loads(_b64d(body))
    except Exception:
        return {"valid": False, "tier": "free", "reason": "corrupt"}

    exp = int(payload.get("exp", 0) or 0)
    if exp and time.time() > exp:
        return {"valid": False, "tier": "free", "reason": "expired", "expires": exp}

    revoked = [r.strip() for r in os.environ.get("LICENSE_REVOKED", "").split(",") if r.strip()]
    if payload.get("id") in revoked:
        return {"valid": False, "tier": "free", "reason": "revoked", "id": payload.get("id")}

    return {
        "valid": True,
        "tier": payload.get("tier", "pro"),
        "reason": "ok",
        "id": payload.get("id"),
        "email": payload.get("email"),
        "expires": exp,
    }


def resolve_tier(key: str | None) -> tuple[str, dict]:
    """Return (tier, license_info). Pro only for a valid Pro key; else free."""
    info = verify_license(key)
    tier = "pro" if info.get("valid") and info.get("tier") == "pro" else "free"
    return tier, info
