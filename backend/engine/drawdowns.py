"""Drawdown recovery analytics.

Depth is only half the story -- what hurts is how long you sit underwater and
whether you ever climb back. This walks the equity curve, finds each drawdown
episode (peak -> trough -> recovery), and reports recovery times, total time
underwater, and whether the strategy is still below a prior peak right now.
"""
from __future__ import annotations

import numpy as np

from .stats import equity_curve


def drawdown_analysis(returns: np.ndarray, unit: str = "periods") -> dict:
    curve = equity_curve(returns)  # length n+1, starts at 1.0
    n = len(curve)
    out: dict = {"available": False, "unit": unit}
    if n < 3:
        return out

    # Identify drawdown episodes by tracking the running peak.
    episodes = []
    peak_idx, peak_val = 0, curve[0]
    in_dd = False
    trough_idx, trough_val = 0, curve[0]
    for i in range(1, n):
        if curve[i] >= peak_val:
            if in_dd:
                episodes.append({"peak": peak_idx, "trough": trough_idx, "recovery": i})
                in_dd = False
            peak_val, peak_idx = curve[i], i
        else:
            if not in_dd:
                in_dd, trough_idx, trough_val = True, i, curve[i]
            elif curve[i] < trough_val:
                trough_val, trough_idx = curve[i], i
    if in_dd:
        episodes.append({"peak": peak_idx, "trough": trough_idx, "recovery": None})

    def enrich(ep):
        depth = float(curve[ep["trough"]] / curve[ep["peak"]] - 1.0)
        recovered = ep["recovery"] is not None
        underwater = (ep["recovery"] if recovered else n - 1) - ep["peak"]
        return {
            "depth": depth,
            "decline": int(ep["trough"] - ep["peak"]),
            "recovery": int(ep["recovery"] - ep["trough"]) if recovered else None,
            "underwater": int(underwater),
            "recovered": recovered,
        }

    rich = [enrich(e) for e in episodes]
    if not rich:
        return {
            "available": True,
            "unit": unit,
            "status": "pass",
            "currently_underwater": False,
            "max_drawdown": 0.0,
            "time_underwater": 0.0,
            "longest_underwater": 0,
            "episodes": [],
            "message": "The equity curve never fell below a prior peak on this data.",
        }

    worst = min(rich, key=lambda e: e["depth"])
    dd_curve = curve / np.maximum.accumulate(curve) - 1.0
    time_underwater = float((dd_curve < -1e-9).mean())
    longest_underwater = max(e["underwater"] for e in rich)
    currently_underwater = episodes[-1]["recovery"] is None
    current = rich[-1] if currently_underwater else None
    recovered_eps = [e for e in rich if e["recovered"]]
    avg_recovery = (
        float(np.mean([e["recovery"] for e in recovered_eps])) if recovered_eps else None
    )

    if worst["depth"] > -0.02:
        status = "pass"
    elif currently_underwater or time_underwater > 0.6:
        status = "warn"
    else:
        status = "info"

    dpct = f"{worst['depth'] * 100:.1f}%"
    if worst["recovered"]:
        worst_msg = (
            f"Worst drawdown was {dpct} and took {worst['recovery']} {unit} to "
            f"recover (from a {worst['decline']}-{unit} decline)."
        )
    else:
        worst_msg = (
            f"Worst drawdown was {dpct} and has not recovered "
            f"({worst['underwater']} {unit} underwater and counting)."
        )
    if currently_underwater and not (worst["recovered"] is False and worst is current):
        worst_msg += (
            f" The strategy is currently {current['depth'] * 100:.1f}% below its "
            f"peak ({current['underwater']} {unit})."
        )

    # Top 3 worst episodes for the table.
    top = sorted(rich, key=lambda e: e["depth"])[:3]

    return {
        "available": True,
        "unit": unit,
        "status": status,
        "currently_underwater": currently_underwater,
        "current_depth": current["depth"] if current else 0.0,
        "current_underwater": current["underwater"] if current else 0,
        "max_drawdown": worst["depth"],
        "max_recovery": worst["recovery"],
        "max_recovered": worst["recovered"],
        "time_underwater": time_underwater,
        "longest_underwater": int(longest_underwater),
        "avg_recovery": avg_recovery,
        "episodes": top,
        "message": worst_msg,
    }
