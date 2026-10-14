// Screenshot pass for the pilot documentation package.
// Captures real Sentinel admin pages + key customer surfaces.
const { chromium } = require('@playwright/test');
const fs = require('fs');
const OUT = 'docshots';
fs.mkdirSync(OUT, { recursive: true });
const state = JSON.parse(fs.readFileSync('./state.json', 'utf8'));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const shot = async (name) => {
    await page.waitForTimeout(3500);
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
    console.log('shot', name);
  };

  // --- Sentinel login ---
  await page.goto('https://admin.afruheritage.com/sentinel/login');
  await shot('s01-sentinel-login');
  await page.locator('#email').fill('uat-sentinel@afruheritage.com');
  await page.locator('#password').fill('SentinelUat!2026');
  await page.locator('button[type="submit"], button:has-text("Sign"), button:has-text("Login")').first().click();
  try {
    await page.waitForURL('**/dashboard**', { timeout: 20000 });
  } catch (e) {
    console.log('sentinel login did not navigate:', page.url());
  }
  await page.waitForTimeout(2500);
  await shot('s02-sentinel-dashboard');

  // --- Sentinel pages ---
  const sentinelPages = ['tenants','users','shipments','tickets','tracking','vendors','billing','payments','control-center','feature-flags','domains','diagnostics','analytics'];
  for (const p of sentinelPages) {
    try {
      await page.goto(`https://admin.afruheritage.com/sentinel/dashboard/${p}`, { timeout: 20000 });
      await shot(`s-${p}`);
    } catch (e) { console.log('skip', p, e.message.slice(0,60)); }
  }

  // --- Customer-facing pages ---
  const pub = new Map([['c01-home','/'],['c02-register','/register'],['c03-login','/login'],['c04-customs','/customs'],['c05-duty-calc','/customs/duty-calculator'],['c06-track','/track'],['c07-pricing','/pricing']]);
  for (const [n, path] of pub) {
    await page.goto('https://afruheritage.com' + path, { timeout: 20000 }).catch(()=>{});
    await shot(n);
  }

  // --- Authenticated customer (tenant A) ---
  await page.goto('https://afruheritage.com/login');
  await page.locator('#email').fill(state.tenantA.email);
  await page.locator('#password').fill(state.tenantA.password);
  await page.locator('button[type="submit"], button:has-text("Sign"), button:has-text("Log")').first().click();
  try {
    await page.waitForURL('**/dashboard**', { timeout: 20000 });
  } catch (e) {
    console.log('customer login did not navigate:', page.url());
  }
  await page.waitForTimeout(2500);
  await shot('c08-dashboard');
  for (const [n, path] of [['c09-shipments','/shipments'],['c10-billing','/billing'],['c11-settings','/settings'],['c12-crm','/crm'],['c13-support','/support']]) {
    await page.goto('https://afruheritage.com' + path, { timeout: 20000 }).catch(()=>{});
    await shot(n);
  }

  await browser.close();
  console.log('done');
})();
