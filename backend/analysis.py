"""Analysis orchestrator.

Glues the pure :mod:`engine` together for the web layer: runs every check,
assembles chart-ready data, writes plain-English explanations, and applies
tier gating. Kept separate from ``engine/`` so the math stays web-free.
"""
from __future__ import annotations

import math
from datetime import datetime, timezone

import numpy as np
from scipy.stats import norm

from engine import stats as estats
from engine import distribution as edist
from engine import sharpe as esharpe
from engine import overfit as eoverfit
from engine import montecarlo as emc
from engine import benchmark as ebench
from engine import verdict as everdict
from engine import dependency as edependency
from engine import ruin as eruin

# Annualization factors by reported frequency.
FREQ_MAP = {
    "daily": 252,
    "hourly": 252 * 6.5,   # ~6.5 trading hours/day
    "weekly": 52,
    "monthly": 12,
    "per_trade": 252,      # nominal; annualized figures are approximate
}

# Features available only on the paid tier. Free tier still gets a real,
# useful verdict from the basics.
PAID_FEATURES = ["deflated_sharpe", "pbo", "monte_carlo", "risk_of_ruin",
                 "pdf_report", "haircut"]


def periods_per_year(frequency: str) -> float:
    return float(FREQ_MAP.get(frequency, 252))


def _safe(x):
    """JSON-safe float (inf/nan -> None)."""
    if isinstance(x, (int,)):
        return x
    try:
        xf = float(x)
    except (TypeError, ValueError):
        return x
    if math.isnan(xf) or math.isinf(xf):
        return None
    return xf


def _rolling_sharpe(returns: np.ndarray, ppy: float, window: int) -> dict:
    n = len(returns)
    window = max(10, min(window, n))
    xs, ys = [], []
    for end in range(window, n + 1):
        w = returns[end - window:end]
        xs.append(end)
        ys.append(_safe(estats.sharpe_annualized(w, ppy)))
    return {"x": xs, "sharpe": ys, "window": window}


def _histogram(returns: np.ndarray, bins: int = 30) -> dict:
    counts, edges = np.histogram(returns, bins=bins)
    centers = (edges[:-1] + edges[1:]) / 2.0
    mu, sd = float(np.mean(returns)), float(np.std(returns, ddof=1)) if len(returns) > 1 else 0.0
    width = edges[1] - edges[0]
    if sd > 0:
        pdf = norm.pdf(centers, mu, sd) * len(returns) * width
    else:
        pdf = np.zeros_like(centers)
    return {
        "bins": [
            {"center": _safe(c), "count": int(n), "normal": _safe(p)}
            for c, n, p in zip(centers, counts, pdf)
        ],
        "mean": _safe(mu),
        "std": _safe(sd),
    }


def _fmt_pct(x, digits=1):
    if x is None:
        return "n/a"
    return f"{x * 100:.{digits}f}%"


def _fmt_num(x, digits=2):
    if x is None:
        return "n/a"
    return f"{x:.{digits}f}"


