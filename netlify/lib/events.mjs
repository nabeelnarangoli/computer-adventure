// Upcoming events: storage, public API, admin API, registrations and the shareable event page.
// Stores: events (one JSON per event), regs (one JSON per event: {list:[...]}), images (cover photos as base64).
import crypto from 'node:crypto';
import { inviteMail } from './invite-mail.mjs';

export const TZS = {
  'Asia/Kolkata': { label: 'IST', name: 'India time', off: 330 },
  'Asia/Dubai': { label: 'GST', name: 'UAE time', off: 240 },
  'Asia/Riyadh': { label: 'AST', name: 'Saudi time', off: 180 },
  'Asia/Qatar': { label: 'AST', name: 'Qatar time', off: 180 },
  'Europe/London': { label: 'UK', name: 'UK time', off: 0 },
};
const CURRENCIES = ['AED', 'INR', 'USD', 'SAR', 'QAR', 'OMR'];
export const EDUCATION = ['SSLC', 'Plus Two', 'Bachelors', 'Masters', 'PhD', 'Other'];
export const ROLES = ['Student', 'Parent'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slugify = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'event';
const isUrl = (s) => /^https?:\/\/[^\s]+$/i.test(String(s || ''));
// local date-time string + time zone -> UTC milliseconds
export const toUTC = (local, tz) => { if (!local) return NaN; const off = (TZS[tz] || TZS['Asia/Kolkata']).off; return Date.parse(local + ':00Z') - off * 60_000; };

function clean(b, old = {}) {
  const e = { ...old };
  const str = (k, n) => { if (b[k] !== undefined) e[k] = String(b[k] ?? '').trim().slice(0, n); };
  str('title', 120); str('details', 6000); str('summary', 240); str('start', 16); str('end', 16);
  str('locationName', 160); str('mapUrl', 600); str('onlineUrl', 600); str('regLink', 600); str('cover', 40);
  if (b.tz !== undefined) e.tz = TZS[b.tz] ? b.tz : 'Asia/Kolkata';
  if (b.mode !== undefined) e.mode = b.mode === 'online' ? 'online' : 'offline';
  if (b.paid !== undefined) e.paid = !!b.paid;
  if (b.price !== undefined) e.price = Math.max(0, Math.round(Number(b.price) * 100) / 100 || 0);
  if (b.currency !== undefined) e.currency = CURRENCIES.includes(b.currency) ? b.currency : 'AED';
  if (b.regMode !== undefined) e.regMode = ['form', 'link', 'none'].includes(b.regMode) ? b.regMode : 'form';
  if (b.regOpen !== undefined) e.regOpen = !!b.regOpen;
  if (b.published !== undefined) e.published = !!b.published;
  if (b.capacity !== undefined) e.capacity = Math.max(0, parseInt(b.capacity, 10) || 0);
  if (b.maxSeats !== undefined) e.maxSeats = Math.min(20, Math.max(1, parseInt(b.maxSeats, 10) || 1));
  return e;
}
function validate(e) {
  if (!e.title) return 'Please add the event name.';
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(e.start || '')) return 'Please add the event date and time.';
  if (e.end && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(e.end)) return 'The end time is not valid.';
  if (e.end && toUTC(e.end, e.tz) <= toUTC(e.start, e.tz)) return 'The end time must be after the start time.';
  if (e.mode === 'offline' && !e.locationName) return 'Offline event: please add the location.';
  if (e.mode === 'offline' && e.mapUrl && !isUrl(e.mapUrl)) return 'The map link must start with https://';
  if (e.mode === 'online' && e.onlineUrl && !isUrl(e.onlineUrl)) return 'The online link must start with https://';
  if (e.regMode === 'link' && !isUrl(e.regLink)) return 'Please add the registration link (starting with https://).';
  if (e.paid && !(e.price > 0)) return 'Paid event: please add the price.';
  return '';
}
const ended = (e, now = Date.now()) => (e.end ? toUTC(e.end, e.tz) : toUTC(e.start, e.tz) + 3 * 3600_000) < now;
const seatsTaken = (list) => list.filter((r) => r.status !== 'rejected' && r.status !== 'cancelled').reduce((t, r) => t + (r.seats || 1), 0);
function regState(e, list) {
  if (ended(e)) return 'ended';
  if (e.regMode === 'none') return 'none';
  if (!e.regOpen) return 'closed';
  if (e.regMode === 'form' && e.capacity && seatsTaken(list) >= e.capacity) return 'full';
  return 'open';
}
// what visitors may see: never the online joining link
function publicEvent(e, list) {
  const taken = seatsTaken(list);
  return {
    slug: e.slug, title: e.title, summary: e.summary || '', details: e.details || '', cover: e.cover ? `/api/img/${e.cover}` : '',
    start: e.start, end: e.end || '', tz: e.tz, tzLabel: (TZS[e.tz] || TZS['Asia/Kolkata']).label, startUTC: toUTC(e.start, e.tz), endUTC: e.end ? toUTC(e.end, e.tz) : null,
    mode: e.mode, locationName: e.mode === 'offline' ? e.locationName || '' : '', mapUrl: e.mode === 'offline' ? e.mapUrl || '' : '',
    paid: !!e.paid, price: e.price || 0, currency: e.currency || 'AED', regMode: e.regMode, regLink: e.regMode === 'link' ? e.regLink : '',
    state: regState(e, list), seatsLeft: e.capacity ? Math.max(0, e.capacity - taken) : null, maxSeats: e.maxSeats || 1,
  };
}

