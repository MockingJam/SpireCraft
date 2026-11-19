// Phase 6 weapons v6 (16x16, 45°): redrawn from the user's reference sheets (Royal Armaments / Necrobinder / Silent /
// Ironclad / Defect), each matched to its STS2 card. Shapes are laid out in diagonal coordinates:
//   t = x - y  runs along the weapon (pommel at bottom-left t≈-15, tip at top-right t≈+15)
//   s = x + y  runs across it (s=15 is the centre line; smaller s = upper-left side, lit; larger s = lower-right, shaded)
// Every sprite gets a 1-px outline in the darkest tone of the part it borders (vanilla item style).
// Usage: node tools/weapon_sprites.js <outDir> [preview.png]
const { writePng } = require('./png');

const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** A 16x16 sprite: cells hold [colour, outlineColour]. */
function Sprite() {
  const c = Array.from({ length: 16 }, () => Array(16).fill(null));
  const api = {
    c,
    put(x, y, col, k) { if (x >= 0 && y >= 0 && x < 16 && y < 16 && col) c[y][x] = [col, k || c[y][x]?.[1] || '#101010']; return api; },
    clear(x, y) { if (x >= 0 && y >= 0 && x < 16 && y < 16) c[y][x] = null; return api; },
    has(x, y) { return x >= 0 && y >= 0 && x < 16 && y < 16 && c[y][x] !== null; },
    /** Paint every pixel whose (s, t) passes {@code test}; {@code paint(s, t, x, y)} returns a colour or null. */
    diag(test, paint, k) {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const s = x + y, t = x - y;
        if (test(s, t, x, y)) { const col = paint(s, t, x, y); if (col) api.put(x, y, col, k); }
      }
      return api;
    },
    /** Paint pixels by plain (x, y). */
    area(test, paint, k) { return api.diag((s, t, x, y) => test(x, y), (s, t, x, y) => paint(x, y), k); },
    /** 1-px polyline through points (x, y), colour by index along the line. */
    line(pts, paint, k) {
      let n = 0;
      for (let i = 0; i + 1 < pts.length; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
        for (let j = 0; j <= steps; j++) api.put(Math.round(x0 + (x1 - x0) * j / steps), Math.round(y0 + (y1 - y0) * j / steps), paint(n++), k);
      }
      return api;
    },
    /** Auto outline: empty pixels 4-adjacent to paint take that paint's outline colour. */
    outline(skip = () => false) {
      const add = [];
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        if (c[y][x] || skip(x, y)) continue;
        for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) {
          const n = c[y + dy]?.[x + dx];
          if (n && n[1] !== 'none') { add.push([x, y, n[1]]); break; }
        }
      }
      for (const [x, y, k] of add) c[y][x] = [k, 'none'];
      return api;
    },
  };
  return api;
}
/** Ramp (light → dark) lookup, f in [0, 1]. */
const R = (ramp, f) => ramp[clamp(Math.round(f * (ramp.length - 1)), 0, ramp.length - 1)];
/** Across-shading of a band [s0, s1]: upper-left light, lower-right dark. */
const across = (ramp, s, s0, s1, bias = 0) => R(ramp, clamp((s - s0) / Math.max(1, s1 - s0) + bias, 0, 1));
const inB = (v, a, b) => v >= a && v <= b;

// ------------------------------------------------------------------ palettes sampled from the reference sheets
const C = {
  gold: ['#fff4a8', '#f8d24a', '#e09a22', '#a8641a', '#6a3a0e'], goldK: '#3e200a',
  crystal: ['#eaffff', '#94f0ff', '#3fc6f2', '#1a84d2', '#104e96'], crystalK: '#0a2a58',
  royalPurple: ['#b85ab8', '#843084', '#521a56'], royalPurpleK: '#2a0a2c',
  magenta: ['#f07ab0', '#c8407e', '#8a1e54', '#521032'], magentaK: '#2c0618',
  steel: ['#ffffff', '#dce0e2', '#aab2b6', '#7a8488', '#4e575c'], steelK: '#262c30',
  iron: ['#d8d8d8', '#a6a6a6', '#767676', '#4c4c4c', '#2e2e2e'], ironK: '#161616',
  rawIron: ['#e6e2da', '#c2bcb2', '#99938a', '#6c665e', '#47423c'], rawIronK: '#221f1b',
  leather: ['#d88a50', '#a85a2c', '#743816', '#46200c'], leatherK: '#26100a',
  wood: ['#e8c888', '#c09658', '#8c6634', '#5c4020'], woodK: '#2e1e0e',
  redGrip: ['#f08050', '#c04a26', '#80240e'], redGripK: '#3e0e06',
  maroon: ['#b04a6a', '#7a2442', '#4a1028'], maroonK: '#24060e',
  bone: ['#fff4e6', '#f2cfb2', '#d6a282', '#a8745a'], boneK: '#5a3424',
  ivory: ['#fbf1dc', '#dcc8a2', '#a88e6c'], ivoryK: '#5a4630',
  necroShaft: ['#7e3c72', '#4e1e48', '#2e0e2a'], necroShaftK: '#16040f',
  fan: ['#e0b0f6', '#b878e8', '#9050cc', '#683ca8'], fanK: '#3a1458',
  cord: ['#f06a3a', '#c83a18', '#8a200c'], cordK: '#3e0a04',
  bead: ['#d890f0', '#9a4ac8', '#5e2486'], beadK: '#2a0a40',
  slime: ['#d8ff6a', '#9ae030', '#58a818', '#2e6a10'], slimeK: '#173a08',
  ink: ['#8c6ad0', '#5a36a0', '#34186a', '#1e0c40'], inkK: '#0e041e',
  olive: ['#8aa65a', '#5a7a34', '#34501c'], oliveK: '#1a2a0c',
  inkGrip: ['#7a5a8a', '#4a3258', '#2a1a34'], inkGripK: '#140a1a',
  glass: ['#f2fbf8', '#bcd8d2', '#88a8a2'], glassK: '#34464a',
  kris: ['#eef8f2', '#c2d8cc', '#94b2a4', '#62806f'], krisK: '#26362e',
  hell: ['#fff0a0', '#ffb040', '#f05a18', '#a8200a'], hellK: '#3a0804',
  hellIron: ['#6a4a44', '#48302c', '#2c1c1a'],
  skull: ['#e8e0d0', '#b0a690', '#746a5a'], skullK: '#2a241c',
  violet: ['#a676d0', '#704aa0', '#46286a'], violetK: '#1e0e32',
  gun: ['#6a6a74', '#46464e', '#2a2a32'], gunK: '#121216',
  brass: ['#f4d07a', '#c49a46', '#8a6424', '#5a3e14'], brassK: '#2c1e08',
  cyan: ['#eaffff', '#7af4f8', '#2acade', '#14869e', '#0c5464'], cyanK: '#06303a',
  shadow: ['#c8a6f2', '#9670d8', '#6a44b0', '#44257e', '#2a1452'], shadowK: '#14082a',
  spark: ['#fffbd0', '#ffe46a', '#f2b628', '#b67a10'], sparkK: '#5a3606',
};

