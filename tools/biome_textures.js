// Phase 7 biome block textures (docs/design/biomes.md, docs/design/art_style.md).
// Standalone (no Blockbench): reads vanilla PNGs, recolours them with palettes tuned to the STS2 act backgrounds, and
// draws the few patterns vanilla has no shape for (hex tiles, chitin scales, flagstones, pipe).
// Usage: node tools/biome_textures.js <extracted client-extra.jar dir> [preview.png]
const fs = require('fs');
const zlib = require('zlib');

const VANILLA = process.argv[2] + '/assets/minecraft/textures/';
const OUT = 'D:/MCmodev/SpireCraft/src/main/resources/assets/spirecraft/textures/';

const { readPng, writePng } = require('./png');

// ------------------------------------------------------------------ colour helpers
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const sat = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx === 0 ? 0 : (mx - mn) / mx; };
const pick = (ramp, t) => hex(ramp[Math.max(0, Math.min(ramp.length - 1, Math.round(t * (ramp.length - 1))))]);
const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const blank = (w = 16, h = 16) => ({ w, h, d: new Uint8Array(w * h * 4) });
const clone = img => ({ w: img.w, h: img.h, d: new Uint8Array(img.d) });
const get = (img, x, y) => { const i = (y * img.w + x) * 4; return [img.d[i], img.d[i + 1], img.d[i + 2], img.d[i + 3]]; };
const set = (img, x, y, c, a = 255) => { const i = (y * img.w + x) * 4; img.d[i] = c[0]; img.d[i + 1] = c[1]; img.d[i + 2] = c[2]; img.d[i + 3] = a; };
const v = name => readPng(VANILLA + name + '.png');

/**
 * Recolour a vanilla texture: every pixel chosen by {@code rules} (first match wins; a rule is {when(r,g,b,x,y), ramp,
 * range?, gamma?}) is mapped by its luminance — normalised over the pixels of that rule — onto the ramp. Shape, light
 * and shadow stay vanilla; only the material changes. Pixels no rule takes keep their vanilla colour.
 */
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
    if (rule.gamma) t = Math.pow(t, rule.gamma);
    const [r0, r1] = rule.range || [0, 1];
    set(img, x, y, pick(rule.ramp, r0 + t * (r1 - r0)), a);
  }
  return img;
}
const all = ramp => [{ ramp }];
const isGreen = (r, g, b) => g > r + 6 && g >= b;
const isWarm = (r, g, b) => r > g + 12 && sat(r, g, b) > 0.25;

