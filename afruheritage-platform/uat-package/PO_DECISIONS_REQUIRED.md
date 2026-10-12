# Afruheritage — Product Owner Decisions Required

**Date:** 2026-10-11
**Context:** The previous "Coming Soon Register" is withdrawn. The developer does
not decide product scope. Each item below needs an explicit PO ruling; the evidence
column states what exists today so the decision is based on fact, not assumption.

| # | Decision | Evidence today | Options |
|---|----------|----------------|---------|
| D-01 | **Vendor marketplace at launch?** | Full backend lifecycle implemented (public registration endpoint, documents, availability, matching, bookings, admin review/suspend). Only UI missing. ~80% built. | A) Build vendor UI + portal — launch with marketplace. B) Approve deferral — keep backend dormant, document exclusion. |
| D-02 | **Driver self-service at launch?** | Managed driver records work end-to-end (verified). No driver sign-in exists anywhere. | A) Launch with managed-record fleet management only (deferral). B) Require driver auth/app before launch. |
| D-03 | **Shipment notification recipients?** | Send functions exist; only tenant contact emailed, only on tracking-event path; transition path silent. Fix required regardless. | A) Notify tenant owner only. B) Notify end customer. C) Both. |
| D-04 | **Central platform support intake?** | Tenant-portal tickets work end-to-end. No platform-level ticket channel exists. | A) Build platform-scope intake before launch. B) Use a defined channel (support@ / help assistant) and defer ticket intake. |
| D-05 | **Paid billing at launch?** | Paystack + Flutterwave integrations implemented (init/verify/webhook) but never exercised end-to-end. Trials verified working. | A) Verify live charges — launch monetized. B) Trial-only launch, monetize after. |
| D-06 | **Warehouse module?** | No implementation found anywhere; not in nav. | A) In scope → must be built. B) Out of scope → remove from all offering/docs. |
| D-07 | **Analytics depth at launch?** | Real basic stats exist (tenant dashboard, Sentinel analytics). No dedicated analytics module. | A) Basic counts acceptable (PO's stated position). B) Require dedicated dashboards. |
| D-08 | **CRM activity UI at launch?** | Backend endpoints implemented; no UI. | A) Add UI before launch. B) Contacts+quotes only at launch; activities later. |
| D-09 | **Extra storefront templates?** | 5 demo themes previewable but publish-blocked (fake content). Fleet/freight live. | A) Confirm deferral (PO's stated position). B) Require at launch → tenant-configurable content needed. |
| D-10 | **Custom domains at launch?** | Provider subdomains verified. Custom-domain events/admin exist; flow unverified end-to-end. | A) Subdomain-only launch (PO's domain policy supports this). B) Require custom domains → verification + cert work needed. |
| D-11 | **Native mobile app?** | Responsive web only. | A) Confirm roadmap deferral (PO's stated position). |
| D-12 | **Per-tenant feature flags?** | Global flags verified working; tenant-scope endpoint 404. | A) Global-only flags at launch. B) Implement tenant entitlements. |

## Deferred items WITH developer recommendation but NO PO approval yet

None may be marketed as "Coming Soon" until the PO rules on the matching decision
above. The register below replaces the rejected one.

## Explicitly unsupported today (not offered at all)

- Public vendor marketplace trading (awaiting D-01)
- Driver sign-in / driver app (awaiting D-02)
- Warehouse operations (awaiting D-06)
- Native mobile apps (awaiting D-11)
- Payment refund/dispute admin actions (follows D-05)
- Runner restart/shutdown remote controls (ops tooling, low criticality)
