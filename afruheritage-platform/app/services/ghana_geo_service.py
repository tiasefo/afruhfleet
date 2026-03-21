from __future__ import annotations

import logging
from typing import Any

from app.core.structured_logging import get_logger
from app.services.geo_service import GeoService, NominatimProvider

logger = get_logger("afruheritage.ghana_geo")

# Major Ghana cities with coordinates for fallback geocoding
GHANA_CITIES = {
    "accra": {"lat": 5.6037, "lng": -0.1870, "region": "Greater Accra"},
    "kumasi": {"lat": 6.6881, "lng": -1.6244, "region": "Ashanti"},
    "tamale": {"lat": 9.4047, "lng": -0.8393, "region": "Northern"},
    "takoradi": {"lat": 4.9288, "lng": -1.7617, "region": "Western"},
    "cape_coast": {"lat": 5.1054, "lng": -1.2466, "region": "Central"},
    "tema": {"lat": 5.6684, "lng": -0.0167, "region": "Greater Accra"},
    "ashiaman": {"lat": 5.6538, "lng": -0.0206, "region": "Greater Accra"},
    "obuasi": {"lat": 6.2069, "lng": -1.6667, "region": "Ashanti"},
    "sunyani": {"lat": 7.3396, "lng": -2.3369, "region": "Bono"},
    "wa": {"lat": 10.0605, "lng": -2.5117, "region": "Upper West"},
    "bolgatanga": {"lat": 10.7855, "lng": -0.8544, "region": "Upper East"},
    "ho": {"lat": 6.6075, "lng": 0.4727, "region": "Volta"},
    "koforidua": {"lat": 6.0833, "lng": -0.2569, "region": "Eastern"},
}

# Major China cities with coordinates for fallback geocoding
CHINA_CITIES = {
    "beijing": {"lat": 39.9042, "lng": 116.4074, "province": "Beijing"},
    "shanghai": {"lat": 31.2304, "lng": 121.4737, "province": "Shanghai"},
    "guangzhou": {"lat": 23.1291, "lng": 113.2644, "province": "Guangdong"},
    "shenzhen": {"lat": 22.5431, "lng": 114.0579, "province": "Guangdong"},
    "chengdu": {"lat": 30.5728, "lng": 104.0668, "province": "Sichuan"},
    "hangzhou": {"lat": 30.2741, "lng": 120.1551, "province": "Zhejiang"},
    "wuhan": {"lat": 30.5928, "lng": 114.3055, "province": "Hubei"},
    "xian": {"lat": 34.3416, "lng": 108.9398, "province": "Shaanxi"},
    "chongqing": {"lat": 29.5630, "lng": 106.5516, "province": "Chongqing"},
    "tianjin": {"lat": 39.0842, "lng": 117.2010, "province": "Tianjin"},
    "nanjing": {"lat": 32.0603, "lng": 118.7969, "province": "Jiangsu"},
    "shenyang": {"lat": 41.8057, "lng": 123.4315, "province": "Liaoning"},
}

# Ghana regions
GHANA_REGIONS = [
    "Greater Accra", "Ashanti", "Northern", "Western", "Central",
    "Eastern", "Volta", "Bono", "Bono East", "Ahafo", "North East",
    "Savannah", "Upper West", "Upper East", "Oti"
]

# China provinces
CHINA_PROVINCES = [
    "Beijing", "Shanghai", "Guangdong", "Sichuan", "Zhejiang", "Hubei",
    "Shaanxi", "Chongqing", "Tianjin", "Jiangsu", "Liaoning", "Shandong",
    "Henan", "Hunan", "Anhui", "Hebei", "Jiangxi", "Fujian", "Yunnan",
    "Guizhou", "Guangxi", "Hainan", "Gansu", "Qinghai", "Ningxia", "Xinjiang",
    "Inner Mongolia", "Jilin", "Heilongjiang", "Tibet"
]

# Priority countries for optimization
PRIORITY_COUNTRIES = {
    "ghana": {"cities": GHANA_CITIES, "regions": GHANA_REGIONS, "currency": "GHS", "phone_code": "+233"},
    "china": {"cities": CHINA_CITIES, "regions": CHINA_PROVINCES, "currency": "CNY", "phone_code": "+86"},
}

