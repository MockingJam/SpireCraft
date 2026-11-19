// Model v10 (user 2026-11-19: "杀戮尖塔2_新增17种怪物原作还原度评审.md"). Each point checked against the STS2 render
// (slaythespire.wiki.gg StS2_<Name>.png) first; where the review guessed and the render shows otherwise, the render
// wins (noted per entry). Overrides earlier entries.
const { R, withPattern, glowing, h2, hash, B, fin, eyeDetail, fringe, limb, rotBox, octo, bevelBox } = require('./kit');
const at = (pts, c) => (x, y) => (pts.some(([a, b]) => a === x && b === y) ? c : null);
const leafMask = (face, x, y, w, h) => { const cx = (w - 1) / 2, t = y / Math.max(1, h - 1); const half = Math.sin(Math.PI * Math.min(1, t * 1.05 + 0.05)) * w / 2; return Math.abs(x - cx) <= half + 0.2; };
const ring = (n, r, fn) => Array.from({ length: n }, (_, k) => fn(k, k * 2 * Math.PI / n, Math.cos(k * 2 * Math.PI / n) * r, Math.sin(k * 2 * Math.PI / n) * r));
const out = {};

// --------------------------------------------------------------------------------------- Eye With Teeth (P0)
// Render: a ghostly, pale-green flower - a single eye with a dark green slit in the middle, two layers of pointed
// petals round it (the "teeth"), long wavy tendrils with small barbs trailing out from it.
{
  const ghost = { ramp: ['#f0fff8', '#ccf8e4', '#a4e8cc', '#80d0b0', '#5cb090'], alpha: 165 };
  const petal = withPattern(ghost, (f, x, y) => (x === 1 ? -0.6 : 0));
  out.eye_with_teeth = { render: 'translucent', bones: [
    { name: 'body', pivot: [0, 9, 0], cubes: [B([-0.5, 7, -4.2], [3, 4, 1], R('#4b9d73', '#327d57', '#205d3e'), { detail: { north: (x, y) => x === 1 ? '#10402a' : (y === 0 && x === 0 ? '#b6f4cd' : null) } })] },
    ...bevelBox('bulb', 'body', [0, 9, 1], [10, 10, 10], 3, R('#d4f8e4', '#a8dfc3', '#78bd9d')),
    ...ring(8, 4.5, (k, a, cx, cy) => rotBox('petal' + k, 'body', [cx, 9 + cy, -2], [4, 7, 2], [Math.round(Math.sin(a) * 28), Math.round(Math.cos(a) * 28), Math.round(-a * 57.3) + 90], petal, { mask: (f, x, y, w, h) => Math.abs(x - 1) <= (h - y) * 0.4 + 0.2 })),
    ...ring(8, 6.5, (k, a, cx, cy) => rotBox('petalb' + k, 'body', [Math.cos(a + 0.39) * 6.5, 9 + Math.sin(a + 0.39) * 6.5, 2], [4, 7, 2], [Math.round(Math.sin(a + 0.39) * -35), Math.round(Math.cos(a + 0.39) * -35), Math.round(-(a + 0.39) * 57.3) + 90], petal, { mask: (f, x, y, w, h) => Math.abs(x - 1) <= (h - y) * 0.4 + 0.2 })),
    ...[0, 1, 2, 3, 4].flatMap(i => { const a = i * 1.26 + 0.3, x = Math.cos(a) * 8, y = 9 + Math.sin(a) * 8, deg = Math.round(-a * 57.3);
      return [{ name: 'tent_' + i, parent: 'body', pivot: [x, y, 0], rot: [0, 0, deg], cubes: [B([x, y - 0.5, -0.5], [6, 1, 1], ghost), B([x + 3, y + 0.5, -0.5], [1, 1, 1], ghost)] },
        { name: 'tent_' + i + 'b', parent: 'tent_' + i, pivot: [x + 6, y, 0], rot: [0, 0, 30], cubes: [B([x + 6, y - 0.5, -0.5], [6, 1, 1], ghost), B([x + 9, y - 1.5, -0.5], [1, 1, 1], ghost)] },
        { name: 'tent_' + i + 'c', parent: 'tent_' + i + 'b', pivot: [x + 12, y, 0], rot: [0, 0, -35], cubes: [B([x + 12, y - 0.5, -0.5], [5, 1, 1], ghost)] }]; }),
  ] };
}

