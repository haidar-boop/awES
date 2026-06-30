"""Missed-trade robustness (skip-trades Monte Carlo).

The standard Monte Carlo reshuffles order; this one randomly *drops* a fraction
of trades, many times over, to answer a different question: if you'd missed
some entries -- asleep, slippage, a blown signal -- would the edge survive?
A strategy whose profitability collapses when a random 10% of trades go missing
is leaning on luck, not a durable edge.
"""
from __future__ import annotations

import numpy as np

from .stats import total_return

SKIP_FRACTIONS = (0.05, 0.10, 0.20)
HEADLINE_SKIP = 0.10


def skip_trades_robustness(
    returns: np.ndarray,
    fractions: tuple[float, ...] = SKIP_FRACTIONS,
    n_sims: int = 1000,
    seed: int | None = 42,
    unit: str = "trades",
) -> dict:
    r = np.asarray(returns, dtype=float)
    r = r[np.isfinite(r)]
    n = int(len(r))
    out: dict = {"available": False, "unit": unit}
    if n < 10:
        out["message"] = f"Too few {unit} to test missed-trade robustness."
        return out

    baseline = total_return(r)
    out["baseline_return"] = baseline
    if baseline <= 0:
        out["message"] = (
            f"The strategy isn't net profitable across these {unit}, so there's "
            "no edge to stress against missed trades."
        )
        return out

    rng = np.random.default_rng(seed)
    levels = []
    for f in fractions:
        k = max(1, int(round(f * n)))
        if k >= n - 1:
            continue
        finals = np.empty(n_sims)
        for i in range(n_sims):
            drop = rng.choice(n, size=k, replace=False)
            mask = np.ones(n, dtype=bool)
            mask[drop] = False
            finals[i] = total_return(r[mask])
        levels.append({
            "skip": float(f),
            "k": int(k),
            "prob_profitable": float((finals > 0).mean()),
            "median_return": float(np.median(finals)),
            "p5_return": float(np.percentile(finals, 5)),
        })

    if not levels:
        out["message"] = f"Not enough {unit} to drop a meaningful fraction."
        return out

    headline = next((l for l in levels if abs(l["skip"] - HEADLINE_SKIP) < 1e-9), levels[len(levels) // 2])
    prob = headline["prob_profitable"]
    skip_pct = round(headline["skip"] * 100)

    if prob < 0.5:
        status = "fail"
    elif prob < 0.9:
        status = "warn"
    else:
        status = "pass"

    pp = f"{prob * 100:.0f}%"
    if status == "fail":
        message = (
            f"Randomly skipping {skip_pct}% of {unit} left the strategy profitable "
            f"only {pp} of the time -- the edge is fragile to missed entries."
        )
    elif status == "warn":
        message = (
            f"Skip a random {skip_pct}% of {unit} and it stayed profitable {pp} of "
            f"the time. Mostly holds, but missed entries clearly bite."
        )
    else:
        message = (
            f"Even skipping a random {skip_pct}% of {unit}, it stayed profitable "
            f"{pp} of the time -- robust to missed entries."
        )

    return {
        "available": True,
        "unit": unit,
        "n_sims": int(n_sims),
        "baseline_return": baseline,
        "headline_skip": headline["skip"],
        "headline_prob_profitable": prob,
        "headline_median_return": headline["median_return"],
        "levels": levels,
        "status": status,
        "message": message,
    }
