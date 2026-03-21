from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ShipmentCreate(BaseModel):
    tracking_number: str = Field(min_length=1, max_length=100)
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


class ShipmentEventCreate(BaseModel):
    event_type: str
    location: str | None = None
    description: str | None = None
    occurred_at: datetime | None = None


class ShipmentEventResponse(BaseModel):
    id: str
    event_type: str
    location: str | None = None
    description: str | None = None
    occurred_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


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
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


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


class GroupMemberUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    email: str | None = None
    id_number: str | None = None
    company: str | None = None
    notes: str | None = None
    preferred_language: str | None = None
    is_active: bool | None = None


class GroupMemberResponse(BaseModel):
    id: str
    tenant_id: str
    full_name: str
    phone: str | None = None
    email: str | None = None
    id_number: str | None = None
    company: str | None = None
    preferred_language: str
    is_active: bool
    shipment_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class CSVUploadResponse(BaseModel):
    total_rows: int
    created: int
    updated: int
    errors: list[dict] = []
