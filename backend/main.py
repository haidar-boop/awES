"""FastAPI app: analysis + report + sample + licensing/payment endpoints,
and serves the SPA.

Tier enforcement is server-side: clients send a license *key* (never a tier),
and the server decides Pro vs Free by verifying the key. See ``licensing`` and
``payments``.

Single-service friendly: in production it serves the built React app from
``frontend/dist`` so the whole thing deploys as one process.
"""
from __future__ import annotations

import json
import os

import numpy as np
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

import analysis as analysis_mod
import licensing
import parsing
import payments
import report as report_mod
import sample_data

app = FastAPI(title="Backtest Reality Check", version="1.1.0")

# CORS for local dev (Vite on :5173 hitting API on :8000).
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
    value_type: str = "auto"          # auto | returns | equity
    is_percentage: str | bool = "auto"
    data_kind: str = "auto"           # auto | timeseries | trades
    num_trials: int = 1
    confidence: float = 0.95
    benchmark: str | None = None
    benchmark_returns: list[float] | None = None
    flat_annual_return: float = 0.0
    # Tier is NEVER taken from the client; it is resolved from this key.
    license_key: str | None = None


class ReportRequest(BaseModel):
    analysis: dict
    license_key: str | None = None


class VerifyRequest(BaseModel):
    key: str | None = None


class ClaimRequest(BaseModel):
    email: str | None = None


class IssueRequest(BaseModel):
    tier: str = "pro"
    days: int | None = None
    email: str | None = None
    note: str | None = None


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def _resolve_returns(req: AnalyzeRequest):
    """Return (returns_array, pnl_or_None, value_type, parse_meta)."""
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


def _tier_from(header_key: str | None, body_key: str | None) -> tuple[str, dict]:
    """Resolve the tier from a license key (header takes precedence)."""
    return licensing.resolve_tier(header_key or body_key)


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "backtest-reality-check"}


@app.get("/api/config")
def config():
    """Non-secret config for the frontend (checkout link, pro features)."""
    cfg = payments.public_config()
    cfg["paid_features"] = analysis_mod.PAID_FEATURES
    return cfg


@app.get("/api/samples")
def samples():
    return {"samples": sample_data.list_samples()}


@app.get("/api/sample")
def sample(name: str = "overfit", analyze: bool = True):
    """Return a sample dataset, optionally with a full analysis.

    Samples are a public demo of the full product, so they always return the
    Pro analysis -- there's no user data to gate here.
    """
    try:
        s = sample_data.get_sample(name)
    except KeyError as e:
        raise HTTPException(404, str(e))
    payload = {
        "key": name,
        "name": s["name"],
        "description": s["description"],
        "frequency": s["frequency"],
        "value_type": s["value_type"],
        "num_trials": s["num_trials"],
        "confidence": s["confidence"],
        "expected_verdict": s["expected_verdict"],
        "returns": s["returns"],
        "benchmark_returns": s["benchmark_returns"],
        "csv": s["csv"],
    }
    if analyze:
        payload["analysis"] = analysis_mod.run_analysis(
            returns=np.asarray(s["returns"], dtype=float),
            frequency=s["frequency"],
            num_trials=s["num_trials"],
            confidence=s["confidence"],
            value_type=s["value_type"],
            benchmark_returns=np.asarray(s["benchmark_returns"], dtype=float),
            tier="pro",
            parse_meta={"n": len(s["returns"]), "value_type": "returns",
                        "data_kind": "timeseries", "conversions": [],
                        "warnings": []},
        )
    return payload


@app.post("/api/analyze")
def analyze(req: AnalyzeRequest, x_license_key: str | None = Header(default=None)):
    returns, pnl, value_type, parse_meta = _resolve_returns(req)
    if len(returns) < 2:
        raise HTTPException(400, "Need at least 2 observations to analyze.")
    benchmark_returns = _resolve_benchmark(req)
    tier, _info = _tier_from(x_license_key, req.license_key)
    try:
        result = analysis_mod.run_analysis(
            returns=returns,
            frequency=req.frequency,
            num_trials=max(1, int(req.num_trials)),
            confidence=float(req.confidence),
            value_type=value_type,
            pnl=pnl,
            benchmark_returns=benchmark_returns,
            flat_annual_return=req.flat_annual_return,
            tier=tier,
            parse_meta=parse_meta,
        )
    except Exception as e:  # surface clean errors to the UI
        raise HTTPException(400, f"Analysis failed: {e}")
    return result


