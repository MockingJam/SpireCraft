// Model v9, normal monsters: each refined from its STS2 render, part by part, with rounded (bevelled-prism) bodies and
// tilted plates instead of stacked, stepped boxes. Feature lists (from the STS2 art) are in the comment above each.
// Bone names stay what SpireMobModel animates (scripted(): body/head/jaw/arm_*/leg_*/tail*/seg_*/wing_*/tent_*/orbit;
// the Hive kinds: bowlbug load/head/mandible_*/leg_f*/leg_b*, myte head/claw_*/leg_l0..2, chomper jaw_*/helmet/leg_*).
const { R, withPattern, glowing, h2, B, rotBox, octo, bevelBox } = require('./kit');
const scripted = require('./specs_scripted');
const hive = require('./specs_hive');
const at = (pts, c) => (x, y) => (pts.some(([a, b]) => a === x && b === y) ? c : null);
const leafMask = (face, x, y, w, h) => { const cx = (w - 1) / 2, t = y / Math.max(1, h - 1); const half = Math.sin(Math.PI * Math.min(1, t * 1.05 + 0.05)) * w / 2; return Math.abs(x - cx) <= half + 0.2; };
const pointUp = (f, x, y, w, h) => Math.abs(x + 0.5 - w / 2) <= (w / 2) * (y + 0.8) / h;          // a blade narrowing to the top
const keepBones = (spec, test) => spec.bones.filter(test);

/**
 * A plane standing on a ring round (cx, cz) at angle a (degrees; 0 = front), leaning out by tilt degrees: petals,
 * leaves, crowns. Its normal points outwards; it is hinged at its foot.
 */
function ringPlane(name, parent, [cx, y, cz], r, a, [w, h], tilt, mat, mask, extra = {}) {
  const rad = a * Math.PI / 180, px = cx - r * Math.sin(rad), pz = cz - r * Math.cos(rad);
  return { name, parent, pivot: [px, y, pz], rot: [tilt, a, 0], cubes: [B([px - w / 2, y, pz], [w, h, 0], mat, { mask, ...extra })] };
}

/**
 * A curling worm / tendril / tail: n segments, each a box of [t, len, t] standing on the last one's tip and turned a
 * little further (curl, degrees about x) - the first one turned by rot0 [x, y, z]. Returns the bones (name, name_1..).
 */
function curl(name, parent, base, n, len, t, rot0, curlDeg, mat, tipMat) {
  const bones = [];
  for (let k = 0; k < n; k++) {
    const y = base[1] + k * len, th = Math.max(1, t - Math.floor(k * t / (n + 1)));
    bones.push({ name: k ? name + '_' + k : name, parent: k ? (k > 1 ? name + '_' + (k - 1) : name) : parent, pivot: [base[0], y, base[2]],
      rot: k ? [curlDeg, 0, 0] : rot0, cubes: [B([base[0] - th / 2, y, base[2] - th / 2], [th, len, th], k === n - 1 && tipMat ? tipMat : mat)] });
  }
  return bones;
}

const N = {};

// ----------------------------------------------------------------------------------------------------- Inklet
// STS2: a little black ink-cat - a round body, a big round head wider than the body, two pointed ears, one glowing
// yellow-green visor slit of an eye across the face, stubby arms and short thick legs, glossy highlights.
const ink = withPattern(R('#5a5468', '#3a3646', '#28262f', '#1a1820', '#0e0c12'), (f, x, y, w, h) => (f === 'up' ? 1.2 : (y === 0 ? 1 : 0)) + (h2(x, y, 3) < 4 ? -0.6 : 0));
const inkEye = glowing(R('#fffcc0', '#f0f08a', '#d8e060'));
N.inklet = { render: 'cutout', glow: true, bones: [
  { name: 'body', pivot: [0, 4, 0], cubes: [] },
  ...bevelBox('belly', 'body', [0, 5, 0], [8, 6, 7], 2, ink),
  { name: 'head', parent: 'body', pivot: [0, 8, 0], cubes: [
    B([-3, 11.5, -4.6], [6, 2, 0], inkEye, { mask: (f, x, y) => !(y === 1 && (x === 0 || x === 5)), detail: { north: (x, y) => (y === 0 && x >= 1 && x <= 4 ? '#fffff0' : null) } }) ] },
  ...bevelBox('skull', 'head', [0, 12, 0], [10, 7, 9], 3, ink),
  ...[-1, 1].flatMap(s => [rotBox('ear' + (s < 0 ? '_l' : '_r'), 'head', [s * 3.2, 16.5, 0], [3, 4, 3], [0, 0, -s * 18], ink),
    rotBox('ear_tip' + (s < 0 ? '_l' : '_r'), 'ear' + (s < 0 ? '_l' : '_r'), [s * 3.8, 19, 0], [2, 2, 2], [0, 45, -s * 18], ink)]),
  ...[-1, 1].map(s => ({ name: s < 0 ? 'arm_l' : 'arm_r', parent: 'body', pivot: [s * 3.5, 7.5, 0], rot: [0, 0, -s * 35], cubes: [B([s * 3.5 - 1, 3.5, -1], [2, 4, 2], ink)] })),
  ...[-1, 1].map(s => ({ name: s < 0 ? 'leg_l' : 'leg_r', parent: 'body', pivot: [s * 2, 2.5, 0], cubes: [B([s * 2 - 1.5, 0, -1.5], [3, 3, 3], ink), B([s * 2 - 1.5, 0, -2.5], [3, 1, 1], ink)] })),
] };

