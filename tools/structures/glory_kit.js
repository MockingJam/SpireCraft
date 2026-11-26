// Building kit for the Glory v2 structures (2026-11-26): boxes, rooms, round and square towers, crenellated curtain
// walls along a polygon, stepped and plain gables, cone roofs, domes, stairs and ladders, and a perimeter wall that
// follows a footprint's own shape (user: "the wall round the factory should hug its outline, not be a rectangle").
// Convention as in build.js: y = 0 is the ground layer.
const PERSIST = { t: 1, v: 1 };

const box = (s, x0, y0, z0, x1, y1, z1, st) => {
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
    for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) s.set(x, y, z, typeof st === 'function' ? st(x, y, z) : st);
};
/** Hollow box walls (no floor / ceiling) from y0 to y1. */
const walls = (s, x0, z0, x1, z1, y0, y1, st) => {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) { s.set(x, y, z0, typeof st === 'function' ? st(x, y, z0) : st); s.set(x, y, z1, typeof st === 'function' ? st(x, y, z1) : st); }
    for (let z = z0; z <= z1; z++) { s.set(x0, y, z, typeof st === 'function' ? st(x0, y, z) : st); s.set(x1, y, z, typeof st === 'function' ? st(x1, y, z) : st); }
  }
};
/** A room: floor at y0, walls y0+1..y1, air inside, ceiling at y1+1 (if ceil given). */
function room(s, x0, z0, x1, z1, y0, y1, { wall, floor, ceil }) {
  box(s, x0, y0, z0, x1, y0, z1, floor || wall);
  box(s, x0 + 1, y0 + 1, z0 + 1, x1 - 1, y1, z1 - 1, 'air');
  walls(s, x0, z0, x1, z1, y0 + 1, y1, wall);
  if (ceil) box(s, x0, y1 + 1, z0, x1, y1 + 1, z1, ceil);
}
const mob = (s, x, y, z, name, extra = {}) => s.entity(x, y, z, Object.assign({ id: name.includes(':') ? name : 'spirecraft:' + name, PersistenceRequired: PERSIST }, extra));
const isAir = st => !st || st === 'air' || st === 'cave_air';

/** Merlons along the outline of a rectangle at height y (every other block). */
function crenelRect(s, x0, z0, x1, z1, y, st) {
  for (let x = x0; x <= x1; x++) for (const z of [z0, z1]) if ((x + z) % 2 === 0) s.set(x, y, z, st);
  for (let z = z0; z <= z1; z++) for (const x of [x0, x1]) if ((x + z) % 2 === 0) s.set(x, y, z, st);
}
/** Upside-down stairs under a parapet's overhang (machicolation corbels) along the rectangle's outside at y. */
function corbelsRect(s, x0, z0, x1, z1, y, stairBlock) {
  for (let x = x0; x <= x1; x++) { s.set(x, y, z0 - 1, `${stairBlock}[facing=south,half=top,shape=straight]`); s.set(x, y, z1 + 1, `${stairBlock}[facing=north,half=top,shape=straight]`); }
  for (let z = z0; z <= z1; z++) { s.set(x0 - 1, y, z, `${stairBlock}[facing=east,half=top,shape=straight]`); s.set(x1 + 1, y, z, `${stairBlock}[facing=west,half=top,shape=straight]`); }
}

/**
 * A round tower centred on (cx, cz) (half-blocks allowed: cx = 10.5 makes an even width), radius rad, from floor y0 to
 * wall top y1. o: { mat(x,y,z), floor, floors: [y...], inner (fill below y0), slits (every n blocks of height),
 * top: 'crenel' | 'cone' | 'flat', roof (cone block), roofTip, door: [dx, dz] direction, ladder: true }.
 */
