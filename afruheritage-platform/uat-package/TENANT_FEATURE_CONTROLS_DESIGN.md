# D-12 — Tenant Feature Controls Design

**Status:** Submitted for PO approval · Phase 2, gate 2 · 2026-10-12

PO ruling: *"Governed tenant-specific feature controls are important for a
multi-tenant white-label SaaS."* — tenant overrides **under platform
governance**, not free tenant self-service.

---

## 1. What exists today (verified)

| Layer | State |
|---|---|
| Effective entitlement check | `tenant_has_feature(db, tenant_id, code)` — resolves from subscription status → plan tier (`TIER_FEATURES`) → `plan.features_json` → selected addons. **Already tenant-aware via plan**, but not overridable per tenant. |
| Global flags | `feature_flags` table + `GET/PATCH /admin/features/{key}` — platform-wide toggles (csv_import etc.). Verified working incl. Sentinel proxy + audit. |
| Sentinel `TenantFeatureAssignment` | Local Sentinel table + UI — **not connected** to the CP entitlement path. This is the wiring gap (sentinel → CP `/feature-flags/tenant/{id}` returns 404). |
| Enforcement | `require_feature(code)` dependency raises 403 `feature_not_available_on_plan`; admin probe `GET /admin/{tenant_id}/features/{code}` exists. |

## 2. Proposed model

### `tenant_feature_overrides` (new CP table)

| Column | Purpose |
|---|---|
| `id` | UUID PK |
| `tenant_id` | FK → tenants |
| `feature_code` | same vocabulary as `TIER_FEATURES` / plan features |
| `enabled` | bool |
| `reason` | free text — why the override exists (supportability) |
| `set_by` | admin email |
| `created_at` / `updated_at` | audit |
| **Constraint** | UNIQUE(`tenant_id`, `feature_code`) |

### Resolution order inside `tenant_has_feature` (in `entitlements.py`)

```
1. Tenant override row exists?
     → return its enabled value  (explicit platform decision wins)
2. No override:
     → subscription active + plan tier/features/addons (today's logic)
3. Global kill-switch:
     → flags marked platform_locked/global_off always return False,
       regardless of tenant overrides
```

Precedence: **platform lock > tenant override > plan entitlement > default off.**

### Governance controls

| Rule | Rationale |
|---|---|
| `PLATFORM_LOCKED` feature set — billing-critical or safety features cannot be tenant-overridden at all | Prevents an admin granting payment-gated or unsafe features |
| Overrides only by **super-admin** (Sentinel `require_super_admin`) | Tenants cannot self-grant entitlements |
| Every override write → `admin_audit_logs` (G-05 path) | "Governed" = attributable |
| `enabled_until` optional expiry on overrides | Time-boxed access without manual cleanup |
| Tenant-visible effective state is read-only | Customers see what they have, not what they could take |

## 3. API surface

**Control plane** (new endpoints under `/admin`):

```
GET    /admin/tenants/{id}/features          → effective + source per feature
PATCH  /admin/tenants/{id}/features/{code}   → upsert override {enabled, reason?, enabled_until?}
DELETE /admin/tenants/{id}/features/{code}   → remove override (falls back to plan)
```

`GET` returns per-feature `{code, effective, source}` where
`source ∈ {override, plan, addon, default}` — makes "why does this tenant
have X" answerable in one call.

**Sentinel**: point the existing `/feature-flags/tenant/{id}` proxy and the
control-center tenant-assignment UI at the new CP endpoints. Deprecate the
local `TenantFeatureAssignment` table (migrate any rows to CP overrides).

## 4. What this does NOT change

- Plan/tier definitions stay the source of commercial entitlement — overrides
  are for governance/support exceptions (e.g., "tenant X may pilot
  marketplace before GA", "disable csv_import on a noisy tenant").
- `require_feature` enforcement point is unchanged — the override check lives
  inside `tenant_has_feature`, so every existing guard benefits with zero
  route changes.
- Global `feature_flags` table unchanged — it remains the platform-level
  switch; tenant overrides sit one level below it.

## 5. Migration & verification

- Additive table via runtime migration; zero downtime; no backfill needed.
- Verify: set override on UAT tenant → `check_feature` + an actual guarded
  endpoint reflect it; override OFF on an entitled feature → 403; delete
  override → plan rule resumes; non-super-admin PATCH → 403; every write
  appears in `admin_audit_logs`.
- Flag-state consistency (known PARTIAL): `marketplace_enabled` /
  `vendor_registration` global flags get explicit reviewed defaults as part
  of this work.

## 6. Open question for PO

| Question | Options |
|---|---|
| Should tenant overrides be able to *grant* features above the tenant's plan, or only *revoke*? | **Recommend grant+revoke but audited** — matches how ops teams actually use flags; the audit trail is the control. Granting above plan is exactly the "pilot exception" use case. |
