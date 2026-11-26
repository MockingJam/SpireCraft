// Biomes v2.3 textures (user feedback, docs/design/art_style.md): run AFTER biome_textures.js and biome_v2_textures.js;
// the textures here replace theirs.
//   barnacle_rock      - blue-grey rock with clusters of clearly visible barnacles (little cones with a dark pore)
//   rotten_log         - the bark lines broken up and wavy, lower contrast (the straight stripes looked harsh)
//   gnarlwood_log      - moss in irregular, wandering streaks instead of straight lines
//   reed_top/_bottom   - olive green like the firefly bush and grass, with a brown head
//   sludge, dark_sand  - the harbour ground, about as dark as vanilla mud
//   quicksand          - lighter, close to sand
//   ink_*              - blacker ink, ink bubble, ink vent top
//   hive_rock, deep_hive_rock - vanilla grain in amber plus small honeycomb imprints and resin glints
//   <family>_<kind>_ore - the hive rock / deep hive rock / sandstone ore variants
// Usage: node tools/biome_v3_textures.js <extracted client-extra.jar dir> [preview.png]
const REPO_ROOT = require('path').resolve(__dirname, '..').split(require('path').sep).join('/') + '/';   // this checkout (was hard-coded to D:/MCmodev/SpireCraft)
const fs = require('fs');
const { readPng, writePng } = require('./png');
const VANILLA = process.argv[2] + '/assets/minecraft/textures/';
const OUT = REPO_ROOT + 'src/main/resources/assets/spirecraft/textures/';
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const sat = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx === 0 ? 0 : (mx - mn) / mx; };
const pick = (ramp, t) => hex(ramp[Math.max(0, Math.min(ramp.length - 1, Math.round(t * (ramp.length - 1))))]);
const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const clone = img => ({ w: img.w, h: img.h, d: new Uint8Array(img.d) });
const get = (img, x, y) => { const i = (y * img.w + x) * 4; return [img.d[i], img.d[i + 1], img.d[i + 2], img.d[i + 3]]; };
const set = (img, x, y, c, a = 255) => { x = (x + img.w) % img.w; y = (y + img.h) % img.h; const i = (y * img.w + x) * 4; img.d[i] = c[0]; img.d[i + 1] = c[1]; img.d[i + 2] = c[2]; img.d[i + 3] = a; };
const v = name => readPng(VANILLA + name + '.png');
const meta = name => fs.readFileSync(VANILLA + name + '.png.mcmeta', 'utf8');

function recolor(src, rules) {
  const img = clone(src);
  const which = new Int8Array(img.w * img.h).fill(-1);
  const lo = rules.map(() => 255), hi = rules.map(() => 0);
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const [r, g, b, a] = get(src, x, y);
    if (a === 0) continue;
    const k = rules.findIndex(rule => !rule.when || rule.when(r, g, b, x, y));
    if (k < 0) continue;
    which[y * img.w + x] = k;
    const L = lum(r, g, b); lo[k] = Math.min(lo[k], L); hi[k] = Math.max(hi[k], L);
  }
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const k = which[y * img.w + x]; if (k < 0) continue;
    const rule = rules[k], [r, g, b, a] = get(src, x, y);
    let t = hi[k] > lo[k] ? (lum(r, g, b) - lo[k]) / (hi[k] - lo[k]) : 0.5;
    const [r0, r1] = rule.range || [0, 1];
    set(img, x, y, pick(rule.ramp, r0 + t * (r1 - r0)), a);
  }
  return img;
}
const all = ramp => [{ ramp }];
const border = (x, y) => x === 0 || y === 0 || x === 15 || y === 15;
const jobs = {}, metas = {};
const block = (name, img, m) => { jobs['block/' + name] = img; if (m) metas['block/' + name] = m; };
/** Shift every column of a 16-px-tall texture up/down by a wandering amount (wrapping), so straight lines go wavy. */
function wave(img, amp, seed) {
  const out = clone(img);
  for (let x = 0; x < img.w; x++) {
    const off = Math.round(amp * Math.sin(x * 0.9 + seed) + (hash(x, 0, seed) - 0.5) * 1.6);
    for (let y = 0; y < img.h; y++) { const c = get(img, x, (y + off + img.h) % img.h); set(out, x, y, c, c[3]); }
  }
  return out;
}

