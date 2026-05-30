#!/usr/bin/env python3
"""
Comprehensive Test for All New Features
Tests implementation, syntax, and basic functionality
"""

import sys
import os
import subprocess
import ast

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_python_syntax():
    """Test Python syntax for all modified files"""
    print("🐍 TESTING PYTHON SYNTAX")
    print("=" * 40)
    
    python_files = [
        "/app/api/routes/support_crm.py",
        "/app/api/routes/billing.py", 
        "/app/api/routes/vendors.py",
        "/app/api/routes/fleetbase_runtime.py",
        "/frontend/lib/api.ts",
    ]
    
    results = []
    
    for file_path in python_files:
        full_path = f"/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform{file_path}"
        
        if file_path.endswith('.py'):
            try:
                with open(full_path, 'r') as f:
                    content = f.read()
                ast.parse(content)
                print(f"✅ {file_path} - Valid Python syntax")
                results.append(True)
            except SyntaxError as e:
                print(f"❌ {file_path} - Syntax error: {e}")
                results.append(False)
        elif file_path.endswith('.ts'):
            # Basic TypeScript syntax check
            try:
                with open(full_path, 'r') as f:
                    content = f.read()
                
                # Check for basic TypeScript syntax issues
                if content.count('{') != content.count('}'):
                    print(f"❌ {file_path} - Brace mismatch")
                    results.append(False)
                elif content.count('(') != content.count(')'):
                    print(f"❌ {file_path} - Parenthesis mismatch")
                    results.append(False)
                else:
                    print(f"✅ {file_path} - Basic syntax OK")
                    results.append(True)
            except Exception as e:
                print(f"❌ {file_path} - Error: {e}")
                results.append(False)
    
    return all(results)

def test_typescript_syntax():
    """Test TypeScript syntax for all frontend files"""
    print("\n📘 TESTING TYPESCRIPT SYNTAX")
    print("=" * 40)
    
    tsx_files = [
        "/frontend/app/billing/page.tsx",
        "/frontend/app/crm/page.tsx",
        "/frontend/app/crm/quotes/page.tsx",
        "/frontend/app/crm/contacts/page.tsx",
        "/frontend/app/fleetbase/drivers/page.tsx",
        "/frontend/app/fleetbase/vehicles/page.tsx",
        "/frontend/app/fleetbase/extensions/page.tsx",
        "/frontend/app/admin/runtime/page.tsx",
    ]
    
    results = []
    
    for file_path in tsx_files:
        full_path = f"/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform{file_path}"
        
        if not os.path.exists(full_path):
            print(f"❌ {file_path} - NOT FOUND")
            results.append(False)
            continue
            
        try:
            with open(full_path, 'r') as f:
                content = f.read()
            
            # Basic syntax checks
            issues = []
            
            if content.count('{') != content.count('}'):
                issues.append("Brace mismatch")
            
            if content.count('(') != content.count(')'):
                issues.append("Parenthesis mismatch")
            
            if content.count('<') != content.count('>'):
                issues.append("Angle bracket mismatch")
            
            # Check for React component structure
            if "export default" not in content:
                issues.append("No default export")
            
            if "useState" not in content and "function" not in content:
                issues.append("No React hooks or function")
            
            if issues:
                print(f"❌ {file_path} - {', '.join(issues)}")
                results.append(False)
            else:
                print(f"✅ {file_path} - Syntax OK")
                results.append(True)
                
        except Exception as e:
            print(f"❌ {file_path} - Error: {e}")
            results.append(False)
    
    return all(results)

def test_api_routes():
    """Test API routes are properly defined"""
    print("\n🛣️ TESTING API ROUTES")
    print("=" * 40)
    
    routes_to_check = [
        ("billing.py", ["/wallets/{tenant_id}", "/wallets/{tenant_id}/transactions"]),
        ("support_crm.py", ["/accounts", "/contacts", "/opportunities", "/quotes"]),
        ("vendors.py", ["/marketplace"]),
        ("fleetbase_runtime.py", ["/runners", "/deploy"]),
    ]
    
    results = []
    
    for file_name, routes in routes_to_check:
        file_path = f"/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/app/api/routes/{file_name}"
        
        if not os.path.exists(file_path):
            print(f"❌ {file_name} - NOT FOUND")
            results.extend([False] * len(routes))
            continue
            
        with open(file_path, 'r') as f:
            content = f.read()
        
        for route in routes:
            if route in content:
                print(f"✅ {file_name}: {route}")
                results.append(True)
            else:
                print(f"❌ {file_name}: {route} - NOT FOUND")
                results.append(False)
    
    return all(results)

