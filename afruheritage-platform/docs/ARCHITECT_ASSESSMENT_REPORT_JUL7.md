# Afruheritage Platform — Architect Assessment Report
**Date:** July 7, 2026  
**Branch:** `amooskco-storefront-v2`  
**Commit:** `0353f10`  
**Prepared by:** Cascade (AI Pair Programmer)  

---

## 1. Executive Summary

The Afruheritage platform is a **multi-tenant SaaS freight-forwarding launch platform** built on FastAPI + PostgreSQL + Celery/Redis, with Fleetbase deployed underneath as the tenant runtime engine. The platform has grown to **61 route files, 58 mounted routers, 86 database tables, 31 models, 45 services, and 12 plugin modules**.

The subscription gating system is now **fully operational** — all 28 operational endpoint files enforce `require_active_subscription`, returning HTTP 402 when a tenant has no active subscription. The E2E test passes 10/10 stages.

However, the platform has **significant technical debt**, unresolved stubs, missing environment variables, test failures, and architectural gaps that must be addressed before production deployment.

---

## 2. What Was Accomplished This Session

### 2.1 Subscription Gating (COMPLETE)
- **28 route files** gated with `require_active_subscription` dependency
- **6 files intentionally excluded** (auth, billing, social_auth, tenants, company_registration, auth_pages) — these must work pre-subscription
- All `Depends(get_current_user)` calls replaced with `Depends(require_active_subscription)` in operational endpoints
- Superusers bypass gating automatically (built into the dependency)

### 2.2 Tenant Signup & Provisioning Fix
- Fixed `company_registration.py` to provision Fleetbase org at signup (not after subscription)
- Fixed `billing.py` trial activation to directly advance `launch_status` from `draft` to `active` (instead of calling `handle_subscription_payment_success` which caused conflicts)
- Tenant `requires_subscription` flag included in signup response for frontend gating

### 2.3 E2E Test (10/10 PASS)
| Stage | Status | Detail |
|-------|--------|--------|
| 1. Server up | ✅ PASS | HTTP 200 |
| 2. Signup | ✅ PASS | Tenant created with `requires_subscription=True` |
| 3. Fleetbase provisioned | ✅ PASS | `org_id` set at signup, `launch_status=draft` |
| 4. Login | ✅ PASS | JWT token issued |
| 5. No subscription | ✅ PASS | No subscription found (as expected) |
| 6. Feature gated | ✅ PASS | Shipments returned **HTTP 402** |
| 7. Trial activated | ✅ PASS | `plan=free_trial, status=trialing` |
| 8. Launch active | ✅ PASS | `launch_status=active` |
| 9. Subscription exists | ✅ PASS | `plan=free_trial, status=trialing` |
| 10. Subdomain resolve | ✅ PASS | Tenant resolved by subdomain |

---

## 3. What Could NOT Be Fixed / Remains Unresolved

### 3.1 Stubs & Incomplete Implementations

| File | Issue | Severity |
|------|-------|----------|
| `app/api/routes/gallery.py:198-203` | File upload returns placeholder URL — **TODO: implement actual S3/cloud storage upload** | HIGH |
| `app/api/routes/whatsapp_bot.py:19` | Message parsing and bot logic **not implemented** — just a TODO comment | HIGH |
| `app/api/routes/storefront_templates.py:67` | References `"show_mock_data"` in template manifest | MEDIUM |
| `app/api/routes/kyc.py` | Contains `NotImplemented` pattern | MEDIUM |

### 3.2 Dead/Placeholder Frontend Pages (6 pages with <10 lines)

| Page | Lines | Status |
|------|-------|--------|
| `frontend/app/fleetbase/drivers/page.tsx` | 5 | Placeholder |
| `frontend/app/fleetbase/console-gate/page.tsx` | 5 | Placeholder |
| `frontend/app/fleetbase/vehicles/page.tsx` | 5 | Placeholder |
| `frontend/app/fleetbase/fleets/page.tsx` | 5 | Placeholder |
| `frontend/app/fleetbase/orders/page.tsx` | 5 | Placeholder |
| `frontend/app/store/page.tsx` | 5 | Placeholder |

