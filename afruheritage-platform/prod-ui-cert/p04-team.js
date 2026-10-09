// Phase 4 — subscription activation, team invite + acceptance + restricted access, templates/plugins/storefront.
const { BASE, Session, loadState, saveState, clickFirst, uiLogin, uiLogout } = require('./harness');
const { waitForMessage, extractLinks } = require('./mailbox');
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const EVID = path.join(__dirname, '..', 'playwright-evidence');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OWNER = 'BUSINESS OWNER';
const EMP = 'INVITED NEW USER';
const PW_EMP = 'UatCertEmp!2026B';

async function fillBy(page, patterns, value) {
  const inputs = await page.locator('input:visible, textarea:visible').all();
  for (const el of inputs) {
    const hay = `${await el.getAttribute('name') || ''} ${await el.getAttribute('id') || ''} ${await el.getAttribute('placeholder') || ''}`.toLowerCase();
    if (patterns.some(p => hay.includes(p))) { try { await el.fill(value); return hay.slice(0, 60); } catch {} }
  }
  return null;
}

(async () => {
  const st = loadState();
  const A = st.tenantA;
  const boxI = st.mailboxes.invitee;
  const S = await new Session('TEAM', { video: true }).start();
  const page = S.page;

  // ---------- SUB-02 activate Free Trial ----------
  await S.jcase({ id: 'SUB-02', domain: 'BILLING', capability: 'Activate Free Trial plan via Select Plan', persona: OWNER, startUrl: BASE + '/billing', expected: 'Free Trial activates; status shows active/trialing', coreDep: 'YES' }, async (page, h) => {
    await uiLogin(page, A.email, A.password);
    h.step(`Logged in -> ${page.url()}`);
    await page.goto(BASE + '/billing', { waitUntil: 'domcontentloaded' }); await sleep(5000);
    await h.shot('before');
    // click the Free Trial card's Select Plan
    const cards = page.locator('div:has(> :text-is("Free Trial"))').first();
    let clicked = null;
    try {
      const btn = page.locator('div', { hasText: 'Free Trial' }).locator('button:has-text("Select Plan")').first();
      if (await btn.isVisible({ timeout: 3000 })) { await btn.click(); clicked = 'Free Trial > Select Plan'; }
    } catch {}
    if (!clicked) {
      // fallback: first Select Plan button near "Free Trial"/"GHS 0"
      const all = await page.locator('button:has-text("Select Plan")').all();
      if (all.length) { await all[0].click(); clicked = 'first Select Plan'; }
    }
    h.step(`Clicked: ${clicked || 'NONE'}`);
    await sleep(4000);
    // possible confirmation dialog — Free Trial modal shows "Start Free Trial"
    const subWait = page.waitForResponse(r => /afruheritage\.com\/api.*(subscription|billing|trial)/i.test(r.url()) && r.request().method() === 'POST', { timeout: 60000 }).catch(() => null);
    const t0 = Date.now();
    const conf = await clickFirst(page, ['button:has-text("Start Free Trial")', 'button:has-text("Confirm")', 'button:has-text("Activate")', 'button:has-text("Yes")', 'button:has-text("Subscribe")'], 2500);
    let subMs = null;
    if (conf) {
      h.step(`Confirmed: ${conf}`);
      const subResp = await subWait;
      subMs = Date.now() - t0;
      if (subResp) h.step(`Trial POST -> ${subResp.status()} in ${subMs}ms`);
      await sleep(4000);
    }
    const t = await S.text(); const u = page.url();
    await h.shot('after');
    const active = /(active|trialing|current plan.*(free|trial)|free trial.*active|renews|days remaining|expires)/i.test(t);
    const stillNone = /no active subscription/i.test(t);
    if (active && !stillNone) return h.pass(`Free Trial activated${subMs != null ? ` (activation POST ${subMs}ms)` : ''}. billing shows: "${t.slice(0, 300)}"`);
    if (stillNone) return h.fail(`Plan selection did not activate subscription. text="${t.slice(0, 300)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-SUB-02' });
    return h.fail(`Subscription state ambiguous after selection. url=${u} text="${t.slice(0, 300)}"`, { classification: 'UNCLASSIFIED', defectRef: 'DEF-SUB-03' });
  });

  // ---------- TEAM-01 send invitation ----------
  let inviteSent = false;
  let inviteSentAt = 0;
  await S.jcase({ id: 'TEAM-01', domain: 'TEAM/RBAC', capability: 'Owner invites team member by email', persona: OWNER, startUrl: BASE + '/members', expected: 'Invitation created; confirmation shown; invitee listed pending', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/members', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    let t = await S.text();
    await h.shot('members');
    h.step(`Opened /members`);
    const addBtn = await clickFirst(page, [
      'button:has-text("Invite")', 'button:has-text("Add Member")', 'button:has-text("Add User")', 'button:has-text("New Member")',
      'a:has-text("Invite")', 'a:has-text("Add Member")', 'button:has-text("+")',
    ], 3000);
    h.step(`Add/invite control: ${addBtn || 'none found'}`);
    await sleep(1500);
    if (addBtn) {
      await h.shot('invite-form');
      const dlg = page.locator('[role="dialog"]').last();
      const scope = (await dlg.count()) ? dlg : page;
      const emailInput = scope.locator('input[placeholder*="@"]:visible, input[type="email"]:visible').first();
      if (await emailInput.count()) await emailInput.fill(boxI.address);
      else await fillBy(scope, ['email', 'e-mail', '@'], boxI.address);
      const nameInput = scope.locator('input[placeholder*="Jane"]:visible, input[placeholder*="name" i]:visible').first();
      if (await nameInput.count()) await nameInput.fill('UAT Cert Ops Member');
      else await fillBy(scope, ['name', 'full'], 'UAT Cert Ops Member');
      // role select
      const sel = page.locator('select:visible').first();
      try {
        if (await sel.isVisible({ timeout: 1500 })) {
          const opts = await sel.locator('option').allTextContents();
          let pick = opts.findIndex(o => /customer|read.?only|restricted|viewer/i.test(o) && !/admin|full access/i.test(o));
          if (pick < 0) pick = opts.findIndex(o => !/admin|full access|choose|select/i.test(o));
          await sel.selectOption({ index: pick >= 0 ? pick : Math.min(1, opts.length - 1) });
          h.step(`Role: ${opts[pick >= 0 ? pick : 1]}`);
        }
      } catch {}
      const ev = await emailInput.count() ? await emailInput.inputValue().catch(() => '') : '';
      h.step(`Email field value: ${ev ? 'filled(' + (ev.includes('@') ? 'ok' : 'BAD:' + ev.slice(0, 30)) + ')' : 'EMPTY'}`);
      inviteSentAt = Date.now();
      const send = await clickFirst(page, [
        'button:has-text("Send Invitation")', 'button:has-text("Send Invite")', 'button:has-text("Invite")',
        'button:has-text("Send")', 'button:has-text("Add")', 'button:has-text("Create")', 'button[type="submit"]',
      ], 2500);
      h.step(`Submit: ${send || 'none'}`);
      await sleep(5000);
    }
    t = await S.text();
    await h.shot('after-invite');
    inviteSent = /invite sent to|will receive an email|added successfully|pending/i.test(t);
    if (inviteSent) return h.pass(`Invitation submitted; page indicates: "${t.slice(0, 350)}"`);
    return h.fail(`No invite confirmation. addBtn=${addBtn} text="${t.slice(0, 300)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-TEAM-01' });
  });

  // ---------- TEAM-02 invitation email received ----------
  await S.jcase({ id: 'TEAM-02', domain: 'TEAM/RBAC', capability: 'Invitation email received at invitee mailbox', persona: EMP, startUrl: 'external mailbox', expected: 'Invitation email with acceptance link arrives', coreDep: 'YES' }, async (page, h) => {
    if (!inviteSentAt) return h.blocked('TEAM-01 never submitted an invite — cannot verify delivery', { classification: 'UNCLASSIFIED' });
    const msg = await waitForMessage(boxI, { subjectRe: /invit|afruheritage|team|join|added|reset/i, timeoutMs: 240000, pollMs: 8000, sinceMs: inviteSentAt - 15000 });
    if (!msg) return h.fail('No invitation email within 4 minutes', { classification: 'INTEGRATION_DEFECT', defectRef: 'DEF-EMAIL-02' });
    const links = extractLinks(msg);
    saveState({ invite: { subject: msg.subject, links } });
    h.step(`Invitation email: "${msg.subject}", links=${links.length}`);
    if (!links.length) return h.fail(`Invitation email has no acceptance link: "${msg.subject}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-TEAM-02' });
    return h.pass(`Invitation email received: "${msg.subject}" with link ${links[0]}`, { notes: `links: ${links.join(' | ')}` });
  });

  await S.finish();

  // ---------- TEAM-03 invitee accepts (fresh incognito context) ----------
  const S2 = await new Session('TEAMACC', { video: true }).start();
  const p2 = S2.page;
  await S2.jcase({ id: 'TEAM-03', domain: 'TEAM/RBAC', capability: 'Invitee accepts invitation and reaches business workspace', persona: EMP, startUrl: 'invitation email link', expected: 'Accept link works; set password; lands inside UATCERT Meridian Freight', coreDep: 'YES' }, async (page, h) => {
    const inv = loadState().invite;
    if (!inv || !inv.links || !inv.links.length) return h.blocked('No invitation link captured from email');
    h.step(`Opening invitation link in fresh browser context`);
    await page.goto(inv.links[0], { waitUntil: 'domcontentloaded', timeout: 40000 }); await sleep(3500);
    let t = await S2.text(); let u = page.url();
    await h.shot('accept-page');
    h.step(`Accept page: ${u}`);
    // set password if asked
    const pwFields = await page.locator('input[type="password"]:visible').all();
    for (const f of pwFields) { try { await f.fill(PW_EMP); } catch {} }
    if (pwFields.length) h.step(`Set password in ${pwFields.length} field(s)`);
    await fillBy(page, ['name', 'full'], 'UAT Cert Ops Member');
    const acc = await clickFirst(page, [
      'button:has-text("Accept")', 'button:has-text("Join")', 'button:has-text("Set Password")',
      'button:has-text("Create Account")', 'button:has-text("Activate")', 'button[type="submit"]', 'button:has-text("Continue")',
    ], 3000);
    h.step(`Clicked ${acc || 'none'}`);
    // reset-confirm can be slow; wait for the page to leave the reset form
    // (success message -> router.push('/login') after ~1.2s)
    for (let i = 0; i < 12; i++) {
      await sleep(2000);
      const tt = await S2.text();
      if (/login|sign-in|dashboard|onboarding/.test(page.url())) break;
      if (/password set successfully|redirecting/i.test(tt)) { await sleep(2500); break; }
      if (/invalid|expired|failed/i.test(tt)) break;
    }
    // may need explicit login after acceptance
    if (/login|sign-in/.test(page.url())) {
      h.step('Redirected to login — signing in as invitee');
      await page.locator('input[name="email"]').fill(boxI.address);
      await page.locator('input[type="password"]').first().fill(PW_EMP);
      await page.getByRole('button', { name: /sign in/i }).first().click();
      for (let i = 0; i < 12; i++) { await sleep(1500); if (!page.url().includes('/login')) break; }
      await sleep(2500);
    }
    t = await S2.text(); u = page.url();
    await h.shot('after-accept');
    const inTenant = (/dashboard|welcome back|track shipment/i.test(t) || /meridian|uatcert/i.test(t)) && !/login|sign in|onboarding/i.test(u);
    if (inTenant) return h.pass(`Invitee accepted and is inside tenant workspace: ${u}`, { notes: t.slice(0, 300) });
    if (!/login/.test(u)) return h.fail(`Acceptance proceeded but tenant context unclear. url=${u} text="${t.slice(0, 300)}"`, { classification: 'UNCLASSIFIED', defectRef: 'DEF-TEAM-03' });
    return h.fail(`Acceptance failed — ended at login. url=${u} text="${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-TEAM-04' });
  });

  // ---------- TEAM-04 restricted access as invitee ----------
  await S2.jcase({ id: 'TEAM-04', domain: 'TEAM/RBAC', capability: 'Invited (non-admin) user denied admin capabilities', persona: EMP, startUrl: 'invitee session', expected: 'Restricted member cannot change billing/settings/team', coreDep: 'YES' }, async (page, h) => {
    const results = [];
    for (const [slug, name] of [['/billing', 'Billing'], ['/settings', 'Settings'], ['/members', 'Team admin']]) {
      await page.goto(BASE + slug, { waitUntil: 'domcontentloaded' }); await sleep(3500);
      const t = await S2.text(); const u = page.url();
      const denied = /forbidden|denied|not authorized|permission|access denied|404|not found/i.test(t) || /login/.test(u);
      const canMutate = /(select plan|add funds|invite|add member|save changes|cancel subscription|danger zone)/i.test(t);
      results.push(`${name}: denied=${denied} canMutate=${canMutate} url=${u}`);
      console.log(`    rbac ${slug}: denied=${denied} canMutate=${canMutate}`);
      if (slug === '/billing') await h.shot('billing-as-invitee');
    }
    const anyDenied = results.some(r => /denied=true/.test(r));
    const anyMutate = results.some(r => /canMutate=true/.test(r));
    if (anyDenied && !anyMutate) return h.pass(`Restricted access enforced. ${results.join(' | ')}`);
    if (anyMutate) return h.fail(`Invitee can reach admin controls. ${results.join(' | ')}`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-RBAC-01' });
    return h.fail(`Restricted enforcement unclear. ${results.join(' | ')}`, { classification: 'UNCLASSIFIED', defectRef: 'DEF-RBAC-02' });
  });

  await S2.finish();

  // ---------- TEAM-05 owner sees member ----------
  const S3 = await new Session('TEAMLIST').start();
  await S3.jcase({ id: 'TEAM-05', domain: 'TEAM/RBAC', capability: 'Owner sees invited member in team list', persona: OWNER, startUrl: BASE + '/members', expected: 'Member appears in list with role/status', coreDep: 'NO' }, async (page, h) => {
    await uiLogin(page, A.email, A.password);
    await page.goto(BASE + '/members', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    const t = await S3.text();
    await h.shot('members-list');
    if (/ops member|uati-|pending|accepted|active|invited/i.test(t)) return h.pass(`Member visible in team list`, { notes: t.slice(0, 400) });
    return h.fail(`Invited member not visible in /members. text="${t.slice(0, 300)}"`, { classification: 'UI_DEFECT', defectRef: 'DEF-TEAM-05' });
  });
  await S3.finish();
  console.log('\nPhase 4 complete');
})().catch(async e => { console.error('FATAL', e); process.exit(1); });