// --------------------------------------------------------------------------------------- Snapping Jaxfruit (P0)
// Render: a big round pink-red fruit, its skin a net of rounded scales; a crown of dark red pointed petals and broad
// green leaves at the top, three thin sprouts with little buds rising from the middle. (No mouth is drawn in the
// render, so none is added.)
{
  const skin = withPattern(R('#ffb4b8', '#f48890', '#e06070', '#c04454', '#9a3040'), (f, x, y) => { const row = Math.floor(y / 4), u = (x + (row % 2) * 2) % 5, v = y % 4; return (u === 0 && v > 0) || (v === 3 && u > 0 && u < 4) ? 0.8 : (u === 2 && v === 1 ? -0.6 : 0); });
  const petal = withPattern(R('#d05050', '#a83838', '#802828', '#5e1c1c'), (f, x) => (x === 1 ? -0.6 : 0));
  const leaf = withPattern(R('#c4e08a', '#a0c868', '#7caa4e', '#5c8a3a'), (f, x, y, w) => (x === Math.floor(w / 2) ? -0.8 : 0));
  out.snapping_jaxfruit = { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 0, 0], cubes: [] },
    ...bevelBox('fruit', 'body', [0, 8, 0], [16, 16, 16], 4, skin),
    { name: 'head', parent: 'body', pivot: [0, 15, 0], cubes: [] },
    ...ring(8, 5.5, (k, a, cx, cz) => rotBox('petal' + k, 'head', [cx, 18, cz], [5, 10, 0], [Math.round(Math.sin(a) * 40), Math.round(-a * 57.3) + 90, Math.round(-Math.cos(a) * 40)].map((v, i) => (i === 1 ? v : v)), petal, { mask: (f, x, y, w, h) => Math.abs(x - 2) <= (y + 0.5) * 0.25 + 0.2 })),
    ...ring(6, 7, (k, a, cx, cz) => rotBox('leaf' + k, 'head', [cx, 13, cz], [7, 9, 0], [25, Math.round(-a * 57.3) + 90, 0], leaf, { mask: leafMask })),
    ...[-1, 1].map(side => rotBox('front_leaf_' + side, 'head', [side * 4, 13.5, -8.5], [8, 10, 0], [8, side * 10, side * 20], leaf, { mask: leafMask })),
    ...ring(8, 7, (k, a, cx, cz) => rotBox('base_leaf' + k, 'body', [cx, 1.5, cz], [6, 5, 0], [45, Math.round(-a * 57.3) + 90, 0], leaf, { mask: leafMask })),
    ...[-1, 0, 1].map(i => rotBox('base_front_' + i, 'body', [i * 4.5, 2, -8.5], [6, 4, 0], [15, i * 15, i * 20], leaf, { mask: leafMask })),
    ...[[-2, -1, -10], [0, 1, 0], [2, -1, 10]].map(([x, z, rz], i) => ({ name: 'tent_' + i, parent: 'head', pivot: [x, 15, z], rot: [0, 0, rz], cubes: [B([x - 0.5, 15, z - 0.5], [1, 9 + (i % 2) * 2, 1], R('#7aa848', '#5a8834')), B([x - 1, 24 + (i % 2) * 2, z - 1], [2, 2, 2], R('#a8d870', '#80b850'))] })),
  ] };
}

// --------------------------------------------------------------------------------------- Slithering Strangler (P0)
// Render: a red-brown serpent - its tail wound in a loop on the ground, the body rising in an S, white spikes studding
// its outer curves, a darker frill along the back of the neck, the head a grey, bony, blade-like crest.
{
  const scales = withPattern(R('#e88870', '#cc6650', '#ac4c3a', '#8a3a2c', '#6a2c22'), (f, x, y) => ((x + (y % 2)) % 2 === 0 ? 0.5 : 0));
  const spikeM = R('#fffcf0', '#ece4d0', '#d0c4a8');
  const boneG = withPattern(R('#e8ecf0', '#c8ced6', '#a4acb8', '#7c8490'), (f, x, y) => (y === 0 ? 1 : 0));
  // Continuous ground coil, opening into a raised, inward-curving tail tip.
  const path = [[0,2,-2], [0,2,5], [6,2,9], [12,2,7], [14,2,1], [11,2,-5], [5,2,-6], [3,2,-1], [6,2,2], [10,2,1], [13,4,-1], [14,8,-2], [12,11,-2], [9,11,-2]];
  const coil = path.slice(0, -1).map((a, i) => {
    const b = path[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    const length = Math.ceil(Math.hypot(dx, dy, dz) + 1.5), width = Math.max(2, Math.round(5 - i * 0.24));
    const yaw = Math.atan2(dx, dz) * 180 / Math.PI;
    const pitch = Math.atan2(dy, Math.hypot(dx, dz)) * 180 / Math.PI;
    return rotBox(i ? 'tail_' + i : 'tail', 'body', a.map((v, j) => (v + b[j]) / 2), [width, width, length], [pitch, yaw, 0], scales);
  });
  out.slithering_strangler = { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 2, 4], cubes: [] },
    ...coil, ...[[0,4.5,3], [6,4.5,9], [13,4.5,4], [11,4.5,-5]].map(([x,y,z], i) => rotBox('coilspike' + i, 'body', [x,y,z], [2,3,2], [0,0,i % 2 ? 15 : -15], spikeM)),
    { name: 'seg_1', parent: 'body', pivot: [0, 3, -2], rot: [-55, 0, 0], cubes: [B([-2, 1, -9], [4, 4, 8], scales), B([-0.5, 5, -7], [1, 2, 1], spikeM), B([-0.5, 5, -4], [1, 2, 1], spikeM)] },
    { name: 'seg_2', parent: 'seg_1', pivot: [0, 3, -9], rot: [35, 0, 0], cubes: [B([-2, 1, -16], [4, 4, 7], scales), B([2, 3, -14], [2, 1, 1], spikeM), B([-4, 3, -12], [2, 1, 1], spikeM)] },
    { name: 'seg_3', parent: 'seg_2', pivot: [0, 3, -16], rot: [-30, 0, 0], cubes: [B([-1.5, 1.5, -21], [3, 3, 5], scales), B([0, 4.5, -21], [0, 4, 6], R('#8a2c24', '#6a1e18'), { mask: (f, x, y, w, h) => y >= h - 1 - (x % 3) })] },
    { name: 'head', parent: 'seg_3', pivot: [0, 3, -21], rot: [20, 0, 0], cubes: [] },
    rotBox('skull', 'head', [0, 4, -24], [5, 4, 6], [0, 0, 0], boneG),
    rotBox('crest', 'head', [0, 8, -23], [2, 6, 8], [-25, 0, 0], boneG), rotBox('crest_tip', 'crest', [0, 11, -28], [1, 3, 5], [-40, 0, 0], boneG),
    ...[-1, 1].map(s => rotBox('cheek' + s, 'head', [s * 3, 4, -23], [1, 3, 4], [0, s * 20, s * 15], boneG)),
    rotBox('snout', 'head', [0, 3, -28], [3, 2, 3], [10, 0, 0], boneG),
  ] };
}

