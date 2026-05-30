#!/usr/bin/env python3
"""
Deep Codebase Assessment - Backend/Frontend Alignment Analysis
"""

import sys
import os
import re
from pathlib import Path

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def extract_api_endpoints_from_backend():
    """Extract all API endpoints from backend route files"""
    print("🔍 BACKEND API ENDPOINTS ANALYSIS")
    print("=" * 60)
    
    backend_dir = Path("/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/app/api/routes")
    api_endpoints = {}
    
    for route_file in backend_dir.glob("*.py"):
        try:
            with open(route_file, 'r') as f:
                content = f.read()
            
            # Extract @router decorators
            router_patterns = [
                r'@router\.(get|post|put|delete|patch)\s*\([\'"]([^\'"]+)[\'"]',
                r'@router\.(get|post|put|delete|patch)\s*\(\s*[\'"]([^\'"]+)[\'"]',
            ]
            
            file_endpoints = []
            for pattern in router_patterns:
                matches = re.findall(pattern, content, re.MULTILINE)
                for method, path in matches:
                    file_endpoints.append(f"{method.upper()} {path}")
            
            if file_endpoints:
                api_endpoints[route_file.name] = file_endpoints
                print(f"\n📄 {route_file.name}:")
                for endpoint in file_endpoints:
                    print(f"  ✅ {endpoint}")
        
        except Exception as e:
            print(f"❌ Error reading {route_file}: {e}")
    
    return api_endpoints

def extract_api_calls_from_frontend():
    """Extract all API calls from frontend API client"""
    print("\n🔍 FRONTEND API CLIENT ANALYSIS")
    print("=" * 60)
    
    api_file = Path("/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/frontend/lib/api.ts")
    
    if not api_file.exists():
        print("❌ Frontend API client not found")
        return {}
    
    try:
        with open(api_file, 'r') as f:
            content = f.read()
        
        # Extract API method calls
        api_patterns = [
            r'api\.(get|post|put|delete|patch)\s*\(\s*[\'"]([^\'"]+)[\'"]',
            r'export\s+const\s+\w+Api\s*=\s*\{[^}]*\}',
        ]
        
        api_calls = []
        
        # Find all API exports
        api_exports = re.findall(r'export\s+const\s+(\w+Api)\s*=\s*\{([^}]+)\}', content, re.DOTALL)
        
        for api_name, api_body in api_exports:
            print(f"\n📦 {api_name}:")
            
            # Extract methods within this API
            method_patterns = re.findall(r'(\w+):\s*\([^)]*\)\s*=>\s*api\.(get|post|put|delete|patch)\s*\(\s*[\'"]([^\'"]+)[\'"]', api_body)
            
            for method_name, http_method, endpoint in method_patterns:
                full_endpoint = f"{http_method.upper()} {endpoint}"
                api_calls.append(f"{api_name}.{method_name} -> {full_endpoint}")
                print(f"  ✅ {method_name} -> {full_endpoint}")
        
        return api_calls
    
    except Exception as e:
        print(f"❌ Error reading frontend API client: {e}")
        return {}

def extract_frontend_pages():
    """Extract all frontend pages and their potential API usage"""
    print("\n🔍 FRONTEND PAGES ANALYSIS")
    print("=" * 60)
    
    frontend_dir = Path("/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/frontend/app")
    pages = {}
    
    for page_file in frontend_dir.glob("**/page.tsx"):
        try:
            with open(page_file, 'r') as f:
                content = f.read()
            
            # Look for API usage patterns
            api_usage_patterns = [
                r'(\w+Api)\.\w+\s*\(',
                r'api\.(get|post|put|delete|patch)\s*\(',
                r'useEffect.*api\.',
                r'fetch\s*\(\s*[\'"](/api/[^\'"]*)[\'"]',
            ]
            
            page_apis = []
            for pattern in api_usage_patterns:
                matches = re.findall(pattern, content, re.MULTILINE | re.DOTALL)
                if matches:
                    page_apis.extend(matches)
            
            if page_apis:
                page_path = str(page_file.relative_to(frontend_dir))
                pages[page_path] = page_apis
                print(f"\n📄 {page_path}:")
                for api in set(page_apis):  # Remove duplicates
                    print(f"  🔗 {api}")
        
        except Exception as e:
            print(f"❌ Error reading {page_file}: {e}")
    
    return pages

def analyze_backend_models():
    """Analyze backend models to understand data structures"""
    print("\n🔍 BACKEND MODELS ANALYSIS")
    print("=" * 60)
    
    models_dir = Path("/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/app/models")
    models = {}
    
    for model_file in models_dir.glob("*.py"):
        try:
            with open(model_file, 'r') as f:
                content = f.read()
            
            # Extract class definitions
            class_patterns = re.findall(r'class\s+(\w+)\s*\([^)]*\):', content)
            
            if class_patterns:
                models[model_file.name] = class_patterns
                print(f"\n📄 {model_file.name}:")
                for model in class_patterns:
                    print(f"  🏗️ {model}")
        
        except Exception as e:
            print(f"❌ Error reading {model_file}: {e}")
    
    return models

