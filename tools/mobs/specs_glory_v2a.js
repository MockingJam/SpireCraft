// Glory v2 (2026-11-26) - the people, rebuilt after the user's notes on G1-G3: nobody leans as a whole; heads are not
// long and the eyes are big enough to read; nobody is a stick - each character its own build (broad chests and narrow
// waists, thick forearms, big hands and boots, a belly where there is one); armour with plates, rims, rivets and shine;
// smooth gradients, folds, stripes and soft spots instead of per-pixel noise; cuboids instead of octagonal tubes.
// Coordinates as in specs.js: pixels, y up, ground 0, front towards -Z. Bone names are the ones the generic animation
// (client/mob/SpireMobModel.scripted) moves.
const { figure } = require('./kit');
const { S, pat, glow, all, spots, stripes, shine, plate, mail, folds, stitched, eyes, face, mouth, rounded, B, rotBox } = require('./kit2');
const out = {};
const bone = (fig, n) => fig.bones.find(b => b.name === n);

// ---- shared metals
const brass = S('#fff0b0', '#f0d278', '#d4aa4c', '#a88032', '#78561e');
const brassPlate = pat(brass, plate({ rows: 4 }));
const steel = S('#f0f4f8', '#c8d0da', '#9ca6b4', '#727c8a', '#4e5662');
const steelPlate = pat(steel, plate({ rows: 0 }));
const darkIron = S('#9aa0aa', '#767c88', '#565c66', '#3c4048', '#26282e');
const gold = S('#fff2b0', '#f2d070', '#d0a240', '#9a7024');
const leather = S('#a8764a', '#8a5c36', '#6c4426', '#4c2e18');

// --------------------------------------------------------------------------------------- Turret Operator
// A squat blue-grey ogre half a man's height: a big wide head straight on the shoulders, pointed ears, a pig snout with
// two tusks, small dark eyes under a heavy brow; a pot belly in a tan leather vest; huge arms hugging a six-barrelled
// gun with a gold ammo drum; short thick bowed legs.
{
  const skin = pat(S('#d0deea', '#b0c2d4', '#94a8bc', '#788ea4', '#5e7288'), spots('#7c92a8', { cell: 7, r: 2.4, seed: 3, amount: 0.5 }));
  const belly = S('#dae6ee', '#c0d0dc', '#a6b8c8', '#8ca0b2');
  const vest = pat(S('#dcc488', '#c4a868', '#a68a4c', '#806834'), all(folds(4), stitched));
  const snout = S('#e4b8c0', '#cc9ca6', '#b07e8a');
  const fig = figure({
    thigh: [5, 3, 5], shin: [5, 3, 5], foot: [7, 2, 8], hipW: 8, legSplay: 10, knee: 8,
    pelvis: [12, 3, 9], waist: [14, 5, 11], chest: [16, 6, 11], upperArm: [6, 6, 6], foreArm: [7, 6, 7], hand: [7, 4, 7],
    neck: [8, 1, 7], head: [13, 9, 11], armOut: 14, armFwd: -40, elbow: -50,
    mats: { skin, legs: skin, feet: S('#6a5a4a', '#504236', '#3a2e24'), pelvis: S('#8a6a46', '#6c5034', '#4e3824'), waist: belly, chest: vest, arms: skin, fore: skin, hands: skin, head: skin },
    face: face(eyes({ y: 3, gap: 5, size: 2, white: '#f0ecd8', iris: '#2a2420', pupil: '#0c0a08', brow: '#5a6e84', browOut: true }),
      mouth(7, 9, { color: '#3a2228', teeth: [0, 8], tooth: '#fff8e8' })),
    parts: { head: [
      B([-10, 21, 0], [4, 5, 0], skin, { mask: (f, x, y) => y <= 1 + x * 0.8 }), B([6, 21, 0], [4, 5, 0], skin, { mask: (f, x, y, w) => y <= 1 + (w - 1 - x) * 0.8 }),
      B([-2.5, 19, -7], [5, 3, 2], snout, { detail: { north: (x, y) => (y === 1 && (x === 1 || x === 3) ? '#5a2a34' : null) } }),
      B([-4, 17, -6.5], [1, 2, 1], S('#fffaf0', '#e8e0cc')), B([3, 17, -6.5], [1, 2, 1], S('#fffaf0', '#e8e0cc')),
      B([-6.5, 26, -5.6], [13, 1, 2], S('#94a8bc', '#788ea4'))] },   // the heavy brow
  });
  const ammo = pat(S('#fff0a0', '#f6d25c', '#dcac38', '#b08424'), all(shine(1.2, 0.3), stripes('#3a64c8', { period: 99, width: 0, faces: [] })));
  fig.bones.push(
    { name: 'gun', parent: 'body', pivot: [0, 10, -5], rot: [0, 18, 0], cubes: [
      ...[[-1.5, 1], [0, 2], [1.5, 1], [-1.5, -1], [0, -2], [1.5, -1]].map(([dx, dy]) => B([dx - 0.5 - 2, 10 + dy - 0.5, -22], [1, 1, 15], steel)),
      B([-5.5, 7, -11], [7, 6, 2], brassPlate), B([-5, 7.5, -9], [6, 5, 5], darkIron), B([-3, 6, -7], [2, 2, 3], darkIron)] },
    { ...rounded('drum', 'gun', [4, 10, -7], [7, 8, 8], 1, pat(ammo, (f, x, y, w, hh) => (f === 'east' && (x === y || x === w - 1 - y) ? '#2e5ab8' : 0))) },
  );
  out.turret_operator = fig;
}

