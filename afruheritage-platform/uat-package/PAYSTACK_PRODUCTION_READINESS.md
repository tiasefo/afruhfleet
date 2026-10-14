# Afruheritage — Paystack Production-Readiness Checklist

Scope: converting the **sandbox-certified** Paystack integration into a
production-chargeable one. Paystack is the approved launch gateway;
Flutterwave remains disabled (`FLUTTERWAVE_ENABLED` unset/false) until its
own certification completes.

Every item is Ops-side. Do **not** enable production billing until all
items are checked off and a live-payment smoke test is approved by the PO.

## 1. Credentials

- [ ] Create production keys in the Paystack dashboard (live `pk_live_*`,
      `sk_live_*`).
- [ ] Store `PAYSTACK_PUBLIC_KEY`, `PAYSTACK_SECRET_KEY`,
      `PAYSTACK_WEBHOOK_SECRET` through the approved secrets mechanism
      (`.env` on the deploy host — never committed).
- [ ] Rotate: sandbox keys currently in `.env` are test keys; replace —
      do not reuse any sandbox value in production.
- [ ] Restrict the live secret key to this deployment only; do not share
      with developer machines or CI.

## 2. Webhook configuration

- [ ] In the Paystack dashboard, register the webhook endpoint:
      `https://api.afruheritage.com/api/v1/payments/webhook/paystack`
- [ ] Subscribe to `charge.success` and `charge.failed` (minimum set).
- [ ] Set `PAYSTACK_WEBHOOK_SECRET` to the same value used for signature
      verification (server verifies `x-paystack-signature` HMAC-SHA512 of
      the raw body; forged/missing signatures already return 401 — p32).
- [ ] Send the dashboard "test webhook" and confirm a `200` with
      `{"status":"ignored"}` (unknown reference is handled gracefully).

## 3. Post-deploy verification (sandbox path already proven)

- [ ] Initialize a real low-value charge → confirm
      `checkout.paystack.com` authorization URL (works in sandbox).
- [ ] Complete one real charge (PO-authorized amount) → webhook →
      `COMPLETED` in `billing_payments`, entitlement applied, wallet
      credit posted **once** (duplicate webhook is idempotent — p32).
- [ ] Failed charge → payment stays `UNPAID`/`failed`, zero credits
      (verified: `no credits granted for unpaid payments`).
- [ ] Cross-tenant verify → 403 (verified p32).
- [ ] Reconciliation: `billing_payments` ↔ `billing_wallet_transactions`
      1:1 by reference; spot-check after first real charges.

## 4. Disclosures and supported behavior

- [ ] **Manual renewal model**: subscriptions renew via explicit payment;
      there is NO automatic recurring billing. Plan expiry requires the
      customer to re-initiate payment. This must be stated on the billing
      page before paid launch.
- [ ] **Refund & dispute procedure (manual until productized)**:
      1. Customer disputes a charge → support ticket (D-04 channel).
      2. Ops verifies the payment in `billing_payments` by reference and
         in the Paystack dashboard.
      3. Refund executed manually in the Paystack dashboard; Ops records
         the refund in Sentinel (`payments` admin + audit trail) and
         adjusts the wallet/entitlement manually where needed.
      4. Legally required refunds are never denied on the basis that
         "refunds are unsupported" — unsupported refers to *automated*
         processing only.
      - [ ] Publish a customer-facing refund/dispute statement on the
            billing page linking to the support channel.
- [ ] **Customer-facing renewal disclosure**: the billing page must state
      that subscriptions do NOT auto-renew — renewal is a manual payment
      — before any paid plan is sold.
- [ ] Failed-payment behavior: checkout abandonment leaves the payment
      `UNPAID`; the customer can re-initiate from Billing. No automatic
      retry or dunning email exists — flag to PO if required for launch.
- [ ] Currency: GHS (Paystack). Other currencies require provider
      support review before advertising.

## 5. Operational

- [ ] Payment webhook failures are logged (`payments` route) — add an
      ops alert on repeated 5xx on `/payments/webhook/*`.
- [ ] Provider outages surface as controlled 502 "Payment gateway error"
      to the customer — no partial entitlement state (verified).
- [ ] Keep `FLUTTERWAVE_ENABLED=false` (or unset) until P2 certification.
      With it disabled, `payment_provider=flutterwave` returns a clean
      400; unknown providers are also rejected (400).
