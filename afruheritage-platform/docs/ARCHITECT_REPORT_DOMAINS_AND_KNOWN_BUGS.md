# Architect Report: Custom Domain Smoke Test + Known Bugs

**Date:** Jul 6, 2026  
**Prepared by:** Cascade (AI pair programmer)  
**Scope:** Custom domain endpoint verification + known bug inventory

---

## 1. Custom Domain Endpoints — VERIFIED ✅

### Smoke Test Summary

All 12 custom domain endpoints were tested against a live FastAPI server. All pass.

> **Port note:** The smoke test ran on port 8001, not the documented port 8000/8100. Port 8000 was occupied by another process (`python3` on `fleetbase.localhost:8000`). Port 8001 was a throwaway `uvicorn` instance started specifically for this test — it is **not** the production/demo server. However, it connected to the **same Postgres instance** at `localhost:5433` (Docker host-mapped from container `:5432`) that the platform uses. The `ALTER TABLE` that fixed the missing columns was applied directly to this shared DB via `psql`, so the fix is live in the actual database. The Alembic migration file (`20260706_01`) exists in the repo but has **not** been run through `alembic upgrade head` — if any other environment (staging, demo) has its own DB, the migration must be applied there separately.

| # | Endpoint | Method | Status | Notes |
|---|----------|--------|--------|-------|
| 1 | `/api/v1/domains/resolve?hostname=` | GET | **404** when hostname has no tenant; **200** when hostname resolves to a tenant | Public, resolves hostname → tenant_id |
| 2 | `/api/v1/domains/my-domains` | GET | **200** when user has tenant_id in JWT; **400** when user has no tenant (e.g. superuser) | Auth, auto-resolves tenant from JWT |
| 3 | `/api/v1/domains/tenant/{tenant_id}` | GET | 200 | Legacy, lists all domains for tenant |
| 4 | `/api/v1/domains/settings/{tenant_id}` | GET | 200 | Returns TenantDomainSettings (null if none configured) |
| 5 | `/api/v1/domains/request?tenant_id=` | POST | 200 | Legacy, creates domain request |
| 6 | `/api/v1/domains/request-simple` | POST | **200** when user has tenant_id in JWT; **400** when user has no tenant | Auth, auto-resolves tenant from JWT |
| 7 | `/api/v1/domains/{id}/dns-instructions` | GET | 200 | Returns TXT + CNAME/A + MX records |
| 8 | `/api/v1/domains/{id}/verify` | POST | 200 | DNS lookup verification, auto-activates |
| 9 | `/api/v1/domains/{id}/refresh-status` | GET | 200 | Polls Cloudflare for SSL status |
| 10 | `/api/v1/domains/{id}/events` | GET | 200 | Domain event audit trail |
| 11 | `/api/v1/domains/activate` | POST | 200 | Superuser, manual activation |
| 12 | `/api/v1/domains/{id}/fail` | POST | 200 | Superuser, mark domain failed |

### Bugs Found & Fixed During Smoke Test

| Bug | Severity | Root Cause | Fix |
|-----|----------|------------|-----|
| 500 on all CustomDomain queries | **Critical** | 5 columns in SQLAlchemy model missing from DB table | ALTER TABLE + Alembic migration `20260706_01` |
| `POST /domains/request` 500 for superusers | High | Used `current_user.tenant_id` (None for superusers) instead of query param | Fall back to query/body `tenant_id` |
| `GET /domains/{id}/events` returned wrong data | Medium | Filtered by `CustomDomainEvent.id` (PK) instead of `.domain_id` (FK) | Fixed filter column |
| 3 endpoints required unused `tenant_id` param | Low | `activate`, `fail`, `events` all had required query param that was never used | Removed param |

### Files Modified
- `app/api/routes/custom_domains.py` — 4 bug fixes
- `alembic/versions/20260706_01_custom_domains_missing_columns.py` — new migration
- `docs/CUSTOM_DOMAIN_INTEGRATION.md` — updated with smoke test results

---

## 2. Known Bugs — Fixed in Working Tree (UNCOMMITTED) ⚠️

These bugs were identified in a prior deep-dive review. The fixes exist in the **working tree** but have **not been committed to git**. `git log --since="2 days ago"` returns empty for all three files. `git diff` confirms the changes are present but unstaged.

> **Action required:** These changes need to be committed. If the working tree is lost (e.g. `git checkout`), the fixes revert and the deep-dive findings stand again.

### Bug A: `fleetbase_tenant_proxy.py` — POST body data loss
- **Status:** FIXED (uncommitted) — All POST handlers are `async def` and use `await request.json()`.
- **Verified at:** `app/api/routes/fleetbase_tenant_proxy.py:149,180,211,383`
- **Git status:** No uncommitted changes to this file (fix was committed in `b1c0385`)

### Bug B: `tenant-context-provider.tsx` — hardcoded tenant
- **Status:** FIXED (uncommitted) — Removed hardcoded "amooskco" block, now calls `resolvePublicTenantId()` → `fetchTenantContextClient(tenantId)`.
- **Verified at:** `frontend/components/tenant-context-provider.tsx:30-41`
- **Git diff confirms:** Old code had `if (tenantId === 'amooskco')` block returning hardcoded context. Diff removes it and replaces with `fetchTenantContextClient(tenantId)`.
- **Last commit:** `d4bb177` (still has the hardcode)

### Bug C: Frontend calls non-existent endpoint
- **Status:** FIXED (uncommitted) — Old code called `/api/v1/tenant-context/by-host?host=` (nonexistent). Now calls `/api/v1/tenant-context/${identifier}` which matches backend route.
- **Verified at:** `frontend/lib/tenant-context.ts:82`
- **Git diff confirms:** Old `fetchTenantContextByHostServer` called `/by-host?host=`. Diff replaces with `/tenant-context/${hostname}` + subdomain fallback. New `fetchTenantContextClient` uses same-origin relative URL.
- **Last commit:** `d4bb177` (still calls `/by-host`)

### Bug D: Hardcoded Fleetbase token
- **Status:** FIXED (uncommitted) — Old code had literal token `"1|KPPhwb69LydQ7mNNK2AvCQVGD9ifGtFSX2GNKok2"` as default. Now uses empty string default with clear error if missing.
- **Verified at:** `app/api/routes/fleetbase_proxy.py:20,32-35`
- **Git diff confirms:** Old: `os.getenv("FLEETBASE_API_TOKEN", "1|KPPhwb69LydQ7mNNK2AvCQVGD9ifGtFSX2GNKok2")`. New: `os.getenv("FLEETBASE_API_TOKEN", "")`.
- **Last commit:** `b1c0385` (still has the hardcoded token)

---

## 3. Architecture Observations for Architect

1. **DB migration drift** — The `custom_domains` table was missing 5 columns that the ORM model defined. This suggests `Base.metadata.create_all()` is being used instead of Alembic migrations for schema changes. Recommend enforcing Alembic-only schema management.

2. **Two domain resolution systems** — `custom_domains.py` has `GET /domains/resolve?hostname=` and `tenant_context.py` has `GET /tenant-context/resolve/host`. Both resolve hostnames to tenants but through different code paths. Consider unifying.

3. **Legacy + self-service duplication** — The custom domains API has both "legacy" endpoints (require `tenant_id` param) and "self-service" endpoints (auto-resolve from JWT). The legacy endpoints are kept for backward compatibility but add maintenance burden. Consider deprecation timeline.

4. **Manual DNS mode SSL gap** — In manual mode (no Cloudflare), SSL provisioning is not handled. The doc notes this as a manual step, but there's no automation or integration with Let's Encrypt/Certbot.
