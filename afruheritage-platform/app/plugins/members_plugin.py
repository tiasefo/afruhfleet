from __future__ import annotations

from app.plugins import BasePlugin
from app.services.tenant_branding_service import ensure_tenant_branding

from sqlalchemy.orm import Session


class MembersPlugin(BasePlugin):
    name = "members"
    feature_name = "Group Members"
    required_endpoints = ["GET /api/v1/shipments/{tenant_id}/members"]
    feature_flags = ["group_members_enabled"]

    def check(self, tenant_id: str, db: Session) -> bool:
        branding = ensure_tenant_branding(db, tenant_id, "", "")
        return getattr(branding, "group_members_enabled", False)

    def auto_fix(self, tenant_id: str, db: Session) -> tuple[bool, str]:
        branding = ensure_tenant_branding(db, tenant_id, "", "")
        if not getattr(branding, "group_members_enabled", False):
            branding.group_members_enabled = True
            db.add(branding)
            db.commit()
            return True, "Enabled group_members_enabled on TenantBranding"
        return True, "Already enabled"

    def get_health(self, tenant_id: str, db: Session) -> dict:
        healthy = self.check(tenant_id, db)
        return {
            "plugin": self.name,
            "healthy": healthy,
            "endpoints": self.required_endpoints,
            "details": "Members endpoints are route-mounted" if healthy else "group_members_enabled is False",
            "auto_fixed": False,
        }


PLUGIN = MembersPlugin()
