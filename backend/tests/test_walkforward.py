"""Tests for walk-forward (rolling out-of-sample) consistency."""
import numpy as np

from engine import walkforward


def test_consistent_edge_passes():
    rng = np.random.default_rng(0)
    r = 0.003 + rng.normal(0, 0.006, size=300)  # strong, steady positive drift
    out = walkforward.walk_forward(r, periods_per_year=252)
    assert out["available"] is True
    assert out["status"] == "pass"
    assert out["positive_folds"] == out["n_folds"]
    assert not out["degrading"]


def test_decaying_edge_fails():
    # strong early, then it dies and loses in the back half -> overfit signature
    rng = np.random.default_rng(7)
    early = 0.01 + rng.normal(0, 0.004, size=120)
    late = -0.008 + rng.normal(0, 0.004, size=120)
    r = np.concatenate([early, late])
    out = walkforward.walk_forward(r, periods_per_year=252)
    assert out["available"] is True
    assert out["status"] == "fail"
    assert out["late_sharpe"] < out["early_sharpe"]
    assert "decays" in out["message"]


def test_too_short_unavailable():
    out = walkforward.walk_forward(np.random.default_rng(1).normal(0, 0.01, size=30), 252)
    assert out["available"] is False


def test_fold_windows_tile_the_series():
    rng = np.random.default_rng(2)
    r = rng.normal(0.0005, 0.01, size=200)
    out = walkforward.walk_forward(r, 252)
    folds = out["folds"]
    assert folds[0]["start"] == 0
    assert folds[-1]["end"] == 200
    # contiguous, non-overlapping
    for a, b in zip(folds, folds[1:]):
        assert a["end"] == b["start"]
    assert sum(f["n"] for f in folds) == 200


def test_run_analysis_includes_walk_forward_free():
    import analysis
    rng = np.random.default_rng(3)
    r = rng.normal(0.001, 0.02, size=250)
    result = analysis.run_analysis(returns=r, frequency="daily", tier="free")
    wf = result["walk_forward"]
    assert wf["available"] is True
    assert "walk_forward" not in result["gating"]["locked"]
