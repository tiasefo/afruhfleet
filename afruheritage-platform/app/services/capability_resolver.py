from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.capability import Capability, plugin_capabilities
from app.models.plugin import Plugin
from app.models.tenant import Tenant
from app.models.tenant_branding import TenantBranding
from app.models.tenant_plugin_installation import TenantPluginInstallation
from app.services.tenant_branding_service import ensure_tenant_branding

# Mapping from well-known capability codes to the TenantBranding feature flag
# that satisfies the capability without an installed plugin.  Unknown codes
# are still supportable; they must be provided by an installed plugin.
PLATFORM_CAPABILITY_FLAGS = {
    "tracking": "tracking_enabled",
    "public_tracking": "public_tracking_enabled",
    "bulk_import": "csv_import_enabled",
    "csv_import": "csv_import_enabled",
    "members": "group_members_enabled",
    "group_members": "group_members_enabled",
    "maps": "maps_enabled",
    "ai_chat": "fleetbase_integration_enabled",
    "storage_fees": "storage_fees_enabled",
    "bus_fleet": "bus_fleet_enabled",
    "shipping_estimator": "shipping_estimator_enabled",
    "warehouse_notices": "warehouse_notices_enabled",
    "customs_calculator": "customs_calculator_enabled",
}

# Renderer keys that are considered production-grade and known to the platform.
KNOWN_RENDERER_KEYS = {
    "freight",
    "fleet",
    "ecommerce",
    "mall",
    "bookings",
    "restaurant",
    "realestate",
}


class MarketplaceCapabilityResolver:
    """Resolve which capabilities a tenant currently has available.

    Capabilities can be satisfied either by a built-in platform feature flag
    (e.g. ``tracking_enabled``) or by an installed and enabled plugin that
    declares the capability.  This keeps templates/plugins decoupled from
    specific tenants and from each other.
    """

    def __init__(self, db: Session, tenant_id: str | uuid.UUID):
        self.db = db
        self.tenant_id = uuid.UUID(str(tenant_id)) if isinstance(tenant_id, str) else tenant_id
        self._tenant: Tenant | None = None
        self._branding: TenantBranding | None = None
        self._provided: set[str] | None = None
        self._plugin_codes: set[str] | None = None

    def _load_tenant(self) -> Tenant:
        if self._tenant is None:
            self._tenant = self.db.get(Tenant, self.tenant_id)
            if not self._tenant:
                raise ValueError("Tenant not found")
        return self._tenant

    def _load_branding(self) -> TenantBranding:
        if self._branding is None:
            tenant = self._load_tenant()
            self._branding = ensure_tenant_branding(
                self.db, str(self.tenant_id), tenant.company_name, tenant.contact_email
            )
        return self._branding

    def _provided_capabilities(self) -> set[str]:
        if self._provided is not None:
            return self._provided

        branding = self._load_branding()
        provided = {
            code
            for code, flag in PLATFORM_CAPABILITY_FLAGS.items()
            if getattr(branding, flag, False)
        }

        # Capabilities provided by enabled plugins for this tenant
        enabled = self.db.scalars(
            select(TenantPluginInstallation.plugin_code).where(
                TenantPluginInstallation.tenant_id == self.tenant_id,
                TenantPluginInstallation.status == "enabled",
            )
        ).all()
        self._plugin_codes = set(enabled)

        if self._plugin_codes:
            rows = self.db.execute(
                select(Plugin.plugin_code, Capability.code)
                .join(plugin_capabilities, Plugin.id == plugin_capabilities.c.plugin_id)
                .join(Capability, Capability.id == plugin_capabilities.c.capability_id)
                .where(Plugin.plugin_code.in_(self._plugin_codes))
            ).all()
            for _plugin_code, capability_code in rows:
                provided.add(capability_code)

        self._provided = provided
        return provided

    def is_satisfied(self, capability_code: str) -> bool:
        return capability_code in self._provided_capabilities()

    def installed_plugin_codes(self) -> set[str]:
        if self._plugin_codes is None:
            self._provided_capabilities()
        assert self._plugin_codes is not None
        return self._plugin_codes

    def plugins_providing(self, capability_code: str) -> list[str]:
        rows = self.db.execute(
            select(Plugin.plugin_code)
            .join(plugin_capabilities, Plugin.id == plugin_capabilities.c.plugin_id)
            .join(Capability, Capability.id == plugin_capabilities.c.capability_id)
            .where(Capability.code == capability_code)
        ).all()
        return [r[0] for r in rows]

    def validate_template(self, template) -> dict[str, Any]:
        from app.models.storefront_template import StorefrontTemplate

        if not isinstance(template, StorefrontTemplate):
            raise TypeError("validate_template expects a StorefrontTemplate instance")

        required = {c.code for c in template.required_capabilities}
        optional = {c.code for c in template.optional_capabilities}
        optional.update(template.features or [])
        provided = self._provided_capabilities()
        installed = self.installed_plugin_codes()

        missing_required = sorted(required - provided)
        missing_optional = sorted(optional - provided)
        incompatible = []
        missing_required_plugins = []

        for plugin_code in template.incompatible_plugins or []:
            if plugin_code in installed:
                incompatible.append(plugin_code)

        for plugin_code in getattr(template, "required_plugins", []) or []:
            if plugin_code not in installed:
                missing_required_plugins.append(plugin_code)

        warnings = []
        if missing_optional:
            warnings.append(f"Optional capabilities not satisfied: {', '.join(missing_optional)}")

        return {
            "valid": not missing_required and not incompatible and not missing_required_plugins,
            "missing_required": missing_required,
            "missing_optional": missing_optional,
            "incompatible_plugins": incompatible,
            "missing_required_plugins": missing_required_plugins,
            "warnings": warnings,
        }

    def validate_plugin_for_tenant(self, plugin: Plugin) -> dict[str, Any]:
        installed = self.installed_plugin_codes()
        missing_deps = [code for code in plugin.dependencies if code not in installed]
        conflicts = [code for code in plugin.conflicts if code in installed]
        return {
            "valid": not missing_deps and not conflicts,
            "missing_dependencies": missing_deps,
            "conflicts": conflicts,
        }


