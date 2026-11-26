// Glory G1 icons (2026-11-26): the Searing Ember item (vanilla fire charge reshaded into a glowing coal - a burning
// lump, the same family as the vanilla art) and the effect icons for Paper Cuts and Galvanic (18x18, vanilla effect
// icon style: a bold symbol with a dark outline, lit from the top left).
// Usage: node tools/glory_icons.js <dir with vanilla fire_charge.png>
const path = require('path');
const { readPng, writePng } = require('./png');
const A = path.resolve(__dirname, '../src/main/resources/assets/spirecraft/textures/');
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

// ---- Searing Ember: fire charge by brightness onto an ember ramp (black crust, red-orange cracks, yellow core)
{
  const src = readPng(path.join(process.argv[2], 'fire_charge.png'));
  const RAMP = ['#1c0e0a', '#3a1a10', '#6a2412', '#b83a14', '#ec6a1c', '#ffa83a', '#ffe08a'];
  let lo = 255, hi = 0;
  for (let i = 0; i < src.d.length; i += 4) if (src.d[i + 3]) { const L = lum(src.d[i], src.d[i + 1], src.d[i + 2]); lo = Math.min(lo, L); hi = Math.max(hi, L); }
  const out = { w: src.w, h: src.h, d: new Uint8Array(src.d.length) };
  for (let i = 0; i < src.d.length; i += 4) {
    if (!src.d[i + 3]) continue;
    const r = src.d[i], g = src.d[i + 1], b = src.d[i + 2], t = (lum(r, g, b) - lo) / Math.max(1, hi - lo);
    const warm = r > g + 30;   // the fire charge's orange veins stay the hot part
    const k = warm ? 3 + Math.round(t * 3) : Math.round(t * 2.4);
    out.d.set([...hex(RAMP[Math.min(RAMP.length - 1, k)]), src.d[i + 3]], i);
  }
  writePng(path.join(A, 'item/searing_ember.png'), out);
}

// ---- effect icons
function icon(name, draw) {
  const W = 18, img = { w: W, h: W, d: new Uint8Array(W * W * 4) };
  const g = Array.from({ length: W }, () => Array(W).fill(null));
  draw(g);
  // outline: dark pixel round every drawn one
  const outline = '#1a1420';
  const res = g.map(r => r.slice());
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (!g[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => g[y + dy] && g[y + dy][x + dx])) res[y][x] = outline;
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (res[y][x]) img.d.set([...hex(res[y][x]), 255], (y * W + x) * 4);
  writePng(path.join(A, 'mob_effect/' + name + '.png'), img);
}
// Paper Cuts: a sheet of purple parchment, a red cut slashed across it
icon('paper_cuts', g => {
  for (let y = 3; y <= 14; y++) for (let x = 4; x <= 13; x++) g[y][x] = x === 4 || y === 3 ? '#d6c4f4' : x === 13 || y === 14 ? '#7e62b0' : '#b49ae0';
  for (let y = 5; y <= 12; y += 2) for (let x = 6; x <= 11; x++) if ((x + y) % 5) g[y][x] = '#9a7ccc';
  for (let k = 0; k < 11; k++) { const x = 3 + k, y = 13 - k; if (g[y]) { g[y][x] = '#e03a3a'; if (g[y + 1]) g[y + 1][x] = '#901c1c'; } }
});
// Galvanic: a blue lightning bolt with a white core
icon('galvanic', g => {
  const BOLT = ['..........XX', '........XXX.', '......XXX...', '....XXXX....', '...XXXXXXX..', '......XXX...', '.....XXX....', '....XX......', '...XX.......', '..X.........'];
  BOLT.forEach((row, y) => [...row].forEach((c, x) => { if (c === 'X') g[y + 4][x + 3] = '#58b4f8'; }));
  for (let y = 4; y < 14; y++) for (let x = 3; x < 15; x++) if (g[y][x] && g[y][x + 1] && g[y][x - 1]) g[y][x] = '#e8f8ff';
});
console.log('wrote searing_ember, paper_cuts, galvanic');
