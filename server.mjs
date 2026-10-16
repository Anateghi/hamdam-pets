// Minimal zero-dependency static server for Railway (serves ./dist)
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
const root = join(process.cwd(), 'dist');
const port = process.env.PORT || 8080;
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.xml':'application/xml', '.txt':'text/plain; charset=utf-8', '.png':'image/png', '.ico':'image/x-icon', '.json':'application/json', '.webmanifest':'application/manifest+json' };
http.createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
    let f = join(root, p);
    if (!f.startsWith(root)) throw 0;
    let s = await stat(f).catch(() => null);
    const exists = async (x) => (await stat(x).catch(() => null))?.isFile() ? x : null;
    if (s?.isDirectory()) {
      const idx = await exists(join(f, 'index.html'));
      if (idx && !p.endsWith('/')) { const u = new URL(req.url, 'http://x'); res.writeHead(301, { Location: p + '/' + u.search }); return res.end(); }
      f = idx; s = idx ? await stat(idx) : null;
    } else if (!s && !extname(f)) {
      const html = await exists(f + '.html');
      if (html) { f = html; s = await stat(html); }
    }
    if (!s || !s.isFile()) { res.writeHead(404, { 'Content-Type': types['.html'], 'Cache-Control': 'no-store' }); return res.end(await readFile(join(root, '404.html')).catch(() => 'Not found')); }
    const ext = extname(f);
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' ? 'public, max-age=300' : 'public, max-age=31536000, immutable' });
    res.end(await readFile(f));
  } catch { res.writeHead(400); res.end('Bad request'); }
}).listen(port, () => console.log('listening on ' + port));
