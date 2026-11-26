// Glory v2 (2026-11-26) - the creatures and machines repainted and rebuilt after the user's notes: smooth gradients and
// shine, stripes and big soft spots instead of per-pixel noise; cuboid builds instead of octagonal tubes; the Axebot cast
// from netherite scrap. G4: the Owl Magistrate and the Aeonglass. Coordinates as in specs.js (pixels, y up, front -Z).
const { S, pat, glow, all, spots, stripes, shine, plate, folds, eyes, face, mouth, rounded, B, rotBox } = require('./kit2');
const out = {};

const brass = S('#fff0b0', '#f0d278', '#d4aa4c', '#a88032', '#78561e');
const steel = S('#f0f4f8', '#c8d0da', '#9ca6b4', '#727c8a', '#4e5662');
const rod = S('#8a8c96', '#6a6c76', '#4c4e58', '#34363e');
const screenMat = glow(S('#ffd090', '#ffa040', '#e07020'));
const PLAY = ['.O...', '.OO..', '.OOO.', '.OO..', '.O...'];
const playIcon = (x, y) => (PLAY[y] && PLAY[y][x] === 'O' ? '#ffb050' : '#1e1e26');

// --------------------------------------------------------------------------------------- Fabricator
// A brass pod (riveted, a dark hatch at the front, a dark band) on four legs - a dark rod out from the pod, then a big gold
// sickle claw down to the ground; four cable arms with grippers rising from the top; a blue-grey goblin pilot (big ears,
// navy cap, red vest, wide grin) in the open top.
{
  const pod = pat(brass, plate({ rows: 0 }));
  const skin = pat(S('#c4d6e4', '#a2b8ca', '#8298ae', '#647a92'), spots('#7088a0', { cell: 5, r: 1.5, seed: 2, amount: 0.4 }));
  const vest = pat(S('#ec6a54', '#cc4c3a', '#a43628', '#7a2618'), folds(3));
  const cap = S('#5a6c94', '#465676', '#343e58', '#242c40');
  const claw = pat(S('#fff2b0', '#f6d270', '#d8aa48', '#a87c2c'), shine(1.2, 0.25));
  const legs = [['leg_fl', -1, -1], ['leg_fr', 1, -1], ['leg_bl', -1, 1], ['leg_br', 1, 1]].flatMap(([n, sx, sz]) => {
    const px = sx * 6, pz = sz * 6;
    return [
      { name: n, parent: 'body', pivot: [px, 9, pz], rot: [0, sx * sz * -40, 0], cubes: [B([sx < 0 ? px - 9 : px, 8.5, pz - 1], [9, 2, 2], rod)] },
      rotBox(n + '_low', n, [px + sx * 10, 13, pz], [3, 8, 3], [0, 0, sx * -35], claw),
      rotBox(n + '_tip', n + '_low', [px + sx * 13, 10, pz], [3, 9, 2], [0, 0, sx * 10], claw),
      rotBox(n + '_pt', n + '_tip', [px + sx * 13.5, 3, pz], [2, 6, 1], [0, 0, sx * -15], claw),
    ];
  });
  const arms = [[-1, -1], [1, -1], [-1, 1], [1, 1]].flatMap(([sx, sz], i) => {
    const px = sx * 4, pz = sz * 4;
    return [
      { name: 'tent_' + i, parent: 'body', pivot: [px, 16, pz], rot: [sz * -25, 0, sx * -35], cubes: [B([px - 0.5, 16, pz - 0.5], [1, 10, 1], rod)] },
      { name: 'tent_' + i + 'b', parent: 'tent_' + i, pivot: [px, 26, pz], rot: [sz * 20, 0, sx * 55], cubes: [
        B([px - 0.5, 26, pz - 0.5], [1, 9, 1], rod), B([px - 1.5, 35, pz - 1.5], [3, 1, 3], steel),
        ...[[-1.5, -1.5], [1, -1.5], [0, 1]].map(([dx, dz]) => B([px + dx, 36, pz + dz], [1, 3, 1], steel))] },
    ];
  });
  out.fabricator = { render: 'cutout', bones: [
    rounded('body', undefined, [0, 11, 0], [14, 12, 14], 1, pod),
    { name: 'band', parent: 'body', pivot: [0, 10, 0], cubes: [B([-7.5, 9, -7.5], [15, 2, 15], S('#a88032', '#78561e', '#523a12'))] },
    { name: 'hatch', parent: 'body', pivot: [0, 10, -7], cubes: [B([-3, 5, -7.6], [6, 6, 0], S('#4a3a26', '#30261a'), { detail: { north: (x, y, w) => (x === w - 2 && y === 3 ? '#e8c060' : x === 0 || y === 0 ? '#5e4a30' : null) } })] },
    { name: 'pilot', parent: 'body', pivot: [0, 15, 0], cubes: [B([-3.5, 16, -2.5], [7, 5, 5], vest), B([-5, 16, -2], [2, 4, 3], skin), B([3, 16, -2], [2, 4, 3], skin)] },
    { name: 'head', parent: 'pilot', pivot: [0, 21, 0], cubes: [
      B([-3.5, 21, -3.5], [7, 6, 6], skin, { detail: { north: face(eyes({ y: 1, gap: 1, size: 2, iris: '#d8c040', pupil: '#141008' }), mouth(4, 5, { color: '#3a1418', teeth: [1, 3], tooth: '#fff6e0' })) } }),
      B([-1, 22, -4.6], [2, 2, 1], skin),
      B([-4, 26, -4], [8, 2, 7], cap), B([-3.5, 26, -6], [7, 1, 2], cap),
      B([-8, 22, -1], [4, 4, 0], skin, { mask: (f, x, y) => y >= Math.floor(x * 0.7) - 1 }),
      B([4, 22, -1], [4, 4, 0], skin, { mask: (f, x, y, w) => y >= Math.floor((w - 1 - x) * 0.7) - 1 })] },
    ...legs, ...arms,
  ] };
}

