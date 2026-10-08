const { Session, loadState, uiLogin, BASE } = require('./harness');
const A = loadState().tenantA;
(async () => {
  const s = await new Session('PROBE-BILL', {}).start();
  await uiLogin(s.page, A.email, A.password);
  await s.page.goto(BASE + '/billing', { waitUntil: 'domcontentloaded' });
  await s.page.waitForTimeout(9000);
  await s.shot('billing');
  const t = await s.text();
  console.log('BODY:', t.slice(0, 900));
  console.log('NET-FAILS:', s.netLog.join('\n') || 'none');
  const btns = await s.page.locator('button:visible').evaluateAll(els => els.map(e => e.innerText.slice(0, 40)));
  console.log('BUTTONS:', JSON.stringify(btns.slice(0, 25)));
  await s.finish();
})();
