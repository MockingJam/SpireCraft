// Issue #36 (the Regent's meteor crater): textures for the two new blocks.
//   meteorite     - the fallen star's rock: vanilla blackstone's stone pattern in the Regent's night-sky indigo, with a few
//                   pale sky-blue star specks spread over a jittered lattice (one warm gold one).
//   orange_dough  - STS2 Orange Dough: soft lumps of glowing orange dough pressed together, each lump lit from the top
//                   left with a soft highlight, darker folds between them, a few pale-gold glints.
// Usage: node tools/regent_textures.js <dir with vanilla assets/minecraft/textures> [preview.png]
const fs = require('fs');
const path = require('path');
const { readPng, writePng } = require('./png');
const V = path.join(process.argv[2], 'assets/minecraft/textures/');
const OUT = path.resolve(__dirname, '../src/main/resources/assets/spirecraft/textures/');
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const blank = (w = 16, h = 16) => ({ w, h, d: new Uint8Array(w * h * 4) });
const get = (img, x, y) => { const i = ((((y % img.h) + img.h) % img.h) * img.w + (((x % img.w) + img.w) % img.w)) * 4; return [img.d[i], img.d[i + 1], img.d[i + 2], img.d[i + 3]]; };
const set = (img, x, y, c) => { x = ((x % img.w) + img.w) % img.w; y = ((y % img.h) + img.h) % img.h; const i = (y * img.w + x) * 4; img.d[i] = c[0]; img.d[i + 1] = c[1]; img.d[i + 2] = c[2]; img.d[i + 3] = 255; };
const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const pick = (ramp, t) => hex(ramp[Math.max(0, Math.min(ramp.length - 1, Math.round(t * (ramp.length - 1))))]);
const B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
/** a smooth value t in 0..1 to a ramp step, 4x4 Bayer-dithered between neighbours */
const dither = (ramp, t, x, y) => { const f = t * (ramp.length - 1), i = Math.floor(f), fr = f - i; return hex(ramp[Math.min(ramp.length - 1, i + (fr * 16 > B4[y & 3][x & 3] + 0.5 ? 1 : 0))]); };

const jobs = {};

// ---- meteorite: blackstone's rock in night-sky indigo, star specks
{
  const src = readPng(V + 'block/blackstone.png');
  // indigo / deep-blue night ramp (art_style 101: the Regent's night sky), floor raised so the darkest is not black
  const ramp = ['#1c1830', '#25203f', '#2e2a52', '#383665', '#454679', '#56598c'];
  let lo = 255, hi = 0;
  for (let i = 0; i < src.d.length; i += 4) { const L = lum(src.d[i], src.d[i + 1], src.d[i + 2]); lo = Math.min(lo, L); hi = Math.max(hi, L); }
  const img = blank();
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const [r, g, b] = get(src, x, y); set(img, x, y, pick(ramp, (lum(r, g, b) - lo) / (hi - lo))); }
  // a few stars, spread unevenly (hand-placed: a lattice read as a grid when tiled); one twinkles, one is warm gold
  for (const [x, y, kind] of [[4, 3, 'big'], [12, 2, ''], [9, 8, 'warm'], [2, 11, ''], [13, 12, '']]) {
    set(img, x, y, hex(kind === 'warm' ? '#e8b862' : kind === 'big' ? '#cfe8fa' : '#8cb8dc'));
    if (kind === 'big') for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) set(img, x + dx, y + dy, hex('#5f78a8'));
  }
  jobs['block/meteorite'] = img;
}

// ---- orange dough: pressed lumps, each a soft dome lit from the top left
{
  // lump centres (tile wraps), radii: a few big lumps with small ones in the gaps
  const pts = [[4, 4, 5.2], [12.5, 3, 4.4], [8.5, 10.5, 5.6], [1.5, 13, 3.6], [14.5, 11.5, 3.4]];
  const ramp = ['#7e2c0c', '#a5400e', '#c85a14', '#e2761e', '#f0922e', '#f8ae4a', '#fcc872'];
  const img = blank();
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    // the lump this pixel belongs to: the one with the highest dome here (so lumps press against each other)
    let best = -1e9, lx = 0, ly = 0, second = -1e9;
    for (const [px, py, r] of pts) for (const ox of [-16, 0, 16]) for (const oy of [-16, 0, 16]) {
      const dx = x + 0.5 - px - ox, dy = y + 0.5 - py - oy, h = 1 - (dx * dx + dy * dy) / (r * r);
      if (h > best) { second = best; best = h; lx = dx / r; ly = dy / r; } else if (h > second) second = h;
    }
    const dome = Math.max(0, best);
    // light from the top left on the dome's normal, the fold between two lumps darker
    const nz = Math.sqrt(Math.max(0, 1 - lx * lx - ly * ly));
    let t = 0.36 + 0.4 * (-lx * 0.55 - ly * 0.6 + nz * 0.55) + 0.12 * dome;
    if (best - second < 0.12) t -= 0.22;                    // the crease where two lumps meet
    t += (hash(x, y, 7) - 0.5) * 0.08;                     // a little doughy grain
    set(img, x, y, dither(ramp, Math.max(0, Math.min(1, t)), x, y));
  }
  // a few pale-gold glints on lit tops (star dust kneaded in)
  for (const [x, y] of [[3, 2], [7, 8]]) set(img, x, y, hex('#ffe7a8'));
  jobs['block/orange_dough'] = img;
}

for (const [name, img] of Object.entries(jobs)) writePng(path.join(OUT, name + '.png'), img);
console.log('wrote', Object.keys(jobs).join(', '));

// preview: each texture 3x3 tiled at 8x, next to vanilla blackstone and resin
const pv = process.argv[3];
if (pv) {
  const tiles = [jobs['block/meteorite'], readPng(V + 'block/blackstone.png'), jobs['block/orange_dough'], readPng(V + 'block/resin_block.png'), readPng(V + 'block/honey_block_side.png')];
  const S = 6, T = 48 * S, pad = 8, out = blank(tiles.length * (T + pad) + pad, T + pad * 2);
  out.d.fill(40);
  tiles.forEach((tex, k) => {
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
      const c = get(tex, (x / S | 0) % 16, (y / S | 0) % 16);
      const i = ((y + pad) * out.w + pad + k * (T + pad) + x) * 4;
      out.d[i] = c[0]; out.d[i + 1] = c[1]; out.d[i + 2] = c[2]; out.d[i + 3] = 255;
    }
  });
  writePng(pv, out);
}
