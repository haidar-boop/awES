"""FastAPI app: analysis + report + sample + account/payment endpoints,
and serves the SPA.

Auth + tier are server-side. The browser sends its Supabase access token; the
server validates it with Supabase (``auth.get_user``) and grants Pro only when
the account's email is verified AND has a completed purchase
(``payments.email_has_pro``). The browser never decides identity or tier.

Single-service friendly: in production it serves the built React app from
``frontend/dist`` so the whole thing deploys as one process.
"""
from __future__ import annotations

import hmac
import json
import os

import numpy as np
from fastapi import FastAPI, File, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

import analysis as analysis_mod
import auth
import ai_analyzer
import parsing
import payments
import report as report_mod
import sample_data
import statement_import

# Public Supabase config baked in as defaults so the app works without extra
# host setup. The publishable/anon key is designed to be public (it ships to
# browsers), so this is safe to commit. Real env vars (e.g. on Render) override.
os.environ.setdefault("SUPABASE_URL", "https://hruwwjrfjzfkkxbonzls.supabase.co")
os.environ.setdefault(
    "SUPABASE_ANON_KEY", "sb_publishable_PJ0wKUMklnd25TY01w_hCg_oYeVELXS"
)

# Public checkout config (the payment link is public; the secret STRIPE_API_KEY
# stays in the host env). Stripe Payment Links prefill email via prefilled_email.
os.environ.setdefault("CHECKOUT_URL", "https://buy.stripe.com/14AfZj1xAdoJ1XMe1g7Zu02")
os.environ.setdefault("PRICE_LABEL", "CA$18.99 one-time")
os.environ.setdefault("CHECKOUT_EMAIL_PARAM", "prefilled_email")

app = FastAPI(title="Backtest Reality Check", version="1.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIST = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist"
)


# ---------------------------------------------------------------------------
# request models
# ---------------------------------------------------------------------------

class AnalyzeRequest(BaseModel):
    data: str | None = Field(None, description="Raw CSV / pasted text.")
    returns: list[float] | None = Field(None, description="Pre-parsed returns.")
    frequency: str = "daily"
    value_type: str = "auto"
    is_percentage: str | bool = "auto"
    data_kind: str = "auto"
    num_trials: int = 1
    confidence: float = 0.95
    benchmark: str | None = None
    benchmark_returns: list[float] | None = None
    flat_annual_return: float = 0.0


class ReportRequest(BaseModel):
    analysis: dict


class GrantRequest(BaseModel):
    email: str | None = None


class StrategyCodeRequest(BaseModel):
    code: str | None = None
    language: str | None = None
    context: str | None = None


# Simple in-memory daily rate limit for the (paid) AI review. Resets on restart;
# combined with Pro-only gating it's a soft cost guard. email -> [date, count].
_AI_USAGE: dict[str, list] = {}
AI_DAILY_LIMIT = int(os.environ.get("AI_DAILY_LIMIT", "5"))


def _check_ai_rate(email: str) -> bool:
    import datetime
    today = datetime.date.today().isoformat()
    rec = _AI_USAGE.get(email)
    if not rec or rec[0] != today:
        _AI_USAGE[email] = [today, 0]
        rec = _AI_USAGE[email]
    if rec[1] >= AI_DAILY_LIMIT:
        return False
    rec[1] += 1
    return True


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def _resolve_returns(req: AnalyzeRequest):
    if req.returns is not None and len(req.returns) > 0:
        arr = np.asarray(req.returns, dtype=float)
        arr = arr[np.isfinite(arr)]
        meta = {"n": int(len(arr)), "value_type": "returns",
                "data_kind": "timeseries", "conversions": [],
                "warnings": (["Fewer than 30 observations."]
                             if len(arr) < 30 else [])}
        return arr, None, "returns", meta
    if not req.data or not req.data.strip():
        raise HTTPException(400, "Provide either 'data' (text) or 'returns'.")
    try:
        parsed = parsing.parse_input(
            req.data, value_type=req.value_type,
            is_percentage=req.is_percentage, data_kind=req.data_kind,
        )
    except parsing.ParseError as e:
        raise HTTPException(400, str(e))
    return parsed.returns, parsed.pnl, parsed.value_type, parsed.to_meta()


def _resolve_benchmark(req: AnalyzeRequest):
    if req.benchmark_returns:
        arr = np.asarray(req.benchmark_returns, dtype=float)
        return arr[np.isfinite(arr)]
    if req.benchmark and req.benchmark.strip():
        try:
            parsed = parsing.parse_input(req.benchmark, value_type=req.value_type,
                                         is_percentage=req.is_percentage)
            return parsed.returns
        except parsing.ParseError:
            return None
    return None


def _resolve_tier(authorization: str | None) -> tuple[str, dict | None]:
    """Pro only for a verified, paid Supabase account; else free."""
    user = auth.get_user(auth.bearer(authorization))
    if user and user.get("verified") and payments.email_has_pro(user.get("email")):
        return "pro", user
    return "free", user


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "backtest-reality-check"}