// --------------------------------------------------------------------------------------- Cubex Construct (P0)
// Render: two separate ancient stones with nothing joining them - a tall olive block leaning to one side, an amber
// orb set in its lower front; a glowing cyan orb floating in the gap below; a short squat base block with a chipped
// corner and moss on top. (The render shows an amber orb, not the "red diamond" the review guessed.)
{
  const stone = withPattern(R('#e8e0a8', '#d0c488', '#b4a86c', '#948a54', '#766c40'), (f, x, y) => (h2(x, y, 31) < 6 ? 1.2 : (Math.floor(x / 3) + Math.floor(y / 2)) % 3 === 0 ? -0.4 : 0));
  const moss = withPattern(R('#b4c880', '#94aa64', '#788c4c'), (f, x, y) => ((x + y) % 3 === 0 ? 1 : 0));
  out.cubex_construct = { render: 'cutout', glow: true, bones: [
    { name: 'body', pivot: [0, 0, 0], cubes: [B([-4, 0, -4], [8, 4, 8], stone), B([-4, 4, -4], [8, 1, 8], moss, { mask: (f, x, y) => f !== 'up' || (x + y) % 4 !== 0 })] },
    rotBox('chip', 'body', [3.5, 3.5, -3.5], [2, 2, 2], [45, 45, 0], R('#948a54', '#766c40')),
    { name: 'orbit', parent: 'body', pivot: [0, 8, 0], cubes: [B([-1.5, 6.5, -1.5], [3, 3, 3], glowing(R('#f0ffff', '#a0f4ff', '#58dcf4', '#28b4d8')))] },
    { name: 'head', parent: 'body', pivot: [0, 12, 0], rot: [0, 0, -10], cubes: [B([-3.5, 12, -3.5], [7, 17, 7], stone),
      B([-1.5, 13, -3.8], [3, 3, 1], R('#ffd8a0', '#f0a050', '#c87830'), { detail: { north: at([[0, 0]], '#fff4e0') } })] },
  ] };
}

