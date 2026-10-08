const { BASE, Session, loadState, uiLogin } = require('./harness');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const B = loadState().tenantB;
  const S = await new Session('VERIFY', { video: true }).start();
  const page = S.page;
  await uiLogin(page, B.email, B.password);
  await S.jcase({ id: 'KYC-03', domain: 'KYC', capability: 'KYC final status check', persona: 'BUSINESS OWNER (TENANT B)', startUrl: BASE + '/kyc', expected: 'Status reflects submission', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/kyc', { waitUntil: 'domcontentloaded' }); await sleep(8000);
    const t = await S.text(); await h.shot('status');
    const m = t.match(/kyc status[:\s]*[^\n]*/i);
    h.step(`Status line: ${m ? m[0] : 'none'}`);
    if (/pending|under review|approved|verified|in review/i.test(t)) return h.pass(`KYC submission landed: ${m ? m[0] : t.slice(0,150)}`);
    if (/not submitted/i.test(t)) return h.fail(`KYC submit did not persist: ${m ? m[0] : ''}`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-KYC-02' });
    return h.fail(`Status unclear. ${t.slice(0,200)}`, { classification: 'UNCLASSIFIED' });
  });
  await S.jcase({ id: 'GATE-02', domain: 'TEAM/RBAC', capability: 'Members list (retest 500)', persona: 'BUSINESS OWNER (TENANT B)', startUrl: BASE + '/members', expected: 'Members list renders', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/members', { waitUntil: 'domcontentloaded' }); await sleep(8000);
    const t = await S.text(); await h.shot('members');
    if (/failed|error|unable/i.test(t) || !/member|team|invite/i.test(t)) return h.fail(`Members list broken (API 500). "${t.slice(0,240)}"`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-TEAM-02' });
    return h.pass(`Members render: "${t.slice(0,220)}"`);
  });
  await S.finish();
  console.log('done');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
