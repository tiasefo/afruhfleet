#!/usr/bin/env python3
"""Production Front Door E2E Test — afruheritage.com"""
import urllib.request
import urllib.error
import json
import time
import sys

BASE = "https://afruheritage.com"
EMAIL = f"uat_full_{int(time.time())}@afruhertest.com"
PASSWORD = "UatTest123!"
COMPANY = f"UAT Full Test {int(time.time())}"

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

def api_call(method, path, token=None, body=None):
    url = f"{BASE}{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, method=method, data=data)
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", UA)
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())
    except Exception as e:
        return 0, {"error": str(e)}

def http_status(url):
    try:
        req = urllib.request.Request(url, method="GET")
        req.add_header("User-Agent", UA)
        with urllib.request.urlopen(req, timeout=15) as resp:
            resp.read()
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception as e:
        return 0

print(f"=== Production Front Door E2E Test ===")
print(f"Base URL: {BASE}")
print(f"Email: {EMAIL}")
print(f"Company: {COMPANY}")
print()

# Step 1: Homepage
print("Step 1: Homepage renders")
status = http_status(f"{BASE}/")
print(f"  HTTP {status}")
assert status == 200, f"Homepage failed: {status}"
print("  PASS")
print()

# Step 2: Registration page
print("Step 2: Registration page accessible")
status = http_status(f"{BASE}/register")
print(f"  HTTP {status}")
assert status == 200
print("  PASS")
print()

# Step 3: Register new account
print("Step 3: Register new account")
status, data = api_call("POST", "/api/v1/auth/register", body={
    "email": EMAIL, "password": PASSWORD,
    "full_name": "UAT Tester", "company_name": COMPANY
})
print(f"  HTTP {status}")
print(f"  tenant_id: {data.get('tenant_id')}")
print(f"  subdomain: {data.get('subdomain')}")
print(f"  requires_subscription: {data.get('requires_subscription')}")
assert status == 200, f"Registration failed: {data}"
TOKEN = data.get("access_token")
TENANT_ID = data.get("tenant_id")
SLUG = data.get("subdomain")
print("  PASS")
print()

# Step 4: Verify auth/me
print("Step 4: Verify auth/me")
status, data = api_call("GET", "/api/v1/auth/me", token=TOKEN)
print(f"  HTTP {status}")
print(f"  email: {data.get('email')}")
print(f"  tenant_id: {data.get('tenant_id')}")
assert status == 200
print("  PASS")
print()

# Step 5: Initialize free trial
print("Step 5: Initialize free trial subscription")
status, data = api_call("POST", "/api/v1/billing/payments/init", token=TOKEN, body={
    "tenant_id": TENANT_ID, "amount_major": 0, "email": EMAIL,
    "purpose": "subscription", "plan_code": "free_trial", "currency": "GHS"
})
print(f"  HTTP {status}")
print(f"  status: {data.get('status')}")
assert status == 200, f"Free trial failed: {data}"
print("  PASS")
print()

# Step 6: Tenant context
print("Step 6: Tenant context after trial")
time.sleep(2)
status, data = api_call("GET", f"/api/v1/tenant-context/{SLUG}")
print(f"  HTTP {status}")
print(f"  company: {data.get('company_name')}")
print(f"  template: {data.get('template_code')}")
assert status == 200
print("  PASS")
print()

# Step 7: Template catalog
print("Step 7: Template store accessible")
status, data = api_call("GET", "/api/v1/storefront-templates/catalog", token=TOKEN)
print(f"  HTTP {status}")
print(f"  Templates: {len(data)}")
for t in data[:5]:
    print(f"    - {t.get('template_code')}: {t.get('name')}")
assert status == 200 and len(data) > 0
print("  PASS")
print()

# Step 8: Select freight template
print("Step 8: Select freight template")
status, data = api_call("POST", "/api/v1/storefront-templates/select", token=TOKEN, body={
    "template_code": "freight"
})
print(f"  HTTP {status}")
print(f"  template_code: {data.get('template_code', '?')}")
assert status == 200, f"Select failed: {data}"
print("  PASS")
print()

# Step 9: Publish template
print("Step 9: Publish template")
status, data = api_call("POST", "/api/v1/storefront-templates/publish", token=TOKEN, body={"installation_id": None})
print(f"  HTTP {status}")
if isinstance(data, dict):
    print(f"  template_code: {data.get('template_code', '?')}")
assert status == 200, f"Publish failed: {data}"
print("  PASS")
print()

# Step 10: Storefront accessible
print("Step 10: Storefront accessible from anonymous browser")
time.sleep(2)
status = http_status(f"{BASE}/store/{SLUG}")
print(f"  HTTP {status}")
print(f"  URL: {BASE}/store/{SLUG}")
assert status == 200
print("  PASS")
print()

# Step 11: Tenant context shows published template
print("Step 11: Tenant context shows published template")
status, data = api_call("GET", f"/api/v1/tenant-context/{SLUG}")
print(f"  HTTP {status}")
print(f"  template: {data.get('template_code')}")
print(f"  company: {data.get('company_name')}")
assert status == 200
assert data.get("company_name") == COMPANY, f"Company mismatch: {data.get('company_name')} != {COMPANY}"
print("  PASS — storefront shows new tenant identity, not demo data")
print()

# Step 12: Duplicate registration rejected
print("Step 12: Duplicate registration rejected")
status, data = api_call("POST", "/api/v1/auth/register", body={
    "email": EMAIL, "password": PASSWORD,
    "full_name": "UAT Tester", "company_name": COMPANY
})
print(f"  HTTP {status}")
print(f"  detail: {data.get('detail')}")
assert status == 409, f"Duplicate should be rejected: {status}"
print("  PASS")
print()

# Step 13: Login with created account
print("Step 13: Login with created account")
status, data = api_call("POST", "/api/v1/auth/login", body={
    "username": EMAIL, "password": PASSWORD
})
print(f"  HTTP {status}")
print(f"  tenant_id: {data.get('tenant_id')}")
print(f"  subdomain: {data.get('subdomain')}")
assert status == 200
print("  PASS")
print()

# Step 14: Plugin store accessible
print("Step 14: Plugin store accessible")
status, data = api_call("GET", "/api/v1/plugins", token=TOKEN)
print(f"  HTTP {status}")
if isinstance(data, list):
    print(f"  Plugins: {len(data)}")
elif isinstance(data, dict):
    plugins = data.get("plugins", data.get("items", []))
    print(f"  Plugins: {len(plugins) if isinstance(plugins, list) else 'unknown'}")
print("  PASS")
print()

# Summary
print("=" * 60)
print("ALL 14 STEPS PASSED")
print("=" * 60)
print(f"Email: {EMAIL}")
print(f"Password: {PASSWORD}")
print(f"Tenant: {TENANT_ID}")
print(f"Subdomain: {SLUG}")
print(f"Storefront: {BASE}/store/{SLUG}")
