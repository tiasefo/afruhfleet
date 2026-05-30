from __future__ import annotations

import uuid

from app.models.tenant import Tenant
from app.models.tenant_request import TenantRequest


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


def test_launch_tenant_requires_subscription_readiness(client, auth_headers):
    create_resp = client.post(
        "/api/v1/tenants",
        json={
            "company_name": "Launch Gate Corp",
            "contact_email": "launch-gate@example.com",
            "plan_code": "professional",
            "requested_domain": "launchgate.afruheritage.com",
            "domain_type": "provider_subdomain",
        },
        headers=auth_headers,
    )
    assert create_resp.status_code == 200
    tenant_id = create_resp.json()["id"]

    approve_resp = client.post(
        f"/api/v1/tenants/{tenant_id}/approve",
        json={"verification_notes": "Approved"},
        headers=auth_headers,
    )
    assert approve_resp.status_code == 200

    launch_resp = client.post(
        f"/api/v1/tenants/{tenant_id}/launch",
        json={},
        headers=auth_headers,
    )
    assert launch_resp.status_code == 409
    assert "subscription plan" in launch_resp.json()["detail"].lower()


def test_registered_tenant_can_launch_on_trial_after_admin_approval(client, auth_headers, db_session, monkeypatch):
    register_resp = client.post(
        "/api/v1/auth/register?tenant_id=00000000-0000-0000-0000-000000000000",
        json={
            "email": "trial-launch@example.com",
            "password": "TestPassword123!",
            "full_name": "Trial Launch Admin",
            "company_name": "Trial Launch Logistics",
        },
    )
    assert register_resp.status_code == 200
    tenant_id = register_resp.json()["tenant_id"]
    assert tenant_id is not None

    approve_resp = client.post(
        f"/api/v1/tenants/{tenant_id}/approve",
        json={"verification_notes": "Approved for trial launch"},
        headers=auth_headers,
    )
    assert approve_resp.status_code == 200

    class _FakeAsyncResult:
        id = "celery-task-test"

    def _fake_delay(job_id: str):
        return _FakeAsyncResult()

    class _FakeRunner:
        id = uuid.uuid4()
        name = "runner-test"

    monkeypatch.setattr("app.services.tenant_creation_service.provision_tenant.delay", _fake_delay)
    monkeypatch.setattr("app.services.tenant_creation_service.select_runner_for_tenant", lambda db, explicit_runner_id=None: _FakeRunner())

    launch_resp = client.post(
        f"/api/v1/tenants/{tenant_id}/launch",
        json={},
        headers=auth_headers,
    )

    assert launch_resp.status_code == 200
    data = launch_resp.json()
    assert data["status"] == "queued"
    assert data["task_id"] == "celery-task-test"


