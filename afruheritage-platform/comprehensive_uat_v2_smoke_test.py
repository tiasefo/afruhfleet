#!/usr/bin/env python3
import json
import time
import uuid
import requests
from datetime import datetime

BASE_URL = "http://localhost:8100"
FRONTEND_URL = "http://localhost:3002"

results = []

def record(name, ok, details="", error=None, start=None):
    results.append({
        "name": name,
        "status": "PASS" if ok else "FAIL",
        "response_time": round(time.time() - start, 4) if start else None,
        "details": details,
        "error": error,
    })
    print(("✅" if ok else "❌"), name, details or error or "")

def get(path):
    return requests.get(f"{BASE_URL}{path}", timeout=20)

def post(path, payload=None):
    return requests.post(f"{BASE_URL}{path}", json=payload or {}, timeout=30)

def test_health():
    s = time.time()
    try:
        r = requests.get(f"{BASE_URL}/health", timeout=10)
        record("API Health", r.status_code == 200, r.text[:120], f"HTTP {r.status_code}", s)
    except Exception as e:
        record("API Health", False, error=str(e), start=s)

def test_frontend():
    s = time.time()
    try:
        r = requests.get(f"{FRONTEND_URL}/onboarding", timeout=10)
        record("Frontend Onboarding Page", r.status_code in [200, 308], f"HTTP {r.status_code}", f"HTTP {r.status_code}", s)
    except Exception as e:
        record("Frontend Onboarding Page", False, error=str(e), start=s)

def test_commercial_catalog():
    s = time.time()
    try:
        r = get("/api/v1/commercial/catalog")
        ok = r.status_code == 200 and "plans" in r.json() and "addons" in r.json()
        record("Commercial Catalog", ok, f"plans={len(r.json().get('plans', []))}, addons={len(r.json().get('addons', []))}", f"HTTP {r.status_code}: {r.text[:300]}", s)
    except Exception as e:
        record("Commercial Catalog", False, error=str(e), start=s)

def test_commercial_signup_and_checkout():
    s = time.time()
    try:
        email = f"uat-{uuid.uuid4().hex[:8]}@example.com"
        start = post("/api/v1/commercial/signup/start", {
            "email": email,
            "phone": "+233244000000",
            "account_type": "tenant_org",
        })
        if start.status_code != 200:
            record("Commercial Signup Start", False, error=f"HTTP {start.status_code}: {start.text[:300]}", start=s)
            return None, None

        signup_id = start.json()["signup_id"]

        plan = post("/api/v1/commercial/signup/select-plan", {
            "signup_id": signup_id,
            "plan_code": "business",
            "addons": ["marketplace", "gps_tracking", "ai"],
            "payment_method": "paystack",
            "callback_url": "http://localhost:3002/billing/callback",
        })

        if plan.status_code != 200:
            record("Commercial Signup Checkout", False, error=f"HTTP {plan.status_code}: {plan.text[:300]}", start=s)
            return signup_id, None

        data = plan.json()
        ok = bool(data.get("payment_reference")) and bool(data.get("checkout_url"))
        record("Commercial Signup Checkout", ok, f"signup_id={signup_id}, reference={data.get('payment_reference')}", "missing reference/checkout_url", s)
        return signup_id, data.get("payment_reference")
    except Exception as e:
        record("Commercial Signup Checkout", False, error=str(e), start=s)
        return None, None

def test_receipt(reference):
    s = time.time()
    try:
        r = get(f"/api/v1/payment-hub/receipt/{reference}")
        ok = r.status_code == 200 and "receipt" in r.json()
        record("Payment Receipt Endpoint", ok, f"reference={reference}", f"HTTP {r.status_code}: {r.text[:300]}", s)
    except Exception as e:
        record("Payment Receipt Endpoint", False, error=str(e), start=s)

