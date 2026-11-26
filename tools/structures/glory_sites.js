// Glory v2 (2026-11-26) - the smaller overworld sites and the Owl Court, after the user's notes:
//  * the Devoted Sculptor's place is a group of statues of its own kind - some finished, some not - with scaffolding
//    for the big ones and stone-working blocks;
//  * the Lost / Forgotten rooms: a round hall ringed by tall, big pillars holding the roof up, four small rooms round it,
//    each with collections and treasure; one of the pair in the middle of the hall; the surface one and the buried one
//    the same rooms and contents, the surface one more ruined;
//  * the Slimed Berserker: a jail on the surface (not underground);
//  * the frog outpost is gone: a beetle training ground instead - small single-storey houses on flat ground, a little
//    training field, the beetle stable (one beetle to a stall, one or two beetles, the rest empty), a room with a Frog
//    Trainer;
//  * the Owl Court in the overworld: a big complex whose main building holds a round courtroom.
// Convention as in build.js: y = 0 is the ground layer.
const K = require('./glory_kit');
const { box, walls, mob, roundTower, coneRoof, dome, gable, stairRun, doorway, perimeter, hangLantern, wallTorch, banner } = K;

module.exports = function sites({ Struct, rng, loot, special }) {
  const H = (x, y, z) => { let v = (x * 374761393 + y * 668265263 + z * 2246822519) ^ 0x5bd1e995; v = Math.imul(v ^ (v >>> 13), 1274126177); return ((v ^ (v >>> 16)) >>> 0) / 4294967296; };
  const ground = (s, W, D, Hh, top) => { for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { s.set(x, 0, z, top(x, z)); for (let y = 1; y < Hh; y++) s.set(x, y, z, 'air'); } };
  const aged = (x, y, z, base, p = 0.25) => { const h = H(x, y, z); return base === 'stone_bricks' ? (h < p * 0.5 ? 'cracked_stone_bricks' : h < p ? 'mossy_stone_bricks' : base) : base; };

  loot('statuary', [
    { rolls: [4, 7], items: [['clay_ball', 10, 2, 8], ['terracotta', 8, 2, 6], ['feather', 8, 2, 5], ['gold_nugget', 6, 2, 8], ['candle', 5, 1, 3], ['flint', 5, 1, 3], ['iron_pickaxe', 2], ['spirecraft:relic_fragment', 3]] },
  ]);
  loot('forgotten_ruins', [
    { rolls: [3, 6], items: [['bone', 10, 2, 6], ['candle', 6, 1, 3], ['gold_nugget', 8, 2, 8], ['amethyst_shard', 5, 1, 3], ['spirecraft:relic_fragment', 5], ['book', 4]] },
  ]);
  loot('forgotten_treasury', [
    { rolls: [3, 6], items: [['gold_ingot', 8, 1, 3], ['emerald', 6, 1, 3], ['diamond', 2, 1, 1], ['golden_apple', 2], ['spirecraft:relic_fragment', 6, 1, 2], ['music_disc_13', 1]] },
  ]);
  loot('slime_jail', [
    { rolls: [3, 6], items: [['slime_ball', 10, 2, 6], ['iron_nugget', 8, 2, 6], ['bread', 6, 1, 3], ['bone', 6, 1, 3], ['emerald', 4, 1, 2], ['spirecraft:relic_fragment', 3]] },
    { rolls: 1, items: [['empty', 60], ['potion', 10, 1, 1, { potion: 'spirecraft:strength' }], ['potion', 10, 1, 1, { potion: 'spirecraft:dexterity' }], ['golden_apple', 4]] },
  ]);
  loot('beetle_grounds', [
    { rolls: [3, 6], items: [['melon_slice', 10, 2, 8], ['sweet_berries', 8, 2, 6], ['apple', 6, 1, 3], ['wheat', 6, 2, 6], ['lead', 4], ['saddle', 2], ['slime_ball', 5, 1, 3], ['iron_nugget', 5, 2, 5]] },
  ]);
  loot('owl_court', [
    { rolls: [4, 7], items: [['paper', 12, 3, 9], ['book', 8, 1, 3], ['writable_book', 3], ['feather', 8, 2, 5], ['ink_sac', 6, 1, 3], ['gold_nugget', 6, 2, 8], ['emerald', 4, 1, 3], ['ender_pearl', 3, 1, 2], ['spirecraft:relic_fragment', 4]] },
    { rolls: 1, items: [['empty', 55], ['enchanted_book', 10, 1, 1, { enchant: true }], ['clock', 6], ['spyglass', 6], ['golden_apple', 4]] },
  ]);

  // ======================================================================================== the statuary
  /**
   * A statue of the Sculptor's own kind - a crow cultist: a long robe widening to the ground, round hunched shoulders,
   * a hooded head with a long beaked mask and dark eye holes, hands folded in front, a wooden idol strapped to the back.
   * size = height in blocks; facing; done = 0..1: everything above that fraction of the height is still a rough block.
   */
  function crowStatue(s, cx, cz, size, facing, done, mats = {}) {
    const robe = mats.robe || 'polished_andesite', mask = mats.mask || 'calcite', rough = mats.rough || 'stone', idol = mats.idol || 'stripped_birch_wood';
    const f = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] }[facing];
    const R = Math.ceil(size * 0.45) + 1;
    const plinth = Math.max(1, Math.round(size / 8));
    for (let x = cx - R; x <= cx + R; x++) for (let z = cz - R; z <= cz + R; z++) for (let y = 1; y <= size + plinth + 1; y++) {
      const dx = x - cx, dz = z - cz;
      const u = (dx * f[0] + dz * f[1]) / size, v = (dx * f[1] - dz * f[0]) / size, hh = (y - plinth - 0.5) / size;   // forward, sideways, up
      if (y <= plinth) { if (Math.abs(dx) <= Math.round(size * 0.3) && Math.abs(dz) <= Math.round(size * 0.3)) s.set(x, y, z, y === plinth ? 'chiseled_stone_bricks' : 'stone_bricks'); continue; }
      let st = null;
      const halfW = 0.27 - 0.07 * Math.min(1, hh / 0.6);
      if (hh >= 0 && hh < 0.62 && Math.abs(v) <= halfW && u > -0.22 && u < 0.2) st = robe;                                   // the robe
      if (hh >= 0.55 && hh < 0.74 && Math.abs(v) <= 0.3 && u > -0.25 && u < 0.14) st = robe;                                  // round shoulders
      if (hh >= 0.4 && hh < 0.5 && Math.abs(v) <= 0.12 && u >= 0.15 && u < 0.26) st = robe;                                    // the folded hands
      if (hh >= 0.72 && hh < 0.95 && Math.hypot(u - 0.02, v, (hh - 0.83) * 1.2) <= 0.15) st = mask;                           // the head
      if (hh >= 0.8 && hh < 1.0 && Math.hypot(u + 0.04, v, (hh - 0.86) * 1.1) <= 0.17 && u < 0.04) st = robe;                 // the hood
      if (hh >= 0.76 && hh < 0.84 && Math.abs(v) <= 0.045 + 0.02 * (u < 0.24) && u >= 0.12 && u < 0.4 - (0.8 - hh) * 0.6) st = mask;   // the beak
      if (hh >= 0.36 && hh < 0.86 && Math.abs(v) <= 0.13 && u <= -0.22 && u > -0.36) st = idol;                               // the idol on the back
      if (st === mask && hh >= 0.84 && hh < 0.9 && Math.abs(Math.abs(v) - 0.07) < 0.04 && u > 0.1) st = 'black_concrete';      // eye holes
      if (!st) continue;
      if (hh > done) st = Math.abs(v) <= 0.33 && u > -0.38 && u < 0.42 ? (H(x, y, z) < 0.3 ? 'cobblestone' : rough) : null;   // not carved yet: the rough block
      if (st) s.set(x, y, z, st);
    }
    // the uncarved block above the finished part keeps its square shape: fill the hull
    if (done < 1) for (let x = cx - R; x <= cx + R; x++) for (let z = cz - R; z <= cz + R; z++) for (let y = plinth + 1; y <= size + plinth; y++) {
      const dx = x - cx, dz = z - cz, u = (dx * f[0] + dz * f[1]) / size, v = (dx * f[1] - dz * f[0]) / size, hh = (y - plinth - 0.5) / size;
      if (hh > done && hh < 0.97 && Math.abs(v) <= 0.3 && u > -0.36 && u < 0.36 && (!s.get(x, y, z) || s.get(x, y, z) === 'air')) s.set(x, y, z, H(x, y, z) < 0.25 ? 'cobblestone' : rough);
    }
    return { R, top: size + plinth };
  }
  function statuary(seed) {
    const r = rng(seed), W = 49, D = 45, Hh = 30, s = new Struct(W, Hh, D);
    ground(s, W, D, Hh, (x, z) => (H(x, 0, z) < 0.55 ? 'red_sand' : H(x, 1, z) < 0.5 ? 'terracotta' : 'coarse_dirt'));
    // the work floor: packed earth and cut stone round the big statues
    for (let x = 6; x < 44; x++) for (let z = 6; z < 40; z++) if (H(x, 2, z) < 0.6) s.set(x, 0, z, H(x, 3, z) < 0.5 ? 'packed_mud' : 'smooth_stone');
    // the statues: a finished giant, a half-done giant in scaffolding, a rough block just started, a row of finished
    // small ones (a little shrine with candles), one fallen over
    crowStatue(s, 14, 14, 18, 'south', 1.0);
    const big = crowStatue(s, 32, 13, 16, 'south', 0.45);
    for (let y = 1; y <= big.top + 1; y++) for (let x = 32 - big.R - 1; x <= 32 + big.R + 1; x++) for (const z of [13 - big.R - 1, 13 + big.R + 1]) if ((x + y) % 1 === 0 && (x === 32 - big.R - 1 || x === 32 + big.R + 1 || y % 4 === 0)) s.set(x, y, z, 'scaffolding[bottom=false,distance=0,waterlogged=false]');
    for (let y = 1; y <= big.top + 1; y++) for (let z = 13 - big.R - 1; z <= 13 + big.R + 1; z++) for (const x of [32 - big.R - 1, 32 + big.R + 1]) if (z === 13 - big.R - 1 || z === 13 + big.R + 1 || y % 4 === 0) s.set(x, y, z, 'scaffolding[bottom=false,distance=0,waterlogged=false]');
    for (let y = 1; y <= big.top; y++) s.set(32, y, 13 + big.R + 2, 'ladder[facing=south,waterlogged=false]');
    crowStatue(s, 38, 30, 10, 'west', 0.0);
    for (const [x, z] of [[8, 32], [12, 34], [16, 35]]) crowStatue(s, x, z, 6, 'north', 1.0, { robe: 'polished_diorite', mask: 'calcite' });
    for (const [x, z] of [[9, 29], [13, 31], [17, 32]]) s.set(x, 1, z, 'candle[candles=3,lit=true,waterlogged=false]');
    crowStatue(s, 24, 32, 7, 'east', 0.75, { robe: 'andesite' });
    // a fallen statue: its head and beak in the sand
    for (let x = 22; x <= 27; x++) for (let y = 1; y <= 2; y++) s.set(x, y, 40, 'polished_andesite');
    s.set(28, 1, 40, 'calcite'); s.set(28, 2, 40, 'calcite'); s.set(29, 1, 40, 'calcite'); s.set(30, 1, 40, 'diorite_wall');
    // the workshop: a canvas awning on posts over the benches, piles of stone, a cart of blocks
    for (let x = 18; x <= 28; x++) for (let z = 22; z <= 27; z++) {
      if ((x === 18 || x === 28) && (z === 22 || z === 27)) for (let y = 1; y <= 4; y++) s.set(x, y, z, 'spruce_fence');
      s.set(x, 5, z, (x + z) % 2 ? 'white_carpet' : 'light_gray_carpet');
    }
    for (let x = 18; x <= 28; x++) for (let z = 22; z <= 27; z++) s.set(x, 4, z, (x === 18 || x === 28) && (z === 22 || z === 27) ? 'spruce_fence' : 'spruce_slab[type=top]');
    for (let x = 19; x <= 27; x++) for (let z = 23; z <= 26; z++) s.set(x, 5, z, 'white_wool');
    s.set(19, 1, 23, 'stonecutter[facing=east]').set(20, 1, 23, 'grindstone[face=floor,facing=east]').set(21, 1, 23, 'smithing_table').set(22, 1, 23, 'anvil[facing=east]').set(23, 1, 23, 'crafting_table');
    s.set(26, 1, 26, 'barrel[facing=up,open=false]').set(27, 1, 26, 'barrel[facing=up,open=false]').set(27, 2, 26, 'barrel[facing=up,open=false]');
    s.chest(25, 1, 26, 'north', 'statuary');
    for (const [x, z, n] of [[4, 20, 3], [6, 24, 2], [42, 20, 3]]) for (let i = 0; i < n * 3; i++) { const xx = x + (i % 3), zz = z + Math.floor(i / 3) % 3; s.set(xx, 1 + Math.floor(i / 9), zz, H(xx, i, zz) < 0.5 ? 'cobblestone' : 'andesite'); }
    for (let x = 40; x <= 43; x++) s.set(x, 1, 38, 'rail[shape=east_west,waterlogged=false]');
    s.set(41, 1, 37, 'stone'); s.set(42, 1, 37, 'cobblestone');
    mob(s, 22, 1, 25, 'devoted_sculptor'); mob(s, 30, 1, 20, 'devoted_sculptor'); mob(s, 11, 1, 22, 'devoted_sculptor');
    return s.save('statuary/' + seed);
  }

  // ======================================================================================== the Lost / Forgotten rotunda
  /**
   * The round hall (radius 12) ringed by 12 big square pillars (2×2, up to the cornice), a stepped dome with an oculus;
   * four rooms off it to the north, east, south and west - the armoury of relics, the library, the treasury, the hall of
   * masks - each through an arched doorway. One of the Lost / the Forgotten floats over the dais in the middle.
   * ruined: the surface one (half the dome down, pillars broken off, moss and vines, grass on the floor).
   */
  function rotunda(s, c, y0, ruined, who, rr) {
    const RAD = 12, PIL = 8.5, TOP = y0 + 11;
    const st = (x, y, z) => { const b = H(x, y, z) < 0.15 ? 'cracked_stone_bricks' : H(x, y, z) < (ruined ? 0.45 : 0.2) ? 'mossy_stone_bricks' : 'stone_bricks'; return b; };
    // floor, the outer wall, the cornice
    for (let x = c - RAD - 1; x <= c + RAD + 1; x++) for (let z = c - RAD - 1; z <= c + RAD + 1; z++) {
      const d = Math.hypot(x - c, z - c);
      if (d > RAD + 0.4) continue;
      s.set(x, y0, z, d < 2.5 ? 'chiseled_stone_bricks' : Math.round(d) % 4 === 0 ? 'polished_andesite' : (ruined && H(x, 9, z) < 0.25 ? 'moss_block' : 'stone_bricks'));
      for (let y = y0 + 1; y <= TOP; y++) s.set(x, y, z, d > RAD - 0.6 ? (y === TOP || y === y0 + 1 ? 'polished_andesite' : st(x, y, z)) : 'air');
    }
    // the pillars: 2×2, a base and a capital, holding the dome ring
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * Math.PI * 2, px = Math.round(c + Math.cos(a) * PIL - 0.5), pz = Math.round(c + Math.sin(a) * PIL - 0.5);
      const broken = ruined ? TOP - Math.floor(H(k, 1, 1) * 9) : TOP;
      for (let y = y0 + 1; y <= broken; y++) for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) s.set(px + dx, y, pz + dz, y === y0 + 1 || y === TOP ? 'chiseled_stone_bricks' : y === TOP - 1 ? 'polished_andesite' : 'stone_bricks');
      if (ruined && broken < TOP) for (let i = 0; i < 3; i++) s.set(px + Math.round(Math.cos(a + 1.6) * (2 + i)), y0 + 1, pz + Math.round(Math.sin(a + 1.6) * (2 + i)), H(k, i, 3) < 0.5 ? 'cobblestone' : 'stone_brick_slab[type=bottom]');
    }
    // the dome: stepped rings closing to an oculus
    for (let k = 0; k <= 8; k++) {
      const rad = RAD - k * 1.2;
      if (rad < 2.2) break;
      for (let x = c - RAD; x <= c + RAD; x++) for (let z = c - RAD; z <= c + RAD; z++) {
        const d = Math.hypot(x - c, z - c);
        if (d > rad + 0.4 || d < rad - 1.6) continue;
        if (ruined && H(x, k, z) < 0.25 + k * 0.07 && Math.atan2(z - c, x - c) > -0.6) continue;   // a whole side fallen in
        s.set(x, TOP + 1 + k, z, k % 3 === 2 ? 'polished_andesite' : st(x, TOP + k, z));
      }
    }
    // the dais in the middle and the one who keeps the hall
    s.disc(c, y0 + 1, c, 2.2, 'stone_brick_slab[type=bottom]');
    for (const [dx, dz] of [[-3, 0], [3, 0], [0, -3], [0, 3]]) s.set(c + dx, y0 + 1, c + dz, `candle[candles=${1 + (dx + dz + 9) % 4},lit=${ruined ? 'false' : 'true'},waterlogged=false]`);
    mob(s, c, y0 + 2, c, who);
    // the four rooms, 9×9, the doorway on the hall side
    const rooms = [[0, -1, 'armoury'], [1, 0, 'library'], [0, 1, 'treasury'], [-1, 0, 'masks']];
    for (const [ux, uz, kind] of rooms) {
      const rx = c + ux * (RAD + 4), rz = c + uz * (RAD + 4), x0 = rx - 4, x1 = rx + 4, z0 = rz - 4, z1 = rz + 4;
      for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
        const wall = x === x0 || x === x1 || z === z0 || z === z1;
        s.set(x, y0, z, 'polished_andesite');
        for (let y = y0 + 1; y <= y0 + 6; y++) s.set(x, y, z, wall ? st(x, y, z) : 'air');
        s.set(x, y0 + 7, z, ruined && H(x, 7, z) < 0.35 ? 'air' : (wall ? 'stone_brick_slab[type=bottom]' : 'stone_bricks'));
      }
      // the doorway: through the room wall and the hall wall
      for (let k = -1; k <= 1; k++) for (let y = y0 + 1; y <= y0 + 3; y++) for (let t = RAD - 1; t <= RAD + 1; t++) s.set(c + ux * t + uz * k, y, c + uz * t + ux * k, 'air');
      s.set(c + ux * RAD, y0 + 4, c + uz * RAD, 'chiseled_stone_bricks');
      const P = (a, b, y, block) => s.set(rx + a * (uz !== 0 ? 1 : 0) + b * ux, y, rz + a * (ux !== 0 ? 1 : 0) + b * uz, block);
      // a, along the back wall; b, towards the back (b = 3 is against the back wall)
      if (kind === 'armoury') {
        for (const a of [-3, -1, 1, 3]) s.entity(rx + a * (uz !== 0 ? 1 : 0) + 2 * ux, y0 + 1, rz + a * (ux !== 0 ? 1 : 0) + 2 * uz, { id: 'minecraft:armor_stand', equipment: { head: { id: H(a, 1, 1) < 0.5 ? 'minecraft:chainmail_helmet' : 'minecraft:golden_helmet', count: 1 }, chest: { id: 'minecraft:chainmail_chestplate', count: 1 } } });
        for (const a of [-3, 3]) { P(a, 3, y0 + 1, 'barrel[facing=up,open=false]'); P(a, 3, y0 + 2, 'skeleton_skull[rotation=0]'); }
        s.chest(rx + 3 * ux, y0 + 1, rz + 3 * uz, { '0,-1': 'south', '0,1': 'north', '1,0': 'west', '-1,0': 'east' }[ux + ',' + uz], 'forgotten_ruins');
      } else if (kind === 'library') {
        for (let a = -3; a <= 3; a++) for (let y = y0 + 1; y <= y0 + 4; y++) P(a, 3, y, a === 0 && y <= y0 + 2 ? 'air' : (H(a, y, 7) < 0.5 ? 'chiseled_bookshelf[facing=north,slot_0_occupied=true,slot_1_occupied=false,slot_2_occupied=true,slot_3_occupied=false,slot_4_occupied=true,slot_5_occupied=false]'.replace('facing=north', 'facing=' + ({ '0,-1': 'south', '0,1': 'north', '1,0': 'west', '-1,0': 'east' })[ux + ',' + uz]) : 'bookshelf'));
        P(0, 1, y0 + 1, 'lectern[facing=north,has_book=false,powered=false]'.replace('north', ({ '0,-1': 'north', '0,1': 'south', '1,0': 'east', '-1,0': 'west' })[ux + ',' + uz]));
        P(-2, 1, y0 + 1, 'candle[candles=4,lit=' + (ruined ? 'false' : 'true') + ',waterlogged=false]');
        s.chest(rx + 3 * ux, y0 + 1, rz + 3 * uz, { '0,-1': 'south', '0,1': 'north', '1,0': 'west', '-1,0': 'east' }[ux + ',' + uz], 'forgotten_ruins');
      } else if (kind === 'treasury') {
        for (const a of [-3, -2, 2, 3]) P(a, 3, y0 + 1, 'decorated_pot[facing=north,cracked=false,waterlogged=false]');
        P(-1, 3, y0 + 1, 'gold_block'); P(1, 3, y0 + 1, 'raw_gold_block');
        P(0, 2, y0 + 1, 'polished_andesite'); s.chest(rx + 2 * ux, y0 + 2, rz + 2 * uz, { '0,-1': 'south', '0,1': 'north', '1,0': 'west', '-1,0': 'east' }[ux + ',' + uz], 'forgotten_treasury');
        for (const a of [-3, 3]) P(a, 0, y0 + 1, 'candle[candles=2,lit=' + (ruined ? 'false' : 'true') + ',waterlogged=false]');
      } else {
        for (let a = -3; a <= 3; a += 2) { P(a, 3, y0 + 1, 'polished_andesite'); P(a, 3, y0 + 2, H(a, 2, 2) < 0.5 ? 'carved_pumpkin[facing=north]'.replace('north', ({ '0,-1': 'south', '0,1': 'north', '1,0': 'west', '-1,0': 'east' })[ux + ',' + uz]) : 'skeleton_skull[rotation=0]'); }
        for (const a of [-2, 2]) P(a, 1, y0 + 1, 'decorated_pot[facing=north,cracked=true,waterlogged=false]');
        s.barrel(rx + 3 * ux + (uz !== 0 ? 1 : 0) * 2, y0 + 1, rz + 3 * uz + (ux !== 0 ? 1 : 0) * 2, 'up', 'forgotten_ruins');
      }
      hangLantern(s, rx, y0 + 6, rz, true);
    }
    if (ruined) {
      // moss, vines, grass through the floor, cobwebs; the fallen dome in heaps on the floor
      s.forEach((x, y, z, b) => {
        if (y <= y0 || !b || b === 'air') return;
        if (/stone_bricks$/.test(b) && H(x, y, z) < 0.15) s.set(x, y, z, 'mossy_stone_bricks');
      });
      for (let i = 0; i < 70; i++) { const x = rr.int(c - RAD, c + RAD), z = rr.int(c - RAD, c + RAD); if (s.get(x, y0 + 1, z) === 'air' && Math.hypot(x - c, z - c) > 3) s.set(x, y0 + 1, z, rr.pick(['short_grass', 'moss_carpet', 'cobblestone', 'mossy_cobblestone', 'fern'])); }
    } else {
      for (let i = 0; i < 24; i++) { const x = rr.int(c - RAD, c + RAD), z = rr.int(c - RAD, c + RAD), y = y0 + 6 + rr.int(0, 4); if (s.get(x, y, z) === 'air' && Math.hypot(x - c, z - c) < RAD - 1) s.set(x, y, z, 'cobweb'); }
      for (let k = 0; k < 12; k++) { const a = (k + 0.5) / 12 * Math.PI * 2; wallTorch; s.set(Math.round(c + Math.cos(a) * (RAD - 1.5)), y0 + 1, Math.round(c + Math.sin(a) * (RAD - 1.5)), 'candle[candles=2,lit=true,waterlogged=false]'); }
    }
  }
  function forgottenSurface(seed, who) {
    const r = rng(seed), W = 45, D = 45, Hh = 26, s = new Struct(W, Hh, D);
    ground(s, W, D, Hh, (x, z) => (H(x, 0, z) < 0.7 ? 'grass_block[snowy=false]' : H(x, 1, z) < 0.5 ? 'coarse_dirt' : 'mossy_cobblestone'));
    rotunda(s, 22, 0, true, who, r);
    return s.save('forgotten_ruins/surface_' + who.replace('the_', ''));
  }
  function forgottenCrypt(seed, who) {
    const r = rng(seed), W = 43, D = 43, Hh = 22, s = new Struct(W, Hh, D);
    // buried: solid stone round the rooms, the template brings its own air
    for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) for (let y = 0; y < Hh; y++) s.set(x, y, z, H(x, y, z) < 0.15 ? 'andesite' : H(x, y, z) < 0.25 ? 'tuff' : 'stone');
    rotunda(s, 21, 1, false, who, r);
    return s.save('forgotten_ruins/crypt_' + who.replace('the_', ''));
  }

  // ======================================================================================== the slime jail
  function slimeJail(seed) {
    // a squat stone jail on the surface: the cell block (a corridor, four small cells and the big slime pen at the
    // end), the guard room with its table and keys, a watch tower at the corner, a fenced exercise yard; slime and mud
    // seep out of the pen; the Slimed Berserker in it
    const r = rng(seed), W = 37, D = 31, Hh = 22, s = new Struct(W, Hh, D);
    ground(s, W, D, Hh, (x, z) => (H(x, 0, z) < 0.7 ? 'grass_block[snowy=false]' : H(x, 1, z) < 0.5 ? 'mud' : 'coarse_dirt'));
    const X0 = 6, X1 = 30, Z0 = 8, Z1 = 22, T = 6;
    for (let x = X0; x <= X1; x++) for (let z = Z0; z <= Z1; z++) {
      const wall = x === X0 || x === X1 || z === Z0 || z === Z1;
      s.set(x, 0, z, 'stone_bricks');
      for (let y = 1; y <= T; y++) s.set(x, y, z, wall ? (y === 1 ? 'cobblestone' : y === 4 && (x + z) % 4 === 0 ? 'iron_bars' : aged(x, y, z, 'stone_bricks', 0.35)) : 'air');
      s.set(x, T + 1, z, wall ? ((x + z) % 2 ? 'stone_brick_wall' : 'air') : 'spruce_planks');
    }
    // the corridor along z = 15, cells to the north (z 9-13) and south (z 17-21), x 7-20; the pen at the east end x 22-29
    for (let x = X0 + 1; x <= 20; x++) for (const z of [14, 16]) for (let y = 1; y <= 3; y++) s.set(x, y, z, x % 4 === 3 ? 'stone_bricks' : 'iron_bars');
    for (let x = 7; x <= 20; x += 4) for (const z of [9, 10, 11, 12, 13, 17, 18, 19, 20, 21]) for (let y = 1; y <= T; y++) s.set(x, y, z, 'stone_bricks');
    for (const [x, z] of [[9, 14], [13, 16], [17, 14], [9, 16]]) { s.set(x, 1, z, `iron_door[facing=${z === 14 ? 'south' : 'north'},half=lower,hinge=left,open=false,powered=false]`); s.set(x, 2, z, `iron_door[facing=${z === 14 ? 'south' : 'north'},half=upper,hinge=left,open=false,powered=false]`); }
    for (const [x, z] of [[8, 10], [12, 20], [16, 11], [10, 19]]) { s.set(x, 1, z, H(x, 1, z) < 0.5 ? 'cobweb' : 'bone_block[axis=y]'); s.set(x + 1, 0, z + 1, 'slime_block'); }
    for (let x = 21; x <= 21; x++) for (let z = Z0 + 1; z < Z1; z++) for (let y = 1; y <= T; y++) s.set(x, y, z, z === 15 ? (y <= 3 ? 'iron_bars' : 'stone_bricks') : (y <= 4 && z % 2 ? 'iron_bars' : 'stone_bricks'));
    for (let x = 22; x < X1; x++) for (let z = Z0 + 1; z < Z1; z++) s.set(x, 0, z, H(x, 0, z) < 0.45 ? 'slime_block' : H(x, 2, z) < 0.6 ? 'mud' : 'green_terracotta');
    for (let i = 0; i < 10; i++) { const x = r.int(22, X1 - 1), z = r.int(Z0 + 1, Z1 - 1); s.set(x, 1, z, 'slime_block'); }
    for (const z of [10, 20]) for (let y = 3; y <= 5; y++) s.set(X1 - 1, y, z, 'iron_chain[axis=y]');
    mob(s, 26, 1, 15, 'slimed_berserker');
    // the guard room on the west end (x 1-5), the door from the yard
    for (let x = 1; x <= 5; x++) for (let z = 10; z <= 20; z++) {
      const wall = x === 1 || z === 10 || z === 20;
      s.set(x, 0, z, 'spruce_planks');
      for (let y = 1; y <= 5; y++) s.set(x, y, z, wall ? (y === 3 && z % 3 === 0 ? 'glass_pane' : aged(x, y, z, 'stone_bricks')) : 'air');
      s.set(x, 6, z, 'spruce_slab[type=bottom]');
    }
    for (let y = 1; y <= 2; y++) { s.set(X0, y, 15, 'air'); s.set(1, y, 15, 'air'); }
    s.set(3, 1, 12, 'spruce_fence').set(3, 2, 12, 'spruce_pressure_plate[powered=false]').set(2, 1, 12, 'spruce_stairs[facing=east,half=bottom,shape=straight]');
    s.set(4, 3, 19, 'tripwire_hook[attached=false,facing=north,powered=false]'.replace('north', 'north'));
    s.chest(2, 1, 19, 'east', 'slime_jail'); s.set(3, 4, 15, 'lantern[hanging=true,waterlogged=false]');
    // the watch tower over the north-west corner
    for (let x = 4; x <= 8; x++) for (let z = 5; z <= 9; z++) for (let y = 1; y <= 12; y++) { const e = x === 4 || x === 8 || z === 5 || z === 9; if (e) s.set(x, y, z, y === 9 && (x + z) % 2 ? 'air' : aged(x, y, z, 'stone_bricks')); else if (y === 8) s.set(x, y, z, 'spruce_planks'); else s.set(x, y, z, 'air'); }
    for (let x = 3; x <= 9; x++) for (let z = 4; z <= 10; z++) if (x === 3 || x === 9 || z === 4 || z === 10) s.set(x, 12, z, (x + z) % 2 ? 'stone_brick_wall' : 'stone_bricks');
    for (let y = 1; y <= 8; y++) s.set(7, y, 8, 'ladder[facing=north,waterlogged=false]');
    for (let y = 1; y <= 2; y++) s.set(6, y, 9, 'air');
    s.set(6, 9, 7, 'lantern[hanging=false,waterlogged=false]');
    // the exercise yard (south): a fence, a trough, a chopping block
    for (let x = X0; x <= X1; x++) s.set(x, 1, 28, 'spruce_fence');
    for (let z = Z1 + 1; z <= 28; z++) { s.set(X0, 1, z, 'spruce_fence'); s.set(X1, 1, z, 'spruce_fence'); }
    s.set(18, 1, 28, 'spruce_fence_gate[facing=south,in_wall=false,open=false,powered=false]');
    for (let y = 1; y <= 2; y++) s.set(18, y, Z1, 'air');
    s.set(10, 1, 25, 'cauldron'); s.set(11, 1, 25, 'cauldron'); s.set(24, 1, 26, 'oak_log[axis=y]');
    for (const x of [9, 27]) { s.set(x, 1, 7, 'spruce_fence'); s.set(x, 2, 7, 'lantern[hanging=false,waterlogged=false]'); }
    return s.save('slime_jail/' + seed);
  }

  // ======================================================================================== the beetle training grounds
  function beetleGrounds(seed) {
    // flat ground, low single-storey houses of mud brick and spruce: the trainer's house (a Frog Trainer inside), the
    // feed store; the beetle stable - a row of stalls, one beetle to a stall, two beetles, the rest empty and strawed;
    // a fenced training field with hurdles, a sand track, targets and straw dummies, a second trainer out on it
    const r = rng(seed), W = 51, D = 45, Hh = 16, s = new Struct(W, Hh, D);
    ground(s, W, D, Hh, (x, z) => (H(x, 0, z) < 0.75 ? 'grass_block[snowy=false]' : 'coarse_dirt'));
    const house = (x0, z0, x1, z1, doorX, doorZ) => {
      for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
        const wall = x === x0 || x === x1 || z === z0 || z === z1, corner = (x === x0 || x === x1) && (z === z0 || z === z1);
        s.set(x, 0, z, 'packed_mud');
        for (let y = 1; y <= 3; y++) s.set(x, y, z, !wall ? 'air' : corner ? 'stripped_spruce_log[axis=y]' : y === 2 && (x + z) % 3 === 0 ? 'glass_pane' : 'mud_bricks');
        s.set(x, 4, z, wall ? (x === x0 || x === x1 ? 'spruce_log[axis=z]' : 'spruce_log[axis=x]') : 'spruce_planks');
      }
      // a low hipped roof of spruce stairs
      for (let x = x0 - 1; x <= x1 + 1; x++) { s.set(x, 4, z0 - 1, 'spruce_stairs[facing=south,half=bottom,shape=straight]'); s.set(x, 4, z1 + 1, 'spruce_stairs[facing=north,half=bottom,shape=straight]'); }
      for (let z = z0; z <= z1; z++) { s.set(x0 - 1, 4, z, 'spruce_stairs[facing=east,half=bottom,shape=straight]'); s.set(x1 + 1, 4, z, 'spruce_stairs[facing=west,half=bottom,shape=straight]'); }
      for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) s.set(x, 5, z, x === x0 || x === x1 || z === z0 || z === z1 ? 'spruce_slab[type=bottom]' : 'mud_brick_slab[type=bottom]');
      s.set(doorX, 1, doorZ, 'air'); s.set(doorX, 2, doorZ, 'air');
    };
    // the trainer's house
    house(4, 4, 14, 12, 9, 12);
    s.set(5, 1, 5, 'red_bed[facing=north,part=head,occupied=false]').set(5, 1, 6, 'red_bed[facing=north,part=foot,occupied=false]');
    s.set(12, 1, 5, 'crafting_table').set(13, 1, 5, 'barrel[facing=up,open=false]').set(11, 1, 5, 'spruce_slab[type=top]');
    s.chest(13, 1, 7, 'west', 'beetle_grounds'); s.set(9, 3, 8, 'lantern[hanging=true,waterlogged=false]');
    for (const [x, z] of [[6, 9], [7, 10]]) s.set(x, 1, z, 'green_carpet');
    s.entity(11, 1, 10, { id: 'minecraft:armor_stand', equipment: { chest: { id: 'minecraft:iron_chestplate', count: 1 } } });
    mob(s, 8, 1, 7, 'frog_trainer');
    // the feed store
    house(18, 4, 25, 10, 21, 10);
    for (let x = 19; x <= 24; x++) { s.set(x, 1, 5, x % 2 ? 'hay_block[axis=y]' : 'melon'); s.set(x, 2, 5, x % 3 ? 'hay_block[axis=y]' : 'air'); }
    for (const x of [19, 24]) s.set(x, 1, 8, 'composter[level=4]');
    s.barrel(22, 1, 7, 'up', 'beetle_grounds');
    // the beetle stable: a long low shed, open to the south, six stalls divided by fences, a gate on each
    const SX0 = 28, SX1 = 46, SZ0 = 4, SZ1 = 11;
    for (let x = SX0; x <= SX1; x++) for (let z = SZ0; z <= SZ1; z++) {
      const back = z === SZ0, side = x === SX0 || x === SX1;
      s.set(x, 0, z, z === SZ1 ? 'packed_mud' : 'coarse_dirt');
      for (let y = 1; y <= 3; y++) s.set(x, y, z, back || side ? ((x - SX0) % 3 === 0 ? 'stripped_spruce_log[axis=y]' : 'mud_bricks') : 'air');
      s.set(x, 4, z, (x - SX0) % 3 === 0 && z > SZ0 && z < SZ1 ? 'spruce_log[axis=z]' : 'spruce_slab[type=bottom]');
    }
    for (let k = 0; k <= 6; k++) {
      const x = SX0 + k * 3;
      if (k > 0 && k < 6) for (let z = SZ0 + 1; z <= SZ1 - 2; z++) s.set(x, 1, z, 'spruce_fence');
      if (k < 6) { s.set(x + 1, 1, SZ1 - 1, 'spruce_fence_gate[facing=south,in_wall=false,open=false,powered=false]'); s.set(x + 2, 1, SZ1 - 1, 'spruce_fence'); s.set(x + 1, 1, SZ0 + 1, 'hay_block[axis=y]'); s.set(x + 2, 1, SZ0 + 2, 'composter[level=3]'); }
    }
    mob(s, SX0 + 1, 1, SZ0 + 3, 'rhino_beetle'); mob(s, SX0 + 10, 1, SZ0 + 3, 'rhino_beetle');
    for (const x of [SX0 + 1, SX0 + 9, SX0 + 15]) s.set(x, 1, SZ0 + 2, 'melon');
    // the training field: fenced, a sand track round it, hurdles, targets and dummies
    const FX0 = 6, FX1 = 46, FZ0 = 18, FZ1 = 40;
    for (let x = FX0; x <= FX1; x++) for (let z = FZ0; z <= FZ1; z++) {
      const edge = x === FX0 || x === FX1 || z === FZ0 || z === FZ1;
      const inner = x > FX0 + 3 && x < FX1 - 3 && z > FZ0 + 3 && z < FZ1 - 3;
      if (edge) s.set(x, 1, z, 'oak_fence');
      else if (!inner) s.set(x, 0, z, H(x, 0, z) < 0.8 ? 'sand' : 'coarse_dirt');
    }
    for (const x of [16, 26, 36]) for (let z = FZ0 + 1; z <= FZ0 + 3; z++) s.set(x, 1, z, 'oak_fence');   // hurdles on the track
    for (const x of [16, 26, 36]) for (let z = FZ1 - 3; z <= FZ1 - 1; z++) s.set(x, 1, z, 'oak_fence');
    for (const [x, z] of [[14, 26], [20, 32], [30, 27], [38, 33]]) { s.set(x, 1, z, 'oak_fence'); s.set(x, 2, z, 'hay_block[axis=y]'); s.set(x, 3, z, 'carved_pumpkin[facing=south]'); }
    for (const [x, z] of [[24, 30], [33, 24]]) { s.set(x, 1, z, 'oak_fence'); s.set(x, 2, z, 'target[power=0]'); }
    s.set(26, 1, FZ0, 'oak_fence_gate[facing=north,in_wall=false,open=false,powered=false]');
    for (let z = 12; z < FZ0; z++) for (const x of [25, 26, 27]) s.set(x, 0, z, 'dirt_path');
    mob(s, 28, 1, 34, 'frog_trainer');
    for (const [x, z] of [[17, 13], [36, 14]]) { s.set(x, 1, z, 'spruce_fence'); s.set(x, 2, z, 'spruce_fence'); s.set(x, 3, z, 'lantern[hanging=false,waterlogged=false]'); }
    return s.save('beetle_grounds/' + seed);
  }

  // ======================================================================================== the Owl Court
  function owlCourt(seed) {
    // a walled court in the woods. The main building: a square block (41 × 41) round a great rotunda (the courtroom):
    // rings of benches stepping down to the floor, the judges' bench raised at the north with its lecterns, the dock
    // (a cage of bars) and the witness stand; a copper dome with an open oculus for the magistrate's flight; galleries
    // all round. The wings: the archive (west), the clerks' rooms (east), the holding cells (north); a columned portico
    // at the south door; a walled garden court with a fountain in front. Tuff stone, dark oak, oxidized copper.
    const r = rng(seed), W = 79, D = 83, Hh = 44, s = new Struct(W, Hh, D);
    ground(s, W, D, Hh, (x, z) => (H(x, 0, z) < 0.8 ? 'grass_block[snowy=false]' : 'podzol'));
    const TB = (x, y, z) => (H(x, y, z) < 0.18 ? 'polished_tuff' : 'tuff_bricks');
    const c = 39, cz = 34, X0 = c - 20, X1 = c + 20, Z0 = cz - 20, Z1 = cz + 20, T = 14;
    // the block: walls, two floors of rooms round the rotunda
    for (let x = X0; x <= X1; x++) for (let z = Z0; z <= Z1; z++) {
      const wall = x === X0 || x === X1 || z === Z0 || z === Z1;
      s.set(x, 0, z, 'polished_tuff');
      for (let y = 1; y <= T; y++) {
        if (wall) {
          const along = x === X0 || x === X1 ? z - Z0 : x - X0;
          const win = along % 5 === 2 && along > 1 && along < 39 && ((y >= 2 && y <= 4) || (y >= 9 && y <= 11));
          s.set(x, y, z, y === 7 || y === T ? 'chiseled_tuff_bricks' : win ? (y === 4 || y === 11 ? 'tuff_brick_slab[type=top]' : 'glass_pane') : along % 5 === 0 ? 'chiseled_tuff' : TB(x, y, z));
        } else s.set(x, y, z, y === 7 ? 'dark_oak_planks' : 'air');
      }
      s.set(x, T + 1, z, wall ? ((x + z) % 2 ? 'tuff_brick_wall' : 'tuff_bricks') : 'tuff_bricks');
    }
    // the rotunda: a drum of radius 14 inside the block, up to y 22, the dome above with an oculus
    const RR = 14;
    for (let x = c - RR - 1; x <= c + RR + 1; x++) for (let z = cz - RR - 1; z <= cz + RR + 1; z++) {
      const d = Math.hypot(x - c, z - cz);
      if (d > RR + 0.4) continue;
      for (let y = 1; y <= 22; y++) s.set(x, y, z, d > RR - 0.6 ? (y % 7 === 0 ? 'chiseled_tuff_bricks' : (y > T && Math.round(Math.atan2(z - cz, x - c) * 6) % 2 === 0 && y >= 17 && y <= 20) ? 'glass_pane' : TB(x, y, z)) : 'air');
      if (d <= RR - 0.6) s.set(x, 0, z, 'polished_tuff');
    }
    K.dome(s, c, 23, cz, RR, (x, y, z, up, a) => (Math.abs(Math.sin(a * 6)) < 0.18 ? 'oxidized_copper' : 'waxed_oxidized_cut_copper'));
    s.disc(c, 23 + RR, cz, 3.2, 'air'); for (let y = 23 + RR - 3; y <= 23 + RR; y++) s.disc(c, y, cz, 2.6, 'air');
    s.disc(c, 23, cz, RR - 0.6, null); for (let x = c - RR; x <= c + RR; x++) for (let z = cz - RR; z <= cz + RR; z++) if (Math.hypot(x - c, z - cz) < RR - 0.6) s.set(x, 23, z, 'air');
    // the benches: four rings stepping down from the wall to the floor (a pit), cut by the four aisles
    for (let x = c - RR; x <= c + RR; x++) for (let z = cz - RR; z <= cz + RR; z++) {
      const d = Math.hypot(x - c, z - cz);
      if (d > RR - 0.6) continue;
      const aisle = Math.abs(x - c) <= 1 || Math.abs(z - cz) <= 1;
      const ring = Math.floor((d - 6) / 2);   // 0..3
      if (d >= 6 && ring >= 0 && ring <= 3 && !aisle) {
        for (let y = 1; y <= ring; y++) s.set(x, y, z, 'tuff_bricks');
        const facing = Math.abs(x - c) > Math.abs(z - cz) ? (x > c ? 'west' : 'east') : (z > cz ? 'north' : 'south');
        s.set(x, ring + 1, z, (d - 6) % 2 < 1 ? `dark_oak_stairs[facing=${facing},half=bottom,shape=straight]` : 'air');
      } else if (d >= 6 && aisle && ring >= 0) for (let y = 1; y <= Math.max(0, ring); y++) s.set(x, y, z, 'polished_tuff');
      if (d < 6) s.set(x, 0, z, (x + z) % 2 ? 'polished_tuff' : 'chiseled_tuff');
    }
    // the judges' bench (north): a raised platform with lecterns and a high-backed seat, the dock and the witness stand
    for (let x = c - 4; x <= c + 4; x++) for (let z = cz - 13; z <= cz - 9; z++) for (let y = 1; y <= 4; y++) s.set(x, y, z, y === 4 ? 'dark_oak_planks' : 'tuff_bricks');
    for (let x = c - 4; x <= c + 4; x++) s.set(x, 5, cz - 9, x % 2 ? 'dark_oak_fence' : 'lectern[facing=south,has_book=false,powered=false]');
    for (let y = 5; y <= 8; y++) s.set(c, y, cz - 12, y === 5 ? 'dark_oak_stairs[facing=south,half=bottom,shape=straight]' : 'dark_oak_planks');
    for (let z = cz - 8; z <= cz - 6; z++) for (let y = 1; y <= 3; y++) s.set(c - 4, y, z, 'tuff_bricks');
    stairRun(s, c + 4, 1, cz - 5, 'north', 4, 'tuff_brick_stairs', 'tuff_bricks');
    for (let x = c - 2; x <= c + 2; x++) for (let z = cz + 1; z <= cz + 3; z++) { const e = x === c - 2 || x === c + 2 || z === cz + 3; if (e) for (let y = 1; y <= 2; y++) s.set(x, y, z, 'iron_bars'); }
    s.set(c - 4, 1, cz - 1, 'dark_oak_fence'); s.set(c - 4, 2, cz - 1, 'dark_oak_pressure_plate[powered=false]');
    mob(s, c, 5, cz - 11, 'owl_magistrate', { Rotation: [{ t: 5, v: 0 }, { t: 5, v: 0 }] });
    for (const a of [0.8, 2.3, 3.9, 5.4]) { const x = Math.round(c + Math.cos(a) * 12), z = Math.round(cz + Math.sin(a) * 12); s.set(x, 22, z, 'iron_chain[axis=y]'); s.set(x, 21, z, 'iron_chain[axis=y]'); s.set(x, 20, z, 'lantern[hanging=true,waterlogged=false]'); }
    // doors through the drum: south (to the portico), east and west (to the wings), north (to the cells)
    for (const [ux, uz] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) for (let k = -1; k <= 1; k++) for (let y = 1; y <= 4; y++) for (let t = RR - 1; t <= RR + 1; t++) {
      const x = c + ux * t + uz * k, z = cz + uz * t + ux * k;
      if (!(uz === -1 && y < 5)) s.set(x, y + (uz === -1 ? 4 : 0), z, 'air');
    }
    for (let k = -1; k <= 1; k++) for (let y = 1; y <= 4; y++) s.set(c + k, y, Z1, 'air');
    // the corner rooms of the block (between drum and walls): the archive (west), the clerks (east), cells (north)
    for (let x = X0 + 1; x <= X0 + 5; x++) for (let z = Z0 + 2; z <= Z1 - 2; z++) if (Math.hypot(x - c, z - cz) > RR + 1) for (let y = 1; y <= 6; y++) if (x === X0 + 1 && z % 3 !== 0) s.set(x, y, z, y === 6 ? 'air' : 'bookshelf');
    for (let z = Z0 + 3; z <= Z1 - 3; z += 6) s.chest(X0 + 2, 1, z, 'east', 'owl_court');
    for (let z = Z0 + 4; z <= Z1 - 4; z += 5) { s.set(X1 - 2, 1, z, 'cartography_table'); s.set(X1 - 3, 1, z, 'dark_oak_stairs[facing=east,half=bottom,shape=straight]'); s.set(X1 - 2, 2, z, 'candle[candles=2,lit=true,waterlogged=false]'); }
    for (let x = X0 + 3; x <= X1 - 3; x += 4) for (let y = 1; y <= 3; y++) for (let z = Z0 + 1; z <= Z0 + 3; z++) if (Math.hypot(x - c, z - cz) > RR + 1) s.set(x, y, z, 'iron_bars');
    // the upper floor (y 7): galleries, reached by stairs in two corners
    stairRun(s, X0 + 2, 1, Z1 - 9, 'north', 6, 'dark_oak_stairs', null, 2); for (let z = Z1 - 15; z <= Z1 - 12; z++) for (const x of [X0 + 2, X0 + 3]) s.set(x, 7, z, 'air');
    stairRun(s, X1 - 3, 1, Z1 - 9, 'north', 6, 'dark_oak_stairs', null, 2); for (let z = Z1 - 15; z <= Z1 - 12; z++) for (const x of [X1 - 3, X1 - 2]) s.set(x, 7, z, 'air');
    mob(s, X0 + 4, 8, cz, 'owl_magistrate'); mob(s, X1 - 4, 1, cz + 6, 'living_shield'); mob(s, X0 + 4, 1, cz + 8, 'living_shield');
    // the portico: a row of columns and a pediment in front of the south door
    for (let x = c - 9; x <= c + 9; x++) for (let z = Z1 + 1; z <= Z1 + 6; z++) {
      s.set(x, 0, z, 'polished_tuff');
      const col = (x - c + 9) % 3 === 0 && z === Z1 + 5;
      for (let y = 1; y <= 9; y++) s.set(x, y, z, col ? (y === 1 || y === 9 ? 'chiseled_tuff' : 'tuff_brick_wall') : 'air');
      s.set(x, 10, z, 'tuff_bricks');
    }
    // the pediment: a copper roof sloping east and west from a ridge along z, a triangle of tuff in front with a carved disc
    for (let k = 0; k <= 10; k++) for (let z = Z1 + 1; z <= Z1 + 7; z++) {
      const y = 11 + k, xa = c - 10 + k, xb = c + 10 - k;
      if (xa > xb) break;
      if (xa < xb) { s.set(xa, y, z, 'waxed_oxidized_cut_copper_stairs[facing=east,half=bottom,shape=straight]'); s.set(xb, y, z, 'waxed_oxidized_cut_copper_stairs[facing=west,half=bottom,shape=straight]'); }
      else s.set(xa, y, z, 'waxed_oxidized_cut_copper_slab[type=bottom]');
      if (z === Z1 + 6) for (let x = xa + 1; x < xb; x++) s.set(x, y, z, k === 3 && Math.abs(x - c) <= 1 ? 'chiseled_tuff' : 'tuff_bricks');
    }
    for (let k = 0; k < 4; k++) stairRun(s, c - 9, 0, Z1 + 7 + k, 'north', 1, 'tuff_brick_stairs', null, 19);
    // the garden court: hedges, paths, a fountain with an owl on it, benches; a low wall round the whole court
    for (let x = 6; x <= W - 7; x++) for (let z = Z1 + 8; z <= D - 6; z++) {
      const path = Math.abs(x - c) <= 1 || Math.abs(z - (Z1 + 19)) <= 1;
      s.set(x, 0, z, path ? 'gravel' : 'grass_block[snowy=false]');
      if (!path && (Math.abs(x - c) === 3 || Math.abs(z - (Z1 + 19)) === 3) && Math.hypot(x - c, z - (Z1 + 19)) > 5) s.set(x, 1, z, 'azalea_leaves[distance=1,persistent=true,waterlogged=false]');
    }
    s.disc(c, 1, Z1 + 19, 3.4, (x, y, z, d) => (d > 2.5 ? 'tuff_brick_wall' : 'water'));
    s.disc(c, 0, Z1 + 19, 3.4, 'polished_tuff');
    for (let y = 1; y <= 3; y++) s.set(c, y, Z1 + 19, y === 3 ? 'chiseled_tuff' : 'tuff_brick_wall');
    for (const [x, z] of [[c - 6, Z1 + 12], [c + 6, Z1 + 12], [c - 6, Z1 + 26], [c + 6, Z1 + 26]]) s.set(x, 1, z, 'dark_oak_stairs[facing=north,half=bottom,shape=straight]');
    mob(s, c + 8, 1, Z1 + 20, 'owl_magistrate');
    const foot = new Set();
    for (let x = X0; x <= X1; x++) for (let z = Z0; z <= D - 6; z++) if (x >= 6 && x <= W - 7 && (z <= Z1 || z >= Z1 + 8) || (z > Z1 && z <= Z1 + 7 && Math.abs(x - c) <= 10)) foot.add(x + ',' + z);
    for (let x = 6; x <= W - 7; x++) for (let z = Z1 + 8; z <= D - 6; z++) foot.add(x + ',' + z);
    perimeter(s, W, D, (x, z) => foot.has(x + ',' + z), 2, 3, { mat: (x, y, z) => (y === 3 ? 'tuff_brick_wall' : TB(x, y, z)), cap: (x, z) => ((x * 5 + z) % 11 === 0 ? 'lantern[hanging=false,waterlogged=false]' : 'air') }, (x, z) => Math.abs(x - c) <= 2 && z > D - 8);
    return s.save('owl_court/' + seed);
  }

  const statues = [statuary(1)];
  const ruinsUp = [forgottenSurface(1, 'the_lost'), forgottenSurface(2, 'the_forgotten')], ruinsDown = [forgottenCrypt(1, 'the_lost'), forgottenCrypt(2, 'the_forgotten')];
  const jail = [slimeJail(1)], grounds = [beetleGrounds(1)], court = [owlCourt(1)];
  special('statuary', 'spirecraft:cave_template', ['minecraft:badlands', 'minecraft:wooded_badlands', 'minecraft:eroded_badlands'],
    44, 15, { templates: statues, mode: 'open_ground', sink: 1, terrain_adaptation: 'beard_box', step: 'top_layer_modification' });
  special('forgotten_ruins', 'spirecraft:cave_template', ['minecraft:forest', 'minecraft:flower_forest', 'minecraft:birch_forest', 'minecraft:old_growth_birch_forest', 'minecraft:plains'],
    40, 14, { templates: ruinsUp, mode: 'open_ground', sink: 1, terrain_adaptation: 'beard_box', step: 'top_layer_modification' });
  special('forgotten_crypt', 'spirecraft:cave_template', ['#minecraft:is_overworld'],
    36, 12, { templates: ruinsDown, mode: 'buried', min_y: -50, max_y: -16, step: 'underground_structures' });
  special('slime_jail', 'spirecraft:cave_template', ['minecraft:swamp', 'minecraft:forest', 'minecraft:dark_forest', 'minecraft:birch_forest'],
    40, 14, { templates: jail, mode: 'open_ground', sink: 1, terrain_adaptation: 'beard_box', step: 'top_layer_modification' });
  special('beetle_grounds', 'spirecraft:cave_template', ['minecraft:savanna', 'minecraft:plains', 'minecraft:sunflower_plains', 'minecraft:meadow'],
    40, 14, { templates: grounds, mode: 'open_ground', sink: 1, terrain_adaptation: 'beard_box', step: 'top_layer_modification' });
  special('owl_court', 'spirecraft:cave_template', ['minecraft:dark_forest', 'minecraft:forest', 'minecraft:old_growth_birch_forest', 'minecraft:birch_forest'],
    64, 24, { templates: court, mode: 'open_ground', sink: 1, terrain_adaptation: 'beard_box', step: 'top_layer_modification' });
  return { statues, ruinsUp, ruinsDown, jail, grounds, court };
};
