from __future__ import annotations


def test_login_invalid_credentials(client):
    resp = client.post(
        "/api/v1/auth/login?tenant_id=00000000-0000-0000-0000-000000000000",
        json={"username": "nobody@test.com", "password": "wrong"},
    )
    assert resp.status_code == 401


def test_login_success(client, superuser):
    resp = client.post(
        "/api/v1/auth/login?tenant_id=00000000-0000-0000-0000-000000000000",
        json={"username": "admin@afruheritage.com", "password": "TestPassword123!"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["tenant_id"] is None


def test_register_auto_assigns_tenant_id(client):
    resp = client.post(
        "/api/v1/auth/register?tenant_id=00000000-0000-0000-0000-000000000000",
        json={
            "email": "tenant-admin@example.com",
            "password": "TestPassword123!",
            "full_name": "Tenant Admin",
            "company_name": "Tenant Admin Logistics",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["tenant_id"] is not None


def test_me_unauthenticated(client):
    resp = client.get("/api/v1/auth/me?tenant_id=00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 401


def test_me_authenticated(client, auth_headers):
    resp = client.get("/api/v1/auth/me?tenant_id=00000000-0000-0000-0000-000000000000", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "admin@afruheritage.com"
    assert data["is_superuser"] is True
