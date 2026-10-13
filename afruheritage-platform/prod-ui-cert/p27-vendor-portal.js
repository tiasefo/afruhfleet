// P27 — D-01 vendor-facing portal, full real browser journey:
//  register (UI) -> Sentinel approve+link (API) -> invite email (real) ->
//  vendor-accept (UI) -> login -> /vendor dashboard -> bookings -> accept -> docs
const { chromium } = require('@playwright/test');
const fs = require('fs');
const { createMailbox, waitForMessage, extractLinks, listMessages } = require('./mailbox');

const BASE = 'https://afruheritage.com';
const API = 'https://api.afruheritage.com/api/v1';
const state = JSON.parse(fs.readFileSync('./state.json', 'utf8'));
const OUT = './p27-evidence';
fs.mkdirSync(OUT, { recursive: true });

async function api(method, path, token, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

(async () => {
  const results = [];
  const check = (name, ok, detail) => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + JSON.stringify(detail).slice(0, 180) : ''}`); };

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, recordVideo: { dir: OUT, size: { width: 1400, height: 900 } } });
  const page = await ctx.newPage();
  const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });

  const box = await createMailbox('p27vend');
  const vendorEmail = box.address;
  const vendorPw = 'VendorUAT#' + Math.random().toString(36).slice(2, 8);
  console.log('[P27] vendor email:', vendorEmail);

  const tokAdmin = process.env.CP_TOKEN;
  const lb = await api('POST', '/auth/login', null, { email: state.tenantB.email, password: state.tenantB.password });
  const tokB = lb.data.access_token, tidB = lb.data.tenant_id;

  try {
    // ── 1. Public vendor registration via the new UI ─────────────────────
    await page.goto(`${BASE}/vendor/register`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000); // hydration before form interaction
    await page.locator('#full_name').fill('P27 UAT Vendor');
    await page.locator('#email').fill(vendorEmail);
    await page.locator('#phone').fill('+233550000027');
    await page.locator('#id_number').fill('GHA-P27-001');
    await page.locator('#vehicle_reg_number').fill('GT-P27-01');
    // vehicle type + region checkboxes (first of each)
    await page.locator('label:has-text("Truck")').first().click();
    await page.locator('label:has-text("Greater Accra")').first().click();
    // declarations
    await page.locator('label:has-text("vendor terms")').first().click();
    await page.locator('label:has-text("valid insurance")').first().click();
    await page.locator('label:has-text("background verification")').first().click();
    await shot('01-register-form');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(5000);
    const regOk = await page.locator('text=Application submitted').count();
    await shot('02-register-done');
    check('vendor registration via UI', regOk > 0, { regOk });

    // ── 2. Admin approve + link membership (API, superuser) ──────────────
    const vq = await api('GET', '/vendors/admin?q=P27', tokAdmin);
    const vendor = (vq.data.vendors || vq.data.items || vq.data || []).find?.(x => (x.email || '') === vendorEmail)
      || (vq.data.items || []).find(x => x.email === vendorEmail);
    check('admin finds registered vendor', !!vendor, { status: vq.status });
    const vid = vendor?.id;

    const rv = await api('POST', `/vendors/admin/${vid}/review`, tokAdmin, { action: 'approve' });
    check('vendor approved (admin review)', rv.status === 200 && rv.data.status === 'approved', { status: rv.status, got: rv.data.status });

    const t0 = new Date();
    const link = await api('POST', `/vendors/admin/${vid}/members`, tokAdmin, { user_email: vendorEmail, role: 'owner' });
    check('membership linked + account invited', link.status === 200 && link.data.account_invited === true, { status: link.status, invited: link.data.account_invited });

    // ── 3. Real invitation email → vendor-accept UI ──────────────────────
    const msg = await waitForMessage(box, { subjectRe: /invit|vendor|join|afruheritage/i, sinceMs: t0.getTime(), timeoutMs: 180000 });
    check('vendor invitation email delivered', !!msg, { subject: msg?.subject });
    const links = msg ? extractLinks(msg) : [];
    const acceptUrl = links.find(l => /vendor-accept/.test(l));
    check('invite contains /vendor-accept link', !!acceptUrl, { links: links.slice(0, 3) });

    if (acceptUrl) {
      await page.goto(acceptUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(5000); // hydration before form interaction
      await page.locator('#password').fill(vendorPw);
      await page.locator('#confirm').fill(vendorPw);
      await shot('03-accept');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(4000);
      const actOk = await page.locator('text=Account activated').count();
      await shot('04-activated');
      check('invitation accepted via UI', actOk > 0, { actOk });
    }

    // ── 4. Vendor login → redirect to /vendor ────────────────────────────
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000); // allow React hydration before submit
    await page.locator('input[name="email"], input[type="email"]').first().fill(vendorEmail);
    await page.locator('input[type="password"]').first().fill(vendorPw);
    await page.locator('button:has-text("Sign In"), button:has-text("Sign in"), button:has-text("Log in")').first().click();
    await page.waitForURL(/\/vendor/, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3500);
    await shot('05-vendor-dashboard');
    check('vendor login redirects to /vendor', /\/vendor/.test(page.url()), { url: page.url() });
    const dashText = await page.locator('body').innerText();
    check('dashboard shows profile + approved status', /Vendor portal/i.test(dashText) && /Approved/i.test(dashText), {});

    // ── 5. Availability update via UI ────────────────────────────────────
    await page.locator('#location').fill('Accra Central');
    // select availability
    await page.locator('[role="combobox"]').first().click();
    await page.locator('[role="option"]:has-text("Available")').first().click();
    await page.locator('button:has-text("Update availability")').click();
    await page.waitForTimeout(2500);
    const availOk = await page.locator('text=Availability updated').count();
    check('availability update via UI', availOk > 0, { availOk });
    await shot('06-availability');

    // ── 6. Tenant books vendor → vendor sees + accepts in UI ─────────────
    const bk = await api('POST', `/vendors/${tidB}/bookings`, tokB, {
      vendor_id: vid, pickup_address: 'Tema Port Gate 1', delivery_address: 'Spintex Road Warehouse',
      vehicle_type_requested: 'truck', notes: 'P27 browser test booking',
    });
    check('tenant creates booking for vendor', bk.status === 200, { status: bk.status, id: bk.data?.id });

    await page.goto(`${BASE}/vendor/bookings`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3500);
    await shot('07-bookings');
    const bkText = await page.locator('body').innerText();
    const seesBooking = /Tema Port Gate 1/i.test(bkText);
    check('vendor sees booking in portal', seesBooking, {});
    if (seesBooking) {
      await page.getByRole('button', { name: 'Accept', exact: true }).click();
      await page.waitForTimeout(1500);
      await shot('08-accept-dialog');
      await page.getByRole('button', { name: 'Accept booking', exact: true }).click();
      await page.waitForTimeout(3000);
      const afterText = await page.locator('body').innerText();
      check('vendor accepts booking via UI', /accepted/i.test(afterText), {});
      await shot('09-accepted');
    }

    // ── 7. Documents page renders + vendor-safe fields ───────────────────
    await page.goto(`${BASE}/vendor/documents`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const docText = await page.locator('body').innerText();
    check('documents page renders upload slots', /Verification documents/i.test(docText) && /ID — front/i.test(docText), {});
    await shot('10-documents');

    // vendor serializer: booked_by must NOT appear anywhere in /me/bookings API
    const meB = await api('GET', '/vendors/me/bookings', await (async () => {
      const l = await api('POST', '/auth/login', null, { email: vendorEmail, password: vendorPw });
      return l.data.access_token;
    })());
    const leaksPII = (meB.data.items || []).some(b => b.booked_by);
    check('vendor booking view excludes booked_by PII', meB.status === 200 && !leaksPII, { count: meB.data.items?.length });

  } catch (e) {
    console.error('JOURNEY ERROR:', e.message);
    await shot('99-error');
    results.push({ name: 'journey completed without exception', ok: false, detail: e.message });
  } finally {
    const pass = results.filter(r => r.ok).length, fail = results.filter(r => !r.ok).length;
    fs.writeFileSync('./p27-results.json', JSON.stringify({ pass, fail, vendorEmail, results }, null, 2));
    console.log(`\n${pass} PASS, ${fail} FAIL`);
    await browser.close();
    process.exit(fail ? 1 : 0);
  }
})();
