from __future__ import annotations
import uuid
from datetime import datetime
from sqlalchemy import DateTime, Float, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base

class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[str] = mapped_column(String(255), index=True)
    purpose: Mapped[str] = mapped_column(String(100))  # subscription|credit_topup|shipment|wallet_load
    provider: Mapped[str] = mapped_column(String(100), default="paystack")
    amount: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(20), default="GHS")
    status: Mapped[str] = mapped_column(String(50), default="initialized")
    reference: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    provider_reference: Mapped[str | None] = mapped_column(String(255), nullable=True)
    checkout_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    plan_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    addons_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_response_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