def _build_explanations(*, stats, dist, sharpe, overfit, mc, bench, ppy) -> list[dict]:
    """Per-metric rows: value + plain-English meaning + pass/warn/fail."""
    rows = []

    def add(key, label, value, status, plain, tooltip):
        rows.append({
            "key": key, "label": label, "value": value, "status": status,
            "plain": plain, "tooltip": tooltip,
        })

    # Annualized Sharpe
    ann_sr = stats["sharpe_annualized"]
    add(
        "sharpe", "Annualized Sharpe", _fmt_num(ann_sr),
        "pass" if ann_sr and ann_sr > 1 else ("warn" if ann_sr and ann_sr > 0 else "fail"),
        "Risk-adjusted return. Above ~1 is good, but on its own it's easy to "
        "fake -- that's why the checks below matter more.",
        "Mean return divided by volatility, annualized. Assumes normal, "
        "independent returns (often violated).",
    )

    # Autocorrelation-adjusted Sharpe
    adj = dist["autocorr_adjusted_sharpe"]
    add(
        "adj_sharpe", "Autocorrelation-adjusted Sharpe", _fmt_num(adj["adjusted_annualized"]),
        "warn" if adj["adjustment_factor"] < 0.9 else "info",
        "The honest Sharpe once we account for returns that aren't independent. "
        f"It moved the Sharpe by {_fmt_pct(adj['adjustment_factor'] - 1)}.",
        "Lo (2002) correction. Positive autocorrelation inflates the raw "
        "Sharpe; this removes that inflation.",
    )

    # PSR
    psr = sharpe["psr"]
    add(
        "psr", "Probabilistic Sharpe (PSR)", _fmt_pct(psr),
        "pass" if psr >= 0.95 else ("warn" if psr >= 0.8 else "fail"),
        f"There's a {_fmt_pct(psr)} probability the true Sharpe is above zero, "
        "given the sample size and the shape of the returns.",
        "Probability the real Sharpe exceeds the benchmark, accounting for "
        "track-record length, skew and fat tails.",
    )

    # DSR
    dsr = sharpe["dsr"]["dsr"]
    n_trials = sharpe["dsr"]["n_trials"]
    add(
        "dsr", "Deflated Sharpe (DSR)", _fmt_pct(dsr),
        "pass" if dsr >= 0.95 else ("warn" if dsr >= 0.5 else "fail"),
        f"After accounting for {n_trials} trial(s), there's a {_fmt_pct(dsr)} "
        "chance the edge is real and not just the best of many tries.",
        "PSR with the bar raised to the Sharpe you'd expect from luck across "
        "all the variations you tested. This is what catches data-mining.",
    )

    # MinTRL
    mintrl = sharpe["min_track_record_length"]
    extra = sharpe["extra_periods_needed"]
    if mintrl is None or (isinstance(mintrl, float) and math.isinf(mintrl)):
        add("mintrl", "Min track record length", "∞", "fail",
            "The Sharpe doesn't clear the benchmark, so no amount of data would "
            "make the edge statistically convincing.",
            "How many observations you'd need to be confident the Sharpe is real.")
    else:
        ok = extra is not None and extra <= 0
        add("mintrl", "Min track record length", f"{mintrl:.0f} periods",
            "pass" if ok else "warn",
            ("You already have enough history for the edge to be statistically "
             "credible." if ok else
             f"You'd need about {extra:.0f} more periods of live trading to be "
             f"{_fmt_pct(sharpe['confidence'], 0)} confident."),
            "Minimum number of periods needed to trust the Sharpe at your "
            "chosen confidence level.")

    # IS/OOS
    ss = overfit["split_sample"]
    deg = ss["sharpe_degradation"]
    add(
        "oos", "Out-of-sample degradation", _fmt_pct(deg, 0),
        "fail" if ss["overfit_flag"] else ("warn" if deg > 0.2 else "pass"),
        f"In-sample Sharpe {_fmt_num(ss['in_sample']['sharpe_annualized'])} vs "
        f"out-of-sample {_fmt_num(ss['out_of_sample']['sharpe_annualized'])}. "
        "Big drops mean the backtest was fit to the past.",
        "We split your data, measure performance on each half, and report how "
        "much the edge shrinks on the unseen half.",
    )

    # PBO
    if mc is not None and overfit["pbo"]["pbo"] is not None:
        pbo = overfit["pbo"]["pbo"]
        add(
            "pbo", "Backtest-overfit probability (PBO)", _fmt_pct(pbo, 0),
            "fail" if pbo >= 0.5 else ("warn" if pbo > 0.2 else "pass"),
            f"Across sub-period splits, the in-sample edge disappears "
            f"out-of-sample {_fmt_pct(pbo, 0)} of the time.",
            "Single-series approximation of CSCV. Higher = more likely the "
            "backtest is overfit.",
        )

    # Benchmark
    add(
        "benchmark", "Beats buy-and-hold?",
        "Yes" if bench["beats_benchmark"] else "No",
        "pass" if bench["beats_benchmark"] else "fail",
        ("The strategy beats simply holding on both return and risk-adjusted "
         "return." if bench["beats_benchmark"] else
         "The strategy does not clearly beat just holding the asset -- a basic "
         "but commonly failed gut-check."),
        "Compares your strategy to buy-and-hold. If you can't beat holding, the "
        "complexity isn't earning its keep.",
    )

    # Monte Carlo
    if mc is not None:
        mc_dist = mc["final_return_distribution"]
        p5, p95 = mc_dist["p5"], mc_dist["p95"]
        worst_dd = mc["max_drawdown_distribution"]["p5"]  # typical bad-case DD
        # Wide spread or a deeply negative downside => fragile / luck-sensitive.
        spread = (p95 - p5)
        status = "warn" if (p5 is not None and p5 < 0) or spread > 1.0 else "info"
        add(
            "montecarlo", "Monte Carlo outcome range",
            f"{_fmt_pct(p5, 0)} to {_fmt_pct(p95, 0)}",
            status,
            f"Resampling your returns {mc['n_sims']} times, total outcomes ranged "
            f"from {_fmt_pct(p5, 0)} (5th pct) to {_fmt_pct(p95, 0)} (95th pct), "
            f"with a typical bad-case drawdown around {_fmt_pct(worst_dd, 0)}. A "
            "wide or deeply negative range means the result is fragile.",
            "We bootstrap (resample) your returns thousands of times to see the "
            "range of outcomes you could realistically have gotten. Your actual "
            f"result sits at the {mc['final_return_percentile']:.0f}th percentile.",
        )

    # Normality
    jb = dist["jarque_bera"]
    add(
        "normality", "Returns look normal?", "Yes" if jb["normal"] else "No",
        "info" if jb["normal"] else "warn",
        ("Returns are roughly normal, so the standard Sharpe assumptions hold "
         "reasonably well." if jb["normal"] else
         "Returns are non-normal (fat tails / skew), which makes a raw Sharpe "
         "too optimistic -- the PSR/DSR above already correct for this."),
        "Jarque-Bera normality test on the returns distribution.",
    )

    return rows


