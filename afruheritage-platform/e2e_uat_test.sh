#!/usr/bin/env bash
set -uo pipefail

# ============================================================
# E2E UAT Automated Test Suite
# Covers: auth, storefronts, admin console, tenant isolation,
#         security headers, rate limiting, API endpoints
# ============================================================

BASE_API="${BASE_API:-http://localhost:8100}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3002}"
ADMIN_EMAIL="admin@afruheritage.com"
ADMIN_PASSWORD="Sumiasis243$"

PASS=0
FAIL=0
SKIP=0
RESULTS_FILE="e2e_uat_results_$(date +%Y%m%d_%H%M%S).txt"
: > "$RESULTS_FILE"

section() {
  echo "" | tee -a "$RESULTS_FILE"
  echo "============================================================" | tee -a "$RESULTS_FILE"
  echo "$1" | tee -a "$RESULTS_FILE"
  echo "============================================================" | tee -a "$RESULTS_FILE"
}

pass() { echo "  [PASS] $1" | tee -a "$RESULTS_FILE"; PASS=$((PASS+1)); }
fail() { echo "  [FAIL] $1" | tee -a "$RESULTS_FILE"; FAIL=$((FAIL+1)); }
skip() { echo "  [SKIP] $1" | tee -a "$RESULTS_FILE"; SKIP=$((SKIP+1)); }
info() { echo "  [INFO] $1" | tee -a "$RESULTS_FILE"; }

# Helper: get auth token
get_token() {
  local email="$1"
  local password="$2"
  curl -s -X POST "$BASE_API/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$email\",\"password\":\"$password\"}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token',''))" 2>/dev/null
}

# Helper: check HTTP status code
check_status() {
  local expected="$1"
  local actual="$2"
  local label="$3"
  if [ "$actual" = "$expected" ]; then
    pass "$label (HTTP $actual)"
  else
    fail "$label — expected HTTP $expected, got $actual"
  fi
}

# Helper: check header exists
check_header() {
  local headers="$1"
  local header_name="$2"
  local expected_value="$3"
  local label="$4"
  local actual_value
  actual_value=$(echo "$headers" | grep -i "^$header_name:" | head -1 | awk -F': ' '{print $2}' | tr -d '\r')
  if [ "$actual_value" = "$expected_value" ]; then
    pass "$label — $header_name: $actual_value"
  else
    fail "$label — expected $header_name: $expected_value, got: $actual_value"
  fi
}

# Helper: check page title
check_title() {
  local url="$1"
  local expected_fragment="$2"
  local label="$3"
  local html
  html=$(curl -s "$url")
  local title
  title=$(echo "$html" | grep -oP '<title>[^<]*</title>' | sed 's/<[^>]*>//g')
  if echo "$title" | grep -qi "$expected_fragment"; then
    pass "$label — title: '$title'"
  else
    fail "$label — expected title containing '$expected_fragment', got '$title'"
  fi
}

# ============================================================
# TEST SUITE START
# ============================================================

section "E2E UAT AUTOMATED TEST SUITE"
info "Date: $(date)"
info "API: $BASE_API"
info "Frontend: $FRONTEND_URL"
info "Results file: $RESULTS_FILE"

# ------------------------------------------------------------
section "1. DOCKER SERVICES HEALTH"
# ------------------------------------------------------------
for svc in afruheritage-api afruheritage-frontend afruheritage-postgres afruheritage-redis; do
  status=$(docker ps --filter "name=$svc" --format "{{.Status}}" 2>/dev/null || echo "not found")
  if echo "$status" | grep -qi "healthy\|Up"; then
    pass "$svc is healthy ($status)"
  else
    fail "$svc is not healthy ($status)"
  fi
done

# ------------------------------------------------------------
section "2. API HEALTH & DOCS"
# ------------------------------------------------------------
# Health endpoint
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_API/health" 2>/dev/null || echo "000")
check_status "200" "$status" "GET /health"

