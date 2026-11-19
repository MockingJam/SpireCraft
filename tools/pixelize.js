// Turns the user's painted weapon references into vanilla-style item sprites, keeping their colours and outlines:
//  1. crop the weapon (tools/weapon_refs.js), erase label fragments, flood-fill the light background away;
//  2. reduce the colours with k-means (8 colours at 16 px, 12 at 32 px), so the palette comes from the painting itself;
//  3. downscale by majority vote per output cell (no blending, so no muddy in-between colours);
//  4. drop specks, then add a 1-px outline in a darkened tone of the neighbouring colour (vanilla item style).
// Usage: node tools/pixelize.js <ref png dir> <outDir> [preview.png] [name filter]
const { readPng, writePng } = require('./png');
const refs = require('./weapon_refs');

const [refDir, outDir, preview, filter] = process.argv.slice(2);
const sheets = {};
const sheet = n => sheets[n] || (sheets[n] = readPng(refDir + '/' + n + '.png'));
const lum = c => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

function cutout(ref) {
  const src = sheet(ref.sheet), [x0, y0, x1, y1] = ref.box, w = x1 - x0, h = y1 - y0;
  const px = new Array(w * h), fg = new Uint8Array(w * h).fill(1);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = ((y + y0) * src.w + x + x0) * 4;
    px[y * w + x] = [src.d[p], src.d[p + 1], src.d[p + 2]];
  }
  for (const [ex0, ey0, ex1, ey1] of ref.erase || []) for (let y = Math.max(0, ey0 - y0); y < Math.min(h, ey1 - y0); y++) for (let x = Math.max(0, ex0 - x0); x < Math.min(w, ex1 - x0); x++) px[y * w + x] = ref.bg === 'dark' ? [0, 0, 0] : [250, 250, 248];
  // flood the light paper background (and beige label panels) from the border
  const bgLike = ref.bg === 'dark' ? c => Math.max(...c) < 30
    : ref.bg === 'glow' ? c => Math.min(...c) > 240 && Math.max(...c) - Math.min(...c) < 10   // pure paper only; the glow is peeled below
    : c => { const mx = Math.max(...c), mn = Math.min(...c); return mn > 205 && mx - mn < 45; };
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const i = stack.pop();
    if (!fg[i] || !bgLike(px[i])) continue;
    fg[i] = 0;
    const x = i % w, y = (i / w) | 0;
    if (x > 0) stack.push(i - 1); if (x < w - 1) stack.push(i + 1); if (y > 0) stack.push(i - w); if (y < h - 1) stack.push(i + w);
  }
  // a pale blue glow around the weapon: peel it from the outside in, a pixel layer at a time
  if (ref.bg === 'glow') for (let pass = 0; pass < (ref.peel || 14); pass++) {
    const drop = [];
    for (let i = 0; i < w * h; i++) {
      if (!fg[i]) continue;
      const c = px[i], L = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
      if (!(c[2] - c[0] > 6 && L > 165)) continue;
      const x = i % w, y = (i / w) | 0;
      if ((x > 0 && !fg[i - 1]) || (x < w - 1 && !fg[i + 1]) || (y > 0 && !fg[i - w]) || (y < h - 1 && !fg[i + w])) drop.push(i);
    }
    if (!drop.length) break;
    for (const i of drop) fg[i] = 0;
  }
  // light regions enclosed by the weapon (holes, loops) are background too when they are big
  { const seen = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      if (!fg[i] || seen[i] || !bgLike(px[i])) continue;
      const reg = [i]; seen[i] = 1;
      for (let q = 0; q < reg.length; q++) { const j = reg[q], x = j % w, y = (j / w) | 0;
        for (const k of [x > 0 ? j - 1 : -1, x < w - 1 ? j + 1 : -1, y > 0 ? j - w : -1, y < h - 1 ? j + w : -1]) if (k >= 0 && fg[k] && !seen[k] && bgLike(px[k])) { seen[k] = 1; reg.push(k); } }
      if (reg.length > (w * h) * 0.004) for (const j of reg) fg[j] = 0;
    } }
  // keep the big connected parts only (drops label text and stray marks)
  const comp = new Int32Array(w * h).fill(-1), sizes = [];
  for (let i = 0; i < w * h; i++) {
    if (!fg[i] || comp[i] >= 0) continue;
    const id = sizes.length; let n = 0; const st = [i]; comp[i] = id;
    while (st.length) {
      const j = st.pop(); n++;
      const x = j % w, y = (j / w) | 0;
      for (const k of [x > 0 ? j - 1 : -1, x < w - 1 ? j + 1 : -1, y > 0 ? j - w : -1, y < h - 1 ? j + w : -1]) if (k >= 0 && fg[k] && comp[k] < 0) { comp[k] = id; st.push(k); }
    }
    sizes.push(n);
  }
  const biggest = Math.max(...sizes);
  for (let i = 0; i < w * h; i++) if (fg[i] && sizes[comp[i]] < biggest * (ref.minPart || 0.004)) fg[i] = 0;
  const cut = { w, h, px, fg };
  return ref.axis ? rotateTo45(cut, ref.axis.map(([x, y]) => [x - x0, y - y0]), ref.narrow || 1) : cut;
}

