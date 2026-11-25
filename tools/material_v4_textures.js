// Material textures v4.1 (user 2026-11-25, two rounds of reference paintings): redrawn at 16x16 in vanilla style.
// Round 2 feedback: dough grain and the scrap heap read badly, the crystal lacks gloss and sits flat, the three blocks
// lack appeal (scrap block: big rectangles look unnatural), the shell and the pebbles are not round enough.
//   block/orange_dough            - a contour map: ring knots (one a spiral) and flowing bands, thin dark lines,
//                                   each band lit on one side (reference 3, middle)
//   item/orange_dough_lump        - a full lumpy ball with the same grain and a spiral knot
//   block/core_crystal_block      - raised glossy gems (rounded cells) in dark seams, each domed with a top-left
//                                   specular glint (reference 3, left)
//   block/cracked_core_crystal_block - the same, split by extra cracks, duller
//   item/core_crystal             - a tall glossy crystal leaning right, smaller ones gathered at one pointed base
//   item/flak_shell               - a round steel ball (pixel-circle rows), smooth banded shading
//   item/pebble                   - three round, softly faceted stones in a heap
//   block/junk_block              - machine scrap: diagonal riveted straps over a dark tangle, a bearing, a gear
//   item/scrap                    - a compact heap: a bearing, a riveted strap, a bolt, a red wire
// Usage: node tools/material_v4_textures.js [preview.png] [before dir]
const path = require('path');
const { readPng, writePng } = require('./png');
const OUT = path.resolve(__dirname, '../src/main/resources/assets/spirecraft/textures/');
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const clamp = v => Math.max(0, Math.min(1, v));
const blank = () => ({ w: 16, h: 16, d: new Uint8Array(1024) });
const wrap = v => ((v % 16) + 16) % 16;
const set = (img, x, y, c, tile) => {
  if (tile) { x = wrap(x); y = wrap(y); } else if (x < 0 || y < 0 || x > 15 || y > 15) return;
  const i = (y * 16 + x) * 4; img.d[i] = c[0]; img.d[i + 1] = c[1]; img.d[i + 2] = c[2]; img.d[i + 3] = 255;
};
const opaque = (img, x, y) => x >= 0 && y >= 0 && x < 16 && y < 16 && img.d[(y * 16 + x) * 4 + 3] > 0;
const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const pick = (ramp, t) => hex(ramp[Math.round(clamp(t) * (ramp.length - 1))]);
/** wrapped offset on the 16x16 tile */
const wo = (a, b) => { let d = a - b; d -= 16 * Math.round(d / 16); return d; };
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** Outline: opaque pixels touching transparency get the colour (or colour(x, y)). */
function outline(img, col) {
  const edge = [];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (opaque(img, x, y) && N4.some(([a, b]) => !opaque(img, x + a, y + b))) edge.push([x, y]);
  for (const [x, y] of edge) set(img, x, y, typeof col === 'function' ? col(x, y) : col);
}
/** Draw pieces back to front ({inside(px,py), color(x,y,own)} on pixel centres); returns the owner map. */
function layers(img, pieces) {
  const own = new Int16Array(256).fill(-1);
  pieces.forEach((p, k) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (p.inside(x + 0.5, y + 0.5)) own[y * 16 + x] = k; });
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const k = own[y * 16 + x]; if (k >= 0) set(img, x, y, pieces[k].color(x, y, own)); }
  return own;
}
/** A dark line on a back piece where a front piece covers it (keeps overlapping parts apart). */
function seams(img, own, col) {
  const m = [];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const k = own[y * 16 + x];
    if (k >= 0 && N4.some(([a, b]) => { const X = x + a, Y = y + b; return X >= 0 && Y >= 0 && X < 16 && Y < 16 && own[Y * 16 + X] > k; })) m.push([x, y]);
  }
  for (const [x, y] of m) set(img, x, y, typeof col === 'function' ? col(x, y) : col);
}
/** Classic pixel circle: per-row half widths for a diameter (keeps round silhouettes free of flats and spikes). */
const CIRCLE = { 13: [1.5, 3.5, 4.5, 5.5, 5.5, 6.5, 6.5, 6.5, 5.5, 5.5, 4.5, 3.5, 1.5], 12: [2, 4, 5, 5, 6, 6, 6, 6, 5, 5, 4, 2], 7: [1.5, 2.5, 3.5, 3.5, 3.5, 2.5, 1.5], 6: [1, 2, 3, 3, 2, 1], 8: [2, 3, 4, 4, 4, 4, 3, 2], 9: [2.5, 3.5, 4.5, 4.5, 4.5, 4.5, 4.5, 3.5, 2.5] };
/** inside test for a pixel circle of diameter D whose top-left corner is (x0, y0) */
const pixCircle = (x0, y0, D) => (px, py) => { const r = Math.floor(py - y0); if (r < 0 || r >= D) return false; const hw = CIRCLE[D][r]; return Math.abs(px - (x0 + D / 2)) <= hw; };