def check_main_py_routers():
    """Check which routers are included in main.py"""
    print("\n🔍 MAIN.PY ROUTER INCLUSIONS")
    print("=" * 60)
    
    main_file = Path("/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/app/main.py")
    
    if not main_file.exists():
        print("❌ main.py not found")
        return []
    
    try:
        with open(main_file, 'r') as f:
            content = f.read()
        
        # Extract router includes
        router_includes = re.findall(r'app\.include_router\(\s*(\w+)', content)
        
        print("\n📋 Included Routers:")
        for router in router_includes:
            print(f"  ✅ {router}")
        
        return router_includes
    
    except Exception as e:
        print(f"❌ Error reading main.py: {e}")
        return []

def identify_misalignments():
    """Identify misalignments between backend and frontend"""
    print("\n🔍 MISALIGNMENT ANALYSIS")
    print("=" * 60)
    
    misalignments = []
    
    # Check for missing frontend implementations
    backend_endpoints = extract_api_endpoints_from_backend()
    frontend_calls = extract_api_calls_from_frontend()
    frontend_pages = extract_frontend_pages()
    
    print("\n❌ POTENTIAL MISALIGNMENTS:")
    
    # Backend endpoints without frontend usage
    backend_routes = set()
    for file_name, endpoints in backend_endpoints.items():
        for endpoint in endpoints:
            method, path = endpoint.split(' ', 1)
            backend_routes.add(f"{method} {path}")
    
    frontend_routes = set()
    for call in frontend_calls:
        if '->' in call:
            route = call.split('-> ')[1]
            frontend_routes.add(route)
    
    missing_in_frontend = backend_routes - frontend_routes
    if missing_in_frontend:
        print(f"\n🚨 Backend endpoints not used in frontend ({len(missing_in_frontend)}):")
        for route in sorted(missing_in_frontend):
            print(f"  ❌ {route}")
    
    # Frontend pages without proper API integration
    pages_without_api = []
    for page_path, apis in frontend_pages.items():
        if not apis:
            pages_without_api.append(page_path)
    
    if pages_without_api:
        print(f"\n🚨 Frontend pages without API integration ({len(pages_without_api)}):")
        for page in pages_without_api:
            print(f"  ❌ {page}")
    
    return {
        'missing_in_frontend': list(missing_in_frontend),
        'pages_without_api': pages_without_api,
        'backend_endpoints_count': len(backend_routes),
        'frontend_endpoints_count': len(frontend_routes)
    }

def generate_alignment_report():
    """Generate comprehensive alignment report"""
    print("\n📊 COMPREHENSIVE ALIGNMENT REPORT")
    print("=" * 80)
    
    # Collect all data
    backend_endpoints = extract_api_endpoints_from_backend()
    frontend_calls = extract_api_calls_from_frontend()
    frontend_pages = extract_frontend_pages()
    backend_models = analyze_backend_models()
    main_routers = check_main_py_routers()
    misalignments = identify_misalignments()
    
    # Summary statistics
    total_backend_files = len(backend_endpoints)
    total_backend_endpoints = sum(len(endpoints) for endpoints in backend_endpoints.values())
    total_frontend_apis = len(frontend_calls)
    total_frontend_pages = len(frontend_pages)
    
    print(f"\n📈 SUMMARY STATISTICS:")
    print(f"  📁 Backend route files: {total_backend_files}")
    print(f"  🔗 Backend endpoints: {total_backend_endpoints}")
    print(f"  📱 Frontend API calls: {total_frontend_apis}")
    print(f"  📄 Frontend pages: {total_frontend_pages}")
    print(f"  🏗️ Backend models: {sum(len(models) for models in backend_models.values())}")
    print(f"  🔌 Main.py routers: {len(main_routers)}")
    
    print(f"\n🚨 MISALIGNMENT METRICS:")
    print(f"  ❌ Missing frontend implementations: {len(misalignments['missing_in_frontend'])}")
    print(f"  ❌ Pages without API integration: {len(misalignments['pages_without_api'])}")
    alignment_rate = (misalignments['frontend_endpoints_count'] / max(misalignments['backend_endpoints_count'], 1)) * 100
    print(f"  📊 Backend-Frontend alignment: {alignment_rate:.1f}%")
    
    return {
        'backend_endpoints': backend_endpoints,
        'frontend_calls': frontend_calls,
        'frontend_pages': frontend_pages,
        'backend_models': backend_models,
        'main_routers': main_routers,
        'misalignments': misalignments,
        'statistics': {
            'backend_files': total_backend_files,
            'backend_endpoints': total_backend_endpoints,
            'frontend_apis': total_frontend_apis,
            'frontend_pages': total_frontend_pages,
            'alignment_rate': alignment_rate
        }
    }

def main():
    """Run comprehensive codebase assessment"""
    print("🔍 DEEP CODEBASE ASSESSMENT")
    print("=" * 80)
    print("Analyzing backend-frontend alignment and API connections...")
    
    report = generate_alignment_report()
    
    # Save detailed report
    report_file = "/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/codebase_alignment_report.json"
    try:
        import json
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        print(f"\n💾 Detailed report saved to: {report_file}")
    except Exception as e:
        print(f"❌ Error saving report: {e}")
    
    print(f"\n🎯 ASSESSMENT COMPLETE")
    print(f"Review the output above for detailed misalignment analysis.")

if __name__ == "__main__":
    main()
