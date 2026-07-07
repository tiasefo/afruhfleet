from __future__ import annotations

from app.plugins import BasePlugin
from app.services.tenant_branding_service import ensure_tenant_branding

from sqlalchemy.orm import Session


class VendorMarketplacePlugin(BasePlugin):
    name = "vendor_marketplace"
    feature_name = "Vendor Marketplace"
    required_endpoints = ["GET /api/v1/vendors/marketplace"]
    feature_flags = []

    def check(self, tenant_id: str, db: Session) -> bool:
        return True

    def auto_fix(self, tenant_id: str, db: Session) -> tuple[bool, str]:
        return True, "Vendor marketplace endpoints are always available"

    def get_health(self, tenant_id: str, db: Session) -> dict:
        return {
            "plugin": self.name,
            "healthy": True,
            "endpoints": self.required_endpoints,
            "details": "Vendor marketplace is route-mounted",
            "auto_fixed": False,
        }


PLUGIN = VendorMarketplacePlugin()