const W = {};

// ================================================================== Regent — Royal Armaments
W.sovereign_blade = () => {
  const s = Sprite();
  s.diag((S, t) => inB(t, -1, 12) && inB(S, 14, 16) && !(t >= 10 && S !== 15), (S, t) =>
    S === 14 ? R(C.crystal, t % 4 === 0 ? 0 : 0.25) : S === 15 ? R(C.crystal, t > 6 ? 0.25 : 0.5) : R(C.crystal, 0.75), C.crystalK);
  s.diag((S, t) => t === 13 && S === 15, () => C.crystal[1], C.crystalK);
  s.diag((S, t) => inB(t, -3, -2) && inB(S, 11, 19), (S, t) => S === 11 || S === 19 ? C.gold[0] : across(C.gold, S, 11, 19, -0.1), C.goldK);
  s.diag((S, t) => inB(t, -10, -4) && inB(S, 15, 16), (S, t) => t === -6 || t === -9 ? R(C.gold, S === 15 ? 1 / 4 : 2 / 4) : R(C.royalPurple, S === 15 ? 0 : 1), C.royalPurpleK);
  s.diag((S, t) => inB(t, -13, -11) && inB(S, 14, 16), (S) => across(C.gold, S, 14, 16), C.goldK);
  s.diag((S, t) => t === -14 && S === 16 || t === -15 && S === 15, () => C.gold[2], C.goldK);
  return s.outline();
};

W.crescent_spear = () => {
  const s = Sprite();
  s.diag((S, t) => inB(t, -13, 4) && inB(S, 15, 16), (S, t) => [-11, -6, 3].includes(t) || [-12, -7, 4].includes(t) ? R(C.gold, S === 15 ? 1 / 4 : 2 / 4) : R(C.royalPurple, S === 15 ? 0 : 1), C.royalPurpleK);
  s.diag((S, t) => inB(t, -15, -14) && inB(S, 15, 16), () => C.magenta[1], C.magentaK);
  // crescent: ring around (11, 4) opening toward the tip
  const cx = 10.6, cy = 4.6;
  s.area((x, y) => { const dx = x + 0.5 - cx, dy = y + 0.5 - cy, r = Math.hypot(dx, dy); return r > 2.4 && r < 4.3 && (dx - dy) / Math.SQRT2 < 1.2; },
    (x, y) => { const r = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); return r > 3.4 ? R(C.gold, (x - y < 4) ? 0.5 : 0.25) : R(C.magenta, x + y > 15 ? 0.66 : 0.33); }, C.magentaK);
  s.diag((S, t) => inB(t, 5, 14) && (S === 15 || (t < 9 && inB(S, 14, 16))), (S, t) => S === 14 ? C.gold[0] : S === 15 ? R(C.gold, t > 10 ? 0.25 : 0.5) : C.gold[3], C.goldK);
  return s.outline();
};

W.heirloom_hammer = () => {
  const s = Sprite();
  s.diag((S, t) => inB(t, -15, 2) && inB(S, 15, 16), (S, t) => [-12, -11, -4, -3, 1, 2].includes(t) ? R(C.gold, S === 15 ? 1 / 4 : 2 / 4) : R(C.royalPurple, S === 15 ? 0 : 1), C.royalPurpleK);
  s.diag((S, t) => inB(t, 3, 10) && inB(S, 9, 21), (S, t) => {
    if (S <= 10 || S >= 20) return R(C.crystal, S <= 10 ? 0.25 : 0.75);                       // blue crystal end caps
    if (inB(t, 5, 8) && inB(S, 13, 17)) return R(C.cyan, S === 13 || t === 8 ? 0 : S === 17 || t === 5 ? 0.75 : 0.25);   // gem window
    if (S === 12 || S === 18) return C.royalPurple[1];                                          // purple bands
    return R(C.gold, clamp((S - 11) / 10 + (t === 10 ? -0.3 : t === 3 ? 0.3 : 0), 0, 1));
  }, C.goldK);
  return s.outline();
};

