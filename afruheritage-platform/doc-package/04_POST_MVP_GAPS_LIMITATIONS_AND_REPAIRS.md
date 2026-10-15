# 04 — Post-MVP Gaps, Defects, Limitations and Repairs

**Document status:** Source-verified draft for joint PO + architecture review. **Not approved.**
**Source:** baseline `ee57ba5d` + Round-1 authorization fixes `2b4c7a0a`, live deployment verified 2026-10-14/15. Evidence files referenced inline.
**Classification key:** BROKEN · PARTIAL · DISABLED-PILOT · NEEDS-PROVIDER · NOT-IMPL · DEFERRED · RISK

Every row: *current behavior → expected → evidence → impact → severity → remediation → blocks?*

---

## A. Features that were broken and repaired this cycle

| ID | Item | Current → Expected | Evidence | Impact | Sev | Remediation | Blocks |
|---|---|---|---|---|---|---|---|
| D-001 | Guest customs paywall 502 | Past-limit guest calls hit Paystack init with fabricated `…@afruheritage.local` email → provider 400 → Cloudflare 502. Now returns controlled `pilot_closed` during the pilot | `app/api/routes/customs_guest.py`; commit `7a86f636`; live test `evidence/live/` | Guests saw a hard error | S2 | Done. Post-pilot: require real email, cert paid path end-to-end | Free-pilot OK; **paid launch needs re-cert** |
| D-002 | Kenya vehicle `/customs/calculate` 500 | KE+vehicle without `cif_value` fell through to `EstimateProvider` → `float(None)` 500. Now routes to KRA CRSP path | `app/services/customs/providers.py`; commit `be5fd15e` | Kenya calculator crashed | S1 | Done | none |
| D-003 | Unsupported country 500 | `NG`/other countries raised TypeError 500. Now controlled **422** | same commit; `evidence/live/07_ng_unsupported.json` | Crash on unsupported input | S2 | Done | none |

## B. Partially implemented (works, with honest limits)

| ID | Item | Current → Expected | Evidence | Impact | Sev | Remediation | Blocks |
|---|---|---|---|---|---|---|---|
| P-001 | Ghana duty calculator | Computes a full levy breakdown (duty/VAT/NHIL/GETFund/ECOWAS/EXIM/levy) but uses **ICUMS-style HDV benchmark repricing** — submitted value is re-priced (`hdv_usd:15000`→`10125`) and FX is a **static 15.0 USD→GHS**, not a live feed. `official:false` | `app/services/customs/providers.py`; `evidence/live/05_ghana_vehicle.json` | Estimate can drift from official GRA duty | S2 | Live FX feed; document benchmark source; independent GRA validation | **Paid launch** |
| P-002 | Kenya duty calculator | Real **KRA CRSP July-2025** matching (verified Corolla Fielder, score 0.91) + **estimated** depreciation; `needs_manual_review` on no-match | `evidence/live/06_kenya_crsp.json` | Depreciation may differ from official valuation | S2 | Encode official CRSP valuation template | **Paid launch** |
| P-003 | Registration schema vs pilot gate | `RegisterRequest.account_type` **defaults to `business`** and then requires `company_name`; an individual-signup request that omits `account_type` fails 422 *before* the pilot allowlist check (403). UI defaults to Individual so real users are unaffected, but API consumers get a confusing error | `app/api/routes/auth.py:60`; `evidence/live/10_register_unadmitted.json` (first 422, then 403) | Confusing 422 for API testers | S3 | Default `account_type='individual'` or evaluate pilot gate before schema validation | none |
| P-004 | Customs country coverage | Only **GH + KE** implemented; frontend has informational pages for NG/UG/RW/ZA/TZ that are **not** calculators (backend returns 422) | `frontend_pages.txt`; inventory | Users may expect 7 countries | S3 | Label non-GH/KE pages as informational or implement | none |
| P-005 | Vendor journeys | Vendor register/accept/bookings/availability/documents APIs + portal pages exist; exercised in earlier UAT but **not re-verified end-to-end this round** | `api_route_inventory.txt` `/vendors` group | Vendor flows may have drifted | S3 | Re-run vendor UAT before widening pilot | free-pilot caution |
| P-006 | Team-invite accept | Invite create/list/get/accept/decline endpoints + `/invite/accept` page exist; accept-token flow needs mailbox access, not re-run this round | inventory `/team` group | — | S3 | Include in next UAT sweep | none |
| P-007 | `/fleetbase/*` routes on customer frontend | All `/fleetbase/*` pages are **redirect shims** to rebranded paths (`/dashboard/fleetops/*`, `/freight-management`) — no Fleetbase UI leaks, but the URL segment `fleetbase` is still guessable/visible in the address bar | `frontend/app/fleetbase/*/page.tsx` (all `redirect()`) | Minor naming exposure, not a branding leak | S4 | Optional: drop the shim routes or rename | none |

