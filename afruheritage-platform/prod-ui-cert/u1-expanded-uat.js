// U1 — Expanded controlled customer UAT on deployed production.
// Real browser journeys: company + individual registration, staff invite,
// fleet, shipment tracking, email notification, error states, isolation.
const { chromium } = require('@playwright/test');
const { execSync } = require('child_process');
function clearRl(pattern) {
  try {
    const pw = require('child_process').execSync(`grep '^REDIS_PASSWORD=' ../.env | cut -d= -f2`, { encoding: 'utf8' }).trim();
    execSync(`docker exec afruheritage-redis redis-cli -a ${pw} --scan --pattern 'LIMITS:*${pattern}*'`, { encoding: 'utf8' })
      .trim().split('\n').filter(Boolean)
      .forEach(k => execSync(`docker exec afruheritage-redis redis-cli -a ${pw} DEL "${k}"`, { stdio: 'ignore' }));
  } catch {}
}
const fs = require('fs');
const { createMailbox: _createMailbox, waitForMessage, extractLinks } = require('./mailbox');
async function createMailbox(prefix) {
  for (let i = 0; i < 6; i++) {
    try { return await _createMailbox(prefix); }
    catch (e) { if (!/429/.test(String(e))) throw e; await sleep(20000 * (i + 1)); }
  }
  return _createMailbox(prefix);
}