// --------------------------------------------------------------------------------------- the four bots
// A ball of painted metal (a cube with each face's middle raised - round without tubes) with an orange "play" screen.
function botBall(mat, y) {
  return [
    rounded('body', undefined, [0, y, 0], [9, 9, 9], 1, mat),
    { name: 'screen', parent: 'body', pivot: [0, y, -4.5], cubes: [B([-2.5, y - 2.5, -4.6], [5, 5, 0], screenMat, { detail: { north: playIcon } })] },
  ];
}
{
  const yellow = pat(S('#fff4a8', '#fbe070', '#ecc448', '#c89c30', '#9a7420'), all(shine(1.1), stripes('#4a3a14', { period: 4, width: 1, faces: ['up'] })));
  const wing = S('#fff0a0', '#f6d466', '#e4b84a', '#c89634');
  out.zapbot = { render: 'cutout', glow: true, bones: [
    ...botBall(yellow, 10),
    { name: 'spike', parent: 'body', pivot: [0, 6, 0], cubes: [B([-1.5, 3, -1.5], [3, 3, 3], steel), B([-0.5, 0, -0.5], [1, 3, 1], glow(S('#e8ffff', '#90f0ff', '#40c8e8')))] },
    { name: 'wing_l', parent: 'body', pivot: [-4.5, 12, 0], rot: [0, 0, 20], cubes: [B([-14.5, 9, 0], [10, 8, 0], wing, { mask: (f, x, y, w, hh) => y <= hh - 1 - (x % 3 === 0 ? 2 : 0) && y >= Math.floor((w - 1 - x) * 0.35) - 1 })] },
    { name: 'wing_r', parent: 'body', pivot: [4.5, 12, 0], rot: [0, 0, -20], cubes: [B([4.5, 9, 0], [10, 8, 0], wing, { mask: (f, x, y, w, hh) => y <= hh - 1 - (x % 3 === 2 ? 2 : 0) && y >= Math.floor(x * 0.35) - 1 })] },
  ] };
}
{
  const red = pat(S('#ffb0a0', '#f07e6a', '#d85a46', '#b03e2e', '#842c20'), shine(1.1));
  out.stabbot = { render: 'cutout', bones: [
    ...botBall(red, 11),
    rotBox('spike_l', 'body', [-8, 12, 0], [7, 3, 3], [0, 0, -18], red), rotBox('spike_l2', 'spike_l', [-12.5, 13.5, 0], [3, 1, 1], [0, 0, -18], steel),
    rotBox('spike_r', 'body', [8, 12, 0], [7, 3, 3], [0, 0, 18], red), rotBox('spike_r2', 'spike_r', [12.5, 13.5, 0], [3, 1, 1], [0, 0, 18], steel),
    { name: 'leg_l', parent: 'body', pivot: [-2, 7, 0], rot: [0, 0, 10], cubes: [B([-3, 0, -0.5], [2, 7, 2], rod), B([-3.5, 0, -2], [3, 1, 4], rod)] },
    { name: 'leg_r', parent: 'body', pivot: [2, 7, 0], rot: [0, 0, -10], cubes: [B([1, 0, -0.5], [2, 7, 2], rod), B([0.5, 0, -2], [3, 1, 4], rod)] },
  ] };
}
{
  const cyan = pat(S('#d0fbff', '#9ee4ec', '#6cc8d4', '#48a6b4', '#347e8a'), shine(1.1));
  const glass = { ...S('#e8feff', '#b8f2fa', '#84dcec'), alpha: 140 };
  out.guardbot = { render: 'translucent', bones: [
    ...botBall(cyan, 10),
    { name: 'wing_l', parent: 'body', pivot: [-5, 10, 0], rot: [0, 25, 0], cubes: [B([-7.5, 3, -5], [0, 14, 10], glass, { mask: (f, x, y, w, hh) => Math.abs(x - (w - 1) / 2) <= (hh - y) * 0.42 })] },
    { name: 'wing_r', parent: 'body', pivot: [5, 10, 0], rot: [0, -25, 0], cubes: [B([7.5, 3, -5], [0, 14, 10], glass, { mask: (f, x, y, w, hh) => Math.abs(x - (w - 1) / 2) <= (hh - y) * 0.42 })] },
  ] };
}
{
  const green = pat(S('#d4ecc8', '#a8c4a0', '#86a480', '#668464', '#4c664c'), shine(1.0));
  const box = S('#8a8e94', '#6c7074', '#54585c', '#3c4044');
  const speaker = pat(box, (f, x, y, w, hh) => (f === 'north' ? (Math.hypot(x - (w - 1) / 2, y - (hh - 1) / 2) < Math.min(w, hh) / 2 - 1 ? (Math.hypot(x - (w - 1) / 2, y - (hh - 1) / 2) < 1.2 ? '#2a2c30' : ((x + y) % 2 ? 0.8 : 1.4)) : -0.5) : 0));
  out.noisebot = { render: 'cutout', bones: [
    ...botBall(green, 8),
    { name: 'leg_l', parent: 'body', pivot: [-6, 4, 0], cubes: [B([-13, 0, -3], [8, 8, 5], speaker)] },
    { name: 'leg_r', parent: 'body', pivot: [6, 4, 0], cubes: [B([5, 0, -3], [8, 8, 5], speaker)] },
    ...[-1, 1].map(s => ({ name: 'tent_' + (s < 0 ? 0 : 1), parent: 'body', pivot: [s * 2, 12, 0], rot: [0, 0, s * 18], cubes: [
      B([s * 2 - 0.5, 12, -0.5], [1, 6, 1], green), B([s * 2 - 2, 18, -2], [4, 2, 4], green),
      B([s * 2 - 1.5, 18.5, -2.1], [3, 1, 0], glow(S('#c0f0ff', '#58c4f0')))] })),
  ] };
}