W.regent_strike = () => {
  const s = Sprite();
  s.diag((S, t) => inB(t, 0, 12) && inB(S, 14, 16) && !(t >= 9 && S !== 15), (S, t) => S === 14 ? C.gold[0] : S === 15 ? R(C.gold, t > 8 ? 0.25 : 0.5) : C.gold[3], C.goldK);
  s.diag((S, t) => t === 13 && S === 15, () => C.gold[1], C.goldK);
  // star guard: four spikes around a ring at (6.5, 8.5)
  s.diag((S, t) => (t === -2 && inB(S, 10, 20)) || (inB(t, -5, 1) && S === 15) || (t === -1 && inB(S, 12, 18)) || (t === -3 && inB(S, 12, 18)), (S, t) => across(C.gold, S, 10, 20, t === -3 ? 0.15 : -0.1), C.goldK);
  s.put(6, 8, C.goldK, C.goldK);
  s.diag((S, t) => inB(t, -12, -6) && inB(S, 15, 16), (S) => R(C.redGrip, S === 15 ? 0 : 1), C.redGripK);
  s.diag((S, t) => inB(t, -14, -13) && inB(S, 14, 16), (S) => across(C.gold, S, 14, 16), C.goldK);
  return s.outline();
};

W.photon_cut = () => {
  const s = Sprite();
  const centre = t => 15 - Math.round(Math.pow(Math.max(0, t - 2) / 11, 2) * 3);   // curves up toward the tip
  const half = t => t > 10 ? 0 : t > 7 ? 1 : 2;
  s.diag((S, t) => inB(t, 0, 13) && Math.abs(S - centre(t)) <= half(t), (S, t) => {
    const f = t / 13, edge = S - centre(t);
    const ramp = f < 0.35 ? ['#f2a0d0', '#d04e8e', '#902a62'] : f < 0.7 ? ['#ffc0a0', '#ec6a6a', '#b03a52'] : ['#fff2a8', '#ffc850', '#e08a2a'];
    return R(ramp, edge < 0 ? 0 : edge === 0 ? 0.5 : 1);
  }, '#4a0e2a');
  s.diag((S, t) => inB(t, -4, -1) && inB(S, 12, 18), (S, t) => (t === -2 || t === -3) && S === 15 ? '#ffd84a' : across(['#f0ecf6', '#b8aac8', '#7a6a8c', '#4e4060'], S, 12, 18), '#221a2e');
  s.diag((S, t) => inB(t, -12, -5) && inB(S, 15, 16), (S, t) => t % 3 === 0 ? C.maroon[2] : R(C.maroon, S === 15 ? 0 : 1), C.maroonK);
  s.diag((S, t) => inB(t, -15, -13) && inB(S, 14, 16), (S) => across(['#fff0c0', '#e8c070', '#a88038'], S, 14, 16), '#3e2a0e');
  return s.outline();
};

// ================================================================== Necrobinder
W.scythe = () => {
  const s = Sprite();
  s.diag((S, t) => inB(t, -15, 8) && inB(S, 15, 16), (S, t) => {
    if (t === -14 || t === -15 || t === 7 || t === 8 || t === -4) return R(C.steel, S === 15 ? 0.25 : 0.75);   // silver caps/rings
    if (inB(t, -12, -9) || inB(t, -2, 1)) return R(C.magenta, S === 15 ? 0.25 : 0.5);                       // magenta wraps
    return R(C.necroShaft, S === 15 ? 0 : 1);
  }, C.necroShaftK);
  // steel blade sweeping from the top of the shaft round to the left, red inner edge (hand-placed rows)
  const rows = { 1: [4, 12], 2: [2, 12], 3: [1, 5], 4: [1, 2], 5: [0, 1], 6: [0, 0] };
  const inBlade = (x, y) => rows[y] && x >= rows[y][0] && x <= rows[y][1];
  for (const [y, [x0, x1]] of Object.entries(rows)) for (let x = x0; x <= x1; x++) {
    const yy = +y, edge = !inBlade(x, yy + 1) && yy > 1;
    s.put(x, yy, edge ? '#c8202e' : yy === 1 ? C.steel[x > 9 ? 1 : 0] : C.steel[x < 4 ? 2 : 1], C.steelK);
  }
  s.put(12, 2, C.steel[3], C.steelK).put(13, 2, C.steel[2], C.steelK).put(12, 3, C.steel[3], C.steelK);
  return s.outline();
};

