// Glory v2 (2026-11-26): the brass works and the Globe Heads' electromagnetic laboratory, rebuilt after the user's notes:
// "the workshop roof can have cross beams; there is only one straight production line now - add more detail and
// decoration; small rooms beside the workshop (offices, stores); a wall round the whole works that hugs the shape of
// the buildings, not a rectangle"; "make the Globe Head's laboratory domed rooms, more glass, more electromagnetic
// things". Shared language of the brass works: stone-brick plinth, a timber frame (stripped spruce posts, dark oak
// beams) with polished andesite infill and big windows, waxed weathered-copper roofs, brass (automaton alloy) for door
// frames, pipes, gear walls and lamps. Convention as in build.js: y = 0 is the ground layer.
const K = require('./glory_kit');
const { box, walls, mob, perimeter, dome, hangLantern } = K;

module.exports = function works({ Struct, rng, loot, special }) {
  const A = 'spirecraft:automaton_alloy_block', PA = 'spirecraft:polished_automaton_alloy', TA = 'spirecraft:tarnished_automaton_alloy_block';
  const POST = 'stripped_spruce_log[axis=y]', BX = 'dark_oak_log[axis=x]', BZ = 'dark_oak_log[axis=z]', BY = 'dark_oak_log[axis=y]';
  const INFILL = 'polished_andesite', PLINTH = 'stone_bricks', FLOOR = ['polished_andesite', 'smooth_stone', 'polished_andesite', 'stone_bricks'];
  const CU = 'waxed_weathered_cut_copper', CU_ST = f => `waxed_weathered_cut_copper_stairs[facing=${f},half=bottom,shape=straight]`, CU_SLAB = 'waxed_weathered_cut_copper_slab[type=bottom]';
  const BULB = 'waxed_copper_bulb[lit=true,powered=false]', GRATE = 'waxed_copper_grate';
  const H = (x, y, z) => { let v = (x * 374761393 + y * 668265263 + z * 2246822519) ^ 0x5bd1e995; v = Math.imul(v ^ (v >>> 13), 1274126177); return ((v ^ (v >>> 16)) >>> 0) / 4294967296; };

  loot('brass_works', [
    { rolls: [4, 7], items: [['spirecraft:automaton_alloy_ingot', 12, 1, 4], ['copper_ingot', 12, 2, 8], ['iron_ingot', 8, 1, 4], ['redstone', 10, 2, 8], ['spirecraft:scrap', 8, 1, 4], ['iron_nugget', 6, 3, 9], ['gunpowder', 4, 1, 3], ['spirecraft:relic_fragment', 3]] },
    { rolls: 1, items: [['empty', 60], ['spirecraft:rocket_punch', 8], ['spirecraft:tesla_coil', 8], ['spirecraft:flak_cannon', 8], ['spirecraft:lightning_rod', 8], ['spirecraft:energy_core', 3]] },
  ]);
  loot('brass_works_office', [
    { rolls: [2, 5], items: [['paper', 10, 2, 6], ['book', 6, 1, 2], ['map', 3], ['emerald', 5, 1, 3], ['gold_ingot', 3, 1, 2], ['clock', 2], ['compass', 2], ['spirecraft:relic_fragment', 2]] },
  ]);
  loot('bastion_magazine', [
    { rolls: [3, 6], items: [['arrow', 14, 6, 16], ['spectral_arrow', 4, 2, 6], ['gunpowder', 8, 2, 6], ['iron_nugget', 8, 3, 9], ['crossbow', 2], ['spirecraft:flak_shell', 5, 2, 6], ['copper_ingot', 5, 1, 4]] },
  ]);
  loot('em_laboratory', [
    { rolls: [4, 7], items: [['copper_ingot', 12, 2, 8], ['redstone', 12, 2, 8], ['amethyst_shard', 6, 1, 4], ['glowstone_dust', 6, 1, 4], ['lightning_rod', 4, 1, 2], ['glass_bottle', 5, 1, 3], ['spirecraft:relic_fragment', 3], ['spirecraft:automaton_alloy_ingot', 5, 1, 3]] },
    { rolls: 1, items: [['empty', 55], ['spirecraft:tesla_coil', 12], ['spirecraft:lightning_rod', 12], ['spirecraft:energy_core', 4], ['potion', 8, 1, 1, { potion: 'spirecraft:strength' }]] },
  ]);

  const ground = (s, r, W, D, Hh, top = () => (r.chance(0.7) ? 'grass_block[snowy=false]' : r.pick(['coarse_dirt', 'dirt_path', 'gravel']))) => {
    for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { s.set(x, 0, z, top(x, z)); for (let y = 1; y < Hh; y++) s.set(x, y, z, 'air'); }
  };

  /**
   * A brass-works hall: plinth (y 1-2), timber frame above (posts every 4, a beam at the top), andesite infill with
   * windows; a copper gable roof (ridge along x) and, inside, a roof truss at every post line - tie beam, king post,
   * two raking struts - with a copper pipe and lamps along the purlin. Records its footprint in `foot`.
   */
  function hall(s, x0, z0, x1, z1, top, foot, opts = {}) {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      s.set(x, 0, z, FLOOR[(x + z * 3) % FLOOR.length]);
      foot.add(x + ',' + z);
      const wall = x === x0 || x === x1 || z === z0 || z === z1;
      for (let y = 1; y <= top; y++) {
        if (!wall) { s.set(x, y, z, 'air'); continue; }
        const along = x === x0 || x === x1 ? z - z0 : x - x0, len = x === x0 || x === x1 ? z1 - z0 : x1 - x0;
        const post = along % 4 === 0 || along === len;
        const win = !post && y >= 3 && y <= top - 2 && opts.windows !== false;
        s.set(x, y, z, y <= 2 ? PLINTH : y === top ? (x === x0 || x === x1 ? BZ : BX) : post ? POST : win ? 'glass_pane' : INFILL);
      }
    }
    const half = Math.ceil((z1 - z0 + 3) / 2);
    for (let k = 0; k < half; k++) {
      const y = top + 1 + k, za = z0 - 1 + k, zb = z1 + 1 - k;
      for (let x = x0 - 1; x <= x1 + 1; x++) {
        if (za < zb) { s.set(x, y, za, CU_ST('south')); s.set(x, y, zb, CU_ST('north')); }
        else s.set(x, y, za, CU_SLAB);
        if (za + 1 < zb - 1) { s.set(x, y, za + 1, CU); s.set(x, y, zb - 1, CU); }
        for (let z = za + 2; z <= zb - 2; z++) if (x > x0 && x < x1) s.set(x, y, z, 'air');
      }
      for (let z = za + 1; z <= zb - 1; z++) for (const x of [x0, x1]) s.set(x, y, z, (z - z0) % 4 === 0 ? POST : INFILL);
      // skylights: copper grates in the roof slope every 8 along x
      for (let x = x0 + 2; x < x1; x += 8) if (k >= 1 && k < half - 1) { s.set(x, y, za + 1, GRATE); s.set(x + 1, y, za + 1, GRATE); }
    }
    // the trusses
    const zm = Math.round((z0 + z1) / 2), ridge = top + half - 1;
    for (let x = x0 + 4; x < x1; x += 4) {
      for (let z = z0 + 1; z < z1; z++) s.set(x, top, z, BZ);
      for (let y = top + 1; y < ridge; y++) s.set(x, y, zm, BY);
      for (let k = 1; k < half - 2; k++) { s.set(x, top + k, z0 + 1 + k, `dark_oak_stairs[facing=north,half=top,shape=straight]`); s.set(x, top + k, z1 - 1 - k, `dark_oak_stairs[facing=south,half=top,shape=straight]`); }
      s.set(x, top - 1, zm, 'iron_chain[axis=y]'); s.set(x, top - 2, zm, BULB);
    }
    // a purlin pipe along the ridge line and a steam pipe along each side wall
    for (let x = x0 + 1; x < x1; x++) { s.set(x, ridge - 1, zm, x % 4 === 0 ? PA : 'lightning_rod[facing=east,powered=false]'); s.set(x, top - 1, z0 + 1, x % 6 === 0 ? PA : 'lightning_rod[facing=east,powered=false]'); }
    for (const x of [x0, x1]) { const zc = Math.round((z0 + z1) / 2); s.set(x, top + 3, zc, 'glass_pane'); s.set(x, top + 3, zc - 1, PA); s.set(x, top + 3, zc + 1, PA); s.set(x, top + 4, zc, PA); s.set(x, top + 2, zc, PA); }
  }
  /** A lean-to annex against a hall wall (side 'north' / 'south' / 'east' / 'west'): one room, a shed roof of copper. */
  function annex(s, x0, z0, x1, z1, h, side, foot) {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      foot.add(x + ',' + z);
      s.set(x, 0, z, 'spruce_planks');
      const wall = x === x0 || x === x1 || z === z0 || z === z1;
      for (let y = 1; y <= h; y++) s.set(x, y, z, !wall ? 'air' : y <= 1 ? PLINTH : ((x === x0 || x === x1) && (z === z0 || z === z1)) ? POST : y === h ? (x === x0 || x === x1 ? BZ : BX) : y === 3 && (x + z) % 3 === 1 ? 'glass_pane' : INFILL);
      // the shed roof falls away from the hall
      const t = side === 'north' ? z1 - z : side === 'south' ? z - z0 : side === 'west' ? x1 - x : x - x0, span = side === 'north' || side === 'south' ? z1 - z0 : x1 - x0;
      void t; void span;
      s.set(x, h + 1, z, CU_SLAB);
    }
  }
  /** A door w wide in a wall (axis 'x': the wall runs along x), h high, with a brass frame. */
  function door(s, x, z, w, h, axis) {
    for (let i = 0; i < w; i++) for (let y = 1; y <= h; y++) s.set(axis === 'x' ? x + i : x, y, axis === 'x' ? z : z + i, 'air');
    for (let i = -1; i <= w; i++) s.set(axis === 'x' ? x + i : x, h + 1, axis === 'x' ? z : z + i, PA);
    for (let y = 1; y <= h; y++) for (const i of [-1, w]) s.set(axis === 'x' ? x + i : x, y, axis === 'x' ? z : z + i, A);
  }
  /** A conveyor along x from x0 to x1 at z (raised bed, arrow-marked magenta glazed terracotta belt, rails of slabs). */
  function belt(s, x0, x1, z, dir = 'east') {
    const step = x1 >= x0 ? 1 : -1;
    for (let x = x0; x !== x1 + step; x += step) {
      s.set(x, 1, z, `magenta_glazed_terracotta[facing=${dir === 'east' ? 'west' : 'east'}]`);
      s.set(x, 1, z - 1, x % 4 ? 'smooth_stone_slab[type=top]' : PA); s.set(x, 1, z + 1, x % 4 ? 'smooth_stone_slab[type=top]' : PA);
      s.set(x, 2, z - 1, 'iron_bars'); s.set(x, 2, z + 1, x % 2 ? 'air' : 'air');
    }
  }
  /** A conveyor along z. */
  function beltZ(s, z0, z1, x, dir = 'south') {
    const step = z1 >= z0 ? 1 : -1;
    for (let z = z0; z !== z1 + step; z += step) {
      s.set(x, 1, z, `magenta_glazed_terracotta[facing=${dir === 'south' ? 'north' : 'south'}]`);
      s.set(x - 1, 1, z, z % 4 ? 'smooth_stone_slab[type=top]' : PA); s.set(x + 1, 1, z, z % 4 ? 'smooth_stone_slab[type=top]' : PA);
    }
  }
  /** A robot arm reaching over a belt from the side (sz: the side it stands on). */
  function arm(s, x, z, sz) {
    s.set(x, 1, z, 'piston[facing=up,extended=false]').set(x, 2, z, 'polished_blackstone_wall').set(x, 3, z, PA);
    s.set(x, 3, z - sz, `lightning_rod[facing=${sz > 0 ? 'north' : 'south'},powered=false]`);
    s.set(x, 3, z - 2 * sz, 'grindstone[face=ceiling,facing=east]');
  }
  /** A press over the belt: a frame of posts, a sticky piston pointing down, an anvil pad. */
  function press(s, x, z) {
    for (const dz of [-2, 2]) for (let y = 1; y <= 4; y++) s.set(x, y, z + dz, y === 4 ? PA : A);
    for (let dz = -2; dz <= 2; dz++) s.set(x, 5, z + dz, PA);
    s.set(x, 4, z, 'sticky_piston[facing=down,extended=false]'); s.set(x, 3, z, 'iron_block');
  }
  /** An inspection gate over the belt: an observer looking down, a lamp, a target, a lever. */
  function inspect(s, x, z) {
    for (const dz of [-2, 2]) for (let y = 1; y <= 3; y++) s.set(x, y, z + dz, y === 3 ? PA : 'polished_blackstone_wall');
    for (let dz = -1; dz <= 1; dz++) s.set(x, 3, z + dz, PA);
    s.set(x, 2, z, 'observer[facing=up,powered=false]'.replace('up', 'down')); s.set(x, 4, z, 'redstone_lamp[lit=true]'); s.set(x, 4, z - 2, 'target[power=0]');
  }
  /** A wall round the works that hugs the buildings: stone bricks with brass-capped posts and copper lamps. */
  function worksWall(s, W, D, foot, dist, gates) {
    const mask = (x, z) => foot.has(x + ',' + z);
    perimeter(s, W, D, mask, dist, 3, {
      mat: (x, y, z) => (H(x, 0, z) < 0.12 ? 'cracked_stone_bricks' : H(x, 1, z) < 0.15 ? 'mossy_stone_bricks' : 'stone_bricks'),
      cap: (x, z) => ((x * 7 + z * 3) % 9 === 0 ? BULB : 'stone_brick_slab[type=bottom]'),
    }, (x, z) => gates.some(([gx, gz, rr]) => Math.hypot(x - gx, z - gz) <= rr));
  }

  // ======================================================================================== the fabrication shop
  function fabrication(seed) {
    const r = rng(seed), W = 64, D = 54, Hh = 30, s = new Struct(W, Hh, D), foot = new Set();
    ground(s, r, W, D, Hh);
    const X0 = 10, X1 = 50, Z0 = 14, Z1 = 36, TOP = 10;
    hall(s, X0, Z0, X1, Z1, TOP, foot);
    door(s, 28, Z1, 4, 5, 'x');                 // the main doors (south)
    door(s, X1, 23, 4, 5, 'z');                 // the loading doors at the end of the lines (east)
    // two production lines, a cross line between them (the branching assembly), feeders at their heads
    belt(s, 14, 46, 20); belt(s, 14, 40, 30); beltZ(s, 21, 29, 40);
    for (const z of [19, 20, 21, 29, 30, 31]) s.set(13, 1, z, 'dispenser[facing=east,triggered=false]'), s.set(13, 2, z, PA);
    for (const [x, sz] of [[17, 1], [21, -1], [25, 1], [33, -1]]) arm(s, x, 20 + sz * 3, sz);
    for (const [x, sz] of [[18, -1], [24, 1], [30, -1]]) arm(s, x, 30 + sz * 3, sz);
    press(s, 29, 20); press(s, 36, 30); inspect(s, 43, 20); inspect(s, 22, 30);
    // the gantry crane over the lines, half-built bots hanging on chains
    for (const x of [16, 34]) { for (let y = 1; y <= 8; y++) { s.set(x, y, 16, y < 8 ? POST : BZ); s.set(x, y, 34, y < 8 ? POST : BZ); } for (let z = 16; z <= 34; z++) s.set(x, 8, z, PA); }
    for (let x = 16; x <= 34; x++) s.set(x, 8, 25, BX);
    for (const [x, st] of [[20, A], [25, 'copper_block'], [30, TA]]) { for (let y = 5; y <= 7; y++) s.set(x, y, 25, 'iron_chain[axis=y]'); s.set(x, 4, 25, st); }
    // the exit: a brass arch where the lines end, the bots' cradles (spawners), a warning lamp
    for (let y = 1; y <= 6; y++) for (const z of [17, 33]) s.set(47, y, z, A);
    for (let z = 17; z <= 33; z++) s.set(47, 7, z, PA);
    s.set(47, 6, 25, BULB);
    s.spawner(48, 1, 21, 'spirecraft:stabbot').spawner(48, 1, 27, 'spirecraft:zapbot').spawner(45, 1, 33, 'spirecraft:guardbot');
    // the Fabricator's bench and the parts bins along the south wall, a Globe Head technician
    s.set(24, 1, 34, 'smithing_table').set(25, 1, 34, 'anvil[facing=east]').set(26, 1, 34, 'crafter[crafting=false,orientation=north_up,triggered=false]').set(27, 1, 34, 'grindstone[face=floor,facing=east]');
    for (const x of [12, 13, 14, 33, 34, 35, 36]) { s.set(x, 1, 35, 'barrel[facing=up,open=false]'); if (H(x, 2, 35) < 0.5) s.set(x, 2, 35, 'barrel[facing=up,open=false]'); }
    s.chest(15, 1, 35, 'north', 'brass_works');
    for (const [x, z] of [[44, 35], [45, 35], [44, 34]]) s.set(x, 1, z, 'spirecraft:junk_block');
    mob(s, 25, 1, 32, 'fabricator'); mob(s, 38, 1, 24, 'globe_head');
    // gear walls: brass and copper discs on the east gable
    for (const [y, z] of [[4, 18], [5, 31], [7, 26]]) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) s.set(X1, y + dy, z + dz, dy === 0 && dz === 0 ? 'copper_block' : (dy === 0 || dz === 0) ? PA : A);
    // the annexes: the foreman's office and the drawing room (north), the parts store (west), the lockers (south-east)
    annex(s, 12, 6, 24, 13, 5, 'north', foot); door(s, 17, Z0, 2, 3, 'x'); door(s, 17, 13, 2, 3, 'x');
    s.set(14, 1, 8, 'lectern[facing=south,has_book=false,powered=false]').set(16, 1, 7, 'cartography_table').set(18, 1, 7, 'spruce_stairs[facing=north,half=bottom,shape=straight]').set(19, 1, 7, 'spruce_slab[type=top]').set(20, 1, 7, 'spruce_slab[type=top]');
    for (let x = 13; x <= 23; x++) if (x % 3 === 0) s.set(x, 3, 7, 'bookshelf');
    s.chest(22, 1, 7, 'south', 'brass_works_office'); for (let x = 13; x <= 23; x++) for (let z = 8; z <= 11; z++) if (s.get(x, 1, z) === 'air') s.set(x, 1, z, 'brown_carpet');
    for (let x = 13; x <= 23; x++) for (let z = 8; z <= 11; z++) if (s.get(x, 1, z) === 'brown_carpet' && (x === 14 || x === 16) && z === 8) s.set(x, 1, z, 'air');
    s.set(18, 4, 10, 'lantern[hanging=true,waterlogged=false]');
    annex(s, 28, 6, 40, 13, 5, 'north', foot); door(s, 33, Z0, 2, 3, 'x'); door(s, 33, 13, 2, 3, 'x');
    for (let x = 29; x <= 39; x++) { s.set(x, 1, 7, 'barrel[facing=south,open=false]'); s.set(x, 2, 7, x % 2 ? 'barrel[facing=south,open=false]' : 'air'); s.set(x, 1, 12, x % 3 ? 'chest[facing=north]' : 'barrel[facing=up,open=false]'); }
    for (let x = 29; x <= 39; x++) if (s.get(x, 1, 12) === 'chest[facing=north]') s.set(x, 1, 12, 'barrel[facing=up,open=false]');
    s.chest(34, 1, 12, 'north', 'brass_works');
    annex(s, 2, 18, 9, 32, 5, 'west', foot); door(s, X0, 24, 2, 3, 'z'); door(s, 2, 24, 2, 3, 'z');
    for (let z = 19; z <= 31; z += 2) { s.set(3, 1, z, 'blast_furnace[facing=east,lit=true]'); s.set(3, 2, z, 'furnace[facing=east,lit=false]'); }
    for (let z = 19; z <= 31; z++) s.set(8, 1, z, z % 4 ? 'smooth_stone_slab[type=top]' : 'cauldron');
    // the chimney stack at the west end
    for (let y = 1; y <= TOP + 14; y++) for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) s.set(4 + dx, y, 33 + dz, y > TOP + 12 ? PA : 'bricks');
    for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) s.set(4 + dx, TOP + 15, 33 + dz, 'campfire[lit=true,facing=north,signal_fire=true,waterlogged=false]');
    foot.add('4,33'); foot.add('5,34');
    annex(s, 42, 37, 50, 43, 4, 'south', foot); door(s, 45, Z1, 2, 3, 'x');
    for (const x of [43, 45, 47, 49]) s.entity(x, 1, 41, { id: 'minecraft:armor_stand', equipment: { chest: { id: 'minecraft:leather_chestplate', count: 1 }, head: { id: 'minecraft:copper_helmet', count: 1 } } });
    // the yard and the wall round it all
    for (let x = 26; x <= 33; x++) for (let z = Z1 + 1; z < D; z++) s.set(x, 0, z, H(x, 0, z) < 0.5 ? 'dirt_path' : 'gravel');
    for (let x = X1 + 1; x < W; x++) for (let z = 22; z <= 28; z++) s.set(x, 0, z, 'gravel');
    for (const [x, z] of [[54, 18], [56, 21], [55, 31]]) s.set(x, 1, z, 'spruce_fence').set(x, 2, z, 'target[power=0]');
    worksWall(s, W, D, foot, 4, [[29.5, Z1 + 4, 3.2], [X1 + 4, 25, 3.2]]);
    return s.save('brass_works/fabrication_' + seed);
  }

  // ======================================================================================== the turret bastion
  function turretBastion(seed) {
    // a round stone bastion (radius 15) with its gun tower under a copper dome; a workshop shed against the curtain for
    // the turrets, the ammunition store and the crew room; the Living Shields at the gate and the tower door
    const r = rng(seed), n = 37, c = 18, Hh = 26, s = new Struct(n, Hh, n);
    ground(s, r, n, n, Hh);
    for (let x = 0; x < n; x++) for (let z = 0; z < n; z++) {
      const d = Math.hypot(x - c, z - c);
      if (d > 16.4) continue;
      s.set(x, 0, z, d > 14.6 ? 'stone_bricks' : H(x, 0, z) < 0.6 ? 'gravel' : r.pick(['cobblestone', 'stone_bricks', 'andesite']));
      if (d > 14.6) {
        const gate = z > c && Math.abs(x - c) <= 1;
        const slit = Math.round(Math.atan2(z - c, x - c) * 8) % 3 === 0;
        for (let y = 1; y <= 5; y++) s.set(x, y, z, gate && y <= 3 ? 'air' : y === 3 && slit && !gate ? 'iron_bars' : H(x, y, z) < 0.12 ? 'cracked_stone_bricks' : 'stone_bricks');
        s.set(x, 6, z, gate ? PA : (x + z) % 2 ? 'stone_brick_wall' : 'air');
      }
    }
    for (const x of [c - 2, c + 2]) for (let y = 1; y <= 6; y++) s.set(x, y, c + 15, y === 6 ? PA : A);
    // the tower and the dome
    for (let x = c - 7; x <= c + 7; x++) for (let z = c - 7; z <= c + 7; z++) {
      const d = Math.hypot(x - c, z - c);
      if (d > 6.4) continue;
      s.set(x, 0, z, 'polished_andesite');
      for (let y = 1; y <= 11; y++) s.set(x, y, z, d > 5.4 ? (y === 5 || y === 11 ? PA : 'stone_bricks') : y === 11 ? 'spruce_planks' : 'air');
    }
    dome(s, c, 12, c, 6, (x, y, z, up, a) => (y === 18 ? 'waxed_weathered_copper' : Math.abs(Math.sin(a * 4)) < 0.2 ? PA : (y % 2 ? CU : 'waxed_weathered_copper')));
    for (let y = 1; y <= 3; y++) s.set(c, y, c + 6, 'air'); s.set(c, 4, c + 6, PA);
    for (let y = 1; y <= 11; y++) s.set(c + 4, y, c - 3, y === 11 ? 'air' : 'ladder[facing=west,waterlogged=false]');
    for (let x = c - 3; x <= c + 3; x++) for (let y = 12; y <= 14; y++) for (let z = c + 2; z <= c + 7; z++) if (Math.hypot(x - c, z - c, y - 11) > 4.8) s.set(x, y, z, 'air');
    s.set(c - 2, 12, c + 3, 'iron_bars').set(c + 2, 12, c + 3, 'iron_bars');
    mob(s, c, 12, c + 1, 'turret_operator');
    for (const [x, z] of [[c - 3, c - 1], [c - 3, c], [c - 3, c + 1], [c + 3, c + 1]]) s.set(x, 1, z, 'barrel[facing=up,open=false]');
    s.chest(c - 3, 1, c - 2, 'east', 'bastion_magazine');
    s.set(c, 10, c, 'lantern[hanging=true,waterlogged=false]');
    // the workshop shed along the west curtain: the turret bench, spare barrels, a gun under repair
    for (let x = 4; x <= 11; x++) for (let z = 10; z <= 26; z++) {
      if (Math.hypot(x - c, z - c) > 14.4) continue;
      const wall = x === 4 || x === 11 || z === 10 || z === 26;
      s.set(x, 0, z, 'spruce_planks');
      for (let y = 1; y <= 4; y++) s.set(x, y, z, !wall ? 'air' : y === 4 ? BX : (z - 10) % 4 === 0 ? POST : y === 2 && x === 11 ? 'glass_pane' : 'spruce_planks');
      s.set(x, 5, z, CU_SLAB);
    }
    for (let z = 16; z <= 18; z++) for (let y = 1; y <= 3; y++) s.set(11, y, z, 'air');
    for (let z = 11; z <= 15; z++) s.set(5, 1, z, z % 2 ? 'smithing_table' : 'crafter[crafting=false,orientation=north_up,triggered=false]');
    for (let z = 20; z <= 25; z++) s.set(5, 1, z, 'barrel[facing=east,open=false]');
    s.barrel(5, 2, 22, 'east', 'bastion_magazine');
    for (let i = 0; i < 4; i++) s.set(8 + (i % 2), 1, 13 + i, 'lightning_rod[facing=east,powered=false]');
    s.set(8, 1, 19, A).set(8, 2, 19, 'grindstone[face=floor,facing=north]');
    // the crew room against the east curtain: bunks and a table
    for (let x = 25; x <= 31; x++) for (let z = 12; z <= 22; z++) {
      if (Math.hypot(x - c, z - c) > 14.4) continue;
      const wall = x === 25 || x === 31 || z === 12 || z === 22;
      s.set(x, 0, z, 'spruce_planks');
      for (let y = 1; y <= 4; y++) s.set(x, y, z, !wall ? 'air' : y === 4 ? BX : (z - 12) % 5 === 0 ? POST : y === 2 && x === 25 ? 'glass_pane' : INFILL);
      s.set(x, 5, z, CU_SLAB);
    }
    for (let y = 1; y <= 3; y++) s.set(25, y, 17, 'air');
    for (const z of [13, 16, 19]) { s.set(29, 1, z, 'red_bed[facing=east,part=head,occupied=false]'); s.set(28, 1, z, 'red_bed[facing=east,part=foot,occupied=false]'); }
    s.set(27, 1, 21, 'spruce_slab[type=top]'); s.set(26, 1, 21, 'spruce_stairs[facing=east,half=bottom,shape=straight]');
    // targets in the yard, lamps on the wall
    for (const [x, z] of [[24, 27], [27, 25], [14, 29]]) s.set(x, 1, z, 'spruce_fence').set(x, 2, z, 'target[power=0]');
    mob(s, c - 1, 1, c + 13, 'living_shield'); mob(s, c + 1, 1, c + 13, 'living_shield'); mob(s, c + 1, 1, c + 8, 'living_shield');
    mob(s, 8, 1, 21, 'globe_head');
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 + 0.2, x = Math.round(c + Math.cos(a) * 14), z = Math.round(c + Math.sin(a) * 14); if (s.get(x, 1, z) === 'air' && !(z > c + 10 && Math.abs(x - c) < 4)) s.set(x, 1, z, 'spruce_fence').set(x, 2, z, BULB); }
    return s.save('brass_works/turret_bastion_' + seed);
  }

  // ======================================================================================== the mecha hangar
  function mechaHangar(seed) {
    // the workshop (a gantry over a half-built mech, the assembly benches, parts racks, a test line for limbs) and,
    // through a heavy door in its east wall, the fight room where the Mecha Knight stands switched off on its rack;
    // the office and the parts store against the north wall, the paint shop on the west; a wall that hugs all of it
    const r = rng(seed), W = 66, D = 48, Hh = 28, s = new Struct(W, Hh, D), foot = new Set();
    ground(s, r, W, D, Hh);
    hall(s, 10, 12, 32, 34, 10, foot);
    door(s, 19, 34, 4, 5, 'x');
    for (const z of [17, 29]) { for (let y = 1; y <= 8; y++) { s.set(14, y, z, y === 8 ? BX : POST); s.set(28, y, z, y === 8 ? BX : POST); } for (let x = 14; x <= 28; x++) s.set(x, 8, z, PA); }
    for (let z = 17; z <= 29; z++) s.set(21, 9, z, BZ);
    for (let y = 6; y <= 8; y++) s.set(21, y, 23, 'iron_chain[axis=y]');
    box(s, 20, 3, 22, 22, 5, 24, (x, y, z) => (y === 5 ? PA : x === 21 && z === 22 ? 'glass' : A));
    for (const x of [20, 22]) { s.set(x, 2, 23, 'iron_bars'); s.set(x, 1, 23, 'iron_bars'); }
    s.set(19, 4, 23, 'iron_bars').set(23, 4, 23, 'iron_bars');
    // a test line for limbs along the south side, inspection at its end
    belt(s, 13, 29, 31); press(s, 18, 31); inspect(s, 25, 31);
    for (let x = 12; x <= 16; x++) s.set(x, 1, 14, x % 2 ? 'smithing_table' : 'anvil[facing=east]');
    for (const z of [14, 15, 16]) { s.set(11, 1, z, 'barrel[facing=east,open=false]'); s.set(11, 2, z, z === 15 ? 'barrel[facing=east,open=false]' : 'air'); }
    s.chest(11, 1, 19, 'east', 'brass_works');
    s.set(30, 1, 14, 'spirecraft:junk_block').set(30, 1, 15, TA).set(29, 1, 14, 'copper_block');
    mob(s, 16, 1, 25, 'globe_head');
    // the fight room
    const RX0 = 33, RX1 = 53, RZ0 = 13, RZ1 = 33, RT = 11;
    for (let x = RX0; x <= RX1; x++) for (let z = RZ0; z <= RZ1; z++) {
      foot.add(x + ',' + z);
      const wall = x === RX0 || x === RX1 || z === RZ0 || z === RZ1;
      s.set(x, 0, z, H(x, 0, z) < 0.15 ? 'blackstone' : H(x, 1, z) < 0.08 ? 'coal_block' : 'polished_andesite');
      for (let y = 1; y < RT; y++) s.set(x, y, z, !wall ? 'air' : y === 4 || y === RT - 1 ? PA : (x + z) % 5 === 0 ? 'cracked_stone_bricks' : H(x, y, z) < 0.5 ? 'stone_bricks' : 'polished_andesite');
      s.set(x, RT, z, wall ? PLINTH : (x + z) % 2 ? GRATE : CU);
    }
    for (let x = RX0 + 4; x < RX1; x += 4) for (let z = RZ0 + 1; z < RZ1; z++) s.set(x, RT - 1, z, BZ);
    for (const z of [22, 23, 24]) { s.set(32, 1, z, 'air'); s.set(32, 2, z, 'air'); }
    for (const z of [22, 23]) { s.set(33, 1, z, `iron_door[facing=east,half=lower,hinge=${z === 22 ? 'left' : 'right'},open=false,powered=false]`); s.set(33, 2, z, `iron_door[facing=east,half=upper,hinge=${z === 22 ? 'left' : 'right'},open=false,powered=false]`); }
    s.set(33, 1, 24, PA); s.set(33, 2, 24, PA);
    s.set(31, 2, 21, 'stone_button[face=wall,facing=west,powered=false]').set(34, 2, 24, 'stone_button[face=wall,facing=east,powered=false]');
    for (const z of [19, 27]) for (let y = 1; y <= 8; y++) s.set(51, y, z, y === 8 ? PA : A);
    for (let z = 19; z <= 27; z++) s.set(51, 8, z, PA);
    for (const z of [20, 26]) for (let y = 5; y <= 7; y++) s.set(51, y, z, 'iron_chain[axis=y]');
    s.set(52, 1, 23, 'iron_bars').set(52, 2, 23, 'iron_bars');
    mob(s, 48, 1, 23, 'mecha_knight');
    for (const [x, z] of [[37, 15], [41, 15], [45, 15], [37, 31], [41, 31], [45, 31]]) { s.set(x, 1, z, 'spruce_fence'); s.set(x, 2, z, H(x, 2, z) < 0.5 ? 'target[power=0]' : 'hay_block[axis=y]'); }
    for (const [x, z] of [[34, 16], [34, 30], [52, 14], [52, 32]]) s.set(x, 7, z, BULB);
    // annexes: the office and the parts store (north), the paint shop (west)
    annex(s, 12, 4, 22, 11, 5, 'north', foot); door(s, 16, 12, 2, 3, 'x'); door(s, 16, 11, 2, 3, 'x');
    s.set(14, 1, 6, 'lectern[facing=south,has_book=false,powered=false]').set(16, 1, 5, 'cartography_table').set(19, 1, 5, 'spruce_slab[type=top]').set(20, 1, 5, 'spruce_slab[type=top]');
    s.chest(21, 1, 5, 'south', 'brass_works_office'); s.set(17, 4, 8, 'lantern[hanging=true,waterlogged=false]');
    annex(s, 23, 4, 31, 11, 5, 'north', foot); door(s, 26, 11, 2, 3, 'x'); door(s, 26, 12, 2, 3, 'x');
    for (let x = 24; x <= 30; x++) { s.set(x, 1, 5, 'barrel[facing=south,open=false]'); s.set(x, 2, 5, x % 2 ? 'barrel[facing=south,open=false]' : 'air'); }
    s.chest(30, 1, 10, 'north', 'brass_works');
    annex(s, 3, 16, 9, 30, 5, 'west', foot); door(s, 10, 22, 2, 3, 'z'); door(s, 9, 22, 2, 3, 'z');
    for (let z = 17; z <= 29; z += 3) { s.set(4, 1, z, ['cyan_terracotta', 'orange_terracotta', 'lime_terracotta', 'yellow_terracotta', 'light_blue_terracotta'][(z / 3 | 0) % 5]); s.set(4, 2, z, 'cauldron'); }
    for (let z = 17; z <= 29; z++) if (z % 3) s.set(8, 1, z, 'smooth_stone_slab[type=top]');
    // the wall round it all, the yard south of the doors
    for (let x = 18; x <= 23; x++) for (let z = 35; z < D; z++) s.set(x, 0, z, H(x, 0, z) < 0.5 ? 'dirt_path' : 'gravel');
    worksWall(s, W, D, foot, 4, [[20.5, 38.5, 3.2]]);
    return s.save('brass_works/mecha_hangar_' + seed);
  }

  // ======================================================================================== the electromagnetic laboratory
  function emLaboratory(seed) {
    // three glass domes on the snow joined by glass tube corridors: the great coil dome (a Tesla coil in the middle, a
    // ring of lightning rods and copper bulbs, copper ribs), the battery dome (racks of bulbs and lamps, a lodestone),
    // the bench dome (cauldrons, brewing stands, the chest); copper coils round the corridors
    const r = rng(seed), W = 49, D = 41, Hh = 22, s = new Struct(W, Hh, D);
    ground(s, r, W, D, Hh, () => (r.chance(0.82) ? 'snow_block' : 'gravel'));
    const glassShell = (x, y, z, up, a) => (y <= 1 ? 'polished_andesite' : Math.abs(Math.sin(a * 4)) < 0.16 || (y % 4 === 1) ? 'waxed_copper_block' : H(x, y, z) < 0.3 ? 'light_blue_stained_glass' : 'glass');
    const floorDisc = (cx, cz, rad, st) => s.disc(cx, 0, cz, rad, (x, y, z, d) => (d > rad - 1.2 ? 'polished_andesite' : typeof st === 'function' ? st(x, z, d) : st));
    // the great coil dome
    floorDisc(24, 20, 10, (x, z, d) => (d < 3 ? 'waxed_copper_block' : (Math.round(d) % 3 === 0 ? GRATE : 'smooth_stone')));
    dome(s, 24, 1, 20, 10, glassShell);
    for (let y = 1; y <= 6; y++) s.set(24, y, 20, y === 6 ? 'lightning_rod[facing=up,powered=false]' : 'waxed_copper_block');
    for (let y = 2; y <= 5; y += 1) s.disc(24, y, 20, 1.6, (x, yy, z, d) => (d > 0.5 && y % 2 === 0 ? 'waxed_cut_copper_slab[type=top]' : null));
    s.set(24, 7, 20, 'end_rod[facing=up]');
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, x = Math.round(24 + Math.cos(a) * 6), z = Math.round(20 + Math.sin(a) * 6); s.set(x, 1, z, 'waxed_copper_block'); s.set(x, 2, z, 'lightning_rod[facing=up,powered=false]'); }
    for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * Math.PI * 2, x = Math.round(24 + Math.cos(a) * 8), z = Math.round(20 + Math.sin(a) * 8); s.set(x, 1, z, BULB); }
    for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + 0.4; for (let y = 6; y <= 8; y++) s.set(Math.round(24 + Math.cos(a) * 4), y, Math.round(20 + Math.sin(a) * 4), y === 6 ? 'redstone_lamp[lit=true]' : 'iron_chain[axis=y]'); }
    // the battery dome (west) and the bench dome (east)
    floorDisc(8, 20, 6, 'smooth_stone'); dome(s, 8, 1, 20, 6, glassShell);
    for (const z of [16, 18, 22, 24]) for (let x = 5; x <= 11; x++) if (Math.hypot(x - 8, z - 20) < 4.6) { s.set(x, 1, z, x % 2 ? BULB : 'waxed_copper_block'); s.set(x, 2, z, x % 2 ? 'redstone_lamp[lit=true]' : 'waxed_cut_copper_slab[type=bottom]'); }
    s.set(8, 1, 20, 'lodestone'); s.set(8, 2, 20, 'lightning_rod[facing=up,powered=false]');
    floorDisc(40, 20, 6, 'smooth_stone'); dome(s, 40, 1, 20, 6, glassShell);
    for (const [x, z, st] of [[37, 17, 'cauldron'], [38, 17, 'brewing_stand[has_bottle_0=false,has_bottle_1=false,has_bottle_2=false]'], [42, 17, 'cauldron'], [37, 23, 'cartography_table'], [43, 20, 'lectern[facing=west,has_book=false,powered=false]']]) s.set(x, 1, z, st);
    s.chest(43, 1, 22, 'west', 'em_laboratory'); s.chest(5, 1, 20, 'east', 'em_laboratory');
    // the glass tube corridors, copper coil rings round them
    for (const [xa, xb] of [[13, 15], [33, 35]]) for (let x = xa; x <= xb; x++) for (let z = 18; z <= 22; z++) {
      const side = z === 18 || z === 22;
      s.set(x, 0, z, 'polished_andesite');
      for (let y = 1; y <= 4; y++) s.set(x, y, z, side || y === 4 ? (x % 2 === 0 ? 'waxed_copper_block' : (y === 4 ? 'glass' : 'glass_pane')) : 'air');
    }
    // the entrance porch (south) of the great dome, lamps on posts in the snow
    for (let z = 29; z <= 32; z++) for (let x = 22; x <= 26; x++) { s.set(x, 0, z, 'polished_andesite'); for (let y = 1; y <= 3; y++) s.set(x, y, z, (x === 22 || x === 26) ? (z % 2 ? 'waxed_copper_block' : 'glass_pane') : 'air'); s.set(x, 4, z, 'waxed_cut_copper_slab[type=bottom]'); }
    for (let x = 23; x <= 25; x++) for (let y = 1; y <= 3; y++) s.set(x, y, 30, 'air');
    for (const [x, z] of [[18, 34], [30, 34], [4, 30], [44, 30]]) { s.set(x, 1, z, 'waxed_copper_block'); s.set(x, 2, z, 'lightning_rod[facing=up,powered=false]'); s.set(x, 3, z, 'end_rod[facing=up]'); }
    mob(s, 21, 1, 17, 'globe_head'); mob(s, 9, 1, 23, 'globe_head'); mob(s, 39, 1, 21, 'globe_head');
    for (let i = 0; i < 50; i++) { const x = r.int(0, W - 1), z = r.int(0, D - 1); if (s.get(x, 1, z) === 'air' && s.get(x, 0, z) === 'snow_block') s.set(x, 1, z, 'snow[layers=1]'); }
    return s.save('em_laboratory/' + seed);
  }

  const brassTemplates = [fabrication(1), turretBastion(1), mechaHangar(1)];
  special('brass_works', 'spirecraft:cave_template', ['minecraft:plains', 'minecraft:sunflower_plains', 'minecraft:meadow', 'minecraft:forest', 'minecraft:birch_forest', 'minecraft:taiga'],
    48, 16, { templates: brassTemplates, mode: 'open_ground', sink: 1, terrain_adaptation: 'beard_box', step: 'top_layer_modification' });
  const labTemplates = [emLaboratory(1)];
  special('em_laboratory', 'spirecraft:cave_template', ['minecraft:snowy_plains', 'minecraft:ice_spikes', 'minecraft:snowy_taiga'],
    48, 16, { templates: labTemplates, mode: 'open_ground', sink: 1, terrain_adaptation: 'beard_box', step: 'top_layer_modification' });
  return { brassTemplates, labTemplates };
};
