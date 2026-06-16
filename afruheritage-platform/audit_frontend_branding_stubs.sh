#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3002}"
OUT="frontend_branding_stub_audit_$(date +%Y%m%d_%H%M%S).txt"

log() {
  echo "$@" | tee -a "$OUT"
}

section() {
  echo "" | tee -a "$OUT"
  echo "============================================================" | tee -a "$OUT"
  echo "$@" | tee -a "$OUT"
  echo "============================================================" | tee -a "$OUT"
}

: > "$OUT"

section "FRONTEND BRANDING / STUB AUDIT"
log "PWD: $(pwd)"
log "BASE_URL: $BASE_URL"
log "DATE: $(date)"
log ""

section "GIT / BUILD CONTEXT"
git rev-parse --show-toplevel 2>/dev/null | tee -a "$OUT" || true
git status --short 2>/dev/null | tee -a "$OUT" || true
log ""
log "Docker compose services:"
docker compose ps 2>/dev/null | tee -a "$OUT" || true

section "NEXT ROUTES IN SOURCE"
find frontend/app -maxdepth 4 -type f \( -name "page.tsx" -o -name "layout.tsx" -o -name "template.tsx" \) | sort | tee -a "$OUT"

section "POSSIBLE DUPLICATE / BACKUP / STALE FILES"
find frontend/app frontend/components -type f | egrep -i "broken|backup|old|stub|placeholder|copy|bak|tmp" | sort | tee -a "$OUT" || true

section "HOME PAGE SOURCE: ROUTE AND VIDEO / BADGE REFERENCES"
log "Files containing hero badge text:"
grep -R "Now serving Ghana" frontend/app frontend/components -n | tee -a "$OUT" || true
log ""
log "Files containing homepage headline:"
grep -R "The Future of African" frontend/app frontend/components -n | tee -a "$OUT" || true
log ""
log "Files containing homepage video sources:"
grep -R "istockphoto-945121252\|airport-footage\|Truck20004964\|homepage-video-bg" frontend/app frontend/components -n | tee -a "$OUT" || true

section "HOME PAGE RENDERED HTML CHECK"
HTML_HOME="$(mktemp)"
curl -s "$BASE_URL/" > "$HTML_HOME" || true

log "Rendered badge text:"
grep -o "Now serving Ghana,[^<]*" "$HTML_HOME" | head -10 | tee -a "$OUT" || true

log ""
log "Rendered homepage video sources:"
grep -o "/assets/videos/[^\"']*" "$HTML_HOME" | head -20 | tee -a "$OUT" || true

log ""
log "Rendered homepage contains video tag count:"
grep -o "<video" "$HTML_HOME" | wc -l | tee -a "$OUT" || true

log ""
log "Rendered homepage contains homepage-video-bg:"
grep -o "homepage-video-bg" "$HTML_HOME" | head -10 | tee -a "$OUT" || true

section "VIDEO ASSET AVAILABILITY"
for v in \
/assets/videos/airport-footage-panama-city-panama-ground-crew-unloading-cargo-shipment-from-airplane-on.webm \
/assets/videos/Truck20004964.mp4 \
/assets/videos/27427654-preview.mp4 \
/assets/videos/Vans-2220419522-640_adpp_is.mp4 \
/assets/videos/istockphoto-1473471897-640_adpp_is.mp4 \
/assets/videos/istockphoto-918314666-640_adpp_is.mp4 \
/assets/videos/istockphoto-945121252-640_adpp_is.mp4
do
  log "---- $v ----"
  curl -I -s "$BASE_URL$v" | egrep -i "HTTP/|content-type|content-length|accept-ranges|cache-control" | tee -a "$OUT" || true
done

