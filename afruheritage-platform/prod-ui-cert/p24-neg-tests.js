// P24 — PO-required negative tests:
//  T1 notification dedup (no-op transition, repeat event, real change)
//  T3 recipient isolation (tenant B shipment must never email tenant A)
const fs = require('fs');
const { createMailbox, listMessages, waitForMessage } = require('./mailbox');

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
const count = async (box, re, since) =>
  (await listMessages(box)).filter(m => re.test(m.subject || '') && new Date(m.createdAt || m.created_at) >= since).length;

(async () => {
  const results = [];
  const t0 = new Date();
  const recv = await createMailbox('p24recv');
  console.log('[P24] receiver:', recv.address);

  const lb = await api('POST', '/auth/login', null, { email: state.tenantB.email, password: state.tenantB.password });
  const tokB = lb.data.access_token, tidB = lb.data.tenant_id;
  const boxB = state.mailboxes.tenantB, boxA = state.mailboxes.tenantA;

  const c = await api('POST', `/shipments/${tidB}`, tokB, {
    sender_name: 'P24 Sender', sender_address: 'A',
    receiver_name: 'P24 Receiver', receiver_address: 'B', receiver_email: recv.address,
    origin_country: 'Ghana', origin_city: 'Accra', destination_country: 'Ghana', destination_city: 'Kumasi',
    package_count: 1, weight_kg: 1, total_cost: 5,
  });
  const ship = c.data; const tn = ship.tracking_number;
  const re = new RegExp(tn.replace(/-/g, '\\-'), 'i');
  console.log('[P24] shipment:', tn);

  // T1a: real transition -> +1 email to each recipient
  await api('POST', `/shipments/${tidB}/${ship.id}/transition?status=picked_up`, tokB);
  await waitForMessage(recv, { subjectRe: re, timeoutMs: 180000, sinceMs: t0 });
  const r1 = await count(recv, re, t0), b1 = await count(boxB, re, t0), a1 = await count(boxA, re, t0);
  results.push({ t: 'transition -> 1 email to receiver', ok: r1 === 1, got: r1 });
  results.push({ t: 'transition -> 1 email to tenant', ok: b1 === 1, got: b1 });
  results.push({ t: 'tenant A got 0 (isolation)', ok: a1 === 0, got: a1 });

  // T1b: no-op transition (same status, retry) -> NO new email
  await api('POST', `/shipments/${tidB}/${ship.id}/transition?status=picked_up`, tokB);
  await new Promise(r => setTimeout(r, 15000));
  const r2 = await count(recv, re, t0), b2 = await count(boxB, re, t0);
  results.push({ t: 'no-op transition -> no duplicate (receiver)', ok: r2 === 1, got: r2 });
  results.push({ t: 'no-op transition -> no duplicate (tenant)', ok: b2 === 1, got: b2 });

  // T1c: event repeating current status -> NO new email
  await api('POST', `/shipments/${tidB}/${ship.id}/events`, tokB, { event_type: 'picked_up', location: 'Accra' });
  await new Promise(r => setTimeout(r, 15000));
  const r3 = await count(recv, re, t0), b3 = await count(boxB, re, t0);
  results.push({ t: 'repeat-status event -> no duplicate (receiver)', ok: r3 === 1, got: r3 });
  results.push({ t: 'repeat-status event -> no duplicate (tenant)', ok: b3 === 1, got: b3 });

  // T1d: real event change -> +1 email
  await api('POST', `/shipments/${tidB}/${ship.id}/events`, tokB, { event_type: 'in_transit', location: 'Nsawam' });
  await waitForMessage(recv, { subjectRe: re, timeoutMs: 120000, sinceMs: t0 });
  await new Promise(r => setTimeout(r, 10000));
  const r4 = await count(recv, re, t0), b4 = await count(boxB, re, t0);
  results.push({ t: 'real event change -> 2 total (receiver)', ok: r4 === 2, got: r4 });
  results.push({ t: 'real event change -> 2 total (tenant)', ok: b4 === 2, got: b4 });

  // T3b: final isolation sweep — tenant A still zero
  const aF = await count(boxA, re, t0);
  results.push({ t: 'tenant A mailbox still zero after all events', ok: aF === 0, got: aF });

  fs.writeFileSync('./p24-neg-results.json', JSON.stringify({ ts: t0, tn, recv: recv.address, results }, null, 2));
  console.log('\n=== P24 RESULTS ===');
  results.forEach(r => console.log(r.ok ? 'PASS' : 'FAIL', '-', r.t, r.got));
  process.exit(results.some(r => !r.ok) ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
