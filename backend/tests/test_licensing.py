"""Tests for license keys, payment-webhook verification, and tier gating."""
import hashlib
import hmac
import json
import time

import numpy as np
import pytest

import licensing
import payments
import analysis as analysis_mod


@pytest.fixture(autouse=True)
def _clean_env(monkeypatch):
    """Start each test from a known env with a fixed secret."""
    for var in ["LICENSE_KEYS", "LICENSE_REVOKED", "LEMONSQUEEZY_WEBHOOK_SECRET",
                "STRIPE_WEBHOOK_SECRET", "ADMIN_TOKEN", "CHECKOUT_URL"]:
        monkeypatch.delenv(var, raising=False)
    monkeypatch.setenv("LICENSE_SECRET", "test-secret-123")


# ---------------------------------------------------------------------------
# license keys
# ---------------------------------------------------------------------------

def test_issue_and_verify_roundtrip():
    key = licensing.issue_license(tier="pro")
    info = licensing.verify_license(key)
    assert info["valid"] is True
    assert info["tier"] == "pro"


def test_missing_key_is_free():
    assert licensing.verify_license(None)["valid"] is False
    assert licensing.resolve_tier(None)[0] == "free"
    assert licensing.resolve_tier("")[0] == "free"


def test_tampered_payload_rejected():
    key = licensing.issue_license(tier="pro")
    body, sig = key[len("brc_"):].split(".", 1)
    # Flip a character in the payload; signature no longer matches.
    bad_body = ("A" if body[0] != "A" else "B") + body[1:]
    bad_key = f"brc_{bad_body}.{sig}"
    assert licensing.verify_license(bad_key)["valid"] is False


def test_tampered_signature_rejected():
    key = licensing.issue_license(tier="pro")
    body, sig = key[len("brc_"):].split(".", 1)
    bad_sig = ("A" if sig[0] != "A" else "B") + sig[1:]
    assert licensing.verify_license(f"brc_{body}.{bad_sig}")["valid"] is False


def test_different_secret_invalidates_key(monkeypatch):
    key = licensing.issue_license(tier="pro")
    monkeypatch.setenv("LICENSE_SECRET", "a-completely-different-secret")
    assert licensing.verify_license(key)["valid"] is False


def test_expired_key_rejected():
    # Issue a key that expired in the past by hand-crafting a short TTL.
    key = licensing.issue_license(tier="pro", days=1)
    info = licensing.verify_license(key)
    assert info["valid"] is True  # not expired yet
    # Now force-expire by issuing with negative TTL via direct payload.
    body, _ = key[len("brc_"):].split(".", 1)
    payload = json.loads(licensing._b64d(body))
    payload["exp"] = int(time.time()) - 10
    new_body = licensing._b64e(
        json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
    )
    expired = f"brc_{new_body}.{licensing._sign(new_body)}"
    assert licensing.verify_license(expired)["reason"] == "expired"


def test_never_expires():
    key = licensing.issue_license(tier="pro", days=None)
    assert licensing.verify_license(key)["valid"] is True


def test_revoked_key_rejected(monkeypatch):
    key = licensing.issue_license(tier="pro", key_id="revoke-me")
    assert licensing.verify_license(key)["valid"] is True
    monkeypatch.setenv("LICENSE_REVOKED", "revoke-me")
    assert licensing.verify_license(key)["reason"] == "revoked"


def test_static_allowlist(monkeypatch):
    monkeypatch.setenv("LICENSE_KEYS", "MANUAL-123 , MANUAL-456")
    info = licensing.verify_license("MANUAL-456")
    assert info["valid"] is True and info["tier"] == "pro"
    assert licensing.verify_license("MANUAL-999")["valid"] is False


def test_resolve_tier_pro():
    key = licensing.issue_license(tier="pro")
    assert licensing.resolve_tier(key)[0] == "pro"


# ---------------------------------------------------------------------------
# webhook signature verification
# ---------------------------------------------------------------------------

def test_lemonsqueezy_signature(monkeypatch):
    monkeypatch.setenv("LEMONSQUEEZY_WEBHOOK_SECRET", "ls-secret")
    body = json.dumps({"meta": {"event_name": "order_created"},
                       "data": {"id": "42", "attributes": {"user_email": "a@b.com"}}}).encode()
    good = hmac.new(b"ls-secret", body, hashlib.sha256).hexdigest()
    assert payments.verify_lemonsqueezy(body, good) is True
    assert payments.verify_lemonsqueezy(body, "deadbeef") is False
    assert payments.verify_lemonsqueezy(body, None) is False


def test_lemonsqueezy_extract():
    event = {"meta": {"event_name": "order_created"},
             "data": {"id": "99", "attributes": {"user_email": "x@y.com"}}}
    name, email, ref = payments.extract_lemonsqueezy(event)
    assert name == "order_created" and email == "x@y.com" and ref == "99"


