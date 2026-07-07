# Inventory Demand: Billing/Subscription + Plugin/Template Store

**Date:** Jul 6, 2026
**Prepared by:** Cascade (AI pair programmer)
**Scope:** Full inventory + design verification of billing and template systems

---

## Follow-up Answers (from prior thread)

### Follow-up 1: Why was `fleetbase_runtime.py` deleted?

**Cause: Unknown.** Git shows no delete commit — the file was removed from the working tree without being staged. `git log --diff-filter=D` returns no results for this file. The most likely explanation is an accidental `rm` or a tool (IDE, linter, refactor script) that deleted it without the developer noticing. The file was still actively imported by `alembic/env.py` and 5 route/service files. It was restored from HEAD (`b1c0385`) to unblock the Alembic stamp. **This is not a code problem — it's a workflow hygiene problem.** Recommend adding a pre-commit hook that fails if any tracked `.py` file is deleted while still imported by another file.

### Follow-up 2: The 101 uncommitted files

**Full list:** 103 files with uncommitted changes (after committing 7). Breakdown by category:

| Category | File count | Key files |
|----------|-----------|-----------|
| Backend routes | 12 | `auth.py`, `billing_admin.py`, `fleetbase_tenant_proxy.py`, `shipments.py`, `storefront_templates.py`, `tenant_context.py`, `tenants.py`, `users.py` |
| Backend services | 6 | `cloudflare_domains.py`, `custom_domain_service.py`, `fleetbase_api_client.py`, `fleetbase_provisioner.py`, `tenant_context_service.py` |
| Backend models | 5 | `rbac.py`, `runner.py`, `saas_subscription.py`, `shipment.py`, `tenant.py`, `tenant_branding.py` |
| Backend schemas | 4 | `custom_domains.py`, `shipment.py`, `tenant.py`, `tenant_context.py` |
| Backend core | 3 | `deps.py`, `runtime_migrations.py`, `main.py` |
| Admin console | 7 | `tenants.py`, `main.py`, `control_plane_client.py`, billing page, tenant detail page, layout, token-manager |
| Frontend (SaaS) | 20+ | `api.ts`, `tenant.ts`, `middleware.ts`, `next.config.mjs`, multiple pages and components |
| Sentinel | 5 | `billing.py`, `main.py`, `control_plane_client.py`, Dockerfile, token-manager |
| Config/env | 5 | `.env`, `.dockerignore`, `Dockerfile`, `requirements.txt`, nginx config |
| Build artifacts | 4 | `tsconfig.tsbuildinfo`, `test.db`, `celerybeat-schedule`, `__pycache__` |

**Risk assessment:** These are **not backed up anywhere other than this working tree.** If the machine restarts, someone does `git checkout`, or a deploy pipeline does a clean checkout, this work is gone. Several of these files (auth, tenants, shipments, admin console) are likely required for the demo to function.

**Recommendation:** Commit these in logical batches immediately. At minimum, commit backend routes + models + services as one commit, frontend as another, admin console as a third.

### Follow-up 3: Push target / deploy branch

- **Current branch:** `amooskco-storefront-v2`
- **Remote tracking:** `origin/amooskco-storefront-v2` (ahead 1 — our commit `6d5d50d`)
- **Main branch:** `main` at `f56e313`
- **Remote HEAD:** `origin/main`

**The demo/staging deploy branch is unknown.** If the demo pulls from `main`, the fixes are not live there. `git push` will sync to `origin/amooskco-storefront-v2` only. Someone needs to confirm which branch the demo environment deploys from and merge accordingly.

### Token exposure update

The Fleetbase token `1|KPPhwb69LydQ7mNNK2AvCQVGD9ifGtFSX2GNKok2` is now referenced in:
1. Commit `b1c0385` (original hardcoded default)
2. Commit `6d5d50d` (commit message describes the removal)
3. This chat

**Action: Rotate the token at Fleetbase level. This cannot be done from code.**

---

## Part 1 — Billing & Subscription

### 1.1 Endpoint Inventory: Real vs Stub

