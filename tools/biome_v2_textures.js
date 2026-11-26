// Biomes v2 textures (docs/design/biomes_v2.md). Vanilla-style: anything with a vanilla counterpart is a recolour of
// that vanilla texture (shape, light and shadow stay vanilla; animations keep their .mcmeta); the new mushrooms, the
// ink bubble, the shelf fungus and the hive shroom are drawn by hand from pixel maps (they must not look like vanilla
// mushrooms). Palettes: dark harbours blue-black (user), ink black-violet, hive amber.
// Usage: node tools/biome_v2_textures.js <extracted client-extra.jar dir> [preview.png]
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
const blank = (w = 16, h = 16) => ({ w, h, d: new Uint8Array(w * h * 4) });
const clone = img => ({ w: img.w, h: img.h, d: new Uint8Array(img.d) });
const get = (img, x, y) => { const i = (y * img.w + x) * 4; return [img.d[i], img.d[i + 1], img.d[i + 2], img.d[i + 3]]; };
const set = (img, x, y, c, a = 255) => { const i = (y * img.w + x) * 4; img.d[i] = c[0]; img.d[i + 1] = c[1]; img.d[i + 2] = c[2]; img.d[i + 3] = a; };
const v = name => readPng(VANILLA + name + '.png');

/** Luminance-mapped recolour (same as tools/biome_textures.js): rules {when?, ramp, range?, gamma?}, first match wins. */
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
const border = (x, y) => x === 0 || y === 0 || x === 15 || y === 15;

/** A 16×16 pixel map: rows of characters, '.' transparent, others looked up in the palette. */
function map(rows, palette) {
  const img = blank();
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.' && palette[ch]) set(img, x, y, hex(palette[ch])); }));
  return img;
}

// ------------------------------------------------------------------ palettes (dark → light)
const P = {
  rotBark: ['#0e1116', '#161a21', '#1f242c', '#293038', '#343c45', '#414a53'],
  rotWood: ['#1a1e25', '#242a32', '#2f363f', '#3b434c', '#48515a', '#565f68'],
  mold: ['#2e3a36', '#3e4c44', '#506052'],
  iron: ['#2a2a2a', '#444444', '#5e5e5e', '#7a7a7a', '#969696', '#b4b4b4'],
  reed: ['#5e4614', '#7a5c1c', '#967426', '#b08c34', '#c8a446', '#dcbc5c'],   // golden reeds (user)
  cattail: ['#24170e', '#3a2616', '#52361f', '#6a4628'],
  shrub: ['#141820', '#1f242e', '#2b313c', '#38404c', '#47505c'],
  coral: ['#17141f', '#211d2b', '#2c2738', '#383146', '#463d55', '#564b66'],
  coralSick: ['#2a3a2e', '#3c5040', '#4e6650'],
  seagrass: ['#1a2420', '#24332c', '#2f4238', '#3b5244', '#486252'],
  kelp: ['#141f1c', '#1d2b27', '#273832', '#32463e', '#3e554a'],
  glowMoss: ['#1d3a18', '#2a4e20', '#386428', '#477a32'],
  glowDot: ['#c8f070', '#eaffb0'],
  lanternCap: ['#7a4a10', '#a8681a', '#d08e28', '#eab440', '#f8d870', '#fff2b0'],
  coralCap: ['#6a1e10', '#94301a', '#bc4826', '#de6a36', '#f08e52', '#fab680'],
  bluebellCap: ['#162a5a', '#203e7e', '#2e56a2', '#4272c2', '#6696da', '#98bcec'],
  ink: ['#040208', '#0b0614', '#140c22', '#201434', '#2e1e48', '#40295e'],
  inkStone: ['#0c0b12', '#15131c', '#1e1b27', '#282433', '#332e40', '#3f3a4e'],
  // cave stones: one hue each, moderate contrast (user: no clustered dark dots, harmonious colour)
  hiveRock: ['#5a4630', '#644f36', '#6f593d', '#7a6344', '#856d4b', '#907852'],
  deepHiveRock: ['#3c2e20', '#453526', '#4f3d2c', '#5a4632', '#644f38', '#6e583f'],
  deepInkStone: ['#0b0a10', '#111017', '#17151f', '#1e1b27', '#25212f', '#2d2838'],
  hiveRockPolished: ['#3a2d1e', '#4c3c28', '#5e4c34', '#715d40', '#866f4e'],
  comb: ['#3a1e04', '#5a3008', '#7e460e', '#a26018', '#c47e26', '#e09e3a'],
  wax: ['#8a5a10', '#c08a20', '#e8b840', '#ffe080'],
  quicksand: ['#8a7550', '#a08a60', '#b49e70', '#c6b282', '#d6c494', '#e2d2a6'],
};
const metal = (r, g, b) => sat(r, g, b) < 0.12 && lum(r, g, b) > 70;

