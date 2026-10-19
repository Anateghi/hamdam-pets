// Hamdam server for Railway: serves ./dist statically + a tiny JSON API for likes & comments (SQLite via node:sqlite).
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
const root = join(process.cwd(), 'dist');
const port = process.env.PORT || 8080;
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.xml':'application/xml', '.txt':'text/plain; charset=utf-8', '.png':'image/png', '.ico':'image/x-icon', '.json':'application/json', '.webmanifest':'application/manifest+json' };

// ---------- database ----------
const DATA_DIR = process.env.DATA_DIR || (existsSync('/data') ? '/data' : join(process.cwd(), 'data'));
let db = null, SALT = '';
try {
  const { DatabaseSync } = await import('node:sqlite');
  mkdirSync(DATA_DIR, { recursive: true });
  db = new DatabaseSync(join(DATA_DIR, 'hamdam.db'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=3000;
    CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, page TEXT NOT NULL, name TEXT NOT NULL, body TEXT NOT NULL, created_at INTEGER NOT NULL, ip_hash TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'ok');
    CREATE INDEX IF NOT EXISTS comments_page ON comments(page, status, created_at);
    CREATE TABLE IF NOT EXISTS likes (page TEXT NOT NULL, vid TEXT NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY (page, vid));`);
  SALT = db.prepare('SELECT v FROM meta WHERE k = ?').get('salt')?.v;
  if (!SALT) { SALT = randomBytes(24).toString('hex'); db.prepare('INSERT INTO meta (k, v) VALUES (?, ?)').run('salt', SALT); }
  console.log('sqlite ready at ' + join(DATA_DIR, 'hamdam.db'));
} catch (e) { console.error('sqlite unavailable, API disabled:', e.message); db = null; }
const hash = (s) => createHash('sha256').update(SALT + '|' + s).digest('hex').slice(0, 32);
const Q = db && {
  likes: db.prepare('SELECT COUNT(*) AS n FROM likes WHERE page = ?'),
  liked: db.prepare('SELECT 1 AS x FROM likes WHERE page = ? AND vid = ?'),
  like: db.prepare('INSERT OR IGNORE INTO likes (page, vid, created_at) VALUES (?, ?, ?)'),
  unlike: db.prepare('DELETE FROM likes WHERE page = ? AND vid = ?'),
  list: db.prepare("SELECT id, name, body, created_at FROM comments WHERE page = ? AND status = 'ok' ORDER BY created_at DESC LIMIT 200"),
  count: db.prepare("SELECT COUNT(*) AS n FROM comments WHERE page = ? AND status = 'ok'"),
  add: db.prepare('INSERT INTO comments (page, name, body, created_at, ip_hash) VALUES (?, ?, ?, ?, ?)'),
  dup: db.prepare('SELECT 1 AS x FROM comments WHERE ip_hash = ? AND body = ? AND created_at > ?'),
  del: db.prepare('DELETE FROM comments WHERE id = ?'),
  recent: db.prepare('SELECT id, page, name, body, created_at, status FROM comments ORDER BY created_at DESC LIMIT ?'),
};

// ---------- spam protection ----------
const buckets = new Map(); // key -> timestamps
function limited(key, max, windowMs) {
  const now = Date.now(), arr = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) { buckets.set(key, arr); return true; }
  arr.push(now); buckets.set(key, arr); return false;
}
setInterval(() => { const now = Date.now(); for (const [k, a] of buckets) if (!a.some((t) => now - t < 864e5)) buckets.delete(k); }, 6e5).unref();
const LINK = /(https?:\/\/|www\.|\bt\.me\b|\b[a-z0-9-]{2,}\.(com|net|org|ir|info|xyz|ru|io|co|biz|top|site|online|link|me|app|shop|club|pro|tk|ly|gg|in)\b|<a\s|\[url)/i;
const BAD = ['fuck','fucking','shit','bitch','cunt','dick','pussy','asshole','motherfucker','porn','casino','viagra','کیر','کص','کون','کونی','جنده','مادرجنده','کسکش','کصکش','کس‌کش','حرومزاده','حرامزاده','لاشی','گوه','بیناموس','بی‌ناموس','پفیوز','کازینو','شرط‌بندی'];
const norm = (s) => s.replace(/\u064A/g, 'ی').replace(/\u0643/g, 'ک').replace(/[\u064B-\u0652]/g, '').toLowerCase();
const tokens = (s) => norm(s).split(/[\s.,!?؟،؛:;"'()\[\]{}«»\-_/\\*~`|+=<>]+/).filter(Boolean);
const badWords = new Set(BAD.map(norm));
const profane = (s) => { const t = tokens(s); return t.some((w) => badWords.has(w) || badWords.has(w.replace(/\u200c/g, ''))) || /(.)\1{9,}/.test(s); };
const clean = (s, max) => String(s ?? '').normalize('NFC').replace(/[\u0000-\u0008\u000B-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, max + 1);

// ---------- helpers ----------
const clientIp = (req) => (req.headers['x-real-ip'] || String(req.headers['x-forwarded-for'] || '').split(',').pop() || req.socket.remoteAddress || '').trim();
const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(obj)); };
const pageCache = new Map();
function validPage(p) {
  if (typeof p !== 'string' || !/^\/(blog|tools)\/[a-z0-9-]{1,80}\/$/.test(p)) return false;
  if (!pageCache.has(p)) { let ok = false; try { ok = statSync(join(root, p, 'index.html')).isFile(); } catch {} pageCache.set(p, ok); }
  return pageCache.get(p);
}
function readBody(req, max = 4096) {
  return new Promise((resolve, reject) => { let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > max) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { reject(new Error('bad json')); } }); req.on('error', reject); });
}
function adminOk(req) {
  const tok = process.env.ADMIN_TOKEN || '', got = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (tok.length < 20 || !got) return false;
  const a = createHash('sha256').update(tok).digest(), b = createHash('sha256').update(got).digest();
  return timingSafeEqual(a, b);
}
function sameOrigin(req) { const o = req.headers.origin; if (!o) return true; try { return new URL(o).host === req.headers.host; } catch { return false; } }
const reactions = (page, vid) => ({ page, likes: Q.likes.get(page).n, liked: !!(vid && Q.liked.get(page, hash('v:' + vid))), count: Q.count.get(page).n, comments: Q.list.all(page) });

