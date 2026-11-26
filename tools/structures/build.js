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
  biomes: ['minecraft:plains', 'minecraft:forest', 'minecraft:birch_forest', 'minecraft:taiga', 'minecraft:savanna', 'minecraft:desert', 'minecraft:meadow'],   // no dark_forest: new worlds have none (WorldPresetProvider makes it the overgrowth)
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
  // v3 (user 2026-11-25): bigger, a wooden watchtower, every tent red, no armour stands out in the open, a round council tent.
  // v5 (user, round 3: "the tents are still too big - a small tent about 5x5; the council tent smaller too, its sides need no
  // wool - banners are enough, and it can be entered from almost every side; don't close off one side of the small tents;
  // use fences as supports, not only wool; make the whole camp bigger, more tents, at least a few blocks between them"):
  // palisade radius 25.5; small A-frame tents 5x5 (open at both ends, fence posts under the eaves) scattered with 2+ clear blocks
  // between them; a 7x7 commander's tent; the council tent a low round cone on fence posts, curtained with banners, open
  // to all four sides.
  const r = rng(seed), n = 55, c = 27, R = 25.5, s = new Struct(n, 22, n);
  const BB = 'polished_blackstone_bricks', DB = 'deepslate_bricks';
  const FLOOR = ['dirt_path', 'dirt_path', 'packed_mud', 'gravel', 'packed_mud', 'mud_bricks'];
  const BANNER = { id: 'minecraft:banner', patterns: [] };   // round 4 (user): plain red banners, no black
  const bannerRot = (dx, dz) => ((Math.round(Math.atan2(-dx, dz) / (2 * Math.PI) * 16) % 16) + 16) % 16;   // facing outwards
  // clear the inside and lay a trodden floor (no red sand / coarse dirt: dead bushes grow on those)
  for (let x = 0; x < n; x++) for (let z = 0; z < n; z++) {
    if (Math.hypot(x - c, z - c) > R + 1) continue;
    s.set(x, 0, z, r.pick(FLOOR));
    for (let y = 1; y < 16; y++) s.set(x, y, z, 'air');
  }
  // the palisade: spruce stakes of uneven height, a few broken; the gate (+z) faces the open side
  s.disc(c, 0, c, R + 1, (x, y, z) => {
    if (z > c && Math.abs(x - c) <= 1) return;
    const gatePost = z > c && Math.abs(x - c) === 2, broken = !gatePost && r.chance(0.1);
    const h = gatePost ? 5 : broken ? r.int(1, 2) : r.int(3, 4);
    s.set(x, 0, z, 'packed_mud');
    for (let k = 1; k <= h; k++) s.set(x, k, z, r.chance(0.7) ? 'spruce_log[axis=y]' : 'stripped_spruce_log[axis=y]');
    if (gatePost) s.set(x, h + 1, z, 'campfire[lit=true,facing=south]');
  }, R);
  for (let z = c + 4; z <= n - 1; z++) for (let x = c - 1; x <= c + 1; x++) if (Math.hypot(x - c, z - c) <= R + 1) s.set(x, 0, z, r.chance(0.8) ? 'dirt_path' : 'gravel');
  // places taken, for spacing the tents: [x0, z0, x1, z1]
  const taken = [];
  const free = (x0, z0, x1, z1, m) => taken.every(([p0, q0, p1, q1]) => x1 + m < p0 || p1 + m < x0 || z1 + m < q0 || q1 + m < z0);
  const inCamp = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].every(([x, z]) => Math.hypot(x - c, z - c) <= R - 2);

  // ---- the council tent (north of the middle): a low cone of red wool on eight fence posts, banners hung between
  // them as its walls with an opening to each side; a fire in the middle, a ring of seats, the war table at the back
  const TX = c, TZ = 17, TR = 4.6;
  taken.push([TX - 5, TZ - 5, TX + 5, TZ + 5]);
  for (let x = TX - 5; x <= TX + 5; x++) for (let z = TZ - 5; z <= TZ + 5; z++) {
    const d = Math.hypot(x - TX, z - TZ), dx = x - TX, dz = z - TZ;
    if (d > TR + 0.5) continue;
    s.set(x, 0, z, (x + z) % 3 ? 'spruce_planks' : 'stripped_spruce_log[axis=x]');
    if (d > TR - 0.7) {
      const ang = Math.atan2(dz, dx), post = Math.abs(Math.sin(ang * 4)) < 0.2 && (Math.abs(dx) > 1 && Math.abs(dz) > 1);
      const opening = Math.abs(dx) <= 1 || Math.abs(dz) <= 1;            // a way in on each of the four sides
      if (post) for (let y = 1; y <= 2; y++) s.set(x, y, z, 'dark_oak_fence');
      else if (!opening) s.set(x, 1, z, 'red_banner[rotation=' + bannerRot(dx, dz) + ']', BANNER);
    }
    for (let y = 3; y <= 6; y++) {                                        // the cone (round 4: flatter)
      const rr = TR * (1 - (y - 3) / 4.2);
      if (d <= rr + 0.5 && d > rr - 0.75 && d >= 0.8) s.set(x, y, z, 'red_wool');
    }
  }
  for (const [x, z] of [[TX + 1, TZ + 1], [TX - 1, TZ - 1]]) for (let y = 1; y <= 2; y++) s.set(x, y, z, 'air');
  s.set(TX, 0, TZ, 'stone_bricks').set(TX, 1, TZ, 'campfire[lit=true,facing=south]');
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) s.set(TX + dx, 0, TZ + dz, 'stone_bricks');
  for (const [dx, dz, f] of [[-2, -1, 'west'], [2, -1, 'east'], [-2, 1, 'west'], [2, 1, 'east'], [-1, 2, 'south'], [1, 2, 'south']]) s.set(TX + dx, 1, TZ + dz, 'dark_oak_stairs[facing=' + f + ',half=bottom,shape=straight]');
  s.set(TX - 2, 1, TZ - 3, 'cartography_table').set(TX + 2, 1, TZ - 3, 'lectern[facing=south,has_book=false]');
  s.chest(TX - 1, 1, TZ - 3, 'south', 'ironclad_camp');
  s.set(TX, 4, TZ - 2, 'lantern[hanging=true]').set(TX, 4, TZ + 2, 'lantern[hanging=true]');

  // ---- an A-frame tent w x w (w odd), ridge along 'z' or 'x', open at both ends; fence posts under the eaves at the
  // corners and the middle of each side. Returns a function mapping (u across, v along) to [x, z].
  const tent = (x0, z0, w, axis) => {
    const at = (u, v) => axis === 'z' ? [x0 + u, z0 + v] : [x0 + v, z0 + u], m = (w - 1) / 2;
    for (let u = 0; u < w; u++) for (let v = 0; v < w; v++) {
      const [x, z] = at(u, v), h = 2 + m - Math.abs(u - m);           // the roof's height over this row
      if (u > 0 && u < w - 1) s.set(x, 0, z, (u + v) % 3 ? 'spruce_planks' : 'stripped_spruce_log[axis=' + axis + ']');
      s.set(x, h, z, 'red_wool');
      const edge = u === 0 || u === w - 1, postV = v === 0 || v === w - 1 || v === m;
      if (edge && postV) s.set(x, 1, z, 'dark_oak_fence');
    }
    const [lx, lz] = at(m, m); s.set(lx, 1 + m, lz, 'lantern[hanging=true]');
    taken.push([Math.min(...[at(0, 0)[0], at(w - 1, w - 1)[0]]), Math.min(at(0, 0)[1], at(w - 1, w - 1)[1]), Math.max(at(0, 0)[0], at(w - 1, w - 1)[0]), Math.max(at(0, 0)[1], at(w - 1, w - 1)[1])]);
    return at;
  };
  const along = (axis, sign) => axis === 'z' ? (sign > 0 ? 'south' : 'north') : (sign > 0 ? 'east' : 'west');

  // ---- the forge (west): a hearth of deepslate over magma, a chimney that always smokes, the brimstone stock
  const FX = 12, FZ = 30;
  taken.push([FX - 3, FZ - 3, FX + 4, FZ + 3]);
  for (let x = FX - 3; x <= FX + 4; x++) for (let z = FZ - 3; z <= FZ + 3; z++) s.set(x, 0, z, r.chance(0.7) ? BB : 'blackstone');
  s.fill(FX - 3, 1, FZ - 2, FX - 3, 3, FZ + 2, DB);
  s.fill(FX - 2, 1, FZ - 2, FX - 1, 3, FZ - 2, DB).fill(FX - 2, 1, FZ + 2, FX - 1, 3, FZ + 2, DB);
  s.fill(FX - 2, 1, FZ - 1, FX - 2, 1, FZ + 1, 'magma_block');
  s.fill(FX - 3, 4, FZ - 2, FX - 1, 4, FZ + 2, 'polished_blackstone_brick_slab[type=bottom]');
  s.fill(FX - 3, 4, FZ - 1, FX - 3, 9, FZ + 1, DB);
  for (let y = 4; y <= 9; y++) s.set(FX - 3, y, FZ, y === 4 ? 'campfire[lit=true,facing=east]' : 'air');
  s.set(FX, 1, FZ - 2, 'chipped_anvil[facing=north]').set(FX + 1, 1, FZ - 2, 'water_cauldron[level=3]');
  s.set(FX, 1, FZ + 2, 'grindstone[face=floor,facing=east]').set(FX + 1, 1, FZ + 2, 'smithing_table').set(FX - 1, 1, FZ + 3, 'blast_furnace[facing=east,lit=false]');
  s.set(FX + 3, 1, FZ - 3, 'spirecraft:brimstone_block').set(FX + 4, 1, FZ - 3, 'spirecraft:brimstone_block').set(FX + 3, 2, FZ - 3, 'spirecraft:brimstone_block').set(FX + 4, 1, FZ - 2, 'coal_block');
  s.barrel(FX + 4, 1, FZ + 3, 'up', 'ironclad_supply');
  weather(s, r, { [DB]: ['cracked_deepslate_bricks'], [BB]: ['cracked_polished_blackstone_bricks'] }, 0.25);

  // ---- the watchtower (east of the gate): log posts to the platform, fences above, fence rails and braces, a ladder
  const WX = 34, WZ = 39;
  taken.push([WX - 1, WZ - 1, WX + 4, WZ + 4]);
  for (const [dx, dz] of [[0, 0], [3, 0], [0, 3], [3, 3]]) for (let y = 1; y <= 13; y++) s.set(WX + dx, y, WZ + dz, y <= 9 ? 'spruce_log[axis=y]' : 'spruce_fence');
  for (const y of [3, 6]) for (let k = 1; k <= 2; k++) for (const [x, z] of [[WX + k, WZ], [WX + k, WZ + 3], [WX, WZ + k], [WX + 3, WZ + k]]) s.set(x, y, z, 'spruce_fence');
  for (const [y, k] of [[4, 1], [5, 2], [7, 1], [8, 2]]) for (const [x, z] of [[WX + k, WZ], [WX + 3 - k, WZ + 3], [WX, WZ + 3 - k], [WX + 3, WZ + k]]) s.set(x, y, z, 'spruce_fence');
  for (let x = WX - 1; x <= WX + 4; x++) for (let z = WZ - 1; z <= WZ + 4; z++) {
    s.set(x, 9, z, 'spruce_planks');
    const edge = x === WX - 1 || x === WX + 4 || z === WZ - 1 || z === WZ + 4;
    if (edge) s.set(x, 10, z, 'spruce_fence');
    s.set(x, 14, z, edge ? 'spruce_slab[type=bottom]' : 'spruce_planks');
  }
  for (let y = 1; y <= 9; y++) s.set(WX + 1, y, WZ + 2, y === 9 ? 'spruce_trapdoor[facing=north,half=top,open=false]' : 'ladder[facing=north]');
  for (let y = 1; y <= 9; y++) s.set(WX + 1, y, WZ + 3, 'spruce_planks');
  s.set(WX + 2, 10, WZ + 1, 'lantern[hanging=false]').set(WX + 1, 10, WZ + 1, 'barrel[facing=up]');
  s.set(WX + 2, 13, WZ + 2, 'bell[attachment=ceiling,facing=north]');

  // ---- the flagpole and the fire pit in the middle, training dummies inside the gate (hay and pumpkins)
  taken.push([c - 6, 25, c + 6, 30], [c - 2, 31, c + 2, n - 1]);   // the middle and the gate lane
  s.fill(c - 1, 0, 27, c + 1, 0, 29, BB).set(c, 1, 28, 'polished_blackstone_wall');
  for (let y = 2; y <= 19; y++) s.set(c, y, 28, 'dark_oak_fence');
  for (let x = c + 1; x <= c + 5; x++) for (let y = 15; y <= 18; y++) if (!(x === c + 5 && r.chance(0.5))) s.set(x, y, 28, 'red_wool');
  s.set(c - 4, 0, 27, 'stone').set(c - 4, 1, 27, 'campfire[lit=false,facing=north]');
  s.set(c - 6, 1, 27, 'stripped_dark_oak_log[axis=z]').set(c - 2, 1, 27, 'stripped_dark_oak_log[axis=z]').set(c - 4, 1, 29, 'stripped_dark_oak_log[axis=x]');
  taken.push([16, 40, 23, 45]);
  for (const [x, z] of [[17, 41], [20, 43], [23, 44]]) {
    s.set(x, 1, z, 'spruce_fence').set(x, 2, z, 'hay_block').set(x, 3, z, 'carved_pumpkin[facing=east]');
    s.set(x + 1, 0, z, 'gravel');
  }

  // ---- the commander's tent (north-east, 7x7): his bed, the main chest, a map table, a banner at each end
  {
    const at = tent(36, 13, 7, 'x');
    const [hx, hz] = at(1, 1), [fx, fz] = at(1, 2);
    s.set(hx, 1, hz, 'red_bed[facing=west,part=head]'); s.set(fx, 1, fz, 'red_bed[facing=west,part=foot]');
    { const [x, z] = at(5, 1); s.chest(x, 1, z, 'north', 'ironclad_camp'); }
    { const [x, z] = at(5, 2); s.set(x, 1, z, 'barrel[facing=up]'); }
    { const [x, z] = at(5, 4); s.set(x, 1, z, 'cartography_table'); }
    { const [x, z] = at(1, 5); s.set(x, 1, z, 'smithing_table'); }
    for (const v of [0, 6]) { const [x, z] = at(3, v); s.set(x, 1, z, 'red_banner[rotation=' + (v ? 12 : 4) + ']', BANNER); }
  }
  // ---- the soldiers' tents: small (5x5), as many as fit (up to 9), scattered, ridges every way, 2+ clear blocks between them
  // round 4 (user: spread the camp's things evenly): each tent goes where it is farthest from everything already placed
  const farthest = (w, d, m) => {
    let best = null;
    for (let x0 = 2; x0 < n - w - 1; x0++) for (let z0 = 2; z0 < n - d - 1; z0++) {
      if (!inCamp(x0, z0, x0 + w - 1, z0 + d - 1) || !free(x0, z0, x0 + w - 1, z0 + d - 1, m)) continue;
      const cx2 = x0 + w / 2, cz2 = z0 + d / 2;
      const score = taken.reduce((mn, [p0, q0, p1, q1]) => Math.min(mn, Math.hypot(cx2 - (p0 + p1) / 2, cz2 - (q0 + q1) / 2)), 99) + r() * 0.5;
      if (!best || score > best.score) best = { x0, z0, score };
    }
    return best;
  };
  let placed = 0;
  for (let k = 0; k < 9; k++) {
    const spot = farthest(5, 5, 2);
    if (!spot) break;
    const { x0, z0 } = spot, axis = r.chance(0.5) ? 'x' : 'z';
    const at = tent(x0, z0, 5, axis);
    const [hx, hz] = at(1, 1), [fx, fz] = at(1, 2), back = along(axis, -1);
    s.set(hx, 1, hz, 'red_bed[facing=' + back + ',part=head]'); s.set(fx, 1, fz, 'red_bed[facing=' + back + ',part=foot]');
    const [bx, bz] = at(3, 1);
    if (placed % 3 === 0) s.barrel(bx, 1, bz, 'up', 'ironclad_supply'); else s.set(bx, 1, bz, r.pick(['barrel[facing=up]', 'crafting_table', 'hay_block']));
    if (r.chance(0.5)) { const [x, z] = at(3, 3); s.set(x, 1, z, 'red_carpet'); }
    placed++;
  }
  // log piles (round 4): spruce logs stacked three long, two high, in the gaps left
  for (let k = 0; k < 5; k++) {
    const along = r.chance(0.5), w = along ? 3 : 2, d = along ? 2 : 3, spot = farthest(w, d, 2);
    if (!spot) break;
    for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) { s.set(spot.x0 + i, 1, spot.z0 + j, 'spruce_log[axis=' + (along ? 'x' : 'z') + ']'); if ((along ? j : i) === 0 || r.chance(0.5)) s.set(spot.x0 + i, 2, spot.z0 + j, 'spruce_log[axis=' + (along ? 'x' : 'z') + ']'); }
    taken.push([spot.x0, spot.z0, spot.x0 + w - 1, spot.z0 + d - 1]);
  }
  // supplies stacked here and there
  for (const [x, z] of [[20, 25], [34, 25], [17, 21]]) if (s.get(x, 1, z) === 'air') { s.barrel(x, 1, z, 'up', 'ironclad_supply'); s.set(x + 1, 1, z, 'hay_block').set(x + 1, 2, z, 'barrel[facing=up]'); }
  return s.save('ironclad_camp/' + seed);
}
const ironcladTemplates = [ironcladCamp(1)];
// v3.7: the Ironclad camp on open flat dry ground, its gate turned to the open side (SpireStructures.CaveTemplate.openGround)
special('ironclad_camp', 'spirecraft:cave_template', ['minecraft:badlands', 'minecraft:eroded_badlands', 'minecraft:wooded_badlands', 'minecraft:savanna', 'minecraft:savanna_plateau'],
  56, 20, { templates: ironcladTemplates, mode: 'open_ground', sink: 1, terrain_adaptation: 'beard_box' });

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
  const r = rng(seed), n = 47, G = 12, P = G + 1, CG = G - 3, s = new Struct(n, 23, n);   // v4: P on the ground; CG the cellar floor   // G: 12 down for the vault under the cellar
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
  // v3 (user 2026-11-25: not plank walls - walls of mangrove roots, almost closed in): woven roots, muddy roots at the
  // foot, now and then a mangrove log grown into the wall
  const WALLS = ['mangrove_roots', 'mangrove_roots', 'mangrove_roots', 'muddy_mangrove_roots', 'mangrove_log[axis=y]'];

  // ---- deck, walls, ceilings, stilts (the deck is 2 above the ground: room to crawl under it)
  for (let x = 0; x < n; x++) for (let z = 0; z < n; z++) {
    const k = kind(x, z), w = isWall(x, z), rl = rail.has(key(x, z));
    if (!k && !w && !rl) continue;
    s.set(x, P, z, r.pick(['dark_oak_planks', 'spruce_planks', 'spruce_planks', 'dark_oak_planks', 'stripped_spruce_log[axis=x]']));
    if (x % 3 === 0 && z % 3 === 0) for (let y = 0; y < P; y++) s.set(x, y, z, LOG);
    // v4 (user: on the ground, covered in mangrove roots, not tidy; no need for full box rooms inside)
    if (w) {
      const h = P + 3 + (r.chance(0.35) ? 1 : 0) + (r.chance(0.15) ? 1 : 0);
      for (let y = P + 1; y <= h; y++) s.set(x, y, z, x % 4 === 0 && z % 4 === 0 ? LOG : y === P + 1 && r.chance(0.5) ? 'muddy_mangrove_roots' : r.pick(WALLS));
    }
    else if (rl) { s.set(x, P + 1, z, FENCE); s.set(x, P + 2, z, 'air').set(x, P + 3, z, 'air'); }
    else {
      const top = P + 3 + (r.chance(0.25) ? 1 : 0);
      for (let y = P + 1; y <= top; y++) s.set(x, y, z, 'air');
      if (k === 'room') { s.set(x, top + 1, z, r.chance(0.7) ? 'mangrove_roots' : 'muddy_mangrove_roots'); if (r.chance(0.14)) s.set(x, top, z, 'hanging_roots'); }
    }
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
  // roots grown over the outside of the walls, in clumps of uneven height; some reach in over the rooms
  for (const k of wall) {
    const [x, z] = k.split(',').map(Number);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ox = x + dx, oz = z + dz;
      if (covered(ox, oz) || floor.has(key(ox, oz)) || rail.has(key(ox, oz))) { if (kind(ox, oz) === 'room' && r.chance(0.12)) s.set(ox, P + 3, oz, 'mangrove_roots'); continue; }
      if (!r.chance(0.4)) continue;
      const h = r.int(1, 4);
      for (let y = P; y <= P + h; y++) if (!s.get(ox, y, oz) || s.get(ox, y, oz) === 'air') s.set(ox, y, oz, y === P ? 'muddy_mangrove_roots' : r.chance(0.75) ? 'mangrove_roots' : 'mangrove_log[axis=y]');
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
  s.set(19, P + 3, 13, 'stripped_mangrove_log[axis=y]').set(20, P + 3, 13, 'green_wall_banner[facing=east]', banner(bandage));
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
    s.set(x, CG, z, edge ? 'mud_bricks' : 'packed_mud');
    for (let y = CG + 1; y <= CG + 2; y++) s.set(x, y, z, edge ? r.pick(['mud_bricks', 'mud_bricks', 'packed_mud', 'mangrove_roots']) : 'air');
    s.set(x, G, z, 'mud').set(x, CG + 3, z, 'packed_mud');
  }
  for (let y = CG + 1; y <= G; y++) s.set(12, y, 18, 'ladder[facing=south]');
  for (let y = CG + 3; y <= G; y++) { s.set(11, y, 18, 'mud_bricks'); s.set(13, y, 18, 'mud_bricks'); s.set(12, y, 17, 'mud_bricks'); s.set(12, y, 19, 'mud_bricks'); }
  s.barrel(14, CG + 1, 20, 'up', 'silent_supply');
  s.set(14, CG + 1, 18, 'decorated_pot[facing=west]').set(12, CG + 1, 20, 'lantern[hanging=false]');
  for (const [x, z] of [[13, 18], [12, 19], [13, 19], [14, 19], [13, 20]]) s.set(x, CG + 1, z, 'moss_carpet');
  s.set(13, CG, 19, 'spruce_trapdoor[facing=south,half=top,open=false]');

  // ---- the vault, deep under the cellar: a shaft down, a trapped passage, a room, the main chest trapped too
  const EARTH = ['mud_bricks', 'mud_bricks', 'packed_mud', 'mud', 'rooted_dirt'];
  for (let x = 8; x <= 18; x++) for (let z = 17; z <= 31; z++) {
    for (let y = 1; y <= 5; y++) s.set(x, y, z, r.pick(EARTH));
    s.set(x, 0, z, 'packed_mud').set(x, 6, z, r.pick(['packed_mud', 'dirt', 'mud']));
  }
  // the shaft: a mud brick tube from under the hatch to the vault floor, the ladder on its north side
  for (let y = 2; y < CG; y++) for (let x = 12; x <= 14; x++) for (let z = 18; z <= 20; z++) s.set(x, y, z, x === 13 && z === 19 ? 'air' : 'mud_bricks');
  for (let y = 2; y < CG; y++) s.set(13, y, 19, 'ladder[facing=south]');
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
  s.set(17, P + 1, 21, 'tripwire_hook[attached=true,facing=north,powered=false]').set(17, P + 1, 22, 'mangrove_log[axis=y]');
  for (const [x, y, z] of [[17, P + 3, 18], [16, P + 1, 18], [16, P + 2, 18], [16, P + 3, 18], [17, P + 1, 17], [17, P + 2, 17], [17, P + 3, 17]]) s.set(x, y, z, leaf());

  // ---- the hollow stump: a ring of mangrove logs under the entry room, the ladder inside it
  const SX = 22, SZ = 38;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    s.set(SX + dx, G, SZ + dz, 'mud');
    if (dx === 0 && dz === 0) continue;
    for (let y = G - 2; y < P; y++) s.set(SX + dx, y, SZ + dz, dx === 0 && dz === 1 && y > G && y <= G + 2 ? 'air' : LOG);
  }
  s.set(SX, P, SZ, 'mangrove_planks').set(SX, P, SZ + 1, 'mangrove_planks');
  for (const z of [SZ + 1]) for (let y = P + 1; y <= P + 2; y++) s.set(SX, y, z, 'air');   // the doorway out to the tunnel
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
// v3 (user 2026-11-25): in the mangrove swamp only (the jungle gets the tribe's village, issue #37b)
special('silent_gathering', 'spirecraft:cave_template', ['minecraft:mangrove_swamp'],
  50, 17, { templates: silentTemplates, mode: 'stilts', sink: 13, ignore_waterlogging: true, step: 'top_layer_modification' });

