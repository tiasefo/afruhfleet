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

---

## PO-requested negative tests — **all PASS** (2026-10-12, post-review)

**T1 — Notification deduplication.** Both notify call sites now guard on a
real status change: the transition route compares previous vs. new status,
and the event path notifies only on a real transition or a non-status event.
Live results (`p24-neg-results.json`, shipment `AFR-E2C382-20261012-1444F8`):

| Action | Receiver | Tenant |
|---|---|---|
| transition → picked_up | 1 email | 1 email |
| re-transition picked_up (retry/no-op) | +0 | +0 |
| event restating picked_up | +0 | +0 |
| event → in_transit (real change) | +1 (2 total) | +1 (2 total) |

One logical change = exactly one notification per intended recipient —
including when transition and event paths both target the same status.

**T2 — Audit integrity.** `admin_audit_logs` is write-protected through the
app surface: `PUT/PATCH/DELETE` on the only audit route
(`/sentinel/diagnostics/audit-logs`) all return **405**; the sole read path
is GET. Audit-write failure behavior: `_safe_record` catches the DB failure
and emits `ERROR: Failed to write admin audit log` **with traceback** (verified
by simulating persistence failure inside the sentinel container) — never
silent. Design note, surfaced honestly: the current model is *audit-failure-tolerant*
— the admin mutation proceeds when the audit write fails, with the failure
loud in logs. A stricter fail-closed mode (mutation blocked when audit is
unwritable) is a PO-configurable policy change, not a code gap.

**T3 — Recipient isolation.** Tenant A's mailbox received **zero** messages
about tenant B's shipment across every transition and event in the test —
verified by polling tenant A's real inbox after each action (counts stayed
at 0 while B's grew to 2). Recipients are resolved from the shipment's own
`tenant_id` and `receiver_email` — there is no code path that can inject a
foreign tenant's address.

## Documents updated for the PO return

- `G04_OPS_CHECKLIST.md` — precise provider actions to unblock G-04.
- `VENDOR_AUTH_DESIGN.md` — D-01 identity-linked vendor model (awaiting approval).
- `TENANT_FEATURE_CONTROLS_DESIGN.md` — D-12 governed tenant overrides (awaiting approval).

---

## Round 2 — PO negative-test hardening + D-01/D-12 implementation (verified 2026-10-12)

### Notification idempotency (T1 follow-up)
- `add_shipment_event` now treats a re-submitted event with the same
  (shipment, event_type, location, description) recorded within 10 minutes
  as a duplicate: the persisted row is the idempotency record, the existing
  event is returned, and no second notification is sent.
- Live check: two identical POSTs returned the **same event id**
  (`40c2e250-…`), `shipment_events` count grew by 1, not 2.
- P24 regression re-run after the change: **10/10 PASS** — real transitions
  and real event changes still notify exactly once per recipient.

### Audit immutability at the DB layer (T2 follow-up)
- `admin_audit_logs` is now append-only in Postgres: ownership moved to
  `afruheritage_audit` (app role keeps SELECT+INSERT) and BEFORE
  UPDATE/DELETE/TRUNCATE triggers raise an exception for **every** role,
  including the owner/superuser.
- Verified: direct `UPDATE` and `DELETE` against the table as the app
  superuser both fail with `admin_audit_logs is append-only`.

### Fail-closed audit for sensitive mutations (PO risk-tiered policy)
- New `audit_attempt_or_503` + `fail_closed` mode on
  `audited_admin_mutation`: a durable `outcome=attempt` row is written
  BEFORE the mutation; if audit persistence fails, the mutation is
  rejected with HTTP 503 and never runs.
- Applied to: vendors, tenants, billing, domains, runtime, runners,
  feature_flags, kyc, payments, vendor-membership linkage (~26 proxied
  sites) — plus atomic same-DB commits in `users.py`, `auth.py`,
  `control_center.py` (audit row joins the business transaction; an audit
  write failure rolls the mutation back).
