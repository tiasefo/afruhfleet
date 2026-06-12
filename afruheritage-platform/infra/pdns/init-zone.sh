#!/bin/sh
# ─────────────────────────────────────────────────────────────────
# init-zone.sh  —  bootstrap the afruheritage.com zone in PowerDNS
# Runs once inside the pdns-init container (curlimages/curl).
# Pure POSIX sh + curl — no bash needed.
# ─────────────────────────────────────────────────────────────────
set -e

PDNS_API="http://afruheritage-pdns:8081/api/v1"
PDNS_KEY="${PDNS_API_KEY:-changeme}"
DOMAIN="afruheritage.com"
IP="${SERVER_PUBLIC_IP:-24.17.193.224}"

_get() {
  curl -sf -H "X-API-Key: ${PDNS_KEY}" "${PDNS_API}/$1"
}

_patch() {
  curl -sf -X PATCH \
    -H "X-API-Key: ${PDNS_KEY}" \
    -H "Content-Type: application/json" \
    -d "$2" \
    "${PDNS_API}/$1"
}

_post() {
  curl -sf -X POST \
    -H "X-API-Key: ${PDNS_KEY}" \
    -H "Content-Type: application/json" \
    -d "$2" \
    "${PDNS_API}/$1"
}

echo "[init-zone] Waiting for PowerDNS API at ${PDNS_API}…"
i=0
while [ $i -lt 30 ]; do
  result=$(_get "servers/localhost" 2>/dev/null | grep -o '"id"' || true)
  if [ -n "$result" ]; then break; fi
  sleep 2
  i=$((i+1))
done

if [ $i -ge 30 ]; then
  echo "[init-zone] ERROR: PowerDNS API not reachable after 60s"
  exit 1
fi

echo "[init-zone] PowerDNS API ready."

# Check if zone exists
zone_check=$(_get "servers/localhost/zones/${DOMAIN}." 2>/dev/null | grep -o '"id"' || true)

if [ -z "$zone_check" ]; then
  echo "[init-zone] Creating zone ${DOMAIN} with wildcard A → ${IP}"
  _post "servers/localhost/zones" \
    "{\"name\":\"${DOMAIN}.\",\"kind\":\"Native\",\"dnssec\":false,\"nameservers\":[\"ns1.${DOMAIN}.\"],\"rrsets\":[{\"name\":\"${DOMAIN}.\",\"type\":\"SOA\",\"ttl\":3600,\"records\":[{\"content\":\"ns1.${DOMAIN}. hostmaster.${DOMAIN}. 1 10800 3600 604800 3600\",\"disabled\":false}]},{\"name\":\"${DOMAIN}.\",\"type\":\"NS\",\"ttl\":86400,\"records\":[{\"content\":\"ns1.${DOMAIN}.\",\"disabled\":false}]},{\"name\":\"${DOMAIN}.\",\"type\":\"A\",\"ttl\":300,\"records\":[{\"content\":\"${IP}\",\"disabled\":false}]},{\"name\":\"ns1.${DOMAIN}.\",\"type\":\"A\",\"ttl\":86400,\"records\":[{\"content\":\"${IP}\",\"disabled\":false}]},{\"name\":\"api.${DOMAIN}.\",\"type\":\"A\",\"ttl\":300,\"records\":[{\"content\":\"${IP}\",\"disabled\":false}]},{\"name\":\"www.${DOMAIN}.\",\"type\":\"A\",\"ttl\":300,\"records\":[{\"content\":\"${IP}\",\"disabled\":false}]},{\"name\":\"*.${DOMAIN}.\",\"type\":\"A\",\"ttl\":300,\"records\":[{\"content\":\"${IP}\",\"disabled\":false}]}]}"
  echo "[init-zone] Zone ${DOMAIN} created."
else
  echo "[init-zone] Zone exists. Ensuring wildcard record *.${DOMAIN} → ${IP}"
  _patch "servers/localhost/zones/${DOMAIN}." \
    "{\"rrsets\":[{\"name\":\"*.${DOMAIN}.\",\"type\":\"A\",\"ttl\":300,\"changetype\":\"REPLACE\",\"records\":[{\"content\":\"${IP}\",\"disabled\":false}]}]}"
  echo "[init-zone] Wildcard A record ensured."
fi

echo "[init-zone] Done. *.${DOMAIN} → ${IP}"
