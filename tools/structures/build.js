// Phase 9 structures (docs/design/structures.md): builds every template and writes its JSON.
// Run: node tools/structures/build.js     (then runData is NOT needed: everything goes to src/main/resources)
// Convention: layer y=0 is the ground layer (surface structures start one block down, so y=0 replaces the top soil).
const { Struct, Frame, facingTo, TURNS, rng, jigsaw, loot, writeJson } = require('./lib');
const STAT = require('./statues');

// ------------------------------------------------------------------ helpers
const SURFACE = 'WORLD_SURFACE_WG', FLOOR = 'OCEAN_FLOOR_WG';
const tidy = (st, r, p, alt) => (r() < p ? alt : st);
/** Breaks a build: each set block above y0 has chance p to vanish (more near the top). */
function ruin(s, r, p, minY = 1) {
  s.forEach((x, y, z, st) => {
    if (y < minY || st === 'air' || /chest|barrel|spawner|jigsaw/.test(st)) return;
    const q = p * (0.5 + y / s.h);
    if (r() < q) s.set(x, y, z, 'air');
  });
}
/** Swap stone bricks for cracked / mossy variants. */
function weather(s, r, map, p) {
  s.forEach((x, y, z, st, nbt) => { if (map[st] && r() < p) s.set(x, y, z, r.pick(map[st]), nbt); });
}
/** Ground patch (path/coarse dirt...) in a ragged disc on layer 0. */
function groundPatch(s, r, cx, cz, rad, blocks) {
  s.disc(cx, 0, cz, rad, (x, y, z, d) => (d > rad - 1.2 && r() < 0.5 ? null : r.pick(blocks)));
}

// ------------------------------------------------------------------ loot tables
const relicCommon = ['spirecraft:anchor', 'spirecraft:vajra', 'spirecraft:oddly_smooth_stone', 'spirecraft:bag_of_marbles', 'spirecraft:red_mask', 'spirecraft:bronze_scales', 'spirecraft:blood_vial', 'spirecraft:red_skull'];
loot('wood_carvings', [{ rolls: [3, 5], items: [['stick', 10, 2, 8], ['spirecraft:gnarlwood_planks', 8, 2, 6], ['bowl', 4, 1, 3], ['iron_axe', 2], ['shears', 2], ['candle', 4, 1, 3], ['flower_pot', 3], ['armor_stand', 1], ['gold_nugget', 4, 1, 4]] }]);
loot('relic_common', [{ rolls: 1, items: relicCommon.map(i => [i, 1]) }]);
loot('relic_uncommon', [{ rolls: 1, items: [['spirecraft:pen_nib', 1], ['spirecraft:mercury_hourglass', 1]] }]);
loot('relic_rare', [{ rolls: 1, items: [['spirecraft:tungsten_rod', 1], ['spirecraft:shuriken', 1], ['spirecraft:lizard_tail', 1]] }]);
const potion = (id, w) => ['potion', w, 1, 1, { potion: 'spirecraft:' + id }];
const potions = w => [potion('strength', w), potion('dexterity', w), potion('block', w), potion('liquid_bronze', w), potion('lucky_tonic', w), potion('blood', w)];
const relicRoll = (common, uncommon = 0, rare = 0, none = 100) => ({ rolls: 1, items: [['empty', none], ['#loot:spirecraft:chests/relic_common', common], ['#loot:spirecraft:chests/relic_uncommon', uncommon], ['#loot:spirecraft:chests/relic_rare', rare]].filter(e => e[1] > 0) });

loot('camp', [
  { rolls: [3, 6], items: [['bread', 10, 1, 4], ['cooked_mutton', 6, 1, 3], ['cooked_beef', 4, 1, 3], ['spirecraft:strawberry', 6, 1, 4], ['spirecraft:pear', 5, 1, 3], ['torch', 8, 2, 8], ['coal', 8, 2, 6], ['arrow', 6, 3, 10], ['string', 5, 1, 4], ['leather', 4, 1, 3], ['iron_nugget', 6, 2, 9], ['gold_nugget', 4, 1, 6], ['spirecraft:pebble', 4, 2, 6]] },
  { rolls: [0, 1], items: [...potions(1), ['spirecraft:meat_on_the_bone', 2]] },
  relicRoll(4, 1, 0, 95),
]);
loot('ruin_pile', [
  { rolls: [2, 5], items: [['spirecraft:scrap', 10, 1, 4], ['spirecraft:pebble', 8, 2, 6], ['bone', 8, 1, 4], ['iron_nugget', 8, 2, 8], ['gold_nugget', 6, 2, 7], ['flint', 5, 1, 3], ['brick', 4, 1, 3], ['emerald', 2, 1, 2], ['raw_iron', 4, 1, 3], ['spirecraft:raw_tungsten', 3, 1, 2]] },
  { rolls: 1, items: [['empty', 9], ['book', 2, 1, 1, { enchant: true }], ['golden_apple', 1]] },
  relicRoll(5, 1, 0, 94),
]);
loot('dock', [
  { rolls: [3, 6], items: [['cod', 8, 1, 4], ['salmon', 6, 1, 3], ['ink_sac', 8, 1, 4], ['string', 6, 2, 6], ['lead', 3], ['iron_chain', 3, 1, 3], ['spirecraft:scrap', 6, 1, 4], ['spirecraft:ink_bubble', 3, 1, 2], ['kelp', 6, 2, 8], ['iron_nugget', 6, 2, 8], ['gold_ingot', 2, 1, 2], ['nautilus_shell', 1]] },
  { rolls: [0, 1], items: [potion('fysh_oil', 2), potion('weak', 1), ['fishing_rod', 2]] },
  relicRoll(4, 1, 0, 95),
]);
loot('lighthouse', [
  { rolls: [3, 6], items: [['candle', 6, 1, 4], ['glowstone_dust', 6, 2, 6], ['spirecraft:scrap', 6, 1, 4], ['gold_ingot', 5, 1, 3], ['iron_ingot', 6, 1, 4], ['emerald', 4, 1, 3], ['spyglass', 2], ['compass', 2], ['prismarine_crystals', 4, 1, 4]] },
  { rolls: 1, items: [potion('fysh_oil', 3), potion('block', 2), ['book', 2, 1, 1, { enchant: true }]] },
  relicRoll(20, 6, 1, 73),
]);
loot('scriptorium', [
  { rolls: [3, 6], items: [['paper', 10, 2, 7], ['book', 8, 1, 3], ['feather', 6, 1, 4], ['ink_sac', 8, 1, 4], ['candle', 5, 1, 3], ['map', 3], ['gold_nugget', 4, 2, 6]] },
  { rolls: [1, 2], items: [['book', 3, 1, 1, { enchant: true }], ['writable_book', 1], ['empty', 2]] },
  relicRoll(6, 2, 0, 92),
]);
loot('sea_ruins', [
  { rolls: [2, 5], items: [['coal', 10, 1, 4], ['gold_nugget', 10, 1, 5], ['emerald', 4, 1, 2], ['iron_ingot', 4, 1, 3], ['ink_sac', 6, 1, 3], ['prismarine_shard', 6, 1, 4], ['spirecraft:scrap', 6, 1, 3]] },
  { rolls: 1, items: [['empty', 6], ['book', 2, 1, 1, { enchant: true }], ['golden_helmet', 1], ['fishing_rod', 1]] },
  relicRoll(6, 1, 0, 93),
]);
loot('sunken_treasury', [
  { rolls: [4, 8], items: [['gold_ingot', 10, 1, 5], ['gold_nugget', 10, 4, 12], ['emerald', 8, 1, 5], ['diamond', 2, 1, 2], ['iron_ingot', 6, 2, 5], ['spirecraft:galactic_dust', 3, 1, 3]] },
  { rolls: 1, items: [['book', 2, 1, 1, { enchant: true }], ['golden_apple', 1], ['heart_of_the_sea', 1], ['empty', 2]] },
  relicRoll(50, 30, 10, 10),
]);
loot('overgrowth_camp', [
  { rolls: [3, 6], items: [['spirecraft:mango', 8, 1, 4], ['spirecraft:pear', 8, 1, 4], ['spirecraft:strawberry', 6, 1, 4], ['apple', 6, 1, 3], ['string', 6, 2, 5], ['stick', 6, 2, 8], ['arrow', 6, 4, 10], ['vine', 4, 1, 4], ['spirecraft:raw_orichalcum', 2, 1, 2], ['gold_nugget', 5, 2, 6]] },
  { rolls: [0, 1], items: potions(1) },
  relicRoll(5, 1, 0, 94),
]);
loot('ceremonial_altar', [
  { rolls: 1, items: [['spirecraft:ceremonial_bell', 1]] },
  { rolls: [2, 4], items: [['gold_ingot', 8, 1, 4], ['emerald', 6, 1, 3], ['amethyst_shard', 6, 2, 6], ['bone', 6, 2, 6], ['candle', 5, 1, 4]] },
]);
loot('byrdonis_nest', [
  { rolls: [2, 5], items: [['egg', 10, 1, 4], ['feather', 12, 2, 8], ['stick', 6, 2, 6], ['wheat', 4, 2, 6], ['gold_nugget', 3, 1, 5], ['bone', 4, 1, 3]] },
  relicRoll(10, 2, 0, 88),
]);
loot('kin_hut', [
  { rolls: [2, 5], items: [['spirecraft:mango', 8, 1, 3], ['bone', 8, 1, 4], ['candle', 5, 1, 3], ['string', 6, 2, 5], ['leather', 5, 1, 3], ['arrow', 5, 3, 8], ['gold_nugget', 4, 2, 6], ['spirecraft:raw_orichalcum', 2, 1, 2]] },
  relicRoll(4, 1, 0, 95),
]);
loot('kin_shrine', [
  { rolls: [3, 6], items: [['bone', 8, 2, 6], ['candle', 8, 2, 5], ['gold_ingot', 6, 1, 3], ['emerald', 4, 1, 3], ['amethyst_shard', 4, 2, 5], ['ender_pearl', 2]] },
  { rolls: 1, items: potions(1) },
  relicRoll(25, 10, 2, 63),
]);
loot('scrap_pile', [
  { rolls: [3, 6], items: [['spirecraft:scrap', 12, 2, 6], ['spirecraft:automaton_alloy_ingot', 8, 1, 4], ['copper_ingot', 8, 2, 7], ['prismarine_crystals', 5, 1, 4], ['redstone', 8, 2, 8], ['spirecraft:tungsten_ingot', 3, 1, 2], ['iron_chain', 4, 1, 3], ['bone', 5, 1, 3]] },
  { rolls: 1, items: [['empty', 6], ['spirecraft:energy_core', 2], ['spirecraft:flak_shell', 2, 2, 6]] },
  relicRoll(6, 2, 0, 92),
]);
loot('beekeeper', [
  { rolls: [3, 6], items: [['honey_bottle', 10, 1, 3], ['honeycomb', 10, 1, 4], ['candle', 6, 1, 4], ['glass_bottle', 6, 1, 4], ['bread', 6, 1, 3], ['shears', 2], ['campfire', 2], ['dandelion', 4, 1, 3], ['gold_nugget', 4, 2, 6]] },
  relicRoll(3, 1, 0, 96),
]);
loot('web_nest', [
  { rolls: [3, 6], items: [['string', 14, 2, 8], ['cobweb', 6, 1, 3], ['bone', 8, 1, 4], ['spider_eye', 6, 1, 3], ['gold_ingot', 4, 1, 3], ['emerald', 3, 1, 2], ['spirecraft:hive_egg', 3, 1, 2]] },
  { rolls: 1, items: [['empty', 4], ['book', 2, 1, 1, { enchant: true }], potion('poison', 2)] },
  relicRoll(20, 6, 2, 72),
]);
loot('holes_chamber', [
  { rolls: [3, 6], items: [['gold_ingot', 6, 1, 3], ['emerald', 5, 1, 3], ['bone', 8, 1, 4], ['spirecraft:scrap', 6, 1, 3], ['candle', 5, 1, 3], ['iron_ingot', 5, 1, 3], ['book', 2, 1, 1, { enchant: true }]] },
  relicRoll(20, 6, 1, 73),
]);
loot('holes', [{ rolls: 1, items: [['gold_nugget', 6, 1, 4], ['bone', 8, 1, 2], ['spirecraft:scrap', 6], ['emerald', 2], ['spirecraft:pebble', 6, 1, 3], ['iron_nugget', 6, 1, 4]] }]);

// ------------------------------------------------------------------ camps (overworld, biome variants)
const CAMP = {
  plains: { wool: ['white_wool', 'brown_wool'], wood: 'oak', ground: ['dirt_path', 'dirt_path', 'gravel', 'packed_mud'], biomes: ['minecraft:plains', 'minecraft:sunflower_plains', 'minecraft:meadow', 'minecraft:forest', 'minecraft:birch_forest', 'minecraft:flower_forest'] },
  taiga: { wool: ['brown_wool', 'gray_wool'], wood: 'spruce', ground: ['dirt_path', 'gravel', 'dirt_path', 'packed_mud'], biomes: ['minecraft:taiga', 'minecraft:old_growth_pine_taiga', 'minecraft:old_growth_spruce_taiga', 'minecraft:windswept_forest'] },
  desert: { wool: ['yellow_wool', 'orange_wool'], wood: 'birch', ground: ['sandstone', 'smooth_sandstone', 'sand'], biomes: ['minecraft:desert'] },
  savanna: { wool: ['orange_wool', 'red_wool'], wood: 'acacia', ground: ['dirt_path', 'red_sand', 'dirt_path', 'packed_mud'], biomes: ['minecraft:savanna', 'minecraft:savanna_plateau', 'minecraft:badlands', 'minecraft:wooded_badlands'] },
  snowy: { wool: ['light_gray_wool', 'white_wool'], wood: 'spruce', ground: ['snow_block', 'dirt_path', 'gravel'], biomes: ['minecraft:snowy_plains', 'minecraft:snowy_taiga', 'minecraft:grove'] },
};
/** An A-frame tent, 5 wide (x) and `len` deep (z) (v3.4 user: the wool is only the cover - both ends stay open). */
function tent(s, x0, z0, len, wool, r, loot, wood) {
  const back = z0 + len - 1;
  for (let z = z0; z <= back; z++) {
    s.set(x0, 1, z, wool).set(x0 + 4, 1, z, wool).set(x0 + 1, 2, z, wool).set(x0 + 3, 2, z, wool).set(x0 + 2, 3, z, wool);
    s.set(x0 + 1, 1, z, 'air').set(x0 + 2, 1, z, 'air').set(x0 + 3, 1, z, 'air').set(x0 + 2, 2, z, 'air');
    s.set(x0 + 1, 0, z, 'dirt_path').set(x0 + 2, 0, z, 'dirt_path').set(x0 + 3, 0, z, 'dirt_path');
  }
  // the ridge pole on two posts, one at each open end
  s.set(x0 + 2, 1, z0, `${wood}_fence`).set(x0 + 2, 2, z0, `${wood}_fence`).set(x0 + 2, 1, back, `${wood}_fence`).set(x0 + 2, 2, back, `${wood}_fence`);
  s.set(x0 + 1, 1, z0 + 1, r.pick(['red_carpet', 'brown_carpet', 'white_carpet'])).set(x0 + 1, 1, z0 + 2, r.pick(['red_carpet', 'brown_carpet']));
  if (loot) s.chest(x0 + 3, 1, back - 1, 'west', loot);
  else s.set(x0 + 3, 1, back - 1, 'barrel[facing=up]');
}
function camp(v, seed) {
  const c = CAMP[v], r = rng(seed), s = new Struct(15, 6, 15);
  groundPatch(s, r, 7, 7, 6.5, c.ground);
  s.set(7, 0, 7, 'stone').set(7, 1, 7, 'campfire[lit=true,facing=north]');
  for (const [x, z, ax] of [[7, 4, 'x'], [7, 10, 'x'], [4, 7, 'z'], [10, 7, 'z']]) {
    if (r.chance(0.75)) { s.set(x, 1, z, `stripped_${c.wood}_log[axis=${ax}]`); if (r.chance(0.6)) s.set(x + (ax === 'x' ? 1 : 0), 1, z + (ax === 'z' ? 1 : 0), `stripped_${c.wood}_log[axis=${ax}]`); }
  }
  tent(s, 1, 1, 5, c.wool[0], r, 'camp', c.wood);
  if (r.chance(0.7)) tent(s, 9, 1, 4, c.wool[1], r, null, c.wood);
  // rack: two fences and a slab, a lantern, barrels and a woodpile
  s.set(12, 1, 11, `${c.wood}_fence`).set(12, 2, 11, `${c.wood}_fence`).set(12, 3, 11, `${c.wood}_slab[type=bottom]`).set(12, 1, 12, `${c.wood}_log[axis=y]`).set(12, 2, 12, 'lantern[hanging=false]');
  s.set(2, 1, 12, `${c.wood}_log[axis=x]`).set(3, 1, 12, `${c.wood}_log[axis=x]`).set(2, 2, 12, `${c.wood}_log[axis=x]`);
  s.set(5, 1, 12, 'barrel[facing=up]');
  if (v === 'snowy') s.forEach((x, y, z, st) => { if (y === 0 && st !== 'stone' && !s.get(x, 1, z) && r.chance(0.6)) s.set(x, 1, z, 'snow[layers=1]'); });
  return s.save(`camp/${v}_${seed}`);
}
for (const v of Object.keys(CAMP)) {
  jigsaw({ id: `camp_${v}`, biomes: CAMP[v].biomes, templates: [[camp(v, 1)], [camp(v, 2)], [camp(v, 3)]], offset: -1, spacing: 40, separation: 14, dry: true });
}

// ------------------------------------------------------------------ ruin pile (STS2 Trash Heap)
/** v3.4 (user: no stone from another biome): the overworld piles are vanilla stone bricks, the overgrowth ones ruin stone. */
const STONES = {
  vanilla: { bricks: 'stone_bricks', cracked: ['cracked_stone_bricks', 'mossy_stone_bricks', 'mossy_cobblestone'], chiseled: 'chiseled_stone_bricks', wall: 'stone_brick_wall', slab: 'stone_brick_slab', stairs: 'stone_brick_stairs', block: 'stone', ground: ['gravel', 'coarse_dirt', 'cobblestone', 'stone'] },
  ruin: { bricks: 'spirecraft:ruin_stone_bricks', cracked: ['spirecraft:cracked_ruin_stone_bricks', 'mossy_stone_bricks', 'mossy_cobblestone'], chiseled: 'spirecraft:chiseled_ruin_stone_bricks', wall: 'spirecraft:ruin_stone_wall', slab: 'spirecraft:ruin_stone_slab', stairs: 'spirecraft:ruin_stone_brick_stairs', block: 'spirecraft:ruin_stone', ground: ['gravel', 'coarse_dirt', 'cobblestone', 'spirecraft:ruin_stone'] },
};
function ruinPile(seed, kind) {
  const r = rng(seed), s = new Struct(11, 6, 11), m = STONES[kind];
  groundPatch(s, r, 5, 5, 5, m.ground);
  const h = () => r.int(1, 4);
  for (let x = 1; x <= 8; x++) { const t = x < 3 || r.chance(0.6) ? h() : 0; for (let y = 1; y <= t; y++) s.set(x, y, 2, m.bricks); }
  for (let z = 3; z <= 8; z++) { const t = r.chance(0.55) ? h() : 0; for (let y = 1; y <= t; y++) s.set(1, y, z, m.bricks); }
  s.set(7, 1, 7, m.chiseled).set(7, 2, 7, m.wall);
  for (let x = 4; x <= 7; x++) s.set(x, 1, 9, m.wall);     // the fallen column
  for (let i = 0; i < 10; i++) {
    const x = r.int(2, 9), z = r.int(3, 9);
    if (!s.get(x, 1, z)) s.set(x, 1, z, r.pick([`${m.slab}[type=bottom]`, 'cobblestone', `${m.stairs}[facing=east,half=bottom]`, 'gravel', `${m.slab}[type=bottom]`]));
  }
  weather(s, r, { [m.bricks]: m.cracked }, 0.35);
  s.chest(3, 0, 4, 'south', 'ruin_pile');   // half-buried
  return s.save(`ruin_pile/${kind}_${seed}`);
}
jigsaw({
  id: 'ruin_pile', templates: [1, 2, 3, 4].map(n => [ruinPile(n, 'vanilla')]), offset: -1, spacing: 28, separation: 10, dry: true,
  biomes: ['minecraft:plains', 'minecraft:forest', 'minecraft:birch_forest', 'minecraft:taiga', 'minecraft:savanna', 'minecraft:desert', 'minecraft:meadow', 'minecraft:dark_forest'],
});
jigsaw({ id: 'overgrowth_ruin_pile', templates: [5, 6, 7].map(n => [ruinPile(n, 'ruin')]), offset: -1, spacing: 28, separation: 10, dry: true, biomes: ['spirecraft:overgrowth', 'spirecraft:misty_overgrowth', 'spirecraft:mushroom_overgrowth'] });

