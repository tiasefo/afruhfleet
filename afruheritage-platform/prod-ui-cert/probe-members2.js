const { Session, loadState, uiLogin, BASE } = require('./harness');
const A = loadState().tenantA;
(async () => {
  const s = await new Session('PROBE-MEMBERS2', {}).start();
  s.page.on('response', async r => {
    if (r.url().includes('/members') || r.url().includes('/users')) {
      const body = await r.text().catch(() => '');
      console.log('RESP', r.status(), r.url(), '=>', body.slice(0, 300));
    }
  });
  await uiLogin(s.page, A.email, A.password);
  await s.page.goto(BASE + '/members', { waitUntil: 'domcontentloaded' });
  await s.page.waitForTimeout(8000);
  await s.shot('members2');
  await s.finish();
})();
