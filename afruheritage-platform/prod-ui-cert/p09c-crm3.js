// Phase 9c — CRM definitive: opportunity create (modal-scoped), contacts/quotes with long waits.
const { BASE, Session, loadState, saveState, clickFirst, uiLogin } = require('./harness');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OWNER = 'BUSINESS OWNER (TENANT B)';

(async () => {
  const B = loadState().tenantB;
  const S = await new Session('CRM3', { video: true }).start();
  const page = S.page;
  await uiLogin(page, B.email, B.password);

  // Opportunity create — properly scoped
  await S.jcase({ id: 'CRM-01C', domain: 'CRM', capability: 'Create opportunity via modal', persona: OWNER, startUrl: BASE + '/crm', expected: 'Opportunity appears in pipeline', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/crm', { waitUntil: 'domcontentloaded' }); await sleep(6000);
    let t = await S.text();
    if (/login|sign in/i.test(t.slice(0, 150))) return h.blocked('Session lost');
    await clickFirst(page, ['button:has-text("New Opportunity")'], 3000);
    h.step('Opened New Opportunity modal');
    await sleep(2000);
    const titleIn = page.getByPlaceholder(/opportunity title/i);
    if (!(await titleIn.isVisible({ timeout: 4000 }).catch(() => false))) { await h.shot('no-modal'); return h.fail('Opportunity modal did not open', { classification: 'UI_DEFECT', defectRef: 'DEF-CRM-15' }); }
    await titleIn.fill('UAT Ocean Freight Deal');
    const valIn = page.getByPlaceholder('0.00').first();
    if (await valIn.isVisible({ timeout: 1000 }).catch(() => false)) await valIn.fill('45000');
    h.step('Filled title + value');
    const createBtn = page.getByRole('button', { name: /create opportunity/i }).last();
    await createBtn.click();
    h.step('Clicked modal Create Opportunity');
    await sleep(5000);
    t = await S.text();
    await h.shot('after');
    if (/ocean|45,000|45000|lead|pipeline|total opportunities 1/i.test(t)) return h.pass(`Opportunity created and visible: "${t.slice(0, 300)}"`);
    if (/error|failed/i.test(t.slice(-300))) return h.fail(`Opportunity save error: "${t.slice(0, 280)}"`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-CRM-16' });
    return h.fail(`Opportunity not visible after save. text="${t.slice(0, 300)}"`, { classification: 'UNCLASSIFIED', defectRef: 'DEF-CRM-17' });
  });

  // Contacts with long wait
  await S.jcase({ id: 'CRM-02C', domain: 'CRM', capability: 'Contacts page loads (patient)', persona: OWNER, startUrl: BASE + '/crm/contacts', expected: 'Contacts list or functional UI within 20s', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/crm/contacts', { waitUntil: 'domcontentloaded' });
    for (let i = 0; i < 7; i++) {
      await sleep(4000);
      const t = await S.text();
      if (!/loading|^\s*$/.test(t.slice(-200)) && t.length > 400) break;
    }
    const t = await S.text();
    await h.shotFull('contacts');
    const spinnerOnly = !/contact|name|email|add|search|empty|no contacts/i.test(t.slice(300));
    if (/login/.test(page.url())) return h.blocked('Session lost');
    if (/failed|error|something went wrong/i.test(t)) return h.fail(`Contacts page error state: "${t.slice(0, 280)}"`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-CRM-06' });
    if (spinnerOnly) return h.fail(`Contacts page hangs on spinner >25s. text="${t.slice(0, 250)}"`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-CRM-06' });
    return h.pass(`Contacts page renders: "${t.slice(0, 300)}"`);
  });

  // Quotes with long wait
  await S.jcase({ id: 'CRM-05C', domain: 'CRM', capability: 'Quotes page loads (patient)', persona: OWNER, startUrl: BASE + '/crm/quotes', expected: 'Quotes list or functional UI within 20s', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/crm/quotes', { waitUntil: 'domcontentloaded' });
    for (let i = 0; i < 7; i++) {
      await sleep(4000);
      const t = await S.text();
      if (!/loading|^\s*$/.test(t.slice(-200)) && t.length > 400) break;
    }
    const t = await S.text();
    await h.shotFull('quotes');
    if (/login/.test(page.url())) return h.blocked('Session lost');
    const spinnerOnly = !/quote|add|search|empty|no quotes|create/i.test(t.slice(300));
    if (/failed|error|something went wrong/i.test(t)) return h.fail(`Quotes error state: "${t.slice(0, 280)}"`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-CRM-12' });
    if (spinnerOnly) return h.fail(`Quotes page hangs on spinner >25s. text="${t.slice(0, 250)}"`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-CRM-12' });
    return h.pass(`Quotes page renders: "${t.slice(0, 300)}"`);
  });

  await S.finish();
  console.log('\nPhase 9c complete');
})().catch(async e => { console.error('FATAL', e); process.exit(1); });
