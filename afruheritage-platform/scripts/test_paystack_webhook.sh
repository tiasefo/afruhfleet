#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8100}"
SECRET="${PAYSTACK_WEBHOOK_SECRET:?PAYSTACK_WEBHOOK_SECRET is required}"
REFERENCE="${1:?Usage: bash scripts/test_paystack_webhook.sh PAYMENT_REFERENCE}"

BODY=$(cat <<JSON
{
  "event": "charge.success",
  "data": {
    "reference": "$REFERENCE",
    "status": "success"
  }
}
JSON
)

SIG=$(printf "%s" "$BODY" | openssl dgst -sha512 -hmac "$SECRET" | sed 's/^.* //')

curl -i -X POST "$BASE_URL/api/v1/payment-hub/webhook/paystack" \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: $SIG" \
  -d "$BODY"

echo
