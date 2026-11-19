// v4 sections spliced into specs.js by the v4 update (kept for reference; specs.js is the source of truth).
module.exports.helpers = `
// ---- v4 surface textures (user: "羽毛、绒毛等可以更细致一点，考虑渐变、层次、纹路"): deterministic patterns that add
// layered detail on top of each face's gradient. Values are shade-step offsets (+ darker, − lighter).
/** Fur: vertical strands (alternating light/dark columns), lighter flecks at strand tips, a few deep partings. */
const furPat = (f, x, y, w, h) => {
  if (f === 'up' || f === 'down') return ((x * 3 + y * 5) % 7 === 0 ? -0.8 : 0) + ((x + 2 * y) % 5 === 0 ? 0.6 : 0);
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
/** Moss: soft clumps. */
const mossPat = (f, x, y) => ((x * 5 + y * 3) % 7 < 2 ? -0.7 : (x * 2 + y) % 5 === 0 ? 0.7 : 0);
`;

module.exports.wurm = `  // ------------------------------------------------------------ Fuzzy Wurm Crawler (v4): a ringed grub tube rising out
  // of the ground and curling forward, the toothed mouth at its top end; a shaggy lilac pelt draped over its back and
  // streaming behind; sage-green leaf blades poking out of the fur. Segments are chained bones, each bent a little more.
  fuzzy_wurm_crawler: {
    render: 'cutout',
    bones: [
      { name: 'body_3', pivot: [0, 3, 4], cubes: [
        { from: [-4, 0, 0], size: [8, 6, 8], mat: withPattern(wurmSkin, ringPat('z')) },
        { from: [-3, 0, 8], size: [6, 4, 3], mat: withPattern(wurmSkin, ringPat('z')) },
      ] },
      { name: 'body_2', parent: 'body_3', pivot: [0, 5, 1], rot: [18, 0, 0], cubes: [
        { from: [-3.5, 5, -2.5], size: [7, 5, 7], mat: withPattern(wurmSkin, ringPat('y')) } ] },
      { name: 'body_1', parent: 'body_2', pivot: [0, 10, 1], rot: [24, 0, 0], cubes: [
        { from: [-3.5, 10, -2.5], size: [7, 5, 7], mat: withPattern(wurmSkin, ringPat('y')) } ] },
      // the mouth: a flared pink lip ring at the top of the tube; the opening faces forward once the tube is bent
      { name: 'head', parent: 'body_1', pivot: [0, 15, 1], rot: [28, 0, 0], cubes: [
        { from: [-4, 15, -3], size: [8, 4, 8], mat: lip, detail: { up: (x, y) => {
          const d = Math.hypot(x - 3.5, y - 3.5);
          if (d < 2.1) return d < 1.2 ? '#1e0408' : '#3a0c12';
          if (d < 3.0) return (Math.round(Math.atan2(y - 3.5, x - 3.5) * 2.6) % 2 === 0) ? '#f8f0c8' : '#5a1418';
          return null;
        } } },
      ] },
      // pelt: a shaggy mane over the back of the tube, tilted back so it streams behind, with strand layers
      { name: 'hair', parent: 'body_1', pivot: [0, 13, 3], rot: [-48, 0, 0], cubes: [
        { from: [-5.5, 6, 3], size: [11, 11, 6], mat: withPattern(furPurple, furPat), mask: (f, x, y, w, h) => f === 'up' || f === 'down' || ragged(3, 2)(f, x, y, w, h) },
        { from: [-6, 5, 9], size: [12, 13, 0], mat: withPattern(furPurple, furPat), mask: ragged(4, 7) },
        { from: [-6.5, 4, 3], size: [0, 13, 7], mat: withPattern(furPurple, furPat), mask: ragged(4, 3) },
        { from: [6.5, 4, 3], size: [0, 13, 7], mat: withPattern(furPurple, furPat), mask: ragged(4, 4) },
      ] },
      // fringe arching forward over the mouth
      { name: 'fringe', parent: 'head', pivot: [0, 19, 4], rot: [-20, 0, 0], cubes: [
        { from: [-5, 17, 2], size: [10, 4, 4], mat: withPattern(furPurple, furPat), mask: (f, x, y, w, h) => f === 'up' || f === 'down' || ragged(2, 6)(f, x, y, w, h) },
        { from: [-5.5, 15, 1], size: [11, 6, 0], mat: withPattern(furPurple, furPat), mask: ragged(3, 9) },
      ] },
      // sage-green leaf blades sticking out of the fur at angles
      ...[[-6, 9, 1, -35, 0, 'leaf_a'], [6, 11, 3, 25, 0, 'leaf_b'], [-5, 4, -1, -60, 15, 'leaf_c']].map(([x, y, z, rz, rx, n]) => ({
        name: n, parent: 'body_2', pivot: [x, y, z], rot: [rx, 0, rz], cubes: [
          { from: [x - 1, y, z], size: [3, 8, 0], mat: R('#dcead0', '#b8cfa6', '#93ad80', '#6f8a5e'), mask: leafMask } ] })),
      { name: 'tuft', parent: 'body_3', pivot: [0, 6, 4], rot: [-15, 0, 0], cubes: [
        { from: [-4.5, 5, 2], size: [9, 4, 0], mat: withPattern(furPurple, furPat), mask: tufts(2, 11) },
        { from: [-4.5, 5, 6], size: [9, 3, 0], mat: withPattern(furPurple, furPat), mask: tufts(2, 12) },
      ] },
    ],
  },
`;

