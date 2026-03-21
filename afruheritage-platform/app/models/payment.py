from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Numeric, String, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class PaymentMethod(str, enum.Enum):
    MOBILE_MONEY = "mobile_money"
    BANK_TRANSFER = "bank_transfer"
    CREDIT_CARD = "credit_card"
    VIRTUAL_CREDIT = "virtual_credit"
    ALIPAY = "alipay"
    WECHAT_PAY = "wechat_pay"


class PaymentRecord(Base):
    """Payment records for platform transactions"""
    __tablename__ = "payment_records"
    __table_args__ = (
        Index("ix_payments_tenant_reference", "tenant_id", "payment_reference", unique=True),
        Index("ix_payments_status_created", "status", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)

    # Payment details
    payment_reference: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    paystack_reference: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    platform_fee: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    tenant_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    paid_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    
    # Payment method and status
    payment_method: Mapped[PaymentMethod] = mapped_column(Enum(PaymentMethod), nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)
    
    # Customer information
    customer_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    customer_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    customer_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # URLs and references
    authorization_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    callback_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    failed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Additional information
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    additional_data: Mapped[dict] = mapped_column(JSON, nullable=True, default=lambda: {})
    
    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="payments")


class VirtualCredit(Base):
    """Virtual credit balances for users"""
    __tablename__ = "virtual_credits"
    __table_args__ = (
        Index("ix_credits_user_balance", "user_id", "balance"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    
    balance: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="GHS")
    
    # Credit history
    total_purchased: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    total_spent: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="virtual_credits")
    purchases: Mapped[list["CreditPurchase"]] = relationship("CreditPurchase", back_populates="credit_account")
    transactions: Mapped[list["CreditTransaction"]] = relationship("CreditTransaction", back_populates="credit_account")


class CreditPurchase(Base):
    """Records of virtual credit purchases"""
    __tablename__ = "credit_purchases"
    __table_args__ = (
        Index("ix_purchases_user_status", "user_id", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    credit_account_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("virtual_credits.id"), nullable=False)
    
    # Purchase details
    amount_paid: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    credits_received: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="GHS")
    
    # Payment information
    payment_method: Mapped[PaymentMethod] = mapped_column(Enum(PaymentMethod), nullable=False)
    payment_reference: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")  # pending, completed, failed
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    user: Mapped["User"] = relationship("User")
    credit_account: Mapped["VirtualCredit"] = relationship("VirtualCredit", back_populates="purchases")


class CreditTransaction(Base):
    """Virtual credit transactions (spending, transfers, etc.)"""
    __tablename__ = "credit_transactions"
    __table_args__ = (
        Index("ix_transactions_user_type", "user_id", "transaction_type"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    credit_account_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("virtual_credits.id"), nullable=False)
    
    # Transaction details
    transaction_type: Mapped[str] = mapped_column(String(50), nullable=False)  # spend, transfer, gift, refund
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    balance_before: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    balance_after: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    
    # Related entities
    related_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)  # For transfers
    related_entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)  # Related shipment, etc.
    related_entity_type: Mapped[str | None] = mapped_column(String(50), nullable=True)  # shipment, ride, etc.
    
    # Description and metadata
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    extra_data: Mapped[dict] = mapped_column(JSON, nullable=True, default=lambda: {})
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user: Mapped["User"] = relationship("User")
    credit_account: Mapped["VirtualCredit"] = relationship("VirtualCredit", back_populates="transactions")
    related_user: Mapped["User | None"] = relationship("User", foreign_keys=[related_user_id])
