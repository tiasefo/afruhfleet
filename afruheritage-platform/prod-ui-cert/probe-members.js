const { Session, loadState, uiLogin, BASE } = require('./harness');
const A = loadState().tenantA;
(async () => {
  const s = await new Session('PROBE-MEMBERS', {}).start();
  await uiLogin(s.page, A.email, A.password);
  await s.page.goto(BASE + '/members', { waitUntil: 'domcontentloaded' });
  await s.page.waitForTimeout(8000);
  await s.shot('members');
  const t = await s.text();
  const i = t.indexOf('Team Members');
  console.log('BODY:', t.slice(i, i + 500));
  console.log('ls tenant_id:', await s.page.evaluate(() => localStorage.getItem('tenant_id')));
  console.log('NET:', s.netLog.filter(l=>/member|user/i.test(l)).join('\n') || 'none-failing');
  await s.finish();
})();