// ------------------------------------------------------------------ Underdocks: houses, lighthouse, sailboat
const DOCK_WEATHER = { 'spirecraft:dock_bricks': ['spirecraft:cracked_dock_bricks', 'spirecraft:harbour_rock'], 'dark_oak_planks': ['spirecraft:rotten_planks'] };
/**
 * A harbour house (v3.5 user): smaller; it stands on stilts like the piers, so the same house sits on the beach or out
 * in the shallows; harbour wood (rotten planks between rotten log corner posts) on a course of dock bricks, a deck all
 * round, a steep roof that gets steeper towards the ridge with eaves overhanging every wall, and an attic under the
 * roof when the walls are tall. kind: small / house / tall / scriptorium. The deck is at y = P (the first air above the
 * water or ground).
 */
function dockHouse(seed, kind) {
  const r = rng(seed), [bw, bd, H] = { small: [5, 5, 3], house: [5, 7, 3], tall: [6, 6, 4], scriptorium: [7, 7, 4] }[kind];
  const Pd = 10, W = bw + 4, D = bd + 4, s = new Struct(W, Pd + H + 10, D);
  const PL = 'spirecraft:rotten_planks', LOG = 'spirecraft:rotten_log[axis=y]', B = 'spirecraft:dock_bricks';
  const x0 = 2, x1 = x0 + bw - 1, z0 = 2, z1 = z0 + bd - 1;
  // the deck, one block wider than the house all round, on posts driven down
  for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) s.set(x, Pd, z, r.chance(0.12) ? 'dark_oak_planks' : PL);
  for (let x = 1; x < W - 1; x += 3) for (const z of [1, D - 2]) for (let y = 0; y < Pd; y++) s.set(Math.min(x, W - 2), y, z, 'spirecraft:rotten_log[axis=y]');
  for (const x of [1, W - 2]) for (let z = 1; z < D - 1; z += 3) for (let y = 0; y < Pd; y++) s.set(x, y, z, 'spirecraft:rotten_log[axis=y]');
  for (const [x, z] of [[1, 1], [W - 2, 1], [1, D - 2], [W - 2, D - 2]]) for (let y = 0; y < Pd; y++) s.set(x, y, z, 'spirecraft:rotten_log[axis=y]');
  // walls: a dock-brick course, then planks between log corner posts
  for (let y = Pd + 1; y <= Pd + H; y++) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const edge = x === x0 || x === x1 || z === z0 || z === z1, corner = (x === x0 || x === x1) && (z === z0 || z === z1);
    s.set(x, y, z, !edge ? 'air' : corner ? LOG : y === Pd + 1 ? B : PL);
  }
  const mx = Math.floor((x0 + x1) / 2);
  s.set(mx, Pd + 1, z0, 'spirecraft:rotten_door[facing=south,half=lower,hinge=left,open=false]').set(mx, Pd + 2, z0, 'spirecraft:rotten_door[facing=south,half=upper,hinge=left,open=false]');
  for (const [x, z] of [[x0, z0 + 2], [x1, z1 - 1], [x1 - 1, z1]]) s.set(x, Pd + 2, z, 'glass_pane');
  // the roof: the ridge runs along z; rising 1, 1, 2, 2, 3 blocks per step towards the middle, eaves one block out
  const rises = [1, 1, 2, 2, 3, 3], half = Math.floor((bw + 2) / 2), base = Pd + H;
  let y = base, tops = [];
  for (let k = 0; k <= half; k++) {
    const xl = x0 - 1 + k, xr = x1 + 1 - k;
    y += k === 0 ? 1 : rises[k - 1] || 3;
    tops.push(y);
    for (let z = z0 - 1; z <= z1 + 1; z++) {
      if (xl < xr) {
        s.set(xl, y, z, 'spirecraft:rotten_stairs[facing=east,half=bottom]').set(xr, y, z, 'spirecraft:rotten_stairs[facing=west,half=bottom]');
        for (let yy = (k === 0 ? y : tops[k - 1]); yy < y; yy++) { s.set(xl, yy, z, PL); s.set(xr, yy, z, PL); }   // the steeper steps filled under
      } else if (xl === xr) { for (let yy = tops[k - 1]; yy < y; yy++) s.set(xl, yy, z, PL); s.set(xl, y, z, 'spirecraft:rotten_fence'); }   // v3.6 (user): the ridge's top course a fence, not a second layer of wood
    }
    // the gable ends: planks inside the roof line
    if (k > 0) for (const ze of [z0, z1]) for (let x = xl + 1; x < xr; x++) for (let yy = base + 1; yy < y; yy++) if (!s.get(x, yy, ze) || s.get(x, yy, ze) === 'air') s.set(x, yy, ze, PL);
  }
  for (let z = z0; z <= z1; z++) for (let x = x0 + 1; x < x1; x++) for (let yy = base + 1; yy < tops[tops.length - 1]; yy++) if (!s.get(x, yy, z) && z !== z0 && z !== z1) s.set(x, yy, z, 'air');
  // inside
  if (kind === 'scriptorium') {   // the waterlogged scriptorium (STS2 event): shelves, a lectern, damp books
    for (let z = z0 + 1; z < z1; z++) s.set(x0 + 1, Pd + 1, z, 'bookshelf').set(x0 + 1, Pd + 2, z, r.chance(0.5) ? 'bookshelf' : 'chiseled_bookshelf[facing=east]');
    s.set(mx, Pd + 1, z1 - 2, 'lectern[facing=south]').chest(x1 - 1, Pd + 1, z1 - 1, 'west', 'scriptorium').set(x1 - 1, Pd + 1, z0 + 1, 'candle[candles=3,lit=false]');
  } else {
    s.set(x1 - 1, Pd + 1, z1 - 1, 'barrel[facing=up]').chest(x0 + 1, Pd + 1, z1 - 1, 'east', 'dock');
    if (bd > 5) s.set(x1 - 1, Pd + 1, z0 + 1, 'spirecraft:rotten_fence').set(x1 - 1, Pd + 2, z0 + 1, 'spirecraft:rotten_pressure_plate');
  }
  // the attic: a plank floor at the wall top with a ladder up, a window in the gable
  if (H >= 4) {
    for (let x = x0 + 1; x < x1; x++) for (let z = z0 + 1; z < z1; z++) s.set(x, base, z, PL);
    s.set(x0 + 1, base, z0 + 1, 'air');
    for (let yy = Pd + 1; yy <= base; yy++) s.set(x0 + 1, yy, z0 + 1, 'ladder[facing=south]');
    s.set(mx, base + 2, z1, 'glass_pane').set(x1 - 1, base + 1, z1 - 1, 'barrel[facing=up]');
    s.set(mx, base - 1, Math.floor((z0 + z1) / 2), 'lantern[hanging=true]');   // hanging from the attic floor
  } else {
    for (let x = x0 + 1; x < x1; x++) s.set(x, base, Math.floor((z0 + z1) / 2), 'spirecraft:rotten_log[axis=x]');   // v3.6 (user: nothing floating): a tie beam from wall to wall
    s.set(mx, base - 1, Math.floor((z0 + z1) / 2), 'lantern[hanging=true]');
  }
  // outside: a lantern on a post at the door, a rope rail with gaps
  s.set(mx + 2, Pd + 1, 1, 'spirecraft:rotten_fence').set(mx + 2, Pd + 2, 1, 'lantern[hanging=false]');
  for (let x = 1; x < W - 1; x++) if (x !== mx && x !== mx + 2 && r.chance(0.6)) s.set(x, Pd + 1, D - 2, 'spirecraft:rotten_fence');
  return s.save(`dock_house/${kind}_${seed}`);
}
const DOCKS = ['spirecraft:stone_forest_docks', 'spirecraft:beach_docks'];
jigsaw({ id: 'dock_house', biomes: DOCKS, templates: [[dockHouse(1, 'small'), 2], [dockHouse(2, 'house'), 2], [dockHouse(3, 'tall')], [dockHouse(4, 'scriptorium')]], offset: -10, spacing: 22, separation: 8, terrain: 'none' });

/**
 * The lighthouse (v3.3 user: dock bricks and wood, plus spruce, iron and lanterns): a stepped dock-brick plinth, a
 * tapering dock-brick tower banded with spruce and braced by four spruce-log pilasters, a spruce stair spiralling up
 * round a log core, a spruce gallery with an iron railing and lantern posts, an iron-framed lamp room and a spruce
 * roof cone with a lightning rod.
 */
function lighthouse(seed) {
  const r = rng(seed), n = 13, c = 6, s = new Struct(n, 31, n);
  // v3.4 (user): the body is wood (the harbour's rotten planks between rotten log posts), spruce only as trim; no iron blocks
  const B = 'spirecraft:dock_bricks', SP = 'spirecraft:rotten_planks', SL = 'spirecraft:rotten_log[axis=y]', TRIM = 'spruce_planks';
  // plinth: a dock-brick disc, a ring of stairs stepping down outside
  s.disc(c, 0, c, 5.6, B);
  s.disc(c, 1, c, 5.6, (x, y, z, d) => (d > 4.6 ? `spirecraft:dock_brick_stairs[facing=${facingTo(x, z, c, c)},half=bottom]` : B), -1);
  // tower: radius 3.6 at the foot to 2.9 at the top
  const top = 20;
  for (let y = 2; y <= top; y++) {
    const rad = 3.6 - (y - 2) * 0.04;
    // v3.6 (user: inside, the lower tower was all planks): harbour stone up to y 11 (dock bricks, harbour rock, polished), wood above
    const stone = () => r.pick([B, B, 'spirecraft:harbour_rock', 'spirecraft:polished_harbour_rock', 'spirecraft:cracked_dock_bricks']);
    s.disc(c, y, c, rad, () => (y <= 11 ? stone() : y % 6 === 0 ? TRIM : (r.chance(0.1) ? 'dark_oak_planks' : SP)), rad - 1);
    s.disc(c, y, c, rad - 1, 'air');
  }
  for (const [x, z] of [[c, c - 4], [c + 4, c], [c, c + 4], [c - 4, c]]) for (let y = 12; y <= top; y++) s.set(x, y, z, SL);   // posts up the wooden part (v3.6: the stone part has none)
  // the core and the spiral stair round it
  for (let y = 2; y <= top; y++) s.set(c, y, c, y % 4 === 0 ? 'spirecraft:polished_harbour_rock' : B);   // v3.5: a stone core
  const ring = [[-1, -1, 'east'], [0, -1, 'east'], [1, -1, 'south'], [1, 0, 'south'], [1, 1, 'west'], [0, 1, 'west'], [-1, 1, 'north'], [-1, 0, 'north']];
  for (let y = 2, i = 0; y <= top; y++, i++) {
    const [dx, dz, f] = ring[i % 8];
    s.set(c + dx, y, c + dz, `spirecraft:polished_harbour_rock_stairs[facing=${f},half=bottom]`);   // v3.5: a stone stair
    const [px, pz] = ring[(i + 7) % 8];
    s.set(c + px, y, c + pz, i % 2 ? 'spirecraft:polished_harbour_rock_slab[type=top]' : 'air');
  }
  // the door (south) and windows up the spiral
  s.set(c, 2, c + 3, 'spirecraft:rotten_door[facing=north,half=lower,hinge=left,open=false]').set(c, 3, c + 3, 'spirecraft:rotten_door[facing=north,half=upper,hinge=left,open=false]');
  s.set(c, 4, c + 4, 'lantern[hanging=false]');
  // v3.5 (user: not shut all round): barred windows, two blocks tall, up the spiral
  // v3.6 (user: the bars sat outside the wall - not windows): openings in the wall itself, in the middle of each side
  for (const [x, z, y] of [[c + 3, c, 5], [c - 3, c, 7], [c, c - 3, 9], [c + 3, c, 10], [c - 2, c - 2, 13], [c + 2, c + 2, 15], [c + 2, c - 2, 17], [c - 2, c + 2, 18]]) s.set(x, y, z, 'iron_bars').set(x, y + 1, z, 'iron_bars');
  s.disc(c, 1, c, 2.4, 'spirecraft:polished_harbour_rock');   // a stone floor inside
  // gallery: spruce deck, iron railing, lantern posts at the four corners
  s.disc(c, top + 1, c, 4.8, SP);
  s.disc(c, top + 1, c, 4.8, (x, y, z, d) => (d > 4.2 ? `spruce_slab[type=top]` : TRIM), 3.9);
  s.disc(c, top + 2, c, 4.8, 'iron_bars', 3.9);
  for (const [x, z] of [[c - 3, c - 3], [c + 3, c - 3], [c - 3, c + 3], [c + 3, c + 3]]) s.set(x, top + 2, z, 'spruce_fence').set(x, top + 3, z, 'lantern[hanging=false]');
  s.set(c, top + 1, c, SL);
  // lamp room: iron corners, glass between, the lamp on an iron pedestal in the middle
  for (let y = top + 2; y <= top + 5; y++) s.disc(c, y, c, 2.5, (x, yy, z, d) => (d > 1.6 ? (Math.abs(x - c) === 2 && Math.abs(z - c) === 2 ? 'spruce_log[axis=y]' : y === top + 5 ? TRIM : 'glass_pane') : 'air'));
  s.set(c, top + 2, c, 'spirecraft:polished_harbour_rock').set(c, top + 3, c, 'sea_lantern').set(c + 1, top + 4, c, 'iron_chain').set(c - 1, top + 2, c - 1, 'barrel[facing=up]');
  s.chest(c + 1, top + 2, c + 1, 'north', 'lighthouse');
  s.set(c, top + 2, c + 2, 'air').set(c, top + 3, c + 2, 'air');   // the way out onto the gallery
  // the roof: a spruce cone, a dock-brick cap, the lightning rod
  s.disc(c, top + 6, c, 3.4, (x, y, z, d) => (d > 2.4 ? `spirecraft:rotten_stairs[facing=${facingTo(x, z, c, c)},half=bottom]` : SP));
  s.disc(c, top + 7, c, 2.4, (x, y, z, d) => (d > 1.4 ? `spruce_stairs[facing=${facingTo(x, z, c, c)},half=bottom]` : TRIM));
  s.disc(c, top + 8, c, 1.4, B).set(c, top + 9, c, 'lightning_rod');
  for (const [x, z] of [[c - 3, c + 2], [c + 2, c - 3]]) s.set(x, top, z, 'iron_chain');
  s.set(c - 5, 1, c + 1, 'spirecraft:barnacles[down=true]');
  return s.save(`lighthouse/${seed}`);
}
jigsaw({ id: 'lighthouse', biomes: DOCKS, templates: [[lighthouse(1)], [lighthouse(2)]], offset: -1, spacing: 48, separation: 16, terrain: 'beard_box' });

/**
 * Sailboat (v3.4 user: like the vanilla shipwreck, no water inside, some rotten wood): a keeled hull 7 wide with a
 * pointed bow and a square stern, sealed below the waterline (template y = 2 is the top water layer); a plank deck at
 * y = 4 with rails; a raised stern deck over a little cabin; one mast with two yards and a sail; a bowsprit. Dark oak
 * and the harbour's rotten wood mixed, more rotten on the wrecks (whose damage is all above the water).
 */
function sailboat(seed, wrecked) {
  const r = rng(seed), L = 22, s = new Struct(7, 17, L + 2);
  const plank = () => (r.chance(wrecked ? 0.5 : 0.3) ? 'spirecraft:rotten_planks' : 'dark_oak_planks');
  const half = z => (z <= 1 ? 2 : z >= L - 1 ? 0 : z >= L - 6 ? Math.max(0, Math.round(3 * (L - 1 - z) / 5)) : 3);   // stern, middle, bow taper
  const stair = (b, facing) => `${b}[facing=${facing},half=top]`;
  const ST = () => (r.chance(wrecked ? 0.4 : 0.25) ? 'spirecraft:rotten_stairs' : 'dark_oak_stairs');
  for (let z = 0; z < L; z++) {
    const w = half(z), w0 = Math.max(0, w - 2), w1 = Math.max(0, w - 1);
    // v3.6 (user: the bottom was plain blocks - see the vanilla shipwreck): the hull narrows in two steps, each step's
    // outer edge an upside-down stair facing in, so the bilge turns round; the keel runs under it all
    for (let x = 3 - w0; x <= 3 + w0; x++) s.set(x, 0, z, x === 3 ? 'dark_oak_log[axis=z]' : plank());
    if (w0 < w1) { s.set(3 - w0 - 1, 0, z, stair(ST(), 'east')); s.set(3 + w0 + 1, 0, z, stair(ST(), 'west')); }
    for (let x = 3 - w1 + 1; x <= 3 + w1 - 1; x++) s.set(x, 1, z, plank());                      // the hold's floor
    if (w1 > 0) { s.set(3 - w1, 1, z, plank()); s.set(3 + w1, 1, z, plank()); }
    else s.set(3, 1, z, plank());
    for (let y = 2; y <= 4; y++) for (let x = 3 - w; x <= 3 + w; x++) {
      const side = x === 3 - w || x === 3 + w || z === 0 || w === 0;
      if (y === 4) s.set(x, y, z, x === 3 - w || x === 3 + w ? (r.chance(0.3) ? 'spirecraft:rotten_log[axis=z]' : 'dark_oak_log[axis=z]') : plank());
      else s.set(x, y, z, side ? plank() : 'air');
    }
    // where the hull is wider at y 2 than at y 1, close the step under the side (a stair, like the bilge below)
    for (let x = 3 - w; x <= 3 + w; x++) if (Math.abs(x - 3) > w1 && Math.abs(x - 3) <= w && !s.get(x, 1, z)) s.set(x, 1, z, stair(ST(), x < 3 ? 'east' : 'west'));
    for (let x = 3 - w1; x <= 3 + w1; x++) if (Math.abs(x - 3) > w0 + 1 && !s.get(x, 0, z)) s.set(x, 0, z, stair(ST(), x < 3 ? 'east' : 'west'));
  }
  // the stern and bow ends of the bottom: stairs facing back into the hull
  for (let x = 3 - half(0); x <= 3 + half(0); x++) if (x !== 3) s.set(x, 0, 0, stair(ST(), 'south'));
  // rails along the deck, gaps on the wrecks
  for (let z = 5; z < L - 1; z++) { const w = half(z); for (const x of [3 - w, 3 + w]) if (!(wrecked && r.chance(0.4))) s.set(x, 5, z, 'spirecraft:rotten_fence'); }
  // the stern deck over the cabin: walls at y 5, deck at y 6, rails at y 7; a door from the main deck, stairs up
  for (let z = 0; z <= 5; z++) for (let x = 3 - half(z); x <= 3 + half(z); x++) {
    const edge = x === 3 - half(z) || x === 3 + half(z) || z === 0 || z === 5;
    s.set(x, 5, z, edge ? plank() : 'air').set(x, 6, z, plank());
    if ((x === 3 - half(z) || x === 3 + half(z) || z === 0) && !(wrecked && r.chance(0.3))) s.set(x, 7, z, 'spirecraft:rotten_fence');
  }
  s.set(3, 5, 5, 'spirecraft:rotten_door[facing=south,half=lower,hinge=left,open=false]').set(3, 6, 5, 'dark_oak_planks');
  s.set(1, 5, 6, 'dark_oak_stairs[facing=north,half=bottom]');   // up to the stern deck
  s.set(5, 5, 4, 'barrel[facing=up]').set(1, 5, 1, 'barrel[facing=up]').chest(4, 5, 1, 'west', 'dock');
  s.set(2, 6, 3, 'lantern[hanging=false]');
  // the mast, two yards, the sail between them (torn on the wrecks)
  const mz = 12;
  for (let y = 5; y <= 16; y++) s.set(3, y, mz, y === 16 ? 'spirecraft:rotten_fence' : 'dark_oak_log[axis=y]');
  for (const y of [9, 14]) for (let x = 0; x <= 6; x++) if (x !== 3) s.set(x, y, mz, 'spirecraft:rotten_fence');
  for (let y = 10; y <= 13; y++) for (let x = 0; x <= 6; x++) if (x !== 3 && !(wrecked && r.chance(0.4)) && !(y === 10 && (x === 0 || x === 6))) s.set(x, y, mz + 1, r.chance(0.15) ? 'light_gray_wool' : 'white_wool');
  // a hatch on the deck, cargo, and the bowsprit
  s.set(3, 4, 9, 'dark_oak_trapdoor[facing=north,half=top,open=false]').set(2, 5, 16, 'barrel[facing=up]').set(4, 5, 17, 'barrel[facing=north]');
  for (let z = L; z <= L + 1; z++) s.set(3, 5, z, 'spirecraft:rotten_fence');
  s.set(3, 5, L - 1, 'dark_oak_log[axis=z]');
  return s.save(`sailboat/${seed}${wrecked ? '_w' : ''}`);
}
jigsaw({ id: 'sailboat', biomes: ['spirecraft:polluted_sea'], templates: [[sailboat(1, false), 2], [sailboat(2, true)], [sailboat(3, false)]], offset: -3, spacing: 36, separation: 12, terrain: 'none' });