// ------------------------------------------------------------------ palettes (dark → light), tuned against vanilla woods/stones
const P = {
  gnarlBark: ['#17150e', '#242117', '#322e20', '#413c29', '#514b33', '#625b3e'],
  gnarlWood: ['#2b2617', '#3b3420', '#4d4429', '#5f5533', '#72663e', '#857849'],
  gnarlLeaf: ['#0f240f', '#173716', '#214c1e', '#2c6127', '#3a7731', '#4b8d3c'],
  moss: ['#2a3a14', '#3a5018', '#4c661e', '#5e7c26'],
  tideBark: ['#0e0e1b', '#16172a', '#1f2139', '#292c4a', '#34385b', '#41466d'],
  tideWood: ['#1d1e36', '#262947', '#303459', '#3b406b', '#474e7e', '#555d91'],
  tideLeaf: ['#0b1d1f', '#112d2d', '#18403e', '#20534f', '#2b6762', '#387b74'],
  hiveBark: ['#1b1209', '#291b0f', '#382615', '#48321b', '#593e22', '#6b4c2a'],
  hiveWood: ['#3e270c', '#553711', '#6c4817', '#845a1e', '#9c6d27', '#b38131'],
  hiveLeaf: ['#22240c', '#333912', '#475018', '#5d681f', '#748028', '#8b9832'],
  eyeGlow: ['#1e5a24', '#2f8a38', '#4cc256', '#9cf2a2'],
  ruin: ['#1f2a23', '#2d3a31', '#3c4b40', '#4b5c4f', '#5b6d5e', '#6c7e6d'],
  flag: ['#383c36', '#474b44', '#575b53', '#686c62', '#7a7e72'],
  dockBrick: ['#2a2435', '#383046', '#463d57', '#554a69', '#64587a', '#73678a'],
  dockMortar: ['#1b1a22', '#25232e', '#302e3a', '#3b3946'],
  barnacle: ['#141a27', '#1e2635', '#283244', '#334054', '#3f4e64', '#4d5d75'],
  barnaclePolished: ['#1a2130', '#242d3e', '#2f3a4e', '#3b485e', '#48566e', '#566580'],
  hiveSoil: ['#4a3410', '#5f4418', '#755621', '#8b682a', '#a07b34', '#b48e40'],
  hiveTile: ['#6a470f', '#845a15', '#9e6e1d', '#b78327', '#cc9834'],
  chitin: ['#0d1811', '#142419', '#1d3123', '#273f2d', '#334f39', '#416146'],
  sludge: ['#1d1923', '#28222f', '#332c3b', '#3e3647', '#4a4154', '#574e62'],
  fogcap: ['#2a3a3e', '#3c5155', '#51696c', '#678184', '#7f999a', '#98b1b0'],
  pale: ['#8c9a92', '#b2c0b8', '#d4e0d8'],
  glowBerry: ['#6e8c16', '#a2c82c', '#d4ee5c', '#f2ffb4'],
  vine: ['#13301a', '#1c4525', '#275b30', '#33723c', '#428949'],
  fern: ['#11301a', '#1a4423', '#25592e', '#317039', '#3f8745', '#509e54'],
  shell: ['#7a6a3a', '#958550', '#b0a067', '#c9bb82', '#ded2a0', '#eee6c2'],
  shellSpot: ['#3e4a12', '#55641a', '#6c7e22'],
  egg: ['#2f5d78', '#3a6c88', '#477c98', '#558ca8', '#659cb6', '#77adc4'],   // v2.4: deeper blue, no spots
  eggSpot: ['#558ca8'],   // the turtle egg's spots blend into the shell
  iron: ['#2a2a2a', '#444444', '#5e5e5e', '#7a7a7a', '#969696', '#b4b4b4', '#d0d0d0'],
};

// ------------------------------------------------------------------ procedural patterns (all tile seamlessly at 16 px)
/** Wrapped Voronoi over {@code points}: nearest and second-nearest distance and the cell index. */
function voronoi(x, y, points) {
  let d1 = 99, d2 = 99, k = -1;
  points.forEach(([px, py], i) => {
    const dx = Math.min(Math.abs(x - px), 16 - Math.abs(x - px)), dy = Math.min(Math.abs(y - py), 16 - Math.abs(y - py));
    const d = Math.hypot(dx, dy);
    if (d < d1) { d2 = d1; d1 = d; k = i; } else if (d < d2) d2 = d;
  });
  return { d1, d2, k };
}

/** Overlapping chitin scales: 8x4 half-discs in offset rows, each lower row lying over the one above. */
function chitin(eye) {
  const img = blank(), R = 4.6;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    let best = null;
    for (let r = -1; r <= 4; r++) for (let c = -1; c <= 2; c++) {
      const cx = 8 * c + 4 * (((r % 2) + 2) % 2), cy = 4 * r;
      let dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      if (dy < 0) continue;
      const d = Math.hypot(dx, dy * 1.15);
      if (d <= R) best = { dx, dy, d };   // later (lower) rows win
    }
    let t;
    if (!best) t = 0.1;
    else {
      t = 0.95 - best.d / R * 0.55 - best.dx * 0.03;
      if (best.d > R - 1.0) t = 0.12;   // dark rim where it overlaps the next scale
      else if (best.d > R - 1.8) t -= 0.12;
    }
    t += (hash(x, y, 9) - 0.5) * 0.08;
    set(img, ((x % 16) + 16) % 16, y, pick(P.chitin, t));
  }
  if (eye) {
    // a glowing slit eye, 6x4, in the middle
    for (let y = 6; y < 10; y++) for (let x = 5; x < 11; x++) {
      const ex = (x + 0.5 - 8) / 3, ey = (y + 0.5 - 8) / 2;
      const r = ex * ex + ey * ey;
      if (r > 1.05) continue;
      if (r > 0.7) { set(img, x, y, hex('#0a120c')); continue; }
      if (Math.abs(x + 0.5 - 8) < 0.6) { set(img, x, y, hex('#06100a')); continue; }
      set(img, x, y, pick(P.eyeGlow, 1 - r * 0.9 + (y < 8 ? 0.15 : -0.1)));
    }
  }
  return img;
}

