from __future__ import annotations

from app.core.security import create_access_token, get_password_hash
from app.models.billing import Payment as BillingPayment
from app.models.billing import PaymentStatus as BillingPaymentStatus
from app.models.billing import Subscription, WalletTransaction, WalletTransactionType
from app.models.billing import Wallet
from app.models.payment import PaymentRecord
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


def test_platform_initiate_creates_billing_ledger_row(client, db_session, monkeypatch):
    tenant = _create_tenant(db_session, "ledger-init")
    user = _create_user(db_session, "ledger-init@example.com", tenant)

    def _fake_initialize_transaction(**kwargs):
        return {
            "data": {
                "authorization_url": "https://paystack.test/authorize",
                "access_code": "test-access-code",
                "reference": "psk-test-ref-init",
            }
        }

    monkeypatch.setattr("app.services.platform_payment_service.initialize_transaction", _fake_initialize_transaction)

    payload = {
        "amount": 25.0,
        "payment_method": "mobile_money",
        "customer_email": "ledger-init@example.com",
        "customer_phone": "+233000000001",
        "customer_name": "Ledger Init",
        "mobile_provider": "mtn",
        "description": "Ledger sync init test",
        "metadata": {"purpose": "credit_topup", "currency": "GHS"},
    }

    response = client.post("/api/v1/payments/initiate", json=payload, headers=_auth_headers_for(user))

    assert response.status_code == 200
    payment_reference = response.json()["payment_reference"]

    billing_payment = (
        db_session.query(BillingPayment)
        .filter(BillingPayment.reference == payment_reference)
        .first()
    )
    assert billing_payment is not None
    assert str(billing_payment.tenant_id) == str(tenant.id)
    assert billing_payment.status == BillingPaymentStatus.UNPAID
    assert billing_payment.amount_minor == 2500


def test_paystack_webhook_success_marks_billing_payment_paid(client, db_session, monkeypatch):
    tenant = _create_tenant(db_session, "ledger-webhook")
    user = _create_user(db_session, "ledger-webhook@example.com", tenant)

    def _fake_initialize_transaction(**kwargs):
        return {
            "data": {
                "authorization_url": "https://paystack.test/authorize",
                "access_code": "test-access-code",
                "reference": "psk-test-ref-webhook",
            }
        }

    monkeypatch.setattr("app.services.platform_payment_service.initialize_transaction", _fake_initialize_transaction)
    monkeypatch.setattr("app.api.routes.payments.verify_webhook_signature", lambda body, sig: True)

    initiate_payload = {
        "amount": 25.0,
        "payment_method": "mobile_money",
        "customer_email": "ledger-webhook@example.com",
        "customer_phone": "+233000000002",
        "customer_name": "Ledger Webhook",
        "mobile_provider": "mtn",
        "description": "Ledger sync webhook test",
        "metadata": {"purpose": "credit_topup", "currency": "GHS"},
    }

    init_response = client.post("/api/v1/payments/initiate", json=initiate_payload, headers=_auth_headers_for(user))
    assert init_response.status_code == 200
    payment_reference = init_response.json()["payment_reference"]

    webhook_payload = {
        "event": "charge.success",
        "data": {
            "reference": "psk-test-ref-webhook",
            "amount": 2500,
            "metadata": {
                "tenant_id": str(tenant.id),
                "currency": "GHS",
            },
        },
    }

    webhook_response = client.post("/api/v1/payments/webhook/paystack", json=webhook_payload)
    assert webhook_response.status_code == 200

    billing_payment = (
        db_session.query(BillingPayment)
        .filter(BillingPayment.reference == payment_reference)
        .first()
    )
    assert billing_payment is not None
    assert billing_payment.status == BillingPaymentStatus.PAID


def test_payment_status_prefers_billing_ledger_when_legacy_row_missing(client, db_session, monkeypatch):
    tenant = _create_tenant(db_session, "ledger-status")
    user = _create_user(db_session, "ledger-status@example.com", tenant)

    def _fake_initialize_transaction(**kwargs):
        return {
            "data": {
                "authorization_url": "https://paystack.test/authorize",
                "access_code": "test-access-code",
                "reference": "psk-test-ref-status",
            }
        }

    monkeypatch.setattr("app.services.platform_payment_service.initialize_transaction", _fake_initialize_transaction)

    payload = {
        "amount": 15.0,
        "payment_method": "mobile_money",
        "customer_email": "ledger-status@example.com",
        "customer_phone": "+233000000003",
        "customer_name": "Ledger Status",
        "mobile_provider": "mtn",
        "description": "Ledger status test",
        "metadata": {"purpose": "credit_topup", "currency": "GHS"},
    }

    init_response = client.post("/api/v1/payments/initiate", json=payload, headers=_auth_headers_for(user))
    assert init_response.status_code == 200
    payment_reference = init_response.json()["payment_reference"]

    legacy = (
        db_session.query(PaymentRecord)
        .filter(PaymentRecord.payment_reference == payment_reference)
        .first()
    )
    assert legacy is not None
    db_session.delete(legacy)
    db_session.commit()

    status_response = client.get(f"/api/v1/payments/status/{payment_reference}", headers=_auth_headers_for(user))
    assert status_response.status_code == 200
    payload = status_response.json()
    assert payload["payment_reference"] == payment_reference
    assert payload["status"] == "pending"
    assert payload["amount"] == 15.0