// --------------------------------------------------------------------------------------- Living Shield
// A tin man in teal-green plate: a tin-can head with a domed lid and an aerial, two round yellow glowing eyes; leather
// straps crossing the chest; jointed limbs (dark joints); he holds up a tall curved shield of riveted copper planks with
// arrows stuck in it. Not thin: a barrel chest, solid limbs, big boots.
{
  const teal = pat(S('#c4ecd2', '#9ccaae', '#78a88c', '#588a6e', '#3e6a52'), plate({ rows: 0 }));
  const joint = S('#4a5a52', '#36443e', '#26302c');
  const strap = pat(leather, stitched);
  const plank = pat(S('#e0a868', '#c48a4e', '#a06c38', '#7a5028'), (f, x, y, w, hh) => (x === 0 || x === w - 1 ? 0.9 : y % 8 === 0 ? -0.9 : y % 8 === 1 ? 0.6 : 0));
  const fig = figure({
    thigh: [4, 9, 4], shin: [4, 9, 4], foot: [6, 3, 7], hipW: 6, legSplay: 5,
    pelvis: [10, 3, 6], waist: [9, 4, 6], chest: [13, 9, 8], upperArm: [4, 7, 4], foreArm: [5, 7, 5], hand: [4, 3, 4],
    neck: [3, 2, 3], head: [9, 8, 9], armOut: 10, armFwd: -15,
    mats: { skin: joint, legs: teal, shins: teal, feet: teal, pelvis: joint, waist: teal, chest: teal, arms: teal, fore: teal, hands: joint, head: teal },
    face: eyes({ y: 2, gap: 3, size: 2, white: '#fff6a0', iris: '#f0d040', pupil: '#fff6a0', glint: '#ffffff' }),
    glow: true,
    parts: {
      head: [B([-3.5, 41, -3.5], [7, 1, 7], teal), B([-2, 42, -2], [4, 1, 4], teal), B([-0.5, 43, -0.5], [1, 4, 1], darkIron), B([-1, 47, -1], [2, 1, 2], glow(S('#fff6a0', '#f0d040'))),
        B([-4.5, 36, -4.6], [9, 1, 1], darkIron)],   // the can's rim
      body: [B([-6.5, 23, -4.1], [2, 9, 9], strap), B([4.5, 23, -4.1], [2, 9, 9], strap), B([-2, 26, -4.6], [4, 3, 1], brass)],
    },
  });
  bone(fig, 'head').cubes.push(B([-2.5, 37, -4.6], [5, 2, 0], glow(S('#fffbd0', '#ffe870', '#f0c830')), { mask: (f, x) => x <= 1 || x >= 3 }));
  fig.bones.push({ name: 'shield', parent: 'arm_l_low', pivot: [-8, 14, -4], rot: [0, 10, 0], cubes: [
    B([-11, 1, -10], [2, 28, 5], plank), B([-11, 1, -5], [2, 28, 5], plank), B([-10.5, 1, -14], [2, 28, 4], plank),
    B([-11.5, 6, -14], [1, 1, 14], brass), B([-11.5, 22, -14], [1, 1, 14], brass),
    ...[[18, -7], [11, -10], [24, -4]].map(([y, z]) => B([-15, y, z], [4, 1, 1], S('#e8e0d0', '#b8ac98'))),
    ...[[18, -7], [11, -10], [24, -4]].map(([y, z]) => B([-16, y - 1, z], [1, 3, 0], S('#e04a34', '#a82e20'))),
  ] });
  out.living_shield = fig;
}

