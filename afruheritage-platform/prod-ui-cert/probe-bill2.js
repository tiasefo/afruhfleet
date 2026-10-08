const { Session, loadState, uiLogin, BASE } = require('./harness');
const A = loadState().tenantA;
(async () => {
  const s = await new Session('PROBE-BILL2', {}).start();
  await uiLogin(s.page, A.email, A.password);
  await s.page.goto(BASE + '/billing', { waitUntil: 'domcontentloaded' });
  await s.page.waitForTimeout(10000);
  await s.shot('billing-after-trial');
  const t = await s.text();
  console.log('BODY:', t.slice(t.indexOf('Billing'), t.indexOf('Billing') + 700));
  console.log('NET-FAILS:', s.netLog.filter(l=>/HTTP (4|5)/.test(l)).join('\n') || 'none');
  await s.finish();
})();
