# Afruheritage — Launch Scope Register (PO-ratified)

**Date:** 2026-10-11 · **Authority:** PO rulings D-01…D-12.
This is the definitive scope statement — replaces all prior Coming Soon /
pending-decision registers for launch purposes.

## In scope — verified working (customer UAT may proceed)

- Company registration → plan/trial → template → onboarding → dashboard
- Individual shipper registration → personal workspace
- Staff invitation (email → accept → password → roles)
- Driver & vehicle management (managed records — no driver login)
- Shipment create / lifecycle / public tracking
- Tenant storefront (fleet/freight templates) on `*.afruheritage.com`
- Tenant-portal support tickets + confirmation emails + tracking
- Password reset, welcome/invitation/ticket emails (sender domain pending G-04)
- CRM contacts + quotes
- Basic operational analytics (real counts)
- AI help assistant (with honest local fallback)
- Tenant isolation (verified — zero cross-tenant records)
- Sentinel admin console (24 surfaces WORKING)

## In scope — under remediation (defects, not deferrals)

- **G-01** Shipment notifications to tenant AND receiver (D-03: both) — wiring fix in progress
- **G-05** Full admin-action audit trail
- **G-08** Controlled error responses on malformed IDs
- **G-04** Branded `@afruheritage.com` sender domain (ops)

## In scope — approved for build (Phase 2)

- **D-01** Vendor marketplace: platform-global vendors, tenant-scoped bookings —
  registration UI, identity, documents, Sentinel approval, listing, booking,
  fulfillment, manual settlement. **Not advertised until E2E verified.**
- **D-04** Central platform support intake (apex → Sentinel queue)
- **D-05** Paid billing: sandbox-certified one-time charges + documented
  **manual-renewal model** (no automatic recurring claims)
- **D-08** CRM activity UI
- **D-12** Tenant-scoped feature flags with platform governance

## Out of scope for initial launch — PO-ratified exclusions

| Capability | Ruling | Constraint |
|---|---|---|
| Driver self-service authentication | D-02 A | Managed driver records only; no driver login advertised |
| Warehouse management | D-06 B | Not part of the offering; removed from all docs/nav |
| Dedicated analytics dashboards | D-07 A | Basic real counts only |
| Demo storefront templates (5) | D-09 A | Publish-blocked until tenant-configurable |
| Custom domains | D-10 A | Subdomain-first; DNS/TLS cert is a later phase |
| Native mobile apps | D-11 A | Responsive web only |

**Advertising rule:** nothing in "under remediation" or "approved for build" may
be presented to customers as available. Excluded items must not appear as
Coming Soon either — they are simply not part of the launch product.

## Remaining PO dependencies

- Vendor auth model sign-off (platform-global vendor identity — token vs linked
  account) — blocks D-01 build start.
- Provider sandbox credentials — blocks D-05 certification.
- Mail-provider sender-domain action — blocks G-04.