W.scourge = () => {
  const s = Sprite();
  s.diag((S, t) => inB(t, -15, -6) && inB(S, 15, 16), (S, t) => {
    if (t === -15 || t === -14) return R(C.iron, 0.5);
    if (t === -7 || t === -6) return ['#8ab8ff', '#3a64c8'][S === 15 ? 0 : 1];
    return t % 2 === 0 ? R(C.magenta, S === 15 ? 0.25 : 0.5) : R(C.magenta, S === 15 ? 0.5 : 0.75);
  }, C.magentaK);
  const loop = [[6, 9], [8, 8], [10, 7], [12, 5], [13, 3], [12, 1], [10, 1], [8, 2], [7, 4], [8, 6], [10, 5]];
  s.line(loop, i => R(C.cord, i % 3 === 0 ? 0 : i % 3 === 1 ? 0.5 : 1), C.cordK);
  for (const [bx, by] of [[9, 7], [13, 4], [11, 1], [7, 3], [9, 5]]) { s.put(bx, by, C.bead[0], C.beadK); s.put(bx + 1, by + 1, C.bead[2], C.beadK); }
  return s.outline();
};

W.forbidden_grimoire = () => {
  const s = Sprite();
  // purple cover under the open pages
  s.area((x, y) => inB(y, 11, 13) && inB(x, 2, 13) && !(y === 13 && (x === 2 || x === 13)), (x, y) => R(C.violet, y === 11 ? 0 : y === 12 ? 1 / 2 : 1), C.violetK);
  // two pages, a little curl at the spine
  s.area((x, y) => inB(y, 5, 11) && inB(x, 2, 13) && !(y === 5 && (x === 2 || x === 13)) && !(x === 7 || x === 8) || (inB(y, 6, 11) && (x === 7 || x === 8)),
    (x, y) => {
      if ((x === 7 || x === 8)) return '#b89a70';
      if ([[4, 7], [5, 7], [4, 9], [10, 7], [11, 8], [10, 9], [5, 9]].some(([a, b]) => a === x && b === y)) return '#c02830';
      return R(['#fff6dc', '#ecd8ac', '#c8aa7c'], x < 7 ? (x - 2) / 8 : (x - 8) / 8 + 0.3);
    }, '#5a4228');
  // blood crystal standing in the spine
  s.area((x, y) => inB(y, 1, 8) && (x === 7 || x === 8) && !(y === 1 && x === 8), (x, y) => x === 7 ? (y < 4 ? '#ff7a8a' : '#c0304e') : (y < 5 ? '#a0204a' : '#6a0e34'), '#3a0620');
  // bone claws on both sides
  for (const side of [0, 1]) {
    const pts = side === 0 ? [[2, 4], [1, 5], [1, 7], [1, 9], [2, 10]] : [[13, 4], [14, 5], [14, 7], [14, 9], [13, 10]];
    pts.forEach(([x, y], i) => s.put(x, y, i % 2 === 0 ? C.ivory[0] : C.ivory[1], C.ivoryK));
    const tips = side === 0 ? [[0, 3], [0, 6], [0, 8]] : [[15, 3], [15, 6], [15, 8]];
    tips.forEach(([x, y]) => s.put(x, y, C.ivory[2], C.ivoryK));
    s.put(side === 0 ? 2 : 13, 11, '#8a2a3a', '#3a0a14');
  }
  return s.outline();
};

W.dirge_flute = () => {
  const s = Sprite();
  s.diag((S, t) => inB(t, -11, 11) && inB(S, 14, 16) && !((t === -11 || t === 11) && S === 15) && !(t === 10 && S === 16) && !(t === -10 && S === 14),
    (S, t) => (([-3, 3].includes(t) && S === 15) || ([-4, 2].includes(t) && S === 14)) ? '#4a2418' : across(C.bone, S, 14, 16, Math.abs(t) > 8 ? 0.1 : 0), C.boneK);
  return s.outline();
};

W.danse_macabre = () => {
  const s = Sprite();
  const cx = 3.5, cy = 12.5;
  s.area((x, y) => { const dx = x + 0.5 - cx, dy = cy - (y + 0.5), r = Math.hypot(dx, dy), a = Math.atan2(dy, dx) * 180 / Math.PI; return r > 1.4 && r < 12.2 && inB(a, -8, 98); },
    (x, y) => {
      const dx = x + 0.5 - cx, dy = cy - (y + 0.5), r = Math.hypot(dx, dy), a = Math.atan2(dy, dx) * 180 / Math.PI;
      if (r > 11.2) return C.magenta[1];
      const k = Math.floor((a + 8) / 13.25), f = ((a + 8) / 13.25) - k;
      if (f < 0.12 && r < 11.2) return C.magenta[2];
      return R(C.fan, k % 2 === 0 ? (r < 6 ? 0.33 : 0) : (r < 6 ? 0.66 : 0.33));
    }, C.fanK);
  s.area((x, y) => Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= 1.6, () => '#e04a8a', C.magentaK);
  s.put(2, 14, '#e04a8a', C.magentaK).put(1, 15, '#a01e5a', C.magentaK).put(3, 15, '#a01e5a', C.magentaK);
  return s.outline();
};

