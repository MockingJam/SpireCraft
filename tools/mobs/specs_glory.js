// Glory batch G1 (docs/design/glory.md, 2026-11-26): the brass machines - the Fabricator and its four bots, the Turret
// Operator and the Living Shield, the Mecha Knight - and the Globe Head and the Scroll of Biting. Each traced from its
// render on slaythespire.wiki.gg (StS2_<Name>.png); feature list first, then anatomy per part (docs/MODELING.md).
// Coordinates as in specs.js: pixels, y up, ground 0, front towards -Z. Bone names are what the generic animation in
// client/mob/SpireMobModel.scripted() moves: body, head, jaw, arm_l/r (+ _low), leg_l/r (+ _low), leg_fl/fr/bl/br,
// wing_l/r, tent_<n>, orbit.
const { R, withPattern, glowing, B, figure, rotBox, bevelBox } = require('./kit');
const out = {};

// ---- shared palettes (sampled from the renders, light -> dark)
const brass = R('#f6dc8c', '#e2c066', '#c8a04a', '#a68036', '#7e5e26');
const brassDark = R('#c8a04a', '#a68036', '#7e5e26', '#5a421a');
const steel = R('#d8dce2', '#b4bac4', '#8e96a2', '#6c7480', '#4e5560');
const rod = R('#6a6c74', '#525460', '#3c3e48', '#2a2c34');
const screen = R('#ffb458', '#f08a2e', '#c8661c');
const metal = (f, x, y, w, h) => (x === 0 || y === 0 ? -0.8 : x === w - 1 || y === h - 1 ? 0.9 : (x * 3 + y) % 11 === 0 ? -0.5 : 0);
const rivets = (f, x, y, w, h) => ((x === 1 || x === w - 2) && (y === 1 || y === h - 2) ? 1.4 : y === Math.floor(h / 2) ? -0.7 : 0);
const plates = step => (f, x, y) => (y % step === 0 ? 1.0 : y % step === step - 1 ? -0.6 : 0);
const ribs = (f, x, y) => (y % 2 === 0 ? 0.9 : -0.6);
/** The bots' front screen: an orange "play" triangle on a dark panel. */
const PLAY = ['.O...', '.OO..', '.OOO.', '.OO..', '.O...'];
const playIcon = (x, y) => (PLAY[y] && PLAY[y][x] === 'O' ? '#f6962e' : '#2a2a30');

