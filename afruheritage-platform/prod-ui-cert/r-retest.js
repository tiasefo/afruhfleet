// REMEDIATION RETEST — targeted UI verification of R1–R6 fixes on production.
// Evidence gated: screenshots + trace + network/console per session.
const { Session, loadState, saveState, uiLogin, clickFirst, fillIfPresent, BASE } = require('./harness');
const mailbox = require('./mailbox');

const state = loadState();
const B = state.tenantB;

async function main() {
  // ── Tenant B owner session: R1 + R2 + R6 fixes ──
  const s = await new Session('REMED-TB', { video: true }).start();
  s.step('login as Tenant B owner');
  await uiLogin(s.page, B.email, B.password);
  await s.shot('logged-in');
  console.log('  logged in at', s.url());

  await s.jcase({
    id: 'R1-SHIP-LIST', domain: 'LOGISTICS', capability: 'Shipment list loads',
    persona: 'Tenant B owner', startUrl: BASE + '/shipments', expected: 'Shipment list renders (was 403)', coreDep: 'YES',
  }, async (page, ctx) => {
    ctx.step('goto /shipments');
    await page.goto(BASE + '/shipments', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(8000);
    await ctx.shot('list');
    const t = await ctx.text();
    if (/tenant access denied|no tenant context|sign in to your account/i.test(t)) return ctx.fail(t.slice(0, 300));
    if (/shipment|track|sender|receiver|status|new shipment/i.test(t)) return ctx.pass('List page rendered: ' + t.slice(0, 250));
    return ctx.fail('Unexpected content: ' + t.slice(0, 300));
  });

  await s.jcase({
    id: 'R1-SHIP-CREATE', domain: 'LOGISTICS', capability: 'Create shipment via UI',
    persona: 'Tenant B owner', startUrl: BASE + '/shipments/new', expected: 'Shipment created with tracking number (was HTTP 500)', coreDep: 'YES',
  }, async (page, ctx) => {
    ctx.step('goto /shipments/new and fill');
    await page.goto(BASE + '/shipments/new', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    await fillIfPresent(page, ['sender_name', 'senderName', 'sender'], 'REMED Sender B');
    await fillIfPresent(page, ['receiver_name', 'receiverName', 'recipient', 'receiver'], 'REMED Receiver B');
    await fillIfPresent(page, ['receiver_phone', 'receiverPhone', 'phone'], '+233244555777');
    await fillIfPresent(page, ['origin_city', 'originCity', 'origin'], 'Accra');
    await fillIfPresent(page, ['destination_city', 'destinationCity', 'destination'], 'Kumasi');
    await fillIfPresent(page, ['weight_kg', 'weightKg', 'weight'], '12');
    await fillIfPresent(page, ['total_cost', 'totalCost', 'amount', 'price'], '150');
    await ctx.shot('form');
    const submitted = await clickFirst(page, ['button:has-text("Create Shipment")', 'button:has-text("Create")', 'button[type="submit"]']);
    ctx.step('submitted=' + submitted);
    // wait for either navigation or success text — patient, up to 30s
    let landed = '';
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(1500);
      const t = await ctx.text();
      if (/tracking|created successfully|shipment created|TRK-|AH-/i.test(t) || !page.url().includes('/shipments/new')) { landed = t; break; }
      if (/failed to create|error/i.test(t)) { landed = 'ERR:' + t; break; }
    }
    await ctx.shot('after-submit');
    const t = landed || await ctx.text();
    if (/failed to create/i.test(t)) return ctx.fail(t.slice(0, 300));
    if (/tracking|created|TRK-|AH-/i.test(t) || !page.url().includes('/shipments/new')) return ctx.pass('Create succeeded: ' + (t.slice(0, 250) + ' url=' + page.url()));
    return ctx.fail('Ambiguous result: ' + t.slice(0, 300));
  });

  await s.jcase({
    id: 'R1-MEMBERS', domain: 'TEAM', capability: 'Members list loads',
    persona: 'Tenant B owner', startUrl: BASE + '/members', expected: 'Members table renders (was 500 / No tenant context)', coreDep: 'YES',
  }, async (page, ctx) => {
    ctx.step('goto /members');
    await page.goto(BASE + '/members', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(8000);
    await ctx.shot('members');
    const t = await ctx.text();
    if (/no tenant context|sign in to your account/i.test(t)) return ctx.fail(t.slice(0, 300));
    if (/member|invite|email|role|admin/i.test(t)) return ctx.pass('Members rendered: ' + t.slice(0, 250));
    return ctx.fail('Unexpected: ' + t.slice(0, 300));
  });

  await s.jcase({
    id: 'R1-BILLING', domain: 'BILLING', capability: 'Billing page loads wallet+subscription',
    persona: 'Tenant B owner', startUrl: BASE + '/billing', expected: 'Wallet/subscription render without 403', coreDep: 'YES',
  }, async (page, ctx) => {
    ctx.step('goto /billing');
    await page.goto(BASE + '/billing', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(8000);
    await ctx.shot('billing');
    const t = await ctx.text();
    const netErrs = s.netLog.filter(l => /billing/.test(l) && /HTTP (403|500)/.test(l));
    if (netErrs.length) return ctx.fail('Billing API errors: ' + netErrs.join('; '));
    if (/wallet|credit|subscription|plan|trial|payment/i.test(t)) return ctx.pass('Billing rendered: ' + t.slice(0, 250));
    return ctx.fail('Unexpected: ' + t.slice(0, 300));
  });

  await s.jcase({
    id: 'R1-BRANDING', domain: 'SETTINGS', capability: 'Branding change persists after reload',
    persona: 'Tenant B owner', startUrl: BASE + '/settings', expected: 'Save → reload → value persists', coreDep: 'YES',
  }, async (page, ctx) => {
    ctx.step('goto /settings, change support phone');
    await page.goto(BASE + '/settings', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(6000);
    const marker = '+233-REMED-' + String(Date.now()).slice(-5);
    const filled = await fillIfPresent(page, ['support_phone', 'supportPhone', 'phone'], marker);
    ctx.step('filled=' + filled + ' val=' + marker);
    if (!filled) return ctx.fail('No editable branding field found');
    const saved = await clickFirst(page, ['button:has-text("Save")', 'button[type="submit"]']);
    ctx.step('save clicked=' + saved);
    await page.waitForTimeout(4000);
    await ctx.shot('after-save');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(6000);
    await ctx.shot('after-reload');
    const val = await page.locator(`input[name="${filled}"]`).inputValue().catch(() => '');
    if (val === marker) return ctx.pass('Persisted after reload: ' + val);
    return ctx.fail(`Value after reload: "${val}" expected "${marker}"`);
  });

  await s.jcase({
    id: 'R2-FLEET-DRIVERS', domain: 'FLEET', capability: 'Drivers page loads org-scoped data',
    persona: 'Tenant B owner', startUrl: BASE + '/dashboard/fleetops/drivers', expected: 'Data or empty state — not "not provisioned" (was 404)', coreDep: 'YES',
  }, async (page, ctx) => {
    ctx.step('goto fleetops drivers');
    await page.goto(BASE + '/dashboard/fleetops/drivers', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(9000);
    await ctx.shot('drivers');
    const t = await ctx.text();
    if (/not provisioned|tenant fleetbase/i.test(t)) return ctx.fail('Still unprovisioned: ' + t.slice(0, 250));
    if (/unable to load|error/i.test(t)) return ctx.fail('Load error: ' + t.slice(0, 250));
    return ctx.pass('Drivers page rendered: ' + t.slice(0, 250));
  });

  await s.jcase({
    id: 'R6-WHITELABEL', domain: 'WHITE-LABEL', capability: 'No Fleetbase strings on fleet pages',
    persona: 'Tenant B owner', startUrl: BASE + '/dashboard/fleetops/drivers', expected: 'No "Fleetbase" visible anywhere', coreDep: 'NO',
  }, async (page, ctx) => {
    await page.goto(BASE + '/dashboard/fleetops', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    const t1 = await ctx.text();
    await page.goto(BASE + '/dashboard/fleetops/drivers', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(6000);
    await ctx.shot('drivers-whitelabel');
    const t2 = await ctx.text();
    const leaks = (t1 + ' ' + t2).match(/fleetbase/gi) || [];
    if (leaks.length) return ctx.fail(`${leaks.length} Fleetbase strings still visible`);
    return ctx.pass('No Fleetbase branding on fleetops pages');
  });

  // R3 — password reset physical email (Tenant B owner mailbox is still live)
  await s.jcase({
    id: 'R3-RESET-FLOW', domain: 'IDENTITY', capability: 'Forgot password → web reset page → login',
    persona: 'Tenant B owner', startUrl: BASE + '/forgot-password', expected: 'Email link opens afruheritage.com/reset-password; new password works', coreDep: 'YES',
  }, async (page, ctx) => {
    ctx.step('request reset via forgot-password page');
    await page.goto(BASE + '/forgot-password', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.locator('input[type="email"], input[name="email"]').first().fill(B.email);
    await clickFirst(page, ['button:has-text("Send")', 'button:has-text("Reset")', 'button[type="submit"]']);
    await page.waitForTimeout(6000);
    await ctx.shot('reset-requested');
    ctx.step('polling mailbox');
    const mb = state.mailboxes.tenantB;
    const mail = await mailbox.waitForMessage(mb, { subjectRe: /password reset/i, timeoutMs: 120000 });
    if (!mail) return ctx.fail('No reset email arrived within 120s');
    const links = mailbox.extractLinks(mail);
    const link = links.find(l => /reset-password|reset_token|token=/i.test(l));
    ctx.step('link=' + link);
    if (!link) return ctx.fail('Email arrived but no reset link found. Subject=' + mail.subject);
    if (!/afruheritage\.com\/reset-password/.test(link)) return ctx.fail('Link still points at wrong host/path: ' + link);
    // follow it
    const newPass = 'RemedReset!2026B';
    await page.goto(link, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    await ctx.shot('reset-form');
    const inputs = page.locator('input[type="password"]');
    await inputs.nth(0).fill(newPass);
    await inputs.nth(1).fill(newPass);
    await clickFirst(page, ['button:has-text("Set Password")', 'button[type="submit"]']);
    await page.waitForTimeout(5000);
    await ctx.shot('after-reset');
    // now login with new password
    await uiLogin(page, B.email, newPass);
    if (!page.url().includes('/login')) {
      saveState({ tenantB: { ...B, password: newPass } });
      return ctx.pass('Reset link → web form → new password login works. url=' + page.url());
    }
    return ctx.fail('Login with new password failed');
  });

  await s.finish();
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