// --------------------------------------------------------------------------------------- Scroll of Biting
// An unrolled purple parchment between two gold rods with spiked ends, split across the middle into a gaping mouth of
// orange flame-shaped teeth. Faint gold ruled lines on the paper.
{
  const paper = pat(S('#d4c0f4', '#b49ae0', '#9a7ccc', '#7e62b0', '#644c92'), all(stripes('#e8d070', { period: 3, width: 1, amount: 0.35, offset: 1, faces: ['north', 'south'] }), (f, x, y, w) => (x === 0 || x === w - 1 ? 0.8 : 0)));
  const rodMat = pat(S('#fff2b0', '#f4d070', '#d4a444', '#a07428'), shine(1.0, 0.5));
  const fang = S('#fff6c0', '#ffd468', '#f6962e', '#d86a1c');
  const flames = up => (f, x, y, w, hh) => { const k = x % 3, len = k === 1 ? hh : k === 0 ? hh - 2 : hh - 3; return up ? y >= hh - len : y < len; };
  const rodBone = (name, y) => ({ name, parent: 'body', pivot: [0, y, 0], cubes: [
    B([-7, y - 1, -1], [14, 2, 2], rodMat), B([-9, y - 1.5, -1.5], [2, 3, 3], rodMat), B([7, y - 1.5, -1.5], [2, 3, 3], rodMat),
    B([-11, y - 0.5, -0.5], [2, 1, 1], rodMat), B([9, y - 0.5, -0.5], [2, 1, 1], rodMat)] });
  out.scroll_of_biting = { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 4, 0], cubes: [B([-6, 3, -0.5], [12, 5, 1], paper)] },
    rodBone('rod_low', 3),
    { name: 'jaw', parent: 'body', pivot: [0, 8, 0], cubes: [B([-6, 8, -1], [12, 4, 0], fang, { mask: flames(true) })] },
    { name: 'head', parent: 'body', pivot: [0, 13, 0], rot: [-12, 0, 0], cubes: [B([-6, 13, -0.5], [12, 7, 1], paper), B([-6, 10, -1], [12, 4, 0], fang, { mask: flames(false) })] },
    { ...rodBone('rod_high', 20), parent: 'head' },
  ] };
}

