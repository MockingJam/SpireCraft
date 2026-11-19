// Model v7 (user 2026-11-18: the models are too crude - a big monster needs its anatomy worked out part by part, and
// the humanoids must follow STS2, not the vanilla player). Each entry starts from a feature list taken from the STS2
// render and the real animal behind it, then builds every part to size. Overrides the earlier specs.
const { R, withPattern, glowing, h2, hash, B, loft, sl, fin, eyeDetail, teethMask, limb, fringe } = require('./kit');

// ===================================================================================================== Soul Fysh
// Features (StS2_Soul_Fysh.png + a sunfish / discus): a deep, long body with a rounded back and belly, the head
// rounding down to an underslung, gaping mouth - the lower lip juts past the curled upper lip; a big eye set high and
// forward, dark purple with a gold crescent inside a heavy rim; a tall sail of a dorsal fin, highest at the front and
// swept back, with soft rays; a broad, short fan of a tail across the whole rear; a see-through pectoral fan on the
// side, a small pelvic and anal fin below. Seen through the translucent teal body: a pink two-lobed stomach in the
// middle, a coiled purple bead-chain gut over and behind it, three tan cup-shaped organs up at the back, and a cluster
// of yellow eggs low in front.
const fyshSkin = { ramp: ['#d2fff2', '#a8f0e0', '#80dccc', '#5cc2b4', '#40a49a', '#2c847e'], alpha: 118 };
const fyshEdge = { ramp: ['#80dccc', '#5cc2b4', '#40a49a', '#2c847e', '#20645e'], alpha: 175 };
const fyshFin = { ramp: ['#f0ffd8', '#d0f4bc', '#aee4ac', '#8ccca0'], alpha: 125 };
const fyshLip = { ramp: ['#b4f4e4', '#8ce0d0', '#68c8b8', '#4caa9c'], alpha: 230 };
const organ = (ramp) => ({ ramp, alpha: 240 });
const fyshShell = withPattern(fyshSkin, (f, x, y, w, h) => {
  if (f === 'up') return 1.2;                                   // the back is the darkest
  if (f === 'down') return -0.8;                                // a pale belly
  if (f === 'east' || f === 'west') return (y < 3 ? 1.3 : y > h - 4 ? -0.9 : 0) + ((x + (y % 4 < 2 ? 0 : 2)) % 4 === 0 && y % 2 === 0 ? 0.35 : 0);   // faint scale rows
  return 0.3;
});
const gut = [[-4, 22], [-1.5, 23], [1, 22.5], [3.5, 23], [6, 22], [8, 20], [7, 17.5], [8.5, 15], [6.5, 12.5], [4, 11.5]];

const soul_fysh = {
  render: 'translucent', glow: true,
  bones: [
    { name: 'body', pivot: [0, 16, 0], cubes: [
      // organs first, so the shell is blended over them
      B([-2.5, 11, -7], [5, 6, 5], withPattern(organ(['#ffd8cc', '#f6b8aa', '#e4988c', '#c87a70']), (f, x, y) => (y === 0 ? -0.6 : 0))),
      B([-2.5, 10, -2], [5, 7, 5], withPattern(organ(['#ffe0d4', '#f8c0b2', '#e8a094', '#cc8276']), (f, x, y, w, h) => (x === 0 || x === w - 1 ? 0.8 : 0))),
      ...gut.map(([z, y], i) => B([-1, y - 1, z - 1], [2, 2, 2], withPattern(organ(['#c8b4f4', '#a690e4', '#8670cc', '#6a56ae']), (f, px, py) => ((px + py + i) % 2 ? 0.8 : -0.4)))),
      ...[[8, 20], [10, 17], [11, 14]].map(([z, y]) => B([-1, y, z], [2, 3, 2], withPattern(organ(['#f0dcb4', '#d8bc90', '#b89a70']), (f, px, py) => (f === 'up' ? '#5a4028' : py === 0 ? 0.8 : 0)))),
      ...[[-10, 9], [-8, 8], [-9, 11], [-7, 10.5], [-11, 11], [-6, 8], [-8, 12.5]].map(([z, y]) => B([-1.5, y, z], [2, 2, 2], withPattern(organ(['#fff6b0', '#f4dc70', '#d8b848', '#b89430']), (f, px, py) => (px === 0 && py === 0 ? -1 : 0.4)))),
      // the shell: a loft of slices, back to the tail root
      ...loft([sl(-14, -10, 9, 7, 25), sl(-10, -4, 10, 5, 27), sl(-4, 8, 10, 4, 28), sl(8, 13, 10, 5, 27), sl(13, 16, 9, 7, 25), sl(16, 18, 7, 10, 22, fyshEdge)], fyshShell),
    ] },
    { name: 'head', parent: 'body', pivot: [0, 16, -14], cubes: [
      ...loft([sl(-21, -18, 7, 11, 20), sl(-18, -14, 9, 8, 24)], withPattern(fyshSkin, (f, x, y, w, h) => (f === 'up' ? 1.1 : (f === 'east' || f === 'west') && x === w - 1 ? 1.4 : 0))),
      // the mouth: a dark hole behind the lips
      B([-3, 13, -21.6], [6, 5, 0], R('#164a44', '#0c302c', '#082420')),
      // the upper lip curls up and forward
      B([-3.5, 18, -23], [7, 2, 3], fyshLip), B([-3, 19.5, -23.5], [6, 1, 1], fyshLip),
      // the big eyes: bulging past the head on each side
      ...[-1, 1].map(s => B([s < 0 ? -5.5 : 4.5, 17.5, -17], [1, 5, 5], glowing(R('#fff6c8', '#e8c860', '#a88830')),
        { detail: { east: eyeDetail('#4a2a70', '#100818', '#f0d070', { crescent: '#e0b040' }), west: eyeDetail('#4a2a70', '#100818', '#f0d070', { crescent: '#e0b040' }) } })),
      ...[-1, 1].map(s => B([s < 0 ? -5 : 4, 22.5, -17.5], [1, 1, 6], fyshEdge)),   // the heavy brow over each eye
    ] },
    // the jutting lower lip (the jaw drops when it screams)
    { name: 'jaw', parent: 'head', pivot: [0, 13, -18], cubes: [B([-3.5, 10, -24], [7, 3, 6], withPattern(fyshLip, (f, x, y) => (f === 'up' ? '#164a44' : 0))), B([-3, 9, -22], [6, 1, 3], fyshLip)] },
    // the sail: tallest at the front, swept back, soft rays
    { name: 'fin_top', parent: 'body', pivot: [0, 28, -4], cubes: [
      fin([0, 27, -8], [0, 14, 22], fyshFin, (f, x, y, w, h) => { const t = 1 - x / (w - 1), top = h * (0.25 + 0.75 * Math.pow(1 - t, 0.7)) * (t < 0.12 ? t / 0.12 : 1); return h - 1 - y < top; }, 3) ] },
    // the tail: a broad short fan over the whole rear, rays fanning out, a pale edge
    { name: 'tail', parent: 'body', pivot: [0, 16, 18], cubes: [
      fin([0, 3, 18], [0, 26, 10], { ...fyshFin, alpha: 150 }, (f, x, y, w, h) => { const t = x / (w - 1); return Math.abs(y - (h - 1) / 2) <= (h / 2) * (0.45 + 0.55 * t) && !(t > 0.9 && (y % 4 === 1)); }, 2) ] },
    // the pectoral fans, one each side
    ...[['fin_l', -1], ['fin_r', 1]].map(([n, s]) => ({ name: n, parent: 'body', pivot: [s * 5, 12, -3], rot: [15, s * -35, 0], cubes: [
      fin([s * 5, 8, -3], [0, 8, 10], fyshFin, (f, x, y, w, h) => Math.abs(y - (h - 1) / 2) <= (h / 2) * (0.3 + 0.7 * x / (w - 1)), 2) ] })),
    // pelvic and anal fins under the belly
    { name: 'fin_bottom', parent: 'body', pivot: [0, 5, 2], cubes: [
      fin([0, -3, -4], [0, 8, 7], fyshFin, (f, x, y, w, h) => h - 1 - y >= Math.round((h - 1) * Math.abs(x - w * 0.3) / w), 2),
      fin([0, -1, 6], [0, 6, 9], fyshFin, (f, x, y, w, h) => y <= (h - 1) * (1 - x / w) + 1, 2) ] },
  ],
};

// ===================================================================================================== Kaiser Crab
// Features (StS2 Kaiser Crab body/claw sprites + a real crab): a huge flat carapace, much wider than long, its front
// edge notched in the middle and its top swelling into two broad lobes with a groove between; under the front edge a
// small face - a triangular mouth full of little teeth, mouthpart palps, a cluster of round green eyes (two on short
// stalks), a crest of bristles; spindly walking legs in three segments, pointed tips, emerging under the shell; on the
// crab's right the Crusher, an armoured blue-grey arm ending in a capsule-shaped crushing claw with a hinged finger
// and pale edge; on its left the Rocket, a thick purple arm and a great pincer with two long curved fingers (the lower
// one longer). Modelled at 1.5x pixel scale.
const shellPurple = R('#8a7ab4', '#6c5c98', '#56487e', '#443866', '#342a52', '#261e3e');
const crabRim = R('#9a8ac4', '#7c6ca8', '#5e5088');
const crusherMetal = R('#d0dcec', '#aebdd2', '#8ea0ba', '#71849e', '#566882', '#3e4e66');
const rocketPurple = R('#c8a8f0', '#aa8ad8', '#8e70be', '#7458a2', '#5c4486', '#46326a');
const crabEyeG = glowing(R('#f0ffd8', '#c0f48c', '#88d85c', '#5aa83c'));
const crabSkin = withPattern(shellPurple, (f, x, y, w, h) => {
  if (f === 'up') return (h2(x >> 1, y >> 1, 13) < 10 ? 1.0 : 0) + (h2(x, y, 17) < 4 ? -0.8 : 0) + ((x === Math.floor(w / 2) || x === Math.floor(w / 2) - 1) ? 1.4 : 0);
  if (f === 'down') return 1.2;
  return (y === 0 ? -0.8 : 0) + (h2(x, y, 19) < 6 ? 0.8 : 0);
});
const armour = withPattern(crusherMetal, (f, x, y, w, h) => (x % 6 === 0 ? 1.1 : x % 6 === 1 ? -0.6 : 0) + ((x % 6 === 3) && y % 4 === 1 ? '#e8eef8' : 0) + (y === h - 1 ? 0.8 : 0));
const knobbly = withPattern(rocketPurple, (f, x, y) => (h2(x >> 1, y >> 1, 23) < 12 ? 0.9 : 0) + (h2(x, y, 29) < 5 ? -0.7 : 0));
const crabLegs = [-1, 1].flatMap(s => [-12, -6, 0, 6].flatMap((z, i) => [
  { name: 'leg_' + (s < 0 ? 'l' : 'r') + i, parent: 'body', pivot: [s * 22, 12, z], rot: [0, s * (i - 1.5) * 12, s * 20], cubes: [
    B([s < 0 ? -36 : 22, 10.5, z - 1.5], [14, 3, 3], withPattern(shellPurple, (f, x) => (x % 5 === 0 ? 1.1 : 0))) ] },
  { name: 'leg_' + (s < 0 ? 'l' : 'r') + i + '_tip', parent: 'leg_' + (s < 0 ? 'l' : 'r') + i, pivot: [s * 36, 12, z], rot: [0, 0, s * -40], cubes: [
    B([s < 0 ? -37 : 35, 2, z - 1], [2, 10, 2], shellPurple), B([s < 0 ? -36.5 : 35.5, -4, z - 0.5], [1, 6, 1], withPattern(crabRim, (f, x, y) => (y > 3 ? -0.5 : 0))) ] },
]));
const kaiser_crab = {
  render: 'cutout', glow: true,
  bones: [
    { name: 'body', pivot: [0, 14, 0], cubes: [
      ...loft([sl(-20, -17, 44, 12, 22), sl(-17, -8, 52, 11, 25), sl(-8, 10, 56, 10, 26), sl(10, 18, 52, 11, 24), sl(18, 22, 44, 12, 21)], crabSkin),
      // the two lobes swelling on top, a groove between
      ...loft([sl(-14, -6, 18, 26, 27), sl(-6, 12, 20, 26, 28), sl(12, 17, 16, 26, 27)].map(s => ({ ...s, w: [-22, -2] })), crabSkin),
      ...loft([sl(-14, -6, 18, 26, 27), sl(-6, 12, 20, 26, 28), sl(12, 17, 16, 26, 27)].map(s => ({ ...s, w: [2, 22] })), crabSkin),
      B([-24, 8, -16], [48, 2, 32], R('#3a2e5a', '#2c2246', '#201834')),                                 // the belly plate
      B([-22, 21, -20.6], [44, 1, 0], crabRim), B([-1, 13, -20.6], [2, 9, 0], R('#241a38', '#18102a')),    // the front lip and its notch
    ] },
    { name: 'face', parent: 'body', pivot: [0, 11, -20], cubes: [
      B([-8, 5, -23], [16, 7, 3], withPattern(shellPurple, (f, x, y) => (h2(x, y, 31) < 10 ? 1 : 0))),
      // the triangular mouth, little teeth along its edges
      B([-3.5, 5.5, -23.2], [7, 6, 0], R('#1a1020', '#100818'), { mask: (f, x, y, w, h) => Math.abs(x - (w - 1) / 2) <= (y + 1) * 0.6,
        detail: { north: (x, y, w, h) => (Math.abs(Math.abs(x - (w - 1) / 2) - (y + 1) * 0.6) < 0.7 && y % 2 === 0 ? '#f4f0e8' : null) } }),
      // small round eyes in pairs round the mouth
      ...[[-6, 9], [5, 9], [-7.5, 6.5], [6.5, 6.5]].map(([x, y]) => B([x, y, -23.5], [2, 2, 1], crabEyeG, { detail: { north: (px, py) => (px === 0 && py === 0 ? '#ffffff' : px === 1 && py === 1 ? '#1a2a10' : null) } })),
      // mouthpart palps
      ...[-1, 1].map(s => B([s * 2.5 - 0.5, 1, -24], [1, 5, 1], crabRim)),
      // the bristle crests either side of the face
      ...[-1, 1].map(s => B([s < 0 ? -16 : 6, 11, -21], [10, 7, 0], R('#4a3c68', '#382c54', '#2a2040'), { mask: (f, x, y, w, h) => y >= (x * 3 + 1) % 4 + (x % 2) })),
    ] },
    ...[['eye_l', -3], ['eye_r', 3]].map(([n, x]) => ({ name: n, parent: 'face', pivot: [x, 12, -21], rot: [-25, 0, x * 5], cubes: [
      B([x - 0.5, 12, -21.5], [1, 4, 1], shellPurple),
      B([x - 1.5, 16, -22.5], [3, 3, 3], crabEyeG, { detail: { north: (px, py) => (px === 0 && py === 0 ? '#ffffff' : px === 1 && py === 1 ? '#1a2a10' : null) } }) ] })),
    ...crabLegs,
    // the Crusher: shoulder, upper arm, forearm, the capsule claw and its hinged finger
    { name: 'claw_crusher', parent: 'body', pivot: [26, 14, -10], rot: [0, -15, 0], cubes: [
      B([24, 10, -14], [8, 8, 8], armour),
      B([26, 6, -26], [7, 7, 13], armour),
      B([27, 2, -36], [7, 7, 11], armour),
      ...loft([{ at: [-56, -52], w: [26, 36], h: [3, 12] }, { at: [-52, -42], w: [24, 38], h: [0, 14] }, { at: [-42, -37], w: [25, 37], h: [1, 13] }], armour),
      B([26, 12, -55], [6, 3, 12], withPattern(crusherMetal, (f, x, y) => (y === 0 ? -0.8 : 0))),         // the movable finger along the top
      B([27, 4, -57], [8, 6, 1], R('#f4f8fc', '#d8e0ec')),                                                  // the pale crushing edge
    ] },
    // the Rocket: a thick purple arm and the great pincer
    { name: 'claw_rocket', parent: 'body', pivot: [-26, 14, -10], rot: [0, 18, 0], cubes: [
      B([-33, 10, -15], [9, 9, 9], knobbly),
      B([-37, 7, -27], [11, 11, 13], knobbly),
      B([-37, 2, -38], [10, 10, 12], knobbly),
      ...loft([{ at: [-52, -38], w: [-44, -28], h: [0, 15] }, { at: [-55, -52], w: [-42, -30], h: [2, 13] }], knobbly),
      B([-41, 0, -76], [8, 5, 22], withPattern(rocketPurple, (f, x, y, w, h) => (f === 'up' && x % 4 === 0 ? '#5c4486' : 0)), { mask: (f, x, y, w, h) => !(f === 'east' || f === 'west') || y >= Math.max(0, Math.floor((x - w + 6) / 2)) }),   // the long lower finger
      B([-40, 8, -71], [6, 4, 17], withPattern(rocketPurple, (f, x) => (x % 4 === 0 ? 0.9 : 0))),            // the upper finger, a little open
      B([-40, 5, -77], [6, 3, 2], R('#ecdcfc', '#cbb4ec')),
    ] },
  ],
};

