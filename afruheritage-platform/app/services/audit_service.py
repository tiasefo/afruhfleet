from app.core.config import settings
import json

from sqlalchemy.orm import Session

from app.core.structured_logging import audit_logger
from app.models.audit import AuditEvent
from app.models.user import User


def record_audit_event(db: Session, actor: User, event_type: str, entity_type: str, entity_id: str, details: dict) -> None:
    # Use structured logger for immediate logging
    audit_logger.log_event(
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        actor_email=actor.email,
        details=details,
        tenant_id=getattr(actor, 'tenant_id', None),
    )
    
    # Also store in database (existing behavior)
    event = AuditEvent(
        actor_email=actor.email,
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        details_json=json.dumps(details, default=str),
    )
    db.add(event)
    db.commit()
