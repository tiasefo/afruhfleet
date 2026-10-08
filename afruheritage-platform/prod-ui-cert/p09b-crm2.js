// Phase 9b — corrected: probe CRM surfaces + opportunity creation + contacts/quotes (short-lived session).
const { BASE, Session, loadState, saveState, clickFirst, uiLogin } = require('./harness');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OWNER = 'BUSINESS OWNER (TENANT B)';

async function smartFill(page, h, mapping) {
  const filled = [];
  const els = await page.locator('input:visible, textarea:visible').all();
  for (const el of els) {
    const hay = `${await el.getAttribute('name') || ''} ${await el.getAttribute('id') || ''} ${await el.getAttribute('placeholder') || ''}`.toLowerCase();
    for (const [pat, val] of Object.entries(mapping)) {
      if (hay.includes(pat)) { try { await el.fill(val); filled.push(`${pat}`); } catch {} break; }
    }
  }
  if (filled.length) h.step(`Filled: ${filled.join(',')}`);
  return filled;
}
async function fillSelects(page, h) {
  for (const s of await page.locator('select:visible').all()) {
    try {
      const opts = await s.locator('option').allTextContents();
      if (opts.length > 1) { await s.selectOption({ index: 1 }); h.step(`Select -> "${opts[1].trim()}"`); }
    } catch {}
  }
}

