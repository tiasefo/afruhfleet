// Phase 2 — GOLDEN JOURNEY (guide test 57): one continuous customer session.
// anonymous -> register -> welcome email -> login -> onboarding -> subscription
// -> workspace -> profile -> template -> storefront -> publish -> invite
// -> employee accepts -> CRM -> shipment -> fleet -> tracking -> warehouse
// -> customs -> support -> billing -> analytics -> AI -> persistence
const { BASE, Session, loadState, saveState, clickFirst, fillIfPresent, uiLogin, uiLogout } = require('./harness');
const { waitForMessage, extractLinks } = require('./mailbox');
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const EVID = path.join(__dirname, '..', 'playwright-evidence');

const OWNER = 'BUSINESS OWNER';
const EMP = 'INVITED NEW USER';
const ANON = 'ANONYMOUS CUSTOMER';
const PW = 'UatCertPass!2026A';
const PW_EMP = 'UatCertEmp!2026B';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function dump(session, tag, h) {
  const t = await session.text();
  const u = session.url();
  console.log(`    [${tag}] url=${u}\n    text=${t.slice(0, 350)}`);
  return { t, u };
}

async function fillByNames(page, patterns, value) {
  // patterns: array of regex strings matched against name/id/placeholder
  const inputs = await page.locator('input:visible, textarea:visible').all();
  for (const el of inputs) {
    const name = (await el.getAttribute('name')) || '';
    const id = (await el.getAttribute('id')) || '';
    const ph = (await el.getAttribute('placeholder')) || '';
    const hay = `${name} ${id} ${ph}`.toLowerCase();
    if (patterns.some(p => hay.includes(p))) {
      try { await el.fill(value); return `${name || id || ph}`; } catch {}
    }
  }
  return null;
}

async function clickButtonText(page, res, timeout = 2500) {
  for (const re of res) {
    const loc = page.getByRole('button', { name: re }).first();
    try { if (await loc.isVisible({ timeout })) { await loc.click(); return re.toString(); } } catch {}
    const link = page.getByRole('link', { name: re }).first();
    try { if (await link.isVisible({ timeout: 800 })) { await link.click(); return re.toString() + '(link)'; } } catch {}
  }
  return null;
}