- Customer support ticket updates remain tolerant (PO "continue" tier),
  still audited with error logging on failure.
- Verified: simulated audit-store failure → `HTTP 503`, `mutation ran:
  False`; fail-open path → `mutation ran: True`.

### D-12 governed tenant feature overrides — IMPLEMENTED
- `tenant_has_feature` now resolves PO precedence:
  **platform lock** (`global_feature_flags.enabled_globally=false`)
  → **tenant override** (`tenant_feature_assignments`, grant/revoke with
  `enabled_until` expiry and `notes` reason)
  → **plan + add-on entitlement**.
  Overrides never bypass an inactive subscription.
- Sentinel guard: grants require the feature to exist AND be globally
  enabled — verified 409 on `pod`.
- Flag registry corrected: the five verified-live codes (`shipments`,
  `group_members`, `csv_import`, `public_tracking`, `maps`) are enabled;
  unlaunched codes stay locked.
- Live verified on tenant B: grant `d12_test_feature` → True; revoke
  `maps` → False despite plan; expired `enabled_until` → override ignored;
  cleanup → baseline restored.

### D-01 vendor identity — IMPLEMENTED (per approved design)
- `vendor_memberships` table (vendor↔user, role, status) created EMPTY —
  no email backfill.
- `require_vendor` / `require_approved_vendor` deps: membership is the
  ONLY authorization boundary; vendor status (suspended/rejected) and
  membership status enforced per request. No logistics subscription needed.
- `/me`, `/me/bookings`, `/me/bookings/{id}/accept|reject`,
  `/me/documents`, `/me/availability` reworked to membership auth;
  vendor-facing booking serializer drops tenant-staff `booked_by` email.
- Fixed a cross-account billing bug: vendor document uploads previously
  charged the uploader's tenant wallet — now vendor-scoped and free
  (platform verification cost).
- Sentinel admin: `GET/POST/DELETE /vendors/{id}/members` proxies with
  attempt+success audit. Linking an email without an account creates a
  `role=vendor` identity and sends a real reset-password invite
  (48h token) — activation via the existing verified reset flow.
- Live verified: register → Sentinel approve → link (account_invited=true)
  → reset → login → `/me` 200. Negatives: email-match WITHOUT membership
  → 403; suspended membership → 403; suspended vendor → 403; relink → 200.

---

## Round 3 — Customer-facing functionality (P25–P28)

New implementation evidence. All checks ran against the deployed
`https://afruheritage.com` / `https://admin.afruheritage.com` builds —
real browser (Playwright, headed=false, video+screenshots in
`prod-ui-cert/p27-evidence/` and `p28-evidence/`), real API calls, real
mail.tm mailbox delivery.

### D-01 vendor-facing portal — IMPLEMENTED + browser-verified (17/17)

New routes: public `/vendor/register` and `/vendor-accept`; authenticated
`/vendor` (profile/status/availability), `/vendor/bookings`
(accept/decline), `/vendor/documents` (identity/insurance/roadworthy
uploads). `role=vendor` login redirects to `/vendor`; AppShell renders
vendor navigation; middleware allowlists the two public routes.

P27 journey evidence (`prod-ui-cert/p27-vendor-portal.js`,
`p27-results.json` + tail run `p27-tail-results.json`):
- Registration form → backend `POST /vendors/register`: PASS
- Admin review (`{action:"approve"}` — fixed a pre-existing 422 payload
  mismatch in `frontend/lib/api.ts`): PASS
- Membership link → `account_invited:true`, real invitation email to a
  live mail.tm inbox containing a `/vendor-accept?token=` link: PASS
- Invitation acceptance UI sets password, clears `must_reset_password`,
  activates membership, token is single-use: PASS
- Vendor login redirects to `/vendor` — not the tenant dashboard: PASS
- Dashboard renders profile + `approved` status: PASS
- Availability update via UI → PATCH persisted: PASS
- Tenant B creates a real booking → vendor sees it in `/vendor/bookings`
  → clicks Accept → dialog confirm → status persisted `accepted`: PASS
