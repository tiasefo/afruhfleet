#!/usr/bin/env python3
"""
Test script for Afruheritage Geo API endpoints
Tests the actual API routes for geocoding and routing
"""

import sys
import os
import requests

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def test_geo_api():
    """Test geo API endpoints"""
    print("🌐 Testing Geo API Endpoints...")
    
    base_url = "http://localhost:8100/api/v1/geo"
    
    # Test endpoints to try
    endpoints = [
        ("/geocode?address=Accra,Ghana", "Standard geocoding"),
        ("/geocode/ghana?address=Accra,Ghana", "Ghana geocoding"),
        ("/geocode/ghana/city?city=Kumasi", "Ghana city geocoding"),
        ("/route?origin_lat=5.6037&origin_lng=-0.1870&dest_lat=6.6881&dest_lng=-1.6244", "Route calculation"),
        ("/route/ghana?origin=Accra&destination=Kumasi", "Ghana route"),
        ("/ghana/nearby-cities?lat=5.6037&lng=-0.1870&radius_km=50", "Nearby cities"),
    ]
    
    for endpoint, description in endpoints:
        url = base_url + endpoint
        print(f"\n📍 Testing: {description}")
        print(f"   URL: {url}")
        
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Success: {response.status_code}")
                if isinstance(data, dict):
                    if "lat" in data:
                        print(f"   📍 Coordinates: {data['lat']}, {data['lng']}")
                    elif "distance_km" in data:
                        print(f"   📏 Distance: {data['distance_km']} km")
                        print(f"   ⏱️ Duration: {data.get('duration_hours', 'N/A')} hours")
                    elif "cities" in data:
                        print(f"   🏙️ Found {data['count']} cities")
                    elif "routes" in data:
                        print(f"   📦 Found {data['count']} routes")
                elif isinstance(data, list):
                    print(f"   📊 Returned {len(data)} items")
            else:
                print(f"   ❌ Failed: {response.status_code}")
                print(f"   Response: {response.text[:200]}")
        except requests.exceptions.ConnectionError:
            print(f"   ⚠️  Connection refused - API server not running")
        except Exception as e:
            print(f"   ❌ Error: {e}")


def main():
    """Run API tests"""
    print("🌐 Afruheritage Geo API Test Suite")
    print("=" * 50)
    print("Note: Make sure the API server is running on localhost:8100")
    print("Start with: uvicorn app.main:app --reload")
    print()
    
    test_geo_api()
    
    print("\n✅ API testing completed!")
    print("\n📋 Available Geo API Endpoints:")
    print("   • GET /geo/geocode - Standard geocoding")
    print("   • GET /geo/geocode/ghana - Ghana-specific geocoding")
    print("   • GET /geo/geocode/ghana/city - Ghana city geocoding")
    print("   • GET /geo/route - Route calculation")
    print("   • GET /geo/route/ghana - Ghana route by city names")
    print("   • GET /geo/ghana/nearby-cities - Nearby cities")
    print("   • POST /geo/validate/ghana-address - Address validation")
    print("   • GET /geo/{tenant_id}/shipment-routes - Shipment routes")


if __name__ == "__main__":
    main()
