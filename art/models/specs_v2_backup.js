// Phase 8 batch 1 model specs (docs/design/mobs.md §4), v2 — reworked after the Blockbench "Minecraft Style Guide":
// few elements; no stair-stepped curves (one element, or a rotated one); small parts as 2-faced planes with transparent
// pixels (leaves, feathers, fur, antlers, flames, antennae); textures shaded deliberately (top/front brighter than
// bottom/back), no random noise. Slimes start from the vanilla slime model (8³ shell, 6³ core, eyes, mouth).
//
// Coordinates in pixels, Blockbench style: y up, ground at 0, front towards -Z.
// Bones: { name, pivot, parent?, rot?: [x,y,z] degrees, cubes }. Cubes: { from, size, mat, faceMat?, detail?, mask? }.
//   A size of 0 on one axis makes a plane. mask(face, x, y, w, h) → false = transparent pixel.
//   detail[face](x, y, w, h) → '#hex' to paint a pixel, null to keep the material.
// Materials: ramp light → dark (hue-shifted, sampled from the STS2 renders), alpha?, emissive?,
//   pattern(face, x, y, w, h) → integer shade offset (deliberate pattern: scales, stripes, feather rows) or '#hex'.

const R = (...ramp) => ({ ramp });
const withPattern = (m, pattern) => ({ ...m, pattern });

// ---- palettes (STS2 k-means samples, extended to hue-shifted ramps)
const leafJelly = { ramp: ['#a8d0d2', '#88b0b4', '#6c979b', '#557f84', '#3d666b', '#2c4f54'], alpha: 190 };
const leafCore = R('#6c979b', '#4f7c80', '#3e6a6e', '#2e5458');
const moss = R('#b0bc58', '#93a33e', '#78892f', '#5f7124', '#465a1a');
const twigJelly = { ramp: ['#ecfcc8', '#d2f687', '#bddf74', '#a6c25f', '#889445', '#6c7834'], alpha: 200 };
const twigCore = R('#f0a0a8', '#e07a8a', '#c25a6c', '#9a4054');
const twig = R('#8a7046', '#6a5432', '#4e3c22', '#342716');
const furPurple = R('#d2bedc', '#b49cc4', '#9a81ac', '#836a96', '#6d5867', '#53404e');
const wurmSkin = R('#eab896', '#d49a7a', '#bb6f53', '#97503c', '#6a3426');
const bone = R('#fbfde0', '#ecf1bd', '#d6daa8', '#bfc392', '#a2a67c', '#82865f');
const capYellow = R('#f8dc90', '#efc56a', '#e2ae58', '#c79548', '#a27838', '#7e5a2a');
const gill = R('#e2d0a0', '#cdb886', '#ad9666');
const stemGreen = R('#68c690', '#47a473', '#358a60', '#2a6f4f', '#1f553d');
const nibbit = R('#3cb39a', '#22957e', '#1a806b', '#146b59', '#0f5649', '#0a4038');
const nibbitBelly = R('#a8c48e', '#88a872', '#6c8a5a');
const shell = R('#fbf2a8', '#efe184', '#e5c86e', '#d4ab58', '#b08a44', '#86683a');
const beetleDark = R('#8e9460', '#727a54', '#5c6242', '#474c33', '#33371f');
const paleCyan = R('#f0fffc', '#c8ece6', '#a2d0ca', '#7aaea8');
const feather = R('#b2ec8c', '#93d86c', '#76bf55', '#5fa43c', '#4b8432', '#3a6328');
const beak = R('#f0aaa8', '#d8807e', '#b45e5e', '#86403e');
const legDark = R('#7c8a6c', '#5c6a4e', '#424c38', '#2c3426');
const beastPale = R('#f2fafd', '#ddeff5', '#c6e2ec', '#a9d1de', '#88b8c9', '#6a9caf');
const mane = R('#bccfa4', '#9db586', '#7f9b6a', '#617c50');
const antlerBlue = R('#b4e4f2', '#8fcde0', '#6db3cb', '#4f94ae', '#357590');
const gold = R('#fff0a8', '#f2cc58', '#cf9c2e', '#946818');
const flame = { ramp: ['#e0f6ff', '#9cd6ff', '#5ab0ff', '#2f8ae0', '#1c60b0', '#143e7a'], emissive: true };
const dark = c => () => c;
/** Antler silhouette, drawn by hand: 12 wide (towards the outside) × 16 tall, base at the bottom-left. */
const ANTLER = [
  '......#...#.',
  '.....##..##.',
  '..#..#...#..',
  '..##.#..##..',
  '...###.##...',
  '....####....',
  '....###...#.',
  '.#..##...##.',
  '.##.##..##..',
  '..####.##...',
  '...#####....',
  '....###.....',
  '....##......',
  '...##.......',
  '...#........',
  '..##........',
];

