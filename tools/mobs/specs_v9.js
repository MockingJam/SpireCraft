// Model v9 (user 2026-11-19: the review "杀戮尖塔2_Minecraft怪物原作还原度_修订版.md" - fidelity to the STS2
// silhouettes first: bodies of soft creatures not boxed in, floating and winding monsters not straightened, the
// bosses' irregular masses kept). Every point was checked against the render (slaythespire.wiki.gg StS2_<Name>.png)
// before changing; where the review's guess and the render disagree, the render wins. Overrides earlier entries.
const { R, withPattern, glowing, h2, hash, B, fin, eyeDetail, fringe, limb, figure, rotBox, octo } = require('./kit');
const at = (pts, c) => (x, y) => (pts.some(([a, b]) => a === x && b === y) ? c : null);
const leafMask = (face, x, y, w, h) => { const cx = (w - 1) / 2, t = y / Math.max(1, h - 1); const half = Math.sin(Math.PI * Math.min(1, t * 1.05 + 0.05)) * w / 2; return Math.abs(x - cx) <= half + 0.2; };
/** A tapering spike or horn as three stacked, shrinking cubes along its own axis (one bone). */
const spike = (name, parent, base, len, w, rot, mat) => ({ name, parent, pivot: base, rot, cubes: [
  B([base[0] - w / 2, base[1], base[2] - w / 2], [w, Math.ceil(len * 0.45), w], mat),
  B([base[0] - Math.max(1, w - 1) / 2, base[1] + Math.ceil(len * 0.45), base[2] - Math.max(1, w - 1) / 2], [Math.max(1, w - 1), Math.ceil(len * 0.35), Math.max(1, w - 1)], mat),
  B([base[0] - 0.5, base[1] + Math.ceil(len * 0.45) + Math.ceil(len * 0.35), base[2] - 0.5], [1, Math.max(1, len - Math.ceil(len * 0.45) - Math.ceil(len * 0.35)), 1], mat)] });
const out = {};

// ----------------------------------------------------------------------------------------------- Spiny Toad (A-R1C3)
// Render: a squat, fat toad - the body low and wide, a huge pale bulging belly in front, short thick legs set wide;
// two orange eyes bulging up from the top front of the head; two big curved black horns over the eyes and dark spikes
// scattered over the back; red-brown warts on dark teal-green skin.
{
  const skin = withPattern(R('#a8dcc4', '#84c4a6', '#64a68a', '#4a886e', '#346a54', '#244c3c'), (f, x, y) => (h2(x >> 1, y >> 1, 25) < 8 ? '#a84848' : h2(x, y, 26) < 7 ? 0.9 : 0));
  const belly = withPattern(R('#fbf6dc', '#ece2bc', '#d8cca0', '#bcae82'), (f, x, y) => (y % 3 === 0 ? 0.6 : 0));
  const horn = R('#4a524c', '#363c38', '#242826', '#141614');
  const backSpikes = [[-5, 15, 1, -20, 10], [0, 16, 3, -25, 0], [5, 15, 1, -20, -10], [-8, 13, 6, -30, 25], [8, 13, 6, -30, -25], [-3, 15, 7, -35, 10], [3, 15, 8, -35, -10], [0, 13, 11, -45, 0]];
  out.spiny_toad = { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 8, 2], cubes: [] },
    ...octo('trunk', 'body', [0, 9, 3], 17, 22, 13, 5, skin, 'z'),
    rotBox('belly', 'trunk', [0, 7, -5], [17, 11, 6], [-14, 0, 0], belly),
    rotBox('rump', 'trunk', [0, 8, 11], [16, 10, 4], [20, 0, 0], skin),
    ...backSpikes.map(([x, y, z, rx, rz], i) => spike('spine' + i, 'trunk', [x, y, z], 4, 2, [rx, 0, rz], horn)),
    { name: 'head', parent: 'body', pivot: [0, 11, -5], cubes: [B([-8, 14.6, -12], [16, 0, 1], R('#1e2a24', '#141c18'))] },
    ...octo('skull', 'head', [0, 12, -9], 8, 19, 8, 3, skin, 'z'),
    rotBox('jaw', 'head', [0, 8.5, -9], [17, 3, 8], [8, 0, 0], belly),
    ...[-1, 1].flatMap(s => [
      rotBox('eye' + s, 'head', [s * 6, 17, -9.5], [4, 4, 4], [0, 0, 0], R('#ffd070', '#f8a030', '#d07818'),
        { detail: { north: (x, y) => (x === 1 || x === 2) && y >= 1 ? '#1a0c04' : x === 0 && y === 0 ? '#fff4d0' : null } }),
      rotBox('lid' + s, 'head', [s * 6, 19, -9], [5, 1, 5], [-10, 0, 0], skin),
      spike('horn' + s, 'head', [s * 7, 18, -6], 7, 2, [-20, 0, s * -35], horn),
    ]),
    ...[-1, 1].flatMap(s => limb(s < 0 ? 'leg_fl' : 'leg_fr', 'body', [s * 8, 7, -4], { upper: [4, 3, 4], lower: [3, 4, 3], mat: skin, rot: [0, 0, s * 30], knee: [0, 0, -s * 30], foot: [6, 1, 6], footMat: skin })),
    ...[-1, 1].map(s => ({ name: s < 0 ? 'leg_bl' : 'leg_br', parent: 'body', pivot: [s * 9, 7, 8], cubes: [] })),
    ...[-1, 1].flatMap(s => [rotBox('haunch' + s, s < 0 ? 'leg_bl' : 'leg_br', [s * 10, 6, 7], [6, 8, 10], [10, s * 15, 0], skin),
      rotBox('hfoot' + s, s < 0 ? 'leg_bl' : 'leg_br', [s * 10, 0.5, 3], [6, 1, 8], [0, s * 15, 0], skin)]),
  ] };
}

