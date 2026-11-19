// Stone statues (v3.3 user: more detail, more variety). Each draws into a Frame (lib.js) whose front is local -z,
// standing on a 3x3 plinth centred on local (0, 0, 0) at y = 0. `m` is the stone family:
//   { block, bricks, chiseled, stairs, slab, wall, mossy? }  (state ids; stairs/slab without properties)
const RUIN = {
  block: 'spirecraft:ruin_stone', bricks: 'spirecraft:ruin_stone_bricks', chiseled: 'spirecraft:chiseled_ruin_stone_bricks',
  stairs: 'spirecraft:ruin_stone_brick_stairs', slab: 'spirecraft:ruin_stone_brick_slab', wall: 'spirecraft:ruin_stone_wall',
  smoothStairs: 'spirecraft:ruin_stone_stairs', smoothSlab: 'spirecraft:ruin_stone_slab', cracked: 'spirecraft:cracked_ruin_stone_bricks',
};
/** v3.4: the harbour's stone, for the polluted sea. */
const HARBOUR = {
  block: 'spirecraft:polished_harbour_rock', bricks: 'spirecraft:dock_bricks', chiseled: 'spirecraft:polished_harbour_rock',
  stairs: 'spirecraft:dock_brick_stairs', slab: 'spirecraft:dock_brick_slab', wall: 'spirecraft:dock_brick_wall',
  smoothStairs: 'spirecraft:polished_harbour_rock_stairs', smoothSlab: 'spirecraft:polished_harbour_rock_slab', cracked: 'spirecraft:cracked_dock_bricks',
};
const STONE = {
  block: 'stone', bricks: 'stone_bricks', chiseled: 'chiseled_stone_bricks', stairs: 'stone_brick_stairs', slab: 'stone_brick_slab',
  wall: 'stone_brick_wall', smoothStairs: 'stone_stairs', smoothSlab: 'smooth_stone_slab', cracked: 'mossy_stone_bricks',
};
const st = (b, facing, half = 'bottom') => `${b}[facing=${facing},half=${half}]`;
const slab = (b, type = 'bottom') => `${b}[type=${type}]`;

/** A stepped plinth: chiseled centre, stairs all round (high side inwards), one block high. */
function plinth(f, m, w = 1) {
  for (let x = -w; x <= w; x++) for (let z = -w; z <= w; z++) {
    const edgeX = Math.abs(x) === w, edgeZ = Math.abs(z) === w;
    if (!edgeX && !edgeZ) f.set(x, 0, z, m.chiseled);
    else if (edgeX && edgeZ) f.set(x, 0, z, m.bricks);
    else f.set(x, 0, z, st(m.stairs, edgeX ? (x < 0 ? 'east' : 'west') : (z < 0 ? 'south' : 'north')));
  }
}

/** A robed priest with a staff in the right hand, hood up (the Kin / ceremonial priests). */
function priest(f, m) {
  plinth(f, m);
  // the robe flares at the hem: stairs round the base, the body narrowing up
  f.set(0, 1, 0, m.block).set(-1, 1, 0, st(m.smoothStairs, 'east')).set(1, 1, 0, st(m.smoothStairs, 'west'))
    .set(0, 1, -1, st(m.smoothStairs, 'south')).set(0, 1, 1, st(m.smoothStairs, 'north'));
  f.set(0, 2, 0, m.block).set(0, 3, 0, m.bricks);
  // folded arms in front, shoulders
  f.set(0, 3, -1, st(m.stairs, 'south', 'top')).set(-1, 3, 0, st(m.stairs, 'east', 'top')).set(1, 3, 0, st(m.stairs, 'west', 'top'));
  // the hooded head: chiseled face under a slab brim, a peak behind
  f.set(0, 4, 0, m.chiseled).set(0, 5, 0, slab(m.slab)).set(0, 4, 1, st(m.stairs, 'north'));
  // the staff, with a crook at the top
  f.fill(1, 1, -1, 1, 5, -1, m.wall).set(1, 6, -1, m.wall).set(0, 6, -1, slab(m.slab, 'top'));
}

/** The stag (Ceremonial Beast): standing four-legged on the plinth, long neck, antlers branching wide. */
function stag(f, m) {
  plinth(f, m);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) f.set(x, 1, z, m.wall);
  f.fill(-1, 2, -1, 1, 2, 1, (x, y, z) => (Math.abs(x) === 1 && Math.abs(z) === 1 ? slab(m.slab, 'top') : m.block));   // the body
  f.set(0, 3, -1, m.block).set(0, 4, -1, m.wall);                                  // neck
  f.set(0, 5, -1, m.chiseled).set(0, 5, -2, st(m.stairs, 'north', 'top'));          // skull and muzzle
  f.set(0, 3, 1, st(m.stairs, 'south', 'bottom'));                                  // haunch / tail
  // antlers: out to both sides, then up, then out again
  // (v3.4 user: nothing floating) - each antler starts beside the skull, runs out and up, every piece touching the last
  for (const s of [-1, 1]) f.set(s, 5, -1, m.wall).set(s * 2, 5, -1, m.wall).set(s * 2, 6, -1, m.wall).set(s * 2, 7, -1, m.wall).set(s * 3, 7, -1, m.wall).set(s, 7, -1, m.wall).set(s, 8, -1, m.wall);
}