// ------------------------------------------------------------------ polluted sea floor: ruins, treasury, sunken statue
const SEA_WEATHER = { 'spirecraft:dock_bricks': ['spirecraft:cracked_dock_bricks', 'spirecraft:harbour_rock', 'spirecraft:cracked_dock_bricks'] };
function seaRuin(seed, big) {
  const r = rng(seed), n = big ? 17 : 9, s = new Struct(n, big ? 9 : 6, n);
  const rooms = big ? [[0, 0, 8, 8], [8, 0, 16, 7], [0, 8, 7, 16], [7, 7, 16, 16]] : [[0, 0, 8, 8]];
  for (const [x0, z0, x1, z1] of rooms) {
    const h = r.int(3, big ? 6 : 4);
    s.fill(x0, 0, z0, x1, 0, z1, 'spirecraft:dock_bricks');
    for (let y = 1; y <= h; y++) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++)
      if (x === x0 || x === x1 || z === z0 || z === z1) s.set(x, y, z, 'spirecraft:dock_bricks');
    s.set(Math.floor((x0 + x1) / 2), 1, z0, null).set(Math.floor((x0 + x1) / 2), 2, z0, null);
    if (r.chance(0.5)) s.fill(x0, h + 1, z0, x1, h + 1, z1, (x, y, z) => (r.chance(0.5) ? 'spirecraft:harbour_rock_slab[type=bottom]' : null));
  }
  weather(s, r, SEA_WEATHER, 0.35);
  ruin(s, r, 0.25, 2);
  // the walls hold no air: open cells stay as they are (water)
  s.forEach((x, y, z, st) => { if (st === 'air') s.set(x, y, z, null); });
  for (let i = 0; i < (big ? 14 : 6); i++) {
    const x = r.int(1, n - 2), z = r.int(1, n - 2);
    if (!s.get(x, 1, z)) s.set(x, 1, z, r.pick(['spirecraft:polluted_coral_block', 'spirecraft:polluted_tube_coral', 'spirecraft:polluted_horn_coral', 'spirecraft:polluted_seagrass', 'spirecraft:polluted_coral_fan']));
  }
  s.chest(2, 1, 3, 'east', 'sea_ruins');
  if (big) {   // Sunken Treasury: a gilded vault in the far room
    s.fill(10, 1, 10, 14, 1, 14, 'spirecraft:polished_harbour_rock').set(12, 1, 12, 'gold_block').set(11, 1, 13, 'raw_gold_block');
    s.chest(13, 2, 13, 'north', 'sunken_treasury').set(11, 2, 11, 'spirecraft:polluted_horn_coral');
  }
  return s.save(`sea_ruins/${seed}${big ? '_big' : ''}`);
}
jigsaw({ id: 'sea_ruins', biomes: ['spirecraft:polluted_sea'], templates: [[seaRuin(1, false), 3], [seaRuin(2, false), 3], [seaRuin(3, true), 2]], offset: -1, heightmap: FLOOR, spacing: 20, separation: 8, terrain: 'none', step: 'underground_structures' });

/**
 * The Sunken Statue (STS2 event; v3.5 user: more human, more alive): a giant standing in the sea up to the waist or
 * more - legs apart, a belted robe, broad shoulders, a head with a face. kind 1 lifts a lantern (a sea lantern) high in
 * the right hand, the left hanging at the side; kind 2 points out to sea with the right arm, the left fist on the hip.
 * Harbour stone only (dock bricks, polished harbour rock), crusted with barnacles below.
 */
function sunkenStatue(kind) {
  const r = rng(5 + kind), s = new Struct(13, 30, 13), m = STAT.HARBOUR, c = 6, f = new Frame(s, c, 0, c, 0);
  const st = (b, fa, h = 'bottom') => `${b}[facing=${fa},half=${h}]`;
  for (let x = -4; x <= 4; x++) for (let z = -4; z <= 4; z++) {   // the plinth
    const e = Math.max(Math.abs(x), Math.abs(z));
    if (e <= 3) f.set(x, 0, z, m.bricks).set(x, 1, z, e === 3 ? st(m.stairs, facingTo(x, z, 0, 0)) : m.block);
    else if (r.chance(0.5)) f.set(x, 0, z, st(m.stairs, facingTo(x, z, 0, 0)));
  }
  // legs apart, feet forward
  for (const lx of [-2, 1]) { for (let y = 2; y <= 8; y++) f.set(lx, y, 0, m.block).set(lx + 1, y, 0, m.block); f.set(lx, 2, -1, st(m.smoothStairs, 'south')).set(lx + 1, 2, -1, st(m.smoothStairs, 'south')); }
  f.fill(-2, 9, 0, 2, 10, 1, m.bricks);                                    // hips, the robe's hem
  f.fill(-2, 11, 0, 2, 11, 1, m.cracked);                                  // a belt
  f.fill(-2, 12, 0, 2, 15, 1, m.block).fill(-3, 14, 0, 3, 15, 1, m.block); // chest and shoulders
  f.set(-3, 16, 0, st(m.stairs, 'east')).set(3, 16, 0, st(m.stairs, 'west'));
  f.set(0, 16, 0, m.wall);                                                  // the neck
  f.fill(-1, 17, -1, 1, 19, 1, m.block);                                   // the head
  f.set(-1, 18, -2, st(m.stairs, 'north', 'top')).set(1, 18, -2, st(m.stairs, 'north', 'top'));   // brows
  f.set(0, 18, -2, m.chiseled).set(0, 17, -2, st(m.smoothStairs, 'south', 'top'));                // nose, mouth
  f.fill(-1, 20, -1, 1, 20, 1, `${m.slab}[type=bottom]`).fill(-1, 17, 2, 1, 19, 2, m.bricks);      // hair, falling down the back
  // v3.6 (user): both hold a sword. kind 1 raises it high in the right hand, the left hanging; kind 2 rests both
  // hands on its pommel, the blade point-down before it to the plinth
  const BLADE = 'spirecraft:polished_harbour_rock_wall', GUARD = `${m.smoothSlab}[type=bottom]`;
  if (kind === 1) {
    for (let y = 11; y <= 14; y++) f.set(-4, y, 0, y === 11 ? st(m.stairs, 'east', 'top') : m.wall);   // the left arm hanging
    for (let y = 16; y <= 19; y++) f.set(4, y, 0, m.wall);                                             // the right arm raised
    f.set(4, 15, 0, st(m.stairs, 'west', 'top'));
    f.set(4, 20, 0, m.chiseled);                                                                       // the fist round the grip
    f.set(3, 21, 0, GUARD).set(5, 21, 0, GUARD).set(4, 21, 0, m.chiseled);                             // the crossguard
    for (let y = 22; y <= 27; y++) f.set(4, y, 0, BLADE);                                              // the blade, point up
  } else {
    f.set(-3, 13, -1, st(m.stairs, 'east', 'top')).set(3, 13, -1, st(m.stairs, 'west', 'top'));        // forearms forward
    f.set(-2, 12, -2, st(m.stairs, 'east', 'top')).set(2, 12, -2, st(m.stairs, 'west', 'top'));        // hands either side of the grip
    f.set(-1, 12, -2, m.chiseled).set(1, 12, -2, m.chiseled);
    f.set(0, 13, -2, m.chiseled);                                                                      // the pommel
    f.set(0, 12, -2, BLADE);                                                                           // the grip
    f.set(-1, 11, -2, GUARD).set(1, 11, -2, GUARD).set(0, 11, -2, m.chiseled);                         // the crossguard
    for (let y = 2; y <= 10; y++) f.set(0, y, -2, BLADE);                                              // the blade, point down
  }
  weather(s, r, { [m.bricks]: [m.cracked, 'spirecraft:harbour_rock'], [m.block]: ['spirecraft:harbour_rock', m.block, m.block] }, 0.25);
  s.forEach((x, y, z, stt) => {   // barnacles on the lower half
    if (y > 12 || !/dock_brick|harbour_rock/.test(stt) || /stairs|slab|wall/.test(stt)) return;
    for (const [dx, dz, face] of [[-1, 0, 'east'], [1, 0, 'west'], [0, -1, 'south'], [0, 1, 'north']])
      if (!s.get(x + dx, y, z + dz) && r.chance(0.3)) s.set(x + dx, y, z + dz, `spirecraft:barnacles[${face}=true]`);
  });
  f.chest(1, 2, -3, 'north', 'sunken_treasury');
  return s.save(`sunken_statue/${kind}`);
}
jigsaw({ id: 'sunken_statue', biomes: ['spirecraft:polluted_sea'], templates: [[sunkenStatue(1)], [sunkenStatue(2)]], offset: -1, heightmap: FLOOR, spacing: 64, separation: 20, terrain: 'none' });

// ------------------------------------------------------------------ Overgrowth
const OVERGROWTH = ['spirecraft:overgrowth', 'spirecraft:misty_overgrowth', 'spirecraft:mushroom_overgrowth'];
const G = 'spirecraft:gnarlwood';
/** The overgrowth rest site (v3.5 user: an ordinary camp, no tree house): two tents of green and brown wool on
 * gnarlwood poles round a campfire, log seats, a rack, barrels. */
function overgrowthCamp(seed) {
  const r = rng(seed), s = new Struct(15, 6, 15), GN = 'spirecraft:gnarlwood';
  groundPatch(s, r, 7, 7, 6.5, ['dirt_path', 'dirt_path', 'packed_mud', 'gravel']);
  s.set(7, 0, 7, 'stone').set(7, 1, 7, 'campfire[lit=true,facing=north]');
  for (const [x, z, ax] of [[7, 4, 'x'], [7, 10, 'x'], [4, 7, 'z'], [10, 7, 'z']]) if (r.chance(0.75)) s.set(x, 1, z, `spirecraft:stripped_gnarlwood_log[axis=${ax}]`);
  tent(s, 1, 1, 5, 'green_wool', r, 'overgrowth_camp', GN);
  if (r.chance(0.7)) tent(s, 9, 1, 4, 'brown_wool', r, null, GN);
  s.set(12, 1, 11, `${GN}_fence`).set(12, 2, 11, `${GN}_fence`).set(12, 3, 11, `${GN}_slab[type=bottom]`).set(12, 1, 12, `${GN}_log[axis=y]`).set(12, 2, 12, 'lantern[hanging=false]');
  s.set(2, 1, 12, `${GN}_log[axis=x]`).set(3, 1, 12, `${GN}_log[axis=x]`).set(5, 1, 12, 'barrel[facing=up]');
  return s.save(`overgrowth_camp/${seed}`);
}
jigsaw({ id: 'overgrowth_camp', biomes: OVERGROWTH, templates: [[overgrowthCamp(1)], [overgrowthCamp(2)]], offset: -1, spacing: 34, separation: 12, dry: true });

/**
 * Ceremonial beast ruins: a round court ringed by statues facing the altar - stags (the Ceremonial Beast) between
 * robed priests, praying figures and kneeling knights, some broken - with a bell on a stepped altar in the middle.
 */
function ceremonialRuins(seed) {
  const r = rng(seed), n = 29, c = 14, s = new Struct(n, 11, n), m = STAT.RUIN;
  s.disc(c, 0, c, 13.5, (x, y, z, d) => (r.chance(0.12) ? null : r.pick([m.bricks, m.bricks, 'mossy_stone_bricks', m.cracked, 'moss_block', m.block])));
  s.disc(c, 0, c, 4.5, m.chiseled);
  // the altar: two steps up, the bell on top
  s.disc(c, 1, c, 2.5, (x, y, z, d) => (d > 1.5 ? `${m.stairs}[facing=${facingTo(x, z, c, c)},half=bottom]` : m.bricks));
  s.disc(c, 2, c, 1.5, (x, y, z, d) => (d > 0.5 ? `${m.stairs}[facing=${facingTo(x, z, c, c)},half=bottom]` : m.chiseled));
  s.set(c, 3, c, 'bell[attachment=floor,facing=north]');
  for (const [x, z] of [[c - 2, c - 2], [c + 2, c + 2], [c - 2, c + 2], [c + 2, c - 2]]) s.set(x, 1, z, m.wall).set(x, 2, z, 'candle[candles=3,lit=false]');
  s.chest(c, 0, c + 3, 'south', 'ceremonial_altar');
  const kinds = [STAT.stag, STAT.priest, STAT.stag, STAT.praying, STAT.stag, STAT.knight, STAT.stag, STAT.priest, STAT.stag, STAT.praying];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + r() * 0.1, x = Math.round(c + Math.cos(a) * 11), z = Math.round(c + Math.sin(a) * 11);
    const f = new Frame(s, x, 0, z, TURNS[facingTo(x, z, c, c)]);
    if (r.chance(0.18)) { STAT.plinth(f, m); f.set(0, 1, 0, m.bricks).set(0, 2, 0, m.wall); f.set(1, 1, -1, `${m.slab}[type=bottom]`); continue; }   // fallen
    kinds[i](f, m);
  }
  weather(s, r, { [m.bricks]: ['mossy_stone_bricks', m.cracked], [m.block]: ['mossy_cobblestone', m.block, m.block] }, 0.25);
  for (let i = 0; i < 22; i++) { const x = r.int(2, 26), z = r.int(2, 26); if (!s.get(x, 1, z) && s.get(x, 0, z)) s.set(x, 1, z, r.pick(['moss_carpet', 'spirecraft:spire_fern', 'spirecraft:glow_moss_carpet', 'moss_carpet'])); }
  return s.save(`ceremonial_ruins/${seed}`);
}
jigsaw({ id: 'ceremonial_ruins', biomes: OVERGROWTH, templates: [[ceremonialRuins(11)], [ceremonialRuins(12)]], offset: -1, spacing: 64, separation: 24, terrain: 'beard_box', dry: true });

/** The Byrdonis nest (v3.5 user: a twig-nest bowl on a thatch floor, no carpets; the STS2 Byrdonis egg - big as a
 * sniffer egg, cream with raspberry spots - instead of turtle eggs). */
function byrdonisNest(seed) {
  const r = rng(seed), s = new Struct(13, 5, 13), c = 6, T = 'spirecraft:twig_nest';
  // v3.6 (user): the floor hay mixed with dirt, mud, grass and moss
  s.disc(c, 0, c, 5.5, (x, y, z, d) => (d > 5 && r.chance(0.4) ? null : d < 3.8 ? r.pick(['hay_block', 'hay_block', 'spirecraft:thatch', 'dirt', 'mud', 'grass_block', 'moss_block', 'coarse_dirt', 'hay_block']) : T));
  s.disc(c, 1, c, 5.5, (x, y, z, d) => (d > 3.8 ? (d > 5 && r.chance(0.5) ? null : T) : 'air'));
  s.disc(c, 2, c, 5.6, (x, y, z, d) => (d > 4.4 ? (r.chance(0.7) ? T : null) : 'air'));
  for (let i = 0; i < 9; i++) {   // sticks poking out of the rim
    const a = r() * Math.PI * 2, x = Math.round(c + Math.cos(a) * 5.6), z = Math.round(c + Math.sin(a) * 5.6);
    s.set(x, r.int(1, 2), z, Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? `${G}_fence` : 'spirecraft:stripped_gnarlwood_log[axis=' + (Math.abs(Math.cos(a)) > 0.5 ? 'x' : 'z') + ']');
  }
  s.set(c, 1, c, 'spirecraft:byrdonis_egg');
  if (seed % 2) s.set(c + 2, 1, c - 1, 'spirecraft:byrdonis_egg');
  if (seed % 2 === 0) s.set(c - 2, 1, c + 1, 'spirecraft:byrdonis_egg');   // (v3.6 user: no chest, only eggs)
  s.entity(c, 1, c + 2, { id: 'spirecraft:byrdonis', PersistenceRequired: true });
  return s.save(`byrdonis_nest/${seed}`);
}
jigsaw({ id: 'byrdonis_nest', biomes: OVERGROWTH, templates: [[byrdonisNest(1)], [byrdonisNest(2)]], offset: -1, spacing: 44, separation: 14, terrain: 'beard_box', dry: true });

/** Wood Carvings (STS2 event; v3.5 user: make it make sense - no bone): a carver's clearing. A ring of carved
 * gnarlwood totems (faces of stairs and trapdoors, beaks, wings), a big stump used as the workbench with a half-carved
 * block and the carver's chest, shavings (stripped wood) and logs waiting their turn. */
function woodCarvings() {
  const r = rng(21), s = new Struct(13, 7, 13), c = 6, GN = 'spirecraft:gnarlwood', ST = 'spirecraft:stripped_gnarlwood';
  groundPatch(s, r, c, c, 5.5, ['dirt_path', 'packed_mud', 'dirt_path']);
  const totem = (x, z, face, kind) => {
    const f = face;
    s.set(x, 1, z, `${GN}_log[axis=y]`).set(x, 2, z, `${ST}_wood`).set(x, 3, z, `${GN}_log[axis=y]`);
    const fx = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] }[f];
    if (kind === 0) {   // an owl: brows of trapdoors, a beak, a crest
      s.set(x + fx[0], 3, z + fx[1], `${GN}_trapdoor[facing=${f},half=top,open=false]`).set(x + fx[0], 2, z + fx[1], `${GN}_button[face=wall,facing=${f}]`);
      s.set(x, 4, z, `${GN}_slab[type=bottom]`);
    } else if (kind === 1) {   // a beast's head: stairs for the snout, ears
      s.set(x + fx[0], 2, z + fx[1], `${GN}_stairs[facing=${({ north: 'south', south: 'north', east: 'west', west: 'east' })[f]},half=top]`);
      s.set(x, 4, z, `${ST}_wood`).set(x + fx[1], 5, z + fx[0], `${GN}_fence`).set(x - fx[1], 5, z - fx[0], `${GN}_fence`);
    } else {   // a bird with spread wings
      s.set(x + fx[1], 3, z + fx[0], `${GN}_trapdoor[facing=${f},half=top,open=false]`).set(x - fx[1], 3, z - fx[0], `${GN}_trapdoor[facing=${f},half=top,open=false]`);
      s.set(x, 4, z, `${GN}_stairs[facing=${f},half=bottom]`);
    }
  };
  [[c, c - 5, 'south', 0], [c + 5, c - 1, 'west', 1], [c + 3, c + 4, 'north', 2], [c - 3, c + 4, 'north', 0], [c - 5, c - 1, 'east', 1]].forEach(([x, z, f, k]) => totem(x, z, f, k));
  // the workbench stump, a block being carved, tools and the chest
  s.set(c, 1, c, `${GN}_wood`).set(c + 1, 1, c, `${GN}_wood`).set(c, 2, c, `${GN}_stairs[facing=east,half=bottom]`).set(c + 1, 2, c, 'candle[candles=2,lit=false]');
  s.set(c - 1, 1, c + 1, 'chest[facing=east]', { id: 'minecraft:chest', LootTable: 'spirecraft:chests/wood_carvings' });
  s.set(c + 2, 1, c + 2, `${GN}_log[axis=x]`).set(c + 3, 1, c + 2, `${GN}_log[axis=x]`).set(c + 2, 2, c + 2, `${GN}_log[axis=x]`);
  for (let i = 0; i < 6; i++) { const x = r.int(3, 9), z = r.int(3, 9); if (!s.get(x, 1, z)) s.set(x, 1, z, `${ST}_wood`.replace('_wood', '_log[axis=' + r.pick(['x', 'z']) + ']').replace(`${ST}_log`, `${ST}_log`)); }
  return s.save('wood_carvings/1');
}
jigsaw({ id: 'wood_carvings', biomes: OVERGROWTH, templates: [[woodCarvings()]], offset: -1, spacing: 48, separation: 16, terrain: 'beard_box', dry: true });

