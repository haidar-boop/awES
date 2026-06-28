"""Basic performance statistics.

All functions take a 1-D numpy array of per-period simple returns unless noted.
``periods_per_year`` is the annualization factor (252 daily, 12 monthly, ...).
"""
from __future__ import annotations

import numpy as np

# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def equity_curve(returns: np.ndarray, starting_value: float = 1.0) -> np.ndarray:
    """Cumulative equity curve from a returns series (length == len(returns)+1).

    The first element is ``starting_value`` so the curve includes the initial
    point before the first return is applied.
    """
    returns = np.asarray(returns, dtype=float)
    curve = starting_value * np.cumprod(1.0 + returns)
    return np.concatenate([[starting_value], curve])


def returns_from_equity(equity: np.ndarray) -> np.ndarray:
    """Convert an equity curve into a simple-returns series."""
    equity = np.asarray(equity, dtype=float)
    return equity[1:] / equity[:-1] - 1.0


# ---------------------------------------------------------------------------
# return / volatility
# ---------------------------------------------------------------------------

def total_return(returns: np.ndarray) -> float:
    returns = np.asarray(returns, dtype=float)
    return float(np.prod(1.0 + returns) - 1.0)


def cagr(returns: np.ndarray, periods_per_year: float) -> float:
    """Compound annual growth rate."""
    returns = np.asarray(returns, dtype=float)
    n = len(returns)
    if n == 0:
        return 0.0
    growth = float(np.prod(1.0 + returns))
    if growth <= 0:
        # Total wipe-out (or worse); CAGR is -100%.
        return -1.0
    years = n / periods_per_year
    if years <= 0:
        return 0.0
    return growth ** (1.0 / years) - 1.0


def annualized_volatility(returns: np.ndarray, periods_per_year: float) -> float:
    returns = np.asarray(returns, dtype=float)
    if len(returns) < 2:
        return 0.0
    return float(np.std(returns, ddof=1) * np.sqrt(periods_per_year))


# ---------------------------------------------------------------------------
# Sharpe family
# ---------------------------------------------------------------------------

def sharpe_per_period(returns: np.ndarray, rf_per_period: float = 0.0) -> float:
    """Non-annualized (per-period) Sharpe ratio.

    This is the ``SR_hat`` consumed by PSR / DSR / MinTRL.
    """
    returns = np.asarray(returns, dtype=float)
    if len(returns) < 2:
        return 0.0
    excess = returns - rf_per_period
    sd = np.std(excess, ddof=1)
    if sd == 0:
        return 0.0
    return float(np.mean(excess) / sd)


def sharpe_annualized(
    returns: np.ndarray, periods_per_year: float, rf_per_period: float = 0.0
) -> float:
    """Annualized Sharpe = per-period Sharpe * sqrt(periods_per_year)."""
    return sharpe_per_period(returns, rf_per_period) * np.sqrt(periods_per_year)


def sortino_ratio(
    returns: np.ndarray, periods_per_year: float, target: float = 0.0
) -> float:
    """Annualized Sortino ratio (downside-deviation based)."""
    returns = np.asarray(returns, dtype=float)
    if len(returns) < 2:
        return 0.0
    excess = returns - target
    downside = np.minimum(excess, 0.0)
    # Downside deviation uses N in the denominator (standard convention).
    dd = np.sqrt(np.mean(downside ** 2))
    if dd == 0:
        return 0.0
    return float(np.mean(excess) / dd * np.sqrt(periods_per_year))


def calmar_ratio(returns: np.ndarray, periods_per_year: float) -> float:
    """CAGR / |max drawdown|."""
    mdd = max_drawdown(returns)
    if mdd == 0:
        return 0.0
    return cagr(returns, periods_per_year) / abs(mdd)


# ---------------------------------------------------------------------------
# drawdowns
# ---------------------------------------------------------------------------

def drawdown_series(returns: np.ndarray) -> np.ndarray:
    """Drawdown at each point of the equity curve (<= 0)."""
    curve = equity_curve(returns)
    running_max = np.maximum.accumulate(curve)
    return curve / running_max - 1.0


def max_drawdown(returns: np.ndarray) -> float:
    dd = drawdown_series(returns)
    return float(dd.min()) if len(dd) else 0.0


def average_drawdown(returns: np.ndarray) -> float:
    """Mean of the (negative) drawdown values while underwater."""
    dd = drawdown_series(returns)
    underwater = dd[dd < 0]
    if len(underwater) == 0:
        return 0.0
    return float(underwater.mean())


def longest_drawdown_duration(returns: np.ndarray) -> int:
    """Longest run (in periods) the curve spent below a prior peak."""
    dd = drawdown_series(returns)
    longest = 0
    current = 0
    for d in dd:
        if d < 0:
            current += 1
            longest = max(longest, current)
        else:
            current = 0
    return int(longest)


# ---------------------------------------------------------------------------
# trade-level metrics
# ---------------------------------------------------------------------------

def trade_stats(pnl: np.ndarray) -> dict:
    """Win rate / profit factor / expectancy etc. from per-trade P&L.

    ``pnl`` is a series of per-trade profit/loss values (currency or R units).
    """
    pnl = np.asarray(pnl, dtype=float)
    n = len(pnl)
    if n == 0:
        return {}
    wins = pnl[pnl > 0]
    losses = pnl[pnl < 0]
    gross_win = float(wins.sum())
    gross_loss = float(-losses.sum())
    win_rate = len(wins) / n
    avg_win = float(wins.mean()) if len(wins) else 0.0
    avg_loss = float(losses.mean()) if len(losses) else 0.0  # negative
    profit_factor = (gross_win / gross_loss) if gross_loss > 0 else float("inf")
    expectancy = float(pnl.mean())
    return {
        "num_trades": int(n),
        "win_rate": win_rate,
        "profit_factor": profit_factor,
        "avg_win": avg_win,
        "avg_loss": avg_loss,
        "expectancy": expectancy,
        "gross_profit": gross_win,
        "gross_loss": gross_loss,
    }


# ---------------------------------------------------------------------------
# bundle
# ---------------------------------------------------------------------------

def basic_stats(
    returns: np.ndarray,
    periods_per_year: float,
    rf_per_period: float = 0.0,
    pnl: np.ndarray | None = None,
) -> dict:
    """Everything in 6a as a single dict."""
    returns = np.asarray(returns, dtype=float)
    out = {
        "n_observations": int(len(returns)),
        "total_return": total_return(returns),
        "cagr": cagr(returns, periods_per_year),
        "annualized_volatility": annualized_volatility(returns, periods_per_year),
        "sharpe_per_period": sharpe_per_period(returns, rf_per_period),
        "sharpe_annualized": sharpe_annualized(returns, periods_per_year, rf_per_period),
        "sortino": sortino_ratio(returns, periods_per_year),
        "calmar": calmar_ratio(returns, periods_per_year),
        "max_drawdown": max_drawdown(returns),
        "average_drawdown": average_drawdown(returns),
        "longest_drawdown_periods": longest_drawdown_duration(returns),
        "mean_return": float(np.mean(returns)) if len(returns) else 0.0,
    }
    if pnl is not None and len(pnl) > 0:
        out["trades"] = trade_stats(pnl)
    return out
