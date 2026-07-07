from __future__ import annotations

from app.plugins import BasePlugin

from sqlalchemy.orm import Session


class StorageFeesPlugin(BasePlugin):
    name = "storage_fees"
    feature_name = "Storage Fee Calculation"
    required_endpoints = []
    feature_flags = []

    def check(self, tenant_id: str, db: Session) -> bool:
        from sqlalchemy import text
        result = db.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'shipments' AND column_name = 'storage_fee'"
        ))
        return result.fetchone() is not None

    def auto_fix(self, tenant_id: str, db: Session) -> tuple[bool, str]:
        if self.check(tenant_id, db):
            return True, "Storage fee columns already exist"
        from sqlalchemy import text
        for stmt in [
            "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS loading_date TIMESTAMP",
            "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS storage_days INTEGER",
            "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS storage_rate NUMERIC(10, 2)",
            "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS storage_fee NUMERIC(12, 2)",
        ]:
            db.execute(text(stmt))
        db.commit()
        return True, "Added storage fee columns to shipments table"

    def get_health(self, tenant_id: str, db: Session) -> dict:
        healthy = self.check(tenant_id, db)
        return {
            "plugin": self.name,
            "healthy": healthy,
            "endpoints": self.required_endpoints,
            "details": "Storage fee columns exist on shipments table" if healthy else "Storage fee columns missing",
            "auto_fixed": False,
        }


PLUGIN = StorageFeesPlugin()
