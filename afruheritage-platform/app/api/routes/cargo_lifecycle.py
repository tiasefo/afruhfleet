from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db

router = APIRouter(prefix="/cargo-lifecycle", tags=["Cargo Lifecycle"])

VALID_STATUSES = {
    "received_at_warehouse",
    "pending_loading",
    "loaded_to_container",
    "container_departed",
    "at_transshipment_port",
    "arrived_destination_port",
    "customs_processing",
    "customs_cleared",
    "ready_for_pickup",
    "out_for_delivery",
    "delivered",
    "lost_or_missing",
}

class StatusUpdate(BaseModel):
    status: str
    location: Optional[str] = None
    notes: Optional[str] = None
    estimated_arrival_date: Optional[str] = None
    actual_arrival_date: Optional[str] = None
    changed_by: Optional[str] = "admin"

@router.put("/{tracking_number}/status")
def update_status(tracking_number: str, payload: StatusUpdate, db: Session = Depends(get_db)):
    if payload.status not in VALID_STATUSES:
        raise HTTPException(400, f"Invalid status: {payload.status}")

    cargo = db.execute(text("""
        SELECT id, tenant_id, status
        FROM cargo_records
        WHERE afru_tracking_number=:tracking
        LIMIT 1
    """), {"tracking": tracking_number}).mappings().first()

    if not cargo:
        raise HTTPException(404, "Cargo record not found")

    db.execute(text("""
        UPDATE cargo_records
        SET status=:new_status,
            status_updated_at=now(),
            last_location=:location,
            public_notes=:notes,
            estimated_arrival_date=COALESCE(:eta::date, estimated_arrival_date),
            actual_arrival_date=COALESCE(:actual::date, actual_arrival_date)
        WHERE id=:cargo_id
    """), {
        "new_status": payload.status,
        "location": payload.location,
        "notes": payload.notes,
        "eta": payload.estimated_arrival_date,
        "actual": payload.actual_arrival_date,
        "cargo_id": cargo["id"],
    })

    db.execute(text("""
        INSERT INTO cargo_status_history (
            tenant_id, cargo_record_id, old_status, new_status,
            location, notes, changed_by
        )
        VALUES (:tenant_id,:cargo_id,:old_status,:new_status,:location,:notes,:changed_by)
    """), {
        "tenant_id": cargo["tenant_id"],
        "cargo_id": cargo["id"],
        "old_status": cargo["status"],
        "new_status": payload.status,
        "location": payload.location,
        "notes": payload.notes,
        "changed_by": payload.changed_by,
    })

    db.commit()
    return {"status": "updated", "tracking_number": tracking_number, "new_status": payload.status}

@router.get("/{tracking_number}/timeline")
def get_timeline(tracking_number: str, db: Session = Depends(get_db)):
    cargo = db.execute(text("""
        SELECT id, afru_tracking_number, customer_name, status, last_location, public_notes
        FROM cargo_records
        WHERE afru_tracking_number=:tracking
        LIMIT 1
    """), {"tracking": tracking_number}).mappings().first()

    if not cargo:
        raise HTTPException(404, "Cargo record not found")

    events = db.execute(text("""
        SELECT old_status, new_status, location, notes, changed_by, created_at
        FROM cargo_status_history
        WHERE cargo_record_id=:cargo_id
        ORDER BY created_at ASC
    """), {"cargo_id": cargo["id"]}).mappings().all()

    return {
        "cargo": dict(cargo),
        "timeline": [dict(e) for e in events],
    }