// ----------------------------------------------------------------------------------------------- Tunneler (A-R1C4)
// Render: a mole cricket heaving itself out of a mound of dark earth - a huge domed maroon shell (by far the biggest
// mass), a small pink face with a bulbous snout and little black eyes tucked under its front, curving black feelers,
// two big shovel forelegs spread to the sides, the ribbed belly showing below.
{
  const shell = withPattern(R('#e090a6', '#c47088', '#a4546e', '#843e56', '#642c40'), (f, x, y, w, h) => (f === 'up' ? ((y % 5 === 0) ? -0.9 : 0.3) + (h2(x, y, 5) < 5 ? 0.8 : 0) : (y === 0 ? -0.8 : 0)));
  const ribs = withPattern(R('#c47a8c', '#a45e72', '#844458', '#663242'), (f, x, y) => (y % 2 === 0 ? 1 : 0));
  const pink = R('#ffd0dc', '#f4a8bc', '#dc849c', '#bc6680');
  const soil = withPattern(R('#7a5a3e', '#5e442c', '#46321e', '#302214'), (f, x, y) => (h2(x, y, 9) < 12 ? 1 : 0));
  out.tunneler = { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 4, 0], cubes: [] },
    ...[[0, 1.5, 0, 24, 3, 22, [0, 0, 0]], [-9, 2, 6, 10, 4, 10, [0, 20, 12]], [9, 2, -4, 10, 4, 10, [0, -25, -10]], [2, 3, 9, 12, 4, 8, [15, 10, 0]]].map(([x, y, z, w, h, d, r], i) => rotBox('mound' + i, 'body', [x, y, z], [w, h, d], r, soil)),
    rotBox('belly', 'body', [0, 7, -2], [12, 6, 12], [-20, 0, 0], ribs),
    ...octo('carapace', 'body', [0, 13, 2], 18, 22, 12, 5, shell, 'z', [-14, 0, 0]),
    rotBox('dome', 'carapace', [0, 19.5, 3], [14, 3, 13], [-14, 0, 0], shell),
    { name: 'head', parent: 'body', pivot: [0, 9, -7], cubes: [] },
    rotBox('face', 'head', [0, 8.5, -9], [7, 5, 4], [10, 0, 0], pink, { detail: { north: at([[1, 1], [5, 1]], '#101010') } }),
    rotBox('snout', 'head', [0, 7, -11.5], [4, 3, 3], [0, 0, 0], pink, { detail: { north: at([[1, 1], [2, 1]], '#5a2032') } }),
    ...[-1, 1].map(s => ({ name: 'feeler' + s, parent: 'head', pivot: [s * 2, 11, -9], rot: [-55, s * 20, 0], cubes: [B([s * 2 - 0.5, 11, -9.5], [1, 9, 1], R('#2a1a20', '#1a0e14'))] })),
    ...[['arm_l', -1], ['arm_r', 1]].flatMap(([n, s]) => [
      { name: n, parent: 'body', pivot: [s * 8, 9, -5], rot: [15, 0, s * 25], cubes: [B([s < 0 ? -13 : 8, 6, -8], [5, 5, 6], shell)] },
      rotBox(n + '_shovel', n, [s * 14, 4, -9], [8, 3, 9], [-10, s * 20, s * -25], withPattern(R('#d07890', '#a85670', '#7e3c54'), (f, x, y) => (f === 'up' && x % 2 === 0 ? 0.8 : 0)),
        { detail: { north: (x) => (x % 2 === 0 ? '#2a1018' : null) } }),
    ]),
  ] };
}

// ----------------------------------------------------------------------------------------------- Louse Progenitor (A-R2C1)
// Render: a huge woodlouse: its back is not a neat row of plates but big shaggy tufts of fur, blue and gold in
// irregular clumps, sweeping backwards; under them a brown segmented body, rows of short pale legs; curling green
// feelers at the front.
{
  const furBlue = withPattern(R('#b8dcff', '#8cbcf4', '#6a9ce4', '#4c7cc8', '#365ea6'), (f, x, y) => (x % 2 ? 0.5 : -0.3) + (hash(x, 3) === 0 ? 1 : 0));
  const furGold = withPattern(R('#fff0b0', '#f6d47c', '#e0b250', '#c08e34', '#9a6c22'), (f, x, y) => (x % 2 ? 0.5 : -0.3) + (hash(x, 4) === 0 ? 1 : 0));
  const brown = withPattern(R('#d8b48a', '#b8946a', '#98744e', '#785838'), (f, x, y) => (y % 2 === 0 ? 0.8 : 0));
  const tufts = [[-5, 11, -8, 9, 7, 7, furBlue, [-20, 10, 15]], [4, 12, -6, 10, 8, 8, furGold, [-25, -15, -10]], [-3, 13, 0, 12, 9, 8, furGold, [-30, 10, 8]],
    [5, 12, 3, 9, 8, 8, furBlue, [-28, -20, -12]], [-5, 12, 7, 10, 8, 8, furBlue, [-35, 15, 10]], [3, 11, 10, 11, 7, 8, furGold, [-40, -10, -8]], [0, 9, 14, 9, 6, 6, furBlue, [-45, 0, 0]]];
  out.louse_progenitor = { render: 'cutout', bones: [
    { name: 'body', pivot: [0, 5, 0], cubes: [] },
    ...octo('underbody', 'body', [0, 5, 2], 24, 15, 7, 2, brown, 'z'),
    ...tufts.map(([x, y, z, w, h, d, m, r], i) => rotBox('tuft' + i, 'body', [x, y, z], [w, h, d], r, m)),
    ...tufts.map(([x, y, z, w, h, d, m, r], i) => ({ name: 'tuftfringe' + i, parent: 'tuft' + i, pivot: [x, y, z], cubes: [fringe([x - w / 2, y - h / 2 - 2, z + d / 2 + 0.1], [w, h + 2, 0], m.ramp ? m : furBlue, 3, i)] })),
    { name: 'head', parent: 'body', pivot: [0, 5, -10], cubes: [B([-4, 2, -13], [8, 6, 4], brown, { detail: { north: at([[1, 2], [6, 2]], '#101010') } })] },
    ...[-1, 1].flatMap(s => [
      { name: 'ant' + s, parent: 'head', pivot: [s * 2.5, 6, -13], rot: [-30, s * 25, 0], cubes: [B([s * 2.5 - 0.5, 6, -19], [1, 1, 6], R('#9ad070', '#78b050'))] },
      { name: 'ant' + s + 'b', parent: 'ant' + s, pivot: [s * 2.5, 6.5, -19], rot: [70, s * 30, 0], cubes: [B([s * 2.5 - 0.5, 6, -23], [1, 1, 4], R('#9ad070', '#78b050'))] },
      { name: 'ant' + s + 'c', parent: 'ant' + s + 'b', pivot: [s * 2.5, 6.5, -23], rot: [70, 0, 0], cubes: [B([s * 2.5 - 0.5, 6, -26], [1, 1, 3], R('#b0e080', '#88c060'))] },
    ]),
    ...[-1, 1].flatMap(s => [0, 1, 2].map(k => ({ name: 'leg_' + (s < 0 ? 'l' : 'r') + k, parent: 'body', pivot: [s * 6.5, 3, -6 + k * 6], rot: [0, (1 - k) * 15 * s, s * 35], cubes: [B([s < 0 ? -9.5 : 6.5, 2.5, -6.5 + k * 6], [3, 1, 1], R('#f0e0c0', '#d0c0a0')), B([s < 0 ? -9.5 : 8.5, -0.5, -6.5 + k * 6], [1, 3, 1], R('#f0e0c0', '#d0c0a0'))] }))),
  ] };
}

