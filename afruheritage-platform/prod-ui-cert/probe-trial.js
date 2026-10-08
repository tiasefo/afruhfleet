const { Session, loadState, uiLogin, clickFirst, BASE } = require('./harness');
const A = loadState().tenantA;
(async () => {
  const s = await new Session('REMED-TRIAL', { video: true }).start();
  await uiLogin(s.page, A.email, A.password);
  await s.page.goto(BASE + '/billing', { waitUntil: 'domcontentloaded' });
  await s.page.waitForTimeout(9000);
  // Select the Free Trial plan card
  const card = s.page.locator('div:has-text("Free Trial")').last();
  // find the Select Plan button inside/near Free Trial card
  const selectBtn = s.page.locator('button:has-text("Select Plan")').first();
  await selectBtn.click();
  await s.page.waitForTimeout(1500);
  await s.shot('plan-selected');
  const t = await s.text();
  console.log('after select:', t.slice(0, 400));
  const startBtn = await clickFirst(s.page, ['button:has-text("Start Free Trial")', 'button:has-text("Proceed to Payment")'], 4000);
  console.log('startBtn=', startBtn);
  if (startBtn) {
    await s.page.waitForTimeout(12000);
    await s.shot('after-trial');
    const t2 = await s.text();
    console.log('after trial:', t2.slice(0, 500));
    console.log('NET-FAILS:', s.netLog.filter(l=>/HTTP|REQFAIL/.test(l)).join('\n'));
  }
  await s.finish();
})();