// --------------------------------------------------------------------------------------- Mecha Knight
// A tall brass war machine: round riveted shoulder pauldrons, a barrel chest with a glowing cyan core, segmented belly
// plates, a hip skirt; its head a green glass jar with a dark lid (something swims in it); steel legs with brass knee
// caps and pointed sabatons; heavy brass forearms; a long silver sword in the right hand, a three-clawed gauntlet with a
// flame nozzle on the left; cyan hoses at the shoulders.
{
  const core = glow(S('#f0ffff', '#a8f4ff', '#58d0ec', '#2aa0c8'));
  const jar = { ...S('#e0ffc0', '#b4f088', '#86d85c', '#5cb438'), emissive: true, pattern: spots('#3a8a24', { cell: 5, r: 1.8, seed: 9, amount: 0.7 }) };
  const fig = figure({
    thigh: [5, 11, 5], shin: [5, 11, 5], foot: [7, 3, 9], hipW: 10, legSplay: 7, knee: 6,
    pelvis: [14, 5, 9], waist: [12, 5, 9], chest: [19, 11, 13], upperArm: [5, 8, 5], foreArm: [7, 9, 7], hand: [6, 4, 6],
    neck: [5, 2, 5], head: [9, 9, 9], armOut: 14, armFwd: -20, elbow: -25,
    mats: { skin: darkIron, legs: steelPlate, shins: steelPlate, feet: brassPlate, pelvis: brassPlate, waist: pat(S('#e0bc60', '#c09a44', '#9a7630', '#6e521e'), plate({ rows: 2, rivet: false })),
      chest: pat(brass, plate({ rows: 0 })), arms: steelPlate, fore: brassPlate, hands: brass, head: jar },
    face: (x, y) => (y === 4 && (x === 3 || x === 5) ? '#1a4a10' : null),
    glow: true,
    parts: {
      body: [B([-3.5, 33, -7.1], [7, 6, 1], core, { detail: { north: (x, y) => (Math.hypot(x - 3, y - 2.5) > 3.1 ? '#a88032' : null) } }),
        B([-7, 21, -5.5], [14, 1, 11], darkIron), B([-8, 17, -5], [16, 4, 10], pat(brass, stripes('#7a5a20', { period: 3, width: 1, axis: 'x' })))],
      head: [B([-5, 52, -5], [10, 2, 10], darkIron), B([-5.5, 43, -5.5], [11, 1, 11], darkIron), B([-1, 54, -1], [2, 2, 2], darkIron)],
      leg_l_low: [B([-8, 10, -3.5], [6, 4, 6], brass)], leg_r_low: [B([2, 10, -3.5], [6, 4, 6], brass)],
    },
  });
  const pauld = pat(brass, plate({ rows: 0 }));
  fig.bones.push(
    rounded('pauldron_l', 'arm_l', [-12, 41, 0], [9, 7, 9], 1, pauld), rounded('pauldron_r', 'arm_r', [12, 41, 0], [9, 7, 9], 1, pauld),
    { name: 'hose', parent: 'body', pivot: [0, 40, 6], cubes: [B([-12, 40, 6.5], [24, 1, 1], S('#8ae8f4', '#50c0d8', '#2a90a8'))] },
    { name: 'weapon', parent: 'arm_r_low', pivot: [11.5, 21, 0], rot: [60, 0, 0], cubes: [
      B([11, 16, -0.5], [1, 6, 1], leather), B([9, 22, -2], [5, 1, 4], gold),
      B([10, 23, -1], [3, 27, 2], pat(S('#ffffff', '#e4e8f0', '#b8c0cc', '#8a929e'), (f, x, y, w) => (x === 0 ? -0.8 : x === w - 1 ? 0.8 : 0))),
      B([10.5, 50, -0.5], [2, 2, 1], S('#e4e8f0', '#b8c0cc'))] },
    { name: 'claws', parent: 'arm_l_low', pivot: [-11.5, 6, 0], cubes: [
      ...[-2, 0, 2].map(dz => B([-12, 15, dz - 0.5], [1, 4, 1], brass)), B([-15.5, 24, -1.5], [3, 5, 3], S('#8ae8f4', '#50c0d8', '#2a90a8'))] },
  );
  out.mecha_knight = fig;
}

// --------------------------------------------------------------------------------------- Globe Head
// A tall figure (standing straight) whose head is a plasma globe - a blue glass ball with lightning in it - on a ribbed
// grey tube neck; a beige shirt, a long dark-green apron down to the boots; long arms ending in huge ribbed grey
// gauntlets; black boots.
{
  const shirt = pat(S('#f4ead0', '#e0d2b0', '#c4b48e', '#a4946e'), folds(4));
  const apron = pat(S('#7a9a72', '#5e7e5a', '#466446', '#324a34'), all(folds(5), (f, x, y) => (y === 3 ? -0.8 : 0)));
  const glove = pat(S('#d4d8e0', '#b0b6c0', '#8c929e', '#6a707c'), (f, x, y) => (y % 3 === 0 ? 0.9 : y % 3 === 1 ? -0.5 : 0));
  const boot = S('#4a4a50', '#34343a', '#222228');
  const bolt = (x, y, w, hh) => { const zig = Math.round((w - 1) / 2 + Math.sin(y * 1.3 + x * 0.2) * 1.6); return Math.abs(x - zig) === 0 && y > 0 && y < hh - 1 ? '#ffffff' : null; };
  const plasma = { ...S('#c8eaff', '#7cc0f4', '#3e86d6', '#2458aa', '#163a7c'), emissive: true, pattern: all(shine(1.0, 0.35), spots('#a8dcff', { cell: 6, r: 2, seed: 4, amount: 0.5 })) };
  const fig = figure({
    thigh: [5, 9, 5], shin: [5, 9, 5], foot: [6, 3, 8], hipW: 6,
    pelvis: [10, 3, 7], waist: [10, 6, 7], chest: [13, 9, 8], upperArm: [4, 10, 4], foreArm: [5, 9, 5], hand: [7, 7, 7],
    neck: [4, 1, 4], head: [1, 1, 1], armOut: 6, armFwd: 6,
    mats: { skin: shirt, legs: apron, shins: apron, feet: boot, pelvis: apron, waist: apron, chest: shirt, arms: shirt, fore: shirt, hands: glove, head: shirt },
    glow: true,
    parts: { body: [B([-5.5, 3, -4.6], [11, 26, 1], apron), B([-6.6, 28, -4.2], [1, 9, 1], apron), B([5.6, 28, -4.2], [1, 9, 1], apron)] },
  });
  const head = bone(fig, 'head');
  head.cubes = [
    ...[0, 1, 2].map(i => B([-2, 37 + i * 2, -2 - i], [4, 2, 4], pat(steel, (f, x, y) => (y === 0 ? -0.8 : 0.5)))),
    B([-3, 43, -5], [6, 1, 6], darkIron)];
  fig.bones.push({ ...rounded('globe', 'head', [0, 49, -2], [11, 11, 11], 1, plasma) });
  bone(fig, 'globe').cubes.push(B([-3, 46, -7.6], [6, 8, 0], glow(S('#ffffff', '#e0f4ff')), { mask: (f, x, y, w, hh) => !!bolt(x, y, w, hh) }));
  out.globe_head = fig;
}

