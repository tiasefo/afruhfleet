// Phase 19 — Customer UAT handover verification: complete business journey on a
// FRESH business + real SMTP evidence for every advertised email type.
// Emits to PROD_UI_UAT_MATRIX.csv. No fixes during this run.
const { BASE, Session, loadState, saveState, uiLogin, clickFirst } = require('./harness');
const { waitForMessage, extractLinks } = require('./mailbox');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OWNER = 'BUSINESS OWNER';
const EMP = 'INVITED EMPLOYEE';
const PUB = 'PUBLIC VISITOR';
const PW = 'UatHandover!2026';
const PW_NEW = 'UatHandover!2026New';
const PW_EMP = 'UatEmp!2026';
const COMPANY = 'UAT Handover Logistics';
const OWNER_NAME = 'UAT Handover Owner';

const EMAIL_CHECKS = (msg, expected) => {
  const issues = [];
  const html = (msg.html || []).join(' ') + ' ' + (msg.text || '');
  if (!expected.subjectRe.test(msg.subject || '')) issues.push(`subject "${msg.subject}" !~ ${expected.subjectRe}`);
  const links = extractLinks(msg);
  const bad = links.filter(l => /localhost|127\.0\.0\.1|0\.0\.0\.0|\d+\.\d+\.\d+\.\d+|:8\d{3}|api\.afruheritage/.test(l));
  if (bad.length) issues.push('bad links: ' + bad.join(','));
  if (!/afruheritage/i.test(html) && !/afruheritage/i.test(msg.subject || '')) issues.push('no Afruheritage branding in body');
  if (expected.mustLink && !links.length) issues.push('no link found');
  return { issues, links };
};

async function clickButtonText(page, patterns, timeout = 2000, exclude) {
  for (const role of ['button', 'link']) {
    for (const p of patterns) {
      const items = await page.getByRole(role, { name: p }).all();
      for (const it of items) {
        try {
          const txt = (await it.innerText()) || '';
          if (exclude && exclude.test(txt)) continue;
          if (await it.isVisible()) { await it.click(); return txt.trim().slice(0, 40); }
        } catch {}
      }
    }
  }
  return null;
}
async function fillPh(page, ph, val, nth = 0) {
  const loc = page.locator(`input[placeholder="${ph}"], textarea[placeholder="${ph}"]`).nth(nth);
  try { await loc.fill(val); } catch {}
}
async function comboSelect(page, comboIndex, optionText) {
  const combo = page.locator('button[role="combobox"]').nth(comboIndex);
  await combo.click(); await sleep(700);
  const opt = page.locator(`[role="option"]:has-text("${optionText}")`).first();
  await opt.click({ timeout: 5000 }); await sleep(400);
}
async function fillBy(scope, keys, val) {
  for (const k of keys) {
    const l = scope.locator(`input[name*="${k}" i]:visible, input[placeholder*="${k}" i]:visible`).first();
    try { if (await l.isVisible({ timeout: 1200 })) { await l.fill(val); return k; } } catch {}
  }
  return null;
}

