from __future__ import annotations

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


DEFAULT_PLANS = [
    {
        "code": PlanCode.FREE_TRIAL,
        "name": "Free Trial",
        "currency": "GHS",
        "price_amount": 0,
        "monthly_credit_allowance": 0,
        "includes_custom_domain": False,
        "includes_priority_support": False,
    },
    {
        "code": PlanCode.PROFESSIONAL,
        "name": "Professional",
        "currency": "GHS",
        "price_amount": 1000,
        "monthly_credit_allowance": 1000,
        "includes_custom_domain": True,
        "includes_priority_support": False,
    },
    {
        "code": PlanCode.BUSINESS,
        "name": "Business",
        "currency": "GHS",
        "price_amount": 2500,
        "monthly_credit_allowance": 3000,
        "includes_custom_domain": True,
        "includes_priority_support": True,
    },
]


def seed_default_plans(db: Session) -> None:
    for item in DEFAULT_PLANS:
        existing = db.query(Plan).filter(Plan.code == item["code"]).first()
        if existing:
            continue
        db.add(Plan(**item))
    db.commit()


def create_trial_subscription(db: Session, tenant_id: str, currency: str = "GHS") -> Subscription:
    existing = db.query(Subscription).filter(Subscription.tenant_id == tenant_id).first()
    if existing:
        return existing

    now = datetime.utcnow()
    sub = Subscription(
        tenant_id=tenant_id,
        plan_code=PlanCode.FREE_TRIAL,
        status=SubscriptionStatus.TRIALING,
        currency=currency,
        started_at=now,
        current_period_end=now + timedelta(days=30),
        trial_ends_at=now + timedelta(days=30),
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    write_audit_log(db, "system", None, "trial_subscription_created", "subscription", str(sub.id), {"tenant_id": tenant_id})
    return sub


def ensure_wallet(db: Session, tenant_id: str, currency: str = "GHS") -> Wallet:
    wallet = db.query(Wallet).filter(Wallet.tenant_id == tenant_id).first()
    if wallet:
        return wallet
    wallet = Wallet(tenant_id=tenant_id, currency=currency, balance_credits=0)
    db.add(wallet)
    db.commit()
    db.refresh(wallet)
    return wallet


def create_payment(db: Session, tenant_id: str, purpose: str, currency: str, amount_minor: int) -> Payment:
    payment = Payment(
        tenant_id=tenant_id,
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


def activate_or_upgrade_subscription(db: Session, tenant_id: str, plan_code: str, currency: str) -> Subscription:
    sub = db.query(Subscription).filter(Subscription.tenant_id == tenant_id).first()
    now = datetime.utcnow()
    if not sub:
        sub = Subscription(
            tenant_id=tenant_id,
            plan_code=PlanCode(plan_code),
            status=SubscriptionStatus.ACTIVE,
            currency=currency,
            started_at=now,
            current_period_end=now + timedelta(days=30),
            trial_ends_at=None,
        )
        db.add(sub)
    else:
        sub.plan_code = PlanCode(plan_code)
        sub.status = SubscriptionStatus.ACTIVE
        sub.currency = currency
        sub.current_period_end = now + timedelta(days=30)
        sub.trial_ends_at = None
        sub.read_only_reason = None
        db.add(sub)
    db.commit()
    db.refresh(sub)
    write_audit_log(db, "system", None, "subscription_activated_or_upgraded", "subscription", str(sub.id), {"tenant_id": tenant_id, "plan_code": plan_code})
    return sub


def set_subscription_read_only(db: Session, tenant_id: str, reason: str) -> Subscription | None:
    sub = db.query(Subscription).filter(Subscription.tenant_id == tenant_id).first()
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
    wallet = ensure_wallet(db, tenant_id)
    wallet.balance_credits += credits
    db.add(wallet)
    db.commit()
    db.refresh(wallet)

    tx = WalletTransaction(
        wallet_id=wallet.id,
        tenant_id=tenant_id,
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
    wallet = ensure_wallet(db, tenant_id)
    if wallet.balance_credits < credits:
        set_subscription_read_only(db, tenant_id, f"Insufficient credits for {usage_type}")
        raise ValueError("Insufficient credits")

    wallet.balance_credits -= credits
    db.add(wallet)
    db.commit()
    db.refresh(wallet)

    tx_type = WalletTransactionType.AI_USAGE_DEBIT if usage_type == "ai_usage" else WalletTransactionType.DOCUMENT_PROCESSING_DEBIT

    tx = WalletTransaction(
        wallet_id=wallet.id,
        tenant_id=tenant_id,
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
    wallet = ensure_wallet(db, tenant_id)
    wallet.balance_credits += credits_delta
    db.add(wallet)
    db.commit()
    db.refresh(wallet)

    tx = WalletTransaction(
        wallet_id=wallet.id,
        tenant_id=tenant_id,
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
    sub = db.query(Subscription).filter(Subscription.tenant_id == tenant_id).first()
    if not sub:
        return None

    now = datetime.utcnow()
    if sub.status in {SubscriptionStatus.CANCELED, SubscriptionStatus.SUSPENDED}:
        return sub

    wallet = ensure_wallet(db, tenant_id, currency=sub.currency)

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


def write_audit_log(db: Session, actor_type: str, actor_id: str | None, action: str, target_type: str, target_id: str, metadata: dict | None = None) -> None:
    log = AuditLog(
        actor_type=actor_type,
        actor_id=actor_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        metadata_json=json.dumps(metadata or {}),
    )
    db.add(log)
    db.commit()