// --------------------------------------------------------------------------------------- Axebot
// v2 (user): cast from netherite scrap - dark brown-black metal with a warm sheen, glowing orange seams between the plates;
// a big chest block, an anvil helm sunk between the shoulders with a glowing slit; a double-headed axe for a right arm, a
// heavy fist on the left; short thick legs on grey clawed feet.
{
  const scrap = pat(S('#8a7a74', '#6a5a56', '#4e423f', '#38302e', '#241e1d'), all(plate({ rows: 5, rivet: true }), (f, x, y) => (y % 5 === 4 ? { color: '#ff8a2a', t: 0.85 } : 0)));
  const dark = pat(S('#5c504e', '#443a38', '#2e2826', '#1c1818'), shine(0.8));
  const blade = pat(S('#f0f2f6', '#c8ccd4', '#9ea4ae', '#767c86'), (f, x, y, w) => (x === 0 ? -1.2 : 0));
  const hot = glow(S('#ffe090', '#ffa040', '#e06818'));
  out.axebot = { render: 'cutout', glow: true, bones: [
    { name: 'body', pivot: [0, 17, 0], cubes: [B([-8, 10, -6], [16, 15, 12], scrap), B([-7, 9, -5], [14, 1, 10], dark), B([-6, 25, -5], [12, 2, 10], scrap)] },
    { name: 'head', parent: 'body', pivot: [0, 25, -3], cubes: [B([-5, 24, -9], [10, 4, 8], dark), B([-6.5, 28, -10], [13, 2, 10], dark), B([-1.5, 30, -8], [3, 2, 8], dark),
      B([-3.5, 25.5, -9.1], [7, 1, 0], hot)] },
    { name: 'arm_r', parent: 'body', pivot: [9.5, 21, 0], rot: [-30, 0, 0], cubes: [B([8, 12, -2.5], [5, 11, 5], scrap), B([10, 1, -1], [1, 12, 2], dark),
      B([6.5, 2, -6], [8, 8, 1], blade, { mask: (f, x, y, w, hh) => Math.abs(y - 3.5) <= 1 + Math.abs(x - 3.5) * 0.65 }),
      B([6.5, 2, 4], [8, 8, 1], blade, { mask: (f, x, y, w, hh) => Math.abs(y - 3.5) <= 1 + Math.abs(x - 3.5) * 0.65 })] },
    { name: 'arm_l', parent: 'body', pivot: [-9.5, 21, 0], rot: [-20, 0, 0], cubes: [B([-13, 12, -3], [5, 11, 6], scrap), B([-14, 7, -4], [7, 6, 8], dark), B([-12, 20, -3.1], [3, 2, 0], hot)] },
    { name: 'leg_l', parent: 'body', pivot: [-4, 10, 0], cubes: [B([-7.5, 2, -3.5], [6, 8, 7], scrap), B([-8.5, 0, -6], [8, 2, 9], steel)] },
    { name: 'leg_r', parent: 'body', pivot: [4, 10, 0], cubes: [B([1.5, 2, -3.5], [6, 8, 7], scrap), B([0.5, 0, -6], [8, 2, 9], steel)] },
  ] };
}

// --------------------------------------------------------------------------------------- Soul Nexus
// A great red eye on a twisted purple stalk, framed by spiky purple petals, curling tendrils with leafy tips.
{
  const stalk = pat(S('#c8a8f0', '#a080c8', '#8264ac', '#664c8e', '#4e3872'), all(stripes('#3a2a5a', { period: 4, width: 1, amount: 0.5 }), shine(0.8)));
  const petal = pat(S('#e0c8ff', '#b494e0', '#8a68c0', '#6a4c9c'), shine(0.9, 0.5));
  const eye = (x, y, w, hh) => { const d = Math.hypot(x - (w - 1) / 2, y - (hh - 1) / 2); return d < 0.9 ? '#200608' : d < 1.6 ? '#ff5a64' : d < 2.5 ? '#d8202e' : d < 3.4 ? '#fff0f0' : null; };
  out.soul_nexus = { render: 'cutout', glow: true, bones: [
    { name: 'body', pivot: [0, 0, 0], cubes: [B([-4, 0, -4], [8, 2, 8], stalk), B([-2, 2, -2], [4, 11, 4], stalk), B([-3, 7, -2], [2, 4, 3], stalk), B([1, 4, 0], [2, 4, 3], stalk)] },
    rotBox('stem2', 'body', [0.5, 16, 0], [4, 8, 4], [0, 0, -10], stalk),
    { name: 'head', parent: 'stem2', pivot: [0, 23, 0], cubes: [B([-4, 19, -2.5], [8, 8, 4], glow(S('#ffe8e8', '#f8b0b8', '#e05060')), { detail: { north: eye } })] },
    ...[0, 1, 2, 3, 4, 5].map(k => { const a = k / 6 * Math.PI * 2; return rotBox('petal' + k, 'head', [Math.cos(a) * 5.5, 23 + Math.sin(a) * 5.5, 0.5], [3, 5, 1], [0, 0, Math.round(a * 57.3) - 90], petal); }),
    ...[[-1, 8], [1, 11], [-1, 14], [1, 5]].flatMap(([s, y], i) => [
      rotBox('tent_' + i, 'body', [s * 4.5, y, 0], [6, 2, 2], [0, i * 30, s * 25], stalk),
      rotBox('tent_' + i + 'b', 'tent_' + i, [s * 8.5, y + 2, 0], [4, 2, 1], [0, 0, s * 50], petal)]),
  ] };
}