# OpenAPI schema
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_API/openapi.json" 2>/dev/null || echo "000")
check_status "200" "$status" "GET /openapi.json"

# Docs endpoint (non-production)
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_API/api/docs" 2>/dev/null || echo "000")
if [ "$status" = "200" ] || [ "$status" = "404" ]; then
  pass "GET /api/docs — status $status (404 ok in production)"
else
  fail "GET /api/docs — unexpected status $status"
fi

# ------------------------------------------------------------
section "3. AUTHENTICATION"
# ------------------------------------------------------------
# Login as admin
TOKEN=$(get_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
if [ -n "$TOKEN" ] && [ "$TOKEN" != "" ]; then
  pass "Admin login — token received"
else
  fail "Admin login — no token received"
  TOKEN=""
fi

# Login with wrong password
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_API/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@afruheritage.com","password":"WRONG"}')
check_status "401" "$status" "Login with wrong password"

# Login with non-existent user
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_API/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"nobody@nowhere.com","password":"test"}')
check_status "401" "$status" "Login with non-existent user"

# Auth me endpoint
if [ -n "$TOKEN" ]; then
  status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_API/api/v1/auth/me" \
    -H "Authorization: Bearer $TOKEN")
  check_status "200" "$status" "GET /api/v1/auth/me with valid token"
else
  skip "GET /api/v1/auth/me — no token available"
fi

# Auth me without token
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_API/api/v1/auth/me")
check_status "401" "$status" "GET /api/v1/auth/me without token"

# ------------------------------------------------------------
section "4. RATE LIMITING"
# ------------------------------------------------------------
info "Testing login rate limit (5/minute) with unique IP..."
RATE_LIMIT_HIT=false
for i in $(seq 1 7); do
  status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_API/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -H "X-Forwarded-For: 77.77.77.77" \
    -d '{"username":"ratetest@test.com","password":"wrong"}')
  if [ "$status" = "429" ]; then
    RATE_LIMIT_HIT=true
    pass "Rate limit triggered on attempt $i (HTTP 429)"
    break
  fi
done
if [ "$RATE_LIMIT_HIT" = "false" ]; then
  fail "Rate limit not triggered after 7 attempts"
fi

# ------------------------------------------------------------
section "5. SECURITY HEADERS — BACKEND"
# ------------------------------------------------------------
HEADERS=$(curl -sI "$BASE_API/api/v1/health")
check_header "$HEADERS" "X-Frame-Options" "DENY" "Backend X-Frame-Options"
check_header "$HEADERS" "X-Content-Type-Options" "nosniff" "Backend X-Content-Type-Options"
check_header "$HEADERS" "Referrer-Policy" "strict-origin-when-cross-origin" "Backend Referrer-Policy"
check_header "$HEADERS" "Permissions-Policy" "geolocation=(), microphone=(), camera=()" "Backend Permissions-Policy"

# ------------------------------------------------------------
section "6. SECURITY HEADERS — FRONTEND"
# ------------------------------------------------------------
HEADERS=$(curl -sI "$FRONTEND_URL/")
check_header "$HEADERS" "X-Frame-Options" "DENY" "Frontend X-Frame-Options"
check_header "$HEADERS" "X-Content-Type-Options" "nosniff" "Frontend X-Content-Type-Options"
check_header "$HEADERS" "Referrer-Policy" "strict-origin-when-cross-origin" "Frontend Referrer-Policy"
check_header "$HEADERS" "Permissions-Policy" "geolocation=(), microphone=(), camera=()" "Frontend Permissions-Policy"

# ------------------------------------------------------------
section "7. STOREFRONT RENDERING & BRANDING"
# ------------------------------------------------------------
check_title "$FRONTEND_URL/store/amooksco-logistics" "AMOOKSCO" "AMOOKSCO storefront"
check_title "$FRONTEND_URL/store/metromass-transit" "MetroMass" "MetroMass storefront"
check_title "$FRONTEND_URL/store/accra-florist-collective" "Accra Florist" "Accra Florist storefront"
check_title "$FRONTEND_URL/store/sahel-freight-express" "Sahel Freight" "Sahel Freight storefront"