/** Flat stones set in packed earth (flagstone path top). */
function flagstoneTop() {
  const img = recolor(v('block/dirt_path_top'), all(['#33261a', '#3e2f1f', '#4a3825', '#56422b']));
  const stones = [[3, 3], [10, 2], [13, 9], [6, 9], [2, 13], [10, 14]];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const { d1, d2, k } = voronoi(x + 0.5, y + 0.5, stones);
    if (d2 - d1 < 1.4) continue;   // earth between the stones
    let t = 0.55 + (hash(k, 7) - 0.5) * 0.3 + (hash(x, y, 5) - 0.5) * 0.2;
    if (d2 - d1 < 2.2) t -= 0.15;
    set(img, x, y, pick(P.flag, t));
  }
  return img;
}

/** Iron pipe side: a lit cylinder across uv x 5..10, a flange band at the top (model uv 4..12 x 0..3). */
function pipeSide() {
  const img = blank();
  const shade = [0.25, 0.55, 0.8, 0.7, 0.5, 0.3, 0.2, 0.15];
  for (let y = 0; y < 16; y++) for (let x = 4; x < 12; x++) {
    const flange = y < 3, inPipe = x >= 5 && x < 11;
    if (!flange && !inPipe) continue;
    let t = shade[x - 4] + (flange ? 0.12 : 0) + (hash(x, y, 2) - 0.5) * 0.06;
    if (y === 2 || y === 3) t -= 0.25;                       // flange underside / seam
    if (!flange && (x === 5 || x === 10) && hash(x, y, 4) < 0.25) t -= 0.1;
    set(img, x, y, pick(P.iron, t));
  }
  return img;
}
function pipeEnd() {
  const img = blank();
  for (let y = 4; y < 12; y++) for (let x = 4; x < 12; x++) {
    const r = Math.hypot(x + 0.5 - 8, y + 0.5 - 8);
    let t = r < 1.6 ? 0.02 : r < 2.6 ? 0.3 : 0.75 - (x + y - 16) * 0.04;
    if (r > 3.9 && r < 4.6) t -= 0.25;
    set(img, x, y, pick(P.iron, t));
  }
  return img;
}

// ------------------------------------------------------------------ jobs
const jobs = {};
const block = (name, img) => { jobs['block/' + name] = img; };
const item = (name, img) => { jobs['item/' + name] = img; };
const border = (x, y) => x === 0 || y === 0 || x === 15 || y === 15;

