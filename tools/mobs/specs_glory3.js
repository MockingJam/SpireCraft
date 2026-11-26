// Glory batch G3 (docs/design/glory.md, 2026-11-26): the Axebot, the Soul Nexus and the Test Subject. Traced from the
// renders on slaythespire.wiki.gg (StS2_<Name>.png). Coordinates as in specs.js: pixels, y up, ground 0, front -Z.
const { R, withPattern, glowing, B, rotBox, bevelBox } = require('./kit');
const out = {};

// --------------------------------------------------------------------------------------- Axebot
// Render: a hunched robot of rust-brown cast iron - a big round torso with glowing orange seams, a heavy anvil-shaped
// helm sunk between the shoulders with a glowing slit; its right arm ends in a grey double-headed axe, the left is a
// heavy round fist with an orange joint glow; short thick legs, grey clawed feet.
{
  const rust = withPattern(R('#b0684a', '#8e4e36', '#6e3a28', '#522a1e', '#3a1e16'), (f, x, y) => (y % 5 === 0 ? '#e07a2a' : (x * 3 + y) % 11 === 0 ? -0.6 : 0));
  const dark = R('#5a4038', '#42302a', '#2e221e');
  const grey = R('#b8bcc4', '#959aa4', '#747884', '#565a64');
  const glow = glowing(R('#ffd070', '#f09030', '#d06018'));
  out.axebot = { render: 'cutout', glow: true, bones: [
    ...bevelBox('body', undefined, [0, 17, 0], [16, 15, 13], 4, rust),
    { name: 'head', parent: 'body', pivot: [0, 25, -3], cubes: [B([-5, 24, -8], [10, 4, 8], dark), B([-6, 28, -9], [12, 2, 10], dark), B([-1, 30, -7], [2, 2, 8], dark),
      B([-3, 25.5, -8.1], [6, 1, 0], glow)] },
    { name: 'arm_r', parent: 'body', pivot: [9, 21, 0], rot: [-30, 0, 0], cubes: [B([8, 12, -2], [4, 10, 4], rust), B([9.5, 2, -1], [1, 12, 1], dark),
      B([6, 3, -5], [7, 7, 1], grey, { mask: (f, x, y, w, h) => Math.abs(y - 3) <= 1 + Math.abs(x - 3) * 0.6 }), B([6, 3, 3], [7, 7, 1], grey, { mask: (f, x, y, w, h) => Math.abs(y - 3) <= 1 + Math.abs(x - 3) * 0.6 })] },
    { name: 'arm_l', parent: 'body', pivot: [-9, 21, 0], rot: [-20, 0, 0], cubes: [B([-12, 12, -2.5], [5, 10, 5], rust), B([-13, 8, -3.5], [7, 5, 7], rust), B([-11, 20, -3.1], [3, 2, 0], glow)] },
    { name: 'leg_l', parent: 'body', pivot: [-4, 10, 0], cubes: [B([-7, 2, -3], [5, 8, 6], rust), B([-8, 0, -5], [7, 2, 8], grey)] },
    { name: 'leg_r', parent: 'body', pivot: [4, 10, 0], cubes: [B([2, 2, -3], [5, 8, 6], rust), B([1, 0, -5], [7, 2, 8], grey)] },
  ] };
}

// --------------------------------------------------------------------------------------- Soul Nexus
// Render: a great red eye (white rim, a red iris with a dark slit) held up on a twisted purple stalk, framed by spiky
// purple petals; curling purple tendrils with leafy tips; a red glow round it.
{
  const stalk = withPattern(R('#a080c8', '#8264ac', '#664c8e', '#4e3872'), (f, x, y) => (y % 3 === 0 ? -0.6 : 0));
  const eye = (x, y, w, h) => { const d = Math.hypot(x - (w - 1) / 2, y - (h - 1) / 2); return d < 0.9 ? '#2a0a10' : d < 2.2 ? '#e0283a' : d < 3.2 ? '#f6e8e8' : null; };
  out.soul_nexus = { render: 'cutout', glow: true, bones: [
    { name: 'body', pivot: [0, 0, 0], cubes: [B([-3, 0, -3], [6, 2, 6], stalk), B([-1.5, 2, -1.5], [3, 10, 3], stalk), B([-2, 7, -2], [2, 4, 2], stalk), B([0.5, 4, 0.5], [2, 4, 2], stalk)] },
    rotBox('stem2', 'body', [0.5, 15, 0], [3, 8, 3], [0, 0, -10], stalk),
    { name: 'head', parent: 'stem2', pivot: [0, 22, 0], cubes: [B([-3.5, 19, -2], [7, 7, 3], glowing(R('#ffe0e0', '#f0a0a8', '#d04050')), { detail: { north: eye } })] },
    ...[0, 1, 2, 3, 4, 5].map(k => { const a = k / 6 * Math.PI * 2; return rotBox('petal' + k, 'head', [Math.cos(a) * 5, 22.5 + Math.sin(a) * 5, 0], [2, 4, 1], [0, 0, Math.round(a * 57.3) - 90], stalk); }),
    ...[[-1, 8], [1, 11], [-1, 14], [1, 5]].flatMap(([s, y], i) => [
      rotBox('tent_' + i, 'body', [s * 4, y, 0], [6, 1, 1], [0, i * 30, s * 25], stalk),
      rotBox('tent_' + i + 'b', 'tent_' + i, [s * 8, y + 2, 0], [4, 1, 1], [0, 0, s * 50], R('#c8a8e8', '#a080c8'))]),
  ] };
}

