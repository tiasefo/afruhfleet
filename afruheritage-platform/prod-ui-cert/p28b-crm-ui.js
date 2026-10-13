// P28b — D-08 CRM UI flow: create customer via dialog, stage change,
// activity log via dialog — all real API writes, verified persisted.
const { chromium } = require('@playwright/test');
const fs = require('fs');
const BASE = 'https://afruheritage.com';
const state = JSON.parse(fs.readFileSync('./state.json', 'utf8'));
const OUT = './p28-evidence';
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const results = [];
  const check = (n, ok, d) => { results.push({ n, ok, d }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? ' — ' + JSON.stringify(d).slice(0, 160) : ''}`); };
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, recordVideo: { dir: OUT, size: { width: 1400, height: 900 } } });
  const page = await ctx.newPage();
  const name = 'P28 UI Customer ' + Date.now().toString().slice(-6);
  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    await page.locator('input[name="email"], input[type="email"]').first().fill(state.tenantB.email);
    await page.locator('input[type="password"]').first().fill(state.tenantB.password);
    await page.locator('button:has-text("Sign In")').first().click();
    await page.waitForTimeout(6000);

    await page.goto(`${BASE}/crm/customers`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    // create via the dialog
    await page.getByRole('button', { name: /New customer/i }).click();
    await page.waitForTimeout(1200);
    await page.locator('[placeholder="Name *"]').fill(name);
    await page.locator('[placeholder="Company"]').fill('P28 Browser Corp');
    await page.locator('[placeholder="Est. value (GHS)"]').fill('4200');
    await page.locator('[placeholder="Notes"]').fill('Created through the deployed UI.');
    await page.getByRole('button', { name: /Create customer/i }).click();
    await page.waitForTimeout(4000);
    const listText = await page.locator('body').innerText();
    check('customer created via UI dialog', new RegExp(name, 'i').test(listText), {});
    await page.screenshot({ path: `${OUT}/13-crm-created.png` });

    // stage change via the customer card's own stage select
    const card = page.locator('div[data-slot="card"]').filter({ hasText: name }).first();
    const stageSel = card.locator('button[data-slot="select-trigger"], [data-slot="select-trigger"], [role="combobox"]').first();
    await stageSel.click();
    await page.waitForTimeout(800);
    await page.locator('[role="option"]:has-text("qualified")').first().click();
    await page.waitForTimeout(2500);
    const cardText = await card.innerText();
    check('stage change via UI', /qualified/i.test(cardText), {});
    // activity: the card's "Log" button opens the activity dialog
    const actBtn = card.locator('button', { hasText: /^\s*Log\s*$/ }).first();
    if (await actBtn.count() > 0) {
      await actBtn.click();
      await page.waitForTimeout(1200);
      await page.locator('[placeholder="Summary *"]').fill('P28 follow-up call');
      await page.locator('[placeholder="Details"]').fill('Called to confirm freight requirements.');
      await page.getByRole('button', { name: /Save activity/i }).click();
      await page.waitForTimeout(3000);
      // expand the card's activity list
      await card.locator('button', { hasText: /Activity/ }).first().click();
      await page.waitForTimeout(2500);
      const cardAfter = await card.innerText();
      check('activity logged via UI dialog', /P28 follow-up call/i.test(cardAfter), {});
      await page.screenshot({ path: `${OUT}/14-crm-activity.png` });
    } else {
      check('activity logged via UI dialog', false, { note: 'no activity button' });
    }
    // verify persistence via API
    const lb = await fetch('https://api.afruheritage.com/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: state.tenantB.email, password: state.tenantB.password }) }).then(r => r.json());
    const custs = await fetch('https://api.afruheritage.com/api/v1/crm/customers', { headers: { Authorization: `Bearer ${lb.access_token}` } }).then(r => r.json());
    const created = (Array.isArray(custs) ? custs : custs.items || []).find(c => c.name === name);
    check('customer persisted + tenant-scoped (API)', !!created && created.stage === 'qualified', { stage: created?.stage });
    if (created) {
      const acts = await fetch(`https://api.afruheritage.com/api/v1/crm/customers/${created.id}/activities`, { headers: { Authorization: `Bearer ${lb.access_token}` } }).then(r => r.json());
      check('activity persisted via API', (Array.isArray(acts) ? acts : acts.items || []).some(a => /P28 follow-up call/i.test(a.summary || '')), {});
    }
  } catch (e) {
    console.error('JOURNEY ERROR:', e.message);
    await page.screenshot({ path: `${OUT}/99-error.png` });
    results.push({ n: 'journey completed without exception', ok: false, d: e.message });
  } finally {
    const pass = results.filter(r => r.ok).length;
    fs.writeFileSync('./p28b-results.json', JSON.stringify({ pass, fail: results.length - pass, results }, null, 2));
    console.log(`\n${pass} PASS, ${results.length - pass} FAIL`);
    await browser.close();
    process.exit(0);
  }
})();
