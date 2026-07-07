#!/usr/bin/env python3
"""Quick test: verify trial activation advances launch_status to active."""
import os
import requests
from sqlalchemy import create_engine, text

os.environ["DATABASE_URL"] = "postgresql://afruheritage:afruheritage@localhost:5433/afruheritage"
BASE = "http://localhost:8100/api/v1"
engine = create_engine(os.environ["DATABASE_URL"])

with engine.connect() as conn:
    row = conn.execute(text(
        "SELECT id, slug, launch_status, contact_email FROM tenants "
        "WHERE slug LIKE 'e2e-test-%' ORDER BY created_at DESC LIMIT 1"
    )).fetchone()
    if not row:
        print("No e2e test tenant found")
        exit(1)
    tenant_id = str(row[0])
    email = row[3]
    print(f"Before: launch_status={row[2]}, tenant={tenant_id}")

# Login
r = requests.post(f"{BASE}/auth/login", json={"username": email, "password": "TestAdmin@2026!"}, timeout=10)
if r.status_code != 200:
    print(f"Login failed: {r.status_code} {r.text[:200]}")
    exit(1)
token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Activate trial
r = requests.post(f"{BASE}/billing/subscriptions/trial/{tenant_id}", headers=headers, timeout=30)
if r.status_code == 200:
    data = r.json()
    print(f"Trial: status={data.get('status')}, plan={data.get('plan_code')}")
else:
    print(f"Trial failed: HTTP {r.status_code}: {r.text[:300]}")
    exit(1)

# Check launch_status after trial
with engine.connect() as conn:
    row = conn.execute(text(
        "SELECT launch_status, fleetbase_org_id FROM tenants WHERE id = :tid"
    ), {"tid": tenant_id}).fetchone()
    print(f"After: launch_status={row[0]}, fleetbase_org_id={row[1]}")
    if row[0] == "active":
        print("PASS: launch_status advanced to active")
    else:
        print(f"FAIL: launch_status is {row[0]}, expected active")
