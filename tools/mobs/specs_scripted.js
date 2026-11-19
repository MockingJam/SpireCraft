// Phase 8 §11: models of the data-driven STS2 monsters (mob/ScriptedDefs). Traced from the renders on
// slaythespire.wiki.gg (StS2_<Name>.png) and cross-checked against the real animal or object behind each one (a
// cat-eared ink blob, a fly agaric, a moray-like strangler, a mole cricket, a pill bug, a rhinoceros beetle, a
// hermit crab, a centipede, a sandworm...). Bone names follow the conventions the generic animation in
// client/mob/SpireMobModel.scripted() understands:
//   body, head, jaw; arm_l / arm_r (+ weapon); leg_l / leg_r (two legs); leg_fl / fr / bl / br (four);
//   leg_l0..2 / leg_r0..2 (six); tail, tail_1 ...; seg_1 ... (a worm's segments, each hanging off the last);
//   wing_l / wing_r; tent_0 ... (tentacles, vines, worms); orbit (parts circling the body); cape.
const R = (...ramp) => ({ ramp });
const withPattern = (m, pattern) => ({ ...m, pattern });
const glowing = m => ({ ...m, emissive: true });
const h2 = (x, y, s) => (((x * 73856093) ^ (y * 19349663) ^ (s * 83492791)) >>> 0) % 97;
const hash = (x, s) => ((x * 37 + s * 11) % 7 + 7) % 7;
const ragged = (depth, seedN = 1) => (f, x, y, w, h) => y < h - (hash(x, seedN) % (depth + 1));
const tufts = (depth, seedN = 1) => (f, x, y, w, h) => y >= hash(x, seedN) % (depth + 1);
const leafMask = (face, x, y, w, h) => { const cx = (w - 1) / 2, t = y / Math.max(1, h - 1); const half = Math.sin(Math.PI * Math.min(1, t * 1.05 + 0.05)) * w / 2; return Math.abs(x - cx) <= half + 0.2; };
const disc = (f, x, y, w, h) => Math.hypot(x - (w - 1) / 2, y - (h - 1) / 2) <= Math.min(w, h) / 2;
const at = (pts, c) => (x, y) => (pts.some(([a, b]) => a === x && b === y) ? c : null);
const B = (from, size, mat, extra = {}) => ({ from, size, mat, ...extra });
/** Rounded lump: three overlapping boxes. */
const blob = (cx, y0, cz, w, h, d, mat) => [B([cx - w / 2, y0 + 1, cz - d / 2 + 1], [w, h - 2, d - 2], mat), B([cx - w / 2 + 1, y0, cz - d / 2 + 1], [w - 2, h, d - 2], mat), B([cx - w / 2 + 1, y0 + 1, cz - d / 2], [w - 2, h - 2, d], mat)];
const face = fn => ({ north: fn });

// ---- surface patterns (shade offsets; '#hex' paints)
const spots = (seed, col, rate = 12) => (f, x, y) => (h2(Math.floor(x / 2), Math.floor(y / 2), seed) < rate ? col : (x + y) % 7 === 0 ? -0.5 : 0);
const plates = step => (f, x, y) => (y % step === 0 ? 1.1 : y % step === 1 ? -0.5 : 0);
const rings = step => (f, x, y, w, h) => ((f === 'east' || f === 'west' || f === 'up' || f === 'down') ? (y % step === 0 ? 1.1 : 0) : 0);
const strands = (f, x, y) => (x % 2 ? 0.35 : -0.3) + (y % (3 + hash(x, 5) % 3) === 0 ? -0.6 : 0) + (hash(x, 2) === 0 ? 0.9 : 0);
const stone = (f, x, y) => (h2(x, y, 31) < 6 ? 1.2 : (Math.floor(x / 3) + Math.floor(y / 2)) % 3 === 0 ? -0.4 : 0);
const metal = (f, x, y, w, h) => (x === 0 || y === 0 ? -0.8 : x === w - 1 || y === h - 1 ? 0.9 : (x * 3 + y) % 11 === 0 ? -0.5 : 0);
const cloth = (f, x, y) => (x % 3 === 0 ? 0.6 : 0) + (y % 5 === 0 ? 0.3 : 0);
const wood = (f, x, y) => (x % 3 === 0 ? 0.9 : x % 3 === 1 ? -0.3 : 0) + (h2(x, y, 41) < 4 ? 1.2 : 0);

// ---- body plans
/** A vanilla-proportioned biped (player-sized). o.parts adds cubes per bone; o.extra adds whole bones. */
function biped(o) {
  const P = o.parts || {};
  return { render: o.render || 'cutout', bones: [
    { name: 'body', pivot: [0, 12, 0], cubes: [B([-4, 12, -2], [8, 12, 4], o.torso), ...(P.body || [])] },
    { name: 'head', parent: 'body', pivot: [0, 24, 0], cubes: [B([-4, 24, -4], [8, 8, 8], o.headMat || o.skin, o.face ? { detail: face(o.face) } : {}), ...(P.head || [])] },
    { name: 'arm_l', parent: 'body', pivot: [-5, 22, 0], cubes: [B([-8, 12, -2], [4, 12, 4], o.arms || o.torso), ...(P.arm_l || [])] },
    { name: 'arm_r', parent: 'body', pivot: [5, 22, 0], cubes: [B([4, 12, -2], [4, 12, 4], o.arms || o.torso), ...(P.arm_r || [])] },
    { name: 'leg_l', parent: 'body', pivot: [-2, 12, 0], cubes: [B([-4, 0, -2], [4, 12, 4], o.legs)] },
    { name: 'leg_r', parent: 'body', pivot: [2, 12, 0], cubes: [B([0, 0, -2], [4, 12, 4], o.legs)] },
    ...(o.extra || []),
  ] };
}
/** Six thin jointed legs out of a body (insects, mites). */
function sixLegs(mat, y, x, zs, len, spread = 25, parent = 'body') {
  return [-1, 1].flatMap(s => zs.map((z, i) => ({ name: 'leg_' + (s < 0 ? 'l' : 'r') + i, parent, pivot: [s * x, y, z], rot: [0, (1 - i) * spread * s, s * 25], cubes: [
    B([s < 0 ? -x - len : x, y - 0.5, z - 0.5], [len, 1, 1], mat), B([s < 0 ? -x - len : x + len - 1, y - len - 0.5, z - 0.5], [1, len, 1], mat)] })));
}
/** A chain of segments, each a bone hanging off the last, along +z (seg_1 is the first after the body/head). */
function chain(n, mk, parent, z0, step) {
  const out = [];
  for (let i = 1; i <= n; i++) out.push({ name: 'seg_' + i, parent: i === 1 ? parent : 'seg_' + (i - 1), pivot: [0, 0, z0 + (i - 1) * step], cubes: mk(i, z0 + (i - 1) * step) });
  return out;
}

