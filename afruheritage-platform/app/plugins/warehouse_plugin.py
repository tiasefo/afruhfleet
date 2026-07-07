from __future__ import annotations

from app.plugins import BasePlugin

from sqlalchemy.orm import Session


class WarehousePlugin(BasePlugin):
    name = "warehouse_notices"
    feature_name = "Warehouse Notices"
    required_endpoints = []
    feature_flags = []

    def check(self, tenant_id: str, db: Session) -> bool:
        return True

    def auto_fix(self, tenant_id: str, db: Session) -> tuple[bool, str]:
        return True, "Warehouse notices are part of the shipment system"

    def get_health(self, tenant_id: str, db: Session) -> dict:
        return {
            "plugin": self.name,
            "healthy": True,
            "endpoints": self.required_endpoints,
            "details": "Warehouse notices are always available via shipment events",
            "auto_fixed": False,
        }


PLUGIN = WarehousePlugin()
