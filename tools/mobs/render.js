// Offline preview renderer for the mob models (no Blockbench needed): rebuilds every bone/cube from
// tools/mobs/specs.js exactly like the generated Java (MobLayers) — box UVs, bone pivots and rotations, inflate —
// rasterises the textured boxes with a depth buffer and vanilla face shading (top 1.0, N/S 0.8, E/W 0.6, bottom 0.5).
// Usage: node tools/mobs/render.js <out.png> [name filter] [--views front,side,back]
const REPO_ROOT = require('path').resolve(__dirname, '..', '..').split(require('path').sep).join('/') + '/';   // this checkout (was hard-coded to D:/MCmodev/SpireCraft)
const fs = require('fs');
const { readPng, writePng } = require('../png');
const specs = require('./specs');
const TEX = REPO_ROOT + 'src/main/resources/assets/spirecraft/textures/entity/';
const [out, filter] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const viewsArg = (process.argv.find(a => a.startsWith('--views=')) || '--views=front,side').slice(8).split(',');
const VIEWS = { front: [-35, 22], side: [-90, 12], back: [145, 25], top: [-30, 60], down: [0, 85], face: [0, 5] };
const CELL = 260, BG = [139, 139, 139];

// ---- tiny matrix helpers (4x4 column-major-free: arrays of 16, row-major)
const mul = (a, b) => { const r = new Array(16).fill(0); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) r[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j]; return r; };
const tr = (x, y, z) => [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1];
const rx = a => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1]; };
const ry = a => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1]; };
const rz = a => { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; };
const app = (m, [x, y, z]) => [m[0] * x + m[1] * y + m[2] * z + m[3], m[4] * x + m[5] * y + m[6] * z + m[7], m[8] * x + m[9] * y + m[10] * z + m[11]];

