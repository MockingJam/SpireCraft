// Modelling kit for the big, detailed mob models (v7, user 2026-11-18: "the bigger the monster, the less it can get
// away with a few boxes - chest, neck, shoulders, belly, back, waist, hips; thigh and shin thickness; eye, tooth, ear
// and mouth size; fur and feather shapes"). Helpers that turn an anatomical description into cubes for specs.js.
// Coordinates as in specs.js: pixels, y up, ground 0, front -Z.
const R = (...ramp) => ({ ramp });
const withPattern = (m, pattern) => ({ ...m, pattern });
const glowing = m => ({ ...m, emissive: true });
const h2 = (x, y, s) => (((x * 73856093) ^ (y * 19349663) ^ (s * 83492791)) >>> 0) % 97;
const hash = (x, s) => ((x * 37 + s * 11) % 7 + 7) % 7;
const B = (from, size, mat, extra = {}) => ({ from, size, mat, ...extra });

/**
 * A body built from cross-section slices along one axis (a "loft"), the way a vanilla model rounds a body with a few
 * stepped boxes - but each slice hides the part of its end faces that the next slice covers, so translucent bodies
 * show no inner walls. slices: [{at: [a0, a1], w: [x0, x1], h: [y0, y1]}] in order along the axis ('z' or 'y').
 */
function loft(slices, mat, axis = 'z', extra = {}) {
  return slices.map((s, i) => {
    const prev = slices[i - 1], next = slices[i + 1];
    const [x0, x1] = s.w, [y0, y1] = s.h, [a0, a1] = s.at;
    if (axis === 'z') {
      const covered = (o, px, py, w, h) => { if (!o) return false; const x = x0 + px + 0.5, y = y1 - py - 0.5; return x > o.w[0] && x < o.w[1] && y > o.h[0] && y < o.h[1]; };
      return B([x0, y0, a0], [x1 - x0, y1 - y0, a1 - a0], s.mat || mat, { ...extra, ...(s.extra || {}),
        mask: (f, px, py, w, h) => !((f === 'north' && covered(prev, px, py, w, h)) || (f === 'south' && covered(next, px, py, w, h))) && (!s.mask || s.mask(f, px, py, w, h)) });
    }
    // along y: slices stacked bottom to top; w = x range, h = z range
    const [z0, z1] = s.h;
    const covered = (o, px, py) => { if (!o) return false; const x = x0 + px + 0.5, z = z0 + py + 0.5; return x > o.w[0] && x < o.w[1] && z > o.h[0] && z < o.h[1]; };
    return B([x0, a0, z0], [x1 - x0, a1 - a0, z1 - z0], s.mat || mat, { ...extra, ...(s.extra || {}),
      mask: (f, px, py) => !((f === 'down' && covered(prev, px, py)) || (f === 'up' && covered(next, px, py))) });
  });
}

/** A symmetric slice helper: centred width w, from y0 to y1, over [a0, a1). */
const sl = (a0, a1, w, y0, y1, mat) => ({ at: [a0, a1], w: [-w / 2, w / 2], h: [y0, y1], mat });

/** A fan fin / sail drawn on a plane: width along the plane's length, rays radiating from the root edge. */
function fin(from, size, mat, shape, rays = 3) {
  return B(from, size, withPattern(mat, (f, x, y, w, h) => ((x % rays) === 0 ? 1.1 : 0) + (y === 0 || y === h - 1 ? -0.6 : 0)), { mask: shape });
}

/** An eye on a side face: iris colour, a pupil, a gold rim crescent and a highlight. Returns a detail function. */
function eyeDetail(iris, pupil, rim, opts = {}) {
  return (x, y, w, h) => {
    const cx = (w - 1) / 2, cy = (h - 1) / 2, d = Math.hypot(x - cx, y - cy), r = Math.min(w, h) / 2;
    if (d > r) return null;
    if (opts.glint !== false && x === Math.floor(cx - r * 0.4) && y === Math.floor(cy - r * 0.4)) return '#ffffff';
    if (d < r * 0.35) return pupil;
    if (d > r * 0.75) return rim;
    if (opts.crescent && y > cy && d > r * 0.45) return opts.crescent;
    return iris;
  };
}

