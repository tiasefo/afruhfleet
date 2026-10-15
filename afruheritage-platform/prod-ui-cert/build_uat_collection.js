// Builds AFRUHERITAGE_UAT.postman_collection.json — dependency-ordered, auto-capturing UAT suite.
// No secrets or passwords are embedded. Credentials come from the environment file / --env-var.
const fs = require('fs');

const V = (n) => `{{${n}}}`;
const bearer = (tokenVar) => ({ type: 'bearer', bearer: [{ key: 'token', value: V(tokenVar), type: 'string' }] });
const noauth = { type: 'noauth' };
const SLEEP_13S = 'setTimeout(function(){}, 13000); // login endpoint is rate-limited to 5/min per client';

function req(name, method, path, { auth = null, body = null, query = null, headers = [], tests = [], prereq = [], base = '{{api_base}}', note = '' } = {}) {
  const segs = path.split('/').filter(Boolean);
  const u = { raw: base + path, host: [base], path: segs };
  if (query) u.query = query.map(([k, v]) => ({ key: k, value: String(v) }));
  const r = {
    name,
    request: {
      method,
      header: [
        { key: 'Content-Type', value: 'application/json' },
        { key: 'User-Agent', value: 'Afruheritage-UAT/1.0' },
        ...headers.map(([k, v]) => ({ key: k, value: v })),
      ],
      url: u,
      ...(auth ? { auth } : { auth: noauth }),
      ...(body ? { body: { mode: 'raw', raw: JSON.stringify(body) } } : {}),
      ...(note ? { description: note } : {}),
    },
    response: [],
    event: [],
  };
  if (prereq.length) r.event.push({ listen: 'prerequest', script: { type: 'text/javascript', exec: prereq } });
  if (tests.length) r.event.push({ listen: 'test', script: { type: 'text/javascript', exec: tests } });
  return r;
}

const expect = (code, extra = []) => {
  const c = Array.isArray(code) ? `to.be.oneOf(${JSON.stringify(code)})` : `to.eql(${code})`;
  return [`pm.test("HTTP ${Array.isArray(code) ? code.join(' or ') : code}", function(){ pm.expect(pm.response.code).${c}; });`, ...extra];
};
const capture = (varName, expr) => `pm.collectionVariables.set("${varName}", ${expr});`;
const j = `const j = (()=>{try{return pm.response.json()}catch(e){return {}}})();`;
const JOB_BODY = {
  tenant_id: V('tenant_a_id'), customer_name: 'x', title: 'x',
  pickup: { label: 'a', latitude: 5.6, longitude: -0.19 }, dropoff: { label: 'b', latitude: 5.67, longitude: -0.02 },
};

