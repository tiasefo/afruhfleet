from __future__ import annotations

from datetime import datetime, timedelta

from app.models.shipment import Shipment, ShipmentStatus
from app.models.tenant import DomainType, LaunchStatus, Tenant
from app.models.vendor import BusinessType, DeliveryVendor, DriverAvailability, IDType, VendorStatus
from app.services.shipment_service import create_shipment, get_live_shipment_index, get_live_tracking_snapshot, get_shipment_events, import_shipments_csv, sync_shipment_to_live_runtime
from app.services.vendor_service import auto_dispatch_booking, create_booking, reassign_expired_booking_offers, update_booking


def _create_tenant(db_session, suffix: str, *, live_api_url: str | None = None) -> Tenant:
    tenant = Tenant(
        company_name=f"Dispatch {suffix}",
        slug=f"dispatch-{suffix}",
        contact_email=f"dispatch-{suffix}@example.com",
        plan_code="professional",
        requested_domain=f"dispatch-{suffix}.afruheritage.com",
        domain_type=DomainType.provider_subdomain,
        launch_status=LaunchStatus.active,
        live_api_url=live_api_url,
    )
    db_session.add(tenant)
    db_session.commit()
    db_session.refresh(tenant)
    return tenant


def _create_approved_vendor(db_session, suffix: str) -> DeliveryVendor:
    vendor = DeliveryVendor(
        full_name=f"Driver {suffix}",
        email=f"driver-{suffix}@example.com",
        phone="+233200000000",
        id_type=IDType.GHANA_CARD,
        id_number=f"GHA-{suffix}",
        business_name=f"Dispatch {suffix}",
        business_type=BusinessType.INDIVIDUAL,
        operating_regions="Accra,Tema",
        status=VendorStatus.APPROVED,
        terms_accepted=True,
        insurance_accepted=True,
        background_check_accepted=True,
    )
    db_session.add(vendor)
    db_session.commit()
    db_session.refresh(vendor)
    return vendor


def _set_vendor_available(vendor: DeliveryVendor, db_session) -> None:
    vendor.availability_status = DriverAvailability.AVAILABLE
    vendor.availability_updated_at = datetime.utcnow()
    vendor.last_known_latitude = 5.6037
    vendor.last_known_longitude = -0.1870
    vendor.last_seen_at = datetime.utcnow()
    db_session.add(vendor)
    db_session.commit()


def test_live_tracking_snapshot_merges_shipment_and_tracking_payloads(db_session, monkeypatch):
    tenant = _create_tenant(db_session, "overlay", live_api_url="https://tenant-runtime.example.com/api")
    shipment = create_shipment(
        db_session,
        tenant.id,
        tracking_number="TRK-001",
        sender_name="Local Sender",
        receiver_name="Local Receiver",
        origin_country="GH",
        origin_city="Accra",
        destination_country="NG",
        destination_city="Lagos",
        total_cost=100,
        amount_paid=20,
    )

    def _fake_proxy(api_url, endpoint, token=None, auth_scheme=None, params=None, suppress_errors=False):
        if endpoint == "tracking":
            return {
                "data": {
                    "tracking_number": "TRK-001",
                    "status": "in_transit",
                    "current_location": "Tema Port",
                    "current_latitude": 5.6698,
                    "current_longitude": -0.0166,
                    "events": [
                        {
                            "id": "evt-1",
                            "event_type": "in_transit",
                            "location": "Tema Port",
                            "latitude": 5.6698,
                            "longitude": -0.0166,
                            "occurred_at": "2026-05-21T10:00:00Z",
                        }
                    ],
                }
            }
        if endpoint == "shipments":
            return {
                "data": {
                    "tracking_number": "TRK-001",
                    "sender_name": "Fleetbase Sender",
                    "receiver_name": "Fleetbase Receiver",
                    "destination_city": "Abuja",
                    "estimated_arrival": "2026-05-25T15:30:00Z",
                }
            }
        return None

    monkeypatch.setattr("app.services.shipment_service.proxy_fleetbase_api", _fake_proxy)

    live_snapshot = get_live_tracking_snapshot(db_session, shipment)

    assert live_snapshot is not None
    assert live_snapshot["tracking_number"] == "TRK-001"
    assert live_snapshot["status"] == "in_transit"
    assert live_snapshot["current_location"] == "Tema Port"
    assert live_snapshot["sender_name"] == "Fleetbase Sender"
    assert live_snapshot["receiver_name"] == "Fleetbase Receiver"
    assert live_snapshot["destination_city"] == "Abuja"
    assert live_snapshot["estimated_arrival"] == datetime.fromisoformat("2026-05-25T15:30:00+00:00")
    assert len(live_snapshot["events"]) == 1