const jobs = {};

// ======================= orange dough: a contour map =======================
const DOUGH = ['#6e260a', '#8e340d', '#ac4511', '#c75915', '#dc6e1c', '#ec8629', '#f6a03e', '#fbbb5c'];
const LINE = hex('#86320d');
{
  // v4.1c: the grain is drawn line by line (a contour field always came out busy at 16 px): a ring knot top left,
  // a spiral knot bottom left, a small knot bottom right, three wavy lines flowing down the middle; the bands between
  // are shaded by distance from the nearest line (dark next to it, lighter in the middle), in flat steps
  const T = 2 * Math.PI / 16, lines = new Set();
  const plot = (x, y) => lines.add(wrap(Math.floor(x)) + ',' + wrap(Math.floor(y)));
  for (const [cx, cy, rs] of [[3.5, 3.5, [0.4, 2.8]], [13, 13.5, [2.2]]]) for (const R of rs) for (let a = 0; a < 2 * Math.PI; a += 0.03) plot(cx + R * Math.cos(a), cy + R * Math.sin(a) * 0.9);
  for (let a = 1.2; a < 2.6 * Math.PI; a += 0.03) { const R = 0.78 * a; plot(4.5 + R * Math.cos(a), 11.8 + R * Math.sin(a) * 0.9); }
  for (const [x0, amp, ph] of [[8.6, 1.5, 0], [12.2, 1.2, 0.9]]) for (let y = 0; y < 16; y += 0.1) plot(x0 + amp * Math.sin(T * y + ph), y);
  // distance from the nearest line on the wrapped tile (BFS)
  const dist = new Int8Array(256).fill(99), q = [];
  for (const k of lines) { const [x, y] = k.split(',').map(Number); dist[y * 16 + x] = 0; q.push([x, y]); }
  while (q.length) { const [x, y] = q.shift(); for (const [a, b] of N4) { const X = wrap(x + a), Y = wrap(y + b); if (dist[Y * 16 + X] > dist[y * 16 + x] + 1) { dist[Y * 16 + X] = dist[y * 16 + x] + 1; q.push([X, Y]); } } }
  const img = blank();
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const d = dist[y * 16 + x];
    set(img, x, y, d === 0 ? LINE : pick(DOUGH, [0, 0.5, 0.64, 0.74, 0.8][Math.min(4, d)]), true);
  }
  jobs['block/orange_dough'] = img;
}
{
  // the lump: a full rounded blob, grain with a spiral knot top-left, lit from the top left
  const img = blank(), cx = 8, cy = 8.5;
  const rows = [3, 4.5, 5.5, 6, 6.5, 6.5, 6.5, 6.5, 6.5, 6.5, 6, 5.5, 4.5, 3];     // 14 rows, y 1.5..15.5
  const off = [0.5, 0, 0.5, 0, 0, -0.5, 0, 0, 0, 0.5, 0, 0, -0.5, 0];             // a slightly lumpy outline
  layers(img, [{ inside: (px, py) => { const r = Math.floor(py - 1.5); return r >= 0 && r < 14 && Math.abs(px - cx - off[r]) <= rows[r]; }, color: () => [0, 0, 0] }]);
  // smooth ball shading in a few flat steps, then a few clean grain lines: one spiral knot and two arcs
  const light = (x, y) => { const dx = (x + 0.5 - cx) / 6.8, dy = (y + 0.5 - cy) / 6.8; return clamp(0.66 - 0.34 * dx - 0.38 * dy - 0.28 * (dx * dx + dy * dy)); };
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (opaque(img, x, y)) set(img, x, y, pick(DOUGH, Math.round(light(x, y) * 5) / 5));
  const lines = new Set();
  for (let a = 0.6; a < 3.4 * Math.PI; a += 0.05) { const r = 0.62 * a; lines.add(Math.floor(6.2 + r * Math.cos(a)) + ',' + Math.floor(6.4 + r * Math.sin(a))); }
  for (const [ax, ay, R, a0, a1] of [[6.2, 6.4, 7.6, 0.2, 1.9], [15, 15, 5.2, 3.3, 4.6]]) for (let a = a0; a < a1; a += 0.04) lines.add(Math.floor(ax + R * Math.cos(a)) + ',' + Math.floor(ay + R * Math.sin(a)));
  for (const k of lines) { const [x, y] = k.split(',').map(Number); if (opaque(img, x, y)) set(img, x, y, pick(DOUGH, light(x, y) - 0.3)); }
  outline(img, hex('#5a1f07'));
  jobs['item/orange_dough_lump'] = img;
}