## C. Intentionally disabled for the free pilot

| ID | Item | Current → Expected | Evidence | Sev | Blocks |
|---|---|---|---|---|---|
| X-001 | Live payments | Paystack **sandbox only**; `payments/initiate`, `billing/payments/init` not usable for real charges. Postman collection excludes them | `PAYSTACK_PRODUCTION_READINESS.md` | — | by design |
| X-002 | Flutterwave | Disabled at initiation, verification, webhook, entitlement, UI. Valid-signed webhook is quarantined; unknown providers rejected | commit `549c8ea5` | — | by design; **paid launch** needs provider decision |
| X-003 | Paid customs checks | `pilot_closed` response while `PILOT_INVITE_ONLY=true`; paid flow modified while payments were off → **needs post-pilot certification** | `customs_guest.py`; PO disposition | — | **paid launch** |
| X-004 | Public registration | `403 pilot_closed` unless email on Redis allowlist | `pilot_access.py`; `evidence/live/10_*` | — | by design |
| X-005 | Subscriptions beyond free trial | New tenants land on `free_trial`; paid plan activation not exercised | `evidence/live/02_login.json` `requires_subscription:false` | — | **paid launch** |

## D. Requires external provider configuration

| ID | Item | Current → Expected | Evidence | Sev | Blocks |
|---|---|---|---|---|---|
| E-001 | Permanent branded email (G-04) | All mail from temporary `Afruheritage <advisory@emidentity.com>` (DKIM `d=emidentity.com`, disclosure appended). Expected: `afruheritage.com` sender w/ own DKIM/SPF/DMARC | `PILOT_EMAIL_ASSESSMENT.md`; `G04_OPS_CHECKLIST.md` | S2 | **paid launch** (pilot OK w/ disclosure) |
| E-002 | Paystack live keys | Sandbox certified; production keys not configured — **not authorized** | readiness doc | S2 | **paid launch** |
| E-003 | Live FX source | Ghana static `15.0` → needs live FX provider behind the provider abstraction | `providers.py` | S2 | **paid launch** |

## E. Security / tenant-isolation / operational risks

**PO Review Round 1 — authorization fixes (commit `2b4c7a0a`; live-verified in `evidence/live/r1_security_round.json`):**

