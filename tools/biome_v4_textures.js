// Biome textures v4 (v3.3 user round, run after biome_v3_textures.js):
//   dock_bricks, cracked_dock_bricks - fired harbour mud bricks (vanilla mud bricks, fired dark umber), item/dock_brick
//   quicksand                        - orange-yellow sand (vanilla sand)
//   hive_rock_bricks (+ cracked, chiseled) - vanilla stone bricks in hive rock colours
//   packed_hive_soil, hive_soil_bricks     - vanilla packed mud / mud bricks in hive soil colours
//   thatch, thatch_top               - the Kin's roofs: vanilla hay, golden ochre, laid in overlapping courses
//   webbed_hive_soil                 - hardened hive soil shot through with silk threads (outside the web nests)
//   twig_nest                        - woven twigs (the Byrdonis nest)
// Usage: node tools/biome_v4_textures.js <vfull dir>
const fs = require('fs');
const { readPng, writePng } = require('./png');
const V = process.argv[2] + '/assets/minecraft/textures/';
const OUT = 'D:/MCmodev/SpireCraft/src/main/resources/assets/spirecraft/textures/';
const v = n => readPng(V + n + '.png');
const own = n => readPng(OUT + n + '.png');

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const toHex = c => '#' + c.map(n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('');
const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const clone = img => ({ w: img.w, h: img.h, d: new Uint8Array(img.d) });
const get = (img, x, y) => { const i = (((y % img.h) + img.h) % img.h * img.w + ((x % img.w) + img.w) % img.w) * 4; return [img.d[i], img.d[i + 1], img.d[i + 2], img.d[i + 3]]; };
const set = (img, x, y, c, a = 255) => { const i = (y * img.w + x) * 4; img.d[i] = c[0]; img.d[i + 1] = c[1]; img.d[i + 2] = c[2]; img.d[i + 3] = a; };
const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const pick = (ramp, t) => hex(ramp[Math.max(0, Math.min(ramp.length - 1, Math.round(t * (ramp.length - 1))))]);

/** Luminance-rank recolour (like biome_textures.js recolor with one rule): shape and light stay vanilla. */
function recolor(src, ramp, range = [0, 1], gamma = 1) {
  const img = clone(src);
  let lo = 255, hi = 0;
  for (let i = 0; i < img.d.length; i += 4) if (img.d[i + 3]) { const L = lum(img.d[i], img.d[i + 1], img.d[i + 2]); lo = Math.min(lo, L); hi = Math.max(hi, L); }
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const [r, g, b, a] = get(src, x, y); if (!a) continue;
    const t = Math.pow(hi > lo ? (lum(r, g, b) - lo) / (hi - lo) : 0.5, gamma);
    set(img, x, y, pick(ramp, range[0] + t * (range[1] - range[0])), a);
  }
  return img;
}
/** A 6-step ramp (dark -> light) sampled from the colours of one of our textures. */
function rampOf(img) {
  const cols = [];
  for (let i = 0; i < img.d.length; i += 4) if (img.d[i + 3]) cols.push([img.d[i], img.d[i + 1], img.d[i + 2]]);
  cols.sort((a, b) => lum(...a) - lum(...b));
  return [0.03, 0.2, 0.4, 0.6, 0.8, 0.97].map(q => toHex(cols[Math.floor(q * (cols.length - 1))]));
}
/** Pixels where `cracked` is clearly darker than `whole` (vanilla's cracks), painted with `col`. */
function cracksFrom(target, whole, cracked, col) {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const a = get(whole, x, y), b = get(cracked, x, y);
    if (lum(a[0], a[1], a[2]) - lum(b[0], b[1], b[2]) > 22) set(target, x, y, hex(col));
  }
  return target;
}
const jobs = {};
const block = (n, img) => { jobs['block/' + n] = img; };
const item = (n, img) => { jobs['item/' + n] = img; };

