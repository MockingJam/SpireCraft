// Phase 8 batch 2 (the Underdocks), model v6 (user 2026-11-18: more detail, bigger bosses, livelier, richer
// textures; read the real animal behind each one, not only the one STS2 render). Overrides the v5 entries in specs.js.
// Real-world references used alongside the renders:
//   Corpse Slug - a nudibranch: the foot is a flat sole wider than the body; the front rises into a head with two
//     rhinophores (club-tipped horns) and a fringe of oral tentacles; bright side bands run the length; the back tapers.
//   Toadpole - a tadpole: a round head-body with the eyes set wide on the sides, the gut a darker mass underneath, a
//     muscular tail root and a tall see-through fin top and bottom.
//   Two-Tailed Rat - a rat standing up: a hunched back, the head carried low on a short neck, a long tapering snout
//     with whiskers, round ears, bare pink hands and feet, a scaly tail (here forked at the tip).
//   Seapunk - a clump of kelp: a holdfast at the bottom, broad ragged fronds hanging round a body of tangled blades,
//     long stipes with float bladders and leaf tips springing from the top.
//   Terror Eel - a moray: a long blunt head with a wide mouth and needle teeth, a dorsal fin running down the back,
//     smooth skin with a pale belly; the tail flattens into a fin.
//   Soul Fysh - an ocean sunfish (Mola): a tall flat disc of a body, no real tail but a scalloped clavus, long dorsal
//     and anal fins, small pectoral fins, a small round mouth with thick lips.
// Same conventions as specs.js (pixels, y up, ground 0, front -Z).
const R = (...ramp) => ({ ramp });
const withPattern = (m, pattern) => ({ ...m, pattern });
const glowing = m => ({ ...m, emissive: true });
const h2 = (x, y, s) => (((x * 73856093) ^ (y * 19349663) ^ (s * 83492791)) >>> 0) % 97;
const hash = (x, s) => ((x * 37 + s * 11) % 7 + 7) % 7;
const ragged = (depth, seedN = 1) => (f, x, y, w, h) => y < h - (hash(x, seedN) % (depth + 1));
const leafMask = (face, x, y, w, h) => { const cx = (w - 1) / 2, t = y / Math.max(1, h - 1); const half = Math.sin(Math.PI * Math.min(1, t * 1.05 + 0.05)) * w / 2; return Math.abs(x - cx) <= half + 0.2; };
const sides = fn => Object.fromEntries(['east', 'west'].map(f => [f, (x, y, w, h) => fn(f === 'east' ? x : w - 1 - x, y, w, h, f)]));

// ---- palettes (hue-shifted: highlights warmer/lighter, shadows cooler/more saturated)
const slugBlue = R('#9ed0f0', '#74b4e2', '#5498d0', '#3e7cb8', '#2e6298', '#224a78');
const slugGold = R('#fff0a0', '#f4d070', '#e0b050', '#c08c38');
const slugFoot = R('#f4ead0', '#e2d4b0', '#c8b890', '#a89a74');
const frill = R('#fff2f0', '#f8d0cc', '#eca8a4', '#d4807c');
const tadSkin = { ramp: ['#b8f0e0', '#90dccb', '#6cc4b2', '#50a898', '#3a8a7e', '#2a6c64'], alpha: 230 };
const tadFin = { ramp: ['#e0fff6', '#c0f0e2', '#a0dccc'], alpha: 120 };
const ratFur = R('#c8bcc6', '#aa9eac', '#8e8294', '#74687c', '#5c5266', '#463e52');
const ratPink = R('#fcd6cc', '#f0b4a8', '#dc9488', '#bc7468');
const kelp = R('#c4ec7c', '#a2d860', '#82bc48', '#649e38', '#4a7e2a', '#36601e');
const kelpDark = R('#82bc48', '#649e38', '#4a7e2a', '#36601e', '#264616');
const stipe = R('#a8d070', '#86b454', '#66963e');
const mouthDark = '#3a1a10';
const eelBlue = R('#a4c0dc', '#84a2c4', '#6886aa', '#526e90', '#3e5676', '#2c405c');
const eelBelly = R('#f0ead8', '#dcd2bc', '#c0b49c');
const eelFin = R('#ffc060', '#f8a040', '#e08030', '#b86020');
const fyshBody = { ramp: ['#d0fff6', '#a8f0e4', '#80dccf', '#5cc2b6', '#40a49c', '#2c8682'], alpha: 150 };
const fyshFin = { ramp: ['#d8fff8', '#b0f0e6', '#88dcd0'], alpha: 125 };
const fyshLip = { ramp: ['#bff0e6', '#96d8cc', '#70bcb0'], alpha: 230 };

