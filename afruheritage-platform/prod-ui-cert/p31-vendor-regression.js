// P31 — R3 vendor identity regression: single-use invite, role preservation
// for existing accounts, suspension enforcement, booking field isolation.
const { execSync } = require('child_process');
const fs = require('fs');
const API = 'https://api.afruheritage.com/api/v1';
const state = JSON.parse(fs.readFileSync('./state.json', 'utf8'));
const results = [];
const check = (n, ok, d) => { results.push({ n, ok, d }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? ' — ' + JSON.stringify(d).slice(0, 170) : ''}`); };
const sh = (c) => execSync(c, { encoding: 'utf8', timeout: 30000 }).trim();

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
  const tokSU = process.env.CP_TOKEN;
  const lb = await api('POST', '/auth/login', null, { email: state.tenantB.email, password: state.tenantB.password });
  const tokB = lb.data.access_token;

  // ── Setup: register + approve a fresh vendor ─────────────────────────
  const vendEmail = `p31v-${Date.now().toString(36)}@example.com`;
  const reg = await api('POST', '/vendors/register', null, {
    full_name: 'P31 Regression Vendor', email: vendEmail, phone: '+233550000031',
    id_type: 'passport', id_number: 'P31-001', vehicle_types: ['truck'],
    vehicle_reg_number: 'P31-VEH', business_type: 'individual',
    operating_regions: ['Greater Accra'], terms_accepted: true,
    insurance_accepted: true, background_check_accepted: true,
  });
  const vid = reg.data?.id || reg.data?.vendor_id;
  check('vendor registered', reg.status === 200 || reg.status === 201, { status: reg.status, id: vid });
  const rev = await api('POST', `/vendors/admin/${vid}/review`, tokSU, { action: 'approve' });
  check('vendor approved', rev.status === 200, { status: rev.status });

  // ── 1. Invite fresh email → accept → replay token must fail ─────────
  const inviteEmail = `p31inv-${Date.now().toString(36)}@example.com`;
  const link = await api('POST', `/vendors/admin/${vid}/members`, tokSU, { user_email: inviteEmail, role: 'owner' });
  check('membership linked + invited', link.status === 200 && link.data.account_invited === true, { status: link.status });
  const token = sh(`docker exec afruheritage-postgres psql -U afruheritage -d afruheritage -tAc "SELECT invitation_token FROM vendor_memberships WHERE vendor_id='${vid}' AND invitation_token IS NOT NULL LIMIT 1"`);
  check('single-use invite token issued', token.length > 20, { len: token.length });
  const acc1 = await api('POST', '/vendors/invitations/accept', null, { token, new_password: 'P31Vendor#pass1' });
  check('first accept activates membership', acc1.status === 200 && acc1.data.status === 'activated', { status: acc1.status });
  const acc2 = await api('POST', '/vendors/invitations/accept', null, { token, new_password: 'P31Vendor#other' });
  check('replay of same token rejected', acc2.status === 404 || acc2.status === 400, { status: acc2.status });
  // garbage token
  const acc3 = await api('POST', '/vendors/invitations/accept', null, { token: 'garbage-token-xyz', new_password: 'P31Vendor#pass1' });
  check('garbage token rejected', acc3.status === 404 || acc3.status === 400, { status: acc3.status });

  // ── 2. Existing account role preservation ───────────────────────────
  // link tenant B's owner (role=owner/admin) as a vendor member — their
  // platform role must NOT change to vendor and login must keep working
  const linkExisting = await api('POST', `/vendors/admin/${vid}/members`, tokSU, { user_email: state.tenantB.email, role: 'dispatcher' });
  check('existing user linked (invited membership)', linkExisting.status === 200, { status: linkExisting.status, invited: linkExisting.data.account_invited });
  const roleAfter = sh(`docker exec afruheritage-postgres psql -U afruheritage -d afruheritage -tAc "SELECT role FROM users WHERE email='${state.tenantB.email}'"`);
  check('existing user role unchanged (not vendor)', roleAfter !== 'vendor', { role: roleAfter });
  const relogin = await api('POST', '/auth/login', null, { email: state.tenantB.email, password: state.tenantB.password });
  check('existing user login still works', relogin.status === 200, { status: relogin.status });
  // before accepting, the invited membership grants no vendor access
  const preAcceptMe = await api('GET', '/vendors/me', tokB);
  check('invited (unaccepted) membership grants no vendor access', preAcceptMe.status === 403, { status: preAcceptMe.status });
  // accept the invite (existing user: no password needed — must_reset_password=false)
  const token2 = sh(`docker exec afruheritage-postgres psql -U afruheritage -d afruheritage -tAc "SELECT invitation_token FROM vendor_memberships WHERE vendor_id='${vid}' AND invitation_token IS NOT NULL LIMIT 1"`);
  const accB = await api('POST', '/vendors/invitations/accept', null, { token: token2 });
  check('existing user accepts invite (password untouched)', accB.status === 200, { status: accB.status });
  await new Promise(r => setTimeout(r, 65000));
  const pwStill = await api('POST', '/auth/login', null, { email: state.tenantB.email, password: state.tenantB.password });
  check('existing user password unchanged after accept', pwStill.status === 200, { status: pwStill.status, note: '429=ratelimit' });
  const meB = await api('GET', '/vendors/me', tokB);
  check('accepted membership grants vendor access', meB.status === 200, { status: meB.status });
  const roleFinal = sh(`docker exec afruheritage-postgres psql -U afruheritage -d afruheritage -tAc "SELECT role FROM users WHERE email='${state.tenantB.email}'"`);
  check('platform role STILL preserved post-accept', roleFinal !== 'vendor', { role: roleFinal });

  // ── 3. Suspension enforcement ───────────────────────────────────────
  // suspend the membership → /me must 403
  const memId = sh(`docker exec afruheritage-postgres psql -U afruheritage -d afruheritage -tAc "SELECT id FROM vendor_memberships WHERE vendor_id='${vid}' AND user_id=(SELECT id FROM users WHERE email='${state.tenantB.email}')"`);
  // suspend ALL of the user's active memberships — the dep grants access on
  // any active row, so suspension enforcement means no active row remains
  sh(`docker exec afruheritage-postgres psql -U afruheritage -d afruheritage -c "UPDATE vendor_memberships SET status='suspended' WHERE user_id=(SELECT id FROM users WHERE email='${state.tenantB.email}')" >/dev/null`);
  const meSusp = await api('GET', '/vendors/me', tokB);
  check('suspended membership -> 403', meSusp.status === 403, { status: meSusp.status });
  sh(`docker exec afruheritage-postgres psql -U afruheritage -d afruheritage -c "UPDATE vendor_memberships SET status='active' WHERE user_id=(SELECT id FROM users WHERE email='${state.tenantB.email}')" >/dev/null`);
  // suspend the VENDOR itself → 403 even with active membership
  sh(`docker exec afruheritage-postgres psql -U afruheritage -d afruheritage -c "UPDATE delivery_vendors SET status='suspended' WHERE id='${vid}'" >/dev/null`);
  const meVSusp = await api('GET', '/vendors/me', tokB);
  check('suspended vendor -> 403', meVSusp.status === 403, { status: meVSusp.status });
  const meBk = await api('GET', '/vendors/me/bookings', tokB);
  check('suspended vendor -> bookings 403', meBk.status === 403, { status: meBk.status });
  sh(`docker exec afruheritage-postgres psql -U afruheritage -d afruheritage -c "UPDATE delivery_vendors SET status='approved' WHERE id='${vid}'" >/dev/null`);

  // ── 4. Booking field isolation ──────────────────────────────────────
  const bk = await api('POST', `/vendors/${lb.data.tenant_id}/bookings`, tokB, {
    vendor_id: vid, pickup_address: 'P31 Pickup', delivery_address: 'P31 Drop',
    vehicle_type_requested: 'truck', notes: 'R3 isolation check',
  });
  const meBookings = await api('GET', '/vendors/me/bookings', tokB);
  const mine = (meBookings.data.items || []).find(b => /P31 Pickup/.test(b.pickup_address || ''));
  check('vendor sees own booking', !!mine, { status: meBookings.status });
  check('booking response excludes booked_by staff PII', mine && (mine.booked_by === null || mine.booked_by === undefined), { booked_by: mine?.booked_by });
  // cross-tenant: tenant A cannot accept this booking
  const la = await api('POST', '/auth/login', null, { email: state.tenantA.email, password: state.tenantA.password });
  const xAccept = await api('POST', `/vendors/${la.data.tenant_id}/bookings/${bk.data.id}/accept`, la.data.access_token);
  check('cross-tenant booking action rejected', xAccept.status === 403 || xAccept.status === 404, { status: xAccept.status });

  // cleanup: unlink test memberships
  await api('DELETE', `/vendors/admin/${vid}/members/${memId}`, tokSU);
  const pass = results.filter(r => r.ok).length;
  fs.writeFileSync('./p31-results.json', JSON.stringify({ pass, fail: results.length - pass, results }, null, 2));
  console.log(`\n${pass} PASS, ${results.length - pass} FAIL`);
  process.exit(results.length - pass ? 1 : 0);
})();
