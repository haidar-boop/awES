"""Tests for the trade-dependency / concentration check."""
import numpy as np

from engine import dependency as dep


def test_concentrated_edge_fails():
    # 35 small losers + 5 big winners: the whole edge rests on a few trades.
    r = np.array([-0.01] * 35 + [0.10] * 5, dtype=float)
    out = dep.trade_dependency(r, unit="trades")
    assert out["applicable"] is True
    assert out["status"] == "fail"
    assert out["survives"] is False
    # all gross profit comes from the winners
    assert out["best_trade_share"] is not None
    # removing the top trades wipes out profitability
    assert out["total_return_without"] < 0
    assert "depends on a handful" in out["message"]


def test_well_spread_edge_passes():
    rng = np.random.default_rng(0)
    r = 0.01 + rng.normal(0, 0.001, size=60)  # consistently, evenly positive
    out = dep.trade_dependency(r, unit="trades")
    assert out["applicable"] is True
    assert out["status"] == "pass"
    assert out["survives"] is True
    assert out["profit_share_top"] < 0.3


def test_not_profitable_is_not_applicable():
    r = np.array([-0.01] * 30, dtype=float)
    out = dep.trade_dependency(r)
    assert out["applicable"] is False
    assert out["status"] == "info"
    assert "net profitable" in out["message"]


def test_too_few_trades():
    out = dep.trade_dependency(np.array([0.01, 0.02, -0.01]), unit="trades")
    assert out["applicable"] is False
    assert "Too few" in out["message"]


def test_profit_share_increases_with_k():
    r = np.array([-0.005] * 30 + [0.02, 0.05, 0.08, 0.12, 0.2], dtype=float)
    out = dep.trade_dependency(r)
    shares = [lv["profit_share"] for lv in out["levels"]]
    assert shares == sorted(shares)  # more trades removed -> larger share
    assert all(0.0 <= s <= 1.0 + 1e-9 for s in shares)


def test_unit_label_flows_through():
    r = np.array([-0.01] * 35 + [0.10] * 5, dtype=float)
    out = dep.trade_dependency(r, unit="periods")
    assert out["unit"] == "periods"
    assert "periods" in out["message"]


def test_run_analysis_includes_dependency_free_tier():
    import analysis
    r = np.array([-0.01] * 35 + [0.10] * 5, dtype=float)
    result = analysis.run_analysis(
        returns=r, frequency="per_trade", tier="free",
        parse_meta={"data_kind": "trades"},
    )
    td = result["trade_dependency"]
    assert td["applicable"] is True
    assert td["unit"] == "trades"
    assert td["status"] in ("fail", "warn")
    # stays available on the free tier (it's a core honesty hook, not gated)
    assert td not in (None, {})
