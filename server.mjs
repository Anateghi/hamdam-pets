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
    if (s?.isDirectory()) { f = join(f, 'index.html'); s = await stat(f).catch(() => null); }
    if (!s && !extname(f)) { res.writeHead(301, { Location: p + '/' }); return res.end(); }
    if (!s) { res.writeHead(404, { 'Content-Type': types['.html'] }); return res.end(await readFile(join(root, '404.html'))); }
    const ext = extname(f);
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' ? 'public, max-age=300' : 'public, max-age=31536000, immutable' });
    res.end(await readFile(f));
  } catch { res.writeHead(400); res.end('Bad request'); }
}).listen(port, () => console.log('listening on ' + port));