const F = {};
F.auth = [
  req('01 Login — business owner A', 'POST', '/api/v1/auth/login', {
    body: { email: V('UAT_BIZ_A_EMAIL'), password: V('UAT_BIZ_A_PASSWORD') },
    tests: [j, ...expect(200, [
      capture('biz_token', 'j.access_token'), capture('tenant_a_id', 'j.tenant_id'),
      `pm.test("token captured", function(){ pm.expect(pm.collectionVariables.get("biz_token")).to.be.a("string").with.length.above(50); });`,
    ])],
    note: 'Establishes the primary tenant session. Every later request reuses {{biz_token}} automatically.',
  }),
  req('02 Login — tenant B owner (isolation)', 'POST', '/api/v1/auth/login', {
    prereq: [SLEEP_13S],
    body: { email: V('UAT_BIZ_B_EMAIL'), password: V('UAT_BIZ_B_PASSWORD') },
    tests: [j, ...expect(200, [capture('biz_b_token', 'j.access_token'), capture('tenant_b_id', 'j.tenant_id')])],
  }),
  req('03 Login — individual customer', 'POST', '/api/v1/auth/login', {
    prereq: [SLEEP_13S],
    body: { email: V('UAT_IND_EMAIL'), password: V('UAT_IND_PASSWORD') },
    tests: [j, ...expect(200, [capture('ind_token', 'j.access_token'), capture('tenant_ind_id', 'j.tenant_id')])],
  }),
  req('04 Login — company staff', 'POST', '/api/v1/auth/login', {
    prereq: [SLEEP_13S],
    body: { email: V('UAT_STAFF_EMAIL'), password: V('UAT_STAFF_PASSWORD') },
    tests: [j, ...expect(200, [capture('staff_token', 'j.access_token')])],
  }),
  req('05 Login — driver', 'POST', '/api/v1/auth/login', {
    prereq: [SLEEP_13S],
    body: { email: V('UAT_DRIVER_EMAIL'), password: V('UAT_DRIVER_PASSWORD') },
    tests: [j, ...expect(200, [capture('drv_token', 'j.access_token')])],
  }),
  req('06 Login — vendor', 'POST', '/api/v1/auth/login', {
    prereq: [SLEEP_13S],
    body: { email: V('UAT_VENDOR_EMAIL'), password: V('UAT_VENDOR_PASSWORD') },
    tests: [j, ...expect(200, [capture('vend_token', 'j.access_token')])],
  }),
  req('07 Login — platform admin (UAT superuser)', 'POST', '/api/v1/auth/login', {
    prereq: [SLEEP_13S],
    body: { email: V('UAT_ADMIN_EMAIL'), password: V('UAT_ADMIN_PASSWORD') },
    tests: [j, ...expect(200, [capture('admin_token', 'j.access_token')])],
  }),
  req('08 NEG — wrong password rejected', 'POST', '/api/v1/auth/login', {
    prereq: [SLEEP_13S],
    body: { email: V('UAT_BIZ_A_EMAIL'), password: 'WrongPassword!999' },
    tests: expect(401),
  }),
  req('09 Sentinel login — super admin', 'POST', '/sentinel/auth/login', {
    base: '{{sentinel_base}}',
    body: { email: V('UAT_SENTINEL_EMAIL'), password: V('UAT_SENTINEL_PASSWORD') },
    tests: [j, ...expect(200, [
      capture('sentinel_token', 'j.access_token'), capture('cp_token', 'j.control_plane_token'),
      `pm.test("control-plane token captured", function(){ pm.expect(pm.collectionVariables.get("cp_token")).to.be.a("string"); });`,
    ])],
  }),
  req('10 Sentinel login — admin viewer', 'POST', '/sentinel/auth/login', {
    base: '{{sentinel_base}}',
    body: { email: V('UAT_VIEWER_EMAIL'), password: V('UAT_VIEWER_PASSWORD') },
    tests: [j, ...expect(200, [capture('sentinel_viewer_token', 'j.access_token')])],
  }),
  req('11 Logout — clear session cookie', 'POST', '/api/v1/auth/logout', {
    auth: bearer('biz_token'),
    tests: expect(200),
    note: 'The API also sets an HttpOnly session cookie on login. Logging out clears it so the no-credential negative tests below are genuinely unauthenticated.',
  }),
  req('12 NEG — profile without credentials rejected', 'GET', '/api/v1/auth/me', {
    tests: expect(401),
    note: 'Runs after logout so no session cookie is attached — proves header-level unauthenticated rejection.',
  }),
];

F.identity = [
  req('01 Who am I — business owner', 'GET', '/api/v1/auth/me', {
    auth: bearer('biz_token'),
    tests: [j, ...expect(200, [
      capture('biz_user_id', 'j.id'),
      `pm.test("tenant matches login", function(){ pm.expect(j.tenant_id).to.eql(pm.collectionVariables.get("tenant_a_id")); });`,
    ])],
  }),
  req('02 Who am I — driver (role + id check)', 'GET', '/api/v1/auth/me', {
    auth: bearer('drv_token'),
    tests: [j, ...expect(200, [
      capture('driver_user_id', 'j.id'),
      `pm.test("driver role", function(){ pm.expect(j.role).to.eql("delivery_driver"); });`,
    ])],
  }),
  req('03 Who am I — staff (not admin)', 'GET', '/api/v1/auth/me', {
    auth: bearer('staff_token'),
    tests: [j, ...expect(200, [`pm.test("staff is not tenant admin", function(){ pm.expect(j.is_tenant_admin).to.eql(false); });`])],
  }),
  req('04 Resolve tenant portal subdomain', 'GET', '/api/v1/tenant-context/subdomain/uatcert-meridian-freight-3', {
    tests: [j, ...expect(200)],
  }),
];