class MarketplaceCompatibilityValidator:
    """Validate that a template (or plugin) is compatible with the tenant
    runtime before any state mutation occurs."""

    def __init__(self, db: Session, tenant_id: str | uuid.UUID, platform_version: str | None = None):
        self.db = db
        self.tenant_id = tenant_id
        self.platform_version = platform_version
        self.capability_resolver = MarketplaceCapabilityResolver(db, tenant_id)

    @staticmethod
    def _renderer_key(template) -> str | None:
        # A missing renderer_key defaults to the template_code for validation,
        # but the explicit GenericStorefront placeholder is always rejected.
        renderer = template.renderer_key or template.template_code
        if renderer and renderer.lower() == "genericstorefront":
            return None
        return renderer

    def validate_template(self, template) -> dict[str, Any]:
        errors = []

        if template.status != "production_ready":
            errors.append(f"Template status is '{template.status}', expected 'production_ready'")

        renderer = self._renderer_key(template)
        if not renderer:
            errors.append("Template uses the unsupported GenericStorefront renderer")
        elif renderer not in KNOWN_RENDERER_KEYS:
            errors.append(f"Unknown renderer_key: {renderer}")

        if self.platform_version and template.minimum_platform_version:
            if self.platform_version < template.minimum_platform_version:
                errors.append(
                    f"Platform version {self.platform_version} is below required {template.minimum_platform_version}"
                )

        capability_result = self.capability_resolver.validate_template(template)
        if not capability_result["valid"]:
            if capability_result["missing_required"]:
                errors.append(
                    f"Missing required capabilities: {', '.join(capability_result['missing_required'])}"
                )
            if capability_result["incompatible_plugins"]:
                errors.append(
                    f"Incompatible installed plugins: {', '.join(capability_result['incompatible_plugins'])}"
                )
            if capability_result["missing_required_plugins"]:
                errors.append(
                    f"Missing required plugins: {', '.join(capability_result['missing_required_plugins'])}"
                )

        warnings = capability_result.get("warnings", [])

        return {
            "valid": not errors,
            "errors": errors,
            "warnings": warnings,
            "renderer_key": renderer,
            "capability_result": capability_result,
        }


def seed_core_capabilities(db) -> None:
    """Insert the well-known platform capabilities if they do not already exist."""
    core = {
        "tracking": "Shipment tracking",
        "public_tracking": "Public shipment tracking",
        "bulk_import": "Bulk CSV import",
        "csv_import": "CSV import",
        "members": "Group members",
        "group_members": "Group members",
        "maps": "Maps",
        "ai_chat": "AI chat widget",
        "storage_fees": "Storage fees",
        "bus_fleet": "Bus fleet",
        "shipping_estimator": "Shipping estimator",
        "warehouse_notices": "Warehouse notices",
        "customs_calculator": "Customs calculator",
        "vendor_marketplace": "Vendor marketplace",
    }
    existing = {c for (c,) in db.execute(select(Capability.code)).all()}
    for code, name in core.items():
        if code not in existing:
            db.add(Capability(code=code, name=name))
    db.commit()

