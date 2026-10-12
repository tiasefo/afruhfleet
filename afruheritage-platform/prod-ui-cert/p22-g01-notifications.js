// P22 — G-01 verification: transition-path notification + D-03 dual recipients
// + tenant-scope guard (isolation) — real API + real mailbox (mail.tm).
const fs = require('fs');
const { createMailbox, waitForMessage, extractLinks } = require('./mailbox');

const API = 'https://api.afruheritage.com/api/v1';
const state = JSON.parse(fs.readFileSync('./state.json', 'utf8'));

const TENANT_B = { email: state.tenantB.email, password: state.tenantB.password };
const TENANT_A = { email: state.tenantA.email, password: state.tenantA.password };
const TENANT_B_BOX = state.mailboxes.tenantB;

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

function log(...a) { console.log('[P22]', ...a); }

(async () => {
  const results = [];
  const t0 = Date.now();

  // 1. Fresh receiver mailbox
  const recv = await createMailbox('g01recv');
  log('receiver mailbox:', recv.address);
  results.push({ step: 'receiver mailbox', ok: true });

  // 2. Login tenant B (shipment owner) and tenant A (isolation attacker)
  const lb = await api('POST', '/auth/login', null, TENANT_B);
  const la = await api('POST', '/auth/login', null, TENANT_A);
  if (lb.status !== 200 || la.status !== 200) { log('login failed', lb.status, la.status); process.exit(1); }
  const tokB = lb.data.access_token, tidB = lb.data.tenant_id;
  const tokA = la.data.access_token;
  log('tenantB id:', tidB);

  // 3. Create shipment with receiver_email
  const create = await api('POST', `/shipments/${tidB}`, tokB, {
    sender_name: 'P22 Sender', sender_address: '1 Accra Rd',
    receiver_name: 'P22 Receiver', receiver_address: '2 Kumasi St',
    receiver_email: recv.address,
    origin_country: 'Ghana', origin_city: 'Accra',
    destination_country: 'Ghana', destination_city: 'Kumasi',
    package_count: 1, weight_kg: 2, total_cost: 10,
  });
  if (create.status >= 400) { log('create failed', create.status, JSON.stringify(create.data).slice(0,300)); process.exit(1); }
  const ship = create.data;
  log('shipment:', ship.tracking_number, ship.id, 'receiver_email=', ship.receiver_email);
  results.push({ step: 'create shipment w/ receiver_email', ok: !!ship.receiver_email, tracking: ship.tracking_number });

  // 4. Isolation: tenant A attempts transition on tenant B's path
  const iso = await api('POST', `/shipments/${tidB}/${ship.id}/transition?status=in_transit`, tokA);
  results.push({ step: 'cross-tenant transition blocked', ok: iso.status === 403, got: iso.status });
  log('isolation status:', iso.status, JSON.stringify(iso.data).slice(0,150));

  // 5. Valid transition by owner tenant
  const tr = await api('POST', `/shipments/${tidB}/${ship.id}/transition?status=in_transit`, tokB);
  results.push({ step: 'owner transition', ok: tr.status === 200, got: tr.status });
  log('transition:', tr.status, tr.data && tr.data.status);

  // 6. Wait for BOTH notification emails
  const subjectRe = new RegExp(ship.tracking_number.replace(/[-]/g, '\\-'), 'i');
  const msgRecv = await waitForMessage(recv, { subjectRe, timeoutMs: 180000, sinceMs: t0 });
  results.push({ step: 'receiver email delivered', ok: !!msgRecv, subject: msgRecv && msgRecv.subject });
  const msgTenant = await waitForMessage(TENANT_B_BOX, { subjectRe, timeoutMs: 180000, sinceMs: t0 });
  results.push({ step: 'tenant email delivered', ok: !!msgTenant, subject: msgTenant && msgTenant.subject });

  // 7. Track link correctness in receiver mail
  if (msgRecv) {
    const links = extractLinks(msgRecv);
    log('links in receiver email:', links);
    results.push({ step: 'email contains public track link', ok: links.some(u => /track\?tracking_number=/.test(u)), links });
  }

  // 8. Malformed ID: transition on a garbage shipment id -> must be controlled (400/404), never 500
  const bad = await api('POST', `/shipments/${tidB}/not-a-uuid/transition?status=in_transit`, tokB);
  results.push({ step: 'malformed shipment id controlled', ok: [400,404,422].includes(bad.status), got: bad.status });
  log('malformed id:', bad.status);

  fs.writeFileSync('./p22-g01-results.json', JSON.stringify({ ts: new Date().toISOString(), ship: ship.tracking_number, recvBox: recv.address, results }, null, 2));
  const fails = results.filter(r => !r.ok);
  console.log('\n=== P22 RESULTS ===');
  results.forEach(r => console.log(r.ok ? 'PASS' : 'FAIL', '-', r.step, JSON.stringify(r.got ?? r.subject ?? '')));
  console.log(fails.length ? `${fails.length} FAILURES` : 'ALL PASS');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('P22 error', e); process.exit(2); });