// --------------------------------------------------------------------------------------- Corpse Slug (P0)
// Render: a nudibranch, big in front and tapering behind; the raised front opens into a cavity crowded with pink,
// finger-like tentacles of different lengths, bent every way; a soft pale belly fringe hangs along the bottom; blue
// with yellow-gold bands; two short blue horns on top, apart from the mouth fringe.
{
  const blue = withPattern(R('#9ed0f0', '#74b4e2', '#5498d0', '#3e7cb8', '#2e6298', '#224a78'), (f, x, y, w, h) => (f === 'up' ? (x === Math.floor(w / 2) ? '#f4d070' : 0) : (f === 'east' || f === 'west') ? (y === Math.round(h * 0.45) ? '#f4d070' : y === Math.round(h * 0.45) + 1 ? '#e0b050' : 0) : 0));
  const foot = R('#fff6e0', '#f0e2c0', '#dccaa0', '#c0ae84');
  const pink = R('#fff0ee', '#f8d0cc', '#eca8a4', '#d4807c');
  const tentacles = [[-3, 12, 4], [-1, 13, 5], [1, 12.5, 4], [3, 12, 5], [-3.5, 9, 6], [-1.5, 10, 3], [0.5, 9.5, 5], [2.5, 10, 4], [-2.5, 7, 4], [-0.5, 7.5, 6], [1.5, 7, 3], [3, 8, 5]];
  out.corpse_slug = { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 2, 0], cubes: [] },
    rotBox('foot', 'body', [0, 1, 1.5], [11, 2, 19], [0, 0, 0], withPattern(foot, (f, x, y) => (f === 'up' && x % 2 === 0 ? 1 : 0))),
    ...octo('trunk', 'body', [0, 5, 0], 9, 9, 7, 2, blue, 'z'),
    { name: 'tail', parent: 'body', pivot: [0, 3, 4], rot: [6, 0, 0], cubes: [] },
    rotBox('tail1', 'tail', [0, 3.5, 7], [7, 4, 6], [8, 0, 0], blue), rotBox('tail2', 'tail', [0, 2.5, 11.5], [4, 2, 5], [12, 0, 0], blue),
    { name: 'head', parent: 'body', pivot: [0, 6, -4], rot: [-22, 0, 0], cubes: [] },
    ...octo('hood', 'head', [0, 10, -6.5], 6, 10, 10, 3, blue, 'z'),
    rotBox('cavity', 'head', [0, 10, -9.6], [8, 8, 1], [0, 0, 0], R('#5a2830', '#3a1620')),
    ...tentacles.map(([x, y, len], i) => rotBox('tentacle' + i, 'head', [x, y, -10 - len / 2], [1, 1, len], [((i * 37) % 50) - 25, ((i * 53) % 50) - 25, 0], pink)),
    ...[['antenna_l', -2], ['antenna_r', 2]].map(([n, x]) => ({ name: n, parent: 'head', pivot: [x, 15, -5], rot: [-15, 0, x * 8], cubes: [B([x - 0.5, 15, -5.5], [1, 3, 1], R('#74b4e2', '#3e7cb8')), B([x - 1, 18, -6], [2, 2, 2], R('#9ed0f0', '#5498d0'))] })),
  ] };
}

// --------------------------------------------------------------------------------------- Seapunk (P0)
// Render: a loose, messy clump of green fronds and slime with a big dark gaping mouth in the middle, strings of slime
// across it; long thin stems rising in arcs of different heights, each with a flat leaf-bud at the tip.
{
  const kelp = withPattern(R('#c8f088', '#a8dc68', '#86c04e', '#68a03c', '#4c7e2c', '#36601e'), (f, x, y) => (x % 3 === 1 ? -0.8 : x % 3 === 0 ? 0.4 : 0.7));
  const stem = R('#b0d878', '#8cbc58', '#6c9c42');
  const fronds = ring(10, 5, (k, a, cx, cz) => rotBox('frond' + k, 'body', [cx, 6 - (k % 3), cz], [5, 9 + (k % 3) * 2, 0], [Math.round(Math.sin(a) * 25) + (k % 2) * 8, Math.round(-a * 57.3) + 90, Math.round(-Math.cos(a) * 25)], kelp, { mask: (f, x, y, w, h) => y < h - (hash(x, k) % 3) }));
  const stalks = [[-3, 0, -35, -40, 3], [-1, -2, -15, -55, 4], [1, -1, 10, -50, 3], [3, 0, 30, -40, 4], [-2, 2, -25, 15, 3], [2, 2, 25, 20, 3], [0, 3, 0, 30, 4], [0, -3, 5, -65, 3]];
  out.seapunk = { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 4, 0], cubes: [] },
    ...octo('clump', 'body', [0, 5.5, 0], 9, 11, 10, 3, kelp, 'y'),
    rotBox('maw', 'clump', [0, 5, -5], [7, 6, 1], [0, 0, 0], R('#2a1208', '#1a0a04')),
    ...[-2, 0, 2].map((x, i) => rotBox('slime' + i, 'clump', [x, 5, -5.3], [0, 6, 1], [0, 90, 0], { ramp: ['#d0f0b0', '#a8d888'], alpha: 180 })),
    rotBox('lip_top', 'clump', [0, 8.5, -5.5], [9, 2, 2], [-15, 0, 0], kelp), rotBox('lip_bottom', 'clump', [0, 1.5, -5.5], [9, 2, 2], [15, 0, 0], kelp),
    ...fronds,
    ...stalks.flatMap(([x, z, rz, rx, n], i) => [
      { name: 'stalk_' + i, parent: 'body', pivot: [x, 10, z], rot: [rx + 30, 0, rz], cubes: [B([x - 0.5, 10, z - 0.5], [1, 6, 1], stem)] },
      { name: 'stalk_' + i + 'b', parent: 'stalk_' + i, pivot: [x, 16, z], rot: [-20, 0, -rz * 0.4], cubes: [B([x - 0.5, 16, z - 0.5], [1, n * 2, 1], stem)] },
      { name: 'stalk_' + i + 'c', parent: 'stalk_' + i + 'b', pivot: [x, 16 + n * 2, z], rot: [-25, 0, -rz * 0.3], cubes: [B([x - 0.5, 16 + n * 2, z - 0.5], [1, 4, 1], stem),
        B([x - 1.5, 20 + n * 2, z], [3, 5, 0], withPattern(R('#9ae078', '#6cc058', '#4ea048'), (f, px) => (px === 1 ? -0.8 : 0)), { mask: leafMask })] },
    ]),
  ] };
}

