#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(pwd)"
APP_DIR="$ROOT_DIR/app"
BACKUP_DIR="$ROOT_DIR/.scaffold_backups/02_billing_subscription_$(date +%Y%m%d_%H%M%S)"

require_file() {
  local path="$1"
  if [[ ! -e "$path" ]]; then
    echo "ERROR: Expected path not found: $path"
    exit 1
  fi
}

backup_if_exists() {
  local path="$1"
  if [[ -e "$path" ]]; then
    mkdir -p "$BACKUP_DIR/$(dirname "${path#$ROOT_DIR/}")"
    cp -a "$path" "$BACKUP_DIR/${path#$ROOT_DIR/}"
  fi
}

echo "==> Validating repo root"
require_file "$ROOT_DIR/requirements.txt"
require_file "$ROOT_DIR/docker-compose.yml"
require_file "$APP_DIR"
require_file "$APP_DIR/main.py"

mkdir -p "$BACKUP_DIR"
mkdir -p \
  "$APP_DIR/billing" \
  "$APP_DIR/models" \
  "$APP_DIR/schemas" \
  "$APP_DIR/api/routes" \
  "$APP_DIR/services" \
  "$ROOT_DIR/docs"

echo "==> Backing up files that may change"
backup_if_exists "$APP_DIR/main.py"
backup_if_exists "$ROOT_DIR/requirements.txt"

echo "==> Writing billing models"
cat > "$APP_DIR/models/billing.py" <<'PY'
from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from enum import Enum as PyEnum

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PlanCode(str, PyEnum):
    FREE_TRIAL = "free_trial"
    PROFESSIONAL = "professional"
    BUSINESS = "business"


class SubscriptionStatus(str, PyEnum):
    TRIALING = "trialing"
    ACTIVE = "active"
    READ_ONLY = "read_only"
    CANCELED = "canceled"
    EXPIRED = "expired"
    SUSPENDED = "suspended"


class WalletTransactionType(str, PyEnum):
    CREDIT_PURCHASE = "credit_purchase"
    MANUAL_ADJUSTMENT = "manual_adjustment"
    AI_USAGE_DEBIT = "ai_usage_debit"
    DOCUMENT_PROCESSING_DEBIT = "document_processing_debit"
    REFUND = "refund"


class PaymentStatus(str, PyEnum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    VERIFIED = "verified"
    CANCELED = "canceled"


class Plan(Base):
    __tablename__ = "billing_plans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[PlanCode] = mapped_column(Enum(PlanCode), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="GHS")
    price_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    monthly_credit_allowance: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    includes_custom_domain: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    includes_priority_support: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Subscription(Base):
    __tablename__ = "billing_subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    plan_code: Mapped[PlanCode] = mapped_column(Enum(PlanCode), nullable=False)
    status: Mapped[SubscriptionStatus] = mapped_column(Enum(SubscriptionStatus), nullable=False, default=SubscriptionStatus.TRIALING)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="GHS")
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    current_period_end: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=lambda: datetime.utcnow() + timedelta(days=30))
    trial_ends_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    canceled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    read_only_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Wallet(Base):
    __tablename__ = "billing_wallets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, unique=True, index=True)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="GHS")
    balance_credits: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class WalletTransaction(Base):
    __tablename__ = "billing_wallet_transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    wallet_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("billing_wallets.id"), nullable=False, index=True)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    transaction_type: Mapped[WalletTransactionType] = mapped_column(Enum(WalletTransactionType), nullable=False)
    credits_delta: Mapped[int] = mapped_column(Integer, nullable=False)
    balance_after: Mapped[int] = mapped_column(Integer, nullable=False)
    reference: Mapped[str | None] = mapped_column(String(255), nullable=True)
    memo: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Payment(Base):
    __tablename__ = "billing_payments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    reference: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    purpose: Mapped[str] = mapped_column(String(50), nullable=False)  # subscription|credit_topup
    currency: Mapped[str] = mapped_column(String(10), nullable=False)
    amount_minor: Mapped[int] = mapped_column(Integer, nullable=False)  # paystack minor units
    status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)
    provider: Mapped[str] = mapped_column(String(50), nullable=False, default="paystack")
    provider_authorization_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    provider_access_code: Mapped[str | None] = mapped_column(String(255), nullable=True)
    provider_payload: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class AuditLog(Base):
    __tablename__ = "billing_audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_type: Mapped[str] = mapped_column(String(50), nullable=False)
    actor_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    target_type: Mapped[str] = mapped_column(String(50), nullable=False)
    target_id: Mapped[str] = mapped_column(String(255), nullable=False)
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
PY