/**
 * Wellspring (STS2 event; v3.5 user: no floating stones - the lip stands on a full ring of stone; the fountain really
 * pours): a round basin with a carved lip; in the middle a spout pillar with a pool on top whose water spills over all
 * four sides and falls into the basin; sea pickles glow in the water, offerings stand on the lip, and the bed is
 * suspicious sand and gravel hiding coins and the odd relic.
 */
function wellspring(seed) {
  const r = rng(seed), n = 13, c = 6, s = new Struct(n, 7, n), m = STAT.RUIN;
  s.disc(c, 0, c, 5.5, m.bricks);   // a full stone base under everything
  s.disc(c, 0, c, 4.3, () => (r.chance(0.35) ? (r.chance(0.5) ? 'suspicious_sand' : 'suspicious_gravel') : r.pick(['sand', 'gravel', 'clay'])));
  s.forEach((x, y, z, st) => { if (/suspicious/.test(st)) s.set(x, y, z, st, { id: 'minecraft:brushable_block', LootTable: 'spirecraft:chests/wellspring' }); });
  s.disc(c, 1, c, 5.5, (x, y, z, d) => (d > 4.3 ? `${m.stairs}[facing=${facingTo(x, z, c, c)},half=top]` : 'water'));
  s.disc(c, 2, c, 5.5, (x, y, z, d) => (d > 4.3 && r.chance(0.25) ? r.pick(['candle[candles=2,lit=false]', 'flower_pot', 'spirecraft:glow_shrub']) : null));
  // the spout pillar and its little pool, spilling over all four sides
  s.set(c, 0, c, m.bricks).set(c, 1, c, m.chiseled).set(c, 2, c, m.bricks).set(c, 3, c, m.chiseled).set(c, 4, c, 'water');
  for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    s.set(c + dx, 4, c + dz, 'water[level=1]');                                         // the water running off the top
    s.set(c + dx, 3, c + dz, 'water[level=8]').set(c + dx, 2, c + dz, 'water[level=8]');   // falling into the basin
  }
  for (const [x, z] of [[c - 1, c - 1], [c + 1, c + 1], [c - 1, c + 1], [c + 1, c - 1]]) s.set(x, 2, z, m.wall).set(x, 3, z, `${m.slab}[type=bottom]`);
  for (let i = 0; i < 4; i++) { const a = r() * Math.PI * 2, x = Math.round(c + Math.cos(a) * 3), z = Math.round(c + Math.sin(a) * 3); s.set(x, 1, z, 'sea_pickle[pickles=2,waterlogged=true]'); }
  return s.save(`wellspring/${seed}`);
}
loot('wellspring', [{ rolls: 1, items: [['gold_nugget', 10, 1, 5], ['emerald', 5, 1, 2], ['gold_ingot', 2], ['lapis_lazuli', 5, 1, 3], ['spirecraft:pebble', 4, 1, 3], ['#loot:spirecraft:chests/relic_common', 2], ['potion', 2, 1, 1, { potion: 'spirecraft:blood' }]] }]);
jigsaw({ id: 'wellspring', biomes: OVERGROWTH, templates: [[wellspring(23)], [wellspring(24)]], offset: -1, spacing: 40, separation: 14, terrain: 'beard_box', dry: true });

// ------------------------------------------------------------------ The Kin (v3.3): plaza, winding paths, huts under big trees, shrine
// Colours after STS2's Kin: golden ochre thatch, fired-earth (terracotta) walls on wooden posts, teal accents (their
// skin, their spirit fire: soul lanterns and a soul campfire), bone-white masks (skulls, bone), a maroon sash (red
// terracotta). Only the campfire plaza is open sky: every hut stands under a big gnarlwood tree, and there are lone big
// trees along the paths too. Paths wind from irregular points of the plaza; the pieces join by jigsaw.
// v3.5 (user): walls of fired mud (mud bricks, packed mud), not terracotta
const KIN_WALL = ['mud_bricks', 'mud_bricks', 'packed_mud', 'mud_bricks', 'packed_mud'];
const POST = 'spirecraft:stripped_gnarlwood_log[axis=y]';
const KIN_GROUND = ['dirt_path', 'packed_mud', 'dirt_path', 'gravel'];
const ENTRY = (f, x, z, orient) => f.set(x, 0, z, `jigsaw[orientation=${orient}]`, { id: 'minecraft:jigsaw', name: 'spirecraft:kin_entry', target: 'spirecraft:kin_slot', pool: 'minecraft:empty', final_state: 'minecraft:dirt_path', joint: 'rollable', selection_priority: 0, placement_priority: 0 });
const SLOT = (s, x, z, orient, pool) => s.jigsaw(x, 0, z, orient, { name: 'spirecraft:kin_slot', target: 'spirecraft:kin_entry', pool, final: 'minecraft:dirt_path' });

/** A big gnarlwood: a 2x2 trunk with flared roots, a broad flat crown of leaves with glowvines hanging. */
function bigTree(s, r, tx, tz, h, crown, cx, cz) {
  for (let y = 1; y <= h; y++) for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) s.set(tx + dx, y, tz + dz, `${G}_log[axis=y]`);
  for (const [dx, dz, ax] of [[-1, 0, 'x'], [2, 1, 'x'], [0, -1, 'z'], [1, 2, 'z']]) s.set(tx + dx, 1, tz + dz, `${G}_log[axis=${ax}]`);
  for (let y = h - 3; y <= h + 2; y++) {
    const rr = crown * Math.sqrt(Math.max(0, 1 - Math.pow((y - h + 0.5) / 3.2, 2)));
    s.disc(cx, y, cz, rr, (x, yy, z, d) => (d > rr - 1.2 && r.chance(0.25) ? null : s.get(x, y, z) && !/leaves/.test(s.get(x, y, z)) ? undefined : `${G}_leaves[persistent=true]`));
  }
  for (let i = 0; i < 12; i++) {
    const a = r() * Math.PI * 2, d = crown * (0.5 + r() * 0.45), x = Math.round(cx + Math.cos(a) * d), z = Math.round(cz + Math.sin(a) * d);
    if (s.get(x, h - 3, z)) for (let k = 1; k <= r.int(1, 4); k++) if (!s.get(x, h - 3 - k, z)) s.set(x, h - 3 - k, z, 'spirecraft:glowvine');
  }
}

function kinPlaza() {
  const r = rng(31), n = 17, c = 8, s = new Struct(n, 9, n);
  s.disc(c, 0, c, 8, (x, y, z, d) => (d > 7 && r.chance(0.5) ? null : r.pick(KIN_GROUND)));
  s.disc(c, 1, c, 8, 'air');
  // the spirit fire in a ring of stones, log seats round it (not evenly)
  s.set(c, 0, c, 'stone').set(c, 1, c, 'campfire[lit=true,facing=north]');   // v3.5: an ordinary campfire
  s.disc(c, 0, c, 1.5, (x, y, z, d) => (d > 0.5 ? 'cobblestone' : undefined));
  // paving stones laid over the plaza here and there
  // v3.6 (user: the paving did not cover the ground): the whole ring round the fire paved
  for (let x = 1; x < n - 1; x++) for (let z = 1; z < n - 1; z++) if (Math.hypot(x - c, z - c) > 1.6 && Math.hypot(x - c, z - c) < 6.6 && s.get(x, 1, z) === 'air') s.set(x, 1, z, 'spirecraft:paving_stones');
  for (const [x, z, ax] of [[c - 3, c - 1, 'z'], [c - 3, c, 'z'], [c + 3, c + 1, 'z'], [c - 1, c + 3, 'x'], [c, c + 3, 'x'], [c + 2, c - 3, 'x']]) s.set(x, 1, z, `spirecraft:stripped_gnarlwood_log[axis=${ax}]`);
  // totems: post, bone, a skull mask with a thatch fringe; teal lanterns hung from an arm
  for (const [x, z, h] of [[c - 5, c - 4, 4], [c + 5, c + 3, 5], [c - 2, c + 6, 3]]) {
    for (let y = 1; y <= h; y++) s.set(x, y, z, y === h - 1 ? 'bone_block[axis=y]' : `${G}_log[axis=y]`);
    s.set(x, h + 1, z, 'skeleton_skull[rotation=8]').set(x + 1, h - 1, z, 'spirecraft:thatch_slab[type=top]').set(x - 1, h - 1, z, 'spirecraft:thatch_slab[type=top]');
    s.set(x, h, z + 1, `${G}_fence`).set(x, h - 1, z + 1, 'copper_lantern[hanging=true]');
    s.set(x + 1, 1, z - 1, 'red_terracotta');
  }
  // a drying rack, pots, barrels
  s.set(c + 4, 1, c - 4, `${G}_fence`).set(c + 6, 1, c - 4, `${G}_fence`).set(c + 4, 2, c - 4, `${G}_fence`).set(c + 6, 2, c - 4, `${G}_fence`).set(c + 5, 2, c - 4, 'spirecraft:thatch_slab[type=bottom]');
  s.set(c - 6, 1, c + 2, 'decorated_pot[facing=east]').set(c - 6, 1, c + 3, 'barrel[facing=up]').set(c + 6, 1, c - 1, 'decorated_pot[facing=west]');
  // paths leave from five uneven points of the edge
  SLOT(s, 4, 0, 'north_up', 'spirecraft:kin/paths');
  SLOT(s, 12, 0, 'north_up', 'spirecraft:kin/paths');
  SLOT(s, n - 1, 6, 'east_up', 'spirecraft:kin/paths');
  SLOT(s, 11, n - 1, 'south_up', 'spirecraft:kin/paths');
  SLOT(s, 0, 10, 'west_up', 'spirecraft:kin/paths');
  return s.save('kin/plaza');
}

/** A path piece: 3 wide, length L, following the ground (terrain_matching); a building (or a branch) at the end. */
function kinPath(seed, L, branch) {
  const r = rng(seed), s = new Struct(3, 2, L);
  for (let z = 0; z < L; z++) for (let x = 0; x < 3; x++) s.set(x, 0, z, x === 1 ? 'dirt_path' : r.chance(0.6) ? r.pick(KIN_GROUND) : null);
  for (let z = 0; z < L; z++) s.set(1, 1, z, 'spirecraft:paving_stones');   // v3.6: a paved strip all along the middle
  ENTRY(new Frame(s, 0, 0, 0), 1, 0, 'north_up');
  SLOT(s, 1, L - 1, 'south_up', 'spirecraft:kin/buildings');
  if (branch) SLOT(s, 2, Math.floor(L / 2), 'east_up', 'spirecraft:kin/buildings');
  return s.save(`kin/path_${seed}`);
}

/**
 * A Kin hut under its tree (v3.4 user: every roof a dome, flatter, mostly slabs; the posts must reach the roof). Round
 * or oval walls of fired earth between wooden posts that rise into the roof, a low thatch dome built in half-block
 * steps right over the walls (overhanging one block), a skull-masked finial. kind: small / round / big / oval.
 */
function kinHut(seed, kind) {
  const n = kind === 'ritual' ? 17 : 15, r = rng(seed), s = new Struct(n, 22, n), cx = Math.floor(n / 2);
  const wall = () => r.pick(KIN_WALL);
  const [rx, rz, H] = { small: [2.6, 2.6, 2], round: [3.4, 3.4, 3], big: [4.3, 4.3, 3], oval: [4.6, 3.2, 3], ritual: [5.2, 5.2, 4] }[kind];
  const cz = Math.ceil(rz) + 1;
  const inEll = (x, z, ax, az) => ((x - cx) / ax) ** 2 + ((z - cz) / az) ** 2 <= 1;
  const ring = (x, z) => inEll(x, z, rx + 0.5, rz + 0.5) && !inEll(x, z, rx - 0.5, rz - 0.5);
  for (let x = 0; x < n; x++) for (let z = 0; z < n; z++) {
    if (!inEll(x, z, rx + 0.5, rz + 0.5)) continue;
    s.set(x, 0, z, 'packed_mud');
    for (let y = 1; y <= H; y++) {
      if (!ring(x, z)) { s.set(x, y, z, 'air'); continue; }
      const post = (Math.round(Math.atan2(z - cz, x - cx) / (Math.PI / 4)) * (Math.PI / 4) - Math.atan2(z - cz, x - cx)) ** 2 < 0.02;
      s.set(x, y, z, post ? POST : y === H && H > 2 ? 'cyan_terracotta' : wall());
    }
  }
  // the dome: height in half blocks falls off with the distance from the middle; eaves one block beyond the walls
  const ex = rx + 1.4, ez = rz + 1.4;
  for (let x = 0; x < n; x++) for (let z = 0; z < n; z++) {
    const d2 = ((x - cx) / ex) ** 2 + ((z - cz) / ez) ** 2;
    if (d2 > 1) continue;
    const halves = 1 + Math.round(4 * (1 - d2));   // 1..5 half blocks: a low dome
    let y = H + 1;
    for (let k = 0; k + 2 <= halves; k += 2) s.set(x, y++, z, 'spirecraft:thatch');
    if (halves % 2) s.set(x, y, z, 'spirecraft:thatch_slab[type=bottom]');
    if (d2 > 0.7 && halves <= 2 && !inEll(x, z, rx + 0.5, rz + 0.5)) s.set(x, H + 1, z, 'spirecraft:thatch_slab[type=bottom]');   // the eave
  }
  // posts run on up into the dome
  s.forEach((x, y, z, st) => { if (st === POST && y === H) s.set(x, H + 1, z, POST); });
  const top = H + 3;
  // v3.6 (user: the skull post floated): the post stands in the dome's top course (a full thatch block under it)
  s.set(cx, top, cz, `${G}_fence`).set(cx, top + 1, cz, 'skeleton_skull[rotation=8]');
  // the door and the inside
  const fz = cz - Math.round(rz);
  s.set(cx, 1, fz, 'air').set(cx, 2, fz, 'air').set(cx, 0, fz, 'dirt_path');
  for (let z = 0; z < fz; z++) s.set(cx, 0, z, 'dirt_path');
  if (kind !== 'ritual') s.set(cx - 1, 1, cz + 1, 'brown_carpet').set(cx - 1, 1, cz, 'brown_carpet').chest(cx + 1, 1, cz + 1, 'west', 'kin_hut');
  if (kind !== 'small' && kind !== 'ritual') s.set(cx + 1, 1, cz - 1, 'decorated_pot[facing=north]').set(cx - 1, 1, cz - 1, 'candle[candles=2,lit=true]');
  if (kind === 'ritual') {
    // the ritual hut (v3.5 user: an ordinary hut, bigger, with its own inside): a stepped altar with candles and a soul
    // fire, skull-masked posts, carpets of teal and red, the priest's cache
    s.set(cx, 1, cz + 2, 'spirecraft:chiseled_ruin_stone_bricks').set(cx - 1, 1, cz + 2, 'spirecraft:ruin_stone_brick_stairs[facing=east,half=bottom]').set(cx + 1, 1, cz + 2, 'spirecraft:ruin_stone_brick_stairs[facing=west,half=bottom]');
    s.set(cx, 2, cz + 2, 'campfire[lit=true,facing=north]').set(cx - 1, 2, cz + 2, 'candle[candles=4,lit=true]').set(cx + 1, 2, cz + 2, 'candle[candles=3,lit=true]');
    for (const [x, z] of [[cx - 3, cz - 1], [cx + 3, cz - 1], [cx - 3, cz + 2], [cx + 3, cz + 2]]) s.set(x, 1, z, `${G}_log[axis=y]`).set(x, 2, z, 'bone_block[axis=y]').set(x, 3, z, 'skeleton_skull[rotation=8]');
    for (let x = cx - 2; x <= cx + 2; x++) for (let z = cz - 2; z <= cz + 1; z++) if (s.get(x, 1, z) === 'air') s.set(x, 1, z, (x + z) % 2 ? 'cyan_carpet' : 'red_carpet');
    s.chest(cx + 2, 1, cz + 3, 'west', 'kin_shrine').set(cx, H, cz, 'copper_lantern[hanging=true]');
  } else if (kind === 'big' || kind === 'oval') s.set(cx, 0, cz, 'stone').set(cx, 1, cz, 'campfire[lit=true,facing=north]').set(cx + 2, 1, cz, 'fletching_table');
  else s.set(cx, H, cz, 'copper_lantern[hanging=true]');
  s.set(cx + 2, 1, 0, `${G}_fence`).set(cx + 2, 2, 0, `${G}_fence`).set(cx + 2, 3, 0, 'copper_lantern[hanging=false]');
  // the tree behind, its crown over the roof
  const back = cz + Math.round(rz) + 1;
  bigTree(s, r, cx - 1 + r.int(-2, 1), Math.min(n - 3, back + 1), top + 6 + r.int(0, 3), 6.2, cx, Math.min(n - 7, back - 2));
  ENTRY(new Frame(s, 0, 0, 0), cx, 0, 'north_up');
  return s.save(`kin/hut_${kind}_${seed}`);
}

/** A lone big tree by a path (only for shade: the village stands under a canopy). */
function kinTree(seed) {
  const r = rng(seed), s = new Struct(15, 22, 15);
  s.set(7, 0, 0, 'dirt_path');
  bigTree(s, r, 6, 6, 15 + r.int(0, 3), 6.8, 7, 7);
  ENTRY(new Frame(s, 0, 0, 0), 7, 0, 'north_up');
  return s.save(`kin/tree_${seed}`);
}

/** (v3.5: the ritual house is a big hut above ground now - kinHut(.., 'ritual').) */
function kinShrine() {
  return null;
}
{
  const P = 'terrain_matching';
  jigsaw({
    id: 'kin_village', biomes: ['spirecraft:overgrowth', 'spirecraft:mushroom_overgrowth'], templates: [[kinPlaza()]], offset: -1, size: 6, maxDist: 70,
    spacing: 60, separation: 24, terrain: 'beard_thin', dry: true,
    pools: {
      'kin/paths': [[kinPath(1, 5, false), 2, P], [kinPath(2, 7, false), 2, P], [kinPath(3, 10, false), 1, P], [kinPath(4, 8, true), 3, P]],
      'kin/buildings': [[kinHut(11, 'round'), 3], [kinHut(12, 'small'), 3], [kinHut(13, 'big'), 2], [kinHut(14, 'oval'), 2], [kinHut(15, 'round'), 2],
        [kinHut(16, 'ritual'), 1], [kinHut(17, 'small'), 2], [kinTree(21), 2], [kinTree(22), 1], [kinPath(5, 6, true), 2, 'terrain_matching']],
    },
  });
}

// ------------------------------------------------------------------ Hive cave templates (placed by the TemplateFeature)
/**
 * The beekeeper's mound (v3.5 user: a room inside an irregular earth mound, like a small cave - not a box): a lumpy
 * mound of hive soil on the cave floor with a hollow, uneven room in it, reached by a low tunnel; hiveshroom-wood
 * furniture, a lantern on a chain, torch posts by the door, a comb nest at its side. Template y = 0 is the floor layer.
 * (The second kind is dug into the rock: worldgen/SpireStructures "beekeeper_hollow".)
 */
