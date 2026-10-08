const { Session, loadState, uiLogin, BASE } = require('./harness');
const A = loadState().tenantA;
(async () => {
  const s = await new Session('PROBE-ONB', {}).start();
  await uiLogin(s.page, A.email, A.password);
  console.log('after login:', s.url());
  if (!s.url().includes('/onboarding')) { console.log('not on onboarding'); await s.finish(); return; }
  // walk: click Freight Company then continue
  const t0 = await s.text();
  if (/freight company/i.test(t0)) {
    await s.page.getByText(/freight company/i).first().click();
    await s.page.waitForTimeout(800);
    await s.page.getByRole('button', { name: /continue/i }).first().click();
    await s.page.waitForTimeout(2500);
  }
  console.log('url now:', s.url());
  await s.shot('profile-step');
  // dump inputs + buttons
  const inputs = await s.page.locator('input:visible').evaluateAll(els => els.map(e => ({ ph: e.placeholder, name: e.name, val: e.value })));
  console.log('INPUTS:', JSON.stringify(inputs));
  const btns = await s.page.locator('button:visible').evaluateAll(els => els.map(e => ({ t: e.innerText.slice(0, 40), dis: e.disabled })));
  console.log('BUTTONS:', JSON.stringify(btns));
  await s.finish();
})();