function woodSet(name, src, bark, wood, leaf, leavesSrc, saplingSrc) {
  block(name + '_log', recolor(v('block/' + src + '_log'), all(bark)));
  block(name + '_log_top', recolor(v('block/' + src + '_log_top'), [{ when: (r, g, b, x, y) => border(x, y), ramp: bark }, { ramp: wood }]));
  block('stripped_' + name + '_log', recolor(v('block/stripped_' + src + '_log'), all(wood)));
  block('stripped_' + name + '_log_top', recolor(v('block/stripped_' + src + '_log_top'), all(wood)));
  block(name + '_planks', recolor(v('block/' + src + '_planks'), all(wood)));
  block(name + '_leaves', recolor(v('block/' + leavesSrc + '_leaves'), all(leaf)));
  block(name + '_sapling', recolor(v('block/' + saplingSrc), [{ when: isGreen, ramp: leaf, range: [0.15, 1] }, { ramp: bark, range: [0.2, 1] }]));
  const metal = (r, g, b) => sat(r, g, b) < 0.12 && lum(r, g, b) > 70;   // keep iron hinges/handles
  block(name + '_door_top', recolor(v('block/' + src + '_door_top'), [{ when: metal, ramp: P.iron, range: [0.3, 0.9] }, { ramp: wood }]));
  block(name + '_door_bottom', recolor(v('block/' + src + '_door_bottom'), [{ when: metal, ramp: P.iron, range: [0.3, 0.9] }, { ramp: wood }]));
  block(name + '_trapdoor', recolor(v('block/' + src + '_trapdoor'), [{ when: metal, ramp: P.iron, range: [0.3, 0.9] }, { ramp: wood }]));
  item(name + '_door', recolor(v('item/' + src + '_door'), [{ when: metal, ramp: P.iron, range: [0.3, 0.9] }, { ramp: wood }]));
}
woodSet('gnarlwood', 'dark_oak', P.gnarlBark, P.gnarlWood, P.gnarlLeaf, 'dark_oak', 'dark_oak_sapling');
// Gnarlwood bark carries moss; hivewood bark carries the Hive's green eyes
{
  const log = jobs['block/gnarlwood_log'];
  // green moss streaks running down the bark (user): a few 1-px columns of varying length, wrapping so the log tiles
  for (const [sx, sy, len] of [[1, 2, 7], [4, 9, 5], [6, 0, 9], [9, 5, 6], [12, 11, 8], [14, 3, 4]]) {
    for (let i = 0; i < len; i++) {
      const y = (sy + i) % 16, t = i === 0 || i === len - 1 ? 0.25 : 0.45 + 0.35 * hash(sx, y, 12);
      set(log, sx, y, pick(P.moss, t));
      if (i > 1 && i < len - 2 && hash(sx, y, 13) < 0.3) set(log, (sx + 1) % 16, y, pick(P.moss, 0.2));
    }
  }
}

// Overgrowth
const notMoss = (r, g, b) => !(g > r + 8 && sat(r, g, b) > 0.18);
block('ruin_stone', recolor(v('block/mossy_cobblestone'), [{ when: notMoss, ramp: P.ruin }]));
block('ruin_stone_bricks', recolor(v('block/mossy_stone_bricks'), [{ when: notMoss, ramp: P.ruin }]));
block('cracked_ruin_stone_bricks', recolor(v('block/cracked_stone_bricks'), all(P.ruin)));
block('chiseled_ruin_stone_bricks', recolor(v('block/chiseled_stone_bricks'), all(P.ruin)));
block('glowvine', recolor(v('block/cave_vines_lit'), [{ when: isWarm, ramp: P.glowBerry }, { ramp: P.vine }]));
block('glowvine_plant', recolor(v('block/cave_vines_plant_lit'), [{ when: isWarm, ramp: P.glowBerry }, { ramp: P.vine }]));
block('fogcap', recolor(v('block/red_mushroom'), [{ when: (r, g, b) => r > g + 30, ramp: P.fogcap }, { ramp: P.pale }]));
block('fogcap_block', recolor(v('block/red_mushroom_block'), [{ when: (r, g, b) => r > g + 30, ramp: P.fogcap }, { ramp: P.pale }]));
block('spire_fern_top', recolor(v('block/large_fern_top'), all(P.fern)));
block('spire_fern_bottom', recolor(v('block/large_fern_bottom'), all(P.fern)));

