// Glory batch G2 (docs/design/glory.md, 2026-11-26): the Queen and her Torch Head Amalgam, the Knight Gang (Flail,
// Spectral, Magi), the Frog Knight, the Devoted Sculptor, the Slimed Berserker, the Lost and the Forgotten. Traced from
// the renders on slaythespire.wiki.gg (StS2_<Name>.png); feature list first, then anatomy per part (docs/MODELING.md).
// Coordinates as in specs.js: pixels, y up, ground 0, front towards -Z.
const { R, withPattern, glowing, B, figure, rotBox, bevelBox } = require('./kit');
const out = {};

const metal = (f, x, y, w, h) => (x === 0 || y === 0 ? -0.8 : x === w - 1 || y === h - 1 ? 0.9 : (x * 3 + y) % 11 === 0 ? -0.5 : 0);
const cloth = (f, x, y) => (x % 3 === 0 ? 0.5 : 0) + (y % 5 === 0 ? 0.3 : 0);
const ragged = (depth, seed = 1) => (f, x, y, w, h) => y < h - (((x * 37 + seed * 11) % 7 + 7) % 7) % (depth + 1);
const bark = (f, x, y) => (x % 3 === 0 ? -0.7 : x % 3 === 1 ? 0.4 : 0) + (y % 7 === 0 ? -0.4 : 0);
const greenFire = glowing(R('#f4ffb0', '#d0f860', '#9ad830', '#68a820'));
const gold = R('#f4d27a', '#d8b050', '#b48c36', '#8a6824');

// --------------------------------------------------------------------------------------- Queen (boss)
// Render: a tall, thin figure in a long dark-purple robe, its hem torn into strips; two pointed collar flaps standing up
// from the shoulders like bat wings; a black hood with no face but two glowing green eyes (and a green glow below them);
// a thin crown of twisted gold spikes rising from the hood; grey-green hands; in her right hand a tall gnarled staff
// with a green crystal at the top; the robe hangs open at the front over a dark inner robe tangled with green roots.
{
  const robe = withPattern(R('#8a6a9c', '#6e5282', '#563f68', '#402e50', '#2e2038'), cloth);
  const inner = withPattern(R('#3a4a34', '#2a3626', '#1c261a'), (f, x, y) => ((x + y * 2) % 7 === 0 ? '#5a8a3a' : 0));
  const skin = R('#9aa888', '#7c8a6c', '#606c52');
  const hood = R('#3a2c44', '#2a2032', '#1a1422');
  const fig = figure({
    thigh: [3, 12, 3], shin: [3, 12, 3], foot: [3, 1, 4], hipW: 4,
    pelvis: [8, 3, 6], waist: [7, 6, 5], chest: [10, 9, 6], upperArm: [3, 10, 3], foreArm: [3, 9, 3], hand: [3, 3, 3],
    neck: [3, 1, 3], head: [7, 8, 7], armOut: 6, armFwd: -10, elbow: -20,
    mats: { skin, legs: inner, shins: inner, feet: hood, pelvis: robe, waist: robe, chest: robe, arms: robe, fore: robe, hands: skin, head: hood },
    face: (x, y, w) => (y === 3 && (x === 1 || x === w - 2) ? '#c8ff60' : y >= 2 && y <= 6 && x >= 1 && x <= w - 2 ? '#0c0810' : null),
    glow: true,
    parts: { body: [
      B([-7, 0, -4], [14, 14, 9], robe, { mask: ragged(3, 2) }),        // the long robe, its hem in strips
      B([-2, 1, -4.6], [4, 13, 1], inner),                               // the dark inner robe at the opening
      B([-6, 36, -4], [2, 3, 8], robe), B([4, 36, -4], [2, 3, 8], robe)] },
  });
  const head = fig.bones.find(b => b.name === 'head');
  head.cubes.push(B([-4, 49, -4], [8, 3, 8], hood), B([-2.5, 45, -3.6], [5, 1, 0], glowing(R('#d8ff70', '#a8e040')), { mask: (f, x) => x === 0 || x === 4 }),
    B([-1.5, 43, -3.6], [3, 1, 0], glowing(R('#a8e040', '#78b020'))));
  fig.bones.push(
    ...[-3, -1, 1, 3].map((x, i) => rotBox('crown_' + i, 'head', [x, 55 + (i % 2), 0], [1, 6 + (i % 2) * 2, 1], [0, 0, x * -5], gold)),
    rotBox('collar_l', 'body', [-6, 42, 0], [2, 9, 6], [0, 0, 20], robe), rotBox('collar_r', 'body', [6, 42, 0], [2, 9, 6], [0, 0, -20], robe),
    { name: 'weapon', parent: 'arm_r_low', pivot: [6.5, 11, 0], rot: [10, 0, 0], cubes: [
      B([6, -2, -0.5], [1, 34, 1], withPattern(R('#d8b878', '#b4945a', '#8a6c40'), (f, x, y) => (y % 4 === 0 ? 0.8 : 0))),
      B([5.5, 31, -1], [2, 1, 2], gold), B([5.5, 32, -1], [2, 4, 2], glowing(R('#e8ffa0', '#b8f050', '#78c028')))] },
  );
  out.queen = fig;
}

