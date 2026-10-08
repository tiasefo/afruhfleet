// Focused retest: TEAM-03 (invitee lands in inviter's workspace after
// accept+password-set) and TEAM-04 (restricted member denied admin surfaces
// while AUTHENTICATED). The invitee account already completed acceptance.
const { BASE, Session, loadState, uiLogin } = require('./harness');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const st = loadState();
  const boxI = st.mailboxes.invitee;
  const PW_EMP = 'UatCertEmp!2026B';
  const S = await new Session('TEAMACC5', { video: true }).start();
  const page = S.page;

  await S.jcase({ id: 'TEAM-03', domain: 'TEAM/RBAC', capability: 'Invitee accepts invitation and reaches business workspace', persona: 'INVITED NEW USER', startUrl: 'invite -> reset-password -> login', expected: 'Invitee lands inside UATCERT Meridian workspace (not onboarding wizard)', coreDep: 'YES' }, async (page, h) => {
    await uiLogin(page, boxI.address, PW_EMP);
    await sleep(4000);
    const u = page.url(); const t = await S.text(); await h.shot('invitee-landing');
    h.step(`Invitee landed: ${u}`);
    const onWizard = /onboarding/.test(u) || (/your role/i.test(t) && /dashboard/i.test(t) === false);
    const inWorkspace = /dashboard|shipment|members|billing/i.test(u) || (/dashboard|products|shipments/i.test(t) && /sign out/i.test(t));
    if (onWizard) return h.fail(`Invitee pushed to platform onboarding wizard instead of inviter workspace. url=${u}`, { classification: 'PRODUCT_DEFECT', defectRef: 'DEF-TEAM-03' });
    if (inWorkspace) return h.pass(`Invitee inside tenant workspace at ${u}`, { notes: t.slice(0, 250) });
    return h.fail(`Invitee landing unclear. url=${u} text="${t.slice(0, 250)}"`, { classification: 'UNCLASSIFIED' });
  });

  await S.jcase({ id: 'TEAM-04', domain: 'TEAM/RBAC', capability: 'Invited (non-admin) user denied admin capabilities', persona: 'INVITED NEW USER', startUrl: 'invitee session', expected: 'Restricted member cannot change billing/settings/team', coreDep: 'YES' }, async (page, h) => {
    const results = [];
    for (const [slug, name] of [['/billing', 'Billing'], ['/settings', 'Settings'], ['/members', 'Team admin']]) {
      await page.goto(BASE + slug, { waitUntil: 'domcontentloaded' }); await sleep(4000);
      const t = await S.text(); const u = page.url();
      const denied = /forbidden|denied|not authorized|permission|access denied|404|not found/i.test(t) || /login/.test(u);
      const canMutate = /(select plan|add funds|invite|add member|save changes|cancel subscription|danger zone)/i.test(t);
      results.push(`${name}: denied=${denied} canMutate=${canMutate} url=${u}`);
      console.log(`    rbac ${slug}: denied=${denied} canMutate=${canMutate} url=${u}`);
      if (slug === '/billing') await h.shot('billing-as-invitee');
    }
    const anyDenied = results.some(r => /denied=true/.test(r));
    const anyMutate = results.some(r => /canMutate=true/.test(r));
    if (anyMutate) return h.fail(`Invitee can reach admin controls. ${results.join(' | ')}`, { classification: 'BACKEND_DEFECT', defectRef: 'DEF-RBAC-01' });
    if (anyDenied) return h.pass(`Restricted access enforced while authenticated. ${results.join(' | ')}`);
    return h.fail(`Restricted enforcement unclear. ${results.join(' | ')}`, { classification: 'UNCLASSIFIED', defectRef: 'DEF-RBAC-02' });
  });

  await S.finish();
  console.log('done');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
