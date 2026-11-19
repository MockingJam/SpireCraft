// Biome textures v5 (v3.5 user round, run after biome_v4_textures.js):
//   hive_cache (honey only inside the comb's holes), webbed_hive_soil (clumps, granular), deep_hive_rock (stone like
//   the shallow hive rock), silk_hive (wrapped bands), hive_shroom_block (soft amber, few grains), tarnished /
//   derelict automaton alloy (darkened, not green), core crystal (bigger crystals, glints), twig_nest (vertical twigs
//   with gaps, cutout), the hiveshroom wood set, hive_mycelium_layer, mycelium_thread, bug_carcass, byrdonis_egg_*,
//   junk_block, paving_stones.
// Usage: node tools/biome_v5_textures.js <vfull dir>
const { readPng, writePng } = require('./png');
const V = process.argv[2] + '/assets/minecraft/textures/';
const OUT = 'D:/MCmodev/SpireCraft/src/main/resources/assets/spirecraft/textures/';
const v = n => readPng(V + n + '.png');
const own = n => readPng(OUT + n + '.png');
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const toHex = c => '#' + c.map(n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('');
const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const clone = img => ({ w: img.w, h: img.h, d: new Uint8Array(img.d) });
const blank = (w = 16, h = 16) => ({ w, h, d: new Uint8Array(w * h * 4) });
const get = (img, x, y) => { const i = ((((y % img.h) + img.h) % img.h) * img.w + (((x % img.w) + img.w) % img.w)) * 4; return [img.d[i], img.d[i + 1], img.d[i + 2], img.d[i + 3]]; };
const set = (img, x, y, c, a = 255) => { const i = (y * img.w + x) * 4; img.d[i] = c[0]; img.d[i + 1] = c[1]; img.d[i + 2] = c[2]; img.d[i + 3] = a; };
const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const pick = (ramp, t) => hex(ramp[Math.max(0, Math.min(ramp.length - 1, Math.round(t * (ramp.length - 1))))]);
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
/** Tileable Voronoi: for (x,y) the nearest and second-nearest point (wrapping), with the nearest index. */
function cell(pts, x, y, W = 16) {
  let b = 1e9, s2 = 1e9, bi = 0;
  pts.forEach(([px, py], i) => { for (const ox of [-W, 0, W]) for (const oy of [-W, 0, W]) { const d = Math.hypot(x + 0.5 - px - ox, y + 0.5 - py - oy); if (d < b) { s2 = b; b = d; bi = i; } else if (d < s2) s2 = d; } });
  return { d: b, edge: s2 - b, i: bi, p: pts[bi] };
}
const jobs = {}, block = (n, i) => { jobs['block/' + n] = i; }, item = (n, i) => { jobs['item/' + n] = i; };

// ---- hive cache: the comb as it is; honey fills only the inside of each hole (a dark rim kept round it)
{
  const comb = own('block/hive_comb'), out = clone(comb);
  const HONEY = ['#b0600e', '#d08018', '#e8a028', '#f6c040', '#ffdc66', '#fff0a8'];
  let lo = 255, hi = 0; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const c = get(comb, x, y); const L = lum(c[0], c[1], c[2]); lo = Math.min(lo, L); hi = Math.max(hi, L); }
  const hole = (x, y) => { const c = get(comb, x, y); return lum(c[0], c[1], c[2]) < lo + (hi - lo) * 0.3; };
  // distance of each hole pixel from the hole's edge (wrapping), honey brighter towards the middle
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (!hole(x, y)) continue;
    let depth = 0;
    for (let r = 1; r <= 3; r++) { let all = true; for (let dy = -r; dy <= r && all; dy++) for (let dx = -r; dx <= r && all; dx++) if (Math.abs(dx) + Math.abs(dy) <= r && !hole(x + dx, y + dy)) all = false; if (all) depth = r; else break; }
    if (depth === 0) continue;   // the hole's dark rim stays
    set(out, x, y, hex(HONEY[Math.min(5, 1 + depth + (hash(x, y, 3) < 0.3 ? 1 : 0))]));
  }
  block('hive_cache', out);
}