// --------------------------------------------------------------------------------------- Torch Head Amalgam
// Render: a grey trunk of twisted roots standing on four long bent legs like a crouching spider; branch arms out of it,
// each ending in an iron cage lantern burning with green fire; its head is one more lantern on top.
{
  const wood = withPattern(R('#8a8a7c', '#6e6e62', '#56564c', '#40403a'), bark);
  const lantern = (name, parent, c) => [{ name, parent, pivot: c, cubes: [
    B([c[0] - 2, c[1] - 2, c[2] - 2], [4, 1, 4], R('#3a3a3e', '#28282c')), B([c[0] - 2, c[1] + 3, c[2] - 2], [4, 1, 4], R('#3a3a3e', '#28282c')),
    B([c[0] - 1.5, c[1] - 1, c[2] - 1.5], [3, 4, 3], greenFire)] }];
  out.torch_head_amalgam = { render: 'cutout', glow: true, bones: [
    { name: 'body', pivot: [0, 14, 0], cubes: [B([-4, 10, -3], [8, 12, 6], wood), B([-5, 12, -2], [10, 5, 4], wood), B([-2, 21, -2], [4, 3, 4], wood)] },
    ...lantern('head', 'body', [0, 26, 0]),
    ...[['leg_fl', -1, -1], ['leg_fr', 1, -1], ['leg_bl', -1, 1], ['leg_br', 1, 1]].flatMap(([n, sx, sz]) => [
      // up and out from the trunk to a high knee, then down to the ground like a crouching spider
      { name: n, parent: 'body', pivot: [sx * 4, 14, sz * 2], rot: [0, sz * sx * -30, sx * 30], cubes: [B([sx < 0 ? -13 : 4, 13, sz * 2 - 1], [9, 2, 2], wood)] },
      { name: n + '_low', parent: n, pivot: [sx * 12.5, 14, sz * 2], rot: [0, 0, sx * -35], cubes: [B([sx * 12.5 - 1, 0, sz * 2 - 1], [2, 14, 2], wood)] }]),
    ...[[-1, 20, 0], [1, 18, -1], [-1, 16, 1]].flatMap(([sx, y, sz], i) => [
      rotBox('tent_' + i, 'body', [sx * 7, y + 2, sz * 2], [8, 2, 2], [0, sz * 20, sx * -30], wood),
      ...lantern('lantern_' + i, 'tent_' + i, [sx * 12, y + 4, sz * 3])]),
  ] };
}

