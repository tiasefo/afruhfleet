from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# ── Registration (public, matches frontend form) ──────────────

class VendorVehicleCreate(BaseModel):
    vehicle_type: str
    registration_number: str
    make_model: str | None = None
    year: int | None = None


class VendorRegisterRequest(BaseModel):
    # Step 1: Personal
    full_name: str = Field(..., min_length=2, max_length=255)
    email: str = Field(..., max_length=255)
    phone: str = Field(..., max_length=50)
    id_type: str  # ghana_card | passport | voter_id | drivers_license
    id_number: str = Field(..., max_length=100)

    # Step 2: Vehicles
    vehicle_types: list[str]  # ["truck", "car", "motorbike", "bicycle"]
    vehicle_reg_number: str = Field(..., max_length=50)
    vehicle_model: str | None = None
    vehicle_year: str | None = None

    # Step 3: Business
    business_name: str | None = None
    business_type: str = "individual"  # individual | registered | fleet
    operating_regions: list[str]  # ["Greater Accra", "Ashanti", ...]
    years_experience: str | None = None

    # Step 4: Agreement
    terms_accepted: bool = False
    insurance_accepted: bool = False
    background_check_accepted: bool = False


class VendorRegisterResponse(BaseModel):
    id: str
    full_name: str
    email: str
    phone: str
    status: str
    message: str


# ── Admin review ───────────────────────────────────────────────

class VendorReviewRequest(BaseModel):
    action: str  # approve | reject
    rejection_reason: str | None = None


# ── Vehicle response ───────────────────────────────────────────

class VendorVehicleResponse(BaseModel):
    id: str
    vehicle_type: str
    registration_number: str
    make_model: str | None = None
    year: int | None = None
    insurance_doc_url: str | None = None
    roadworthy_doc_url: str | None = None
    is_active: bool

    class Config:
        from_attributes = True


# ── Full vendor response ──────────────────────────────────────

class VendorResponse(BaseModel):
    id: str
    full_name: str
    email: str
    phone: str
    id_type: str
    id_number: str
    business_name: str | None = None
    business_type: str
    operating_regions: list[str]
    years_experience: str | None = None
    status: str
    average_rating: float
    total_deliveries: int
    vehicles: list[VendorVehicleResponse]
    terms_accepted: bool
    insurance_accepted: bool
    background_check_accepted: bool
    reviewed_by: str | None = None
    reviewed_at: datetime | None = None
    rejection_reason: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Marketplace search (tenant-facing) ─────────────────────────

class VendorSearchResult(BaseModel):
    id: str
    full_name: str
    business_name: str | None = None
    business_type: str
    operating_regions: list[str]
    vehicle_types: list[str]
    average_rating: float
    total_deliveries: int


# ── Service Booking ────────────────────────────────────────────

class BookingCreateRequest(BaseModel):
    vendor_id: str
    shipment_id: str | None = None
    pickup_address: str | None = None
    delivery_address: str | None = None
    vehicle_type_requested: str | None = None
    notes: str | None = None


class BookingUpdateRequest(BaseModel):
    status: str | None = None  # accepted | in_progress | completed | canceled
    tenant_rating: int | None = Field(None, ge=1, le=5)
    tenant_review: str | None = None


class BookingResponse(BaseModel):
    id: str
    tenant_id: str
    vendor_id: str
    vendor_name: str
    shipment_id: str | None = None
    status: str
    pickup_address: str | None = None
    delivery_address: str | None = None
    vehicle_type_requested: str | None = None
    notes: str | None = None
    credit_cost: int
    currency: str
    tenant_rating: int | None = None
    tenant_review: str | None = None
    booked_by: str | None = None
    accepted_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
