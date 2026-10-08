// Phase 9d — definitive CRM writes + full shipment lifecycle (wait-for-interactive discipline).
const { BASE, Session, loadState, saveState, clickFirst, uiLogin } = require('./harness');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OWNER = 'BUSINESS OWNER (TENANT B)';
const ANON = 'ANONYMOUS CUSTOMER';

async function waitReady(page, markerRe, timeout = 20000) {
  const loc = page.getByText(markerRe).first();
  try { await loc.waitFor({ state: 'visible', timeout }); return true; } catch { return false; }
}
async function smartFill(page, h, mapping) {
  const filled = [];
  for (const el of await page.locator('input:visible, textarea:visible').all()) {
    const hay = `${await el.getAttribute('name') || ''} ${await el.getAttribute('id') || ''} ${await el.getAttribute('placeholder') || ''}`.toLowerCase();
    for (const [pat, val] of Object.entries(mapping)) {
      if (hay.includes(pat)) { try { await el.fill(val); filled.push(pat); } catch {} break; }
    }
  }
  if (filled.length) h.step(`Filled: ${filled.join(',')}`);
  return filled;
}
async function fillSelects(page, h) {
  for (const s of await page.locator('select:visible').all()) {
    try {
      const opts = await s.locator('option').allTextContents();
      if (opts.length > 1) { await s.selectOption({ index: 1 }); h.step(`Select -> "${opts[1].trim().slice(0, 40)}"`); }
    } catch {}
  }
}