// --------------------------------------------------------------------------------------- Fabricator
// Render: a spider-like brass pod (riveted plates, a dark hatch at the front) on four long legs - a thin dark rod out
// and up from the pod, then a big gold sickle claw curving down to the ground; four thin dark cable arms rising from
// the top, each ending in a three-pronged gripper; in the open top sits a blue-grey goblin pilot with big ears, a navy
// cap, a red vest, a wide grinning mouth.
{
  const skin = R('#aac0d0', '#8aa2b6', '#6c849a', '#52687e');
  const vest = R('#d0503e', '#a83a2c', '#802a20');
  const cap = R('#46567a', '#34425e', '#242e44');
  const claw = withPattern(R('#f8e08e', '#e6c264', '#c99c42', '#a27a30'), (f, x, y, w, h) => (x === 0 ? 1 : x === w - 1 ? -0.7 : 0));
  const legs = [['leg_fl', -1, -1], ['leg_fr', 1, -1], ['leg_bl', -1, 1], ['leg_br', 1, 1]].flatMap(([n, sx, sz]) => {
    const px = sx * 6, pz = sz * 6;
    return [
      { name: n, parent: 'body', pivot: [px, 9, pz], rot: [0, sx * sz * -40 + (sz > 0 ? 0 : 0), 0], cubes: [B([sx < 0 ? px - 9 : px, 8.5, pz - 1], [9, 2, 2], rod)] },
      // the sickle: a broad blade rising up and out from the joint, curving over and down to a point on the ground
      rotBox(n + '_low', n, [px + sx * 10, 13, pz], [3, 8, 3], [0, 0, sx * -35], claw),
      rotBox(n + '_tip', n + '_low', [px + sx * 13, 10, pz], [3, 9, 2], [0, 0, sx * 10], claw),
      rotBox(n + '_pt', n + '_tip', [px + sx * 13.5, 3, pz], [2, 6, 1], [0, 0, sx * -15], claw),
    ];
  });
  const arms = [[-1, -1], [1, -1], [-1, 1], [1, 1]].flatMap(([sx, sz], i) => {
    const px = sx * 4, pz = sz * 4;
    return [
      { name: 'tent_' + i, parent: 'body', pivot: [px, 15, pz], rot: [sz * -25, 0, sx * -35], cubes: [B([px - 0.5, 15, pz - 0.5], [1, 10, 1], rod)] },
      { name: 'tent_' + i + 'b', parent: 'tent_' + i, pivot: [px, 25, pz], rot: [sz * 20, 0, sx * 55], cubes: [
        B([px - 0.5, 25, pz - 0.5], [1, 9, 1], rod),
        B([px - 1.5, 34, pz - 1.5], [3, 1, 3], steel),
        ...[[-1.5, -1.5], [1, -1.5], [0, 1]].map(([dx, dz]) => B([px + dx - 0.5 + 0.5, 35, pz + dz], [1, 3, 1], steel))] },
    ];
  });
  out.fabricator = { render: 'cutout', bones: [
    ...bevelBox('body', undefined, [0, 11, 0], [13, 12, 13], 4, withPattern(brass, rivets)),
    { name: 'band', parent: 'body', pivot: [0, 10, 0], cubes: [B([-7, 10, -7], [14, 2, 14], brassDark)] },
    { name: 'hatch', parent: 'body', pivot: [0, 10, -7], cubes: [B([-2.5, 6, -7.6], [5, 6, 0], R('#3a2c1c', '#2a2014'), { detail: { north: (x, y) => (x === 2 && y === 2 ? '#c8a04a' : null) } })] },
    { name: 'pilot', parent: 'body', pivot: [0, 15, 0], cubes: [B([-3, 14, -2], [6, 5, 4], vest), B([-4, 14, -1.5], [2, 3, 3], skin), B([2, 14, -1.5], [2, 3, 3], skin)] },
    { name: 'head', parent: 'pilot', pivot: [0, 19, 0], cubes: [
      B([-3, 19, -3], [6, 5, 5], skin, { detail: { north: (x, y, w, h) => (y === 2 && (x === 1 || x === 4) ? '#ffffff' : y === 2 && (x === 2 || x === 3) ? '#1a1a22' : y === 4 ? (x % 2 ? '#f4f0e0' : '#3a1418') : null) } }),
      B([-1, 20, -4], [2, 2, 1], skin),
      B([-3.5, 23, -3.5], [7, 2, 6], cap), B([-3, 23, -5.5], [6, 1, 2], cap),
      B([-7, 20, -1], [4, 3, 0], skin, { mask: (f, x, y, w, h) => y >= Math.floor(x * 0.6) - 1 }),
      B([3, 20, -1], [4, 3, 0], skin, { mask: (f, x, y, w, h) => y >= Math.floor((w - 1 - x) * 0.6) - 1 })] },
    ...legs, ...arms,
  ] };
}

