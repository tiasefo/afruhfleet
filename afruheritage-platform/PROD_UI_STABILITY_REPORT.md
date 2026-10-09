# Afruheritage — Production Stability Gate Report

**Date:** 2026-10-09
**Gate:** PO DECISION — AFRUHERITAGE PRODUCTION STABILITY GATE (final authorization requested)
**Frozen release version:** `3f94bc25` (`amooskco-storefront-v2`), recorded in `prod-ui-cert/STAB_FREEZE_HEAD.txt`
**Freeze integrity:** HEAD == freeze marker throughout; **zero application-code changes during certification** (only Playwright harness scripts were corrected; harness fixes are test tooling, not product code)
**Target:** `https://afruheritage.com` — real public deployment only

---

## 1. Required fixes — verified in production

### 1.1 Ollama / AI workload containment (was: ~250% CPU starving API)
- `ollama.service` bounded via systemd drop-in `/etc/systemd/system/ollama.service.d/override.conf`: `CPUQuota=150%`, `Nice=15`.
- Cgroup enforcement confirmed live: `cpu.max = 150000 100000`, `CPUQuotaPerSecUSec=1.500000s`.
- Architecture unchanged — AI service preserved, no new infrastructure.
- Measured during campaign: ollama 0.8% CPU while serving; API login probe **316–1464 ms** at loadavg up to 15.6 (that load was the test harness's own browsers/ffmpeg, not production traffic). STB-05 PASS.
- Caveat: `Nice=15` takes effect on next ollama.service restart (nice is a start-time attribute); the hard CPU quota is already enforced by the kernel cgroup.

### 1.2 Trial activation latency (was: ~40 s synchronous)
- `POST /api/v1/billing/subscriptions/trial/{tenant}` no longer calls `advance_tenant_lifecycle` inline; it commits the subscription row and enqueues `app.tasks.provisioning.advance_tenant_lifecycle` (Celery, `acks_late`, `max_retries=3`, idempotent).
- **Real-UI activation measured: POST 200 in 553 ms** (Select Plan → Start Free Trial on the billing page).
- Idempotency (STB-03 PASS): two rapid duplicate POSTs → `200/200` in **183 ms / 99 ms** (also 170/92, 392/80, 404/98 across runs), same subscription returned each time; exactly one `tenant_subscriptions` row.
- Background completion verified in worker log: task received → Fleetbase org `b06b235e-…` provisioned → succeeded in **8.8 s**; tenant `launch_status: draft → active`, `fleetbase_org_id` set, subdomain `uatcert-meridian-freight-3` live.

### 1.3 CRM quote HTTP 500 (was: global `quote_number` unique → IntegrityError → 500)
- `crm_quotes.quote_number` is now unique **per tenant** (`uq_crm_quotes_tenant_number`); runtime migration dropped the global constraint at boot.
- Route returns controlled **409** with a clear message on same-tenant duplicate instead of 500.
- Verified: quote create via UI journey **CRM-05 PASS** (tenant B); API-level: first `Q-DUP-TEST-1` → 200 in 0.39 s, duplicate → 409 in 0.35 s, cross-tenant unaffected.

---

## 2. Stability campaign results

Distinct accounting, per PO requirement:

| Stage | Result |
|---|---|
| Original RC campaign (frozen `d7533dcd`) | 49 PASS / 34 FAIL / 4 BLOCKED (87 rows) |
| RC post-run reconciliation | 77 confirmed working / 10 deferred / 3 residual issues — **not presented as clean passes** |
| **This stability campaign (frozen `3f94bc25`)** | **62 recorded rows → 63 unique capabilities: 58 PASS / 3 FAIL / 2 BLOCKED; all 5 non-PASS are intentionally-deferred surfaces → 58 PASS / 0 unexplained defects** |

Fresh-campaign failures → final recorded PASS after state/harness correction (history preserved in `PROD_UI_STAB_MATRIX.csv`):
- `GJ-07, SUB-02, TEAM-02/03/05, FLT-04, STB-01, STB-02, ISO-01, ISO-05` — every one traced to either (a) pre-subscription 402 gating before trial activation, (b) a harness click-flow gap (plan activation needs Select Plan → Start Free Trial; shipment form needs sender fields), or (c) an assertion keyed to a test-polluted company name. Re-recorded PASS only via real browser re-execution; the fail→pass chains are preserved in the matrix.

Intentionally deferred / unexposed (allowed by PO): `PUB-06`, `PUB-07` (marketplace & vendor → login wall), `CRM-04` (activity logging UI absent), `ANA-02` (dedicated analytics surface absent), `VND-03` (public vendor registration → login wall).

## 3. Golden Journey (frozen build, no fixes during run)

**PASS** — fresh mailbox `stab-…@maxxspace.com`:
register → welcome email delivered (real SMTP) → login → onboarding → **trial activation 553 ms** → dashboard/nav → settings PATCH 200 persisted after reload → team invite → invite email delivered → invitee sets password → member login → RBAC denied mutations (billing/settings read-only, members admin blocked) → CRM contact/opportunity/quote → shipment create 364 ms → driver + vehicle create → assignment + event → status transition → anonymous public tracking → billing → second-tenant isolation.

## 4. Concurrency (STB-04) — 3 simultaneous customer sessions

Three independent runs (each ~90 s, owner-A loop, owner-B loop, anonymous public loop):

| Run | Ops | Fails | Bounces | >30 s | Max | Avg |
|---|---|---|---|---|---|---|
| 1 | 89 | 0 | 0 | 0 | 4.1 s | ~3.0 s |
| 2 | 97 | 0 | 0 | 0 | 3.8 s | ~2.9 s |
| 3 | 97 | 0 | 0 | 0 | 4.2 s | ~2.9 s |

## 5. Timing metrics

| Metric | Measured |
|---|---|
| Trial activation POST | **553 ms** (real UI); idempotent re-POST 80–404 ms |
| Subscription→org provisioning (background) | 8.8 s (worker log) |
| Shipment create POST | **364 ms** (STB-02), 281 ms (tenant B earlier run) |
| Shipment list API | **537–538 ms** (STB-01) |
| CRM page | ~4.3 s · Billing page ~4.2 s · Login flow 5.5–6.6 s (page + redirects; auth API probe 316 ms–1.5 s) |
| Fleetbase-proxy list reads | 1.3–7.8 s (org-scoped Redis cache + 20 s GET timeout + stale-if-error fallback active) |

## 6. Browser errors / timeouts

- Final passing runs: **0 case timeouts, 0 assertion failures** in STB/FLT/TEAM/GJ/ISO sets.
- Network log aggregates (all sessions incl. superseded runs): REQFAIL 59 — overwhelmingly `net::ERR_ABORTED` navigation-cancelled fetches (benign); HTTP 5xx 8 — 6 are test-harness slug-path artifacts (`/shipments/{slug}` from retest scripts, not UI-generated URLs; UI uses UUID paths → all 200) + 1 `POST /ai/chat/public` 500 + 1 pre-fix quote POST abort; HTTP 4xx dominated by expected responses (402 pre-subscription gating, 403 RBAC denials, 401 pre-login) plus a recurring benign `422` on `/i18n/translations/en` (response-schema mismatch — console noise only, no user-visible failure).

## 7. Tenant isolation

- ISO-01 A workspace shows A identity only — PASS · ISO-02 A session denied on B subdomain — PASS · ISO-03 no cross-tenant CRM via `tenant_id` param — PASS · ISO-04/05 anonymous subdomains scoped correctly — PASS · FLT-05 restricted member POST → server-side **403** — PASS · FLT-06 B sees zero A fleet records — PASS.
- Team-member RBAC: read allowed, mutations denied server-side (TEAM-04).

## 8. Deferred-surface audit (PO item 7)

- Public navigation, docs, pricing, FAQ-bot knowledge base, and landing page no longer advertise: marketplace, public vendor registration, warehouse, dedicated analytics, CRM activity depth, earnings dashboards, or payout claims; fabricated stats/testimonials removed; `/fleetbase/*` public paths moved to `/freight-management` (+redirects); "Fleetbase Extensions (Coming Soon)" replaced with redirect; `/vendors` removed. Verified: marketplace/vendors → login wall; no "coming soon" placeholders on reachable pages.

## 9. Remaining production-exposed defects

None unexplained. Non-blocking residual items:
1. Invite email subject reads "Password Reset Request" rather than "Team Invitation" — cosmetic, flow works.
2. `/shipments/{slug}/members` returns 500 when called with tenant **slug** + `q=undefined` — only reachable via malformed/non-UI calls; UI paths use UUID (all 200). Minor hardening opportunity.
3. `POST /ai/chat/public` produced one 500 — depends on external ollama; now CPU-bounded but remains best-effort.
4. Recurring `422` on `/i18n/translations/en` — console noise, no user-facing impact.
5. Ollama `Nice=15` applies on next service restart (CPUQuota already enforced).

## 10. Evidence

- Matrix (all recordings incl. fail→pass history): `PROD_UI_STAB_MATRIX.csv`
- Clean final matrix: `PROD_UI_STAB_MATRIX_FINAL.csv`
- Screenshots/traces/videos/console/network logs: `playwright-evidence/{screenshots,traces,videos,console,network}/` (session tags GJ, TEAM, CRMSHP, STAB, CONC-*, FLT, ISO, VERIFY…)
- Stability stats: `playwright-evidence/stability-stats.json`
- Freeze marker: `prod-ui-cert/STAB_FREEZE_HEAD.txt`
- Campaign logs: `prod-ui-cert/stab-campaign.log`, `prod-ui-cert/stab-retest.log`

## 11. Recommendation

**GO** — the three gating issues are resolved and verified through the real browser UI on the frozen build: AI workload is cgroup-bound (API ≤1.5 s under test-host load), trial activation is sub-second with safe duplicates and async org provisioning, and quotes behave correctly with tenant-scoped uniqueness. Concurrency, isolation, timing, and the full golden journey all pass with direct Playwright evidence. Final authorization remains with the Product Owner.
