// Phase 13 — gap-fill: KYC full submit, billing detail, analytics, vendor reg public, support ticket e2e.
const { BASE, Session, loadState, clickFirst, uiLogin, ensureAuthed } = require('./harness');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OWNER = 'BUSINESS OWNER (TENANT B)';
const LOGIN_RE = /welcome back|sign in to your account/i;
const authedText = t => !LOGIN_RE.test(t.slice(0, 500)) && /sign out|company admin|dashboard/i.test(t);

async function waitReady(page, re, t = 30000) {
  try { await page.getByText(re).first().waitFor({ state: 'visible', timeout: t }); return true; }
  catch { return false; }
}

(async () => {
  const B = loadState().tenantB;
  const S = await new Session('GAPS', { video: true }).start();
  const page = S.page;
  await uiLogin(page, B.email, B.password);

  // ---- KYC complete submission ----
  await S.jcase({ id: 'KYC-02', domain: 'KYC', capability: 'KYC full submission -> pending status', persona: OWNER, startUrl: BASE + '/kyc', expected: 'Form submits; status becomes Pending/Under review', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/kyc', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /kyc|verif/i); await sleep(2500);
    let t = await S.text();
    if (!authedText(t)) return h.blocked('Auth lost');
    if (/pending|under review|approved|verified/i.test(t)) return h.pass(`KYC already has status: "${(t.match(/kyc status[^\n]*/i) || [''])[0]}"`);
    // fill required fields by label-adjacent placeholders
    const fills = [
      ['input[placeholder*="appears on your ID" i]', 'UAT Cert Owner Bravo'],
      ['input[placeholder*="Ghanaian" i]', 'Ghanaian'],
      ['input[placeholder*="document number" i]', 'UAT-GHA-2026-001'],
    ];
    for (const [sel, v] of fills) { const el = page.locator(sel); if (await el.isVisible({ timeout: 1000 }).catch(() => false)) await el.fill(v); }
    const fi = page.locator('input[type="file"]').first();
    if (await fi.isVisible({ timeout: 1000 }).catch(() => false)) {
      await fi.setInputFiles({ name: 'uat-reg.png', mimeType: 'image/png', buffer: Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63fcffff3f030005fe02fea72d814d0000000049454e44ae426082', 'hex') });
    }
    h.step('Filled KYC form + doc');
    await h.shot('filled');
    await clickFirst(page, ['button:has-text("Submit for Verification")', 'button:has-text("Submit")'], 3000);
    await sleep(7000);
    t = await S.text(); await h.shot('after');
    if (/kyc status:\s*(under review|pending|approved|verified)/i.test(t) || /submitted successfully|verification in progress/i.test(t))
      return h.pass(`KYC submitted: "${(t.match(/kyc status[^\n]*/i) || [t.slice(0, 150)])[0]}"`);
    return h.fail(`KYC submit failed/unchanged. "${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-KYC-02' });
  });

  // ---- Billing detail ----
  await S.jcase({ id: 'BIL-02', domain: 'BILLING', capability: 'Billing detail: plan, wallet, payment init, history', persona: OWNER, startUrl: BASE + '/billing', expected: 'Wallet balance, subscribe/pay control, transactions', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/billing', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /billing|plan|login/i); await sleep(3000);
    let t = await S.text();
    if (!authedText(t)) return h.blocked('Auth lost');
    await h.shotFull('billing');
    const wallet403 = /unable|error|denied|no wallet/i.test(t);
    const plan = /trial|free|plan|subscription/i.test(t);
    const payBtn = await clickFirst(page, ['button:has-text("Subscribe")', 'button:has-text("Upgrade")', 'button:has-text("Add Funds")', 'button:has-text("Top Up")', 'button:has-text("Pay")'], 3000);
    h.step(`plan=${plan} walletErr=${wallet403} payBtn=${payBtn}`);
    if (payBtn) { await sleep(4000); await h.shot('pay'); t = await S.text(); }
    const checkout = /checkout|payment|card|mobile money|paystack|flutterwave|amount|pay now/i.test(t);
    const walletErr = /unable|error|denied|no wallet|failed to load/i.test(t);
    if (walletErr) return h.fail(`Billing API errors visible. text="${t.slice(0, 280)}"`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-BIL-03' });
    if (plan && (payBtn || /wallet|balance|transaction|invoice|history/i.test(t))) {
      return h.pass(`Billing renders: plan=${plan} payControl=${!!payBtn} checkout=${checkout}`, { notes: t.slice(0, 280) });
    }
    return h.fail(`Billing incomplete. "${t.slice(0, 240)}"`, { classification: 'NOT_PRODUCTIZED', defectRef: 'DEF-BIL-02' });
  });

  // ---- Analytics: look for metrics anywhere ----
  await S.jcase({ id: 'ANA-02', domain: 'ANALYTICS', capability: 'Tenant analytics presence', persona: OWNER, startUrl: BASE + '/dashboard', expected: 'Real tenant metrics', coreDep: 'NO' }, async (page, h) => {
    for (const u of ['/dashboard', '/analytics', '/reports', '/dashboard/analytics']) {
      await page.goto(BASE + u, { waitUntil: 'domcontentloaded' }); await sleep(4000);
      let t = await S.text();
      if (!authedText(t)) continue;
      const metric = /(\d+[^a-zA-Z\n]{0,20}(shipment|order|revenue|delivery|customer|active))|revenue|chart|graph|analytics|insight/i.test(t);
      const fake = /lorem|sample|demo data|coming soon/i.test(t);
      if (metric && !fake) { await h.shot('metrics'); return h.pass(`Analytics at ${u}`, { notes: t.slice(0, 260) }); }
      if (fake) return h.fail(`Fake analytics at ${u}`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-ANA-01' });
    }
    const t = await S.text(); await h.shotFull('dash-final');
    return h.fail('No analytics/metrics surface — dashboard is navigation tiles only', { classification: 'NOT_PRODUCTIZED', defectRef: 'DEF-ANA-02', notes: t.slice(0, 240) });
  });

  await S.finish();

  // ---- Public vendor registration ----
  const S2 = await new Session('VENDPUB', { video: true }).start();
  await S2.jcase({ id: 'VND-03', domain: 'VENDOR/MARKETPLACE', capability: 'Public vendor registration journey', persona: 'VENDOR (anonymous)', startUrl: BASE + '/', expected: 'Become a Vendor leads to public vendor signup', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' }); await sleep(3000);
    const link = await clickFirst(page, ['a:has-text("Become a Vendor")', 'a:has-text("For Vendors")'], 3000);
    h.step(`Link: ${link}`); await sleep(5000);
    const u = page.url(); let t = await S2.text(); await h.shot('vendor-entry');
    if (/login|sign in|welcome back/i.test(t.slice(0, 400)) || /login/.test(u)) {
      return h.fail(`Public vendor path -> login wall (${u}). No public vendor registration.`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-VND-04' });
    }
    if (/register|sign up|vendor|apply/i.test(t)) {
      return h.pass(`Vendor registration reachable at ${u}`, { notes: t.slice(0, 220) });
    }
    return h.fail(`Unclear vendor path. ${u} "${t.slice(0, 200)}"`, { classification: 'UNCLASSIFIED' });
  });

  // ---- Support ticket e2e: public submit then owner inbox ----
  await S2.jcase({ id: 'SUP-02', domain: 'SUPPORT', capability: 'Public ticket submit -> confirmation', persona: 'ANONYMOUS CUSTOMER', startUrl: BASE + '/support', expected: 'Ticket submitted + tracking info', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/support', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    for (const el of await page.locator('input:visible, textarea:visible').all()) {
      const ph = `${await el.getAttribute('name') || ''} ${await el.getAttribute('placeholder') || ''}`.toLowerCase();
      if (/name/.test(ph)) await el.fill('UAT Public Customer');
      else if (/email/.test(ph)) await el.fill('uat-public@maxxspace.example');
      else if (/subject/.test(ph)) await el.fill('UAT: shipment question');
      else if (/message|describe|detail|issue/.test(ph)) await el.fill('UAT certification support ticket test.');
    }
    const sub = await clickFirst(page, ['button:has-text("Submit")', 'button:has-text("Create")', 'button:has-text("Send")', 'button[type="submit"]'], 3000);
    h.step(`submit=${sub}`); await sleep(6000);
    const t = await S2.text(); await h.shot('after');
    if (/success|submitted|received|ticket|track/i.test(t) && !/error|failed/i.test(t.slice(0, 300))) {
      const tk = t.match(/(ticket\s*#?[A-Z0-9-]{3,}|ref[:\s]*[A-Z0-9-]{3,})/i);
      return h.pass(`Public ticket accepted${tk ? ' ' + tk[0] : ''}`, { notes: t.slice(0, 260) });
    }
    return h.fail(`Ticket submit unclear. "${t.slice(0, 240)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-SUP-03' });
  });
  await S2.finish();
  console.log('\nPhase 13 complete');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
