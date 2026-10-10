// P21c — corrected retest of P21-11 (password reset) and P21-13 (apex support).
const { BASE, Session, loadState, saveState, uiLogin, clickFirst } = require('./harness');
const { waitForMessage, extractLinks } = require('./mailbox');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const PUB = 'PUBLIC VISITOR', EMP = 'INVITED EMPLOYEE';
const NEWPW = 'HandoverEmp!2028';

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

(async () => {
  const st = loadState();
  const empBox = (st.mailboxes || {}).p21emp;

  // ---- password reset full cycle ----
  const SPW = await new Session('P21C-PW', { video: true }).start();
  await SPW.jcase({ id: 'P21-11R', domain: 'ACCOUNT', capability: 'Forgot password -> reset email -> new password -> sign in', persona: EMP, startUrl: BASE + '/forgot-password', expected: 'Reset email; link resets password; new password signs in', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/forgot-password', { waitUntil: 'domcontentloaded' }); await sleep(3500);
    await page.locator('input[type="email"], input[name="email"]').first().fill(empBox.address);
    const sentAt = Date.now();
    await clickButtonText(page, [/send reset link/i, /reset/i], 3000);
    await sleep(4000);
    const msg = await waitForMessage(empBox, { subjectRe: /reset|password/i, timeoutMs: 300000, pollMs: 8000, sinceMs: sentAt - 15000 });
    if (!msg) return h.fail('No reset email in 5 min', { classification: 'INTEGRATION_DEFECT' });
    const links = extractLinks(msg);
    const resetLink = links.find(l => /reset-password/i.test(l));
    h.step(`Reset email: "${msg.subject}" link=${resetLink || 'none'}`);
    if (!resetLink) return h.fail(`No reset link. links=${links.join(',')}`, { classification: 'PRODUCT_DEFECT' });
    await page.goto(resetLink, { waitUntil: 'domcontentloaded', timeout: 40000 }); await sleep(3500);
    const pwf = await page.locator('input[type="password"]:visible').all();
    for (const f of pwf) { try { await f.fill(NEWPW); } catch {} }
    const postWait = page.waitForResponse(r => /password-reset\/confirm/.test(r.url()), { timeout: 30000 }).catch(() => null);
    await clickButtonText(page, [/set password/i, /reset password/i, /save/i], 3000);
    const resp = await postWait;
    h.step(`Reset POST: ${resp ? resp.status() : 'none'}`);
    for (let i = 0; i < 12; i++) { await sleep(2000); if (/login/.test(page.url())) break; }
    if (!/login/.test(page.url())) await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    await page.locator('input[name="email"], input[type="email"]').first().fill(empBox.address);
    await page.locator('input[type="password"]').first().fill(NEWPW);
    await page.getByRole('button', { name: /sign in/i }).first().click();
    for (let i = 0; i < 15; i++) { await sleep(1500); if (!page.url().includes('/login')) break; }
    await sleep(2000);
    await h.shot('after-reset-login');
    if (!/login/.test(page.url())) {
      saveState({ p21: { ...(loadState().p21 || {}), empPassword: NEWPW } });
      return h.pass(`Password reset verified; signed in at ${page.url()}`);
    }
    return h.fail('Login with new password failed', { classification: 'PRODUCT_DEFECT' });
  });
  await SPW.finish();

  // ---- apex support guidance ----
  const SAP = await new Session('P21C-APEX', { video: true }).start();
  await SAP.jcase({ id: 'P21-13R', domain: 'SUPPORT', capability: 'Apex /support shows tenant guidance, no dead-end form', persona: PUB, startUrl: BASE + '/support', expected: 'Guidance that tickets go via the business portal; no submittable dead-end form', coreDep: 'NO' }, async (page, h) => {
    await page.goto(BASE + '/support', { waitUntil: 'domcontentloaded' }); await sleep(4000);
    const t = await SAP.text(); await h.shot('apex-support');
    if (/handled by the business|business that is\s+handling|support@afruheritage\.com/i.test(t)) return h.pass('Apex support shows tenant-portal guidance');
    return h.fail(`No tenant guidance. text="${t.slice(0, 400)}"`, { classification: 'PRODUCT_DEFECT' });
  });
  await SAP.finish();

  console.log('=== P21C COMPLETE ===');
  process.exit(0);
})().catch(e => { console.error('P21C FATAL:', e); process.exit(1); });
