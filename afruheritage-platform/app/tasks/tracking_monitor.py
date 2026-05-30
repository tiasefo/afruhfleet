from __future__ import annotations

from datetime import datetime, timedelta

from app.core.config import settings
from app.core.structured_logging import get_logger
from app.db.session import SessionLocal
from app.models.shipment import Shipment, ShipmentStatus
from app.services.shipment_service import add_shipment_event
from app.tasks.celery_app import celery_app

logger = get_logger("afruheritage.tracking_monitor")


@celery_app.task(name="app.tasks.tracking_monitor.mark_stale_tracking")
def mark_stale_tracking() -> dict[str, int]:
    cutoff = datetime.utcnow() - timedelta(minutes=settings.tracking_stale_timeout_minutes)
    in_transit_statuses = [
        ShipmentStatus.PICKED_UP,
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.AT_CUSTOMS,
        ShipmentStatus.CUSTOMS_CLEARED,
        ShipmentStatus.OUT_FOR_DELIVERY,
    ]

    db = SessionLocal()
    stale_shipments: list[Shipment] = []
    flagged = 0
    try:
        stale_shipments = (
            db.query(Shipment)
            .filter(
                Shipment.status.in_(in_transit_statuses),
                Shipment.last_location_at.isnot(None),
                Shipment.last_location_at < cutoff,
                Shipment.live_tracking_provider != "tracking_stale",
            )
            .all()
        )

        for shipment in stale_shipments:
            shipment.live_tracking_provider = "tracking_stale"
            db.add(shipment)
            db.commit()
            db.refresh(shipment)

            add_shipment_event(
                db,
                str(shipment.id),
                event_type="tracking_stale",
                location=shipment.current_location,
                latitude=float(shipment.current_latitude) if shipment.current_latitude is not None else None,
                longitude=float(shipment.current_longitude) if shipment.current_longitude is not None else None,
                description="Tracking has gone stale and requires driver refresh",
                occurred_at=datetime.utcnow(),
            )
            flagged += 1

        return {"checked": len(stale_shipments), "flagged": flagged}
    finally:
        db.close()
        logger.info("tracking_stale_scan_complete", checked=len(stale_shipments), flagged=flagged)