/** The Regent's meteor crater (issue #36): carved into the land by worldgen/SpireStructures "meteor_crater" - the bowl,
 * the split fallen star with its Orange Dough core, meteorite boulders and ejecta. v2 (user 2026-11-25): purely natural,
 * no forge, chests or banner. What the Regent left is buried: 3-4 blocks of suspicious gravel in the floor, each giving one
 * thing when brushed (archaeology table): galactic dust, gold, lapis, amethyst, Orange Dough, now and then a Regent weapon. */
loot('regent_crater', [
  { rolls: 1, items: [['spirecraft:galactic_dust', 14, 2, 5], ['gold_nugget', 10, 3, 7], ['gold_ingot', 4], ['lapis_lazuli', 8, 2, 5], ['amethyst_shard', 6, 1, 3], ['spirecraft:orange_dough', 6, 1, 2], ['blackstone', 3],
    ['spirecraft:regent_strike', 4], ['spirecraft:photon_cut', 2], ['spirecraft:crescent_spear', 2], ['spirecraft:heirloom_hammer', 1]] },
], 'archaeology');
// not on snowy plains: the snow laid after the structures buried the dough and the split star
special('regent_crater', 'spirecraft:carved', ['minecraft:desert', 'minecraft:meadow'],
  50, 17, { kind: 'meteor_crater', step: 'surface_structures' });

// (2026-11-26, docs/design/glory.md v2: the Defect's cooling station is gone - the snowfields now hold the Globe
// Heads' electromagnetic laboratory; the station's loot went into the automaton factory's)
/** The Necrobinder's giant (issue #40, soul and doom): the skeleton of an ancient giant lying half-buried on its back in
 * the dark forest / pale garden, in a clearing where nothing grows. Its ribs arch out of the ground into a hall where she
 * lived (purple curtains, books, soul lanterns hanging from the ribs); the skull, its jaw dropped open on the ground
 * towards +z (the open side, SpireStructures.CaveTemplate.openGround), holds her phylactery altar and the main chest,
 * soul fire burning in the eye sockets. One arm lies along the ground east of the ribs, its hand reaching up out of it.
 * v2 (user 2026-11-25): no furnishings, no ossuary - a natural place overgrown with flowers, the skull lying on its side,
 * a gravestone with flowers in front; her things lie buried in suspicious gravel.
 * Layer G is the top soil; the long axis is z: pelvis at 0, ribs 10-25, neck, skull 30-44, jaw to 47. */