- `/vendor/documents` renders identity/insurance/roadworthy slots: PASS
- `GET /vendors/me/bookings` contains no `booked_by` staff PII: PASS

### D-04 central Afruheritage support — IMPLEMENTED + browser-verified

Two real gaps found and fixed during browser certification:
- The apex support page showed an "email us" card and NO form when no
  tenant context resolved — platform intake was unreachable in a real
  browser. `create-ticket-form.tsx` now renders the form for platform
  scope on apex.
- `ticket-detail.tsx` refused to load without tenant context — public
  tracking was broken for apex-filed tickets. Now falls back to the
  `platform` scope for lookup and guest reply.

P28 evidence (`prod-ui-cert/p28-support-crm.js`, `p28-results.json`,
14/14 PASS):
- Apex `/support` form submits → platform ticket created + tracking
  token shown: PASS
- Public `/support/ticket/{token}` loads the thread unauthenticated and
  persists a guest reply: PASS
- Sentinel UI (super_admin login): ticket list shows the apex ticket,
  thread loads both messages, staff reply posts and appears in-thread,
  status change works: PASS
- Staff reply is visible back on the public tracking page: PASS

### D-08 CRM activity — IMPLEMENTED + browser-verified

- `crm_customers` / `crm_activities` now carry `tenant_id` (runtime
  migration); every `/crm` route filters by the caller's tenant —
  the previous global reads were a cross-tenant exposure.
- Tenant-facing `/crm/customers` page (real `crmApi` calls): list,
  create dialog, stage change, delete, expandable activity history,
  activity-log dialog.
- Sentinel admin `crm-panel.tsx` rewritten from mock data to real API.

P28b evidence (`prod-ui-cert/p28b-crm-ui.js`, 5/5 PASS): customer created
through the UI dialog appears in the list; stage changed to `qualified`
via UI; activity logged via dialog and rendered; both verified persisted
and tenant-scoped via the API afterwards.

### Tenant isolation (API, P25 — 21/21)

- Tenant A cannot read tenant B's CRM customer or activity by UUID (404).
- Tenant A cannot list/read tenant B's support tickets; tenant ticket
  lists return only own rows.
- Cross-tenant vendor booking accept/reject → 403.
- `tenant_id=platform` resolves only to the reserved
  `afruheritage-platform` ops tenant — arbitrary/missing IDs → 422.

### Remaining targeted security tests

- Concurrent event dedup (P26, 6/6): 10 parallel identical event POSTs →
  exactly one `ShipmentEvent` row, one notification; conflicting
  concurrent transitions resolve to a single state.
- Audit privilege: `admin_audit_logs` owned by `afruheritage_audit`
  (app role has SELECT+INSERT only) + BEFORE UPDATE/DELETE/TRUNCATE
  triggers that raise for every role — verified as app superuser.
- Cross-service consistency: Sentinel→CP proxy mutation under simulated
  audit-store failure → HTTP 503, downstream flag unchanged; under
  normal operation → durable `attempt` + `success` audit rows.

### Notable defects fixed in this round

1. Rate limiter keys on the ingress proxy IP (`172.19.0.7`), not the
   client — so `vendor_register` 2/hour and `login` 5/minute are
   effectively GLOBAL budgets, not per-client. This tripped repeatedly
   during certification and is a production availability defect:
   one busy customer can exhaust the login budget for everyone.
   Recorded as a finding for a proper `X-Forwarded-For`/trusted-proxy
   fix; test keys were reset from Redis to continue certification.
2. Vendor review helpers sent `{decision:"approved"}` — backend expects
   `{action:"approve"}` — fixed in `frontend/lib/api.ts`.
3. `/vendors/me/*` routes were shadowed by `/{tenant_id}` wildcards —
   route order corrected earlier; `/me/bookings` now resolves.