// ---- webbed hive soil: clumps of hardened soil, each rounded and granular, packed with shallow gaps
{
  const soil = rampOf(own('block/hive_soil')).map(hex);
  const S = soil.map(c => c.map(n => n * 0.9));
  const pts = []; for (let i = 0; i < 12; i++) pts.push([(i % 4) * 4 + 1 + hash(i, 1, 51) * 2.5, Math.floor(i / 4) * 5.3 + 1 + hash(i, 2, 51) * 2.5]);
  const ws = blank();
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const c = cell(pts, x, y), [px, py] = c.p;
    let t = 2.7 + (hash(c.i, 7, 51) - 0.5) * 2.0;                // each clump its own tone
    t += ((px - x - 0.5) + (py - y - 0.5)) * 0.3;               // lit from the upper left, rounded
    if (c.edge < 0.9) t = Math.min(t - 1.2, 1.8);               // a shallow gap
    if (hash(x, y, 52) < 0.25) t += 1; else if (hash(x, y, 53) < 0.15) t -= 1;   // grains
    set(ws, x, y, S[Math.max(0, Math.min(5, Math.round(t)))]);
  }
  block('webbed_hive_soil', ws);
}

// (deep hive rock: drawn in biome_v3_textures.js now, so its ores match)

// ---- silk hive: silk wound round and round - bands slanting a little, each lit along its top and shaded below,
// overlapping like a wrapped cocoon; soft contrast
{
  const SILK = ['#a8a090', '#bab3a4', '#ccc6b8', '#dcd7cb', '#e8e4da', '#f2efe8'];
  const img = blank();
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const yy = y + 2.2 * Math.sin((x / 16) * Math.PI * 2) + (x > 7 ? 1.5 : 0);   // the band's wave, a step where a turn overlaps
    const band = ((yy % 4) + 4) % 4;                                             // 4-px bands
    let t = 3.3 - band * 0.55;                                                   // lit top edge, shaded bottom edge
    if (band > 3.2) t = 1;                                                       // the shadow where the next turn lies over
    t += (hash(x >> 1, Math.floor(yy / 4), 61) - 0.5) * 0.5 + (hash(x, y, 62) < 0.15 ? 0.6 : 0);   // a fibre or two
    set(img, x, y, pick(SILK, Math.max(0, Math.min(1, t / 5))));
  }
  block('silk_hive', img);
}

// ---- giant hive shroom cap: soft amber, a gentle mottling, a few pale spore grains
{
  const CAP = ['#9a5e10', '#b4741a', '#c88a24', '#d89e30', '#e6b444', '#f2cc66'];
  const img = blank();
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    let t = 0.55 + 0.12 * Math.sin(x * 0.6 + y * 0.3) + 0.1 * Math.cos(y * 0.7 - x * 0.2);
    if (hash(x, y, 71) < 0.1) t += 0.3; else if (hash(x, y, 72) < 0.06) t -= 0.25;
    set(img, x, y, pick(CAP, t));
  }
  block('hive_shroom_block', img);
}

// ---- automaton alloy: tarnish darkens (no green) - tarnished, then derelict
{
  const base = own('block/automaton_alloy_block');
  const DARK = ['#2a2218', '#3a2f20', '#4c3e2a', '#5e4d34'];
  const ex = v('block/exposed_copper'), we = v('block/weathered_copper');
  const tarn = clone(base);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const c = get(ex, x, y); if (c[1] > c[0] + 8) set(tarn, x, y, pick(DARK, Math.min(1, lum(c[0], c[1], c[2]) / 190 + 0.3))); }
  block('tarnished_automaton_alloy_block', tarn);
  const der = clone(base);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const c = get(we, x, y); if (c[1] > c[0] + 8 && hash(x >> 1, y >> 1, 77) < 0.8) set(der, x, y, pick(DARK, Math.min(1, lum(c[0], c[1], c[2]) / 210))); }
  for (const [cx, cy, r] of [[4, 5, 2], [11, 11, 2.5], [12, 3, 1.5]]) for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); if (d > r) continue;
    const c = get(der, x, y).slice(0, 3); set(der, x, y, c.map(n => Math.min(255, n * (d > r - 1 ? (y + 0.5 < cy ? 0.7 : 1.15) : 0.85))));
  }
  for (let i = 0; i < 6; i++) set(der, 2 + i, 12 - Math.round(i * 0.6), hex('#2a2218'));
  block('derelict_automaton_alloy_block', der);
}

// ---- core crystal: four or five big crystal faces (lit facet, mid facet, shadow facet), bright edge glints
{
  const SKY = ['#0e4a5c', '#147088', '#1c98b0', '#34c0d6', '#7ee4f2', '#d8fcff'];
  const pts = [[3, 4], [11, 3], [7, 10], [14, 12], [2, 13]];
  function crystal(cracked) {
    const img = blank();
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const c = cell(pts, x, y), [px, py] = c.p;
      const dx = x + 0.5 - px, dy = y + 0.5 - py;
      // three facets per crystal by angle: lit upper-left, mid right, dark below
      const a = Math.atan2(dy, dx);
      let t = a < -1.6 || a > 2.6 ? 4.2 : a < 0.6 ? 3 : 1.8;
      t -= Math.min(1.2, Math.hypot(dx, dy) * 0.12);
      if (c.edge < 0.7) t = 0.6;                                         // the dark seam between crystals
      else if (c.edge < 1.4 && (dx + dy) < 0) t = 5;                     // a bright glint on the lit edges
      if (cracked) { t -= 0.8; if (hash(x, y, 81) < 0.07) t = 0; }
      set(img, x, y, pick(SKY, Math.max(0, Math.min(1, t / 5))));
    }
    return img;
  }
  block('core_crystal_block', crystal(false));
  block('cracked_core_crystal_block', crystal(true));
}

