// The Ancient Tree (issue #15, round 1, 2026-11-27; docs/design/structures.md section 16).
// User: a rare world landmark after the tower on the STS2 main menu ("the tower a tree turned into") - tall and slender,
// slightly tapering, a few thick stems twisted round each other all the way up, orange-lit windows scattered over it,
// its top lost in an orange glow. About 110 above the ground, trunk about 21 across at the foot and 13 under the crown,
// a small orange-gold glowing crown; gnarlwood and vanilla blocks only, no new blocks. Inside: exploring and a dungeon -
// a hollow room on every storey, solid heartwood between them, a spiral passage of steps along the inner wall through
// the heartwood; overgrowth monsters on guard, an elite before the top, an empty Ancients' hall in the burl under the
// crown (the Ancients themselves come in a later round).
// Layer G is the top soil (worldgen/SpireStructures "open_ground", sink = G + 1); h = y - G is the height above ground.
// The door is on +z (open_ground turns +z to the lowest side).
const { facingTo } = require('./lib');
const K = require('./glory_kit');
const { mob } = K;

module.exports = function ancientTree({ Struct, rng, loot, special }) {
  const GW = 'spirecraft:gnarlwood';
  const BARK = `${GW}_wood[axis=y]`, GROOVE = 'dark_oak_wood[axis=y]', HEART = 'spirecraft:stripped_gnarlwood_wood[axis=y]';
  const PLANKS = `${GW}_planks`, SLAB = `${GW}_slab[type=bottom]`, LEAVES = `${GW}_leaves[persistent=true]`;
  const H = (x, y, z) => { let v = (x * 374761393 + y * 668265263 + z * 2246822519) ^ 0x5bd1e995; v = Math.imul(v ^ (v >>> 13), 1274126177); return ((v ^ (v >>> 16)) >>> 0) / 4294967296; };
  /** Smooth noise (0..1) over cells `size` blocks wide: for things that should come in patches. */
  const patch = (x, y, z, size) => {
    const fx = x / size, fy = y / size, fz = z / size, x0 = Math.floor(fx), y0 = Math.floor(fy), z0 = Math.floor(fz);
    const sm = v => v * v * (3 - 2 * v), tx = sm(fx - x0), ty = sm(fy - y0), tz = sm(fz - z0), L = (a, b, w) => a + (b - a) * w;
    const c = (i, j, k) => H(x0 + i + 911, y0 + j + 77, z0 + k + 353);
    return L(L(L(c(0, 0, 0), c(1, 0, 0), tx), L(c(0, 1, 0), c(1, 1, 0), tx), ty), L(L(c(0, 0, 1), c(1, 0, 1), tx), L(c(0, 1, 1), c(1, 1, 1), tx), ty), tz);
  };
  const isWood = st => !!st && /gnarlwood_wood|dark_oak_wood|moss_block/.test(st);
  const isAir = st => st === 'air';
  const TAU = Math.PI * 2, mod = (a, m) => ((a % m) + m) % m;

  loot('ancient_tree_supply', [
    { rolls: [3, 5], items: [['bread', 10, 1, 4], ['apple', 8, 1, 3], ['glow_berries', 8, 2, 6], ['torch', 10, 2, 8], ['arrow', 8, 3, 9], ['stick', 6, 2, 6], ['spirecraft:gnarlwood_planks', 6, 2, 8], ['string', 5, 1, 4], ['bone_meal', 5, 1, 4], ['moss_block', 4, 1, 3]] },
  ]);
  loot('ancient_tree', [
    { rolls: [3, 6], items: [['iron_ingot', 10, 1, 4], ['gold_ingot', 8, 1, 3], ['emerald', 6, 1, 3], ['amethyst_shard', 6, 1, 4], ['resin_clump', 8, 2, 6], ['honeycomb', 5, 1, 3], ['bone', 6, 1, 4], ['spirecraft:relic_fragment', 4]] },
    { rolls: 1, items: [['empty', 50], ['potion', 10, 1, 1, { potion: 'spirecraft:strength' }], ['potion', 10, 1, 1, { potion: 'spirecraft:dexterity' }], ['potion', 10, 1, 1, { potion: 'spirecraft:block' }], ['golden_apple', 5]] },
    { rolls: 1, items: [['empty', 85], ['#loot:spirecraft:chests/relic_common', 12], ['#loot:spirecraft:chests/relic_uncommon', 3]] },
  ]);
  loot('ancient_tree_cache', [
    { rolls: [3, 5], items: [['emerald', 8, 2, 5], ['gold_ingot', 8, 2, 4], ['resin_block', 6, 1, 3], ['amethyst_shard', 6, 2, 5], ['golden_apple', 4], ['experience_bottle', 5, 2, 4], ['spirecraft:relic_fragment', 5]] },
    { rolls: 1, items: [['empty', 55], ['enchanted_book', 30, 1, 1, { enchant: true }], ['#loot:spirecraft:chests/relic_common', 15]] },
  ]);
  loot('ancient_tree_treasury', [
    { rolls: [4, 6], items: [['gold_ingot', 10, 2, 5], ['emerald', 8, 2, 5], ['diamond', 4, 1, 2], ['golden_apple', 4], ['experience_bottle', 6, 2, 5], ['spirecraft:relic_fragment', 6, 1, 2], ['resin_block', 5, 2, 4]] },
    { rolls: 1, items: [['empty', 30], ['enchanted_book', 30, 1, 1, { enchant: true }], ['diamond_axe', 10, 1, 1, { enchant: true }], ['golden_apple', 10]] },
    { rolls: 1, items: [['empty', 55], ['#loot:spirecraft:chests/relic_common', 25], ['#loot:spirecraft:chests/relic_uncommon', 15], ['#loot:spirecraft:chests/relic_rare', 5]] },
  ]);
  loot('ancient_tree_crown', [
    { rolls: [5, 7], items: [['gold_ingot', 10, 3, 6], ['emerald', 8, 3, 6], ['diamond', 6, 1, 3], ['enchanted_golden_apple', 1], ['golden_apple', 5, 1, 2], ['experience_bottle', 8, 3, 6], ['spirecraft:relic_fragment', 8, 1, 3], ['amethyst_shard', 5, 2, 6]] },
    { rolls: 1, items: [['enchanted_book', 30, 1, 1, { enchant: true }], ['diamond_sword', 10, 1, 1, { enchant: true }], ['diamond_chestplate', 8, 1, 1, { enchant: true }], ['empty', 20]] },
    { rolls: 1, items: [['#loot:spirecraft:chests/relic_uncommon', 45], ['#loot:spirecraft:chests/relic_rare', 35], ['#loot:spirecraft:chests/relic_common', 20]] },
  ]);

  function tree(seed) {
    const r = rng(seed);
    const W = 87, D = 87, C = 43, G = 9, Hh = G + 120, s = new Struct(W, Hh, D);
    const N = 5, TWIST = TAU / 80, PHASE = 54 * Math.PI / 180;   // 5 stems, one turn in 80 blocks; a groove at the door (90 degrees)
    const STOREY = 13, ROOMS = 7, HALL = STOREY * ROOMS;          // the hall's floor is at h = 91
    const Y = h => G + h;

    // ---- the trunk's outline
    const taper = h => 6.75 + 3.75 * Math.pow(Math.max(0, 1 - h / 92), 1.1);
    const flare = h => 2.2 * Math.exp(-Math.max(h, 0) / 4.5);
    const burl = h => (h > 80 ? 3.0 * Math.exp(-Math.pow((h - 98) / 6, 2)) : 0);
    const cap = h => (h > 100 ? Math.sqrt(Math.max(0, 1 - Math.pow((h - 100) / 8, 2))) : 1);
    const R0 = h => (taper(h) + flare(h) + burl(h)) * cap(h);
    const amp = h => (h < 86 ? 0.15 : h > 94 ? 0.07 : 0.15 - 0.08 * (h - 86) / 8);
    const stem = (a, h) => Math.abs(Math.cos(N / 2 * (a - TWIST * h - PHASE)));   // 1 on a stem's crest, 0 in a groove
    const rad = (a, h) => R0(h) * (1 - amp(h) + amp(h) * stem(a, h));
    const minRad = h => R0(h) * (1 - amp(h));

    for (let y = 0; y <= Y(108); y++) {
      const h = y - G, R = R0(h);
      if (R < 0.7) continue;
      for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
        const dx = x - C, dz = z - C, d = Math.hypot(dx, dz);
        if (d > R + 0.5) continue;
        const a = Math.atan2(dz, dx), rr = rad(a, h);
        if (d > rr) continue;
        if (d > rr - 1.6) {
          const n = H(x, y, z);
          s.set(x, y, z, h >= 0 && h < 9 && n < 0.3 * (1 - h / 9) ? 'moss_block' : stem(a, h) < 0.3 + (n - 0.5) * 0.12 ? GROOVE : BARK);
        } else s.set(x, y, z, HEART);
      }
    }

    // ---- buttress roots: five big ones under the five stems, three small ones in the grooves (none in the door's)
    const root = (a0, d1, top, wide, curl) => {
      const d0 = 7.5;
      for (let d = d0; d <= d1; d += 0.25) {
        const u = (d - d0) / (d1 - d0), a = a0 + curl * u * u, cx = Math.cos(a) * d, cz = Math.sin(a) * d;
        const w = wide * (1 - 0.62 * u), t = Math.round(top * Math.pow(1 - u, 1.7) - 0.4), bottom = -G + Math.floor(5 * u);
        for (let x = Math.floor(cx - w); x <= Math.ceil(cx + w); x++) for (let z = Math.floor(cz - w); z <= Math.ceil(cz + w); z++) {
          const e = Math.hypot(x - cx, z - cz);
          if (e > w) continue;
          const tt = Math.round(t - (e / w) * (e / w) * 2.2);   // rounded crest
          for (let h = bottom; h <= tt; h++) {
            if (s.get(x + C, Y(h), z + C)) continue;
            const n = H(x + C, Y(h), z + C);
            s.set(x + C, Y(h), z + C, h >= 0 && h === tt && n < 0.35 ? 'moss_block' : BARK);
          }
        }
      }
    };
    for (let j = 0; j < N; j++) root(PHASE + TAU * j / N + (r() - 0.5) * 0.12, 18 + r() * 4, 9 + r() * 3, 2.5, (r() - 0.5) * 0.7);
    for (const j of [1, 2, 3]) root(PHASE + TAU * (j + 0.5) / N + (r() - 0.5) * 0.2, 14 + r() * 3, 4.5 + r() * 1.5, 1.7, (r() - 0.5) * 0.9);

    // ---- the hollows: seven rooms (floor at h = 13k, 7 high) and the hall in the burl
    const RiK = [];
    for (let k = 0; k < ROOMS; k++) {
      let m = 1e9;
      for (let h = k * STOREY; h <= k * STOREY + STOREY; h++) m = Math.min(m, minRad(h));
      RiK.push(m - (k <= 3 ? 2 : 1.6));
    }
    const hallR = h => minRad(h) - 1.8;
    RiK.push(hallR(HALL + 1));
    /** The radius of the hollow (room, passage or hall) that layer y belongs to. */
    const inner = y => { const h = y - G; return h > HALL ? hallR(h) : RiK[Math.min(ROOMS, Math.max(0, Math.floor(h / STOREY)))]; };
    const cells = (rmax, fn) => { const q = Math.ceil(rmax); for (let dx = -q; dx <= q; dx++) for (let dz = -q; dz <= q; dz++) { const d = Math.hypot(dx, dz); if (d <= rmax) fn(dx, dz, d); } };
    const GUARD = new Set([1, 3, 5]);   // the spawner rooms: kept dark
    for (let k = 0; k < ROOMS; k++) {
      const yf = Y(k * STOREY);
      cells(RiK[k], (dx, dz) => {
        const n = H(dx + C, yf, dz + C);
        s.set(dx + C, yf, dz + C, GUARD.has(k) && n < 0.22 ? 'moss_block' : n > 0.9 ? 'spirecraft:stripped_gnarlwood_wood[axis=x]' : PLANKS);
        for (let h = 1; h <= 7; h++) s.set(dx + C, yf + h, dz + C, 'air');
      });
    }
    cells(RiK[ROOMS], (dx, dz) => s.set(dx + C, Y(HALL), dz + C, PLANKS));
    for (let h = HALL + 1; h <= 108; h++) { const R = hallR(h); if (R >= 1) cells(R, (dx, dz) => s.set(dx + C, Y(h), dz + C, 'air')); }

    // ---- the spiral passage: steps of slabs and planks along the wall, half a block up per block, from each floor
    // to the next - open stairs in the room, a tunnel two wide through the heartwood above it
    const DOOR = Math.PI / 2;
    const flights = [];
    let start = DOOR + 0.45;
    for (let k = 0; k < ROOMS; k++) {
      const Rl = Math.min(RiK[k], RiK[k + 1]), wideRoom = Rl >= 5.4, A = 2 * STOREY / (Rl - 1.5), base = Y(k * STOREY) + 1;
      flights.push({ start, A, Rl });
      // a narrow room has one lane of steps along the wall; where two of its cells only touch at a corner the cell
      // between them joins the lane, so the way is never a squeeze past a corner
      const outer = new Set(), bridge = new Set();
      cells(RiK[k], (dx, dz, d) => { if (d > Rl - 1) outer.add(dx + ',' + dz); });
      for (const c of outer) {
        const [dx, dz] = c.split(',').map(Number);
        for (const [ox, oz] of [[1, 1], [1, -1]]) {
          if (!outer.has((dx + ox) + ',' + (dz + oz)) || outer.has((dx + ox) + ',' + dz) || outer.has(dx + ',' + (dz + oz))) continue;
          bridge.add(Math.hypot(dx + ox, dz) < Math.hypot(dx, dz + oz) ? (dx + ox) + ',' + dz : dx + ',' + (dz + oz));
        }
      }
      cells(RiK[k], (dx, dz, d) => {
        if (d <= Rl - 2 && !bridge.has(dx + ',' + dz)) return;
        const t0 = mod(Math.atan2(dz, dx) - start, TAU);
        for (let t = t0; t <= A + 1e-6; t += TAU) {
          const v = base + STOREY * t / A, vq = Math.round(v * 2) / 2;
          if (vq < base + 0.5) continue;
          if (d <= Rl - 1 && !wideRoom && vq < base + 6.5 && !bridge.has(dx + ',' + dz)) continue;   // a narrow room: one lane until the steps enter the ceiling
          const full = Number.isInteger(vq), yb = full ? vq - 1 : Math.floor(vq);
          if (d > inner(yb)) continue;
          s.set(dx + C, yb, dz + C, full ? PLANKS : SLAB);
          for (let yy = yb + 1; yy <= yb + 3; yy++) if (d <= inner(yy)) s.set(dx + C, yy, dz + C, 'air');
        }
      });
      start += A + 2.2 / Math.max(2.5, Math.min(RiK[k + 1], RiK[Math.min(ROOMS, k + 2)]) - 0.5);
    }

    // ---- the door: a hollow between two big roots on +z, 3 wide, arched, and a porch cut clear in front of it
    for (let dz = Math.floor(RiK[0]) - 1; dz <= 14; dz++) for (let dx = -1; dx <= 1; dx++) {
      for (let h = 1; h <= (dx === 0 ? 4 : 3); h++) s.set(dx + C, Y(h), dz + C, 'air');
      if (!s.get(dx + C, Y(0), dz + C)) s.set(dx + C, Y(0), dz + C, BARK);
    }

    // ---- free places in a room
    const floorOk = (k, dx, dz, head = 3) => {
      const yf = Y(k * STOREY), st = s.get(dx + C, yf, dz + C);
      if (!st || isAir(st) || /slab/.test(st)) return false;
      for (let h = 1; h <= head; h++) if (!isAir(s.get(dx + C, yf + h, dz + C))) return false;
      return true;
    };
    /** The free cells along the wall of room k, in order of angle, longest free stretch first. */
    const wallRuns = k => {
      const ring = [];
      cells(RiK[k], (dx, dz, d) => { if (d > RiK[k] - 1) ring.push({ dx, dz, a: mod(Math.atan2(dz, dx), TAU), free: floorOk(k, dx, dz) && !(k === 0 && Math.abs(dx) <= 2 && dz > 0) }); });
      ring.sort((p, q) => p.a - q.a);
      const first = ring.findIndex(c => !c.free), runs = [];
      if (first < 0) return [ring];
      let cur = [];
      for (let i = 1; i <= ring.length; i++) { const c = ring[(first + i) % ring.length]; if (c.free) cur.push(c); else { if (cur.length) runs.push(cur); cur = []; } }
      return runs.sort((p, q) => q.length - p.length);
    };
    const outward = (dx, dz) => { const f = facingTo(dx, dz, 0, 0); return { north: [0, 1], south: [0, -1], east: [-1, 0], west: [1, 0] }[f]; };   // the step away from the centre
    const SPAWN = id => ({ id: 'minecraft:mob_spawner', Delay: 20, SpawnData: { entity: { id: 'spirecraft:' + id },
      custom_spawn_rules: { block_light_limit: { min_inclusive: 0, max_inclusive: 7 }, sky_light_limit: { min_inclusive: 0, max_inclusive: 15 } } } });
    const spawner = (k, dx, dz, id) => s.set(dx + C, Y(k * STOREY) + 1, dz + C, 'spawner', SPAWN(id));
    const chestAt = (k, c, table) => s.chest(c.dx + C, Y(k * STOREY) + 1, c.dz + C, facingTo(c.dx, c.dz, 0, 0), table);
    const ARROWS = n => ({ id: 'minecraft:dispenser', Items: [{ Slot: { t: 1, v: 0 }, id: 'minecraft:arrow', count: n }] });
    /** A stone pressure plate on a wall cell and an arrow dispenser in the wall behind it. */
    const arrowTrap = (k, c) => {
      const yf = Y(k * STOREY), [ox, oz] = outward(c.dx, c.dz), wx = c.dx + ox, wz = c.dz + oz;
      if (!isWood(s.get(wx + C, yf + 1, wz + C)) && s.get(wx + C, yf + 1, wz + C) !== HEART) return false;
      s.set(c.dx + C, yf + 1, c.dz + C, 'stone_pressure_plate');
      s.set(wx + C, yf + 1, wz + C, `dispenser[facing=${facingTo(wx, wz, c.dx, c.dz)}]`, ARROWS(9));
      return true;
    };
    const report = [];

    // room 0, the root hall: safe - a fire, supplies, and under a moss carpet the trapdoor to the root cellar
    {
      const yf = Y(0), runs = wallRuns(0), run = runs[0] || [];
      s.set(C, yf + 1, C, 'campfire[lit=true]');
      for (const f of [0.3, 0.7]) { const c = run[Math.floor(run.length * f)]; if (c) s.barrel(c.dx + C, yf + 1, c.dz + C, 'up', 'ancient_tree_supply'); }
      cells(RiK[0] - 0.5, (dx, dz) => { if (floorOk(0, dx, dz, 1) && H(dx + C, 7, dz + C) < 0.13 && !(dx === 0 && dz === 0)) s.set(dx + C, yf + 1, dz + C, 'moss_carpet'); });
      // the cellar under the back of the hall
      cells(2.6, (dx, dz) => { for (let h = -4; h <= -1; h++) s.set(dx + C, Y(h), dz - 1 + C, 'air'); });
      s.set(C, yf, C - 3, `${GW}_trapdoor[facing=north,half=top,open=false]`);
      s.set(C, yf + 1, C - 3, 'moss_carpet');
      for (let h = -4; h <= -1; h++) s.set(C, Y(h), C - 3, 'ladder[facing=south]');
      s.chest(C, Y(-4), C + 1, 'north', 'ancient_tree_cache');
      s.set(C + 2, Y(-4), C - 1, 'lantern[hanging=false]');
      s.set(C - 2, Y(-4), C - 1, 'decorated_pot');
      report.push(`room 0: wall run ${run.length}`);
    }
    // rooms 1, 3, 5: spawners and a chest
    for (const [k, a, b] of [[1, 'leaf_slime', 'twig_slime'], [3, 'fuzzy_wurm_crawler', 'nibbit'], [5, 'shrinker_beetle', 'shrinker_beetle']]) {
      spawner(k, -1, 0, a);
      spawner(k, 1, 0, b);
      const runs = wallRuns(k), run = runs[0] || [];
      const c = run[Math.floor(run.length / 2)];
      if (c) chestAt(k, c, 'ancient_tree');
      for (const [dx, dz] of [[0, 1], [-1, -1], [1, -1], [0, -2]]) if (floorOk(k, dx, dz, 1) && H(dx + C, k, dz + C) < 0.5) s.set(dx + C, Y(k * STOREY) + 1, dz + C, 'cobweb');
      report.push(`room ${k}: wall run ${run.length}${c ? '' : ' (no chest)'}`);
    }
    // room 2, the traps: a plate and an arrow dispenser where the passage comes up, and a chest between two more
    {
      const k = 2, yf = Y(k * STOREY), f = flights[k];
      const ring = [];
      cells(RiK[k], (dx, dz, d) => { if (d > RiK[k] - 1 && floorOk(k, dx, dz)) ring.push({ dx, dz, t: mod(Math.atan2(dz, dx) - f.start + Math.PI, TAU) - Math.PI }); });
      const landing = ring.filter(c => c.t < -0.05 && c.t > -0.75).sort((p, q) => q.t - p.t)[0];
      let n = 0;
      if (landing && arrowTrap(k, landing)) {
        n++;
        // the lane beside the plate: a barrel in the way, so the way up leads over the plate
        const [ox, oz] = outward(landing.dx, landing.dz), bx = landing.dx - ox, bz = landing.dz - oz;
        if (floorOk(k, bx, bz)) s.barrel(bx + C, yf + 1, bz + C, 'up', 'ancient_tree_supply');
      }
      const run = (wallRuns(k)[0] || []).filter(c => !landing || Math.hypot(c.dx - landing.dx, c.dz - landing.dz) > 2.5);
      const i = Math.floor(run.length / 2), c = run[i];
      if (c) {
        chestAt(k, c, 'ancient_tree');
        for (const j of [i - 1, i + 1]) if (run[j] && Math.hypot(run[j].dx - c.dx, run[j].dz - c.dz) < 1.5 && arrowTrap(k, run[j])) n++;
      }
      report.push(`room 2: ${n} arrow traps, wall run ${run.length}`);
    }
    // room 3 also opens onto a broken bough outside: a look-out with a supply barrel
    {
      const k = 3, yf = Y(k * STOREY), R = RiK[k];
      const ok = ([ux, uz]) => { const q = Math.floor(R); return floorOk(k, ux * q, uz * q) && floorOk(k, ux * (q - 1), uz * (q - 1)) && !/chest|spawner/.test(s.get(ux * q + C, yf + 1, uz * q + C) || ''); };
      const dir = [[-1, 0], [0, -1], [1, 0], [0, 1]].find(ok);
      if (dir) {
        const [ux, uz] = dir, q = Math.floor(R), end = q + 13;
        // the bough: a thick stub, its top the walkway at floor level, broken off at the end
        for (let d = q; d <= end; d += 0.25) {
          const w = 2.6 - 0.7 * (d - q) / (end - q), droop = Math.pow((d - q) / (end - q), 2) * 0.5;
          for (let a = -3; a <= 3; a++) for (let hh = -5; hh <= 0; hh++) {
            if (Math.hypot(a, hh + 1.6 + droop) > w) continue;
            const x = Math.round(ux * d - uz * a) + C, z = Math.round(uz * d + ux * a) + C;
            if (!s.get(x, yf + hh, z)) s.set(x, yf + hh, z, Math.abs(a) <= 1 && hh === 0 ? (H(x, yf, z) < 0.2 ? 'moss_block' : BARK) : BARK);
          }
        }
        // the doorway through the shell
        for (let d = q; d <= q + 5; d++) for (let h = 1; h <= 2; h++) { const x = ux * d + C, z = uz * d + C; if (s.get(x, yf + h, z) && !isAir(s.get(x, yf + h, z))) s.set(x, yf + h, z, 'air'); }
        const face = ux === 1 ? 'east' : ux === -1 ? 'west' : uz === 1 ? 'south' : 'north';
        s.set(ux * (q + 1) + C, yf + 1, uz * (q + 1) + C, `${GW}_door[facing=${face},half=lower,hinge=left,open=false]`);
        s.set(ux * (q + 1) + C, yf + 2, uz * (q + 1) + C, `${GW}_door[facing=${face},half=upper,hinge=left,open=false]`);
        // on the bough: a barrel, a lantern on a post, a tuft of leaves at the broken end
        const at = (d, a) => [Math.round(ux * d - uz * a) + C, Math.round(uz * d + ux * a) + C];
        const topOf = (x, z) => { for (let y = yf; y >= yf - 3; y--) if (s.get(x, y, z)) return y; return null; };
        let [x, z] = at(end - 4, 1), ty = topOf(x, z);
        if (ty != null) s.barrel(x, ty + 1, z, 'up', 'ancient_tree_supply');
        [x, z] = at(end - 7, -1);
        ty = topOf(x, z);
        if (ty != null) { s.set(x, ty + 1, z, `${GW}_fence`); s.set(x, ty + 2, z, 'lantern[hanging=false]'); }
        for (let i = 0; i < 26; i++) {
          const [lx, lz] = at(end + r.int(-1, 2), r.int(-2, 2)), ly = yf + r.int(-1, 2);
          if (!s.get(lx, ly, lz)) s.set(lx, ly, lz, LEAVES);
        }
        report.push(`room 3: bough towards ${face}`);
      } else report.push('room 3: NO BOUGH (no free wall on an axis)');
    }
    // room 4, the treasury: a small stone vault, an iron door, the lever on the back of its roof
    {
      const k = 4, yf = Y(k * STOREY), f = flights[k];
      const arrive = f.start - 0.4;   // where the passage comes up: the door looks that way
      const [ux, uz] = [[1, 0], [0, 1], [-1, 0], [0, -1]][mod(Math.round(arrive / (Math.PI / 2)), 4)];
      const face = ux === 1 ? 'east' : ux === -1 ? 'west' : uz === 1 ? 'south' : 'north', back = { east: 'west', west: 'east', south: 'north', north: 'south' }[face];
      const RS = 'spirecraft:ruin_stone_bricks', RC = 'spirecraft:chiseled_ruin_stone_bricks';
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
        const corner = dx !== 0 && dz !== 0;
        s.set(dx + C, yf, dz + C, RS);
        for (let h = 1; h <= 2; h++) s.set(dx + C, yf + h, dz + C, dx === 0 && dz === 0 ? 'air' : corner && h === 2 ? RC : RS);
        s.set(dx + C, yf + 3, dz + C, RS);
      }
      s.chest(C, yf + 1, C, face, 'ancient_tree_treasury');
      s.set(ux + C, yf + 1, uz + C, `iron_door[facing=${back},half=lower,hinge=left,open=false,powered=false]`);
      s.set(ux + C, yf + 2, uz + C, `iron_door[facing=${back},half=upper,hinge=left,open=false,powered=false]`);
      const wire = ux !== 0 ? 'east=side,west=side,north=none,south=none' : 'north=side,south=side,east=none,west=none';
      for (const m of [-1, 0, 1]) s.set(ux * m + C, yf + 4, uz * m + C, `redstone_wire[${wire},power=0]`);
      s.set(-2 * ux + C, yf + 3, -2 * uz + C, `lever[face=wall,facing=${back},powered=false]`);
      report.push(`room 4: vault door ${face}, R ${RiK[4].toFixed(2)}`);
    }
    // room 6: the Bygone Effigy asleep before the last flight
    {
      const k = 6, yf = Y(k * STOREY);
      for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) s.set(dx + C, yf, dz + C, H(dx + C, yf, dz + C) < 0.5 ? 'mossy_cobblestone' : 'spirecraft:cracked_ruin_stone_bricks');
      mob(s, C, yf + 1, C, 'bygone_effigy');
      const run = wallRuns(k)[0] || [];
      for (const fr of [0.25, 0.75]) { const c = run[Math.floor(run.length * fr)]; if (c) s.set(c.dx + C, yf + 1, c.dz + C, 'candle[candles=3,lit=true]'); }
      report.push(`room 6: wall run ${run.length}`);
    }

    // ---- the crown: seven boughs out of the burl, a ball of leaves on each and over the top
    const boughs = [];
    // round 2 (user 2026-11-27: "the boughs are too short, and make the crown flatter"): long boughs reaching 22-28 out,
    // rising only a little, flat pads of leaves on them - a broad, flat crown about 75 across
    for (let j = 0; j < 9; j++) boughs.push({ a: TAU * j / 9 + 0.3 + (r() - 0.5) * 0.35, end: 22 + r() * 6, rise: 3 + r() * 4 });
    let j2 = 0;
    // round 3 (user 2026-11-27: "flatter leaves, and more of them"): every pad thinner and wider, a third pad on each
    // bough and a skirt of pads beyond its tip, more and bigger pads on the lower boughs
    const blobs = [{ x: 0, h: 108.5, z: 0, rx: 17, ry: 3.4 }];
    for (const b of boughs) {
      const ca = Math.cos(b.a), sa = Math.sin(b.a);
      for (let u = 0; u <= 1; u += 0.01) {
        const d = 5 + u * (b.end - 5), hh = 89.5 + b.rise * Math.pow(u, 1.5), w = 2.7 - 1.5 * u, px = ca * d, pz = sa * d;
        for (let x = Math.floor(px - w); x <= Math.ceil(px + w); x++) for (let z = Math.floor(pz - w); z <= Math.ceil(pz + w); z++)
          for (let h = Math.floor(hh - w); h <= Math.ceil(hh + w); h++) {
            if (Math.hypot(x - px, z - pz, h - hh) > w || s.get(x + C, Y(h), z + C)) continue;
            s.set(x + C, Y(h), z + C, BARK);
          }
      }
      const rx = Math.min(9.5 + r() * 2, C - 1.5 - b.end);
      blobs.push({ x: ca * b.end, h: 89.5 + b.rise + 2, z: sa * b.end, rx, ry: 2.3 + r() * 0.5 });
      blobs.push({ x: ca * (b.end * 0.62), h: 89.5 + b.rise + 5 + r() * 2, z: sa * (b.end * 0.62), rx: 10 + r() * 1.5, ry: 2.4 + r() * 0.5 });
      blobs.push({ x: ca * (b.end * 0.33), h: 89.5 + b.rise + 8.5 + r() * 2, z: sa * (b.end * 0.33), rx: 9.5 + r() * 1.5, ry: 2.4 + r() * 0.5 });
      for (const side of [-0.32, 0.32]) {
        const ka = b.a + side, kd = Math.min(b.end + 2, C - 9);
        blobs.push({ x: Math.cos(ka) * kd, h: 89.5 + b.rise + (side < 0 ? 0 : 3.5), z: Math.sin(ka) * kd, rx: Math.min(7 + r() * 1.5, C - 1.5 - kd), ry: 2 + r() * 0.4 });
      }
      // a fork half-way out, to one side, with a pad of its own
      const fa = b.a + (j2++ % 2 ? 0.55 : -0.55), fx = ca * b.end * 0.5, fz = sa * b.end * 0.5, fh = 89.5 + b.rise * Math.pow(0.5, 1.5), fl = 7 + r() * 3;
      for (let u = 0; u <= 1; u += 0.03) {
        const px = fx + Math.cos(fa) * fl * u, pz = fz + Math.sin(fa) * fl * u, hh = fh + 3 * u, w = 1.6 - 0.7 * u;
        for (let x = Math.floor(px - w); x <= Math.ceil(px + w); x++) for (let z = Math.floor(pz - w); z <= Math.ceil(pz + w); z++)
          for (let h = Math.floor(hh - w); h <= Math.ceil(hh + w); h++)
            if (Math.hypot(x - px, z - pz, h - hh) <= w && !s.get(x + C, Y(h), z + C)) s.set(x + C, Y(h), z + C, BARK);
      }
      blobs.push({ x: fx + Math.cos(fa) * fl, h: fh + 4.5, z: fz + Math.sin(fa) * fl, rx: 7.5 + r() * 1.5, ry: 2.1 + r() * 0.4 });
    }
    // smaller boughs lower down the trunk, out of the solid heartwood between the rooms, a tuft of leaves on each
    for (const [h0, a0] of [[35, 1.9], [48, 3.6], [48, 0.4], [61, 5.2], [61, 2.6], [74, 2.2], [74, 5.3], [86, 4.2], [86, 1.0]]) {
      const a = a0 + (r() - 0.5) * 0.5, ca = Math.cos(a), sa = Math.sin(a), d0 = R0(h0) - 2, len = 13 + r() * 5, rise = 3 + r() * 3;
      for (let u = 0; u <= 1; u += 0.02) {
        const d = d0 + u * len, hh = h0 + rise * Math.pow(u, 1.4), w = 2.0 - 1.0 * u, px = ca * d, pz = sa * d;
        for (let x = Math.floor(px - w); x <= Math.ceil(px + w); x++) for (let z = Math.floor(pz - w); z <= Math.ceil(pz + w); z++)
          for (let h = Math.floor(hh - w); h <= Math.ceil(hh + w); h++)
            if (Math.hypot(x - px, z - pz, h - hh) <= w && !s.get(x + C, Y(h), z + C)) s.set(x + C, Y(h), z + C, BARK);
      }
      blobs.push({ x: ca * (d0 + len), h: h0 + rise + 1.5, z: sa * (d0 + len), rx: 7 + r() * 1.5, ry: 2 + r() * 0.4, low: true });
      blobs.push({ x: ca * (d0 + len * 0.55) - sa * 2.5, h: h0 + rise * 0.45 + 2.5, z: sa * (d0 + len * 0.55) + ca * 2.5, rx: 5 + r() * 1.5, ry: 1.8 + r() * 0.3, low: true });
    }
    for (const b of blobs) {
      for (let x = Math.floor(b.x - b.rx - 1); x <= Math.ceil(b.x + b.rx + 1); x++) for (let z = Math.floor(b.z - b.rx - 1); z <= Math.ceil(b.z + b.rx + 1); z++)
        for (let h = Math.floor(b.h - b.ry - 1); h <= Math.ceil(b.h + b.ry + 1); h++) {
          const X = x + C, Z = z + C, y = Y(h);
          if (!s.inside(X, y, Z) || s.get(X, y, Z)) continue;
          if (!b.low && h <= 95 && Math.hypot(x, z) <= 10) continue;   // open under the crown, round the hall's doors
          const n = H(X, y, Z), e = Math.hypot((x - b.x) / b.rx, (z - b.z) / b.rx, (h - b.h) / b.ry) + (H(X + 31, y, Z + 17) - 0.5) * 0.22;
          if (e > 1) continue;
          if (e > 0.82 && n < 0.4) continue;   // a ragged edge
          // the orange comes in patches, like masses of blossom (in-game check: single light blocks sprinkled evenly
          // through the leaves read as loose cubes, and froglights as white); a few froglights sit deep inside
          const bloom = patch(X, y, Z, 5) > 0.6;
          s.set(X, y, Z, bloom ? (n < 0.42 ? 'shroomlight' : n < 0.5 ? 'resin_block' : LEAVES)
            : n > 0.988 ? 'shroomlight' : e < 0.55 && n < 0.05 ? 'ochre_froglight[axis=y]' : LEAVES);
        }
    }
    // glowvines hanging under the crown (from a knot of wood: they do not hold on leaves)
    s.forEach((x, y, z, st) => {
      if (st !== LEAVES || s.get(x, y - 1, z) || H(x, y + 3, z) > 0.06) return;
      const len = 2 + Math.floor(H(x + 5, y, z + 9) * 6);
      for (let i = 1; i <= len; i++) if (s.get(x, y - i, z)) return;
      s.set(x, y, z, BARK);
      for (let i = 1; i <= len; i++) s.set(x, y - i, z, i === len ? 'spirecraft:glowvine[age=25]' : 'spirecraft:glowvine_plant');
    });

    // ---- the hall: a dais of the Ancients' carved stone, empty for now; the main chest; doors onto the boughs
    {
      const yf = Y(HALL);
      cells(2.5, (dx, dz) => s.set(dx + C, yf, dz + C, 'spirecraft:ruin_stone_bricks'));
      cells(1.5, (dx, dz) => s.set(dx + C, yf + 1, dz + C, dx === 0 && dz === 0 ? 'spirecraft:ruin_stone_bricks' : 'spirecraft:chiseled_ruin_stone_bricks'));
      for (const [dx, dz] of [[2, 2], [-2, 2], [2, -2], [-2, -2], [3, 0], [-3, 0], [0, 3], [0, -3]]) if (floorOk(ROOMS, dx, dz, 2)) s.set(dx + C, yf + 1, dz + C, 'candle[candles=4,lit=true]');
      let doors = 0;
      for (const b of boughs) {
        const ca = Math.cos(b.a), sa = Math.sin(b.a), q = RiK[ROOMS];
        const wx = Math.round(ca * (q - 0.5)), wz = Math.round(sa * (q - 0.5));
        if (!floorOk(ROOMS, wx, wz) || doors >= 4) continue;
        for (let d = q - 1; d <= q + 6; d += 0.25) for (const side of [-0.45, 0.45]) for (let h = 1; h <= 3; h++) {
          const x = Math.round(ca * d - sa * side) + C, z = Math.round(sa * d + ca * side) + C, st = s.get(x, yf + h, z);
          if (st && !isAir(st)) s.set(x, yf + h, z, 'air');
        }
        doors++;
      }
      const run = wallRuns(ROOMS)[0] || [], c = run[Math.floor(run.length / 2)];
      if (c) chestAt(ROOMS, c, 'ancient_tree_crown');
      // lights in the dome
      for (let h = HALL + 9; h <= 107; h++) cells(Math.max(1, hallR(h)) + 1, (dx, dz, d) => {
        const st = s.get(dx + C, Y(h), dz + C);
        if (d > hallR(h) && (st === HEART || isWood(st)) && H(dx + C, Y(h), dz + C) < 0.12) s.set(dx + C, Y(h), dz + C, 'shroomlight');
      });
      report.push(`hall: R ${RiK[ROOMS].toFixed(2)}, ${doors} doors, wall run ${run.length}${c ? '' : ' (no chest)'}`);
    }

    // ---- the lit windows: slits one wide and two high all over the trunk, a block deep, shroomlight behind
    {
      const placed = [];
      let tries = 0;
      while (placed.length < 96 && tries++ < 4000) {
        const a = r() * TAU, h = 12 + Math.floor(r() * 90), y = Y(h), ca = Math.cos(a), sa = Math.sin(a);
        if ([0, 1].some(i => s.get(Math.round(ca * (R0(h) + 2.25)) + C, y + i, Math.round(sa * (R0(h) + 2.25)) + C))) continue;   // a bough or a root here
        if (placed.some(p => Math.hypot(p[0] - ca * R0(h), p[1] - h, p[2] - sa * R0(h)) < 4.5)) continue;
        const ray = [];
        for (let d = R0(h) + 2; d > 1 && ray.length < 3; d -= 0.25) {
          const x = Math.round(ca * d) + C, z = Math.round(sa * d) + C, last = ray[ray.length - 1];
          if (last && last[0] === x && last[1] === z) continue;
          if (ray.length || isWood(s.get(x, y, z))) ray.push([x, z]);
        }
        if (ray.length < 3) continue;
        const solid = ([x, z]) => [0, 1].every(i => { const st = s.get(x, y + i, z); return isWood(st) || st === HEART; });
        const k = Math.floor(h / STOREY), inRoom = h < HALL && h % STOREY >= 1 && h % STOREY <= 7;
        if (!solid(ray[0]) || !solid(ray[1])) continue;
        if (GUARD.has(k) && inRoom && !solid(ray[2])) continue;   // no light into the spawner rooms
        if ([0, 1].some(i => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ox, oz]) => /dispenser|door|chest/.test(s.get(ray[1][0] + ox, y + i, ray[1][1] + oz) || '')))) continue;
        for (const i of [0, 1]) { s.set(ray[0][0], y + i, ray[0][1], 'air'); s.set(ray[1][0], y + i, ray[1][1], 'shroomlight'); }
        placed.push([ca * R0(h), h, sa * R0(h)]);
      }
      report.push(`windows: ${placed.length}`);
    }

    // ---- glow lichen in the dark rooms, vines down the lower trunk, moss carpets on the roots
    const SIDES = [['north', 0, -1], ['south', 0, 1], ['east', 1, 0], ['west', -1, 0]];
    for (const k of GUARD) cells(RiK[k], (dx, dz, d) => {
      if (d <= RiK[k] - 1) return;
      for (let h = 2; h <= 6; h++) {
        const x = dx + C, y = Y(k * STOREY) + h, z = dz + C;
        if (!isAir(s.get(x, y, z)) || H(x, y, z) > 0.07) continue;
        const on = SIDES.filter(([, ox, oz]) => { const st = s.get(x + ox, y, z + oz); return isWood(st) || st === HEART; });
        if (on.length) s.set(x, y, z, `glow_lichen[${on.map(o => o[0] + '=true').join(',')}]`);
      }
    });
    for (let h = 55; h >= 4; h--) for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) {
      const y = Y(h);
      if (s.get(x, y, z) || H(x, y + 40, z) > 0.03) continue;
      const side = SIDES.find(([, ox, oz]) => isWood(s.get(x + ox, y, z + oz)));
      if (!side) continue;
      const len = 2 + Math.floor(H(x + 3, y, z + 3) * 7);
      for (let i = 0; i < len && y - i > G + 1 && !s.get(x, y - i, z); i++) s.set(x, y - i, z, `vine[${side[0]}=true]`);
    }
    for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) for (let h = 1; h <= 9; h++) {
      const y = Y(h), d = Math.hypot(x - C, z - C);
      if (d > R0(h - 1) + 1 && isWood(s.get(x, y - 1, z)) && !s.get(x, y, z) && H(x, y, z) < 0.22 && !(Math.abs(x - C) <= 2 && z > C)) s.set(x, y, z, 'moss_carpet');
    }

    console.log('ancient_tree: ' + report.join('; ') + '; room radii ' + RiK.map(v => v.toFixed(2)).join(' '));
    return s.save(`ancient_tree/${seed}`);
  }

  const templates = [tree(1)];
  // A rare world landmark (user: commoner than strongholds, a map to it later): forests of every kind, on fairly flat
  // dry ground; placed before the trees so the forest closes in round its roots.
  special('ancient_tree', 'spirecraft:cave_template',
    ['spirecraft:overgrowth', 'spirecraft:misty_overgrowth', 'spirecraft:mushroom_overgrowth', 'minecraft:forest', 'minecraft:flower_forest',
      'minecraft:birch_forest', 'minecraft:old_growth_birch_forest', 'minecraft:dark_forest', 'minecraft:taiga',
      'minecraft:old_growth_pine_taiga', 'minecraft:old_growth_spruce_taiga', 'minecraft:jungle'],
    64, 24, { templates, mode: 'open_ground', sink: 10, footprint: 23 });
};
