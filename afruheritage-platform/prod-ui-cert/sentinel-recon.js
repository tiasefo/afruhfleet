const { chromium } = require('@playwright/test');
const BASE = 'https://admin.afruheritage.com';
const PAGES = ['dashboard','tenants','users','billing','payments','shipments','fleetbase','runners','runtimes','domains','kyc','tickets','tracking','templates','vendors','vendor-actions','analytics','control-center','feature-flags','diagnostics','documentation','knowledge-base','architecture','blueprint'];
(async()=>{
  const b = await chromium.launch({headless:true});
  const ctx = await b.newContext({viewport:{width:1400,height:900}, ignoreHTTPSErrors:true});
  const page = await ctx.newPage();
  const fails = [];
  page.on('response', r=>{ if(r.status()>=400) fails.push(`${r.status()} ${r.request().method()} ${r.url().split('?')[0]}`); });
  page.on('pageerror', e=>fails.push('pageerror '+e.message.slice(0,120)));
  await page.goto(BASE+'/sentinel/login',{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(3000);
  await page.locator('#email').fill('uat-sentinel@afruheritage.com');
  await page.locator('#password').fill('SentinelUat!2026');
  await page.getByRole('button',{name:/sign in|log in/i}).first().click();
  await page.waitForTimeout(5000);
  console.log('after login:', page.url());
  for (const p of PAGES) {
    fails.length = 0;
    await page.goto(`${BASE}/sentinel/dashboard/${p==='dashboard'?'':p+'/'}`,{waitUntil:'domcontentloaded'}).catch(()=>{});
    await page.waitForTimeout(3500);
    const text = (await page.locator('body').innerText().catch(()=>'')) || '';
    const clean = text.replace(/\s+/g,' ').slice(0,500);
    console.log(`\n### /${p} -> ${page.url()}`);
    console.log(clean);
    if (fails.length) console.log('  NET:', [...new Set(fails)].slice(0,6).join(' ; '));
  }
  await b.close();
})();
