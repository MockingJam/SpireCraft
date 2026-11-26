// Offline preview of generated templates (2026-11-26): runs a structure generator module with Struct.save captured
// instead of written, and draws each template as an isometric picture (optionally cut away above a height, and a
// top-down plan of one layer) - to check layouts without starting the game.
// Usage: node tools/structures/preview.js <generator module> <out dir> [id filter] [--cut=y] [--plan=y] [--px=3]
const path = require('path');
const lib = require('./lib');
const { writePng } = require('../png');
const [mod, outDir, filter] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? +a.split('=')[1] : d; };
const CUT = arg('cut', 1e9), PLAN = arg('plan', -1), PX = arg('px', 3), TURN = arg('turn', 0);

const captured = [];
lib.Struct.prototype.save = function (id) { captured.push([id, this]); return 'spirecraft:' + id; };
const special = () => {}, loot = () => {};
require(path.resolve(mod))({ Struct: lib.Struct, rng: lib.rng, loot, special, jigsaw: () => {} });

const COL = [
  [/lava|magma/, [235, 110, 25]], [/water/, [60, 95, 205]], [/soul_(campfire|lantern|torch|fire)/, [90, 220, 230]], [/campfire|lantern|torch|glowstone|shroomlight|froglight|sea_lantern|copper_bulb|redstone_lamp|end_rod/, [255, 215, 110]],
  [/grass_block|moss/, [96, 150, 66]], [/^snow/, [240, 246, 250]], [/ice/, [170, 200, 245]], [/gravel/, [132, 126, 122]], [/grass_block|moss/, [96, 150, 66]], [/dirt|podzol|mud(?!_brick)|farmland/, [122, 86, 58]], [/sand(?!stone)/, [218, 206, 150]],
  [/sandstone/, [210, 190, 130]], [/cobbled_deepslate/, [82, 82, 88]], [/polished_deepslate|chiseled_deepslate/, [64, 64, 72]], [/deepslate_tile/, [52, 52, 60]], [/deepslate/, [74, 74, 82]],
  [/blackstone/, [44, 38, 46]], [/red_nether/, [110, 22, 24]], [/nether_brick/, [64, 32, 38]], [/netherrack/, [110, 50, 50]], [/basalt/, [78, 78, 84]], [/soul_s/, [86, 66, 52]],
  [/purpur/, [168, 122, 168]], [/end_stone/, [222, 222, 162]], [/quartz/, [236, 230, 224]], [/calcite/, [226, 226, 222]], [/tuff/, [108, 110, 100]], [/terracotta/, [160, 92, 62]],
  [/automaton_alloy/, [206, 170, 82]], [/oxidized/, [86, 160, 140]], [/weathered/, [104, 150, 112]], [/exposed/, [160, 126, 100]], [/copper/, [200, 118, 80]],
  [/dark_oak/, [70, 46, 22]], [/spruce/, [112, 80, 50]], [/oak/, [160, 128, 80]], [/birch/, [200, 184, 130]], [/mangrove/, [118, 54, 48]], [/bamboo/, [190, 170, 80]],
  [/glass|pane/, [185, 205, 225]], [/iron_bars|chain/, [150, 150, 156]], [/iron_block|anvil/, [200, 200, 205]], [/gold/, [235, 200, 70]], [/stone_brick|stone$|smooth_stone|andesite|cobblestone/, [124, 124, 124]],
  [/purple/, [120, 54, 150]], [/red_/, [160, 40, 36]], [/black_/, [30, 30, 34]], [/white_|wool/, [226, 226, 226]], [/cyan/, [30, 140, 150]], [/brown/, [110, 74, 44]], [/green|leaves/, [70, 110, 40]],
  [/slime/, [116, 196, 96]], [/hay/, [204, 172, 54]], [/bookshelf|lectern/, [150, 110, 70]], [/glory_gate/, [255, 60, 200]], [/spawner/, [40, 60, 90]], [/chest|barrel/, [170, 120, 60]],
];
const color = st => { for (const [re, c] of COL) if (re.test(st)) return c; let h = 0; for (const ch of st) h = (h * 31 + ch.charCodeAt(0)) | 0; return [110 + (h & 31), 110 + ((h >> 5) & 31), 110 + ((h >> 10) & 31)]; };
const thin = st => /pane|bars|fence|wall|torch|lantern|carpet|rail|banner|chain|ladder|button|candle|flower|rod|slab\[type=bottom\]|snow\[|cobweb|scaffolding/.test(st);

for (const [id, s] of captured) {
  if (filter && !id.includes(filter)) continue;
  const cells = [];
  s.forEach((x, y, z, st) => { if (st && st !== 'air' && st !== 'cave_air' && y <= CUT) cells.push([x, y, z, st]); });
  // turn the view
  const rot = ([x, y, z]) => { switch (TURN % 4) { case 1: return [s.d - 1 - z, y, x]; case 2: return [s.w - 1 - x, y, s.d - 1 - z]; case 3: return [z, y, s.w - 1 - x]; default: return [x, y, z]; } };
  const P = PX, Wd = (s.w + s.d) * P * 2 + 20, Ht = (s.w + s.d) * P + s.h * P * 2.4 + 20;
  const img = { w: Math.ceil(Wd), h: Math.ceil(Ht), d: new Uint8Array(Math.ceil(Wd) * Math.ceil(Ht) * 4).fill(255) };
  for (let i = 0; i < img.w * img.h; i++) img.d.set([200, 206, 214, 255], i * 4);
  const put = (px, py, c) => { if (px < 0 || py < 0 || px >= img.w || py >= img.h) return; img.d.set([c[0], c[1], c[2], 255], (py * img.w + px) * 4); };
  const ox = s.d * P * 2 + 10, oy = s.h * P * 2.4 + 10;
  const items = cells.map(c => { const [x, y, z] = rot(c); return [x, y, z, c[3]]; });
  items.sort((a, b) => (a[0] + a[2]) - (b[0] + b[2]) || a[1] - b[1]);
  for (const [x, y, z, st] of items) {
    const c = color(st), sx = ox + (x - z) * P * 2, sy = oy + (x + z) * P - y * P * 2.4;
    const t = thin(st) ? 0.5 : 1;
    // top face (diamond), left and right faces
    for (let i = -P * 2; i < P * 2; i++) for (let j = -P; j < P; j++) if (Math.abs(i) / 2 + Math.abs(j) <= P) put(Math.round(sx + i), Math.round(sy + j - P * 2.4 * (t < 1 ? 0.5 : 1) + P * 2.4 * 0), c.map(v => Math.min(255, v + 12)));
    for (let i = 0; i < P * 2; i++) for (let k = 0; k < P * 2.4 * t; k++) {
      const yy = Math.round(sy + i / 2 + k - P * 2.4 * t + P * 2.4 * t);
      put(Math.round(sx - P * 2 + i), Math.round(sy - P + i / 2 + k), c.map(v => v * 0.78));
      put(Math.round(sx + i), Math.round(sy + i / 2 + k), c.map(v => v * 0.6));
      void yy;
    }
  }
  const name = id.replace(/[\/:]/g, '_');
  writePng(path.join(outDir, name + '.png'), img);
  if (PLAN >= 0) {
    const q = 4, pl = { w: s.w * q, h: s.d * q, d: new Uint8Array(s.w * q * s.d * q * 4) };
    for (let x = 0; x < s.w; x++) for (let z = 0; z < s.d; z++) {
      let st = s.get(x, PLAN, z), c = st && st !== 'air' ? color(st) : null;
      if (!c) { const below = s.get(x, PLAN - 1, z); c = below && below !== 'air' ? color(below).map(v => v * 0.5 + 100) : [230, 230, 230]; }
      for (let i = 0; i < q; i++) for (let j = 0; j < q; j++) pl.d.set([c[0], c[1], c[2], 255], ((z * q + j) * pl.w + x * q + i) * 4);
    }
    writePng(path.join(outDir, name + '_plan' + PLAN + '.png'), pl);
  }
  console.log(id, s.w + 'x' + s.h + 'x' + s.d, cells.length, 'blocks');
}
