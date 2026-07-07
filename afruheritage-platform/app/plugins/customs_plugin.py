from __future__ import annotations

from app.plugins import BasePlugin

from sqlalchemy.orm import Session


class CustomsPlugin(BasePlugin):
    name = "customs_calculator"
    feature_name = "Customs & Duty Calculator"
    required_endpoints = []
    feature_flags = []

    def check(self, tenant_id: str, db: Session) -> bool:
        return True

    def auto_fix(self, tenant_id: str, db: Session) -> tuple[bool, str]:
        return True, "Customs calculator is always available"

    def get_health(self, tenant_id: str, db: Session) -> dict:
        return {
            "plugin": self.name,
            "healthy": True,
            "endpoints": self.required_endpoints,
            "details": "Customs calculator is a frontend feature, always available",
            "auto_fixed": False,
        }


PLUGIN = CustomsPlugin()
