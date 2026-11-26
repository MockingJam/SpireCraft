// Glory v2 castles (2026-11-26). User: "Make the Queen's a castle - no new blocks, vanilla dark stone like deepslate
// bricks. After the castle in the picture (the Gravensteen): many bastions, towers, rooms and passages crossing each
// other; every building joined to the next; a high outer wall all round that you can walk on. The top floor of the
// biggest building in the middle is the boss room - no altar: she is in there, walking in starts the fight. The other
// buildings hold the three knights, the mecha guards, frog knights, a room of statues with the Devoted Sculptor, cells
// with the Slimed Berserker. The three knights can have a castle of their own, smaller, the same materials and
// elements, with more buildings."
// Shared language: deepslate brick walls (cracked and tiled patches), a cobbled deepslate plinth, polished deepslate
// bands at each floor, crenellations on every wall top with machicolation corbels under the parapets, round towers with
// arrow slits (some with deepslate-tile cone roofs), crow-stepped gables over the halls, dark oak floors and beams, grey
// glass, iron-barred gates. Convention as in build.js: y = 0 is the ground layer.
const K = require('./glory_kit');
const { box, walls, mob, crenelRect, corbelsRect, roundTower, coneRoof, gable, stairRun, doorway, curtain, hangLantern, wallTorch, banner } = K;

