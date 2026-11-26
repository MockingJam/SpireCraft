// Biome textures v6 (v3.6 user round, run after biome_v5_textures.js):
//   bluebell_cap (no green: blue caps on pale stems), hive_soil_bricks (back to the vanilla mud-brick layout, each brick
//   a little darker and more contrasted, darker joints), silk_hive (fine threads, small sway, low contrast), twig_nest
//   (solid again: packed upright twigs, tone changing often), hive_cache (the comb untouched, every hole filled with a
//   glossy honey bubble), junk_block + item/scrap (iron-grey machine parts: plates, a gear, a bearing, nuts), core
//   crystal (crystals pointing every way, lit from one side, filling the block), tarnished / derelict automaton alloy
//   (the brass texture kept, its colour browning in blotches and overall, like vanilla copper weathering), paving
//   stones (round cobbles covering the whole face), byrdonis_egg_side / _top (cream, big orange-red spots).
// Usage: node tools/biome_v6_textures.js <vfull dir>
const REPO_ROOT = require('path').resolve(__dirname, '..').split(require('path').sep).join('/') + '/';   // this checkout (was hard-coded to D:/MCmodev/SpireCraft)
const fs = require('fs');
const { readPng, writePng } = require('./png');
const V = process.argv[2] + '/assets/minecraft/textures/';
const OUT = REPO_ROOT + 'src/main/resources/assets/spirecraft/textures/';
const v = n => readPng(V + n + '.png');
const own = n => readPng(OUT + n + '.png');
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const toHex = c => '#' + c.map(n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('');
const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const clone = img => ({ w: img.w, h: img.h, d: new Uint8Array(img.d) });
const blank = (w = 16, h = 16) => ({ w, h, d: new Uint8Array(w * h * 4) });
const get = (img, x, y) => { const i = ((((y % img.h) + img.h) % img.h) * img.w + (((x % img.w) + img.w) % img.w)) * 4; return [img.d[i], img.d[i + 1], img.d[i + 2], img.d[i + 3]]; };
const set = (img, x, y, c, a = 255) => { x = ((x % img.w) + img.w) % img.w; y = ((y % img.h) + img.h) % img.h; const i = (y * img.w + x) * 4; img.d[i] = c[0]; img.d[i + 1] = c[1]; img.d[i + 2] = c[2]; img.d[i + 3] = a; };
const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const pick = (ramp, t) => hex(ramp[Math.max(0, Math.min(ramp.length - 1, Math.round(t * (ramp.length - 1))))]);
const mul = (c, k) => c.slice(0, 3).map((n, i) => Math.max(0, Math.min(255, Math.round(n * (Array.isArray(k) ? k[i] : k)))));
function recolor(src, ramp, range = [0, 1], gamma = 1) {
  const img = clone(src); let lo = 255, hi = 0;
  for (let i = 0; i < img.d.length; i += 4) if (img.d[i + 3]) { const L = lum(img.d[i], img.d[i + 1], img.d[i + 2]); lo = Math.min(lo, L); hi = Math.max(hi, L); }
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) { const [r, g, b, a] = get(src, x, y); if (!a) continue;
    const t = Math.pow(hi > lo ? (lum(r, g, b) - lo) / (hi - lo) : 0.5, gamma); set(img, x, y, pick(ramp, range[0] + t * (range[1] - range[0])), a); }
  return img;
}
function rampOf(img) {
  const cols = []; for (let i = 0; i < img.d.length; i += 4) if (img.d[i + 3]) cols.push([img.d[i], img.d[i + 1], img.d[i + 2]]);
  cols.sort((a, b) => lum(...a) - lum(...b)); return [0.03, 0.2, 0.4, 0.6, 0.8, 0.97].map(q => toHex(cols[Math.floor(q * (cols.length - 1))]));
}
function cell(pts, x, y, W = 16) {
  let b = 1e9, s2 = 1e9, bi = 0;
  pts.forEach(([px, py], i) => { for (const ox of [-W, 0, W]) for (const oy of [-W, 0, W]) { const d = Math.hypot(x + 0.5 - px - ox, y + 0.5 - py - oy); if (d < b) { s2 = b; b = d; bi = i; } else if (d < s2) s2 = d; } });
  return { d: b, edge: s2 - b, i: bi, p: pts[bi] };
}
/** wrapped offset from a point (the shortest way round the tile) */
const wrapD = (a, b) => { let d = a - b; if (d > 8) d -= 16; if (d < -8) d += 16; return d; };
const jobs = {}, block = (n, i) => { jobs['block/' + n] = i; }, item = (n, i) => { jobs['item/' + n] = i; };

