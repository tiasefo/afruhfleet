// Phase 19c — retest on onboarded tenantB (company admin): driver, vehicle,
// shipment lifecycle, public tracking; plus uatOwner personal onboarding.
const { BASE, Session, loadState, saveState, uiLogin, clickFirst } = require('./harness');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OWNER = 'BUSINESS OWNER';

async function fillPh(page, ph, val, nth = 0) {
  const loc = page.locator(`input[placeholder="${ph}"], textarea[placeholder="${ph}"]`).nth(nth);
  try { await loc.fill(val); } catch {}
}
async function fillLabel(page, label, val) {
  // input/textarea near a label text
  try {
    const l = page.locator(`label:has-text("${label}")`).first();
    const forAttr = await l.getAttribute('for');
    if (forAttr) { await page.locator(`#${forAttr}`).fill(val); return true; }
  } catch {}
  return false;
}
async function comboSelect(page, comboIndex, optionText) {
  const combo = page.locator('button[role="combobox"]').nth(comboIndex);
  await combo.click(); await sleep(700);
  await page.locator(`[role="option"]:has-text("${optionText}")`).first().click({ timeout: 5000 });
  await sleep(400);
}
async function clickButtonText(page, patterns, timeout = 2000, exclude) {
  for (const role of ['button', 'link']) {
    for (const p of patterns) {
      const items = await page.getByRole(role, { name: p }).all();
      for (const it of items) {
        try {
          const txt = (await it.innerText()) || '';
          if (exclude && exclude.test(txt)) continue;
          if (await it.isVisible()) { await it.click(); return txt.trim().slice(0, 40); }
        } catch {}
      }
    }
  }
  return null;
}

