"""FastAPI app: analysis + report + sample endpoints, and serves the SPA.

Single-service friendly: in production it serves the built React app from
``frontend/dist`` so the whole thing deploys as one process.
"""
from __future__ import annotations

import os

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

import analysis as analysis_mod
import parsing
import report as report_mod
import sample_data

app = FastAPI(title="Backtest Reality Check", version="1.0.0")

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
    tier: str = "pro"


class ReportRequest(BaseModel):
    analysis: dict


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


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "backtest-reality-check"}


@app.get("/api/samples")
def samples():
    return {"samples": sample_data.list_samples()}


@app.get("/api/sample")
def sample(name: str = "overfit", analyze: bool = True):
    """Return a sample dataset, optionally with a full analysis."""
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
def analyze(req: AnalyzeRequest):
    returns, pnl, value_type, parse_meta = _resolve_returns(req)
    if len(returns) < 2:
        raise HTTPException(400, "Need at least 2 observations to analyze.")
    benchmark_returns = _resolve_benchmark(req)
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
            tier=req.tier,
            parse_meta=parse_meta,
        )
    except Exception as e:  # surface clean errors to the UI
        raise HTTPException(400, f"Analysis failed: {e}")
    return result


@app.post("/api/report")
def report(req: ReportRequest):
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
