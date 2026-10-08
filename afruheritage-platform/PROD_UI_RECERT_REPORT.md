# PROD-UI-CERT-01 — Recertification Report

Gate: PROD-UI-CERT-01
Target: https://afruheritage.com (physical browser journeys only)
Method: Playwright harness (`prod-ui-cert/`), real external mailboxes, DB checks used only to
diagnose browser observations — never as a substitute for UI verification.

Prior certification: 34 PASS / 24 FAIL / 6 BLOCKED — NO-GO
This recertification: **57 PASS / 6 FAIL / 2 BLOCKED** (canonical case rows)

Transition matrix: `PROD_UI_TRANSITION_MATRIX.csv`
Current verdicts: `PROD_UI_RECERT_MATRIX.csv` (84 capability rows incl. extended coverage:
76 PASS / 6 FAIL / 2 BLOCKED)

Transitions: PASS→PASS 35 | FAIL→PASS 18 | BLOCKED→PASS 4 | FAIL→FAIL 6 | BLOCKED→BLOCKED 2

---

## Remediation campaign outcome

All six mandated remediation tracks are closed and re-verified through the UI:

- **R1 Tenant context** — slug→UUID resolution across shipments/billing/branding; removed
  'default' fallbacks. Shipment create/list, billing, members, branding all verified live.
- **R2 Fleetbase org binding** — `start_trial` now advances lifecycle and auto-provisions
  the Fleetbase Organization; all three cert tenants are `active` with orgs bound. Fleet
  pages render org-scoped live data instead of "not provisioned".
- **R3 Identity lifecycle** — invite/reset emails land on public-web `/reset-password`;
  invitees complete password setup and land in the inviter's workspace (fixed
  `onboarding_complete` + role mapping in `create_user`).
- **R4 Settings/branding persistence** — branding route tenant fix; a unique marker
  (`support_phone`) verified persisted across reload (BRND-01).
- **R5 Billing lifecycle** — `_assert_tenant_access` fix; plan cards, wallet,
  transactions, TRIALING state all render for the owner; UI admin-gating added.
- **R6 White-label** — "Fleetbase Drivers" / "Open Fleetbase Console via SSO" removed
  from tenant-facing fleet pages.

## Additional defects found and fixed during recertification

- **Tenant-context leak** (`useBranding`): `lib/api.ts getToken()` was a stale no-op →
  authenticated users were branded as anonymous and `?tenant_id=` could paint another
  tenant's org name on an authed session. Fixed at the token source; ISO-03 now PASS.
- **Members list always empty**: page sent `q=undefined` (literal) → `ILIKE '%undefined%'`.
  Added `buildQuery` stripping undefined params (3 call sites).
- **Shipment latency**: synchronous Fleetbase live-sync on the request path (create ~12s,
  list ~22s). Moved write-syncs to Celery tasks; added per-tenant cooldown + proxy
  timeout on live reads. List now ~0.3s.
- **Public tracking**: added tenant-less `/track` path (tracking number is the bearer
  credential, opaque public-safe response); removed mock `defaultShipment` and fake
  `AFR-2024-12847` hint; fixed "Invalid Date" rendering for empty dates.
- **Products create**: empty `category_id: ""` → 422; now omits empty optional fields.
- **Templates publish**: pending state was derived from local React state and lost on
  reload; now derived from server-side installations → stage→publish works.
- **KYC**: model `id_front_url` vs service `id_document_url` mismatch broke status;
  fixed, submission persists as `pending`.
- **RBAC UI gating**: billing/members/settings mutate controls hidden for non-admin
  (`canManage`); server-side admin enforcement was already correct.
- **Harness false-negatives corrected** (not product changes): onboarding name-field
  matcher, stale subdomain slug, quote dialog scoping, `clickFirst` behind modal
  overlay, reset-page redirect wait, mailbox `sinceMs` freshness, wrong-surface STR-06,
  unconditional BIL-02 fail branch, KYC "Not Submitted" false-positive.

## Canonical case outcomes

- **Golden Journey** — PASS end-to-end: register → welcome email → login → onboarding →
  trial (org provisioned) → workspace → subdomain → shipments → team → billing.
- **Identity** — PASS incl. AUTH-04 reset-to-public-web and post-invite account
  integrity (ID-07 equivalent via TEAM-03).
- **Team/RBAC** — PASS all five: invite → fresh-mailbox delivery → accept → restricted
  denial (mutation-free admin surfaces) → member visible in owner list.
- **Shipments** — PASS: create→tracking number, list persistence, detail, status
  transition, anonymous public tracking of a real shipment.
- **Tenant isolation** — PASS all five, including the previously-broken `?tenant_id=`
  branding path.
- **Storefront** — PASS: template install, plugin enable, product create, publish →
  `/store/<slug>` anonymous render on apex and tenant subdomain.
- **KYC, Customs (Ghana), Support, AI, Billing** — PASS.

## Remaining non-pass rows (all non-core; honest dispositions)

| Case | Verdict | Disposition |
|---|---|---|
| CRM-04 activity/note logging | FAIL | Feature absent — no activity UI exists |
| FLT-01 create driver | FAIL | Surface is read-only; no create control |
| FLT-02 create vehicle | FAIL | Surface is read-only; no create control |
| WHS-01 warehouse | FAIL | Not productized — no route/nav surface |
| ANA-02 dedicated analytics | FAIL | Dashboard tiles exist (ANA-01 PASS); standalone surface absent |
| VND-03 public vendor registration | FAIL | "Become a Vendor" dead-ends at login |
| PUB-06 anonymous marketplace | BLOCKED | Login-gated by current design |
| PUB-07 vendor public page | BLOCKED | Login-gated by current design |

## Production disposition

Every case marked `Core Dependency: YES` is PASS. The remaining eight non-pass rows are
non-core productization gaps, unchanged in verdict but now precisely characterized.

Per the AGENT.md "hide/disable before prod" guidance, launch options are:

1. Hide the dead-end surfaces (public vendor/marketplace CTAs, warehouse entry points)
   and ship the certified core; or
2. Build the gaps before launch.

**Production authorization: NOT GRANTED by this report.** Certification evidence supports
a conditional launch once the non-core dead-ends are hidden or productized — the release
decision belongs to the product owner.
