from __future__ import annotations
from app.core.config import settings
from uuid import UUID
from datetime import datetime, timedelta

from fastapi import UploadFile, File, Request, APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.billing.guards import is_tenant_read_only
from app.db.session import SessionLocal, get_db
from app.models.shipment import Shipment, ShipmentStatus
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.shipment import (
    CSVUploadResponse,
    GroupMemberCreate,
    GroupMemberResponse,
    GroupMemberUpdate,
    ShipmentCreate,
    ShipmentEventCreate,
    ShipmentEventResponse,
    ShipmentLocationUpdate,
    ShipmentPublicTrackResponse,
    ShipmentResponse,
    ShipmentSearchResult,
    TrackingPointIngestRequest,
    TrackingPointIngestResponse,
    TrackingPointResponse,
    ShipmentUpdate,
)
from app.services.shipment_service import (
    add_shipment_event,
    create_group_member,
    create_shipment,
    get_live_shipment_index,
    get_live_tracking_snapshot,
    get_latest_tracking_point,
    get_group_member,
    get_shipment,
    get_shipment_events,
    get_tracking_history,
    ingest_tracking_point,
    import_shipments_csv,
    merge_tracking_events,
    list_group_members,
    public_track_shipment,
    search_shipments,
    sync_shipment_to_live_runtime,
    update_shipment_location,
    update_group_member,
    update_shipment,
)
from app.services.tracking_realtime import tracking_realtime_hub
from app.middleware.rate_limit import rate_limit

router = APIRouter(prefix="/shipments", tags=["Shipments & Tracking"])