// --------------------------------------------------------------------------------------- Test Subject (boss, three forms)
// A long four-legged lizard - a big yellow head with a gaping pink mouth of teeth, a pale green body with darker green
// bands across the back and a yellow-green belly, a row of orange spikes down the back and tail; a leather harness with a
// grey device; orange claws. Form 2 grows a second head, form 3 a third.
{
  const skin = pat(S('#e8ffc0', '#c8ec98', '#a8d47a', '#86b85e', '#689a46'), all(stripes('#5e8a3a', { period: 5, width: 2, axis: 'x', amount: 0.55, faces: ['up', 'east', 'west'] }), shine(0.7)));
  const yellow = pat(S('#ffffb8', '#f6f68a', '#e0e060', '#c4c444', '#a0a030'), spots('#c8b030', { cell: 5, r: 1.6, seed: 8, amount: 0.5 }));
  const spike = S('#ffd890', '#ffb050', '#f08a30', '#c86420');
  const mouthD = (x, y, w, hh) => (y >= hh - 3 ? (y === hh - 3 ? (x % 2 ? '#fffaf0' : '#e07888') : '#c85870') : (y === 1 && (x === 1 || x === w - 2)) ? '#141408' : (y === 1 && (x === 2 || x === w - 3)) ? '#f4f4d0' : null);
  const headBone = (name, parent, x, z, rotY) => ({ name, parent, pivot: [x, 11, z], rot: [0, rotY, 0], cubes: [
    B([x - 4, 8, z - 9], [8, 6, 8], yellow, { detail: { north: mouthD } }), B([x - 3.5, 6, z - 8], [7, 2, 7], S('#e07888', '#c85870', '#a84058'))] });
  const spikes = [];
  for (let k = 0; k < 6; k++) spikes.push(B([-0.5, 14, -4 + k * 3], [1, 2, 1], spike));
  out.test_subject = { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 9, 0], cubes: [B([-5, 6, -6], [10, 8, 16], skin), B([-4, 5, -5], [8, 1, 14], S('#f4fcc0', '#e0ec98', '#c4d478')), ...spikes,
      B([-5.5, 6, 0], [11, 8, 2], pat(S('#a8845a', '#8a6a44', '#6c5034'), (f, x, y) => (y === 3 ? 1 : 0))), B([-2.5, 14, -0.5], [5, 2, 3], steel), B([-0.5, 16, 0.5], [1, 3, 1], rod)] },
    headBone('head', 'body', 0, -5, 0),
    headBone('head_2', 'body', -4.5, -4, 20),
    headBone('head_3', 'body', 4.5, -4, -20),
    { name: 'tail', parent: 'body', pivot: [0, 10, 10], rot: [20, 0, 0], cubes: [B([-2.5, 8, 10], [5, 5, 8], skin), ...[0, 1, 2].map(k => B([-0.5, 13, 11 + k * 3], [1, 2, 1], spike))] },
    { name: 'tail_1', parent: 'tail', pivot: [0, 12, 18], rot: [-60, 0, 0], cubes: [B([-1.5, 10, 18], [3, 4, 7], skin), B([-0.5, 14, 20], [1, 2, 1], spike)] },
    ...[['leg_fl', -1, -3], ['leg_fr', 1, -3], ['leg_bl', -1, 7], ['leg_br', 1, 7]].map(([n, s, z]) => ({ name: n, parent: 'body', pivot: [s * 4.5, 8, z], rot: [0, 0, s * -20], cubes: [
      B([s < 0 ? -8 : 4, 2, z - 2], [4, 6, 4], skin), B([s < 0 ? -9 : 4, 0, z - 3], [5, 2, 5], skin), B([s < 0 ? -9 : 4, 0, z - 4], [5, 1, 1], spike)] })),
  ] };
}

