"""Unit tests for the validation engine.

The Sharpe-family tests pin results against hand-checked numeric values so a
formula regression is caught immediately.
"""
import math

import numpy as np
import pytest

from engine import stats, distribution, sharpe, overfit, montecarlo, benchmark, verdict


# ---------------------------------------------------------------------------
# stats
# ---------------------------------------------------------------------------

def test_equity_roundtrip():
    r = np.array([0.01, -0.02, 0.03, 0.005])
    eq = stats.equity_curve(r)
    assert eq[0] == 1.0
    back = stats.returns_from_equity(eq)
    np.testing.assert_allclose(back, r, rtol=1e-12)


def test_total_return_and_cagr():
    r = np.array([0.1, 0.1])  # 1.1 * 1.1 = 1.21
    assert stats.total_return(r) == pytest.approx(0.21)
    # 2 periods, 1 per year -> 2 years; CAGR = 1.21^(1/2)-1 = 0.1
    assert stats.cagr(r, periods_per_year=1) == pytest.approx(0.1, abs=1e-9)


def test_max_drawdown_known():
    # equity: 1 -> 1.5 -> 0.75 (50% dd) -> 0.9
    r = np.array([0.5, -0.5, 0.2])
    assert stats.max_drawdown(r) == pytest.approx(-0.5, abs=1e-9)


def test_sharpe_annualization_relationship():
    r = np.random.default_rng(0).normal(0.001, 0.01, 500)
    pp = stats.sharpe_per_period(r)
    ann = stats.sharpe_annualized(r, 252)
    assert ann == pytest.approx(pp * math.sqrt(252), rel=1e-12)


def test_trade_stats():
    pnl = np.array([100.0, -50.0, 200.0, -50.0])
    ts = stats.trade_stats(pnl)
    assert ts["num_trades"] == 4
    assert ts["win_rate"] == pytest.approx(0.5)
    assert ts["profit_factor"] == pytest.approx(300 / 100)
    assert ts["expectancy"] == pytest.approx(50.0)


# ---------------------------------------------------------------------------
# distribution
# ---------------------------------------------------------------------------

def test_normal_kurtosis_is_three():
    r = np.random.default_rng(1).normal(0, 1, 50000)
    assert distribution.kurtosis_nonexcess(r) == pytest.approx(3.0, abs=0.1)
    assert abs(distribution.skewness(r)) < 0.1


def test_autocorr_adjusted_sharpe_penalizes_positive_autocorr():
    # AR(1) series with strong positive autocorrelation.
    rng = np.random.default_rng(2)
    n = 2000
    e = rng.normal(0, 0.01, n)
    r = np.zeros(n)
    for i in range(1, n):
        r[i] = 0.6 * r[i - 1] + e[i]
    r += 0.004  # clear positive drift so the Sharpe is positive
    adj = distribution.autocorr_adjusted_sharpe(r, 252)
    # Positive autocorrelation should shrink the honest annualized Sharpe.
    assert adj["adjustment_factor"] < 1.0
    assert abs(adj["adjusted_annualized"]) < abs(adj["naive_annualized"])
    assert adj["adjusted_annualized"] < adj["naive_annualized"]


# ---------------------------------------------------------------------------
# sharpe family -- hand-checked constants
# ---------------------------------------------------------------------------

def test_psr_hand_checked():
    # SR=0.1, n=101, normal -> PSR == 0.8407413...
    val = sharpe.probabilistic_sharpe_ratio(0.1, 101, g3=0.0, g4=3.0, sr_benchmark=0.0)
    assert val == pytest.approx(0.8407413278, abs=1e-6)


def test_mintrl_hand_checked():
    val = sharpe.min_track_record_length(0.1, g3=0.0, g4=3.0, sr_benchmark=0.0,
                                         confidence=0.95)
    assert val == pytest.approx(272.907117, abs=1e-3)


def test_mintrl_infinite_when_no_edge():
    assert math.isinf(sharpe.min_track_record_length(0.0, 0.0, 3.0, sr_benchmark=0.0))
    assert math.isinf(sharpe.min_track_record_length(-0.1, 0.0, 3.0, sr_benchmark=0.0))


def test_expected_max_sharpe_hand_checked():
    val = sharpe.expected_max_sharpe(n_trials=10, variance_sr=1.0)
    assert val == pytest.approx(1.5745983, abs=1e-5)