const P = {
  barnacle: ['#1b2230', '#232c3c', '#2c3748', '#364255', '#414e62', '#4d5b71'],
  shellLight: '#aab5c4', shellMid: '#7b8798', shellDark: '#56616f', pore: '#121821',
  rotBark: ['#161a20', '#1c2128', '#232930', '#2b323a', '#343c45', '#3e4750'],
  mold: ['#33403a', '#3e4c44'],
  gnarlBark: ['#17150e', '#242117', '#322e20', '#413c29', '#514b33', '#625b3e'],
  moss: ['#2f3d18', '#3a4c1c', '#465a22', '#536a2a'],
  reed: ['#2c3214', '#3c441a', '#4e5822', '#626c2c', '#778036', '#8c9442'],   // v2.8: a yellowish green (not wheat yellow)
  cattail: ['#2e1d10', '#47301a', '#5e4024', '#76532e'],
  sludge: ['#2a2530', '#332d3a', '#3d3645', '#474050', '#524a5c', '#5e5668'],
  darkSand: ['#36322c', '#3f3a34', '#49443c', '#534d45', '#5d574e', '#686158'],
  quicksand: ['#a8946a', '#b8a47a', '#c8b58a', '#d6c498', '#e2d2a6', '#ecdeb6'],
  ink: ['#020103', '#05030a', '#0a0612', '#110b1c', '#1a1228', '#251a36'],
  hiveRock: ['#5a4630', '#644f36', '#6f593d', '#7a6344', '#856d4b', '#907852'],
  deepHiveRock: ['#3c2e20', '#453526', '#4f3d2c', '#5a4632', '#644f38', '#6e583f'],
  deepInkStone: ['#14121a', '#1a1821', '#211e29', '#292531', '#312c3a', '#3a3443'],   // v2.9: a little lighter
};

