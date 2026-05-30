from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class CommercialSignup(Base):
    __tablename__ = "commercial_signups"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)

    account_type: Mapped[str] = mapped_column(String(50), default="tenant_org")

    selected_plan: Mapped[str | None] = mapped_column(String(100), nullable=True)

    selected_addons: Mapped[str | None] = mapped_column(Text, nullable=True)

    payment_method: Mapped[str | None] = mapped_column(String(100), nullable=True)

    payment_completed: Mapped[bool] = mapped_column(Boolean, default=False)

    subscription_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    tenant_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    runtime_provisioned: Mapped[bool] = mapped_column(Boolean, default=False)

    provisioning_status: Mapped[str] = mapped_column(String(100), default="pending")

    total_amount: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