// ----------------------------------------------------------------------------------------------- Ovicopter (A-R2C4)
// Render: a fly carrying its eggs - a pale cream, skull-like head with big dark eye pits, two orange mandibles curving
// down, a small furry white thorax, two pairs of long translucent amber wings held up and out (blurred with beating),
// and slung beneath and behind it a big teal egg-sac of round bumps; thin orange legs.
{
  const bone = withPattern(R('#fffdf4', '#f4ecd8', '#e2d6b8', '#c8b894'), (f, x, y) => (h2(x, y, 3) < 6 ? 0.7 : 0));
  const egg = withPattern(R('#c4f4e4', '#94e0cc', '#68c6b0', '#48a894', '#328876'), (f, x, y) => (Math.hypot((x % 4) - 1.5, (y % 4) - 1.5) > 1.8 ? 1.5 : (x % 4 === 1 && y % 4 === 1 ? -1 : 0)));
  const amber = { ramp: ['#ffe8c8', '#f8c890', '#e8a060', '#c87838'], alpha: 135 };
  const orange = R('#ffc080', '#f49850', '#d87430', '#b05620');
  const bumps = [[0, 8, 6, 10, 10, 10], [-4, 6, 9, 7, 7, 7], [4, 6, 10, 7, 7, 7], [0, 4, 12, 8, 6, 7], [-3, 11, 10, 6, 6, 6], [3, 10, 4, 6, 6, 6], [0, 3, 7, 6, 5, 6]];
  out.ovicopter = { render: 'translucent', bones: [
    { name: 'body', pivot: [0, 12, 0], cubes: [] },
    ...octo('thorax', 'body', [0, 13, -1], 7, 8, 8, 2, withPattern(R('#ffffff', '#f2f0ea', '#dcd8cc'), (f, x) => (x % 2 ? 0.6 : 0)), 'z'),
    ...bumps.map(([x, y, z, w, h, d], i) => rotBox('egg' + i, 'body', [x, y, z], [w, h, d], [i * 11 % 30, i * 23 % 40, i * 17 % 30], egg)),
    { name: 'head', parent: 'body', pivot: [0, 13, -5], cubes: [] },
    ...octo('skull', 'head', [0, 13, -9], 8, 10, 9, 2, bone, 'z'),
    rotBox('face', 'skull', [0, 13, -13.2], [9, 7, 1], [0, 0, 0], bone, { detail: { north: (x, y) => (((x === 1 || x === 2) && (y === 1 || y === 2)) || ((x === 6 || x === 7) && (y === 1 || y === 2)) ? '#1a1410' : ((x === 3 || x === 5) && y === 4) ? '#2a2018' : null) } }),
    ...[-1, 1].flatMap(s => [rotBox('mand' + s, 'head', [s * 2.5, 8.5, -12], [2, 4, 2], [-15, 0, s * -15], orange), rotBox('mand' + s + 't', 'mand' + s, [s * 2, 5.5, -13], [1, 3, 2], [30, 0, s * 10], orange)]),
    ...[['wing_l', -1, 0], ['wing_r', 1, 0], ['tent_0', -1, 1], ['tent_1', 1, 1]].map(([n, s, k]) => ({ name: n, parent: 'body', pivot: [s * 3, 17, -1 + k * 3], rot: [-10 + k * 10, s * (15 + k * 20), s * -(35 - k * 10)], cubes: [
      B([s < 0 ? -21 : 3, 17, -3 + k * 3], [18, 0, 5], withPattern(amber, (f, x, y) => (x % 5 === 0 || y === 2 ? 1.2 : 0)), { mask: leafMask })] })),
    ...[-1, 1].flatMap(s => [0, 1, 2].map(k => ({ name: 'leg_' + (s < 0 ? 'l' : 'r') + k, parent: 'body', pivot: [s * 3, 10, -3 + k * 2], rot: [10, (1 - k) * 20 * s, s * 20], cubes: [B([s < 0 ? -7 : 3, 9.5, -3.5 + k * 2], [4, 1, 1], orange), B([s < 0 ? -7 : 6, 4.5, -3.5 + k * 2], [1, 5, 1], orange)] }))),
  ] };
}

// ----------------------------------------------------------------------------------------------- Phantasmal Gardener (B-R2C1)
// Render: one long tan stalk curving in a strong S - out at the bottom, back through the middle, forward again at the
// top - ringed like a worm; a crest of red frills fanning sideways at the top; thin cyan ghost-ribbons waving along
// the inner and outer sides of the curve.
{
  const stalk = withPattern(R('#fbe6c0', '#e4c69a', '#c8a678', '#a6845a'), (f, x, y) => (y % 3 === 0 ? 1 : 0));
  const crest = R('#ffb4a4', '#f48070', '#d4544c', '#a8383a');
  const rib = { ramp: ['#e8ffff', '#b0f0f8', '#7ad8ec'], alpha: 140 };
  const S = [[0, 0, 0, 0], [1, 0, 6, 28], [2, 0, 12, -38], [3, 0, 18, -30], [4, 0, 24, 40]];
  const segs = S.map(([i, x, y, rx]) => ({ name: i === 0 ? 'body' : 'seg_' + i, parent: i === 0 ? undefined : i === 1 ? 'body' : 'seg_' + (i - 1), pivot: [0, y, 0], rot: [rx, 0, 0],
    cubes: [B([-1.5, y, -1.5], [3, 6, 3], stalk), ...(i === 0 ? [B([-2.5, 0, -2.5], [5, 1, 5], R('#a6845a', '#7e6040'))] : [])] }));
  out.phantasmal_gardener = { render: 'translucent', bones: [
    ...segs,
    { name: 'head', parent: 'seg_4', pivot: [0, 30, 0], rot: [-20, 0, 0], cubes: [B([-1.5, 30, -1.5], [3, 3, 3], stalk)] },
    ...[-60, -30, 0, 30, 60].map((a, k) => ({ name: 'frill' + k, parent: 'head', pivot: [0, 32, 0], rot: [-10, a, (k - 2) * 12], cubes: [B([0, 32, -1], [0, 7 + (k % 2) * 2, 6], crest, { mask: (f, x, y, w, h) => Math.abs(x - 2.5) <= (h - y) * 0.35 + 0.4 && (y > 0 || x % 2 === 0) })] })),
    ...[[2, 'seg_1', 1], [-2, 'seg_2', -1], [2, 'seg_3', 1], [-2, 'seg_4', -1]].map(([x, p, s], i) => ({ name: 'tent_' + i, parent: p, pivot: [x, 6 + i * 6, 0], rot: [0, 0, s * 25], cubes: [B([x, i * 6, 0], [0, 12, 4], withPattern(rib, (f, px, y) => (y % 3 === 0 ? 1 : 0)), { mask: (f, px, y) => Math.abs(px - 1.5 - Math.sin(y * 0.6 + i) * 1.3) <= 1 })] })),
  ] };
}

