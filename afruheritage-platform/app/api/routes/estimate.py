from __future__ import annotations

from math import radians, sin, cos, sqrt, atan2
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/estimate", tags=["Shipping Estimate"])


class EstimateRequest(BaseModel):
    pickup_latitude: float
    pickup_longitude: float
    dropoff_latitude: float
    dropoff_longitude: float
    weight_kg: float | None = None
    distance_km: float | None = None


class EstimateResponse(BaseModel):
    distance_km: float
    estimated_price: float
    currency: str
    base_rate: float
    weight_surcharge: float
    total: float


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in kilometers using Haversine formula."""
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = radians(lat1)
    lon1_rad = radians(lon1)
    lat2_rad = radians(lat2)
    lon2_rad = radians(lon2)
    
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = sin(dlat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    
    return R * c


@router.post("", response_model=EstimateResponse)
def get_shipping_estimate(
    request: EstimateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get shipping cost estimate based on distance and weight."""
    
    # Calculate distance if not provided
    if request.distance_km is None:
        distance = haversine_distance(
            request.pickup_latitude, request.pickup_longitude,
            request.dropoff_latitude, request.dropoff_longitude
        )
    else:
        distance = request.distance_km
    
    # Base rate: GHS 5 per km
    base_rate = 5.0
    distance_charge = distance * base_rate
    
    # Weight surcharge: GHS 2 per kg over 10kg
    weight_surcharge = 0.0
    if request.weight_kg and request.weight_kg > 10:
        weight_surcharge = (request.weight_kg - 10) * 2.0
    
    # Total estimate
    total = distance_charge + weight_surcharge
    
    return EstimateResponse(
        distance_km=round(distance, 2),
        estimated_price=round(total, 2),
        currency="GHS",
        base_rate=round(distance_charge, 2),
        weight_surcharge=round(weight_surcharge, 2),
        total=round(total, 2),
    )