/** Rotate a cut-out so its pommel→tip axis runs at 45° (tip up-right, like vanilla swords); trims to the new bounds. */
function rotateTo45(cut, axis, narrow = 1) {
  let n = 0, mx = 0, my = 0;
  for (let i = 0; i < cut.fg.length; i++) if (cut.fg[i]) { n++; mx += i % cut.w; my += (i / cut.w) | 0; }
  mx /= n; my /= n;
  let sxx = 0, syy = 0, sxy = 0;
  for (let i = 0; i < cut.fg.length; i++) if (cut.fg[i]) { const dx = i % cut.w - mx, dy = ((i / cut.w) | 0) - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
  const theta = Math.atan2(axis[1][1] - axis[0][1], axis[1][0] - axis[0][0]);   // pommel → tip (screen coords)
  const phi = -Math.PI / 4 - theta;                                               // turn it onto the up-right diagonal
  const c = Math.cos(phi), s = Math.sin(phi), R = Math.ceil(Math.hypot(cut.w, cut.h));
  const W2 = R, H2 = R, px = new Array(W2 * H2), fg = new Uint8Array(W2 * H2);
  let x0 = W2, y0 = H2, x1 = 0, y1 = 0;
  for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
    let dx = x - W2 / 2, dy = y - H2 / 2;
    if (narrow !== 1) {   // squeeze across the (now 45°) axis: sample a wider band of the painting into the same pixels
      const a = (dx - dy) / Math.SQRT2, q = (dx + dy) / Math.SQRT2 / narrow;
      dx = (a + q) / Math.SQRT2; dy = (q - a) / Math.SQRT2;
    }
    const sx = Math.round(mx + c * dx + s * dy), sy = Math.round(my - s * dx + c * dy);
    if (sx < 0 || sy < 0 || sx >= cut.w || sy >= cut.h) continue;
    const j = sy * cut.w + sx; if (!cut.fg[j]) continue;
    px[y * W2 + x] = cut.px[j]; fg[y * W2 + x] = 1;
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  const w = x1 - x0 + 1, h = y1 - y0 + 1, opx = new Array(w * h), ofg = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const j = (y + y0) * W2 + x + x0; opx[y * w + x] = px[j] || [0, 0, 0]; ofg[y * w + x] = fg[j]; }
  return { w, h, px: opx, fg: ofg };
}

function kmeans(colors, k) {
  // deterministic seeding: spread over luminance
  const sorted = colors.slice().sort((a, b) => lum(a) - lum(b));
  let cent = Array.from({ length: k }, (_, i) => sorted[Math.floor((i + 0.5) * sorted.length / k)].slice());
  for (let it = 0; it < 12; it++) {
    const sum = cent.map(() => [0, 0, 0, 0]);
    for (const c of colors) {
      let best = 0, bd = Infinity;
      cent.forEach((m, j) => { const d = dist2(c, m); if (d < bd) { bd = d; best = j; } });
      sum[best][0] += c[0]; sum[best][1] += c[1]; sum[best][2] += c[2]; sum[best][3]++;
    }
    cent = cent.map((m, j) => sum[j][3] ? [sum[j][0] / sum[j][3], sum[j][1] / sum[j][3], sum[j][2] / sum[j][3]] : m);
  }
  return cent.map(m => m.map(Math.round));
}

