// Glory G2 textures (2026-11-26): the glory flagstones of the Queen's palace (the Glory backdrop's cold blue-green
// broken flagstones - one hue, moderate contrast, grout one step darker, seamless), polished and chiseled, the arena
// altar and gate, the Royal Summons item, and the icons of Hex, Dampen, Bound, Stolen Strength and Stolen Speed.
// Usage: node tools/glory_g2_textures.js
const path = require('path');
const { writePng } = require('./png');
const T = path.resolve(__dirname, '../src/main/resources/assets/spirecraft/textures/');
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
let seed = 3;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const FLAG = ['#3a5a62', '#46686f', '#52767c', '#5e838a', '#6b9096', '#7a9ea3'];
const GOLD = ['#8a6420', '#b08430', '#d4a848', '#ecc868'];
// 2026-11-26 v2: the flagstones, the altar and the Royal Summons are gone (user: vanilla dark stone; bosses wake when you walk in)
const GONE = new Set(['block/glory_flagstone.png', 'block/polished_glory_flagstone.png', 'block/chiseled_glory_flagstone.png', 'block/glory_altar.png', 'item/royal_summons.png']);
function png(file, w, h, px) { if (GONE.has(file)) return; const o = { w, h, d: new Uint8Array(w * h * 4) }; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = px(x, y); if (c) o.d.set([...hex(c[0]), c[1] === undefined ? 255 : c[1]], (y * w + x) * 4); } writePng(path.join(T, file), o); }

