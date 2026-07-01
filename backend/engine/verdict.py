"""Traffic-light verdict: combine every signal into one honest call.

The product NEVER says a strategy is "profitable". It says the strategy
*survives* or *fails* specific robustness checks. All language here reflects
that.
"""
from __future__ import annotations

import math


# Verdict levels
RED = "red"        # likely overfit / don't trust it
YELLOW = "yellow"  # inconclusive / need more data
GREEN = "green"    # holds up so far


def _fmt_pct(x: float) -> str:
    return f"{x * 100:.0f}%"


def build_verdict(
    *,
    sharpe: dict,
    overfit: dict,
    benchmark: dict,
    n_observations: int,
    min_observations: int = 30,
) -> dict:
    """Combine engine outputs into a traffic-light verdict.

    Scoring is transparent: each check contributes pass/warn/fail, we tally
    them, and map the tally to a colour. We also collect concrete reasons and
    warnings so the UI can show *why*.
    """
    reasons: list[str] = []
    warnings: list[str] = []

    score = 0      # positive == healthier
    hard_fail = False

    psr = sharpe["psr"]
    dsr = sharpe["dsr"]["dsr"]
    n_trials = sharpe["dsr"]["n_trials"]
    mintrl = sharpe["min_track_record_length"]
    degradation = overfit["split_sample"]["sharpe_degradation"]
    oos_sharpe = overfit["split_sample"]["out_of_sample"]["sharpe_annualized"]
    is_sharpe = overfit["split_sample"]["in_sample"]["sharpe_annualized"]
    pbo = overfit["pbo"]["pbo"]
    beats_bench = benchmark["beats_benchmark"]
    beats_bench_return = benchmark["beats_benchmark_return"]
    # When the caller supplies no benchmark we compare against a synthesised flat
    # line (0%/yr by default) -- that's "cash", not the asset's buy-and-hold. Only
    # call it "buy-and-hold" when a real benchmark series was actually provided.
    bench_name = "cash (a flat 0% return)" if benchmark.get("assumed_flat_benchmark") else "buy-and-hold"

    # --- sample size -------------------------------------------------------
    if n_observations < min_observations:
        hard_fail = True
        warnings.append(
            f"Only {n_observations} observations -- below the ~{min_observations} "
            "needed for statistics to mean anything. Treat every number as noisy."
        )

    # --- PSR ---------------------------------------------------------------
    if psr >= 0.95:
        score += 2
        reasons.append(
            f"Probabilistic Sharpe is high ({_fmt_pct(psr)}): the edge is very "
            "likely real vs. a zero Sharpe."
        )
    elif psr >= 0.80:
        score += 1
    else:
        score -= 2
        reasons.append(
            f"Probabilistic Sharpe is low ({_fmt_pct(psr)}): we can't be "
            "confident the true Sharpe is even above zero."
        )

    # --- DSR (the data-mining killer) -------------------------------------
    if n_trials > 1:
        if dsr >= 0.95:
            score += 2
            reasons.append(
                f"Survives deflation: after accounting for {n_trials} trials, "
                f"the Deflated Sharpe is still {_fmt_pct(dsr)}."
            )
        elif dsr >= 0.50:
            score += 0
            warnings.append(
                f"Deflated Sharpe is borderline ({_fmt_pct(dsr)}) once {n_trials} "
                "trials are accounted for."
            )
        else:
            score -= 3
            reasons.append(
                f"Fails deflation: with {n_trials} trials, the Deflated Sharpe is "
                f"only {_fmt_pct(dsr)} -- the result is consistent with luck from "
                "trying many variations."
            )
    else:
        # Single trial -> DSR collapses to PSR; note it.
        if psr < 0.80:
            pass  # already penalised via PSR
        warnings.append(
            "You reported a single trial. If you actually tweaked the strategy "
            "many times, set the trials count higher -- it sharply lowers the "
            "Deflated Sharpe."
        )

    # --- in/out-of-sample degradation -------------------------------------
    if overfit["split_sample"]["overfit_flag"]:
        score -= 2
        if is_sharpe > 0 and oos_sharpe <= 0:
            reasons.append(
                f"Out-of-sample collapse: Sharpe fell from {is_sharpe:.2f} "
                f"(in-sample) to {oos_sharpe:.2f} (out-of-sample)."
            )
        else:
            reasons.append(
                f"Large out-of-sample degradation ({_fmt_pct(degradation)} of the "
                "in-sample Sharpe lost)."
            )
    elif degradation < 0.2:
        score += 1
        reasons.append(
            "Holds up out-of-sample: Sharpe barely degrades on the held-out half."
        )

    # --- PBO ---------------------------------------------------------------
    if pbo is not None:
        if pbo >= 0.5:
            score -= 2
            warnings.append(
                f"High backtest-overfit probability (~{_fmt_pct(pbo)}): the edge "
                "vanishes out-of-sample across most sub-period splits."
            )
        elif pbo <= 0.2:
            score += 1

    # --- benchmark ---------------------------------------------------------
    if not beats_bench_return:
        score -= 2
        reasons.append(
            f"Does not beat {bench_name} on total return -- you'd have done as "
            "well or better just holding."
        )
    elif beats_bench:
        score += 1
        reasons.append(f"Beats {bench_name} on both return and risk-adjusted return.")

    # --- track record length ----------------------------------------------
    if math.isfinite(mintrl) and mintrl > n_observations:
        extra = mintrl - n_observations
        warnings.append(
            f"Track record too short: you'd need ~{extra:.0f} more periods "
            f"(~{mintrl:.0f} total) to be {_fmt_pct(sharpe['confidence'])} "
            "confident the Sharpe is real."
        )
        score -= 1
    elif not math.isfinite(mintrl):
        warnings.append(
            "Sharpe does not clear the benchmark, so no track record length "
            "would make the edge statistically convincing."
        )
        score -= 1

    # --- map score -> colour ----------------------------------------------
    if hard_fail:
        level = YELLOW
        headline = "Not enough data to judge"
        summary = (
            "There aren't enough observations to run these checks reliably. "
            "Collect more data before trusting any verdict."
        )
    elif score <= -2:
        level = RED
        headline = "Likely overfit -- don't trust it"
        summary = (
            "This strategy fails key robustness checks. The strong backtest is "
            "more consistent with curve-fitting or luck than a durable edge."
        )
    elif score >= 3:
        level = GREEN
        headline = "Holds up so far"
        summary = (
            "This strategy survives the robustness checks we ran. That is not a "
            "promise of future profit -- it means the edge is statistically "
            "credible on the data you provided."
        )
    else:
        level = YELLOW
        headline = "Inconclusive -- needs more data"
        summary = (
            "The signals are mixed. Some checks pass and others raise flags; "
            "more out-of-sample data (or honest trial accounting) is needed."
        )

    # Keep the most informative reasons first; cap for readability.
    top_reasons = reasons[:3]

    return {
        "level": level,
        "headline": headline,
        "summary": summary,
        "score": int(score),
        "top_reasons": top_reasons,
        "warnings": warnings,
        "disclaimer": (
            "Statistical analysis only. Not financial advice. Past performance "
            "does not guarantee future results."
        ),
    }
