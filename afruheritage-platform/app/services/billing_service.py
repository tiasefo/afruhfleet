from __future__ import annotations
from app.core.config import settings

# Assign a plan to a tenant (admin action)
def admin_assign_plan(db: Session, tenant_id: str, plan_code: str, currency: str = "GHS") -> Subscription:
    """Assign or change a tenant's plan as an admin."""
    sub = activate_or_upgrade_subscription(db, tenant_id=tenant_id, plan_code=plan_code, currency=currency)
    return sub

# Restore get_plans for /plans route
def get_plans(db: Session) -> list[Plan]:
    seed_default_plans(db)
    return db.query(Plan).filter(Plan.active == True).all()  # noqa: E712

# Restore get_or_create_subscription for subscription logic
def get_or_create_subscription(db: Session, tenant_id: str, currency: str = "GHS") -> Subscription:
    sub = db.query(Subscription).filter(Subscription.tenant_id == _as_uuid(tenant_id)).first()
    if sub:
        return sub
    return create_trial_subscription(db, tenant_id, currency)

# Restore ensure_subscription for compatibility (returns Subscription or None)
def ensure_subscription(db: Session, tenant_id: str) -> Subscription | None:
    return db.query(Subscription).filter(Subscription.tenant_id == _as_uuid(tenant_id)).first()

import json
import uuid
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.billing import (
    AuditLog,
    Payment,
    PaymentStatus,
    Plan,
    PlanCode,
    Subscription,
    SubscriptionStatus,
    Wallet,
    WalletTransaction,
    WalletTransactionType,
)
from app.models.tenant import Tenant
from app.models.saas_subscription import TenantSubscription
from app.services.notification_service import notification_service
from app.services.platform_config_service import get_default_trial_days


PLAN_ALIAS_MAP: dict[str, PlanCode] = {
    "starter": PlanCode.PROFESSIONAL,
    "growth": PlanCode.BUSINESS,
    "enterprise": PlanCode.DELIVERY_SERVICES,
    "free_trial": PlanCode.FREE_TRIAL,
    "professional": PlanCode.PROFESSIONAL,
    "business": PlanCode.BUSINESS,
    "delivery_services": PlanCode.DELIVERY_SERVICES,
}

PLAN_FEATURES: dict[PlanCode, list[str]] = {
    PlanCode.FREE_TRIAL: [
        "customer_portal",
        "shipment_tracking",
        "manual_kyc",
        "ai_assistant",
    ],
    PlanCode.PROFESSIONAL: [
        "customer_portal",
        "shipment_tracking",
        "manual_kyc",
        "vendor_ops",
        "ai_assistant",
    ],
    PlanCode.BUSINESS: [
        "customer_portal",
        "shipment_tracking",
        "manual_kyc",
        "vendor_ops",
        "ai_assistant",
        "api_integration",
        "custom_domain",
    ],
    PlanCode.DELIVERY_SERVICES: [
        "customer_portal",
        "shipment_tracking",
        "manual_kyc",
        "vendor_ops",
        "ai_assistant",
        "api_integration",
        "custom_domain",
        "priority_support",
    ],
}

FEATURE_CREDIT_COSTS: dict[str, int] = {
    "ai_chat_message": 0,
    "kyc_manual_submission": 15,
    "vendor_document_upload": 8,
}


