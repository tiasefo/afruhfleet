// Controlled external mailbox via mail.tm (real public mailbox, real SMTP delivery).
// Only used to READ email for the product under test — never to substitute UI journeys.
const MAIL_API = 'https://api.mail.tm';

async function http(method, url, body, token) {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`mail.tm ${method} ${url} -> ${res.status} ${await res.text()}`);
  return res.json();
}

async function createMailbox(prefix) {
  const domains = await http('GET', `${MAIL_API}/domains`);
  const domain = domains['hydra:member'][0].domain;
  const stamp = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const address = `${prefix}-${stamp}@${domain}`;
  const password = 'Mbx' + Math.random().toString(36).slice(2, 12) + 'xY9';
  await http('POST', `${MAIL_API}/accounts`, { address, password });
  // token endpoint needs a moment after account creation
  let tok = null, lastErr = null;
  for (let i = 0; i < 6; i++) {
    await new Promise(r => setTimeout(r, 2500));
    try { tok = await http('POST', `${MAIL_API}/token`, { address, password }); break; }
    catch (e) { lastErr = e; }
  }
  if (!tok) throw lastErr;
  return { address, token: tok.token, password };
}

async function listMessages(box) {
  const data = await http('GET', `${MAIL_API}/messages`, undefined, box.token);
  return data['hydra:member'] || [];
}

async function readMessage(box, id) {
  return http('GET', `${MAIL_API}/messages/${id}`, undefined, box.token);
}

// Poll inbox for a message matching subject regex (and optional sender filter).
// sinceMs: ignore messages created before this timestamp (avoids matching stale mail).
async function waitForMessage(box, { subjectRe, timeoutMs = 240000, pollMs = 6000, sinceMs = 0 }) {
  const deadline = Date.now() + timeoutMs;
  const seen = new Set();
  while (Date.now() < deadline) {
    const msgs = await listMessages(box);
    // newest first
    const sorted = [...msgs].sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));
    for (const m of sorted) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      const created = new Date(m.createdAt || m.created_at || 0).getTime();
      if (sinceMs && created && created < sinceMs) continue;
      if (subjectRe.test(m.subject || '')) {
        return await readMessage(box, m.id);
      }
    }
    await new Promise(r => setTimeout(r, pollMs));
  }
  return null;
}

// Extract href links from a mail.tm message (html array or intro text).
function extractLinks(msg, hostRe = /afruheritage\.com/i) {
  const html = Array.isArray(msg.html) ? msg.html.join('\n') : (msg.html || msg.text || '');
  const links = [];
  const re = /href="([^"]+)"/gi;
  let m;
  while ((m = re.exec(html))) {
    let u = m[1].replace(/&amp;/g, '&');
    if (hostRe.test(u) && !links.includes(u)) links.push(u);
  }
  // also raw URLs in text bodies
  const urlRe = /https?:\/\/[^\s"'<>)]+/gi;
  while ((m = urlRe.exec(html))) {
    let u = m[0].replace(/&amp;/g, '&').replace(/[.,;]+$/, '');
    if (hostRe.test(u) && !links.includes(u)) links.push(u);
  }
  return links;
}

module.exports = { createMailbox, waitForMessage, extractLinks, listMessages, readMessage };