4. `SupportTicketStatus` was used in `reply_tenant_ticket` without an
   import — fixed (latent NameError on open tickets).

### Still open / blockers (unchanged)

- **G-04 branded sender: BLOCKED** — ops-side provider authorization +
  DKIM still pending (`G04_OPS_CHECKLIST.md`).
- **D-05 payments: sandbox certification only** — no live transactions.
- Rate-limiter client-IP fix (above) is recommended before broad UAT.

---

## Round 4 — PO gates R1/R2/R3 (commit after 4954da3d)

### R1 — Rate-limiter correction — VERIFIED (P29: 12/12)

Root cause discovered during certification: the real ingress topology is
**cloudflared → localhost published ports → docker-proxy → API**, not the
host nginx (which sits bypassed on :80). Docker-proxy masquerades all
published-port traffic as the bridge gateway, so a subnet-wide trust
range made `X-Real-IP` forgeable from anywhere reaching `:8100` — proven
live (a forged `6.6.6.6` bucket was created before the fix).

Fix applied:
- `get_client_ip()` resolves the client IP only when the immediate peer
  is in `TRUSTED_PROXY_CIDRS`; forwarded headers are ignored for
  untrusted peers. `CF-Connecting-IP` preferred, `X-Real-IP` fallback.
- Published ports bound to `127.0.0.1` (api 8100, frontend 3002,
  sentinel 9200, **postgres 5433, redis 6380**) — the direct external
  bypass is closed at the network layer AND the publicly exposed
  database/cache ports are no longer reachable from outside.
- Trusted set narrowed to exactly the two legitimate forwarders:
  gateway `172.19.0.1/32` (cloudflared path) and the frontend container
  `172.19.0.100` (browser `/api/v1` path — pinned via compose IPAM).
- `APP_ENV` corrected `development` → `production`: auth cookie now
  `Secure`, `/api/docs` disabled (404), HSTS emitted, login limit is the
  production 5/minute.

Evidence (P29): forged `X-Real-IP`/`CF-Connecting-IP` via edge → 403, no
bucket; forged via untrusted internal container → bucket keyed on the
container's own IP (no spoof); direct published-port access → connection
refused; per-client buckets (`24.17.193.224` vs `172.19.0.5` distinct);
brute-force 429s still fire.

### R2 — CRM tenant-isolation certification — VERIFIED (P30: 19/19)

- Direct object-ID negatives: tenant B gets **404** on tenant A's
  customer for GET, PATCH stage, PATCH owner, POST convert, DELETE, GET
  activities, POST activity.
- List isolation: B's list contains zero A records.
- Historical records: 3 pre-migration rows had NULL `tenant_id` — all
  Aug-30/31 test data ("Test Customer"/"Verify Customer"), unattributable
  to any tenant. Per mandate, not assigned — and now **invisible to all
  callers including superuser** (`tenant_id IS NOT NULL` enforced in
  both list and single-row fetch paths).
- Superuser ops view: sees *owned* cross-tenant rows only.
- Sentinel surface: no CRM proxy route exists (the 200 was the static
  SPA catch-all; verified by content-type).
- Access-log review: **no durable per-request access log exists**
  (`user_activity_logs` empty; container logs lost on recreate;
  cloudflared logs errors only — 2 `/crm` page loads, zero API reads).
  Whether the vulnerable global-query path was ever exploited cannot be
  determined from available records — recorded as a logging-coverage gap,
  not as confirmed access.

### R3 — Vendor identity regression — VERIFIED (P31: 21/21)

- Single-use invitation: first accept activates; replay of the same
  token → 404; garbage token → 404.
- Role preservation: `company_admin` user linked as vendor member keeps
  `role=company_admin` through invite, accept, and post-accept — the
  invite only activates the *membership*, never rewrites the identity.
- INVITED (unaccepted) membership grants no vendor access: 403.
- Suspension: suspended membership → 403; suspended vendor → 403 on
  profile and bookings.