// ---- glory flagstone: irregular slabs from a jittered 3x3 periodic grid (Voronoi), grout where two cells meet
{
  seed = 7;
  const pts = [];
  for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 3; gx++) pts.push([gx * 16 / 3 + 1 + rnd() * 3.4, gy * 16 / 3 + 1 + rnd() * 3.4, rnd() < 0.5 ? 2 : 3]);
  const near = (x, y) => {
    let best = [1e9, -1], second = 1e9;
    for (let i = 0; i < pts.length; i++) for (const ox of [-16, 0, 16]) for (const oy of [-16, 0, 16]) {
      const d = Math.hypot(x + 0.5 - pts[i][0] - ox, y + 0.5 - pts[i][1] - oy);
      if (d < best[0]) { second = best[0]; best = [d, i]; } else if (d < second) second = d;
    }
    return { i: best[1], edge: second - best[0] };
  };
  const grid = [];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const { i, edge } = near(x, y);
    let k = pts[i][2];
    if (edge < 0.9) k = 0;                                   // grout
    else if (edge < 1.6) k = k + 1;                          // the lit lip of each stone
    else if (rnd() < 0.07) k = k - 1;                        // a few worn specks
    grid.push(Math.max(0, Math.min(5, k)));
  }
  png('block/glory_flagstone.png', 16, 16, (x, y) => [FLAG[grid[y * 16 + x]]]);
}
// ---- polished: a smooth slab, raised bevel; chiseled: the same with a gold-inlaid lozenge and crown points
function bevelled(x, y, inner) {
  if (x === 0 || y === 0) return 4; if (x === 15 || y === 15) return 1;
  if (x === 1 || y === 1) return 3; if (x === 14 || y === 14) return 2;
  return inner;
}
seed = 11;
png('block/polished_glory_flagstone.png', 16, 16, (x, y) => [FLAG[bevelled(x, y, rnd() < 0.08 ? 3 : 2)]]);
seed = 13;
png('block/chiseled_glory_flagstone.png', 16, 16, (x, y) => {
  const d = Math.abs(x - 7.5) + Math.abs(y - 7.5);
  if (x > 1 && x < 14 && y > 1 && y < 14) {
    if (Math.abs(d - 5) < 0.6) return [GOLD[2]];
    if (Math.abs(d - 5.9) < 0.5) return [FLAG[0]];
    if (d < 2.2) return [GOLD[3]];
    if (d < 4.4) return [FLAG[3]];
  }
  return [FLAG[bevelled(x, y, 2)]];
});
// ---- the altar: a dark slab, gold rim, a glowing green rune in the middle (the Queen's colours)
png('block/glory_altar.png', 16, 16, (x, y) => {
  if (x === 0 || y === 0 || x === 15 || y === 15) return [GOLD[1]];
  if (x === 1 || y === 1) return [GOLD[3]];
  if (x === 14 || y === 14) return [GOLD[0]];
  const d = Math.abs(x - 7.5) + Math.abs(y - 7.5);
  if (d < 1.2) return ['#e8ffb0'];
  if (Math.abs(d - 3) < 0.6 || (Math.abs(x - 7.5) < 0.6 && d < 5) || (Math.abs(y - 7.5) < 0.6 && d < 5)) return ['#a8e040'];
  return [FLAG[(x + y) % 5 === 0 ? 1 : 0]];
});
// ---- the gate: a grille of dark steel bars, a cross band, see-through between
png('block/glory_gate.png', 16, 16, (x, y) => {
  const bar = x % 4 === 1 || x % 4 === 2, band = y === 3 || y === 4 || y === 11 || y === 12;
  if (!bar && !band) return null;
  const lit = (bar && x % 4 === 1) || (band && (y === 3 || y === 11));
  return [lit ? '#7a8a92' : '#4e5a62'];
});
// ---- the Royal Summons: a rolled parchment on the diagonal, a red wax seal with the Queen's crown, a green ribbon
png('item/royal_summons.png', 16, 16, (x, y) => {
  const t = x - (15 - y);   // along the diagonal (bottom-left to top-right)
  const across = (x + (15 - y)) / 2 - 7.5;
  if (Math.hypot(x - 9, y - 9) < 2.7) return [Math.hypot(x - 8.5, y - 8.5) < 1.2 ? '#f0a080' : Math.hypot(x - 9, y - 9) < 2 ? '#b8282a' : '#7a1418'];
  if (Math.abs(t) <= 3 && Math.abs(across) <= 6.5) {
    if (Math.abs(across) > 5.5) return ['#8a6a3a'];          // the rolled ends
    if (Math.abs(t) === 3) return ['#9a7a4a'];
    if (Math.abs(t - 0) < 0.6 && across < -1) return ['#4a8a3a'];   // the ribbon
    return [t < 0 ? '#f4e4b8' : '#e0c890'];
  }
  return null;
});
// ---- effect icons (18x18), drawn as symbols with a dark outline
function icon(name, rows, pal) {
  const W = 18, g = Array.from({ length: W }, (_, y) => Array.from({ length: W }, (_, x) => { const r = rows[y - Math.floor((W - rows.length) / 2)]; const c = r && r[x - Math.floor((W - r.length) / 2)]; return c && c !== '.' ? pal[c] : null; }));
  const out = g.map(r => r.slice());
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (!g[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => g[y + dy] && g[y + dy][x + dx])) out[y][x] = '#18141c';
  png('mob_effect/' + name + '.png', W, W, (x, y) => (out[y][x] ? [out[y][x]] : null));
}
icon('hex', ['....aaaaaa....', '..aabbbbbbaa..', '.abbbccccbbba.', 'abbccddddccbba', 'abbcddeeddcbba', 'abbccddddccbba', '.abbbccccbbba.', '..aabbbbbbaa..', '....aaaaaa....'],
  { a: '#2a8070', b: '#58c0a8', c: '#a0f0d8', d: '#d8ff80', e: '#1a2a20' });
icon('dampen', ['.....aa.....', '.....ab.....', '.....ab.....', '.....ab.....', '...ccccc....', '.....dd.....', '.ee..dd..ee.', '..ee....ee..', '...ee..ee...', '....eeee....', '.....ee.....'],
  { a: '#d8dce4', b: '#8a909c', c: '#b08430', d: '#6a4a2a', e: '#c08040' });
icon('bound', ['..aaa....aaa..', '.a...a..a...a.', '.a...abba...a.', '.a...a..a...a.', '..aaa....aaa..'].concat(['..............', '..cc..cc..cc..', '...cc.cc.cc...', '....ccccc.....']),
  { a: '#7ac048', b: '#a8e070', c: '#4a8a2a' });
icon('stolen_strength', ['..aaaa....', '.abbbba...', '.abbbbaa..', '.abbbbbba.', '..abbbbba.', '...aaaaa..', '..........', '...cccc...', '....cc....'], { a: '#8a3a2a', b: '#d86a4a', c: '#e0a040' });
icon('stolen_speed', ['...aaa....', '...aba....', '...aba....', '..aabba...', '.aabbbbaa.', '.aaaaaaaa.', '..........', '...cccc...', '....cc....'], { a: '#5a5a66', b: '#9a9aa8', c: '#e0a040' });
console.log('wrote flagstones, altar, gate, royal summons, 5 icons');