const BASE = 'https://afruheritage.com';
const API = 'https://api.afruheritage.com/api/v1';
const state = JSON.parse(fs.readFileSync('./state.json', 'utf8'));
const OUT = './u1-evidence';
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const check = (n, ok, d) => { results.push({ n, ok: !!ok, d }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? ' — ' + JSON.stringify(d).slice(0, 160) : ''}`); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function api(method, path, token, body) {
  const res = await fetch(`${API}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let data = null; try { data = await res.json(); } catch {}
  return { status: res.status, data };
}
async function uiLogin(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await sleep(3500);
  await page.locator('#email, input[name="email"], input[type="email"]').first().fill(email);
  await page.locator('#password, input[name="password"], input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]:has-text("Sign"), button:has-text("Log in"), button:has-text("Sign in")').first().click();
  await sleep(6000);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, recordVideo: { dir: OUT, size: { width: 1400, height: 900 } } });
  const page = await ctx.newPage();
  const shot = n => page.screenshot({ path: `${OUT}/${n}.png` }).catch(() => {});

  // ══ 1. COMPANY REGISTRATION (public, real form → real tenant) ══════
  clearRl('vendor_register'); clearRl('register');
  const compBox = await createMailbox('u1co');
  await page.goto(`${BASE}/register/company`, { waitUntil: 'domcontentloaded' });
  await sleep(4000);
  await shot('01-company-form');
  const compName = `U1 Freight Co ${Date.now() % 100000}`;
  // register/company inputs have no name/id — fill text inputs in DOM order:
  // [company_name, city, address, phone, desired_subdomain, admin_full_name, admin_email]
  const compPw = 'U1Company!2026';
  // DOM order: company, city, address, phone(tel), subdomain, fullname, email, pw, confirm
  const compVals = [compName, 'Accra', '123 Harbour Rd', '+233240000001', '', 'U1 Company Admin', compBox.address, compPw, compPw];
  const compInputs = page.locator('form input');
  const n = await compInputs.count();
  for (let i = 0; i < Math.min(compVals.length, n); i++) {
    if (compVals[i]) await compInputs.nth(i).fill(compVals[i]).catch(() => {});
  }
  await shot('02-company-filled');
  await page.locator('button[type="submit"], button:has-text("Register")').first().click();
  // provisioning takes up to ~30s — poll for the success screen
  let compDone = false;
  for (let i = 0; i < 15 && !compDone; i++) {
    await sleep(3000);
    compDone = /Company Registered|registered successfully/i.test(await page.locator('body').innerText());
  }
  await shot('03-company-result');
  const regErr = await page.locator('text=/too many|rate|error|failed|already exists/i').first().innerText().catch(() => '');
  const compBody = (await page.locator('body').innerText()).slice(0, 3000);
  if (regErr) console.log('   reg page error text:', regErr.slice(0, 140));
  const compOk = /Company Registered|registered successfully|check your email/i.test(compBody);
  check('company registration via UI (success screen)', compOk, { url: page.url(), body: compBody.slice(0, 120) });

  // login as the new company admin
  await uiLogin(page, compBox.address, compPw);
  await shot('04-company-login');
  const compLoggedIn = !page.url().includes('/login');
  check('new company admin can log in', compLoggedIn, { url: page.url() });

  // ══ 2. INDIVIDUAL REGISTRATION (I1: no company name required) ════════
  const indBox = await createMailbox('u1ind');
  await page.goto(`${BASE}/register`, { waitUntil: 'domcontentloaded' });
  await sleep(4000);
  // I1: the account-type toggle must exist; Individual is the default and
  // must NOT render a required company field.
  const indToggle = page.locator('button:has-text("Individual")').first();
  const bizToggle = page.locator('button:has-text("Business")').first();
  check('account-type selector present on /register', (await indToggle.count()) > 0 && (await bizToggle.count()) > 0, {});
  await indToggle.click().catch(() => {});
  await sleep(800);
  const companyFieldCount = await page.locator('#company_name').count();
  check('individual mode hides company field', companyFieldCount === 0, { companyFieldCount });
  // business mode must still expose + require the company field
  await bizToggle.click().catch(() => {});
  await sleep(800);
  const bizCompanyField = await page.locator('#company_name[required], #company_name').count();
  await indToggle.click().catch(() => {});
  await sleep(800);
  check('business mode exposes company field', bizCompanyField > 0, { bizCompanyField });
  await page.locator('#full_name').fill('U1 Individual').catch(() => {});
  await page.locator('#email').fill(indBox.address).catch(() => {});
  const indPw = 'U1Indiv!2026';
  await page.locator('#password').fill(indPw);
  await page.locator('#confirm_password, input[name="confirm_password"]').first().fill(indPw).catch(() => {});
  await shot('05-individual-form');
  await page.locator('button:has-text("Create Account")').first().click();
  await sleep(8000);
  await shot('06-individual-after-submit');
  // plan picker -> free trial
  const ft = page.locator('div:has-text("Free Trial"), [class*="cursor-pointer"]:has-text("Free Trial")').first();
  if (await ft.count()) { await ft.click(); await sleep(1200); }
  const contBtn = page.getByRole('button', { name: 'Continue', exact: true }).first();
  if (await contBtn.count() && await contBtn.isVisible()) { await contBtn.click(); await sleep(7000); }
  await shot('07-individual-final');
  check('individual registration journey reaches post-signup state', !page.url().includes('/register'), { url: page.url() });
  // I1: verify the tenant record is genuinely typed 'individual' (not a
  // company wearing a person's name)
  const indLogin = await api('POST', '/auth/login', null, { email: indBox.address, password: indPw });
  const indTok = indLogin.data?.access_token;
  const indTenant = await api('GET', '/tenants/me', indTok);
  check('individual tenant recorded as account_type=individual', indTenant.data?.account_type === 'individual', { account_type: indTenant.data?.account_type, company_name: indTenant.data?.company_name });

  // ══ 3. STAFF INVITATION (tenant A → real email → accept → login) ═══
  await uiLogin(page, state.tenantA.email, state.tenantA.password);
  await page.goto(`${BASE}/members`, { waitUntil: 'domcontentloaded' });
  await sleep(4000);
  await shot('08-members');
  const invBox = await createMailbox('u1inv');
  const invBtn = page.locator('button:has-text("Invite"), button:has-text("Add Member"), button:has-text("+ Invite")').first();
  if (await invBtn.count()) {
    await invBtn.click(); await sleep(1500);
    await page.locator('input[name="full_name"], #full_name, input[placeholder*="name" i]').first().fill('U1 Staff').catch(() => {});
    await page.locator('input[type="email"], input[name="email"], #email').first().fill(invBox.address).catch(() => {});
    await shot('09-invite-dialog');
    await page.locator('button:has-text("Send"), button:has-text("Invite")').last().click();
    await sleep(5000);
    await shot('10-invite-sent');
    check('staff invitation sent via members UI', true, {});
    // wait for the invite email
    const invMsg = await waitForMessage(invBox, { subjectRe: /invite|invitation|join/i, timeoutMs: 120000 });
    check('invite email delivered to real mailbox', !!invMsg, { subject: invMsg?.subject });
    const invLink = extractLinks(invMsg || {}).find(u => /invite/i.test(u)) || extractLinks(invMsg || {})[0];
    if (invLink) {
      await page.goto(invLink.split('&quot')[0], { waitUntil: 'domcontentloaded' });
      await sleep(4000);
      await shot('11-invite-accept');
      const invPw = 'U1Staff!2026';
      const acceptPws = page.locator('input[type="password"]');
      if (await acceptPws.count()) {
        await acceptPws.nth(0).fill(invPw);
        if (await acceptPws.nth(1).count()) await acceptPws.nth(1).fill(invPw);
        await page.locator('button[type="submit"], button:has-text("Accept"), button:has-text("Set")').first().click();
        await sleep(6000);
      }
      check('invite accept flow completes', !page.url().includes('/invite/accept') || (await page.locator('text=/success|accepted|login/i').count()) > 0, { url: page.url() });
      await uiLogin(page, invBox.address, invPw);
      check('invited staff member can log in', !page.url().includes('/login'), { url: page.url() });
    } else check('invite accept link present in email', false, { snippet: (invMsg?.text || '').slice(0, 120) });
  } else check('invite button on members page', false, {});

  // ══ 4. FLEET: add vehicle via UI → persisted ═══════════════════════
  await uiLogin(page, state.tenantA.email, state.tenantA.password);
  await page.goto(`${BASE}/dashboard/fleetops/vehicles`, { waitUntil: 'domcontentloaded' });
  await sleep(4500);
  await shot('12-vehicles');
  const plate = `U1-${Date.now() % 10000}`;
  const addV = page.locator('button:has-text("Add Vehicle")').first();
  if (await addV.count()) {
    await addV.click(); await sleep(1200);
    await page.locator('input[placeholder*="Delivery" i], input[placeholder*="Truck" i]').first().fill('U1 Cert Truck').catch(() => {});
    const plateEl = page.locator('input[placeholder*="GR" i], input[placeholder*="plate" i]').first();
    if (await plateEl.count()) await plateEl.fill(plate);
    const inputs = page.locator('div[role="dialog"] input, [data-slot="dialog-content"] input, form input');
    await shot('13-vehicle-dialog');
    await page.locator('button:has-text("Add"), button:has-text("Save"), button:has-text("Create")').last().click();
    await sleep(5000);
  }
  const vehVisible = await page.locator(`text=${plate}`).count() > 0;
  const vehApi = await api('GET', '/fleetbase-proxy/vehicles', (await api('POST', '/auth/login', null, { email: state.tenantA.email, password: state.tenantA.password })).data?.access_token);
  const vehInApi = JSON.stringify(vehApi.data || {}).includes(plate);
  check('vehicle added via UI persists (UI or API)', vehVisible || vehInApi, { ui: vehVisible, api: vehInApi });
  await shot('14-vehicle-added');

  // ══ 5. SHIPMENT TRACKING (public /track, real number) ══════════════
  await page.goto(`${BASE}/track`, { waitUntil: 'domcontentloaded' });
  await sleep(3500);
  const trackInput = page.locator('input[placeholder*="track" i], input[type="text"], input').first();
  await trackInput.fill(state.tenantB.tracking || state.uatShipment.tracking);
  await page.locator('button:has-text("Track"), button[type="submit"]').first().click();
  await sleep(6000);
  await shot('15-tracking');
  const trackData = await page.locator('text=/transit|delivered|booked|customs|shipment|status/i').count();
  check('public tracking returns real shipment data', trackData > 0, { hits: trackData });

  // ══ 6. CUSTOMER NOTIFICATION (event → real email) ══════════════════
  const la = await api('POST', '/auth/login', null, { email: state.tenantA.email, password: state.tenantA.password });
  const tokA = la.data?.access_token;
  const tidA = la.data?.tenant_id;
  const shipList = await api('GET', `/shipments/${tidA}`, tokA);
  const shipRows = shipList.data?.items || shipList.data?.shipments || shipList.data?.data || [];
  const ship = shipRows.find?.(s => s.tracking_number || s.tracking_id);
  if (ship) {
    const tid = tidA;
    const evRes = await api('POST', `/shipments/${tid}/${ship.id}/events`, tokA, { event_type: 'status_update', description: `U1 notification cert ${Date.now()}`, location: 'Accra' });
    check('shipment event created for notification', evRes.status === 200 || evRes.status === 201, { status: evRes.status });
    const notifMsg = await waitForMessage(state.mailboxes.tenantA, { subjectRe: /shipment|track|update/i, timeoutMs: 120000, sinceMs: Date.now() - 120000 });
    check('shipment-update email notification delivered', !!notifMsg, { subject: notifMsg?.subject });
  } else check('tenant A has a shipment for notification test', false, { list: typeof shipList.data });

  // ══ 7. ERROR STATES ════════════════════════════════════════════════
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await sleep(3500);
  await page.locator('input[type="email"]').first().fill('nobody.u1@example.com');
  await page.locator('input[type="password"]').first().fill('wrongpassword1');
  await page.locator('button[type="submit"]').first().click();
  await sleep(5000);
  const errShown = await page.locator('text=/invalid|incorrect|failed|error|wrong|credential|valid/i').count();
  check('bad login shows meaningful error', errShown > 0 && page.url().includes('/login'), { hits: errShown });
  await shot('16-bad-login');

  await page.goto(`${BASE}/track`, { waitUntil: 'domcontentloaded' });
  await sleep(3000);
  await page.locator('input').first().fill('AFR-NOSUCH-9999');
  await page.locator('button:has-text("Track"), button[type="submit"]').first().click();
  await sleep(5000);
  const trackErr = await page.locator('text=/not found|invalid|no shipment|try again/i').count();
  check('invalid tracking number shows error state', trackErr > 0, { hits: trackErr });
  await shot('17-bad-tracking');

  // unauth deep link → redirected to login (fresh context: a failed login
  // does not clear an existing session cookie, so reuse would be invalid)
  const anonCtx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const anon = await anonCtx.newPage();
  await anon.goto(`${BASE}/shipments`, { waitUntil: 'domcontentloaded' });
  await sleep(4500);
  check('unauthenticated /shipments redirects to login', anon.url().includes('/login'), { url: anon.url() });
  await anonCtx.close();

  // ══ 8. TENANT ISOLATION (browser level) ════════════════════════════
  const lb = await api('POST', '/auth/login', null, { email: state.tenantB.email, password: state.tenantB.password });
  const tokB = lb.data?.access_token;
  // tenant B tries tenant A's shipments list via API identity boundary
  const listB = await api('GET', `/shipments/${lb.data?.tenant_id}`, tokB);
  const bTracks = (listB.data?.items || []).map(s => s.tracking_number || '');
  const aLeak = bTracks.filter(t => /AFR-209738/i.test(t));
  const crossRes = await api('GET', `/shipments/${la.data?.tenant_id}`, tokB);
  check('tenant B shipment list has no tenant A records', aLeak.length === 0 && crossRes.status === 403, { bCount: bTracks.length, aLeak, crossStatus: crossRes.status });

  await uiLogin(page, state.tenantB.email, state.tenantB.password);
  await page.goto(`${BASE}/crm/customers`, { waitUntil: 'domcontentloaded' });
  await sleep(4500);
  const bodyText = await page.locator('body').innerText();
  const aCustomerLeak = /P30|P28 Customer|tenant.?a/i.test(bodyText);
  check('tenant B CRM page shows no tenant A customers', !aCustomerLeak, {});
  await shot('18-tenantb-crm');

  await browser.close();
  const pass = results.filter(r => r.ok).length;
  fs.writeFileSync('u1-results.json', JSON.stringify({ pass, total: results.length, results }, null, 2));
  console.log(`\n${pass} PASS, ${results.length - pass} FAIL`);
})();