module.exports.byrdonis = `  // ------------------------------------------------------------ Byrdonis (v4): terror bird — shaggy neck, grey-green face
  // patch with a large pink eye, hooked beak, spiky crest; wings of scalloped feather rows with white primaries; thin
  // tail ending in a spiky fan; reverse-knee legs (thigh forward, shank back) with black talons.
  byrdonis: {
    render: 'cutout', scale: 1.0,
    bones: [
      { name: 'body', pivot: [0, 19, 0], rot: [-10, 0, 0], cubes: [
        { from: [-5.5, 14, -7], size: [11, 10, 15], mat: withPattern(feather, featherPat) },
        // fluffy belly fringe
        { from: [-5, 12, -6], size: [10, 3, 0], mat: withPattern(feather, furPat), mask: ragged(2, 3) },
      ] },
      { name: 'neck', parent: 'body', pivot: [0, 22, -5], rot: [14, 0, 0], cubes: [
        { from: [-3, 21, -8.5], size: [6, 11, 6], mat: withPattern(feather, furPat) },
        { from: [-3.5, 21, -9], size: [7, 10, 0], mat: withPattern(feather, furPat), mask: ragged(2, 5) },
      ] },
      { name: 'head', parent: 'neck', pivot: [0, 32, -5.5], rot: [-4, 0, 0], cubes: [
        { from: [-3, 31, -9.5], size: [6, 6, 7], mat: withPattern(feather, featherPat),
          detail: Object.fromEntries(['east', 'west'].map(f => [f, (x, y, w, h) => {
            // bare grey-green face patch with a large pink eye (2×2, dark pupil, sleepy lid)
            const ex = f === 'east' ? w - 3 : 1;
            if (x >= ex - 1 && x <= ex + 2 && y >= 1 && y <= 4) {
              if (y === 1 && x >= ex && x <= ex + 1) return '#8c5a6a';
              if (y >= 2 && y <= 3 && x >= ex && x <= ex + 1) return x === (f === 'east' ? ex : ex + 1) && y === 3 ? '#4a1a2a' : '#f08aa0';
              return '#8fa08a';
            }
            return null;
          }])) },
      ] },
      // spiky crest: three feathers fanning back off the crown
      ...[[-1, -25, 'crest'], [0, -45, 'crest_b'], [1, -65, 'crest_c']].map(([dx, rx, n]) => ({ name: n, parent: 'head', pivot: [dx, 37, -4], rot: [rx, dx * 12, 0],
        cubes: [{ from: [dx, 37, -4], size: [0, 6, 2], mat: feather, mask: (f, x, y, w, h) => x === 0 || y >= 2 }] })),
      // big hooked pink beak
      { name: 'beak', parent: 'head', pivot: [0, 34, -9.5], cubes: [
        { from: [-2, 33, -16.5], size: [4, 4, 7], mat: withPattern(beak, (f, x, y) => (f === 'up' && x % 3 === 1 ? -0.5 : 0)) },
        { from: [-1.5, 30.5, -17.5], size: [3, 4, 2], mat: beak },
        { from: [-1.5, 31, -15], size: [3, 2, 5], mat: R('#c46a6a', '#984a4a', '#783838') },
      ] },
      // tail: a thin stalk curving back and down, ending in a spiky fan
      { name: 'tail', parent: 'body', pivot: [0, 20, 8], rot: [-35, 0, 0], cubes: [
        { from: [-1, 19, 8], size: [2, 2, 10], mat: withPattern(feather, featherPat) },
        // white primaries sticking out over the tail base
        { from: [-3.5, 22, 4], size: [7, 0, 9], mat: featherTip, mask: (f, x, y, w, h) => x % 2 === 0 ? y < h - (x % 4 === 0 ? 0 : 2) : y < h - 4 },
      ] },
      { name: 'tail_tip', parent: 'tail', pivot: [0, 20, 18], rot: [30, 0, 0], cubes: [
        { from: [-1, 19.5, 18], size: [2, 1, 6], mat: feather },
        { from: [-4, 20, 21], size: [8, 0, 4], mat: feather, mask: (f, x, y) => (x === 1 || x === 3 || x === 4 || x === 6) || y === 3 },
      ] },
      // folded wings: scalloped feather rows, white-tipped primaries trailing back
      ...[['wing_l', -5.5, -1], ['wing_r', 5.5, 1]].map(([n, x, s]) => ({ name: n, parent: 'body', pivot: [x, 23, -4], rot: [-6, 0, s * 4], cubes: [
        { from: [s < 0 ? x - 1 : x, 16, -5], size: [1, 7, 12], mat: withPattern(feather, featherPat),
          detail: Object.fromEntries(['east', 'west'].map(f => [f, (px, py, w, h) => (py >= h - 2 && px % 2 === 0 ? '#f6fbee' : null)])) },
        { from: [s < 0 ? x - 1 : x + 1, 18, 7], size: [0, 5, 6], mat: featherTip, mask: (f, px, py) => py >= px % 3 },
      ] })),
      // legs: feathered thigh angled forward, shank angled back (reverse knee), black talons
      ...[['leg_l', -3], ['leg_r', 3]].flatMap(([n, x]) => [
        { name: n, parent: 'body', pivot: [x, 15, 2], rot: [-28, 0, 0], cubes: [
          { from: [x - 2, 8, 0], size: [4, 8, 5], mat: withPattern(R('#cddcc0', '#b2c4a4', '#96a888', '#7a8c6e'), furPat) } ] },
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
`;

