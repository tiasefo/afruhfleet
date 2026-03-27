
from __future__ import annotations
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.shipment import Shipment, ShipmentStatus
from app.models.user import User
from app.schemas.shipment import (
    CSVUploadResponse,
    GroupMemberCreate,
    GroupMemberResponse,
    GroupMemberUpdate,
    ShipmentCreate,
    ShipmentEventCreate,
    ShipmentEventResponse,
    ShipmentPublicTrackResponse,
    ShipmentResponse,
    ShipmentSearchResult,
    ShipmentUpdate,
)
from app.services.shipment_service import (
    add_shipment_event,
    create_group_member,
    create_shipment,
    get_group_member,
    get_shipment,
    get_shipment_events,
    import_shipments_csv,
    list_group_members,
    public_track_shipment,
    search_shipments,
    update_group_member,
    update_shipment,
)
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
    shipment = get_shipment(db, shipment_id, tenant_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    try:
        shipment.status = ShipmentStatus(status)
        db.commit()
        db.refresh(shipment)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    return _to_response(shipment)

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.shipment import Shipment
from app.models.user import User
from app.schemas.shipment import (
    CSVUploadResponse,
    GroupMemberCreate,
    GroupMemberResponse,
    GroupMemberUpdate,
    ShipmentCreate,
    ShipmentEventCreate,
    ShipmentEventResponse,
    ShipmentPublicTrackResponse,
    ShipmentResponse,
    ShipmentSearchResult,
    ShipmentUpdate,
)
from app.services.shipment_service import (
    add_shipment_event,
    create_group_member,
    create_shipment,
    get_group_member,
    get_shipment,
    get_shipment_events,
    import_shipments_csv,
    list_group_members,
    public_track_shipment,
    search_shipments,
    update_group_member,
    update_shipment,
)
from app.middleware.rate_limit import rate_limit

router = APIRouter(prefix="/shipments", tags=["Shipments & Tracking"])


# ── Shipment CRUD (tenant-scoped, auth required) ───────────────

@router.post("/{tenant_id}", response_model=ShipmentResponse)
def create_shipment_route(
    tenant_id: str,
    payload: ShipmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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
    pages = max(1, (total + page_size - 1) // page_size)
    return {
        "items": [
            ShipmentSearchResult(
                id=str(s.id),
                tracking_number=s.tracking_number,
                receiver_name=s.receiver_name,
                sender_name=s.sender_name,
                status=s.status.value,
                payment_status=s.payment_status.value,
                shipped_date=s.shipped_date,
                estimated_arrival=s.estimated_arrival,
                total_cost=float(s.total_cost),
                balance_due=float(s.balance_due),
                currency=s.currency,
            ).model_dump()
            for s in items
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
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
    return _to_response(shipment)


@router.patch("/{tenant_id}/{shipment_id}", response_model=ShipmentResponse)
def update_shipment_route(
    tenant_id: str,
    shipment_id: str,
    payload: ShipmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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
    shipment = get_shipment(db, shipment_id, tenant_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    event = add_shipment_event(
        db, shipment_id,
        event_type=payload.event_type,
        location=payload.location,
        description=payload.description,
        occurred_at=payload.occurred_at,
    )
    return ShipmentEventResponse(
        id=str(event.id),
        event_type=event.event_type,
        location=event.location,
        description=event.description,
        occurred_at=event.occurred_at,
        created_at=event.created_at,
    )


@router.get("/{tenant_id}/{shipment_id}/events", response_model=list[ShipmentEventResponse])
def get_events_route(
    tenant_id: str,
    shipment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    events = get_shipment_events(db, shipment_id)
    return [
        ShipmentEventResponse(
            id=str(e.id), event_type=e.event_type, location=e.location,
            description=e.description, occurred_at=e.occurred_at, created_at=e.created_at,
        )
        for e in events
    ]


# ── Public Tracking (no auth — customer facing) ────────────────

@router.get("/public/track/{tenant_id}/{tracking_number}", response_model=ShipmentPublicTrackResponse)
@rate_limit(category="public", rule="track")
def public_track_route(
    request,
    tenant_id: str,
    tracking_number: str,
    db: Session = Depends(get_db),
):
    shipment = public_track_shipment(db, tenant_id, tracking_number)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    events = get_shipment_events(db, str(shipment.id))
    return ShipmentPublicTrackResponse(
        tracking_number=shipment.tracking_number,
        status=shipment.status.value,
        sender_name=shipment.sender_name,
        receiver_name=shipment.receiver_name,
        origin_country=shipment.origin_country,
        origin_city=shipment.origin_city,
        destination_country=shipment.destination_country,
        destination_city=shipment.destination_city,
        shipped_date=shipment.shipped_date,
        estimated_arrival=shipment.estimated_arrival,
        payment_status=shipment.payment_status.value,
        total_cost=float(shipment.total_cost),
        amount_paid=float(shipment.amount_paid),
        balance_due=float(shipment.balance_due),
        currency=shipment.currency,
        events=[
            ShipmentEventResponse(
                id=str(e.id), event_type=e.event_type, location=e.location,
                description=e.description, occurred_at=e.occurred_at, created_at=e.created_at,
            )
            for e in events
        ],
    )


# ── CSV Import ──────────────────────────────────────────────────

@router.post("/{tenant_id}/import/csv", response_model=None)
@rate_limit(category="auth", rule="upload")
def import_csv_route(
    request,
    tenant_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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
    member = update_group_member(db, member_id, tenant_id, **payload.model_dump(exclude_unset=True))
    if not member:
        raise HTTPException(status_code=404, detail="Group member not found")
    return _member_to_response(db, member)


# ── Helpers ─────────────────────────────────────────────────────

def _to_response(s) -> ShipmentResponse:
    return ShipmentResponse(
        id=str(s.id),
        tenant_id=str(s.tenant_id),
        tracking_number=s.tracking_number,
        reference_number=s.reference_number,
        sender_name=s.sender_name,
        sender_phone=s.sender_phone,
        receiver_name=s.receiver_name,
        receiver_phone=s.receiver_phone,
        origin_country=s.origin_country,
        origin_city=s.origin_city,
        destination_country=s.destination_country,
        destination_city=s.destination_city,
        shipped_date=s.shipped_date,
        estimated_arrival=s.estimated_arrival,
        actual_arrival=s.actual_arrival,
        weight_kg=float(s.weight_kg) if s.weight_kg else None,
        package_count=s.package_count,
        cargo_type=s.cargo_type,
        total_cost=float(s.total_cost),
        amount_paid=float(s.amount_paid),
        balance_due=float(s.balance_due),
        currency=s.currency,
        payment_status=s.payment_status.value,
        status=s.status.value,
        group_member_id=str(s.group_member_id) if s.group_member_id else None,
        group_member_name=s.group_member.full_name if s.group_member else None,
        notes=s.notes,
        created_at=s.created_at,
        updated_at=s.updated_at,
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
        preferred_language=m.preferred_language,
        is_active=m.is_active,
        shipment_count=count,
        created_at=m.created_at,
    )