/** A row of teeth along a plane's top or bottom edge (planes with transparent gaps). */
const teethMask = (period = 2, down = true) => (f, x, y, w, h) => (x % period === 0) ? true : down ? y < h - 1 : y > 0;

/** A two-part limb (upper and lower) as two bones: thick at the top, thinner below, a joint pad, optional foot. */
function limb(name, parent, hip, o) {
  const { upper, lower, mat, lowerMat, rot = [0, 0, 0], knee = [0, 0, 0], foot } = o;
  const [ux, uy, uz] = upper, [lx, ly, lz] = lower;
  const kneeY = hip[1] - uy;
  const bones = [
    { name, parent, pivot: hip, rot, cubes: [B([hip[0] - ux / 2, kneeY, hip[2] - uz / 2], [ux, uy, uz], mat)] },
    { name: name + '_low', parent: name, pivot: [hip[0], kneeY + 0.5, hip[2]], rot: knee, cubes: [
      B([hip[0] - lx / 2, kneeY - ly, hip[2] - lz / 2], [lx, ly, lz], lowerMat || mat),
      ...(foot ? [B([hip[0] - foot[0] / 2, kneeY - ly - foot[1] + (foot[3] || 0), hip[2] - foot[2] + lz / 2], [foot[0], foot[1], foot[2]], o.footMat || lowerMat || mat)] : []),
    ] },
  ];
  return bones;
}

/** Hair / fur / feather fringe: a plane with a ragged lower edge and strand shading. */
const fringe = (from, size, mat, depth = 3, seed = 1) => B(from, size, withPattern(mat, (f, x, y) => (x % 2 ? 0.4 : -0.3) + (hash(x, seed + 4) === 0 ? 0.9 : 0)),
  { mask: (f, x, y, w, h) => y < h - (hash(x, seed) % (depth + 1)) });

/**
 * A figure with its own proportions (not the vanilla player): legs of thigh + shin (+ foot), a pelvis, a waist and a
 * chest each sized on their own, shoulders, two-part arms with hands, a neck and a head. Every measure is in pixels.
 *   o = { thigh: [w, h, d], shin: [w, h, d], foot: [w, h, d], hipW, pelvis: [w, h, d], waist: [w, h, d], chest: [w, h, d],
 *         upperArm: [w, h, d], foreArm: [w, h, d], hand: [w, h, d], neck: [w, h, d], head: [w, h, d],
 *         mats: { skin, legs, shins, feet, pelvis, waist, chest, arms, fore, hands, head }, lean (deg), armOut (deg),
 *         parts: { bone: [cubes] }, extra: [bones], face: detail fn for the head's north face }
 * Bones: body (pelvis, waist, chest), head, arm_l / arm_r (+ _low), leg_l / leg_r (+ _low) - what the animations use.
 */