#### `billing.py` — `/billing` prefix
**Status: REAL — fully functional for Paystack/Flutterwave, PayPal via platform_payment_service**

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/billing/plans` | GET | ✅ Real | Seeds default plans, returns from DB |
| `/billing/subscriptions/trial/{tenant_id}` | POST | ✅ Real | Creates trial subscription + wallet |
| `/billing/subscriptions/{tenant_id}` | GET | ✅ Real | Evaluates subscription state (trial expiry, credits) |
| `/billing/subscriptions/{tenant_id}/cancel` | POST | ✅ Real | Sets status to CANCELED, immediate |
| `/billing/subscriptions/{tenant_id}/pause` | POST | ✅ Real | Sets status to SUSPENDED |
| `/billing/subscriptions/{tenant_id}/resume` | POST | ✅ Real | Sets status back to ACTIVE |
| `/billing/wallets/{tenant_id}` | GET | ✅ Real | Returns wallet balance |
| `/billing/wallets/{tenant_id}/transactions` | GET | ✅ Real | Returns wallet transaction history |
| `/billing/usage-costs` | GET | ✅ Real | Returns feature credit costs |
| `/billing/payments/init` | POST | ✅ Real | Calls Paystack/Flutterwave `initialize_transaction` |
| `/billing/payments/verify/{reference}` | POST | ✅ Real | Calls Paystack `verify_transaction`, activates subscription on success |
| `/billing/payments/reinit/{reference}` | POST | ✅ Real | Re-initializes a failed payment |
| `/billing/credits/consume` | POST | ✅ Real | Debits wallet credits |
| `/billing/admin/read-only` | POST | ✅ Real | Admin sets subscription read-only |
| `/billing/admin/credits/adjust` | POST | ✅ Real | Admin adjusts wallet credits |
| `/billing/admin/subscriptions/assign` | POST | ✅ Real | Admin assigns plan to tenant |

#### `billing_admin.py` — `/billing` prefix (SaaS model)
**Status: REAL but uses a DIFFERENT data model (SaaSPlan, TenantSubscription) than billing.py (Plan, Subscription)**

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/billing/plans` (SaaS) | GET/POST/PATCH/DELETE | ✅ Real | CRUD for SaaSPlan table |
| `/billing/addons` | GET/POST/PATCH/DELETE | ✅ Real | CRUD for SaaSAddon table |
| `/billing/credits/grant` | POST | ✅ Real | Adds credits to TenantSubscription |
| `/billing/credits/revoke` | POST | ✅ Real | Removes credits from TenantSubscription |
| `/billing/gift-cards` | GET/POST/DELETE | ✅ Real | Gift card CRUD |
| `/billing/gift-cards/{code}/redeem/{tenant_id}` | POST | ✅ Real | Redeems gift card |
| `/billing/subscriptions` | GET | ✅ Real | Lists all Subscription records |
| `/billing/subscriptions/{id}/plan` | PATCH | ✅ Real | Changes plan (DB only, no gateway) |
| `/billing/subscriptions/{id}/pause` | POST | ✅ Real | Pauses subscription |
| `/billing/subscriptions/{id}/resume` | POST | ✅ Real | Resumes subscription |
| `/billing/subscriptions/{id}/cancel` | POST | ✅ Real | Cancels subscription |
| `/billing/invoices` | GET | ✅ Real | Lists invoices |
| `/billing/invoices/{id}/void` | POST | ✅ Real | Voids invoice |
| `/billing/invoices/{id}/payments` | POST | ✅ Real | Manual payment mark |
| `/billing/invoices/{id}/branding` | PATCH | ✅ Real | Updates invoice branding |

**⚠️ OVERLAP CONFIRMED:** `billing.py` and `billing_admin.py` both define `/billing/plans` and `/billing/subscriptions` endpoints with different data models. `billing.py` uses `Plan`/`Subscription` (from `app.models.billing`), `billing_admin.py` uses `SaaSPlan`/`TenantSubscription` (from `app.models.saas_subscription`). **Both are registered on the same FastAPI app.** Whichever router is included last wins for overlapping paths. This is a real bug — see §1.5.