// --------------------------------------------------------------------------------------- Torch Head Amalgam
// A grey trunk of twisted roots on four bent legs like a crouching spider; branch arms ending in iron cage lanterns of
// green fire; its head another lantern.
{
  const wood = pat(S('#b4b4a6', '#929284', '#747466', '#58584c', '#40403a'), all(stripes('#4a4a40', { period: 3, width: 1, axis: 'x', amount: 0.5 }), shine(0.6)));
  const iron = S('#5a5a62', '#404048', '#2a2a30');
  const fire = glow(S('#f8ffc8', '#e0fc80', '#a8e040', '#70b020'));
  const lantern = (name, parent, c) => [{ name, parent, pivot: c, cubes: [
    B([c[0] - 2.5, c[1] - 2, c[2] - 2.5], [5, 1, 5], iron), B([c[0] - 2.5, c[1] + 3, c[2] - 2.5], [5, 1, 5], iron),
    B([c[0] - 1.5, c[1] - 1, c[2] - 1.5], [3, 4, 3], fire)] }];
  out.torch_head_amalgam = { render: 'cutout', glow: true, bones: [
    { name: 'body', pivot: [0, 14, 0], cubes: [B([-4.5, 10, -3.5], [9, 12, 7], wood), B([-5.5, 12, -2.5], [11, 5, 5], wood), B([-2.5, 21, -2.5], [5, 3, 5], wood)] },
    ...lantern('head', 'body', [0, 26, 0]),
    ...[['leg_fl', -1, -1], ['leg_fr', 1, -1], ['leg_bl', -1, 1], ['leg_br', 1, 1]].flatMap(([n, sx, sz]) => [
      { name: n, parent: 'body', pivot: [sx * 4, 14, sz * 2], rot: [0, sz * sx * -30, sx * 30], cubes: [B([sx < 0 ? -13 : 4, 13, sz * 2 - 1], [9, 3, 3], wood)] },
      { name: n + '_low', parent: n, pivot: [sx * 12.5, 14, sz * 2], rot: [0, 0, sx * -35], cubes: [B([sx * 12.5 - 1.5, 0, sz * 2 - 1], [3, 14, 3], wood)] }]),
    ...[[-1, 20, 0], [1, 18, -1], [-1, 16, 1]].flatMap(([sx, y, sz], i) => [
      rotBox('tent_' + i, 'body', [sx * 7, y + 2, sz * 2], [8, 3, 3], [0, sz * 20, sx * -30], wood),
      ...lantern('lantern_' + i, 'tent_' + i, [sx * 12, y + 4, sz * 3])]),
  ] };
}

// --------------------------------------------------------------------------------------- Slimed Berserker
// A wide, low mound of teal slime: a smooth gradient from a pale top to a deep base, big soft darker pock-marks, light
// bubbles, a wet shine; thick tendril arms reaching out of it.
{
  const slime = { ...S('#c8fff8', '#90eae4', '#62cec8', '#40aaa8', '#2a8282'), alpha: 215,
    pattern: all(shine(1.0, 0.3), spots('#226a6e', { cell: 8, r: 2.4, seed: 11, amount: 0.65 }), spots('#e8fffc', { cell: 7, r: 0.9, seed: 21, amount: 0.8 })) };
  out.slimed_berserker = { render: 'translucent', bones: [
    { name: 'body', pivot: [0, 6, 0], cubes: [B([-13, 0, -8], [26, 7, 16], slime), B([-10, 7, -6], [20, 5, 12], slime), B([-6, 12, -4], [12, 4, 8], slime)] },
    { name: 'head', parent: 'body', pivot: [0, 15, -3], cubes: [B([-4, 14, -6], [8, 5, 6], slime, { detail: { north: (x, y, w) => (y === 2 && (x === 1 || x === w - 2) ? '#0e3a3c' : y === 3 && x >= 2 && x <= w - 3 ? '#164a4c' : null) } })] },
    ...[[-12, 5, -6, -1], [12, 5, -6, 1], [-10, 9, 4, -1], [10, 9, 4, 1], [0, 13, 4, 0]].flatMap(([x, y, z, s], i) => [
      { name: 'tent_' + i, parent: 'body', pivot: [x, y, z], rot: [z < 0 ? 30 : -20, 0, s * -45], cubes: [B([x - 2, y, z - 2], [4, 8, 4], slime)] },
      { name: 'tent_' + i + 'b', parent: 'tent_' + i, pivot: [x, y + 8, z], rot: [z < 0 ? 30 : -30, 0, s * -30], cubes: [B([x - 1.5, y + 8, z - 1.5], [3, 6, 3], slime)] }]),
  ] };
}