// ----------------------------------------------------------------------------------------------- Decimillipede (B-R2C2)
// Render: a big centipede arched up into a hump - broad, overlapping dark navy back plates, a warm orange belly, many
// thin orange legs down both sides, rounded orange faces at both ends.
{
  const navy = withPattern(R('#8090c8', '#6070a8', '#48568e', '#344072', '#262e56'), (f, x, y, w, h) => (f === 'up' ? (y === 0 ? 1.3 : 0) : y === 0 ? 1 : 0));
  const orange = withPattern(R('#ffd8a8', '#f8ac6c', '#e48a48', '#c06a30'), (f, x, y) => (y % 2 === 0 ? 0.6 : 0));
  const arch = [-28, -22, -14, -6, 6, 14, 22, 28];
  const segs = [];
  arch.forEach((rx, i) => {
    const name = 'seg_' + (i + 1), parent = i === 0 ? 'body' : 'seg_' + i, z = -4 + i * 5;
    segs.push({ name, parent, pivot: [0, 4, z], rot: [i === 0 ? 30 : -(arch[i] - arch[i - 1]), 0, 0], cubes: [] });
    segs.push(...octo(name + '_plate', name, [0, 6, z + 2.5], 5, 10, 7, 2, navy, 'z'));
    segs.push(rotBox(name + '_belly', name, [0, 2.5, z + 2.5], [8, 2, 5], [0, 0, 0], orange));
    segs.push(...[-1, 1].flatMap(s => [0, 1].map(k => rotBox(name + '_leg' + s + k, name, [s * 6, 0.5, z + 1.5 + k * 2], [5 + ((i + k) % 3), 1, 1], [0, s * (10 - k * 20), s * 40], orange))));
  });
  out.decimillipede = { render: 'cutout', bones: [
    { name: 'head', pivot: [0, 4, -8], cubes: [] },
    ...octo('face', 'head', [0, 5, -9], 4, 9, 9, 3, orange, 'z'),
    rotBox('mandible_l', 'head', [-2.5, 2, -12], [2, 2, 3], [0, 20, 0], orange), rotBox('mandible_r', 'head', [2.5, 2, -12], [2, 2, 3], [0, -20, 0], orange),
    rotBox('eye_spot', 'face', [0, 6, -11.2], [7, 2, 1], [0, 0, 0], orange, { detail: { north: at([[1, 0], [5, 0]], '#2a1408') } }),
    { name: 'body', parent: 'head', pivot: [0, 4, -7], rot: [0, 0, 0], cubes: [] },
    ...segs,
    { name: 'tail', parent: 'seg_8', pivot: [0, 4, 36], cubes: [] }, ...octo('tail_face', 'tail', [0, 5, 37.5], 3, 9, 9, 3, orange, 'z'),
  ] };
}

// ----------------------------------------------------------------------------------------------- Infested Prism (B-R2C3)
// Render: a triangular wedge of red-brown flesh - three clear ridges, its faces wrinkled in rings that grow out from a
// dark hollow in the front, a single yellow eye inside; three clusters of blue crystal cones hang off its corners,
// pointing outwards at different angles.
{
  const flesh = withPattern(R('#f09484', '#d8705e', '#b8544a', '#943e3a', '#6e2c2c'), (f, x, y, w, h) => { const d = Math.hypot(x - w / 2, y - h * 0.6); return Math.round(d) % 3 === 0 ? 1.2 : Math.round(d) % 3 === 1 ? -0.5 : 0; });
  const crystal = withPattern({ ramp: ['#e8f8ff', '#b4dcf8', '#84bcec', '#5c98d4', '#4078b8'], alpha: 230 }, (f, x, y) => ((x + y) % 3 === 0 ? -0.8 : y === 0 ? 1 : 0));
  const tri = (f, x, y, w, h) => (f !== 'north' && f !== 'south') || Math.abs(x - (w - 1) / 2) <= (y + 0.5) * (w / 2) / h + 0.3;
  const cone = (name, parent, base, rot) => ({ name, parent, pivot: base, rot, cubes: [B([base[0] - 2, base[1], base[2] - 2], [4, 3, 4], crystal), B([base[0] - 1.5, base[1] + 3, base[2] - 1.5], [3, 3, 3], crystal), B([base[0] - 1, base[1] + 6, base[2] - 1], [2, 3, 2], crystal), B([base[0] - 0.5, base[1] + 9, base[2] - 0.5], [1, 2, 1], crystal)] });
  out.infested_prism = { render: 'translucent', glow: true, bones: [
    { name: 'body', pivot: [0, 12, 0], cubes: [] },
    rotBox('front', 'body', [0, 13, -5], [22, 22, 0], [22, 0, 0], flesh, { mask: tri }),
    rotBox('back_l', 'body', [-5.5, 13, 3], [22, 22, 0], [-22, 60, 0], flesh, { mask: tri }),
    rotBox('back_r', 'body', [5.5, 13, 3], [22, 22, 0], [-22, -60, 0], flesh, { mask: tri }),
    rotBox('base', 'body', [0, 2.5, 0], [16, 1, 12], [0, 0, 0], flesh),
    rotBox('core', 'body', [0, 9, 0], [10, 12, 8], [0, 0, 0], R('#6e2c2c', '#501e1e')),
    rotBox('hollow', 'front', [0, 10, -5.4], [8, 8, 0], [0, 0, 0], R('#2a0c0c', '#180606'), { mask: (f, x, y) => Math.hypot(x - 3.5, y - 3.5) <= 4 }),
    rotBox('eye', 'hollow', [0, 10.5, -5.6], [3, 3, 1], [0, 0, 0], glowing(R('#fff6a0', '#f0d040', '#c09020')), { detail: { north: at([[1, 1]], '#201008') } }),
    { name: 'orbit', parent: 'body', pivot: [0, 12, 0], cubes: [] },
    ...[[-15, 6, 6, [0, 0, 60]], [-13, 9, 9, [30, 0, 80]], [15, 7, 5, [0, 0, -60]], [14, 4, 8, [-30, 0, -100]], [0, 26, -2, [-10, 0, 0]], [3, 25, 2, [25, 0, -20]]].map(([x, y, z, r], i) => cone('crystal' + i, 'orbit', [x, y, z], r)),
  ] };
}

// ----------------------------------------------------------------------------------------------- Punch Construct (C-R2C5)
// Render: a golden clockwork boxer - the two fists are the biggest things on it (one wrapped in grey chain), held up
// in a guard with chunky forearms; a compact plated torso, a rounded head with a cyan visor; wide-bent, thin
// segmented legs.
{
  const brass = withPattern(R('#fff0b8', '#f2d88e', '#dcbc6a', '#bc9a4c', '#987834', '#745a24'), (f, x, y, w, h) => (x === 0 || y === 0 ? 1 : x === w - 1 ? -0.6 : (x * 3 + y) % 7 === 0 ? 0.6 : 0));
  const chain = withPattern(R('#c8ccd4', '#9ca2ac', '#767c88', '#545a64'), (f, x, y) => ((x + y) % 2 === 0 ? 1 : -0.4));
  const o = { thigh: [3, 7, 3], shin: [3, 7, 3], foot: [5, 2, 6], hipW: 8, legSplay: 20, knee: 25, pelvis: [8, 3, 5], waist: [6, 4, 5], chest: [12, 8, 7],
    upperArm: [4, 6, 4], foreArm: [5, 6, 5], hand: [8, 8, 8], neck: [3, 2, 3], head: [7, 7, 7], armFwd: -55, elbow: -75, armOut: 22, lean: 10,
    mats: { skin: brass, legs: brass, pelvis: brass, waist: brass, chest: brass, arms: brass, hands: brass, head: brass } };
  o.face = (x, y) => (y >= 2 && y <= 3 ? (y === 2 ? '#c0faff' : '#40b8d8') : null);
  o.parts = { body: [B([-7, 18, -3], [14, 2, 7], brass)] };
  o.mats.hands = brass;
  o.extra = [];
  o.glow = true;
  out.punch_construct = figure(o);
}

