from __future__ import annotations

import pytest
import httpx
from app.core.config import settings

BASE = settings.FLEET_ENGINE_BASE_URL
API_KEY = settings.FLEET_ENGINE_API_KEY

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}

@pytest.mark.contract
def test_fleet_engine_healthcheck():
    """Fleet Engine must expose a health endpoint."""
    r = httpx.get(f"{BASE}/health", timeout=10)
    assert r.status_code == 200
    assert r.json().get("status") in {"ok", "healthy"}

@pytest.mark.contract
def test_fleet_engine_auth_rejects_invalid_key():
    """Invalid API keys must be rejected."""
    r = httpx.get(
        f"{BASE}/health",
        headers={"Authorization": "Bearer INVALID"},
        timeout=10,
    )
    assert r.status_code in {401, 403}

@pytest.mark.contract
def test_fleet_engine_list_drivers_requires_tenant(tenant_id="test-tenant"):
    """Driver listing must be tenant-scoped."""
    r = httpx.get(
        f"{BASE}/tenants/{tenant_id}/drivers",
        headers=HEADERS,
        timeout=10,
    )
    assert r.status_code in {200, 204}
    assert isinstance(r.json(), list)

@pytest.mark.contract
def test_fleet_engine_create_driver(tenant_id="test-tenant"):
    """Creating a driver must work and return a valid object."""
    payload = {
        "name": "Contract Test Driver",
        "phone": "+15555550123",
    }
    r = httpx.post(
        f"{BASE}/tenants/{tenant_id}/drivers",
        headers=HEADERS,
        json=payload,
        timeout=10,
    )
    assert r.status_code in {200, 201}
    data = r.json()
    assert "id" in data
    assert data["name"] == payload["name"]

@pytest.mark.contract
def test_fleet_engine_driver_isolation():
    """Drivers must not leak across tenants."""
    tenant_a = "tenant-a"
    tenant_b = "tenant-b"

    # Create driver in tenant A
    r = httpx.post(
        f"{BASE}/tenants/{tenant_a}/drivers",
        headers=HEADERS,
        json={"name": "Isolation Test"},
        timeout=10,
    )
    assert r.status_code in {200, 201}
    driver_id = r.json()["id"]

    # Try to fetch from tenant B
    r2 = httpx.get(
        f"{BASE}/tenants/{tenant_b}/drivers/{driver_id}",
        headers=HEADERS,
        timeout=10,
    )
    assert r2.status_code in {404, 403}