// ---- textures
/** Nudibranch skin: the two gold side bands and a gold line down the back, the blue darkening into the folds. */
const slugSkin = (f, x, y, w, h) => {
  if (f === 'up') return x === Math.floor(w / 2) || x === Math.floor(w / 2) - 1 ? (y % 3 === 0 ? '#e0b050' : '#f4d070') : (h2(x, y, 3) < 6 ? -0.6 : 0);
  if (f === 'east' || f === 'west') return y === Math.round(h * 0.45) || y === Math.round(h * 0.45) + 1 ? (x % 5 === 0 ? '#c08c38' : '#f4d070') : y === h - 1 ? '#f4ead0' : (h2(x, y, 5) < 5 ? -0.7 : 0);
  return 0;
};
/** Fur in strands: alternating light and dark columns, fringe of lighter tips, a few deep partings. */
const fur = (f, x, y, w, h) => (f === 'up' || f === 'down') ? (x % 2 ? 0.3 : -0.3) + (h2(x, y, 9) < 8 ? 0.8 : 0)
  : (x % 2 ? 0.35 : -0.3) + (y % (3 + hash(x, 5) % 3) === 0 ? -0.6 : 0) + (hash(x, 2) === 0 ? 0.9 : 0);
/** Kelp blades: long vertical blades with a lit midrib and darker edges, a little wrinkling. */
const blades = (f, x, y) => { const c = x % 3; return (c === 1 ? -0.8 : c === 0 ? 0.4 : 0.7) + ((x + y * 2) % 7 === 0 ? 0.6 : 0); };
/** Eel skin: smooth with a faint mottling, the lateral line, and red eyes with white rims scattered on the back. */
const eelEyes = seed => (f, x, y, w, h) => {
  if (f === 'down') return 0;
  const cx = Math.floor(x / 4), cy = Math.floor(y / 4), ex = x % 4, ey = y % 4;
  if (h2(cx, cy, seed) < 34 && (f === 'up' || y < h - 2)) {
    if ((ex === 1 || ex === 2) && (ey === 1 || ey === 2)) return ex === 1 && ey === 1 ? '#fff4ec' : '#c82c2c';
    if (ex === 0 && ey > 0 && ey < 3 || ex === 3 && ey > 0 && ey < 3 || ey === 0 && ex > 0 && ex < 3 || ey === 3 && ex > 0 && ex < 3) return '#f4e8e0';
  }
  return (f === 'east' || f === 'west') && y === h - 2 ? -0.6 : (h2(x, y, seed + 1) < 7 ? 0.6 : 0);
};

