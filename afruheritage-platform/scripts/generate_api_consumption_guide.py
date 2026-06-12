#!/usr/bin/env python3
import json, urllib.request, os
from datetime import datetime

API_SPEC_URL = os.getenv("API_SPEC_URL", "https://api.afruheritage.com/openapi.json")
OUT_DIR = "reports/api_consumption"
os.makedirs(OUT_DIR, exist_ok=True)

KEYWORDS = {
    "Client Onboarding / Commercial": ["commercial", "signup", "subscription", "billing", "credits"],
    "Payment Hub / Paystack": ["payment-hub", "paystack", "receipt", "verify", "webhook"],
    "Marketplace": ["marketplace", "shipment", "booking", "vendor"],
    "Vendor Registration": ["vendors", "vendor"],
    "Driver / Fleet / GPS": ["driver", "gps", "tracking", "fleetbase", "runtime"],
    "KYC / Identity": ["kyc", "verification", "document", "identity"],
    "Admin / Operations": ["admin", "runtime", "tenant", "credits"],
    "Support": ["support", "ticket"],
}

def load_spec():
    with urllib.request.urlopen(API_SPEC_URL, timeout=30) as r:
        return json.loads(r.read().decode())

def ref_name(ref):
    return ref.split("/")[-1] if ref else None

def schema_for(content):
    try:
        schema = content["application/json"]["schema"]
        if "$ref" in schema:
            return ref_name(schema["$ref"])
        return json.dumps(schema, indent=2)
    except Exception:
        return None

def category_for(path):
    lower = path.lower()
    for cat, keys in KEYWORDS.items():
        if any(k in lower for k in keys):
            return cat
    return "Other APIs"

spec = load_spec()
paths = spec.get("paths", {})
schemas = spec.get("components", {}).get("schemas", {})

catalog = {cat: [] for cat in list(KEYWORDS.keys()) + ["Other APIs"]}

for path, methods in paths.items():
    for method, details in methods.items():
        if method.upper() not in ["GET", "POST", "PUT", "PATCH", "DELETE"]:
            continue

        request_schema = None
        if "requestBody" in details:
            request_schema = schema_for(details["requestBody"].get("content", {}))

        response_schema = None
        responses = details.get("responses", {})
        if "200" in responses:
            response_schema = schema_for(responses["200"].get("content", {}))
        elif "201" in responses:
            response_schema = schema_for(responses["201"].get("content", {}))

        catalog[category_for(path)].append({
            "method": method.upper(),
            "path": path,
            "summary": details.get("summary", ""),
            "request_schema": request_schema,
            "response_schema": response_schema,
            "security": bool(details.get("security")),
        })

md = []
md.append(f"# AfruHeritage Platform API Consumption Guide\n")
md.append(f"Generated: {datetime.utcnow().isoformat()} UTC\n")
md.append(f"API Base URL: `https://api.afruheritage.com/api/v1`\n")
md.append("This guide lists the APIs external apps can consume for onboarding, subscriptions, vendor registration, marketplace, payment, KYC, GPS, and runtime provisioning.\n")

for cat, items in catalog.items():
    if not items:
        continue
    md.append(f"\n## {cat}\n")
    for item in items:
        auth = "Yes" if item["security"] else "No / Public"
        md.append(f"### {item['method']} `{item['path']}`\n")
        if item["summary"]:
            md.append(f"Purpose: {item['summary']}\n")
        md.append(f"Authentication Required: `{auth}`\n")
        if item["request_schema"]:
            md.append(f"Request Schema: `{item['request_schema']}`\n")
        if item["response_schema"]:
            md.append(f"Response Schema: `{item['response_schema']}`\n")

md.append("\n# Schema Reference\n")
for name, schema in schemas.items():
    md.append(f"\n## {name}\n")
    md.append("```json\n")
    md.append(json.dumps(schema, indent=2))
    md.append("\n```\n")

out_md = os.path.join(OUT_DIR, "afruheritage_api_consumption_guide.md")
out_json = os.path.join(OUT_DIR, "afruheritage_api_catalog.json")

with open(out_md, "w") as f:
    f.write("\n".join(md))

with open(out_json, "w") as f:
    json.dump(catalog, f, indent=2)

print(f"Generated: {out_md}")
print(f"Generated: {out_json}")