// --------------------------------------------------------------------------------------- Terror Eel (P0)
// Render: the eyes are the point - many red-rimmed eyes with black pupils, of different sizes, over the long snout,
// along the sides and onto the curled tail; sparse, uneven white teeth along the jaw; yellow curving stripes on the
// back; the tail folds up in a hook. Built on the v6 body with real eye and tooth parts added.
{
  const eyeM = (sz) => R('#f4e8e0', '#e0d0c4');
  const eyeD = (x, y, w, h) => { const c = (w - 1) / 2, d = Math.hypot(x - c, y - c); return d < w * 0.22 ? '#100808' : d < w * 0.45 ? '#c82c2c' : '#f4e8e0'; };
  const eye = (name, parent, c, s, face) => rotBox(name, parent, c, face === 'up' ? [s, 1, s] : [1, s, s], [0, 0, 0], eyeM(s), { detail: face === 'up' ? { up: eyeD } : { east: eyeD, west: eyeD } });
  const v6 = require('./specs_docks').terror_eel;
  const tooth = (name, x, z, h) => rotBox(name, 'head', [x, 1.5 + h / 2, z], [1, h, 1], [0, 0, 0], R('#fffaf0', '#e8dcc8'));
  out.terror_eel = { ...v6, bones: [
    ...v6.bones.map(b => b.name === 'tail' ? { ...b, rot: [48, 0, 0] } : b.name === 'tail_tip' ? { ...b, rot: [55, 0, 0] } : b),
    // eyes: big ones on the snout and neck, smaller along the body and tail
    eye('eye_h1', 'head', [-3.5, 5, -11], 3, 'side'), eye('eye_h2', 'head', [3.5, 5, -11], 3, 'side'), eye('eye_h3', 'head', [-3.5, 4, -7], 2, 'side'), eye('eye_h4', 'head', [3.5, 4.5, -8], 2, 'side'),
    eye('eye_h5', 'head', [0, 7.5, -9], 2, 'up'),
    eye('eye_b1', 'body', [-4, 4, -2], 3, 'side'), eye('eye_b2', 'body', [4, 3, 1], 2, 'side'), eye('eye_b3', 'body', [-1.5, 7.5, 2], 2, 'up'), eye('eye_b4', 'body', [2, 7.5, -3], 3, 'up'),
    eye('eye_c1', 'body_2', [-3.5, 3, 8], 2, 'side'), eye('eye_c2', 'body_2', [3.5, 4, 11], 3, 'side'), eye('eye_c3', 'body_2', [0, 7, 9], 2, 'up'),
    eye('eye_t1', 'tail', [-3, 3, 16], 2, 'side'), eye('eye_t2', 'tail', [3, 3, 18], 2, 'side'),
    // sparse, uneven teeth
    ...[[-2.5, -13, 2], [2.5, -12, 1], [-2.5, -10, 1], [2.5, -9, 2], [-2.5, -7, 1], [1, -14, 2], [-1, -14.5, 1]].map(([x, z, h], i) => tooth('tooth' + i, x, z, h)),
    // the yellow curving stripes over the back
    rotBox('stripe1', 'body', [0, 7.1, 0], [5, 0, 2], [0, 25, 0], R('#f8d850', '#e0b030')), rotBox('stripe2', 'body_2', [0, 6.6, 9], [4, 0, 2], [0, -25, 0], R('#f8d850', '#e0b030')),
  ] };
}

// --------------------------------------------------------------------------------------- Toadpole (P1)
// Render: a streamlined tadpole - a smooth head (not a boxy armoured nose), a big round orange eye on each side, a dark
// spotted line down the back, the body thinning smoothly into a translucent tail with one continuous fin top and
// bottom.
{
  const skin = { ramp: ['#b8f0e0', '#90dccb', '#6cc4b2', '#50a898', '#3a8a7e', '#2a6c64'], alpha: 230 };
  const finM = { ramp: ['#e0fff6', '#c0f0e2', '#a0dccc'], alpha: 125 };
  const orange = (x, y, w, h) => { const d = Math.hypot(x - 1, y - 1); return d < 0.8 ? '#1a1008' : d < 1.6 ? '#f08a20' : '#c86010'; };
  out.toadpole = { render: 'translucent', bones: [
    { name: 'body', pivot: [0, 6, -3], cubes: [] },
    ...octo('head_body', 'body', [0, 6.5, -4.5], 9, 8, 7, 2, withPattern(skin, (f, x, y, w) => (f === 'up' && x === Math.floor(w / 2) && y % 2 ? '#20403a' : f === 'down' ? 1 : 0)), 'z'),
    ...[-1, 1].map(s => rotBox('eye' + s, 'body', [s * 4.1, 7.5, -6], [1, 3, 3], [0, 0, 0], R('#ffb050', '#f08a20'), { detail: { east: orange, west: orange } })),
    { name: 'tail', parent: 'body', pivot: [0, 6, 0], cubes: [] },
    ...octo('tail_root', 'tail', [0, 6.5, 2.5], 5, 5, 4, 1, withPattern(skin, (f, x, y) => (f === 'up' && x === 2 && y % 2 ? '#20403a' : 0)), 'z'),
    rotBox('fin_root', 'tail', [0, 6.5, 3], [0, 10, 6], [0, 0, 0], finM, { mask: (f, x, y, w, h) => Math.abs(y - (h - 1) / 2) <= (h / 2) * (0.55 + 0.45 * x / w) }),
    { name: 'tail_tip', parent: 'tail', pivot: [0, 6.5, 5], cubes: [B([-1, 5.5, 5], [2, 2, 5], skin), B([0, 1.5, 5], [0, 10, 10], finM, { mask: (f, x, y, w, h) => Math.abs(y - (h - 1) / 2) <= (h / 2) * (1 - x / (w + 1)) + 0.3 })] },
  ] };
}