def test_expected_max_sharpe_single_trial_is_zero():
    assert sharpe.expected_max_sharpe(1, 1.0) == 0.0


def test_dsr_equals_psr_for_single_trial():
    sr, n, g3, g4 = 0.12, 200, 0.0, 3.0
    psr = sharpe.probabilistic_sharpe_ratio(sr, n, g3, g4, 0.0)
    dsr = sharpe.deflated_sharpe_ratio(sr, n, g3, g4, n_trials=1)
    assert dsr["dsr"] == pytest.approx(psr, abs=1e-9)


def test_dsr_drops_with_more_trials():
    sr, n, g3, g4 = 0.12, 200, 0.0, 3.0
    d1 = sharpe.deflated_sharpe_ratio(sr, n, g3, g4, n_trials=1)["dsr"]
    d50 = sharpe.deflated_sharpe_ratio(sr, n, g3, g4, n_trials=50)["dsr"]
    assert d50 < d1


def test_haircut_increases_with_trials():
    h1 = sharpe.haircut_sharpe(0.15, 200, n_trials=1)["haircut"]
    h100 = sharpe.haircut_sharpe(0.15, 200, n_trials=100)["haircut"]
    assert 0.0 <= h1 <= h100 <= 1.0


# ---------------------------------------------------------------------------
# overfit
# ---------------------------------------------------------------------------

def test_split_sample_detects_collapse():
    rng = np.random.default_rng(3)
    good = rng.normal(0.002, 0.008, 252)
    bad = rng.normal(-0.004, 0.010, 252)
    r = np.concatenate([good, bad])
    res = overfit.in_out_sample_split(r, 252)
    assert res["in_sample"]["sharpe_annualized"] > 0
    assert res["out_of_sample"]["sharpe_annualized"] < 0
    assert res["overfit_flag"] is True


def test_pbo_runs_and_bounds():
    rng = np.random.default_rng(4)
    r = rng.normal(0.0005, 0.01, 400)
    res = overfit.pbo_single_series(r, n_chunks=8)
    assert res["pbo"] is None or 0.0 <= res["pbo"] <= 1.0
    assert res["approximation"] is True


# ---------------------------------------------------------------------------
# monte carlo
# ---------------------------------------------------------------------------

def test_monte_carlo_percentiles_in_range():
    rng = np.random.default_rng(5)
    r = rng.normal(0.0005, 0.01, 300)
    res = montecarlo.monte_carlo(r, n_sims=500, method="reshuffle")
    assert 0 <= res["final_return_percentile"] <= 100
    assert len(res["cone"]["p50"]) == len(res["cone"]["x"])
    # Reshuffling preserves the set of returns -> identical final return.
    assert res["final_return_distribution"]["mean"] == pytest.approx(
        res["actual_final_return"], rel=1e-6
    )


# ---------------------------------------------------------------------------
# benchmark
# ---------------------------------------------------------------------------

def test_benchmark_flat_assumption():
    r = np.array([0.01] * 50)
    res = benchmark.compare_to_benchmark(r, 252, benchmark_returns=None,
                                         flat_annual_return=0.0)
    assert res["assumed_flat_benchmark"] is True
    assert res["beats_benchmark_return"] is True


# ---------------------------------------------------------------------------
# verdict (integration via sample data)
# ---------------------------------------------------------------------------

def _verdict_for(returns, n_trials, bench_returns=None):
    ppy = 252
    s = sharpe.sharpe_diagnostics(returns, ppy, n_trials=n_trials)
    o = overfit.overfit_diagnostics(returns, ppy)
    b = benchmark.compare_to_benchmark(returns, ppy, bench_returns)
    return verdict.build_verdict(sharpe=s, overfit=o, benchmark=b,
                                 n_observations=len(returns))


def test_overfit_sample_is_red():
    from sample_data import _overfit_returns
    v = _verdict_for(_overfit_returns(), n_trials=50)
    assert v["level"] == "red"


def test_robust_sample_is_green():
    from sample_data import _robust_returns
    v = _verdict_for(_robust_returns(), n_trials=2)
    assert v["level"] == "green"


def test_too_few_observations_is_yellow():
    rng = np.random.default_rng(6)
    r = rng.normal(0.001, 0.01, 20)
    v = _verdict_for(r, n_trials=1)
    assert v["level"] == "yellow"
