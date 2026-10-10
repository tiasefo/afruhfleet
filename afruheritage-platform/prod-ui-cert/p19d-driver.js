const { BASE, Session, loadState, uiLogin, clickFirst } = require('./harness');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const st = loadState();
  const tB = st.tenantB;
  const S = await new Session('UAT-DRV', { video: true }).start();
  await S.jcase({ id: 'UAT-12R2', domain: 'FLEET', capability: 'Create driver via UI', persona: 'BUSINESS OWNER', startUrl: BASE + '/dashboard/fleetops/drivers', expected: 'Driver created and listed', coreDep: 'YES' }, async (page, h) => {
    await uiLogin(page, tB.email, tB.password, { waitMs: 60000 });
    await page.goto(BASE + '/dashboard/fleetops/drivers', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    const btn = page.locator('button:has-text("+ Add Driver"), button:has-text("Add Driver")').first();
    if (!(await btn.isVisible({ timeout: 5000 }).catch(() => false))) return h.fail('No Add Driver control');
    await btn.click(); await sleep(1200);
    await page.locator('input[name="name"]').fill('Kofi UAT Driver');
    await page.locator('input[name="phone"]').fill('+233551234567');
    await page.locator('input[name="email"]').fill('kofi.driver@uat-mail.com');
    await page.locator('input[name="city"]').fill('Accra');
    await page.locator('input[name="country"]').fill('GH');
    await page.locator('button[type="submit"]:has-text("Create Driver"), button:has-text("Create Driver")').first().click();
    await sleep(5000);
    const t = await S.text(); await h.shot('driver-after');
    if (/Kofi UAT Driver/i.test(t)) return h.pass('Driver created and visible in list');
    const err = await page.locator('text=/Failed|error|invalid/i').first().innerText().catch(() => '');
    return h.fail(`Driver not in list. err="${err}" text="${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT' });
  });
  await S.finish();
  console.log('=== P19D COMPLETE ===');
  process.exit(0);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