// ------------------------------------------------------------------ cave rock (v2.4)
// User: no small random specks or bright pixels on vanilla stone - big patches or stripes read better. So the cave
// stones are drawn from scratch, tileable at 16 px: wavy strata bands (periodic sine waves) and broad patches, a few
// tones of one hue, never a lone pixel.
const TAU = Math.PI * 2;
/** Tone index per pixel: bands of {@code bandH} px following a wave, plus big lighter / darker patches. */
function rockTones(opt) {
  const tones = [];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    let t = opt.base;
    if (opt.bands) {
      const s = y + opt.waveA * Math.sin(TAU * x / 16 + opt.p1) + opt.waveB * Math.sin(TAU * 2 * x / 16 + opt.p2);
      t = opt.bands[Math.floor(s / opt.bandH + 64) % opt.bands.length];
    }
    // big patches, graded (v2.6: no hard step at their edges)
    const b = Math.sin(TAU * (x + y) / 16 + opt.p3) + Math.sin(TAU * (2 * x - y) / 16 + opt.p4);
    t += Math.max(0, b - opt.hi + 0.6) * 0.9 - Math.max(0, -b - opt.lo + 0.6) * 0.9;
    t += (hash(x, y, 77) - 0.5) * (opt.grain ?? 1.1);   // a fine grain, mostly smoothed away below
    tones.push(t);
  }
  return tones;
}
/** One soft pass: each texel moves halfway to the average of its 3x3 neighbourhood (wrapping, so the block still tiles). */
function soften(tones, k = 0.5) {
  const at = (x, y) => tones[((y + 16) % 16) * 16 + (x + 16) % 16];
  return tones.map((t, i) => {
    const x = i % 16, y = i >> 4;
    let sum = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) sum += at(x + dx, y + dy);
    return t + (sum / 9 - t) * k;
  });
}
/** A colour between ramp steps (v2.6: transitions graded instead of jumping a whole step). */
function rampAt(ramp, t) {
  t = Math.max(0, Math.min(ramp.length - 1, Math.round(t * 3) / 3));
  const i = Math.floor(t), f = t - i, a = hex(ramp[i]), b = hex(ramp[Math.min(ramp.length - 1, i + 1)]);
  return a.map((c, k) => Math.round(c + (b[k] - c) * f));
}
function rockImage(ramp, opt, hook, after) {
  let tones = rockTones(opt);
  if (hook) hook(tones);
  tones = soften(tones, opt.soft ?? 0.4);
  if (after) after(tones);   // details that must stay crisp (cracks)
  const img = { w: 16, h: 16, d: new Uint8Array(1024) };
  for (let i = 0; i < 256; i++) set(img, i % 16, i >> 4, rampAt(ramp, tones[i]));
  return img;
}
// hive rock: amber sandstone-like strata; deep hive rock: darker, broader bands
// v2.5 (user): the wavy-striped look suits soil - hive soil gets it, tighter and with more layers; hive rock is a
// stonier take on the same style: thicker beds with a lit top edge and a few vertical joints between blocks.
block('hive_soil', rockImage(P.hiveRock, { bands: [2, 3, 2, 3, 4, 3, 2, 1, 2, 1, 0, 1], bandH: 1.4, waveA: 1.4, waveB: 0.45, p1: 0.4, p2: 1.9, p3: 0.7, p4: 2.6, hi: 1.25, lo: 1.35 }));
function stonyBeds(ramp, opt) {
  // v2.7 (user): on top of the wavy beds, a blocky stone feel made only with light and shadow - each bed is split into
  // blocks by a few joints; every block is a touch lighter or darker than its neighbours, lit along its top and left
  // edges and shaded along its bottom and right edges. All of it goes into the tones before softening.
  return rockImage(ramp, opt, tones => {
    const bedOf = (x, y) => Math.floor((y + opt.waveA * Math.sin(TAU * ((x + 16) % 16) / 16 + opt.p1)) / opt.bandH + 64);
    const blockOf = (x, y) => { const bed = bedOf(x, y); return bed * 10 + Math.floor(((x + bed * 5) % 16 + 16) % 16 / 6); };
    for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
      const id = blockOf(x, y), i = y * 16 + x;
      tones[i] += (hash(id, 3, 91) - 0.5) * 0.9;                                  // the block's own shade
      if (blockOf(x, (y + 15) % 16) !== id) tones[i] += 0.8;                       // lit top edge
      else if (blockOf(x, (y + 1) % 16) !== id) tones[i] -= 0.8;                   // shaded bottom edge
      if (blockOf((x + 15) % 16, y) !== id) tones[i] += 0.4;                       // lit left edge
      else if (blockOf((x + 1) % 16, y) !== id) tones[i] -= 0.6;                   // shaded right edge
    }
  });
}
const HR = ['#4e4232', '#5a4c3a', '#665642', '#72614a', '#7e6c53', '#8a785d'];
const DHR = ['#352b20', '#3e3226', '#483a2c', '#524332', '#5c4c39', '#665640'];
block('hive_rock', stonyBeds(HR, { bands: [2, 3, 2, 1], bandH: 4, waveA: 0.9, waveB: 0, p1: 1.1, p2: 0, p3: 0.4, p4: 1.7, hi: 1.35, lo: 1.35 }));
// v3.6 (user: from afar each block reads as one stone - no unity across blocks; be like deepslate, keep the beds and
// the stone joints): take out the broad light / dark patches (each texel's weighted 7x7 neighbourhood average,
// wrapping), so only the beds, joints and grain are left and every part of the block looks alike
function evenOut(img, k = 0.85) {
  const L = []; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const c = get(img, x, y); L.push(lum(c[0], c[1], c[2])); }
  const mean = L.reduce((p, q) => p + q, 0) / 256, out = clone(img);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    let sum = 0, n = 0;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const w = 1 / (1 + Math.hypot(dx, dy)); sum += L[((y + dy + 16) % 16) * 16 + (x + dx + 16) % 16] * w; n += w; }
    const shift = (mean - sum / n) * k, c = get(img, x, y);
    set(out, x, y, c.slice(0, 3).map(q => Math.max(0, Math.min(255, Math.round(q + shift)))));
  }
  return out;
}
jobs['block/hive_rock'] = evenOut(jobs['block/hive_rock']);
// v3.5 (user: the deep rock should look as stony as the shallow one): the shallow hive rock's structure, mirrored, darker
{
  const hr = jobs['block/hive_rock'], deepRamp = ['#2a221a', '#382e24', '#473b2e', '#574939', '#685845', '#786752'];
  let lo = 255, hi = 0; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const c = get(hr, x, y); const L = lum(c[0], c[1], c[2]); lo = Math.min(lo, L); hi = Math.max(hi, L); }
  const img = clone(hr);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const c = get(hr, 15 - x, y); set(img, x, y, pick(deepRamp, (lum(c[0], c[1], c[2]) - lo) / Math.max(1, hi - lo))); }
  block('deep_hive_rock', img);
}
// harbour rock: broad blue-grey patches; barnacle rock: the same with three detailed barnacles
// v2.7 (user): harbour rock was too smooth - vanilla andesite's grain (its brightness only, the colours stay ours)
// is laid over the broad patches
const andesiteGrain = tones => {
  const a = v('block/andesite');
  let lo = 255, hi = 0;
  for (let i = 0; i < 256; i++) { const c = get(a, i % 16, i >> 4); const L = lum(c[0], c[1], c[2]); lo = Math.min(lo, L); hi = Math.max(hi, L); }
  for (let i = 0; i < 256; i++) { const c = get(a, i % 16, i >> 4); tones[i] += ((lum(c[0], c[1], c[2]) - lo) / (hi - lo) - 0.5) * 2.4; }
};
block('harbour_rock', rockImage(P.barnacle, { base: 2, p3: 0.9, p4: 2.1, hi: 0.6, lo: 0.7, grain: 0.4, soft: 0.25 }, andesiteGrain));
// (barnacle rock was removed in v3.2: barnacles are the layer block "barnacles")


