"""Distribution diagnostics: skew, kurtosis, normality, autocorrelation.

Why this matters: the textbook Sharpe ratio assumes returns are normal and
IID (independent, identically distributed). Real strategy returns usually
have fat tails, skew, and serial correlation -- all of which make a raw
Sharpe *too optimistic*. We measure those violations and compute an
autocorrelation-adjusted Sharpe (Lo, 2002).
"""
from __future__ import annotations

import numpy as np
from scipy import stats as sp_stats

from .stats import sharpe_per_period


def skewness(returns: np.ndarray) -> float:
    """Fisher-Pearson skewness (g1). 0 for a symmetric distribution."""
    returns = np.asarray(returns, dtype=float)
    # Constant / near-constant data has no defined shape; scipy would warn on
    # the catastrophic cancellation, so short-circuit to the symmetric default.
    if len(returns) < 3 or np.std(returns) < 1e-12:
        return 0.0
    return float(sp_stats.skew(returns, bias=True))


def kurtosis_nonexcess(returns: np.ndarray) -> float:
    """Non-excess kurtosis (g4). A normal distribution has g4 == 3."""
    returns = np.asarray(returns, dtype=float)
    if len(returns) < 4 or np.std(returns) < 1e-12:
        return 3.0
    # scipy returns *excess* kurtosis by default; add 3 for non-excess.
    return float(sp_stats.kurtosis(returns, fisher=True, bias=True) + 3.0)


def jarque_bera(returns: np.ndarray) -> dict:
    """Jarque-Bera test for normality. Small p-value => reject normality."""
    returns = np.asarray(returns, dtype=float)
    if len(returns) < 4:
        return {"statistic": 0.0, "p_value": 1.0, "normal": True}
    jb, p = sp_stats.jarque_bera(returns)
    return {"statistic": float(jb), "p_value": float(p), "normal": bool(p > 0.05)}


def autocorrelation(returns: np.ndarray, max_lag: int = 10) -> list[float]:
    """Autocorrelation coefficients for lags 1..max_lag."""
    returns = np.asarray(returns, dtype=float)
    n = len(returns)
    if n < 2:
        return []
    max_lag = min(max_lag, n - 1)
    x = returns - returns.mean()
    denom = np.sum(x ** 2)
    if denom == 0:
        return [0.0] * max_lag
    acf = []
    for lag in range(1, max_lag + 1):
        num = np.sum(x[:-lag] * x[lag:])
        acf.append(float(num / denom))
    return acf


def ljung_box(returns: np.ndarray, lags: int = 10) -> dict:
    """Ljung-Box test for autocorrelation up to ``lags``.

    Small p-value => significant serial correlation (returns not IID).
    """
    returns = np.asarray(returns, dtype=float)
    n = len(returns)
    if n < 5:
        return {"statistic": 0.0, "p_value": 1.0, "autocorrelated": False, "lags": 0}
    lags = int(min(lags, n - 1))
    acf = autocorrelation(returns, max_lag=lags)
    # Q = n(n+2) * sum_{k=1}^{lags} rho_k^2 / (n-k)
    q = n * (n + 2) * sum((rho ** 2) / (n - k) for k, rho in enumerate(acf, start=1))
    p = float(sp_stats.chi2.sf(q, df=lags))
    return {
        "statistic": float(q),
        "p_value": p,
        "autocorrelated": bool(p < 0.05),
        "lags": lags,
    }


def autocorr_adjusted_sharpe(
    returns: np.ndarray, periods_per_year: float, max_lag: int | None = None
) -> dict:
    """Annualized Sharpe corrected for serial correlation (Lo, 2002).

    Standard annualization multiplies the per-period Sharpe by ``sqrt(q)``
    where ``q = periods_per_year``. Lo shows that with autocorrelation the
    correct factor is::

        eta(q) = q / sqrt( q + 2 * sum_{k=1}^{q-1} (q - k) * rho_k )

    Positive autocorrelation makes ``eta(q) < sqrt(q)``, i.e. it *lowers* the
    honest annualized Sharpe.
    """
    returns = np.asarray(returns, dtype=float)
    sr_pp = sharpe_per_period(returns)
    q = int(round(periods_per_year))
    q = max(q, 1)
    if max_lag is None:
        max_lag = q - 1
    max_lag = int(min(max_lag, len(returns) - 1, q - 1))

    naive = sr_pp * np.sqrt(q)
    if max_lag < 1:
        return {
            "per_period_sharpe": sr_pp,
            "naive_annualized": float(naive),
            "adjusted_annualized": float(naive),
            "adjustment_factor": 1.0,
        }

    acf = autocorrelation(returns, max_lag=max_lag)
    denom_inner = q + 2.0 * sum((q - k) * acf[k - 1] for k in range(1, max_lag + 1))
    if denom_inner <= 0:
        # Pathological (strong negative autocorrelation); fall back to naive.
        eta = np.sqrt(q)
    else:
        eta = q / np.sqrt(denom_inner)
    adjusted = sr_pp * eta
    factor = adjusted / naive if naive != 0 else 1.0
    return {
        "per_period_sharpe": sr_pp,
        "naive_annualized": float(naive),
        "adjusted_annualized": float(adjusted),
        "adjustment_factor": float(factor),
    }


def distribution_diagnostics(returns: np.ndarray, periods_per_year: float) -> dict:
    """Everything in 6b as a single dict."""
    return {
        "skew": skewness(returns),
        "kurtosis": kurtosis_nonexcess(returns),
        "excess_kurtosis": kurtosis_nonexcess(returns) - 3.0,
        "jarque_bera": jarque_bera(returns),
        "autocorrelation": autocorrelation(returns, max_lag=10),
        "ljung_box": ljung_box(returns, lags=min(10, max(1, len(returns) // 5))),
        "autocorr_adjusted_sharpe": autocorr_adjusted_sharpe(returns, periods_per_year),
    }
