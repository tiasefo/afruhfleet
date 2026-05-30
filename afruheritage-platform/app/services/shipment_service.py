from __future__ import annotations
from app.core.config import settings

import csv
import io
import logging
import math
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import requests
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.shipment import (
    GroupMember,
    PaymentStatus,
    Shipment,
    ShipmentEvent,
    ShipmentStatus,
)
from app.models.shipment_tracking import ShipmentTrackingPoint
from app.models.tenant import Tenant
from app.services.fleetbase_proxy import proxy_fleetbase_api, request_fleetbase_api, resolve_fleetbase_token
from app.services.notification_service import notification_service

logger = logging.getLogger("afruheritage.shipments")


# ── Payment helpers ─────────────────────────────────────────────

def _compute_payment(total_cost: float, amount_paid: float) -> tuple[float, PaymentStatus]:
    balance = round(max(total_cost - amount_paid, 0), 2)
    if amount_paid <= 0:
        return balance, PaymentStatus.UNPAID
    if amount_paid >= total_cost:
        return 0.0, PaymentStatus.PAID
    return balance, PaymentStatus.PARTIALLY_PAID


def _coerce_float(value: Any) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _coerce_datetime(value: Any) -> datetime | None:
    if value in (None, ""):
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        normalized = value.replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(normalized)
        except ValueError:
            return None
    return None


def _coerce_int(value: Any) -> int | None:
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _coerce_uuid(value: Any) -> Any:
    if isinstance(value, uuid.UUID) or value is None:
        return value
    if isinstance(value, str):
        try:
            return uuid.UUID(value)
        except ValueError:
            return value
    return value


def _to_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


def _pick_first(source: dict[str, Any], *keys: str) -> Any:
    for key in keys:
        if key in source and source[key] not in (None, ""):
            return source[key]
    return None


def _generate_tracking_number(db: Session, tenant_id: str) -> str:
    tenant_key = str(tenant_id).replace("-", "").upper()[:6] or "AFRH"
    for _ in range(10):
        candidate = f"AFR-{tenant_key}-{datetime.utcnow():%Y%m%d}-{uuid.uuid4().hex[:6].upper()}"
        exists = db.query(Shipment.id).filter(
            Shipment.tenant_id == _coerce_uuid(tenant_id),
            Shipment.tracking_number == candidate,
        ).first()
        if not exists:
            return candidate
    raise ValueError("Unable to generate a unique tracking number")


def _normalize_live_event(raw: Any) -> dict[str, Any] | None:
    if not isinstance(raw, dict):
        return None
    occurred_at = _coerce_datetime(
        _pick_first(raw, "occurred_at", "timestamp", "recorded_at", "created_at", "updated_at")
    )
    return {
        "id": str(_pick_first(raw, "id", "uuid") or f"live-{occurred_at.isoformat() if occurred_at else 'event'}"),
        "event_type": str(_pick_first(raw, "event_type", "type", "status", "name") or "location_update"),
        "location": _pick_first(raw, "location", "current_location", "address", "label"),
        "latitude": _coerce_float(_pick_first(raw, "latitude", "lat")),
        "longitude": _coerce_float(_pick_first(raw, "longitude", "lng", "lon", "long")),
        "description": _pick_first(raw, "description", "message", "details"),
        "occurred_at": occurred_at or datetime.utcnow(),
        "created_at": occurred_at or datetime.utcnow(),
    }


def _extract_tracking_payload(payload: Any, tracking_number: str) -> dict[str, Any] | None:
    if isinstance(payload, list):
        for item in payload:
            normalized = _extract_tracking_payload(item, tracking_number)
            if normalized:
                return normalized
        return None

    if not isinstance(payload, dict):
        return None

    for key in ("data", "tracking", "shipment", "result"):
        nested = payload.get(key)
        normalized = _extract_tracking_payload(nested, tracking_number)
        if normalized:
            return normalized

    candidate_tracking = _pick_first(payload, "tracking_number", "trackingNumber", "reference")
    if candidate_tracking and str(candidate_tracking) != tracking_number:
        return None

    latitude = _coerce_float(_pick_first(payload, "current_latitude", "latitude", "lat"))
    longitude = _coerce_float(_pick_first(payload, "current_longitude", "longitude", "lng", "lon", "long"))
    current_location = _pick_first(payload, "current_location", "location", "address", "label")
    status = _pick_first(payload, "status", "current_status")
    last_location_at = _coerce_datetime(
        _pick_first(payload, "last_location_at", "located_at", "updated_at", "timestamp")
    )
    raw_events = payload.get("events") or payload.get("timeline") or payload.get("history") or []
    events = [event for event in (_normalize_live_event(item) for item in raw_events) if event]

    if not any([latitude is not None, longitude is not None, current_location, status, events]):
        return None

    return {
        "tracking_number": tracking_number,
        "status": str(status) if status else None,
        "current_location": current_location,
        "current_latitude": latitude,
        "current_longitude": longitude,
        "last_location_at": last_location_at,
        "live_tracking_provider": str(_pick_first(payload, "provider", "source", "integration") or "fleetbase"),
        "events": events,
    }


