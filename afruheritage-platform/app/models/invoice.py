from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from enum import Enum

from sqlalchemy import String, Text, DateTime, Numeric, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    OPEN = "open"
    PAID = "paid"
    VOID = "void"
    OVERDUE = "overdue"


class Invoice(Base):
    __tablename__ = "billing_invoices"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    invoice_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    customer_name: Mapped[str] = mapped_column(String(200), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="GHS", nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=InvoiceStatus.OPEN.value, nullable=False)
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    issued_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    paid_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Branding fields for tenant-specific invoice appearance
    invoice_logo_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    invoice_footer_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    invoice_from_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    invoice_from_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    invoice_from_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    invoice_from_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
