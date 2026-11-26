// Glory G3 textures (2026-11-26): the Specimen Tag (an iron tag on a chain loop, a number stamped on it, a rust spot)
// and the Wound effect icon (a red gash with dark edges). Usage: node tools/glory_g3_textures.js
const path = require('path');
const { writePng } = require('./png');
const T = path.resolve(__dirname, '../src/main/resources/assets/spirecraft/textures/');
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
function draw(file, W, rows, pal, outline) {
  const g = Array.from({ length: W }, (_, y) => Array.from({ length: W }, (_, x) => { const r = rows[y - Math.floor((W - rows.length) / 2)]; const c = r && r[x - Math.floor((W - r.length) / 2)]; return c && c !== '.' ? pal[c] : null; }));
  const out = g.map(r => r.slice());
  if (outline) for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (!g[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => g[y + dy] && g[y + dy][x + dx])) out[y][x] = outline;
  const o = { w: W, h: W, d: new Uint8Array(W * W * 4) };
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (out[y][x]) o.d.set([...hex(out[y][x]), 255], (y * W + x) * 4);
  writePng(path.join(T, file), o);
}
draw('mob_effect/wound.png', 18, [
  '...........a', '.........aab', '.......aabba', '.....aabba..', '...aabba....', '.aabba......', 'abba........', 'ba..........'],
  { a: '#5a1010', b: '#d83030' }, '#18141c');
console.log('wrote wound');
