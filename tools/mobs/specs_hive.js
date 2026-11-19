// Phase 8 batch 3 (docs/design/mobs.md §10): the Hive. Same conventions as specs.js (pixels, y up, ground 0, front
// -Z; bones {name, pivot, parent?, rot?, cubes}; cubes {from, size, mat, faceMat?, detail?, mask?, inflate?}).
// Shapes traced from the STS2 renders (slaythespire.wiki.gg StS2_<Monster>.png): silhouette first, then the parts
// that identify each one (the bowlbug's eye stalk, cargo and hooked mandibles; the Chomper's jagged brass jaw and
// glowing orb; the Myte's spiny dome and cream pincers; the crab's flat carapace, armoured Crusher and purple Rocket;
// the demon's six arms, hood and halo over its green egg).
const R = (...ramp) => ({ ramp });
const withPattern = (m, pattern) => ({ ...m, pattern });
const glowing = m => ({ ...m, emissive: true });
const hash = (x, s) => ((x * 37 + s * 11) % 7 + 7) % 7;
const h2 = (x, y, s) => (((x * 73856093) ^ (y * 19349663) ^ (s * 83492791)) >>> 0) % 97;
const at = (pts, c) => (x, y) => (pts.some(([a, b]) => a === x && b === y) ? c : null);
const disc = (f, x, y, w, h) => Math.hypot(x - (w - 1) / 2, y - (h - 1) / 2) <= Math.min(w, h) / 2;
const ragged = (depth, seedN = 1) => (f, x, y, w, h) => y < h - (hash(x, seedN) % (depth + 1));

// ---- palettes (sampled from the renders, light → dark)
const bugRed = R('#f49a8c', '#e8746a', '#d4564e', '#b8403c', '#962e2e', '#742222');
const bugGreen = R('#d4e88a', '#b8d468', '#9cbc50', '#80a03e', '#648030', '#4a6024');
const bugPink = R('#f0d4d0', '#e0b8b4', '#cc9e9a', '#b48482', '#986a6a', '#7a5252');
const bugMagenta = R('#f6a8e8', '#e882d6', '#d064c0', '#b04aa4', '#8c3684', '#6a2664');
const bugLeg = (m) => R(...m.ramp.slice(1));
const yellow = R('#ffe27a', '#f6c84a', '#e0a832', '#bc8424');
const eyeCyan = R('#e8fffa', '#a8f0e6', '#6cd8cc', '#46b4aa');
const rock = R('#a8ac90', '#8e9278', '#767a62', '#60644e', '#4c503e', '#3a3e30');
const eggTeal = R('#a8ecea', '#7ed6d8', '#58bcc2', '#3c9ea8', '#2a808c');
const silk = R('#ffffff', '#f2f2f4', '#e0e0e6', '#cacad4', '#b0b0bc');
const nectarSac = { ramp: ['#ffe9a0', '#ffd468', '#f6b23c', '#e89428', '#c87418'], alpha: 235 };
const nectarRim = R('#fff2a8', '#ffe070', '#f6c848', '#e0a830');
const husk = R('#e2c69c', '#cca880', '#b28c64', '#94724e', '#76583a', '#5a422a');
const huskDark = R('#9a7650', '#7a5a3a', '#5e422a', '#46301e');
const brass = R('#fff0bc', '#f2d89a', '#dcbc7a', '#c09e5e', '#9c7c44', '#76592e');
const orb = glowing(R('#e8ffff', '#9cf6ff', '#54e0f4', '#26b8d8', '#1688b0'));
const mite = R('#f2a056', '#e08440', '#c86a30', '#a85224', '#86401c', '#663014');
const miteSpike = R('#ffb070', '#f08a48', '#d06a34');
const cream = R('#fff4d6', '#f8e2b2', '#ecc890', '#d6aa70');
const miteLeg = R('#d0603a', '#b04a2c', '#8c3a22', '#6c2c1a');
const suit = R('#7a8a5e', '#64744a', '#4e5c3a', '#3c482c');
const suitDark = R('#5a6448', '#46503a', '#363e2c', '#282e20');
const cloak = R('#fff27a', '#f2dc4a', '#dcbe2e', '#b89a22', '#8e7418');
const skin = R('#e8c0a0', '#d0a080', '#b08060');
const shaft = R('#5a4632', '#463626', '#34281c');
const gold = R('#fff2b0', '#f6d262', '#d6a232', '#9a6c1a');
const carapace = R('#7a6aa0', '#5e4e88', '#4a3c70', '#3a2e5a', '#2c2246', '#201834');
const crusher = R('#b4c4dc', '#94a8c6', '#788eae', '#5e7392', '#475876', '#33415a');
const rocket = R('#c4a4ec', '#a688d6', '#8a6cbc', '#70549e', '#583e80', '#422c62');
const crabEye = glowing(R('#e8ffd0', '#b4f08a', '#7ed05a'));
const demonGrey = R('#f2f2ee', '#dcdcd6', '#c2c2bc', '#a4a4a0', '#868684', '#6a6a6a');
const halo = R('#c49660', '#a87a46', '#8c6034', '#704a26');
const eggGreen = R('#b8f0a0', '#90d878', '#6cbc58', '#4e9a42', '#387c32', '#285e24');

