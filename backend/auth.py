"""Supabase-backed authentication.

We don't store passwords or run our own user database — Supabase does. The
frontend uses Supabase Auth for sign-up, the email verification link, and login;
it then sends the user's Supabase **access token** on API requests.

This module validates that token *server-side* by asking Supabase who it belongs
to (``GET {SUPABASE_URL}/auth/v1/user``). That's signing-method agnostic (works
whether the project uses the legacy HS256 secret or the newer asymmetric keys)
and means we never trust the browser's claim about identity or tier.

Environment
-----------
``SUPABASE_URL``        e.g. https://abcd.supabase.co
``SUPABASE_ANON_KEY``   public anon key (safe to expose to the browser)
"""
from __future__ import annotations

import json
import os
import time
import urllib.request

# Tiny TTL cache so we don't hit Supabase on every single request.
_CACHE: dict[str, tuple[dict | None, float]] = {}
_TTL = 30.0


def configured() -> bool:
    return bool(os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_ANON_KEY"))


def _fetch_supabase_user(token: str) -> dict | None:
    url = os.environ.get("SUPABASE_URL")
    anon = os.environ.get("SUPABASE_ANON_KEY")
    if not url or not anon or not token:
        return None
    req = urllib.request.Request(
        url.rstrip("/") + "/auth/v1/user",
        headers={"Authorization": f"Bearer {token}", "apikey": anon},
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.load(resp)
    except Exception:
        return None


def get_user(token: str | None) -> dict | None:
    """Return ``{id, email, verified}`` for a valid token, else ``None``."""
    if not token:
        return None
    now = time.time()
    cached = _CACHE.get(token)
    if cached and cached[1] > now:
        return cached[0]

    raw = _fetch_supabase_user(token)
    user = None
    if raw and raw.get("id"):
        user = {
            "id": raw.get("id"),
            "email": raw.get("email"),
            # email_confirmed_at is set once the verification link is clicked.
            "verified": bool(raw.get("email_confirmed_at") or raw.get("confirmed_at")),
        }
    _CACHE[token] = (user, now + _TTL)
    return user


def bearer(authorization: str | None) -> str | None:
    """Pull the token out of an ``Authorization: Bearer <token>`` header."""
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    return None
