// Local helper for drawing textures as smooth art first (user 2026-11-25: "draw non-pixel art, then pixelize").
// Serves tools/art/*.html; the page POSTs each 256x256 canvas as PNG to /save?name=<block|item>__<id>, which is
// written to tools/art/hires/. Then `node tools/art/pixelize_tex.js` turns them into 16x16 textures.
// Usage: node tools/art/server.js [port]   (default 4317)
const http = require('http'), fs = require('fs'), path = require('path');
const DIR = __dirname, OUT = path.join(DIR, 'hires'), PORT = +process.argv[2] || 4317;
fs.mkdirSync(OUT, { recursive: true });
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'POST' && url.pathname === '/save') {
    const name = (url.searchParams.get('name') || '').replace(/[^a-z0-9_]/g, '');
    if (!name) { res.writeHead(400); return res.end('bad name'); }
    const chunks = [];
    req.on('data', c => chunks.push(c)).on('end', () => {
      fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.concat(chunks));
      res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('saved ' + name);
    });
    return;
  }
  const file = path.join(DIR, url.pathname === '/' ? 'textures.html' : path.normalize(url.pathname).replace(/^[\\/]+/, ''));
  if (!file.startsWith(DIR) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  const type = file.endsWith('.html') ? 'text/html; charset=utf-8' : file.endsWith('.js') ? 'text/javascript' : file.endsWith('.png') ? 'image/png' : 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log('art server on http://localhost:' + PORT));
