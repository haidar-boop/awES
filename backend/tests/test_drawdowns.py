"""Tests for drawdown recovery analytics."""
import numpy as np

from engine import drawdowns


def test_recovered_drawdown():
    # up, down (drawdown), back up to a new high (recovery)
    r = np.array([0.10, 0.10, -0.10, -0.10, 0.10, 0.10, 0.10], dtype=float)
    out = drawdowns.drawdown_analysis(r, unit="periods")
    assert out["available"] is True
    assert out["max_drawdown"] < 0
    assert out["max_recovered"] is True
    assert out["currently_underwater"] is False
    assert out["max_recovery"] is not None and out["max_recovery"] > 0


def test_unrecovered_drawdown_currently_underwater():
    # climbs, then falls and never recovers by the end
    r = np.array([0.10, 0.10, 0.10, -0.05, -0.05, -0.05, -0.05], dtype=float)
    out = drawdowns.drawdown_analysis(r, unit="trades")
    assert out["currently_underwater"] is True
    assert out["max_recovered"] is False
    assert out["max_recovery"] is None
    assert out["current_depth"] < 0
    assert "not recovered" in out["message"]
    assert out["unit"] == "trades"


def test_no_drawdown_when_monotonic():
    r = np.array([0.01] * 20, dtype=float)
    out = drawdowns.drawdown_analysis(r)
    assert out["available"] is True
    assert out["status"] == "pass"
    assert out["currently_underwater"] is False
    assert out["max_drawdown"] == 0.0


def test_time_underwater_fraction():
    r = np.array([0.10, -0.05, -0.05, 0.20, -0.02, 0.05], dtype=float)
    out = drawdowns.drawdown_analysis(r)
    assert 0.0 < out["time_underwater"] <= 1.0
    assert out["longest_underwater"] >= 1
    assert len(out["episodes"]) >= 1


def test_run_analysis_gates_drawdown_recovery():
    import analysis
    rng = np.random.default_rng(3)
    r = rng.normal(0.001, 0.02, size=200)
    pro = analysis.run_analysis(returns=r, frequency="daily", tier="pro")
    assert pro["drawdown_recovery"]["available"] is True
    free = analysis.run_analysis(returns=r, frequency="daily", tier="free")
    assert free["drawdown_recovery"] is None
    assert free["gating"]["verdict_only"] is True
