from __future__ import annotations

import json
from typing import Any

from sqlalchemy.orm import Session

from admin_app.models.audit_log import AdminAuditLog


def record_admin_audit(
    db: Session,
    *,
    admin_email: str,
    action: str,
    entity_type: str,
    entity_id: str | None = None,
    details: dict[str, Any] | None = None,
    ip_address: str | None = None,
) -> AdminAuditLog:
    log = AdminAuditLog(
        admin_email=admin_email,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details_json=json.dumps(details) if details else None,
        ip_address=ip_address,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