DEFAULT_PLANS = [
    {
        "code": PlanCode.FREE_TRIAL,
        "name": "Free Trial",
        "currency": "GHS",
        "price_amount": 0,
        "monthly_credit_allowance": 120,
        "includes_custom_domain": False,
        "includes_priority_support": False,
        "max_drivers": 3,
        "max_vehicles": 3,
        "max_shipments_per_month": 50,
        "max_products": 10,
        "max_group_members": 100,
        "dispatch_enabled": False,
        "route_planning_enabled": False,
        "service_rates_enabled": False,
        "pod_enabled": False,
        "route_optimization_enabled": False,
        "vrp_enabled": False,
        "webhooks_enabled": False,
        "notifications_enabled": False,
        "extensions_enabled": False,
        "maintenance_enabled": False,
        "fuel_tracking_enabled": False,
        "csv_import_enabled": False,
    },
    {
        "code": PlanCode.PROFESSIONAL,
        "name": "Starter",
        "currency": "GHS",
        "price_amount": 1000,
        "monthly_credit_allowance": 1200,
        "includes_custom_domain": False,
        "includes_priority_support": False,
        "max_drivers": 20,
        "max_vehicles": 20,
        "max_shipments_per_month": 500,
        "max_products": 100,
        "max_group_members": 1000,
        "dispatch_enabled": True,
        "route_planning_enabled": False,
        "service_rates_enabled": True,
        "pod_enabled": True,
        "route_optimization_enabled": False,
        "vrp_enabled": False,
        "webhooks_enabled": True,
        "notifications_enabled": True,
        "extensions_enabled": False,
        "maintenance_enabled": False,
        "fuel_tracking_enabled": False,
        "csv_import_enabled": True,
    },
    {
        "code": PlanCode.BUSINESS,
        "name": "Growth",
        "currency": "GHS",
        "price_amount": 2500,
        "monthly_credit_allowance": 3500,
        "includes_custom_domain": True,
        "includes_priority_support": True,
        "max_drivers": 9999,
        "max_vehicles": 9999,
        "max_shipments_per_month": 9999,
        "max_products": 9999,
        "max_group_members": 5000,
        "dispatch_enabled": True,
        "route_planning_enabled": True,
        "service_rates_enabled": True,
        "pod_enabled": True,
        "route_optimization_enabled": True,
        "vrp_enabled": True,
        "webhooks_enabled": True,
        "notifications_enabled": True,
        "extensions_enabled": True,
        "maintenance_enabled": True,
        "fuel_tracking_enabled": True,
        "csv_import_enabled": True,
    },
    {
        "code": PlanCode.DELIVERY_SERVICES,
        "name": "Enterprise",
        "currency": "GHS",
        "price_amount": 6000,
        "monthly_credit_allowance": 10000,
        "includes_custom_domain": True,
        "includes_priority_support": True,
        "max_drivers": 9999,
        "max_vehicles": 9999,
        "max_shipments_per_month": 9999,
        "max_products": 9999,
        "max_group_members": 5000,
        "dispatch_enabled": True,
        "route_planning_enabled": True,
        "service_rates_enabled": True,
        "pod_enabled": True,
        "route_optimization_enabled": True,
        "vrp_enabled": True,
        "webhooks_enabled": True,
        "notifications_enabled": True,
        "extensions_enabled": True,
        "maintenance_enabled": True,
        "fuel_tracking_enabled": True,
        "csv_import_enabled": True,
    },
]


def _as_uuid(value: str | uuid.UUID):
    try:
        return uuid.UUID(str(value))
    except (TypeError, ValueError):
        return value


def normalize_plan_code(plan_code: str | PlanCode | None) -> PlanCode:
    if isinstance(plan_code, PlanCode):
        return plan_code
    normalized = (str(plan_code or "free_trial")).strip().lower()
    mapped = PLAN_ALIAS_MAP.get(normalized)
    if mapped:
        return mapped
    return PlanCode.FREE_TRIAL


def get_plan_features(plan_code: str | PlanCode | None) -> list[str]:
    return PLAN_FEATURES.get(normalize_plan_code(plan_code), PLAN_FEATURES[PlanCode.FREE_TRIAL])


def feature_enabled_for_plan(plan_code: str | PlanCode | None, feature_key: str) -> bool:
    return feature_key in get_plan_features(plan_code)


def feature_credit_cost(feature_usage_key: str) -> int:
    return FEATURE_CREDIT_COSTS.get(feature_usage_key, 0)


def get_feature_credit_costs() -> dict[str, int]:
    return dict(FEATURE_CREDIT_COSTS)


