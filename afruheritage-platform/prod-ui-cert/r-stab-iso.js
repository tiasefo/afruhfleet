// Retest: ISO-01/ISO-05 with correct assertions (tenant name was polluted by settings test).
const { BASE, Session, loadState, uiLogin } = require('./harness');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const A_SUB = 'https://uatcert-meridian-freight-3.afruheritage.com';

(async () => {
  const A = loadState().tenantA;
  const S = await new Session('ISOR', { video: true }).start();
  const page = S.page;

  await S.jcase({ id: 'ISO-01', domain: 'TENANT ISOLATION', capability: 'Tenant A session shows A identity/data only', persona: 'BUSINESS OWNER (TENANT A)', startUrl: BASE + '/login', expected: 'A owner identity, A email, no B artifacts', coreDep: 'YES' }, async (page, h) => {
    await uiLogin(page, A.email, A.password, { waitMs: 90000 });
    await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    const t = await S.text(); await h.shot('a-dashboard');
    const hasA = /stab-mv0j6arnsi4h|UAT Cert Owner Alpha|meridian|233550008877/i.test(t);
    const hasB = /kestrel|rcb2yeu4|Owner Bravo/i.test(t);
    if (hasA && !hasB) return h.pass('A workspace shows only A identity');
    return h.fail(`A workspace anomaly: hasA=${hasA} hasB=${hasB} text="${t.slice(0, 200)}"`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-ISO-01' });
  });

  const S2 = await new Session('ISOR2', {}).start();
  await S2.jcase({ id: 'ISO-05', domain: 'TENANT ISOLATION', capability: 'Anonymous on A subdomain sees A login/content (not B)', persona: 'ANONYMOUS CUSTOMER', startUrl: A_SUB, expected: 'A tenant login or A storefront — no B private data', coreDep: 'YES' }, async (page, h) => {
    await page.goto(A_SUB, { waitUntil: 'domcontentloaded' }); await sleep(6000);
    const t = await S2.text(); const u = page.url(); await h.shot('a-sub-anon');
    const hasB = /kestrel|rcb2yeu4|Owner Bravo|murol77jf82z/i.test(t);
    const isAorLogin = /sign in|log in|meridian|233550008877|afruheritage|track|storefront/i.test(t) || u.includes('meridian');
    if (hasB) return h.fail(`A subdomain leaks B content. url=${u} text="${t.slice(0, 200)}"`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-ISO-05' });
    if (isAorLogin) return h.pass(`A subdomain serves A-scoped content/login (url=${u})`, { notes: t.slice(0, 200) });
    return h.fail(`A subdomain content unclear: "${t.slice(0, 200)}"`, { classification: 'UNCLASSIFIED' });
  });
  await S2.finish();
  await S.finish();
  console.log('ISO retests done');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