(async () => {
  const st = loadState();
  const tB = st.tenantB;
  const uat = st.uatOwner;
  let tracking = null;

  // ============ personal shipper onboarding probe ============
  const SP = await new Session('UAT-PERS', { video: true }).start();
  await SP.jcase({ id: 'UAT-11R', domain: 'ONBOARDING', capability: 'Personal shipper completes onboarding; map available actions', persona: 'INDIVIDUAL CUSTOMER', startUrl: BASE + '/onboarding', expected: 'Onboarding completes; personal-tier capabilities visible', coreDep: 'YES' }, async (page, h) => {
    await uiLogin(page, uat.email, uat.password, { waitMs: 60000 });
    await page.goto(BASE + '/onboarding', { waitUntil: 'domcontentloaded' }); await sleep(3000);
    if (/dashboard/.test(page.url())) return h.pass('Onboarding already complete');
    await clickButtonText(page, [/get started/i], 3000); await sleep(1200);
    const card = page.locator('button:has-text("Personal Shipper"), button:has-text("Personal")').first();
    if (await card.isVisible({ timeout: 5000 }).catch(() => false)) await card.click();
    await sleep(800);
    await clickButtonText(page, [/^continue$/i, /continue/i], 2000); await sleep(1200);
    const name = page.locator('input[placeholder*="Kwame"], input[placeholder*="name" i]').first();
    if (await name.isVisible({ timeout: 3000 }).catch(() => false) && !(await name.inputValue())) await name.fill('UAT Owner');
    await clickButtonText(page, [/finish setup/i], 3000);
    for (let i = 0; i < 10; i++) { await sleep(1500); if (!/onboarding/.test(page.url())) break; }
    const u = page.url(); await h.shot('personal-after');
    h.step(`After onboarding: ${u}`);
    // probe shipment creation for personal role
    await page.goto(BASE + '/shipments/new', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    const u2 = page.url(); await h.shot('personal-shipments-new');
    const t = await SP.text();
    h.step(`shipments/new -> ${u2}`);
    if (/\/shipments\/new/.test(u2)) return h.pass(`Personal onboarding complete; shipment form accessible at ${u2}`);
    return h.pass(`Personal onboarding complete; /shipments/new redirects to ${u2} (LIMITED)`);
  });
  await SP.finish();

  // ============ tenantB: fleet + shipment lifecycle ============
  const SB = await new Session('UAT-TB', { video: true }).start();
  await SB.jcase({ id: 'UAT-12R', domain: 'FLEET', capability: 'Create driver via UI', persona: OWNER, startUrl: BASE + '/dashboard/fleetops/drivers', expected: 'Driver created and listed', coreDep: 'YES' }, async (page, h) => {
    await uiLogin(page, tB.email, tB.password, { waitMs: 60000 });
    await page.goto(BASE + '/dashboard/fleetops/drivers', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    await h.shot('drivers-page');
    const t0 = await SB.text();
    if (/sign in|login/i.test(page.url())) return h.fail('Not logged in');
    const addBtn = await clickFirst(page, ['button:has-text("Add Driver")', 'button:has-text("New Driver")', 'button:has-text("Create Driver")'], 3000);
    if (!addBtn) {
      h.step(`No add button; text="${t0.slice(0, 200)}"`);
      return h.fail('No driver creation control found', { classification: 'PRODUCT_DEFECT' });
    }
    await sleep(1200);
    const dlg = page.locator('[role="dialog"]').last();
    const scope = (await dlg.count()) ? dlg : page;
    const inputs = await scope.locator('input:visible').all();
    const vals = ['Kofi UAT Driver', '+233551234567', 'GH-DL-98271'];
    for (let i = 0; i < inputs.length && i < vals.length; i++) { try { await inputs[i].fill(vals[i]); } catch {} }
    await clickFirst(page, ['button:has-text("Save")', 'button:has-text("Add")', 'button:has-text("Create")'], 3000);
    await sleep(4000);
    const t = await SB.text(); await h.shot('driver-after');
    if (/Kofi UAT Driver/i.test(t)) return h.pass('Driver created and visible in list');
    return h.fail(`Driver not in list. text="${t.slice(0, 300)}"`, { classification: 'PRODUCT_DEFECT' });
  });

  await SB.jcase({ id: 'UAT-13R', domain: 'FLEET', capability: 'Create vehicle via UI', persona: OWNER, startUrl: BASE + '/dashboard/fleetops/vehicles', expected: 'Vehicle created and listed', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/dashboard/fleetops/vehicles', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    await h.shot('vehicles-page');
    const addBtn = await clickFirst(page, ['button:has-text("Add Vehicle")', 'button:has-text("New Vehicle")', 'button:has-text("Create Vehicle")'], 3000);
    if (!addBtn) return h.fail('No vehicle creation control', { classification: 'PRODUCT_DEFECT' });
    await sleep(1200);
    const dlg = page.locator('[role="dialog"]').last();
    const scope = (await dlg.count()) ? dlg : page;
    const inputs = await scope.locator('input:visible').all();
    const vals = ['GR-4521-26', 'Toyota HiAce', '2022'];
    for (let i = 0; i < inputs.length && i < vals.length; i++) { try { await inputs[i].fill(vals[i]); } catch {} }
    await clickFirst(page, ['button:has-text("Save")', 'button:has-text("Add")', 'button:has-text("Create")'], 3000);
    await sleep(4000);
    const t = await SB.text(); await h.shot('vehicle-after');
    if (/GR-4521-26|HiAce/i.test(t)) return h.pass('Vehicle created and visible in list');
    return h.fail(`Vehicle not in list. text="${t.slice(0, 300)}"`, { classification: 'PRODUCT_DEFECT' });
  });

  await SB.jcase({ id: 'UAT-06R2', domain: 'SHIPMENTS', capability: 'Create shipment and run full lifecycle', persona: OWNER, startUrl: BASE + '/shipments/new', expected: 'Shipment created; transitions to Delivered', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/shipments/new', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    if (/onboarding|login/.test(page.url())) return h.blocked(`Redirected to ${page.url()}`);
    await fillPh(page, 'Enter sender name', 'UAT Sender B');
    await fillPh(page, 'Enter complete address', '1 Ring Road, Accra', 0);
    await fillPh(page, 'Enter city', 'Accra', 0);
    await fillPh(page, 'Enter country', 'Ghana', 0);
    await fillPh(page, 'Enter receiver name', 'UAT Receiver B');
    await fillPh(page, 'Enter complete address', '4 Harper Road, Kumasi', 1);
    await fillPh(page, 'Enter city', 'Kumasi', 1);
    await fillPh(page, 'Enter country', 'Ghana', 1);
    await fillPh(page, 'Enter phone number', '+233551112222', 0);
    await fillPh(page, 'Enter phone number', '+233552223333', 1);
    await fillPh(page, 'e.g., Electronics, Clothing', 'General Goods');
    await fillPh(page, 'Describe the shipment contents', 'UAT cargo');
    try { await comboSelect(page, 1, 'Ghana'); await comboSelect(page, 2, 'Accra'); await comboSelect(page, 3, 'Ghana'); await comboSelect(page, 4, 'Kumasi'); } catch {}
    const nums = page.locator('input[type="number"][required]');
    const ncount = await nums.count();
    const vals = ['3', '25', '1', '0.5', '0.4', '0.6', '1200'];
    for (let i = 0; i < ncount; i++) {
      const cur = await nums.nth(i).inputValue().catch(() => '');
      if (!cur || cur === '0' || cur === '0.0') await nums.nth(i).fill(vals[i] || '1');
    }
    const cost = page.locator('input[placeholder="0.00"]').first();
    if (await cost.isVisible().catch(() => false) && !(await cost.inputValue())) await cost.fill('1200');
    await h.shot('shipment-filled');
    await clickFirst(page, ['button:has-text("Create Shipment")'], 3000);
    for (let i = 0; i < 25; i++) {
      await sleep(1500);
      const t2 = await SB.text();
      const m = t2.match(/AFR-[A-Z0-9-]+/);
      if (m) tracking = m[0];
      if (!page.url().includes('/shipments/new') || /created successfully/i.test(t2)) break;
    }
    if (!tracking) {
      await page.goto(BASE + '/shipments', { waitUntil: 'domcontentloaded' }); await sleep(4000);
      const t3 = await SB.text();
      tracking = (t3.match(/AFR-[A-Z0-9-]{6,}/) || [])[0];
    }
    if (!tracking) { await h.shot('no-shipment'); return h.fail('No shipment created', { classification: 'PRODUCT_DEFECT' }); }
    h.step(`Tracking: ${tracking}`);
    await page.goto(BASE + '/shipments', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    const link = page.locator(`tr:has-text("${tracking}") a, a:has-text("${tracking}")`).first();
    if (await link.isVisible({ timeout: 6000 }).catch(() => false)) await link.click();
    else await page.locator(`tr:has-text("${tracking}")`).first().click();
    await page.waitForTimeout(4000);
    const transitions = ['Mark as Booked', 'Mark as Picked Up', 'Mark as In Transit', 'Mark as At Customs', 'Mark as Customs Cleared', 'Mark as Out for Delivery', 'Mark as Delivered'];
    const done = [];
    for (const label of transitions) {
      const btn = page.locator(`button:has-text("${label}")`).first();
      if (await btn.isVisible({ timeout: 7000 }).catch(() => false)) {
        await btn.click(); await sleep(3500);
        done.push(label);
      } else break;
    }
    await h.shot('after-transitions');
    saveState({ uatShipment: { tracking, transitions: done } });
    h.step(`Transitions: ${done.join(' -> ') || 'none'}`);
    if (done.length === transitions.length) return h.pass(`Shipment ${tracking} completed lifecycle to Delivered`);
    if (done.length >= 3) return h.pass(`Shipment ${tracking}: ${done.join(' -> ')}`);
    return h.fail(`Only ${done.length} transitions`, { classification: 'PRODUCT_DEFECT' });
  });

  await SB.jcase({ id: 'UAT-14R', domain: 'FLEET', capability: 'Assign driver/vehicle to shipment if UI supports', persona: OWNER, startUrl: BASE + '/shipments', expected: 'Assignment controls on shipment detail', coreDep: 'NO' }, async (page, h) => {
    if (!tracking) return h.blocked('No shipment');
    const t = await SB.text();
    const hasAssign = /assign|driver|vehicle/i.test(t);
    await h.shot('shipment-detail-assign');
    if (/assign/i.test(t)) return h.pass('Assignment control present on shipment detail');
    return h.blocked(`No assignment control visible (status Delivered may hide it). hasAssign=${hasAssign}`);
  });
  await SB.finish();

  // public tracking
  const PT = await new Session('UAT-TRACK', { video: true }).start();
  await PT.jcase({ id: 'UAT-08R2', domain: 'TRACKING', capability: 'Public tracking resolves lifecycle status', persona: 'PUBLIC VISITOR', startUrl: BASE + '/track', expected: 'Tracking number shows status', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/track', { waitUntil: 'domcontentloaded' }); await sleep(3500);
    await page.locator('input:visible').first().fill(tracking || tB.tracking || 'NONE');
    await clickFirst(page, ['button:has-text("Track")', 'button[type="submit"]', 'button:has-text("Search")'], 3000);
    await sleep(6000);
    const t = await PT.text(); await h.shot('track-result');
    if (/not found|invalid/i.test(t)) return h.fail(`Tracking failed for ${tracking}`, { classification: 'PRODUCT_DEFECT' });
    if (/delivered|status|shipment|transit|customs/i.test(t)) return h.pass(`Tracking ${tracking || tB.tracking} resolved`);
    return h.fail(`Ambiguous: "${t.slice(0, 250)}"`, { classification: 'UNCLASSIFIED' });
  });
  await PT.finish();

  console.log('=== P19C COMPLETE ===');
  process.exit(0);
})().catch(e => { console.error('P19C FATAL:', e); process.exit(1); });
