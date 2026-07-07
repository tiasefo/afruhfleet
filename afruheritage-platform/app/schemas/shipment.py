from __future__ import annotations
from app.core.config import settings

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ShipmentCreate(BaseModel):
    tracking_number: str | None = Field(default=None, max_length=100)
    reference_number: str | None = None

    sender_name: str = Field(min_length=1, max_length=255)
    sender_phone: str | None = None
    sender_address: str | None = None

    receiver_name: str = Field(min_length=1, max_length=255)
    receiver_phone: str | None = None
    receiver_address: str | None = None

    origin_country: str | None = None
    origin_city: str | None = None
    destination_country: str | None = None
    destination_city: str | None = None

    shipped_date: datetime | None = None
    estimated_arrival: datetime | None = None

    weight_kg: float | None = None
    volume_cbm: float | None = None
    package_count: int | None = None
    description: str | None = None
    cargo_type: str | None = None

    total_cost: float = 0
    amount_paid: float = 0
    currency: str = "GHS"

    group_member_id: str | None = None
    notes: str | None = None
    cargo_image_url: str | None = None
    loading_date: datetime | None = None
    storage_days: int | None = None
    storage_rate: float | None = None
    storage_fee: float | None = None


class ShipmentUpdate(BaseModel):
    tracking_number: str | None = None
    reference_number: str | None = None
    sender_name: str | None = None
    sender_phone: str | None = None
    sender_address: str | None = None
    receiver_name: str | None = None
    receiver_phone: str | None = None
    receiver_address: str | None = None
    origin_country: str | None = None
    origin_city: str | None = None
    destination_country: str | None = None
    destination_city: str | None = None
    current_location: str | None = None
    current_latitude: float | None = None
    current_longitude: float | None = None
    last_location_at: datetime | None = None
    live_tracking_provider: str | None = None
    shipped_date: datetime | None = None
    estimated_arrival: datetime | None = None
    actual_arrival: datetime | None = None
    weight_kg: float | None = None
    volume_cbm: float | None = None
    package_count: int | None = None
    description: str | None = None
    cargo_type: str | None = None
    total_cost: float | None = None
    amount_paid: float | None = None
    currency: str | None = None
    payment_status: str | None = None
    status: str | None = None
    group_member_id: str | None = None
    notes: str | None = None
    cargo_image_url: str | None = None
    loading_date: datetime | None = None
    storage_days: int | None = None
    storage_rate: float | None = None
    storage_fee: float | None = None


class ShipmentEventCreate(BaseModel):
    event_type: str
    location: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    description: str | None = None
    occurred_at: datetime | None = None


class ShipmentLocationUpdate(BaseModel):
    latitude: float
    longitude: float
    location: str | None = None
    occurred_at: datetime | None = None
    provider: str | None = None
    event_type: str = "location_update"
    description: str | None = None
    status: str | None = None


class TrackingPointIngestRequest(BaseModel):
    latitude: float
    longitude: float
    captured_at: datetime
    speed_kph: float | None = None
    heading: float | None = None
    accuracy_m: float | None = None
    source: str = "driver_app"


class TrackingPointResponse(BaseModel):
    id: str
    shipment_id: str
    tenant_id: str
    latitude: float
    longitude: float
    speed_kph: float | None = None
    heading: float | None = None
    accuracy_m: float | None = None
    source: str
    captured_at: datetime
    received_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TrackingPointIngestResponse(BaseModel):
    accepted: bool
    reason: str | None = None
    point: TrackingPointResponse | None = None


class ShipmentEventResponse(BaseModel):
    id: str
    event_type: str
    location: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    description: str | None = None
    occurred_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ShipmentResponse(BaseModel):
    id: str
    tenant_id: str
    tracking_number: str
    reference_number: str | None = None
    sender_name: str
    sender_phone: str | None = None
    receiver_name: str
    receiver_phone: str | None = None
    origin_country: str | None = None
    origin_city: str | None = None
    destination_country: str | None = None
    destination_city: str | None = None
    current_location: str | None = None
    current_latitude: float | None = None
    current_longitude: float | None = None
    last_location_at: datetime | None = None
    live_tracking_provider: str | None = None
    shipped_date: datetime | None = None
    estimated_arrival: datetime | None = None
    actual_arrival: datetime | None = None
    weight_kg: float | None = None
    package_count: int | None = None
    cargo_type: str | None = None
    total_cost: float
    amount_paid: float
    balance_due: float
    currency: str
    payment_status: str
    status: str
    group_member_id: str | None = None
    group_member_name: str | None = None
    notes: str | None = None
    cargo_image_url: str | None = None
    loading_date: datetime | None = None
    storage_days: int | None = None
    storage_rate: float | None = None
    storage_fee: float | None = None
    volume_cbm: float | None = None
    description: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ShipmentSearchResult(BaseModel):
    id: str
    tracking_number: str
    receiver_name: str
    sender_name: str
    status: str
    payment_status: str
    shipped_date: datetime | None = None
    estimated_arrival: datetime | None = None
    total_cost: float
    balance_due: float
    currency: str


class ShipmentPublicTrackResponse(BaseModel):
    tracking_number: str
    status: str
    sender_name: str
    receiver_name: str
    origin_country: str | None = None
    origin_city: str | None = None
    destination_country: str | None = None
    destination_city: str | None = None
    current_location: str | None = None
    current_latitude: float | None = None
    current_longitude: float | None = None
    last_location_at: datetime | None = None
    live_tracking_provider: str | None = None
    shipped_date: datetime | None = None
    estimated_arrival: datetime | None = None
    payment_status: str
    total_cost: float
    amount_paid: float
    balance_due: float
    currency: str
    events: list[ShipmentEventResponse] = []


class GroupMemberCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    phone: str | None = None
    email: str | None = None
    id_number: str | None = None
    company: str | None = None
    notes: str | None = None
    preferred_language: str = "en"
    role: str = "customer"  # "customer" or "admin"


class GroupMemberUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    email: str | None = None
    id_number: str | None = None
    company: str | None = None
    notes: str | None = None
    preferred_language: str | None = None
    is_active: bool | None = None
    role: str | None = None  # "customer" or "admin"


class GroupMemberResponse(BaseModel):
    id: str
    tenant_id: str
    full_name: str
    phone: str | None = None
    email: str | None = None
    id_number: str | None = None
    company: str | None = None
    notes: str | None = None
    preferred_language: str
    role: str
    is_active: bool
    created_at: str
    updated_at: str
    shipment_count: int = 0
    login_email: str | None = None
    temp_password: str | None = None

    model_config = ConfigDict(from_attributes=True)


class CSVUploadResponse(BaseModel):
    total_rows: int
    created: int
    updated: int
    errors: list[dict] = []
