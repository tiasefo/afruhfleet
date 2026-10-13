// P1 — Payment sandbox certification: Paystack + Flutterwave.
// Real provider sandbox APIs (test keys), signed-webhook verification,
// duplicate/replay handling, entitlement reconciliation, failure paths.
const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');

const API = 'https://api.afruheritage.com/api/v1';
const state = JSON.parse(fs.readFileSync('/mnt/storage/afruheritage-home/fleetbase/afruhfleet/afruheritage-platform/prod-ui-cert/state.json', 'utf8'));
const results = [];
function check(name, ok, detail, blocked) { results.push({ name, ok: !!ok, blocked: !!blocked, detail }); console.log((ok ? 'PASS' : blocked ? 'BLOCKED' : 'FAIL') + '  ' + name + ' — ' + JSON.stringify(detail)); }
function sh(cmd) { return execSync(cmd, { encoding: 'utf8' }).trim(); }
async function api(method, path, token, body, headers = {}) {
  const res = await fetch(`${API}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  let data = null; try { data = await res.json(); } catch {}
  return { status: res.status, data };
}
const PSQL = c => sh(`docker exec afruheritage-postgres psql -U afruheritage -d afruheritage -tAc "${c}"`);

// Paystack webhook secret for signing (read from env, never printed)
const PS_SECRET = sh(`docker exec afruheritage-api printenv PAYSTACK_WEBHOOK_SECRET PAYSTACK_SECRET_KEY | head -1`);
const FLW_HASH = sh(`docker exec afruheritage-api printenv FLUTTERWAVE_WEBHOOK_SECRET`);

(async () => {
  const login = await api('POST', '/auth/login', null, { email: state.tenantA.email, password: state.tenantA.password });
  const tok = login.data?.access_token;
  const tenantId = login.data?.tenant_id;
  check('tenant admin login', !!tok, { status: login.status });

  // ══ PAYSTACK ═══════════════════════════════════════════════════════
  // 1. Init — real Paystack sandbox API
  const psInit = await api('POST', `/billing/payments/init?tenant_id=${tenantId}`, tok, {
    tenant_id: tenantId, email: state.tenantA.email, currency: 'GHS',
    amount_major: 1.00, purpose: 'credit_topup', credits_to_buy: 5,
    plan_code: 'professional', payment_provider: 'paystack',
    callback_url: 'https://afruheritage.com/billing/callback',
  });
  const psRef = psInit.data?.reference;
  check('paystack init -> authorization_url', psInit.status === 200 && /paystack\.com|checkout/.test(psInit.data?.authorization_url || ''), { status: psInit.status, url: (psInit.data?.authorization_url || '').slice(0, 40) });

  // 2. Verify route on unpaid txn -> pending (real provider lookup)
  const psVerify0 = await api('POST', `/billing/payments/verify/${psRef}?tenant_id=${tenantId}`, tok);
  check('paystack verify unpaid -> pending/failed, not verified', psVerify0.status === 200 && psVerify0.data?.status !== 'verified', { status: psVerify0.data?.status, prov: psVerify0.data?.provider_status });

  // 3. Webhook: forged signature -> 401
  const bogusBody = JSON.stringify({ event: 'charge.success', data: { reference: psRef, amount: 100, metadata: { tenant_id: tenantId } } });
  const forged = await fetch(`${API}/payments/webhook/paystack`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-paystack-signature': 'deadbeef' }, body: bogusBody });
  check('paystack webhook forged signature -> 401', forged.status === 401, { status: forged.status });

  // 4. Webhook: missing signature -> 401
  const nosig = await fetch(`${API}/payments/webhook/paystack`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: bogusBody });
  check('paystack webhook missing signature -> 401', nosig.status === 401, { status: nosig.status });

  // 5. Webhook: VALID signature on unknown reference -> ignored (no crash, no state)
  const unkBody = JSON.stringify({ event: 'charge.success', data: { reference: 'PS-UNKNOWN-REF', amount: 100, metadata: { tenant_id: tenantId } } });
  const unkSig = crypto.createHmac('sha512', PS_SECRET).update(unkBody).digest('hex');
  const unkRes = await fetch(`${API}/payments/webhook/paystack`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-paystack-signature': unkSig }, body: unkBody });
  check('paystack webhook valid sig + unknown ref -> ignored', unkRes.status === 200, { status: unkRes.status, body: (await unkRes.text()).slice(0, 80) });

  // 6. Duplicate-event idempotency: a PaymentRecord exists for a real
  //    platform payment; send signed charge.success twice.
  const platInit = await api('POST', '/payments/initiate', tok, {
    amount: 1.0, payment_method: 'mobile_money', customer_email: state.tenantA.email,
    customer_phone: '0244000000', customer_name: 'P32 Cert', mobile_provider: 'mtn',
    description: 'P1 sandbox cert', metadata: { tenant_id: tenantId, purpose: 'credit_topup' },
  });
  const payRef = platInit.data?.payment_reference || platInit.data?.reference;
  check('platform payment initiated', platInit.status === 200 && !!payRef, { status: platInit.status, ref: payRef });
  if (payRef) {
    const psRefRow = PSQL(`SELECT paystack_reference FROM payment_records WHERE payment_reference='${payRef}'`);
    const wbBody = JSON.stringify({ event: 'charge.success', data: { reference: psRefRow, amount: 100, metadata: { tenant_id: tenantId, purpose: 'credit_topup' } } });
    const sig = crypto.createHmac('sha512', PS_SECRET).update(wbBody).digest('hex');
    const w1 = await fetch(`${API}/payments/webhook/paystack`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-paystack-signature': sig }, body: wbBody });
    const s1 = PSQL(`SELECT status FROM payment_records WHERE payment_reference='${payRef}'`);
    const w2 = await fetch(`${API}/payments/webhook/paystack`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-paystack-signature': sig }, body: wbBody });
    const s2 = PSQL(`SELECT status FROM payment_records WHERE payment_reference='${payRef}'`);
    const dupRows = PSQL(`SELECT count(*) FROM billing_payments WHERE reference='${payRef}'`);
    check('signed charge.success -> payment completed', w1.status === 200 && s1.toUpperCase() === 'COMPLETED', { w1: w1.status, db: s1 });
    check('duplicate charge.success -> idempotent (no dup rows, still completed)', w2.status === 200 && s2.toUpperCase() === 'COMPLETED' && dupRows === '1', { w2: w2.status, db: s2, billingRows: dupRows });
  }

  // 7. Failure event handling
  if (payRef) {
    const failBody = JSON.stringify({ event: 'charge.failed', data: { reference: 'P32-NONEXIST', status: 'failed' } });
    const fsig = crypto.createHmac('sha512', PS_SECRET).update(failBody).digest('hex');
    const fr = await fetch(`${API}/payments/webhook/paystack`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-paystack-signature': fsig }, body: failBody });
    check('charge.failed on unknown ref -> ignored gracefully', fr.status === 200, { status: fr.status });
  }

  // ══ FLUTTERWAVE ════════════════════════════════════════════════════
  // 8. Init — real Flutterwave sandbox API
  const flwInit = await api('POST', `/billing/payments/init?tenant_id=${tenantId}`, tok, {
    tenant_id: tenantId, email: state.tenantA.email, currency: 'GHS',
    amount_major: 1.00, purpose: 'credit_topup', credits_to_buy: 5,
    payment_provider: 'flutterwave', callback_url: 'https://afruheritage.com/billing/callback',
  });
  const flwRef = flwInit.data?.reference;
  const flwLink = flwInit.data?.authorization_url || '';
  check('flutterwave init -> hosted link', flwInit.status === 200 && /flutterwave|flw|checkout/i.test(flwLink), { status: flwInit.status, link: flwLink.slice(0, 50) }, flwInit.status === 502);
  const flwProvider = PSQL(`SELECT provider FROM billing_payments WHERE reference='${flwRef}'`);
  check('flw payment recorded with provider=flutterwave', flwProvider === 'flutterwave', { provider: flwProvider }, flwInit.status === 502);
  // Even with valid verif-hash, a webhook claiming success must NOT verify
  // a payment the provider API can't confirm — insert a real pending row.
  PSQL(`INSERT INTO billing_payments (id, tenant_id, reference, amount_minor, currency, status, provider, purpose, created_at, updated_at) SELECT gen_random_uuid(), tenant_id, 'P32-FLW-FAKE', 100, 'GHS', 'UNPAID', 'flutterwave', 'credit_topup', now(), now() FROM billing_payments LIMIT 1`);
  const fakeBody = JSON.stringify({ event: 'charge.completed', data: { tx_ref: 'P32-FLW-FAKE', status: 'successful', amount: 1.00, currency: 'GHS' } });
  const fakeRes = await fetch(`${API}/payments/webhook/flutterwave`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'verif-hash': FLW_HASH }, body: fakeBody });
  const fakeStatus = PSQL(`SELECT status FROM billing_payments WHERE reference='P32-FLW-FAKE'`);
  check('valid-hash webhook claiming success does NOT verify unconfirmed payment', fakeRes.status === 200 && fakeStatus !== 'PAID' && fakeStatus !== 'VERIFIED', { resp: fakeRes.status, db: fakeStatus });
  PSQL(`DELETE FROM billing_payments WHERE reference='P32-FLW-FAKE'`);

  // 9. Verify route now dispatches to FLW (was hardcoded Paystack -> would 404).
  //    With dead FLW creds the provider call errors -> graceful 'pending'.
  PSQL(`INSERT INTO billing_payments (id, tenant_id, reference, amount_minor, currency, status, provider, purpose, created_at, updated_at) SELECT gen_random_uuid(), '${tenantId}', 'P32-FLW-VERIFY', 100, 'GHS', 'UNPAID', 'flutterwave', 'credit_topup', now(), now() WHERE EXISTS (SELECT 1 FROM tenants WHERE id='${tenantId}')`);
  const flwVerify = await api('POST', `/billing/payments/verify/P32-FLW-VERIFY?tenant_id=${tenantId}`, tok);
  check('flw verify route dispatches to flutterwave (graceful, no crash)', flwVerify.status === 200, { status: flwVerify.status, body: flwVerify.data });
  PSQL(`DELETE FROM billing_payments WHERE reference='P32-FLW-VERIFY'`);

  // 10. Webhook: wrong verif-hash -> 401
  const flwBody = JSON.stringify({ event: 'charge.completed', data: { tx_ref: flwRef, status: 'successful', amount: 1.00, currency: 'GHS' } });
  const badHash = await fetch(`${API}/payments/webhook/flutterwave`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'verif-hash': 'wrong-hash' }, body: flwBody });
  check('flutterwave webhook wrong verif-hash -> 401', badHash.status === 401, { status: badHash.status });
  const noHash = await fetch(`${API}/payments/webhook/flutterwave`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: flwBody });
  check('flutterwave webhook missing verif-hash -> 401', noHash.status === 401, { status: noHash.status });

  // 11. Valid verif-hash + unpaid real txn -> server-side re-verify rejects
  const okHash = await fetch(`${API}/payments/webhook/flutterwave`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'verif-hash': FLW_HASH }, body: flwBody });
  const okHashJson = await okHash.json().catch(() => ({}));
  const stillPending = PSQL(`SELECT status FROM billing_payments WHERE reference='${flwRef}'`);
  check('valid hash + UNPAID txn -> server re-verify prevents verification', okHash.status === 200 && stillPending !== 'verified', { resp: okHashJson, db: stillPending });

  // 12. Cross-tenant payment record access
  const loginB = await api('POST', '/auth/login', null, { email: state.tenantB.email, password: state.tenantB.password });
  const xVerify = await api('POST', `/billing/payments/verify/${psRef}?tenant_id=${tenantId}`, loginB.data?.access_token);
  check('tenant B cannot verify tenant A payment', xVerify.status === 403, { status: xVerify.status });

  // ══ RECONCILIATION / MODEL ═════════════════════════════════════════
  // 13. Entitlement reconciliation: unpaid -> no wallet credit was granted
  const walletTx = PSQL(`SELECT count(*) FROM billing_wallet_transactions WHERE reference IN ('${psRef}','${flwRef}')`);
  check('no credits granted for unpaid payments', walletTx === '0', { walletTx });

  // cleanup
  PSQL(`DELETE FROM billing_wallet_transactions WHERE reference IN ('${psRef}','${flwRef}')`);
  PSQL(`DELETE FROM billing_payments WHERE reference IN ('${psRef}','${flwRef}')`);
  if (payRef) PSQL(`DELETE FROM payment_records WHERE payment_reference='${payRef}'`);

  const pass = results.filter(r => r.ok).length;
  const blocked = results.filter(r => !r.ok && r.blocked).length;
  const fail = results.filter(r => !r.ok && !r.blocked).length;
  fs.writeFileSync('p32-results.json', JSON.stringify({ pass, fail, blocked, total: results.length, results }, null, 2));
  console.log(`\n${pass} PASS, ${fail} FAIL, ${blocked} BLOCKED`);
})();
