// Glory G4 (2026-11-26) - the Aeon Spire in the End. User: "the Aeonglass's building like a big End City too, the
// Aeonglass's room on the top floor". End-city language: purpur blocks and pillars, end stone brick bases, wide eaves
// of purpur stairs at every storey, magenta glass, end rods; towers of stacked storeys joined by bridges; ladders inside.
// The top chamber: the Aeonglass asleep over its pedestal, four hourglass light pillars (columns of end rods) where the
// Wither Sand can be poured out, gated stairs. A library storey with Scroll of Biting spawners on a side tower.
// Stands on an end stone foundation (worldgen fills the gap down to the island). y = 0 is the platform floor.
const K = require('./glory_kit');
const { box, mob } = K;

module.exports = function end({ Struct, rng, loot, special }) {
  const GATE = 'spirecraft:glory_gate[closed=false]';
  loot('aeon_spire', [
    { rolls: [4, 7], items: [['ender_pearl', 10, 1, 3], ['gold_ingot', 8, 2, 5], ['diamond', 4, 1, 2], ['chorus_fruit', 8, 2, 6], ['spirecraft:relic_fragment', 6, 1, 2], ['experience_bottle', 5, 2, 5]] },
    { rolls: 1, items: [['empty', 55], ['enchanted_book', 12, 1, 1, { enchant: true }], ['diamond_sword', 6, 1, 1, { enchant: true }], ['golden_apple', 6]] },
  ]);

  function aeonSpire(seed) {
    const r = rng(seed), W = 57, D = 57, Hh = 96, s = new Struct(W, Hh, D);
    for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) for (let y = 0; y < Hh; y++) s.set(x, y, z, 'air');
    /**
     * One End-city storey: a square room x0..x1 × z0..z1 from y (floor) to y + h, purpur walls with pillars at the
     * corners and magenta windows, a floor of purpur (end stone bricks at the bottom), an eave of stairs all round at
     * the top, the next floor's slab over it.
     */
    const storey = (x0, z0, x1, z1, y, h, o = {}) => {
      for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
        const e = x === x0 || x === x1 || z === z0 || z === z1, corner = (x === x0 || x === x1) && (z === z0 || z === z1);
        s.set(x, y, z, o.floor || 'purpur_block');
        for (let yy = y + 1; yy < y + h; yy++) {
          const along = x === x0 || x === x1 ? z - z0 : x - x0, len = x === x0 || x === x1 ? z1 - z0 : x1 - x0;
          const win = e && !corner && along > 1 && along < len - 1 && along % 3 === 1 && yy > y + 1 && yy < y + h - 1;
          s.set(x, yy, z, corner ? 'purpur_pillar[axis=y]' : e ? (win ? 'magenta_stained_glass' : (yy === y + 1 && o.base ? 'end_stone_bricks' : 'purpur_block')) : 'air');
        }
        s.set(x, y + h, z, e ? 'purpur_block' : (o.open ? 'air' : 'purpur_block'));
      }
      // the eave
      for (let x = x0 - 1; x <= x1 + 1; x++) { s.set(x, y + h, z0 - 1, 'purpur_stairs[facing=south,half=top,shape=straight]'); s.set(x, y + h, z1 + 1, 'purpur_stairs[facing=north,half=top,shape=straight]'); }
      for (let z = z0; z <= z1; z++) { s.set(x0 - 1, y + h, z, 'purpur_stairs[facing=east,half=top,shape=straight]'); s.set(x1 + 1, y + h, z, 'purpur_stairs[facing=west,half=top,shape=straight]'); }
      for (const [x, z] of [[x0 - 1, z0 - 1], [x1 + 1, z0 - 1], [x0 - 1, z1 + 1], [x1 + 1, z1 + 1]]) s.set(x, y + h, z, 'purpur_block');
      for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) s.set(x, y + h + 1, z, 'end_rod[facing=up]');
    };
    const ladder = (x, z, y0, y1, f) => { for (let y = y0; y <= y1; y++) s.set(x, y, z, `ladder[facing=${f},waterlogged=false]`); };
    const hole = (x, z, y) => s.set(x, y, z, 'air');
    // ---- the platform: end stone bricks, a terrace of purpur round the foot
    for (let x = 6; x <= 50; x++) for (let z = 6; z <= 50; z++) if (Math.hypot(x - 28, z - 28) <= 22) s.set(x, 0, z, Math.hypot(x - 28, z - 28) > 20.5 ? 'purpur_block' : ((x + z) % 2 ? 'end_stone_bricks' : 'purpur_block'));
    // ---- the main tower: five storeys stepping in, 21 → 13 across, the chamber on top
    const C = 28;
    const tiers = [[10, 8], [9, 8], [8, 8], [7, 8], [6, 8]];
    let y = 0;
    tiers.forEach(([hw, h], i) => {
      storey(C - hw, C - hw, C + hw, C + hw, y, h, { base: i === 0, floor: i === 0 ? 'end_stone_bricks' : 'purpur_block' });
      // a ladder up through every storey (the last one comes up inside the chamber, see below)
      const lx = i === tiers.length - 1 ? C + 5 : C + hw - 1 - (i % 2) * (2 * hw - 2);
      ladder(lx, C, y + 1, y + h, lx > C ? 'west' : 'east'); hole(lx, C, y + h);
      y += h;
    });
    // the doors at the foot (four sides)
    for (const [ux, uz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) for (let k = -1; k <= 1; k++) for (let yy = 1; yy <= 3; yy++) s.set(C + ux * 10 + uz * k, yy, C + uz * 10 + ux * k, 'air');
    // furnishing the lower storeys: a hall with banners, the library (Scroll spawners), the guard storey
    for (const [x, z] of [[C - 7, C - 7], [C + 7, C - 7], [C - 7, C + 7], [C + 7, C + 7]]) { s.set(x, 1, z, 'purpur_pillar[axis=y]'); s.set(x, 2, z, 'purpur_pillar[axis=y]'); s.set(x, 3, z, 'end_rod[facing=up]'); }
    for (let x = C - 8; x <= C + 8; x++) if (x % 3 !== 0) for (let yy = 9; yy <= 12; yy++) { s.set(x, yy, C - 8, 'bookshelf'); s.set(x, yy, C + 8, 'bookshelf'); }
    s.spawner(C - 4, 9, C, 'spirecraft:scroll_of_biting'); s.spawner(C + 4, 9, C, 'spirecraft:scroll_of_biting');
    s.set(C, 9, C - 5, 'lectern[facing=south,has_book=false,powered=false]');
    s.chest(C - 7, 17, C - 6, 'east', 'aeon_spire');
    for (const [x, z] of [[C - 5, C + 5], [C + 5, C - 5]]) s.set(x, 17, z, 'brewing_stand[has_bottle_0=true,has_bottle_1=true,has_bottle_2=false]');
    mob(s, C + 3, 9, C + 3, 'scroll_of_biting'); mob(s, C - 3, 17, C + 2, 'scroll_of_biting'); mob(s, C + 2, 25, C - 2, 'scroll_of_biting');
    // ---- the chamber (top): 13 across, tall, a glass roof; the pedestal, four light pillars, gated ladder hole
    const TY = y;   // floor of the chamber
    const R = 6, CH = 12;
    for (let x = C - R; x <= C + R; x++) for (let z = C - R; z <= C + R; z++) {
      const e = x === C - R || x === C + R || z === C - R || z === C + R, corner = (x === C - R || x === C + R) && (z === C - R || z === C + R);
      s.set(x, TY, z, (x + z) % 2 ? 'purpur_block' : 'end_stone_bricks');
      for (let yy = TY + 1; yy <= TY + CH; yy++) s.set(x, yy, z, corner ? 'purpur_pillar[axis=y]' : e ? (yy % 4 === 0 ? 'purpur_block' : 'magenta_stained_glass') : 'air');
      s.set(x, TY + CH + 1, z, e ? 'purpur_block' : ((x + z) % 2 ? 'magenta_stained_glass' : 'glass'));
    }
    for (let x = C - R - 1; x <= C + R + 1; x++) for (let z = C - R - 1; z <= C + R + 1; z++) if (x === C - R - 1 || x === C + R + 1 || z === C - R - 1 || z === C + R + 1) s.set(x, TY + CH + 1, z, 'purpur_slab[type=bottom]');
    for (let k = 1; k <= 4; k++) s.disc(C, TY + CH + 1 + k, C, 4.5 - k, (x, yy, z, d) => (d > 3.5 - k ? 'purpur_block' : 'glass'));
    s.set(C, TY + CH + 6, C, 'end_rod[facing=up]');
    // the hourglass light pillars: end-rod columns in the four corners, on gold bases
    for (const [x, z] of [[C - 4, C - 4], [C + 4, C - 4], [C - 4, C + 4], [C + 4, C + 4]]) { s.set(x, TY + 1, z, 'gold_block'); for (let yy = TY + 2; yy <= TY + 8; yy++) s.set(x, yy, z, 'end_rod[facing=up]'); }
    // the pedestal under the Aeonglass
    s.disc(C, TY + 1, C, 2.2, 'purpur_slab[type=bottom]'); s.set(C, TY + 1, C, 'chiseled_quartz_block');
    mob(s, C, TY + 2, C, 'aeonglass');
    // the way up into it: the last ladder comes up through the floor at (C + 5, C); a glory gate over the hole shuts it
    // while the fight lasts
    s.set(C + 5, TY, C, 'ladder[facing=west,waterlogged=false]');
    s.set(C + 5, TY + 1, C, GATE); s.set(C + 5, TY + 2, C, GATE);
    // ---- the side towers and bridges: two smaller End-city towers joined to the main one at the third storey
    for (const [tx, tz, ux, uz] of [[8, 28, 1, 0], [48, 28, -1, 0]]) {
      let ty = 0;
      for (const [hw, h] of [[4, 8], [4, 8], [3, 7]]) { storey(tx - hw, tz - hw, tx + hw, tz + hw, ty, h, { base: ty === 0, floor: ty === 0 ? 'end_stone_bricks' : 'purpur_block' }); ty += h; }
      for (let yy = 1; yy <= 3; yy++) s.set(tx, yy, tz + 4, 'air');
      ladder(tx, tz - 3, 1, 16, 'south'); hole(tx, tz - 3, 8); hole(tx, tz - 3, 16);
      // the bridge at y 16 to the main tower's third storey
      const bx0 = Math.min(tx + ux * 4, C - ux * 8), bx1 = Math.max(tx + ux * 4, C - ux * 8);
      for (let x = bx0; x <= bx1; x++) for (let z = tz - 1; z <= tz + 1; z++) { s.set(x, 16, z, z === tz ? 'purpur_block' : 'purpur_slab[type=bottom]'); s.set(x, 17, z, z === tz ? 'air' : (x % 3 === 0 ? 'end_rod[facing=up]' : 'air')); }
      for (let yy = 17; yy <= 19; yy++) { s.set(tx + ux * 4, yy, tz, 'air'); s.set(C - ux * 8, yy, tz, 'air'); }
      s.chest(tx - ux * 2, 17, tz + 2, ux > 0 ? 'east' : 'west', 'aeon_spire');
    }
    // banners on the main tower
    for (const [x, z, f] of [[C - 3, C + 11, 'south'], [C + 3, C + 11, 'south'], [C - 3, C - 11, 'north'], [C + 3, C - 11, 'north']]) s.set(x, 6, z, `magenta_wall_banner[facing=${f}]`);
    return s.save('aeon_spire/1');
  }

  const spires = [aeonSpire(1)];
  special('aeon_spire', 'spirecraft:cave_template', ['minecraft:end_highlands', 'minecraft:end_midlands'],
    40, 14, { templates: spires, mode: 'open_ground', sink: 1, step: 'surface_structures' });
  return { spires };
};
