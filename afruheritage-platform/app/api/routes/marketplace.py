from __future__ import annotations
import json
from math import radians, sin, cos, sqrt, atan2
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.marketplace import MarketplaceShipment
from app.services.entitlements import require_feature_or_raise
from app.services.credits import consume_credits

router = APIRouter(prefix="/marketplace", tags=["Delivery Marketplace"])

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class Location(BaseModel):
    label: str
    latitude: float
    longitude: float

class ShipmentPost(BaseModel):
    tenant_id: str
    customer_name: str
    title: str
    description: str | None = None
    pickup: Location
    dropoff: Location

    weight_kg: float | None = None
    length_cm: float | None = None
    width_cm: float | None = None
    height_cm: float | None = None
    package_count: int | None = None
    package_value: float | None = None

    image_urls: list[str] = []
    fragile: bool = False
    refrigerated: bool = False
    special_handling_notes: str | None = None

class DriverSearch(BaseModel):
    driver_id: str
    current_latitude: float
    current_longitude: float
    max_distance_km: float = 100

class AcceptJob(BaseModel):
    driver_id: str

def distance_km(a_lat, a_lon, b_lat, b_lon):
    radius = 6371
    dlat = radians(b_lat - a_lat)
    dlon = radians(b_lon - a_lon)
    x = sin(dlat / 2) ** 2 + cos(radians(a_lat)) * cos(radians(b_lat)) * sin(dlon / 2) ** 2
    return 2 * radius * atan2(sqrt(x), sqrt(1 - x))

def suggested_price(distance, weight):
    base = 20
    per_km = 5
    weight = weight or 1
    weight_fee = max(weight - 1, 0) * 2
    return round(base + (distance * per_km) + weight_fee, 2)

def serialize(job: MarketplaceShipment):
    return {
        "job_id": str(job.id),
        "status": job.status,
        "tenant_id": job.tenant_id,
        "customer_name": job.customer_name,
        "title": job.title,
        "description": job.description,
        "pickup": {"label": job.pickup_label, "latitude": job.pickup_latitude, "longitude": job.pickup_longitude},
        "dropoff": {"label": job.dropoff_label, "latitude": job.dropoff_latitude, "longitude": job.dropoff_longitude},
        "weight_kg": job.weight_kg,
        "length_cm": job.length_cm,
        "width_cm": job.width_cm,
        "height_cm": job.height_cm,
        "package_count": job.package_count,
        "package_value": job.package_value,
        "image_urls": json.loads(job.image_urls_json or "[]"),
        "fragile": job.fragile,
        "refrigerated": job.refrigerated,
        "special_handling_notes": job.special_handling_notes,
        "distance_km": job.distance_km,
        "suggested_price": job.suggested_price,
        "currency": job.currency,
        "assigned_driver_id": job.assigned_driver_id,
        "tracking_status": job.tracking_status,
    }

