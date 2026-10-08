// Phase 3 — complete onboarding (Freight Company role) + plan selection + billing verify.
const { BASE, Session, loadState, saveState, clickFirst } = require('./harness');
const { chromium } = require('@playwright/test');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OWNER = 'BUSINESS OWNER';

async function card(page, re) {
  // click a card/option containing text (radio-card UIs use divs)
  const loc = page.getByText(re).first();
  try { if (await loc.isVisible({ timeout: 2500 })) { await loc.click(); return true; } } catch {}
  return false;
}
async function proceed(page, res = [/continue/i, /next/i, /finish/i, /get started/i, /done/i, /complete/i]) {
  for (const re of res) {
    const b = page.getByRole('button', { name: re }).first();
    try { if (await b.isVisible({ timeout: 1500 }) && await b.isEnabled()) { await b.click(); return re.toString(); } } catch {}
  }
  return null;
}

(async () => {
  const st = loadState();
  const A = st.tenantA;
  const S = await new Session('ONB', { video: true }).start();
  const page = S.page;

  // ---- ONB-01 complete role/profile onboarding ----
  await S.jcase({ id: 'ONB-01', domain: 'TENANT', capability: 'Onboarding: select Freight Company role and complete wizard', persona: OWNER, startUrl: BASE + '/login', expected: 'Role selected, profile completed, wizard finishes to workspace or plan step', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' }); await sleep(1200);
    await page.locator('input[name="email"]').fill(A.email);
    await page.locator('input[name="password"]').fill(A.password);
    await page.getByRole('button', { name: /sign in/i }).first().click();
    for (let i = 0; i < 14; i++) { await sleep(1500); if (!page.url().includes('/login')) break; }
    await sleep(2000);
    h.step(`Logged in -> ${page.url()}`);
    await h.shot('after-login');

    for (let i = 0; i < 8; i++) {
      const t = await S.text(); const u = page.url();
      console.log(`    [wiz ${i}] ${u} :: ${t.slice(0, 200)}`);
      if (!/onboarding/.test(u)) break;
      if (/freight company/i.test(t)) {
        const picked = await card(page, /freight company/i);
        if (picked) { h.step('Selected Freight Company'); await sleep(800); }
      }
      // fill any visible profile inputs
      const inputs = await page.locator('input:visible').all();
      for (const el of inputs) {
        const nm = (((await el.getAttribute('name')) || '') + ' ' + ((await el.getAttribute('placeholder')) || '') + ' ' + ((await el.getAttribute('id')) || '')).toLowerCase();
        if (/company|business|org/.test(nm)) { /* company fields handled below */ }
        else if (/name|contact/.test(nm)) { try { await el.fill(A.ownerName || 'UAT Cert Owner Alpha'); h.step(`Filled ${nm}`); } catch {} }
        else if (/company|business/.test(nm)) { try { await el.fill(A.company || 'UATCERT Meridian Freight'); h.step(`Filled ${nm}`); } catch {} }
        else if (/phone|whatsapp/.test(nm)) { try { await el.fill('+233550001234'); h.step(`Filled ${nm}`); } catch {} }
        else if (/country/.test(nm)) { try { await el.fill('Ghana'); h.step(`Filled ${nm}`); } catch {} }
        else if (/city/.test(nm)) { try { await el.fill('Accra'); h.step(`Filled ${nm}`); } catch {} }
        else if (/address/.test(nm)) { try { await el.fill('12 UAT Cert Avenue, Accra'); h.step(`Filled ${nm}`); } catch {} }
        else if (/website/.test(nm)) { try { await el.fill('https://meridian-uat.example.com'); h.step(`Filled ${nm}`); } catch {} }
      }
      // selects (country dropdowns etc.)
      const selects = await page.locator('select:visible').all();
      for (const sel of selects) {
        try {
          const opts = await sel.locator('option').allTextContents();
          const gh = opts.findIndex(o => /ghana/i.test(o));
          if (gh >= 0) { await sel.selectOption({ index: gh }); h.step('Selected Ghana in dropdown'); }
          else if (opts.length > 1) { await sel.selectOption({ index: 1 }); h.step(`Selected option ${opts[1]}`); }
        } catch {}
      }
      const clicked = await proceed(page);
      if (!clicked) { h.step('No proceed control found'); break; }
      h.step(`Clicked ${clicked}`);
      await sleep(2500);
      // plan chooser modal?
      const t2 = await S.text();
      if (/choose your plan|free trial/i.test(t2)) {
        h.step('Plan chooser appeared');
        const ft = await card(page, /free trial/i);
        if (ft) { h.step('Selected Free Trial (14 days)'); await sleep(600); }
        const c = await proceed(page, [/continue/i, /confirm/i, /start/i]);
        if (c) { h.step(`Clicked ${c}`); await sleep(3000); }
      }
      if (/dashboard|billing|workspace/.test(page.url()) || /payment|checkout/.test(page.url())) break;
    }
    const u = page.url(); const t = await S.text();
    await h.shot('final');
    saveState({ tenantA: { ...loadState().tenantA, postOnboardingUrl: u } });
    if (!/onboarding/.test(u)) return h.pass(`Onboarding completed -> ${u}`, { notes: t.slice(0, 300) });
    if (/done|complete|finish/i.test(t) && /dashboard/i.test(t)) return h.pass(`Onboarding reached completion screen`, { notes: t.slice(0, 300) });
    return h.fail(`Onboarding did not finish. url=${u} text="${t.slice(0, 300)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-ONB-01' });
  });

  // ---- SUB-01 subscription/billing state after onboarding ----
  await S.jcase({ id: 'SUB-01', domain: 'BILLING', capability: 'Subscription/billing shows plan and status', persona: OWNER, startUrl: BASE + '/billing', expected: 'Plan, status and renewal visible; workspace enabled', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/billing', { waitUntil: 'domcontentloaded' });
    await sleep(6000); // billing loads async data — wait like a user watching the page
    const t = await S.text(); const u = page.url();
    await h.shotFull('billing');
    h.step(`Billing page: ${u}`);
    if (/login/.test(u)) return h.blocked('Redirected to login');
    const hasPlan = /(free trial|starter|growth|enterprise|plan)/i.test(t);
    const hasStatus = /(active|trialing|trial|renews|expires|cancel)/i.test(t);
    const spinnerOnly = /^\s*(back|open chat)*\s*$/i.test(t.replace(/UATCERT Meridian.*|Home Dashboard.*Vendors.*Profile.*|UAT Cert Owner.*Personal Shipper Sign out/gi, ''));
    if (hasPlan && hasStatus) return h.pass(`Billing shows plan/status: "${t.slice(0, 300)}"`);
    if (spinnerOnly || t.length < 200) return h.fail(`Billing page stuck loading or empty. text="${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-BILL-01' });
    return h.fail(`Billing lacks plan/status info. text="${t.slice(0, 350)}"`, { classification: 'UI_DEFECT', defectRef: 'DEF-BILL-02' });
  });

  // ---- DOM-01 tenant subdomain ----
  await S.jcase({ id: 'DOM-01', domain: 'TENANT', capability: 'Tenant subdomain resolves to business workspace', persona: OWNER, startUrl: 'https://uatcert-meridian-freight-1.afruheritage.com', expected: 'Tenant subdomain serves the business workspace/identity', coreDep: 'YES' }, async (page, h) => {
    try {
      const resp = await page.goto('https://uatcert-meridian-freight-1.afruheritage.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await sleep(4000);
      const u = page.url(); const t = await S.text();
      await h.shot('subdomain');
      h.step(`Visited tenant subdomain -> ${u} (HTTP ${resp && resp.status()})`);
      const biz = /meridian|uatcert/i.test(t) || /dashboard|login|sign in/i.test(t);
      if (resp && resp.status() < 400 && biz) return h.pass(`Tenant subdomain resolves: ${u}. Business context: ${/meridian/i.test(t)}`, { notes: t.slice(0, 250) });
      return h.fail(`Subdomain HTTP ${resp && resp.status()}, url=${u} text="${t.slice(0, 250)}"`, { classification: 'CONFIGURATION_DEFECT', defectRef: 'DEF-DOM-01' });
    } catch (e) {
      await h.shot('subdomain-error');
      return h.fail(`Tenant subdomain unreachable: ${e.message.slice(0, 200)}`, { classification: 'CONFIGURATION_DEFECT', defectRef: 'DEF-DOM-01' });
    }
  });

  await S.finish();
  console.log('\nPhase 3 complete');
})().catch(async e => { console.error('FATAL', e); process.exit(1); });
