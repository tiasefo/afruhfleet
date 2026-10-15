// Second-round journey screenshots for the plain-English guide.
const { chromium } = require('@playwright/test');
const fs = require('fs');
const OUT = 'prod-ui-cert/docshots';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const shot = async (n) => { await page.waitForTimeout(1200); await page.screenshot({ path: `${OUT}/${n}.png` }); console.log('shot', n); };

  // Public journey pages
  await page.goto('https://afruheritage.com/register', { waitUntil: 'domcontentloaded' }); await shot('j01-register');
  await page.goto('https://afruheritage.com/forgot-password', { waitUntil: 'domcontentloaded' }); await shot('j02-forgot');
  await page.goto('https://afruheritage.com/vendor/register', { waitUntil: 'domcontentloaded' }); await shot('j03-vendor-register');
  await page.goto('https://afruheritage.com/support', { waitUntil: 'domcontentloaded' }); await shot('j04-support');
  await page.goto('https://afruheritage.com/track', { waitUntil: 'domcontentloaded' }).catch(()=>{}); await shot('j05-track');
  await page.goto('https://afruheritage.com/invite/accept?token=invalid-demo', { waitUntil: 'domcontentloaded' }).catch(()=>{}); await shot('j06-invite-accept');
  await page.goto('https://afruheritage.com/vendor-accept?token=invalid-demo', { waitUntil: 'domcontentloaded' }).catch(()=>{}); await shot('j07-vendor-accept');
  await page.goto('https://afruheritage.com/sign-in', { waitUntil: 'domcontentloaded' }).catch(()=>{}); await shot('j08-signin');

  // Authenticated customer pages (business owner A)
  const S = JSON.parse(fs.readFileSync('prod-ui-cert/state.json'));
  await page.goto('https://afruheritage.com/login', { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="email"], #email').first().fill(S.tenantA.email);
  await page.locator('input[type="password"], #password').first().fill(S.tenantA.password);
  await page.locator('button[type="submit"], button:has-text("Sign"), button:has-text("Log")').first().click();
  await page.waitForURL(/dashboard|\/$/, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(4000);
  await shot('j09-after-login');
  for (const [n, p] of [['j10-shipments','/shipments'],['j11-create-shipment','/shipments/new'],['j12-members','/members'],['j13-crm','/crm'],['j14-billing','/billing'],['j15-storefront','/storefront'],['j16-support-dash','/support'],['j17-customs-dash','/customs']]) {
    await page.goto('https://afruheritage.com' + p, { waitUntil: 'domcontentloaded' }).catch(()=>{});
    await page.waitForTimeout(2500); await shot(n);
  }
  await browser.close();
})();