// ======================= core crystal: raised glossy gems =======================
const TEAL = ['#0b3436', '#0f4c4e', '#146a69', '#1b8783', '#25a39b', '#3cbfb3', '#6fd8cb', '#b9f2ea'];
function crystalBlock(cracked) {
  // cell seeds with weights (bigger weight = bigger gem); a big gem in the middle like the reference
  const pts = [[3.5, 3.5, 1.0], [11, 3, 1.1], [7.5, 10, 1.35], [0.5, 11.5, 0.9], [14, 12.5, 0.95]];
  const own = new Int16Array(256);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    let best = 1e9, bk = 0;
    pts.forEach(([sx, sy, w], k) => { const d = Math.hypot(wo(x + 0.5, sx), wo(y + 0.5, sy)) / w; if (d < best) { best = d; bk = k; } });
    own[y * 16 + x] = bk;
  }
  // extra cracks for the cracked block: two short wandering lines that cut gems
  const crackPx = new Set();
  if (cracked) for (const [sx, sy, dx, len] of [[6, 7, 1, 5], [11, 11, -1, 4], [2, 2, 1, 3]]) { let x = sx, y = sy; for (let i = 0; i < len; i++) { crackPx.add(wrap(x) + ',' + wrap(y)); x += dx; if (hash(i, sx, 5) < 0.5) y += 1; } }
  // distance from the seam inside each gem (BFS on the wrapped grid), the dome height
  const seam = (x, y) => [[1, 0], [0, 1], [1, 1]].some(([a, b]) => own[wrap(y + b) * 16 + wrap(x + a)] !== own[y * 16 + x]) || crackPx.has(x + ',' + y);
  const dist = new Float32Array(256).fill(99), q = [];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (seam(x, y)) { dist[y * 16 + x] = 0; q.push([x, y]); }
  while (q.length) { const [x, y] = q.shift(); for (const [a, b] of N4) { const X = wrap(x + a), Y = wrap(y + b), i = Y * 16 + X; if (own[i] === own[y * 16 + x] && dist[i] > dist[y * 16 + x] + 1) { dist[i] = dist[y * 16 + x] + 1; q.push([X, Y]); } } }
  const H = i => Math.min(3, dist[i]) / 3;
  const img = blank();
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const i = y * 16 + x;
    if (dist[i] === 0) { set(img, x, y, hex(cracked ? TEAL[0] : TEAL[1]), true); continue; }
    // slope of the dome toward the light (top left): compare with the neighbours inside the same gem
    const at = (a, b) => { const j = wrap(y + b) * 16 + wrap(x + a); return own[j] === own[i] ? H(j) : 0; };
    const gx = at(1, 0) - at(-1, 0), gy = at(0, 1) - at(0, -1);
    // a slope rising to the right / down faces the top-left light
    let t = 0.52 + 0.24 * H(i) + 0.4 * (gx * 0.6 + gy * 0.8);
    if (dist[i] === 1 && (at(-1, 0) === 0 || at(0, -1) === 0)) t += 0.18;   // lit rim just inside the top-left seam
    if (dist[i] === 1 && (at(1, 0) === 0 || at(0, 1) === 0)) t -= 0.1;     // shaded rim bottom-right
    if (cracked) t -= 0.12;
    set(img, x, y, pick(TEAL, t), true);
  }
  // a specular glint on each gem: the pixel(s) up-left of its crown
  pts.forEach(([sx, sy, w], k) => {
    let bx = -1, by = -1, bd = -1;
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (own[y * 16 + x] === k && dist[y * 16 + x] > bd) { bd = dist[y * 16 + x]; bx = x; by = y; }
    if (bd < 2) return;
    const gx = wrap(bx - 1), gy = wrap(by - 1);
    if (own[gy * 16 + gx] !== k) return;
    set(img, gx, gy, hex(cracked ? TEAL[6] : TEAL[7]), true);
    if (w >= 1.1 && own[gy * 16 + wrap(gx + 1)] === k) set(img, gx + 1, gy, hex(TEAL[6]), true);
  });
  return img;
}
jobs['block/core_crystal_block'] = crystalBlock(false);
jobs['block/cracked_core_crystal_block'] = crystalBlock(true);
{
  // the cluster: tapered prisms from one base point (bottom centre), lit left face, dark right face, a bright edge
  // between them and white glints; the bases gather into a point so the bottom is not flat
  // v4.1b (user: "not crystalline, no edges - looks like a broken lump"): built row by row so every side is a straight
  // staircase; three faces per prism (lit left, a bright ridge, dark right) and a faceted point (left half lit, right dark)
  const img = blank();
  const prism = (x0, yBase, yTip, hw, lean, tipLen) => {
    const span = y => { if (y < yTip || y > yBase) return null;
      const c = x0 + lean * (yBase - y), k = y - yTip;
      const w = k < tipLen ? hw * (k + 0.6) / (tipLen + 0.6) : y === yBase ? hw * 0.75 : hw;
      return [Math.round(c - w), Math.round(c + w) - 1, c]; };
    return {
      inside: (px, py) => { const s = span(Math.floor(py)); return !!s && Math.floor(px) >= s[0] && Math.floor(px) <= s[1]; },
      color: (x, y) => {
        const [l, r, c] = span(y), k = y - yTip, w = r - l + 1;
        if (k < tipLen) return pick(TEAL, x + 0.5 < c ? 0.86 : 0.36);              // the point: two facets
        const u = (x - l + 0.5) / w;                                               // 0 = left edge, 1 = right edge
        if (u < 0.42) return pick(TEAL, u < 0.22 ? 0.62 : 0.74);                  // lit face
        if (u < 0.62) return pick(TEAL, 0.95);                                     // the ridge
        return pick(TEAL, u < 0.82 ? 0.38 : 0.26);                                // shaded face
      },
    };
  };
  const own = layers(img, [
    prism(8.8, 15, 0, 2.9, 0.2, 3),        // main crystal, leaning right, behind
    prism(5.8, 15, 7, 1.7, -0.42, 2),      // side crystals leaning outwards, from the same base
    prism(11.0, 15, 9, 1.6, 0.42, 2),
  ]);
  seams(img, own, hex('#0e4547'));
  outline(img, hex('#0e4547'));
  // white glints on the lit faces just under the points
  for (const [x, y] of [[9, 4], [9, 5], [3, 10]]) if (opaque(img, x, y)) set(img, x, y, hex('#e4fbf7'));
  jobs['item/core_crystal'] = img;
}