// ----------------------------------------------------------------------------------------------------- Eye With Teeth
// STS2: a pale-green ghostly flower - two rings of pointed petals cupped forwards round a single slit-pupilled green
// eye ringed with tiny teeth; four long, thin, wavy, beaded tendrils trailing off in every direction.
const ghost = { ramp: ['#eefff8', '#c8f4e2', '#a0e0c8', '#7cc8b0', '#5cae98'], alpha: 170 };
const petal = withPattern(ghost, (f, x, y, w) => (x === Math.floor(w / 2) ? 1.2 : 0));
const tendril = withPattern({ ...ghost, alpha: 200 }, (f, x, y) => (y % 3 === 0 ? -1 : 0));
const ewt = [{ name: 'body', pivot: [0, 10, 0], cubes: [
  B([-2, 8, -2.6], [4, 4, 0], R('#c8f8d0', '#90e0a0', '#58b870'), { detail: { north: (x, y) => (x === 1 || x === 2 ? (y === 0 || y === 3 ? '#2a6040' : '#0a2014') : (x + y) % 3 === 0 ? '#e8fff0' : null) } }),
  ...[0, 1, 2, 3, 4, 5, 6, 7].map(k => { const a = k * Math.PI / 4; return B([Math.round(Math.cos(a) * 2.6) - 0.5, 10 + Math.round(Math.sin(a) * 2.6) - 0.5, -2.8], [1, 1, 1], R('#ffffff', '#f0ead8')); }) ] }];
ewt.push(...bevelBox('bulb', 'body', [0, 10, 0.5], [6, 6, 5], 2, ghost));
[0, 1, 2, 3, 4, 5, 6, 7].forEach(k => ewt.push({ name: 'petal' + k, parent: 'body', pivot: [0, 10, 0], rot: [30, 0, k * 45], cubes: [B([-2.5, 12, -1], [5, 8, 0], petal, { mask: pointUp })] }));
[0, 1, 2, 3, 4, 5, 6, 7].forEach(k => ewt.push({ name: 'petal_in' + k, parent: 'body', pivot: [0, 10, -1], rot: [50, 0, k * 45 + 22], cubes: [B([-1.5, 11.5, -2], [3, 6, 0], petal, { mask: pointUp })] }));
[0, 1, 2, 3].forEach(k => ewt.push({ name: 'tent_' + k, parent: 'body', pivot: [0, 10, 1], rot: [0, 0, k * 90 + 45], cubes: [
  B([2, 9, 1], [16, 3, 0], tendril, { mask: (f, x, y) => y === 1 + Math.round(Math.sin(x * 0.7 + k) * 1) }) ] }));
N.eye_with_teeth = { render: 'translucent', bones: ewt };