// Calendar invitations: our own email from the academy Gmail account (Apps Script mailer), with the
// event attached as a calendar invitation. Subject: "Invitation from Aqlyon Academy: <event name>".
const adminSettings = (s) => ({ whatsapp: s.whatsapp || '+919539244342', calUrl: s.calUrl || '', calEmail: s.calEmail || '', calSecret: s.calSecret || '', calNeedsUpdate: !!s.calUrl && !s.calV2 });
const calOk = (r) => r && (r.status === 'confirmed' || r.status === 'approved');
async function calPost(cfg, payload, wait = 9000) {
  if (!cfg || !cfg.calUrl) return { ok: false, error: 'Calendar invitations are not connected.' };
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), wait);
    const res = await fetch(process.env.CAL_TEST_URL || cfg.calUrl, { method: 'POST', headers: { 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ ...payload, secret: cfg.calSecret }), redirect: 'follow', signal: ctl.signal });
    clearTimeout(t);
    const txt = await res.text(); try { return JSON.parse(txt); } catch { return { ok: false, error: 'Google answered with a page instead of data. Check that the web app is deployed with access "Anyone".' }; }
  } catch (x) { return { ok: false, error: x.name === 'AbortError' ? 'Google took too long to answer.' : 'Could not reach the Apps Script mailer.' }; }
}