// ---- harbour: fired mud bricks
// v3.4 (user): the colours of the harbours' sludge (sampled from it), a little lighter so the bricks read
const DOCK = (() => { const sl = rampOf(own('block/sludge')).map(hex); return sl.map((c, i) => toHex(c.map(n => n * (1.05 + i * 0.05) + 6))); })();
block('dock_bricks', recolor(v('block/mud_bricks'), DOCK, [0.05, 1]));
block('cracked_dock_bricks', cracksFrom(clone(jobs['block/dock_bricks']), v('block/stone_bricks'), v('block/cracked_stone_bricks'), DOCK[1]));
item('dock_brick', recolor(v('item/brick'), ['#2e2522', ...DOCK, '#9a8670'], [0.1, 1]));

// ---- quicksand: orange-yellow, with two soft ripples
{
  const Q = ['#b07838', '#c08842', '#cf9a50', '#dbab5e', '#e5bb70', '#edca84'];
  const qs = recolor(v('block/sand'), Q, [0.15, 1]);
  for (let x = 0; x < 16; x++) { const y = 5 + Math.round(Math.sin(x * 0.7) * 1.2); set(qs, x, y, hex(Q[1])); set(qs, x, Math.min(15, y + 7), hex(Q[1])); }
  block('quicksand', qs);
}

// ---- hive caves: bricks and packed soil like the vanilla stone bricks / mud
{
  const rock = rampOf(own('block/hive_rock')), soil = rampOf(own('block/hive_soil'));
  block('hive_rock_bricks', recolor(v('block/stone_bricks'), rock, [0.05, 0.95]));
  block('cracked_hive_rock_bricks', recolor(v('block/cracked_stone_bricks'), rock, [0, 0.95]));
  block('chiseled_hive_rock_bricks', recolor(v('block/chiseled_stone_bricks'), rock, [0, 0.95]));
  block('packed_hive_soil', recolor(v('block/packed_mud'), soil, [0.05, 0.95]));
  // v3.4 (user): stronger contrast, bricks of uneven length staggered row to row, a few mortar joints offset
  {
    const sb = { w: 16, h: 16, d: new Uint8Array(1024) };
    const S = soil.map(hex), mortar = S[0].map(n => n * 0.78);
    const rows = [[0, 4], [4, 8], [8, 12], [12, 16]];
    const joints = [[0, 7], [3, 12], [1, 6, 11], [4, 10]];   // where the vertical joints fall in each row (wrapping)
    rows.forEach(([y0, y1], ri) => {
      for (let y = y0; y < y1; y++) for (let x = 0; x < 16; x++) {
        const j = joints[ri], k = j.findIndex((jx, i) => x >= jx && x < (j[i + 1] ?? j[0] + 16)) ;
        const bx = k < 0 ? j.length - 1 : k, start = j[bx], len = ((j[bx + 1] ?? j[0] + 16) - start);
        const lx = ((x - start) % 16 + 16) % 16;
        let c;
        if (y === y1 - 1 || lx === 0) c = mortar;                                              // the joints
        else {
          const t = 0.35 + 0.5 * (1 - (y - y0) / 3) * 0.6 + (lx === 1 ? 0.2 : 0) + (lx === len - 1 ? -0.2 : 0) + (hash(x, y, 13) - 0.5) * 0.35 + (hash(bx, ri, 3) - 0.5) * 0.3;
          c = S[Math.max(1, Math.min(5, Math.round(t * 5)))];
        }
        set(sb, x, y, c);
      }
    });
    block('hive_soil_bricks', sb);
  }

  // webbed hive soil (v3.4 user: no white spots - hardened blotches): soil-coloured patches of three tones packed
  // edge to edge (a tileable Voronoi), each patch lit on its upper left, the seams only one shade darker
  const pts = [];
  for (let i = 0; i < 10; i++) pts.push([hash(i, 1, 31) * 16, hash(i, 2, 31) * 16, Math.floor(hash(i, 3, 31) * 3)]);
  const ws = { w: 16, h: 16, d: new Uint8Array(1024) };
  const S = soil.map(hex).map(c => c.map(n => n * 0.86));
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    let best = 1e9, second = 1e9, bi = 0;
    pts.forEach(([px, py], i) => { for (const ox of [-16, 0, 16]) for (const oy of [-16, 0, 16]) { const d = Math.hypot(x + 0.5 - px - ox, y + 0.5 - py - oy); if (d < best) { second = best; best = d; bi = i; } else if (d < second) second = d; } });
    const [px, py, tone] = pts[bi];
    let t = 1.4 + tone * 1.3;                                 // patch tones 1.4 .. 4
    if (second - best < 0.9) t -= 1;                          // a shallow seam: one shade darker than the patch
    else if (x + 0.5 < px && y + 0.5 < py) t += 0.5;          // lit upper left of each patch
    t += (hash(x, y, 41) - 0.5) * 0.6;
    set(ws, x, y, S[Math.max(0, Math.min(5, Math.round(t)))]);
  }
  block('webbed_hive_soil', ws);
}