// --------------------------------------------------------------------------------------- the Knight Gang
// Flail Knight: a bulky black-iron knight - spiked round pauldrons, a spiked helm with a yellow-green eye slit, plate
// legs in a wide stance; a flail in each hand: a wooden haft, two chains, two teal-green iron balls.
{
  const iron = withPattern(R('#8a8c96', '#6e7078', '#56585e', '#404248', '#2e3034'), metal);
  const ball = R('#5aa094', '#448276', '#32665c', '#244a44');
  const fig = figure({
    thigh: [5, 8, 5], shin: [5, 8, 5], foot: [6, 2, 7], hipW: 7, legSplay: 12,
    pelvis: [12, 4, 8], waist: [11, 4, 8], chest: [15, 9, 9], upperArm: [5, 8, 5], foreArm: [5, 7, 5], hand: [4, 3, 4],
    neck: [4, 1, 4], head: [8, 8, 8], armOut: 25, armFwd: -15,
    mats: { skin: iron, legs: iron, pelvis: iron, waist: iron, chest: iron, arms: iron, hands: iron, head: iron },
    face: (x, y, w) => (y === 3 && x >= 1 && x <= w - 2 ? '#d8f060' : y === 4 && x >= 2 && x <= w - 3 ? '#202024' : null),
    glow: true,
  });
  const spikes = (parent, c, n) => Array.from({ length: n }, (_, k) => rotBox(parent + '_spike' + k, parent, [c[0] + Math.cos(k * 6.28 / n) * 3.5, c[1] + 2.5, c[2] + Math.sin(k * 6.28 / n) * 3.5], [1, 3, 1], [Math.sin(k * 6.28 / n) * 30, 0, -Math.cos(k * 6.28 / n) * 30], iron));
  const flail = (n, parent, x, y) => ({ name: n, parent, pivot: [x, y, 0], rot: [-30, 0, 0], cubes: [
    B([x - 0.5, y - 2, -0.5], [1, 12, 1], R('#9a6a3a', '#7a522a', '#5a3c1e')),
    B([x - 0.5, y - 9, -2.5], [0, 8, 1], R('#c8ccd4', '#9ca2ac'), { mask: (f, px, py) => py % 2 === 0 }), B([x - 0.5, y - 9, 1.5], [0, 8, 1], R('#c8ccd4', '#9ca2ac'), { mask: (f, px, py) => py % 2 === 0 }),
    B([x - 2, y - 13, -4.5], [4, 4, 4], ball), B([x - 2, y - 13, 0.5], [4, 4, 4], ball)] });
  fig.bones.push(
    ...bevelBox('pauldron_l', 'arm_l', [-11, 28, 0], [7, 6, 7], 2, iron), ...spikes('pauldron_l', [-11, 28, 0], 5),
    ...bevelBox('pauldron_r', 'arm_r', [11, 28, 0], [7, 6, 7], 2, iron), ...spikes('pauldron_r', [11, 28, 0], 5),
    ...spikes('head', [0, 35, 0], 4),
    flail('weapon', 'arm_r_low', 10, 10), flail('weapon_l', 'arm_l_low', -10, 10),
  );
  out.flail_knight = fig;
}
// Spectral Knight: a ghost knight in pale teal, see-through - a hood with one yellow-green eye glowing in the dark, a
// cape, plated arms, a big sword held point-down in the right hand; below the waist only bare white leg bones.
{
  const ghost = { ramp: ['#d8fff4', '#a8f0dc', '#78d8c0', '#54b8a0', '#3a9884'], alpha: 170 };
  const boneW = R('#fffdf2', '#e8e2cc', '#c8c0a8');
  const fig = figure({
    thigh: [2, 9, 2], shin: [2, 9, 2], foot: [3, 1, 4], hipW: 5, legSplay: 6,
    pelvis: [8, 3, 5], waist: [8, 5, 6], chest: [12, 9, 7], upperArm: [4, 8, 4], foreArm: [4, 8, 4], hand: [3, 3, 3],
    neck: [3, 1, 3], head: [7, 8, 7], armOut: 12, armFwd: -10, elbow: -15,
    mats: { skin: ghost, legs: boneW, shins: boneW, feet: boneW, pelvis: boneW, waist: ghost, chest: ghost, arms: ghost, hands: ghost, head: ghost },
    face: (x, y, w) => (y >= 2 && y <= 6 && x >= 1 && x <= w - 2 ? '#0e2a28' : null),
    render: 'translucent', glow: true,
  });
  const head = fig.bones.find(b => b.name === 'head');
  head.cubes.push(B([-0.5, 38, -3.6], [1, 1, 0], glowing(R('#fff8a0', '#e0f060'))), B([-4, 42, -4], [8, 2, 8], ghost));
  fig.bones.push(
    { name: 'cape', parent: 'body', pivot: [0, 30, 3.5], cubes: [B([-7, 12, 3.6], [14, 18, 0], ghost, { mask: ragged(3, 5) }), B([-8, 26, -4], [2, 4, 8], ghost), B([6, 26, -4], [2, 4, 8], ghost)] },
    { name: 'weapon', parent: 'arm_r_low', pivot: [8, 6, 0], rot: [10, 0, 0], cubes: [
      B([7.5, 3, -0.5], [1, 5, 1], R('#4a5a5a', '#2e3a3a')), B([5.5, 2, -1.5], [5, 1, 3], ghost),
      B([7, -18, -0.5], [2, 20, 1], { ramp: ['#e8fffc', '#b8f4ec', '#88e0d4'], alpha: 200, emissive: true })] },
  );
  out.spectral_knight = fig;
}
// Magi Knight: a tall thin figure whose head is a stone rook turret - crenellations on top, a dark window glowing with a
// green rune; a big hooded capelet of torn brown cloth with a gold brooch, a long cloak behind; brown leather under it;
// thin legs in tan boots with pointed toes.
{
  const stone = withPattern(R('#d8c4a4', '#bca684', '#9c8668', '#7a664c'), (f, x, y) => (y % 3 === 0 ? -0.5 : 0) + ((x + Math.floor(y / 3)) % 3 === 0 ? -0.3 : 0));
  const cloak = withPattern(R('#a87a50', '#8a603a', '#6c4a2a', '#50361e'), cloth);
  const leather = R('#8a5e3a', '#6c4628', '#50321c');
  const boot = R('#d8c49a', '#bca47a', '#9c845c');
  const fig = figure({
    thigh: [3, 11, 3], shin: [3, 10, 3], foot: [3, 2, 6], hipW: 5, legSplay: 8,
    pelvis: [7, 3, 5], waist: [6, 5, 4], chest: [8, 7, 5], upperArm: [3, 8, 3], foreArm: [3, 7, 3], hand: [3, 2, 3],
    neck: [2, 1, 2], head: [6, 9, 6], armOut: 6,
    mats: { skin: leather, legs: leather, shins: boot, feet: boot, pelvis: leather, waist: leather, chest: leather, arms: cloak, hands: leather, head: stone },
    face: (x, y, w) => (y >= 2 && y <= 6 && x >= 2 && x <= w - 3 ? (y === 4 && x >= 2 && x <= 3 ? '#c8ff70' : '#141418') : null),
    glow: true,
  });
  const head = fig.bones.find(b => b.name === 'head');
  head.cubes.push(...[[-3, -3], [1, -3], [-3, 1], [1, 1]].map(([x, z]) => B([x, 44, z], [2, 2, 2], stone)), B([-1, 39, -3.1], [2, 3, 0], glowing(R('#d8ff80', '#9ad040'))));
  fig.bones.push(
    { name: 'capelet', parent: 'body', pivot: [0, 33, 0], cubes: [B([-7, 25, -4], [14, 9, 8], cloak, { mask: ragged(4, 3) }), B([-1, 30, -4.6], [2, 2, 1], gold)] },
    { name: 'cape', parent: 'body', pivot: [0, 31, 3], cubes: [B([-7, 4, 4], [14, 27, 0], cloak, { mask: ragged(4, 7) })] },
  );
  out.magi_knight = fig;
}