// --------------------------------------------------------------------------------------- Queen (boss)
// A tall figure in a long dark-purple robe with a gold-trimmed hem torn into strips; two pointed collar flaps standing
// up from the shoulders; a black hood with no face but two glowing green eyes; a crown of twisted gold spikes; grey-green
// hands; a tall gnarled staff with a green crystal. Stately, not thin: wide shoulders and a full robe.
{
  const robe = pat(S('#a888c0', '#86689e', '#664c80', '#4a3462', '#322244'), all(folds(4), stripes('#e8c25c', { period: 99, width: 0 })));
  const hem = pat(robe, (f, x, y, w, hh) => (y >= hh - 6 && y < hh - 4 ? { color: '#e8c25c', t: 0.9 } : 0));
  const inner = pat(S('#4a5c42', '#36462e', '#263220'), spots('#7ab048', { cell: 5, r: 1.4, seed: 5, amount: 0.8 }));
  const skin = S('#b8c8a4', '#98a888', '#7a8a6c', '#5e6c52');
  const hood = S('#4a3a56', '#342840', '#221a2c', '#140e1a');
  const fig = figure({
    thigh: [4, 12, 4], shin: [4, 12, 4], foot: [4, 2, 5], hipW: 5,
    pelvis: [11, 3, 8], waist: [10, 6, 7], chest: [15, 9, 9], upperArm: [4, 10, 4], foreArm: [5, 9, 5], hand: [4, 4, 4],
    neck: [4, 1, 4], head: [9, 8, 9], armOut: 6, armFwd: -10, elbow: -20,
    mats: { skin, legs: inner, shins: inner, feet: hood, pelvis: robe, waist: robe, chest: robe, arms: robe, fore: robe, hands: skin, head: hood },
    face: (x, y, w) => {
      if (y >= 3 && y <= 4 && (x === 2 || x === 3 || x === w - 3 || x === w - 4)) return y === 3 && (x === 2 || x === w - 4) ? '#f4ffb0' : '#b8f050';
      if (y >= 1 && y <= 7 && x >= 1 && x <= w - 2) return '#0a060c';
      return null;
    },
    glow: true,
    parts: { body: [
      B([-8, 0, -5], [16, 24, 11], hem, { mask: (f, x, y, w, hh) => y < hh - (((x * 37 + 3) % 7 + 7) % 7) % 4 }),
      B([-2.5, 1, -5.6], [5, 23, 1], inner),
      B([-7, 37, -5], [3, 4, 10], robe), B([4, 37, -5], [3, 4, 10], robe)] },
  });
  bone(fig, 'head').cubes.push(B([-5, 49, -5], [10, 3, 10], hood), B([-5.5, 41, -5], [1, 8, 10], hood), B([4.5, 41, -5], [1, 8, 10], hood));
  fig.bones.push(
    ...[-3.5, -1.2, 1.2, 3.5].map((x, i) => rotBox('crown_' + i, 'head', [x, 54 + (i % 2), -1], [1, 6 + (i % 2) * 3, 1], [0, 0, x * -5], gold)),
    { name: 'crown_band', parent: 'head', pivot: [0, 52, 0], cubes: [B([-4.5, 52, -4.5], [9, 1, 9], gold)] },
    rotBox('collar_l', 'body', [-7.5, 43, 0], [2, 10, 8], [0, 0, 20], robe), rotBox('collar_r', 'body', [7.5, 43, 0], [2, 10, 8], [0, 0, -20], robe),
    { name: 'weapon', parent: 'arm_r_low', pivot: [7.5, 11, 0], rot: [10, 0, 0], cubes: [
      B([7, -4, -0.5], [1, 36, 1], pat(S('#e8cc90', '#c4a46a', '#9a7c48'), (f, x, y) => (y % 5 === 0 ? 0.9 : 0))),
      B([6, 31, -1.5], [3, 1, 3], gold), B([6, 32, -1.5], [3, 5, 3], glow(S('#f0ffc0', '#c8f470', '#88cc30')))] },
  );
  out.queen = fig;
}