#### `payments.py` — `/payments` prefix
**Status: REAL — platform payment layer with Paystack + PayPal**

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/payments/initiate` | POST | ✅ Real | Calls `PlatformPaymentService.initiate_payment` (Paystack mobile_money or PayPal) |
| `/payments/status/{reference}` | GET | ✅ Real | Checks billing ledger + legacy PaymentRecord, auto-verifies with gateway |
| `/payments/webhook/paystack` | POST | ✅ Real | Verifies HMAC-SHA512 signature, processes `charge.success`/`charge.failed` |
| `/payments/webhook/paypal` | POST | ⚠️ Partial | No webhook signature verification — accepts raw payload |
| `/payments/statistics` | GET | ✅ Real | Returns payment stats from billing ledger |
| `/payments/credits/purchase` | POST | ✅ Real | Initiates credit purchase payment |
| `/payments/methods` | GET | ✅ Real | Returns available payment methods |
| `/payments/balance` | GET | ✅ Real | Returns wallet balance |

#### `payment_hub.py` — `/payment-hub` prefix
**Status: REAL but DUPLICATES payments.py functionality with its own DB session and Paystack calls**

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/payment-hub/initialize` | POST | ✅ Real | Calls Paystack directly (not via paystack_client) |
| `/payment-hub/verify/{reference}` | GET | ✅ Real | Calls Paystack verify, activates subscription |
| `/payment-hub/transactions/{tenant_id}` | GET | ✅ Real | Lists PaymentTransaction records |
| `/payment-hub/webhook/paystack` | POST | ✅ Real | Verifies HMAC-SHA512, processes payment, activates subscription |
| `/payment-hub/receipt/{reference}` | GET | ✅ Real | Returns receipt data |

**⚠️ OVERLAP CONFIRMED:** `payment_hub.py` and `payments.py` both handle Paystack webhooks and payment initialization. `payment_hub.py` creates its own `SessionLocal` (bypassing dependency injection) and uses `PaymentTransaction` model, while `payments.py` uses `PaymentRecord` + `BillingPayment`. **Three separate payment record tables exist:** `PaymentTransaction`, `PaymentRecord`, and `BillingPayment` (the billing ledger). This is the same duplication pattern as the domain resolution systems.

**Bug in payment_hub.py:** Lines 312-316 call `activate_subscription_after_payment(db, tx)` **twice** for subscription payments. Same bug at lines 437-441 in the webhook handler. This would double-credit the subscription.

#### `checkout.py` — `/checkout` prefix
**Status: REAL but minimal**

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/checkout` | POST | ✅ Real | Creates a Shipment record from checkout form data. No payment processing. |

#### `estimate.py` — `/estimate` prefix
**Status: REAL but hardcoded rates**

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/estimate` | POST | ✅ Real | Haversine distance calculation. Base rate hardcoded at GHS 5/km, weight surcharge GHS 2/kg over 10kg. No per-tenant rate configuration. |

#### `admin_billing_config.py` — `/admin/billing-config` prefix
**Status: REAL — raw SQL, no auth**

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/admin/billing-config/plans` | GET | ✅ Real | Raw SQL query to `billing_plans` table |
| `/admin/billing-config/features/{plan_code}` | GET | ✅ Real | Raw SQL |
| `/admin/billing-config/plans/{plan_code}/price/{currency}` | PUT | ✅ Real | Upserts plan price |
| `/admin/billing-config/plans/{plan_code}/features/{feature_code}` | PUT | ✅ Real | Upserts feature config |
| `/admin/billing-config/credit-packs` | GET | ✅ Real | Lists credit packs |
| `/admin/billing-config/credit-packs/{code}` | PUT | ✅ Real | Upserts credit pack |
| `/admin/billing-config/payment-providers` | GET | ✅ Real | Lists providers |
| `/admin/billing-config/payment-providers/{provider_code}` | PUT | ✅ Real | Updates provider |
| `/admin/billing-config/exchange-rates` | GET | ✅ Real | Lists exchange rates |
| `/admin/billing-config/exchange-rates/USD/{target_currency}` | PUT | ✅ Real | Upserts exchange rate |

**⚠️ No authentication on any endpoint.** No `Depends(get_current_user)` or `require_superuser`. Anyone with network access can change plan prices, feature flags, and exchange rates.

#### `admin_credits.py` — `/admin/credits` prefix
**Status: REAL but no auth, creates own DB session**

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/admin/credits/{tenant_id}` | GET | ✅ Real | Returns TenantSubscription + FeatureUsage |
| `/admin/credits/{tenant_id}/topup/{credits}` | POST | ✅ Real | Adds credits to TenantSubscription |