F.team = [
  req('01 Invite a new staff member', 'POST', '/api/v1/team/invitations', {
    auth: bearer('biz_token'),
    prereq: [`const em = "uat-inv-" + Date.now() + "@maxxspace.com"; pm.collectionVariables.set("invitee_email", em);`],
    body: { email: V('invitee_email'), full_name: 'UAT Invited Staff', role: 'customer' },
    tests: [j, ...expect(201, [
      capture('invitation_token', 'j.token'), capture('invitation_id', 'j.id'),
      `pm.test("invitation token captured", function(){ pm.expect(pm.collectionVariables.get("invitation_token")).to.be.a("string"); });`,
    ])],
    note: 'Generates a fresh invitee identity each run so the suite is idempotent. The token is captured here so acceptance runs unattended; real email delivery to a mailbox was verified separately in UAT evidence.',
  }),
  req('02 List team invitations', 'GET', '/api/v1/team/invitations', {
    auth: bearer('biz_token'), tests: [j, ...expect(200)],
  }),
  req('03 Look up invitation by token (public)', 'GET', '/api/v1/team/invitations/{{invitation_token}}', {
    tests: [j, ...expect(200, [`pm.test("email matches", function(){ pm.expect(j.email).to.eql(pm.collectionVariables.get("invitee_email")); });`])],
  }),
  req('04 Invitee accepts with password', 'POST', '/api/v1/team/invitations/{{invitation_token}}/accept', {
    body: { full_name: 'UAT Invited Staff', password: V('UAT_INVITEE_PASSWORD') },
    tests: [j, ...expect(200, [capture('invitee_token', 'j.access_token')])],
  }),
  req('05 Invitee profile — joined tenant A', 'GET', '/api/v1/auth/me', {
    auth: bearer('invitee_token'),
    tests: [j, ...expect(200, [
      `pm.test("invitee joined tenant A", function(){ pm.expect(j.tenant_id).to.eql(pm.collectionVariables.get("tenant_a_id")); });`,
    ])],
  }),
  req('06 List team members', 'GET', '/api/v1/team/members', {
    auth: bearer('biz_token'), tests: [j, ...expect(200)],
  }),
  req('07 NEG — staff cannot invite', 'POST', '/api/v1/team/invitations', {
    auth: bearer('staff_token'),
    body: { email: 'nope-uat@example.com', role: 'customer' },
    tests: expect(403),
  }),
  req('08 NEG — bogus invitation token', 'GET', '/api/v1/team/invitations/not-a-real-token-12345', {
    tests: expect(404),
  }),
];