// ---- twig nest: upright reddish twigs (like the STS2 nest) woven through by a few slanting ones, gaps between them
// (cutout, like vanilla mangrove roots), each twig lit on its left
{
  const T = ['#3a1a10', '#562818', '#723822', '#8e4c2e', '#aa643a', '#c0804c'];
  const img = blank();   // transparent
  const put = (x, y, t) => set(img, ((x % 16) + 16) % 16, ((y % 16) + 16) % 16, hex(T[Math.max(0, Math.min(5, t))]));
  for (let i = 0; i < 7; i++) {   // upright twigs, wavering
    const x0 = Math.round(i * 16 / 7 + hash(i, 1, 91) * 1.5);
    for (let y = 0; y < 16; y++) { const x = x0 + Math.round(Math.sin(y * 0.5 + i) * 0.7); put(x, y, 4 - (y % 5 === 0 ? 1 : 0)); put(x + 1, y, 2 + (hash(x, y, 92) < 0.3 ? 1 : 0)); }
  }
  for (let i = 0; i < 3; i++) {   // slanting twigs across them
    const y0 = 3 + i * 5 + Math.round(hash(i, 3, 93) * 2), k = i % 2 ? 0.45 : -0.45;
    for (let x = 0; x < 16; x++) { const y = Math.round(y0 + k * x); put(x, y, 5 - (x % 4 === 0 ? 1 : 0)); put(x, y + 1, 1); }
  }
  block('twig_nest', img);
}

// ---- the hiveshroom wood: vanilla stripped oak / oak planks / door / trapdoor in pale beige mushroom tones
{
  const W = ['#7a6644', '#94805a', '#ae9a72', '#c6b38c', '#d8c8a4', '#e8dcbe'];
  block('hiveshroom_stem', recolor(v('block/stripped_oak_log'), W, [0.1, 1]));   // the stem looks peeled already: stripped oak's grain
  block('hiveshroom_stem_top', recolor(v('block/stripped_oak_log_top'), W, [0, 1]));
  block('hiveshroom_planks', recolor(v('block/oak_planks'), W, [0.05, 0.95]));
  block('hiveshroom_door_top', recolor(v('block/oak_door_top'), W, [0, 1]));
  block('hiveshroom_door_bottom', recolor(v('block/oak_door_bottom'), W, [0, 1]));
  block('hiveshroom_trapdoor', recolor(v('block/oak_trapdoor'), W, [0, 1]));
  item('hiveshroom_door', recolor(v('item/oak_door'), W, [0, 1]));
}

// ---- the fungus mat (a lichen-like layer of white threads) and a hanging thread
{
  const M = ['#b8b0a0', '#d0c8b8', '#e4ded2', '#f4f0e8'];
  const mat = blank();
  // vanilla glow lichen's silhouette, filled with white threads
  const gl = v('block/glow_lichen');
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (get(gl, x, y)[3]) set(mat, x, y, pick(M, 0.35 + 0.6 * hash(x, y, 101) * (hash(x >> 1, y, 102) < 0.5 ? 1 : 0.6)));
  block('hive_mycelium_layer', mat);
  const th = blank();
  for (let y = 0; y < 16; y++) { const x = 7 + Math.round(Math.sin(y * 0.6) * 0.8); set(th, x, y, pick(M, 0.9)); set(th, x + 1, y, pick(M, 0.4)); if (y % 5 === 2) set(th, x - 1, y, pick(M, 0.6)); }
  block('mycelium_thread', th);
}

