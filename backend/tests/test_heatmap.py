"""Tests for the returns-over-time heatmap."""
import math

import numpy as np
import pytest

from engine import heatmap


def test_daily_buckets_into_months():
    rng = np.random.default_rng(0)
    r = rng.normal(0.0005, 0.01, size=300)  # ~14 months of daily data
    out = heatmap.returns_heatmap(r, "daily")
    assert out["available"] is True
    assert out["unit"] == "month"
    assert out["n_buckets"] == math.ceil(300 / 21)  # 15 monthly buckets
    # every row has exactly `cols` cells (padded with None)
    assert all(len(row["cells"]) == out["cols"] for row in out["rows"])
    assert 0.0 <= out["positive_share"] <= 1.0
    assert out["max_abs"] >= 0.0


def test_per_trade_falls_back_to_segments():
    rng = np.random.default_rng(1)
    r = rng.normal(0.01, 0.05, size=500)
    out = heatmap.returns_heatmap(r, "per_trade")
    assert out["available"] is True
    assert out["unit"] == "period"
    assert out["n_buckets"] >= 12


def test_bucket_compounding_matches():
    # 24 monthly observations -> 24 single-month buckets equal to the inputs
    r = np.array([0.01, -0.02] * 12, dtype=float)
    out = heatmap.returns_heatmap(r, "monthly")
    assert out["unit"] == "month"
    flat = [c for row in out["rows"] for c in row["cells"] if c is not None]
    assert len(flat) == 24
    assert flat[0] == pytest.approx(0.01)
    assert flat[1] == pytest.approx(-0.02)


def test_too_few_unavailable():
    out = heatmap.returns_heatmap(np.array([0.01, 0.02, -0.01]), "daily")
    assert out["available"] is False


def test_run_analysis_gates_heatmap():
    import analysis
    rng = np.random.default_rng(2)
    r = rng.normal(0.001, 0.02, size=250)
    pro = analysis.run_analysis(returns=r, frequency="daily", tier="pro")
    assert pro["returns_over_time"]["available"] is True
    assert pro["returns_over_time"]["unit"] == "month"
    # free tier sees only the verdict
    free = analysis.run_analysis(returns=r, frequency="daily", tier="free")
    assert free["returns_over_time"] is None
    assert free["gating"]["verdict_only"] is True