// --------------------------------------------------------------------------------------- the four bots
// Renders: a ball of painted metal with an orange "play" triangle on a dark screen at the front.
//   Zapbot: yellow, a pair of yellow bat wings, a cyan electrode spike underneath (it floats).
//   Stabbot: red, a long red spike out of each side, two thin legs.
//   Guardbot: cyan, a see-through cyan triangle shield on each side (it floats).
//   Noisebot: green-grey, two big loudspeakers low on its sides (like wheels), two periscope eye-stalks on top.
function botBall(mat, y) {
  return [
    ...bevelBox('body', undefined, [0, y, 0], [8, 8, 8], 2, withPattern(mat, metal)),
    { name: 'screen', parent: 'body', pivot: [0, y, -4], cubes: [B([-2.5, y - 2.5, -4.1], [5, 5, 0], screen, { detail: { north: playIcon } })] },
  ];
}
{
  const yellow = R('#fbe27a', '#f0c84e', '#d6a836', '#b08428');
  const wing = { ramp: ['#f6d466', '#e4b84a', '#c89634'] };
  out.zapbot = { render: 'cutout', glow: true, bones: [
    ...botBall(yellow, 10),
    { name: 'spike', parent: 'body', pivot: [0, 6, 0], cubes: [B([-1, 3, -1], [2, 3, 2], steel), B([-0.5, 0, -0.5], [1, 3, 1], glowing(R('#c8fcff', '#70e8f8', '#30c0e0')))] },
    { name: 'wing_l', parent: 'body', pivot: [-4, 12, 0], rot: [0, 0, 20], cubes: [B([-14, 9, 0], [10, 8, 0], wing, { mask: (f, x, y, w, h) => y <= h - 1 - (x % 3 === 0 ? 2 : 0) && y >= Math.floor((w - 1 - x) * 0.35) - 1 })] },
    { name: 'wing_r', parent: 'body', pivot: [4, 12, 0], rot: [0, 0, -20], cubes: [B([4, 9, 0], [10, 8, 0], wing, { mask: (f, x, y, w, h) => y <= h - 1 - (x % 3 === 2 ? 2 : 0) && y >= Math.floor(x * 0.35) - 1 })] },
  ] };
}
{
  const red = R('#f08a7a', '#d8604e', '#b84436', '#90322a');
  out.stabbot = { render: 'cutout', bones: [
    ...botBall(red, 11),
    rotBox('spike_l', 'body', [-7, 12, 0], [7, 3, 3], [0, 0, -18], red), rotBox('spike_l2', 'spike_l', [-11.5, 13.5, 0], [3, 1, 1], [0, 0, -18], red),
    rotBox('spike_r', 'body', [7, 12, 0], [7, 3, 3], [0, 0, 18], red), rotBox('spike_r2', 'spike_r', [11.5, 13.5, 0], [3, 1, 1], [0, 0, 18], red),
    { name: 'leg_l', parent: 'body', pivot: [-2, 7, 0], rot: [0, 0, 10], cubes: [B([-2.5, 0, -0.5], [1, 7, 1], rod), B([-3, 0, -1.5], [2, 1, 3], rod)] },
    { name: 'leg_r', parent: 'body', pivot: [2, 7, 0], rot: [0, 0, -10], cubes: [B([1.5, 0, -0.5], [1, 7, 1], rod), B([1, 0, -1.5], [2, 1, 3], rod)] },
  ] };
}
{
  const cyan = R('#9ee4ec', '#6cc8d4', '#48a6b4', '#347e8a');
  const glass = { ramp: ['#d8fbff', '#a6eef6', '#74d6e6'], alpha: 140 };
  const tri = (f, x, y, w, h) => y >= Math.abs(x - (w - 1) / 2) * (h / w) * 1.6 - 1;
  out.guardbot = { render: 'translucent', bones: [
    ...botBall(cyan, 10),
    { name: 'wing_l', parent: 'body', pivot: [-5, 10, 0], rot: [0, 25, 0], cubes: [B([-7, 3, -5], [0, 14, 10], glass, { mask: (f, x, y, w, h) => Math.abs(x - (w - 1) / 2) <= (h - y) * 0.42 })] },
    { name: 'wing_r', parent: 'body', pivot: [5, 10, 0], rot: [0, -25, 0], cubes: [B([7, 3, -5], [0, 14, 10], glass, { mask: (f, x, y, w, h) => Math.abs(x - (w - 1) / 2) <= (h - y) * 0.42 })] },
  ] };
  void tri;
}
{
  const green = R('#a8c4a0', '#86a480', '#668464', '#4c664c');
  const speaker = withPattern(R('#6c7074', '#54585c', '#3c4044', '#2a2c30'), (f, x, y, w, h) => (Math.hypot(x - (w - 1) / 2, y - (h - 1) / 2) < Math.min(w, h) / 2 - 1 ? ((x + y) % 2 ? -0.6 : 0.3) : 0.8));
  out.noisebot = { render: 'cutout', bones: [
    ...botBall(green, 8),
    { name: 'leg_l', parent: 'body', pivot: [-6, 4, 0], cubes: [B([-12, 0, -3], [8, 8, 4], R('#6c7074', '#54585c', '#3c4044', '#2a2c30'), { faceMat: { north: speaker } })] },
    { name: 'leg_r', parent: 'body', pivot: [6, 4, 0], cubes: [B([4, 0, -3], [8, 8, 4], R('#6c7074', '#54585c', '#3c4044', '#2a2c30'), { faceMat: { north: speaker } })] },
    ...[-1, 1].map(s => ({ name: 'tent_' + (s < 0 ? 0 : 1), parent: 'body', pivot: [s * 2, 12, 0], rot: [0, 0, s * 18], cubes: [
      B([s * 2 - 0.5, 12, -0.5], [1, 6, 1], green), B([s * 2 - 2, 18, -2], [3, 2, 4], green),
      B([s * 2 - 1.5, 18.5, -2.1], [2, 1, 0], glowing(R('#a0e8ff', '#58c4f0')))] })),
  ] };
}

