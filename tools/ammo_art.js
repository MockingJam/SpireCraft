// Ammo icons (v2.2), vanilla style, from vanilla 1.21.10 item textures:
//   pebble     — three small stones cut from the vanilla flint silhouette, reshaded warm grey (slingshot ammo)
//   scrap      — a rusty iron nugget + a copper nugget + a bent bolt (junk; makes flak shells)
//   flak_shell — a brass cartridge on the 45° diagonal (round-8 cylinder rules: lit edge, highlight stripe, dark edge)
// Usage: node tools/ammo_art.js <vanilla item texture dir>
const { readPng, writePng } = require('./png');
const SRC = process.argv[2];
const OUT = 'D:/MCmodev/SpireCraft/src/main/resources/assets/spirecraft/textures/item/';
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const lum = p => 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2];
const blank = () => ({ w: 16, h: 16, d: new Uint8Array(1024) });
const set = (img, x, y, c) => { if (x >= 0 && y >= 0 && x < 16 && y < 16) img.d.set([...c, 255], (y * 16 + x) * 4); };
const get = (img, x, y) => img.d.subarray((y * img.w + x) * 4, (y * img.w + x) * 4 + 4);
const ramp = (cols, t) => hex(cols[Math.max(0, Math.min(cols.length - 1, Math.round(t * (cols.length - 1))))]);

// ---- pebble: three smooth river stones (volume-shaded ellipses, light from the top-left), stone-grey ramp
{
  const STONE = ['#4a443c', '#6a6358', '#8a8274', '#ada493', '#d2c9b6'];
  const OUTL = hex('#2e2a25');
  const img = blank();
  const stones = [[5.6, 10.4, 4.7, 3.7], [10.8, 5.0, 3.9, 3.1], [12.2, 12.4, 3.0, 2.5]];
  const hit = (x, y) => { for (let i = 0; i < stones.length; i++) { const [cx, cy, rx, ry] = stones[i]; const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) return [i, dx, dy]; } return null; };
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const h = hit(x, y);
    if (!h) continue;
    const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const g = hit(x + a, y + b); return !g || g[0] !== h[0]; });
    if (edge) { set(img, x, y, OUTL); continue; }
    const [, dx, dy] = h, nz = Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy));
    const lit = Math.max(0, -0.55 * dx - 0.6 * dy + 0.58 * nz);
    set(img, x, y, ramp(STONE, 0.15 + lit * 0.95));
  }
  for (const [x, y] of [[4, 11], [11, 6], [6, 9]]) set(img, x, y, hex('#5a544a'));   // a few grain specks
  writePng(OUT + 'pebble.png', img);
}

// ---- scrap: rusted iron nugget (top-left), copper nugget (bottom-right), a bent bolt between them
{
  const iron = readPng(SRC + '/iron_nugget.png'), copper = readPng(SRC + '/copper_nugget.png');
  const img = blank();
  const RUST = ['#4a2a18', '#7a4424', '#a8643a', '#c8885a'];
  const paste = (src, dx, dy, mirror, rust) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const p = get(src, mirror ? 15 - x : x, y);
      if (!p[3]) continue;
      let c = [p[0], p[1], p[2]];
      if (rust && lum(p) > 60 && lum(p) < 200 && (x * 7 + y * 3) % 4 === 0) c = ramp(RUST, lum(p) / 255);
      set(img, x + dx, y + dy, c);
    }
  };
  // bolt: a short bent rod
  const BOLT = [[4, 11], [5, 11], [6, 12], [7, 12], [8, 12]];
  for (const [x, y] of BOLT) { set(img, x, y, hex('#8a8a8e')); set(img, x, y + 1, hex('#3a3a40')); }
  set(img, 3, 10, hex('#5a5a60')); set(img, 3, 11, hex('#b0b0b6')); set(img, 3, 12, hex('#3a3a40'));
  paste(iron, -3, -3, true, true);
  paste(copper, 3, 3, false, false);
  writePng(OUT + 'scrap.png', img);
}

// ---- flak shell: brass cartridge, base bottom-left, steel tip top-right
{
  const img = blank();
  const BRASS = ['#5a3a10', '#8a6020', '#c09030', '#e8c060', '#fff0b0'];
  const STEEL = ['#2a2a30', '#50505a', '#7a7a86', '#a8a8b4', '#e0e0e8'];
  const OUTL = hex('#3a2408'), OUTS = hex('#22222a');
  const A = [3.5, 12.5], B = [12.5, 3.5];
  const L = Math.hypot(B[0] - A[0], B[1] - A[1]), ux = (B[0] - A[0]) / L, uy = (B[1] - A[1]) / L;
  const R = 2.2;
  const inside = (x, y) => {
    const px = x + 0.5 - A[0], py = y + 0.5 - A[1];
    const t = (px * ux + py * uy) / L, s = -px * uy + py * ux;
    const r = t > 0.72 ? R * Math.sqrt(Math.max(0, 1 - ((t - 0.72) / 0.3) ** 2)) : t < 0.1 ? R + 0.4 : R;   // round-nosed tip   // tapered tip, flared base rim
    return t >= -0.02 && t <= 1.02 && Math.abs(s) <= r ? { t, s, r } : null;
  };
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const h = inside(x, y);
    if (!h) continue;
    const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !inside(x + dx, y + dy));
    const tip = h.t > 0.72;
    if (edge) { set(img, x, y, tip ? OUTS : OUTL); continue; }
    // across the width: lit edge (s<0 = upper-left side), highlight stripe, dark edge
    const k = h.s / h.r;   // -1 .. 1
    let v = k < -0.45 ? 0.75 : k < -0.05 ? 1.0 : k < 0.45 ? 0.55 : 0.25;
    if (h.t < 0.1) v -= 0.25;                                  // base rim
    if (Math.abs(h.t - 0.7) < 0.03) v = 0.15;                  // crimp line
    set(img, x, y, ramp(tip ? STEEL : BRASS, Math.max(0, Math.min(1, v))));
  }
  writePng(OUT + 'flak_shell.png', img);
}
console.log('pebble, scrap, flak_shell written');
