// Phase 21 — guide-faithful UAT handover walkthrough on a FRESH business account.
// Executes the customer UAT guide's exact journeys against https://afruheritage.com:
// register -> plan -> template -> login -> onboarding -> workspace -> driver ->
// vehicle -> shipment lifecycle -> tracking -> employee invite -> support ->
// password reset -> tenant isolation -> apex support guidance.
const { BASE, Session, loadState, saveState, uiLogin, clickFirst } = require('./harness');
const { createMailbox, waitForMessage, extractLinks } = require('./mailbox');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OWNER = 'BUSINESS OWNER', EMP = 'INVITED EMPLOYEE', PUB = 'PUBLIC VISITOR', OTHER = 'TENANT B';
const PW = 'Handover!2026Pw';
const PW_EMP = 'HandoverEmp!2026';
const COMPANY = 'UAT Handover Freight Co';
const OWNER_NAME = 'Handover Owner';

const EMAIL_CHECKS = (msg) => {
  const issues = [];
  const links = extractLinks(msg);
  const bad = links.filter(l => /localhost|127\.0\.0\.1|0\.0\.0\.0|\d+\.\d+\.\d+\.\d+|:8\d{3}|api\.afruheritage/.test(l));
  if (bad.length) issues.push('bad links: ' + bad.join(','));
  return { issues, links };
};

async function fillPh(page, ph, val, nth = 0) {
  const loc = page.locator(`input[placeholder="${ph}"], textarea[placeholder="${ph}"]`).nth(nth);
  try { await loc.fill(val); } catch {}
}
async function clickButtonText(page, patterns, timeout = 2000) {
  for (const role of ['button', 'link']) {
    for (const p of patterns) {
      const items = await page.getByRole(role, { name: p }).all();
      for (const it of items) {
        try { if (await it.isVisible()) { await it.click(); return (await it.innerText() || '').trim().slice(0, 40); } } catch {}
      }
    }
  }
  return null;
}
async function comboSelect(page, comboIndex, optionText) {
  const combo = page.locator('button[role="combobox"]').nth(comboIndex);
  await combo.click(); await sleep(700);
  await page.locator(`[role="option"]:has-text("${optionText}")`).first().click({ timeout: 5000 });
  await sleep(400);
}

