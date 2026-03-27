from __future__ import annotations

import csv
import io
import logging
from datetime import datetime
from typing import Any

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.shipment import (
    GroupMember,
    PaymentStatus,
    Shipment,
    ShipmentEvent,
    ShipmentStatus,
)
from app.models.tenant import Tenant
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


# ── Shipments ───────────────────────────────────────────────────

def create_shipment(db: Session, tenant_id: str, **kw: Any) -> Shipment:
    total = float(kw.get("total_cost", 0))
    paid = float(kw.get("amount_paid", 0))
    balance, pay_status = _compute_payment(total, paid)

    shipment = Shipment(
        tenant_id=tenant_id,
        tracking_number=kw["tracking_number"],
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
        group_member_id=kw.get("group_member_id"),
        notes=kw.get("notes"),
        created_by=kw.get("created_by"),
    )
    db.add(shipment)
    db.commit()
    db.refresh(shipment)
    add_shipment_event(db, str(shipment.id), "created", description="Shipment created")
    return shipment


def update_shipment(db: Session, shipment_id: str, tenant_id: str, **kw: Any) -> Shipment | None:
    shipment = db.query(Shipment).filter(
        Shipment.id == shipment_id, Shipment.tenant_id == tenant_id,
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
    return shipment


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
    q = db.query(Shipment).filter(Shipment.tenant_id == tenant_id)
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
        Shipment.id == shipment_id, Shipment.tenant_id == tenant_id,
    ).first()


def public_track_shipment(db: Session, tenant_id: str, tracking_number: str) -> Shipment | None:
    return db.query(Shipment).filter(
        Shipment.tenant_id == tenant_id,
        Shipment.tracking_number == tracking_number,
    ).first()


def add_shipment_event(
    db: Session,
    shipment_id: str,
    event_type: str,
    location: str | None = None,
    description: str | None = None,
    occurred_at: datetime | None = None,
) -> ShipmentEvent:
    event = ShipmentEvent(
        shipment_id=shipment_id,
        event_type=event_type,
        location=location,
        description=description,
        occurred_at=occurred_at or datetime.utcnow(),
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # Automate shipment status transitions based on event_type
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if shipment:
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
    
    return event


def get_shipment_events(db: Session, shipment_id: str) -> list[ShipmentEvent]:
    return db.query(ShipmentEvent).filter(
        ShipmentEvent.shipment_id == shipment_id,
    ).order_by(ShipmentEvent.occurred_at.asc()).all()


# ── Group Members ───────────────────────────────────────────────

def create_group_member(db: Session, tenant_id: str, **kw: Any) -> GroupMember:
    member = GroupMember(tenant_id=tenant_id, **kw)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


def update_group_member(db: Session, member_id: str, tenant_id: str, **kw: Any) -> GroupMember | None:
    member = db.query(GroupMember).filter(
        GroupMember.id == member_id, GroupMember.tenant_id == tenant_id,
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
    q = db.query(GroupMember).filter(GroupMember.tenant_id == tenant_id)
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
        GroupMember.id == member_id, GroupMember.tenant_id == tenant_id,
    ).first()


# ── CSV Import ──────────────────────────────────────────────────

REQUIRED_CSV_COLS = {"tracking_number", "sender_name", "receiver_name"}
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
        tracking = row.get("tracking_number", "").strip()
        if not tracking:
            errors.append({"row": i, "error": "Missing tracking_number"})
            continue
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
                        GroupMember.tenant_id == tenant_id,
                        GroupMember.full_name == member_name,
                    ).first()
                    if existing:
                        member_id = str(existing.id)
                    else:
                        new_member = GroupMember(tenant_id=tenant_id, full_name=member_name)
                        db.add(new_member)
                        db.flush()
                        member_id = str(new_member.id)
                    member_cache[member_name] = member_id

            existing_shipment = db.query(Shipment).filter(
                Shipment.tenant_id == tenant_id,
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
                    tenant_id=tenant_id,
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