// v2: no chests (a natural place) - her things lie buried, one per block of suspicious gravel
loot('necrobinder_giant', [
  { rolls: 1, items: [['bone', 12, 2, 5], ['wither_rose', 3], ['soul_soil', 5, 1, 3], ['book', 6], ['amethyst_shard', 6, 1, 3], ['ink_sac', 5, 1, 2], ['potion', 3, 1, 1, { potion: 'spirecraft:doom' }],
    ['spirecraft:scythe', 3], ['spirecraft:scourge', 3], ['spirecraft:dirge_flute', 2], ['spirecraft:forbidden_grimoire', 2], ['spirecraft:danse_macabre', 1]] },
], 'archaeology');
loot('necrobinder_grave', [
  { rolls: [3, 6], items: [['bone', 10, 2, 6], ['book', 6, 1, 3], ['amethyst_shard', 6, 1, 4], ['ink_sac', 5, 1, 3], ['soul_soil', 4, 1, 3], ['wither_rose', 3, 1, 2], ['candle', 4, 1, 2]] },
  { rolls: 1, items: [['empty', 45], ['spirecraft:scythe', 12], ['spirecraft:scourge', 12], ['spirecraft:forbidden_grimoire', 8], ['spirecraft:danse_macabre', 5]] },
  // round 3 (user: the chest can hold Doom potions and the flute)
  { rolls: [1, 2], items: [['potion', 6, 1, 1, { potion: 'spirecraft:doom' }], ['splash_potion', 3, 1, 1, { potion: 'spirecraft:doom' }], ['empty', 2]] },
  { rolls: 1, items: [['spirecraft:dirge_flute', 6], ['empty', 4]] },
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
  // ---- v2 (user 2026-11-25: a purely natural place, grown over with flowers): the ground between the ribs is grass,
  // moss and dirt; the spine down the middle
  for (let x = c - 7; x <= c + 7; x++) for (let z = 9; z <= 26; z++)
    s.set(x, G, z, r.chance(0.12) ? 'moss_block' : r.chance(0.06) ? 'rooted_dirt' : 'grass_block[snowy=false]');

  // flowers (v3, user: mostly the two-block-tall ones): lilacs, rose bushes, peonies, tall grass and ferns, then the
  // Necrobinder's pale small flowers and pink petals between them
  const TALL = ['lilac', 'lilac', 'rose_bush', 'peony', 'peony', 'tall_grass', 'large_fern'];
  const FLOWERS = ['allium', 'azure_bluet', 'lily_of_the_valley', 'oxeye_daisy', 'cornflower', 'white_tulip', 'short_grass'];
  const flower = (x, y, z) => {
    const q = r();
    if (q < 0.58 && (s.get(x, y + 1, z) === 'air' || s.get(x, y + 1, z) === 'in')) { const t = r.pick(TALL); s.set(x, y, z, t + '[half=lower]').set(x, y + 1, z, t + '[half=upper]'); }
    else if (q < 0.7) s.set(x, y, z, `pink_petals[facing=${r.pick(['north', 'south', 'east', 'west'])},flower_amount=${r.int(1, 4)}]`);
    else s.set(x, y, z, r.pick(FLOWERS));
  };

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
    arch(z, rx, ry, G + 3, () => 1, (x, y, zz, axis, side) => { s.set(x, y, zz, BONE(axis)); cells.push([x, y, side]); });
    ribCells.set(z, cells);
  }
  // ---- the spine (v3, user: the ribs hang from the spine along their tops; towards the tail it slopes down to the
  // pelvis and into the ground; at the front it bends down into the back of the skull)
  const ribTop = new Map(RIBS.map(([z]) => [z, Math.max(...ribCells.get(z).map(([, y]) => y))]));
  const SPINE = [[c, G - 2, -1], [c, G, 2], [c, G + 4, 5], [c, ribTop.get(10) - 1, 8], ...RIBS.map(([z]) => [c, ribTop.get(z), z]), [c + 1, ribTop.get(25) - 2, 27], [c + 3, G + 7, 29], [c + 4, G + 5, 31]];
  const line3 = ([ax, ay, az], [bx, by, bz]) => { const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay), Math.abs(bz - az)) * 3; let prev = null;
    for (let i = 0; i <= n; i++) { const p = [Math.round(ax + (bx - ax) * i / n), Math.round(ay + (by - ay) * i / n), Math.round(az + (bz - az) * i / n)];
      if (prev && prev[1] !== p[1] && prev[2] !== p[2]) s.set(p[0], prev[1], p[2], BONE('z'));   // no diagonal gaps
      s.set(p[0], p[1], p[2], BONE('z')); prev = p; } };
  for (let i = 0; i + 1 < SPINE.length; i++) line3(SPINE[i], SPINE[i + 1]);
  // short spinous processes standing up from the vertebrae over the ribcage and the tail
  for (let z = 1; z <= 26; z += 2) { let y = H - 1; while (y > G && s.get(c, y, z) !== BONE('z')) y--; if (y > G - 2 && s.get(c, y + 1, z) === 'air') s.set(c, y + 1, z, BONE('y')); }
  // the pelvis (two wings curving up either side of the spine) and the stubs of the thigh bones going on under the ground
  for (const [z, rx, ry] of [[4, 5.5, 3.5], [5, 6, 4], [6, 5.5, 3.5]]) arch(z, rx, ry, G, () => 2, (x, y, zz, axis) => s.set(x, y, zz, BONE(axis)));
  for (const side of [-1, 1]) {
    for (let z = 0; z <= 3; z++) s.set(c + side * 4, G, z, BONE('z')).set(c + side * 4, G - 1, z, BONE('z'));
    s.set(c + side * 4, G + 1, 3, BONE('y'));
  }

  // ---- the skull (v2, user: the lower half stood taller than the top, and it could lie on its side): built upright in
  // its own frame - a big cranium and a smaller face below its front, eye sockets, a nose, a row of upper teeth, the
  // underside open where the jaw hung - then laid on its left side: its top points west (-x), its face to +z, its
  // open underside to the east, half a block sunk. Inside, earth and flowers.
  // v4 (user, round 4: the head should not face forward but to one side): still on its side, but its top now points
  // forward (+z, away from the neck), its open underside back at the spine, its face turned west (FS = -1) or east.
  const SZ = 31, SCX = c, SCY = G + 4, FS = -1;
  // local (lx: right of the face, ly: up, lz: forward) -> world: x = SCX + FS * lz, y = SCY + lx, z = SZ + ly
  const sk = (lx, ly, lz, k) => {
    const cr = (lx / (6 - k)) ** 2 + ((ly - 5.6) / (5.8 - k)) ** 2 + ((lz + 0.8) / (6.8 - k)) ** 2;   // cranium
    const fc = (lx / (4.6 - k)) ** 2 + ((ly - 1.9) / (3.3 - k)) ** 2 + ((lz - 3.3) / (3.6 - k)) ** 2;   // face
    return Math.min(cr, fc);
  };
  const skull = new Map();
  for (let x = SCX - 9; x <= SCX + 9; x++) for (let y = G - 3; y <= SCY + 7; y++) for (let z = SZ - 2; z <= SZ + 13; z++) {
    const ly = z - SZ, lx = y - SCY, lz = FS * (x - SCX);
    if (ly < 0.2) continue;                                         // the open underside
    if (sk(lx, ly, lz, 0) > 1) continue;
    const inner = sk(lx, ly, lz, 1.15) <= 1;
    // eye sockets and the nose go through the shell at the front of the face
    const eye = Math.hypot(Math.abs(lx) - 2.5, ly - 4.1, Math.max(0, 5.2 - lz) * 0.6) < 1.45 && lz > 1.5;
    const nose = Math.hypot(lx, ly - 2.4, Math.max(0, 6 - lz) * 0.5) < 0.95 && lz > 3;
    skull.set(x + ',' + y + ',' + z, inner ? 'in' : eye || nose ? 'hole' : 'bone');
  }
  for (const [k, v] of skull) {
    const [x, y, z] = k.split(',').map(Number);
    if (y < G - 3) continue;
    s.set(x, y, z, v === 'bone' ? BONE('x') : 'air');
  }
  // upper teeth along the front of the open underside
  for (let lx = -3; lx <= 3; lx += 1) { const x = SCX + FS * 5, y = SCY + lx, z = SZ - 1; if (Math.abs(lx) !== 2 && y >= G) s.set(x, y, z, BONE('z')); }
  // inside: earth on the lowest cells, flowers on it (the eye socket on the upper side lets the light in)
  for (const [k, v] of skull) {
    if (v !== 'in') continue;
    const [x, y, z] = k.split(',').map(Number);
    if (skull.get(x + ',' + (y - 1) + ',' + z) === 'in' || y < G) continue;
    // round 3 (user: "floating moss blocks inside the body"): earth only where it rests on bone or on the ground
    const below = String(s.get(x, y - 1, z));
    if (y !== G && !below.startsWith('bone_block') && !/dirt|grass|moss/.test(below)) continue;
    s.set(x, y, z, r.chance(0.2) ? 'moss_block' : 'grass_block[snowy=false]');
    if (skull.get(x + ',' + (y + 1) + ',' + z) === 'in' && r.chance(0.55)) flower(x, y + 1, z);
  }
  // the lower jaw (v3, user: it stays on its side like the skull - standing, opened sideways): a U of bone in the
  // skull's own frame (two rami from the hinge forward, the chin across), turned open 32 degrees about the hinge, so it
  // stands upright east of the face; teeth along the rami point back at the skull
  const OPEN = 0.56, HZ = -2.5, HY = 0.4;
  const jaw = (lx, lz) => { const d = lz - HZ, ly = HY - d * Math.sin(OPEN), lz2 = HZ + d * Math.cos(OPEN); return [Math.round(SCX + FS * lz2), Math.round(SCY + lx), Math.round(SZ + ly)]; };
  for (let lz = HZ; lz <= 4.6; lz += 0.25) for (const lx of [-3.6, 3.6]) {
    const [x, y, z] = jaw(lx, lz);
    if (y >= G) s.set(x, y, z, BONE('x')).set(x, y, z - 1, BONE('x'));
    if (lz > 0.5 && Math.round(lz * 4) % 6 === 0) { const [tx, ty, tz] = jaw(lx * 0.8, lz); if (ty >= G) s.set(tx, ty, tz + 1, BONE('z')); }   // teeth
  }
  for (let lx = -3.6; lx <= 3.6; lx += 0.25) { const [x, y, z] = jaw(lx, 4.6); if (y >= G) s.set(x, y, z, BONE('y')).set(x, y, z - 1, BONE('y')); }
  // the gravestone beside the head (east of the skull since round 4 - the face looks west), a bunch of flowers before it
  const GX = c + 10, GZ = 33;
  for (let x = GX - 1; x <= GX + 1; x++) for (let z = GZ - 1; z <= GZ + 2; z++) s.set(x, G, z, 'grass_block[snowy=false]').set(x, G + 1, z, 'air').set(x, G + 2, z, 'air').set(x, G + 3, z, 'air');
  s.set(GX - 1, G + 1, GZ, 'mossy_stone_brick_wall').set(GX + 1, G + 1, GZ, 'mossy_stone_brick_wall');
  s.set(GX, G + 1, GZ, 'chiseled_stone_bricks').set(GX, G + 2, GZ, 'mossy_stone_bricks').set(GX, G + 3, GZ, 'stone_brick_slab[type=bottom]');
  s.set(GX - 1, G + 2, GZ, 'stone_brick_stairs[facing=east,half=bottom,shape=straight]').set(GX + 1, G + 2, GZ, 'stone_brick_stairs[facing=west,half=bottom,shape=straight]');
  s.set(GX, G + 1, GZ + 1, 'allium').set(GX - 1, G + 1, GZ + 1, 'lily_of_the_valley').set(GX + 1, G + 1, GZ + 1, 'azure_bluet');
  s.set(GX, G + 1, GZ + 2, 'pink_petals[facing=north,flower_amount=4]');
  s.chest(GX, G - 1, GZ + 1, 'south', 'necrobinder_grave');   // buried a block under the flowers before the stone
  // what she left is buried by the grave and in the skull: suspicious gravel (brush it - vanilla archaeology)
  const DIG = { id: 'minecraft:brushable_block', LootTable: 'spirecraft:archaeology/necrobinder_giant' };
  s.set(GX + 1, G, GZ + 2, 'suspicious_gravel[dusted=0]', DIG).set(GX - 1, G, GZ - 1, 'suspicious_gravel[dusted=0]', DIG);
  s.set(c - 6, G, 18, 'suspicious_gravel[dusted=0]', DIG);

  // ---- the arm along the ground east of the ribs, and the hand reaching up out of it
  line(...SH, ...EL, (x, z) => s.set(x, G, z, BONE('x')).set(x, G - 1, z, BONE('x')));
  // round 3 (user: "the hand is sunk into the ground - raise it a little"): the forearm rises from the ground to the
  // wrist, and the palm and the fingers lie flat one block up, on the knuckles' bones, clear of the soil
  for (const dx of [0, 1]) line(EL[0] + dx, EL[1], WR[0] + dx, WR[1], (x, z, t) => { s.set(x, G, z, BONE('z')); if (t > 0.45) s.set(x, G + 1, z, BONE('z')); });
  const H1 = G + 1;
  for (let x = PALM[0] - 3; x <= PALM[0] + 3; x++) for (let z = PALM[1] - 2; z <= PALM[1] + 2; z++) {
    s.set(x, H1, z, BONE('x'));
    if ((x - PALM[0]) % 3 === 0 && Math.abs(z - PALM[1]) === 2) s.set(x, G, z, BONE('y'));   // the heel of the palm and the knuckles resting on the ground
  }
  [5, 6, 6, 5].forEach((len, i) => line(PALM[0] - 3 + i * 2, PALM[1] - 3, Math.round(PALM[0] - 3 + i * 2 + (i - 1.5) * 1.4), PALM[1] - 3 - len,
    (x, z, t) => { s.set(x, H1, z, BONE('z')); if (t > 0.95) s.set(x, G, z, BONE('y')); }));   // fingertips touch the ground
  line(PALM[0] - 4, PALM[1] + 1, PALM[0] - 8, PALM[1] + 3, (x, z, t) => { s.set(x, H1, z, BONE('x')); if (t > 0.95) s.set(x, G, z, BONE('y')); });   // the thumb

  // ---- the hall: grown over with flowers between the ribs; a few cobwebs high up
  for (let x = c - 6; x <= c + 6; x++) for (let z = 9; z <= 26; z++) {
    if (x === c || s.get(x, G + 1, z) !== 'air' || !String(s.get(x, G, z)).match(/grass|moss/)) continue;
    if (r.chance(0.62)) flower(x, G + 1, z);
  }
  // round 3 (user: cobwebs on the skeleton and round it): webs strung between the ribs, in the skull and under the
  // spine, and low webs in the grass round the bones
  for (let i = 0; i < 26; i++) {
    const z = r.pick(RIBS)[0], cells = ribCells.get(z).filter(([, y]) => y >= G + 3), [x, y] = r.pick(cells);
    const zz = z + r.pick([1, -1, 2, -2]);
    if (s.get(x, y, zz) === 'air') s.set(x, y, zz, 'cobweb');
  }
  for (let z = 9; z <= 26; z++) { let y = H - 1; while (y > G && s.get(c, y, z) === 'air') y--; if (y > G + 2 && s.get(c, y - 1, z) === 'air' && r.chance(0.3)) s.set(c, y - 1, z, 'cobweb'); }
  for (const [k, v] of skull) { if (v !== 'in' || !r.chance(0.05)) continue; const [x, y, z] = k.split(',').map(Number); if (s.get(x, y, z) === 'air' && y > G) s.set(x, y, z, 'cobweb'); }
  for (let i = 0; i < 40; i++) {
    const x = r.int(2, W - 3), z = r.int(2, D - 3);
    if (s.get(x, G + 1, z) !== 'air' || !/grass|moss|dirt|podzol/.test(String(s.get(x, G, z)))) continue;
    const nearBone = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => String(s.get(x + dx, G + 1, z + dz)).startsWith('bone_block') || String(s.get(x + dx, G, z + dz)).startsWith('bone_block'));
    if (nearBone || r.chance(0.15)) s.set(x, G + 1, z, 'cobweb');
  }

  // ---- abandoned: bone gone chalky or fallen away, moss creeping over the floors
  s.forEach((x, y, z, st) => {
    if (y <= G || !st.startsWith('bone_block')) return;
    if (r.chance(0.03)) s.set(x, y, z, 'air');
  });
  return s.save(`necrobinder_giant/${seed}`);
}
const necrobinderTemplates = [necrobinderGiant(1)];
// issue #40: open dry ground like the Ironclad camp, the jaw (+z) turned to the open side; placed after the trees
// (top_layer_modification) so the clearing and the hall cut the trees out. No terrain adaptation: the template
// reaches G blocks underground (earth under the clearing), and a beard from that deep would hollow the land out.
// Biomes (review: far too rare): the draft's dark forest no longer exists in new worlds - WorldPresetProvider hands every
// dark forest to the overgrowth (v2.4) - and the pale garden is rare and hilly (4 of the first 5 candidates rose 13-45),
// so the gloomy old-growth taigas (dark spruce, podzol and moss, mostly gentle ground) stand in for the dark forest.
special('necrobinder_giant', 'spirecraft:cave_template', ['minecraft:pale_garden', 'minecraft:old_growth_spruce_taiga', 'minecraft:old_growth_pine_taiga'],
  50, 17, { templates: necrobinderTemplates, mode: 'open_ground', sink: 11, step: 'top_layer_modification' });


/** The jungle tribe (issue #37b, user 2026-11-25): a village of the Silent's hunter kin in the jungle - huts of jungle
 * wood, planks, leaves and hay raised on log stilts above the ground, each with its own use (the chief's hut, the
 * shaman's, the food store, two family huts), round a bonfire with log seats; a totem pole, a meat-drying rack over a
 * smoking fire, paths of packed earth. Placed after the trees so the clearing cuts them out. */
