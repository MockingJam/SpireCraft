// Scourge (whip), 32x32, drawn by hand so the three cords stay apart (downscaling the painting merged them).
// Layout follows the reference (sheet 10): leather handle with silver rings lower-left, three dark cords looping
// right → over the top → down to thin tips on the left, silver studs along each cord. Colours sampled from the painting.
// Usage: node tools/whip32.js <ref png dir> <out.png>
const { readPng, writePng } = require('./png');
const [refDir, out] = process.argv.slice(2);
const img = readPng(refDir + '/10.png');
const lum = c => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
function sample([x0, y0, x1, y1], k) {
  const cols = [];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const p = (y * img.w + x) * 4, c = [img.d[p], img.d[p + 1], img.d[p + 2]];
    if (Math.min(...c) > 205 && Math.max(...c) - Math.min(...c) < 45) continue;
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
const leather = sample([608, 415, 668, 465], 3);
const ring = sample([708, 360, 743, 405], 3);
const cord = sample([688, 205, 728, 228], 2);
const stud = sample([738, 155, 768, 190], 3);
const cap = sample([568, 475, 593, 515], 2);

const N = 32;
const g = Array.from({ length: N }, () => Array(N).fill(null));   // [colour, outlineColour|null]
const put = (x, y, c, k = null) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < N && y < N) g[y][x] = [c, k]; };
const dark = (c, f) => c.map(v => Math.round(v * f));

// cords: elliptical loops around C, each starting under the handle tip and ending in a thin tip on the left
const C = [17.5, 12.5];
const loops = [[12.5, 10.5], [9, 7.2], [5.6, 4.2]];
const handleTip = [12, 17];
const studsAt = [[82, 50, 18, -15, -55, -105, -150, 165], [78, 40, 5, -35, -85, -135], [70, 25, -20, -95]];   // lower loops carry studs too
loops.forEach(([rx, ry], li) => {
  const start = 100, end = -205 + li * 18;
  let prev = null;
  for (let a = start; a >= end; a -= 2) {
    const r = a * Math.PI / 180, x = C[0] + rx * Math.cos(r), y = C[1] + ry * Math.sin(r);
    const rel = (start - a) / (start - end);
    put(x, y, cord[1]);
    if (rel < 0.85) put(C[0] + (rx - 0.7) * Math.cos(r), C[1] + (ry - 0.7) * Math.sin(r), cord[1]);   // 2 px thick except the tapering tip
    if (!prev) {   // join the handle tip to the loop start
      const [hx, hy] = handleTip, steps = Math.ceil(Math.hypot(x - hx, y - hy));
      for (let i = 0; i <= steps; i++) put(hx + (x - hx) * i / steps, hy + (y - hy) * i / steps, cord[1]);
    }
    prev = [x, y];
  }
  for (const a of studsAt[li]) {
    const r = a * Math.PI / 180, x = Math.round(C[0] + rx * Math.cos(r)), y = Math.round(C[1] + ry * Math.sin(r));
    put(x, y, stud[0]); put(x - 1, y, stud[0]); put(x, y - 1, stud[0]); put(x + 1, y, stud[1]); put(x, y + 1, stud[1]);
  }
});

// handle: 3-px leather grip from the cap (lower-left) to the tip, two silver rings at the top, a cap at the end
for (let i = 0; i <= 12; i++) {
  const t = i / 12, x = 2 + (handleTip[0] - 2) * t, y = 28 + (handleTip[1] - 28) * t;
  const isRing = i >= 10, isCap = i <= 1;
  const ramp = isRing ? ring : isCap ? cap.concat(cap) : leather;
  const wrap = !isRing && !isCap && i % 2 === 0;
  for (const [ox, oy, f] of [[-1, -1, 0], [0, 0, 1], [1, 1, 2]]) put(x + ox * 0.6 - 0.2, y + oy * 0.6, wrap && f === 1 ? ramp[0] : ramp[Math.min(ramp.length - 1, f)], dark(leather[2], 0.35));
}

// outline only around handle and studs (the cords are dark already and must keep their gaps)
const o = g.map(r => r.slice());
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  if (g[y][x]) continue;
  for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) { const n = g[y + dy]?.[x + dx]; if (n && n[1]) { o[y][x] = [n[1], null]; break; } }
}
const d = new Uint8Array(N * N * 4);
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (o[y][x]) d.set([...o[y][x][0], 255], (y * N + x) * 4);
writePng(out, { w: N, h: N, d });