// ================================================================== Silent
W.poison_flask = () => {
  const s = Sprite();
  const cx = 7.5, cy = 10.0, r = 4.7;
  s.area((x, y) => Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < r, (x, y) => {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
    if (y < 9) return (dx < -1 && dy < -1.5) ? C.glass[0] : C.glass[1];
    return R(C.slime, clamp((dx + dy) / 7 + 0.35, 0, 1) * 0.9 + (y === 9 ? -0.3 : 0));
  }, C.glassK);
  s.put(5, 8, '#ffffff', C.glassK);
  s.area((x, y) => inB(x, 6, 9) && inB(y, 3, 5), (x, y) => y === 3 ? C.iron[1] : R(C.glass, x < 8 ? 0.5 : 1), C.glassK);
  s.area((x, y) => inB(x, 6, 9) && inB(y, 0, 2) && !(y === 0 && (x === 6 || x === 9)), (x) => R(C.wood, x === 6 ? 1 / 3 : x === 9 ? 1 : 2 / 3), C.woodK);
  s.area((x, y) => inB(x, 12, 14) && inB(y, 7, 10), (x, y) => x === 13 && y === 8 ? '#3a2a1a' : (x === 14 ? '#c8a878' : '#ead2a0'), '#5a4228');
  s.put(11, 6, '#8a6a40', '#3a2a14').put(12, 6, '#8a6a40', '#3a2a14');
  return s.outline();
};

/** Shared straight dagger: steel blade, guard, grip, pommel; {@code extra(s)} adds the coating. */
function dagger(guard, grip, extra, guardK) {
  const s = Sprite();
  s.diag((S, t) => inB(t, 0, 10) && inB(S, 14, 16) && !(t >= 8 && S !== 15), (S, t) => S === 14 ? C.steel[0] : S === 15 ? C.steel[t > 7 ? 1 : 2] : C.steel[3], C.steelK);
  s.diag((S, t) => t === 11 && S === 15, () => C.steel[1], C.steelK);
  s.diag((S, t) => t === -1 && inB(S, 12, 18) || t === -2 && inB(S, 13, 17), (S) => across(guard, S, 12, 18), guardK);
  s.diag((S, t) => inB(t, -10, -3) && inB(S, 15, 16), (S, t) => t % 3 === 0 ? grip[grip.length - 1] : R(grip, S === 15 ? 0 : 0.5), grip.k);
  s.diag((S, t) => inB(t, -13, -11) && inB(S, 14, 16) && !(t === -13 && S !== 15), (S) => across(guard, S, 14, 16), guardK);
  extra(s);
  return s.outline();
}
const goldGuard = ['#fff0a0', '#e8b840', '#a87420'];
const silverGuard = ['#ffffff', '#c8ccd0', '#868c92'];
const grip = (ramp, k) => Object.assign(ramp.slice(), { k });

W.poisoned_dagger = () => dagger(goldGuard, grip(C.olive, C.oliveK), s => {
  s.diag((S, t) => inB(t, 2, 9) && S === 16 || (inB(t, 3, 7) && S === 15 && t % 2 === 1), (S, t) => R(C.slime, S === 15 ? 0 : 0.33), C.slimeK);
  s.put(8, 8, C.slime[1], C.slimeK).put(8, 9, C.slime[2], C.slimeK).put(11, 6, C.slime[1], C.slimeK).put(11, 7, C.slime[2], C.slimeK).put(11, 8, C.slime[3], C.slimeK);
}, C.goldK);

W.ink_dagger = () => dagger(silverGuard, grip(C.inkGrip, C.inkGripK), s => {
  s.diag((S, t) => (inB(t, 2, 7) && S === 16) || (t === 5 && S === 15), (S) => R(C.ink, S === 15 ? 0 : 0.33), C.inkK);
  for (const [x, y] of [[13, 7], [5, 5], [11, 10]]) s.put(x, y, C.ink[0], C.inkK);
}, '#2e3236');

W.throwing_knife = () => {
  const s = Sprite();
  const half = t => t < 0 ? -1 : t <= 4 ? 1 + Math.floor(t / 3) : t <= 9 ? 1 : 0;
  s.diag((S, t) => inB(t, 0, 13) && Math.abs(S - 15) <= half(t), (S, t) => S < 15 ? C.steel[0] : S === 15 ? C.steel[t > 9 ? 1 : 2] : C.steel[3], '#8a1a10');
  s.diag((S, t) => inB(t, -8, -1) && inB(S, 15, 16), (S, t) => t % 2 === 0 ? C.gun[2] : R(C.gun, S === 15 ? 0 : 1), C.gunK);
  const rx = 2.5, ry = 12.5;
  s.area((x, y) => { const d = Math.hypot(x + 0.5 - rx, y + 0.5 - ry); return d > 0.7 && d < 2.2; }, (x, y) => x + y < 15 ? C.gun[0] : C.gun[1], C.gunK);
  return s.outline();
};

W.slingshot = () => {
  const s = Sprite();
  // handle (lower-left), leather wrap
  s.diag((S, t) => inB(t, -15, -6) && inB(S, 15, 16), (S, t) => inB(t, -12, -9) ? R(C.leather, S === 15 ? 0.33 : 0.66) : R(C.wood, S === 15 ? 1 / 3 : 2 / 3), C.woodK);
  // fork arms: one up, one to the right, opening toward the top-right
  for (let y = 3; y <= 9; y++) { s.put(4, y, y === 3 ? '#8ac850' : C.wood[0], C.woodK); s.put(5, y, y === 3 ? '#4e8a28' : C.wood[2], C.woodK); }
  for (let x = 6; x <= 12; x++) { s.put(x, 10, x === 12 ? '#8ac850' : C.wood[1], C.woodK); s.put(x, 11, x === 12 ? '#4e8a28' : C.wood[3], C.woodK); }
  s.put(5, 10, C.wood[1], C.woodK);
  s.put(4, 2, C.steel[1], C.steelK).put(3, 1, C.steel[0], C.steelK).put(13, 10, C.steel[2], C.steelK).put(14, 11, C.steel[1], C.steelK);
  // rubber band with the pouch
  s.line([[6, 4], [8, 6]], () => '#7a4422', C.leatherK).line([[10, 8], [11, 9]], () => '#7a4422', C.leatherK);
  s.put(9, 6, '#4a2410', C.leatherK).put(9, 7, '#5a2e14', C.leatherK).put(8, 7, '#3a1a0a', C.leatherK);
  return s.outline();
};

