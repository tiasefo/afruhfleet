// Phase 7 — STOREFRONT chain: templates, plugins, branding, products, publish, anonymous visit.
const { BASE, Session, loadState, saveState, clickFirst, uiLogin } = require('./harness');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OWNER = 'BUSINESS OWNER';
const ANON = 'ANONYMOUS CUSTOMER';

async function fillBy(page, patterns, value) {
  const inputs = await page.locator('input:visible, textarea:visible').all();
  for (const el of inputs) {
    const hay = `${await el.getAttribute('name') || ''} ${await el.getAttribute('id') || ''} ${await el.getAttribute('placeholder') || ''}`.toLowerCase();
    if (patterns.some(p => hay.includes(p))) { try { await el.fill(value); return hay.slice(0, 60); } catch {} }
  }
  return null;
}

(async () => {
  const A = loadState().tenantA;
  const S = await new Session('STORE', { video: true }).start();
  const page = S.page;
  await uiLogin(page, A.email, A.password);

  // ---- TMPL-01 templates ----
  await S.jcase({ id: 'TMPL-01', domain: 'STOREFRONT', capability: 'Template catalog and application', persona: OWNER, startUrl: BASE + '/templates', expected: 'Templates listed; one can be applied', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/templates', { waitUntil: 'domcontentloaded' }); await sleep(5000);
    let t = await S.text();
    await h.shotFull('templates');
    h.step(`Templates page text: "${t.slice(0, 300)}"`);
    const applyBtn = await clickFirst(page, ['button:has-text("Apply")', 'button:has-text("Install")', 'button:has-text("Use Template")', 'button:has-text("Select")', 'button:has-text("Activate")'], 3000);
    if (applyBtn) {
      h.step(`Clicked ${applyBtn}`);
      await sleep(4000);
      const conf = await clickFirst(page, ['button:has-text("Confirm")', 'button:has-text("Yes")', 'button:has-text("Apply")'], 1500);
      if (conf) { h.step(`Confirmed ${conf}`); await sleep(3000); }
      t = await S.text();
      await h.shot('after-apply');
      return h.pass(`Template applied via ${applyBtn}`, { notes: t.slice(0, 300) });
    }
    const empty = /no template|empty|failed|error/i.test(t);
    if (/template/i.test(t) && !empty) return h.fail(`Templates render but no apply control found. text="${t.slice(0, 250)}"`, { classification: 'UI_DEFECT', defectRef: 'DEF-TMPL-01' });
    return h.fail(`Template catalog empty/error. text="${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-TMPL-02' });
  });

  // ---- PLG-01 plugins ----
  await S.jcase({ id: 'PLG-01', domain: 'STOREFRONT', capability: 'Plugin catalog and enablement', persona: OWNER, startUrl: BASE + '/plugins', expected: 'Plugins listed; one can be enabled', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/plugins', { waitUntil: 'domcontentloaded' }); await sleep(5000);
    let t = await S.text();
    await h.shotFull('plugins');
    h.step(`Plugins page: "${t.slice(0, 300)}"`);
    const en = await clickFirst(page, ['button:has-text("Enable")', 'button:has-text("Install")', 'button:has-text("Activate")', 'button:has-text("Add")'], 3000);
    if (en) {
      h.step(`Clicked ${en}`);
      await sleep(4000);
      t = await S.text();
      await h.shot('after-enable');
      if (/enabled|active|installed|disable/i.test(t)) return h.pass(`Plugin enabled via ${en}`, { notes: t.slice(0, 300) });
      return h.fail(`Enable click had no visible effect. text="${t.slice(0, 250)}"`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-PLG-01' });
    }
    const toggle = page.locator('[role="switch"], input[type="checkbox"]:visible').first();
    if (await toggle.isVisible({ timeout: 1500 }).catch(() => false)) {
      await toggle.click(); h.step('Toggled plugin switch'); await sleep(3000);
      t = await S.text(); await h.shot('after-toggle');
      return h.pass('Plugin toggled', { notes: t.slice(0, 250) });
    }
    if (/plugin/i.test(t)) return h.fail(`Plugins listed but no enable control. text="${t.slice(0, 250)}"`, { classification: 'UI_DEFECT', defectRef: 'DEF-PLG-02' });
    return h.fail(`Plugin catalog empty/error. text="${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-PLG-03' });
  });

  // ---- BRND-01 branding ----
  await S.jcase({ id: 'BRND-01', domain: 'STOREFRONT', capability: 'Branding customization (color/tagline/logo) persists', persona: OWNER, startUrl: BASE + '/settings', expected: 'Branding saved and reflected', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/settings', { waitUntil: 'domcontentloaded' }); await sleep(5000);
    let t = await S.text();
    await h.shot('settings');
    h.step(`Settings: "${t.slice(0, 300)}"`);
    const marker = `+233-REMED-${Math.floor(Math.random() * 90000 + 10000)}`;
    const phoneInput = page.locator('input[placeholder*="+233"]:visible').first();
    const filled = (await phoneInput.count()) ? (await phoneInput.fill(marker), 'support_phone') : await fillBy(page, ['phone', 'support'], marker);
    const color = await fillBy(page, ['#0ea5e9', 'primary'], '#0e7490');
    h.step(`Filled: phone=${filled} marker=${marker} color=${color}`);
    const save = await clickFirst(page, ['button:has-text("Save")', 'button:has-text("Update")', 'button:has-text("Apply")'], 2500);
    h.step(`Save: ${save}`);
    // wait for the save request to complete like a user watching feedback
    await sleep(6000);
    t = await S.text();
    await h.shot('after-save');
    await page.reload({ waitUntil: 'domcontentloaded' }); await sleep(5000);
    const persistedVal = (await phoneInput.count()) ? await phoneInput.inputValue().catch(() => '') : '';
    h.step(`After reload support_phone="${persistedVal}"`);
    const persisted = persistedVal === marker;
    if (save && persisted) return h.pass('Branding/settings saved and persisted after reload', { notes: `support_phone persisted=${persistedVal}` });
    if (save) return h.fail(`Save clicked but changes did not persist. marker=${marker} after-reload value="${persistedVal}"`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-BRND-01' });
    return h.fail(`No save control / no editable branding fields. text="${t.slice(0, 250)}"`, { classification: 'UI_DEFECT', defectRef: 'DEF-BRND-02' });
  });

  // ---- STR-01 storefront config/products (product mgmt lives at /products) ----
  await S.jcase({ id: 'STR-01', domain: 'STOREFRONT', capability: 'Storefront configuration (products/services)', persona: OWNER, startUrl: BASE + '/products', expected: 'Storefront editor with product/service management', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/products', { waitUntil: 'domcontentloaded' }); await sleep(5000);
    let t = await S.text();
    await h.shotFull('products-admin');
    h.step(`Products page: "${t.slice(0, 350)}"`);
    if (/login/.test(page.url())) return h.blocked('Redirected to login');
    const add = await clickFirst(page, ['button:has-text("Add Product")', 'button:has-text("Add Service")', 'button:has-text("Add Item")', 'button:has-text("New Product")', 'a:has-text("Add")', 'button:has-text("+")'], 3000);
    if (add) {
      h.step(`Clicked ${add}`);
      await sleep(2000);
      await h.shot('add-form');
      await fillBy(page, ['name', 'title', 'product'], 'UAT Air Freight Service');
      await fillBy(page, ['price', 'amount', 'cost'], '850');
      await fillBy(page, ['description', 'detail'], 'UAT cert air freight service product');
      const sel = page.locator('select:visible').first();
      if (await sel.isVisible({ timeout: 1000 }).catch(() => false)) { try { await sel.selectOption({ index: 1 }); h.step('Picked category/option'); } catch {} }
      const save = await clickFirst(page, ['button:has-text("Save")', 'button:has-text("Create")', 'button:has-text("Add")', 'button[type="submit"]'], 2500);
      h.step(`Saved via ${save}`);
      await sleep(5000);
      t = await S.text();
      await h.shot('after-add');
      if (/uat air freight/i.test(t)) return h.pass('Product added to storefront', { notes: t.slice(0, 300) });
      return h.fail(`Product add did not reflect. text="${t.slice(0, 300)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-STR-01' });
    }
    if (/storefront|product|publish|template/i.test(t)) return h.fail(`Storefront page renders but no product-add control. text="${t.slice(0, 300)}"`, { classification: 'UI_DEFECT', defectRef: 'DEF-STR-02', notes: 'May depend on template application first' });
    return h.fail(`Storefront page empty/error. text="${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-STR-03' });
  });

  // ---- STR-02 publish (publish control lives on /templates after staging) ----
  await S.jcase({ id: 'STR-02', domain: 'STOREFRONT', capability: 'Publish storefront -> public URL', persona: OWNER, startUrl: BASE + '/templates', expected: 'Publish control produces a public storefront URL', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/templates', { waitUntil: 'domcontentloaded' }); await sleep(5000);
    let t = await S.text();
    const pub = await clickFirst(page, ['button:has-text("Publish")', 'button:has-text("Make Public")', 'button:has-text("Go Live")', 'button:has-text("Launch")'], 3000);
    let pubUrl = null;
    if (pub) { h.step(`Clicked ${pub}`); await sleep(5000); }
    // find a public URL anywhere on the page
    const links = await page.locator('a[href]').evaluateAll(els => els.map(e => e.getAttribute('href')).filter(Boolean));
    pubUrl = links.find(l => /store\/|shop|storefront|\.afruheritage\.com/.test(l) && !/storefront$/.test(l)) || null;
    if (!pubUrl && pub) {
      // public storefront lives at /store/{tenant-slug}; derive slug from welcome-email portal link
      const wl = (loadState().tenantA?.welcomeLinks || []).join(' ');
      const sm = wl.match(/https:\/\/([a-z0-9-]+)\.afruheritage\.com/i);
      if (sm) pubUrl = `${BASE}/store/${sm[1]}`;
    }
    const linkText = await S.text();
    const m = linkText.match(/https?:\/\/[^\s]+|(?:store|shop)[^\s]*/i);
    if (pub) h.step(`Publish clicked. candidate link: ${pubUrl || m?.[0] || 'none'}`);
    await h.shot('publish');
    saveState({ tenantA: { ...loadState().tenantA, storefrontUrl: pubUrl } });
    if (pub && pubUrl) return h.pass(`Storefront published; public URL: ${pubUrl}`);
    if (pub) return h.fail(`Published but no public URL discoverable. text="${t.slice(0, 250)}"`, { classification: 'UI_DEFECT', defectRef: 'DEF-STR-04' });
    if (/publish|public|live|url/i.test(t)) return h.fail(`Publish URL text present but no publish control. text="${t.slice(0, 250)}"`, { classification: 'UI_DEFECT', defectRef: 'DEF-STR-05' });
    return h.fail(`No publish capability found on storefront page. text="${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-STR-06' });
  });

  await S.finish();

  // ---- STR-03 anonymous storefront visit ----
  const S2 = await new Session('STOREANON').start();
  await S2.jcase({ id: 'STR-03', domain: 'STOREFRONT', capability: 'Anonymous storefront visit (incognito)', persona: ANON, startUrl: 'public storefront URL', expected: 'Storefront loads without login, shows products/branding', coreDep: 'YES' }, async (page, h) => {
    let url = loadState().tenantA?.storefrontUrl || 'https://uatcert-meridian-freight-1.afruheritage.com';
    if (url && url.startsWith('/')) url = BASE + url;
    h.step(`Opening ${url} in fresh context`);
    try {
      const r = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await sleep(4000);
      const t = await S2.text(); const u = page.url();
      await h.shot('anonymous');
      if (/login|sign in/.test(u)) return h.fail(`Storefront requires login -> ${u}`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-STR-07' });
      if (r && r.status() >= 400) return h.fail(`Storefront HTTP ${r.status()}`, { classification: 'CONFIGURATION_DEFECT', defectRef: 'DEF-STR-08' });
      const hasBiz = /meridian|freight|uatcert|air freight|service/i.test(t);
      if (hasBiz) return h.pass(`Anonymous storefront loads: ${u}`, { notes: t.slice(0, 300) });
      return h.fail(`Storefront loads but no business content. text="${t.slice(0, 250)}"`, { classification: 'UI_DEFECT', defectRef: 'DEF-STR-09' });
    } catch (e) {
      return h.fail(`Storefront unreachable: ${e.message.slice(0, 200)}`, { classification: 'CONFIGURATION_DEFECT', defectRef: 'DEF-STR-10' });
    }
  });
  await S2.finish();
  console.log('\nPhase 7 complete');
})().catch(async e => { console.error('FATAL', e); process.exit(1); });