def test_legacy_setup_infrastructure_uses_queued_launch_flow(client, auth_headers, monkeypatch):
    create_resp = client.post(
        "/api/v1/tenants",
        json={
            "company_name": "Legacy Queue Corp",
            "contact_email": "legacy-queue@example.com",
            "plan_code": "free_trial",
            "requested_domain": "legacyqueue.afruheritage.com",
            "domain_type": "provider_subdomain",
        },
        headers=auth_headers,
    )
    assert create_resp.status_code == 200
    tenant_id = create_resp.json()["id"]

    approve_resp = client.post(
        f"/api/v1/tenants/{tenant_id}/approve",
        json={"verification_notes": "Approved"},
        headers=auth_headers,
    )
    assert approve_resp.status_code == 200

    class _FakeAsyncResult:
        id = "legacy-task-test"

    def _fake_delay(job_id: str):
        return _FakeAsyncResult()

    class _FakeRunner:
        id = uuid.uuid4()
        name = "runner-legacy"

    monkeypatch.setattr("app.services.tenant_creation_service.provision_tenant.delay", _fake_delay)
    monkeypatch.setattr("app.services.tenant_creation_service.select_runner_for_tenant", lambda db, explicit_runner_id=None: _FakeRunner())

    response = client.post(
        f"/api/v1/tenants/{tenant_id}/setup-infrastructure",
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "queued"
    assert data["task_id"] == "legacy-task-test"


def test_auto_provision_keeps_request_in_provisioning_until_job_finishes(client, auth_headers, db_session, monkeypatch):
    request_row = TenantRequest(
        company_name="Auto Provision Corp",
        business_type="freight_forwarder",
        country="Ghana",
        city="Accra",
        address="123 Port Road, Accra, Ghana",
        contact_name="Auto Admin",
        contact_email="auto-provision@example.com",
        phone="+233000000000",
        status="pending_review",
    )
    db_session.add(request_row)
    db_session.commit()
    db_session.refresh(request_row)

    class _FakeAsyncResult:
        id = "auto-provision-task"

    def _fake_delay(job_id: str):
        return _FakeAsyncResult()

    class _FakeRunner:
        id = uuid.uuid4()
        name = "runner-auto"

    monkeypatch.setattr("app.services.tenant_creation_service.provision_tenant.delay", _fake_delay)
    monkeypatch.setattr("app.services.tenant_creation_service.select_runner_for_tenant", lambda db, explicit_runner_id=None: _FakeRunner())

    response = client.post(
        f"/api/v1/tenants/auto-provision?request_id={request_row.id}",
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "provisioning"
    assert data["provisioning"]["status"] == "queued"

    db_session.refresh(request_row)
    assert request_row.status == "provisioning"


def test_runtime_deploy_requires_launch_readiness(client, auth_headers):
    create_resp = client.post(
        "/api/v1/tenants",
        json={
            "company_name": "Legacy Runtime Gate Corp",
            "contact_email": "legacy-runtime@example.com",
            "plan_code": "professional",
            "requested_domain": "legacyruntime.afruheritage.com",
            "domain_type": "provider_subdomain",
        },
        headers=auth_headers,
    )
    assert create_resp.status_code == 200
    tenant = create_resp.json()

    response = client.post(
        "/api/v1/fleetbase-runtime/deploy?tenant_id=00000000-0000-0000-0000-000000000000",
        json={
            "tenant_id": tenant["id"],
            "tenant_slug": "spoofed-slug",
            "is_reference_install": False,
        },
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert "subscription plan" in response.json()["detail"].lower()


def test_tenant_runtime_auth_update_persists_secret_without_exposing_it(client, auth_headers, db_session):
    create_resp = client.post(
        "/api/v1/tenants",
        json={
            "company_name": "Runtime Auth Corp",
            "contact_email": "runtime-auth@example.com",
            "plan_code": "professional",
            "requested_domain": "runtimeauth.afruheritage.com",
            "domain_type": "provider_subdomain",
        },
        headers=auth_headers,
    )
    assert create_resp.status_code == 200
    tenant_id = create_resp.json()["id"]

    update_resp = client.post(
        f"/api/v1/tenants/{tenant_id}/runtime-auth",
        json={
            "live_api_token": "tenant-secret-token",
            "live_api_auth_scheme": "bearer",
        },
        headers=auth_headers,
    )

    assert update_resp.status_code == 200
    data = update_resp.json()
    assert data["id"] == tenant_id
    assert "live_api_token" not in data
    assert data["live_api_url"] is None

    tenant = db_session.get(Tenant, uuid.UUID(tenant_id))
    assert tenant is not None
    assert tenant.live_api_token == "tenant-secret-token"
    assert tenant.live_api_auth_scheme == "bearer"

    clear_resp = client.post(
        f"/api/v1/tenants/{tenant_id}/runtime-auth",
        json={
            "clear_live_api_token": True,
            "live_api_auth_scheme": "bearer",
        },
        headers=auth_headers,
    )

    assert clear_resp.status_code == 200
    db_session.refresh(tenant)
    assert tenant.live_api_token is None
