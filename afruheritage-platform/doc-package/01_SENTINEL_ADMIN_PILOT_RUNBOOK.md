# 01 — Sentinel Administrator Pilot Runbook

**Document status:** Source-verified draft for joint PO + architecture review. Not yet approved for operational handoff.
**Generated from:** Repository `afruheritage-platform`, branch `amooskco-storefront-v2`, commit `ee57ba5d` + Round-1 authorization fixes. **Deployment truth:** `api`/`worker`/`beat` run bind-mounted repo source (deployed = working tree); the customer `frontend` image is rebuilt per change; the **Sentinel UI image was last built 2026-08-25** while its backend (`sentinel_app`) is bind-mounted — see `EVIDENCE_INDEX.md` and Doc 4 R-004. Do not assume all components run the same revision.
**Verified against:** Live deployment `https://admin.afruheritage.com/sentinel` on 2026-10-14. Screenshots in `screenshots/`.

> **How to read this document.** Every workflow is marked:
> - **[TESTED]** — executed against the running deployment during verification.
> - **[INSPECTED]** — confirmed to exist in the UI source and screenshots; not executed end-to-end.
> - **[CLI ONLY]** — **NOT AVAILABLE IN SENTINEL UI.** Command-line / Operations procedure documented.

---

## 1. What Sentinel is

Sentinel is the internal operations console for Afruheritage. It is a separate Next.js frontend + FastAPI backend (`sentinel/`) served at `https://admin.afruheritage.com/sentinel`. It manages platform tenants, admin users, vendors, billing, payments, KYC, support tickets, feature flags, domains, runtimes, diagnostics, and Fleetbase runtime operations.

It is **not** the customer application and is **not** where pilot-customer email allowlist admission lives today (see §6).

---

## 2. Logging in — [TESTED]

| Step | Action |
|---|---|
| 1 | Open `https://admin.afruheritage.com/sentinel/login` |
| 2 | Enter admin **Email** and **Password** |
| 3 | Click **Sign In** |
| 4 | You land on **Dashboard** (`/sentinel/dashboard`) |

**Screenshot:** `screenshots/s01-sentinel-login.png`, `s02-sentinel-dashboard.png`.

**Backend:** `POST /sentinel/auth/login` (`sentinel/sentinel_app/api/routes/auth.py`) issues a JWT (`iss=admin-console`) plus a `control_plane_token` used by `X-CP-Token` calls into the main API. `GET /sentinel/auth/me` returns the current admin.

**Roles** (`sentinel/sentinel_app/api/deps.py`):
- `admin` — can use 119 of 141 routes.
- `super_admin` — additionally required by 14 routes (admin-user management, control-center tenant features, and other high-risk actions).
- Open routes: `/sentinel/auth/login`, `/sentinel/auth/bootstrap` (first-admin bootstrap), OAuth login/callback/providers, and the tokenized UAT-handover download endpoints.

**If login fails:** verify the admin account exists in Sentinel **User Management**, confirm credentials with the account issuer, and check `afruheritage-sentinel` container health (`docker ps` / `/sentinel/health`).

---

## 3. Navigation map (actual sidebar) — [INSPECTED + TESTED on visited pages]

| Sidebar item | Route | Backend calls it makes |
|---|---|---|
| Dashboard | `/dashboard` | `/sentinel/summary`, dashboard stats |
| User Management | `/dashboard/users` | `/sentinel/auth/users` |
| Tenants | `/dashboard/tenants` | `/sentinel/tenants`, `/sentinel/tenants/requests` |
| Templates | `/dashboard/templates` | `/sentinel/templates/admin` |
| Vendors | `/dashboard/vendors` | `/sentinel/vendors` |
| Billing | `/dashboard/billing` | `/sentinel/billing/*` |
| Analytics | `/dashboard/analytics` | `/sentinel/summary` |
| Architecture | `/dashboard/architecture` | static/diagram view |
| Knowledge Base | `/dashboard/knowledge-base` | knowledge base content |
| Blueprint | `/dashboard/blueprint` | blueprint view |
| Runners | `/dashboard/runners` | `/sentinel/runners` |
| Domains | `/dashboard/domains` | `/sentinel/domains/*` |
| Runtimes | `/dashboard/runtimes` | `/sentinel/runtime/*` |
| KYC | `/dashboard/kyc` | `/sentinel/kyc/list`, `/sentinel/kyc/{action}/{id}` |
| Tracking | `/dashboard/tracking` | `/sentinel/tracking/public?tenant_id=` |
| Tickets | `/dashboard/tickets` | `/sentinel/tickets`, reply/status endpoints |
| Vendor Actions | `/dashboard/vendor-actions` | `/sentinel/vendors?status=pending`, review |
| Control Center | `/dashboard/control-center` | `/sentinel/control-center/*` |
| Documentation | `/dashboard/documentation` | documentation view |
| Shipments | `/dashboard/shipments` | `/sentinel/shipments` |
| Payments | `/dashboard/payments` | `/sentinel/payments` |
| Fleetbase | `/dashboard/fleetbase` | `/sentinel/fleetbase/tenant/{id}/debug|restart` |
| Feature Flags | `/dashboard/feature-flags` | `/sentinel/feature-flags/global` |
| Diagnostics | `/dashboard/diagnostics` | `/sentinel/diagnostics/{system,endpoints,audit-logs}` |