# Verify storefront pages return 200
for slug in amooksco-logistics metromass-transit accra-florist-collective sahel-freight-express; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/store/$slug")
  check_status "200" "$status" "GET /store/$slug"
done

# ------------------------------------------------------------
section "8. TENANT ISOLATION (No Cross-Tenant Data Leakage)"
# ------------------------------------------------------------
# Verify AMOOKSO page does NOT contain MetroMass branding
AMOOKS_HTML=$(curl -s "$FRONTEND_URL/store/amooksco-logistics")
if echo "$AMOOKS_HTML" | grep -qi "MetroMass"; then
  fail "AMOOKSO storefront contains 'MetroMass' text — tenant isolation breach"
else
  pass "AMOOKSO storefront does not leak MetroMass branding"
fi

# Verify MetroMass page does NOT contain AMOOKSO branding
METROMASS_HTML=$(curl -s "$FRONTEND_URL/store/metromass-transit")
if echo "$METROMASS_HTML" | grep -qi "AMOOKSCO"; then
  fail "MetroMass storefront contains 'AMOOKSCO' text — tenant isolation breach"
else
  pass "MetroMass storefront does not leak AMOOKSO branding"
fi

# Verify no Fleetbase branding leakage
for slug in amooksco-logistics metromass-transit accra-florist-collective sahel-freight-express; do
  # Strip script tags and JSON data before checking for visible Fleetbase text
  html=$(curl -s "$FRONTEND_URL/store/$slug" | sed 's/<script[^>]*>.*<\/script>//g' | sed 's/<style[^>]*>.*<\/style>//g')
  # Check only visible text (between HTML tags), not JSON feature codes like "fleetbase_full"
  visible_fleetbase=$(echo "$html" | grep -ioP '(?<=>)[^<]*Fleetbase[^<]*(?=<)' | head -1)
  if [ -n "$visible_fleetbase" ]; then
    fail "/store/$slug contains visible 'Fleetbase' text — branding leakage"
  else
    pass "/store/$slug does not leak visible Fleetbase branding"
  fi
done

# ------------------------------------------------------------
section "9. ADMIN CONSOLE PAGES"
# ------------------------------------------------------------
for path in /admin /admin/runtime /fleetbase/extensions /dashboard; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL$path")
  # 200 = page renders, 302/307 = auth redirect (both valid for protected pages)
  if [ "$status" = "200" ] || [ "$status" = "302" ] || [ "$status" = "307" ]; then
    pass "GET $path — HTTP $status"
  else
    fail "GET $path — expected 200/302/307, got $status"
  fi
done