// --------------------------------------------------------------------------------------- Frog Knight
// Render: a blue-grey warty toad in a steel breastplate and pauldron, big yellow eyes, holding up a three-pronged
// trident, riding a big dark-purple rhinoceros beetle - a shiny purple shell, a great horn curving up from its head,
// six thin black legs.
{
  const shell = withPattern(R('#9a74c0', '#7a58a0', '#5e4080', '#462e62', '#322046'), (f, x, y, w, h) => (x === Math.floor(w / 2) ? -0.8 : (x + y) % 9 === 0 ? 0.9 : 0));
  const legBlack = R('#3a3440', '#28242e', '#18161c');
  const toad = withPattern(R('#9cb4c0', '#7e98a6', '#62808c', '#4a6672'), (f, x, y) => ((x * 7 + y * 3) % 9 === 0 ? -0.8 : 0));
  const steel = withPattern(R('#e0e4ea', '#c0c6ce', '#9aa2ac', '#7a828c'), metal);
  out.frog_knight = { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 6, 0], cubes: [B([-7, 4, -8], [14, 7, 18], shell), B([-6, 11, -6], [12, 2, 14], shell), B([-4, 4, -12], [8, 5, 4], R('#3a2a48', '#2a1e34'))] },
    rotBox('horn', 'body', [0, 9, -15], [3, 3, 7], [-25, 0, 0], shell), rotBox('horn_tip', 'horn', [0, 13, -19], [2, 6, 2], [-15, 0, 0], shell),
    ...[-1, 1].flatMap(s => [0, 1, 2].map(i => ({ name: 'leg_' + (s < 0 ? 'l' : 'r') + i, parent: 'body', pivot: [s * 7, 5, -6 + i * 6], rot: [0, (1 - i) * 25 * s, s * 30], cubes: [
      B([s < 0 ? -15 : 7, 4.5, -6.5 + i * 6], [8, 1, 1], legBlack), B([s < 0 ? -15 : 14, -1, -6.5 + i * 6], [1, 6, 1], legBlack)] }))),
    { name: 'rider', parent: 'body', pivot: [0, 13, 1], cubes: [B([-3.5, 13, -1.5], [7, 7, 5], steel), B([-3, 13, 3], [6, 3, 3], toad), ...[-1, 1].map(s => B([s * 3 - 1, 11, -2], [2, 4, 3], toad))] },
    { name: 'head', parent: 'rider', pivot: [0, 20, 0], cubes: [B([-4, 20, -4], [8, 6, 7], toad), B([-4.5, 25, -4.5], [9, 2, 8], steel),
      B([-4, 22, -4.1], [8, 2, 0], glowing(R('#fff070', '#e0c030')), { mask: (f, x) => x <= 1 || x >= 6 }), B([-3, 20, -4.1], [6, 1, 0], R('#34444c', '#24343a'))] },
    { name: 'arm_r', parent: 'rider', pivot: [4.5, 19, 0], rot: [-15, 0, 0], cubes: [B([3.5, 12, -1], [2, 7, 2], toad), B([4, 4, -0.5], [1, 30, 1], R('#8a8c96', '#6e7078')),
      B([2, 33, -0.5], [5, 1, 1], R('#d8dce2', '#a8aeb8')), ...[2, 4, 6].map(x => B([x - 0.5 + 0.5, 34, -0.5], [1, 4, 1], R('#d8dce2', '#a8aeb8')))] },
    { name: 'arm_l', parent: 'rider', pivot: [-4.5, 19, 0], cubes: [B([-6, 13, -1], [2, 6, 2], toad), B([-6.5, 17, -2], [3, 3, 4], steel)] },
  ] };
}

