// Phase 12 — consolidated retest of domains invalidated by the aborted login.
const { BASE, Session, loadState, saveState, clickFirst, uiLogin, ensureAuthed } = require('./harness');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OWNER = 'BUSINESS OWNER (TENANT B)';
const LOGIN_RE = /welcome back|sign in to your account/i;

async function waitReady(page, re, t = 30000) {
  try { await page.getByText(re).first().waitFor({ state: 'visible', timeout: t }); return true; }
  catch { return false; }
}
async function fillText(page, map, scope) {
  const root = scope || page;
  for (const el of await root.locator('input:visible, textarea:visible').all()) {
    const hay = `${await el.getAttribute('name') || ''} ${await el.getAttribute('id') || ''} ${await el.getAttribute('placeholder') || ''}`.toLowerCase();
    for (const [pat, val] of Object.entries(map)) {
      if (hay.includes(pat)) { try { await el.fill(val); } catch {} break; }
    }
  }
}
async function fillNums(page) {
  for (const el of await page.locator('input[type="number"]:visible').all()) {
    try { const v = await el.inputValue(); if (!v || /^0\.?0*$/.test(v)) await el.fill('5'); } catch {}
  }
}
async function fillSelects(page, scope) {
  for (const s of await (scope || page).locator('select:visible').all()) {
    try { const o = await s.locator('option').allTextContents(); if (o.length > 1) await s.selectOption({ index: 1 }); } catch {}
  }
}
const modal = page => page.locator('[role="dialog"], [class*="modal" i], [class*="dialog" i]').last();
async function submitIn(page, patterns) {
  const m = modal(page);
  if (await m.isVisible({ timeout: 600 }).catch(() => false)) {
    for (const sel of patterns) { const b = m.locator(sel).first(); if (await b.isVisible({ timeout: 800 }).catch(() => false)) { await b.click(); return sel + '[modal]'; } }
  }
  return clickFirst(page, patterns, 2000);
}
// Require the page to show authenticated chrome (tenant name or Sign out), not the login wall.
function authedText(t) { return !LOGIN_RE.test(t.slice(0, 500)) && /sign out|company admin|dashboard/i.test(t); }

