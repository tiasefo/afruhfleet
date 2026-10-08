const { Session, loadState, uiLogin, BASE } = require('./harness');
const B = loadState().tenantB;
(async () => {
  const s = await new Session('REMED-LIST', {}).start();
  await uiLogin(s.page, B.email, B.password);
  await s.page.goto(BASE + '/shipments', { waitUntil: 'domcontentloaded' });
  await s.page.waitForTimeout(10000);
  await s.shot('list');
  const t = await s.text();
  console.log('LIST BODY:', t.slice(0, 600));
  console.log('NET:', s.netLog.filter(l => /shipments/.test(l)).join('\n'));
  await s.finish();
})();