// --------------------------------------------------------------------------------------- Two-Tailed Rat (P1)
// Render: shaggy grey fur over a hunched back (fur, not a shell - the review's "back shell" is the fur), small head
// with a long snout pointing down, thin pink limbs; ONE long pink tail that splits into two near its end - both tips
// now with their own root, direction and end.
{
  const v6 = require('./specs_docks').two_tailed_rat;
  const pink = withPattern(R('#fcd6cc', '#f0b4a8', '#dc9488', '#bc7468'), (f, x, y) => (y % 2 ? 0.6 : 0));
  out.two_tailed_rat = { ...v6, bones: [
    ...v6.bones.filter(b => b.name !== 'tail'),
    { name: 'tail', parent: 'body', pivot: [0, 8, 4], rot: [-65, 0, 0], cubes: [B([-0.5, 7.5, 4], [1, 1, 12], pink)] },
    { name: 'tail_1', parent: 'tail', pivot: [0, 8, 16], rot: [10, 28, 0], cubes: [B([-0.5, 7.5, 16], [1, 1, 8], pink)] },
    { name: 'tail_2', parent: 'tail', pivot: [0, 8, 16], rot: [-15, -28, 0], cubes: [B([-0.5, 7.5, 16], [1, 1, 8], pink)] },
  ] };
}

// --------------------------------------------------------------------------------------- Living Fog (P1)
// Render: a leaning plume of mauve smog, thick at the front and trailing up and back into wisps; low in front a dark
// lamprey mouth ringed with teeth, pink pearls round its lip.
{
  const fog = withPattern({ ramp: ['#e0d0e0', '#c4b0c4', '#a490a4', '#887088', '#6c566c'], alpha: 190 }, (f, x, y) => (h2(x, y, 8) < 14 ? -0.8 : 0));
  const pearl = glowing(R('#ffe8f8', '#f8b0e0', '#e080c4'));
  const puffs = [[0, 8, -2, 14, 12, 12, [0, 0, 0]], [3, 15, 4, 11, 10, 10, [15, 20, -10]], [6, 21, 9, 9, 8, 8, [25, 30, -20]], [8, 26, 13, 7, 6, 6, [35, 40, -25]], [-4, 12, 3, 8, 8, 8, [10, -20, 15]]];
  out.living_fog = { render: 'translucent', glow: true, bones: [
    { name: 'body', pivot: [0, 10, 0], cubes: [] },
    ...puffs.map(([x, y, z, w, h, d, r], i) => rotBox('puff' + i, 'body', [x, y, z], [w, h, d], r, fog)),
    { name: 'tent_0', parent: 'body', pivot: [9, 29, 15], rot: [30, 30, -20], cubes: [B([8, 29, 14], [3, 8, 2], fog), B([9, 37, 15], [2, 4, 1], fog)] },
    { name: 'head', parent: 'body', pivot: [0, 6, -8], cubes: [B([-3.5, 3, -8.3], [7, 7, 0], R('#2a1018', '#1a0810'), { mask: (f, x, y) => Math.hypot(x - 3, y - 3) <= 3.6,
      detail: { north: (x, y) => (Math.hypot(x - 3, y - 3) > 2.4 ? '#fffaf0' : null) } })] },
    { name: 'orbit', parent: 'head', pivot: [0, 6.5, -8.5], cubes: ring(7, 5, (k, a, cx, cy) => B([cx - 1, 6.5 + cy - 1, -9.5], [2, 2, 2], pearl)) },
  ] };
}

