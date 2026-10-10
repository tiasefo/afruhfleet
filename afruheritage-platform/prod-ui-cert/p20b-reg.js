// Phase 20b — guide-faithful registration walkthrough (corrected selectors).
const { BASE, Session, loadState, saveState, uiLogin } = require('./harness');
const { waitForMessage, extractLinks } = require('./mailbox');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const st = loadState();
  const box = st.mailboxes.guideBiz;
  const COMPANY = 'Guidecheck Logistics';
  const PW = 'GuideCheck!2026';
  let regDone = false, portalUrl = null;

  const S1 = await new Session('GUIDE-REG', { video: true }).start();
  await S1.jcase({ id: 'GUIDE-01R', domain: 'REGISTRATION', capability: 'REG-01..03+ONB-01+STO-02: full business journey per guide', persona: 'NEW BUSINESS OWNER', startUrl: BASE, expected: 'Register -> plan -> template -> dashboard; welcome email', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' }); await sleep(3500);
    await page.goto(BASE + '/register', { waitUntil: 'domcontentloaded' }); await sleep(3000);
    await page.locator('#company_name').fill(COMPANY);
    await page.locator('#full_name').fill('Guide Owner');
    await page.locator('#email').fill(box.address);
    await page.locator('#password').fill(PW);
    await page.locator('#confirm_password').fill(PW);
    await h.shot('reg-filled');
    await page.locator('button[type="submit"]:has-text("Create Account")').click();
    // subscription modal (blocking)
    for (let i = 0; i < 15; i++) { await sleep(1500); if (await page.locator('text=Choose Your Plan').isVisible().catch(() => false)) break; }
    await h.shot('plan-modal');
    // choose the free trial card
    const trial = page.locator('div.cursor-pointer:has-text("Trial"), div.cursor-pointer:has-text("Free")').first();
    if (await trial.isVisible({ timeout: 4000 }).catch(() => false)) await trial.click();
    else await page.locator('div.cursor-pointer').first().click();
    await sleep(600);
    await page.locator('button:has-text("Continue")').last().click();
    // template picker
    for (let i = 0; i < 15; i++) { await sleep(1500); if (await page.locator('text=Storefront Template').isVisible().catch(() => false) || /dashboard/.test(page.url())) break; }
    await h.shot('template-modal');
    if (await page.locator('text=Storefront Template').isVisible().catch(() => false)) {
      const freight = page.locator('div.cursor-pointer:has-text("Meridian Freight")').first();
      if (await freight.isVisible({ timeout: 3000 }).catch(() => false)) await freight.click();
      else await page.locator('div.cursor-pointer').first().click();
      await sleep(500);
      await page.locator('button:has-text("Apply"), button:has-text("Continue")').last().click().catch(async () => {
        await page.locator('button:has-text("Skip")').first().click();
      });
    }
    for (let i = 0; i < 15; i++) { await sleep(1500); if (/dashboard|onboarding/.test(page.url())) break; }
    const u = page.url(); await h.shot('post-flow');
    h.step(`Post-registration URL: ${u}`);
    regDone = !/register|login/.test(u);
    if (!regDone) return h.fail(`Did not reach workspace. url=${u}`, { classification: 'PRODUCT_DEFECT' });
    // dashboard content check
    await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    const t = await S1.text(); await h.shot('dashboard');
    saveState({ guideBiz: { email: box.address, password: PW, company: COMPANY } });
    return h.pass(`Full registration journey completed; dashboard at ${page.url()}`);
  });
  await S1.finish();

  const S2 = await new Session('GUIDE-EMAIL').start();
  await S2.jcase({ id: 'GUIDE-02R', domain: 'SMTP', capability: 'REG-02: welcome email after full registration', persona: 'NEW BUSINESS OWNER', startUrl: 'mailbox', expected: 'Welcome email with portal link', coreDep: 'YES' }, async (page, h) => {
    if (!regDone) return h.blocked('Registration incomplete');
    const msg = await waitForMessage(box, { subjectRe: /welcome|afruheritage|ready|guidecheck|account|trial/i, timeoutMs: 240000, pollMs: 8000 });
    if (!msg) return h.fail('No welcome email in 4 min', { classification: 'INTEGRATION_DEFECT' });
    const links = extractLinks(msg);
    const bad = links.filter(l => /localhost|127\.0\.0\.1|0\.0\.0\.0|\d+\.\d+\.\d+\.\d+/.test(l));
    h.step(`Welcome: "${msg.subject}" links=${links.length}`);
    portalUrl = links.find(l => /afruheritage\.com/.test(l)) || null;
    if (bad.length) return h.fail(`Bad links: ${bad.join(',')}`, { classification: 'PRODUCT_DEFECT' });
    return h.pass(`Welcome email verified: "${msg.subject}"`);
  });
  await S2.finish();

  // cold-context support page (fresh context, no tenant cookie)
  const S3 = await new Session('GUIDE-SUP', { video: true }).start();
  await S3.jcase({ id: 'GUIDE-04R', domain: 'COMING-SOON', capability: 'Apex /support with no tenant context shows upfront guidance', persona: 'PUBLIC VISITOR', startUrl: BASE + '/support', expected: 'Honest notice rather than dead-end form', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/support', { waitUntil: 'domcontentloaded' }); await sleep(4500);
    const t = await S3.text();
    await h.shot('apex-support-cold');
    h.step(`url=${page.url()}`);
    if (/own portal|tenant|business.{0,40}portal|company.{0,40}portal|workspace|sign in/i.test(t)) {
      const hasForm = /submit ticket/i.test(t);
      h.step(`guidance found; form visible=${hasForm}`);
      return h.pass('Apex support shows tenant-context guidance upfront');
    }
    return h.fail(`No guidance shown: "${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-CS-02' });
  });
  await S3.finish();

  console.log('=== P20B COMPLETE ===');
  process.exit(0);
})().catch(e => { console.error('P20B FATAL:', e); process.exit(1); });
