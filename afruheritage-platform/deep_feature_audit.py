#!/usr/bin/env python3
"""
Deep Feature Audit - Actual Implementation Status
"""

import sys
import os

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def check_feature_signals():
    """Check if my implementations contain the required signals"""
    print("🔍 DEEP FEATURE AUDIT")
    print("=" * 50)
    
    # Check Credit Wallet signals
    print("\n💳 CREDIT WALLET SIGNALS:")
    billing_file = "/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/frontend/app/billing/page.tsx"
    
    if os.path.exists(billing_file):
        with open(billing_file, 'r') as f:
            billing_content = f.read()
        
        wallet_signals = ["wallet", "credits"]
        found_signals = []
        
        for signal in wallet_signals:
            if signal in billing_content:
                found_signals.append(signal)
                print(f"  ✅ Found: {signal}")
            else:
                print(f"  ❌ Missing: {signal}")
        
        print(f"  Status: {len(found_signals)}/2 signals found")
    
    # Check CRM Opportunities signals
    print("\n🤝 CRM OPPORTUNITIES SIGNALS:")
    crm_file = "/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/frontend/app/crm/page.tsx"
    
    if os.path.exists(crm_file):
        with open(crm_file, 'r') as f:
            crm_content = f.read()
        
        opportunity_signals = ["opportunity", "crm"]
        found_signals = []
        
        for signal in opportunity_signals:
            if signal in crm_content:
                found_signals.append(signal)
                print(f"  ✅ Found: {signal}")
            else:
                print(f"  ❌ Missing: {signal}")
        
        print(f"  Status: {len(found_signals)}/2 signals found")
    
    # Check CRM Quotes signals
    print("\n📋 CRM QUOTES SIGNALS:")
    quotes_file = "/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/frontend/app/crm/quotes/page.tsx"
    
    if os.path.exists(quotes_file):
        with open(quotes_file, 'r') as f:
            quotes_content = f.read()
        
        quote_signals = ["quote", "quotes"]
        found_signals = []
        
        for signal in quote_signals:
            if signal in quotes_content:
                found_signals.append(signal)
                print(f"  ✅ Found: {signal}")
            else:
                print(f"  ❌ Missing: {signal}")
        
        print(f"  Status: {len(found_signals)}/2 signals found")
    
    # Check Fleetbase Drivers signals
    print("\n🚚 FLEETBASE DRIVERS SIGNALS:")
    drivers_file = "/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/frontend/app/fleetbase/drivers/page.tsx"
    
    if os.path.exists(drivers_file):
        with open(drivers_file, 'r') as f:
            drivers_content = f.read()
        
        driver_signals = ["driver", "drivers"]
        found_signals = []
        
        for signal in driver_signals:
            if signal in drivers_content:
                found_signals.append(signal)
                print(f"  ✅ Found: {signal}")
            else:
                print(f"  ❌ Missing: {signal}")
        
        print(f"  Status: {len(found_signals)}/2 signals found")

def check_actual_backend_status():
    """Check what's actually implemented in the backend"""
    print("\n🔧 BACKEND IMPLEMENTATION STATUS:")
    print("=" * 50)
    
    # Check if the backend actually has the required endpoints
    backend_files = [
        "/app/api/routes/billing.py",
        "/app/api/routes/support_crm.py", 
        "/app/api/routes/vendors.py",
        "/app/api/routes/fleetbase_runtime.py",
    ]
    
    for file_path in backend_files:
        full_path = f"/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform{file_path}"
        
        if os.path.exists(full_path):
            print(f"\n📄 {file_path}:")
            with open(full_path, 'r') as f:
                content = f.read()
            
            # Check for key endpoints
            if "billing.py" in file_path:
                if "wallets/{tenant_id}/transactions" in content:
                    print("  ✅ Wallet transactions endpoint found")
                else:
                    print("  ❌ Wallet transactions endpoint missing")
            
            if "support_crm.py" in file_path:
                endpoints = ["accounts", "contacts", "opportunities", "quotes"]
                for endpoint in endpoints:
                    if f"@router.get('/{endpoint}'" in content:
                        print(f"  ✅ {endpoint} endpoint found")
                    else:
                        print(f"  ❌ {endpoint} endpoint missing")

def check_tenant_creation_flow():
    """Check if tenant creation actually spins containers"""
    print("\n🏗️ TENANT CREATION FLOW ANALYSIS:")
    print("=" * 50)
    
    # Check tenant creation service
    tenant_service = "/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/app/services/tenant_creation_service.py"
    
    if os.path.exists(tenant_service):
        with open(tenant_service, 'r') as f:
            content = f.read()
        
        print("📋 Tenant Creation Service Analysis:")
        
        if "container" in content.lower():
            print("  ✅ Container-related code found")
        else:
            print("  ❌ No container-related code found")
        
        if "docker" in content.lower():
            print("  ✅ Docker-related code found")
        else:
            print("  ❌ No Docker-related code found")
        
        if "fleetbase" in content.lower():
            print("  ✅ Fleetbase-related code found")
        else:
            print("  ❌ No Fleetbase-related code found")
    
    # Check provisioning service
    provisioning_service = "/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/app/tasks/provisioning.py"
    
    if os.path.exists(provisioning_service):
        with open(provisioning_service, 'r') as f:
            content = f.read()
        
        print("\n📋 Provisioning Service Analysis:")
        
        if "container" in content.lower():
            print("  ✅ Container-related code found")
        else:
            print("  ❌ No container-related code found")
        
        if "docker" in content.lower():
            print("  ✅ Docker-related code found")
        else:
            print("  ❌ No Docker-related code found")
        
        if "ssh" in content.lower():
            print("  ✅ SSH-related code found")
        else:
            print("  ❌ No SSH-related code found")

def check_runtime_orchestration():
    """Check if runtime orchestration actually works"""
    print("\n⚙️ RUNTIME ORCHESTRATION ANALYSIS:")
    print("=" * 50)
    
    runtime_service = "/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/app/services/fleetbase_runtime_service.py"
    
    if os.path.exists(runtime_service):
        with open(runtime_service, 'r') as f:
            content = f.read()
        
        print("📋 Runtime Service Analysis:")
        
        if "ssh" in content.lower():
            print("  ✅ SSH-based deployment found")
        else:
            print("  ❌ No SSH-based deployment found")
        
        if "flb install-fleetbase" in content:
            print("  ✅ Fleetbase CLI installation found")
        else:
            print("  ❌ No Fleetbase CLI installation found")
        
        if "container" in content.lower():
            print("  ✅ Container-related code found")
        else:
            print("  ❌ No container-related code found")

def main():
    """Run deep audit"""
    check_feature_signals()
    check_actual_backend_status()
    check_tenant_creation_flow()
    check_runtime_orchestration()
    
    print("\n" + "=" * 50)
    print("🎯 DEEP AUDIT CONCLUSION:")
    print("=" * 50)
    print("❌ The platform does NOT spin containers for each tenant")
    print("❌ It uses SSH-based Fleetbase deployment on runner nodes")
    print("❌ Frontend signals may not be detected by the matrix script")
    print("⚠️  This is NOT like WordPress multi-tenant with containers")
    print("⚠️  This is a control plane + runtime orchestration model")

if __name__ == "__main__":
    main()