// --------------------------------------------------------------------------------------- Gas Bomb (P1)
// Render: a small puff of grey-mauve gas trailing a wisp upward, a crackling pink spark at its base - unstable, not a
// box. Same palette as the Living Fog, the brightness gathered in the spark.
{
  const fog = { ramp: ['#d8c8d8', '#b8a4b8', '#988498'], alpha: 185 };
  const spark = glowing(R('#ffe8ff', '#f8a8f0', '#e070d8'));
  out.gas_bomb = { render: 'translucent', glow: true, bones: [
    { name: 'body', pivot: [0, 4, 0], cubes: [] },
    rotBox('puff0', 'body', [0, 4, 0], [6, 5, 6], [0, 20, 10], fog), rotBox('puff1', 'body', [2, 8, 1], [4, 4, 4], [20, 40, -15], fog), rotBox('puff2', 'body', [3, 11.5, 2], [3, 4, 2], [30, 30, -25], fog),
    { name: 'orbit', parent: 'body', pivot: [0, 1.5, 0], cubes: [B([-3, 0, -2.6], [6, 4, 0], spark, { mask: (f, x, y) => (x + y) % 3 === 0 || y === Math.round(x * 0.6) }), B([0, 0, -3], [0, 4, 6], spark, { mask: (f, x, y) => (x * 2 + y) % 3 === 0 })] },
  ] };
}

// --------------------------------------------------------------------------------------- Inklet (P1)
// Render: a round black ink imp shaped like a little cat - a big round head with two ears, one wide glowing
// yellow-green slit for eyes, a small body, stubby arms and feet; smooth and glossy (the render shows a solid figure,
// not a running ink drop, so the shape stays solid - head bigger, shoulders narrower).
{
  const ink = withPattern(R('#5a5468', '#3c3848', '#28262e', '#1a1820', '#0e0c12'), (f, x, y) => (f === 'up' ? -0.5 : 0) + 0.8);
  out.inklet = { render: 'cutout', glow: true, bones: [
    { name: 'body', pivot: [0, 3, 0], cubes: [] },
    ...octo('torso', 'body', [0, 5, 0], 5, 6, 5, 1, ink, 'y'),
    { name: 'head', parent: 'body', pivot: [0, 8, 0], cubes: [B([-3.5, 10.5, -4.2], [7, 2, 0], glowing(R('#f8ffc0', '#e0f080', '#c0d860')), { mask: (f, x, y) => !(y === 0 && (x === 0 || x === 6)) })] },
    ...octo('skull', 'head', [0, 11.5, 0], 8, 10, 8, 2, ink, 'y'),
    rotBox('ear_l', 'head', [-3.5, 16.5, 0], [3, 3, 2], [0, 0, 18], ink), rotBox('ear_r', 'head', [3.5, 16.5, 0], [3, 3, 2], [0, 0, -18], ink),
    { name: 'arm_l', parent: 'body', pivot: [-3, 7, 0], rot: [0, 0, 25], cubes: [B([-5, 4, -1], [2, 3, 2], ink)] },
    { name: 'arm_r', parent: 'body', pivot: [3, 7, 0], rot: [0, 0, -25], cubes: [B([3, 4, -1], [2, 3, 2], ink)] },
    { name: 'leg_l', parent: 'body', pivot: [-1.5, 3, 0], cubes: [B([-3, 0, -2], [3, 3, 3], ink)] },
    { name: 'leg_r', parent: 'body', pivot: [1.5, 3, 0], cubes: [B([0, 0, -2], [3, 3, 3], ink)] },
  ] };
}

// --------------------------------------------------------------------------------------- Wriggler (P1)
// Render: a fat yellow grub-worm - thick behind a round, toothy, gaping mouth, the body tapering back in rings with
// lit ridges and creased folds, bending as it crawls.
{
  const yellow = withPattern(R('#fff0a8', '#f0d478', '#d8b454', '#b8923c', '#94722c'), (f, x, y, w, h) => (f === 'east' || f === 'west' || f === 'up' ? (x % 3 === 0 ? 1.2 : x % 3 === 1 ? -0.5 : 0) : 0));
  const mouth = (x, y, w, h) => { const d = Math.hypot(x - (w - 1) / 2, y - (h - 1) / 2); return d < 1.2 ? '#3a1408' : d < 2 ? ((Math.round(Math.atan2(y - 2, x - 2) * 2) % 2) ? '#fffaf0' : '#5a2010') : null; };
  out.wriggler = { render: 'cutout', bones: [
    { name: 'head', pivot: [0, 2.5, -3], cubes: [] },
    ...octo('front', 'head', [0, 3, -4.5], 4, 6, 6, 1, yellow, 'z'),
    rotBox('maw', 'head', [0, 3, -6.6], [5, 5, 0], [0, 0, 0], R('#e0b860', '#c09040'), { detail: { north: mouth } }),
    { name: 'seg_1', parent: 'head', pivot: [0, 2.5, -2.5], rot: [0, 12, 0], cubes: [B([-2.5, 0, -2.5], [5, 5, 4], yellow)] },
    { name: 'seg_2', parent: 'seg_1', pivot: [0, 2.5, 1.5], rot: [0, 12, 0], cubes: [B([-2, 0, 1.5], [4, 4, 4], yellow)] },
    { name: 'seg_3', parent: 'seg_2', pivot: [0, 2, 5.5], rot: [0, 10, 0], cubes: [B([-1.5, 0, 5.5], [3, 3, 3], yellow), B([-1, 0, 8.5], [2, 2, 2], yellow)] },
  ] };
}