def test_payment_balance_prefers_billing_wallet(client, db_session):
    tenant = _create_tenant(db_session, "ledger-balance")
    user = _create_user(db_session, "ledger-balance@example.com", tenant)

    wallet = Wallet(tenant_id=tenant.id, currency="GHS", balance_credits=42)
    db_session.add(wallet)
    db_session.commit()

    response = client.get("/api/v1/payments/balance", headers=_auth_headers_for(user))
    assert response.status_code == 200
    payload = response.json()
    assert payload["balance"] == 42.0
    assert payload["currency"] == "GHS"


def test_payment_balance_falls_back_to_legacy_wallet_balance(client, db_session):
    tenant = _create_tenant(db_session, "ledger-balance-fallback")
    user = _create_user(db_session, "ledger-balance-fallback@example.com", tenant)

    tenant.wallet_balance = 17.5
    db_session.add(tenant)
    db_session.commit()

    response = client.get("/api/v1/payments/balance", headers=_auth_headers_for(user))
    assert response.status_code == 200
    payload = response.json()
    assert payload["balance"] == 17.5
    assert payload["currency"] == "GHS"


def test_credit_purchase_links_to_canonical_payment_reference(client, db_session, monkeypatch):
    tenant = _create_tenant(db_session, "ledger-credit-purchase")
    user = _create_user(db_session, "ledger-credit-purchase@example.com", tenant)

    def _fake_initialize_transaction(**kwargs):
        return {
            "data": {
                "authorization_url": "https://paystack.test/authorize",
                "access_code": "test-access-code",
                "reference": "psk-test-ref-credit-purchase",
            }
        }

    monkeypatch.setattr("app.services.platform_payment_service.initialize_transaction", _fake_initialize_transaction)

    payload = {
        "amount": 12.6,
        "payment_method": "mobile_money",
        "customer_email": "ledger-credit-purchase@example.com",
        "customer_phone": "+233000000004",
        "mobile_provider": "mtn",
    }

    response = client.post("/api/v1/payments/credits/purchase", json=payload, headers=_auth_headers_for(user))
    assert response.status_code == 200
    body = response.json()

    billing_payment = (
        db_session.query(BillingPayment)
        .filter(BillingPayment.reference == body["purchase_id"])
        .first()
    )
    assert billing_payment is not None
    assert billing_payment.purpose == "credit_topup"
    assert billing_payment.amount_minor == 1260
    assert body["credits_to_receive"] == 13.0


def test_billing_verify_applies_subscription_allowance_once(client, db_session, monkeypatch):
    tenant = _create_tenant(db_session, "billing-subscription")
    user = _create_user(db_session, "billing-subscription@example.com", tenant)

    def _fake_initialize_transaction(**kwargs):
        return {
            "data": {
                "authorization_url": "https://paystack.test/authorize",
                "access_code": "test-access-code",
                "reference": kwargs["reference"],
            }
        }

    def _fake_verify_transaction(reference: str):
        return {
            "data": {
                "status": "success",
                "reference": reference,
                "metadata": {
                    "tenant_id": str(tenant.id),
                    "purpose": "subscription",
                    "plan_code": "business",
                },
            }
        }

    monkeypatch.setattr("app.api.routes.billing.initialize_transaction", _fake_initialize_transaction)
    monkeypatch.setattr("app.api.routes.billing.verify_transaction", _fake_verify_transaction)

    init_response = client.post(
        "/api/v1/billing/payments/init",
        json={
            "tenant_id": str(tenant.id),
            "email": user.email,
            "currency": "GHS",
            "amount_major": 25,
            "purpose": "subscription",
            "plan_code": "business",
        },
        headers=_auth_headers_for(user),
    )

    assert init_response.status_code == 200
    reference = init_response.json()["reference"]

    first_verify = client.post(f"/api/v1/billing/payments/verify/{reference}", headers=_auth_headers_for(user))
    second_verify = client.post(f"/api/v1/billing/payments/verify/{reference}", headers=_auth_headers_for(user))

    assert first_verify.status_code == 200
    assert second_verify.status_code == 200

    subscription = db_session.query(Subscription).filter(Subscription.tenant_id == tenant.id).first()
    wallet = db_session.query(Wallet).filter(Wallet.tenant_id == tenant.id).first()
    allowance_txs = (
        db_session.query(WalletTransaction)
        .filter(
            WalletTransaction.tenant_id == tenant.id,
            WalletTransaction.transaction_type == WalletTransactionType.SUBSCRIPTION_CREDIT,
            WalletTransaction.reference == reference,
        )
        .all()
    )

    assert subscription is not None
    assert subscription.plan_code.value == "business"
    assert wallet is not None
    assert wallet.balance_credits == 3000
    assert len(allowance_txs) == 1


