const { Session, loadState, uiLogin, clickFirst, BASE } = require('./harness');
const A = loadState().tenantA;
(async () => {
  const s = await new Session('PROBE-PROD', { video: true }).start();
  await uiLogin(s.page, A.email, A.password);
  // Product create
  await s.page.goto(BASE + '/products', { waitUntil: 'domcontentloaded' });
  await s.page.waitForTimeout(5000);
  await clickFirst(s.page, ['button:has-text("Add Product")'], 4000);
  await s.page.waitForTimeout(1500);
  const dlg = s.page.locator('[role="dialog"]').last();
  await dlg.locator('input[placeholder="Product name"]').fill('UAT Air Freight Service');
  await dlg.locator('input[placeholder*="Price"]').fill('850');
  await dlg.locator('input[placeholder*="Short description"]').fill('UAT cert product');
  await dlg.locator('button:has-text("Create")').click();
  await s.page.waitForTimeout(5000);
  await s.shot('after-create');
  const t1 = await s.text();
  console.log('PRODUCT:', /UAT Air Freight/.test(t1) ? 'CREATED+LISTED' : 'NOT VISIBLE', '| fails:', s.netLog.filter(l=>/HTTP (4|5)/.test(l)).join(';'));
  // Publish staged template
  await s.page.goto(BASE + '/templates', { waitUntil: 'domcontentloaded' });
  await s.page.waitForTimeout(6000);
  const pub = s.page.locator('button:has-text("Publish")');
  console.log('PUBLISH BUTTONS:', await pub.count());
  if (await pub.count()) {
    await pub.first().click();
    await s.page.waitForTimeout(8000);
    await s.shot('after-publish');
    const t2 = await s.text();
    console.log('PUBLISH:', /published|live storefront/i.test(t2) ? 'PUBLISHED' : t2.slice(0, 200));
  }
  await s.finish();
})();