// ===================================================================================================== bosses (v9)
const v8 = require('./specs_v8'), v7 = require('./specs_v7');
const pick = (spec, test) => spec.bones.filter(test);
const named = (spec, name) => spec.bones.find(b => b.name === name);

// ----------------------------------------------------------------------------------------------- Kaiser Crab (E-R1C3-C4)
// Review (checked against the sprites): the shell should arch higher in the middle; the claws read as straight tubes -
// the joints should swell and pinch (big, small, big) and the pincers open; the walking legs should not be identical.
{
  const shell = R('#8a7ab4', '#6c5c98', '#56487e', '#443866', '#342a52', '#261e3e');
  const skin = withPattern(shell, (f, x, y) => (f === 'up' ? (h2(x >> 1, y >> 1, 13) < 10 ? 1.0 : 0) + (h2(x, y, 17) < 4 ? -0.8 : 0) : f === 'down' ? 1.2 : (h2(x, y, 19) < 6 ? 0.8 : 0)));
  const metal = withPattern(R('#d0dcec', '#aebdd2', '#8ea0ba', '#71849e', '#566882', '#3e4e66'), (f, x, y) => (x % 6 === 0 ? 1.1 : x % 6 === 1 ? -0.6 : (x % 6 === 3) && y % 4 === 1 ? '#e8eef8' : 0));
  const purple = withPattern(R('#c8a8f0', '#aa8ad8', '#8e70be', '#7458a2', '#5c4486', '#46326a'), (f, x, y) => (h2(x >> 1, y >> 1, 23) < 12 ? 0.9 : 0) + (h2(x, y, 29) < 5 ? -0.7 : 0));
  const c8 = v8.kaiser_crab;
  // legs: four a side, each a thick upper and a thin pointed lower, lengths and splay varying
  const legs = [-1, 1].flatMap(s => [[-12, 13, 11], [-6, 15, 12], [0, 14, 13], [6, 12, 10]].flatMap(([z, upLen, lowLen], i) => [
    { name: 'leg_' + (s < 0 ? 'l' : 'r') + i, parent: 'body', pivot: [s * 24, 13, z], rot: [0, s * (i - 1.5) * 14, s * 18], cubes: [B([s < 0 ? -24 - upLen : 24, 11.5, z - 1.5], [upLen, 3, 3], withPattern(shell, (f, x) => (x % 5 === 0 ? 1.1 : 0)))] },
    { name: 'leg_' + (s < 0 ? 'l' : 'r') + i + '_tip', parent: 'leg_' + (s < 0 ? 'l' : 'r') + i, pivot: [s * (24 + upLen), 13, z], rot: [0, 0, s * -(40 + i * 6)], cubes: [
      B([s < 0 ? -25 - upLen : 23 + upLen, 13 - lowLen * 0.6, z - 1], [2, Math.round(lowLen * 0.6), 2], shell), B([s < 0 ? -24.5 - upLen : 23.5 + upLen, 13 - lowLen, z - 0.5], [1, Math.round(lowLen * 0.4), 1], R('#b8a8d8', '#9a8abc'))] },
  ]));
  out.kaiser_crab = { ...c8, bones: [
    ...pick(c8, b => !b.name.startsWith('leg_') && !/^(crusher|rocket)_/.test(b.name) && b.name !== 'claw_crusher' && b.name !== 'claw_rocket'),
    ...octo('dome', 'carapace', [0, 27, 2], 30, 36, 5, 2, skin, 'z'),                                     // the arch of the back
    ...legs,
    // the Crusher: swelling shoulder, pinched elbow, a fat capsule claw with its finger open
    { name: 'claw_crusher', parent: 'body', pivot: [26, 14, -10], rot: [0, -15, 0], cubes: [] },
    ...octo('crusher_shoulder', 'claw_crusher', [28, 13, -12], 9, 10, 10, 3, metal, 'z'),
    rotBox('crusher_arm', 'claw_crusher', [29.5, 9.5, -22], [6, 6, 12], [-20, 0, 0], metal),
    ...octo('crusher_wrist', 'claw_crusher', [30.5, 6, -31], 6, 9, 9, 2, metal, 'z'),
    ...octo('crusher_claw', 'claw_crusher', [31, 7, -44], 20, 14, 15, 5, metal, 'z'),
    rotBox('crusher_finger', 'crusher_claw', [31, 15, -51], [7, 4, 14], [24, 0, 0], withPattern(R('#d0dcec', '#aebdd2', '#8ea0ba', '#71849e'), (f, x, y) => (y === 0 ? -0.8 : 0))),
    rotBox('crusher_edge', 'crusher_claw', [31, 6, -54.5], [10, 9, 1], [0, 0, 0], R('#f4f8fc', '#d8e0ec')),
    // the Rocket: a thick upper arm, a narrow wrist, a swollen palm, two long curved fingers opened wide
    { name: 'claw_rocket', parent: 'body', pivot: [-26, 14, -10], rot: [0, 18, 0], cubes: [] },
    ...octo('rocket_shoulder', 'claw_rocket', [-29, 13, -13], 10, 11, 11, 3, purple, 'z'),
    rotBox('rocket_arm', 'claw_rocket', [-32, 10, -24], [8, 8, 12], [-14, 0, 0], purple),
    ...octo('rocket_wrist', 'claw_rocket', [-34, 7, -33], 6, 9, 9, 2, purple, 'z'),
    ...octo('rocket_palm', 'claw_rocket', [-36, 8, -45], 16, 16, 16, 5, purple, 'z'),
    rotBox('rocket_low', 'rocket_palm', [-37, 2.5, -58], [7, 5, 12], [-6, 0, 0], purple),
    rotBox('rocket_low_tip', 'rocket_low', [-37, 3, -68], [5, 4, 10], [-14, 14, 0], purple),
    rotBox('rocket_up', 'rocket_palm', [-36, 15, -55], [6, 4, 11], [34, 0, 0], purple),
    rotBox('rocket_up_tip', 'rocket_up', [-36, 12.5, -64], [5, 3, 9], [-30, 8, 0], withPattern(R('#c8a8f0', '#aa8ad8', '#8e70be'), (f, x, y) => (y === 2 ? '#ecdcfc' : 0))),
  ] };
}

