# Afruheritage — Delivery Gaps & Defects Register

**Date:** 2026-10-12 (updated after Phase 1 verification)
**What this is:** Capabilities that are *part of the product* but are broken or
incomplete today. These are **defects and delivery gaps — not deferred features**.
Please DO report anything in this list as a defect; that is its purpose.
*(Replaces the items that were incorrectly parked under "Coming Soon".)*

## G-01 — Shipment status email notifications: wired but unreachable

- **Expected:** When a shipment's status changes, a notification email is sent.
- **Actual:** The send functions exist and are wired — **but only in the tracking-event
  code path**. The status-transition endpoint the UI uses never calls them, so **no
  status email is ever sent**. Additionally, when it does fire, the recipient is the
  company's contact address — not the person who booked the shipment.
- **Severity:** High (PO: core gap)
- **Status:** ✅ **FIXED — verified 2026-10-12.** The transition endpoint now calls a
  shared `notify_shipment_status_change` helper; per D-03 both the tenant contact
  and `shipment.receiver_email` (new optional field on create form) are notified.
  Verified: transition → real mail.tm inbox delivery to BOTH recipients, delivered
  variant via event path, working public `/track?tracking_number=` link in the email,
  cross-tenant transition → 403, malformed id → 400.
  Evidence: `prod-ui-cert/p22-g01-results.json`, `p23-evidence/` screenshots+video.

## G-02 — Central Afruheritage support intake

- **Expected:** A way to reach Afruheritage platform support regardless of tenant.
- **Actual:** Support tickets always require a tenant context. The apex /support
  page honestly says tickets go through each company's portal — but there is no
  platform-level intake (billing issues, onboarding help, abuse reports).
- **Severity:** High (PO: core gap)
- **Status:** Gap — needs a platform-scope ticket path or defined support channel.
  **PO decision required.**

## G-03 — CRM activity history has no UI

- **Expected:** Record calls, notes, and follow-ups against customers.
- **Actual:** The activity model and API endpoints exist
  (`/customers/{id}/activities`) but no screen exposes them.
- **Severity:** Medium
- **Status:** Gap — UI missing for an implemented backend.

## G-04 — Branded email sender domain not operational

- **Expected:** Customer email arrives from `@afruheritage.com`.
- **Actual:** All mail sends from `advisory@emidentity.com` (display name
  "Afruheritage") — the mail account does not authorize the platform domain.
  DNS state verified 2026-10-11: SPF `v=spf1 a mx -all`, DMARC `p=none`,
  no DKIM records published.
- **Severity:** High for public pilot (brand trust + deliverability)
- **Status:** Blocked on an **ops action**, not a code defect — provision the sender
  domain, publish DKIM, then tighten DMARC.

## G-05 — Admin actions not fully audited

- **Expected:** Every administrative action is recorded (AGENT.md audit mandate).
- **Actual (before fix):** `admin_audit_logs` captured `admin.login`/`runners.listed`
  only; KYC approvals, flag toggles, ticket status changes, payments and
  control-center mutations wrote no row.
- **Severity:** Medium-high (compliance/supportability)
- **Status:** ✅ **FIXED — verified 2026-10-12.** `audited_admin_mutation` wraps all
  Sentinel write routes (tickets, KYC, feature flags, payments, control-center
  assignments); direct-DB mutations audit inline. Verified rows: actor email,
  action, entity_id, params, outcome=success AND outcome=error (a rejected ticket
  status also produced a durable audit row).
  Evidence: `admin_audit_logs` query output in Phase 1 evidence report.

## G-06 — Tenant-scoped feature flags unimplemented

- **Expected:** Per-tenant feature entitlements manageable in Sentinel.
- **Actual:** Global flags work end-to-end (verified toggle + persistence).
  The per-tenant endpoint proxies to a control-plane route that returns 404.
- **Severity:** Medium
- **Status:** Gap — backend endpoint missing.

## G-07 — Vendor self-onboarding has no UI

