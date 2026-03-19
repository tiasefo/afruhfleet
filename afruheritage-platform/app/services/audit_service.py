import json

from sqlalchemy.orm import Session

from app.models.audit import AuditEvent
from app.models.user import User


def record_audit_event(db: Session, actor: User, event_type: str, entity_type: str, entity_id: str, details: dict) -> None:
    event = AuditEvent(
        actor_email=actor.email,
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        details_json=json.dumps(details, default=str),
    )
    db.add(event)
    db.commit()
