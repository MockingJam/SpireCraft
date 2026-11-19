// Crescent Spear, 32x32, in the form of the vanilla spear (long diagonal shaft, narrow leaf head) with the reference's
// colours: purple shaft with gold rings, gold head, small magenta crescent horns at the head's base.
// Colours are sampled from the reference painting (sheet 3). Usage: node tools/spear32.js <ref png dir> <out.png>
const { readPng, writePng } = require('./png');
const { sampleBox } = (() => {
  const lum = c => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
  function sampleBox(img, [x0, y0, x1, y1], k) {
    const cols = [];
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const p = (y * img.w + x) * 4, c = [img.d[p], img.d[p + 1], img.d[p + 2]];
      const mx = Math.max(...c), mn = Math.min(...c);
      if ((mn > 205 && mx - mn < 45) || lum(c) < 38) continue;
      cols.push(c);
    }
    cols.sort((a, b) => lum(a) - lum(b));
    let cent = Array.from({ length: k }, (_, i) => cols[Math.floor((i + 0.5) * cols.length / k)].slice());
    for (let it = 0; it < 10; it++) {
      const sum = cent.map(() => [0, 0, 0, 0]);
      for (const c of cols) { let b = 0, bd = Infinity; cent.forEach((m, j) => { const d = (c[0] - m[0]) ** 2 + (c[1] - m[1]) ** 2 + (c[2] - m[2]) ** 2; if (d < bd) { bd = d; b = j; } }); sum[b][0] += c[0]; sum[b][1] += c[1]; sum[b][2] += c[2]; sum[b][3]++; }
      cent = cent.map((m, j) => sum[j][3] ? [sum[j][0] / sum[j][3], sum[j][1] / sum[j][3], sum[j][2] / sum[j][3]].map(Math.round) : m);
    }
    return cent.sort((a, b) => lum(b) - lum(a));   // light → dark
  }
  return { sampleBox };
})();

const [refDir, out] = process.argv.slice(2);
const img = readPng(refDir + '/3.png');
const shaft = sampleBox(img, [710, 315, 760, 365], 3);
const ring = sampleBox(img, [765, 245, 825, 295], 3);
const head = sampleBox(img, [940, 55, 980, 145], 4);
const moon = sampleBox(img, [780, 165, 840, 225], 3);
const headRamp = [ring[0], head[1], head[2], ring[1], ring[2]];   // the painted head is gold → orange; its sampled box also caught highlights
const butt = sampleBox(img, [590, 435, 630, 485], 3);

const N = 32, C = 31;   // centre line s = x + y = 31
const grid = Array.from({ length: N }, () => Array(N).fill(null));
const paint = (test, colour) => {
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const s = x + y, t = x - y; if (test(s, t)) { const c = colour(s, t); if (c) grid[y][x] = c; } }
};
const pick = (ramp, f) => ramp[Math.max(0, Math.min(ramp.length - 1, Math.round(f * (ramp.length - 1))))];
const across = (ramp, s, half) => pick(ramp, (s - (C - half)) / (2 * half || 1));

// shaft (3 px), gold rings below the head and near the butt
paint((s, t) => t >= -27 && t <= 12 && Math.abs(s - C) <= 1, (s, t) =>
  [-24, -23, -22, 6, 7, 8, 10, 11].includes(t) ? across(ring, s, 1) : across(shaft, s, 1));
// butt spike
paint((s, t) => t >= -31 && t < -27 && Math.abs(s - C) <= (t >= -29 ? 1 : 0), (s) => across(butt, s, 1));
// crescent horns at the head's base, curving forward toward the tip
for (const side of [-1, 1]) for (let d = 2; d <= 8; d++) {
  const t0 = 8 + Math.round((d - 2) * 1.25), s0 = C + side * d;
  paint((s, t) => s === s0 && t >= t0 && t <= t0 + 3, (s, t) => d >= 7 ? pick(ring, 0.3) : t === t0 + 3 ? pick(ring, 0.1) : pick(moon, side < 0 ? 0.3 : 0.6));
}
// leaf-shaped head
const half = t => t < 13 ? -1 : t <= 14 ? 1 : t <= 19 ? 2 + (t >= 16 && t <= 18 ? 1 : 0) : Math.max(0, Math.round(3 * (31 - t) / 12));
paint((s, t) => t >= 13 && t <= 31 && Math.abs(s - C) <= half(t), (s, t) => s === C ? pick(headRamp, t > 22 ? 0 : 0.25) : s < C ? pick(headRamp, 0.4) : pick(headRamp, 0.8));

// outline: darkened neighbour colour
const dark = (c, f) => c.map(v => Math.round(v * f));
const outl = grid.map(r => r.slice());
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  if (grid[y][x]) continue;
  for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) { const n = grid[y + dy]?.[x + dx]; if (n) { outl[y][x] = dark(n, 0.32); break; } }
}
const d = new Uint8Array(N * N * 4);
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (outl[y][x]) d.set([...outl[y][x], 255], (y * N + x) * 4);
writePng(out, { w: N, h: N, d });
console.log('spear', { shaft, ring, head, moon });
