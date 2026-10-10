const { chromium } = require('@playwright/test');
(async()=>{
  const b = await chromium.launch({headless:true});
  const page = await (await b.newContext({ignoreHTTPSErrors:true})).newPage();
  await page.goto('https://admin.afruheritage.com/sentinel/login');
  await page.waitForTimeout(3000);
  await page.locator('#email').fill('uat-sentinel@afruheritage.com');
  await page.locator('#password').fill('SentinelUat!2026');
  await page.getByRole('button',{name:/sign in|log in/i}).first().click();
  await page.waitForTimeout(6000);
  console.log('DASH:', (await page.locator('body').innerText()).replace(/\s+/g,' ').slice(0,700));
  await page.goto('https://admin.afruheritage.com/sentinel/dashboard/runners/');
  await page.waitForTimeout(3500);
  console.log('RUNNERS:', (await page.locator('body').innerText()).replace(/\s+/g,' ').slice(-300));
  await b.close();
})();