// ===================================================================================================== Knowledge Demon
// Features (StS2_Knowledge_Demon.png): it sits cross-legged in the air over a cracked green egg-stone held in golden
// roots; its body is twisted grey bands wrapped like cloth, a slim ribbed torso and a narrow waist over wide folded
// legs; two hands pressed together at the chest; six more long ribbon arms - the top pair raised with open palms, the
// middle pair flung out and waving, the lowest resting on the knees, palms up - with long fingers; a tall golden
// mitre-hood falling into a cape over the shoulders, gold chains at the brow and across the chest; a long, thin,
// grey face of twisted cloth with a dark slit; a great brown disc behind it like a halo. Built at 1.4x.
const bands = R('#f2f2ee', '#dcdcd6', '#c4c4be', '#a8a8a2', '#8a8a86', '#6c6c6a');
const wrap = withPattern(bands, (f, x, y) => ((x + y * 2) % 5 === 0 ? 1.3 : (x + y * 2) % 5 === 1 ? -0.5 : 0));
const hoodGold = R('#ffe08a', '#f2be58', '#d89a38', '#b47828', '#8c5a1c');
const chain = R('#fff4b0', '#f6d262', '#c89a30');
const haloBrown = R('#c8945a', '#a87842', '#8c6030', '#704a24');
const eggStone = R('#c8f4a0', '#9ade78', '#74c25a', '#54a242', '#3c8030', '#2a6022');
const demonArm = (name, y, s, out, up, fore, palmUp) => [
  { name, parent: 'body', pivot: [s * 5, y, 0], rot: [0, s * 10, s * out], cubes: [B([s < 0 ? -15 : 5, y - 1.5, -1.5], [10, 3, 3], wrap)] },
  { name: name + '_fore', parent: name, pivot: [s * 15, y, 0], rot: [palmUp ? -20 : 0, 0, -s * fore], cubes: [
    B([s < 0 ? -25 : 15, y - 1, -1], [10, 2, 2], wrap),
    B([s < 0 ? -29 : 25, y - 1.5, -2], [4, 1, 4], bands),                                                   // the palm
    ...[0, 1, 2].map(k => B([s < 0 ? -32 : 29, y - 1.5, -2 + k * 1.5], [3, 1, 1], bands)),                 // long fingers
    B([s < 0 ? -28 : 27, y - 0.5, -3], [1, 2, 1], bands),                                                    // the thumb
  ] },
];
const knowledge_demon = {
  render: 'cutout',
  bones: [
    { name: 'stone', pivot: [0, 0, 0], cubes: [
      ...loft([sl(1, 3, 10, -5, 5), sl(3, 9, 14, -7, 7), sl(9, 12, 11, -5.5, 5.5), sl(12, 13, 7, -3.5, 3.5)].map(s => ({ ...s, w: s.w, h: [s.h[0], s.h[1]] })), withPattern(eggStone, (f, x, y) => ((x * 2 + y) % 7 === 0 || (x - y * 3) % 9 === 0 ? '#e0ffc0' : h2(x, y, 3) < 8 ? 1 : 0)), 'y'),
      ...[0, 1, 2, 3, 4, 5, 6].map(i => { const a = i * 0.9; return B([Math.round(Math.cos(a) * 6) - 3, 0, Math.round(Math.sin(a) * 6) - 0.5], [8, 1, 1], withPattern(chain, (f, x) => (x % 3 === 0 ? 1 : 0))); }),
    ] },
    { name: 'body', pivot: [0, 22, 0], cubes: [
      // folded legs: knees wide, shins crossed in front
      B([-14, 16, -6], [28, 5, 11], wrap), B([-10, 15, -9], [20, 4, 4], withPattern(bands, (f, x) => (x % 4 === 0 ? 1 : 0))),
      // waist, belly, ribbed chest, shoulders
      B([-4, 21, -3], [8, 5, 6], wrap), B([-5, 26, -3.5], [10, 6, 7], withPattern(bands, (f, x, y) => (f === 'north' && y % 2 === 0 ? 1.2 : 0))),
      B([-7, 32, -4], [14, 3, 8], wrap),
      // the praying hands at the chest
      B([-1.5, 28, -7], [3, 6, 2], bands), B([-4, 27, -6], [8, 2, 2], wrap),
      // the cape of the hood over the shoulders, gold trim, the chain across the chest
      B([-9, 28, -1], [18, 8, 7], withPattern(hoodGold, (f, x, y, w, h) => (y === h - 1 ? '#fff4b0' : (x + y) % 6 === 0 ? 1 : 0))),
      B([-7, 31, -4.6], [14, 1, 0], chain, { mask: (f, x) => x % 2 === 0 }),
    ] },
    { name: 'halo', parent: 'body', pivot: [0, 30, 5], cubes: [
      B([-14, 16, 6], [28, 28, 0], withPattern(haloBrown, (f, x, y, w, h) => { const d = Math.hypot(x - 13.5, y - 13.5); return d > 12.5 ? -0.6 : d > 11 ? 1 : (x + y) % 9 === 0 ? 0.5 : 0; }),
        { mask: (f, x, y, w, h) => Math.hypot(x - 13.5, y - 13.5) <= 14 }) ] },
    { name: 'head', parent: 'body', pivot: [0, 35, 0], cubes: [
      // the long thin face of twisted cloth, a dark slit
      B([-2.5, 35, -3], [5, 11, 5], withPattern(bands, (f, x, y) => (f === 'north' && x === 2 && y < 3 ? '#1a1814' : (x + y) % 3 === 0 ? 1 : 0))),
      // the tall mitre-hood, open in front
      B([-5, 34, -2], [10, 14, 7], withPattern(hoodGold, (f, x, y, w, h) => (x === 0 || x === w - 1 ? 1 : 0)), { mask: (f, x, y, w, h) => f !== 'north' || x === 0 || x === w - 1 }),
      B([-3.5, 48, -1], [7, 3, 5], hoodGold), B([-2, 51, 0], [4, 3, 3], hoodGold), B([-1, 54, 0.5], [2, 2, 2], hoodGold),
      B([-5.5, 41, -2.6], [11, 1, 0], chain, { mask: (f, x) => x % 2 === 0 }),
    ] },
    ...demonArm('arm_l0', 34, -1, -40, 0, 70, true), ...demonArm('arm_r0', 34, 1, -40, 0, 70, true),
    ...demonArm('arm_l1', 30, -1, 5, 0, 15, false), ...demonArm('arm_r1', 30, 1, 5, 0, 15, false),
    ...demonArm('arm_l2', 25, -1, 35, 0, -30, true), ...demonArm('arm_r2', 25, 1, 35, 0, -30, true),
  ],
};

// ===================================================================================================== Vantom
// Features (StS2_Vantom.png): a hunched figure of glossy black ink, head and body one lumpy mass of swelling bubbles
// that sags and drips; glowing yellow-green blisters scattered over it (two larger ones where eyes would be); two
// short stumpy legs ending in feet that melt into puddles; a short left arm hanging, dripping; the right arm a long
// tentacle rising behind and curling over the head, ending in a curved pale-green sickle blade.
const inkGloss = R('#6a6488', '#46425e', '#2e2c42', '#1e1c2e', '#121020', '#0a0814');
const inkSkin = withPattern(inkGloss, (f, x, y, w, h) => (f === 'up' ? -0.6 : 0) + ((x + y * 3) % 11 === 0 ? -1.2 : 0) + (y > h - 3 ? 0.8 : 0) + 1.2);
const blister = glowing(R('#fbffc0', '#e6f08a', '#c4d860'));
const drip = (x, y, z, len) => B([x, y - len, z], [1, len, 0], inkGloss, { mask: (f, px, py, w, h) => py < h - (px % 2) });
const spots = [[-6, 24, -7.6], [4, 27, -7.6], [-2, 18, -6.6], [7, 20, -6.6], [-8, 15, -5.6], [1, 31, -5.6], [-9, 26, 0], [9.6, 23, 2], [-4, 33, 3], [5, 14, 4], [-9.6, 19, -2]];
const vantom = {
  render: 'cutout', glow: true,
  bones: [
    { name: 'body', pivot: [0, 12, 0], cubes: [
      ...loft([sl(10, 14, 18, -6, 6), sl(14, 22, 24, -7.5, 7.5), sl(22, 29, 26, -8, 8), sl(29, 33, 20, -7, 7), sl(33, 35, 12, -5, 5)], inkSkin, 'y'),
      // bubbling lumps on the shoulders and head
      B([-11, 24, -4], [5, 6, 7], inkSkin), B([6, 25, -3], [5, 5, 6], inkSkin), B([-5, 33, -3], [6, 4, 6], inkSkin), B([1, 32, -5], [5, 4, 5], inkSkin), B([-3, 9, -6], [7, 5, 4], inkSkin),
      // the two big glowing blisters for eyes, and the scattered small ones
      B([-5, 27, -7.6], [3, 3, 1], blister), B([2, 28, -7.6], [3, 2, 1], blister),
      ...spots.map(([x, y, z]) => B([x, y, z], [1, 1, 1], blister)),
      // drips hanging off the belly
      ...[[-6, 10, -5.1], [-2, 9, -5.1], [3, 10, -5.1], [6, 11, -5.1], [-8, 14, -6.6], [8, 13, -6.6]].map(([x, y, z], i) => drip(x, y, z, 3 + (i % 3) * 2)),
    ] },
    ...[['leg_l', -1], ['leg_r', 1]].map(([n, s]) => ({ name: n, parent: 'body', pivot: [s * 4, 11, 0], cubes: [
      B([s * 4 - 2.5, 3, -2.5], [5, 8, 5], inkSkin),
      B([s * 4 - 4, 0, -6], [8, 3, 9], inkSkin, { mask: (f, x, y, w, h) => f === 'up' || f === 'down' || y >= (x % 3 === 0 ? 1 : 0) }),   // the melting foot
      B([s * 4 - 5.5, 0.1, -7.5], [11, 0, 12], inkGloss, { mask: (f, x, y, w, h) => Math.hypot(x - 5, (y - 6) * 0.9) <= 5.5 }),          // the puddle round it
    ] })),
    { name: 'arm_l', parent: 'body', pivot: [-9, 26, 0], rot: [0, 0, 20], cubes: [B([-12, 15, -2], [4, 11, 4], inkSkin), drip(-11, 15, -2.1, 4), drip(-9, 15, -2.1, 3)] },
    // the tentacle arm: up behind, over the head, the sickle at the end
    { name: 'arm_r', parent: 'body', pivot: [11, 27, 2], rot: [-15, 0, -5], cubes: [B([10, 27, 0.5], [3, 14, 3], inkSkin)] },
    { name: 'tail', parent: 'arm_r', pivot: [11.5, 41, 2], rot: [0, 0, 70], cubes: [B([10.5, 41, 0.5], [2, 13, 3], inkSkin), B([11, 47, 0.4], [1, 1, 0], blister)] },
    { name: 'tail_1', parent: 'tail', pivot: [11.5, 54, 2], rot: [0, 0, 75], cubes: [
      B([11, 54, 1], [1, 8, 2], inkSkin),
      B([11.5, 60, -5], [0, 6, 14], withPattern(R('#f4ffd8', '#d4ecb0', '#a8c888', '#7c9c64'), (f, x, y) => (y === 0 ? -0.8 : 0)), { mask: (f, x, y, w, h) => { const t = x / (w - 1); return y >= Math.round(1 + 4 * Math.pow(t - 0.4, 2) * 3) && y <= Math.round(3 + 3 * (1 - t)); } }),
    ] },
  ],
};

// ===================================================================================================== Kin Priest
// Features (StS2_Kin_Priest.png): a small, hunched green-skinned figure almost buried under a huge mantle of long
// olive palm fronds, layered and swept back and up like a haystack; a bird's skull worn as a mask - a pale cranium, a
// long beak, one glowing teal eye in the socket; a dark robe and a brown sash under the fronds; a green clawed hand
// gripping a tall staff bound with rope and topped with a green spirit flame; green clawed feet.
const frond = R('#d8dc8a', '#bcc46a', '#9caa52', '#7e8c40', '#626e30');
const frondLeaf = withPattern(frond, (f, x, y, w, h) => (x === Math.floor(w / 2) ? -0.9 : (x % 2 ? 0.5 : 0)) + (y < 2 ? 0.6 : 0));
const kinSkin = R('#a8dca0', '#86c480', '#68a864', '#4e8a4c');
const skull = R('#fffcf0', '#f0ead8', '#d8d0bc', '#bcb29c');
const fronds = [];
for (let i = 0; i < 14; i++) {
  const ring = i < 6 ? 0 : i < 11 ? 1 : 2, k = ring === 0 ? i : ring === 1 ? i - 6 : i - 11, n = ring === 0 ? 6 : ring === 1 ? 5 : 3;
  const yaw = -75 + (150 * k) / Math.max(1, n - 1), y = 22 - ring * 5, len = 20 - ring * 3;
  fronds.push({ name: 'tent_' + i, parent: 'body', pivot: [0, y, 2], rot: [35 - ring * 15, yaw, 0], cubes: [
    B([-3, y, 2], [6, 0, len], frondLeaf, { mask: (f, x, py, w, h) => Math.abs(x - 2.5) <= 3 * Math.sin(Math.PI * Math.min(1, (py + 2) / (h + 2))) + 0.2 }) ] });
}
const kin_priest = {
  render: 'cutout', glow: true,
  bones: [
    { name: 'body', pivot: [0, 8, 0], rot: [18, 0, 0], cubes: [
      ...loft([sl(3, 8, 9, -3.5, 4.5), sl(8, 14, 10, -4, 5), sl(14, 18, 8, -3, 4)], withPattern(R('#5a5e4c', '#46493a', '#34372c', '#26281e'), (f, x, y) => (x % 3 === 0 ? 0.7 : 0)), 'y'),
      B([-5.5, 9, -4.5], [11, 2, 10], R('#a87a48', '#8a5e34', '#6c4626')),                  // the sash
      // the mound of fronds over the back
      ...loft([sl(6, 12, 12, -2, 7), sl(12, 19, 11, -1, 7), sl(19, 22, 8, 0, 6)], frondLeaf, 'y'),
      fringe([-8.5, 3, 9.2], [17, 18, 0], frond, 4, 2), fringe([-8.5, 4, -3.2], [17, 10, 0], frond, 3, 5),
    ] },
    ...fronds,
    { name: 'head', parent: 'body', pivot: [0, 16, -3], cubes: [
      B([-3, 14, -7], [6, 5, 5], skull, { detail: { north: (x, y) => ((x === 1 || x === 4) && y === 2 ? '#1a1814' : null) } }),
      B([-1.5, 13, -13], [3, 3, 6], withPattern(skull, (f, x, y) => (y === 2 ? 0.8 : 0))), B([-1, 12, -15], [2, 2, 2], skull),   // the long beak
      B([-3.5, 15, -6], [1, 2, 2], glowing(R('#d8fff8', '#80f0e0', '#40c8b8'))),            // the glowing eye in its socket
      B([-4, 18, -6], [8, 2, 6], frondLeaf),
    ] },
    { name: 'arm_r', parent: 'body', pivot: [5, 13, -2], rot: [-40, 0, 0], cubes: [B([4, 7, -3.5], [3, 7, 3], kinSkin), B([3.5, 5, -4.5], [4, 3, 4], kinSkin)] },
    { name: 'weapon', parent: 'arm_r', pivot: [5.5, 6, -2.5], rot: [40, 0, 0], cubes: [
      B([5, -9, -3], [2, 34, 2], withPattern(R('#c8a070', '#a07c50', '#7a5a36'), (f, x, y) => (y % 3 === 0 ? '#e0cca0' : 0))),   // rope-bound staff
      B([4, 24, -4], [4, 3, 4], R('#c8a070', '#a07c50')),
      B([3, 27, -3], [6, 7, 0], glowing(R('#e8fff0', '#a0f4c8', '#58dc98')), { mask: (f, x, y, w, h) => Math.abs(x - 2.5) <= (h - y) * 0.45 + 0.3 }),
      B([6, 27, -6], [0, 7, 6], glowing(R('#e8fff0', '#a0f4c8', '#58dc98')), { mask: (f, x, y, w, h) => Math.abs(x - 2.5) <= (h - y) * 0.45 + 0.3 }),
    ] },
    { name: 'arm_l', parent: 'body', pivot: [-5, 12, -2], rot: [-20, 0, 0], cubes: [B([-7, 6, -3], [3, 6, 3], kinSkin)] },
    ...[['leg_l', -1], ['leg_r', 1]].map(([n, s]) => ({ name: n, parent: 'body', pivot: [s * 2.5, 4, 0], rot: [-18, 0, 0], cubes: [
      B([s * 2.5 - 1.5, 1, -1.5], [3, 3, 3], kinSkin), B([s * 2.5 - 2, 0, -4], [4, 1, 4], kinSkin), ...[0, 1, 2].map(k => B([s * 2.5 - 2 + k * 1.5, 0, -5], [1, 1, 1], R('#2a3020', '#1a2014'))) ] })),
  ],
};

