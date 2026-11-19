// 16x16 blades built on the vanilla iron sword's pixel layout (same blade width, crossguard, grip and pommel positions),
// recoloured part by part with colours sampled from the user's reference paintings, plus per-weapon details.
// Usage: node tools/blade16.js <ref png dir> <outDir> [swatches.png]
const { readPng, writePng } = require('./png');

// Roles, transcribed from textures/item/iron_sword.png:
//  O/K blade outline (lit / shadow side), 1-3 blade light→dark; o/k hilt outline; G/g guard light/dark;
//  H/h/q handle light→dark, Q handle outline; P pommel.
const TEMPLATE = [
  '.............OOO',
  '............O11K',
  '...........O131K',
  '..........O131K.',
  '.........O132K..',
  '........O132K...',
  '..oo...O232K....',
  '..oGo.O232K.....',
  '...oGk232K......',
  '...oGGg2K.......',
  '....ogok........',
  '...qhkggk.......',
  '..qHQ.kkgk......',
  'oohQ....kk......',
  'oPk.............',
  'kkk.............',
];

const lum = c => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
const hex = c => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const unhex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mul = (c, f) => hex(unhex(c).map(v => v * f));

/** k-means(k) of the painted (non-paper, non-ink) pixels in a sheet box, light → dark. */
function sample(sheetImg, [x0, y0, x1, y1], k = 3) {
  const cols = [];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const p = (y * sheetImg.w + x) * 4, c = [sheetImg.d[p], sheetImg.d[p + 1], sheetImg.d[p + 2]];
    const mx = Math.max(...c), mn = Math.min(...c);
    if (mn > 205 && mx - mn < 45) continue;      // paper
    if (lum(c) < 38) continue;                   // ink outline
    cols.push(c);
  }
  cols.sort((a, b) => lum(a) - lum(b));
  let cent = Array.from({ length: k }, (_, i) => cols[Math.floor((i + 0.5) * cols.length / k)].slice());
  for (let it = 0; it < 10; it++) {
    const sum = cent.map(() => [0, 0, 0, 0]);
    for (const c of cols) {
      let b = 0, bd = Infinity;
      cent.forEach((m, j) => { const d = (c[0] - m[0]) ** 2 + (c[1] - m[1]) ** 2 + (c[2] - m[2]) ** 2; if (d < bd) { bd = d; b = j; } });
      sum[b][0] += c[0]; sum[b][1] += c[1]; sum[b][2] += c[2]; sum[b][3]++;
    }
    cent = cent.map((m, j) => sum[j][3] ? [sum[j][0] / sum[j][3], sum[j][1] / sum[j][3], sum[j][2] / sum[j][3]] : m);
  }
  return cent.sort((a, b) => lum(b) - lum(a)).map(hex);
}

// Part boxes in the reference sheets (blade / guard / handle / pommel / extra coating), sheet numbers as in weapon_refs.js
const BLADES = {
  regent_strike: { sheet: 3, blade: [430, 725, 560, 855], guard: [310, 650, 420, 765], handle: [240, 600, 320, 665], pommel: [220, 585, 260, 625] },
  poisoned_dagger: { sheet: 5, blade: [735, 250, 800, 300], guard: [800, 220, 835, 245], handle: [850, 175, 895, 215], pommel: [890, 155, 920, 180], extra: [610, 330, 700, 420] },
  ink_dagger: { sheet: 5, blade: [1220, 270, 1290, 330], guard: [1310, 215, 1350, 255], handle: [1345, 160, 1415, 215], pommel: [1400, 148, 1440, 175], extra: [1090, 330, 1190, 410] },
  throwing_knife: { sheet: 5, blade: [200, 740, 280, 800], guard: [330, 660, 380, 710], handle: [330, 660, 380, 710], pommel: [400, 625, 440, 660], extra: [110, 700, 200, 860] },
  snakebite: { sheet: 5, blade: [1150, 670, 1330, 790], guard: [1340, 630, 1400, 710], handle: [1385, 600, 1465, 650], pommel: [1445, 595, 1480, 635] },
  cleaver: { sheet: 6, blade: [210, 230, 430, 360], guard: [395, 175, 450, 270], handle: [440, 145, 530, 220], pommel: [515, 140, 560, 175] },
  bloodletting_dagger: { sheet: 6, blade: [830, 590, 900, 660], guard: [900, 605, 940, 645], handle: [910, 530, 990, 600], pommel: [960, 525, 1000, 560], extra: [720, 660, 820, 790] },
};