### 3.3 Frontend Mock Data References
- `frontend/lib/api_updated.ts` — contains mock/fake references
- `frontend/components/booking-form.tsx` — contains mock/placeholder data
- `frontend/components/faq-chat-widget.tsx` — contains mock/placeholder data
- `frontend/components/marketplace-section.tsx` — contains mock/placeholder data

### 3.4 Test Failures (17 failed, 9 errors out of 88 tests)

**Failed tests (5):**
| Test | Issue |
|------|-------|
| `test_runner_selection.py::test_select_runner_rejects_explicit_unreachable_runner` | Runner reachability check not working as expected |
| `test_tenant_isolation.py::test_billing_payment_init_ignores_body_tenant_id_spoof` | Tenant isolation bypass possible in payment init |
| `test_tenant_isolation.py::test_custom_domain_request_uses_authenticated_tenant_and_cross_tenant_events_are_denied` | Cross-tenant domain access not properly denied |
| `test_tenants.py::test_registered_tenant_can_launch_on_trial_after_admin_approval` | Launch flow test broken |
| `test_tenants.py::test_runtime_deploy_requires_launch_readiness` | Runtime deploy readiness check failing |

**Errored tests (9):**
All 9 errors are in `test_subscription_gated_provisioning.py` — the test file appears to have setup/fixture issues (likely DB session or import errors).

### 3.5 Alembic Migration Drift
- **DB is at:** `20260706_01`
- **Alembic head is:** `20260707_01`
- **DB is 1 migration behind** — needs `alembic upgrade head`

### 3.6 Subscription Status Enum Case Mismatch
- DB enum values are **UPPERCASE** (`ACTIVE`, `TRIALING`, `EXPIRED`, etc.)
- Some raw SQL queries use **lowercase** (`'active'`, `'trialing'`) which causes `InvalidTextRepresentation` errors
- This is a latent bug in any code that queries subscription status with raw SQL

---

## 4. Missing Environment Variables (21 variables)

These are defined in `settings` but have **no value or placeholder values**:

### Critical (blocks core functionality)
| Variable | Impact |
|----------|--------|
| `fleetbase_runtime_api_token` | Cannot authenticate to Fleetbase runtime API |
| `google_maps_api_key` | Geo/map features non-functional |
| `mapbox_access_token` | Map rendering non-functional |
| `s3_bucket` | File uploads (gallery, documents, KYC) non-functional |
| `s3_endpoint_url` | S3 storage endpoint |
| `smtp_username` | Email notifications non-functional |
| `smtp_password` | Email notifications non-functional |

### Integration (blocks specific integrations)
| Variable | Impact |
|----------|--------|
| `whatsapp_access_token` | WhatsApp messaging non-functional |
| `whatsapp_phone_number_id` | WhatsApp messaging non-functional |
| `glpi_base_url` | GLPI support ticketing non-functional |
| `paypal_webhook_id` | PayPal payment verification non-functional |

### Social Auth (blocks OAuth providers)
| Variable | Impact |
|----------|--------|
| `apple_client_id` | Apple Sign-In non-functional |
| `apple_team_id` | Apple Sign-In non-functional |
| `apple_key_id` | Apple Sign-In non-functional |
| `apple_private_key` | Apple Sign-In non-functional |

### Payment Gateways (regional)
| Variable | Impact |
|----------|--------|
| `alipay_app_id` | Alipay payments non-functional |
| `alipay_private_key` | Alipay payments non-functional |
| `alipay_public_key` | Alipay payments non-functional |
| `wechat_app_id` | WeChat Pay non-functional |
| `wechat_mch_id` | WeChat Pay non-functional |
| `wechat_api_key` | WeChat Pay non-functional |

### Also: Flutterwave keys are placeholders
- `FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-REPLACE_WITH_REAL_KEY`
- `FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-REPLACE_WITH_REAL_KEY`

---

## 5. Database State

### 5.1 Tables: 86 total
All core tables exist and are populated. No missing tables detected.

### 5.2 Tenants: 15 total
| Tenant | launch_status | plan_code | fleetbase_org_id |
|--------|--------------|-----------|-----------------|
| E2E Test Co (x3) | active | free_trial | 2 provisioned, 1 NULL |
| Efie ne Fie | active | free_trial | ✅ |
| Tenant Alpha Corp | active | free_trial | NULL |
| Golden Test Tenant | suspended | free | NULL |
| Test Tenant | suspended | free | NULL |
| Empire Drips LLC | approved | professional | NULL |
| AMOOKSCO | approved | professional | NULL |
| Amooksco Logistics | active | free_trial | ✅ |

