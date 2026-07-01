"""Tests for the Vs. Random test."""
import numpy as np

from engine import vsrandom


def test_strong_edge_beats_random():
    rng = np.random.default_rng(0)
    r = 0.004 + rng.normal(0, 0.006, size=300)  # high, real Sharpe
    out = vsrandom.vs_random(r, periods_per_year=252, n_random=800)
    assert out["available"] is True
    assert out["status"] == "pass"
    assert out["p_value"] < 0.05
    assert out["real_sharpe"] > 0


def test_no_edge_looks_random():
    rng = np.random.default_rng(1)
    r = rng.normal(0.0, 0.01, size=300)  # zero-edge -> indistinguishable
    out = vsrandom.vs_random(r, periods_per_year=252, n_random=800)
    assert out["available"] is True
    # a zero-edge series should NOT clear the random field
    assert out["status"] in ("warn", "fail")
    assert out["p_value"] > 0.05


def test_p_value_and_beat_pct_consistent():
    rng = np.random.default_rng(2)
    r = 0.002 + rng.normal(0, 0.01, size=200)
    out = vsrandom.vs_random(r, periods_per_year=252, n_random=500)
    assert 0.0 <= out["p_value"] <= 1.0
    assert abs((out["p_value"] + out["beat_pct"]) - 1.0) < 1e-9
    assert out["best_random_sharpe"] >= 0  # best of a zero-mean field is positive


def test_too_short_unavailable():
    out = vsrandom.vs_random(np.random.default_rng(3).normal(0, 0.01, 10), 252)
    assert out["available"] is False


def test_run_analysis_gates_vs_random():
    import analysis
    rng = np.random.default_rng(4)
    r = 0.002 + rng.normal(0, 0.01, size=250)
    pro = analysis.run_analysis(returns=r, frequency="daily", tier="pro")
    assert pro["vs_random"] is not None
    assert pro["vs_random"]["available"] is True
    assert "vs_random" in pro["gating"]["paid_features"]
    free = analysis.run_analysis(returns=r, frequency="daily", tier="free")
    assert free["vs_random"] is None
    assert "vs_random" in free["gating"]["locked"]
