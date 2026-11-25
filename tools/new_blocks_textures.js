// Textures for the 2026-11-25 building blocks, recoloured from the vanilla block each one stands in for (so they sit
// next to vanilla blocks naturally), in the mod's own palettes:
//   polished_automaton_alloy        - vanilla polished andesite's bevelled face in the brass alloy ramp
//   automaton_alloy_lamp(_on)       - the redstone lamp: its frame in brass, its glass amber (dark when off, glowing on)
//   polished_orange_dough           - polished andesite's face in the Orange Dough ramp
//   orange_dough_bricks             - vanilla stone bricks in the Orange Dough ramp
//   star_lamp                       - the sea lantern's frame in gold, its glow orange-gold, a four-point star in the middle
//   star_glass                      - orange stained glass warmed to orange-gold, two small star glints
// Usage: node tools/new_blocks_textures.js <dir with the vanilla block pngs>
const path = require('path');
const { readPng, writePng } = require('./png');
const V = process.argv[2], OUT = path.resolve(__dirname, '../src/main/resources/assets/spirecraft/textures/block/');
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const sat = (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b);
const frame0 = img => ({ w: 16, h: 16, d: img.d.slice(0, 16 * 16 * 4) });   // first frame of an animated strip
/** map each pixel's brightness onto a ramp (spread over the image's own range); `pickRamp(px)` may choose per pixel */
function recolor(src, pickRamp, alphaKeep = false) {
  const out = { w: 16, h: 16, d: new Uint8Array(1024) };
  let lo = 255, hi = 0;
  for (let i = 0; i < 1024; i += 4) { if (src.d[i + 3] < 10) continue; const L = lum(src.d[i], src.d[i + 1], src.d[i + 2]); lo = Math.min(lo, L); hi = Math.max(hi, L); }
  for (let i = 0; i < 1024; i += 4) {
    const r = src.d[i], g = src.d[i + 1], b = src.d[i + 2], a = src.d[i + 3];
    const ramp = pickRamp(r, g, b, i / 4), t = (lum(r, g, b) - lo) / Math.max(1, hi - lo);
    const c = hex(ramp[Math.max(0, Math.min(ramp.length - 1, Math.round(t * (ramp.length - 1))))]);
    out.d.set([...c, alphaKeep ? a : 255], i);
  }
  return out;
}
// the alloy's own ramp: 7 brightness quantiles of automaton_alloy_block, so the polished block and the lamp frame match it
const BRASS = (() => { const a = readPng(path.join(OUT, 'automaton_alloy_block.png')), px = []; for (let i = 0; i < 1024; i += 4) px.push([a.d[i], a.d[i + 1], a.d[i + 2]]); px.sort((p, q) => lum(...p) - lum(...q)); return [0.04, 0.18, 0.34, 0.5, 0.66, 0.82, 0.97].map(t => '#' + px[Math.floor(t * (px.length - 1))].map(v => v.toString(16).padStart(2, '0')).join('')); })();
const DOUGH = ['#8e340d', '#ac4511', '#c75915', '#dc6e1c', '#ec8629', '#f6a03e', '#fbbb5c'];
const AMBER_OFF = ['#3a2410', '#4f3216', '#66421c', '#7e5524'];
const AMBER_ON = ['#b86a12', '#de8f1c', '#f4b42c', '#ffd659', '#fff0a8'];
const GOLD = ['#7a4f0e', '#a06a12', '#c78a1a', '#e3ab2c', '#f5cc52'];
const GLOW = ['#e07a1a', '#f29a2a', '#fbbd4a', '#ffdb7a', '#fff3c4'];
const jobs = {};
jobs.polished_automaton_alloy = recolor(readPng(path.join(V, 'polished_andesite.png')), () => BRASS);
jobs.polished_orange_dough = recolor(readPng(path.join(V, 'polished_andesite.png')), () => DOUGH);
jobs.orange_dough_bricks = recolor(readPng(path.join(V, 'stone_bricks.png')), () => DOUGH);
// the lamp: vanilla's frame is the grey/brown low-saturation part, its glass the red part
jobs.automaton_alloy_lamp = recolor(readPng(path.join(V, 'redstone_lamp.png')), (r, g, b) => sat(r, g, b) > 40 && r > g ? AMBER_OFF : BRASS);
jobs.automaton_alloy_lamp_on = recolor(readPng(path.join(V, 'redstone_lamp_on.png')), (r, g, b) => sat(r, g, b) > 40 && r > b ? AMBER_ON : BRASS);
// the star lamp: the sea lantern's light frame -> gold, its inner glow -> orange-gold, then a four-point star
{
  const sl = frame0(readPng(path.join(V, 'sea_lantern.png')));
  const img = recolor(sl, (r, g, b, k) => { const x = k % 16, y = k >> 4; return x < 2 || y < 2 || x > 13 || y > 13 ? GOLD : GLOW; });
  const star = [[7, 4], [8, 4], [7, 5], [8, 5], [6, 6], [7, 6], [8, 6], [9, 6], [4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [11, 7], [4, 8], [5, 8], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [6, 9], [7, 9], [8, 9], [9, 9], [7, 10], [8, 10], [7, 11], [8, 11]];
  for (const [x, y] of star) img.d.set([...hex(Math.abs(x - 7.5) + Math.abs(y - 7.5) < 2.2 ? '#ffffff' : '#fff3c4'), 255], (y * 16 + x) * 4);
  jobs.star_lamp = img;
}
// the glass: vanilla orange glass, warmer, alpha kept, two glints
{
  const g = recolor(readPng(path.join(V, 'orange_stained_glass.png')), () => ['#c76a12', '#e88a1e', '#f7aa32', '#ffcc5a', '#ffe9a0'], true);
  for (const [x, y] of [[4, 4], [11, 10]]) for (const [dx, dy, a] of [[0, 0, 230], [1, 0, 160], [-1, 0, 160], [0, 1, 160], [0, -1, 160]]) g.d.set([255, 246, 210, a], ((y + dy) * 16 + x + dx) * 4);
  jobs.star_glass = g;
}
// 2026-11-25 round 3: the polished blocks, bricks and lamps are drawn by tools/building_blocks_v2_textures.js now
// (user: not on vanilla stone) - this one only writes the star glass
for (const [n, img] of Object.entries(jobs)) if (n === 'star_glass') writePng(path.join(OUT, n + '.png'), img);
console.log('wrote star_glass');