Full machine-readable route+permission table: `evidence/sentinel_route_permissions.txt` (141 routes).

---

## 4. Core administrative workflows

### 4.1 Manage admin users — [TESTED page, INSPECTED actions]

- **Page:** User Management (`/dashboard/users`). Screenshot `s-users.png`.
- **What you see:** list of console admins with role badges (`super_admin`, `admin`), search box, **+ New Admin User** button.
- **Backend:** `GET /sentinel/auth/users`; create via `POST /sentinel/auth/users` — **super_admin only**.
- **Verify a new admin:** have them log in at `/sentinel/login`; `GET /sentinel/auth/me` returns their profile.
- **Failure:** non-super_admin attempting create gets HTTP 403 `Super admin access required`.

### 4.2 Manage tenants — [TESTED]

- **Page:** Tenants (`/dashboard/tenants`). Screenshot `s-tenants.png`.
- **What you see:** tenant cards with status badge (`draft`, `provisioning`, `active`, `suspended`, `approved`), plan, contact email; per-tenant actions **Approve**, **Storefront**, **Preview**, **Delete**; **+ New Tenant** button; search; **Tenant Requests** panel with status filter (e.g. *Pending Review*).
- **Backend (per-tenant actions):**
  - `POST /sentinel/tenants/{id}/approve` (body `{verification_notes}`) → status `approved`
  - `POST /sentinel/tenants/{id}/provision` → status `provisioning` / `Fleetbase org provisioned`
  - `POST /sentinel/tenants/{id}/launch` (body `{runner_id}`) → status `active`
  - `POST /sentinel/tenants/{id}/activate`, `POST /sentinel/tenants/{id}/suspend`
  - Tenant requests: `GET /sentinel/tenants/requests?status=...`, `POST /sentinel/tenants/requests/{id}/auto-provision`
- **Lifecycle verified in source:** `draft → approved → provisioning → active`, plus `suspended`, `rejected`.
- **Expected result:** the badge changes to the new state; a toast confirms (e.g. *Tenant approved*).
- **If it fails:** check Diagnostics → audit logs; the API returns a real error detail (not a generic message).

### 4.3 View shipments — [TESTED]

- **Page:** Shipments (`/dashboard/shipments`). Screenshot `s-shipments.png`. Reads `GET /sentinel/shipments` — a cross-tenant operational view.

### 4.4 Support tickets — [TESTED]

- **Page:** Tickets (`/dashboard/tickets`). Screenshot `s-tickets.png`.
- **Actions:** list tickets (`GET /sentinel/tickets`), open a ticket to see messages (`GET /sentinel/tickets/{id}/messages`), reply (`POST /sentinel/tickets/{id}/reply`), change status (`PATCH …/status`).

### 4.5 Tracking lookup — [TESTED]

- **Page:** Tracking (`/dashboard/tracking`). Enter a `tenant_id`; calls `GET /sentinel/tracking/public?tenant_id=…`.

### 4.6 Vendors — [TESTED]

- **Pages:** Vendors (`/dashboard/vendors`) and Vendor Actions (`/dashboard/vendor-actions`).
- **Actions:** list vendors, review (`POST /sentinel/vendors/{id}/review`), suspend (`POST /sentinel/vendors/{id}/suspend`), reject. Pending vendors appear under Vendor Actions for triage.

### 4.7 Billing — [TESTED]

- **Page:** Billing (`/dashboard/billing`). Screenshot `s-billing.png`.
- **Actions (real API calls):** manage plans (`GET/PATCH/DELETE /sentinel/billing/plans`), promotions, view a tenant subscription (`GET /sentinel/billing/subscriptions/{tenant_id}`), view wallet (`GET /sentinel/billing/wallets/{tenant_id}`), **assign plan** (`POST /sentinel/billing/assign-plan`), **adjust credits** (`POST /sentinel/billing/adjust-credits`).
- **No live charging happens here.** Payments remain sandbox/pilot-restricted (§9).

### 4.8 Payments — [TESTED]

- **Page:** Payments (`/dashboard/payments`). Lists payment records via `GET /sentinel/payments`. Refund/dispute endpoints exist in the backend (`/sentinel/payments/{id}/refund`, `/dispute`) — **do not exercise against real charges during the pilot.**

### 4.9 KYC — [INSPECTED]

- **Page:** KYC (`/dashboard/kyc`). List submissions (`GET /sentinel/kyc/list`), act on each (`POST /sentinel/kyc/{action}/{kyc_id}`).