loot('jungle_tribe', [
  { rolls: [4, 7], items: [['bamboo', 10, 2, 8], ['cocoa_beans', 8, 2, 6], ['melon_seeds', 5, 1, 4], ['arrow', 8, 4, 12], ['leather', 6, 1, 4], ['rabbit_hide', 6, 1, 4], ['feather', 6, 2, 6], ['gold_nugget', 6, 2, 6], ['emerald', 3, 1, 2], ['spider_eye', 5, 1, 3], ['string', 6, 2, 5]] },
  { rolls: 1, items: [['empty', 60], ['spirecraft:throwing_knife', 10, 4, 10], ['spirecraft:poison_flask', 8, 1, 3], ['spirecraft:poisoned_dagger', 4], ['spirecraft:snakebite', 3]] },
]);
loot('jungle_tribe_food', [
  { rolls: [3, 6], items: [['cooked_porkchop', 6, 1, 4], ['cooked_chicken', 6, 1, 4], ['cooked_rabbit', 5, 1, 3], ['melon_slice', 8, 2, 8], ['cocoa_beans', 6, 1, 5], ['sweet_berries', 6, 2, 8], ['baked_potato', 5, 1, 4], ['bread', 4, 1, 3], ['wheat', 5, 2, 6]] },
]);
function jungleTribe(seed) {
  // v2 (user 2026-11-25): leaf roofs hanging down in places; open huts with fence rails; huts joined by a raised walkway.
  // v3 (user, round 3: "build each hut against a tree, its roof the tree's own leaves - big enough to cover the whole
  // roof; smaller, round huts; the decks can bend, they are too regular now; the layout is too regular; the village cuts
  // away the lower half of jungle trees and leaves their tops floating - fix it"): six small round huts (radius 2.5-3.5),
  // each at the foot of its own jungle tree (trunks of jungle wood) whose canopy spreads over the hut as its roof; the
  // huts set round the yard at uneven angles and distances, joined by curving decks; one stair down into the yard.
  // The village's natural trees are taken out whole (crown and all) before it is placed - SpireStructures.TemplatePiece -
  // so nothing is left floating. Its own wood is jungle wood / stripped logs and its leaves are persistent, so that pass
  // never touches it.
  const r = rng(seed), n = 45, c = 22, H = 17, s = new Struct(n, H, n), R = 20.5, F = 3;
  const LEAF = 'jungle_leaves[persistent=true]', TRUNK = 'jungle_wood[axis=y]', POST = 'stripped_jungle_log[axis=y]';
  const GROUND = ['grass_block[snowy=false]', 'grass_block[snowy=false]', 'grass_block[snowy=false]', 'coarse_dirt', 'podzol[snowy=false]', 'rooted_dirt'];
  for (let x = 0; x < n; x++) for (let z = 0; z < n; z++) {
    const d = Math.hypot(x - c, z - c);
    if (d > R || (d > R - 1.5 && r.chance(0.5))) continue;
    s.set(x, 0, z, r.pick(GROUND));
    for (let y = 1; y < H; y++) s.set(x, y, z, 'air');
  }
  const deck = new Set(), key = (x, z) => x + ',' + z;
  const plank = (x, z) => { if (s.get(x, F, z) === TRUNK) return; s.set(x, F, z, r.chance(0.85) ? 'jungle_planks' : 'stripped_jungle_log[axis=x]'); deck.add(key(x, z)); };
  // ---- the huts: uneven angles and distances round the yard
  const KINDS = ['chief', 'shaman', 'food', 'family', 'family', 'store'];
  const huts = KINDS.map((kind, i) => {
    const ang = i / KINDS.length * Math.PI * 2 + (r() - 0.5) * 0.6 - Math.PI / 2, dist = 11.5 + r() * 3.5;
    const rad = kind === 'chief' ? 3.5 : kind === 'store' ? 2.3 : 2.5 + r() * 0.6;
    return { kind, x: c + Math.cos(ang) * dist, z: c + Math.sin(ang) * dist, rad, ang };
  });
  // v4 (user, round 4: "no stairs - vines are enough; no ladders; the rails on the decks sometimes stand in the middle
  // of the way; the walkways between the huts can be unlit campfires; a platform and wood appear above the leaves for no
  // reason - remove them"): the trunks end inside their crowns (no wood above the leaves, no branches, no lookout
  // platform); the decks are bands round a curve - their middle a walk of unlit campfires (log bundles), their edges
  // planks with the rails, so a rail never stands in the way; up from the ground on vines hung from the deck edges.
  for (const h of huts) {
    // the tree: on the hut's outer side, the trunk touching the floor's rim, ending inside its crown
    const ox = Math.cos(h.ang), oz = Math.sin(h.ang);
    h.tx = Math.round(h.x + ox * (h.rad + 0.6)); h.tz = Math.round(h.z + oz * (h.rad + 0.6));
    const big = h.kind === 'chief', trunkTop = F + 5;
    const trunk = big ? [[0, 0], [1, 0], [0, 1], [1, 1]] : [[0, 0]];
    for (const [dx, dz] of trunk) { for (let y = 1; y <= trunkTop; y++) s.set(h.tx + dx, y, h.tz + dz, TRUNK); s.set(h.tx + dx, 0, h.tz + dz, 'rooted_dirt'); }
    // its canopy: a broad dome over the hut (centred between trunk and hut), the underside flat at F+4 - the roof -
    // and always closed over the trunk's top
    const cx = h.x * 0.7 + h.tx * 0.3, cz = h.z * 0.7 + h.tz * 0.3, CR = h.rad + 2.8 + r() * 0.6;
    for (let x = Math.floor(cx - CR - 2); x <= Math.ceil(cx + CR + 2); x++) for (let z = Math.floor(cz - CR - 2); z <= Math.ceil(cz + CR + 2); z++) {
      const d = Math.hypot(x - cx, z - cz) / (CR * (1 + (r() - 0.5) * 0.12));
      if (d > 1) continue;
      const bottom = F + 4 + (d > 0.8 && r.chance(0.5) ? -1 : 0), height = Math.max(2, Math.round((1 - d * d) * 3.2 + 1));
      for (let y = bottom; y <= bottom + height; y++) if (s.get(x, y, z) !== TRUNK) s.set(x, y, z, LEAF);
      if (d > 0.85 && r.chance(0.25)) for (let y = bottom - 1; y >= bottom - r.int(1, 3); y--) if (s.get(x, y, z) === 'air') s.set(x, y, z, 'vine[north=true]');
    }
    for (const [dx, dz] of trunk) for (let y = trunkTop + 1; y <= trunkTop + 2; y++) s.set(h.tx + dx, y, h.tz + dz, LEAF);
    // the floor: a disc of planks on stilts, posts holding the canopy up
    for (let x = Math.floor(h.x - h.rad); x <= Math.ceil(h.x + h.rad); x++) for (let z = Math.floor(h.z - h.rad); z <= Math.ceil(h.z + h.rad); z++) {
      if (Math.hypot(x - h.x, z - h.z) > h.rad + 0.3) continue;
      plank(x, z);
    }
    for (let k = 0; k < 4; k++) {
      const a2 = h.ang + Math.PI / 2 + k * Math.PI / 2 + 0.4, x = Math.round(h.x + Math.cos(a2) * (h.rad - 0.3)), z = Math.round(h.z + Math.sin(a2) * (h.rad - 0.3));
      if (Math.hypot(x - h.tx, z - h.tz) < 1.5) continue;
      for (let y = 1; y < F; y++) s.set(x, y, z, POST);
      if (k % 2 === 0) for (let y = F + 1; y < F + 4; y++) s.set(x, y, z, POST);
    }
    { const x = Math.round(h.x), z = Math.round(h.z); for (let y = 1; y < F; y++) s.set(x, y, z, POST); }
  }
  // ---- the decks: from each hut to the next a curve bowed outwards or inwards; a band 3 wide round it on stilts
  const curve = [];   // every sampled point of every deck's curve
  for (let i = 0; i < huts.length; i++) {
    if (i === 2 && r.chance(0.5)) continue;                       // the ring is not quite closed
    const h1 = huts[i], h2 = huts[(i + 1) % huts.length];
    const mx = (h1.x + h2.x) / 2, mz = (h1.z + h2.z) / 2, bow = (r() < 0.5 ? -1 : 1) * (2 + r() * 2.5);
    const len = Math.hypot(h2.x - h1.x, h2.z - h1.z), px = -(h2.z - h1.z) / len, pz = (h2.x - h1.x) / len;
    const kx = mx + px * bow, kz = mz + pz * bow;
    for (let t = 0; t <= 1.0001; t += 0.02) {
      const x = (1 - t) ** 2 * h1.x + 2 * (1 - t) * t * kx + t * t * h2.x, z = (1 - t) ** 2 * h1.z + 2 * (1 - t) * t * kz + t * t * h2.z;
      const inHut = huts.some(h => Math.hypot(x - h.x, z - h.z) < h.rad - 0.2);
      if (!inHut) curve.push([x, z]);
    }
  }
  const toCurve = (x, z) => curve.reduce((m, [px, pz]) => Math.min(m, Math.hypot(x - px, z - pz)), 99);
  const inHutDisc = (x, z) => huts.some(h => Math.hypot(x - h.x, z - h.z) <= h.rad + 0.3);
  const walk = new Set();
  for (let x = 1; x < n - 1; x++) for (let z = 1; z < n - 1; z++) {
    if (inHutDisc(x, z) || s.get(x, F, z) === TRUNK) continue;
    const d = toCurve(x, z);
    if (d > 1.45) continue;
    plank(x, z);
    if (d <= 0.72) walk.add(key(x, z));
  }
  curve.forEach(([x, z], k) => { if (k % 11 === 5) { const X = Math.round(x), Z = Math.round(z); if (s.get(X, F, Z) !== TRUNK) for (let y = 1; y < F; y++) s.set(X, y, Z, POST); } });
  // ---- the way up: vines hung from the deck's edge in three places - nearest the yard and by two of the huts
  const climbs = new Set();
  const hangVine = (tx, tz) => {
    let best = null;
    for (const k of deck) {
      const [x, z] = k.split(',').map(Number);
      for (const [dx, dz, side] of [[1, 0, 'west'], [-1, 0, 'east'], [0, 1, 'north'], [0, -1, 'south']]) {
        const vx = x + dx, vz = z + dz;
        if (deck.has(key(vx, vz)) || s.get(vx, F, vz) === TRUNK || s.get(vx, 1, vz) !== 'air') continue;
        const d = Math.hypot(vx - tx, vz - tz);
        if (!best || d < best.d) best = { x, z, vx, vz, side, d };
      }
    }
    if (!best) return;
    for (let y = 1; y <= F; y++) s.set(best.vx, y, best.vz, 'vine[' + best.side + '=true]');   // hanging on the deck's edge plank
    climbs.add(key(best.x, best.z));
  };
  hangVine(c, c);
  for (const i of [1, 4]) { const h = huts[i], dx = c - h.x, dz = c - h.z, l = Math.hypot(dx, dz); hangVine(h.x + dx / l * (h.rad + 1.5), h.z + dz / l * (h.rad + 1.5)); }
  // ---- rails: on the deck's outer edge cells only (never on the walk), and round the huts except where a deck joins
  for (const k of deck) {
    const [x, z] = k.split(',').map(Number);
    if (walk.has(k) || climbs.has(k)) continue;
    const hut = huts.find(h => Math.hypot(x - h.x, z - h.z) <= h.rad + 0.3);
    if (hut && toCurve(x, z) < 1.8) continue;                      // where a deck comes into the hut
    if (!hut && toCurve(x, z) < 0.95) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !deck.has(key(x + dx, z + dz)) && s.get(x + dx, F, z + dz) !== TRUNK) && s.get(x, F + 1, z) === 'air') s.set(x, F + 1, z, 'jungle_fence');
  }
  // the walks between the huts: unlit campfires laid as a path of log bundles
  for (const k of walk) { const [x, z] = k.split(',').map(Number); if (s.get(x, F + 1, z) === 'air') s.set(x, F, z, 'campfire[lit=false,facing=' + r.pick(['north', 'east']) + ',signal_fire=false]'); }
  // ---- what is in each hut
  const at = (h, dx, dz) => [Math.round(h.x + dx), F + 1, Math.round(h.z + dz)];
  const put = (h, dx, dz, st) => { const [x, y, z] = at(h, dx, dz); if (deck.has(key(x, z)) && s.get(x, y, z) === 'air') s.set(x, y, z, st); };
  for (const h of huts) {
    if (h.kind === 'chief') {
      { const [x, y, z] = at(h, 0, -1); s.chest(x, y, z, 'south', 'jungle_tribe'); }
      put(h, 1, 1, 'green_bed[facing=north,part=head]'); put(h, 1, 2, 'green_bed[facing=north,part=foot]');
      put(h, -1, -1, 'skeleton_skull[rotation=0]'); put(h, -2, 0, 'potted_fern'); put(h, -1, 1, 'green_carpet'); put(h, 0, 1, 'green_carpet');
    } else if (h.kind === 'shaman') {
      put(h, 0, 0, 'brewing_stand'); put(h, 1, 0, 'water_cauldron[level=2]'); put(h, -1, 1, 'potted_red_mushroom'); put(h, -1, -1, 'candle[candles=3,lit=false]');
      { const [x, y, z] = at(h, 0, 1); if (s.get(x, y, z) === 'air') s.barrel(x, y, z, 'up', 'jungle_tribe'); }
    } else if (h.kind === 'food') {
      for (const [dx, dz] of [[0, 0], [1, 0]]) { const [x, y, z] = at(h, dx, dz); if (s.get(x, y, z) === 'air') s.barrel(x, y, z, 'up', 'jungle_tribe_food'); }
      put(h, -1, 0, 'smoker[facing=south,lit=false]'); put(h, 0, 1, 'hay_block[axis=y]'); put(h, -1, 1, 'melon'); put(h, 1, -1, 'composter[level=3]');
    } else if (h.kind === 'family') {
      put(h, 0, -1, 'brown_bed[facing=north,part=head]'); put(h, 0, 0, 'brown_bed[facing=north,part=foot]'); put(h, 1, 0, 'crafting_table'); put(h, -1, 0, 'barrel[facing=up]');
    } else {   // the hunters' store: bows and arrows, hides
      { const [x, y, z] = at(h, 0, 0); if (s.get(x, y, z) === 'air') s.barrel(x, y, z, 'up', 'jungle_tribe'); }
      put(h, 1, 0, 'fletching_table'); put(h, -1, 0, 'barrel[facing=up]'); put(h, 0, 1, 'hay_block[axis=y]');
    }
  }
  // ---- the yard: the bonfire and log seats, the totem pole, the meat rack over a smoking fire, paths of packed earth
  s.set(c, 0, c, 'stone').set(c, 1, c, 'campfire[lit=true,facing=south]');
  for (const [dx, dz, ax] of [[-3, 0, 'z'], [3, 0, 'z'], [0, -3, 'x'], [-2, 2, 'x'], [2, 2, 'x']]) s.set(c + dx, 1, c + dz, 'stripped_jungle_log[axis=' + ax + ']');
  for (let k = 0; k < 40; k++) { const x = c + r.int(-5, 5), z = c + r.int(-5, 5); if (s.get(x, 1, z) === 'air') s.set(x, 0, z, r.chance(0.7) ? 'dirt_path' : 'packed_mud'); }
  const TX = c + 4, TZ = c - 3;
  ['stripped_jungle_log[axis=y]', 'carved_pumpkin[facing=south]', 'jungle_wood[axis=y]', 'stripped_jungle_log[axis=y]', 'jack_o_lantern[facing=south]', 'jungle_wood[axis=y]', 'chiseled_tuff', 'stripped_jungle_log[axis=y]']
    .forEach((st, i) => s.set(TX, 1 + i, TZ, st));
  s.set(TX, 9, TZ, 'skeleton_skull[rotation=0]').set(TX - 1, 7, TZ, 'white_wool').set(TX + 1, 7, TZ, 'white_wool').set(TX - 1, 6, TZ, 'jungle_fence').set(TX + 1, 6, TZ, 'jungle_fence');
  const MX = c - 6, MZ = c + 3;
  for (const dx of [0, 4]) for (let y = 1; y <= 3; y++) s.set(MX + dx, y, MZ, 'jungle_fence');
  for (let x = MX; x <= MX + 4; x++) s.set(x, 4, MZ, 'jungle_slab[type=bottom]');
  for (const dx of [1, 3]) s.set(MX + dx, 3, MZ, 'iron_chain[axis=y]').set(MX + dx, 2, MZ, 'hay_block[axis=y]');
  s.set(MX + 2, 1, MZ, 'campfire[lit=true,facing=south]').set(MX + 2, 0, MZ, 'packed_mud');
  // bamboo and melons between the huts
  for (let i = 0; i < 24; i++) {
    const a2 = r() * Math.PI * 2, d = 7 + r() * 11, x = Math.round(c + Math.cos(a2) * d), z = Math.round(c + Math.sin(a2) * d);
    if (s.get(x, 1, z) !== 'air' || s.get(x, F, z) !== 'air' || !s.get(x, 0, z)) continue;
    if (r.chance(0.7)) { s.set(x, 0, z, 'podzol[snowy=false]'); for (let y = 1; y <= r.int(3, 6) && s.get(x, y, z) === 'air'; y++) s.set(x, y, z, 'bamboo[age=0,leaves=' + (y > 3 ? 'large' : 'none') + ',stage=0]'); }
    else s.set(x, 1, z, 'melon');
  }
  return s.save('jungle_tribe/' + seed);
}
const tribeTemplates = [jungleTribe(1)];
// v2 (user): only where the jungle is dense - not the sparse jungle
special('jungle_tribe', 'spirecraft:cave_template', ['minecraft:jungle', 'minecraft:bamboo_jungle'],
  44, 15, { templates: tribeTemplates, mode: 'open_ground', sink: 1, terrain_adaptation: 'beard_box', step: 'top_layer_modification' });

/** The Ironclad camp's ruin (section 12, user 2026-11-25): a burnt-out war camp, smaller and commoner than the camp -
 * the palisade fallen and charred, tents burnt to their frames with rags of red and black cloth, cold braziers and ash,
 * the forge fallen in, rusty armour and bones lying where the soldiers fell. One half-buried chest. */
loot('ironclad_ruin', [
  { rolls: [3, 6], items: [['spirecraft:brimstone', 12, 2, 6], ['iron_nugget', 10, 2, 8], ['coal', 8, 1, 5], ['bone', 8, 1, 4], ['charcoal', 6, 1, 4], ['gunpowder', 4, 1, 3], ['leather', 3, 1, 2]] },
  { rolls: 1, items: [['empty', 6], ['iron_helmet', 2, 1, 1, { enchant: false }], ['chainmail_chestplate', 2], ['iron_sword', 2]] },
  { rolls: 1, items: [['empty', 85], ['spirecraft:bloodletting_dagger', 5], ['spirecraft:cleaver', 5], ['spirecraft:bludgeon', 5]] },
]);
function ironcladRuin(seed) {
  const r = rng(seed), n = 29, c = 14, R = 12.6, s = new Struct(n, 12, n);
  const FLOOR = ['coarse_dirt', 'gravel', 'packed_mud', 'dirt', 'soul_soil', 'coarse_dirt', 'gravel'];
  for (let x = 0; x < n; x++) for (let z = 0; z < n; z++) {
    const d = Math.hypot(x - c, z - c);
    if (d > R + 1.2) continue;
    s.set(x, 0, z, r.chance(0.15) ? 'gray_concrete_powder' : r.pick(FLOOR));   // ash in patches
    for (let y = 1; y < 12; y++) s.set(x, y, z, 'air');
  }
  // the palisade: charred stumps, most broken low, many gone, a few fallen flat outwards
  s.disc(c, 0, c, R + 1, (x, y, z) => {
    if (r.chance(0.35)) return;
    const h = r.chance(0.6) ? 1 : r.int(2, 3);
    for (let k = 1; k <= h; k++) s.set(x, k, z, r.chance(0.5) ? 'stripped_dark_oak_log[axis=y]' : r.chance(0.5) ? 'dark_oak_log[axis=y]' : 'coal_block');
    if (h === 1 && r.chance(0.2)) { const dx = Math.sign(x - c), dz = Math.sign(z - c); for (let k = 1; k <= 3; k++) s.set(x + dx * k, 1, z + dz * k, `stripped_dark_oak_log[axis=${Math.abs(x - c) > Math.abs(z - c) ? 'x' : 'z'}]`); }
  }, R);
  // tent frames: dark oak fence poles and ridge, rags of red and black wool left on them
  const frame = (x0, z0, len) => {
    for (const dx of [0, 6]) for (const z of [z0, z0 + len - 1]) for (let y = 1; y <= 3; y++) if (!(y === 3 && r.chance(0.3))) s.set(x0 + dx, y, z, 'dark_oak_fence');
    for (let z = z0; z < z0 + len; z++) if (r.chance(0.6)) s.set(x0 + 3, 4, z, 'dark_oak_fence');
    for (let i = 0; i < 6; i++) { const x = x0 + r.pick([0, 1, 5, 6]), z = z0 + r.int(0, len - 1), y = r.int(1, 2); if (s.get(x, y, z) === 'air' || !s.get(x, y, z)) s.set(x, y, z, r.pick(['red_wool', 'red_wool', 'black_wool', 'red_carpet'])); }
    for (let z = z0 + 1; z < z0 + len - 1; z++) for (let x = x0 + 1; x <= x0 + 5; x++) if (r.chance(0.25)) s.set(x, 1, z, r.pick(['red_carpet', 'black_carpet']));
  };
  frame(4, 6, 6); frame(17, 5, 6); frame(18, 16, 6);
  // the forge fallen in: cracked deepslate rubble round a cold hearth
  for (let x = 4; x <= 10; x++) for (let z = 16; z <= 21; z++) {
    const d = Math.hypot(x - 7, z - 18.5);
    if (d > 3.3) continue;
    s.set(x, 0, z, r.chance(0.5) ? 'cracked_deepslate_bricks' : 'blackstone');
    if (d > 1.6 && r.chance(0.5)) s.set(x, 1, z, r.pick(['cracked_deepslate_bricks', 'deepslate_bricks', 'cobbled_deepslate', 'deepslate_brick_slab[type=bottom]']));
    if (d > 2.3 && r.chance(0.3)) s.set(x, 2, z, 'cracked_deepslate_bricks');
  }
  s.set(7, 0, 18, 'magma_block').set(7, 1, 18, 'campfire[lit=false,facing=south]').set(8, 1, 19, 'chipped_anvil[facing=north]');
  // cold braziers and burnt-out fires
  for (const [x, z] of [[c - 2, n - 3], [c + 2, n - 3], [c, c]]) s.set(x, 1, z, 'campfire[lit=false,facing=south]');
  // where they fell: rusty armour (items lying flat in invisible frames), bones and skulls, a dropped shield
  const BYTE = v => ({ t: 1, v });
  const lying = (x, z, item, dmg) => s.entity(x, 1, z, { id: 'minecraft:item_frame', Facing: BYTE(1), Invisible: BYTE(1), Fixed: BYTE(1), ItemRotation: BYTE(r.int(0, 7)), Item: { id: 'minecraft:' + item, count: 1, components: { 'minecraft:damage': dmg } } });
  const fallen = [[11, 12], [16, 22], [9, 24], [21, 11], [13, 8], [23, 21]];
  fallen.forEach(([x, z], i) => {
    lying(x, z, ['iron_chestplate', 'chainmail_helmet', 'iron_helmet', 'chainmail_chestplate', 'iron_boots', 'shield'][i], 180 + i * 20);
    if (r.chance(0.6)) s.set(x + 1, 1, z, r.chance(0.5) ? 'skeleton_skull[rotation=' + r.int(0, 15) + ']' : 'bone_block[axis=x]');
  });
  for (let i = 0; i < 8; i++) { const x = r.int(3, n - 4), z = r.int(3, n - 4); if (Math.hypot(x - c, z - c) < R - 1 && s.get(x, 1, z) === 'air') s.set(x, 1, z, r.pick(['bone_block[axis=x]', 'bone_block[axis=z]', 'iron_bars', 'iron_chain[axis=x]'])); }
  // the flag torn down, its pole broken
  for (let y = 1; y <= 3; y++) s.set(c + 3, y, c - 1, 'dark_oak_fence');
  for (let x = c + 4; x <= c + 8; x++) s.set(x, 1, c - 1, x < c + 6 ? 'dark_oak_fence' : 'red_carpet');
  // the chest, half buried by the commander's tent
  s.set(5, 0, 8, 'coarse_dirt');
  s.chest(5, 1, 9, 'east', 'ironclad_ruin');
  return s.save(`ironclad_ruin/${seed}`);
}
const ironcladRuinTemplates = [ironcladRuin(1)];
special('ironclad_ruin', 'spirecraft:cave_template', ['minecraft:badlands', 'minecraft:eroded_badlands', 'minecraft:wooded_badlands', 'minecraft:savanna', 'minecraft:savanna_plateau', 'minecraft:windswept_savanna'],
  34, 12, { templates: ironcladRuinTemplates, mode: 'open_ground', sink: 1, terrain_adaptation: 'beard_box' });

/** The Regent's crashed starship (section 12, user 2026-11-25): shaped like the Regent's radiant-star head, built of
 * Orange Dough blocks with star lamps and star glass, come down nose first; a throne and star charts inside; the furrow
 * it ploughed behind it. */