def seed_default_plans(db: Session) -> None:
    for item in DEFAULT_PLANS:
        existing = db.query(Plan).filter(Plan.code == item["code"]).first()
        if existing:
            existing.name = item["name"]
            existing.currency = item["currency"]
            existing.price_amount = item["price_amount"]
            existing.monthly_credit_allowance = item["monthly_credit_allowance"]
            existing.includes_custom_domain = item["includes_custom_domain"]
            existing.includes_priority_support = item["includes_priority_support"]
            existing.max_drivers = item.get("max_drivers", 3)
            existing.max_vehicles = item.get("max_vehicles", 3)
            existing.max_shipments_per_month = item.get("max_shipments_per_month", 50)
            existing.max_products = item.get("max_products", 10)
            existing.max_group_members = item.get("max_group_members", 100)
            existing.dispatch_enabled = item.get("dispatch_enabled", False)
            existing.route_planning_enabled = item.get("route_planning_enabled", False)
            existing.service_rates_enabled = item.get("service_rates_enabled", False)
            existing.pod_enabled = item.get("pod_enabled", False)
            existing.route_optimization_enabled = item.get("route_optimization_enabled", False)
            existing.vrp_enabled = item.get("vrp_enabled", False)
            existing.webhooks_enabled = item.get("webhooks_enabled", False)
            existing.notifications_enabled = item.get("notifications_enabled", False)
            existing.extensions_enabled = item.get("extensions_enabled", False)
            existing.maintenance_enabled = item.get("maintenance_enabled", False)
            existing.fuel_tracking_enabled = item.get("fuel_tracking_enabled", False)
            existing.csv_import_enabled = item.get("csv_import_enabled", False)
            existing.active = True
            db.add(existing)
            continue
        db.add(Plan(**item))
    db.commit()


def create_trial_subscription(
    db: Session,
    tenant_id: str,
    currency: str = "GHS",
    plan_code: str | PlanCode = PlanCode.FREE_TRIAL,
) -> Subscription:
    tenant_pk = _as_uuid(tenant_id)
    existing = db.query(Subscription).filter(Subscription.tenant_id == tenant_pk).first()
    if existing:
        return existing

    resolved_plan = normalize_plan_code(plan_code)

    now = datetime.utcnow()
    trial_days = get_default_trial_days(db)
    sub = Subscription(
        tenant_id=tenant_pk,
        plan_code=resolved_plan,
        status=SubscriptionStatus.TRIALING if resolved_plan == PlanCode.FREE_TRIAL else SubscriptionStatus.ACTIVE,
        currency=currency,
        started_at=now,
        current_period_end=now + timedelta(days=trial_days),
        trial_ends_at=now + timedelta(days=trial_days) if resolved_plan == PlanCode.FREE_TRIAL else None,
    )
    db.add(sub)
    tenant = db.query(Tenant).filter(Tenant.id == tenant_pk).first()
    if tenant:
        tenant.plan_code = resolved_plan.value
        db.add(tenant)
    db.commit()
    db.refresh(sub)
    write_audit_log(
        db,
        "system",
        None,
        "trial_subscription_created",
        "subscription",
        str(sub.id),
        {"tenant_id": tenant_id, "plan_code": resolved_plan.value},
    )
    sync_subscription_state(db, tenant_id)
    return sub


def ensure_wallet(db: Session, tenant_id: str, currency: str = "GHS") -> Wallet:
    tenant_pk = _as_uuid(tenant_id)
    wallet = db.query(Wallet).filter(Wallet.tenant_id == tenant_pk).first()
    if wallet:
        return wallet
    wallet = Wallet(tenant_id=tenant_pk, currency=currency, balance_credits=0)
    db.add(wallet)
    db.commit()
    db.refresh(wallet)
    return wallet