### 4.10 Feature flags & Control Center — [TESTED]

- **Feature Flags** (`/dashboard/feature-flags`): global flags (`GET/PATCH /sentinel/feature-flags/global`). Screenshot `s-feature-flags.png`.
- **Control Center** (`/dashboard/control-center`): platform feature catalog and per-tenant feature overrides (`/sentinel/control-center/features`, `/tenant-features`). Tenant-feature writes require **super_admin**. Screenshot `s-control-center.png`.

### 4.11 Domains — [TESTED]

- **Page:** Domains (`/dashboard/domains`). Activate a domain (`POST /sentinel/domains/activate`), view per-tenant (`GET /sentinel/domains/tenant/{tenant_id}`).

### 4.12 Runtimes / Runners / Fleetbase — [TESTED]

- **Runtimes** (`/dashboard/runtimes`): per-tenant runtime status (`GET /sentinel/runtime/tenant/{id}`), deploy/retry/suspend.
- **Runners** (`/dashboard/runners`): provisioning runners (`GET /sentinel/runners`).
- **Fleetbase** (`/dashboard/fleetbase`): internal-only tenant debug + restart (`/sentinel/fleetbase/tenant/{id}/debug`, `/restart`). **This is the only acceptable place Fleetbase is visible** — privileged internal tooling.

### 4.13 Diagnostics — [TESTED]

- **Page:** Diagnostics (`/dashboard/diagnostics`). Three panels: system health (`GET /sentinel/diagnostics/system`), endpoints, and **audit logs** (`GET /sentinel/diagnostics/audit-logs`) — the first place to investigate failures.

---

## 5. Authorizing an external pilot participant — **[CLI ONLY]**

> **NOT AVAILABLE IN SENTINEL UI.** There is no pilot-invitation screen in Sentinel today. Admission is an Operations command-line procedure against the Redis allowlist. Do not build a UI just for the pilot.

**Who is authorized:** Operations staff explicitly approved by the Product Owner. Individual-email admission only; domain-wide admission requires explicit PO approval.

**Procedure** (from `uat-package/PILOT_OPERATIONS.md` — [TESTED end-to-end]):

```bash
# On the platform host
./scripts/pilot_admit.sh --email participant@company.com \
    --by "<operator name>" --reason "<why admitted>" \
    [--invite "Participant Name"]   # sends branded invite email
```

- Writes an audit line `{ts, action, email, by, reason}` to `logs/pilot_admissions.log`.
- `SADD pilot:allowed_emails <email>` in Redis — takes effect immediately, no restart.
- `--invite` sends the branded invitation through NotificationService (temporary sender `advisory@emidentity.com`, DKIM-signed, disclosure footer appended).
- **Domain-wide admission** is deliberately not in the script — it needs a manual `SADD pilot:allowed_domains` plus your own audit line.

**Verify admission:** attempt registration at `https://afruheritage.com/register` with that email — expect HTTP 200 (vs 403 `pilot_closed` for non-admitted emails). [TESTED]

**Remove/suspend access:** `SREM pilot:allowed_emails <email>` (immediate); if they already registered, suspend their tenant via Tenants → **Suspend**.

**Persistence/recovery:** Redis runs `appendonly yes` on named volume `redis_data` — allowlist survives restart and container recreation [TESTED]. Worst case, replay `logs/pilot_admissions.log` back through `pilot_admit.sh`.

---

## 6. Confirming a participant registered — [TESTED + INSPECTED]

- **Tenants** page → search their company/email — a new `draft`/`free_trial` tenant appears.
- **Customer shipments/support** they create then appear under Shipments/Tickets.
- There is no dedicated "pilot signups" report; use the Tenants list + audit logs.

---

## 7. Investigating failures — [TESTED]

1. **Diagnostics → Audit Logs** for the event (signup, invite, launch, billing change).
2. **Diagnostics → System / Endpoints** for service health.
3. Container logs on the host: `docker logs afruheritage-api`, `afruheritage-sentinel`, `afruheritage-worker`.
4. Record customer-impacting defects in `uat-package/PILOT_OPERATIONS.md` defect log (see `D-001` customs paywall entry for format).

---

## 8. Verifying no live charges — [TESTED by policy + INSPECTED]

- **Payments** page should show no successful live captures (only sandbox).
- Backend enforcement: Flutterwave disabled at initiation/verification/webhook/entitlement; Paystack remains **sandbox-only** — production keys are not configured. Customs guest paid-checks return `pilot_closed` while `PILOT_INVITE_ONLY=true`.
- If you see a real capture: treat as an incident, record it, escalate — do not refund silently.

---

## 9. What this runbook does NOT cover

- Pilot-customer invitation UI (does not exist — §5 is CLI).
- Permanent branded email (G-04 open Operations workstream — temporary `emidentity.com` sender in use, disclosed to users).
- Live payment operations (not authorized).