// ===================================================================================================== Waterfall Giant
// Features (StS2_Waterfall_Giant.png + a gorilla's stance): a four-legged hulk of stacked grey boulders, the
// shoulders massive and high, the back sloping down to smaller haunches; a craggy rock head jutting low in front of
// the shoulders; thick stone pillar legs, the front ones longer; moss and little plants in the cracks and on top;
// water pouring off it in sheets between the legs.
const rock = R('#c8ccc4', '#a8aea4', '#8a9086', '#6e746c', '#565c54', '#40463e');
const rockSkin = withPattern(rock, (f, x, y, w, h) => (f === 'up' ? (h2(x >> 1, y >> 1, 41) < 30 ? '#7aa858' : -0.4) : (h2(x, y, 43) < 6 ? 1.2 : (x + y) % 7 === 0 ? -0.6 : 0) + (y === 0 && h2(x, 1, 44) < 40 ? '#88b860' : 0)));
const falls = { ramp: ['#e8fcff', '#b0e8fa', '#7ccaf0', '#58aee0'], alpha: 165 };
const fallSheet = withPattern(falls, (f, x, y) => ((x + Math.floor(y / 2)) % 4 === 0 ? -1 : (x % 3 === 0 ? 1 : 0)));
const boulder = (x, y, z, w, h, d) => B([x - w / 2, y, z - d / 2], [w, h, d], rockSkin);
const waterfall_giant = {
  render: 'translucent',
  bones: [
    { name: 'body', pivot: [0, 20, 0], cubes: [
      boulder(0, 20, -10, 26, 14, 16), boulder(-9, 30, -12, 12, 8, 12), boulder(8, 31, -9, 12, 7, 12), boulder(0, 32, -5, 10, 5, 10),   // the great shoulders
      boulder(0, 18, 4, 22, 11, 14), boulder(-6, 27, 3, 10, 5, 9), boulder(5, 26, 6, 10, 5, 9),                                           // the back
      boulder(0, 16, 15, 18, 10, 10), boulder(0, 24, 15, 10, 4, 8),                                                                       // the haunches
      B([-2, 37, -8], [1, 4, 0], R('#9ad070', '#78b050')), B([4, 36, -12], [1, 3, 0], R('#9ad070', '#78b050')), B([-8, 38, -13], [3, 2, 0], R('#b0e080', '#88c060')),
    ] },
    { name: 'head', parent: 'body', pivot: [0, 24, -18], cubes: [
      boulder(0, 17, -24, 13, 11, 11), boulder(0, 20, -29, 9, 7, 3), boulder(-3, 27, -23, 6, 3, 7),
      B([-4, 21, -30.6], [8, 1, 0], R('#c0f0ff', '#80d0f0')),                                       // a trickle from the brow
    ] },
    ...[['leg_fl', -1, -12, 9, 20], ['leg_fr', 1, -12, 9, 20], ['leg_bl', -1, 13, 7, 16], ['leg_br', 1, 13, 7, 16]].map(([n, s, z, t, top]) => ({ name: n, parent: 'body', pivot: [s * 9, top, z], cubes: [
      boulder(s * 9, top - 10, z, t + 2, 11, t + 2), boulder(s * 9, 0, z, t, top - 10, t), boulder(s * 9, 0, z - 1, t + 3, 3, t + 4),
    ] })),
    // the water: sheets pouring off the belly and flanks
    { name: 'tent_0', parent: 'body', pivot: [0, 18, 0], cubes: [
      B([-10, 0, -4], [20, 18, 0], fallSheet), B([-10, 0, 8], [20, 16, 0], fallSheet),
      B([-13.2, 2, -16], [0, 18, 26], fallSheet, { mask: (f, x, y) => (x + y) % 9 !== 0 }), B([13.2, 2, -16], [0, 18, 26], fallSheet, { mask: (f, x, y) => (x + y) % 9 !== 4 }),
    ] },
  ],
};

// ===================================================================================================== Lagavulin Matriarch
// Features (StS2_Lagavulin_Matriarch.png + a hermit crab): a great orange hermit crab living in a heaped shell of
// rounded pale stones veined with orange cracks; a white helmet-like head with one dark visor slit and a glowing eye;
// long jointed orange legs, dark bands at the joints, pointed tips; one huge claw raised, the other smaller.
const crabO = R('#ffd09c', '#f8a860', '#e88838', '#c86a22', '#a05018');
const joint = R('#5a3a28', '#3e281a');
const pebble = R('#fffef6', '#f6f0dc', '#e4dcc2', '#ccc2a4', '#aea486');
const pebbleSkin = withPattern(pebble, (f, x, y) => ((x * 3 + y * 5) % 13 === 0 || (x - y * 2) % 11 === 0 ? '#e09040' : (x + y) % 5 === 0 ? -0.6 : 0));
const stoneHeap = [[0, 10, 8, 16, 12, 14], [-6, 20, 6, 10, 9, 10], [6, 19, 9, 11, 9, 11], [0, 27, 7, 10, 7, 9], [-8, 12, 15, 9, 9, 9], [8, 11, 16, 9, 8, 9],
  [0, 10, 19, 12, 10, 8], [-4, 33, 8, 6, 5, 6], [5, 25, 15, 8, 7, 8], [-9, 23, 13, 7, 6, 7]];
const crabLeg = (name, s, z, len) => [
  { name, parent: 'body', pivot: [s * 6, 9, z], rot: [0, 0, s * -10], cubes: [B([s < 0 ? -6 - len : 6, 8, z - 1.5], [len, 3, 3], withPattern(crabO, (f, x) => (x === 0 ? '#3e281a' : 0)))] },
  { name: name + '_tip', parent: name, pivot: [s * (6 + len), 9, z], rot: [0, 0, s * -55], cubes: [B([s < 0 ? -7 - len : 5 + len, -2, z - 1], [2, 11, 2], withPattern(crabO, (f, x, y) => (y === 10 ? '#3e281a' : 0))), B([s < 0 ? -6.5 - len : 5.5 + len, -5, z - 0.5], [1, 3, 1], joint)] },
];
const lagavulin_matriarch = {
  render: 'cutout', glow: true,
  bones: [
    { name: 'body', pivot: [0, 9, 0], cubes: [
      ...stoneHeap.map(([x, y, z, w, h, d]) => B([Math.round(x * 1.3) - Math.round(w * 1.3) / 2, Math.round(y * 1.25) - 2, Math.round(z * 1.2) - Math.round(d * 1.3) / 2], [Math.round(w * 1.3), Math.round(h * 1.3), Math.round(d * 1.3)], pebbleSkin)),
      B([-6, 5, -8], [12, 7, 10], withPattern(crabO, (f, x, y) => (y % 3 === 0 ? 0.8 : 0))),        // the soft crab body
    ] },
    { name: 'head', parent: 'body', pivot: [0, 10, -8], cubes: [
      B([-4.5, 7, -15], [9, 8, 8], withPattern(R('#ffffff', '#eceae4', '#d2cec4', '#b4aea2'), (f, x, y) => (y === 0 ? 1 : 0)),
        { detail: { north: (x, y) => (y === 3 && x >= 1 && x <= 7 ? (x === 5 ? '#f8f8ff' : '#14141c') : y === 4 && x >= 2 && x <= 6 ? '#24242c' : null) } }),
      B([-5, 14, -14], [10, 2, 7], R('#ffffff', '#eceae4', '#d2cec4')), B([-1, 16, -13], [2, 3, 5], R('#f0ece4', '#d2cec4')),   // the helmet's crest
      B([0.5, 9.5, -15.6], [2, 2, 1], glowing(R('#ffffff', '#d8f4ff', '#a8dcf8'))),
      ...[-1, 1].map(s => B([s * 2.5 - 0.5, 15, -16], [1, 4, 1], crabO)),                           // feelers
    ] },
    // the great claw, raised; the small one held low
    { name: 'arm_r', parent: 'head', pivot: [5, 10, -12], rot: [-12, -22, 0], cubes: [
      B([5, 8, -21], [5, 5, 10], crabO), B([4, 6, -33], [9, 10, 12], withPattern(crabO, (f, x, y) => (h2(x, y, 51) < 8 ? 0.8 : 0))),
      B([5, 11, -44], [6, 4, 11], crabO), B([5, 5, -42], [6, 3, 9], crabO), B([5, 11, -45], [6, 3, 1], R('#fff0d8', '#f8d0a0')) ] },
    { name: 'arm_l', parent: 'head', pivot: [-5, 9, -12], rot: [10, 20, 0], cubes: [
      B([-9, 7, -19], [4, 4, 8], crabO), B([-10, 6, -26], [6, 6, 7], crabO), B([-9.5, 7, -31], [4, 2, 5], crabO), B([-9.5, 5, -30], [4, 2, 4], crabO) ] },
    ...crabLeg('leg_l0', -1, -6, 12), ...crabLeg('leg_r0', 1, -6, 12), ...crabLeg('leg_l1', -1, -1, 14), ...crabLeg('leg_r1', 1, -1, 14), ...crabLeg('leg_l2', -1, 4, 11), ...crabLeg('leg_r2', 1, 4, 11),
  ],
};

// ===================================================================================================== The Insatiable
// Features (StS2_The_Insatiable.png + a sandworm / lamprey): a ringed blue-grey worm bursting up out of a sand mound,
// arching forward; its head opens into a huge flared trumpet of a maw - orange, darkening to a red throat - rimmed by
// long, thin, jointed blue feelers with spiky tips; a paler tan belly stripe along the underside of the rings.
const wormBlue = R('#b8cce0', '#98aec8', '#7a92ae', '#5e7692', '#465c76', '#34465c');
const ringed = withPattern(wormBlue, (f, x, y, w, h) => (f === 'down' ? '#d8c49c' : (f === 'east' || f === 'west') ? (x % 4 === 0 ? 1.2 : x % 4 === 1 ? -0.6 : 0) + (y > h - 3 ? '#d8c49c' : 0) : (y % 4 === 0 ? 1.2 : 0)));
const sand = R('#f4e4b8', '#e4d098', '#ccb47c', '#b09862');
const maw = R('#ffe0a8', '#fbb870', '#ee8a48', '#d0602e', '#a03c20', '#5a1a10');
const feeler = (i, x, y, rx, ry) => ({ name: 'tent_' + i, parent: 'head', pivot: [x, y, -30], rot: [rx, ry, 0], cubes: [
  B([x - 0.5, y - 0.5, -48], [1, 1, 18], R('#4a74b0', '#365a92', '#264474')), ...[0, 1, 2].map(k => B([x - 1, y - 1, -44 + k * 5], [2, 2, 1], R('#4a74b0', '#264474'))) ] });
const insatiable = {
  render: 'cutout',
  bones: [
    { name: 'body', pivot: [0, 0, 6], cubes: [
      ...loft([sl(-6, -2, 20, 0, 4), sl(-2, 14, 28, 0, 6), sl(14, 20, 20, 0, 4)], withPattern(sand, (f, x, y) => ((x * 2 + y) % 5 === 0 ? 0.8 : 0))),
      B([-9, 0, 20], [18, 4, 8], withPattern(sand, (f, x, y) => ((x + y) % 4 === 0 ? 0.8 : 0))),
    ] },
    { name: 'seg_1', parent: 'body', pivot: [0, 4, 6], rot: [-40, 0, 0], cubes: [B([-8, 0, -4], [16, 15, 12], ringed)] },
    { name: 'seg_2', parent: 'seg_1', pivot: [0, 7, -4], rot: [-30, 0, 0], cubes: [B([-7.5, 1, -14], [15, 14, 10], ringed)] },
    { name: 'seg_3', parent: 'seg_2', pivot: [0, 8, -14], rot: [-10, 0, 0], cubes: [B([-7, 1.5, -22], [14, 13, 8], ringed)] },
    { name: 'head', parent: 'seg_3', pivot: [0, 8, -22], rot: [55, 0, 0], cubes: [
      // the trumpet: rings flaring wider towards the lip, the throat dark inside

      B([-8, 2, -26], [16, 13, 4], withPattern(maw, (f, x, y) => (y % 3 === 0 ? 0.6 : 0))),
      B([-10, 0, -29], [20, 17, 3], withPattern(maw, (f, x, y) => (f === 'north' ? 0 : 0.4))),
      B([-12, -2, -31], [24, 21, 2], withPattern(maw, (f, x, y, w, h) => { if (f !== 'north') return 1; const d = Math.hypot(x - (w - 1) / 2, y - (h - 1) / 2); return d < 3 ? '#3a0c08' : d < 5 ? '#7a2414' : d < 7 ? 3 : d < 9 ? 2 : d < 11 ? 1 : 0; }),
        { mask: (f, x, y, w, h) => f !== 'north' || Math.hypot(x - (w - 1) / 2, y - (h - 1) / 2) <= 12 }),
      // a ring of little teeth round the throat
      ...[0, 1, 2, 3, 4, 5, 6, 7].map(k => B([Math.round(Math.cos(k * 0.785) * 4.5) - 0.5, 8 + Math.round(Math.sin(k * 0.785) * 4.5), -31.5], [1, 1, 1], R('#fffaf0', '#e8dcc8'))),
    ] },
    ...[[-11, 16, -20, -25], [11, 16, -20, 25], [-12, 2, 20, -25], [12, 2, 20, 25], [0, 19, -30, 0], [0, -1, 30, 0]].map(([x, y, rx, ry], i) => feeler(i, x, y, rx, ry)),
  ],
};

// ===================================================================================================== humanoids
// Each with the build of its STS2 render, not the vanilla player's.
const { figure } = require('./kit');
function anchors(o) {
  const hipY = o.shin[1] + o.thigh[1], waistY = hipY + o.pelvis[1] - 1, chestY = waistY + o.waist[1], topY = chestY + o.chest[1], shY = topY - 1;
  const sx = o.chest[0] / 2 + o.upperArm[0] / 2 - (o.armIn || 0), elbowY = shY - o.upperArm[1], handY = elbowY - o.foreArm[1] - o.hand[1];
  return { hipY, waistY, chestY, topY, shY, sx, elbowY, handY, headY: topY + (o.neck ? o.neck[1] : 2) - 1 };
}
const steel = R('#e8ecf0', '#c8ced6', '#a6aeb8', '#848c98', '#646c78', '#4a505a');
const plateTeal = R('#bcd8d0', '#96bab2', '#749a92', '#587c76', '#40605a', '#2e4642');
const plate = m => withPattern(m, (f, x, y, w, h) => (y === 0 ? -0.8 : y === h - 1 ? 1 : 0) + (x === 0 || x === w - 1 ? 0.6 : 0) + ((x + y) % 7 === 3 ? -0.4 : 0));
const spike = (x, y, z, h, mat) => B([x, y, z], [1, h, 1], mat);
const leatherB = R('#c8946a', '#a6764e', '#865a38', '#684428');
const clothBlue = R('#9ab8e0', '#7898c8', '#5a7aac', '#42608e', '#304670');
const skinPale = R('#f8e0cc', '#e6c4aa', '#ccA488', '#b08870');
const skinGreen = R('#b4dca8', '#94c486', '#76a86a', '#5a8a50');

// Axe Raider: a squat, broad goblin in spiked teal plate - huge spiked pauldrons, a visored spiked helm, short bowed
// legs, hunched forward; a long double-bladed axe in the right hand, a kite shield on the left arm.
const axeO = { thigh: [4, 5, 4], shin: [3, 5, 4], foot: [4, 2, 6], hipW: 5, legSplay: 8, pelvis: [8, 3, 6], waist: [7, 4, 5], chest: [12, 7, 8],
  upperArm: [4, 5, 4], foreArm: [4, 5, 4], hand: [3, 3, 3], neck: [3, 1, 3], head: [7, 7, 7], lean: 15, armOut: 12, elbow: -30,
  mats: { skin: skinGreen, legs: plate(plateTeal), shins: plate(plateTeal), feet: plateTeal, pelvis: plate(plateTeal), waist: R('#5a4a3a', '#46382a'), chest: plate(plateTeal), arms: plate(plateTeal), hands: plateTeal, head: plate(plateTeal) },
  face: (x, y) => (y === 3 && x >= 1 && x <= 5 ? '#101818' : y === 4 && (x === 2 || x === 4) ? '#e0f0a0' : null) };
{
  const A = anchors(axeO);
  axeO.parts = {
    head: [spike(-0.5, A.headY + 7, -0.5, 3, plateTeal), spike(-4.5, A.headY + 4, -0.5, 3, plateTeal), spike(3.5, A.headY + 4, -0.5, 3, plateTeal)],
    arm_l: [B([-A.sx - 3.5, A.shY - 3, -3.5], [7, 4, 7], plate(plateTeal)), spike(-A.sx - 3, A.shY + 1, -0.5, 3, plateTeal), spike(-A.sx, A.shY + 1, 1, 2, plateTeal)],
    arm_r: [B([A.sx - 3.5, A.shY - 3, -3.5], [7, 4, 7], plate(plateTeal)), spike(A.sx + 2, A.shY + 1, -0.5, 3, plateTeal), spike(A.sx - 1, A.shY + 1, 1, 2, plateTeal)],
    arm_l_low: [B([-A.sx - 4, A.handY - 2, -4.5], [1, 12, 9], withPattern(plateTeal, (f, x, y, w, h) => (x === 0 || y === 0 || x === w - 1 ? -0.8 : (x + y) % 4 === 0 ? 0.7 : 0)), { mask: (f, x, y, w, h) => f !== 'east' && f !== 'west' || Math.abs(x - (w - 1) / 2) <= (w / 2) * Math.min(1, (h - y) / (h * 0.45)) })],
    arm_r_low: [B([A.sx - 0.5, A.handY - 6, -1], [1, 22, 1], leatherB), B([A.sx, A.handY + 9, -7], [0, 8, 14], withPattern(steel, (f, x, y) => (y === 0 || y === 7 ? 1 : 0)),
      { mask: (f, x, y, w, h) => { const d = Math.abs(x - 6.5); return d >= 1.5 && Math.abs(y - 3.5) <= 1 + (d - 1.5) * 0.6; } })],
  };
}
const axe_raider = figure(axeO);