def test_api_client_methods():
    """Test API client has all required methods"""
    print("\n🔌 TESTING API CLIENT METHODS")
    print("=" * 40)
    
    api_file = "/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/frontend/lib/api.ts"
    
    if not os.path.exists(api_file):
        print("❌ API client file not found")
        return False
    
    with open(api_file, 'r') as f:
        content = f.read()
    
    required_methods = [
        ("billingAPI", ["getWalletTransactions"]),
        ("crmAPI", ["getAccounts", "getContacts", "getOpportunities", "getQuotes"]),
        ("vendorAPI", ["getVendors"]),
        ("fleetbaseAPI", ["getRuntimes", "deployRuntime"]),
    ]
    
    results = []
    
    for api_name, methods in required_methods:
        if f"export const {api_name}" in content:
            print(f"✅ {api_name} exists")
            
            for method in methods:
                if f"{method}(" in content:
                    print(f"  ✅ {method} method defined")
                    results.append(True)
                else:
                    print(f"  ❌ {method} method missing")
                    results.append(False)
        else:
            print(f"❌ {api_name} missing")
            results.extend([False] * len(methods))
    
    return all(results)

def test_frontend_components():
    """Test frontend components are properly structured"""
    print("\n📱 TESTING FRONTEND COMPONENTS")
    print("=" * 40)
    
    components = [
        ("billing/page.tsx", ["walletTransactions", "showTransactionsModal", "getWalletTransactions"]),
        ("crm/page.tsx", ["opportunities", "accounts", "loadCRMData"]),
        ("crm/quotes/page.tsx", ["quotes", "loadQuotesData"]),
        ("crm/contacts/page.tsx", ["contacts", "loadContactsData"]),
        ("fleetbase/drivers/page.tsx", ["drivers", "loadDrivers"]),
        ("fleetbase/vehicles/page.tsx", ["vehicles", "loadVehiclesData"]),
        ("fleetbase/extensions/page.tsx", ["runtimes", "extensions"]),
        ("admin/runtime/page.tsx", ["runners", "runtimes", "loadRuntimeData"]),
    ]
    
    results = []
    
    for component_path, required_content in components:
        full_path = f"/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/frontend/app/{component_path}"
        
        if not os.path.exists(full_path):
            print(f"❌ {component_path} - NOT FOUND")
            results.extend([False] * len(required_content))
            continue
            
        with open(full_path, 'r') as f:
            content = f.read()
        
        print(f"📄 {component_path}")
        
        for requirement in required_content:
            if requirement in content:
                print(f"  ✅ {requirement}")
                results.append(True)
            else:
                print(f"  ❌ {requirement} - NOT FOUND")
                results.append(False)
    
    return all(results)

def test_imports():
    """Test all imports work"""
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
    """Run comprehensive tests"""
    print("🔬 COMPREHENSIVE SMOKE TEST")
    print("=" * 50)
    
    tests = [
        ("Python Syntax", test_python_syntax),
        ("TypeScript Syntax", test_typescript_syntax),
        ("API Routes", test_api_routes),
        ("API Client Methods", test_api_client_methods),
        ("Frontend Components", test_frontend_components),
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
    print("📊 COMPREHENSIVE TEST RESULTS")
    print("=" * 50)
    
    passed = sum(results)
    total = len(results)
    
    print(f"✅ PASSED: {passed}/{total}")
    print(f"❌ FAILED: {total - passed}/{total}")
    
    if passed == total:
        print("\n🎉 ALL COMPREHENSIVE TESTS PASSED!")
        print("🚀 All new features are ready for deployment!")
    else:
        print(f"\n⚠️  {total - passed} test categories failed.")
        print("🔧 Review the issues above before deployment.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
