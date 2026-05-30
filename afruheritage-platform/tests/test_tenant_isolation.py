from __future__ import annotations

import time
import uuid

from app.core.security import create_access_token, get_password_hash
from app.models.billing import Payment
from app.models.tenant import DomainType, LaunchStatus, Tenant
from app.models.user import User


def _auth_headers_for(user: User) -> dict[str, str]:
    token = create_access_token(subject=str(user.id))
    return {"Authorization": f"Bearer {token}"}


def _create_tenant(db_session, suffix: str) -> Tenant:
    tenant = Tenant(
        company_name=f"Company {suffix}",
        slug=f"company-{suffix}",
        contact_email=f"{suffix}@example.com",
        plan_code="free_trial",
        requested_domain=f"{suffix}.afruheritage.com",
        domain_type=DomainType.provider_subdomain,
        launch_status=LaunchStatus.pending_verification,
    )
    db_session.add(tenant)
    db_session.commit()
    db_session.refresh(tenant)
    return tenant


def _create_user(db_session, email: str, tenant: Tenant) -> User:
    user = User(
        email=email,
        full_name=email.split("@")[0],
        hashed_password=get_password_hash("TestPassword123!"),  # noqa: S106
        tenant_id=tenant.id,
        is_tenant_admin=True,
        is_superuser=False,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_billing_cross_tenant_wallet_access_is_denied(client, db_session):
    tenant_a = _create_tenant(db_session, "tenant-a")
    tenant_b = _create_tenant(db_session, "tenant-b")
    user_a = _create_user(db_session, "tenant-a-user@example.com", tenant_a)

    response = client.get(
        f"/api/v1/billing/wallets/{tenant_b.id}?tenant_id={tenant_b.id}",
        headers=_auth_headers_for(user_a),
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Tenant access denied"


def test_billing_payment_init_ignores_body_tenant_id_spoof(client, db_session, monkeypatch):
    tenant_a = _create_tenant(db_session, "tenant-a-pay")
    tenant_b = _create_tenant(db_session, "tenant-b-pay")
    user_a = _create_user(db_session, "tenant-a-pay-user@example.com", tenant_a)

    def _fake_initialize_transaction(**kwargs):
        return {
            "data": {
                "authorization_url": "https://paystack.test/authorize",
                "access_code": "access-code-test",
            }
        }

    monkeypatch.setattr("app.api.routes.billing.initialize_transaction", _fake_initialize_transaction)

    payload = {
        "tenant_id": str(tenant_b.id),
        "email": "tenant-a-pay-user@example.com",
        "currency": "GHS",
        "amount_major": 2.0,
        "purpose": "credit_topup",
        "credits_to_buy": 2,
    }

    response = client.post(
        f"/api/v1/billing/payments/init?tenant_id={tenant_a.id}",
        json=payload,
        headers=_auth_headers_for(user_a),
    )

    assert response.status_code == 200
    payment_reference = response.json()["reference"]

    payment = db_session.query(Payment).filter(Payment.reference == payment_reference).first()
    assert payment is not None
    assert str(payment.tenant_id) == str(tenant_a.id)


def test_custom_domain_request_uses_authenticated_tenant_and_cross_tenant_events_are_denied(client, db_session):
    tenant_a = _create_tenant(db_session, "tenant-a-domain")
    tenant_b = _create_tenant(db_session, "tenant-b-domain")
    user_a = _create_user(db_session, "tenant-a-domain-user@example.com", tenant_a)

    hostname = f"tenant-{int(time.time())}-{uuid.uuid4().hex[:6]}.example.com"
    create_payload = {
        "tenant_id": str(tenant_b.id),
        "hostname": hostname,
        "domain_type": "customer_subdomain",
        "created_by": "tenant-a-domain-user@example.com",
    }

    create_response = client.post(
        f"/api/v1/domains/request?tenant_id={tenant_a.id}",
        json=create_payload,
        headers=_auth_headers_for(user_a),
    )

    assert create_response.status_code == 200
    domain = create_response.json()
    assert domain["tenant_id"] == str(tenant_a.id)

    domain_id = domain["id"]
    events_response = client.get(
        f"/api/v1/domains/{domain_id}/events?tenant_id={tenant_b.id}",
        headers=_auth_headers_for(user_a),
    )

    assert events_response.status_code == 403
    assert events_response.json()["detail"] == "Tenant access denied"
