// 3D shield models (v2.3), modelled from the drawings rather than extruded from them:
//   Tank Shield   - an oval (slightly kite-shaped) bronze shield, domed towards the middle, with a grey iron rim,
//                   rivets, a raised iron boss and a leather strap on the back;
//   Lightning Rod - a round shield of translucent yellow energy in concentric rings, with a gold rim and boss.
// v2.4 (user): the Tank Shield is gold metal front and back (it looked wooden), with a smaller grip; the Lightning Rod
// is see-through, has no grip, and carries its rod - a gold needle standing out of the boss.
// Built facing north (-z), then turned 180 degrees about Y so it sits like the vanilla shield item (plate z 1..2, front
// facing +z away from the player, grip behind it), and the vanilla display transforms apply - except first person,
// where the carried shield is turned a little and raised into view (v2.3: at the vanilla spot the user could not see it).
// The texture is painted, not copied: the front art (2 texels per model unit) is shaded with one light from the top
// left, rim and face each in one hue (docs/design/art_style.md).
// Writes: textures/item/<name>_3d.png, models/item/<name>_3d.json, models/item/<name>_3d_blocking.json
// Usage: node tools/shield3d.js
const fs = require('fs');
const { writePng } = require('./png');
const RES = 'D:/MCmodev/SpireCraft/src/main/resources/assets/spirecraft/';
const TEX = 64, U = 16 / TEX;          // 64×64 sheet; JSON uv units per texel

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const hash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const pick = (ramp, t) => hex(ramp[Math.max(0, Math.min(ramp.length - 1, Math.round(t * (ramp.length - 1))))]);

const SHIELDS = {
  tank_shield: {
    // oval, a little narrower towards the bottom (kite-like), 12 × 16 model units
    halfWidth: y => { const t = Math.max(0, 1 - (y / 8) ** 2); return 6 * Math.sqrt(t) * (y < 0 ? 1 + y / 20 : 1); },
    face: ['#6a4a10', '#86621a', '#a47c24', '#c09530', '#d8ae40', '#e8c656', '#f4dc78', '#fff0a8'],
    rim: ['#232223', '#323032', '#4a4a4e', '#6b6d71', '#8a8986', '#b4afa4'],
    back: ['#4a3410', '#5e4416', '#73561e', '#886826'],
    strap: ['#3a2214', '#55331e', '#6e4428'],
    rivets: true,
  },
  lightning_rod: {
    halfWidth: y => 7 * Math.sqrt(Math.max(0, 1 - (y / 7) ** 2)),   // round, 14 across
    face: ['#c8a020', '#dcb830', '#ecd048', '#f8e468', '#fff49a'],
    rim: ['#6a4e0e', '#86661a', '#a48024', '#c09a30', '#d8b440'],
    back: ['#c8a020', '#dcb830', '#ecd048', '#f8e468'],
    strap: ['#3a2a18', '#4e3a22', '#644a2c'],
    rings: true, alpha: 150,
  },
};

const VANILLA = {
  normal: {
    thirdperson_righthand: { rotation: [0, 90, 0], translation: [10, 6, -4], scale: [1, 1, 1] },
    thirdperson_lefthand: { rotation: [0, 90, 0], translation: [10, 6, 12], scale: [1, 1, 1] },
    firstperson_righthand: { rotation: [0, 160, 5], translation: [-5, 6, -10], scale: [1.1, 1.1, 1.1] },
    firstperson_lefthand: { rotation: [0, 200, -5], translation: [5, 6, -10], scale: [1.1, 1.1, 1.1] },
    gui: { rotation: [15, -25, -5], translation: [2, 3, 0], scale: [0.65, 0.65, 0.65] },
    fixed: { rotation: [0, 180, 0], translation: [-4.5, 4.5, -5], scale: [0.55, 0.55, 0.55] },
    ground: { rotation: [0, 0, 0], translation: [2, 4, 2], scale: [0.25, 0.25, 0.25] },
  },
  blocking: {
    thirdperson_righthand: { rotation: [45, 155, 0], translation: [-3.49, 11, -2], scale: [1, 1, 1] },
    thirdperson_lefthand: { rotation: [45, 155, 0], translation: [11.51, 7, 2.5], scale: [1, 1, 1] },
    firstperson_righthand: { rotation: [0, 180, -5], translation: [-14, 10, -11], scale: [1.25, 1.25, 1.25] },
    firstperson_lefthand: { rotation: [0, 180, -5], translation: [14, 10, -11], scale: [1.25, 1.25, 1.25] },
    gui: { rotation: [15, -25, -5], translation: [2, 3, 0], scale: [0.65, 0.65, 0.65] },
  },
};