def test_live_shipment_index_filters_runtime_records_to_local_tracking_numbers(db_session, monkeypatch):
    tenant = _create_tenant(db_session, "list-overlay", live_api_url="https://tenant-runtime.example.com/api")
    first = create_shipment(
        db_session,
        tenant.id,
        tracking_number="TRK-LIST-001",
        sender_name="Local Sender 1",
        receiver_name="Local Receiver 1",
        origin_country="GH",
        origin_city="Accra",
        destination_country="GH",
        destination_city="Tema",
        total_cost=100,
        amount_paid=10,
    )
    second = create_shipment(
        db_session,
        tenant.id,
        tracking_number="TRK-LIST-002",
        sender_name="Local Sender 2",
        receiver_name="Local Receiver 2",
        origin_country="GH",
        origin_city="Accra",
        destination_country="GH",
        destination_city="Kumasi",
        total_cost=200,
        amount_paid=50,
    )

    def _fake_proxy(api_url, endpoint, token=None, auth_scheme=None, params=None, suppress_errors=False):
        assert endpoint == "shipments"
        return {
            "data": [
                {
                    "tracking_number": "TRK-LIST-001",
                    "sender_name": "Fleetbase Sender 1",
                    "receiver_name": "Fleetbase Receiver 1",
                    "status": "in_transit",
                    "estimated_arrival": "2026-05-30T12:00:00Z",
                },
                {
                    "tracking_number": "TRK-OTHER-999",
                    "sender_name": "Other Sender",
                    "receiver_name": "Other Receiver",
                    "status": "delivered",
                },
            ]
        }

    monkeypatch.setattr("app.services.shipment_service.proxy_fleetbase_api", _fake_proxy)

    live_index = get_live_shipment_index(
        db_session,
        str(tenant.id),
        tracking_numbers=[first.tracking_number, second.tracking_number],
        page=1,
        page_size=20,
    )

    assert set(live_index.keys()) == {"TRK-LIST-001"}
    assert live_index["TRK-LIST-001"]["sender_name"] == "Fleetbase Sender 1"
    assert live_index["TRK-LIST-001"]["status"] == "in_transit"


def test_sync_shipment_to_live_runtime_uses_create_then_update_endpoints(db_session, monkeypatch):
    tenant = _create_tenant(db_session, "runtime-write", live_api_url="https://tenant-runtime.example.com/api")
    tenant.live_api_token = "tenant-token"
    tenant.live_api_auth_scheme = "bearer"
    db_session.add(tenant)
    db_session.commit()
    db_session.refresh(tenant)
    shipment = create_shipment(
        db_session,
        tenant.id,
        tracking_number="TRK-WRITE-001",
        sender_name="Local Sender",
        receiver_name="Local Receiver",
        origin_country="GH",
        origin_city="Accra",
        destination_country="GH",
        destination_city="Tema",
        total_cost=120,
        amount_paid=20,
    )

    calls: list[tuple[str, str, dict | None]] = []

    def _fake_request(api_url, method, endpoint, token=None, auth_scheme=None, params=None, json_body=None, suppress_errors=False):
        calls.append((method, endpoint, json_body))
        assert token == "tenant-token"
        assert auth_scheme == "bearer"
        if method == "POST" and endpoint == "shipments":
            return {"id": "remote-1"}
        return None

    monkeypatch.setattr("app.services.shipment_service.request_fleetbase_api", _fake_request)

    synced = sync_shipment_to_live_runtime(db_session, shipment, operation="create")

    assert synced is True
    assert calls[0][0] == "POST"
    assert calls[0][1] == "shipments"
    assert calls[0][2]["tracking_number"] == "TRK-WRITE-001"