echo "==> Writing billing schemas"
cat > "$APP_DIR/schemas/billing.py" <<'PY'
from __future__ import annotations

from pydantic import BaseModel, Field


class PlanResponse(BaseModel):
    code: str
    name: str
    currency: str
    price_amount: float
    monthly_credit_allowance: int
    includes_custom_domain: bool
    includes_priority_support: bool


class SubscriptionResponse(BaseModel):
    tenant_id: str
    plan_code: str
    status: str
    currency: str
    started_at: str
    current_period_end: str
    trial_ends_at: str | None = None
    read_only_reason: str | None = None


class WalletResponse(BaseModel):
    tenant_id: str
    currency: str
    balance_credits: int


class PaymentInitRequest(BaseModel):
    tenant_id: str
    email: str
    currency: str = Field(..., min_length=3, max_length=10)
    amount_major: float = Field(..., gt=0)
    purpose: str = Field(..., pattern="^(subscription|credit_topup)$")
    plan_code: str | None = None
    credits_to_buy: int | None = None
    callback_url: str | None = None


class PaymentInitResponse(BaseModel):
    reference: str
    authorization_url: str | None = None
    access_code: str | None = None
    status: str


class PaymentVerifyResponse(BaseModel):
    reference: str
    status: str
    provider_status: str | None = None
    message: str


class CreditConsumeRequest(BaseModel):
    tenant_id: str
    usage_type: str = Field(..., pattern="^(ai_usage|document_processing)$")
    credits: int = Field(..., gt=0)
    memo: str | None = None


class BillingAdminSetReadOnlyRequest(BaseModel):
    tenant_id: str
    reason: str


class BillingAdminAdjustCreditsRequest(BaseModel):
    tenant_id: str
    credits_delta: int
    memo: str | None = None


class BillingAdminAssignPlanRequest(BaseModel):
    tenant_id: str
    plan_code: str
    currency: str = "GHS"
PY

echo "==> Writing billing service"
cat > "$APP_DIR/services/billing_service.py" <<'PY'
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
PY

echo "==> Writing Paystack client"
cat > "$APP_DIR/services/paystack_client.py" <<'PY'
from __future__ import annotations

import os

import httpx

PAYSTACK_BASE_URL = "https://api.paystack.co"


def _headers() -> dict[str, str]:
    secret = os.getenv("PAYSTACK_SECRET_KEY", "")
    if not secret:
        raise RuntimeError("PAYSTACK_SECRET_KEY is not set")
    return {
        "Authorization": f"Bearer {secret}",
        "Content-Type": "application/json",
    }


def initialize_transaction(*, email: str, amount_minor: int, reference: str, currency: str, callback_url: str | None = None, metadata: dict | None = None) -> dict:
    payload = {
        "email": email,
        "amount": amount_minor,
        "reference": reference,
        "currency": currency,
        "metadata": metadata or {},
    }
    if callback_url:
        payload["callback_url"] = callback_url

    with httpx.Client(timeout=60.0) as client:
        resp = client.post(f"{PAYSTACK_BASE_URL}/transaction/initialize", headers=_headers(), json=payload)
        resp.raise_for_status()
        return resp.json()


def verify_transaction(reference: str) -> dict:
    with httpx.Client(timeout=60.0) as client:
        resp = client.get(f"{PAYSTACK_BASE_URL}/transaction/verify/{reference}", headers=_headers())
        resp.raise_for_status()
        return resp.json()
PY

echo "==> Writing billing routes"
cat > "$APP_DIR/api/routes/billing.py" <<'PY'
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.models.billing import Plan, Subscription, Wallet, WalletTransactionType
from app.schemas.billing import (
    BillingAdminAdjustCreditsRequest,
    BillingAdminAssignPlanRequest,
    BillingAdminSetReadOnlyRequest,
    CreditConsumeRequest,
    PaymentInitRequest,
    PaymentInitResponse,
    PaymentVerifyResponse,
    PlanResponse,
    SubscriptionResponse,
    WalletResponse,
)
from app.services.billing_service import (
    activate_or_upgrade_subscription,
    add_wallet_credits,
    admin_adjust_credits,
    consume_wallet_credits,
    create_payment,
    create_trial_subscription,
    ensure_wallet,
    evaluate_subscription_state,
    mark_payment_verified,
    seed_default_plans,
    set_payment_initialized,
    set_subscription_read_only,
)
from app.services.paystack_client import initialize_transaction, verify_transaction