- Booking isolation: vendor sees own booking; `booked_by` staff email is
  null in the vendor serializer; cross-tenant accept → 404.

### Known limitation (honest flag)

`_resolve_vendor_context` resolves the FIRST active membership — a user
holding memberships on multiple vendors sees a single vendor context.
Multi-vendor portal switching is a Phase-3 design item, not a security
hole (authorization is still membership-bound), but worth a PO decision.

### Deployment findings fixed in this round

- `APP_ENV=development` on production (see R1).
- Postgres/Redis published on `0.0.0.0` — now localhost-bound.

---

## Round 5 — PO gates U1/S1/P1/O1 (post-bbb3dbaf)

### S1 — Production security review — COMPLETE

- **External port closure**: `ss` shows api:8100, postgres:5433, redis:6380,
  frontend:3002, sentinel:9200 bound to 127.0.0.1 only; external connects
  to all five → refused/filtered.
- **Trusted-proxy persistence**: frontend container pinned at 172.19.0.100
  via compose IPAM; verified after full rebuild+recreate — TRUSTED_PROXY_CIDRS
  (env) survives deployment.
- **Environment-mode audit**: ALL APP_ENV consumers enumerated —
  auth cookie Secure, docs off, HSTS, login 5/min, structured logging.
  **Second defect found**: Sentinel ran `ADMIN_APP_ENV=development` →
  `/sentinel/docs` + `/sentinel/redoc` were PUBLIC. Fixed → both 404.
- **Credential exposure assessment**: Postgres used scram-sha-256
  (authenticated, but remotely reachable → **password rotated**, all
  connection strings updated, stack recreated). **Redis had NO
  authentication** while publicly bound → `requirepass` enabled; app,
  worker, beat re-verified against authenticated broker (NOAUTH confirmed).
- **Historical access evidence**: pg/redis container logs do not survive
  recreation; no external connection records found in surviving logs.
  **Cannot rule out past access** — recorded as unresolved visibility gap,
  not non-exploitation.
- **Handover key replaced**: static query-string key removed entirely.
  `/sentinel/uat-handover` now serves only via short-lived HMAC-signed
  links (default 72h, max 168h) minted by a staff-authenticated, audited
  endpoint (`POST /uat-handover/mint`, 401 unauth). Old key → 403;
  bad sig → 403; expired valid sig → 403; index+download → 200.
- Minor: concurrent-worker runtime-migration deadlock observed (benign —
  one worker wins, idempotent, self-heals on next boot).

### U1 — Expanded customer UAT — 16/16 (u1-expanded-uat.js) + regressions

Real browser journeys on afruheritage.com with real mail.tm mailboxes:

- **Company registration** `/register/company` → success screen → admin
  login → dashboard. **Found + fixed**: route was middleware-gated
  (unreachable publicly).
- **Self-serve registration** `/register` → plan picker → **real Paystack
  sandbox checkout redirect** (end-to-end billing path proven).
- **Staff invitation** → real invite email → `/invite/accept` → password →
  login → dashboard.
- **Fleet** → Add Vehicle via UI → persisted (UI + API verified).
- **Public tracking** `/track` → real shipment timeline.
- **Customer notification** → shipment event → real branded email to
  tenant mailbox.
- **Errors**: bad login → validation error; invalid tracking → error
  state; unauth `/shipments` → login redirect.
- **Isolation**: tenant B list = own records only; cross-tenant list →
  403; tenant B CRM page shows no A records.
- Regressions on current build: p28b CRM UI **5/5**.

### P1 — Payment sandbox certification — 17 PASS / 0 FAIL / 2 BLOCKED (p32)

**Paystack (sk_test)**: init → real `checkout.paystack.com` URL; unpaid
verify → graceful pending; forged/missing webhook signature → 401;
valid-signed unknown ref → ignored; signed charge.success → COMPLETED;
**duplicate charge.success → idempotent** (1 billing row, still
COMPLETED); charge.failed on unknown ref → graceful; cross-tenant verify
→ 403; unpaid payments granted zero credits.

