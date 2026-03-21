from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class TenantBranding(Base):
    __tablename__ = "tenant_branding"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, unique=True, index=True)

    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    tagline: Mapped[str | None] = mapped_column(String(500), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    favicon_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    primary_color: Mapped[str] = mapped_column(String(20), nullable=False, default="#0ea5e9")
    secondary_color: Mapped[str] = mapped_column(String(20), nullable=False, default="#1e293b")
    accent_color: Mapped[str] = mapped_column(String(20), nullable=False, default="#f59e0b")
    background_color: Mapped[str] = mapped_column(String(20), nullable=False, default="#ffffff")

    legal_company_name: Mapped[str | None] = mapped_column(String(500), nullable=True)
    legal_footer_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    terms_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    privacy_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    support_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    support_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    support_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    notification_from_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notification_from_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email_signature_html: Mapped[str | None] = mapped_column(Text, nullable=True)

    default_language: Mapped[str] = mapped_column(String(10), nullable=False, default="en")
    supported_languages: Mapped[str] = mapped_column(String(100), nullable=False, default="en,zh")

    maps_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    public_tracking_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    csv_import_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    group_members_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    max_group_members: Mapped[int] = mapped_column(nullable=False, default=5000)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
