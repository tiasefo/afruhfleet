from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.capability import Capability, plugin_capabilities
from app.models.plugin import Plugin


class PluginRegistry:
    """Catalog of platform plugins and their declared capabilities.

    Each plugin stores a backend-controlled manifest that declares version,
    permissions, endpoints, dependencies, conflicts, feature flags, and the
    capabilities it provides. The browser cannot submit plugin definitions.
    """

    def __init__(self, db: Session):
        self.db = db

    def list(self, active_only: bool = False) -> list[Plugin]:
        stmt = select(Plugin).order_by(Plugin.plugin_code)
        if active_only:
            stmt = stmt.where(Plugin.is_active.is_(True))
        return list(self.db.scalars(stmt).all())

    def get_by_code(self, plugin_code: str) -> Plugin | None:
        return self.db.scalar(select(Plugin).where(Plugin.plugin_code == plugin_code))

    def register(
        self,
        plugin_code: str,
        name: str,
        version: str = "1.0.0",
        description: str | None = None,
        category: str | None = None,
        manifest: dict | None = None,
    ) -> Plugin:
        existing = self.get_by_code(plugin_code)
        if existing:
            return existing
        plugin = Plugin(
            plugin_code=plugin_code,
            name=name,
            version=version,
            description=description,
            category=category,
            manifest=manifest or {},
        )
        self.db.add(plugin)
        self.db.commit()
        self.db.refresh(plugin)
        return plugin

    def add_capability(self, plugin_code: str, capability_code: str) -> bool:
        plugin = self.get_by_code(plugin_code)
        capability = self.db.scalar(
            select(Capability).where(Capability.code == capability_code)
        )
        if not plugin or not capability:
            return False
        self.db.execute(
            plugin_capabilities.insert().values(
                plugin_id=plugin.id,
                capability_id=capability.id,
            )
        )
        self.db.commit()
        return True

    def capabilities_provided(self, plugin_code: str) -> list[Capability]:
        plugin = self.get_by_code(plugin_code)
        if not plugin:
            return []
        stmt = (
            select(Capability)
            .join(plugin_capabilities, Capability.id == plugin_capabilities.c.capability_id)
            .where(plugin_capabilities.c.plugin_id == plugin.id)
        )
        return list(self.db.scalars(stmt).all())

    def sync_from_package(self) -> list[Plugin]:
        """Mirror app.plugins classes into persistent Plugin records.

        Plugin classes remain the source of truth; this just records their
        existence, endpoints, feature flags, and lifecycle support in the DB
        so the lifecycle service can operate on them.
        """
        from app.plugins import get_all_plugins

        synced = []
        for package_plugin in get_all_plugins():
            manifest = {
                "required_endpoints": getattr(package_plugin, "required_endpoints", []),
                "feature_flags": getattr(package_plugin, "feature_flags", []),
                "supports_enable": True,
                "supports_disable": True,
                "supports_uninstall": True,
            }
            existing = self.get_by_code(package_plugin.name)
            if existing:
                existing.name = getattr(package_plugin, "feature_name", None) or package_plugin.name
                existing.description = f"Auto-fix plugin for {getattr(package_plugin, 'feature_name', package_plugin.name)}"
                existing.manifest = manifest
                self.db.add(existing)
                self.db.commit()
                self.db.refresh(existing)
                plugin = existing
            else:
                plugin = self.register(
                    plugin_code=package_plugin.name,
                    name=getattr(package_plugin, "feature_name", None) or package_plugin.name,
                    description=f"Auto-fix plugin for {getattr(package_plugin, 'feature_name', package_plugin.name)}",
                    category="auto_fix",
                    manifest=manifest,
                )
            synced.append(plugin)
        return synced

    def to_dict(self, plugin: Plugin) -> dict[str, Any]:
        return {
            "id": str(plugin.id),
            "plugin_code": plugin.plugin_code,
            "name": plugin.name,
            "version": plugin.version,
            "description": plugin.description,
            "category": plugin.category,
            "manifest": plugin.manifest,
            "is_active": plugin.is_active,
            "created_at": plugin.created_at.isoformat() if plugin.created_at else None,
            "updated_at": plugin.updated_at.isoformat() if plugin.updated_at else None,
        }