@router.post("/shipments")
def post_shipment(payload: ShipmentPost):
    db = SessionLocal()
    try:
        require_feature_or_raise(db, payload.tenant_id, "marketplace_basic")
        consume_credits(db, payload.tenant_id, "marketplace_post")

        trip_distance = distance_km(
            payload.pickup.latitude, payload.pickup.longitude,
            payload.dropoff.latitude, payload.dropoff.longitude,
        )
        price = suggested_price(trip_distance, payload.weight_kg)

        job = MarketplaceShipment(
            tenant_id=payload.tenant_id,
            customer_name=payload.customer_name,
            title=payload.title,
            description=payload.description,
            pickup_label=payload.pickup.label,
            pickup_latitude=payload.pickup.latitude,
            pickup_longitude=payload.pickup.longitude,
            dropoff_label=payload.dropoff.label,
            dropoff_latitude=payload.dropoff.latitude,
            dropoff_longitude=payload.dropoff.longitude,
            weight_kg=payload.weight_kg,
            length_cm=payload.length_cm,
            width_cm=payload.width_cm,
            height_cm=payload.height_cm,
            package_count=payload.package_count,
            package_value=payload.package_value,
            image_urls_json=json.dumps(payload.image_urls),
            fragile=payload.fragile,
            refrigerated=payload.refrigerated,
            special_handling_notes=payload.special_handling_notes,
            distance_km=round(trip_distance, 2),
            suggested_price=price,
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return serialize(job)
    finally:
        db.close()

@router.post("/drivers/search")
def search_jobs(payload: DriverSearch):
    db = SessionLocal()
    try:
        # Driver marketplace search is gated under vendor/driver subscription in production.
        rows = db.query(MarketplaceShipment).filter(MarketplaceShipment.status == "open").all()
        results = []
        for job in rows:
            driver_to_pickup = distance_km(
                payload.current_latitude, payload.current_longitude,
                job.pickup_latitude, job.pickup_longitude,
            )
            if driver_to_pickup <= payload.max_distance_km:
                item = serialize(job)
                item["driver_distance_to_pickup_km"] = round(driver_to_pickup, 2)
                results.append(item)
        return {"jobs": results}
    finally:
        db.close()

@router.post("/shipments/{job_id}/accept")
def accept_job(job_id: str, payload: AcceptJob):
    db = SessionLocal()
    try:
        job = db.query(MarketplaceShipment).filter(MarketplaceShipment.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="job_not_found")
        if job.status != "open":
            raise HTTPException(status_code=409, detail="job_not_available")
        job.status = "assigned"
        job.assigned_driver_id = payload.driver_id
        job.tracking_status = "driver_assigned"
        db.add(job)
        db.commit()
        db.refresh(job)
        return serialize(job)
    finally:
        db.close()

@router.post("/shipments/{job_id}/tracking/{status}")
def update_tracking(job_id: str, status: str):
    allowed = ["driver_assigned", "pickup_started", "picked_up", "in_transit", "delivered", "cancelled"]
    if status not in allowed:
        raise HTTPException(status_code=400, detail={"error": "invalid_status", "allowed": allowed})

    db = SessionLocal()
    try:
        job = db.query(MarketplaceShipment).filter(MarketplaceShipment.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="job_not_found")
        job.tracking_status = status
        if status == "delivered":
            job.status = "completed"
        if status == "cancelled":
            job.status = "cancelled"
        db.add(job)
        db.commit()
        db.refresh(job)
        return serialize(job)
    finally:
        db.close()

from datetime import datetime
from app.models.marketplace_gps import MarketplaceGpsPing

class GpsPingRequest(BaseModel):
    driver_id: str
    latitude: float
    longitude: float
    speed_kmh: float | None = None
    heading_degrees: float | None = None


@router.post("/shipments/{job_id}/gps")
def add_gps_ping(job_id: str, payload: GpsPingRequest):
    db = SessionLocal()
    try:
        job = db.query(MarketplaceShipment).filter(MarketplaceShipment.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="job_not_found")

        if job.assigned_driver_id and job.assigned_driver_id != payload.driver_id:
            raise HTTPException(status_code=403, detail="driver_not_assigned_to_this_job")

        if job.status in ["completed", "cancelled"]:
            raise HTTPException(
                status_code=409,
                detail="gps_updates_closed_for_completed_or_cancelled_job",
            )

        if job.status in ["completed", "cancelled"]:
            raise HTTPException(
                status_code=409,
                detail="gps_updates_closed_for_completed_or_cancelled_job",
            )

        if job.status in ["completed", "cancelled"]:
            raise HTTPException(
                status_code=409,
                detail="gps_updates_closed_for_completed_or_cancelled_job",
            )

        if job.status in ["completed", "cancelled"]:
            raise HTTPException(
                status_code=409,
                detail="gps_updates_closed_for_completed_or_cancelled_job",
            )

        if job.status in ["completed", "cancelled"]:
            raise HTTPException(
                status_code=409,
                detail="gps_updates_closed_for_completed_or_cancelled_job",
            )

        if job.status in ["completed", "cancelled"]:
            raise HTTPException(
                status_code=409,
                detail="gps_updates_closed_for_completed_or_cancelled_job",
            )

        require_feature_or_raise(db, job.tenant_id, "marketplace_gps")
        consume_credits(db, job.tenant_id, "marketplace_gps_ping")

        distance_to_dropoff = distance_km(
            payload.latitude,
            payload.longitude,
            job.dropoff_latitude,
            job.dropoff_longitude,
        )

        ping = MarketplaceGpsPing(
            shipment_id=job.id,
            driver_id=payload.driver_id,
            latitude=payload.latitude,
            longitude=payload.longitude,
            speed_kmh=payload.speed_kmh,
            heading_degrees=payload.heading_degrees,
            distance_to_dropoff_km=round(distance_to_dropoff, 2),
        )

        if job.tracking_status in ["driver_assigned", "pickup_started", "picked_up"]:
            job.tracking_status = "in_transit"

        db.add(ping)
        db.add(job)
        db.commit()
        db.refresh(ping)

        return {
            "ping_id": str(ping.id),
            "job_id": job_id,
            "driver_id": ping.driver_id,
            "latitude": ping.latitude,
            "longitude": ping.longitude,
            "speed_kmh": ping.speed_kmh,
            "heading_degrees": ping.heading_degrees,
            "distance_to_dropoff_km": ping.distance_to_dropoff_km,
            "created_at": ping.created_at.isoformat(),
            "tracking_status": job.tracking_status,
        }
    finally:
        db.close()


@router.get("/shipments/{job_id}/gps")
def get_gps_history(job_id: str):
    db = SessionLocal()
    try:
        job = db.query(MarketplaceShipment).filter(MarketplaceShipment.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="job_not_found")

        rows = (
            db.query(MarketplaceGpsPing)
            .filter(MarketplaceGpsPing.shipment_id == job.id)
            .order_by(MarketplaceGpsPing.created_at.desc())
            .limit(100)
            .all()
        )

        latest = rows[0] if rows else None

        return {
            "job_id": job_id,
            "tracking_status": job.tracking_status,
            "latest": {
                "ping_id": str(latest.id),
                "driver_id": latest.driver_id,
                "latitude": latest.latitude,
                "longitude": latest.longitude,
                "speed_kmh": latest.speed_kmh,
                "heading_degrees": latest.heading_degrees,
                "distance_to_dropoff_km": latest.distance_to_dropoff_km,
                "created_at": latest.created_at.isoformat(),
            } if latest else None,
            "history": [
                {
                    "ping_id": str(x.id),
                    "driver_id": x.driver_id,
                    "latitude": x.latitude,
                    "longitude": x.longitude,
                    "speed_kmh": x.speed_kmh,
                    "heading_degrees": x.heading_degrees,
                    "distance_to_dropoff_km": x.distance_to_dropoff_km,
                    "created_at": x.created_at.isoformat(),
                }
                for x in rows
            ],
        }
    finally:
        db.close()
