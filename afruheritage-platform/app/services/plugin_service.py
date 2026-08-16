from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.plugin import Plugin
from app.models.tenant import Tenant
from app.models.tenant_plugin_installation import TenantPluginInstallation
from app.models.user import User
from app.services.capability_resolver import MarketplaceCapabilityResolver
from app.services.tenant_branding_service import ensure_tenant_branding


class PluginService:
    """Tenant plugin installation lifecycle.

    Moves a plugin through the allowed states and records every transition
    in ``tenant_plugin_installations``. Only active plugins can be installed.
    """

    def __init__(self, db: Session):
        self.db = db

    def _to_uuid(self, value: str | uuid.UUID) -> uuid.UUID:
        return uuid.UUID(value) if isinstance(value, str) else value

    def _require_plugin(self, plugin_code: str) -> Plugin:
        plugin = self.db.scalar(select(Plugin).where(Plugin.plugin_code == plugin_code))
        if not plugin:
            raise ValueError("Plugin not found")
        if not plugin.is_active:
            raise ValueError("Plugin is not active")
        return plugin

    def _require_tenant(self, tenant_id: str | uuid.UUID) -> Tenant:
        tenant = self.db.get(Tenant, self._to_uuid(tenant_id))
        if not tenant:
            raise ValueError("Tenant not found")
        return tenant

    def _load_branding(self, tenant_id: str | uuid.UUID):
        tenant = self._require_tenant(tenant_id)
        return ensure_tenant_branding(
            self.db, str(self._to_uuid(tenant_id)), tenant.company_name, tenant.contact_email
        )

    def _toggle_feature_flags(self, branding, plugin: Plugin, enabled: bool) -> None:
        for flag in plugin.feature_flags:
            if hasattr(branding, flag):
                setattr(branding, flag, enabled)
            else:
                # Unknown flags are ignored; they may be virtual capabilities
                # that do not map to a branding toggle.
                pass

    def get_installation(
        self,
        tenant_id: str | uuid.UUID,
        plugin_code: str,
    ) -> TenantPluginInstallation | None:
        tenant_uuid = self._to_uuid(tenant_id)
        return self.db.scalar(
            select(TenantPluginInstallation).where(
                TenantPluginInstallation.tenant_id == tenant_uuid,
                TenantPluginInstallation.plugin_code == plugin_code,
            )
        )

    def list_for_tenant(self, tenant_id: str | uuid.UUID) -> list[TenantPluginInstallation]:
        tenant_uuid = self._to_uuid(tenant_id)
        return list(
            self.db.scalars(
                select(TenantPluginInstallation).where(
                    TenantPluginInstallation.tenant_id == tenant_uuid
                )
            ).all()
        )

    def install(
        self,
        tenant_id: str | uuid.UUID,
        plugin_code: str,
        installed_by: str | uuid.UUID | None = None,
        configuration: dict | None = None,
    ) -> TenantPluginInstallation:
        plugin = self._require_plugin(plugin_code)
        self._require_tenant(tenant_id)

        existing = self.get_installation(tenant_id, plugin_code)

        resolver = MarketplaceCapabilityResolver(self.db, self._to_uuid(tenant_id))
        validation = resolver.validate_plugin_for_tenant(plugin)
        if not validation["valid"]:
            raise ValueError(
                f"Plugin cannot be installed: {validation}"
            )

        if existing and existing.status not in {"uninstalled", "failed"}:
            raise ValueError("Plugin already installed for this tenant")

        if existing:
            existing.plugin_version = plugin.version
            existing.status = "installed"
            existing.configuration = configuration
            existing.installed_by = self._to_uuid(installed_by) if installed_by else existing.installed_by
            existing.installed_at = datetime.now(timezone.utc)
            existing.enabled_at = None
            existing.disabled_at = None
            existing.uninstalled_at = None
            self.db.add(existing)
            self.db.commit()
            self.db.refresh(existing)
            return existing

        installation = TenantPluginInstallation(
            tenant_id=self._to_uuid(tenant_id),
            plugin_code=plugin_code,
            plugin_version=plugin.version,
            status="installed",
            configuration=configuration,
            installed_by=self._to_uuid(installed_by) if installed_by else None,
            installed_at=datetime.now(timezone.utc),
        )
        self.db.add(installation)
        self.db.commit()
        self.db.refresh(installation)
        return installation

    def enable(self, tenant_id: str | uuid.UUID, plugin_code: str) -> TenantPluginInstallation:
        plugin = self._require_plugin(plugin_code)
        if not plugin.supports_enable:
            raise ValueError("Plugin does not support enable")
        installation = self.get_installation(tenant_id, plugin_code)
        if not installation or installation.status in {"uninstalled", "failed"}:
            raise ValueError("Plugin is not installed")
        installation.status = "enabled"
        installation.enabled_at = datetime.now(timezone.utc)
        self.db.add(installation)

        branding = self._load_branding(tenant_id)
        self._toggle_feature_flags(branding, plugin, True)
        self.db.add(branding)

        self.db.commit()
        self.db.refresh(installation)
        return installation

    def disable(self, tenant_id: str | uuid.UUID, plugin_code: str) -> TenantPluginInstallation:
        plugin = self._require_plugin(plugin_code)
        if not plugin.supports_disable:
            raise ValueError("Plugin does not support disable")
        installation = self.get_installation(tenant_id, plugin_code)
        if not installation or installation.status not in {"installed", "enabled"}:
            raise ValueError("Plugin cannot be disabled from current state")
        installation.status = "disabled"
        installation.disabled_at = datetime.now(timezone.utc)
        self.db.add(installation)

        branding = self._load_branding(tenant_id)
        self._toggle_feature_flags(branding, plugin, False)
        self.db.add(branding)

        self.db.commit()
        self.db.refresh(installation)
        return installation

    def uninstall(self, tenant_id: str | uuid.UUID, plugin_code: str) -> TenantPluginInstallation:
        plugin = self._require_plugin(plugin_code)
        if not plugin.supports_uninstall:
            raise ValueError("Plugin does not support uninstall")
        installation = self.get_installation(tenant_id, plugin_code)
        if not installation:
            raise ValueError("Plugin is not installed")
        installation.status = "uninstalled"
        installation.uninstalled_at = datetime.now(timezone.utc)
        self.db.add(installation)

        branding = self._load_branding(tenant_id)
        self._toggle_feature_flags(branding, plugin, False)
        self.db.add(branding)

        self.db.commit()
        self.db.refresh(installation)
        return installation

    def list_for_tenant(self, tenant_id: str | uuid.UUID) -> list[TenantPluginInstallation]:
        tenant_uuid = self._to_uuid(tenant_id)
        return list(
            self.db.scalars(
                select(TenantPluginInstallation).where(
                    TenantPluginInstallation.tenant_id == tenant_uuid,
                )
            ).all()
        )

    def to_dict(self, installation: TenantPluginInstallation) -> dict[str, Any]:
        return {
            "id": str(installation.id),
            "tenant_id": str(installation.tenant_id),
            "plugin_code": installation.plugin_code,
            "plugin_version": installation.plugin_version,
            "status": installation.status,
            "configuration": installation.configuration,
            "installed_at": installation.installed_at.isoformat() if installation.installed_at else None,
            "enabled_at": installation.enabled_at.isoformat() if installation.enabled_at else None,
            "disabled_at": installation.disabled_at.isoformat() if installation.disabled_at else None,
            "uninstalled_at": installation.uninstalled_at.isoformat() if installation.uninstalled_at else None,
        }