def test_billing_verify_applies_credit_topup_once(client, db_session, monkeypatch):
    tenant = _create_tenant(db_session, "billing-topup")
    user = _create_user(db_session, "billing-topup@example.com", tenant)

    def _fake_initialize_transaction(**kwargs):
        return {
            "data": {
                "authorization_url": "https://paystack.test/authorize",
                "access_code": "test-access-code",
                "reference": kwargs["reference"],
            }
        }

    def _fake_verify_transaction(reference: str):
        return {
            "data": {
                "status": "success",
                "reference": reference,
                "metadata": {
                    "tenant_id": str(tenant.id),
                    "purpose": "credit_topup",
                    "credits_to_buy": 125,
                },
            }
        }

    monkeypatch.setattr("app.api.routes.billing.initialize_transaction", _fake_initialize_transaction)
    monkeypatch.setattr("app.api.routes.billing.verify_transaction", _fake_verify_transaction)

    init_response = client.post(
        "/api/v1/billing/payments/init",
        json={
            "tenant_id": str(tenant.id),
            "email": user.email,
            "currency": "GHS",
            "amount_major": 1.25,
            "purpose": "credit_topup",
            "credits_to_buy": 125,
        },
        headers=_auth_headers_for(user),
    )

    assert init_response.status_code == 200
    reference = init_response.json()["reference"]

    first_verify = client.post(f"/api/v1/billing/payments/verify/{reference}", headers=_auth_headers_for(user))
    second_verify = client.post(f"/api/v1/billing/payments/verify/{reference}", headers=_auth_headers_for(user))

    assert first_verify.status_code == 200
    assert second_verify.status_code == 200

    wallet = db_session.query(Wallet).filter(Wallet.tenant_id == tenant.id).first()
    topup_txs = (
        db_session.query(WalletTransaction)
        .filter(
            WalletTransaction.tenant_id == tenant.id,
            WalletTransaction.transaction_type == WalletTransactionType.CREDIT_PURCHASE,
            WalletTransaction.reference == reference,
        )
        .all()
    )

    assert wallet is not None
    assert wallet.balance_credits == 125
    assert len(topup_txs) == 1


def test_billing_verify_and_payments_status_are_consistent(client, db_session, monkeypatch):
    tenant = _create_tenant(db_session, "ledger-consistency")
    user = _create_user(db_session, "ledger-consistency@example.com", tenant)

    def _fake_initialize_transaction(**kwargs):
        return {
            "data": {
                "authorization_url": "https://paystack.test/authorize",
                "access_code": "test-access-code",
                "reference": "psk-test-ref-consistency",
            }
        }

    def _fake_verify_transaction(reference: str):
        return {
            "status": True,
            "data": {
                "status": "success",
                "reference": reference,
                "metadata": {
                    "tenant_id": str(tenant.id),
                    "purpose": "credit_topup",
                    "credits_to_buy": 10,
                },
            },
        }

    monkeypatch.setattr("app.services.platform_payment_service.initialize_transaction", _fake_initialize_transaction)
    monkeypatch.setattr("app.api.routes.billing.verify_transaction", _fake_verify_transaction)

    initiate_payload = {
        "amount": 10.0,
        "payment_method": "mobile_money",
        "customer_email": "ledger-consistency@example.com",
        "customer_phone": "+233000000005",
        "customer_name": "Ledger Consistency",
        "mobile_provider": "mtn",
        "description": "Ledger consistency test",
        "metadata": {"purpose": "credit_topup", "currency": "GHS"},
    }

    init_response = client.post("/api/v1/payments/initiate", json=initiate_payload, headers=_auth_headers_for(user))
    assert init_response.status_code == 200
    payment_reference = init_response.json()["payment_reference"]

    billing_verify = client.post(
        f"/api/v1/billing/payments/verify/{payment_reference}?tenant_id={tenant.id}",
        headers=_auth_headers_for(user),
    )
    assert billing_verify.status_code == 200
    assert billing_verify.json()["status"] == "verified"

    status_response = client.get(
        f"/api/v1/payments/status/{payment_reference}",
        headers=_auth_headers_for(user),
    )
    assert status_response.status_code == 200
    assert status_response.json()["status"] == "completed"

    billing_payment = (
        db_session.query(BillingPayment)
        .filter(BillingPayment.reference == payment_reference)
        .first()
    )
    assert billing_payment is not None
    assert billing_payment.status == BillingPaymentStatus.PAID