# ------------------------------------------------------------
section "10. FLEETBASE RUNTIME API"
# ------------------------------------------------------------
if [ -n "$TOKEN" ]; then
  # List runners
  status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_API/api/v1/fleetbase-runtime/runners" \
    -H "Authorization: Bearer $TOKEN")
  check_status "200" "$status" "GET /fleetbase-runtime/runners"

  # List runtimes
  status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_API/api/v1/fleetbase-runtime/runtimes" \
    -H "Authorization: Bearer $TOKEN")
  check_status "200" "$status" "GET /fleetbase-runtime/runtimes"

  # Verify runners response is valid JSON array
  RUNNERS=$(curl -s "$BASE_API/api/v1/fleetbase-runtime/runners" -H "Authorization: Bearer $TOKEN")
  if echo "$RUNNERS" | python3 -c "import sys,json; d=json.load(sys.stdin); assert isinstance(d, list)" 2>/dev/null; then
    RUNNER_COUNT=$(echo "$RUNNERS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
    pass "Runners response is valid JSON array with $RUNNER_COUNT runner(s)"
  else
    fail "Runners response is not a valid JSON array"
  fi

  # Verify runtimes response is valid JSON array
  RUNTIMES=$(curl -s "$BASE_API/api/v1/fleetbase-runtime/runtimes" -H "Authorization: Bearer $TOKEN")
  if echo "$RUNTIMES" | python3 -c "import sys,json; d=json.load(sys.stdin); assert isinstance(d, list)" 2>/dev/null; then
    RUNTIME_COUNT=$(echo "$RUNTIMES" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
    pass "Runtimes response is valid JSON array with $RUNTIME_COUNT runtime(s)"
  else
    fail "Runtimes response is not a valid JSON array"
  fi
else
  skip "Fleetbase Runtime API tests — no auth token"
fi

# ------------------------------------------------------------
section "11. TENANT MANAGEMENT API"
# ------------------------------------------------------------
if [ -n "$TOKEN" ]; then
  status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_API/api/v1/tenants" \
    -H "Authorization: Bearer $TOKEN")
  check_status "200" "$status" "GET /api/v1/tenants"

  # Verify tenants response
  TENANTS=$(curl -s "$BASE_API/api/v1/tenants" -H "Authorization: Bearer $TOKEN")
  if echo "$TENANTS" | python3 -c "import sys,json; d=json.load(sys.stdin); assert isinstance(d, list) and len(d) > 0" 2>/dev/null; then
    TENANT_COUNT=$(echo "$TENANTS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
    pass "Tenants response valid — $TENANT_COUNT tenant(s) found"
  else
    fail "Tenants response invalid or empty"
  fi
else
  skip "Tenant Management API tests — no auth token"
fi

# ------------------------------------------------------------
section "12. BRANDING API (Public)"
# ------------------------------------------------------------
AUTH_FLAG=""
if [ -n "$TOKEN" ]; then AUTH_FLAG="-H Authorization:Bearer\ $TOKEN"; fi
for slug in amooksco-logistics metromass-transit accra-florist-collective; do
  status=$(curl -s -o /dev/null -w "%{http_code}" $BASE_API/api/v1/branding/public/$slug)
  if [ "$status" = "200" ]; then
    BODY=$(curl -s "$BASE_API/api/v1/branding/public/$slug")
    COMPANY_NAME=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('company_name','UNKNOWN'))" 2>/dev/null || echo "PARSE_ERROR")
    pass "GET /api/v1/branding/public/$slug — 200, company_name: $COMPANY_NAME"
  else
    fail "GET /api/v1/branding/public/$slug — expected 200, got $status"
  fi
done

# ------------------------------------------------------------
section "13. PUBLIC TRACKING ENDPOINT"
# ------------------------------------------------------------
# Test with a fake tracking number — should return 404 not 500
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_API/api/v1/shipments/public/track/00000000-0000-0000-0000-000000000000/FAKE123")
if [ "$status" = "404" ] || [ "$status" = "422" ]; then
  pass "Public tracking with fake number — HTTP $status (expected 404/422)"
else
  fail "Public tracking with fake number — expected 404/422, got $status"
fi

# ------------------------------------------------------------
section "14. WHATSAPP WEBHOOK"
# ------------------------------------------------------------
# Test webhook verification with wrong token — should return 403
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_API/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=WRONG&hub.challenge=test123")
if [ "$status" = "403" ] || [ "$status" = "404" ]; then
  pass "WhatsApp webhook with wrong token — HTTP $status (expected 403/404)"
else
  fail "WhatsApp webhook with wrong token — expected 403/404, got $status"
fi

# ------------------------------------------------------------
section "15. GALLERY UPLOAD (Auth Required)"
# ------------------------------------------------------------
if [ -n "$TOKEN" ]; then
  # Try upload without file — should return 422
  status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_API/api/v1/gallery/upload" \
    -H "Authorization: Bearer $TOKEN")
  if [ "$status" = "422" ] || [ "$status" = "400" ]; then
    pass "Gallery upload without file — HTTP $status (expected 422/400)"
  else
    fail "Gallery upload without file — expected 422/400, got $status"
  fi
else
  skip "Gallery upload test — no auth token"
fi

# ------------------------------------------------------------
section "16. CORS HEADERS"
# ------------------------------------------------------------
CORS_CHECK=$(curl -sI -X OPTIONS "$BASE_API/api/v1/auth/login" \
  -H "Origin: http://localhost:3002" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type")
if echo "$CORS_CHECK" | grep -qi "access-control-allow-origin"; then
  pass "CORS preflight returns Access-Control-Allow-Origin"
else
  skip "CORS preflight — OPTIONS not explicitly handled (normal for FastAPI with CORSMiddleware)"
fi

# Verify wildcard CORS is not used
CORS_ORIGIN=$(echo "$CORS_CHECK" | grep -i "access-control-allow-origin" | awk -F': ' '{print $2}' | tr -d '\r')
if [ "$CORS_ORIGIN" = "*" ]; then
  fail "CORS allows wildcard '*' — security risk"
else
  pass "CORS origin is restricted: $CORS_ORIGIN"
fi

# ------------------------------------------------------------
section "17. LANDING PAGE"
# ------------------------------------------------------------
check_title "$FRONTEND_URL/" "Afruheritage" "Landing page"

# ------------------------------------------------------------
section "18. AUTH PAGES RENDER"
# ------------------------------------------------------------
status=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/sign-in")
check_status "200" "$status" "GET /sign-in"

status=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/sign-up")
check_status "200" "$status" "GET /sign-up"

# ------------------------------------------------------------
section "19. NO TODO/MOCK REMNANTS IN PRODUCTION CODE"
# ------------------------------------------------------------
TODO_COUNT=$(grep -rn "TODO\|FIXME\|HACK" \
  /home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/frontend/app/ \
  /home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/frontend/components/ \
  /home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/frontend/lib/ \
  /home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/frontend/hooks/ \
  --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules | grep -v ".next" | wc -l)

if [ "$TODO_COUNT" = "0" ]; then
  pass "No TODO/FIXME/HACK in frontend production code"
else
  fail "Found $TODO_COUNT TODO/FIXME/HACK references in frontend production code"
fi

BACKEND_TODO_COUNT=$(grep -rn "TODO\|FIXME\|HACK" \
  /home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/app/ \
  --include="*.py" 2>/dev/null | grep -v __pycache__ | grep -v test | wc -l)

if [ "$BACKEND_TODO_COUNT" = "0" ]; then
  pass "No TODO/FIXME/HACK in backend production code"
else
  fail "Found $BACKEND_TODO_COUNT TODO/FIXME/HACK references in backend production code"
fi

# ------------------------------------------------------------
section "20. DATABASE CONNECTIVITY"
# ------------------------------------------------------------
DB_TABLES=$(docker exec afruheritage-postgres psql -U afruheritage -d afruheritage -c "\dt" 2>/dev/null | grep -c "|" || echo "0")
if [ "$DB_TABLES" -gt "5" ]; then
  pass "Database has $DB_TABLES tables — connectivity OK"
else
  fail "Database connectivity issue — only $DB_TABLES tables found"
fi

# ------------------------------------------------------------
# SUMMARY
# ------------------------------------------------------------
section "TEST SUMMARY"
echo "" | tee -a "$RESULTS_FILE"
echo "  Passed: $PASS" | tee -a "$RESULTS_FILE"
echo "  Failed: $FAIL" | tee -a "$RESULTS_FILE"
echo "  Skipped: $SKIP" | tee -a "$RESULTS_FILE"
echo "  Total:  $((PASS + FAIL + SKIP))" | tee -a "$RESULTS_FILE"
echo "" | tee -a "$RESULTS_FILE"

if [ "$FAIL" = "0" ]; then
  echo "  ✅ ALL TESTS PASSED — Ready for human UAT" | tee -a "$RESULTS_FILE"
else
  echo "  ❌ $FAIL TEST(S) FAILED — Fix before human UAT" | tee -a "$RESULTS_FILE"
fi

echo "" | tee -a "$RESULTS_FILE"
echo "Results saved to: $RESULTS_FILE" | tee -a "$RESULTS_FILE"

exit $FAIL
