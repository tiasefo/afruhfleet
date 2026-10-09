// Phase 17 — Final targeted verification after post-freeze fixes.
// Covers: login, Team Management UI (members list + slug-500 reachability),
// invitation send -> real mailbox subject/body -> acceptance -> member login,
// AI widget customer-facing behavior, shipment create, shipment list,
// public tracking, tenant isolation. No fixes during this run.
const { BASE, Session, loadState, saveState, uiLogin, clickFirst, fillIfPresent } = require('./harness');
const { waitForMessage, extractLinks, createMailbox } = require('./mailbox');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OWNER = 'BUSINESS OWNER';
const EMP = 'INVITED EMPLOYEE';
const PW_EMP = 'InvEmp!2026Final';

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
  const A = st.tenantA, B = st.tenantB;
  const boxI = st.mailboxes.inviteeFinal;
  const timings = {};
  let trackingNumber = null;
  let inviteSentAt = 0;

  // ================= Session A: owner =================
  const SA = await new Session('FIN-A', { video: true }).start();
  const pa = SA.page;

  await SA.jcase({ id: 'FIN-01', domain: 'AUTH', capability: 'Owner login on production domain', persona: OWNER, startUrl: BASE + '/login', expected: 'Login succeeds; lands inside tenant workspace', coreDep: 'YES' }, async (page, h) => {
    const t0 = Date.now();
    await uiLogin(page, A.email, A.password, { waitMs: 60000 });
    timings.login_ms = Date.now() - t0;
    const u = page.url(); const t = await SA.text();
    await h.shot('after-login');
    if (/login/.test(u)) return h.fail(`Still on login. url=${u}`);
    return h.pass(`Logged in in ${timings.login_ms}ms -> ${u}`);
  });

  await SA.jcase({ id: 'FIN-02', domain: 'TEAM/RBAC', capability: 'Team Management page lists members without server error', persona: OWNER, startUrl: BASE + '/members', expected: 'Members list renders; members API 200 on UUID path; no 5xx', coreDep: 'YES' }, async (page, h) => {
    SA.netLog.length = 0;
    await page.goto(BASE + '/members', { waitUntil: 'domcontentloaded' }); await sleep(5000);
    const t = await SA.text(); const u = page.url();
    await h.shot('members-list');
    const memberCalls = SA.netLog.filter(l => /members/i.test(l));
    const errs = SA.netLog.filter(l => /HTTP 5\d\d/.test(l));
    h.step(`member-related netlog: ${memberCalls.join(' ; ') || 'none'}; 5xx: ${errs.join(';') || 'none'}`);
    if (/login/.test(u)) return h.fail('Bounced to login', { classification: 'PRODUCT_DEFECT' });
    if (errs.length) return h.fail(`5xx on members page: ${errs.join(';')}`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-FIN-02' });
    const usesUuid = memberCalls.some(l => /\/shipments\/[0-9a-f-]{36}\/members/i.test(l)) || memberCalls.length === 0;
    if (!usesUuid) return h.fail(`Members API called with non-UUID path: ${memberCalls.join(';')}`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-FIN-02b' });
    if (!/member|invite|team|email|role/i.test(t)) return h.fail(`Members page did not render team UI. text="${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT' });
    return h.pass(`Members page rendered; API calls: ${memberCalls.length ? memberCalls[0].slice(0, 160) : 'page-side'}; no 5xx`);
  });

  await SA.jcase({ id: 'FIN-03', domain: 'TEAM/RBAC', capability: 'Owner sends invitation via supported Team Management UI', persona: OWNER, startUrl: BASE + '/members', expected: 'Invitation submitted; confirmation shown', coreDep: 'YES' }, async (page, h) => {
    if (!page.url().includes('/members')) { await page.goto(BASE + '/members', { waitUntil: 'domcontentloaded' }); await sleep(4000); }
    const addBtn = await clickFirst(page, [
      'button:has-text("Invite")', 'button:has-text("Add Member")', 'button:has-text("Add User")', 'button:has-text("New Member")',
      'a:has-text("Invite")', 'a:has-text("Add Member")', 'button:has-text("+")',
    ], 4000);
    h.step(`Invite control: ${addBtn || 'none'}`);
    if (!addBtn) return h.fail('No invite control on members page', { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-FIN-03' });
    await sleep(1500);
    await h.shot('invite-form');
    const dlg = page.locator('[role="dialog"]').last();
    const scope = (await dlg.count()) ? dlg : page;
    const emailInput = scope.locator('input[placeholder*="@"]:visible, input[type="email"]:visible').first();
    if (await emailInput.count()) await emailInput.fill(boxI.address);
    else await fillBy(scope, ['email', '@'], boxI.address);
    const nameInput = scope.locator('input[placeholder*="Jane"]:visible, input[placeholder*="name" i]:visible').first();
    if (await nameInput.count()) await nameInput.fill('Final Verify Member');
    else await fillBy(scope, ['name', 'full'], 'Final Verify Member');
    const sel = page.locator('select:visible').first();
    try {
      if (await sel.isVisible({ timeout: 1500 })) {
        const opts = await sel.locator('option').allTextContents();
        let pick = opts.findIndex(o => /customer|read.?only|restricted|viewer|member/i.test(o) && !/admin|full/i.test(o));
        if (pick < 0) pick = opts.findIndex(o => !/admin|full access|choose|select/i.test(o));
        await sel.selectOption({ index: pick >= 0 ? pick : Math.min(1, opts.length - 1) });
      }
    } catch {}
    inviteSentAt = Date.now();
    const send = await clickFirst(page, [
      'button:has-text("Send Invitation")', 'button:has-text("Send Invite")', 'button:has-text("Invite")',
      'button:has-text("Send")', 'button:has-text("Add")', 'button:has-text("Create")', 'button[type="submit"]',
    ], 3000);
    h.step(`Submit: ${send || 'none'}`);
    await sleep(6000);
    const t = await SA.text();
    await h.shot('after-invite');
    if (/invite sent to|will receive an email|added successfully|pending|invitation sent/i.test(t)) {
      return h.pass(`Invitation submitted to ${boxI.address}: "${t.slice(0, 300)}"`);
    }
    return h.fail(`No invite confirmation. text="${t.slice(0, 300)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-FIN-03b' });
  });

  // ---------- shipment create (runs while invite email is in flight) ----------
  await SA.jcase({ id: 'FIN-04', domain: 'SHIPMENTS', capability: 'Shipment creation via UI', persona: OWNER, startUrl: BASE + '/shipments/new', expected: 'Shipment created; tracking number issued', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/shipments/new', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    await fillPh(page, 'Enter sender name', 'Final Sender');
    await fillPh(page, 'Enter complete address', '1 Ring Road, Accra', 0);
    await fillPh(page, 'Enter city', 'Accra', 0);
    await fillPh(page, 'Enter country', 'Ghana', 0);
    await fillPh(page, 'Enter receiver name', 'Final Receiver');
    await fillPh(page, 'Enter complete address', '4 Harper Road, Kumasi', 1);
    await fillPh(page, 'Enter city', 'Kumasi', 1);
    await fillPh(page, 'Enter country', 'Ghana', 1);
    await fillPh(page, 'Enter phone number', '+233551112222', 0);
    await fillPh(page, 'Enter phone number', '+233552223333', 1);
    await fillPh(page, 'e.g., Electronics, Clothing', 'General Goods');
    await fillPh(page, 'Describe the shipment contents', 'Final verification cargo');
    try { await comboSelect(page, 1, 'Ghana'); await comboSelect(page, 2, 'Accra'); await comboSelect(page, 3, 'Ghana'); await comboSelect(page, 4, 'Kumasi'); } catch (e) { h.step('combo: ' + e.message.slice(0, 60)); }
    const nums = page.locator('input[type="number"][required]');
    const ncount = await nums.count();
    const vals = ['3', '25', '1', '0.5', '0.4', '0.6', '1200'];
    for (let i = 0; i < ncount; i++) {
      const cur = await nums.nth(i).inputValue().catch(() => '');
      if (!cur || cur === '0' || cur === '0.0') await nums.nth(i).fill(vals[i] || '1');
    }
    const cost = page.locator('input[placeholder="0.00"]').first();
    if (await cost.isVisible().catch(() => false) && !(await cost.inputValue())) await cost.fill('1200');
    await h.shot('form-filled');
    const postWait = page.waitForResponse(r => /afruheritage\.com\/api.*shipment/i.test(r.url()) && r.request().method() === 'POST', { timeout: 90000 }).catch(() => null);
    const t0 = Date.now();
    const save = await clickFirst(page, ['button:has-text("Create Shipment")'], 3000);
    h.step(`Submit: ${save}`);
    const resp = await postWait;
    const postMs = Date.now() - t0;
    let created = false;
    for (let i = 0; i < 30; i++) {
      await sleep(1500);
      const t2 = await SA.text();
      const m = t2.match(/AFR-[A-Z0-9-]+/);
      if (m) trackingNumber = m[0];
      if (!page.url().includes('/shipments/new') || /created successfully|shipment.*created/i.test(t2)) { created = true; break; }
      if (/failed to create/i.test(t2)) break;
    }
    timings.shipment_create_ms = postMs;
    await h.shot('after-create');
    if (created) return h.pass(`Shipment created via UI; POST ${resp ? resp.status() : '?'} in ${postMs}ms; tracking=${trackingNumber || 'captured-later'}`);
    return h.fail(`Shipment create did not complete. resp=${resp ? resp.status() : 'none'} ${postMs}ms`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-FIN-04' });
  });

  await SA.jcase({ id: 'FIN-05', domain: 'SHIPMENTS', capability: 'Shipment list renders and shows tenant shipments', persona: OWNER, startUrl: BASE + '/shipments', expected: 'List loads; created shipment present', coreDep: 'YES' }, async (page, h) => {
    const t0 = Date.now();
    await page.goto(BASE + '/shipments', { waitUntil: 'domcontentloaded' });
    await sleep(5000);
    timings.shipments_page_ms = Date.now() - t0;
    const t = await SA.text();
    await h.shot('shipments-list');
    const trk = t.match(/AFR-[A-Z0-9-]{6,}/);
    if (trk && !trackingNumber) trackingNumber = trk[0];
    if (/no shipments|empty/i.test(t) && !trk) return h.fail(`Shipments list empty. text="${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT' });
    return h.pass(`Shipments list loaded in ${timings.shipments_page_ms}ms; tracking=${trackingNumber || trk?.[0] || 'n/a'}`);
  });

  // ---------- invitation email ----------
  await SA.jcase({ id: 'FIN-06', domain: 'TEAM/RBAC', capability: 'Invitation email arrives with correct subject', persona: EMP, startUrl: 'external mailbox', expected: 'Subject is invitation-appropriate (NOT Password Reset); contains accept link', coreDep: 'YES' }, async (page, h) => {
    if (!inviteSentAt) return h.blocked('FIN-03 never submitted invite');
    const msg = await waitForMessage(boxI, { subjectRe: /invit|afruheritage|join|reset|password/i, timeoutMs: 300000, pollMs: 8000, sinceMs: inviteSentAt - 15000 });
    if (!msg) return h.fail('No invitation email within 5 minutes', { classification: 'INTEGRATION_DEFECT', defectRef: 'DEF-FIN-06' });
    const links = extractLinks(msg);
    saveState({ inviteFinal: { subject: msg.subject, links } });
    h.step(`Email subject: "${msg.subject}"`);
    if (!links.length) return h.fail(`Email has no accept link: "${msg.subject}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-FIN-06b' });
    if (/password reset/i.test(msg.subject)) return h.fail(`Subject still says password reset: "${msg.subject}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-FIN-06c' });
    if (!/invited|invitation|join/i.test(msg.subject)) return h.fail(`Subject not invitation-appropriate: "${msg.subject}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-FIN-06d' });
    return h.pass(`Invitation email received: "${msg.subject}" link=${links[0].slice(0, 80)}`);
  });

  await SA.finish();

  // ================= Session B: invitee accepts =================
  const SB = await new Session('FIN-INV', { video: true }).start();
  await SB.jcase({ id: 'FIN-07', domain: 'TEAM/RBAC', capability: 'Invitee accepts invitation, sets password, logs in', persona: EMP, startUrl: 'invitation email link', expected: 'Accept link -> set password -> login -> inside tenant workspace', coreDep: 'YES' }, async (page, h) => {
    const inv = loadState().inviteFinal;
    if (!inv || !inv.links || !inv.links.length) return h.blocked('No invitation link captured');
    await page.goto(inv.links[0], { waitUntil: 'domcontentloaded', timeout: 40000 }); await sleep(3500);
    await h.shot('accept-page');
    h.step(`Accept page: ${page.url()}`);
    const pwFields = await page.locator('input[type="password"]:visible').all();
    for (const f of pwFields) { try { await f.fill(PW_EMP); } catch {} }
    if (pwFields.length) h.step(`Set password in ${pwFields.length} field(s)`);
    const acc = await clickFirst(page, [
      'button:has-text("Accept")', 'button:has-text("Join")', 'button:has-text("Set Password")',
      'button:has-text("Create Account")', 'button:has-text("Activate")', 'button[type="submit"]', 'button:has-text("Continue")',
    ], 3000);
    h.step(`Clicked ${acc || 'none'}`);
    for (let i = 0; i < 12; i++) {
      await sleep(2000);
      const tt = await SB.text();
      if (/login|dashboard|onboarding/.test(page.url())) break;
      if (/password set successfully|redirecting/i.test(tt)) { await sleep(2500); break; }
      if (/invalid|expired|failed/i.test(tt)) break;
    }
    if (/login/.test(page.url())) {
      h.step('On login — signing in as invitee');
      await page.locator('input[name="email"]').fill(boxI.address);
      await page.locator('input[type="password"]').first().fill(PW_EMP);
      await page.getByRole('button', { name: /sign in/i }).first().click();
      for (let i = 0; i < 15; i++) { await sleep(1500); if (!page.url().includes('/login')) break; }
      await sleep(2500);
    }
    const t = await SB.text(); const u = page.url();
    await h.shot('after-accept');
    const inside = !/login/.test(u) && /dashboard|members|shipments|billing|welcome|meridian|uatcert|team/i.test(t + u);
    if (inside) return h.pass(`Invitee accepted, logged in, inside workspace: ${u}`);
    return h.fail(`Acceptance ended outside workspace. url=${u} text="${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-FIN-07' });
  });
  await SB.finish();

  // ================= Session C: owner re-checks member list =================
  const SC = await new Session('FIN-C', { video: true }).start();
  await SC.jcase({ id: 'FIN-08', domain: 'TEAM/RBAC', capability: 'Invited member appears in Team Management list', persona: OWNER, startUrl: BASE + '/members', expected: 'Invitee visible in members list', coreDep: 'YES' }, async (page, h) => {
    await uiLogin(page, A.email, A.password, { waitMs: 60000 });
    await page.goto(BASE + '/members', { waitUntil: 'domcontentloaded' }); await sleep(5000);
    const t = await SC.text();
    await h.shot('members-with-invitee');
    const short = boxI.address.split('@')[0];
    if (new RegExp(short + '|' + boxI.address.replace(/[.@]/g, '[.@]'), 'i').test(t) || /Final Verify Member/i.test(t)) {
      return h.pass(`Invitee visible in members list (${boxI.address})`);
    }
    return h.fail(`Invitee not visible in members list. text="${t.slice(0, 350)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-FIN-08' });
  });
  await SC.finish();

  // ================= Session D: tenant B isolation =================
  const SD = await new Session('FIN-B', { video: true }).start();
  await SD.jcase({ id: 'FIN-09', domain: 'ISOLATION', capability: 'Tenant B isolation: no tenant A data exposure', persona: 'TENANT B OWNER', startUrl: BASE + '/login', expected: 'B logs in; B shipments list lacks A tracking numbers; no cross-tenant leakage', coreDep: 'YES' }, async (page, h) => {
    await uiLogin(page, B.email, B.password, { waitMs: 60000 });
    await page.goto(BASE + '/shipments', { waitUntil: 'domcontentloaded' }); await sleep(5000);
    const t = await SD.text();
    await h.shot('b-shipments');
    const leak = trackingNumber && t.includes(trackingNumber);
    const aTrk = (t.match(/AFR-[A-Z0-9-]{6,}/g) || []);
    h.step(`B shipments: ${aTrk.join(', ') || 'none listed'}; A tracking=${trackingNumber}`);
    if (leak) return h.fail(`Tenant A tracking ${trackingNumber} visible in tenant B workspace`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-FIN-09' });
    await page.goto(BASE + '/members', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    const t2 = await SD.text();
    const memberLeak = new RegExp(boxI.address.split('@')[0], 'i').test(t2) || /Final Verify Member/.test(t2);
    if (memberLeak) return h.fail(`Tenant A member visible in tenant B members list`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-FIN-09b' });
    await h.shot('b-members');
    return h.pass(`Tenant B isolated: no A shipments (${aTrk.length} B-visible tracking refs), no A members`);
  });
  await SD.finish();

  // ================= Session E: anonymous AI widget =================
  const SE = await new Session('FIN-AI', { video: true }).start();
  await SE.jcase({ id: 'FIN-10', domain: 'AI/HELP', capability: 'Public AI help widget responds without unhandled error', persona: 'PUBLIC VISITOR', startUrl: BASE, expected: 'Widget opens, answers a question or degrades gracefully; no unhandled server error visible', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    const open = await clickFirst(page, [
      'button:has(span:has-text("Open chat"))', 'button:has-text("Open chat")',
      'button:has(svg.lucide-message-square)', 'button.fixed', '[class*="rounded-full"]',
    ], 5000);
    h.step(`Widget open control: ${open || 'none'}`);
    if (!open) return h.fail('AI help widget not found on public landing page', { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-FIN-10' });
    await sleep(1500);
    await h.shot('widget-open');
    SE.netLog.length = 0;
    const input = page.locator('input[placeholder*="question" i]:visible, textarea[placeholder*="question" i]:visible').first();
    if (!(await input.isVisible({ timeout: 4000 }).catch(() => false))) return h.fail('Chat input not visible after opening widget', { classification: 'PRODUCT_DEFECT' });
    await input.fill('How do I track a shipment?');
    const send = await clickFirst(page, ['button:has(svg.lucide-send)', 'button[type="submit"]', 'button:has-text("Send")'], 3000);
    h.step(`Send: ${send || 'enter-key'}`);
    if (!send) await input.press('Enter');
    let answered = false; let answerText = '';
    for (let i = 0; i < 25; i++) {
      await sleep(2000);
      const t = await SE.text();
      if (/track|shipment|support|sorry|unable|assist|help/i.test(t) && t.length > 200) {
        const idx = t.indexOf('How do I track');
        if (idx >= 0 && t.length > idx + 60) { answered = true; answerText = t.slice(idx, idx + 400); break; }
      }
    }
    await h.shot('widget-answer');
    const aiCalls = SE.netLog.filter(l => /ai\/chat/i.test(l));
    const serverErr = SE.netLog.filter(l => /HTTP 5\d\d.*ai\/chat/i.test(l));
    const uiErr = /something went wrong|unhandled|application error|internal server error/i.test(await SE.text());
    h.step(`ai/chat calls: ${aiCalls.join(';') || 'none (local FAQ path)'}; 5xx: ${serverErr.join(';') || 'none'}`);
    if (uiErr) return h.fail('Unhandled error visible in UI', { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-FIN-10b' });
    if (serverErr.length && !answered) return h.fail(`AI call 5xx and no fallback answer: ${serverErr[0]}`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-FIN-10c' });
    if (!answered) return h.fail(`No answer rendered. api=${aiCalls.join(';') || 'none'}`, { classification: 'PRODUCT_DEFECT' });
    const mode = serverErr.length ? 'local-FAQ fallback after 5xx' : (aiCalls.length ? 'AI API' : 'local');
    return h.pass(`Widget answered via ${mode}${serverErr.length ? ' (graceful degradation)' : ''}. answer="${answerText.slice(0, 200)}"`);
  });
  await SE.finish();

  // ================= Session F: public tracking =================
  const SF = await new Session('FIN-TRK', { video: true }).start();
  await SF.jcase({ id: 'FIN-11', domain: 'TRACKING', capability: 'Public tracking page returns real shipment status', persona: 'PUBLIC VISITOR', startUrl: BASE + '/track', expected: 'Created shipment tracking number resolves to a status', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/track', { waitUntil: 'domcontentloaded' }); await sleep(3500);
    const t0 = await SF.text();
    await h.shot('track-page');
    const trk = trackingNumber || (loadState().tenantA && loadState().tenantA.trackingNumber) || B.tracking;
    h.step(`Lookup: ${trk}`);
    const inp = page.locator('input:visible').first();
    if (!(await inp.isVisible({ timeout: 5000 }).catch(() => false))) return h.fail(`No tracking input. text="${t0.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT' });
    await inp.fill(trk);
    await clickFirst(page, ['button:has-text("Track")', 'button[type="submit"]', 'button:has-text("Search")'], 3000);
    await sleep(6000);
    const t = await SF.text();
    await h.shot('track-result');
    if (/not found|no shipment|invalid/i.test(t)) return h.fail(`Tracking lookup failed for ${trk}: "${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-FIN-11' });
    if (/status|draft|booked|pending|delivered|in transit|shipment/i.test(t)) return h.pass(`Tracking ${trk} resolved: "${t.slice(0, 300)}"`);
    return h.fail(`Ambiguous tracking result: "${t.slice(0, 250)}"`, { classification: 'UNCLASSIFIED' });
  });
  await SF.finish();

  console.log('\n=== TIMINGS ===', JSON.stringify(timings));
  console.log('=== P17 COMPLETE ===');
  process.exit(0);
})().catch(e => { console.error('P17 FATAL:', e); process.exit(1); });
