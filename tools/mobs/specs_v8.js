// Model v8 (user 2026-11-18, mid-turn: "not everything stepped and jagged - use angled cubes, even inside one part,
// especially on bosses, elites and big monsters"). The bosses' and big monsters' bodies are rebuilt from bevelled
// prisms (kit.octo: the long edges cut at 45 degrees instead of stepped) and tilted single cubes (kit.rotBox) for
// slopes, wedges, plates and curves. Parts the v7 models already had at an angle (limbs, fins, fronds, feelers) keep
// their v7 build; this file overrides whole entries of specs_v7.js.
const { R, withPattern, glowing, h2, hash, B, fin, eyeDetail, fringe, limb, rotBox, octo } = require('./kit');
const v7 = require('./specs_v7');
const at = (pts, c) => (x, y) => (pts.some(([a, b]) => a === x && b === y) ? c : null);
const keep = (spec, names) => spec.bones.filter(b => names.some(n => b.name === n || b.name.startsWith(n + '_') || b.parent === n));
const bone = (spec, name) => spec.bones.find(b => b.name === name);

// ----------------------------------------------------------------------------------------------------- Soul Fysh
// The side profile is an octagon (front-top, front-bottom, back corners all cut at 45 degrees), the forehead and chin
// are sloped plates, the lips are tilted, the dorsal sail leans back.
const fyshSkin = { ramp: ['#d2fff2', '#a8f0e0', '#80dccc', '#5cc2b4', '#40a49a', '#2c847e'], alpha: 112 };
const fyshShell = withPattern(fyshSkin, (f, x, y, w, h) => (f === 'up' ? 1.2 : f === 'down' ? -0.8 : (y < 3 ? 1.2 : y > h - 4 ? -0.8 : 0)));
const fyshLip = { ramp: ['#b4f4e4', '#8ce0d0', '#68c8b8', '#4caa9c'], alpha: 230 };
const fysh7 = v7.soul_fysh;
const soul_fysh = {
  render: 'translucent', glow: true,
  bones: [
    { ...bone(fysh7, 'body'), cubes: bone(fysh7, 'body').cubes.filter(c => c.size[0] <= 5) },   // the organs only
    ...octo('shell', 'body', [0, 16, 0.5], 10, 33, 24, 5, fyshShell, 'x'),
    rotBox('peduncle', 'body', [0, 16, 17], [7, 12, 4], [0, 0, 0], fyshShell),
    { name: 'head', parent: 'body', pivot: [0, 16, -16], cubes: [
      B([-3, 12, -21.6], [6, 6, 0], R('#164a44', '#0c302c', '#082420')),                                           // the open mouth
      ...[-1, 1].map(s => B([s < 0 ? -5.5 : 4.5, 18, -17], [1, 5, 5], glowing(R('#fff6c8', '#e8c860', '#a88830')),
        { detail: { east: eyeDetail('#4a2a70', '#100818', '#f0d070', { crescent: '#e0b040' }), west: eyeDetail('#4a2a70', '#100818', '#f0d070', { crescent: '#e0b040' }) } })) ] },
    rotBox('forehead', 'head', [0, 23.5, -17], [9, 4, 7], [-30, 0, 0], fyshShell),                                  // the sloping brow
    rotBox('cheek', 'head', [0, 16, -18.5], [9, 9, 5], [0, 0, 0], fyshShell),
    rotBox('upper_lip', 'head', [0, 19, -22], [7, 2, 4], [-18, 0, 0], fyshLip),
    ...[-1, 1].map(s => rotBox('brow' + (s < 0 ? '_l' : '_r'), 'head', [s * 4.5, 23.5, -16], [1, 1, 7], [-20, 0, 0], { ...fyshSkin, alpha: 190 })),
    { name: 'jaw', parent: 'head', pivot: [0, 12, -18], rot: [8, 0, 0], cubes: [B([-3.5, 9, -25], [7, 3, 7], withPattern(fyshLip, (f) => (f === 'up' ? '#164a44' : 0)))] },
    rotBox('chin', 'jaw', [0, 8, -20], [7, 3, 6], [25, 0, 0], fyshShell),
    { ...bone(fysh7, 'fin_top'), rot: [-12, 0, 0] }, bone(fysh7, 'tail'), bone(fysh7, 'fin_l'), bone(fysh7, 'fin_r'), bone(fysh7, 'fin_bottom'),
  ],
};