// --------------------------------------------------------------------------------------- Test Subject (boss, three phases)
// Render: a long four-legged lizard - a big yellow head with a gaping pink mouth lined with teeth, a pale green body
// with a yellow-green belly, a row of orange spikes down the back and along the tail, which curls up at the end; a
// leather harness round its middle with a grey metal device on the back; orange claws. Phase 2 grows a second head,
// phase 3 a third (bones head_2 / head_3, shown by phase).
{
  const skin = withPattern(R('#d4f0a0', '#b4dc80', '#94c464', '#76a84c'), (f, x, y) => ((x * 7 + y * 5) % 13 === 0 ? -0.6 : 0));
  const yellow = R('#f4f48a', '#e0e060', '#c4c444', '#a0a030');
  const spike = R('#ffc060', '#f09030', '#d06a20');
  const mouth = (x, y, w, h) => (y >= h - 3 ? (y === h - 3 ? (x % 2 ? '#fffaf0' : '#d87080') : '#c85870') : y === 1 && (x === 1 || x === w - 2) ? '#1a1a10' : null);
  const headBone = (name, parent, x, z, rotY) => ({ name, parent, pivot: [x, 11, z], rot: [0, rotY, 0], cubes: [
    B([x - 3.5, 8, z - 9], [7, 6, 8], yellow, { detail: { north: mouth } }), B([x - 3, 7, z - 8], [6, 2, 6], R('#c85870', '#a84058'))] });
  const spikes = [];
  for (let k = 0; k < 6; k++) spikes.push(B([-0.5, 13, -4 + k * 3], [1, 2, 1], spike));
  out.test_subject = { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 9, 0], cubes: [B([-4, 6, -6], [8, 7, 16], skin), B([-3.5, 5, -5], [7, 1, 14], R('#e8f4a0', '#d4e488')), ...spikes,
      B([-4.5, 6, 0], [9, 7, 2], R('#8a6a44', '#6c5034')), B([-2, 13, 0], [4, 2, 3], R('#9a9ea8', '#787c86')), B([-0.5, 15, 1], [1, 3, 1], R('#787c86', '#5a5e66'))] },
    headBone('head', 'body', 0, -5, 0),
    headBone('head_2', 'body', -4, -4, 20),
    headBone('head_3', 'body', 4, -4, -20),
    { name: 'tail', parent: 'body', pivot: [0, 10, 10], rot: [20, 0, 0], cubes: [B([-2, 8, 10], [4, 4, 8], skin), ...[0, 1, 2].map(k => B([-0.5, 12, 11 + k * 3], [1, 2, 1], spike))] },
    { name: 'tail_1', parent: 'tail', pivot: [0, 12, 18], rot: [-60, 0, 0], cubes: [B([-1.5, 10, 18], [3, 3, 7], skin), B([-0.5, 13, 20], [1, 2, 1], spike)] },
    ...[['leg_fl', -1, -3], ['leg_fr', 1, -3], ['leg_bl', -1, 7], ['leg_br', 1, 7]].map(([n, s, z]) => ({ name: n, parent: 'body', pivot: [s * 4, 8, z], rot: [0, 0, s * -20], cubes: [
      B([s < 0 ? -7 : 4, 2, z - 1.5], [3, 6, 3], skin), B([s < 0 ? -8 : 4, 0, z - 3], [4, 2, 4], skin), B([s < 0 ? -8 : 4, 0, z - 4], [4, 1, 1], spike)] })),
  ] };
}

module.exports = out;
