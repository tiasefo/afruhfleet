#!/usr/bin/env bash
set -eo pipefail

API_URL="${API_URL:-http://localhost:8000}"

ADMIN_EMAIL="${ADMIN_EMAIL:-tiasefo@afruheritage.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:Sumiasis243$}"
ADMIN_FULL_NAME="${ADMIN_FULL_NAME:-Afruheritage Admin}"

TENANT_NAME="${TENANT_NAME:-Test Logistics}"
TENANT_SLUG="${TENANT_SLUG:-test-logistics}"
TENANT_EMAIL="${TENANT_EMAIL:-admin@test.com}"

echo "==> API: $API_URL"
echo

echo "==> 1. Bootstrapping admin"
BOOTSTRAP_RESP=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/auth/bootstrap" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\",
    \"full_name\": \"$ADMIN_FULL_NAME\"
  }")

BOOTSTRAP_BODY=$(echo "$BOOTSTRAP_RESP" | head -n -1)
BOOTSTRAP_CODE=$(echo "$BOOTSTRAP_RESP" | tail -n1)

echo "Bootstrap status: $BOOTSTRAP_CODE"
echo "$BOOTSTRAP_BODY"
echo

if [[ "$BOOTSTRAP_CODE" != "200" && "$BOOTSTRAP_CODE" != "400" && "$BOOTSTRAP_CODE" != "409" ]]; then
  echo "Bootstrap failed unexpectedly."
  exit 1
fi

echo "==> 2. Logging in"
LOGIN_RESP=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

LOGIN_BODY=$(echo "$LOGIN_RESP" | head -n -1)
LOGIN_CODE=$(echo "$LOGIN_RESP" | tail -n1)

echo "Login status: $LOGIN_CODE"
echo "$LOGIN_BODY"
echo

if [[ "$LOGIN_CODE" != "200" ]]; then
  echo "Login failed."
  exit 1
fi

TOKEN=$(python3 - "$LOGIN_BODY" <<'PY'
import json, sys
data = json.loads(sys.argv[1])
for key in ("access_token", "token", "jwt", "access"):
    if key in data:
        print(data[key])
        break
PY
)

if [[ -z "${TOKEN:-}" ]]; then
  echo "Could not extract token from login response."
  exit 1
fi

echo "==> 3. Checking /auth/me"
ME_RESP=$(curl -s -w "\n%{http_code}" "$API_URL/api/v1/auth/me" \
  -H "Authorization: Bearer $TOKEN")

ME_BODY=$(echo "$ME_RESP" | head -n -1)
ME_CODE=$(echo "$ME_RESP" | tail -n1)

echo "Me status: $ME_CODE"
echo "$ME_BODY"
echo

if [[ "$ME_CODE" != "200" ]]; then
  echo "Token validation failed."
  exit 1
fi

echo "==> 4. Listing tenants"
TENANTS_RESP=$(curl -s -w "\n%{http_code}" "$API_URL/api/v1/tenants" \
  -H "Authorization: Bearer $TOKEN")

TENANTS_BODY=$(echo "$TENANTS_RESP" | head -n -1)
TENANTS_CODE=$(echo "$TENANTS_RESP" | tail -n1)

echo "Tenants status: $TENANTS_CODE"
echo "$TENANTS_BODY"
echo

if [[ "$TENANTS_CODE" != "200" ]]; then
  echo "Could not list tenants."
  exit 1
fi

EXISTING_TENANT_ID=$(python3 - "$TENANTS_BODY" "$TENANT_SLUG" <<'PY'
import json, sys
body = sys.argv[1]
slug = sys.argv[2]
try:
    data = json.loads(body)
except Exception:
    print("")
    raise SystemExit
if isinstance(data, list):
    for item in data:
        if str(item.get("slug", "")).lower() == slug.lower():
            print(item.get("id", ""))
            raise SystemExit
print("")
PY
)

TENANT_ID=""

if [[ -n "$EXISTING_TENANT_ID" ]]; then
  TENANT_ID="$EXISTING_TENANT_ID"
  echo "==> Tenant already exists with ID: $TENANT_ID"
  echo
else
  echo "==> 5. Creating tenant"
  CREATE_RESP=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/tenants" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$TENANT_NAME\",
      \"slug\": \"$TENANT_SLUG\",
      \"contact_email\": \"$TENANT_EMAIL\"
    }")

  CREATE_BODY=$(echo "$CREATE_RESP" | head -n -1)
  CREATE_CODE=$(echo "$CREATE_RESP" | tail -n1)

  echo "Create tenant status: $CREATE_CODE"
  echo "$CREATE_BODY"
  echo

  if [[ "$CREATE_CODE" != "200" && "$CREATE_CODE" != "201" ]]; then
    echo "Tenant creation failed."
    exit 1
  fi

  TENANT_ID=$(python3 - "$CREATE_BODY" <<'PY'
import json, sys
data = json.loads(sys.argv[1])
print(data.get("id", ""))
PY
)
fi

if [[ -z "$TENANT_ID" ]]; then
  echo "Could not determine tenant ID."
  exit 1
fi

echo "==> 6. Attempting tenant approval"
APPROVE_RESP=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/tenants/$TENANT_ID/approve" \
  -H "Authorization: Bearer $TOKEN")

APPROVE_BODY=$(echo "$APPROVE_RESP" | head -n -1)
APPROVE_CODE=$(echo "$APPROVE_RESP" | tail -n1)

echo "Approve status: $APPROVE_CODE"
echo "$APPROVE_BODY"
echo

echo "==> Done"
echo "TOKEN=$TOKEN"
echo "TENANT_ID=$TENANT_ID"
echo "TENANT_SLUG=$TENANT_SLUG"
echo
echo "Tenant deploy command:"
cat <<EOF
curl -X POST $API_URL/api/v1/fleetbase-runtime/deploy \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tenant_id": "$TENANT_ID",
    "tenant_slug": "$TENANT_SLUG",
    "is_reference_install": false
  }'
EOF
echo
echo "Reference deploy command:"
cat <<EOF
curl -X POST $API_URL/api/v1/fleetbase-runtime/deploy \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tenant_id": "00000000-0000-0000-0000-000000000000",
    "tenant_slug": "reference",
    "is_reference_install": true
  }'
EOF