def _extract_live_shipment_payload(payload: Any, tracking_number: str) -> dict[str, Any] | None:
    if isinstance(payload, list):
        for item in payload:
            normalized = _extract_live_shipment_payload(item, tracking_number)
            if normalized:
                return normalized
        return None

    if not isinstance(payload, dict):
        return None

    for key in ("data", "shipment", "result", "record", "item"):
        nested = payload.get(key)
        normalized = _extract_live_shipment_payload(nested, tracking_number)
        if normalized:
            return normalized

    for key in ("shipments", "records", "items"):
        nested = payload.get(key)
        if isinstance(nested, list):
            normalized = _extract_live_shipment_payload(nested, tracking_number)
            if normalized:
                return normalized

    candidate_tracking = _pick_first(payload, "tracking_number", "trackingNumber", "reference")
    if candidate_tracking and str(candidate_tracking) != tracking_number:
        return None

    tracking_value = _pick_first(payload, "tracking_number", "trackingNumber", "reference")
    sender_name = _pick_first(payload, "sender_name", "shipper_name", "sender", "shipper")
    receiver_name = _pick_first(payload, "receiver_name", "consignee_name", "receiver", "consignee")
    origin_country = _pick_first(payload, "origin_country", "originCountry")
    origin_city = _pick_first(payload, "origin_city", "originCity")
    destination_country = _pick_first(payload, "destination_country", "destinationCountry")
    destination_city = _pick_first(payload, "destination_city", "destinationCity")
    status = _pick_first(payload, "status", "shipment_status", "current_status")

    if not any([
        tracking_value,
        sender_name,
        receiver_name,
        origin_country,
        origin_city,
        destination_country,
        destination_city,
        status,
    ]):
        return None

    return {
        "tracking_number": str(tracking_value or tracking_number),
        "reference_number": _pick_first(payload, "reference_number", "referenceNumber", "reference"),
        "sender_name": sender_name,
        "sender_phone": _pick_first(payload, "sender_phone", "shipper_phone", "senderPhone", "shipperPhone"),
        "receiver_name": receiver_name,
        "receiver_phone": _pick_first(payload, "receiver_phone", "consignee_phone", "receiverPhone", "consigneePhone"),
        "origin_country": origin_country,
        "origin_city": origin_city,
        "destination_country": destination_country,
        "destination_city": destination_city,
        "current_location": _pick_first(payload, "current_location", "location", "currentLocation"),
        "current_latitude": _coerce_float(_pick_first(payload, "current_latitude", "latitude", "lat")),
        "current_longitude": _coerce_float(_pick_first(payload, "current_longitude", "longitude", "lng", "lon", "long")),
        "last_location_at": _coerce_datetime(_pick_first(payload, "last_location_at", "located_at", "updated_at", "timestamp")),
        "live_tracking_provider": str(_pick_first(payload, "provider", "source", "integration") or "fleetbase"),
        "shipped_date": _coerce_datetime(_pick_first(payload, "shipped_date", "shippedDate", "pickup_date", "pickupDate")),
        "estimated_arrival": _coerce_datetime(_pick_first(payload, "estimated_arrival", "estimatedArrival", "eta")),
        "actual_arrival": _coerce_datetime(_pick_first(payload, "actual_arrival", "actualArrival", "delivered_at", "deliveredAt")),
        "weight_kg": _coerce_float(_pick_first(payload, "weight_kg", "weightKg", "weight")),
        "package_count": _coerce_int(_pick_first(payload, "package_count", "packageCount", "packages")),
        "cargo_type": _pick_first(payload, "cargo_type", "cargoType", "type"),
        "status": str(status) if status else None,
    }


def _collect_live_shipment_records(payload: Any) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []

    def _walk(node: Any) -> None:
        if node in (None, ""):
            return
        if isinstance(node, list):
            for item in node:
                _walk(item)
            return
        if not isinstance(node, dict):
            return

        tracking_number = _pick_first(node, "tracking_number", "trackingNumber", "reference")
        normalized = _extract_live_shipment_payload(node, str(tracking_number or ""))
        if normalized and normalized.get("tracking_number"):
            records.append(normalized)
            return

        for key in ("data", "shipments", "records", "items", "results"):
            if key in node:
                _walk(node.get(key))

    _walk(payload)
    return records