// ----------------------------------------------------------------------------------------------------- Snapping Jaxfruit
// STS2: a round glossy red fruit, slightly wider than tall, faint vein network and a white highlight; a crown of dark
// red pointed leaves standing up round the top, broad green leaves drooping over the shoulders, three thin green
// stalks with little bud tips; small green leaves at its foot.
const fruit = withPattern(R('#ffc0c0', '#f48888', '#e05a66', '#c03c4c', '#962a3a', '#6e1e2c'), (f, x, y) => (f === 'up' ? 1 : 0) + (h2(x, y, 5) < 7 ? -0.9 : (x + 2 * y) % 9 === 0 ? 0.7 : 0));
const crownRed = withPattern(R('#e05a50', '#c03c3c', '#9a2c30', '#781e26'), (f, x, y, w) => (x === Math.floor(w / 2) ? -0.8 : 0));
const leafG = withPattern(R('#d0ec9c', '#b0d878', '#8cbc58', '#6c9a40', '#527a30'), (f, x, y, w) => (x === Math.floor(w / 2) ? 1 : 0));
const jax = [{ name: 'body', pivot: [0, 0, 0], cubes: [] }, ...bevelBox('fruit', 'body', [0, 6.5, 0], [14, 12, 14], 4, fruit)];
[0, 1, 2, 3, 4].forEach(k => jax.push(ringPlane('foot_leaf' + k, 'body', [0, 0.2, 0], 6, k * 72 + 20, [4, 5], 75, leafG, leafMask)));
jax.push({ name: 'head', parent: 'body', pivot: [0, 12, 0], cubes: [] });
[0, 1, 2, 3, 4, 5, 6].forEach(k => jax.push(ringPlane('crown' + k, 'head', [0, 11, 0], 4, k * 51, [4, 8], 25 + (k % 2) * 10, crownRed, pointUp)));
[0, 1, 2, 3].forEach(k => jax.push(ringPlane('leaf' + k, 'head', [0, 11.5, 0], 5, k * 90 + 45, [5, 8], 70, leafG, leafMask)));
[[-2, 0, -10], [0.5, 1, 6], [2.5, -1, 14]].forEach(([x, z, lean], k) => {
  jax.push({ name: 'stalk' + k, parent: 'head', pivot: [x, 12, z], rot: [lean * 0.6, 0, lean], cubes: [B([x - 0.5, 12, z - 0.5], [1, 9 + k, 1], R('#9ac860', '#78a844', '#5a8834'))] });
  jax.push(rotBox('bud' + k, 'stalk' + k, [x, 21.5 + k, z], [2, 2, 2], [0, 45, 0], R('#e8f0a0', '#c8d870', '#a0b450')));
});
N.snapping_jaxfruit = { render: 'cutout', bones: jax };

// ----------------------------------------------------------------------------------------------------- Slithering Strangler
// STS2: a thick red-brown serpent rearing in an S, darker red mottling, rows of curved white thorns along its back and
// sides, the tail curling round on the ground; the head a long, swept-back grey bone blade with spikes, like a
// horned skull - no visible eyes.
const snake = withPattern(R('#ec8c74', '#d06a54', '#b0503e', '#8e3c2e', '#6c2c22'), (f, x, y) => (h2(x >> 1, y >> 1, 4) < 18 ? -1 : (x + y) % 5 === 0 ? 0.6 : 0));
const thorn = R('#fffdf2', '#eee8d4', '#d6ccb0');
const boneG = withPattern(R('#eef0ec', '#cfd2cc', '#aeb2ac', '#8c908a', '#6c706a'), (f, x, y) => (x % 3 === 0 ? 1 : (x + y) % 4 === 0 ? -0.6 : 0));
const thorns = (owner, z0, z1, y, w) => { const out = []; for (let z = z0, k = 0; z <= z1; z += 3, k++) {
  out.push(rotBox(owner + '_thorn' + k, owner, [0, y, z], [1, 3, 1], [-35, 0, 0], thorn));
  [-1, 1].forEach(s => out.push(rotBox(owner + '_side' + k + (s < 0 ? 'l' : 'r'), owner, [s * w, y - 2.5, z + 1.5], [1, 2, 1], [0, 0, s * 60], thorn))); } return out; };