// --------------------------------------------------------------------------------------- the Knight Gang
// Flail Knight: a bulky black-iron knight - spiked round pauldrons, a great helm with a yellow-green eye slit and
// breathing holes, layered plate with rims and rivets; a wide stance; a flail in each hand (wooden haft, chains, teal
// spiked iron balls).
{
  const iron = pat(S('#b4b8c2', '#8e939e', '#6c7078', '#4e5258', '#34363c'), plate({ rows: 4 }));
  const helm = pat(S('#b4b8c2', '#8e939e', '#6c7078', '#4e5258', '#34363c'), plate({ rows: 0, rivet: false }));
  const ball = pat(S('#8ad0c2', '#62ae9e', '#468c7c', '#2e6a5c'), shine(1.0));
  const fig = figure({
    thigh: [6, 8, 6], shin: [6, 8, 6], foot: [7, 2, 9], hipW: 8, legSplay: 10,
    pelvis: [14, 4, 10], waist: [12, 4, 9], chest: [18, 10, 11], upperArm: [6, 8, 6], foreArm: [6, 7, 6], hand: [5, 4, 5],
    neck: [5, 1, 5], head: [10, 9, 10], armOut: 25, armFwd: -15,
    mats: { skin: darkIron, legs: iron, pelvis: pat(darkIron, mail), waist: pat(darkIron, mail), chest: iron, arms: iron, hands: darkIron, head: helm },
    face: (x, y, w) => (y === 3 && x >= 2 && x <= w - 3 ? (x === 3 || x === w - 4 ? '#f4ffa0' : '#c8e050') : y === 4 && x >= 3 && x <= w - 4 ? '#1a1a1e' : y >= 6 && y <= 7 && x >= 3 && x <= w - 4 && x % 2 === 1 ? '#202024' : null),
    glow: true,
  });
  const spikes = (parent, c, n, r = 4) => Array.from({ length: n }, (_, k) => rotBox(parent + '_spike' + k, parent, [c[0] + Math.cos(k * 6.28 / n) * r, c[1] + 3, c[2] + Math.sin(k * 6.28 / n) * r], [1, 3, 1], [Math.sin(k * 6.28 / n) * 30, 0, -Math.cos(k * 6.28 / n) * 30], darkIron));
  const flail = (n, parent, x, y) => ({ name: n, parent, pivot: [x, y, 0], rot: [-30, 0, 0], cubes: [
    B([x - 0.5, y - 2, -0.5], [1, 12, 1], S('#b47c46', '#8e5e32', '#683e1e')),
    B([x - 0.5, y - 9, -2.5], [0, 8, 1], S('#e0e4ea', '#a8aeb8'), { mask: (f, px, py) => py % 2 === 0 }), B([x - 0.5, y - 9, 1.5], [0, 8, 1], S('#e0e4ea', '#a8aeb8'), { mask: (f, px, py) => py % 2 === 0 }),
    B([x - 2.5, y - 14, -5], [5, 5, 5], ball), B([x - 2.5, y - 14, 0.5], [5, 5, 5], ball)] });
  fig.bones.push(
    rounded('pauldron_l', 'arm_l', [-12, 28, 0], [9, 6, 9], 1, helm), ...spikes('pauldron_l', [-12, 28, 0], 5),
    rounded('pauldron_r', 'arm_r', [12, 28, 0], [9, 6, 9], 1, helm), ...spikes('pauldron_r', [12, 28, 0], 5),
    ...spikes('head', [0, 35, 0], 4, 3),
    flail('weapon', 'arm_r_low', 11, 10), flail('weapon_l', 'arm_l_low', -11, 10),
  );
  out.flail_knight = fig;
}
// Spectral Knight: a ghost knight in pale teal, see-through - a hood with one glowing eye in the dark, a ragged cape,
// plated shoulders and arms, a big glowing sword point-down; below the waist only white leg bones.
{
  const ghost = { ...S('#e4fff8', '#b4f4e2', '#84dcc6', '#5cbca4', '#3e9a86'), alpha: 170, pattern: all(folds(5), shine(0.8)) };
  const boneW = pat(S('#fffef6', '#ece6d0', '#cec6ac', '#aaa286'), (f, x, y, w, hh) => (y === 0 || y === hh - 1 ? -0.8 : 0));
  const fig = figure({
    thigh: [3, 9, 3], shin: [3, 9, 3], foot: [4, 1, 5], hipW: 5, legSplay: 6,
    pelvis: [9, 3, 6], waist: [10, 5, 7], chest: [15, 10, 9], upperArm: [5, 8, 5], foreArm: [5, 8, 5], hand: [4, 3, 4],
    neck: [3, 1, 3], head: [9, 8, 9], armOut: 12, armFwd: -10, elbow: -15,
    mats: { skin: ghost, legs: boneW, shins: boneW, feet: boneW, pelvis: boneW, waist: ghost, chest: ghost, arms: ghost, hands: ghost, head: ghost },
    face: (x, y, w) => (y >= 1 && y <= 7 && x >= 1 && x <= w - 2 ? '#0c2624' : null),
    render: 'translucent', glow: true,
  });
  bone(fig, 'head').cubes.push(B([-1, 37, -4.6], [2, 2, 0], glow(S('#fffcc0', '#f0f070'))), B([-5, 42, -5], [10, 2, 10], ghost));
  fig.bones.push(
    rounded('pauldron_l', 'arm_l', [-10, 30, 0], [7, 5, 7], 1, ghost), rounded('pauldron_r', 'arm_r', [10, 30, 0], [7, 5, 7], 1, ghost),
    { name: 'cape', parent: 'body', pivot: [0, 30, 4.5], cubes: [B([-8, 11, 4.6], [16, 19, 0], ghost, { mask: (f, x, y, w, hh) => y < hh - (((x * 37 + 55) % 7 + 7) % 7) % 4 })] },
    { name: 'weapon', parent: 'arm_r_low', pivot: [9, 6, 0], rot: [10, 0, 0], cubes: [
      B([8.5, 3, -0.5], [1, 5, 1], S('#5a6a6a', '#3a4646')), B([6, 2, -1.5], [6, 1, 3], ghost),
      B([7.5, -20, -0.5], [3, 22, 1], { ...S('#f0fffc', '#c4f8f0', '#94e6da'), alpha: 210, emissive: true })] },
  );
  out.spectral_knight = fig;
}
// Magi Knight: a figure whose head is a stone rook turret - square, crenellated, a dark window with a glowing green
// rune; a big hooded capelet of torn brown cloth with a gold brooch, a long cloak; brown leather; tan boots with
// pointed toes.
{
  const stone = pat(S('#ecdcbc', '#d0bc98', '#b09a78', '#8c785a'), (f, x, y) => (y % 3 === 2 ? 0.8 : 0) + ((x + (Math.floor(y / 3) % 2) * 2) % 4 === 0 && y % 3 !== 2 ? 0.5 : 0));
  const cloak = pat(S('#c8986a', '#a87a50', '#8a603a', '#6c4a2a', '#4e341c'), folds(4));
  const boot = pat(S('#ecd8aa', '#d4bc8a', '#b49c6a', '#8e784c'), stitched);
  const fig = figure({
    thigh: [4, 10, 4], shin: [4, 10, 4], foot: [5, 2, 8], hipW: 6, legSplay: 6,
    pelvis: [10, 3, 7], waist: [9, 5, 6], chest: [12, 8, 7], upperArm: [4, 8, 4], foreArm: [5, 7, 5], hand: [4, 3, 4],
    neck: [3, 1, 3], head: [9, 8, 9], armOut: 6,
    mats: { skin: leather, legs: pat(leather, stitched), shins: boot, feet: boot, pelvis: leather, waist: leather, chest: pat(leather, stitched), arms: cloak, fore: cloak, hands: leather, head: stone },
    face: (x, y, w) => (y >= 2 && y <= 6 && x >= 2 && x <= w - 3 ? ((x === 4 && y >= 3 && y <= 5) || (y === 4 && x >= 3 && x <= 5) ? '#d8ff80' : '#121216') : null),
    glow: true,
  });
  bone(fig, 'head').cubes.push(...[[-4.5, -4.5], [1.5, -4.5], [-4.5, 1.5], [1.5, 1.5]].map(([x, z]) => B([x, 42, z], [3, 2, 3], stone)), B([-5, 41, -5], [10, 1, 10], stone),
    B([-1, 37, -4.6], [2, 2, 0], glow(S('#e8ffa0', '#b0e050'))));
  fig.bones.push(
    { name: 'capelet', parent: 'body', pivot: [0, 33, 0], cubes: [B([-8, 24, -5], [16, 10, 10], cloak, { mask: (f, x, y, w, hh) => y < hh - (((x * 37 + 33) % 7 + 7) % 7) % 5 }), B([-1.5, 30, -5.6], [3, 3, 1], gold)] },
    { name: 'cape', parent: 'body', pivot: [0, 31, 4], cubes: [B([-8, 3, 5], [16, 28, 0], cloak, { mask: (f, x, y, w, hh) => y < hh - (((x * 37 + 77) % 7 + 7) % 7) % 5 })] },
  );
  out.magi_knight = fig;
}