def _fetch_live_payload(tenant: Tenant, endpoint: str, params: dict[str, Any] | None = None) -> Any:
    if not tenant.live_api_url:
        return None
    return proxy_fleetbase_api(
        tenant.live_api_url,
        endpoint,
        token=resolve_fleetbase_token(tenant.live_api_token),
        auth_scheme=tenant.live_api_auth_scheme,
        params=params,
        suppress_errors=True,
    )


def _tenant_runtime_token(tenant: Tenant) -> str | None:
    return resolve_fleetbase_token(tenant.live_api_token)


def _serialize_live_shipment_payload(shipment: Shipment) -> dict[str, Any]:
    return {
        "tracking_number": shipment.tracking_number,
        "reference_number": shipment.reference_number,
        "sender_name": shipment.sender_name,
        "sender_phone": shipment.sender_phone,
        "receiver_name": shipment.receiver_name,
        "receiver_phone": shipment.receiver_phone,
        "origin_country": shipment.origin_country,
        "origin_city": shipment.origin_city,
        "destination_country": shipment.destination_country,
        "destination_city": shipment.destination_city,
        "current_location": shipment.current_location,
        "current_latitude": _coerce_float(shipment.current_latitude),
        "current_longitude": _coerce_float(shipment.current_longitude),
        "last_location_at": shipment.last_location_at.isoformat() if shipment.last_location_at else None,
        "live_tracking_provider": shipment.live_tracking_provider,
        "shipped_date": shipment.shipped_date.isoformat() if shipment.shipped_date else None,
        "estimated_arrival": shipment.estimated_arrival.isoformat() if shipment.estimated_arrival else None,
        "actual_arrival": shipment.actual_arrival.isoformat() if shipment.actual_arrival else None,
        "weight_kg": _coerce_float(shipment.weight_kg),
        "package_count": shipment.package_count,
        "cargo_type": shipment.cargo_type,
        "status": shipment.status.value,
        "notes": shipment.notes,
    }


def sync_shipment_to_live_runtime(
    db: Session,
    shipment: Shipment,
    *,
    operation: str = "update",
) -> bool:
    tenant = db.query(Tenant).filter(Tenant.id == shipment.tenant_id).first()
    if not tenant or not tenant.live_api_url:
        return False

    payload = _serialize_live_shipment_payload(shipment)
    attempts: list[tuple[str, str]] = []
    if operation == "create":
        attempts.append(("POST", "shipments"))
    attempts.extend([
        ("PATCH", f"shipments/{shipment.tracking_number}"),
        ("PUT", f"shipments/{shipment.tracking_number}"),
    ])

    for method, endpoint in attempts:
        result = request_fleetbase_api(
            tenant.live_api_url,
            method,
            endpoint,
            token=_tenant_runtime_token(tenant),
            auth_scheme=tenant.live_api_auth_scheme,
            json_body=payload,
            suppress_errors=True,
        )
        if result is not None:
            return True

    logger.warning("Failed to sync shipment %s to tenant runtime %s", shipment.tracking_number, tenant.slug)
    return False


def sync_shipment_event_to_live_runtime(
    db: Session,
    shipment: Shipment,
    *,
    event_type: str,
    location: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    description: str | None = None,
    occurred_at: datetime | None = None,
) -> bool:
    tenant = db.query(Tenant).filter(Tenant.id == shipment.tenant_id).first()
    if not tenant or not tenant.live_api_url:
        return False

    payload = {
        "tracking_number": shipment.tracking_number,
        "event_type": event_type,
        "location": location,
        "latitude": latitude,
        "longitude": longitude,
        "description": description,
        "occurred_at": (occurred_at or datetime.utcnow()).isoformat(),
        "status": shipment.status.value,
    }
    attempts = [
        ("POST", f"shipments/{shipment.tracking_number}/tracking"),
        ("POST", "tracking"),
        ("PATCH", f"tracking/{shipment.tracking_number}"),
    ]

    for method, endpoint in attempts:
        result = request_fleetbase_api(
            tenant.live_api_url,
            method,
            endpoint,
            token=_tenant_runtime_token(tenant),
            auth_scheme=tenant.live_api_auth_scheme,
            json_body=payload,
            suppress_errors=True,
        )
        if result is not None:
            return True

    logger.warning("Failed to sync shipment event %s for %s to tenant runtime %s", event_type, shipment.tracking_number, tenant.slug)
    return False