// ---- bug carcass: one 32x32 sheet (model UVs in models/block/bug_carcass.json): chitin plates, legs, fungus
{
  const img = blank(32, 32);
  const SHELL = ['#5e4a30', '#7a6040', '#967a52', '#b09464', '#c8ae7c', '#dcc898'];
  const LEG = ['#3a2c1c', '#52402a', '#6a543a'];
  const CAP = ['#b8b0a0', '#d8d0c0', '#f0eadc'];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 32; x++) {   // the plates: segmented, ridged
    let t = 3 + (y < 2 ? 1 : 0) - (y > 12 ? 1.2 : 0) - ((x % 6) === 0 ? 1.4 : 0) + (hash(x, y, 111) - 0.5) * 0.6;
    set(img, x, y, pick(SHELL, Math.max(0, Math.min(1, t / 5))));
  }
  for (let y = 16; y < 24; y++) for (let x = 0; x < 16; x++) set(img, x, y, hex(LEG[(x + y) % 4 === 0 ? 0 : y < 18 ? 2 : 1]));   // legs
  for (let y = 16; y < 24; y++) for (let x = 16; x < 32; x++) set(img, x, y, pick(CAP, y === 16 ? 1 : 0.55 + (hash(x, y, 112) - 0.5) * 0.5));   // fungus
  for (let y = 24; y < 32; y++) for (let x = 0; x < 16; x++) set(img, x, y, pick(SHELL, 0.35 + (hash(x, y, 113) - 0.5) * 0.3));   // the underside
  for (let y = 24; y < 32; y++) for (let x = 16; x < 32; x++) set(img, x, y, (x + y) % 3 ? hex('#2a2016') : hex('#d8b070'));   // the eye / mouth parts
  block('bug_carcass', img);
}

// ---- Byrdonis egg (sniffer-egg size): vanilla sniffer egg faces, recoloured cream-pink with raspberry spots
{
  const SHELL = ['#c89488', '#dcaa9c', '#ecc2b2', '#f6d8c8', '#fceadc'];
  for (const f of ['top', 'bottom', 'north', 'south', 'east', 'west']) {
    const src = v(`block/sniffer_egg_not_cracked_${f}`), img = recolor(src, SHELL, [0, 1]);
    for (let i = 0; i < 9; i++) {
      const x = Math.floor(hash(i, 1, 121 + f.length) * 14) + 1, y = Math.floor(hash(i, 2, 121 + f.length) * 14) + 1, r = hash(i, 3, 121) < 0.4 ? 1.2 : 0.7;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (Math.hypot(dx, dy) <= r && get(img, x + dx, y + dy)[3]) set(img, x + dx, y + dy, hex(dx + dy < 0 ? '#c84858' : '#a83444'));
    }
    block(`byrdonis_egg_${f}`, img);
  }
}

// ---- junk block: compressed scrap - rusty plates, wire, brass and copper bits, packed dirt between
{
  const img = blank();
  const parts = [['#6a4a30', '#8a6440', '#a47e52'], ['#5a5a5e', '#7a7a80', '#9a9aa0'], ['#7a5a26', '#a4823c', '#c8a85a'], ['#6a3e22', '#8e5a32', '#b47a48'], ['#3e3226', '#4e4030', '#5e4e3a']];
  const pts = []; for (let i = 0; i < 14; i++) pts.push([hash(i, 1, 131) * 16, hash(i, 2, 131) * 16]);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const c = cell(pts, x, y), pal = parts[c.i % parts.length], [px, py] = c.p;
    let k = 1 + ((px - x - 0.5) + (py - y - 0.5) > 0 ? 1 : 0) - (c.edge < 0.8 ? 1 : 0);
    if (hash(x, y, 132) < 0.12) k = Math.min(2, k + 1);
    set(img, x, y, hex(c.edge < 0.6 ? '#2a2018' : pal[Math.max(0, Math.min(2, k))]));
  }
  for (let x = 2; x < 13; x++) set(img, x, Math.round(9 + Math.sin(x * 0.8) * 1.2), hex('#b06a3a'));   // a copper wire
  block('junk_block', img);
}

// ---- paving stones: flat stones of different sizes with grass-coloured gaps left transparent (a carpet layer)
{
  const ST = ['#6a6a66', '#7e7e78', '#92928a', '#a6a69c', '#b8b8ae'];
  const pts = []; for (let i = 0; i < 7; i++) pts.push([hash(i, 1, 141) * 16, hash(i, 2, 141) * 16]);
  const img = blank();
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const c = cell(pts, x, y), [px, py] = c.p;
    if (c.edge < 1.1) continue;   // the gap (transparent)
    let t = 2.4 + (hash(c.i, 3, 142) - 0.5) * 1.2 + ((px - x - 0.5) + (py - y - 0.5)) * 0.15 + (hash(x, y, 143) < 0.15 ? 0.6 : 0);
    if (c.edge < 1.8) t -= 0.8;
    set(img, x, y, pick(ST, Math.max(0, Math.min(1, t / 4))));
  }
  block('paving_stones', img);
}

for (const [k, img] of Object.entries(jobs)) writePng(OUT + k + '.png', img);
console.log('wrote', Object.keys(jobs).length);
