#!/usr/bin/env python3
"""
Smoke Test for New Frontend Features
Tests all the newly implemented amber features
"""

import sys
import os
import requests
import json
from datetime import datetime

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_api_endpoints():
    """Test all new API endpoints"""
    print("🔥 TESTING NEW API ENDPOINTS")
    print("=" * 40)
    
    base_url = "http://localhost:8100/api/v1"
    
    endpoints = [
        # Credit Wallet endpoints
        ("/billing/wallets/test-tenant", "GET", "Wallet endpoint"),
        ("/billing/wallets/test-tenant/transactions", "GET", "Wallet transactions endpoint"),
        
        # CRM endpoints  
        ("/support-crm/accounts?tenant_id=test-tenant", "GET", "CRM accounts endpoint"),
        ("/support-crm/contacts?tenant_id=test-tenant", "GET", "CRM contacts endpoint"),
        ("/support-crm/opportunities?tenant_id=test-tenant", "GET", "CRM opportunities endpoint"),
        ("/support-crm/quotes?tenant_id=test-tenant", "GET", "CRM quotes endpoint"),
        
        # Fleetbase endpoints
        ("/vendors/marketplace?tenant_id=test-tenant", "GET", "Vendors/Drivers endpoint"),
        ("/fleetbase-runtime/runners", "GET", "Runtime orchestration endpoint"),
    ]
    
    results = []
    
    for endpoint, method, description in endpoints:
        try:
            url = f"{base_url}{endpoint}"
            if method == "GET":
                response = requests.get(url, timeout=5)
            elif method == "POST":
                response = requests.post(url, timeout=5)
            
            if response.status_code in [200, 201, 401, 403]:  # 401/403 are expected without auth
                print(f"✅ {description}: {response.status_code}")
                results.append(True)
            else:
                print(f"❌ {description}: {response.status_code}")
                results.append(False)
        except requests.exceptions.RequestException as e:
            print(f"⚠️  {description}: Connection error - {str(e)[:50]}")
            results.append(False)
    
    return results

def test_frontend_files():
    """Test that all new frontend files exist"""
    print("\n📱 TESTING FRONTEND FILES")
    print("=" * 40)
    
    frontend_files = [
        # CRM pages
        "/frontend/app/crm/page.tsx",
        "/frontend/app/crm/quotes/page.tsx", 
        "/frontend/app/crm/contacts/page.tsx",
        
        # Fleetbase pages
        "/frontend/app/fleetbase/drivers/page.tsx",
        "/frontend/app/fleetbase/vehicles/page.tsx",
        "/frontend/app/fleetbase/extensions/page.tsx",
        
        # Admin pages
        "/frontend/app/admin/runtime/page.tsx",
    ]
    
    results = []
    
    for file_path in frontend_files:
        full_path = f"/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform{file_path}"
        if os.path.exists(full_path):
            print(f"✅ {file_path}")
            results.append(True)
        else:
            print(f"❌ {file_path} - NOT FOUND")
            results.append(False)
    
    return results

def test_api_client():
    """Test that API client has new endpoints"""
    print("\n🔌 TESTING API CLIENT")
    print("=" * 40)
    
    api_client_path = "/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/frontend/lib/api.ts"
    
    if not os.path.exists(api_client_path):
        print("❌ API client file not found")
        return [False]
    
    with open(api_client_path, 'r') as f:
        content = f.read()
    
    required_exports = [
        "crmAPI",
        "vendorAPI", 
        "fleetbaseAPI",
        "getWalletTransactions",
    ]
    
    results = []
    
    for export in required_exports:
        if export in content:
            print(f"✅ {export} found in API client")
            results.append(True)
        else:
            print(f"❌ {export} NOT found in API client")
            results.append(False)
    
    return results

def test_backend_routes():
    """Test that backend routes exist"""
    print("\n🛣️  TESTING BACKEND ROUTES")
    print("=" * 40)
    
    backend_files = [
        "/app/api/routes/support_crm.py",
        "/app/api/routes/billing.py",
        "/app/api/routes/vendors.py",
        "/app/api/routes/fleetbase_runtime.py",
    ]
    
    required_methods = [
        ("support_crm.py", ["get_accounts", "get_contacts", "get_opportunities", "get_quotes"]),
        ("billing.py", ["get_wallet_transactions"]),
        ("vendors.py", ["getVendors"]),
        ("fleetbase_runtime.py", ["getRuntimes", "deployRuntime"]),
    ]
    
    results = []
    
    for file_name, methods in required_methods:
        file_path = f"/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform{file_name}"
        
        if not os.path.exists(file_path):
            print(f"❌ {file_name} - NOT FOUND")
            results.extend([False] * len(methods))
            continue
            
        with open(file_path, 'r') as f:
            content = f.read()
        
        for method in methods:
            if method in content or f"@router.get('{method.split('_')[1]}" in content:
                print(f"✅ {file_name}: {method}")
                results.append(True)
            else:
                print(f"❌ {file_name}: {method} - NOT FOUND")
                results.append(False)
    
    return results

def test_imports():
    """Test that all imports work correctly"""
    print("\n📦 TESTING IMPORTS")
    print("=" * 40)
    
    try:
        # Test billing imports
        from app.api.routes.billing import router as billing_router
        print("✅ Billing router imported")
        
        # Test CRM imports  
        from app.api.routes.support_crm import router as crm_router
        print("✅ CRM router imported")
        
        # Test vendor imports
        from app.api.routes.vendors import router as vendor_router
        print("✅ Vendor router imported")
        
        # Test runtime imports
        from app.api.routes.fleetbase_runtime import router as runtime_router
        print("✅ Runtime router imported")
        
        return [True, True, True, True]
        
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        return [False]

def main():
    """Run all smoke tests"""
    print("🚀 AFRUHERITAGE NEW FEATURES SMOKE TEST")
    print("=" * 50)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    all_results = []
    
    # Run all tests
    all_results.extend(test_api_endpoints())
    all_results.extend(test_frontend_files())
    all_results.extend(test_api_client())
    all_results.extend(test_backend_routes())
    all_results.extend(test_imports())
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 SMOKE TEST RESULTS")
    print("=" * 50)
    
    passed = sum(all_results)
    total = len(all_results)
    
    print(f"✅ PASSED: {passed}/{total}")
    print(f"❌ FAILED: {total - passed}/{total}")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! New features are ready.")
    else:
        print(f"\n⚠️  {total - passed} tests failed. Review the issues above.")
    
    print(f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