def get_live_tracking_snapshot(db: Session, shipment: Shipment) -> dict[str, Any] | None:
    tenant = db.query(Tenant).filter(Tenant.id == shipment.tenant_id).first()
    if not tenant or not tenant.live_api_url:
        return None

    tracking_attempts = [
        ("tracking", {"tracking_number": shipment.tracking_number}),
        ("tracking", {"trackingNumber": shipment.tracking_number}),
        (f"tracking/{shipment.tracking_number}", None),
        (f"shipments/{shipment.tracking_number}/tracking", None),
    ]
    shipment_attempts = [
        ("shipments", {"tracking_number": shipment.tracking_number}),
        ("shipments", {"trackingNumber": shipment.tracking_number}),
        (f"shipments/{shipment.tracking_number}", None),
    ]

    live_tracking: dict[str, Any] | None = None
    for endpoint, params in tracking_attempts:
        normalized = _extract_tracking_payload(_fetch_live_payload(tenant, endpoint, params), shipment.tracking_number)
        if normalized:
            live_tracking = normalized
            break

    live_shipment: dict[str, Any] | None = None
    for endpoint, params in shipment_attempts:
        normalized = _extract_live_shipment_payload(_fetch_live_payload(tenant, endpoint, params), shipment.tracking_number)
        if normalized:
            live_shipment = normalized
            break

    if not live_tracking and not live_shipment:
        return None

    merged: dict[str, Any] = {}
    if live_shipment:
        merged.update(live_shipment)
    if live_tracking:
        merged.update(live_tracking)
    return merged


