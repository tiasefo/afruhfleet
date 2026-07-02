#!/usr/bin/env bash
set -euo pipefail

TS="$(date +%Y%m%d-%H%M%S)"
OUT="reports/tenancy-architecture-$TS"
mkdir -p "$OUT"/{code,db,frontend,backend,admin,api}

echo "Creating tenancy architecture bundle: $OUT"

# 1. API route inventory
curl -s http://127.0.0.1:8100/openapi.json > "$OUT/api/openapi.json" || true

curl -s http://127.0.0.1:8100/openapi.json \
  | jq -r '.paths | keys[]' \
  | grep -Ei "tenant|store|storefront|branding|domain|subscription|billing|auth|user|cargo|shipment|fleet|template" \
  | sort > "$OUT/api/relevant-endpoints.txt" || true

# 2. DB schema dump for tenancy-related tables
docker compose exec -T postgres pg_dump -U afruheritage -d afruheritage \
  --schema-only \
  > "$OUT/db/full-schema.sql"

docker compose exec -T postgres psql -U afruheritage -d afruheritage <<'SQL' > "$OUT/db/tenancy-table-list.txt"
SELECT table_name
FROM information_schema.tables
WHERE table_schema='public'
AND (
  table_name ILIKE '%tenant%'
  OR table_name ILIKE '%store%'
  OR table_name ILIKE '%brand%'
  OR table_name ILIKE '%domain%'
  OR table_name ILIKE '%template%'
  OR table_name ILIKE '%subscription%'
  OR table_name ILIKE '%billing%'
  OR table_name ILIKE '%cargo%'
  OR table_name ILIKE '%shipment%'
  OR table_name ILIKE '%fleet%'
  OR table_name ILIKE '%user%'
)
ORDER BY table_name;
SQL

docker compose exec -T postgres psql -U afruheritage -d afruheritage <<'SQL' > "$OUT/db/tenancy-columns.txt"
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema='public'
AND (
  table_name ILIKE '%tenant%'
  OR table_name ILIKE '%store%'
  OR table_name ILIKE '%brand%'
  OR table_name ILIKE '%domain%'
  OR table_name ILIKE '%template%'
  OR table_name ILIKE '%subscription%'
  OR table_name ILIKE '%billing%'
  OR table_name ILIKE '%cargo%'
  OR table_name ILIKE '%shipment%'
  OR table_name ILIKE '%fleet%'
  OR table_name ILIKE '%user%'
)
ORDER BY table_name, ordinal_position;
SQL

# 3. Live tenant data snapshot
docker compose exec -T postgres psql -U afruheritage -d afruheritage <<'SQL' > "$OUT/db/amooksco-live-data.txt"
SELECT * FROM tenants WHERE slug='amooksco-logistics';
SELECT * FROM billing_subscriptions WHERE tenant_id=(SELECT id FROM tenants WHERE slug='amooksco-logistics');
SELECT * FROM warehouse_notices WHERE tenant_id=(SELECT id FROM tenants WHERE slug='amooksco-logistics');
SELECT count(*) AS cargo_records FROM cargo_records WHERE tenant_id=(SELECT id FROM tenants WHERE slug='amooksco-logistics');
SELECT count(*) AS tenant_customers FROM tenant_customers WHERE tenant_id=(SELECT id FROM tenants WHERE slug='amooksco-logistics');
SELECT email, role, is_superuser, is_tenant_admin, is_active FROM users WHERE tenant_id=(SELECT id FROM tenants WHERE slug='amooksco-logistics');
SQL

# 4. Backend tenancy code
find app -type f \( -name "*.py" -o -name "*.sql" \) \
  | grep -Ei "tenant|store|storefront|brand|domain|template|subscription|billing|auth|user|cargo|shipment|fleet" \
  > "$OUT/backend/backend-file-list.txt" || true

while read -r f; do
  mkdir -p "$OUT/backend/$(dirname "$f")"
  cp "$f" "$OUT/backend/$f"
done < "$OUT/backend/backend-file-list.txt"

# 5. Frontend tenancy code
find frontend/app frontend/components frontend/lib frontend/hooks -type f \( -name "*.tsx" -o -name "*.ts" \) \
  | grep -Ei "tenant|store|storefront|brand|domain|template|subscription|billing|auth|user|cargo|shipment|fleet|app-shell" \
  > "$OUT/frontend/frontend-file-list.txt" || true

while read -r f; do
  mkdir -p "$OUT/frontend/$(dirname "$f")"
  cp "$f" "$OUT/frontend/$f"
done < "$OUT/frontend/frontend-file-list.txt"

# 6. Admin console code if separate
if [ -d admin-console ]; then
  find admin-console -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.py" -o -name "*.js" \) \
    | grep -Ei "tenant|store|storefront|brand|domain|template|subscription|billing|auth|user|cargo|shipment|fleet" \
    > "$OUT/admin/admin-file-list.txt" || true

  while read -r f; do
    mkdir -p "$OUT/admin/$(dirname "$f")"
    cp "$f" "$OUT/admin/$f"
  done < "$OUT/admin/admin-file-list.txt"
fi

# 7. Current Amooskco V2 source and active route comparison
mkdir -p "$OUT/frontend/amooksco-v2-source" "$OUT/frontend/active-store-route"
cp -a tenant-theme-sources/amooksco-v2 "$OUT/frontend/amooksco-v2-source/" 2>/dev/null || true
cp -a frontend/app/store "$OUT/frontend/active-store-route/store" 2>/dev/null || true
cp -a frontend/components/amooksco-v2 "$OUT/frontend/active-store-route/components-amooksco-v2" 2>/dev/null || true
cp -a frontend/lib/amooksco.ts "$OUT/frontend/active-store-route/amooksco.ts" 2>/dev/null || true

# 8. Search maps
grep -RIn --exclude-dir=.next --exclude-dir=node_modules \
  "tenant_id\|tenant_slug\|slug\|storefront\|branding\|domain\|template\|subscription\|billing\|is_superuser\|is_tenant_admin\|Admin Console" \
  app frontend admin-console 2>/dev/null > "$OUT/code/search-map.txt" || true

# 9. Build current route map
find frontend/app -type f -name "page.tsx" | sort > "$OUT/frontend/next-page-routes.txt"

# 10. Pack it
tar -czf "$OUT.tar.gz" "$OUT"

echo ""
echo "DONE"
echo "Folder: $OUT"
echo "Archive: $OUT.tar.gz"