router = APIRouter(prefix="/billing", tags=["Billing"])

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def _db() -> Session:
    return SessionLocal()


@router.get("/plans", response_model=list[PlanResponse])
def list_plans():
    db = _db()
    try:
        seed_default_plans(db)
        plans = db.query(Plan).filter(Plan.active == True).all()  # noqa: E712
        return [
            PlanResponse(
                code=p.code.value,
                name=p.name,
                currency=p.currency,
                price_amount=float(p.price_amount),
                monthly_credit_allowance=p.monthly_credit_allowance,
                includes_custom_domain=p.includes_custom_domain,
                includes_priority_support=p.includes_priority_support,
            )
            for p in plans
        ]
    finally:
        db.close()


@router.post("/subscriptions/trial/{tenant_id}", response_model=SubscriptionResponse)
def start_trial(tenant_id: str):
    db = _db()
    try:
        seed_default_plans(db)
        sub = create_trial_subscription(db, tenant_id)
        ensure_wallet(db, tenant_id, sub.currency)
        return SubscriptionResponse(
            tenant_id=sub.tenant_id,
            plan_code=sub.plan_code.value,
            status=sub.status.value,
            currency=sub.currency,
            started_at=sub.started_at.isoformat(),
            current_period_end=sub.current_period_end.isoformat(),
            trial_ends_at=sub.trial_ends_at.isoformat() if sub.trial_ends_at else None,
            read_only_reason=sub.read_only_reason,
        )
    finally:
        db.close()


@router.get("/subscriptions/{tenant_id}", response_model=SubscriptionResponse | None)
def get_subscription(tenant_id: str):
    db = _db()
    try:
        sub = evaluate_subscription_state(db, tenant_id)
        if not sub:
            return None
        return SubscriptionResponse(
            tenant_id=sub.tenant_id,
            plan_code=sub.plan_code.value,
            status=sub.status.value,
            currency=sub.currency,
            started_at=sub.started_at.isoformat(),
            current_period_end=sub.current_period_end.isoformat(),
            trial_ends_at=sub.trial_ends_at.isoformat() if sub.trial_ends_at else None,
            read_only_reason=sub.read_only_reason,
        )
    finally:
        db.close()


@router.get("/wallets/{tenant_id}", response_model=WalletResponse)
def get_wallet(tenant_id: str):
    db = _db()
    try:
        wallet = ensure_wallet(db, tenant_id)
        return WalletResponse(
            tenant_id=wallet.tenant_id,
            currency=wallet.currency,
            balance_credits=wallet.balance_credits,
        )
    finally:
        db.close()


