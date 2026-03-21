from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from enum import Enum as PyEnum

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class PlanCode(str, PyEnum):
    FREE_TRIAL = "free_trial"
    PROFESSIONAL = "professional"
    BUSINESS = "business"
    DELIVERY_SERVICES = "delivery_services"


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
    VENDOR_JOB_DEBIT = "vendor_job_debit"
    VENDOR_EARNING_CREDIT = "vendor_earning_credit"
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