// ---- palettes
const ink = R('#4a4458', '#33303e', '#24222c', '#18161e', '#0e0c12');
const inkEye = glowing(R('#fffcc0', '#f4e470', '#d8c040'));
const capRed = R('#f08060', '#d85a40', '#b8402e', '#943022', '#702418');
const capSpot = '#a8e05a';
const trunk = R('#f6dcb0', '#e8c494', '#d2a878', '#b48a60', '#926c48');
const ghost = { ramp: ['#e8fff4', '#c4f4e0', '#9ce0c8', '#78c8b0'], alpha: 150 };
const mawBlue = R('#9ad4e4', '#74b8cc', '#5698b0', '#407a92', '#2e5e74');
const teeth = R('#fffaf0', '#ece4d0', '#d0c4a8');
const fruit = R('#ffb0b0', '#f07878', '#d84c58', '#b03040', '#882230');
const leafG = R('#b8e08a', '#94c866', '#72a84c', '#568a38');
const snake = R('#e88870', '#cc6650', '#ac4c3a', '#8a3a2c', '#6a2c22');
const boneW = R('#fffdf2', '#eee8d4', '#d6ccb0', '#b4a88c');
const vineY = R('#e8e08a', '#ccc464', '#aca444', '#8c8430', '#6a6422');
const tan = R('#f0e0a8', '#dcc888', '#c0aa68', '#9c884c');
const olive = R('#c8c890', '#aaaa70', '#8a8c54', '#6c6e40');
const orbCyan = glowing(R('#e8ffff', '#a0f4ff', '#58dcf4', '#28b4d8'));
const orbOrange = R('#ffd0a0', '#f0a060', '#d07838', '#a85a24');
const armour = R('#b8ccc8', '#92aaa8', '#708a88', '#566c6c', '#3e5050');
const steel = R('#e4e8ec', '#c4cad2', '#a2aab4', '#808894', '#606874');
const leather = R('#c89868', '#a87a4c', '#885e38', '#6a4628');
const redCloth = R('#e07060', '#c04c40', '#9a382e', '#762a22');
const blueCape = R('#7a9ad0', '#5878b0', '#3e5a90', '#2c4270');
const greyCloth = R('#d8d8d0', '#b8b8b0', '#98988e', '#787870');
const skinPale = R('#f4d8c0', '#e0bca0', '#c49c80');
const furBrown = R('#c8a070', '#a87e52', '#88603c', '#68482a', '#4c3420');
const boarBlack = R('#5a5450', '#423e3a', '#2e2a28', '#1e1c1a');
const wormY = R('#f8e8a0', '#e8cc70', '#cca850', '#a8863a', '#86682a');
const statue = R('#d4dccc', '#b8c2b0', '#9aa694', '#7c8878', '#5e6a5c');
const phrogY = R('#f4f07a', '#dcd450', '#bcb434', '#988e26', '#706820');
const wormO = R('#f8b070', '#e08a48', '#c06a30', '#985024');
const kinGreen = R('#c4c47a', '#a4a45a', '#848444', '#666632', '#4a4a24');
const kinFur = R('#d8b070', '#bc9050', '#9c7238', '#7c5828');
const kinBlue = R('#8ab4c8', '#6a94ac', '#4e7690', '#3a5a74');
const oil = R('#c8f0e8', '#90d8e8', '#7aa8e0', '#9a88d8', '#c080c8', '#e0a070');
const cultBlue = R('#7aa0b8', '#5a8098', '#40627a', '#2e4a5e');
const fishSkin = R('#c8e8e0', '#a4d0c6', '#80b4aa', '#5e968c');
const fog = { ramp: ['#d8c8d8', '#b8a4b8', '#988498', '#7a687a', '#5e4e5e'], alpha: 200 };
const pinkOrb = glowing(R('#ffe0f4', '#f8a8dc', '#e078c0'));
const coral = R('#ffeeb0', '#f4d888', '#e0bc64', '#c09a48');
const coralRed = R('#f49080', '#e06a5c', '#c04c44', '#983a34');
const gremRed = R('#f49478', '#e07058', '#c45040', '#a03a30');
const gremPink = R('#f4a8b8', '#e08498', '#c8647c', '#a44c62');
const hood = R('#a88058', '#88643e', '#6a4c2c', '#4e361e');
const hull = R('#a87c52', '#8a6038', '#6c4828', '#4e321a');
const crabGrey = R('#c8ccd0', '#a4a8ae', '#80868e', '#60666e');
const gold = R('#fff2b0', '#f6d262', '#d6a232', '#9a6c1a');
const robot = R('#f4e4a8', '#dcc884', '#c0aa64', '#9c884a', '#7a6834');
const clamShell = R('#d8c0f0', '#b898e0', '#9474c4', '#7058a0', '#544080');
const coralBlue = R('#d8f0ff', '#b0d8f0', '#88bce0', '#6698c4');
const gardener = R('#f0d8a8', '#d8b884', '#bc9664', '#98764a');
const flower = R('#ff9a8a', '#e86a5a', '#c84a40');
const mossStone = R('#a8b898', '#8a9c7a', '#6e8060', '#56664a', '#404c36');
const water = { ramp: ['#e0f8ff', '#a8e4f8', '#70c8ec', '#48a8d8'], alpha: 170 };
const crabOrange = R('#ffc080', '#f8984c', '#e07430', '#b85a20');
const pebbleShell = R('#fffcec', '#f4ecd0', '#e0d4b0', '#c4b690');
const fuzzWhite = R('#ffffff', '#f2f0ea', '#dcd8cc', '#c0bcae');
const eggTeal = R('#a8f0e0', '#78d8c8', '#50bcac', '#349e90');
const flyWing = { ramp: ['#fff8e8', '#f0dcc0', '#d8bc98'], alpha: 150 };
const maroon = R('#d07890', '#b05870', '#8e4058', '#6e3044');
const hopperGreen = R('#e8f090', '#c8d468', '#a4b448', '#7c8a34');
const hopperDark = R('#6a5a7a', '#4e4260', '#3a3048', '#282034');
const dragonRed = R('#f48070', '#e05048', '#c0383a', '#982a2e');
const louseBlue = R('#90c0f0', '#6aa0e0', '#4c80c8', '#3864a4');
const louseYellow = R('#f8e090', '#e8c460', '#cca444', '#a8842e');
const beetlePurple = R('#b088c8', '#9468b0', '#784e94', '#5c3a76');
const toadGreen = R('#a8dcc0', '#84c4a4', '#64a688', '#4a886c', '#346a54');
const obsBlue = R('#e8f4ff', '#c4dcf8', '#98bce8', '#6c96d0', '#4a72b0');
const paraCyan = { ramp: ['#d8ffff', '#a0f0ff', '#68d8f8', '#40b8e8'], alpha: 160 };
const centiBlue = R('#5a6a98', '#44527c', '#323e62', '#242c4a');
const centiOrange = R('#ffc080', '#f49850', '#d87838', '#b05c28');
const prismRed = R('#f08080', '#d85a5a', '#b84444', '#943434', '#702828');
const crystal = { ramp: ['#e0f4ff', '#a8d8f8', '#78b8ec', '#5294d0'], alpha: 220 };
const sandworm = R('#b4c4d4', '#94a6ba', '#76889e', '#5a6c82', '#424f62');
const mawOrange = R('#ffd890', '#f8a858', '#e07a38', '#b8542a');

