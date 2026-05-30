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
from app.services.notification_service import notification_service


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
    "ai_chat_message": 2,
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
    },
    {
        "code": PlanCode.PROFESSIONAL,
        "name": "Starter",
        "currency": "GHS",
        "price_amount": 1000,
        "monthly_credit_allowance": 1200,
        "includes_custom_domain": False,
        "includes_priority_support": False,
    },
    {
        "code": PlanCode.BUSINESS,
        "name": "Growth",
        "currency": "GHS",
        "price_amount": 2500,
        "monthly_credit_allowance": 3500,
        "includes_custom_domain": True,
        "includes_priority_support": True,
    },
    {
        "code": PlanCode.DELIVERY_SERVICES,
        "name": "Enterprise",
        "currency": "GHS",
        "price_amount": 6000,
        "monthly_credit_allowance": 10000,
        "includes_custom_domain": True,
        "includes_priority_support": True,
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
    sub = Subscription(
        tenant_id=tenant_pk,
        plan_code=resolved_plan,
        status=SubscriptionStatus.TRIALING if resolved_plan == PlanCode.FREE_TRIAL else SubscriptionStatus.ACTIVE,
        currency=currency,
        started_at=now,
        current_period_end=now + timedelta(days=30),
        trial_ends_at=now + timedelta(days=30) if resolved_plan == PlanCode.FREE_TRIAL else None,
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
        plan = db.query(Plan).filter(Plan.code == payment.purpose).first()
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
    if not sub:
        sub = Subscription(
            tenant_id=tenant_pk,
            plan_code=resolved_plan,
            status=SubscriptionStatus.ACTIVE,
            currency=currency,
            started_at=now,
            current_period_end=now + timedelta(days=30),
            trial_ends_at=None,
        )
        db.add(sub)
    else:
        sub.plan_code = resolved_plan
        sub.status = SubscriptionStatus.ACTIVE
        sub.currency = currency
        sub.current_period_end = now + timedelta(days=30)
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
    return sub


def set_subscription_read_only(db: Session, tenant_id: str, reason: str) -> Subscription | None:
    tenant_pk = _as_uuid(tenant_id)
    sub = db.query(Subscription).filter(Subscription.tenant_id == tenant_pk).first()
    if not sub:
        return None
    sub.status = SubscriptionStatus.READ_ONLY
    sub.read_only_reason = reason
    db.add(sub)
    db.commit()
    db.refresh(sub)
    write_audit_log(db, "admin", None, "subscription_set_read_only", "subscription", str(sub.id), {"reason": reason})
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