// ------------------------------------------------------------------ logs: wavy, broken lines
{
  const rot = wave(recolor(v('block/dark_oak_log'), all(P.rotBark)), 1.3, 2);
  for (let i = 0; i < 7; i++) set(rot, Math.floor(hash(i, 1, 23) * 16), Math.floor(hash(i, 2, 23) * 16), pick(P.mold, hash(i, 3, 23)));   // single mold flecks
  block('rotten_log', rot);
  const gnarl = recolor(v('block/dark_oak_log'), all(P.gnarlBark));
  // moss: four streaks that wander left and right as they run down, thicker in the middle, fading at the ends
  for (const [sx, sy, len, seed] of [[2, 1, 9, 1], [7, 10, 7, 2], [10, 3, 6, 3], [13, 8, 10, 4]]) {
    let x = sx;
    for (let i = 0; i < len; i++) {
      if (i > 0 && hash(sx, i, seed) < 0.35) x += hash(sx, i, seed + 9) < 0.5 ? -1 : 1;
      const y = sy + i, end = i === 0 || i === len - 1;
      set(gnarl, x, y, pick(P.moss, end ? 0.15 : 0.4 + 0.5 * hash(x, y, 12)));
      if (!end && i > 1 && i < len - 2 && hash(x, y, 13) < 0.4) set(gnarl, x + 1, y, pick(P.moss, 0.1));
    }
  }
  block('gnarlwood_log', gnarl);
}

// ------------------------------------------------------------------ reeds: olive green, brown head
{
  const top = recolor(v('block/tall_grass_top'), all(P.reed));
  for (let y = 4; y < 10; y++) for (let x = 7; x < 9; x++) set(top, x, y, pick(P.cattail, y < 5 ? 0.9 : x === 7 ? 0.6 : 0.3));
  set(top, 7, 3, hex(P.reed[3])); set(top, 8, 2, hex(P.reed[2]));
  block('reed_top', top);
  block('reed_bottom', recolor(v('block/tall_grass_bottom'), all(P.reed)));
}

