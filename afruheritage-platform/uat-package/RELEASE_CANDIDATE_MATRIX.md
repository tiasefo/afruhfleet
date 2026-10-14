# Afruheritage — Release-Candidate Matrix

**Deployed SHA:** `e00ce84c` (includes `56234c94` I1/S2 + this round's
FLW checkout gate, provider validation, per-link handover revocation).
**Evidence:** `PHASE1_EVIDENCE.md` Rounds 1–6, `prod-ui-cert/` result
JSONs (p29–p32, u1), `uat-package/` artifacts.

## A. Verified and usable

| Capability | Evidence | Scope |
|---|---|---|
| Business registration + tenant provisioning | U1 20/20 — `/register/company`, real Fleetbase org, admin login | Production-verified |
| **Individual registration (personal accounts)** | U1 20/20 — Individual selector, no company field, real Paystack checkout, `account_type=individual` on `/tenants/me` + tenant-context | Production-verified |
| Staff invitations | U1 — real mailbox delivery, accept → password → login, roles preserved | Production-verified |
| Fleet/vehicle management | U1 — UI add persists via API | Production-verified |
| Shipment lifecycle + public tracking | U1 — event timeline, `/track` public page | Production-verified |
| Shipment-status email notifications | U1 — event → real mailbox delivery | Delivery works; sender is `advisory@emidentity.com` (not branded — see G-04) |
| CRM customers + activities | P30 19/19 isolation; p28b 5/5 UI regression | Tenant-scoped, legacy unowned rows quarantined |
| Central support (D-04) | P25 14/14 — public ticket, guest reply, Sentinel staff handling | Production-verified |
| Vendor portal (D-01) | P27 17/17 + P31 21/21 — invite single-use, suspension→403, PII isolation | Production-verified |
| Tenant isolation (shipments, CRM, billing verify) | P29/P30/U1 — cross-tenant 403/404 at every boundary | Production-verified |
| Rate limiting (trusted-proxy aware) | P29 12/12 — forged headers rejected, per-client buckets | Production-verified |
| Audit trail | Append-only DB triggers; handover access now per-request audited | Production-verified |
| Paystack payments | P32 — real sandbox init/verify/webhook, idempotent duplicates, no-credit-on-unpaid | **Sandbox** certified |
| Production security posture | S1/S2 — localhost-bound ports, Redis auth, rotated pg credentials, prod env modes, docs off, serialized migrations, restart-persistent | Verified post full restart |

## B. Conditional capabilities

| Capability | Condition to release |
|---|---|
| Controlled free pilot | Free-trial plan path verified (plan picker → activation). Requires: branded email unblocked OR an explicit decision that `advisory@emidentity.com` sender is acceptable for pilot; handover distributed via minted revocable links only |
| Paystack-only paid launch | `PAYSTACK_PRODUCTION_READINESS.md` fully checked + one PO-authorized live charge + PO approval |
| Expanded external UAT | Per-link revocable handover links now exist — revoke-by-link-id before wide distribution is available |

## C. Excluded / disabled at this baseline

| Capability | State |
|---|---|
| **Flutterwave checkout** | DISABLED — `FLUTTERWAVE_ENABLED=false`; server returns 400; removed from billing UI. Enable only after P2 certification with working sandbox credentials |
| Recurring billing / auto-renewal | NOT SUPPORTED — manual renewal only; must be disclosed on billing page |
| Automated refunds/payouts | NOT SUPPORTED — manual via provider dashboards |
| API docs in production | Disabled (404) — intentional |
| Branded `@afruheritage.com` sending | BLOCKED — sender authorization + DKIM/SPF/DMARC pending (Ops) |
| Driver self-service portal | Not implemented — managed driver records only |
| Warehouse module, native mobile apps, advanced analytics | Out of launch scope |
| Multi-vendor portal switching | First-active-membership resolution; documented limitation |

## D. Remaining defects and risks

| Defect / risk | Severity | Owner | Status |
|---|---|---|---|
| G-04 branded sender (SPF/DKIM/DMARC not verified for afruheritage.com) | HIGH for launch trust | **Ops** | BLOCKED |
| Flutterwave test credential rejected provider-side (401) | Low for launch (gateway disabled) | **Ops** | BLOCKED |
| Historical cross-tenant CRM reads cannot be confirmed or excluded (no durable pre-R2 access logs) | Medium — documented gap | Dev | Unresolved visibility gap, not a live defect |
| `.env.docker` holds stale localhost OAuth redirect URIs (unused at runtime) | Low | Dev | Documented; reconcile file for hygiene |
| Runtime migrations run at every service start (now serialized via advisory lock; PO recommends dedicated migration step long-term) | Low | Dev | Mitigated |
| Sentinel refund/dispute controls | Medium — needed only when paid billing ships | Dev | With-billing-launch scope |

## E. Exact requirements

**Controlled free pilot (conditional GO):**
1. Decide whether unbranded sender (`advisory@emidentity.com`, display
   name "Afruheritage") is acceptable for pilot cohort — or complete G-04.
2. Distribute handover only via minted links; use per-link revocation if
   a link is forwarded outside the intended audience.
3. Keep paid plans purchasable only through Paystack; Flutterwave hidden.

**Paystack-only paid launch (NOT YET APPROVED):**
1. All items in `PAYSTACK_PRODUCTION_READINESS.md`.
2. One PO-authorized live charge + webhook + entitlement verification.
3. Manual-renewal disclosure added to billing page.
4. Separate PO approval — do not enable production billing otherwise.

**G-04 unblock:** provider sender authorization for `afruheritage.com`,
DKIM published, SPF include updated, `SMTP_FROM_EMAIL` flipped, DMARC
tightened after observation, then real-header evidence on all five mail
journeys (`G04_OPS_CHECKLIST.md`).