@app.get("/api/config")
def config():
    """Public config for the frontend: Supabase keys, checkout link, pro features."""
    cfg = payments.public_config()
    cfg["paid_features"] = analysis_mod.PAID_FEATURES
    cfg["supabase_url"] = os.environ.get("SUPABASE_URL", "")
    cfg["supabase_anon_key"] = os.environ.get("SUPABASE_ANON_KEY", "")
    cfg["auth_enabled"] = auth.configured()
    cfg["ai_enabled"] = ai_analyzer.configured()
    cfg["ai_daily_limit"] = AI_DAILY_LIMIT
    return cfg


@app.get("/api/auth/me")
def me(authorization: str | None = Header(default=None)):
    """Identity + entitlement for the current Supabase session."""
    user = auth.get_user(auth.bearer(authorization))
    if not user:
        return {"authenticated": False, "pro": False}
    pro = bool(user.get("verified") and payments.email_has_pro(user.get("email")))
    return {
        "authenticated": True,
        "email": user.get("email"),
        "verified": bool(user.get("verified")),
        "pro": pro,
    }


@app.get("/api/debug/stripe")
def debug_stripe(email: str):
    """Temporary diagnostic: what does Stripe show for this email?

    Open in a browser: /api/debug/stripe?email=you@example.com
    """
    sk = os.environ.get("STRIPE_API_KEY")
    out = {"stripe_configured": bool(sk), "email": email, "scanned": 0,
           "email_seen": False, "email_paid": False, "statuses": {}}
    if not sk:
        return out
    target = email.strip().lower()
    url = "https://api.stripe.com/v1/checkout/sessions?limit=100"
    try:
        for _ in range(3):
            data = payments._stripe_get(url, sk)
            for s in data.get("data", []):
                out["scanned"] += 1
                cd = s.get("customer_details") or {}
                em = (cd.get("email") or s.get("customer_email") or "").strip().lower()
                ps = s.get("payment_status")
                out["statuses"][ps] = out["statuses"].get(ps, 0) + 1
                if em == target:
                    out["email_seen"] = True
                    if ps == "paid":
                        out["email_paid"] = True
            if data.get("has_more") and data.get("data"):
                url = ("https://api.stripe.com/v1/checkout/sessions"
                       f"?limit=100&starting_after={data['data'][-1]['id']}")
            else:
                break
    except Exception as e:
        out["error"] = str(e)[:300]
    return out


@app.get("/api/samples")
def samples():
    return {"samples": sample_data.list_samples()}


@app.get("/api/sample")
def sample(name: str = "overfit", analyze: bool = True):
    """Sample dataset + full (Pro) analysis -- a public demo, nothing to gate."""
    try:
        s = sample_data.get_sample(name)
    except KeyError as e:
        raise HTTPException(404, str(e))
    payload = {
        "key": name, "name": s["name"], "description": s["description"],
        "frequency": s["frequency"], "value_type": s["value_type"],
        "num_trials": s["num_trials"], "confidence": s["confidence"],
        "expected_verdict": s["expected_verdict"], "returns": s["returns"],
        "benchmark_returns": s["benchmark_returns"], "csv": s["csv"],
    }
    if analyze:
        payload["analysis"] = analysis_mod.run_analysis(
            returns=np.asarray(s["returns"], dtype=float),
            frequency=s["frequency"], num_trials=s["num_trials"],
            confidence=s["confidence"], value_type=s["value_type"],
            benchmark_returns=np.asarray(s["benchmark_returns"], dtype=float),
            tier="pro",
            parse_meta={"n": len(s["returns"]), "value_type": "returns",
                        "data_kind": "timeseries", "conversions": [], "warnings": []},
        )
    return payload


@app.post("/api/analyze")
def analyze(req: AnalyzeRequest, authorization: str | None = Header(default=None)):
    returns, pnl, value_type, parse_meta = _resolve_returns(req)
    if len(returns) < 2:
        raise HTTPException(400, "Need at least 2 observations to analyze.")
    benchmark_returns = _resolve_benchmark(req)
    tier, _user = _resolve_tier(authorization)
    try:
        result = analysis_mod.run_analysis(
            returns=returns, frequency=req.frequency,
            num_trials=max(1, int(req.num_trials)), confidence=float(req.confidence),
            value_type=value_type, pnl=pnl, benchmark_returns=benchmark_returns,
            flat_annual_return=req.flat_annual_return, tier=tier, parse_meta=parse_meta,
        )
    except Exception as e:
        raise HTTPException(400, f"Analysis failed: {e}")
    return result


@app.post("/api/import")
async def import_statement(file: UploadFile = File(...)):
    """Extract the P&L / equity series from a broker or platform export.

    Parses MT4/MT5 HTML statements, TradingView / MT5 XLSX reports, and cTrader
    or generic multi-column CSVs into the single numeric column the normal
    analyze flow consumes. It does NOT analyse or gate anything -- the returned
    text is fed back through /api/analyze like any pasted data.
    """
    content = await file.read()
    try:
        result = statement_import.parse_statement(content, file.filename or "")
    except statement_import.ImportError_ as e:
        raise HTTPException(400, str(e))
    except Exception as e:  # malformed/corrupt files
        raise HTTPException(400, f"Could not read that file: {e}")
    if result.n < 2:
        raise HTTPException(400, "Found fewer than 2 values to analyze in that file.")
    return {
        "text": result.text,
        "kind": result.kind,            # "trades" | "equity"
        "column": result.column,
        "source_format": result.source_format,
        "n": result.n,
        "notes": result.notes,
    }