loot('regent_starship', [
  { rolls: [4, 7], items: [['spirecraft:galactic_dust', 12, 3, 8], ['gold_ingot', 8, 1, 4], ['lapis_lazuli', 8, 3, 9], ['prismarine_crystals', 6, 2, 6], ['glowstone_dust', 6, 2, 6], ['spirecraft:orange_dough', 5, 1, 2], ['amethyst_shard', 5, 1, 4]] },
  { rolls: 1, items: [['empty', 45], ['spirecraft:sovereign_blade', 8], ['spirecraft:regent_strike', 10], ['spirecraft:photon_cut', 8], ['spirecraft:crescent_spear', 8], ['spirecraft:heirloom_hammer', 6]] },
]);
function regentStarship(seed, variant) {
  // v4 (user 2026-11-25, round 3: "the Regent's ship is a four-pointed star, not eight-pointed; no square of grass under
  // it - just the natural flat ground, plains only; the grass round it burnt away; no meteorites round it; its damage may
  // differ with the ground"): a rounded head of polished dough and dough bricks, a band of star glass round it and a glass
  // crown, four long tapering rays (a star lamp at each tip). Only the ship is in the template - the ground is the land's
  // own (the placement scorches the grass round it, SpireStructures.TemplatePiece). Variants: 0 tilted gently, all four
  // rays whole; 1 nose deeper, one ray snapped off and lying beside it; 2 steeply in, two rays snapped (one lying by it).
  const r = rng(seed), n = 37, c = 18, G = 4, H = 20, s = new Struct(n, H, n);
  const T = [0.22, 0.32, 0.42][variant], ct = Math.cos(T), st = Math.sin(T), CY = G + 5, RC = 5.2;
  const brokenSet = [[], [1], [1, 2]][variant];
  const RAYS = Array.from({ length: 4 }, (_, k) => ({ a: k * Math.PI / 2 + Math.PI / 4, L: k === 3 ? 10 : 11.5, broken: brokenSet.includes(k) }));
  // the shape in the ship's frame (lx, ly, lz), tilted about x so the +z side is low
  const local = (x, y, z) => { const dy = y - CY, dz = z - c; return [x - c, dy * ct - dz * st, dy * st + dz * ct]; };
  const core = (lx, ly, lz, k = 0) => (lx / (RC - k)) ** 2 + (lz / (RC - k)) ** 2 + (ly / ((ly > 0 ? 4.4 : 2.8) - k)) ** 2;
  const ray = (lx, ly, lz) => {
    const rr = Math.hypot(lx, lz), phi = Math.atan2(lz, lx);
    for (const R of RAYS) {
      const along = rr * Math.cos(phi - R.a), across = Math.abs(rr * Math.sin(phi - R.a));
      if (along < RC - 1.5 || along > RC + R.L) continue;
      if (R.broken && along > RC + R.L * 0.35) continue;         // snapped off
      const f = 1 - (along - RC + 1.5) / (R.L + 1.5);
      if (across < 0.6 + 2.6 * f && Math.abs(ly) < 0.6 + 1.5 * f) return { R, along, tip: !R.broken && along > RC + R.L - 1.6, stump: R.broken && along > RC + R.L * 0.35 - 1.2 };
    }
    return null;
  };
  const inside = (x, y, z) => { const [lx, ly, lz] = local(x, y, z); return core(lx, ly, lz) <= 1 || !!ray(lx, ly, lz); };
  for (let x = 0; x < n; x++) for (let y = 0; y < H; y++) for (let z = 0; z < n; z++) {
    if (!inside(x, y, z)) continue;
    const [lx, ly, lz] = local(x, y, z), rv = ray(lx, ly, lz), inCore = core(lx, ly, lz) <= 1;
    if (inCore && core(lx, ly, lz, 1.05) <= 1 && ly > -1.6) { s.set(x, y, z, 'air'); continue; }   // the hollow head
    let st0;
    if (inCore) {
      if (ly > 3.2) st0 = 'spirecraft:star_glass';                                                // the glass crown
      else if (Math.abs(ly - 0.9) < 0.6) st0 = (Math.round(Math.atan2(lz, lx) * 4) % 3 === 0) ? 'spirecraft:star_lamp' : 'spirecraft:star_glass';   // the window band
      else st0 = (ly > 0 ? r.chance(0.65) : r.chance(0.3)) ? 'spirecraft:polished_orange_dough' : 'spirecraft:orange_dough_bricks';
    } else if (rv) st0 = rv.tip ? 'spirecraft:star_lamp' : rv.stump ? r.pick(['spirecraft:orange_dough', 'blackstone', 'spirecraft:orange_dough_bricks']) : ly > 0.4 ? 'spirecraft:polished_orange_dough' : r.chance(0.8) ? 'spirecraft:orange_dough' : 'spirecraft:orange_dough_bricks';
    // where the ship has cracked: a few hull blocks of the damaged variants are left open
    if (variant > 0 && !inCore && rv && !rv.tip && r.chance(0.06 * variant)) continue;
    s.set(x, y, z, st0);
  }
  // a snapped-off ray lying half-sunk in the ground to the west, its broken end scorched
  if (variant > 0) for (let i = 0; i <= 10; i++) for (let w = -2; w <= 2; w++) {
    const x = c - 15 + i, z = c + 6 + Math.round(i * 0.35) + w;
    if (Math.abs(w) > 0.6 + 2.2 * (1 - i / 11) || s.get(x, G, z)) continue;
    s.set(x, G, z, i >= 9 ? 'spirecraft:star_lamp' : i === 0 ? 'blackstone' : w === 0 ? 'spirecraft:polished_orange_dough' : 'spirecraft:orange_dough');
    if (i < 7 && Math.abs(w) <= (i < 3 ? 1 : 0)) s.set(x, G + 1, z, 'spirecraft:orange_dough_bricks');
  }
  // inside the head: a floor, the throne facing the window band, the star charts, the chest, a hanging star lamp
  const floorAt = (x, z) => { for (let y = 2; y < 18; y++) if (s.get(x, y, z) === 'air' && /dough|glass|lamp/.test(String(s.get(x, y - 1, z)))) return y; return null; };
  for (let x = c - 4; x <= c + 4; x++) for (let z = c - 4; z <= c + 4; z++) { const y = floorAt(x, z); if (y && Math.hypot(x - c, z - c) < 4.2) s.set(x, y - 1, z, 'spirecraft:polished_orange_dough'); }
  const ty = floorAt(c, c - 2);
  if (ty) {
    s.set(c, ty, c - 2, 'quartz_stairs[facing=south,half=bottom,shape=straight]').set(c - 1, ty, c - 2, 'gold_block').set(c + 1, ty, c - 2, 'gold_block');
    s.set(c, ty + 1, c - 3, 'gold_block').set(c - 1, ty + 1, c - 2, 'end_rod[facing=up]').set(c + 1, ty + 1, c - 2, 'end_rod[facing=up]');
    s.chest(c + 2, ty, c - 1, 'west', 'regent_starship');
    s.set(c, ty + 3, c, 'spirecraft:star_lamp');
  }
  const BYTE = v => ({ t: 1, v });
  for (const z of [c - 1, c + 1]) { const y = floorAt(c - 3, z); if (y) { s.set(c - 4, y + 1, z, 'spirecraft:orange_dough_bricks'); s.entity(c - 3, y + 1, z, { id: 'minecraft:item_frame', Facing: BYTE(5), Item: { id: 'minecraft:filled_map', count: 1 } }); } }
  // (the pieces of hull thrown round it are laid on the real ground by the placement - SpireStructures.TemplatePiece)
  return s.save(`regent_starship/${seed}`);
}
const starshipTemplates = [regentStarship(1, 0), regentStarship(2, 1), regentStarship(3, 2)];
special('regent_starship', 'spirecraft:cave_template', ['minecraft:plains'],
  56, 20, { templates: starshipTemplates, mode: 'open_ground', sink: 4 });

/** The Necrobinder's forbidden library (section 12, user 2026-11-25): a tower on the End's outer islands, End-like -
 * purpur and end stone bricks, a spire. Inside, gallery over gallery of bookshelves round an open atrium, bone and
 * skulls set in the walls, soul lanterns down the atrium; a stair climbs the east wall; at the top a chamber sealed
 * with chains holds the forbidden book. Shulkers keep it. */