// ======================= flak shell: a round steel ball =======================
{
  const STEEL = ['#1d2326', '#283035', '#353f45', '#455158', '#57646c', '#6d7b83', '#8a979e', '#b9c3c7'];
  const img = blank(), D = 13, x0 = 1.5, y0 = 1.5, cx = 8, cy = 8;
  layers(img, [{
    inside: pixCircle(x0, y0, D),
    color: (x, y) => {
      const dx = (x + 0.5 - cx) / 6.5, dy = (y + 0.5 - cy) / 6.5, nz = Math.sqrt(clamp(1 - dx * dx - dy * dy));
      // Lambert from the top left, plus a soft rim light bottom-right (reflected light)
      let t = clamp(0.12 + 0.75 * clamp(-0.5 * dx - 0.55 * dy + 0.65 * nz));
      if (dx + dy > 0.95) t += 0.1;
      const sd = Math.hypot(dx + 0.4, dy + 0.42);
      if (sd < 0.17) t = 1; else if (sd < 0.3) t = Math.max(t, 0.86);
      return pick(STEEL, t);
    },
  }]);
  outline(img, hex('#171c1f'));
  jobs['item/flak_shell'] = img;
}

// ======================= pebbles: three round stones =======================
{
  const STONE = ['#4a3f39', '#5f534c', '#776a62', '#8f8278', '#a8998e', '#c0b2a6', '#d8cbbf'];
  const stone = (x0, y0, D, seed) => ({
    inside: pixCircle(x0, y0, D),
    color: (x, y) => {
      const c = x0 + D / 2, cyy = y0 + D / 2, dx = (x + 0.5 - c) / (D / 2), dy = (y + 0.5 - cyy) / (D / 2), nz = Math.sqrt(clamp(1 - dx * dx - dy * dy));
      let t = clamp(0.1 + 0.8 * clamp(-0.45 * dx - 0.55 * dy + 0.7 * nz));
      // one soft facet edge across each stone (a chipped plane), barely darker
      if (Math.abs(dx * 0.8 - dy * 0.6 - 0.25) < 0.09) t -= 0.12;
      t += (hash(x, y, seed) - 0.5) * 0.07;
      return pick(STONE, t);
    },
  });
  const img = blank();
  const own = layers(img, [stone(4.5, 1.5, 8, 1), stone(0.5, 7.5, 8, 2), stone(7.5, 7.5, 8, 3)]);
  seams(img, own, hex('#40362f'));
  outline(img, hex('#3a312b'));
  jobs['item/pebble'] = img;
}

