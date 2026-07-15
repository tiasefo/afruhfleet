#!/bin/bash
set -e

BASE="http://localhost:8100"
echo "=========================================="
echo "PRODUCTION READINESS VALIDATION"
echo "=========================================="

# Login
TOKEN=$(curl -s $BASE/api/v1/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"admin@afruheritage.com","password":"Sumiasis243$"}' | jq -r '.access_token')
if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "FATAL: Login failed"
  exit 1
fi
echo "Login: OK"

echo ""
echo "=== 1. TENANT LIFECYCLE ==="
echo "--- List existing tenants ---"
curl -s $BASE/api/v1/tenants -H "Authorization: Bearer $TOKEN" | jq -r '.[] | "\(.company_name) | \(.slug) | \(.launch_status) | \(.plan_code)"'

echo ""
echo "--- Create new tenant ---"
NEWTENANT=$(curl -s $BASE/api/v1/tenants -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"company_name":"Lifecycle Test Co","contact_email":"lifecycle@example.com","plan_code":"free_trial","requested_domain":"lifecycle-test.afruheritage.com","domain_type":"provider_subdomain"}')
echo "$NEWTENANT" | jq '{id, company_name, slug, launch_status}'
NEWID=$(echo "$NEWTENANT" | jq -r '.id')
echo "New tenant ID: $NEWID"

echo ""
echo "--- Approve tenant ---"
curl -s $BASE/api/v1/tenants/$NEWID/approve -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"verification_notes":"QA approved"}' | jq '{id, company_name, launch_status}'

echo ""
echo "--- Suspend tenant ---"
curl -s $BASE/api/v1/tenants/$NEWID/suspend -X POST -H "Authorization: Bearer $TOKEN" | jq '{id, company_name, launch_status}'

echo ""
echo "--- Activate tenant ---"
curl -s $BASE/api/v1/tenants/$NEWID/activate -X POST -H "Authorization: Bearer $TOKEN" | jq '{id, company_name, launch_status}'

echo ""
echo "--- Delete tenant ---"
curl -s $BASE/api/v1/tenants/$NEWID -X DELETE -H "Authorization: Bearer $TOKEN" | jq .

echo ""
echo "--- Restore tenant ---"
curl -s $BASE/api/v1/tenants/$NEWID/restore -X POST -H "Authorization: Bearer $TOKEN" | jq '{id, company_name, launch_status}'

echo ""
echo "=== 2. BRANDING ISOLATION ==="
echo "--- AMOOKSCO branding ---"
curl -s $BASE/api/v1/branding/public/2c30a452-f39d-4829-8aa4-44a2d114552c | jq '{company_name, primary_color, secondary_color, tagline, support_email}'

echo ""
echo "--- Empire Drips branding ---"
curl -s $BASE/api/v1/branding/public/60666b64-0d36-4a0f-83f6-13c4b95120d6 | jq '{company_name, primary_color, secondary_color, tagline, support_email}'

echo ""
echo "=== 3. BILLING PLANS ==="
curl -s $BASE/api/v1/billing/plans -H "Authorization: Bearer $TOKEN" | jq -r '.[] | "\(.code) | \(.name) | \(.monthly_price)"'

echo ""
echo "=== 4. DOMAIN RESOLUTION ==="
echo "--- empire-drips ---"
curl -s "$BASE/api/v1/domains/resolve?hostname=empire-drips.afruheritage.com" | jq .
echo "--- amooksco-legacy ---"
curl -s "$BASE/api/v1/domains/resolve?hostname=amooksco-legacy.afruheritage.com" | jq .

echo ""
echo "=== 5. FLEETBASE PROXY ==="
echo "--- Vehicles ---"
curl -s $BASE/api/v1/fleetbase-proxy/vehicles | jq '.meta'
echo "--- Drivers ---"
curl -s $BASE/api/v1/fleetbase-proxy/drivers | jq '.meta'

echo ""
echo "=== 6. DATABASE ISOLATION ==="
PGPASSWORD=afruheritage psql -h localhost -p 5433 -U afruheritage -d afruheritage -c "SELECT t.slug, t.launch_status, COUNT(s.id) as shipment_count FROM tenants t LEFT JOIN shipments s ON s.tenant_id = t.id WHERE t.deleted_at IS NULL GROUP BY t.slug, t.launch_status ORDER BY t.slug;"

echo ""
echo "=== 7. AUTH ==="
curl -s $BASE/api/v1/auth/me -H "Authorization: Bearer $TOKEN" | jq '{email, is_superuser, role, is_tenant_admin}'

echo ""
echo "=== 8. SUPPORT TICKETS ==="
curl -s "$BASE/api/v1/support-crm/public/tickets" -X POST -H "Content-Type: application/json" -d '{"name":"QA Tester","email":"qa@test.com","subject":"Runtime validation test","message":"Testing support ticket creation","tenant_id":"2c30a452-f39d-4829-8aa4-44a2d114552c"}' | jq '{id, status, subject}'

echo ""
echo "=== 9. AI WIDGET ==="
curl -s "$BASE/api/v1/ai-widget/config/2c30a452-f39d-4829-8aa4-44a2d114552c" | jq '{enabled, model, display_name}'

echo ""
echo "=== 10. STOREFRONT ==="
curl -s "$BASE/api/v1/storefront/2c30a452-f39d-4829-8aa4-44a2d114552c" | jq 'if type == "object" then {status: .status, template: .template, pages: (.pages | length)} else . end' 2>/dev/null || echo "Storefront endpoint returned error"

echo ""
echo "=========================================="
echo "VALIDATION COMPLETE"
echo "=========================================="