module.exports = {
  // ================================================================ Overgrowth
  // Inklet: a round black ink imp with cat ears, one glowing slit of an eye, stubby arms and feet.
  inklet: { render: 'cutout', glow: true, bones: [
    { name: 'body', pivot: [0, 4, 0], cubes: [...blob(0, 2, 0, 8, 8, 7, withPattern(ink, (f, x, y) => (h2(x, y, 3) < 5 ? -0.8 : 0)))] },
    { name: 'head', parent: 'body', pivot: [0, 9, 0], cubes: [...blob(0, 9, 0, 8, 7, 7, ink),
      B([-3, 15, -1], [2, 3, 2], ink), B([1, 15, -1], [2, 3, 2], ink),
      B([-3, 11, -3.6], [6, 1, 0], inkEye, { detail: face((x) => (x === 0 || x === 5 ? '#d8c040' : null)) })] },
    { name: 'arm_l', parent: 'body', pivot: [-4, 7, 0], rot: [0, 0, 20], cubes: [B([-6, 4, -1], [2, 4, 2], ink)] },
    { name: 'arm_r', parent: 'body', pivot: [4, 7, 0], rot: [0, 0, -20], cubes: [B([4, 4, -1], [2, 4, 2], ink)] },
    { name: 'leg_l', parent: 'body', pivot: [-2, 2, 0], cubes: [B([-3.5, 0, -1.5], [3, 2, 3], ink)] },
    { name: 'leg_r', parent: 'body', pivot: [2, 2, 0], cubes: [B([0.5, 0, -1.5], [3, 2, 3], ink)] },
  ] },
  // Fogmog: a walking toadstool - a broad red cap with green warts, a pale trunk of a body with a hollow face, root feet.
  fogmog: { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 6, 0], cubes: [B([-4, 3, -3], [8, 13, 6], withPattern(trunk, (f, x, y) => (x % 3 === 1 ? 0.5 : 0)),
      { detail: face((x, y) => ((x === 2 || x === 5) && (y === 2 || y === 3) ? '#3a2416' : y >= 6 && y <= 9 && x >= 3 && x <= 4 ? '#2a1a10' : null)) })] },
    { name: 'head', parent: 'body', pivot: [0, 16, 0], cubes: [B([-10, 16, -9], [20, 4, 18], withPattern(capRed, (f, x, y) => (f === 'up' && h2(Math.floor(x / 2), Math.floor(y / 2), 7) < 14 ? capSpot : 0))),
      B([-7, 20, -6], [14, 3, 12], withPattern(capRed, (f, x, y) => (h2(x, y, 9) < 10 ? capSpot : 0))), B([-9, 15, -8], [18, 1, 16], R('#e8d4b0', '#d4bc94', '#bca078'))] },
    { name: 'arm_l', parent: 'body', pivot: [-4, 13, 0], rot: [0, 0, 25], cubes: [B([-6, 6, -1], [2, 7, 2], trunk)] },
    { name: 'arm_r', parent: 'body', pivot: [4, 13, 0], rot: [0, 0, -25], cubes: [B([4, 6, -1], [2, 7, 2], trunk)] },
    { name: 'leg_l', parent: 'body', pivot: [-2, 3, 0], cubes: [B([-4, 0, -2], [3, 3, 4], R('#9ab060', '#7c9248', '#607434'))] },
    { name: 'leg_r', parent: 'body', pivot: [2, 3, 0], cubes: [B([1, 0, -2], [3, 3, 4], R('#9ab060', '#7c9248', '#607434'))] },
  ] },
  // Eye With Teeth: a ghostly pale-green eye in a ring of petal-like lids, trailing wispy tendrils.
  eye_with_teeth: { render: 'translucent', bones: [
    { name: 'body', pivot: [0, 8, 0], cubes: [B([-3, 5, -3], [6, 6, 6], ghost, { detail: face((x, y) => (x >= 2 && x <= 3 && y >= 1 && y <= 4 ? (y === 2 || y === 3 ? '#0e3a2a' : '#3ca878') : null)) }),
      ...[0, 1, 2, 3].map(i => B([i % 2 ? -5 : -3, i < 2 ? 4 : 10, -3.2], [i % 2 ? 10 : 6, 1, 0], ghost))] },
    ...[0, 1, 2, 3].map(i => ({ name: 'tent_' + i, parent: 'body', pivot: [0, 8, 0], rot: [0, 0, i * 90 + 45], cubes: [B([3, 7.5, 0], [10, 1, 0], ghost, { mask: (f, x) => x % 4 !== 3 })] })),
  ] },
  // Mawler: a blue, hunched four-legged brute - a huge underslung jaw full of teeth, small eyes, a spiked tail.
  mawler: { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 10, 0], cubes: [B([-5, 7, -6], [10, 10, 13], withPattern(mawBlue, (f, x, y) => (f === 'up' && x % 3 === 0 ? 0.7 : 0)))] },
    { name: 'head', parent: 'body', pivot: [0, 13, -6], cubes: [B([-4, 10, -13], [8, 6, 7], mawBlue, { detail: { east: at([[1, 1]], '#f4f0a0'), west: at([[5, 1]], '#f4f0a0') } })] },
    { name: 'jaw', parent: 'head', pivot: [0, 10, -7], cubes: [B([-4.5, 6, -14], [9, 4, 8], mawBlue, { detail: { north: (x, y) => (y === 0 && x % 2 === 0 ? '#fffaf0' : null) } }),
      B([-4, 9.5, -14.2], [8, 1, 0], teeth, { mask: (f, x) => x % 2 === 0 })] },
    ...[['leg_fl', -1, -3], ['leg_fr', 1, -3], ['leg_bl', -1, 4], ['leg_br', 1, 4]].map(([n, s, z]) => ({ name: n, parent: 'body', pivot: [s * 4, 8, z], cubes: [B([s * 4 - 1.5, 0, z - 1.5], [3, 8, 3], mawBlue), B([s * 4 - 2, 0, z - 2.5], [4, 1, 2], teeth)] })),
    { name: 'tail', parent: 'body', pivot: [0, 13, 7], rot: [-20, 0, 0], cubes: [B([-1.5, 12, 7], [3, 3, 8], mawBlue), ...[0, 1, 2].map(i => B([-0.5, 15, 8 + i * 2.5], [1, 2, 1], teeth))] },
    { name: 'tail_1', parent: 'tail', pivot: [0, 13, 15], rot: [20, 0, 0], cubes: [B([-1, 12.5, 15], [2, 2, 6], mawBlue)] },
  ] },
  // Snapping Jaxfruit: a big round red fruit with a crown of leaves and berry stalks, rooted where it stands.
  snapping_jaxfruit: { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 0, 0], cubes: [...blob(0, 0, 0, 12, 11, 12, withPattern(fruit, (f, x, y) => (h2(x, y, 5) < 8 ? -1 : (x + y) % 5 === 0 ? 0.6 : 0)))] },
    { name: 'head', parent: 'body', pivot: [0, 11, 0], cubes: [
      ...[0, 1, 2, 3, 4, 5].map(i => B([Math.round(Math.cos(i) * 4) - 2, 11, Math.round(Math.sin(i) * 4)], [4, 5, 0], leafG, { mask: leafMask })),
      ...[0, 1, 2].map(i => B([i * 3 - 3.5, 11, -1 + i], [1, 7, 1], R('#7aa848', '#5a8834'))), ...[0, 1, 2].map(i => B([i * 3 - 4, 18, -1.5 + i], [2, 2, 2], R('#f4c060', '#e09838')))] },
  ] },
  // Slithering Strangler: a red-brown serpent rearing in an S, white knobbed spines down its body, a bony grey blade of a head.
  slithering_strangler: { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 2, 4], cubes: [B([-2.5, 0, 0], [5, 4, 9], withPattern(snake, spots(4, '#fffdf2', 10)))] },
    { name: 'seg_1', parent: 'body', pivot: [0, 2, 0], rot: [-50, 0, 0], cubes: [B([-2, 0, -7], [4, 4, 7], withPattern(snake, spots(5, '#fffdf2', 10)))] },
    { name: 'head', parent: 'seg_1', pivot: [0, 2, -7], rot: [40, 0, 0], cubes: [B([-2.5, 0, -12], [5, 4, 5], boneW), B([-1, 4, -12], [2, 3, 6], boneW), B([-0.5, 2, -15], [1, 1, 3], boneW)] },
    { name: 'tail', parent: 'body', pivot: [0, 2, 9], rot: [0, 30, 0], cubes: [B([-2, 0.5, 9], [4, 3, 7], withPattern(snake, spots(6, '#fffdf2', 10)))] },
    { name: 'tail_1', parent: 'tail', pivot: [0, 2, 16], rot: [0, 40, 0], cubes: [B([-1.5, 1, 16], [3, 2, 6], snake)] },
  ] },
  // Vine Shambler: a crawling heap of yellow-green vines, a gaping toothed mouth in front, long dragging arms.
  vine_shambler: { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 8, 2], rot: [15, 0, 0], cubes: [B([-6, 4, -4], [12, 13, 10], withPattern(vineY, strands)),
      B([-6.5, 2, 6.5], [13, 15, 0], withPattern(vineY, strands), { mask: ragged(3, 2) }), B([-6.5, 2, -4.5], [13, 6, 0], withPattern(vineY, strands), { mask: ragged(2, 3) })] },
    { name: 'head', parent: 'body', pivot: [0, 14, -4], cubes: [B([-5, 10, -9], [10, 7, 5], withPattern(vineY, strands), { detail: face((x, y, w) => (y >= 2 && y <= 5 && x >= 1 && x <= w - 2 ? (y === 2 || y === 5 ? (x % 2 ? '#fffaf0' : '#3a1010') : '#5a1a14') : null)) }),
      B([-4, 17, -7], [8, 0, 5], leafG, { mask: (f, x, y) => (x + y) % 2 === 0 })] },
    ...[['arm_l', -1], ['arm_r', 1]].map(([n, s]) => ({ name: n, parent: 'body', pivot: [s * 6, 14, -1], rot: [-20, 0, s * -10], cubes: [B([s * 6 - 1.5, 0, -2.5], [3, 14, 3], withPattern(vineY, strands)), B([s * 6 - 2, -1, -4], [4, 2, 4], R('#d08868', '#b06a50'))] })),
    { name: 'leg_l', parent: 'body', pivot: [-3, 4, 3], cubes: [B([-5, 0, 1], [4, 4, 4], vineY)] },
    { name: 'leg_r', parent: 'body', pivot: [3, 4, 3], cubes: [B([1, 0, 1], [4, 4, 4], vineY)] },
  ] },
  // Cubex Construct: a floating exclamation mark of stone - a tall tilted olive block, an amber orb and a cyan gem over a small base.
  cubex_construct: { render: 'cutout', glow: true, bones: [
    { name: 'body', pivot: [0, 0, 0], cubes: [B([-3, 0, -3], [6, 3, 6], withPattern(olive, stone))] },
    { name: 'orbit', parent: 'body', pivot: [0, 6, 0], cubes: [B([-1, 5, -1], [2, 2, 2], orbCyan), ...blob(0, 7.5, 0, 4, 4, 4, orbOrange)] },
    { name: 'head', parent: 'body', pivot: [0, 13, 0], rot: [0, 0, 6], cubes: [B([-3, 13, -3], [6, 14, 6], withPattern(tan, stone)), B([-3.5, 26, -3.5], [7, 2, 7], olive)] },
  ] },
  // The Ruby Raiders: five sellswords in mismatched gear.
  axe_raider: biped({ torso: withPattern(armour, metal), headMat: armour, legs: R('#4a5a50', '#38463e', '#28342c'), face: (x, y) => (y === 3 && (x === 2 || x === 5) ? '#101818' : y === 3 ? '#2a3434' : null),
    parts: { head: [B([-1, 32, -1], [2, 3, 2], armour), B([-4.5, 31, -4.5], [9, 1, 9], armour)], arm_l: [B([-10, 8, -6], [1, 10, 9], withPattern(armour, metal))] },
    extra: [{ name: 'weapon', parent: 'arm_r', pivot: [6, 13, 0], rot: [-70, 0, 0], cubes: [B([5.5, 2, -0.5], [1, 18, 1], leather), B([4, 16, 0], [4, 5, 0], steel), B([6, 15, -0.2], [4, 7, 0], steel, { mask: leafMask })] }] }),
  assassin_raider: biped({ torso: withPattern(greyCloth, cloth), headMat: steel, legs: R('#8a909c', '#6c7280', '#525864'), arms: steel, face: (x, y) => (y === 3 && x >= 1 && x <= 6 ? '#202630' : null),
    parts: { head: [B([-4.5, 31, -4.5], [9, 2, 9], steel)] },
    extra: [{ name: 'cape', parent: 'body', pivot: [0, 24, 2], rot: [8, 0, 0], cubes: [B([-5, 6, 2.2], [10, 18, 0], withPattern(blueCape, cloth), { mask: ragged(2, 4) })] },
      { name: 'weapon', parent: 'arm_r', pivot: [6, 13, 0], rot: [-80, 0, 0], cubes: [B([6, -2, -0.5], [0, 18, 1], steel), B([5, 12, -1], [2, 1, 2], gold)] }] }),
  brute_raider: { ...biped({ torso: withPattern(redCloth, cloth), headMat: steel, legs: leather, arms: skinPale, face: (x, y) => (y === 3 && (x === 2 || x === 5) ? '#202020' : y >= 3 && y <= 4 ? '#606874' : null),
    parts: { body: [B([-5, 20, -3], [10, 4, 6], withPattern(steel, metal))], head: [B([-6, 29, -1], [2, 4, 2], boneW), B([4, 29, -1], [2, 4, 2], boneW)], arm_l: [B([-8.5, 12, -2.5], [5, 3, 5], leather)], arm_r: [B([3.5, 12, -2.5], [5, 3, 5], leather)] } }) },
  crossbow_raider: biped({ torso: withPattern(greyCloth, cloth), headMat: skinPale, legs: R('#3a3a40', '#2a2a30', '#1c1c22'), face: (x, y) => (y === 4 && (x === 2 || x === 5) ? '#202020' : null),
    parts: { head: [B([-7, 31, -7], [14, 1, 14], leather), B([-4, 32, -4], [8, 4, 8], leather)] },
    extra: [{ name: 'cape', parent: 'body', pivot: [0, 24, 2], cubes: [B([-5, 4, 2.2], [10, 20, 0], withPattern(leather, cloth), { mask: ragged(3, 6) })] },
      { name: 'weapon', parent: 'arm_r', pivot: [6, 13, 0], rot: [-90, 0, 0], cubes: [B([5, 4, -1], [2, 12, 2], leather), B([-1, 13, -0.5], [14, 1, 1], R('#c89058', '#a06c38'))] }] }),
  // the tracker: a hunched hooded hunter with a black boar-hound at heel
  tracker_raider: { ...biped({ torso: withPattern(leather, cloth), headMat: R('#b89870', '#9a7a54'), legs: R('#6a5a44', '#524430'), face: (x, y) => (y >= 2 && y <= 5 && x >= 1 && x <= 6 ? (y === 4 && (x === 2 || x === 5) ? '#f0e0a0' : '#2a2018') : null),
    parts: { head: [B([-4.5, 23.5, -4.5], [9, 9, 9], withPattern(R('#b89870', '#9a7a54', '#7a5e3e'), cloth), { mask: (f, x, y, w, h) => f !== 'north' || !(x >= 1 && x <= w - 2 && y >= 2 && y <= h - 2) })] },
    extra: [{ name: 'tail', parent: 'body', pivot: [9, 6, 2], cubes: [B([7, 3, -3], [5, 5, 10], withPattern(boarBlack, strands)), B([7.5, 4, -7], [4, 4, 4], boarBlack, { detail: { north: at([[0, 1], [3, 1]], '#d84040') } }),
      B([7.5, 0, -2], [1, 3, 1], boarBlack), B([10.5, 0, -2], [1, 3, 1], boarBlack), B([7.5, 0, 5], [1, 3, 1], boarBlack), B([10.5, 0, 5], [1, 3, 1], boarBlack)] }] }) },
  // Wriggler: a fat yellow grub-worm with a ring of teeth for a mouth.
  wriggler: { render: 'cutout', bones: [
    { name: 'head', pivot: [0, 2, -3], cubes: [B([-2.5, 0, -6], [5, 5, 4], withPattern(wormY, rings(2)), { detail: face((x, y) => (x >= 1 && x <= 3 && y >= 1 && y <= 3 ? (x === 2 && y === 2 ? '#3a1a10' : '#fffaf0') : null)) })] },
    ...chain(3, (i, z) => [B([-2.5 + i * 0.25, 0, z], [Math.round(5 - i * 0.5), Math.round(4.5 - i * 0.5), 3], withPattern(wormY, rings(2)))], 'head', -2, 3),
  ] },
  // Bygone Effigy (elite): a weathered statue of a robed figure with a scythe, on a plinth.
  bygone_effigy: { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 6, 0], cubes: [B([-5, 0, -5], [10, 5, 10], withPattern(statue, stone)), B([-4, 5, -3], [8, 14, 6], withPattern(statue, (f, x, y) => (x % 2 ? 0.6 : 0) + (h2(x, y, 3) < 5 ? 1 : 0)))] },
    { name: 'head', parent: 'body', pivot: [0, 19, 0], cubes: [B([-3, 19, -3], [6, 6, 6], withPattern(statue, stone), { detail: face((x, y) => ((x === 1 || x === 4) && y === 2 ? '#5e6a5c' : null)) })] },
    { name: 'arm_l', parent: 'body', pivot: [-4, 17, 0], cubes: [B([-6, 10, -1], [2, 8, 2], statue)] },
    { name: 'arm_r', parent: 'body', pivot: [4, 17, 0], rot: [-15, 0, 0], cubes: [B([4, 10, -1], [2, 8, 2], statue)] },
    { name: 'weapon', parent: 'arm_r', pivot: [5, 11, 0], cubes: [B([4.5, 4, -0.5], [1, 26, 1], statue), B([5, 26, -0.5], [0, 4, 10], statue, { mask: (f, x, y, w, h) => y >= Math.round(x * 0.3) && y <= Math.round(x * 0.3) + 2 })] },
  ] },
  // Phrog Parasite (elite): a bloated yellow-green sac with dark spots, orange worms writhing out of it, frog legs.
  phrog_parasite: { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 8, 0], cubes: [...blob(0, 3, 0, 14, 13, 13, withPattern(phrogY, spots(12, '#4a4418', 14)))] },
    ...[0, 1, 2, 3, 4, 5].map(i => ({ name: 'tent_' + i, parent: 'body', pivot: [Math.round(Math.cos(i) * 5), 12 + (i % 3), Math.round(Math.sin(i) * 5)], rot: [Math.round(Math.sin(i * 2) * 50), 0, Math.round(Math.cos(i * 2) * 50)],
      cubes: [B([Math.round(Math.cos(i) * 5) - 1, 12 + (i % 3), Math.round(Math.sin(i) * 5) - 1], [2, 7, 2], withPattern(wormO, rings(2)))] })),
    ...[['leg_l', -1], ['leg_r', 1]].map(([n, s]) => ({ name: n, parent: 'body', pivot: [s * 5, 5, 2], cubes: [B([s * 5 - 1.5, 0, -1], [3, 5, 5], phrogY), B([s * 5 - 2, 0, -3], [4, 1, 3], phrogY)] })),
  ] },
  // Vantom (boss): a hunched figure of dripping ink speckled with glowing yellow spots, one arm a long whip ending in a hooked blade.
  vantom: { render: 'cutout', glow: true, bones: [
    { name: 'body', pivot: [0, 10, 0], cubes: [B([-5, 8, -3], [10, 11, 7], withPattern(ink, spots(14, '#f4e470', 6))), B([-6, 0, -4], [12, 8, 9], withPattern(ink, (f, x, y) => (h2(x, y, 2) < 6 ? -0.8 : 0)), { mask: (f, x, y, w, h) => f === 'up' || y >= hash(x, 3) % 3 })] },
    { name: 'head', parent: 'body', pivot: [0, 19, 0], cubes: [...blob(0, 19, -1, 7, 7, 6, ink), B([-2, 22, -4.1], [4, 2, 0], inkEye, { mask: (f, x) => x !== 1 && x !== 2 })] },
    { name: 'arm_l', parent: 'body', pivot: [-5, 17, 0], rot: [0, 0, 30], cubes: [B([-8, 8, -1.5], [3, 9, 3], ink)] },
    { name: 'arm_r', parent: 'body', pivot: [5, 17, 0], rot: [-40, 0, -50], cubes: [B([5, 16, -1], [12, 2, 2], withPattern(ink, spots(15, '#f4e470', 8)))] },
    { name: 'tail', parent: 'arm_r', pivot: [17, 17, 0], rot: [0, 0, 40], cubes: [B([17, 16.5, -0.5], [12, 1, 1], ink), B([28, 15, 0], [6, 4, 0], steel, { mask: (f, x, y) => y === Math.round(x * 0.5) || y === Math.round(x * 0.5) + 1 })] },
  ] },
  // Kin Priest (boss): a hunched figure lost in a shaggy green-straw mantle, a pale mask, a crooked staff with a green flame.
  kin_priest: { render: 'cutout', glow: true, bones: [
    { name: 'body', pivot: [0, 8, 0], rot: [15, 0, 0], cubes: [...blob(0, 2, 0, 14, 16, 12, withPattern(kinGreen, strands)), B([-7.5, 1, -6.5], [15, 16, 0], withPattern(kinGreen, strands), { mask: ragged(3, 7) })] },
    { name: 'head', parent: 'body', pivot: [0, 15, -5], cubes: [B([-3, 11, -8], [6, 6, 3], R('#f0e8d0', '#d8ccb0', '#bcae90'), { detail: face((x, y) => ((x === 1 || x === 4) && y === 2 ? '#2a2018' : null)) }), B([-5, 16, -8], [10, 3, 6], withPattern(kinGreen, strands), { mask: tufts(2, 3) })] },
    { name: 'arm_r', parent: 'body', pivot: [6, 12, -2], rot: [-10, 0, 0], cubes: [B([5, 6, -3], [3, 6, 3], kinGreen)] },
    { name: 'weapon', parent: 'arm_r', pivot: [7, 6, -2], cubes: [B([6.5, -6, -2.5], [1, 28, 1], R('#a88050', '#866038', '#664424')), B([5.5, 22, -3.5], [3, 3, 3], glowing(R('#d8ffd0', '#90f0a0', '#50d070')))] },
    { name: 'leg_l', parent: 'body', pivot: [-3, 2, 0], cubes: [B([-5, 0, -2], [3, 2, 4], kinBlue)] },
    { name: 'leg_r', parent: 'body', pivot: [3, 2, 0], cubes: [B([2, 0, -2], [3, 2, 4], kinBlue)] },
  ] },
  // Kin Follower: a round shaggy straw body on blue legs, blue arms, a hooked boomerang-trident.
  kin_follower: { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 6, 0], cubes: [...blob(0, 4, 0, 12, 11, 11, withPattern(kinFur, strands)), B([-6.5, 3, -5.8], [13, 12, 0], withPattern(kinFur, strands), { mask: ragged(2, 9) })] },
    { name: 'head', parent: 'body', pivot: [0, 12, -5], cubes: [B([-3, 9, -6.5], [6, 3, 1], R('#d8e4ec', '#b4c4d0'), { detail: face(at([[1, 1], [4, 1]], '#1a2028')) })] },
    { name: 'arm_l', parent: 'body', pivot: [-6, 9, 0], cubes: [B([-8, 5, -1], [2, 5, 2], kinBlue)] },
    { name: 'arm_r', parent: 'body', pivot: [6, 9, 0], rot: [-30, 0, 0], cubes: [B([6, 5, -1], [2, 5, 2], kinBlue)] },
    { name: 'weapon', parent: 'arm_r', pivot: [7, 5, 0], cubes: [B([6.5, -2, -0.5], [1, 14, 1], steel), B([4, 10, -0.5], [6, 1, 1], steel), B([4, 11, -0.5], [1, 3, 1], steel), B([9, 11, -0.5], [1, 3, 1], steel)] },
    { name: 'leg_l', parent: 'body', pivot: [-3, 4, 0], cubes: [B([-4.5, 0, -1], [2, 4, 2], kinBlue)] },
    { name: 'leg_r', parent: 'body', pivot: [3, 4, 0], cubes: [B([2.5, 0, -1], [2, 4, 2], kinBlue)] },
  ] },

  // ================================================================ Underdocks
  // Sludge Spinner: a spinning top of oily iridescent sludge - a broad sheen-streaked dome on a single black spike.
  sludge_spinner: { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 8, 0], cubes: [B([-0.5, 0, -0.5], [1, 6, 1], R('#2a2a30', '#1a1a20')),
      B([-7, 6, -7], [14, 3, 14], withPattern(oil, (f, x, y) => ((x + y * 2) % 6) - 2.5)), ...blob(0, 9, 0, 10, 5, 10, withPattern(oil, (f, x, y) => ((x * 2 + y) % 6) - 2.5)),
      B([-1, 14, -1], [2, 2, 2], R('#f4a0b0', '#e07888'))] },
    { name: 'head', parent: 'body', pivot: [0, 12, -4], cubes: [B([-2, 9, -6], [4, 2, 1], R('#1a1a20', '#101014'), { detail: face(at([[0, 0], [3, 0]], '#ffffff')) })] },
  ] },
  // the two cultists: fish-faced figures in long sea-blue robes, hooked spears; the calcified one crusted white
  calcified_cultist: biped({ torso: withPattern(cultBlue, cloth), headMat: withPattern(fishSkin, (f, x, y) => (y > 4 ? 0.6 : 0)), legs: cultBlue, arms: fishSkin,
    face: (x, y) => (y === 3 && (x === 1 || x === 6) ? '#101818' : y === 6 && x >= 2 && x <= 5 ? '#2a3a38' : null),
    parts: { head: [B([-3, 32, -3], [6, 2, 6], withPattern(R('#fffcf4', '#ece4d4', '#d4c8b0'), stone)), B([-1, 34, -1], [2, 2, 2], boneW)], body: [B([-4.5, 2, -2.5], [9, 10, 5], withPattern(cultBlue, cloth))] },
    extra: [{ name: 'weapon', parent: 'arm_r', pivot: [6, 13, 0], cubes: [B([5.5, -4, -0.5], [1, 30, 1], R('#d8c8a8', '#b4a484')), B([5.5, 26, -0.5], [4, 1, 1], steel), B([8.5, 23, -0.5], [1, 3, 1], steel)] }] }),
  damp_cultist: biped({ torso: withPattern(R('#6a90a8', '#4c7088', '#34546a', '#243c4e'), cloth), headMat: fishSkin, legs: cultBlue, arms: fishSkin,
    face: (x, y) => (y === 3 && (x === 1 || x === 6) ? '#101818' : y === 6 && x >= 2 && x <= 5 ? '#2a3a38' : null),
    parts: { head: [B([-4.5, 28, -4.5], [9, 5, 9], withPattern(R('#4a6a58', '#365042'), strands), { mask: (f, x, y, w, h) => f !== 'north' || y < 2 })], body: [B([-4.5, 2, -2.5], [9, 10, 5], withPattern(cultBlue, cloth))] },
    extra: [{ name: 'weapon', parent: 'arm_r', pivot: [6, 13, 0], cubes: [B([5.5, -4, -0.5], [1, 30, 1], leather), B([5.5, 26, -0.5], [1, 5, 1], steel)] }] }),
  // Living Fog: a drifting bank of mauve smog with a lamprey ring of teeth and glowing pink pearls.
  living_fog: { render: 'translucent', glow: true, bones: [
    { name: 'body', pivot: [0, 10, 0], cubes: [...blob(0, 4, 0, 14, 12, 12, withPattern(fog, (f, x, y) => (h2(x, y, 8) < 12 ? -0.8 : 0))), ...blob(3, 13, 2, 10, 8, 9, fog), ...blob(-2, 18, 4, 7, 7, 7, fog)] },
    { name: 'head', parent: 'body', pivot: [0, 10, -6], cubes: [B([-4, 6, -6.2], [8, 7, 0], R('#2a1018', '#1a0810'), { mask: disc, detail: { north: (x, y) => (Math.hypot(x - 3.5, y - 3) > 2.6 ? '#fffaf0' : null) } })] },
    { name: 'orbit', parent: 'body', pivot: [0, 10, 0], cubes: [[-7, 8, -5], [6, 6, -6], [-6, 13, -4], [5, 12, -5], [0, 4, -6.5]].map(([x, y, z]) => B([x, y, z], [2, 2, 2], pinkOrb)) },
  ] },
  gas_bomb: { render: 'translucent', glow: true, bones: [
    { name: 'body', pivot: [0, 5, 0], cubes: [...blob(0, 2, 0, 7, 7, 7, fog), B([-2, 4, -3.6], [4, 3, 0], glowing(R('#ffe0ff', '#f090e0')), { mask: (f, x, y) => (x + y) % 2 === 0 })] },
  ] },
  // Fossil Stalker: a porous lump of yellow honeycomb coral scuttling on red-pink tentacle legs.
  fossil_stalker: { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 6, 0], cubes: [...blob(0, 3, 0, 12, 10, 11, withPattern(coral, (f, x, y) => ((x + (Math.floor(y / 2) % 2)) % 2 === 0 && y % 2 === 0 ? '#a07830' : 0)))] },
    ...[-1, 1].flatMap(s => [-3, 0, 3].map((z, i) => ({ name: 'leg_' + (s < 0 ? 'l' : 'r') + i, parent: 'body', pivot: [s * 5, 5, z], rot: [0, (1 - i) * 25 * s, s * 30], cubes: [
      B([s < 0 ? -11 : 5, 4, z - 1], [6, 2, 2], coralRed), B([s < 0 ? -11 : 9, -1, z - 0.5], [2, 5, 1], coralRed)] }))),
    { name: 'head', parent: 'body', pivot: [0, 8, -5], cubes: [B([-3, 10, -6], [1, 5, 1], coralRed), B([2, 10, -6], [1, 5, 1], coralRed)] },
  ] },
  // Gremlin Merc: a small hooded cutthroat - horned brown hood, black face with yellow eyes, tattered cape, a dagger.
  gremlin_merc: { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 7, 0], cubes: [B([-3, 3, -2], [6, 8, 4], withPattern(R('#8aa098', '#6c8078', '#52625c'), cloth)), B([-3.5, 0, -2.5], [7, 4, 5], R('#7a8a6a', '#5e6c50'))] },
    { name: 'head', parent: 'body', pivot: [0, 11, 0], cubes: [B([-3.5, 11, -3.5], [7, 8, 7], withPattern(hood, cloth), { detail: face((x, y) => (x >= 1 && x <= 5 && y >= 2 && y <= 6 ? (y === 3 && (x === 2 || x === 4) ? '#f4d040' : '#141010') : null)) }),
      B([-5, 17, -1], [2, 3, 2], boneW), B([3, 17, -1], [2, 3, 2], boneW)] },
    { name: 'cape', parent: 'body', pivot: [0, 11, 2], cubes: [B([-4, 0, 2.2], [8, 11, 0], withPattern(R('#8a3a30', '#6c2a22'), cloth), { mask: ragged(2, 3) })] },
    { name: 'arm_l', parent: 'body', pivot: [-3, 10, 0], cubes: [B([-5, 4, -1], [2, 6, 2], hood)] },
    { name: 'arm_r', parent: 'body', pivot: [3, 10, 0], rot: [-40, 0, 0], cubes: [B([3, 4, -1], [2, 6, 2], hood), B([3.5, -1, -0.5], [1, 5, 1], steel)] },
    { name: 'leg_l', parent: 'body', pivot: [-1.5, 3, 0], cubes: [B([-2.5, 0, -1], [2, 3, 2], R('#3a2a20', '#2a1e16'))] },
    { name: 'leg_r', parent: 'body', pivot: [1.5, 3, 0], cubes: [B([0.5, 0, -1], [2, 3, 2], R('#3a2a20', '#2a1e16'))] },
  ] },
  fat_gremlin: { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 5, 0], cubes: [...blob(0, 2, 0, 9, 9, 8, gremRed), B([-2, 7, -4.1], [4, 2, 0], R('#4a1010', '#2a0808'))] },
    { name: 'head', parent: 'body', pivot: [0, 11, 0], cubes: [...blob(0, 11, 0, 7, 6, 6, R('#f0dcae', '#d8c08c', '#bca06c')), B([-1, 13, -3.1], [2, 2, 0], R('#c84040', '#a03030'))] },
    { name: 'arm_l', parent: 'body', pivot: [-4, 9, 0], rot: [0, 0, 150], cubes: [B([-5, 2, -1], [2, 7, 2], gremRed)] },
    { name: 'arm_r', parent: 'body', pivot: [4, 9, 0], rot: [0, 0, -150], cubes: [B([3, 2, -1], [2, 7, 2], gremRed)] },
    { name: 'leg_l', parent: 'body', pivot: [-2, 2, 0], cubes: [B([-3.5, 0, -1], [3, 2, 3], gremRed)] },
    { name: 'leg_r', parent: 'body', pivot: [2, 2, 0], cubes: [B([0.5, 0, -1], [3, 2, 3], gremRed)] },
  ] },
  sneaky_gremlin: { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 5, 0], cubes: [B([-3, 3, -2], [6, 6, 4], gremPink), B([-3.5, 8, -2.5], [7, 2, 5], R('#8a3a20', '#6a2a16'))] },
    { name: 'head', parent: 'body', pivot: [0, 10, 0], cubes: [B([-3, 10, -3], [6, 6, 6], gremPink, { detail: face((x, y) => (y === 2 && (x === 1 || x === 4) ? '#40e0c0' : y === 4 && x >= 1 && x <= 4 ? '#5a2030' : null)) }),
      B([-4.5, 14, -1], [2, 2, 2], R('#a8b8c8', '#8a9aac')), B([2.5, 14, -1], [2, 2, 2], R('#a8b8c8', '#8a9aac'))] },
    { name: 'arm_l', parent: 'body', pivot: [-3, 8, 0], cubes: [B([-5, 3, -1], [2, 5, 2], gremPink)] },
    { name: 'arm_r', parent: 'body', pivot: [3, 8, 0], rot: [-70, 0, 0], cubes: [B([3, 3, -1], [2, 5, 2], gremPink), B([3.5, -6, -0.5], [1, 9, 2], steel)] },
    { name: 'leg_l', parent: 'body', pivot: [-1.5, 3, 0], cubes: [B([-2.5, 0, -1], [2, 3, 2], gremPink)] },
    { name: 'leg_r', parent: 'body', pivot: [1.5, 3, 0], cubes: [B([0.5, 0, -1], [2, 3, 2], gremPink)] },
  ] },
  // Haunted Ship: a broken wooden hull scuttling on grey crab legs, a heap of ghostly gold inside, a stump of a mast.
  haunted_ship: { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 8, 0], cubes: [B([-6, 6, -12], [12, 6, 24], withPattern(hull, wood)), B([-5, 5, -10], [10, 1, 20], hull), B([-5, 12, -13], [10, 3, 3], hull),
      ...blob(0, 11, 0, 9, 4, 16, withPattern(gold, (f, x, y) => ((x + y) % 3 === 0 ? -1 : 0.4))), B([-1, 12, 5], [2, 12, 2], hull)] },
    ...[-1, 1].flatMap(s => [-7, -2, 3, 8].map((z, i) => ({ name: 'leg_' + (s < 0 ? 'l' : 'r') + i, parent: 'body', pivot: [s * 6, 7, z], rot: [0, 0, s * 40], cubes: [
      B([s < 0 ? -12 : 6, 6.5, z - 1], [6, 2, 2], crabGrey), B([s < 0 ? -12 : 10, 0, z - 0.5], [2, 7, 1], crabGrey)] }))),
  ] },
  // Punch Construct: a tan clockwork boxer - visored head with a cyan slit, segmented limbs, big fists up.
  punch_construct: biped({ torso: withPattern(robot, metal), headMat: robot, legs: withPattern(robot, metal), arms: withPattern(robot, metal),
    face: (x, y) => (y >= 2 && y <= 3 && x >= 1 && x <= 6 ? (y === 2 ? '#a0f0ff' : '#40b8d8') : null),
    parts: { arm_l: [B([-9, 10, -3], [6, 5, 6], withPattern(robot, metal))], arm_r: [B([3, 10, -3], [6, 5, 6], withPattern(robot, metal))] } }),
  // Sewer Clam: a giant clam with a wavy purple shell lip and branching orange coral growing on its top.
  sewer_clam: { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 4, 0], cubes: [B([-8, 0, -6], [16, 5, 12], withPattern(clamShell, (f, x) => (x % 3 === 0 ? 1 : 0))),
      B([-8.5, 4, -6.5], [17, 2, 13], withPattern(R('#f0e8ff', '#c8b0f0', '#9474c4'), (f, x, y) => ((x + y) % 2 ? 1 : -0.6)))] },
    { name: 'head', parent: 'body', pivot: [0, 6, 4], cubes: [B([-7.5, 6, -5.5], [15, 4, 11], withPattern(clamShell, (f, x) => (x % 3 === 0 ? 1 : 0))),
      ...[[-5, 0], [-1, 2], [3, -1], [6, 2]].map(([x, z], i) => B([x, 10, z], [1, 6 + i % 3, 1], coralRed)), B([-5, 14, 0], [4, 1, 1], coralRed), B([2, 15, -1], [5, 1, 1], coralRed)] },
  ] },
  // Skulking Colony (elite): a figure built of coral - rust-red branching coral and pale blue coral knobs, lurching.
  skulking_colony: { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 10, 0], rot: [15, 0, 0], cubes: [B([-3, 9, -2], [6, 10, 4], withPattern(coralRed, stone)), ...blob(0, 16, 0, 8, 6, 6, withPattern(coralBlue, stone))] },
    { name: 'head', parent: 'body', pivot: [0, 22, 0], cubes: [B([-2, 22, -2], [4, 3, 4], coralRed), B([-3, 25, -1], [1, 4, 1], coralRed), B([1, 25, 0], [1, 5, 1], coralRed), B([-1, 27, -1], [2, 3, 1], coralBlue)] },
    { name: 'arm_l', parent: 'body', pivot: [-3, 18, 0], rot: [0, 0, 15], cubes: [B([-5, 6, -1], [2, 12, 2], withPattern(coralRed, stone)), B([-6, 4, -1.5], [3, 3, 3], coralBlue)] },
    { name: 'arm_r', parent: 'body', pivot: [3, 18, 0], rot: [0, 0, -15], cubes: [B([3, 6, -1], [2, 12, 2], withPattern(coralBlue, stone)), B([3, 4, -1.5], [3, 3, 3], coralRed)] },
    { name: 'leg_l', parent: 'body', pivot: [-2, 9, 0], cubes: [B([-3, 0, -1], [2, 9, 2], coralRed)] },
    { name: 'leg_r', parent: 'body', pivot: [2, 9, 0], cubes: [B([1, 0, -1], [2, 9, 2], coralBlue)] },
  ] },
  // Phantasmal Gardener: a tall swaying tan stalk crowned with a red frilled flower, a translucent tendril trailing.
  phantasmal_gardener: { render: 'translucent', bones: [
    { name: 'body', pivot: [0, 0, 0], cubes: [B([-1.5, 0, -1.5], [3, 8, 3], withPattern(gardener, rings(3)))] },
    { name: 'seg_1', parent: 'body', pivot: [0, 8, 0], rot: [10, 0, 0], cubes: [B([-1, 8, -1], [2, 8, 2], withPattern(gardener, rings(3)))] },
    { name: 'head', parent: 'seg_1', pivot: [0, 16, 0], rot: [-25, 0, 0], cubes: [B([-1, 16, -1], [2, 4, 2], gardener), B([-3, 20, -1], [6, 5, 0], flower, { mask: (f, x, y) => y >= Math.abs(x - 2.5) - 1 }), B([0, 19, -3], [0, 6, 6], flower, { mask: (f, x, y) => y >= Math.abs(x - 2.5) - 1 })] },
    { name: 'tent_0', parent: 'seg_1', pivot: [0, 12, 0], rot: [0, 0, 30], cubes: [B([0, 4, 0], [0, 8, 3], { ramp: ['#d0ffff', '#90e8f0'], alpha: 140 }, { mask: leafMask })] },
  ] },
  // Waterfall Giant (boss): a hulking four-legged mound of mossy rock, water pouring off its back in sheets.
  waterfall_giant: { render: 'translucent', bones: [
    { name: 'body', pivot: [0, 14, 0], cubes: [...blob(0, 10, 0, 22, 14, 26, withPattern(mossStone, stone)), B([-9, 24, -8], [18, 3, 16], withPattern(R('#9ac070', '#7aa058', '#5e8044'), stone))] },
    { name: 'head', parent: 'body', pivot: [0, 18, -12], cubes: [...blob(0, 12, -18, 12, 10, 9, withPattern(mossStone, stone)), B([-4, 15, -22.6], [8, 1, 0], R('#c8f0ff', '#90d0f0'))] },
    { name: 'tent_0', parent: 'body', pivot: [0, 24, 0], cubes: [B([-10, 0, -12.5], [20, 24, 0], water, { mask: (f, x, y) => (x + Math.floor(y / 3)) % 4 !== 3 }), B([-11.2, 2, -10], [0, 22, 20], water, { mask: (f, x, y) => (x + Math.floor(y / 3)) % 4 !== 0 }), B([11.2, 2, -10], [0, 22, 20], water, { mask: (f, x, y) => (x + Math.floor(y / 3)) % 4 !== 1 })] },
    ...[['leg_fl', -1, -8], ['leg_fr', 1, -8], ['leg_bl', -1, 8], ['leg_br', 1, 8]].map(([n, s, z]) => ({ name: n, parent: 'body', pivot: [s * 8, 10, z], cubes: [B([s * 8 - 3.5, 0, z - 3.5], [7, 11, 7], withPattern(mossStone, stone))] })),
  ] },
  // Lagavulin Matriarch (boss): a great orange hermit crab under a heaped shell of pale, rounded stones.
  lagavulin_matriarch: { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 8, 4], cubes: [...blob(0, 6, 4, 18, 16, 16, withPattern(pebbleShell, (f, x, y) => ((x % 5 === 0 || y % 4 === 0) ? 1 : (x + y) % 3 === 0 ? -0.6 : 0))), ...blob(2, 20, 6, 10, 7, 10, pebbleShell)] },
    { name: 'head', parent: 'body', pivot: [0, 8, -4], cubes: [B([-5, 3, -8], [10, 6, 6], crabOrange), B([-3, 9, -7], [1, 4, 1], crabOrange), B([2, 9, -7], [1, 4, 1], crabOrange), B([-3.5, 13, -7.5], [2, 2, 2], R('#202020', '#101010')), B([1.5, 13, -7.5], [2, 2, 2], R('#202020', '#101010'))] },
    ...[['arm_l', -1], ['arm_r', 1]].map(([n, s]) => ({ name: n, parent: 'head', pivot: [s * 5, 6, -6], rot: [0, s * -20, 0], cubes: [B([s < 0 ? -10 : 5, 4, -9], [5, 4, 4], crabOrange), B([s < 0 ? -13 : 8, 3, -15], [6, 6, 7], crabOrange), B([s < 0 ? -12 : 9, 3, -18], [4, 2, 3], crabOrange)] })),
    ...sixLegs(crabOrange, 5, 6, [-3, 1, 5], 6),
  ] },

  // ================================================================ Hive
  // Ovicopter: a fat white fuzzy fly - big dark-red eyes, translucent wings, a green egg-sac abdomen it lays from.
  ovicopter: { render: 'translucent', bones: [
    { name: 'body', pivot: [0, 10, 0], cubes: [...blob(0, 7, -2, 10, 9, 9, withPattern(fuzzWhite, strands)), ...blob(0, 5, 7, 10, 9, 10, withPattern(eggTeal, spots(9, '#2a8070', 12)))] },
    { name: 'head', parent: 'body', pivot: [0, 11, -6], cubes: [...blob(0, 8, -8, 7, 6, 5, fuzzWhite), B([-4, 10, -10], [3, 3, 3], R('#c05040', '#902c24')), B([1, 10, -10], [3, 3, 3], R('#c05040', '#902c24'))] },
    ...[['wing_l', -1], ['wing_r', 1]].map(([n, s]) => ({ name: n, parent: 'body', pivot: [s * 3, 16, -1], rot: [-10, 0, s * -20], cubes: [B([s < 0 ? -15 : 3, 16, -4], [12, 0, 6], flyWing, { mask: leafMask })] })),
    ...sixLegs(R('#e09050', '#c07038'), 7, 4, [-4, -1, 2], 4, 20),
  ] },
  tough_egg: { render: 'cutout', bones: [{ name: 'body', pivot: [0, 0, 0], cubes: [...blob(0, 0, 0, 8, 9, 8, withPattern(eggTeal, spots(17, '#2a8070', 12)))] }] },
  // Hatchling: a round white grub-fly - big black eyes ringed cyan, orange legs, little wings.
  hatchling: { render: 'translucent', bones: [
    { name: 'body', pivot: [0, 5, 0], cubes: [...blob(0, 2, 0, 9, 8, 9, withPattern(fuzzWhite, (f, x, y) => (y % 3 === 0 ? 0.5 : 0)))] },
    { name: 'head', parent: 'body', pivot: [0, 5, -4], cubes: [B([-3.5, 3, -4.6], [7, 3, 0], R('#101418', '#08090a'), { mask: (f, x) => x !== 3, detail: face((x, y) => (y === 1 && (x === 0 || x === 6) ? '#58d8f0' : null)) })] },
    ...[['wing_l', -1], ['wing_r', 1]].map(([n, s]) => ({ name: n, parent: 'body', pivot: [s * 2, 9, 0], rot: [0, 0, s * -30], cubes: [B([s < 0 ? -8 : 2, 9, -1], [6, 0, 4], flyWing, { mask: leafMask })] })),
    ...sixLegs(R('#f0a050', '#d07830'), 3, 3, [-2, 0, 2], 3, 20),
  ] },
  // Tunneler: a maroon mole cricket - a ribbed abdomen, a domed thorax, a pink snout and two huge digging claws.
  tunneler: { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 6, 2], cubes: [B([-5, 2, 0], [10, 8, 10], withPattern(maroon, plates(2))), B([-6, 7, -6], [12, 7, 7], withPattern(maroon, (f, x, y) => (f === 'up' ? 0 : y % 3 === 0 ? 0.8 : 0)))] },
    { name: 'head', parent: 'body', pivot: [0, 9, -6], cubes: [B([-3.5, 6, -10], [7, 6, 4], maroon), B([-2, 6.5, -11], [4, 3, 1], R('#f8b8c8', '#e090a8')), B([-3, 11, -9], [1, 4, 1], R('#3a1a24', '#2a1018')), B([2, 11, -9], [1, 4, 1], R('#3a1a24', '#2a1018'))] },
    ...[['arm_l', -1], ['arm_r', 1]].map(([n, s]) => ({ name: n, parent: 'body', pivot: [s * 6, 9, -4], rot: [20, 0, s * 20], cubes: [B([s < 0 ? -10 : 6, 4, -7], [4, 6, 5], maroon), B([s < 0 ? -11 : 6, 1, -9], [5, 3, 6], withPattern(maroon, (f, x) => (x % 2 ? -0.8 : 0.6)))] })),
    ...sixLegs(R('#a04860', '#7e3448'), 4, 5, [2, 5, 8], 4, 20).filter(b => !b.name.endsWith('0')),
  ] },
  // Thieving Hopper: a lanky grasshopper - dark purple body, a yellow-green abdomen and long folded hind legs, antennae.
  thieving_hopper: { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 10, 0], rot: [-30, 0, 0], cubes: [B([-2.5, 7, -2], [5, 6, 5], hopperDark), B([-2, 5, 3], [4, 5, 9], withPattern(hopperGreen, rings(2)))] },
    { name: 'head', parent: 'body', pivot: [0, 13, -1], cubes: [B([-2.5, 13, -4], [5, 5, 4], withPattern(hopperGreen, (f, x, y) => (y < 2 ? 1 : 0)), { detail: face(at([[0, 1], [4, 1]], '#101010')) }),
      B([-2, 18, -3], [1, 6, 1], hopperDark), B([1, 18, -3], [1, 6, 1], hopperDark)] },
    ...[['leg_l', -1], ['leg_r', 1]].map(([n, s]) => ({ name: n, parent: 'body', pivot: [s * 2.5, 8, 3], rot: [-60, 0, 0], cubes: [B([s * 3 - 1, 0, 2], [2, 9, 2], hopperGreen), B([s * 3 - 0.5, -6, 3], [1, 7, 1], hopperGreen)] })),
    ...[['arm_l', -1], ['arm_r', 1]].map(([n, s]) => ({ name: n, parent: 'body', pivot: [s * 2, 9, -1], rot: [30, 0, 0], cubes: [B([s * 2.5 - 0.5, 2, -1.5], [1, 7, 1], hopperGreen)] })),
  ] },
  // Hunter Killer: a crouching red wyrm-wasp - a dragon's head with a golden ring in its jaws, small wings, a ridged tail.
  hunter_killer: { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 9, 0], cubes: [B([-4, 6, -5], [8, 7, 11], withPattern(dragonRed, (f, x, y) => (f === 'up' && x % 2 ? 0.8 : 0)))] },
    { name: 'head', parent: 'body', pivot: [0, 11, -5], cubes: [B([-3, 9, -11], [6, 5, 6], dragonRed, { detail: { east: at([[1, 1]], '#f8e040'), west: at([[4, 1]], '#f8e040') } }), B([-2.5, 8, -15], [5, 3, 4], dragonRed),
      B([-3, 7, -17], [6, 4, 0], glowing(R('#fff4a0', '#f0d040')), { mask: (f, x, y) => !(x >= 1 && x <= 4 && y >= 1 && y <= 2) }), B([-3, 14, -9], [1, 3, 1], dragonRed), B([2, 14, -9], [1, 3, 1], dragonRed)] },
    ...[['wing_l', -1], ['wing_r', 1]].map(([n, s]) => ({ name: n, parent: 'body', pivot: [s * 3, 13, -2], rot: [-20, 0, s * -30], cubes: [B([s < 0 ? -11 : 3, 13, -4], [8, 0, 7], { ramp: ['#f8c0b0', '#e09888'], alpha: 170 }, { mask: leafMask })] })),
    ...[['leg_fl', -1, -3], ['leg_fr', 1, -3], ['leg_bl', -1, 4], ['leg_br', 1, 4]].map(([n, s, z]) => ({ name: n, parent: 'body', pivot: [s * 4, 7, z], cubes: [B([s * 4 - 1, 0, z - 1], [2, 7, 2], dragonRed), B([s * 4 - 1.5, 0, z - 2.5], [3, 1, 2], R('#f4d080', '#d0a858'))] })),
    { name: 'tail', parent: 'body', pivot: [0, 10, 6], rot: [-15, 0, 0], cubes: [B([-1.5, 8.5, 6], [3, 3, 8], dragonRed)] },
    { name: 'tail_1', parent: 'tail', pivot: [0, 10, 14], rot: [20, 0, 0], cubes: [B([-1, 9, 14], [2, 2, 7], dragonRed), B([0, 11, 15], [0, 2, 5], R('#f4d080', '#d0a858'))] },
  ] },
  // Louse Progenitor: a huge pill bug - banded blue and yellow plates arching over many little legs, feelers in front.
  louse_progenitor: { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 6, 0], cubes: [...[0, 1, 2, 3, 4, 5].map(i => B([-7 + (i === 0 || i === 5 ? 1 : 0), 2, -9 + i * 3], [i === 0 || i === 5 ? 12 : 14, i === 0 || i === 5 ? 8 : 10, 3],
      withPattern(i % 2 ? louseYellow : louseBlue, (f, x, y) => (f === 'up' ? (y === 0 ? 1 : 0) : y === 0 ? -0.6 : (x + y) % 5 === 0 ? 0.7 : 0))))] },
    { name: 'head', parent: 'body', pivot: [0, 5, -9], cubes: [B([-4, 2, -11], [8, 5, 2], louseBlue), B([-3, 5, -15], [1, 1, 5], louseBlue), B([2, 5, -15], [1, 1, 5], louseBlue)] },
    ...sixLegs(R('#a88c50', '#8a7038'), 3, 6, [-5, 0, 5], 3, 15),
  ] },
  // Slumbering Beetle: a purple rhinoceros beetle with a great curved horn and green spots on its wing cases.
  slumbering_beetle: { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 6, 0], cubes: [B([-6, 3, -4], [12, 8, 14], withPattern(beetlePurple, (f, x, y) => (f === 'up' && x === 6 ? 1.2 : h2(Math.floor(x / 2), Math.floor(y / 2), 23) < 9 ? '#6ac090' : 0)))] },
    { name: 'head', parent: 'body', pivot: [0, 7, -4], cubes: [B([-4, 4, -9], [8, 6, 5], beetlePurple), B([-1.5, 7, -16], [3, 3, 7], R('#c8a8d8', '#a888c0', '#8868a4')), B([-1, 10, -17], [2, 4, 2], R('#c8a8d8', '#a888c0'))] },
    ...sixLegs(R('#6a4e80', '#4e3a60'), 4, 6, [-2, 3, 8], 4, 20),
  ] },
  // Spiny Toad: a squat green toad bristling with dark horns, orange eyes, red warts, a pale belly.
  spiny_toad: { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 6, 0], cubes: [...blob(0, 2, 1, 14, 10, 13, withPattern(toadGreen, spots(25, '#c04848', 8))), B([-5, 2, -5.6], [10, 5, 0], R('#f0ecd0', '#d8d0b0')),
      ...[[-4, 12, -2], [0, 12, 1], [4, 12, -1], [-6, 9, 4], [6, 9, 3], [-2, 11, 5], [3, 11, 6]].map(([x, y, z]) => B([x - 0.5, y, z - 0.5], [1, 3, 1], R('#3a4a40', '#26322a')))] },
    { name: 'head', parent: 'body', pivot: [0, 8, -5], cubes: [B([-6, 5, -9], [12, 6, 5], toadGreen, { detail: face((x, y) => (y === 5 ? '#2a3a30' : null)) }), B([-6, 10, -8], [3, 3, 3], R('#ffb050', '#e08030')), B([3, 10, -8], [3, 3, 3], R('#ffb050', '#e08030')),
      B([-6, 12, -6], [1, 4, 1], R('#3a4a40', '#26322a')), B([5, 12, -6], [1, 4, 1], R('#3a4a40', '#26322a'))] },
    ...[['leg_fl', -1, -4], ['leg_fr', 1, -4], ['leg_bl', -1, 5], ['leg_br', 1, 5]].map(([n, s, z]) => ({ name: n, parent: 'body', pivot: [s * 6, 4, z], cubes: [B([s * 6 - 1.5, 0, z - 1.5], [3, 4, 3], toadGreen), B([s * 6 - 2, 0, z - 3], [4, 1, 3], toadGreen)] })),
  ] },
  // The Obscura: a pale blue segmented eel-worm rearing from a curl, its back studded with eye-spots, a glowing cyan tip.
  obscura: { render: 'cutout', glow: true, bones: [
    { name: 'body', pivot: [0, 3, 2], cubes: [B([-3, 0, -2], [6, 5, 10], withPattern(obsBlue, spots(27, '#e8e0a0', 10)))] },
    { name: 'seg_1', parent: 'body', pivot: [0, 3, -2], rot: [-60, 0, 0], cubes: [B([-2.5, 0.5, -9], [5, 5, 7], withPattern(obsBlue, spots(28, '#e8e0a0', 10)))] },
    { name: 'seg_2', parent: 'seg_1', pivot: [0, 3, -9], rot: [-30, 0, 0], cubes: [B([-2, 1, -15], [4, 4, 6], withPattern(obsBlue, spots(29, '#e8e0a0', 10)))] },
    { name: 'head', parent: 'seg_2', pivot: [0, 3, -15], rot: [60, 0, 0], cubes: [B([-2, 1, -19], [4, 4, 4], obsBlue), B([-1, 2, -21], [2, 2, 2], glowing(R('#e0ffff', '#80f0ff', '#40d0f0')))] },
    { name: 'tail', parent: 'body', pivot: [0, 3, 8], rot: [0, 50, 0], cubes: [B([-2, 1, 8], [4, 3, 7], obsBlue), B([0, 4, 8], [0, 3, 7], R('#5070c0', '#3a58a0'), { mask: (f, x, y) => y >= x % 3 })] },
  ] },
  // Parafright: a translucent cyan spectre coiled like a nautilus, wisps for fins.
  parafright: { render: 'translucent', bones: [
    { name: 'body', pivot: [0, 10, 0], cubes: [...blob(0, 4, 0, 12, 12, 6, withPattern(paraCyan, (f, x, y) => (Math.hypot(x - 5.5, y - 5.5) < 3 ? 1.5 : 0))), B([-3, 12, -1], [6, 6, 2], paraCyan)] },
    { name: 'head', parent: 'body', pivot: [0, 14, 0], cubes: [B([-2, 14, -3.2], [4, 2, 0], R('#ffffff', '#c0ffff'), { mask: (f, x) => x !== 1 && x !== 2 })] },
    { name: 'tent_0', parent: 'body', pivot: [0, 6, 2], cubes: [B([0, -2, 2], [0, 8, 8], paraCyan, { mask: leafMask })] },
  ] },
  // Decimillipede (elite): a great centipede - dark blue armoured back plates over an orange belly and many orange legs.
  decimillipede: { render: 'cutout', bones: [
    { name: 'head', pivot: [0, 3, -6], cubes: [B([-3, 1, -9], [6, 5, 4], centiOrange, { detail: face(at([[1, 1], [4, 1]], '#1a1010')) }), B([-3, 0, -11], [2, 2, 2], centiOrange), B([1, 0, -11], [2, 2, 2], centiOrange)] },
    { name: 'body', parent: 'head', pivot: [0, 3, -5], cubes: [B([-3.5, 1, -5], [7, 5, 4], withPattern(centiBlue, plates(2)), { faceMat: { down: centiOrange } }), B([-5, 1, -4], [1, 1, 2], centiOrange), B([4, 1, -4], [1, 1, 2], centiOrange)] },
    ...chain(5, (i, z) => [B([-3.5, 1, z], [7, 5, 4], withPattern(centiBlue, plates(2)), { faceMat: { down: centiOrange } }), B([-5.5, 0, z + 1], [2, 1, 1], centiOrange), B([3.5, 0, z + 1], [2, 1, 1], centiOrange)], 'body', -1, 4),
  ] },
  // Infested Prism (elite): a red pyramid of a wasp nest with a dark hole and a single yellow eye, blue crystal shards orbiting it.
  infested_prism: { render: 'translucent', bones: [
    { name: 'body', pivot: [0, 6, 0], cubes: [B([-8, 4, -8], [16, 4, 16], withPattern(prismRed, plates(3))), B([-6, 8, -6], [12, 4, 12], withPattern(prismRed, plates(3))), B([-4, 12, -4], [8, 4, 8], prismRed), B([-2, 16, -2], [4, 3, 4], prismRed),
      B([-2.5, 7, -8.2], [5, 5, 0], R('#2a1010', '#1a0808'), { detail: face(at([[2, 2]], '#f8d040')) })] },
    { name: 'orbit', parent: 'body', pivot: [0, 10, 0], cubes: [[-12, 12, 0], [11, 8, -2], [0, 18, 9], [-2, 4, -11]].map(([x, y, z]) => B([x - 1.5, y, z - 1.5], [3, 5, 3], crystal)) },
  ] },
  // The Insatiable (boss): a sandworm rearing out of the dunes - blue-grey ringed hide, a round orange maw lined with teeth, feelers round its lip.
  insatiable: { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 0, 6], cubes: [B([-7, 0, 0], [14, 6, 16], withPattern(R('#e8d4a0', '#d4bc84', '#bca06a'), stone))] },
    { name: 'seg_1', parent: 'body', pivot: [0, 4, 2], rot: [-35, 0, 0], cubes: [B([-6, 2, -6], [12, 12, 10], withPattern(sandworm, rings(3)))] },
    { name: 'seg_2', parent: 'seg_1', pivot: [0, 8, -6], rot: [-25, 0, 0], cubes: [B([-5.5, 3, -14], [11, 11, 8], withPattern(sandworm, rings(3)))] },
    { name: 'head', parent: 'seg_2', pivot: [0, 8, -14], rot: [20, 0, 0], cubes: [B([-6, 2, -18], [12, 12, 4], sandworm,
      { detail: face((x, y) => { const d = Math.hypot(x - 5.5, y - 5.5); return d < 2.2 ? '#4a1810' : d < 3.6 ? '#e07a38' : d < 4.6 ? (Math.round(Math.atan2(y - 5.5, x - 5.5) * 3) % 2 ? '#fffaf0' : '#f8a858') : null; }) }),
      ...[0, 1, 2, 3, 4, 5].map(i => B([Math.round(Math.cos(i * 1.05) * 6) - 0.5, 8 + Math.round(Math.sin(i * 1.05) * 6), -19], [1, 1, 5], sandworm))] },
    ...[0, 1, 2, 3].map(i => ({ name: 'tent_' + i, parent: 'head', pivot: [i < 2 ? -6 : 6, i % 2 ? 4 : 12, -16], rot: [-30, i < 2 ? 30 : -30, 0], cubes: [B([i < 2 ? -6.5 : 5.5, i % 2 ? 3.5 : 11.5, -24], [1, 1, 8], sandworm)] })),
  ] },
};