// --------------------------------------------------------------------------------------- Devoted Sculptor
// A crow cultist standing straight, round-shouldered: a pale blue-grey bird-skull mask with a long beak and big dark
// eye holes; a blue hood with a shaggy fur collar; a long blue robe torn at the hem with a darker band; pale grey
// bird-like hands and feet; a chisel-stone in one hand; strapped to its back, a big pale wooden idol taller than its head.
{
  const robe = pat(S('#78a4dc', '#5a86c0', '#466ea6', '#36588a', '#28446c'), all(folds(4), stripes('#24385a', { period: 99, width: 0 })));
  const fur = pat(S('#a4c4ec', '#7aa0d4', '#5a82ba', '#42669c'), (f, x) => (x % 2 ? 0.6 : -0.5));
  const skin = S('#e6eaf0', '#c8ced8', '#a4acb8', '#808896');
  const mask = pat(S('#f8fbff', '#e0e8f2', '#c0ccda', '#9caabc'), shine(0.8, 0.4));
  const wood = pat(S('#fff0cc', '#ecd4a6', '#d4b684', '#b49460'), (f, x) => (x % 3 === 0 ? 0.6 : 0));
  const fig = figure({
    thigh: [4, 6, 4], shin: [4, 7, 4], foot: [6, 2, 7], hipW: 6,
    pelvis: [10, 3, 7], waist: [11, 6, 8], chest: [13, 8, 9], upperArm: [4, 7, 4], foreArm: [5, 7, 5], hand: [5, 4, 5],
    neck: [4, 1, 4], head: [8, 7, 8], armOut: 8, armFwd: -25, headFwd: -1,
    mats: { skin, legs: skin, feet: skin, pelvis: robe, waist: robe, chest: robe, arms: robe, fore: robe, hands: skin, head: mask },
    face: face(eyes({ y: 2, gap: 2, size: 3, white: '#0e1218', iris: '#1c2430', pupil: '#5a7ab0', glint: '#a8c8f0' })),
    parts: { body: [B([-6, 1, -5], [12, 13, 10], robe, { mask: (f, x, y, w, hh) => y < hh - (((x * 37 + 4) % 7 + 7) % 7) % 4 }),
      B([-6.5, 27, 1], [13, 6, 5], robe)] },   // round shoulders (a hump, not a lean)
  });
  bone(fig, 'head').cubes.push(B([-1.5, 29, -11], [3, 3, 7], mask), B([-1, 28, -13], [2, 2, 2], mask), B([-0.5, 27.5, -14], [1, 1, 1], mask),
    B([-5, 34, -5], [10, 3, 10], robe), B([-5.5, 31, -5], [1, 3, 10], robe), B([4.5, 31, -5], [1, 3, 10], robe), B([-7, 25, -5], [14, 3, 10], fur));
  fig.bones.push(
    { name: 'idol', parent: 'body', pivot: [0, 20, 6], rot: [-6, 0, 0], cubes: [
      B([-4, 11, 5], [8, 9, 7], wood), B([-3.5, 20, 5.5], [7, 11, 6], wood), B([-2.5, 31, 6], [5, 3, 5], wood),
      B([-6, 17, 4], [12, 1, 1], leather), B([-6, 24, 4], [12, 1, 1], leather)] },
    { name: 'weapon', parent: 'arm_r_low', pivot: [7.5, 8, 0], cubes: [B([6, 4, -2], [3, 3, 4], S('#a4a8b0', '#82868e', '#62666e'))] },
  );
  out.devoted_sculptor = fig;
}

