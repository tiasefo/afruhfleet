from __future__ import annotations

from app.db.session import SessionLocal
from app.services.billing_service import evaluate_subscription_state


def is_tenant_read_only(tenant_id: str) -> tuple[bool, str | None]:
    db = SessionLocal()
    try:
        sub = evaluate_subscription_state(db, tenant_id)
        if not sub:
            return False, None
        if sub.status.value == "read_only":
            return True, sub.read_only_reason
        return False, None
    finally:
        db.close()