module.exports = function castles({ Struct, rng, loot, special }) {
  const H = (x, y, z) => { let v = (x * 374761393 + y * 668265263 + z * 2246822519) ^ 0x5bd1e995; v = Math.imul(v ^ (v >>> 13), 1274126177); return ((v ^ (v >>> 16)) >>> 0) / 4294967296; };
  /** The castle stone: deepslate bricks with cracked and tiled patches, cobbled deepslate in the plinth. */
  const DS = (x, y, z) => { const h = H(x, y, z); return y <= 1 ? (h < 0.5 ? 'cobbled_deepslate' : 'deepslate_bricks') : h < 0.1 ? 'cracked_deepslate_bricks' : h < 0.2 ? 'deepslate_tiles' : h < 0.23 ? 'cracked_deepslate_tiles' : 'deepslate_bricks'; };
  const TRIM = 'polished_deepslate', ROOF = 'deepslate_tiles', ROOF_ST = 'deepslate_tile_stairs', FLOOR = 'dark_oak_planks', PANE = 'gray_stained_glass_pane';
  const GATE = 'spirecraft:glory_gate[closed=false]';
  const CARPET = c => `${c}_carpet`;

  loot('glory_castle', [
    { rolls: [4, 7], items: [['iron_ingot', 10, 1, 4], ['gold_ingot', 6, 1, 3], ['iron_nugget', 8, 3, 9], ['bread', 6, 1, 3], ['arrow', 6, 4, 10], ['emerald', 4, 1, 3], ['spirecraft:relic_fragment', 4]] },
    { rolls: 1, items: [['empty', 55], ['iron_sword', 10], ['iron_chestplate', 6], ['shield', 10], ['crossbow', 6], ['spirecraft:cleaver', 6], ['spirecraft:bludgeon', 6]] },
  ]);
  loot('queens_treasury', [
    { rolls: [5, 8], items: [['gold_ingot', 10, 2, 6], ['emerald', 8, 2, 6], ['diamond', 4, 1, 2], ['amethyst_shard', 6, 2, 6], ['spirecraft:relic_fragment', 6, 1, 2], ['golden_apple', 3]] },
  ]);
  loot('castle_cells', [
    { rolls: [2, 5], items: [['bone', 10, 1, 4], ['slime_ball', 8, 1, 4], ['rotten_flesh', 6, 1, 3], ['iron_nugget', 6, 2, 6], ['string', 4, 1, 3], ['spirecraft:relic_fragment', 2]] },
  ]);

  // ------------------------------------------------------------------------------------------- building pieces
  /**
   * A rectangular stone building x0..x1 × z0..z1 of `levels` storeys, each `storey` high (floor at y0 + k*storey),
   * polished bands at the floors, windows on every storey, dark oak floors, crenellated parapet (flat roof, walkable) or
   * a crow-stepped gable roof. Returns the y of the top (roof floor).
   */
  function hall(s, x0, z0, x1, z1, y0, levels, storey, o = {}) {
    const top = y0 + levels * storey;
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      const edge = x === x0 || x === x1 || z === z0 || z === z1;
      for (let y = y0; y <= top; y++) {
        const lvl = (y - y0) % storey, isFloor = lvl === 0;
        if (edge) {
          const along = x === x0 || x === x1 ? z - z0 : x - x0, len = x === x0 || x === x1 ? z1 - z0 : x1 - x0;
          const win = o.windows !== false && !isFloor && along % 4 === 2 && along > 1 && along < len - 1 && lvl >= 2 && lvl <= storey - 2 && y < top;
          s.set(x, y, z, isFloor && y > y0 ? TRIM : win ? (lvl === storey - 2 && storey > 4 ? 'polished_deepslate_slab[type=top]' : PANE) : DS(x, y, z));
        } else s.set(x, y, z, isFloor ? (y === y0 ? (o.groundFloor || 'polished_deepslate') : (y === top ? (o.roofFloor || 'deepslate_tiles') : FLOOR)) : 'air');
      }
    }
    if (o.roof === 'gable') gable(s, x0, z0, x1, z1, top + 1, { axis: o.axis || (x1 - x0 >= z1 - z0 ? 'x' : 'z'), stair: ROOF_ST, block: ROOF, gable: 'deepslate_bricks', stepped: true, overhang: 0 });
    else if (o.roof !== 'none') { crenelRect(s, x0, z0, x1, z1, top + 1, 'deepslate_brick_wall'); for (let x = x0; x <= x1; x++) for (const z of [z0, z1]) if ((x + z) % 2) s.set(x, top + 1, z, 'air'); if (o.corbels !== false) corbelsRect(s, x0, z0, x1, z1, top - 1, 'deepslate_brick_stairs'); }
    return top;
  }
  /** Interior stairs between storeys: a run along +x from (x, y, z) up `n`, cutting the floor above. */
  function upstairs(s, x, y, z, dir, n) {
    stairRun(s, x, y + 1, z, dir, n, 'dark_oak_stairs', null, 2);
    const D = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] }[dir], side = [D[1] !== 0 ? 1 : 0, D[0] !== 0 ? 1 : 0];
    for (let k = n - 4; k < n; k++) for (let w = 0; w < 2; w++) for (let yy = y + n; yy <= y + n; yy++) s.set(x + D[0] * k + side[0] * w, yy, z + D[1] * k + side[1] * w, 'air');
  }
  /** A covered bridge between two buildings at floor y, along x (or z): floor, walls with slits, a roof. */
  function bridge(s, x0, z0, x1, z1, y) {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      const edge = (x1 - x0 >= z1 - z0) ? (z === z0 || z === z1) : (x === x0 || x === x1);
      s.set(x, y, z, TRIM);
      s.set(x, y - 1, z, `deepslate_brick_stairs[facing=${x1 - x0 >= z1 - z0 ? (z === z0 ? 'south' : 'north') : (x === x0 ? 'east' : 'west')},half=top,shape=straight]`);
      for (let yy = y + 1; yy <= y + 3; yy++) s.set(x, yy, z, edge ? (yy === y + 2 && ((x + z) % 3 === 0) ? 'iron_bars' : DS(x, yy, z)) : 'air');
      s.set(x, y + 4, z, edge ? 'deepslate_brick_slab[type=bottom]' : ROOF);
    }
  }
  /**
   * A cloister walk (arcade) at ground level from x0..x1 × z0..z1: paved, square piers every third block along its
   * length, a slab roof - the covered ways that join the castle's buildings round the courtyard. Doors are cut where it
   * meets a wall (doorAt: [[x, z]...]).
   */
  function arcade(s, x0, z0, x1, z1, y, doorAt = []) {
    const alongX = x1 - x0 >= z1 - z0;
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      const side = alongX ? (z === z0 || z === z1) : (x === x0 || x === x1);
      const k = alongX ? x - x0 : z - z0;
      s.set(x, y, z, 'polished_deepslate');
      for (let yy = y + 1; yy <= y + 3; yy++) s.set(x, yy, z, side && k % 3 === 0 ? 'deepslate_brick_wall' : 'air');
      if (side && k % 3 !== 0) s.set(x, y + 3, z, `deepslate_brick_stairs[facing=${alongX ? (z === z0 ? 'south' : 'north') : (x === x0 ? 'east' : 'west')},half=top,shape=straight]`);
      s.set(x, y + 4, z, side ? 'deepslate_tile_slab[type=bottom]' : 'deepslate_tiles');
    }
    for (const [x, z] of doorAt) for (let yy = y + 1; yy <= y + 3; yy++) for (let w = -1; w <= 1; w++) s.set(alongX ? x : x + w, yy, alongX ? z + w : z, 'air');
  }
  /** A round corner turret, a bartizan, corbelled out from a wall top: starts at y, cone roof. */
  function bartizan(s, cx, cz, y, rad = 2) {
    for (let k = 0; k < 2; k++) for (let x = Math.floor(cx - rad); x <= Math.ceil(cx + rad); x++) for (let z = Math.floor(cz - rad); z <= Math.ceil(cz + rad); z++)
      if (Math.hypot(x - cx, z - cz) <= rad - 1 + k + 0.3) s.set(x, y + k, z, k === 0 ? 'deepslate_bricks' : TRIM);
    roundTower(s, cx, cz, rad + 0.6, y + 1, y + 6, { mat: DS, floor: FLOOR, slits: 3, top: 'cone', roof: ROOF, roofTip: 'lightning_rod[facing=up,powered=false]' });
  }
  /** Floor-standing lantern post and a few castle props. */
  const brazier = (s, x, y, z, soul) => { s.set(x, y, z, 'polished_deepslate_wall'); s.set(x, y + 1, z, soul ? 'soul_campfire[lit=true,facing=north,signal_fire=false,waterlogged=false]' : 'campfire[lit=true,facing=north,signal_fire=false,waterlogged=false]'); };
  const chandelier = (s, x, y, z, soul) => { s.set(x, y, z, 'iron_chain[axis=y]'); s.set(x, y - 1, z, 'iron_chain[axis=y]'); hangLantern(s, x, y - 2, z, soul); };
  /** A long table with benches along x from x0 to x1 at z. */
  function table(s, x0, x1, y, z) {
    for (let x = x0; x <= x1; x++) { s.set(x, y, z, 'dark_oak_slab[type=top]'); s.set(x, y, z - 1, 'dark_oak_stairs[facing=south,half=bottom,shape=straight]'); s.set(x, y, z + 1, 'dark_oak_stairs[facing=north,half=bottom,shape=straight]'); }
    for (let x = x0 + 1; x < x1; x += 3) s.set(x, y + 1, z, x % 2 ? 'candle[candles=3,lit=true,waterlogged=false]' : 'lantern[hanging=false,waterlogged=false]');
  }
  /** A small crow statue (the Sculptor's people) on a plinth, 4 high: robe, hunched shoulders, a beaked mask. */
  function crowStatue(s, x, y, z, facing, mat = 'polished_andesite', head = 'calcite') {
    s.set(x, y, z, 'chiseled_deepslate');
    s.set(x, y + 1, z, mat); s.set(x, y + 2, z, mat);
    s.set(x, y + 3, z, head);
    const d = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] }[facing];
    s.set(x + d[0], y + 3, z + d[1], `${head === 'calcite' ? 'diorite' : 'andesite'}_wall`);
    s.set(x - d[1], y + 2, z + d[0], `${mat}_stairs[facing=${facing},half=top,shape=straight]`);
    s.set(x + d[1], y + 2, z - d[0], `${mat}_stairs[facing=${facing},half=top,shape=straight]`);
  }

  // =========================================================================================== the Queen's castle
  function queensCastle(seed) {
    const r = rng(seed), W = 99, D = 99, Hh = 64, G = 5, s = new Struct(W, Hh, D);
    // the ground: snow and frozen dirt, the courtyard paved; G layers of earth under it hold the dungeon
    for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
      for (let y = 0; y < G; y++) s.set(x, y, z, y < G - 1 ? 'stone' : 'dirt');
      s.set(x, G, z, r.chance(0.8) ? 'snow_block' : 'gravel');
      for (let y = G + 1; y < Hh; y++) s.set(x, y, z, 'air');
    }
    const g = G;   // ground floor level (layer)
    // ---- the outer curtain wall: an irregular octagon, 15 high, a wall-walk on top with merlons outside
    const P = [[10, 16], [30, 6], [68, 6], [88, 16], [92, 56], [82, 90], [16, 90], [6, 56]];
    const cw = curtain(s, P.map(([x, z]) => [x, z]), 0, { mat: () => 'air', W, D });   // the inside test only
    // build the wall by hand on the layers above the ground
    const wallH = 15;
    const segDist = (px, pz, ax, az, bx, bz) => { const vx = bx - ax, vz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / (vx * vx + vz * vz))); return Math.hypot(px - ax - vx * t, pz - az - vz * t); };
    for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
      let d = 1e9;
      for (let i = 0; i < P.length; i++) { const [ax, az] = P[i], [bx, bz] = P[(i + 1) % P.length]; d = Math.min(d, segDist(x, z, ax, az, bx, bz)); }
      if (d > 1.55) continue;
      const inn = cw.inside(x, z);
      for (let y = g + 1; y <= g + wallH; y++) s.set(x, y, z, DS(x, y, z));
      s.set(x, g + wallH, z, inn || d < 0.6 ? TRIM : DS(x, g + wallH, z));
      if (!inn && d > 0.55) { if ((x + z) % 2 === 0) s.set(x, g + wallH + 1, z, DS(x, 99, z)); s.set(x, g + wallH + 2, z, 'air'); }
      if (!inn && d > 0.55 && H(x, 7, z) < 0.25) s.set(x, g + 9, z, 'iron_bars');   // arrow slits in the curtain
    }
    // the corner towers: round, a floor at the wall-walk, ladders; the four big ones with cone roofs
    P.forEach(([x, z], i) => {
      const big = i % 2 === 0;
      roundTower(s, x, z, big ? 5 : 4, g, g + wallH + (big ? 7 : 5), { mat: DS, floor: FLOOR, floors: [g + 7, g + wallH], slits: 4, top: big ? 'cone' : 'crenel', roof: ROOF, roofTip: 'lightning_rod[facing=up,powered=false]', ladder: true, ladderAt: [0, 1] });
      // the wall-walk runs through the tower: doorways to both neighbours
      for (const j of [(i + 1) % P.length, (i + P.length - 1) % P.length]) {
        const [nx, nz] = P[j], len = Math.hypot(nx - x, nz - z), ux = (nx - x) / len, uz = (nz - z) / len;
        for (let k = 2; k <= (big ? 6 : 5); k++) for (let y = g + wallH + 1; y <= g + wallH + 2; y++) s.set(Math.round(x + ux * k), y, Math.round(z + uz * k), 'air');
      }
      // a door into the tower from the courtyard
      const cx = 49 - x, cz = 49 - z, l = Math.hypot(cx, cz);
      for (let k = 3; k <= (big ? 6 : 5); k++) for (let y = g + 1; y <= g + 2; y++) s.set(Math.round(x + cx / l * k), y, Math.round(z + cz / l * k), 'air');
    });

    // ---- the gatehouse (south): a square block over the gate passage, two flanking turrets, a portcullis
    const GX0 = 40, GX1 = 58, GZ0 = 82, GZ1 = 96;
    hall(s, GX0, GZ0, GX1, GZ1, g, 3, 7, { roof: 'crenel' });
    for (let x = 46; x <= 52; x++) for (let z = GZ0; z <= GZ1; z++) for (let y = g + 1; y <= g + 6; y++) s.set(x, y, z, 'air');
    for (let x = 46; x <= 52; x++) for (let z = GZ0 + 1; z < GZ1; z++) s.set(x, g, z, 'polished_deepslate');
    for (let x = 46; x <= 52; x++) { s.set(x, g + 6, GZ1, TRIM); s.set(x, g + 6, GZ0, TRIM); for (let y = g + 3; y <= g + 6; y++) s.set(x, y, 90, 'iron_bars'); }
    for (const tx of [GX0 - 1, GX1 + 1]) roundTower(s, tx, GZ1 - 1, 4, g, g + 27, { mat: DS, floor: FLOOR, floors: [g + 7, g + 14, g + 21], slits: 4, top: 'cone', roof: ROOF, roofTip: 'lightning_rod[facing=up,powered=false]', ladder: true, ladderAt: [0, -1], door: [0, -1] });
    for (const x of [44, 54]) banner(s, x, g + 5, GZ1 + 1, 'purple', 'south');
    upstairs(s, GX0 + 1, g, GZ0 + 2, 'east', 4);
    mob(s, 47, g + 1, 85, 'living_shield'); mob(s, 51, g + 1, 85, 'living_shield');
    mob(s, 49, g + 22, 92, 'turret_operator');   // on the gatehouse roof, over the way in
    // the way in: a causeway of gravel and stone from the gate
    for (let z = GZ1 + 1; z < D; z++) for (let x = 46; x <= 52; x++) s.set(x, g, z, r.chance(0.7) ? 'gravel' : 'cobbled_deepslate');

    // ---- the courtyard: paved, with a well, carts and hay, lamp posts
    for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (cw.inside(x, z) && s.get(x, g + 1, z) === 'air') s.set(x, g, z, H(x, 1, z) < 0.55 ? 'cobbled_deepslate' : H(x, 2, z) < 0.6 ? 'gravel' : 'polished_deepslate');
    for (const [x, z] of [[30, 68], [68, 68], [30, 26], [68, 26], [49, 72]]) { s.set(x, g + 1, z, 'deepslate_brick_wall'); s.set(x, g + 2, z, 'deepslate_brick_wall'); s.set(x, g + 3, z, 'lantern[hanging=false,waterlogged=false]'); }
    // the well
    for (let x = 47; x <= 51; x++) for (let z = 74; z <= 78; z++) { const e = x === 47 || x === 51 || z === 74 || z === 78; s.set(x, g, z, e ? 'deepslate_bricks' : 'water'); if (e) s.set(x, g + 1, z, 'deepslate_brick_wall'); }
    for (const [x, z] of [[47, 74], [51, 78]]) { s.set(x, g + 2, z, 'dark_oak_fence'); s.set(x, g + 3, z, 'dark_oak_fence'); }
    for (let x = 47; x <= 51; x++) s.set(x, g + 4, 76, 'dark_oak_slab[type=bottom]');
    for (const [x, z] of [[24, 54], [25, 54], [74, 54]]) s.set(x, g + 1, z, 'hay_block[axis=y]');

    // ---- the keep (the middle): 31 × 31, five floors, the throne room on top; round turrets at the corners
    const KX0 = 34, KX1 = 64, KZ0 = 26, KZ1 = 56, STOREY = 7, TY = g + 4 * STOREY;   // TY: the throne room floor
    for (let x = KX0; x <= KX1; x++) for (let z = KZ0; z <= KZ1; z++) {
      const edge = x === KX0 || x === KX1 || z === KZ0 || z === KZ1;
      for (let y = g; y <= TY + 16; y++) {
        const lvl = y - g;
        if (edge) {
          const along = x === KX0 || x === KX1 ? z - KZ0 : x - KX0;
          const lower = y < TY, slot = lower ? (lvl % STOREY) : (y - TY);
          const win = lower ? (along % 5 === 2 && slot >= 2 && slot <= 4 && along > 2 && along < 28) : (along % 4 === 2 && slot >= 3 && slot <= 11 && along > 2 && along < 28);
          s.set(x, y, z, (lower && lvl % STOREY === 0 && y > g) || y === TY ? TRIM : win ? (lower ? PANE : (slot === 11 ? 'polished_deepslate_slab[type=top]' : 'purple_stained_glass_pane')) : DS(x, y, z));
        } else s.set(x, y, z, y === g ? 'polished_deepslate' : (y < TY && lvl % STOREY === 0) ? FLOOR : y === TY ? 'polished_deepslate' : y === TY + 16 ? ROOF : 'air');
      }
    }
    crenelRect(s, KX0, KZ0, KX1, KZ1, TY + 17, 'deepslate_brick_wall');
    corbelsRect(s, KX0, KZ0, KX1, KZ1, TY + 15, 'deepslate_brick_stairs');
    for (const [x, z] of [[KX0, KZ0], [KX1, KZ0], [KX0, KZ1], [KX1, KZ1]]) bartizan(s, x, z, TY + 14, 3);
    // a watch turret on the roof
    roundTower(s, 49, 41, 3, TY + 16, TY + 24, { mat: DS, floor: ROOF, slits: 3, top: 'cone', roof: ROOF, roofTip: 'lightning_rod[facing=up,powered=false]' });
    // the great door (south) and the stairs from floor to floor, a switchback in the north-east corner
    for (let x = 47; x <= 51; x++) for (let y = g + 1; y <= g + 5; y++) s.set(x, y, KZ1, 'air');
    doorway(s, 47, g, KZ1, 5, 5, 'x', 'deepslate_brick_stairs');
    for (let k = 0; k < 4; k++) {
      const y = g + k * STOREY, eastward = k % 2 === 0;
      stairRun(s, eastward ? 52 : 62, y + 1, 28, eastward ? 'east' : 'west', 7, 'dark_oak_stairs', null, 2);
      for (let x = 52; x <= 62; x++) for (const z of [28, 29]) if (x >= (eastward ? 57 : 52) && x <= (eastward ? 62 : 57)) s.set(x, y + STOREY, z, k === 3 ? 'polished_deepslate' : 'air');
    }
    // the last flight comes up into the throne room at its south end, through a glory gate
    for (let x = 52; x <= 62; x++) for (const z of [28, 29]) s.set(x, TY, z, 'polished_deepslate');
    stairRun(s, 56, TY - STOREY + 1, 30, 'south', 7, 'dark_oak_stairs', null, 2);
    for (let z = 33; z <= 37; z++) for (const x of [56, 57]) s.set(x, TY, z, 'air');
    for (const x of [55, 58]) for (let z = 30; z <= 37; z++) s.set(x, TY + 1, z, 'deepslate_brick_wall');
    for (let z = 30; z <= 37; z++) for (const x of [56, 57]) s.set(x, TY + 1, z, z === 37 ? GATE : s.get(x, TY + 1, z));
    // ground floor: the great hall - long tables, banners, braziers
    table(s, 40, 58, g + 1, 44); table(s, 40, 58, g + 1, 50);
    for (const z of [34, 40, 46, 52]) { banner(s, KX0 + 1, g + 4, z, 'purple', 'east'); banner(s, KX1 - 1, g + 4, z, 'purple', 'west'); }
    for (const [x, z] of [[38, 53], [60, 53], [38, 32], [60, 32]]) brazier(s, x, g + 1, z);
    for (const x of [42, 49, 56]) chandelier(s, x, g + STOREY - 1, 47);
    mob(s, 45, g + 1, 53, 'living_shield'); mob(s, 53, g + 1, 53, 'living_shield');
    // first floor: the guard room and armoury - armour stands, racks, a Mecha Knight standing switched off
    const f1 = g + STOREY;
    for (const x of [37, 39, 41, 43]) s.entity(x, f1 + 1, 54, { id: 'minecraft:armor_stand', Rotation: [{ t: 5, v: 180 }, { t: 5, v: 0 }], equipment: { feet: { id: 'minecraft:iron_boots', count: 1 }, legs: { id: 'minecraft:iron_leggings', count: 1 }, chest: { id: 'minecraft:iron_chestplate', count: 1 }, head: { id: 'minecraft:iron_helmet', count: 1 } } });
    for (let x = 45; x <= 52; x++) { s.set(x, f1 + 1, 54, x % 2 ? 'smithing_table' : 'barrel[facing=up,open=false]'); }
    s.chest(53, f1 + 1, 54, 'north', 'glory_castle');
    mob(s, 40, f1 + 1, 40, 'mecha_knight');
    mob(s, 58, f1 + 1, 46, 'turret_operator');
    for (const x of [42, 56]) chandelier(s, x, f1 + STOREY - 1, 44);
    // second floor: the council room and the library
    const f2 = g + 2 * STOREY;
    for (let x = KX0 + 1; x < KX1; x++) if (x % 3 !== 0) { s.set(x, f2 + 1, KZ1 - 1, 'bookshelf'); s.set(x, f2 + 2, KZ1 - 1, 'bookshelf'); }
    table(s, 40, 52, f2 + 1, 42);
    s.set(46, f2 + 1, 38, 'lectern[facing=south,has_book=false,powered=false]');
    mob(s, 44, f2 + 1, 48, 'globe_head');
    for (const x of [42, 56]) chandelier(s, x, f2 + STOREY - 1, 44);
    // third floor: the royal chambers - beds, wardrobes, the treasury chest
    const f3 = g + 3 * STOREY;
    for (const x of [38, 42]) { s.set(x, f3 + 1, 52, 'purple_bed[facing=south,part=head,occupied=false]'); s.set(x, f3 + 1, 53, 'purple_bed[facing=south,part=foot,occupied=false]'); }
    for (let x = 36; x <= 46; x++) s.set(x, f3 + 1, 46, x % 4 === 0 ? 'dark_oak_log[axis=y]' : 'air');
    s.chest(60, f3 + 1, 54, 'north', 'queens_treasury');
    for (let x = 50; x <= 62; x++) for (let z = 40; z <= 54; z++) s.set(x, f3 + 1, z, (x + z) % 2 ? CARPET('purple') : CARPET('black'));
    for (let x = 50; x <= 62; x++) for (let z = 40; z <= 54; z++) if (s.get(x, f3 + 1, z) && s.get(x, f3, z) !== FLOOR) s.set(x, f3 + 1, z, 'air');
    // the throne room: two rows of square columns, purple banners, soul braziers, chandeliers, the dais in the north
    for (const x of [41, 57]) for (let z = 32; z <= 52; z += 5) for (let y = TY + 1; y <= TY + 15; y++) for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) s.set(x + dx, y, z + dz, y === TY + 1 || y === TY + 15 ? 'chiseled_deepslate' : 'polished_deepslate');
    for (let x = 43; x <= 55; x++) for (let z = 30; z <= 54; z++) s.set(x, TY + 1, z, x === 43 || x === 55 ? CARPET('black') : CARPET('purple'));
    for (let x = 43; x <= 55; x++) for (let z = 28; z <= 31; z++) { s.set(x, TY + 1, z, z === 31 ? 'polished_deepslate_stairs[facing=south,half=bottom,shape=straight]' : 'polished_deepslate'); s.set(x, TY + 2, z, z <= 29 ? (z === 29 ? 'polished_deepslate_slab[type=bottom]' : 'air') : 'air'); }
    s.set(49, TY + 2, 28, 'polished_deepslate_stairs[facing=south,half=bottom,shape=straight]'); s.set(49, TY + 3, 27, 'chiseled_deepslate');
    s.set(48, TY + 2, 28, 'polished_deepslate_wall'); s.set(50, TY + 2, 28, 'polished_deepslate_wall');
    for (const [x, z] of [[44, 33], [54, 33], [44, 50], [54, 50]]) brazier(s, x, TY + 1, z, true);
    for (const x of [45, 53]) for (const z of [36, 44, 52]) chandelier(s, x, TY + 15, z, true);
    for (const z of [34, 40, 46, 52]) { banner(s, KX0 + 1, TY + 9, z, 'purple', 'east'); banner(s, KX1 - 1, TY + 9, z, 'purple', 'west'); }
    mob(s, 49, TY + 2, 31, 'queen', { Rotation: [{ t: 5, v: 0 }, { t: 5, v: 0 }] });
    mob(s, 49, TY + 1, 37, 'torch_head_amalgam', { Rotation: [{ t: 5, v: 0 }, { t: 5, v: 0 }] });
    // doors from the throne room to the roof-walks of the bridges are gated too (see the bridges below)

    // ---- the knights' barracks (west): two storeys and a stepped gable; the three knights asleep in their alcoves
    hall(s, 14, 24, 30, 46, g, 2, 6, { roof: 'gable', axis: 'z' });
    doorway(s, 30, g, 33, 1, 3, 'z');
    for (const [z, c] of [[28, 'black'], [35, 'cyan'], [42, 'brown']]) { for (let y = g + 1; y <= g + 4; y++) { s.set(15, y, z - 1, TRIM); s.set(15, y, z + 1, TRIM); } banner(s, 15, g + 3, z, c, 'east'); }
    mob(s, 17, g + 1, 28, 'flail_knight', { Rotation: [{ t: 5, v: 270 }, { t: 5, v: 0 }] }); mob(s, 17, g + 1, 35, 'spectral_knight', { Rotation: [{ t: 5, v: 270 }, { t: 5, v: 0 }] }); mob(s, 17, g + 1, 42, 'magi_knight', { Rotation: [{ t: 5, v: 270 }, { t: 5, v: 0 }] });
    table(s, 21, 27, g + 1, 36);
    upstairs(s, 27, g, 25, 'south', 6);
    for (let z = 26; z <= 44; z += 3) { s.set(17, g + 7, z, 'red_bed[facing=west,part=foot,occupied=false]'); s.set(16, g + 7, z, 'red_bed[facing=west,part=head,occupied=false]'); }
    s.chest(28, g + 7, 44, 'west', 'glory_castle');
    bridge(s, 31, 33, 33, 35, g + 6);   // barracks to keep, first floor
    for (let y = g + 7; y <= g + 9; y++) for (const z of [34]) { s.set(30, y, z, y < g + 9 ? 'air' : TRIM); s.set(KX0, y, z, y < g + 9 ? 'air' : TRIM); }

    // ---- the garrison (east): the mecha guards' hall, the turret on its roof; bridged to the keep
    hall(s, 68, 24, 84, 46, g, 2, 6, { roof: 'crenel' });
    doorway(s, 68, g, 33, 1, 3, 'z');
    for (const z of [30, 40]) { for (let y = g + 1; y <= g + 5; y++) { s.set(81, y, z - 2, 'spirecraft:automaton_alloy_block'); s.set(81, y, z + 2, 'spirecraft:automaton_alloy_block'); } for (let zz = z - 2; zz <= z + 2; zz++) s.set(81, g + 5, zz, 'spirecraft:polished_automaton_alloy'); }
    mob(s, 79, g + 1, 30, 'living_shield'); mob(s, 79, g + 1, 40, 'living_shield');
    mob(s, 76, g + 13, 35, 'turret_operator');
    for (let x = 71; x <= 77; x++) s.set(x, g + 1, 45, x % 2 ? 'barrel[facing=up,open=false]' : 'anvil[facing=east]');
    s.chest(70, g + 1, 25, 'south', 'glory_castle');
    upstairs(s, 82, g, 26, 'south', 6); upstairs(s, 70, g + 6, 26, 'south', 6);
    bridge(s, 65, 33, 67, 35, g + 6);
    for (let y = g + 7; y <= g + 8; y++) { s.set(68, y, 34, 'air'); s.set(KX1, y, 34, 'air'); }

    // ---- the frog yard and the beetle stalls (south-west): two Frog Knights, a Rhino Beetle in its stall
    hall(s, 14, 62, 32, 78, g, 1, 6, { roof: 'gable', axis: 'x' });
    for (let x = 16; x <= 30; x += 4) { for (let z = 63; z <= 67; z++) s.set(x, g + 1, z, 'dark_oak_fence'); s.set(x + 2, g + 1, 67, 'dark_oak_fence_gate[facing=south,in_wall=false,open=false,powered=false]'); }
    for (let x = 15; x <= 31; x++) if (s.get(x, g + 1, 67) === 'air') s.set(x, g + 1, 67, 'dark_oak_fence');
    for (let x = 17; x <= 29; x += 4) s.set(x, g + 1, 64, 'hay_block[axis=y]');
    mob(s, 18, g + 1, 65, 'rhino_beetle');
    doorway(s, 22, g, 78, 3, 3, 'x');
    mob(s, 24, g + 1, 72, 'frog_knight'); mob(s, 28, g + 1, 58, 'frog_knight');

    // ---- the statue hall (south-east): the Sculptor's gallery of crow figures, two Devoted Sculptors at work
    hall(s, 66, 62, 84, 78, g, 1, 8, { roof: 'gable', axis: 'x' });
    doorway(s, 74, g, 62, 3, 4, 'x');
    for (const [x, z, f] of [[69, 65, 'south'], [73, 65, 'south'], [77, 65, 'south'], [81, 65, 'south'], [69, 75, 'north'], [73, 75, 'north'], [81, 75, 'north']]) crowStatue(s, x, g + 1, z, f);
    for (let y = g + 1; y <= g + 4; y++) for (const [x, z] of [[76, 74], [78, 74], [76, 76], [78, 76]]) s.set(x, y, z, 'scaffolding[bottom=false,distance=0,waterlogged=false]');
    s.set(77, g + 1, 75, 'stone'); s.set(77, g + 2, 75, 'stone'); s.set(77, g + 3, 75, 'polished_andesite');
    s.set(70, g + 1, 70, 'stonecutter[facing=east]'); s.set(70, g + 1, 71, 'grindstone[face=floor,facing=east]');
    mob(s, 74, g + 1, 70, 'devoted_sculptor'); mob(s, 79, g + 1, 71, 'devoted_sculptor');

    // ---- the prison (north, between the keep and the wall): a cell block, the dungeon under it
    hall(s, 36, 10, 62, 22, g, 1, 6, { roof: 'crenel' });
    doorway(s, 48, g, 22, 3, 3, 'x');
    for (let x = 38; x <= 60; x += 4) { for (let z = 11; z <= 15; z++) s.set(x, g + 1, z, 'iron_bars'), s.set(x, g + 2, z, 'iron_bars'); }
    for (let x = 38; x <= 60; x++) if (x % 4 !== 0) { s.set(x, g + 1, 15, 'iron_bars'); s.set(x, g + 2, 15, 'iron_bars'); }
    for (let x = 38; x <= 60; x += 4) s.set(x + 2, g + 1, 15, 'iron_door[facing=south,half=lower,hinge=left,open=false,powered=false]'), s.set(x + 2, g + 2, 15, 'iron_door[facing=south,half=upper,hinge=left,open=false,powered=false]');
    for (const x of [39, 47, 55]) { s.set(x, g + 1, 11, 'cobweb'); s.set(x + 1, g, 12, 'slime_block'); }
    // the big cell at the east end: the Slimed Berserker in a slime-soaked pen
    for (let x = 53; x <= 61; x++) for (let z = 11; z <= 14; z++) s.set(x, g, z, H(x, 3, z) < 0.5 ? 'slime_block' : 'mud');
    mob(s, 57, g + 1, 12, 'slimed_berserker');
    // the dungeon: stairs down from the cell block to a corridor of cells under the courtyard
    stairRun(s, 40, g - 3, 20, 'north', 4, 'cobbled_deepslate_stairs', null);
    for (let z = 17; z <= 21; z++) for (const x of [40, 41]) s.set(x, g, z, 'air');
    for (let x = 36; x <= 62; x++) for (let z = 14; z <= 18; z++) { s.set(x, 0, z, 'cobbled_deepslate'); for (let y = 1; y <= 3; y++) s.set(x, y, z, z === 14 || z === 18 || x === 36 || x === 62 ? DS(x, y, z) : 'air'); s.set(x, 4, z, 'deepslate_tiles'); }
    for (let x = 38; x <= 60; x += 3) { for (let y = 1; y <= 3; y++) { s.set(x, y, 18, 'iron_bars'); } }
    for (let x = 37; x <= 61; x += 6) for (let y = 1; y <= 3; y++) for (let z = 19; z <= 21; z++) s.set(x, y, z, y === 3 && z === 21 ? 'cobweb' : 'air');
    for (const x of [44, 52]) hangLantern(s, x, 3, 16, true);
    s.chest(61, 1, 15, 'west', 'castle_cells');
    mob(s, 50, 1, 16, 'slimed_berserker');

    // ---- joints: covered passages from the keep to the prison and from the gatehouse round the yard
    bridge(s, 47, 23, 51, 25, g + 6);
    for (let y = g + 7; y <= g + 8; y++) for (const x of [48, 49, 50]) { s.set(x, y, KZ0, 'air'); s.set(x, y, 22, 'air'); }
    // the cloister walks that join the buildings round the courtyard
    arcade(s, 19, 47, 23, 61, g, [[21, 46], [21, 62]]);          // barracks - frog yard
    arcade(s, 74, 47, 78, 61, g, [[76, 46], [76, 62]]);          // garrison - statue hall
    arcade(s, 33, 76, 45, 81, g, [[32, 78], [45, 82]]);          // frog yard - gatehouse
    arcade(s, 53, 76, 65, 81, g, [[66, 78], [53, 82]]);          // gatehouse - statue hall
    arcade(s, 31, 37, 33, 41, g, [[30, 39], [34, 39]]);          // barracks - keep
    arcade(s, 65, 37, 67, 41, g, [[64, 39], [68, 39]]);          // keep - garrison
    arcade(s, 47, 23, 51, 25, g, [[49, 22], [49, 26]]);          // prison - keep (under the bridge)
    // weathering: a little snow on the wall-walks and roofs
    s.forEach((x, y, z, st) => { if (y > g + 1 && (st === TRIM || st === ROOF) && s.get(x, y + 1, z) === 'air' && H(x, y, z) < 0.12) s.set(x, y + 1, z, 'snow[layers=1]'); });
    return s.save('queens_castle/1');
  }

  // =========================================================================================== the Knights' castle
  function knightsCastle(seed) {
    const r = rng(seed), W = 63, D = 63, Hh = 40, s = new Struct(W, Hh, D), g = 0;
    for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { s.set(x, 0, z, r.chance(0.75) ? 'grass_block[snowy=false]' : r.pick(['coarse_dirt', 'gravel', 'stone'])); for (let y = 1; y < Hh; y++) s.set(x, y, z, 'air'); }
    // the curtain: a rounded square, 11 high, walkable
    const P = [[8, 6], [54, 6], [58, 12], [58, 52], [52, 58], [10, 58], [4, 52], [4, 12]];
    const segDist = (px, pz, ax, az, bx, bz) => { const vx = bx - ax, vz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / (vx * vx + vz * vz))); return Math.hypot(px - ax - vx * t, pz - az - vz * t); };
    const inside = (x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, zi] = P[i], [xj, zj] = P[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
    const wallH = 11;
    for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
      let d = 1e9;
      for (let i = 0; i < P.length; i++) { const [ax, az] = P[i], [bx, bz] = P[(i + 1) % P.length]; d = Math.min(d, segDist(x, z, ax, az, bx, bz)); }
      if (inside(x, z) && d > 1.55) s.set(x, 0, z, H(x, 0, z) < 0.5 ? 'cobbled_deepslate' : H(x, 1, z) < 0.5 ? 'gravel' : 'grass_block[snowy=false]');
      if (d > 1.55) continue;
      const inn = inside(x, z);
      for (let y = 1; y <= wallH; y++) s.set(x, y, z, DS(x, y, z));
      s.set(x, wallH, z, inn || d < 0.6 ? TRIM : DS(x, wallH, z));
      if (!inn && d > 0.55 && (x + z) % 2 === 0) s.set(x, wallH + 1, z, DS(x, 99, z));
    }
    [[6, 8], [56, 8], [56, 55], [6, 55]].forEach(([x, z], i) => {
      roundTower(s, x, z, 4, 0, wallH + 6, { mat: DS, floor: FLOOR, floors: [6, wallH], slits: 4, top: i % 2 ? 'crenel' : 'cone', roof: ROOF, roofTip: 'lightning_rod[facing=up,powered=false]', ladder: true, ladderAt: [0, 1] });
      for (const [ux, uz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let k = 2; k <= 5; k++) for (let y = wallH + 1; y <= wallH + 2; y++) { const xx = x + ux * k, zz = z + uz * k; if (Math.hypot(xx - x, zz - z) > 2.5 && s.get(xx, y - 1, zz) && s.get(xx, y - 1, zz) !== 'air') s.set(xx, y, zz, 'air'); }
      const cx = 31 - x, cz = 31 - z, l = Math.hypot(cx, cz);
      for (let k = 3; k <= 5; k++) for (let y = 1; y <= 2; y++) s.set(Math.round(x + cx / l * k), y, Math.round(z + cz / l * k), 'air');
    });
    // the gatehouse (south)
    hall(s, 24, 52, 38, 62, 0, 2, 7, { roof: 'crenel' });
    for (let x = 29; x <= 33; x++) for (let z = 52; z <= 62; z++) { for (let y = 1; y <= 5; y++) s.set(x, y, z, 'air'); s.set(x, 0, z, 'polished_deepslate'); }
    for (let x = 29; x <= 33; x++) for (let y = 3; y <= 5; y++) s.set(x, y, 58, 'iron_bars');
    for (const tx of [23, 39]) roundTower(s, tx, 60, 3, 0, 19, { mat: DS, floor: FLOOR, floors: [7, 14], slits: 4, top: 'cone', roof: ROOF, roofTip: 'lightning_rod[facing=up,powered=false]', ladder: true, ladderAt: [0, -1], door: [0, -1] });
    for (const x of [27, 35]) banner(s, x, 5, 63, 'black', 'south');
    mob(s, 30, 1, 54, 'living_shield'); mob(s, 32, 1, 54, 'living_shield');
    // the keep and the knights' hall (north): two storeys, a stepped gable; alcoves on the north wall
    hall(s, 16, 12, 46, 28, 0, 2, 7, { roof: 'gable', axis: 'x' });
    for (let x = 29; x <= 33; x++) for (let y = 1; y <= 4; y++) s.set(x, y, 28, 'air');
    doorway(s, 29, 0, 28, 5, 4, 'x', 'deepslate_brick_stairs');
    for (const [x, c] of [[22, 'black'], [31, 'cyan'], [40, 'brown']]) { for (let y = 1; y <= 5; y++) { s.set(x - 2, y, 13, TRIM); s.set(x + 2, y, 13, TRIM); } for (let xx = x - 1; xx <= x + 1; xx++) s.set(xx, 6, 13, TRIM); banner(s, x, 4, 13, c, 'south'); }
    mob(s, 22, 1, 15, 'flail_knight'); mob(s, 31, 1, 15, 'spectral_knight'); mob(s, 40, 1, 15, 'magi_knight');
    table(s, 24, 38, 1, 21);
    for (const [x, z] of [[18, 26], [44, 26], [18, 15], [44, 15]]) brazier(s, x, 1, z);
    for (const x of [24, 31, 38]) chandelier(s, x, 6, 21);
    upstairs(s, 18, 0, 17, 'east', 7);
    for (let x = 20; x <= 44; x += 4) { s.set(x, 8, 14, 'white_bed[facing=north,part=head,occupied=false]'); s.set(x, 8, 15, 'white_bed[facing=north,part=foot,occupied=false]'); }
    s.chest(45, 8, 27, 'west', 'glory_castle');
    bartizan(s, 16, 12, 15); bartizan(s, 46, 12, 15);
    // the chapel tower (north-west): a tall round tower behind the hall, cone roof, a bell
    roundTower(s, 12, 20, 4, 0, 24, { mat: DS, floor: FLOOR, floors: [8, 16], slits: 4, top: 'cone', roof: ROOF, roofTip: 'lightning_rod[facing=up,powered=false]', ladder: true, ladderAt: [-1, 0] });
    for (let y = 1; y <= 2; y++) for (let x = 15; x <= 16; x++) s.set(x, y, 20, 'air');
    s.set(12, 22, 20, 'bell[attachment=ceiling,facing=north,powered=false]');
    // the barracks (west) and the armoury with its forge (east), the stable (south-west), the training ground
    hall(s, 8, 32, 20, 48, 0, 1, 6, { roof: 'gable', axis: 'z' });
    doorway(s, 20, 0, 39, 1, 3, 'z');
    for (let z = 34; z <= 46; z += 3) { s.set(10, 1, z, 'red_bed[facing=west,part=head,occupied=false]'); s.set(11, 1, z, 'red_bed[facing=west,part=foot,occupied=false]'); }
    s.chest(18, 1, 33, 'south', 'glory_castle');
    hall(s, 42, 32, 54, 48, 0, 1, 6, { roof: 'gable', axis: 'z' });
    doorway(s, 42, 0, 39, 1, 3, 'z');
    for (let z = 34; z <= 46; z += 4) { s.set(52, 1, z, 'smithing_table'); s.set(52, 1, z + 1, 'anvil[facing=north]'); s.set(52, 1, z + 2, 'blast_furnace[facing=west,lit=true]'); }
    for (const z of [35, 41]) s.entity(46, 1, z, { id: 'minecraft:armor_stand', Rotation: [{ t: 5, v: 90 }, { t: 5, v: 0 }], equipment: { feet: { id: 'minecraft:iron_boots', count: 1 }, legs: { id: 'minecraft:chainmail_leggings', count: 1 }, chest: { id: 'minecraft:iron_chestplate', count: 1 }, head: { id: 'minecraft:iron_helmet', count: 1 } } });
    mob(s, 47, 1, 44, 'turret_operator');
    // the training ground in the courtyard: dummies and targets, a sand ring
    for (let x = 25; x <= 37; x++) for (let z = 36; z <= 46; z++) if (Math.hypot(x - 31, z - 41) <= 5.5) s.set(x, 0, z, 'sand');
    for (const [x, z] of [[27, 38], [35, 38], [31, 44]]) { s.set(x, 1, z, 'dark_oak_fence'); s.set(x, 2, z, 'hay_block[axis=y]'); s.set(x, 3, z, 'carved_pumpkin[facing=south]'); }
    for (const [x, z] of [[24, 34], [38, 34]]) { s.set(x, 1, z, 'dark_oak_fence'); s.set(x, 2, z, 'target[power=0]'); }
    // bridges from the hall to the barracks and armoury at the first floor, over the yard
    arcade(s, 15, 29, 19, 31, 0, [[17, 28], [17, 32]]);   // the hall to the barracks and the armoury, under cover
    arcade(s, 43, 29, 47, 31, 0, [[45, 28], [45, 32]]);
    arcade(s, 24, 48, 28, 51, 0, [[26, 47], [26, 52]]);   // ... and the courtyard to the gatehouse
    hall(s, 42, 52, 52, 56, 0, 1, 5, { roof: 'gable', axis: 'x', windows: false });
    s.chest(51, 1, 53, 'west', 'glory_castle');
    return s.save('knights_keep/1');
  }

  const castle = [queensCastle(1)], keep = [knightsCastle(1)];
  special('queens_castle', 'spirecraft:cave_template', ['minecraft:snowy_plains', 'minecraft:snowy_taiga', 'minecraft:grove'],
    72, 28, { templates: castle, mode: 'open_ground', sink: 6, terrain_adaptation: 'beard_box', step: 'top_layer_modification' });
  special('knights_keep', 'spirecraft:cave_template', ['minecraft:windswept_hills', 'minecraft:windswept_forest', 'minecraft:windswept_gravelly_hills', 'minecraft:meadow'],
    52, 18, { templates: keep, mode: 'open_ground', sink: 1, terrain_adaptation: 'beard_box', step: 'top_layer_modification' });
  return { castle, keep };
};
