from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Plugin(Base):
    __tablename__ = "plugins"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    plugin_code: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    version: Mapped[str] = mapped_column(String(20), nullable=False, default="1.0.0")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(80), nullable=True)
    manifest: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    capabilities = relationship(
        "Capability",
        secondary="plugin_capabilities",
        viewonly=True,
    )

    @property
    def _manifest(self) -> dict[str, Any]:
        return self.manifest or {}

    @property
    def platform_version(self) -> str | None:
        return self._manifest.get("platform_version")

    @property
    def permissions(self) -> list[str]:
        return self._manifest.get("permissions") or []

    @property
    def required_endpoints(self) -> list[str]:
        return self._manifest.get("required_endpoints") or []

    @property
    def dependencies(self) -> list[str]:
        return self._manifest.get("dependencies") or []

    @property
    def conflicts(self) -> list[str]:
        return self._manifest.get("conflicts") or []

    @property
    def feature_flags(self) -> list[str]:
        return self._manifest.get("feature_flags") or []

    @property
    def configuration_schema(self) -> dict[str, Any]:
        return self._manifest.get("configuration_schema") or {}

    @property
    def data_migrations(self) -> list[dict[str, Any]]:
        return self._manifest.get("data_migrations") or []

    @property
    def supports_enable(self) -> bool:
        return self._manifest.get("supports_enable", True)

    @property
    def supports_disable(self) -> bool:
        return self._manifest.get("supports_disable", True)

    @property
    def supports_uninstall(self) -> bool:
        return self._manifest.get("supports_uninstall", True)
