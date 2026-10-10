// Phase 18 — UAT capability inventory: authenticated customer sweep of every nav path + deferred paths.
const { BASE, Session, loadState, uiLogin } = require('./harness');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const PATHS = [
  '/dashboard', '/products', '/shipments', '/dashboard/fleetops', '/crm',
  '/customs/duty-calculator', '/members', '/kyc', '/support/dashboard',
  '/billing', '/settings', '/templates', '/plugins', '/portal/gallery',
  '/profile',
  // deferred / potentially dangling
  '/marketplace', '/vendors', '/analytics', '/warehouse', '/activities',
  '/live-map', '/crm/activities', '/shipments/map',
];

(async () => {
  const st = loadState();
  const A = st.tenantA;
  const S = await new Session('INVENTORY', {}).start();
  const page = S.page;
  await uiLogin(page, A.email, A.password, { waitMs: 60000 });
  console.log('LOGGED IN:', page.url());
  const rows = [];
  for (const p of PATHS) {
    let status = '', title = '', text = '', url = '';
    try {
      const resp = await page.goto(BASE + p, { waitUntil: 'domcontentloaded', timeout: 45000 });
      status = resp ? String(resp.status()) : '?';
      await sleep(4000);
      url = page.url();
      title = await page.title();
      text = (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 400);
    } catch (e) { status = 'NAV-FAIL ' + e.message.slice(0, 60); }
    const flags = [];
    if (/login/.test(url)) flags.push('LOGIN-WALL');
    if (/404|not found|page doesn't exist/i.test(text)) flags.push('NOT-FOUND');
    if (/coming soon|under development|not available yet/i.test(text)) flags.push('COMING-SOON-LABEL');
    if (/something went wrong|internal server error|unhandled/i.test(text)) flags.push('ERROR');
    if (/no data|empty|get started|create your first/i.test(text)) flags.push('EMPTY-STATE');
    rows.push({ p, status, flags: flags.join('|'), url: url.replace(BASE, ''), snippet: text.slice(0, 160) });
    console.log(`${p} :: ${status} [${flags.join('|')}] ${url.replace(BASE, '')} :: ${text.slice(0, 140)}`);
  }
  require('fs').writeFileSync('inventory.json', JSON.stringify(rows, null, 2));
  await S.finish();
  process.exit(0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