// --------------------------------------------------------------------------------------- the Lost and the Forgotten
// The Lost: a carved wooden mask in the air - an oval of orange-tan wood with darker grain bands, two big round eye holes
// glowing a sickly yellow-green, moss patches, a ring on top.
{
  const wood = pat(S('#ffd49a', '#f0b878', '#dc9a5a', '#c07c42', '#9a5e2e'), all(stripes('#a8683a', { period: 4, width: 1, amount: 0.45 }), spots('#8aa040', { cell: 6, r: 1.6, seed: 13, amount: 0.7 })));
  const eyesL = (x, y, w, hh) => { const e = [[2, 3], [w - 3, 3]].find(([cx, cy]) => Math.hypot(x - cx, y - cy) < 1.7); return e ? (Math.hypot(x - e[0], y - e[1]) < 0.9 ? '#f6ffa0' : '#3a4a1c') : y === hh - 3 && x >= 3 && x <= w - 4 ? '#5a3a1c' : null; };
  out.the_lost = { render: 'cutout', glow: true, bones: [
    { name: 'body', pivot: [0, 10, 0], cubes: [B([-4, 4, -1], [8, 11, 2], wood, { detail: { north: eyesL } }), B([-3, 3, -1], [6, 1, 2], wood), B([-3, 15, -1], [6, 1, 2], wood), B([-1.5, 1, -1], [3, 2, 2], wood)] },
    { name: 'head', parent: 'body', pivot: [0, 16, 0], cubes: [B([-1.5, 16, -0.5], [3, 1, 1], wood), B([-2, 17, -0.5], [1, 2, 1], wood), B([1, 17, -0.5], [1, 2, 1], wood), B([-1.5, 19, -0.5], [3, 1, 1], wood)] },
  ] };
}
// The Forgotten: a grey iron helm-face in the air - two big round goggle eyes with yellow-green rims, a mouth grille,
// rivets, a polished shine.
{
  const iron = pat(S('#f0f2f4', '#c8ccd0', '#a2a6ac', '#7c8086', '#5a5e64'), plate({ rows: 0 }));
  const goggles = (x, y, w, hh) => { for (const cx of [2.5, w - 3.5]) { const d = Math.hypot(x - cx, y - 2.5); if (d < 2.1) return d < 1.2 ? (x < cx && y < 2.5 ? '#f4ffc0' : '#1e2418') : '#b8d060'; } return y === hh - 1 && x >= w / 2 - 2 && x <= w / 2 + 1 && x % 2 === 0 ? '#2a2c30' : null; };
  out.the_forgotten = { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 8, 0], cubes: [B([-5, 5, -4], [10, 6, 8], iron, { detail: { north: goggles } }), B([-4, 11, -3], [8, 2, 6], iron), B([-3, 3, -3], [6, 2, 5], iron)] },
    { name: 'head', parent: 'body', pivot: [0, 13, 0], cubes: [B([-1, 13, -1], [2, 1, 2], iron)] },
  ] };
}

// =========================================================================================== G4
// --------------------------------------------------------------------------------------- Owl Magistrate
// Render: a big rust-brown owl standing upright, big wings held half open with long grey-white flight feathers fanning
// out; huge round golden eyes in a pale facial disc, a hooked dark beak, ear tufts; a white judge's jabot (folded
// neck-cloth) on its chest; barred feathers on the breast; orange talons.
{
  const feather = pat(S('#d88a62', '#b86a46', '#965234', '#743e26', '#542a18'), all(stripes('#5a2e1a', { period: 3, width: 1, amount: 0.45, faces: ['north', 'south'] }), shine(0.6)));
  const breast = pat(S('#f6dcc0', '#e6c0a0', '#cc9e7e', '#a87c5e'), stripes('#8a5a3c', { period: 3, width: 1, amount: 0.6, faces: ['north'] }));
  const disc = S('#fff0dc', '#f0d6b8', '#d8b694', '#b8946e');
  const flight = pat(S('#ffffff', '#e4e6ea', '#c4c8d0', '#9ea2ac'), (f, x, y, w, hh) => (x % 2 === 0 ? 0.6 : -0.3) + (y >= hh - 3 ? 1.0 : 0));
  const jabot = pat(S('#ffffff', '#f2f2f4', '#d8dae0'), (f, x) => (x % 2 ? 0.6 : 0));
  const talon = S('#ffc880', '#f4a050', '#d07c30');
  const owlEyes = (x, y, w) => { for (const cx of [2.5, w - 3.5]) { const d = Math.hypot(x - cx, y - 3); if (d < 2.6) return d < 1.0 ? '#100804' : d < 1.6 ? '#f0a020' : x < cx && y < 3 && d < 2.2 ? '#fff4b0' : '#ffd040'; } return null; };
  out.owl_magistrate = { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 10, 0], cubes: [B([-7, 8, -5], [14, 16, 11], feather), B([-6, 9, -5.6], [12, 13, 1], breast), B([-6, 6, -4], [12, 2, 9], feather)] },
    { name: 'jabot', parent: 'body', pivot: [0, 22, -6], cubes: [B([-2.5, 17, -6.2], [5, 6, 1], jabot, { mask: (f, x, y, w, hh) => y < hh - Math.abs(x - 2) }), B([-3.5, 22, -6], [7, 2, 1], jabot)] },
    { name: 'head', parent: 'body', pivot: [0, 24, -1], cubes: [
      B([-7, 24, -6], [14, 11, 12], feather),
      B([-6, 25, -6.6], [12, 9, 1], disc, { detail: { north: owlEyes } }),
      B([-1, 26, -8], [2, 3, 2], S('#5a4a3a', '#3a2e24', '#241c16')),
      B([-7, 35, -3], [3, 3, 2], feather), B([4, 35, -3], [3, 3, 2], feather)] },
    // the wings: a feathered upper wing on the shoulder, the long pale flight feathers fanning out and down from it
    { name: 'wing_l', parent: 'body', pivot: [-7, 22, 0], rot: [0, 10, 15], cubes: [B([-9, 9, -4], [2, 14, 10], feather), B([-9.5, 2, -3], [1, 12, 12], flight, { mask: (f, x, y, w, hh) => y > (hh - 1) * (x / (w - 1)) * 0.5 })] },
    { name: 'wing_r', parent: 'body', pivot: [7, 22, 0], rot: [0, -10, -15], cubes: [B([7, 9, -4], [2, 14, 10], feather), B([8.5, 2, -3], [1, 12, 12], flight, { mask: (f, x, y, w, hh) => y > (hh - 1) * (x / (w - 1)) * 0.5 })] },
    { name: 'tail', parent: 'body', pivot: [0, 9, 5], rot: [30, 0, 0], cubes: [B([-4, 2, 5], [8, 8, 1], flight)] },
    { name: 'leg_l', parent: 'body', pivot: [-3, 8, 0], cubes: [B([-4.5, 2, -1.5], [3, 6, 3], breast), B([-5, 0, -4], [4, 2, 5], talon)] },
    { name: 'leg_r', parent: 'body', pivot: [3, 8, 0], cubes: [B([1.5, 2, -1.5], [3, 6, 3], breast), B([1, 0, -4], [4, 2, 5], talon)] },
  ] };
}

