from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class TenantAISettings(Base):
    __tablename__ = "tenant_ai_settings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id"), unique=True, nullable=False)

    widget_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    chat_model: Mapped[str] = mapped_column(String(255), default="afruheritage-copilot:latest", nullable=False)
    retrieval_scope: Mapped[str] = mapped_column(String(255), default="shared", nullable=False)

    welcome_message: Mapped[str] = mapped_column(
        Text,
        default="Welcome to Afruheritage Assistant. How can I help you today?",
        nullable=False,
    )
    theme: Mapped[str] = mapped_column(String(50), default="light", nullable=False)
    primary_color: Mapped[str] = mapped_column(String(20), default="#0ea5e9", nullable=False)
    allowed_hostnames: Mapped[str] = mapped_column(Text, default="", nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
