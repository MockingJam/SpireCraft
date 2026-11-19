// Ammo and ink item icons (v2.3, user: "too rough - keep them in the middle, stones and scrap should be a heap,
// the scrap needs bars and plates, every piece needs light and shadow"). Drawn procedurally at 16×16 like vanilla:
// every piece is a solid with one light from the top left, a dark silhouette outline, and a contact shadow where it
// sits behind another piece. One hue per material (docs/design/art_style.md).
//   pebble      - a heap of four river stones
//   scrap       - a heap of junk: a rusty iron plate, a copper bar, a bent iron strip and a steel nut
//   flak_shell  - a brass cartridge with a copper-jacketed head on the 45° diagonal
//   ink_bubble  - a near-black glossy bubble with a small one beside it
//   ink_bucket  - the vanilla bucket holding ink (the liquid is the lava bucket's liquid area, repainted flat)
// Usage: node tools/ammo_v3.js <vanilla textures dir>
const { readPng, writePng } = require('./png');
const VAN = process.argv[2] + '/';
const OUT = 'D:/MCmodev/SpireCraft/src/main/resources/assets/spirecraft/textures/item/';
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const pick = (ramp, t) => hex(ramp[Math.max(0, Math.min(ramp.length - 1, Math.round(t * (ramp.length - 1))))]);
const clamp = v => Math.max(0, Math.min(1, v));

/** Render pieces back to front: each {inside(x, y) -> bool, shade(x, y) -> t, ramp}. */
function render(pieces, outline) {
  const N = 16, id = new Int16Array(N * N).fill(-1), img = { w: N, h: N, d: new Uint8Array(N * N * 4) };
  pieces.forEach((p, k) => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (p.inside(x + 0.5, y + 0.5)) id[y * N + x] = k; });
  const at = (x, y) => (x < 0 || y < 0 || x >= N || y >= N) ? -1 : id[y * N + x];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const k = at(x, y);
    if (k < 0) continue;
    const p = pieces[k], nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => at(x + dx, y + dy));
    let c;
    if (nb.some(n => n < 0)) c = outline;                                   // silhouette
    else if (nb.some(n => n > k)) c = pick(p.ramp, Math.min(0.12, p.shade(x + 0.5, y + 0.5)));   // contact shadow under a front piece
    else c = pick(p.ramp, p.shade(x + 0.5, y + 0.5));
    img.d.set([...c, 255], (y * N + x) * 4);
  }
  return img;
}

// light from the top left (screen y grows downwards), towards the viewer
const L = (() => { const v = [-0.55, -0.62, 0.56], n = Math.hypot(...v); return v.map(c => c / n); })();
function ellipsoid(cx, cy, rx, ry, ramp, bias = 0) {
  return {
    ramp,
    inside: (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1,
    shade: (x, y) => {
      const nx = (x - cx) / rx, ny = (y - cy) / ry, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      return clamp((nx * L[0] + ny * L[1] + nz * L[2] + 0.2) / 1.2 + bias);
    },
  };
}
/** A round bar from a to b (radius r0 at a, r1 at b), shaded as a cylinder lit from its upper-left side. */
function bar(a, b, r0, r1, ramp, bias = 0) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
  // the side facing the light: the normal pointing up-left
  let nx = -uy, ny = ux;
  if (nx * L[0] + ny * L[1] < 0) { nx = -nx; ny = -ny; }
  const param = (x, y) => { const s = ((x - a[0]) * ux + (y - a[1]) * uy) / len; const o = (x - a[0]) * nx + (y - a[1]) * ny; return [s, o]; };
  return {
    ramp,
    inside: (x, y) => { const [s, o] = param(x, y); const r = r0 + (r1 - r0) * clamp(s); return s >= -0.02 && s <= 1.02 && Math.abs(o) <= r; },
    shade: (x, y) => { const [s, o] = param(x, y); const r = r0 + (r1 - r0) * clamp(s); const q = o / r; return clamp(0.92 - 0.6 * (q - 0.4) ** 2 + bias); },
  };
}
/** A flat plate (convex polygon), lighter towards its upper-left, with a bright top edge. */
function plate(poly, ramp, bias = 0) {
  const inside = (x, y) => {
    let sign = 0;
    for (let i = 0; i < poly.length; i++) {
      const [x0, y0] = poly[i], [x1, y1] = poly[(i + 1) % poly.length];
      const c = (x1 - x0) * (y - y0) - (y1 - y0) * (x - x0);
      if (c !== 0) { if (sign === 0) sign = Math.sign(c); else if (Math.sign(c) !== sign) return false; }
    }
    return true;
  };
  return { ramp, inside, shade: (x, y) => clamp(0.62 - 0.035 * (x + y - 16) + (inside(x, y - 1) ? 0 : 0.3) + bias) };
}

