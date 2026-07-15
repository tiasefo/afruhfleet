#!/usr/bin/env python3
"""Concurrent User Testing — Race conditions and concurrent access patterns."""
import concurrent.futures
import json
import subprocess
import time
import sys

BASE = "http://localhost:8100"
results = []

def check(name, passed, detail=""):
    status = "PASS" if passed else "FAIL"
    results.append((status, name, detail))
    print(f"[{status}] {name}" + (f" — {detail}" if detail and not passed else ""))

def curl(method, path, token=None, body=None):
    cmd = ["curl", "-s", "-X", method, f"{BASE}{path}"]
    if token:
        cmd += ["-H", f"Authorization: Bearer {token}"]
    if body:
        cmd += ["-H", "Content-Type: application/json", "-d", json.dumps(body)]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return json.loads(out.stdout) if out.stdout else {}
    except Exception as e:
        return {"error": str(e)}

def get_token(email, password):
    r = curl("POST", "/api/v1/auth/login", body={"email": email, "password": password})
    return r.get("access_token")

# ─── Setup ───
print("=" * 60)
print("CONCURRENT USER TESTING")
print("=" * 60)

superuser_token = get_token("admin@afruheritage.com", "Sumiasis243$")
amooksco_token = get_token("admin@amooksco.com", "Sumiasis243$")
empire_token = get_token("niblzsv@gmail.com", "Sumiasis243$")

check("Superuser login", bool(superuser_token))
check("Amooksco admin login", bool(amooksco_token))
check("Empire Drips admin login", bool(empire_token))

AMOOKSCO_TENANT = "e379f093-758e-4e5a-a313-842baadb2680"
AMOOKSCO_DOMAIN_TENANT = "2c30a452-f39d-4829-8aa4-44a2d114552c"
EMPIRE_TENANT = "3c1b3283-fbd8-4c9f-9d0a-bce868a15ba4"

# ─── Test 1: Concurrent tenant list reads (same endpoint, many requests) ───
print("\n--- 1. CONCURRENT READS (20 parallel tenant list requests) ---")
def read_tenants():
    return curl("GET", "/api/v1/tenants", superuser_token)

with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:
    futures = [pool.submit(read_tenants) for _ in range(20)]
    responses = [f.result() for f in futures]

success_count = sum(1 for r in responses if isinstance(r, list))
check("20 concurrent tenant list reads", success_count == 20, f"{success_count}/20 succeeded")

# ─── Test 2: Cross-tenant isolation under concurrent load ───
print("\n--- 2. CROSS-TENANT ISOLATION (concurrent branding reads) ---")
def read_amooksco_branding():
    return curl("GET", f"/api/v1/branding/public/{AMOOKSCO_TENANT}")

def read_empire_branding():
    return curl("GET", f"/api/v1/branding/public/{EMPIRE_TENANT}")

with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
    am_futures = [pool.submit(read_amooksco_branding) for _ in range(10)]
    ed_futures = [pool.submit(read_empire_branding) for _ in range(10)]
    am_results = [f.result() for f in am_futures]
    ed_results = [f.result() for f in ed_futures]

am_ok = all("AMOOKSCO" in (r.get("company_name") or "").upper() for r in am_results if r)
ed_ok = all("EMPIRE" in (r.get("company_name") or "").upper() for r in ed_results if r)
check("10 concurrent AMOOKSCO branding reads", am_ok, f"{sum(1 for r in am_results if 'AMOOKSCO' in (r.get('company_name') or '').upper())}/10 correct")
check("10 concurrent Empire Drips branding reads", ed_ok, f"{sum(1 for r in ed_results if r.get('company_name') == 'Empire Drips')}/10 correct")

# ─── Test 3: Concurrent domain resolution ───
print("\n--- 3. CONCURRENT DOMAIN RESOLUTION ---")
def resolve_amooksco():
    return curl("GET", "/api/v1/domains/resolve?hostname=amooksco-legacy.afruheritage.com")

def resolve_empire():
    return curl("GET", "/api/v1/domains/resolve?hostname=empire-drips.afruheritage.com")