// Assassin Raider: tall and thin, a long-legged duellist in pale steel, a high collar, a small flat pointed cap on a
// narrow head, a long blue cape to the ankles, coat tails; a long thin rapier held low and forward.
const assO = { thigh: [3, 8, 3], shin: [3, 8, 3], foot: [3, 1, 5], hipW: 4, pelvis: [7, 3, 5], waist: [6, 5, 4], chest: [8, 7, 5],
  upperArm: [2, 7, 2], foreArm: [2, 7, 2], hand: [2, 2, 2], neck: [2, 2, 2], head: [5, 6, 5], armOut: 6, elbow: -15,
  mats: { skin: skinPale, legs: plate(steel), shins: plate(steel), feet: R('#5a6070', '#3e4450'), pelvis: R('#c8d4e8', '#a8b8d0'), waist: plate(steel), chest: plate(steel), arms: plate(steel), head: steel },
  face: (x, y) => (y === 2 && x >= 1 && x <= 3 ? '#20262e' : null) };
{
  const A = anchors(assO);
  assO.parts = {
    head: [B([-4, A.headY + 6, -4], [8, 1, 8], steel), B([-2, A.headY + 7, -2], [4, 1, 4], steel), B([-0.5, A.headY + 8, -0.5], [1, 1, 1], steel)],
    body: [B([-4.5, A.topY - 2, -3.5], [9, 4, 7], plate(steel)), B([-4, A.hipY - 9, -3], [8, 9, 0], withPattern(R('#c8d4e8', '#a8b8d0', '#8898b4'), (f, x) => (x % 2 ? 0.6 : 0)), { mask: (f, x, y, w, h) => y < h - (x % 3) })],
    arm_r_low: [B([A.sx, A.handY - 1, -16], [0, 1, 17], R('#f4f8fc', '#c8d0dc')), B([A.sx - 1, A.handY - 1, -0.5], [2, 2, 1], R('#f6d262', '#d6a232'))],
  };
  assO.extra = [{ name: 'cape', parent: 'body', pivot: [0, A.topY, 3], rot: [6, 0, 0], cubes: [B([-5.5, 1, 3], [11, A.topY - 1, 0], withPattern(clothBlue, (f, x, y) => (x % 3 === 0 ? 1 : 0)), { mask: (f, x, y, w, h) => y < h - (x % 2) })] }];
}
const assassin_raider = figure(assO);

// Brute Raider: a towering thug - a deep barrel chest in a padded red gambeson with a belt, huge thick arms wrapped in
// grey cloth, a small dark horned helm with an eye slit, thick legs with knee guards and heavy boots.
const brO = { thigh: [5, 6, 5], shin: [5, 6, 5], foot: [6, 2, 7], hipW: 6, pelvis: [12, 3, 7], waist: [12, 5, 8], chest: [16, 9, 10],
  upperArm: [6, 7, 6], foreArm: [6, 7, 6], hand: [5, 4, 5], neck: [5, 1, 4], head: [6, 6, 6], lean: 8, armOut: 10, armIn: 1,
  mats: { skin: skinPale, legs: withPattern(R('#d8ccc0', '#bcae9e', '#9e8e7e'), (f, x, y) => (y % 3 === 0 ? 0.8 : 0)), shins: R('#d8ccc0', '#bcae9e', '#9e8e7e'), feet: R('#6a5040', '#4c3828'),
    pelvis: withPattern(R('#e88070', '#c8584a', '#a04036', '#7a2e26'), (f, x, y) => (x % 3 === 0 ? 0.8 : 0)), waist: withPattern(R('#e88070', '#c8584a', '#a04036', '#7a2e26'), (f, x, y) => (y % 2 === 0 ? 0.7 : 0)),
    chest: withPattern(R('#e88070', '#c8584a', '#a04036', '#7a2e26'), (f, x, y) => (y % 2 === 0 ? 0.7 : 0) + (x % 4 === 0 ? 0.5 : 0)), arms: withPattern(R('#d8d4cc', '#b8b2a8', '#989086'), (f, x, y) => ((x + y) % 3 === 0 ? 0.8 : 0)), hands: R('#c8b4a0', '#a8927c'), head: plate(R('#7a7480', '#5a5462', '#423e4a', '#2e2a36')) },
  face: (x, y) => (y === 3 && x >= 1 && x <= 4 ? '#0c0a10' : null) };
{
  const A = anchors(brO);
  brO.parts = {
    body: [B([-6.5, A.waistY + 1, -4.5], [13, 2, 9], R('#6a4a30', '#4c3420')), B([-1, A.waistY + 1, -4.8], [2, 2, 0], R('#f6d262', '#c89a30'))],
    head: [B([-5, A.headY + 4, -1], [2, 4, 2], R('#e8e0d0', '#c8bea8')), B([3, A.headY + 4, -1], [2, 4, 2], R('#e8e0d0', '#c8bea8'))],
    leg_l_low: [B([-3 - 3, 9, -3.5], [6, 3, 1], plate(steel))], leg_r_low: [B([3 - 3, 9, -3.5], [6, 3, 1], plate(steel))],
    arm_l: [B([-A.sx - 4, A.shY - 3, -4], [8, 4, 8], plate(steel))], arm_r: [B([A.sx - 4, A.shY - 3, -4], [8, 4, 8], plate(steel))],
  };
}
const brute_raider = figure(brO);

// Crossbow Raider: a lean shooter under a wide-brimmed, pointed grey hat with a feather, the face in shadow but for
// two eyes; a grey tunic with puffed sleeves, black breeches, pale strapped boots, a dark cape; a heavy crossbow held
// level across the chest.
const xbO = { thigh: [3, 6, 3], shin: [3, 6, 3], foot: [4, 2, 5], hipW: 4, pelvis: [8, 3, 5], waist: [7, 4, 5], chest: [9, 6, 6],
  upperArm: [4, 5, 4], foreArm: [2, 5, 2], hand: [2, 2, 2], neck: [2, 1, 2], head: [5, 5, 5], armFwd: -35, elbow: -55, armIn: 1,
  mats: { skin: R('#4a4450', '#332e38'), legs: R('#3a3a44', '#2a2a32', '#1c1c24'), shins: R('#d8d0c8', '#bcb2a8'), feet: R('#8a7a6a', '#6a5a4c'), pelvis: R('#3a3a44', '#2a2a32'),
    waist: R('#c8c4bc', '#a8a49c', '#88847c'), chest: withPattern(R('#d8d4cc', '#b8b4ac', '#989488', '#787468'), (f, x) => (x % 2 ? 0.6 : 0)), arms: withPattern(R('#d8d4cc', '#b8b4ac', '#989488'), (f, x) => (x % 2 ? 0.7 : 0)), fore: R('#b8b4ac', '#989488'), hands: R('#c8a888', '#a88868') },
  face: (x, y) => (y === 2 && (x === 1 || x === 3) ? '#f4f0d8' : null) };
{
  const A = anchors(xbO);
  xbO.parts = {
    head: [B([-6, A.headY + 4, -6], [12, 1, 12], withPattern(R('#a8a8b0', '#88888f', '#6a6a72'), (f, x, y) => ((x + y) % 5 === 0 ? 0.6 : 0))), B([-3, A.headY + 5, -3], [6, 3, 6], R('#a8a8b0', '#88888f')),
      B([-1.5, A.headY + 8, -1.5], [3, 3, 3], R('#a8a8b0', '#88888f')), B([-0.5, A.headY + 11, -0.5], [1, 2, 1], R('#a8a8b0', '#88888f')), B([2, A.headY + 6, 2.5], [0, 6, 3], R('#e8e0d0', '#c8bea8'))],
    body: [B([-7, A.chestY + 2, -9], [14, 1, 1], R('#c89058', '#a06c38', '#7a4e24')), B([-1, A.chestY + 1, -12], [2, 3, 12], R('#a87a48', '#86602e')), B([-0.5, A.chestY + 4, -11], [1, 1, 8], R('#e8e0d0', '#c8bea8')),
      ...[-1, 1].map(s => B([s * 6.5 - 0.5, A.chestY + 2.5, -8.5], [1, 0, 8], R('#e0d8c8', '#c0b8a8')))],
  };
  xbO.extra = [{ name: 'cape', parent: 'body', pivot: [0, A.topY, 3], cubes: [B([-5, 3, 3], [10, A.topY - 3, 0], withPattern(R('#5a4a40', '#40342c', '#2c241e'), (f, x) => (x % 3 === 0 ? 1 : 0)), { mask: (f, x, y, w, h) => y < h - (x % 3) })] }];
}
const crossbow_raider = figure(xbO);

// Tracker Raider: a hunched old hunter in a tan hooded cloak, bald grey head thrust forward, long arms down to the
// knuckles; a black bristle-maned boar-hound at heel.
const trO = { thigh: [4, 5, 4], shin: [3, 5, 3], foot: [4, 2, 5], hipW: 5, pelvis: [9, 3, 6], waist: [9, 4, 7], chest: [12, 7, 9],
  upperArm: [3, 7, 3], foreArm: [3, 7, 3], hand: [3, 3, 3], neck: [3, 2, 3], head: [5, 5, 6], lean: 45, headTilt: -40, headFwd: -3, armFwd: 10,
  mats: { skin: R('#c8c4b8', '#a8a498', '#8a867a'), legs: R('#7a6a52', '#5e503c'), shins: R('#7a6a52', '#5e503c'), feet: R('#4a3a2a', '#342818'), pelvis: R('#c8a878', '#a88a5c'),
    waist: withPattern(R('#d8b888', '#bc9a6a', '#9c7c50', '#7a5e3a'), (f, x) => (x % 3 === 0 ? 0.7 : 0)), chest: withPattern(R('#d8b888', '#bc9a6a', '#9c7c50', '#7a5e3a'), (f, x, y) => ((x + y) % 4 === 0 ? 0.7 : 0)), arms: R('#d8b888', '#bc9a6a', '#9c7c50'), hands: R('#c8c4b8', '#a8a498') },
  face: (x, y) => (y === 2 && (x === 1 || x === 3) ? '#1a1814' : y === 4 && x >= 1 && x <= 3 ? '#6a665c' : null) };
{
  const A = anchors(trO);
  trO.parts = { body: [B([-7, A.chestY + 2, -1], [14, 7, 9], withPattern(R('#d8b888', '#bc9a6a', '#9c7c50'), (f, x, y) => ((x + y) % 4 === 0 ? 0.7 : 0)))],
    head: [B([-3.5, A.headY - 1, -1.5], [7, 6, 7], R('#d8b888', '#bc9a6a', '#9c7c50'), { mask: (f, x, y, w, h) => f !== 'north' })] };
  const hog = R('#5a524c', '#423c38', '#2e2a28', '#1e1c1a');
  trO.extra = [{ name: 'tail', parent: 'body', pivot: [11, 6, 0], rot: [-45, 0, 0], cubes: [
    B([8, 3, -6], [7, 7, 13], withPattern(hog, (f, x, y) => (x % 2 ? 0.6 : -0.3))), fringe([10.5, 9, -6], [2, 4, 13], R('#3a3634', '#262220')),
    B([8.5, 2, -11], [6, 5, 5], hog, { detail: { north: (x, y) => ((x === 1 || x === 4) && y === 1 ? '#e04040' : y === 4 && (x === 0 || x === 5) ? '#f0e8d8' : null) } }),
    B([9.5, 2, -13], [4, 3, 2], R('#7a6a64', '#5a4c46')),
    ...[[8.5, -5], [12.5, -5], [8.5, 4], [12.5, 4]].map(([x, z]) => B([x, -1, z], [2, 4, 2], hog)) ] }];
}
const tracker_raider = figure(trO);

// the cultists: crouched wide in long sea-blue robes; a pale teal fish head with a long snout, catfish barbels
// hanging round the mouth, round side eyes; the calcified one crowned with white coral; a shepherd's hook in one
// hand, a barbed spear in the other; teal webbed hands and feet.
const fishSkin = R('#d4f4ec', '#acdcd0', '#86c0b4', '#64a296', '#4a847a');
const robe = R('#8cb0c8', '#6c90aa', '#52748e', '#3c5a72', '#2a4258');
const robeP = withPattern(robe, (f, x, y) => (y % 4 === 0 ? '#c8a86a' : (x + y) % 5 === 0 ? 0.6 : 0));
function cultist(crown, robeMat) {
  const o = { thigh: [4, 5, 4], shin: [3, 5, 3], foot: [4, 1, 6], hipW: 7, legSplay: 18, pelvis: [10, 3, 6], waist: [8, 5, 5], chest: [10, 6, 7],
    upperArm: [3, 6, 3], foreArm: [3, 6, 3], hand: [3, 2, 3], neck: [3, 2, 3], head: [6, 6, 7], lean: 18, headTilt: -10, headFwd: -1, armOut: 30, elbow: -40,
    mats: { skin: fishSkin, legs: robeMat, shins: fishSkin, feet: fishSkin, pelvis: robeMat, waist: robeMat, chest: robeMat, arms: robeMat, fore: fishSkin, hands: fishSkin, head: fishSkin },
    face: (x, y) => (y === 2 && (x === 0 || x === 5) ? '#101818' : null) };
  const A = anchors(o);
  o.parts = {
    body: [B([-6, A.hipY - 6, -4], [12, 7, 8], robeMat, { mask: (f, x, y, w, h) => y < h - (x % 3 === 0 ? 1 : 0) })],   // the robe's skirt
    head: [B([-2, A.headY, -9], [4, 3, 6], fishSkin), ...[-1.5, -0.5, 0.5, 1.5].map((x, i) => B([x - 0.5, A.headY - 4 - (i % 2) * 2, -8], [1, 4 + (i % 2) * 2, 1], R('#86c0b4', '#64a296'))),
      ...[-1, 1].map(s => B([s < 0 ? -3.6 : 2.6, A.headY + 3, -3], [1, 2, 2], R('#f4f0b0', '#101010'))),
      ...(crown ? [B([-3, A.headY + 6, -3], [6, 2, 6], withPattern(R('#ffffff', '#ece8e0', '#d4ccbc'), (f, x, y) => ((x + y) % 2 ? 0.8 : 0))), ...[[-2, 0], [0, -2], [2, 1], [-1, 2]].map(([x, z]) => B([x - 0.5, A.headY + 8, z - 0.5], [1, 3, 1], R('#ffffff', '#e8e2d6')))]
        : [fringe([-3.5, A.headY + 1, 3.6], [7, 6, 0], R('#6a8a6a', '#4a6a4a'), 2, 3)])],
    arm_l_low: [B([-A.sx - 0.5, A.handY - 10, -0.5], [1, 28, 1], R('#d8c8a8', '#b4a484')), B([-A.sx - 0.5, A.handY + 17, -0.5], [4, 1, 1], R('#d8c8a8', '#b4a484')), B([-A.sx + 2.5, A.handY + 14, -0.5], [1, 3, 1], R('#d8c8a8', '#b4a484'))],
    arm_r_low: [B([A.sx - 0.5, A.handY - 8, -0.5], [1, 30, 1], leatherB), B([A.sx - 1.5, A.handY + 21, -0.5], [3, 5, 0], steel, { mask: (f, x, y, w, h) => Math.abs(x - 1) <= (h - y) * 0.4 })],
  };
  return figure(o);
}
const calcified_cultist = cultist(true, robeP);
const damp_cultist = cultist(false, withPattern(R('#7aa0b0', '#5a8094', '#406478', '#2c4c5e'), (f, x, y) => (y % 5 === 0 ? '#8aa870' : (x + y) % 4 === 0 ? 0.6 : 0)));