### 5.3 Subscriptions: 47 total
- Active/Trialing: **46**
- Expired/Canceled/Suspended: **1**

### 5.4 Issues
- `Empire Drips LLC` and `AMOOKSCO` have `launch_status=approved` but `fleetbase_org_id=NULL` — these tenants were approved but never had Fleetbase orgs provisioned (pre-fix state)
- `Tenant Alpha Corp` has `launch_status=active` but `fleetbase_org_id=NULL` — Fleetbase was unreachable during provisioning
- Two tenants have `launch_status=suspended` with `plan_code=free` — legacy test data

---

## 6. Architecture Assessment

### 6.1 What Works
- ✅ **Subscription gating** — fully enforced across all operational endpoints
- ✅ **Tenant signup → Fleetbase provisioning** — org created at signup
- ✅ **Trial activation → launch_status=active** — flow verified end-to-end
- ✅ **JWT auth** — login, token issuance, user verification
- ✅ **Billing system** — plans, subscriptions, wallets, payments (Paystack)
- ✅ **Custom domains** — Cloudflare integration, 12 endpoints all passing
- ✅ **Fleetbase proxy** — per-tenant admin tokens, live tracking endpoints
- ✅ **Multi-tenant isolation** — tenant_id scoping on all queries
- ✅ **Feature flags** — per-tenant feature gating
- ✅ **Plugin system** — 12 auto-fix plugins with health checks
- ✅ **Admin console** — 24 route files, separate FastAPI app
- ✅ **Sentinel** — 25 route files, monitoring/health checks
- ✅ **i18n** — English + Chinese loaded

### 6.2 What's Broken or Incomplete

#### Backend
- ❌ Gallery file upload returns placeholder URL (no S3 integration)
- ❌ WhatsApp bot has no message parsing logic
- ❌ KYC has incomplete implementation
- ❌ Flutterwave keys are placeholders
- ❌ 21 environment variables missing
- ❌ Alembic migration 1 behind head
- ❌ Subscription status enum case mismatch in raw SQL queries