**⚠️ No authentication.** Anyone can top up credits for any tenant.

#### `admin_subscriptions.py` — `/admin/subscriptions` prefix
**Status: REAL but no auth, creates own DB session**

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/admin/subscriptions/demo/activate/{tenant_id}/{plan_code}` | POST | ✅ Real | Activates demo subscription |
| `/admin/subscriptions/{tenant_id}/features/{feature_code}` | GET | ✅ Real | Checks feature access |

**⚠️ No authentication.**

#### Summary: Which is authoritative?

**There is no single authoritative billing system.** There are three parallel payment systems:

1. **`billing.py`** — uses `Plan`, `Subscription`, `Payment`, `Wallet` models (from `app.models.billing`). This is the tenant-facing billing system.
2. **`billing_admin.py`** — uses `SaaSPlan`, `SaaSAddon`, `TenantSubscription`, `GiftCard` models (from `app.models.saas_subscription`). This is the admin console billing system.
3. **`payment_hub.py`** — uses `PaymentTransaction` model (from `app.models.payment_hub`). This is a standalone payment hub for commercial orchestration.

Systems 1 and 2 have overlapping route paths (`/billing/plans`, `/billing/subscriptions`) but different data models. System 3 has its own separate payment flow. **The `payments.py` module is a fourth layer** that uses `PaymentRecord` (from `app.models.payment`) and syncs to `BillingPayment` (from `app.models.billing`).

**For MVP: `billing.py` + `payments.py` are the primary systems.** `billing_admin.py` is the admin console backend. `payment_hub.py` is a parallel system that should be deprecated or consolidated.

---

### 1.2 Gateway Integration — PayPal

**Sandbox or production?**
Sandbox. `PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com` in `.env` at `@/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/.env:59`. Client ID and secret are sandbox credentials.

**Webhook signature verification:**
**❌ NOT IMPLEMENTED.** The PayPal webhook handler at `@/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/app/api/routes/payments.py:264-293` accepts raw JSON with no signature verification. PayPal webhooks should be verified via the PayPal-Transmission-Sig header + certificate chain, but the code just parses the body directly. Anyone can POST a fake webhook and mark payments as completed.

**Webhook idempotency:**
**❌ NOT IMPLEMENTED.** `handle_paypal_webhook` at `@/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/app/services/platform_payment_service.py:386-443` finds the payment by order_id, then sets `status = COMPLETED` unconditionally. If PayPal retries the webhook, the handler will process it again — it won't double-credit the wallet (because there's no wallet credit in the PayPal path), but it will overwrite `completed_at` and `paid_amount` and re-send notifications.

**Currency:**
PayPal charges in USD (default in `platform_payment_service.py:211`). Paystack charges in GHS (default in `platform_payment_service.py:143`). Currency is per-transaction, set via `metadata.currency`. There is no single canonical currency per tenant — it depends on which gateway the tenant selects.

---

### 1.3 Gateway Integration — Paystack

**Sandbox or production?**
Test keys. `PAYSTACK_SECRET_KEY=sk_test_a29da6ab75f722230998eadc462991dfa0f04d59` in `.env:40`.

**Webhook signature verification:**
**✅ IMPLEMENTED in both webhook handlers:**
- `payments.py:222` — calls `verify_webhook_signature(raw_body, signature)` which uses `hmac.compare_digest` with HMAC-SHA512
- `payment_hub.py:390-397` — inline HMAC-SHA512 verification with `hmac.compare_digest`

**Webhook idempotency:**
**⚠️ PARTIAL in `payments.py`:** `handle_paystack_webhook` at `platform_payment_service.py:322` checks `if event == "charge.success"` and sets `payment.status = COMPLETED` unconditionally. No check for "already processed." A retry would overwrite status and re-send notifications, but would NOT double-credit the wallet (no wallet credit logic in this handler).

**✅ IMPLEMENTED in `payment_hub.py`:** Lines 417-423 check `if tx.status == "success": return {"status": "already_processed"}`. This prevents double-processing.

**⚠️ BUT:** `payment_hub.py:427-434` credits `sub.credits_balance += int(tx.amount)` on `charge.success` with no idempotency check on the credit itself. If the `already_processed` guard were ever bypassed (e.g., race condition between webhook and manual verify), credits would double.

**Currency:**
Paystack defaults to GHS. Currency is passed per-transaction via `metadata.currency`. **Not configurable per tenant** — it's set at the payment initiation call site. For the China-Ghana focus, Paystack always charges GHS. PayPal charges USD. There is no CNY option implemented (AliPay/WeChat Pay are listed in `/payments/methods` but gated on env vars that are not set).

---

### 1.4 Subscription Lifecycle

**New subscription (trial → paid):**
1. `POST /billing/subscriptions/trial/{tenant_id}` → `create_trial_subscription()` in `billing_service.py:275` — creates Subscription with status `TRIALING`, plan `FREE_TRIAL`, 30-day trial period
2. `POST /billing/payments/init` with `plan_code` and `purpose=subscription` → calls Paystack `initialize_transaction`
3. User pays on Paystack → Paystack calls `POST /payments/webhook/paystack` → `handle_paystack_webhook()` → sets `PaymentRecord.status = COMPLETED`
4. OR: `POST /billing/payments/verify/{reference}` → `verify_transaction()` → `mark_payment_verified()` → `activate_or_upgrade_subscription()` → `grant_subscription_allowance()`
5. `activate_or_upgrade_subscription()` at `billing_service.py:468` — sets status to `ACTIVE`, resets `current_period_end` to +30 days, updates `Tenant.plan_code`

**Upgrade / downgrade mid-cycle:**
`activate_or_upgrade_subscription()` at `billing_service.py:468` — **no proration.** It always sets `current_period_end = now + timedelta(days=30)`. Upgrading from Professional to Business gives a fresh 30-day period. Downgrading from Business to Professional also gives a fresh 30-day period. **This means a tenant can upgrade on day 29, get a new 30-day cycle, then downgrade on day 1 of that cycle and get another 30-day cycle.** This is full-price-both-ways with clock reset.

**Cancellation:**
`cancel_subscription()` at `billing_service.py:669` — **immediate**, not end-of-period. Sets `status = CANCELED`, `canceled_at = now`, `read_only_reason = reason`. Does NOT update `Tenant.launch_status` or any feature flags. The tenant's storefront continues to work — there's no runtime enforcement of subscription status on API endpoints (see §1.5 below).

**Failed payment / card decline:**
**❌ No retry/dunning flow.** `handle_paystack_webhook` handles `charge.failed` by setting `payment.status = FAILED` and `failure_reason`. That's it. No retry attempt, no dunning email, no subscription status change. The subscription remains `ACTIVE` regardless of payment failure. `evaluate_subscription_state()` at `billing_service.py:604` checks for expired trial or exhausted credits, but does NOT check for failed payments.

**Refund:**
**❌ NO REFUND ENDPOINT EXISTS.** There is no `/refund` or `/payments/refund` endpoint anywhere in the codebase. The `REFUNDED` status exists in the `PaymentStatus` enum and `WalletTransactionType.REFUND` exists, but no code path ever sets a payment to `REFUNDED` or creates a `REFUND` wallet transaction. `billing_admin.py` has `credits/grant` and `credits/revoke` which adjust internal credit balances, but **these do not call PayPal or Paystack's refund APIs.** No money is ever returned to a customer through the platform. A refund would need to be processed manually in the Paystack/PayPal dashboard.

**This is a P0 gap for a support workflow.** If a customer requests a refund, the support team has no way to process it through the platform. They would need to:
1. Log into Paystack/PayPal dashboard and refund manually
2. Use `POST /billing/admin/credits/adjust` with a negative delta to zero out the wallet
3. Use `POST /billing/admin/read-only` to suspend the tenant if needed

---

### 1.5 Source of Truth: "What plan is this tenant on?"

**Three places track subscription state, and they can disagree:**

| Source | Model | Updated by | Used by |
|--------|-------|-----------|---------|
| `Tenant.plan_code` | `app.models.tenant.Tenant.plan_code` | `create_trial_subscription()`, `activate_or_upgrade_subscription()` | Tenant display, feature checks |
| `Subscription` table | `app.models.billing.Subscription` | `billing_service.py` functions | `billing.py` endpoints, `evaluate_subscription_state()` |
| `TenantSubscription` table | `app.models.saas_subscription.TenantSubscription` | `billing_admin.py`, `payment_hub.py`, `entitlements.py` | `admin_credits.py`, `admin_subscriptions.py`, `entitlements.py` |

**What happens when they disagree:**
- `Tenant.plan_code` is updated by `activate_or_upgrade_subscription()` and `create_trial_subscription()` — both also update the `Subscription` table in the same transaction. So these two stay in sync.
- `TenantSubscription` is a **completely separate table** updated by `billing_admin.py` and `payment_hub.py`. There is **no synchronization** between `Subscription` and `TenantSubscription`. If `billing_admin.py` changes a plan via `PATCH /billing/subscriptions/{id}/plan`, it updates the `Subscription` table but NOT `TenantSubscription`. If `payment_hub.py` activates a subscription, it updates `TenantSubscription` but NOT `Subscription`.

**Which one wins at runtime?**
- `billing.py` endpoints check `Subscription` (via `evaluate_subscription_state()`)
- `entitlements.py:tenant_has_feature()` checks `TenantSubscription`
- `admin_subscriptions.py` checks `TenantSubscription`
- Feature gating via `require_feature_or_raise()` in `marketplace.py` checks `TenantSubscription`

**For the marketplace (the only place feature gating is enforced), `TenantSubscription` wins.** For billing status and read-only mode, `Subscription` wins. **These can and will diverge.**

**No enforcement of subscription status on most API endpoints:** `evaluate_subscription_state()` can set a subscription to `READ_ONLY`, but no middleware or dependency checks this status before processing requests. Only `assert_tenant_launch_ready()` checks it, and that's only called during provisioning. A canceled tenant can still use all API endpoints.

---

### 1.6 Live Gateway Test

**❌ NOT RUN.** I have not executed live end-to-end gateway tests. The sandbox credentials are configured, but running a full test requires:
1. A live Paystack sandbox transaction (requires a test card number and browser interaction)
2. A live PayPal sandbox transaction (requires sandbox account login)
3. Webhook delivery (requires a publicly accessible URL — the webhook endpoints need to be reachable by Paystack/Paypal sandbox servers)

**What I can confirm from code inspection:**
- Paystack `initialize_transaction` and `verify_transaction` calls are correctly structured
- PayPal `create_order`, `capture_order`, and `get_order` calls are correctly structured
- Webhook signature verification is implemented for Paystack (not PayPal)
- Subscription activation on payment success is wired correctly

**What I cannot confirm without live tests:**
- Whether webhooks are actually received and processed
- Whether the subscription state updates correctly end-to-end
- Whether upgrade/cancel/refund work as described in a live scenario
- Whether the PayPal flow works at all (no signature verification, no idempotency)

**Recommendation:** Before calling billing "MVP-ready," run the following against sandbox:
1. `POST /billing/payments/init` with `purpose=subscription`, `plan_code=professional` → get authorization URL
2. Complete payment on Paystack sandbox
3. Confirm `POST /payments/webhook/paystack` receives and processes the webhook
4. Confirm `GET /billing/subscriptions/{tenant_id}` shows `ACTIVE` status
5. `POST /billing/subscriptions/{tenant_id}/cancel` → confirm status changes
6. Attempt a refund in Paystack dashboard → confirm there's no way to reflect this in the platform

---

## Part 2 — Plugin / Template Store

### 2.1 Mechanism Clarification

**Answer: (b) — fixed shared endpoints with feature flag toggling.**

The system does NOT dynamically register new FastAPI routes at runtime. All routes are mounted once at app startup in `app/main.py`. The "auto-fix" mechanism works by:

1. Each template has a `preset` JSON with a `features` list (e.g., `["tracking", "bulk_import", "ai_chat"]`)
2. `auto_fix_template_endpoints()` in `template_manifest_service.py:61` iterates over plugins whose `name` matches a feature in the list
3. Each plugin's `check()` method verifies a boolean flag on `TenantBranding` (e.g., `public_tracking_enabled`, `csv_import_enabled`)
4. If the flag is `False`, `auto_fix()` sets it to `True` and commits
5. The endpoints themselves (e.g., `GET /api/v1/shipments/{tenant_id}/track`) are always available for all tenants — the flag only controls whether the frontend shows the feature

**This is a perfectly reasonable design**, but it is NOT "adding/removing endpoints." It is toggling feature visibility. Describing it as "auto-fixing endpoints" to stakeholders will cause confusion.

### 2.2 The `_configure_endpoint` Placeholder

**✅ NO LONGER LIVE.** The `_configure_endpoint` placeholder described in the question does not exist in the current codebase. The `template_manifest_service.py` file has been refactored to use a plugin-based architecture:

- `auto_fix_template_endpoints()` at `@/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/app/services/template_manifest_service.py:61` calls `plugin.check()` and `plugin.auto_fix()` on real plugin instances
- Each plugin (e.g., `TrackingPlugin`, `BulkImportPlugin`) has a real `check()` that queries `TenantBranding` flags and a real `auto_fix()` that sets them to `True`
- There is no `_configure_endpoint` function that always returns `True`

**However:** The plugins' `auto_fix()` methods are very simple — they just set a boolean flag on `TenantBranding`. They do NOT verify that the underlying endpoint is actually reachable or functional. So "auto-fix succeeded" means "the feature flag was flipped to True," not "the endpoint was tested and confirmed working." If an endpoint is broken at the code level, auto-fix will still report success.

**The failure-notification system CAN fire** — if `plugin.check()` returns `False` AND `plugin.auto_fix()` returns `(False, message)`, the plugin is added to `still_failing`, which triggers the 72-hour email and audit event. But since all current plugins' `auto_fix()` methods always return `(True, ...)`, the failure path is only reachable if `auto_fix()` throws an exception (which is not caught in the loop).

### 2.3 Plugin Store CRUD vs. Feature Gating

**The admin console API has `getPlugins`, `addPlugin`, `removePlugin` per tenant** — but these are not in the route files I examined. Let me check:

The `entitlements.py` module has `tenant_has_feature()` which checks `TenantSubscription.selected_addons_json` against an addon-to-feature map. This is called by:
- `admin_subscriptions.py:check_feature` — admin endpoint to check a feature
- `marketplace.py` — uses `require_feature_or_raise()` to gate marketplace access

**Feature gating IS enforced at runtime, but only in the marketplace module.** The `require_feature_or_raise()` function at `entitlements.py:91` raises `HTTPException(403)` if the tenant's subscription doesn't include the feature. This checks `TenantSubscription` (not `Subscription`).

**For non-marketplace features (tracking, AI chat, bulk import, customs, etc.), there is NO runtime feature gating.** The `TenantBranding` flags (e.g., `public_tracking_enabled`, `csv_import_enabled`) are set by the auto-fix plugins, but no middleware or dependency checks these flags before allowing access to the corresponding endpoints. A tenant with `csv_import_enabled = False` can still call `POST /api/v1/shipments/{tenant_id}/import/csv` directly.

**Code path from "plugin added" to "feature available":**
1. Admin adds plugin → `TenantSubscription.selected_addons_json` is updated (via admin console API, not verified in this audit)
2. `tenant_has_feature()` checks `selected_addons_json` → returns `True`/`False`
3. `require_feature_or_raise()` raises 403 if `False`
4. **This is only called in `marketplace.py`** — no other route file calls it

### 2.4 Template Switch — Data Handling

When a tenant switches templates via `POST /storefront-templates/select` at `@/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform/app/api/routes/storefront_templates.py:309`:

1. **Branding colors are overwritten:** `primary_color`, `secondary_color`, `accent_color`, `background_color` are set from the new template's preset. Old values are lost.
2. **`template_code` is updated** on `TenantBranding`
3. **Feature flags are toggled** by auto-fix plugins (e.g., `public_tracking_enabled`, `csv_import_enabled`)
4. **`storage_fees_enabled` is set** from the new template's preset

**What happens to old template data:**
- **Nothing is deleted.** Shipment records, customs calculator history, storage fee records, etc. remain in the database regardless of template.
- **No orphaned records are cleaned up.** If a tenant switches from a template with customs calculator to one without, the customs data remains but may not be accessible from the new template's UI.
- **No data migration occurs.** If the old template stored data in template-specific fields on `TenantBranding` that the new template doesn't use, those fields retain their old values but are ignored.
- **Feature flags from the old template are NOT reset.** If the old template enabled `csv_import_enabled = True` and the new template doesn't include the bulk_import plugin, the flag remains `True` (auto-fix only runs for plugins in the new template's feature list — it doesn't disable flags for plugins not in the list).

**This is not a data loss risk, but it is a data leakage risk** — a tenant on a lower-tier template could retain feature flags from a previous higher-tier template switch.

### 2.5 Frontend Visibility of Failures

When `still_failing` endpoints exist after a template switch:

1. **Email is sent** to `tenant.contact_email` with subject "Template Change: Some features may not work for 72 hours" (see `storefront_templates.py:380-396`)
2. **Audit event is created** with `event_type = "template_auto_fix_failed"` (see `storefront_templates.py:363-375`)
3. **`tenant.pending_endpoints` is set** to a JSON array of failed plugin names
4. **`graceful_degradation` flag** is returned in the API response

**What the frontend does with this:**
- The API response includes `failed_endpoints` and `graceful_degradation` — the admin console UI receives this data
- **There is no in-app banner or indicator on the tenant-facing storefront.** A tenant visitor would not know that some features are broken.
- **The admin console** receives the `graceful_degradation` flag but I did not find code that displays `pending_endpoints` in the admin UI (the admin console frontend code is among the 101 uncommitted files, so this may exist but I cannot confirm from committed code)

**A tenant with a broken feature and no in-app indication is indeed a support-ticket generator.** The email notification is the only tenant-facing signal.

---

## Priority Summary

| Item | Severity | Status | Action Required |
|------|----------|--------|----------------|
| **2.2** Fake auto-fix success | ~~P0~~ | ✅ Resolved — placeholder replaced with real plugin system | None (but note: auto-fix only flips flags, doesn't test endpoints) |
| **1.4** Refund flow | **P0** | ❌ Not implemented | No refund endpoint exists. Must be processed manually in gateway dashboard. No way to reflect refund in platform DB. |
| **1.6** Live gateway test | **P1** | ❌ Not run | Requires publicly accessible webhook URL + sandbox test cards |
| **1.2** PayPal webhook signature | **P1** | ❌ Not implemented | Anyone can POST fake webhook |
| **1.1** `admin_billing_config.py` no auth | **P1** | ❌ Missing | Anyone can change plan prices |
| **1.1** `admin_credits.py` no auth | **P1** | ❌ Missing | Anyone can top up credits |
| **1.1** `admin_subscriptions.py` no auth | **P1** | ❌ Missing | Anyone can activate subscriptions |
| **1.1** `payment_hub.py` double activation | **P1** | ❌ Bug | `activate_subscription_after_payment` called twice |
| **1.5** Three subscription tables | **P2** | ⚠️ Design debt | `Subscription` vs `TenantSubscription` can diverge |
| **1.4** No proration on upgrade/downgrade | **P2** | ⚠️ Design choice | Clock resets to +30 days on every change |
| **1.4** No dunning on failed payment | **P2** | ❌ Missing | Failed payment doesn't change subscription status |
| **1.4** No runtime enforcement of subscription status | **P2** | ❌ Missing | Canceled tenants can still use all APIs |
| **2.3** Feature gating only in marketplace | **P2** | ⚠️ Partial | Other endpoints not gated |
| **2.4** Feature flags not reset on template switch | **P3** | ⚠️ Minor | Old flags persist if new template doesn't include them |
| **2.5** No in-app storefront indication of failures | **P3** | ⚠️ UX gap | Email-only notification |