loot('forbidden_library', [
  { rolls: [4, 7], items: [['book', 12, 2, 6], ['paper', 8, 3, 9], ['ink_sac', 6, 1, 4], ['bone', 8, 2, 6], ['soul_soil', 4, 1, 3], ['ender_pearl', 6, 1, 3], ['chorus_fruit', 5, 2, 5], ['experience_bottle', 5, 1, 4], ['amethyst_shard', 4, 1, 3]] },
  { rolls: 1, items: [['empty', 30], ['spirecraft:forbidden_grimoire', 25], ['spirecraft:scythe', 15], ['spirecraft:dirge_flute', 15], ['spirecraft:danse_macabre', 10], ['spirecraft:scourge', 10]] },
  { rolls: 1, items: [['empty', 60], ['enchanted_book', 40, 1, 1, { enchant: true }]] },
]);
loot('forbidden_library_shelf', [
  { rolls: [2, 4], items: [['book', 12, 1, 3], ['paper', 10, 2, 6], ['ink_sac', 5, 1, 2], ['bone', 5, 1, 3], ['candle', 4, 1, 2], ['writable_book', 2]] },
]);
loot('forbidden_library_sanctum', [
  { rolls: 1, items: [['spirecraft:forbidden_grimoire', 1]] },
  { rolls: [2, 4], items: [['book', 10, 1, 3], ['ink_sac', 6, 1, 3], ['ender_pearl', 6, 1, 2], ['experience_bottle', 6, 2, 5], ['amethyst_shard', 4, 1, 3]] },
  { rolls: 1, items: [['empty', 40], ['enchanted_book', 60, 1, 1, { enchant: true }]] },
]);
function forbiddenLibrary(seed) {
  // v2 (user 2026-11-25): End city style, many square rooms per floor in a maze.
  // v3 (user, round 3: "the door is blocked; you could make a bookshelf door - put a few books in and it opens; inside
  // the layout is too uniform - corridors, cloisters, big rooms and small; the forbidden book in the top room; the
  // building isn't pretty - make it like an End city, eaves standing out past the walls, end rods, banners"):
  //   the ground floor: a porch and foyer (south); its north wall holds the bookshelf door - three empty chiseled
  //   bookshelves; with a book in each, the iron door beside them opens (an AND gate hidden in the wall); behind it a
  //   passage into the cloister - an arcade round an open courtyard of end stone and chorus. West of it the great
  //   reading hall, two storeys high; east, three small rooms and a store; north, the chained stacks.
  //   the upper floor: a gallery round the courtyard, scriptorium rooms over the east wing, the stair to the top.
  //   the top: the sanctum, a tower room over the north side, the forbidden grimoire on a bone dais in a barred cage.
  //   outside: purpur and end stone, eaves of upside-down purpur stairs standing a block out past every wall, corner
  //   turrets with overhanging caps and end rods, magenta banners hung under the eaves.
  // v4 (user, round 4: "it generates floating; inside could be more complex; every floor can have eaves; no four posts
  // on the roof - or make one a spiral stair room you can climb"): eaves at every floor; the turrets gone, one spiral
  // stair room in the south-east corner from the ground floor up through the upper floor to a little roof house with an
  // overhanging cap; the great hall split into a nave and aisles by two rows of purpur pillars, a bridge across it at the
  // balcony's level; the foundation under it filled down to the island (SpireStructures.TemplatePiece.foundation).
  const r = rng(seed), O = 2, N = 37, n = N + 2 * O, H = 26, s = new Struct(n, H, n);
  const P = (bx, y, bz, st, nbt) => s.set(bx + O, y, bz + O, st, nbt), G = (bx, y, bz) => s.get(bx + O, y, bz + O);
  const ESB = 'end_stone_bricks', PUR = 'purpur_block', PIL = 'purpur_pillar[axis=y]';
  const F1 = 7, ROOF = 13;   // floors: ground y 1 (rooms y 2-6), upper y 7 (rooms y 8-12), roof y 13
  const BANNER = { id: 'minecraft:banner', patterns: [{ pattern: 'minecraft:stripe_center', color: 'black' }, { pattern: 'minecraft:skull', color: 'white' }, { pattern: 'minecraft:border', color: 'purple' }] };
  // ---- the shell: everything solid end stone brick, purpur on the outer face, then the rooms carved out
  for (let bx = 0; bx < N; bx++) for (let bz = 0; bz < N; bz++) {
    P(bx, 0, bz, ESB);
    const outer = bx === 0 || bz === 0 || bx === N - 1 || bz === N - 1, pillar = outer && (bx % 6 === 0) && (bz % 6 === 0 || bz === N - 1) || outer && (bz % 6 === 0) && (bx % 6 === 0 || bx === N - 1);
    for (let y = 1; y <= ROOF; y++) {
      let st = ESB;
      if (outer) {
        const along = bx === 0 || bx === N - 1 ? bz : bx;
        const win = !pillar && (y === 3 || y === 4 || y === 9 || y === 10) && along % 6 >= 2 && along % 6 <= 4;
        st = pillar ? PIL : win ? 'purple_stained_glass_pane' : (y === 1 || y === F1 || y === ROOF) ? PUR : ESB;
      }
      P(bx, y, bz, st);
    }
  }
  const carve = (x0, z0, x1, z1, y0, y1, floor = true) => {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      for (let y = y0; y <= y1; y++) P(x, y, z, 'air');
      if (floor) P(x, y0 - 1, z, (x + z) % 2 ? PUR : ESB);
    }
  };
  // ground floor
  carve(13, 30, 23, 35, 2, 6);                       // the foyer
  carve(11, 8, 25, 25, 2, 6);                        // the cloister's arcade walk (the courtyard opened below)
  carve(1, 1, 9, 34, 2, 12);                         // the great reading hall, two storeys
  carve(27, 1, 35, 7, 2, 6); carve(27, 9, 35, 15, 2, 6); carve(27, 17, 35, 23, 2, 6); carve(27, 25, 35, 34, 2, 6);   // east rooms
  carve(11, 1, 25, 6, 2, 6);                         // the chained stacks (north)
  carve(16, 26, 16, 28, 2, 3);                       // the passage from the bookshelf door to the arcade
  // upper floor
  carve(11, 8, 25, 25, 8, 12);                       // the gallery round the courtyard
  carve(27, 1, 35, 11, 8, 12); carve(27, 13, 35, 23, 8, 12); carve(27, 25, 35, 34, 8, 12);   // the scriptorium rooms
  carve(11, 1, 25, 6, 8, 12);                        // the north upper room (the stair to the sanctum)
  carve(13, 27, 23, 34, 8, 12);                      // the upper foyer room (the librarian's)
  // the courtyard: open to the sky, an arcade of purpur pillars and arches round it on both floors
  const CX0 = 14, CZ0 = 11, CX1 = 22, CZ1 = 22;
  for (let x = CX0; x <= CX1; x++) for (let z = CZ0; z <= CZ1; z++) {
    const ring = x === CX0 || x === CX1 || z === CZ0 || z === CZ1;
    for (let y = 1; y <= ROOF + 1; y++) P(x, y, z, 'air');
    P(x, 1, z, ring ? PUR : 'end_stone');
    if (!ring) continue;
    const along = x === CX0 || x === CX1 ? z : x, post = along % 2 === 0;
    for (const [y0, y1] of [[2, 6], [8, 12]]) for (let y = y0; y <= y1; y++) {
      if (post) P(x, y, z, y === y1 ? ESB : PIL);
      else if (y === y1) P(x, y, z, ESB);
      else if (y === y1 - 1) P(x, y, z, 'purpur_stairs[facing=' + (x === CX0 ? 'east' : x === CX1 ? 'west' : z === CZ0 ? 'south' : 'north') + ',half=top,shape=straight]');
    }
    P(x, F1, z, PUR);
    if (!post) P(x, 8, z, 'purpur_slab[type=bottom]');       // the gallery's parapet between the posts
  }
  for (let k = 0; k < 9; k++) { const x = r.int(CX0 + 1, CX1 - 1), z = r.int(CZ0 + 1, CZ1 - 1); if (G(x, 2, z) === 'air') P(x, 2, z, 'chorus_flower[age=' + r.int(2, 5) + ']'); }
  P(18, 1, 16, PUR); P(18, 2, 16, 'end_rod[facing=up]'); P(18, 1, 17, PUR);
  // doorways
  const door = (x0, z0, x1, z1, y0, h = 3) => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = y0; y < y0 + h; y++) P(x, y, z, 'air'); };
  door(17, 36, 19, 36, 2, 3);                        // the way in, south
  door(10, 15, 10, 17, 2, 3); door(10, 15, 10, 17, 8, 3);   // the hall from the arcade, and onto its balcony upstairs
  for (const zm of [4, 12, 20, 29]) door(26, zm, 26, zm + 1, 2);
  for (const zm of [6, 18, 29]) door(26, zm, 26, zm + 1, 8);
  door(17, 7, 19, 7, 2); door(17, 7, 19, 7, 8);      // the north rooms from the arcade / gallery
  door(18, 26, 19, 26, 8);                           // the upper foyer room from the gallery
  // the stair up from the arcade (west walk, x 11-12, z 24 down to 19, y 2-6 - into the gallery)
  for (let k = 0; k <= 5; k++) for (const x of [11, 12]) {
    P(x, 2 + k, 24 - k, 'purpur_stairs[facing=north,half=bottom,shape=straight]');
    for (let y = 3 + k; y <= 6 + k && y <= 12; y++) P(x, y, 24 - k, 'air');
    if (k) P(x, 1 + k, 24 - k, PUR);
  }
  // the reading hall's balcony at the upper floor, along its east side, iron-railed
  for (let z = 1; z <= 34; z++) { for (const x of [8, 9]) P(x, F1, z, PUR); P(7, F1 + 1, z, 'iron_bars'); if (z % 5 === 2) P(9, F1 - 1, z, 'purpur_stairs[facing=west,half=top,shape=straight]'); }

  const eaves = (x0, z0, x1, z1, y) => {
    for (let x = x0 - 1; x <= x1 + 1; x++) for (let z = z0 - 1; z <= z1 + 1; z++) {
      const edge = x === x0 - 1 || x === x1 + 1 || z === z0 - 1 || z === z1 + 1;
      if (!edge) continue;
      const f = x === x0 - 1 ? 'east' : x === x1 + 1 ? 'west' : z === z0 - 1 ? 'south' : 'north';
      const corner = (x === x0 - 1 || x === x1 + 1) && (z === z0 - 1 || z === z1 + 1);
      P(x, y, z, corner ? 'purpur_slab[type=top]' : 'purpur_stairs[facing=' + f + ',half=top,shape=straight]');
      P(x, y + 1, z, corner ? 'purpur_block' : 'purpur_slab[type=bottom]');
    }
  };
  // ---- the bookshelf door (in the foyer's north wall, z 29): an iron door at x 16; to its east three empty chiseled
  // bookshelves (x 19, 21, 23). Behind each a comparator reads it; it powers a block with a torch on top; the torches
  // feed one line of dust, which powers the mount of the output torch. While any shelf is empty its torch burns, the
  // line is powered, the output torch is out. A book in all three puts every torch out, the line dies, the output torch
  // lights, and its dust powers the wall block beside the door - the door opens. Saved in its settled state.
  const ZW = 29, XD = 16, SH = [19, 21, 23];
  P(XD, 2, ZW, 'iron_door[facing=north,half=lower,hinge=left,open=false,powered=false]'); P(XD, 3, ZW, 'iron_door[facing=north,half=upper,hinge=left,open=false,powered=false]');
  for (const x of SH) {
    P(x, 2, ZW, 'chiseled_bookshelf[facing=south,slot_0_occupied=false,slot_1_occupied=false,slot_2_occupied=false,slot_3_occupied=false,slot_4_occupied=false,slot_5_occupied=false]');
    P(x, 2, ZW - 1, 'comparator[facing=south,mode=compare,powered=false]');
    P(x, 2, ZW - 2, ESB); P(x, 3, ZW - 2, 'redstone_torch[lit=true]');
  }
  // the line at y 3 along z 26 from x 18 to 23, and over the output torch's mount at (18, 2, 27)
  const near = x => Math.min(...SH.map(t => Math.abs(x - t)));
  for (let x = 18; x <= 23; x++) { P(x, 2, ZW - 3, ESB); P(x, 3, ZW - 3, 'redstone_wire[east=none,north=none,power=' + (15 - near(x)) + ',south=none,west=none]'); }
  P(18, 2, ZW - 2, ESB); P(18, 3, ZW - 2, 'redstone_wire[east=none,north=none,power=15,south=none,west=none]');   // beside the first torch
  P(17, 2, ZW - 2, 'redstone_wall_torch[facing=west,lit=false]'); P(17, 3, ZW - 2, 'air');                     // the output (its mount the block at x 18)
  P(17, 2, ZW - 1, 'redstone_wire[east=none,north=none,power=0,south=none,west=none]');                        // down to the wall block beside the door
  P(17, 1, ZW - 1, ESB); P(17, 1, ZW - 2, ESB);
  for (const x of [19, 21, 23]) { P(x - 1, 2, ZW - 1, ESB); P(x + 1 > 23 ? 23 : x + 1, 2, ZW - 1, x + 1 > 23 ? G(23, 2, ZW - 1) : ESB); }
  // hints: a book in a frame over each shelf, ordinary shelves round the rest of the wall, the porch steps
  const BYTE = v => ({ t: 1, v });
  for (const x of SH) s.entity(x + O, 3, ZW + 1 + O, { id: 'minecraft:item_frame', Facing: BYTE(3), Item: { id: 'minecraft:book', count: 1 } });
  for (let x = 13; x <= 23; x++) if (G(x, 2, ZW + 1) === 'air' && !SH.includes(x) && x !== XD && x !== XD + 1 && x !== 20 && x !== 22) for (let y = 2; y <= 4; y++) P(x, y, ZW + 1, 'bookshelf');
  for (let x = 16; x <= 20; x++) { P(x, 1, N, 'purpur_stairs[facing=north,half=bottom,shape=straight]'); P(x, 0, N, ESB); }
  for (const x of [15, 21]) for (let y = 1; y <= 5; y++) P(x, y, N, y === 5 ? 'end_rod[facing=up]' : PIL);
  // ---- the rooms' furnishings: shelves round the walls (kept clear of every doorway), lanterns, lecterns, barrels
  const lineWalls = (x0, z0, x1, z1, y0, h, pick) => {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      if (!(x === x0 || x === x1 || z === z0 || z === z1)) continue;
      if (G(x, y0, z) !== 'air') continue;
      const nearDoor = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([dx, dz]) => {
        const px = x + dx, pz = z + dz; return (px < x0 || px > x1 || pz < z0 || pz > z1) && G(px, y0, pz) === 'air';
      });
      if (nearDoor) continue;
      for (let y = y0; y < y0 + h; y++) if (G(x, y, z) === 'air') P(x, y, z, pick(x, y, z));
    }
  };
  const shelf = (x, y, z) => r.chance(0.25) ? 'chiseled_bookshelf[facing=north]' : r.chance(0.05) ? 'bone_block[axis=y]' : 'bookshelf';
  lineWalls(1, 1, 9, 34, 2, 6, shelf);                                    // the great hall: shelves up to the balcony
  lineWalls(1, 1, 7, 34, 8, 4, shelf);                                    // and on its upper walls (behind the balcony)
  // round 4: the nave and aisles - two rows of purpur pillars with arches between them, reading tables down the nave
  for (let z = 3; z <= 33; z += 5) for (const x of [3, 7]) {
    for (let y = 2; y <= 11; y++) P(x, y, z, y === 11 ? 'purpur_block' : PIL);
    for (const dz of [-1, 1]) P(x, 11, z + dz, 'purpur_stairs[facing=' + (dz < 0 ? 'south' : 'north') + ',half=top,shape=straight]');
  }
  for (let z = 6; z <= 30; z += 5) { P(5, 2, z, 'purpur_slab[type=top]'); P(5, 2, z + 1, 'purpur_slab[type=top]'); P(5, 3, z, 'candle[candles=2,lit=false]'); P(4, 2, z, 'purpur_stairs[facing=east,half=bottom,shape=straight]'); P(6, 2, z + 1, 'purpur_stairs[facing=west,half=bottom,shape=straight]'); }
  for (let x = 1; x <= 7; x++) { P(x, F1, 17, PUR); P(x, F1, 18, PUR); P(x, F1 + 1, 16, 'iron_bars'); P(x, F1 + 1, 19, 'iron_bars'); }   // the bridge
  for (let z = 4; z <= 32; z += 7) { for (let y = 10; y <= 12; y++) P(5, y, z, 'iron_chain[axis=y]'); P(5, 9, z, 'soul_lantern[hanging=true]'); }
  for (const [x0, z0, x1, z1] of [[27, 1, 35, 7], [27, 9, 35, 15], [27, 17, 35, 23], [27, 25, 35, 34], [11, 1, 25, 6]]) {
    lineWalls(x0, z0, x1, z1, 2, 3, shelf);
    P((x0 + x1) >> 1, 6, (z0 + z1) >> 1, 'iron_chain[axis=y]'); P((x0 + x1) >> 1, 5, (z0 + z1) >> 1, 'soul_lantern[hanging=true]');
  }
  for (const [x0, z0, x1, z1] of [[27, 1, 35, 11], [27, 13, 35, 23], [27, 25, 35, 34], [13, 27, 23, 34]]) {
    lineWalls(x0, z0, x1, z1, 8, 3, shelf);
    P((x0 + x1) >> 1, 12, (z0 + z1) >> 1, 'iron_chain[axis=y]'); P((x0 + x1) >> 1, 11, (z0 + z1) >> 1, 'soul_lantern[hanging=true]');
  }
  // small rooms: a reading desk in each, a skull, a barrel of papers; the store full of barrels
  for (const [x, z] of [[31, 4], [31, 12], [31, 20]]) { P(x, 2, z, 'lectern[facing=west,has_book=false]'); P(x + 1, 2, z, 'skeleton_skull[rotation=4]'); if (r.chance(0.7)) s.barrel(x + O + 2, 2, z + O, 'up', 'forbidden_library_shelf'); }
  for (let z = 27; z <= 32; z += 2) for (const x of [29, 33]) { if (x === 33 && z >= 29) continue; s.barrel(x + O, 2, z + O, 'up', 'forbidden_library_shelf'); P(x, 3, z, 'barrel[facing=up]'); }
  for (const [x, z] of [[31, 5], [31, 18], [29, 28], [18, 30]]) { P(x - 1, 8, z, 'purpur_slab[type=top]'); P(x, 8, z, 'purpur_slab[type=top]'); P(x, 8, z + 1, 'purpur_stairs[facing=north,half=bottom,shape=straight]'); P(x - 1, 9, z, 'candle[candles=3,lit=false]'); }
  // the chained stacks (north): free-standing shelves bound with chains
  for (const x of [14, 18, 22]) for (let z = 2; z <= 4; z++) { P(x, 2, z, 'bookshelf'); P(x, 3, z, 'bookshelf'); P(x, 4, z, 'iron_chain[axis=y]'); }
  // the foyer: benches, soul lanterns on the pillars
  for (const x of [14, 22]) { P(x, 2, 34, 'purpur_stairs[facing=' + (x < 18 ? 'east' : 'west') + ',half=bottom,shape=straight]'); P(x, 2, 32, 'purpur_stairs[facing=' + (x < 18 ? 'east' : 'west') + ',half=bottom,shape=straight]'); }
  P(18, 6, 33, 'iron_chain[axis=y]'); P(18, 5, 33, 'soul_lantern[hanging=true]');

  // ---- the stair to the sanctum (north upper room, x 12-13, z 6 up to 1, y 8-13) and the sanctum over the north side
  for (let k = 0; k <= 5; k++) for (const x of [12, 13]) {
    P(x, 8 + k, 6 - k, 'purpur_stairs[facing=north,half=bottom,shape=straight]');
    for (let y = 9 + k; y <= 12 + k; y++) P(x, y, 6 - k, 'air');
    if (k) P(x, 7 + k, 6 - k, PUR);
  }
  const TX0 = 10, TZ0 = 0, TX1 = 26, TZ1 = 9, TY = ROOF, TH = 6;     // its walls; floor at the roof, ceiling at 19
  for (let x = TX0; x <= TX1; x++) for (let z = TZ0; z <= TZ1; z++) {
    const wall = x === TX0 || x === TX1 || z === TZ0 || z === TZ1, corner = (x === TX0 || x === TX1) && (z === TZ0 || z === TZ1);
    if (!(x >= 12 && x <= 13 && z >= 1 && z <= 6)) P(x, TY, z, (x + z) % 2 ? PUR : ESB);
    for (let y = TY + 1; y < TY + TH; y++) {
      const along = x === TX0 || x === TX1 ? z : x, win = wall && !corner && (y === TY + 2 || y === TY + 3) && along % 4 === 2;
      P(x, y, z, !wall ? (x >= 12 && x <= 13 && z >= 1 && z <= 6 && y <= TY + 1 ? G(x, y, z) : 'air') : corner ? PIL : win ? 'purple_stained_glass_pane' : ESB);
    }
    P(x, TY + TH, z, PUR);
  }
  // the cage of iron bars round the dais, chained at its corners, one bar sprung open; the grimoire's chest on bone
  const DX = 19, DZ = 4;
  for (let x = DX - 3; x <= DX + 3; x++) for (let z = DZ - 2; z <= DZ + 2; z++) {
    if (!(Math.abs(x - DX) === 3 || Math.abs(z - DZ) === 2)) continue;
    if (x === DX && z === DZ + 2) continue;                          // sprung
    for (let y = TY + 1; y <= TY + 3; y++) P(x, y, z, 'iron_bars');
  }
  for (const [x, z] of [[DX - 3, DZ - 2], [DX + 3, DZ - 2], [DX - 3, DZ + 2], [DX + 3, DZ + 2]]) for (let y = TY + 4; y < TY + TH; y++) P(x, y, z, 'iron_chain[axis=y]');
  for (const [dx, dz] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) P(DX + dx, TY + 1, DZ + dz, 'bone_block[axis=y]');
  s.chest(DX + O, TY + 2, DZ + O, 'south', 'forbidden_library_sanctum');
  P(DX - 1, TY + 2, DZ, 'soul_lantern[hanging=false]'); P(DX + 1, TY + 2, DZ, 'skeleton_skull[rotation=8]');
  P(DX, TY + TH - 1, DZ, 'end_rod[facing=down]');
  for (const [x, z] of [[11, 8], [25, 8], [25, 1]]) P(x, TY + 1, z, 'lectern[facing=' + (x < 18 ? 'east' : 'west') + ',has_book=false]');

  // ---- the End city's look: eaves of upside-down purpur stairs a block out past the walls (main roof and sanctum),
  // a purpur parapet, corner turrets with overhanging caps and end rods, banners hung under the eaves
  eaves(0, 0, N - 1, N - 1, ROOF);
  eaves(TX0, TZ0, TX1, TZ1, TY + TH);
  for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
    const inYard = x >= CX0 && x <= CX1 && z >= CZ0 && z <= CZ1, inTower = x >= TX0 && x <= TX1 && z >= TZ0 && z <= TZ1;
    if (inYard || inTower) continue;
    if (x === 0 || z === 0 || x === N - 1 || z === N - 1) P(x, ROOF + 1, z, (x + z) % 3 ? 'purpur_slab[type=bottom]' : ESB);
  }
  for (const [x, z] of [[-1, -1], [N, -1], [-1, N], [N, N]]) P(x, ROOF + 2, z, 'end_rod[facing=up]');
  // eaves at the upper floor's level too (round 4: every floor has its eaves)
  for (let x = -1; x <= N; x++) for (let z = -1; z <= N; z++) {
    const edge = x === -1 || x === N || z === -1 || z === N;
    if (!edge) continue;
    const corner = (x === -1 || x === N) && (z === -1 || z === N);
    const f = x === -1 ? 'east' : x === N ? 'west' : z === -1 ? 'south' : 'north';
    P(x, F1, z, corner ? 'purpur_slab[type=top]' : 'purpur_stairs[facing=' + f + ',half=top,shape=straight]');
  }
  // ---- the spiral stair room (south-east corner, ring round a purpur pillar at (33, 32)) from the ground floor to the roof
  {
    const SX = 33, SZ = 32;
    for (let x = SX - 2; x <= SX + 2; x++) for (let z = SZ - 2; z <= SZ + 2; z++) for (let y = 2; y <= ROOF - 1; y++) P(x, y, z, ESB);
    const ring = [[SX - 1, SZ - 1], [SX, SZ - 1], [SX + 1, SZ - 1], [SX + 1, SZ], [SX + 1, SZ + 1], [SX, SZ + 1], [SX - 1, SZ + 1], [SX - 1, SZ]];
    for (const [x, z] of ring) for (let y = 2; y <= ROOF + 3; y++) P(x, y, z, 'air');
    for (let y = 2; y <= ROOF + 3; y++) P(SX, y, SZ, PIL);
    const dirOf = (a2, b2) => b2[0] > a2[0] ? 'east' : b2[0] < a2[0] ? 'west' : b2[1] > a2[1] ? 'south' : 'north';
    for (let k = 0; k <= 11; k++) {
      const cell = ring[k % 8], next = ring[(k + 1) % 8];
      P(cell[0], 2 + k, cell[1], 'purpur_stairs[facing=' + dirOf(cell, next) + ',half=bottom,shape=straight]');
      if (k) P(cell[0], 1 + k, cell[1], PUR);
    }
    for (let i = 4; i <= 7; i++) P(ring[i][0], ROOF, ring[i][1], PUR);        // the landing at the top
    door(SX - 2, SZ, SX - 2, SZ, 2, 2);                                         // from the store room
    door(SX - 2, SZ + 1, SX - 2, SZ + 1, 8, 2);                                 // from the scriptorium (onto the 7th step)
    for (let y = 2; y <= ROOF - 1; y += 4) { P(SX + 2, y + 1, SZ, 'purple_stained_glass_pane'); }
    P(SX, ROOF + 3, SZ - 1 + 0, 'air');
    // the little roof house over it: walls, a doorway west onto the roof, an overhanging cap, an end rod
    for (let x = SX - 2; x <= SX + 2; x++) for (let z = SZ - 2; z <= SZ + 2; z++) {
      const wall = x === SX - 2 || x === SX + 2 || z === SZ - 2 || z === SZ + 2;
      for (let y = ROOF + 1; y <= ROOF + 3; y++) if (wall) P(x, y, z, (Math.abs(x - SX) === 2 && Math.abs(z - SZ) === 2) ? PIL : ESB);
    }
    door(SX - 2, SZ, SX - 2, SZ, ROOF + 1, 2);
    P(SX + 2, ROOF + 2, SZ, 'purple_stained_glass_pane'); P(SX, ROOF + 2, SZ + 2, 'purple_stained_glass_pane');
    eaves(SX - 2, SZ - 2, SX + 2, SZ + 2, ROOF + 4);
    for (let x = SX - 2; x <= SX + 2; x++) for (let z = SZ - 2; z <= SZ + 2; z++) P(x, ROOF + 4, z, PUR);
    P(SX, ROOF + 6, SZ, 'end_rod[facing=up]');
    P(SX - 3, ROOF + 2, SZ - 1, 'magenta_wall_banner[facing=west]', BANNER);
  }
  for (const [x, z] of [[TX0 - 1, TZ0 - 1], [TX1 + 1, TZ0 - 1], [TX0 - 1, TZ1 + 1], [TX1 + 1, TZ1 + 1]]) P(x, TY + TH + 2, z, 'end_rod[facing=up]');
  P(18, TY + TH + 1, 4, PUR); P(18, TY + TH + 2, 4, 'end_rod[facing=up]');
  // banners on the outer walls under the eaves, between the pillars
  for (let k = 3; k < N - 1; k += 6) {
    P(k, 11, -1, 'magenta_wall_banner[facing=north]', BANNER); P(k, 11, N, 'magenta_wall_banner[facing=south]', BANNER);
    P(-1, 11, k, 'magenta_wall_banner[facing=west]', BANNER); P(N, 11, k, 'magenta_wall_banner[facing=east]', BANNER);
  }
  for (const x of [14, 22]) P(x, TY + 4, -1, 'magenta_wall_banner[facing=north]', BANNER);
  // end rods by the door and over the courtyard's corners
  for (const [x, z] of [[CX0, CZ0], [CX1, CZ0], [CX0, CZ1], [CX1, CZ1]]) P(x, ROOF + 1, z, 'end_rod[facing=up]');
  // the keepers: shulkers in the hall, the east rooms and the sanctum
  // Glory G1: the Scrolls of Biting - spawners in the great hall, the east rooms, the chained stacks and the scriptorium,
  // and three keeping the sanctum
  for (const [x, y, z] of [[5, 2, 10], [5, 2, 25], [33, 2, 13], [16, 2, 5], [31, 8, 8], [31, 8, 20]]) s.spawner(x + O, y, z + O, 'spirecraft:scroll_of_biting');
  for (const [x, z] of [[14, 3], [14, 6], [24, 4]]) s.entity(x + O, TY + 1, z + O, { id: 'spirecraft:scroll_of_biting', PersistenceRequired: { t: 1, v: 1 } });
  for (const [x, y, z] of [[2, 2, 20], [34, 2, 2], [34, 8, 20], [24, TY + 1, 7]]) s.entity(x + O, y, z + O, { id: 'minecraft:shulker', Color: { t: 1, v: 10 }, AttachFace: { t: 1, v: 0 }, PersistenceRequired: { t: 1, v: 1 } });
  return s.save('forbidden_library/' + seed);
}
const libraryTemplates = [forbiddenLibrary(1)];
special('forbidden_library', 'spirecraft:cave_template', ['minecraft:end_highlands', 'minecraft:end_midlands'],
  48, 16, { templates: libraryTemplates, mode: 'open_ground', sink: 1, terrain_adaptation: 'beard_box' });