// ----------------------------------------------------------------------------------------------------- Kaiser Crab
const shellPurple = R('#8a7ab4', '#6c5c98', '#56487e', '#443866', '#342a52', '#261e3e');
const crabSkin = withPattern(shellPurple, (f, x, y, w, h) => (f === 'up' ? (h2(x >> 1, y >> 1, 13) < 10 ? 1.0 : 0) + (h2(x, y, 17) < 4 ? -0.8 : 0) : f === 'down' ? 1.2 : (h2(x, y, 19) < 6 ? 0.8 : 0)));
const crusherMetal = R('#d0dcec', '#aebdd2', '#8ea0ba', '#71849e', '#566882', '#3e4e66');
const armour = withPattern(crusherMetal, (f, x, y, w, h) => (x % 6 === 0 ? 1.1 : x % 6 === 1 ? -0.6 : 0) + ((x % 6 === 3) && y % 4 === 1 ? '#e8eef8' : 0));
const rocketPurple = R('#c8a8f0', '#aa8ad8', '#8e70be', '#7458a2', '#5c4486', '#46326a');
const knobbly = withPattern(rocketPurple, (f, x, y) => (h2(x >> 1, y >> 1, 23) < 12 ? 0.9 : 0) + (h2(x, y, 29) < 5 ? -0.7 : 0));
const crab7 = v7.kaiser_crab;
const kaiser_crab = {
  render: 'cutout', glow: true,
  bones: [
    { name: 'body', pivot: [0, 14, 0], cubes: [B([-24, 9, -16], [48, 2, 32], R('#3a2e5a', '#2c2246', '#201834'))] },
    ...octo('carapace', 'body', [0, 18, 1], 40, 56, 14, 5, crabSkin, 'z'),
    rotBox('brim', 'body', [0, 17, -20], [50, 4, 6], [-30, 0, 0], crabSkin),                                        // the front edge sloping down
    rotBox('rear', 'body', [0, 18, 22], [48, 6, 5], [30, 0, 0], crabSkin),
    ...octo('lobe_l', 'carapace', [-11, 26, 0], 30, 18, 4, 2, crabSkin, 'z'), ...octo('lobe_r', 'carapace', [11, 26, 0], 30, 18, 4, 2, crabSkin, 'z'),
    ...keep(crab7, ['face', 'eye_l', 'eye_r']), ...crab7.bones.filter(b => b.name.startsWith('leg_')),
    // the Crusher: shoulder, a sloping upper arm, the forearm, the bevelled capsule claw, its hinged finger
    { name: 'claw_crusher', parent: 'body', pivot: [26, 14, -10], rot: [0, -15, 0], cubes: [B([24, 10, -14], [8, 8, 8], armour)] },
    rotBox('crusher_arm', 'claw_crusher', [29.5, 10, -22], [7, 7, 14], [-20, 0, 0], armour),
    rotBox('crusher_fore', 'claw_crusher', [30.5, 6, -34], [7, 7, 12], [-10, 0, 0], armour),
    ...octo('crusher_claw', 'claw_crusher', [31, 7, -47], 18, 12, 14, 4, armour, 'z'),
    rotBox('crusher_finger', 'crusher_claw', [31, 14, -53], [6, 3, 12], [12, 0, 0], withPattern(crusherMetal, (f, x, y) => (y === 0 ? -0.8 : 0))),
    rotBox('crusher_edge', 'crusher_claw', [31, 7, -56.5], [9, 8, 1], [0, 0, 0], R('#f4f8fc', '#d8e0ec')),
    // the Rocket: shoulder, a thick angled arm, the bevelled palm, two curved fingers in two angled parts each
    { name: 'claw_rocket', parent: 'body', pivot: [-26, 14, -10], rot: [0, 18, 0], cubes: [B([-33, 10, -15], [9, 9, 9], knobbly)] },
    rotBox('rocket_arm', 'claw_rocket', [-32, 11, -24], [11, 11, 13], [-15, 0, 0], knobbly),
    rotBox('rocket_fore', 'claw_rocket', [-34, 7, -35], [10, 10, 12], [-12, 0, 0], knobbly),
    ...octo('rocket_palm', 'claw_rocket', [-36, 8, -46], 14, 15, 15, 4, knobbly, 'z'),
    rotBox('rocket_low', 'rocket_palm', [-37, 3, -58], [7, 5, 12], [0, 0, 0], knobbly),
    rotBox('rocket_low_tip', 'rocket_low', [-37, 4, -68], [5, 4, 10], [-14, 12, 0], knobbly),
    rotBox('rocket_up', 'rocket_palm', [-36, 13, -55], [6, 4, 10], [22, 0, 0], knobbly),
    rotBox('rocket_up_tip', 'rocket_up', [-36, 10, -63], [5, 3, 9], [-28, 6, 0], withPattern(rocketPurple, (f, x, y) => (y === 2 ? '#ecdcfc' : 0))),
  ],
};