**Defects found + fixed**:
- `payment_records` INSERT always failed — legacy `PaymentStatus` enum
  (pending/completed) collided with billing enum (UNPAID/PAID) on shared
  Postgres type `paymentstatus`. Split into `payment_record_status` via
  runtime migration; `/payments/initiate` now works end-to-end.
- `/billing/payments/verify` hardcoded Paystack verify for ALL providers —
  Flutterwave payments could never confirm. Dispatched by
  `payment.provider` to FLW `verify_by_reference`.
- No Flutterwave webhook existed; dead-code HMAC check used the wrong
  scheme. Implemented `/payments/webhook/flutterwave` with real
  `verif-hash` comparison + server-side re-verify by tx_ref + amount
  sanity check + idempotent entitlement via shared
  `finalize_verified_payment`.

**Flutterwave: BLOCKED** — configured `FLWSECK_TEST` returns provider-side
401 (revoked/expired sandbox credential). Webhook auth, verify dispatch,
and don't-trust-the-body guarantees verified against synthetic rows;
end-to-end needs fresh FLW sandbox keys from Ops. Manual-renewal model
stands: no recurring billing, refunds, or automated payouts.

### O1 — G-04 stays BLOCKED

`G04_OPS_CHECKLIST.md` is the actionable provider-side runbook: domain
provisioning, DKIM publish, SPF include, sender authorization, app sender
flip, DMARC tightening, plus per-journey DKIM/SPF/DMARC evidence required
to unblock.

## Round 6 — PO gates I1/S2 (post-96436c11)

### I1 — Individual customer journey — IMPLEMENTED + VERIFIED

**Product change** (not a test fix): `/register` now has an
Individual/Business account-type selector (default Individual).
- Individual: company field hidden AND not required; tenant provisioned
  with `account_type='individual'` and workspace named after the person —
  never a fabricated company.
- Business: company field shown + required; `account_type='business'`.
- `RegisterRequest` rejects business signups without `company_name` (422).
- `tenants.account_type` column added via runtime migration; existing rows
  backfilled 'business'. Exposed via `/tenants/me` and `/tenant-context/*`.
- Settings page distinguishes: "Account Information" + "Personal account"
  badge + Display Name label for individuals (Legal Company Name hidden).
- Welcome email wording: "your personal Afruheritage account" vs
  "your freight forwarding platform {company}".

**Browser evidence** (u1-expanded-uat.js, 20/20): toggle present;
individual hides company field; business exposes it; individual
registration → plan picker → real Paystack checkout → login →
`/tenants/me` returns `account_type=individual`. Company registration at
`/register/company` unchanged and passing.

### S2 — Operational hardening — COMPLETE

- **Migration race eliminated**: `pg_advisory_xact_lock(873421097)` wraps
  the runtime-migration block — every worker serializes behind the first
  instead of racing. Post-restart: zero deadlock errors across api,
  worker, beat (previous boots showed deadlock warnings + self-heal).
- **Full-stack restart persistence** (`compose down` + `up`):
  all five published ports still 127.0.0.1-only; redis NOAUTH unauth /
  PONG authed; worker healthy on authenticated broker; frontend pinned
  at 172.19.0.100; APP_ENV/ADMIN_APP_ENV/NODE_ENV all production;
  api+sentinel docs still 404.
- **Handover links**: now backed by a `uat_handover_links` registry —
  only sha256(token) stored. `POST /uat-handover/revoke` (staff) revokes
  all outstanding links; index + download require a live unrevoked DB
  record (signature alone no longer suffices — forwarded bearer links
  can be killed). Per-access audit rows record link owner, file, and
  client IP. Verified: mint → download 200 → revoke → 403.
- **Config drift audit**: runtime env consistent (production everywhere).
  Stale unused values documented: `.env.docker` has localhost OAuth
  redirect URIs (not consumed — runtime `.env` has prod URIs);
  CORS_ORIGINS includes localhost entries (accepted dev convenience).

