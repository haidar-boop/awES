"""Tests for the validation plan."""
import numpy as np

from engine import plan


def _kw(**over):
    base = dict(
        stats={}, sharpe={"psr": 0.99, "extra_periods_needed": 0, "dsr": {"dsr": 0.9}},
        overfit={"split_sample": {"overfit_flag": False}, "pbo": {"pbo": 0.1}},
        benchmark={"beats_benchmark": True},
        trade_dependency={"applicable": True, "status": "pass"},
        risk_of_ruin={"available": True, "status": "pass", "prob_ruin": 0.0, "ruin_level": 0.5},
        walk_forward={"available": True, "status": "pass", "early_sharpe": 1.5, "late_sharpe": 1.4},
        skip_trades={"available": True, "status": "pass", "unit": "trades", "headline_prob_profitable": 1.0},
        vs_random={"available": True, "status": "pass", "p_value": 0.01},
        num_trials=5, n=300,
    )
    base.update(over)
    return base


def test_healthy_strategy_has_no_critical():
    out = plan.build_plan(**_kw())
    assert out["available"] is True
    assert out["counts"]["critical"] == 0
    assert any(i["severity"] == "strength" for i in out["items"])
    # always ends with a 'before going live' step
    assert any("Before going live" in i["title"] for i in out["items"])


def test_overfit_strategy_flags_criticals():
    out = plan.build_plan(**_kw(
        sharpe={"psr": 0.4, "extra_periods_needed": 500, "dsr": {"dsr": 0.02}},
        overfit={"split_sample": {"overfit_flag": True,
                                  "in_sample": {"sharpe_annualized": 3.0},
                                  "out_of_sample": {"sharpe_annualized": -1.0}},
                 "pbo": {"pbo": 0.7}},
        benchmark={"beats_benchmark": False},
        trade_dependency={"applicable": True, "status": "fail",
                          "headline_k": 3, "unit": "trades", "profit_share_top": 0.8},
        walk_forward={"available": True, "status": "fail", "early_sharpe": 3.0, "late_sharpe": -1.0},
        vs_random={"available": True, "status": "fail", "p_value": 0.4},
        num_trials=1, n=40,
    ))
    assert out["counts"]["critical"] >= 3
    titles = [i["title"] for i in out["items"]]
    assert "Deflation risk" in titles
    assert "Fix out-of-sample decay" in titles
    assert "Edge rests on a few trades" in titles
    # no 'strength' items when criticals exist
    assert not any(i["severity"] == "strength" for i in out["items"])
    # ordered: criticals first
    sevs = [i["severity"] for i in out["items"]]
    assert sevs == sorted(sevs, key=lambda s: {"critical": 0, "important": 1, "minor": 2, "strength": 3}[s])


def test_small_sample_is_critical():
    out = plan.build_plan(**_kw(n=15))
    assert any(i["title"] == "Collect more data" and i["severity"] == "critical" for i in out["items"])


def test_run_analysis_gates_plan():
    import analysis
    rng = np.random.default_rng(0)
    r = 0.001 + rng.normal(0, 0.01, size=250)
    pro = analysis.run_analysis(returns=r, frequency="daily", tier="pro")
    assert pro["validation_plan"]["available"] is True
    assert "validation_plan" in pro["gating"]["paid_features"]
    free = analysis.run_analysis(returns=r, frequency="daily", tier="free")
    assert free["validation_plan"] is None
    assert "validation_plan" in free["gating"]["locked"]
