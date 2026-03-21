from __future__ import annotations


def test_create_tenant_unauthenticated(client):
    resp = client.post("/api/v1/tenants", json={
        "company_name": "Test Corp",
        "contact_email": "test@example.com",
        "plan_code": "starter",
        "requested_domain": "testcorp.afruheritage.com",
        "domain_type": "provider_subdomain",
    })
    assert resp.status_code == 401


def test_create_tenant_success(client, auth_headers):
    resp = client.post(
        "/api/v1/tenants",
        json={
            "company_name": "Test Corp",
            "contact_email": "test@example.com",
            "plan_code": "starter",
            "requested_domain": "testcorp.afruheritage.com",
            "domain_type": "provider_subdomain",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["company_name"] == "Test Corp"
    assert data["slug"] == "test-corp"
    assert data["launch_status"] == "pending_verification"


def test_create_tenant_duplicate(client, auth_headers):
    payload = {
        "company_name": "Test Corp",
        "contact_email": "test@example.com",
        "plan_code": "starter",
        "requested_domain": "testcorp.afruheritage.com",
        "domain_type": "provider_subdomain",
    }
    client.post("/api/v1/tenants", json=payload, headers=auth_headers)
    resp = client.post("/api/v1/tenants", json=payload, headers=auth_headers)
    assert resp.status_code == 409


def test_list_tenants(client, auth_headers):
    resp = client.get("/api/v1/tenants", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_list_tenants_unauthenticated(client):
    resp = client.get("/api/v1/tenants")
    assert resp.status_code == 401