W.snakebite = () => {
  const s = Sprite();
  const centre = t => 15 + Math.round(Math.sin(t * 0.85) * 1.2);
  s.diag((S, t) => inB(t, -1, 12) && Math.abs(S - centre(t)) <= (t > 10 ? 0 : 1), (S, t) => R(C.kris, clamp((S - centre(t) + 1) / 2, 0, 1) * 0.75 + (t > 9 ? -0.1 : 0)), C.krisK);
  s.diag((S, t) => t === 13 && S === 15, () => C.kris[1], C.krisK);
  s.diag((S, t) => (t === -2 || t === -3) && inB(S, 13, 17), (S) => across(silverGuard, S, 13, 17), '#2e3236');
  s.diag((S, t) => inB(t, -11, -4) && inB(S, 15, 16), (S, t) => t % 3 === 0 ? C.inkGrip[2] : R(C.inkGrip, S === 15 ? 0 : 0.5), C.inkGripK);
  s.diag((S, t) => inB(t, -14, -12) && inB(S, 14, 16) && !(t === -14 && S !== 15), (S) => across(silverGuard, S, 14, 16), '#2e3236');
  return s.outline();
};

// ================================================================== Ironclad
W.cleaver = () => {
  const s = Sprite();
  s.diag((S, t) => inB(t, 0, 11) && inB(S, 13, 17) && S >= 13 + Math.max(0, t - 7) && !(t === 5 && S === 17),
    (S, t) => (S + t * 3) % 7 === 0 && S > 13 ? C.rawIron[3] : S === 17 ? C.rawIron[4] : across(C.rawIron, S, 13, 17, -0.1), C.rawIronK);
  s.diag((S, t) => inB(t, -2, -1) && inB(S, 12, 18), (S) => across(goldGuard, S, 12, 18), C.goldK);
  s.diag((S, t) => inB(t, -11, -3) && inB(S, 15, 16), (S, t) => t % 2 === 0 ? C.leather[3] : R(C.leather, S === 15 ? 0.33 : 0.66), C.leatherK);
  s.diag((S, t) => inB(t, -14, -12) && inB(S, 14, 16) && !(t === -14 && S !== 15), (S) => across(goldGuard, S, 14, 16), C.goldK);
  return s.outline();
};

W.morning_star = () => {
  const s = Sprite();
  s.diag((S, t) => inB(t, -15, -8) && inB(S, 15, 16), (S, t) => t <= -14 ? C.iron[2] : t % 2 === 0 ? C.leather[3] : R(C.leather, S === 15 ? 0.33 : 0.66), C.leatherK);
  s.line([[4, 10], [4, 7], [5, 4], [7, 2], [9, 2], [11, 3], [11, 5]], i => i % 2 ? C.iron[1] : C.iron[3], C.ironK);
  const cx = 11.0, cy = 9.5;
  s.area((x, y) => Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < 3.2, (x, y) => R(C.iron, clamp((x + y - 16) / 7 + 0.45, 0, 1)), C.ironK);
  for (const [x, y] of [[11, 5], [15, 9], [11, 13], [7, 9], [14, 6], [14, 12], [8, 12]]) s.put(x, y, C.iron[2], C.ironK);
  s.put(10, 8, C.iron[0], C.ironK);
  return s.outline();
};

W.infernal_blade = () => {
  const s = Sprite();
  s.diag((S, t) => inB(t, 0, 12) && inB(S, 13, 17) && !(t > 8 && Math.abs(S - 15) > 1) && !(t > 10 && S !== 15) && !((S === 13 || S === 17) && t % 3 === 0),
    (S, t) => Math.abs(S - 15) <= (t < 9 ? 0 : 0) ? R(C.hell, t > 9 ? 0 : 0.33) : Math.abs(S - 15) === 1 ? (t % 2 ? C.hell[2] : C.hellIron[0]) : C.hellIron[S < 15 ? 0 : 2], C.hellK);
  s.diag((S, t) => t === 13 && S === 15, () => C.hell[1], C.hellK);
  s.diag((S, t) => inB(t, -3, -1) && inB(S, 12, 18), (S, t) => (t === -2 && (S === 14 || S === 16)) ? '#ff8a20' : across(C.skull, S, 12, 18), C.skullK);
  s.diag((S, t) => (inB(t, -1, 1) && (S === 11 || S === 19)) || (t === 2 && (S === 10 || S === 20)), (S, t) => t >= 1 ? C.violet[0] : C.violet[1], C.violetK);
  s.diag((S, t) => inB(t, -11, -4) && inB(S, 15, 16), (S, t) => t % 3 === 0 ? C.violet[2] : R(C.violet, S === 15 ? 0 : 0.5), C.violetK);
  s.diag((S, t) => inB(t, -14, -12) && inB(S, 14, 16) && !(t === -14 && S !== 15), (S) => across(C.iron, S, 14, 16), C.ironK);
  return s.outline();
};

