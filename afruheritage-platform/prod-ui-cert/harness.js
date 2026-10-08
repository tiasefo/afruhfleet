// PROD-UI-CERT-01 evidence harness.
// Human-equivalent Playwright only: goto/click/fill/select/upload/visible-text/navigation.
// No page.evaluate actions, no forced clicks, no API substitution, no storage injection.
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '..');
const EVID = path.join(ROOT, 'playwright-evidence');
const CSV_PATH = path.join(ROOT, process.env.MATRIX_CSV || 'PROD_UI_CERTIFICATION_MATRIX.csv');
const STATE_PATH = path.join(__dirname, 'state.json');
const BASE = 'https://afruheritage.com';

for (const d of ['screenshots', 'console', 'network', 'traces', 'videos']) {
  fs.mkdirSync(path.join(EVID, d), { recursive: true });
}

const CSV_HEADER = 'ID,Domain,Capability,Persona,Starting URL,UI Test Performed,Expected,Actual,Status,Classification,Core Dependency,Release Disposition,Evidence Paths,Defect Reference,Notes';
if (!fs.existsSync(CSV_PATH)) fs.writeFileSync(CSV_PATH, CSV_HEADER + '\n');

function csvEscape(v) {
  const s = String(v == null ? '' : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')); } catch { return {}; }
}
function saveState(patch) {
  const s = { ...loadState(), ...patch };
  fs.writeFileSync(STATE_PATH, JSON.stringify(s, null, 2));
  return s;
}

let browserPromise = null;
async function getBrowser() {
  if (!browserPromise) browserPromise = chromium.launch({ headless: true });
  return browserPromise;
}
async function closeBrowser() {
  if (browserPromise) { const b = await browserPromise; await b.close(); browserPromise = null; }
}

/**
 * runCase(meta, fn, opts)
 * meta: {id, domain, capability, persona, startUrl, expected, coreDep}
 * fn(page, ctx) must return {status:'PASS'|'FAIL'|'BLOCKED', actual, classification?, notes?, disposition?, defectRef?}
 *   or call ctx.pass(actual)/ctx.fail(actual)/ctx.blocked(actual) then return undefined.
 * opts: {video, keepTrace, contextOpts}
 */
async function runCase(meta, fn, opts = {}) {
  const evidence = [];
  const consoleLog = [];
  const netLog = [];
  const steps = [];
  const browser = await getBrowser();
  const contextOpts = {
    viewport: { width: 1366, height: 768 },
    ignoreHTTPSErrors: true,
    ...(opts.contextOpts || {}),
  };
  if (opts.video) contextOpts.recordVideo = { dir: path.join(EVID, 'videos'), size: { width: 1280, height: 720 } };
  const context = await browser.newContext(contextOpts);
  await context.tracing.start({ screenshots: true, snapshots: true, sources: false });
  const page = await context.newPage();

  page.on('console', m => { const t = m.type(); if (t === 'error' || t === 'warning') consoleLog.push(`[${t}] ${m.text()}`); });
  page.on('pageerror', e => consoleLog.push(`[pageerror] ${e.message}`));
  page.on('requestfailed', r => netLog.push(`[REQFAIL] ${r.method()} ${r.url()} :: ${r.failure()?.errorText || 'unknown'}`));
  page.on('response', r => {
    const u = r.url();
    const st = r.status();
    if (st >= 400) netLog.push(`[HTTP ${st}] ${r.request().method()} ${u}`);
    else if (/api\.afruheritage\.com/.test(u)) netLog.push(`[API ${st}] ${r.request().method()} ${u}`);
    else if (st >= 300 && st < 400) netLog.push(`[REDIR ${st}] ${u} -> ${r.headers()['location'] || ''}`);
  });

  const ctx = {
    state: loadState(),
    saveState,
    step: s => { steps.push(s); console.log(`    step: ${s}`); },
    shot: async (label) => {
      const p = path.join(EVID, 'screenshots', `${meta.id}-${label}.png`);
      try { await page.screenshot({ path: p, fullPage: false }); evidence.push(path.relative(ROOT, p)); }
      catch (e) { console.log(`    (screenshot failed: ${e.message})`); }
      return p;
    },
    shotFull: async (label) => {
      const p = path.join(EVID, 'screenshots', `${meta.id}-${label}-full.png`);
      try { await page.screenshot({ path: p, fullPage: true }); evidence.push(path.relative(ROOT, p)); } catch {}
      return p;
    },
    _verdict: null,
    pass: (actual, extra = {}) => { ctx._verdict = { status: 'PASS', actual, ...extra }; return ctx._verdict; },
    fail: (actual, extra = {}) => { ctx._verdict = { status: 'FAIL', actual, ...extra }; return ctx._verdict; },
    blocked: (actual, extra = {}) => { ctx._verdict = { status: 'BLOCKED', actual, ...extra }; return ctx._verdict; },
  };

  let verdict = null;
  console.log(`\n=== ${meta.id} ${meta.capability} [${meta.persona}] ===`);
  try {
    const r = await fn(page, ctx);
    verdict = r || ctx._verdict;
    if (!verdict) verdict = { status: 'FAIL', actual: 'Test completed without producing a verdict (harness error)' };
  } catch (e) {
    verdict = { status: 'FAIL', actual: `Unhandled error during UI journey: ${e.message}`.slice(0, 500) };
    await ctx.shot('unhandled-error');
  }

  // Persist logs
  const cl = path.join(EVID, 'console', `${meta.id}.log`);
  fs.writeFileSync(cl, consoleLog.join('\n') || '(no console errors/warnings)');
  evidence.push(path.relative(ROOT, cl));
  const nl = path.join(EVID, 'network', `${meta.id}.log`);
  fs.writeFileSync(nl, netLog.join('\n') || '(no failed requests)');
  evidence.push(path.relative(ROOT, nl));

  // Trace: retain on failure, or if keepTrace
  const keepTrace = verdict.status !== 'PASS' || opts.keepTrace;
  if (keepTrace) {
    const tp = path.join(EVID, 'traces', `${meta.id}.zip`);
    await context.tracing.stop({ path: tp });
    evidence.push(path.relative(ROOT, tp));
  } else {
    await context.tracing.stop();
  }

  // Video
  if (opts.video && page.video()) {
    try {
      const vpath = await page.video().path();
      await context.close();
      const dest = path.join(EVID, 'videos', `${meta.id}.webm`);
      if (fs.existsSync(vpath)) { fs.renameSync(vpath, dest); evidence.push(path.relative(ROOT, dest)); }
    } catch { await context.close(); }
  } else {
    await context.close();
  }

  const row = [
    meta.id, meta.domain, meta.capability, meta.persona, meta.startUrl || BASE,
    steps.join(' | ') || meta.uiTest || '',
    meta.expected, verdict.actual, verdict.status,
    verdict.classification || (verdict.status === 'PASS' ? '' : 'UNCLASSIFIED'),
    meta.coreDep || 'NO',
    verdict.disposition || '',
    evidence.join(';'),
    verdict.defectRef || '',
    verdict.notes || '',
  ];
  fs.appendFileSync(CSV_PATH, row.map(csvEscape).join(',') + '\n');
  console.log(`  -> ${verdict.status}: ${verdict.actual}`);
  return verdict;
}

// ---------- Shared continuous session (golden journey / multi-case persona sessions) ----------
function appendRow(meta, verdict, steps, evidence) {
  const esc = v => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  fs.appendFileSync(CSV_PATH,
    [meta.id, meta.domain, meta.capability, meta.persona, meta.startUrl || BASE, steps, meta.expected,
     verdict.actual, verdict.status, verdict.classification || '', meta.coreDep || 'NO',
     verdict.disposition || '', (evidence || []).join(';'), verdict.defectRef || '', verdict.notes || '']
      .map(esc).join(',') + '\n');
}

class Session {
  constructor(name, opts = {}) {
    this.name = name;
    this.opts = opts;
    this.consoleLog = [];
    this.netLog = [];
    this.steps = [];
    this.browser = null; this.context = null; this.page = null;
    this.currentId = name;
  }
  async start() {
    this.browser = await chromium.launch({ headless: true });
    const cOpts = { viewport: { width: 1366, height: 768 }, ignoreHTTPSErrors: true };
    if (this.opts.video) cOpts.recordVideo = { dir: path.join(EVID, 'videos'), size: { width: 1280, height: 720 } };
    this.context = await this.browser.newContext(cOpts);
    await this.context.tracing.start({ screenshots: true, snapshots: true });
    this.page = await this.context.newPage();
    this.page.on('console', m => { const t = m.type(); if (t === 'error' || t === 'warning') this.consoleLog.push(`[${t}] ${m.text()}`); });
    this.page.on('pageerror', e => this.consoleLog.push(`[pageerror] ${e.message}`));
    this.page.on('requestfailed', r => this.netLog.push(`[REQFAIL] ${r.method()} ${r.url()} :: ${r.failure()?.errorText || ''}`));
    this.page.on('response', r => {
      const u = r.url(); const s = r.status();
      if (s >= 400) this.netLog.push(`[HTTP ${s}] ${r.request().method()} ${u}`);
      else if (/api\.afruheritage\.com/.test(u)) this.netLog.push(`[API ${s}] ${r.request().method()} ${u}`);
      else if (s >= 300 && s < 400) this.netLog.push(`[REDIR ${s}] ${u} -> ${r.headers()['location'] || ''}`);
    });
    return this;
  }
  step(s) { this.steps.push(s); console.log(`    step: ${s}`); }
  async shot(label) {
    const p = path.join(EVID, 'screenshots', `${this.currentId}-${label}.png`);
    try { await this.page.screenshot({ path: p }); return `playwright-evidence/screenshots/${this.currentId}-${label}.png`; }
    catch { return null; }
  }
  async shotFull(label) {
    const p = path.join(EVID, 'screenshots', `${this.currentId}-${label}-full.png`);
    try { await this.page.screenshot({ path: p, fullPage: true }); return `playwright-evidence/screenshots/${this.currentId}-${label}-full.png`; }
    catch { return null; }
  }
  async text() { return (await this.page.locator('body').innerText()).replace(/\s+/g, ' '); }
  url() { return this.page.url(); }
  async jcase(meta, fn) {
    this.currentId = meta.id; this.steps = [];
    const evidence = [];
    console.log(`\n=== ${meta.id} ${meta.capability} [${meta.persona}] ===`);
    let verdict = null;
    const helpers = {
      step: s => this.step(s),
      shot: async l => { const e = await this.shot(l); if (e) evidence.push(e); return e; },
      shotFull: async l => { const e = await this.shotFull(l); if (e) evidence.push(e); return e; },
      text: () => this.text(),
      url: () => this.url(),
      pass: (actual, x = {}) => ({ status: 'PASS', actual, ...x }),
      fail: (actual, x = {}) => ({ status: 'FAIL', actual, ...x }),
      blocked: (actual, x = {}) => ({ status: 'BLOCKED', actual, ...x }),
    };
    try { verdict = await fn(this.page, helpers); }
    catch (e) {
      verdict = { status: 'FAIL', actual: `Unhandled error: ${e.message}`.slice(0, 450) };
      const es = await this.shot('error'); if (es) evidence.push(es);
    }
    if (!verdict) verdict = { status: 'FAIL', actual: 'No verdict produced' };
    appendRow(meta, verdict, this.steps.join(' | ') || meta.uiTest || '', evidence);
    console.log(`  -> ${verdict.status}: ${verdict.actual}`);
    return verdict;
  }
  async finish() {
    fs.writeFileSync(path.join(EVID, 'console', `${this.name}-console.log`), this.consoleLog.join('\n') || '(clean)');
    fs.writeFileSync(path.join(EVID, 'network', `${this.name}-network.log`), this.netLog.join('\n') || '(no failures)');
    try { await this.context.tracing.stop({ path: path.join(EVID, 'traces', `${this.name}.zip`) }); } catch {}
    let vpath = null;
    try { vpath = this.page.video() ? await this.page.video().path() : null; } catch {}
    await this.context.close(); await this.browser.close();
    if (vpath && fs.existsSync(vpath)) { const d = path.join(EVID, 'videos', `${this.name}.webm`); fs.renameSync(vpath, d); }
  }
}

// Common journey helpers — all human-equivalent
async function uiLogin(page, email, password, { waitMs = 45000 } = {}) {
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  const deadline = Date.now() + waitMs;
  let attempt = 0;
  while (Date.now() < deadline) {
    attempt++;
    // The login form can re-render during hydration — fill and verify the
    // value persisted before submitting, like a real user correcting fields.
    const emailInput = page.locator('input[name="email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    await emailInput.fill(email);
    const pwInput = page.locator('input[name="password"]').first();
    await pwInput.fill(password);
    const actual = await emailInput.inputValue().catch(() => '');
    if (actual !== email) { await page.waitForTimeout(1500); continue; }
    await clickFirst(page, ['button:has-text("Sign In")', 'button[type="submit"]']);
    // Wait until browser actually leaves the login page — server latency observed >14s.
    const submitDeadline = Math.min(Date.now() + 60000, deadline);
    while (Date.now() < submitDeadline) {
      await page.waitForTimeout(1500);
      if (!page.url().includes('/login')) { await page.waitForTimeout(3000); return page.url(); }
      // If an error banner appeared, resubmit once (transient 5xx under load).
      const t = await page.locator('body').innerText().catch(() => '');
      if (/couldn't sign you in|server issue|try again/i.test(t) && Date.now() + 20000 < deadline) break;
    }
  }
  throw new Error('uiLogin: still on /login after ' + waitMs + 'ms');
}

// If a case lands on the login page mid-session, re-authenticate once (like a user would).
async function ensureAuthed(page, email, password) {
  if (page.url().includes('/login')) { await uiLogin(page, email, password); return false; }
  const t = await page.locator('body').innerText().catch(() => '');
  if (/welcome back|sign in to your account/i.test(t.slice(0, 400))) { await uiLogin(page, email, password); return false; }
  return true;
}

async function uiLogout(page) {
  const c = await clickFirst(page, [
    'button:has-text("Sign Out")', 'button:has-text("Sign out")', 'button:has-text("Logout")', 'button:has-text("Log out")',
    'a:has-text("Sign Out")', 'a:has-text("Logout")', '[data-testid="logout"]',
  ], 1500);
  if (!c) {
    // try opening a user menu first
    const m = await clickFirst(page, [
      'button:has-text("Account")', '[aria-label="Account menu"]', 'button:has-text("Profile")',
      'header button:has(svg)', 'button[aria-haspopup="menu"]', '[data-testid="user-menu"]',
    ], 1200);
    if (m) {
      await page.waitForTimeout(600);
      await clickFirst(page, ['button:has-text("Sign Out")', 'button:has-text("Logout")', 'a:has-text("Sign Out")', 'a:has-text("Logout")', '[role="menuitem"]:has-text("Sign out")', '[role="menuitem"]:has-text("Log out")'], 1500);
    }
  }
  await page.waitForTimeout(2500);
  return page.url();
}

// Convenience: fill a named input if it exists; returns true if filled.
async function fillIfPresent(page, names, value, timeout = 1500) {
  for (const n of names) {
    const loc = page.locator(`input[name="${n}"]`).first();
    try { if (await loc.isVisible({ timeout })) { await loc.fill(value); return n; } } catch {}
  }
  return null;
}

// Click first visible element matching any selector. Returns which matched or null.
async function clickFirst(page, candidates, timeout = 3000) {
  for (const c of candidates) {
    try {
      const loc = typeof c === 'string' ? page.locator(c).first() : c;
      if (await loc.isVisible({ timeout })) { await loc.click(); return c; }
    } catch {}
  }
  return null;
}

module.exports = { BASE, EVID, ROOT, runCase, loadState, saveState, closeBrowser, fillIfPresent, clickFirst, Session, appendRow, uiLogin, uiLogout };