// ------------------------------------------------------------------ harbour ground, quicksand
block('sludge', recolor(v('block/mud'), all(P.sludge)));
block('dark_sand', recolor(v('block/sand'), all(P.darkSand)));
{
  const qs = recolor(v('block/sand'), all(P.quicksand));
  for (let x = 0; x < 16; x++) { const y = 5 + Math.round(Math.sin(x * 0.7) * 1.2); set(qs, x, y, hex(P.quicksand[1])); set(qs, x, Math.min(15, y + 7), hex(P.quicksand[1])); }
  block('quicksand', qs);
}

// ------------------------------------------------------------------ ink: blacker
block('ink_still', recolor(v('block/lava_still'), all(P.ink)), meta('block/lava_still'));
block('ink_flow', recolor(v('block/lava_flow'), all(P.ink)), meta('block/lava_flow'));
{
  // ink bubbles (v2.5): black, with one white highlight each
  const pal = { a: '#000000', b: '#030304', c: '#070609', d: '#0b0a0e', f: '#0b0a0e', g: '#0e0d12' };   // v2.7: all black
  const rows = [
    '..abbbba.....ab.', '.abccccba...acdb', 'abcdffccba..bccb', 'abcfgfccba..abba', 'bccffcccbb......', 'bccccccbba......',
    'abccccbbaa......', '.abbbbbaa.......', '..aaaaaa..abba..', '..........bfcb..', '..........bccb..', '..........abba..',
    '................', '................', '................', '................'];
  const img = { w: 16, h: 16, d: new Uint8Array(1024) };
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) set(img, x, y, hex(pal[ch])); }));
  block('ink_bubble', img);
}
// ink-burnt rock (v2.5, user: not vanilla stone - cracked as if burnt by the ink): broad dark patches crossed by a
// network of cracks, black inside with a slightly lighter, scorched lip on one side
/** Plain ink-burnt rock: broad dark patches, graded. */
function burnt(ramp, seed) {
  return rockImage(ramp, { base: 3, p3: seed, p4: seed * 2.3, hi: 0.9, lo: 0.9 });
}
/**
 * Cracked ink stone (v2.7, user: only the rock right at the ink, with fine, even heat cracks): a tileable Voronoi
 * net of thin crazing lines over the whole block, each line dark (not black) with a slightly lighter edge beside it,
 * and small gaps so it reads as hairline cracks rather than a grid.
 */
/** Mulberry32: a tiny seeded random generator (deterministic textures). */
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/**
 * Cracked ink stone (v2.9, user: cracks long and thin, uneven in width, bending - not short straight pieces): three long
 * cracks wander across the block (wrapping, so they continue into the next block), their direction turning a little
 * at every step; each is a hairline that widens to two texels in places, and throws off a few thinner branches.
 * The crack is darkest at its widest; a faint lighter lip runs along one side.
 */
/**
 * Ink-burnt rock (v3.0, user: more like stone - in chunks, like cobblestone, but not copied): a tileable Voronoi of
 * nine rounded stones, each its own shade, lit along its upper-left inside edge and shaded along its lower-right, with
 * dark seams between them. {@code cracked}: each stone also carries one thin, slightly bent heat crack running across
 * it from seam to seam, so the cracks are spread evenly over the block.
 */
