// P29 — R1 rate-limiter remediation evidence (post-fix topology:
// cloudflared -> localhost published ports -> API; published ports bound to
// 127.0.0.1; get_client_ip prefers CF-Connecting-IP/X-Real-IP only from
// trusted peers).
const { execSync } = require('child_process');
const fs = require('fs');

const API = 'https://api.afruheritage.com/api/v1';
const results = [];
const check = (n, ok, d) => { results.push({ n, ok, d }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? ' — ' + JSON.stringify(d).slice(0, 170) : ''}`); };
const sh = (c) => { try { return execSync(c, { encoding: 'utf8', timeout: 40000 }).trim(); } catch (e) { return `ERR:${e.message.slice(0, 120)}`; } };
const rlkeys = () => sh(`docker exec afruheritage-redis redis-cli KEYS 'LIMITS:*'`).split('\n').filter(Boolean);

(async () => {
  // ── 1. Unit: get_client_ip trust rules ──────────────────────────────
  const unit = sh(`docker exec afruheritage-api python -c "
from app.middleware.rate_limit import get_client_ip
class C: host = None
class R:
    def __init__(s, peer, headers): s.client = C(); s.client.host = peer; s.headers = headers
r1 = get_client_ip(R('172.19.0.100', {'x-real-ip': '203.0.113.50'}))               # trusted frontend + X-Real-IP
r2 = get_client_ip(R('172.19.0.100', {}))                                          # trusted, no header
r3 = get_client_ip(R('198.51.100.9', {'x-real-ip': '203.0.113.50'}))               # untrusted + forged
r4 = get_client_ip(R('172.19.0.1', {'cf-connecting-ip': '203.0.113.60', 'x-real-ip': '1.1.1.1'}))  # CF header wins
r5 = get_client_ip(R('198.51.100.9', {'cf-connecting-ip': '203.0.113.60'}))        # untrusted + forged CF header
print(r1, '|', r2, '|', r3, '|', r4, '|', r5)
"`);
  const [r1, r2, r3, r4, r5] = unit.split(' | ');
  check('trusted peer honors X-Real-IP', r1 === '203.0.113.50', { r1 });
  check('trusted peer without header -> peer IP', r2 === '172.19.0.100', { r2 });
  check('untrusted peer ignores forged X-Real-IP', r3 === '198.51.100.9', { r3 });
  check('CF-Connecting-IP preferred on trusted peer', r4 === '203.0.113.60', { r4 });
  check('untrusted peer ignores forged CF-Connecting-IP', r5 === '198.51.100.9', { r5 });

  // ── 2. External bypass of the trusted edge is closed ────────────────
  // published ports are bound to 127.0.0.1 — a request arriving from a
  // foreign docker network (simulating external :8100 access) must refuse
  const direct = sh(`docker run --rm curlimages/curl -s -o /dev/null -w '%{http_code}' --max-time 8 -X POST 'http://172.19.0.1:8100/api/v1/auth/login' -H 'Content-Type: application/json' -H 'X-Real-IP: 6.6.6.6' -d '{"email":"nobody@example.com","password":"x"}'`);
  check('direct published-port access refused', direct === '000' || direct.startsWith('ERR'), { status: direct });
  const postgresDirect = sh(`docker run --rm curlimages/curl -s -o /dev/null -w '%{http_code}' --max-time 8 http://172.19.0.1:5433/`);
  check('postgres published-port access refused', postgresDirect === '000' || postgresDirect.startsWith('ERR'), { status: postgresDirect });

  // ── 3. Live through the edge: forged header cannot pick the bucket ──
  sh(`docker exec afruheritage-redis redis-cli --scan --pattern 'LIMITS:*' | xargs -r docker exec afruheritage-redis redis-cli DEL`);
  const res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Real-IP': '9.9.9.9', 'CF-Connecting-IP': '9.9.9.9' }, body: JSON.stringify({ email: 'nobody@example.com', password: 'badpw123' }) });
  await new Promise(r => setTimeout(r, 1500));
  const keys = rlkeys();
  const forged = keys.filter(k => /9\.9\.9\.9/.test(k));
  check('forged CF-Connecting-IP/X-Real-IP creates no bucket', forged.length === 0 && res.status !== 429, { status: res.status, keys: keys.slice(0, 4) });

  const realIp = sh(`curl -s https://api.ipify.org`);

  // ── 4. Per-client bucket separation (two independent identities) ────
  // simulate a second client via a different real source: direct request
  // from an UNTRUSTED peer (worker container exec -> api:8000 direct shows
  // that container's real IP, headers ignored)
  const workerPeer = sh(`docker exec afruheritage-worker hostname -i | awk '{print $1}'`);
  const forgedViaWorker = sh(`docker exec afruheritage-worker python -c "
import urllib.request, json
req = urllib.request.Request('http://api:8000/api/v1/auth/login', data=json.dumps({'email':'nobody@example.com','password':'badpw123'}).encode(), headers={'Content-Type':'application/json','X-Real-IP':'7.7.7.7'})
try:
    urllib.request.urlopen(req, timeout=10)
except Exception as e:
    print(getattr(e,'status',None) or getattr(e,'code',None) or e)
"`);
  await new Promise(r => setTimeout(r, 1200));
  const keys2 = rlkeys().filter(k => /login/.test(k));
  const workerBucket = keys2.filter(k => k.includes(workerPeer));
  const spoofedBucket = keys2.filter(k => /7\.7\.7\.7/.test(k));
  check('internal untrusted peer keyed on its own IP (no spoof)', workerBucket.length > 0 && spoofedBucket.length === 0, { workerPeer, keys2 });

  // ── 5. Brute-force protection still enforced (prod: 5/minute) ───────
  let statuses = [];
  for (let i = 0; i < 9; i++) {
    const r = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'brute@example.com', password: `pw${i}` }) });
    statuses.push(r.status);
  }
  check('brute-force protection fires (429 within 9 tries)', statuses.includes(429), { statuses });
  const postKeys = rlkeys().filter(k => /login/.test(k));
  check('bucket keyed on real client IP', postKeys.some(k => k.includes(realIp)), { realIp, postKeys });

  // ── 6. prod-mode side effects confirmed ─────────────────────────────
  const docs = await fetch(`https://api.afruheritage.com/api/docs`);
  check('/api/docs disabled in production mode', docs.status === 404, { status: docs.status });

  const pass = results.filter(r => r.ok).length;
  fs.writeFileSync('./p29-results.json', JSON.stringify({ pass, fail: results.length - pass, results }, null, 2));
  console.log(`\n${pass} PASS, ${results.length - pass} FAIL`);
  process.exit(results.length - pass ? 1 : 0);
})();
