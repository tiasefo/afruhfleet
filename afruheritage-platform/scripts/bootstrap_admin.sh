#!/usr/bin/env bash

set -e

API_URL="http://localhost:8000"

EMAIL="admin@afruheritage.com"
PASSWORD="Sumiasis243$"
FULL_NAME="Afruheritage Admin"

echo "Bootstrapping admin..."

response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/auth/bootstrap" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"full_name\": \"$FULL_NAME\"
  }")

body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n1)

echo "Status: $status"
echo "Response:"
echo "$body"

if [ "$status" != "200" ]; then
  echo "❌ Bootstrap failed"
  exit 1
fi

echo "✅ Bootstrap successful"
