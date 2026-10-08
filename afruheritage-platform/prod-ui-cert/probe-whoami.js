const { Session, loadState, uiLogin, BASE } = require('./harness');
const A = loadState().tenantA;
(async () => {
  const s = await new Session('PROBE-WHOAMI', {}).start();
  s.page.on('response', async r => {
    if (r.url().includes('/auth/me')) console.log('ME RESP', r.status(), (await r.text()).slice(0, 300));
  });
  await uiLogin(s.page, A.email, A.password);
  await s.page.waitForTimeout(3000);
  console.log('URL:', s.page.url());
  const me = await s.page.evaluate(async () => (await fetch('/api/v1/auth/me')).json());
  console.log('ME fetch:', JSON.stringify(me).slice(0, 300));
  await s.page.goto(BASE + '/settings', { waitUntil: 'domcontentloaded' });
  await s.page.waitForTimeout(4000);
  await s.shot('settings');
  console.log((await s.text()).slice(0, 300));
  await s.finish();
})();