const jobs = {}, metas = {};
const block = (name, img, meta) => { jobs['block/' + name] = img; if (meta) metas['block/' + name] = meta; };
const item = (name, img) => { jobs['item/' + name] = img; };
const meta = name => fs.readFileSync(VANILLA + name + '.png.mcmeta', 'utf8');

// ------------------------------------------------------------------ rotten wood (blue-black, moldy) from dark oak
{
  const moldy = img => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (get(img, x, y)[3] && hash(x >> 1, y >> 1, 21) < 0.12) set(img, x, y, pick(P.mold, hash(x, y, 22))); return img; };
  block('rotten_log', moldy(recolor(v('block/dark_oak_log'), all(P.rotBark))));
  block('rotten_log_top', recolor(v('block/dark_oak_log_top'), [{ when: (r, g, b, x, y) => border(x, y), ramp: P.rotBark }, { ramp: P.rotWood }]));
  block('stripped_rotten_log', recolor(v('block/stripped_dark_oak_log'), all(P.rotWood)));
  block('stripped_rotten_log_top', recolor(v('block/stripped_dark_oak_log_top'), all(P.rotWood)));
  block('rotten_planks', moldy(recolor(v('block/dark_oak_planks'), all(P.rotWood))));
  const doorRules = [{ when: metal, ramp: P.iron, range: [0.2, 0.8] }, { ramp: P.rotWood }];
  block('rotten_door_top', recolor(v('block/dark_oak_door_top'), doorRules));
  block('rotten_door_bottom', recolor(v('block/dark_oak_door_bottom'), doorRules));
  block('rotten_trapdoor', recolor(v('block/dark_oak_trapdoor'), doorRules));
  item('rotten_door', recolor(v('item/dark_oak_door'), doorRules));
}

// ------------------------------------------------------------------ harbour plants and polluted sea
{
  const top = recolor(v('block/tall_grass_top'), all(P.reed));
  // a cattail head on the top half
  for (let y = 4; y < 10; y++) for (let x = 7; x < 9; x++) set(top, x, y, pick(P.cattail, y < 5 ? 0.9 : x === 7 ? 0.6 : 0.3));
  set(top, 7, 3, hex(P.reed[3])); set(top, 8, 2, hex(P.reed[2]));
  block('reed_top', top);
  block('reed_bottom', recolor(v('block/tall_grass_bottom'), all(P.reed)));
  block('rotten_shrub', recolor(v('block/dead_bush'), all(P.shrub)));
  const sick = (r, g, b, x, y) => hash(x, y, 31) < 0.12;
  block('polluted_coral_block', recolor(v('block/dead_brain_coral_block'), [{ when: sick, ramp: P.coralSick }, { ramp: P.coral }]));
  block('polluted_tube_coral', recolor(v('block/dead_tube_coral'), all(P.coral)));
  block('polluted_horn_coral', recolor(v('block/dead_horn_coral'), all(P.coral)));
  block('polluted_coral_fan', recolor(v('block/dead_fire_coral_fan'), all(P.coral)));
  block('polluted_seagrass', recolor(v('block/seagrass'), all(P.seagrass)), meta('block/seagrass'));
  block('polluted_kelp', recolor(v('block/kelp'), all(P.kelp)), meta('block/kelp'));
  block('polluted_kelp_plant', recolor(v('block/kelp_plant'), all(P.kelp)), meta('block/kelp_plant'));
}

// ------------------------------------------------------------------ overgrowth: new mushrooms (hand-drawn), glow plants
const A = 'transparent';
block('lantern_cap', map([
  '................',
  '................',
  '.......ab.......',
  '......bcdb......',
  '.....bcdeeb.....',
  '....bcddeefb....',
  '....bcdeefgb....',
  '...abbcddeeba...',
  '...a.yyzzyy.a...',
  '......yzzy......',
  '.......ss.......',
  '.......st.......',
  '.......st.......',
  '......sstt......',
  '.....rsstt......',
  '................'], { a: '#7a4a10', b: '#a8681a', c: '#d08e28', d: '#eab440', e: '#f8d870', f: '#fff2b0', g: '#ffffff',
  y: '#ffe890', z: '#fffbe0', s: '#e8e0c8', t: '#bcb294', r: '#8a8270' }));