module.exports = {
  // ------------------------------------------------------------ Corpse Slug
  corpse_slug: {
    render: 'cutout',
    bones: [
      { name: 'body', pivot: [0, 2, 0], cubes: [
        // the sole: a pale fringe wider than the body
        { from: [-4.5, 0, -7], size: [9, 1, 17], mat: withPattern(slugFoot, (f, x, y) => (f === 'up' && (x === 0 || x === 8) && y % 2 === 0 ? 1 : 0)) },
        { from: [-3.5, 1, -6], size: [7, 5, 9], mat: withPattern(slugBlue, slugSkin) },
      ] },
      { name: 'tail', parent: 'body', pivot: [0, 1, 3], rot: [6, 0, 0], cubes: [
        { from: [-3, 1, 3], size: [6, 3, 5], mat: withPattern(slugBlue, slugSkin) },
        { from: [-2, 1, 8], size: [4, 2, 3], mat: withPattern(slugBlue, slugSkin) },
        { from: [-1, 1, 11], size: [2, 1, 2], mat: slugBlue },
      ] },
      // the raised front: the head sits on a neck that leans back
      { name: 'head', parent: 'body', pivot: [0, 5, -4], rot: [-22, 0, 0], cubes: [
        { from: [-3.5, 4, -8], size: [7, 7, 5], mat: withPattern(slugBlue, slugSkin) },
        // the oral tentacles: a frill of pink-white fingers across the front
        { from: [-4, 3, -8.6], size: [8, 7, 0], mat: withPattern(frill, (f, x, y) => (x % 2 ? -0.5 : 0.6) + (y === 0 ? 1 : 0)),
          mask: (f, x, y, w, h) => (x % 2 === 0 ? y < h - (hash(x, 3) % 3) : y >= 2 && y < h - 1) },
        { from: [-1.5, 5, -8.8], size: [3, 2, 0], mat: R('#5a2830', '#3a1620') },   // the mouth behind the fringe
      ] },
      // rhinophores: two club-tipped horns
      ...[['antenna_l', -1.5, 15], ['antenna_r', 1.5, -15]].map(([n, x, rz]) => ({ name: n, parent: 'head', pivot: [x, 11, -5], rot: [-15, 0, rz], cubes: [
        { from: [x - 0.5, 11, -5.5], size: [1, 3, 1], mat: slugBlue },
        { from: [x - 1, 14, -6], size: [2, 2, 2], mat: withPattern(slugGold, (f, px, y) => (y % 2 ? 0.6 : -0.4)) } ] })),
    ],
  },

  // ------------------------------------------------------------ Toadpole
  toadpole: {
    render: 'translucent',
    bones: [
      { name: 'body', pivot: [0, 6, -3], cubes: [
        // the round head-body (corners cut), the gut darker below
        { from: [-4, 3, -9], size: [8, 7, 9], mat: withPattern(tadSkin, (f, x, y, w, h) => (f === 'up' && (x === 3 || x === 4) && y % 2 ? '#20403a' : f === 'down' ? 1.2 : 0)),
          detail: sides((x, y, w, h) => {   // the big orange eye, wide on each side, a dark slit pupil and a glint
            const ex = 2, ey = 1;
            if (x >= ex && x <= ex + 2 && y >= ey && y <= ey + 2) return x === ex + 1 && (y === ey + 1 || y === ey + 2) ? '#1a1008' : x === ex && y === ey ? '#ffd8a0' : '#f08a20';
            if ((x === ex - 1 || x === ex + 3) && y >= ey && y <= ey + 2) return '#c86010';
            return null; }) },
        { from: [-3, 2, -8], size: [6, 1, 7], mat: tadSkin },
        { from: [-3, 10, -8], size: [6, 1, 7], mat: tadSkin },
      ] },
      { name: 'tail', parent: 'body', pivot: [0, 6, 0], cubes: [
        { from: [-2, 4, 0], size: [4, 4, 5], mat: withPattern(tadSkin, (f, x, y) => (f === 'up' && x % 2 && y % 2 ? '#20403a' : 0)) },
        { from: [0, 2, 0], size: [0, 9, 8], mat: tadFin, mask: (f, x, y, w, h) => Math.abs(y - (h - 1) / 2) <= (h / 2) * (1 - x / (w + 6)) + 0.2 } ] },
      { name: 'tail_tip', parent: 'tail', pivot: [0, 6, 5], cubes: [
        { from: [-1, 5, 5], size: [2, 2, 5], mat: tadSkin },
        { from: [0, 2.5, 8], size: [0, 8, 9], mat: tadFin, mask: (f, x, y, w, h) => Math.abs(y - (h - 1) / 2) <= (h / 2) * (1 - x / (w + 1)) + 0.2 } ] },
    ],
  },

  // ------------------------------------------------------------ Two-Tailed Rat
  two_tailed_rat: {
    render: 'cutout',
    bones: [
      { name: 'body', pivot: [0, 10, 1], rot: [32, 0, 0], cubes: [
        { from: [-4.5, 7, -3], size: [9, 11, 8], mat: withPattern(ratFur, fur) },
        { from: [-5, 9, 5], size: [10, 9, 0], mat: withPattern(ratFur, fur), mask: ragged(2, 3) },   // the shaggy back
        { from: [-5, 18, -3], size: [10, 0, 8], mat: withPattern(ratFur, fur), mask: (f, x, y) => (x + y) % 3 !== 0 },
      ] },
      { name: 'head', parent: 'body', pivot: [0, 17, -2], rot: [55, 0, 0], cubes: [
        { from: [-2.5, 15, -6], size: [5, 5, 5], mat: withPattern(ratFur, fur),
          detail: sides((x, y) => (y === 2 && x === 1 ? '#f8f8ff' : y === 2 && x === 2 ? '#202028' : null)) },
        // the long snout, tapering, a pink nose and whiskers
        { from: [-1.5, 15.5, -10], size: [3, 3, 4], mat: withPattern(ratFur, fur) },
        { from: [-1, 15.5, -12], size: [2, 2, 2], mat: R('#b8acb8', '#9a8e9c') },
        { from: [-0.5, 16, -13], size: [1, 1, 1], mat: ratPink },
        { from: [-3, 15.5, -11.5], size: [6, 2, 0], mat: R('#f0f0f0', '#d0d0d0'), mask: (f, x, y) => (x === 0 || x === 5) && y !== 1 || (x === 1 || x === 4) && y === 1 },
        // round ears
        { from: [-3.5, 19, -4], size: [2, 3, 1], mat: ratPink }, { from: [1.5, 19, -4], size: [2, 3, 1], mat: ratPink },
      ] },
      ...[['arm_l', -3], ['arm_r', 3]].map(([n, x]) => ({ name: n, parent: 'body', pivot: [x, 15, -2], rot: [-55, 0, 0], cubes: [
        { from: [x - 0.5, 9, -2.5], size: [1, 6, 1], mat: ratPink },
        { from: [x - 1, 8, -3], size: [2, 1, 2], mat: ratPink } ] })),
      ...[['leg_l', -2.5], ['leg_r', 2.5]].flatMap(([n, x]) => [
        { name: n, parent: 'body', pivot: [x, 9, 2], rot: [-32, 0, 0], cubes: [
          { from: [x - 1.5, 4, -0.5], size: [3, 6, 5], mat: withPattern(ratFur, fur) } ] },
        { name: n + '_shin', parent: n, pivot: [x, 4, 2], rot: [45, 0, 0], cubes: [
          { from: [x - 0.5, -1, 1.5], size: [1, 5, 1], mat: ratPink },
          { from: [x - 1, -1.5, -2], size: [2, 1, 4], mat: ratPink } ] },
      ]),
      { name: 'tail', parent: 'body', pivot: [0, 8, 4], rot: [-65, 0, 0], cubes: [
        { from: [-0.5, 7.5, 4], size: [1, 1, 15], mat: withPattern(ratPink, (f, x, y) => (y % 2 ? 0.6 : 0)) },
        { from: [-2, 7.5, 18], size: [1, 1, 4], mat: ratPink }, { from: [1, 7.5, 18], size: [1, 1, 4], mat: ratPink },
        { from: [-1.5, 7.5, 18], size: [3, 1, 1], mat: ratPink },
      ] },
    ],
  },

  // ------------------------------------------------------------ Seapunk
  seapunk: {
    render: 'cutout',
    bones: [
      { name: 'body', pivot: [0, 4, 0], cubes: [
        { from: [-2.5, 0, -2.5], size: [5, 1, 5], mat: R('#7a6a3a', '#5e5028', '#463c1c') },   // the holdfast
        { from: [-5, 1, -4.5], size: [10, 8, 9], mat: withPattern(kelp, blades),
          detail: { north: (x, y, w, h) => (y >= 2 && y <= 6 && x >= 2 && x <= w - 3 ? (y === 2 || x === 2 || x === w - 3 ? '#6a3a20' : mouthDark) : null) } },
        // a skirt of broad ragged fronds hanging round it (the mouth left open)
        { from: [-5.5, 0, -5], size: [11, 9, 0], mat: withPattern(kelpDark, blades), mask: (f, x, y, w, h) => !(y >= 2 && y <= 6 && x >= 2 && x <= w - 3) && ragged(3, 4)(f, x, y, w, h) },
        { from: [-5.5, 0, 5], size: [11, 10, 0], mat: withPattern(kelpDark, blades), mask: ragged(3, 6) },
        { from: [-5.5, 0, -5], size: [0, 10, 10], mat: withPattern(kelpDark, blades), mask: ragged(3, 7) },
        { from: [5.5, 0, -5], size: [0, 10, 10], mat: withPattern(kelpDark, blades), mask: ragged(3, 8) },
        { from: [-5, 9, -4.5], size: [10, 2, 9], mat: withPattern(kelp, blades), mask: (f, x, y) => f !== 'north' || x % 2 === 0 },
      ] },
      // long stipes with a float bladder and a leaf at the tip, springing up and out
      ...[[-25, -30], [-12, -45], [0, -55], [12, -45], [25, -30], [-20, 10], [20, 10], [0, 20]].map(([rz, rx], i) => ({
        name: 'stalk_' + i, parent: 'body', pivot: [rz / 10, 10, (i % 3) - 1], rot: [rx + 20, 0, rz], cubes: [
          { from: [rz / 10 - 0.5, 10, (i % 3) - 1.5], size: [1, 11 + (i % 3) * 2, 1], mat: stipe },
          { from: [rz / 10 - 1, 19 + (i % 3) * 2, (i % 3) - 2], size: [2, 2, 2], mat: R('#d0e888', '#b0d060', '#90b048') },   // the float
          { from: [rz / 10 - 1.5, 21 + (i % 3) * 2, (i % 3) - 1], size: [3, 5, 0], mat: withPattern(R('#8ad070', '#62b058', '#469048'), (f, x) => (x === 1 ? -0.8 : 0)), mask: leafMask },
        ] })),
    ],
  },

  // ------------------------------------------------------------ Terror Eel (elite; drawn 1.6x)
  terror_eel: {
    render: 'cutout', scale: 1.6,
    bones: [
      { name: 'body', pivot: [0, 3, 0], cubes: [
        { from: [-3.5, 0, -5], size: [7, 7, 10], mat: withPattern(eelBlue, eelEyes(21)), faceMat: { down: eelBelly } },
        { from: [0, 7, -4], size: [0, 3, 9], mat: eelFin, mask: (f, x, y, w, h) => y >= Math.round(h - 1 - (x % 4) * 0.8) },
      ] },
      { name: 'head', parent: 'body', pivot: [0, 3, -5], cubes: [
        // a long blunt head; the jaw line full of needle teeth along both sides
        { from: [-3, 2, -14], size: [6, 5, 9], mat: withPattern(eelBlue, (f, x, y) => (f === 'up' && h2(x, y, 4) < 8 ? -0.6 : 0)),
          detail: sides((x, y, w, h) => (y === h - 1 ? (x % 2 === 0 ? '#14182a' : '#f8f4ea') : y === 1 && x === w - 3 ? '#e04040' : y === 1 && x === w - 4 ? '#fff4ec' : null)) },
        { from: [-2.5, 0, -13], size: [5, 2, 8], mat: eelBelly,
          detail: sides((x, y, w, h) => (y === 0 ? (x % 2 ? '#f8f4ea' : '#14182a') : null)) },
        { from: [-2, 3, -15], size: [4, 3, 1], mat: eelBlue },
      ] },
      { name: 'body_2', parent: 'body', pivot: [0, 3, 5], cubes: [
        { from: [-3, 0.5, 5], size: [6, 6, 9], mat: withPattern(eelBlue, eelEyes(22)), faceMat: { down: eelBelly } },
        { from: [0, 6.5, 5], size: [0, 3, 9], mat: eelFin, mask: (f, x, y, w, h) => y >= Math.round(h - 1 - (x % 4) * 0.8) },
      ] },
      { name: 'tail', parent: 'body_2', pivot: [0, 3, 14], rot: [30, 0, 0], cubes: [
        { from: [-2.5, 1, 14], size: [5, 5, 7], mat: withPattern(eelBlue, (f, x, y, w, h) => (f !== 'down' && Math.floor((f === 'up' ? y : x) / 2) % 2 === 0 ? '#f4b030' : 0)) } ] },
      { name: 'tail_tip', parent: 'tail', pivot: [0, 3, 21], rot: [35, 0, 0], cubes: [
        { from: [-1.5, 1.5, 21], size: [3, 4, 6], mat: withPattern(eelBlue, (f, x, y) => (Math.floor(x / 2) % 2 === 0 ? '#e88030' : 0)) },
        { from: [0, -1, 24], size: [0, 9, 6], mat: eelFin, mask: leafMask },
      ] },
    ],
  },

  // ------------------------------------------------------------ Soul Fysh (boss; drawn 2x)
  soul_fysh: {
    render: 'translucent', scale: 2.0, glow: true,
    bones: [
      { name: 'body', pivot: [0, 16, 0], cubes: [
        // the disc: a tall flat body, corners cut
        { from: [-3, 7, -10], size: [6, 18, 20], mat: withPattern(fyshBody, (f, x, y) => ((x + y * 2) % 9 === 0 ? -0.6 : 0)) },
        { from: [-2.5, 5, -8], size: [5, 2, 16], mat: fyshBody }, { from: [-2.5, 25, -8], size: [5, 2, 16], mat: fyshBody },
        // the organs: a pink stomach, a coiled purple gut, a clutch of yellow eggs
        { from: [-1.5, 14, -6], size: [3, 6, 6], mat: { ramp: ['#ffd0c8', '#f4aca4', '#dc8a84'], alpha: 235 } },
        { from: [-1.5, 17, 0], size: [3, 6, 6], mat: withPattern({ ramp: ['#d8b0f0', '#b48ad8', '#9068b8'], alpha: 235 }, (f, x, y) => ((x + y) % 3 === 0 ? 1.2 : (x * y) % 4 === 1 ? -0.6 : 0)) },
        { from: [-1.5, 10, -4], size: [3, 4, 6], mat: withPattern({ ramp: ['#fff2a0', '#f0d060', '#d0b040'], alpha: 235 }, (f, x, y) => ((x + y) % 2 ? -0.8 : 0.6)) },
      ] },
      { name: 'head', parent: 'body', pivot: [0, 15, -10], cubes: [
        // thick lips round a small round mouth
        { from: [-2.5, 12, -13], size: [5, 5, 3], mat: fyshLip, detail: { north: (x, y) => (x >= 1 && x <= 3 && y >= 1 && y <= 3 ? (x === 2 && y === 2 ? '#0e2a28' : '#1e4a46') : null) } },
        { from: [-3.5, 18, -9], size: [7, 3, 3], inflate: 0.2, mat: glowing(R('#fffbc0', '#f0e060', '#202010')),
          detail: sides((x, y) => (x === 1 && y === 1 ? '#101008' : x === 0 && y === 0 ? '#ffffff' : null)) },
      ] },
      { name: 'fin_top', parent: 'body', pivot: [0, 27, 0], cubes: [
        { from: [0, 26, -5], size: [0, 12, 12], mat: fyshFin, mask: (f, x, y, w, h) => y >= Math.round((h - 1) * Math.abs(x - w * 0.45) / w * 1.6) } ] },
      { name: 'fin_bottom', parent: 'body', pivot: [0, 6, 0], cubes: [
        { from: [0, -4, -5], size: [0, 10, 12], mat: fyshFin, mask: (f, x, y, w, h) => h - 1 - y >= Math.round((h - 1) * Math.abs(x - w * 0.45) / w * 1.6) } ] },
      // the clavus: a scalloped rudder in place of a tail
      { name: 'tail', parent: 'body', pivot: [0, 16, 10], cubes: [
        { from: [0, 5, 10], size: [0, 22, 6], mat: withPattern(fyshFin, (f, x, y) => (y % 4 === 0 ? 0.8 : 0)), mask: (f, x, y, w, h) => x <= w - 1 - (y % 4 === 0 ? 1 : 0) - (Math.abs(y - h / 2) > h * 0.4 ? 2 : 0) } ] },
      ...[['fin_l', -3], ['fin_r', 3]].map(([n, x]) => ({ name: n, parent: 'body', pivot: [x, 13, -4], rot: [0, x < 0 ? -25 : 25, 0], cubes: [
        { from: [x, 10, -4], size: [0, 6, 8], mat: fyshFin, mask: leafMask } ] })),
    ],
  },
};