// ---- bluebell cap (user: no green on a mushroom, the green tuft on the caps was odd): three bell caps of the giant
// bluebell's blue on pale blue-white stems
{
  const rows = [
    '................',
    '..........abba..',
    '.........abcdba.',
    '..abba...bccdcb.',
    '.abcdba..aabbaa.',
    '.bccdcb...eSe...',
    '.aabbaa....sS...',
    '..esSe.....sS...',
    '...sS......sS...',
    '...sS.....sS....',
    '...ssS....sS....',
    '....sS....sS....',
    '....sS...ssS....',
    '....sS...sS.....',
    '....sS...sS.....',
    '...ssSs.ssSs....'];
  const pal = { a: '#1c3478', b: '#2c56b4', c: '#4a82e2', d: '#9cc8ff', e: '#3a4a6e', s: '#dfe4f0', S: '#a8b0c8' };
  const img = blank();
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) set(img, x, y, hex(pal[ch])); }));
  block('bluebell_cap', img);
}

// ---- hive soil bricks (user: the first version - vanilla mud-brick size - each brick darker and more contrasted,
// darker joints)
{
  const soil = rampOf(own('block/hive_soil'));
  const S = ['#2e2214', ...soil.map(c => toHex(mul(hex(c), 0.86)))];   // one step darker at the bottom for the joints
  const mb = v('block/mud_bricks');
  const img = recolor(mb, S, [0, 1], 1.15);
  // vanilla's mortar is its darkest tone: push it a step darker still
  let lo = 255; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const c = get(mb, x, y); lo = Math.min(lo, lum(c[0], c[1], c[2])); }
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const c = get(mb, x, y); if (lum(c[0], c[1], c[2]) < lo + 6) set(img, x, y, hex('#241a10')); }
  block('hive_soil_bricks', img);
}

// ---- silk hive (user: thinner threads, less sway in each turn, less contrast between them - finer)
{
  const SILK = ['#c4bdae', '#cdc7b9', '#d6d1c4', '#dfdbcf', '#e7e4da', '#efede5'];
  const img = blank();
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const yy = y + 0.8 * Math.sin((x / 16) * Math.PI * 2 + 0.6) + 0.5 * Math.sin((x / 16) * Math.PI * 4);
    const th = Math.floor(yy / 2), inTh = ((yy % 2) + 2) % 2;   // 2-px threads
    let t = 2.6 + (hash(th & 7, 3, 61) - 0.5) * 1.0 + (inTh < 0.9 ? 0.6 : -0.4);
    if (hash(x, y, 62) < 0.08) t += 0.7;                         // a loose fibre
    set(img, x, y, pick(SILK, Math.max(0, Math.min(1, t / 5))));
  }
  block('silk_hive', img);
}

// ---- twig nest (user: solid again like the first one; on top of the last version, the twigs' light / dark changes
// packed denser): upright reddish twigs side by side, each changing tone every couple of pixels, dark bark between
{
  const T = ['#2e140c', '#46200f', '#5e2c18', '#783a22', '#924c2c', '#aa6038', '#c07a48'];
  const img = blank();
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) set(img, x, y, hex(T[hash(x, y, 90) < 0.6 ? 0 : 1]));
  const put = (x, y, t) => set(img, x, y, hex(T[Math.max(0, Math.min(6, t))]));
  for (let i = 0; i < 9; i++) {   // upright twigs, wavering, 1-2 px wide
    const x0 = Math.round(i * 16 / 9 + hash(i, 1, 91) * 0.8), wide = hash(i, 5, 91) < 0.6;
    let seg = 0, tone = 4;
    for (let y = 0; y < 16; y++) {
      if (y >= seg) { seg = y + 1 + Math.floor(hash(i, y, 94) * 3); tone = 3 + Math.floor(hash(i, y, 95) * 4); }   // a new stretch of colour every 1-3 px
      const x = x0 + Math.round(Math.sin(y * 0.45 + i * 1.7) * 0.7);
      put(x, y, tone);
      if (wide) put(x + 1, y, tone - 2);                           // its shaded right side
      if (hash(x, y, 96) < 0.12) put(x, y, 6);                     // a knot catching the light
    }
  }
  for (let i = 0; i < 3; i++) {   // a few twigs slanting across
    const y0 = 2 + i * 5 + Math.round(hash(i, 3, 93) * 2), k = i % 2 ? 0.4 : -0.4;
    for (let x = 0; x < 16; x++) { if (hash(x, i, 97) < 0.2) continue; const y = Math.round(y0 + k * x); put(x, y, 5 - (x % 3 === 0 ? 1 : 0)); put(x, y + 1, 1); }
  }
  block('twig_nest', img);
}