function pixelize(name) {
  const ref = refs[name], N = ref.size, cut = cutout(ref);
  const sample = [];
  for (let i = 0; i < cut.px.length; i += 3) if (cut.fg[i]) sample.push(cut.px[i]);
  let pal = kmeans(sample, ref.colors || (N === 32 ? 14 : 9));
  if (ref.highlight) {   // stretch only the colours above the mean: brighter highlights, darks untouched
    const m = pal.reduce((s, c) => s + lum(c), 0) / pal.length;
    pal = pal.map(c => { const L = lum(c); if (L <= m) return c; const L2 = Math.min(255, m + (L - m) * ref.highlight); return c.map(v => Math.max(0, Math.min(255, Math.round(v * L2 / L)))); });   // multiplicative: keeps the hue saturated
  }
  if (ref.contrast) {   // stretch value and saturation around the palette mean (user asked for more contrast)
    const m = pal.reduce((s, c) => s + lum(c), 0) / pal.length;
    pal = pal.map(c => { const L = lum(c), L2 = m + (L - m) * ref.contrast; return c.map(v => Math.max(0, Math.min(255, Math.round(L2 + (v - L) * ref.contrast)))); });
  }
  const nearest = c => { let best = 0, bd = Infinity; pal.forEach((m, j) => { const d = dist2(c, m); if (d < bd) { bd = d; best = j; } }); return best; };
  // fit inside N-2 (room for the outline), keep aspect, centre
  const inner = N - 2, sc = Math.max(cut.w, cut.h) / inner;
  const ox = (N - cut.w / sc) / 2, oy = (N - cut.h / sc) / 2;
  const grid = Array.from({ length: N }, () => Array(N).fill(-1));
  for (let gy = 0; gy < N; gy++) for (let gx = 0; gx < N; gx++) {
    const sx0 = (gx - ox) * sc, sy0 = (gy - oy) * sc;
    const votes = new Map(); let fgN = 0, all = 0;
    for (let sy = Math.floor(sy0); sy < Math.floor(sy0 + sc); sy++) for (let sx = Math.floor(sx0); sx < Math.floor(sx0 + sc); sx++) {
      if (sx < 0 || sy < 0 || sx >= cut.w || sy >= cut.h) { all++; continue; }
      all++;
      const i = sy * cut.w + sx;
      if (!cut.fg[i]) continue;
      fgN++;
      const k = nearest(cut.px[i]);
      // dark ink lines in the painting are thin: give them less weight so fills win at small sizes
      const wgt = lum(pal[k]) < 45 ? (N === 32 ? 0.8 : 0.5) : 1;
      votes.set(k, (votes.get(k) || 0) + wgt);
    }
    if (all && fgN / all >= (ref.coverage || 0.42)) grid[gy][gx] = [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }
  // remove specks: a filled pixel with no filled 4-neighbour
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (grid[y][x] < 0) continue;
    const n = [[0, -1], [1, 0], [0, 1], [-1, 0]].filter(([dx, dy]) => grid[y + dy]?.[x + dx] >= 0).length;
    if (n === 0) grid[y][x] = -1;
  }
  // optional: fill one-pixel notches in a ragged edge (an empty pixel with 3+ filled 4-neighbours)
  for (let pass = 0; pass < (ref.fillNotches || 0); pass++) {
    const add = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (grid[y][x] >= 0) continue;
      const nb = [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy]) => grid[y + dy]?.[x + dx]).filter(k => k >= 0);
      if (nb.length >= 3) add.push([x, y, nb.sort((a, b) => lum(pal[b]) - lum(pal[a]))[0]]);
    }
    for (const [x, y, k] of add) grid[y][x] = k;
  }
  // optional: grey specks inside a coloured object (paper showing through highlights) take a neighbouring colour
  if (ref.noGrey) {
    const grey = k => { const c = pal[k], mx = Math.max(...c), mn = Math.min(...c); return mx - mn < 28 && lum(c) > 60 && lum(c) < 215; };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const k = grid[y][x]; if (k < 0 || !grey(k)) continue;
      const nb = new Map();
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const j = grid[y + dy]?.[x + dx]; if (j >= 0 && !grey(j) && lum(pal[j]) > 45) nb.set(j, (nb.get(j) || 0) + 1); }
      if (nb.size) grid[y][x] = [...nb.entries()].sort((a, b) => b[1] - a[1])[0][0];
    }
  }
  // outline: darkened neighbour colour (or the painting's own dark ink colour when the neighbour is already dark)
  const out = Array.from({ length: N }, (_, y) => grid[y].map(k => (k >= 0 ? pal[k] : null)));
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (grid[y][x] >= 0) continue;
    let nb = null;
    for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) { const k = grid[y + dy]?.[x + dx]; if (k >= 0) { nb = pal[k]; break; } }
    if (nb) out[y][x] = lum(nb) < 50 ? nb.map(v => Math.round(v * 0.7)) : nb.map(v => Math.round(v * 0.32));
  }
  // optional volume: light from the top-left, shade toward the bottom-right (for flat discs that need depth)
  if (ref.shade) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (!out[y][x] || grid[y][x] < 0) continue;
    const f = 1 + ref.shade * Math.max(0, 1 - (x + y) / (N - 1));   // brighten toward the top-left only (no extra shadow)
    out[y][x] = out[y][x].map(v => Math.max(0, Math.min(255, Math.round(v * f))));
  }
  // optional: where the outline is doubled (two dark pixels deep), keep only the outer one
  if (ref.thinOutline) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const c = out[y][x]; if (!c || lum(c) > 25) continue;
    const n4 = [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy]) => out[y + dy]?.[x + dx] ?? null);
    if (n4.some(n => !n)) continue;                                  // the outer outline itself
    const darkN = n4.filter(n => lum(n) <= 25).length, light = n4.filter(n => lum(n) > 120);
    if (darkN >= 1 && light.length >= 2 && n4.some((n, i) => lum(n) <= 25 && [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy]) => [x + dx, y + dy]).filter(([xx, yy], j) => j === i).some(([xx, yy]) => [[0, -1], [1, 0], [0, 1], [-1, 0]].some(([ex, ey]) => !out[yy + ey]?.[xx + ex]))))
      out[y][x] = light.sort((a, b) => lum(b) - lum(a))[0];
  }
  // hand fixes after review: [x, y, '#rrggbb' | null | [sx, sy] (copy another pixel)]
  for (const [x, y, v] of ref.patch || []) out[y][x] = v === null ? null : Array.isArray(v) ? out[v[1]][v[0]] : [1, 3, 5].map(i => parseInt(v.slice(i, i + 2), 16));
  // optional: mirror across the 45° weapon axis (bottom-left to top-right): the head bulges to the other side
  if (ref.mirrorAxis) { const m = out.map(r => r.slice()); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) out[y][x] = m[N - 1 - x][N - 1 - y]; }
  const d = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (out[y][x]) d.set([...out[y][x], 255], (y * N + x) * 4);
  return { w: N, h: N, d };
}

const names = Object.keys(refs).filter(n => !filter || n.includes(filter));
const imgs = names.map(pixelize);
if (outDir && outDir !== '-') names.forEach((n, i) => writePng(outDir + '/' + n + '.png', imgs[i]));
if (preview) {
  const CELL = 32 * 5 + 8, cols = 7;
  const sh = { w: cols * CELL, h: Math.ceil(names.length / cols) * CELL };
  sh.d = new Uint8Array(sh.w * sh.h * 4);
  for (let i = 0; i < sh.w * sh.h; i++) sh.d.set([139, 139, 139, 255], i * 4);
  imgs.forEach((img, i) => {
    const S = 160 / img.w, ox = (i % cols) * CELL + 4, oy = Math.floor(i / cols) * CELL + 4;
    for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) {
      const p = (Math.floor(y / S) * img.w + Math.floor(x / S)) * 4;
      if (img.d[p + 3]) sh.d.set(img.d.subarray(p, p + 4), ((oy + y) * sh.w + ox + x) * 4);
    }
  });
  writePng(preview, sh);
}
console.log(names.map((n, i) => i + ':' + n).join(' '));
