const fs = require('fs');
// Mob sizes against the player (user 2026-11-19: "match the STS2 size of each monster against a person").
// The STS2 idle animations on slaythespire.wiki.gg (StS2_<Name>_Idle.webp) are exported at the in-game scale: the
// heroes stand Ironclad 361 px, Regent 363, Necrobinder 410 (Silent 251 crouching) - so Ironclad = a Minecraft
// player, 1.8 blocks, and 200 px ≈ 1 block. HEIGHT/WIDTH below are those idle frames (px); a few without an idle
// sprite are estimated from the in-game look (marked ~). The script measures each model's rest-pose bounding box
// and prints the draw scale that makes it that size, plus a hitbox.
// Usage: node tools/mobs/sizes.js  →  JSON { name: { scale, hitW, hitH, modelH, modelW } }
const specs = require('./specs');
const PX_PER_BLOCK = 200;
// name: [height px, length px]   (length = the longer horizontal extent in the render)
const STS2 = {
  leaf_slime: [160, 200], twig_slime: [160, 200],                       // ~ the M slimes, knee-to-waist high
  fuzzy_wurm_crawler: [160, 271], flyconid: [258, 191], nibbit: [123, 252], shrinker_beetle: [182, 256],
  byrdonis: [428, 655], ceremonial_beast: [560, 600], osty: [140, 180],  // beast ~ from its static render; Osty ~
  corpse_slug: [137, 220], toadpole: [149, 300], two_tailed_rat: [260, 300], seapunk: [243, 305], terror_eel: [317, 704], soul_fysh: [449, 444],
  bowlbug_rock: [250, 300], bowlbug_egg: [137, 170], bowlbug_silk: [250, 300], bowlbug_nectar: [250, 300],   // ~ (no idle sprites)
  exoskeleton: [148, 157], chomper: [125, 219], myte: [252, 309], entomancer: [395, 408], kaiser_crab: [1309, 3178], knowledge_demon: [635, 540],
  // Mawler and Vine Shambler enlarged 1.4x per user's review on 2026-11-19.
  inklet: [174, 106], fogmog: [224, 236], eye_with_teeth: [393, 442], mawler: [515, 742], snapping_jaxfruit: [300, 230], slithering_strangler: [300, 240],
  vine_shambler: [466, 588], cubex_construct: [284, 167], axe_raider: [235, 258], assassin_raider: [285, 229], brute_raider: [338, 211],
  crossbow_raider: [296, 216], tracker_raider: [233, 294], wriggler: [151, 169], bygone_effigy: [622, 336], phrog_parasite: [501, 506],
  vantom: [460, 484], kin_priest: [373, 422], kin_follower: [280, 260], sludge_spinner: [310, 236], calcified_cultist: [306, 260], damp_cultist: [329, 244],
  living_fog: [326, 309], gas_bomb: [136, 146], fossil_stalker: [199, 272], gremlin_merc: [320, 317], fat_gremlin: [195, 101], sneaky_gremlin: [186, 193],
  haunted_ship: [752, 610], punch_construct: [323, 231], sewer_clam: [239, 254], skulking_colony: [443, 358], phantasmal_gardener: [320, 150],
  waterfall_giant: [513, 595], lagavulin_matriarch: [544, 736], ovicopter: [504, 520], tough_egg: [79, 96], hatchling: [118, 112], tunneler: [210, 242],
  thieving_hopper: [297, 258], hunter_killer: [293, 518], louse_progenitor: [357, 555], slumbering_beetle: [364, 710], spiny_toad: [360, 557],
  obscura: [295, 389], parafright: [348, 357], decimillipede: [320, 600], infested_prism: [381, 250], insatiable: [870, 862],
};
// Bosses this big cannot move through caves at full width: their hitbox is capped (the model may reach past it).
const HIT_CAP_W = 5.0, HIT_CAP_H = 5.0;

const mul = (a, b) => { const r = new Array(16).fill(0); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) r[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j]; return r; };
const tr = (x, y, z) => [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1];
const rx = a => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1]; };
const ry = a => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1]; };
const rz = a => { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; };
const app = (m, [x, y, z]) => [m[0] * x + m[1] * y + m[2] * z + m[3], m[4] * x + m[5] * y + m[6] * z + m[7], m[8] * x + m[9] * y + m[10] * z + m[11]];