/** A kneeling knight, head bowed, both hands on a sword planted in front (stone sword unless `sword` is given). */
function knight(f, m, sword, base = true) {
  if (base) plinth(f, m);
  // the knee on the ground in front, the other leg folded under
  f.set(0, 1, 0, m.block).set(-1, 1, 0, st(m.stairs, 'east')).set(1, 1, 1, st(m.stairs, 'west')).set(0, 1, 1, m.block);
  f.set(0, 2, 0, m.bricks).set(0, 2, 1, st(m.stairs, 'north', 'top'));
  // shoulders and arms reaching forward to the hilt
  f.set(0, 3, 0, m.bricks).set(-1, 3, 0, st(m.stairs, 'east', 'top')).set(1, 3, 0, st(m.stairs, 'west', 'top'));
  f.set(0, 3, -1, st(m.stairs, 'south', 'top'));                                    // hands
  f.set(0, 4, 0, m.chiseled).set(0, 5, 0, slab(m.smoothSlab));                      // helmed head
  if (sword) f.set(0, 2, -1, sword);
  else f.set(0, 2, -1, m.wall).set(0, 1, -1, m.wall);
}

/** A praying figure, arms raised high, face turned up. */
function praying(f, m) {
  plinth(f, m);
  f.set(0, 1, 0, m.block).set(-1, 1, 0, st(m.smoothStairs, 'east')).set(1, 1, 0, st(m.smoothStairs, 'west'));
  f.set(0, 2, 0, m.block).set(0, 3, 0, m.bricks);
  f.set(-1, 3, 0, m.wall).set(1, 3, 0, m.wall).set(-1, 4, 0, m.wall).set(1, 4, 0, m.wall).set(-1, 5, 0, st(m.stairs, 'west', 'top')).set(1, 5, 0, st(m.stairs, 'east', 'top'));
  f.set(0, 4, 0, m.chiseled).set(0, 5, 0, st(m.stairs, 'south'));
}

/** Sword statues for the stepped-fall pools: 5x5 frames, local (0,0,0) = the islet centre at the water level. */
const SWORD = 'spirecraft:sword_statue[facing=north,has_sword=true]';
function swordBearer(f, m) {   // a tall robed figure holding the sword point-down before it in both hands
  plinth(f, m, 2);
  f.set(0, 1, 0, m.block).set(0, 1, 1, m.block).set(-1, 1, 0, st(m.smoothStairs, 'east')).set(1, 1, 0, st(m.smoothStairs, 'west')).set(-1, 1, 1, st(m.smoothStairs, 'east')).set(1, 1, 1, st(m.smoothStairs, 'west'));
  f.set(0, 2, 0, m.block).set(0, 2, 1, m.block).set(0, 3, 0, m.bricks).set(0, 3, 1, m.bricks);
  f.set(-1, 4, 0, st(m.stairs, 'east', 'top')).set(1, 4, 0, st(m.stairs, 'west', 'top')).set(0, 4, 0, m.bricks).set(0, 4, 1, st(m.stairs, 'north', 'top'));
  f.set(-1, 3, -1, m.wall).set(1, 3, -1, m.wall);                                   // forearms
  f.set(0, 3, -1, st(m.stairs, 'south', 'top'));                                     // the hands on the hilt
  f.set(0, 2, -1, SWORD).set(0, 1, -1, m.chiseled);                                  // the sword, its point on a block
  f.set(0, 5, 0, m.chiseled).set(0, 6, 0, slab(m.slab)).set(0, 5, 1, st(m.stairs, 'north'));   // hooded head
  f.set(-1, 5, 0, st(m.stairs, 'east', 'top')).set(1, 5, 0, st(m.stairs, 'west', 'top'));     // the hood's sides
}
function swordKnight(f, m) {
  plinth(f, m, 2);
  knight(f, m, SWORD, false);
  f.set(0, 1, -1, m.chiseled);
  f.set(-1, 4, 1, st(m.stairs, 'east', 'top')).set(1, 4, 1, st(m.stairs, 'west', 'top')).set(0, 4, 1, m.bricks);   // a cloak over the back
  f.set(-2, 1, 1, m.cracked).set(2, 1, -2, st(m.stairs, 'west'));
}
function swordKing(f, m) {   // a crowned king on a throne, the sword between his knees
  plinth(f, m, 2);
  f.fill(-1, 1, 1, 1, 1, 1, m.bricks).set(-1, 2, 1, m.wall).set(1, 2, 1, m.wall).fill(-1, 3, 2, 1, 5, 2, m.bricks).set(0, 6, 2, m.chiseled);   // the throne
  f.set(-1, 2, 2, m.bricks).set(1, 2, 2, m.bricks).set(-2, 2, 1, st(m.stairs, 'east')).set(2, 2, 1, st(m.stairs, 'west'));                 // its arms
  f.set(0, 2, 1, slab(m.slab)).set(0, 2, 0, st(m.stairs, 'north', 'top')).set(0, 1, 0, m.block);                                            // seat, knees, legs
  f.set(0, 3, 1, m.bricks).set(0, 4, 1, m.bricks).set(-1, 4, 1, st(m.stairs, 'east', 'top')).set(1, 4, 1, st(m.stairs, 'west', 'top'));
  f.set(-1, 3, 0, m.wall).set(1, 3, 0, m.wall).set(0, 3, 0, st(m.stairs, 'south', 'top'));                                                  // arms down to the hilt
  f.set(0, 2, -1, SWORD).set(0, 1, -1, m.chiseled);
  f.set(0, 5, 1, m.chiseled).set(-1, 6, 1, m.wall).set(1, 6, 1, m.wall).set(0, 6, 1, slab(m.slab));                                         // crowned head
}

module.exports = { RUIN, STONE, HARBOUR, plinth, priest, stag, knight, praying, swordBearer, swordKnight, swordKing, SWORD };