class GlobalGeoService:
    """Enhanced geo service with Ghana and China optimizations"""
    
    def __init__(self, geo_service: GeoService | None = None):
        self.geo_service = geo_service or GeoService(NominatimProvider())
    
    def detect_country_from_address(self, address: str) -> str | None:
        """Detect country from address string"""
        address_lower = address.lower()
        
        # Check for country indicators
        country_indicators = {
            "ghana": ["ghana", "accra", "kumasi", "tema"],
            "china": ["china", "beijing", "shanghai", "guangzhou", "shenzhen"],
        }
        
        for country, indicators in country_indicators.items():
            if any(indicator in address_lower for indicator in indicators):
                return country
        
        return None
    
    def geocode_priority_country(self, address: str, city: str | None = None, region: str | None = None, country: str | None = None) -> dict[str, float] | None:
        """Enhanced geocoding with priority country fallbacks"""
        # Auto-detect country if not specified
        if not country:
            country = self.detect_country_from_address(address)
        
        # Try normal geocoding first
        result = self.geo_service.geocode(address)
        if result:
            logger.info("Standard geocoding succeeded for %s", address)
            return result
        
        # Fallback to country-specific city lookup
        if country and country in PRIORITY_COUNTRIES:
            country_data = PRIORITY_COUNTRIES[country]
            cities = country_data["cities"]
            
            # Try city parameter first
            if city:
                city_lower = city.lower().strip()
                if city_lower in cities:
                    city_data = cities[city_lower]
                    logger.info("Using %s city fallback for %s", country.title(), city)
                    return {"lat": city_data["lat"], "lng": city_data["lng"]}
            
            # Try to extract city from address
            address_lower = address.lower()
            for city_name, city_data in cities.items():
                if city_name in address_lower:
                    logger.info("Extracted city %s from address %s", city_name, address)
                    return {"lat": city_data["lat"], "lng": city_data["lng"]}
        
        logger.warning("Geocoding failed for %s - no priority city found", address)
        return None
    
    def geocode_country_city_region(self, city: str, region: str | None = None, country: str | None = None) -> dict[str, float] | None:
        """Geocode city with region context for priority countries"""
        # Auto-detect country if not specified
        if not country:
            # Simple heuristic based on city names
            city_lower = city.lower().strip()
            if city_lower in GHANA_CITIES:
                country = "ghana"
            elif city_lower in CHINA_CITIES:
                country = "china"
        
        if not country or country not in PRIORITY_COUNTRIES:
            # Fallback to normal geocoding
            address = f"{city}, {region}" if region else city
            return self.geo_service.geocode(address)
        
        country_data = PRIORITY_COUNTRIES[country]
        cities = country_data["cities"]
        city_lower = city.lower().strip()
        
        # Direct lookup
        if city_lower in cities:
            city_data = cities[city_lower]
            # If region specified, verify it matches
            if region and region.title() != city_data["region"]:
                logger.warning("Region mismatch: %s vs %s for city %s", region, city_data["region"], city)
            return {"lat": city_data["lat"], "lng": city_data["lng"]}
        
        # Try fuzzy matching
        for city_name, city_data in cities.items():
            if city_lower in city_name or city_name in city_lower:
                logger.info("Fuzzy matched city %s to %s", city, city_name)
                return {"lat": city_data["lat"], "lng": city_data["lng"]}
        
        # Fallback to normal geocoding with country context
        address = f"{city}, {country.title()}"
        return self.geo_service.geocode(address)
    
    def calculate_priority_route(
        self, 
        origin: tuple[float, float] | str, 
        destination: tuple[float, float] | str,
        origin_city: str | None = None,
        dest_city: str | None = None,
        country: str | None = None
    ) -> dict[str, Any] | None:
        """Calculate route with country-specific optimizations"""
        # Convert city names to coordinates
        if isinstance(origin, str):
            origin_coords = self.geocode_country_city_region(origin, country=country)
            if not origin_coords:
                return None
            origin = (origin_coords["lat"], origin_coords["lng"])
        
        if isinstance(destination, str):
            dest_coords = self.geocode_country_city_region(destination, country=country)
            if not dest_coords:
                return None
            destination = (dest_coords["lat"], dest_coords["lng"])
        
        # Use standard routing
        route = self.geo_service.calculate_route(origin, destination)
        if route:
            # Add country-specific metadata
            route["priority_route"] = True
            if country:
                route["country"] = country
                # Add country-specific traffic factors
                if country == "ghana":
                    traffic_factor = 1.3  # Ghana traffic conditions
                elif country == "china":
                    traffic_factor = 1.4  # China traffic conditions
                else:
                    traffic_factor = 1.2  # Default international
                
                if route["distance_km"]:
                    base_duration = route["duration_hours"] or (route["distance_km"] / 60)
                    route["duration_hours"] = round(base_duration * traffic_factor, 2)
                    route["traffic_adjusted"] = True
            
            if origin_city:
                route["origin_city"] = origin_city
            if dest_city:
                route["destination_city"] = dest_city
        
        return route
    
    def get_nearby_priority_cities(self, lat: float, lng: float, radius_km: float = 50, country: str | None = None) -> list[dict[str, Any]]:
        """Find priority country cities within radius of coordinates"""
        nearby = []
        
        # Determine which cities to search
        cities_to_search = {}
        if country and country in PRIORITY_COUNTRIES:
            cities_to_search = PRIORITY_COUNTRIES[country]["cities"]
        else:
            # Search both Ghana and China
            cities_to_search = {**GHANA_CITIES, **CHINA_CITIES}
        
        for city_name, city_data in cities_to_search.items():
            # Simple distance calculation
            distance = self._calculate_distance(
                lat, lng, city_data["lat"], city_data["lng"]
            )
            
            if distance <= radius_km:
                nearby.append({
                    "name": city_name.title(),
                    "region": city_data["region"],
                    "country": "ghana" if city_name in GHANA_CITIES else "china",
                    "coordinates": {"lat": city_data["lat"], "lng": city_data["lng"]},
                    "distance_km": round(distance, 1)
                })
        
        # Sort by distance
        nearby.sort(key=lambda x: x["distance_km"])
        return nearby
    
    def get_country_info(self, country: str) -> dict[str, Any] | None:
        """Get country information for priority countries"""
        if country.lower() in PRIORITY_COUNTRIES:
            return PRIORITY_COUNTRIES[country.lower()]
        return None
    
    def _calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance between two coordinates in km"""
        import math
        R = 6371  # Earth radius in km
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        a = (math.sin(dlat / 2) ** 2 + 
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
             math.sin(dlng / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c
    
    def validate_priority_address(self, address: str) -> dict[str, Any]:
        """Validate and extract components of priority country addresses"""
        address_lower = address.lower()
        
        # Detect country
        detected_country = self.detect_country_from_address(address)
        
        # Check for country indicators
        has_ghana = any(indicator in address_lower for indicator in ["ghana", "accra", "kumasi", "tema"])
        has_china = any(indicator in address_lower for indicator in ["china", "beijing", "shanghai", "guangzhou"])
        
        # Extract city
        found_city = None
        found_country = detected_country
        
        if found_country:
            cities = PRIORITY_COUNTRIES[found_country]["cities"]
            for city_name in cities.keys():
                if city_name in address_lower:
                    found_city = city_name.title()
                    break
        
        # Extract region/province
        found_region = None
        if found_country:
            regions = PRIORITY_COUNTRIES[found_country]["regions"]
            for region in regions:
                if region.lower() in address_lower:
                    found_region = region
                    break
        
        return {
            "is_priority_country": bool(detected_country),
            "country": detected_country,
            "city": found_city,
            "region": found_region,
            "confidence": self._calculate_address_confidence(detected_country, found_city, found_region)
        }
    
    def _calculate_address_confidence(self, country: str | None, city: str | None, region: str | None) -> float:
        """Calculate confidence score for address validation"""
        score = 0.0
        if country:
            score += 0.3
        if city:
            score += 0.4
        if region:
            score += 0.3
        return min(score, 1.0)


# Global instances
ghana_geo_service = GlobalGeoService()
global_geo_service = GlobalGeoService()
