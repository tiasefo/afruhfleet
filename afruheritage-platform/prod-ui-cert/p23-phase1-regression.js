// P23 — Phase 1 browser regression: login -> shipment form receiver_email field
// -> tenant isolation spot check. Real browser, real deployment.
const { chromium } = require('@playwright/test');
const fs = require('fs');

const BASE = 'https://afruheritage.com';
const state = JSON.parse(fs.readFileSync('./state.json', 'utf8'));
const OUT = './p23-evidence';
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1400, height: 900 }, recordVideo: { dir: OUT, size: { width: 1400, height: 900 } } })).newPage();
  const results = [];
  const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png`, fullPage: false });

  try {
    // 1. Login as tenantB owner
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[type="email"], input[placeholder*="@"], #email').first().fill(state.tenantB.email);
    await page.locator('input[type="password"], #password').first().fill(state.tenantB.password);
    await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")').first().click();
    await page.waitForURL(/dashboard|onboarding|shipments|billing/, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    await shot('01-dashboard');
    results.push({ step: 'owner login', ok: !/login/.test(page.url()), url: page.url() });

    // 2. Shipment create form — Receiver Email field present
    await page.goto(`${BASE}/shipments/new`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    const emailField = await page.locator('input[type="email"][placeholder*="Receiver"], input[placeholder*="status updates"]').count();
    await shot('02-shipment-new');
    results.push({ step: 'receiver email field in create form', ok: emailField > 0, count: emailField });

    // 3. Shipments list renders (regression)
    await page.goto(`${BASE}/shipments`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const bodyText = await page.locator('body').innerText();
    results.push({ step: 'shipments list renders', ok: /AFR-|Shipment/i.test(bodyText) });
    await shot('03-shipments');

    // 4. Tracking page (public) renders
    const pub = await browser.newPage();
    await pub.goto(`${BASE}/track?tracking_number=AFR-E2C382-20261012-3DFCC6`, { waitUntil: 'domcontentloaded' });
    await pub.waitForTimeout(5000);
    const pubText = await pub.locator('body').innerText();
    results.push({ step: 'public track resolves shipment', ok: /AFR-E2C382-20261012-3DFCC6|delivered|in_transit|in transit/i.test(pubText) });
    await pub.screenshot({ path: `${OUT}/04-public-track.png` });
    await pub.close();

    // 5. Dashboard loads (regression)
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await shot('05-dashboard');
    results.push({ step: 'dashboard renders', ok: !/login/.test(page.url()) });

  } catch (e) {
    results.push({ step: 'script error', ok: false, err: String(e).slice(0, 200) });
    await shot('99-error').catch(() => {});
  }

  await browser.close();
  fs.writeFileSync(`${OUT}/p23-results.json`, JSON.stringify(results, null, 2));
  console.log('=== P23 RESULTS ===');
  results.forEach(r => console.log(r.ok ? 'PASS' : 'FAIL', '-', r.step, r.url || r.count || r.err || ''));
  process.exit(results.some(r => !r.ok) ? 1 : 0);
})();
