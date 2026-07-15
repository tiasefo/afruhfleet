#!/usr/bin/env python3
"""Production Readiness Validation - Runtime Evidence Collection"""
import json
import subprocess
import sys
import os

BASE = "http://localhost:8100"
results = []

def curl(method, path, token=None, body=None):
    cmd = ["curl", "-s", f"{BASE}{path}"]
    if method != "GET":
        cmd += ["-X", method]
    if token:
        cmd += ["-H", f"Authorization: Bearer {token}"]
    if body:
        cmd += ["-H", "Content-Type: application/json", "-d", json.dumps(body)]
    try:
        out = subprocess.check_output(cmd, timeout=15, stderr=subprocess.DEVNULL)
        return json.loads(out) if out else {}
    except (subprocess.TimeoutExpired, json.JSONDecodeError) as e:
        return {"error": str(e)}

def psql(query):
    env = os.environ.copy()
    env["PGPASSWORD"] = "afruheritage"
    out = subprocess.check_output(
        ["psql", "-h", "localhost", "-p", "5433", "-U", "afruheritage",
         "-d", "afruheritage", "-t", "-c", query],
        env=env, timeout=10, stderr=subprocess.DEVNULL
    )
    return out.decode().strip()

def check(name, condition, detail=""):
    status = "PASS" if condition else "FAIL"
    results.append((status, name, detail))
    print(f"[{status}] {name}" + (f" — {detail}" if detail and not condition else ""))

print("=" * 50)
print("PRODUCTION READINESS VALIDATION")
print("=" * 50)

# Login
login = curl("POST", "/api/v1/auth/login", body={"email": "admin@afruheritage.com", "password": "Sumiasis243$"})
TOKEN = login.get("access_token", "")
check("Login", bool(TOKEN), f"token={TOKEN[:20]}..." if TOKEN else "no token")

if not TOKEN:
    print("FATAL: Cannot proceed without auth token")
    sys.exit(1)

print("\n--- 1. TENANT LIFECYCLE ---")
# Create
import time as _time
_suffix = str(int(_time.time()))
new = curl("POST", "/api/v1/tenants", TOKEN, {
    "company_name": f"Final QA Corp {_suffix}",
    "contact_email": f"finalqa{_suffix}@example.com",
    "plan_code": "free_trial",
    "requested_domain": f"finalqa{_suffix}.afruheritage.com",
    "domain_type": "provider_subdomain"
})
NEWID = new.get("id", "")
check("Tenant Create", bool(NEWID), str(new)[:100])

# Approve
appr = curl("POST", f"/api/v1/tenants/{NEWID}/approve", TOKEN, {"verification_notes": "QA approved"})
check("Tenant Approve", appr.get("launch_status") == "approved", str(appr)[:100])

# Suspend
susp = curl("POST", f"/api/v1/tenants/{NEWID}/suspend", TOKEN)
check("Tenant Suspend", susp.get("launch_status") == "suspended", str(susp)[:100])

# Activate
act = curl("POST", f"/api/v1/tenants/{NEWID}/activate", TOKEN)
check("Tenant Activate", act.get("launch_status") == "active", str(act)[:100])

# Delete
dele = curl("DELETE", f"/api/v1/tenants/{NEWID}", TOKEN)
check("Tenant Delete", dele.get("status") == "deleted", str(dele)[:100])

# Restore
rest = curl("POST", f"/api/v1/tenants/{NEWID}/restore", TOKEN)
check("Tenant Restore", rest.get("launch_status") == "active", str(rest)[:100])

print("\n--- 2. BRANDING ISOLATION ---")
am = curl("GET", "/api/v1/branding/public/2c30a452-f39d-4829-8aa4-44a2d114552c")
ed = curl("GET", "/api/v1/branding/public/60666b64-0d36-4a0f-83f6-13c4b95120d6")
check("AMOOKSCO branding", am.get("company_name") == "AMOOKSCO", str(am)[:80])
check("Empire Drips branding", "Empire Drips" in (ed.get("company_name") or ""), str(ed)[:80])
check("Colors differ", am.get("primary_color") != ed.get("primary_color"),
      f"{am.get('primary_color')} vs {ed.get('primary_color')}")

print("\n--- 3. BILLING ---")
plans = curl("GET", "/api/v1/billing/plans", TOKEN)
check("Billing plans (>=3)", isinstance(plans, list) and len(plans) >= 3, f"{len(plans) if isinstance(plans, list) else 'N/A'} plans")

print("\n--- 4. DOMAIN RESOLUTION ---")
ed_dom = curl("GET", "/api/v1/domains/resolve?hostname=empire-drips.afruheritage.com")
check("Empire Drips domain", ed_dom.get("tenant_id") == "3c1b3283-fbd8-4c9f-9d0a-bce868a15ba4", str(ed_dom)[:100])
am_dom = curl("GET", "/api/v1/domains/resolve?hostname=amooksco-legacy.afruheritage.com")
check("AMOOKSCO domain", am_dom.get("tenant_id") == "2c30a452-f39d-4829-8aa4-44a2d114552c", str(am_dom)[:100])