function roundTower(s, cx, cz, rad, y0, y1, o = {}) {
  const mat = o.mat || (() => 'deepslate_bricks');
  const R = Math.ceil(rad + 2);
  const ladder = o.ladder ? [Math.round(cx + (rad - 1.6) * (o.ladderAt ? o.ladderAt[0] : 1)), Math.round(cz + (rad - 1.6) * (o.ladderAt ? o.ladderAt[1] : 0))] : null;
  for (let x = Math.floor(cx - R); x <= Math.ceil(cx + R); x++) for (let z = Math.floor(cz - R); z <= Math.ceil(cz + R); z++) {
    const d = Math.hypot(x + 0.5 - (cx + 0.5), z + 0.5 - (cz + 0.5));
    if (d > rad + 0.35) continue;
    const shell = d > rad - 0.95;
    s.set(x, y0, z, shell ? mat(x, y0, z) : (o.floor || 'dark_oak_planks'));
    for (let y = y0 + 1; y <= y1; y++) {
      if (shell) {
        const a = Math.atan2(z - cz, x - cx);
        const slit = o.slits && (y - y0) % o.slits === 2 && Math.abs(Math.sin(a * 2)) > 0.92 && y < y1 - 1;
        s.set(x, y, z, slit ? (o.slitBlock || 'air') : mat(x, y, z));
      } else if (o.floors && o.floors.includes(y) && !(ladder && x === ladder[0] && z === ladder[1])) s.set(x, y, z, o.floor || 'dark_oak_planks');
      else s.set(x, y, z, 'air');
    }
    if (o.top === 'crenel' || o.top === 'flat' || !o.top) {
      if (!shell) s.set(x, y1, z, ladder && x === ladder[0] && z === ladder[1] ? 'air' : (o.topFloor || o.floor || 'dark_oak_planks'));
      if (o.top === 'crenel' && shell && (x + z) % 2 === 0) s.set(x, y1 + 1, z, mat(x, y1 + 1, z));
    }
  }
  if (ladder) for (let y = y0 + 1; y <= y1; y++) {
    const f = Math.abs(ladder[0] - cx) > Math.abs(ladder[1] - cz) ? (ladder[0] > cx ? 'west' : 'east') : (ladder[1] > cz ? 'north' : 'south');
    s.set(ladder[0], y, ladder[1], `ladder[facing=${f},waterlogged=false]`);
  }
  if (o.top === 'cone') coneRoof(s, cx, cz, rad + 1, y1 + 1, o.roof || 'deepslate_tiles', o.roofTip);
  if (o.door) {
    const [dx, dz] = o.door;
    for (let y = y0 + 1; y <= y0 + (o.doorH || 2); y++) for (let k = 0; k <= Math.ceil(rad) + 1; k++) {
      const x = Math.round(cx + dx * k), z = Math.round(cz + dz * k);
      if (Math.hypot(x - cx, z - cz) > rad - 1.5) s.set(x, y, z, 'air');
    }
  }
}

/** A cone roof: rings shrinking by `step` per layer, a tip on top (a lightning rod / a fence + banner...). */
function coneRoof(s, cx, cz, rad, y, st, tip, step = 0.75) {
  let r = rad, k = 0;
  while (r > 0.4) {
    for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) for (let z = Math.floor(cz - r - 1); z <= Math.ceil(cz + r + 1); z++) {
      const d = Math.hypot(x - cx, z - cz);
      if (d <= r + 0.3 && d > r - 1.3) s.set(x, y + k, z, st);
      else if (d <= r - 1.3 && k === 0) s.set(x, y + k, z, 'air');
    }
    r -= step; k++;
  }
  s.set(Math.round(cx), y + k, Math.round(cz), st);
  if (tip) s.set(Math.round(cx), y + k + 1, Math.round(cz), tip);
}

/** A dome (hemisphere shell) of radius rad on (cx, y, cz): shell(x,y,z,angleUp) gives the block (glass, ribs...). */
function dome(s, cx, y, cz, rad, shell) {
  for (let x = Math.floor(cx - rad - 1); x <= Math.ceil(cx + rad + 1); x++) for (let z = Math.floor(cz - rad - 1); z <= Math.ceil(cz + rad + 1); z++)
    for (let k = 0; k <= rad + 1; k++) {
      const d = Math.hypot(x - cx, z - cz, k);
      if (d <= rad + 0.5 && d > rad - 0.6) s.set(x, y + k, z, shell(x, y + k, z, Math.atan2(k, Math.hypot(x - cx, z - cz)), Math.atan2(z - cz, x - cx)));
      else if (d <= rad - 0.6) s.set(x, y + k, z, 'air');
    }
}