N.slithering_strangler = { render: 'cutout', bones: [
  { name: 'body', pivot: [0, 2, 4], cubes: [] }, ...octo('coil', 'body', [0, 2.5, 4.5], 9, 6, 5, 2, snake, 'z'), ...thorns('coil', 1, 8, 5.5, 3),
  { name: 'seg_1', parent: 'body', pivot: [0, 2.5, 0], rot: [-55, 0, 0], cubes: [] }, ...octo('neck', 'seg_1', [0, 2.5, -4], 8, 5, 5, 2, snake, 'z'), ...thorns('neck', -6, -2, 5.5, 2.5),
  { name: 'head', parent: 'seg_1', pivot: [0, 2.5, -8], rot: [45, 0, 0], cubes: [] },
  ...octo('skull', 'head', [0, 3, -10.5], 5, 5, 4, 1, boneG, 'z'),
  rotBox('blade', 'head', [0, 6, -9], [2, 3, 9], [25, 0, 0], boneG), rotBox('blade_tip', 'blade', [0, 7.5, -4], [1, 2, 5], [35, 0, 0], boneG),
  ...[-1, 1].map(s => rotBox('horn' + (s < 0 ? '_l' : '_r'), 'head', [s * 2.5, 5, -8.5], [1, 2, 6], [30, s * 20, 0], boneG)),
  rotBox('snout', 'head', [0, 2.5, -13.5], [3, 2, 3], [-15, 0, 0], boneG),
  { name: 'tail', parent: 'body', pivot: [0, 2, 9], rot: [0, 30, 0], cubes: [] }, ...octo('tail_c', 'tail', [0, 2, 12.5], 7, 5, 4, 1, snake, 'z'), ...thorns('tail_c', 10, 14, 4.5, 2.5),
  { name: 'tail_1', parent: 'tail', pivot: [0, 2, 16], rot: [0, 45, 0], cubes: [] }, ...octo('tip', 'tail_1', [0, 1.5, 19], 6, 3, 3, 1, snake, 'z'),
] };

// ----------------------------------------------------------------------------------------------------- Cubex Construct
// STS2: a floating stone exclamation mark - a tall tan pillar with a slanted top and chipped edges, an amber orb set in
// its face, a cyan gem hovering below it, a squat olive block beneath. Kept, with the pillar's top cut on a slope.
{
  const cx = scripted.cubex_construct, tan = withPattern(R('#f0e0a8', '#dcc888', '#c0aa68', '#9c884c'), (f, x, y) => (h2(x, y, 31) < 6 ? 1.2 : 0));
  N.cubex_construct = { ...cx, bones: [...cx.bones.filter(b => b.name !== 'head'),
    { name: 'head', parent: 'body', pivot: [0, 13, 0], rot: [0, 0, 6], cubes: [] }, ...octo('pillar', 'head', [0, 19.5, 0], 13, 7, 7, 1, tan, 'y'),
    rotBox('cap', 'head', [0.5, 26.5, 0], [8, 3, 8], [0, 0, -12], tan), rotBox('chip', 'head', [-3, 15, -3], [2, 3, 2], [0, 45, 0], tan),
    { name: 'socket', parent: 'head', pivot: [0, 17, -3.6], cubes: [B([-1.5, 15.5, -3.7], [3, 3, 1], glowing(R('#ffe0b0', '#f0a060', '#c87030')), { detail: { north: at([[0, 0]], '#fff4e0') } })] }] };
}

// ----------------------------------------------------------------------------------------------------- Wriggler
// STS2: a writhing knot of fat yellow worms - ringed, tan-yellow, a dozen of them curling every way out of a dark
// centre that is one round mouth lined with pale fangs; the worms' tips darker.
const worm = withPattern(R('#fbeaa8', '#ecd078', '#d2b058', '#b08e40', '#8a6c2e'), (f, x, y) => (y % 2 === 0 ? 1 : -0.4));
const wTip = R('#c09a50', '#9a783a');
const wrig = [{ name: 'body', pivot: [0, 6, 0], cubes: [] }, ...bevelBox('knot', 'body', [0, 6.5, 0.5], [11, 10, 9], 3, worm),
  { name: 'head', parent: 'body', pivot: [0, 7, -4], cubes: [B([-3, 4, -4.6], [6, 6, 0], R('#3a1410', '#200806'), {
    mask: (f, x, y) => Math.hypot(x - 2.5, y - 2.5) <= 3.1, detail: { north: (x, y) => { const d = Math.hypot(x - 2.5, y - 2.5); return d > 2 && (x + y) % 2 === 0 ? '#fff6e0' : null; } } })] },
  { name: 'jaw', parent: 'head', pivot: [0, 4.5, -4.5], cubes: [B([-2, 3, -5.5], [4, 1, 2], worm)] }];