// --------------------------------------------------------------------------------------- Turret Operator
// Render: a squat blue-grey ogre, half a man's height - a big head on no neck, pointed ears out to the sides, a pig
// snout with two little tusks, small beady eyes under a heavy brow; an olive-tan leather vest; huge arms, short bowed
// legs; he hugs a six-barrelled gun across his belly, a gold ammo drum with a blue cross on its side.
{
  const skin = R('#b4c6d6', '#94a8bc', '#7a8ea2', '#5e7286', '#48596a');
  const vest = withPattern(R('#c8b47a', '#ac965c', '#8c7844'), (f, x, y) => (y % 4 === 0 ? -0.5 : 0));
  const face = (x, y, w, h) => {
    if (y === 2 && (x === 2 || x === w - 3)) return '#101418';
    if (y === 1 && x >= 1 && x <= w - 2) return '#62768a';
    if (y >= 4 && y <= 5 && x >= 3 && x <= w - 4) return y === 4 && (x === 4 || x === w - 5) ? '#3a2a2c' : '#c8a0a8';
    if (y === 6 && (x === 2 || x === w - 3)) return '#f4f0e0';
    if (y === 7 && x >= 2 && x <= w - 3) return '#3a2a2c';
    return null;
  };
  const fig = figure({
    thigh: [4, 3, 4], shin: [4, 3, 4], foot: [5, 2, 6], hipW: 6, legSplay: 12, knee: 10,
    pelvis: [9, 3, 7], waist: [11, 4, 8], chest: [13, 6, 9], upperArm: [5, 6, 5], foreArm: [5, 6, 5], hand: [5, 3, 5],
    neck: [6, 1, 5], head: [10, 9, 9], armOut: 15, armFwd: -40, elbow: -50,
    mats: { skin, legs: skin, pelvis: R('#7a5a3a', '#5e442a'), waist: vest, chest: vest, arms: skin, head: skin },
    face,
    parts: { head: [B([-9, 22, 0], [4, 4, 0], skin, { mask: (f, x, y) => y <= 1 + x * 0.6 }), B([5, 22, 0], [4, 4, 0], skin, { mask: (f, x, y, w) => y <= 1 + (w - 1 - x) * 0.6 }),
      B([-2, 20, -6], [4, 3, 2], R('#c8a0a8', '#a88088'))] },
  });
  fig.bones.push(
    { name: 'gun', parent: 'body', pivot: [0, 10, -4], rot: [0, 18, 0], cubes: [
      ...[[-1.5, 1], [0, 2], [1.5, 1], [-1.5, -1], [0, -2], [1.5, -1]].map(([dx, dy]) => B([dx - 0.5 - 2, 10 + dy - 0.5, -20], [1, 1, 14], steel)),
      B([-5.5, 7, -10], [7, 6, 2], withPattern(brass, rivets)), B([-5, 7.5, -8], [6, 5, 5], R('#8a8e96', '#6c7078', '#50545c'))] },
    ...bevelBox('drum', 'gun', [4, 10, -6], [7, 7, 7], 2, withPattern(R('#fbe27a', '#f0c84e', '#d6a836', '#b08428'), (f, x, y, w, h) => (f === 'east' && (x === y || x === w - 1 - y) ? '#3a64c8' : 0))),
  );
  out.turret_operator = fig;
}

