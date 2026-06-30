"""Walk-forward (rolling out-of-sample) consistency.

True walk-forward re-optimises a strategy's parameters on each in-sample window
and tests on the next out-of-sample window. We only have a returns series -- no
parameters to re-optimise -- so this is the honest equivalent: split the track
record into N consecutive windows and ask whether the edge held up in EVERY
period or only some. It's the multi-window generalisation of the single in/out
split, and it surfaces regime dependence the one-shot split can hide.
"""
from __future__ import annotations

import numpy as np

from .stats import sharpe_annualized, total_return


def walk_forward(returns: np.ndarray, periods_per_year: float, max_folds: int = 6) -> dict:
    r = np.asarray(returns, dtype=float)
    r = r[np.isfinite(r)]
    n = int(len(r))
    out: dict = {"available": False}
    if n < 40:
        out["message"] = "Need at least ~40 observations for multiple walk-forward windows."
        return out

    # Pick a fold count so each window keeps a usable sample (~20+ each).
    k = max(3, min(max_folds, n // 20))
    chunks = np.array_split(r, k)

    folds = []
    start = 0
    for i, c in enumerate(chunks):
        sr = sharpe_annualized(c, periods_per_year)
        tr = total_return(c)
        folds.append({
            "index": i + 1,
            "start": int(start),
            "end": int(start + len(c)),
            "n": int(len(c)),
            "sharpe": float(sr),
            "return": float(tr),
            "positive": bool(sr > 0),
        })
        start += len(c)

    sharpes = np.array([f["sharpe"] for f in folds])
    positive_folds = int((sharpes > 0).sum())
    half = k // 2
    early = float(np.mean(sharpes[:half])) if half else float(sharpes[0])
    late = float(np.mean(sharpes[-half:])) if half else float(sharpes[-1])
    # Degrading if the back half clearly underperforms the front half.
    degrading = late < 0 or (early > 0 and late < 0.5 * early)

    if positive_folds == k and not degrading:
        status = "pass"
    elif positive_folds <= k / 2 or late < 0:
        status = "fail"
    else:
        status = "warn"

    if status == "pass":
        message = (
            f"The edge held up across all {k} windows ({positive_folds}/{k} "
            f"profitable), with no major decay from early to late periods."
        )
    elif status == "fail":
        message = (
            f"Performance decays out-of-sample: later windows averaged a "
            f"{late:.2f} Sharpe vs {early:.2f} early, and only {positive_folds}/{k} "
            f"windows held up. That's the signature of a fit-to-the-past backtest."
        )
    else:
        message = (
            f"{positive_folds} of {k} windows were profitable, but performance is "
            f"uneven across periods -- watch for regime dependence."
        )

    return {
        "available": True,
        "folds": folds,
        "n_folds": k,
        "positive_folds": positive_folds,
        "consistency": positive_folds / k,
        "early_sharpe": early,
        "late_sharpe": late,
        "degrading": bool(degrading),
        "status": status,
        "message": message,
    }
