// P21b — rerun driver creation on the P21 tenant (label-targeted fills).
const { BASE, Session, loadState, saveState, uiLogin, clickFirst } = require('./harness');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OWNER = 'BUSINESS OWNER';

async function fillLabel(page, label, val) {
  try {
    const l = page.locator(`label:has-text("${label}")`).first();
    const input = l.locator('..').locator('input').first();
    await input.fill(val);
    return true;
  } catch { return false; }
}

(async () => {
  const st = loadState();
  const p21 = st.p21;
  const SP = await new Session('P21B', { video: true }).start();
  await SP.jcase({ id: 'P21-04R', domain: 'FLEET', capability: 'Create driver via UI', persona: OWNER, startUrl: BASE + '/dashboard/fleetops/drivers', expected: 'Driver created and listed by name', coreDep: 'YES' }, async (page, h) => {
    await uiLogin(page, p21.email, p21.password, { waitMs: 60000 });
    await page.goto(BASE + '/dashboard/fleetops/drivers', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    if (/login|onboarding/.test(page.url())) return h.blocked(`Redirected to ${page.url()}`);
    const addBtn = await clickFirst(page, ['button:has-text("Add Driver")', 'button:has-text("New Driver")', 'button:has-text("Create Driver")'], 3000);
    if (!addBtn) return h.fail('No driver creation control', { classification: 'PRODUCT_DEFECT' });
    await sleep(1200);
    const ok1 = await fillLabel(page, 'Full Name', 'Yaw Handover Driver');
    const ok2 = await fillLabel(page, 'Phone', '+233557700123');
    const ok3 = await fillLabel(page, 'Email', 'yaw.handover@example.com');
    h.step(`filled name=${ok1} phone=${ok2} email=${ok3}`);
    await clickFirst(page, ['button:has-text("Save")', 'button:has-text("Add")', 'button:has-text("Create Driver")'], 3000);
    await sleep(4000);
    const t = await SP.text(); await h.shot('driver-after');
    if (/Yaw Handover Driver/i.test(t)) return h.pass('Driver created and visible by name in list');
    return h.fail(`Driver name not visible. text="${t.slice(0, 300)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-FLEET-01' });
  });
  await SP.finish();
  console.log('=== P21B COMPLETE ===');
  process.exit(0);
})().catch(e => { console.error('P21B FATAL:', e); process.exit(1); });