// ----------------------------------------------------------------------------------------------------- Knowledge Demon
const bands = R('#f2f2ee', '#dcdcd6', '#c4c4be', '#a8a8a2', '#8a8a86', '#6c6c6a');
const wrap = withPattern(bands, (f, x, y) => ((x + y * 2) % 5 === 0 ? 1.3 : (x + y * 2) % 5 === 1 ? -0.5 : 0));
const hoodGold = withPattern(R('#ffe08a', '#f2be58', '#d89a38', '#b47828', '#8c5a1c'), (f, x, y, w, h) => (x === 0 || x === w - 1 ? 1 : 0));
const chain = R('#fff4b0', '#f6d262', '#c89a30');
const eggStone = withPattern(R('#c8f4a0', '#9ade78', '#74c25a', '#54a242', '#3c8030', '#2a6022'), (f, x, y) => ((x * 2 + y) % 7 === 0 || (x - y * 3) % 9 === 0 ? '#e0ffc0' : h2(x, y, 3) < 8 ? 1 : 0));
const dem7 = v7.knowledge_demon;
const knowledge_demon = {
  render: 'cutout',
  bones: [
    { name: 'stone', pivot: [0, 0, 0], cubes: [] },
    ...octo('egg', 'stone', [0, 7, 0], 12, 14, 14, 4, eggStone, 'y'),
    rotBox('egg_top', 'egg', [0, 13.5, 0], [8, 3, 8], [0, 45, 0], eggStone),
    ...[0, 1, 2, 3, 4, 5, 6].map(i => rotBox('root' + i, 'stone', [Math.round(Math.cos(i * 0.9) * 8), 0.6, Math.round(Math.sin(i * 0.9) * 8)], [9, 1, 1], [0, -i * 0.9 * 57.3, -12], withPattern(chain, (f, x) => (x % 3 === 0 ? 1 : 0)))),
    { name: 'body', pivot: [0, 22, 0], cubes: [B([-1.5, 28, -7], [3, 6, 2], bands), B([-4, 27, -6], [8, 2, 2], wrap), B([-7, 31, -4.6], [14, 1, 0], chain, { mask: (f, x) => x % 2 === 0 })] },
    ...octo('torso', 'body', [0, 29, 0], 10, 11, 7, 2, withPattern(bands, (f, x, y) => (f === 'north' && y % 2 === 0 ? 1.2 : 0)), 'y'),
    ...octo('waist', 'body', [0, 22.5, 0], 5, 8, 6, 2, wrap, 'y'),
    // folded legs: thighs angled out to wide knees, shins crossed in front
    rotBox('thigh_l', 'body', [-6, 18.5, -1], [11, 5, 6], [0, -20, -6], wrap), rotBox('thigh_r', 'body', [6, 18.5, -1], [11, 5, 6], [0, 20, 6], wrap),
    rotBox('shin_l', 'body', [-2.5, 17.5, -6], [13, 4, 4], [0, 18, 0], wrap), rotBox('shin_r', 'body', [2.5, 17.5, -6.5], [13, 4, 4], [0, -18, 0], wrap),
    // the hood's cape sloping off the shoulders
    rotBox('cape_l', 'body', [-6.5, 32, 0.5], [7, 8, 8], [0, 0, 28], hoodGold), rotBox('cape_r', 'body', [6.5, 32, 0.5], [7, 8, 8], [0, 0, -28], hoodGold),
    rotBox('cape_back', 'body', [0, 30, 4], [12, 10, 2], [10, 0, 0], hoodGold),
    bone(dem7, 'halo'),
    { name: 'head', parent: 'body', pivot: [0, 35, 0], cubes: [
      B([-2.5, 35, -3], [5, 11, 5], withPattern(bands, (f, x, y) => (f === 'north' && x === 2 && y < 3 ? '#1a1814' : (x + y) % 3 === 0 ? 1 : 0))),
      B([-5.5, 41, -2.6], [11, 1, 0], chain, { mask: (f, x) => x % 2 === 0 }) ] },
    // the mitre: two side panels leaning in to a point, a back panel
    rotBox('mitre_l', 'head', [-3.6, 43, 0.5], [2, 16, 7], [0, 0, -14], hoodGold), rotBox('mitre_r', 'head', [3.6, 43, 0.5], [2, 16, 7], [0, 0, 14], hoodGold),
    rotBox('mitre_back', 'head', [0, 43, 3.5], [6, 15, 2], [-6, 0, 0], hoodGold), rotBox('mitre_tip', 'head', [0, 51.5, 0.5], [3, 3, 3], [0, 45, 0], hoodGold),
    ...dem7.bones.filter(b => b.name.startsWith('arm_')),
  ],
};