@app.post("/api/ai/analyze-strategy")
def ai_analyze_strategy(req: StrategyCodeRequest,
                        authorization: str | None = Header(default=None)):
    # HARD COST GATE: resolve the tier first and bail for non-Pro BEFORE any
    # call to the AI provider. Free users never trigger (or cost) an AI request.
    tier, user = _resolve_tier(authorization)
    if tier != "pro":
        raise HTTPException(402, "AI strategy review is a Pro feature. Unlock Pro to use it.")
    if not ai_analyzer.configured():
        raise HTTPException(503, "AI review isn't enabled on this deployment yet.")

    code = (req.code or "").strip()
    if not code:
        raise HTTPException(400, "Paste your strategy code or rules first.")
    if len(code) > ai_analyzer.MAX_INPUT_CHARS:
        raise HTTPException(
            413, f"Too large — keep it under {ai_analyzer.MAX_INPUT_CHARS // 1000} KB."
        )

    email = (user or {}).get("email") or "unknown"
    if not _check_ai_rate(email):
        raise HTTPException(
            429, f"Daily limit reached ({AI_DAILY_LIMIT} reviews/day). Try again tomorrow."
        )

    try:
        return ai_analyzer.analyze_strategy(code, req.language, req.context)
    except ai_analyzer.AIError as e:
        raise HTTPException(502, str(e))
    except Exception as e:
        raise HTTPException(502, f"AI review failed: {e}")


@app.post("/api/report")
def report(req: ReportRequest, authorization: str | None = Header(default=None)):
    tier, _user = _resolve_tier(authorization)
    if tier != "pro":
        raise HTTPException(402, "The PDF report is a Pro feature. Unlock Pro to download it.")
    if not req.analysis or "verdict" not in req.analysis:
        raise HTTPException(400, "Body must contain a full 'analysis' object.")
    try:
        pdf = report_mod.build_pdf(req.analysis)
    except Exception as e:
        raise HTTPException(500, f"Report generation failed: {e}")
    return Response(
        content=pdf, media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=backtest-reality-check.pdf"},
    )


# ---------------------------------------------------------------------------
# admin (comps / testing): grant Pro to an email without a real purchase
# ---------------------------------------------------------------------------

@app.post("/api/admin/grant")
def admin_grant(req: GrantRequest, x_admin_token: str | None = Header(default=None)):
    admin = os.environ.get("ADMIN_TOKEN")
    if not admin:
        raise HTTPException(403, "Admin grant disabled (ADMIN_TOKEN not set).")
    if not x_admin_token or not hmac.compare_digest(x_admin_token, admin):
        raise HTTPException(401, "Invalid admin token.")
    email = (req.email or "").strip()
    if "@" not in email:
        raise HTTPException(400, "Provide a valid email.")
    payments.fulfill_purchase(email, "manual-grant", "admin")
    return {"ok": True, "email": email}


# ---------------------------------------------------------------------------
# payment webhooks (verified by provider signature -> record the paid email)
# ---------------------------------------------------------------------------

@app.post("/api/webhooks/lemonsqueezy")
async def webhook_lemonsqueezy(request: Request):
    raw = await request.body()
    if not payments.verify_lemonsqueezy(raw, request.headers.get("X-Signature")):
        raise HTTPException(400, "Invalid signature.")
    try:
        event = json.loads(raw.decode())
    except json.JSONDecodeError:
        raise HTTPException(400, "Invalid JSON.")
    name, email, ref = payments.extract_lemonsqueezy(event)
    if name in payments.LEMONSQUEEZY_PAID_EVENTS:
        payments.fulfill_purchase(email, "lemonsqueezy", ref)
        return {"ok": True, "recorded": True}
    return {"ok": True, "recorded": False, "event": name}


@app.post("/api/webhooks/stripe")
async def webhook_stripe(request: Request):
    raw = await request.body()
    if not payments.verify_stripe(raw, request.headers.get("Stripe-Signature")):
        raise HTTPException(400, "Invalid signature.")
    try:
        event = json.loads(raw.decode())
    except json.JSONDecodeError:
        raise HTTPException(400, "Invalid JSON.")
    etype, email, ref = payments.extract_stripe(event)
    if etype in payments.STRIPE_PAID_EVENTS:
        payments.fulfill_purchase(email, "stripe", ref)
        return {"received": True, "recorded": True}
    return {"received": True, "recorded": False, "event": etype}


# ---------------------------------------------------------------------------
# serve the SPA (must be registered last)
# ---------------------------------------------------------------------------

if os.path.isdir(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")),
              name="assets")

    @app.get("/")
    def _index():
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

    @app.get("/{full_path:path}")
    def _spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(404, "Not found")
        candidate = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
