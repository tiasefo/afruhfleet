#!/usr/bin/env python3
"""
Comprehensive System Assessment for Afruheritage Platform
Tests FastAPI, Fleetbase, and Admin Console integration
"""

import asyncio
import aiohttp
import json
import time
import sys
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class SystemComponent:
    name: str
    url: str
    port: int
    status: str
    response_time: float
    details: str
    error: Optional[str] = None

class ComprehensiveSystemAssessment:
    def __init__(self):
        self.components: Dict[str, SystemComponent] = {}
        self.test_results: List[Dict] = []
        
    async def test_component(self, name: str, url: str, port: int, test_paths: List[str] = None):
        """Test a system component"""
        print(f"🔍 Testing {name} on port {port}")
        
        component = SystemComponent(
            name=name,
            url=url,
            port=port,
            status="UNKNOWN",
            response_time=0,
            details=""
        )
        
        start_time = time.time()
        
        try:
            async with aiohttp.ClientSession() as session:
                # Test basic connectivity
                try:
                    async with session.get(f"{url}:{port}/", timeout=5) as resp:
                        component.status = "RUNNING" if resp.status == 200 else "ERROR"
                        component.response_time = time.time() - start_time
                        component.details = f"HTTP {resp.status}"
                except:
                    component.status = "DOWN"
                    component.response_time = time.time() - start_time
                    component.details = "Connection failed"
                
                # Test specific endpoints if provided
                if test_paths and component.status == "RUNNING":
                    endpoint_results = []
                    for path in test_paths:
                        try:
                            async with session.get(f"{url}:{port}{path}", timeout=5) as resp:
                                endpoint_results.append(f"{path}: {resp.status}")
                        except Exception as e:
                            endpoint_results.append(f"{path}: ERROR - {str(e)}")
                    
                    component.details += f" | Endpoints: {', '.join(endpoint_results)}"
                
        except Exception as e:
            component.status = "ERROR"
            component.response_time = time.time() - start_time
            component.error = str(e)
            component.details = f"Test failed: {str(e)}"
        
        self.components[name] = component
        print(f"   {'✅' if component.status == 'RUNNING' else '❌'} {name}: {component.status} ({component.response_time:.3f}s)")
        if component.error:
            print(f"      Error: {component.error}")
        
        return component

    async def test_fastapi_backend(self):
        """Test FastAPI backend functionality"""
        print("\n🔍 Testing FastAPI Backend (Port 8100)")
        
        component = await self.test_component(
            "FastAPI Backend",
            "http://localhost",
            8100,
            ["/health", "/docs", "/api/v1/auth/me"]
        )
        
        # Test API endpoints if running
        if component.status == "RUNNING":
            await self.test_fastapi_endpoints()

    async def test_fastapi_endpoints(self):
        """Test specific FastAPI endpoints"""
        print("\n🧪 Testing FastAPI Endpoints")
        
        endpoints = [
            ("Health Check", "/health", "GET"),
            ("API Root", "/api/v1", "GET"),
            ("Auth Bootstrap", "/api/v1/auth/bootstrap", "POST", {"email": "test@test.com", "password": "test123", "full_name": "Test User"}),
            ("Auth Login", "/api/v1/auth/login", "POST", {"username": "admin@afruheritage.com", "password": "Sumiasis243$"}),
            ("Vendor Registration", "/api/v1/vendors/register", "POST", {
                "business_name": "Test Transport",
                "business_type": "individual",
                "contact_name": "John Doe",
                "full_name": "John Doe",
                "email": "test@transport.com",
                "phone": "+233123456789",
                "address": "123 Test St",
                "city": "Accra",
                "country": "Ghana",
                "postal_code": "00233",
                "id_type": "national_id",
                "id_number": "1234567890123",
                "vehicle_types": ["truck"],
                "vehicle_reg_number": "GT-1234-56",
                "operating_regions": ["Greater Accra"]
            }),
            ("Tenant Creation", "/api/v1/tenants", "POST", {
                "name": "Test Tenant",
                "company_name": "Test Tenant Ltd",
                "subdomain": "testtenant",
                "plan_code": "professional",
                "email": "tenant@test.com",
                "contact_email": "tenant@test.com",
                "full_name": "Tenant Admin",
                "phone": "+233123456789",
                "business_type": "freight_forwarding",
                "company_size": "medium",
                "requested_domain": "testtenant.afruheritage.com",
                "domain_type": "custom"
            })
        ]
        
        async with aiohttp.ClientSession() as session:
            for name, path, method, *payload in endpoints:
                try:
                    start_time = time.time()
                    data = payload[0] if payload else None
                    
                    if method == "GET":
                        async with session.get(f"http://localhost:8100{path}") as resp:
                            status = resp.status
                            response_time = time.time() - start_time
                    elif method == "POST":
                        if data:
                            async with session.post(f"http://localhost:8100{path}", json=data) as resp:
                                status = resp.status
                                response_time = time.time() - start_time
                        else:
                            async with session.post(f"http://localhost:8100{path}") as resp:
                                status = resp.status
                                response_time = time.time() - start_time
                    
                    status_icon = "✅" if status in [200, 201] else "❌" if status in [400, 401, 404, 422] else "💥"
                    print(f"   {status_icon} {name}: HTTP {status} ({response_time:.3f}s)")
                    
                    self.test_results.append({
                        "component": "FastAPI Backend",
                        "test": name,
                        "status": status,
                        "response_time": response_time,
                        "method": method,
                        "path": path
                    })
                    
                except Exception as e:
                    print(f"   💥 {name}: ERROR - {str(e)}")
                    self.test_results.append({
                        "component": "FastAPI Backend",
                        "test": name,
                        "status": "ERROR",
                        "response_time": 0,
                        "method": method,
                        "path": path,
                        "error": str(e)
                    })

    async def test_fleetbase_backend(self):
        """Test Fleetbase backend functionality"""
        print("\n🔍 Testing Fleetbase Backend (Port 8004)")
        
        component = await self.test_component(
            "Fleetbase Backend",
            "http://localhost",
            8004,
            ["/api/v1", "/api/v1/auth/me"]
        )
        
        # Test Fleetbase endpoints if running
        if component.status == "RUNNING":
            await self.test_fleetbase_endpoints()

    async def test_fleetbase_endpoints(self):
        """Test specific Fleetbase endpoints"""
        print("\n🧪 Testing Fleetbase Endpoints")
        
        endpoints = [
            ("API Root", "/api/v1", "GET"),
            ("Auth Check", "/api/v1/auth/me", "GET"),
            ("Shipments", "/api/v1/shipments", "GET"),
            ("Users", "/api/v1/users", "GET"),
            ("Companies", "/api/v1/companies", "GET")
        ]
        
        async with aiohttp.ClientSession() as session:
            for name, path, method in endpoints:
                try:
                    start_time = time.time()
                    
                    if method == "GET":
                        async with session.get(f"http://localhost:8004{path}") as resp:
                            status = resp.status
                            response_time = time.time() - start_time
                    
                    status_icon = "✅" if status in [200, 201] else "❌" if status in [400, 401, 404, 422] else "💥"
                    print(f"   {status_icon} {name}: HTTP {status} ({response_time:.3f}s)")
                    
                    self.test_results.append({
                        "component": "Fleetbase Backend",
                        "test": name,
                        "status": status,
                        "response_time": response_time,
                        "method": method,
                        "path": path
                    })
                    
                except Exception as e:
                    print(f"   💥 {name}: ERROR - {str(e)}")
                    self.test_results.append({
                        "component": "Fleetbase Backend",
                        "test": name,
                        "status": "ERROR",
                        "response_time": 0,
                        "method": method,
                        "path": path,
                        "error": str(e)
                    })

    async def test_admin_console(self):
        """Test Admin Console functionality"""
        print("\n🔍 Testing Admin Console")
        
        # Test different admin console ports
        admin_ports = [3001, 4000, 4001]
        
        for port in admin_ports:
            component = await self.test_component(
                f"Admin Console (Port {port})",
                "http://localhost",
                port,
                ["/health", "/api/v1"]
            )
            
            if component.status == "RUNNING":
                break  # Found running admin console

    async def test_frontend_application(self):
        """Test Frontend Application"""
        print("\n🔍 Testing Frontend Application")
        
        component = await self.test_component(
            "Frontend Application",
            "http://localhost",
            3002,
            ["/", "/login", "/register", "/dashboard"]
        )

    async def test_database_connectivity(self):
        """Test database connectivity"""
        print("\n🔍 Testing Database Connectivity")
        
        databases = [
            ("PostgreSQL (Afruheritage)", "localhost", 5433),
            ("MySQL (Fleetbase)", "localhost", 3309),
            ("Redis (Afruheritage)", "localhost", 6380),
            ("Redis (Fleetbase)", "localhost", 6379)
        ]
        
        for name, host, port in databases:
            component = await self.test_component(
                name,
                f"http://{host}",
                port,
                []  # No HTTP endpoints for databases
            )

    async def test_docker_services(self):
        """Test Docker service health"""
        print("\n🔍 Testing Docker Services")
        
        # Get Docker container status
        import subprocess
        
        try:
            result = subprocess.run(
                ["docker", "ps", "--format", "table {{.Names}}\t{{.Status}}\t{{.Ports}}"],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                print("   ✅ Docker command successful")
                lines = result.stdout.strip().split('\n')
                for line in lines[1:]:  # Skip header
                    if line.strip():
                        parts = line.split('\t')
                        if len(parts) >= 2:
                            name, status = parts[0], parts[1]
                            status_icon = "✅" if "Up" in status else "❌"
                            print(f"   {status_icon} {name}: {status}")
            else:
                print("   ❌ Docker command failed")
                
        except Exception as e:
            print(f"   💥 Docker check failed: {str(e)}")

    async def run_comprehensive_assessment(self):
        """Run complete system assessment"""
        print("🚀 Starting Comprehensive System Assessment")
        print("=" * 60)
        
        # Test all system components
        await self.test_fastapi_backend()
        await self.test_fleetbase_backend()
        await self.test_admin_console()
        await self.test_frontend_application()
        await self.test_database_connectivity()
        await self.test_docker_services()
        
        # Generate comprehensive report
        self.generate_comprehensive_report()

    def generate_comprehensive_report(self):
        """Generate comprehensive assessment report"""
        print("\n" + "=" * 60)
        print("📊 COMPREHENSIVE SYSTEM ASSESSMENT REPORT")
        print("=" * 60)
        
        # Component Status Summary
        print(f"\n🏗️  COMPONENT STATUS:")
        for name, component in self.components.items():
            status_icon = "✅" if component.status == "RUNNING" else "❌" if component.status == "DOWN" else "💥"
            print(f"   {status_icon} {name}: {component.status} ({component.response_time:.3f}s)")
            if component.details:
                print(f"      📝 {component.details}")
            if component.error:
                print(f"      ⚠️  {component.error}")
        
        # API Test Results
        print(f"\n🧪 API TEST RESULTS:")
        fastapi_tests = [r for r in self.test_results if r["component"] == "FastAPI Backend"]
        fleetbase_tests = [r for r in self.test_results if r["component"] == "Fleetbase Backend"]
        
        if fastapi_tests:
            print(f"\n   FastAPI Backend ({len(fastapi_tests)} tests):")
            for test in fastapi_tests:
                status_icon = "✅" if test["status"] in [200, 201] else "❌" if test["status"] in [400, 401, 404, 422] else "💥"
                print(f"      {status_icon} {test['test']}: HTTP {test['status']} ({test['response_time']:.3f}s)")
        
        if fleetbase_tests:
            print(f"\n   Fleetbase Backend ({len(fleetbase_tests)} tests):")
            for test in fleetbase_tests:
                status_icon = "✅" if test["status"] in [200, 201] else "❌" if test["status"] in [400, 401, 404, 422] else "💥"
                print(f"      {status_icon} {test['test']}: HTTP {test['status']} ({test['response_time']:.3f}s)")
        
        # System Integration Analysis
        print(f"\n🔗 SYSTEM INTEGRATION:")
        
        # Check if core components are running
        fastapi_running = self.components.get("FastAPI Backend", SystemComponent("", "", 0, "", 0, "")).status == "RUNNING"
        fleetbase_running = self.components.get("Fleetbase Backend", SystemComponent("", "", 0, "", 0, "")).status == "RUNNING"
        admin_running = any("Admin Console" in name and comp.status == "RUNNING" for name, comp in self.components.items())
        frontend_running = self.components.get("Frontend Application", SystemComponent("", "", 0, "", 0, "")).status == "RUNNING"
        
        print(f"   FastAPI Backend: {'✅ Running' if fastapi_running else '❌ Down'}")
        print(f"   Fleetbase Backend: {'✅ Running' if fleetbase_running else '❌ Down'}")
        print(f"   Admin Console: {'✅ Running' if admin_running else '❌ Down'}")
        print(f"   Frontend Application: {'✅ Running' if frontend_running else '❌ Down'}")
        
        # Feature Functionality Assessment
        print(f"\n🎯 FEATURE FUNCTIONALITY:")
        
        # Assess authentication
        auth_tests = [t for t in fastapi_tests if "Auth" in t["test"]]
        auth_working = len([t for t in auth_tests if t["status"] in [200, 201]]) > 0
        print(f"   Authentication: {'✅ Working' if auth_working else '❌ Broken'}")
        
        # Assess vendor registration
        vendor_tests = [t for t in fastapi_tests if "Vendor" in t["test"]]
        vendor_working = len([t for t in vendor_tests if t["status"] in [200, 201]]) > 0
        print(f"   Vendor Registration: {'✅ Working' if vendor_working else '❌ Broken'}")
        
        # Assess tenant creation
        tenant_tests = [t for t in fastapi_tests if "Tenant" in t["test"]]
        tenant_working = len([t for t in tenant_tests if t["status"] in [200, 201]]) > 0
        print(f"   Tenant Creation: {'✅ Working' if tenant_working else '❌ Broken'}")
        
        # Overall System Health
        total_components = len(self.components)
        running_components = len([c for c in self.components.values() if c.status == "RUNNING"])
        system_health = (running_components / total_components) * 100 if total_components > 0 else 0
        
        print(f"\n📈 OVERALL SYSTEM HEALTH: {system_health:.1f}%")
        print(f"   Components Running: {running_components}/{total_components}")
        
        # Production Readiness
        print(f"\n🚀 PRODUCTION READINESS:")
        
        if system_health >= 80:
            print("   🟢 HIGH - System mostly operational")
        elif system_health >= 60:
            print("   🟡 MEDIUM - System partially operational")
        elif system_health >= 40:
            print("   🟠 LOW - System minimally operational")
        else:
            print("   🔴 CRITICAL - System not operational")
        
        # Critical Issues
        print(f"\n🚨 CRITICAL ISSUES:")
        
        if not fastapi_running:
            print("   ❌ FastAPI Backend is down - Core APIs unavailable")
        
        if not fleetbase_running:
            print("   ❌ Fleetbase Backend is down - Tenant runtime unavailable")
        
        if not admin_running:
            print("   ❌ Admin Console is down - Management interface unavailable")
        
        if not frontend_running:
            print("   ❌ Frontend Application is down - User interface unavailable")
        
        if not auth_working:
            print("   ❌ Authentication system broken - Users cannot login")
        
        # Save detailed report
        report_data = {
            "timestamp": datetime.now().isoformat(),
            "components": {
                name: {
                    "status": comp.status,
                    "response_time": comp.response_time,
                    "details": comp.details,
                    "error": comp.error
                } for name, comp in self.components.items()
            },
            "test_results": self.test_results,
            "system_health": system_health,
            "production_readiness": "HIGH" if system_health >= 80 else "MEDIUM" if system_health >= 60 else "LOW" if system_health >= 40 else "CRITICAL"
        }
        
        with open("/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/comprehensive_system_assessment_report.json", "w") as f:
            json.dump(report_data, f, indent=2)
        
        print(f"\n📄 Detailed report saved to: comprehensive_system_assessment_report.json")

async def main():
    """Main execution function"""
    assessor = ComprehensiveSystemAssessment()
    await assessor.run_comprehensive_assessment()

if __name__ == "__main__":
    asyncio.run(main())
