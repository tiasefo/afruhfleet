# Afruheritage — Product Owner Decisions Required (Expanded Register)

**Date:** 2026-10-11 · **For PO ruling:** approve / reject / amend each row.
No approval is inferred from prior correspondence. Each decision lists the exact
question, alternatives with implications, supporting evidence, and a developer
recommendation (advisory only).

---

## D-01 — Vendor marketplace launch scope

**Question:** Does the launch include vendor registration, approval, and
marketplace bookings — or are vendors deferred as an approved exclusion?

**Implemented tenancy model (verified in code):** platform-marketplace.
`DeliveryVendor` is a platform-global entity (unique email, no tenant_id);
`VendorServiceBooking.tenant_id` scopes each booking to the booking tenant.
So the backend implements *"Afruheritage marketplace participants serving
multiple logistics companies"* — **not** tenant-owned vendors. A vendor UI
built on this model is correct for that business model only.

**Alternatives:**
- **A) Complete for launch** — build vendor registration page, vendor portal
  (documents, availability, bookings), and tenant-side marketplace UI; then
  verify the full booking lifecycle. Implication: vendor auth model must be
  decided (vendors have no user account today — `/me/*` endpoints exist; auth
  mechanism must be verified). Effort: meaningful frontend build.
- **B) Approve deferral** — keep the backend dormant; marketplace stays out of
  the launch offering; revisit post-launch. Implication: honest scope, but the
  existing investment sits idle and the vendor APIs remain untested production
  surface.
- **C) Tenant-scoped vendors** — if the intended model is "each freight company
  manages its own vendors", the current schema is the wrong shape and needs a
  tenancy redesign. Implication: larger rework; only choose if B2B model differs.

**Recommendation:** B for the initial launch IF the core offer is
company/individual shipping + fleet; A if marketplace liquidity is the
business thesis. **Do not silently defer** — this needs your explicit ruling.

---

## D-02 — Driver self-service at launch

**Question:** Is managed-record fleet management sufficient at launch, or must
drivers authenticate and update jobs?

**Evidence:** Driver CRUD via Fleetbase proxy verified (P21-04). No driver auth,
no driver app, no driver job-acceptance path exists anywhere. Vendor bookings
carry `driver_name`/`driver_phone` as free-text fields — not identities.

**Alternatives:** A) Managed records only (defer driver portal) — fleets
dispatch manually; simplest honest scope. B) Driver authentication required —
needs identity model + mobile-first job workflow; large build.

**Recommendation:** A — managed records cover a fleet-management MVP; driver
self-service is a phase-2 workflow.

---

## D-03 — Shipment notification recipients

**Question:** Who should receive shipment status notifications: tenant owner,
end customer (receiver), or both?

**Evidence (defect G-01):** `send_shipment_status_update_email` /
`send_shipment_delivered_email` ARE wired — in `record_tracking_event`
(shipment_service.py:948-968) — but the UI transition endpoint never reaches
that path, so nothing is ever sent. When it does fire, the recipient is
`tenant.contact_email`. Send failures are logged and swallowed. No end-customer
email field is captured on shipments today (receiver_name exists; receiver
email collection would be new).

**Alternatives:** A) Tenant owner only (current wiring — smallest fix).
B) End customer (requires capturing receiver email + consent).
C) Both.

**Recommendation:** A now (minimal fix to unblock), C as the target — a freight
platform should notify the receiver; capturing receiver email is small but is
a schema + form change needing your sign-off.

---

## D-04 — Central platform support intake

**Question:** Must Afruheritage provide platform-level support independent of
tenant-portal tickets at launch?

**Evidence:** `/support-crm/public/tickets` requires a resolvable tenant (422
otherwise). Admin ticket list covers all tenants; status updates verified
working. Help assistant + branded support emails exist as informal channels.
Apex /support already tells visitors tickets go through company portals.

**Alternatives:** A) Platform-scope ticket path (tenant_id optional → platform
queue in Sentinel) — moderate build, gives a real intake. B) Defined channel
(support@afruheritage.com + help assistant) — zero build, weaker audit trail.

**Recommendation:** A — a SaaS control plane needs a supportable intake with
audit; the plumbing already exists and the change is contained.

---

## D-05 — Paid billing at launch

**Question:** Launch monetized (real charges) or trial-only?

**Evidence:** `paystack_client` + `_flw` (Flutterwave) implement
initialize/verify/webhook-signature only — one-time charge flow. **No provider
refund, no provider recurring-subscription, no payout/transfer support**
exists; subscription lifecycle (trial/cancel/pause/resume) is internal
entitlement + wallet-credit accounting. Sentinel refund/dispute returns honest
501. Live charges never exercised end-to-end.

**Alternatives:** A) Sandbox-certify charges → controlled live verification →
paid launch (PO direction; refunds would remain manual). B) Trial-only launch;
monetize after sandbox certification.

**Recommendation:** B for the first public cohort IF charging at launch isn't
commercially mandatory; A if revenue must start day one — but scope refunds as
manual ops until built.

---

## D-06 — Warehouse operations module