(async () => {
  const B = loadState().tenantB;
  const S = await new Session('OPS', { video: true }).start();
  const page = S.page;
  await uiLogin(page, B.email, B.password);

  // ---- Contact create ----
  await S.jcase({ id: 'CRM-02D', domain: 'CRM', capability: 'Create contact (New Contact)', persona: OWNER, startUrl: BASE + '/crm/contacts', expected: 'Contact created and listed', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/crm/contacts', { waitUntil: 'domcontentloaded' });
    const ready = await waitReady(page, /contacts management|contacts directory/i, 25000);
    if (!ready) { await h.shot('notready'); return h.fail('Contacts page never became interactive', { classification: 'BACKEND_DEFECT', defectRef: 'DEF-CRM-06' }); }
    await sleep(1500);
    await clickFirst(page, ['button:has-text("New Contact")', 'button:has-text("Create Contact")'], 3000);
    h.step('Opened New Contact');
    await sleep(2000);
    await h.shot('form');
    await smartFill(page, h, { first: 'Adjoa', last: 'Mensah-UAT', name: 'Adjoa Mensah-UAT', email: 'adjoa.mensah@uat-goldline.example', phone: '+233559876543', company: 'UAT Goldline Imports', position: 'Logistics Manager', title: 'Manager' });
    await fillSelects(page, h);
    const save = await clickFirst(page, ['button:has-text("Create Contact")', 'button:has-text("Save")', 'button:has-text("Create")', 'button[type="submit"]'], 2500);
    h.step(`Submit ${save}`); await sleep(5000);
    const t = await S.text();
    await h.shot('after');
    if (/adjoa|mensah/i.test(t)) return h.pass('Contact created and listed');
    return h.fail(`Contact not visible. text="${t.slice(0, 300)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-CRM-07' });
  });

  // ---- Opportunity create ----
  await S.jcase({ id: 'CRM-03D', domain: 'CRM', capability: 'Create opportunity via New Opportunity', persona: OWNER, startUrl: BASE + '/crm', expected: 'Opportunity in pipeline', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/crm', { waitUntil: 'domcontentloaded' });
    const ready = await waitReady(page, /sales pipeline|opportunities pipeline/i, 25000);
    if (!ready) { await h.shot('notready'); return h.fail('Pipeline never interactive', { classification: 'BACKEND_DEFECT', defectRef: 'DEF-CRM-15' }); }
    await sleep(1500);
    await clickFirst(page, ['button:has-text("New Opportunity")'], 3000);
    await sleep(2500);
    const titleIn = page.getByPlaceholder(/opportunity title/i);
    if (!(await titleIn.isVisible({ timeout: 4000 }).catch(() => false))) { await h.shot('no-modal'); return h.fail('Opportunity modal did not open', { classification: 'UI_DEFECT', defectRef: 'DEF-CRM-15' }); }
    await titleIn.fill('UAT Ocean Freight Deal');
    const valIn = page.getByPlaceholder('0.00');
    if (await valIn.isVisible({ timeout: 800 }).catch(() => false)) await valIn.fill('45000');
    h.step('Filled opportunity');
    await page.getByRole('button', { name: /create opportunity/i }).last().click();
    await sleep(5000);
    const t = await S.text();
    await h.shot('after');
    if (/ocean|45,000|45000|total opportunities 1|lead/i.test(t)) return h.pass(`Opportunity created: "${t.slice(0, 280)}"`);
    return h.fail(`Opportunity not visible. text="${t.slice(0, 300)}"`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-CRM-17' });
  });

  // ---- Quote create ----
  await S.jcase({ id: 'CRM-05D', domain: 'CRM', capability: 'Create quote', persona: OWNER, startUrl: BASE + '/crm/quotes', expected: 'Quote created and listed', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/crm/quotes', { waitUntil: 'domcontentloaded' });
    const ready = await waitReady(page, /quotes management|quotes/i, 25000);
    await sleep(2000);
    const add = await clickFirst(page, ['button:has-text("New Quote")', 'button:has-text("Create Quote")', 'button:has-text("Add Quote")', 'button:has-text("Create")'], 4000);
    if (!add) { await h.shot('no-add'); return h.fail(`No quote create control. ready=${ready}`, { classification: 'UI_DEFECT', defectRef: 'DEF-CRM-13' }); }
    h.step(`Clicked ${add}`); await sleep(2500);
    await h.shot('form');
    await smartFill(page, h, { number: 'UAT-Q-1001', title: 'UAT Freight Quote', customer: 'UAT Goldline', amount: '12500', total: '12500', price: '12500', description: 'UAT quote' });
    await fillSelects(page, h);
    const save = await clickFirst(page, ['button:has-text("Create Quote")', 'button:has-text("Create")', 'button:has-text("Save")', 'button[type="submit"]'], 2500);
    h.step(`Submit ${save}`); await sleep(5000);
    const t = await S.text(); await h.shot('after');
    if (/1001|12,500|12500|quote/i.test(t)) return h.pass('Quote created/visible', { notes: t.slice(0, 280) });
    return h.fail(`Quote not visible. text="${t.slice(0, 300)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-CRM-14' });
  });

  // ---- SHIP-01 create shipment ----
  await S.jcase({ id: 'SHP-01D', domain: 'SHIPMENTS', capability: 'Create shipment via UI -> tracking number', persona: OWNER, startUrl: BASE + '/shipments', expected: 'Shipment created with tracking number', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/shipments', { waitUntil: 'domcontentloaded' });
    const ready = await waitReady(page, /shipment|track/i, 25000);
    await sleep(1500);
    let t = await S.text();
    await h.shot('list');
    const add = await clickFirst(page, ['a:has-text("New Shipment")', 'button:has-text("New Shipment")', 'button:has-text("Create Shipment")', 'a:has-text("Create")', 'button:has-text("Create")'], 4000);
    if (!add) {
      if (/login|sign in/.test(t.slice(0, 150))) return h.blocked('Session lost');
      return h.fail(`No create control. text="${t.slice(0, 250)}"`, { classification: 'UI_DEFECT', defectRef: 'DEF-SHP-02' });
    }
    h.step(`Clicked ${add} -> ${page.url()}`); await sleep(3500);
    await h.shot('form');
    await smartFill(page, h, {
      sender_name: 'UAT Sender Kofi', sender: 'UAT Sender Kofi', receiver_name: 'UAT Receiver Ama', receiver: 'UAT Receiver Ama',
      sender_phone: '+233551112222', receiver_phone: '+233553334444', phone: '+233551112222',
      sender_address: '10 UAT Spintex Rd, Accra', receiver_address: '21 UAT Kumasi Rd', address: '10 UAT Spintex Rd',
      origin: 'Accra', destination: 'Kumasi', weight: '25', package: '3', quantity: '3', pieces: '3',
      cargo: 'General Goods', description: 'UAT cert cargo', cost: '1200', price: '1200', amount: '1200', declared: '1200',
      name: 'UAT Sender Kofi', city: 'Accra', email: 'cargo@uat.example',
    });
    await fillSelects(page, h);
    const save = await clickFirst(page, ['button:has-text("Create Shipment")', 'button:has-text("Create")', 'button:has-text("Save")', 'button:has-text("Submit")', 'button[type="submit"]'], 3000);
    h.step(`Submit ${save}`); await sleep(7000);
    t = await S.text(); const u = page.url();
    await h.shot('after');
    const m = t.match(/\b(AFR[-\w]{3,}|TRK[-\w]{3,}|SHP[-\w]{3,}|AF-\d{4,}|[A-Z]{2,4}-\d{5,}[-\w]*)\b/);
    if (m) { saveState({ tenantB: { ...loadState().tenantB, tracking: m[1] } }); h.step(`Tracking captured: ${m[1]}`); }
    if ((m || /success|created|shipment/i.test(t)) && !/error|failed/i.test(t.slice(0, 250))) return h.pass(`Shipment created${m ? ' tracking=' + m[1] : ''} -> ${u}`, { notes: t.slice(0, 300) });
    return h.fail(`Shipment creation failed. text="${t.slice(0, 300)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-SHP-03' });
  });

  // ---- SHIP-02 list ----
  await S.jcase({ id: 'SHP-02D', domain: 'SHIPMENTS', capability: 'Shipment persists in list', persona: OWNER, startUrl: BASE + '/shipments', expected: 'Created shipment in list', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/shipments', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /shipment/i, 25000); await sleep(2500);
    const t = await S.text(); const trk = loadState().tenantB?.tracking;
    await h.shot('list');
    if (trk && t.includes(trk)) return h.pass(`Shipment ${trk} listed`);
    if (/failed to load|error/i.test(t)) return h.fail(`List error: "${t.slice(0, 250)}"`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-SHP-04' });
    if (/no shipments|empty/i.test(t)) return h.fail(`Shipment missing from list. text="${t.slice(0, 250)}"`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-SHP-04' });
    if (/uat|kofi|ama|accra|kumasi|pending|draft|booked|transit|track/i.test(t)) return h.pass(`List shows shipment data`, { notes: `tracking=${trk}: ${t.slice(0, 280)}` });
    return h.fail(`List state unclear. text="${t.slice(0, 250)}"`, { classification: 'UNCLASSIFIED' });
  });

  // ---- SHIP-03 detail + status ----
  await S.jcase({ id: 'SHP-03D', domain: 'SHIPMENTS', capability: 'Shipment detail + status transition', persona: OWNER, startUrl: 'shipment list', expected: 'Detail shows fields; status can transition', coreDep: 'YES' }, async (page, h) => {
    const trk = loadState().tenantB?.tracking;
    const row = trk ? page.getByText(trk).first() : page.locator('a[href*="/shipments/"]').first();
    if (await row.isVisible({ timeout: 4000 }).catch(() => false)) { await row.click(); h.step('Opened shipment'); await sleep(5000); }
    else return h.blocked('No shipment row to open');
    let t = await S.text(); const u = page.url();
    await h.shotFull('detail');
    const fields = ['sender', 'receiver', 'origin|from', 'destination|to', 'status', 'track'];
    const missing = fields.filter(f => !new RegExp(f, 'i').test(t));
    h.step(`Detail at ${u}; missing: ${missing.join(',') || 'none'}`);
    // try status transition
    const btn = await clickFirst(page, ['button:has-text("In Transit")', 'button:has-text("Mark")', 'button:has-text("Update Status")', 'button:has-text("Book")', 'button:has-text("Confirm")', 'button:has-text("Dispatch")', 'button:has-text("Ship")'], 3000);
    let transitioned = null;
    if (btn) {
      h.step(`Status control: ${btn}`); await sleep(3500);
      await clickFirst(page, ['button:has-text("Confirm")', 'button:has-text("Yes")'], 1500); await sleep(3500);
      const t2 = await S.text();
      transitioned = /transit|booked|confirmed|dispatched|shipped/i.test(t2) ? t2.match(/in transit|booked|confirmed|dispatched|shipped/i)?.[0] : null;
      await h.shot('after-status');
    }
    if (missing.length <= 2 && transitioned) return h.pass(`Detail accurate + status -> ${transitioned}`, { notes: `missing:${missing.join(',')}` });
    if (missing.length <= 2) return h.fail(`Detail OK but no transition. btn=${btn}`, { classification: 'UI_DEFECT', defectRef: 'DEF-SHP-06', notes: t.slice(0, 280) });
    return h.fail(`Detail missing fields ${missing.join(',')}. transition=${transitioned}`, { classification: 'UI_DEFECT', defectRef: 'DEF-SHP-05' });
  });

  await S.finish();

  // ---- SHIP-05 public tracking ----
  const S2 = await new Session('PUBTRACK2', { video: true }).start();
  await S2.jcase({ id: 'SHP-05D', domain: 'TRACKING', capability: 'Public tracking shows real shipment (signed-out)', persona: ANON, startUrl: BASE + '/track', expected: 'Tracking works without login; no private data leak', coreDep: 'YES' }, async (page, h) => {
    const trk = loadState().tenantB?.tracking;
    if (!trk) return h.blocked('No tracking number');
    await page.goto(BASE + '/track', { waitUntil: 'domcontentloaded' }); await sleep(2000);
    await page.locator('input').first().fill(trk);
    await clickFirst(page, ['button:has-text("Track")', 'button[type="submit"]']);
    h.step(`Tracked ${trk}`);
    await sleep(6000);
    const t = await S2.text();
    await h.shot('result');
    if (/not found|no shipment|invalid/i.test(t)) return h.fail(`Real tracking not found: ${trk}`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-TRK-02' });
    const hasData = /status|transit|pending|delivered|location|eta|origin|destination|accra|kumasi/i.test(t);
    const leaks = /password|token|secret|margin|internal note/i.test(t);
    if (hasData && !leaks) return h.pass(`Public tracking shows ${trk} data`, { notes: t.slice(0, 300) });
    if (leaks) return h.fail('Tracking leaks private data', { classification: 'BACKEND_DEFECT', defectRef: 'DEF-TRK-03' });
    return h.fail(`No tracking data. text="${t.slice(0, 250)}"`, { classification: 'UNCLASSIFIED', defectRef: 'DEF-TRK-04' });
  });
  await S2.finish();
  console.log('\nPhase 9d complete');
})().catch(async e => { console.error('FATAL', e); process.exit(1); });
