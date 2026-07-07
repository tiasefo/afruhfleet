from __future__ import annotations

from app.plugins import BasePlugin
from app.services.tenant_branding_service import ensure_tenant_branding

from sqlalchemy.orm import Session


class MapsPlugin(BasePlugin):
    name = "maps"
    feature_name = "Map & Fleet Visualization"
    required_endpoints = []
    feature_flags = ["maps_enabled"]

    def check(self, tenant_id: str, db: Session) -> bool:
        branding = ensure_tenant_branding(db, tenant_id, "", "")
        return getattr(branding, "maps_enabled", False)

    def auto_fix(self, tenant_id: str, db: Session) -> tuple[bool, str]:
        branding = ensure_tenant_branding(db, tenant_id, "", "")
        if not getattr(branding, "maps_enabled", False):
            branding.maps_enabled = True
            db.add(branding)
            db.commit()
            return True, "Enabled maps_enabled on TenantBranding"
        return True, "Already enabled"

    def get_health(self, tenant_id: str, db: Session) -> dict:
        healthy = self.check(tenant_id, db)
        return {
            "plugin": self.name,
            "healthy": healthy,
            "endpoints": self.required_endpoints,
            "details": "Maps feature flag enabled" if healthy else "maps_enabled is False",
            "auto_fixed": False,
        }


PLUGIN = MapsPlugin()