// ---- the Kin's thatch: vanilla hay in golden ochre, laid in courses (each course's lower edge in shadow)
{
  const T = ['#5e3e16', '#7a5420', '#96702c', '#b08a3a', '#c8a24c', '#dcbc66'];
  const side = recolor(v('block/hay_block_side'), T, [0.15, 1]);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const course = (y + (Math.floor(x / 8) % 2) * 2) % 4;   // courses staggered every 8 px
    const c = get(side, x, y);
    const k = course === 3 ? 0.72 : course === 0 ? 1.08 : 1;
    set(side, x, y, c.slice(0, 3).map(n => Math.min(255, n * k)));
    if (course === 3 && hash(x, y, 7) < 0.25) set(side, x, y, hex(T[3]));   // a straw tip hanging over the shadow
  }
  block('thatch', side);
}

// ---- woven twigs (Byrdonis nest): twigs crossing both ways over dark gaps, lit top-left
{
  const BARK = ['#2a1d12', '#3c2a1a', '#5e4426', '#7a5a32', '#94713e', '#b08c52'];
  const img = { w: 16, h: 16, d: new Uint8Array(1024) };
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) set(img, x, y, hex(BARK[hash(x, y, 9) < 0.7 ? 0 : 1]));
  // thin twigs laid at shallow angles both ways (a woven nest), each 1 px, lit along its upper edge; later ones on top
  for (let i = 0; i < 11; i++) {
    const x0 = Math.floor(hash(i, 1, 21) * 16), y0 = i * 16 / 11 + hash(i, 2, 21) * 1.2, k = (i % 2 ? 1 : -1) * (0.15 + hash(i, 3, 21) * 0.3);
    const len = 8 + Math.floor(hash(i, 4, 21) * 7);
    for (let t = 0; t < len; t++) {
      const x = (x0 + t) % 16, y = ((Math.round(y0 + k * t) % 16) + 16) % 16;
      set(img, x, y, hex(BARK[t === 0 || t === len - 1 ? 3 : hash(x, y, i) < 0.3 ? 3 : 4]));
      if (hash(x, i, 5) < 0.12) set(img, x, (y + 15) % 16, hex(BARK[2]));   // a glint on top
    }
  }
  block('twig_nest', img);
}

{
  const comb = own('block/hive_comb'), cache = clone(comb);
  const HONEY = ['#a8580c', '#cc7a14', '#e69a24', '#f6bc3c', '#ffd862', '#fff0a0'];
  const L = (x, y) => { const c = get(comb, x, y); return lum(c[0], c[1], c[2]); };
  let lo = 255, hi = 0; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { lo = Math.min(lo, L(x, y)); hi = Math.max(hi, L(x, y)); }
  const dark = (x, y) => L(((x % 16) + 16) % 16, ((y % 16) + 16) % 16) < lo + (hi - lo) * 0.42;
  const seen = new Uint8Array(256);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (seen[y * 16 + x] || !dark(x, y)) continue;
    const cells = [], q = [[x, y]]; seen[y * 16 + x] = 1;   // flood the hole (wrapping round the tile)
    while (q.length) { const [a, b] = q.pop(); cells.push([a, b]); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = (a + dx + 16) % 16, ny = (b + dy + 16) % 16; if (!seen[ny * 16 + nx] && dark(nx, ny)) { seen[ny * 16 + nx] = 1; q.push([nx, ny]); } } }
    // the hole's middle (unwrapped round the first cell) and its size
    const ux = cells.map(([a]) => a - x > 8 ? a - 16 : x - a > 8 ? a + 16 : a), uy = cells.map(([, b]) => b - y > 8 ? b - 16 : y - b > 8 ? b + 16 : b);
    const cx = ux.reduce((p, v) => p + v, 0) / cells.length, cy = uy.reduce((p, v) => p + v, 0) / cells.length, R = Math.sqrt(cells.length / Math.PI) + 0.5;
    cells.forEach(([a, b], i) => { const d = Math.hypot(ux[i] - cx + 0.3, uy[i] - cy + 0.3) / R; set(cache, a, b, hex(HONEY[Math.max(0, Math.min(5, Math.round(5 - d * 4.2)))])); });
  }
  block('hive_cache', cache);
}