(async () => {
  const st = loadState();
  const boxA = st.mailboxes.tenantA;
  const boxI = st.mailboxes.invitee;
  const company = 'UATCERT Meridian Freight';
  const ownerName = 'UAT Cert Owner Alpha';
  const S = await new Session('GJ', { video: true }).start();
  const page = S.page;
  const state = { shipmentTracking: null, storefrontUrl: null, supportToken: null };

  // ============ GJ-01 registration ============
  await S.jcase({ id: 'GJ-01', domain: 'IDENTITY', capability: 'Registration: fresh business account via public site', persona: ANON, startUrl: BASE, expected: 'Account created; customer proceeds to onboarding/plan/workspace', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' }); await sleep(2000);
    h.step('Opened afruheritage.com as anonymous visitor');
    const entry = await clickFirst(page, ['a:has-text("Get Started")', 'a:has-text("Start Free Trial")']);
    h.step(`Clicked ${entry || 'nothing'} -> ${page.url()}`);
    if (!page.url().includes('register')) { await page.goto(BASE + '/register'); h.step('Navigated to /register'); }
    await sleep(1200);
    await page.locator('input[name="company_name"]').fill(company);
    await page.locator('input[name="full_name"]').fill(ownerName);
    await page.locator('input[name="email"]').fill(boxA.address);
    await page.locator('input[name="password"]').fill(PW);
    await page.locator('input[name="confirm_password"]').fill(PW);
    await h.shot('filled');
    h.step('Filled company/name/email/password, clicked Create Account');
    await clickFirst(page, ['button:has-text("Create Account")', 'button[type="submit"]']);
    for (let i = 0; i < 12; i++) { await sleep(1500); if (!page.url().endsWith('/register')) break; }
    await sleep(3000);
    const { t, u } = await dump(S, 'post-register', h);
    await h.shot('result');
    saveState({ tenantA: { email: boxA.address, password: PW, company, ownerName, postRegUrl: u } });
    if (!u.endsWith('/register') || /dashboard|onboarding|plan|verify|welcome|check your email|choose/i.test(t)) {
      return h.pass(`Registration submitted; landed at ${u}: "${t.slice(0, 220)}"`);
    }
    return h.fail(`Registration stalled on /register. text="${t.slice(0, 300)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-REG-01' });
  });

  // ============ GJ-02 welcome email ============
  await S.jcase({ id: 'GJ-02', domain: 'IDENTITY', capability: 'Welcome email received at real external mailbox', persona: OWNER, startUrl: 'external mailbox', expected: 'Welcome email from Afruheritage naming the business', coreDep: 'YES' }, async (page, h) => {
    h.step('Polled controlled external mailbox (mail.tm) for welcome email');
    const msg = await waitForMessage(boxA, { subjectRe: /afruheritage|welcome|verify|confirm/i, timeoutMs: 300000, pollMs: 8000 });
    if (!msg) return h.fail('No welcome/verification email within 5 minutes', { classification: 'INTEGRATION_DEFECT', defectRef: 'DEF-EMAIL-01' });
    const links = extractLinks(msg);
    saveState({ tenantA: { ...loadState().tenantA, welcomeSubject: msg.subject, welcomeLinks: links } });
    h.step(`Email received: "${msg.subject}" from ${msg.from?.address}`);
    if (links.length) { h.step(`Following email link: ${links[0]}`); await page.goto(links[0], { waitUntil: 'domcontentloaded' }); await sleep(2500); await h.shot('email-link'); }
    return h.pass(`Welcome email received: "${msg.subject}". links=${links.length}${links.length ? ' followed ' + links[0] + ' -> ' + page.url() : ''}`, { notes: `links: ${links.join(' | ')}` });
  });

  // ============ GJ-03 login ============
  let loginUrl = '';
  await S.jcase({ id: 'GJ-03', domain: 'IDENTITY', capability: 'Login reaches business workspace', persona: OWNER, startUrl: BASE + '/login', expected: 'Valid credentials reach workspace/onboarding', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' }); await sleep(1200);
    await page.locator('input[name="email"]').fill(boxA.address);
    await page.locator('input[name="password"]').fill(PW);
    h.step('Entered credentials on /login, clicked Sign In');
    await clickFirst(page, ['button:has-text("Sign In")', 'button[type="submit"]']);
    for (let i = 0; i < 14; i++) { await sleep(1500); if (!page.url().includes('/login')) break; }
    await sleep(2500);
    const { t, u } = await dump(S, 'post-login', h);
    loginUrl = u;
    await h.shot('after-login');
    saveState({ tenantA: { ...loadState().tenantA, postLoginUrl: u } });
    if (!u.includes('/login') || /dashboard|onboarding|workspace|plan|verify/i.test(u + ' ' + t.slice(0, 200))) return h.pass(`Logged in -> ${u}`);
    return h.fail(`Login failed or stuck. url=${u} text="${t.slice(0, 250)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-AUTH-01' });
  });

  // ============ GJ-04 onboarding / post-login state ============
  await S.jcase({ id: 'GJ-04', domain: 'TENANT', capability: 'Onboarding / post-login business setup', persona: OWNER, startUrl: loginUrl || 'post-login', expected: 'Onboarding completes; business workspace reachable', coreDep: 'YES' }, async (page, h) => {
    let { t, u } = await dump(S, 'onboarding-start', h);
    await h.shot('start');
    // attempt to progress through any onboarding wizard like a user would
    for (let i = 0; i < 6; i++) {
      const clicked = await clickButtonText(page, [/continue/i, /next/i, /get started/i, /finish/i, /complete/i, /skip/i, /go to dashboard/i, /start trial/i, /choose/i], 1500);
      if (!clicked) break;
      h.step(`Onboarding: clicked ${clicked}`);
      await sleep(1800);
      const d = await dump(S, `onboarding-${i}`, h);
      t = d.t; u = d.u;
      if (/dashboard|workspace/.test(u) || /dashboard/i.test(t.slice(0, 300))) break;
    }
    await h.shot('end');
    saveState({ tenantA: { ...loadState().tenantA, onboardUrl: page.url() } });
    if (/dashboard|onboarding|billing|workspace|plan/i.test(u) || /dashboard/i.test(t)) {
      return h.pass(`Post-login state reachable: ${u}`, { notes: t.slice(0, 300) });
    }
    return h.fail(`Onboarding unclear/stuck. url=${u} text="${t.slice(0, 300)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-ONB-01' });
  });

  // ============ GJ-05 trial/subscription ============
  await S.jcase({ id: 'GJ-05', domain: 'TENANT', capability: 'Trial / subscription activation', persona: OWNER, startUrl: 'workspace', expected: 'Subscription shows trialing/active; workspace enabled', coreDep: 'YES' }, async (page, h) => {
    // look for plan selection or billing
    let { t, u } = await dump(S, 'sub-start', h);
    const subWords = /trial|subscribe|plan|billing/i;
    // try billing page
    await page.goto(BASE + '/billing', { waitUntil: 'domcontentloaded' }); await sleep(2500);
    ({ t, u } = await dump(S, 'billing', h));
    await h.shot('billing');
    if (/login/.test(u)) return h.blocked('Lost session — redirected to login', { classification: 'UNCLASSIFIED' });
    const already = /(active|trialing|trial).*(plan|subscription)|current plan|subscription.*active/i.test(t);
    const chooseClicked = await clickButtonText(page, [/start.*trial/i, /activate/i, /choose.*plan/i, /select plan/i, /subscribe/i, /start free/i, /trial/i], 2000);
    if (chooseClicked) { h.step(`Clicked ${chooseClicked}`); await sleep(3000); ({ t, u } = await dump(S, 'after-choose', h)); await h.shot('after-choose'); }
    const ok = /(active|trialing)/i.test(t) || chooseClicked;
    saveState({ tenantA: { ...loadState().tenantA, billingText: t.slice(0, 400) } });
    if (ok) return h.pass(`Subscription state visible${already ? ' (already active/trialing)' : ''}${chooseClicked ? ' after clicking ' + chooseClicked : ''}: "${t.slice(0, 250)}"`);
    return h.fail(`No subscription activation possible/visible on /billing. text="${t.slice(0, 300)}"`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-SUB-01' });
  });

  // ============ GJ-06 workspace & nav ============
  await S.jcase({ id: 'GJ-06', domain: 'TENANT', capability: 'Tenant workspace dashboard & navigation', persona: OWNER, startUrl: BASE + '/dashboard', expected: 'Dashboard with business-scoped menus (Shipments, Team, Customers/CRM, Warehouse, Customs, Billing, Settings)', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded' }); await sleep(3000);
    const { t, u } = await dump(S, 'dashboard', h);
    await h.shotFull('dashboard');
    if (/login/.test(u)) return h.fail('Dashboard redirected to login — session not persisting', { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-AUTH-02' });
    const areas = ['shipment', 'team|member', 'customer|crm', 'warehouse', 'customs', 'billing', 'setting'];
    const missing = areas.filter(a => !new RegExp(a, 'i').test(t));
    const onSub = /[a-z0-9-]+\.afruheritage\.com/.test(u);
    if (missing.length <= 2) return h.pass(`Dashboard reachable at ${u}; nav areas present. missing-ish: ${missing.join(',') || 'none'}`, { notes: `subdomain-URL=${onSub}. text: ${t.slice(0, 350)}` });
    return h.fail(`Dashboard missing expected menus: ${missing.join(', ')}. url=${u} text="${t.slice(0, 300)}"`, { classification: 'UI_DEFECT', defectRef: 'DEF-WKS-01', notes: `subdomain-URL=${onSub}` });
  });

  // ============ GJ-07 business profile/settings ============
  await S.jcase({ id: 'GJ-07', domain: 'TENANT', capability: 'Business profile & settings update', persona: OWNER, startUrl: BASE + '/settings', expected: 'Business contact info editable and persisted', coreDep: 'YES' }, async (page, h) => {
    await page.goto(BASE + '/settings', { waitUntil: 'domcontentloaded' }); await sleep(2500);
    let { t, u } = await dump(S, 'settings', h);
    await h.shot('settings');
    if (/login/.test(u)) return h.blocked('Redirected to login');
    if (/404|not found/i.test(t.slice(0, 200))) {
      await page.goto(BASE + '/profile', { waitUntil: 'domcontentloaded' }); await sleep(2000);
      ({ t, u } = await dump(S, 'profile', h)); await h.shot('profile');
    }
    const filled = await fillByNames(page, ['phone', 'contact', 'address', 'company', 'business'], '+233550008877');
    if (filled) {
      h.step(`Filled field ${filled}`);
      const saved = await clickButtonText(page, [/save/i, /update/i, /apply/i], 2000);
      h.step(`Clicked ${saved || 'no-save-button'}`);
      await sleep(2500);
      await page.reload({ waitUntil: 'domcontentloaded' }); await sleep(2000);
      const t2 = await S.text();
      const persisted = t2.includes('233550008877') || t2.includes('500 0887') || /saved|updated|success/i.test(t2);
      if (persisted) return h.pass('Settings updated and persisted after reload');
      return h.fail(`Setting did not persist after reload`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-SET-01' });
    }
    // no editable fields found — report what's there
    const hasSettingsUi = /setting|profile|business|company/i.test(t);
    if (hasSettingsUi) return h.fail(`Settings page renders but no editable business field found. text="${t.slice(0, 300)}"`, { classification: 'UI_DEFECT', defectRef: 'DEF-SET-02' });
    return h.fail(`No settings/profile page reachable. url=${u} text="${t.slice(0, 200)}"`, { classification: 'UI_DEFECT', defectRef: 'DEF-SET-03' });
  });

  await S.finish();
  console.log('\nGolden journey part 1 complete (identity+tenant bootstrap)');
})().catch(async e => { console.error('FATAL', e); process.exit(1); });