// eight animated worms (tent_0..7) and four still ones, each curling up and outwards
[[-5, 9, 0, -20, 0, 35], [5, 9, 0, -20, 0, -35], [-4, 3, -3, 0, 0, 95], [4, 3, -3, 0, 0, -95], [0, 11, 2, -10, 0, 0], [-3, 11, 4, 30, 0, 20], [3, 10, 4, 30, 0, -20], [0, 3, 5, 100, 0, 0],
  [-5, 6, 4, 40, 0, 70], [5, 6, 4, 40, 0, -70], [-2, 2, -4, -90, 0, 30], [2, 2, -4, -90, 0, -30]].forEach(([x, y, z, rx, ry, rz], k) =>
  wrig.push(...curl(k < 8 ? 'tent_' + k : 'worm' + k, 'body', [x, y, z], 3, 3, 2, [rx, ry, rz], -35 + (k % 3) * 10, worm, wTip)));
N.wriggler = { render: 'cutout', bones: wrig };

// ----------------------------------------------------------------------------------------------------- Living Fog
// STS2: a drifting purple-grey smoke cloud, denser at the front, a round gaping mouth full of small dark teeth ringed
// by violet beads, the smoke thinning into a long ragged trail streaming up and back.
const fog = withPattern({ ramp: ['#ddd0de', '#bcaabc', '#9c8a9c', '#7e6c7e', '#625262'], alpha: 205 }, (f, x, y) => (h2(x, y, 8) < 10 ? -0.8 : 0));
const fogThin = { ...fog, alpha: 140 };
const bead = glowing(R('#f0c8f8', '#d898e8', '#b070c8'));
const puffs = [[0, 9, 0, 13, 11, 11, [8, 10, 5]], [-4, 14, 3, 9, 7, 9, [20, -15, 12]], [4, 13, 4, 8, 7, 8, [-15, 25, -10]], [0, 5, 2, 10, 4, 9, [5, 30, 0]]];
const trail = [[0, 16, 10, 8, 6, 7, [30, 10, 10]], [2, 21, 14, 6, 5, 6, [40, -20, -15]], [0, 25, 18, 5, 4, 5, [55, 15, 20]], [-1, 28, 21, 3, 3, 4, [60, 0, 0]]];
N.living_fog = { render: 'translucent', glow: true, bones: [
  { name: 'body', pivot: [0, 10, 0], cubes: [] },
  ...puffs.map(([x, y, z, w, h, d, r], k) => rotBox('puff' + k, 'body', [x, y, z], [w, h, d], r, fog)),
  { name: 'tail', parent: 'body', pivot: [0, 14, 7], cubes: [] }, ...trail.map(([x, y, z, w, h, d, r], k) => rotBox('wisp' + k, 'tail', [x, y, z], [w, h, d], r, fogThin)),
  { name: 'head', parent: 'body', pivot: [0, 9, -5], cubes: [
    B([-3.5, 5.5, -5.8], [7, 7, 0], R('#2a1018', '#1a0810'), { mask: (f, x, y) => Math.hypot(x - 3, y - 3) <= 3.4,
      detail: { north: (x, y) => { const d = Math.hypot(x - 3, y - 3); return d > 2.3 && (x + y) % 2 === 0 ? '#e8dcd0' : null; } } }),
    ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map(k => { const a = k * 2 * Math.PI / 9; return B([Math.round(Math.cos(a) * 4.6) - 1, 9 + Math.round(Math.sin(a) * 4.6) - 1, -6.2], [2, 2, 1], bead); }) ] },
] };

// ----------------------------------------------------------------------------------------------------- Gas Bomb
// STS2: a small floating bundle of grey-violet smoke trailing a long wisp up and back, a crackling pink-white electric
// spark in its middle.
const spark = glowing(R('#fff4ff', '#ffb8f4', '#f070d8'));
N.gas_bomb = { render: 'translucent', glow: true, bones: [
  { name: 'body', pivot: [0, 5, 0], cubes: [] },
  ...[[0, 5, 0, 7, 6, 7, [10, 20, 8]], [-2, 8, 2, 5, 4, 5, [25, -20, 15]], [2, 3, 1, 4, 3, 4, [-10, 30, -15]]].map(([x, y, z, w, h, d, r], k) => rotBox('puff' + k, 'body', [x, y, z], [w, h, d], r, fog)),
  { name: 'tail', parent: 'body', pivot: [0, 8, 4], cubes: [] },
  ...[[1, 11, 7, 5, 4, 5, [30, 15, 10]], [3, 14, 11, 4, 3, 4, [45, -10, -20]], [4, 17, 14, 3, 2, 3, [55, 0, 0]]].map(([x, y, z, w, h, d, r], k) => rotBox('wisp' + k, 'tail', [x, y, z], [w, h, d], r, fogThin)),
  // the spark: a zigzag of thin glowing bars
  ...[[-2, 6, -4, 4, 50], [0, 5, -4.2, 3, -40], [1.5, 6.5, -4.4, 3, 60], [-1, 3.5, -4.1, 3, -20]].map(([x, y, z, len, ang], k) => rotBox('spark' + k, 'body', [x, y, z], [len, 1, 1], [0, 0, ang], spark)),
] };