F.shipments = [
  req('01 Create shipment (tenant A)', 'POST', '/api/v1/shipments/{{tenant_a_id}}', {
    auth: bearer('biz_token'),
    body: {
      sender_name: 'UAT Sender', sender_phone: '+233240000100', sender_address: '1 Test Ave, Accra',
      receiver_name: 'UAT Receiver', receiver_phone: '+233240000200', receiver_address: '2 Port Rd, Tema',
      origin_country: 'Ghana', origin_city: 'Accra', destination_country: 'Ghana', destination_city: 'Tema',
      weight_kg: 12.5, package_count: 2, description: 'UAT parcels', cargo_type: 'general', currency: 'GHS',
    },
    tests: [j, ...expect([200, 201], [
      capture('shipment_id', 'j.id'), capture('tracking_number', 'j.tracking_number'),
      `pm.test("tracking number issued", function(){ pm.expect(pm.collectionVariables.get("tracking_number")).to.be.a("string"); });`,
    ])],
  }),
  req('02 List tenant shipments', 'GET', '/api/v1/shipments/{{tenant_a_id}}', {
    auth: bearer('biz_token'), tests: [j, ...expect(200)],
  }),
  req('03 Advance status → booked', 'POST', '/api/v1/shipments/{{tenant_a_id}}/{{shipment_id}}/transition', {
    auth: bearer('biz_token'), query: [['status', 'booked']],
    tests: [j, ...expect(200, [`pm.test("status booked", function(){ pm.expect(j.status).to.eql("booked"); });`])],
  }),
  req('04 Advance status → in_transit', 'POST', '/api/v1/shipments/{{tenant_a_id}}/{{shipment_id}}/transition', {
    auth: bearer('biz_token'), query: [['status', 'in_transit']], tests: [j, ...expect(200)],
  }),
  req('05 Shipment event history', 'GET', '/api/v1/shipments/{{tenant_a_id}}/{{shipment_id}}/events', {
    auth: bearer('biz_token'), tests: [j, ...expect(200)],
  }),
  req('06 Public tracking (no login)', 'GET', '/api/v1/shipments/public/track/{{tracking_number}}', {
    tests: [j, ...expect(200)],
  }),
  req('07 NEG — tenant B cannot read tenant A shipments', 'GET', '/api/v1/shipments/{{tenant_a_id}}', {
    auth: bearer('biz_b_token'), tests: expect([403, 404]),
  }),
  req('08 NEG — tenant B cannot mutate tenant A shipment', 'POST', '/api/v1/shipments/{{tenant_a_id}}/{{shipment_id}}/transition', {
    auth: bearer('biz_b_token'), query: [['status', 'delivered']], tests: expect([403, 404]),
  }),
  req('09 NEG — invalid tracking number (public)', 'GET', '/api/v1/shipments/public/track/AFR-NOPE-000000', {
    tests: expect([404, 422]),
  }),
];

F.marketplace = [
  req('01 Post marketplace shipment (tenant A)', 'POST', '/api/v1/marketplace/shipments', {
    auth: bearer('biz_token'),
    body: {
      tenant_id: V('tenant_a_id'), customer_name: 'UAT Marketplace Customer',
      title: 'UAT R1 verification job', description: 'Automated UAT shipment posting',
      pickup: { label: 'Accra', latitude: 5.6037, longitude: -0.187 },
      dropoff: { label: 'Tema', latitude: 5.6698, longitude: -0.0166 }, weight_kg: 10,
    },
    tests: [j, ...expect([200, 201], [
      capture('job_id', 'j.id || j.job_id'), capture('job_tracking', 'j.tracking_number'),
      `pm.test("status open", function(){ pm.expect(["open","posted"]).to.include(j.status); });`,
    ])],
    note: 'Consumes 5 marketplace credits — funded via the audited Sentinel credit adjustment (no payment).',
  }),
  req('02 Driver searches open jobs', 'POST', '/api/v1/marketplace/drivers/search', {
    auth: bearer('drv_token'),
    body: { driver_id: V('driver_user_id'), current_latitude: 5.6, current_longitude: -0.19, max_distance_km: 50 },
    tests: [j, ...expect(200)],
  }),
  req('03 Driver accepts the job', 'POST', '/api/v1/marketplace/shipments/{{job_id}}/accept', {
    auth: bearer('drv_token'), body: { driver_id: V('driver_user_id') },
    tests: [j, ...expect(200, [`pm.test("job assigned", function(){ pm.expect(j.status).to.eql("assigned"); });`])],
  }),
  req('04 Driver updates tracking → in_transit', 'POST', '/api/v1/marketplace/shipments/{{job_id}}/tracking/in_transit', {
    auth: bearer('drv_token'), tests: expect(200),
  }),
  req('05 Driver sends GPS ping', 'POST', '/api/v1/marketplace/shipments/{{job_id}}/gps', {
    auth: bearer('drv_token'), body: { driver_id: V('driver_user_id'), latitude: 5.62, longitude: -0.15 },
    tests: [j, ...expect(200)],
  }),
  req('06 Driver reads GPS history', 'GET', '/api/v1/marketplace/shipments/{{job_id}}/gps', {
    auth: bearer('drv_token'), tests: [j, ...expect(200)],
  }),
  req('07 NEG — post without credentials', 'POST', '/api/v1/marketplace/shipments', {
    body: JOB_BODY, tests: expect(401),
  }),
  req('08 NEG — tenant B posts into tenant A', 'POST', '/api/v1/marketplace/shipments', {
    auth: bearer('biz_b_token'), body: JOB_BODY, tests: expect(403),
  }),
  req('09 NEG — tenant B cannot update A job tracking', 'POST', '/api/v1/marketplace/shipments/{{job_id}}/tracking/delivered', {
    auth: bearer('biz_b_token'), tests: expect(403),
  }),
  req('10 NEG — driver cannot accept as someone else', 'POST', '/api/v1/marketplace/shipments/{{job_id}}/accept', {
    auth: bearer('drv_token'), body: { driver_id: 'some-other-driver' }, tests: expect([403, 409]),
  }),
  req('11 NEG — tenant B cannot read A job GPS', 'GET', '/api/v1/marketplace/shipments/{{job_id}}/gps', {
    auth: bearer('biz_b_token'), tests: expect(403),
  }),
];

