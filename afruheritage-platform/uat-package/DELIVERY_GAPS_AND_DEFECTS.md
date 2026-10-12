# Afruheritage — Delivery Gaps & Defects Register

**Date:** 2026-10-11
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
- **Status:** Defect — fix required. Decision needed: who should receive
  notifications (company owner, end customer, or both).

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
- **Actual:** `admin_audit_logs` captures `admin.login` and `runners.listed` only.
  Mutations that proxy to the control plane — KYC approvals, feature-flag toggles,
  ticket status changes, tenant/billing actions — write **no audit row**.
- **Severity:** Medium-high (compliance/supportability)
- **Status:** Gap — audit middleware needed on all Sentinel write routes.

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
- **Actual:** Some endpoints (e.g., ticket status PATCH with a malformed UUID)
  bubble a database error as HTTP 500.
- **Severity:** Low (admin paths)
- **Status:** Defect — input validation hardening.

## Fixed defects (kept for the record)

Resolved during this cycle and re-verified in a real browser: driver list blank
names; apex support dead-end forms; ticket lookup requiring tenant context;
fabricated storefront vendors/stats/routes/warehouse-notices; zero-amount
"Payment Successful" email; onboarding duplicate-registration redirect;
invitation "Password Reset" subject; i18n 422 noise; Sentinel stale bundle,
subpage routing, mock dashboard metrics, fake plan fallbacks, auth chain.