// --------------------------------------------------------------------------------------- Aeonglass (boss)
// Render: an hourglass held in a great gold ring - teal-green glass bulbs (top and bottom) pinched in the middle, gold
// end plates with engraved bands, a teal orb on top of the ring; sand inside the lower bulb; a shadow ring beneath.
// Floats; the ring turns slowly (bone 'orbit').
{
  const ringGold = pat(S('#fff6c0', '#f8da80', '#e0b452', '#b48630', '#84601c'), all(shine(1.1, 0.4), stripes('#8a6420', { period: 4, width: 1, amount: 0.5, axis: 'x' })));
  const glass = { ...S('#e8fff8', '#b4f4e4', '#7ee0cc', '#4cc0aa', '#2e9882'), alpha: 150, emissive: true, pattern: shine(1.2, 0.3) };
  const sand = glow(S('#fff4c8', '#f4dc96', '#dcbc6c', '#b8964a'));
  const orb = glow(pat(S('#e8fffa', '#9af0dc', '#4ccdb2', '#22a088'), shine(1.2, 0.3)));
  const bones = [
    { name: 'body', pivot: [0, 24, 0], cubes: [
      B([-8, 6, -8], [16, 3, 16], ringGold), B([-8, 41, -8], [16, 3, 16], ringGold),   // the end plates
      ...[[-7, -7], [5, -7], [-7, 5], [5, 5]].map(([x, z]) => B([x, 9, z], [2, 32, 2], ringGold)),   // four posts
    ] },
    // the glass: two bulbs (stacked boxes narrowing to the neck) and the sand
    { name: 'glass', parent: 'body', pivot: [0, 25, 0], cubes: [
      B([-5, 9, -5], [10, 6, 10], glass), B([-4, 15, -4], [8, 4, 8], glass), B([-2, 19, -2], [4, 2, 4], glass),
      B([-1, 21, -1], [2, 3, 2], glass),
      B([-2, 24, -2], [4, 2, 4], glass), B([-4, 26, -4], [8, 4, 8], glass), B([-5, 30, -5], [10, 11, 10], glass)] },
    { name: 'jaw', parent: 'body', pivot: [0, 10, 0], cubes: [B([-4, 9, -4], [8, 4, 8], sand), B([-2.5, 13, -2.5], [5, 2, 5], sand), B([-0.5, 15, -0.5], [1, 8, 1], sand)] },
    { name: 'orbit', parent: 'body', pivot: [0, 25, 0], cubes: [
      B([-15, 23, -1], [2, 4, 2], ringGold), B([13, 23, -1], [2, 4, 2], ringGold),
      B([-13, 37, -1], [26, 2, 2], ringGold), B([-13, 11, -1], [26, 2, 2], ringGold),
      B([-15, 13, -1], [2, 10, 2], ringGold), B([13, 13, -1], [2, 10, 2], ringGold), B([-15, 27, -1], [2, 10, 2], ringGold), B([13, 27, -1], [2, 10, 2], ringGold)] },
    { name: 'head', parent: 'body', pivot: [0, 46, 0], cubes: [B([-1, 44, -1], [2, 2, 2], ringGold), rounded('o', null, [0, 49, 0], [6, 6, 6], 1, orb).cubes].flat() },
  ];
  out.aeonglass = { render: 'translucent', glow: true, bones };
}

module.exports = out;
