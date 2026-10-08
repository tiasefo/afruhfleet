# PROD-UI-CERT-01 — Production Go-Live UI Certification Report

**Campaign type:** Physical browser certification (Playwright, human-equivalent) against the deployed public product
**Entry point:** https://afruheritage.com (no localhost, no private IP, no API substitution, no DB fixture mutation, no UI bypass)
**Personas used:** Anonymous internet visitor, Business Owner ×2 (two independent tenants), Restricted team member, Invited new user, Vendor (anonymous), Customer (anonymous)
**Test tenants created through the real UI:** `UATCERT Meridian Freight` (Tenant A), `UATCERT Kestrel Logistics` (Tenant B) — disposable UAT data, not production fixtures
**Evidence:** `playwright-evidence/` (traces, videos, screenshots, console, network)
**Remediation during certification:** none — zero application changes

```text
PROD-UI-CERT-01

TOTAL UI TESTS: 64
PASS: 34
FAIL: 24
BLOCKED: 6

GOLDEN JOURNEY:
FAIL
  The end-to-end business Golden Journey cannot be certified. What passed is the
  TENANT BOOTSTRAP JOURNEY (PASS ×2 tenants): anonymous visitor → registration →
  welcome email → login → onboarding → trial → workspace → tenant subdomain.
  The business Golden Journey stops at first real use: a newly onboarded logistics
  business cannot proceed through the operational lifecycle.
  Minimum blocking failures:
    team invitation/acceptance   FAIL
    shipment creation            FAIL
    shipment access/list         FAIL
    fleet/runtime                FAIL
    settings persistence         FAIL
    billing/payment lifecycle    FAIL
    password recovery            FAIL

TENANT ISOLATION:
PASS
  Cross-subdomain access denied (A session on B /dashboard → login wall).
  Anonymous A/B subdomains show correct per-tenant branding, no private data.
  No cross-tenant data via ?tenant_id= URL parameter.
  Caveat: authed A-vs-B data check partially blocked by DEF-AUTH-02 (Tenant A credential state corrupt).

IDENTITY:
FAIL
  Registration/login/logout/session-persistence PASS.
  Password reset FAIL (DEF-AUTH-01): reset email link → api.afruheritage.com/login?reset_token=…
    → JSON {"detail":[{"loc":["query","tenant_id"],"msg":"Field required"}]} — no reset form reachable.
  Credential-state corruption FAIL (DEF-AUTH-02): Tenant A owner login now returns
    403 "Password setup required" after the invite/reset journeys — a previously-working account
    is locked into a dead-end state.

TENANT BOOTSTRAP:
PASS (with defect)
  Onboarding, trial activation, workspace, subdomain resolution — all PASS.
  Settings/business-profile changes do NOT persist after reload (DEF-SET-01, both tenants).

TEAM/RBAC:
FAIL
  Invite send + email delivery PASS (but invite uses the wrong "Password Reset Request" template).
  Invitation acceptance FAIL (DEF-TEAM-01): link lands on api-host login; invitee has no password
    path; login → "Incorrect email or password". Team onboarding is impossible end-to-end.
  Members list FAIL (DEF-TEAM-02): GET …/members → HTTP 500; page shows "0 members /
    No tenant context. Please log in as a tenant user" while authenticated.
  Restricted-role denial PASS (correct RBAC behavior).

STOREFRONT:
FAIL
  Template install PASS; anonymous tenant storefront renders with correct branding PASS.
  Plugins enable FAIL; storefront product config FAIL; publish FAIL — no owner controls exist.
  Branding persistence FAIL (same DEF-SET-01 root).

CRM:
FAIL (partially usable)
  Pipeline renders; opportunity creation PASS.
  Contacts page renders but POST /support-crm/contacts → 422; contact never saved (DEF-CRM-07).
  Quotes page renders but Create Quote stays disabled — cannot be completed (DEF-CRM-13).
  Activities surface not found (DEF-CRM-10).

SHIPMENTS:
FAIL — CORE PRODUCTION BLOCKER
  Create shipment: full valid form → "Failed to create shipment. Please try again."
    POST /api/v1/shipments/{tenant} → HTTP 500 (DEF-SHP-03).
  Shipment list: GET /api/v1/shipments/default → HTTP 403 for Company Admin (DEF-SHP-04); empty.
  Detail/status-transition BLOCKED (no shipment exists to open).
  No tracking number could ever be produced.

FLEET:
FAIL
  "Unable to load Fleetbase data — Tenant Fleetbase not provisioned" on drivers/vehicles
    (DEF-FLT-09). fleetbase-proxy/drivers|vehicles → 404; sso-launch → 404.
  WHITE-LABEL VIOLATION (DEF-FLT-08): page literally shows "Fleetbase Drivers",
    "Live driver records from Fleetbase FleetOps", "Open Fleetbase Console via SSO"
    to tenant customers — direct breach of the no-Fleetbase-leakage rule.

TRACKING:
FAIL
  Public tracking page + graceful unknown-number PASS.
  Real-shipment tracking BLOCKED by DEF-SHP-03 (no shipment can be created to track).

VENDOR/MARKETPLACE:
FAIL
  "For Vendors" / "Become a Vendor" homepage CTAs → /login wall (DEF-VND-04). No public
    vendor registration exists — the marketed acquisition path is a dead end.
  Anonymous /marketplace → login wall (DEF-VND-03).
  Owner-side marketplace + vendors surfaces render (stats like "3,420 active vendors"
    appear to be unverifiable marketing placeholders).

WAREHOUSE:
FAIL — not productized (no nav entry; /warehouse /warehouses /dashboard/warehouse /inventory all 404).

CUSTOMS:
PASS
  Ghana duty calculator renders itemized duty/levy/VAT breakdown (CUS-01).
  Kenya customs journey not verified as productized (BLOCKED → development).

KYC:
FAIL
  Form + ID types + document upload render (KYC-01 PASS).
  Submission hangs in "Submitting…"; upload POST aborted; status never leaves
    "Not Submitted"/"Loading KYC status…" (DEF-KYC-02). Cannot complete or verify.

SUPPORT:
FAIL
  Public support page + ticket form render PASS.
  Public submission produces no confirmation/ticket reference (SUP-02 → BLOCKED).
  Owner has NO ticket inbox — /support shows the public marketing page to the owner (DEF-SUP-02).
  Business-reply and customer-view chain cannot exist as deployed.

BILLING:
FAIL
  Plan display + free-trial activation PASS.
  Wallet/subscription APIs → HTTP 403 for the tenant owner (DEF-BIL-03); wallet, credits,
  transactions, payment initiation, history, receipt all unreachable.

ANALYTICS:
FAIL — not productized. Dashboard is navigation tiles; /analytics /reports /dashboard/analytics 404.

AI:
PASS
  Widget opens on authenticated pages; real prompt → real substantive answer about Ghana
  customs (ICUMS valuation, VIN/CIF, duty/VAT/NHIL breakdown). Also renders on public login page.
  Note: /api/v1/ai/chat/public returned HTTP 500 once — public variant unstable.

GO-LIVE CORE:
  Public homepage, pricing, legal pages, locations, documentation
  Public tracking page (form + graceful not-found)
  Public support page
  Business registration → welcome email → login → onboarding → trial → workspace → subdomain
  Logout + session persistence
  Restricted-role denial (RBAC enforcement)
  Tenant isolation in all observed paths (subdomain + tenant_id parameter)

GO-LIVE SUPPORTED:
  Storefront template install
  Anonymous tenant storefront (default template, correct branding)
  CRM pipeline view + opportunity creation
  Contacts/quotes page rendering (read-only surfaces)
  Ghana customs duty calculator (itemized)
  KYC form surface (upload UI only — submission broken)
  AI assistant widget (authenticated)
  Owner marketplace + vendors surfaces (render-only)

DEVELOPMENT:
  Password reset (DEF-AUTH-01) — CORE
  Account credential-state integrity (DEF-AUTH-02) — CORE
  Settings/profile persistence (DEF-SET-01) — CORE
  Invitation acceptance journey + wrong email template (DEF-TEAM-01) — CORE
  Members list API 500 + "No tenant context" (DEF-TEAM-02) — CORE
  Shipment create 500 + list 403 (DEF-SHP-03/04) — CORE
  Billing wallet/subscription 403; payment/history/receipt (DEF-BIL-03) — CORE
  Contacts 422, quotes disabled-submit, activities missing (DEF-CRM-07/13/10)
  Plugin enable, storefront config, publish (DEF-STR-02/05/06)
  Public vendor registration + anonymous marketplace (DEF-VND-03/04)
  KYC submission/status pipeline (DEF-KYC-02)
  Owner support inbox/reply; public ticket confirmation (DEF-SUP-02/03)
  Analytics (DEF-ANA-02); Kenya customs (DEF-CUS-03); AI public endpoint 500

HIDE/DISABLE BEFORE PROD:
  Fleetbase-branded fleet pages: "Fleetbase Drivers", "Open Fleetbase Console via SSO",
    "Tenant Fleetbase not provisioned" (DEF-FLT-08/09) — white-label breach + broken data
  Warehouse (not productized — remove any discoverable entry points)
  Public "For Vendors"/"Become a Vendor"/marketplace CTAs that dead-end at login (DEF-VND-03/04)
  Plugins page (renders but controls do nothing)
  Unverifiable marketing stats on homepage and marketplace (3,420 vendors, 12,847 shipments…)

CORE PRODUCTION BLOCKERS:
  DEF-FLT-09  Tenant runtime not provisioned — "Tenant Fleetbase not provisioned" across fleet;
              likely root cause family for shipment failures. New tenants are created WITHOUT
              their operational runtime.
  DEF-SHP-03  POST /api/v1/shipments/{tenant} → HTTP 500 on a valid completed form.
              A freight platform that cannot create a shipment cannot ship.
  DEF-SHP-04  GET /api/v1/shipments/default → HTTP 403 for the Company Admin role.
  DEF-AUTH-01 Password reset link targets api host with missing tenant_id → JSON error; no form.
  DEF-AUTH-02 Account enters permanent "Password setup required" state; owner locked out.
  DEF-TEAM-01 Invitation acceptance is impossible end-to-end (api-host link, no password path).
  DEF-TEAM-02 Members list → HTTP 500 + "No tenant context" while authenticated.
  DEF-SET-01  Settings/branding saves do not persist (verified on both tenants).
  DEF-BIL-03  Wallet + subscription + transactions → HTTP 403 for tenant owner.
  TENANT-CTX  Recurring "No tenant context" failures across members/branding/shipments/billing —
              tenant-context resolution is unreliable platform-wide.

NON-CORE DEFECTS:
  DEF-CRM-07 contacts POST 422 | DEF-CRM-13 quote submit disabled | DEF-CRM-10 activities absent
  DEF-STR-02/05/06 plugins/config/publish | DEF-VND-03/04 vendor journeys dead-end
  DEF-KYC-02 submission hangs | DEF-SUP-02/03 support loop broken | DEF-ANA-02 analytics absent
  DEF-CUS-03 Kenya not verified | DEF-WHS-01 warehouse absent | AI public 500
  Wrong email template for invitations | i18n endpoint 422 (noise) | suspected fake marketing stats

PLAYWRIGHT TRACE COVERAGE: 30
SCREENSHOT EVIDENCE: 169
VIDEO EVIDENCE: 27

DIRECT API SUBSTITUTIONS: 0
UI BYPASSES: 0
APPLICATION CHANGES DURING CERTIFICATION: 0

PRODUCTION RECOMMENDATION:
NO-GO
```

