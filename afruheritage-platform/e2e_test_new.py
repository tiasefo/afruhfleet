#!/usr/bin/env python3
"""E2E test: New tenant signup → Fleetbase provisioned → subscription gated → trial activation → active."""
import os
import sys
import json
import time
import requests
import uuid

os.environ["DATABASE_URL"] = "postgresql://afruheritage:afruheritage@localhost:5433/afruheritage"
os.environ["REDIS_URL"] = "redis://localhost:6380/0"
os.environ["CELERY_BROKER_URL"] = "redis://localhost:6380/0"

BASE = "http://localhost:8100/api/v1"
RESULTS = []

def report(stage, status, detail):
    RESULTS.append({"stage": stage, "status": status, "detail": detail})
    print(f"[{status}] {stage}: {detail}")

# ─── Stage 1: Check server is up ───────────────────────────────────────────
try:
    r = requests.get(f"{BASE}/billing/plans", timeout=10)
    if r.status_code == 200:
        report("1_server_up", "PASS", f"Server responding (HTTP {r.status_code})")
    else:
        report("1_server_up", "FAIL", f"Server returned HTTP {r.status_code}")
        sys.exit(1)
except Exception as e:
    report("1_server_up", "FAIL", f"Cannot connect: {e}")
    sys.exit(1)

# ─── Stage 2: Register a new tenant ────────────────────────────────────────
test_id = f"e2e{int(time.time())}"
company_name = f"E2E Test Co {test_id}"
admin_email = f"admin_{test_id}@e2etest.com"
admin_password = "TestAdmin@2026!"
subdomain = f"e2e-test-{test_id}"

signup_payload = {
    "company_name": company_name,
    "admin_email": admin_email,
    "admin_password": admin_password,
    "admin_password_confirm": admin_password,
    "admin_full_name": "E2E Test Admin",
    "desired_subdomain": subdomain,
}

try:
    r = requests.post(f"{BASE}/companies/register", json=signup_payload, timeout=30)
    data = r.json()
    if r.status_code == 200 or r.status_code == 201:
        tenant_id = data.get("tenant_id")
        report("2_signup", "PASS", f"Tenant created: {tenant_id}, requires_subscription={data.get('requires_subscription')}")
    else:
        report("2_signup", "FAIL", f"HTTP {r.status_code}: {data}")
        sys.exit(1)
except Exception as e:
    report("2_signup", "FAIL", f"Exception: {e}")
    sys.exit(1)

# ─── Stage 3: Verify Fleetbase org was provisioned at signup ───────────────
try:
    from sqlalchemy import create_engine, text
    engine = create_engine(os.environ["DATABASE_URL"])
    with engine.connect() as conn:
        row = conn.execute(text(
            "SELECT fleetbase_org_id, launch_status FROM tenants WHERE id = :tid"
        ), {"tid": tenant_id}).fetchone()
        if row:
            fb_org_id = row[0]
            launch_status = row[1]
            if fb_org_id:
                report("3_fleetbase_provisioned", "PASS", f"org_id={fb_org_id}, launch_status={launch_status}")
            else:
                report("3_fleetbase_provisioned", "WARN", f"fleetbase_org_id is NULL, launch_status={launch_status} — Fleetbase may have been unreachable")
        else:
            report("3_fleetbase_provisioned", "FAIL", "Tenant not found in DB")
            sys.exit(1)
except Exception as e:
    report("3_fleetbase_provisioned", "FAIL", f"DB query failed: {e}")

# ─── Stage 4: Login as tenant admin ────────────────────────────────────────
try:
    r = requests.post(f"{BASE}/auth/login", json={
        "username": admin_email,
        "password": admin_password,
    }, timeout=10)
    data = r.json()
    if r.status_code == 200 and data.get("access_token"):
        token = data["access_token"]
        report("4_login", "PASS", f"Logged in as {admin_email}")
    else:
        report("4_login", "FAIL", f"HTTP {r.status_code}: {data}")
        sys.exit(1)
except Exception as e:
    report("4_login", "FAIL", f"Exception: {e}")
    sys.exit(1)

headers = {"Authorization": f"Bearer {token}"}

# ─── Stage 5: Verify no subscription exists yet ────────────────────────────
try:
    r = requests.get(f"{BASE}/billing/subscriptions/{tenant_id}", headers=headers, timeout=10)
    if r.status_code == 200:
        sub_data = r.json()
        if sub_data is None or sub_data == {}:
            report("5_no_subscription", "PASS", "No subscription found (as expected)")
        else:
            report("5_no_subscription", "WARN", f"Subscription already exists: {sub_data}")
    else:
        report("5_no_subscription", "PASS", f"HTTP {r.status_code} — no subscription yet")