/** Base sprite: template roles → colours. pal: {blade:[l,m,d], guard:[l,d], handle:[l,m,d], pommel:[c]} */
function base(pal) {
  const b = pal.blade, g = pal.guard, h = pal.handle;
  const map = {
    1: b[0], 2: b[1], 3: b[2], O: mul(b[3], 0.55), K: mul(b[3], 0.3),
    G: g[0], g: g[g.length - 1], o: mul(g[g.length - 1], 0.5), k: mul(g[g.length - 1], 0.28),
    H: h[0], h: h[1], q: h[2], Q: mul(h[2], 0.45), P: pal.pommel || g[0],
  };
  return TEMPLATE.map(r => [...r].map(ch => (ch === '.' ? null : map[ch])));
}
const put = (s, x, y, c) => { if (x >= 0 && y >= 0 && x < 16 && y < 16) s[y][x] = c; };

function build(name, sheets) {
  const ref = BLADES[name], img = sheets(ref.sheet);
  const blade = sample(img, ref.blade, 4), guard = sample(img, ref.guard, 2), handle = sample(img, ref.handle, 3), pommel = sample(img, ref.pommel, 1)[0];
  const extra = ref.extra ? sample(img, ref.extra, 4) : null;
  const pal = { blade, guard, handle, pommel };
  const s = base(pal);
  const tip = (x, y) => s[y]?.[x];
  switch (name) {
    case 'poisoned_dagger': {   // green poison running down the lower edge and dripping
      const slime = extra.filter(c => { const [r, g2, b2] = unhex(c); return g2 > r && g2 > b2; });
      const sl = slime.length ? slime : ['#9ae030', '#58a818'];
      for (const [x, y] of [[12, 4], [11, 5], [10, 6], [9, 7], [8, 8]]) put(s, x, y, sl[0]);
      for (const [x, y] of [[13, 3], [12, 4]]) put(s, x, y, sl[0]);
      put(s, 9, 8, sl[sl.length - 1]); put(s, 9, 9, sl[0]); put(s, 9, 10, sl[sl.length - 1]);
      put(s, 12, 5, sl[sl.length - 1]); put(s, 12, 6, sl[0]);
      break;
    }
    case 'ink_dagger': {        // dark ink over the lower blade, a few drops around
      const ink = extra.filter(c => { const [r, g2, b2] = unhex(c); return b2 >= r && b2 > g2 + 8; });
      const ik = ink.length ? ink : ['#5a36a0', '#34186a'];
      for (const [x, y] of [[11, 5], [10, 6], [9, 7], [12, 4]]) put(s, x, y, ik[0]);
      for (const [x, y] of [[8, 8], [10, 7]]) put(s, x, y, ik[ik.length - 1]);
      put(s, 12, 7, ik[0]); put(s, 14, 5, ik[ik.length - 1]); put(s, 6, 4, ik[0]);
      break;
    }
    case 'throwing_knife': {    // kunai: no crossguard, ring pommel, faint red glow on the shadow edge
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ('Ggok'.includes(TEMPLATE[y][x]) && (x + y < 13 || x + y > 17)) s[y][x] = null;
      const red = extra.filter(c => { const [r, g2, b2] = unhex(c); return r > g2 + 40 && r > b2 + 40; });
      const glow = red[0] || '#e04030';
      for (let y = 0; y < 10; y++) for (let x = 0; x < 16; x++) if (TEMPLATE[y][x] === 'K') s[y][x] = glow;
      // ring pommel
      for (const [x, y] of [[0, 13], [1, 13], [2, 14], [0, 15], [1, 15], [0, 14]]) put(s, x, y, handle[1]);
      put(s, 1, 14, null); put(s, 2, 15, mul(handle[2], 0.45)); put(s, 2, 13, handle[0]);
      break;
    }
    case 'snakebite': {         // wavy kris blade: shift alternate stretches of the blade sideways
      const blade0 = TEMPLATE.map(r => [...r]);
      const wave = [[13, 1, -1], [11, 3, 1], [9, 5, -1]];
      for (const [x, y, d] of wave) {
        for (const [dx, dy] of [[0, 0], [1, 0], [-1, 1]]) {
          const xx = x + dx, yy = y + dy;
          if (!'123'.includes(blade0[yy]?.[xx])) continue;
          put(s, xx + d, yy - d, s[yy][xx]);
        }
      }
      put(s, 14, 0, blade[0]); put(s, 15, 0, null);
      break;
    }
    case 'cleaver': {           // broad chopping blade: one more row on the shadow side, a nick near the edge
      for (let y = 1; y < 9; y++) for (let x = 0; x < 16; x++) if (TEMPLATE[y][x] === 'K') { put(s, x, y, blade[2]); put(s, x + 1, y, mul(blade[2], 0.22)); put(s, x, y + 1, s[y + 1][x] || mul(blade[2], 0.22)); }
      put(s, 12, 4, mul(blade[2], 0.22)); put(s, 13, 4, null);
      put(s, 15, 0, null); put(s, 15, 1, mul(blade[2], 0.22));
      break;
    }
    case 'bloodletting_dagger': {   // blood on the lower blade, one drop falling from the tip
      const red = extra.filter(c => { const [r, g2, b2] = unhex(c); return r > g2 + 50 && r > b2 + 40; });
      const bl = red.length ? red : ['#c81818', '#7a0808'];
      for (const [x, y] of [[13, 2], [12, 3], [11, 4], [13, 3], [12, 4]]) put(s, x, y, bl[0]);
      put(s, 11, 5, bl[bl.length - 1]); put(s, 10, 6, bl[0]);
      put(s, 15, 2, bl[0]); put(s, 15, 3, bl[bl.length - 1]);
      break;
    }
    case 'regent_strike': {     // star-shaped crossguard: spikes at both ends and a ring hole in the middle
      put(s, 1, 5, guard[0]); put(s, 10, 14, guard[1]); put(s, 9, 14, mul(guard[1], 0.28)); put(s, 1, 6, mul(guard[1], 0.5));
      put(s, 5, 9, mul(guard[1], 0.28));
      break;
    }
  }
  return { s, swatch: { blade, guard, handle, pommel, extra } };
}