// ----------------------------------------------------------------------------------------------------- Tough Egg
// STS2: a squat, lumpy teal egg - wider than tall, slightly lopsided, darker round spots and a glossy highlight.
const eggTeal = withPattern(R('#b8f6e8', '#88dece', '#5cc4b2', '#40a696', '#2c8478'), (f, x, y) => (h2(x >> 1, y >> 1, 17) < 14 ? '#2a8070' : f === 'up' && h2(x, y, 3) < 10 ? 1.4 : 0));
N.tough_egg = { render: 'cutout', bones: [
  { name: 'body', pivot: [0, 0, 0], cubes: [] }, ...bevelBox('shell', 'body', [0, 4.5, 0], [11, 8, 10], 3, eggTeal),
  rotBox('lump', 'shell', [-3, 6, 2], [4, 4, 4], [0, 30, 15], eggTeal),
] };

// ----------------------------------------------------------------------------------------------------- Hatchling
// STS2: a round cream grub-bug, its body like a bleached skull - two big dark eye sockets with teal pupils, a dark
// nose slit, small orange mandibles; two long brown wing-ears swept up and back; thin brown jointed legs.
const cream = withPattern(R('#fffbee', '#f2ecd8', '#dcd4bc', '#c0b69c'), (f, x, y) => (f === 'up' && y % 3 === 0 ? -0.4 : 0));
const brownWing = withPattern({ ramp: ['#b08a68', '#8e6a4c', '#6c4e36'], alpha: 230 }, (f, x, y, w) => (x === Math.floor(w / 2) ? 1 : 0));
const hatch = scripted.hatchling;
N.hatchling = { render: 'translucent', bones: [
  { name: 'body', pivot: [0, 5, 0], cubes: [] }, ...bevelBox('shell', 'body', [0, 6, 0.5], [10, 9, 9], 3, cream),
  rotBox('dome', 'shell', [0, 10, 1], [6, 2, 7], [0, 0, 0], cream),
  { name: 'head', parent: 'body', pivot: [0, 5, -4], cubes: [
    B([-4, 4, -4.1], [8, 4, 0], R('#101418', '#08090a'), { mask: (f, x, y) => (x <= 2 || x >= 5) && !(y === 3 && (x === 0 || x === 7)),
      detail: { north: (x, y) => (y === 1 && (x === 1 || x === 6) ? '#58e0e8' : null) } }),
    B([-0.5, 3, -4.2], [1, 2, 0], R('#2a2420', '#1a1410')) ] },
  ...[-1, 1].map(s => rotBox('mandible' + (s < 0 ? '_l' : '_r'), 'head', [s * 1.5, 1.8, -4.3], [1, 2, 1], [0, 0, s * 25], R('#f8a050', '#d07830'))),
  ...[['wing_l', -1], ['wing_r', 1]].map(([n, s]) => ({ name: n, parent: 'body', pivot: [s * 2, 10, 1], rot: [40, s * 10, s * -25], cubes: [B([s * 2 - 2, 10, 1], [4, 12, 0], brownWing, { mask: pointUp })] })),
  ...keepBones(hatch, b => b.name.startsWith('leg_')),
] };