(async () => {
  const B = loadState().tenantB;
  const S = await new Session('RETEST', { video: true }).start();
  const page = S.page;
  await uiLogin(page, B.email, B.password);

  const auth = async () => { const ok = await ensureAuthed(page, B.email, B.password); if (!ok) h_note('re-authed'); };
  function h_note() {}

  // ---------- CRM contact ----------
  await S.jcase({ id: 'CRM-02F', domain: 'CRM', capability: 'Create contact', persona: OWNER, startUrl: BASE + '/crm/contacts', expected: 'Contact listed', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/crm/contacts', { waitUntil: 'domcontentloaded' });
    if (!(await waitReady(page, /contacts management/i))) { const t = await S.text(); if (LOGIN_RE.test(t)) return h.blocked('Auth lost'); return h.fail('Page never interactive', { classification: 'BACKEND_DEFECT', defectRef: 'DEF-CRM-06' }); }
    await sleep(1500);
    await clickFirst(page, ['button:has-text("New Contact")'], 3000);
    await sleep(2000);
    await fillText(page, { first: 'Adjoa', last: 'Mensah-UAT', email: 'adjoa.mensah@uat-goldline.example', phone: '+233559876543', position: 'Manager' }, modal(page));
    const sub = await submitIn(page, ['button:has-text("Create Contact")', 'button:has-text("Save")', 'button[type="submit"]']);
    h.step(`submit=${sub}`); await sleep(6000);
    const t = await S.text(); await h.shot('after');
    if (/adjoa|mensah/i.test(t)) return h.pass('Contact created and listed');
    return h.fail(`Not visible. text="${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-CRM-07' });
  });

  // ---------- CRM quote ----------
  await S.jcase({ id: 'CRM-05F', domain: 'CRM', capability: 'Create quote', persona: OWNER, startUrl: BASE + '/crm/quotes', expected: 'Quote listed', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/crm/quotes', { waitUntil: 'domcontentloaded' });
    if (!(await waitReady(page, /quotes management/i))) { const t = await S.text(); if (LOGIN_RE.test(t)) return h.blocked('Auth lost'); return h.fail('Page never interactive', { classification: 'BACKEND_DEFECT', defectRef: 'DEF-CRM-13' }); }
    await sleep(1500); await h.shot('page');
    const add = await clickFirst(page, ['button:has-text("New Quote")', 'button:has-text("Create Quote")'], 4000);
    if (!add) { const t = await S.text(); return h.fail(`No quote create control. text="${t.slice(0, 250)}"`, { classification: 'UI_DEFECT', defectRef: 'DEF-CRM-13' }); }
    await sleep(2000); await h.shot('form');
    await fillText(page, { title: 'UAT Freight Quote', number: 'UAT-Q-1001', customer: 'UAT Goldline', description: 'UAT quote' }, modal(page));
    await fillNums(page); await fillSelects(page, modal(page));
    const sub = await submitIn(page, ['button:has-text("Create Quote")', 'button:has-text("Create")', 'button:has-text("Save")', 'button[type="submit"]']);
    h.step(`submit=${sub}`); await sleep(6000);
    const t = await S.text(); await h.shot('after');
    if (/UAT-Q-1001|freight quote|draft|sent|pending/i.test(t)) return h.pass('Quote created', { notes: t.slice(0, 250) });
    return h.fail(`Quote not confirmed. text="${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-CRM-14' });
  });

  // ---------- Shipment create ----------
  await S.jcase({ id: 'SHP-01F', domain: 'SHIPMENTS', capability: 'Create shipment (full form) -> tracking', persona: OWNER, startUrl: BASE + '/shipments/new', expected: 'Created + tracking number', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/shipments/new', { waitUntil: 'domcontentloaded' });
    if (!(await waitReady(page, /sender information|sender name/i))) { const t = await S.text(); if (LOGIN_RE.test(t)) return h.blocked('Auth lost'); return h.fail('Form never rendered', { classification: 'UI_DEFECT', defectRef: 'DEF-SHP-02' }); }
    await fillText(page, { name: 'UAT Sender Kofi', phone: '+233551112222', address: '10 UAT Spintex Rd', city: 'Accra', company: 'UAT Co', description: 'UAT cert cargo', notes: 'UAT', email: 'cargo@uat.example', state: 'GA', postal: '00233' });
    // receiver block fields share names; fill remaining empties
    for (const el of await page.locator('input[type="text"]:visible, input:not([type]):visible').all()) {
      try { if (!(await el.inputValue())) { const ph = (await el.getAttribute('placeholder') || '').toLowerCase(); await el.fill(ph.includes('name') ? 'UAT Receiver Ama' : 'UAT Data'); } } catch {}
    }
    await fillNums(page); await fillSelects(page);
    await h.shot('filled');
    const sub = await clickFirst(page, ['button:has-text("Create Shipment")', 'button:has-text("Submit")', 'button[type="submit"]'], 3000);
    h.step(`submit=${sub}`); await sleep(9000);
    const t = await S.text(); const u = page.url(); await h.shotFull('after');
    const m = t.match(/\b(AFR[-\w]{3,}|TRK[-\w]{3,}|SHP[-\w]{3,}|AF-\d{4,}|[A-Z]{2,4}-\d{5,}[-\w]*)\b/);
    if (m) { saveState({ tenantB: { ...loadState().tenantB, tracking: m[1] } }); return h.pass(`Created tracking=${m[1]} -> ${u}`); }
    if (!u.includes('/shipments/new') && /success|created|shipment/i.test(t)) return h.pass(`Created -> ${u} (no tracking visible)`, { notes: t.slice(0, 250) });
    const err = t.match(/(failed|error|required|invalid|denied|forbidden)[^\n]{0,80}/i);
    return h.fail(`Not created${err ? ' err=' + err[0] : ''}. url=${u}`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-SHP-03' });
  });

  // ---------- Shipment list (corrected matcher) ----------
  await S.jcase({ id: 'SHP-02F', domain: 'SHIPMENTS', capability: 'Shipment list (authed)', persona: OWNER, startUrl: BASE + '/shipments', expected: 'Shipment rows render', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/shipments', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /shipment/i, 30000); await sleep(3000);
    const t = await S.text(); await h.shot('list');
    if (!authedText(t)) return h.blocked('Auth lost — login wall');
    if (/no shipments|empty/i.test(t)) return h.fail('Empty shipments list; GET /api/v1/shipments/default -> 403', { classification: 'BACKEND_DEFECT', defectRef: 'DEF-SHP-04' });
    const trk = loadState().tenantB?.tracking;
    if (trk && t.includes(trk)) return h.pass(`${trk} in list`);
    if (/status|origin|destination|track/i.test(t)) return h.pass('Shipment rows render', { notes: t.slice(0, 260) });
    return h.fail(`Unexpected list: "${t.slice(0, 240)}"`, { classification: 'UNCLASSIFIED' });
  });

  // ---------- Fleet drivers ----------
  await S.jcase({ id: 'FLT-01F', domain: 'FLEET', capability: 'Drivers surface + create', persona: OWNER, startUrl: BASE + '/dashboard/fleetops/drivers', expected: 'Driver mgmt', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/dashboard/fleetops/drivers', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /driver|fleet|login/i, 30000); await sleep(2000);
    let t = await S.text(); await h.shot('drivers');
    if (!authedText(t)) return h.blocked('Auth lost — login wall');
    if (/404|not found/i.test(t.slice(0, 200))) return h.fail('Drivers 404', { classification: 'NOT_PRODUCTIZED', defectRef: 'DEF-FLT-01' });
    const add = await clickFirst(page, ['button:has-text("New Driver")', 'button:has-text("Add Driver")', 'button:has-text("Create")'], 3000);
    if (!add) return h.fail(`No driver control. text="${t.slice(0, 240)}"`, { classification: 'UI_DEFECT', defectRef: 'DEF-FLT-02' });
    await sleep(2000); await fillText(page, { name: 'UAT Driver Kojo', phone: '+233551234567', license: 'UATLIC1', email: 'd@u.e' }, modal(page));
    const sub = await submitIn(page, ['button:has-text("Create")', 'button:has-text("Save")', 'button:has-text("Add")', 'button[type="submit"]']);
    h.step(`submit=${sub}`); await sleep(6000);
    t = await S.text(); await h.shot('after');
    if (/kojo|uat driver/i.test(t)) return h.pass('Driver created');
    return h.fail(`Driver not created. text="${t.slice(0, 240)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-FLT-03' });
  });

  // ---------- Fleet vehicles ----------
  await S.jcase({ id: 'FLT-02F', domain: 'FLEET', capability: 'Vehicles surface + create', persona: OWNER, startUrl: BASE + '/dashboard/fleetops/vehicles', expected: 'Vehicle mgmt', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/dashboard/fleetops/vehicles', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /vehicle|fleet|login/i, 30000); await sleep(2000);
    let t = await S.text(); await h.shot('vehicles');
    if (!authedText(t)) return h.blocked('Auth lost — login wall');
    if (/404|not found/i.test(t.slice(0, 200))) return h.fail('Vehicles 404', { classification: 'NOT_PRODUCTIZED', defectRef: 'DEF-FLT-04' });
    const add = await clickFirst(page, ['button:has-text("New Vehicle")', 'button:has-text("Add Vehicle")', 'button:has-text("Create")'], 3000);
    if (!add) return h.fail(`No vehicle control. text="${t.slice(0, 240)}"`, { classification: 'UI_DEFECT', defectRef: 'DEF-FLT-05' });
    await sleep(2000); await fillText(page, { plate: 'UAT-GR-1234', registration: 'UAT-GR-1234', make: 'Toyota', model: 'Hiace', name: 'UAT Van 1', year: '2022', vin: 'UATVIN123' }, modal(page));
    const sub = await submitIn(page, ['button:has-text("Create")', 'button:has-text("Save")', 'button:has-text("Add")', 'button[type="submit"]']);
    h.step(`submit=${sub}`); await sleep(6000);
    t = await S.text(); await h.shot('after');
    if (/GR-1234|hiace|uat van/i.test(t)) return h.pass('Vehicle created');
    return h.fail(`Vehicle not created. text="${t.slice(0, 240)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-FLT-06' });
  });

  // ---------- Fleet ops + live map (corrected) ----------
  await S.jcase({ id: 'FLT-03F', domain: 'FLEET', capability: 'Fleet ops + live tracking', persona: OWNER, startUrl: BASE + '/dashboard/fleetops', expected: 'Ops dashboard + live map', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/dashboard/fleetops', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /fleet|login/i, 30000); await sleep(2500);
    let t = await S.text(); await h.shot('ops');
    if (!authedText(t)) return h.blocked('Auth lost — login wall');
    const opsOK = /driver|vehicle|fleet|delivery|route|order/i.test(t) && !/404/i.test(t.slice(0, 200));
    await page.goto(BASE + '/fleetbase/live-map', { waitUntil: 'domcontentloaded' });
    await sleep(6000);
    const t2 = await S.text(); await h.shot('map');
    const mapAuthed = !LOGIN_RE.test(t2.slice(0, 500));
    const mapOK = mapAuthed && /map|live|driver|vehicle|location/i.test(t2) && !/404|not found/i.test(t2.slice(0, 200));
    const leak = /fleetbase(?!\/)/i.test((await page.title()) + t2.replace(/fleetbase\.|fleetbase\//gi, ''));
    if (opsOK && mapOK && !leak) return h.pass('Fleet ops + live map render');
    if (leak) return h.fail('Fleetbase brand leaks', { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-FLT-08' });
    return h.fail(`ops=${opsOK} map=${mapOK} mapAuthed=${mapAuthed}`, { classification: 'UNCLASSIFIED', defectRef: 'DEF-FLT-07', notes: t2.slice(0, 200) });
  });

  // ---------- Vendors + Marketplace (authed) ----------
  await S.jcase({ id: 'VND-01F', domain: 'VENDOR/MARKETPLACE', capability: 'Vendor surface (owner)', persona: OWNER, startUrl: BASE + '/vendors', expected: 'Vendor mgmt', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/vendors', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /vendor|login/i, 30000); await sleep(1500);
    const t = await S.text(); await h.shot('vendors');
    if (!authedText(t)) return h.blocked('Auth lost — login wall');
    if (/404|not found/i.test(t.slice(0, 200))) return h.fail('Vendors 404', { classification: 'NOT_PRODUCTIZED', defectRef: 'DEF-VND-01' });
    if (/vendor/i.test(t)) return h.pass(`Vendors render: "${t.slice(0, 220)}"`);
    return h.fail(`Unexpected: "${t.slice(0, 220)}"`, { classification: 'UNCLASSIFIED' });
  });
  await S.jcase({ id: 'VND-02F', domain: 'VENDOR/MARKETPLACE', capability: 'Marketplace (owner)', persona: OWNER, startUrl: BASE + '/marketplace', expected: 'Marketplace + booking path', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/marketplace', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /marketplace|vendor|login/i, 30000); await sleep(1500);
    const t = await S.text(); await h.shot('mkt');
    if (!authedText(t)) return h.blocked('Auth lost — login wall');
    if (/marketplace|vendor/i.test(t)) return h.pass(`Marketplace renders: "${t.slice(0, 220)}"`);
    return h.fail(`Unexpected: "${t.slice(0, 220)}"`, { classification: 'UNCLASSIFIED' });
  });

  // ---------- KYC ----------
  await S.jcase({ id: 'KYC-01F', domain: 'KYC', capability: 'KYC upload + status', persona: OWNER, startUrl: BASE + '/kyc', expected: 'Upload + status', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/kyc', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /kyc|verif|login/i, 30000); await sleep(2000);
    let t = await S.text(); await h.shot('kyc');
    if (!authedText(t)) return h.blocked('Auth lost — login wall');
    if (!/kyc|verif|document|identity/i.test(t)) return h.fail(`No KYC surface. "${t.slice(0, 200)}"`, { classification: 'NOT_PRODUCTIZED', defectRef: 'DEF-KYC-01' });
    const fi = page.locator('input[type="file"]');
    if (await fi.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await fi.first().setInputFiles({ name: 'uat-reg.png', mimeType: 'image/png', buffer: Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63fcffff3f030005fe02fea72d814d0000000049454e44ae426082', 'hex') });
      h.step('Uploaded doc'); await sleep(1500);
      await clickFirst(page, ['button:has-text("Submit")', 'button:has-text("Upload")'], 2500); await sleep(5000);
      t = await S.text(); await h.shot('after');
    }
    if (/pending|submitted|under review|approved|status|upload/i.test(t)) return h.pass('KYC surface + status', { notes: t.slice(0, 260) });
    return h.fail(`KYC incomplete. "${t.slice(0, 220)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-KYC-02' });
  });

  // ---------- Support owner inbox ----------
  await S.jcase({ id: 'SUP-01F', domain: 'SUPPORT', capability: 'Owner support ticket inbox + reply', persona: OWNER, startUrl: BASE + '/support', expected: 'Ticket inbox (not public FAQ)', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/support', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /support|ticket|login/i, 30000); await sleep(2000);
    const t = await S.text(); await h.shot('support');
    if (!authedText(t)) return h.blocked('Auth lost — public support page only');
    if (/inbox|ticket|assign|reply|conversation|open tickets/i.test(t)) return h.pass('Owner ticket inbox', { notes: t.slice(0, 240) });
    return h.fail(`Owner sees public FAQ only, no ticket inbox. "${t.slice(0, 220)}"`, { classification: 'UI_DEFECT', defectRef: 'DEF-SUP-02' });
  });

  // ---------- Billing ----------
  await S.jcase({ id: 'BIL-01F', domain: 'BILLING', capability: 'Plan/wallet/payment/history', persona: OWNER, startUrl: BASE + '/billing', expected: 'Billing surfaces', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/billing', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /billing|plan|login/i, 30000); await sleep(2500);
    const t = await S.text(); await h.shotFull('billing');
    if (!authedText(t)) return h.blocked('Auth lost — login wall');
    const plan = /trial|plan|subscription|free/i.test(t);
    const wallet = /wallet|credit|balance/i.test(t);
    const pay = /pay|top.?up|add funds|checkout|upgrade|subscribe/i.test(t);
    const hist = /history|transaction|invoice|receipt/i.test(t);
    if (plan && (pay || wallet)) return h.pass('Billing renders', { notes: `plan=${plan} wallet=${wallet} pay=${pay} hist=${hist} | ${t.slice(0, 250)}` });
    if (plan) return h.fail(`Partial billing: wallet=${wallet} pay=${pay} hist=${hist}`, { classification: 'UI_DEFECT', defectRef: 'DEF-BIL-01', notes: t.slice(0, 250) });
    return h.fail(`No billing. "${t.slice(0, 220)}"`, { classification: 'NOT_PRODUCTIZED', defectRef: 'DEF-BIL-02' });
  });

  // ---------- Analytics ----------
  await S.jcase({ id: 'ANA-01F', domain: 'ANALYTICS', capability: 'Tenant dashboard analytics', persona: OWNER, startUrl: BASE + '/dashboard', expected: 'Metrics for this tenant', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /dashboard|login/i, 30000); await sleep(3000);
    const t = await S.text(); await h.shotFull('dash');
    if (!authedText(t)) return h.blocked('Auth lost — login wall');
    const metrics = /shipment|revenue|order|customer|delivery|total|active|pending/i.test(t);
    const fake = /lorem|demo data|sample data|coming soon/i.test(t);
    if (metrics && !fake) return h.pass('Dashboard metrics render', { notes: t.slice(0, 280) });
    if (fake) return h.fail('Fake/demo analytics', { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-ANA-01' });
    return h.fail(`No metrics. "${t.slice(0, 220)}"`, { classification: 'NOT_PRODUCTIZED', defectRef: 'DEF-ANA-02' });
  });

  // ---------- AI widget authed ----------
  await S.jcase({ id: 'AI-01F', domain: 'AI', capability: 'AI widget: prompt -> response (authed)', persona: OWNER, startUrl: BASE + '/dashboard', expected: 'Response to real prompt', coreDep: 'NO' }, async (page, h) => {
    const fab = page.locator('button').last();
    if (await fab.isVisible({ timeout: 2000 }).catch(() => false)) await fab.click();
    await sleep(2500); await h.shot('widget');
    const inp = page.locator('textarea:visible, input[placeholder*="question" i]:visible, input[placeholder*="ask" i]:visible, input[placeholder*="type" i]:visible').first();
    if (!(await inp.isVisible({ timeout: 3000 }).catch(() => false))) return h.fail('No AI input', { classification: 'UI_DEFECT', defectRef: 'DEF-AI-01' });
    await inp.fill('What documents are needed for Ghana customs clearance?');
    await page.keyboard.press('Enter');
    h.step('Prompt sent');
    // wait up to 40s for response text beyond the prompt echo
    let responded = null;
    for (let i = 0; i < 20; i++) {
      await sleep(2000);
      const wt = await page.locator('body').innerText();
      const tail = wt.split('customs clearance?').pop() || '';
      if (/document|invoice|declaration|duty|import|clearance|ID|permit/i.test(tail) && !/thinking|typing/i.test(tail)) { responded = tail.slice(0, 200); break; }
    }
    await h.shot('response');
    if (responded) return h.pass('AI responded', { notes: responded });
    return h.fail('Prompt accepted but no response within 40s', { classification: 'EXTERNAL_DEPENDENCY', defectRef: 'DEF-AI-02' });
  });

  await S.finish();
  console.log('\nPhase 12 complete');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