function figure(o) {
  const M = o.mats, P = o.parts || {};
  const [tw, th, td] = o.thigh, [sw, sh, sd] = o.shin, foot = o.foot || [sw + 1, 2, sd + 3];
  const hipY = sh + th, hx = o.hipW / 2;
  const [pw, ph, pd] = o.pelvis, [ww, wh, wd] = o.waist, [cw, ch, cd] = o.chest;
  const waistY = hipY + ph - 1, chestY = waistY + wh, topY = chestY + ch;
  const [uw, uh, ud] = o.upperArm, [fw, fh, fd] = o.foreArm, [hw, hh, hd] = o.hand;
  const sx = cw / 2 + uw / 2 - (o.armIn || 0), shY = topY - 1;
  const [nw, nh, nd] = o.neck || [2, 2, 2], [hdw, hdh, hdd] = o.head;
  const legs = [-1, 1].flatMap(s => limb(s < 0 ? 'leg_l' : 'leg_r', 'body', [s * hx, hipY, 0], {
    upper: o.thigh, lower: o.shin, mat: M.legs, lowerMat: M.shins || M.legs, rot: [0, 0, s * (o.legSplay || 0)], knee: [o.knee || 0, 0, -s * (o.legSplay || 0)],
    foot: [foot[0], foot[1], foot[2], 0], footMat: M.feet || M.shins || M.legs,
  }).map((b, i) => ({ ...b, cubes: [...b.cubes, ...((P[(s < 0 ? 'leg_l' : 'leg_r') + (i ? '_low' : '')]) || [])] })));
  const arms = [-1, 1].flatMap(s => {
    const n = s < 0 ? 'arm_l' : 'arm_r', x = s * sx, elbowY = shY - uh;
    return [
      { name: n, parent: 'body', pivot: [x, shY, 0], rot: [o.armFwd || 0, 0, s * (o.armOut || 0)], cubes: [B([x - uw / 2, elbowY, -ud / 2], [uw, uh, ud], M.arms), ...(P[n] || [])] },
      { name: n + '_low', parent: n, pivot: [x, elbowY + 0.5, 0], rot: [o.elbow || 0, 0, 0], cubes: [
        B([x - fw / 2, elbowY - fh, -fd / 2], [fw, fh, fd], M.fore || M.arms),
        B([x - hw / 2, elbowY - fh - hh, -hd / 2], [hw, hh, hd], M.hands || M.skin), ...(P[n + '_low'] || [])] },
    ];
  });
  return {
    render: o.render || 'cutout', glow: o.glow,
    bones: [
      { name: 'body', pivot: [0, hipY, 0], rot: [o.lean || 0, 0, 0], cubes: [
        B([-pw / 2, hipY - 1, -pd / 2], [pw, ph, pd], M.pelvis || M.waist),
        B([-ww / 2, waistY, -wd / 2], [ww, wh, wd], M.waist),
        B([-cw / 2, chestY, -cd / 2 + (o.chestFwd || 0)], [cw, ch, cd], M.chest),
        ...(P.body || [])] },
      { name: 'head', parent: 'body', pivot: [0, topY, o.headFwd || 0], rot: [o.headTilt || 0, 0, 0], cubes: [
        B([-nw / 2, topY - 1, -nd / 2 + (o.headFwd || 0)], [nw, nh + 1, nd], M.skin),
        B([-hdw / 2, topY + nh - 1, -hdd / 2 + (o.headFwd || 0)], [hdw, hdh, hdd], M.head || M.skin, o.face ? { detail: { north: o.face } } : {}),
        ...(P.head || [])] },
      ...arms, ...legs, ...(o.extra || []),
    ],
  };
}

/**
 * Angled pieces (user 2026-11-18: not everything stepped like stairs - use tilted cubes, even within one body part,
 * especially on bosses, elites and big monsters). rotBox: one cube centred on its own pivot, turned by rot (degrees).
 */
function rotBox(name, parent, center, size, rot, mat, extra = {}) {
  return { name, parent, pivot: center, rot, cubes: [B([center[0] - size[0] / 2, center[1] - size[1] / 2, center[2] - size[2] / 2], size, mat, extra)] };
}

/**
 * A bevelled (octagonal) prism: a cross of two boxes plus four corner edges turned 45 degrees, so the long edges are
 * cut at an angle instead of stepped. axis 'z' (lying, length along z) or 'y' (standing). c = centre.
 * Returns bones: name (the core) and name_e0..3 (the bevels, children of the core).
 */