// ---- hive cache (user: the comb exactly as it is, and in its holes honey bubbles like the old cache's)
{
  const comb = own('block/hive_comb'), out = clone(comb);
  const HONEY = ['#7e3e06', '#a85a0c', '#cc7c16', '#e69e28', '#f6c450', '#fff0b4'];
  let lo = 255, hi = 0; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const c = get(comb, x, y); const L = lum(c[0], c[1], c[2]); lo = Math.min(lo, L); hi = Math.max(hi, L); }
  const hole = (x, y) => { const c = get(comb, x, y); return lum(c[0], c[1], c[2]) < lo + (hi - lo) * 0.3; };
  const seen = new Uint8Array(256);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (seen[y * 16 + x] || !hole(x, y)) continue;
    const cells = [], q = [[x, y]]; seen[y * 16 + x] = 1;
    while (q.length) { const [a, b] = q.pop(); cells.push([a, b]); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = (a + dx + 16) % 16, ny = (b + dy + 16) % 16; if (!seen[ny * 16 + nx] && hole(nx, ny)) { seen[ny * 16 + nx] = 1; q.push([nx, ny]); } } }
    const ux = cells.map(([a]) => x + wrapD(a, x)), uy = cells.map(([, b]) => y + wrapD(b, y));
    const cx = ux.reduce((p, q2) => p + q2, 0) / cells.length, cy = uy.reduce((p, q2) => p + q2, 0) / cells.length, R = Math.sqrt(cells.length / Math.PI) + 0.4;
    cells.forEach(([a, b], i) => {
      const dx = (ux[i] + 0.5 - cx - 0.5) / R, dy = (uy[i] + 0.5 - cy - 0.5) / R, d = Math.hypot(dx, dy);
      let t = 3.2 - d * 1.6 + (-dx - dy) * 0.9;                       // a dome lit from the upper left
      if (dx < -0.15 && dy < -0.15 && d < 0.75 && d > 0.25) t = 5.2;   // the shine
      set(out, a, b, pick(HONEY, Math.max(0, Math.min(1, t / 5))));
    });
  }
  block('hive_cache', out);
}