// --------------------------------------------------------------------------------------- Living Shield
// Render: a tall, thin tin man in teal-green plate - a tin-can head with a little domed lid and an aerial, two yellow
// glowing eyes; brown leather straps over the shoulders; thin jointed limbs; he holds up a tower shield taller than
// half of him, curved, of riveted copper-brown planks, arrows stuck in it.
{
  const teal = withPattern(R('#9cc4a8', '#7aa68a', '#5c8a6e', '#466e56', '#34543f'), metal);
  const leather = R('#8a6a48', '#6c5034', '#4e3a26');
  const plank = withPattern(R('#c08a52', '#a0703c', '#80582c', '#5e401e'), (f, x, y, w, h) => (x === 0 || x === w - 1 ? -0.8 : y % 7 === 0 ? 1.0 : 0));
  const fig = figure({
    thigh: [3, 9, 3], shin: [3, 9, 3], foot: [4, 2, 5], hipW: 5, legSplay: 6,
    pelvis: [7, 3, 5], waist: [6, 3, 4], chest: [10, 8, 6], upperArm: [3, 7, 3], foreArm: [3, 7, 3], hand: [3, 3, 3],
    neck: [2, 2, 2], head: [6, 8, 6], armOut: 10, armFwd: -15,
    mats: { skin: teal, legs: teal, pelvis: teal, waist: teal, chest: teal, arms: teal, head: teal },
    
    parts: { head: [B([-2.5, 40, -2.5], [5, 1, 5], teal), B([-0.5, 41, -0.5], [1, 3, 1], rod)],
      body: [B([-5.5, 25, -3.5], [3, 7, 7], leather), B([2.5, 25, -3.5], [3, 7, 7], leather)] },
    glow: true,
  });
  const eyes = fig.bones.find(b => b.name === 'head');
  eyes.cubes.push(B([-2, 36, -3.1], [4, 1, 0], glowing(R('#fff6a0', '#f0d860')), { mask: (f, x) => x === 0 || x === 3 }));
  fig.bones.push({ name: 'shield', parent: 'arm_l_low', pivot: [-7, 14, -4], rot: [0, 10, 0], cubes: [
    B([-9, 2, -9], [1, 26, 4], plank), B([-9, 2, -5], [1, 26, 4], plank), B([-8.5, 2, -12], [1, 26, 3], plank),
    ...[[18, -7], [11, -10], [23, -4]].map(([y, z]) => B([-12, y, z], [4, 1, 1], R('#d8d0c0', '#a89c88'))),
    ...[[18, -7], [11, -10], [23, -4]].map(([y, z]) => B([-13, y - 1, z], [1, 3, 0], R('#c83a2a', '#a02a1e'))),
  ] });
  out.living_shield = fig;
}

