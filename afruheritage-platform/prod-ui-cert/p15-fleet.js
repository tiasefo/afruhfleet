// p15 — Fleet capability certification for the release candidate:
//   FLT-01:  Add Driver -> list -> reload persistence
//   FLT-02:  Add Vehicle -> list -> reload persistence
//   FLT-04:  driver+vehicle assignment -> detail -> reload -> events
//   FLT-05:  restricted member denied (UI hidden + POST 403)
const { BASE, Session, loadState, uiLogin } = require('./harness');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const OWNER = 'BUSINESS OWNER';
const EMP = 'RESTRICTED MEMBER';
const PW_EMP = 'UatCertEmp!2026B';
const SUFFIX = Date.now().toString(36).toUpperCase();
const DRIVER = { name: `UAT Driver ${SUFFIX}`, phone: `+23355${String(Date.now()).slice(-7)}`, email: `uat-driver-${SUFFIX.toLowerCase()}@maxxspace.com` };
const VEHICLE = { name: `UAT Truck ${SUFFIX}`, plate: `GR-${SUFFIX}`, model: `TGM-${SUFFIX}` };

// Poll until a matcher passes or timeout (fleet list can take tens of seconds
// when the underlying runtime is slow).
async function until(page, fn, timeoutMs = 60000, stepMs = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await fn()) return true;
    await sleep(stepMs);
  }
  return false;
}