// --------------------------------------------------------------------------------------- Tough Egg (P1)
// Render: a rounded teal egg, wider than tall, bumpy, with darker spots - rounded with bevels, not a block.
{
  const egg = withPattern(R('#b4f4e4', '#88dccc', '#60c2b0', '#44a494', '#30887a'), (f, x, y) => (h2(x >> 1, y >> 1, 17) < 14 ? '#2a7a68' : (x + y) % 7 === 0 ? 1 : 0));
  out.tough_egg = { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 0, 0], cubes: [] },
    ...octo('shell', 'body', [0, 4.5, 0], 9, 10, 9, 3, egg, 'y'),
    rotBox('cap', 'shell', [0, 9.5, 0], [6, 1, 5], [0, 45, 0], egg),
  ] };
}

// --------------------------------------------------------------------------------------- Hatchling (P1)
// Render: a round cream shell like a little beetle's, low to the ground; two big black eyes ringed cyan low on its
// front; short orange legs; two brownish see-through wings angled up and back.
{
  const shell = withPattern(R('#fffdf2', '#f2ead4', '#dccfae', '#c0b08a'), (f, x, y) => (y % 4 === 0 ? 0.6 : 0));
  const eyeD = (x, y, w, h) => { const d = Math.hypot(x - 1, y - 1); return d < 0.8 ? '#08090a' : d < 1.6 ? '#101418' : '#58d8f0'; };
  out.hatchling = { render: 'translucent', bones: [
    { name: 'body', pivot: [0, 4, 0], cubes: [] },
    ...octo('shell', 'body', [0, 5, 0.5], 9, 9, 8, 3, shell, 'z'),
    { name: 'head', parent: 'body', pivot: [0, 4, -4], cubes: [] },
    ...[-1, 1].map(s => rotBox('eye' + s, 'head', [s * 2.2, 3.5, -4.2], [3, 3, 1], [0, 0, 0], R('#101418', '#08090a'), { detail: { north: eyeD } })),
    ...[['wing_l', -1], ['wing_r', 1]].map(([n, s]) => ({ name: n, parent: 'body', pivot: [s * 1.5, 9, -1], rot: [-40, s * 15, s * -10], cubes: [B([s * 1.5 - 1.5, 9, -1], [3, 0, 8], { ramp: ['#e8d4b8', '#c8ac88', '#a88a64'], alpha: 160 }, { mask: leafMask })] })),
    ...[-1, 1].flatMap(s => [0, 1, 2].map(k => ({ name: 'leg_' + (s < 0 ? 'l' : 'r') + k, parent: 'body', pivot: [s * 3.5, 2, -2 + k * 2.5], rot: [0, (1 - k) * 20 * s, s * 30], cubes: [B([s < 0 ? -5.5 : 3.5, 1.5, -2.5 + k * 2.5], [2, 1, 1], R('#f8a860', '#d88038')), B([s < 0 ? -5.5 : 4.5, 0, -2.5 + k * 2.5], [1, 2, 1], R('#f8a860', '#d88038'))] }))),
  ] };
}

// --------------------------------------------------------------------------------------- Parafright (P1)
// Render: a translucent cyan spectre curled into a ring like a coiled fish - a hole through the middle, pale scale
// spots along it, wispy fins flaring off its outer edge; no limbs.
{
  const spirit = withPattern({ ramp: ['#e0ffff', '#a8f0ff', '#70d8f8', '#48b8e8', '#3098d0'], alpha: 160 }, (f, x, y) => (h2(x, y, 7) < 12 ? '#e8fcff' : 0));
  out.parafright = { render: 'translucent', bones: [
    { name: 'body', pivot: [0, 12, 0], cubes: [] },
    ...ring(10, 6, (k, a, cx, cy) => rotBox('coil' + k, 'body', [cx, 12 + cy, 0], [4 + (k < 3 ? 1 : 0), 5, 4 - (k > 6 ? 1 : 0)], [0, 0, Math.round(a * 57.3)], spirit)),
    ...ring(5, 9.5, (k, a, cx, cy) => rotBox('fin' + k, 'body', [cx, 12 + cy, 0], [0, 6, 4], [0, 0, Math.round(a * 57.3)], { ramp: ['#e8ffff', '#b8f4ff'], alpha: 120 }, { mask: (f, x, y, w, h) => y < h - (x % 2) })),
    { name: 'head', parent: 'body', pivot: [6, 12, 0], cubes: [B([5, 11, -2.2], [3, 2, 0], R('#ffffff', '#d0ffff'), { mask: (f, x) => x !== 1 })] },
    { name: 'tent_0', parent: 'body', pivot: [-5, 6, 0], rot: [0, 0, 30], cubes: [B([-6, 0, 0], [3, 6, 0], { ramp: ['#e8ffff', '#b8f4ff'], alpha: 120 }, { mask: leafMask })] },
  ] };
}

module.exports = out;