/**
 * A gable roof over x0..x1 × z0..z1 starting at y, ridge along `axis` ('x' or 'z'), stairs of `stair` (block id
 * without state) with full `block` under them; gable ends filled with `gable` (stepped: crow-stepped gables poking
 * above the roof like the Gravensteen's halls).
 */
function gable(s, x0, z0, x1, z1, y, { axis = 'x', stair = 'deepslate_tile_stairs', block = 'deepslate_tiles', gable: gm = 'deepslate_bricks', stepped = false, overhang = 1 } = {}) {
  const along = axis === 'x';
  const a0 = along ? z0 : x0, a1 = along ? z1 : x1;             // across the ridge
  const b0 = (along ? x0 : z0) - overhang, b1 = (along ? x1 : z1) + overhang;
  const half = Math.ceil((a1 - a0 + 1 + 2) / 2);
  const P = (b, a, yy, st) => (along ? s.set(b, yy, a, st) : s.set(a, yy, b, st));
  const dirA = along ? ['south', 'north'] : ['east', 'west'];
  for (let k = 0; k < half; k++) {
    const yy = y + k, lo = a0 - 1 + k, hi = a1 + 1 - k;
    for (let b = b0; b <= b1; b++) {
      if (lo < hi) { P(b, lo, yy, `${stair}[facing=${dirA[0]},half=bottom,shape=straight]`); P(b, hi, yy, `${stair}[facing=${dirA[1]},half=bottom,shape=straight]`); }
      else P(b, lo, yy, block);
      if (lo + 1 <= hi - 1) for (let a = lo + 1; a <= hi - 1; a++) P(b, a, yy, k === half - 1 ? block : (b === b0 || b === b1 ? block : 'air'));
    }
    // the gable ends: filled walls (stepped ones rise a block above the roof line in steps)
    for (const b of [b0 + overhang, b1 - overhang]) for (let a = lo; a <= hi; a++) P(b, a, yy, gm);
    if (stepped && k % 2 === 0) for (const b of [b0 + overhang, b1 - overhang]) { P(b, lo, yy + 1, gm); P(b, hi, yy + 1, gm); }
  }
  // the ridge
  const top = y + half;
  for (let b = b0; b <= b1; b++) for (let a = a0 + half - 1; a <= a1 - half + 1; a++) P(b, a, top - 1, block);
  if (stepped) for (const b of [b0 + overhang, b1 - overhang]) { const am = Math.round((a0 + a1) / 2); P(b, am, top, gm); P(b, am, top + 1, gm); }
}

/** A straight run of stairs climbing `n` steps towards `dir` from (x, y, z) (the first step at y), with fill below. */
function stairRun(s, x, y, z, dir, n, stair, fill, width = 1) {
  const D = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] }[dir];
  const side = [D[1] !== 0 ? 1 : 0, D[0] !== 0 ? 1 : 0];
  for (let k = 0; k < n; k++) for (let w = 0; w < width; w++) {
    const xx = x + D[0] * k + side[0] * w, zz = z + D[1] * k + side[1] * w;
    s.set(xx, y + k, zz, `${stair}[facing=${dir},half=bottom,shape=straight]`);
    if (fill) for (let yy = y; yy < y + k; yy++) s.set(xx, yy, zz, fill);
    for (let yy = y + k + 1; yy <= y + k + 3; yy++) if (!fill || yy > y + k) s.set(xx, yy, zz, 'air');
  }
}

