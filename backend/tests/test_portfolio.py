"""Tests for portfolio combination + correlation."""
import numpy as np
import pytest

from engine import portfolio


def test_align_trims_to_shared_length():
    aligned, m = portfolio.align_returns([np.arange(10.0), np.arange(7.0)])
    assert m == 7
    assert all(len(a) == 7 for a in aligned)
    # trailing alignment keeps the most recent values
    assert aligned[0][-1] == 9.0


def test_correlation_identity_for_same_series():
    rng = np.random.default_rng(0)
    a = rng.normal(0, 0.01, 100)
    C = portfolio.correlation_matrix([a, a.copy()])
    assert C[0][0] == pytest.approx(1.0)
    assert C[0][1] == pytest.approx(1.0)  # identical -> perfectly correlated


def test_correlation_low_for_independent():
    rng = np.random.default_rng(1)
    a = rng.normal(0, 0.01, 2000)
    b = rng.normal(0, 0.01, 2000)
    C = portfolio.correlation_matrix([a, b])
    assert abs(C[0][1]) < 0.1  # independent -> ~0


def test_combine_is_weighted_average():
    a = np.full(20, 0.02)
    b = np.full(20, -0.01)
    out = portfolio.combine([a, b], [1.0, 1.0])  # equal weight
    assert np.allclose(out, 0.005)
    out2 = portfolio.combine([a, b], [3.0, 1.0])  # 75/25
    assert np.allclose(out2, 0.75 * 0.02 + 0.25 * -0.01)


def test_average_offdiagonal_and_diversification():
    C = [[1.0, 0.9], [0.9, 1.0]]
    assert portfolio.average_offdiagonal(C) == 0.9
    status, _ = portfolio.diversification(0.9)
    assert status == "fail"
    assert portfolio.diversification(0.1)[0] == "pass"
    assert portfolio.diversification(0.5)[0] == "warn"


def test_endpoint_requires_pro(monkeypatch):
    from fastapi.testclient import TestClient
    import main, auth, payments
    client = TestClient(main.app)
    rng = np.random.default_rng(2)
    body = {
        "strategies": [
            {"name": "A", "returns": list(rng.normal(0.001, 0.01, 60))},
            {"name": "B", "returns": list(rng.normal(0.001, 0.01, 60))},
        ],
    }
    # anonymous -> free -> 402
    monkeypatch.setattr(auth, "get_user", lambda t: None)
    assert client.post("/api/portfolio", json=body).status_code == 402

    # pro -> 200 with correlation + portfolio analysis
    monkeypatch.setattr(auth, "get_user", lambda t: {"email": "p@x.com", "verified": True})
    monkeypatch.setattr(payments, "email_has_pro", lambda e: True)
    r = client.post("/api/portfolio", json=body, headers={"Authorization": "Bearer t"})
    assert r.status_code == 200
    d = r.json()
    assert len(d["correlation"]) == 2
    assert d["portfolio"]["verdict"]["level"] in ("red", "yellow", "green")
    assert d["portfolio"]["gating"]["locked"] == []  # pro -> full
