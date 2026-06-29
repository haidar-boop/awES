"""Tests for Supabase-token auth and account-based tier gating."""
import numpy as np
import pytest
from fastapi.testclient import TestClient

import auth
import payments
import main


@pytest.fixture(autouse=True)
def _clear_cache():
    auth._CACHE.clear()
    yield
    auth._CACHE.clear()


# ---------------------------------------------------------------------------
# token validation
# ---------------------------------------------------------------------------

def test_get_user_parses_verified(monkeypatch):
    monkeypatch.setattr(auth, "_fetch_supabase_user", lambda t: {
        "id": "u1", "email": "a@b.com", "email_confirmed_at": "2026-01-01T00:00:00Z"})
    u = auth.get_user("tok-verified")
    assert u == {"id": "u1", "email": "a@b.com", "verified": True}


def test_get_user_unverified(monkeypatch):
    monkeypatch.setattr(auth, "_fetch_supabase_user", lambda t: {
        "id": "u2", "email": "c@d.com", "email_confirmed_at": None})
    assert auth.get_user("tok-unverified")["verified"] is False


def test_get_user_invalid_token(monkeypatch):
    monkeypatch.setattr(auth, "_fetch_supabase_user", lambda t: None)
    assert auth.get_user("bad") is None
    assert auth.get_user(None) is None


def test_get_user_caches(monkeypatch):
    calls = {"n": 0}

    def fake(t):
        calls["n"] += 1
        return {"id": "u", "email": "e@f.com", "email_confirmed_at": "x"}

    monkeypatch.setattr(auth, "_fetch_supabase_user", fake)
    auth.get_user("same-token")
    auth.get_user("same-token")
    assert calls["n"] == 1  # second call served from cache


def test_bearer_parsing():
    assert auth.bearer("Bearer abc.def") == "abc.def"
    assert auth.bearer("bearer xyz") == "xyz"
    assert auth.bearer("Basic abc") is None
    assert auth.bearer(None) is None


# ---------------------------------------------------------------------------
# tier resolution (verified AND paid -> pro)
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("verified,paid,expected", [
    (True, True, "pro"),
    (True, False, "free"),
    (False, True, "free"),   # unverified never gets pro even if paid
    (False, False, "free"),
])
def test_resolve_tier(monkeypatch, verified, paid, expected):
    monkeypatch.setattr(auth, "get_user",
                        lambda t: {"email": "x@y.com", "verified": verified})
    monkeypatch.setattr(payments, "email_has_pro", lambda e: paid)
    tier, _ = main._resolve_tier("Bearer t")
    assert tier == expected


def test_resolve_tier_no_token(monkeypatch):
    monkeypatch.setattr(auth, "get_user", lambda t: None)
    assert main._resolve_tier(None)[0] == "free"


# ---------------------------------------------------------------------------
# endpoints
# ---------------------------------------------------------------------------

def _client():
    return TestClient(main.app)


def test_me_endpoint(monkeypatch):
    monkeypatch.setattr(auth, "get_user",
                        lambda t: {"email": "p@q.com", "verified": True})
    monkeypatch.setattr(payments, "email_has_pro", lambda e: True)
    r = _client().get("/api/auth/me", headers={"Authorization": "Bearer t"}).json()
    assert r == {"authenticated": True, "email": "p@q.com", "verified": True, "pro": True}


def test_me_anonymous(monkeypatch):
    monkeypatch.setattr(auth, "get_user", lambda t: None)
    r = _client().get("/api/auth/me").json()
    assert r["authenticated"] is False and r["pro"] is False


def test_analyze_gating_by_account(monkeypatch):
    payload = {"returns": list(np.random.default_rng(0).normal(0.0006, 0.01, 300)),
               "num_trials": 20}
    c = _client()

    # Anonymous -> free (paid features locked)
    monkeypatch.setattr(auth, "get_user", lambda t: None)
    free = c.post("/api/analyze", json=payload).json()
    assert free["gating"]["locked"]
    assert free["monte_carlo"] is None

    # Verified + paid -> pro (everything present)
    monkeypatch.setattr(auth, "get_user",
                        lambda t: {"email": "pro@x.com", "verified": True})
    monkeypatch.setattr(payments, "email_has_pro", lambda e: True)
    pro = c.post("/api/analyze", json=payload,
                 headers={"Authorization": "Bearer t"}).json()
    assert pro["gating"]["locked"] == []
    assert pro["monte_carlo"] is not None


def test_report_requires_pro(monkeypatch):
    c = _client()
    monkeypatch.setattr(auth, "get_user", lambda t: None)
    r = c.post("/api/report", json={"analysis": {"verdict": {}}})
    assert r.status_code == 402
