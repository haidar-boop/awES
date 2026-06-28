"""Overfitting checks: in/out-of-sample degradation and a single-series PBO.

The split-sample test is the workhorse and is exact. The PBO routine is a
single-series approximation of CSCV (Bailey et al., 2014) -- the full method
needs a matrix of *many* candidate strategies, which a single uploaded series
does not provide. We label it clearly as an approximation everywhere it
surfaces.
"""
from __future__ import annotations

from itertools import combinations

import numpy as np

from .stats import sharpe_per_period, sharpe_annualized, total_return


def in_out_sample_split(
    returns: np.ndarray, periods_per_year: float, split: float = 0.5
) -> dict:
    """Split the series, compare Sharpe in each half, report the degradation.

    ``split`` is the fraction used for in-sample (0.5 == first-half/second-half,
    0.7 == 70/30).
    """
    returns = np.asarray(returns, dtype=float)
    n = len(returns)
    cut = int(round(n * split))
    cut = max(1, min(cut, n - 1))
    is_ret = returns[:cut]
    oos_ret = returns[cut:]

    is_sr = sharpe_annualized(is_ret, periods_per_year)
    oos_sr = sharpe_annualized(oos_ret, periods_per_year)

    if is_sr != 0:
        degradation = (is_sr - oos_sr) / abs(is_sr)
    else:
        degradation = 0.0

    return {
        "split_fraction": split,
        "in_sample": {
            "n": int(cut),
            "sharpe_annualized": float(is_sr),
            "total_return": float(total_return(is_ret)),
        },
        "out_of_sample": {
            "n": int(n - cut),
            "sharpe_annualized": float(oos_sr),
            "total_return": float(total_return(oos_ret)),
        },
        "sharpe_degradation": float(degradation),
        # A drop of >50% of the in-sample Sharpe is a classic overfit red flag.
        "overfit_flag": bool(degradation > 0.5 or (is_sr > 0 and oos_sr <= 0)),
    }


def pbo_single_series(
    returns: np.ndarray, n_chunks: int = 10
) -> dict:
    """Single-series approximation of the Probability of Backtest Overfitting.

    Method (clearly an approximation of CSCV for the one-strategy case):
    split the series into ``n_chunks`` contiguous chunks, enumerate every way
    of choosing half the chunks as in-sample (the rest out-of-sample), and for
    each partition measure whether the strategy that *looked good in-sample*
    (positive IS Sharpe) actually *fails out-of-sample* (OOS Sharpe <= 0).

    PBO is the fraction of partitions exhibiting that IS-good / OOS-bad flip.
    High PBO => the apparent edge does not generalise across sub-periods.
    """
    returns = np.asarray(returns, dtype=float)
    n = len(returns)
    # Need an even number of chunks for symmetric IS/OOS partitions.
    if n_chunks % 2 == 1:
        n_chunks += 1
    n_chunks = max(4, min(n_chunks, n))
    if n // n_chunks < 2:
        n_chunks = max(4, n // 2)
        if n_chunks % 2 == 1:
            n_chunks -= 1
    if n_chunks < 4:
        return {
            "pbo": None,
            "n_chunks": n_chunks,
            "n_partitions": 0,
            "note": "Not enough observations for a reliable PBO estimate.",
            "approximation": True,
        }

    chunks = np.array_split(returns, n_chunks)
    idx = list(range(n_chunks))
    half = n_chunks // 2

    flips = 0
    total = 0
    logits = []
    for is_idx in combinations(idx, half):
        is_set = set(is_idx)
        oos_idx = [i for i in idx if i not in is_set]
        is_ret = np.concatenate([chunks[i] for i in is_idx])
        oos_ret = np.concatenate([chunks[i] for i in oos_idx])
        is_sr = sharpe_per_period(is_ret)
        oos_sr = sharpe_per_period(oos_ret)
        total += 1
        # Logit of relative OOS performance vs in-sample (sign-based proxy).
        if is_sr > 0 and oos_sr <= 0:
            flips += 1
        logits.append(oos_sr - is_sr)

    pbo = flips / total if total else None
    return {
        "pbo": float(pbo) if pbo is not None else None,
        "n_chunks": int(n_chunks),
        "n_partitions": int(total),
        "mean_oos_minus_is_sharpe": float(np.mean(logits)) if logits else 0.0,
        "approximation": True,
        "note": (
            "Single-series CSCV approximation. True CSCV requires many "
            "candidate strategies; here we measure how often an in-sample edge "
            "disappears out-of-sample across combinatorial sub-period splits."
        ),
    }


def overfit_diagnostics(
    returns: np.ndarray, periods_per_year: float, split: float = 0.5
) -> dict:
    return {
        "split_sample": in_out_sample_split(returns, periods_per_year, split),
        "pbo": pbo_single_series(returns),
    }