// ----------------------------------------------------------------------------------------------- Knowledge Demon (E-R1C5-C6)
// Checked against the render: no horns - that is the tall golden hood; the green below is the egg-stone. Kept true to
// that. What the review rightly asks: the limbs should flow, not join like a robot's - each ribbon arm now bends in
// three angled lengths (shoulder, upper, fore) narrowing to the hand; the egg-stone is uneven, not a cut gem.
{
  const bands = R('#f2f2ee', '#dcdcd6', '#c4c4be', '#a8a8a2', '#8a8a86', '#6c6c6a');
  const wrap = withPattern(bands, (f, x, y) => ((x + y * 2) % 5 === 0 ? 1.3 : (x + y * 2) % 5 === 1 ? -0.5 : 0));
  const egg = withPattern(R('#c8f4a0', '#9ade78', '#74c25a', '#54a242', '#3c8030', '#2a6022'), (f, x, y) => ((x * 2 + y) % 7 === 0 || (x - y * 3) % 9 === 0 ? '#e0ffc0' : h2(x, y, 3) < 8 ? 1 : 0));
  const d8 = v8.knowledge_demon;
  const arm = (name, y, s, a0, a1, a2) => {
    const x0 = s * 5;
    return [
      { name, parent: 'body', pivot: [x0, y, 0], rot: [0, s * 8, s * a0], cubes: [B([s < 0 ? x0 - 7 : x0, y - 1.5, -1.5], [7, 3, 3], wrap)] },
      { name: name + '_fore', parent: name, pivot: [x0 + s * 7, y, 0], rot: [0, 0, s * a1], cubes: [B([s < 0 ? x0 - 14 : x0 + 7, y - 1, -1], [7, 2, 2], wrap)] },
      { name: name + '_hand', parent: name + '_fore', pivot: [x0 + s * 14, y, 0], rot: [-20, 0, s * a2], cubes: [
        B([s < 0 ? x0 - 20 : x0 + 14, y - 1, -1], [6, 2, 2], wrap), B([s < 0 ? x0 - 24 : x0 + 20, y - 1.5, -2], [4, 1, 4], bands),
        ...[0, 1, 2].map(k => B([s < 0 ? x0 - 27 : x0 + 24, y - 1.5, -2 + k * 1.5], [3, 1, 1], bands)), B([s < 0 ? x0 - 23 : x0 + 22, y - 0.5, -3], [1, 2, 1], bands)] },
    ];
  };
  out.knowledge_demon = { ...d8, bones: [
    ...pick(d8, b => !b.name.startsWith('arm_') && !b.name.startsWith('egg') && b.name !== 'egg_top'),
    ...[[0, 7, 0, 14, 11, 13, [0, 0, 0]], [-2, 10, 2, 9, 7, 9, [12, 20, 10]], [3, 9, -2, 8, 7, 8, [-10, -25, -12]], [0, 13, 0, 8, 3, 8, [5, 40, 5]]].map(([x, y, z, w, h, d, r], i) => rotBox('egg' + i, 'stone', [x, y, z], [w, h, d], r, egg)),
    ...arm('arm_l0', 34, -1, -45, -40, -30), ...arm('arm_r0', 34, 1, -45, -40, -30),
    ...arm('arm_l1', 30, -1, 10, 25, -15), ...arm('arm_r1', 30, 1, 10, 25, -15),
    ...arm('arm_l2', 25, -1, 40, -20, -25), ...arm('arm_r2', 25, 1, 40, -20, -25),
  ] };
}

// ----------------------------------------------------------------------------------------------- Waterfall Giant (E-R2C3-C4)
// Render: the rocks are not a matched pair of pauldrons - one great mass of stone, bigger on its left shoulder,
// slabs of uneven size stacked off-true; one broad sheet of water spills from a cleft in its back and pours down,
// splitting into thinner streams near the ground; it leans its weight forward.
{
  const rock = withPattern(R('#c8ccc4', '#a8aea4', '#8a9086', '#6e746c', '#565c54', '#40463e'), (f, x, y) => (f === 'up' ? (h2(x >> 1, y >> 1, 41) < 30 ? '#7aa858' : -0.4) : (h2(x, y, 43) < 6 ? 1.2 : (x + y) % 7 === 0 ? -0.6 : 0)));
  const sheet = withPattern({ ramp: ['#e8fcff', '#b0e8fa', '#7ccaf0', '#58aee0'], alpha: 170 }, (f, x, y) => ((x + Math.floor(y / 2)) % 4 === 0 ? -1 : (x % 3 === 0 ? 1 : 0)));
  const w8 = v8.waterfall_giant;
  const rocks = [[-3, 28, -9, 30, 16, 18, [-10, 6, 6]], [-11, 39, -11, 16, 11, 14, [8, 18, 14]], [9, 37, -7, 11, 8, 10, [-8, -24, -14]], [-2, 42, -3, 12, 6, 12, [14, 32, 4]],
    [1, 24, 5, 24, 12, 15, [8, -6, -4]], [-8, 30, 6, 11, 7, 10, [0, 22, 18]], [7, 28, 9, 9, 6, 8, [-14, -12, -16]], [0, 21, 16, 19, 11, 10, [16, 4, 0]], [2, 27, 17, 9, 5, 7, [22, 15, 8]], [-12, 22, -2, 8, 10, 10, [0, 10, 20]]];
  out.waterfall_giant = { ...w8, bones: [
    { name: 'body', pivot: [0, 20, 0], rot: [-6, 0, 0], cubes: [B([-4, 45, -4], [1, 4, 0], R('#9ad070', '#78b050')), B([3, 43, -8], [3, 2, 0], R('#b0e080', '#88c060'))] },
    ...rocks.map(([x, y, z, w, h, d, r], i) => rotBox('rock' + i, 'body', [x, y, z], [w, h, d], r, rock)),
    ...pick(w8, b => b.name === 'head' || ['skull', 'jaw_rock', 'brow_rock'].includes(b.name) || b.name.startsWith('leg_')),
    // the falls: one broad sheet from the cleft over the back, widening as it drops, breaking into streams at the foot
    { name: 'tent_0', parent: 'body', pivot: [0, 38, 4], cubes: [
      B([-6, 20, 13.6], [14, 18, 0], sheet), B([-9, 4, 13.8], [20, 16, 0], sheet, { mask: (f, x, y, w, h) => y < 10 || x % 4 !== 3 }),
      B([-9, 0, 13.8], [20, 4, 0], sheet, { mask: (f, x) => x % 3 !== 1 }),
      B([12.2, 6, -6], [0, 26, 20], sheet, { mask: (f, x, y, w, h) => x > w * 0.25 * (1 - y / h) && (y < h - 6 || x % 3 !== 0) }),
    ] },
  ] };
}

