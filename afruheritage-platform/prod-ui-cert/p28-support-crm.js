// P28 — D-04 central support + D-08 CRM browser evidence on deployed prod.
//  apex support form (platform scope) -> public tracking page + guest reply ->
//  Sentinel UI thread + staff reply + status change -> tenant CRM page real API.
const { chromium } = require('@playwright/test');
const fs = require('fs');
const { createMailbox, waitForMessage } = require('./mailbox');

const BASE = 'https://afruheritage.com';
const SENT = 'https://admin.afruheritage.com/sentinel';
const API = 'https://api.afruheritage.com/api/v1';
const state = JSON.parse(fs.readFileSync('./state.json', 'utf8'));
const OUT = './p28-evidence';
fs.mkdirSync(OUT, { recursive: true });

async function api(method, path, token, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

(async () => {
  const results = [];
  const check = (name, ok, detail) => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + JSON.stringify(detail).slice(0, 170) : ''}`); };
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, recordVideo: { dir: OUT, size: { width: 1400, height: 900 } } });
  const page = await ctx.newPage();
  const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });
  const subject = 'P28 apex platform ticket ' + Date.now();

  try {
    // ── 1. Apex support form renders + submits with platform scope ──────
    await page.goto(`${BASE}/support`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    const formVisible = await page.locator('#subject').count() > 0;
    check('apex support form renders (platform scope)', formVisible, {});
    if (!formVisible) throw new Error('support form not rendered on apex');
    await page.locator('#name').fill('P28 Apex User');
    const box = await createMailbox('p28sup');
    await page.locator('#email').fill(box.address);
    await page.locator('#category').click();
    await page.locator('[role="option"]:has-text("Technical Support")').first().click();
    await page.locator('#subject').fill(subject);
    await page.locator('#description').fill('Browser-verified platform-scope intake from the apex domain.');
    await shot('01-support-form');
    await page.getByRole('button', { name: 'Submit Ticket' }).click();
    await page.waitForTimeout(6000);
    const created = await page.locator('text=Ticket Created Successfully').count() > 0;
    check('apex ticket submitted via UI', created, {});
    await shot('02-ticket-created');
    const tokenText = await page.locator('code').first().innerText().catch(() => null);
    check('public tracking token shown', !!tokenText && tokenText.length > 10, { len: tokenText?.length });

    // ── 2. Public tracking page loads via token link (apex, unauth) ─────
    await page.getByRole('link', { name: /View Ticket/i }).click();
    await page.waitForTimeout(5000);
    const detailText = await page.locator('body').innerText();
    check('public ticket detail loads on apex', new RegExp(subject.slice(0, 20), 'i').test(detailText), {});
    await shot('03-ticket-detail');
    // guest reply via public token page
    await page.locator('textarea').first().fill('Guest reply from the public tracking page.');
    await page.locator('button[type="submit"]:has-text("Send"), button:has-text("Send Reply")').first().click();
    await page.waitForTimeout(3500);
    const afterReply = await page.locator('body').innerText();
    check('guest reply persisted on public page', /Guest reply from the public tracking page/i.test(afterReply), {});
    await shot('04-guest-reply');

    // ── 3. Sentinel UI: login, open thread, staff reply, status change ──
    await page.goto(`${SENT}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4500);
    await page.locator('#email').fill('uat-sentinel@afruheritage.com');
    await page.locator('#password').fill('SentinelUat!2026');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(5000);
    await shot('05-sentinel-login');
    check('sentinel login', !/login/i.test(page.url()), { url: page.url() });

    await page.goto(`${SENT}/dashboard/tickets`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    const listText = await page.locator('body').innerText();
    check('sentinel ticket list shows apex ticket', new RegExp(subject.slice(0, 18), 'i').test(listText), {});
    await shot('06-sentinel-tickets');
    // open the ticket
    await page.locator(`text=${subject.slice(0, 25)}`).first().click();
    await page.waitForTimeout(3500);
    const threadText = await page.locator('body').innerText();
    check('sentinel thread shows messages', /Guest reply from the public tracking page/i.test(threadText), {});
    await shot('07-sentinel-thread');
    // staff reply
    await page.locator('textarea[placeholder*="Reply to customer"]').fill('Sentinel staff reply — browser verified.');
    await page.locator('button:has-text("Reply")').last().click();
    await page.waitForTimeout(3500);
    const threadAfter = await page.locator('body').innerText();
    check('sentinel staff reply appears in thread', /Sentinel staff reply — browser verified/i.test(threadAfter), {});
    await shot('08-sentinel-replied');
    // status change via the status select on the open ticket
    const statusTrigger = page.locator('button[role="combobox"], [role="combobox"]').last();
    if (await statusTrigger.count() > 0) {
      await statusTrigger.click();
      await page.waitForTimeout(800);
      const opt = page.locator('[role="option"]:has-text("pending"), [role="option"]:has-text("in_progress"), [role="option"]:has-text("resolved")').first();
      if (await opt.count() > 0) {
        await opt.click();
        await page.waitForTimeout(3000);
        const st = await page.locator('body').innerText();
        check('sentinel status change via UI', /pending|in_progress|resolved/i.test(st), {});
      } else check('sentinel status change via UI', false, { note: 'no status options' });
    } else check('sentinel status change via UI', false, { note: 'no combobox' });
    await shot('09-sentinel-status');

    // verify staff reply is visible back on the public page
    await page.goto(`${BASE}/support/ticket/${tokenText}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    const pubThread = await page.locator('body').innerText();
    check('staff reply visible on public tracking page', /Sentinel staff reply — browser verified/i.test(pubThread), {});
    await shot('10-public-thread-after-staff');

    // ── 4. D-08 CRM: tenant-facing /crm page uses real API ───────────────
    const ctxB = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const pgB = await ctxB.newPage();
    await pgB.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    await pgB.waitForTimeout(5000);
    await pgB.locator('input[name="email"], input[type="email"]').first().fill(state.tenantB.email);
    await pgB.locator('input[type="password"]').first().fill(state.tenantB.password);
    await pgB.locator('button:has-text("Sign In")').first().click();
    await pgB.waitForTimeout(6000);
    await pgB.goto(`${BASE}/crm`, { waitUntil: 'domcontentloaded' });
    await pgB.waitForTimeout(5000);
    const crmText = await pgB.locator('body').innerText();
    check('tenant CRM page loads real pipeline view', /customer|pipeline|lead|stage|opportunit/i.test(crmText) && !/mock|lorem/i.test(crmText), {});
    await pgB.screenshot({ path: `${OUT}/11-crm-page.png` });
    await pgB.goto(`${BASE}/crm/customers`, { waitUntil: 'domcontentloaded' });
    await pgB.waitForTimeout(5000);
    // create a customer through the UI if a create control exists, else via API + verify it renders
    const lb = await api('POST', '/auth/login', null, { email: state.tenantB.email, password: state.tenantB.password });
    const cust = await api('POST', '/crm/customers', lb.data.access_token, { name: 'P28 Browser Customer', email: box.address, stage: 'lead' });
    check('crm customer created via API (tenant-scoped)', cust.status === 200 || cust.status === 201, { status: cust.status });
    await pgB.reload({ waitUntil: 'domcontentloaded' });
    await pgB.waitForTimeout(5000);
    const crmAfter = await pgB.locator('body').innerText();
    check('CRM page lists the created customer', /P28 Browser Customer/i.test(crmAfter), {});
    await pgB.screenshot({ path: `${OUT}/12-crm-customer.png` });
    await ctxB.close();
  } catch (e) {
    console.error('JOURNEY ERROR:', e.message);
    await shot('99-error');
    results.push({ name: 'journey completed without exception', ok: false, detail: e.message });
  } finally {
    const pass = results.filter(r => r.ok).length, fail = results.filter(r => !r.ok).length;
    fs.writeFileSync('./p28-results.json', JSON.stringify({ pass, fail, results }, null, 2));
    console.log(`\n${pass} PASS, ${fail} FAIL`);
    await browser.close();
    process.exit(fail ? 1 : 0);
  }
})();