// ----------------------------------------------------------------------------------------------------- Parafright
// STS2: a translucent cyan ghost curled into a ring - a thick swirling torus, thicker at the top where its little
// sucker-eyes cluster, its fringe streaming off to one side in wisps.
const para = withPattern({ ramp: ['#e8ffff', '#b0f4ff', '#78dcf8', '#48bce8', '#2c98d0'], alpha: 165 }, (f, x, y) => ((x + y) % 4 === 0 ? 1 : 0));
const paraBones = [{ name: 'body', pivot: [0, 11, 0], cubes: [] }];
for (let k = 0; k < 10; k++) {
  const a = k * 36, rad = a * Math.PI / 180, r = 6, th = 4 + (k < 3 || k > 8 ? 1 : 0);
  paraBones.push(rotBox('ring' + k, 'body', [Math.round(Math.sin(rad) * r * 10) / 10, 11 + Math.round(Math.cos(rad) * r * 10) / 10, 0], [th, 5, th], [0, 0, -a], para));
}
paraBones.push({ name: 'head', parent: 'body', pivot: [0, 15, 0], cubes: [-3, -1, 1, 3].map((x, k) => B([x - 0.5, 15.5 + (k % 2), -2.8], [1, 1, 0], R('#ffffff', '#d8ffff'))) });
paraBones.push(...[0, 1, 2].map(k => ({ name: 'tent_' + k, parent: 'body', pivot: [5, 9 + k * 2, 1], rot: [0, 25 - k * 10, -20 + k * 15], cubes: [
  B([5, 7 + k * 2, 1], [10, 4, 0], { ...para, alpha: 120 }, { mask: (f, x, y, w, h) => Math.abs(y - 1.5 - Math.sin(x * 0.6 + k) * 1) <= 1.5 * (1 - x / w) + 0.3 })] })));
N.parafright = { render: 'translucent', bones: paraBones };

// ----------------------------------------------------------------------------------------------------- Bowlbugs
// STS2: a round beetle - two domed wing cases meeting down the middle, a short head with one big cyan eye on a stalk,
// yellow hooked mandibles, four thin legs; the load on its back (a rough boulder, a spotted teal egg, a white ball
// of silk, a sac of orange nectar with a frilled rim). The wing cases are bevelled prisms leaning out, the loads
// rounded or tilted.
function roundBug(name, shell, loadBones) {
  const old = hive[name];
  const body = old.bones.find(b => b.name === 'body');
  const sh = withPattern(shell, (f, x, y, w, h) => (f === 'up' ? (y < 2 ? 1.2 : 0) : y === 0 ? 1 : 0));
  return { ...old, bones: [
    { ...body, cubes: body.cubes.slice(2) },   // keep the underside plate
    ...[-1, 1].flatMap(s => bevelBox('case' + (s < 0 ? '_l' : '_r'), 'body', [s * 3, 7.5, 1], [6, 9, 12], 2, sh, [0, 0, s * -6])),
    ...old.bones.filter(b => b.name !== 'body' && b.name !== 'load'),
    { name: 'load', parent: 'body', pivot: [0, 11, 2], cubes: [] }, ...loadBones,
  ] };
}
const rockM = withPattern(R('#b4b89c', '#9a9e82', '#80846a', '#686c56', '#525644', '#3e4234'), (f, x, y) => (h2(x, y, 31) < 8 ? 1.2 : (x + y) % 5 === 0 ? -0.7 : 0));
const eggM = withPattern(R('#b4f4f0', '#88dcdc', '#62c2c8', '#449eaa', '#2e808c'), (f, x, y) => (h2(x >> 1, y >> 1, 5) < 14 ? '#2a6a74' : 0));
const silkM = withPattern(R('#ffffff', '#f2f2f4', '#e0e0e6', '#cacad4', '#b0b0bc'), (f, x, y) => ((x + y) % 5 === 0 || (x - y + 40) % 6 === 0 ? 1.1 : 0));
const sacM = withPattern({ ramp: ['#ffe9a0', '#ffd468', '#f6b23c', '#e89428', '#c87418'], alpha: 235 }, (f, x, y) => ((x + y) % 7 === 0 ? -1 : 0));
const rimM = withPattern(R('#fff2a8', '#ffe070', '#f6c848', '#e0a830'), (f, x) => (x % 2 === 0 ? -0.6 : 0.6));
N.bowlbug_rock = roundBug('bowlbug_rock', R('#f49a8c', '#e8746a', '#d4564e', '#b8403c', '#962e2e', '#742222'), [
  rotBox('boulder', 'load', [0, 15, 2], [12, 8, 11], [8, 15, -6], rockM), rotBox('boulder_top', 'load', [-1, 19.5, 1], [8, 4, 7], [-12, 35, 10], rockM), rotBox('boulder_side', 'load', [4, 15, 5], [6, 6, 6], [20, -20, 15], rockM)]);
