from __future__ import annotations

from app.plugins import BasePlugin
from app.services.tenant_branding_service import ensure_tenant_branding

from sqlalchemy.orm import Session


class AIChatPlugin(BasePlugin):
    name = "ai_chat"
    feature_name = "AI Chat Widget"
    required_endpoints = ["GET /api/v1/ai/chat"]
    feature_flags = []

    def check(self, tenant_id: str, db: Session) -> bool:
        return True

    def auto_fix(self, tenant_id: str, db: Session) -> tuple[bool, str]:
        return True, "AI chat endpoint is always available"

    def get_health(self, tenant_id: str, db: Session) -> dict:
        return {
            "plugin": self.name,
            "healthy": True,
            "endpoints": self.required_endpoints,
            "details": "AI chat endpoint is route-mounted and always available",
            "auto_fixed": False,
        }


PLUGIN = AIChatPlugin()