block('coral_cap', map([
  '................',
  '...ae......de...',
  '..adfe....dfea..',
  '...bd..ae..db...',
  '...cb.adfe.bc...',
  '....cb.bd.bc....',
  '.....cbcbbc.....',
  '..ae..ccbc..ea..',
  '.adfe..cc..efda.',
  '..bd...cb...db..',
  '...cb..cc..bc...',
  '....ccbccbcc....',
  '......cccc......',
  '.......cc.......',
  '......rccr......',
  '................'], { a: '#94301a', b: '#bc4826', c: '#94301a', d: '#de6a36', e: '#f08e52', f: '#fab680', r: '#5a1a0c' }));
block('bluebell_cap', map([
  '................',
  '.......t........',
  '......tt....t...',
  '.....t.t...tt...',
  '....bcbt..t.t...',
  '...bcdcbt.t..t..',
  '...bcddcbt..bcb.',
  '...abccba...cdcb',
  '....e..e...bccba',
  '.......t...a.e..',
  '.......t.....t..',
  '......tt.....t..',
  '......t......t..',
  '.....tt.....tt..',
  '....ttt....ttt..',
  '................'], { a: '#162a5a', b: '#2e56a2', c: '#4272c2', d: '#98bcec', e: '#c8e0ff', t: '#3a6a3a' }));
block('glow_shrub', (() => {
  const img = recolor(v('block/fern'), all(['#12301a', '#1a4423', '#25592e', '#317039', '#3f8745']));
  for (const [x, y] of [[3, 5], [11, 3], [7, 8], [12, 10], [4, 11], [9, 13], [6, 2]]) { set(img, x, y, hex(P.glowDot[1])); if (y + 1 < 16) set(img, x, y + 1, hex(P.glowDot[0])); }
  return img;
})());
block('glow_moss_carpet', (() => {
  const img = recolor(v('block/moss_block'), all(P.glowMoss));
  for (let i = 0; i < 9; i++) { const x = Math.floor(hash(i, 1, 41) * 16), y = Math.floor(hash(i, 2, 41) * 16); set(img, x, y, hex(P.glowDot[i % 2])); }
  return img;
})());
block('lantern_cap_block', recolor(v('block/red_mushroom_block'), [{ when: (r, g, b) => r > g + 30, ramp: P.lanternCap }, { ramp: ['#fff2c0', '#fffbe8'] }]));
block('coral_cap_block', recolor(v('block/red_mushroom_block'), [{ when: (r, g, b) => r > g + 30, ramp: P.coralCap }, { ramp: ['#f8d0b0', '#fff0e0'] }]));
block('bluebell_cap_block', recolor(v('block/red_mushroom_block'), [{ when: (r, g, b) => r > g + 30, ramp: P.bluebellCap }, { ramp: ['#c8dcff', '#eef4ff'] }]));
// shelf fungus: rows 0–6 the tiered top (concentric bands), 7–8 the cream rim, 9–15 the pale gilled underside
block('shelf_fungus', (() => {
  const img = blank();
  const bands = ['#5a2e12', '#7a4018', '#9a5620', '#b86e2c', '#c8843a', '#d89a4c', '#e6b26a'];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    let c;
    if (y < 7) c = bands[Math.min(6, Math.floor((7 - y) * 0.9 + (x % 5 === 0 ? 1 : 0)))];
    else if (y < 9) c = y === 7 ? '#f4e2b8' : '#d8c08c';
    else c = x % 2 === 0 ? '#e8d6aa' : '#cdb684';
    set(img, x, y, hex(c));
  }
  return img;
})());
item('shelf_fungus', map([
  '................',
  '................',
  '................',
  '..abbbbbbbbba...',
  '.abcccccccccba..',
  '.bcddddddddcb...',
  '.cdeeeeeeeedc...',
  '.rrrrrrrrrrrr...',
  '..ggggggggggw...',
  '....abbbbba.....',
  '...bccccccb.....',
  '...cddddddc.....',
  '...rrrrrrrr.....',
  '....gggggg......',
  '................',
  '................'], { a: '#5a2e12', b: '#7a4018', c: '#9a5620', d: '#b86e2c', e: '#d89a4c', r: '#f4e2b8', g: '#cdb684', w: '#e8d6aa' }));

// ------------------------------------------------------------------ ink spring caves
block('ink_still', recolor(v('block/lava_still'), all(P.ink)), meta('block/lava_still'));
block('ink_flow', recolor(v('block/lava_flow'), all(P.ink)), meta('block/lava_flow'));
{
  const stone = recolor(v('block/stone'), all(P.inkStone));
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (hash(x >> 1, y, 51) < 0.08) set(stone, x, y, hex('#3a2850'));   // violet ink veins
  block('ink_stained_stone', stone);
}
block('ink_bubble', map([
  '..abbbba.....ab.',
  '.abccccba...acdb',
  'abcdffccba..bccb',
  'abcfgfccba..abba',
  'bccffcccbb......',
  'bccccccbba......',
  'abccccbbaa......',
  '.abbbbbaa.......',
  '..aaaaaa..abba..',
  '..........bdcb..',
  '..........bccb..',
  '..........abba..',
  '................',
  '................',
  '................',
  '................'], { a: '#0b0614', b: '#201434', c: '#3a2654', d: '#6a4a8e', f: '#9a7ac4', g: '#e8dcff' }));
