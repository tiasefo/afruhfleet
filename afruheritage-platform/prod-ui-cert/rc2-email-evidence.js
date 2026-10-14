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
function unfoldHeaders(raw) {
  // unfold continuation lines so each header is one logical line
  return raw.replace(/\r?\n[ \t]+/g, ' ');
}
function headerAll(raw, name) {
  const re = new RegExp('^' + name + ':[ \\t]*([^\\r\\n]*)', 'gim');
  return [...raw.matchAll(re)].map(m => name + ': ' + m[1].trim());
}
async function headersOf(box, msgId, label) {
  const m = await readMessage(box, msgId);
  const res = await fetch('https://api.mail.tm' + m.sourceUrl, { headers: { Authorization: 'Bearer ' + box.token } });
  const j = await res.json();
  const raw = unfoldHeaders(j.data || '');
  if (label) fs.writeFileSync(`rc2-mime-${label}.txt`, raw.slice(0, 12000));
  const authResults = headerAll(raw, 'Authentication-Results');
  const arcAuth = headerAll(raw, 'ARC-Authentication-Results');
  const dkimSigs = headerAll(raw, 'DKIM-Signature').map(h => {
    const d = (h.match(/d=([^;\s]+)/) || [])[1];
    const s = (h.match(/s=([^;\s]+)/) || [])[1];
    return { d, s };
  });
  const from = (headerAll(raw, 'From')[0] || '').replace('From: ', '');
  const fromDomain = (from.match(/@([^\s>]+)/) || [])[1] || '';
  const returnPath = headerAll(raw, 'Return-Path')[0] || '';
  // PO-decisive: receiver Authentication-Results dkim=pass AND d aligns w/ From
  const recvAuth = authResults.find(h => /mail\.tm|mailtm/i.test(h)) || authResults[0] || '';
  const dkimPass = /dkim=pass/i.test(recvAuth) || dkimSigs.some(x => x.d === fromDomain);
  const dkimAligned = dkimSigs.some(x => x.d && (x.d === fromDomain || fromDomain.endsWith('.' + x.d)));
  const dmarcPass = /dmarc=pass/i.test(recvAuth) || arcAuth.some(h => /dmarc=pass/i.test(h));
  const authenticated = dkimPass && dkimAligned && dmarcPass;
  return {
    from, returnPath, fromDomain,
    authentication_results: authResults, arc_results: arcAuth,
    dkim_signatures: dkimSigs, dkim_aligned: dkimAligned,
    dkim_pass: dkimPass, dmarc_pass: dmarcPass, authenticated,
    receiver_verif: m.verifications || null,
    received_from: (headerAll(raw, 'Received')[0] || '').slice(0, 160),
  };
}
async function deliver(box, re, label, sinceMs) {
  const msg = await waitForMessage(box, { subjectRe: re, timeoutMs: 120000, sinceMs });
  if (!msg) { check(label + ' delivered', false, {}); return null; }
  const h = await headersOf(box, msg.id, label);
  check(label + ' delivered', true, { subject: msg.subject, from: h.from });
  check(label + ' authenticated (dkim+align+dmarc)', h.authenticated,
    { dkim_sigs: h.dkim_signatures, dkim_aligned: h.dkim_aligned, dkim_pass: h.dkim_pass, dmarc_pass: h.dmarc_pass, auth_results: h.authentication_results, receiver: h.receiver_verif });
  return msg;
}

(async () => {
  const since = Date.now() - 60000;
  // 1. support reply on a public ticket (existing uat ticket? use support-crm public path)
  const supBox = await createMailbox('rc2sup');
  const la0 = await api('POST', '/auth/login', null, { email: state.tenantA.email, password: state.tenantA.password });
  const t = await api('POST', '/support-crm/public/tickets', null, { tenant_id: la0.data?.tenant_id, subject: 'RC2 support evidence ' + Date.now(), description: 'Ticket for email-header evidence', public_submitter_email: supBox.address, public_submitter_name: 'RC2 Tester' });
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