N.bowlbug_egg = roundBug('bowlbug_egg', R('#d4e88a', '#b8d468', '#9cbc50', '#80a03e', '#648030', '#4a6024'), [
  ...bevelBox('egg', 'load', [0, 16, 2], [10, 11, 10], 3, eggM), rotBox('egg_top', 'egg', [0, 22, 2], [5, 2, 5], [0, 45, 0], eggM)]);
N.bowlbug_silk = roundBug('bowlbug_silk', R('#f0d4d0', '#e0b8b4', '#cc9e9a', '#b48482', '#986a6a', '#7a5252'), [
  ...bevelBox('ball', 'load', [0, 17, 2], [14, 12, 14], 4, silkM)]);
N.bowlbug_nectar = roundBug('bowlbug_nectar', R('#f6a8e8', '#e882d6', '#d064c0', '#b04aa4', '#8c3684', '#6a2664'), [
  ...octo('sac', 'load', [0, 14.5, 2], 8, 13, 13, 4, sacM, 'y'),
  ...[0, 1, 2, 3, 4, 5, 6, 7].map(k => ringPlane('frill' + k, 'sac', [0, 18, 2], 5.5, k * 45, [5, 3], 35, rimM, (f, x, y, w, h) => y >= (x % 2)))]);

// ----------------------------------------------------------------------------------------------------- Myte, Chomper
// Myte (STS2): a round orange crab-spider, its shell in overlapping plates with short curved spikes along the ridge,
// pale cream pincers, long red legs. The shell becomes a bevelled prism with a tilted ridge plate.
const mite = withPattern(R('#f8b070', '#e88c48', '#c86a30', '#a85224', '#86401c'), (f, x, y) => (f === 'up' ? (x % 4 === 0 ? -0.8 : 0) : y % 3 === 0 ? 0.8 : 0));
const spike = R('#ffd0a0', '#f0a060', '#c87838');
{
  const m = hive.myte, body = m.bones.find(b => b.name === 'body');
  N.myte = { ...m, bones: [{ ...body, cubes: body.cubes.filter(c => c.size[1] === 1) },
    ...octo('shell', 'body', [0, 9, 1], 13, 13, 9, 3, mite, 'z', [-6, 0, 0]),
    rotBox('ridge', 'shell', [0, 13.5, 1.5], [8, 2, 11], [-6, 0, 0], mite),
    ...[-4, -0.5, 3, 6.5].map((z, k) => rotBox('spike' + k, 'ridge', [(k % 2 ? 1.5 : -1.5), 16, z], [1, 3, 1], [-30, 0, (k % 2 ? -15 : 15)], spike)),
    ...m.bones.filter(b => b.name !== 'body')] };
}
// Chomper (STS2): a brass jaw on a cyan orb - the stepped helmet becomes a cone of four plates leaning in, the orb a
// bevelled ball.
{
  const c = hive.chomper, body = c.bones.find(b => b.name === 'body'), brass = withPattern(R('#f8e2a8', '#e0c47c', '#c4a25a', '#9e7e40', '#7a5e2c'), (f, x, y) => (y === 0 ? 1 : 0));
  const orbM = { ...glowing(R('#e8ffff', '#a8f4ff', '#60dcf4', '#30b4d8', '#2088b0')), pattern: (f, x, y) => (x === 2 && y === 2 ? '#ffffff' : 0) };
  N.chomper = { ...c, bones: [{ ...body, cubes: body.cubes.filter(cb => cb.size[1] === 1) }, ...bevelBox('orb', 'body', [0, 8.5, 0], [9, 9, 9], 3, orbM),
    { name: 'helmet', parent: 'body', pivot: [0, 14, 2], cubes: [B([-5, 13.5, -3], [10, 2, 10], brass)] },
    ...[0, 90, 180, 270].map((a, k) => ringPlane('cone' + k, 'helmet', [0, 15.5, 2], 4.5, a, [9, 6], -38, brass, (f, x, y, w, h) => Math.abs(x + 0.5 - w / 2) <= w / 2 * (1 - y / (h + 1)) + 0.5)),
    rotBox('cone_tip', 'helmet', [0, 20.5, 2], [2, 2, 2], [0, 45, 0], brass),
    ...c.bones.filter(b => b.name !== 'body' && b.name !== 'helmet')] };
}

module.exports = N;
