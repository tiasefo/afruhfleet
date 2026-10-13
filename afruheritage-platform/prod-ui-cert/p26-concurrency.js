// P26 — concurrent identical shipment-event submissions:
// N parallel POSTs of the SAME event payload must persist exactly ONE event
// row and produce at most one notification.
const fs = require('fs');
const { createMailbox, listMessages } = require('./mailbox');
const API = 'https://api.afruheritage.com/api/v1';
const state = JSON.parse(fs.readFileSync('./state.json', 'utf8'));

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

const N = 8;

(async () => {
  const results = [];
  const check = (name, ok, detail) => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} — ${JSON.stringify(detail).slice(0, 200)}`); };

  const lb = await api('POST', '/auth/login', null, { email: state.tenantB.email, password: state.tenantB.password });
  const tokB = lb.data.access_token, tidB = lb.data.tenant_id;

  // Fresh shipment for the race test
  const recv = await createMailbox('p26recv');
  const sh = await api('POST', `/shipments/${tidB}`, tokB, {
    receiver_name: 'P26 Race Receiver', receiver_address: 'Accra', receiver_email: recv.address,
    sender_name: 'P26 Sender', sender_address: 'Tema',
  });
  const shipId = sh.data.id;
  check('shipment created', sh.status === 200 && !!shipId, { status: sh.status, id: shipId });

  const t0 = new Date();

  // Fire N concurrent identical event submissions
  const payload = { event_type: 'in_transit', location: 'RacePoint', description: 'P26 concurrent dedup test' };
  const responses = await Promise.all(
    Array.from({ length: N }, () => api('POST', `/shipments/${tidB}/${shipId}/events`, tokB, payload))
  );
  const statuses = responses.map(r => r.status);
  const eventIds = responses.map(r => r.data?.id).filter(Boolean);
  const uniqueIds = [...new Set(eventIds)];
  check(`${N} concurrent identical event submissions all 2xx`, statuses.every(s => s === 200 || s === 201), statuses);
  check('all responses return the SAME event id', uniqueIds.length === 1, { unique: uniqueIds.length, ids: uniqueIds.slice(0, 3) });

  // Persisted rows: exactly one for that dedup signature
  const ev = await api('GET', `/shipments/${tidB}/${shipId}/events`, tokB);
  const matching = (ev.data || []).filter(e => e.description === 'P26 concurrent dedup test');
  check('exactly one persisted event row', matching.length === 1, { rows: matching.length });

  // Notifications: one per recipient max (receiver + tenant)
  await new Promise(r => setTimeout(r, 6000));
  const recvCount = (await listMessages(recv)).filter(m => /in.transit|update/i.test(m.subject || '') && new Date(m.createdAt || m.created_at) >= t0).length;
  const boxB = state.mailboxes.tenantB;
  const tenantCount = (await listMessages(boxB)).filter(m => /in.transit|update/i.test(m.subject || '') && new Date(m.createdAt || m.created_at) >= t0).length;
  check('receiver got ≤1 notification for the raced event', recvCount <= 1, { recvCount });
  check('tenant got ≤1 notification for the raced event', tenantCount <= 1, { tenantCount });

  const pass = results.filter(r => r.ok).length, fail = results.filter(r => !r.ok).length;
  fs.writeFileSync('./p26-concurrency-results.json', JSON.stringify({ pass, fail, results }, null, 2));
  console.log(`\n${pass} PASS, ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('SCRIPT ERROR', e); process.exit(1); });