// --------------------------------------------------------------------------------------- Mecha Knight
// Render: a tall brass war machine - big round shoulder pauldrons, a barrel chest with a glowing cyan core, segmented
// belly plates, a hip skirt; its head is a green glass jar with a dark lid (something green floats inside); long thin
// grey steel legs with brass knee caps and pointed brass sabatons; grey upper arms, heavy brass forearms; the right
// hand holds a long silver sword, the left is a three-clawed gauntlet (the flamethrower); cyan hoses at the shoulders.
{
  const plate = withPattern(brass, plates(4));
  const fig = figure({
    thigh: [3, 11, 3], shin: [3, 11, 3], foot: [5, 3, 8], hipW: 9, legSplay: 8, knee: 8,
    pelvis: [12, 5, 8], waist: [10, 5, 8], chest: [17, 11, 12], upperArm: [4, 8, 4], foreArm: [6, 9, 6], hand: [5, 4, 5],
    neck: [4, 2, 4], head: [7, 9, 7], armOut: 14, armFwd: -20, elbow: -25,
    mats: { skin: steel, legs: steel, shins: steel, feet: brass, pelvis: plate, waist: withPattern(brassDark, plates(2)), chest: withPattern(brass, rivets),
      arms: steel, fore: plate, hands: brass, head: { ramp: ['#c8ffa0', '#9ef070', '#70d448', '#4ca830'], emissive: true } },
    face: (x, y) => (y === 4 && (x === 2 || x === 4) ? '#2a6a18' : null),
    glow: true,
    parts: {
      body: [B([-3, 33, -6.5], [6, 6, 1], glowing(R('#e8ffff', '#90f0ff', '#40c8e8')), { detail: { north: (x, y, w, h) => (Math.hypot(x - 2.5, y - 2.5) > 2.8 ? '#a68036' : null) } }),
        B([-6, 21, -5], [12, 1, 10], brassDark)],
      head: [B([-4, 52, -4], [8, 2, 8], R('#4a4c54', '#34363c', '#24262a')), B([-4.5, 43, -4.5], [9, 1, 9], R('#4a4c54', '#34363c'))],
      leg_l_low: [B([-7, 10, -3], [5, 4, 5], brass)], leg_r_low: [B([2, 10, -3], [5, 4, 5], brass)],
    },
  });
  // pauldrons, hoses
  fig.bones.push(
    ...bevelBox('pauldron_l', 'arm_l', [-11, 41, 0], [8, 7, 8], 2, withPattern(brass, rivets)),
    ...bevelBox('pauldron_r', 'arm_r', [11, 41, 0], [8, 7, 8], 2, withPattern(brass, rivets)),
    { name: 'hose', parent: 'body', pivot: [0, 40, 5], cubes: [B([-11, 40, 6], [22, 1, 1], R('#6ad8e8', '#40b0c8'))] },
    { name: 'weapon', parent: 'arm_r_low', pivot: [10.5, 21, 0], rot: [60, 0, 0], cubes: [
      B([10, 16, -0.5], [1, 6, 1], leatherGrip()), B([8.5, 22, -1.5], [4, 1, 3], brass),
      B([9.5, 23, -0.5], [2, 26, 1], withPattern(R('#f4f6fa', '#d4d8e0', '#aab0bc', '#8a909c'), (f, x) => (x === 0 ? 1 : -0.4))),
      B([10, 49, -0.5], [1, 2, 1], R('#d4d8e0', '#aab0bc'))] },
    { name: 'claws', parent: 'arm_l_low', pivot: [-11, 6, 0], cubes: [
      ...[-2, 0, 2].map(dz => B([-11, 16, dz - 0.5], [1, 4, 1], brass)), B([-14.5, 24, -1], [2, 5, 2], R('#6ad8e8', '#40b0c8'))] },
  );
  out.mecha_knight = fig;
}
function leatherGrip() { return R('#6a4a30', '#4e3622', '#382618'); }

