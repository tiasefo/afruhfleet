// REMEDIATION RETEST 2 — shipment create (full form) + branding persist.
const { Session, loadState, uiLogin, clickFirst, BASE } = require('./harness');

const state = loadState();
const B = state.tenantB;

async function selectOption(page, comboIndex, optionText) {
  const combo = page.locator('button[role="combobox"]').nth(comboIndex);
  await combo.click();
  await page.waitForTimeout(600);
  const opt = page.locator(`[role="option"]:has-text("${optionText}")`).first();
  await opt.click({ timeout: 5000 });
  await page.waitForTimeout(400);
}

async function main() {
  const s = await new Session('REMED-CREATE', { video: true }).start();
  s.step('login as Tenant B owner');
  await uiLogin(s.page, B.email, B.password);
  console.log('  logged in at', s.url());

  await s.jcase({
    id: 'R1-SHIP-CREATE2', domain: 'LOGISTICS', capability: 'Create shipment via UI (complete form)',
    persona: 'Tenant B owner', startUrl: BASE + '/shipments/new', expected: 'Shipment created, tracking number visible, persists in list', coreDep: 'YES',
  }, async (page, ctx) => {
    ctx.step('goto /shipments/new');
    await page.goto(BASE + '/shipments/new', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    const fillPh = async (ph, val, nth = 0) => {
      const loc = page.locator(`input[placeholder="${ph}"]`).nth(nth);
      await loc.fill(val);
    };
    await fillPh('Enter sender name', 'REMED Sender Bravo');
    await fillPh('Enter complete address', '12 Liberation Road, Accra', 0);
    await fillPh('Enter city', 'Accra', 0);
    await fillPh('Enter country', 'Ghana', 0);
    await fillPh('Enter receiver name', 'REMED Receiver K');
    await fillPh('Enter complete address', '4 Harper Road, Kumasi', 1);
    await fillPh('Enter city', 'Kumasi', 1);
    await fillPh('Enter country', 'Ghana', 1);
    ctx.step('text fields filled');

    // comboboxes in DOM order: currency(0), origin_country(1), origin_city(2), dest_country(3), dest_city(4)
    await selectOption(page, 1, 'Ghana');
    await page.waitForTimeout(800);
    await selectOption(page, 2, 'Accra');
    await selectOption(page, 3, 'Ghana');
    await page.waitForTimeout(800);
    await selectOption(page, 4, 'Kumasi');
    ctx.step('origin/destination selected');

    // required numeric inputs: package_count (no placeholder), weight_kg ("0.0")
    const nums = page.locator('input[type="number"][required]');
    const ncount = await nums.count();
    const vals = ['2', '15', '1', '0.5', '0.4', '0.6', '250'];
    for (let i = 0; i < ncount; i++) {
      const cur = await nums.nth(i).inputValue().catch(() => '');
      if (!cur || cur === '0' || cur === '0.0') await nums.nth(i).fill(vals[i] || '1');
    }
    ctx.step('numeric required filled: ' + ncount);
    await fillPh('0.00', '250');
    await fillPh('e.g., Electronics, Clothing', 'General Cargo');
    await ctx.shot('form-filled');

    const btn = await clickFirst(page, ['button:has-text("Create Shipment")']);
    ctx.step('submit clicked=' + btn);

    let ok = false; let detail = '';
    for (let i = 0; i < 25; i++) {
      await page.waitForTimeout(1500);
      const t = await ctx.text();
      if (/failed to create|please fill in all required/i.test(t)) { detail = t; break; }
      if (!page.url().includes('/shipments/new')) { ok = true; detail = t; break; }
      if (/created successfully|shipment.*created/i.test(t)) { ok = true; detail = t; break; }
    }
    await ctx.shot('after-submit');
    ctx.step('url=' + page.url());

    // verify persistence in list — require the sender name to appear
    await page.goto(BASE + '/shipments', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(8000);
    const lt = await ctx.text();
    await ctx.shot('list-after');
    if (ok && /REMED Sender Bravo|REMED Receiver K/i.test(lt)) {
      const track = (lt.match(/[A-Z]{2,5}-\d{4,}/) || [])[0] || '';
      return ctx.pass(`Shipment created${track ? ' (' + track + ')' : ''} and visible in list`);
    }
    return ctx.fail('Create failed or not persisted. ok=' + ok + ' detail=' + detail.slice(0, 250) + ' | list=' + lt.slice(0, 200));
  });

  await s.jcase({
    id: 'R1-BRANDING2', domain: 'SETTINGS', capability: 'Branding change persists after reload',
    persona: 'Tenant B owner', startUrl: BASE + '/settings', expected: 'Save → reload → value persists', coreDep: 'YES',
  }, async (page, ctx) => {
    await page.goto(BASE + '/settings', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(7000);
    const marker = '+233-REMED-' + String(Date.now()).slice(-5);
    const phoneInput = page.locator('input[placeholder="+233 30 123 4567"]').first();
    if (!(await phoneInput.isVisible({ timeout: 4000 }).catch(() => false))) {
      await ctx.shot('settings');
      return ctx.fail('Support phone field not found on settings page');
    }
    await phoneInput.fill(marker);
    ctx.step('marker=' + marker);
    const saved = await clickFirst(page, ['button:has-text("Save Changes")', 'button:has-text("Save")', 'button[type="submit"]']);
    ctx.step('save=' + saved);
    await page.waitForTimeout(5000);
    await ctx.shot('after-save');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(7000);
    await ctx.shot('after-reload');
    const val = await phoneInput.inputValue().catch(() => '');
    if (val === marker) return ctx.pass('Persisted after reload: ' + val);
    return ctx.fail(`After reload value="${val}" expected "${marker}"`);
  });

  await s.finish();
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