// ---- v3.4 automaton alloy (Defect's pale brass: copper with gold and quartz) and the core crystal
{
  const BRASS = ['#4e3a20', '#6e5430', '#927544', '#b49a5e', '#d2bc80', '#ebdcaa', '#f8f0d0'];
  const PATINA = ['#2e3e36', '#3f5a4c', '#567a62', '#6f9878', '#8cb28e'];
  item('automaton_alloy_ingot', recolor(v('item/gold_ingot'), BRASS, [0.05, 1], 0.85));
  const blockImg = recolor(v('block/copper_block'), BRASS.slice(1, 6), [0, 1], 0.9);
  block('automaton_alloy_block', blockImg);
  // tarnished: the weathered copper's patina pattern over brass - green where the copper went green
  const w = v('block/exposed_copper'), tarn = clone(blockImg);   // tarnished: exposed copper's first patina
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const c = get(w, x, y); if (c[1] > c[0] + 8) set(tarn, x, y, pick(PATINA, Math.min(1, lum(c[0], c[1], c[2]) / 170))); }
  block('tarnished_automaton_alloy_block', tarn);
  // derelict: tarnished plating with dents (a dark rim below, a light rim above), scratches and a missing rivet
  const der = clone(blockImg), ww = v('block/weathered_copper');   // derelict: the heavier weathered patina, then dents
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const c = get(ww, x, y); if (c[1] > c[0] + 8 && hash(x >> 1, y >> 1, 77) < 0.75) set(der, x, y, pick(PATINA, Math.min(1, lum(c[0], c[1], c[2]) / 170))); }
  for (const [cx, cy, r] of [[4, 5, 2], [11, 11, 2.5], [12, 3, 1.5]]) for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); if (d > r) continue;
    const c = get(der, x, y).slice(0, 3); const k = d > r - 1 ? (y + 0.5 < cy ? 0.7 : 1.15) : 0.85; set(der, x, y, c.map(n => Math.min(255, n * k)));
  }
  for (let i = 0; i < 6; i++) { const x = 2 + i, y = 12 - Math.round(i * 0.6); set(der, x, y, hex(BRASS[1])); }
  for (let i = 0; i < 4; i++) set(der, 9 + i, 6 + (i >> 1), hex(BRASS[5]));
  block('derelict_automaton_alloy_block', der);
  // the core crystal: vanilla amethyst in the energy core's sky blue (it glows), and a cracked, dimmer one
  const SKY = rampOf(own('item/energy_core'));   // the energy core's own cyan
  const core = recolor(v('block/amethyst_block'), SKY, [0.4, 1]);
  block('core_crystal_block', core);
  const cracked = recolor(v('block/amethyst_block'), SKY, [0.3, 0.85]);
  cracksFrom(cracked, v('block/stone_bricks'), v('block/cracked_stone_bricks'), '#1e5468');
  block('cracked_core_crystal_block', cracked);
}

for (const [k, img] of Object.entries(jobs)) writePng(OUT + k + '.png', img);
console.log('wrote', Object.keys(jobs).length, Object.keys(jobs).join(' '));
