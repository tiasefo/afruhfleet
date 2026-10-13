// P30 — R2 CRM tenant-isolation certification.
// Direct object-ID negatives (GET/PATCH/DELETE/activities), list isolation,
// unowned-row invisibility (tenant + superuser), Sentinel surface check.
const fs = require('fs');
const API = 'https://api.afruheritage.com/api/v1';
const state = JSON.parse(fs.readFileSync('./state.json', 'utf8'));

const results = [];
const check = (n, ok, d) => { results.push({ n, ok, d }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? ' — ' + JSON.stringify(d).slice(0, 170) : ''}`); };

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
  const la = await api('POST', '/auth/login', null, { email: state.tenantA.email, password: state.tenantA.password });
  const tokA = la.data.access_token;
  const lb = await api('POST', '/auth/login', null, { email: state.tenantB.email, password: state.tenantB.password });
  const tokB = lb.data.access_token;
  check('tenant A + B authenticated', !!(tokA && tokB), { a: la.status, b: lb.status });

  // A creates a customer + activity
  const cust = await api('POST', '/crm/customers', tokA, { name: 'P30 TenantA Secret', email: 'p30a@example.com', stage: 'lead' });
  const cid = cust.data.id;
  check('A creates customer', cust.status === 200 || cust.status === 201, { status: cust.status });
  const act = await api('POST', `/crm/customers/${cid}/activities`, tokA, { activity_type: 'note', summary: 'P30 confidential note', details: 'tenant A only' });
  check('A creates activity', act.status === 200 || act.status === 201, { status: act.status });

  // ── B tries every direct object-ID operation on A's customer ────────
  const g = await api('GET', `/crm/customers/${cid}`, tokB);
  check('B cannot GET A\'s customer by UUID', g.status === 404, { status: g.status });
  const p1 = await api('PATCH', `/crm/customers/${cid}/stage?stage=closed_won`, tokB);
  check('B cannot PATCH A\'s customer stage', p1.status === 404, { status: p1.status });
  const p2 = await api('PATCH', `/crm/customers/${cid}/owner?owner=attacker`, tokB);
  check('B cannot PATCH A\'s customer owner', p2.status === 404, { status: p2.status });
  const conv = await api('POST', `/crm/customers/${cid}/convert`, tokB);
  check('B cannot POST convert on A\'s customer', conv.status === 404, { status: conv.status });
  const d = await api('DELETE', `/crm/customers/${cid}`, tokB);
  check('B cannot DELETE A\'s customer', d.status === 404, { status: d.status });
  const ga = await api('GET', `/crm/customers/${cid}/activities`, tokB);
  check('B cannot GET A\'s activities', ga.status === 404, { status: ga.status });
  const pa = await api('POST', `/crm/customers/${cid}/activities`, tokB, { activity_type: 'note', summary: 'injected' });
  check('B cannot POST activity on A\'s customer', pa.status === 404, { status: pa.status });

  // ── List isolation ──────────────────────────────────────────────────
  const listB = await api('GET', '/crm/customers', tokB);
  const leaked = (Array.isArray(listB.data) ? listB.data : []).some(c => c.id === cid || /P30 TenantA Secret/i.test(c.name || ''));
  check('B list contains no A records', listB.status === 200 && !leaked, { count: listB.data?.length });

  // ── Unowned legacy rows invisible ───────────────────────────────────
  // the three pre-migration NULL-tenant test rows:
  const orphans = ['351558f8-bf64-4c22-9a43-7666c35fe9b3', '3a740e86-a6da-49d5-9fde-e71c28aeebc0', '9a85191b-8dbe-464d-b26a-7270d3e546a6'];
  const gOrphan = await api('GET', `/crm/customers/${orphans[0]}`, tokB);
  check('tenant cannot fetch unowned legacy row by UUID', gOrphan.status === 404, { status: gOrphan.status });
  const orphanInList = (Array.isArray(listB.data) ? listB.data : []).some(c => orphans.includes(c.id));
  check('tenant list excludes unowned legacy rows', !orphanInList, {});

  // superuser (tenant-less) must NOT see unowned rows either
  const su = await api('POST', '/auth/login', null, { email: 'admin@afruheritage.com', password: process.env.ADMIN_PW });
  const tokSU = process.env.CP_TOKEN || su.data.access_token;
  const suList = await api('GET', '/crm/customers', tokSU);
  const suOrphan = (Array.isArray(suList.data) ? suList.data : []).filter(c => orphans.includes(c.id));
  const suSeesOwned = (Array.isArray(suList.data) ? suList.data : []).some(c => c.id === cid);
  check('superuser sees owned cross-tenant rows (ops surface)', suList.status === 200 && suSeesOwned, { status: suList.status });
  check('superuser list excludes unowned legacy rows', suOrphan.length === 0, { found: suOrphan.length });
  const suOrphanGet = await api('GET', `/crm/customers/${orphans[0]}`, tokSU);
  check('superuser cannot fetch unowned row by UUID', suOrphanGet.status === 404, { status: suOrphanGet.status });

  // ── Sentinel surface: no CRM proxy route exists ─────────────────────
  const sTk = await fetch('https://admin.afruheritage.com/sentinel/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'uat-sentinel@afruheritage.com', password: 'SentinelUat!2026' }) }).then(r => r.json());
  const sRes = await fetch('https://admin.afruheritage.com/sentinel/crm/customers', { headers: { Authorization: `Bearer ${sTk.access_token}`, 'X-CP-Token': tokSU } });
  const sText = await sRes.text();
  let sJson = null; try { sJson = JSON.parse(sText); } catch {}
  // the 200 HTML SPA shell is the static frontend catch-all, not a CRM proxy
  const leaksCrm = sJson && (Array.isArray(sJson) || Array.isArray(sJson.items) || Array.isArray(sJson.customers));
  check('sentinel has no un-audited CRM proxy surface', !leaksCrm, { status: sRes.status, ctype: sRes.headers.get('content-type') });

  // ── A's own access still works ──────────────────────────────────────
  const selfGet = await api('GET', `/crm/customers/${cid}`, tokA);
  const selfActs = await api('GET', `/crm/customers/${cid}/activities`, tokA);
  check('A reads own customer + activities', selfGet.status === 200 && (selfActs.data || []).length > 0, {});
  // cleanup: delete A's test customer
  const del = await api('DELETE', `/crm/customers/${cid}`, tokA);
  check('cleanup: A deletes own customer', del.status === 200 || del.status === 204, { status: del.status });

  const pass = results.filter(r => r.ok).length;
  fs.writeFileSync('./p30-results.json', JSON.stringify({ pass, fail: results.length - pass, results }, null, 2));
  console.log(`\n${pass} PASS, ${results.length - pass} FAIL`);
  process.exit(results.length - pass ? 1 : 0);
})();