if (require.main === module) {
  const [refDir, outDir, swatchPng] = process.argv.slice(2);
  const cache = {};
  const sheets = n => cache[n] || (cache[n] = readPng(refDir + '/' + n + '.png'));
  const results = Object.keys(BLADES).map(n => [n, build(n, sheets)]);
  for (const [n, { s }] of results) {
    const d = new Uint8Array(16 * 16 * 4);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (s[y][x]) d.set([...unhex(s[y][x]), 255], (y * 16 + x) * 4);
    writePng(outDir + '/' + n + '.png', { w: 16, h: 16, d });
  }
  if (swatchPng) {
    const rows = results.length, W = 16 * 12, H = rows * 20;
    const d = new Uint8Array(W * H * 4);
    results.forEach(([n, { swatch }], r) => {
      const all = [...swatch.blade, '#808080', ...swatch.guard, '#808080', ...swatch.handle, '#808080', swatch.pommel, '#808080', ...(swatch.extra || [])];
      all.forEach((c, i) => { for (let y = 0; y < 18; y++) for (let x = 0; x < 15; x++) if (i * 16 + x < W) d.set([...unhex(c), 255], ((r * 20 + y) * W + i * 16 + x) * 4); });
    });
    writePng(swatchPng, { w: W, h: H, d });
  }
  console.log(results.map(([n]) => n).join(' '));
}
module.exports = { BLADES, build };