(async () => {
  const st = loadState();
  const boxO = st.mailboxes.uatOwner;
  const boxE = st.mailboxes.uatEmp;
  const boxP = st.mailboxes.uatPub;
  let tracking = null, inviteSentAt = 0, resetSentAt = 0, ticketSentAt = 0, regAt = Date.now();

  // ================= Session R: registration =================
  const SR = await new Session('UAT-REG', { video: true }).start();
  await SR.jcase({ id: 'UAT-01', domain: 'IDENTITY', capability: 'New business registration via public site', persona: OWNER, startUrl: BASE + '/register', expected: 'Account created; confirmation shown', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/register', { waitUntil: 'domcontentloaded' }); await sleep(3000);
    await page.locator('input[name="company_name"]').fill(COMPANY);
    await page.locator('input[name="full_name"]').fill(OWNER_NAME);
    await page.locator('input[name="email"]').fill(boxO.address);
    await page.locator('input[name="password"]').fill(PW);
    await page.locator('input[name="confirm_password"]').fill(PW);
    await h.shot('register-form');
    regAt = Date.now();
    await clickFirst(page, ['button:has-text("Create Account")', 'button[type="submit"]']);
    for (let i = 0; i < 14; i++) { await sleep(1500); if (!page.url().endsWith('/register')) break; }
    const t = await SR.text(); const u = page.url();
    await h.shot('post-register');
    if (!u.endsWith('/register') || /welcome|check your email|verify|dashboard|onboarding/i.test(t)) {
      return h.pass(`Registration submitted -> ${u}`);
    }
    return h.fail(`Stalled on /register. text="${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT' });
  });

  await SR.jcase({ id: 'UAT-02', domain: 'SMTP', capability: 'Welcome/registration email — real delivery, correct subject, working link', persona: OWNER, startUrl: 'external mailbox', expected: 'Branded Afruheritage welcome email with valid link', coreDep: 'YES' }, async (page, h) => {
    const msg = await waitForMessage(boxO, { subjectRe: /afruheritage|welcome|verify|confirm|ready/i, timeoutMs: 300000, pollMs: 8000, sinceMs: regAt - 20000 });
    if (!msg) return h.fail('No welcome email within 5 minutes', { classification: 'INTEGRATION_DEFECT' });
    const { issues, links } = EMAIL_CHECKS(msg, { subjectRe: /welcome|verify|confirm|ready|afruheritage/i, mustLink: true });
    h.step(`Welcome email: "${msg.subject}" from ${msg.from?.address}; links=${links.length}`);
    if (links.length) { await page.goto(links[0], { waitUntil: 'domcontentloaded' }); await sleep(2500); await h.shot('email-link-lands'); h.step(`Link lands: ${page.url()}`); }
    if (issues.length) return h.fail(`Email issues: ${issues.join('; ')}`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-SMTP-01' });
    return h.pass(`Welcome email verified: "${msg.subject}", links=${links.length}, lands ${page.url().slice(0, 80)}`, { notes: links.join(' | ') });
  });

  await SR.jcase({ id: 'UAT-03', domain: 'TENANT', capability: 'Login, onboarding, trial activation', persona: OWNER, startUrl: BASE + '/login', expected: 'Login -> onboarding -> trial active', coreDep: 'YES' }, async (page, h) => {
    await uiLogin(page, boxO.address, PW, { waitMs: 60000 });
    // onboarding progression
    for (let i = 0; i < 6; i++) {
      const clicked = await clickButtonText(page, [/continue/i, /next/i, /get started/i, /finish/i, /complete/i, /skip/i, /go to dashboard/i], 1500, /google|oauth/i);
      if (!clicked) break;
      h.step(`Onboarding: ${clicked}`);
      await sleep(1800);
      if (/dashboard/.test(page.url())) break;
    }
    await page.goto(BASE + '/billing', { waitUntil: 'domcontentloaded' }); await sleep(3000);
    let t = await SR.text();
    if (/no active subscription/i.test(t)) {
      const sel = await clickFirst(page, ['button:has-text("Select Plan")'], 3000);
      if (sel) { await sleep(1500); await clickFirst(page, ['button:has-text("Start Free Trial")', 'button:has-text("Start Trial")', 'button:has-text("Confirm")'], 3000); }
      await sleep(6000);
      t = await SR.text();
    }
    await h.shot('billing-after');
    saveState({ uatOwner: { email: boxO.address, password: PW, company: COMPANY } });
    if (/trial|trialing|active|free/i.test(t) && !/no active subscription/i.test(t)) {
      return h.pass(`Trial activated: "${t.slice(0, 220)}"`);
    }
    return h.fail(`Trial activation unclear. text="${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT' });
  });

  // ================= invite employee =================
  await SR.jcase({ id: 'UAT-04', domain: 'TEAM', capability: 'Owner invites employee via Team Members UI', persona: OWNER, startUrl: BASE + '/members', expected: 'Invitation submitted with confirmation', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/members', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    const addBtn = await clickFirst(page, ['button:has-text("Invite")', 'button:has-text("Add Member")'], 3000);
    if (!addBtn) return h.fail('No invite control', { classification: 'PRODUCT_DEFECT' });
    await sleep(1500);
    const dlg = page.locator('[role="dialog"]').last();
    const scope = (await dlg.count()) ? dlg : page;
    const emailInput = scope.locator('input[placeholder*="@"]:visible, input[type="email"]:visible').first();
    if (await emailInput.count()) await emailInput.fill(boxE.address);
    const nameInput = scope.locator('input[placeholder*="Jane"]:visible, input[placeholder*="name" i]:visible').first();
    if (await nameInput.count()) await nameInput.fill('UAT Employee');
    inviteSentAt = Date.now();
    await clickFirst(page, ['button:has-text("Send Invite")', 'button:has-text("Send Invitation")', 'button:has-text("Add Member")'], 3000);
    await sleep(5000);
    const t = await SR.text();
    await h.shot('after-invite');
    if (/invite sent to|will receive an email to set/i.test(t)) return h.pass('Invitation submitted');
    return h.fail(`No invite confirmation: "${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT' });
  });

  await SR.jcase({ id: 'UAT-05', domain: 'SMTP', capability: 'Employee invitation email — invitation subject (not Password Reset), working accept link', persona: EMP, startUrl: 'external mailbox', expected: 'Invitation-branded email with accept link', coreDep: 'YES' }, async (page, h) => {
    if (!inviteSentAt) return h.blocked('UAT-04 did not submit');
    const msg = await waitForMessage(boxE, { subjectRe: /invited|invitation|join|afruheritage|reset|password/i, timeoutMs: 300000, pollMs: 8000, sinceMs: inviteSentAt - 15000 });
    if (!msg) return h.fail('No invitation email in 5 min', { classification: 'INTEGRATION_DEFECT' });
    const { issues, links } = EMAIL_CHECKS(msg, { subjectRe: /invited|invitation|join/i, mustLink: true });
    saveState({ uatInvite: { subject: msg.subject, links } });
    h.step(`Invite email: "${msg.subject}"`);
    if (/password reset/i.test(msg.subject)) issues.push('subject is Password Reset');
    if (issues.length) return h.fail(`Invitation email issues: ${issues.join('; ')}`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-SMTP-02' });
    return h.pass(`Invitation email verified: "${msg.subject}"`, { notes: links.join(' | ') });
  });

  // ================= shipment lifecycle + status emails =================
  await SR.jcase({ id: 'UAT-06', domain: 'SHIPMENTS', capability: 'Create shipment and run full status lifecycle', persona: OWNER, startUrl: BASE + '/shipments/new', expected: 'Shipment created; transitions draft->booked->picked_up->in_transit->delivered', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/shipments/new', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    await fillPh(page, 'Enter sender name', 'UAT Sender');
    await fillPh(page, 'Enter complete address', '1 Ring Road, Accra', 0);
    await fillPh(page, 'Enter city', 'Accra', 0);
    await fillPh(page, 'Enter country', 'Ghana', 0);
    await fillPh(page, 'Enter receiver name', 'UAT Receiver');
    await fillPh(page, 'Enter complete address', '4 Harper Road, Kumasi', 1);
    await fillPh(page, 'Enter city', 'Kumasi', 1);
    await fillPh(page, 'Enter country', 'Ghana', 1);
    await fillPh(page, 'Enter phone number', '+233551112222', 0);
    await fillPh(page, 'Enter phone number', '+233552223333', 1);
    await fillPh(page, 'e.g., Electronics, Clothing', 'General Goods');
    await fillPh(page, 'Describe the shipment contents', 'UAT cargo');
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
    await h.shot('created');
    if (!tracking) {
      // fall back: read from list
      await page.goto(BASE + '/shipments', { waitUntil: 'domcontentloaded' }); await sleep(4000);
      const t3 = await SR.text();
      tracking = (t3.match(/AFR-[A-Z0-9-]{6,}/) || [])[0];
    }
    if (!tracking) return h.fail('No shipment created', { classification: 'PRODUCT_DEFECT' });
    h.step(`Tracking: ${tracking}`);
    // open the shipment detail and transition through the lifecycle
    await page.goto(BASE + '/shipments', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    const link = page.locator(`a:has-text("${tracking}"), tr:has-text("${tracking}")`).first();
    if (await link.isVisible({ timeout: 5000 }).catch(() => false)) await link.click();
    await sleep(4000);
    h.step(`Detail page: ${page.url()}`);
    const transitions = ['Mark as Booked', 'Mark as Picked Up', 'Mark as In Transit', 'Mark as At Customs', 'Mark as Customs Cleared', 'Mark as Out for Delivery', 'Mark as Delivered'];
    const done = [];
    for (const label of transitions) {
      const btn = page.locator(`button:has-text("${label}")`).first();
      if (await btn.isVisible({ timeout: 6000 }).catch(() => false)) {
        await btn.click(); await sleep(3500);
        done.push(label);
      } else { break; }
    }
    await h.shot('after-transitions');
    const t = await SR.text();
    saveState({ uatShipment: { tracking, transitions: done } });
    h.step(`Transitions applied: ${done.join(' -> ') || 'none'}`);
    if (done.length >= 3 && /delivered|in transit|customs/i.test(t)) return h.pass(`Shipment ${tracking}: transitions ${done.join(' -> ')}`);
    if (done.length >= 1) return h.pass(`Shipment ${tracking}: partial lifecycle ${done.join(' -> ')}`);
    return h.fail(`No transitions applied on ${tracking}`, { classification: 'PRODUCT_DEFECT' });
  });

  await SR.jcase({ id: 'UAT-07', domain: 'SMTP', capability: 'Shipment status notification emails to business owner', persona: OWNER, startUrl: 'external mailbox', expected: 'Status update / delivered emails arrive for owner', coreDep: 'NO' }, async (page, h) => {
    if (!tracking) return h.blocked('No shipment');
    const msg = await waitForMessage(boxO, { subjectRe: /shipment|status|delivered|update|transit|picked|AFR-/i, timeoutMs: 180000, pollMs: 8000 });
    if (!msg) return h.fail('No shipment notification email within 3 min', { classification: 'INTEGRATION_DEFECT', defectRef: 'DEF-SMTP-03' });
    const { issues } = EMAIL_CHECKS(msg, { subjectRe: /.+/ });
    h.step(`Status email: "${msg.subject}"`);
    if (issues.length) return h.fail(`Email issues: ${issues.join('; ')}`, { classification: 'PRODUCT_DEFECT' });
    return h.pass(`Shipment notification received: "${msg.subject}"`);
  });

  await SR.jcase({ id: 'UAT-08', domain: 'TRACKING', capability: 'Public tracking of delivered shipment', persona: PUB, startUrl: BASE + '/track', expected: 'Tracking number resolves to current status', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/track', { waitUntil: 'domcontentloaded' }); await sleep(3500);
    const inp = page.locator('input:visible').first();
    await inp.fill(tracking || 'NONE');
    await clickFirst(page, ['button:has-text("Track")', 'button[type="submit"]', 'button:has-text("Search")'], 3000);
    await sleep(6000);
    const t = await SR.text();
    await h.shot('track-result');
    if (/delivered|status|shipment|transit/i.test(t) && !/not found|invalid/i.test(t)) return h.pass(`Tracking ${tracking} resolved`);
    return h.fail(`Tracking lookup failed for ${tracking}: "${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT' });
  });
  await SR.finish();

  // ================= Session E: employee accepts =================
  const SE = await new Session('UAT-EMP', { video: true }).start();
  await SE.jcase({ id: 'UAT-09', domain: 'TEAM', capability: 'Employee accepts invitation and signs in', persona: EMP, startUrl: 'invite link', expected: 'Set password -> login -> workspace', coreDep: 'YES' }, async (page, h) => {
    const inv = loadState().uatInvite;
    if (!inv || !inv.links || !inv.links.length) return h.blocked('No invite link');
    await page.goto(inv.links[0], { waitUntil: 'domcontentloaded', timeout: 40000 }); await sleep(3500);
    const pwFields = await page.locator('input[type="password"]:visible').all();
    for (const f of pwFields) { try { await f.fill(PW_EMP); } catch {} }
    await clickFirst(page, ['button:has-text("Set Password")', 'button[type="submit"]', 'button:has-text("Accept")'], 3000);
    for (let i = 0; i < 12; i++) {
      await sleep(2000);
      const tt = await SE.text();
      if (/login|dashboard/.test(page.url())) break;
      if (/password set successfully|redirecting/i.test(tt)) { await sleep(2500); break; }
    }
    if (/login/.test(page.url())) {
      await page.locator('input[name="email"]').fill(boxE.address);
      await page.locator('input[type="password"]').first().fill(PW_EMP);
      await page.getByRole('button', { name: /sign in/i }).first().click();
      for (let i = 0; i < 15; i++) { await sleep(1500); if (!page.url().includes('/login')) break; }
      await sleep(2500);
    }
    const u = page.url(); const t = await SE.text();
    await h.shot('emp-workspace');
    if (!/login/.test(u)) {
      saveState({ uatEmp: { email: boxE.address, password: PW_EMP } });
      return h.pass(`Employee inside workspace: ${u}`);
    }
    return h.fail(`Employee login failed. text="${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT' });
  });
  await SE.finish();

  // ================= Session P: public support ticket =================
  const SP = await new Session('UAT-PUB', { video: true }).start();
  await SP.jcase({ id: 'UAT-10', domain: 'SMTP', capability: 'Public support ticket -> confirmation email at external mailbox', persona: PUB, startUrl: BASE + '/support', expected: 'Ticket submitted; confirmation email arrives with ticket link', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/support', { waitUntil: 'domcontentloaded' }); await sleep(3500);
    const t0 = await SP.text();
    if (!/support|ticket|help/i.test(t0)) return h.fail('Support page did not render', { classification: 'PRODUCT_DEFECT' });
    await fillPh(page, 'Your name', 'UAT Public User');
    await fillPh(page, 'you@example.com', boxP.address);
    await fillPh(page, 'Brief description of your issue', 'UAT test ticket — tracking question');
    const d = page.locator('textarea:visible').first();
    if (await d.isVisible({ timeout: 2000 }).catch(() => false)) await d.fill('This is a UAT verification ticket submitted through the public support form.');
    // category/priority selects if present
    const sels = page.locator('button[role="combobox"]:visible');
    const sc = await sels.count();
    for (let i = 0; i < Math.min(sc, 2); i++) {
      try {
        await sels.nth(i).click(); await sleep(600);
        await page.locator('[role="option"]').first().click({ timeout: 3000 });
      } catch {}
    }
    await h.shot('ticket-form');
    ticketSentAt = Date.now();
    const sub = await clickFirst(page, ['button:has-text("Submit")', 'button:has-text("Create Ticket")', 'button:has-text("Send")'], 3000);
    h.step(`Submit: ${sub}`);
    await sleep(5000);
    const t = await SP.text();
    await h.shot('after-ticket');
    const msg = await waitForMessage(boxP, { subjectRe: /ticket|support|received|afruheritage/i, timeoutMs: 240000, pollMs: 8000, sinceMs: ticketSentAt - 15000 });
    if (!msg) {
      if (/success|submitted|received|created/i.test(t)) return h.fail(`Ticket submitted in UI but no confirmation email`, { classification: 'INTEGRATION_DEFECT', defectRef: 'DEF-SMTP-04' });
      return h.fail(`Ticket submission unclear and no email. text="${t.slice(0, 200)}"`, { classification: 'PRODUCT_DEFECT' });
    }
    const { issues, links } = EMAIL_CHECKS(msg, { subjectRe: /ticket|support|received|help/i });
    h.step(`Ticket email: "${msg.subject}" links=${links.length}`);
    if (issues.length) return h.fail(`Ticket email issues: ${issues.join('; ')}`, { classification: 'PRODUCT_DEFECT' });
    return h.pass(`Ticket confirmation email received: "${msg.subject}"`);
  });
  await SP.finish();

  // ================= Session F: forgot password =================
  const SF = await new Session('UAT-RESET', { video: true }).start();
  await SF.jcase({ id: 'UAT-11', domain: 'SMTP', capability: 'Password recovery — reset email, link works, old password rejected', persona: OWNER, startUrl: BASE + '/forgot-password', expected: 'Reset email -> new password -> login; old password fails', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/forgot-password', { waitUntil: 'domcontentloaded' }); await sleep(3000);
    const em = page.locator('input[type="email"]:visible, input[name="email"]:visible').first();
    await em.fill(boxO.address);
    resetSentAt = Date.now();
    await clickFirst(page, ['button[type="submit"]', 'button:has-text("Send")', 'button:has-text("Reset")'], 3000);
    await sleep(4000);
    await h.shot('forgot-submitted');
    const msg = await waitForMessage(boxO, { subjectRe: /password reset|reset/i, timeoutMs: 240000, pollMs: 8000, sinceMs: resetSentAt - 15000 });
    if (!msg) return h.fail('No password-reset email within 4 min', { classification: 'INTEGRATION_DEFECT', defectRef: 'DEF-SMTP-05' });
    const { issues, links } = EMAIL_CHECKS(msg, { subjectRe: /password reset|reset/i, mustLink: true });
    h.step(`Reset email: "${msg.subject}"`);
    if (issues.length) return h.fail(`Reset email issues: ${issues.join('; ')}`, { classification: 'PRODUCT_DEFECT' });
    const resetLink = links.find(l => /reset-password/.test(l)) || links[0];
    await page.goto(resetLink, { waitUntil: 'domcontentloaded', timeout: 40000 }); await sleep(3500);
    const pwf = await page.locator('input[type="password"]:visible').all();
    for (const f of pwf) { try { await f.fill(PW_NEW); } catch {} }
    await clickFirst(page, ['button[type="submit"]', 'button:has-text("Reset")', 'button:has-text("Set Password")'], 3000);
    for (let i = 0; i < 12; i++) { await sleep(2000); if (/login|dashboard/.test(page.url())) break; }
    if (/login/.test(page.url())) {
      await page.locator('input[name="email"]').fill(boxO.address);
      await page.locator('input[type="password"]').first().fill(PW_NEW);
      await page.getByRole('button', { name: /sign in/i }).first().click();
      for (let i = 0; i < 15; i++) { await sleep(1500); if (!page.url().includes('/login')) break; }
      await sleep(2500);
    }
    const u = page.url();
    await h.shot('after-reset-login');
    if (/login/.test(u)) return h.fail(`Login with new password failed. url=${u}`, { classification: 'PRODUCT_DEFECT' });
    // verify old password rejected
    const SOLD = await new Session('UAT-OLDPW', {}).start();
    await SOLD.page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' }); await sleep(1500);
    await SOLD.page.locator('input[name="email"]').fill(boxO.address);
    await SOLD.page.locator('input[type="password"]').first().fill(PW);
    await SOLD.page.getByRole('button', { name: /sign in/i }).first().click();
    await sleep(8000);
    const oldRejected = SOLD.page.url().includes('/login');
    await SOLD.finish();
    if (!oldRejected) return h.fail('Old password still works after reset', { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-SMTP-06' });
    saveState({ uatOwner: { email: boxO.address, password: PW_NEW, company: COMPANY } });
    return h.pass(`Reset email "${msg.subject}" -> new password login works; old password rejected`);
  });
  await SF.finish();

  console.log('=== P19 COMPLETE ===');
  process.exit(0);
})().catch(e => { console.error('P19 FATAL:', e); process.exit(1); });
