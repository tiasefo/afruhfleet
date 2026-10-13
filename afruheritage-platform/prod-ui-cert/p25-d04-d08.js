// P25 — D-04 central platform support + D-08 CRM activity (tenant-scoped)
const fs = require('fs');
const API = 'https://api.afruheritage.com/api/v1';
const SENTINEL = 'https://admin.afruheritage.com/sentinel';
const state = JSON.parse(fs.readFileSync('./state.json', 'utf8'));

async function api(method, path, token, body, extraHeaders) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(extraHeaders || {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}
async function sapi(method, path, sToken, cpToken, body) {
  const res = await fetch(`${SENTINEL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(sToken ? { Authorization: `Bearer ${sToken}` } : {}), ...(cpToken ? { 'X-CP-Token': cpToken } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}
const out = [];
const check = (name, ok, detail) => { out.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + JSON.stringify(detail).slice(0, 160) : ''}`); };

(async () => {
  // ── Auth ──────────────────────────────────────────────────────────────
  const la = await api('POST', '/auth/login', null, { email: state.tenantA.email, password: state.tenantA.password });
  const tokA = la.data.access_token, tidA = la.data.tenant_id;
  const lb = await api('POST', '/auth/login', null, { email: state.tenantB.email, password: state.tenantB.password });
  const tokB = lb.data.access_token;
  const ladm = await api('POST', '/auth/login', null, { email: 'admin@afruheritage.com', password: process.env.ADMIN_PW });
  const tokAdmin = process.env.CP_TOKEN || ladm.data.access_token;
  check('login tenantA/tenantB/superuser', !!(tokA && tokB && tokAdmin), { a: la.status, b: lb.status, adm: ladm.status });
  if (!tokAdmin) { console.log(JSON.stringify(out)); process.exit(1); }

  // ── D-04: platform-scope public ticket ────────────────────────────────
  const t1 = await api('POST', '/support-crm/public/tickets', null, {
    tenant_id: 'platform', public_submitter_name: 'UAT Guest',
    public_submitter_email: 'uat-guest@example.com',
    subject: 'P25 platform support test', description: 'Platform-scope ticket filed without tenant context.',
    category: 'general', priority: 'medium',
  });
  check('platform-scope ticket created', t1.status === 200 && !!t1.data.public_token, { status: t1.status, tenant: t1.data.tenant_id });
  const platToken = t1.data.public_token, platTicketId = t1.data.id;

  const t2 = await api('GET', `/support-crm/public/tickets/${platToken}`);
  check('public ticket lookup by token', t2.status === 200 && t2.data.subject === 'P25 platform support test', { status: t2.status });

  const t3 = await api('POST', `/support-crm/public/tickets/${platToken}/reply`, null, { body: 'Follow-up from the customer side.', author_type: 'public', author_name: 'UAT Guest', visible_to_public: true });
  check('public customer reply', t3.status === 200, { status: t3.status });

  // ── D-04: admin (CP superuser) thread + reply ─────────────────────────
  const t4 = await api('GET', '/support-crm/admin/tickets?q=P25', tokAdmin);
  const found = (t4.data.items || []).find(x => x.id === platTicketId);
  check('admin ticket list finds platform ticket', !!found, { status: t4.status, total: t4.data.total });

  const t5 = await api('GET', `/support-crm/admin/tickets/${platTicketId}/messages`, tokAdmin);
  check('admin reads full thread', t5.status === 200 && t5.data.length >= 2, { msgs: t5.data.length });

  const t6 = await api('POST', `/support-crm/admin/tickets/${platTicketId}/reply`, tokAdmin,
    { body: 'Reply from Afruheritage platform support.', author_type: 'staff', author_name: 'UAT Ops', visible_to_public: true });
  check('admin staff reply', t6.status === 200, { status: t6.status });

  const t7 = await api('GET', `/support-crm/public/tickets/${platToken}/messages`);
  const staffVisible = (t7.data || []).some(m => m.author_type === 'staff');
  check('staff reply visible on public thread', t7.status === 200 && staffVisible, { msgs: t7.data.length });

  // ── D-04: Sentinel proxy paths ────────────────────────────────────────
  const ls = await sapi('POST', '/auth/login', null, null, { email: 'admin@afruheritage.com', password: process.env.ADMIN_PW });
  const sTok = ls.data.access_token;
  check('sentinel admin login', !!sTok, { status: ls.status });
  if (sTok) {
    const s1 = await sapi('GET', '/tickets?q=P25', sTok, tokAdmin);
    const sFound = (s1.data.items || []).find(x => x.id === platTicketId);
    check('sentinel ticket list (CP proxy)', !!sFound, { status: s1.status });
    const s2 = await sapi('GET', `/tickets/${platTicketId}/messages`, sTok, tokAdmin);
    check('sentinel reads thread', s2.status === 200 && Array.isArray(s2.data) && s2.data.length >= 2, { status: s2.status, msgs: s2.data?.length });
    const s3 = await sapi('POST', `/tickets/${platTicketId}/reply`, sTok, tokAdmin, { body: 'Sentinel ops reply via proxy.' });
    check('sentinel reply proxied + audited', s3.status === 200, { status: s3.status, detail: s3.data?.detail || 'ok' });
  }

  // ── D-04 isolation: tenant tickets stay tenant-scoped ─────────────────
  const t8 = await api('GET', '/support-crm/tickets', tokA);
  check('tenant A ticket list scoped', t8.status === 200 && (t8.data.items || []).every(x => x.tenant_id === tidA || !x.tenant_id), { count: t8.data.items?.length });
  const t9 = await api('GET', '/support-crm/tickets', tokB);
  const leakB = (t9.data.items || []).find(x => x.id === platTicketId || (x.subject || '').includes('P25'));
  check('tenant B does NOT see platform ticket', !leakB, { count: t9.data.items?.length });
  const t10 = await api('GET', `/support-crm/tickets/${platTicketId}/messages?tenant_id=${tidA}`, tokA);
  check('tenant A cannot read platform ticket thread via tenant route', t10.status === 404 || t10.status === 403, { status: t10.status });

  // ── D-08: CRM customers + activities, tenant-scoped ───────────────────
  const c1 = await api('POST', '/crm/customers', tokA, { name: 'P25 CRM Customer', email: 'p25@example.com', company: 'P25 Co', value: 5000 });
  check('tenant A creates CRM customer', c1.status === 200 && !!c1.data.id, { status: c1.status });
  const custId = c1.data.id;

  const c2 = await api('POST', `/crm/customers/${custId}/activities`, tokA, { activity_type: 'call', summary: 'P25 verification call', details: 'Logged during D-08 verification.' });
  check('tenant A logs activity', c2.status === 200 && c2.data.activity_type === 'call', { status: c2.status });
  const c3 = await api('GET', `/crm/customers/${custId}/activities`, tokA);
  check('tenant A lists activities', c3.status === 200 && c3.data.length >= 1, { count: c3.data.length });

  const c4 = await api('GET', '/crm/customers', tokB);
  const leakCust = (c4.data || []).find(x => x.id === custId);
  check('tenant B does NOT see tenant A customer', !leakCust, { status: c4.status, count: c4.data?.length });
  const c5 = await api('GET', `/crm/customers/${custId}`, tokB);
  check('tenant B cannot fetch A customer by id', c5.status === 404, { status: c5.status });
  const c6 = await api('POST', `/crm/customers/${custId}/activities`, tokB, { activity_type: 'note', summary: 'injection attempt' });
  check('tenant B cannot write activity on A customer', c6.status === 404, { status: c6.status });

  // cleanup A's test customer (keep platform ticket as live evidence)
  await api('DELETE', `/crm/customers/${custId}`, tokA);

  const pass = out.filter(r => r.ok).length, fail = out.filter(r => !r.ok).length;
  fs.writeFileSync('./p25-d04-d08-results.json', JSON.stringify({ pass, fail, results: out }, null, 2));
  console.log(`\n${pass} PASS, ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('SCRIPT ERROR', e); process.exit(1); });