/** Rest-pose bounding box of a spec in pixels (same transforms as render.js / ModelPart). */
function bbox(spec) {
  const byName = Object.fromEntries(spec.bones.map(b => [b.name, b])), mat = {};
  const boneMat = b => {
    if (mat[b.name]) return mat[b.name];
    const P = b.pivot, parent = b.parent ? byName[b.parent] : null;
    const off = parent ? [P[0] - parent.pivot[0], parent.pivot[1] - P[1], P[2] - parent.pivot[2]] : [P[0], 24 - P[1], P[2]];
    const r = (b.rot || [0, 0, 0]).map(d => d * Math.PI / 180);
    let m = mul(tr(...off), mul(rz(r[2]), mul(ry(r[1]), rx(r[0]))));
    if (parent) m = mul(boneMat(parent), m);
    return (mat[b.name] = m);
  };
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (const b of spec.bones) {
    const M = boneMat(b), P = b.pivot;
    for (const c of b.cubes) {
      const [w, h, d] = c.size;
      const x0 = c.from[0] - P[0], y0 = P[1] - (c.from[1] + h), z0 = c.from[2] - P[2];
      for (const dx of [0, w]) for (const dy of [0, h]) for (const dz of [0, d]) {
        const v = app(M, [x0 + dx, y0 + dy, z0 + dz]);
        for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], v[i]); hi[i] = Math.max(hi[i], v[i]); }
      }
    }
  }
  return { h: hi[1] - lo[1], w: Math.max(hi[0] - lo[0], hi[2] - lo[2]), x: hi[0] - lo[0], z: hi[2] - lo[2] };
}

const out = {};
for (const [name, [hp, lp]] of Object.entries(STS2)) {
  const spec = specs[name];
  if (!spec) { out[name] = { error: 'no spec' }; continue; }
  const b = bbox(spec), tH = hp / PX_PER_BLOCK, tL = lp / PX_PER_BLOCK;
  // the scale that gives the STS2 height, nudged toward the STS2 length for long, low creatures (geometric mean)
  const sH = tH * 16 / b.h, sL = tL * 16 / b.w;
  const scale = +(lp > hp * 1.4 ? Math.sqrt(sH * sL) : sH).toFixed(2);
  const realH = b.h * scale / 16, realW = Math.min(b.x, b.z) * scale / 16;
  out[name] = { scale, hitW: +Math.min(HIT_CAP_W, Math.max(0.5, (b.x + b.z) / 2 * scale / 16 * 0.7)).toFixed(2), hitH: +Math.min(HIT_CAP_H, Math.max(0.4, realH * 0.9)).toFixed(2), modelH: +b.h.toFixed(1), modelW: +b.w.toFixed(1), targetH: tH, realH: +realH.toFixed(2) };
}
if (require.main === module) {
  console.log(JSON.stringify(out, null, 1));
  // the generated table the game reads (registry/ModEntities sizes the hitboxes, client/mob/SpireMobRenderer scales the models)
  const rows = Object.entries(out).filter(([, v]) => !v.error).map(([n, v]) => `        m.put("${n}", new float[] {${v.scale}F, ${v.hitW}F, ${v.hitH}F});`);
  fs.writeFileSync(__dirname + '/../../src/main/java/com/mockingjam/spirecraft/mob/MobSizes.java', `package com.mockingjam.spirecraft.mob;

import java.util.HashMap;
import java.util.Map;

/**
 * GENERATED by tools/mobs/sizes.js - do not edit by hand. Each mob's size against the player, from the STS2 idle
 * sprites at their in-game scale (Ironclad = a Minecraft player, 1.8 blocks): the model's draw scale and its hitbox.
 */
public final class MobSizes {
    private MobSizes() {}

    private static final Map<String, float[]> SIZES = new HashMap<>();
    static {
        Map<String, float[]> m = SIZES;
${rows.join('\n')}
    }

    /** Draw scale of the model, or the fallback if the mob is not in the table. */
    public static float scale(String name, float fallback) {
        float[] v = SIZES.get(name);
        return v == null ? fallback : v[0];
    }

    public static float width(String name, float fallback) {
        float[] v = SIZES.get(name);
        return v == null ? fallback : v[1];
    }

    public static float height(String name, float fallback) {
        float[] v = SIZES.get(name);
        return v == null ? fallback : v[2];
    }
}
`);
}
module.exports = out;