function inkCobble(ramp, seed, cracked) {
  const rand = rng(seed * 104729 | 0);
  const pts = [];
  // v3.2 (user: not in rows either way, but the stones the same size): nine random points, relaxed a few times
  // (each moved to the middle of its own cell, on the wrapped block) - even sizes, no rows or columns
  for (let i = 0; i < 9; i++) pts.push([rand() * 16, rand() * 16]);
  for (let it = 0; it < 6; it++) {
    const sum = pts.map(() => [0, 0, 0]);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      let best = 0, bd = 1e9, bo = [0, 0];
      pts.forEach(([px, py], i) => { for (const ox of [-16, 0, 16]) for (const oy of [-16, 0, 16]) { const d = Math.hypot(x + 0.5 - px - ox, y + 0.5 - py - oy); if (d < bd) { bd = d; best = i; bo = [ox, oy]; } } });
      sum[best][0] += x + 0.5 - bo[0]; sum[best][1] += y + 0.5 - bo[1]; sum[best][2]++;
    }
    pts.forEach((pt, i) => { if (sum[i][2]) { pt[0] = ((sum[i][0] / sum[i][2]) % 16 + 16) % 16; pt[1] = ((sum[i][1] / sum[i][2]) % 16 + 16) % 16; } });
  }
  const shade = pts.map(() => (rand() - 0.5) * 1.2);
  const cellAt = (x, y) => {
    let d1 = 1e9, d2 = 1e9, k = -1, cx = 0, cy = 0;
    pts.forEach(([px, py], i) => {
      for (const ox of [-16, 0, 16]) for (const oy of [-16, 0, 16]) {
        const d = Math.hypot(x - px - ox, y - py - oy);
        if (d < d1) { d2 = d1; d1 = d; k = i; cx = px + ox; cy = py + oy; } else if (d < d2) d2 = d;
      }
    });
    return { k, edge: d2 - d1, dx: x - cx, dy: y - cy };
  };
  // the cracks: one per stone, through its middle at a random angle, bending a little, stopping at the seams
  const crack = new Set();
  if (cracked) pts.forEach(([px, py], k) => {
    if (k % 2 === 1) return;   // v3.2 (user): fewer cracks - about half the stones
    const ang0 = rand() * Math.PI, bend = (rand() - 0.5) * 0.08;
    for (const dir of [1, -1]) {
      let x = px, y = py, ang = ang0 + (dir < 0 ? Math.PI : 0);
      for (let i = 0; i < 16; i++) {
        ang += bend * dir + (rand() - 0.5) * 0.18;
        x += Math.cos(ang) * 0.6; y += Math.sin(ang) * 0.6;
        const c = cellAt(x, y);
        if (c.k !== k || c.edge < 1.0) break;
        crack.add(((Math.round(y) % 16 + 16) % 16) * 16 + ((Math.round(x) % 16 + 16) % 16));
      }
    }
  });
  return rockImage(ramp, { base: 3, p3: seed, p4: seed * 2.3, hi: 1.4, lo: 1.4, grain: 0.7, soft: 0.2 }, tones => {
    for (let i = 0; i < 256; i++) {
      const c = cellAt((i % 16) + 0.5, (i >> 4) + 0.5);
      if (c.edge < 0.8) { tones[i] = 0.2; continue; }                       // the seam between stones
      const r = Math.hypot(c.dx, c.dy) || 1;
      tones[i] += shade[c.k] + 0.7 * (-c.dx - c.dy) / (r * Math.SQRT2) * Math.min(1, r / 2.5);   // rounded, lit from the top left
      if (c.edge < 1.6) tones[i] += (c.dx + c.dy < 0 ? 0.5 : -0.6);           // rim: lit side / shadow side
    }
  }, tones => {
    for (const i of crack) tones[i] = Math.max(0.9, tones[i] - 1.8);         // thin heat cracks, two shades darker, lighter than the seams (v3.2: softer)
  });
}
const INKR = ['#1a1820', '#221f29', '#2b2733', '#35303e', '#403a49', '#4b4455'];   // v2.9: a little lighter
block('ink_stained_stone', inkCobble(INKR, 13, false));
block('cracked_ink_stone', inkCobble(INKR, 13, true));
{
  // the vent (v2.5): burnt rock around a plain black hole
  const vent = inkCobble(INKR, 13, true);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const d = Math.hypot(x - 7.5, y - 7.5);
    if (d < 3.2) set(vent, x, y, hex('#000000'));
    else if (d < 4.4) set(vent, x, y, pick(INKR, y < 7.5 ? 0.2 : 0.9));   // the rim, lit on its far side
  }
  block('ink_vent_top', vent);
}

