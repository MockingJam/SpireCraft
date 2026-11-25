// Smooth art -> 16x16 texture (user 2026-11-25: draw non-pixel art first, then pixelize).
//   blocks: each 16x16 cell of the 256 px drawing is averaged (it tiles, so no edge handling), then the 256 cells are
//           snapped to a palette found by k-means on the cells themselves (8 colours), so the colours come from the art;
//   items:  a cell is opaque if at least 45% of it is covered; its colour is the average of the covered pixels; the same
//           palette step; then a 1 px outline: every opaque pixel touching transparency is darkened to ~half its
//           brightness (vanilla: the outline is a dark tone of the neighbouring colour, never pure black).
// Usage: node tools/art/pixelize_tex.js [name filter] [preview.png]
const fs = require('fs'), path = require('path');
const { readPng, writePng } = require('../png');
const HI = path.join(__dirname, 'hires'), OUT = path.resolve(__dirname, '../../src/main/resources/assets/spirecraft/textures');
const [filter, preview] = process.argv.slice(2);
const AVG = ['core_crystal_block', 'cracked_core_crystal_block', 'flak_shell', 'orange_dough_lump'];   // smooth gradients
const COVER = { flak_shell: 0.6 };   // round silhouettes: a stricter coverage avoids bumps at the four sides
/** must match idRGB in textures.html */
const idRGB = id => id === 0 ? [0, 0, 0] : [40 + (id * 97) % 216, 40 + (id * 151) % 216, 40 + (id * 59) % 216];
const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

function kmeans(cols, k) {
  // start from colours spread over the brightness range, then refine
  const sorted = [...cols].sort((a, b) => a[0] + a[1] + a[2] - b[0] - b[1] - b[2]);
  let cent = Array.from({ length: k }, (_, i) => sorted[Math.floor((i + 0.5) / k * sorted.length)].slice());
  for (let it = 0; it < 30; it++) {
    const sum = cent.map(() => [0, 0, 0, 0]);
    for (const c of cols) { let bi = 0; cent.forEach((m, i) => { if (d2(c, m) < d2(c, cent[bi])) bi = i; }); sum[bi][0] += c[0]; sum[bi][1] += c[1]; sum[bi][2] += c[2]; sum[bi][3]++; }
    cent = cent.map((m, i) => sum[i][3] ? [sum[i][0] / sum[i][3], sum[i][1] / sum[i][3], sum[i][2] / sum[i][3]] : m);
  }
  return cent.map(m => m.map(Math.round));
}
const nearest = (c, pal) => pal.reduce((b, m) => d2(c, m) < d2(c, b) ? m : b, pal[0]);