// --------------------------------------------------------------------------------------- Devoted Sculptor
// Render: a hunched crow-cultist - a pale blue-grey bird-skull mask with a long beak, dark eye holes; a blue hood with a
// shaggy fur collar; a long blue robe torn at the hem; pale grey bird-like hands and feet; a chisel-stone in one hand;
// strapped to its back with ropes, a big pale wooden idol (two rounded lumps), taller than its head.
{
  const robe = withPattern(R('#5a86c0', '#466ea6', '#36588a', '#28446c'), cloth);
  const fur = withPattern(R('#7aa0d4', '#5a82ba', '#42669c'), (f, x, y) => (x % 2 ? 0.5 : -0.4));
  const skin = R('#d4d8e0', '#b4bac4', '#9098a4');
  const mask = R('#e4ecf4', '#c8d4e0', '#a4b4c4', '#8090a4');
  const wood = withPattern(R('#f0dcb4', '#dcc294', '#c4a676', '#a68a5c'), (f, x, y) => (x % 3 === 0 ? -0.5 : 0));
  const fig = figure({
    thigh: [3, 6, 3], shin: [3, 7, 3], foot: [4, 1, 6], hipW: 5,
    pelvis: [8, 3, 6], waist: [8, 6, 6], chest: [10, 7, 7], upperArm: [3, 7, 3], foreArm: [3, 7, 3], hand: [3, 3, 3],
    neck: [3, 1, 3], head: [6, 6, 7], lean: 18, armOut: 8, armFwd: -25,
    mats: { skin, legs: skin, feet: skin, pelvis: robe, waist: robe, chest: robe, arms: robe, hands: skin, head: mask },
    face: (x, y, w) => (y === 2 && (x === 1 || x === w - 2) ? '#141820' : null),
    parts: { body: [B([-5, 2, -4], [10, 12, 8], robe, { mask: ragged(3, 4) })] },
  });
  const head = fig.bones.find(b => b.name === 'head');
  head.cubes.push(B([-1, 29, -10], [2, 2, 6], mask), B([-0.5, 28.5, -12], [1, 1, 2], mask), B([-4, 33, -4], [8, 3, 8], robe), B([-5, 26, -4], [10, 3, 8], fur));
  fig.bones.push(
    { name: 'idol', parent: 'body', pivot: [0, 20, 5], rot: [-10, 0, 0], cubes: [
      ...bevelBox('idol_lo', undefined, [0, 15, 7], [8, 8, 6], 2, wood)[0].cubes,
      ...bevelBox('idol_hi', undefined, [0, 25, 7], [7, 10, 6], 2, wood)[0].cubes,
      B([-5, 18, 3.5], [10, 1, 1], R('#7a5a3a', '#5a4028')), B([-5, 22, 3.5], [10, 1, 1], R('#7a5a3a', '#5a4028'))] },
    { name: 'weapon', parent: 'arm_r_low', pivot: [6.5, 8, 0], cubes: [B([5.5, 5, -2], [3, 3, 3], R('#8a8c94', '#6c6e76', '#505258'))] },
  );
  out.devoted_sculptor = fig;
}