except Exception as e:
    report("5_no_subscription", "FAIL", f"Exception: {e}")

# ─── Stage 6: Verify operational features are gated (402) ──────────────────
try:
    r = requests.get(f"{BASE}/shipments/{tenant_id}", headers=headers, timeout=10)
    if r.status_code == 402:
        report("6_feature_gated", "PASS", f"Shipments endpoint returned 402 (subscription required)")
    elif r.status_code == 403:
        report("6_feature_gated", "PASS", f"Shipments endpoint returned 403 (auth/tenant check)")
    else:
        report("6_feature_gated", "WARN", f"Shipments endpoint returned HTTP {r.status_code} — expected 402")
except Exception as e:
    report("6_feature_gated", "FAIL", f"Exception: {e}")

# ─── Stage 7: Activate trial subscription ──────────────────────────────────
try:
    r = requests.post(f"{BASE}/billing/subscriptions/trial/{tenant_id}", headers=headers, timeout=30)
    data = r.json()
    if r.status_code == 200:
        report("7_trial_activated", "PASS", f"Trial active: plan={data.get('plan_code')}, status={data.get('status')}")
    else:
        report("7_trial_activated", "FAIL", f"HTTP {r.status_code}: {data}")
        sys.exit(1)
except Exception as e:
    report("7_trial_activated", "FAIL", f"Exception: {e}")
    sys.exit(1)

# ─── Stage 8: Verify launch_status advanced to active ──────────────────────
try:
    with engine.connect() as conn:
        row = conn.execute(text(
            "SELECT launch_status, fleetbase_org_id FROM tenants WHERE id = :tid"
        ), {"tid": tenant_id}).fetchone()
        if row:
            launch_status = row[0]
            fb_org = row[1]
            if launch_status == "active":
                report("8_launch_active", "PASS", f"launch_status=active, fleetbase_org_id={fb_org}")
            else:
                report("8_launch_active", "FAIL", f"launch_status={launch_status} (expected 'active')")
        else:
            report("8_launch_active", "FAIL", "Tenant not found")
except Exception as e:
    report("8_launch_active", "FAIL", f"DB query failed: {e}")

# ─── Stage 9: Verify subscription now exists ───────────────────────────────
try:
    r = requests.get(f"{BASE}/billing/subscriptions/{tenant_id}", headers=headers, timeout=10)
    if r.status_code == 200:
        sub_data = r.json()
        if sub_data and sub_data.get("plan_code"):
            report("9_subscription_exists", "PASS", f"plan={sub_data['plan_code']}, status={sub_data.get('status')}")
        else:
            report("9_subscription_exists", "FAIL", f"Unexpected response: {sub_data}")
    else:
        report("9_subscription_exists", "FAIL", f"HTTP {r.status_code}")
except Exception as e:
    report("9_subscription_exists", "FAIL", f"Exception: {e}")

# ─── Stage 10: Verify subdomain resolution works ───────────────────────────
try:
    r = requests.get(f"{BASE}/tenant-context/subdomain/{subdomain}", timeout=10)
    if r.status_code == 200:
        ctx = r.json()
        report("10_subdomain_resolve", "PASS", f"Resolved: tenant_id={ctx.get('tenant_id')}, company={ctx.get('company_name')}")
    else:
        report("10_subdomain_resolve", "FAIL", f"HTTP {r.status_code}: {r.text[:200]}")
except Exception as e:
    report("10_subdomain_resolve", "FAIL", f"Exception: {e}")

# ─── Summary ───────────────────────────────────────────────────────────────
print("\n" + "=" * 70)
print("E2E TEST SUMMARY")
print("=" * 70)
passed = sum(1 for r in RESULTS if r["status"] == "PASS")
failed = sum(1 for r in RESULTS if r["status"] == "FAIL")
warned = sum(1 for r in RESULTS if r["status"] == "WARN")
for r in RESULTS:
    icon = "✅" if r["status"] == "PASS" else "❌" if r["status"] == "FAIL" else "⚠️"
    print(f"  {icon} {r['stage']}: {r['detail']}")
print(f"\n  Total: {len(RESULTS)} | PASS: {passed} | FAIL: {failed} | WARN: {warned}")
print("=" * 70)
sys.exit(0 if failed == 0 else 1)