F.customs = [
  req('01 Guest — Ghana vehicle estimate (capped)', 'POST', '/api/v1/customs/guest/calculate', {
    prereq: [`const gid = pm.collectionVariables.get("guest_id") || ("uat-" + Date.now()); pm.collectionVariables.set("guest_id", gid);`],
    body: {
      guest_id: V('guest_id'), country: 'GH', commodity_type: 'vehicle',
      payload: { country: 'GH', commodity_type: 'vehicle', make: 'Toyota', model: 'Corolla', vehicle_year: 2018, engine_cc: 1800, fuel_type: 'petrol', cif_value: 8000, currency: 'USD' },
    },
    tests: [j, ...expect(200)],
    note: 'Public path used by the duty-calculator page. Capped at 2 free checks per guest fingerprint.',
  }),
  req('02 Signed-in — Ghana vehicle duty', 'POST', '/api/v1/customs/ghana/vehicle-duty', {
    auth: bearer('ind_token'),
    body: { country: 'GH', commodity_type: 'vehicle', make: 'Toyota', model: 'Corolla', vehicle_year: 2018, engine_cc: 1800, fuel_type: 'petrol', cif_value: 8000, currency: 'USD' },
    tests: [j, ...expect(200)],
  }),
  req('03 Signed-in — Kenya vehicle duty (CRSP)', 'POST', '/api/v1/customs/kenya/vehicle-duty', {
    auth: bearer('ind_token'),
    body: { country: 'KE', commodity_type: 'vehicle', make: 'Toyota', model: 'Corolla', vehicle_year: 2018, engine_cc: 1800, fuel_type: 'petrol' },
    tests: [j, ...expect(200)],
  }),
  req('04 NEG — calculator without credentials', 'POST', '/api/v1/customs/ghana/vehicle-duty', {
    body: { country: 'GH', commodity_type: 'vehicle', make: 'Toyota', model: 'Corolla', vehicle_year: 2018, engine_cc: 1800, fuel_type: 'petrol', cif_value: 8000, currency: 'USD' },
    tests: expect(401),
  }),
  req('05 NEG — unsupported country rejected', 'POST', '/api/v1/customs/calculate', {
    auth: bearer('ind_token'),
    body: { country: 'NG', commodity_type: 'vehicle', make: 'Toyota', model: 'Corolla', vehicle_year: 2018 },
    tests: expect([400, 422]),
  }),
];

