"""Monte Carlo robustness: bootstrap / reshuffle the returns.

If the real result only looks good because of the *lucky ordering* of a few
big days, reshuffling will expose it: the actual outcome will sit at an
unremarkable percentile of the simulated distribution.
"""
from __future__ import annotations

import numpy as np

from .stats import total_return, max_drawdown, equity_curve


def monte_carlo(
    returns: np.ndarray,
    n_sims: int = 2000,
    method: str = "bootstrap",
    seed: int | None = 42,
    cone_points: int = 100,
) -> dict:
    """Resample returns ``n_sims`` times and summarise the outcome distribution.

    ``method``:
      * ``"bootstrap"`` -- sample with replacement (varies which returns occur).
      * ``"reshuffle"`` -- permute the existing returns (same returns, new order;
        isolates the effect of *ordering / path dependence*).

    Returns final-return and max-drawdown distributions, the actual result's
    percentile rank, and percentile bands for an equity-curve "cone" chart.
    """
    returns = np.asarray(returns, dtype=float)
    n = len(returns)
    rng = np.random.default_rng(seed)

    actual_final = total_return(returns)
    actual_mdd = max_drawdown(returns)

    final_returns = np.empty(n_sims)
    max_dds = np.empty(n_sims)

    # Equity paths for the cone (downsample columns to keep payload small).
    if n + 1 <= cone_points:
        col_idx = np.arange(n + 1)
    else:
        col_idx = np.unique(
            np.linspace(0, n, cone_points).round().astype(int)
        )
    paths = np.empty((n_sims, len(col_idx)))

    for i in range(n_sims):
        if method == "reshuffle":
            sample = rng.permutation(returns)
        else:
            sample = returns[rng.integers(0, n, size=n)]
        curve = equity_curve(sample)
        final_returns[i] = curve[-1] - 1.0
        running_max = np.maximum.accumulate(curve)
        max_dds[i] = (curve / running_max - 1.0).min()
        paths[i] = curve[col_idx]

    pct_final = float((final_returns < actual_final).mean() * 100.0)
    # For drawdown, "worse" means more negative; report how many sims had a
    # *shallower* (better) drawdown than the actual -> high == actual was lucky.
    pct_mdd = float((max_dds < actual_mdd).mean() * 100.0)

    bands = [5, 25, 50, 75, 95]
    cone = {f"p{b}": np.percentile(paths, b, axis=0).tolist() for b in bands}

    actual_curve = equity_curve(returns)[col_idx].tolist()

    return {
        "method": method,
        "n_sims": int(n_sims),
        "actual_final_return": float(actual_final),
        "actual_max_drawdown": float(actual_mdd),
        "final_return_percentile": pct_final,
        "max_drawdown_percentile": pct_mdd,
        "final_return_distribution": {
            "mean": float(final_returns.mean()),
            "median": float(np.median(final_returns)),
            "p5": float(np.percentile(final_returns, 5)),
            "p95": float(np.percentile(final_returns, 95)),
            "std": float(final_returns.std(ddof=1)) if n_sims > 1 else 0.0,
        },
        "max_drawdown_distribution": {
            "mean": float(max_dds.mean()),
            "median": float(np.median(max_dds)),
            "p5": float(np.percentile(max_dds, 5)),
            "p95": float(np.percentile(max_dds, 95)),
        },
        "final_return_samples": final_returns.tolist(),
        "max_drawdown_samples": max_dds.tolist(),
        "cone": {
            "x": col_idx.tolist(),
            "actual": actual_curve,
            **cone,
        },
    }
