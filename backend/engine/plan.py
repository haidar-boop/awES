"""Validation plan.

Turns the full diagnostic into a prioritised, concrete action list -- derived
entirely from THIS strategy's own numbers, not a generic checklist. Each item
says what to fix or verify and why, ordered critical -> important -> minor, with
a few strengths when the result holds up. This is the honest "here's your plan"
feature: it never invents advice, it reads it off the report.
"""
from __future__ import annotations

_ORDER = {"critical": 0, "important": 1, "minor": 2, "strength": 3}


def _num(x, d=2):
    try:
        return f"{float(x):.{d}f}"
    except (TypeError, ValueError):
        return None


def _pct(x, d=0):
    try:
        return f"{float(x) * 100:.{d}f}%"
    except (TypeError, ValueError):
        return None


def build_plan(
    *, stats, sharpe, overfit, benchmark, trade_dependency, risk_of_ruin,
    walk_forward, skip_trades, vs_random, num_trials, n,
) -> dict:
    items: list[dict] = []

    def add(sev, title, detail):
        items.append({"severity": sev, "title": title, "detail": detail})

    # --- sample size ------------------------------------------------------
    if n < 30:
        add("critical", "Collect more data",
            f"Only {n} observations — below the ~30–60 needed for the statistics "
            f"to mean anything. Treat every number here as noisy.")

    extra = sharpe.get("extra_periods_needed")
    if extra is not None and extra > 0:
        add("important", "Extend the track record",
            f"You'd need about {extra:.0f} more periods to be confident the Sharpe "
            f"is real at your chosen confidence level.")

    # --- data-mining / deflation ------------------------------------------
    if num_trials <= 1:
        add("important", "Report your real trial count",
            "You logged a single trial. If you tweaked parameters or tried "
            "variants, set the trials count — it sharply lowers the Deflated "
            "Sharpe, and that's where most overfitting hides.")
    dsr = (sharpe.get("dsr") or {}).get("dsr")
    if dsr is not None and dsr < 0.5:
        add("critical", "Deflation risk",
            f"The Deflated Sharpe is {_pct(dsr)} — consistent with the best of many "
            f"tries. Cut the number of variations and hold out data you never look at.")

    # --- out-of-sample / walk-forward -------------------------------------
    ss = overfit.get("split_sample", {}) or {}
    if ss.get("overfit_flag"):
        is_s = _num((ss.get("in_sample") or {}).get("sharpe_annualized"))
        oos = _num((ss.get("out_of_sample") or {}).get("sharpe_annualized"))
        detail = "In-sample performance collapses out-of-sample."
        if is_s and oos:
            detail = (f"In-sample Sharpe {is_s} collapses to {oos} out-of-sample. "
                      f"Re-fit on less data and validate on a truly untouched segment.")
        add("critical", "Fix out-of-sample decay", detail)

    if walk_forward and walk_forward.get("available") and walk_forward.get("status") == "fail":
        add("critical", "Performance decays over time",
            f"Later windows averaged {_num(walk_forward.get('late_sharpe'))} Sharpe vs "
            f"{_num(walk_forward.get('early_sharpe'))} early — a fit-to-the-past "
            f"signature. Check for a market regime the strategy leaned on.")

    pbo = (overfit.get("pbo") or {}).get("pbo")
    if pbo is not None and pbo >= 0.5:
        add("important", "High overfit probability",
            f"Backtest-overfit probability is {_pct(pbo)}. Simplify the strategy and "
            f"cut parameters.")

    # --- concentration / robustness ---------------------------------------
    td = trade_dependency or {}
    if td.get("applicable") and td.get("status") == "fail":
        add("critical", "Edge rests on a few trades",
            f"Your top {td.get('headline_k')} {td.get('unit')} drive "
            f"{_pct(td.get('profit_share_top'))} of gross profit; removing them turns "
            f"it unprofitable. That's not a durable edge.")
    elif td.get("applicable") and td.get("status") == "warn":
        add("minor", "Concentrated returns",
            f"A handful of {td.get('unit')} carry a large share of the profit — "
            f"watch for luck.")

    if skip_trades and skip_trades.get("available") and skip_trades.get("status") in ("fail", "warn"):
        add("important", "Fragile to missed trades",
            f"Skipping a random 10% of {skip_trades.get('unit')} leaves it profitable "
            f"only {_pct(skip_trades.get('headline_prob_profitable'))} of the time — "
            f"tighten execution or expect slippage to bite.")

    if risk_of_ruin and risk_of_ruin.get("available") and risk_of_ruin.get("status") in ("fail", "warn"):
        add("important", "Size for the drawdown",
            f"{_pct(risk_of_ruin.get('prob_ruin'))} of resampled runs hit a "
            f"{int(risk_of_ruin.get('ruin_level', 0.5) * 100)}%+ drawdown. Position-size "
            f"assuming it happens, not assuming it won't.")

    if not benchmark.get("beats_benchmark"):
        add("important", "Beat buy-and-hold",
            "The strategy doesn't clearly beat simply holding the asset. If the "
            "complexity isn't earning its keep, simplify or reconsider.")

    if vs_random and vs_random.get("available") and vs_random.get("status") in ("fail", "warn"):
        add("important", "Rule out luck",
            f"{_pct(vs_random.get('p_value'))} of random strategies match your Sharpe. "
            f"Gather more data or a cleaner edge before trusting it.")

    psr = sharpe.get("psr")
    if psr is not None and psr < 0.95:
        add("minor", "Sharpe not yet significant",
            f"PSR is {_pct(psr)} — below 95%. More consistent history would firm it up.")

    # --- strengths (only when nothing critical) ---------------------------
    has_critical = any(i["severity"] == "critical" for i in items)
    if not has_critical:
        if ss.get("overfit_flag") is False:
            add("strength", "Holds up out-of-sample",
                "The Sharpe barely degrades on the held-out half — a good sign.")
        if benchmark.get("beats_benchmark"):
            add("strength", "Beats buy-and-hold",
                "On both raw and risk-adjusted return.")
        if vs_random and vs_random.get("status") == "pass":
            add("strength", "Clears the random field",
                f"Only {_pct((vs_random or {}).get('p_value'), 1)} of random strategies "
                f"match your Sharpe.")

    # always the last word
    add("minor", "Before going live",
        "Paper-trade or run a small live canary for a stretch, then re-run this "
        "check on the fresh data — the only truly out-of-sample test is the future.")

    items.sort(key=lambda x: _ORDER.get(x["severity"], 9))
    n_crit = sum(1 for i in items if i["severity"] == "critical")
    n_imp = sum(1 for i in items if i["severity"] == "important")
    if n_crit:
        summary = f"{n_crit} critical issue{'s' if n_crit != 1 else ''} to resolve before this strategy can be trusted."
    elif n_imp:
        summary = f"No critical red flags, but {n_imp} thing{'s' if n_imp != 1 else ''} to firm up before going live."
    else:
        summary = "This strategy holds up well — a few housekeeping steps before going live."

    return {
        "available": True,
        "summary": summary,
        "counts": {"critical": n_crit, "important": n_imp},
        "items": items,
    }
