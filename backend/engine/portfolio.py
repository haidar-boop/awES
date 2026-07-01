"""Portfolio combination + correlation.

Combines several strategies' return streams into one weighted portfolio and
measures how correlated they are. The honest point: stacking strategies only
diversifies if they're not all the same bet -- highly correlated strategies
share drawdowns, so the "portfolio" is an illusion of safety.
"""
from __future__ import annotations

import numpy as np


def align_returns(returns_list: list[np.ndarray]) -> tuple[list[np.ndarray], int]:
    """Trim every series to the shared length, aligned to the most recent end."""
    arrs = [np.asarray(r, dtype=float) for r in returns_list]
    arrs = [a[np.isfinite(a)] for a in arrs]
    m = min((len(a) for a in arrs), default=0)
    return [a[-m:] for a in arrs], int(m)


def correlation_matrix(aligned: list[np.ndarray]) -> list[list[float]]:
    if len(aligned) < 2 or len(aligned[0]) < 2:
        k = len(aligned)
        return [[1.0 if i == j else 0.0 for j in range(k)] for i in range(k)]
    R = np.vstack(aligned)
    C = np.corrcoef(R)
    C = np.nan_to_num(C, nan=0.0)  # constant series -> undefined corr -> 0
    return [[float(x) for x in row] for row in C]


def combine(aligned: list[np.ndarray], weights: list[float]) -> np.ndarray:
    """Weighted, periodically-rebalanced portfolio return stream."""
    w = np.asarray(weights, dtype=float)
    w = np.abs(w)
    s = w.sum()
    w = (w / s) if s > 0 else np.full(len(aligned), 1.0 / len(aligned))
    R = np.vstack(aligned)
    return (w[:, None] * R).sum(axis=0)


def normalized_weights(weights: list[float], n: int) -> list[float]:
    w = np.abs(np.asarray(weights, dtype=float))
    s = w.sum()
    w = (w / s) if s > 0 else np.full(n, 1.0 / n)
    return [float(x) for x in w]


def average_offdiagonal(matrix: list[list[float]]) -> float:
    C = np.asarray(matrix, dtype=float)
    k = C.shape[0]
    if k < 2:
        return 0.0
    mask = ~np.eye(k, dtype=bool)
    return float(C[mask].mean())


def diversification(avg_corr: float) -> tuple[str, str]:
    """(status, message) from the average pairwise correlation."""
    if avg_corr < 0.3:
        return ("pass", (
            f"Average pairwise correlation is {avg_corr:.2f} -- the strategies are "
            f"largely independent, so combining them genuinely diversifies risk."
        ))
    if avg_corr < 0.7:
        return ("warn", (
            f"Average pairwise correlation is {avg_corr:.2f} -- partly overlapping. "
            f"You get some diversification, but they'll share part of their drawdowns."
        ))
    return ("fail", (
        f"Average pairwise correlation is {avg_corr:.2f} -- these are largely the "
        f"same bet. Combining them is an illusion of safety; they sink together."
    ))