def create_payment(db: Session, tenant_id: str, purpose: str, currency: str, amount_minor: int) -> Payment:
    tenant_pk = _as_uuid(tenant_id)
    payment = Payment(
        tenant_id=tenant_pk,
        reference=f"afr_{uuid.uuid4().hex}",
        purpose=purpose,
        currency=currency,
        amount_minor=amount_minor,
        status=PaymentStatus.PENDING,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    write_audit_log(db, "tenant", tenant_id, "payment_initialized", "payment", str(payment.id), {"reference": payment.reference, "purpose": purpose})
    return payment


def set_payment_initialized(db: Session, payment: Payment, authorization_url: str | None, access_code: str | None, provider_payload: dict | None) -> Payment:
    payment.provider_authorization_url = authorization_url
    payment.provider_access_code = access_code
    payment.provider_payload = json.dumps(provider_payload or {})
    payment.status = PaymentStatus.PENDING
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


def mark_payment_verified(db: Session, payment: Payment, provider_payload: dict | None = None) -> Payment:
    payment.status = PaymentStatus.VERIFIED
    if provider_payload is not None:
        payment.provider_payload = json.dumps(provider_payload)
    db.add(payment)
    db.commit()
    db.refresh(payment)
    write_audit_log(db, "system", None, "payment_verified", "payment", str(payment.id), {"reference": payment.reference})
    
    # Send payment success notification
    try:
        tenant = db.query(Tenant).filter(Tenant.id == payment.tenant_id).first()
        # Resolve plan code from provider_payload metadata, fallback to tenant plan
        plan_code = None
        if payment.provider_payload:
            try:
                payload = json.loads(payment.provider_payload)
                metadata = payload.get('data', {}).get('metadata') or payload.get('metadata', {})
                plan_code = metadata.get('plan_code')
            except Exception:
                pass
        if not plan_code and tenant:
            plan_code = tenant.plan_code
        # Defensive: only query Plan if plan_code is a known enum value
        from app.models.billing import PlanCode
        plan = None
        if plan_code and plan_code in [e.value for e in PlanCode]:
            plan = db.query(Plan).filter(Plan.code == plan_code).first()
        if tenant and plan:
            notification_service.send_payment_success_email(
                to=tenant.contact_email,
                amount=payment.amount_minor / 100,  # Convert from minor units
                currency=payment.currency,
                plan_name=plan.name,
                company_name=tenant.company_name
            )
    except Exception as e:
        import logging
        logging.getLogger("afruheritage.notifications").error("Failed to send payment success email: %s", e)
    
    return payment


def _wallet_transaction_exists(
    db: Session,
    tenant_id: str,
    tx_type: WalletTransactionType,
    reference: str | None,
) -> bool:
    if not reference:
        return False
    tenant_pk = _as_uuid(tenant_id)
    return (
        db.query(WalletTransaction)
        .filter(
            WalletTransaction.tenant_id == tenant_pk,
            WalletTransaction.transaction_type == tx_type,
            WalletTransaction.reference == reference,
        )
        .first()
        is not None
    )


def add_wallet_credits_once(
    db: Session,
    tenant_id: str,
    credits: int,
    tx_type: WalletTransactionType,
    reference: str | None = None,
    memo: str | None = None,
    currency: str = "GHS",
) -> Wallet:
    if _wallet_transaction_exists(db, tenant_id, tx_type, reference):
        return ensure_wallet(db, tenant_id, currency)
    return add_wallet_credits(
        db,
        tenant_id=tenant_id,
        credits=credits,
        tx_type=tx_type,
        reference=reference,
        memo=memo,
    )


def grant_subscription_allowance(
    db: Session,
    tenant_id: str,
    plan_code: str,
    currency: str,
    reference: str | None = None,
) -> Wallet:
    seed_default_plans(db)
    resolved_plan = normalize_plan_code(plan_code)
    plan = db.query(Plan).filter(Plan.code == resolved_plan).first()
    allowance = plan.monthly_credit_allowance if plan else 0

    if allowance <= 0:
        return ensure_wallet(db, tenant_id, currency)

    return add_wallet_credits_once(
        db,
        tenant_id=tenant_id,
        credits=allowance,
        tx_type=WalletTransactionType.SUBSCRIPTION_CREDIT,
        reference=reference,
        memo=f"Subscription allowance for {resolved_plan.value}",
        currency=currency,
    )


def activate_or_upgrade_subscription(db: Session, tenant_id: str, plan_code: str, currency: str) -> Subscription:
    tenant_pk = _as_uuid(tenant_id)
    resolved_plan = normalize_plan_code(plan_code)
    sub = db.query(Subscription).filter(Subscription.tenant_id == tenant_pk).first()
    now = datetime.utcnow()
    period_days = get_default_trial_days(db)
    if not sub:
        sub = Subscription(
            tenant_id=tenant_pk,
            plan_code=resolved_plan,
            status=SubscriptionStatus.ACTIVE,
            currency=currency,
            started_at=now,
            current_period_end=now + timedelta(days=period_days),
            trial_ends_at=None,
        )
        db.add(sub)
    else:
        sub.plan_code = resolved_plan
        sub.status = SubscriptionStatus.ACTIVE
        sub.currency = currency
        sub.current_period_end = now + timedelta(days=period_days)
        sub.trial_ends_at = None
        sub.read_only_reason = None
        db.add(sub)
    tenant = db.query(Tenant).filter(Tenant.id == tenant_pk).first()
    if tenant:
        tenant.plan_code = resolved_plan.value
        db.add(tenant)
    db.commit()
    db.refresh(sub)
    write_audit_log(
        db,
        "system",
        None,
        "subscription_activated_or_upgraded",
        "subscription",
        str(sub.id),
        {"tenant_id": tenant_id, "plan_code": resolved_plan.value},
    )
    sync_subscription_state(db, tenant_id)
    return sub


def set_subscription_read_only(db: Session, tenant_id: str, reason: str, read_only: bool = True) -> Subscription | None:
    tenant_pk = _as_uuid(tenant_id)
    sub = db.query(Subscription).filter(Subscription.tenant_id == tenant_pk).first()
    if not sub:
        return None
    if read_only:
        sub.status = SubscriptionStatus.READ_ONLY
        sub.read_only_reason = reason
    else:
        sub.status = SubscriptionStatus.ACTIVE
        sub.read_only_reason = None
    db.add(sub)
    db.commit()
    db.refresh(sub)
    action = "subscription_set_read_only" if read_only else "subscription_set_active"
    write_audit_log(db, "admin", None, action, "subscription", str(sub.id), {"reason": reason})
    return sub


def add_wallet_credits(db: Session, tenant_id: str, credits: int, tx_type: WalletTransactionType, reference: str | None = None, memo: str | None = None) -> Wallet:
    tenant_pk = _as_uuid(tenant_id)
    wallet = ensure_wallet(db, str(tenant_pk))
    wallet.balance_credits += credits
    db.add(wallet)
    db.commit()
    db.refresh(wallet)

    tx = WalletTransaction(
        wallet_id=wallet.id,
        tenant_id=tenant_pk,
        transaction_type=tx_type,
        credits_delta=credits,
        balance_after=wallet.balance_credits,
        reference=reference,
        memo=memo,
    )
    db.add(tx)
    db.commit()
    write_audit_log(db, "system", None, "wallet_credited", "wallet", str(wallet.id), {"credits": credits, "reference": reference})
    return wallet


def consume_wallet_credits(db: Session, tenant_id: str, usage_type: str, credits: int, memo: str | None = None) -> Wallet:
    tenant_pk = _as_uuid(tenant_id)
    wallet = ensure_wallet(db, str(tenant_pk))
    if wallet.balance_credits < credits:
        set_subscription_read_only(db, str(tenant_pk), f"Insufficient credits for {usage_type}")
        raise ValueError("Insufficient credits")

    wallet.balance_credits -= credits
    db.add(wallet)
    db.commit()
    db.refresh(wallet)

    tx_type = WalletTransactionType.AI_USAGE_DEBIT if usage_type == "ai_usage" else WalletTransactionType.DOCUMENT_PROCESSING_DEBIT

    tx = WalletTransaction(
        wallet_id=wallet.id,
        tenant_id=tenant_pk,
        transaction_type=tx_type,
        credits_delta=-credits,
        balance_after=wallet.balance_credits,
        reference=None,
        memo=memo,
    )
    db.add(tx)
    db.commit()
    write_audit_log(db, "system", None, "wallet_debited", "wallet", str(wallet.id), {"credits": credits, "usage_type": usage_type})
    return wallet


def admin_adjust_credits(db: Session, tenant_id: str, credits_delta: int, memo: str | None = None) -> Wallet:
    tenant_pk = _as_uuid(tenant_id)
    wallet = ensure_wallet(db, str(tenant_pk))
    wallet.balance_credits += credits_delta
    db.add(wallet)
    db.commit()
    db.refresh(wallet)

    tx = WalletTransaction(
        wallet_id=wallet.id,
        tenant_id=tenant_pk,
        transaction_type=WalletTransactionType.MANUAL_ADJUSTMENT,
        credits_delta=credits_delta,
        balance_after=wallet.balance_credits,
        reference=None,
        memo=memo,
    )
    db.add(tx)
    db.commit()
    write_audit_log(db, "admin", None, "wallet_manual_adjustment", "wallet", str(wallet.id), {"credits_delta": credits_delta, "memo": memo})
    return wallet


def evaluate_subscription_state(db: Session, tenant_id: str) -> Subscription | None:
    tenant_pk = _as_uuid(tenant_id)
    sub = db.query(Subscription).filter(Subscription.tenant_id == tenant_pk).first()
    if not sub:
        return None

    now = datetime.utcnow()
    if sub.status in {SubscriptionStatus.CANCELED, SubscriptionStatus.SUSPENDED}:
        return sub

    wallet = ensure_wallet(db, str(tenant_pk), currency=sub.currency)

    if sub.trial_ends_at and now > sub.trial_ends_at and sub.plan_code == PlanCode.FREE_TRIAL:
        sub.status = SubscriptionStatus.READ_ONLY
        sub.read_only_reason = "Trial expired"
        db.add(sub)
        db.commit()
        db.refresh(sub)
        return sub

    if wallet.balance_credits <= 0 and sub.plan_code != PlanCode.FREE_TRIAL:
        sub.status = SubscriptionStatus.READ_ONLY
        sub.read_only_reason = "Credits exhausted"
        db.add(sub)
        db.commit()
        db.refresh(sub)
        return sub

    if sub.status == SubscriptionStatus.READ_ONLY and wallet.balance_credits > 0:
        sub.status = SubscriptionStatus.ACTIVE
        sub.read_only_reason = None
        db.add(sub)
        db.commit()
        db.refresh(sub)

    return sub


def assert_tenant_launch_ready(db: Session, tenant_id: str) -> None:
    """Validate that tenant billing state allows runtime provisioning."""
    tenant_pk = _as_uuid(tenant_id)
    sub = evaluate_subscription_state(db, str(tenant_pk))
    if not sub:
        raise ValueError("Tenant must select a subscription plan before launch")

    if sub.plan_code == PlanCode.FREE_TRIAL:
        return

    if sub.status != SubscriptionStatus.ACTIVE:
        raise ValueError("Tenant subscription is not active. Complete payment and activation before launch")

    verified_payment = (
        db.query(Payment)
        .filter(
            Payment.tenant_id == tenant_pk,
            Payment.purpose == "subscription",
            Payment.status == PaymentStatus.PAID,
        )
        .order_by(Payment.created_at.desc())
        .first()
    )
    if not verified_payment:
        raise ValueError("Tenant must complete subscription payment before launch")


def cancel_subscription(db: Session, tenant_id: str, reason: str = "Customer requested cancellation") -> Subscription | None:
    """Cancel a tenant's subscription immediately."""
    tenant_pk = _as_uuid(tenant_id)
    sub = db.query(Subscription).filter(Subscription.tenant_id == tenant_pk).first()
    if not sub:
        return None
    if sub.status in {SubscriptionStatus.CANCELED, SubscriptionStatus.EXPIRED}:
        return sub
    sub.status = SubscriptionStatus.CANCELED
    sub.canceled_at = datetime.utcnow()
    sub.read_only_reason = reason
    db.add(sub)
    db.commit()
    db.refresh(sub)
    write_audit_log(db, "tenant", tenant_id, "subscription_cancelled", "subscription", str(sub.id), {"reason": reason})
    return sub


def pause_subscription(db: Session, tenant_id: str, reason: str = "Customer requested pause") -> Subscription | None:
    """Suspend a tenant's subscription (pause service)."""
    tenant_pk = _as_uuid(tenant_id)
    sub = db.query(Subscription).filter(Subscription.tenant_id == tenant_pk).first()
    if not sub:
        return None
    if sub.status in {SubscriptionStatus.CANCELED, SubscriptionStatus.EXPIRED, SubscriptionStatus.SUSPENDED}:
        return sub
    sub.status = SubscriptionStatus.SUSPENDED
    sub.read_only_reason = reason
    db.add(sub)
    db.commit()
    db.refresh(sub)
    write_audit_log(db, "tenant", tenant_id, "subscription_paused", "subscription", str(sub.id), {"reason": reason})
    return sub


def resume_subscription(db: Session, tenant_id: str) -> Subscription | None:
    """Resume a suspended subscription."""
    tenant_pk = _as_uuid(tenant_id)
    sub = db.query(Subscription).filter(Subscription.tenant_id == tenant_pk).first()
    if not sub:
        return None
    if sub.status != SubscriptionStatus.SUSPENDED:
        return sub
    sub.status = SubscriptionStatus.ACTIVE
    sub.read_only_reason = None
    db.add(sub)
    db.commit()
    db.refresh(sub)
    write_audit_log(db, "tenant", tenant_id, "subscription_resumed", "subscription", str(sub.id), {})
    return sub


def write_audit_log(db: Session, actor_type: str, actor_id: str | uuid.UUID | None, action: str, target_type: str, target_id: str, metadata: dict | None = None) -> None:
    log = AuditLog(
        actor_type=actor_type,
        actor_id=str(actor_id) if actor_id is not None else None,
        action=action,
        target_type=target_type,
        target_id=target_id,
        metadata_json=json.dumps(metadata or {}),
    )
    db.add(log)
    db.commit()

_STATUS_MAP_TO_TENANT = {
    SubscriptionStatus.ACTIVE: "active",
    SubscriptionStatus.TRIALING: "trial",
    SubscriptionStatus.READ_ONLY: "suspended",
    SubscriptionStatus.SUSPENDED: "suspended",
    SubscriptionStatus.CANCELED: "canceled",
    SubscriptionStatus.EXPIRED: "expired",
}

_PLAN_MAP_TO_TENANT = {
    PlanCode.FREE_TRIAL: "free_trial",
    PlanCode.PROFESSIONAL: "pro",
    PlanCode.BUSINESS: "pro",
    PlanCode.DELIVERY_SERVICES: "enterprise",
}


def sync_subscription_state(db: Session, tenant_id: str) -> None:
    """Keep plan_code, status, and trial_ends_at aligned between Subscription (billing_subscriptions)
    and TenantSubscription (tenant_subscriptions).

    The Subscription table is the authoritative source -- it's what the billing/payment flow writes to.
    This function propagates its values to TenantSubscription so feature-gating code that reads
    tenant_subscriptions sees consistent state.
    """
    tenant_pk = _as_uuid(tenant_id)
    billing_sub = db.query(Subscription).filter(Subscription.tenant_id == tenant_pk).first()
    if not billing_sub:
        return

    tenant_sub = db.query(TenantSubscription).filter(TenantSubscription.tenant_id == str(tenant_pk)).first()
    if not tenant_sub:
        mapped_plan = _PLAN_MAP_TO_TENANT.get(billing_sub.plan_code, billing_sub.plan_code.value)
        mapped_status = _STATUS_MAP_TO_TENANT.get(billing_sub.status, billing_sub.status.value)
        tenant_sub = TenantSubscription(
            tenant_id=str(tenant_pk),
            plan_code=mapped_plan,
            status=mapped_status,
            trial=billing_sub.status == SubscriptionStatus.TRIALING,
            trial_ends_at=billing_sub.trial_ends_at,
            current_period_end=billing_sub.current_period_end,
            credits_balance=0,
        )
        db.add(tenant_sub)
        db.commit()
        db.refresh(tenant_sub)
        write_audit_log(
            db,
            "system",
            None,
            "tenant_subscription_created_via_sync",
            "tenant_subscription",
            str(tenant_sub.id),
            {"plan_code": mapped_plan, "status": mapped_status, "trial_ends_at": str(billing_sub.trial_ends_at) if billing_sub.trial_ends_at else None},
        )
        return

    mapped_plan = _PLAN_MAP_TO_TENANT.get(billing_sub.plan_code, billing_sub.plan_code.value)
    mapped_status = _STATUS_MAP_TO_TENANT.get(billing_sub.status, billing_sub.status.value)

    changed = False
    if tenant_sub.plan_code != mapped_plan:
        tenant_sub.plan_code = mapped_plan
        changed = True
    if tenant_sub.status != mapped_status:
        tenant_sub.status = mapped_status
        changed = True
    if tenant_sub.trial_ends_at != billing_sub.trial_ends_at:
        tenant_sub.trial_ends_at = billing_sub.trial_ends_at
        changed = True
    if tenant_sub.current_period_end != billing_sub.current_period_end:
        tenant_sub.current_period_end = billing_sub.current_period_end
        changed = True
    tenant_sub.trial = billing_sub.status == SubscriptionStatus.TRIALING

    if changed:
        db.add(tenant_sub)
        db.commit()
        write_audit_log(
            db,
            "system",
            None,
            "subscription_state_synced",
            "tenant_subscription",
            str(tenant_sub.id),
            {"plan_code": mapped_plan, "status": mapped_status, "trial_ends_at": str(billing_sub.trial_ends_at) if billing_sub.trial_ends_at else None},
        )
