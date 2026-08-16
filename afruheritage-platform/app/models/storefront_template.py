from __future__ import annotations

import uuid
from datetime import datetime

import json
from typing import Any

from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class StorefrontTemplate(Base):
    __tablename__ = "storefront_templates"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    template_code: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    preset: Mapped[str] = mapped_column(Text, nullable=False, default="{}")  # JSON string of color/layout preset
    image: Mapped[str | None] = mapped_column(String(255), nullable=True)  # Hero image path
    is_active: Mapped[bool] = mapped_column(default=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="production_ready")
    version: Mapped[str] = mapped_column(String(20), nullable=False, default="1.0.0")
    renderer_key: Mapped[str | None] = mapped_column(String(80), nullable=True)
    minimum_platform_version: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    required_capabilities = relationship(
        "Capability",
        secondary="template_capabilities",
        primaryjoin="and_(StorefrontTemplate.id == template_capabilities.c.template_id, template_capabilities.c.relationship == 'required')",
        secondaryjoin="Capability.id == template_capabilities.c.capability_id",
        viewonly=True,
    )
    optional_capabilities = relationship(
        "Capability",
        secondary="template_capabilities",
        primaryjoin="and_(StorefrontTemplate.id == template_capabilities.c.template_id, template_capabilities.c.relationship == 'optional')",
        secondaryjoin="Capability.id == template_capabilities.c.capability_id",
        viewonly=True,
    )

    @property
    def _preset_dict(self) -> dict[str, Any]:
        try:
            return json.loads(self.preset) if isinstance(self.preset, str) and self.preset else {}
        except (json.JSONDecodeError, TypeError):
            return {}

    @property
    def business_type(self) -> str | None:
        return self._preset_dict.get("business_type")

    @property
    def configuration_schema(self) -> dict[str, Any]:
        return self._preset_dict.get("configuration_schema") or {}

    @property
    def default_configuration(self) -> dict[str, Any]:
        return self._preset_dict.get("default_configuration") or {}

    @property
    def compatible_plugins(self) -> list[str]:
        return self._preset_dict.get("compatible_plugins") or []

    @property
    def incompatible_plugins(self) -> list[str]:
        return self._preset_dict.get("incompatible_plugins") or []

    @property
    def preview_route(self) -> str | None:
        return self._preset_dict.get("preview_route") or (f"/preview/{self.template_code}" if self.template_code else None)

    @property
    def preview_image(self) -> str | None:
        return self.image or self._preset_dict.get("preview_image")

    @property
    def required_endpoints(self) -> list[str]:
        return self._preset_dict.get("required_endpoints") or []

    @property
    def features(self) -> list[str]:
        return self._preset_dict.get("features") or []