// --------------------------------------------------------------------------------------- Slimed Berserker
// Render: a wide, low mound of teal slime spotted with dark pock holes, several thick tendril arms reaching out of it.
{
  const slime = { ramp: ['#9ae8e4', '#70d0cc', '#52b4b2', '#3c9494', '#2c7474'], alpha: 225,
    pattern: (f, x, y) => (((x * 7 + y * 5) % 17 === 0) ? '#1c4a4c' : (x + y) % 5 === 0 ? 0.6 : 0) };
  out.slimed_berserker = { render: 'translucent', bones: [
    { name: 'body', pivot: [0, 6, 0], cubes: [B([-13, 0, -8], [26, 7, 16], slime), B([-10, 7, -6], [20, 5, 12], slime), B([-6, 12, -4], [12, 4, 8], slime)] },
    { name: 'head', parent: 'body', pivot: [0, 15, -3], cubes: [B([-4, 14, -6], [8, 5, 6], slime)] },
    ...[[-12, 5, -6, -1], [12, 5, -6, 1], [-10, 9, 4, -1], [10, 9, 4, 1], [0, 13, 4, 0]].flatMap(([x, y, z, s], i) => [
      { name: 'tent_' + i, parent: 'body', pivot: [x, y, z], rot: [z < 0 ? 30 : -20, 0, s * -45], cubes: [B([x - 1.5, y, z - 1.5], [3, 8, 3], slime)] },
      { name: 'tent_' + i + 'b', parent: 'tent_' + i, pivot: [x, y + 8, z], rot: [z < 0 ? 30 : -30, 0, s * -30], cubes: [B([x - 1, y + 8, z - 1], [2, 6, 2], slime)] }]),
  ] };
}