/** The Defect's automaton factory (section 12, user 2026-11-25): a factory sealed in the deep rock (deepslate),
 * built of automaton alloy and iron: two production lines (rails on a belt of iron trapdoors, pistons, observers,
 * crafters) with half-built shells on them, core crystal power pillars, redstone lamps some still burning, a store
 * room. The punch and cubex constructs it made still come out of two spawners. */
loot('automaton_cart', [
  { rolls: [2, 5], items: [['spirecraft:automaton_alloy_ingot', 12, 1, 4], ['spirecraft:scrap', 12, 2, 6], ['copper_ingot', 10, 1, 5], ['redstone', 8, 2, 6], ['spirecraft:core_crystal', 6, 1, 3], ['spirecraft:cracked_core_crystal_block', 3], ['quartz', 6, 1, 4]] },
]);
loot('automaton_factory', [
  { rolls: [4, 7], items: [['prismarine_crystals', 5, 1, 4], ['glass', 3, 1, 4], ['spirecraft:automaton_alloy_ingot', 14, 2, 6], ['copper_ingot', 10, 2, 8], ['redstone', 10, 3, 9], ['iron_ingot', 8, 1, 5], ['spirecraft:scrap', 8, 2, 6], ['spirecraft:cracked_core_crystal_block', 5, 1, 2], ['spirecraft:core_crystal_block', 3, 1, 1], ['spirecraft:flak_shell', 5, 4, 10]] },
  { rolls: 1, items: [['empty', 50], ['spirecraft:rocket_punch', 10], ['spirecraft:tesla_coil', 10], ['spirecraft:flak_cannon', 9], ['spirecraft:shadow_shield', 8], ['spirecraft:lightning_rod', 8]] },
  { rolls: 1, items: [['empty', 85], ['spirecraft:energy_core', 15]] },
]);
function automatonFactory(seed) {
  // v2 (user 2026-11-25): brass walls with stone, rail-loop belts with chest carts, office / store / control room, levers
  // in the control room for the belts and the lights (wiring in a service layer under the floor), brass lamps.
  // v3 (user, round 3: "the wiring is broken - a redstone signal only goes so far and yours dies; the belts should stand
  // above the floor, and more than one block wide - three wide, slabs either side of the rail; more machines - racks
  // hanging from the ceiling, robot arms, detectors the belt runs through, lathes; the factory taller, more rooms; the
  // pillars not crystal but decorative stone"):
  //   layers: y 0 base, y 1 service layer (the wiring), y 2 floor, hall y 3-12, ceiling y 13, rock above to y 16
  //   the west wing (x 0-15): two storeys of four rooms each behind a corridor with a stair; the hall x 16-50
  //   the wiring: every line has a repeater at most 8 cells after the last, and the whole circuit is simulated here
  //   (wiring() below) so each block is saved in the state it settles to - nothing waits for an update to come right.
  const r = rng(seed), W = 51, D = 37, H = 17, s = new Struct(W, H, D);
  const A = 'spirecraft:automaton_alloy_block', PA = 'spirecraft:polished_automaton_alloy', LAMP = 'spirecraft:automaton_alloy_lamp';
  const HX0 = 16, HX1 = 50, HY = 13, UF = 8;   // hall walls x 16 / 50, ceiling y 13; the wing's upper floor at y 8
  // round 4 (user: not one brass block over a whole wall - alternate them, in upright stripes): the block depends only on
  // the place along the wall, so the stripes run up it
  const STRIPES = [A, PA, 'spirecraft:tarnished_automaton_alloy_block', PA];
  const wallBlock = (x, y, z) => (y === 3 || y === HY - 1 || y === UF) ? 'deepslate_bricks' : STRIPES[(x + z) % 4];
  // ---- the shell
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    s.set(x, 0, z, 'deepslate_tiles').set(x, 1, z, 'deepslate');
    const hall = x > HX0 && x < HX1 && z > 0 && z < D - 1;
    s.set(x, 2, z, hall ? ((x % 6 === 0 || z % 6 === 0) ? 'deepslate_tiles' : 'polished_deepslate') : 'polished_deepslate');
    for (let y = 3; y < H; y++) s.set(x, y, z, y > HY ? 'deepslate_tiles' : wallBlock(x, y, z));
  }
  for (let x = HX0 + 1; x < HX1; x++) for (let z = 1; z < D - 1; z++) for (let y = 3; y < HY; y++) s.set(x, y, z, 'air');
  for (let x = HX0; x <= HX1; x++) for (let z = 0; z < D; z++) s.set(x, HY, z, (x % 6 === 0) ? A : 'deepslate_tiles');   // ceiling, brass beams
  // the wing: rooms x 1-10 between cross walls at z 0, 9, 18, 27, 36; a wall at x 11; the corridor x 12-15
  const ROOMS = [[1, 8], [10, 17], [19, 26], [28, 35]];
  for (const [y0, y1] of [[3, 7], [9, 12]]) {
    for (const [z0, z1] of ROOMS) for (let x = 1; x <= 10; x++) for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) s.set(x, y, z, 'air');
    for (let x = 12; x <= 15; x++) for (let z = 1; z <= 35; z++) for (let y = y0; y <= y1; y++) s.set(x, y, z, 'air');
    for (const [z0, z1] of ROOMS) { const zm = (z0 + z1) >> 1; for (const z of [zm, zm + 1]) for (let y = y0; y <= y0 + 1; y++) s.set(11, y, z, 'air'); }   // room doors
    for (let x = 1; x <= 15; x++) for (let z = 1; z <= 35; z++) if (s.get(x, y0, z) === 'air') s.set(x, y0 - 1, z, y0 === 3 ? 'polished_deepslate' : (x + z) % 2 ? 'spruce_planks' : 'dark_oak_planks');
  }
  // the stair in the corridor (x 14-15, z 30-34, y 3 up to 7), its hole in the upper floor
  for (let k = 0; k <= 4; k++) for (const x of [14, 15]) {
    s.set(x, 3 + k, 30 + k, 'deepslate_brick_stairs[facing=south,half=bottom,shape=straight]');
    if (k) s.set(x, 2 + k, 30 + k, 'deepslate_bricks');
    for (let y = 4 + k; y <= 7 + k && y <= 12; y++) s.set(x, y, 30 + k, 'air');
  }
  for (let z = 30; z <= 34; z++) s.set(13, UF + 1, z, 'iron_bars');   // a rail round the stair hole upstairs
  // into the hall: two wide doors from the lower corridor, one from the upper corridor onto the gallery
  for (const z of [7, 8, 28, 29]) for (let y = 3; y <= 5; y++) s.set(HX0, y, z, 'air');
  for (const z of [17, 18]) for (let y = 9; y <= 10; y++) s.set(HX0, y, z, 'air');
  // the gallery: a walkway along the hall's west wall at the upper floor's level, iron-railed, on stone brackets
  for (let z = 1; z <= 35; z++) {
    for (const x of [17, 18]) s.set(x, UF, z, x === 18 ? 'polished_deepslate_slab[type=top]' : 'polished_deepslate');
    s.set(19, UF + 1, z, 'iron_bars');
    if (z % 6 === 3) s.set(17, UF - 1, z, 'deepslate_brick_stairs[facing=east,half=top,shape=straight]');
  }
  // round 4 (user: the lanterns hang too low, in the way): hung right under the ceilings
  for (let z = 4; z < 35; z += 6) { s.set(13, 7, z, 'lantern[hanging=true]'); s.set(13, 12, z, 'lantern[hanging=true]'); }

  // ---- the belts: two raised loops (rail centre lines x 21 / 31 and x 36 / 46, z 6 to 30): a bed of polished
  // deepslate and alloy at y 3, three wide; the rail on top at y 4 between slabs
  const LOOPS = [[21, 31], [36, 46]], Z0 = 6, Z1 = 30, ROWS = [10, 18, 26];
  const onLoop = (x, z, l0, l1) => ((x === l0 || x === l1) && z >= Z0 && z <= Z1) || ((z === Z0 || z === Z1) && x >= l0 && x <= l1);
  for (const [l0, l1] of LOOPS) {
    for (let x = l0 - 1; x <= l1 + 1; x++) for (let z = Z0 - 1; z <= Z1 + 1; z++) {
      let near = false, on = onLoop(x, z, l0, l1);
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (onLoop(x + dx, z + dz, l0, l1)) near = true;
      if (!near) continue;
      s.set(x, 3, z, (x + z) % 5 ? 'polished_deepslate' : PA);
      if (!on) s.set(x, 4, z, 'polished_deepslate_slab[type=bottom]');
    }
    for (let z = Z0; z <= Z1; z++) for (const x of [l0, l1]) {
      const corner = z === Z0 || z === Z1, powered = ROWS.some(t => Math.abs(z - t) <= 2);
      s.set(x, 4, z, corner ? 'rail[shape=' + (z === Z0 ? 'south' : 'north') + '_' + (x === l0 ? 'east' : 'west') + ']'
        : powered ? 'powered_rail[powered=true,shape=north_south]' : 'rail[shape=north_south]');
    }
    for (let x = l0 + 1; x < l1; x++) for (const z of [Z0, Z1]) s.set(x, 4, z, 'rail[shape=east_west]');
  }
  // ---- the wiring
  const wires = new Map(), reps = new Map(), torches = new Map(), levers = [];   // "x,z" -> data (all at y 1 unless said)
  const K = (x, z) => x + ',' + z;
  const DIRS = { 'x+': 'west', 'x-': 'east', 'z+': 'north', 'z-': 'south' };    // a repeater's facing = its input side
  const path = (...corners) => { const out = []; for (let i = 0; i + 1 < corners.length; i++) { const [ax, az] = corners[i], [bx, bz] = corners[i + 1], k = Math.max(Math.abs(bx - ax), Math.abs(bz - az)); for (let t = i ? 1 : 0; t <= k; t++) out.push([ax + Math.sign(bx - ax) * t, az + Math.sign(bz - az) * t]); } return out; };
  /** dust along pts; a repeater on a straight cell at most 8 after the last (never on or beside a junction) */
  const wire = (pts, junctions = new Set()) => {
    let run = 0;
    pts.forEach(([x, z], i) => {
      const prev = pts[i - 1], next = pts[i + 1], straight = prev && next && (prev[0] === next[0] || prev[1] === next[1]);
      const nearJ = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => junctions.has(K(x + dx, z + dz)));
      run++;
      if (run >= 6 && straight && !nearJ) {
        const d = next[0] > x ? 'x+' : next[0] < x ? 'x-' : next[1] > z ? 'z+' : 'z-';
        reps.set(K(x, z), { x, z, input: DIRS[d], from: [x - (next[0] - x), z - (next[1] - z)], to: next });
        wires.delete(K(x, z)); run = 0;
      } else if (!reps.has(K(x, z))) wires.set(K(x, z), { x, z, p: 0 });
    });
  };
  /** a switched block: a torch on it (y 2, in the floor) or hung on a mount beside it; a branch from the trunk powers the
   * mount, which turns the torch off. kind 'stand': torch at (x, 2, z) on the mount (x, 1, z), the branch cell bx, bz;
   * kind 'wall': wall torch at (x, 1, z) facing f, its mount behind it, the branch behind the mount. */
  const targets = [];
  const standTarget = (x, z, bx, bz) => { targets.push({ kind: 'stand', x, z, mount: [x, z], branch: [bx, bz] }); wires.set(K(bx, bz), { x: bx, z: bz, p: 0 }); };
  const wallTarget = (x, z, f) => {
    const dz = f === 'south' ? -1 : f === 'north' ? 1 : 0, dx = f === 'east' ? -1 : f === 'west' ? 1 : 0;
    targets.push({ kind: 'wall', x, z, f, mount: [x + dx, z + dz], branch: [x + 2 * dx, z + 2 * dz] });
    wires.set(K(x + 2 * dx, z + 2 * dz), { x: x + 2 * dx, z: z + 2 * dz, p: 0 });
  };
  // the belts: a standing torch under the bed beneath each powered stretch (it powers the bed block, the bed the rail)
  const RAIL_X = [21, 31, 36, 46];
  for (const x of RAIL_X) for (const z of ROWS) standTarget(x, z, x, z - 1);
  // trunk rows at z = row - 2 from x 17 to 46, fed up the column x 16 from the belts' inverter
  const beltJ = new Set(ROWS.map(z => K(16, z - 2)));
  for (const z of ROWS) for (const x of RAIL_X) beltJ.add(K(x, z - 2));
  // the hall lights: brass lamps set in the floor along the north and south walls, wall torches under them
  const LAMP_X = [20, 24, 28, 33, 38, 42, 46];
  for (const x of LAMP_X) { wallTarget(x, 3, 'south'); wallTarget(x, 33, 'north'); }
  const lightJ = new Set(LAMP_X.flatMap(x => [K(x, 0), K(x, 36)]));
  // the control room (ground floor, z 19-26): two levers on the floor - belts (on) and lights (on) - each over a stub
  // of dust that powers a mount; the torch on the mount is the inverter that feeds the trunk
  levers.push({ x: 3, z: 21, on: true }, { x: 8, z: 21, on: true });
  // belts: lever (3, 21) -> dust (3, 21) (3, 22) -> mount (3, 23) -> torch (3, 24) facing south -> trunk from (3, 25)
  wires.set(K(3, 21), { x: 3, z: 21, p: 0 }); wires.set(K(3, 22), { x: 3, z: 22, p: 0 });
  torches.set(K(3, 24), { x: 3, z: 24, f: 'south', mount: [3, 23], inverter: true });
  wire(path([3, 25], [3, 28], [16, 28], [16, 8]), beltJ);
  for (const z of ROWS) wire(path([17, z - 2], [46, z - 2]), beltJ);
  // lights: lever (8, 21) -> dust (8, 21) (8, 20) -> mount (8, 19) -> torch (8, 18) facing north -> trunk from (8, 17)
  wires.set(K(8, 21), { x: 8, z: 21, p: 0 }); wires.set(K(8, 20), { x: 8, z: 20, p: 0 });
  torches.set(K(8, 18), { x: 8, z: 18, f: 'north', mount: [8, 19], inverter: true });
  wire(path([8, 17], [8, 0], [46, 0]), lightJ);
  wire(path([7, 0], [0, 0], [0, 36], [46, 36]), lightJ);
  for (const t of targets) if (t.kind === 'wall') torches.set(K(t.x, t.z), { x: t.x, z: t.z, f: t.f, mount: t.mount });
  // ---- settle the circuit: torches lit unless their mount is powered; dust carries power -1 a cell; repeaters relay
  const settle = () => {
    for (let it = 0; it < 6; it++) {
      for (const w of wires.values()) w.p = 0;
      for (const rp of reps.values()) rp.on = false;
      const q = [];
      const feed = (x, z, p) => { const w = wires.get(K(x, z)); if (w && w.p < p) { w.p = p; q.push(w); } };
      for (const l of levers) if (l.on) feed(l.x, l.z, 15);                       // the lever's floor block powers the dust under it
      for (const t of torches.values()) if (t.lit !== false) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!(t.x + dx === t.mount[0] && t.z + dz === t.mount[1])) feed(t.x + dx, t.z + dz, 15);
      for (const t of targets) if (t.kind === 'stand' && t.lit !== false) { /* a standing torch at y 2 feeds nothing at y 1 */ }
      for (let guard = 0; q.length && guard < 100000; guard++) {
        const w = q.shift();
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const x = w.x + dx, z = w.z + dz, rp = reps.get(K(x, z));
          if (rp && rp.from[0] === w.x && rp.from[1] === w.z && w.p > 0 && !rp.on) { rp.on = true; feed(rp.to[0], rp.to[1], 15); }
          feed(x, z, w.p - 1);
        }
      }
      // mounts: powered by a dust cell beside them that ends there (only the branch / stub cells touch a mount)
      const mountPowered = m => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => { const w = wires.get(K(m[0] + dx, m[1] + dz)); return w && w.p > 0; });
      for (const t of torches.values()) t.lit = !mountPowered(t.mount);
      for (const t of targets) t.lit = !mountPowered(t.mount);
    }
  };
  // check every line: with each inverter forced off (its lever thrown), every target's branch must be powered
  for (const inv of [...torches.values()].filter(t => t.inverter)) {
    const saved = levers.map(l => l.on);
    levers.forEach(l => { if (l.x === inv.x) l.on = false; });
    settle();
    const dead = targets.filter(t => !(wires.get(K(...t.branch)).p > 0));
    const mine = inv.x === 3 ? dead.filter(t => t.kind === 'stand') : dead.filter(t => t.kind === 'wall');
    if (mine.length) throw new Error('factory wiring: no power at ' + mine.map(t => t.branch.join(',')).join(' '));
    levers.forEach((l, i) => { l.on = saved[i]; });
  }
  settle();   // the state it is found in
  for (const w of wires.values()) s.set(w.x, 1, w.z, 'redstone_wire[east=none,north=none,power=' + w.p + ',south=none,west=none]');
  for (const rp of reps.values()) s.set(rp.x, 1, rp.z, 'repeater[delay=1,facing=' + rp.input + ',locked=false,powered=' + rp.on + ']');
  for (const t of torches.values()) { s.set(t.mount[0], 1, t.mount[1], 'deepslate'); s.set(t.x, 1, t.z, 'redstone_wall_torch[facing=' + t.f + ',lit=' + t.lit + ']'); }
  for (const t of targets) if (t.kind === 'stand') {
    s.set(t.x, 1, t.z, 'deepslate').set(t.x, 2, t.z, 'redstone_torch[lit=' + t.lit + ']');
    for (let dz = -2; dz <= 2; dz++) { const st = s.get(t.x, 4, t.z + dz); if (st && st.startsWith('powered_rail')) s.set(t.x, 4, t.z + dz, 'powered_rail[powered=' + t.lit + ',shape=north_south]'); }
  }
  for (const x of LAMP_X) for (const z of [3, 33]) s.set(x, 2, z, LAMP + '[lit=' + torches.get(K(x, z)).lit + ']');
  for (const l of levers) s.set(l.x, 3, l.z, 'lever[face=floor,facing=north,powered=' + l.on + ']');

  // ---- the hall's furnishings
  // stone pillars between the loops and along the walls: deepslate tiles, a chiseled base and capital, a brass band
  const pillar = (x, z) => { for (let y = 3; y < HY; y++) s.set(x, y, z, y === 3 || y === HY - 1 ? 'chiseled_deepslate' : y === 7 ? PA : y % 2 ? 'polished_deepslate' : 'deepslate_tiles'); };
  for (const z of [4, 12, 20, 28, 33]) pillar(34, z === 33 ? 32 : z);
  for (const z of [6, 12, 24, 30]) for (const x of [HX1 - 1]) pillar(x, z);
  // detector gantries: two stone posts either side of the belt, a brass beam over it, an observer looking down; the rail
  // under it a detector rail, so a passing cart trips it
  const gantry = (x, z) => {
    for (const dx of [-2, 2]) for (let y = 3; y <= 6; y++) s.set(x + dx, y, z, y === 3 ? 'polished_deepslate' : 'polished_deepslate_wall');
    for (let dx = -2; dx <= 2; dx++) s.set(x + dx, 7, z, dx ? PA : 'observer[facing=down,powered=false]');
    s.set(x, 6, z, 'iron_bars');
    s.set(x, 4, z, 'detector_rail[powered=false,shape=north_south]');
  };
  for (const [x, z] of [[21, 14], [31, 22], [36, 22], [46, 14]]) gantry(x, z);
  // robot arms beside the belts: a piston base, a turning joint, an elbow, the arm reaching over the rail, a tool
  const arm = (x, z, side) => {
    s.set(x, 3, z, 'piston[facing=up,extended=false]').set(x, 4, z, 'polished_blackstone_wall').set(x, 5, z, PA);
    s.set(x - side, 5, z, 'lightning_rod[facing=' + (side > 0 ? 'west' : 'east') + ',powered=false]');
    s.set(x - 2 * side, 5, z, 'grindstone[face=ceiling,facing=north]');
  };
  for (const [x, z, side] of [[23, 8, 1], [29, 16, 1], [23, 24, 1], [38, 12, 1], [44, 20, 1], [38, 28, 1]]) arm(x - (side > 0 ? 0 : 0), z, x < 34 ? (x < 26 ? 1 : -1) : (x < 41 ? 1 : -1));
  // lathes inside the loops: a bench of stone slabs with a grindstone chuck, a stonecutter, a vice (anvil), a crafter
  for (const [l0, l1] of LOOPS) {
    const mx = (l0 + l1) >> 1;
    s.set(mx - 1, 3, 12, 'grindstone[face=floor,facing=east]').set(mx, 3, 12, 'smooth_stone_slab[type=top]').set(mx + 1, 3, 12, 'stonecutter[facing=east]');
    s.set(mx - 1, 3, 20, 'crafter[crafting=false,orientation=north_up,triggered=false]').set(mx, 3, 20, 'crafter[crafting=false,orientation=north_up,triggered=false]').set(mx + 1, 3, 20, 'smithing_table');
    s.set(mx, 3, 27, 'chipped_anvil[facing=north]').set(mx + 1, 3, 27, 'blast_furnace[facing=north,lit=false]');
  }
  // racks hanging from the ceiling over the belts: chains down to a brass beam hung with parts
  const rack = (x0, x1, z) => {
    for (const x of [x0, x1]) for (let y = 10; y <= 12; y++) s.set(x, y, z, 'iron_chain[axis=y]');
    for (let x = x0; x <= x1; x++) {
      s.set(x, 9, z, 'spirecraft:polished_automaton_alloy');
      if (x > x0 && x < x1 && (x - x0) % 2 === 1) { s.set(x, 8, z, 'iron_chain[axis=y]').set(x, 7, z, r.pick(['lantern[hanging=true]', 'spirecraft:automaton_alloy_block', 'copper_bulb[lit=false,powered=false]', 'heavy_core[waterlogged=false]'])); }
    }
  };
  rack(19, 23, 18); rack(29, 33, 10); rack(34, 38, 26); rack(44, 48, 18);
  // the overhead crane: a brass gantry beam across the hall under the ceiling, a hook on a chain
  for (let x = 17; x <= 49; x++) s.set(x, 12, 15, x % 8 === 1 ? 'spirecraft:automaton_alloy_block' : 'spirecraft:polished_automaton_alloy');
  for (let y = 8; y <= 11; y++) s.set(40, y, 15, 'iron_chain[axis=y]');
  s.set(40, 7, 15, 'lightning_rod[facing=down,powered=false]');
  // the constructs' spawners inside the loops, scrap heaps
  s.spawner(26, 3, 16, 'spirecraft:punch_construct');
  s.spawner(41, 3, 16, 'spirecraft:cubex_construct');
  for (const [x, z] of [[25, 9], [42, 24], [27, 24], [40, 9]]) s.set(x, 3, z, 'spirecraft:junk_block');
  // ---- the carts, already moving on the loops: chest carts with parts, a hopper cart, a plain one
  const DBL = v => ({ t: 6, v }), BYTE = v => ({ t: 1, v });
  const cart = (id, x, z, vx, vz, loot) => s.entity(x, 4, z, Object.assign({ id: 'minecraft:' + id, Motion: [DBL(vx), DBL(0), DBL(vz)] }, loot ? { LootTable: 'spirecraft:chests/automaton_cart' } : {}));
  cart('chest_minecart', 21, 11, 0, 0.4, true); cart('hopper_minecart', 31, 19, 0, -0.4, false); cart('chest_minecart', 26, 30, -0.4, 0, true);
  cart('chest_minecart', 36, 19, 0, -0.4, true); cart('minecart', 46, 11, 0, 0.4, false); cart('chest_minecart', 41, 6, 0.4, 0, true);

  // ---- the rooms. Ground floor: office (z 1-8), store (10-17), control room (19-26), workshop (28-35)
  const hang = (x, y, z) => s.set(x, y, z, 'lantern[hanging=true]');
  for (const [z0] of ROOMS) { hang(5, 7, z0 + 4); hang(5, 12, z0 + 4); }
  // office: a desk, a chair, a lectern, cabinets, shelves
  s.set(3, 3, 3, PA).set(4, 3, 3, PA).set(3, 3, 4, 'spruce_stairs[facing=north,half=bottom,shape=straight]');
  s.set(7, 3, 2, 'lectern[facing=south,has_book=false]').set(10, 3, 1, 'barrel[facing=up]').set(10, 4, 1, 'barrel[facing=up]');
  for (let x = 1; x <= 4; x++) s.set(x, 4, 1, 'bookshelf').set(x, 3, 1, x % 2 ? 'bookshelf' : 'barrel[facing=south]');
  // store: shelves of barrels, crates of scrap, the main chest
  s.chest(1, 3, 14, 'east', 'automaton_factory');
  for (const z of [10, 11, 12, 16, 17]) { s.set(1, 3, z, 'barrel[facing=up]'); if (r.chance(0.6)) s.set(1, 4, z, 'barrel[facing=up]'); }
  for (const [x, z] of [[6, 11], [7, 11], [6, 12], [8, 16]]) s.set(x, 3, z, 'spirecraft:junk_block');
  s.set(9, 3, 16, 'spirecraft:core_crystal_block');
  // control room: the panel along its north wall - brass, buttons, item frames telling which lever does what
  for (let x = 1; x <= 10; x++) for (let y = 3; y <= 5; y++) s.set(x, y, 19, y === 3 ? 'polished_deepslate' : PA);
  for (const x of [2, 5, 7, 10]) s.set(x, 4, 20, 'polished_blackstone_button[face=wall,facing=south,powered=false]');
  s.set(5, 3, 20, 'target');
  s.entity(3, 4, 20, { id: 'minecraft:item_frame', Facing: BYTE(3), Item: { id: 'minecraft:minecart', count: 1 } });
  s.entity(8, 4, 20, { id: 'minecraft:item_frame', Facing: BYTE(3), Item: { id: 'spirecraft:automaton_alloy_lamp', count: 1 } });
  s.set(4, 3, 25, 'spruce_stairs[facing=north,half=bottom,shape=straight]').set(9, 3, 25, 'barrel[facing=up]');
  // workshop: a half-built construct on a bench, tools, a parts barrel
  for (let x = 3; x <= 7; x++) s.set(x, 3, 31, 'smooth_stone_slab[type=top]');
  s.set(4, 4, 31, 'spirecraft:automaton_alloy_block').set(5, 4, 31, 'copper_block').set(5, 5, 31, 'spirecraft:tarnished_automaton_alloy_block').set(6, 4, 31, 'spirecraft:derelict_automaton_alloy_block');
  s.set(1, 3, 28, 'anvil[facing=east]').set(1, 3, 30, 'grindstone[face=floor,facing=east]').set(1, 3, 32, 'smithing_table').set(10, 3, 35, 'crafter[crafting=false,orientation=north_up,triggered=false]');
  s.barrel(10, 3, 28, 'up', 'automaton_cart');
  // Upper floor: drafting room (z 1-8), foreman's quarters (10-17), battery room (19-26), archive (28-35)
  s.set(3, 9, 3, 'cartography_table').set(4, 9, 3, 'cartography_table').set(7, 9, 3, 'lectern[facing=south,has_book=false]');
  for (const x of [2, 5, 8]) s.entity(x, 10, 1, { id: 'minecraft:item_frame', Facing: BYTE(3), Item: { id: 'minecraft:filled_map', count: 1 } });
  s.set(2, 9, 12, 'gray_bed[facing=north,part=head]').set(2, 9, 13, 'gray_bed[facing=north,part=foot]');
  s.chest(1, 9, 16, 'east', 'automaton_factory');
  s.set(6, 9, 10, 'barrel[facing=up]').set(9, 9, 16, 'spruce_stairs[facing=west,half=bottom,shape=straight]').set(8, 9, 16, 'spruce_slab[type=top]');
  for (const [x, z] of [[2, 20], [5, 20], [8, 20], [2, 25], [5, 25], [8, 25]]) {   // the batteries: crystal cells in iron cages
    s.set(x, 9, z, 'polished_deepslate').set(x, 10, z, r.chance(0.7) ? 'spirecraft:core_crystal_block' : 'spirecraft:cracked_core_crystal_block');
    s.set(x, 11, z, 'iron_chain[axis=y]');
    for (const [dx, dz] of [[1, 0], [-1, 0]]) if (s.get(x + dx, 10, z) === 'air') s.set(x + dx, 10, z, 'iron_bars');
  }
  for (let x = 1; x <= 10; x++) for (const z of [28, 35]) for (let y = 9; y <= 11; y++) s.set(x, y, z, (x + y) % 3 ? 'bookshelf' : 'chiseled_bookshelf[facing=' + (z === 28 ? 'south' : 'north') + ']');
  s.set(5, 9, 31, 'lectern[facing=south,has_book=false]').barrel(9, 9, 31, 'up', 'automaton_cart');
  // ---- round 4 (user: "the rooms are too empty; the office could have glass walls; more empty cabinets or chests in
  // the store room")
  // office: a glass partition makes the manager's office (x 1-5) with a glass door gap; windows onto the corridor;
  // a clerk's desk, filing cabinets along the south wall
  for (let z = 1; z <= 8; z++) for (let y = 3; y <= 6; y++) if (!(z === 6 && y <= 4)) s.set(6, y, z, y === 6 ? PA : 'glass_pane');
  for (const z of [2, 7]) for (const y of [4, 5]) s.set(11, y, z, 'glass_pane');
  s.set(8, 3, 4, PA).set(9, 3, 4, PA).set(8, 3, 5, 'spruce_stairs[facing=north,half=bottom,shape=straight]').set(9, 4, 4, 'lantern[hanging=false]');
  for (let x = 7; x <= 10; x++) { s.set(x, 3, 8, 'barrel[facing=north]'); s.set(x, 4, 8, x % 2 ? 'barrel[facing=north]' : 'bookshelf'); }
  s.set(2, 3, 7, 'potted_fern').set(4, 3, 7, 'spruce_stairs[facing=east,half=bottom,shape=straight]');
  // store: two racks of empty chests and barrels down the room, two high
  for (const x of [4, 8]) for (let z = 11; z <= 16; z++) {
    if (s.get(x, 3, z) !== 'air') continue;
    s.set(x, 3, z, z % 2 ? 'chest[facing=' + (x < 6 ? 'east' : 'west') + ',type=single,waterlogged=false]' : 'barrel[facing=up]');
    s.set(x, 4, z, z % 2 ? 'barrel[facing=up]' : 'chest[facing=' + (x < 6 ? 'east' : 'west') + ',type=single,waterlogged=false]');
  }
  for (const z of [10, 17]) for (let x = 5; x <= 7; x++) if (s.get(x, 3, z) === 'air') s.set(x, 3, z, r.pick(['barrel[facing=up]', 'spirecraft:junk_block', 'chest[facing=north,type=single,waterlogged=false]']));
  // control room: consoles along the west wall (brass desks with buttons and a daylight sensor), a chair, a map table
  for (let z = 22; z <= 25; z++) { s.set(1, 3, z, PA); s.set(1, 4, z, z % 2 ? 'polished_blackstone_button[face=floor,facing=east,powered=false]' : 'daylight_detector[inverted=false,power=0]'); }
  s.set(2, 3, 23, 'spruce_stairs[facing=west,half=bottom,shape=straight]').set(10, 3, 25, 'cartography_table').set(10, 3, 24, 'lectern[facing=west,has_book=false]');
  // workshop: a hoist over the bench, tool racks (frames), scrap and parts
  for (let y = 5; y <= 7; y++) s.set(5, y, 31, 'iron_chain[axis=y]');
  s.set(8, 3, 33, 'stonecutter[facing=north]').set(9, 3, 33, 'grindstone[face=floor,facing=north]').set(3, 3, 34, 'spirecraft:junk_block').set(2, 3, 34, 'spirecraft:junk_block').set(2, 4, 34, 'spirecraft:junk_block');
  for (const x of [3, 5, 7]) s.entity(x, 4, 35, { id: 'minecraft:item_frame', Facing: BYTE(2), Item: { id: r.pick(['minecraft:iron_pickaxe', 'minecraft:shears', 'minecraft:iron_axe', 'minecraft:copper_ingot']), count: 1 } });
  // the foreman's quarters: a table, a bookshelf, a rug, a wardrobe of barrels
  for (let x = 4; x <= 7; x++) for (let z = 12; z <= 14; z++) s.set(x, 9, z, 'gray_carpet');
  s.set(9, 9, 10, 'bookshelf').set(10, 9, 10, 'bookshelf').set(10, 9, 12, 'barrel[facing=west]').set(10, 10, 12, 'barrel[facing=west]').set(5, 9, 16, 'spruce_slab[type=top]').set(6, 9, 16, 'spruce_slab[type=top]');
  // the drafting room: more boards and tables
  s.set(9, 9, 6, 'cartography_table').set(10, 9, 6, 'cartography_table').set(9, 9, 7, 'spruce_stairs[facing=north,half=bottom,shape=straight]').set(2, 9, 7, 'lectern[facing=east,has_book=false]');
  // a fallen-in way out through the east wall, ending in rubble
  for (let y = 3; y <= 4; y++) s.set(HX1, y, 18, 'air');
  s.set(HX1, 5, 18, 'cobbled_deepslate');
  return s.save('automaton_factory/' + seed);
}
const factoryTemplates = [automatonFactory(1)];
special('automaton_factory', 'spirecraft:cave_template', ['#minecraft:is_overworld'],
  48, 16, { templates: factoryTemplates, mode: 'buried', min_y: -48, max_y: -24, step: 'underground_structures' });