module.exports.beast = `  // ------------------------------------------------------------ Ceremonial Beast (v4): a slender pale deer with a
  // skull-like face and ONE large glowing green eye, thick crescent antler prongs (angled bars, glowing) hung with gold
  // bead strings, a layered leaf mane over neck and chest, gold chains, a long thin tail with a tuft, bent hind legs.
  ceremonial_beast: {
    render: 'cutout', scale: 1.0, glow: true,
    bones: [
      { name: 'body', pivot: [0, 24, 0], cubes: [
        { from: [-4.5, 19, -10], size: [9, 9, 20], mat: beastPale },
        // gold chains draped along the flanks
        ...[-1, 1].map(s => ({ from: [s * 4.6, 20, -6], size: [0, 4, 12], mat: gold, mask: (f, x, y, w, h) => y === Math.round(1.5 + 1.5 * Math.sin(x * 0.45)) && x % 2 === 0 })),
      ] },
      // long thin tail with a tuft
      { name: 'tail', parent: 'body', pivot: [0, 27, 10], rot: [-55, 0, 0], cubes: [
        { from: [-0.5, 27, 10], size: [1, 1, 12], mat: beastPale },
        { from: [-1.5, 26.5, 20], size: [3, 2, 4], mat: withPattern(beastPale, furPat) } ] },
      { name: 'neck', parent: 'body', pivot: [0, 26, -8], rot: [32, 0, 0], cubes: [
        { from: [-2.5, 25, -11], size: [5, 13, 5], mat: beastPale } ] },
      // the mane: overlapping layers of leaf scales over neck and chest
      ...[[0, 23, -10.5, 10, 12, 0, 'mane_a'], [0, 27, -11.5, 9, 11, -10, 'mane_b'], [0, 31, -12, 8, 9, -20, 'mane_c']].map(([x, y, z, w, h, r, n]) => ({
        name: n, parent: 'neck', pivot: [x, y + h, z], rot: [r, 0, 0], cubes: [
          { from: [x - w / 2, y, z], size: [w, h, 0], mat: withPattern(mane, leafPat), mask: (f, px, py, fw, fh) => py < fh - ((px % 3 === 1) ? 0 : 1) && Math.abs(px - (fw - 1) / 2) <= fw / 2 - (py < 2 ? 1 : 0) } ] })),
      { name: 'head', parent: 'neck', pivot: [0, 38, -8.5], rot: [-34, 0, 0], cubes: [
        // narrow skull-like head tapering to the muzzle
        { from: [-2.5, 36, -14], size: [5, 5, 7], mat: withPattern(beastPale, bonePat),
          detail: { north: (x, y) => (y >= 2 && y <= 3 && x >= 1 && x <= 3 ? (y === 2 && x === 2 ? '#e8ffd0' : '#7af06a') : y === 1 && x >= 1 && x <= 3 ? '#93c0d2' : null) } },
        { from: [-1.5, 35.5, -18], size: [3, 3, 4], mat: withPattern(beastPale, bonePat) },
        // the single eye also seen from the sides (it is large): a green glint on each cheek edge
        { from: [-2.6, 38, -14.2], size: [5, 1, 0], mat: glowing(R('#a8ff90', '#7af06a', '#4ac040')), mask: (f, x) => x >= 1 && x <= 3 },
        // ears
        { from: [-5, 40, -9], size: [3, 1, 1], mat: beastPale }, { from: [2, 40, -9], size: [3, 1, 1], mat: beastPale },
      ] },
      // antlers: a thick curved main beam per side (angled bars) with three upward tines, glowing; gold beads hang off
      ...[-1, 1].flatMap(s => {
        const n = s < 0 ? 'antler_l' : 'antler_r';
        const blue = withPattern(antlerBlue, (f, x, y) => ((x + y) % 4 === 0 ? 0.8 : 0));
        return [
          { name: n, parent: 'head', pivot: [s * 1.5, 41, -10], rot: [-15, 0, s * -55], cubes: [{ from: [s < 0 ? -0.5 : -0.5, 41, -11], size: [2, 9, 2], mat: blue }] },
          { name: n + '_beam', parent: n, pivot: [s * 0.5, 49.5, -10], rot: [0, 0, s * 45], cubes: [{ from: [-0.5, 49.5, -11], size: [2, 9, 2], mat: blue }] },
          { name: n + '_tip', parent: n + '_beam', pivot: [s * 0.5, 58, -10], rot: [0, 0, s * 35], cubes: [{ from: [-0.5, 58, -11], size: [1, 6, 1], mat: blue }] },
          { name: n + '_tine_a', parent: n, pivot: [s * 0.5, 47, -10], rot: [0, 0, s * 70], cubes: [{ from: [-0.5, 47, -11], size: [1, 7, 1], mat: blue }] },
          { name: n + '_tine_b', parent: n + '_beam', pivot: [s * 0.5, 54, -10], rot: [0, 0, s * 60], cubes: [{ from: [-0.5, 54, -11], size: [1, 7, 1], mat: blue },
            { from: [0, 54.5, -11], size: [0, 4, 1], mat: gold, mask: (f, x, y) => y !== 1 } ] },
          { name: n + '_beads', parent: n + '_beam', pivot: [s * 0.5, 52, -10], rot: [0, 0, s * -45], cubes: [{ from: [0, 46, -10.5], size: [0, 6, 1], mat: gold, mask: (f, x, y) => y % 2 === 0 || y === 5 }] },
        ];
      }),
      // legs: fore legs straight and slender; hind legs bent at the hock
      ...[['leg_fl', -3, -7.5, 0], ['leg_fr', 3, -7.5, 0], ['leg_bl', -3, 7.5, 1], ['leg_br', 3, 7.5, 1]].flatMap(([n, x, z, hind]) => hind ? [
        { name: n, parent: 'body', pivot: [x, 21, z], rot: [-25, 0, 0], cubes: [{ from: [x - 1.5, 12, z - 1.5], size: [3, 10, 3], mat: beastPale }] },
        { name: n + '_low', parent: n, pivot: [x, 12.5, z], rot: [38, 0, 0], cubes: [
          { from: [x - 1, 1, z - 1], size: [2, 12, 2], mat: beastPale },
          { from: [x - 1, 0, z - 2], size: [2, 1, 3], mat: R('#93c0d2', '#74a4b8', '#5a8a9e') } ] },
      ] : [
        { name: n, parent: 'body', pivot: [x, 21, z], cubes: [
          { from: [x - 1, 2, z - 1], size: [2, 19, 2], mat: beastPale },
          { from: [x - 1, 0, z - 2], size: [2, 2, 3], mat: R('#93c0d2', '#74a4b8', '#5a8a9e') } ] },
      ]),
    ],
  },
`;

module.exports.osty = `  // ------------------------------------------------------------ Osty (v4): a skeletal hand standing like a spider — a
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
      ...[-3.6, -1.2, 1.2, 3.6].flatMap((x, i) => {
        const spread = (i - 1.5) * 10, len = [5, 7, 7, 6][i];
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
      { name: 'flame', parent: 'wrist', pivot: [0, 16, 1], rot: [0, 45, 0], cubes: [
        { from: [-3, 16, 1], size: [6, 8, 0], mat: flame, mask: flameMask },
        { from: [0, 16, -2], size: [0, 8, 6], mat: flame, mask: flameMask } ] },
    ],
  },
`;