- **Expected:** Vendors register, submit documents, get approved, take bookings.
- **Actual:** The **entire backend lifecycle exists** — public `/vendors/register`
  (rate-limited), document upload, availability, marketplace matching, bookings
  (offer/accept/reject/complete), and Sentinel review/suspend controls. There is
  simply no vendor-facing page anywhere.
- **Severity:** Depends on PO's marketplace scope decision — see decision register.
- **Status:** Gap — frontend missing for a substantially implemented backend.
  This was previously mislabeled "Coming Soon" — it is actually ~80% built.

## G-08 — Truncated/invalid IDs return HTTP 500

- **Expected:** Bad identifiers return controlled 400/404.
- **Actual (before fix):** Malformed UUIDs bubbled a database error as HTTP 500 —
  both through Sentinel proxies and directly on control-plane endpoints.
- **Severity:** Low (admin paths)
- **Status:** ✅ **FIXED — verified 2026-10-12.** Two-layer fix: `uuid_or_400` guards
  ~20 parse sites (billing admin, payments, gallery, arrivals, tickets, KYC, team,
  auth), and a global `DataError→400` handler catches bare UUID-column compares.
  Sentinel validates path params before proxying. Verified: ticket/KYC/payment/
  shipment malformed IDs all return 400 — never 500.

## Fixed defects (kept for the record)

Resolved during this cycle and re-verified in a real browser: driver list blank
names; apex support dead-end forms; ticket lookup requiring tenant context;
fabricated storefront vendors/stats/routes/warehouse-notices; zero-amount
"Payment Successful" email; onboarding duplicate-registration redirect;
invitation "Password Reset" subject; i18n 422 noise; Sentinel stale bundle,
subpage routing, mock dashboard metrics, fake plan fallbacks, auth chain.

## Round 5 additions (2026-10-13)

| # | Defect | Severity | Status |
|---|--------|----------|--------|
| D-NEW-01 | `/register/company` middleware-gated — public company signup unreachable | HIGH | FIXED (allowlisted + rebuilt) |
| D-NEW-02 | Sentinel `ADMIN_APP_ENV=development` — /sentinel/docs + /redoc public | HIGH | FIXED (env=production; 404 verified) |
| D-NEW-03 | Redis bound publicly with NO authentication | CRITICAL | FIXED (requirepass + localhost bind) |
| D-NEW-04 | Postgres remotely reachable (scram auth present) | HIGH | FIXED (localhost bind + password rotated) |
| D-NEW-05 | `payment_records` enum collision — /payments/initiate always 500 | HIGH | FIXED (payment_record_status split) |
| D-NEW-06 | `/billing/payments/verify` ignored payment.provider — FLW unverifiable | HIGH | FIXED (provider dispatch) |
| D-NEW-07 | No Flutterwave webhook route; dead-code HMAC scheme | HIGH | FIXED (verif-hash + server re-verify + amount check) |
| D-NEW-08 | UAT handover long-lived static key | MEDIUM | FIXED (staff-minted expiring HMAC links) |
| D-NEW-09 | FLW sandbox credential rejected by provider (401) | BLOCKER | OPS ACTION — fresh FLWSECK_TEST needed |
| D-NEW-10 | Historical pg/redis exposure cannot be ruled out (no durable logs) | INFO | OPEN — recorded visibility gap |
| D-NEW-11 | Vendor resolver picks first active membership (multi-vendor users) | LOW | DEFERRED — deterministic context; PO decision |

## Round 6 additions (I1/S2 + readiness review)

- FIXED — `/register` forced a company name on individuals: account-type
  selector added; personal accounts get `account_type='individual'`
  workspaces named after the person.
- FIXED — `payment_provider` accepted arbitrary values and silently
  defaulted to Paystack; unknown providers now 400.
- FLUTTERWAVE DISABLED — `FLUTTERWAVE_ENABLED=false`; checkout option
  removed; init returns clean 400 until P2 cert.
- FIXED (S2) — runtime migration race across concurrent workers: all
  migrations now serialize behind `pg_advisory_xact_lock`; zero deadlock
  errors on latest full restart.
- IMPROVED (S2) — handover links registry-backed; per-link revoke
  (`POST /uat-handover/revoke/{id}`) + revoke-all + per-access audit.