/** A rounded lump: three overlapping boxes (one full along each axis, the others two texels shorter) - corners cut. */
const blob = (cx, y0, cz, w, h, d, mat) => [
  { from: [cx - w / 2, y0 + 1, cz - d / 2 + 1], size: [w, h - 2, d - 2], mat },
  { from: [cx - w / 2 + 1, y0, cz - d / 2 + 1], size: [w - 2, h, d - 2], mat },
  { from: [cx - w / 2 + 1, y0 + 1, cz - d / 2], size: [w - 2, h - 2, d], mat },
];

// ---- textures
/** Shell plates: wide segments with a lit leading edge and a dark seam. */
const platePat = (step) => (f, x, y, w, h) => {
  const t = f === 'up' || f === 'down' ? y : y;
  return t % step === 0 ? 1.2 : t % step === 1 ? -0.5 : 0;
};
/** Rough stone: angular facets (light upper-left planes, darker lower-right), a few dark cracks. */
const rockPat = (f, x, y) => {
  const facet = (Math.floor((x + y * 0.6) / 4) + Math.floor((y - x * 0.3) / 3)) % 3;
  return (facet === 0 ? -0.6 : facet === 1 ? 0.2 : 0.7) + (h2(x, y, 3) < 4 ? 1.2 : 0);
};
/** Silk ball: crossing thread bands. */
const silkPat = (f, x, y) => ((x + y) % 5 === 0 || (x - y + 40) % 6 === 0 ? 1.1 : (x * 3 + y) % 7 === 0 ? -0.6 : 0);
/** Egg spots: dark teal blotches. */
const eggPat = (f, x, y) => (h2(Math.floor(x / 2), Math.floor(y / 2), 5) < 14 ? 1.6 : (x + y) % 9 === 0 ? -0.5 : 0);
/** Husk rings: the cast skin's segments. */
const huskPat = (f, x, y, w, h) => (f === 'up' || f === 'down' ? (y % 3 === 0 ? 1 : 0) : (y % 3 === 0 ? 1.1 : y % 3 === 1 ? -0.5 : 0)) + (x % 4 === 0 ? 0.3 : 0);
/** Brass plates: panel lines and rivets. */
const brassPat = (f, x, y, w, h) => (x === 0 || y === 0 || x === w - 1 || y === h - 1 ? 0.9 : (x % 4 === 2 && y % 4 === 2) ? -0.9 : 0);
/** The mite's shell: transverse plates with lit rims. */
const mitePat = (f, x, y, w, h) => (f === 'up' ? (y % 3 === 0 ? 1.2 : y % 3 === 1 ? -0.6 : 0) : (y % 3 === 0 ? 1 : 0)) + (h2(x, y, 7) < 5 ? 0.6 : 0);
/** The Entomancer's cloak: yellow with black leopard spots. */
const spots = (f, x, y) => { const v = h2(Math.floor(x / 2), Math.floor(y / 2), 11); return v < 16 ? (v < 6 ? '#1c1a10' : '#3a2e14') : 0; };
/** Crab carapace: rough with lit ridges and dark pits. */
const crabPat = (f, x, y) => (h2(x, y, 13) < 8 ? 1.1 : h2(x, y, 17) < 6 ? -0.7 : 0) + ((x + y * 2) % 7 === 0 ? 0.5 : 0);
/** Armour plates of the Crusher: long panels with seams. */
const armourPat = (f, x, y, w, h) => (x % 5 === 0 ? 1.0 : x % 5 === 1 ? -0.5 : 0) + (y === h - 1 ? 0.8 : 0);
/** Demon skin: soft folds. */
const foldPat = (f, x, y) => ((x * 2 + y) % 6 === 0 ? 0.9 : (x + y * 3) % 8 === 0 ? -0.5 : 0);

