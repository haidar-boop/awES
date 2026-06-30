"""Trade-dependency / outlier-concentration test.

A backtest can look great while its entire edge rests on a handful of lucky
trades. This module answers the honest gut-check: "remove your best few trades
-- does the strategy still make money?" and "what share of the gross profit do
those few trades represent?".

Operates on the same per-period (simple) returns series the rest of the engine
uses; each element is treated as one trade/period.
"""
from __future__ import annotations

import numpy as np

from . import stats


def trade_dependency(returns: np.ndarray, unit: str = "trades") -> dict:
    """Concentration + "remove the top N" survival test.

    Returns a JSON-ready dict. ``applicable`` is False when the strategy isn't
    net profitable (nothing to stress) or there are too few trades to judge.
    """
    r = np.asarray(returns, dtype=float)
    r = r[np.isfinite(r)]
    n = int(len(r))
    out: dict = {
        "applicable": False,
        "unit": unit,
        "n": n,
        "status": "info",
        "levels": [],
        "message": "",
    }

    if n < 5:
        out["message"] = f"Too few {unit} to assess concentration reliably."
        return out

    total = stats.total_return(r)
    pos = r[r > 0]
    gross_gain = float(pos.sum())
    out["total_return"] = total

    if total <= 0 or gross_gain <= 0:
        out["message"] = (
            f"The strategy isn't net profitable across these {unit}, so there's "
            "no edge to stress-test for trade concentration."
        )
        return out

    sorted_desc = np.sort(r)[::-1]  # largest return first

    def total_return_without_top(k: int) -> float:
        return stats.total_return(sorted_desc[k:])

    def profit_share_top(k: int) -> float | None:
        top = sorted_desc[:k]
        top_gain = float(top[top > 0].sum())
        return (top_gain / gross_gain) if gross_gain > 0 else None

    # Feature a few removal levels: the single best, top 3, top 5, and top 5%.
    k_pct = max(1, int(round(0.05 * n)))
    candidates = sorted({1, 3, 5, k_pct})
    candidates = [k for k in candidates if 1 <= k <= n - 2]
    if not candidates:
        candidates = [1]

    levels = []
    for k in candidates:
        without = total_return_without_top(k)
        levels.append({
            "k": int(k),
            "fraction": k / n,
            "profit_share": profit_share_top(k),
            "total_return_without": without,
            "survives": bool(without > 0),
        })
    out["levels"] = levels

    # Headline on the top-5% level (the standard framing), else the largest k.
    headline = next((l for l in levels if l["k"] == k_pct), levels[-1])
    share = headline["profit_share"] or 0.0
    out.update({
        "applicable": True,
        "headline_k": headline["k"],
        "headline_fraction": headline["fraction"],
        "profit_share_top": headline["profit_share"],
        "best_trade_share": profit_share_top(1),
        "total_return_without": headline["total_return_without"],
        "survives": headline["survives"],
    })

    # --- verdict on concentration -----------------------------------------
    if not headline["survives"]:
        status = "fail"
    elif share >= 0.6 or headline["total_return_without"] < 0.5 * total:
        status = "warn"
    else:
        status = "pass"
    # With few trades we can't be confident enough to fail outright.
    if n < 20 and status == "fail":
        status = "warn"
    out["status"] = status

    pct_label = f"{headline['fraction'] * 100:.0f}%"
    k = headline["k"]
    if not headline["survives"]:
        out["message"] = (
            f"Your top {k} {unit} ({pct_label}) account for {share * 100:.0f}% of "
            f"gross profit. Remove them and the strategy is no longer net "
            f"profitable -- the edge depends on a handful of {unit}."
        )
    elif status == "warn":
        out["message"] = (
            f"Your top {k} {unit} ({pct_label}) drive {share * 100:.0f}% of gross "
            f"profit. The edge survives removing them, but it's concentrated -- "
            f"a few outcomes are doing the heavy lifting."
        )
    else:
        out["message"] = (
            f"Profit is well spread: the top {k} {unit} ({pct_label}) are only "
            f"{share * 100:.0f}% of gross profit, and the edge holds up without them."
        )
    return out