| ID | Item | Resolution | Verified |
|---|---|---|---|
| R-001 | **Open marketplace mutations** — `POST /shipments`, `/accept`, `/tracking/{status}`, `/gps`, `GET /gps`, `POST /drivers/search` | **FIXED.** All six now require auth. `post_shipment` requires `require_active_subscription` + caller's `tenant_id` must match payload; `accept_job` restricted to the driver themselves or platform admin; `tracking`/`gps`/`gps-history` via `_can_operate_job` (assigned driver / owning-tenant member / platform admin); `drivers/search` requires auth + driver-identity match | `app/api/routes/marketplace.py`; live: 6×401 unauth, 403 cross-tenant post, legit authed ops unaffected |
| R-002 | Open `POST /warehouse-notices` | **FIXED — was a real defect, not intentional public intake** (anyone could inject public notices into any tenant's storefront). Now requires auth + owning-tenant/superuser. `GET /{slug}` remains intentionally public (storefront display reads `is_public` notices only) | `app/api/routes/warehouse_notices.py`; live: 401 unauth, 403 cross-tenant slug, 200 own-tenant |
| R-007 | **Open customs calculate endpoints** — `/customs/calculate`, `/ghana/vehicle-duty`, `/ghana/goods-duty`, `/kenya/vehicle-duty`, `/vehicle-value` accepted unauthenticated calls, **bypassing the 2-free-check guest cap entirely** | **FIXED.** All now require `get_current_user`. Public `/customs/duty-calculator` page updated to route guests through the capped `/customs/guest/calculate` (localStorage guest_id fingerprint) and signed-in users through the authed endpoints. `vin-decode` stays public (utility, not a duty check) | `app/api/routes/customs.py`, `frontend/app/customs/duty-calculator/page.tsx`; live: 3×401 unauth, 200 authed, guest path 200 |
| R-008 | Open `PUT /cargo-lifecycle/{tracking}/status` — unauthenticated status/history writes on any cargo record | **FIXED.** Auth + owning-tenant/superuser | `app/api/routes/cargo_lifecycle.py`; live: 401 unauth |
| R-009 | Open `payment-hub` — `POST /initialize` (unauth Paystack ref minting) + `GET /transactions/{tenant_id}` (**any tenant's payment history readable**) | **FIXED.** Both require auth; transactions additionally enforce tenant match/superuser. `verify`/`receipt`/webhook stay public-by-design (callback flow / signature-verified / opaque-reference receipt) | `app/api/routes/payment_hub.py`; live: 401 init+tx, 403 cross-tenant tx |
| R-010 | Open `commercial_orchestration` signup provision endpoints | **Contained, not changed.** `provision_signup_runtime` is internally gated by `payment_not_completed` — cannot fire while no payment completes. Public signup orchestration is intentional; revisit at paid launch | inspected |

**Other security / operational risks (unchanged):**

| ID | Item | Current → Expected | Evidence | Sev | Remediation | Blocks |
|---|---|---|---|---|---|---|
| R-003 | Sentinel bootstrap | `POST /sentinel/auth/bootstrap` is open but **guarded** (409 once a super_admin exists) — acceptable today; consider disabling in prod env | `sentinel_app/api/routes/auth.py:115` | S3 | Env-gate bootstrap | none |
| R-004 | Sentinel image drift | Sentinel container image built 2026-08-25 while backend code is bind-mounted at `ee57ba5d` — frontend assets may lag newer backend endpoints | `docker image inspect` vs compose mounts | S3 | Rebuild sentinel image per release; record image digest in deploy evidence | release hygiene |
| R-005 | Pilot admission = CLI only | No Sentinel UI for allowlist; depends on `pilot_admit.sh` + Redis. Audit via `logs/pilot_admissions.log` | `PILOT_OPERATIONS.md` | S3 | Post-MVP: Sentinel admission UI | accepted for pilot (PO) |
| R-006 | `WEBHOOK_SHARED_SECRET` in container env | Present in `docker inspect` env output — visible to anyone with docker access on the host | `docker inspect afruheritage-api` | S3 | Move to a secrets mount; treat host access as privileged | none (host is trusted) |

## F. Not implemented / deferred (post-MVP)

| ID | Item | Status | Blocks |
|---|---|---|---|
| F-001 | Driver portal | Backend driver APIs exist via `fleetbase-proxy`/`marketplace`; **no dedicated driver-facing product portal** in scope | post-MVP |
| F-002 | Warehouse management | Only `warehouse-notices` + `pallet/warehouses` stubs — no real WMS | post-MVP |
| F-003 | Paid subscriptions/entitlements | Trial exists; paid plan lifecycle (upgrade/proration/invoicing) not validated | **paid launch** |
| F-004 | Sentinel pilot-invitation UI | Not built (deliberately deferred per PO) | post-MVP |
| F-005 | WhatsApp notifications | Endpoints exist (`/whatsapp/*`) but provider connectivity not certified | post-MVP |
| F-006 | NG/UG/RW/ZA/TZ customs engines | Informational pages only | post-MVP |

## G. Paid-launch prerequisites (rollup)

1. Independent validation of **GH + KE** duty accuracy (rates, valuation, effective dates, FX, CRSP depreciation) vs official assessments.
2. Re-certify **paid customs guest path** end-to-end (it was changed while payments were disabled).
3. **Paystack live** key configuration + a real-charge certification round.
4. Decide Flutterwave disposition.
5. **G-04** permanent branded sender.
6. ~~Close **R-001/R-002** unauthenticated-write findings~~ — **CLOSED** (Round-1 fix; also closed same-class R-007/R-008/R-009).
7. Paid subscription lifecycle testing.
8. Sentinel image rebuild + per-release digest evidence.

## H. What could NOT be verified this round

- Vendor end-to-end booking/accept flows (surface only — vendor profile, approval, and membership were verified live).
- Cross-tenant isolation for every route — the 79-request UAT suite covers the key surfaces; not every route re-run.
- Sentinel **write** ops (approve/launch/suspend) — deliberately not executed against real tenants.
- Paid payment paths — excluded by policy.
- `PILOT_INVITE_ONLY` behavior under Redis outage — fail-closed was verified earlier, not re-run.

## I. Defects found during the UAT suite build

| ID | Defect | Evidence | Severity | Recommendation |
|---|---|---|---|---|
| U-001 | `POST /support-crm/public/tickets` returns HTTP 500 when `priority` is an invalid value (e.g. `normal`) instead of a 4xx validation error. Valid values (`low|medium|high|critical`) work | reproduced live; `app/models/support_crm.py` enum | S3 | Validate `priority` before persisting; return 422 |
| U-002 | Sentinel wallet detail read returned HTTP 500 after a credit adjustment (the adjustment itself succeeded, balance confirmed via customer API) | live response | S3 | Diagnose the Sentinel wallet endpoint |
| U-003 | Kenya vehicle-duty endpoint latency occasionally exceeds 60 s (external CRSP data source); passed on retry | Newman run | S3 | Add a timeout/retry policy + cached fallback |

**Tested vs inspected statement:** the features claimed *verified* are those executed live — the 79-request automated UAT run (`evidence/live/uat_newman_execution.json`), the manual account-provisioning evidence, and the journey screenshots; everything else is explicitly *inspected* and marked as such in `API_COVERAGE_MATRIX.md`.
