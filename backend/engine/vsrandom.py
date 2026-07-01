"""Vs. Random test -- "could I have gotten this by luck?".

Race the strategy against a field of zero-edge random strategies that trade with
the same volatility over the same number of periods. If a good fraction of pure
coin-flippers match your Sharpe -- or the luckiest one beats it -- the result is
well within what chance produces, and the "edge" is unproven.

This is the simulation cousin of the PSR: instead of an analytic probability, it
shows a tangible field of random results and where yours lands.
"""
from __future__ import annotations

import numpy as np

from .stats import sharpe_annualized, total_return


def vs_random(
    returns: np.ndarray,
    periods_per_year: float,
    n_random: int = 1000,
    seed: int | None = 42,
) -> dict:
    r = np.asarray(returns, dtype=float)
    r = r[np.isfinite(r)]
    n = int(len(r))
    out: dict = {"available": False}
    if n < 20:
        out["message"] = "Need at least ~20 observations to race against random."
        return out

    sd = float(np.std(r, ddof=1))
    if sd <= 0:
        out["message"] = "Returns have no variance; the random test is undefined."
        return out

    real_sharpe = float(sharpe_annualized(r, periods_per_year))
    real_return = float(total_return(r))

    rng = np.random.default_rng(seed)
    # Zero-edge random strategies: same length, same volatility, no drift.
    R = rng.normal(0.0, sd, size=(n_random, n))
    rmean = R.mean(axis=1)
    rsd = R.std(axis=1, ddof=1)
    rsd = np.where(rsd > 0, rsd, np.nan)
    rand_sharpe = (rmean / rsd) * np.sqrt(periods_per_year)
    rand_sharpe = np.nan_to_num(rand_sharpe, nan=0.0)
    rand_return = np.prod(1.0 + R, axis=1) - 1.0

    # one-sided: how often pure chance matches or beats the real Sharpe
    p_value = float((rand_sharpe >= real_sharpe).mean())
    beat_pct = float((rand_sharpe < real_sharpe).mean())
    best_random_sharpe = float(np.max(rand_sharpe))
    best_random_return = float(np.max(rand_return))
    beats_best = bool(real_sharpe > best_random_sharpe)

    if p_value < 0.05:
        status = "pass"
    elif p_value < 0.25:
        status = "warn"
    else:
        status = "fail"

    pp = p_value * 100.0
    if status == "pass":
        message = (
            f"Only {pp:.1f}% of {n_random} random strategies matched your "
            f"annualized Sharpe. The luckiest random one reached {best_random_sharpe:.2f} "
            f"vs your {real_sharpe:.2f} -- your result clearly beats chance."
        )
    elif status == "warn":
        message = (
            f"{pp:.0f}% of {n_random} random strategies matched or beat your Sharpe. "
            f"Probably more than luck, but not decisively -- the luckiest random one "
            f"hit {best_random_sharpe:.2f} vs your {real_sharpe:.2f}."
        )
    else:
        message = (
            f"{pp:.0f}% of random strategies matched or beat your Sharpe -- this "
            f"result is well within what pure chance produces. Treat the edge as "
            f"unproven."
        )

    return {
        "available": True,
        "n_random": int(n_random),
        "real_sharpe": real_sharpe,
        "real_return": real_return,
        "p_value": p_value,
        "beat_pct": beat_pct,
        "best_random_sharpe": best_random_sharpe,
        "best_random_return": best_random_return,
        "beats_best_random": beats_best,
        "status": status,
        "message": message,
    }