F.support = [
  req('01 Open a public support ticket', 'POST', '/api/v1/support-crm/public/tickets', {
    body: {
      tenant_id: V('tenant_a_id'), public_submitter_name: 'UAT Customer', public_submitter_email: V('UAT_IND_EMAIL'),
      subject: 'UAT ticket — where is my shipment?', description: 'Automated UAT support request.', category: 'tracking', priority: 'medium',
    },
    tests: [j, ...expect([200, 201], [capture('ticket_public_token', 'j.public_token || j.token'), capture('ticket_id', 'j.id')])],
    note: 'priority must be one of low|medium|high|critical — an invalid value currently returns 500 (logged as defect U-001).',
  }),
  req('02 Read ticket by public token', 'GET', '/api/v1/support-crm/public/tickets/{{ticket_public_token}}', {
    tests: [j, ...expect(200)],
  }),
  req('03 Customer replies on ticket', 'POST', '/api/v1/support-crm/public/tickets/{{ticket_public_token}}/reply', {
    body: { body: 'Adding more detail from UAT.', author_type: 'customer', author_name: 'UAT Customer' },
    tests: [j, ...expect([200, 201])],
  }),
  req('04 Tenant sees the ticket internally', 'GET', '/api/v1/support-crm/tickets', {
    auth: bearer('biz_token'), tests: [j, ...expect(200)],
  }),
  req('05 Create CRM account', 'POST', '/api/v1/support-crm/accounts', {
    auth: bearer('biz_token'),
    body: { tenant_id: V('tenant_a_id'), account_type: 'customer', company_name: 'UAT CRM Account Ltd', email: 'uat-crm@example.com', country: 'Ghana', city: 'Accra' },
    tests: [j, ...expect([200, 201], [capture('crm_account_id', 'j.id')])],
  }),
  req('06 List CRM accounts', 'GET', '/api/v1/support-crm/accounts', {
    auth: bearer('biz_token'), tests: [j, ...expect(200)],
  }),
  req('07 Create CRM customer record', 'POST', '/api/v1/crm/customers', {
    auth: bearer('biz_token'),
    body: { name: 'UAT CRM Customer', email: 'uat-crm-customer@example.com', company: 'UAT CRM Co', stage: 'lead', currency: 'GHS' },
    tests: [j, ...expect([200, 201], [capture('crm_customer_id', 'j.id')])],
  }),
  req('08 NEG — CRM without credentials', 'GET', '/api/v1/crm/customers', { tests: expect(401) }),
];

F.vendors = [
  req('01 Vendor profile (approved vendor)', 'GET', '/api/v1/vendors/me', {
    auth: bearer('vend_token'),
    tests: [j, ...expect(200, [`pm.test("vendor approved", function(){ pm.expect(j.vendor.status).to.eql("approved"); });`])],
  }),
  req('02 Vendor bookings', 'GET', '/api/v1/vendors/me/bookings', {
    auth: bearer('vend_token'), tests: [j, ...expect(200)],
  }),
  req('03 Public vendor marketplace list', 'GET', '/api/v1/vendors/marketplace', {
    auth: bearer('biz_token'), tests: [j, ...expect(200)],
  }),
  req('04 Admin — list vendors', 'GET', '/api/v1/vendors/admin', {
    auth: bearer('admin_token'), tests: [j, ...expect(200)],
  }),
  req('05 NEG — tenant user blocked from vendor admin', 'GET', '/api/v1/vendors/admin', {
    auth: bearer('biz_token'), tests: expect(403),
  }),
];

F.billing = [
  req('01 List plans', 'GET', '/api/v1/billing/plans', {
    auth: bearer('biz_token'), tests: [j, ...expect(200)],
  }),
  req('02 Tenant subscription', 'GET', '/api/v1/billing/subscriptions/{{tenant_a_id}}', {
    auth: bearer('biz_token'), tests: [j, ...expect([200, 404])],
  }),
  req('03 Tenant wallet balance', 'GET', '/api/v1/billing/wallets/{{tenant_a_id}}', {
    auth: bearer('biz_token'), tests: [j, ...expect(200)],
  }),
  req('04 Wallet transactions', 'GET', '/api/v1/billing/wallets/{{tenant_a_id}}/transactions', {
    auth: bearer('biz_token'), tests: [j, ...expect(200)],
  }),
  req('05 NEG — payment-hub initialize without credentials', 'POST', '/api/v1/payment-hub/initialize', {
    body: { tenant_id: V('tenant_a_id'), amount: 1, currency: 'GHS', email: 'uat@example.com', purpose: 'credit_topup' },
    tests: expect([401, 422]),
    note: 'Live-charge surface — must never execute unauthenticated. UAT never creates a real charge.',
  }),
  req('06 NEG — cross-tenant transaction history', 'GET', '/api/v1/payment-hub/transactions/{{tenant_a_id}}', {
    auth: bearer('biz_b_token'), tests: expect([401, 403]),
  }),
];

