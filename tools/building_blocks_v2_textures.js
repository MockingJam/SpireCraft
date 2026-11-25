// Building block textures v2 (2026-11-25, user: "the polished blocks must not use vanilla stone as their background - draw
// your own designs, with inset or raised patterns").
// Each is drawn here pixel by pixel on the block's own single-hue ramp (index 0 = darkest), lit from the top left:
//   polished_automaton_alloy  - a brass plate: raised bevelled rim, an inset groove square, four corner rivets
//   polished_orange_dough     - a dough tile: raised rim, a raised four-point star (the Regent's) in the middle
//   orange_dough_bricks       - running-bond bricks 8x4, each bevelled, dark mortar
//   automaton_alloy_lamp(_on) - a brass frame with a cross bar over four amber panes (dull off, glowing on)
//   star_lamp                 - a gold frame round a glowing panel with a white four-point star
// Usage: node tools/building_blocks_v2_textures.js
const path = require('path');
const { writePng } = require('./png');
const OUT = path.resolve(__dirname, '../src/main/resources/assets/spirecraft/textures/block/');
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const BRASS = ['#6e5430', '#927544', '#b49a5e', '#d2bc80', '#ebdcaa'];
const DOUGH = ['#8e340d', '#ac4511', '#c75915', '#dc6e1c', '#ec8629', '#f6a03e', '#fbbb5c'];
const GOLD = ['#7a4f0e', '#a06a12', '#c78a1a', '#e3ab2c', '#f5cc52'];
const AMBER_OFF = ['#3a2410', '#4f3216', '#66421c', '#7e5524', '#94672e'];
const AMBER_ON = ['#b86a12', '#de8f1c', '#f4b42c', '#ffd659', '#fff0a8'];
const GLOW = ['#e07a1a', '#f29a2a', '#fbbd4a', '#ffdb7a', '#fff3c4', '#ffffff'];
const CHAR = ['#141114', '#1c181b', '#242023', '#2d282a', '#373133', '#413a3b'];
let seed = 7;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const grid = (v = 0) => Array.from({ length: 16 }, () => Array(16).fill(v));
/** g[y][x] = an index into ramp, or [otherRamp, index] */
function img(g, ramp) {
  const o = { w: 16, h: 16, d: new Uint8Array(1024) };
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const v = g[y][x], [r, i] = Array.isArray(v) ? v : [ramp, v];
    o.d.set([...hex(r[Math.max(0, Math.min(r.length - 1, i))]), 255], (y * 16 + x) * 4);
  }
  return o;
}
/** a bevelled rectangle outline: light on its top and left, dark on its bottom and right (raised); swapped when inset */
function bevel(g, x0, y0, x1, y1, lo, hi, inset = false) {
  const [a, b] = inset ? [lo, hi] : [hi, lo];
  for (let x = x0; x <= x1; x++) { g[y0][x] = a; g[y1][x] = b; }
  for (let y = y0; y <= y1; y++) { g[y][x0] = a; g[y][x1] = b; }
  g[y1][x0] = Math.round((a + b) / 2); g[y0][x1] = Math.round((a + b) / 2);
}
const jobs = {};

seed = 11;
{ // polished alloy plate
  const g = grid(2);
  for (let y = 1; y < 15; y++) for (let x = 1; x < 15; x++) if (rnd() < 0.08) g[y][x] = 3;
  bevel(g, 0, 0, 15, 15, 1, 4);
  bevel(g, 4, 4, 11, 11, 1, 3, true);   // the groove square
  for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) { g[y][x] = 4; g[y + 1][x + 1] = 1; }
  jobs.polished_automaton_alloy = img(g, BRASS);
}
seed = 23;
{ // polished dough: raised rim, raised four-point star
  const g = grid(3);
  for (let y = 2; y < 14; y++) for (let x = 2; x < 14; x++) if (rnd() < 0.1) g[y][x] = rnd() < 0.5 ? 2 : 4;
  bevel(g, 0, 0, 15, 15, 1, 5);
  bevel(g, 1, 1, 14, 14, 2, 4, true);
  const inStar = (x, y) => { const dx = Math.abs(x - 7.5), dy = Math.abs(y - 7.5); return dx * dy < 3.2 && dx + dy < 6.6 && Math.max(dx, dy) < 6.1; };
  for (let y = 2; y < 14; y++) for (let x = 2; x < 14; x++) if (inStar(x, y)) {
    const lit = !inStar(x - 1, y) || !inStar(x, y - 1), shade = !inStar(x + 1, y) || !inStar(x, y + 1);
    g[y][x] = lit ? 6 : shade ? 2 : 4;
  }
  jobs.polished_orange_dough = img(g, DOUGH);
}
seed = 31;
{ // dough bricks, running bond
  const g = grid(0);
  for (let row = 0; row < 4; row++) for (let k = 0; k < 3; k++) {
    const y0 = row * 4, x0 = k * 8 - (row % 2 ? 4 : 0), tone = rnd() < 0.5 ? 3 : 4;
    for (let y = y0; y < y0 + 3; y++) for (let dx = 0; dx < 7; dx++) {
      const x = ((x0 + dx) % 16 + 16) % 16;
      g[y][x] = y === y0 ? tone + 2 : y === y0 + 2 ? tone - 1 : dx === 0 ? tone + 1 : dx === 6 ? tone - 1 : (rnd() < 0.12 ? tone + 1 : tone);
    }
  }
  jobs.orange_dough_bricks = img(g, DOUGH);
}
function lamp(glass, on) {
  const g = grid(2);
  bevel(g, 0, 0, 15, 15, 1, 4);
  bevel(g, 1, 1, 14, 14, 2, 3);
  for (let y = 2; y <= 13; y++) for (let x = 2; x <= 13; x++) {
    if (x === 2 || y === 2 || x === 13 || y === 13) { g[y][x] = 1; continue; }   // the frame's inner shadow
    if (x === 7 || x === 8 || y === 7 || y === 8) { g[y][x] = (x === 7 || y === 7) ? 3 : 2; continue; }   // the cross bar
    const px = x < 7 ? x - 3 : x - 9, py = y < 7 ? y - 3 : y - 9;   // 0..3 inside a pane
    let i = 2 + (px + py < 3 ? 1 : 0) - (px + py > 4 ? 1 : 0);
    if (px === 0 && py === 0) i = 4;
    g[y][x] = [glass, on ? i : i - 1];
  }
  return img(g, BRASS);
}
jobs.automaton_alloy_lamp = lamp(AMBER_OFF, false);
jobs.automaton_alloy_lamp_on = lamp(AMBER_ON, true);
{ // star lamp
  const g = grid(2);
  bevel(g, 0, 0, 15, 15, 1, 4);
  bevel(g, 1, 1, 14, 14, 1, 3, true);
  for (let y = 2; y <= 13; y++) for (let x = 2; x <= 13; x++) {
    const d = Math.hypot(x - 7.5, y - 7.5), dx = Math.abs(x - 7.5), dy = Math.abs(y - 7.5);
    let i = d < 2 ? 4 : d < 4 ? 3 : d < 5.5 ? 2 : d < 7 ? 1 : 0;
    if (dx * dy < 2.6 && dx + dy < 6.1) i = dx + dy < 2.6 ? 5 : 4;
    g[y][x] = [GLOW, i];
  }
  jobs.star_lamp = img(g, GOLD);
}
// (the meteorite block was removed 2026-11-25 - the crater is lined with blackstone and basalt)
for (const [n, im] of Object.entries(jobs)) writePng(path.join(OUT, n + '.png'), im);
console.log('wrote', Object.keys(jobs).join(', '));