// ---- junk (user: one iron grey-black tone, machine parts you can make out - plates, bars, bearings - packed evenly,
// no long strips or triangles); the scrap item is the same parts in an even, round clump
const IRON = ['#16171a', '#24262a', '#34373d', '#474b52', '#5e636b', '#7b8189', '#a0a6ae'];
function junkSheet(seed) {
  const img = blank(), tone = new Float32Array(256).fill(-1);
  const T = (x, y, t) => { x = ((x % 16) + 16) % 16; y = ((y % 16) + 16) % 16; tone[y * 16 + x] = t; };
  // the packed background: small broken bits, each its own tone, lit on the top-left
  const pts = []; for (let i = 0; i < 18; i++) pts.push([hash(i, 1, seed) * 16, hash(i, 2, seed) * 16]);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const c = cell(pts, x, y); T(x, y, c.edge < 0.7 ? 0.3 : 1.6 + hash(c.i, 3, seed) * 1.6 + (wrapD(c.p[0], x + 0.5) + wrapD(c.p[1], y + 0.5) > 0 ? 0.5 : 0)); }
  // a riveted plate
  const plate = (x0, y0, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) T(x0 + x, y0 + y, (x === 0 || y === 0) ? 4.4 : (x === w - 1 || y === h - 1) ? 1.4 : 3.2 + (hash(x0 + x, y0 + y, 7) < 0.15 ? 0.5 : 0)); for (const [rx, ry] of [[1, 1], [w - 2, 1], [1, h - 2], [w - 2, h - 2]]) T(x0 + rx, y0 + ry, 5.2); };
  // a gear: a toothed ring with a hub hole
  const gear = (cx, cy, R) => { for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) { const d = Math.hypot(x, y), a = Math.atan2(y, x); const tooth = Math.cos(a * 8) > 0.2; if (d > R + (tooth ? 0.9 : 0)) continue; T(cx + x, cy + y, d < 1.1 ? 0.2 : d < 1.9 ? 4.6 : d < 2.5 ? 2.2 : 3.6 + (-x - y) / (d + 0.01) * 0.8); } };
  // a bearing: outer race, balls, inner race, the bore
  const bearing = (cx, cy) => { for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) { const d = Math.hypot(x, y); if (d > 3.2) continue; const ball = d > 1.4 && d < 2.4 && Math.cos(Math.atan2(y, x) * 6) > 0.3; T(cx + x, cy + y, d < 0.8 ? 0 : d < 1.5 ? 3.6 : d < 2.4 ? (ball ? 5 : 1) : 4 - (x + y) * 0.25); } };
  // a hex nut and short bars (stubby - no long strips)
  const nut = (cx, cy) => { for (let y = -1; y <= 1; y++) for (let x = -2; x <= 2; x++) if (Math.abs(x) + Math.abs(y) * 0.6 <= 2.1) T(cx + x, cy + y, x === 0 && y === 0 ? 0.3 : y < 0 ? 4.6 : 3.2); };
  const bar = (x0, y0, len, vert) => { for (let k = 0; k < len; k++) { const x = vert ? x0 : x0 + k, y = vert ? y0 + k : y0; T(x, y, 4.2); T(vert ? x + 1 : x, vert ? y : y + 1, 2.2); } };
  plate(9, 1, 6, 5); plate(1, 10, 5, 5);
  bar(2, 2, 4, false); bar(13, 9, 4, true); bar(7, 13, 3, false);
  gear(4, 6, 3.1); bearing(11, 11); nut(9, 7); nut(14, 15);
  for (let i = 0; i < 256; i++) set(img, i % 16, i >> 4, pick(IRON, Math.max(0, Math.min(1, (tone[i] + 0.9) / 6.6))));
  return img;
}
{
  const j = junkSheet(131);
  block('junk_block', j);
  // the item: the same parts in a round, even clump (an outline one shade darker)
  const sc = blank(), inside = (x, y) => Math.hypot(x - 7.5, (y - 8) * 1.1) < 6.4 + 0.25 * Math.sin(Math.atan2(y - 8, x - 7.5) * 3);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (!inside(x, y)) continue;
    const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
    set(sc, x, y, edge ? hex(IRON[0]) : get(j, x + 3, y + 2));
  }
  item('scrap', sc);
}

// ---- core crystal (user: the crystals all pointed one way and had odd dark-blue patches): crystals of every heading
// fill the block, each with two long facets - the one facing the upper left lit, the other in half shade - a lighter
// tip, thin teal seams between them, a glint here and there; no navy
{
  const SKY = ['#13708a', '#1c90aa', '#2eb0c8', '#52cade', '#8ae2f0', '#d0f8ff'];
  const pts = [[2.5, 3], [8, 2], [13.5, 4.5], [5, 8.5], [11, 9], [2, 13.5], [8, 14], [14, 13]];
  const heads = pts.map((_, i) => hash(i, 4, 83) * Math.PI);   // each crystal's axis
  function crystal(cracked) {
    const img = blank();
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const c = cell(pts, x, y), th = heads[c.i];
      const dx = -wrapD(c.p[0], x + 0.5), dy = -wrapD(c.p[1], y + 0.5);
      const u = dx * Math.cos(th) + dy * Math.sin(th), w = -dx * Math.sin(th) + dy * Math.cos(th);   // along / across the axis
      const nx = -Math.sin(th) * Math.sign(w || 1), ny = Math.cos(th) * Math.sign(w || 1);            // the facet's normal
      let t = 3 + 1.4 * (-nx - ny) / Math.SQRT2;                                                     // light from the upper left
      t += Math.abs(u) > 2.2 ? 0.6 : 0;                                                              // the tips
      if (c.edge < 0.6) t = 1;                                                                       // the seam
      else if (Math.abs(w) < 0.5 && hash(x, y, 84) < 0.35) t = 5;                                    // the ridge glints
      if (cracked) { t -= 0.6; if (hash(x, y, 81) < 0.06) t = 0.4; }
      set(img, x, y, pick(SKY, Math.max(0, Math.min(1, t / 5))));
    }
    return img;
  }
  block('core_crystal_block', crystal(false));
  block('cracked_core_crystal_block', crystal(true));
}