// ----------------------------------------------------------------------------------------------------- Vantom
const inkGloss = R('#6a6488', '#46425e', '#2e2c42', '#1e1c2e', '#121020', '#0a0814');
const inkSkin = withPattern(inkGloss, (f, x, y, w, h) => (f === 'up' ? -0.6 : 0) + ((x + y * 3) % 11 === 0 ? -1.2 : 0) + 1.2);
const blister = glowing(R('#fbffc0', '#e6f08a', '#c4d860'));
const van7 = v7.vantom;
const lumps = [[-8, 27, -2, 7, 7, 8, [0, 20, 15]], [7, 28, 0, 7, 6, 7, [10, -25, -20]], [-2, 34, -1, 8, 5, 8, [0, 30, 10]], [3, 33, -4, 6, 5, 6, [-15, 0, -20]], [0, 12, -5, 9, 6, 5, [15, 0, 0]], [-6, 20, 3, 6, 8, 6, [0, 0, 18]]];
const vantom = {
  render: 'cutout', glow: true,
  bones: [
    { ...bone(van7, 'body'), cubes: bone(van7, 'body').cubes.filter(c => c.mat.emissive || c.size[2] === 0) },   // the blisters and drips stay
    ...octo('core', 'body', [0, 23, 0], 24, 22, 15, 5, inkSkin, 'y'),
    ...lumps.map(([x, y, z, w, h, d, r], i) => rotBox('lump' + i, 'core', [x, y, z], [w, h, d], r, inkSkin)),
    ...van7.bones.filter(b => b.name !== 'body'),
  ],
};

// ----------------------------------------------------------------------------------------------------- Waterfall Giant
// Every boulder tilted its own way; the legs bevelled pillars.
const rock = R('#c8ccc4', '#a8aea4', '#8a9086', '#6e746c', '#565c54', '#40463e');
const rockSkin = withPattern(rock, (f, x, y) => (f === 'up' ? (h2(x >> 1, y >> 1, 41) < 30 ? '#7aa858' : -0.4) : (h2(x, y, 43) < 6 ? 1.2 : (x + y) % 7 === 0 ? -0.6 : 0)));
const wg7 = v7.waterfall_giant;
const boulders = [[0, 27, -10, 26, 14, 16, [-8, 0, 0]], [-9, 36, -12, 12, 9, 12, [10, 15, 12]], [8, 37, -9, 12, 8, 12, [-6, -20, -10]], [0, 38, -4, 10, 6, 10, [12, 30, 0]],
  [0, 23, 4, 22, 11, 14, [6, 0, 0]], [-6, 29, 4, 10, 6, 9, [0, 20, 14]], [5, 28, 7, 10, 6, 9, [-10, -15, -10]], [0, 21, 15, 18, 10, 10, [14, 0, 0]], [0, 26, 16, 10, 5, 8, [20, 10, 0]]];
