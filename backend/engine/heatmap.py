"""Returns-over-time heatmap.

The input is a bare returns series (dates are stripped during parsing), so this
doesn't claim real calendar months. It groups the series into sequential,
frequency-aware buckets (~one month of trading where the frequency allows,
otherwise equal segments) and reports the compounded return of each. The point
is consistency: is the edge spread evenly across time, or carried by a few hot
stretches?
"""
from __future__ import annotations

import numpy as np

# Approximate periods per calendar month by reported frequency.
PERIODS_PER_MONTH = {
    "daily": 21.0,
    "hourly": 21.0 * 6.5,
    "weekly": 52.0 / 12.0,
    "monthly": 1.0,
}


def returns_heatmap(returns: np.ndarray, frequency: str, cols: int = 12) -> dict:
    """Bucket the series and return a grid of compounded bucket returns."""
    r = np.asarray(returns, dtype=float)
    r = r[np.isfinite(r)]
    n = int(len(r))
    out: dict = {"available": False}
    if n < 6:
        return out

    ppm = PERIODS_PER_MONTH.get(frequency)
    if ppm and n >= ppm * 2:
        size = max(1, int(round(ppm)))
        unit = "month"
    else:
        # No clean monthly mapping (e.g. per-trade): split into equal segments.
        target = min(cols * 3, n)
        size = max(1, int(round(n / target)))
        unit = "period"

    buckets: list[float] = []
    for start in range(0, n, size):
        seg = r[start:start + size]
        if len(seg) == 0:
            continue
        buckets.append(float(np.prod(1.0 + seg) - 1.0))

    arr = np.array(buckets, dtype=float)
    nb = len(arr)
    if nb < 2:
        return out

    # Lay out into rows of `cols`, padding the last row with None.
    rows = []
    for i in range(0, nb, cols):
        chunk = buckets[i:i + cols]
        if unit == "month":
            label = f"Yr {i // cols + 1}"
        else:
            label = f"{i + 1}–{i + len(chunk)}"
        cells = chunk + [None] * (cols - len(chunk))
        rows.append({"label": label, "cells": cells})

    max_abs = float(np.max(np.abs(arr))) if nb else 0.0
    return {
        "available": True,
        "unit": unit,
        "cols": cols,
        "n_buckets": nb,
        "rows": rows,
        "positive_share": float((arr > 0).mean()),
        "best": float(arr.max()),
        "worst": float(arr.min()),
        "max_abs": max_abs,
    }