/** World (model-space, y down) quads of a spec: [{pts:[4 xyz], uv:[4 uv], normal}] — mirrors MobLayers/ModelPart. */
function quads(spec, texW, texH) {
  const byName = Object.fromEntries(spec.bones.map(b => [b.name, b]));
  const mat = {};
  const boneMat = b => {
    if (mat[b.name]) return mat[b.name];
    const P = b.pivot, parent = b.parent ? byName[b.parent] : null;
    const off = parent ? [P[0] - parent.pivot[0], parent.pivot[1] - P[1], P[2] - parent.pivot[2]] : [P[0], 24 - P[1], P[2]];
    const r = (b.rot || [0, 0, 0]).map(d => d * Math.PI / 180);
    // ModelPart: translate(offset) then rotationZYX(z, y, x) → R = Rz·Ry·Rx
    let m = mul(tr(...off), mul(rz(r[2]), mul(ry(r[1]), rx(r[0]))));
    if (parent) m = mul(boneMat(parent), m);
    return (mat[b.name] = m);
  };
  const qs = [];
  for (const b of spec.bones) {
    const M = boneMat(b), P = b.pivot;
    for (const c of b.cubes) {
      const [w, h, d] = c.size, g = c.inflate || 0;
      const x0 = c.from[0] - P[0] - g, y0 = P[1] - (c.from[1] + h) - g, z0 = c.from[2] - P[2] - g;
      const x1 = x0 + w + 2 * g, y1 = y0 + h + 2 * g, z1 = z0 + d + 2 * g;
      const [u, v] = c.uv;
      // face: corners (TL, TR, BR, BL as seen on the texture) and the texture rect
      const F = [
        ['up', [[x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0]], [u + d, v, w, d]],
        ['down', [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [u + d + w, v, w, d]],
        ['north', [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], [u + d, v + d, w, h]],
        ['south', [[x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1]], [u + 2 * d + w, v + d, w, h]],
        ['east', [[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1]], [u, v + d, d, h]],
        ['west', [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], [u + d + w, v + d, d, h]],
      ];
      for (const [name, pts, [fu, fv, fw, fh]] of F) {
        if (fw <= 0 && fh <= 0) continue;
        const wp = pts.map(p => app(M, p));
        const uv = [[fu, fv], [fu + fw, fv], [fu + fw, fv + fh], [fu, fv + fh]];
        qs.push({ name, pts: wp, uv, plane: c.size.includes(0) });
      }
    }
  }
  return qs;
}

/** Same shelf packing as build_mobs.js (assigns each cube's box-UV origin). */
function pack(cubes) {
  const rects = cubes.map(c => { const [w, h, d] = c.size; return { c, w: 2 * (d + w), h: d + h }; });
  const order = rects.slice().sort((a, b) => b.h - a.h || b.w - a.w);
  for (const W of [64, 128, 256, 512]) {
    let x = 0, y = 0, rowH = 0, ok = true;
    for (const r of order) {
      if (r.w > W) { ok = false; break; }
      if (x + r.w > W) { x = 0; y += rowH; rowH = 0; }
      r.c.uv = [x, y]; x += r.w; rowH = Math.max(rowH, r.h);
    }
    const H = Math.pow(2, Math.ceil(Math.log2(Math.max(16, y + rowH))));
    if (ok && H <= W) return [W, H];
  }
  throw new Error('texture too big');
}

function render(name, spec, [yawDeg, pitchDeg]) {
  pack(spec.bones.flatMap(b => b.cubes));
  const tex = readPng(TEX + name + '.png');
  const qs = quads(spec, tex.w, tex.h);
  const yaw = yawDeg * Math.PI / 180, pitch = pitchDeg * Math.PI / 180;
  // model space y down → view space: rotate about Y (yaw), then X (pitch)
  const view = p => {
    let [x, y, z] = [p[0], -p[1], p[2]];                     // y up
    [x, z] = [x * Math.cos(yaw) - z * Math.sin(yaw), x * Math.sin(yaw) + z * Math.cos(yaw)];
    [y, z] = [y * Math.cos(pitch) - z * Math.sin(pitch), y * Math.sin(pitch) + z * Math.cos(pitch)];
    return [x, y, z];
  };
  const vq = qs.map(q => ({ ...q, v: q.pts.map(view) }));
  let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9;
  for (const q of vq) for (const [x, y] of q.v) { mnx = Math.min(mnx, x); mxx = Math.max(mxx, x); mny = Math.min(mny, y); mxy = Math.max(mxy, y); }
  const S = (CELL - 20) / Math.max(mxx - mnx, mxy - mny, 1);
  const cx = (mnx + mxx) / 2, cy = (mny + mxy) / 2;
  const img = { w: CELL, h: CELL, d: new Uint8Array(CELL * CELL * 4) };
  const depth = new Float32Array(CELL * CELL).fill(1e9);
  for (let i = 0; i < CELL * CELL; i++) img.d.set([...BG, 255], i * 4);
  const shade = { up: 1.0, down: 0.5, north: 0.8, south: 0.8, east: 0.6, west: 0.6 };
  // opaque first, translucent after (sorted far → near)
  const draw = (q, translucentPass) => {
    const P = q.v.map(([x, y, z]) => [(x - cx) * S + CELL / 2, -(y - cy) * S + CELL / 2, z]);
    for (const [a, b, c] of [[0, 1, 2], [0, 2, 3]]) {
      const A = P[a], B = P[b], C = P[c], ua = q.uv[a], ub = q.uv[b], uc = q.uv[c];
      const minx = Math.max(0, Math.floor(Math.min(A[0], B[0], C[0]))), maxx = Math.min(CELL - 1, Math.ceil(Math.max(A[0], B[0], C[0])));
      const miny = Math.max(0, Math.floor(Math.min(A[1], B[1], C[1]))), maxy = Math.min(CELL - 1, Math.ceil(Math.max(A[1], B[1], C[1])));
      const den = (B[1] - C[1]) * (A[0] - C[0]) + (C[0] - B[0]) * (A[1] - C[1]);
      if (Math.abs(den) < 1e-9) continue;
      for (let y = miny; y <= maxy; y++) for (let x = minx; x <= maxx; x++) {
        const px = x + 0.5, py = y + 0.5;
        const l1 = ((B[1] - C[1]) * (px - C[0]) + (C[0] - B[0]) * (py - C[1])) / den;
        const l2 = ((C[1] - A[1]) * (px - C[0]) + (A[0] - C[0]) * (py - C[1])) / den;
        const l3 = 1 - l1 - l2;
        if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) continue;
        const z = l1 * A[2] + l2 * B[2] + l3 * C[2];
        const i = y * CELL + x;
        if (z >= depth[i]) continue;
        const tu = Math.min(tex.w - 1, Math.max(0, Math.floor(l1 * ua[0] + l2 * ub[0] + l3 * uc[0] - 1e-4)));
        const tv = Math.min(tex.h - 1, Math.max(0, Math.floor(l1 * ua[1] + l2 * ub[1] + l3 * uc[1] - 1e-4)));
        const t = tex.d.subarray((tv * tex.w + tu) * 4, (tv * tex.w + tu) * 4 + 4);
        if (t[3] === 0) continue;
        const translucent = t[3] < 250;
        if (translucent !== translucentPass) continue;
        const s = q.plane ? 0.9 : shade[q.name];
        const col = [t[0] * s, t[1] * s, t[2] * s];
        if (translucent) {
          const a = t[3] / 255, o = img.d.subarray(i * 4, i * 4 + 3);
          img.d.set([o[0] * (1 - a) + col[0] * a, o[1] * (1 - a) + col[1] * a, o[2] * (1 - a) + col[2] * a].map(Math.round), i * 4);
        } else {
          img.d.set([...col.map(Math.round), 255], i * 4);
          depth[i] = z;
        }
      }
    }
  };
  for (const q of vq) draw(q, false);
  vq.sort((p, q) => Math.max(...q.v.map(v => v[2])) - Math.max(...p.v.map(v => v[2])));
  for (const q of vq) draw(q, true);
  return img;
}

const names = Object.keys(specs).filter(n => !filter || n.includes(filter));
const sheet = { w: CELL * viewsArg.length, h: CELL * names.length, d: new Uint8Array(CELL * viewsArg.length * CELL * names.length * 4) };
names.forEach((n, r) => viewsArg.forEach((v, c) => {
  const img = render(n, specs[n], VIEWS[v]);
  for (let y = 0; y < CELL; y++) sheet.d.set(img.d.subarray(y * CELL * 4, (y + 1) * CELL * 4), ((r * CELL + y) * sheet.w + c * CELL) * 4);
}));
writePng(out, sheet);
console.log('rendered', names.join(', '));
