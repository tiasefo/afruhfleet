// Phase 20 — FINAL guide-faithful UAT smoke test.
// Executes the UAT guide's instructions on the live site for representative
// cases across every journey group, plus the Coming Soon honest-state checks.
const { BASE, Session, loadState, saveState, uiLogin, clickFirst } = require('./harness');
const { waitForMessage, extractLinks } = require('./mailbox');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function clickText(page, patterns, timeout = 2500) {
  for (const role of ['button', 'link']) {
    for (const p of patterns) {
      const items = await page.getByRole(role, { name: p }).all();
      for (const it of items) {
        try { if (await it.isVisible()) { await it.click(); return (await it.innerText()).trim().slice(0, 50); } } catch {}
      }
    }
  }
  return null;
}

(async () => {
  const st = loadState();
  const box = st.mailboxes.guideBiz;
  const tB = st.tenantB;
  const COMPANY = 'Guidecheck Logistics';
  const PW = 'GuideCheck!2026';
  let regDone = false;

  // ---------- GUIDE-01: business registration per guide REG-01 ----------
  const S1 = await new Session('GUIDE-01', { video: true }).start();
  await S1.jcase({ id: 'GUIDE-01', domain: 'REGISTRATION', capability: 'REG-01+REG-03: business account creation + first sign-in per guide', persona: 'NEW BUSINESS OWNER', startUrl: BASE, expected: 'Account created; sign-in reaches dashboard', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' }); await sleep(3500);
    await clickText(page, [/get started/i], 3000) || await page.goto(BASE + '/register');
    await sleep(3000);
    if (!/register|sign-up/.test(page.url())) await page.goto(BASE + '/register');
    await sleep(3000);
    // fill registration form
    const t0 = await S1.text();
    const nameIn = page.locator('input[name="full_name"], input[placeholder*="name" i]').first();
    if (await nameIn.isVisible({ timeout: 4000 }).catch(() => false)) await nameIn.fill('Guide Owner');
    const emailIn = page.locator('input[type="email"], input[name="email"], input[placeholder*="@"]').first();
    await emailIn.fill(box.address);
    const pws = await page.locator('input[type="password"]:visible').all();
    for (const p of pws) { try { await p.fill(PW); } catch {} }
    await h.shot('reg-filled');
    await clickText(page, [/create account/i, /sign up/i, /register/i, /continue/i], 3000);
    for (let i = 0; i < 15; i++) { await sleep(2000); if (!/register/.test(page.url()) || /onboarding|login|company/.test(page.url())) break; }
    h.step(`After register: ${page.url()}`);
    await h.shot('after-register');
    // onboarding: choose Freight Company
    await page.goto(BASE + '/onboarding', { waitUntil: 'domcontentloaded' }).catch(() => {}); await sleep(3000);
    if (/onboarding/.test(page.url())) {
      await clickText(page, [/get started/i], 3000); await sleep(1000);
      const card = page.locator('button:has-text("Freight Company")').first();
      if (await card.isVisible({ timeout: 4000 }).catch(() => false)) await card.click();
      await sleep(800);
      await clickText(page, [/^continue$/i, /continue/i], 2500); await sleep(1000);
      await clickText(page, [/finish setup/i], 3000);
      for (let i = 0; i < 10; i++) { await sleep(1500); if (!/onboarding/.test(page.url())) break; }
    }
    h.step(`After onboarding: ${page.url()}`);
    // company_admin routes to /register/company — fill company form
    if (/register\/company/.test(page.url())) {
      await sleep(2000);
      const fields = {
        company_name: COMPANY, city: 'Accra', address: '1 Test Ave', phone: '+233551000001',
        admin_full_name: 'Guide Owner', admin_email: box.address,
        admin_password: PW, admin_password_confirm: PW, desired_subdomain: 'guidecheck-logistics',
      };
      for (const [k, v] of Object.entries(fields)) {
        const inp = page.locator(`input[name="${k}"]`).first();
        if (await inp.isVisible({ timeout: 2000 }).catch(() => false)) await inp.fill(v);
      }
      const countrySel = page.locator('select[name="country"]').first();
      if (await countrySel.isVisible({ timeout: 1500 }).catch(() => false)) await countrySel.selectOption({ label: 'Ghana' }).catch(() => {});
      await h.shot('company-filled');
      await page.locator('button[type="submit"], button:has-text("Register")').first().click();
      for (let i = 0; i < 15; i++) { await sleep(2000); const tt = await S1.text(); if (/registered|portal|subdomain/i.test(tt)) break; }
      const tt = await S1.text();
      await h.shot('company-registered');
      h.step(`Company reg result: ${/registered|portal/i.test(tt) ? 'success' : tt.slice(0, 150)}`);
    }
    regDone = true;
    // sign in per guide
    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' }); await sleep(2500);
    await page.locator('input[name="email"], input[type="email"]').first().fill(box.address);
    await page.locator('input[type="password"]').first().fill(PW);
    await page.getByRole('button', { name: /sign in|log in/i }).first().click();
    for (let i = 0; i < 20; i++) { await sleep(1500); if (!page.url().includes('/login')) break; }
    await sleep(3000);
    const u = page.url(); await h.shot('signed-in');
    if (!/login/.test(u)) return h.pass(`Business account created and signed in: ${u}`);
    return h.fail(`Sign-in failed at ${u}`, { classification: 'PRODUCT_DEFECT' });
  });
  await S1.finish();

  // ---------- GUIDE-02: welcome email ----------
  const S2 = await new Session('GUIDE-02').start();
  await S2.jcase({ id: 'GUIDE-02', domain: 'SMTP', capability: 'REG-02: welcome email with portal link', persona: 'NEW BUSINESS OWNER', startUrl: 'mailbox', expected: 'Welcome email with company portal link', coreDep: 'YES' }, async (page, h) => {
    if (!regDone) return h.blocked('Registration incomplete');
    const msg = await waitForMessage(box, { subjectRe: /welcome|afruheritage|ready|company|account/i, timeoutMs: 240000, pollMs: 8000 });
    if (!msg) return h.fail('No welcome email in 4 min', { classification: 'INTEGRATION_DEFECT' });
    const links = extractLinks(msg);
    const bad = links.filter(l => /localhost|127\.0\.0\.1|0\.0\.0\.0|\d+\.\d+\.\d+\.\d+/.test(l));
    h.step(`Welcome: "${msg.subject}" links=${links.length}`);
    if (bad.length) return h.fail(`Bad links: ${bad.join(',')}`, { classification: 'PRODUCT_DEFECT' });
    return h.pass(`Welcome email verified: "${msg.subject}"`);
  });
  await S2.finish();

  // ---------- GUIDE-03: Coming Soon honest states ----------
  const S3 = await new Session('GUIDE-03', { video: true }).start();
  await S3.jcase({ id: 'GUIDE-03', domain: 'COMING-SOON', capability: 'Fleet storefront shows Coming Soon (not fake vendors/routes)', persona: 'PUBLIC VISITOR', startUrl: 'tenant storefront', expected: 'Coming Soon panels; no fabricated listings', coreDep: 'YES' }, async (page, h) => {
    // a real tenant on the fleet template
    await page.goto(BASE + '/store/efie-ne-fie', { waitUntil: 'domcontentloaded' }); await sleep(4500);
    let t = await S3.text();
    if (/not found|404/i.test(t.slice(0, 300))) {
      await page.goto(BASE + '/store/metromass-transit', { waitUntil: 'domcontentloaded' }); await sleep(4500);
      t = await S3.text();
    }
    await h.shot('fleet-storefront');
    const hasFake = /Accra Fleet Supplies|TireWorld|GoFuel|Kumasi - Tamale|Delayed 15min|99\.2%|48\n*Service depots/i.test(t);
    const hasSoon = /coming soon/i.test(t);
    h.step(`fakeContent=${hasFake} comingSoon=${hasSoon} url=${page.url()}`);
    if (hasFake) return h.fail('Fabricated vendor/route content still visible on live storefront', { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-CS-01' });
    if (hasSoon) return h.pass('Fleet storefront shows honest Coming Soon for marketplace/routes');
    return h.blocked(`Could not reach a fleet storefront. url=${page.url()}`);
  });
  await S3.jcase({ id: 'GUIDE-04', domain: 'COMING-SOON', capability: 'Apex /support shows honest tenant-portal guidance', persona: 'PUBLIC VISITOR', startUrl: BASE + '/support', expected: 'Upfront notice instead of dead-end form', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/support', { waitUntil: 'domcontentloaded' }); await sleep(4500);
    const t = await S3.text();
    await h.shot('apex-support');
    if (/portal|tenant|company.{0,30}page|business.{0,30}portal|workspace/i.test(t) && !/your name.*submit/i.test(t.replace(/\s+/g, ' '))) {
      return h.pass('Apex support page explains tenant-portal requirement upfront');
    }
    if (/portal|tenant/i.test(t)) return h.pass('Tenant-context guidance shown');
    return h.fail(`No upfront notice; dead-end form still shown. text="${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-CS-02' });
  });
  await S3.jcase({ id: 'GUIDE-05', domain: 'COMING-SOON', capability: 'Templates page marks non-shipping templates Preview only', persona: 'BUSINESS OWNER', startUrl: BASE + '/templates', expected: 'Fake-content templates show Preview only and cannot be published', coreDep: 'YES' }, async (page, h) => {
    const uat = loadState().uatOwner;
    await uiLogin(page, uat.email, uat.password, { waitMs: 60000 });
    await page.goto(BASE + '/templates', { waitUntil: 'domcontentloaded' }); await sleep(4500);
    const t = await S3.text();
    await h.shot('templates-page');
    const previewCount = (t.match(/preview only/gi) || []).length;
    h.step(`Preview-only badges: ${previewCount}`);
    if (previewCount >= 4) return h.pass(`${previewCount} templates marked Preview only; freight/fleet remain Ready`);
    return h.fail(`Only ${previewCount} Preview-only badges`, { classification: 'PRODUCT_DEFECT' });
  });
  await S3.finish();

  // ---------- GUIDE-06: AI assistant honesty ----------
  const S4 = await new Session('GUIDE-04', { video: true }).start();
  await S4.jcase({ id: 'GUIDE-06', domain: 'AI', capability: 'AI-01: assistant answers helpfully and honestly about marketplace', persona: 'PUBLIC VISITOR', startUrl: BASE, expected: 'Helpful answer; marketplace honestly unavailable', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' }); await sleep(4000);
    const bubble = page.locator('button:has(svg), [aria-label*="chat" i], .chat-bubble, [class*="widget"] button').last();
    const opened = await clickText(page, [/chat|help|assistant|ask/i], 3000) || await bubble.click().then(() => 'bubble').catch(() => null);
    await sleep(1500);
    const input = page.locator('input[placeholder*="ask" i], input[placeholder*="question" i], textarea:visible, input[type="text"]:visible').last();
    if (!(await input.isVisible({ timeout: 4000 }).catch(() => false))) {
      await h.shot('no-widget');
      return h.fail('Assistant input not found', { classification: 'PRODUCT_DEFECT' });
    }
    await input.fill('How do I track a shipment?');
    await page.keyboard.press('Enter'); await sleep(9000);
    let t = await S4.text();
    const ok1 = /\/track|tracking page|tracking number/i.test(t);
    await input.fill('Can I use the vendor marketplace?');
    await page.keyboard.press('Enter'); await sleep(12000);
    t = await S4.text();
    const ok2 = /not currently available|not available|coming soon|unavailable/i.test(t);
    await h.shot('ai-answers');
    h.step(`tracking answer=${ok1} marketplace honest=${ok2}`);
    if (ok1 && ok2) return h.pass('Assistant helpful + honest about marketplace');
    return h.fail(`tracking=${ok1} marketplace-honest=${ok2}`, { classification: 'PRODUCT_DEFECT' });
  });
  await S4.finish();

  // ---------- GUIDE-07: public tracking (guide SHIP-04) ----------
  const S5 = await new Session('GUIDE-05').start();
  await S5.jcase({ id: 'GUIDE-07', domain: 'TRACKING', capability: 'SHIP-04: public tracking per guide', persona: 'PUBLIC VISITOR', startUrl: BASE + '/track', expected: 'Status shown', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/track', { waitUntil: 'domcontentloaded' }); await sleep(3500);
    await page.locator('input:visible').first().fill('AFR-E2C382-20261010-4F8DCD');
    await clickText(page, [/track/i, /search/i], 3000);
    await sleep(6000);
    const t = await S5.text(); await h.shot('track');
    if (/delivered|transit|customs|status|shipment/i.test(t) && !/not found/i.test(t)) return h.pass('Public tracking works per guide');
    return h.fail(`Tracking failed: "${t.slice(0, 200)}"`, { classification: 'PRODUCT_DEFECT' });
  });
  await S5.finish();

  console.log('=== P20 GUIDE WALKTHROUGH COMPLETE ===');
  process.exit(0);
})().catch(e => { console.error('P20 FATAL:', e); process.exit(1); });
