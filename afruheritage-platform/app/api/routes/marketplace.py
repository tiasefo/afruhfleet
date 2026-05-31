from __future__ import annotations
import json
import logging
import uuid as _uuid_mod
from contextlib import contextmanager
from datetime import datetime
from math import radians, sin, cos, sqrt, atan2
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine, func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.marketplace import MarketplaceShipment, ShipmentBid
from app.models.user import User, UserRole
from app.services.entitlements import require_feature_or_raise
from app.services.credits import consume_credits

router = APIRouter(prefix="/marketplace", tags=["Delivery Marketplace"])
logger = logging.getLogger("afruheritage.marketplace")

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


@contextmanager
def _db_session():
    """Context manager that ensures rollback on error and always closes the session."""
    db = SessionLocal()
    try:
        yield db
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("DB error in marketplace")
        raise HTTPException(status_code=500, detail="Database error. Please try again.") from exc
    except Exception as exc:
        db.rollback()
        logger.exception("Unexpected error in marketplace")
        raise HTTPException(status_code=500, detail="Unexpected server error. Please try again.") from exc
    finally:
        db.close()

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

class BidCreate(BaseModel):
    proposed_price: float
    currency: str = "GHS"
    message: str | None = None

class BidCounter(BaseModel):
    counter_price: float
    counter_message: str | None = None

class BidResponse(BaseModel):
    response: str   # "accepted_counter" | "rejected_counter"

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
        "id": str(job.id),
        "job_id": str(job.id),
        "tracking_number": job.tracking_number,
        "status": job.status,
        "tenant_id": job.tenant_id,
        "customer_name": job.customer_name,
        "title": job.title,
        "description": job.description,
        "pickup_address": job.pickup_label,
        "dropoff_address": job.dropoff_label,
        "pickup": {"label": job.pickup_label, "latitude": job.pickup_latitude, "longitude": job.pickup_longitude},
        "dropoff": {"label": job.dropoff_label, "latitude": job.dropoff_latitude, "longitude": job.dropoff_longitude},
        "weight_kg": job.weight_kg,
        "length_cm": job.length_cm,
        "width_cm": job.width_cm,
        "height_cm": job.height_cm,
        "package_count": job.package_count,
        "package_value": job.package_value,
        "item_description": job.description,
        "image_urls": json.loads(job.image_urls_json or "[]"),
        "fragile": job.fragile,
        "refrigerated": job.refrigerated,
        "special_handling_notes": job.special_handling_notes,
        "distance_km": job.distance_km,
        "suggested_price": job.suggested_price,
        "currency": job.currency,
        "assigned_driver_id": job.assigned_driver_id,
        "tracking_status": job.tracking_status,
        "created_at": job.created_at.isoformat() if job.created_at else None,
    }

def _generate_tracking_number(db: Session) -> str:
    """Generate a unique human-readable tracking number: AFR-YYYY-NNNNNN."""
    year = datetime.utcnow().year
    # Count shipments this year to generate a sequential-ish suffix
    count = db.query(func.count(MarketplaceShipment.id)).scalar() or 0
    return f"AFR-{year}-{count + 1:06d}"


