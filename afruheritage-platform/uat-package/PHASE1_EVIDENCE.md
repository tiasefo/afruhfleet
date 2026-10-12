# Afruheritage — Phase 1 Evidence Report

**Date:** 2026-10-12 · **Scope:** G-01, G-05, G-08 (code) · G-04 (blocked, ops)

Every item below was verified against the live deployment
(`https://afruheritage.com`, `https://api.afruheritage.com`,
`https://admin.afruheritage.com`) — not a local or simulated environment.

---

## G-01 — Shipment notifications — **PASS**

**What changed**

- The status-transition endpoint (`POST /shipments/{tenant}/{id}/transition`)
  previously persisted the status but never sent email. It now calls the shared
  `notify_shipment_status_change` helper — the same code path the tracking-event
  flow already used.
- Per PO decision **D-03 (both recipients)**: the tenant contact **and** the
  shipment receiver are notified when a valid `receiver_email` exists.
  New optional `receiver_email` field added: `shipments` column (runtime
  migration applied), create schema, create-shipment form, response serializer.
- Emailed tracking link fixed: previously pointed at `app.afruheritage.com/track/{n}`
  which redirected to `/login`. Now `https://afruheritage.com/track?tracking_number={n}`
  — the real public route.

**Verified live**

| Check | Result |
|---|---|
| Shipment `AFR-E2C382-20261012-3DFCC6` created with `receiver_email` (real mail.tm box) | 200, field persisted |
| Owner transition → `in_transit` | 200 |
| Receiver inbox received "Shipment Update" email | PASS — real external delivery |
| Tenant contact inbox received same update | PASS |
| Event path → `delivered` | "Shipment Delivered" email received at tenant inbox 05:37Z |
| Email contains working public track link | PASS — `/track?tracking_number=` |
| Cross-tenant transition attempt (tenant A token on tenant B shipment) | 403 — no cross-tenant disclosure |
| Malformed shipment id | 400 |

Evidence: `prod-ui-cert/p22-g01-notifications.js`, `p22-g01-results.json`,
`p23-evidence/` (screenshots + video), mail.tm message subjects quoted above.

---

## G-05 — Sentinel audit coverage — **PASS**

**What changed**

- New `audited_admin_mutation` wrapper in `sentinel/services/audit_service.py`
  records every wrapped mutation with actor, action, entity, params, outcome —
  including `outcome=error` rows when the control plane rejects the mutation.
  Audit-write failures can never break the admin operation.
- Wired into all unaudited write surfaces: tickets status, KYC approve/revoke,
  feature-flag tenant/global updates, payment manual/refund/dispute,
  control-center feature + tenant-assignment create/update/delete.

**Verified live** (real mutations on `afruheritage` DB `admin_audit_logs`)

```
uat-sentinel@afruheritage.com | ticket.status_updated        | 823d8db4-… | {"status":"resolved","outcome":"success"}
uat-sentinel@afruheritage.com | ticket.status_updated        | 823d8db4-… | {"status":"open","outcome":"success"}
uat-sentinel@afruheritage.com | feature_flags.global_toggled | csv_import | {"enabled":false,"outcome":"success"}
uat-sentinel@afruheritage.com | feature_flags.global_toggled | csv_import | {"enabled":true,"outcome":"success"}
uat-sentinel@afruheritage.com | kyc.revoked                  | c707565b-… | {"outcome":"success"}
uat-sentinel@afruheritage.com | kyc.approved                 | c707565b-… | {"outcome":"success"}
uat-sentinel@afruheritage.com | ticket.status_updated        | 823d8db4-… | {"status":"bogus_state","outcome":"error","error":"CP 400: Unsupported ticket status"}
```

All mutations used on test records were restored to their original state.

---

## G-08 — Malformed identifiers — **PASS**

**What changed (two layers)**

- `uuid_or_400` helper (`app/api/params.py`) guards ~20 `uuid.UUID(...)` parse
  sites across billing admin, payments, gallery, new arrivals, tickets, KYC,
  team, auth — plus explicit guards on ticket/KYC path params.
- Global `DataError → 400` exception handler catches bare UUID-column compares
  (e.g., `Model.id == <param>`) anywhere in the API.
- Sentinel validates path-param UUIDs before proxying.

**Verified live**

| Probe | Before | After |
|---|---|---|
| `PATCH /sentinel/tickets/not-a-uuid/status` | 500 | **400** |
| `POST /sentinel/kyc/approve/garbage!!` | 500 | **400** |
| `GET /sentinel/payments/xyz123` | 500 | **400** |
| `POST /shipments/{t}/not-a-uuid/transition` | 500 | **400** |

---

## G-04 — Branded sender domain — **BLOCKED (ops)**

Unchanged: mail still sends from `advisory@emidentity.com`. Requires
provider-side action — provision `afruheritage.com`, publish DKIM, tighten
DMARC (`p=none` today, SPF present). Code is ready; the sender address is one
config value. **Remains BLOCKED until Operations verifies real branded
delivery.**

---

## Regression

Browser regression on the deployed build (Playwright, `p23-evidence/`):
owner login → dashboard, shipments list, create form (Receiver Email field
live), public tracking resolves, dashboard renders — **5/5 PASS**.
API regression: search, get, events, event-add, public track — all 200.

## Notes

- `get_current_user` already enforced path-tenant scope ("Tenant access
  denied"); the new `_assert_tenant_scope` adds route-level defense in depth
  for handlers not on that dependency.
- No production data harmed; all mutations used UAT/test records and were
  restored.
