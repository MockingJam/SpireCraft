// Phase 8 batch 1 model specs (docs/design/mobs.md §4), v4 (angled bone chains, one-eyed beast, textured fur/feathers) — v3 — rebuilt against the STS2 renders (slaythespire.wiki.gg,
// StS2_<Monster>.png) after the user's review ("没有画出这些怪物的特征，不光是特征部位，还有整体的形状特征"), following the
// minecraft-modeling-item skill (Srar-Git): silhouette and proportions first (checked with tools/mobs/render.js from
// front, side and back), then the identifying parts, then material; few meaningful elements, rotated cuboids for
// slopes, 2-faced planes with transparent pixels for thin parts, consistent texel density, no random noise.
//
// Coordinates in pixels, Blockbench style: y up, ground at 0, front towards -Z.
// Bones: { name, pivot, parent?, rot?: [x,y,z] degrees, cubes }. Cubes: { from, size, mat, faceMat?, detail?, mask?, inflate? }.
//   A size of 0 on one axis makes a plane. mask(face, x, y, w, h) → false = transparent pixel.
//   detail[face](x, y, w, h) → '#hex' to paint a pixel, null to keep the material.
// Materials: ramp light → dark (hue-shifted, sampled from the STS2 renders), alpha?, emissive?,
//   pattern(face, x, y, w, h) → integer shade offset or '#hex'.
// Bone names are what client/mob/SpireMobModel animates — keep them.

const R = (...ramp) => ({ ramp });
const withPattern = (m, pattern) => ({ ...m, pattern });
const glowing = m => ({ ...m, emissive: true });

// ---- palettes (STS2 samples, hue-shifted ramps light → dark)
const leafJelly = { ramp: ['#a9d2d6', '#8bb6bb', '#6f9ca2', '#58848b', '#416c73', '#2f565c'], alpha: 232 };
const leafCore = R('#6f9ca2', '#55838a', '#436f76', '#335b61');
const moss = R('#c6cf6a', '#a8b44a', '#8b9a36', '#6f7f28', '#55661d');
const grass = R('#d6e27a', '#b2c452', '#8ea53a');
const twigJelly = { ramp: ['#f0fcc8', '#dcf58e', '#c6e679', '#adcb63', '#8fa64c', '#738536'], alpha: 205 };
const twigCore = R('#c6e679', '#adcb63', '#94b050', '#7c9640');
const twig = R('#8a7046', '#6a5432', '#4e3c22', '#342716');
const seed = '#e98a86', seedRim = '#5a6a2a';
const furPurple = R('#ead8f2', '#cdb4dc', '#b096c6', '#9479ac', '#785f90', '#5c4874');
const wurmSkin = R('#f8dcc4', '#f0c6a8', '#e2ac8e', '#cc9076', '#ad725c', '#88584a');
const lip = R('#f0a090', '#d8786a', '#b0564c');
const bone = R('#fffdf2', '#f6f0da', '#e6dec4', '#d2c8aa', '#b6ac8e', '#948a70');
const capYellow = R('#fff0b4', '#fbe08e', '#f4cc72', '#e6b45c', '#cf9a4c', '#ad7c3c');
const gill = R('#f0dcae', '#dcc48c', '#bea06a');
const stemGreen = R('#7ad4a0', '#55b483', '#3f976b', '#307a56', '#235e42');
const nibbit = R('#45bfa5', '#29a089', '#1d8a74', '#16735f', '#105e4e', '#0b483c');
const nibbitBelly = R('#b4d39a', '#94b67c', '#789862');
const frill = R('#e4e27a', '#c6c95a', '#a6ad44', '#848c34');
const shell = R('#fff6b4', '#f6e88c', '#ecd172', '#dcb45c', '#bd9447', '#957238');
const beetleGreen = R('#a6c06a', '#8ca856', '#728e44', '#5a7436', '#435a28');
const beetleLeg = R('#5c5a48', '#46443a', '#33322a');
const paleCyan = R('#f4fffd', '#d2f2ec', '#aedcd6', '#86bcb6', '#5e958f');
const feather = R('#bcf090', '#9ddd70', '#80c658', '#64aa42', '#4e8a34', '#3b6828');
const featherTip = R('#f6fbee', '#e2ecd8', '#c4d2b8');
const beak = R('#f6b4b2', '#e48c8a', '#c46a6a', '#984a4a');
const legDark = R('#7a8a70', '#5e6c54', '#46523e', '#30382a');
const beastPale = R('#f6fcfe', '#e4f2f8', '#cee6f0', '#b2d6e4', '#93c0d2', '#74a4b8');
const mane = R('#c4dca4', '#a2c482', '#83a866', '#668a4e', '#4c6c3a');
const antlerBlue = glowing(R('#d8f6ff', '#a8e4f6', '#7ccbe6', '#58aed0', '#3e8eb2'));
const gold = R('#fff2b0', '#f6d262', '#d6a232', '#9a6c1a');
const flame = { ramp: ['#e8f8ff', '#a6dcff', '#62b6ff', '#348ee4', '#1f64b4', '#16427e'], emissive: true,
  pattern: (f, x, y, w, h) => Math.round(3 * (1 - y / Math.max(1, h - 1))) - 1 + (Math.abs(x - (w - 1) / 2) > w / 4 ? 1 : 0) };

/** Antler silhouette, drawn by hand: 16 wide (towards the outside) × 20 tall, base at the bottom-left. */
const ANTLER = [
  '.........#....#.',
  '........##...##.',
  '...#....#...##..',
  '...##..##..##...',
  '....##.#..##..#.',
  '.....###.##..##.',
  '......####..##..',
  '..#....###.##...',
  '..##...######...',
  '...##..####.....',
  '....##.###......',
  '.....####.......',
  '......###.......',
  '......##........',
  '.....##.........',
  '.....#..........',
  '....##..........',
  '....#...........',
  '...##...........',
  '...#............',
];

// ---- helpers for details / masks (deterministic: no random noise)
const at = (pts, c) => (x, y) => (pts.some(([a, b]) => a === x && b === y) ? c : null);
const any = (...fns) => (x, y, w, h) => { for (const fn of fns) { const v = fn(x, y, w, h); if (v) return v; } return null; };
const hash = (x, s) => ((x * 37 + s * 11) % 7 + 7) % 7;
/** Ragged bottom edge (fur, moss): row y kept if it is above a per-column fringe depth. */
const ragged = (depth, seedN = 1) => (f, x, y, w, h) => y < h - (hash(x, seedN) % (depth + 1));
/** Ragged top edge (grass, fur tips). */
const tufts = (depth, seedN = 1) => (f, x, y, w, h) => y >= hash(x, seedN) % (depth + 1);
const leafMask = (face, x, y, w, h) => { const cx = (w - 1) / 2, t = y / Math.max(1, h - 1); const half = Math.sin(Math.PI * Math.min(1, t * 1.05 + 0.05)) * w / 2; return Math.abs(x - cx) <= half + 0.2; };
const flameMask = (face, x, y, w, h) => { const cx = (w - 1) / 2, t = 1 - y / Math.max(1, h - 1); const half = (w / 2) * Math.pow(Math.max(0, 1 - t), 0.6) + (t > 0.5 && (x % 3 === 1) ? 0.7 : 0); return Math.abs(x - cx) <= half; };
/** Seeds: a pink dot with a dark rim at the given points of a face. */
const seeds = pts => (x, y) => { for (const [a, b] of pts) { if (a === x && b === y) return seed; if (Math.abs(a - x) + Math.abs(b - y) === 1 && (a === x || b === y) && (x + y) % 2 === 0) return seedRim; } return null; };

// ---- v4 surface textures (user: "羽毛、绒毛等可以更细致一点，考虑渐变、层次、纹路"): deterministic patterns that add
// layered detail on top of each face's gradient. Values are shade-step offsets (+ darker, − lighter).
/** Fur: vertical strands (alternating light/dark columns), lighter flecks at strand tips, a few deep partings. */
const furPat = (f, x, y, w, h) => {
  if (f === 'up' || f === 'down') return (x % 2 === 0 ? -0.3 : 0.25) + (hash(x, 4) === 0 ? 0.7 : 0);
  const len = 3 + hash(x, 5) % 3;
  return (x % 2 === 0 ? -0.35 : 0.3) + (y % len === 0 ? -0.6 : 0) + (hash(x, 9) === 0 ? 0.8 : 0);
};
/** Feathers: overlapping scalloped rows (3 wide × 3 tall), lit upper rim, shadow under the next row, staggered. */
const featherPat = (f, x, y, w, h) => {
  const row = Math.floor(y / 3), cy = y % 3, cx = ((x + (row % 2) * 1.5) % 3 + 3) % 3;
  if (f === 'up' || f === 'down') return (Math.floor(y / 2) % 2 === 0 ? -0.3 : 0.3) + (x % 3 === 1 ? -0.3 : 0);
  return (cy === 0 ? -0.9 : cy === 2 ? 0.9 : 0) + (cx >= 1 && cx < 2 ? -0.3 : 0.15);
};
/** Leaf scales (Ceremonial Beast's mane): pointed leaves 3 wide × 4 tall, light midrib, dark rim. */
const leafPat = (f, x, y, w, h) => {
  const row = Math.floor(y / 4), cy = y % 4, cx = ((x + (row % 2) * 1.5) % 3 + 3) % 3;
  return cy === 3 ? 1.1 : (cx >= 1 && cx < 2 ? -0.7 : 0.2) + (cy === 0 ? -0.4 : 0);
};
/** Rings along a segment's long axis (the Wurm's grub body): a lit ridge, then a dark crease. */
const ringPat = axis => (f, x, y, w, h) => {
  const t = axis === 'y' ? (f === 'up' || f === 'down' ? -1 : y) : (f === 'east' || f === 'west' ? x : f === 'up' || f === 'down' ? y : -1);
  if (t < 0) return 0;
  return t % 3 === 0 ? -0.8 : t % 3 === 2 ? 0.9 : 0;
};
/** Bone: smooth with faint longitudinal grain and darker joint ends. */
const bonePat = (f, x, y, w, h) => ((f === 'east' || f === 'west' || f === 'north' || f === 'south') && (y === 0 || y === h - 1) ? 0.8 : 0) + ((x + y * 2) % 5 === 0 ? 0.35 : 0);
/**
 * v5 wing feathers: rows of rounded, overlapping feathers (5 wide x 4 tall, every other row offset by half a feather):
 * each feather is lit at its middle, has a light shaft and a darker rounded lower rim where it lies over the next row -
 * scallops, not straight stripes.
 */
