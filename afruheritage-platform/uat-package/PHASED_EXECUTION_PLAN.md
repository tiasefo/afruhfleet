# Afruheritage — Phased Execution Plan (post-PO rulings)

**Date:** 2026-10-11 · **Basis:** PO rulings D-01…D-12 adopted as issued.
Effort is sized relatively (S ≤ half-day, M = days, L = multi-day build) —
sequencing and gates matter more than dates. No irreversible scope changes
before the gates listed here are met.

## Phase 1 — Critical operational corrections

| Item | Work | Depends on | Effort | Objective acceptance gate |
|---|---|---|---|---|
| G-01 Shipment notifications | Wire `/transition` endpoint into the notification path (or emit tracking event on transition); recipient per D-03 ruling = tenant contact + receiver where `receiver_email` exists (additive column + optional form field); failures surface (log + shipment event flag), never cross-tenant | None — can start now | **M** | Status change via **real UI** → real email to tenant AND receiver at real external mailboxes; tenant B receives nothing about tenant A's shipment; duplicate-suppression per event |
| G-05 Sentinel audit coverage | Audit middleware/decorator on all `/sentinel` mutating routes writing `admin_audit_logs` (actor, action, entity, ip, time) | None | **S–M** | KYC approve, flag toggle, ticket status, tenant suspend, vendor review, billing adjust each produce a durable attributed row — verified via DB query after each action |
| G-08 Invalid-ID 500s | Normalize path params (UUID coercion) → controlled 400/404 on admin write paths | None | **S** | Malformed/truncated UUID on ticket/KYC/vendor/tenant write endpoints → 400 or 404, zero 500s |
| G-04 Branded sender domain | **Ops-owned** — provision `afruheritage.com` sender on mail account, publish DKIM, confirm SPF coverage, tighten DMARC to ≥quarantine; rotate exposed mailbox password | **External: mail provider action** | S (ops) | Welcome email from `@afruheritage.com` lands in real external inbox; `dig` shows DKIM record + DMARC policy |

**Phase-1 exit gate:** all four verified with real evidence; UAT guide updated
so testers no longer see the notification gap.

## Phase 2 — Core commercial & customer capabilities

Ordered by dependency, not importance. Each item preserves verified journeys.

| Item | Work | Depends on | Effort | Objective acceptance gate |
|---|---|---|---|---|
| D-12 Tenant feature flags | CP endpoints for per-tenant flag get/set + Sentinel tenant-scope UI; align `marketplace_enabled`/`vendor_registration` states with D-01 reality | None | **M** | Flag set for tenant A only: effective-state read differs between A and B; persists; Sentinel UI shows per-tenant overrides |
| D-08 CRM activity UI | Activity timeline + add-activity form on CRM customer detail | None | **S–M** | Add note/call via UI → persists → renders on customer record; tenant-scoped |
| D-04 Central support intake | `tenant_id` optional → platform-queue tickets; apex `/support` intake form; Sentinel ticket admin already works | G-05 (audit) recommended | **M** | Public submit on apex → platform ticket in Sentinel → admin status/reply → confirmation email → tracking by token |
| D-01 Vendor marketplace | **Design first:** vendor auth model (vendors are platform-global, no user account today — choose vendor-token vs linked user identity — presented to PO before build). Then: public registration UI → document upload → Sentinel approve/reject/suspend → marketplace listing → tenant booking (offer/accept/reject/complete/cancel) → manual settlement documented | G-05 audit; PO sign-off on vendor auth model | **L** | Full lifecycle E2E in browser: register → docs → approval → listed → tenant books → vendor accepts → completes; tenant B cannot see tenant A's bookings; vendor sees only own bookings; audit rows written |
| D-05 Payment certification | Sandbox E2E: init→pay→verify→webhook→entitlement; failed-charge path; duplicate-webhook idempotency; ledger reconciliation; **manual-renewal model documented** (no implied auto-recurring — provider supports one-time charges only); refund = documented manual ops | Provider sandbox keys (external) | **M** | Sandbox certification report + separately-authorized controlled live charge; failed-charge + duplicate-webhook evidence; no "auto-renew" claims anywhere in UI/docs |

**Phase-2 exit gate:** every row's gate met with real evidence; launch-scope
register re-issued.

## Phase 3 — Ratified exclusions (must not be advertised)

| Item | Constraint |
|---|---|
| Driver self-service auth | Driver *management* stays verified-working; no driver login advertised |
| Warehouse management | Removed from offering/docs — not Coming Soon, not implemented |
| Dedicated analytics dashboards | Basic real counts only |
| Demo storefront templates | Publish-blocked permanently until tenant-configurable |
| Custom domains | Subdomain-only; separate DNS/TLS cert later |
| Native mobile | Responsive web only |

## Parallel workstream — Sentinel parity (B8, continues)

Audit middleware (G-05), tenant flags (D-12), refund/dispute + runner controls
stay MISSING until CP backends exist — tracked in the gap matrix, not hidden.

## Dependency graph (text)

```
G-04 (ops, external) ──┐
G-01, G-08 ────────────┤ independent — start immediately
G-05 ──┬─→ D-04, D-01  (mutations must be auditable before new admin surfaces)
D-12 ──┤ independent
D-08 ──┤ independent
D-05 ──┘ needs provider sandbox keys (external)
Vendor auth design decision ──→ D-01 build (needs PO sign-off on approach)
```
