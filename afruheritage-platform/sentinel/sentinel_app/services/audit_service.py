from __future__ import annotations

import json
import logging
from typing import Any, Callable, TypeVar

from sqlalchemy.orm import Session

from sentinel_app.models.audit_log import AdminAuditLog

logger = logging.getLogger(__name__)

T = TypeVar("T")


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


def _safe_record(db: Session, **kwargs: Any) -> None:
    """Write an audit row without ever breaking the admin operation."""
    try:
        record_admin_audit(db, **kwargs)
    except Exception:
        logger.exception("Failed to write admin audit log for %s", kwargs.get("action"))


def audited_admin_mutation(
    db: Session,
    *,
    admin_email: str,
    action: str,
    entity_type: str,
    entity_id: str | None = None,
    details: dict[str, Any] | None = None,
    operation: Callable[[], T],
) -> T:
    """Run a sensitive admin mutation and record its outcome.

    Both successful and failed mutations produce an audit row. If the wrapped
    operation raises, the row records outcome=error and the exception is
    re-raised so the route's normal error handling still applies.
    """
    try:
        result = operation()
    except Exception as exc:
        _safe_record(
            db,
            admin_email=admin_email,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details={**(details or {}), "outcome": "error", "error": str(exc)[:500]},
        )
        raise
    _safe_record(
        db,
        admin_email=admin_email,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details={**(details or {}), "outcome": "success"},
    )
    return result