const scalePat = (f, x, y, w, h) => {
  const row = Math.floor(y / 4), cy = y % 4, cx = ((x + (row % 2) * 2.5) % 5 + 5) % 5, dx = (cx - 2) / 2.5;
  const edge = cy / 3 + dx * dx * 0.9;
  if (edge > 1.05) return 1.3;
  if (edge > 0.8) return 0.6;
  return (cy === 0 ? -0.6 : -0.2) + (Math.abs(cx - 2) < 0.6 && cy > 0 ? -0.5 : 0);
};
/** Long flight feathers lying side by side (3 texels wide each): light shaft, darker vane edges, darker at the base. */
const quillPat = (f, x, y, w, h) => { const c = ((x % 3) + 3) % 3; return (c === 1 ? -0.7 : 0.4) + (y < 2 ? 0.5 : 0); };
/** A long feather seen from above: pointed tip, slightly narrower base. */
const featherMask = (f, x, y, w, h) => { const half = (w - 1) / 2, t = y / Math.max(1, h - 1); const lim = t > 0.85 ? half * (1 - t) / 0.15 : half; return Math.abs(x - half) <= lim + 0.25; };
/** Moss: soft clumps. */
const mossPat = (f, x, y) => ((x * 5 + y * 3) % 7 < 2 ? -0.7 : (x * 2 + y) % 5 === 0 ? 0.7 : 0);