def test_stripe_signature(monkeypatch):
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_test")
    body = json.dumps({"type": "checkout.session.completed",
                       "data": {"object": {"id": "cs_1", "customer_email": "p@q.com"}}}).encode()
    ts = str(int(time.time()))
    v1 = hmac.new(b"whsec_test", ts.encode() + b"." + body, hashlib.sha256).hexdigest()
    header = f"t={ts},v1={v1}"
    assert payments.verify_stripe(body, header) is True
    assert payments.verify_stripe(body, f"t={ts},v1=bad") is False
    # Stale timestamp rejected.
    old = str(int(time.time()) - 10000)
    v1_old = hmac.new(b"whsec_test", old.encode() + b"." + body, hashlib.sha256).hexdigest()
    assert payments.verify_stripe(body, f"t={old},v1={v1_old}") is False


def test_fulfill_purchase_issues_verifiable_key(monkeypatch, tmp_path):
    monkeypatch.setenv("LICENSE_STORE", str(tmp_path / "store.json"))
    key = payments.fulfill_purchase("buyer@example.com", "stripe", "cs_123")
    info = licensing.verify_license(key)
    assert info["valid"] is True and info["tier"] == "pro"
    assert info["email"] == "buyer@example.com"


# ---------------------------------------------------------------------------
# email-based claim (pay -> unlock on site, no key pasting)
# ---------------------------------------------------------------------------

def test_claim_by_email_from_store(monkeypatch, tmp_path):
    monkeypatch.setenv("LICENSE_STORE", str(tmp_path / "store.json"))
    issued = payments.fulfill_purchase("user@example.com", "lemonsqueezy", "o1")
    # Case-insensitive lookup.
    found = payments.find_paid_key_by_email("USER@example.com")
    assert found == issued
    assert payments.claim_license("user@example.com") == issued
    assert licensing.verify_license(found)["tier"] == "pro"


def test_claim_unknown_email_returns_none(monkeypatch, tmp_path):
    monkeypatch.setenv("LICENSE_STORE", str(tmp_path / "store.json"))
    # No store entry and no LEMONSQUEEZY_API_KEY -> no entitlement.
    assert payments.claim_license("stranger@example.com") is None


def test_ls_api_lookup_disabled_without_key():
    # Fails closed when the API key isn't configured (no network call).
    assert payments.lemonsqueezy_has_paid_email("anyone@example.com") is False


def test_stripe_api_lookup_disabled_without_key(monkeypatch):
    monkeypatch.delenv("STRIPE_API_KEY", raising=False)
    assert payments.stripe_has_paid_email("anyone@example.com") is False


def test_email_has_pro_uses_store(monkeypatch, tmp_path):
    monkeypatch.setenv("LICENSE_STORE", str(tmp_path / "store.json"))
    monkeypatch.delenv("LEMONSQUEEZY_API_KEY", raising=False)
    monkeypatch.delenv("STRIPE_API_KEY", raising=False)
    assert payments.email_has_pro("buyer@x.com") is False
    payments.fulfill_purchase("buyer@x.com", "stripe", "ch_1")
    assert payments.email_has_pro("buyer@x.com") is True


# ---------------------------------------------------------------------------
# tier gating in the analysis payload
# ---------------------------------------------------------------------------

def _returns():
    return np.random.default_rng(0).normal(0.0006, 0.01, 300)


def test_free_tier_redacts_paid_fields():
    res = analysis_mod.run_analysis(returns=_returns(), frequency="daily",
                                    num_trials=20, tier="free")
    assert res["gating"]["locked"]  # non-empty
    assert res["sharpe"]["dsr"] == {"locked": True}
    assert res["sharpe"]["haircut_sharpe"] == {"locked": True}
    assert res["overfit"]["pbo"] == {"locked": True}
    assert res["monte_carlo"] is None
    assert res["charts"]["monte_carlo"] is None
    keys = {r["key"] for r in res["explanations"]}
    assert "dsr" not in keys and "pbo" not in keys and "montecarlo" not in keys
    # Free still gets the hook: a real verdict and PSR.
    assert res["verdict"]["level"] in ("red", "yellow", "green")
    assert isinstance(res["sharpe"]["psr"], float)


def test_pro_tier_includes_paid_fields():
    res = analysis_mod.run_analysis(returns=_returns(), frequency="daily",
                                    num_trials=20, tier="pro")
    assert res["gating"]["locked"] == []
    assert "dsr" in res["sharpe"]["dsr"]  # the real dsr dict, not a lock marker
    assert res["monte_carlo"] is not None
    assert res["charts"]["monte_carlo"] is not None