## Verdict rationale

The **tenant bootstrap journey** (anonymous → register → email → login → onboarding → trial → workspace → subdomain) physically works and was proven on two independent tenants, and tenant isolation held in every observed path. The **end-to-end business Golden Journey FAILS** — a customer who completes onboarding cannot operate the product. That is genuine progress versus the previous hollow "81/81 GREEN", but it is not a production-operable product.

A newly-onboarded paying tenant **cannot perform the core business of the product**: shipments cannot be created (HTTP 500) or listed (HTTP 403); the underlying tenant runtime reports itself as *not provisioned*; team members cannot be invited successfully; the members API 500s; billing wallet/subscription APIs deny the tenant owner; profile/settings changes silently do not persist; password reset is dead on arrival; and a normal user journey can corrupt an account into a permanent "Password setup required" lockout. In addition, **Fleetbase branding is directly exposed to tenant customers** on fleet pages — a contractual white-label violation.

"GO WITH REDUCED CAPABILITY SET" was considered and rejected: the only demonstrable working core is the acquisition/onboarding funnel plus a decorative workspace shell. There is no viable reduced freight product once shipment creation, team management, billing, and settings persistence are removed.

## Defect reference table

| Ref | Severity | Defect | Key evidence |
|---|---|---|---|
| DEF-SHP-03 | CORE | Shipment create → HTTP 500, UI "Failed to create shipment" | `RETEST-network.log`, `SHP-01F-*` |
| DEF-SHP-04 | CORE | Shipment list → HTTP 403 (Company Admin) | `RETEST-network.log` |
| DEF-FLT-09 | CORE | Tenant Fleetbase runtime never provisioned; proxy 404s | `FLT-01F-drivers.png`, `RETEST-network.log` |
| DEF-FLT-08 | CORE | Fleetbase branding leaks to tenant users | `FLT-01F-drivers.png` |
| DEF-AUTH-01 | CORE | Reset link → api host → tenant_id JSON error, no form | `AUTH-04-*` |
| DEF-AUTH-02 | CORE | "Password setup required" lockout of working account | `ISO-01-error.png`, invite-phase logs |
| DEF-TEAM-01 | CORE | Invite acceptance impossible (api-host link, no password path) | `TEAM-03D`, invite email evidence |
| DEF-TEAM-02 | CORE | members → HTTP 500 + "No tenant context" | `GATE-02-members.png`, `RETEST-network.log` |
| DEF-SET-01 | CORE | Settings/branding do not persist (both tenants) | `GJ-07-settings.png`, `STR-05-*` |
| DEF-BIL-03 | CORE | wallets/subscriptions → HTTP 403; no payment path | `RETEST-network.log`, `BIL-02-*` |
| DEF-CRM-07 | NON-CORE | Contact create POST → 422 | `RETEST-network.log`, `CRM-02F-after.png` |
| DEF-CRM-13 | NON-CORE | Create Quote submit permanently disabled | `CRM-05F-error.png` |
| DEF-STR-02/05/06 | NON-CORE | Plugins enable / storefront config / publish absent | `STR-04-*`, `STR-06` |
| DEF-VND-03/04 | NON-CORE | Public marketplace + vendor registration dead-end at login | `VND-03-vendor-entry.png` |
| DEF-KYC-02 | NON-CORE | KYC upload hangs; status never updates | `KYC-02-after.png`, `KYC-03-status.png` |
| DEF-SUP-02/03 | NON-CORE | No owner ticket inbox; public submission unconfirmed | `SUP-01F-support.png`, `SUP-02-after.png` |
| DEF-ANA-02 | NON-CORE | Analytics not productized (404s) | `ANA-02-dash-final-full.png` |
| DEF-WHS-01 | NON-CORE | Warehouse not productized | `WHS-01` run |
| ARCH-DOC-001 | DOC | `AGENT.md` says instance-per-tenant Fleetbase; accepted architecture is shared Fleetbase + Organization isolation. Certification action: DO NOT REARCHITECT. Disposition: documentation reconciliation after certification. | `AGENT.md` |

## Evidence layout

```
playwright-evidence/
  traces/       30 Playwright traces (full failure context retained)
  videos/       27 session recordings of major journeys
  screenshots/  169 captured states (per-case start/mid/final/failure)
  console/      42 console logs
  network/      42 network failure/status logs
PROD_UI_CERTIFICATION_MATRIX.csv   64 canonical test rows w/ classification + disposition
```

## Methodology notes

- All journeys used human-equivalent interactions only (`goto`, `click`, `fill`, `select`, `upload`, real email links via mail.tm, logout/login, fresh contexts). No `page.evaluate`, no token injection, no forced clicks, no DB mutation.
- Several early runs produced `net::ERR_ABORTED` requests caused by test-side navigation timing; those results were retested with longer waits and their interim verdicts superseded — the consolidated matrix reflects only valid runs, with corrections documented per row.
- The recurring "No tenant context" / 403 pattern across members, branding, shipments, and billing suggests a single platform-wide tenant-context resolution defect rather than six independent bugs — primary remediation lead.
- Historical 81/81 automated certification remains on file as historical evidence only and was not used to justify any PASS here.