/** The quicksand pit (2026-11-25): carved by worldgen/SpireStructures "sand_pit" - the Insatiable's lair to come. Its
 * suspicious sand gives one thing each when brushed. */
loot('sand_pit', [
  { rolls: 1, items: [['bone', 14, 1, 4], ['rotten_flesh', 8, 1, 3], ['gold_nugget', 10, 2, 6], ['gold_ingot', 3], ['emerald', 3], ['spirecraft:scrap', 4, 1, 2], ['spirecraft:sand_lure', 2], ['arrow', 6, 2, 6], ['iron_ingot', 3]] },
], 'archaeology');
special('sand_pit', 'spirecraft:carved', ['minecraft:desert'], 40, 14, { kind: 'sand_pit', step: 'surface_structures' });

// Glory v2 (docs/design/glory.md, 2026-11-26): the works and the lab, the castles, the smaller overworld sites and the
// Owl Court, the Nether works and prison laboratory, the Aeon Spire in the End
require('./glory_works')({ Struct, rng, loot, special });
require('./glory_castles')({ Struct, rng, loot, special });
require('./glory_sites')({ Struct, rng, loot, special });
require('./glory_nether')({ Struct, rng, loot, special });
require('./glory_end')({ Struct, rng, loot, special });

// The Ancient Tree (issue #15, docs/design/structures.md section 16)
require('./ancient_tree')({ Struct, rng, loot, special });

// template ids used by worldgen/TemplateFeature placements (see BiomeData)
console.log('ok', JSON.stringify(hiveTemplates), pierTemplates);