W.tank_shield = () => {
  const s = Sprite();
  const inside = (x, y) => { const px = x + 0.5; if (y < 1 || y > 14) return false; if (y <= 9) return px > 2 && px < 14; const w = (14.5 - y) / 5.5 * 5.5; return Math.abs(px - 8) < w; };
  s.area(inside, (x, y) => {
    const rim = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
    if (rim) return R(C.iron, x + y < 14 ? 0.25 : 0.6);
    if (x - y === 1 || x - y === 2 || (x + y === 15 && inB(x, 5, 10))) return C.gold[0];   // shine streak + star cross
    return R(C.gold, clamp((x + y - 6) / 18 + 0.15, 0, 1));
  }, C.ironK);
  for (const [x, y] of [[3, 2], [12, 2], [3, 9], [12, 9]]) s.put(x, y, C.iron[3], C.ironK);
  return s.outline();
};

W.bloodletting_dagger = () => dagger(goldGuard, grip(C.leather, C.leatherK), s => {
  s.diag((S, t) => inB(t, 5, 11) && (S === 16 || (S === 15 && t > 7)), (S) => S === 15 ? '#e83a2a' : '#a81010', '#4a0404');
  s.put(10, 4, '#e83a2a', '#4a0404').put(9, 6, '#c81818', '#4a0404');
  s.put(14, 2, '#c81818', '#4a0404').put(14, 3, '#8a0808', '#4a0404');
}, C.goldK);

W.bludgeon = () => {
  const s = Sprite();
  s.diag((S, t) => inB(t, -15, 2) && inB(S, 15, 16), (S, t) => t <= -14 ? C.iron[2] : inB(t, 1, 2) ? goldGuard[S === 15 ? 0 : 1] : t % 2 === 0 ? C.leather[3] : R(C.leather, S === 15 ? 0.33 : 0.66), C.leatherK);
  s.diag((S, t) => inB(t, 3, 10) && inB(S, 9, 21) && !((S === 9 || S === 21) && (t === 3 || t === 10)), (S, t) => {
    if (S >= 20) return C.rawIron[t > 6 ? 1 : 2];                                               // lit striking face
    return R(C.rawIron, clamp((S - 9) / 12 + (t === 10 ? -0.25 : t === 3 ? 0.25 : 0) + ((S * 7 + t * 5) % 11 === 0 ? 0.25 : 0), 0, 1));
  }, C.rawIronK);
  return s.outline();
};

// ================================================================== Defect
W.rocket_punch = () => {
  const s = Sprite();
  s.diag((S, t) => inB(t, -13, 2) && inB(S, 12, 18) && !((S === 12 || S === 18) && (t === -13 || t === 2)), (S, t) => {
    if (inB(t, -11, -9) && inB(S, 14, 16)) return R(C.cyan, S === 15 && t === -10 ? 0 : 0.4);          // thruster port
    if (S <= 13) return R(C.brass, t % 4 === 0 ? 0.33 : 0);                                         // brass plating on top
    return R(C.gun, clamp((S - 14) / 4, 0, 1));
  }, C.gunK);
  s.diag((S, t) => inB(t, 3, 9) && inB(S, 12, 18) && !((S === 12 || S === 18) && t === 9), (S, t) => (t === 6 || t === 8) && S > 12 && S < 18 ? C.brass[2] : across(C.brass, S, 12, 18, -0.1), '#b01818');
  return s.outline();
};

W.energy_core = () => {
  const s = Sprite();
  const cx = 8, cy = 8.3, r = 6.2;
  const crack = (x, y) => [[8, 5], [7, 6], [7, 7], [8, 8], [9, 8], [10, 9], [6, 8], [5, 9], [8, 9], [8, 10], [11, 10]].some(([a, b]) => a === x && b === y);
  s.area((x, y) => Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < r, (x, y) => {
    if (crack(x, y)) return C.cyan[4];
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
    if (Math.hypot(dx + 2.4, dy + 2.4) < 1.2) return C.cyan[0];
    return R(C.cyan, clamp((dx + dy) / (2 * r) + 0.45, 0.1, 0.9));
  }, C.cyanK);
  s.area((x, y) => (y <= 2 && inB(x, 6, 9)) || (y >= 13 && inB(x, 2, 4)) || (y >= 13 && inB(x, 11, 13)), (x, y) => C.brass[y <= 2 ? (y === 1 ? 0 : 1) : 2], C.brassK);
  return s.outline();
};

W.flak_cannon = () => {
  const s = Sprite();
  s.diag((S, t) => inB(t, -13, 0) && inB(S, 11, 19) && !((S === 11 || S === 19) && (t === -13 || t === 0)), (S, t) => {
    if (S >= 17) return R(C.gun, 0.6);
    if (t === -6 && S < 17) return C.gun[2];
    return across(C.brass, S, 11, 17, -0.1);
  }, C.brassK);
  for (const [c0, c1] of [[11, 12], [14, 15], [17, 18]]) {
    s.diag((S, t) => inB(t, 1, 10) && inB(S, c0, c1), (S, t) => t >= 9 ? C.cyan[t === 10 ? 1 : 2] : t === 4 ? C.brass[1] : C.gun[S === c0 ? 0 : 1], C.gunK);
  }
  return s.outline();
};

