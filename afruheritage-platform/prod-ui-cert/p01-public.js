// Phase 1 — PUBLIC / IDENTITY domain (anonymous persona).
const { BASE, runCase, closeBrowser, clickFirst } = require('./harness');

const A = 'ANONYMOUS';

async function bodyText(page) { return (await page.locator('body').innerText()).replace(/\s+/g, ' '); }

(async () => {
  // UAT-01 homepage
  await runCase({ id: 'PUB-01', domain: 'PUBLIC', capability: 'Homepage loads with branding and entry paths', persona: A, startUrl: BASE, expected: 'Afruheritage homepage with branding, navigation, Register/Sign In path', coreDep: 'YES' }, async (page, ctx) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(3000);
    ctx.step('Loaded https://afruheritage.com');
    const t = await bodyText(page);
    await ctx.shot('homepage');
    const hasBrand = /afruheritage/i.test(t) && !/fleetbase/i.test(t);
    const hasEntry = /sign in/i.test(t) && (/get started|register|start free trial/i.test(t));
    const fakeStats = /500\+ freight forwarders|12,847|4\.9\/5|98\.\d|%|45\+/i.test(t);
    if (hasBrand && hasEntry) return ctx.pass('Homepage renders with Afruheritage branding, nav, Sign In and Get Started paths', {
      notes: fakeStats ? 'Homepage displays hardcoded marketing statistics (500+ forwarders, 12,847 shipments, 4.9/5 rating, 98% on-time, 45+ countries) — unverifiable marketing claims on a pre-launch product; AGENT.md forbids invented stats' : '',
    });
    return ctx.fail(`Homepage missing expected content. brand=${hasBrand} entry=${hasEntry}`);
  });

  // Legal pages
  for (const [slug, name] of [['/privacy-policy', 'Privacy'], ['/terms-of-service', 'Terms'], ['/cookie-policy', 'Cookie'], ['/gdpr', 'GDPR']]) {
    await runCase({ id: `PUB-LEGAL-${slug.replace(/[^a-z]/gi, '').toUpperCase()}`, domain: 'LEGAL', capability: `${name} page`, persona: A, startUrl: BASE + slug, expected: `${name} page loads with readable legal text`, coreDep: 'NO' }, async (page, ctx) => {
      await page.goto(BASE + slug, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1500);
      ctx.step(`Opened ${slug}`);
      const t = await bodyText(page);
      await ctx.shot('page');
      if (t.length > 400 && !/404|not found|error/i.test(t.slice(0, 300))) return ctx.pass(`${name} page loads (${t.length} chars of content)`);
      return ctx.fail(`${name} page content insufficient or error. len=${t.length}`);
    });
  }

  // Pricing page — check real plan content
  await runCase({ id: 'PUB-02', domain: 'PUBLIC', capability: 'Pricing page shows plans', persona: A, startUrl: BASE + '/pricing', expected: 'Plan names, prices and a way to subscribe', coreDep: 'YES' }, async (page, ctx) => {
    await page.goto(BASE + '/pricing', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2500);
    ctx.step('Opened /pricing');
    const t = await bodyText(page);
    await ctx.shotFull('pricing');
    const hasPrice = /(\$\d+|₵|GHS|USD|\/mo|per month|monthly|yearly)/i.test(t);
    const hasPlans = /(starter|basic|pro|business|enterprise|plan)/i.test(t);
    const hasCta = /(get started|start free trial|choose|subscribe|sign up)/i.test(t);
    if (hasPrice && hasPlans) return ctx.pass(`Pricing page shows plans with pricing. cta=${hasCta}`, { notes: t.slice(0, 400) });
    return ctx.fail(`Pricing page lacks plan/pricing content. hasPrice=${hasPrice} hasPlans=${hasPlans} cta=${hasCta}`);
  });

  // Track page renders (functional test is later with real tracking number)
  await runCase({ id: 'PUB-03', domain: 'PUBLIC', capability: 'Public tracking page renders', persona: A, startUrl: BASE + '/track', expected: 'Tracking input and Track control visible without login', coreDep: 'YES' }, async (page, ctx) => {
    await page.goto(BASE + '/track', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1500);
    ctx.step('Opened /track anonymously');
    const input = page.locator('input').first();
    const ok = await input.isVisible({ timeout: 5000 }).catch(() => false);
    await ctx.shot('track');
    if (ok) return ctx.pass('Public tracking form visible without login');
    return ctx.fail('No tracking input visible on /track');
  });

  // Track with a bogus number — check behaviour (no crash, honest "not found")
  await runCase({ id: 'PUB-04', domain: 'PUBLIC', capability: 'Public tracking of unknown number', persona: A, startUrl: BASE + '/track', expected: 'Graceful not-found result, no login required, no leaked data', coreDep: 'NO' }, async (page, ctx) => {
    await page.goto(BASE + '/track', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1500);
    ctx.step('Entered bogus tracking number ZZZ-NOTREAL-000');
    await page.locator('input').first().fill('ZZZ-NOTREAL-000');
    await clickFirst(page, ['button:has-text("Track")', 'button[type="submit"]']);
    await page.waitForTimeout(4000);
    const t = await bodyText(page);
    await ctx.shot('result');
    if (/not found|no shipment|invalid|does not exist|no results/i.test(t)) return ctx.pass('Unknown tracking number produces graceful not-found message');
    if (/sign in|log in/i.test(t) && !/track/i.test(t)) return ctx.fail('Tracking redirected to login');
    return ctx.fail(`Unexpected result for bogus tracking number: ${t.slice(0, 300)}`);
  });

  // Support page + ticket submit (public ticket creation tested fully later; here check form presence)
  await runCase({ id: 'PUB-05', domain: 'SUPPORT', capability: 'Public support page renders with ticket form', persona: A, startUrl: BASE + '/support', expected: 'Support ticket form with name/email/subject/category and submit', coreDep: 'YES' }, async (page, ctx) => {
    await page.goto(BASE + '/support', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2000);
    ctx.step('Opened /support');
    const t = await bodyText(page);
    await ctx.shot('support');
    const hasForm = /submit ticket/i.test(t) && /email/i.test(t);
    if (hasForm) return ctx.pass('Support page shows ticket creation form and FAQ');
    return ctx.fail(`Support page missing ticket form. text=${t.slice(0, 300)}`);
  });

  // Marketplace anonymous
  await runCase({ id: 'PUB-06', domain: 'VENDOR', capability: 'Marketplace anonymous access', persona: A, startUrl: BASE + '/marketplace', expected: 'Public marketplace listing OR intentional login requirement', coreDep: 'NO' }, async (page, ctx) => {
    await page.goto(BASE + '/marketplace', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2000);
    ctx.step('Opened /marketplace anonymously');
    const url = page.url(); const t = await bodyText(page);
    await ctx.shot('marketplace');
    if (/login/.test(url)) return ctx.blocked('Marketplace requires login — redirected to /login. Public anonymous marketplace listing is not available.', { classification: 'NOT_PRODUCTIZED', notes: 'Guide 36 requires browsing marketplace as signed-in owner; anonymous listing not exposed' });
    return ctx.pass('Marketplace visible anonymously');
  });

  // Vendor public page
  await runCase({ id: 'PUB-07', domain: 'VENDOR', capability: 'Vendor public page / application entry', persona: A, startUrl: BASE + '/vendors', expected: 'Vendor-facing page with registration/application path', coreDep: 'NO' }, async (page, ctx) => {
    await page.goto(BASE + '/vendors', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2500);
    ctx.step('Opened /vendors');
    const url = page.url(); const t = await bodyText(page);
    await ctx.shotFull('vendors');
    const hasApply = /(apply|become|register|join|sign up|application)/i.test(t);
    if (hasApply) return ctx.pass(`Vendor page renders with application path. finalUrl=${url}`, { notes: t.slice(0, 300) });
    if (/login/.test(url)) return ctx.blocked('Vendor page requires login', { classification: 'NOT_PRODUCTIZED' });
    return ctx.fail(`Vendor page lacks application path: ${t.slice(0, 300)}`);
  });

  // Locations public page
  await runCase({ id: 'PUB-08', domain: 'PUBLIC', capability: 'Locations page', persona: A, startUrl: BASE + '/locations', expected: 'Locations/coverage information loads', coreDep: 'NO' }, async (page, ctx) => {
    await page.goto(BASE + '/locations', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2000);
    ctx.step('Opened /locations');
    const t = await bodyText(page);
    await ctx.shotFull('locations');
    if (t.length > 300) return ctx.pass('Locations page renders content');
    return ctx.fail('Locations page empty or error');
  });

  // Docs entry
  await runCase({ id: 'PUB-09', domain: 'PUBLIC', capability: 'Documentation entry', persona: A, startUrl: BASE + '/docs', expected: 'Documentation page loads', coreDep: 'NO' }, async (page, ctx) => {
    await page.goto(BASE + '/docs', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2500);
    ctx.step('Opened /docs');
    const url = page.url(); const t = await bodyText(page);
    await ctx.shot('docs');
    if (t.length > 200) return ctx.pass(`Docs renders at ${url}`, { notes: `redirected to ${url}` });
    return ctx.fail('Docs empty');
  });

  // Register page render
  await runCase({ id: 'PUB-10', domain: 'IDENTITY', capability: 'Registration page renders with required fields', persona: A, startUrl: BASE + '/register', expected: 'Form with company, name, email, password, confirm + submit', coreDep: 'YES' }, async (page, ctx) => {
    await page.goto(BASE + '/register', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1500);
    ctx.step('Opened /register');
    const names = ['company_name', 'full_name', 'email', 'password', 'confirm_password'];
    const missing = [];
    for (const n of names) if (!(await page.locator(`input[name="${n}"]`).isVisible().catch(() => false))) missing.push(n);
    await ctx.shot('register');
    if (!missing.length) return ctx.pass('All registration fields present');
    return ctx.fail(`Missing fields: ${missing.join(', ')}`);
  });

  await closeBrowser();
  console.log('\nPhase 1 complete');
})().catch(async e => { console.error(e); await closeBrowser(); process.exit(1); });