function beekeeper(seed) {
  const r = rng(seed), s = new Struct(19, 10, 17), W = 'spirecraft:hiveshroom', cx = 8, cz = 9;
  const n = (x, z) => 0.9 * Math.sin(x * 0.7 + seed) + 0.7 * Math.cos(z * 0.6 - seed) + (r() - 0.5) * 0.6;
  // the mound
  for (let x = 0; x < 17; x++) for (let z = 1; z < 17; z++) {
    const d2 = ((x - cx) / 8) ** 2 + ((z - cz) / 7.5) ** 2;
    if (d2 > 1) continue;
    const top = Math.round(7.5 * Math.sqrt(1 - d2) + n(x, z) * 0.6);
    for (let y = 0; y <= top; y++) s.set(x, y, z, y === top ? r.pick(['spirecraft:hive_soil', 'spirecraft:hive_mycelium', 'spirecraft:hive_soil']) : r.pick(['spirecraft:hive_soil', 'spirecraft:hive_soil', 'spirecraft:packed_hive_soil', 'spirecraft:hive_rock']));
  }
  // the room: an uneven hollow
  for (let x = 2; x < 15; x++) for (let z = 3; z < 15; z++) for (let y = 1; y <= 5; y++) {
    const e = ((x - cx) / 5.4) ** 2 + ((y - 1.2) / 3.6) ** 2 + ((z - cz) / 4.6) ** 2 + 0.12 * Math.sin(x * 1.1 + z * 0.8 + y);
    if (e < 1) s.set(x, y, z, 'air');
  }
  for (let x = 3; x < 14; x++) for (let z = 4; z < 15; z++) if (s.get(x, 1, z) === 'air') s.set(x, 0, z, r.pick(['spirecraft:packed_hive_soil', 'spirecraft:hive_soil_bricks']));
  // the tunnel in from the front, low and narrow
  for (let z = 0; z <= 5; z++) for (let y = 1; y <= 2; y++) s.set(cx, y, z, 'air');
  s.set(cx, 3, 1, 'spirecraft:hive_rock_brick_stairs[facing=south,half=top]');
  // furniture (only where the floor is open)
  const put = (x, z, st, y = 1) => { if (s.get(x, y, z) === 'air') s.set(x, y, z, st); };
  put(4, 9, 'red_bed[facing=south,part=head,occupied=false]'); put(4, 8, 'red_bed[facing=south,part=foot,occupied=false]');
  put(5, 11, 'barrel[facing=up]'); put(11, 7, 'crafting_table'); put(12, 8, 'smoker[facing=west,lit=false]');
  put(8, 10, `${W}_fence`); put(9, 10, `${W}_fence`); put(8, 10, `${W}_pressure_plate`, 2); put(9, 10, 'candle[candles=3,lit=true]', 2);
  put(8, 11, `${W}_stairs[facing=north,half=bottom]`); put(10, 10, `${W}_stairs[facing=west,half=bottom]`);
  put(12, 11, 'cauldron'); put(11, 12, 'barrel[facing=up]');
  if (s.get(10, 1, 12) === 'air') s.chest(10, 1, 12, 'north', 'beekeeper');
  for (let y = 5; y >= 3; y--) if (s.get(cx, y, cz) === 'air' && s.get(cx, y + 1, cz) !== 'air') { s.set(cx, y, cz, 'iron_chain').set(cx, y - 1, cz, 'lantern[hanging=true]'); break; }
  // torch posts by the door
  for (const x of [cx - 2, cx + 2]) s.set(x, 1, 0, 'spirecraft:chiseled_hive_rock_bricks').set(x, 2, 0, 'spirecraft:hive_rock_brick_wall').set(x, 3, 0, 'torch');
  // the comb nest at the side
  for (let x = 14; x <= 18; x++) for (let y = 0; y <= 4; y++) for (let z = 1; z <= 6; z++) {
    const d = Math.hypot((x - 16) / 2.4, (y - 2) / 2, (z - 3.5) / 2.6);
    if (d <= 1) s.set(x, y, z, d < 0.55 ? (y <= 1 ? 'spirecraft:hive_cache' : 'honey_block') : r.chance(0.12) ? 'honey_block' : 'spirecraft:hive_comb');
  }
  return s.save(`hive/beekeeper_${seed}`);
}
const beekeeperTemplates = [beekeeper(1), beekeeper(2)];


/** Bowl bug nest (v3.6 user: the outside all hardened (webbed) hive soil; silk and stone only inside, a few; the eggs
 * in one small clutch): a bowl of webbed hive soil on a webbed-soil floor. */
function bowlbugNest(seed) {
  const r = rng(seed), s = new Struct(9, 4, 9), c = 4, W = 'spirecraft:webbed_hive_soil', SILK = 'spirecraft:silk_hive';
  s.disc(c, 0, c, 4.3, W);
  s.disc(c, 1, c, 4.3, (x, y, z, d) => (d > 3.2 ? W : 'air'));
  s.disc(c, 2, c, 4.3, (x, y, z, d) => (d > 3.6 ? (r.chance(0.8) ? W : null) : null));
  // inside: a lining of silk here and there against the wall, a stone or two, the clutch of eggs on one side
  s.disc(c, 1, c, 3.2, (x, y, z, d) => (d > 2.4 && r.chance(0.3) ? SILK : d > 2.4 && r.chance(0.1) ? 'cobblestone' : 'air'));
  const ex = c + (seed % 2 ? 1 : -1), ez = c + 1;
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1], [-1, 0]].slice(0, 3 + (seed % 3))) s.set(ex + dx, 1, ez + dz, 'spirecraft:hive_egg');
  s.set(c, 1, 0, null).set(c, 1, 1, 'air');
  return s.save(`hive/bowlbug_nest_${seed}`);
}
/** Scrap pile (v3.5 user): mostly junk blocks and mud, a few brass (automaton alloy) blocks and core crystals, iron
 * things (bars, chains, rods, an anvil, trapdoors) stuck in its surface and buried inside, a bug carcass or two. */
function scrapPile(seed) {
  const r = rng(seed), s = new Struct(11, 6, 11), c = 5;
  const bulk = ['spirecraft:junk_block', 'spirecraft:junk_block', 'spirecraft:junk_block', 'spirecraft:junk_block', 'mud', 'packed_mud', 'coarse_dirt'];
  const rare = ['spirecraft:derelict_automaton_alloy_block', 'spirecraft:tarnished_automaton_alloy_block', 'spirecraft:automaton_alloy_block', 'spirecraft:cracked_core_crystal_block', 'iron_block'];
  const iron = ['iron_bars', 'iron_chain', 'lightning_rod', 'iron_trapdoor[facing=north,half=bottom,open=false]', 'hopper', 'chipped_anvil[facing=north]', 'cauldron', 'heavy_weighted_pressure_plate'];
  for (let x = 0; x < 11; x++) for (let z = 0; z < 11; z++) {
    const d = Math.hypot(x - c, z - c);
    const h = Math.floor(4.2 - d * 0.85 + r() * 1.3);
    for (let y = 0; y < h; y++) s.set(x, y, z, r.chance(0.08) ? r.pick(rare) : r.chance(0.04) ? 'spirecraft:core_crystal_block' : r.pick(bulk));
    if (h >= 0 && h < 6 && d < 5.5 && r.chance(0.35)) s.set(x, Math.max(h, 0), z, r.pick(iron));
  }
  s.chest(c, 1, c - 3, 'north', 'scrap_pile').set(c, 2, c - 3, null);
  return s.save(`hive/scrap_pile_${seed}`);
}
/** (v3.5: the fungus shrine is carved into the rock now - worldgen/SpireStructures "mycelium_shrine".) */
function myceliumShrine() {
  return null;
}
/**
 * The field of man-sized holes (STS2 event; v3.5 user: no floating floor - only the holes are cut, so the ground stays
 * the cave's own; a chamber under them): man-shaped shafts cut down through the floor into a buried room of hive rock
 * bricks with a chest, skulls, candles, pots and suspicious gravel heaped where the shafts come down. Template y = 9 is
 * the first air above the cave floor (sink 9), y = 8 the floor itself.
 */
function holes(seed) {
  const r = rng(seed), s = new Struct(13, 9, 13), RB = 'spirecraft:hive_rock_bricks';
  // the chamber: y 0..5, inside 1..4
  s.room(1, 0, 1, 11, 5, 11, (x, y, z) => r.pick([RB, RB, 'spirecraft:cracked_hive_rock_bricks', 'spirecraft:hive_rock']));
  s.fill(2, 0, 2, 10, 0, 10, () => r.pick(['spirecraft:packed_hive_soil', 'spirecraft:hive_soil_bricks']));
  for (const [x, z] of [[2, 2], [10, 2], [2, 10], [10, 10]]) s.fill(x, 1, z, x, 4, z, 'spirecraft:chiseled_hive_rock_bricks');
  s.chest(6, 1, 9, 'north', 'holes_chamber');
  s.set(4, 1, 10, 'skeleton_skull[rotation=8]').set(8, 1, 10, 'skeleton_skull[rotation=8]').set(3, 1, 6, 'decorated_pot[facing=east]').set(9, 1, 4, 'decorated_pot[facing=west]');
  s.set(5, 1, 10, 'candle[candles=3,lit=false]').set(7, 1, 10, 'candle[candles=2,lit=false]').set(3, 1, 3, 'cobweb').set(9, 3, 9, 'cobweb');
  // the shafts: man-shaped (a 1x2 body, shoulders one block wider at the top), from the floor down into the room
  const spots = [[3, 3, true], [7, 3, false], [4, 7, false], [8, 7, true], [6, 5, true]];
  for (const [x, z, ax] of spots.slice(0, 4 + r.int(0, 1))) {
    const cells = ax ? [[0, 0], [1, 0]] : [[0, 0], [0, 1]];
    for (const [dx, dz] of cells) {
      for (let y = 5; y <= 8; y++) s.set(x + dx, y, z + dz, 'air');
      s.set(x + dx, 1, z + dz, 'suspicious_gravel', { id: 'minecraft:brushable_block', LootTable: 'spirecraft:chests/holes' });
    }
    if (ax) s.set(x - 1, 8, z, 'air').set(x + 2, 8, z, 'air'); else s.set(x, 8, z - 1, 'air').set(x, 8, z + 2, 'air');
  }
  return s.save(`hive/holes_${seed}`);
}
const hiveTemplates = {
  bowlbug_nest: [bowlbugNest(1), bowlbugNest(2), bowlbugNest(3)],
  scrap_pile: [scrapPile(1), scrapPile(2)],
  holes: [holes(1), holes(2)],
};

/**
 * Dock pier (v3.3 user: 3-4 wide, running out from the land, posts driven into the sea bed): placed by the
 * TemplateFeature at a shore - z = 0 stands on the land, +z points out over the water; the deck is at y = D (one above
 * the water). v3.4 (user): the harbour's own wood - rotten planks (some dark oak) between rotten log beams, rotten log
 * posts in pairs every three blocks reaching D blocks down,
 * rope (fence) railings with gaps, lanterns, bollards, barrels and a crate at the end.
 */
function pier(seed, L) {
  const r = rng(seed), W = 4, D = 14, s = new Struct(W, D + 4, L);
  for (let z = 0; z < L; z++) {
    for (let x = 0; x < W; x++) {
      const edge = x === 0 || x === W - 1;
      s.set(x, D, z, z > 3 && r.chance(0.06) ? 'air' : edge ? 'spirecraft:rotten_log[axis=z]' : r.chance(0.2) ? 'dark_oak_planks' : 'spirecraft:rotten_planks');
    }
    if (z % 3 === 1) for (const x of [0, W - 1]) {
      for (let y = 0; y < D; y++) s.set(x, y, z, 'spirecraft:rotten_log[axis=y]');
      s.set(x, D + 1, z, 'spirecraft:rotten_fence');
      if (z % 6 === 4) s.set(x, D + 2, z, 'lantern[hanging=false]');
    } else for (const x of [0, W - 1]) if (z > 2 && r.chance(0.75)) s.set(x, D + 1, z, 'spirecraft:rotten_fence');
  }
  // the head of the pier: a wider landing, bollards, cargo
  s.set(1, D + 1, L - 1, 'barrel[facing=up]').set(2, D + 1, L - 1, 'barrel[facing=north]').set(1, D + 2, L - 1, 'barrel[facing=up]');
  s.chest(2, D + 1, L - 2, 'west', 'dock');
  s.set(0, D + 1, L - 1, 'spirecraft:rotten_fence').set(3, D + 1, L - 1, 'spirecraft:rotten_fence').set(1, D + 1, L - 4, 'iron_chain').set(2, D + 1, 5, 'cobweb');
  for (let z = 1; z < L; z += 3) s.set(0, D - 3, z, 'spirecraft:barnacles[west=true]').set(W - 1, D - 2, z, 'spirecraft:barnacles[east=true]');
  return s.save(`dock_pier/${seed}`);
}
const pierTemplates = [pier(1, 16), pier(2, 20), pier(3, 13)];

// sword statues for the stepped-fall pools (StructureFeatures.swordStatue): 5x5, front -z, local (2,0,2) = islet centre
for (const [i, fn, mat] of [[1, STAT.swordBearer, STAT.STONE], [2, STAT.swordKnight, STAT.STONE], [3, STAT.swordKing, STAT.STONE]]) {
  const st = new Struct(5, 9, 6), f = new Frame(st, 2, 0, 3, 0);
  fn(f, mat);
  weather(st, rng(i), { stone_bricks: ['mossy_stone_bricks', 'cracked_stone_bricks', 'stone_bricks'], stone: ['mossy_cobblestone', 'stone', 'stone'] }, 0.3);
  st.save(`sword_statue/${i}`);
}

// v3.4: the terrain-fitted structures as real structures (worldgen/SpireStructures), so /locate finds them
const HIVES = ['spirecraft:hive_caves', 'spirecraft:egg_hive_caves'], ALL_HIVES = [...HIVES, 'spirecraft:sparse_hive_caves'];
function special(id, type, biomes, spacing, separation, extra) {
  writeJson(`tags/worldgen/biome/has_structure/${id}.json`, { values: biomes });
  writeJson(`worldgen/structure/${id}.json`, Object.assign({ type, biomes: `#spirecraft:has_structure/${id}`,
    step: type === 'spirecraft:carved' ? 'underground_structures' : extra.mode === 'shore' || extra.mode === 'open_ground' ? 'surface_structures' : 'underground_decoration',
    spawn_overrides: {}, terrain_adaptation: 'none' }, extra));
  writeJson(`worldgen/structure_set/${id}.json`, { structures: [{ structure: `spirecraft:${id}`, weight: 1 }],
    placement: { type: 'minecraft:random_spread', spacing, separation, salt: [...id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 7) & 0x7fffffff } });
}
special('beekeeper', 'spirecraft:cave_template', HIVES, 12, 4, { templates: beekeeperTemplates, mode: 'cave_floor', sink: 1, min_y: -40, max_y: 40 });
special('bowlbug_nest', 'spirecraft:cave_template', HIVES, 6, 2, { templates: hiveTemplates.bowlbug_nest, mode: 'cave_floor', sink: 1, min_y: -50, max_y: 40 });
special('scrap_pile', 'spirecraft:cave_template', HIVES, 8, 3, { templates: hiveTemplates.scrap_pile, mode: 'cave_floor', sink: 1, min_y: -50, max_y: 40 });
special('mycelium_shrine', 'spirecraft:carved', ['spirecraft:sparse_hive_caves', 'spirecraft:hive_caves'], 10, 4, { kind: 'mycelium_shrine', min_y: -40, max_y: 30 });
special('beekeeper_hollow', 'spirecraft:carved', HIVES, 14, 5, { kind: 'beekeeper_hollow', min_y: -30, max_y: 30 });
special('man_sized_holes', 'spirecraft:cave_template', ALL_HIVES, 9, 3, { templates: hiveTemplates.holes, mode: 'cave_floor', sink: 9, min_y: -50, max_y: 40 });
special('dock_pier', 'spirecraft:cave_template', ['spirecraft:stone_forest_docks', 'spirecraft:beach_docks'], 7, 2, { templates: pierTemplates, mode: 'shore', sink: 14 });
special('web_nest', 'spirecraft:carved', ALL_HIVES, 12, 5, { kind: 'web_nest', min_y: -40, max_y: 30 });
special('kaiser_crab_cave','spirecraft:carved', ALL_HIVES, 44, 18, { kind: 'kaiser_cave', min_y: -36, max_y: 0 });

// ------------------------------------------------------------------ Ascender buildings (v3.7, issue #30)
/** Ironclad camp (fire and blood): a palisaded war camp in the badlands / savanna. Abandoned - the Ironclad went on to
 * the Spire. A stone forge with a smoking chimney and a stock of brimstone (north), the commander's tent with the main
 * chest (west), two soldiers' tents (east), a tall flagpole with a red-and-black flag in the middle, a fire pit, training
 * dummies and weapon racks by the south gate. */