W.tesla_coil = () => {
  const s = Sprite();
  s.area((x, y) => inB(y, 13, 15) && inB(x, 2 + (15 - y === 2 ? 1 : 0), 13 - (15 - y === 2 ? 1 : 0)), (x, y) => (x <= 3 || x >= 12) ? C.brass[1] : R(C.gun, y === 13 ? 0 : 0.5), C.gunK);
  s.area((x, y) => inB(y, 4, 12) && inB(x, 7, 8), (x) => C.gun[x === 7 ? 0 : 2], C.gunK);
  for (const y of [7, 9, 11]) s.area((x, yy) => yy === y && inB(x, 4, 11), (x) => R(C.cyan, x < 7 ? 0.25 : 0.6), C.cyanK);
  s.area((x, y) => y === 5 && inB(x, 3, 12), (x) => R(C.brass, x < 7 ? 0 : 0.5), C.brassK);
  s.area((x, y) => Math.hypot(x + 0.5 - 8, y + 0.5 - 2.2) < 1.8, (x, y) => x < 8 && y < 2 ? '#ffffff' : '#7ac8f0', '#1a4a6a');
  for (const [x, y] of [[4, 2], [3, 3], [2, 2], [1, 4], [11, 2], [12, 3], [13, 2], [14, 4]]) s.put(x, y, x === 1 || x === 14 ? '#7a3ad8' : '#c08aff', 'none');
  return s.outline();
};

W.shadow_shield = () => {
  const s = Sprite();
  const cx = 10.2, cy = 5.8, r = 4.8;
  // light cone from the lens to the disc
  s.area((x, y) => { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); return d >= r && x >= 4 && y <= 11 && (x - 4) * 0.9 + (11 - y) * 0.9 > 0 && Math.abs((x - 4) - (11 - y)) < 2 + (x - 4) * 0.45; }, () => '#d8c2f6', 'none');
  s.area((x, y) => Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < r, (x, y) => {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    const swirl = Math.sin(a * 2 + d * 1.3);
    if (d < 1.2) return C.shadow[1];
    return R(C.shadow, clamp(0.55 + swirl * 0.25 + (d > r - 1 ? 0.2 : 0), 0, 1));
  }, C.shadowK);
  s.area((x, y) => inB(x, 1, 5) && inB(y, 10, 13), (x, y) => (x === 5 && inB(y, 11, 12)) ? C.cyan[1] : y === 10 ? C.brass[0] : R(C.brass, (x - 1) / 4 * 0.8), C.brassK);
  s.area((x, y) => y >= 14 && inB(x, 2, 4), () => C.gun[1], C.gunK);
  return s.outline();
};

W.lightning_rod = () => {
  const s = Sprite();
  const cx = 7.6, cy = 8.4;
  s.area((x, y) => { const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx); return d < 5.4 + (Math.cos(a * 7) > 0.6 ? 1.2 : 0); },
    (x, y) => {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d < 1.3) return '#ffffff';
      if (d > 5.4) return C.spark[1];
      return R(C.spark, [1.4, 2.6, 3.8, 4.8].some(v => Math.abs(d - v) < 0.45) ? 0.75 : clamp((x + y - 8) / 16 + 0.15, 0, 0.5));
    }, C.sparkK);
  s.line([[9, 7], [12, 4], [14, 2], [15, 1]], i => i < 3 ? C.steel[2] : C.steel[0], C.steelK);
  return s.outline();
};

// ------------------------------------------------------------------ output
const toImg = sp => {
  const d = new Uint8Array(256 * 4);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const c = sp.c[y][x]; if (!c) continue; d.set([...hex(c[0]), 255], (y * 16 + x) * 4); }
  return { w: 16, h: 16, d };
};
const outDir = process.argv[2];
const names = Object.keys(W);
const imgs = names.map(n => toImg(W[n]()));
if (outDir) names.forEach((n, i) => writePng(outDir + '/' + n + '.png', imgs[i]));
if (process.argv[3]) {
  const S = 8, cols = 7, cell = 16 * S + 8;
  const sheet = { w: cols * cell, h: Math.ceil(names.length / cols) * cell, d: null };
  sheet.d = new Uint8Array(sheet.w * sheet.h * 4);
  for (let i = 0; i < sheet.w * sheet.h; i++) sheet.d.set([139, 139, 139, 255], i * 4);   // vanilla inventory grey
  imgs.forEach((img, i) => {
    const ox = (i % cols) * cell + 4, oy = Math.floor(i / cols) * cell + 4;
    for (let y = 0; y < 16 * S; y++) for (let x = 0; x < 16 * S; x++) {
      const p = (Math.floor(y / S) * 16 + Math.floor(x / S)) * 4;
      if (img.d[p + 3]) sheet.d.set(img.d.subarray(p, p + 4), ((oy + y) * sheet.w + ox + x) * 4);
    }
  });
  writePng(process.argv[3], sheet);
}
console.log(names.map((n, i) => i + ':' + n).join(' '));
