"""Pure-Python validation engine for Backtest Reality Check.

This package has NO web dependencies. Every module operates on plain numpy
arrays / floats so the math can be unit-tested in isolation and reused.

Conventions used throughout the engine
--------------------------------------
* ``returns`` always means a per-period (simple) return series as a 1-D
  numpy array, e.g. ``0.01`` == +1%.
* The **per-period** (non-annualized) Sharpe ratio is the quantity used by
  PSR / DSR / MinTRL. The annualized Sharpe is for display only. We keep the
  two strictly separate -- see :mod:`engine.sharpe`.
* ``skew`` is the (Fisher) skewness ``g3``; ``kurtosis`` is the *non-excess*
  kurtosis ``g4`` (a normal distribution has ``g4 == 3``).
"""

from . import (
    stats,
    distribution,
    sharpe,
    overfit,
    montecarlo,
    benchmark,
    verdict,
    dependency,
    ruin,
    heatmap,
    kelly,
    drawdowns,
    skiptrades,
    walkforward,
    portfolio,
    vsrandom,
    plan,
)

__all__ = [
    "stats",
    "distribution",
    "sharpe",
    "overfit",
    "montecarlo",
    "benchmark",
    "verdict",
    "dependency",
    "ruin",
    "heatmap",
    "kelly",
    "drawdowns",
    "skiptrades",
    "walkforward",
    "portfolio",
    "vsrandom",
    "plan",
]
