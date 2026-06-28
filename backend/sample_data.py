"""Built-in sample datasets so users (and tests) see both verdicts instantly.

Two strategies, generated deterministically:

* ``overfit``  -- spectacular in-sample, collapses out-of-sample, "found" after
  50 trials. Should produce a RED verdict.
* ``robust``   -- modest, consistent across both halves, only a couple of
  trials, beats buy-and-hold. Should produce a GREEN verdict.
"""
from __future__ import annotations

import numpy as np


def _standardized(rng: np.random.Generator, n: int) -> np.ndarray:
    """Draw n values, then force mean 0 / std 1 so realized stats are exact."""
    x = rng.normal(0.0, 1.0, n)
    x -= x.mean()
    x /= x.std(ddof=1)
    return x


def _series(rng, n, vol, per_period_sharpe):
    """Series with an *exact* realized per-period Sharpe and volatility."""
    z = _standardized(rng, n)
    return vol * z + per_period_sharpe * vol


def _overfit_returns() -> np.ndarray:
    rng = np.random.default_rng(7)
    n_half = 252
    # In-sample: gorgeous (per-period Sharpe ~0.20 -> annualized ~3.2).
    is_ret = _series(rng, n_half, vol=0.008, per_period_sharpe=0.20)
    # Out-of-sample: it falls apart (per-period Sharpe -0.10 -> annualized ~-1.6).
    oos_ret = _series(rng, n_half, vol=0.013, per_period_sharpe=-0.10)
    return np.concatenate([is_ret, oos_ret])


def _robust_returns() -> np.ndarray:
    rng = np.random.default_rng(20)
    n = 504
    # Same distribution throughout (per-period Sharpe ~0.11 -> annualized ~1.75)
    # so in- and out-of-sample stay consistent.
    return _series(rng, n, vol=0.0065, per_period_sharpe=0.11)


def _benchmark_returns(n: int, seed: int, annual: float) -> np.ndarray:
    rng = np.random.default_rng(seed)
    per_period = (1.0 + annual) ** (1.0 / 252) - 1.0
    return rng.normal(per_period, 0.009, n)


SAMPLES = {
    "overfit": {
        "name": "Overfit EA (50 variations tested)",
        "description": (
            "A classic data-mined strategy: a beautiful in-sample equity curve "
            "that falls apart out-of-sample. The author admits testing 50 "
            "variations before keeping this one."
        ),
        "frequency": "daily",
        "value_type": "returns",
        "num_trials": 50,
        "confidence": 0.95,
        "expected_verdict": "red",
    },
    "robust": {
        "name": "Robust trend filter (2 variations tested)",
        "description": (
            "A modest but consistent strategy with similar performance in both "
            "halves of the sample, only a couple of variations tested, and a "
            "clear edge over buy-and-hold."
        ),
        "frequency": "daily",
        "value_type": "returns",
        "num_trials": 2,
        "confidence": 0.95,
        "expected_verdict": "green",
    },
}


def get_sample(name: str = "overfit") -> dict:
    """Return a ready-to-analyze sample payload."""
    if name not in SAMPLES:
        raise KeyError(f"Unknown sample '{name}'. Options: {list(SAMPLES)}")
    meta = dict(SAMPLES[name])
    if name == "overfit":
        returns = _overfit_returns()
        bench = _benchmark_returns(len(returns), seed=99, annual=0.08)
    else:
        returns = _robust_returns()
        bench = _benchmark_returns(len(returns), seed=101, annual=0.03)

    meta["returns"] = returns.tolist()
    meta["benchmark_returns"] = bench.tolist()
    meta["csv"] = "return\n" + "\n".join(f"{r:.6f}" for r in returns)
    return meta


def list_samples() -> list[dict]:
    return [
        {"key": k, "name": v["name"], "description": v["description"],
         "expected_verdict": v["expected_verdict"], "num_trials": v["num_trials"]}
        for k, v in SAMPLES.items()
    ]