// ---------------------------------------------------------------- pebble: a heap of river stones
{
  const S = ['#34302b', '#4a453e', '#625c52', '#7c7568', '#978f80', '#b2a996'];
  const img = render([
    ellipsoid(8.6, 6.6, 3.5, 2.8, S, 0.02),      // the top stone, resting in the groove
    ellipsoid(4.9, 10.4, 3.9, 2.9, S),           // bottom left
    ellipsoid(11.3, 10.9, 3.6, 2.7, S, -0.03),   // bottom right
    ellipsoid(8.2, 13.0, 2.4, 1.7, S, 0.04),     // a small one in front
  ], hex('#28251f'));
  writePng(OUT + 'pebble.png', img);
}

// ---------------------------------------------------------------- scrap: a heap of junk metal
{
  const IRON = ['#2c2e32', '#45484d', '#5f6369', '#7d8188', '#9fa3aa', '#c4c8ce'];
  const RUST = ['#3a241a', '#5a3624', '#7a4a30', '#98603e', '#b47a52'];
  const COPPER = ['#4e2618', '#723a22', '#9a522e', '#c06c3e', '#e09058', '#f4b882'];
  const pieces = [
    plate([[2.5, 4.0], [8.5, 2.5], [10.0, 8.5], [4.0, 10.0]], IRON),                 // an iron sheet leaning at the back
    plate([[1.5, 10.5], [10.0, 8.0], [14.5, 11.0], [5.5, 14.5]], RUST),              // a rusty plate at the bottom
    bar([2.8, 10.4], [13.2, 5.4], 1.5, 1.5, COPPER),                                // a copper bar across the heap
    bar([9.2, 13.9], [13.8, 11.9], 0.9, 0.9, IRON, 0.05),                           // a short iron bolt in front
  ];
  const img = render(pieces, hex('#1e1c1c'));
  writePng(OUT + 'scrap.png', img);
}

// ---------------------------------------------------------------- flak shell: brass case, copper head
{
  const BRASS = ['#5a3c10', '#86601c', '#b08a2c', '#d4b048', '#f0d478', '#fff2b8'];
  const HEAD = ['#3a2420', '#5e3a2c', '#8a5440', '#b07258', '#d29474', '#ecb896'];
  const base = [3.3, 12.7], tip = [12.9, 3.1];
  const lerp = t => [base[0] + (tip[0] - base[0]) * t, base[1] + (tip[1] - base[1]) * t];
  const img = render([
    bar(base, lerp(0.64), 2.5, 2.5, BRASS),        // the case
    bar(lerp(0.62), tip, 2.2, 0.55, HEAD),         // the head, tapering to a point
    bar(base, lerp(0.08), 2.9, 2.9, BRASS, -0.25), // the rim at the base, a little wider and darker
  ], hex('#24180a'));
  writePng(OUT + 'flak_shell.png', img);
}

// ---------------------------------------------------------------- ink bubble: near black, glossy
{
  const INK = ['#000000', '#020203', '#040406', '#070609', '#0a090d', '#0e0d12'];   // v2.7: all black
  const big = ellipsoid(7.2, 7.2, 5.4, 5.4, INK), small = ellipsoid(12.6, 12.6, 1.9, 1.9, INK);
  const img = render([big, small], hex('#000000'));
  const put = (x, y, c) => img.d.set([...hex(c), 255], (y * 16 + x) * 4);
  // v2.7 (user): all black - no highlight
  writePng(OUT + 'ink_bubble.png', img);
}

// ---------------------------------------------------------------- ink bucket: the lava area of the lava bucket, flat ink
{
  const lava = readPng(VAN + 'item/lava_bucket.png');
  const out = { w: 16, h: 16, d: new Uint8Array(lava.d) };   // (bucket.png's transparency does not read: start from the lava bucket)
  const liquid = [];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const i = (y * 16 + x) * 4;
    const r = lava.d[i], g = lava.d[i + 1], bl = lava.d[i + 2], mx = Math.max(r, g, bl), mn = Math.min(r, g, bl);
    if (lava.d[i + 3] && mx > 0 && ((mx - mn) / mx > 0.3 || r > bl + 25)) liquid.push([x, y]);   // the orange / yellow lava, not the grey metal
  }
  const top = Math.min(...liquid.map(p => p[1]));
  for (const [x, y] of liquid) {
    const c = y === top ? '#241b36' : y === top + 1 ? '#150f22' : '#0b0814';
    out.d.set([...hex(c), 255], (y * 16 + x) * 4);
  }
  // one glint on the surface
  const surf = liquid.filter(p => p[1] === top).sort((a, b) => a[0] - b[0]);
  if (surf.length > 3) out.d.set([...hex('#4a3d66'), 255], (top * 16 + surf[2][0]) * 4);
  writePng(OUT + 'ink_bucket.png', out);
}
console.log('pebble, scrap, flak_shell, ink_bubble, ink_bucket written');