/** A doorway w wide, h high in a wall along x (axis 'x') or z, at floor y; an arch (top stairs) over it if arch given. */
function doorway(s, x, y, z, w, h, axis, arch) {
  for (let i = 0; i < w; i++) for (let yy = y + 1; yy <= y + h; yy++) s.set(axis === 'x' ? x + i : x, yy, axis === 'x' ? z : z + i, 'air');
  if (arch && w >= 2) {
    const a = axis === 'x' ? ['east', 'west'] : ['south', 'north'];
    s.set(axis === 'x' ? x : x, y + h, axis === 'x' ? z : z, `${arch}[facing=${a[0]},half=top,shape=straight]`);
    s.set(axis === 'x' ? x + w - 1 : x, y + h, axis === 'x' ? z : z + w - 1, `${arch}[facing=${a[1]},half=top,shape=straight]`);
  }
}

/** Distance (Euclid) from every cell of a W×D grid to the nearest cell where mask(x, z) holds. */
function distanceField(W, D, mask) {
  const pts = [];
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (mask(x, z)) pts.push([x, z]);
  const dist = Array.from({ length: W }, () => new Float32Array(D).fill(1e9));
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    let best = 1e9;
    for (const [px, pz] of pts) { const dd = (px - x) * (px - x) + (pz - z) * (pz - z); if (dd < best) best = dd; }
    dist[x][z] = Math.sqrt(best);
  }
  return dist;
}

/**
 * A perimeter wall that follows a footprint (user, 2026-11-26): every cell between dist and dist + thick from the
 * footprint's own outline gets a wall h high (with a coping / posts), except where gate(x, z) is true. Returns the
 * list of wall cells. style: { mat(x,y,z), cap, post, postEvery, lamp }.
 */
function perimeter(s, W, D, mask, dist, h, style, gate = () => false, thick = 1) {
  const f = distanceField(W, D, mask), cells = [];
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    const d = f[x][z];
    if (d < dist || d >= dist + thick) continue;
    if (gate(x, z)) continue;
    cells.push([x, z]);
    for (let y = 1; y <= h; y++) s.set(x, y, z, style.mat(x, y, z));
    if (style.cap) s.set(x, h + 1, z, style.cap(x, z));
  }
  return cells;
}

/**
 * A curtain wall along a closed polygon (points [[x, z]...]): solid, `thick` blocks, from y 1 to h; the top is a
 * walkway; merlons on the outer edge, a low inner rail. Returns { inside(x, z) } for the polygon.
 */
function curtain(s, pts, h, { mat, thick = 3, merlon, rail, W, D }) {
  const segDist = (px, pz, ax, az, bx, bz) => { const vx = bx - ax, vz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / (vx * vx + vz * vz))); return Math.hypot(px - ax - vx * t, pz - az - vz * t); };
  const inside = (x, z) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, zi] = pts[i], [xj, zj] = pts[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    let d = 1e9;
    for (let i = 0; i < pts.length; i++) { const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % pts.length]; d = Math.min(d, segDist(x, z, ax, az, bx, bz)); }
    const inn = inside(x, z);
    const half = thick / 2;
    if (d > half + 0.01) continue;
    for (let y = 1; y <= h; y++) s.set(x, y, z, mat(x, y, z));
    const outer = !inn && d > half - 1.01;
    const innerEdge = inn && d > half - 1.01;
    if (outer && merlon && (x + z) % 2 === 0) s.set(x, h + 1, z, merlon(x, z));
    else if (outer && merlon) s.set(x, h + 1, z, 'air');
    if (innerEdge && rail) s.set(x, h + 1, z, rail);
  }
  return { inside };
}

/** Lantern / torch helpers. */
const hangLantern = (s, x, y, z, soul) => s.set(x, y, z, `${soul ? 'soul_' : ''}lantern[hanging=true,waterlogged=false]`);
const wallTorch = (s, x, y, z, facing, soul) => s.set(x, y, z, `${soul ? 'soul_' : ''}wall_torch[facing=${facing}]`);
const banner = (s, x, y, z, color, facing) => s.set(x, y, z, `${color}_wall_banner[facing=${facing}]`);

module.exports = { PERSIST, box, walls, room, mob, isAir, crenelRect, corbelsRect, roundTower, coneRoof, dome, gable, stairRun, doorway, distanceField, perimeter, curtain, hangLantern, wallTorch, banner };
