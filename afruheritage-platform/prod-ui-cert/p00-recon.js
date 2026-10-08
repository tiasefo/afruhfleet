// Read-only recon of the deployed public UI — dumps structure to recon.json.
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');
const BASE = 'https://afruheritage.com';

const PAGES = ['/', '/register', '/sign-in', '/login', '/forgot-password', '/track',
  '/support', '/pricing', '/marketplace', '/privacy-policy', '/terms-of-service',
  '/cookie-policy', '/onboarding', '/docs', '/locations'];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  const out = {};
  for (const p of PAGES) {
    try {
      const resp = await page.goto(BASE + p, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2500);
      const finalUrl = page.url();
      const title = await page.title();
      // dump interactive elements via accessible DOM inspection (read-only)
      const inputs = await page.locator('input').evaluateAll(els => els.map(e => ({ name: e.name, type: e.type, placeholder: e.placeholder, id: e.id })));
      const buttons = await page.locator('button, [role="button"], input[type="submit"]').evaluateAll(els => els.map(e => (e.innerText || e.value || '').trim()).filter(Boolean).slice(0, 40));
      const links = await page.locator('a[href]').evaluateAll(els => els.map(e => ({ t: (e.innerText || '').trim().slice(0, 60), h: e.getAttribute('href') })).filter(l => l.t).slice(0, 80));
      const selects = await page.locator('select').evaluateAll(els => els.map(e => ({ name: e.name, id: e.id })));
      const text = (await page.locator('body').innerText()).slice(0, 3000);
      out[p] = { status: resp && resp.status(), finalUrl, title, inputs, buttons, selects, links, text };
      await page.screenshot({ path: `../playwright-evidence/screenshots/recon-${p.replace(/\//g, '_') || 'home'}.png`, fullPage: true });
      console.log(`${p} -> ${resp && resp.status()} ${finalUrl} title="${title}" inputs=${inputs.length} buttons=${buttons.length}`);
    } catch (e) {
      out[p] = { error: e.message };
      console.log(`${p} -> ERROR ${e.message}`);
    }
  }
  fs.writeFileSync(path.join(__dirname, 'recon.json'), JSON.stringify(out, null, 2));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