// ---------------------------------------------------------------------------------------------------- bowlbugs
/**
 * Bowlbug: a round shelled bug - a domed body, a hexagonal head plate in front with one big cyan eye on a short stalk,
 * two yellow mandibles hooking down under it, four thin jointed legs - carrying its load on its back.
 */
function bowlbug(shell, load) {
  const leg = bugLeg(shell);
  const eye = { north: (x, y, w, h) => { const d = Math.hypot(x - (w - 1) / 2, y - (h - 1) / 2);
    return d <= 0.8 ? '#10303a' : d <= 1.6 ? (x < w / 2 && y < h / 2 ? '#ffffff' : null) : shell.ramp[2]; } };
  return {
    render: load.translucent ? 'translucent' : 'cutout',
    bones: [
      { name: 'body', pivot: [0, 6, 0], cubes: [
        { from: [-6, 3, -5], size: [12, 8, 12], mat: withPattern(shell, (f, x, y) => (f === 'up' && x === 6 ? 1.2 : 0)) },   // the two wing cases meet down the middle
        { from: [-5, 11, -3], size: [10, 1, 9], mat: shell },
        { from: [-5, 2, -4], size: [10, 1, 10], mat: leg },
      ] },
      { name: 'head', parent: 'body', pivot: [0, 6, -5], cubes: [
        { from: [-4.5, 3, -9], size: [9, 7, 4], mat: withPattern(shell, (f, x, y, w, h) => (f === 'north' && (x === 0 || x === w - 1) ? 0.8 : 0)) },
        // the eye stalk: a rim with the big cyan eye in it
        { from: [-2.5, 4, -11], size: [5, 5, 2], mat: shell, faceMat: { north: eyeCyan }, detail: eye },
      ] },
      ...[['mandible_l', -1], ['mandible_r', 1]].map(([n, s]) => ({ name: n, parent: 'head', pivot: [s * 2, 4, -9], cubes: [
        { from: [s * 3 - 1, 2.5, -12], size: [2, 2, 3], mat: yellow },
        { from: [s * 3 - 1, 0.5, -13], size: [2, 2, 2], mat: yellow },
        { from: [s < 0 ? s * 3 + 1 : s * 3 - 2, 0, -13], size: [1, 1, 2], mat: yellow },
      ] })),
      // four thin legs splaying out and down
      ...[['leg_fl', -1, -2], ['leg_fr', 1, -2], ['leg_bl', -1, 4], ['leg_br', 1, 4]].map(([n, s, z]) => ({ name: n, parent: 'body', pivot: [s * 5, 4, z], rot: [0, 0, s * 35], cubes: [
        { from: [s < 0 ? -9 : 5, 3.5, z - 0.5], size: [4, 1, 1], mat: leg },
        { from: [s < 0 ? -9 : 8, -1, z - 0.5], size: [1, 5, 1], mat: leg },
      ] })),
      { name: 'load', parent: 'body', pivot: [0, 11, 2], cubes: load.cubes },
    ],
  };
}

const LOADS = {
  // a big angular grey-green boulder sitting on the back
  rock: { cubes: [
    ...blob(0, 10, 2, 13, 9, 12, withPattern(rock, rockPat)),
    ...blob(-1, 18, 1, 8, 4, 8, withPattern(rock, rockPat)),
    ...blob(4, 13, 4, 6, 6, 6, withPattern(rock, rockPat)),
  ] },
  // a speckled teal egg
  egg: { cubes: [
    ...blob(0, 10, 2, 10, 10, 10, withPattern(eggTeal, eggPat)),
    ...blob(0, 19, 2, 6, 3, 6, withPattern(eggTeal, eggPat)),
  ] },
  // a big white ball of silk, threads wound every way
  silk: { cubes: [
    ...blob(0, 10, 2, 14, 12, 14, withPattern(silk, silkPat)),
    ...blob(0, 21, 2, 8, 3, 8, withPattern(silk, silkPat)),
  ] },
  // a soft sac brimming with orange nectar, a ruffled yellow rim
  nectar: { translucent: true, cubes: [
    ...blob(0, 10, 2, 13, 8, 13, withPattern(nectarSac, (f, x, y) => ((x + y) % 7 === 0 ? -1 : 0))),
    // the ruffled rim round the top
    { from: [-7, 17, -5], size: [14, 2, 2], mat: withPattern(nectarRim, (f, x) => (x % 2 === 0 ? -0.6 : 0.6)) },
    { from: [-7, 17, 7], size: [14, 2, 2], mat: withPattern(nectarRim, (f, x) => (x % 2 === 0 ? -0.6 : 0.6)) },
    { from: [-7, 17, -3], size: [2, 2, 10], mat: withPattern(nectarRim, (f, x) => (x % 2 === 0 ? -0.6 : 0.6)) },
    { from: [5, 17, -3], size: [2, 2, 10], mat: withPattern(nectarRim, (f, x) => (x % 2 === 0 ? -0.6 : 0.6)) },
  ] },
};

