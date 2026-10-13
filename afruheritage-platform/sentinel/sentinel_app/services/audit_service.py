from __future__ import annotations

import json
import logging
from typing import Any, Callable, TypeVar

from fastapi import HTTPException
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
    commit: bool = True,
) -> AdminAuditLog:
    # Flush pending business objects first so server-generated PKs are
    # available for entity_id and the audit row joins the same transaction.
    db.flush()
    log = AdminAuditLog(
        admin_email=admin_email,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details_json=json.dumps(details) if details else None,
        ip_address=ip_address,
    )
    db.add(log)
    if commit:
        db.commit()
        db.refresh(log)
    else:
        # Caller commits: business change + audit row persist atomically.
        # If this insert fails, the shared transaction rolls back and the
        # sensitive mutation is rejected — same-DB fail-closed enforcement.
        db.flush()
    return log


def _safe_record(db: Session, **kwargs: Any) -> None:
    """Write an audit row without ever breaking the admin operation."""
    try:
        record_admin_audit(db, **kwargs)
    except Exception:
        logger.exception("Failed to write admin audit log for %s", kwargs.get("action"))


def audit_attempt_or_503(
    db: Session,
    *,
    admin_email: str,
    action: str,
    entity_type: str,
    entity_id: str | None = None,
    details: dict[str, Any] | None = None,
    ip_address: str | None = None,
) -> None:
    """Fail-closed audit gate for sensitive administrative mutations.

    Writes a durable `outcome=attempt` audit row BEFORE the mutation runs.
    If audit persistence fails, raises 503 — the sensitive mutation is
    rejected rather than proceeding without a durable audit trail
    (PO risk-tiered fail-closed policy). A second row recording the
    outcome is appended after the mutation; the table is append-only so
    the attempt row is a separate durable record, not an update.
    """
    try:
        record_admin_audit(
            db,
            admin_email=admin_email,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details={**(details or {}), "outcome": "attempt"},
            ip_address=ip_address,
        )
    except Exception as exc:
        logger.exception("Audit storage unavailable; rejecting sensitive mutation %s", action)
        raise HTTPException(
            status_code=503,
            detail="Audit storage unavailable — sensitive administrative mutation rejected",
        ) from exc


def audited_admin_mutation(
    db: Session,
    *,
    admin_email: str,
    action: str,
    entity_type: str,
    entity_id: str | None = None,
    details: dict[str, Any] | None = None,
    operation: Callable[[], T],
    fail_closed: bool = False,
) -> T:
    """Run a sensitive admin mutation and record its outcome.

    Both successful and failed mutations produce an audit row. If the wrapped
    operation raises, the row records outcome=error and the exception is
    re-raised so the route's normal error handling still applies.

    With ``fail_closed=True`` a durable attempt row is written first and the
    mutation is rejected (503) when audit persistence is unavailable —
    used for the PO-designated sensitive categories (vendor approval,
    tenant suspension, entitlements, payments, identity/role changes).
    """
    if fail_closed:
        audit_attempt_or_503(
            db,
            admin_email=admin_email,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
        )
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

def audited_proxy_mutation(
    db: Session,
    *,
    admin_email: str,
    action: str,
    entity_type: str,
    entity_id: str | None = None,
    details: dict[str, Any] | None = None,
    ip_address: str | None = None,
    operation: Callable[[], T],
    result_entity_id: Callable[[T], str | None] | None = None,
) -> T:
    """Fail-closed attempt + reconciled outcome for PROXIED mutations.

    PO Gate A-4: a durable `attempt` row alone is not an audit outcome.
    For mutations executed on another service over HTTP, an exception after
    the request was sent does not prove the mutation did not commit. The
    outcome row therefore records:

      success     — downstream returned success
      rejected    — downstream responded 4xx (mutation refused)
      unconfirmed — timeout, connection failure, 5xx, or any other error
                    after dispatch; the mutation MAY have committed and the
                    record must not claim failure or success

    Rows are append-only; each outcome is a separate durable row.
    """
    audit_attempt_or_503(
        db,
        admin_email=admin_email,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
        ip_address=ip_address,
    )
    try:
        result = operation()
    except Exception as exc:
        from sentinel_app.services.control_plane_client import ControlPlaneError
        if isinstance(exc, ControlPlaneError) and exc.status_code < 500:
            outcome = "rejected"
        elif isinstance(exc, HTTPException) and exc.status_code < 500:
            outcome = "rejected"
        else:
            outcome = "unconfirmed"
        _safe_record(
            db,
            admin_email=admin_email,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details={**(details or {}), "outcome": outcome, "error": str(exc)[:500]},
            ip_address=ip_address,
        )
        raise
    out_entity_id = entity_id
    if result_entity_id is not None:
        try:
            out_entity_id = result_entity_id(result)
        except Exception:
            pass
    _safe_record(
        db,
        admin_email=admin_email,
        action=action,
        entity_type=entity_type,
        entity_id=out_entity_id,
        details={**(details or {}), "outcome": "success"},
        ip_address=ip_address,
    )
    return result
