from __future__ import annotations

from app.core.structured_logging import get_logger
from app.db.session import SessionLocal
from app.services.vendor_service import reassign_expired_booking_offers
from app.tasks.celery_app import celery_app

logger = get_logger("afruheritage.booking_reassignment")


@celery_app.task(name="app.tasks.booking_reassignment.reassign_expired_offers")
def reassign_expired_offers() -> dict[str, int]:
    db = SessionLocal()
    try:
        result = reassign_expired_booking_offers(db)
        logger.info(
            "booking_reassignment_completed",
            checked=result["checked"],
            reassigned=result["reassigned"],
            no_candidate=result["no_candidate"],
        )
        return result
    finally:
        db.close()
