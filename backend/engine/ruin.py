"""Risk of ruin, derived from the Monte Carlo resamples.

Rather than a textbook gambler's-ruin formula (which needs assumptions about
bet sizing), we read it straight off the Monte Carlo paths the engine already
simulates: across thousands of resampled runs, how often did the account fall
at least X% from its peak? That is the honest, data-grounded "risk of ruin".
"""
from __future__ import annotations

import numpy as np

# Drawdown depths we report a probability for. 50% is the headline "ruin" level
# (few accounts -- or traders -- come back from losing half).
DD_LEVELS = (0.25, 0.50, 0.75, 0.90)
RUIN_LEVEL = 0.50


def risk_of_ruin(
    max_drawdown_samples,
    final_return_samples,
    dd_levels: tuple[float, ...] = DD_LEVELS,
    ruin_level: float = RUIN_LEVEL,
) -> dict:
    """Probability of deep drawdowns / a losing outcome across the MC paths.

    ``max_drawdown_samples`` are the (negative) worst drawdowns of each simulated
    path; ``final_return_samples`` are each path's final return.
    """
    dd = np.asarray(max_drawdown_samples, dtype=float)
    fin = np.asarray(final_return_samples, dtype=float)
    n = int(len(dd))
    if n == 0:
        return {"available": False}

    def prob_dd_at_least(level: float) -> float:
        # drawdowns are negative; "at least `level` deep" means dd <= -level
        return float((dd <= -level).mean())

    levels = [{"level": float(l), "prob": prob_dd_at_least(l)} for l in dd_levels]
    prob_ruin = prob_dd_at_least(ruin_level)
    prob_loss = float((fin < 0).mean())
    worst_case_drawdown = float(np.percentile(dd, 5))   # deep (5th pct) tail
    median_drawdown = float(np.median(dd))

    if prob_ruin > 0.25:
        status = "fail"
    elif prob_ruin > 0.05:
        status = "warn"
    else:
        status = "pass"

    rp = f"{prob_ruin * 100:.0f}%"
    rl = f"{ruin_level * 100:.0f}%"
    if status == "fail":
        message = (
            f"In {rp} of resampled runs the account fell at least {rl} from its "
            f"peak -- a real risk of ruin. Position sizing has to assume this "
            f"happens."
        )
    elif status == "warn":
        message = (
            f"About {rp} of resampled runs hit a {rl}-or-deeper drawdown. "
            f"Survivable, but plan for a painful stretch."
        )
    else:
        message = (
            f"Only {rp} of resampled runs hit a {rl}-or-deeper drawdown. Ruin "
            f"risk looks low on this data -- though past resamples don't bind the "
            f"future."
        )

    return {
        "available": True,
        "n_sims": n,
        "ruin_level": float(ruin_level),
        "prob_ruin": prob_ruin,
        "prob_loss": prob_loss,
        "worst_case_drawdown": worst_case_drawdown,
        "median_drawdown": median_drawdown,
        "levels": levels,
        "status": status,
        "message": message,
    }