def test_vendor_booking_updates_drive_linked_shipment_tracking(db_session):
    tenant = _create_tenant(db_session, "vendor-sync")
    shipment = create_shipment(
        db_session,
        tenant.id,
        tracking_number="TRK-BOOKING-1",
        sender_name="Warehouse",
        receiver_name="Customer",
        origin_country="GH",
        origin_city="Accra",
        destination_country="GH",
        destination_city="Kumasi",
        total_cost=180,
        amount_paid=50,
    )
    vendor = _create_approved_vendor(db_session, "vendor-sync")
    booking = create_booking(
        db_session,
        tenant.id,
        vendor.id,
        shipment_id=shipment.id,
        pickup_address="Warehouse Road",
        delivery_address="Customer Street",
        vehicle_type_requested="truck",
        notes="Handle with care",
        booked_by="ops@example.com",
    )

    accepted = update_booking(
        db_session,
        booking.id,
        status="accepted",
        driver_name="Kofi Driver",
        driver_phone="+233244000000",
    )
    in_progress = update_booking(
        db_session,
        booking.id,
        status="in_progress",
        current_location="Nsawam Junction",
        current_latitude=5.8081,
        current_longitude=-0.3518,
        live_tracking_provider="vendor_marketplace",
    )

    db_session.refresh(shipment)
    events = get_shipment_events(db_session, shipment.id)
    event_types = [event.event_type for event in events]

    assert accepted is not None
    assert accepted.accepted_at is not None
    assert in_progress is not None
    assert in_progress.started_at is not None
    assert shipment.status == ShipmentStatus.OUT_FOR_DELIVERY
    assert float(shipment.current_latitude) == 5.8081
    assert float(shipment.current_longitude) == -0.3518
    assert shipment.current_location == "Nsawam Junction"
    assert shipment.live_tracking_provider == "vendor_marketplace"
    assert "vendor_assigned" in event_types
    assert ShipmentStatus.OUT_FOR_DELIVERY.value in event_types


def test_create_shipment_auto_generates_tracking_number_when_blank(db_session):
    tenant = _create_tenant(db_session, "auto-tracking")

    shipment = create_shipment(
        db_session,
        tenant.id,
        tracking_number="",
        sender_name="Warehouse",
        receiver_name="Customer",
        origin_country="GH",
        origin_city="Accra",
        destination_country="GH",
        destination_city="Tema",
        total_cost=95,
        amount_paid=0,
    )

    assert shipment.tracking_number.startswith("AFR-")
    assert len(shipment.tracking_number) > 12


def test_import_shipments_csv_auto_generates_tracking_number_when_column_blank(db_session):
    tenant = _create_tenant(db_session, "csv-auto-tracking")
    csv_content = (
        b"tracking_number,sender_name,receiver_name,origin_country,origin_city,"
        b"destination_country,destination_city,total_cost\n"
        b",Warehouse,Customer,GH,Accra,GH,Tema,50\n"
    )

    result = import_shipments_csv(db_session, str(tenant.id), csv_content, created_by="ops@example.com")

    assert result["created"] == 1
    assert not result["errors"]

    shipment = db_session.query(Shipment).filter(Shipment.tenant_id == tenant.id).one()
    assert shipment.tracking_number.startswith("AFR-")


def test_auto_dispatch_uses_only_available_vendors(db_session):
    tenant = _create_tenant(db_session, "auto-dispatch")
    unavailable = _create_approved_vendor(db_session, "busy")
    available = _create_approved_vendor(db_session, "available")
    _set_vendor_available(available, db_session)

    result = auto_dispatch_booking(
        db_session,
        tenant_id=str(tenant.id),
        shipment_id=None,
        pickup_address=None,
        delivery_address="Customer Street",
        pickup_latitude=5.6037,
        pickup_longitude=-0.1870,
        vehicle_type_requested=None,
        region=None,
        notes="Urgent",
        candidate_limit=5,
        booked_by="ops@example.com",
    )

    assert str(result["booking"].vendor_id) == str(available.id)
    assert str(result["booking"].vendor_id) != str(unavailable.id)


def test_reassign_expired_offer_creates_new_offer_for_other_vendor(db_session):
    tenant = _create_tenant(db_session, "reassign")
    first_vendor = _create_approved_vendor(db_session, "first")
    second_vendor = _create_approved_vendor(db_session, "second")
    _set_vendor_available(first_vendor, db_session)
    _set_vendor_available(second_vendor, db_session)

    booking = create_booking(
        db_session,
        tenant.id,
        first_vendor.id,
        pickup_address="Warehouse",
        delivery_address="Home",
        notes="Initial offer",
        booked_by="ops@example.com",
    )
    booking.offer_expires_at = datetime.utcnow() - timedelta(minutes=1)
    db_session.add(booking)
    db_session.commit()

    result = reassign_expired_booking_offers(db_session)
    assert result["checked"] == 1
    assert result["reassigned"] == 1

    bookings = db_session.query(type(booking)).filter(type(booking).tenant_id == tenant.id).order_by(type(booking).created_at.asc()).all()
    assert len(bookings) == 2
    assert bookings[0].status.value == "canceled"
    assert str(bookings[1].vendor_id) == str(second_vendor.id)
    assert bookings[1].status.value == "requested"
