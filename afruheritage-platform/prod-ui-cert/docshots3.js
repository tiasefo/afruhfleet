// Registration -> plan -> template -> dashboard -> logout -> login -> onboarding journey.
// Fresh admitted UAT identity: uatdemo2-mva2x9b27ri0@maxxspace.com
const { chromium } = require('@playwright/test');
const OUT = 'prod-ui-cert/docshots';
const EMAIL = 'uatdemo2-mva2x9b27ri0@maxxspace.com';
const PASS = 'UatDemo2!2026Journey';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  const shot = async (n) => { await page.waitForTimeout(1800); await page.screenshot({ path: `${OUT}/${n}.png`, fullPage: false }); console.log('shot', n, '->', page.url()); };

  await page.goto('https://afruheritage.com/register', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('#email', { timeout: 20000 });
  await shot('j01-register-form');

  await page.locator('button:has-text("Individual")').first().click();
  await page.locator('#full_name').fill('UAT Demo Person Two');
  await page.locator('#email').fill(EMAIL);
  await page.locator('#password').fill(PASS);
  await page.locator('#confirm_password').fill(PASS);
  await shot('j02-register-filled');

  await page.getByRole('button', { name: /create account/i }).click();
  // Wait for the blocking "Choose Your Plan" modal
  await page.waitForSelector('text=Choose Your Plan', { timeout: 30000 }).catch(() => console.log('plan modal not seen, url=', page.url()));
  await shot('j03-choose-plan');

  // Select the Free Trial plan card, then Continue INSIDE the modal (avoid "Continue with Google")
  await page.locator('text=Free Trial (14 days)').first().click().catch(e => console.log('plan card click:', e.message));
  await page.waitForTimeout(800);
  const modal = page.locator('div.fixed.inset-0.z-50');
  await modal.getByRole('button', { name: 'Continue' }).click();
  // Free trial -> template picker modal
  await page.waitForSelector('text=Choose Your Storefront Template', { timeout: 30000 }).catch(() => console.log('template modal not seen, url=', page.url()));
  await shot('j04-choose-template');

  const tmodal = page.locator('div.fixed.inset-0.z-50');
  const launchBtn = tmodal.getByRole('button', { name: /Launch Storefront/i });
  if (await launchBtn.isVisible().catch(() => false)) {
    await launchBtn.click();
  } else {
    await tmodal.getByRole('button', { name: 'Skip' }).click().catch(() => {});
  }
  await page.waitForTimeout(6000);
  await shot('j05-after-template'); // expect /dashboard or /login

  // If dashboard reached, capture then log out via clearing storage and go to /login
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.goto('https://afruheritage.com/login', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('#email', { timeout: 20000 });
  await shot('j06-login-page');
  await page.locator('#email').fill(EMAIL);
  await page.locator('#password').fill(PASS);
  await shot('j07-login-filled');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForTimeout(8000);
  await shot('j08-after-login'); // expect /onboarding or /dashboard

  // Onboarding wizard if present
  if (page.url().includes('/onboarding')) {
    await page.getByRole('button', { name: /get started/i }).click().catch(() => {});
    await shot('j09-onboarding-role');
    await page.locator('button:has-text("Personal Shipper")').first().click().catch(() => {});
    await page.getByRole('button', { name: 'Continue' }).click().catch(() => {});
    await shot('j10-onboarding-profile');
    await page.getByRole('button', { name: /finish setup/i }).click().catch(() => {});
    await page.waitForTimeout(8000);
    await shot('j11-dashboard');
  } else {
    await shot('j11-dashboard');
  }
  await browser.close();
  console.log('DONE final url:', page.url());
})();