const CP = [['X-CP-Token', V('cp_token')]];
F.sentinel = [
  req('01 Sentinel — who am I (super admin)', 'GET', '/sentinel/auth/me', {
    base: '{{sentinel_base}}', auth: bearer('sentinel_token'),
    tests: [j, ...expect(200, [`pm.test("super_admin", function(){ pm.expect(j.role).to.eql("super_admin"); });`])],
  }),
  req('02 Sentinel — who am I (viewer)', 'GET', '/sentinel/auth/me', {
    base: '{{sentinel_base}}', auth: bearer('sentinel_viewer_token'),
    tests: [j, ...expect(200, [`pm.test("admin role", function(){ pm.expect(j.role).to.eql("admin"); });`])],
  }),
  req('03 Sentinel — tenant list', 'GET', '/sentinel/tenants', {
    base: '{{sentinel_base}}', auth: bearer('sentinel_token'), tests: [j, ...expect(200)],
  }),
  req('04 Sentinel — dashboard stats', 'GET', '/sentinel/dashboard/stats', {
    base: '{{sentinel_base}}', auth: bearer('sentinel_token'), tests: [j, ...expect(200)],
  }),
  req('05 Sentinel — system diagnostics', 'GET', '/sentinel/diagnostics/system', {
    base: '{{sentinel_base}}', auth: bearer('sentinel_token'), tests: [j, ...expect(200)],
  }),
  req('06 Sentinel — shipments list (control-plane)', 'GET', '/sentinel/shipments', {
    base: '{{sentinel_base}}', auth: bearer('sentinel_token'), headers: CP, tests: [j, ...expect(200)],
    note: 'Proxied route — requires the X-CP-Token returned by Sentinel login in addition to the admin token.',
  }),
  req('07 Sentinel — tickets list (control-plane)', 'GET', '/sentinel/tickets', {
    base: '{{sentinel_base}}', auth: bearer('sentinel_token'), headers: CP, tests: [j, ...expect(200)],
  }),
  req('08 Sentinel — audit logs', 'GET', '/sentinel/diagnostics/audit-logs', {
    base: '{{sentinel_base}}', auth: bearer('sentinel_token'), tests: [j, ...expect(200)],
  }),
  req('09 Sentinel — admin users (super only)', 'GET', '/sentinel/users/', {
    base: '{{sentinel_base}}', auth: bearer('sentinel_token'), tests: [j, ...expect(200)],
  }),
  req('10 NEG — viewer cannot create admin user', 'POST', '/sentinel/auth/users', {
    base: '{{sentinel_base}}', auth: bearer('sentinel_viewer_token'),
    body: { email: 'nope@example.com', full_name: 'x', password: 'x'.repeat(12), role: 'admin' },
    tests: expect(403),
  }),
  req('11 NEG — Sentinel without credentials', 'GET', '/sentinel/tenants', {
    base: '{{sentinel_base}}', tests: expect(401),
  }),
];