// ---- small helpers for details / masks
const at = (pts, c) => (x, y) => (pts.some(([a, b]) => a === x && b === y) ? c : null);
const all = (...fns) => (x, y, w, h) => { for (const fn of fns) { const v = fn(x, y, w, h); if (v) return v; } return null; };
/** Leaf / feather silhouette on a plane: a pointed ellipse along the plane's height. */
const leafMask = (face, x, y, w, h) => { const cx = (w - 1) / 2, t = y / Math.max(1, h - 1); const half = Math.sin(Math.PI * Math.min(1, t * 1.1)) * w / 2; return Math.abs(x - cx) <= half; };
/** Flame silhouette: wide at the bottom, tongues at the top. */
const flameMask = (face, x, y, w, h) => { const cx = (w - 1) / 2, t = 1 - y / Math.max(1, h - 1); const half = (w / 2) * Math.pow(Math.max(0, 1 - t), 0.7) + (t > 0.55 && (x % 3 === 1) ? 0.6 : 0); return Math.abs(x - cx) <= half; };

module.exports = {
  // ------------------------------------------------------------ slimes (vanilla slime layout, scaled by the renderer)
  leaf_slime: {
    render: 'translucent', scale: 2.0,
    bones: [
      { name: 'cube', pivot: [0, 0, 0], cubes: [{ from: [-4, 0, -4], size: [8, 8, 8], mat: leafJelly, faceMat: { up: moss },
        detail: { north: (x, y) => (y <= 1 ? '#93a33e' : y === 2 && x % 3 !== 1 ? '#78892f' : null),
          east: (x, y) => (y <= 1 ? '#78892f' : null), west: (x, y) => (y <= 1 ? '#78892f' : null), south: (x, y) => (y <= 1 ? '#5f7124' : null) } }] },
      { name: 'inside', parent: 'cube', pivot: [0, 0, 0], cubes: [
        { from: [-3, 1, -3], size: [6, 6, 6], mat: leafCore },
        { from: [-3.3, 4, -3.5], size: [2, 2, 2], mat: R('#f2d36a', '#e8b830', '#2a1a10'), detail: { north: at([[0, 0], [1, 0]], '#2a1a10') } },
        { from: [1.3, 4, -3.5], size: [2, 2, 2], mat: R('#f2d36a', '#e8b830', '#2a1a10'), detail: { north: at([[0, 0], [1, 0]], '#2a1a10') } },
        { from: [0, 2, -3.5], size: [1, 1, 1], mat: R('#20383a') },
      ] },
      { name: 'sprout', parent: 'cube', pivot: [0, 8, 0], rot: [0, 45, 0], cubes: [
        { from: [-2, 8, 0], size: [4, 5, 0], mat: moss, mask: (f, x, y, w, h) => (y >= 3 ? x === 1 || x === 2 : leafMask(f, x, y, w, 3)) },
        { from: [0, 8, -2], size: [0, 5, 4], mat: moss, mask: (f, x, y, w, h) => (y >= 3 ? x === 1 || x === 2 : leafMask(f, x, y, w, 3)) },
      ] },
    ],
  },
  twig_slime: {
    render: 'translucent', scale: 2.0,
    bones: [
      { name: 'cube', pivot: [0, 0, 0], cubes: [{ from: [-4, 0, -4], size: [8, 8, 8], mat: twigJelly,
        detail: { north: at([[1, 5], [6, 2], [5, 6]], '#e07a8a'), east: at([[2, 3], [5, 6]], '#e07a8a'), west: at([[3, 1], [1, 5]], '#e07a8a'),
          south: at([[2, 2], [6, 5]], '#c25a6c'), up: at([[2, 2], [5, 5]], '#e07a8a') } }] },
      { name: 'inside', parent: 'cube', pivot: [0, 0, 0], cubes: [
        { from: [-3, 1, -3], size: [6, 6, 6], mat: twigCore },
        { from: [-2.5, 4, -3.5], size: [1, 2, 1], mat: R('#2a2414') },
        { from: [1.5, 4, -3.5], size: [1, 2, 1], mat: R('#2a2414') },
      ] },
      // thorny twigs: crossed planes poking out of the jelly
      ...[[-2, 7, -1, 25, 'twig_a'], [2, 7, 2, -30, 'twig_b'], [3.5, 3, -2, -70, 'twig_c'], [-3.5, 4, 2, 70, 'twig_d']].map(([x, y, z, r, n]) => ({
        name: n, parent: 'cube', pivot: [x, y, z], rot: [0, 45, r], cubes: [{ from: [x - 1.5, y, z], size: [3, 5, 0], mat: twig,
          mask: (f, px, py) => px === 1 || (py === 1 && px === 0) || (py === 3 && px === 2) }] })),
    ],
  },
  // ------------------------------------------------------------ fuzzy wurm crawler: body chain, fur as planes
  fuzzy_wurm_crawler: {
    render: 'cutout',
    bones: [
      { name: 'head', pivot: [0, 4, -5], cubes: [
        { from: [-3.5, 0, -11], size: [7, 7, 6], mat: wurmSkin, detail: { north: (x, y) => {
          const d = Math.hypot(x - 3, y - 3.5);
          if (d < 2.0) return '#3a1010';
          if (d < 2.8) return (x + y) % 2 === 0 ? '#f4ecd6' : '#6a2020';
          return null;
        } } },
        { from: [-3, 1, -12], size: [1, 1, 2], mat: bone }, { from: [2, 1, -12], size: [1, 1, 2], mat: bone },
      ] },
      { name: 'hair', parent: 'head', pivot: [0, 7, -8], cubes: [
        { from: [-5, 6, -10], size: [10, 5, 0], mat: furPurple, mask: (f, x, y, w) => y >= 4 - ((x * 7) % 3) },
        { from: [-5, 6, -7], size: [10, 6, 0], mat: furPurple, mask: (f, x, y, w) => y >= 3 - ((x * 5) % 4) },
      ] },
      { name: 'body_1', parent: 'head', pivot: [0, 3, -5], cubes: [{ from: [-4, 0, -5], size: [8, 6, 7], mat: furPurple, faceMat: { down: wurmSkin } }] },
      { name: 'body_2', parent: 'body_1', pivot: [0, 3, 2], cubes: [{ from: [-3.5, 0, 2], size: [7, 5, 6], mat: furPurple, faceMat: { down: wurmSkin } }] },
      { name: 'body_3', parent: 'body_2', pivot: [0, 2, 8], cubes: [{ from: [-2.5, 0, 8], size: [5, 4, 5], mat: furPurple, faceMat: { down: wurmSkin } }] },
      { name: 'tuft', parent: 'body_1', pivot: [0, 6, 0], cubes: [
        { from: [-5.5, 2, -3], size: [0, 6, 8], mat: furPurple, mask: (f, x, y) => y >= 2 - (x % 3) },
        { from: [5.5, 2, -3], size: [0, 6, 8], mat: furPurple, mask: (f, x, y) => y >= 2 - (x % 3) },
      ] },
    ],
  },
  // ------------------------------------------------------------ flyconid: stem, one cap block, side cap, gill plane
  flyconid: {
    render: 'cutout',
    bones: [
      { name: 'stem', pivot: [0, 0, 0], cubes: [
        { from: [-2, 0, -2], size: [4, 16, 4], mat: stemGreen, detail: { north: at([[1, 3], [2, 3]], '#102a1c') } },
      ] },
      { name: 'arm_l', parent: 'stem', pivot: [-2, 9, 0], rot: [0, 0, -20], cubes: [{ from: [-5, 8.5, 0], size: [3, 2, 0], mat: stemGreen }] },
      { name: 'arm_r', parent: 'stem', pivot: [2, 9, 0], rot: [0, 0, 20], cubes: [{ from: [2, 8.5, 0], size: [3, 2, 0], mat: stemGreen }] },
      { name: 'cap', parent: 'stem', pivot: [0, 16, 0], cubes: [
        { from: [-6, 16, -6], size: [12, 4, 12], mat: capYellow, faceMat: { down: gill },
          detail: { up: (x, y) => ((x === 3 && y === 4) || (x === 8 && y === 7) ? '#fff0b8' : null) } },
        { from: [-3, 20, -3], size: [6, 1, 6], mat: capYellow },
      ] },
      { name: 'cap_side', parent: 'stem', pivot: [3, 12, 0], rot: [0, 0, -18], cubes: [{ from: [2, 12, -3], size: [6, 3, 6], mat: capYellow, faceMat: { down: gill } }] },
      { name: 'cap_small', parent: 'stem', pivot: [-3, 7, 1], rot: [0, 0, 22], cubes: [{ from: [-7, 7, -1], size: [4, 2, 4], mat: capYellow, faceMat: { down: gill } }] },
    ],
  },
  // ------------------------------------------------------------ nibbit: quadruped lizard, jaw bone, dorsal ridge plane
  nibbit: {
    render: 'cutout',
    bones: [
      { name: 'body', pivot: [0, 6, 0], cubes: [{ from: [-4, 3, -7], size: [8, 6, 14], mat: withPattern(nibbit, (f, x, y) => (f === 'up' && (y % 4 === 1) && x > 1 && x < 6 ? 2 : 0)), faceMat: { down: nibbitBelly } }] },
      { name: 'ridge', parent: 'body', pivot: [0, 9, 0], cubes: [{ from: [0, 9, -6], size: [0, 2, 12], mat: nibbit, mask: (f, x, y) => y === 1 || x % 3 === 0 }] },
      { name: 'head', parent: 'body', pivot: [0, 7, -7], cubes: [
        { from: [-4, 5, -14], size: [8, 3, 7], mat: nibbit, detail: { east: at([[2, 0]], '#f2e080'), west: at([[4, 0]], '#f2e080') } },
      ] },
      { name: 'jaw', parent: 'head', pivot: [0, 5, -8], cubes: [{ from: [-3.5, 3, -13.5], size: [7, 2, 6], mat: nibbitBelly,
        detail: { north: (x, y) => (y === 0 && x % 2 === 0 ? '#f4f0e0' : null) } }] },
      { name: 'tail', parent: 'body', pivot: [0, 6, 7], cubes: [{ from: [-2, 4, 7], size: [4, 4, 9], mat: nibbit }] },
      { name: 'tail_tip', parent: 'tail', pivot: [0, 5, 16], cubes: [{ from: [-1, 4.5, 16], size: [2, 3, 6], mat: nibbit }] },
      ...[['leg_fl', -3, -5], ['leg_fr', 3, -5], ['leg_bl', -3, 5], ['leg_br', 3, 5]].map(([n, x, z]) => ({
        name: n, parent: 'body', pivot: [x, 4, z], cubes: [{ from: [x < 0 ? x - 2.5 : x - 0.5, 0, z - 1.5], size: [3, 4, 3], mat: nibbit }] })),
    ],
  },
  // ------------------------------------------------------------ shrinker beetle: elytra halves, dashed antennae planes
  shrinker_beetle: {
    render: 'cutout',
    bones: [
      { name: 'body', pivot: [0, 3, 0], cubes: [{ from: [-4, 1, -5], size: [8, 2, 11], mat: beetleDark }] },
      { name: 'shell_l', parent: 'body', pivot: [0, 7, -5], cubes: [{ from: [-5, 3, -5], size: [5, 4, 12], mat: withPattern(shell, (f, x, y, w) => (f === 'up' && x === w - 1 ? 3 : 0)) }] },
      { name: 'shell_r', parent: 'body', pivot: [0, 7, -5], cubes: [{ from: [0, 3, -5], size: [5, 4, 12], mat: withPattern(shell, (f, x) => (f === 'up' && x === 0 ? 3 : 0)) }] },
      { name: 'head', parent: 'body', pivot: [0, 4, -5], cubes: [
        { from: [-3, 2, -9], size: [6, 4, 4], mat: beetleDark },
        { from: [-4, 3.5, -9.5], size: [2, 2, 2], mat: paleCyan, detail: { north: at([[0, 0]], '#ffffff') } },
        { from: [2, 3.5, -9.5], size: [2, 2, 2], mat: paleCyan, detail: { north: at([[0, 0]], '#ffffff') } },
      ] },
      { name: 'antennae', parent: 'head', pivot: [0, 6, -8], rot: [-35, 0, 0], cubes: [
        { from: [-4, 6, -8], size: [3, 0, 7], mat: paleCyan, mask: (f, x, y) => (x === 1 && y % 2 === 0) || (y === 6 && x !== 1) },
        { from: [1, 6, -8], size: [3, 0, 7], mat: paleCyan, mask: (f, x, y) => (x === 1 && y % 2 === 0) || (y === 6 && x !== 1) },
      ] },
      ...[-3, 0, 3].flatMap((z, i) => [
        { name: 'leg_l' + i, parent: 'body', pivot: [-4, 2, z], rot: [0, 0, -25], cubes: [{ from: [-7, 0, z], size: [3, 3, 0], mat: beetleDark, mask: (f, x, y) => y === 0 || x === 0 }] },
        { name: 'leg_r' + i, parent: 'body', pivot: [4, 2, z], rot: [0, 0, 25], cubes: [{ from: [4, 0, z], size: [3, 3, 0], mat: beetleDark, mask: (f, x, y) => y === 0 || x === 2 }] },
      ]),
    ],
  },
  // ------------------------------------------------------------ byrdonis: body, S-neck, hooked beak, feather planes
  byrdonis: {
    render: 'cutout', scale: 1.0,
    bones: [
      { name: 'body', pivot: [0, 18, 0], cubes: [{ from: [-5, 14, -6], size: [10, 9, 13], mat: withPattern(feather, (f, x, y) => (f !== 'up' && f !== 'down' && y % 3 === 2 && x % 2 === 0 ? 1 : 0)) }] },
      { name: 'neck', parent: 'body', pivot: [0, 21, -4], rot: [22, 0, 0], cubes: [{ from: [-2, 21, -6], size: [4, 11, 4], mat: feather }] },
      { name: 'head', parent: 'neck', pivot: [0, 32, -4], rot: [-22, 0, 0], cubes: [
        { from: [-2.5, 31, -8], size: [5, 5, 6], mat: feather, detail: { east: at([[1, 1]], '#1a1a10'), west: at([[4, 1]], '#1a1a10') } },
      ] },
      { name: 'crest', parent: 'head', pivot: [0, 36, -5], rot: [-30, 0, 0], cubes: [{ from: [0, 36, -6], size: [0, 4, 5], mat: feather, mask: leafMask }] },
      { name: 'beak', parent: 'head', pivot: [0, 33, -8], cubes: [
        { from: [-1.5, 32, -13], size: [3, 3, 5], mat: beak },
        { from: [-1, 30, -14], size: [2, 3, 2], mat: beak },
      ] },
      { name: 'tail', parent: 'body', pivot: [0, 20, 7], rot: [-20, 0, 0], cubes: [
        { from: [-4, 20, 7], size: [8, 0, 13], mat: feather, mask: (f, x, y, w, h) => Math.abs(x - (w - 1) / 2) <= 1 + y / 3 },
      ] },
      { name: 'wing_l', parent: 'body', pivot: [-5, 22, -3], cubes: [{ from: [-5.5, 15, -4], size: [0, 7, 10], mat: feather, mask: (f, x, y) => y <= 4 + (x % 3) }] },
      { name: 'wing_r', parent: 'body', pivot: [5, 22, -3], cubes: [{ from: [5.5, 15, -4], size: [0, 7, 10], mat: feather, mask: (f, x, y) => y <= 4 + (x % 3) }] },
      ...[['leg_l', -2.5], ['leg_r', 2.5]].map(([n, x]) => ({ name: n, parent: 'body', pivot: [x, 14, 1], cubes: [
        { from: [x - 1, 2, 0], size: [2, 12, 2], mat: legDark },
        { from: [x - 2, 0, -3], size: [4, 2, 5], mat: legDark },
      ] })),
    ],
  },
  // ------------------------------------------------------------ ceremonial beast: deer, antlers as planes
  ceremonial_beast: {
    render: 'cutout', scale: 1.0,
    bones: [
      { name: 'body', pivot: [0, 24, 0], cubes: [
        { from: [-6, 18, -10], size: [12, 11, 20], mat: beastPale,
          detail: { north: (x, y) => (y === 4 ? '#f2cc58' : null), east: (x, y) => (y === 4 && x < 4 ? '#f2cc58' : null), west: (x, y, w) => (y === 4 && x > w - 5 ? '#f2cc58' : null) } },
        { from: [-1, 19, -10.5], size: [2, 3, 0], mat: gold },
      ] },
      { name: 'neck', parent: 'body', pivot: [0, 27, -8], rot: [28, 0, 0], cubes: [
        { from: [-3, 26, -11], size: [6, 12, 6], mat: beastPale, faceMat: { north: mane } },
      ] },
      { name: 'head', parent: 'neck', pivot: [0, 38, -8], rot: [-28, 0, 0], cubes: [
        { from: [-3, 36, -16], size: [6, 6, 9], mat: beastPale, detail: { east: at([[5, 1]], '#1a3040'), west: at([[3, 1]], '#1a3040'), north: at([[2, 4], [3, 4]], '#6a9caf') } },
        { from: [-4, 40, -10], size: [2, 2, 1], mat: beastPale }, { from: [2, 40, -10], size: [2, 2, 1], mat: beastPale },
      ] },
      ...[-1, 1].map(s => ({ name: s < 0 ? 'antler_l' : 'antler_r', parent: 'head', pivot: [s * 2, 42, -11], rot: [0, s * 20, 0], cubes: [
        { from: [s < 0 ? -14 : 2, 42, -11], size: [12, 16, 0], mat: antlerBlue, mask: (f, x, y, w, h) => ANTLER[y][s < 0 ? w - 1 - x : x] === '#' }] })),
      ...[['leg_fl', -4, -7], ['leg_fr', 4, -7], ['leg_bl', -4, 7], ['leg_br', 4, 7]].map(([n, x, z]) => ({
        name: n, parent: 'body', pivot: [x, 19, z], cubes: [{ from: [x - 1.5, 0, z - 1.5], size: [3, 19, 3], mat: beastPale,
          detail: { north: (px, py, w, h) => (py >= h - 2 ? '#6a9caf' : null) } }] })),
    ],
  },
  // ------------------------------------------------------------ osty: bone hand on its fingers, soul flame planes (glow)
  osty: {
    render: 'cutout', glow: true,
    bones: [
      { name: 'palm', pivot: [0, 8, 0], cubes: [{ from: [-5, 6, -5], size: [10, 4, 10], mat: withPattern(bone, (f, x, y) => (f === 'up' && (x === 2 || x === 7) ? 2 : 0)) }] },
      ...[-3.75, -1.25, 1.25, 3.75].map((x, i) => ({ name: 'finger_' + i, parent: 'palm', pivot: [x, 7, -5], cubes: [
        { from: [x - 1, 2, -7], size: [2, 5, 2], mat: bone, detail: { north: (px, py) => (py === 2 ? '#a2a67c' : null) } },
        { from: [x - 1, 0, -9], size: [2, 2, 3], mat: bone },
      ] })),
      { name: 'thumb', parent: 'palm', pivot: [5, 7, 0], cubes: [{ from: [5, 2, -1], size: [2, 5, 2], mat: bone }, { from: [5, 0, -3], size: [2, 2, 3], mat: bone }] },
      { name: 'wrist', parent: 'palm', pivot: [0, 10, 2], rot: [-20, 0, 0], cubes: [{ from: [-3, 10, 0], size: [6, 4, 6], mat: bone }] },
      { name: 'flame', parent: 'wrist', pivot: [0, 14, 3], rot: [0, 45, 0], cubes: [
        { from: [-4, 14, 3], size: [8, 11, 0], mat: flame, mask: flameMask },
        { from: [0, 14, -1], size: [0, 11, 8], mat: flame, mask: flameMask },
      ] },
    ],
  },
};