// --------------------------------------------------------------------------------------- the Lost and the Forgotten
// The Lost: a carved wooden mask hanging in the air - an oval of orange-tan wood, two big round eye holes glowing a
// sickly yellow-green, green moss in its cracks, a ring on top to hang it by.
{
  const wood = withPattern(R('#f0b878', '#dc9a5a', '#c07c42', '#9a5e2e'), (f, x, y) => (y % 4 === 0 ? -0.5 : (x + y) % 7 === 0 ? '#8aa040' : 0));
  const eyes = (x, y, w, h) => { const e = [[2, 3], [w - 3, 3]].find(([cx, cy]) => Math.hypot(x - cx, y - cy) < 1.6); return e ? (Math.hypot(x - e[0], y - e[1]) < 0.8 ? '#f0ff80' : '#3a4a1c') : y === h - 3 && x >= 3 && x <= w - 4 ? '#5a3a1c' : null; };
  out.the_lost = { render: 'cutout', glow: true, bones: [
    { name: 'body', pivot: [0, 10, 0], cubes: [B([-4, 4, -1], [8, 11, 2], wood, { detail: { north: eyes } }), B([-3, 3, -1], [6, 1, 2], wood), B([-3, 15, -1], [6, 1, 2], wood), B([-1.5, 1, -1], [3, 2, 2], wood)] },
    { name: 'head', parent: 'body', pivot: [0, 16, 0], cubes: [B([-1.5, 16, -0.5], [3, 1, 1], wood), B([-2, 17, -0.5], [1, 2, 1], wood), B([1, 17, -0.5], [1, 2, 1], wood), B([-1.5, 19, -0.5], [3, 1, 1], wood)] },
  ] };
}
// The Forgotten: a grey iron helm-face floating in the air - two big round goggle eyes with yellow-green rims, a small
// mouth grille, rivets; wisps of smoke rise from it.
{
  const iron = withPattern(R('#d4d6d8', '#b0b4b8', '#8e9298', '#6c7076'), metal);
  const goggles = (x, y, w, h) => { for (const cx of [2, w - 3]) { const d = Math.hypot(x - cx, y - 2.5); if (d < 2.6) return d < 1.4 ? '#2a3020' : '#b8d060'; } return y === h - 1 && x >= w / 2 - 1 && x <= w / 2 ? '#2a2c30' : null; };
  out.the_forgotten = { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 8, 0], cubes: [B([-5, 5, -4], [10, 6, 8], iron, { detail: { north: goggles } }), B([-4, 11, -3], [8, 2, 6], iron), B([-3, 3, -3], [6, 2, 5], iron)] },
    { name: 'head', parent: 'body', pivot: [0, 13, 0], cubes: [B([-1, 13, -1], [2, 1, 2], iron)] },
  ] };
}

module.exports = out;
