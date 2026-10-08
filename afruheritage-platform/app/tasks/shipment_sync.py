"""Async shipment → tenant-runtime (Fleetbase) sync tasks.

The live-runtime sync is best-effort enrichment. Running it synchronously
inside request handlers added 10-30s of latency when the runtime is slow or
rejects the payload, so writes enqueue these tasks instead. The worker
re-loads the shipment from the DB (retry-safe, survives deploys).
"""
import logging

from app.db.session import SessionLocal
from app.models.shipment import Shipment
from app.services.shipment_service import (
    sync_shipment_to_live_runtime,
    sync_shipment_event_to_live_runtime,
)
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    bind=True,
    name='app.tasks.shipment_sync.sync_shipment_runtime',
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=300,
    max_retries=3,
)
def sync_shipment_runtime(self, shipment_id: str, operation: str = "update") -> None:
    db = SessionLocal()
    try:
        shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
        if not shipment:
            logger.warning("sync_shipment_runtime: shipment %s not found", shipment_id)
            return
        sync_shipment_to_live_runtime(db, shipment, operation=operation)
    finally:
        db.close()


@celery_app.task(
    bind=True,
    name='app.tasks.shipment_sync.sync_shipment_event_runtime',
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=300,
    max_retries=3,
)
def sync_shipment_event_runtime(
    self,
    shipment_id: str,
    event_type: str,
    location: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    description: str | None = None,
    occurred_at: str | None = None,
) -> None:
    db = SessionLocal()
    try:
        shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
        if not shipment:
            logger.warning("sync_shipment_event_runtime: shipment %s not found", shipment_id)
            return
        from datetime import datetime
        sync_shipment_event_to_live_runtime(
            db,
            shipment,
            event_type=event_type,
            location=location,
            latitude=latitude,
            longitude=longitude,
            description=description,
            occurred_at=datetime.fromisoformat(occurred_at) if occurred_at else None,
        )
    finally:
        db.close()