// ----------------------------------------------------------------------------------------------- Lagavulin Matriarch (E-R2C5-C6)
// Render: the shell of pale stones is the mass of the creature - much higher and bigger than the crab; the orange legs
// splay out of it in clear thick-near, thin-far segments; the big claw reaches forward; the helmet head has its dark slit.
{
  const pebble = withPattern(R('#fffef6', '#f6f0dc', '#e4dcc2', '#ccc2a4', '#aea486'), (f, x, y) => ((x * 3 + y * 5) % 13 === 0 || (x - y * 2) % 11 === 0 ? '#e09040' : (x + y) % 5 === 0 ? -0.6 : 0));
  const orange = withPattern(R('#ffd09c', '#f8a860', '#e88838', '#c86a22', '#a05018'), (f, x) => (x === 0 ? -0.6 : 0));
  const joint = R('#5a3a28', '#3e281a');
  const l8 = v8.lagavulin_matriarch;
  const heap = [[0, 20, 12, 26, 20, 24, [0, 10, 0]], [-10, 36, 10, 17, 15, 17, [15, 20, 10]], [10, 35, 14, 18, 14, 18, [-10, -25, -12]], [0, 47, 11, 17, 12, 16, [20, 40, 0]],
    [-13, 21, 24, 16, 14, 16, [-15, 30, 10]], [13, 20, 25, 16, 13, 16, [10, -20, -15]], [0, 19, 29, 20, 16, 13, [25, 0, 0]], [-6, 55, 12, 10, 8, 10, [0, 20, 25]], [8, 44, 23, 13, 12, 13, [-20, 15, 10]], [-15, 39, 21, 12, 10, 12, [10, -30, 20]]];
  const leg = (n, s, z, len, low) => [
    { name: n, parent: 'body', pivot: [s * 7, 10, z], rot: [0, 0, s * -15], cubes: [B([s < 0 ? -7 - len : 7, 8.5, z - 2], [len, 4, 4], orange), B([s < 0 ? -8 - len : 6 + len, 8, z - 2.5], [2, 5, 5], joint)] },
    { name: n + '_tip', parent: n, pivot: [s * (7 + len), 10, z], rot: [0, 0, s * -58], cubes: [B([s < 0 ? -8 - len : 6 + len, 10 - low, z - 1], [2, low, 2], orange), B([s < 0 ? -7.5 - len : 6.5 + len, 10 - low - 3, z - 0.5], [1, 3, 1], joint)] },
  ];
  out.lagavulin_matriarch = { ...l8, bones: [
    { name: 'body', pivot: [0, 9, 0], cubes: [] },
    ...heap.map(([x, y, z, w, h, d, r], i) => rotBox('stone' + i, 'body', [x, y, z], [w, h, d], r, pebble)),
    rotBox('crab_body', 'body', [0, 9, -3], [14, 8, 12], [10, 0, 0], orange),
    ...pick(l8, b => b.name === 'head' || b.name === 'arm_r' || b.name === 'arm_l'),
    ...leg('leg_l0', -1, -6, 14, 13), ...leg('leg_r0', 1, -6, 14, 13), ...leg('leg_l1', -1, 0, 16, 14), ...leg('leg_r1', 1, 0, 16, 14), ...leg('leg_l2', -1, 6, 13, 12), ...leg('leg_r2', 1, 6, 13, 12),
  ] };
}

// ----------------------------------------------------------------------------------------------- The Insatiable (E-R3C1-C2)
// Render: a sandworm; the maw is the focus - a huge orange trumpet; the body winds, side to side as well as up; the
// "square base" was a sand mound: now a low, uneven ring of tilted sand slabs round the hole it bursts from. (The
// review's "red-brown limbs" are its blue feelers in the render; kept blue.)
{
  const sand = withPattern(R('#f4e4b8', '#e4d098', '#ccb47c', '#b09862'), (f, x, y) => ((x * 2 + y) % 5 === 0 ? 0.8 : 0));
  const blue = withPattern(R('#b8cce0', '#98aec8', '#7a92ae', '#5e7692', '#465c76', '#34465c'), (f, x, y, w, h) => (f === 'down' ? '#d8c49c' : (y % 4 === 0 ? 1.2 : y % 4 === 1 ? -0.5 : 0)));
  const maw = R('#ffe0a8', '#fbb870', '#ee8a48', '#d0602e', '#a03c20', '#5a1a10');
  const i8 = v8.insatiable;
  out.insatiable = { ...i8, bones: [
    { name: 'body', pivot: [0, 0, 6], cubes: [B([-6, 0, 0], [12, 1, 12], R('#3a2a18', '#2a1e10'))] },
    ...[[-9, 1.5, 2, 9, 3, 12, [0, 15, 14]], [9, 1.5, 4, 9, 3, 12, [0, -20, -14]], [0, 1.5, -5, 14, 3, 6, [-16, 0, 0]], [0, 1.5, 14, 14, 3, 6, [16, 0, 0]], [-8, 1, 12, 7, 2, 7, [10, 40, 10]], [8, 1, -3, 7, 2, 7, [-10, 40, -10]]].map(([x, y, z, w, h, d, r], i) => rotBox('dune' + i, 'body', [x, y, z], [w, h, d], r, sand)),
    { name: 'seg_1', parent: 'body', pivot: [0, 2, 6], rot: [-40, 18, 0], cubes: [] }, ...octo('ring1', 'seg_1', [0, 9, 4], 14, 17, 16, 4, blue, 'z'),
    { name: 'seg_2', parent: 'seg_1', pivot: [0, 9, -3], rot: [-30, -30, 0], cubes: [] }, ...octo('ring2', 'seg_2', [0, 9, -9], 12, 16, 15, 4, blue, 'z'),
    { name: 'seg_3', parent: 'seg_2', pivot: [0, 9, -15], rot: [-15, 22, 0], cubes: [] }, ...octo('ring3', 'seg_3', [0, 9, -19], 9, 15, 14, 4, blue, 'z'),
    { name: 'head', parent: 'seg_3', pivot: [0, 9, -23], rot: [50, 0, 0], cubes: [
      B([-6, 3, -28], [12, 12, 4], withPattern(maw, (f) => (f === 'north' ? '#3a0c08' : 1))),
      ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => B([Math.round(Math.cos(k * 0.628) * 4.5) - 0.5, 9 + Math.round(Math.sin(k * 0.628) * 4.5) - 0.5, -28.5], [1, 1, 1], R('#fffaf0', '#e8dcc8'))) ] },
    ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => { const a = k * 36, rad = a * Math.PI / 180, cx = Math.cos(rad) * 10, cy = 9 + Math.sin(rad) * 10;
      return { name: 'petal' + k, parent: 'head', pivot: [cx * 0.7, 9 + (cy - 9) * 0.7, -28], rot: [Math.round(-Math.sin(rad) * 48), Math.round(Math.cos(rad) * 48), 0], cubes: [
        B([cx - 4, cy - 4, -32], [8, 8, 3], withPattern(maw, (f, x, y) => (f === 'north' ? (Math.hypot(x - 3.5, y - 3.5) < 2 ? 3 : 1.5) : 0.5)))] }; }),
    ...pick(i8, b => b.name.startsWith('tent_')),
  ] };
}