async function api(req, res, url) {
  if (!db) return json(res, 503, { error: 'سرویس نظرات موقتاً در دسترس نیست.' });
  const ip = clientIp(req), path = url.pathname, m = req.method;
  if (m !== 'GET' && !sameOrigin(req)) return json(res, 403, { error: 'forbidden' });
  try {
    if (path === '/api/reactions' && m === 'GET') {
      const page = url.searchParams.get('page'); if (!validPage(page)) return json(res, 400, { error: 'صفحه نامعتبر است.' });
      if (limited('r:' + ip, 240, 6e5)) return json(res, 429, { error: 'درخواست‌ها زیاد است.' });
      return json(res, 200, reactions(page, url.searchParams.get('vid')));
    }
    if (path === '/api/like' && m === 'POST') {
      const b = await readBody(req); if (!validPage(b.page)) return json(res, 400, { error: 'صفحه نامعتبر است.' });
      if (typeof b.vid !== 'string' || !/^[A-Za-z0-9-]{16,64}$/.test(b.vid)) return json(res, 400, { error: 'شناسه نامعتبر است.' });
      if (limited('l:' + ip, 40, 6e5) || limited('ld:' + ip, 300, 864e5)) return json(res, 429, { error: 'تعداد پسندها زیاد است؛ کمی بعد دوباره امتحان کنید.' });
      const vh = hash('v:' + b.vid);
      if (b.like === false) Q.unlike.run(b.page, vh); else Q.like.run(b.page, vh, Date.now());
      return json(res, 200, { likes: Q.likes.get(b.page).n, liked: !!Q.liked.get(b.page, vh) });
    }
    if (path === '/api/comments' && m === 'POST') {
      const b = await readBody(req); if (!validPage(b.page)) return json(res, 400, { error: 'صفحه نامعتبر است.' });
      if (b.website) return json(res, 201, { ok: true, comment: null }); // honeypot: pretend success, store nothing
      if (!(Number(b.t) >= 3000)) return json(res, 400, { error: 'کمی آهسته‌تر! چند ثانیه بعد دوباره بفرستید.' });
      if (limited('c:' + ip, 5, 6e5) || limited('cd:' + ip, 30, 864e5)) return json(res, 429, { error: 'تعداد نظرهای شما زیاد است؛ کمی بعد دوباره امتحان کنید.' });
      const name = clean(b.name, 40), body = clean(b.body, 1000);
      if (name.length < 2 || name.length > 40) return json(res, 400, { error: 'نام باید بین ۲ تا ۴۰ نویسه باشد.' });
      if (body.length < 3 || body.length > 1000) return json(res, 400, { error: 'متن نظر باید بین ۳ تا ۱۰۰۰ نویسه باشد.' });
      if (LINK.test(name) || LINK.test(body)) return json(res, 400, { error: 'گذاشتن لینک یا آدرس سایت در نظرها مجاز نیست.' });
      if (profane(name) || profane(body)) return json(res, 400, { error: 'لطفاً از کلمات نامناسب استفاده نکنید.' });
      const ih = hash('ip:' + ip), now = Date.now();
      if (Q.dup.get(ih, body, now - 864e5)) return json(res, 409, { error: 'این نظر قبلاً ثبت شده است.' });
      const r = Q.add.run(b.page, name, body, now, ih);
      return json(res, 201, { ok: true, comment: { id: Number(r.lastInsertRowid), name, body, created_at: now } });
    }
    const dm = path.match(/^\/api\/comments\/(\d+)$/);
    if (dm && m === 'DELETE') {
      if (!adminOk(req)) return json(res, 401, { error: 'unauthorized' });
      const r = Q.del.run(Number(dm[1])); return json(res, r.changes ? 200 : 404, { ok: !!r.changes, deleted: Number(dm[1]) });
    }
    if (path === '/api/admin/comments' && m === 'GET') {
      if (!adminOk(req)) return json(res, 401, { error: 'unauthorized' });
      return json(res, 200, { comments: Q.recent.all(Math.min(500, Number(url.searchParams.get('limit')) || 100)) });
    }
    if (path === '/api/health') return json(res, 200, { ok: true, db: true });
    return json(res, 404, { error: 'not found' });
  } catch (e) { return json(res, e.message === 'too large' ? 413 : 400, { error: 'درخواست نامعتبر است.' }); }
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    let p = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
    let f = join(root, p);
    if (!f.startsWith(root)) throw 0;
    let s = await stat(f).catch(() => null);
    const exists = async (x) => (await stat(x).catch(() => null))?.isFile() ? x : null;
    if (s?.isDirectory()) {
      const idx = await exists(join(f, 'index.html'));
      if (idx && !p.endsWith('/')) { res.writeHead(301, { Location: p + '/' + url.search }); return res.end(); }
      f = idx; s = idx ? await stat(idx) : null;
    } else if (!s && !extname(f)) {
      const html = await exists(f + '.html');
      if (html) { f = html; s = await stat(html); }
    }
    if (!s || !s.isFile()) { res.writeHead(404, { 'Content-Type': types['.html'], 'Cache-Control': 'no-store' }); return res.end(await readFile(join(root, '404.html')).catch(() => 'Not found')); }
    const ext = extname(f);
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' ? 'public, max-age=300' : 'public, max-age=31536000, immutable' });
    res.end(await readFile(f));
  } catch { if (!res.headersSent) { res.writeHead(400); res.end('Bad request'); } }
}).listen(port, () => console.log('listening on ' + port));
const shutdown = () => { try { db?.close(); } catch {} process.exit(0); };
process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