def test_marketplace_flow():
    s = time.time()
    try:
        create = post("/api/v1/marketplace/shipments", {
            "tenant_id": "tenant-001",
            "customer_name": "UAT Customer",
            "title": "UAT shipment",
            "description": "UAT shipment test",
            "pickup": {"label": "Tema Port", "latitude": 5.6698, "longitude": -0.0166},
            "dropoff": {"label": "Accra Central", "latitude": 5.56, "longitude": -0.2057},
            "weight_kg": 10,
            "length_cm": 40,
            "width_cm": 30,
            "height_cm": 20,
            "package_count": 1,
            "image_urls": ["https://example.com/test.jpg"],
            "fragile": False,
            "refrigerated": False,
        })

        if create.status_code != 200:
            record("Marketplace Shipment Create", False, error=f"HTTP {create.status_code}: {create.text[:400]}", start=s)
            return None

        job = create.json()
        job_id = job["job_id"]

        search = post("/api/v1/marketplace/drivers/search", {
            "driver_id": "driver-uat",
            "current_latitude": 5.65,
            "current_longitude": -0.03,
            "max_distance_km": 50,
        })

        accept = post(f"/api/v1/marketplace/shipments/{job_id}/accept", {"driver_id": "driver-uat"})
        gps = post(f"/api/v1/marketplace/shipments/{job_id}/gps", {
            "driver_id": "driver-uat",
            "latitude": 5.62,
            "longitude": -0.08,
            "speed_kmh": 30,
            "heading_degrees": 250,
        })
        hist = get(f"/api/v1/marketplace/shipments/{job_id}/gps")

        ok = all(x.status_code == 200 for x in [search, accept, gps, hist])
        record("Marketplace Shipment + Driver + GPS Flow", ok, f"job_id={job_id}", f"statuses={[search.status_code, accept.status_code, gps.status_code, hist.status_code]}", s)
        return job_id
    except Exception as e:
        record("Marketplace Shipment + Driver + GPS Flow", False, error=str(e), start=s)
        return None

def test_admin_credits():
    s = time.time()
    try:
        r = get("/api/v1/admin/credits/tenant-001")
        ok = r.status_code == 200 and "subscription" in r.json()
        record("Admin Credits Visibility", ok, r.text[:200], f"HTTP {r.status_code}: {r.text[:300]}", s)
    except Exception as e:
        record("Admin Credits Visibility", False, error=str(e), start=s)

def test_runtime_routes_present():
    s = time.time()
    try:
        r = get("/openapi.json")
        data = r.json()
        paths = data.get("paths", {})
        required = [
            "/api/v1/fleetbase-runtime/deploy",
            "/api/v1/fleetbase-runtime/tenant/{tenant_id}",
            "/api/v1/fleetbase-runtime/retry",
            "/api/v1/fleetbase-runtime/suspend",
        ]
        missing = [p for p in required if p not in paths]
        record("Runtime Routes Present", not missing, f"runtime_paths={len(required)-len(missing)}/{len(required)}", f"missing={missing}", s)
    except Exception as e:
        record("Runtime Routes Present", False, error=str(e), start=s)

def main():
    print("🚀 Afruheritage UAT v2 Smoke Test")
    print(datetime.utcnow().isoformat())

    test_health()
    test_frontend()
    test_commercial_catalog()
    signup_id, reference = test_commercial_signup_and_checkout()
    if reference:
        test_receipt(reference)
    test_marketplace_flow()
    test_admin_credits()
    test_runtime_routes_present()

    summary = {
        "timestamp": datetime.utcnow().isoformat(),
        "summary": {
            "total": len(results),
            "passed": sum(1 for r in results if r["status"] == "PASS"),
            "failed": sum(1 for r in results if r["status"] != "PASS"),
            "success_rate": round(100 * sum(1 for r in results if r["status"] == "PASS") / max(len(results), 1), 2),
        },
        "results": results,
    }

    with open("uat_v2_smoke_test_report.json", "w") as f:
        json.dump(summary, f, indent=2)

    print(json.dumps(summary["summary"], indent=2))

if __name__ == "__main__":
    main()