const collection = {
  info: {
    name: 'Afruheritage UAT — Executable Regression Pack',
    description: 'Executed against the authorized UAT environment. Run top-to-bottom; tokens and IDs are captured automatically. Credentials are NOT included — supply them via the environment file.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: Object.entries({
    '00 — Authentication (all roles)': F.auth,
    '01 — Identity & Tenant Context': F.identity,
    '02 — Team Invitations': F.team,
    '03 — Shipments & Tracking': F.shipments,
    '04 — Marketplace (authorization regression)': F.marketplace,
    '05 — Customs Calculators (GH & KE)': F.customs,
    '06 — Support & CRM': F.support,
    '07 — Vendors': F.vendors,
    '08 — Billing (read-only, no charges)': F.billing,
    '09 — Sentinel Administration': F.sentinel,
  }).map(([name, items]) => ({ name, item: items })),
  variable: [
    { key: 'api_base', value: 'https://api.afruheritage.com' },
    { key: 'sentinel_base', value: 'https://admin.afruheritage.com' },
    { key: 'tenant_a_id', value: '' }, { key: 'tenant_b_id', value: '' }, { key: 'tenant_ind_id', value: '' },
    { key: 'biz_token', value: '' }, { key: 'biz_b_token', value: '' }, { key: 'ind_token', value: '' },
    { key: 'staff_token', value: '' }, { key: 'drv_token', value: '' }, { key: 'vend_token', value: '' },
    { key: 'admin_token', value: '' }, { key: 'sentinel_token', value: '' }, { key: 'sentinel_viewer_token', value: '' },
    { key: 'cp_token', value: '' }, { key: 'invitee_token', value: '' },
    { key: 'biz_user_id', value: '' }, { key: 'driver_user_id', value: '' },
    { key: 'invitation_token', value: '' }, { key: 'invitation_id', value: '' }, { key: 'invitee_email', value: '' },
    { key: 'shipment_id', value: '' }, { key: 'tracking_number', value: '' },
    { key: 'job_id', value: '' }, { key: 'job_tracking', value: '' },
    { key: 'guest_id', value: '' }, { key: 'ticket_public_token', value: '' }, { key: 'ticket_id', value: '' },
    { key: 'crm_account_id', value: '' }, { key: 'crm_customer_id', value: '' },
  ],
};

const env = {
  name: 'Afruheritage UAT Environment',
  values: [
    { key: 'api_base', value: 'https://api.afruheritage.com', enabled: true },
    { key: 'sentinel_base', value: 'https://admin.afruheritage.com', enabled: true },
    { key: 'UAT_BIZ_A_EMAIL', value: 'stab-mv0j6arnsi4h@maxxspace.com', enabled: true },
    { key: 'UAT_BIZ_A_PASSWORD', value: '', enabled: true },
    { key: 'UAT_BIZ_B_EMAIL', value: 'rcb2yeu4-muum1nk2r57r@maxxspace.com', enabled: true },
    { key: 'UAT_BIZ_B_PASSWORD', value: '', enabled: true },
    { key: 'UAT_IND_EMAIL', value: 'uatind-mv8zujs6r9zo@maxxspace.com', enabled: true },
    { key: 'UAT_IND_PASSWORD', value: '', enabled: true },
    { key: 'UAT_STAFF_EMAIL', value: 'uat-emp2-mv1n3qqvlnqz@maxxspace.com', enabled: true },
    { key: 'UAT_STAFF_PASSWORD', value: '', enabled: true },
    { key: 'UAT_DRIVER_EMAIL', value: 'uatdrv-mv907bxzz7vf@maxxspace.com', enabled: true },
    { key: 'UAT_DRIVER_PASSWORD', value: '', enabled: true },
    { key: 'UAT_VENDOR_EMAIL', value: 'uatv-murpf0oscvjp@maxxspace.com', enabled: true },
    { key: 'UAT_VENDOR_PASSWORD', value: '', enabled: true },
    { key: 'UAT_ADMIN_EMAIL', value: 'uat-sentinel@afruheritage.com', enabled: true },
    { key: 'UAT_ADMIN_PASSWORD', value: '', enabled: true },
    { key: 'UAT_SENTINEL_EMAIL', value: 'uat-sentinel@afruheritage.com', enabled: true },
    { key: 'UAT_SENTINEL_PASSWORD', value: '', enabled: true },
    { key: 'UAT_VIEWER_EMAIL', value: 'uat-sentinel-viewer@afruheritage.com', enabled: true },
    { key: 'UAT_VIEWER_PASSWORD', value: '', enabled: true },
    { key: 'UAT_INVITEE_EMAIL', value: 'uats2-mv9kx9nbklzl@maxxspace.com', enabled: true },
    { key: 'UAT_INVITEE_PASSWORD', value: '', enabled: true },
  ],
  _postman_variable_scope: 'environment',
};

fs.writeFileSync('doc-package/AFRUHERITAGE_UAT.postman_collection.json', JSON.stringify(collection, null, 2));
fs.writeFileSync('doc-package/AFRUHERITAGE_UAT.postman_environment.json', JSON.stringify(env, null, 2));
let n = 0; for (const f of collection.item) n += f.item.length;
console.log('requests:', n);
