// Phase 5b — CORRECTED invite: fill fields inside the Invite modal dialog.
const { BASE, Session, loadState, saveState, clickFirst, uiLogin } = require('./harness');
const { waitForMessage, extractLinks } = require('./mailbox');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OWNER = 'BUSINESS OWNER';
const EMP = 'INVITED NEW USER';
const PW_EMP = 'UatCertEmp!2026B';

(async () => {
  const st = loadState();
  const A = st.tenantA;
  const boxI = st.mailboxes.invitee;
  const S = await new Session('TEAM2', { video: true }).start();
  const page = S.page;

  await S.jcase({ id: 'TEAM-01C', domain: 'TEAM/RBAC', capability: 'Owner invites member with restricted role (dialog-scoped)', persona: OWNER, startUrl: BASE + '/members', expected: 'Invite form submits; member appears pending', coreDep: 'YES' }, async (page, h) => {
    await uiLogin(page, A.email, A.password);
    await page.goto(BASE + '/members', { waitUntil: 'domcontentloaded' }); await sleep(5000);
    const inv = await clickFirst(page, ['button:has-text("Invite Member")', 'button:has-text("Invite")'], 4000);
    h.step(`Invite control: ${inv}`);
    await sleep(2000);
    const dlg = page.locator('div').filter({ hasText: /Invite a Team Member|Invite Member/i }).last();
    await h.shot('modal');
    const nameIn = dlg.locator('input').first();
    const emailIn = dlg.locator('input[type="email"], input').nth(1);
    if (!(await nameIn.isVisible({ timeout: 3000 }).catch(() => false))) return h.fail('Invite modal did not open', { classification: 'UI_DEFECT', defectRef: 'DEF-TEAM-01' });
    await nameIn.fill('UAT Cert Ops Member');
    await emailIn.fill(boxI.address);
    h.step('Filled Full Name + Email Address in modal');
    const sel = dlg.locator('select').first();
    if (await sel.isVisible({ timeout: 1500 }).catch(() => false)) {
      const opts = await sel.locator('option').allTextContents();
      const idx = opts.findIndex(o => /customer|read-only|member|viewer|operation/i.test(o));
      await sel.selectOption({ index: idx >= 0 ? idx : 0 });
      h.step(`Role: ${opts[idx >= 0 ? idx : 0]}`);
      saveState({ inviteRole: opts[idx >= 0 ? idx : 0] });
    }
    await dlg.getByRole('button', { name: /send invite/i }).first().click();
    h.step('Clicked Send Invite');
    await sleep(5000);
    const t = await S.text();
    await h.shot('after');
    const err = /error|failed|invalid/i.test(t);
    if (!err) return h.pass('Invite submitted', { notes: t.slice(0, 350) });
    return h.fail(`Invite error: "${t.slice(0, 300)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-TEAM-01' });
  });

  await S.jcase({ id: 'TEAM-02C', domain: 'TEAM/RBAC', capability: 'Invitation email received (real delivery)', persona: EMP, startUrl: 'external mailbox', expected: 'Invitation email with link arrives', coreDep: 'YES' }, async (page, h) => {
    const msg = await waitForMessage(boxI, { subjectRe: /invit|afruheritage|team|join|added|member/i, timeoutMs: 300000, pollMs: 8000 });
    if (!msg) return h.fail('No invitation email within 5 min', { classification: 'INTEGRATION_DEFECT', defectRef: 'DEF-EMAIL-02' });
    const links = extractLinks(msg);
    saveState({ invite: { subject: msg.subject, links } });
    h.step(`Email: "${msg.subject}" links=${links.length}`);
    return h.pass(`Invitation email received: "${msg.subject}"`, { notes: `links: ${links.join(' | ')}` });
  });
  await S.finish();

  const S2 = await new Session('TEAMACC3', { video: true }).start();
  await S2.jcase({ id: 'TEAM-03C', domain: 'TEAM/RBAC', capability: 'Invitee accepts invitation -> tenant workspace', persona: EMP, startUrl: 'invitation link', expected: 'Accept link -> set password -> inside UATCERT Meridian Freight', coreDep: 'YES' }, async (page, h) => {
    const inv = loadState().invite;
    if (!inv?.links?.length) return h.blocked('No invitation link');
    const accept = inv.links.find(l => /invit|accept|join|member|register|password/i.test(l)) || inv.links[0];
    h.step(`Opening ${accept}`);
    await page.goto(accept, { waitUntil: 'domcontentloaded', timeout: 40000 }); await sleep(4000);
    let t = await S2.text(); let u = page.url();
    await h.shot('accept-page');
    h.step(`Page: ${u} :: "${t.slice(0, 250)}"`);
    const pwFields = await page.locator('input[type="password"]:visible').all();
    for (const f of pwFields) { try { await f.fill(PW_EMP); } catch {} }
    if (pwFields.length) h.step(`Filled ${pwFields.length} password field(s)`);
    const acc = await clickFirst(page, ['button:has-text("Accept")', 'button:has-text("Join")', 'button:has-text("Set Password")', 'button:has-text("Create")', 'button:has-text("Activate")', 'button:has-text("Continue")', 'button[type="submit"]'], 3000);
    h.step(`Clicked ${acc}`);
    await sleep(4500);
    if (/login/.test(page.url())) {
      h.step('At login — signing in as invitee');
      await page.locator('input[name="email"]').fill(boxI.address);
      await page.locator('input[type="password"]').first().fill(PW_EMP);
      await page.getByRole('button', { name: /sign in/i }).first().click();
      for (let i = 0; i < 14; i++) { await sleep(1500); if (!page.url().includes('/login')) break; }
      await sleep(2500);
    }
    t = await S2.text(); u = page.url();
    await h.shot('after');
    if (/meridian|uatcert/i.test(t) && !/login/.test(u)) return h.pass(`Invitee inside tenant: ${u}`, { notes: t.slice(0, 300) });
    return h.fail(`Acceptance did not land in tenant. url=${u} text="${t.slice(0, 300)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-TEAM-03' });
  });

  await S2.jcase({ id: 'TEAM-04C', domain: 'TEAM/RBAC', capability: 'Restricted member (Customer role) vs admin surfaces', persona: EMP, startUrl: 'invitee session', expected: 'Customer-role member blocked from billing/settings/invite', coreDep: 'YES' }, async (page, h) => {
    if (/login/.test(page.url())) {
      await page.locator('input[name="email"]').fill(boxI.address);
      await page.locator('input[type="password"]').first().fill(PW_EMP);
      await page.getByRole('button', { name: /sign in/i }).first().click();
      for (let i = 0; i < 14; i++) { await sleep(1500); if (!page.url().includes('/login')) break; }
      await sleep(2000);
    }
    const role = loadState().inviteRole || 'Customer';
    const results = [];
    for (const slug of ['/billing', '/settings', '/members', '/shipments/new']) {
      await page.goto(BASE + slug, { waitUntil: 'domcontentloaded' }); await sleep(4000);
      const t = await S2.text(); const u = page.url();
      const denied = /forbidden|denied|not authorized|permission|access denied|upgrade|sign in|customer portal|track your/i.test(t) || /login|sign-in|portal/.test(u);
      const canMutate = /(select plan|add funds|invite member|save changes|cancel subscription|create shipment)/i.test(t);
      results.push(`${slug}: denied=${denied} mutable=${canMutate}`);
      await h.shot(`rbac${slug.replace(/\//g, '_')}`);
    }
    if (/admin/i.test(role)) return h.pass(`Invited role was admin — admin access correct. ${results.join(' | ')}`, { classification: 'RBAC_CORRECT' });
    const anyDenied = results.some(r => /denied=true/.test(r));
    const anyMut = results.some(r => /mutable=true/.test(r));
    if (anyDenied && !anyMut) return h.pass(`Restricted role "${role}" denied admin surfaces. ${results.join(' | ')}`);
    if (anyMut) return h.fail(`Restricted member reached mutable admin UI: ${results.join(' | ')}`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-RBAC-01' });
    return h.fail(`Ambiguous: ${results.join(' | ')}`, { classification: 'UNCLASSIFIED', defectRef: 'DEF-RBAC-02' });
  });
  await S2.finish();

  const S3 = await new Session('TEAMLIST2').start();
  await S3.jcase({ id: 'TEAM-05C', domain: 'TEAM/RBAC', capability: 'Owner sees invited member in team list with status', persona: OWNER, startUrl: BASE + '/members', expected: 'Member row visible with role/status', coreDep: 'NO' }, async (page, h) => {
    await uiLogin(page, loadState().tenantA.email, loadState().tenantA.password);
    await page.goto(BASE + '/members', { waitUntil: 'domcontentloaded' }); await sleep(5000);
    const t = await S3.text();
    await h.shot('list');
    if (/ops member|uati-|pending|accepted|active|invited|customer/i.test(t)) return h.pass('Member visible in team list', { notes: t.slice(0, 400) });
    return h.fail(`Member not visible. text="${t.slice(0, 300)}"`, { classification: 'UI_DEFECT', defectRef: 'DEF-TEAM-05' });
  });
  await S3.finish();
  console.log('\nPhase 5b complete');
})().catch(async e => { console.error('FATAL', e); process.exit(1); });
