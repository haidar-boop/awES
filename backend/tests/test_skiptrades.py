"""Tests for missed-trade (skip-trades) robustness."""
import numpy as np

from engine import skiptrades


def test_robust_strategy_survives_skips():
    # consistently positive: dropping a few trades barely matters
    rng = np.random.default_rng(0)
    r = 0.01 + np.abs(rng.normal(0, 0.002, size=200))
    out = skiptrades.skip_trades_robustness(r, n_sims=300)
    assert out["available"] is True
    assert out["status"] == "pass"
    assert out["headline_prob_profitable"] > 0.9


def test_fragile_strategy_flagged():
    # the whole edge rests on ONE dominant trade: ~10% of the time the random
    # 10% skip drops it and the strategy turns unprofitable.
    r = np.array([-0.005] * 99 + [2.0], dtype=float)
    out = skiptrades.skip_trades_robustness(r, n_sims=500)
    assert out["available"] is True
    assert out["baseline_return"] > 0
    # clearly sensitive to missed trades (not a rock-solid ~100%)
    assert out["headline_prob_profitable"] < 0.95


def test_not_profitable_not_applicable():
    r = np.array([-0.01] * 50, dtype=float)
    out = skiptrades.skip_trades_robustness(r)
    assert out["available"] is False
    assert "net profitable" in out["message"]


def test_too_few_not_applicable():
    out = skiptrades.skip_trades_robustness(np.array([0.01, 0.02, -0.01]))
    assert out["available"] is False


def test_levels_present_and_bounded():
    rng = np.random.default_rng(1)
    r = rng.normal(0.002, 0.01, size=150)
    out = skiptrades.skip_trades_robustness(r, n_sims=200)
    if out["available"]:
        for lv in out["levels"]:
            assert 0.0 <= lv["prob_profitable"] <= 1.0
            assert lv["k"] >= 1


def test_run_analysis_gates_skip_trades():
    import analysis
    rng = np.random.default_rng(2)
    r = rng.normal(0.002, 0.01, size=200)
    pro = analysis.run_analysis(returns=r, frequency="daily", tier="pro")
    assert pro["skip_trades"] is not None
    assert "skip_trades" in pro["gating"]["paid_features"]
    free = analysis.run_analysis(returns=r, frequency="daily", tier="free")
    assert free["skip_trades"] is None
    assert "skip_trades" in free["gating"]["locked"]
