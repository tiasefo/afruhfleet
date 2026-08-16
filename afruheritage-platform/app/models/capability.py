from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, Table, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


template_capabilities = Table(
    "template_capabilities",
    Base.metadata,
    Column(
        "template_id",
        ForeignKey("storefront_templates.id"),
        primary_key=True,
    ),
    Column(
        "capability_id",
        ForeignKey("capabilities.id"),
        primary_key=True,
    ),
    Column(
        "relationship",
        String(20),
        nullable=False,
        default="required",
    ),
)

plugin_capabilities = Table(
    "plugin_capabilities",
    Base.metadata,
    Column(
        "plugin_id",
        ForeignKey("plugins.id"),
        primary_key=True,
    ),
    Column(
        "capability_id",
        ForeignKey("capabilities.id"),
        primary_key=True,
    ),
)


class Capability(Base):
    __tablename__ = "capabilities"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(80), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
