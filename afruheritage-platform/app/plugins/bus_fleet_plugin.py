from __future__ import annotations

from app.plugins import BasePlugin
from app.services.tenant_branding_service import ensure_tenant_branding

from sqlalchemy.orm import Session


class BusFleetPlugin(BasePlugin):
    """Bus fleet management plugin for fleet template customers (e.g., bus fleet operators)."""
    name = "bus_fleet"
    feature_name = "Bus Fleet Management"
    required_endpoints = []
    feature_flags = ["bus_fleet_enabled"]

    def check(self, tenant_id: str, db: Session) -> bool:
        branding = ensure_tenant_branding(db, tenant_id, "", "")
        return getattr(branding, "bus_fleet_enabled", False)

    def auto_fix(self, tenant_id: str, db: Session) -> tuple[bool, str]:
        branding = ensure_tenant_branding(db, tenant_id, "", "")
        if not getattr(branding, "bus_fleet_enabled", False):
            branding.bus_fleet_enabled = True
            db.add(branding)
            db.commit()
            return True, "Enabled bus_fleet_enabled on TenantBranding"
        return True, "Already enabled"

    def get_health(self, tenant_id: str, db: Session) -> dict:
        healthy = self.check(tenant_id, db)
        return {
            "plugin": self.name,
            "healthy": healthy,
            "endpoints": self.required_endpoints,
            "details": "Bus fleet feature flag enabled" if healthy else "bus_fleet_enabled is False",
            "auto_fixed": False,
        }


PLUGIN = BusFleetPlugin()
