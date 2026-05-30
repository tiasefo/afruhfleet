#!/usr/bin/env python3
"""
Implementation Test for New Features
Tests the actual code implementation without API calls
"""

import sys
import os
import ast

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_billing_wallet_transactions():
    """Test billing wallet transactions implementation"""
    print("💰 TESTING BILLING WALLET TRANSACTIONS")
    print("=" * 40)
    
    billing_file = "/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/app/api/routes/billing.py"
    
    if not os.path.exists(billing_file):
        print("❌ Billing file not found")
        return False
    
    with open(billing_file, 'r') as f:
        content = f.read()
    
    # Check for wallet transactions endpoint
    if "wallets/{tenant_id}/transactions" in content:
        print("✅ Wallet transactions endpoint exists")
    else:
        print("❌ Wallet transactions endpoint missing")
        return False
    
    # Check for the GET method
    if "@router.get('/wallets/{tenant_id}/transactions'" in content:
        print("✅ Wallet transactions GET method exists")
    else:
        print("❌ Wallet transactions GET method missing")
        return False
    
    return True

def test_crm_endpoints():
    """Test CRM endpoints implementation"""
    print("\n🤝 TESTING CRM ENDPOINTS")
    print("=" * 40)
    
    crm_file = "/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/app/api/routes/support_crm.py"
    
    if not os.path.exists(crm_file):
        print("❌ CRM file not found")
        return False
    
    with open(crm_file, 'r') as f:
        content = f.read()
    
    required_endpoints = [
        ("accounts", "GET"),
        ("contacts", "GET"), 
        ("opportunities", "GET"),
        ("quotes", "GET"),
    ]
    
    results = []
    
    for endpoint, method in required_endpoints:
        pattern = f"@router.{method.lower()}'/{endpoint}'"
        if pattern in content:
            print(f"✅ {method} /{endpoint} endpoint exists")
            results.append(True)
        else:
            print(f"❌ {method} /{endpoint} endpoint missing")
            results.append(False)
    
    return all(results)

def test_frontend_api_client():
    """Test frontend API client implementation"""
    print("\n🔌 TESTING FRONTEND API CLIENT")
    print("=" * 40)
    
    api_file = "/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/frontend/lib/api.ts"
    
    if not os.path.exists(api_file):
        print("❌ API client file not found")
        return False
    
    with open(api_file, 'r') as f:
        content = f.read()
    
    required_methods = [
        ("crmAPI", ["getAccounts", "getContacts", "getOpportunities", "getQuotes"]),
        ("vendorAPI", ["getVendors", "createVendor"]),
        ("fleetbaseAPI", ["getRuntimes", "deployRuntime"]),
        ("billingAPI", ["getWalletTransactions"]),
    ]
    
    results = []
    
    for api_name, methods in required_methods:
        if f"export const {api_name}" in content:
            print(f"✅ {api_name} exported")
            
            for method in methods:
                if method in content:
                    print(f"  ✅ {method} method exists")
                    results.append(True)
                else:
                    print(f"  ❌ {method} method missing")
                    results.append(False)
        else:
            print(f"❌ {api_name} not exported")
            results.extend([False] * len(methods))
    
    return all(results)

def test_frontend_pages():
    """Test frontend pages implementation"""
    print("\n📱 TESTING FRONTEND PAGES")
    print("=" * 40)
    
    pages = [
        "/frontend/app/crm/page.tsx",
        "/frontend/app/crm/quotes/page.tsx",
        "/frontend/app/crm/contacts/page.tsx", 
        "/frontend/app/fleetbase/drivers/page.tsx",
        "/frontend/app/fleetbase/vehicles/page.tsx",
        "/frontend/app/fleetbase/extensions/page.tsx",
        "/frontend/app/admin/runtime/page.tsx",
    ]
    
    results = []
    
    for page in pages:
        full_path = f"/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform{page}"
        
        if os.path.exists(full_path):
            print(f"✅ {page}")
            
            # Check if it's a proper React component
            with open(full_path, 'r') as f:
                content = f.read()
            
            if "export default function" in content or "export default" in content:
                print(f"  ✅ React component exported")
                results.append(True)
            else:
                print(f"  ❌ React component not exported")
                results.append(False)
        else:
            print(f"❌ {page} - NOT FOUND")
            results.append(False)
    
    return all(results)

def test_billing_page():
    """Test billing page has wallet transactions"""
    print("\n💳 TESTING BILLING PAGE")
    print("=" * 40)
    
    billing_page = "/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/frontend/app/billing/page.tsx"
    
    if not os.path.exists(billing_page):
        print("❌ Billing page not found")
        return False
    
    with open(billing_page, 'r') as f:
        content = f.read()
    
    required_features = [
        ("walletTransactions", "Wallet transactions state"),
        ("showTransactionsModal", "Transaction modal state"),
        ("getWalletTransactions", "API call"),
        ("Transaction History", "Transaction history button"),
        ("Dialog open={showTransactionsModal}", "Transaction modal"),
    ]
    
    results = []
    
    for feature, description in required_features:
        if feature in content:
            print(f"✅ {description}")
            results.append(True)
        else:
            print(f"❌ {description} missing")
            results.append(False)
    
    return all(results)

def test_imports():
    """Test that all required imports exist"""
    print("\n📦 TESTING IMPORTS")
    print("=" * 40)
    
    try:
        # Test backend imports
        from app.api.routes.billing import router as billing_router
        print("✅ Billing router imported")
        
        from app.api.routes.support_crm import router as crm_router  
        print("✅ CRM router imported")
        
        from app.api.routes.vendors import router as vendor_router
        print("✅ Vendor router imported")
        
        from app.api.routes.fleetbase_runtime import router as runtime_router
        print("✅ Runtime router imported")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        return False

def main():
    """Run all implementation tests"""
    print("🔍 AFRUHERITAGE IMPLEMENTATION TEST")
    print("=" * 50)
    
    tests = [
        ("Billing Wallet Transactions", test_billing_wallet_transactions),
        ("CRM Endpoints", test_crm_endpoints),
        ("Frontend API Client", test_frontend_api_client),
        ("Frontend Pages", test_frontend_pages),
        ("Billing Page", test_billing_page),
        ("Imports", test_imports),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append(result)
        except Exception as e:
            print(f"❌ {test_name} failed: {e}")
            results.append(False)
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 IMPLEMENTATION TEST RESULTS")
    print("=" * 50)
    
    passed = sum(results)
    total = len(results)
    
    print(f"✅ PASSED: {passed}/{total}")
    print(f"❌ FAILED: {total - passed}/{total}")
    
    if passed == total:
        print("\n🎉 ALL IMPLEMENTATION TESTS PASSED!")
    else:
        print(f"\n⚠️  {total - passed} tests failed.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