function pixelize(file) {
  const src = readPng(path.join(HI, file)), name = file.replace('.png', ''), [kind, id] = name.split('__'), block = kind === 'block';
  const C = src.w / 16, cells = [];
  for (let cy = 0; cy < 16; cy++) for (let cx = 0; cx < 16; cx++) {
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = 0; y < C; y++) for (let x = 0; x < C; x++) {
      const i = ((cy * C + y) * src.w + cx * C + x) * 4;
      if (src.d[i + 3] < 128) continue;
      r += src.d[i]; g += src.d[i + 1]; b += src.d[i + 2]; n++;
    }
    cells.push(n / (C * C) >= (block ? 0 : COVER[id] || 0.45) && n ? [r / n, g / n, b / n] : null);
  }
  const out = { w: 16, h: 16, d: new Uint8Array(1024) };
  const idFile = path.join(HI, name + '_id.png');
  if (fs.existsSync(idFile)) {
    // region layer: each cell takes the region (part / face / band) covering most of it, its colour is the average of
    // the art inside that region only, and a back region gets a dark 1 px edge where it meets a front region
    const ids = readPng(idFile), known = [];
    const count = new Map();
    for (let i = 0; i < ids.d.length; i += 4) { const k = ids.d[i] << 16 | ids.d[i + 1] << 8 | ids.d[i + 2]; count.set(k, (count.get(k) || 0) + 1); }
    for (let id2 = 0; id2 < 256; id2++) { const c = idRGB(id2), k = c[0] << 16 | c[1] << 8 | c[2]; if ((count.get(k) || 0) >= 40) known.push({ id: id2, c }); }
    const regionAt = j => { const p = [ids.d[j], ids.d[j + 1], ids.d[j + 2]]; let b = known[0]; for (const k of known) if (d2(p, k.c) < d2(p, b.c)) b = k; return b.id; };
    const region = new Int16Array(256).fill(-1), colors = [];
    cells.forEach((c, i) => {
      if (!c) return;
      const cx = i % 16, cy = i / 16 | 0, votes = new Map(), sums = new Map();
      for (let y = 0; y < C; y++) for (let x = 0; x < C; x++) {
        const j = ((cy * C + y) * src.w + cx * C + x) * 4;
        if (src.d[j + 3] < 128) continue;
        const rid = regionAt(j), wgt = 1.5 - Math.hypot(x - C / 2, y - C / 2) / C;
        votes.set(rid, (votes.get(rid) || 0) + wgt);
        const s = sums.get(rid) || [0, 0, 0, 0]; s[0] += src.d[j]; s[1] += src.d[j + 1]; s[2] += src.d[j + 2]; s[3]++; sums.set(rid, s);
      }
      let best = -1, bv = -1; for (const [k, v] of votes) if (v > bv) { bv = v; best = k; }
      region[i] = best; const s = sums.get(best); colors[i] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]];
    });
    const pal = kmeans(colors.filter(Boolean), block ? 9 : 10);
    colors.forEach((c, i) => { if (c) out.d.set([...nearest(c, pal), 255], i * 4); });
    const group = i => region[i] < 0 ? -1 : region[i] >> 3;
    const at = (x, y) => block ? ((y + 16) % 16) * 16 + (x + 16) % 16 : (x < 0 || y < 0 || x > 15 || y > 15 ? -1 : y * 16 + x);
    const dark = [];
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const i = y * 16 + x; if (region[i] < 0) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const j = at(x + a, y + b); return j >= 0 && region[j] >= 0 && group(j) > group(i); })) dark.push(i);
    }
    for (const i of dark) for (let k = 0; k < 3; k++) out.d[i * 4 + k] = Math.round(out.d[i * 4 + k] * 0.5);
  } else if (AVG.includes(id)) {
    // smooth gradients (the crystal gems): average each cell, then snap to a palette of the cell colours
    const pal = kmeans(cells.filter(Boolean), block ? 8 : 9);
    cells.forEach((c, i) => { if (!c) return; out.d.set([...nearest(c, pal), 255], i * 4); });
  } else {
    // detail (grain lines, small parts): a palette of the drawing's own pixels, then each cell takes the colour that
    // covers most of it - edges stay crisp instead of averaging into mud
    const sample = [];
    for (let i = 0; i < src.d.length; i += 4 * 7) if (src.d[i + 3] >= 128) sample.push([src.d[i], src.d[i + 1], src.d[i + 2]]);
    const pal = kmeans(sample, block ? 9 : 10);
    cells.forEach((c, i) => {
      if (!c) return;
      const cx = i % 16, cy = i / 16 | 0, votes = new Array(pal.length).fill(0);
      for (let y = 0; y < C; y++) for (let x = 0; x < C; x++) {
        const j = ((cy * C + y) * src.w + cx * C + x) * 4;
        if (src.d[j + 3] < 128) continue;
        const p = [src.d[j], src.d[j + 1], src.d[j + 2]];
        // pixels near the cell centre count more, so a cell shows what sits in its middle
        const wgt = 1.5 - Math.hypot(x - C / 2, y - C / 2) / C;
        let bi = 0; pal.forEach((m, k) => { if (d2(p, m) < d2(p, pal[bi])) bi = k; });
        votes[bi] += wgt;
      }
      out.d.set([...pal[votes.indexOf(Math.max(...votes))], 255], i * 4);
    });
  }
  if (!block) {
    const op = (x, y) => x >= 0 && y >= 0 && x < 16 && y < 16 && cells[y * 16 + x];
    const edge = [];
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (op(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !op(x + a, y + b))) edge.push(y * 16 + x);
    for (const i of edge) for (let k = 0; k < 3; k++) out.d[i * 4 + k] = Math.round(out.d[i * 4 + k] * 0.45);
  }
  writePng(path.join(OUT, kind, id + '.png'), out);
  return { name, out };
}

const done = fs.readdirSync(HI).filter(f => f.endsWith('.png') && !f.endsWith('_id.png') && (!filter || f.includes(filter))).map(pixelize);
console.log('pixelized', done.map(d => d.name).join(', '));
if (preview) {   // hi-res art scaled to 128 next to the 16x16 result at 8x, on slot grey
  const T = 128, pad = 8, w = done.length * (T + pad) + pad, h = 2 * T + 3 * pad, pv = { w, h, d: new Uint8Array(w * h * 4) };
  for (let i = 0; i < pv.d.length; i += 4) { pv.d[i] = pv.d[i + 1] = pv.d[i + 2] = 139; pv.d[i + 3] = 255; }
  done.forEach(({ name, out }, k) => {
    const src = readPng(path.join(HI, name + '.png')), f = src.w / T;
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
      const si = (Math.floor(y * f) * src.w + Math.floor(x * f)) * 4, oi = ((y / 8 | 0) * 16 + (x / 8 | 0)) * 4;
      const X = pad + k * (T + pad) + x;
      if (src.d[si + 3] > 128) pv.d.set([src.d[si], src.d[si + 1], src.d[si + 2]], ((pad + y) * w + X) * 4);
      if (out.d[oi + 3]) pv.d.set([out.d[oi], out.d[oi + 1], out.d[oi + 2]], ((2 * pad + T + y) * w + X) * 4);
    }
  });
  writePng(preview, pv);
}
