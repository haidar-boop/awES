"""Probabilistic / Deflated Sharpe ratios -- the differentiators.

Everything here consumes the **per-period** Sharpe ratio ``SR_hat`` together
with the higher moments ``g3`` (skew) and ``g4`` (non-excess kurtosis, normal
== 3). These adjust the Sharpe's sampling distribution for non-normality.

References
----------
* Bailey & Lopez de Prado, "The Sharpe Ratio Efficient Frontier" (2012) -- PSR/MinTRL
* Bailey & Lopez de Prado, "The Deflated Sharpe Ratio" (2014) -- DSR
* Harvey & Liu, "Backtesting" (2015) -- haircut Sharpe
"""
from __future__ import annotations

import math

import numpy as np
from scipy.stats import norm

GAMMA = 0.5772156649015329  # Euler-Mascheroni constant
E = math.e


def _psr_denominator(sr_hat: float, g3: float, g4: float) -> float:
    """sqrt( 1 - g3*SR + ((g4-1)/4)*SR^2 ) -- the std-dev of the SR estimator.

    Clamped to a small positive number to stay numerically safe.
    """
    inner = 1.0 - g3 * sr_hat + ((g4 - 1.0) / 4.0) * sr_hat ** 2
    return math.sqrt(max(inner, 1e-12))


def probabilistic_sharpe_ratio(
    sr_hat: float, n: int, g3: float, g4: float, sr_benchmark: float = 0.0
) -> float:
    """PSR(SR*): probability the *true* per-period Sharpe exceeds ``sr_benchmark``.

    ::

        PSR(SR*) = Phi( (SR_hat - SR*) * sqrt(n - 1)
                        / sqrt(1 - g3*SR_hat + ((g4 - 1)/4)*SR_hat^2) )
    """
    if n < 2:
        return 0.0
    denom = _psr_denominator(sr_hat, g3, g4)
    z = (sr_hat - sr_benchmark) * math.sqrt(n - 1) / denom
    return float(norm.cdf(z))


def expected_max_sharpe(n_trials: int, variance_sr: float) -> float:
    """Expected maximum per-period Sharpe from ``n_trials`` *lucky* trials.

    ::

        E[max SR] = sqrt(V) * [ (1 - gamma) * Z^-1(1 - 1/N)
                                + gamma     * Z^-1(1 - 1/(N*e)) ]

    where ``V`` is the variance of Sharpe ratios across trials. This is the
    benchmark a data-mined strategy must clear -- the heart of the DSR.
    """
    n_trials = max(int(n_trials), 1)
    if n_trials == 1 or variance_sr <= 0:
        return 0.0
    z1 = norm.ppf(1.0 - 1.0 / n_trials)
    z2 = norm.ppf(1.0 - 1.0 / (n_trials * E))
    return float(math.sqrt(variance_sr) * ((1.0 - GAMMA) * z1 + GAMMA * z2))


def estimate_variance_of_sr(sr_hat: float, n: int, g3: float, g4: float) -> float:
    """Conservative fallback estimate of the cross-trial Sharpe variance ``V``.

    The DSR ideally uses the variance of Sharpe ratios *across all trials the
    researcher ran*. We only ever see one strategy's series, so when that set
    is unavailable we approximate ``V`` with the **sampling variance of the
    Sharpe estimator** for this strategy::

        Var(SR_hat) = (1 - g3*SR_hat + ((g4 - 1)/4)*SR_hat^2) / (n - 1)

    This is a documented, conservative proxy: it ties the assumed dispersion of
    the trials to how noisy a single Sharpe estimate is at this sample size.
    """
    if n < 2:
        return 0.0
    inner = 1.0 - g3 * sr_hat + ((g4 - 1.0) / 4.0) * sr_hat ** 2
    return max(inner, 1e-12) / (n - 1)


def deflated_sharpe_ratio(
    sr_hat: float,
    n: int,
    g3: float,
    g4: float,
    n_trials: int,
    variance_sr: float | None = None,
) -> dict:
    """DSR = PSR with the benchmark set to the luck-implied expected max Sharpe.

    Returns the deflated probability plus the intermediate pieces so the UI can
    explain *why* the number moved.
    """
    if variance_sr is None:
        variance_sr = estimate_variance_of_sr(sr_hat, n, g3, g4)
        variance_estimated = True
    else:
        variance_estimated = False

    sr_benchmark = expected_max_sharpe(n_trials, variance_sr)
    dsr = probabilistic_sharpe_ratio(sr_hat, n, g3, g4, sr_benchmark=sr_benchmark)
    return {
        "dsr": dsr,
        "expected_max_sharpe": sr_benchmark,
        "n_trials": int(n_trials),
        "variance_sr": float(variance_sr),
        "variance_estimated": variance_estimated,
    }