loot('ironclad_camp', [
  { rolls: [4, 7], items: [['spirecraft:brimstone', 12, 3, 8], ['iron_ingot', 8, 1, 4], ['gunpowder', 8, 2, 6], ['coal', 6, 2, 6], ['iron_nugget', 6, 3, 9], ['leather', 4, 1, 3], ['bread', 4, 1, 3], ['blaze_powder', 2, 1, 2]] },
  { rolls: [1, 2], items: [potion('blood', 4), potion('strength', 2), ['empty', 3]] },
  { rolls: 1, items: [['empty', 70], ['spirecraft:bludgeon', 6], ['spirecraft:morning_star', 6], ['spirecraft:bloodletting_dagger', 6], ['spirecraft:cleaver', 6], ['spirecraft:tank_shield', 4], ['spirecraft:infernal_blade', 2]] },
  { rolls: 1, items: [['empty', 95], ['spirecraft:red_skull', 3], ['spirecraft:burning_blood', 2]] },
]);
loot('ironclad_supply', [
  { rolls: [2, 5], items: [['coal', 10, 1, 5], ['iron_nugget', 8, 2, 7], ['arrow', 6, 3, 10], ['bread', 6, 1, 3], ['cooked_beef', 5, 1, 3], ['leather', 5, 1, 3], ['string', 4, 1, 4], ['spirecraft:brimstone', 3, 1, 2], ['torch', 5, 2, 6]] },
]);
function ironcladCamp(seed) {
  const r = rng(seed), n = 31, c = 15, s = new Struct(n, 19, n);
  const BB = 'polished_blackstone_bricks', DB = 'deepslate_bricks';
  const inRing = (x, z) => Math.hypot(x - c, z - c) <= 12.6;
  // clear the inside (hills, plants) and lay a trodden floor. v3.7 (user: sticks lying around): no red sand / coarse dirt
  // on the floor - dead bushes grow on those, and they break into sticks when the ground under them changes
  const FLOOR = ['dirt_path', 'dirt_path', 'packed_mud', 'gravel', 'packed_mud', 'mud_bricks'];
  for (let x = 0; x < n; x++) for (let z = 0; z < n; z++) {
    const d = Math.hypot(x - c, z - c);
    if (d > 13.6) continue;
    s.set(x, 0, z, r.pick(FLOOR));
    for (let y = 1; y < 12; y++) s.set(x, y, z, 'air');
  }
  // the palisade: a ring of spruce stakes of uneven height (v3.7 user: no fence rails on top, low enough to see in),
  // a few broken; the gate (+z) is turned to the open side by the structure
  s.disc(c, 0, c, 13.6, (x, y, z) => {
    if (z > c && Math.abs(x - c) <= 1) return;                    // the gateway
    const gatePost = z > c && Math.abs(x - c) === 2;
    const broken = !gatePost && r.chance(0.12);
    const h = gatePost ? 5 : broken ? r.int(1, 2) : r.int(3, 4);
    s.set(x, 0, z, 'packed_mud');
    for (let k = 1; k <= h; k++) s.set(x, k, z, r.chance(0.7) ? 'spruce_log[axis=y]' : 'stripped_spruce_log[axis=y]');
    if (gatePost) s.set(x, h + 1, z, 'campfire[lit=true,facing=south]');   // braziers on the gate posts
  }, 12.6);
  // a path from the gate to the flagpole
  for (let z = c + 2; z <= n - 1; z++) for (let x = c - 1; x <= c + 1; x++) if (Math.hypot(x - c, z - c) <= 13.6) s.set(x, 0, z, r.chance(0.8) ? 'dirt_path' : 'gravel');

  // the forge (north): a hearth of deepslate over magma, a chimney with a campfire inside so it always smokes
  for (let x = c - 4; x <= c + 4; x++) for (let z = 4; z <= 9; z++) s.set(x, 0, z, r.chance(0.7) ? BB : 'blackstone');
  s.fill(c - 3, 1, 4, c + 3, 3, 4, DB);                           // back wall
  s.fill(c - 3, 1, 5, c - 3, 3, 6, DB).fill(c + 3, 1, 5, c + 3, 3, 6, DB);
  s.fill(c - 2, 1, 5, c + 2, 1, 6, DB);
  s.fill(c - 1, 1, 5, c + 1, 1, 5, 'magma_block');
  s.fill(c - 2, 2, 5, c + 2, 3, 6, 'air');
  s.fill(c - 2, 2, 5, c - 2, 3, 6, DB).fill(c + 2, 2, 5, c + 2, 3, 6, DB);
  s.fill(c - 3, 4, 4, c + 3, 4, 6, `${BB.replace('bricks', 'brick')}_slab[type=bottom]`);
  s.fill(c - 1, 4, 4, c + 1, 9, 6, DB);                           // the chimney, hollow in the middle
  for (let y = 5; y <= 9; y++) s.set(c, y, 5, 'air');
  s.set(c, 4, 5, 'campfire[lit=true,facing=south]');
  for (const [x, z] of [[c - 1, 4], [c + 1, 4], [c - 1, 6], [c + 1, 6]]) s.set(x, 10, z, 'polished_blackstone_wall');
  s.set(c - 3, 1, 6, 'blast_furnace[facing=south,lit=false]');
  s.set(c - 3, 1, 8, 'chipped_anvil[facing=east]').set(c - 2, 1, 8, 'water_cauldron[level=3]');
  s.set(c + 3, 1, 8, 'grindstone[face=floor,facing=north]').set(c + 2, 1, 8, 'smithing_table');
  // the brimstone stock and coal by the forge
  s.set(c + 4, 1, 4, 'coal_block').set(c + 4, 1, 5, 'spirecraft:brimstone_block').set(c + 4, 1, 6, 'spirecraft:brimstone_block').set(c + 4, 2, 5, 'spirecraft:brimstone_block');
  s.set(c + 5, 1, 5, 'spirecraft:brimstone_block').barrel(c + 5, 1, 7, 'up', 'ironclad_supply');
  weather(s, r, { [DB]: ['cracked_deepslate_bricks'], [BB]: ['cracked_polished_blackstone_bricks'] }, 0.25);

  // tents (v3.7 user: big enough to walk into and open the chest): 7 wide, walls 2 high, a pitched roof to a ridge 5 up,
  // a plank floor, the back closed and the front open. `front` is the open end ('south' = +z).
  const militaryTent = (x0, z0, len, front, wool, ridge) => {
    const z1 = z0 + len - 1, back = front === 'south' ? z0 : z1;
    for (let z = z0; z <= z1; z++) {
      for (let x = x0 + 1; x <= x0 + 5; x++) { s.set(x, 0, z, 'spruce_planks'); s.set(x, 1, z, 'air').set(x, 2, z, 'air'); }
      s.set(x0, 1, z, wool).set(x0, 2, z, wool).set(x0 + 6, 1, z, wool).set(x0 + 6, 2, z, wool);
      s.set(x0 + 1, 3, z, wool).set(x0 + 5, 3, z, wool).set(x0 + 2, 4, z, wool).set(x0 + 4, 4, z, wool).set(x0 + 3, 5, z, ridge);
      s.set(x0 + 2, 3, z, 'air').set(x0 + 3, 3, z, 'air').set(x0 + 4, 3, z, 'air').set(x0 + 3, 4, z, 'air');
    }
    for (let x = x0 + 1; x <= x0 + 5; x++) s.set(x, 1, back, wool).set(x, 2, back, wool);
    s.set(x0 + 2, 3, back, wool).set(x0 + 3, 3, back, wool).set(x0 + 4, 3, back, wool).set(x0 + 3, 4, back, wool);
    // the front corners are dark oak poles; a lantern hangs from the ridge
    const fz = front === 'south' ? z1 : z0;
    s.set(x0, 1, fz, 'dark_oak_fence').set(x0, 2, fz, 'dark_oak_fence').set(x0 + 6, 1, fz, 'dark_oak_fence').set(x0 + 6, 2, fz, 'dark_oak_fence');
    s.set(x0 + 3, 4, z0 + (len >> 1), 'lantern[hanging=true]');
    const step = front === 'south' ? 1 : -1, bz = back + step;   // the inside row against the back wall
    const facing = front === 'south' ? 'south' : 'north', toBack = front === 'south' ? 'north' : 'south';
    return { bz, step, facing, toBack };
  };
  // the commander's tent (west, red with a black ridge): the main chest, a map table and his seat, a bed, a red carpet
  {
    const x0 = 4, t = militaryTent(x0, 11, 7, 'south', 'red_wool', 'black_wool');
    s.chest(x0 + 1, 1, t.bz, t.facing, 'ironclad_camp');
    s.set(x0 + 3, 1, t.bz, 'cartography_table').set(x0 + 3, 1, t.bz + t.step, `dark_oak_stairs[facing=${t.facing},half=bottom]`);
    s.set(x0 + 5, 1, t.bz, `red_bed[facing=${t.toBack},part=head]`).set(x0 + 5, 1, t.bz + t.step, `red_bed[facing=${t.toBack},part=foot]`);
    for (let k = 2; k <= 4; k++) s.set(x0 + 3, 1, t.bz + t.step * k, 'red_carpet');
  }
  // two soldiers' tents (east), their open ends facing each other across a lane: two beds each and a barrel
  for (const [z0, front, wool, ridge, loot] of [[9, 'south', 'black_wool', 'red_wool', 'ironclad_supply'], [17, 'north', 'red_wool', 'black_wool', null]]) {
    const x0 = 19, t = militaryTent(x0, z0, 6, front, wool, ridge);
    for (const x of [x0 + 1, x0 + 5]) s.set(x, 1, t.bz, `red_bed[facing=${t.toBack},part=head]`).set(x, 1, t.bz + t.step, `red_bed[facing=${t.toBack},part=foot]`);
    if (loot) s.barrel(x0 + 3, 1, t.bz, 'up', loot); else s.set(x0 + 3, 1, t.bz, 'barrel[facing=up]');
  }
  const banner = (x, z, rot) => s.set(x, 1, z, `red_banner[rotation=${rot}]`, { id: 'minecraft:banner', patterns: [{ pattern: 'minecraft:stripe_middle', color: 'black' }, { pattern: 'minecraft:border', color: 'black' }] });
  banner(11, 18, 0); banner(18, 14, 4); banner(18, 17, 4);

  // the flagpole: a blackstone base, a dark oak pole, a red flag with a black band, torn at the end
  s.fill(c - 1, 0, c - 1, c + 1, 0, c + 1, BB).set(c, 1, c, 'polished_blackstone_wall');
  for (let y = 2; y <= 17; y++) s.set(c, y, c, 'dark_oak_fence');
  for (let x = c + 1; x <= c + 5; x++) for (let y = 13; y <= 16; y++) {
    if (x === c + 5 && r.chance(0.5)) continue;
    s.set(x, y, c, y === 14 || y === 15 ? (y === 14 ? 'black_wool' : 'red_wool') : 'red_wool');
  }
  s.set(c + 1, 14, c, 'black_wool').set(c + 2, 14, c, 'black_wool').set(c + 3, 14, c, 'black_wool').set(c + 4, 14, c, 'black_wool');
  // the fire pit south of the pole, with log seats
  s.set(c, 0, c + 4, 'stone').set(c, 1, c + 4, 'campfire[lit=false,facing=north]');
  s.set(c - 2, 1, c + 4, 'stripped_dark_oak_log[axis=z]').set(c + 2, 1, c + 4, 'stripped_dark_oak_log[axis=z]').set(c - 2, 1, c + 5, 'stripped_dark_oak_log[axis=z]');
  // training dummies (west of the gate): a post, a hay body, a pumpkin head, and a scuffed patch around them
  for (const [x, z] of [[6, 21], [8, 24], [11, 26]]) {
    s.set(x, 1, z, 'spruce_fence').set(x, 2, z, 'hay_block').set(x, 3, z, 'carved_pumpkin[facing=east]');
    s.set(x + 1, 0, z, 'gravel').set(x, 0, z + 1, 'packed_mud');
  }
  // weapon racks (east of the gate): armour stands in worn iron, a rack of fences and a barrel
  const worn = (id, dmg) => ({ id: 'minecraft:' + id, count: 1, components: { 'minecraft:damage': dmg } });
  const stand = (x, z, yaw, eq) => s.entity(x, 1, z, { id: 'minecraft:armor_stand', ShowArms: true, Rotation: [{ t: 5, v: yaw }, { t: 5, v: 0 }], equipment: eq });
  stand(19, 24, 0, { head: worn('iron_helmet', 120), chest: worn('chainmail_chestplate', 160), mainhand: worn('iron_sword', 180) });
  stand(22, 23, 0, { head: worn('chainmail_helmet', 120), mainhand: worn('iron_axe', 180), offhand: worn('shield', 200) });
  s.fill(18, 1, 26, 20, 1, 26, 'spruce_fence').fill(18, 2, 26, 20, 2, 26, 'spruce_slab[type=bottom]');
  s.set(17, 1, 26, 'barrel[facing=up]');
  // supply barrels by the commander's tent
  s.barrel(11, 1, 12, 'up', 'ironclad_supply').set(11, 1, 13, 'barrel[facing=up]').set(11, 2, 12, 'barrel[facing=up]').set(11, 1, 14, 'lantern[hanging=false]');
  return s.save(`ironclad_camp/${seed}`);
}
const ironcladTemplates = [ironcladCamp(1)];
// v3.7: the Ironclad camp on open flat dry ground, its gate turned to the open side (SpireStructures.CaveTemplate.openGround)
special('ironclad_camp', 'spirecraft:cave_template', ['minecraft:badlands', 'minecraft:eroded_badlands', 'minecraft:wooded_badlands', 'minecraft:savanna', 'minecraft:savanna_plateau'],
  50, 17, { templates: ironcladTemplates, mode: 'open_ground', sink: 1, terrain_adaptation: 'beard_box' });

/** Silent: the hunters' gathering place (issue #37, poison and snakes). An abandoned den in the swamp / jungle: seven
 * rooms and narrow corridors on short stilts (hall with a cold fire pit and knife targets, poison room with the stash
 * cellar under a rug, store, skinning room, two small nooks with one bed each, the entry over a hollow stump) under a
 * leaf canopy that reads as swamp trees from above. Two hidden poison-arrow tripwires: in the leaf tunnel to the stump,
 * and in the corridor to the poison room.
 * Layer G is the ground (the stilts go G blocks further down, to reach the floor of shallow water); the deck is at P. */