@app.post("/api/report")
def report(req: ReportRequest, x_license_key: str | None = Header(default=None)):
    # The PDF report is a Pro feature -- enforce it here, server-side.
    tier, _info = _tier_from(x_license_key, req.license_key)
    if tier != "pro":
        raise HTTPException(
            402, "The PDF report is a Pro feature. Unlock Pro to download it."
        )
    if not req.analysis or "verdict" not in req.analysis:
        raise HTTPException(400, "Body must contain a full 'analysis' object.")
    try:
        pdf = report_mod.build_pdf(req.analysis)
    except Exception as e:
        raise HTTPException(500, f"Report generation failed: {e}")
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition":
                 "attachment; filename=backtest-reality-check.pdf"},
    )


# ---------------------------------------------------------------------------
# licensing
# ---------------------------------------------------------------------------

@app.post("/api/license/verify")
def license_verify(req: VerifyRequest):
    """Check a license key (used by the UI to confirm a stored Pro credential)."""
    info = licensing.verify_license(req.key)
    return {
        "valid": bool(info.get("valid")),
        "tier": info.get("tier", "free"),
        "expires": info.get("expires", 0),
        "reason": info.get("reason"),
    }


@app.post("/api/license/claim")
def license_claim(req: ClaimRequest):
    """Unlock Pro by email after payment — no key to copy/paste.

    Looks up a completed purchase for the email (webhook store first, then the
    Lemon Squeezy API as a durable fallback) and returns a signed key the
    browser stores transparently.
    """
    email = (req.email or "").strip()
    if "@" not in email or "." not in email:
        raise HTTPException(400, "Please enter a valid email address.")
    key = payments.claim_license(email)
    if not key:
        raise HTTPException(
            404,
            "We couldn't find a completed purchase for that email yet. If you "
            "just paid, give it a few seconds — this page checks automatically.",
        )
    return {"key": key, "tier": "pro"}


@app.post("/api/license/issue")
def license_issue(req: IssueRequest, x_admin_token: str | None = Header(default=None)):
    """Mint a license key manually. Guarded by ADMIN_TOKEN (for comps/testing)."""
    admin = os.environ.get("ADMIN_TOKEN")
    if not admin:
        raise HTTPException(403, "Manual issuance disabled (ADMIN_TOKEN not set).")
    if not x_admin_token or not _consteq(x_admin_token, admin):
        raise HTTPException(401, "Invalid admin token.")
    key = licensing.issue_license(
        tier=req.tier, days=req.days, email=req.email, note=req.note or "manual"
    )
    return {"key": key, "tier": req.tier, "days": req.days}


def _consteq(a: str, b: str) -> bool:
    import hmac
    return hmac.compare_digest(a, b)


# ---------------------------------------------------------------------------
# payment webhooks (verified by provider signature, then mint a license)
# ---------------------------------------------------------------------------

@app.post("/api/webhooks/lemonsqueezy")
async def webhook_lemonsqueezy(request: Request):
    raw = await request.body()
    sig = request.headers.get("X-Signature")
    if not payments.verify_lemonsqueezy(raw, sig):
        raise HTTPException(400, "Invalid signature.")
    try:
        event = json.loads(raw.decode())
    except json.JSONDecodeError:
        raise HTTPException(400, "Invalid JSON.")
    name, email, ref = payments.extract_lemonsqueezy(event)
    if name in payments.LEMONSQUEEZY_PAID_EVENTS:
        payments.fulfill_purchase(email, "lemonsqueezy", ref)
        return {"ok": True, "issued": True}
    return {"ok": True, "issued": False, "event": name}


@app.post("/api/webhooks/stripe")
async def webhook_stripe(request: Request):
    raw = await request.body()
    sig = request.headers.get("Stripe-Signature")
    if not payments.verify_stripe(raw, sig):
        raise HTTPException(400, "Invalid signature.")
    try:
        event = json.loads(raw.decode())
    except json.JSONDecodeError:
        raise HTTPException(400, "Invalid JSON.")
    etype, email, ref = payments.extract_stripe(event)
    if etype in payments.STRIPE_PAID_EVENTS:
        payments.fulfill_purchase(email, "stripe", ref)
        return {"received": True, "issued": True}
    return {"received": True, "issued": False, "event": etype}


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
        # API 404s should stay JSON; everything else falls back to the SPA.
        if full_path.startswith("api/"):
            raise HTTPException(404, "Not found")
        candidate = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
