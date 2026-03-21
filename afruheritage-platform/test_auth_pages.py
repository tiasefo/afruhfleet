#!/usr/bin/env python3
"""
Test script for Afruheritage Authentication Pages
Tests the login, registration, and dashboard pages
"""

import sys
import os

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def test_template_files():
    """Test that all authentication template files exist"""
    print("🧪 Testing Authentication Template Files...")
    
    template_files = [
        "app/templates/auth/login.html",
        "app/templates/auth/dashboard.html", 
        "app/templates/auth/register.html"
    ]
    
    for template_file in template_files:
        if os.path.exists(template_file):
            print(f"✅ {template_file} exists")
        else:
            print(f"❌ {template_file} missing")


def test_geo_service_integration():
    """Test geo service integration with authentication"""
    print("\n🧪 Testing Geo Service Integration...")
    
    try:
        from app.services.ghana_geo_service import global_geo_service
        
        # Test Ghana city lookup
        result = global_geo_service.geocode_country_city_region("Accra", country="ghana")
        if result:
            print(f"✅ Ghana city lookup: Accra at {result}")
        else:
            print("❌ Ghana city lookup failed")
        
        # Test China city lookup
        result = global_geo_service.geocode_country_city_region("Beijing", country="china")
        if result:
            print(f"✅ China city lookup: Beijing at {result}")
        else:
            print("❌ China city lookup failed")
        
        # Test country detection
        detected = global_geo_service.detect_country_from_address("Accra, Ghana")
        if detected == "ghana":
            print(f"✅ Country detection: {detected}")
        else:
            print(f"❌ Country detection failed: {detected}")
        
        # Test priority route
        route = global_geo_service.calculate_priority_route("Accra", "Kumasi", country="ghana")
        if route:
            print(f"✅ Priority route: {route['distance_km']} km")
        else:
            print("❌ Priority route failed")
            
    except Exception as e:
        print(f"❌ Geo service integration error: {e}")


def test_auth_routes():
    """Test that authentication routes are properly configured"""
    print("\n🧪 Testing Authentication Routes...")
    
    try:
        from app.api.routes.auth_pages import router
        
        # Check routes
        routes = [route.path for route in router.routes]
        expected_routes = ["/login", "/register", "/dashboard", "/", "/forgot-password", "/reset-password"]
        
        for expected_route in expected_routes:
            if expected_route in routes:
                print(f"✅ Route {expected_route} configured")
            else:
                print(f"❌ Route {expected_route} missing")
                
    except Exception as e:
        print(f"❌ Auth routes error: {e}")


def test_template_content():
    """Test that templates contain expected content"""
    print("\n🧪 Testing Template Content...")
    
    # Test login template
    login_file = "app/templates/auth/login.html"
    if os.path.exists(login_file):
        with open(login_file, 'r') as f:
            content = f.read()
            
        checks = [
            ("Afruheritage", "Branding"),
            ("loginForm", "Login form"),
            ("email", "Email field"),
            ("password", "Password field"),
            ("detectRegion", "Region detection"),
        ]
        
        for check, description in checks:
            if check in content:
                print(f"✅ Login template: {description}")
            else:
                print(f"❌ Login template: {description} missing")
    
    # Test dashboard template
    dashboard_file = "app/templates/auth/dashboard.html"
    if os.path.exists(dashboard_file):
        with open(dashboard_file, 'r') as f:
            content = f.read()
            
        checks = [
            ("Dashboard", "Dashboard header"),
            ("shipmentChart", "Chart functionality"),
            ("activeShipments", "Stats display"),
            ("detectRegion", "Region detection"),
            ("logout", "Logout function"),
        ]
        
        for check, description in checks:
            if check in content:
                print(f"✅ Dashboard template: {description}")
            else:
                print(f"❌ Dashboard template: {description} missing")


def test_responsive_design():
    """Test responsive design elements"""
    print("\n🧪 Testing Responsive Design Elements...")
    
    templates = [
        ("app/templates/auth/login.html", "Login"),
        ("app/templates/auth/dashboard.html", "Dashboard"),
        ("app/templates/auth/register.html", "Register")
    ]
    
    for template_path, name in templates:
        if os.path.exists(template_path):
            with open(template_path, 'r') as f:
                content = f.read()
            
            responsive_checks = [
                ("tailwindcss", "Tailwind CSS"),
                ("mobile", "Mobile optimization"),
                ("lg:", "Large breakpoint"),
                ("md:", "Medium breakpoint"),
            ]
            
            all_good = True
            for check, description in responsive_checks:
                if check in content:
                    pass  # Good
                else:
                    print(f"⚠️  {name}: {description} not found")
                    all_good = False
            
            if all_good:
                print(f"✅ {name}: Responsive design elements present")


def test_region_optimization():
    """Test region-specific optimizations"""
    print("\n🧪 Testing Region Optimizations...")
    
    try:
        from app.services.ghana_geo_service import PRIORITY_COUNTRIES
        
        # Check priority countries
        if "ghana" in PRIORITY_COUNTRIES:
            print("✅ Ghana optimization configured")
        else:
            print("❌ Ghana optimization missing")
            
        if "china" in PRIORITY_COUNTRIES:
            print("✅ China optimization configured")
        else:
            print("❌ China optimization missing")
        
        # Check Ghana cities
        ghana_cities = PRIORITY_COUNTRIES["ghana"]["cities"]
        if "accra" in ghana_cities and "kumasi" in ghana_cities:
            print(f"✅ Ghana cities: {len(ghana_cities)} cities configured")
        else:
            print("❌ Ghana cities incomplete")
        
        # Check China cities
        china_cities = PRIORITY_COUNTRIES["china"]["cities"]
        if "beijing" in china_cities and "shanghai" in china_cities:
            print(f"✅ China cities: {len(china_cities)} cities configured")
        else:
            print("❌ China cities incomplete")
            
    except Exception as e:
        print(f"❌ Region optimization test error: {e}")


def main():
    """Run all authentication page tests"""
    print("🔐 Afruheritage Authentication Pages Test Suite")
    print("=" * 50)
    
    try:
        test_template_files()
        test_geo_service_integration()
        test_auth_routes()
        test_template_content()
        test_responsive_design()
        test_region_optimization()
        
        print("\n✅ All tests completed!")
        print("\n📋 Authentication Features:")
        print("   • Modern login page with region detection")
        print("   • Multi-step registration with validation")
        print("   • Responsive dashboard with real-time stats")
        print("   • Ghana and China priority optimizations")
        print("   • Mobile-responsive design")
        print("   • FastAPI template rendering")
        print("   • Integration with geo service")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