// ----------------------------------------------------------------------------------------------- Phrog Parasite (E-R3C5-C6)
// Review: the sac should bulge and sag, heavy at the bottom; each worm should come out of its own hole, thick at the
// root, thinner to the tip, different lengths and bends - not even orange twigs.
{
  const sac = withPattern(R('#f8f48c', '#e2dc60', '#c4bc3c', '#a09a2a', '#7a741e'), (f, x, y) => (h2(x >> 1, y >> 1, 12) < 12 ? '#4a4818' : h2(x, y, 13) < 6 ? 1.2 : 0));
  const worm = withPattern(R('#ffcc88', '#f4a860', '#d88440', '#b0642c'), (f, x, y) => (y % 2 === 0 ? 1 : 0));
  const p8 = v8.phrog_parasite;
  const worms = [];
  for (let i = 0; i < 11; i++) {
    const a = i * 2.3, up = ((i * 7) % 5 - 2) * 0.25, dx = Math.cos(a), dz = Math.sin(a), len = 4 + (i * 3) % 4, r0 = 9.5;
    const x0 = Math.round(dx * r0), z0 = Math.round(dz * r0), y0 = 12 + Math.round(up * 10);
    const cubes = [B([x0 - 1.5, y0 - 1.5, z0 - 1.5], [3, 3, 3], R('#3a3410', '#2a240a'))];   // the dark hole it comes out of
    for (let k = 0; k < len + 2; k++) { const t = k / (len + 2), w = t < 0.6 ? 2 : 1; cubes.push(B([x0 + Math.round(dx * (k + 1)) - w / 2, y0 + Math.round(k * 0.9 + t * t * 4) - w / 2, z0 + Math.round(dz * (k + 1)) - w / 2], [w, w, w], k === len + 1 ? R('#c86a30', '#8a4020') : worm)); }
    worms.push({ name: 'tent_' + i, parent: 'body', pivot: [x0, y0, z0], cubes });
  }
  out.phrog_parasite = { ...p8, bones: [
    { name: 'body', pivot: [0, 13, 0], cubes: [] },
    ...octo('sac', 'body', [0, 12, 0], 16, 20, 20, 6, sac, 'y'),                        // wide and low
    rotBox('sac_belly', 'sac', [0, 6, 0], [16, 4, 16], [0, 45, 0], sac),
    rotBox('sac_top', 'sac', [0, 20.5, 0], [11, 3, 11], [0, 45, 0], sac),
    rotBox('bulge1', 'sac', [-6, 10, -6], [8, 8, 8], [15, 30, 10], sac), rotBox('bulge2', 'sac', [7, 9, 4], [7, 7, 7], [-10, 20, -15], sac),
    ...worms,
    ...pick(p8, b => b.name === 'leg_l' || b.name === 'leg_r'),
  ] };
}

// ----------------------------------------------------------------------------------------------- Entomancer (B-R1C1)
// Render: the hood and cloak are an insect's shell more than cloth - a tall boxy carapace hood with spotted plates
// overlapping like elytra, the left sleeve a great three-clawed spotted pincer; thin bent legs in a lunge; the staff
// held low ends in a gold sun-ring. Built on v7 with the hood and claw made carapace-like.
{
  const leopard = withPattern(R('#fff07a', '#f2d84a', '#dcbc2e', '#b89a22', '#8e7418'), (f, x, y) => { const v = h2(x >> 1, y >> 1, 11); return v < 14 ? (v < 6 ? '#1c1a10' : '#3a2e14') : 0; });
  const e7 = v7.entomancer;
  const head = named(e7, 'head'), hy = head.pivot[1];
  out.entomancer = { ...e7, bones: [
    ...e7.bones,
    // the carapace hood: two plates leaning in over the face, a tall crest, mandible flaps either side of the face
    rotBox('hood_l', 'head', [-3, hy + 6, 0], [2, 12, 8], [0, 0, -10], leopard), rotBox('hood_r', 'head', [3, hy + 6, 0], [2, 12, 8], [0, 0, 10], leopard),
    rotBox('hood_crest', 'head', [0, hy + 12.5, 0.5], [4, 4, 7], [-15, 0, 0], leopard),
    rotBox('mandible_l', 'head', [-2.5, hy + 1, -3.5], [1, 4, 2], [20, 0, 15], leopard), rotBox('mandible_r', 'head', [2.5, hy + 1, -3.5], [1, 4, 2], [20, 0, -15], leopard),
    // elytra-like back plates over the cloak
    rotBox('elytron_l', 'body', [-3, 22, 4], [5, 12, 2], [12, 0, -8], leopard), rotBox('elytron_r', 'body', [3, 22, 4], [5, 12, 2], [12, 0, 8], leopard),
  ] };
}
// ----------------------------------------------------------------------------------------------- P1 touches
// Mawler (A-R1C1 / E-R3C3): the head carried low and pushed forward, the jaw hanging open - the mouth first.
{
  const m8 = v8.mawler;
  out.mawler = { ...m8, bones: m8.bones.map(b => b.name === 'body' ? { ...b, rot: [-20, 0, 0] } : b.name === 'head' ? { ...b, rot: [38, 0, 0] } : b.name === 'jaw' ? { ...b, rot: [26, 0, 0] } : b) };
}
// Fogmog (A-R3C1): the cap's rim droops - tilted plates all round instead of a flat eave.
{
  const f7 = v7.fogmog, cap = withPattern(R('#ff9878', '#f06a4c', '#d04a34', '#a83426', '#80261c'), (f, x, y) => (f === 'up' && h2(x >> 1, y >> 1, 7) < 16 ? '#b8f070' : f === 'down' ? '#f4dcb8' : 0));
  out.fogmog = { ...f7, bones: [...f7.bones, ...[0, 1, 2, 3, 4, 5, 6, 7].map(k => { const a = k * 45 * Math.PI / 180, cx = Math.round(Math.cos(a) * 10), cz = Math.round(Math.sin(a) * 10);
    return rotBox('rim' + k, 'head', [cx, 16, cz], [9, 2, 4], [Math.round(Math.sin(a) * 35), Math.round(-k * 45 + 90), Math.round(-Math.cos(a) * 35)], cap); })] };
}
// Sewer Clam (A-R3C4): a deep dark gap between the valves, so the open shell reads first.
{
  const c7 = v7.sewer_clam;
  out.sewer_clam = { ...c7, bones: [...c7.bones, rotBox('gape', 'body', [0, 6, -7.4], [16, 3, 0], [0, 0, 0], R('#2a1424', '#180a14')), rotBox('gape_in', 'body', [0, 6, 0], [14, 2, 12], [0, 0, 0], R('#3a1a30', '#240e1c'))] };
}
module.exports = out;