### P2 / O2 — unchanged

Flutterwave still BLOCKED on Ops sandbox credentials; G-04 still BLOCKED
on provider-side sender authorization/DKIM/SPF + header verification.

## Round 7 — RC gates (post-e00ce84c)

### RC-1 — Flutterwave fully disabled: PASS
Init→400, verify→400, unknown provider→400, webhook→200 "ignored:
provider disabled" quarantined BEFORE signature/verify/finalize — a
valid-signed charge.completed against a real UNPAID payment left it
UNPAID with zero credits/subscriptions. UI option removed.

### RC-2 — Pilot email exception: CONDITIONAL
PILOT_EMAIL_ASSESSMENT.md. All 4 journeys (invite, password reset,
shipment notification, support) delivered to real mailboxes as
`Afruheritage <advisory@emidentity.com>`; SPF pass at provider hop; no
DKIM signature on wire; DMARC p=none. PO decision required; option to
enable DKIM on emidentity.com as interim.

### RC-3 — Paystack readiness: CONDITIONAL
PAYSTACK_PRODUCTION_READINESS.md completed incl. manual refund/dispute
procedure + renewal disclosures. Customer-facing "no auto-renewal"
disclosure added to billing page (current-plan card + plan dialog).

## Round 8 — RC-2 re-test after Ops DKIM enablement: AUTHENTICATED

After Operations enabled DKIM signing (zmail._domainkey verified in Zoho),
rc2-email-evidence.js re-run: 12/12 PASS. All four journeys now carry a
real `DKIM-Signature: s=zmail; d=emidentity.com` aligned with From —
dkim=pass, spf=pass, dmarc=pass. Raw MIME: prod-ui-cert/rc2-mime-*.txt.
advisory@emidentity.com is suitable as a disclosed temporary pilot sender;
G-04 (afruheritage.com sender) remains a separate open workstream.

## Round 9 — Controlled-pilot controls (PO authorization)

- PILOT_INVITE_ONLY gate on /auth/register + /companies/register:
  unlisted → 403; Redis SADD admit → immediate 200; domain admits work.
- PILOT_EMAIL_DISCLOSURE: footer line appended in SMTPProvider to every
  outbound message naming advisory@emidentity.com — verified in decoded
  MIME of a live welcome email (DKIM still s=zmail/d=emidentity.com).
- UI disclosure: register-page note + dismissible authenticated banner
  (NEXT_PUBLIC_PILOT_EMAIL_NOTICE).
- PILOT_OPERATIONS.md: admit runbook + real-defect log (customer
  failures recorded separately from certified tests).

## Round 10 — Pilot ops persistence + admission audit

- Redis allowlist survives `compose restart redis` AND
  `up -d --force-recreate redis` (AOF + redis_data volume);
  gate still 403/200 after full api/worker/beat restart.
- scripts/pilot_admit.sh: admit + audit JSONL (who/when/why) to
  durable logs/ volume; --invite sends branded DKIM-signed pilot
  invitation — verified to a real mailbox (register link + disclosure).
- Domain-wide admission deliberately excluded from the tool; requires
  explicit Ops approval per PO policy.
- PILOT_TESTING_GUIDE.md added for participants.

## Customs duty smoke test (on request)

- Public pages /customs, /duty-calculator, /ghana, /kenya: all 200.
- Guest calculate (GH vehicle): real breakdown (import duty, VAT, NHIL,
  GETFund, ECOWAS, EXIM, special levy) — mode=fallback, official=false,
  "ICUMS-style estimate" (UI labels it estimate throughout — honest).
- Free-limit enforcement: 2 free checks then paywall — **defect found:
  3rd call 502'd** (Paystack rejected synthetic @afruheritage.local
  email). FIXED: during pilot → clean `pilot_closed` register prompt;
  post-pilot → real email required (422), no more 502.
- Authenticated /customs/calculate + /countries: 200, real breakdown.