def min_track_record_length(
    sr_hat: float,
    g3: float,
    g4: float,
    sr_benchmark: float = 0.0,
    confidence: float = 0.95,
) -> float:
    """Minimum number of observations to be ``confidence`` sure SR > benchmark.

    ::

        MinTRL = 1 + [1 - g3*SR + ((g4-1)/4)*SR^2] * ( Z^-1(p) / (SR - SR*) )^2

    Returns ``inf`` when the strategy's Sharpe does not exceed the benchmark
    (you can never get confident about an edge that isn't there).
    """
    if sr_hat <= sr_benchmark:
        return float("inf")
    inner = 1.0 - g3 * sr_hat + ((g4 - 1.0) / 4.0) * sr_hat ** 2
    inner = max(inner, 1e-12)
    z = norm.ppf(confidence)
    return float(1.0 + inner * (z / (sr_hat - sr_benchmark)) ** 2)


def haircut_sharpe(
    sr_hat: float, n: int, n_trials: int, method: str = "bonferroni"
) -> dict:
    """Harvey & Liu multiple-testing haircut.

    Inflate the strategy's p-value for the number of trials, then back out the
    Sharpe that p-value implies. The haircut is the fractional reduction.
    """
    if n < 2:
        return {"haircut": 0.0, "adjusted_sharpe": sr_hat, "p_value": 1.0,
                "adjusted_p_value": 1.0}
    # t-stat for the Sharpe under IID-normal: t = SR_hat * sqrt(n).
    t_stat = sr_hat * math.sqrt(n)
    p_single = float(norm.sf(t_stat))  # one-sided

    n_trials = max(int(n_trials), 1)
    if method == "bonferroni":
        p_adj = min(1.0, p_single * n_trials)
    else:  # treat anything else as a (single-strategy) Holm == Bonferroni here
        p_adj = min(1.0, p_single * n_trials)

    # Convert adjusted p-value back to an implied Sharpe.
    if p_adj >= 1.0:
        adj_sr = 0.0
    else:
        t_adj = norm.isf(p_adj)
        adj_sr = t_adj / math.sqrt(n)
    haircut = 1.0 - (adj_sr / sr_hat) if sr_hat > 0 else 1.0
    return {
        "haircut": float(max(0.0, min(1.0, haircut))),
        "adjusted_sharpe": float(adj_sr),
        "p_value": p_single,
        "adjusted_p_value": float(p_adj),
        "method": method,
    }


def sharpe_diagnostics(
    returns: np.ndarray,
    periods_per_year: float,
    n_trials: int = 1,
    confidence: float = 0.95,
    sr_benchmark: float = 0.0,
) -> dict:
    """Bundle PSR / DSR / MinTRL / haircut for a returns series."""
    from .stats import sharpe_per_period, sharpe_annualized
    from .distribution import skewness, kurtosis_nonexcess

    returns = np.asarray(returns, dtype=float)
    n = len(returns)
    sr_hat = sharpe_per_period(returns)
    g3 = skewness(returns)
    g4 = kurtosis_nonexcess(returns)

    psr = probabilistic_sharpe_ratio(sr_hat, n, g3, g4, sr_benchmark=sr_benchmark)
    dsr = deflated_sharpe_ratio(sr_hat, n, g3, g4, n_trials)
    mintrl = min_track_record_length(sr_hat, g3, g4, sr_benchmark, confidence)
    haircut = haircut_sharpe(sr_hat, n, n_trials)

    return {
        "per_period_sharpe": sr_hat,
        "annualized_sharpe": sharpe_annualized(returns, periods_per_year),
        "skew": g3,
        "kurtosis": g4,
        "n_observations": n,
        "confidence": confidence,
        "psr": psr,
        "dsr": dsr,
        "min_track_record_length": mintrl,
        "extra_periods_needed": (
            max(0.0, mintrl - n) if math.isfinite(mintrl) else float("inf")
        ),
        "haircut_sharpe": haircut,
    }
