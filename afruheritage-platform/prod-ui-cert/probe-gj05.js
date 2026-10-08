// Focused retest: GJ-05 trial/subscription activation for Tenant A (already
// activated via UI earlier in campaign). Verifies /billing renders the real
// subscription state to the owner through the browser.
const { BASE, Session, loadState, uiLogin } = require('./harness');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const A = loadState().tenantA;
  const S = await new Session('GJ05-RETEST', { video: true }).start();
  const page = S.page;
  await uiLogin(page, A.email, A.password);
  await S.jcase({ id: 'GJ-05', domain: 'TENANT', capability: 'Trial / subscription activation', persona: 'BUSINESS OWNER', startUrl: BASE + '/billing', expected: 'Subscription shows trialing/active; workspace enabled', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/billing', { waitUntil: 'domcontentloaded' });
    // billing loads async — poll for subscription state like a user watching
    let t = '';
    for (let i = 0; i < 10; i++) {
      await sleep(2000); t = await S.text();
      if (/free trial|trialing|active|renews|trial ends/i.test(t)) break;
    }
    const u = page.url(); await h.shot('billing-state'); await h.shotFull('billing-full');
    if (/login/.test(u)) return h.blocked('Redirected to login');
    const hasPlan = /(free trial|starter|growth|enterprise|plan)/i.test(t);
    const hasStatus = /(trialing|active|trial ends|renews|expires)/i.test(t);
    h.step(`plan=${hasPlan} status=${hasStatus}`);
    if (hasPlan && hasStatus) return h.pass(`Subscription activation state visible: "${(t.match(/(free trial|trialing|active|trial ends|renews)[^\n]*/i) || [''])[0].slice(0, 200)}"`, { notes: t.slice(0, 300) });
    return h.fail(`No subscription activation visible on /billing. text="${t.slice(0, 300)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-SUB-01' });
  });
  await S.finish();
  console.log('done');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