export function createEvents({ getStore, json }) {
  const events = () => getStore('events');
  const regs = () => getStore('regs');
  const images = () => getStore('images');
  const meta = () => getStore('meta');
  const getRegs = async (id) => ((await regs().get(id, { type: 'json' })) || { list: [] }).list;
  const all = async () => { const s = events(); const { blobs } = await s.list(); const out = []; for (const b of blobs) { const e = await s.get(b.key, { type: 'json' }); if (e) out.push(e); } return out; };
  const bySlug = async (slug) => (await all()).find((e) => e.slug === slug);
  const rawSettings = async () => (((await meta().get('settings', { type: 'json' })) || {}).events || {});
  const evSettings = async () => ({ whatsapp: (await rawSettings()).whatsapp || '+919539244342' });
  const calCfg = async () => { const s = await rawSettings(); return s.calUrl ? { calUrl: s.calUrl, calSecret: s.calSecret, calEmail: s.calEmail } : null; };
  // send invitation / update / cancellation emails; marks each registration with the result so the admin can see it
  async function calGuests(e, doc, list, kind, origin) {
    const cfg = await calCfg(); if (!cfg || !list.length) return null;
    const messages = list.map((r) => inviteMail(e, r, kind, { origin, organizer: cfg.calEmail, seq: (r.calSeq ?? -1) + 1 }));
    const out = await calPost(cfg, { action: 'mail', messages }, 25000);
    const at = new Date().toISOString(); let sent = 0;
    list.forEach((r, i) => {
      const res = out.ok ? (out.results || [])[i] || { ok: false, error: 'No answer for this email' } : { ok: false, error: out.error || 'Email error' };
      if (res.ok) { sent++; r.calSeq = (r.calSeq ?? -1) + 1; r.cal = kind === 'cancel' ? '' : at; r.calErr = ''; }
      else if (kind !== 'cancel') r.calErr = res.error || 'Email error';
    });
    await regs().setJSON(e.id, doc);
    return { ok: out.ok && sent === list.length, sent, error: out.ok ? (sent < list.length ? (out.results.find((x) => !x.ok) || {}).error || 'Some emails were not sent' : '') : out.error, quota: out.quota };
  }

  async function routes({ path, method, body, req, auth }) {
    /* ---------- public ---------- */
    let m = path.match(/^\/img\/([a-f0-9]{24})$/);
    if (m && method === 'GET') {
      const img = await images().get(m[1], { type: 'json' });
      if (!img) return new Response('Not found', { status: 404 });
      return new Response(Buffer.from(img.data, 'base64'), { status: 200, headers: { 'content-type': img.type, 'cache-control': 'public, max-age=31536000, immutable' } });
    }
    if (path === '/events' && method === 'GET') {
      const now = Date.now(); const list = (await all()).filter((e) => e.published);
      const out = []; for (const e of list) out.push(publicEvent(e, await getRegs(e.id)));
      const upcoming = out.filter((e) => e.state !== 'ended').sort((a, b) => a.startUTC - b.startUTC);
      const past = out.filter((e) => e.state === 'ended').sort((a, b) => b.startUTC - a.startUTC).slice(0, 6);
      return json(200, { upcoming, past, now });
    }
    m = path.match(/^\/events\/([a-z0-9-]{1,80})$/);
    if (m && method === 'GET') {
      const e = await bySlug(m[1]);
      if (!e || !e.published) return json(404, { error: 'Event not found.' });
      return json(200, { event: publicEvent(e, await getRegs(e.id)), whatsapp: (await evSettings()).whatsapp });
    }
    m = path.match(/^\/events\/([a-z0-9-]{1,80})\/register$/);
    if (m && method === 'POST') {
      if (body.website) return json(200, { ok: true });            // honeypot: bots fill hidden fields
      const e = await bySlug(m[1]);
      if (!e || !e.published) return json(404, { error: 'Event not found.' });
      const store = regs(); const doc = (await store.get(e.id, { type: 'json' })) || { list: [] };
      const st = regState(e, doc.list);
      if (e.regMode !== 'form') return json(400, { error: 'Registration for this event happens on another page.' });
      if (st !== 'open') return json(409, { error: st === 'full' ? 'Sorry, this event is fully booked.' : st === 'ended' ? 'This event has already ended.' : 'Registration for this event is closed.' });
      const name = String(body.name || '').trim().slice(0, 80);
      const email = String(body.email || '').trim().toLowerCase().slice(0, 80);
      const phone = String(body.phone || '').trim().slice(0, 24);
      const country = String(body.country || '').trim().toUpperCase().slice(0, 2);
      const whatsapp = String(body.whatsapp || '').trim().slice(0, 24);
      const education = EDUCATION.includes(body.education) ? body.education : '';
      const role = ROLES.includes(body.role) ? body.role : '';
      const seats = Math.min(e.maxSeats || 1, Math.max(1, parseInt(body.seats, 10) || 1));
      if (!name) return json(400, { error: 'Please enter your name.' });
      if (!EMAIL_RE.test(email)) return json(400, { error: 'Please enter a valid email address.' });
      if (!/^\+\d{1,4} \d{6,14}$/.test(phone)) return json(400, { error: 'Please enter a valid mobile number.' });
      if (!/^\+\d{1,4} \d{6,14}$/.test(whatsapp)) return json(400, { error: 'Please enter a valid WhatsApp number.' });
      if (!/^[A-Z]{2}$/.test(country)) return json(400, { error: 'Please choose your country.' });
      if (!education) return json(400, { error: 'Please choose your education level.' });
      if (!role) return json(400, { error: 'Please choose whether you are a student or a parent.' });
      if (e.capacity && seatsTaken(doc.list) + seats > e.capacity) return json(409, { error: `Only ${e.capacity - seatsTaken(doc.list)} seat(s) left.` });
      const dup = doc.list.find((r) => r.status !== 'cancelled' && r.status !== 'rejected' && (r.email === email || r.phone === phone));
      if (dup) return json(409, { error: 'You are already registered for this event with this email or mobile number.', ref: dup.ref });
      const ip = req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
      const ipKey = 'evreg-' + crypto.createHash('sha256').update(ip).digest('hex').slice(0, 24);
      const rl = (await meta().get(ipKey, { type: 'json' })) || { n: 0, since: Date.now() };
      if (Date.now() - rl.since > 3600_000) { rl.n = 0; rl.since = Date.now(); }
      if (rl.n >= 10) return json(429, { error: 'Too many registrations from here. Please try again in an hour.' });
      rl.n += 1; await meta().setJSON(ipKey, rl);
      const ref = 'AQ-' + crypto.randomBytes(3).toString('hex').toUpperCase();
      const r = { id: crypto.randomBytes(8).toString('hex'), ref, name, email, phone, whatsapp, country, education, role, seats, status: e.paid ? 'pending' : 'confirmed', at: new Date().toISOString() };
      doc.list.push(r); await store.setJSON(e.id, doc);
      const s = await evSettings();
      const origin = new URL(req.url).origin;
      const cal = calOk(r) ? await calGuests(e, doc, [r], 'invite', origin) : null;
      // free online events: the joining link is shown right away; paid ones get it after approval
      return json(201, { ref, status: r.status, seats, total: e.paid ? e.price * seats : 0, currency: e.currency || 'AED', onlineUrl: !e.paid && e.mode === 'online' ? e.onlineUrl || '' : '', whatsapp: s.whatsapp, calendar: !!(cal && cal.ok) });
    }

    /* ---------- admin ---------- */
    if (!path.startsWith('/admin/')) return null;
    if (!path.startsWith('/admin/events') && path !== '/admin/upload') return null;
    if (!auth || auth.r !== 'admin') return json(401, { error: 'Admin login needed.' });

    if (path === '/admin/upload' && method === 'POST') {
      const type = ['image/webp', 'image/jpeg', 'image/png'].includes(body.type) ? body.type : '';
      const data = String(body.data || '');
      if (!type || !data || data.length > 2_400_000) return json(400, { error: 'Please choose a JPG, PNG or WebP image (up to about 1.5 MB).' });
      const id = crypto.randomBytes(12).toString('hex');
      await images().setJSON(id, { type, data, at: new Date().toISOString() });
      return json(201, { id, url: `/api/img/${id}` });
    }
    if (path === '/admin/events/settings') {
      const all2 = (await meta().get('settings', { type: 'json' })) || {};
      if (method === 'PATCH') {
        const cur = await rawSettings(); cur.whatsapp = cur.whatsapp || '+919539244342';
        if (body.calUrl !== undefined) { const u = String(body.calUrl).trim(); if (u && !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(u)) return json(400, { error: 'Paste the Web app URL from Apps Script. It starts with https://script.google.com/macros/s/ and ends with /exec' }); cur.calUrl = u; if (!u) cur.calEmail = ''; }
        if (body.whatsapp !== undefined) { const w = String(body.whatsapp).replace(/[^\d+]/g, ''); if (!/^\+\d{8,15}$/.test(w)) return json(400, { error: 'WhatsApp number: include the country code, like +919539244342.' }); cur.whatsapp = w; }
        if (!cur.calSecret) cur.calSecret = crypto.randomBytes(18).toString('base64url');
        if (body.calUrl) { const t = await calPost(cur, { action: 'ping' }); if (!t.ok) return json(400, { error: 'The link was not saved. ' + (t.error || 'The script did not answer.') }); if (t.version !== 2) return json(400, { error: 'This is the old script. Copy the new code from this window into Apps Script, run authorize, then Deploy → Manage deployments → Edit → New version → Deploy.' }); cur.calEmail = t.email || ''; cur.calQuota = t.quota; cur.calV2 = true; }
        all2.events = cur; await meta().setJSON('settings', all2);
        return json(200, adminSettings(cur));
      }
      if (method === 'POST' && body.action === 'test') { const cur = await rawSettings(); const t = await calPost(cur, { action: 'ping' }); if (t.ok && t.version !== 2) return json(400, { error: 'Apps Script still runs the old code. Paste the new code, run authorize, then Deploy → Manage deployments → Edit → New version → Deploy.' }); return t.ok ? json(200, { ok: true, email: t.email || '', quota: t.quota }) : json(400, { error: t.error || 'The script did not answer.' }); }
      const cur = await rawSettings();
      if (!cur.calSecret) { cur.calSecret = crypto.randomBytes(18).toString('base64url'); all2.events = { ...cur }; await meta().setJSON('settings', all2); }
      return json(200, adminSettings(cur));
    }
    if (path === '/admin/events' && method === 'GET') {
      const out = [];
      for (const e of await all()) { const list = await getRegs(e.id); out.push({ ...e, state: regState(e, list), counts: { total: list.length, seats: seatsTaken(list), pending: list.filter((r) => r.status === 'pending').length } }); }
      out.sort((a, b) => toUTC(b.start, b.tz) - toUTC(a.start, a.tz));
      return json(200, { events: out, settings: adminSettings(await rawSettings()) });
    }
    if (path === '/admin/events' && method === 'POST') {
      const e = clean({ tz: 'Asia/Kolkata', mode: 'offline', regMode: 'form', regOpen: true, published: true, currency: 'AED', maxSeats: 1, ...body });
      const err = validate(e); if (err) return json(400, { error: err });
      e.id = crypto.randomBytes(8).toString('hex');
      const used = new Set((await all()).map((x) => x.slug)); let slug = slugify(e.title); let n = 2; while (used.has(slug)) slug = `${slugify(e.title)}-${n++}`;
      e.slug = slug; e.createdAt = new Date().toISOString();
      await events().setJSON(e.id, e);
      return json(201, { event: e });
    }
    m = path.match(/^\/admin\/events\/([a-f0-9]{16})(\/regs(?:\/([a-f0-9]{16}))?)?$/);
    if (m) {
      const store = events(); const e = await store.get(m[1], { type: 'json' });
      if (!e) return json(404, { error: 'Event not found.' });
      if (m[2] && m[2].startsWith('/regs')) {
        const rs = regs(); const doc = (await rs.get(e.id, { type: 'json' })) || { list: [] };
        if (!m[3] && method === 'GET') return json(200, { regs: doc.list, calendar: !!(await rawSettings()).calUrl });
        if (!m[3] && method === 'POST' && body.action === 'invite-all') {
          const skip = new Set(body.skip || []);   // ones that already failed in this round
          const all = doc.list.filter((r) => calOk(r) && !r.cal && !skip.has(r.id)), todo = all.slice(0, 10);
          if (!todo.length) return json(200, { ok: true, invited: 0, left: 0, regs: doc.list });
          const out = await calGuests(e, doc, todo, 'invite', new URL(req.url).origin);
          if (!out) return json(400, { error: 'Connect calendar invitations first (Events → Connect).' });
          return json(200, { ok: out.ok, invited: out.sent, failed: todo.filter((r) => !r.cal).map((r) => r.id), left: all.length - todo.length, error: out.error || '', quota: out.quota, regs: doc.list });
        }
        const r = doc.list.find((x) => x.id === m[3]);
        if (!r) return json(404, { error: 'Registration not found.' });
        if (method === 'PATCH') {
          const was = calOk(r);
          if (['pending', 'approved', 'confirmed', 'rejected', 'cancelled'].includes(body.status)) r.status = body.status;
          r.updatedAt = new Date().toISOString(); await rs.setJSON(e.id, doc);
          let cal = null;
          if (!was && calOk(r)) cal = await calGuests(e, doc, [r], 'invite', new URL(req.url).origin);
          else if (was && !calOk(r) && r.cal) cal = await calGuests(e, doc, [r], 'cancel', new URL(req.url).origin);
          return json(200, { reg: r, onlineUrl: e.onlineUrl || '', calendar: cal ? (cal.ok ? 'ok' : cal.error) : '' });
        }
        if (method === 'DELETE') { doc.list = doc.list.filter((x) => x.id !== r.id); await rs.setJSON(e.id, doc); return json(200, { ok: true }); }
      }
      if (!m[2] && method === 'PATCH') {
        const n = clean(body, e); const err = validate(n); if (err) return json(400, { error: err });
        n.updatedAt = new Date().toISOString(); await store.setJSON(e.id, n);
        // keep the calendar invitation in step: new name, time or place is sent to every guest
        let cal = '';
        const keys = ['title', 'start', 'end', 'tz', 'mode', 'locationName', 'mapUrl', 'onlineUrl', 'summary'];
        if (keys.some((k) => (e[k] || '') !== (n[k] || ''))) {
          const doc = (await regs().get(e.id, { type: 'json' })) || { list: [] };
          const invited = doc.list.filter((r) => calOk(r) && r.cal);
          if (invited.length) { const c = await calGuests(n, doc, invited.slice(0, 25), 'update', new URL(req.url).origin); cal = c && c.ok ? 'ok' : (c && c.error) || 'Email error'; }
        }
        return json(200, { event: n, calendar: cal });
      }
      if (!m[2] && method === 'DELETE') { await store.delete(e.id); await regs().delete(e.id); if (e.cover) await images().delete(e.cover); return json(200, { ok: true }); }
    }
    return null;
  }

  // Shareable event page with link-preview tags (WhatsApp, Facebook, LinkedIn show the cover and title)
  async function page(slug, origin) {
    const e = await bySlug(slug);
    if (!e || !e.published) return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Event not found</title><body style="font-family:sans-serif;padding:40px;text-align:center"><h1>Event not found</h1><p><a href="/#events">See upcoming events</a></p>`, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
    const pe = publicEvent(e, await getRegs(e.id));
    const desc = (e.summary || e.details || '').replace(/\s+/g, ' ').slice(0, 200);
    const img = pe.cover ? origin + pe.cover : origin + '/img/og-default.png';
    const url = `${origin}/events/${e.slug}`;
    const ld = { '@context': 'https://schema.org', '@type': 'Event', name: e.title, description: desc, image: [img], startDate: new Date(pe.startUTC).toISOString(), ...(pe.endUTC ? { endDate: new Date(pe.endUTC).toISOString() } : {}),
      eventAttendanceMode: e.mode === 'online' ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode', eventStatus: 'https://schema.org/EventScheduled',
      location: e.mode === 'online' ? { '@type': 'VirtualLocation', url } : { '@type': 'Place', name: e.locationName, address: e.locationName },
      organizer: { '@type': 'Organization', name: 'Aqlyon Career Discovery Centre', url: origin },
      offers: { '@type': 'Offer', price: e.paid ? e.price : 0, priceCurrency: e.currency || 'AED', url, availability: pe.state === 'open' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut' } };
    const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(e.title)} · Aqlyon Career Discovery Centre</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Aqlyon Career Discovery Centre">
<meta property="og:title" content="${esc(e.title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}"><meta property="og:url" content="${esc(url)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/img/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Instrument+Sans:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/site/site.css"><link rel="stylesheet" href="/site/events.css">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
</head><body class="evpage">
<header class="evtop"><a class="brand" href="/"><img src="/img/aqlyon-q.png" alt="" width="34" height="34"><span><b>Aqlyon</b><small>Career Discovery Centre</small></span></a><a class="evback" href="/#events">All events</a></header>
<main id="ev" data-slug="${esc(e.slug)}"><noscript><h1>${esc(e.title)}</h1><p>${esc(desc)}</p></noscript></main>
<script>window.EVENT=${JSON.stringify(pe).replace(/</g, '\\u003c')};</script>
<script src="/js/countries.js"></script><script src="/site/events.js"></script>
</body></html>`;
    return new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
  }

  return { routes, page };
}