def get_live_shipment_index(
    db: Session,
    tenant_id: str,
    *,
    tracking_numbers: list[str],
    query: str | None = None,
    status: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> dict[str, dict[str, Any]]:
    if not tracking_numbers:
        return {}

    tenant = db.query(Tenant).filter(Tenant.id == _coerce_uuid(tenant_id)).first()
    if not tenant or not tenant.live_api_url:
        return {}

    wanted = {tracking_number for tracking_number in tracking_numbers if tracking_number}
    attempts = [
        {"q": query, "status": status, "page": page, "page_size": page_size},
        {"search": query, "status": status, "page": page, "pageSize": page_size},
        None,
    ]

    for params in attempts:
        filtered_params = None if params is None else {key: value for key, value in params.items() if value not in (None, "")}
        payload = _fetch_live_payload(tenant, "shipments", filtered_params)
        records = _collect_live_shipment_records(payload)
        if not records:
            continue

        index = {
            record["tracking_number"]: record
            for record in records
            if record.get("tracking_number") in wanted
        }
        if index:
            return index

    return {}


def merge_tracking_events(local_events: list[ShipmentEvent], live_snapshot: dict[str, Any] | None) -> list[dict[str, Any]]:
    merged: list[dict[str, Any]] = []
    seen: set[tuple[Any, ...]] = set()

    for event in local_events:
        item = {
            "id": str(event.id),
            "event_type": event.event_type,
            "location": event.location,
            "latitude": _coerce_float(event.latitude),
            "longitude": _coerce_float(event.longitude),
            "description": event.description,
            "occurred_at": event.occurred_at,
            "created_at": event.created_at,
        }
        signature = (item["event_type"], item["location"], item["occurred_at"])
        seen.add(signature)
        merged.append(item)

    for event in (live_snapshot or {}).get("events", []):
        signature = (event.get("event_type"), event.get("location"), event.get("occurred_at"))
        if signature in seen:
            continue
        seen.add(signature)
        merged.append(event)

    merged.sort(key=lambda item: item.get("occurred_at") or item.get("created_at") or datetime.utcnow())
    return merged


# ── Shipments ───────────────────────────────────────────────────

def create_shipment(db: Session, tenant_id: str, **kw: Any) -> Shipment:
    total = float(kw.get("total_cost", 0))
    paid = float(kw.get("amount_paid", 0))
    balance, pay_status = _compute_payment(total, paid)
    tracking_number = str(kw.get("tracking_number") or "").strip() or _generate_tracking_number(db, tenant_id)

    shipment = Shipment(
        tenant_id=_coerce_uuid(tenant_id),
        tracking_number=tracking_number,
        reference_number=kw.get("reference_number"),
        sender_name=kw["sender_name"],
        sender_phone=kw.get("sender_phone"),
        sender_address=kw.get("sender_address"),
        receiver_name=kw["receiver_name"],
        receiver_phone=kw.get("receiver_phone"),
        receiver_address=kw.get("receiver_address"),
        origin_country=kw.get("origin_country"),
        origin_city=kw.get("origin_city"),
        destination_country=kw.get("destination_country"),
        destination_city=kw.get("destination_city"),
        shipped_date=kw.get("shipped_date"),
        estimated_arrival=kw.get("estimated_arrival"),
        weight_kg=kw.get("weight_kg"),
        volume_cbm=kw.get("volume_cbm"),
        package_count=kw.get("package_count"),
        description=kw.get("description"),
        cargo_type=kw.get("cargo_type"),
        total_cost=total,
        amount_paid=paid,
        balance_due=balance,
        currency=kw.get("currency", "GHS"),
        payment_status=pay_status,
        status=ShipmentStatus.DRAFT,
        group_member_id=_coerce_uuid(kw.get("group_member_id")),
        notes=kw.get("notes"),
        created_by=kw.get("created_by"),
    )
    db.add(shipment)
    db.commit()
    db.refresh(shipment)
    add_shipment_event(db, str(shipment.id), "created", description="Shipment created")
    sync_shipment_to_live_runtime(db, shipment, operation="create")
    return shipment


def update_shipment(db: Session, shipment_id: str, tenant_id: str, **kw: Any) -> Shipment | None:
    shipment = db.query(Shipment).filter(
        Shipment.id == _coerce_uuid(shipment_id), Shipment.tenant_id == _coerce_uuid(tenant_id),
    ).first()
    if not shipment:
        return None

    for key, value in kw.items():
        if value is None or not hasattr(shipment, key):
            continue
        if key == "status":
            value = ShipmentStatus(value)
        elif key == "payment_status":
            value = PaymentStatus(value)
        setattr(shipment, key, value)

    if kw.get("total_cost") is not None or kw.get("amount_paid") is not None:
        balance, pay_status = _compute_payment(float(shipment.total_cost), float(shipment.amount_paid))
        shipment.balance_due = balance
        shipment.payment_status = pay_status

    db.commit()
    db.refresh(shipment)
    sync_shipment_to_live_runtime(db, shipment)
    return shipment


def update_shipment_location(
    db: Session,
    shipment_id: str,
    tenant_id: str,
    *,
    latitude: float,
    longitude: float,
    location: str | None = None,
    occurred_at: datetime | None = None,
    provider: str | None = None,
    event_type: str = "location_update",
    description: str | None = None,
    status: str | None = None,
) -> Shipment | None:
    shipment = get_shipment(db, shipment_id, tenant_id)
    if not shipment:
        return None

    shipment.current_latitude = latitude
    shipment.current_longitude = longitude
    shipment.current_location = location
    shipment.last_location_at = occurred_at or datetime.utcnow()
    shipment.live_tracking_provider = provider or shipment.live_tracking_provider or "manual"

    if status:
        shipment.status = ShipmentStatus(status)

    db.add(shipment)
    db.commit()
    db.refresh(shipment)

    add_shipment_event(
        db,
        shipment_id,
        event_type=event_type,
        location=location,
        latitude=latitude,
        longitude=longitude,
        description=description,
        occurred_at=occurred_at,
    )
    db.refresh(shipment)
    sync_shipment_to_live_runtime(db, shipment)
    return shipment


def ingest_tracking_point(
    db: Session,
    shipment_id: str,
    tenant_id: str,
    *,
    latitude: float,
    longitude: float,
    captured_at: datetime,
    speed_kph: float | None = None,
    heading: float | None = None,
    accuracy_m: float | None = None,
    source: str = "driver_app",
) -> tuple[bool, str | None, ShipmentTrackingPoint | None]:
    shipment = get_shipment(db, shipment_id, tenant_id)
    if not shipment:
        return False, "Shipment not found", None

    if latitude < -90 or latitude > 90 or longitude < -180 or longitude > 180:
        return False, "Invalid coordinates", None

    captured_at_utc = _to_utc(captured_at)
    stale_minutes = getattr(settings, "tracking_max_stale_minutes", 30)
    if captured_at_utc < datetime.now(timezone.utc) - timedelta(minutes=stale_minutes):
        return False, "Stale tracking point", None

    latest = (
        db.query(ShipmentTrackingPoint)
        .filter(
            ShipmentTrackingPoint.shipment_id == _coerce_uuid(shipment_id),
            ShipmentTrackingPoint.tenant_id == _coerce_uuid(tenant_id),
        )
        .order_by(ShipmentTrackingPoint.captured_at.desc())
        .first()
    )

    if latest:
        latest_captured = _to_utc(latest.captured_at)
        delta_seconds = max((captured_at_utc - latest_captured).total_seconds(), 0)
        distance_m = _haversine_distance_meters(
            float(latest.latitude), float(latest.longitude), float(latitude), float(longitude)
        )

        if delta_seconds < 20 and distance_m < 15:
            return False, "Ignored low-movement point", None

        if delta_seconds > 0:
            derived_speed = (distance_m / 1000) / (delta_seconds / 3600)
            if derived_speed > 180:
                return False, "Rejected unrealistic speed jump", None

    point = ShipmentTrackingPoint(
        shipment_id=_coerce_uuid(shipment_id),
        tenant_id=_coerce_uuid(tenant_id),
        latitude=latitude,
        longitude=longitude,
        speed_kph=speed_kph,
        heading=heading,
        accuracy_m=accuracy_m,
        source=source,
        captured_at=captured_at_utc,
    )
    db.add(point)
    db.commit()
    db.refresh(point)

    update_shipment_location(
        db,
        shipment_id,
        tenant_id,
        latitude=latitude,
        longitude=longitude,
        location=shipment.current_location,
        occurred_at=captured_at_utc,
        provider=source,
        event_type="location_update",
        description="Tracking point accepted",
    )
    return True, None, point


def get_latest_tracking_point(db: Session, shipment_id: str, tenant_id: str) -> ShipmentTrackingPoint | None:
    return (
        db.query(ShipmentTrackingPoint)
        .filter(
            ShipmentTrackingPoint.shipment_id == _coerce_uuid(shipment_id),
            ShipmentTrackingPoint.tenant_id == _coerce_uuid(tenant_id),
        )
        .order_by(ShipmentTrackingPoint.captured_at.desc())
        .first()
    )


def get_tracking_history(
    db: Session,
    shipment_id: str,
    tenant_id: str,
    *,
    from_ts: datetime | None = None,
    to_ts: datetime | None = None,
    limit: int = 500,
) -> list[ShipmentTrackingPoint]:
    query = db.query(ShipmentTrackingPoint).filter(
        ShipmentTrackingPoint.shipment_id == _coerce_uuid(shipment_id),
        ShipmentTrackingPoint.tenant_id == _coerce_uuid(tenant_id),
    )
    if from_ts:
        query = query.filter(ShipmentTrackingPoint.captured_at >= _to_utc(from_ts))
    if to_ts:
        query = query.filter(ShipmentTrackingPoint.captured_at <= _to_utc(to_ts))
    return query.order_by(ShipmentTrackingPoint.captured_at.asc()).limit(limit).all()


def search_shipments(
    db: Session,
    tenant_id: str,
    *,
    query: str | None = None,
    status: str | None = None,
    payment_status: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Shipment], int]:
    q = db.query(Shipment).filter(Shipment.tenant_id == _coerce_uuid(tenant_id))
    if query:
        pattern = f"%{query}%"
        q = q.filter(
            or_(
                Shipment.tracking_number.ilike(pattern),
                Shipment.reference_number.ilike(pattern),
                Shipment.sender_name.ilike(pattern),
                Shipment.receiver_name.ilike(pattern),
            )
        )
    if status:
        q = q.filter(Shipment.status == ShipmentStatus(status))
    if payment_status:
        q = q.filter(Shipment.payment_status == PaymentStatus(payment_status))

    total = q.count()
    items = q.order_by(Shipment.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def get_shipment(db: Session, shipment_id: str, tenant_id: str) -> Shipment | None:
    return db.query(Shipment).filter(
        Shipment.id == _coerce_uuid(shipment_id), Shipment.tenant_id == _coerce_uuid(tenant_id),
    ).first()


def public_track_shipment(db: Session, tenant_id: str, tracking_number: str) -> Shipment | None:
    return db.query(Shipment).filter(
        Shipment.tenant_id == _coerce_uuid(tenant_id),
        Shipment.tracking_number == tracking_number,
    ).first()


def add_shipment_event(
    db: Session,
    shipment_id: str,
    event_type: str,
    location: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    description: str | None = None,
    occurred_at: datetime | None = None,
) -> ShipmentEvent:
    event = ShipmentEvent(
        shipment_id=_coerce_uuid(shipment_id),
        event_type=event_type,
        location=location,
        latitude=latitude,
        longitude=longitude,
        description=description,
        occurred_at=occurred_at or datetime.utcnow(),
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # Automate shipment status transitions based on event_type
    shipment = db.query(Shipment).filter(Shipment.id == _coerce_uuid(shipment_id)).first()
    if shipment:
        if latitude is not None and longitude is not None:
            shipment.current_latitude = latitude
            shipment.current_longitude = longitude
            shipment.current_location = location or shipment.current_location
            shipment.last_location_at = event.occurred_at
            shipment.live_tracking_provider = shipment.live_tracking_provider or "manual"

        status_map = {
            ShipmentStatus.PICKED_UP.value: ShipmentStatus.PICKED_UP,
            ShipmentStatus.IN_TRANSIT.value: ShipmentStatus.IN_TRANSIT,
            ShipmentStatus.AT_CUSTOMS.value: ShipmentStatus.AT_CUSTOMS,
            ShipmentStatus.CUSTOMS_CLEARED.value: ShipmentStatus.CUSTOMS_CLEARED,
            ShipmentStatus.OUT_FOR_DELIVERY.value: ShipmentStatus.OUT_FOR_DELIVERY,
            ShipmentStatus.DELIVERED.value: ShipmentStatus.DELIVERED,
            ShipmentStatus.RETURNED.value: ShipmentStatus.RETURNED,
            ShipmentStatus.CANCELLED.value: ShipmentStatus.CANCELLED,
        }
        if event_type in status_map and shipment.status != status_map[event_type]:
            shipment.status = status_map[event_type]
            db.commit()
            db.refresh(shipment)

        tenant = db.query(Tenant).filter(Tenant.id == shipment.tenant_id).first()
        # Notify for delivered status
        if event_type == ShipmentStatus.DELIVERED.value and tenant:
            try:
                notification_service.send_shipment_delivered_email(
                    to=tenant.contact_email,
                    tracking_number=shipment.tracking_number,
                    company_name=tenant.company_name
                )
            except Exception as e:
                logger.error("Failed to send delivered notification: %s", e)
        
        # Notify for other status updates (excluding creation)
        elif event_type not in ["created", "booked"] and tenant:
            try:
                notification_service.send_shipment_status_update_email(
                    to=tenant.contact_email,
                    tracking_number=shipment.tracking_number,
                    status=event_type,
                    company_name=tenant.company_name
                )
            except Exception as e:
                logger.error("Failed to send status update notification: %s", e)

        sync_shipment_event_to_live_runtime(
            db,
            shipment,
            event_type=event_type,
            location=location,
            latitude=latitude,
            longitude=longitude,
            description=description,
            occurred_at=event.occurred_at,
        )
    
    return event


def get_shipment_events(db: Session, shipment_id: str) -> list[ShipmentEvent]:
    return db.query(ShipmentEvent).filter(
        ShipmentEvent.shipment_id == shipment_id,
    ).order_by(ShipmentEvent.occurred_at.asc()).all()


# ── Group Members ───────────────────────────────────────────────

def create_group_member(db: Session, tenant_id: str, **kw: Any) -> GroupMember:
    member = GroupMember(tenant_id=_coerce_uuid(tenant_id), **kw)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


def update_group_member(db: Session, member_id: str, tenant_id: str, **kw: Any) -> GroupMember | None:
    member = db.query(GroupMember).filter(
        GroupMember.id == _coerce_uuid(member_id), GroupMember.tenant_id == _coerce_uuid(tenant_id),
    ).first()
    if not member:
        return None
    for key, value in kw.items():
        if value is not None and hasattr(member, key):
            setattr(member, key, value)
    db.commit()
    db.refresh(member)
    return member


def list_group_members(
    db: Session,
    tenant_id: str,
    *,
    query: str | None = None,
    page: int = 1,
    page_size: int = 50,
) -> tuple[list[GroupMember], int]:
    q = db.query(GroupMember).filter(GroupMember.tenant_id == _coerce_uuid(tenant_id))
    if query:
        pattern = f"%{query}%"
        q = q.filter(
            or_(
                GroupMember.full_name.ilike(pattern),
                GroupMember.email.ilike(pattern),
                GroupMember.phone.ilike(pattern),
                GroupMember.company.ilike(pattern),
            )
        )
    total = q.count()
    items = q.order_by(GroupMember.full_name.asc()).offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def get_group_member(db: Session, member_id: str, tenant_id: str) -> GroupMember | None:
    return db.query(GroupMember).filter(
        GroupMember.id == _coerce_uuid(member_id), GroupMember.tenant_id == _coerce_uuid(tenant_id),
    ).first()


# ── CSV Import ──────────────────────────────────────────────────

REQUIRED_CSV_COLS = {"sender_name", "receiver_name"}
ALLOWED_CSV_COLS = {
    "tracking_number", "reference_number",
    "sender_name", "sender_phone", "sender_address",
    "receiver_name", "receiver_phone", "receiver_address",
    "origin_country", "origin_city", "destination_country", "destination_city",
    "shipped_date", "estimated_arrival",
    "weight_kg", "package_count", "cargo_type", "description",
    "total_cost", "amount_paid", "currency",
    "group_member_name", "notes",
}


def import_shipments_csv(
    db: Session,
    tenant_id: str,
    file_content: bytes,
    created_by: str | None = None,
) -> dict[str, Any]:
    tenant_uuid = _coerce_uuid(tenant_id)
    text = file_content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        return {"total_rows": 0, "created": 0, "updated": 0, "errors": [{"row": 0, "error": "Empty CSV"}]}

    headers = {h.strip().lower() for h in reader.fieldnames}
    missing = REQUIRED_CSV_COLS - headers
    if missing:
        return {"total_rows": 0, "created": 0, "updated": 0, "errors": [{"row": 0, "error": f"Missing columns: {missing}"}]}

    created, updated, errors = 0, 0, []
    member_cache: dict[str, str] = {}

    for i, raw_row in enumerate(reader, start=2):
        row = {k.strip().lower(): (v.strip() if v else "") for k, v in raw_row.items()}
        tracking = row.get("tracking_number", "").strip() or _generate_tracking_number(db, tenant_id)
        if not row.get("sender_name"):
            errors.append({"row": i, "error": "Missing sender_name"})
            continue
        if not row.get("receiver_name"):
            errors.append({"row": i, "error": "Missing receiver_name"})
            continue

        try:
            member_name = row.get("group_member_name", "").strip()
            member_id = None
            if member_name:
                if member_name in member_cache:
                    member_id = member_cache[member_name]
                else:
                    existing = db.query(GroupMember).filter(
                        GroupMember.tenant_id == tenant_uuid,
                        GroupMember.full_name == member_name,
                    ).first()
                    if existing:
                        member_id = str(existing.id)
                    else:
                        new_member = GroupMember(tenant_id=tenant_uuid, full_name=member_name)
                        db.add(new_member)
                        db.flush()
                        member_id = str(new_member.id)
                    member_cache[member_name] = member_id

            existing_shipment = db.query(Shipment).filter(
                Shipment.tenant_id == tenant_uuid,
                Shipment.tracking_number == tracking,
            ).first()

            total_cost = float(row.get("total_cost") or 0)
            amount_paid = float(row.get("amount_paid") or 0)
            balance, pay_status = _compute_payment(total_cost, amount_paid)

            def _parse_date(val: str) -> datetime | None:
                if not val:
                    return None
                for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%d/%m/%Y", "%m/%d/%Y"):
                    try:
                        return datetime.strptime(val, fmt)
                    except ValueError:
                        continue
                return None

            if existing_shipment:
                for col in ALLOWED_CSV_COLS - {"group_member_name"}:
                    val = row.get(col, "").strip()
                    if val and hasattr(existing_shipment, col):
                        if col in ("total_cost", "amount_paid", "weight_kg"):
                            setattr(existing_shipment, col, float(val))
                        elif col == "package_count":
                            setattr(existing_shipment, col, int(val))
                        elif col in ("shipped_date", "estimated_arrival"):
                            setattr(existing_shipment, col, _parse_date(val))
                        else:
                            setattr(existing_shipment, col, val)
                existing_shipment.balance_due = balance
                existing_shipment.payment_status = pay_status
                if member_id:
                    existing_shipment.group_member_id = member_id
                updated += 1
            else:
                shipment = Shipment(
                    tenant_id=tenant_uuid,
                    tracking_number=tracking,
                    reference_number=row.get("reference_number", "").strip() or None,
                    sender_name=row["sender_name"],
                    sender_phone=row.get("sender_phone", "").strip() or None,
                    sender_address=row.get("sender_address", "").strip() or None,
                    receiver_name=row["receiver_name"],
                    receiver_phone=row.get("receiver_phone", "").strip() or None,
                    receiver_address=row.get("receiver_address", "").strip() or None,
                    origin_country=row.get("origin_country", "").strip() or None,
                    origin_city=row.get("origin_city", "").strip() or None,
                    destination_country=row.get("destination_country", "").strip() or None,
                    destination_city=row.get("destination_city", "").strip() or None,
                    shipped_date=_parse_date(row.get("shipped_date", "")),
                    estimated_arrival=_parse_date(row.get("estimated_arrival", "")),
                    weight_kg=float(row["weight_kg"]) if row.get("weight_kg") else None,
                    package_count=int(row["package_count"]) if row.get("package_count") else None,
                    cargo_type=row.get("cargo_type", "").strip() or None,
                    description=row.get("description", "").strip() or None,
                    total_cost=total_cost,
                    amount_paid=amount_paid,
                    balance_due=balance,
                    currency=row.get("currency", "").strip() or "GHS",
                    payment_status=pay_status,
                    status=ShipmentStatus.DRAFT,
                    group_member_id=member_id,
                    notes=row.get("notes", "").strip() or None,
                    created_by=created_by,
                )
                db.add(shipment)
                created += 1

        except Exception as exc:
            errors.append({"row": i, "error": str(exc)[:300]})
            continue

    db.commit()
    total_rows = created + updated + len(errors)
    logger.info("CSV import for tenant %s: %d created, %d updated, %d errors", tenant_id, created, updated, len(errors))
    return {"total_rows": total_rows, "created": created, "updated": updated, "errors": errors}