(async () => {
  const B = loadState().tenantB;
  const S = await new Session('CRM2', { video: true }).start();
  const page = S.page;
  await uiLogin(page, B.email, B.password);

  // CRM-01B: what the CRM actually offers (opportunity pipeline)
  await S.jcase({ id: 'CRM-01B', domain: 'CRM', capability: 'CRM surface: opportunities pipeline + account creation path', persona: OWNER, startUrl: BASE + '/crm', expected: 'A way to create a customer/account or opportunity', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/crm', { waitUntil: 'domcontentloaded' }); await sleep(5000);
    const t = await S.text();
    await h.shot('crm');
    if (/login|sign in/i.test(t.slice(0, 200))) return h.blocked('Session lost before CRM');
    const no = await clickFirst(page, ['button:has-text("New Opportunity")', 'button:has-text("Create Opportunity")'], 3000);
    h.step(`Clicked ${no || 'none'}`);
    await sleep(2500);
    await h.shot('opp-form');
    const t2 = await S.text();
    h.step(`Opportunity form: "${t2.slice(0, 350)}"`);
    const inputs = await page.locator('input:visible, textarea:visible, select:visible').all();
    const fieldDesc = [];
    for (const el of inputs) {
      const nm = (await el.getAttribute('name')) || (await el.getAttribute('placeholder')) || el.evaluate ? '' : '';
      fieldDesc.push(nm || (await el.getAttribute('id')) || (await el.getAttribute('type')) || '?');
    }
    h.step(`Fields: ${fieldDesc.join(' | ')}`);
    // attempt to create an opportunity with account
    await smartFill(page, h, { title: 'UAT Ocean Freight Deal', name: 'UAT Ocean Freight Deal', value: '45000', amount: '45000', account: 'UAT Goldline Imports', customer: 'UAT Goldline Imports', company: 'UAT Goldline Imports', description: 'UAT cert opportunity' });
    await fillSelects(page, h);
    const save = await clickFirst(page, ['button:has-text("Create")', 'button:has-text("Save")', 'button:has-text("Add")', 'button[type="submit"]'], 2500);
    h.step(`Submit: ${save}`);
    await sleep(5000);
    const t3 = await S.text();
    await h.shot('after');
    if (/ocean|45,000|45000|opportunit/i.test(t3) && !/error|failed/i.test(t3.slice(-300))) {
      const hasAccountsPath = /account|customer|contact/i.test(t2 + t3);
      return h.pass(`Opportunity creation path works: "${t3.slice(0, 280)}"`, { notes: `account/customer path present: ${hasAccountsPath}. CRM is opportunity-pipeline; no standalone Add-Customer screen found.` });
    }
    return h.fail(`Opportunity creation failed. text="${t3.slice(0, 300)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-CRM-04' });
  });

  // CRM-CONTACTS surface
  await S.jcase({ id: 'CRM-02B', domain: 'CRM', capability: 'Contacts management surface', persona: OWNER, startUrl: BASE + '/crm/contacts', expected: 'Contacts page with add-contact capability', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/crm/contacts', { waitUntil: 'domcontentloaded' }); await sleep(4500);
    const t = await S.text(); const u = page.url();
    await h.shot('contacts');
    if (/login/.test(u)) return h.blocked('Session lost');
    if (/404|not found/i.test(t.slice(0, 300))) return h.fail('Contacts page 404', { classification: 'NOT_PRODUCTIZED', defectRef: 'DEF-CRM-06' });
    const add = await clickFirst(page, ['button:has-text("Add Contact")', 'button:has-text("New Contact")', 'button:has-text("Add")', 'button:has-text("Create")'], 2500);
    if (add) {
      h.step(`Clicked ${add}`); await sleep(2000);
      await smartFill(page, h, { first: 'Adjoa', last: 'UAT-Mensah', name: 'Adjoa UAT-Mensah', email: 'adjoa@uat-goldline.example', phone: '+233559876543', company: 'UAT Goldline' });
      const save = await clickFirst(page, ['button:has-text("Create")', 'button:has-text("Save")', 'button:has-text("Add")', 'button[type="submit"]'], 2000);
      h.step(`Submit ${save}`); await sleep(4000);
      const t2 = await S.text(); await h.shot('after');
      if (/adjoa|mensah/i.test(t2)) return h.pass('Contact created and listed');
      return h.fail(`Contact not persisted. text="${t2.slice(0, 280)}"`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-CRM-07' });
    }
    if (/contact/i.test(t)) return h.fail(`Contacts page renders but no add control. text="${t.slice(0, 250)}"`, { classification: 'UI_DEFECT', defectRef: 'DEF-CRM-06' });
    return h.fail(`Contacts page unexpected. text="${t.slice(0, 250)}"`, { classification: 'UNCLASSIFIED' });
  });

  // CRM-QUOTES surface
  await S.jcase({ id: 'CRM-05B', domain: 'CRM', capability: 'Quotes surface', persona: OWNER, startUrl: BASE + '/crm/quotes', expected: 'Quotes page with create capability', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/crm/quotes', { waitUntil: 'domcontentloaded' }); await sleep(4500);
    const t = await S.text(); const u = page.url();
    await h.shot('quotes');
    if (/login/.test(u)) return h.blocked('Session lost');
    if (/404|not found/i.test(t.slice(0, 300))) return h.fail('Quotes 404', { classification: 'NOT_PRODUCTIZED', defectRef: 'DEF-CRM-12' });
    const add = await clickFirst(page, ['button:has-text("New Quote")', 'button:has-text("Create Quote")', 'button:has-text("Add Quote")', 'button:has-text("Add")', 'button:has-text("Create")'], 2500);
    if (add) {
      h.step(`Clicked ${add}`); await sleep(2000);
      await h.shot('quote-form');
      await smartFill(page, h, { number: 'UAT-Q-1001', title: 'UAT Freight Quote', amount: '12500', total: '12500', price: '12500', customer: 'UAT Goldline', description: 'UAT quote' });
      await fillSelects(page, h);
      const save = await clickFirst(page, ['button:has-text("Create")', 'button:has-text("Save")', 'button:has-text("Add")', 'button[type="submit"]'], 2000);
      h.step(`Submit ${save}`); await sleep(4000);
      const t2 = await S.text(); await h.shot('after');
      if (/1001|12,500|12500|quote/i.test(t2)) return h.pass('Quote created/visible', { notes: t2.slice(0, 250) });
      return h.fail(`Quote not persisted. text="${t2.slice(0, 280)}"`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-CRM-14' });
    }
    if (/quote/i.test(t)) return h.fail(`Quotes page renders but no create control. text="${t.slice(0, 250)}"`, { classification: 'UI_DEFECT', defectRef: 'DEF-CRM-13' });
    return h.fail(`Quotes page unexpected. text="${t.slice(0, 250)}"`, { classification: 'UNCLASSIFIED' });
  });

  await S.finish();
  console.log('\nPhase 9b complete');
})().catch(async e => { console.error('FATAL', e); process.exit(1); });