**Question:** Is warehouse management part of the Afruheritage offering?

**Evidence:** No implementation anywhere (no routes, models, or pages). It only
exists as a register entry — it should never have been listed as Coming Soon.

**Alternatives:** A) In scope → new build required (not started). B) Out of
scope → remove from all offering/docs immediately (zero cost).

**Recommendation:** B — nothing is built; do not hold launch for it. If future,
it's a post-launch epic, not a deferral.

---

## D-07 — Analytics depth at launch

**Question:** Are basic operational counts sufficient, or are dedicated
analytics dashboards required?

**Evidence:** Real stats exist (tenant dashboard endpoint; Sentinel analytics —
real users/tenants/shipments/revenue/KYC counts, verified). No dedicated
analytics module.

**Alternatives:** A) Basic counts suffice (your stated direction).
B) Dedicated dashboards required → new build.

**Recommendation:** A — real operational counts exist; advanced BI is an
enhancement.

---

## D-08 — CRM activity history UI at launch

**Question:** Is the customer-facing activity workflow required at launch?

**Evidence:** `CrmActivity` model + GET/POST `/customers/{id}/activities`
implemented; `/crm` + contacts + quotes UI verified; no activities screen.

**Alternatives:** A) Build activities UI before launch (contained — backend
done). B) Contacts+quotes only at launch.

**Recommendation:** A — your direction says "meaningful follow-up and activity
history"; backend is done, the gap is one screen.

---

## D-09 — Additional storefront templates

**Question:** May the 5 demo templates (mall/ecommerce/restaurant/booking/
real-estate) remain publish-blocked at launch?

**Evidence:** Fleet/freight templates live and verified on real tenants. Demo
templates contain fabricated content and are now publish-blocked server-side
(degrade to generic shell).

**Alternatives:** A) Stay blocked until tenant-configurable (your stated
direction). B) Required at launch → real-content build per template.

**Recommendation:** A — previews are honest, publication is prevented.

---

## D-10 — Custom domains at launch

**Question:** Is provider-subdomain-only acceptable at launch?

**Evidence:** `*.afruheritage.com` portals verified on real tenants.
`custom_domain_events` + Sentinel domains page exist; end-to-end custom-domain
flow unverified.

**Alternatives:** A) Subdomain-only launch (matches your domain policy).
B) Custom domains required → DNS/cert/verification work needed.

**Recommendation:** A — subdomain is the documented recovery route.

---

## D-11 — Native mobile app

**Question:** Confirm roadmap deferral of native apps?

**Evidence:** Responsive web only; web works on mobile browsers.

**Alternatives:** A) Defer (your stated direction). B) Required → major build.

**Recommendation:** A.

---

## D-12 — Per-tenant feature flags

**Question:** Are tenant-level feature entitlements required, or are global
flags sufficient?

**Evidence:** Global flags verified end-to-end (toggle + persistence).
`/feature-flags/tenant/{id}` proxies a CP route that returns 404.
`marketplace_enabled`/`vendor_registration` global flags are enabled — inert
today but inconsistent with pending marketplace status.

**Alternatives:** A) Global-only at launch; align flag states with D-01 ruling.
B) Implement tenant overrides (your direction says governed overrides — needs
CP endpoints + sentinel UI).

**Recommendation:** B as a fast-follow — entitlement control is how plan tiers
will be enforced; A is acceptable for a uniform-launch cohort.

---

# Delivery Gaps — severity, ownership, verification

| Gap | Severity | Owner | Verification requirement |
|---|---|---|---|
| G-01 Shipment notifications bypassed | **Critical** | Dev — wire transition path + recipient per D-03 | Real status change → real external mailbox; both paths |
| G-02 Central support intake missing | **High** | Dev — pending D-04 | Platform ticket submitted on apex → visible in Sentinel → reply works |
| G-03 CRM activity UI missing | **High** | Dev — pending D-08 | Add activity via UI → persists → listed on customer record |
| G-04 Branded sender domain unauthorized | **High** | **Ops** — provider-side; not code | DKIM published, SPF covers sender, DMARC≥quarantine, branded delivery to real inbox |
| G-05 Admin mutations unaudited | **Critical** | Dev — audit middleware on sentinel writes | Each mutation writes admin_audit_logs row (actor, action, entity, time) — verified on KYC/flag/ticket/tenant actions |
| G-06 Tenant flags unimplemented | **High** | Dev — pending D-12 | Tenant flag GET/PATCH returns real state + persists |
| G-07 Vendor UI missing (D-01) | **Per ruling** | Dev — pending D-01/D-02 scope | Vendor registers via UI → docs → approval → booking lifecycle E2E |
| G-08 Invalid-ID HTTP 500s | **Low** | Dev | Malformed UUIDs → controlled 400/404 on all admin write paths |

**Fixed defects** (verified, kept for record): driver list names, apex support
dead-ends, ticket-lookup tenant gate, fabricated storefront content, zero-amount
payment email, onboarding duplicate-registration, invitation subject, i18n 422,
Sentinel stale bundle/routing/mocks/fake plans/auth chain.