const r3 = v => Math.round(v * 1000) / 1000;
for (const [name, o] of Object.entries(SHIELDS)) {
  const sheet = { w: TEX, h: TEX, d: new Uint8Array(TEX * TEX * 4) };
  const set = (x, y, c, a = 255) => sheet.d.set([...c, a], (y * TEX + x) * 4);
  const H = name === 'tank_shield' ? 8 : 7;                      // half height in model units
  const inside = (x, y) => Math.abs(y) <= H && Math.abs(x) <= o.halfWidth(y);
  // ---- front art at (0,0): texel (c, r) is model x = 8 - (c + .5) / 2 (the viewer sees +x on the left of a
  // north face), y = 8 - (r + .5) / 2
  for (let r = 0; r < 32; r++) for (let c = 0; c < 32; c++) {
    const x = 8 - (c + 0.5) / 2, y = 8 - (r + 0.5) / 2;
    if (!inside(x, y)) continue;
    const rim = !inside(x + 1, y) || !inside(x - 1, y) || !inside(x, y + 1) || !inside(x, y - 1);
    const vx = -x;                                                 // viewer coordinate, + to the right
    const light = 0.5 + 0.22 * (-vx + y) / 8;                       // light from the top left
    if (rim) {
      const outer = !inside(x + 0.5, y) || !inside(x - 0.5, y) || !inside(x, y + 0.5) || !inside(x, y - 0.5);
      let t = light + (outer ? -0.12 : 0.12) + (hash(c, r, 3) - 0.5) * 0.08;
      if (o.rivets && !outer && (c * 7 + r * 3) % 11 === 0) t = 0.95;   // rivet heads: single light texels
      set(c, r, pick(o.rim, t));
    } else {
      // the dome: brightest a little up-left of the middle, falling off towards the rim
      const d = Math.hypot(vx + 2, y - 2.5) / 9;
      let t = light + 0.28 - 0.38 * d + (hash(c >> 1, r, 5) - 0.5) * 0.06;
      if (o.rings) {
        // concentric rings of energy, brighter on each ring line, see-through between them
        const rr = Math.hypot(vx, y), ring = rr % 1.5 < 0.5;
        set(c, r, pick(o.face, ring ? 0.85 : 0.35 + 0.15 * light), ring ? o.alpha + 60 : o.alpha);
        continue;
      }
      set(c, r, pick(o.face, t));
    }
  }
  // ---- back art at (32,0): planks / leather lining, mirrored like a south face
  for (let r = 0; r < 32; r++) for (let c = 0; c < 32; c++) {
    const x = (c + 0.5) / 2 - 8, y = 8 - (r + 0.5) / 2;
    if (!inside(x, y)) continue;
    if (o.rings) {
      const rr = Math.hypot(x, y), ring = rr % 1.5 < 0.5;
      set(32 + c, r, pick(o.back, ring ? 0.8 : 0.3), ring ? o.alpha + 40 : o.alpha - 20);
      continue;
    }
    // the back of the gold plate: plain metal, darker, a soft light from the top
    set(32 + c, r, pick(o.back, 0.4 + 0.3 * y / 8 + (hash(c >> 2, r >> 2, 7) - 0.5) * 0.12));
  }
  // ---- swatches: rim sides (0,32)-(8,40), face sides (8,32), strap (16,32)
  for (let y = 32; y < 40; y++) for (let x = 0; x < 8; x++) {
    set(x, y, pick(o.rim, 0.55 + (y - 36) * 0.04));
    set(8 + x, y, pick(o.face, 0.35 + (hash(x, y, 9) - 0.5) * 0.1));
    set(16 + x, y, pick(o.strap, y === 32 ? 1 : 0.5 + (hash(x, y, 11) - 0.5) * 0.3));
  }
  writePng(RES + 'textures/item/' + name + '_3d.png', sheet);

  // ---- geometry
  const art = (x0, x1, y0, y1, back) => back
    ? [(32 + (x0 + 8) * 2) * U, (8 - y1) * 2 * U, (32 + (x1 + 8) * 2) * U, (8 - y0) * 2 * U].map(r3)
    : [(8 - x1) * 2 * U, (8 - y1) * 2 * U, (8 - x0) * 2 * U, (8 - y0) * 2 * U].map(r3);
  const sw = i => [i * 8 * U, 32 * U, (i * 8 + 8) * U, 40 * U].map(r3);
  const T = '#shield';
  const box = (from, to, faces) => ({ from: from.map(r3), to: to.map(r3), faces });
  const elements = [];
  for (let y = -H; y < H; y++) {
    const hw = Math.round(Math.min(o.halfWidth(y + 0.25), o.halfWidth(y + 0.75)) * 2) / 2;
    if (hw < 1) continue;
    const plateFaces = { north: { uv: art(-hw, hw, y, y + 1, false), texture: T }, south: { uv: art(-hw, hw, y, y + 1, true), texture: T },
      east: { uv: sw(0), texture: T }, west: { uv: sw(0), texture: T }, up: { uv: sw(0), texture: T }, down: { uv: sw(0), texture: T } };
    elements.push(box([-hw, y, -2], [hw, y + 1, -1], plateFaces));
    // rim: a thicker iron band at both ends of the row
    const rimFaces = (x0, x1) => ({ north: { uv: art(x0, x1, y, y + 1, false), texture: T }, south: { uv: sw(0), texture: T },
      east: { uv: sw(0), texture: T }, west: { uv: sw(0), texture: T }, up: { uv: sw(0), texture: T }, down: { uv: sw(0), texture: T } });
    elements.push(box([hw - 1, y, -2.5], [hw, y + 1, -0.5], rimFaces(hw - 1, hw)));
    elements.push(box([-hw, y, -2.5], [-hw + 1, y + 1, -0.5], rimFaces(-hw, -hw + 1)));
    // the dome: two raised layers inside the rim
    for (const [inset, z] of [[1.5, -2.5], [3.5, -3]]) {
      const w = hw - inset, dy = Math.abs(y + 0.5);
      if (w < 1 || dy > H - inset - 0.5) continue;
      elements.push(box([-w, y, z], [w, y + 1, -2], { north: { uv: art(-w, w, y, y + 1, false), texture: T },
        east: { uv: sw(1), texture: T }, west: { uv: sw(1), texture: T }, up: { uv: sw(1), texture: T }, down: { uv: sw(1), texture: T } }));
    }
  }
  // top and bottom rim caps
  for (const y of [H - 1, -H]) {
    const hw = Math.round(o.halfWidth(y + 0.5) * 2) / 2;
    if (hw >= 1) elements.push(box([-hw, y, -2.5], [hw, y + 1, -0.5], { north: { uv: art(-hw, hw, y, y + 1, false), texture: T },
      south: { uv: sw(0), texture: T }, east: { uv: sw(0), texture: T }, west: { uv: sw(0), texture: T }, up: { uv: sw(0), texture: T }, down: { uv: sw(0), texture: T } }));
  }
  // boss: a raised iron / gold knob in the middle
  const bossFaces = { north: { uv: [1 * U, 33 * U, 5 * U, 37 * U].map(r3), texture: T } };
  for (const f of ['east', 'west', 'up', 'down']) bossFaces[f] = { uv: sw(0), texture: T };
  elements.push(box([-1.5, -1, -4], [1.5, 2, -3], bossFaces));
  if (o.rings) {
    // v2.4: the Lightning Rod has no grip; the rod itself - a thin gold needle with a bright tip - stands out of the boss
    const gold = Object.fromEntries(['north', 'south', 'east', 'west', 'up', 'down'].map(f => [f, { uv: sw(0), texture: T }]));
    const tip = Object.fromEntries(['north', 'south', 'east', 'west', 'up', 'down'].map(f => [f, { uv: [1 * U, 33 * U, 2 * U, 34 * U].map(r3), texture: T }]));
    elements.push(box([-0.5, 0, -9], [0.5, 1, -4], gold));
    elements.push(box([-0.25, 0.25, -11], [0.25, 0.75, -9], tip));
  } else {
    // the strap and a small grip behind the plate (v2.4: smaller)
    const strap = Object.fromEntries(['north', 'south', 'east', 'west', 'up', 'down'].map(f => [f, { uv: sw(2), texture: T }]));
    elements.push(box([-0.5, -2, -1], [0.5, 2, 1], strap));
    elements.push(box([-3, -0.5, -1], [3, 0.5, -0.5], strap));
  }
  // turn 180 degrees about Y: x and z change sign, north/south and east/west faces swap
  const swap = { north: 'south', south: 'north', east: 'west', west: 'east', up: 'up', down: 'down' };
  for (const e of elements) {
    const [fx, fy, fz] = e.from, [tx, ty, tz] = e.to;
    e.from = [r3(-tx), fy, r3(-tz)]; e.to = [r3(-fx), ty, r3(-fz)];
    e.faces = Object.fromEntries(Object.entries(e.faces).map(([k, v]) => [swap[k], v]));
  }
  for (const [variant, display] of Object.entries(VANILLA)) {
    const model = { gui_light: 'front', textures: { shield: 'spirecraft:item/' + name + '_3d', particle: 'spirecraft:item/' + name }, elements, display };
    fs.writeFileSync(RES + 'models/item/' + name + '_3d' + (variant === 'blocking' ? '_blocking' : '') + '.json', JSON.stringify(model, null, 1));
  }
  console.log(name, elements.length, 'elements');
}
