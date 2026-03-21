from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.structured_logging import get_logger
from app.db.session import get_db
from app.models.shipment import Shipment, ShipmentStatus
from app.models.user import User
from app.services.geo_service import geo_service
from app.services.ghana_geo_service import global_geo_service

router = APIRouter(prefix="/geo", tags=["Geo & Maps"])
logger = get_logger("afruheritage.geo.api")


@router.get("/geocode")
def geocode_address(
    address: str = Query(..., min_length=2),
    city: str | None = Query(None),
    region: str | None = Query(None),
    country: str | None = Query(None),
    use_priority_service: bool = Query(False),
    current_user: User = Depends(get_current_user),
):
    """Geocode address with optional priority country enhancements"""
    if use_priority_service:
        # Use global priority service for Ghana and China optimizations
        result = global_geo_service.geocode_priority_country(address, city, region, country)
        if result:
            logger.info("Priority geocoding successful for %s", address)
            return result
    else:
        # Standard geocoding
        result = geo_service.geocode(address)
        if result:
            logger.info("Standard geocoding successful for %s", address)
            return result
    
    logger.warning("Geocoding failed for %s", address)
    raise HTTPException(status_code=404, detail="Could not geocode address")


@router.get("/geocode/priority")
def geocode_priority_address(
    address: str = Query(..., min_length=2),
    city: str | None = Query(None),
    region: str | None = Query(None),
    country: str | None = Query(None),
    current_user: User = Depends(get_current_user),
):
    """Priority geocoding with Ghana and China optimizations"""
    result = global_geo_service.geocode_priority_country(address, city, region, country)
    if not result:
        logger.warning("Priority geocoding failed for %s", address)
        raise HTTPException(status_code=404, detail="Could not geocode address")
    
    logger.info("Priority geocoding successful for %s", address)
    return result


@router.get("/geocode/city")
def geocode_city_region(
    city: str = Query(..., min_length=2),
    region: str | None = Query(None),
    country: str | None = Query(None),
    current_user: User = Depends(get_current_user),
):
    """Geocode city with region context for priority countries"""
    result = global_geo_service.geocode_country_city_region(city, region, country)
    if not result:
        logger.warning("City geocoding failed for %s", city)
        raise HTTPException(status_code=404, detail="Could not geocode city")
    
    logger.info("City geocoding successful for %s", city)
    return result


@router.get("/route")
def calculate_route(
    origin_lat: float = Query(...),
    origin_lng: float = Query(...),
    dest_lat: float = Query(...),
    dest_lng: float = Query(...),
    origin_city: str | None = Query(None),
    dest_city: str | None = Query(None),
    country: str | None = Query(None),
    use_priority_service: bool = Query(False),
    current_user: User = Depends(get_current_user),
):
    """Calculate route with optional priority country optimizations"""
    if use_priority_service:
        result = global_geo_service.calculate_priority_route(
            (origin_lat, origin_lng), (dest_lat, dest_lng),
            origin_city, dest_city, country
        )
    else:
        result = geo_service.calculate_route(
            (origin_lat, origin_lng), (dest_lat, dest_lng),
        )
    
    if not result:
        logger.warning("Route calculation failed")
        raise HTTPException(status_code=404, detail="Could not calculate route")
    
    logger.info("Route calculation successful: %s km", result.get("distance_km"))
    return result


@router.get("/route/priority")
def calculate_priority_route(
    origin: str = Query(..., min_length=2),
    destination: str = Query(..., min_length=2),
    country: str | None = Query(None),
    current_user: User = Depends(get_current_user),
):
    """Calculate priority route using city names"""
    result = global_geo_service.calculate_priority_route(origin, destination, country=country)
    if not result:
        logger.warning("Priority route calculation failed for %s to %s", origin, destination)
        raise HTTPException(status_code=404, detail="Could not calculate route")
    
    logger.info("Priority route successful: %s km", result.get("distance_km"))
    return result


@router.get("/nearby-cities")
def get_nearby_priority_cities(
    lat: float = Query(...),
    lng: float = Query(...),
    radius_km: float = Query(50, ge=1, le=200),
    country: str | None = Query(None),
    current_user: User = Depends(get_current_user),
):
    """Find priority country cities within radius of coordinates"""
    cities = global_geo_service.get_nearby_priority_cities(lat, lng, radius_km, country)
    logger.info("Found %d priority cities within %s km", len(cities), radius_km)
    return {"cities": cities, "count": len(cities)}


@router.post("/validate/address")
def validate_priority_address(
    address: str = Query(..., min_length=5),
    current_user: User = Depends(get_current_user),
):
    """Validate priority country address and extract components"""
    validation = global_geo_service.validate_priority_address(address)
    logger.info("Address validation: confidence=%.2f, country=%s", 
                validation["confidence"], validation["country"])
    return validation


@router.get("/country/{country}")
def get_country_info(
    country: str,
    current_user: User = Depends(get_current_user),
):
    """Get country information for priority countries"""
    info = global_geo_service.get_country_info(country)
    if not info:
        raise HTTPException(status_code=404, detail="Country information not found")
    return info


@router.get("/{tenant_id}/shipment-routes")
def get_active_shipment_routes(
    tenant_id: str,
    use_priority_service: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get active shipment routes with optional priority country geocoding"""
    active_statuses = [
        ShipmentStatus.BOOKED,
        ShipmentStatus.PICKED_UP,
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.AT_CUSTOMS,
        ShipmentStatus.CUSTOMS_CLEARED,
        ShipmentStatus.OUT_FOR_DELIVERY,
    ]
    shipments = db.query(Shipment).filter(
        Shipment.tenant_id == tenant_id,
        Shipment.status.in_(active_statuses),
    ).limit(500).all()

    routes = []
    successful_geocodes = 0
    
    for s in shipments:
        # Try priority country geocoding first if requested
        if use_priority_service:
            origin = global_geo_service.geocode_country_city_region(
                s.origin_city, s.origin_country
            )
            dest = global_geo_service.geocode_country_city_region(
                s.destination_city, s.destination_country
            )
        else:
            # Standard geocoding
            origin = geo_service.geocode_city_country(s.origin_city, s.origin_country)
            dest = geo_service.geocode_city_country(s.destination_city, s.destination_country)
        
        if origin and dest:
            successful_geocodes += 1
            routes.append({
                "shipment_id": str(s.id),
                "tracking_number": s.tracking_number,
                "status": s.status.value,
                "sender_name": s.sender_name,
                "receiver_name": s.receiver_name,
                "estimated_arrival": s.estimated_arrival.isoformat() if s.estimated_arrival else None,
                "origin": {
                    "lat": origin["lat"],
                    "lng": origin["lng"],
                    "city": s.origin_city,
                    "country": s.origin_country,
                },
                "destination": {
                    "lat": dest["lat"],
                    "lng": dest["lng"],
                    "city": s.destination_city,
                    "country": s.destination_country,
                },
            })

    logger.info("Generated %d shipment routes for tenant %s (geocoded: %d/%d)", 
                len(routes), tenant_id, successful_geocodes, len(shipments))
    
    return {"routes": routes, "count": len(routes), "geocoded": successful_geocodes}