function octo(name, parent, c, len, w, h, bevel, mat, axis = 'z', rot = [0, 0, 0]) {
  // in the prism's own frame: L = length axis, U = width, V = height; map (L, U, V) -> world (x, y, z)
  const [cx, cy, cz] = c, b = bevel, d = Math.max(1, Math.round(b * 1.4142));
  const map = axis === 'z' ? (L, U, V) => [U, V, L] : axis === 'y' ? (L, U, V) => [U, L, V] : (L, U, V) => [L, V, U];
  const box = (l0, lsz, u0, usz, v0, vsz) => { const f = map(l0, u0, v0), z = map(lsz, usz, vsz); return B([f[0] + cx, f[1] + cy, f[2] + cz], z, mat); };
  // the core: a middle slab of full height and two side slabs cut short by the bevel (no overlaps)
  const cubes = [box(-len / 2, len, -w / 2 + b, w - 2 * b, -h / 2, h), box(-len / 2, len, -w / 2, b, -h / 2 + b, h - 2 * b), box(-len / 2, len, w / 2 - b, b, -h / 2 + b, h - 2 * b)];
  const core = { name, parent, pivot: c, rot, cubes };
  const turn = axis === 'z' ? [0, 0, 45] : axis === 'y' ? [0, 45, 0] : [45, 0, 0];
  const edges = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([su, sv], i) => {
    const o = map(0, su * (w / 2 - b), sv * (h / 2 - b)), sz = map(len, d, d);
    return rotBox(name + '_e' + i, name, [cx + o[0], cy + o[1], cz + o[2]], sz, turn, mat);
  });
  return [core, ...edges];
}

/**
 * A box with all twelve edges cut at 45 degrees (v9, 2026-11-19): for round things - fruit, eggs, shells, sacs, heads -
 * where octo's flat ends still read as a box. The core is a 3-D cross of three boxes (each cut short by the bevel on
 * the other two axes, so no two overlap); each edge is one bar turned 45 degrees about its own length.
 * size = [w, h, d] (x, y, z), b = bevel. Returns bones: name (the core) and name_x0..3, name_y0..3, name_z0..3.
 */
function bevelBox(name, parent, c, size, b, mat, rot = [0, 0, 0]) {
  const [cx, cy, cz] = c, [w, h, d] = size, s = Math.max(1, Math.round(b * 1.4142));
  const core = { name, parent, pivot: c, rot, cubes: [
    B([cx - w / 2, cy - h / 2 + b, cz - d / 2 + b], [w, h - 2 * b, d - 2 * b], mat),
    B([cx - w / 2 + b, cy - h / 2, cz - d / 2 + b], [w - 2 * b, b, d - 2 * b], mat), B([cx - w / 2 + b, cy + h / 2 - b, cz - d / 2 + b], [w - 2 * b, b, d - 2 * b], mat),
    B([cx - w / 2 + b, cy - h / 2 + b, cz - d / 2], [w - 2 * b, h - 2 * b, b], mat), B([cx - w / 2 + b, cy - h / 2 + b, cz + d / 2 - b], [w - 2 * b, h - 2 * b, b], mat),
  ] };
  const edges = [];
  const q = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  q.forEach(([p, r], i) => edges.push(
    rotBox(name + '_x' + i, name, [cx, cy + p * (h / 2 - b), cz + r * (d / 2 - b)], [w - 2 * b, s, s], [45, 0, 0], mat),
    rotBox(name + '_y' + i, name, [cx + p * (w / 2 - b), cy, cz + r * (d / 2 - b)], [s, h - 2 * b, s], [0, 45, 0], mat),
    rotBox(name + '_z' + i, name, [cx + p * (w / 2 - b), cy + r * (h / 2 - b), cz], [s, s, d - 2 * b], [0, 0, 45], mat)));
  return [core, ...edges];
}

module.exports = { R, withPattern, glowing, h2, hash, B, loft, sl, fin, eyeDetail, teethMask, limb, fringe, figure, rotBox, octo, bevelBox };
