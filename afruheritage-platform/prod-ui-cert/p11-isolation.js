// Phase 11 — two-tenant isolation + storefront completion.
const { BASE, Session, loadState, clickFirst, uiLogin } = require('./harness');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const A_UUID = '9413f169-98b8-4da0-86f2-97e36b2ae2bd';
const B_UUID = 'e2c382b8-fd02-418d-8bd5-ad3634a56795';
const st0 = loadState();
const A_SUB = (st0.tenantA && (st0.tenantA.storefrontUrl || (st0.tenantA.welcomeLinks || [])[0])) || 'https://uatcert-meridian-freight-1.afruheritage.com';
const B_SUB = 'https://uatcert-kestrel-logistics-1.afruheritage.com';

async function waitReady(page, re, t = 25000) {
  try { await page.getByText(re).first().waitFor({ state: 'visible', timeout: t }); return true; }
  catch { return false; }
}

(async () => {
  const { tenantA: A, tenantB: B } = loadState();
  const S = await new Session('ISO', { video: true }).start();
  const page = S.page;

  // ---- Login as A; verify A workspace shows A data only ----
  await S.jcase({ id: 'ISO-01', domain: 'TENANT ISOLATION', capability: 'Tenant A session shows A identity/data only', persona: 'BUSINESS OWNER (TENANT A)', startUrl: BASE + '/login', expected: 'A company name, A email, no B artifacts', coreDep: 'YES' }, async (page, h) => {
    await uiLogin(page, A.email, A.password);
    await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /dashboard|home/i, 25000); await sleep(2500);
    const t = await S.text(); await h.shot('a-dashboard');
    const hasA = /meridian/i.test(t);
    const hasB = /kestrel|murol77jf82z/i.test(t);
    if (hasA && !hasB) return h.pass('A workspace shows only A identity');
    return h.fail(`A workspace anomaly: hasA=${hasA} hasB=${hasB}`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-ISO-01' });
  });

  // ---- A visits B's tenant subdomain ----
  await S.jcase({ id: 'ISO-02', domain: 'TENANT ISOLATION', capability: 'A session on B subdomain gets no B workspace data', persona: 'BUSINESS OWNER (TENANT A)', startUrl: B_SUB, expected: 'Public storefront only or login — never B private data', coreDep: 'YES' }, async (page, h) => {
    await page.goto(B_SUB, { waitUntil: 'domcontentloaded' }); await sleep(5000);
    let t = await S.text(); let u = page.url(); await h.shot('b-sub-as-a');
    const privB = /UAT Cert Owner Bravo|company admin|sign out/i.test(t);
    const pubB = /kestrel/i.test(t);
    if (privB) return h.fail(`A session sees B private workspace on B subdomain. url=${u}`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-ISO-02' });
    // try protected route on B subdomain
    await page.goto(B_SUB + '/dashboard', { waitUntil: 'domcontentloaded' }); await sleep(5000);
    t = await S.text(); u = page.url(); await h.shot('b-sub-dash');
    const priv2 = /UAT Cert Owner Bravo|kestrel logistics.*sign out|company admin/i.test(t);
    const denied = /login|sign in|not found|404|access denied/i.test(t) || /login/.test(u);
    if (priv2) return h.fail(`B dashboard exposed to A session. url=${u} text="${t.slice(0, 200)}"`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-ISO-02' });
    if (denied || pubB) return h.pass(`B subdomain denies A private access (url=${u})`, { notes: t.slice(0, 200) });
    return h.fail(`Ambiguous B-subdomain state. url=${u} text="${t.slice(0, 200)}"`, { classification: 'UNCLASSIFIED' });
  });

  // ---- A tries B tenant_id via UI page URL (learned legitimately from network) ----
  await S.jcase({ id: 'ISO-03', domain: 'TENANT ISOLATION', capability: 'A cannot view B data via tenant_id URL parameter', persona: 'BUSINESS OWNER (TENANT A)', startUrl: BASE + '/shipments?tenant_id=' + B_UUID, expected: 'Only A data rendered', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/crm/contacts?tenant_id=' + B_UUID, { waitUntil: 'domcontentloaded' });
    await waitReady(page, /contacts|crm|login/i, 25000); await sleep(4000);
    const t = await S.text(); await h.shot('a-views-b-crm');
    const seesB = /kestrel|murol77jf82z|adjoa|mensah/i.test(t);
    if (seesB) return h.fail(`Tenant A sees Tenant B CRM data. text="${t.slice(0, 250)}"`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-ISO-03' });
    return h.pass('No cross-tenant CRM data visible', { notes: t.slice(0, 200) });
  });
  await S.finish();

  // ---- Anonymous on B subdomain: public storefront correctness ----
  const S2 = await new Session('ISOANON', { video: true }).start();
  await S2.jcase({ id: 'ISO-04', domain: 'TENANT ISOLATION', capability: 'Anonymous visitor on B subdomain sees only B public content', persona: 'ANONYMOUS CUSTOMER', startUrl: B_SUB, expected: 'B public storefront or login — no private data', coreDep: 'YES' }, async (page, h) => {
    await page.goto(B_SUB, { waitUntil: 'domcontentloaded' }); await sleep(5000);
    const t = await S2.text(); const u = page.url(); await h.shot('b-sub-anon');
    const priv = /owner bravo|company admin|billing|sign out/i.test(t);
    if (priv) return h.fail(`Anonymous sees private B data. text="${t.slice(0, 200)}"`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-ISO-04' });
    return h.pass(`B subdomain anonymous-safe (url=${u})`, { notes: t.slice(0, 220) });
  });
  await S2.jcase({ id: 'ISO-05', domain: 'TENANT ISOLATION', capability: 'Anonymous on A subdomain sees A content (not B)', persona: 'ANONYMOUS CUSTOMER', startUrl: A_SUB, expected: 'A branding only', coreDep: 'YES' }, async (page, h) => {
    await page.goto(A_SUB, { waitUntil: 'domcontentloaded' }); await sleep(5000);
    const t = await S2.text(); await h.shot('a-sub-anon');
    const hasA = /meridian/i.test(t); const hasB = /kestrel/i.test(t);
    if (hasA && !hasB) return h.pass('A subdomain shows A content only');
    if (hasB) return h.fail('A subdomain shows B content — cross-tenant bleed', { classification: 'BACKEND_DEFECT', defectRef: 'DEF-ISO-05' });
    return h.fail(`A subdomain content unclear: "${t.slice(0, 200)}"`, { classification: 'UNCLASSIFIED' });
  });
  await S2.finish();

  // ---- Storefront completion on Tenant B: plugins + branding + config + publish ----
  const S3 = await new Session('STRF', { video: true }).start();
  const p3 = S3.page;
  await uiLogin(p3, B.email, B.password);

  await S3.jcase({ id: 'STR-04', domain: 'STOREFRONT', capability: 'Plugins: list + enable one', persona: 'BUSINESS OWNER (TENANT B)', startUrl: BASE + '/plugins', expected: 'Plugin list; one can be enabled', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/plugins', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /plugin/i, 25000); await sleep(2000);
    let t = await S3.text(); await h.shot('plugins');
    if (/404|not found/i.test(t.slice(0, 200))) return h.fail('Plugins 404', { classification: 'NOT_PRODUCTIZED', defectRef: 'DEF-STR-01' });
    const en = await clickFirst(page, ['button:has-text("Enable")', 'button:has-text("Install")', 'button:has-text("Activate")'], 3000);
    if (en) { h.step(`Clicked ${en}`); await sleep(4000); await clickFirst(page, ['button:has-text("Confirm")', 'button:has-text("Yes")'], 1500); await sleep(4000); }
    t = await S3.text(); await h.shot('after');
    if (en && /enabled|active|installed|disable/i.test(t)) return h.pass('Plugin enable path works', { notes: t.slice(0, 240) });
    if (/plugin/i.test(t) && !en) return h.fail('Plugin list renders but no enable control', { classification: 'UI_DEFECT', defectRef: 'DEF-STR-02', notes: t.slice(0, 240) });
    return h.fail(`Plugins state unexpected. text="${t.slice(0, 240)}"`, { classification: 'UNCLASSIFIED', defectRef: 'DEF-STR-03' });
  });

  await S3.jcase({ id: 'STR-05', domain: 'STOREFRONT', capability: 'Branding settings persist (retest on B)', persona: 'BUSINESS OWNER (TENANT B)', startUrl: BASE + '/settings', expected: 'Branding field save + persists after reload', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/settings', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /settings|branding|company|profile/i, 25000); await sleep(2000);
    let t = await S3.text(); await h.shot('settings');
    // find a branding-ish editable input
    const before = t;
    const inputs = await page.locator('input:visible').all();
    let edited = null;
    for (const el of inputs) {
      const nm = `${await el.getAttribute('name') || ''} ${await el.getAttribute('placeholder') || ''}`.toLowerCase();
      if (/tagline|slogan|description|color|brand|company|name/.test(nm) && !(await el.isDisabled())) {
        const v = await el.inputValue();
        await el.fill(v ? v + '-UATX' : 'UATX-Brand'); edited = nm.trim().split(' ')[0] || 'field'; break;
      }
    }
    if (!edited) { return h.fail(`No editable branding field. text="${t.slice(0, 200)}"`, { classification: 'UI_DEFECT', defectRef: 'DEF-STR-04' }); }
    const sv = await clickFirst(page, ['button:has-text("Save")', 'button:has-text("Update")', 'button[type="submit"]'], 3000);
    h.step(`Edited ${edited}; save=${sv}`); await sleep(5000);
    await page.reload({ waitUntil: 'domcontentloaded' }); await sleep(5000);
    t = await S3.text(); await h.shot('reloaded');
    if (/UATX/i.test(t)) return h.pass('Branding change persisted after reload');
    return h.fail(`Branding did not persist (repro of A defect). after="${t.slice(0, 220)}"`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-SET-01' });
  });

  // The storefront config surface is split across /products (catalog admin)
  // and /templates (theme staging + publish). /storefront is the PUBLIC page.
  await S3.jcase({ id: 'STR-06', domain: 'STOREFRONT', capability: 'Storefront products/config + publish + public view', persona: 'BUSINESS OWNER (TENANT B)', startUrl: BASE + '/products', expected: 'Product admin + template publish surfaces reachable', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/products', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /product|catalog/i, 25000); await sleep(2000);
    let t = await S3.text(); await h.shot('products-admin');
    const prodAdmin = /product|catalog/i.test(t) && (await page.$('button:has-text("Add"), button:has-text("New"), button:has-text("Create"), a:has-text("Add"), a:has-text("New")')) !== null;
    h.step(`Products admin surface: ${prodAdmin}`);
    await page.goto(BASE + '/templates', { waitUntil: 'domcontentloaded' });
    await waitReady(page, /template|publish|install/i, 25000); await sleep(2000);
    t = await S3.text(); await h.shot('templates-admin');
    const tmplAdmin = /template/i.test(t) && (await page.$('button:has-text("Install"), button:has-text("Publish"), button:has-text("Activate"), button:has-text("Select")')) !== null;
    h.step(`Templates publish surface: ${tmplAdmin}`);
    if (prodAdmin && tmplAdmin) return h.pass('Storefront config surfaces present (products admin + template publish)');
    return h.fail(`Storefront config surfaces missing. products=${prodAdmin} templates=${tmplAdmin}`, { classification: 'UI_DEFECT', defectRef: 'DEF-STR-06' });
  });

  await S3.finish();

  // ---- B anonymous storefront after config attempt ----
  const S4 = await new Session('STRPUB', {}).start();
  await S4.jcase({ id: 'STR-07', domain: 'STOREFRONT', capability: 'Anonymous storefront on B subdomain shows B content', persona: 'ANONYMOUS CUSTOMER', startUrl: B_SUB, expected: 'B-branded storefront', coreDep: 'NO' }, async (page, h) => {
    await page.goto(B_SUB, { waitUntil: 'domcontentloaded' }); await sleep(6000);
    const t = await S4.text(); await h.shotFull('b-storefront');
    if (/kestrel/i.test(t)) return h.pass('B storefront branded correctly', { notes: t.slice(0, 220) });
    return h.fail(`B storefront unbranded/default. text="${t.slice(0, 220)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-STR-07' });
  });
  await S4.finish();
  console.log('\nPhase 11 complete');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
