#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(pwd)"
APP_DIR="$ROOT_DIR/app"
BACKUP_DIR="$ROOT_DIR/.scaffold_backups/phase_1A_commercial_orchestration_$(date +%Y%m%d_%H%M%S)"

require_path() {
  local path="$1"
  if [[ ! -e "$path" ]]; then
    echo "ERROR: Required path not found: $path"
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
require_path "$ROOT_DIR/requirements.txt"
require_path "$ROOT_DIR/app"
require_path "$ROOT_DIR/app/main.py"

mkdir -p "$BACKUP_DIR"
mkdir -p \
  "$APP_DIR/models" \
  "$APP_DIR/schemas" \
  "$APP_DIR/services" \
  "$APP_DIR/api/routes" \
  "$ROOT_DIR/docs"

echo "==> Backing up files"
backup_if_exists "$APP_DIR/main.py"
backup_if_exists "$ROOT_DIR/requirements.txt"

echo "==> Writing phase 1A models"
cat > "$APP_DIR/models/commercial_orchestration.py" <<'PY'
from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


def enum_values(enum_cls):
    return [e.value for e in enum_cls]


class SignupFlowStatus(str, PyEnum):
    INITIATED = "initiated"
    PLAN_SELECTED = "plan_selected"
    PENDING_PAYMENT = "pending_payment"
    PAYMENT_CONFIRMED = "payment_confirmed"
    REGISTRATION_COMPLETED = "registration_completed"
    TENANT_CREATED = "tenant_created"
    RUNTIME_REQUESTED = "runtime_requested"
    ACTIVE = "active"
    FAILED = "failed"


class SignupActorType(str, PyEnum):
    TENANT_ORG = "tenant_org"
    VENDOR = "vendor"


class AddOnType(str, PyEnum):
    AI = "ai"
    ADVANCED_CRM = "advanced_crm"
    PREMIUM_SUPPORT = "premium_support"
    MULTILINGUAL = "multilingual"
    ADVANCED_AUTOMATION = "advanced_automation"
    CUSTOM_DOMAIN_PREMIUM = "custom_domain_premium"


class PaymentMethodCode(str, PyEnum):
    PAYSTACK = "paystack"
    PAYPAL = "paypal"
    ALIPAY = "alipay"
    WECHAT = "wechat"
    CRYPTO = "crypto"
    INTERNAL_VIRTUAL_CARD = "internal_virtual_card"


class CommercialPlan(Base):
    __tablename__ = "commercial_plans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="GHS")
    monthly_price: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    setup_price: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    default_free_credits: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_free_tier: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    tenant_runtime_included: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    website_included: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class CommercialAddOn(Base):
    __tablename__ = "commercial_add_ons"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[AddOnType] = mapped_column(Enum(AddOnType, values_callable=enum_values), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="GHS")
    monthly_price: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    setup_price: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    info_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class SharedPaymentMethod(Base):
    __tablename__ = "shared_payment_methods"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[PaymentMethodCode] = mapped_column(Enum(PaymentMethodCode, values_callable=enum_values), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    inherited_by_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    transaction_fee_percent: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False, default=0)
    fixed_fee: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class SignupSession(Base):
    __tablename__ = "signup_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_type: Mapped[SignupActorType] = mapped_column(Enum(SignupActorType, values_callable=enum_values), nullable=False)
    status: Mapped[SignupFlowStatus] = mapped_column(Enum(SignupFlowStatus, values_callable=enum_values), nullable=False, default=SignupFlowStatus.INITIATED)

    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(120), nullable=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    organization_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    organization_slug: Mapped[str | None] = mapped_column(String(150), nullable=True, index=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    selected_plan_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    selected_currency: Mapped[str | None] = mapped_column(String(10), nullable=True)
    selected_payment_method: Mapped[str | None] = mapped_column(String(100), nullable=True)

    total_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    subscription_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    payment_reference: Mapped[str | None] = mapped_column(String(255), nullable=True)
    receipt_reference: Mapped[str | None] = mapped_column(String(255), nullable=True)

    tenant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)

    abuse_fingerprint: Mapped[str | None] = mapped_column(String(255), nullable=True)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class SignupSessionAddOn(Base):
    __tablename__ = "signup_session_add_ons"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    signup_session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("signup_sessions.id"), nullable=False, index=True)
    add_on_code: Mapped[AddOnType] = mapped_column(Enum(AddOnType, values_callable=enum_values), nullable=False)
    monthly_price: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    setup_price: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class SignupSessionPaymentMethod(Base):
    __tablename__ = "signup_session_payment_methods"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    signup_session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("signup_sessions.id"), nullable=False, index=True)
    payment_method_code: Mapped[PaymentMethodCode] = mapped_column(Enum(PaymentMethodCode, values_callable=enum_values), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class CommercialOrchestrationEvent(Base):
    __tablename__ = "commercial_orchestration_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    signup_session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("signup_sessions.id"), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(120), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    payload_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
PY

echo "==> Writing phase 1A schemas"
cat > "$APP_DIR/schemas/commercial_orchestration.py" <<'PY'
from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class PublicPlanResponse(BaseModel):
    code: str
    name: str
    description: str | None = None
    currency: str
    monthly_price: float
    setup_price: float
    default_free_credits: int
    is_free_tier: bool
    tenant_runtime_included: bool
    website_included: bool


class PublicAddOnResponse(BaseModel):
    code: str
    name: str
    description: str | None = None
    currency: str
    monthly_price: float
    setup_price: float
    info_text: str | None = None


class PublicPaymentMethodResponse(BaseModel):
    code: str
    name: str
    description: str | None = None
    inherited_by_default: bool
    transaction_fee_percent: float
    fixed_fee: float


class SignupInitiateRequest(BaseModel):
    actor_type: str = Field(..., pattern="^(tenant_org|vendor)$")
    email: EmailStr
    phone: str | None = None
    full_name: str | None = None


class SignupPlanSelectionRequest(BaseModel):
    signup_session_id: str
    plan_code: str
    currency: str = "GHS"
    add_on_codes: list[str] = Field(default_factory=list)
    requested_payment_methods: list[str] = Field(default_factory=list)


class SignupRegistrationRequest(BaseModel):
    signup_session_id: str
    organization_name: str | None = None
    organization_slug: str | None = None
    country: str | None = None
    full_name: str | None = None
    phone: str | None = None


class SignupFinalizeRequest(BaseModel):
    signup_session_id: str
    payment_reference: str | None = None
    mark_payment_successful: bool = True


class SignupSessionResponse(BaseModel):
    id: str
    actor_type: str
    status: str
    email: str
    phone: str | None = None
    full_name: str | None = None
    organization_name: str | None = None
    organization_slug: str | None = None
    selected_plan_code: str | None = None
    selected_currency: str | None = None
    selected_payment_method: str | None = None
    total_amount: float
    payment_reference: str | None = None
    receipt_reference: str | None = None
    subscription_id: str | None = None
    tenant_id: str | None = None
    last_error: str | None = None


class PublicPricingBundleResponse(BaseModel):
    plans: list[PublicPlanResponse]
    add_ons: list[PublicAddOnResponse]
    payment_methods: list[PublicPaymentMethodResponse]


class SignupFinalizeResponse(BaseModel):
    signup_session: SignupSessionResponse
    next_action: str
    tenant_slug: str | None = None
    tenant_url: str | None = None
PY

echo "==> Writing phase 1A service"
cat > "$APP_DIR/services/commercial_orchestration_service.py" <<'PY'
from __future__ import annotations

import json
import re
import uuid
from decimal import Decimal
from typing import Iterable

from sqlalchemy.orm import Session

from app.models.commercial_orchestration import (
    AddOnType,
    CommercialAddOn,
    CommercialOrchestrationEvent,
    CommercialPlan,
    PaymentMethodCode,
    SharedPaymentMethod,
    SignupActorType,
    SignupFlowStatus,
    SignupSession,
    SignupSessionAddOn,
    SignupSessionPaymentMethod,
)

SLUG_RE = re.compile(r"[^a-z0-9-]+")


def seed_commercial_catalog(db: Session) -> None:
    plans = [
        {
            "code": "free",
            "name": "Free",
            "description": "Entry tier with limited credits and inherited shared platform services.",
            "currency": "GHS",
            "monthly_price": 0,
            "setup_price": 0,
            "default_free_credits": 50,
            "is_free_tier": True,
            "tenant_runtime_included": True,
            "website_included": True,
        },
        {
            "code": "professional",
            "name": "Professional",
            "description": "Production tenant website with standard commercial operations.",
            "currency": "GHS",
            "monthly_price": 1000,
            "setup_price": 0,
            "default_free_credits": 250,
            "is_free_tier": False,
            "tenant_runtime_included": True,
            "website_included": True,
        },
        {
            "code": "business",
            "name": "Business",
            "description": "Higher-volume tenant operations with expanded service capacity.",
            "currency": "GHS",
            "monthly_price": 2500,
            "setup_price": 0,
            "default_free_credits": 1000,
            "is_free_tier": False,
            "tenant_runtime_included": True,
            "website_included": True,
        },
        {
            "code": "vendor",
            "name": "Vendor",
            "description": "Shared control-plane subscription for riders, drivers, and vendors without isolated websites.",
            "currency": "GHS",
            "monthly_price": 300,
            "setup_price": 0,
            "default_free_credits": 0,
            "is_free_tier": False,
            "tenant_runtime_included": False,
            "website_included": False,
        },
    ]

    add_ons = [
        {
            "code": AddOnType.AI,
            "name": "AI Assistant",
            "description": "Tenant AI assistant connected to shared Ollama infrastructure.",
            "currency": "GHS",
            "monthly_price": 250,
            "setup_price": 0,
            "info_text": "AI usage may also consume credits depending on tenant activity.",
        },
        {
            "code": AddOnType.ADVANCED_CRM,
            "name": "Advanced CRM",
            "description": "Expanded CRM workflows and business pipeline support.",
            "currency": "GHS",
            "monthly_price": 150,
            "setup_price": 0,
            "info_text": "Adds enhanced account segmentation and quote workflows.",
        },
        {
            "code": AddOnType.PREMIUM_SUPPORT,
            "name": "Premium Support",
            "description": "Higher-priority support handling.",
            "currency": "GHS",
            "monthly_price": 200,
            "setup_price": 0,
            "info_text": "Support response policies vary by subscription package and operating region.",
        },
        {
            "code": AddOnType.MULTILINGUAL,
            "name": "Multilingual Package",
            "description": "Enable multilingual tenant-facing capabilities.",
            "currency": "GHS",
            "monthly_price": 120,
            "setup_price": 0,
            "info_text": "Recommended for mixed-language customer bases.",
        },
    ]

    payment_methods = [
        {
            "code": PaymentMethodCode.PAYSTACK,
            "name": "Paystack",
            "description": "Shared Paystack rails inherited from the platform.",
            "inherited_by_default": True,
            "transaction_fee_percent": 1.5000,
            "fixed_fee": 0,
        },
        {
            "code": PaymentMethodCode.PAYPAL,
            "name": "PayPal",
            "description": "Shared PayPal rails inherited from the platform.",
            "inherited_by_default": True,
            "transaction_fee_percent": 3.5000,
            "fixed_fee": 0,
        },
        {
            "code": PaymentMethodCode.ALIPAY,
            "name": "Alipay",
            "description": "Shared Alipay rails inherited from the platform.",
            "inherited_by_default": True,
            "transaction_fee_percent": 2.5000,
            "fixed_fee": 0,
        },
        {
            "code": PaymentMethodCode.WECHAT,
            "name": "WeChat Pay",
            "description": "Shared WeChat Pay rails inherited from the platform.",
            "inherited_by_default": True,
            "transaction_fee_percent": 2.5000,
            "fixed_fee": 0,
        },
        {
            "code": PaymentMethodCode.CRYPTO,
            "name": "Cryptocurrency",
            "description": "Shared crypto rails inherited from the platform.",
            "inherited_by_default": True,
            "transaction_fee_percent": 1.0000,
            "fixed_fee": 0,
        },
        {
            "code": PaymentMethodCode.INTERNAL_VIRTUAL_CARD,
            "name": "Internal Virtual Card",
            "description": "Platform-controlled virtual spend instrument.",
            "inherited_by_default": True,
            "transaction_fee_percent": 0.5000,
            "fixed_fee": 0,
        },
    ]

    for plan in plans:
        existing = db.query(CommercialPlan).filter(CommercialPlan.code == plan["code"]).first()
        if not existing:
            db.add(CommercialPlan(**plan))

    for addon in add_ons:
        existing = db.query(CommercialAddOn).filter(CommercialAddOn.code == addon["code"]).first()
        if not existing:
            db.add(CommercialAddOn(**addon))

    for method in payment_methods:
        existing = db.query(SharedPaymentMethod).filter(SharedPaymentMethod.code == method["code"]).first()
        if not existing:
            db.add(SharedPaymentMethod(**method))

    db.commit()


def normalize_slug(value: str) -> str:
    value = value.strip().lower().replace(" ", "-")
    value = SLUG_RE.sub("-", value)
    value = re.sub(r"-{2,}", "-", value).strip("-")
    return value[:120]


def log_event(db: Session, signup_session_id, event_type: str, message: str, payload: dict | None = None) -> None:
    row = CommercialOrchestrationEvent(
        signup_session_id=signup_session_id,
        event_type=event_type,
        message=message,
        payload_json=json.dumps(payload) if payload else None,
    )
    db.add(row)
    db.commit()


def create_signup_session(
    db: Session,
    *,
    actor_type: str,
    email: str,
    phone: str | None = None,
    full_name: str | None = None,
) -> SignupSession:
    row = SignupSession(
        actor_type=SignupActorType(actor_type),
        status=SignupFlowStatus.INITIATED,
        email=email,
        phone=phone,
        full_name=full_name,
        abuse_fingerprint=f"{email.lower()}::{phone or ''}",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    log_event(db, row.id, "signup_initiated", "Signup session initiated")
    return row


def select_plan_and_addons(
    db: Session,
    *,
    signup_session_id: str,
    plan_code: str,
    currency: str,
    add_on_codes: list[str],
    requested_payment_methods: list[str],
) -> SignupSession:
    row = db.query(SignupSession).filter(SignupSession.id == signup_session_id).first()
    if not row:
        raise ValueError("Signup session not found")

    plan = db.query(CommercialPlan).filter(CommercialPlan.code == plan_code, CommercialPlan.active == True).first()  # noqa: E712
    if not plan:
        raise ValueError("Selected plan does not exist")

    db.query(SignupSessionAddOn).filter(SignupSessionAddOn.signup_session_id == row.id).delete()
    db.query(SignupSessionPaymentMethod).filter(SignupSessionPaymentMethod.signup_session_id == row.id).delete()
    db.commit()

    total = Decimal(plan.monthly_price) + Decimal(plan.setup_price)
    row.selected_plan_code = plan.code
    row.selected_currency = currency
    row.status = SignupFlowStatus.PLAN_SELECTED

    for add_on_code in add_on_codes:
        addon = db.query(CommercialAddOn).filter(
            CommercialAddOn.code == AddOnType(add_on_code),
            CommercialAddOn.active == True,  # noqa: E712
        ).first()
        if not addon:
            continue
        db.add(SignupSessionAddOn(
            signup_session_id=row.id,
            add_on_code=addon.code,
            monthly_price=addon.monthly_price,
            setup_price=addon.setup_price,
        ))
        total += Decimal(addon.monthly_price) + Decimal(addon.setup_price)

    selected_payment = None
    for method_code in requested_payment_methods:
        try:
            code = PaymentMethodCode(method_code)
        except Exception:
            continue
        method = db.query(SharedPaymentMethod).filter(
            SharedPaymentMethod.code == code,
            SharedPaymentMethod.enabled == True,  # noqa: E712
        ).first()
        if not method:
            continue
        db.add(SignupSessionPaymentMethod(
            signup_session_id=row.id,
            payment_method_code=method.code,
        ))
        if not selected_payment:
            selected_payment = method.code.value

    row.selected_payment_method = selected_payment
    row.total_amount = total
    db.add(row)
    db.commit()
    db.refresh(row)
    log_event(db, row.id, "plan_selected", "Plan and add-ons selected", {
        "plan_code": plan.code,
        "currency": currency,
        "add_on_codes": add_on_codes,
        "requested_payment_methods": requested_payment_methods,
        "total_amount": float(total),
    })
    return row


def complete_registration(
    db: Session,
    *,
    signup_session_id: str,
    organization_name: str | None = None,
    organization_slug: str | None = None,
    country: str | None = None,
    full_name: str | None = None,
    phone: str | None = None,
) -> SignupSession:
    row = db.query(SignupSession).filter(SignupSession.id == signup_session_id).first()
    if not row:
        raise ValueError("Signup session not found")

    row.organization_name = organization_name or row.organization_name
    row.organization_slug = normalize_slug(organization_slug or organization_name or row.organization_slug or "tenant")
    row.country = country or row.country
    row.full_name = full_name or row.full_name
    row.phone = phone or row.phone
    row.status = SignupFlowStatus.REGISTRATION_COMPLETED
    db.add(row)
    db.commit()
    db.refresh(row)
    log_event(db, row.id, "registration_completed", "Signup registration details completed")
    return row


def finalize_signup(
    db: Session,
    *,
    signup_session_id: str,
    payment_reference: str | None = None,
    mark_payment_successful: bool = True,
) -> SignupSession:
    row = db.query(SignupSession).filter(SignupSession.id == signup_session_id).first()
    if not row:
        raise ValueError("Signup session not found")
    if not row.selected_plan_code:
        raise ValueError("Plan not selected")
    if not row.organization_slug and row.actor_type == SignupActorType.TENANT_ORG:
        raise ValueError("Organization slug not set")

    plan = db.query(CommercialPlan).filter(CommercialPlan.code == row.selected_plan_code).first()
    if not plan:
        raise ValueError("Plan not found")

    row.payment_reference = payment_reference or row.payment_reference or f"signup_{uuid.uuid4().hex[:18]}"
    row.receipt_reference = row.receipt_reference or f"rcpt_{uuid.uuid4().hex[:18]}"
    row.subscription_id = row.subscription_id or f"sub_{uuid.uuid4().hex[:18]}"

    if mark_payment_successful:
        row.status = SignupFlowStatus.PAYMENT_CONFIRMED
        log_event(db, row.id, "payment_confirmed", "Signup payment confirmed", {
            "payment_reference": row.payment_reference,
            "receipt_reference": row.receipt_reference,
            "subscription_id": row.subscription_id,
        })
    else:
        row.status = SignupFlowStatus.PENDING_PAYMENT
        db.add(row)
        db.commit()
        db.refresh(row)
        return row

    # Auto-tenant contract creation marker
    if row.actor_type == SignupActorType.TENANT_ORG:
        row.tenant_id = row.tenant_id or uuid.uuid4()
        row.status = SignupFlowStatus.TENANT_CREATED
        db.add(row)
        db.commit()
        db.refresh(row)
        log_event(db, row.id, "tenant_created", "Tenant contract created automatically", {
            "tenant_id": str(row.tenant_id),
            "tenant_slug": row.organization_slug,
            "plan_code": row.selected_plan_code,
        })

        row.status = SignupFlowStatus.RUNTIME_REQUESTED
        db.add(row)
        db.commit()
        db.refresh(row)
        log_event(db, row.id, "runtime_requested", "Tenant runtime should now be deployed automatically", {
            "tenant_id": str(row.tenant_id),
            "tenant_slug": row.organization_slug,
            "credits": plan.default_free_credits,
        })

    else:
        row.status = SignupFlowStatus.ACTIVE
        db.add(row)
        db.commit()
        db.refresh(row)
        log_event(db, row.id, "vendor_subscription_activated", "Vendor subscription activated")

    return row
PY

echo "==> Writing phase 1A routes"
cat > "$APP_DIR/api/routes/commercial_orchestration.py" <<'PY'
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.models.commercial_orchestration import CommercialAddOn, CommercialPlan, SharedPaymentMethod, SignupSession
from app.schemas.commercial_orchestration import (
    PublicAddOnResponse,
    PublicPaymentMethodResponse,
    PublicPlanResponse,
    PublicPricingBundleResponse,
    SignupFinalizeRequest,
    SignupFinalizeResponse,
    SignupInitiateRequest,
    SignupPlanSelectionRequest,
    SignupRegistrationRequest,
    SignupSessionResponse,
)
from app.services.commercial_orchestration_service import (
    complete_registration,
    create_signup_session,
    finalize_signup,
    seed_commercial_catalog,
    select_plan_and_addons,
)

router = APIRouter(prefix="/commercial", tags=["Commercial Orchestration"])

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def _db() -> Session:
    return SessionLocal()


def _session_response(row: SignupSession) -> SignupSessionResponse:
    return SignupSessionResponse(
        id=str(row.id),
        actor_type=row.actor_type.value,
        status=row.status.value,
        email=row.email,
        phone=row.phone,
        full_name=row.full_name,
        organization_name=row.organization_name,
        organization_slug=row.organization_slug,
        selected_plan_code=row.selected_plan_code,
        selected_currency=row.selected_currency,
        selected_payment_method=row.selected_payment_method,
        total_amount=float(row.total_amount),
        payment_reference=row.payment_reference,
        receipt_reference=row.receipt_reference,
        subscription_id=row.subscription_id,
        tenant_id=str(row.tenant_id) if row.tenant_id else None,
        last_error=row.last_error,
    )


@router.get("/catalog", response_model=PublicPricingBundleResponse)
def get_catalog():
    db = _db()
    try:
        seed_commercial_catalog(db)
        plans = db.query(CommercialPlan).filter(CommercialPlan.active == True).order_by(CommercialPlan.monthly_price.asc()).all()  # noqa: E712
        addons = db.query(CommercialAddOn).filter(CommercialAddOn.active == True).order_by(CommercialAddOn.monthly_price.asc()).all()  # noqa: E712
        methods = db.query(SharedPaymentMethod).filter(SharedPaymentMethod.enabled == True).order_by(SharedPaymentMethod.name.asc()).all()  # noqa: E712

        return PublicPricingBundleResponse(
            plans=[
                PublicPlanResponse(
                    code=x.code,
                    name=x.name,
                    description=x.description,
                    currency=x.currency,
                    monthly_price=float(x.monthly_price),
                    setup_price=float(x.setup_price),
                    default_free_credits=x.default_free_credits,
                    is_free_tier=x.is_free_tier,
                    tenant_runtime_included=x.tenant_runtime_included,
                    website_included=x.website_included,
                )
                for x in plans
            ],
            add_ons=[
                PublicAddOnResponse(
                    code=x.code.value,
                    name=x.name,
                    description=x.description,
                    currency=x.currency,
                    monthly_price=float(x.monthly_price),
                    setup_price=float(x.setup_price),
                    info_text=x.info_text,
                )
                for x in addons
            ],
            payment_methods=[
                PublicPaymentMethodResponse(
                    code=x.code.value,
                    name=x.name,
                    description=x.description,
                    inherited_by_default=x.inherited_by_default,
                    transaction_fee_percent=float(x.transaction_fee_percent),
                    fixed_fee=float(x.fixed_fee),
                )
                for x in methods
            ],
        )
    finally:
        db.close()


@router.post("/signup/initiate", response_model=SignupSessionResponse)
def initiate_signup(request: SignupInitiateRequest):
    db = _db()
    try:
        seed_commercial_catalog(db)
        row = create_signup_session(
            db,
            actor_type=request.actor_type,
            email=request.email,
            phone=request.phone,
            full_name=request.full_name,
        )
        return _session_response(row)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        db.close()


@router.post("/signup/select-plan", response_model=SignupSessionResponse)
def select_plan(request: SignupPlanSelectionRequest):
    db = _db()
    try:
        row = select_plan_and_addons(
            db,
            signup_session_id=request.signup_session_id,
            plan_code=request.plan_code,
            currency=request.currency,
            add_on_codes=request.add_on_codes,
            requested_payment_methods=request.requested_payment_methods,
        )
        return _session_response(row)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        db.close()


@router.post("/signup/register", response_model=SignupSessionResponse)
def complete_signup_registration(request: SignupRegistrationRequest):
    db = _db()
    try:
        row = complete_registration(
            db,
            signup_session_id=request.signup_session_id,
            organization_name=request.organization_name,
            organization_slug=request.organization_slug,
            country=request.country,
            full_name=request.full_name,
            phone=request.phone,
        )
        return _session_response(row)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        db.close()


@router.post("/signup/finalize", response_model=SignupFinalizeResponse)
def finalize_signup_route(request: SignupFinalizeRequest):
    db = _db()
    try:
        row = finalize_signup(
            db,
            signup_session_id=request.signup_session_id,
            payment_reference=request.payment_reference,
            mark_payment_successful=request.mark_payment_successful,
        )
        tenant_url = None
        if row.organization_slug and row.tenant_id:
            tenant_url = f"https://{row.organization_slug}.afruheritage.com"

        return SignupFinalizeResponse(
            signup_session=_session_response(row),
            next_action="deploy_runtime" if row.tenant_id else "activate_vendor_subscription",
            tenant_slug=row.organization_slug,
            tenant_url=tenant_url,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        db.close()


@router.get("/signup/{signup_session_id}", response_model=SignupSessionResponse)
def get_signup_session(signup_session_id: str):
    db = _db()
    try:
        row = db.query(SignupSession).filter(SignupSession.id == signup_session_id).first()
        if not row:
            raise HTTPException(status_code=404, detail="Signup session not found")
        return _session_response(row)
    finally:
        db.close()
PY

echo "==> Writing phase 1A docs"
cat > "$ROOT_DIR/docs/PHASE_1A_COMMERCIAL_ORCHESTRATION.md" <<'MD'
# Phase 1A Commercial Orchestration

## Goal
Turn subscription selection into the real tenant contract.

## What this module adds
- plan catalog
- add-on catalog
- shared payment-method inheritance catalog
- signup sessions
- registration flow
- payment confirmation marker
- automatic tenant-contract creation marker
- automatic runtime-request marker

## Core principle
Tenant creation is not a separate admin feature.
It is the result of:
- signup
- plan selection
- add-on selection
- registration completion
- payment confirmation or free-tier activation

## Routes
- `GET /api/v1/commercial/catalog`
- `POST /api/v1/commercial/signup/initiate`
- `POST /api/v1/commercial/signup/select-plan`
- `POST /api/v1/commercial/signup/register`
- `POST /api/v1/commercial/signup/finalize`
- `GET /api/v1/commercial/signup/{signup_session_id}`

## Important
This module does not yet auto-call the runtime deploy endpoint.
It creates the contract state and marks runtime request intent.
That next linkage should be completed in Phase 1B.

## Manual follow-up
- connect finalized signup to real auth user creation
- connect finalized signup to real billing payment verification
- connect tenant contract creation to real tenant model writes
- connect runtime requested state to fleetbase runtime deployment
- add frontend pages for signup, plan selection, add-ons, and fine print
MD

echo "==> Patching requirements.txt"
python3 - <<'PY'
from pathlib import Path

p = Path("requirements.txt")
text = p.read_text(encoding="utf-8")
required = ["email-validator"]
lines = text.splitlines()

for pkg in required:
    if not any(line.strip().lower() == pkg for line in lines):
        lines.append(pkg)

p.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
print("requirements.txt updated")
PY

echo "==> Patching app/main.py"
python3 - <<'PY'
from pathlib import Path

p = Path("app/main.py")
text = p.read_text(encoding="utf-8")

import_line = "from app.api.routes.commercial_orchestration import router as commercial_orchestration_router"
route_line = 'app.include_router(commercial_orchestration_router, prefix="/api/v1")'

if import_line not in text:
    text = import_line + "\n" + text

if route_line not in text:
    insertion_point = text.rfind("app.include_router(")
    if insertion_point != -1:
        line_end = text.find("\n", insertion_point)
        text = text[:line_end + 1] + route_line + "\n" + text[line_end + 1:]
    else:
        text += "\n" + route_line + "\n"

p.write_text(text, encoding="utf-8")
print("app/main.py updated")
PY

echo
echo "Phase 1A scaffold complete."
echo
echo "Backups saved under:"
echo "  $BACKUP_DIR"
echo
echo "Next steps:"
echo "  1) Rebuild containers:"
echo "       sudo docker compose down"
echo "       sudo docker compose up -d --build"
echo
echo "  2) Test catalog:"
echo "       curl http://localhost:8000/api/v1/commercial/catalog"
echo
echo "  3) Test signup initiate:"
echo "       curl -X POST http://localhost:8000/api/v1/commercial/signup/initiate \\"
echo "         -H 'Content-Type: application/json' \\"
echo "         -d '{\"actor_type\":\"tenant_org\",\"email\":\"ops@example.com\",\"phone\":\"+233000000000\",\"full_name\":\"Ops Lead\"}'"
echo
echo "  4) Then use returned signup_session_id with:"
echo "       /api/v1/commercial/signup/select-plan"
echo "       /api/v1/commercial/signup/register"
echo "       /api/v1/commercial/signup/finalize"
echo
echo "Reality check:"
echo "  - This creates real commercial flow state."
echo "  - It does not yet create auth users or call runtime deployment automatically."
echo "  - That linkage belongs in the next hardening step."