// ======================= machine scrap =======================
const IRON = ['#34363a', '#47494d', '#5d6064', '#76797c', '#909295', '#aaacad', '#c6c7c7', '#dededd'];
const BACK = ['#1c1917', '#272220', '#332b27', '#41352d', '#55402f'];
const RED = ['#5a1e17', '#83301f', '#a8462c'];
{
  // the block: a dark tangle of rods and coiled wire behind, two diagonal riveted straps, a bearing (top right),
  // a gear (bottom right), the curve of a pipe (left) - all wrapping so the block tiles
  const img = blank();
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    // diagonal rods (each 2 px, light top edge) and rusty coils between
    const r = wrap(x + y * 2), ring = (r >> 1) % 4;
    set(img, x, y, hex(ring === 0 ? BACK[0] : ring === 3 && hash(x, y, 7) < 0.3 ? BACK[4] : ring === 2 ? BACK[2] : BACK[1]), true);
  }
  // a red wire and a grey cable winding through the tangle (behind the straps)
  for (let x = 0; x < 16; x++) {
    const y1 = Math.round(8.5 + 1.2 * Math.sin(x * 2 * Math.PI / 16 + 1));
    set(img, x, y1, hex(RED[2]), true); set(img, x, y1 + 1, hex(RED[0]), true);
    const y2 = Math.round(14 + 1.0 * Math.sin(x * 2 * Math.PI / 16 + 3));
    set(img, x, y2, pick(IRON, 0.38), true); set(img, x, y2 + 1, pick(IRON, 0.1), true);
  }
  // v4.1b (user: "not cluttered enough, each part too big"): many small hand-drawn parts packed edge to edge, each
  // lit from the top left - nuts, washers, small gears, a bolt, rods, plate shards with rivets, a coiled red wire
  const P = {
    nut: ['.65.', '6kk3', '5kk2', '.32.'],
    washer: ['.5.', '6k2', '.3.'],
    gear: ['.5.4.', '56543', '.6k3.', '54321', '.3.2.'],
    bolt: ['6654', '4K3K', '3232'],
    rodV: ['64', '53', '53', '42', '31'],
    rodH: ['6654', '3221'],
    plate: ['7665', '6753', '4321'],
    coil: ['RrRrR', 'rRrRr'],
    bar: ['6...', '46..', '.46.', '..42'],
  };
  const stamp = (x0, y0, rows) => rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.') return;
    const c = ch === 'K' ? hex(BACK[0]) : ch === 'k' ? hex(BACK[1]) : ch === 'R' ? hex(RED[2]) : ch === 'r' ? hex(RED[0]) : hex(IRON[+ch]);
    set(img, x0 + x, y0 + y, c, true);
  }));
  for (const [name, x, y] of [
    ['gear', 0, 0], ['plate', 5, 0], ['nut', 10, 1], ['rodV', 14, 0],
    ['bolt', 1, 6], ['washer', 6, 4], ['gear', 9, 6], ['bar', 13, 6],
    ['coil', 4, 9], ['nut', 0, 11], ['plate', 10, 12], ['washer', 14, 11],
    ['rodH', 5, 13], ['rodV', 3, 12], ['washer', 7, 10], ['nut', 12, 9],
  ]) stamp(x, y, P[name]);
  jobs['block/junk_block'] = img;
}
{
  // the item: one compact heap - a riveted strap behind, a bolt on the right, a red wire looping through, a big bearing in front
  const img = blank();
  const own = layers(img, [
    { // the heap: small dark parts (nuts, rods, plates) piled into one rounded mass
      inside: (x, y) => { const dx = (x - 8) / 7.2, dy = (y - 9.2) / 6.2; return dx * dx + dy * dy <= 1 && y > 3; },
      color: (x, y) => { const h = hash(x >> 1, y >> 1, 21), lit = (x + y) % 3 === 0; return h < 0.3 ? pick(IRON, lit ? 0.42 : 0.2) : h < 0.55 ? hex(BACK[3]) : h < 0.75 ? pick(IRON, 0.3) : hex(BACK[2]); },
    },
    { // the strap, diagonal behind, from the bottom left up to the top right
      inside: (x, y) => { const u = (x - 8) * 0.8 - (y - 7) * 0.6, v = (x - 8) * 0.6 + (y - 7) * 0.8; return Math.abs(u) <= 6.6 && Math.abs(v) <= 1.6; },
      color: (x, y) => { const u = (x + 0.5 - 8) * 0.8 - (y + 0.5 - 7) * 0.6, v = (x + 0.5 - 8) * 0.6 + (y + 0.5 - 7) * 0.8;
        if (Math.abs(v) < 0.6 && Math.abs(((u + 6.6) % 4) - 2) < 0.6) return hex(IRON[7]);   // rivets
        return pick(IRON, v < -0.6 ? 0.85 : v > 0.6 ? 0.3 : 0.6); },
    },
    { // a broken blade shard on the left, point up-left
      inside: (x, y) => { const u = (x - 4.5) * 0.707 + (y - 9) * 0.707, v = -(x - 4.5) * 0.707 + (y - 9) * 0.707; return u > -4.5 && u < 2 && Math.abs(v) <= 1.6 * (u + 4.5) / 6.5; },
      color: (x, y) => { const v = -(x + 0.5 - 4.5) * 0.707 + (y + 0.5 - 9) * 0.707; return pick(IRON, v < 0 ? 0.9 : 0.5); },
    },
    { // the red wire, running across the heap
      inside: (x, y) => x > 1 && x < 15 && Math.abs(y - (11.5 - 1.6 * Math.sin((x - 1) / 14 * Math.PI))) <= 0.8,
      color: (x, y) => hex((y + 0.5) < 11.5 - 1.6 * Math.sin((x + 0.5 - 1) / 14 * Math.PI) ? RED[2] : RED[1]),
    },
  ]);
  seams(img, own, hex('#26272a'));
  outline(img, (x, y) => hex(own[y * 16 + x] === 3 ? '#47170f' : '#26272a'));
  // in front, bottom right: a small gear (hand-drawn, with its own dark rim) and a hex nut
  const front = (x0, y0, rows) => rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.') return;
    set(img, x0 + x, y0 + y, ch === 'o' ? hex('#26272a') : ch === 'k' ? hex(BACK[1]) : hex(IRON[+ch]));
  }));
  front(9, 9, ['.oooo.', 'o6765o', 'o6kk4o', 'o5kk3o', 'o4332o', '.oooo.']);
  front(3, 12, ['.ooo.', 'o6k3o', '.ooo.']);
  jobs['item/scrap'] = img;
}