// Gremlin Merc: a short cutthroat under an enormous bucket-shaped horned hood, the face a dark hole with a gaping
// mouth hole; a blue-teal robe with a sash, a red ragged cape, skinny arms and legs, a dagger.
const gremO = { thigh: [2, 3, 2], shin: [2, 3, 2], foot: [3, 1, 4], hipW: 3, pelvis: [6, 2, 4], waist: [6, 3, 4], chest: [7, 4, 5],
  upperArm: [2, 4, 2], foreArm: [2, 3, 2], hand: [2, 2, 2], neck: [2, 1, 2], head: [6, 6, 6], elbow: -40,
  mats: { skin: R('#3a2a20', '#2a1e16'), legs: R('#4a3a2c', '#34281e'), feet: R('#2a1e16', '#1c140e'), pelvis: R('#8aa098', '#6c8078'), waist: withPattern(R('#8aa8c0', '#6a88a2', '#4e6c86'), (f, x) => (x % 3 === 0 ? 0.6 : 0)),
    chest: withPattern(R('#8aa8c0', '#6a88a2', '#4e6c86'), (f, x, y) => (y === 0 ? '#c8a058' : 0)), arms: R('#8aa8c0', '#6a88a2'), fore: R('#3a2a20', '#2a1e16'), hands: R('#3a2a20', '#2a1e16') } };
{
  const A = anchors(gremO), hd = R('#e8a060', '#c8803e', '#a4622a', '#7c461c');
  gremO.parts = {
    head: [B([-5, A.headY - 1, -5], [10, 11, 10], withPattern(hd, (f, x, y) => ((x + y) % 4 === 0 ? 0.6 : 0)), { detail: { north: (x, y, w, h) => { const d = Math.hypot(x - 4.5, (y - 5) * 0.8); return d < 2.4 ? '#100806' : d < 3.6 ? '#2a1a12' : null; } } }),
      B([-7, A.headY + 7, -1], [2, 4, 2], R('#f4e8c8', '#d8c8a0')), B([5, A.headY + 7, -1], [2, 4, 2], R('#f4e8c8', '#d8c8a0')), B([-7.5, A.headY + 10, -1.5], [2, 2, 2], R('#f4e8c8', '#d8c8a0')), B([5.5, A.headY + 10, -1.5], [2, 2, 2], R('#f4e8c8', '#d8c8a0'))],
    arm_r_low: [B([A.sx - 0.5, A.handY - 5, -0.5], [1, 5, 2], steel)],
  };
  gremO.extra = [{ name: 'cape', parent: 'body', pivot: [0, A.topY, 2.5], cubes: [B([-4, 0, 2.6], [8, A.topY, 0], withPattern(R('#c05040', '#9a3a2e', '#742a20'), (f, x) => (x % 2 ? 0.6 : 0)), { mask: (f, x, y, w, h) => y < h - (x % 3) })] }];
}
const gremlin_merc = figure(gremO);

// Sneaky Gremlin: a pink, pot-bellied little demon - a big round head with curled grey horns, cyan eyes and a toothy
// grin, a long brown scarf, tiny hands gripping a dagger as long as itself, stubby legs.
const pink = R('#ffb4c4', '#f490a8', '#dc7090', '#bc5474', '#963c5a');
const sneO = { thigh: [3, 3, 3], shin: [3, 2, 3], foot: [4, 1, 5], hipW: 4, pelvis: [8, 3, 6], waist: [9, 4, 7], chest: [8, 4, 6],
  upperArm: [2, 4, 2], foreArm: [2, 3, 2], hand: [2, 2, 2], neck: [3, 1, 3], head: [9, 8, 8], armFwd: -50, headFwd: -1,
  mats: { skin: pink, legs: pink, pelvis: pink, waist: withPattern(pink, (f, x, y) => (f === 'north' && y < 3 ? -0.8 : 0)), chest: pink, arms: pink, head: pink },
  face: (x, y) => (y === 3 && (x === 1 || x === 2 || x === 6 || x === 7) ? (x === 2 || x === 7 ? '#80fff0' : '#20c0b0') : y === 5 && x >= 2 && x <= 6 ? (x % 2 ? '#fffaf0' : '#5a1828') : y === 6 && x >= 3 && x <= 5 ? '#5a1828' : null) };
{
  const A = anchors(sneO), horn = R('#d8dce8', '#b4b8c8', '#9094a8');
  sneO.parts = {
    head: [B([-6.5, A.headY + 5, -1], [2, 2, 2], horn), B([-7.5, A.headY + 7, -1], [2, 2, 2], horn), B([-7, A.headY + 9, 0], [2, 1, 1], horn), B([4.5, A.headY + 5, -1], [2, 2, 2], horn), B([5.5, A.headY + 7, -1], [2, 2, 2], horn), B([5, A.headY + 9, 0], [2, 1, 1], horn)],
    body: [B([-5, A.topY - 3, -4], [10, 3, 8], withPattern(R('#a86a40', '#88502c', '#6a3c1e'), (f, x) => (x % 2 ? 0.6 : 0))), B([3, A.waistY - 4, -4.2], [3, 9, 0], R('#a86a40', '#88502c'), { mask: (f, x, y, w, h) => y < h - (x % 2) })],
    arm_r_low: [B([A.sx - 0.5, A.handY - 1, -15], [1, 2, 14], withPattern(steel, (f, x, y) => (y === 0 ? 1 : 0))), B([A.sx - 1.5, A.handY - 1, -1], [3, 2, 1], R('#7a5a3a', '#5a4028'))],
  };
}
const sneaky_gremlin = figure(sneO);

// Fat Gremlin: a round red gremlin waddling under a huge burlap sack balanced on its head, marked with a red rune.
const red = R('#ffa088', '#f07860', '#d45a44', '#b04232', '#883024');
const fatO = { thigh: [3, 2, 3], shin: [3, 2, 3], foot: [4, 1, 4], hipW: 4, pelvis: [9, 3, 7], waist: [10, 5, 8], chest: [9, 3, 7],
  upperArm: [2, 3, 2], foreArm: [2, 3, 2], hand: [2, 2, 2], neck: [3, 1, 3], head: [7, 6, 6], armOut: 150, elbow: 0,
  mats: { skin: red, legs: red, pelvis: red, waist: withPattern(red, (f, x, y) => (y === 2 ? '#3a2418' : 0)), chest: red, arms: red, head: red },
  face: (x, y) => (y === 2 && (x === 1 || x === 5) ? '#60f0e0' : y === 4 && x >= 1 && x <= 5 ? (x % 2 ? '#fffaf0' : '#5a1810') : null) };
{
  const A = anchors(fatO), sack = R('#f4e0b0', '#e0c890', '#c8ac70', '#a88c54');
  fatO.parts = { head: [B([-5, A.headY + 6, -4], [10, 9, 9], withPattern(sack, (f, x, y) => (f === 'north' && ((x === 4 && y > 2 && y < 7) || (y === 4 && x > 2 && x < 7)) ? '#c03020' : (x + y) % 3 === 0 ? 0.6 : 0))), B([-2, A.headY + 15, -1], [4, 3, 3], sack)] };
}
const fat_gremlin = figure(fatO);

// Punch Construct: a golden clockwork boxer - an angular plated torso narrowing to the waist, ball joints, thin
// segmented limbs, a rounded head with a wrap-around cyan visor, two huge blocky fists up in guard.
const brass2 = R('#fff0b8', '#f2d88e', '#dcbc6a', '#bc9a4c', '#987834', '#745a24');
const brassP = withPattern(brass2, (f, x, y, w, h) => (x === 0 || y === 0 ? 1 : x === w - 1 ? -0.6 : (x * 3 + y) % 7 === 0 ? 0.6 : 0));
const pcO = { thigh: [3, 7, 3], shin: [3, 7, 3], foot: [4, 2, 6], hipW: 5, legSplay: 12, knee: 20, pelvis: [7, 3, 5], waist: [5, 4, 4], chest: [12, 8, 7],
  upperArm: [3, 6, 3], foreArm: [3, 5, 3], hand: [6, 6, 6], neck: [3, 2, 3], head: [6, 6, 6], armFwd: -60, elbow: -70, armOut: 15,
  mats: { skin: brassP, legs: brassP, pelvis: brassP, waist: brassP, chest: brassP, arms: brassP, hands: brassP, head: brassP },
  face: (x, y) => (y >= 2 && y <= 3 ? (y === 2 ? '#c0faff' : '#40b8d8') : null) };
{
  const A = anchors(pcO);
  pcO.parts = { body: [...[-1, 1].map(s => B([s * A.sx - 2, A.shY - 2, -2], [4, 4, 4], brassP)), ...[-1, 1].map(s => B([s * 2.5 - 2, A.hipY - 2, -2], [4, 3, 4], brassP))],
    head: [B([-3.5, A.headY + 1.5, -3.6], [7, 2, 0], glowing(R('#d8ffff', '#80f0ff', '#40c0e0')))] };
  pcO.glow = true;
}
const punch_construct = figure(pcO);

const at = (pts, c) => (x, y) => (pts.some(([a, b]) => a === x && b === y) ? c : null);
// ===================================================================================================== elites
// Entomancer: a lean figure lunging forward, one leg bent ahead, the other stretched back; a fitted dark-green suit and
// boots; a tall boxy hood and cloak of yellow with black leopard spots - on the left the cloak's sleeve becomes a huge
// three-fingered spotted claw; a long staff with a golden sun-wheel head held low and forward in the right hand.
const leopard = withPattern(R('#fff07a', '#f2d84a', '#dcbc2e', '#b89a22', '#8e7418'), (f, x, y) => { const v = h2(x >> 1, y >> 1, 11); return v < 14 ? (v < 6 ? '#1c1a10' : '#3a2e14') : 0; });
const suitG = withPattern(R('#8a9a68', '#6c7c50', '#52603c', '#3c482c'), (f, x, y) => (y % 4 === 0 ? 0.6 : 0));
const entO = { thigh: [3, 7, 3], shin: [3, 7, 3], foot: [3, 2, 5], hipW: 4, pelvis: [7, 3, 5], waist: [6, 4, 4], chest: [8, 6, 5],
  upperArm: [3, 6, 3], foreArm: [2, 6, 2], hand: [2, 2, 2], neck: [2, 2, 2], head: [5, 6, 5], lean: 20, headTilt: -15,
  mats: { skin: R('#e8c4a4', '#c8a080'), legs: suitG, shins: suitG, feet: R('#4a5236', '#343a26'), pelvis: suitG, waist: suitG, chest: suitG, arms: leopard, fore: suitG, hands: R('#e8c4a4', '#c8a080'), head: R('#e8c4a4', '#c8a080') },
  face: (x, y) => (y === 3 && (x === 1 || x === 3) ? '#1a1410' : null) };
{
  const A = anchors(entO);
  entO.parts = {
    head: [B([-3.5, A.headY - 1, -3.5], [7, 9, 7], leopard, { mask: (f, x, y, w, h) => f !== 'north' || !(x >= 1 && x <= w - 2 && y >= 2) }), B([-3, A.headY + 8, -2.5], [6, 3, 6], leopard)],
    // the left sleeve: a great three-fingered claw
    arm_l_low: [B([-A.sx - 3, A.handY - 2, -4], [6, 6, 7], leopard), ...[-2, 0, 2].map((z, i) => B([-A.sx - 3.5 + i * 0.5, A.handY - 8 + (i % 2), z - 0.5], [1, 7, 1], leopard))],
  };
  entO.extra = [
    { name: 'cloak', parent: 'body', pivot: [0, A.topY, 3], rot: [15, 0, 0], cubes: [B([-6, A.hipY - 6, 3], [12, A.topY - A.hipY + 6, 0], leopard, { mask: (f, x, y, w, h) => y < h - (x % 3) })] },
    { name: 'spear', parent: 'arm_r_low', pivot: [A.sx, A.handY + 1, 0], rot: [-70, 0, 0], cubes: [
      B([A.sx - 0.5, A.handY - 14, -0.5], [1, 30, 1], R('#5a4632', '#463626', '#34281c')),
      B([A.sx, A.handY + 15, -2.5], [0, 5, 5], R('#fff2b0', '#f6d262', '#d6a232'), { mask: (f, x, y) => Math.hypot(x - 2, y - 2) <= 2.6 && !(Math.hypot(x - 2, y - 2) < 1.2) }),
      ...[0, 1, 2, 3].map(k => B([A.sx, A.handY + 17 + Math.round(Math.sin(k * 1.57) * 3.5), Math.round(Math.cos(k * 1.57) * 3.5) - 0.5], [0, 1, 1], R('#fff2b0', '#d6a232'))) ] },
  ];
}
const entomancer = figure(entO);

// Bygone Effigy: a classical statue in weathered grey-green stone - a toga draped over one shoulder, the other
// shoulder and the chest bare, curly hair, a long scythe held upright in the right hand, a fold of cloth in the left;
// on a square plinth with mouldings and moss in the cracks.
const statue = withPattern(R('#dce4d4', '#c0cab8', '#a2ae9c', '#84907e', '#687462', '#505a4a'), (f, x, y) => (h2(x, y, 3) < 5 ? 1.2 : h2(x, y, 7) < 4 ? -0.6 : 0));
const toga = withPattern(R('#dce4d4', '#c0cab8', '#a2ae9c', '#84907e', '#687462'), (f, x, y) => ((x + Math.floor(y / 2)) % 4 === 0 ? 1.1 : (x + Math.floor(y / 2)) % 4 === 1 ? -0.5 : 0));
const effO = { thigh: [4, 7, 4], shin: [3, 7, 3], foot: [4, 1, 5], hipW: 4, pelvis: [9, 3, 6], waist: [8, 5, 5], chest: [11, 8, 6],
  upperArm: [3, 7, 3], foreArm: [3, 6, 3], hand: [3, 3, 3], neck: [3, 2, 3], head: [5, 6, 6], elbow: -20,
  mats: { skin: statue, legs: toga, shins: statue, feet: statue, pelvis: toga, waist: toga, chest: statue, arms: statue, head: statue },
  face: (x, y) => ((x === 1 || x === 3) && y === 2 ? '#6c786a' : y === 4 && x === 2 ? '#8a9488' : null) };
{
  const A = anchors(effO);
  // the plinth raises everything 6 px: it is its own bone at the bottom
  effO.parts = {
    body: [B([-6, A.hipY - 8, -4], [12, 9, 8], toga, { mask: (f, x, y, w, h) => y < h - (x % 3 === 0 ? 1 : 0) }), B([-6, A.chestY, -3.5], [6, 8, 7], toga)],   // the skirt of the toga, the drape over the left shoulder
    head: [B([-3, A.headY + 4, -3], [6, 3, 7], withPattern(statue, (f, x, y) => ((x + y) % 2 ? 0.9 : 0)))],                                          // curls
    arm_l_low: [B([-A.sx - 2, A.handY - 7, -1.5], [3, 8, 3], toga, { mask: (f, x, y, w, h) => y < h - (x % 2) })],
  };
  effO.extra = [
    { name: 'weapon', parent: 'arm_r_low', pivot: [A.sx, A.handY + 1, 0], cubes: [B([A.sx - 0.5, A.handY - 16, -0.5], [1, 40, 1], statue),
      B([A.sx, A.handY + 20, -12], [0, 6, 13], statue, { mask: (f, x, y, w, h) => y >= Math.round((w - 1 - x) * 0.25) && y <= Math.round((w - 1 - x) * 0.25) + 2 - (x < 3 ? 1 : 0) })] },
  ];
}
const bygoneBase = figure(effO);
const bygone_effigy = { ...bygoneBase, bones: [
  { name: 'plinth', pivot: [0, 0, 0], cubes: [B([-8, 0, -8], [16, 2, 16], statue), B([-7, 2, -7], [14, 6, 14], withPattern(statue, (f, x, y) => (y === 0 || y === 5 ? 1 : h2(x, y, 9) < 12 ? '#7aa060' : 0))), B([-8, 8, -8], [16, 1, 16], statue)] },
  ...bygoneBase.bones.map(b => b.name === 'body' ? { ...b, parent: 'plinth', pivot: [b.pivot[0], b.pivot[1] + 9, b.pivot[2]], cubes: b.cubes.map(c => ({ ...c, from: [c.from[0], c.from[1] + 9, c.from[2]] })) }
    : { ...b, pivot: [b.pivot[0], b.pivot[1] + 9, b.pivot[2]], cubes: b.cubes.map(c => ({ ...c, from: [c.from[0], c.from[1] + 9, c.from[2]] })) }),
] };

// Phrog Parasite: a bloated round sac of yellow-green, darker blotches and pits, sitting on a pair of dark frog
// legs; orange segmented worms bursting out all over it and curling in every direction.
const sacY = withPattern(R('#f8f48c', '#e2dc60', '#c4bc3c', '#a09a2a', '#7a741e'), (f, x, y) => (h2(x >> 1, y >> 1, 12) < 12 ? '#4a4818' : h2(x, y, 13) < 6 ? 1.2 : 0));
const wormOr = withPattern(R('#ffcc88', '#f4a860', '#d88440', '#b0642c'), (f, x, y) => (y % 2 === 0 ? 1 : 0));
const parasiteWorms = [];
for (let i = 0; i < 12; i++) {
  const a = i * 2.4, up = (i % 3) - 0.5, dx = Math.cos(a), dz = Math.sin(a), x0 = Math.round(dx * 8), z0 = Math.round(dz * 8), y0 = 13 + Math.round(up * 5);
  // each worm: four segments stepping outward and curling up, the tip darker
  parasiteWorms.push({ name: 'tent_' + i, parent: 'body', pivot: [x0, y0, z0], cubes: [0, 1, 2, 3, 4, 5].map(k => B(
    [x0 + Math.round(dx * k * 1.1) - 1, y0 + Math.round(k * 1.1 + (k > 2 ? (k - 2) * 0.6 : 0)), z0 + Math.round(dz * k * 1.1) - 1], [2, 2, 2], k === 5 ? R('#c86a30', '#8a4020') : wormOr)) });
}
const phrog_parasite = {
  render: 'cutout',
  bones: [
    { name: 'body', pivot: [0, 13, 0], cubes: [...loft([sl(5, 7, 10, -5, 5), sl(7, 10, 14, -7, 7), sl(10, 18, 17, -8.5, 8.5), sl(18, 21, 14, -7, 7), sl(21, 23, 9, -4.5, 4.5)], sacY, 'y')] },
    ...parasiteWorms,
    ...[['leg_l', -1], ['leg_r', 1]].map(([n, s]) => ({ name: n, parent: 'body', pivot: [s * 5, 7, 2], cubes: [
      B([s * 5 - 2, 3, -1], [4, 5, 6], R('#5a6a40', '#46532e', '#343e22')), B([s * 5 - 1.5, 0, -3], [3, 3, 3], R('#5a6a40', '#46532e')),
      B([s * 5 - 3, 0, -6], [6, 1, 4], R('#5a6a40', '#46532e'), { mask: (f, x, y) => f !== 'up' || x % 2 === 0 || y > 1 }) ] })),
  ],
};