item('ink_bubble', map([
  '................',
  '................',
  '.....abbbba.....',
  '....abccccba....',
  '...abcdffccba...',
  '...abcfgfccba...',
  '...bccffcccbb...',
  '...bccccccbba...',
  '...abccccbbaa...',
  '....abbbbbaa....',
  '.....aaaaaa.....',
  '...........ab...',
  '..........abba..',
  '...........aa...',
  '................',
  '................'], { a: '#0b0614', b: '#201434', c: '#3a2654', d: '#6a4a8e', f: '#9a7ac4', g: '#e8dcff' }));
{
  const bucket = clone(v('item/lava_bucket'));
  const fluid = (r, g, b) => sat(r, g, b) > 0.3;   // the lava (orange and yellow), not the grey bucket
  item('ink_bucket', recolor(bucket, [{ when: fluid, ramp: P.ink.slice(1) }]));
}

// ------------------------------------------------------------------ hive caves
{
  // vanilla stone's grain in one amber-brown, with a handful of single darker / lighter pixels (never clusters)
  const rock = recolor(v('block/stone'), all(P.hiveRock));
  for (const [x, y] of [[3, 2], [12, 5], [7, 11], [14, 13]]) set(rock, x, y, hex('#4e3c29'));
  for (const [x, y] of [[9, 2], [2, 9], [11, 10]]) set(rock, x, y, hex('#9c845c'));
  block('hive_rock', rock);
  block('deep_hive_rock', recolor(v('block/deepslate'), all(P.deepHiveRock)));
  block('polished_hive_rock', recolor(v('block/polished_tuff'), all(P.hiveRockPolished)));
  block('hive_rock_bricks', recolor(v('block/tuff_bricks'), all(P.hiveRockPolished)));
  block('hive_comb', recolor(v('block/honeycomb_block'), all(P.comb)));
  const cache = recolor(v('block/honeycomb_block'), all(P.comb.slice(0, 4)));
  for (let y = 4; y < 12; y++) for (let x = 4; x < 12; x++) {   // a waxed-over chamber in the middle
    const d = Math.hypot(x - 7.5, y - 7.5);
    if (d < 3.6) set(cache, x, y, pick(P.wax, d < 1.5 ? 1 : d < 2.6 ? 0.66 : 0.33));
  }
  block('hive_cache', cache);
}
block('hive_shroom', map([
  '................',
  '................',
  '................',
  '.....abbbba.....',
  '....abcdccba....',
  '...abcdecdcba...',
  '...bcdcdcdccb...',
  '...abbbbbbbba...',
  '......sgs.......',
  '......sgs.......',
  '...ab.sgs.......',
  '..abcbsgs..aba..',
  '..bbbbsgs.abcba.',
  '.....ssgss.bbb..',
  '....sssggss.s...',
  '................'], { a: '#5a4214', b: '#8a6a24', c: '#c8a440', d: '#e8c860', e: '#fff0a0', s: '#d8cca0', g: '#a89a70' }));

// ------------------------------------------------------------------ quicksand: sand, wetter, with a ripple
{
  const qs = recolor(v('block/sand'), all(P.quicksand));
  for (let x = 0; x < 16; x++) { const y = 5 + Math.round(Math.sin(x * 0.7) * 1.2); set(qs, x, y, hex(P.quicksand[1])); set(qs, x, y + 7 > 15 ? 15 : y + 7, hex(P.quicksand[1])); }
  block('quicksand', qs);
}

// (the cave stones' ores are drawn by biome_v3_textures.js since v2.3)

// ------------------------------------------------------------------ write + preview
for (const [name, img] of Object.entries(jobs)) {
  fs.mkdirSync(require('path').dirname(OUT + name + '.png'), { recursive: true });
  writePng(OUT + name + '.png', img);
  if (metas[name]) fs.writeFileSync(OUT + name + '.png.mcmeta', metas[name]);
}
console.log('wrote ' + Object.keys(jobs).length + ' textures');
if (process.argv[3]) {
  const names = Object.keys(jobs), S = 6, cols = 9, cell = 16 * S + 6;
  const sheet = blank(cols * cell, Math.ceil(names.length / cols) * cell);
  for (let i = 0; i < sheet.w * sheet.h; i++) sheet.d.set([90, 90, 90, 255], i * 4);
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