def run_analysis(
    *,
    returns: np.ndarray,
    frequency: str = "daily",
    num_trials: int = 1,
    confidence: float = 0.95,
    value_type: str = "returns",
    pnl: np.ndarray | None = None,
    benchmark_returns: np.ndarray | None = None,
    flat_annual_return: float = 0.0,
    tier: str = "pro",
    parse_meta: dict | None = None,
) -> dict:
    """Run the full analysis pipeline and return a JSON-ready dict."""
    returns = np.asarray(returns, dtype=float)
    ppy = periods_per_year(frequency)
    n = len(returns)

    # --- engine ------------------------------------------------------------
    stats = estats.basic_stats(returns, ppy, pnl=pnl)
    dist = edist.distribution_diagnostics(returns, ppy)
    sharpe = esharpe.sharpe_diagnostics(
        returns, ppy, n_trials=num_trials, confidence=confidence
    )
    overfit = eoverfit.overfit_diagnostics(returns, ppy)
    bench = ebench.compare_to_benchmark(
        returns, ppy, benchmark_returns, flat_annual_return
    )

    paid = tier in ("pro", "paid", "premium")
    # Bootstrap (resample with replacement) varies both the outcome AND the
    # ordering, so the final-return distribution and percentile are meaningful.
    # (A pure reshuffle leaves the compounded final return unchanged.)
    mc = emc.monte_carlo(returns, n_sims=2000, method="bootstrap") if paid else None

    verdict = everdict.build_verdict(
        sharpe=sharpe, overfit=overfit, benchmark=bench, n_observations=n
    )

    # Trade-dependency / outlier-concentration test (free -- a core honesty
    # hook). Treats each observation as a trade/period.
    dep_unit = "trades" if (parse_meta or {}).get("data_kind") == "trades" else "periods"
    trade_dependency = edependency.trade_dependency(returns, unit=dep_unit)

    # Risk of ruin, read off the Monte Carlo paths (Pro -- derived from the
    # paid simulation). None on the free tier; the UI shows a locked teaser.
    risk_of_ruin = (
        eruin.risk_of_ruin(mc["max_drawdown_samples"], mc["final_return_samples"])
        if mc else None
    )

    # --- chart data --------------------------------------------------------
    strat_curve = estats.equity_curve(returns)
    dd = estats.drawdown_series(returns)
    charts = {
        "equity": {
            "x": list(range(len(strat_curve))),
            "strategy": [_safe(v) for v in strat_curve.tolist()],
            "benchmark": [_safe(v) for v in bench["benchmark_equity_curve"]],
        },
        "drawdown": {
            "x": list(range(len(dd))),
            "drawdown": [_safe(v) for v in dd.tolist()],
        },
        "histogram": _histogram(returns),
        "rolling_sharpe": _rolling_sharpe(returns, ppy, window=max(20, n // 8)),
        "monte_carlo": mc["cone"] if mc else None,
    }

    explanations = _build_explanations(
        stats=stats, dist=dist, sharpe=sharpe, overfit=overfit,
        mc=mc, bench=bench, ppy=ppy,
    )

    # --- JSON-safety pass on nested dicts ---------------------------------
    def clean(obj):
        if isinstance(obj, dict):
            return {k: clean(v) for k, v in obj.items()}
        if isinstance(obj, (list, tuple)):
            return [clean(v) for v in obj]
        if isinstance(obj, (np.integer,)):
            return int(obj)
        if isinstance(obj, (np.floating, float)):
            return _safe(obj)
        if isinstance(obj, (np.bool_,)):
            return bool(obj)
        return obj

    result = {
        "meta": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "frequency": frequency,
            "periods_per_year": ppy,
            "num_trials": num_trials,
            "confidence": confidence,
            "value_type": value_type,
            "n_observations": n,
            "tier": tier,
            "parse": parse_meta or {},
        },
        "verdict": verdict,
        "stats": stats,
        "distribution": dist,
        "sharpe": sharpe,
        "overfit": overfit,
        "monte_carlo": mc,
        "benchmark": bench,
        "trade_dependency": trade_dependency,
        "risk_of_ruin": risk_of_ruin,
        "charts": charts,
        "explanations": explanations,
        "gating": {
            "tier": tier,
            "paid_features": PAID_FEATURES,
            "locked": [] if paid else PAID_FEATURES,
        },
    }

    if not paid:
        _redact_for_free(result)

    return clean(result)


# Explanation rows that belong to the paid tier (stripped for free users).
_PRO_EXPLANATION_KEYS = {"dsr", "pbo", "montecarlo", "haircut"}


def _redact_for_free(result: dict) -> None:
    """Remove paid data from the payload so free users can't read it off the wire.

    The verdict (and its plain-English reasons) stays free -- that's the hook --
    but the detailed Deflated Sharpe / PBO / haircut numbers, the Monte Carlo
    analysis, and the PDF are reserved for Pro. Each removed block is replaced
    with a ``{"locked": True}`` marker so the UI can render a lock + upsell.
    """
    sharpe = result.get("sharpe", {})
    sharpe["dsr"] = {"locked": True}
    sharpe["haircut_sharpe"] = {"locked": True}

    overfit = result.get("overfit", {})
    overfit["pbo"] = {"locked": True}

    result["monte_carlo"] = None
    if isinstance(result.get("charts"), dict):
        result["charts"]["monte_carlo"] = None

    result["explanations"] = [
        row for row in result.get("explanations", [])
        if row.get("key") not in _PRO_EXPLANATION_KEYS
    ]