// ---- automaton alloy tarnish (user: keep the brass texture, only its colour changes - browning in blotches and
// overall, the first stage already visibly changed, like vanilla copper weathering)
{
  const base = own('block/automaton_alloy_block');
  const ex = v('block/exposed_copper'), we = v('block/weathered_copper');
  const patch = (img, x, y) => { const c = get(img, x, y); return c[1] > c[0] + 8; };   // vanilla's patina blotches
  const tarn = clone(base);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) set(tarn, x, y, mul(get(base, x, y), patch(ex, x, y) ? [0.66, 0.52, 0.38] : [0.84, 0.74, 0.6]));
  block('tarnished_automaton_alloy_block', tarn);
  const der = clone(base);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) set(der, x, y, mul(get(base, x, y), patch(we, x, y) ? [0.5, 0.4, 0.3] : [0.68, 0.57, 0.45]));
  for (const [cx, cy, r] of [[4, 5, 2], [11, 11, 2.5], [12, 3, 1.5]]) for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {   // dents
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); if (d > r) continue;
    set(der, x, y, mul(get(der, x, y), d > r - 1 ? (y + 0.5 < cy ? 0.75 : 1.12) : 0.88));
  }
  block('derelict_automaton_alloy_block', der);
}

// ---- paving stones (user: cover the whole ground, rounder stones): round cobbles packed edge to edge, each domed and
// lit from the upper left, dark earth in the narrow gaps
{
  const ST = ['#4a463e', '#66655e', '#7a7a72', '#8e8e86', '#a2a29a', '#b6b6ae'];
  const pts = []; for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) pts.push([i * 16 / 3 + 2.7 + (hash(i, j, 141) - 0.5) * 1.6 + (j % 2) * 1.3, j * 16 / 3 + 2.7 + (hash(i, j, 142) - 0.5) * 1.4]);
  const img = blank();
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const c = cell(pts, x, y), dx = -wrapD(c.p[0], x + 0.5), dy = -wrapD(c.p[1], y + 0.5), R = 2.9 + hash(c.i, 3, 143) * 0.4;
    const d = Math.hypot(dx, dy) / R;
    if (c.edge < 0.8 || d > 1.12) { set(img, x, y, hex(ST[0])); continue; }
    let t = 3 + (hash(c.i, 4, 144) - 0.5) * 1.2 - d * 1.2 + (-dx - dy) / R * 0.8 + (hash(x, y, 145) < 0.12 ? 0.5 : 0);
    set(img, x, y, pick(ST, Math.max(0.2, Math.min(1, t / 5))));
  }
  block('paving_stones', img);
}

// ---- Byrdonis egg (user: smaller, square in section, no pink, bigger orange-red spots): cream shell, a few big
// orange-red spots and some small ones; one side sheet (body rows 5-15, crown rows 3-4) and the top
{
  const SHELL = ['#cbbb98', '#dacdae', '#e7dcc2', '#f1e9d6', '#f9f4e8'];
  const SPOT = ['#9c2c10', '#c8441a', '#e2622c'];
  const shell = (x, y, s) => pick(SHELL, 0.55 + (hash(x, y, s) - 0.5) * 0.3 + (x < 6 ? 0.15 : x > 11 ? -0.15 : 0));
  const spots = (img, s, list) => { for (const [cx, cy, r] of list) for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) { const d = Math.hypot(x, y); if (d > r) continue; set(img, cx + x, cy + y, hex(SPOT[d > r - 0.8 ? 0 : x + y < 0 ? 2 : 1])); } };
  const side = blank(), top = blank();
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { set(side, x, y, shell(x, y, 151)); set(top, x, y, shell(x, y, 152)); }
  spots(side, 0, [[6, 8, 2.6], [12, 13, 2.2], [11, 5, 1.4], [3, 13, 1.2], [13, 9, 0.8]]);
  spots(top, 0, [[7, 6, 2.4], [11, 10, 1.6], [5, 11, 1.0]]);
  block('byrdonis_egg_side', side);
  block('byrdonis_egg_top', top);
  for (const f of ['top', 'bottom', 'north', 'south', 'east', 'west']) { const p = OUT + `block/byrdonis_egg_${f}.png`; if (fs.existsSync(p)) fs.unlinkSync(p); }
}

for (const [k, img] of Object.entries(jobs)) writePng(OUT + k + '.png', img);
console.log('wrote', Object.keys(jobs).length);