// --------------------------------------------------------------------------------------- Globe Head
// Render: a tall, hunched figure - its head a plasma globe (a blue glass sphere with lightning inside) on a ribbed grey
// tube neck thrust forward from the shoulders; a beige shirt with long sleeves, a long dark-green apron down to the
// ankles; very long arms hanging past the knees ending in huge ribbed grey gauntlets; black boots.
{
  const shirt = withPattern(R('#e8dcc0', '#d0c2a2', '#b4a484', '#968668'), (f, x, y) => (y % 5 === 0 ? -0.4 : 0));
  const apron = withPattern(R('#5a7a5a', '#46644a', '#344e3a', '#263a2a'), (f, x, y) => (x % 4 === 0 ? -0.5 : 0));
  const glove = withPattern(R('#b8bcc4', '#969aa4', '#767a84', '#5a5e66'), ribs);
  const boot = R('#3a3a3e', '#28282c', '#18181c');
  const plasma = { ramp: ['#d8f4ff', '#8ccaf4', '#4a90d8', '#2a5aa8', '#1a3a78'], emissive: true,
    pattern: (f, x, y, w, h) => ((x * 5 + y * 7) % 23 === 0 ? '#ffffff' : (x + y) % 2 ? 0.4 : 0) };
  const fig = figure({
    thigh: [4, 9, 4], shin: [4, 9, 4], foot: [5, 3, 7], hipW: 5,
    pelvis: [8, 3, 6], waist: [8, 6, 6], chest: [10, 9, 7], upperArm: [3, 10, 3], foreArm: [3, 9, 3], hand: [5, 7, 5],
    neck: [3, 1, 3], head: [1, 1, 1], lean: 22, armOut: 6, armFwd: 12,
    mats: { skin: shirt, legs: apron, shins: apron, feet: boot, pelvis: apron, waist: apron, chest: shirt, arms: shirt, fore: shirt, hands: glove, head: shirt },
    glow: true,
    parts: { body: [B([-5, 3, -4.5], [10, 25, 1], apron)] },
  });
  const head = fig.bones.find(b => b.name === 'head');
  head.rot = [35, 0, 0];
  head.cubes = [
    ...[0, 1, 2, 3].map(i => B([-1.5, 37 + i * 1.5, -1.5 - i * 1.2], [3, 2, 3], withPattern(steel, ribs))),
    B([-2.5, 42, -7], [5, 1, 5], R('#3a3c44', '#26282e')),
  ];
  fig.bones.push(...bevelBox('globe', 'head', [0, 47, -4.5], [9, 9, 9], 2, plasma));
  out.globe_head = fig;
}

// --------------------------------------------------------------------------------------- Scroll of Biting
// Render: an unrolled purple parchment between two gold scroll rods with spiked ends; the paper is split across the
// middle into a gaping mouth lined with orange-yellow flame-shaped teeth. (Orange colouring; it floats.)
{
  const paper = withPattern(R('#b49ae0', '#9a7ccc', '#7e62b0', '#644c92'), (f, x, y, w, h) => (y % 3 === 0 ? -0.4 : 0) + (x === 0 || x === w - 1 ? -0.6 : 0));
  const gold = withPattern(R('#fbe08a', '#ecc25c', '#cc9a3c', '#a07428'), (f, x, y) => (x % 3 === 0 ? 0.8 : 0));
  const fang = { ramp: ['#fff2a8', '#ffcc5a', '#f6962e', '#d86a1c'] };
  const flames = (up) => (f, x, y, w, h) => { const k = x % 3, len = k === 1 ? h : k === 0 ? h - 2 : h - 3; return up ? y >= h - len : y < len; };
  const rodBone = (name, y) => ({ name, parent: 'body', pivot: [0, y, 0], cubes: [
    B([-7, y - 1, -1], [14, 2, 2], gold), B([-9, y - 1.5, -1.5], [2, 3, 3], gold), B([7, y - 1.5, -1.5], [2, 3, 3], gold),
    B([-11, y - 0.5, -0.5], [2, 1, 1], gold), B([9, y - 0.5, -0.5], [2, 1, 1], gold)] });
  out.scroll_of_biting = { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 4, 0], cubes: [B([-6, 3, -0.5], [12, 5, 1], paper)] },
    rodBone('rod_low', 3),
    { name: 'jaw', parent: 'body', pivot: [0, 8, 0], cubes: [B([-6, 8, -1], [12, 4, 0], fang, { mask: flames(true) })] },
    { name: 'head', parent: 'body', pivot: [0, 13, 0], rot: [-12, 0, 0], cubes: [
      B([-6, 13, -0.5], [12, 7, 1], paper), B([-6, 10, -1], [12, 4, 0], fang, { mask: flames(false) })] },
    { ...rodBone('rod_high', 20), parent: 'head' },
  ] };
}

module.exports = out;
