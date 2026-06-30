"""Position sizing via the Kelly criterion.

For a returns series the growth-optimal leverage is the continuous Kelly
fraction f* = mean / variance (per period). Full Kelly maximises long-run
growth but courts brutal drawdowns, so we also report the standard fractional
sizings (1/2, 1/4, 1/10). On brand: the honest message is "size *below* the
math", because the rest of the report exists to question whether the edge that
Kelly assumes is constant is even real.

Note: full-Kelly annualised volatility equals the annualised Sharpe ratio
(f*·sigma·sqrt(ppy) = mean/sigma·sqrt(ppy)), which makes the risk concrete.
"""
from __future__ import annotations

import numpy as np

FRACTIONS = [("Full", 1.0), ("Half", 0.5), ("Quarter", 0.25), ("Tenth", 0.1)]


def kelly_sizing(returns: np.ndarray, periods_per_year: float) -> dict:
    """Full + fractional Kelly leverage and the volatility each implies."""
    r = np.asarray(returns, dtype=float)
    r = r[np.isfinite(r)]
    n = int(len(r))
    out: dict = {"available": False}
    if n < 5:
        out["message"] = "Too few observations to estimate a Kelly size."
        return out

    mu = float(np.mean(r))
    var = float(np.var(r, ddof=1))
    sigma = float(np.sqrt(var))
    # Guard against zero or numerically-negligible variance (e.g. constant
    # returns), which would otherwise blow the leverage up to ~infinity.
    if var <= 0 or sigma < 1e-10:
        out["message"] = "Returns have ~no variance, so Kelly sizing is undefined."
        return out

    f_full = mu / var  # growth-optimal leverage (multiple of the tested bet size)

    if f_full <= 0:
        return {
            "available": True,
            "positive_edge": False,
            "full_kelly_leverage": f_full,
            "levels": [],
            "status": "fail",
            "message": (
                "Average return is zero or negative, so Kelly sizing says don't "
                "trade this -- there's no positive edge to size. (Sizing math only "
                "applies once the edge itself is real.)"
            ),
        }

    ann = float(np.sqrt(periods_per_year))
    levels = []
    for name, phi in FRACTIONS:
        lev = phi * f_full
        levels.append({
            "name": name,
            "fraction": phi,
            "leverage": float(lev),
            "annual_volatility": float(lev * sigma * ann),
        })

    return {
        "available": True,
        "positive_edge": True,
        "full_kelly_leverage": float(f_full),
        "quarter_kelly_leverage": float(0.25 * f_full),
        "per_period_mean": mu,
        "per_period_vol": sigma,
        "levels": levels,
        "status": "info",
        "message": (
            f"Growth-optimal (full Kelly) leverage is {f_full:.1f}x your tested "
            f"bet size. Full Kelly maximises long-run growth but courts ruinous "
            f"drawdowns -- most professionals use quarter Kelly or less, and you "
            f"should size below the math because this report exists to question "
            f"whether the edge is real and stable."
        ),
    }