// ---------------------------------------------------------------------------------------------------- the rest
module.exports = {
  bowlbug_rock: bowlbug(bugRed, LOADS.rock),
  bowlbug_egg: bowlbug(bugGreen, LOADS.egg),
  bowlbug_silk: bowlbug(bugPink, LOADS.silk),
  bowlbug_nectar: bowlbug(bugMagenta, LOADS.nectar),

  // ------------------------------------------------------------ Exoskeleton: a cicada's cast skin come alive - a tan
  // ringed abdomen, a humped dark-brown thorax and head with bulging eyes, the body rearing up front, long thin
  // forelegs reaching down, two pairs behind, stubby papery wings.
  exoskeleton: {
    render: 'translucent',
    bones: [
      { name: 'body', pivot: [0, 5, 1], rot: [10, 0, 0], cubes: [
        // the abdomen: rings narrowing to the tip
        { from: [-3, 2, 1], size: [6, 5, 4], mat: withPattern(husk, huskPat) },
        { from: [-2.5, 2, 5], size: [5, 4, 3], mat: withPattern(husk, huskPat) },
        { from: [-1.5, 2, 8], size: [3, 3, 2], mat: withPattern(husk, huskPat) },
      ] },
      { name: 'thorax', parent: 'body', pivot: [0, 6, 1], rot: [-18, 0, 0], cubes: [
        // the domed thorax with the split down its back
        { from: [-3.5, 4, -5], size: [7, 6, 6], mat: withPattern(huskDark, (f, x, y, w, h) => (f === 'up' && (x === 3) ? '#20140a' : f === 'up' && (x === 2 || x === 4) ? 1.2 : (x + y) % 4 === 0 ? -0.6 : 0)) },
        { from: [-2.5, 10, -4], size: [5, 1, 4], mat: withPattern(huskDark, (f, x) => (x === 2 ? '#20140a' : 0)) },
      ] },
      { name: 'head', parent: 'thorax', pivot: [0, 6, -5], rot: [25, 0, 0], cubes: [
        { from: [-3, 4, -8], size: [6, 4, 3], mat: huskDark },
        // bulging, glassy eyes on the corners
        { from: [-4, 6, -7.5], size: [1, 2, 2], mat: R('#f0d898', '#c8a868', '#9a7a48') }, { from: [3, 6, -7.5], size: [1, 2, 2], mat: R('#f0d898', '#c8a868', '#9a7a48') },
        { from: [-1, 3, -9], size: [2, 3, 1], mat: huskDark },   // the beak-like mouthparts
      ] },
      ...[['wing_l', -1], ['wing_r', 1]].map(([n, s]) => ({ name: n, parent: 'thorax', pivot: [s * 2, 9, 0], rot: [-15, s * 12, s * 8], cubes: [
        { from: [s * 2 - (s < 0 ? 3 : 0), 9, 0], size: [3, 0, 7], mat: withPattern({ ramp: ['#fff4e0', '#ecdcc0', '#d0bc98'], alpha: 160 }, (f, x, y) => (x === 1 || y % 3 === 0 ? 1 : 0)),
          mask: (f, x, y, w, h) => Math.abs(x - (w - 1) / 2) <= (w / 2) * (1 - Math.pow(y / h, 3)) } ] })),
      // the digging forelegs: thick, hooked, held up in front
      ...[['leg_fore_l', -1], ['leg_fore_r', 1]].map(([n, s]) => ({ name: n, parent: 'thorax', pivot: [s * 3, 5, -4], rot: [-30, s * -15, s * 20], cubes: [
        { from: [s < 0 ? -5 : 3, 4, -5], size: [2, 2, 4], mat: huskDark },
        { from: [s < 0 ? -5 : 3, 0, -6], size: [2, 5, 2], mat: withPattern(husk, (f, x, y) => (y % 2 ? 0.8 : 0)) },
        { from: [s < 0 ? -5 : 3, -1, -8], size: [2, 1, 3], mat: huskDark },   // the hook
      ] })),
      ...[['mid', 0, 0, 50, 6], ['hind', 3, -35, 55, 7]].flatMap(([n, z, ry, rz, len]) => [-1, 1].map(s => ({
        name: 'leg_' + n + (s < 0 ? '_l' : '_r'), parent: 'body', pivot: [s * 3, 4, z], rot: [0, -ry * s, s * rz], cubes: [
          { from: [s < 0 ? -3 - Math.ceil(len / 2) : 3, 3.5, z - 0.5], size: [Math.ceil(len / 2), 1, 1], mat: huskDark },
          { from: [s < 0 ? -3 - Math.ceil(len / 2) : 2 + Math.ceil(len / 2), 3.5 - len, z - 0.5], size: [1, len, 1], mat: husk },
        ] }))),
    ],
  },

  // ------------------------------------------------------------ Chomper: a brass automaton - a great jagged clamp jaw in
  // front, a faceted diamond helmet on top, a glowing cyan orb for a heart, four angular brass legs.
  chomper: {
    render: 'cutout', glow: true,
    bones: [
      { name: 'body', pivot: [0, 8, 0], cubes: [
        ...blob(0, 4, 0, 9, 9, 9, { ...orb, pattern: (f, x, y) => (x === 2 && y === 2 ? '#ffffff' : (x === 3 && y === 2) || (x === 2 && y === 3) ? '#d8ffff' : 0) }),
        { from: [3.5, 9, -1], size: [2, 1, 2], mat: R('#4a6aa8', '#3a5590', '#2c4274') }, { from: [-5.5, 9, -1], size: [2, 1, 2], mat: R('#4a6aa8', '#3a5590', '#2c4274') },
      ] },
      { name: 'helmet', parent: 'body', pivot: [0, 14, 2], cubes: [
        { from: [-3.5, 13, -2], size: [7, 1, 8], mat: brass },
        { from: [-5, 14, -3], size: [10, 3, 10], mat: withPattern(brass, brassPat) },
        { from: [-3.5, 17, -1.5], size: [7, 2, 7], mat: brass },
        { from: [-2, 19, 0], size: [4, 2, 4], mat: brass },
      ] },
      // the jaw: two long brass clamps with a zigzag of teeth where they meet
      { name: 'jaw_upper', parent: 'body', pivot: [0, 9, -3], cubes: [
        { from: [-4.5, 8, -15], size: [9, 4, 12], mat: withPattern(brass, brassPat),
          detail: Object.fromEntries(['east', 'west'].map(f => [f, (x, y, w, h) => (y === h - 1 && x % 2 === 0 ? '#3a2a14' : null)])) },
        { from: [-4, 7, -17], size: [8, 4, 2], mat: brass },
        { from: [-3, 5, -17.5], size: [6, 2, 2], mat: brass },   // the hooked tip
      ] },
      { name: 'jaw_lower', parent: 'body', pivot: [0, 7, -3], cubes: [
        { from: [-4, 5, -14], size: [8, 3, 11], mat: withPattern(brass, brassPat),
          detail: Object.fromEntries(['east', 'west'].map(f => [f, (x, y) => (y === 0 && x % 2 === 1 ? '#3a2a14' : null)])) },
      ] },
      ...[['leg_fl', -1, -2], ['leg_fr', 1, -2], ['leg_bl', -1, 3], ['leg_br', 1, 3]].map(([n, s, z]) => ({ name: n, parent: 'body', pivot: [s * 3.5, 6, z], rot: [0, 0, s * 30], cubes: [
        { from: [s < 0 ? -7.5 : 3.5, 5, z - 1], size: [4, 2, 2], mat: brass },
        { from: [s < 0 ? -8.5 : 6.5, -1, z - 1], size: [2, 6, 2], mat: withPattern(brass, (f, x, y) => (y === 0 ? 1 : 0)) },
        { from: [s < 0 ? -9.5 : 6.5, -1, z - 1.5], size: [3, 1, 3], mat: brass },
      ] })),
    ],
  },

  // ------------------------------------------------------------ Myte: a domed orange mite - transverse shell plates with
  // orange spines along the ridge, a pair of curled cream pincers in front, six long red legs arching out and down.
  myte: {
    render: 'cutout',
    bones: [
      { name: 'body', pivot: [0, 8, 0], cubes: [
        ...blob(0, 5, 0.5, 13, 8, 14, withPattern(mite, mitePat)),
        ...blob(0, 12, 1, 9, 3, 10, withPattern(mite, mitePat)),
        { from: [-5, 4, -5], size: [10, 1, 11], mat: R('#86401c', '#663014') },
        // spines along the ridge
        ...[[-4, 0], [-1, 2.5], [2, -2.5], [4, 0]].map(([z, x]) => ({ from: [x, 14, z - 1], size: [0, 5, 4], mat: miteSpike,
          mask: (f, px, y, w, h) => px >= Math.round((h - 1 - y) * (w - 1) / (h - 1) * 0.8) })),
      ] },
      { name: 'head', parent: 'body', pivot: [0, 7, -6], cubes: [
        { from: [-3, 5, -8], size: [6, 4, 2], mat: R('#a85224', '#86401c', '#663014'), detail: { north: at([[1, 1], [4, 1]], '#1a0c06') } },
      ] },
      ...[['claw_l', -1], ['claw_r', 1]].map(([n, s]) => ({ name: n, parent: 'head', pivot: [s * 2.5, 6, -8], cubes: [
        { from: [s * 2.5 - 1.5, 4, -12], size: [3, 3, 4], mat: cream },
        { from: [s * 2.5 - 1, 1.5, -13], size: [2, 3, 2], mat: cream },
        { from: [s * 2.5 - (s < 0 ? 0 : 1), 1, -12], size: [1, 1, 2], mat: cream },
      ] })),
      ...[-1, 1].flatMap(s => [-3, 1, 5].map((z, i) => ({ name: 'leg_' + (s < 0 ? 'l' : 'r') + i, parent: 'body', pivot: [s * 6, 9, z], rot: [0, (1 - i) * 25 * s, s * 25], cubes: [
        { from: [s < 0 ? -13 : 6, 8.5, z - 0.5], size: [7, 1, 1], mat: miteLeg },
        { from: [s < 0 ? -13 : 12, 0, z - 0.5], size: [1, 9, 1], mat: miteLeg },
      ] }))),
    ],
  },

  // ------------------------------------------------------------ Entomancer (elite): a man in a tight dark-green suit
  // under a hooded yellow cloak with black spots, the hood pointed, a long spear with a gold sun-shaped head.
  entomancer: {
    render: 'cutout',
    bones: [
      { name: 'body', pivot: [0, 24, 0], cubes: [
        { from: [-4, 12, -2], size: [8, 12, 4], mat: withPattern(suit, (f, x, y) => (y % 4 === 0 ? 0.6 : 0)) },
        { from: [-4.5, 22, -2.5], size: [9, 2, 5], mat: withPattern(cloak, spots) },   // the cloak's shoulders
      ] },
      { name: 'cloak', parent: 'body', pivot: [0, 23, 2], rot: [8, 0, 0], cubes: [
        { from: [-6, 6, 2.5], size: [12, 17, 0], mat: withPattern(cloak, spots), mask: ragged(3, 5) },
      ] },
      { name: 'head', parent: 'body', pivot: [0, 24, 0], cubes: [
        { from: [-3, 24, -3], size: [6, 7, 6], mat: skin, detail: { north: (x, y, w, h) => (y === 3 && (x === 1 || x === 4) ? '#1a1410' : y >= 2 ? null : '#3a2e14') } },
        // the hood: yellow, spotted, its tip folding back
        { from: [-4, 24, -3.5], size: [8, 9, 8], mat: withPattern(cloak, spots), mask: (f, x, y, w, h) => f !== 'north' || !(x >= 1 && x <= w - 2 && y >= 2), inflate: 0.3 },
        { from: [-2, 33, -1], size: [4, 3, 4], mat: withPattern(cloak, spots) },
      ] },
      { name: 'arm_l', parent: 'body', pivot: [-5, 22, 0], cubes: [
        { from: [-7, 12, -1.5], size: [3, 11, 3], mat: suit },
        { from: [-7.5, 18, -2], size: [4, 5, 4], mat: withPattern(cloak, spots) },
      ] },
      { name: 'arm_r', parent: 'body', pivot: [5, 22, 0], cubes: [
        { from: [4, 12, -1.5], size: [3, 11, 3], mat: suit },
        { from: [3.5, 18, -2], size: [4, 5, 4], mat: withPattern(cloak, spots) },
      ] },
      // the spear, held point-forward in the right hand
      { name: 'spear', parent: 'arm_r', pivot: [5.5, 13, 0], rot: [75, 0, 0], cubes: [
        { from: [5, 2, -0.5], size: [1, 30, 1], mat: shaft },
        { from: [3.5, 32, 0], size: [4, 5, 0], mat: gold, mask: (f, x, y, w, h) => Math.abs(x - 1.5) <= (y < 2 ? 2 : 1.2 - (y - 2) * 0.4) + 0.2 },   // the sun-shaped head
        { from: [4.5, 31, -1], size: [2, 2, 2], mat: gold },
      ] },
      ...[['leg_l', -2], ['leg_r', 2]].map(([n, x]) => ({ name: n, parent: 'body', pivot: [x, 12, 0], cubes: [
        { from: [x - 2, 0, -2], size: [4, 12, 4], mat: withPattern(suitDark, (f, px, y) => (y >= 9 ? 1 : 0)) },
      ] })),
    ],
  },

  // ------------------------------------------------------------ Kaiser Crab (boss), modelled at half size (drawn x2): a
  // wide, flat, dark-purple carapace, rough and ridged; a fringe of small legs under it; a little face of green eyes in
  // front; on its right the Crusher - a blue-grey armoured claw like a capsule - and on its left the Rocket, a huge
  // purple pincer.
  kaiser_crab: {
    render: 'cutout', scale: 2, glow: true,
    bones: [
      { name: 'body', pivot: [0, 7, 0], cubes: [
        { from: [-14, 5, -10], size: [28, 6, 21], mat: withPattern(carapace, crabPat) },
        { from: [-12, 11, -9], size: [24, 2, 19], mat: withPattern(carapace, crabPat) },
        { from: [-9, 13, -6], size: [18, 1, 13], mat: withPattern(carapace, crabPat) },
        { from: [-15, 7, -11], size: [30, 1, 23], mat: withPattern(carapace, (f, x, y, w, h) => (f === 'up' && (x === 0 || y === 0 || x === w - 1 || y === h - 1) ? (x + y) % 2 ? '#8a7ab0' : '#6a5a90' : crabPat(f, x, y))) },
        { from: [-12, 4, -9], size: [24, 1, 18], mat: R('#3a2e5a', '#2c2246', '#201834') },
      ] },
      { name: 'face', parent: 'body', pivot: [0, 6, -10], cubes: [
        { from: [-4, 4, -12], size: [8, 4, 2], mat: carapace, detail: { north: (x, y) => ((x === 1 || x === 6) && y === 1 ? '#c8f8a0' : (x === 2 || x === 5) && y === 1 ? '#7ed05a' : null) } },
        { from: [-3, 4.5, -12.2], size: [6, 3, 0], mat: crabEye, mask: (f, x, y) => (x === 0 || x === 5) && y === 1 },
        { from: [-1, 3, -12.5], size: [2, 2, 1], mat: R('#c8b8e0', '#a898c8') },   // the mouth
      ] },
      // the Crusher on the crab's right (+x): a short arm and an armoured capsule claw
      { name: 'claw_crusher', parent: 'body', pivot: [13, 7, -6], rot: [0, -20, 0], cubes: [
        { from: [13, 4, -10], size: [5, 4, 5], mat: crusher },
        ...blob(19, 0, -16, 10, 10, 16, withPattern(crusher, armourPat)),
        { from: [15.5, 1.5, -27], size: [7, 7, 3], mat: crusher },
        { from: [16.5, 3, -28], size: [5, 2, 1], mat: R('#e8eef6', '#c4ccd8') },   // the pincer's pale edge
      ] },
      // the Rocket on the crab's left (-x): a thick arm and a great purple pincer with two hooked fingers
      { name: 'claw_rocket', parent: 'body', pivot: [-13, 7, -6], rot: [0, 25, 0], cubes: [
        { from: [-18, 4, -10], size: [5, 5, 5], mat: rocket },
        ...blob(-20, 0, -16, 12, 12, 14, withPattern(rocket, (f, x, y) => ((x + y) % 6 === 0 ? 0.8 : 0))),
        { from: [-24, 7, -35], size: [8, 4, 12], mat: rocket },   // the upper finger
        { from: [-23, 1, -32], size: [6, 4, 9], mat: rocket },    // the lower finger
        { from: [-23, 6, -36], size: [6, 2, 1], mat: R('#e0d0f6', '#c4b0e8') },
      ] },
      ...[-1, 1].flatMap(s => [-6, -2, 2, 6].flatMap((z, i) => [
        { name: 'leg_' + (s < 0 ? 'l' : 'r') + i, parent: 'body', pivot: [s * 12, 6, z], rot: [0, s * (i - 1.5) * 14, s * 25], cubes: [
          { from: [s < 0 ? -19 : 12, 5, z - 1], size: [7, 2, 2], mat: withPattern(carapace, (f, x) => (x % 3 === 0 ? 1 : 0)) } ] },
        { name: 'leg_' + (s < 0 ? 'l' : 'r') + i + '_tip', parent: 'leg_' + (s < 0 ? 'l' : 'r') + i, pivot: [s * 19, 6, z], rot: [0, 0, s * -35], cubes: [
          { from: [s < 0 ? -20 : 18, -2, z - 0.5], size: [2, 8, 1], mat: withPattern(carapace, (f, x, y) => (y < 2 ? '#b8a8d8' : y % 3 === 0 ? 1 : 0)) } ] },
      ])),
      ...[['eye_l', -2], ['eye_r', 2]].map(([n, x]) => ({ name: n, parent: 'face', pivot: [x, 8, -10], rot: [-20, 0, x * 8], cubes: [
        { from: [x - 0.5, 8, -10.5], size: [1, 3, 1], mat: carapace },
        { from: [x - 1, 11, -11], size: [2, 2, 2], mat: crabEye, detail: { north: (px, py) => (px === 0 && py === 0 ? '#ffffff' : px === 1 && py === 1 ? '#203018' : null) } } ] })),
    ],
  },

  // ------------------------------------------------------------ Knowledge Demon (boss): a grey, many-armed figure
  // sitting cross-legged in the air over a green egg-stone held in golden roots; a tall golden hood with a long pale
  // mask for a face; a brown disc behind it like a halo; six writhing arms, open-handed.
  knowledge_demon: {
    render: 'cutout', scale: 1.6,
    bones: [
      { name: 'stone', pivot: [0, 0, 0], cubes: [
        { from: [-4, 1, -4], size: [8, 6, 8], mat: withPattern(eggGreen, (f, x, y) => (h2(x, y, 21) < 10 ? 1 : (x + y) % 5 === 0 ? -0.6 : 0)) },
        { from: [-3, 7, -3], size: [6, 1, 6], mat: eggGreen },
        { from: [-5, 0, -5], size: [10, 1, 10], mat: withPattern(gold, (f, x, y) => ((x * 3 + y) % 4 === 0 ? -1 : (x + y) % 3 === 0 ? 1 : 0)), mask: (f, x, y, w, h) => f !== 'up' || (x + y * 2) % 3 !== 0 },
      ] },
      { name: 'body', pivot: [0, 12, 0], cubes: [
        { from: [-6, 9, -4], size: [12, 3, 8], mat: withPattern(demonGrey, foldPat) },   // the crossed legs
        { from: [-3, 12, -2], size: [6, 9, 4], mat: withPattern(demonGrey, (f, x, y) => (f === 'north' && y % 2 === 0 && x > 0 && x < 5 ? 0.9 : 0)) },
        { from: [-3.5, 19, -2.5], size: [7, 2, 5], mat: gold },   // the hood's gold collar
      ] },
      { name: 'halo', parent: 'body', pivot: [0, 18, 3], cubes: [
        { from: [-8, 10, 3], size: [16, 16, 0], mat: withPattern(halo, (f, x, y, w, h) => (Math.hypot(x - 7.5, y - 7.5) > 6.6 ? 1 : 0)), mask: disc },
      ] },
      { name: 'head', parent: 'body', pivot: [0, 21, 0], cubes: [
        { from: [-3, 21, -3], size: [6, 7, 6], mat: withPattern(gold, (f, x, y, w, h) => (f === 'north' && x >= 2 && x <= 3 ? '#24201a' : x === 0 || x === w - 1 ? 1 : 0)) },
        { from: [-2, 28, -2], size: [4, 2, 4], mat: gold },
        { from: [-1, 30, -1], size: [2, 2, 2], mat: gold },
        { from: [-1, 20, -3.4], size: [2, 7, 0], mat: R('#f6f4ee', '#dcdad2', '#bcbab2') },   // the long pale mask
      ] },
      // six arms: two raised, two out to the sides, two lowered - each an upper and a lower part bending back
      ...[[-1, 0, 50], [1, 0, 50], [-1, 1, 85], [1, 1, 85], [-1, 2, 125], [1, 2, 125]].flatMap(([s, i, a]) => {
        const n = 'arm_' + (s < 0 ? 'l' : 'r') + i, y = 19 - i * 3;
        return [
          { name: n, parent: 'body', pivot: [s * 3, y, 0], rot: [0, 0, s * a], cubes: [
            { from: [s < 0 ? -10 : 3, y - 1.5, -1.5], size: [7, 3, 3], mat: withPattern(demonGrey, foldPat) } ] },
          { name: n + '_fore', parent: n, pivot: [s * 10, y, 0], rot: [0, 0, -s * (40 + i * 10)], cubes: [
            { from: [s < 0 ? -16 : 10, y - 1, -1], size: [6, 2, 2], mat: withPattern(demonGrey, foldPat) },
            { from: [s < 0 ? -19 : 16, y - 2, -1.5], size: [3, 4, 3], mat: demonGrey },
          ] },
        ];
      }),
    ],
  },
};
