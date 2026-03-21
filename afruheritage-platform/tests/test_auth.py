from __future__ import annotations


def test_login_invalid_credentials(client):
    resp = client.post(
        "/api/v1/auth/login",
        json={"username": "nobody@test.com", "password": "wrong"},
    )
    assert resp.status_code == 401


def test_login_success(client, superuser):
    resp = client.post(
        "/api/v1/auth/login",
        json={"username": "admin@afruheritage.com", "password": "TestPassword123!"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_me_unauthenticated(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401


def test_me_authenticated(client, auth_headers):
    resp = client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "admin@afruheritage.com"
    assert data["is_superuser"] is True