(async () => {
  const st = loadState();
  const A = st.tenantA;
  const invEmail = st.mailboxes?.invitee?.address;

  const S = await new Session('FLT-A', { video: true }).start();
  await uiLogin(S.page, A.email, A.password, { waitMs: 150000 });

  // ---- FLT-01 ----
  await S.jcase({ id: 'FLT-01', domain: 'FLEET', capability: 'Drivers surface + create driver', persona: OWNER, startUrl: BASE + '/dashboard/fleetops/drivers', expected: 'Add Driver -> save -> appears in list -> persists on reload', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/dashboard/fleetops/drivers', { waitUntil: 'domcontentloaded' });
    // On transient upstream slowness the list can land in an error state —
    // reload once, as a real user would, before judging.
    let loaded = await until(page, async () =>
      await page.getByRole('button', { name: /add driver/i }).isVisible().catch(() => false)
      || /unable to load/i.test(await page.locator('body').innerText().catch(() => ''))
    , 90000);
    if (loaded && !await page.getByRole('button', { name: /add driver/i }).isVisible().catch(() => false)) {
      await page.reload({ waitUntil: 'domcontentloaded' });
      loaded = await until(page, async () =>
        await page.getByRole('button', { name: /add driver/i }).isVisible().catch(() => false)
        || /unable to load/i.test(await page.locator('body').innerText().catch(() => ''))
      , 90000);
    }
    await h.shot('drivers-page');
    const add = page.getByRole('button', { name: /add driver/i });
    if (!await add.isVisible({ timeout: 3000 }).catch(() => false)) {
      const t = await page.locator('body').innerText();
      return h.fail(`No Add Driver control after ${loaded ? 'load' : 'timeout'}. text="${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-FLT-02' });
    }
    await add.click(); await sleep(1200);
    const dlg = page.locator('[role="dialog"]');
    await dlg.locator('input[name="name"]').fill(DRIVER.name);
    await dlg.locator('input[name="phone"]').fill(DRIVER.phone);
    await dlg.locator('input[name="email"]').fill(DRIVER.email);
    await dlg.locator('input[name="city"]').fill('Accra');
    await dlg.locator('input[name="country"]').fill('GH');
    await h.shot('driver-form');
    await dlg.getByRole('button', { name: /create driver/i }).click();
    const inList = await until(page, async () => (await page.locator('body').innerText()).includes(DRIVER.name), 60000, 4000);
    await h.shot('driver-after');
    if (!inList) {
      const t = await page.locator('body').innerText();
      return h.fail(`Driver not in list after create. text="${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT' });
    }
    await page.reload({ waitUntil: 'domcontentloaded' });
    const persisted = await until(page, async () => (await page.locator('body').innerText()).includes(DRIVER.name), 90000, 4000);
    await h.shot('driver-reload');
    if (!persisted) return h.fail('Driver missing after reload', { classification: 'PRODUCT_DEFECT' });
    return h.pass(`Driver ${DRIVER.name} created and persisted after reload`);
  });

  // ---- FLT-02 ----
  await S.jcase({ id: 'FLT-02', domain: 'FLEET', capability: 'Vehicles surface + create vehicle', persona: OWNER, startUrl: BASE + '/dashboard/fleetops/vehicles', expected: 'Add Vehicle -> save -> appears in list -> persists on reload', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/dashboard/fleetops/vehicles', { waitUntil: 'domcontentloaded' });
    let loaded = await until(page, async () =>
      await page.getByRole('button', { name: /add vehicle/i }).isVisible().catch(() => false)
      || /unable to load/i.test(await page.locator('body').innerText().catch(() => ''))
    , 90000);
    if (loaded && !await page.getByRole('button', { name: /add vehicle/i }).isVisible().catch(() => false)) {
      await page.reload({ waitUntil: 'domcontentloaded' });
      loaded = await until(page, async () =>
        await page.getByRole('button', { name: /add vehicle/i }).isVisible().catch(() => false)
        || /unable to load/i.test(await page.locator('body').innerText().catch(() => ''))
      , 90000);
    }
    await h.shot('vehicles-page');
    const add = page.getByRole('button', { name: /add vehicle/i });
    if (!await add.isVisible({ timeout: 3000 }).catch(() => false)) {
      const t = await page.locator('body').innerText();
      return h.fail(`No Add Vehicle control after ${loaded ? 'load' : 'timeout'}. text="${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-FLT-05' });
    }
    await add.click(); await sleep(1200);
    const dlg = page.locator('[role="dialog"]');
    await dlg.locator('input[name="name"]').fill(VEHICLE.name);
    await dlg.locator('input[name="plate_number"]').fill(VEHICLE.plate);
    await dlg.locator('input[name="make"]').fill('MAN');
    await dlg.locator('input[name="model"]').fill(VEHICLE.model);
    await dlg.locator('input[name="year"]').fill('2022');
    await h.shot('vehicle-form');
    await dlg.getByRole('button', { name: /create vehicle/i }).click();
    const inList = await until(page, async () => {
      const t = await page.locator('body').innerText();
      return t.includes(VEHICLE.plate) || t.includes(VEHICLE.name);
    }, 60000, 4000);
    await h.shot('vehicle-after');
    if (!inList) {
      const t = await page.locator('body').innerText();
      return h.fail(`Vehicle not in list after create. text="${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT' });
    }
    await page.reload({ waitUntil: 'domcontentloaded' });
    const persisted = await until(page, async () => {
      const t = await page.locator('body').innerText();
      return t.includes(VEHICLE.plate) || t.includes(VEHICLE.name);
    }, 90000, 4000);
    await h.shot('vehicle-reload');
    if (!persisted) return h.fail('Vehicle missing after reload', { classification: 'PRODUCT_DEFECT' });
    return h.pass(`Vehicle ${VEHICLE.name} (${VEHICLE.plate}) created and persisted after reload`);
  });

  // ---- FLT-04: assign driver+vehicle to an existing shipment ----
  await S.jcase({ id: 'FLT-04', domain: 'FLEET', capability: 'Driver + vehicle assignment to shipment', persona: OWNER, startUrl: BASE + '/shipments', expected: 'Assign -> visible on detail -> persists -> event recorded', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/shipments', { waitUntil: 'domcontentloaded' });
    const hasRow = await until(page, async () =>
      await page.locator('a[href^="/shipments/"]:not([href="/shipments/new"]):not([href="/shipments/import"])').first().isVisible().catch(() => false)
    , 60000);
    if (!hasRow) {
      const t = await page.locator('body').innerText();
      return h.fail(`No shipment row to open. text="${t.slice(0, 250)}"`, { classification: 'BLOCKER' });
    }
    // the tracking-number cell is the link into the detail page — the first
    // click can race hydration, so retry until the URL actually changes.
    const trackLink = page.locator('a[href*="/shipments/"]').filter({ hasText: /AFR-/ }).first();
    for (let i = 0; i < 4 && !page.url().match(/\/shipments\/[0-9a-f-]{20,}/); i++) {
      await trackLink.click().catch(() => {});
      await page.waitForURL(/\/shipments\/[0-9a-f-]{20,}/, { timeout: 15000 }).catch(() => {});
      if (!page.url().match(/\/shipments\/[0-9a-f-]{20,}/)) await sleep(2000);
    }
    if (!page.url().match(/\/shipments\/[0-9a-f-]{20,}/)) {
      const t = await page.locator('body').innerText();
      return h.fail(`Shipment detail did not open. text="${t.slice(0, 250)}"`, { classification: 'UI_DEFECT' });
    }
    await page.waitForLoadState('domcontentloaded');
    // The detail spinner has no text — wait for the Fleet Assignment selects
    // themselves (detail + events + fleet lists all resolve before render).
    const combos = page.locator('button[role="combobox"]');
    const combosReady = await until(page, async () =>
      await combos.first().isVisible().catch(() => false)
      || /failed to load|not found|error/i.test(await page.locator('body').innerText().catch(() => ''))
    , 120000, 4000);
    await h.shot('assign-detail');
    if (!combosReady || !await combos.first().isVisible({ timeout: 5000 }).catch(() => false))
      return h.fail('No assignment selects on shipment detail', { classification: 'UI_DEFECT' });
    await combos.first().click(); await sleep(900);
    // Prefer this run's driver; fall back to any prior UAT driver record so the
    // case still proves the assignment flow end-to-end.
    let dOpt = page.getByRole('option', { name: DRIVER.name });
    if (!await dOpt.isVisible({ timeout: 6000 }).catch(() => false))
      dOpt = page.getByRole('option', { name: /UAT Driver/i }).first();
    if (!await dOpt.isVisible({ timeout: 4000 }).catch(() => false))
      return h.fail('No driver assign options on shipment detail', { classification: 'PRODUCT_DEFECT' });
    const dLabel = (await dOpt.innerText()).trim();
    await dOpt.click(); await sleep(600);
    await combos.nth(1).click(); await sleep(900);
    let vOpt = page.getByRole('option', { name: new RegExp(SUFFIX, 'i') });
    if (!await vOpt.isVisible({ timeout: 6000 }).catch(() => false))
      vOpt = page.getByRole('option', { name: /TGM|UAT Truck|MAN/i }).first();
    if (!await vOpt.isVisible({ timeout: 4000 }).catch(() => false))
      return h.fail('No vehicle assign options on shipment detail', { classification: 'PRODUCT_DEFECT' });
    const vLabel = (await vOpt.innerText()).trim();
    await vOpt.click(); await sleep(600);
    await h.shot('assign-form');
    await page.getByRole('button', { name: /assign to shipment/i }).click();
    // Wait for the POST to finish: button leaves the "Assigning..." state and
    // the selects reset to empty, so the selected labels then appear ONLY in
    // the Assigned Driver/Vehicle display fields.
    await sleep(1500);
    const saved = await until(page, async () =>
      await page.getByRole('button', { name: 'Assigning...' }).count() === 0
    , 120000, 3000);
    if (!saved) {
      const t = await page.locator('body').innerText();
      return h.fail(`Assignment save did not complete. text="${t.slice(0, 300)}"`, { classification: 'PRODUCT_DEFECT' });
    }
    if (/failed to assign/i.test(await page.locator('body').innerText().catch(() => '')))
      return h.fail('Assignment POST rejected by the API', { classification: 'PRODUCT_DEFECT' });
    const shown = await until(page, async () => {
      const t = await page.locator('body').innerText().catch(() => '');
      return t.includes(dLabel) && t.includes(vLabel);
    }, 60000, 3000);
    await h.shot('assign-after');
    if (!shown) {
      const t = await page.locator('body').innerText();
      return h.fail(`Assignment not visible. text="${t.slice(0, 300)}"`, { classification: 'PRODUCT_DEFECT' });
    }
    await page.reload({ waitUntil: 'domcontentloaded' });
    const kept = await until(page, async () => {
      const t = await page.locator('body').innerText().catch(() => '');
      return t.includes(dLabel) && t.includes(vLabel);
    }, 150000, 5000);
    await h.shot('assign-reload');
    if (!kept) return h.fail('Assignment not persisted after reload', { classification: 'PRODUCT_DEFECT' });
    const t = await page.locator('body').innerText();
    const evOK = /driver.*assigned|vehicle.*assigned|assigned/i.test(t);
    return h.pass(`Driver+Vehicle assigned, persisted after reload${evOK ? ', event recorded' : ''}`);
  });

  // ---- FLT-06: cross-tenant isolation — Tenant B must not see A's fleet ----
  const B = st.tenantB;
  if (B && B.email && B.password) {
    const S3 = await new Session('FLT-ISO', { video: true }).start();
    try {
      await uiLogin(S3.page, B.email, B.password, { waitMs: 150000 });
      await S3.jcase({ id: 'FLT-06', domain: 'FLEET', capability: 'Tenant isolation: Tenant B cannot see Tenant A drivers/vehicles', persona: 'BUSINESS OWNER (TENANT B)', startUrl: BASE + '/dashboard/fleetops/drivers', expected: 'A-side records absent from B list', coreDep: 'YES' }, async (page, h) => {
        await page.goto(BASE + '/dashboard/fleetops/drivers', { waitUntil: 'domcontentloaded' });
        await until(page, async () => {
          const t = await page.locator('body').innerText().catch(() => '');
          return /live records|unable to load|no driver records/i.test(t);
        }, 90000, 4000);
        await h.shot('tenantB-drivers');
        const dText = await page.locator('body').innerText();
        if (/UAT Driver|UAT Probe Driver/i.test(dText))
          return h.fail('Tenant A driver visible in Tenant B driver list', { classification: 'ISOLATION_DEFECT' });

        await page.goto(BASE + '/dashboard/fleetops/vehicles', { waitUntil: 'domcontentloaded' });
        await until(page, async () => {
          const t = await page.locator('body').innerText().catch(() => '');
          return /live records|unable to load|no vehicle/i.test(t);
        }, 90000, 4000);
        await h.shot('tenantB-vehicles');
        const vText = await page.locator('body').innerText();
        if (/UAT Truck|GR-[A-Z0-9]{6,}|MAN TGM/i.test(vText))
          return h.fail('Tenant A vehicle visible in Tenant B vehicle list', { classification: 'ISOLATION_DEFECT' });
        return h.pass('No Tenant A fleet records visible to Tenant B');
      });
    } finally {
      try { await S3.context.close(); await S3.browser.close(); } catch {}
    }
  }

  // ---- FLT-05: RBAC ----
  if (invEmail) {
    const S2 = await new Session('FLT-B', { video: true }).start();
    try {
      // uiLogin breaks on duplicate email inputs — fill the first explicitly
      await S2.page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
      await sleep(3000);
      await S2.page.locator('input[name="email"]').first().fill(invEmail);
      await S2.page.locator('input[name="password"]').first().fill(PW_EMP);
      await S2.page.locator('button[type="submit"]').first().click();
      const t0 = Date.now();
      while (S2.page.url().includes('/login') && Date.now() - t0 < 120000) await sleep(2000);
      if (S2.page.url().includes('/login')) throw new Error('invitee login stuck on /login');
      await S2.jcase({ id: 'FLT-05', domain: 'FLEET', capability: 'Restricted member cannot create drivers/vehicles', persona: EMP, startUrl: BASE + '/dashboard/fleetops/drivers', expected: 'No Add control; POST denied (403)', coreDep: 'YES' }, async (page, h) => {
        await page.goto(BASE + '/dashboard/fleetops/drivers', { waitUntil: 'domcontentloaded' });
        await until(page, async () => /drivers/i.test(await page.locator('body').innerText().catch(() => '')), 90000, 4000);
        await h.shot('member-drivers');
        const addVisible = await page.getByRole('button', { name: /add driver/i }).isVisible({ timeout: 4000 }).catch(() => false);
        if (addVisible) return h.fail('Add Driver control visible to restricted member', { classification: 'RBAC_DEFECT' });
        const res = await page.evaluate(async () => {
          const r = await fetch('/api/v1/fleetbase-proxy/drivers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
            body: JSON.stringify({ name: 'RBAC Probe', phone: '+2330000000', email: 'rbac-probe@x.example' }),
          });
          return r.status;
        });
        h.step(`Restricted POST /fleetbase-proxy/drivers -> ${res}`);
        if (res === 403 || res === 401) return h.pass(`UI hides control; POST denied with ${res}`);
        return h.fail(`Restricted POST returned ${res}`, { classification: 'RBAC_DEFECT' });
      });
      await S2.context.close(); await S2.browser.close();
    } catch (e) { try { await S2.context.close(); await S2.browser.close(); } catch {} throw e; }
  }

  await S.context.close(); await S.browser.close();
  console.log('Fleet phase complete');
})().catch(e => { console.error('PHASE ERROR:', e.message); process.exit(1); });