loot('silent_gathering', [
  { rolls: [4, 7], items: [['spider_eye', 10, 1, 4], ['poisonous_potato', 8, 1, 4], ['fermented_spider_eye', 4, 1, 2], ['string', 8, 2, 6], ['tripwire_hook', 5, 1, 3], ['arrow', 6, 4, 12], ['rabbit_hide', 6, 1, 4], ['leather', 5, 1, 3], ['feather', 5, 2, 6], ['spirecraft:throwing_knife', 8, 8, 16], ['slime_ball', 3, 1, 3]] },
  { rolls: [1, 2], items: [['potion', 5, 1, 1, { potion: 'spirecraft:poison' }], ['splash_potion', 4, 1, 1, { potion: 'spirecraft:poison' }], potion('dexterity', 3), potion('weak', 2), ['empty', 2]] },
  { rolls: 1, items: [['empty', 50], ['spirecraft:poisoned_dagger', 8], ['spirecraft:poison_flask', 8, 2, 4], ['spirecraft:snakebite', 6], ['spirecraft:ink_dagger', 3]] },
  { rolls: 1, items: [['empty', 88], ['potion', 7, 1, 1, { potion: 'spirecraft:ghost_in_a_jar' }], ['spirecraft:shuriken', 5]] },
]);
loot('silent_supply', [
  { rolls: [2, 5], items: [['rabbit_hide', 8, 1, 4], ['leather', 6, 1, 3], ['string', 6, 1, 4], ['arrow', 6, 3, 10], ['tipped_arrow', 3, 2, 6, { potion: 'minecraft:poison' }], ['cooked_rabbit', 5, 1, 3], ['cooked_chicken', 4, 1, 3], ['feather', 5, 1, 4], ['bone', 5, 1, 3], ['spider_eye', 4, 1, 2], ['brown_mushroom', 4, 1, 3], ['red_mushroom', 3, 1, 2], ['sweet_berries', 4, 2, 6]] },
]);
function silentGathering(seed) {
  // v2 (user, issue #37: harder to find, traps better hidden, fewer beds and not together, bigger, lower, a tangle of
  // rooms inside): a low den of rooms and narrow corridors on short stilts under a canopy roof that looks like the
  // swamp trees around it. The only way up is a ladder inside a hollow stump, reached through a tunnel of leaves.
  const r = rng(seed), n = 47, G = 12, P = G + 3, s = new Struct(n, 23, n);   // G: 12 down for the vault under the cellar
  const LOG = 'mangrove_log[axis=y]', FENCE = 'dark_oak_fence';   // no red mangrove planks or fences: they show through the leaves
  const LEAVES = ['jungle_leaves[persistent=true]', 'mangrove_leaves[persistent=true]', 'oak_leaves[persistent=true]', 'mangrove_leaves[persistent=true]'];
  const leaf = () => r.pick(LEAVES);
  const BYTE = v => ({ t: 1, v });
  const FACE = { north: 2, south: 3, west: 4, east: 5 };
  const knife = (x, y, z, facing) => s.entity(x, y, z, { id: 'minecraft:item_frame', Facing: BYTE(FACE[facing]), Invisible: BYTE(1), ItemRotation: BYTE(r.int(0, 7)), Item: { id: 'spirecraft:throwing_knife', count: 1 } });
  const SUPPLY = { id: 'minecraft:barrel', LootTable: 'spirecraft:chests/silent_supply' };
  const banner = (pat = []) => ({ id: 'minecraft:banner', patterns: pat });
  const bandage = [{ pattern: 'minecraft:stripe_downright', color: 'white' }];
  const snakeskin = [{ pattern: 'minecraft:small_stripes', color: 'green' }, { pattern: 'minecraft:curly_border', color: 'green' }];

  // ---- the plan: floor cells of rooms (roofed) and the balcony (open); walls go round every roofed floor cell
  const key = (x, z) => x + ',' + z, floor = new Map();
  const room = (x0, z0, x1, z1, kind = 'room') => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) floor.set(key(x, z), kind); };
  const path = list => list.forEach(([x, z]) => floor.set(key(x, z), 'room'));
  const HALL = [19, 19, 27, 25], POISON = [9, 18, 14, 23], STORE = [20, 11, 24, 15], NOOK_W = [15, 11, 18, 14],
    SKIN = [29, 12, 34, 17], NOOK_E = [31, 21, 35, 26], ENTRY = [20, 34, 24, 38];
  for (const rm of [HALL, POISON, STORE, NOOK_W, SKIN, NOOK_E, ENTRY]) room(...rm);
  room(37, 22, 39, 26, 'open');                                                             // the balcony
  path([[22, 18], [22, 17], [22, 16]]);                                                     // hall - store
  path([[19, 13]]);                                                                         // store - west nook, behind a tapestry
  path([[18, 20], [17, 20], [16, 20], [16, 21], [16, 22], [16, 23], [15, 23]]);             // hall - poison room (trapped)
  path([[28, 20], [29, 20], [29, 19], [29, 18]]);                                           // hall - skinning room
  path([[28, 23], [29, 23], [30, 23]]);                                                     // hall - east nook
  path([[36, 24]]);                                                                         // east nook - balcony
  path([[25, 26], [25, 27], [25, 28], [25, 29], [25, 30], [24, 30], [23, 30], [22, 30], [21, 30], [20, 30], [19, 30], [21, 31], [21, 32], [21, 33]]);   // entry - hall, a dead end west
  const kind = (x, z) => floor.get(key(x, z));
  const wall = new Set(), rail = new Set();
  for (let x = 0; x < n; x++) for (let z = 0; z < n; z++) {
    if (floor.has(key(x, z))) continue;
    let nearRoom = false, nearOpen = false;
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const k = kind(x + dx, z + dz);
      if (k === 'room') nearRoom = true; else if (k === 'open') nearOpen = true;
    }
    if (nearRoom) wall.add(key(x, z)); else if (nearOpen) rail.add(key(x, z));
  }
  const isWall = (x, z) => wall.has(key(x, z));
  const covered = (x, z) => kind(x, z) === 'room' || isWall(x, z);
  const shaded = (x, z) => covered(x, z) || floor.has(key(x, z)) || rail.has(key(x, z));   // the canopy reaches over the balcony too
  const inRect = (x, z, [x0, z0, x1, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1;
  const WALLS = ['dark_oak_planks', 'dark_oak_planks', 'dark_oak_planks', 'stripped_dark_oak_log[axis=y]', 'spruce_planks'];

  // ---- deck, walls, ceilings, stilts (the deck is 2 above the ground: room to crawl under it)
  for (let x = 0; x < n; x++) for (let z = 0; z < n; z++) {
    const k = kind(x, z), w = isWall(x, z), rl = rail.has(key(x, z));
    if (!k && !w && !rl) continue;
    s.set(x, P, z, r.pick(['dark_oak_planks', 'spruce_planks', 'spruce_planks', 'dark_oak_planks', 'stripped_spruce_log[axis=x]']));
    if (x % 3 === 0 && z % 3 === 0) for (let y = 0; y < P; y++) s.set(x, y, z, LOG);
    if (w) for (let y = P + 1; y <= P + 3; y++) s.set(x, y, z, x % 4 === 0 && z % 4 === 0 ? LOG : r.pick(WALLS));
    else if (rl) { s.set(x, P + 1, z, FENCE); s.set(x, P + 2, z, 'air').set(x, P + 3, z, 'air'); }
    else { for (let y = P + 1; y <= P + 3; y++) s.set(x, y, z, 'air'); if (k === 'room') s.set(x, P + 4, z, 'dark_oak_planks'); }
  }
  // roots round the feet of some stilts, like the mangroves around
  s.forEach((x, y, z, st) => {
    if (y !== G + 1 || st !== LOG) return;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!s.get(x + dx, y, z + dz) && r.chance(0.3)) {
      s.set(x + dx, y, z + dz, 'mangrove_roots');
      if (r.chance(0.4)) s.set(x + dx, y + 1, z + dz, 'mangrove_roots');
    }
  });

  // ---- the canopy: leaves over the walls and out past them, then uneven clumps on top, like the swamp oaks
  const near = (x, z) => { let d = 9; for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) if (shaded(x + dx, z + dz)) d = Math.min(d, Math.max(Math.abs(dx), Math.abs(dz))); return d; };
  const dist = [];
  for (let x = 0; x < n; x++) { dist[x] = []; for (let z = 0; z < n; z++) dist[x][z] = near(x, z); }
  for (let x = 0; x < n; x++) for (let z = 0; z < n; z++) {
    const d = dist[x][z];
    if (kind(x, z) !== 'room' && (d <= 1 || (d === 2 && r.chance(0.5)))) s.set(x, P + 4, z, leaf());
    if (d <= 1 || (d === 2 && r.chance(0.3))) s.set(x, P + 5, z, leaf());   // no holes: they show as dark spots from above
    if (d >= 1 && d <= 2 && s.get(x, P + 4, z) && !s.get(x, P + 3, z) && r.chance(0.3)) s.set(x, P + 3, z, 'vine[up=true]');
  }
  const roofed = [];
  for (let x = 0; x < n; x++) for (let z = 0; z < n; z++) if (shaded(x, z)) roofed.push([x, z]);
  for (let i = 0; i < 16; i++) {
    const [cx, cz] = r.pick(roofed), rad = r.int(2, 3);
    for (let dx = -rad; dx <= rad; dx++) for (let dz = -rad; dz <= rad; dz++) {
      const h = Math.hypot(dx, dz);
      if (h > rad + 0.3) continue;
      s.set(cx + dx, P + 6, cz + dz, leaf());
      if (h <= rad - 1.5 && r.chance(0.8)) s.set(cx + dx, P + 7, cz + dz, leaf());
    }
  }
  // vines over the outside of the walls
  for (const k of wall) {
    const [x, z] = k.split(',').map(Number);
    for (const [dx, dz, face] of [[1, 0, 'west'], [-1, 0, 'east'], [0, 1, 'north'], [0, -1, 'south']]) {
      if (covered(x + dx, z + dz) || floor.has(key(x + dx, z + dz)) || rail.has(key(x + dx, z + dz))) continue;
      for (let y = P + 1; y <= P + 3; y++) if (r.chance(0.55) && !s.get(x + dx, y, z + dz)) s.set(x + dx, y, z + dz, `vine[${face}=true]`);
    }
  }

  // ---- the hall: a cold fire pit (no smoke to give them away), log seats, knife targets on the north wall
  s.set(23, P, 22, 'mud_bricks').set(23, P + 1, 22, 'campfire[lit=false,facing=south]');
  for (const [dx, dz] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]) s.set(23 + dx, P, 22 + dz, 'packed_mud');
  s.set(22, P + 1, 20, 'stripped_mangrove_log[axis=x]').set(23, P + 1, 20, 'stripped_mangrove_log[axis=x]');
  s.set(21, P + 1, 22, 'stripped_mangrove_log[axis=z]').set(21, P + 1, 23, 'stripped_mangrove_log[axis=z]');
  s.set(25, P + 1, 21, 'stripped_mangrove_log[axis=z]').set(25, P + 1, 22, 'stripped_mangrove_log[axis=z]');
  s.set(24, P + 1, 24, 'spruce_stairs[facing=south,half=bottom]');
  for (const x of [20, 26]) { s.set(x, P + 2, 18, 'target'); knife(x, P + 2, 19, 'south'); }
  s.set(27, P + 1, 25, 'loom').set(21, P + 3, 25, 'lime_wall_banner[facing=north]', banner(snakeskin));
  s.set(21, P + 3, 21, 'lantern[hanging=true]').set(25, P + 3, 24, 'lantern[hanging=true]');

  // ---- the store: fletching table, supply barrels, hay; a low doorway west behind a tapestry
  s.set(20, P + 1, 11, 'barrel[facing=up]', SUPPLY).set(24, P + 1, 11, 'barrel[facing=up]', SUPPLY);
  s.set(21, P + 1, 11, 'barrel[facing=up]').set(21, P + 2, 11, 'barrel[facing=up]').set(23, P + 1, 11, 'fletching_table');
  s.set(24, P + 1, 15, 'hay_block').set(24, P + 1, 14, 'hay_block').set(24, P + 2, 15, 'hay_block');
  s.set(19, P + 3, 13, 'dark_oak_planks').set(20, P + 3, 13, 'green_wall_banner[facing=east]', banner(bandage));
  s.set(22, P + 3, 13, 'lantern[hanging=true]');
  // the west nook: one bed, a stack of white cloth (bandages)
  s.set(15, P + 1, 11, 'green_bed[facing=north,part=head]').set(15, P + 1, 12, 'green_bed[facing=north,part=foot]');
  s.set(18, P + 1, 11, 'white_wool').set(17, P + 1, 11, 'barrel[facing=up]').set(18, P + 2, 11, 'white_carpet');
  s.set(16, P + 3, 13, 'lantern[hanging=true]');

  // ---- the poison room: the bench, a shelf of jars, and a hatch under the rug down to the stash
  s.set(9, P + 1, 19, 'brewing_stand').set(9, P + 1, 20, 'water_cauldron[level=2]');
  s.set(9, P + 1, 21, 'barrel[facing=up]').set(9, P + 2, 21, 'green_candle[candles=3,lit=false]');
  s.set(9, P + 1, 22, 'barrel[facing=up]').set(9, P + 2, 22, 'decorated_pot[facing=east]');
  for (const x of [10, 11]) s.set(x, P + 2, 18, 'spruce_trapdoor[facing=south,half=top,open=false]');
  s.set(10, P + 3, 18, 'potted_red_mushroom').set(11, P + 3, 18, 'green_candle[candles=2,lit=false]');
  s.set(10, P + 1, 18, 'decorated_pot[facing=south]').set(11, P + 1, 18, 'potted_brown_mushroom');
  s.set(14, P + 1, 18, 'barrel[facing=up]').set(14, P + 2, 18, 'barrel[facing=up]');
  s.set(11, P + 3, 21, 'lantern[hanging=true]');
  s.set(12, P, 18, 'spruce_trapdoor[facing=south,half=top,open=false]');
  for (let x = 11; x <= 13; x++) for (let z = 18; z <= 19; z++) s.set(x, P + 1, z, x === 11 && z === 18 ? 'potted_brown_mushroom' : 'green_carpet');
  // under it: a mud cellar 2 high between the stilts - a decoy, only a supply barrel; one moss carpet on its floor hides
  // the hatch to the vault
  for (let x = 11; x <= 15; x++) for (let z = 17; z <= 21; z++) {
    const edge = x === 11 || x === 15 || z === 17 || z === 21;
    s.set(x, G, z, edge ? 'mud_bricks' : 'packed_mud');
    for (let y = G + 1; y <= G + 2; y++) s.set(x, y, z, edge ? r.pick(['mud_bricks', 'mud_bricks', 'packed_mud', 'mangrove_roots']) : 'air');
  }
  s.set(12, G + 1, 18, 'ladder[facing=south]').set(12, G + 2, 18, 'ladder[facing=south]');
  s.barrel(14, G + 1, 20, 'up', 'silent_supply');
  s.set(14, G + 1, 18, 'decorated_pot[facing=west]').set(12, G + 1, 20, 'lantern[hanging=false]');
  for (const [x, z] of [[13, 18], [12, 19], [13, 19], [14, 19], [13, 20]]) s.set(x, G + 1, z, 'moss_carpet');
  s.set(13, G, 19, 'spruce_trapdoor[facing=south,half=top,open=false]');

  // ---- the vault, deep under the cellar: a shaft down, a trapped passage, a room, the main chest trapped too
  const EARTH = ['mud_bricks', 'mud_bricks', 'packed_mud', 'mud', 'rooted_dirt'];
  for (let x = 8; x <= 18; x++) for (let z = 17; z <= 31; z++) {
    for (let y = 1; y <= 5; y++) s.set(x, y, z, r.pick(EARTH));
    s.set(x, 0, z, 'packed_mud').set(x, 6, z, r.pick(['packed_mud', 'dirt', 'mud']));
  }
  // the shaft: a mud brick tube from under the hatch to the vault floor, the ladder on its north side
  for (let y = 2; y < G; y++) for (let x = 12; x <= 14; x++) for (let z = 18; z <= 20; z++) s.set(x, y, z, x === 13 && z === 19 ? 'air' : 'mud_bricks');
  for (let y = 2; y < G; y++) s.set(13, y, 19, 'ladder[facing=south]');
  s.set(13, 2, 20, 'air').set(13, 3, 20, 'air');                                   // out at the bottom, to the south
  // the passage south, 1 wide and 2 high; a tripwire across it at (13, 21). Each hook sits in a gap in the wall, hung on
  // the earth behind it; on that block sits a dispenser, its mouth behind hanging roots at head height
  for (const z of [21, 22]) s.set(13, 2, z, 'air').set(13, 3, z, 'air');
  s.set(13, 2, 21, 'tripwire[attached=true,disarmed=false,powered=false,east=true,west=true,north=false,south=false]');
  for (const [side, face] of [[-1, 'east'], [1, 'west']]) {
    s.set(13 + 2 * side, 2, 21, 'mud_bricks');
    s.set(13 + 2 * side, 3, 21, `dispenser[facing=${face},triggered=false]`, poisonArrows());
    s.set(13 + side, 2, 21, `tripwire_hook[attached=true,facing=${face},powered=false]`);
    s.set(13 + side, 3, 21, 'hanging_roots').set(13 + side, 4, 21, 'mud_bricks');
  }
  // the room
  for (let x = 9; x <= 17; x++) for (let z = 23; z <= 28; z++) {
    s.set(x, 1, z, r.pick(['mud_bricks', 'packed_mud', 'packed_mud']));
    for (let y = 2; y <= 4; y++) s.set(x, y, z, 'air');
    if (r.chance(0.22)) s.set(x, 4, z, 'hanging_roots');
  }
  s.set(13, 4, 25, 'lantern[hanging=true]');
  // the treasure: a trapped chest in a recess 2 deep in the south wall; opening it powers the block under it, and the
  // dispenser beside that block - the floor in front of the chest, under a moss carpet - shoots straight up
  s.set(13, 2, 29, 'moss_carpet').set(13, 3, 29, 'air').set(13, 3, 30, 'air');
  s.set(13, 1, 29, 'dispenser[facing=up,triggered=false]', poisonArrows()).set(13, 1, 30, 'mud_bricks');
  s.chest(13, 2, 30, 'north', 'silent_gathering', 'trapped_chest');
  for (const [x, z] of [[11, 28], [12, 28], [14, 28], [15, 27]]) s.set(x, 2, z, 'moss_carpet');
  s.set(13, 4, 28, 'lime_wall_banner[facing=north]', banner(snakeskin));
  // someone who opened it before: a skull in front of the recess
  s.set(12, 2, 27, 'skeleton_skull[rotation=6]');
  // knives and a dagger left on the north wall; pots of supplies in the corners
  [[10, 'spirecraft:throwing_knife'], [11, 'spirecraft:poisoned_dagger'], [15, 'spirecraft:throwing_knife']].forEach(([x, item]) =>
    s.entity(x, 3, 23, { id: 'minecraft:item_frame', Facing: BYTE(FACE.south), ItemRotation: BYTE(r.int(0, 7)), Item: { id: item, count: 1 } }));
  for (const [x, z, f] of [[9, 23, 'east'], [17, 28, 'west'], [9, 28, 'east']]) s.set(x, 2, z, `decorated_pot[facing=${f}]`, { id: 'minecraft:decorated_pot', LootTable: 'spirecraft:chests/silent_supply' });

  // ---- the skinning room: smoker, grindstone, hay, supply; hides drying on the outside of the east wall
  s.set(34, P + 1, 12, 'smoker[facing=south,lit=false]').set(33, P + 1, 12, 'cauldron').set(32, P + 1, 12, 'grindstone[face=floor,facing=south]');
  s.set(34, P + 1, 13, 'barrel[facing=up]', SUPPLY);
  s.set(29, P + 1, 12, 'hay_block').set(30, P + 1, 12, 'hay_block').set(29, P + 2, 12, 'hay_block').set(29, P + 1, 13, 'hay_block');
  s.set(31, P + 3, 15, 'lantern[hanging=true]');
  [['brown', []], ['brown', [{ pattern: 'minecraft:gradient', color: 'black' }]], ['lime', snakeskin], ['brown', []]].forEach(([col, pat], i) =>
    s.set(36, P + 3, 13 + i, `${col}_wall_banner[facing=east]`, banner(pat)));
  // the east nook: the other bed, and a balcony over the water with a knife range
  s.set(35, P + 1, 21, 'lime_bed[facing=north,part=head]').set(35, P + 1, 22, 'lime_bed[facing=north,part=foot]');
  s.set(31, P + 1, 21, 'barrel[facing=up]').set(33, P + 1, 25, 'green_carpet').set(34, P + 1, 25, 'green_carpet');
  s.set(33, P + 3, 24, 'lantern[hanging=true]');
  for (const [x, z] of [[44, 22], [45, 26]]) {
    for (let y = 0; y <= P; y++) s.set(x, y, z, LOG);
    s.set(x, P + 1, z, 'target');
    knife(x - 1, P + 1, z, 'west');
  }
  // the entry room above the stump
  s.set(20, P + 1, 34, 'barrel[facing=up]').set(22, P + 3, 36, 'lantern[hanging=true]');

  // ---- inside the corridor to the poison room: a tripwire; the hook in the north wall hangs on a log outside,
  // and the dispenser on that log shoots through a curtain of vines at head height
  s.set(17, P + 1, 18, 'mangrove_log[axis=y]');
  s.set(17, P + 2, 18, 'dispenser[facing=south,triggered=false]', poisonArrows());
  s.set(17, P + 2, 19, 'vine[north=true]');
  s.set(17, P + 1, 19, 'tripwire_hook[attached=true,facing=south,powered=false]');
  s.set(17, P + 1, 20, 'tripwire[attached=true,disarmed=false,powered=false,north=true,south=true,east=false,west=false]');
  s.set(17, P + 1, 21, 'tripwire_hook[attached=true,facing=north,powered=false]').set(17, P + 1, 22, 'dark_oak_planks');
  for (const [x, y, z] of [[17, P + 3, 18], [16, P + 1, 18], [16, P + 2, 18], [16, P + 3, 18], [17, P + 1, 17], [17, P + 2, 17], [17, P + 3, 17]]) s.set(x, y, z, leaf());

  // ---- the hollow stump: a ring of mangrove logs under the entry room, the ladder inside it
  const SX = 22, SZ = 38;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    s.set(SX + dx, G, SZ + dz, 'mud');
    if (dx === 0 && dz === 0) continue;
    for (let y = G - 2; y < P; y++) s.set(SX + dx, y, SZ + dz, dx === 0 && dz === 1 && y > G && y <= G + 2 ? 'air' : LOG);
  }
  for (let y = G + 1; y <= P; y++) s.set(SX, y, SZ, 'ladder[facing=south]');
  // the way in: a low tunnel of bushes to the stump's opening, and in it a tripwire between two hidden dispensers
  for (let x = SX - 3; x <= SX + 3; x++) for (let z = SZ + 1; z <= SZ + 6; z++) {
    s.set(x, G, z, r.pick(['grass_block[snowy=false]', 'grass_block[snowy=false]', 'mud', 'rooted_dirt'])).set(x, G - 1, z, 'dirt').set(x, G - 2, z, 'mud');
    if (z === SZ + 1 && Math.abs(x - SX) <= 1) continue;
    if (Math.abs(x - SX) === 1 && z <= SZ + 5) { s.set(x, G + 1, z, leaf()).set(x, G + 2, z, leaf()); continue; }
    if (x === SX) { s.set(x, G + 1, z, 'air').set(x, G + 2, z, 'air'); if (z <= SZ + 4) s.set(x, G + 3, z, leaf()); continue; }
    if (r.chance(0.6)) { s.set(x, G + 1, z, leaf()); if (r.chance(0.5)) s.set(x, G + 2, z, leaf()); }
  }
  for (let x = SX - 1; x <= SX + 1; x++) for (let z = SZ + 2; z <= SZ + 4; z++) s.set(x, G + 3, z, leaf());
  const tz = SZ + 3;
  for (const [side, face, out] of [[-1, 'east', 'west'], [1, 'west', 'east']]) {
    s.set(SX + 2 * side, G + 1, tz, 'mangrove_log[axis=y]');
    s.set(SX + 2 * side, G + 2, tz, `dispenser[facing=${face},triggered=false]`, poisonArrows());
    s.set(SX + 2 * side, G + 3, tz, leaf());
    // packed into the bush on every side but the vine-covered face
    for (const [x, y, z] of [[SX + 3 * side, G + 1, tz], [SX + 3 * side, G + 2, tz], [SX + 2 * side, G + 1, tz - 1], [SX + 2 * side, G + 2, tz - 1],
      [SX + 2 * side, G + 1, tz + 1], [SX + 2 * side, G + 2, tz + 1], [SX + 3 * side, G + 3, tz], [SX + 2 * side, G + 3, tz - 1], [SX + 2 * side, G + 3, tz + 1]]) s.set(x, y, z, leaf());
    s.set(SX + side, G + 1, tz, `tripwire_hook[attached=true,facing=${face},powered=false]`);
    s.set(SX + side, G + 2, tz, `vine[${out}=true]`);
  }
  s.set(SX, G + 1, tz, 'tripwire[attached=true,disarmed=false,powered=false,east=true,west=true,north=false,south=false]');
  // the hunters' mark, a strip of white cloth at the stump's mouth
  s.set(SX + 1, G + 2, SZ + 2, 'white_wall_banner[facing=south]', banner()).set(SX + 1, G + 2, SZ + 1, LOG);
  // and a few more tied low on stilts under the deck
  const posts = [];
  s.forEach((x, y, z, st) => { if (y === G + 2 && st === LOG && !s.get(x, y, z + 1) && x > 2 && x < n - 3) posts.push([x, z]); });
  for (let i = 0; i < 4 && posts.length; i++) { const [x, z] = posts.splice(r.int(0, posts.length - 1), 1)[0]; s.set(x, G + 2, z + 1, 'white_wall_banner[facing=south]', banner()); }

  // ---- abandoned: a few boards gone, moss on the floors, cobwebs in the corners
  for (const rm of [HALL, STORE, SKIN, NOOK_E, ENTRY]) for (let x = rm[0]; x <= rm[2]; x++) for (let z = rm[1]; z <= rm[3]; z++) {
    if (s.get(x, P + 1, z) !== 'air' || (x === SX && z === SZ)) continue;
    if (r.chance(0.03)) s.set(x, P, z, 'air');
    else if (r.chance(0.07)) s.set(x, P + 1, z, 'moss_carpet');
  }
  for (const rm of [HALL, POISON, STORE, NOOK_W, SKIN, NOOK_E, ENTRY]) for (const [x, z] of [[rm[0], rm[1]], [rm[2], rm[1]], [rm[0], rm[3]], [rm[2], rm[3]]])
    if (s.get(x, P + 3, z) === 'air' && r.chance(0.45)) s.set(x, P + 3, z, 'cobweb');
  return s.save(`silent_gathering/${seed}`);
}
function poisonArrows() {
  return { id: 'minecraft:dispenser', Items: [{ Slot: { t: 1, v: 0 }, id: 'minecraft:tipped_arrow', count: 16, components: { 'minecraft:potion_contents': { potion: 'minecraft:poison' } } }] };
}
const silentTemplates = [silentGathering(1)];
// issue #37: on stilts over shallow water or flat jungle floor (SpireStructures.CaveTemplate.stilts); placed after the
// trees (top_layer_modification) so the rooms cut them out instead of filling with leaves
special('silent_gathering', 'spirecraft:cave_template', ['minecraft:swamp', 'minecraft:mangrove_swamp', 'minecraft:jungle', 'minecraft:sparse_jungle'],
  50, 17, { templates: silentTemplates, mode: 'stilts', sink: 13, ignore_waterlogging: true, step: 'top_layer_modification' });

/** The Regent's meteor crater (issue #36): carved into the land by worldgen/SpireStructures "meteor_crater" - the bowl,
 * the split fallen star with its Orange Dough core, ejecta, the Regent's forge on a terrace (main chest, two barrels)
 * and a banner pole on the far rim. Main chest: galactic dust, gold, lapis, amethyst, some Orange Dough, small chance of
 * a Regent weapon. */
loot('regent_crater', [
  { rolls: [4, 7], items: [['spirecraft:galactic_dust', 12, 4, 10], ['gold_ingot', 8, 1, 4], ['gold_nugget', 6, 3, 9], ['lapis_lazuli', 8, 2, 7], ['amethyst_shard', 6, 2, 5], ['glowstone_dust', 5, 2, 6], ['spirecraft:orange_dough', 6, 1, 3], ['iron_ingot', 4, 1, 3]] },
  { rolls: 1, items: [['empty', 55], ['spirecraft:regent_strike', 14], ['spirecraft:photon_cut', 8], ['spirecraft:crescent_spear', 8], ['spirecraft:heirloom_hammer', 6]] },
]);
loot('regent_supply', [
  { rolls: [2, 5], items: [['bread', 6, 1, 3], ['cooked_mutton', 4, 1, 3], ['coal', 6, 2, 6], ['iron_nugget', 6, 2, 8], ['gold_nugget', 4, 1, 5], ['candle', 4, 1, 3], ['paper', 4, 1, 4], ['torch', 5, 2, 6], ['string', 3, 1, 3]] },
]);
// not on snowy plains: the snow laid after the structures buried the dough and the split star
special('regent_crater', 'spirecraft:carved', ['minecraft:desert', 'minecraft:meadow'],
  50, 17, { kind: 'meteor_crater', step: 'surface_structures' });