// Skulking Colony: a lurching figure grown of coral - rust-red branching coral for legs, hips and one arm, pale
// lilac-blue translucent coral on the shoulders and the other arm, long branching fingers, and a bleached bone tube
// standing up for a head.
const coralR = withPattern(R('#f4907c', '#dc6a58', '#bc4c40', '#963832', '#702826'), (f, x, y) => (h2(x, y, 21) < 14 ? 1.2 : (x + y) % 3 === 0 ? -0.6 : 0));
const coralB = { ...withPattern(R('#eef4ff', '#c8d8f8', '#a0b8ec', '#7c94d4'), (f, x, y) => ((x + y) % 3 === 0 ? 0.8 : 0)), alpha: 220 };
const skO = { thigh: [3, 8, 3], shin: [3, 8, 3], foot: [4, 2, 4], hipW: 5, legSplay: 10, knee: 25, pelvis: [8, 4, 5], waist: [5, 5, 4], chest: [10, 7, 7],
  upperArm: [3, 7, 3], foreArm: [3, 7, 3], hand: [4, 2, 3], neck: [3, 2, 3], head: [3, 8, 3], lean: 22, armOut: 18,
  mats: { skin: R('#f4f0e6', '#dcd4c4', '#bcb2a0'), legs: coralR, shins: coralB, feet: coralB, pelvis: coralR, waist: coralR, chest: coralB, arms: coralB, fore: coralR, hands: coralB, head: R('#ffffff', '#ece6da', '#cec6b4') } };
{
  const A = anchors(skO);
  skO.parts = {
    body: [...[[-5, A.chestY + 4, -3], [3, A.chestY + 6, -2], [-2, A.waistY + 2, -3], [5, A.chestY + 1, 1]].map(([x, y, z]) => B([x, y, z], [2, 4, 2], coralR)), B([-6, A.chestY + 2, -4], [4, 5, 8], coralR)],
    arm_l_low: [...[-1, 0, 1].map(k => B([-A.sx - 2 + k * 1.5, A.handY - 5, -1 + k], [1, 5, 1], coralB))],
    arm_r_low: [...[-1, 0, 1].map(k => B([A.sx - 1 + k * 1.5, A.handY - 5, -1 + k], [1, 5, 1], coralR))],
    head: [B([-1, A.headY + 8, -1], [2, 2, 2], R('#d8d0c0', '#b8ae9a'))],
  };
  skO.render = 'translucent';
}
const skulking_colony = figure(skO);

// Phantasmal Gardener: a tall tan stalk rising in an S-curve, ringed, ending in a frilled red crest like a crown of
// spines; long cyan ghost-ribbons trail from it.
const stalk = withPattern(R('#f8e0b4', '#e0c08c', '#c4a06c', '#a07c50'), (f, x, y) => (y % 3 === 0 ? 1 : 0));
const crest = R('#ffb0a0', '#f07868', '#d04c48', '#a83438');
const ghostRib = { ramp: ['#e0ffff', '#a8f0f8', '#78d8e8'], alpha: 140 };
const phantasmal_gardener = {
  render: 'translucent',
  bones: [
    { name: 'body', pivot: [0, 0, 0], cubes: [B([-2, 0, -2], [4, 7, 4], stalk), B([-3, 0, -3], [6, 1, 6], R('#a07c50', '#7c5c38'))] },
    { name: 'seg_1', parent: 'body', pivot: [0, 7, 0], rot: [18, 0, 0], cubes: [B([-1.5, 7, -1.5], [3, 8, 3], stalk)] },
    { name: 'seg_2', parent: 'seg_1', pivot: [0, 15, 0], rot: [-28, 0, 0], cubes: [B([-1.5, 15, -1.5], [3, 8, 3], stalk)] },
    { name: 'head', parent: 'seg_2', pivot: [0, 23, 0], rot: [-20, 0, 0], cubes: [
      B([-1.5, 23, -1.5], [3, 3, 3], stalk),
      ...[0, 1, 2, 3, 4].map(k => B([-0.5, 25, -1], [0, 6 + (k % 2) * 2, 3], crest, { mask: (f, x, y, w, h) => Math.abs(x - 1) <= (h - y) * 0.3 + 0.2 })).map((c, k) => ({ ...c, from: [c.from[0] + (k - 2) * 1.2, c.from[1], c.from[2] + (k % 2)] })),
      B([-3, 25, -0.5], [6, 4, 0], crest, { mask: (f, x, y) => (x + y) % 2 === 0 || y > 1 }),
    ] },
    { name: 'tent_0', parent: 'seg_1', pivot: [1.5, 12, 0], rot: [0, 0, -20], cubes: [B([1.5, -2, 0], [0, 14, 4], withPattern(ghostRib, (f, x, y) => (y % 3 === 0 ? 1 : 0)), { mask: (f, x, y) => Math.abs(x - 1.5 - Math.sin(y * 0.5) * 1.2) <= 1.2 })] },
    { name: 'tent_1', parent: 'seg_2', pivot: [-1.5, 20, 0], rot: [0, 0, 25], cubes: [B([-1.5, 6, 0], [0, 14, 4], withPattern(ghostRib, (f, x, y) => (y % 3 === 0 ? 1 : 0)), { mask: (f, x, y) => Math.abs(x - 1.5 - Math.cos(y * 0.5) * 1.2) <= 1.2 })] },
  ],
};

// Decimillipede: a big arched centipede - broad overlapping dark navy back plates, a paler orange belly, a fringe of
// many thin orange legs, both ends rounded orange faces with mandibles; antennae at the front.
const navy = withPattern(R('#7a8ac0', '#5a6aa0', '#44528a', '#323e6e', '#242e54'), (f, x, y, w, h) => (f === 'up' ? (y === 0 ? 1.2 : y === h - 1 ? -0.6 : 0) : y === 0 ? 1 : 0));
const orangeB = R('#ffd09c', '#f8a866', '#e08a46', '#bc6a30');
const deciSeg = (i, z, rise) => ({ name: 'seg_' + i, parent: i === 1 ? 'body' : 'seg_' + (i - 1), pivot: [0, 4, z], rot: [rise, 0, 0], cubes: [
  B([-4.5, 2, z], [9, 7, 5], navy, { faceMat: { down: orangeB } }), B([-4, 1, z + 0.5], [8, 1, 4], orangeB),
  ...[-1, 1].flatMap(s => [0, 2].map(k => B([s < 0 ? -7.5 : 4.5, -1, z + 1 + k], [3, 3, 1], orangeB))),
] });
const decimillipede = {
  render: 'cutout',
  bones: [
    { name: 'head', pivot: [0, 4, -8], cubes: [
      B([-4, 1, -12], [8, 7, 4], orangeB, { detail: { north: (x, y) => ((x === 2 || x === 5) && y === 2 ? '#2a1408' : y === 5 && x >= 2 && x <= 5 ? '#8a4a20' : null) } }),
      B([-4, 0, -14], [3, 2, 3], orangeB), B([1, 0, -14], [3, 2, 3], orangeB),
      B([-3, 7, -12], [1, 1, 7], orangeB), B([2, 7, -12], [1, 1, 7], orangeB),
    ] },
    { name: 'body', parent: 'head', pivot: [0, 4, -8], cubes: [B([-4.5, 2, -8], [9, 7, 5], navy, { faceMat: { down: orangeB } }), B([-7, -1, -7], [3, 3, 1], orangeB), B([4, -1, -7], [3, 3, 1], orangeB)] },
    ...[1, 2, 3, 4, 5, 6].map(i => deciSeg(i, -3 + (i - 1) * 4.5, i < 3 ? -12 : i > 4 ? 14 : 0)),
    { name: 'tail', parent: 'seg_6', pivot: [0, 4, 24], cubes: [B([-3.5, 2, 24], [7, 6, 3], orangeB), B([-3, 0, 26], [2, 3, 2], orangeB), B([1, 0, 26], [2, 3, 2], orangeB)] },
  ],
};

// Infested Prism: a wasp nest grown into a tetrahedron of wrinkled red flesh - papery ridges in rings, one dark
// hollow with a single yellow eye inside; three blue crystal shards hanging off its corners, turning round it.
const flesh = withPattern(R('#f49a8c', '#dc7468', '#bc5650', '#96403e', '#702e2e'), (f, x, y) => ((y + Math.floor(x / 3)) % 3 === 0 ? 1.1 : (x * 7 + y) % 11 === 0 ? -0.8 : 0));
const crystal = withPattern({ ramp: ['#e8f8ff', '#b4dcf8', '#84bcec', '#5c98d4'], alpha: 225 }, (f, x, y) => ((x + y) % 3 === 0 ? -0.8 : 0));
const infested_prism = {
  render: 'translucent', glow: true,
  bones: [
    { name: 'body', pivot: [0, 10, 0], cubes: [
      ...loft([sl(3, 7, 20, -10, 10), sl(7, 11, 16, -8, 8), sl(11, 15, 12, -6, 6), sl(15, 19, 8, -4, 4), sl(19, 22, 4, -2, 2), sl(22, 24, 2, -1, 1)], flesh, 'y'),
      B([-3, 6, -10.1], [6, 6, 0], R('#2a0c0c', '#180606'), { mask: (f, x, y) => Math.hypot(x - 2.5, y - 2.5) <= 3 }),
      B([-1, 8, -10.3], [2, 2, 0], glowing(R('#fff6a0', '#f0d040', '#c09020')), { detail: { north: at([[1, 1]], '#201008') } }),
    ] },
    { name: 'orbit', parent: 'body', pivot: [0, 12, 0], cubes: [[-14, 6, 6], [13, 8, 7], [0, 24, -8]].flatMap(([x, y, z]) => [B([x - 2, y, z - 2], [4, 5, 4], crystal), B([x - 1, y + 5, z - 1], [2, 3, 2], crystal), B([x - 1, y - 2, z - 1], [2, 2, 2], crystal)]) },
  ],
};
// ===================================================================================================== normal monsters
const NORMALS = {};
const leafMask = (face, x, y, w, h) => { const cx = (w - 1) / 2, t = y / Math.max(1, h - 1); const half = Math.sin(Math.PI * Math.min(1, t * 1.05 + 0.05)) * w / 2; return Math.abs(x - cx) <= half + 0.2; };
/** A jointed insect / spider leg: a thigh angled out and up, a shin angled down to a pointed foot. */
function bugLeg(name, parent, at, s, o) {
  const { thigh = 6, shin = 7, w = 1, mat, tip, spread = 0, lift = 30 } = o;
  return [
    { name, parent, pivot: at, rot: [0, spread * s, s * -lift], cubes: [B([s < 0 ? at[0] - thigh : at[0], at[1] - w / 2, at[2] - w / 2], [thigh, w, w], mat)] },
    { name: name + '_low', parent: name, pivot: [at[0] + s * thigh, at[1], at[2]], rot: [0, 0, s * (lift + 55)], cubes: [
      B([at[0] + s * thigh - w / 2, at[1] - shin, at[2] - w / 2], [w, shin, w], mat), B([at[0] + s * thigh - 0.5, at[1] - shin - 2, at[2] - 0.5], [1, 2, 1], tip || mat)] },
  ];
}

// Mawler: a hulking blue beast - a heavy hunched front, a deep chest and thick forearms, smaller hindquarters, a broad
// head carried low with a huge underslung jaw of white fangs, small yellow eyes under a heavy brow, a long tail with a
// ridge of spikes; knuckle-walking front feet with claws.
{
  const hide = withPattern(R('#a8dcec', '#84c0d4', '#64a2b8', '#4a849c', '#36687e', '#264e60'), (f, x, y, w, h) => (f === 'up' ? (x % 3 === 0 ? 0.8 : 0) : f === 'down' ? -0.8 : (y < 2 ? -0.5 : 0) + (h2(x, y, 31) < 5 ? 0.8 : 0)));
  const fang = R('#fffcf2', '#eee6d2', '#d4c8ae');
  NORMALS.mawler = { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 11, 0], rot: [-12, 0, 0], cubes: [
      ...loft([sl(-8, -3, 13, 7, 20), sl(-3, 3, 12, 8, 19), sl(3, 8, 10, 9, 17), sl(8, 11, 8, 10, 15)], hide),   // chest, belly, loins, rump
      B([-5, 19, -7], [10, 3, 7], hide),                                                                            // the hump over the shoulders
    ] },
    { name: 'head', parent: 'body', pivot: [0, 15, -8], rot: [20, 0, 0], cubes: [
      B([-5, 12, -15], [10, 7, 7], hide, { detail: { east: (x, y) => (y === 1 && x === 5 ? '#f8f0a0' : null), west: (x, y) => (y === 1 && x === 1 ? '#f8f0a0' : null) } }),
      B([-5.5, 18, -15], [11, 2, 4], hide),                                                                         // the brow
      B([-4, 13, -18], [8, 4, 3], hide), B([-1.5, 15, -18.5], [3, 2, 1], R('#2a3a44', '#1a242c')),                // the snout and nose
    ] },
    { name: 'jaw', parent: 'head', pivot: [0, 12, -9], rot: [12, 0, 0], cubes: [
      B([-5.5, 8, -19], [11, 4, 10], hide), B([-5, 12, -19.2], [10, 2, 0], fang, { mask: (f, x, y) => x % 2 === 0 || y === 1 }),       // lower fangs
      B([-5, 13, -18.3], [10, 2, 0], fang, { mask: (f, x, y) => x % 2 === 1 || y === 0 }), B([-5.6, 12, -16], [0, 2, 6], fang, { mask: (f, x) => x % 2 === 0 }), B([5.6, 12, -16], [0, 2, 6], fang, { mask: (f, x) => x % 2 === 0 }) ] },
    ...[-1, 1].flatMap(s => limb(s < 0 ? 'leg_fl' : 'leg_fr', 'body', [s * 6, 15, -5], { upper: [5, 7, 5], lower: [4, 8, 4], mat: hide, foot: [6, 2, 5], footMat: withPattern(hide, (f, x, y) => (f === 'north' && x % 2 === 0 ? '#fffcf2' : 0)) })),
    ...[-1, 1].flatMap(s => limb(s < 0 ? 'leg_bl' : 'leg_br', 'body', [s * 4.5, 11, 7], { upper: [4, 6, 5], lower: [3, 5, 3], mat: hide, knee: [-20, 0, 0], foot: [4, 2, 5] })),
    { name: 'tail', parent: 'body', pivot: [0, 13, 10], rot: [-25, 0, 0], cubes: [B([-1.5, 11.5, 10], [3, 3, 9], hide), ...[0, 1, 2].map(k => B([-0.5, 14.5, 11 + k * 3], [1, 2, 1], fang))] },
    { name: 'tail_1', parent: 'tail', pivot: [0, 13, 19], rot: [30, 0, 0], cubes: [B([-1, 12, 19], [2, 2, 9], hide), ...[0, 1, 2].map(k => B([-0.5, 14, 20 + k * 3], [1, 2, 1], fang))] },
  ] };
}

