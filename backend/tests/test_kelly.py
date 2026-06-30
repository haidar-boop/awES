"""Tests for Kelly position sizing."""
import numpy as np
import pytest

from engine import kelly


def test_positive_edge_sizing():
    rng = np.random.default_rng(0)
    r = rng.normal(0.001, 0.01, size=400)  # small positive edge
    out = kelly.kelly_sizing(r, periods_per_year=252)
    assert out["available"] is True
    assert out["positive_edge"] is True
    mu, var = float(np.mean(r)), float(np.var(r, ddof=1))
    assert out["full_kelly_leverage"] == pytest.approx(mu / var, rel=1e-6)
    assert len(out["levels"]) == 4
    # fractional leverage scales linearly
    full = next(l for l in out["levels"] if l["name"] == "Full")["leverage"]
    quarter = next(l for l in out["levels"] if l["name"] == "Quarter")["leverage"]
    assert quarter == pytest.approx(0.25 * full)
    # full-Kelly annual vol == annualised Sharpe (mean/sigma*sqrt(ppy))
    sigma = float(np.std(r, ddof=1))
    full_vol = next(l for l in out["levels"] if l["name"] == "Full")["annual_volatility"]
    assert full_vol == pytest.approx((mu / sigma) * np.sqrt(252), rel=1e-6)


def test_negative_edge_says_do_not_trade():
    rng = np.random.default_rng(1)
    r = rng.normal(-0.001, 0.01, size=300)
    out = kelly.kelly_sizing(r, periods_per_year=252)
    assert out["available"] is True
    assert out["positive_edge"] is False
    assert out["status"] == "fail"
    assert "don't" in out["message"].lower()
    assert out["levels"] == []


def test_zero_variance_unavailable():
    out = kelly.kelly_sizing(np.array([0.01] * 20), periods_per_year=252)
    assert out["available"] is False


def test_too_few_unavailable():
    out = kelly.kelly_sizing(np.array([0.01, 0.02, -0.01]), periods_per_year=252)
    assert out["available"] is False


def test_run_analysis_gates_position_sizing():
    import analysis
    rng = np.random.default_rng(2)
    r = rng.normal(0.001, 0.02, size=300)

    pro = analysis.run_analysis(returns=r, frequency="daily", tier="pro")
    assert pro["position_sizing"] is not None
    assert pro["position_sizing"]["available"] is True
    assert "position_sizing" in pro["gating"]["paid_features"]

    free = analysis.run_analysis(returns=r, frequency="daily", tier="free")
    assert free["position_sizing"] is None
    assert "position_sizing" in free["gating"]["locked"]