# ── Shipment Status Transition (explicit) ───────────────
@router.post("/{tenant_id}/{shipment_id}/transition", response_model=ShipmentResponse)
def transition_shipment_status_route(
    tenant_id: str,
    shipment_id: str,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_tenant_writable(tenant_id)
    shipment = get_shipment(db, shipment_id, tenant_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    try:
        shipment.status = ShipmentStatus(status)
        db.commit()
        db.refresh(shipment)
        sync_shipment_to_live_runtime(db, shipment)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    return _to_response(shipment)


# ── Shipment CRUD (tenant-scoped, auth required) ───────────────

@router.post("/{tenant_id}", response_model=ShipmentResponse)
def create_shipment_route(
    tenant_id: str,
    payload: ShipmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_tenant_writable(tenant_id)
    data = payload.model_dump()
    data["created_by"] = current_user.email
    shipment = create_shipment(db, tenant_id, **data)
    return _to_response(shipment)


@router.get("/{tenant_id}", response_model=dict)
def search_shipments_route(
    tenant_id: str,
    q: str | None = Query(None, description="Search by tracking number, name"),
    status: str | None = Query(None),
    payment_status: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = search_shipments(
        db, tenant_id, query=q, status=status, payment_status=payment_status,
        page=page, page_size=page_size,
    )
    live_index = get_live_shipment_index(
        db,
        tenant_id,
        tracking_numbers=[shipment.tracking_number for shipment in items],
        query=q,
        status=status,
        page=page,
        page_size=page_size,
    )
    pages = max(1, (total + page_size - 1) // page_size)
    return {
        "items": [
            _to_search_result(s, live_index.get(s.tracking_number)).model_dump()
            for s in items
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }


@router.get("/{tenant_id}/summary", response_model=dict)
def shipment_dashboard_summary_route(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shipments = db.query(Shipment).filter(Shipment.tenant_id == tenant_id).all()

    in_transit_statuses = {
        ShipmentStatus.BOOKED,
        ShipmentStatus.PICKED_UP,
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.AT_CUSTOMS,
        ShipmentStatus.CUSTOMS_CLEARED,
        ShipmentStatus.OUT_FOR_DELIVERY,
    }

    active_shipments = sum(
        1
        for s in shipments
        if s.status not in {ShipmentStatus.DELIVERED, ShipmentStatus.CANCELLED, ShipmentStatus.RETURNED}
    )
    in_transit = sum(1 for s in shipments if s.status in in_transit_statuses)
    delivered = sum(1 for s in shipments if s.status == ShipmentStatus.DELIVERED)
    revenue = float(sum(float(s.amount_paid or 0) for s in shipments))

    recent_shipments = sorted(
        shipments,
        key=lambda s: s.updated_at or s.created_at,
        reverse=True,
    )[:5]
    recent_activity = [
        {
            "tracking_number": s.tracking_number,
            "status": s.status.value,
            "route": f"{s.origin_city or '-'} to {s.destination_city or '-'}",
            "updated_at": (s.updated_at or s.created_at).isoformat() if (s.updated_at or s.created_at) else None,
        }
        for s in recent_shipments
    ]

    now = datetime.utcnow()
    month_labels: list[str] = []
    month_counts: list[int] = []
    month_delivered: list[int] = []
    for offset in range(5, -1, -1):
        target = now - timedelta(days=offset * 30)
        label = target.strftime("%b")
        month_labels.append(label)
        month_counts.append(
            sum(
                1
                for s in shipments
                if s.created_at and s.created_at.month == target.month and s.created_at.year == target.year
            )
        )
        month_delivered.append(
            sum(
                1
                for s in shipments
                if s.status == ShipmentStatus.DELIVERED
                and s.updated_at
                and s.updated_at.month == target.month
                and s.updated_at.year == target.year
            )
        )

    return {
        "active_shipments": active_shipments,
        "in_transit": in_transit,
        "delivered": delivered,
        "revenue": revenue,
        "recent_activity": recent_activity,
        "chart": {
            "labels": month_labels,
            "active_shipments": month_counts,
            "delivered": month_delivered,
        },
    }


@router.get("/{tenant_id}/{shipment_id}", response_model=ShipmentResponse)
def get_shipment_route(
    tenant_id: str,
    shipment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shipment = get_shipment(db, shipment_id, tenant_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    live_snapshot = get_live_tracking_snapshot(db, shipment)
    return _to_response(shipment, live_snapshot)


@router.patch("/{tenant_id}/{shipment_id}", response_model=ShipmentResponse)
def update_shipment_route(
    tenant_id: str,
    shipment_id: str,
    payload: ShipmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_tenant_writable(tenant_id)
    shipment = update_shipment(db, shipment_id, tenant_id, **payload.model_dump(exclude_unset=True))
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return _to_response(shipment)


# ── Shipment Events (timeline) ─────────────────────────────────

@router.post("/{tenant_id}/{shipment_id}/events", response_model=ShipmentEventResponse)
def add_event_route(
    tenant_id: str,
    shipment_id: str,
    payload: ShipmentEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_tenant_writable(tenant_id)
    shipment = get_shipment(db, shipment_id, tenant_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    event = add_shipment_event(
        db, shipment_id,
        event_type=payload.event_type,
        location=payload.location,
        latitude=payload.latitude,
        longitude=payload.longitude,
        description=payload.description,
        occurred_at=payload.occurred_at,
    )
    return ShipmentEventResponse(
        id=str(event.id),
        event_type=event.event_type,
        location=event.location,
        latitude=float(event.latitude) if event.latitude is not None else None,
        longitude=float(event.longitude) if event.longitude is not None else None,
        description=event.description,
        occurred_at=event.occurred_at,
        created_at=event.created_at,
    )


@router.post("/{tenant_id}/{shipment_id}/location", response_model=ShipmentResponse)
def update_location_route(
    tenant_id: str,
    shipment_id: str,
    payload: ShipmentLocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_tenant_writable(tenant_id)
    shipment = update_shipment_location(
        db,
        shipment_id,
        tenant_id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        location=payload.location,
        occurred_at=payload.occurred_at,
        provider=payload.provider,
        event_type=payload.event_type,
        description=payload.description,
        status=payload.status,
    )
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return _to_response(shipment)


@router.post("/{tenant_id}/{shipment_id}/tracking/point", response_model=TrackingPointIngestResponse)
def ingest_tracking_point_route(
    tenant_id: str,
    shipment_id: str,
    payload: TrackingPointIngestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_tenant_writable(tenant_id)
    accepted, reason, point = ingest_tracking_point(
        db,
        shipment_id,
        tenant_id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        captured_at=payload.captured_at,
        speed_kph=payload.speed_kph,
        heading=payload.heading,
        accuracy_m=payload.accuracy_m,
        source=payload.source,
    )
    if accepted and point:
        import asyncio

        try:
            loop = asyncio.get_running_loop()
            loop.create_task(
                tracking_realtime_hub.publish(
                    tenant_id,
                    shipment_id,
                    {
                        "type": "tracking.latest",
                        "shipment_id": shipment_id,
                        "tenant_id": tenant_id,
                        "latitude": float(point.latitude),
                        "longitude": float(point.longitude),
                        "captured_at": point.captured_at,
                        "source": point.source,
                    },
                )
            )
        except RuntimeError:
            pass
        return TrackingPointIngestResponse(accepted=True, point=_tracking_point_to_response(point))
    return TrackingPointIngestResponse(accepted=False, reason=reason)


@router.get("/{tenant_id}/{shipment_id}/tracking/latest", response_model=TrackingPointResponse | None)
def latest_tracking_point_route(
    tenant_id: str,
    shipment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shipment = get_shipment(db, shipment_id, tenant_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    point = get_latest_tracking_point(db, shipment_id, tenant_id)
    return _tracking_point_to_response(point) if point else None


@router.get("/{tenant_id}/{shipment_id}/tracking/history", response_model=list[TrackingPointResponse])
def tracking_history_route(
    tenant_id: str,
    shipment_id: str,
    from_ts: datetime | None = Query(None, alias="from"),
    to_ts: datetime | None = Query(None, alias="to"),
    limit: int = Query(500, ge=1, le=2000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shipment = get_shipment(db, shipment_id, tenant_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    points = get_tracking_history(
        db,
        shipment_id,
        tenant_id,
        from_ts=from_ts,
        to_ts=to_ts,
        limit=limit,
    )
    return [_tracking_point_to_response(p) for p in points]


@router.websocket("/{tenant_id}/{shipment_id}/tracking/ws")
async def tracking_ws_route(websocket: WebSocket, tenant_id: str, shipment_id: str):
    db = SessionLocal()
    try:
        resolved_tenant_id = _resolve_public_tenant_id(db, tenant_id)
        if not resolved_tenant_id:
            await websocket.close(code=1008, reason="Tenant not found")
            return

        user = _authenticate_websocket_user(db, websocket, resolved_tenant_id)
        if not user:
            await websocket.close(code=1008, reason="Unauthorized")
            return
    finally:
        db.close()

    topic = await tracking_realtime_hub.connect(tenant_id, shipment_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await tracking_realtime_hub.disconnect(topic, websocket)


@router.get("/{tenant_id}/{shipment_id}/events", response_model=list[ShipmentEventResponse])
def get_events_route(
    tenant_id: str,
    shipment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shipment = get_shipment(db, shipment_id, tenant_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    events = merge_tracking_events(
        get_shipment_events(db, shipment_id),
        get_live_tracking_snapshot(db, shipment),
    )
    return [
        ShipmentEventResponse(
            id=str(e["id"]), event_type=e["event_type"], location=e.get("location"),
            latitude=e.get("latitude"), longitude=e.get("longitude"),
            description=e.get("description"), occurred_at=e["occurred_at"], created_at=e["created_at"],
        )
        for e in events
    ]


# ── Public Tracking (no auth — customer facing) ────────────────

@router.get("/public/track/{tenant_id}/{tracking_number}", response_model=ShipmentPublicTrackResponse)
@rate_limit(category="public", rule="track")
def public_track_route(
    request: Request,
    tenant_id: str,
    tracking_number: str,
    db: Session = Depends(get_db),
):
    resolved_tenant_id = _resolve_public_tenant_id(db, tenant_id)
    if not resolved_tenant_id:
        # Keep public behavior opaque: unknown tenant should look like missing shipment.
        raise HTTPException(status_code=404, detail="Shipment not found")

    shipment = public_track_shipment(db, resolved_tenant_id, tracking_number)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    live_snapshot = get_live_tracking_snapshot(db, shipment)
    events = merge_tracking_events(get_shipment_events(db, str(shipment.id)), live_snapshot)
    return ShipmentPublicTrackResponse(
        tracking_number=_live_value(live_snapshot, "tracking_number", shipment.tracking_number),
        status=_live_value(live_snapshot, "status", shipment.status.value),
        sender_name=_live_value(live_snapshot, "sender_name", shipment.sender_name),
        receiver_name=_live_value(live_snapshot, "receiver_name", shipment.receiver_name),
        origin_country=_live_value(live_snapshot, "origin_country", shipment.origin_country),
        origin_city=_live_value(live_snapshot, "origin_city", shipment.origin_city),
        destination_country=_live_value(live_snapshot, "destination_country", shipment.destination_country),
        destination_city=_live_value(live_snapshot, "destination_city", shipment.destination_city),
        current_location=_live_value(live_snapshot, "current_location", shipment.current_location),
        current_latitude=_live_value(live_snapshot, "current_latitude", float(shipment.current_latitude) if shipment.current_latitude is not None else None),
        current_longitude=_live_value(live_snapshot, "current_longitude", float(shipment.current_longitude) if shipment.current_longitude is not None else None),
        last_location_at=_live_value(live_snapshot, "last_location_at", shipment.last_location_at),
        live_tracking_provider=_live_value(live_snapshot, "live_tracking_provider", shipment.live_tracking_provider),
        shipped_date=_live_value(live_snapshot, "shipped_date", shipment.shipped_date),
        estimated_arrival=_live_value(live_snapshot, "estimated_arrival", shipment.estimated_arrival),
        payment_status=shipment.payment_status.value,
        total_cost=float(shipment.total_cost),
        amount_paid=float(shipment.amount_paid),
        balance_due=float(shipment.balance_due),
        currency=shipment.currency,
        events=[
            ShipmentEventResponse(
                id=str(e["id"]), event_type=e["event_type"], location=e.get("location"),
                latitude=e.get("latitude"), longitude=e.get("longitude"),
                description=e.get("description"), occurred_at=e["occurred_at"], created_at=e["created_at"],
            )
            for e in events
        ],
    )


# ── CSV Import ──────────────────────────────────────────────────

@rate_limit(category="auth", rule="upload")
@router.post("/{tenant_id}/import/csv", response_model=None)
def import_csv_route(
    request: Request,
    tenant_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_tenant_writable(tenant_id)
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted")
    content = file.file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
    result = import_shipments_csv(db, tenant_id, content, created_by=current_user.email)
    return CSVUploadResponse(**result)


# ── Group Members ───────────────────────────────────────────────

@router.post("/{tenant_id}/members", response_model=GroupMemberResponse)
def create_member_route(
    tenant_id: str,
    payload: GroupMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_tenant_writable(tenant_id)
    member = create_group_member(db, tenant_id, **payload.model_dump())
    return _member_to_response(db, member)


@router.get("/{tenant_id}/members", response_model=dict)
def list_members_route(
    tenant_id: str,
    q: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = list_group_members(db, tenant_id, query=q, page=page, page_size=page_size)
    pages = max(1, (total + page_size - 1) // page_size)
    return {
        "items": [_member_to_response(db, m).model_dump() for m in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }


@router.get("/{tenant_id}/members/{member_id}", response_model=GroupMemberResponse)
def get_member_route(
    tenant_id: str,
    member_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member = get_group_member(db, member_id, tenant_id)
    if not member:
        raise HTTPException(status_code=404, detail="Group member not found")
    return _member_to_response(db, member)


@router.patch("/{tenant_id}/members/{member_id}", response_model=GroupMemberResponse)
def update_member_route(
    tenant_id: str,
    member_id: str,
    payload: GroupMemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_tenant_writable(tenant_id)
    member = update_group_member(db, member_id, tenant_id, **payload.model_dump(exclude_unset=True))
    if not member:
        raise HTTPException(status_code=404, detail="Group member not found")
    return _member_to_response(db, member)


# ── Helpers ─────────────────────────────────────────────────────

def _live_value(live_snapshot: dict | None, key: str, fallback):
    if not live_snapshot:
        return fallback
    value = live_snapshot.get(key)
    return fallback if value in (None, "") else value

def _to_response(s, live_snapshot: dict | None = None) -> ShipmentResponse:
    return ShipmentResponse(
        id=str(s.id),
        tenant_id=str(s.tenant_id),
        tracking_number=_live_value(live_snapshot, "tracking_number", s.tracking_number),
        reference_number=_live_value(live_snapshot, "reference_number", s.reference_number),
        sender_name=_live_value(live_snapshot, "sender_name", s.sender_name),
        sender_phone=_live_value(live_snapshot, "sender_phone", s.sender_phone),
        receiver_name=_live_value(live_snapshot, "receiver_name", s.receiver_name),
        receiver_phone=_live_value(live_snapshot, "receiver_phone", s.receiver_phone),
        origin_country=_live_value(live_snapshot, "origin_country", s.origin_country),
        origin_city=_live_value(live_snapshot, "origin_city", s.origin_city),
        destination_country=_live_value(live_snapshot, "destination_country", s.destination_country),
        destination_city=_live_value(live_snapshot, "destination_city", s.destination_city),
        current_location=_live_value(live_snapshot, "current_location", s.current_location),
        current_latitude=_live_value(live_snapshot, "current_latitude", float(s.current_latitude) if s.current_latitude is not None else None),
        current_longitude=_live_value(live_snapshot, "current_longitude", float(s.current_longitude) if s.current_longitude is not None else None),
        last_location_at=_live_value(live_snapshot, "last_location_at", s.last_location_at),
        live_tracking_provider=_live_value(live_snapshot, "live_tracking_provider", s.live_tracking_provider),
        shipped_date=_live_value(live_snapshot, "shipped_date", s.shipped_date),
        estimated_arrival=_live_value(live_snapshot, "estimated_arrival", s.estimated_arrival),
        actual_arrival=_live_value(live_snapshot, "actual_arrival", s.actual_arrival),
        weight_kg=_live_value(live_snapshot, "weight_kg", float(s.weight_kg) if s.weight_kg else None),
        package_count=_live_value(live_snapshot, "package_count", s.package_count),
        cargo_type=_live_value(live_snapshot, "cargo_type", s.cargo_type),
        total_cost=float(s.total_cost),
        amount_paid=float(s.amount_paid),
        balance_due=float(s.balance_due),
        currency=s.currency,
        payment_status=s.payment_status.value,
        status=_live_value(live_snapshot, "status", s.status.value),
        group_member_id=str(s.group_member_id) if s.group_member_id else None,
        group_member_name=s.group_member.full_name if s.group_member else None,
        notes=s.notes,
        created_at=s.created_at,
        updated_at=s.updated_at,
    )


def _tracking_point_to_response(point) -> TrackingPointResponse:
    return TrackingPointResponse(
        id=str(point.id),
        shipment_id=str(point.shipment_id),
        tenant_id=str(point.tenant_id),
        latitude=float(point.latitude),
        longitude=float(point.longitude),
        speed_kph=float(point.speed_kph) if point.speed_kph is not None else None,
        heading=float(point.heading) if point.heading is not None else None,
        accuracy_m=float(point.accuracy_m) if point.accuracy_m is not None else None,
        source=point.source,
        captured_at=point.captured_at,
        received_at=point.received_at,
    )


def _to_search_result(s, live_snapshot: dict | None = None) -> ShipmentSearchResult:
    return ShipmentSearchResult(
        id=str(s.id),
        tracking_number=_live_value(live_snapshot, "tracking_number", s.tracking_number),
        receiver_name=_live_value(live_snapshot, "receiver_name", s.receiver_name),
        sender_name=_live_value(live_snapshot, "sender_name", s.sender_name),
        status=_live_value(live_snapshot, "status", s.status.value),
        payment_status=s.payment_status.value,
        shipped_date=_live_value(live_snapshot, "shipped_date", s.shipped_date),
        estimated_arrival=_live_value(live_snapshot, "estimated_arrival", s.estimated_arrival),
        total_cost=float(s.total_cost),
        balance_due=float(s.balance_due),
        currency=s.currency,
    )


def _member_to_response(db: Session, m) -> GroupMemberResponse:
    count = db.query(Shipment).filter(Shipment.group_member_id == m.id).count()
    return GroupMemberResponse(
        id=str(m.id),
        tenant_id=str(m.tenant_id),
        full_name=m.full_name,
        phone=m.phone,
        email=m.email,
        id_number=m.id_number,
        company=m.company,
        notes=m.notes,
        preferred_language=m.preferred_language,
        is_active=m.is_active,
        shipment_count=count,
        created_at=m.created_at,
    )


def _ensure_tenant_writable(tenant_id: str) -> None:
    read_only, reason = is_tenant_read_only(tenant_id)
    if read_only:
        raise HTTPException(status_code=402, detail=reason or "Tenant is in read-only mode")


def _resolve_public_tenant_id(db: Session, tenant_identifier: str) -> str | None:
    try:
        return str(UUID(str(tenant_identifier)))
    except (ValueError, TypeError):
        tenant = db.query(Tenant).filter(
            (Tenant.slug == tenant_identifier) | (Tenant.subdomain == tenant_identifier)
        ).first()
        return str(tenant.id) if tenant else None


def _authenticate_websocket_user(db: Session, websocket: WebSocket, tenant_id: str) -> User | None:
    auth_header = websocket.headers.get("authorization", "")
    token = websocket.query_params.get("token")

    if not token and auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    if not token:
        return None

    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        subject = payload.get("sub")
        if not subject:
            return None
        user_id = UUID(str(subject))
    except (JWTError, ValueError, TypeError):
        return None

    user = db.get(User, user_id)
    if not user or not user.is_active:
        return None

    if user.is_superuser:
        return user

    if not user.tenant_id or str(user.tenant_id) != str(tenant_id):
        return None

    return user
