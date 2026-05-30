#!/usr/bin/env bash
set -euo pipefail

mkdir -p app/models app/api/routes

cat > app/models/saas_subscription.py <<'PY'
from __future__ import annotations
import uuid
from datetime import datetime
from sqlalchemy import Boolean, DateTime, Integer, String, Text, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base

class SaaSPlan(Base):
    __tablename__ = "saas_plans"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    monthly_price: Mapped[float] = mapped_column(Float, default=0)
    included_credits: Mapped[int] = mapped_column(Integer, default=0)
    features_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class SaaSAddon(Base):
    __tablename__ = "saas_addons"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    monthly_price: Mapped[float] = mapped_column(Float, default=0)
    feature_code: Mapped[str] = mapped_column(String(100))
    info_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)

class TenantSubscription(Base):
    __tablename__ = "tenant_subscriptions"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[str] = mapped_column(String(255), index=True)
    plan_code: Mapped[str] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(50), default="active")
    trial: Mapped[bool] = mapped_column(Boolean, default=False)
    selected_addons_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    credits_balance: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class FeatureUsage(Base):
    __tablename__ = "feature_usage"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[str] = mapped_column(String(255), index=True)
    feature_code: Mapped[str] = mapped_column(String(100), index=True)
    units_used: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
PY

cat > app/models/marketplace.py <<'PY'
from __future__ import annotations
import uuid
from datetime import datetime
from sqlalchemy import DateTime, Float, String, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base

class MarketplaceShipment(Base):
    __tablename__ = "marketplace_shipments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[str] = mapped_column(String(255), index=True)
    customer_name: Mapped[str] = mapped_column(String(255))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    pickup_label: Mapped[str] = mapped_column(String(255))
    pickup_latitude: Mapped[float] = mapped_column(Float)
    pickup_longitude: Mapped[float] = mapped_column(Float)

    dropoff_label: Mapped[str] = mapped_column(String(255))
    dropoff_latitude: Mapped[float] = mapped_column(Float)
    dropoff_longitude: Mapped[float] = mapped_column(Float)

    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    length_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    width_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    height_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    package_count: Mapped[int | None] = mapped_column(Float, nullable=True)
    package_value: Mapped[float | None] = mapped_column(Float, nullable=True)

    image_urls_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    fragile: Mapped[bool] = mapped_column(Boolean, default=False)
    refrigerated: Mapped[bool] = mapped_column(Boolean, default=False)
    special_handling_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    distance_km: Mapped[float] = mapped_column(Float, default=0)
    suggested_price: Mapped[float] = mapped_column(Float, default=0)
    currency: Mapped[str] = mapped_column(String(20), default="GHS")

    status: Mapped[str] = mapped_column(String(100), default="open")
    tracking_status: Mapped[str] = mapped_column(String(100), default="not_started")
    assigned_driver_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
PY

cat > app/api/routes/marketplace.py <<'PY'
from __future__ import annotations
import json
from math import radians, sin, cos, sqrt, atan2
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.marketplace import MarketplaceShipment

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
PY

cat > app/api/routes/admin_marketplace.py <<'PY'
from fastapi import APIRouter, HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.marketplace import MarketplaceShipment
from app.api.routes.marketplace import serialize

router = APIRouter(prefix="/admin/marketplace", tags=["Admin Marketplace"])

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

@router.get("/jobs")
def list_jobs():
    db = SessionLocal()
    try:
        return {"jobs": [serialize(x) for x in db.query(MarketplaceShipment).order_by(MarketplaceShipment.created_at.desc()).all()]}
    finally:
        db.close()

@router.post("/jobs/{job_id}/cancel")
def cancel_job(job_id: str):
    db = SessionLocal()
    try:
        job = db.query(MarketplaceShipment).filter(MarketplaceShipment.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="job_not_found")
        job.status = "cancelled"
        job.tracking_status = "cancelled"
        db.add(job)
        db.commit()
        db.refresh(job)
        return serialize(job)
    finally:
        db.close()

@router.post("/jobs/{job_id}/reassign/{driver_id}")
def reassign_job(job_id: str, driver_id: str):
    db = SessionLocal()
    try:
        job = db.query(MarketplaceShipment).filter(MarketplaceShipment.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="job_not_found")
        job.assigned_driver_id = driver_id
        job.status = "assigned"
        job.tracking_status = "driver_assigned"
        db.add(job)
        db.commit()
        db.refresh(job)
        return serialize(job)
    finally:
        db.close()
PY

python3 - <<'PY'
from pathlib import Path
p = Path("app/main.py")
text = p.read_text()

imports = [
    "from app.api.routes.marketplace import router as marketplace_router",
    "from app.api.routes.admin_marketplace import router as admin_marketplace_router",
]
routes = [
    "app.include_router(marketplace_router, prefix=settings.api_v1_prefix)",
    "app.include_router(admin_marketplace_router, prefix=settings.api_v1_prefix)",
]
model_imports = [
    "import app.models.marketplace  # noqa: F401",
    "import app.models.saas_subscription  # noqa: F401",
]

for imp in imports:
    if imp not in text:
        text = imp + "\n" + text

for mi in model_imports:
    if mi not in text:
        text = text.replace("import app.models.tenant_request  # noqa: F401", "import app.models.tenant_request  # noqa: F401\n" + mi)

for route in routes:
    if route not in text:
        text += "\n" + route + "\n"

p.write_text(text)
print("subscription + marketplace persistence + admin routes mounted")
PY

echo "Done. Rebuild API now."
