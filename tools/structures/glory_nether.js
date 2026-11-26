// Glory v2 (2026-11-26) - the Nether, after the user's notes: "basalt pushes into the Axebot works - move it to the
// surface of the nether wastes so no natural blocks get inside; Axebots are made from netherite scrap; more workshop
// things inside - inspection gear, lava channels for smelting, conveyors, hydraulic presses - and small rooms like the
// other factories"; "the Test Subject's place: a big prison and laboratory - holding cells of all sizes, experiment
// rooms, a control room; the Test Subject's cell bigger; it wakes when you go in; all of it in the nether fortress's
// materials". The Soul Nexus sanctum is gone (the Nexus now rises in the soul sand valley after enough kills).
// Both templates carry their own air and a solid shell, and stand on a foundation filled down to the ground
// (worldgen SpireStructures.TemplatePiece). Convention: y = 0 is the floor layer.
const K = require('./glory_kit');
const { box, walls, mob, roundTower, gable, stairRun, perimeter, hangLantern } = K;

module.exports = function nether({ Struct, rng, loot, special }) {
  const H = (x, y, z) => { let v = (x * 374761393 + y * 668265263 + z * 2246822519) ^ 0x5bd1e995; v = Math.imul(v ^ (v >>> 13), 1274126177); return ((v ^ (v >>> 16)) >>> 0) / 4294967296; };
  const GATE = 'spirecraft:glory_gate[closed=false]';

  loot('axebot_foundry', [
    { rolls: [4, 7], items: [['iron_ingot', 12, 2, 6], ['gold_ingot', 6, 1, 3], ['quartz', 8, 2, 8], ['magma_cream', 4, 1, 2], ['coal', 6, 2, 6], ['spirecraft:scrap', 6, 1, 4], ['spirecraft:relic_fragment', 3]] },
    { rolls: 1, items: [['empty', 85], ['netherite_scrap', 12], ['ancient_debris', 3]] },
  ]);
  loot('prison_lab', [
    { rolls: [4, 7], items: [['gold_ingot', 8, 2, 5], ['bone', 8, 2, 6], ['leather', 6, 2, 5], ['nether_wart', 5, 2, 6], ['glass_bottle', 6, 1, 4], ['blaze_powder', 5, 1, 3], ['spirecraft:relic_fragment', 4, 1, 2], ['golden_carrot', 3, 1, 3]] },
    { rolls: 1, items: [['empty', 55], ['potion', 10, 1, 1, { potion: 'minecraft:fire_resistance' }], ['potion', 8, 1, 1, { potion: 'spirecraft:strength' }], ['netherite_scrap', 3]] },
  ]);

  // =========================================================================================== the Axebot foundry
  function foundry(seed) {
    // a long blackstone hall with basalt piers and iron trusses: the smelter at the west end (blast furnaces over a lava
    // crucible), lava running in channels to the casting floor (anvil moulds), two conveyor lines carrying castings
    // through hydraulic presses and inspection gates to the assembly bay with the Axebot cradles (spawners); the foreman's
    // office, the pattern room and the scrap store in lean-tos; chimneys; a wall that follows the buildings
    const r = rng(seed), W = 66, D = 54, Hh = 30, s = new Struct(W, Hh, D), foot = new Set();
    for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { s.set(x, 0, z, H(x, 0, z) < 0.6 ? 'netherrack' : H(x, 1, z) < 0.5 ? 'blackstone' : 'basalt[axis=y]'); for (let y = 1; y < Hh; y++) s.set(x, y, z, 'air'); }
    const BS = (x, y, z) => (H(x, y, z) < 0.15 ? 'cracked_polished_blackstone_bricks' : H(x, y, z) < 0.22 ? 'gilded_blackstone' : 'polished_blackstone_bricks');
    const X0 = 8, X1 = 54, Z0 = 12, Z1 = 38, T = 11;
    for (let x = X0; x <= X1; x++) for (let z = Z0; z <= Z1; z++) {
      foot.add(x + ',' + z);
      const wall = x === X0 || x === X1 || z === Z0 || z === Z1;
      s.set(x, 0, z, (x + z) % 7 === 0 ? 'magma_block' : 'polished_blackstone');
      for (let y = 1; y <= T; y++) {
        if (!wall) { s.set(x, y, z, 'air'); continue; }
        const along = x === X0 || x === X1 ? z - Z0 : x - X0;
        const pier = along % 6 === 0;
        s.set(x, y, z, pier ? 'basalt[axis=y]' : y === 1 ? 'blackstone' : (y >= 4 && y <= 8 && along % 6 === 3) ? 'iron_bars' : BS(x, y, z));
      }
    }
    gable(s, X0, Z0, X1, Z1, T + 1, { axis: 'x', stair: 'polished_blackstone_brick_stairs', block: 'polished_blackstone_bricks', gable: 'polished_blackstone_bricks', overhang: 1 });
    // iron roof trusses and a crane rail
    const zm = Math.round((Z0 + Z1) / 2);
    for (let x = X0 + 6; x < X1; x += 6) { for (let z = Z0 + 1; z < Z1; z++) s.set(x, T, z, 'iron_block'); for (let y = T + 1; y < T + 10; y++) s.set(x, y, zm, 'iron_chain[axis=y]'); s.set(x, T - 1, zm, 'iron_chain[axis=y]'); s.set(x, T - 2, zm, 'lantern[hanging=true,waterlogged=false]'); }
    for (let x = X0 + 1; x < X1; x++) s.set(x, T - 1, Z0 + 5, 'iron_block');
    // the smelter: blast furnaces round a crucible of lava, hoppers feeding it
    for (let x = X0 + 1; x <= X0 + 8; x++) for (let z = Z0 + 8; z <= Z1 - 8; z++) {
      const e = x === X0 + 1 || x === X0 + 8 || z === Z0 + 8 || z === Z1 - 8;
      s.set(x, 1, z, e ? 'polished_blackstone_bricks' : 'lava'); s.set(x, 0, z, 'blackstone');
      if (e) s.set(x, 2, z, (x + z) % 2 ? 'blast_furnace[facing=east,lit=true]' : 'polished_blackstone_brick_wall');
    }
    for (let z = Z0 + 9; z <= Z1 - 9; z += 2) s.set(X0 + 4, 5, z, 'hopper[enabled=true,facing=down]');
    // the lava channels from the crucible to the moulds (a trench of lava, iron-barred over at the walkways)
    for (let x = X0 + 9; x <= X0 + 22; x++) for (const z of [zm - 1, zm]) { s.set(x, 0, z, 'lava'); s.set(x, -1, z, 'blackstone'); s.set(x, 1, z, x % 4 === 0 ? 'iron_bars' : 'air'); }
    for (let x = X0 + 9; x <= X0 + 22; x++) { s.set(x, 0, zm - 2, 'polished_blackstone_bricks'); s.set(x, 0, zm + 1, 'polished_blackstone_bricks'); }
    for (let x = X0 + 14; x <= X0 + 22; x += 4) for (const z of [zm - 3, zm + 2]) { s.set(x, 1, z, 'anvil[facing=north]'); s.set(x, 1, z + (z < zm ? -1 : 1), 'smithing_table'); }
    // the conveyor lines (arrow tiles), presses and inspection gates, to the assembly bay
    const belt = (x0, x1, z) => { for (let x = x0; x <= x1; x++) { s.set(x, 1, z, 'magenta_glazed_terracotta[facing=west]'); s.set(x, 1, z - 1, x % 4 ? 'polished_blackstone_slab[type=top]' : 'iron_block'); s.set(x, 1, z + 1, x % 4 ? 'polished_blackstone_slab[type=top]' : 'iron_block'); } };
    belt(X0 + 24, X1 - 8, Z0 + 6); belt(X0 + 24, X1 - 8, Z1 - 6);
    const press = (x, z) => { for (const dz of [-2, 2]) for (let y = 1; y <= 5; y++) s.set(x, y, z + dz, y === 5 ? 'iron_block' : 'polished_blackstone_brick_wall'); for (let dz = -2; dz <= 2; dz++) s.set(x, 6, z + dz, 'iron_block'); s.set(x, 5, z, 'sticky_piston[facing=down,extended=false]'); s.set(x, 4, z, 'iron_block'); s.set(x, 3, z, 'heavy_weighted_pressure_plate[power=0]'.replace('heavy_weighted_pressure_plate[power=0]', 'air')); };
    const inspect = (x, z) => { for (const dz of [-2, 2]) for (let y = 1; y <= 3; y++) s.set(x, y, z + dz, y === 3 ? 'iron_block' : 'polished_blackstone_wall'); for (let dz = -1; dz <= 1; dz++) s.set(x, 3, z + dz, 'iron_block'); s.set(x, 2, z, 'observer[facing=down,powered=false]'); s.set(x, 4, z, 'redstone_lamp[lit=true]'); s.set(x, 4, z + 1, 'target[power=0]'); s.set(x, 4, z - 1, 'lightning_rod[facing=up,powered=false]'); };
    press(X0 + 28, Z0 + 6); press(X0 + 34, Z1 - 6); inspect(X0 + 36, Z0 + 6); inspect(X0 + 28, Z1 - 6);
    // quench troughs of magma between the lines, chains with castings hanging over them
    for (let x = X0 + 26; x <= X0 + 36; x++) s.set(x, 0, zm, 'magma_block');
    for (const x of [X0 + 27, X0 + 31, X0 + 35]) { for (let y = 4; y <= T - 1; y++) s.set(x, y, zm, 'iron_chain[axis=y]'); s.set(x, 3, zm, 'netherite_block'.replace('netherite_block', 'ancient_debris')); }
    // the assembly bay at the east end: cradles (spawners) and a scrap heap, the Axebots
    for (const z of [Z0 + 5, zm, Z1 - 5]) { for (let y = 1; y <= 5; y++) { s.set(X1 - 4, y, z - 2, 'polished_blackstone_bricks'); s.set(X1 - 4, y, z + 2, 'polished_blackstone_bricks'); } for (let dz = -2; dz <= 2; dz++) s.set(X1 - 4, 6, z + dz, 'iron_block'); }
    s.spawner(X1 - 3, 1, Z0 + 5, 'spirecraft:axebot'); s.spawner(X1 - 3, 1, Z1 - 5, 'spirecraft:axebot');
    for (const [x, z] of [[X1 - 2, zm - 1], [X1 - 2, zm], [X1 - 2, zm + 1], [X1 - 3, zm]]) s.set(x, 1, z, H(x, 1, z) < 0.5 ? 'spirecraft:junk_block' : 'ancient_debris');
    mob(s, X1 - 8, 1, zm - 4, 'axebot'); mob(s, X0 + 30, 1, zm + 3, 'axebot'); mob(s, X0 + 18, 1, Z0 + 4, 'axebot');
    // the doors: big doors at the east end (out of the assembly bay) and the south door
    for (let z = zm - 2; z <= zm + 2; z++) for (let y = 1; y <= 5; y++) s.set(X1, y, z, 'air');
    for (let x = 28; x <= 31; x++) for (let y = 1; y <= 4; y++) s.set(x, y, Z1, 'air');
    // lean-tos: the foreman's office (north), the pattern room (north), the scrap store (south-west)
    const lean = (x0, z0, x1, z1, doorX, doorZ, inner) => {
      for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
        foot.add(x + ',' + z);
        const e = x === x0 || x === x1 || z === z0 || z === z1;
        s.set(x, 0, z, 'crimson_planks');
        for (let y = 1; y <= 4; y++) s.set(x, y, z, e ? (y === 2 && (x + z) % 3 === 0 ? 'iron_bars' : BS(x, y, z)) : 'air');
        s.set(x, 5, z, 'polished_blackstone_brick_slab[type=bottom]');
      }
      for (let y = 1; y <= 2; y++) { s.set(doorX, y, doorZ, 'air'); s.set(doorX, y, doorZ + (doorZ === z0 ? -1 : doorZ === z1 ? 1 : 0), 'air'); }
      inner();
    };
    lean(12, 4, 24, 11, 18, 11, () => { s.set(14, 1, 6, 'lectern[facing=south,has_book=false,powered=false]'); s.set(16, 1, 5, 'cartography_table'); s.set(19, 1, 5, 'crimson_slab[type=top]'); s.set(20, 1, 5, 'crimson_slab[type=top]'); s.chest(22, 1, 5, 'south', 'axebot_foundry'); s.set(18, 4, 8, 'soul_lantern[hanging=true,waterlogged=false]'); });
    lean(28, 4, 40, 11, 34, 11, () => { for (let x = 29; x <= 39; x += 2) { s.set(x, 1, 5, 'smithing_table'); s.set(x + 1, 1, 5, 'crafter[crafting=false,orientation=north_up,triggered=false]'); } s.set(34, 1, 8, 'grindstone[face=floor,facing=east]'); });
    lean(2, 26, 7, 38, 7, 32, () => { for (let z = 27; z <= 37; z++) { s.set(3, 1, z, z % 2 ? 'barrel[facing=up,open=false]' : 'spirecraft:junk_block'); s.set(3, 2, z, z % 3 ? 'barrel[facing=up,open=false]' : 'air'); } s.chest(5, 1, 37, 'north', 'axebot_foundry'); });
    for (let y = 1; y <= 2; y++) s.set(X0, y, 32, 'air');
    // chimneys over the smelter, smoking
    for (const z of [Z0 + 3, Z1 - 3]) { for (let y = 1; y <= T + 12; y++) for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) s.set(X0 + 2 + dx, y, z + dz, y > T + 10 ? 'polished_blackstone_bricks' : 'basalt[axis=y]'); for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) s.set(X0 + 2 + dx, T + 13, z + dz, 'campfire[lit=true,facing=north,signal_fire=true,waterlogged=false]'); }
    // the wall round the works
    perimeter(s, W, D, (x, z) => foot.has(x + ',' + z), 4, 3, { mat: (x, y, z) => (y === 3 ? 'blackstone_wall' : H(x, y, z) < 0.2 ? 'cracked_polished_blackstone_bricks' : 'polished_blackstone_bricks'), cap: (x, z) => ((x * 3 + z * 7) % 10 === 0 ? 'soul_lantern[hanging=false,waterlogged=false]' : 'air') },
      (x, z) => (Math.abs(z - zm) <= 3 && x > X1) || (x >= 27 && x <= 32 && z > Z1));
    return s.save('axebot_foundry/1');
  }

  // =========================================================================================== the prison laboratory
  function prisonLab(seed) {
    // a fortress-built block (nether bricks, red nether brick bands, fences, iron bars) round two courts: the cell
    // block (west: a corridor with cells of 3, 5 and 7 across on both sides), the laboratory (east: the alchemy room,
    // the dissection room, the specimen tanks), the control room (north, windows over the holding cell) and the Test
    // Subject's holding cell (south-centre: 19 × 19, chains on the walls, gated doors); towers at the corners
    const r = rng(seed), W = 73, D = 73, Hh = 30, s = new Struct(W, Hh, D);
    const NB = (x, y, z) => (H(x, y, z) < 0.12 ? 'cracked_nether_bricks' : H(x, y, z) < 0.18 ? 'chiseled_nether_bricks' : 'nether_bricks');
    for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { s.set(x, 0, z, 'nether_bricks'); for (let y = 1; y < Hh; y++) s.set(x, y, z, 'air'); }
    const X0 = 4, X1 = 68, Z0 = 4, Z1 = 68, T = 9;
    // the outer shell: two storeys of thick wall, a band of red nether bricks, a crenellated top
    for (let x = X0; x <= X1; x++) for (let z = Z0; z <= Z1; z++) {
      const e = x === X0 || x === X1 || z === Z0 || z === Z1;
      if (!e) continue;
      for (let y = 1; y <= T; y++) s.set(x, y, z, y === 5 ? 'red_nether_bricks' : y === 3 && (x + z) % 6 === 0 ? 'nether_brick_fence' : NB(x, y, z));
      s.set(x, T + 1, z, (x + z) % 2 ? 'nether_brick_fence' : 'nether_bricks');
    }
    for (const [x, z] of [[X0, Z0], [X1, Z0], [X0, Z1], [X1, Z1]]) roundTower(s, x, z, 4, 0, T + 7, { mat: NB, floor: 'nether_bricks', floors: [T], slits: 3, top: 'crenel', ladder: true, ladderAt: [x < 36 ? 1 : -1, 0] });
    // an inner room helper: walls of nether bricks, a ceiling, a door
    const roomAt = (x0, z0, x1, z1, h = T, floor = 'nether_bricks') => {
      for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
        const e = x === x0 || x === x1 || z === z0 || z === z1;
        s.set(x, 0, z, floor);
        for (let y = 1; y <= h; y++) s.set(x, y, z, e ? (y === h ? 'red_nether_bricks' : NB(x, y, z)) : 'air');
        s.set(x, h + 1, z, 'nether_bricks');
      }
    };
    const door = (x, z, axis, w = 1, hgt = 3, gate) => { for (let i = 0; i < w; i++) for (let y = 1; y <= hgt; y++) s.set(axis === 'x' ? x + i : x, y, axis === 'x' ? z : z + i, gate ? GATE : 'air'); };
    // ---- the cell block (west wing): a corridor along z = 36, cells both sides
    roomAt(X0, Z0, 30, Z1);
    for (let x = X0 + 1; x < 30; x++) for (const z of [33, 39]) for (let y = 1; y <= 4; y++) s.set(x, y, z, 'iron_bars');
    for (let x = X0 + 1; x < 30; x++) for (let z = 34; z <= 38; z++) s.set(x, 0, z, 'polished_blackstone_bricks');
    const sizes = [3, 5, 7, 3, 5];
    let cx = X0 + 1;
    for (const w of sizes) {
      if (cx + w >= 30) break;
      for (const [za, zb] of [[Z0 + 1, 32], [40, Z1 - 1]]) for (let z = za; z <= zb; z++) for (let y = 1; y <= T; y++) s.set(cx + w, y, z, NB(cx + w, y, z));
      for (const z of [33, 39]) { s.set(cx + Math.floor(w / 2), 1, z, `iron_door[facing=${z === 33 ? 'south' : 'north'},half=lower,hinge=left,open=false,powered=false]`); s.set(cx + Math.floor(w / 2), 2, z, `iron_door[facing=${z === 33 ? 'south' : 'north'},half=upper,hinge=left,open=false,powered=false]`); }
      const mid = cx + Math.floor(w / 2);
      s.set(mid, 1, 28, H(mid, 1, 1) < 0.5 ? 'bone_block[axis=y]' : 'cobweb'); s.set(mid, 4, Z0 + 2, 'iron_chain[axis=y]'); s.set(mid, 3, Z0 + 2, 'iron_chain[axis=y]');
      s.set(mid, 1, 44, 'soul_soil'); s.set(mid, 3, Z1 - 2, 'iron_chain[axis=y]');
      cx += w + 1;
    }
    for (const z of [18, 54]) hangLantern(s, 17, T, z, true);
    for (let x = 6; x <= 28; x += 6) hangLantern(s, x, T, 36, true);
    mob(s, 14, 1, 36, 'axebot'); mob(s, 24, 1, 36, 'axebot');
    door(30, 35, 'z', 3, 3);
    // ---- the laboratory (east wing): alchemy, dissection, the specimen tanks
    roomAt(42, Z0, X1, 24);
    for (let x = 45; x <= 65; x += 4) { s.set(x, 1, Z0 + 2, 'brewing_stand[has_bottle_0=true,has_bottle_1=false,has_bottle_2=true]'); s.set(x + 1, 1, Z0 + 2, 'cauldron'); s.set(x + 2, 1, Z0 + 2, 'nether_brick_slab[type=top]'); }
    for (const x of [47, 55, 63]) { s.set(x, 1, 14, 'soul_campfire[lit=true,facing=north,signal_fire=false,waterlogged=false]'); s.set(x, 2, 14, 'cauldron'); }
    s.chest(66, 1, 22, 'west', 'prison_lab');
    door(52, 24, 'x', 3, 3);
    roomAt(42, 48, X1, Z1);
    for (let x = 46; x <= 64; x += 6) { for (let z = 54; z <= 62; z += 4) { s.set(x, 1, z, 'nether_brick_slab[type=top]'); s.set(x + 1, 1, z, 'nether_brick_slab[type=top]'); s.set(x, 2, z, H(x, 2, z) < 0.5 ? 'skeleton_skull[rotation=4]' : 'bone_block[axis=y]'); } }
    for (let x = 44; x <= 66; x += 2) { s.set(x, T - 1, 50, 'iron_chain[axis=y]'); s.set(x, T - 2, 50, x % 4 ? 'iron_chain[axis=y]' : 'soul_lantern[hanging=true,waterlogged=false]'); }
    door(52, 48, 'x', 3, 3);
    // the specimen tanks: glass columns in the middle of the east court with things inside
    for (const [x, z, inside] of [[48, 32, 'magma_block'], [54, 32, 'skeleton_skull[rotation=0]'], [60, 32, 'shroomlight'], [48, 40, 'wither_skeleton_skull[rotation=0]'], [60, 40, 'crying_obsidian']]) {
      s.set(x, 0, z, 'polished_blackstone_bricks');
      for (let y = 1; y <= 4; y++) for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) s.set(x + dx, y, z + dz, 'red_stained_glass');
      s.set(x, 2, z, inside); s.set(x, 1, z, 'nether_bricks'); for (const [dx, dz] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) s.set(x + dx, 5, z + dz, 'nether_brick_slab[type=bottom]');
    }
    mob(s, 56, 1, 36, 'axebot');
    // ---- the control room (north middle): levers, lamps, comparators, a window of bars over the holding cell
    roomAt(31, Z0, 41, 22, T);
    for (let x = 32; x <= 40; x++) { s.set(x, 1, Z0 + 1, x % 2 ? 'redstone_lamp[lit=true]' : 'target[power=0]'); s.set(x, 2, Z0 + 1, x % 3 ? 'redstone_lamp[lit=true]' : 'observer[facing=south,powered=false]'); s.set(x, 1, Z0 + 3, 'nether_brick_slab[type=top]'); s.set(x, 2, Z0 + 3, x % 2 ? 'lever[face=floor,facing=north,powered=false]' : 'comparator[facing=north,mode=compare,powered=false]'); }
    for (let x = 32; x <= 40; x++) for (let y = 2; y <= 6; y++) s.set(x, y, 22, 'iron_bars');
    s.chest(32, 1, 20, 'east', 'prison_lab');
    door(36, Z0, 'x', 1, 3); door(31, 12, 'z', 1, 3); door(41, 12, 'z', 1, 3);
    // ---- the holding cell (south middle): 19 × 19 inside, tall, chains on the walls, gated doors; the Test Subject
    const HX0 = 26, HX1 = 46, HZ0 = 26, HZ1 = 46, HT = 12;
    for (let x = HX0; x <= HX1; x++) for (let z = HZ0; z <= HZ1; z++) {
      const e = x === HX0 || x === HX1 || z === HZ0 || z === HZ1;
      s.set(x, 0, z, e ? 'red_nether_bricks' : H(x, 0, z) < 0.2 ? 'soul_soil' : H(x, 1, z) < 0.15 ? 'magma_block' : 'polished_blackstone_bricks');
      for (let y = 1; y <= HT; y++) s.set(x, y, z, e ? (y === 6 ? 'red_nether_bricks' : NB(x, y, z)) : 'air');
      s.set(x, HT + 1, z, e ? 'nether_bricks' : (x + z) % 3 === 0 ? 'iron_bars' : 'nether_bricks');
    }
    for (let x = HX0 + 3; x <= HX1 - 3; x += 4) for (const z of [HZ0 + 1, HZ1 - 1]) for (let y = 3; y <= HT - 1; y++) s.set(x, y, z, 'iron_chain[axis=y]');
    for (let z = HZ0 + 3; z <= HZ1 - 3; z += 4) for (const x of [HX0 + 1, HX1 - 1]) for (let y = 3; y <= HT - 1; y++) s.set(x, y, z, 'iron_chain[axis=y]');
    for (const [x, z] of [[HX0 + 3, HZ0 + 3], [HX1 - 3, HZ0 + 3], [HX0 + 3, HZ1 - 3], [HX1 - 3, HZ1 - 3]]) for (let y = 1; y <= 2; y++) s.set(x, y, z, y === 1 ? 'nether_brick_fence' : 'soul_lantern[hanging=false,waterlogged=false]');
    // the way in: from the cell block corridor (west) and the specimen court (east), each through a glory gate
    for (let z = 35; z <= 37; z++) { for (let y = 1; y <= 3; y++) { s.set(HX0, y, z, GATE); s.set(HX1, y, z, GATE); } for (let x = 30; x < HX0; x++) { s.set(x, 0, z, 'polished_blackstone_bricks'); for (let y = 1; y <= 3; y++) s.set(x, y, z, 'air'); } }
    for (let z = 34; z <= 38; z += 4) for (let x = 31; x < HX0; x++) for (let y = 1; y <= 4; y++) s.set(x, y, z, NB(x, y, z));
    for (let x = 31; x < HX0; x++) for (let z = 34; z <= 38; z++) s.set(x, 5, z, 'nether_bricks');
    mob(s, 36, 1, 38, 'test_subject', { Rotation: [{ t: 5, v: 180 }, { t: 5, v: 0 }] });
    // the courts between: soul sand, nether wart, the paths
    for (let x = 31; x <= 41; x++) for (let z = 47; z <= 67; z++) if (s.get(x, 1, z) === 'air') s.set(x, 0, z, H(x, 0, z) < 0.6 ? 'soul_sand' : 'nether_bricks');
    for (let x = 32; x <= 40; x += 2) for (let z = 50; z <= 64; z += 3) if (s.get(x, 0, z) === 'soul_sand') s.set(x, 1, z, 'nether_wart[age=3]');
    // the main gate (south) through the outer wall
    for (let x = 34; x <= 38; x++) for (let y = 1; y <= 5; y++) s.set(x, y, Z1, 'air');
    for (let x = 34; x <= 38; x++) s.set(x, 5, Z1, 'nether_brick_fence');
    return s.save('prison_lab/1');
  }

  const foundries = [foundry(1)], labs = [prisonLab(1)];
  special('axebot_foundry', 'spirecraft:cave_template', ['minecraft:nether_wastes'],
    36, 12, { templates: foundries, mode: 'cave_floor', sink: 1, min_y: 31, max_y: 70, step: 'surface_structures' });
  special('prison_lab', 'spirecraft:cave_template', ['minecraft:nether_wastes', 'minecraft:crimson_forest'],
    56, 20, { templates: labs, mode: 'cave_floor', sink: 1, min_y: 31, max_y: 80, step: 'surface_structures' });
  return { foundries, labs };
};
