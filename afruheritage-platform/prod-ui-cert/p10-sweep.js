// Phase 10 — comprehensive remaining-domain sweep on Tenant B.
// Covers: contact/quotes finish, shipments retest, fleet, vendors, marketplace,
// warehouse, customs, KYC, support, billing, analytics, AI widget.
const { BASE, Session, loadState, saveState, clickFirst, uiLogin } = require('./harness');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OWNER = 'BUSINESS OWNER (TENANT B)';

async function waitReady(page, re, t = 25000) {
  try { await page.getByText(re).first().waitFor({ state: 'visible', timeout: t }); return true; }
  catch { return false; }
}
async function fillAllNumbers(page, h) {
  let n = 0;
  for (const el of await page.locator('input[type="number"]:visible').all()) {
    try { const v = await el.inputValue(); if (!v || v === '0' || v === '0.0' || v === '0.00') { await el.fill('5'); n++; } } catch {}
  }
  if (n) h.step(`Filled ${n} numeric fields`);
}
async function fillText(page, map, scope, h) {
  const root = scope || page;
  const filled = [];
  for (const el of await root.locator('input:visible, textarea:visible').all()) {
    const hay = `${await el.getAttribute('name') || ''} ${await el.getAttribute('id') || ''} ${await el.getAttribute('placeholder') || ''}`.toLowerCase();
    for (const [pat, val] of Object.entries(map)) {
      if (hay.includes(pat)) { try { await el.fill(val); filled.push(pat); } catch {} break; }
    }
  }
  if (filled.length && h) h.step(`Filled: ${[...new Set(filled)].join(',')}`);
}
async function fillSelects(page, scope) {
  for (const s of await (scope || page).locator('select:visible').all()) {
    try { const o = await s.locator('option').allTextContents(); if (o.length > 1) await s.selectOption({ index: 1 }); } catch {}
  }
}
function modal(page) {
  // best-effort dialog scope
  return page.locator('[role="dialog"], [class*="modal"], [class*="Dialog"]').last();
}
async function submitIn(page, h, patterns) {
  const m = modal(page);
  if (await m.isVisible({ timeout: 500 }).catch(() => false)) {
    for (const sel of patterns) { const b = m.locator(sel).first(); if (await b.isVisible({ timeout: 800 }).catch(() => false)) { await b.click(); return sel + ' [modal]'; } }
  }
  return clickFirst(page, patterns, 2000);
}