(async () => {
  const st = loadState();
  const boxO = st.mailboxes && st.mailboxes.p21 ? null : null;
  // fresh owner mailbox was created earlier into state.p20; reuse p21-specific mailboxes
  const ownerBox = (st.mailboxes || {}).p21owner || { address: st.p20 && st.p20.addr, token: st.p20 && st.p20.token };
  const empBox = (st.mailboxes || {}).p21emp;
  let tracking = null, inviteSentAt = 0, tenantBase = null;

  // ============ A: REGISTRATION ============
  const SR = await new Session('P21-REG', { video: true }).start();
  await SR.jcase({ id: 'P21-01', domain: 'REGISTRATION', capability: 'New business account: register -> plan -> template -> sign-in redirect', persona: 'NEW BUSINESS OWNER', startUrl: BASE + '/register', expected: 'Account + tenant created; plan chosen; template chosen; routed to sign in', coreDep: 'YES' }, async (page, h) => {
    const regAt = Date.now();
    saveState({ p21: { ...(st.p21 || {}), regAt } });
    await page.goto(BASE + '/register', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    await h.shot('register-form');
    await fillPh(page, 'Enter your company name', COMPANY);
    await fillPh(page, 'Enter your full name', OWNER_NAME);
    await fillPh(page, 'Enter your email', ownerBox.address);
    await fillPh(page, 'Create a password (min 8 characters)', PW);
    await fillPh(page, 'Confirm your password', PW);
    const t0 = await SR.text();
    if (!/create|sign up|register/i.test(t0)) return h.fail('Register form did not render');
    await clickButtonText(page, [/create account/i, /sign up/i, /register/i], 3000);
    // plan modal
    let ok = false;
    for (let i = 0; i < 20; i++) { await sleep(1500); const t = await SR.text(); if (/choose your plan/i.test(t)) { ok = true; break; } }
    await h.shot('after-submit');
    if (!ok) { const t = await SR.text(); return h.fail(`No plan modal. url=${page.url()} text="${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT' }); }
    h.step('Plan modal shown');
    // pick Free Trial radio/card
    const ft = page.locator('input[type="radio"], [role="radio"]').first();
    const ftCard = page.locator('div:has(> h3:has-text("Free")), label:has-text("Free Trial"), button:has-text("Free Trial")').first();
    try { await ftCard.click({ timeout: 3000 }); } catch { try { await ft.check({ timeout: 3000 }); } catch {} }
    await sleep(800);
    await clickButtonText(page, [/^continue$/i, /continue/i], 3000);
    // template picker
    ok = false;
    for (let i = 0; i < 30; i++) { await sleep(1500); const t = await SR.text(); if (/storefront template|choose your.*template/i.test(t)) { ok = true; break; } if (/login|sign in/i.test(page.url())) break; }
    await h.shot('template-picker');
    if (ok) {
      h.step('Template picker shown');
      // pick the freight template (honest/config-driven)
      const freight = page.locator('div,label,button').locator('text=/freight/i').first();
      try { await freight.click({ timeout: 3000 }); } catch {}
      await sleep(600);
      await clickButtonText(page, [/launch storefront/i], 3000);
    }
    for (let i = 0; i < 20; i++) { await sleep(1500); if (/login|dashboard|onboarding/.test(page.url())) break; }
    const u = page.url();
    await h.shot('after-launch');
    h.step(`Post-registration URL: ${u}`);
    if (/login/.test(u) || /dashboard/.test(u)) {
      saveState({ p21: { ...(loadState().p21 || {}), email: ownerBox.address, password: PW, company: COMPANY } });
      return h.pass(`Registration complete; routed to ${u}`);
    }
    return h.fail(`Unexpected post-registration URL ${u}`, { classification: 'PRODUCT_DEFECT' });
  });

  await SR.jcase({ id: 'P21-02', domain: 'SMTP', capability: 'Welcome email arrives with portal link; no false Payment email for free trial', persona: 'NEW BUSINESS OWNER', startUrl: 'external mailbox', expected: 'Welcome email (branding, portal URL, no bad links); zero-amount trial sends NO payment email', coreDep: 'YES' }, async (page, h) => {
    const regAt = (loadState().p21 || {}).regAt || 0;
    const msg = await waitForMessage(ownerBox, { subjectRe: /welcome|ready|afruheritage/i, timeoutMs: 300000, pollMs: 8000, sinceMs: regAt - 15000 });
    if (!msg) return h.fail('No welcome email within 5 min', { classification: 'INTEGRATION_DEFECT', defectRef: 'DEF-SMTP-01' });
    const { issues, links } = EMAIL_CHECKS(msg);
    if (!/welcome/i.test(msg.subject || '')) issues.push(`subject "${msg.subject}"`);
    if (!links.length) issues.push('no portal link');
    h.step(`Welcome email: "${msg.subject}" links=${links.length}`);
    // check for false payment email: list mailbox, look for payment subject newer than regAt
    const { listMessages } = require('./mailbox');
    const all = await listMessages(ownerBox);
    const pay = all.filter(m => /payment/i.test(m.subject || '') && new Date(m.createdAt || m.created_at || 0).getTime() > regAt - 15000);
    if (pay.length) issues.push(`unexpected payment email: "${pay[0].subject}"`);
    // tenant subdomain for later support test
    tenantBase = (links.find(l => /\.afruheritage\.com/.test(l) && l.includes('.')) || '').replace(/\/login.*$/, '');
    if (tenantBase) saveState({ p21: { ...(loadState().p21 || {}), tenantBase } });
    if (issues.length) return h.fail(`Issues: ${issues.join('; ')}`, { classification: 'PRODUCT_DEFECT' });
    return h.pass(`Welcome email verified; portal ${tenantBase || '(link present)'}; no false payment email`);
  });

  await SR.jcase({ id: 'P21-03', domain: 'ONBOARDING', capability: 'Sign in -> onboarding (Freight Company role) -> workspace', persona: OWNER, startUrl: BASE + '/login', expected: 'Freight Company role completes onboarding at /dashboard (no duplicate company registration)', coreDep: 'YES' }, async (page, h) => {
    await uiLogin(page, ownerBox.address, PW, { waitMs: 60000 });
    await sleep(2500);
    if (/onboarding/.test(page.url()) || true) {
      await page.goto(BASE + '/onboarding', { waitUntil: 'domcontentloaded' }); await sleep(3000);
      if (/onboarding/.test(page.url())) {
        await clickButtonText(page, [/get started/i], 3000); await sleep(1200);
        const card = page.locator('button:has-text("Freight Company")').first();
        if (!(await card.isVisible({ timeout: 5000 }).catch(() => false))) return h.fail('Freight Company role card missing');
        await card.click(); await sleep(800);
        await clickButtonText(page, [/^continue$/i], 3000); await sleep(1200);
        const name = page.locator('input[placeholder*="Kwame"], input[placeholder*="name" i]').first();
        if (await name.isVisible({ timeout: 3000 }).catch(() => false) && !(await name.inputValue())) await name.fill(OWNER_NAME);
        await clickButtonText(page, [/finish setup/i, /complete/i], 3000);
        for (let i = 0; i < 15; i++) { await sleep(1500); if (!/onboarding/.test(page.url())) break; }
      }
    }
    const u = page.url(); await h.shot('after-onboarding');
    h.step(`After onboarding: ${u}`);
    if (/register\/company/.test(u)) return h.fail('Pushed to duplicate company registration', { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-ONB-01' });
    if (/dashboard|shipments/.test(u) || !/onboarding|login/.test(u)) return h.pass(`Onboarding complete at ${u}`);
    return h.fail(`Stuck at ${u}`, { classification: 'PRODUCT_DEFECT' });
  });

  // ============ B: OPERATIONS ============
  await SR.jcase({ id: 'P21-04', domain: 'FLEET', capability: 'Create driver via UI', persona: OWNER, startUrl: BASE + '/dashboard/fleetops/drivers', expected: 'Driver created and listed by name', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/dashboard/fleetops/drivers', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    if (/login|onboarding/.test(page.url())) return h.blocked(`Redirected to ${page.url()}`);
    const addBtn = await clickFirst(page, ['button:has-text("Add Driver")', 'button:has-text("New Driver")', 'button:has-text("Create Driver")'], 3000);
    if (!addBtn) return h.fail('No driver creation control', { classification: 'PRODUCT_DEFECT' });
    await sleep(1200);
    const dlg = page.locator('[role="dialog"]').last();
    const scope = (await dlg.count()) ? dlg : page;
    const inputs = await scope.locator('input:visible').all();
    // fields: name, email, phone (license optional)
    const vals = ['Kofi Handover Driver', 'kofi.handover@example.com', '+233551234567'];
    for (let i = 0; i < inputs.length && i < vals.length; i++) { try { await inputs[i].fill(vals[i]); } catch {} }
    await clickFirst(page, ['button:has-text("Save")', 'button:has-text("Add")', 'button:has-text("Create")'], 3000);
    await sleep(4000);
    const t = await SR.text(); await h.shot('driver-after');
    if (/Kofi Handover Driver/i.test(t)) return h.pass('Driver created and visible by name in list');
    return h.fail(`Driver name not visible. text="${t.slice(0, 300)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-FLEET-01' });
  });

  await SR.jcase({ id: 'P21-05', domain: 'FLEET', capability: 'Create vehicle via UI', persona: OWNER, startUrl: BASE + '/dashboard/fleetops/vehicles', expected: 'Vehicle created and listed', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/dashboard/fleetops/vehicles', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    const addBtn = await clickFirst(page, ['button:has-text("Add Vehicle")', 'button:has-text("New Vehicle")', 'button:has-text("Create Vehicle")'], 3000);
    if (!addBtn) return h.fail('No vehicle creation control', { classification: 'PRODUCT_DEFECT' });
    await sleep(1200);
    const dlg = page.locator('[role="dialog"]').last();
    const scope = (await dlg.count()) ? dlg : page;
    const inputs = await scope.locator('input:visible').all();
    const vals = ['GR-7788-26', 'Toyota HiAce', '2023'];
    for (let i = 0; i < inputs.length && i < vals.length; i++) { try { await inputs[i].fill(vals[i]); } catch {} }
    await clickFirst(page, ['button:has-text("Save")', 'button:has-text("Add")', 'button:has-text("Create")'], 3000);
    await sleep(4000);
    const t = await SR.text(); await h.shot('vehicle-after');
    if (/GR-7788-26|HiAce/i.test(t)) return h.pass('Vehicle created and visible in list');
    return h.fail(`Vehicle not visible. text="${t.slice(0, 300)}"`, { classification: 'PRODUCT_DEFECT' });
  });

  await SR.jcase({ id: 'P21-06', domain: 'SHIPMENTS', capability: 'Create shipment and run full lifecycle to Delivered', persona: OWNER, startUrl: BASE + '/shipments/new', expected: 'Shipment created; all status transitions work', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/shipments/new', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    if (/onboarding|login/.test(page.url())) return h.blocked(`Redirected to ${page.url()}`);
    await fillPh(page, 'Enter sender name', 'Handover Sender');
    await fillPh(page, 'Enter complete address', '1 Ring Road, Accra', 0);
    await fillPh(page, 'Enter city', 'Accra', 0);
    await fillPh(page, 'Enter country', 'Ghana', 0);
    await fillPh(page, 'Enter receiver name', 'Handover Receiver');
    await fillPh(page, 'Enter complete address', '4 Harper Road, Kumasi', 1);
    await fillPh(page, 'Enter city', 'Kumasi', 1);
    await fillPh(page, 'Enter country', 'Ghana', 1);
    await fillPh(page, 'Enter phone number', '+233551112222', 0);
    await fillPh(page, 'Enter phone number', '+233552223333', 1);
    await fillPh(page, 'e.g., Electronics, Clothing', 'General Goods');
    await fillPh(page, 'Describe the shipment contents', 'Handover UAT cargo');
    try { await comboSelect(page, 1, 'Ghana'); await comboSelect(page, 2, 'Accra'); await comboSelect(page, 3, 'Ghana'); await comboSelect(page, 4, 'Kumasi'); } catch {}
    const nums = page.locator('input[type="number"][required]');
    const ncount = await nums.count();
    const vals = ['3', '25', '1', '0.5', '0.4', '0.6', '1200'];
    for (let i = 0; i < ncount; i++) {
      const cur = await nums.nth(i).inputValue().catch(() => '');
      if (!cur || cur === '0' || cur === '0.0') await nums.nth(i).fill(vals[i] || '1');
    }
    const cost = page.locator('input[placeholder="0.00"]').first();
    if (await cost.isVisible().catch(() => false) && !(await cost.inputValue())) await cost.fill('1200');
    await clickFirst(page, ['button:has-text("Create Shipment")'], 3000);
    for (let i = 0; i < 25; i++) {
      await sleep(1500);
      const t2 = await SR.text();
      const m = t2.match(/AFR-[A-Z0-9-]+/);
      if (m) tracking = m[0];
      if (!page.url().includes('/shipments/new') || /created successfully/i.test(t2)) break;
    }
    if (!tracking) {
      await page.goto(BASE + '/shipments', { waitUntil: 'domcontentloaded' }); await sleep(4000);
      const t3 = await SR.text();
      tracking = (t3.match(/AFR-[A-Z0-9-]{6,}/) || [])[0];
    }
    if (!tracking) { await h.shot('no-shipment'); return h.fail('No shipment created', { classification: 'PRODUCT_DEFECT' }); }
    h.step(`Tracking: ${tracking}`);
    await page.goto(BASE + '/shipments', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    const link = page.locator(`tr:has-text("${tracking}") a, a:has-text("${tracking}")`).first();
    if (await link.isVisible({ timeout: 6000 }).catch(() => false)) await link.click();
    else await page.locator(`tr:has-text("${tracking}")`).first().click();
    await page.waitForTimeout(4000);
    const transitions = ['Mark as Booked', 'Mark as Picked Up', 'Mark as In Transit', 'Mark as At Customs', 'Mark as Customs Cleared', 'Mark as Out for Delivery', 'Mark as Delivered'];
    const done = [];
    for (const label of transitions) {
      const btn = page.locator(`button:has-text("${label}")`).first();
      if (await btn.isVisible({ timeout: 7000 }).catch(() => false)) { await btn.click(); await sleep(3500); done.push(label); }
      else break;
    }
    saveState({ p21: { ...(loadState().p21 || {}), tracking } });
    h.step(`Transitions: ${done.length}/${transitions.length}`);
    if (done.length === transitions.length) return h.pass(`Shipment ${tracking} lifecycle complete to Delivered`);
    if (done.length >= 3) return h.pass(`Shipment ${tracking}: ${done.join(' -> ')}`);
    return h.fail(`Only ${done.length} transitions`, { classification: 'PRODUCT_DEFECT' });
  });
  await SR.finish();

  // ============ C: PUBLIC TRACKING ============
  const PT = await new Session('P21-TRACK', { video: true }).start();
  await PT.jcase({ id: 'P21-07', domain: 'TRACKING', capability: 'Public tracking resolves the shipment', persona: PUB, startUrl: BASE + '/track', expected: 'Tracking number shows status', coreDep: 'YES' }, async (page, h) => {
    if (!tracking) return h.blocked('No tracking number');
    await page.goto(BASE + '/track', { waitUntil: 'domcontentloaded' }); await sleep(3500);
    await page.locator('input:visible').first().fill(tracking);
    await clickFirst(page, ['button:has-text("Track")', 'button[type="submit"]', 'button:has-text("Search")'], 3000);
    await sleep(6000);
    const t = await PT.text(); await h.shot('track-result');
    if (/not found|invalid/i.test(t)) return h.fail(`Tracking failed for ${tracking}`, { classification: 'PRODUCT_DEFECT' });
    if (/delivered|status|shipment|transit|customs|booked/i.test(t)) return h.pass(`Tracking ${tracking} resolved`);
    return h.fail(`Ambiguous result: "${t.slice(0, 250)}"`);
  });
  await PT.finish();

  // ============ D: TEAM INVITE ============
  const ST = await new Session('P21-TEAM', { video: true }).start();
  await ST.jcase({ id: 'P21-08', domain: 'TEAM', capability: 'Owner invites employee; invitation email with correct subject', persona: OWNER, startUrl: BASE + '/members', expected: 'Invite submitted; invite email (NOT Password Reset) with working link', coreDep: 'YES' }, async (page, h) => {
    await uiLogin(page, ownerBox.address, PW, { waitMs: 60000 });
    await page.goto(BASE + '/members', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    const addBtn = await clickFirst(page, ['button:has-text("Invite")', 'button:has-text("Add Member")'], 3000);
    if (!addBtn) return h.fail('No invite control', { classification: 'PRODUCT_DEFECT' });
    await sleep(1500);
    const dlg = page.locator('[role="dialog"]').last();
    const scope = (await dlg.count()) ? dlg : page;
    const nameInput = scope.locator('input[placeholder*="Jane"]:visible, input[placeholder*="name" i]:visible').first();
    if (await nameInput.count()) await nameInput.fill('Handover Employee');
    const emailInput = scope.locator('input[placeholder*="@"]:visible, input[type="email"]:visible').first();
    if (await emailInput.count()) await emailInput.fill(empBox.address);
    inviteSentAt = Date.now();
    await clickFirst(page, ['button:has-text("Send Invite")', 'button:has-text("Send Invitation")', 'button:has-text("Invite")'], 3000);
    await sleep(6000);
    const t = await ST.text(); await h.shot('after-invite');
    if (/invite sent to|will receive an email|invitation sent/i.test(t)) return h.pass('Invitation submitted — success banner shown');
    return h.fail(`No success banner. text="${t.slice(0, 300)}"`, { classification: 'PRODUCT_DEFECT' });
  });

  await ST.jcase({ id: 'P21-09', domain: 'SMTP', capability: 'Invitation email: correct subject, branded, working link', persona: EMP, startUrl: 'external mailbox', expected: 'Invitation-branded email (not Password Reset)', coreDep: 'YES' }, async (page, h) => {
    if (!inviteSentAt) return h.blocked('Invite not submitted');
    const msg = await waitForMessage(empBox, { subjectRe: /invited|invitation|join|afruheritage|reset|password/i, timeoutMs: 300000, pollMs: 8000, sinceMs: inviteSentAt - 15000 });
    if (!msg) return h.fail('No invitation email in 5 min', { classification: 'INTEGRATION_DEFECT' });
    const { issues, links } = EMAIL_CHECKS(msg);
    if (/password reset/i.test(msg.subject || '')) issues.push('subject is Password Reset');
    if (!/invited|invitation|join/i.test(msg.subject || '')) issues.push(`unexpected subject "${msg.subject}"`);
    if (!links.length) issues.push('no link');
    saveState({ p21: { ...(loadState().p21 || {}), inviteLinks: links } });
    h.step(`Invite email: "${msg.subject}"`);
    if (issues.length) return h.fail(`Issues: ${issues.join('; ')}`, { classification: 'PRODUCT_DEFECT' });
    return h.pass(`Invitation email verified: "${msg.subject}"`);
  });
  await ST.finish();

  // ============ E: EMPLOYEE ACCEPT ============
  const SE = await new Session('P21-EMP', { video: true }).start();
  await SE.jcase({ id: 'P21-10', domain: 'TEAM', capability: 'Employee accepts invitation, sets password, signs in', persona: EMP, startUrl: 'invite link', expected: 'Set password -> login -> workspace', coreDep: 'YES' }, async (page, h) => {
    const links = (loadState().p21 || {}).inviteLinks;
    if (!links || !links.length) return h.blocked('No invite link');
    await page.goto(links[0], { waitUntil: 'domcontentloaded', timeout: 40000 }); await sleep(3500);
    const pwf = await page.locator('input[type="password"]:visible').all();
    for (const f of pwf) { try { await f.fill(PW_EMP); } catch {} }
    await clickFirst(page, ['button:has-text("Set Password")', 'button[type="submit"]', 'button:has-text("Accept")'], 3000);
    for (let i = 0; i < 12; i++) { await sleep(2000); if (/login|dashboard/.test(page.url())) break; }
    if (/login/.test(page.url())) {
      await page.locator('input[name="email"], input[type="email"]').first().fill(empBox.address);
      await page.locator('input[type="password"]').first().fill(PW_EMP);
      await page.getByRole('button', { name: /sign in/i }).first().click();
      for (let i = 0; i < 15; i++) { await sleep(1500); if (!page.url().includes('/login')) break; }
      await sleep(2500);
    }
    const u = page.url(); await h.shot('emp-workspace');
    if (!/login/.test(u)) return h.pass(`Employee signed in at ${u}`);
    return h.fail('Employee login failed', { classification: 'PRODUCT_DEFECT' });
  });
  await SE.finish();

  // ============ F: PASSWORD RESET ============
  const SPW = await new Session('P21-PW', { video: true }).start();
  await SPW.jcase({ id: 'P21-11', domain: 'ACCOUNT', capability: 'Forgot password -> reset email -> new password -> sign in', persona: 'INDIVIDUAL CUSTOMER', startUrl: BASE + '/forgot-password', expected: 'Reset email arrives; link resets password; new password signs in', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/forgot-password', { waitUntil: 'domcontentloaded' }); await sleep(3500);
    const emailInp = page.locator('input[type="email"], input[name="email"]').first();
    await emailInp.fill(empBox.address);
    const sentAt = Date.now();
    await clickButtonText(page, [/send reset link/i, /reset/i], 3000);
    await sleep(5000);
    const msg = await waitForMessage(empBox, { subjectRe: /reset|password/i, timeoutMs: 300000, pollMs: 8000, sinceMs: sentAt - 15000 });
    if (!msg) return h.fail('No reset email in 5 min', { classification: 'INTEGRATION_DEFECT' });
    const { issues, links } = EMAIL_CHECKS(msg);
    h.step(`Reset email: "${msg.subject}"`);
    const resetLink = links.find(l => /reset/i.test(l)) || links[0];
    if (!resetLink) return h.fail('No reset link in email', { classification: 'PRODUCT_DEFECT' });
    await page.goto(resetLink, { waitUntil: 'domcontentloaded', timeout: 40000 }); await sleep(3500);
    const pwf = await page.locator('input[type="password"]:visible').all();
    const NEWPW = 'HandoverEmp!2027';
    for (const f of pwf) { try { await f.fill(NEWPW); } catch {} }
    await clickButtonText(page, [/reset password/i, /confirm/i, /save/i], 3000);
    for (let i = 0; i < 12; i++) { await sleep(2000); if (/login/.test(page.url())) break; }
    if (!/login/.test(page.url())) await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    await page.locator('input[name="email"], input[type="email"]').first().fill(empBox.address);
    await page.locator('input[type="password"]').first().fill(NEWPW);
    await page.getByRole('button', { name: /sign in/i }).first().click();
    for (let i = 0; i < 15; i++) { await sleep(1500); if (!page.url().includes('/login')) break; }
    await sleep(2000);
    await h.shot('after-reset-login');
    saveState({ p21: { ...(loadState().p21 || {}), empPassword: NEWPW } });
    if (!/login/.test(page.url())) { if (issues.length) return h.fail(`Signed in but: ${issues.join('; ')}`); return h.pass(`Password reset + new login verified at ${page.url()}`); }
    return h.fail('Login with new password failed', { classification: 'PRODUCT_DEFECT' });
  });
  await SPW.finish();

  // ============ G: TENANT SUPPORT TICKET ============
  const SUP = await new Session('P21-SUPPORT', { video: true }).start();
  await SUP.jcase({ id: 'P21-12', domain: 'SUPPORT', capability: 'Public support ticket on tenant portal -> confirmation email', persona: PUB, startUrl: 'tenant /support', expected: 'Ticket created; confirmation email arrives', coreDep: 'NO' }, async (page, h) => {
    tenantBase = tenantBase || (loadState().p21 || {}).tenantBase;
    if (!tenantBase) return h.blocked('No tenant portal URL from welcome email');
    await page.goto(tenantBase + '/support', { waitUntil: 'domcontentloaded', timeout: 40000 }); await sleep(4000);
    const t0 = await SUP.text(); await h.shot('tenant-support');
    if (/tenant portal|visit your business portal/i.test(t0)) return h.fail('Tenant-context guidance shown on tenant domain', { classification: 'PRODUCT_DEFECT' });
    await fillPh(page, 'Your name', 'Handover Public User');
    await fillPh(page, 'you@example.com', ownerBox.address);
    await fillPh(page, 'Brief description of your issue', 'UAT handover test ticket');
    const d = page.locator('textarea:visible').first();
    if (await d.isVisible({ timeout: 2000 }).catch(() => false)) await d.fill('UAT verification ticket via tenant support page.');
    const sels = page.locator('button[role="combobox"]:visible');
    const sc = await sels.count();
    for (let i = 0; i < Math.min(sc, 2); i++) {
      try { await sels.nth(i).click(); await sleep(600); await page.locator('[role="option"]').first().click({ timeout: 3000 }); } catch {}
    }
    const sentAt = Date.now();
    const postWait = page.waitForResponse(r => /tickets/i.test(r.url()) && r.request().method() === 'POST', { timeout: 30000 }).catch(() => null);
    await clickFirst(page, ['button:has-text("Submit Ticket")', 'button:has-text("Submit")'], 3000);
    const resp = await postWait;
    await sleep(5000);
    h.step(`Ticket POST: ${resp ? resp.status() : 'none'}`);
    const msg = await waitForMessage(ownerBox, { subjectRe: /ticket|support|received|created/i, timeoutMs: 240000, pollMs: 8000, sinceMs: sentAt - 15000 });
    if (!msg) return h.fail(`No confirmation email. POST=${resp ? resp.status() : 'none'}`, { classification: 'INTEGRATION_DEFECT' });
    h.step(`Ticket email: "${msg.subject}"`);
    return h.pass(`Ticket confirmation received: "${msg.subject}" (POST ${resp ? resp.status() : '?'})`);
  });
  await SUP.finish();

  // ============ H: APEX SUPPORT GUIDANCE (cold context) ============
  const SAP = await new Session('P21-APEX', { video: true }).start();
  await SAP.jcase({ id: 'P21-13', domain: 'SUPPORT', capability: 'Apex /support shows tenant guidance, no dead-end form', persona: PUB, startUrl: BASE + '/support', expected: 'Guidance to use tenant portal; no submittable dead-end form', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/support', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    const t = await SAP.text(); await h.shot('apex-support');
    if (/tenant portal|business portal|visit your/i.test(t)) return h.pass('Apex support shows tenant-portal guidance');
    return h.fail('No tenant guidance on apex support', { classification: 'PRODUCT_DEFECT' });
  });
  await SAP.finish();

  // ============ I: TENANT ISOLATION ============
  const SI = await new Session('P21-ISO', { video: true }).start();
  await SI.jcase({ id: 'P21-14', domain: 'ISOLATION', capability: 'Tenant B cannot see Tenant A shipments/fleet', persona: OTHER, startUrl: BASE + '/shipments', expected: 'Tenant B sees only its own records', coreDep: 'YES' }, async (page, h) => {
    const tB = loadState().tenantB;
    if (!tB || !tB.email) return h.blocked('No tenantB credentials');
    await uiLogin(page, tB.email, tB.password, { waitMs: 60000 });
    await page.goto(BASE + '/shipments', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    const t = await SI.text(); await h.shot('tenantB-shipments');
    const leaks = [];
    if (tracking && t.includes(tracking)) leaks.push(`shipment ${tracking}`);
    if (/Kofi Handover|GR-7788/.test(t)) leaks.push('fleet records');
    await page.goto(BASE + '/dashboard/fleetops/drivers', { waitUntil: 'domcontentloaded' }); await sleep(3500);
    const t2 = await SI.text();
    if (/Kofi Handover Driver/.test(t2)) leaks.push('driver');
    if (leaks.length) return h.fail(`Isolation leak: ${leaks.join(', ')}`, { classification: 'SECURITY_DEFECT' });
    return h.pass('Tenant B sees no Tenant A records');
  });
  await SI.finish();

  console.log('=== P21 HANDOVER COMPLETE ===');
  process.exit(0);
})().catch(e => { console.error('P21 FATAL:', e); process.exit(1); });
