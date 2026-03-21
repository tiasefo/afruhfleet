#!/usr/bin/env python3
"""
Test script for Afruheritage Geo Service
Tests geocoding, routing, and Ghana-specific functionality
"""

import sys
import os

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.geo_service import get_geo_service, get_geo_service_with_provider
from app.services.ghana_geo_service import ghana_geo_service


def test_standard_geocoding():
    """Test standard geocoding functionality"""
    print("🧪 Testing Standard Geocoding...")
    
    geo_service = get_geo_service()
    
    # Test Accra, Ghana
    result = geo_service.geocode("Accra, Ghana")
    if result:
        print(f"✅ Accra geocoded: {result}")
    else:
        print("❌ Failed to geocode Accra")
    
    # Test Kumasi
    result = geo_service.geocode("Kumasi, Ghana")
    if result:
        print(f"✅ Kumasi geocoded: {result}")
    else:
        print("❌ Failed to geocode Kumasi")
    
    # Test route between Accra and Kumasi
    accra_coords = (5.6037, -0.1870)
    kumasi_coords = (6.6881, -1.6244)
    route = geo_service.calculate_route(accra_coords, kumasi_coords)
    if route:
        print(f"✅ Route calculated: {route['distance_km']} km, {route.get('duration_hours', 'N/A')} hours")
    else:
        print("❌ Failed to calculate route")


def test_ghana_geocoding():
    """Test Ghana-specific geocoding"""
    print("\n🧪 Testing Ghana-Specific Geocoding...")
    
    # Test city lookup
    result = ghana_geo_service.geocode_ghana_city_region("Accra")
    if result:
        print(f"✅ Accra city lookup: {result}")
    else:
        print("❌ Failed Accra city lookup")
    
    # Test address with city fallback
    result = ghana_geo_service.geocode_ghana("Some address in Tema", city="tema")
    if result:
        print(f"✅ Address with city fallback: {result}")
    else:
        print("❌ Failed address with city fallback")
    
    # Test Ghana route by city names
    route = ghana_geo_service.calculate_ghana_route("Accra", "Kumasi")
    if route:
        print(f"✅ Ghana route: {route['distance_km']} km, {route.get('duration_hours', 'N/A')} hours")
        if route.get('ghana_route'):
            print("✅ Route marked as Ghana-specific")
    else:
        print("❌ Failed Ghana route calculation")


def test_nearby_cities():
    """Test nearby cities functionality"""
    print("\n🧪 Testing Nearby Cities...")
    
    # Find cities near Accra
    accra_coords = (5.6037, -0.1870)
    cities = ghana_geo_service.get_nearby_cities(accra_coords[0], accra_coords[1], 100)
    print(f"✅ Found {len(cities)} cities near Accra:")
    for city in cities[:5]:  # Show first 5
        print(f"   - {city['name']} ({city['region']}): {city['distance_km']} km")


def test_address_validation():
    """Test Ghana address validation"""
    print("\n🧪 Testing Address Validation...")
    
    # Test valid Ghana addresses
    test_addresses = [
        "123 Independence Avenue, Accra, Ghana",
        "Kumasi Mall, Kumasi, Ashanti Region, Ghana",
        "Tema Harbour, Tema, Ghana",
        "Random address",
    ]
    
    for address in test_addresses:
        validation = ghana_geo_service.validate_ghana_address(address)
        print(f"📍 '{address}'")
        print(f"   Is Ghana: {validation['is_ghana']}")
        print(f"   City: {validation['city']}")
        print(f"   Region: {validation['region']}")
        print(f"   Confidence: {validation['confidence']:.2f}")
        print()


def test_provider_switching():
    """Test different geo providers"""
    print("\n🧪 Testing Provider Switching...")
    
    providers = ["nominatim"]  # Start with free provider
    
    for provider in providers:
        try:
            service = get_geo_service_with_provider(provider)
            result = service.geocode("Accra, Ghana")
            if result:
                print(f"✅ {provider.title()} provider: Accra at {result}")
            else:
                print(f"❌ {provider.title()} provider failed")
        except Exception as e:
            print(f"❌ {provider.title()} provider error: {e}")


def main():
    """Run all geo service tests"""
    print("🗺️  Afruheritage Geo Service Test Suite")
    print("=" * 50)
    
    try:
        test_standard_geocoding()
        test_ghana_geocoding()
        test_nearby_cities()
        test_address_validation()
        test_provider_switching()
        
        print("\n✅ All tests completed!")
        print("\n📋 Geo Service Features:")
        print("   • Standard geocoding (Nominatim/Mapbox/Google)")
        print("   • Ghana-specific city and region support")
        print("   • Route calculation with traffic adjustments")
        print("   • Nearby city discovery")
        print("   • Address validation and confidence scoring")
        print("   • Provider abstraction and fallback")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