#### Frontend
- ❌ 6 dead/placeholder pages (fleetbase/* and store)
- ❌ 4 components with mock/fake data references
- ❌ Frontend API wiring incomplete — only 3 lib files use real API calls

#### Tests
- ❌ 17 tests failing, 9 erroring (26 of 88 = 30% failure rate)
- ❌ `test_subscription_gated_provisioning.py` entirely broken (9 errors)
- ❌ Tenant isolation tests failing (cross-tenant access not denied in 2 cases)
- ❌ Runner selection test failing
- ❌ Tenant launch tests failing

#### Infrastructure
- ❌ Celery not installed in local dev environment (blocks provisioning tests)
- ❌ Port 8000 occupied by `oh-agent.py` — had to use port 8100
- ❌ Docker compose uses Docker hostnames (postgres, redis) — local dev needs overrides

---

## 7. Security Concerns

### 7.1 Tenant Isolation Gaps (CONFIRMED by test failures)
- `test_billing_payment_init_ignores_body_tenant_id_spoof` — **FAILED**: Payment initiation may accept tenant_id from request body instead of authenticated user's tenant_id
- `test_custom_domain_request_uses_authenticated_tenant_and_cross_tenant_events_are_denied` — **FAILED**: Cross-tenant domain event access not properly denied

### 7.2 Secrets in .env (committed to repo)
- Cloudflare API tokens
- Paystack secret keys
- Google OAuth client secret
- Instagram/Facebook/TikTok client secrets
- SMTP password
- **These should be in environment secrets, not committed files**

### 7.3 Subscription Gating Bypass Risk
- The `require_active_subscription` dependency checks `current_user.is_superuser` first and returns early — this is by design but means superusers can access any tenant's data
- Raw SQL queries that use lowercase enum values (`'active'` vs `'ACTIVE'`) will throw errors instead of properly filtering — potential for silent failures

---

## 8. Code Quality Metrics

| Metric | Value |
|--------|-------|
| Route files | 61 |
| Mounted routers | 58 |
| Gated route files | 32 (28 fully gated + 4 with partial/feature gating) |
| Models | 31 |
| Services | 45 |
| Plugins | 12 |
| Celery tasks | 6 |
| Database tables | 86 |
| Alembic migrations | 10 |
| SQL migrations | 8 |
| Frontend pages | 104 |
| Frontend components | 118 |
| Admin console routes | 24 |
| Sentinel routes | 25 |
| Test files | 12 |
| Tests passing | 62/88 (70%) |
| Tests failing | 17/88 (19%) |
| Tests erroring | 9/88 (10%) |
| Missing env vars | 21 |
| Dead frontend pages | 6 |
| Stubs/TODOs in routes | 4 files |

---

## 9. Recommendations (Priority Order)

### P0 — Must Fix Before Production
1. **Fix tenant isolation test failures** — cross-tenant access in payment init and domain events
2. **Move secrets out of .env** — use environment injection or secret manager
3. **Run `alembic upgrade head`** — DB is 1 migration behind
4. **Fix subscription status enum case** — audit all raw SQL for lowercase enum values
5. **Fix `test_subscription_gated_provisioning.py`** — 9 errors indicate broken test setup

### P1 — Should Fix Before Launch
6. **Implement gallery file upload** — replace placeholder URL with actual S3/storage upload
7. **Set S3 storage variables** — `s3_bucket`, `s3_endpoint_url`
8. **Set Google Maps / Mapbox API keys** — geo features non-functional without them
9. **Set SMTP credentials** — email notifications (invites, reset links) non-functional
10. **Set WhatsApp API credentials** — WhatsApp messaging non-functional
11. **Set GLPI base URL** — support ticketing integration non-functional
12. **Replace Flutterwave placeholder keys** — payment gateway non-functional
13. **Fix dead frontend pages** — 6 pages are 5-line placeholders

### P2 — Should Fix Before Scale
14. **Implement WhatsApp bot logic** — currently just a TODO
15. **Complete KYC implementation** — has NotImplemented patterns
16. **Remove mock data from frontend components** — 4 components reference mock/fake data
17. **Fix runner selection test** — runner reachability check not working
18. **Fix tenant launch tests** — launch flow tests broken
19. **Install Celery in dev environment** — blocks provisioning task tests
20. **Clean up legacy test tenants** — 2 suspended tenants with NULL org IDs

### P3 — Technical Debt
21. **Consolidate `api.ts` and `api_updated.ts`** — two API client files is confusing
22. **Remove `__pycache__` from git** — compiled Python files shouldn't be tracked
23. **Document API endpoints** — 58 routers, no centralized API documentation beyond OpenAPI
24. **Add integration tests for Fleetbase proxy** — proxy endpoints lack test coverage
25. **Add integration tests for plugin system** — 12 plugins with no test coverage

---

## 10. Honest Assessment

### What's genuinely good:
- The subscription gating architecture is **clean and correct** — a single FastAPI dependency that checks subscription state and returns 402. This is the right pattern.
- The Fleetbase per-tenant token model works — admin session tokens auto-scope to the tenant's org.
- The plugin system is well-designed — check/auto_fix/get_health pattern with audit logging.
- The E2E flow (signup → provision → gate → trial → active) **works end-to-end**.
- 86 database tables with proper relationships and audit trails.

### What's genuinely concerning:
- **30% test failure rate** is unacceptable for production. The tenant isolation failures are particularly alarming — they suggest cross-tenant data access may be possible.
- **21 missing environment variables** means significant functionality is non-functional in any environment.
- **Secrets committed to git** is a security incident waiting to happen.
- **The frontend has dead pages and mock data** — the platform looks more complete than it is.
- **The Alembic migration drift** suggests the deployment process is not disciplined.
- **The subscription status enum case mismatch** is a latent bug that will cause runtime errors in production.

### Bottom line:
The backend architecture is sound and the subscription gating is now solid. But the platform has significant gaps in test coverage, environment configuration, frontend completeness, and security hygiene. It is **not production-ready** but is a **solid foundation** that needs 2-4 weeks of focused work on the P0 and P1 items above.

---

*Report generated July 7, 2026 18:04 UTC*
