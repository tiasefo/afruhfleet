// Retest: GJ-07 business settings persist (fill by placeholder, verify via input value).
const { BASE, Session, loadState, uiLogin, clickFirst } = require('./harness');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OWNER = 'BUSINESS OWNER';

(async () => {
  const A = loadState().tenantA;
  const S = await new Session('GJ07R', { video: true }).start();
  const page = S.page;
  await S.jcase({ id: 'GJ-07', domain: 'TENANT', capability: 'Business profile & settings update', persona: OWNER, startUrl: BASE + '/settings', expected: 'Business contact info editable and persisted', coreDep: 'YES' }, async (page, h) => {
    await uiLogin(page, A.email, A.password, { waitMs: 90000 });
    await page.goto(BASE + '/settings', { waitUntil: 'domcontentloaded' }); await sleep(3500);
    await h.shot('settings');
    const marker = '+233550009911';
    const phone = page.locator('input[placeholder="+233 30 123 4567"]').first();
    if (!(await phone.isVisible({ timeout: 4000 }).catch(() => false))) {
      const comp = page.locator('input[placeholder="Enter company name"]').first();
      if (!(await comp.isVisible().catch(() => false))) return h.fail(`No editable business field found. text="${(await S.text()).slice(0, 300)}"`, { classification: 'UI_DEFECT', defectRef: 'DEF-SET-02' });
    }
    await phone.fill(marker);
    h.step(`Filled support phone with ${marker}`);
    const comp = page.locator('input[placeholder="Enter company name"]').first();
    if (await comp.isVisible().catch(() => false)) {
      const cur = await comp.inputValue().catch(() => '');
      if (/^\+|^\d/.test(cur)) { await comp.fill('UATCERT Meridian Freight 3'); h.step(`Restored company name from "${cur}"`); }
    }
    const saveWait = page.waitForResponse(r => r.request().method() !== 'GET' && /afruheritage\.com\/api|api\.afruheritage\.com/.test(r.url()), { timeout: 30000 }).catch(() => null);
    const saved = await clickFirst(page, ['button:has-text("Save")', 'button:has-text("Update")', 'button[type="submit"]'], 3000);
    h.step(`Clicked ${saved || 'no-save-button'}`);
    const r = await saveWait;
    if (r) h.step(`save response: ${r.request().method()} ${r.url().slice(-80)} -> ${r.status()}`);
    await sleep(2500);
    await page.reload({ waitUntil: 'domcontentloaded' }); await sleep(3500);
    await h.shot('after-reload');
    const val = await phone.inputValue().catch(() => '');
    if (val.includes('550009911')) return h.pass(`Settings updated and persisted after reload (support_phone="${val}")`);
    return h.fail(`Setting did not persist after reload. field="${val}"`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-SET-01' });
  });
  await S.finish();
  console.log('GJ-07 retest done');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
