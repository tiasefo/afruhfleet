from __future__ import annotations

import logging
import os
from abc import ABC, abstractmethod
from typing import Any

import httpx

from app.core.structured_logging import get_logger

logger = get_logger("afruheritage.geo")


class GeoProvider(ABC):
    @abstractmethod
    def geocode(self, address: str) -> dict[str, float] | None:
        """Returns {"lat": float, "lng": float} or None."""
        ...

    @abstractmethod
    def reverse_geocode(self, lat: float, lng: float) -> str | None:
        """Returns formatted address string or None."""
        ...

    @abstractmethod
    def calculate_route(
        self, origin: tuple[float, float], destination: tuple[float, float],
    ) -> dict[str, Any] | None:
        """Returns route info: distance_km, duration_hours, polyline."""
        ...


class NominatimProvider(GeoProvider):
    """Free OpenStreetMap geocoding — suitable for development and moderate traffic."""

    BASE = "https://nominatim.openstreetmap.org"
    HEADERS = {"User-Agent": "Afruheritage-Freight-Platform/1.0"}

    def geocode(self, address: str) -> dict[str, float] | None:
        try:
            resp = httpx.get(
                f"{self.BASE}/search",
                params={"q": address, "format": "json", "limit": 1},
                headers=self.HEADERS,
                timeout=10,
            )
            data = resp.json()
            if data:
                return {"lat": float(data[0]["lat"]), "lng": float(data[0]["lon"])}
        except Exception as exc:
            logger.warning("Geocode failed for %s: %s", address, exc)
        return None

    def reverse_geocode(self, lat: float, lng: float) -> str | None:
        try:
            resp = httpx.get(
                f"{self.BASE}/reverse",
                params={"lat": lat, "lon": lng, "format": "json"},
                headers=self.HEADERS,
                timeout=10,
            )
            data = resp.json()
            return data.get("display_name")
        except Exception as exc:
            logger.warning("Reverse geocode failed for %s,%s: %s", lat, lng, exc)
        return None

    def calculate_route(
        self, origin: tuple[float, float], destination: tuple[float, float],
    ) -> dict[str, Any] | None:
        # Nominatim doesn't do routing — return straight-line estimate
        import math
        lat1, lng1 = origin
        lat2, lng2 = destination
        R = 6371  # Earth radius km
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance_km = round(R * c, 1)
        return {
            "distance_km": distance_km,
            "duration_hours": None,
            "polyline": None,
            "type": "straight_line",
        }


class MapboxProvider(GeoProvider):
    """Production geocoding and routing via Mapbox."""

    def __init__(self, access_token: str):
        self.token = access_token
        self.base = "https://api.mapbox.com"

    def geocode(self, address: str) -> dict[str, float] | None:
        try:
            resp = httpx.get(
                f"{self.base}/geocoding/v5/mapbox.places/{address}.json",
                params={"access_token": self.token, "limit": 1},
                timeout=10,
            )
            data = resp.json()
            features = data.get("features", [])
            if features:
                lng, lat = features[0]["center"]
                return {"lat": lat, "lng": lng}
        except Exception as exc:
            logger.warning("Mapbox geocode failed for %s: %s", address, exc)
        return None

    def reverse_geocode(self, lat: float, lng: float) -> str | None:
        try:
            resp = httpx.get(
                f"{self.base}/geocoding/v5/mapbox.places/{lng},{lat}.json",
                params={"access_token": self.token, "limit": 1},
                timeout=10,
            )
            data = resp.json()
            features = data.get("features", [])
            if features:
                return features[0].get("place_name")
        except Exception as exc:
            logger.warning("Mapbox reverse geocode failed: %s", exc)
        return None

    def calculate_route(
        self, origin: tuple[float, float], destination: tuple[float, float],
    ) -> dict[str, Any] | None:
        try:
            coords = f"{origin[1]},{origin[0]};{destination[1]},{destination[0]}"
            resp = httpx.get(
                f"{self.base}/directions/v5/mapbox/driving/{coords}",
                params={"access_token": self.token, "geometries": "polyline", "overview": "full"},
                timeout=15,
            )
            data = resp.json()
            routes = data.get("routes", [])
            if routes:
                route = routes[0]
                return {
                    "distance_km": round(route["distance"] / 1000, 1),
                    "duration_hours": round(route["duration"] / 3600, 2),
                    "polyline": route.get("geometry"),
                    "type": "driving",
                }
        except Exception as exc:
            logger.warning("Mapbox route failed: %s", exc)
        return None