// --------------------------------------------------------------------------------------- Frog Knight and Frog Trainer
// The toad: blue-grey with soft darker blotches and a pale belly, a wide flat head with big golden eyes sitting on top,
// a wide mouth line; steel breastplate and pauldron, a trident.
const toadSkin = pat(S('#c4dce4', '#a0bcc8', '#82a0ae', '#668694', '#4c6a78'), spots('#4e6a74', { cell: 6, r: 2.0, seed: 7, amount: 0.55 }));
const toadBelly = S('#eef4e4', '#d8e4cc', '#bccca8');
const toadEyes = (x, y, w) => { for (const cx of [1.5, w - 2.5]) { const d = Math.hypot(x - cx, y - 1.5); if (d < 1.9) return d < 0.8 ? '#1a1408' : x < cx && y < 1.5 ? '#fffbd0' : '#f0c838'; } return null; };
const breast = pat(S('#f4f6fa', '#d0d6de', '#a8b0bc', '#808894'), plate({ rows: 3 }));
const trident = [B([4, 4, -0.5], [1, 30, 1], S('#a0a4ac', '#80848e', '#60646e')), B([2, 33, -0.5], [5, 1, 1], S('#f0f4f8', '#c0c6d0')),
  ...[2, 4, 6].map(x => B([x, 34, -0.5], [1, x === 4 ? 5 : 4, 1], S('#f0f4f8', '#c0c6d0')))];