module.exports = {
  // ------------------------------------------------------------ Leaf Slime: squat dome, moss carpet, one big eye
  leaf_slime: {
    render: 'translucent', scale: 2.0,
    bones: [
      { name: 'cube', pivot: [0, 0, 0], cubes: [
        // jelly puddle (the flat rim the dome sits on)
        { from: [-6.5, 0, -5.5], size: [13, 1, 11], mat: leafJelly },
        // dome body: lower wide tier and a narrower crown
        { from: [-5.5, 1, -4.5], size: [11, 4, 9], mat: leafJelly,
          detail: { north: (x, y, w, h) => {
            // the half-closed eye, left of centre: navy almond slit, orange iris, heavy lid line
            if (y === 0 && x >= 2 && x <= 7) return '#2c5058';
            if (y === 1 && x >= 1 && x <= 8) return x === 3 || x === 4 ? '#f0a040' : '#1a3440';
            if (y === 2 && x >= 2 && x <= 7) return x === 3 ? '#c87a28' : '#1a3440';
            return null;
          } } },
        { from: [-4.5, 5, -3.5], size: [9, 1, 7], mat: leafJelly },
      ] },
      { name: 'inside', parent: 'cube', pivot: [0, 0, 0], cubes: [
        { from: [-4.5, 1, -3.5], size: [9, 3, 7], mat: leafCore },
      ] },
      // moss carpet over the crown with a ragged fringe hanging down the sides, grass tufts on top
      { name: 'sprout', parent: 'cube', pivot: [0, 6, 0], cubes: [
        { from: [-5, 4, -4], size: [10, 3, 8], mat: withPattern(moss, mossPat), inflate: 0.1,
          mask: (f, x, y, w, h) => f === 'up' || f === 'down' || ragged(2, 3)(f, x, y, w, h) },
        { from: [-3.5, 7, -1.5], size: [3, 3, 0], mat: grass, mask: tufts(2, 1) },
        { from: [-2, 7, -3], size: [0, 3, 3], mat: grass, mask: tufts(2, 2) },
        { from: [1, 7, 0.5], size: [4, 2, 0], mat: grass, mask: tufts(1, 4) },
        { from: [3, 7, -2], size: [0, 3, 3], mat: grass, mask: tufts(2, 5) },
        { from: [-1, 7, 2.5], size: [3, 2, 0], mat: grass, mask: tufts(1, 6) },
      ] },
    ],
  },
  // ------------------------------------------------------------ Twig Slime: tall lime bell, twigs all round, seeds
  twig_slime: {
    render: 'translucent', scale: 2.0,
    bones: [
      { name: 'cube', pivot: [0, 0, 0], cubes: [
        { from: [-5, 0, -4.5], size: [10, 4, 9], mat: twigJelly,
          detail: { north: seeds([[2, 2], [7, 1], [4, 3]]), east: seeds([[2, 1], [6, 2]]), west: seeds([[3, 2], [7, 1]]), south: seeds([[2, 1], [6, 3]]) } },
        { from: [-4, 4, -3.5], size: [8, 3, 7], mat: twigJelly, detail: { north: seeds([[5, 1]]), east: seeds([[3, 1]]) } },
        { from: [-2.5, 7, -2], size: [5, 2, 4], mat: twigJelly },
      ] },
      { name: 'inside', parent: 'cube', pivot: [0, 0, 0], cubes: [
        { from: [-4, 1, -3.5], size: [8, 5, 7], mat: twigCore },
        // two dark seed-eyes looking out of the jelly
        { from: [-2.5, 3, -3.7], size: [1, 1, 0], mat: R('#2a2414') }, { from: [1.5, 3, -3.7], size: [1, 1, 0], mat: R('#2a2414') },
      ] },
      // twigs: thin dark sticks (1×1 rods) poking out of the dome at angles, each with a side branch
      ...[[-2, 8, -1, -25, 20, 'twig_a'], [2, 7.5, 1, 30, -15, 'twig_b'], [4, 4, -2, 70, 10, 'twig_c'], [-4.5, 4.5, 1.5, -70, -10, 'twig_d']].map(([x, y, z, rz, rx, n]) => ({
        name: n, parent: 'cube', pivot: [x, y, z], rot: [rx, 0, rz], cubes: [
          { from: [x - 0.5, y, z - 0.5], size: [1, 5, 1], mat: twig },
          { from: [x - 0.5, y + 3, z - 0.5], size: [2, 1, 1], mat: twig },
          { from: [x - 1.5, y + 1.5, z - 0.5], size: [1, 1, 1], mat: twig },
        ] })),
    ],
  },
  // ------------------------------------------------------------ Fuzzy Wurm Crawler (v4): a ringed grub tube rising out
  // of the ground and curling forward, the toothed mouth at its top end; a shaggy lilac pelt draped over its back and
  // streaming behind; sage-green leaf blades poking out of the fur. Segments are chained bones, each bent a little more.
  // v5 (user: "a bug on the ground"; STS2): a low grub lying along the ground - ringed peach segments, the round toothy
  // mouth at the front facing forward, a long shaggy purple pelt over the back sweeping down behind it, leaf blades in
  // the fur. When it spits (Acid) the front half rears up and lobs the venom high (client/mob/SpireMobModel).
  fuzzy_wurm_crawler: {
    render: 'cutout',
    bones: [
      // rear segment on the ground; the others hang off it towards the front so the front can rear up
      { name: 'body_3', pivot: [0, 3, 2], cubes: [
        { from: [-4, 0, 1], size: [8, 6, 9], mat: withPattern(wurmSkin, ringPat('z')) },
        { from: [-3, 0, 10], size: [6, 4, 3], mat: withPattern(wurmSkin, ringPat('z')) },
      ] },
      { name: 'body_2', parent: 'body_3', pivot: [0, 1, 1], cubes: [
        { from: [-4, 0, -6], size: [8, 7, 7], mat: withPattern(wurmSkin, ringPat('z')) } ] },
      { name: 'body_1', parent: 'body_2', pivot: [0, 1.5, -6], cubes: [
        { from: [-3.5, 0.5, -11], size: [7, 7, 5], mat: withPattern(wurmSkin, ringPat('z')) } ] },
      // the mouth: a flared pink lip ring facing forward, dark throat, a ring of pale teeth
      { name: 'head', parent: 'body_1', pivot: [0, 4, -11], cubes: [
        { from: [-4.5, 0, -14], size: [9, 9, 3], mat: lip, detail: { north: (x, y) => {
          const d = Math.hypot(x - 4, y - 4);
          if (d < 2.3) return d < 1.3 ? '#1e0408' : '#3a0c12';
          if (d < 3.3) return (Math.round(Math.atan2(y - 4, x - 4) * 2.6) % 2 === 0) ? '#f8f0c8' : '#5a1418';
          return null;
        } } },
      ] },
      // the pelt: a shaggy mound over the back, a long tail curtain sweeping to the ground behind, side curtains
      { name: 'hair', parent: 'body_3', pivot: [0, 8, 0], cubes: [
        // a high shaggy hump over the middle, lower towards the tail
        { from: [-6, 5, -8], size: [12, 8, 9], mat: withPattern(furPurple, furPat), mask: (f, x, y, w, h) => f === 'up' || f === 'down' || ragged(3, 2)(f, x, y, w, h) },
        { from: [-5.5, 4, 1], size: [11, 6, 9], mat: withPattern(furPurple, furPat), mask: (f, x, y, w, h) => f === 'up' || f === 'down' || ragged(3, 8)(f, x, y, w, h) },
        { from: [-4.5, 12, -6], size: [9, 2, 6], mat: withPattern(furPurple, furPat), mask: (f, x, y, w, h) => f === 'down' || tufts(1, 9)(f, x, y, w, h) },
        { from: [-6.5, 0, -7], size: [0, 10, 17], mat: withPattern(furPurple, furPat), mask: ragged(3, 3) },
        { from: [6.5, 0, -7], size: [0, 10, 17], mat: withPattern(furPurple, furPat), mask: ragged(3, 4) },
      ] },
      { name: 'hair_back', parent: 'hair', pivot: [0, 11, 10], rot: [-55, 0, 0], cubes: [
        { from: [-6, 2, 10], size: [12, 9, 0], mat: withPattern(furPurple, furPat), mask: ragged(4, 13) } ] },
      // a shag fringe over the top of the mouth (rides with the front)
      { name: 'fringe', parent: 'body_1', pivot: [0, 8, -8], rot: [-15, 0, 0], cubes: [
        { from: [-5, 6.5, -12], size: [10, 3, 6], mat: withPattern(furPurple, furPat), mask: (f, x, y, w, h) => f === 'up' || f === 'down' || ragged(1, 6)(f, x, y, w, h) },
      ] },
      ...[[-6, 7, -2, -55, 0, 'leaf_a'], [6, 8, 2, 50, 0, 'leaf_b'], [-5, 6, -6, -70, 20, 'leaf_c']].map(([x, y, z, rz, rx, n]) => ({
        name: n, parent: 'body_2', pivot: [x, y, z], rot: [rx, 0, rz], cubes: [
          { from: [x - 1, y, z], size: [3, 8, 0], mat: R('#dcead0', '#b8cfa6', '#93ad80', '#6f8a5e'), mask: leafMask } ] })),
      { name: 'tuft', parent: 'body_2', pivot: [0, 11, -3], rot: [-20, 0, 0], cubes: [
        { from: [-4.5, 10, -5], size: [9, 4, 0], mat: withPattern(furPurple, furPat), mask: tufts(2, 11) },
      ] },
    ],
  },
  // ------------------------------------------------------------ Flyconid: three tall yellow caps on a thin spotted stem
  flyconid: {
    render: 'cutout',
    bones: [
      { name: 'stem', pivot: [0, 0, 0], cubes: [
        { from: [-1.5, 1, -1.5], size: [3, 15, 3], mat: stemGreen,
          detail: { north: at([[1, 11], [1, 8], [1, 5]], '#102a1c'), east: at([[1, 9]], '#102a1c'), west: at([[1, 6]], '#102a1c') } },
        // roots
        { from: [-3, 0, -1], size: [6, 1, 2], mat: stemGreen }, { from: [-1, 0, -3], size: [2, 1, 6], mat: stemGreen },
      ] },
      // little leaf hands low on the stem
      { name: 'arm_l', parent: 'stem', pivot: [-1.5, 5, 0], rot: [0, 0, -35], cubes: [{ from: [-5.5, 5, 0], size: [4, 3, 0], mat: stemGreen, mask: leafMask }] },
      { name: 'arm_r', parent: 'stem', pivot: [1.5, 5, 0], rot: [0, 0, 35], cubes: [{ from: [1.5, 5, 0], size: [4, 3, 0], mat: stemGreen, mask: leafMask }] },
      // main cap: a tall cone (flared rim, two tiers, tip) on top
      { name: 'cap', parent: 'stem', pivot: [0, 16, 0], rot: [-5, 0, -8], cubes: [
        { from: [-4.5, 15, -4.5], size: [9, 3, 9], mat: capYellow, faceMat: { down: gill } },
        { from: [-3, 18, -3], size: [6, 5, 6], mat: capYellow },
        { from: [-1.5, 23, -1.5], size: [3, 4, 3], mat: capYellow },
      ] },
      // two smaller caps on side shoots, tilted outwards
      { name: 'cap_side', parent: 'stem', pivot: [1.5, 10, 0], rot: [8, 0, -26], cubes: [
        { from: [1.5, 9.5, -0.5], size: [3, 1, 1], mat: stemGreen },
        { from: [3, 10.5, -2], size: [5, 2, 4], mat: capYellow, faceMat: { down: gill } },
        { from: [4, 12.5, -1], size: [3, 3, 2], mat: capYellow },
        { from: [5, 15.5, -0.5], size: [1, 1, 1], mat: capYellow },
      ] },
      { name: 'cap_small', parent: 'stem', pivot: [-1.5, 8, 0], rot: [-6, 0, 24], cubes: [
        { from: [-4.5, 7.5, -0.5], size: [3, 1, 1], mat: stemGreen },
        { from: [-7.5, 8.5, -1.5], size: [4, 2, 3], mat: capYellow, faceMat: { down: gill } },
        { from: [-6.5, 10.5, -0.5], size: [2, 2, 1], mat: capYellow },
      ] },
    ],
  },
  // ------------------------------------------------------------ Nibbit: newt — wide flat head, toothy mouth, dorsal frill
  nibbit: {
    render: 'cutout',
    bones: [
      { name: 'body', pivot: [0, 6, 0], cubes: [
        { from: [-4, 3, -6], size: [8, 6, 13], mat: withPattern(nibbit, (f, x, y) => (f === 'up' && (y % 4 === 1) && (x === 1 || x === 6) ? 2 : 0) + ((x * 3 + y * 7) % 11 === 0 ? -0.8 : 0) + ((x + y) % 2 === 0 ? 0.2 : -0.1)), faceMat: { down: nibbitBelly } },
        { from: [-3, 9, -5], size: [6, 1, 10], mat: nibbit },
      ] },
      // dorsal frill: a yellow-green sail along the spine with a scalloped top
      { name: 'ridge', parent: 'body', pivot: [0, 10, 0], cubes: [{ from: [0, 9, -7], size: [0, 4, 15], mat: frill,
        mask: (f, x, y, w, h) => y >= Math.round(1.5 - 1.5 * Math.cos(x * 0.9)) && y >= (x < 2 || x > w - 3 ? 2 : 0) }] },
      // head wider than the body, flat, eyes bulging on top
      { name: 'head', parent: 'body', pivot: [0, 7, -6], cubes: [
        // v5 (user): the eyes sit flush on the sides of the head, small and yellow (STS2), not bulging on top
        { from: [-5, 5, -13], size: [10, 3, 7], mat: nibbit, detail: {
          north: (x, y) => (y === 2 ? '#0b483c' : null),
          east: (x, y, w) => (y === 0 && (x === 2 || x === w - 3) ? '#f6ec60' : y === 1 && (x === 2 || x === w - 3) ? '#1a1a10' : null),
          west: (x, y, w) => (y === 0 && (x === 2 || x === w - 3) ? '#f6ec60' : y === 1 && (x === 2 || x === w - 3) ? '#1a1a10' : null) } },
      ] },
      // two translucent blue fin flaps sweeping up and back from behind the head (STS2)
      ...[['fin_l', -1], ['fin_r', 1]].map(([n, sd]) => ({ name: n, parent: 'body', pivot: [sd * 3.5, 8.5, -4], rot: [-30, sd * 20, sd * -25], cubes: [
        { from: [sd * 3.5, 8.5, -4], size: [0, 4, 7], mat: { ramp: ['#7ad0e8', '#4fb0d0', '#3890b4', '#2a7098'], alpha: 190 }, mask: leafMask } ] })),
      // lower jaw with a row of teeth showing along the front and sides
      { name: 'jaw', parent: 'head', pivot: [0, 5, -7], cubes: [{ from: [-4.5, 3, -12.5], size: [9, 2, 6], mat: nibbitBelly,
        detail: { north: (x, y) => (y === 0 && x % 2 === 0 ? '#f6f2e0' : null), east: (x, y) => (y === 0 && x % 2 === 1 ? '#f6f2e0' : null), west: (x, y) => (y === 0 && x % 2 === 1 ? '#f6f2e0' : null) } }] },
      { name: 'tail', parent: 'body', pivot: [0, 6, 7], rot: [-8, 0, 0], cubes: [
        { from: [-2.5, 4, 7], size: [5, 4, 8], mat: nibbit },
        { from: [0, 8, 7], size: [0, 2, 8], mat: frill, mask: (f, x, y) => y >= x % 2 },
      ] },
      { name: 'tail_tip', parent: 'tail', pivot: [0, 5, 15], rot: [-6, 0, 0], cubes: [{ from: [-1.5, 4.5, 15], size: [3, 3, 7], mat: nibbit }, { from: [-0.5, 5, 22], size: [1, 2, 3], mat: nibbit }] },
      ...[['leg_fl', -4, -4], ['leg_fr', 4, -4], ['leg_bl', -4, 5], ['leg_br', 4, 5]].map(([n, x, z]) => ({
        name: n, parent: 'body', pivot: [x, 5, z], rot: [0, 0, x < 0 ? 22 : -22], cubes: [
          { from: [x < 0 ? x - 2 : x - 1, 1, z - 1.5], size: [3, 4, 3], mat: nibbit },
          { from: [x < 0 ? x - 2.5 : x - 1.5, 0, z - 2.5], size: [4, 1, 4], mat: nibbit, detail: { north: (px) => (px % 2 === 0 ? '#0b483c' : null) } },
        ] })),
    ],
  },
  // ------------------------------------------------------------ Shrinker Beetle: big striped dome, goggle eyes, beaded antennae
  shrinker_beetle: {
    render: 'cutout',
    bones: [
      { name: 'body', pivot: [0, 3, 0], cubes: [{ from: [-4, 2, -5], size: [8, 3, 11], mat: beetleGreen }] },
      // the shell: two domed halves (lower wide box + crown), lengthwise stripes
      ...[['shell_l', -6, 0], ['shell_r', 0, 1]].map(([n, x, side]) => ({ name: n, parent: 'body', pivot: [0, 8, -5], rot: [-6, 0, side ? -7 : 7], cubes: [
        { from: [x, 4, -5], size: [6, 4, 13], mat: withPattern(shell, (f, px) => ((f === 'up' || f === 'north' || f === 'south') && px % 2 === side ? 1 : 0)) },
        { from: [side ? 0 : -4, 8, -3.5], size: [4, 2, 10], mat: withPattern(shell, (f, px) => (f === 'up' && px % 2 === side ? 1 : 0)) },
      ] })),
      { name: 'head', parent: 'body', pivot: [0, 4, -5], rot: [14, 0, 0], cubes: [
        { from: [-2.5, 2, -9], size: [5, 4, 4], mat: beetleGreen },
        // big pale goggle eyes
        { from: [-5, 3, -9], size: [3, 3, 3], mat: paleCyan, detail: { north: at([[0, 0]], '#ffffff'), east: at([[1, 0]], '#ffffff') } },
        { from: [2, 3, -9], size: [3, 3, 3], mat: paleCyan, detail: { north: at([[1, 0]], '#ffffff'), west: at([[1, 0]], '#ffffff') } },
        // mandibles
        { from: [-2, 1.5, -10.5], size: [1, 1, 2], mat: beetleLeg }, { from: [1, 1.5, -10.5], size: [1, 1, 2], mat: beetleLeg },
      ] },
      // beaded antennae: chains of pale ovals rising and curling back over the head
      { name: 'antennae', parent: 'head', pivot: [0, 6, -8], cubes: [
        ...[-1, 1].flatMap(s => [[0, 0, 0], [0.5, 2, -1], [1, 4, -1.5], [1.5, 6, -1], [1.5, 8, 0], [1, 9.5, 1.5], [0.5, 10, 3]].map(([dx, dy, dz]) => (
          { from: [s * (1.5 + dx) - 0.5, 6 + dy, -9 + dz], size: [1, 2, 1], mat: paleCyan }))),
      ] },
      // thin jointed legs: three pairs splaying out
      ...[-3, 0, 3].flatMap((z, i) => [
        { name: 'leg_l' + i, parent: 'body', pivot: [-4, 3, z], rot: [0, (i - 1) * 25, -40], cubes: [{ from: [-9, 2.5, z - 0.5], size: [5, 1, 1], mat: beetleLeg }, { from: [-9, -2, z - 0.5], size: [1, 5, 1], mat: beetleLeg }] },
        { name: 'leg_r' + i, parent: 'body', pivot: [4, 3, z], rot: [0, -(i - 1) * 25, 40], cubes: [{ from: [4, 2.5, z - 0.5], size: [5, 1, 1], mat: beetleLeg }, { from: [8, -2, z - 0.5], size: [1, 5, 1], mat: beetleLeg }] },
      ]),
    ],
  },
  // ------------------------------------------------------------ Byrdonis (v5, user + STS2): a terror bird taller than a
  // man - S-curved shaggy neck, small head with a grey face patch and a heavy-lidded, glaring pink eye under a dark brow,
  // a big hooked pink beak pointing down and forward; folded wings of overlapping rounded feathers (coverts over long
  // flight feathers, white primaries); a tail of long feathers fanning out behind; reverse-knee legs, black talons.
  byrdonis: {
    render: 'cutout', scale: 1.4,
    bones: [
      { name: 'body', pivot: [0, 20, 0], rot: [-8, 0, 0], cubes: [
        { from: [-6, 15, -8], size: [12, 10, 16], mat: withPattern(feather, scalePat) },
        { from: [-5.5, 13, -7], size: [11, 3, 0], mat: withPattern(feather, furPat), mask: ragged(2, 3) },
      ] },
      { name: 'neck', parent: 'body', pivot: [0, 23, -6], rot: [-12, 0, 0], cubes: [
        { from: [-2.5, 22, -9], size: [5, 9, 5], mat: withPattern(feather, furPat) },
        { from: [-3, 21, -9.5], size: [6, 9, 0], mat: withPattern(feather, furPat), mask: ragged(2, 5) },
      ] },
      { name: 'neck_high', parent: 'neck', pivot: [0, 30, -7], rot: [38, 0, 0], cubes: [
        { from: [-2, 29, -9], size: [4, 7, 4], mat: withPattern(feather, furPat) } ] },
      { name: 'head', parent: 'neck_high', pivot: [0, 36, -7.5], rot: [-10, 0, 0], cubes: [
        { from: [-2.5, 35, -12], size: [5, 5, 7], mat: withPattern(feather, furPat),
          detail: Object.fromEntries(['east', 'west'].map(f => [f, (x, y, w, h) => {
            // bare grey face patch; a heavy dark brow; a half-closed glaring pink eye with a slit pupil
            if (x < 1 || x > 5 || y > 4) return null;
            if (y === 1) return '#3e4a3a';                                   // the brow
            if (y === 2 && x >= 2 && x <= 4) return x === 3 ? '#2a0812' : '#e8708c';   // the eye, lid half down
            if (y === 3 && x >= 2 && x <= 4) return '#a85a6c';             // lower lid
            return '#8a9a86';
          }])) },
      ] },
      // spiky crest at the back of the head
      ...[[-1, -35, -15, 'crest'], [0, -55, 0, 'crest_b'], [1, -35, 15, 'crest_c'], [-1, -75, -8, 'crest_d'], [1, -75, 8, 'crest_e']].map(([dx, rx, ry, n]) => ({
        name: n, parent: 'head', pivot: [dx * 0.8, 39.5, -6], rot: [rx, ry, 0],
        cubes: [{ from: [dx * 0.8, 39.5, -7], size: [0, 7, 2], mat: feather, mask: (f, x, y, w, h) => x === 0 || y >= 2 }] })),
      // the beak: heavy upper bill hooking down at the tip, thinner lower bill, angled down and forward
      { name: 'beak', parent: 'head', pivot: [0, 37.5, -12], rot: [24, 0, 0], cubes: [
        { from: [-2, 36, -20], size: [4, 4, 8], mat: withPattern(beak, (f, x, y) => (f === 'up' && x === 1 ? -0.6 : 0)),
          detail: { east: at([[6, 1]], '#5a2a2a'), west: at([[1, 1]], '#5a2a2a') } },
        { from: [-1.5, 33.5, -21.5], size: [3, 5, 2], mat: R('#e48c8a', '#c46a6a', '#984a4a', '#6a3030') },
        { from: [-1.5, 34, -18], size: [3, 2, 6], mat: R('#c46a6a', '#984a4a', '#783838') },
      ] },
      // folded wings: rounded covert feathers over long flight feathers; white primaries trailing back
      ...[['wing_l', -1], ['wing_r', 1]].map(([n, sd]) => ({ name: n, parent: 'body', pivot: [sd * 6, 23, -5], rot: [-4, 0, sd * 5], cubes: [
        { from: [sd * 6.1, 17, -6], size: [0, 7, 12], mat: withPattern(feather, scalePat), mask: (f, x, y, w, h) => y < h - 1 || (x % 5) !== 0 },
        { from: [sd * 6.5, 15, -2], size: [0, 6, 14], mat: withPattern(R('#9ddd70', '#80c658', '#64aa42', '#4e8a34', '#3b6828'), quillPat),
          mask: (f, x, y, w, h) => y < h - (x % 3 === 1 ? 0 : 1) },
        { from: [sd * 6.9, 16, 9], size: [0, 4, 8], mat: withPattern(featherTip, quillPat), mask: (f, x, y, w, h) => !(y >= h - 1 && x % 3 !== 1) },
      ] })),
      // the tail: a short base and five long feathers fanning out behind, drooping a little
      { name: 'tail', parent: 'body', pivot: [0, 21, 8], rot: [-20, 0, 0], cubes: [
        { from: [-1.5, 20, 7], size: [3, 3, 5], mat: withPattern(feather, furPat) } ] },
      ...[[-30, 10, '#80c658'], [-14, 4, '#64aa42'], [0, 0, '#9ddd70'], [14, 4, '#64aa42'], [30, 10, '#80c658']].map(([yaw, droop, c], i) => ({
        name: 'tail_' + i, parent: 'tail', pivot: [0, 21, 11], rot: [droop + 15, yaw, 0], cubes: [
          { from: [-1.5, 21, 11], size: [3, 0, 16 - Math.abs(i - 2) * 2], mat: withPattern(R(c, '#4e8a34', '#3b6828', '#2c5020'), (f, x, y, w, h) => (x === 1 ? -0.8 : 0.3) + (y > h - 4 ? 0.6 : 0)),
            mask: featherMask } ] })),
      // legs: feathered thigh angled forward, shank angled back (reverse knee), black talons
      ...[['leg_l', -3], ['leg_r', 3]].flatMap(([n, x]) => [
        { name: n, parent: 'body', pivot: [x, 16, 2], rot: [-28, 0, 0], cubes: [
          { from: [x - 2.5, 8, -0.5], size: [5, 9, 6], mat: withPattern(R('#cddcc0', '#b2c4a4', '#96a888', '#7a8c6e'), furPat) } ] },
        { name: n + '_shank', parent: n, pivot: [x, 9, 2.5], rot: [52, 0, 0], cubes: [
          { from: [x - 1, 1, 1.5], size: [2, 9, 2], mat: legDark } ] },
        { name: n + '_foot', parent: n + '_shank', pivot: [x, 1.5, 2.5], rot: [-24, 0, 0], cubes: [
          { from: [x - 2, 0, -2.5], size: [4, 1, 6], mat: legDark },
          { from: [x - 2, -1, -3.5], size: [1, 2, 1], mat: R('#22242a', '#16181c') }, { from: [x + 1, -1, -3.5], size: [1, 2, 1], mat: R('#22242a', '#16181c') },
          { from: [x - 0.5, -1, -4], size: [1, 2, 1], mat: R('#22242a', '#16181c') },
        ] },
      ]),
    ],
  },
  // ------------------------------------------------------------ Ceremonial Beast (v5, user + STS2): a noble pale stag,
  // taller than a man - a deep, high chest and shoulders (the front half bigger), a lighter rear, strong legs; a long
  // neck under a full leaf mane; a skull-like wedge of a head with a slanted, almond green eye under a heavy brow and a
  // notched, toothed jaw line; the glowing antlers hung with gold beads; gold chains over the flanks.
  ceremonial_beast: {
    render: 'cutout', scale: 1.4, glow: true,
    bones: [
      { name: 'body', pivot: [0, 24, 0], cubes: [
        // chest and shoulders: deep and high
        { from: [-5.5, 18, -11], size: [11, 13, 10], mat: withPattern(beastPale, bonePat) },
        // the rear: narrower and lower, stepping down to the haunch
        { from: [-4.5, 19, -1], size: [9, 10, 11], mat: beastPale },
        { from: [-4, 18, 9], size: [8, 9, 3], mat: beastPale },
        ...[-1, 1].map(sd => ({ from: [sd * 5.6, 21, -8], size: [0, 5, 16], mat: gold, mask: (f, x, y, w, h) => y === Math.round(2 + 2 * Math.sin(x * 0.4)) && x % 2 === 0 })),
      ] },
      { name: 'tail', parent: 'body', pivot: [0, 27, 11], rot: [-55, 0, 0], cubes: [
        { from: [-0.5, 27, 11], size: [1, 1, 12], mat: beastPale },
        { from: [-1.5, 26.5, 21], size: [3, 2, 4], mat: withPattern(beastPale, furPat) } ] },
      { name: 'neck', parent: 'body', pivot: [0, 28, -9], rot: [26, 0, 0], cubes: [
        { from: [-3, 27, -12.5], size: [6, 13, 6], mat: beastPale } ] },
      // the mane: overlapping layers of leaf scales over neck and chest, fullest at the chest
      ...[[0, 19, -12, 12, 14, 0, 'mane_a'], [0, 25, -13, 10, 13, -10, 'mane_b'], [0, 31, -13.5, 8, 10, -18, 'mane_c']].map(([x, y, z, w, h, r, n]) => ({
        name: n, parent: n === 'mane_a' ? 'body' : 'neck', pivot: [x, y + h, z], rot: [r, 0, 0], cubes: [
          { from: [x - w / 2, y, z], size: [w, h, 0], mat: withPattern(mane, leafPat), mask: (f, px, py, fw, fh) => py < fh - ((px % 3 === 1) ? 0 : 1) && Math.abs(px - (fw - 1) / 2) <= fw / 2 - (py < 2 ? 1 : 0) } ] })),
      { name: 'head', parent: 'neck', pivot: [0, 40, -9.5], rot: [-30, 0, 0], cubes: [
        // the skull: a wedge - broad at the brow, narrowing to a beak-like muzzle
        { from: [-3, 37, -16], size: [6, 5, 7], mat: withPattern(beastPale, bonePat),
          detail: Object.fromEntries(['east', 'west'].map(f => [f, (x, y, w, h) => {
            // a slanted almond eye under a heavy brow, a few skull seams
            if (y === 0 && x >= 1 && x <= 4) return '#93c0d2';            // brow ridge shadow
            if (y === 1 && x >= 2 && x <= 4) return x === 3 ? '#e8ffd0' : '#62d040';
            if (y === 2 && x >= 1 && x <= 3) return x === 2 ? '#1e4a14' : '#4ab030';
            if (y === 3 && x === 5) return '#b2d6e4';
            return null;
          }])) },
        { from: [-2, 36.5, -20.5], size: [4, 4, 5], mat: withPattern(beastPale, bonePat) },
        // the jaw: a notched line of teeth along its upper edge
        { from: [-2, 35, -19.5], size: [4, 2, 5], mat: R('#e4f2f8', '#cee6f0', '#b2d6e4', '#93c0d2'),
          detail: { east: (x, y) => (y === 0 ? (x % 2 === 0 ? '#ffffff' : '#5a7a8a') : null), west: (x, y) => (y === 0 ? (x % 2 === 0 ? '#ffffff' : '#5a7a8a') : null),
            north: (x, y) => (y === 0 ? (x % 2 === 0 ? '#ffffff' : '#5a7a8a') : null) } },
        { from: [-2.5, 40, -12], size: [5, 2, 4], mat: withPattern(beastPale, bonePat) },
        { from: [-5, 41, -10], size: [3, 1, 1], mat: beastPale }, { from: [2, 41, -10], size: [3, 1, 1], mat: beastPale },
      ] },
      // antlers: a thick curved main beam per side (angled bars) with three upward tines, glowing; gold beads hang off
      ...[-1, 1].flatMap(s => {
        const n = s < 0 ? 'antler_l' : 'antler_r';
        const blue = withPattern(antlerBlue, (f, x, y) => ((x + y) % 4 === 0 ? 0.8 : 0));
        return [
          { name: n, parent: 'head', pivot: [s * 1.5, 41, -10], rot: [-12, 0, s * 68], cubes: [{ from: [-0.5, 41, -11], size: [2, 9, 2], mat: blue }] },
          { name: n + '_beam', parent: n, pivot: [s * 0.5, 49.5, -10], rot: [0, 0, s * -48], cubes: [{ from: [-0.5, 49.5, -11], size: [2, 9, 2], mat: blue }] },
          { name: n + '_tip', parent: n + '_beam', pivot: [s * 0.5, 58, -10], rot: [0, 0, s * -38], cubes: [{ from: [-0.5, 58, -11], size: [1, 6, 1], mat: blue }] },
          { name: n + '_tine_a', parent: n, pivot: [s * 0.5, 47, -10], rot: [0, 0, s * -62], cubes: [{ from: [-0.5, 47, -11], size: [1, 7, 1], mat: blue }] },
          { name: n + '_tine_b', parent: n + '_beam', pivot: [s * 0.5, 54, -10], rot: [0, 0, s * -40], cubes: [{ from: [-0.5, 54, -11], size: [1, 7, 1], mat: blue },
            { from: [0, 54.5, -11], size: [0, 4, 1], mat: gold, mask: (f, x, y) => y !== 1 } ] },
          { name: n + '_beads', parent: n + '_beam', pivot: [s * 0.5, 52, -10], rot: [0, 0, s * -20], cubes: [{ from: [0, 46, -10.5], size: [0, 6, 1], mat: gold, mask: (f, x, y) => y % 2 === 0 || y === 5 }] },
        ];
      }),
      // legs: strong fore legs; hind legs bent at the hock, a thick thigh
      ...[['leg_fl', -3.2, -7.5, 0], ['leg_fr', 3.2, -7.5, 0], ['leg_bl', -3, 7.5, 1], ['leg_br', 3, 7.5, 1]].flatMap(([n, x, z, hind]) => hind ? [
        { name: n, parent: 'body', pivot: [x, 22, z], rot: [-25, 0, 0], cubes: [{ from: [x - 2, 12, z - 2], size: [4, 11, 4], mat: beastPale }] },
        { name: n + '_low', parent: n, pivot: [x, 12.5, z], rot: [38, 0, 0], cubes: [
          { from: [x - 1.5, 1, z - 1.5], size: [3, 12, 3], mat: beastPale },
          { from: [x - 1.5, 0, z - 2.5], size: [3, 1, 4], mat: R('#93c0d2', '#74a4b8', '#5a8a9e') } ] },
      ] : [
        { name: n, parent: 'body', pivot: [x, 21, z], cubes: [
          { from: [x - 2, 11, z - 2], size: [4, 10, 4], mat: beastPale },
          { from: [x - 1.5, 2, z - 1.5], size: [3, 9, 3], mat: beastPale },
          { from: [x - 1.5, 0, z - 2.5], size: [3, 2, 4], mat: R('#93c0d2', '#74a4b8', '#5a8a9e') } ] },
      ]),
    ],
  },
  // ------------------------------------------------------------ Osty (v4): a skeletal hand standing like a spider — a
  // chunky angular carpal block on top, metacarpals sloping down and out, fingers bending down in phalanges that get
  // shorter and thinner, pointed fingertips; the thumb is a rear leg; knuckles bulge; a small soul flame at the wrist.
  osty: {
    render: 'cutout', glow: true,
    bones: [
      { name: 'palm', pivot: [0, 11, 0], cubes: [
        { from: [-4, 9, -3], size: [8, 4, 6], mat: withPattern(bone, bonePat) },
        { from: [-3, 13, -2], size: [6, 2, 4], mat: withPattern(bone, bonePat) },
        { from: [-4.5, 9.5, -3.5], size: [9, 2, 1], mat: withPattern(bone, bonePat) },
      ] },
      ...[-4.2, -1.5, 1.5, 4.2].flatMap((x, i) => {   // v2.3: fingers spread wider (user: too close together)
        const spread = -(i - 1.5) * 22, len = [5, 7, 7, 6][i];   // negative yaw turns a -z finger towards +x: outer fingers point outwards
        const knob = { mat: withPattern(bone, bonePat) };
        return [
          // metacarpal: long, sloping down and forward
          { name: 'finger_' + i, parent: 'palm', pivot: [x, 10.5, -3], rot: [32, spread, 0], cubes: [
            { from: [x - 1, 9.5, -3 - len], size: [2, 2, len], mat: withPattern(bone, bonePat) },
            { from: [x - 1.5, 9, -4 - len], size: [3, 3, 2], ...knob } ] },
          // proximal phalanx: bends steeply down
          { name: 'finger_' + i + '_mid', parent: 'finger_' + i, pivot: [x, 10.5, -3 - len - 0.5], rot: [48, 0, 0], cubes: [
            { from: [x - 1, 9.5, -8 - len], size: [2, 2, 4], mat: withPattern(bone, bonePat) },
            { from: [x - 1, 9.5, -9 - len], size: [2, 2, 1], inflate: 0.2, ...knob } ] },
          // distal phalanx with a pointed tip, thinner
          { name: 'finger_' + i + '_tip', parent: 'finger_' + i + '_mid', pivot: [x, 10.5, -8.5 - len], rot: [20, 0, 0], cubes: [
            { from: [x - 0.5, 10, -12 - len], size: [1, 1, 3], mat: withPattern(bone, bonePat), inflate: 0.15 },
            { from: [x - 0.5, 10, -13 - len], size: [1, 1, 1], mat: R('#d2c8aa', '#948a70') } ] },
        ];
      }),
      // thumb: reaches back and down as the rear leg
      { name: 'thumb', parent: 'palm', pivot: [3, 10.5, 2.5], rot: [-35, -35, 0], cubes: [
        { from: [2, 9.5, 2.5], size: [2, 2, 5], mat: withPattern(bone, bonePat) },
        { from: [1.5, 9, 7], size: [3, 3, 2], mat: withPattern(bone, bonePat) } ] },
      { name: 'thumb_tip', parent: 'thumb', pivot: [3, 10.5, 8], rot: [-50, 0, 0], cubes: [
        { from: [2, 9.5, 8], size: [2, 2, 4], mat: withPattern(bone, bonePat) },
        { from: [2.5, 10, 12], size: [1, 1, 2], mat: R('#d2c8aa', '#948a70') } ] },
      // wrist: the ends of the forearm bones rising up and back, a small soul flame between them
      { name: 'wrist', parent: 'palm', pivot: [0, 14, 1], rot: [-25, 0, 0], cubes: [
        { from: [-2.5, 14, 0], size: [2, 3, 2], mat: withPattern(bone, bonePat) },
        { from: [0.5, 14, 0], size: [2, 3, 2], mat: withPattern(bone, bonePat) } ] },
    ],
  },

  // ================================================================ batch 2: Underdocks (docs/design/mobs.md §9)
  // ------------------------------------------------------------ Corpse Slug: a blue sea slug (nudibranch) with yellow
  // stripes along its back, the front end raised, a fringe of pink tentacles round the mouth, a pale foot, two antennae.
  corpse_slug: {
    render: 'cutout',
    bones: [
      { name: 'body', pivot: [0, 2, 0], cubes: [
        { from: [-3, 0, -6], size: [6, 1, 13], mat: R('#d8d4cc', '#bdb8ae', '#a29c90') },
        { from: [-3.5, 1, -5], size: [7, 4, 12], mat: withPattern(R('#7ab8e0', '#5a9ccc', '#4682b4', '#356a98', '#285480'),
          (f, x, y, w, h) => f === 'up' ? (x % 3 === 1 ? '#e8c050' : 0) : (f === 'east' || f === 'west') ? (y === 1 && x % 4 !== 0 ? '#d8a840' : 0) : 0) },
        { from: [-2.5, 0, 7], size: [5, 3, 3], mat: R('#5a9ccc', '#4682b4', '#356a98') },
      ] },
      // the raised front with the mouth fringe
      { name: 'head', parent: 'body', pivot: [0, 3, -5], rot: [-28, 0, 0], cubes: [
        { from: [-3, 1, -9], size: [6, 6, 4], mat: R('#7ab8e0', '#5a9ccc', '#4682b4', '#356a98'),
          detail: { north: (x, y) => (y >= 2 && y <= 4 && x >= 1 && x <= 4 ? (y === 3 && x >= 2 && x <= 3 ? '#3a1620' : '#a8a4a0') : null) } },
        ...[[-2.5, 6], [-1, 7], [0.5, 7], [2, 6], [-3, 3.5], [2.5, 3.5]].map(([x, y]) => (
          { from: [x, y, -10], size: [1, 1, 3], mat: R('#f4b0a8', '#e08a80', '#c0685e') })),
      ] },
      ...[['antenna_l', -1.5, 20], ['antenna_r', 1.5, -20]].map(([n, x, rz]) => ({ name: n, parent: 'head', pivot: [x, 7, -6], rot: [-30, 0, rz], cubes: [
        { from: [x - 0.5, 7, -6.5], size: [1, 4, 1], mat: R('#5a9ccc', '#356a98') } ] })),
    ],
  },
  // ------------------------------------------------------------ Toadpole: a big teal tadpole hovering off the ground -
  // a round head with big orange eyes on its sides, a row of dark spots down the back, a long translucent tail fin.
  toadpole: {
    render: 'translucent',
    bones: [
      { name: 'body', pivot: [0, 6, 0], cubes: [
        { from: [-3.5, 3, -8], size: [7, 6, 6], mat: { ramp: ['#9ce0d0', '#7ccab8', '#5eb0a0', '#469488', '#347870'], alpha: 235 },
          detail: Object.fromEntries(['east', 'west'].map(f => [f, (x, y, w, h) => {
            const ex = f === 'east' ? w - 3 : 1;   // the big orange eye, near the front
            if (y >= 1 && y <= 3 && x >= ex && x <= ex + 1) return y === 2 && x === ex + (f === 'east' ? 1 : 0) ? '#1a1008' : '#f08a20';
            return null;
          }])) },
        { from: [-3, 3.5, -2], size: [6, 5, 5], mat: withPattern({ ramp: ['#7ccab8', '#5eb0a0', '#469488', '#347870'], alpha: 235 },
          (f, x, y) => (f === 'up' && x >= 2 && x <= 3 && y % 2 === 0 ? '#1c3830' : 0)) },
      ] },
      { name: 'tail', parent: 'body', pivot: [0, 6, 3], cubes: [
        { from: [-1.5, 4.5, 3], size: [3, 3, 4], mat: { ramp: ['#7ccab8', '#5eb0a0', '#469488'], alpha: 225 } },
        { from: [0, 3, 3], size: [0, 6, 10], mat: { ramp: ['#c8f0e4', '#a8e0d0', '#88c8b8'], alpha: 150 }, mask: (f, x, y, w, h) => Math.abs(y - (h - 1) / 2) <= (h / 2) * (1 - x / (w + 2)) + 0.3 },
      ] },
    ],
  },
  // ------------------------------------------------------------ Two-Tailed Rat: a hunched, upright rat - a heap of
  // shaggy grey-mauve fur, a long snout bent down, a small white eye, thin pink hands and legs, a long pink tail forked
  // at the end.
  two_tailed_rat: {
    render: 'cutout',
    bones: [
      { name: 'body', pivot: [0, 10, 1], rot: [28, 0, 0], cubes: [
        { from: [-4, 8, -3], size: [8, 10, 7], mat: withPattern(R('#c4b4c4', '#a898ac', '#8c7c92', '#706078', '#584a60'), furPat) },
        { from: [-4.5, 7, 4], size: [9, 10, 0], mat: withPattern(R('#a898ac', '#8c7c92', '#706078'), furPat), mask: ragged(2, 3) },
      ] },
      { name: 'head', parent: 'body', pivot: [0, 17, -2], rot: [40, 0, 0], cubes: [
        { from: [-2.5, 15, -6], size: [5, 5, 5], mat: withPattern(R('#c4b4c4', '#a898ac', '#8c7c92', '#706078'), furPat),
          detail: Object.fromEntries(['east', 'west'].map(f => [f, (x, y, w) => (y === 1 && x === (f === 'east' ? w - 2 : 1) ? '#f8f8ff' : null)])) },
        { from: [-1.5, 15.5, -10], size: [3, 3, 4], mat: R('#a898ac', '#8c7c92', '#706078') },
        { from: [-1, 15.5, -11], size: [2, 2, 1], mat: R('#f0b0a8', '#d89088') },
      ] },
      ...[['arm_l', -3], ['arm_r', 3]].map(([n, x]) => ({ name: n, parent: 'body', pivot: [x, 15, -2], rot: [-50, 0, 0], cubes: [
        { from: [x - 0.5, 10, -2.5], size: [1, 5, 1], mat: R('#f0c0b0', '#d8a090', '#b88070') },
        { from: [x - 1, 9, -3], size: [2, 1, 2], mat: R('#f0c0b0', '#d8a090') } ] })),
      ...[['leg_l', -2.5], ['leg_r', 2.5]].flatMap(([n, x]) => [
        { name: n, parent: 'body', pivot: [x, 9, 2], rot: [-28, 0, 0], cubes: [
          { from: [x - 1.5, 5, 0], size: [3, 5, 4], mat: withPattern(R('#a898ac', '#8c7c92', '#706078'), furPat) } ] },
        { name: n + '_shin', parent: n, pivot: [x, 5, 2], rot: [40, 0, 0], cubes: [
          { from: [x - 0.5, 0, 1.5], size: [1, 5, 1], mat: R('#f0c0b0', '#d8a090', '#b88070') },
          { from: [x - 1, -0.5, -1.5], size: [2, 1, 4], mat: R('#f0c0b0', '#d8a090') } ] },
      ]),
      { name: 'tail', parent: 'body', pivot: [0, 9, 4], rot: [-60, 0, 0], cubes: [
        { from: [-0.5, 9, 4], size: [1, 1, 13], mat: R('#f0c0b0', '#d8a090', '#b88070') },
        { from: [-1.5, 9, 16], size: [1, 1, 3], mat: R('#d8a090', '#b88070') }, { from: [0.5, 9, 16], size: [1, 1, 3], mat: R('#d8a090', '#b88070') },
      ] },
    ],
  },
  // ------------------------------------------------------------ Seapunk: a mound of kelp with a gaping brown mouth,
  // and a crest of long thin stalks, each ending in a leaf, fanning up like a punk's spikes.
  seapunk: {
    render: 'cutout',
    bones: [
      { name: 'body', pivot: [0, 3, 0], cubes: [
        { from: [-4.5, 0, -4], size: [9, 7, 8], mat: withPattern(R('#a8d870', '#88c058', '#6aa044', '#4e8034', '#3a6226'), furPat),
          detail: { north: (x, y, w, h) => (y >= 2 && y <= 5 && x >= 2 && x <= w - 3 ? (y === 2 ? '#6a3a20' : '#3a1a10') : null) } },
        { from: [-5, 0, -4.5], size: [10, 6, 0], mat: withPattern(R('#88c058', '#6aa044', '#4e8034'), furPat),
          mask: (f, x, y, w, h) => !(y >= 2 && y <= 5 && x >= 2 && x <= w - 3) && ragged(2, 4)(f, x, y, w, h) },
        { from: [-5, 0, 4.5], size: [10, 7, 0], mat: withPattern(R('#88c058', '#6aa044', '#4e8034'), furPat), mask: ragged(2, 6) },
      ] },
      ...[[-25, -30], [-12, -45], [0, -55], [12, -45], [25, -30], [-20, 10], [20, 10], [0, 20]].map(([rz, rx], i) => ({
        name: 'stalk_' + i, parent: 'body', pivot: [rz / 10, 7, (i % 3) - 1], rot: [rx + 20, 0, rz], cubes: [
          { from: [rz / 10 - 0.5, 7, (i % 3) - 1.5], size: [1, 10 + (i % 3) * 2, 1], mat: R('#88c058', '#6aa044', '#4e8034') },
          { from: [rz / 10 - 1.5, 17 + (i % 3) * 2, (i % 3) - 1], size: [3, 4, 0], mat: R('#7ad070', '#58b058', '#3e9048'), mask: leafMask },
        ] })),
    ],
  },
  // ------------------------------------------------------------ Terror Eel (elite): a thick blue eel with a long flat
  // crocodile jaw and a jagged dark mouth line, red-ringed eyes all over its back, an orange dorsal fin, the tail end
  // curling up, banded yellow-orange, with a fin at the tip.
  terror_eel: {
    render: 'cutout', scale: 1.3,
    bones: [
      { name: 'body', pivot: [0, 3, 0], cubes: [
        { from: [-3.5, 0, -5], size: [7, 6, 9], mat: withPattern(R('#8aaacc', '#6e8eb4', '#57759a', '#435e80', '#324866'), (f, x, y) =>
          f === 'down' ? 0 : (x * 3 + y * 7) % 11 === 0 ? '#d83a3a' : (x * 3 + y * 7) % 11 === 1 ? '#f8f0e8' : 0), faceMat: { down: R('#d8d0c0', '#bdb5a4') } },
        { from: [0, 6, -4], size: [0, 3, 7], mat: R('#f0a040', '#d88030', '#b86020'), mask: (f, x, y, w, h) => y >= Math.round(h - 1 - x / 2.5) },
      ] },
      { name: 'head', parent: 'body', pivot: [0, 3, -5], cubes: [
        { from: [-3, 1, -14], size: [6, 4, 9], mat: R('#8aaacc', '#6e8eb4', '#57759a', '#435e80'),
          detail: Object.fromEntries(['east', 'west'].map(f => [f, (x, y, w, h) => (y === 3 ? ((x % 2) === 0 ? '#1a2030' : '#f0ece0') : y === 0 && x === (f === 'east' ? w - 3 : 2) ? '#d83a3a' : null)])) },
        { from: [-2.5, 0, -13], size: [5, 1, 8], mat: R('#d8d0c0', '#bdb5a4', '#a09888') },
      ] },
      { name: 'body_2', parent: 'body', pivot: [0, 3, 4], cubes: [
        { from: [-3, 0.5, 4], size: [6, 5, 8], mat: withPattern(R('#8aaacc', '#6e8eb4', '#57759a', '#435e80', '#324866'), (f, x, y) =>
          f === 'down' ? 0 : (x * 5 + y * 3) % 13 === 0 ? '#d83a3a' : (x * 5 + y * 3) % 13 === 1 ? '#f8f0e8' : 0), faceMat: { down: R('#d8d0c0', '#bdb5a4') } } ] },
      { name: 'tail', parent: 'body_2', pivot: [0, 3, 12], rot: [35, 0, 0], cubes: [
        { from: [-2, 1, 12], size: [4, 4, 7], mat: withPattern(R('#6e8eb4', '#57759a', '#435e80'), (f, x, y, w, h) => (f !== 'down' && Math.floor((f === 'up' ? y : x) / 2) % 2 === 0 ? '#f0b030' : 0)) } ] },
      { name: 'tail_tip', parent: 'tail', pivot: [0, 3, 19], rot: [35, 0, 0], cubes: [
        { from: [-1.5, 1.5, 19], size: [3, 3, 5], mat: withPattern(R('#57759a', '#435e80'), (f, x, y) => (Math.floor(x / 2) % 2 === 0 ? '#e88030' : 0)) },
        { from: [0, 0, 23], size: [0, 6, 4], mat: R('#f0a040', '#d88030', '#b86020'), mask: leafMask },
      ] },
    ],
  },
  // ------------------------------------------------------------ Soul Fysh (boss): a tall, flat ghost fish of
  // translucent teal - thick lips, a glowing eye, the organs visible inside (an orange stomach, coiled purple gut,
  // a clutch of yellow eggs), translucent dorsal, tail and side fins.
  soul_fysh: {
    render: 'translucent', scale: 1.4, glow: true,
    bones: [
      { name: 'body', pivot: [0, 16, 0], cubes: [
        { from: [-3, 6, -10], size: [6, 20, 20], mat: { ramp: ['#bff4ec', '#8edcd2', '#62c0b6', '#42a09a', '#2e807c'], alpha: 140 } },
        // organs, seen through the body
        { from: [-1.5, 13, -5], size: [3, 6, 6], mat: { ramp: ['#ffb070', '#f08a50', '#d06a38'], alpha: 230 } },
        { from: [-1.5, 18, 0], size: [3, 5, 6], mat: withPattern({ ramp: ['#c8a0e0', '#a880c8', '#8860a8'], alpha: 230 }, (f, x, y) => ((x + y) % 3 === 0 ? 1 : 0)) },
        { from: [-1.5, 10, -8], size: [3, 3, 4], mat: withPattern({ ramp: ['#fff0a0', '#f0d060', '#d0b040'], alpha: 230 }, (f, x, y) => ((x + y) % 2 === 0 ? -0.8 : 0.5)) },
      ] },
      { name: 'head', parent: 'body', pivot: [0, 16, -10], cubes: [
        { from: [-2.5, 11, -13], size: [5, 4, 3], mat: { ramp: ['#8edcd2', '#62c0b6', '#42a09a', '#2e807c'], alpha: 200 } },
        // the glowing eye on each side
        { from: [-3, 17, -9], size: [6, 2, 2], inflate: 0.2, mat: glowing(R('#fff6a0', '#e8d040', '#202010')),
          detail: Object.fromEntries(['east', 'west'].map(f => [f, (x, y) => (x === 0 && y === 1 ? '#101008' : null)])) },
      ] },
      { name: 'fin_top', parent: 'body', pivot: [0, 26, 0], cubes: [
        { from: [0, 26, -6], size: [0, 8, 14], mat: { ramp: ['#bff4ec', '#8edcd2', '#62c0b6'], alpha: 140 }, mask: (f, x, y, w, h) => y >= Math.round((h - 1) * Math.abs(x - w * 0.35) / w * 1.4) } ] },
      { name: 'tail', parent: 'body', pivot: [0, 16, 10], cubes: [
        { from: [0, 7, 10], size: [0, 18, 8], mat: { ramp: ['#bff4ec', '#8edcd2', '#62c0b6'], alpha: 140 }, mask: (f, x, y, w, h) => Math.abs(y - (h - 1) / 2) <= (h / 2) * (0.35 + 0.65 * x / (w - 1)) } ] },
      ...[['fin_l', -3], ['fin_r', 3]].map(([n, x]) => ({ name: n, parent: 'body', pivot: [x, 12, -3], rot: [0, x < 0 ? -25 : 25, 0], cubes: [
        { from: [x, 9, -3], size: [0, 5, 7], mat: { ramp: ['#bff4ec', '#8edcd2', '#62c0b6'], alpha: 150 }, mask: leafMask } ] })),
    ],
  },
  // ------------------------------------------------------------ The Merchant (STS merchant art, MerchantWithProps.png):
  // a figure wrapped head to toe in a deep blue blanket-cloak, sitting cross-legged; a pointed hood whose tip folds
  // back, a round pale moon-like mask in the hood's opening, pale blue bare feet crossed in front; he sits on a dark
  // green rug scattered with little gold triangles, a coin bag beside him.
  merchant: {
    render: 'cutout',
    bones: [
      { name: 'rug', pivot: [0, 0, 0], cubes: [
        { from: [-14, 0.1, -12], size: [28, 0, 22], mat: withPattern(R('#5a7a44', '#466636', '#36542a', '#284220', '#1c3216'), (f, x, y, w, h) => {
          if (x === 0 || y === 0 || x === w - 1 || y === h - 1) return 1.6;                      // darker hem
          const gx = (x + (Math.floor(y / 3) % 2) * 2) % 4, gy = y % 3;                           // staggered little triangles
          if (gy === 2 && gx <= 2 && hash(Math.floor((x + 2) / 4), Math.floor(y / 3)) < 4) return gx === 1 ? '#e8c450' : '#c8a038';
          if (gy === 1 && gx === 1 && hash(Math.floor((x + 2) / 4), Math.floor(y / 3)) < 4) return '#f2d870';
          return 0.4; }) },
      ] },
      { name: 'body', pivot: [0, 0, 0], cubes: [
        // the crossed legs under the blanket: a broad low mound
        { from: [-8, 0, -6], size: [16, 4, 12], mat: withPattern(R('#5c88d8', '#4670c4', '#3a60b0', '#2e4e96', '#223c78', '#182c5a'), (f, x, y, w, h) =>
          (f === 'up' ? 0 : (x * 3 + y) % 9 === 0 ? 1 : 0)) },
        // the wrapped body, narrowing to the shoulders, with a fold running across the front
        { from: [-6, 4, -4], size: [12, 5, 9], mat: withPattern(R('#5c88d8', '#4670c4', '#3a60b0', '#2e4e96', '#223c78'), (f, x, y, w, h) =>
          (f === 'north' && y === Math.round(x * 0.5) + 1 && x < w - 1 ? 1.5 : f === 'north' && y === Math.round(x * 0.5) ? -0.6 : 0)) },
        { from: [-5, 9, -3], size: [10, 3, 7], mat: R('#5c88d8', '#4670c4', '#3a60b0', '#2e4e96') },
        // feet: pale blue soles, crossed in front
        { from: [-4, 0, -8], size: [3, 2, 2], mat: R('#c4e6f0', '#a2d0e2', '#82b6cc', '#6698b0') },
        { from: [1, 0.5, -8], size: [3, 2, 2], mat: R('#c4e6f0', '#a2d0e2', '#82b6cc', '#6698b0') },
      ] },
      { name: 'head', parent: 'body', pivot: [0, 12, 0], cubes: [
        // the hood
        { from: [-4, 12, -4], size: [8, 8, 8], mat: R('#5c88d8', '#4670c4', '#3a60b0', '#2e4e96', '#223c78'),
          detail: { north: (x, y, w, h) => (x >= 1 && x <= 6 && y >= 1 && y <= 6 && Math.hypot(x - 3.5, y - 3.5) <= 3.3 ? '#162a50' : null) } },
        // the round mask in the opening: a pale disc, faintly tinted at the rim, darker crescent at the lower right
        { from: [-3, 13, -4.5], size: [6, 6, 0], mat: R('#fbf6ea', '#f0e8d6', '#e0d4bc'),
          mask: (f, x, y, w, h) => Math.hypot(x - 2.5, y - 2.5) <= 2.9,
          detail: { north: (x, y) => { const d = Math.hypot(x - 2.5, y - 2.5);
            if (d > 2.2) return x + y < 4 ? '#e8b8b0' : x > y ? '#b8d4e8' : '#d8c0d8';
            if (x + y >= 7) return '#d8ccb4';
            return null; } } },
      ] },
      { name: 'hood_tip', parent: 'head', pivot: [0, 20, 2], rot: [-50, 0, 0], cubes: [
        { from: [-1.5, 19, 1], size: [3, 3, 3], mat: R('#4670c4', '#3a60b0', '#2e4e96', '#223c78') },
      ] },
      { name: 'bag', pivot: [10, 0, 2], cubes: [
        { from: [8, 0.1, 0], size: [4, 4, 4], mat: R('#f0dcb0', '#dcc290', '#c2a674', '#a08658'),
          detail: { north: (x, y) => ((x === 1 && y === 1) || (x === 2 && y === 2) || (x === 1 && y === 2) || (x === 2 && y === 1) ? '#b8402e' : null) } },
        { from: [9, 4, 1], size: [2, 1, 2], mat: R('#c2a674', '#a08658', '#806840') },
      ] },
    ],
  },
};
Object.assign(module.exports, require('./specs_hive'));   // batch 3: the Hive
Object.assign(module.exports, require('./specs_docks'));   // batch 2 v6 (2026-11-18)
Object.assign(module.exports, require('./specs_scripted'));   // §11 data-driven monsters
Object.assign(module.exports, require('./specs_v7'));   // v7 anatomy (2026-11-18)
Object.assign(module.exports, require('./specs_v8'));   // v8 angled builds (2026-11-18)
Object.assign(module.exports, require('./specs_v9'));   // v9 angled elites + refined normals (2026-11-19)
Object.assign(module.exports, require('./specs_v9'));   // v9 fidelity review (2026-11-19)
Object.assign(module.exports, require('./specs_v10'));   // v10 second fidelity review (2026-11-19)
Object.assign(module.exports, require('./specs_glory'));   // Glory G1: the brass machines, the Globe Head, the Scroll of Biting (2026-11-26)
Object.assign(module.exports, require('./specs_glory2'));   // Glory G2: the Queen, the Knight Gang, the Frog Knight... (2026-11-26)
Object.assign(module.exports, require('./specs_glory3'));   // Glory G3: the Axebot, the Soul Nexus, the Test Subject (2026-11-26)
Object.assign(module.exports, require('./specs_glory_v2a'));   // Glory v2: the people rebuilt, the Rhino Beetle, the Frog Trainer (2026-11-26)
Object.assign(module.exports, require('./specs_glory_v2b'));   // Glory v2: the creatures and machines repainted; G4 the Owl Magistrate and the Aeonglass