// Underdocks
const brick = (r, g, b) => r > b + 14;
block('dock_bricks', recolor(v('block/bricks'), [{ when: brick, ramp: P.dockBrick }, { ramp: P.dockMortar }]));
{
  const cracked = clone(jobs['block/dock_bricks']), cs = v('block/cracked_stone_bricks'), ss = v('block/stone_bricks');
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const a = get(cs, x, y), b = get(ss, x, y);
    if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) > 40 && lum(a[0], a[1], a[2]) < lum(b[0], b[1], b[2])) set(cracked, x, y, hex(P.dockMortar[0]));
  }
  block('cracked_dock_bricks', cracked);
}
const barnacle = recolor(v('block/tuff'), all(P.barnacle));
for (const [sx, sy] of [[2, 3], [9, 1], [13, 7], [5, 10], [11, 13], [1, 14]]) {   // pale barnacle rings with a dark pore
  const w = (dx, dy, c) => set(barnacle, (sx + dx + 16) % 16, (sy + dy + 16) % 16, hex(c));
  w(0, -1, '#8e9cb0'); w(-1, 0, '#8e9cb0'); w(1, 0, '#5f6d82'); w(0, 1, '#5f6d82'); w(0, 0, '#10161f');
}
block('polished_harbour_rock', recolor(v('block/polished_tuff'), all(P.barnaclePolished)));
// the spire column, like pointed dripstone: tip / frustum / middle / base
block('sludge', recolor(v('block/mud'), all(P.sludge)));

// Hive
block('hive_soil', recolor(v('block/coarse_dirt'), all(P.hiveSoil)));
// tough eggs (v2.4): blue, glossy, translucent, no spots - painted smooth instead of recoloured (the turtle egg's
// spots showed through). Block: every opaque texel of the turtle egg layout, light at the top of each egg face, darker
// below, one highlight texel per face. Item: an egg drawn as a shaded ellipse.
{
  const blk = v('block/turtle_egg'), out = clone(blk);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (!get(blk, x, y)[3]) continue;
    // the face this texel belongs to: find the top of its opaque run in this column
    let top = y; while (top > 0 && get(blk, x, top - 1)[3]) top--;
    let bot = y; while (bot < 15 && get(blk, x, bot + 1)[3]) bot++;
    const t = bot > top ? (y - top) / (bot - top) : 0.5;
    set(out, x, y, pick(P.egg, 0.85 - 0.6 * t), 205);
  }
  block('hive_egg', out);
  const it = { w: 16, h: 16, d: new Uint8Array(1024) };
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const nx = (x + 0.5 - 8) / 5.5, ny = (y + 0.5 - 8.6) / 6.6;
    const r2 = nx * nx + ny * ny * (ny < 0 ? 1.15 : 1);
    if (r2 > 1) continue;
    const edge = r2 > 0.78;
    const t = edge ? 0.05 : Math.max(0, Math.min(1, 0.75 - 0.45 * ny - 0.25 * nx - 0.3 * r2));
    set(it, x, y, pick(P.egg, t));
  }
  set(it, 6, 5, hex('#c8e6f0')); set(it, 6, 6, hex('#a0d0e2'));
  item('hive_egg', it);
}

// ------------------------------------------------------------------ write + optional preview sheet (8x, 10 per row)
for (const [name, img] of Object.entries(jobs)) writePng(OUT + name + '.png', img);
console.log('wrote ' + Object.keys(jobs).length + ' textures');
if (process.argv[3]) {
  const names = Object.keys(jobs), S = 6, cols = 10, cell = 16 * S + 6;
  const sheet = blank(cols * cell, Math.ceil(names.length / cols) * cell);
  for (let i = 0; i < sheet.w * sheet.h; i++) sheet.d.set([60, 60, 60, 255], i * 4);
  names.forEach((n, i) => {
    const img = jobs[n], ox = (i % cols) * cell + 3, oy = Math.floor(i / cols) * cell + 3;
    for (let y = 0; y < 16 * S; y++) for (let x = 0; x < 16 * S; x++) {
      const [r, g, b, a] = get(img, Math.floor(x / S), Math.floor(y / S));
      if (a > 0) set(sheet, ox + x, oy + y, [r, g, b]);
    }
  });
  writePng(process.argv[3], sheet);
  console.log(names.map((n, i) => i + ':' + n).join(' '));
}
