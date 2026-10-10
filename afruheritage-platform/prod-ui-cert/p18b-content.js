// Phase 18b — deeper content capture for ambiguous authenticated pages.
const { BASE, Session, loadState, uiLogin } = require('./harness');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const PATHS = [
  '/dashboard', '/products', '/dashboard/fleetops', '/dashboard/fleetops/drivers',
  '/dashboard/fleetops/vehicles', '/dashboard/fleetops/fleets', '/dashboard/fleetops/orders',
  '/crm', '/crm/contacts', '/crm/quotes', '/customs/duty-calculator', '/kyc',
  '/support/dashboard', '/billing', '/settings', '/templates', '/plugins',
  '/portal/gallery', '/profile', '/live-map', '/shipments/map', '/storefront',
  '/portal', '/customs',
];

(async () => {
  const st = loadState();
  const A = st.tenantA;
  const S = await new Session('INVB', {}).start();
  const page = S.page;
  await uiLogin(page, A.email, A.password, { waitMs: 60000 });
  const rows = [];
  for (const p of PATHS) {
    let status = '', text = '', url = '';
    try {
      const resp = await page.goto(BASE + p, { waitUntil: 'domcontentloaded', timeout: 45000 });
      status = resp ? String(resp.status()) : '?';
      await sleep(4500);
      url = page.url();
      const full = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
      // skip the nav chrome (first ~450 chars)
      text = full.slice(400, 1400);
    } catch (e) { status = 'NAV-FAIL ' + e.message.slice(0, 60); }
    rows.push({ p, status, url: url.replace(BASE, ''), text });
    console.log(`\n===== ${p} :: ${status} ${url.replace(BASE, '')}`);
    console.log(text.slice(0, 700));
  }
  require('fs').writeFileSync('inventory2.json', JSON.stringify(rows, null, 2));
  await S.finish();
  process.exit(0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