/** The Necrobinder's giant (issue #40, soul and doom): the skeleton of an ancient giant lying half-buried on its back in
 * the dark forest / pale garden, in a clearing where nothing grows. Its ribs arch out of the ground into a hall where she
 * lived (purple curtains, books, soul lanterns hanging from the ribs); the skull, its jaw dropped open on the ground
 * towards +z (the open side, SpireStructures.CaveTemplate.openGround), holds her phylactery altar and the main chest,
 * soul fire burning in the eye sockets. One arm lies along the ground east of the ribs, its hand reaching up out of it.
 * A small ossuary under the spine (a skeleton spawner, two supply barrels), down a stair under trapdoors in the hall.
 * Layer G is the top soil; the long axis is z: pelvis at 0, ribs 10-25, neck, skull 30-44, jaw to 47. */
loot('necrobinder_giant', [
  { rolls: [4, 7], items: [['bone', 12, 2, 8], ['bone_block', 6, 1, 3], ['wither_rose', 4, 1, 2], ['soul_soil', 6, 2, 6], ['book', 6, 1, 3], ['amethyst_shard', 6, 2, 5], ['ink_sac', 5, 1, 4]] },
  { rolls: [1, 2], items: [potion('doom', 1)] },
  { rolls: 1, items: [['empty', 65], ['spirecraft:scythe', 9], ['spirecraft:scourge', 9], ['spirecraft:dirge_flute', 7], ['spirecraft:forbidden_grimoire', 6], ['spirecraft:danse_macabre', 4]] },
]);
loot('necrobinder_supply', [
  { rolls: [2, 5], items: [['bone', 8, 1, 4], ['rotten_flesh', 8, 1, 3], ['candle', 5, 1, 3], ['paper', 6, 1, 4], ['book', 3, 1, 2], ['ink_sac', 4, 1, 3], ['string', 4, 1, 3], ['soul_torch', 5, 2, 6], ['bread', 5, 1, 3]] },
]);
function necrobinderGiant(seed) {
  // 46 wide so the clearing round the hand (east) is not cut off at the template's edge, where trees would stay
  const r = rng(seed), W = 46, D = 48, G = 10, H = G + 16, c = 17, s = new Struct(W, H, D);
  const BONE = a => `bone_block[axis=${a}]`, PB = 'polished_blackstone', PBB = 'polished_blackstone_bricks';
  const line = (ax, az, bx, bz, fn) => { const n = Math.max(Math.abs(bx - ax), Math.abs(bz - az)) * 2; for (let i = 0; i <= n; i++) fn(Math.round(ax + (bx - ax) * i / n), Math.round(az + (bz - az) * i / n), i / n); };
  const segDist = (px, pz, [ax, az], [bx, bz]) => { const vx = bx - ax, vz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / (vx * vx + vz * vz))); return Math.hypot(px - ax - t * vx, pz - az - t * vz); };
  const SH = [c + 9, 25], EL = [c + 16, 21], WR = [c + 19, 16], PALM = [c + 20, 13];

  // ---- the clearing: air over it (cuts the dark oaks out), dead ground, earth under it where the land dips
  const GROUND = ['grass_block[snowy=false]', 'grass_block[snowy=false]', 'coarse_dirt', 'podzol[snowy=false]', 'rooted_dirt', 'coarse_dirt'];
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    const e = Math.min((Math.hypot((x - c) / 12.5, (z - 23.5) / 24.5) - 1) * 12.5, segDist(x, z, SH, WR) - 4, Math.hypot(x - PALM[0], z - PALM[1]) - 9);
    if (e > 0 || (e > -1.5 && r.chance(0.5))) continue;
    s.set(x, G, z, r.pick(GROUND));
    for (let y = G - 4; y < G; y++) s.set(x, y, z, 'dirt');
    for (let y = G + 1; y < H; y++) s.set(x, y, z, 'air');
  }
  // ---- the hall floor between the ribs (review: not a checkerboard): worn dark oak with a few ragged patches of pale
  // oak where it was mended, a few boards gone to the earth under them; the spine down the middle
  const PATCHES = Array.from({ length: 5 }, () => [c + r.int(-6, 6), r.int(10, 25), 1.2 + r() * 1.4]);
  for (let x = c - 7; x <= c + 7; x++) for (let z = 9; z <= 26; z++) {
    const pale = PATCHES.some(([px, pz, pr]) => Math.hypot(x - px, (z - pz) * 0.8) < pr + r() * 0.9 - 0.45);
    s.set(x, G, z, r.chance(0.04) ? r.pick(['coarse_dirt', 'rooted_dirt']) : pale ? 'pale_oak_planks'
      : r.chance(0.07) ? 'stripped_dark_oak_log[axis=z]' : 'dark_oak_planks');
  }
  for (let z = 0; z <= 30; z++) {
    s.set(c, G, z, BONE('z')).set(c, G - 1, z, BONE('z'));
    if ((z <= 8 || z >= 27) && z % 2 === 0) s.set(c, G + 1, z, BONE('y'));   // the spinous processes, outside the hall
  }

  // ---- the ribs: 6 pairs of arches from under the ground, their ends 1-2 apart over the middle
  const RIBS = [[10, 8.5, 7.5], [13, 9.5, 8.5], [16, 10, 9], [19, 10, 9], [22, 9.5, 8.5], [25, 8.5, 7.5]];   // z, half-width, height above G+3
  const ribCells = new Map();   // z -> [[x, y, side]]
  const arch = (z, rx, ry, yc, stopAt, place) => {
    for (const side of [-1, 1]) {
      const stop = stopAt(side);
      let prev = null;
      for (let t = Math.asin(Math.max(-1, (G - 1 - yc) / ry)); t <= Math.PI / 2; t += 0.01) {
        const x = Math.round(c + side * rx * Math.cos(t)), y = Math.round(yc + ry * Math.sin(t));
        if (Math.abs(x - c) < stop) break;
        const axis = Math.abs(ry * Math.cos(t)) > Math.abs(rx * Math.sin(t)) ? 'y' : 'x';
        if (prev && prev[0] !== x && prev[1] !== y) place(prev[0], y, z, axis, side);   // no diagonal gaps
        place(x, y, z, axis, side);
        prev = [x, y];
      }
    }
  };
  for (const [z, rx, ry] of RIBS) {
    const cells = [];
    arch(z, rx, ry, G + 3, side => (side < 0 ? 1 : r.int(1, 2)), (x, y, zz, axis, side) => { s.set(x, y, zz, BONE(axis)); cells.push([x, y, side]); });
    ribCells.set(z, cells);
  }
  // the pelvis (two wings curving up either side of the spine) and the stubs of the thigh bones going on under the ground
  for (const [z, rx, ry] of [[4, 5.5, 3.5], [5, 6, 4], [6, 5.5, 3.5]]) arch(z, rx, ry, G, () => 2, (x, y, zz, axis) => s.set(x, y, zz, BONE(axis)));
  for (const side of [-1, 1]) {
    for (let z = 0; z <= 3; z++) s.set(c + side * 4, G, z, BONE('z')).set(c + side * 4, G - 1, z, BONE('z'));
    s.set(c + side * 4, G + 1, 3, BONE('y'));
  }

  // ---- the skull, its face to +z: a shell of bone, a floor of polished blackstone under a purple carpet
  const SZ = 37, SY = G + 4, ell = (x, y, z, k) => ((x - c) / (6.8 - k)) ** 2 + ((y - SY) / (6 - k)) ** 2 + ((z - SZ) / (6.8 - k)) ** 2;
  for (let x = c - 7; x <= c + 7; x++) for (let y = G; y <= G + 10; y++) for (let z = SZ - 7; z <= SZ + 7; z++) {
    if (ell(x, y, z, 0) > 1) continue;
    const inner = ell(x, y, z, 1.1) <= 1;
    if (y === G) s.set(x, y, z, inner ? PB : BONE('y'));
    else s.set(x, y, z, inner ? 'air' : r.chance(0.12) ? 'calcite' : BONE('y'));
    if (y === G + 1 && inner) s.set(x, y, z, 'purple_carpet');
  }
  const front = (x, y) => { for (let z = SZ + 7; z > SZ; z--) if (ell(x, y, z, 0) <= 1) return z; return null; };
  const carve = (x, y) => { for (let z = SZ + 2; z <= SZ + 7; z++) if (ell(x, y, z, 0) <= 1) s.set(x, y, z, 'air'); };
  // the mouth (the way in), the upper teeth hanging over it
  for (let x = c - 3; x <= c + 3; x++) for (let y = G + 1; y <= G + 3; y++) carve(x, y);
  for (const dx of [-3, -1, 1, 3]) { const z = front(c + dx, G + 3); if (z) s.set(c + dx, G + 3, z - 1, BONE('y')); }
  // the nose, and soul fire in the eye sockets
  for (const [x, y] of [[c, G + 4], [c, G + 5], [c - 1, G + 4], [c + 1, G + 4]]) carve(x, y);
  for (const x of [c - 4, c - 3, c + 3, c + 4]) {
    const z = front(x, G + 6);
    carve(x, G + 6); carve(x, G + 7);
    if (z) s.set(x, G + 5, z - 1, 'soul_soil').set(x, G + 6, z - 1, 'soul_fire');
  }
  // the lower jaw dropped flat on the ground in front of the mouth, its teeth up
  for (const side of [-1, 1]) {
    for (let z = SZ + 5; z <= SZ + 9; z++) s.set(c + side * 5, G, z, BONE('z'));
    s.set(c + side * 4, G, SZ + 10, BONE('x'));
    for (const z of [SZ + 6, SZ + 8]) s.set(c + side * 5, G + 1, z, BONE('y'));
    s.set(c + side * 4, G + 1, SZ + 10, BONE('y')).set(c + side * 2, G + 1, SZ + 10, BONE('y'));
  }
  for (let x = c - 3; x <= c + 3; x++) s.set(x, G, SZ + 10, BONE('x'));
  // the phylactery altar: a decorated pot on polished blackstone, amethyst at its corners, soul campfires either side
  for (let x = c - 1; x <= c + 1; x++) for (let z = SZ - 1; z <= SZ + 1; z++) s.set(x, G + 1, z, PBB);
  s.set(c, G + 2, SZ, 'decorated_pot[facing=south]');
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) s.set(c + dx, G + 2, SZ + dz, 'amethyst_cluster[facing=up]');
  for (const dx of [-3, 3]) s.set(c + dx, G + 1, SZ, 'soul_campfire[lit=true,facing=south]');
  s.chest(c, G + 1, SZ - 4, 'south', 'necrobinder_giant');
  for (const dx of [-2, 2]) s.set(c + dx, G + 1, SZ - 4, 'purple_candle[candles=3,lit=false]');
  s.set(c, G + 7, SZ, 'soul_lantern[hanging=true]');
  if (s.get(c, G + 8, SZ) === 'air') s.set(c, G + 8, SZ, 'iron_chain[axis=y]');

  // ---- the arm along the ground east of the ribs, and the hand reaching up out of it
  line(...SH, ...EL, (x, z) => s.set(x, G, z, BONE('x')).set(x, G - 1, z, BONE('x')));
  for (const dx of [0, 1]) line(EL[0] + dx, EL[1], WR[0] + dx, WR[1], (x, z, t) => s.set(x, t > 0.6 ? G + 1 : G, z, BONE('z')).set(x, G - 1, z, BONE('z')));
  for (const [x, z] of [SH, EL, WR]) s.set(x, G + 1, z, BONE('y'));
  for (let x = PALM[0] - 3; x <= PALM[0] + 3; x++) for (let z = PALM[1] - 2; z <= PALM[1] + 2; z++) {
    s.set(x, G, z, BONE('x'));
    if (Math.abs(x - PALM[0]) > 1 || Math.abs(z - PALM[1]) > 1) s.set(x, G + 1, z, BONE('x'));   // cupped
  }
  // four fingers from the far edge of the palm, curling back over it like claws; tall enough (to G+11) to stand over the
  // canopy of the trees that grow in from the neighbouring chunks after the clearing is cut
  [8, 9, 9, 7].forEach((h, i) => {
    const x = PALM[0] - 3 + i * 2, z = PALM[1] - 3;
    for (let y = G; y <= G + h + 1; y++) s.set(x, y, z, BONE('y'));
    s.set(x, G + h + 1, z + 1, BONE('z')).set(x, G + h, z + 2, BONE('y'));
  });
  s.set(PALM[0] - 4, G + 1, PALM[1] + 1, BONE('x'));   // the thumb
  for (let y = G + 1; y <= G + 5; y++) s.set(PALM[0] - 5, y, PALM[1] + 1, BONE('y'));
  s.set(PALM[0] - 4, G + 6, PALM[1] + 1, BONE('x')).set(PALM[0] - 3, G + 5, PALM[1] + 1, BONE('y'));

  // ---- the hall: her books and bed against the ribs, curtains hung between them, soul lanterns on chains
  for (const z of [11, 12, 17, 18]) s.set(c - 7, G + 1, z, 'bookshelf').set(c - 7, G + 2, z, 'bookshelf');
  for (const z of [14, 15]) s.set(c + 7, G + 1, z, 'bookshelf').set(c + 7, G + 2, z, 'bookshelf');
  s.set(c - 7, G + 3, 11, 'purple_candle[candles=2,lit=false]').set(c + 7, G + 3, 15, 'purple_candle[candles=1,lit=false]');
  s.set(c - 7, G + 1, 14, 'lectern[facing=east,has_book=true]', { id: 'minecraft:lectern', Book: { id: 'minecraft:writable_book', count: 1 }, Page: 0 });
  s.set(c - 7, G + 1, 20, 'brewing_stand').set(c - 7, G + 1, 21, 'cauldron');
  s.set(c + 7, G + 1, 11, 'purple_bed[facing=north,part=head]').set(c + 7, G + 1, 12, 'purple_bed[facing=north,part=foot]');
  for (let i = 0; i < 6; i++) {
    const x = c + r.int(-5, 5), z = r.int(10, 26);
    if (s.get(x, G + 1, z) === 'air' && x !== c + 6) s.set(x, G + 1, z, `purple_candle[candles=${r.int(1, 4)},lit=false]`);
  }
  for (let i = 0; i < RIBS.length - 1; i++) {   // the curtains, torn in places
    const [z0] = RIBS[i], wider = RIBS[i][1] >= RIBS[i + 1][1] ? RIBS[i][0] : RIBS[i + 1][0];
    for (const [x, y] of ribCells.get(wider)) if (y >= G + 1 && y <= G + 5) for (const z of [z0 + 1, z0 + 2]) if (r.chance(0.7)) s.set(x, y, z, 'purple_wool');
  }
  for (const z of [13, 22]) for (const side of [-1, 1]) {
    const top = ribCells.get(z).filter(([x, , sd]) => sd === side && Math.abs(x - c) === 3).reduce((m, [, y]) => Math.max(m, y), 0);
    if (!top) continue;
    s.set(c + side * 3, top - 1, z, 'iron_chain[axis=y]').set(c + side * 3, top - 2, z, 'iron_chain[axis=y]').set(c + side * 3, top - 3, z, 'soul_lantern[hanging=true]');
  }
  for (let i = 0; i < 10; i++) {   // cobwebs up between the ribs
    const z = r.pick(RIBS)[0], cells = ribCells.get(z).filter(([, y]) => y >= G + 5), [x, y] = r.pick(cells);
    const zz = z + r.pick([1, -1]);
    if (s.get(x, y, zz) === 'air') s.set(x, y, zz, 'cobweb');
  }

  // ---- the ossuary under the hall: bone and blackstone walls, skulls in niches, a skeleton spawner
  const WALL = [BONE('y'), PBB, PBB, 'calcite', PB, 'cracked_polished_blackstone_bricks'];
  for (let x = c - 8; x <= c + 8; x++) for (let y = 1; y <= 8; y++) for (let z = 13; z <= 23; z++) {
    const inside = x >= c - 6 && x <= c + 6 && z >= 15 && z <= 21 && y >= 2 && y <= 6;
    s.set(x, y, z, inside ? 'air' : y === 1 && x >= c - 6 && x <= c + 6 && z >= 15 && z <= 21 ? 'soul_soil' : r.pick(WALL));
  }
  for (const z of [15, 21]) for (const dx of [-3, 3]) for (let y = 2; y <= 6; y++) s.set(c + dx, y, z, BONE('y'));
  // skulls in niches (review: a few more, unevenly placed): random spots along three walls, at two heights, each
  // turned a little (not in front of the bone pillars, nor by the stair on the east wall)
  const niche = (x, z, rot) => { const y = r.pick([3, 3, 4]); s.set(x, y, z, `skeleton_skull[rotation=${(rot + r.int(-1, 1) + 16) % 16}]`).set(x, y + 1, z, 'air'); };
  const some = (arr, k) => { const a = [...arr], out = []; while (out.length < k && a.length) out.push(a.splice(r.int(0, a.length - 1), 1)[0]); return out; };
  for (const dx of some([-6, -5, -4, -2, -1, 0, 1, 2, 4, 5], 6)) niche(c + dx, 14, 0);
  for (const dx of some([-6, -5, -4, -2, -1, 0, 1, 2], 4)) niche(c + dx, 22, 8);
  for (const z of some([16, 17, 18, 19, 20], 3)) niche(c - 7, z, 12);
  s.spawner(c, 2, 18, 'minecraft:skeleton');
  s.barrel(c - 6, 2, 15, 'up', 'necrobinder_supply').barrel(c - 6, 2, 21, 'up', 'necrobinder_supply');
  for (const dx of [-3, 3]) s.set(c + dx, 6, 18, 'soul_lantern[hanging=true]');
  for (const [x, z] of [[c - 6, 16], [c + 5, 15], [c - 5, 21], [c + 2, 21]]) s.set(x, 6, z, 'cobweb');
  s.set(c - 4, 2, 19, 'skeleton_skull[rotation=3]').set(c + 2, 2, 16, 'bone_block[axis=x]');
  // the stair down along its east wall, from three trapdoors in the hall floor
  const SX = c + 6;
  for (let k = 0; k <= 7; k++) {
    const z = 24 - k, y = G - 1 - k;
    s.set(SX, y, z, 'polished_blackstone_brick_stairs[facing=south,half=bottom,shape=straight]');
    for (let yy = 1; yy < y; yy++) s.set(SX, yy, z, PBB);
    for (let yy = y + 1; yy <= y + 3; yy++) s.set(SX, yy, z, 'air');
    if (y + 4 < G) s.set(SX, y + 4, z, PBB);
    if (k <= 3) for (const dx of [-1, 1]) for (let yy = y; yy < G; yy++) if (yy >= 7 || k <= 2) s.set(SX + dx, yy, z, PBB);
  }
  for (const z of [22, 23, 24]) s.set(SX, G, z, 'dark_oak_trapdoor[facing=north,half=top,open=false]');

  // ---- abandoned: bone gone chalky or fallen away, moss creeping over the floors
  s.forEach((x, y, z, st) => {
    if (y <= G || !st.startsWith('bone_block')) return;
    if (r.chance(0.07)) s.set(x, y, z, 'calcite'); else if (r.chance(0.03)) s.set(x, y, z, 'air');
  });
  for (let x = c - 6; x <= c + 6; x++) for (let z = 9; z <= 26; z++) if (s.get(x, G + 1, z) === 'air' && s.get(x, G, z) !== 'dark_oak_trapdoor[facing=north,half=top,open=false]' && r.chance(0.06)) s.set(x, G + 1, z, 'moss_carpet');
  return s.save(`necrobinder_giant/${seed}`);
}
const necrobinderTemplates = [necrobinderGiant(1)];
// issue #40: open dry ground like the Ironclad camp, the jaw (+z) turned to the open side; placed after the trees
// (top_layer_modification) so the clearing and the hall cut the trees out. No terrain adaptation: the template
// reaches G blocks underground for the ossuary, and a beard from that deep would hollow the land out.
// Biomes (review: far too rare): the draft's dark forest no longer exists in new worlds - WorldPresetProvider hands every
// dark forest to the overgrowth (v2.4) - and the pale garden is rare and hilly (4 of the first 5 candidates rose 13-45),
// so the gloomy old-growth taigas (dark spruce, podzol and moss, mostly gentle ground) stand in for the dark forest.
special('necrobinder_giant', 'spirecraft:cave_template', ['minecraft:pale_garden', 'minecraft:old_growth_spruce_taiga', 'minecraft:old_growth_pine_taiga'],
  50, 17, { templates: necrobinderTemplates, mode: 'open_ground', sink: 11, step: 'top_layer_modification' });

// template ids used by worldgen/TemplateFeature placements (see BiomeData)
console.log('ok', JSON.stringify(hiveTemplates), pierTemplates);
