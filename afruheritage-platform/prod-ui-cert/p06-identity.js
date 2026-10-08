// Phase 6 — IDENTITY: logout, session persistence, forgot/reset password via real email.
const { BASE, Session, loadState, saveState, clickFirst, uiLogin, uiLogout } = require('./harness');
const { waitForMessage, extractLinks } = require('./mailbox');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OWNER = 'BUSINESS OWNER';
const PW_NEW = 'UatCertPass!2026A-v2';

(async () => {
  const A = loadState().tenantA;
  const boxA = loadState().mailboxes.tenantA;
  const S = await new Session('IDENT', { video: true }).start();
  const page = S.page;

  // ---- AUTH-02 login + session persistence ----
  await S.jcase({ id: 'AUTH-02', domain: 'IDENTITY', capability: 'Session persistence across reload', persona: OWNER, startUrl: BASE + '/login', expected: 'After login, page reload keeps the user inside workspace', coreDep: 'YES' }, async (page, h) => {
    const u = await uiLogin(page, A.email, A.password);
    h.step(`Logged in -> ${u}`);
    await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    h.step('On dashboard; reloading page');
    await page.reload({ waitUntil: 'domcontentloaded' }); await sleep(4000);
    const u2 = page.url(); const t = await S.text();
    await h.shot('after-reload');
    if (!/login/.test(u2) && /dashboard|meridian|uatcert/i.test(u2 + t)) return h.pass(`Session persisted after reload at ${u2}`);
    return h.fail(`Session lost after reload -> ${u2}`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-AUTH-02' });
  });

  // ---- AUTH-03 logout ----
  await S.jcase({ id: 'AUTH-03', domain: 'IDENTITY', capability: 'Logout returns to public sign-in', persona: OWNER, startUrl: 'workspace', expected: 'Sign out ends session; protected page requires login again', coreDep: 'YES' }, async (page, h) => {
    const u = await uiLogout(page);
    h.step(`After logout click -> ${u}`);
    await h.shot('after-logout');
    // verify protected page now requires login
    await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded' }); await sleep(3000);
    const u2 = page.url();
    h.step(`Dashboard after logout -> ${u2}`);
    if (/login/.test(u) || /login/.test(u2)) return h.pass(`Logout works; dashboard protected (redirected to ${u2})`);
    const t = await S.text();
    if (/dashboard|meridian/i.test(t)) return h.fail(`Logout did not end session — dashboard still accessible at ${u2}`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-AUTH-03' });
    return h.fail(`Logout result unclear. logout->${u} dashboard->${u2}`, { classification: 'UNCLASSIFIED', defectRef: 'DEF-AUTH-04' });
  });

  await S.finish();

  // ---- AUTH-04 forgot/reset password with real email ----
  const S2 = await new Session('RESET', { video: true }).start();
  const p2 = S2.page;
  await S2.jcase({ id: 'AUTH-04', domain: 'IDENTITY', capability: 'Forgot password: reset email + link sets new password', persona: OWNER, startUrl: BASE + '/forgot-password', expected: 'Reset email arrives; link leads to working reset form; new password logs in', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/forgot-password', { waitUntil: 'domcontentloaded' }); await sleep(1500);
    await page.locator('input[type="email"], input[name="email"], input#email').first().fill(A.email);
    await h.shot('forgot-filled');
    const resetReqAt = Date.now();
    await clickFirst(page, ['button:has-text("Send reset link")', 'button:has-text("Send")', 'button[type="submit"]']);
    h.step('Submitted forgot-password form');
    await sleep(4000);
    const t1 = await S2.text();
    await h.shot('after-submit');
    h.step(`Page feedback: "${t1.slice(0, 200)}"`);

    h.step('Polling mailbox for reset email');
    const msg = await waitForMessage(boxA, { subjectRe: /reset|password/i, timeoutMs: 300000, pollMs: 8000, sinceMs: resetReqAt - 15000 });
    if (!msg) return h.fail('No reset email within 5 min', { classification: 'INTEGRATION_DEFECT', defectRef: 'DEF-EMAIL-03' });
    const links = extractLinks(msg);
    h.step(`Reset email: "${msg.subject}" links=${links.join(' | ')}`);
    if (!links.length) return h.fail('Reset email contains no link', { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-RESET-01' });
    const resetLink = links.find(l => /reset|token|password/i.test(l)) || links[0];
    await page.goto(resetLink, { waitUntil: 'domcontentloaded', timeout: 40000 }); await sleep(4000);
    let t = await S2.text(); let u = page.url();
    await h.shot('reset-page');
    h.step(`Reset link -> ${u} :: "${t.slice(0, 250)}"`);
    const pwFields = await page.locator('input[type="password"]:visible').all();
    if (!pwFields.length) {
      if (/sign in|log ?in/i.test(t)) return h.fail(`Reset link leads to a LOGIN form (not a reset form): ${u}`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-RESET-02', notes: 'Same defect family as invite link — email links point to api.afruheritage.com/login' });
      return h.fail(`Reset link lands on page without password fields: ${u} "${t.slice(0, 200)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-RESET-03' });
    }
    for (const f of pwFields) { try { await f.fill(PW_NEW); } catch {} }
    h.step(`Filled ${pwFields.length} password field(s)`);
    await clickFirst(page, ['button:has-text("Reset")', 'button:has-text("Set Password")', 'button:has-text("Save")', 'button:has-text("Continue")', 'button[type="submit"]']);
    await sleep(4000);
    t = await S2.text(); u = page.url();
    await h.shot('after-reset');
    // now login with new password
    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' }); await sleep(1500);
    await page.locator('input[name="email"]').fill(A.email);
    await page.locator('input[type="password"]').first().fill(PW_NEW);
    await page.getByRole('button', { name: /sign in/i }).first().click();
    for (let i = 0; i < 14; i++) { await sleep(1500); if (!page.url().includes('/login')) break; }
    await sleep(2500);
    const u3 = page.url();
    if (!u3.includes('/login')) { saveState({ tenantA: { ...loadState().tenantA, password: PW_NEW } }); return h.pass(`Reset flow completed; new password logs in -> ${u3}`); }
    return h.fail(`New password rejected at login (${u3})`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-RESET-04' });
  });
  await S2.finish();
  console.log('\nPhase 6 complete');
})().catch(async e => { console.error('FATAL', e); process.exit(1); });
