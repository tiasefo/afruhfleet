// RC-2: temporary-sender assessment — real delivery + header auth evidence
// for invitation, password reset, shipment notification, support reply.
const { createMailbox, waitForMessage, listMessages, readMessage, extractLinks } = require('./mailbox');
const fs = require('fs');
const { execSync } = require('child_process');
const API = 'https://api.afruheritage.com/api/v1';
const state = JSON.parse(fs.readFileSync('./state.json', 'utf8'));
const results = [];
const check = (n, ok, d) => { results.push({ n, ok: !!ok, d }); console.log((ok ? 'PASS' : 'FAIL') + '  ' + n, JSON.stringify(d || '').slice(0, 200)); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const api = async (m, p, t, b) => { const r = await fetch(API + p, { method: m, headers: { 'content-type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); let d; try { d = await r.json() } catch { d = await r.text() } return { status: r.status, data: d } };
async function headersOf(box, msgId) {
  const m = await readMessage(box, msgId);
  const res = await fetch('https://api.mail.tm' + m.sourceUrl, { headers: { Authorization: 'Bearer ' + box.token } });
  const j = await res.json();
  const data = j.data || '';
  const grab = re => (data.match(re) || [''])[0];
  return {
    from: grab(/From: ([^\r\n]+)/), returnPath: grab(/Return-Path: <([^>]+)>/),
    spf_arc: grab(/spf=(\w+)\s+smtp\.mailfrom=([^\s;]+)/) ? (data.match(/spf=(\w+)\s+smtp\.mailfrom=([^\s;]+)/) || []).slice(1) : null,
    dmarc_arc: grab(/dmarc=(\w+)\s+header\.from/) ? (data.match(/dmarc=(\w+)\s+header\.from/) || []).slice(1) : null,
    dkim_sig: /DKIM-Signature:/i.test(data),
    receiver_verif: m.verifications || null,
    received_from: grab(/Received: from ([^\r\n(]+)/),
  };
}
async function deliver(box, re, label, sinceMs) {
  const msg = await waitForMessage(box, { subjectRe: re, timeoutMs: 120000, sinceMs });
  if (!msg) { check(label + ' delivered', false, {}); return null; }
  const h = await headersOf(box, msg.id);
  check(label + ' delivered', true, { subject: msg.subject, from: h.from, spf_arc: h.spf_arc, dmarc_arc: h.dmarc_arc, dkim_sig: h.dkim_sig, receiver: h.receiver_verif });
  return msg;
}

(async () => {
  const since = Date.now() - 60000;
  // 1. support reply on a public ticket (existing uat ticket? use support-crm public path)
  const supBox = await createMailbox('rc2sup');
  const t = await api('POST', '/support-crm/public/tickets', null, { subject: 'RC2 support evidence ' + Date.now(), body: 'Ticket for email-header evidence', requester_email: supBox.address, requester_name: 'RC2 Tester' });
  check('support ticket created', t.status === 200 || t.status === 201, { status: t.status });
  const ticketToken = t.data?.public_token || t.data?.token;
  // staff reply -> requester email notification
  const adminLogin = await api('POST', '/auth/login', null, { email: 'admin@afruheritage.com', password: process.env.ADMIN_PW });
  if (adminLogin.data?.access_token && ticketToken) {
    const tickets = await api('GET', '/support-crm/admin/tickets', adminLogin.data.access_token);
    const tk = (tickets.data?.items || []).find(x => (x.subject || '').includes('RC2 support evidence'));
    if (tk) await api('POST', `/support-crm/admin/tickets/${tk.id}/reply`, adminLogin.data.access_token, { body: 'RC2 staff reply', author_type: 'staff', author_name: 'Ops', visible_to_public: true });
  }
  await deliver(supBox, /ticket|support|reply|RC2/i, 'support-notification', since);

  // 2. password reset
  const prBox = await createMailbox('rc2pw');
  // need an account on this mailbox first — register an individual
  const reg = await api('POST', '/auth/register', null, { email: prBox.address, password: 'Rc2Pass!2026', full_name: 'RC2 PW Tester', account_type: 'individual' });
  check('rc2 individual account created', reg.status === 200, { status: reg.status });
  const fr = await api('POST', '/auth/forgot-password', null, { email: prBox.address });
  check('forgot-password accepted', fr.status === 200, { status: fr.status });
  await deliver(prBox, /reset|password/i, 'password-reset', since);

  // 3. invitation (staff invite on tenant A)
  const invBox = await createMailbox('rc2inv');
  const la = await api('POST', '/auth/login', null, { email: state.tenantA.email, password: state.tenantA.password });
  const inv = await api('POST', '/team/invitations', la.data?.access_token, { email: invBox.address, full_name: 'RC2 Invitee', role: 'customer' });
  check('invitation sent', inv.status === 200 || inv.status === 201, { status: inv.status });
  await deliver(invBox, /invit|join/i, 'staff-invitation', since);

  // 4. shipment notification (new event on tenant A shipment)
  const la2 = await api('POST', '/auth/login', null, { email: state.tenantA.email, password: state.tenantA.password });
  const tid = la2.data?.tenant_id;
  const ships = await api('GET', `/shipments/${tid}`, la2.data?.access_token);
  const ship = (ships.data?.items || ships.data?.shipments || ships.data?.data || [])[0];
  if (ship) {
    await api('POST', `/shipments/${tid}/${ship.id}/events`, la2.data?.access_token, { event_type: 'status_update', description: 'RC2 header evidence ' + Date.now(), location: 'Accra' });
    const tenantABox = state.mailboxes?.tenantA;
    await deliver(tenantABox, /shipment|update|track/i, 'shipment-notification', since);
  } else check('tenant A shipment exists for notification', false, {});
  fs.writeFileSync('rc2-results.json', JSON.stringify(results, null, 2));
  const p = results.filter(r => r.ok).length;
  console.log(`\n${p} PASS, ${results.length - p} FAIL`);
})();