section "LOCATION PAGES: SOURCE VIDEO REFERENCES"
for f in frontend/app/locations/*/page.tsx; do
  [ -f "$f" ] || continue
  log "---- $f ----"
  grep -n "video\|source src\|opacity\|bg-\[#021f2a\]\|AfruHeritage" "$f" | head -80 | tee -a "$OUT" || true
done

section "LOCATION PAGES: RENDERED VIDEO CHECK"
for p in /locations /locations/ghana /locations/kenya /locations/nigeria /locations/china /locations/djibouti /locations/somalia; do
  log "---- $p ----"
  TMP="$(mktemp)"
  curl -s "$BASE_URL$p" > "$TMP" || true
  curl -I -s "$BASE_URL$p" | egrep -i "HTTP/|location:" | tee -a "$OUT" || true
  log "video tags: $(grep -o "<video" "$TMP" | wc -l)"
  log "video sources:"
  grep -o "/assets/videos/[^\"']*" "$TMP" | head -10 | tee -a "$OUT" || true
  rm -f "$TMP"
done

section "FOOTER / PHONE / WHATSAPP SOURCE"
grep -R "000 000\|660 8337\|wa.me\|WhatsApp\|support@afruheritage" frontend/app frontend/components -n | tee -a "$OUT" || true

section "FOOTER / PHONE / WHATSAPP RENDERED"
for p in / /support /pricing /locations /fleetbase/console /customs; do
  log "---- $p ----"
  TMP="$(mktemp)"
  curl -s "$BASE_URL$p" > "$TMP" || true
  grep -o "+233[^<\"]*\|WhatsApp[^<\"]*\|wa.me/233506608337\|support@afruheritage.com" "$TMP" | head -20 | tee -a "$OUT" || true
  rm -f "$TMP"
done

section "PRICING SOURCE ORDER"
grep -R "Free Trial\|Starter\|Growth\|Enterprise\|Most Popular" frontend/app/pricing frontend/components -n | tee -a "$OUT" || true

section "PRICING RENDERED ORDER"
HTML_PRICING="$(mktemp)"
curl -s "$BASE_URL/pricing" > "$HTML_PRICING" || true
grep -o "Free Trial\|Starter\|Growth\|Enterprise" "$HTML_PRICING" | head -20 | nl -ba | tee -a "$OUT" || true

section "PUBLIC ROUTE AUTH CHECK"
for p in / /docs /support /pricing /locations /locations/ghana /locations/kenya /fleetbase/console /fleetbase/live-map /customs /customs/ghana /customs/kenya /customs/duty-calculator /customs/payment-callback; do
  log "---- $p ----"
  curl -I -s "$BASE_URL$p" | egrep -i "HTTP/|location:" | tee -a "$OUT" || true
done

section "MIDDLEWARE PUBLIC ROUTES"
sed -n '1,140p' frontend/middleware.ts | tee -a "$OUT"

section "POSSIBLE HARD-CODED STATIC MOCK VISUALS"
grep -R "Active Shipments\|12,847\|45+\|98.5%\|24/7\|motor\|rider\|delivery.png\|placeholder" frontend/app frontend/components -n | tee -a "$OUT" || true

section "NEXT BUILD CACHE / RUNNING IMAGE CHECK"
log "Local frontend .next exists?"
ls -ld frontend/.next 2>/dev/null | tee -a "$OUT" || true

log ""
log "Frontend container image:"
docker inspect afruheritage-frontend --format '{{.Image}} {{.Config.Image}}' 2>/dev/null | tee -a "$OUT" || true

log ""
log "Frontend container mounted/env ports:"
docker inspect afruheritage-frontend --format '{{json .NetworkSettings.Ports}}' 2>/dev/null | tee -a "$OUT" || true

section "SUMMARY FLAGS"
BADGE="$(grep -o "Now serving Ghana,[^<]*" "$HTML_HOME" | head -1 || true)"
PRICING_ORDER="$(grep -o "Free Trial\|Starter\|Growth\|Enterprise" "$HTML_PRICING" | head -4 | paste -sd '>' - || true)"
HOME_VIDEOS="$(grep -o "/assets/videos/[^\"']*" "$HTML_HOME" | wc -l || true)"

log "Rendered homepage badge: ${BADGE:-NOT_FOUND}"
log "Rendered pricing first 4 plan labels: ${PRICING_ORDER:-NOT_FOUND}"
log "Rendered homepage video source count: $HOME_VIDEOS"

if echo "$PRICING_ORDER" | grep -q "Free Trial>Starter>Growth>Enterprise"; then
  log "PRICING_ORDER: PASS"
else
  log "PRICING_ORDER: FAIL"
fi

if echo "$BADGE" | grep -q "Kenya"; then
  log "HOME_BADGE: PASS"
else
  log "HOME_BADGE: FAIL"
fi

if [ "${HOME_VIDEOS:-0}" -gt 0 ]; then
  log "HOME_VIDEO_SOURCE_PRESENT: PASS"
else
  log "HOME_VIDEO_SOURCE_PRESENT: FAIL"
fi

rm -f "$HTML_HOME" "$HTML_PRICING"

section "AUDIT COMPLETE"
log "Audit written to: $OUT"