class GoogleMapsProvider(GeoProvider):
    """Production geocoding and routing via Google Maps API."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base = "https://maps.googleapis.com/maps/api"

    def geocode(self, address: str) -> dict[str, float] | None:
        try:
            resp = httpx.get(
                f"{self.base}/geocode/json",
                params={"address": address, "key": self.api_key},
                timeout=10,
            )
            data = resp.json()
            if data.get("status") == "OK" and data.get("results"):
                location = data["results"][0]["geometry"]["location"]
                return {"lat": location["lat"], "lng": location["lng"]}
            else:
                logger.warning("Google Maps geocode failed: %s", data.get("status", "Unknown error"))
        except Exception as exc:
            logger.error("Google Maps geocode failed for %s: %s", address, exc)
        return None

    def reverse_geocode(self, lat: float, lng: float) -> str | None:
        try:
            resp = httpx.get(
                f"{self.base}/geocode/json",
                params={"latlng": f"{lat},{lng}", "key": self.api_key},
                timeout=10,
            )
            data = resp.json()
            if data.get("status") == "OK" and data.get("results"):
                return data["results"][0].get("formatted_address")
            else:
                logger.warning("Google Maps reverse geocode failed: %s", data.get("status", "Unknown error"))
        except Exception as exc:
            logger.error("Google Maps reverse geocode failed: %s", exc)
        return None

    def calculate_route(
        self, origin: tuple[float, float], destination: tuple[float, float],
    ) -> dict[str, Any] | None:
        try:
            origin_str = f"{origin[0]},{origin[1]}"
            dest_str = f"{destination[0]},{destination[1]}"
            resp = httpx.get(
                f"{self.base}/directions/json",
                params={
                    "origin": origin_str,
                    "destination": dest_str,
                    "key": self.api_key,
                    "mode": "driving",
                },
                timeout=15,
            )
            data = resp.json()
            if data.get("status") == "OK" and data.get("routes"):
                route = data["routes"][0]
                leg = route["legs"][0]
                distance_m = leg["distance"]["value"]
                duration_s = leg["duration"]["value"]
                
                # Encode overview polyline if available
                polyline = route.get("overview_polyline", {}).get("points")
                
                return {
                    "distance_km": round(distance_m / 1000, 1),
                    "duration_hours": round(duration_s / 3600, 2),
                    "polyline": polyline,
                    "type": "driving",
                    "steps": leg.get("steps", []),
                }
            else:
                logger.warning("Google Maps route failed: %s", data.get("status", "Unknown error"))
        except Exception as exc:
            logger.error("Google Maps route failed: %s", exc)
        return None


class GeoService:
    def __init__(self, provider: GeoProvider | None = None):
        self._provider = provider or NominatimProvider()

    def geocode(self, address: str) -> dict[str, float] | None:
        return self._provider.geocode(address)

    def reverse_geocode(self, lat: float, lng: float) -> str | None:
        return self._provider.reverse_geocode(lat, lng)

    def calculate_route(
        self, origin: tuple[float, float], destination: tuple[float, float],
    ) -> dict[str, Any] | None:
        return self._provider.calculate_route(origin, destination)

    def geocode_city_country(self, city: str | None, country: str | None) -> dict[str, float] | None:
        parts = [p for p in [city, country] if p]
        if not parts:
            return None
        return self.geocode(", ".join(parts))


def get_geo_service() -> GeoService:
    """Get geo service instance based on configuration"""
    from app.core.config import settings
    
    # Check for Google Maps first (highest priority)
    google_key = os.getenv("GOOGLE_MAPS_API_KEY", "")
    if google_key:
        logger.info("Using Google Maps provider for geocoding")
        return GeoService(GoogleMapsProvider(google_key))
    
    # Check for Mapbox
    mapbox_token = getattr(settings, "mapbox_access_token", "")
    if mapbox_token:
        logger.info("Using Mapbox provider for geocoding")
        return GeoService(MapboxProvider(mapbox_token))
    
    # Default to Nominatim (free, development)
    logger.info("Using Nominatim provider for geocoding (free/development)")
    return GeoService(NominatimProvider())


def get_geo_service_with_provider(provider_name: str) -> GeoService:
    """Get geo service with specific provider (for testing/fallback)"""
    if provider_name == "google":
        api_key = os.getenv("GOOGLE_MAPS_API_KEY", "")
        if not api_key:
            raise ValueError("Google Maps API key not configured")
        return GeoService(GoogleMapsProvider(api_key))
    elif provider_name == "mapbox":
        from app.core.config import settings
        token = getattr(settings, "mapbox_access_token", "")
        if not token:
            raise ValueError("Mapbox access token not configured")
        return GeoService(MapboxProvider(token))
    elif provider_name == "nominatim":
        return GeoService(NominatimProvider())
    else:
        raise ValueError(f"Unknown geo provider: {provider_name}")


geo_service = get_geo_service()