// The Rhino Beetle (the knight's mount, and its own creature now): a domed dark-purple shell with a pale seam down the
// middle and a lilac shine, a great horn curving up from the head and a small one above it, mandibles, six black legs.
const shell = pat(S('#c8a4ec', '#9a74c4', '#76549e', '#583c7c', '#3c285a'), all(shine(1.3, 0.35), (f, x, y, w) => (f === 'up' && Math.abs(x - (w - 1) / 2) < 0.6 ? -1.2 : 0)));
const chitin = S('#6a5a78', '#4a3e56', '#32283c', '#201a28');
function beetleBones(y0 = 0) {
  return [
    { name: 'body', pivot: [0, 6 + y0, 0], cubes: [B([-7, 4 + y0, -7], [14, 7, 17], shell), B([-6, 11 + y0, -5], [12, 2, 14], shell), B([-5, 2 + y0, -6], [10, 3, 15], chitin)] },
    { name: 'head', parent: 'body', pivot: [0, 7 + y0, -8], cubes: [B([-4.5, 3 + y0, -13], [9, 6, 6], chitin, { detail: { north: (x, y, w) => ((x === 1 || x === w - 2) && y === 2 ? '#e0c8ff' : null) } }),
      B([-4, 2 + y0, -15], [2, 2, 3], chitin), B([2, 2 + y0, -15], [2, 2, 3], chitin)] },
    rotBox('horn', 'head', [0, 9 + y0, -14], [3, 3, 7], [-30, 0, 0], shell), rotBox('horn_tip', 'horn', [0, 14 + y0, -17], [2, 6, 2], [-12, 0, 0], shell),
    rotBox('horn_small', 'head', [0, 9 + y0, -10], [2, 4, 2], [20, 0, 0], shell),
    ...[-1, 1].flatMap(s => [0, 1, 2].map(i => ({ name: 'leg_' + (s < 0 ? 'l' : 'r') + i, parent: 'body', pivot: [s * 6.5, 5 + y0, -5 + i * 6], rot: [0, (1 - i) * 25 * s, s * 30], cubes: [
      B([s < 0 ? -15.5 : 6.5, 4.5 + y0, -5.5 + i * 6], [9, 2, 2], chitin), B([s < 0 ? -15.5 : 13.5, -1 + y0, -5.5 + i * 6], [2, 6, 2], chitin)] }))),
  ];
}
{
  const bones = beetleBones(0);
  bones.push(
    { name: 'rider', parent: 'body', pivot: [0, 13, 1], cubes: [B([-4.5, 13, -2.5], [9, 7, 6], breast), B([-4, 13, 3], [8, 4, 3], toadSkin), ...[-1, 1].map(s => B([s * 4 - 1.5, 11, -3], [3, 4, 4], toadSkin))] },
    { name: 'rider_head', parent: 'rider', pivot: [0, 20, 0], cubes: [B([-5, 20, -5], [10, 5, 8], toadSkin, { detail: { north: (x, y, w) => (y === 3 ? '#2e3e46' : null) } }),
      B([-5.5, 25, -1], [11, 1, 4], breast), B([-5, 23, -5.6], [4, 4, 1], toadSkin, { detail: { north: toadEyes } }), B([1, 23, -5.6], [4, 4, 1], toadSkin, { detail: { north: toadEyes } }),
      B([-4.5, 25, -5], [3, 2, 3], toadSkin), B([1.5, 25, -5], [3, 2, 3], toadSkin)] },
    { name: 'arm_r', parent: 'rider', pivot: [5.5, 19, 0], rot: [-15, 0, 0], cubes: [B([4.5, 12, -1.5], [3, 7, 3], toadSkin), ...trident.map(c => ({ ...c, from: [c.from[0] + 1, c.from[1], c.from[2]] }))] },
    { name: 'arm_l', parent: 'rider', pivot: [-5.5, 19, 0], cubes: [B([-7.5, 13, -1.5], [3, 6, 3], toadSkin), rounded('x', null, [-6, 18.5, 0], [5, 3, 5], 1, breast).cubes[0]] },
  );
  out.frog_knight = { render: 'cutout', bones };
  out.rhino_beetle = { render: 'cutout', bones: beetleBones(0) };
}
{
  // The Frog Trainer: the same toad on its own feet - thick frog thighs, big webbed feet, a round belly; a leather cap
  // and a steel breastplate; the trident.
  const fig = figure({
    thigh: [5, 5, 6], shin: [4, 5, 5], foot: [7, 2, 9], hipW: 7, legSplay: 14, knee: 12,
    pelvis: [12, 4, 9], waist: [13, 5, 10], chest: [13, 6, 9], upperArm: [4, 6, 4], foreArm: [4, 6, 4], hand: [5, 3, 5],
    neck: [9, 1, 8], head: [13, 7, 11], armOut: 12, armFwd: -15,
    mats: { skin: toadSkin, legs: toadSkin, shins: toadSkin, feet: toadSkin, pelvis: toadSkin, waist: toadBelly, chest: breast, arms: toadSkin, fore: toadSkin, hands: toadSkin, head: toadSkin },
    face: (x, y, w) => (y === 4 && x >= 1 && x <= w - 2 ? '#2e3e46' : y === 5 && (x === 2 || x === w - 3) ? '#3e525c' : null),
  });
  const top = bone(fig, 'head').cubes[1].from[1] + 7;
  bone(fig, 'head').cubes.push(B([-6, top - 1, -5.6], [4, 4, 1], toadSkin, { detail: { north: toadEyes } }), B([2, top - 1, -5.6], [4, 4, 1], toadSkin, { detail: { north: toadEyes } }),
    B([-5.5, top, -5], [4, 2, 4], toadSkin), B([1.5, top, -5], [4, 2, 4], toadSkin), B([-4, top, -1], [8, 2, 6], pat(leather, stitched)));
  const hand = bone(fig, 'arm_r_low');
  const hx = hand.pivot[0], hy = hand.cubes[1].from[1];
  hand.cubes.push(...trident.map(c => ({ ...c, from: [c.from[0] + hx - 4.5, c.from[1] + hy - 8, c.from[2]] })));
  out.frog_trainer = fig;
}

module.exports = out;