@router.post("/payments/init", response_model=PaymentInitResponse)
def init_payment(request: PaymentInitRequest):
    db = _db()
    try:
        amount_minor = int(round(request.amount_major * 100))
        payment = create_payment(
            db=db,
            tenant_id=request.tenant_id,
            purpose=request.purpose,
            currency=request.currency,
            amount_minor=amount_minor,
        )

        payload = initialize_transaction(
            email=request.email,
            amount_minor=amount_minor,
            reference=payment.reference,
            currency=request.currency,
            callback_url=request.callback_url,
            metadata={
                "tenant_id": request.tenant_id,
                "purpose": request.purpose,
                "plan_code": request.plan_code,
                "credits_to_buy": request.credits_to_buy,
            },
        )
        data = payload.get("data", {})
        payment = set_payment_initialized(
            db,
            payment,
            authorization_url=data.get("authorization_url"),
            access_code=data.get("access_code"),
            provider_payload=payload,
        )

        return PaymentInitResponse(
            reference=payment.reference,
            authorization_url=payment.provider_authorization_url,
            access_code=payment.provider_access_code,
            status=payment.status.value,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Payment initialization failed: {exc}") from exc
    finally:
        db.close()


@router.post("/payments/verify/{reference}", response_model=PaymentVerifyResponse)
def verify_payment(reference: str):
    db = _db()
    try:
        payload = verify_transaction(reference)
        data = payload.get("data", {})
        status = data.get("status")

        payment = db.query(app.models.billing.Payment).filter(app.models.billing.Payment.reference == reference).first()  # type: ignore
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")

        if status == "success":
            payment = mark_payment_verified(db, payment, payload)

            metadata = data.get("metadata") or {}
            purpose = metadata.get("purpose") or payment.purpose
            tenant_id = metadata.get("tenant_id") or payment.tenant_id

            if purpose == "subscription":
                plan_code = metadata.get("plan_code") or "professional"
                activate_or_upgrade_subscription(db, tenant_id=tenant_id, plan_code=plan_code, currency=payment.currency)

            elif purpose == "credit_topup":
                credits = int(metadata.get("credits_to_buy") or 0)
                if credits > 0:
                    add_wallet_credits(
                        db,
                        tenant_id=tenant_id,
                        credits=credits,
                        tx_type=WalletTransactionType.CREDIT_PURCHASE,
                        reference=reference,
                        memo="Paystack credit purchase",
                    )

            return PaymentVerifyResponse(
                reference=reference,
                status="verified",
                provider_status=status,
                message="Payment verified successfully",
            )

        return PaymentVerifyResponse(
            reference=reference,
            status="failed",
            provider_status=status,
            message="Payment not successful",
        )
    finally:
        db.close()


@router.post("/credits/consume", response_model=WalletResponse)
def consume_credits(request: CreditConsumeRequest):
    db = _db()
    try:
        wallet = consume_wallet_credits(
            db,
            tenant_id=request.tenant_id,
            usage_type=request.usage_type,
            credits=request.credits,
            memo=request.memo,
        )
        return WalletResponse(
            tenant_id=wallet.tenant_id,
            currency=wallet.currency,
            balance_credits=wallet.balance_credits,
        )
    except ValueError as exc:
        raise HTTPException(status_code=402, detail=str(exc)) from exc
    finally:
        db.close()


@router.post("/admin/read-only", response_model=SubscriptionResponse | None)
def admin_set_read_only(request: BillingAdminSetReadOnlyRequest):
    db = _db()
    try:
        sub = set_subscription_read_only(db, tenant_id=request.tenant_id, reason=request.reason)
        if not sub:
            return None
        return SubscriptionResponse(
            tenant_id=sub.tenant_id,
            plan_code=sub.plan_code.value,
            status=sub.status.value,
            currency=sub.currency,
            started_at=sub.started_at.isoformat(),
            current_period_end=sub.current_period_end.isoformat(),
            trial_ends_at=sub.trial_ends_at.isoformat() if sub.trial_ends_at else None,
            read_only_reason=sub.read_only_reason,
        )
    finally:
        db.close()


@router.post("/admin/credits/adjust", response_model=WalletResponse)
def admin_credits_adjust(request: BillingAdminAdjustCreditsRequest):
    db = _db()
    try:
        wallet = admin_adjust_credits(
            db,
            tenant_id=request.tenant_id,
            credits_delta=request.credits_delta,
            memo=request.memo,
        )
        return WalletResponse(
            tenant_id=wallet.tenant_id,
            currency=wallet.currency,
            balance_credits=wallet.balance_credits,
        )
    finally:
        db.close()


@router.post("/admin/subscriptions/assign", response_model=SubscriptionResponse)
def admin_assign_plan(request: BillingAdminAssignPlanRequest):
    db = _db()
    try:
        sub = activate_or_upgrade_subscription(
            db,
            tenant_id=request.tenant_id,
            plan_code=request.plan_code,
            currency=request.currency,
        )
        return SubscriptionResponse(
            tenant_id=sub.tenant_id,
            plan_code=sub.plan_code.value,
            status=sub.status.value,
            currency=sub.currency,
            started_at=sub.started_at.isoformat(),
            current_period_end=sub.current_period_end.isoformat(),
            trial_ends_at=sub.trial_ends_at.isoformat() if sub.trial_ends_at else None,
            read_only_reason=sub.read_only_reason,
        )
    finally:
        db.close()
PY

echo "==> Patching billing route import bug"
python3 - <<'PY'
from pathlib import Path
p = Path("app/api/routes/billing.py")
t = p.read_text()
t = t.replace("payment = db.query(app.models.billing.Payment).filter(app.models.billing.Payment.reference == reference).first()  # type: ignore", "from app.models.billing import Payment\n        payment = db.query(Payment).filter(Payment.reference == reference).first()")
p.write_text(t)
print("billing route patched")
PY

echo "==> Writing read-only guard helper"
cat > "$APP_DIR/billing/guards.py" <<'PY'
from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.services.billing_service import evaluate_subscription_state

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def is_tenant_read_only(tenant_id: str) -> tuple[bool, str | None]:
    db = SessionLocal()
    try:
        sub = evaluate_subscription_state(db, tenant_id)
        if not sub:
            return False, None
        if sub.status.value == "read_only":
            return True, sub.read_only_reason
        return False, None
    finally:
        db.close()
PY

echo "==> Writing billing blueprint doc"
cat > "$ROOT_DIR/docs/BILLING_SUBSCRIPTION_INTEGRATION.md" <<'MD'
# Billing & Subscription Integration Guide

## Policy Decisions
- enforcement mode: read-only when trial expires or credits are exhausted
- credits apply to: AI usage and document processing
- paystack flow: fully API-based

## Core Concepts
- plans: free trial, professional, business
- subscription controls access/entitlements
- wallet controls credit balance
- wallet transactions provide auditability
- payment verification activates subscriptions or tops up credits
- admin can force read-only, adjust credits, assign plans

## Routes
- `GET /api/v1/billing/plans`
- `POST /api/v1/billing/subscriptions/trial/{tenant_id}`
- `GET /api/v1/billing/subscriptions/{tenant_id}`
- `GET /api/v1/billing/wallets/{tenant_id}`
- `POST /api/v1/billing/payments/init`
- `POST /api/v1/billing/payments/verify/{reference}`
- `POST /api/v1/billing/credits/consume`
- `POST /api/v1/billing/admin/read-only`
- `POST /api/v1/billing/admin/credits/adjust`
- `POST /api/v1/billing/admin/subscriptions/assign`

## Important
This scaffold writes models and APIs, but you must still:
- create Alembic migrations
- connect trial/wallet creation to tenant onboarding
- enforce read-only on protected business actions
- verify Paystack webhook signatures if webhooks are added later
- localize plan labels for English and Chinese
MD

echo "==> Patching requirements.txt"
python3 - <<'PY'
from pathlib import Path

path = Path("requirements.txt")
text = path.read_text(encoding="utf-8")
required = ["httpx"]
lines = text.splitlines()

for pkg in required:
    if not any(line.strip().lower() == pkg for line in lines):
        lines.append(pkg)

path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
print("requirements.txt updated")
PY

echo "==> Patching main.py"
python3 - <<'PY'
from pathlib import Path

path = Path("app/main.py")
text = path.read_text(encoding="utf-8")

imports_to_add = [
    "from app.api.routes.billing import router as billing_router",
]

for imp in imports_to_add:
    if imp not in text:
        text = imp + "\n" + text

route_line = 'app.include_router(billing_router, prefix="/api/v1")'
if route_line not in text:
    insertion_point = text.rfind("app.include_router(")
    if insertion_point != -1:
        line_end = text.find("\n", insertion_point)
        text = text[:line_end + 1] + route_line + "\n" + text[line_end + 1:]
    else:
        text += "\n" + route_line + "\n"

path.write_text(text, encoding="utf-8")
print("app/main.py updated")
PY

echo "==> Ensuring package init files exist"
touch "$APP_DIR/billing/__init__.py"

echo
echo "Scaffold complete."
echo
echo "Saved backups under:"
echo "  $BACKUP_DIR"
echo
echo "Next steps:"
echo "  1) Review app/main.py"
echo "  2) Review app/models/billing.py and app/api/routes/billing.py"
echo "  3) Set Paystack env vars in .env:"
echo "       PAYSTACK_SECRET_KEY=..."
echo "  4) Rebuild containers:"
echo "       sudo docker compose down"
echo "       sudo docker compose up -d --build"
echo "  5) Start a trial:"
echo "       curl -X POST http://localhost:8000/api/v1/billing/subscriptions/trial/<TENANT_ID>"
echo "  6) List plans:"
echo "       curl http://localhost:8000/api/v1/billing/plans"
echo
echo "Manual follow-up still needed:"
echo "  - add Alembic migrations"
echo "  - bind billing state into tenant onboarding"
echo "  - add route/middleware-level read-only enforcement"
echo "  - add Paystack webhook endpoint later if desired"