for (const [name, img] of Object.entries(jobs)) writePng(path.join(OUT, name + '.png'), img);
console.log('wrote', Object.keys(jobs).join(', '));

// preview on the inventory-slot grey: blocks tiled 2x2 at 8x, items single at 16x; optional "before" row
const pv = process.argv[2];
if (pv) {
  const names = Object.keys(jobs), S = 8, T = 32 * S, pad = 10, before = process.argv[3] ? require('fs').readdirSync(process.argv[3]) : [];
  const rows = before.length ? 2 : 1, out = { w: names.length * (T + pad) + pad, h: rows * (T + pad) + pad };
  out.d = new Uint8Array(out.w * out.h * 4); for (let i = 0; i < out.d.length; i += 4) { out.d[i] = out.d[i + 1] = out.d[i + 2] = 139; out.d[i + 3] = 255; }
  const put = (tex, k, row) => {
    const isBlock = names[k].startsWith('block/'), sc = isBlock ? S : S * 2;
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
      const tx = Math.floor(x / sc), ty = Math.floor(y / sc);
      if (!isBlock && (tx > 15 || ty > 15)) continue;
      const i0 = ((ty % 16) * 16 + (tx % 16)) * 4;
      if (!tex.d[i0 + 3]) continue;
      const i = ((y + pad + row * (T + pad)) * out.w + pad + k * (T + pad) + x) * 4;
      out.d[i] = tex.d[i0]; out.d[i + 1] = tex.d[i0 + 1]; out.d[i + 2] = tex.d[i0 + 2];
    }
  };
  names.forEach((n, k) => { put(jobs[n], k, 0); const f = n.replace('/', '__') + '.png'; if (before.includes(f)) put(readPng(path.join(process.argv[3], f)), k, 1); });
  writePng(pv, out);
}