const waterfall_giant = {
  render: 'translucent',
  bones: [
    { name: 'body', pivot: [0, 20, 0], cubes: [B([-2, 41, -8], [1, 4, 0], R('#9ad070', '#78b050')), B([4, 40, -12], [1, 3, 0], R('#9ad070', '#78b050'))] },
    ...boulders.map(([x, y, z, w, h, d, r], i) => rotBox('rock' + i, 'body', [x, y, z], [w, h, d], r, rockSkin)),
    { name: 'head', parent: 'body', pivot: [0, 24, -18], cubes: [] },
    rotBox('skull', 'head', [0, 22, -24], [13, 11, 11], [10, 0, 0], rockSkin), rotBox('jaw_rock', 'head', [0, 19, -29], [9, 6, 4], [-15, 0, 0], rockSkin), rotBox('brow_rock', 'head', [0, 28, -24], [11, 3, 8], [-12, 0, 0], rockSkin),
    ...[['leg_fl', -1, -12, 9, 20], ['leg_fr', 1, -12, 9, 20], ['leg_bl', -1, 13, 7, 16], ['leg_br', 1, 13, 7, 16]].flatMap(([n, s, z, t, top]) => [
      { name: n, parent: 'body', pivot: [s * 9, top, z], cubes: [B([s * 9 - (t + 3) / 2, 0, z - (t + 4) / 2], [t + 3, 3, t + 4], rockSkin)] },
      ...octo(n + '_pillar', n, [s * 9, (top - 2) / 2 + 2, z], top - 2, t, t, 2, rockSkin, 'y'),
      rotBox(n + '_knee', n, [s * 9, top - 3, z], [t + 2, 6, t + 2], [s * 8, 0, s * 10], rockSkin) ]),
    bone(wg7, 'tent_0'),
  ],
};

// ----------------------------------------------------------------------------------------------------- Lagavulin Matriarch
const pebble = R('#fffef6', '#f6f0dc', '#e4dcc2', '#ccc2a4', '#aea486');
const pebbleSkin = withPattern(pebble, (f, x, y) => ((x * 3 + y * 5) % 13 === 0 || (x - y * 2) % 11 === 0 ? '#e09040' : (x + y) % 5 === 0 ? -0.6 : 0));
const lag7 = v7.lagavulin_matriarch;
const heap = [[0, 16, 10, 20, 15, 18, [0, 10, 0]], [-8, 28, 8, 13, 11, 13, [15, 20, 10]], [8, 27, 11, 14, 11, 14, [-10, -25, -12]], [0, 36, 9, 13, 9, 12, [20, 40, 0]],
  [-10, 17, 19, 12, 11, 12, [-15, 30, 10]], [10, 16, 20, 12, 10, 12, [10, -20, -15]], [0, 15, 23, 15, 12, 10, [25, 0, 0]], [-5, 42, 10, 8, 6, 8, [0, 20, 25]], [6, 33, 18, 10, 9, 10, [-20, 15, 10]], [-12, 30, 16, 9, 8, 9, [10, -30, 20]]];
const lagavulin_matriarch = {
  render: 'cutout', glow: true,
  bones: [
    { name: 'body', pivot: [0, 9, 0], cubes: [] },
    ...heap.map(([x, y, z, w, h, d, r], i) => rotBox('stone' + i, 'body', [x, y, z], [w, h, d], r, pebbleSkin)),
    rotBox('crab_body', 'body', [0, 8.5, -3], [12, 7, 10], [10, 0, 0], withPattern(R('#ffd09c', '#f8a860', '#e88838', '#c86a22'), (f, x, y) => (y % 3 === 0 ? 0.8 : 0))),
    ...lag7.bones.filter(b => b.name !== 'body'),
  ],
};

