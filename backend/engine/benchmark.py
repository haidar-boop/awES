"""Benchmark comparison: does the strategy actually beat buy-and-hold?

Many strategies clear every statistical test and still fail the simplest
gut-check: you'd have made more money just holding the asset. We surface that
prominently.
"""
from __future__ import annotations

import numpy as np

from .stats import (
    total_return,
    cagr,
    sharpe_annualized,
    max_drawdown,
    equity_curve,
)


def compare_to_benchmark(
    returns: np.ndarray,
    periods_per_year: float,
    benchmark_returns: np.ndarray | None = None,
    flat_annual_return: float = 0.0,
) -> dict:
    """Compare the strategy against a benchmark return series.

    If ``benchmark_returns`` is None we synthesise a flat buy-and-hold proxy
    earning ``flat_annual_return`` per year (default 0%), and clearly label it
    as an assumption.
    """
    returns = np.asarray(returns, dtype=float)
    n = len(returns)

    assumed = False
    if benchmark_returns is None or len(benchmark_returns) == 0:
        assumed = True
        per_period = (1.0 + flat_annual_return) ** (1.0 / periods_per_year) - 1.0
        benchmark_returns = np.full(n, per_period)
    else:
        benchmark_returns = np.asarray(benchmark_returns, dtype=float)
        # Align lengths conservatively.
        m = min(n, len(benchmark_returns))
        returns = returns[:m]
        benchmark_returns = benchmark_returns[:m]
        n = m

    strat = {
        "total_return": float(total_return(returns)),
        "cagr": float(cagr(returns, periods_per_year)),
        "sharpe_annualized": float(sharpe_annualized(returns, periods_per_year)),
        "max_drawdown": float(max_drawdown(returns)),
    }
    bench = {
        "total_return": float(total_return(benchmark_returns)),
        "cagr": float(cagr(benchmark_returns, periods_per_year)),
        "sharpe_annualized": float(sharpe_annualized(benchmark_returns, periods_per_year)),
        "max_drawdown": float(max_drawdown(benchmark_returns)),
    }

    beats_return = strat["total_return"] > bench["total_return"]
    beats_sharpe = strat["sharpe_annualized"] > bench["sharpe_annualized"]

    return {
        "assumed_flat_benchmark": assumed,
        "flat_annual_return": flat_annual_return if assumed else None,
        "strategy": strat,
        "benchmark": bench,
        "excess_total_return": strat["total_return"] - bench["total_return"],
        "beats_benchmark_return": bool(beats_return),
        "beats_benchmark_sharpe": bool(beats_sharpe),
        "beats_benchmark": bool(beats_return and beats_sharpe),
        "benchmark_equity_curve": equity_curve(benchmark_returns).tolist(),
    }