(async () => {
  const B = loadState().tenantB;
  const S = await new Session('SWEEP', { video: true }).start();
  const page = S.page;
  await uiLogin(page, B.email, B.password);

  // ====== Contact create (dialog-scoped submit) ======
  await S.jcase({ id: 'CRM-02E', domain: 'CRM', capability: 'Create contact', persona: OWNER, startUrl: BASE + '/crm/contacts', expected: 'Contact created and listed', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/crm/contacts', { waitUntil: 'domcontentloaded' });
    if (!(await waitReady(page, /contacts management/i))) return h.fail('Page never interactive', { classification: 'BACKEND_DEFECT', defectRef: 'DEF-CRM-06' });
    await sleep(1200);
    await clickFirst(page, ['button:has-text("New Contact")'], 3000);
    await sleep(2000);
    await fillText(page, { first: 'Adjoa', last: 'Mensah-UAT', email: 'adjoa.mensah@uat-goldline.example', phone: '+233559876543', position: 'Manager' }, modal(page), h);
    await fillSelects(page, modal(page));
    const sub = await submitIn(page, h, ['button:has-text("Create Contact")', 'button:has-text("Save")', 'button[type="submit"]']);
    h.step(`Submit: ${sub}`); await sleep(5000);
    const t = await S.text(); await h.shot('after');
    if (/adjoa|mensah/i.test(t)) return h.pass('Contact created and listed');
    return h.fail(`Contact not visible. text="${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-CRM-07' });
  });

  // ====== Quote create (dialog-scoped) ======
  await S.jcase({ id: 'CRM-05E', domain: 'CRM', capability: 'Create quote (verify real)', persona: OWNER, startUrl: BASE + '/crm/quotes', expected: 'Quote created and listed', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/crm/quotes', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /quotes management/i); await sleep(1500);
    await h.shot('quotes-page');
    const add = await clickFirst(page, ['button:has-text("New Quote")', 'button:has-text("Create Quote")'], 4000);
    if (!add) return h.fail('No quote create control', { classification: 'UI_DEFECT', defectRef: 'DEF-CRM-13' });
    await sleep(2000); await h.shot('form');
    const dlg = page.locator('div[role="dialog"]').last();
    await dlg.waitFor({ state: 'visible', timeout: 8000 });
    // quote_number input (placeholder Q-202412-001) and total_amount (placeholder 0.00)
    const qn = dlg.locator('input[name*="quote"], input[placeholder*="Q-"], input[name*="number"]').first();
    if (await qn.isVisible({ timeout: 2000 }).catch(() => false)) await qn.fill('UAT-Q-1001');
    const amt = dlg.locator('input[name*="total"], input[name*="amount"], input[placeholder="0.00"]').first();
    if (await amt.isVisible({ timeout: 2000 }).catch(() => false)) await amt.fill('12500');
    await fillText(page, { title: 'UAT Freight Quote', customer: 'UAT Goldline', description: 'UAT quote' }, dlg, h);
    h.step('Quote fields filled'); await sleep(500);
    const qbtn = dlg.locator('button:has-text("Create Quote")').first();
    const sub = (await qbtn.isVisible({ timeout: 3000 }).catch(() => false) && await qbtn.isEnabled().catch(() => false))
      ? (await qbtn.click(), 'dialog Create Quote')
      : await submitIn(page, h, ['button:has-text("Create Quote")', 'button:has-text("Create")', 'button[type="submit"]']);
    h.step(`Submit: ${sub}`); await sleep(5000);
    const t = await S.text(); await h.shot('after');
    if (/UAT-Q-1001|Freight Quote|12,500|12500|1 quote|total quotes\s*1/i.test(t)) return h.pass('Quote created/visible', { notes: t.slice(0, 250) });
    return h.fail(`Quote not confirmed. text="${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-CRM-14' });
  });

  // ====== Shipment create — complete form ======
  await S.jcase({ id: 'SHP-01E', domain: 'SHIPMENTS', capability: 'Create shipment (complete form) -> tracking number', persona: OWNER, startUrl: BASE + '/shipments/new', expected: 'Shipment created, tracking shown', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/shipments/new', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /sender|shipment|package/i, 25000); await sleep(1500);
    const uniq = 'UATS' + String(Date.now()).slice(-6);
    await fillText(page, {
      name: uniq + ' Sender', phone: '+233551112222', address: '10 UAT Spintex Rd', city: 'Accra',
      sender: 'UAT Sender Kofi', receiver: 'UAT Receiver Ama', company: 'UAT Co', country: 'Ghana',
      description: 'UAT cert cargo electronics', notes: 'UAT', reference: 'UAT-REF-1',
      origin: 'Accra', destination: 'Kumasi', email: 'cargo@uat.example', postal: '00233', state: 'GA',
    }, null, h);
    await fillAllNumbers(page, h);
    await fillSelects(page);
    // Radix comboboxes: currency(0), origin_country(1), origin_city(2), dest_country(3), dest_city(4)
    const comboSel = async (i, text) => {
      const c = page.locator('button[role="combobox"]').nth(i);
      if (await c.isVisible({ timeout: 1500 }).catch(() => false)) {
        await c.click(); await sleep(700);
        await page.locator(`[role="option"]:has-text("${text}")`).first().click({ timeout: 4000 }).catch(() => {});
        await sleep(400);
      }
    };
    await comboSel(1, 'Ghana'); await comboSel(2, 'Accra'); await comboSel(3, 'Ghana'); await comboSel(4, 'Kumasi');
    h.step('origin/destination comboboxes selected');
    await h.shot('filled');
    const sub = await clickFirst(page, ['button:has-text("Create Shipment")', 'button:has-text("Create")', 'button:has-text("Submit")', 'button[type="submit"]'], 3000);
    h.step(`Submit: ${sub}`);
    // create POST can take >8s and navigation may abort the fetch — poll the
    // page for the success/tracking render first, then confirm persistence by
    // looking for the unique reference on the list page.
    let t = '', u = page.url(), m = null;
    for (let i = 0; i < 6 && !m; i++) {
      await sleep(4000); t = await S.text(); u = page.url();
      m = t.match(/\b(AFR[-\w]{3,}|TRK[-\w]{3,}|SHP[-\w]{3,})\b/);
      if (m || /success|created|tracking/i.test(t) && !/create shipment/i.test(t.slice(0, 200))) break;
      if (!/Creating/i.test(t)) break; // submit finished without success text
    }
    await h.shotFull('after');
    if (!m) {
      // verify persistence via the list using the unique reference
      await page.goto(BASE + '/shipments', { waitUntil: 'domcontentloaded' }).catch(() => {});
      await sleep(5000); const lt = await S.text(); await h.shot('list-check');
      const uidx = lt.indexOf(uniq);
      if (uidx >= 0) {
        // row order is tracking → sender: take the nearest AFR- id before the marker
        const before = lt.slice(Math.max(0, uidx - 300), uidx);
        const lm = before.match(/\bAFR[-\w]+\b/g);
        const trk = lm ? lm[lm.length - 1] : null;
        if (trk) saveState({ tenantB: { ...loadState().tenantB, tracking: trk } });
        return h.pass(`Shipment persisted in list (sender ${uniq})${trk ? ' tracking=' + trk : ''}`, { notes: lt.slice(0, 250) });
      }
    }
    if (m) { saveState({ tenantB: { ...loadState().tenantB, tracking: m[1] } }); h.step(`Tracking: ${m[1]}`); return h.pass(`Shipment created, tracking=${m[1]} -> ${u}`); }
    if (/success|created/i.test(t) && u !== BASE + '/shipments/new') return h.pass(`Shipment created -> ${u}`, { notes: 'no tracking visible' });
    const err = t.match(/(failed|error|required|invalid)[^\n]{0,80}/i);
    return h.fail(`Shipment not created${err ? ' err=' + err[0] : ''}. url=${u}`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-SHP-03' });
  });

  // ====== Shipment list ======
  await S.jcase({ id: 'SHP-02E', domain: 'SHIPMENTS', capability: 'Shipment list', persona: OWNER, startUrl: BASE + '/shipments', expected: 'Shipments listed (owner)', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/shipments', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /shipment/i, 25000); await sleep(3000);
    const t = await S.text(); await h.shot('list');
    const trk = loadState().tenantB?.tracking;
    if (trk && t.includes(trk)) return h.pass(`${trk} listed`);
    if (/no shipments|empty/i.test(t)) return h.fail(`Empty list (API 403 observed). text="${t.slice(0, 200)}"`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-SHP-04', notes: 'GET /api/v1/shipments/default -> 403 for Company Admin' });
    if (/uat|kofi|pending|draft|track/i.test(t)) return h.pass('List populated', { notes: t.slice(0, 250) });
    return h.fail(`Unexpected: "${t.slice(0, 200)}"`, { classification: 'UNCLASSIFIED' });
  });

  // ====== Fleet: drivers ======
  await S.jcase({ id: 'FLT-01', domain: 'FLEET', capability: 'Drivers surface + create driver', persona: OWNER, startUrl: BASE + '/dashboard/fleetops/drivers', expected: 'Driver mgmt works', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/dashboard/fleetops/drivers', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /driver|fleet/i, 25000); await sleep(1500);
    let t = await S.text(); await h.shot('drivers');
    if (/404|not found/i.test(t.slice(0, 200))) return h.fail('Drivers page 404', { classification: 'NOT_PRODUCTIZED', defectRef: 'DEF-FLT-01' });
    const add = await clickFirst(page, ['button:has-text("New Driver")', 'button:has-text("Add Driver")', 'button:has-text("Create")', 'a:has-text("New")'], 3000);
    if (!add) return h.fail(`No driver create control. text="${t.slice(0, 250)}"`, { classification: 'UI_DEFECT', defectRef: 'DEF-FLT-02' });
    await sleep(2000); await h.shot('form');
    await fillText(page, { name: 'UAT Driver Kojo', phone: '+233551234567', license: 'UAT-LIC-1', email: 'driver@uat.example' }, modal(page), h);
    await fillAllNumbers(page, h); await fillSelects(page, modal(page));
    const sub = await submitIn(page, h, ['button:has-text("Create")', 'button:has-text("Save")', 'button:has-text("Add")', 'button[type="submit"]']);
    h.step(`Submit ${sub}`); await sleep(5000);
    t = await S.text(); await h.shot('after');
    if (/kojo|uat driver|driver created/i.test(t)) return h.pass('Driver created');
    return h.fail(`Driver not created. text="${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-FLT-03' });
  });

  // ====== Fleet: vehicles ======
  await S.jcase({ id: 'FLT-02', domain: 'FLEET', capability: 'Vehicles surface + create vehicle', persona: OWNER, startUrl: BASE + '/dashboard/fleetops/vehicles', expected: 'Vehicle mgmt works', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/dashboard/fleetops/vehicles', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /vehicle|fleet/i, 25000); await sleep(1500);
    let t = await S.text(); await h.shot('vehicles');
    if (/404|not found/i.test(t.slice(0, 200))) return h.fail('Vehicles page 404', { classification: 'NOT_PRODUCTIZED', defectRef: 'DEF-FLT-04' });
    const add = await clickFirst(page, ['button:has-text("New Vehicle")', 'button:has-text("Add Vehicle")', 'button:has-text("Create")', 'a:has-text("New")'], 3000);
    if (!add) return h.fail(`No vehicle create control. text="${t.slice(0, 250)}"`, { classification: 'UI_DEFECT', defectRef: 'DEF-FLT-05' });
    await sleep(2000); await h.shot('form');
    await fillText(page, { plate: 'UAT-GR-1234', registration: 'UAT-GR-1234', make: 'Toyota', model: 'Hiace', vin: 'UATVIN123', name: 'UAT Van 1', year: '2022' }, modal(page), h);
    await fillAllNumbers(page, h); await fillSelects(page, modal(page));
    const sub = await submitIn(page, h, ['button:has-text("Create")', 'button:has-text("Save")', 'button:has-text("Add")', 'button[type="submit"]']);
    h.step(`Submit ${sub}`); await sleep(5000);
    t = await S.text(); await h.shot('after');
    if (/GR-1234|hiace|uat van|vehicle created/i.test(t)) return h.pass('Vehicle created');
    return h.fail(`Vehicle not created. text="${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-FLT-06' });
  });

  // ====== Fleet ops / live map ======
  await S.jcase({ id: 'FLT-03', domain: 'FLEET', capability: 'Fleet operations + live tracking surface', persona: OWNER, startUrl: BASE + '/dashboard/fleetops', expected: 'Fleet ops + live map reachable', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/dashboard/fleetops', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /fleet|operation|driver|vehicle/i, 25000); await sleep(2000);
    let t = await S.text(); await h.shot('fleetops');
    const opsOK = !/404|not found/i.test(t.slice(0, 200));
    await page.goto(BASE + '/fleetbase/live-map', { waitUntil: 'domcontentloaded' });
    await sleep(5000);
    const t2 = await S.text(); await h.shot('livemap');
    const mapOK = /map|live|track|fleet/i.test(t2) && !/404|not found/i.test(t2.slice(0, 200));
    const leak = /fleetbase/i.test(t2.replace(/fleetbase\/live-map/gi, ''));
    if (opsOK && mapOK && !leak) return h.pass('Fleet ops + live map render', { notes: `fleetops="${t.slice(0, 150)}"` });
    if (leak) return h.fail('Fleetbase branding leaks in UI', { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-FLT-08' });
    return h.fail(`opsOK=${opsOK} mapOK=${mapOK}. map="${t2.slice(0, 200)}"`, { classification: 'UNCLASSIFIED', defectRef: 'DEF-FLT-07' });
  });

  // ====== Vendors ======
  await S.jcase({ id: 'VND-01', domain: 'VENDOR/MARKETPLACE', capability: 'Vendor management surface (owner)', persona: OWNER, startUrl: BASE + '/vendors', expected: 'Vendor mgmt reachable', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/vendors', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /vendor|marketplace/i, 25000); await sleep(1500);
    const t = await S.text(); await h.shot('vendors');
    if (/404|not found/i.test(t.slice(0, 200))) return h.fail('Vendors 404', { classification: 'NOT_PRODUCTIZED', defectRef: 'DEF-VND-01' });
    if (/login|sign in/i.test(t.slice(0, 200))) return h.fail('Owner bounced to login', { classification: 'BACKEND_DEFECT', defectRef: 'DEF-VND-02' });
    if (/vendor/i.test(t)) return h.pass(`Vendors surface renders: "${t.slice(0, 220)}"`);
    return h.fail(`Unexpected: "${t.slice(0, 220)}"`, { classification: 'UNCLASSIFIED' });
  });

  // ====== Marketplace (owner) ======
  await S.jcase({ id: 'VND-02', domain: 'VENDOR/MARKETPLACE', capability: 'Marketplace surface (owner)', persona: OWNER, startUrl: BASE + '/marketplace', expected: 'Marketplace reachable, booking path exists', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/marketplace', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /marketplace|vendor|product|service/i, 25000); await sleep(1500);
    const t = await S.text(); await h.shot('marketplace');
    if (/404|not found/i.test(t.slice(0, 200))) return h.fail('Marketplace 404', { classification: 'NOT_PRODUCTIZED', defectRef: 'DEF-VND-03' });
    if (/marketplace|vendor|product|service/i.test(t)) return h.pass(`Marketplace renders: "${t.slice(0, 220)}"`);
    return h.fail(`Unexpected: "${t.slice(0, 220)}"`, { classification: 'UNCLASSIFIED' });
  });

  // ====== Warehouse ======
  await S.jcase({ id: 'WHS-01', domain: 'WAREHOUSE', capability: 'Warehouse surface', persona: OWNER, startUrl: BASE + '/warehouse', expected: 'Warehouse reachable if productized', coreDep: 'NO' }, async (page, h) => {
    for (const u of ['/warehouse', '/warehouses', '/dashboard/warehouse', '/inventory']) {
      await page.goto(BASE + u, { waitUntil: 'domcontentloaded' }); await sleep(3500);
      const t = await S.text();
      if (!/404|not found|page doesn/i.test(t.slice(0, 300)) && /warehouse|inventory|storage/i.test(t)) {
        await h.shot('warehouse');
        return h.pass(`Warehouse at ${u}: "${t.slice(0, 200)}"`);
      }
    }
    await h.shot('warehouse-miss');
    return h.fail('No warehouse surface reachable — not in nav, all guessed paths 404', { classification: 'NOT_PRODUCTIZED', defectRef: 'DEF-WHS-01' });
  });

  // ====== Customs duty ======
  await S.jcase({ id: 'CUS-01', domain: 'CUSTOMS', capability: 'Duty calculator (Ghana) + itemized math', persona: OWNER, startUrl: BASE + '/customs/duty-calculator', expected: 'Calculator produces itemized credible total', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/customs/duty-calculator', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /duty|customs|calculat/i, 25000); await sleep(1500);
    let t = await S.text(); await h.shot('calc');
    if (/404|not found/i.test(t.slice(0, 200))) {
      await page.goto(BASE + '/customs', { waitUntil: 'domcontentloaded' }); await sleep(4000);
      t = await S.text(); await h.shot('calc2');
      if (!/duty|customs/i.test(t)) return h.fail(`No customs surface. text="${t.slice(0, 200)}"`, { classification: 'NOT_PRODUCTIZED', defectRef: 'DEF-CUS-01' });
    }
    await fillText(page, { value: '10000', cif: '10000', cost: '10000', price: '10000', weight: '100', amount: '10000' }, null, h);
    await fillAllNumbers(page, h); await fillSelects(page);
    const calc = await clickFirst(page, ['button:has-text("Calculate")', 'button:has-text("Compute")', 'button:has-text("Estimate")', 'button[type="submit"]'], 3000);
    h.step(`Calc control: ${calc}`); await sleep(5000);
    t = await S.text(); await h.shot('result');
    const nums = (t.match(/\d[\d,]*\.?\d*/g) || []).map(x => parseFloat(x.replace(/,/g, '')));
    const hasDuty = /duty|levy|vat|tax|total|ghs|cedi/i.test(t) && nums.length > 0;
    if (hasDuty) {
      const itemized = (t.match(/duty|vat|levy|tax|nhil|getfund|covid|processing|inspection|total/gi) || []).length >= 3;
      return h.pass(`Duty result rendered${itemized ? ' itemized' : ''}`, { notes: t.slice(0, 320) });
    }
    return h.fail(`No duty computation. text="${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-CUS-02' });
  });

  // ====== KYC ======
  await S.jcase({ id: 'KYC-01', domain: 'KYC', capability: 'KYC upload + status', persona: OWNER, startUrl: BASE + '/kyc', expected: 'KYC doc upload + status visible', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/kyc', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /kyc|verif|document|identity/i, 25000); await sleep(1500);
    let t = await S.text(); await h.shot('kyc');
    if (!/kyc|verif|document|identity/i.test(t)) return h.fail(`No KYC surface. text="${t.slice(0, 200)}"`, { classification: 'NOT_PRODUCTIZED', defectRef: 'DEF-KYC-01' });
    const fileIn = page.locator('input[type="file"]');
    let uploaded = false;
    if (await fileIn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      // create a small real file via UI file input (allowed — it's upload interaction)
      await fileIn.first().setInputFiles({ name: 'uat-business-reg.png', mimeType: 'image/png', buffer: Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63fcffff3f030005fe02fea72d814d0000000049454e44ae426082', 'hex') });
      h.step('Uploaded doc file'); uploaded = true;
      await sleep(1500);
      await clickFirst(page, ['button:has-text("Submit")', 'button:has-text("Upload")', 'button:has-text("Send")'], 2500);
      await sleep(5000);
      t = await S.text(); await h.shot('after');
    }
    if (/pending|submitted|under review|approved|status/i.test(t)) return h.pass(`KYC surface + status${uploaded ? ' + upload' : ''}`, { notes: t.slice(0, 260) });
    return h.fail(`KYC incomplete. text="${t.slice(0, 240)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-KYC-02' });
  });

  // ====== Support (owner view of public ticket) ======
  await S.jcase({ id: 'SUP-01', domain: 'SUPPORT', capability: 'Owner sees/responds to support tickets', persona: OWNER, startUrl: BASE + '/support', expected: 'Ticket inbox + reply', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/support', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /support|ticket/i, 25000); await sleep(1500);
    const t = await S.text(); await h.shot('support');
    if (/ticket|support|inbox|message/i.test(t)) return h.pass(`Support surface: "${t.slice(0, 230)}"`);
    return h.fail(`No support surface. text="${t.slice(0, 200)}"`, { classification: 'NOT_PRODUCTIZED', defectRef: 'DEF-SUP-01' });
  });

  // ====== Billing ======
  await S.jcase({ id: 'BIL-01', domain: 'BILLING', capability: 'Plan/wallet/payment/history/receipt', persona: OWNER, startUrl: BASE + '/billing', expected: 'Plan + wallet + payment initiation visible', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/billing', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /billing|plan|wallet|payment|subscription/i, 25000); await sleep(2000);
    const t = await S.text(); await h.shotFull('billing');
    const hasPlan = /trial|plan|subscription|free/i.test(t);
    const hasWallet = /wallet|credit|balance/i.test(t);
    const hasPay = /pay|top.?up|add funds|checkout|subscribe|upgrade/i.test(t);
    const hasHist = /history|transaction|invoice|receipt/i.test(t);
    h.step(`plan=${hasPlan} wallet=${hasWallet} pay=${hasPay} hist=${hasHist}`);
    if (hasPlan && hasPay) return h.pass(`Billing renders`, { notes: `plan=${hasPlan} wallet=${hasWallet} pay=${hasPay} hist=${hasHist} | ${t.slice(0, 260)}` });
    if (hasPlan) return h.fail(`Billing partial: pay=${hasPay} wallet=${hasWallet} hist=${hasHist}`, { classification: 'UI_DEFECT', defectRef: 'DEF-BIL-01', notes: t.slice(0, 260) });
    return h.fail(`No billing surface. text="${t.slice(0, 220)}"`, { classification: 'NOT_PRODUCTIZED', defectRef: 'DEF-BIL-02' });
  });

  // ====== Analytics (dashboard) ======
  await S.jcase({ id: 'ANA-01', domain: 'ANALYTICS', capability: 'Tenant analytics on dashboard', persona: OWNER, startUrl: BASE + '/dashboard', expected: 'Dashboard metrics render for tenant', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /dashboard|shipment|revenue|metric|analytic/i, 25000); await sleep(2500);
    const t = await S.text(); await h.shotFull('dashboard');
    const hasMetrics = /shipment|revenue|order|customer|delivery|metric|total|chart|analytic/i.test(t);
    const fake = /lorem|placeholder|sample data|demo data/i.test(t);
    if (hasMetrics && !fake) return h.pass('Dashboard analytics render', { notes: t.slice(0, 280) });
    if (fake) return h.fail('Dashboard shows fake/demo data', { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-ANA-01' });
    return h.fail(`No analytics. text="${t.slice(0, 220)}"`, { classification: 'NOT_PRODUCTIZED', defectRef: 'DEF-ANA-02' });
  });

  // ====== AI widget ======
  await S.jcase({ id: 'AI-01', domain: 'AI', capability: 'AI assistant widget: open, prompt, response', persona: OWNER, startUrl: BASE + '/dashboard', expected: 'Widget opens; real prompt gets response', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /dashboard/i, 25000); await sleep(3000);
    // floating widget button (blue circle bottom-right)
    const btn = await clickFirst(page, [
      'button[aria-label*="chat" i]', 'button[aria-label*="assistant" i]', '[class*="chat"] button',
      'button:has(svg):near(:text("Sign out"))', 'iframe[name*="chat"]',
      'div[class*="widget"] button', 'button.fixed', '[class*="floating"] button',
    ], 2500) || await (async () => {
      // last resort: click the visible blue circle
      const el = page.locator('button').last();
      if (await el.isVisible({ timeout: 800 }).catch(() => false)) { await el.click(); return 'last-button'; }
      return null;
    })();
    h.step(`Widget control: ${btn}`); await sleep(2500);
    await h.shot('widget');
    const inp = page.locator('textarea:visible, input[placeholder*="ask" i]:visible, input[placeholder*="message" i]:visible, input[placeholder*="type" i]:visible').first();
    if (!(await inp.isVisible({ timeout: 3000 }).catch(() => false))) {
      return h.fail('AI widget input not found', { classification: 'UI_DEFECT', defectRef: 'DEF-AI-01' });
    }
    await inp.fill('What is a freight forwarder?');
    await page.keyboard.press('Enter');
    h.step('Sent prompt'); await sleep(12000);
    const t = await S.text(); await h.shot('response');
    if (/freight|forwarder|cargo|logistic|ship/i.test(t.slice(-1200))) return h.pass('AI responded to prompt', { notes: t.slice(-350) });
    return h.fail(`No AI response. tail="${t.slice(-240)}"`, { classification: 'EXTERNAL_DEPENDENCY', defectRef: 'DEF-AI-02' });
  });

  await S.finish();
  console.log('\nPhase 10 complete');
})().catch(async e => { console.error('FATAL', e); process.exit(1); });