// ----------------------------------------------------------------------------------------------------- The Insatiable
// Bevelled ring segments; the maw a flaring trumpet of eight tilted petals round a dark throat.
const wormBlue = R('#b8cce0', '#98aec8', '#7a92ae', '#5e7692', '#465c76', '#34465c');
const ringed = withPattern(wormBlue, (f, x, y, w, h) => (f === 'down' ? '#d8c49c' : (y % 4 === 0 ? 1.2 : y % 4 === 1 ? -0.5 : 0) + (x % 4 === 0 ? 0.4 : 0)));
const maw = R('#ffe0a8', '#fbb870', '#ee8a48', '#d0602e', '#a03c20', '#5a1a10');
const ins7 = v7.insatiable;
const insatiable = {
  render: 'cutout',
  bones: [
    bone(ins7, 'body'),
    { name: 'seg_1', parent: 'body', pivot: [0, 4, 6], rot: [-40, 0, 0], cubes: [] }, ...octo('ring1', 'seg_1', [0, 7.5, 2], 12, 16, 15, 4, ringed, 'z'),
    { name: 'seg_2', parent: 'seg_1', pivot: [0, 7, -4], rot: [-30, 0, 0], cubes: [] }, ...octo('ring2', 'seg_2', [0, 8, -9], 10, 15, 14, 4, ringed, 'z'),
    { name: 'seg_3', parent: 'seg_2', pivot: [0, 8, -14], rot: [-10, 0, 0], cubes: [] }, ...octo('ring3', 'seg_3', [0, 8, -18], 8, 14, 13, 4, ringed, 'z'),
    { name: 'head', parent: 'seg_3', pivot: [0, 8, -22], rot: [55, 0, 0], cubes: [
      B([-5, 3, -27], [10, 10, 4], withPattern(maw, (f, x, y) => (f === 'north' ? '#3a0c08' : 1))),
      ...[0, 1, 2, 3, 4, 5, 6, 7].map(k => B([Math.round(Math.cos(k * 0.785) * 4) - 0.5, 8 + Math.round(Math.sin(k * 0.785) * 4) - 0.5, -27.5], [1, 1, 1], R('#fffaf0', '#e8dcc8'))) ] },
    // the petals of the trumpet: eight plates round the throat, each tilted outwards
    ...[0, 1, 2, 3, 4, 5, 6, 7].map(k => { const a = k * 45, rad = a * Math.PI / 180, cx = Math.cos(rad) * 8, cy = 8 + Math.sin(rad) * 8;
      return { name: 'petal' + k, parent: 'head', pivot: [cx, cy, -27], rot: [Math.round(-Math.sin(rad) * 40), Math.round(Math.cos(rad) * 40), 0], cubes: [
        B([cx - 3.5, cy - 3.5, -31], [7, 7, 3], withPattern(maw, (f, x, y) => (f === 'north' ? (Math.hypot(x - 3, y - 3) < 2 ? 3 : 1.5) : 0.5)))] }; }),
    ...ins7.bones.filter(b => b.name.startsWith('tent_')),
  ],
};

// ----------------------------------------------------------------------------------------------------- big monsters
// Mawler: the chest and body a bevelled prism tilted up at the front; Phrog Parasite: the sac a bevelled ball.
const maw7 = v7.mawler;
const hide = withPattern(R('#a8dcec', '#84c0d4', '#64a2b8', '#4a849c', '#36687e', '#264e60'), (f, x, y, w, h) => (f === 'up' ? (x % 3 === 0 ? 0.8 : 0) : f === 'down' ? -0.8 : (h2(x, y, 31) < 5 ? 0.8 : 0)));
const mawler = { render: 'cutout', bones: [
  { ...bone(maw7, 'body'), cubes: [] },
  ...octo('chest', 'body', [0, 14, -3], 11, 14, 14, 4, hide, 'z', [-8, 0, 0]),
  ...octo('loins', 'body', [0, 13, 6], 9, 11, 10, 3, hide, 'z', [8, 0, 0]),
  rotBox('hump', 'body', [0, 20, -5], [10, 4, 8], [-15, 0, 0], hide),
  ...maw7.bones.filter(b => b.name !== 'body'),
] };
const ph7 = v7.phrog_parasite;
const sacY = withPattern(R('#f8f48c', '#e2dc60', '#c4bc3c', '#a09a2a', '#7a741e'), (f, x, y) => (h2(x >> 1, y >> 1, 12) < 12 ? '#4a4818' : h2(x, y, 13) < 6 ? 1.2 : 0));
const phrog_parasite = { render: 'cutout', bones: [
  { ...bone(ph7, 'body'), cubes: [] },
  ...octo('sac', 'body', [0, 14, 0], 18, 18, 18, 5, sacY, 'y'),
  rotBox('sac_top', 'sac', [0, 23.5, 0], [10, 2, 10], [0, 45, 0], sacY), rotBox('sac_bottom', 'sac', [0, 4.5, 0], [10, 2, 10], [0, 45, 0], sacY),
  ...ph7.bones.filter(b => b.name !== 'body'),
] };

module.exports = { soul_fysh, kaiser_crab, knowledge_demon, vantom, waterfall_giant, lagavulin_matriarch, insatiable, mawler, phrog_parasite };
