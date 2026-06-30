"""Tests for the Monte-Carlo-derived risk of ruin."""
import numpy as np

from engine import ruin


def test_high_ruin_flagged():
    # most paths fall 60% from peak -> high risk of ruin
    dd = np.array([-0.6] * 80 + [-0.1] * 20, dtype=float)
    fin = np.array([-0.3] * 60 + [0.2] * 40, dtype=float)
    out = ruin.risk_of_ruin(dd, fin)
    assert out["available"] is True
    assert out["status"] == "fail"
    assert out["prob_ruin"] == 0.8
    assert out["prob_loss"] == 0.6


def test_low_ruin_passes():
    dd = np.array([-0.05] * 95 + [-0.2] * 5, dtype=float)
    fin = np.array([0.1] * 100, dtype=float)
    out = ruin.risk_of_ruin(dd, fin)
    assert out["status"] == "pass"
    assert out["prob_ruin"] == 0.0
    assert out["prob_loss"] == 0.0


def test_levels_monotonic_and_worst_case():
    rng = np.random.default_rng(0)
    dd = -np.abs(rng.normal(0.3, 0.2, size=2000))
    fin = rng.normal(0.1, 0.4, size=2000)
    out = ruin.risk_of_ruin(dd, fin)
    probs = [lv["prob"] for lv in out["levels"]]
    assert probs == sorted(probs, reverse=True)  # deeper DD -> rarer
    # worst-case (5th pct) is at least as deep as the median
    assert out["worst_case_drawdown"] <= out["median_drawdown"]


def test_empty_unavailable():
    out = ruin.risk_of_ruin([], [])
    assert out["available"] is False


def test_run_analysis_gates_risk_of_ruin():
    import analysis
    rng = np.random.default_rng(1)
    r = rng.normal(0.001, 0.02, size=300)

    pro = analysis.run_analysis(returns=r, frequency="daily", tier="pro")
    assert pro["risk_of_ruin"] is not None
    assert pro["risk_of_ruin"]["available"] is True
    assert "risk_of_ruin" in pro["gating"]["paid_features"]
    assert pro["gating"]["locked"] == []

    free = analysis.run_analysis(returns=r, frequency="daily", tier="free")
    assert free["risk_of_ruin"] is None
    assert "risk_of_ruin" in free["gating"]["locked"]