@router.get("/shipments")
def list_my_shipments(
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return shipments created by the current user (personal shippers / company admins)."""
    q = db.query(MarketplaceShipment).filter(
        MarketplaceShipment.created_by_user_id == str(current_user.id)
    )
    if status:
        q = q.filter(MarketplaceShipment.status == status)
    total = q.count()
    items = q.order_by(MarketplaceShipment.created_at.desc()).offset(offset).limit(limit).all()
    return {"total": total, "items": [serialize(s) for s in items]}


@router.get("/shipments/{shipment_id}")
def get_shipment(
    shipment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return a single shipment with its bids. Owners see all bids; drivers see only their own."""
    shipment = db.query(MarketplaceShipment).filter(
        MarketplaceShipment.id == shipment_id
    ).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found.")

    is_owner = str(shipment.created_by_user_id) == str(current_user.id)
    is_admin = current_user.role == UserRole.platform_admin

    bid_q = db.query(ShipmentBid).filter(ShipmentBid.shipment_id == shipment_id)
    if not is_owner and not is_admin:
        bid_q = bid_q.filter(ShipmentBid.driver_user_id == str(current_user.id))

    bids = [
        {
            "bid_id": str(b.id),
            "driver_user_id": b.driver_user_id,
            "driver_name": b.driver_name,
            "proposed_price": b.proposed_price,
            "currency": b.currency,
            "message": b.message,
            "status": b.status,
            "counter_price": b.counter_price,
            "counter_message": b.counter_message,
            "created_at": b.created_at.isoformat() if b.created_at else None,
        }
        for b in bid_q.order_by(ShipmentBid.created_at.asc()).all()
    ]

    result = serialize(shipment)
    result["bids"] = bids
    result["bid_count"] = len(bids)
    return result


@router.post("/shipments")
def post_shipment(payload: ShipmentPost):
    with _db_session() as db:
        require_feature_or_raise(db, payload.tenant_id, "marketplace_basic")

        trip_distance = distance_km(
            payload.pickup.latitude, payload.pickup.longitude,
            payload.dropoff.latitude, payload.dropoff.longitude,
        )
        price = suggested_price(trip_distance, payload.weight_kg)
        tracking_number = _generate_tracking_number(db)

        job = MarketplaceShipment(
            tracking_number=tracking_number,
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
        # Deduct credits AFTER the shipment is successfully persisted so a DB
        # failure does not result in credits being consumed for a lost record.
        consume_credits(db, payload.tenant_id, "marketplace_post")
        return serialize(job)

@router.post("/drivers/search")
def search_jobs(payload: DriverSearch):
    with _db_session() as db:
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

@router.post("/shipments/{job_id}/accept")
def accept_job(job_id: str, payload: AcceptJob):
    with _db_session() as db:
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

@router.post("/shipments/{job_id}/tracking/{status}")
def update_tracking(job_id: str, status: str):
    allowed = ["driver_assigned", "pickup_started", "picked_up", "in_transit", "delivered", "cancelled"]
    if status not in allowed:
        raise HTTPException(status_code=400, detail={"error": "invalid_status", "allowed": allowed})

    with _db_session() as db:
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
    with _db_session() as db:
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


@router.get("/shipments/{job_id}/gps")
def get_gps_history(job_id: str):
    with _db_session() as db:
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


# ---------------------------------------------------------------------------
# Bidding endpoints
# ---------------------------------------------------------------------------

@router.post("/shipments/{shipment_id}/bids", status_code=201)
def submit_bid(
    shipment_id: str,
    payload: BidCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Driver submits a bid on an open shipment."""
    if current_user.role not in (UserRole.delivery_driver, UserRole.platform_admin):
        raise HTTPException(status_code=403, detail="Only drivers can submit bids.")

    shipment = db.query(MarketplaceShipment).filter(MarketplaceShipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found.")
    if shipment.status not in ("open", "seeking_driver"):
        raise HTTPException(status_code=409, detail=f"Shipment is not accepting bids (status={shipment.status}).")

    existing = db.query(ShipmentBid).filter(
        ShipmentBid.shipment_id == shipment_id,
        ShipmentBid.driver_user_id == str(current_user.id),
        ShipmentBid.status.in_(["pending", "countered"]),
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="You already have an active bid on this shipment.")

    bid = ShipmentBid(
        shipment_id=shipment_id,
        driver_user_id=str(current_user.id),
        driver_name=current_user.full_name or current_user.email,
        proposed_price=payload.proposed_price,
        currency=payload.currency,
        message=payload.message,
        status="pending",
    )
    db.add(bid)
    db.commit()
    db.refresh(bid)
    return {"bid_id": str(bid.id), "status": bid.status, "tracking_number": shipment.tracking_number}


@router.get("/shipments/{shipment_id}/bids")
def list_bids(
    shipment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Shipper or admin views all bids on their shipment."""
    shipment = db.query(MarketplaceShipment).filter(MarketplaceShipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found.")

    # Only the shipment owner or platform admin can list bids
    is_owner = str(shipment.created_by_user_id) == str(current_user.id)
    if not is_owner and current_user.role != UserRole.platform_admin:
        raise HTTPException(status_code=403, detail="Not your shipment.")

    bids = db.query(ShipmentBid).filter(ShipmentBid.shipment_id == shipment_id).all()
    return [
        {
            "bid_id": str(b.id),
            "driver_name": b.driver_name,
            "driver_user_id": b.driver_user_id,
            "proposed_price": b.proposed_price,
            "currency": b.currency,
            "message": b.message,
            "status": b.status,
            "counter_price": b.counter_price,
            "counter_message": b.counter_message,
            "created_at": b.created_at.isoformat(),
        }
        for b in bids
    ]


@router.post("/shipments/{shipment_id}/bids/{bid_id}/accept")
def accept_bid(
    shipment_id: str,
    bid_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Shipper accepts a driver's bid — assigns the driver."""
    shipment, bid = _get_shipment_and_bid(shipment_id, bid_id, current_user, db, require_owner=True)

    if bid.status not in ("pending", "countered"):
        raise HTTPException(status_code=409, detail=f"Bid cannot be accepted in its current state ({bid.status}).")

    # Reject all other bids on this shipment
    db.query(ShipmentBid).filter(
        ShipmentBid.shipment_id == shipment_id,
        ShipmentBid.id != bid_id,
        ShipmentBid.status == "pending",
    ).update({"status": "rejected"})

    bid.status = "accepted"
    shipment.status = "assigned"
    shipment.assigned_driver_id = bid.driver_user_id
    db.commit()
    return {"message": "Bid accepted. Driver assigned.", "driver_user_id": bid.driver_user_id}


@router.post("/shipments/{shipment_id}/bids/{bid_id}/reject")
def reject_bid(
    shipment_id: str,
    bid_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Shipper rejects a bid."""
    shipment, bid = _get_shipment_and_bid(shipment_id, bid_id, current_user, db, require_owner=True)
    if bid.status not in ("pending", "countered"):
        raise HTTPException(status_code=409, detail="Bid cannot be rejected in its current state.")
    bid.status = "rejected"
    db.commit()
    return {"message": "Bid rejected."}


@router.post("/shipments/{shipment_id}/bids/{bid_id}/counter")
def counter_bid(
    shipment_id: str,
    bid_id: str,
    payload: BidCounter,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Shipper counter-offers on a bid."""
    shipment, bid = _get_shipment_and_bid(shipment_id, bid_id, current_user, db, require_owner=True)
    if bid.status != "pending":
        raise HTTPException(status_code=409, detail="Can only counter a pending bid.")
    bid.counter_price = payload.counter_price
    bid.counter_message = payload.counter_message
    bid.status = "countered"
    db.commit()
    return {"message": "Counter offer sent to driver.", "counter_price": payload.counter_price}


@router.post("/shipments/{shipment_id}/bids/{bid_id}/respond-counter")
def respond_to_counter(
    shipment_id: str,
    bid_id: str,
    payload: BidResponse,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Driver responds to a counter offer."""
    if current_user.role not in (UserRole.delivery_driver, UserRole.platform_admin):
        raise HTTPException(status_code=403, detail="Only drivers can respond to counter offers.")

    if payload.response not in ("accepted_counter", "rejected_counter"):
        raise HTTPException(status_code=422, detail="Response must be 'accepted_counter' or 'rejected_counter'.")

    _, bid = _get_shipment_and_bid(shipment_id, bid_id, current_user, db, require_owner=False)
    if str(bid.driver_user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="This is not your bid.")
    if bid.status != "countered":
        raise HTTPException(status_code=409, detail="Bid has no pending counter to respond to.")

    bid.counter_response = payload.response
    if payload.response == "accepted_counter":
        bid.status = "accepted"
        bid.proposed_price = bid.counter_price  # lock in the agreed price
        db.query(MarketplaceShipment).filter(MarketplaceShipment.id == shipment_id).update({
            "status": "assigned",
            "assigned_driver_id": bid.driver_user_id,
        })
    else:
        bid.status = "rejected"

    db.commit()
    return {"message": f"Counter offer {payload.response.replace('_', ' ')}."}


# ---------------------------------------------------------------------------
# Driver dashboard — open shipments near current location
# ---------------------------------------------------------------------------

@router.get("/dashboard/driver")
def driver_dashboard(
    lat: float,
    lon: float,
    radius_km: float = 100.0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns open shipments near the driver, sorted by distance to pickup.
    Also includes this driver's bid status for each shipment.
    """
    if current_user.role not in (UserRole.delivery_driver, UserRole.platform_admin):
        raise HTTPException(status_code=403, detail="Only drivers can access the driver dashboard.")

    open_shipments = db.query(MarketplaceShipment).filter(
        MarketplaceShipment.status.in_(["open", "seeking_driver"])
    ).all()

    driver_bids = {
        b.shipment_id: b
        for b in db.query(ShipmentBid).filter(
            ShipmentBid.driver_user_id == str(current_user.id),
            ShipmentBid.status.in_(["pending", "countered", "accepted"]),
        ).all()
    }

    results = []
    for s in open_shipments:
        pickup_lat = s.pickup_latitude or 0.0
        pickup_lon = s.pickup_longitude or 0.0
        dist = distance_km(lat, lon, pickup_lat, pickup_lon)
        if dist > radius_km:
            continue

        my_bid = driver_bids.get(str(s.id))
        results.append({
            "shipment_id": str(s.id),
            "tracking_number": s.tracking_number,
            "title": s.title,
            "description": s.description,
            "pickup_label": s.pickup_label,
            "dropoff_label": s.dropoff_label,
            "pickup_lat": pickup_lat,
            "pickup_lon": pickup_lon,
            "distance_from_you_km": round(dist, 2),
            "trip_distance_km": round(s.distance_km or 0.0, 2),
            "suggested_price": s.suggested_price,
            "weight_kg": s.weight_kg,
            "package_count": s.package_count,
            "fragile": s.fragile,
            "image_urls": json.loads(s.image_urls_json or "[]"),
            "posted_at": s.created_at.isoformat() if s.created_at else None,
            "my_bid": {
                "bid_id": str(my_bid.id),
                "status": my_bid.status,
                "proposed_price": my_bid.proposed_price,
                "counter_price": my_bid.counter_price,
            } if my_bid else None,
        })

    results.sort(key=lambda x: x["distance_from_you_km"])
    return {"count": len(results), "shipments": results}


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _get_shipment_and_bid(
    shipment_id: str,
    bid_id: str,
    current_user: User,
    db: Session,
    require_owner: bool,
):
    shipment = db.query(MarketplaceShipment).filter(MarketplaceShipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found.")

    if require_owner:
        is_owner = str(shipment.created_by_user_id) == str(current_user.id)
        if not is_owner and current_user.role != UserRole.platform_admin:
            raise HTTPException(status_code=403, detail="Not your shipment.")

    bid = db.query(ShipmentBid).filter(ShipmentBid.id == bid_id, ShipmentBid.shipment_id == shipment_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found.")

    return shipment, bid