with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
    am_futures = [pool.submit(resolve_amooksco) for _ in range(10)]
    ed_futures = [pool.submit(resolve_empire) for _ in range(10)]
    am_results = [f.result() for f in am_futures]
    ed_results = [f.result() for f in ed_futures]

am_ok = all(r.get("tenant_id") == AMOOKSCO_DOMAIN_TENANT for r in am_results if r.get("tenant_id"))
ed_ok = all(r.get("tenant_id") == EMPIRE_TENANT for r in ed_results if r.get("tenant_id"))
check("10 concurrent AMOOKSCO domain resolves", am_ok, f"{sum(1 for r in am_results if r.get('tenant_id') == AMOOKSCO_DOMAIN_TENANT)}/10 correct")
check("10 concurrent Empire domain resolves", ed_ok, f"{sum(1 for r in ed_results if r.get('tenant_id') == EMPIRE_TENANT)}/10 correct")

# ─── Test 4: Concurrent Fleetbase proxy reads (tenant-scoped) ───
print("\n--- 4. CONCURRENT FLEETBASE PROXY (tenant-scoped) ---")
def fb_amooksco():
    return curl("GET", "/api/v1/fleetbase-proxy/vehicles", amooksco_token)

def fb_empire():
    return curl("GET", "/api/v1/fleetbase-proxy/vehicles", empire_token)

with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    am_futures = [pool.submit(fb_amooksco) for _ in range(6)]
    ed_futures = [pool.submit(fb_empire) for _ in range(6)]
    am_results = [f.result() for f in am_futures]
    ed_results = [f.result() for f in ed_futures]

am_ok = all("vehicles" in r for r in am_results if r)
ed_ok = all("vehicles" in r for r in ed_results if r)
check("6 concurrent Amooksco Fleetbase reads", am_ok, f"{sum(1 for r in am_results if 'vehicles' in r)}/6 succeeded")
check("6 concurrent Empire Fleetbase reads", ed_ok, f"{sum(1 for r in ed_results if 'vehicles' in r)}/6 succeeded")

# ─── Test 5: Concurrent auth/me calls (token validation under load) ───
print("\n--- 5. CONCURRENT AUTH/ME (token validation under load) ---")
def auth_me(token):
    return curl("GET", "/api/v1/auth/me", token)

with concurrent.futures.ThreadPoolExecutor(max_workers=15) as pool:
    am_futures = [pool.submit(auth_me, amooksco_token) for _ in range(15)]
    am_results = [f.result() for f in am_futures]

am_ok = all(r.get("email") == "admin@amooksco.com" for r in am_results if r.get("email"))
check("15 concurrent auth/me calls", am_ok, f"{sum(1 for r in am_results if r.get('email') == 'admin@amooksco.com')}/15 correct")

# ─── Test 6: Mixed concurrent operations (read + write + resolve) ───
print("\n--- 6. MIXED CONCURRENT OPERATIONS ---")
def mixed_op(i):
    op = i % 4
    if op == 0:
        return ("tenants", curl("GET", "/api/v1/tenants", superuser_token))
    elif op == 1:
        return ("branding_am", curl("GET", f"/api/v1/branding/public/{AMOOKSCO_TENANT}"))
    elif op == 2:
        return ("branding_ed", curl("GET", f"/api/v1/branding/public/{EMPIRE_TENANT}"))
    else:
        return ("resolve", curl("GET", "/api/v1/domains/resolve?hostname=amooksco-legacy.afruheritage.com"))

with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:
    futures = [pool.submit(mixed_op, i) for i in range(40)]
    mixed_results = [f.result() for f in futures]

success = sum(1 for op, r in mixed_results if r and not (isinstance(r, dict) and r.get("error")))
check("40 mixed concurrent operations", success == 40, f"{success}/40 succeeded")

# ─── Summary ───
print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
passed = sum(1 for s, _, _ in results if s == "PASS")
failed = sum(1 for s, _, _ in results if s == "FAIL")
for status, name, detail in results:
    symbol = "✅" if status == "PASS" else "❌"
    line = f"  {symbol} {name}"
    if status == "FAIL" and detail:
        line += f" — {detail}"
    print(line)
print(f"\n  PASS: {passed} | FAIL: {failed} | TOTAL: {passed + failed}")
print("=" * 60)