// ------------------------------------------------------------------ barnacles layer (v2.8): transparent, a cluster of
// barnacles - six-plate shells lit from the top left, each with a round black mouth - drawn over nothing
{
  const img = { w: 16, h: 16, d: new Uint8Array(1024) };
  const SHELL = ['#3d4656', '#56616f', '#7b8798', '#9aa5b4', '#bcc6d2'];
  const one = (cx, cy, R) => {
    for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) {
      const d = Math.hypot(x, y);
      if (d > R) continue;
      const px = cx + x, py = cy + y;
      if (px < 0 || py < 0 || px > 15 || py > 15) continue;
      if (d <= Math.max(1.05, R * 0.36)) { set(img, px, py, hex('#0b0e13')); continue; }
      const ang = Math.atan2(y, x), seg = (ang + Math.PI) / (Math.PI * 2) * 6, seam = Math.abs(seg - Math.round(seg)) < 0.12 && d > R * 0.5;
      let t = 0.5 + 0.35 * (-x - y) / (d * Math.SQRT2) + (d < R * 0.6 ? 0.2 : 0) - (d > R * 0.85 ? 0.25 : 0);
      if (seam) t -= 0.35;
      set(img, px, py, pick(SHELL, t));
    }
  };
  one(4, 4, 3.3); one(11, 6, 2.9); one(6, 11, 3.0); one(12, 12, 2.2);
  block('barnacles', img);
}

// ------------------------------------------------------------------ hive mycelium (v3.2, user: the top all white-yellow,
// with a grain like the grass block and vanilla mycelium): vanilla mycelium's top recoloured to a cream white; the side
// is vanilla mycelium's side - its overhanging fringe recoloured the same way - over our hive soil
{
  const CREAM = ['#a89a7a', '#b8ab8a', '#c7bb9a', '#d4c9aa', '#e0d6ba', '#ebe3ca'];
  block('hive_mycelium_top', recolor(v('block/mycelium_top'), all(CREAM)));
  const vside = v('block/mycelium_side'), dirt = v('block/dirt'), side = clone(jobs['block/hive_soil']);
  const fringe = [];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const a = get(vside, x, y), b = get(dirt, x, y);
    if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) > 24) fringe.push([x, y, lum(a[0], a[1], a[2])]);
  }
  const lo = Math.min(...fringe.map(f => f[2])), hi = Math.max(...fringe.map(f => f[2]));
  for (const [x, y, L] of fringe) set(side, x, y, pick(CREAM, (L - lo) / Math.max(1, hi - lo)));
  block('hive_mycelium_side', side);
}

// ------------------------------------------------------------------ giant hive shroom cap (v2.4): the brown mushroom block in amber
block('hive_shroom_block', recolor(v('block/brown_mushroom_block'), all(['#7a5410', '#946818', '#b08222', '#c89a30', '#dcb244', '#ecc85c'])));

