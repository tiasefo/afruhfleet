from __future__ import annotations


def test_health_endpoint(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["service"] == "afruheritage-control-plane"


def test_health_returns_request_id(client):
    resp = client.get("/health")
    assert "x-request-id" in resp.headers