// Hunter Killer: a crouching red wyvern-wasp - a long neck and a horned dragon head with a gold ring clamped in its
// jaws, a ridged back, small membranous wings, thin forelegs, strong folded hind legs, a long tail ending in a sting.
{
  const scale = withPattern(R('#ff9a88', '#f07060', '#d04c44', '#a83636', '#80282a'), (f, x, y, w, h) => (f === 'down' ? '#f4c890' : ((x + (y % 2)) % 2 === 0 ? 0.6 : 0)));
  const gold = glowing(R('#fff4a0', '#f0d040', '#c09020'));
  NORMALS.hunter_killer = { render: 'cutout', glow: true, bones: [
    { name: 'body', pivot: [0, 10, 0], cubes: [...loft([sl(-6, -1, 8, 7, 14), sl(-1, 5, 9, 6, 14), sl(5, 9, 7, 7, 12)], scale), ...[0, 1, 2, 3].map(k => B([-0.5, 14, -4 + k * 3], [1, 2, 1], R('#f4d080', '#d0a858')))] },
    { name: 'neck', parent: 'body', pivot: [0, 12, -6], rot: [-35, 0, 0], cubes: [B([-2, 10, -12], [4, 4, 7], scale)] },
    { name: 'head', parent: 'neck', pivot: [0, 12, -12], rot: [40, 0, 0], cubes: [
      B([-3, 10, -18], [6, 5, 6], scale, { detail: { east: at([[1, 1]], '#fff060'), west: at([[4, 1]], '#fff060') } }),
      B([-2.5, 9, -22], [5, 3, 4], scale), B([-2.5, 8, -21], [5, 1, 3], R('#f4c890', '#d8a870')),
      B([-3.5, 7.5, -24], [7, 5, 0], gold, { mask: (f, x, y, w, h) => !(x >= 1 && x <= w - 2 && y >= 1 && y <= h - 2) }),
      B([-3, 15, -14], [1, 4, 1], R('#3a2a20', '#2a1e16')), B([2, 15, -14], [1, 4, 1], R('#3a2a20', '#2a1e16')) ] },
    ...[['wing_l', -1], ['wing_r', 1]].map(([n, s]) => ({ name: n, parent: 'body', pivot: [s * 3, 14, -3], rot: [-25, s * 15, s * -25], cubes: [
      B([s < 0 ? -15 : 3, 14, -6], [12, 0, 9], { ramp: ['#ffd8c8', '#f0a898', '#d07878'], alpha: 180 }, { mask: (f, x, y, w, h) => y <= (h - 1) * (1 - Math.abs(x - (s < 0 ? w - 1 : 0)) / w * 0.6) && (x % 4 !== 0 || y < h - 2) }),
      B([s < 0 ? -15 : 3, 13.5, -6.5], [12, 1, 1], scale) ] })),
    ...[-1, 1].flatMap(s => limb(s < 0 ? 'leg_fl' : 'leg_fr', 'body', [s * 3.5, 8, -4], { upper: [2, 4, 2], lower: [2, 4, 2], mat: scale, foot: [3, 1, 3] })),
    ...[-1, 1].flatMap(s => limb(s < 0 ? 'leg_bl' : 'leg_br', 'body', [s * 4.5, 9, 4], { upper: [3, 5, 5], lower: [2, 4, 2], mat: scale, knee: [-35, 0, 0], foot: [3, 1, 4] })),
    { name: 'tail', parent: 'body', pivot: [0, 10, 9], rot: [-10, 0, 0], cubes: [B([-1.5, 8.5, 9], [3, 3, 8], scale)] },
    { name: 'tail_1', parent: 'tail', pivot: [0, 10, 17], rot: [30, 0, 0], cubes: [B([-1, 9, 17], [2, 2, 8], scale), B([-0.5, 9.5, 25], [1, 1, 3], R('#f4d080', '#d0a858'))] },
  ] };
}

// Spiny Toad: a squat warty toad - a broad flat head with orange eyes on raised mounds, a wide mouth line, dark horns
// and spines all over the back, red warts, a pale throat and belly; folded hind legs, splayed front feet.
{
  const toad = withPattern(R('#b4e4c8', '#8ecca8', '#6cae8a', '#50906e', '#3a7256'), (f, x, y) => (f === 'down' ? '#f4f0d0' : h2(x >> 1, y >> 1, 25) < 9 ? '#c84848' : h2(x, y, 26) < 8 ? 1 : 0));
  const horn = R('#4a5a50', '#36443a', '#26302a');
  const spikes = [[-4, 12, -2], [0, 13, 0], [4, 12, -1], [-6, 10, 4], [6, 10, 3], [-2, 12, 5], [3, 12, 6], [-5, 11, 1], [5, 11, 0], [0, 11, 7]];
  NORMALS.spiny_toad = { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 6, 1], cubes: [...loft([sl(-6, -2, 13, 2, 10), sl(-2, 6, 16, 1, 12), sl(6, 9, 13, 2, 10)], toad), B([-5, 1, -6.2], [10, 4, 0], R('#f4f0d0', '#dcd4b0')),
      ...spikes.map(([x, y, z], i) => B([x - 0.5, y, z - 0.5], [1, 2 + (i % 2), 1], horn))] },
    { name: 'head', parent: 'body', pivot: [0, 7, -6], cubes: [
      B([-7, 4, -12], [14, 6, 7], toad, { detail: { north: (x, y, w, h) => (y === 4 && x > 0 && x < w - 1 ? '#2a3a30' : null) } }),
      ...[-1, 1].map(s => B([s < 0 ? -7 : 3, 9, -10], [4, 3, 4], toad)), ...[-1, 1].map(s => B([s < 0 ? -6.5 : 3.5, 10, -10.5], [3, 3, 1], R('#ffc060', '#f09030'), { detail: { north: (x, y) => (x === 1 && y >= 0 ? '#201008' : null) } })),
      B([-7, 12, -8], [1, 4, 1], horn), B([6, 12, -8], [1, 4, 1], horn) ] },
    ...[-1, 1].flatMap(s => limb(s < 0 ? 'leg_fl' : 'leg_fr', 'body', [s * 6, 5, -4], { upper: [3, 3, 3], lower: [2, 2, 2], mat: toad, rot: [0, 0, s * 25], foot: [5, 1, 5] })),
    ...[-1, 1].flatMap(s => limb(s < 0 ? 'leg_bl' : 'leg_br', 'body', [s * 7, 6, 4], { upper: [4, 4, 7], lower: [3, 2, 6], mat: toad, rot: [0, 0, s * 20], foot: [5, 1, 7] })),
  ] };
}

// Tunneler: a maroon mole cricket - a ribbed, tapering abdomen, a domed armoured thorax, a small head with a pink
// nose and feelers, two huge shovel claws with toothed edges held in front, short legs behind.
{
  const maroon = withPattern(R('#e08aa0', '#c06c84', '#9e5068', '#7c3a50', '#5c2a3c'), (f, x, y, w, h) => (f === 'up' ? (y % 3 === 0 ? 1 : 0) : y === 0 ? 0.8 : 0));
  NORMALS.tunneler = { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 6, 2], cubes: [...loft([sl(0, 4, 11, 2, 11), sl(4, 8, 10, 2, 10), sl(8, 11, 8, 3, 9), sl(11, 13, 5, 4, 7)], withPattern(R('#d07890', '#b05870', '#8e4058', '#6e3044'), (f, x, y) => (f === 'up' || f === 'east' || f === 'west' ? (y % 2 === 0 ? 1 : 0) : 0))),
      ...loft([sl(-7, -2, 13, 4, 14), sl(-2, 0, 12, 5, 13)], maroon)] },
    { name: 'head', parent: 'body', pivot: [0, 9, -7], cubes: [B([-3.5, 6, -11], [7, 6, 4], maroon), B([-2, 6.5, -12], [4, 3, 1], R('#ffc0d0', '#e898b0')), B([-3, 11, -11], [1, 1, 6], R('#3a1a24', '#2a1018')), B([2, 11, -11], [1, 1, 6], R('#3a1a24', '#2a1018'))] },
    ...[['arm_l', -1], ['arm_r', 1]].map(([n, s]) => ({ name: n, parent: 'body', pivot: [s * 5, 8, -6], rot: [25, 0, s * 15], cubes: [
      B([s < 0 ? -9 : 5, 4, -9], [4, 6, 5], maroon),
      B([s < 0 ? -11 : 5, 0, -13], [6, 5, 7], withPattern(R('#e08aa0', '#c06c84', '#9e5068'), (f, x) => (f === 'north' && x % 2 === 0 ? '#3a1a24' : 0))),
      ...[0, 1, 2].map(k => B([s < 0 ? -11 + k * 2 : 5 + k * 2, -1, -14], [1, 2, 2], R('#4a2030', '#30141e'))) ] })),
    ...[-1, 1].flatMap(s => [0, 1].flatMap(k => bugLeg('leg_' + (s < 0 ? 'l' : 'r') + (k + 1), 'body', [s * 4, 4, 3 + k * 4], s, { thigh: 4, shin: 5, w: 2, mat: maroon, lift: 15, spread: k * 20 }))),
  ] };
}

// Louse Progenitor: a giant pill bug - seven overlapping shell bands arching high, alternating blue and yellow with lit
// leading edges, a tail fan of small plates, a head shield with long feelers, rows of short legs under the rim.
{
  const band = (blue) => withPattern(blue ? R('#a8d0f8', '#80b0ec', '#5e90d4', '#4472b4', '#305894') : R('#fcecaa', '#f0d47a', '#d8b456', '#b8923a', '#94702a'), (f, x, y, w, h) => (f === 'north' ? 1.2 : f === 'up' ? (y === 0 ? -0.8 : 0) : y === 0 ? -0.6 : 0) + (h2(x, y, 5) < 5 ? 0.6 : 0));
  const arch = [8, 10, 11, 11, 10, 9, 7];
  NORMALS.louse_progenitor = { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 6, 0], cubes: [...arch.map((h, i) => B([-8 + (i === 0 || i === 6 ? 1 : 0), 2, -10 + i * 3], [16 - (i === 0 || i === 6 ? 2 : 0), h, 4], band(i % 2 === 0))), B([-5, 2, 11], [10, 4, 3], band(false))] },
    { name: 'head', parent: 'body', pivot: [0, 5, -10], cubes: [B([-5, 2, -13], [10, 5, 3], band(true)), B([-4, 5, -18], [1, 1, 6], R('#5e90d4', '#305894')), B([3, 5, -18], [1, 1, 6], R('#5e90d4', '#305894')), B([-3, 3, -13.5], [2, 1, 1], R('#101010', '#000000')), B([1, 3, -13.5], [2, 1, 1], R('#101010', '#000000'))] },
    ...[-1, 1].flatMap(s => [0, 1, 2].flatMap(k => bugLeg('leg_' + (s < 0 ? 'l' : 'r') + k, 'body', [s * 7, 3, -6 + k * 6], s, { thigh: 2, shin: 3, w: 1, mat: R('#c8a868', '#a8884c'), lift: 10, spread: (1 - k) * 20 }))),
  ] };
}

// Slumbering Beetle: a purple rhinoceros beetle - a great curved horn rising from the head, a smaller thoracic horn,
// a domed pronotum, glossy wing cases split down the middle with green spots, stout spiny legs.
{
  const purple = withPattern(R('#d0b0e8', '#b090d0', '#9070b4', '#745496', '#583e78'), (f, x, y, w, h) => (f === 'up' && (x === Math.floor(w / 2)) ? 1.4 : f === 'up' && h2(x >> 1, y >> 1, 23) < 9 ? '#6ac090' : (x + y) % 6 === 0 ? -0.8 : 0));
  NORMALS.slumbering_beetle = { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 7, 2], cubes: [...loft([sl(-2, 2, 13, 3, 11), sl(2, 10, 14, 3, 12), sl(10, 13, 11, 3, 10)], purple), B([-6, 2, -1], [12, 2, 13], R('#4e3a60', '#3a2a48'))] },
    { name: 'head', parent: 'body', pivot: [0, 8, -2], cubes: [
      ...loft([sl(-7, -2, 12, 4, 12)], purple), B([-1, 12, -5], [2, 3, 2], purple),                                                    // the pronotum and its little horn
      B([-3, 4, -10], [6, 5, 3], purple), B([-1.5, 7, -14], [3, 3, 4], purple), B([-1, 10, -16], [2, 4, 2], purple), B([-1, 13, -15], [2, 2, 2], purple),   // the great horn curving up
      B([-3.5, 6, -10.2], [1, 1, 0], R('#101010', '#000000')), B([2.5, 6, -10.2], [1, 1, 0], R('#101010', '#000000')) ] },
    ...[-1, 1].flatMap(s => [0, 1, 2].flatMap(k => bugLeg('leg_' + (s < 0 ? 'l' : 'r') + k, 'body', [s * 6, 5, -3 + k * 5], s, { thigh: 4, shin: 5, w: 2, mat: R('#6a4e80', '#4e3a60'), lift: 20, spread: (1 - k) * 20 }))),
  ] };
}

// Thieving Hopper: a lanky grasshopper - a dark purple thorax and head with big compound eyes and long antennae, a
// long ringed yellow-green abdomen, huge folded hind legs (thick thighs, thin spiny shins), thin forelegs held up.
{
  const green = withPattern(R('#f0f8a0', '#d4e070', '#b0c250', '#88983a'), (f, x, y) => (y % 2 === 0 ? 0.8 : 0));
  const dark = R('#7a6a8a', '#5a4e6c', '#40364e', '#2c2436');
  NORMALS.thieving_hopper = { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 10, 0], rot: [-15, 0, 0], cubes: [B([-2.5, 8, -3], [5, 5, 5], dark), ...loft([sl(2, 7, 5, 7, 12), sl(7, 12, 4, 7, 11), sl(12, 15, 3, 8, 10)], green)] },
    { name: 'head', parent: 'body', pivot: [0, 12, -3], rot: [20, 0, 0], cubes: [B([-2.5, 11, -7], [5, 6, 4], dark), ...[-1, 1].map(s => B([s < 0 ? -3.5 : 2.5, 14, -6], [1, 2, 2], R('#f8f0a0', '#d0c860'))),
      B([-1.5, 17, -6], [1, 8, 1], dark), B([0.5, 17, -6], [1, 8, 1], dark)] },
    ...[['leg_l', -1], ['leg_r', 1]].map(([n, s]) => ({ name: n, parent: 'body', pivot: [s * 3, 10, 2], rot: [-40, 0, 0], cubes: [B([s * 3 - 1.5, 2, 1], [3, 9, 3], withPattern(green, (f, x, y) => (y % 3 === 0 ? 1 : 0))), B([s * 3 - 0.5, -6, 6], [1, 9, 1], withPattern(green, (f, x, y) => (y % 2 === 0 ? '#3a4020' : 0)))] })),
    ...[['arm_l', -1], ['arm_r', 1]].map(([n, s]) => ({ name: n, parent: 'body', pivot: [s * 2, 9, -2], rot: [40, 0, s * -10], cubes: [B([s * 2.5 - 0.5, 3, -2.5], [1, 6, 1], green), B([s * 2.5 - 0.5, 2, -4], [1, 1, 2], green)] })),
  ] };
}

// Ovicopter: a fat furry fly - a white ruff of fur round the thorax, a rounded head with two huge dark-red compound
// eyes, a short proboscis, two pairs of veined translucent wings, and a swollen green egg-sac abdomen with dark spots.
{
  const fur = withPattern(R('#ffffff', '#f4f2ec', '#e0dcd0', '#c4c0b2'), (f, x, y) => (x % 2 ? 0.6 : 0) + (h2(x, y, 3) < 8 ? 0.8 : 0));
  const sac = withPattern({ ramp: ['#c8f4e4', '#9ce0cc', '#70c8b0', '#4caa94', '#348a78'], alpha: 230 }, (f, x, y) => (h2(x >> 1, y >> 1, 9) < 12 ? '#2a7a68' : 0));
  const wing = { ramp: ['#fffaf0', '#f0e0c8', '#d8c4a4'], alpha: 140 };
  NORMALS.ovicopter = { render: 'translucent', bones: [
    { name: 'body', pivot: [0, 11, 0], cubes: [...loft([sl(-6, -2, 9, 8, 16), sl(-2, 2, 11, 7, 17), sl(2, 4, 9, 8, 16)], fur), ...loft([sl(4, 7, 10, 5, 15), sl(7, 14, 12, 4, 15), sl(14, 17, 9, 5, 13)], sac)] },
    { name: 'head', parent: 'body', pivot: [0, 12, -6], cubes: [B([-3.5, 9, -11], [7, 6, 5], fur),
      ...[-1, 1].map(s => B([s < 0 ? -5 : 2, 10, -11], [3, 5, 4], withPattern(R('#e07060', '#c04838', '#902c24'), (f, x, y) => ((x + y) % 2 ? 0.6 : 0)))), B([-0.5, 7, -12], [1, 3, 1], R('#4a3a2a', '#2a2018'))] },
    ...[['wing_l', -1, 0], ['wing_r', 1, 0], ['tent_0', -1, 1], ['tent_1', 1, 1]].map(([n, s, back]) => ({ name: n, parent: 'body', pivot: [s * 3, 16, -2 + back * 3], rot: [-10 + back * 15, s * (10 + back * 25), s * -20], cubes: [
      B([s < 0 ? -17 : 3, 16, -5 + back * 3], [14, 0, 6], withPattern(wing, (f, x, y) => (x % 4 === 0 || y === 2 ? 1 : 0)), { mask: leafMask })] })),
    ...[-1, 1].flatMap(s => [0, 1, 2].flatMap(k => bugLeg('leg_' + (s < 0 ? 'l' : 'r') + k, 'body', [s * 4, 8, -4 + k * 2.5], s, { thigh: 4, shin: 5, w: 1, mat: R('#f0a060', '#c87838'), lift: 20, spread: (1 - k) * 25 }))),
  ] };
}

