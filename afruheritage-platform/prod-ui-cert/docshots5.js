// U-004 fix verification: full register -> plan -> template -> dashboard -> logout -> login.
const { chromium } = require('@playwright/test');
const OUT = 'prod-ui-cert/docshots';
const EMAIL = 'uatdemo3-mva5x4srir5p@maxxspace.com';
const PASS = 'UatDemo3!2026Journey';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  const shot = async (n) => { await page.waitForTimeout(1800); await page.screenshot({ path: `${OUT}/${n}.png` }); console.log('shot', n, '->', page.url()); };

  await page.goto('https://afruheritage.com/register', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('#email', { timeout: 30000 });
  await shot('f01-register-form');
  await page.locator('button:has-text("Individual")').first().click();
  await page.locator('#full_name').fill('UAT Demo Person Three');
  await page.locator('#email').fill(EMAIL);
  await page.locator('#password').fill(PASS);
  await page.locator('#confirm_password').fill(PASS);
  await shot('f02-register-filled');
  await page.getByRole('button', { name: /create account/i }).click();

  await page.waitForSelector('text=Choose Your Plan', { timeout: 40000 });
  await shot('f03-choose-plan');
  await page.locator('text=Free Trial (14 days)').first().click();
  await page.waitForTimeout(600);
  const modal = page.locator('div.fixed.inset-0.z-50');
  await modal.getByRole('button', { name: 'Continue' }).click();

  // Expect the template picker now (trial activated, no payment)
  const gotTemplates = await page.waitForSelector('text=Choose Your Storefront Template', { timeout: 40000 }).then(() => true).catch(() => false);
  console.log('template picker shown:', gotTemplates, 'url=', page.url());
  await shot('f04-template-picker');
  if (gotTemplates) {
    const tmodal = page.locator('div.fixed.inset-0.z-50');
    await tmodal.getByRole('button', { name: /Launch Storefront/i }).click();
  }
  await page.waitForTimeout(8000);
  await shot('f05-after-template');

  // Logout -> login again
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.context().clearCookies();
  await page.goto('https://afruheritage.com/login', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('#email', { timeout: 30000 });
  await shot('f06-login');
  await page.locator('#email').fill(EMAIL);
  await page.locator('#password').fill(PASS);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(u => !u.pathname.endsWith('/login'), { timeout: 60000 }).catch(() => {});
  await shot('f07-after-login');

  if (page.url().includes('/onboarding')) {
    await page.getByRole('button', { name: /get started/i }).click();
    await page.locator('button:has-text("Personal Shipper")').first().click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await shot('f08-onb-profile');
    await page.getByRole('button', { name: /finish setup/i }).click();
    await page.waitForURL(u => u.pathname.includes('/dashboard'), { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(4000);
  }
  await shot('f09-final');
  await browser.close();
  console.log('DONE final url:', page.url());
})();
