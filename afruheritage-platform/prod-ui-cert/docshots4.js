// Login -> onboarding wizard -> dashboard for uatdemo2 (already registered+plan paid).
const { chromium } = require('@playwright/test');
const OUT = 'prod-ui-cert/docshots';
const EMAIL = 'uatdemo2-mva2x9b27ri0@maxxspace.com';
const PASS = 'UatDemo2!2026Journey';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  const shot = async (n) => { await page.waitForTimeout(1800); await page.screenshot({ path: `${OUT}/${n}.png` }); console.log('shot', n, '->', page.url()); };

  await page.goto('https://afruheritage.com/login', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('#email', { timeout: 30000 });
  await shot('l01-login-page');
  await page.locator('#email').fill(EMAIL);
  await page.locator('#password').fill(PASS);
  await shot('l02-login-filled');
  await page.getByRole('button', { name: /sign in/i }).click();
  // wait until we leave /login
  await page.waitForURL(u => !u.pathname.endsWith('/login'), { timeout: 60000 }).catch(() => {});
  await shot('l03-after-login');

  if (page.url().includes('/onboarding')) {
    await shot('l04-onb-welcome');
    await page.getByRole('button', { name: /get started/i }).click();
    await shot('l05-onb-role');
    await page.locator('button:has-text("Personal Shipper")').first().click();
    await page.waitForTimeout(600);
    await shot('l06-onb-role-selected');
    await page.getByRole('button', { name: 'Continue' }).click();
    await shot('l07-onb-profile');
    await page.getByRole('button', { name: /finish setup/i }).click();
    await page.waitForURL(u => !u.pathname.includes('/onboarding'), { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(4000);
    await shot('l08-dashboard');
  } else {
    await shot('l08-dashboard');
  }
  await browser.close();
  console.log('DONE final url:', page.url());
})();