// Fogmog: a walking fly agaric - a broad scarlet cap, domed and with a rolled rim and gills beneath, raised lime-green
// warts on top; a thick pale trunk of a body narrowing at the waist, a hollow-eyed face with an open mouth, stubby
// root-like arms, splayed mossy root feet.
{
  const cap = withPattern(R('#ff9878', '#f06a4c', '#d04a34', '#a83426', '#80261c'), (f, x, y) => (f === 'up' && h2(x >> 1, y >> 1, 7) < 16 ? '#b8f070' : f === 'down' ? '#f4dcb8' : 0));
  const trunk = withPattern(R('#fff0cc', '#f0d8ac', '#dcbc8c', '#c09c6c', '#9c7c50'), (f, x, y) => (x % 3 === 1 ? 0.6 : 0) + (h2(x, y, 3) < 5 ? 1 : 0));
  NORMALS.fogmog = { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 6, 0], cubes: [...loft([sl(3, 6, 9, -4, 4), sl(6, 11, 7, -3.5, 3.5), sl(11, 17, 9, -4, 4)], trunk, 'y'),
      B([-3, 11, -4.2], [6, 5, 0], R('#2a1a10', '#1a100a'), { mask: (f, x, y) => ((x === 0 || x === 5) && y <= 1) || (x >= 2 && x <= 3 && y >= 3) })] },
    { name: 'head', parent: 'body', pivot: [0, 17, 0], cubes: [...loft([sl(16, 18, 22, -11, 11), sl(18, 21, 20, -10, 10), sl(21, 23, 15, -7.5, 7.5), sl(23, 24, 9, -4.5, 4.5)], cap, 'y'),
      B([-11.5, 15, -11.5], [23, 1, 23], withPattern(R('#f8e8c8', '#e8d0a8', '#d0b488'), (f, x, y) => ((x + y) % 2 ? 0.8 : 0)))] },
    ...[['arm_l', -1], ['arm_r', 1]].map(([n, s]) => ({ name: n, parent: 'body', pivot: [s * 4, 14, 0], rot: [0, 0, s * 35], cubes: [B([s < 0 ? -6 : 4, 8, -1], [2, 6, 2], trunk), B([s < 0 ? -7 : 4, 7, -1.5], [3, 2, 3], trunk)] })),
    ...[['leg_l', -1], ['leg_r', 1]].map(([n, s]) => ({ name: n, parent: 'body', pivot: [s * 2, 3, 0], cubes: [B([s * 2 - 2, 0, -2.5], [4, 3, 5], R('#a8c070', '#88a058', '#6a8044')), B([s * 2 - 3, 0, -4], [6, 1, 3], R('#a8c070', '#88a058'), { mask: (f, x) => x % 2 === 0 || f === 'up' })] })),
  ] };
}

// Vine Shambler: a crawling mound of yellow-green vines - a hunched back of tangled strands falling in a shaggy
// fringe, a wide gaping maw of thorny teeth in front, two long dragging vine arms ending in reddish root-hands,
// short legs buried in the tangle, leaves sprouting from the top.
{
  const vine = withPattern(R('#f0ec98', '#d8d070', '#b8b04c', '#968e36', '#726a24'), (f, x, y) => (x % 2 ? 0.5 : -0.3) + (hash(x, 5) === 0 ? 0.9 : 0) + ((x + y) % 7 === 0 ? -0.8 : 0));
  NORMALS.vine_shambler = { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 8, 2], rot: [15, 0, 0], cubes: [...loft([sl(-5, 0, 13, 4, 16), sl(0, 6, 14, 3, 18), sl(6, 9, 11, 4, 15)], vine), fringe([-7.5, 1, 9.2], [15, 16, 0], R('#d8d070', '#b8b04c', '#968e36'), 4, 2),
      fringe([-7.5, 1, -5.2], [15, 6, 0], R('#d8d070', '#b8b04c'), 3, 4), ...[[-3, 0], [2, 2], [5, -2], [-5, 4]].map(([x, z], i) => B([x, 18, z], [3, 3, 0], R('#9ad070', '#78b050'), { mask: leafMask }))] },
    { name: 'head', parent: 'body', pivot: [0, 12, -5], cubes: [B([-6, 8, -10], [12, 9, 5], vine, { detail: { north: (x, y, w, h) => (y >= 2 && y <= 6 && x >= 1 && x <= w - 2 ? (y === 2 || y === 6 ? (x % 2 ? '#fffaf0' : '#3a1010') : '#5a1a14') : null) } }),
      B([-5, 15.5, -10.6], [10, 1, 0], R('#fffaf0', '#e8dcc0'), { mask: (f, x) => x % 2 === 0 })] },
    ...[['arm_l', -1], ['arm_r', 1]].map(([n, s]) => ({ name: n, parent: 'body', pivot: [s * 6.5, 14, -2], rot: [-25, 0, s * -8], cubes: [
      B([s * 6.5 - 1.5, 2, -3.5], [3, 12, 3], vine), B([s * 6.5 - 1, -3, -3], [2, 5, 2], vine), B([s * 6.5 - 2.5, -5, -5], [5, 2, 5], R('#e09878', '#c07858', '#a05c40'), { mask: (f, x) => f !== 'north' || x % 2 === 0 })] })),
    ...[['leg_l', -1], ['leg_r', 1]].map(([n, s]) => ({ name: n, parent: 'body', pivot: [s * 4, 4, 3], cubes: [B([s * 4 - 2, 0, 1], [4, 4, 4], vine)] })),
  ] };
}

// Haunted Ship: a wrecked boat hull scuttling on grey crab legs - clinker planks with a broken keel, a splintered
// stump of a mast, a ragged ghostly sail, a heap of ghost-gold in the hold, dark portholes along its sides.
{
  const plank = withPattern(R('#c49464', '#a07448', '#7e5834', '#5e4024', '#422c18'), (f, x, y) => (y % 3 === 0 ? 1.1 : 0) + (h2(x, y, 41) < 4 ? 1.2 : 0));
  const crab = R('#d8dce0', '#b4bac2', '#90969e', '#6e747c');
  NORMALS.haunted_ship = { render: 'translucent', bones: [
    { name: 'body', pivot: [0, 8, 0], cubes: [...loft([sl(-14, -10, 6, 8, 13), sl(-10, -5, 10, 6, 14), sl(-5, 8, 12, 5, 14), sl(8, 12, 11, 6, 15)], plank),
      B([-0.5, 4, -12], [1, 2, 22], plank), ...[-1, 1].flatMap(s => [-4, 1, 6].map(z => B([s * 6.1 - 0.5, 10, z], [1, 2, 2], R('#1a1410', '#0e0a08')))),
      ...[0, 1, 2, 3].map(k => B([-4 + k * 2, 14, -3 + (k % 2) * 2], [3, 2, 4], glowing(R('#fff4b0', '#f0d060', '#c8a030')))),
      B([-1, 14, 3], [2, 10, 2], plank), B([-1, 24, 3], [2, 2, 1], plank, { mask: (f, x) => x === 0 }),
      B([1, 15, 0], [0, 10, 9], { ramp: ['#e8fff8', '#c4f0e4', '#9cdcc8'], alpha: 130 }, { mask: (f, x, y, w, h) => y < h - (x % 3) && x < w - (y % 2) })] },
    ...[-1, 1].flatMap(s => [0, 1, 2, 3].flatMap(k => bugLeg('leg_' + (s < 0 ? 'l' : 'r') + k, 'body', [s * 5, 6, -8 + k * 5], s, { thigh: 6, shin: 7, w: 2, mat: crab, lift: 25, spread: (1.5 - k) * 15 }))),
  ] };
}

// Sewer Clam: a giant clam - two heavy shell valves with deep wavy ribs and a zig-zag purple lip, slightly open on a
// glimpse of pale flesh, rust-orange branching coral growing on the upper valve.
{
  const ribs = withPattern(R('#e4ccf8', '#c4a8ec', '#a084d4', '#7c62b4', '#5c4892'), (f, x, y, w, h) => (f === 'up' ? (x % 3 === 0 ? 1.2 : x % 3 === 1 ? -0.5 : 0) : (x % 3 === 0 ? 1.1 : 0) + (y === 0 ? -0.6 : 0)));
  const coralO = R('#ffb080', '#f08c58', '#d06a3c', '#a84e2a');
  NORMALS.sewer_clam = { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 4, 0], cubes: [...loft([sl(-7, -4, 14, 0, 4), sl(-4, 5, 18, 0, 5), sl(5, 7, 14, 0, 4)], ribs), B([-8, 4, -6.5], [16, 2, 12], R('#fff0e8', '#f4d4c8', '#e0b0a4'))] },
    { name: 'head', parent: 'body', pivot: [0, 6, 6], rot: [-12, 0, 0], cubes: [...loft([sl(-7, -4, 14, 6, 9), sl(-4, 5, 18, 6, 11), sl(5, 7, 14, 6, 9)], ribs),
      B([-9, 5.5, -7.2], [18, 2, 0], R('#f4e8ff', '#b890e0'), { mask: (f, x, y) => (x + y) % 2 === 0 }),
      ...[[-5, -1, 9], [-1, 1, 11], [3, -2, 8], [6, 1, 10]].flatMap(([x, z, h], i) => [B([x, 11, z], [1, h, 1], coralO), B([x - 1, 11 + h - 3, z], [3, 1, 1], coralO), B([x + (i % 2 ? 1 : -2), 11 + h - 6, z], [2, 1, 1], coralO)])] },
  ] };
}

// Kin Follower: a ball of golden straw, shaggy all round, short blue limbs poking out, a pale bark mask with two
// eye holes, gripping a hooked, three-pronged boomerang-blade.
{
  const straw = withPattern(R('#f8d890', '#e4bc68', '#c89c48', '#a47c30', '#7e5c20'), (f, x, y) => (x % 2 ? 0.6 : -0.3) + (hash(x, 7) === 0 ? 1 : 0) + (y % 4 === 0 ? 0.4 : 0));
  const blue = R('#a0c8dc', '#7ca8c0', '#5e8aa4', '#466e88');
  NORMALS.kin_follower = { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 8, 0], cubes: [...loft([sl(3, 6, 10, -5, 5), sl(6, 13, 14, -7, 7), sl(13, 16, 11, -5.5, 5.5), sl(16, 17, 6, -3, 3)], straw, 'y'),
      fringe([-7.5, 2, -7.2], [15, 13, 0], R('#f8d890', '#e4bc68', '#c89c48'), 3, 5), fringe([-7.5, 2, 7.2], [15, 13, 0], R('#e4bc68', '#c89c48', '#a47c30'), 3, 6)] },
    { name: 'head', parent: 'body', pivot: [0, 12, -7], cubes: [B([-2.5, 9, -7.6], [5, 4, 1], R('#ecdcc0', '#d0bc98', '#b49c78'), { detail: { north: (x, y) => ((x === 1 || x === 3) && y === 1 ? '#1a1410' : null) } })] },
    ...[['arm_l', -1], ['arm_r', 1]].map(([n, s]) => ({ name: n, parent: 'body', pivot: [s * 7, 10, -1], rot: [s > 0 ? -50 : 0, 0, s * 20], cubes: [B([s < 0 ? -9 : 7, 5, -2], [2, 5, 2], blue), B([s < 0 ? -9.5 : 6.5, 4, -2.5], [3, 2, 3], blue)] })),
    { name: 'weapon', parent: 'arm_r', pivot: [8, 5, -1], cubes: [B([7.5, 0, -1.5], [1, 12, 1], R('#e0e4ec', '#b8bec8')), B([4.5, 11, -1.5], [7, 1, 1], R('#e0e4ec', '#b8bec8')), B([4.5, 12, -1.5], [1, 3, 1], R('#e0e4ec', '#b8bec8')), B([7.5, 12, -1.5], [1, 4, 1], R('#e0e4ec', '#b8bec8')), B([10.5, 12, -1.5], [1, 3, 1], R('#e0e4ec', '#b8bec8'))] },
    ...[['leg_l', -1], ['leg_r', 1]].map(([n, s]) => ({ name: n, parent: 'body', pivot: [s * 3, 4, 0], cubes: [B([s * 3 - 1, 1, -1], [2, 4, 2], blue), B([s * 3 - 1.5, 0, -3], [3, 1, 4], blue)] })),
  ] };
}

// Fossil Stalker: a porous lump of honeycomb coral, its cells dark pits, scuttling on six red tentacle legs that curl
// at the tips, two eyestalk feelers on top.
{
  const comb = withPattern(R('#fff4c0', '#f4dc94', '#e0c070', '#c4a050', '#a07c38'), (f, x, y) => ((x + (Math.floor(y / 2) % 2)) % 2 === 0 && y % 2 === 0 ? '#8a6428' : 0));
  const tent = R('#ffa894', '#f07c6c', '#d05a50', '#a8423c');
  NORMALS.fossil_stalker = { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 7, 0], cubes: [...loft([sl(4, 6, 10, -4, 4), sl(6, 13, 14, -6, 6), sl(13, 16, 11, -5, 5)], comb, 'y'), B([-5, 3, -4], [10, 2, 8], tent)] },
    ...[-1, 1].flatMap(s => [0, 1, 2].flatMap(k => bugLeg('leg_' + (s < 0 ? 'l' : 'r') + k, 'body', [s * 5, 5, -3 + k * 3], s, { thigh: 5, shin: 6, w: 2, mat: tent, tip: R('#ffd0c4', '#f0a898'), lift: 20, spread: (1 - k) * 25 }))),
    { name: 'head', parent: 'body', pivot: [0, 15, -3], cubes: [B([-3, 15, -4], [1, 6, 1], tent), B([2, 15, -4], [1, 6, 1], tent), B([-3.5, 21, -4.5], [2, 2, 2], R('#202020', '#101010')), B([1.5, 21, -4.5], [2, 2, 2], R('#202020', '#101010'))] },
  ] };
}

// Sludge Spinner: a spinning top of oily sludge - a broad iridescent cap streaked with an oil-slick rainbow, a fat
// dome on top with two beady eyes and a pink bulb, balanced on one black spindle leg.
{
  const slick = withPattern(R('#d0f4f0', '#a4dcec', '#88b4e4', '#a094dc', '#c88ccc', '#e8a888'), (f, x, y) => (((x + y * 2) % 6) - 2.5) * 0.9);
  NORMALS.sludge_spinner = { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 8, 0], cubes: [B([-0.5, 0, -0.5], [1, 6, 1], R('#3a3a42', '#1a1a20')), B([-1, 4, -1], [2, 2, 2], R('#2a2a30', '#1a1a20')),
      ...loft([sl(5, 6, 10, -5, 5), sl(6, 8, 16, -8, 8), sl(8, 9, 14, -7, 7), sl(9, 12, 10, -5, 5), sl(12, 14, 6, -3, 3)], slick, 'y'), B([-1, 14, -1], [2, 2, 2], R('#ffc0d0', '#f090a8'))] },
    { name: 'head', parent: 'body', pivot: [0, 11, -5], cubes: [B([-2, 10, -5.2], [4, 1, 0], R('#101014', '#000000'), { mask: (f, x) => x === 0 || x === 3, detail: { north: (x) => (x === 0 || x === 3 ? '#101014' : null) } })] },
  ] };
}

// The Obscura: a pale, blue-grey segmented sea-worm rearing up from a coil, its back studded with yellow eye-spots,
// frilled blue fins along the coil, a small head with a glowing cyan lure at the tip.
{
  const obs = withPattern(R('#eef6ff', '#cce0f8', '#a4c4ec', '#7aa0d8', '#5880bc'), (f, x, y) => ((h2(x >> 1, y >> 1, 27) < 10) ? '#f0e8a0' : y % 3 === 0 ? 0.8 : 0));
  NORMALS.obscura = { render: 'cutout', glow: true, bones: [
    { name: 'body', pivot: [0, 3, 2], cubes: [B([-4, 0, -2], [8, 6, 12], obs), B([-6, 0, 6], [5, 5, 6], obs), B([0, 6, -1], [0, 4, 11], R('#6a8ad8', '#4a68b8'), { mask: (f, x, y) => y >= (x % 3) })] },
    { name: 'seg_1', parent: 'body', pivot: [0, 4, -2], rot: [-60, 0, 0], cubes: [B([-3, 1, -9], [6, 6, 7], obs)] },
    { name: 'seg_2', parent: 'seg_1', pivot: [0, 4, -9], rot: [-25, 0, 0], cubes: [B([-2.5, 1.5, -15], [5, 5, 6], obs)] },
    { name: 'head', parent: 'seg_2', pivot: [0, 4, -15], rot: [55, 0, 0], cubes: [B([-2.5, 1.5, -20], [5, 5, 5], obs, { detail: { north: at([[1, 2], [3, 2]], '#101820') } }), B([-0.5, 6.5, -19], [1, 4, 1], obs), B([-1, 10, -19.5], [2, 2, 2], glowing(R('#e0ffff', '#80f0ff', '#40d0f0')))] },
    { name: 'tail', parent: 'body', pivot: [0, 3, 10], rot: [0, 50, 0], cubes: [B([-2, 1, 10], [4, 3, 8], obs), B([0, 4, 10], [0, 3, 8], R('#6a8ad8', '#4a68b8'), { mask: (f, x, y) => y >= x % 3 })] },
  ] };
}
module.exports = { soul_fysh, kaiser_crab, knowledge_demon, vantom, kin_priest, waterfall_giant, lagavulin_matriarch, insatiable,
  axe_raider, assassin_raider, brute_raider, crossbow_raider, tracker_raider, calcified_cultist, damp_cultist, gremlin_merc, sneaky_gremlin, fat_gremlin, punch_construct,
  entomancer, bygone_effigy, phrog_parasite, skulking_colony, phantasmal_gardener, decimillipede, infested_prism, ...NORMALS };