// ------------------------------------------------------------------ the cave stones' ores
// Each ore's own pixels (where it differs from vanilla stone / deepslate) laid on our stone; grey shading keeps its
// light ratio to the vanilla stone under it but takes our stone's colour, the coloured gems stay as they are.
{
  const OWN = OUT + 'block/';
  const kinds = ['coal', 'iron', 'copper', 'gold', 'redstone', 'lapis', 'diamond', 'emerald', 'wolframite', 'orichalcum'];
  // v3.6 (user: too like emerald ore): orichalcum in irregular lumps (the copper ore's shape, mirrored) on deepslate, jade
  {
    const ORI = ['#0c2a22', '#164a3a', '#206a52', '#2e8c6c', '#48aa88', '#7cceac', '#c4f0dc'];
    const src = v('block/deepslate_copper_ore'), host = v('block/deepslate'), out = clone(host);
    const gem = []; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const p = get(src, x, y), q = get(host, x, y); if (Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]) > 6) gem.push([x, y, lum(p[0], p[1], p[2])]); }
    const lo = Math.min(...gem.map(g => g[2])), hi = Math.max(...gem.map(g => g[2]));
    for (const [x, y, Lg] of gem) set(out, 15 - x, y, pick(ORI, (Lg - lo) / Math.max(1, hi - lo)));
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (!gem.some(g => 15 - g[0] === x && g[1] === y)) set(out, x, y, get(host, x, y));
    writePng(OWN + 'orichalcum_ore.png', out);
  }
  const source = (kind, deep) => kind === 'wolframite' ? readPng(OWN + (deep ? 'deepslate_' : '') + 'wolframite_ore.png')
      : kind === 'orichalcum' ? readPng(OWN + 'orichalcum_ore.png') : v('block/' + (deep ? 'deepslate_' : '') + kind + '_ore');
  const families = [['hive_rock', jobs['block/hive_rock'], false], ['deep_hive_rock', jobs['block/deep_hive_rock'], true]];   // (v3.5: no sandstone ores)
  for (const [fam, stone, deepFam] of families) {
    for (const kind of kinds) {
      if (kind === 'orichalcum' && deepFam === false) continue;
      const deep = deepFam === true || kind === 'orichalcum';
      const ore = source(kind, deep), base = v(deep ? 'block/deepslate' : 'block/stone'), out = clone(stone);
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const [r, g, b] = get(ore, x, y), [r0, g0, b0] = get(base, x, y);
        if (Math.abs(r - r0) + Math.abs(g - g0) + Math.abs(b - b0) <= 6) continue;
        if (sat(r, g, b) > 0.2) { set(out, x, y, [r, g, b]); continue; }
        const k = lum(r, g, b) / Math.max(1, lum(r0, g0, b0)), [sr, sg, sb] = get(stone, x, y);
        set(out, x, y, [sr * k, sg * k, sb * k].map(c => Math.max(0, Math.min(255, Math.round(c)))));
      }
      block(fam + '_' + kind + '_ore', out);
    }
  }
  // the ink caves have no ore variants any more (v2.3)
  for (const f of fs.readdirSync(OWN)) if (/^(ink_stained_stone|deep_ink_stone)_.*_ore\.png$/.test(f)) fs.unlinkSync(OWN + f);
}

// ------------------------------------------------------------------ write + preview
for (const [name, img] of Object.entries(jobs)) {
  writePng(OUT + name + '.png', img);
  if (metas[name]) fs.writeFileSync(OUT + name + '.png.mcmeta', metas[name]);
}
console.log('wrote ' + Object.keys(jobs).length + ' textures');
if (process.argv[3]) {
  const names = Object.keys(jobs).filter(n => !n.includes('ink_still') && !n.includes('ink_flow')), S = 8, cols = 8, cell = 32 * S / 2 + 6;
  const sheet = { w: cols * cell, h: Math.ceil(names.length / cols) * cell, d: null };
  sheet.d = new Uint8Array(sheet.w * sheet.h * 4);
  for (let i = 0; i < sheet.w * sheet.h; i++) sheet.d.set([90, 90, 90, 255], i * 4);
  names.forEach((n, i) => {
    const img = jobs[n], ox = (i % cols) * cell + 3, oy = Math.floor(i / cols) * cell + 3, tile = /ore|rock|log|sand|sludge/.test(n) ? 2 : 1, s = Math.floor(16 * S / 16 / tile);
    for (let y = 0; y < 16 * tile * s; y++) for (let x = 0; x < 16 * tile * s; x++) {
      const [r, g, b, a] = get(img, Math.floor(x / s) % 16, Math.floor(y / s) % 16);
      if (a > 0) { const k = ((oy + y) * sheet.w + ox + x) * 4; sheet.d[k] = r; sheet.d[k + 1] = g; sheet.d[k + 2] = b; }
    }
  });
  writePng(process.argv[3], sheet);
}
