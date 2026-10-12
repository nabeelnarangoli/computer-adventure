// Shared API logic for Aqlyon Digital Skill Academy.
// Runs inside a Netlify Function (production) or the local dev server (dev-server.mjs).
// Storage is any object with get(key,{type:'json'}), setJSON(key,value), delete(key), list().
import crypto from 'node:crypto';

const USER_RE = /^[a-z0-9._-]{3,24}$/;
const KINDS = ['child', 'adult'];
const LANGS = ['', 'ml', 'hi', 'ar'];
const MAX_BODY = 300_000;
const AI_STAGE_IDS = Array.from({ length: 13 }, (_, i) => 'ai' + (i + 1));
const AI_PASS = 4;

const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
const b64u = (buf) => Buffer.from(buf).toString('base64url');

function hashPin(pin, salt = crypto.randomBytes(16).toString('hex')) {
  const h = crypto.scryptSync(String(pin), salt, 32).toString('hex');
  return `${salt}:${h}`;
}
function checkPin(pin, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, h] = stored.split(':');
  const test = crypto.scryptSync(String(pin), salt, 32);
  const real = Buffer.from(h, 'hex');
  return real.length === test.length && crypto.timingSafeEqual(real, test);
}
function safeEqual(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

export function createHandler({ getStore, env }) {
  const cfg = () => {
    const e = env();
    const admin = e.ADMIN_PASSWORD || '';
    const secret = e.SESSION_SECRET || (admin ? crypto.createHash('sha256').update('ca-session:' + admin).digest('hex') : '');
    return { admin, secret };
  };
  const sign = (payload, secret) => {
    const body = b64u(JSON.stringify(payload));
    const mac = crypto.createHmac('sha256', secret).update(body).digest('base64url');
    return `${body}.${mac}`;
  };
  const verify = (token, secret) => {
    if (!token || !token.includes('.')) return null;
    const [body, mac] = token.split('.');
    const want = crypto.createHmac('sha256', secret).update(body).digest('base64url');
    if (mac.length !== want.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(want))) return null;
    try {
      const p = JSON.parse(Buffer.from(body, 'base64url').toString());
      if (!p.exp || p.exp < Date.now()) return null;
      return p;
    } catch { return null; }
  };
  const publicUser = (u) => ({ username: u.username, name: u.name, kind: u.kind, lang: u.lang || '', self: !!u.selfRegistered, active: u.active !== false, createdAt: u.createdAt, lastSeen: u.lastSeen || null, aiCert: u.aiCert || null });
  const summary = (p) => {
    if (!p) return { started: false };
    const done = typeof p.planDone === 'number' ? p.planDone : Object.keys(p.done || {}).length;
    return { started: true, platform: p.platform || null, track: p.track || null, done, total: p.planTotal || 0, lastLesson: p.lastLesson || null, level: p.placement?.level || null, updatedAt: p.updatedAt || null, ai: aiSummary(p) };
  };

  const aiSummary = (p) => {
    const st = p?.ai?.st || {};
    const passed = AI_STAGE_IDS.filter((id) => st[id]?.passed).length;
    return { passed, total: AI_STAGE_IDS.length, start: p?.ai?.place?.start || null, started: !!p?.ai };
  };

  const newUser = async (users, body) => {
    const username = String(body.username || '').trim().toLowerCase();
    const name = String(body.name || '').trim().slice(0, 40);
    const pin = String(body.pin || '');
    const kind = KINDS.includes(body.kind) ? body.kind : 'adult';
    const lang = LANGS.includes(body.lang) ? body.lang : '';
    if (!name) return { error: 'Please enter the learner\'s name.' };
    if (!USER_RE.test(username)) return { error: 'Username: 3–24 characters, only small letters, numbers, dot, dash or underscore.' };
    if (pin.length < 4 || pin.length > 20) return { error: 'PIN must be 4 to 20 characters.' };
    if (await users.get(username, { type: 'json' })) return { error: 'That username is already taken. Try another one.', status: 409 };
    return { u: { username, name, kind, lang, pin: hashPin(pin), active: true, createdAt: new Date().toISOString() } };
  };
  const getSettings = async (meta) => ({ allowRegister: true, ...((await meta.get('settings', { type: 'json' })) || {}) });

  return async function handle(req) {
    const { admin, secret } = cfg();
    if (!admin) return json(500, { error: 'The server is not set up yet. Add an ADMIN_PASSWORD environment variable in Netlify and redeploy.' });

    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/api/, '').replace(/\/+$/, '') || '/';
    const method = req.method.toUpperCase();
    const users = getStore('users');
    const progress = getStore('progress');
    const meta = getStore('meta');

    let body = {};
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const text = await req.text();
      if (text.length > MAX_BODY) return json(413, { error: 'Too much data.' });
      try { body = text ? JSON.parse(text) : {}; } catch { return json(400, { error: 'Invalid JSON.' }); }
    }
    const auth = verify((req.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''), secret);

    try {
      /* ---------- learner ---------- */
      if (path === '/login' && method === 'POST') {
        const username = String(body.username || '').trim().toLowerCase();
        const pin = String(body.pin || '');
        const u = USER_RE.test(username) ? await users.get(username, { type: 'json' }) : null;
        if (u && u.lockUntil && u.lockUntil > Date.now()) {
          return json(429, { error: 'Too many wrong tries. Wait 5 minutes and try again.' });
        }
        if (!u || !checkPin(pin, u.pin)) {
          if (u) {
            u.fails = (u.fails || 0) + 1;
            if (u.fails >= 8) { u.lockUntil = Date.now() + 5 * 60_000; u.fails = 0; }
            await users.setJSON(username, u);
          }
          return json(401, { error: 'That username or PIN is not right. Check it and try again.' });
        }
        if (u.active === false) return json(403, { error: 'This account is switched off. Ask your admin to turn it on.' });
        u.fails = 0; u.lockUntil = 0; u.lastSeen = new Date().toISOString();
        await users.setJSON(username, u);
        const token = sign({ u: username, r: 'user', exp: Date.now() + 30 * 864e5 }, secret);
        const p = await progress.get(username, { type: 'json' });
        return json(200, { token, user: publicUser(u), progress: p || null });
      }

      if (path === '/config' && method === 'GET') {
        const st = await getSettings(meta);
        return json(200, { allowRegister: st.allowRegister });
      }

      if (path === '/register' && method === 'POST') {
        const st = await getSettings(meta);
        if (!st.allowRegister) return json(403, { error: 'Sign-up is closed. Ask your admin to create an account for you.' });
        const ip = req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
        const ipKey = 'reg-' + crypto.createHash('sha256').update(ip).digest('hex').slice(0, 24);
        const rl = (await meta.get(ipKey, { type: 'json' })) || { n: 0, since: Date.now() };
        if (Date.now() - rl.since > 3600_000) { rl.n = 0; rl.since = Date.now(); }
        if (rl.n >= 5) return json(429, { error: 'Too many new accounts from here. Please try again in an hour.' });
        const r = await newUser(users, body);
        if (r.error) return json(r.status || 400, { error: r.error });
        const u = r.u;
        u.selfRegistered = true; u.lastSeen = u.createdAt;
        await users.setJSON(u.username, u);
        rl.n += 1; await meta.setJSON(ipKey, rl);
        const token = sign({ u: u.username, r: 'user', exp: Date.now() + 30 * 864e5 }, secret);
        return json(201, { token, user: publicUser(u), progress: null });
      }

      if (path === '/me' && method === 'GET') {
        if (!auth || auth.r !== 'user') return json(401, { error: 'Please log in again.' });
        const u = await users.get(auth.u, { type: 'json' });
        if (!u || u.active === false) return json(401, { error: 'Please log in again.' });
        u.lastSeen = new Date().toISOString();
        await users.setJSON(auth.u, u);
        const p = await progress.get(auth.u, { type: 'json' });
        return json(200, { user: publicUser(u), progress: p || null });
      }

      if (path === '/progress' && method === 'PUT') {
        if (!auth || auth.r !== 'user') return json(401, { error: 'Please log in again.' });
        const u = await users.get(auth.u, { type: 'json' });
        if (!u || u.active === false) return json(401, { error: 'Please log in again.' });
        const p = body && typeof body === 'object' ? body : {};
        p.updatedAt = new Date().toISOString();
        await progress.setJSON(auth.u, p);
        return json(200, { ok: true, updatedAt: p.updatedAt });
      }

      if (path === '/lang' && method === 'PUT') {
        if (!auth || auth.r !== 'user') return json(401, { error: 'Please log in again.' });
        const u = await users.get(auth.u, { type: 'json' });
        if (!u || u.active === false) return json(401, { error: 'Please log in again.' });
        if (!LANGS.includes(body.lang)) return json(400, { error: 'Unknown language.' });
        u.lang = body.lang;
        await users.setJSON(auth.u, u);
        return json(200, { user: publicUser(u) });
      }

      if (path === '/ai/cert' && method === 'POST') {
        if (!auth || auth.r !== 'user') return json(401, { error: 'Please log in again.' });
        const u = await users.get(auth.u, { type: 'json' });
        if (!u || u.active === false) return json(401, { error: 'Please log in again.' });
        if (u.aiCert) return json(200, { cert: u.aiCert });
        const p = await progress.get(auth.u, { type: 'json' });
        const st = p?.ai?.st || {};
        const missing = AI_STAGE_IDS.filter((id) => !(st[id]?.passed && (st[id].best || 0) >= AI_PASS));
        if (missing.length) return json(400, { error: 'Pass every stage quiz first. Stages still to pass: ' + missing.length + '.' });
        const score = Math.round(AI_STAGE_IDS.reduce((t, id) => t + Math.min(5, st[id].best || 0), 0) / (AI_STAGE_IDS.length * 5) * 100);
        const ctr = (await meta.get('cert-counter', { type: 'json' })) || { n: 100 };
        ctr.n += 1;
        await meta.setJSON('cert-counter', ctr);
        const date = new Date().toISOString().slice(0, 10);
        const cert = { id: `AQL-AI-${date.slice(0, 4)}-${String(ctr.n).padStart(5, '0')}`, name: u.name, date, score };
        u.aiCert = cert;
        await users.setJSON(auth.u, u);
        return json(201, { cert });
      }

      /* ---------- admin ---------- */
      if (path === '/admin/login' && method === 'POST') {
        const att = (await meta.get('admin-attempts', { type: 'json' })) || { fails: 0, lockUntil: 0 };
        if (att.lockUntil > Date.now()) return json(429, { error: 'Too many wrong tries. Wait 5 minutes.' });
        if (!safeEqual(body.password || '', admin)) {
          att.fails += 1;
          if (att.fails >= 6) { att.lockUntil = Date.now() + 5 * 60_000; att.fails = 0; }
          await meta.setJSON('admin-attempts', att);
          return json(401, { error: 'Wrong admin password.' });
        }
        await meta.setJSON('admin-attempts', { fails: 0, lockUntil: 0 });
        return json(200, { token: sign({ r: 'admin', exp: Date.now() + 12 * 36e5 }, secret) });
      }

      if (path.startsWith('/admin/')) {
        if (!auth || auth.r !== 'admin') return json(401, { error: 'Admin login needed.' });

        if (path === '/admin/users' && method === 'GET') {
          const { blobs } = await users.list();
          const out = [];
          for (const b of blobs) {
            const u = await users.get(b.key, { type: 'json' });
            if (!u) continue;
            const p = await progress.get(b.key, { type: 'json' });
            out.push({ ...publicUser(u), summary: summary(p) });
          }
          out.sort((a, b) => a.name.localeCompare(b.name));
          return json(200, { users: out });
        }

        if (path === '/admin/settings' && method === 'GET') return json(200, await getSettings(meta));
        if (path === '/admin/settings' && method === 'PATCH') {
          const cur = await getSettings(meta);
          if (body.allowRegister !== undefined) cur.allowRegister = !!body.allowRegister;
          await meta.setJSON('settings', cur);
          return json(200, cur);
        }

        if (path === '/admin/users' && method === 'POST') {
          const r = await newUser(users, body);
          if (r.error) return json(r.status || 400, { error: r.error });
          const u = r.u;
          await users.setJSON(u.username, u);
          return json(201, { user: publicUser(u) });
        }

        const m = path.match(/^\/admin\/users\/([a-z0-9._-]{3,24})(\/reset-progress)?$/);
        if (m) {
          const username = m[1];
          const u = await users.get(username, { type: 'json' });
          if (!u) return json(404, { error: 'User not found.' });
          if (m[2] && method === 'POST') {
            await progress.delete(username);
            return json(200, { ok: true });
          }
          if (!m[2] && method === 'GET') {
            const p = await progress.get(username, { type: 'json' });
            return json(200, { user: publicUser(u), progress: p || null, summary: summary(p) });
          }
          if (!m[2] && method === 'PATCH') {
            if (body.name !== undefined) { const n = String(body.name).trim().slice(0, 40); if (!n) return json(400, { error: 'Name cannot be empty.' }); u.name = n; }
            if (body.kind !== undefined && KINDS.includes(body.kind)) u.kind = body.kind;
            if (body.lang !== undefined && LANGS.includes(body.lang)) u.lang = body.lang;
            if (body.active !== undefined) u.active = !!body.active;
            if (body.pin !== undefined) {
              const pin = String(body.pin);
              if (pin.length < 4 || pin.length > 20) return json(400, { error: 'PIN must be 4 to 20 characters.' });
              u.pin = hashPin(pin); u.fails = 0; u.lockUntil = 0;
            }
            await users.setJSON(username, u);
            return json(200, { user: publicUser(u) });
          }
          if (!m[2] && method === 'DELETE') {
            await users.delete(username);
            await progress.delete(username);
            return json(200, { ok: true });
          }
        }
      }

      return json(404, { error: 'Not found.' });
    } catch (err) {
      console.error(err);
      return json(500, { error: 'Something went wrong on the server. Please try again.' });
    }
  };
}
