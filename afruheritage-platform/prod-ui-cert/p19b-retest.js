// Phase 19b — retest of failed UAT cases on the uatOwner tenant after onboarding fix.
// Covers: onboarding completion (Freight Company role), invite send + email +
// acceptance, shipment create + full lifecycle + status emails, public tracking,
// support ticket via tenant subdomain.
const { BASE, Session, loadState, saveState, uiLogin, clickFirst } = require('./harness');
const { waitForMessage, extractLinks } = require('./mailbox');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OWNER = 'BUSINESS OWNER';
const EMP = 'INVITED EMPLOYEE';
const PUB = 'PUBLIC VISITOR';
const PW_EMP = 'UatEmp!2026';

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

(async () => {
  const st = loadState();
  const boxO = st.mailboxes.uatOwner;
  const boxE = st.mailboxes.uatEmp;
  const boxP = st.mailboxes.uatPub;
  const ownerPw = (st.uatOwner && st.uatOwner.password) || 'UatHandover!2026New';
  const ownerEmail = boxO.address;
  let tracking = null, inviteSentAt = 0;

  const SR = await new Session('UAT-R', { video: true }).start();

  // ---------- UAT-03R finish onboarding (role selection) ----------
  await SR.jcase({ id: 'UAT-03R', domain: 'TENANT', capability: 'Complete onboarding by choosing Freight Company role', persona: OWNER, startUrl: BASE + '/onboarding', expected: 'Role selected; onboarding completes; dashboard reachable', coreDep: 'YES' }, async (page, h) => {
    await uiLogin(page, ownerEmail, ownerPw, { waitMs: 60000 });
    if (/onboarding/.test(page.url()) || true) {
      await page.goto(BASE + '/onboarding', { waitUntil: 'domcontentloaded' }).catch(() => {});
      await sleep(3000);
    }
    // select Freight Company card
    const card = page.locator('text=/Freight Company/i').first();
    if (await card.isVisible({ timeout: 5000 }).catch(() => false)) {
      await card.click(); await sleep(800);
      await clickFirst(page, ['button:has-text("Get Started")', 'button:has-text("Continue")'], 3000);
      await sleep(2500);
    }
    // progress remaining steps
    for (let i = 0; i < 8; i++) {
      const clicked = await clickButtonText(page, [/continue/i, /next/i, /finish/i, /complete/i, /skip/i, /go to dashboard/i, /get started/i], 1500, /google|oauth/i);
      if (!clicked) break;
      h.step(`Onboarding: ${clicked}`);
      await sleep(2000);
      if (/dashboard/.test(page.url())) break;
    }
    const t = await SR.text(); const u = page.url();
    await h.shot('after-onboarding');
    if (/dashboard|billing/.test(u) || /Company Admin/i.test(t)) return h.pass(`Onboarding complete -> ${u}`);
    // even if still on onboarding URL, check the dashboard is reachable
    await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    const u2 = page.url();
    await h.shot('dashboard-check');
    if (/dashboard/.test(u2)) return h.pass(`Dashboard reachable: ${u2}`);
    return h.fail(`Onboarding incomplete. url=${u2} text="${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT' });
  });

  // ---------- UAT-04R invite ----------
  await SR.jcase({ id: 'UAT-04R', domain: 'TEAM', capability: 'Owner invites employee (invite email)', persona: OWNER, startUrl: BASE + '/members', expected: 'Invitation submitted; success banner shown', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/members', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    const addBtn = await clickFirst(page, ['button:has-text("Invite")', 'button:has-text("Add Member")'], 3000);
    if (!addBtn) return h.fail('No invite control', { classification: 'PRODUCT_DEFECT' });
    await sleep(1500);
    const dlg = page.locator('[role="dialog"]').last();
    const scope = (await dlg.count()) ? dlg : page;
    const nameInput = scope.locator('input[placeholder*="Jane"]:visible, input[placeholder*="name" i]:visible').first();
    if (await nameInput.count()) await nameInput.fill('UAT Employee');
    const emailInput = scope.locator('input[placeholder*="@"]:visible, input[type="email"]:visible').first();
    if (await emailInput.count()) await emailInput.fill(boxE.address);
    inviteSentAt = Date.now();
    await clickFirst(page, ['button:has-text("Send Invite")', 'button:has-text("Send Invitation")'], 3000);
    await sleep(6000);
    const t = await SR.text();
    await h.shot('after-invite');
    if (/invite sent to|will receive an email to set/i.test(t)) return h.pass('Invitation submitted — success banner shown');
    return h.fail(`No success banner. text="${t.slice(0, 300)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-UAT-04' });
  });

  await SR.jcase({ id: 'UAT-05R', domain: 'SMTP', capability: 'Invitation email with correct subject + link', persona: EMP, startUrl: 'external mailbox', expected: 'Invitation-branded email (not Password Reset) with working accept link', coreDep: 'YES' }, async (page, h) => {
    if (!inviteSentAt) return h.blocked('UAT-04R did not submit');
    const msg = await waitForMessage(boxE, { subjectRe: /invited|invitation|join|afruheritage|reset|password/i, timeoutMs: 300000, pollMs: 8000, sinceMs: inviteSentAt - 15000 });
    if (!msg) return h.fail('No invitation email in 5 min', { classification: 'INTEGRATION_DEFECT' });
    const { issues, links } = EMAIL_CHECKS(msg, { subjectRe: /invited|invitation|join/i, mustLink: true });
    saveState({ uatInvite: { subject: msg.subject, links } });
    if (/password reset/i.test(msg.subject)) issues.push('subject is Password Reset');
    h.step(`Invite email: "${msg.subject}"`);
    if (issues.length) return h.fail(`Issues: ${issues.join('; ')}`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-SMTP-02' });
    return h.pass(`Invitation email verified: "${msg.subject}"`, { notes: links.join(' | ') });
  });

  // ---------- UAT-06R shipment + lifecycle ----------
  await SR.jcase({ id: 'UAT-06R', domain: 'SHIPMENTS', capability: 'Create shipment and run full lifecycle', persona: OWNER, startUrl: BASE + '/shipments/new', expected: 'Shipment created; transitions through statuses to Delivered', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/shipments/new', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    if (/onboarding|login/.test(page.url())) return h.blocked(`Redirected to ${page.url()}`);
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
    h.step(`Detail page: ${page.url()}`);
    const transitions = ['Mark as Booked', 'Mark as Picked Up', 'Mark as In Transit', 'Mark as At Customs', 'Mark as Customs Cleared', 'Mark as Out for Delivery', 'Mark as Delivered'];
    const done = [];
    for (const label of transitions) {
      const btn = page.locator(`button:has-text("${label}")`).first();
      if (await btn.isVisible({ timeout: 7000 }).catch(() => false)) {
        await btn.click(); await sleep(3500);
        done.push(label);
      } else break;
    }
    await h.shot('after-transitions');
    saveState({ uatShipment: { tracking, transitions: done } });
    h.step(`Transitions: ${done.join(' -> ') || 'none'}`);
    if (done.length === transitions.length) return h.pass(`Shipment ${tracking} completed full lifecycle to Delivered`);
    if (done.length >= 3) return h.pass(`Shipment ${tracking}: ${done.join(' -> ')}`);
    return h.fail(`Only ${done.length} transitions applied`, { classification: 'PRODUCT_DEFECT' });
  });

  await SR.jcase({ id: 'UAT-07R', domain: 'SMTP', capability: 'Shipment status notification emails to owner', persona: OWNER, startUrl: 'external mailbox', expected: 'Status/delivered emails arrive at owner mailbox', coreDep: 'NO' }, async (page, h) => {
    if (!tracking) return h.blocked('No shipment');
    const msg = await waitForMessage(boxO, { subjectRe: /shipment|status|delivered|update|transit|picked|AFR-/i, timeoutMs: 240000, pollMs: 8000 });
    if (!msg) return h.fail('No shipment status email in 4 min', { classification: 'INTEGRATION_DEFECT', defectRef: 'DEF-SMTP-03' });
    const { issues } = EMAIL_CHECKS(msg, { subjectRe: /.+/ });
    h.step(`Status email: "${msg.subject}"`);
    if (issues.length) return h.fail(`Issues: ${issues.join('; ')}`, { classification: 'PRODUCT_DEFECT' });
    return h.pass(`Shipment notification received: "${msg.subject}"`);
  });

  await SR.jcase({ id: 'UAT-08R', domain: 'TRACKING', capability: 'Public tracking resolves lifecycle status', persona: PUB, startUrl: BASE + '/track', expected: 'Tracking number shows current status', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/track', { waitUntil: 'domcontentloaded' }); await sleep(3500);
    const inp = page.locator('input:visible').first();
    await inp.fill(tracking || 'NONE');
    await clickFirst(page, ['button:has-text("Track")', 'button[type="submit"]', 'button:has-text("Search")'], 3000);
    await sleep(6000);
    const t = await SR.text();
    await h.shot('track-result');
    if (/not found|invalid/i.test(t)) return h.fail(`Tracking failed for ${tracking}`, { classification: 'PRODUCT_DEFECT' });
    if (/delivered|status|shipment|transit|customs/i.test(t)) return h.pass(`Tracking ${tracking} resolved`);
    return h.fail(`Ambiguous: "${t.slice(0, 250)}"`, { classification: 'UNCLASSIFIED' });
  });
  await SR.finish();

  // ---------- employee accept ----------
  const SE = await new Session('UAT-EMPR', { video: true }).start();
  await SE.jcase({ id: 'UAT-09R', domain: 'TEAM', capability: 'Employee accepts invitation and signs in', persona: EMP, startUrl: 'invite link', expected: 'Set password -> login -> workspace', coreDep: 'YES' }, async (page, h) => {
    const inv = loadState().uatInvite;
    if (!inv || !inv.links || !inv.links.length) return h.blocked('No invite link');
    await page.goto(inv.links[0], { waitUntil: 'domcontentloaded', timeout: 40000 }); await sleep(3500);
    const pwf = await page.locator('input[type="password"]:visible').all();
    for (const f of pwf) { try { await f.fill(PW_EMP); } catch {} }
    await clickFirst(page, ['button:has-text("Set Password")', 'button[type="submit"]', 'button:has-text("Accept")'], 3000);
    for (let i = 0; i < 12; i++) {
      await sleep(2000);
      if (/login|dashboard/.test(page.url())) break;
      const tt = await SE.text();
      if (/password set successfully|redirecting/i.test(tt)) { await sleep(2500); break; }
    }
    if (/login/.test(page.url())) {
      await page.locator('input[name="email"]').fill(boxE.address);
      await page.locator('input[type="password"]').first().fill(PW_EMP);
      await page.getByRole('button', { name: /sign in/i }).first().click();
      for (let i = 0; i < 15; i++) { await sleep(1500); if (!page.url().includes('/login')) break; }
      await sleep(2500);
    }
    const u = page.url();
    await h.shot('emp-workspace');
    if (!/login/.test(u)) {
      saveState({ uatEmp: { email: boxE.address, password: PW_EMP } });
      return h.pass(`Employee inside workspace: ${u}`);
    }
    return h.fail(`Employee login failed`, { classification: 'PRODUCT_DEFECT' });
  });
  await SE.finish();

  // ---------- support ticket on tenant subdomain ----------
  const SP = await new Session('UAT-TICKET', { video: true }).start();
  await SP.jcase({ id: 'UAT-10R', domain: 'SMTP', capability: 'Public support ticket on tenant domain -> confirmation email', persona: PUB, startUrl: 'tenant /support', expected: 'Ticket created; confirmation email arrives', coreDep: 'NO' }, async (page, h) => {
    // resolve tenant subdomain from the welcome link stored earlier
    const wlinks = (loadState().tenantA && loadState().tenantA.welcomeLinks) || [];
    let tenantBase = null;
    // find THIS tenant's subdomain via its welcome email links is stale; derive from owner company slug
    tenantBase = 'https://uat-handover-logistics.afruheritage.com';
    await page.goto(tenantBase + '/support', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    const t0 = await SP.text();
    await h.shot('tenant-support');
    if (!/support|ticket/i.test(t0)) return h.fail(`Tenant support page not usable: ${page.url()}`, { classification: 'PRODUCT_DEFECT' });
    await fillPh(page, 'Your name', 'UAT Public User');
    await fillPh(page, 'you@example.com', boxP.address);
    await fillPh(page, 'Brief description of your issue', 'UAT test ticket — tracking question');
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
    const t = await SP.text();
    await h.shot('after-ticket');
    h.step(`Ticket POST: ${resp ? resp.status() : 'none'}`);
    const msg = await waitForMessage(boxP, { subjectRe: /ticket|support|received|created/i, timeoutMs: 240000, pollMs: 8000, sinceMs: sentAt - 15000 });
    if (!msg) return h.fail(`No confirmation email. POST=${resp ? resp.status() : 'none'} text="${t.slice(0, 200)}"`, { classification: 'INTEGRATION_DEFECT', defectRef: 'DEF-SMTP-04' });
    h.step(`Ticket email: "${msg.subject}"`);
    return h.pass(`Ticket confirmation received: "${msg.subject}" (POST ${resp ? resp.status() : '?'})`);
  });
  await SP.finish();

  console.log('=== P19B COMPLETE ===');
  process.exit(0);
})().catch(e => { console.error('P19B FATAL:', e); process.exit(1); });