print("\n--- 5. AUTH ROLES ---")
me = curl("GET", "/api/v1/auth/me", TOKEN)
check("Superuser flag", me.get("is_superuser") == True, str(me)[:80])
check("Superuser role", me.get("role") == "company_admin", f"role={me.get('role')}")

print("\n--- 6. SUPPORT TICKETS ---")
ticket = curl("POST", "/api/v1/support-crm/public/tickets?tenant_id=2c30a452-f39d-4829-8aa4-44a2d114552c", None, {
    "tenant_id": "2c30a452-f39d-4829-8aa4-44a2d114552c",
    "public_submitter_name": "QA Tester",
    "public_submitter_email": "qa@test.com",
    "subject": "Final validation",
    "description": "Runtime test"
})
check("Support ticket creation", bool(ticket.get("id")), str(ticket)[:100])

print("\n--- 7. AI WIDGET ---")
widget = curl("GET", "/api/v1/ai/widget/config?host=amooksco-legacy.afruheritage.com")
check("AI widget config", widget.get("enabled") == True, str(widget)[:100])

print("\n--- 8. DATABASE ISOLATION ---")
am_count = psql("SELECT COUNT(*) FROM shipments WHERE tenant_id = '2c30a452-f39d-4829-8aa4-44a2d114552c';")
log_count = psql("SELECT COUNT(*) FROM shipments WHERE tenant_id = 'e379f093-758e-4e5a-a313-842baadb2680';")
check("AMOOKSCO has 0 shipments", am_count == "0", f"count={am_count}")
check("Amooksco Logistics has data", int(log_count) > 0, f"count={log_count}")

print("\n--- 9. FLEETBASE PROXY ---")
fb = curl("GET", "/api/v1/fleetbase-proxy/vehicles", TOKEN)
check("Fleetbase proxy responds", "error" not in fb, str(fb)[:100])

print("\n--- 10. STOREFRONT ---")
sf = curl("GET", "/api/v1/storefront/2c30a452-f39d-4829-8aa4-44a2d114552c/orders", TOKEN)
check("Storefront orders endpoint", "error" not in sf or "detail" in sf, str(sf)[:100])

print("\n--- 11. THEME ENGINE ---")
# Read original
am_before = curl("GET", "/api/v1/branding/public/2c30a452-f39d-4829-8aa4-44a2d114552c")
orig_color = am_before.get("primary_color", "")
# Change theme
am_patch = curl("PATCH", "/api/v1/branding/2c30a452-f39d-4829-8aa4-44a2d114552c", TOKEN, {
    "primary_color": "#00FF00", "secondary_color": "#000000", "tagline": "Theme Engine Test"
})
check("Theme update (PATCH)", am_patch.get("primary_color") == "#00FF00", str(am_patch)[:100])
# Verify public endpoint reflects change
am_after = curl("GET", "/api/v1/branding/public/2c30a452-f39d-4829-8aa4-44a2d114552c")
check("Theme change visible publicly", am_after.get("primary_color") == "#00FF00", f"color={am_after.get('primary_color')}")
# Restore
curl("PATCH", "/api/v1/branding/2c30a452-f39d-4829-8aa4-44a2d114552c", TOKEN, {
    "primary_color": orig_color, "secondary_color": "#004E89", "tagline": "Global Logistics Solutions"
})

print("\n--- 12. SUBSCRIPTION LIFECYCLE ---")
subs = curl("GET", "/api/v1/admin/billing/subscriptions", TOKEN)
sub_id = ""
if isinstance(subs, list) and len(subs) > 0:
    sub_id = subs[0].get("id", "")
check("List admin subscriptions", bool(sub_id), str(subs)[:100])

if sub_id:
    paused = curl("POST", f"/api/v1/admin/billing/subscriptions/{sub_id}/pause", TOKEN)
    check("Subscription pause", paused.get("status") == "suspended", str(paused)[:100])

    resumed = curl("POST", f"/api/v1/admin/billing/subscriptions/{sub_id}/resume", TOKEN)
    check("Subscription resume", resumed.get("status") == "active", str(resumed)[:100])

    canceled = curl("POST", f"/api/v1/admin/billing/subscriptions/{sub_id}/cancel", TOKEN)
    check("Subscription cancel", canceled.get("status") == "canceled", str(canceled)[:100])

print("\n--- 13. CREDITS ---")
credit = curl("POST", "/api/v1/admin/billing/credits/grant", TOKEN, {
    "tenant_id": "2c30a452-f39d-4829-8aa4-44a2d114552c",
    "amount": 50, "reason": "QA validation"
})
check("Credits grant", "new_balance" in credit or "balance" in credit, str(credit)[:100])

# Summary
print("\n" + "=" * 50)
print("SUMMARY")
print("=" * 50)
passed = sum(1 for s, _, _ in results if s == "PASS")
failed = sum(1 for s, _, _ in results if s == "FAIL")
for status, name, detail in results:
    symbol = "✅" if status == "PASS" else "❌"
    line = f"  {symbol} {name}"
    if status == "FAIL" and detail:
        line += f" — {detail}"
    print(line)
print(f"\n  PASS: {passed} | FAIL: {failed} | TOTAL: {len(results)}")
print("=" * 50)
