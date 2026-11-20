// Spawn eggs and the Ceremonial Bell icon, recolored from vanilla 1.21.10 item art (vanilla style, no new shapes).
// Egg: vanilla slime egg recolored by luminance into a ramp from the mob's main colour; its darker streaks take the
// mob's accent colour. Usage: node tools/mobs/eggs.js <vanilla item texture dir>
const { readPng, writePng } = require('../png');
const SRC = process.argv[2];
const OUT = __dirname + '/../../src/main/resources/assets/spirecraft/textures/item/';
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
// main, accent (from the mob textures / STS2 art)
const EGGS = {
  leaf_slime: ['#6fae4a', '#2f5e22'], twig_slime: ['#9aa858', '#6b4a2a'], fuzzy_wurm_crawler: ['#c9a27a', '#6e4a8a'],
  flyconid: ['#d8c9a8', '#b8432e'], nibbit: ['#c46a4a', '#3e2a2a'], shrinker_beetle: ['#4a6a8a', '#c9b458'],
  byrdonis: ['#7a5a8a', '#e0b040'], ceremonial_beast: ['#8a6a4a', '#e8e0c8'], osty: ['#e8e0c8', '#7a5ad8'],
  // batch 2: Underdocks
  corpse_slug: ['#5a9ccc', '#e8c050'], toadpole: ['#7ccab8', '#f08a20'], two_tailed_rat: ['#9a8a9e', '#e8b0a0'],
  seapunk: ['#6aa044', '#4a2a18'], terror_eel: ['#57759a', '#d83a3a'], soul_fysh: ['#8edcd2', '#f08a50'],
  // batch 3: the Hive
  bowlbug_rock: ['#d4564e', '#767a62'], bowlbug_egg: ['#9cbc50', '#58bcc2'], bowlbug_silk: ['#cc9e9a', '#f2f2f4'], bowlbug_nectar: ['#d064c0', '#f6b23c'],
  exoskeleton: ['#b28c64', '#5e422a'], chomper: ['#dcbc7a', '#26b8d8'], myte: ['#c86a30', '#f8e2b2'], entomancer: ['#64744a', '#f2dc4a'],
  kaiser_crab: ['#4a3c70', '#788eae'], knowledge_demon: ['#c2c2bc', '#d6a232'],
};
// §11: the data-driven monsters take their two colours from their own model texture (most common, then the most different common one)
const TEX = __dirname + '/../../src/main/resources/assets/spirecraft/textures/entity/';
for (const name of Object.keys(require('./specs_scripted'))) {
  if (EGGS[name]) continue;
  const t = readPng(TEX + name + '.png'), count = new Map();
  for (let i = 0; i < t.w * t.h; i++) if (t.d[i * 4 + 3] > 100) { const k = [0, 1, 2].map(c => t.d[i * 4 + c] >> 4 << 4).join(); count.set(k, (count.get(k) || 0) + 1); }
  const top = [...count.entries()].sort((a, b) => b[1] - a[1]).map(e => e[0].split(',').map(Number));
  const main = top[0], dist = c => Math.abs(c[0] - main[0]) + Math.abs(c[1] - main[1]) + Math.abs(c[2] - main[2]);
  const accent = top.slice(1, 12).sort((a, b) => dist(b) - dist(a))[0] || main;
  const hx = c => '#' + c.map(v => Math.min(255, v + 8).toString(16).padStart(2, '0')).join('');
  EGGS[name] = [hx(main), hx(accent)];
}
const base = readPng(SRC + '/slime_spawn_egg.png');
// classify vanilla slime egg pixels: outline (darkest), streak (mid-dark), body
const lums = []; for (let i = 0; i < base.w * base.h; i++) if (base.d[i * 4 + 3]) lums.push(lum(...base.d.subarray(i * 4, i * 4 + 3)));
const lo = Math.min(...lums), hi = Math.max(...lums);
for (const [name, [m, a]] of Object.entries(EGGS)) {
  const M = hex(m), A = hex(a), dark = mix(M, [10, 10, 20], 0.7), light = mix(M, [255, 255, 240], 0.45);
  const out = { w: base.w, h: base.h, d: new Uint8Array(base.d) };
  for (let i = 0; i < base.w * base.h; i++) {
    if (!base.d[i * 4 + 3]) continue;
    const [r, g, b] = base.d.subarray(i * 4, i * 4 + 3), t = (lum(r, g, b) - lo) / (hi - lo);
    let c;
    if (t < 0.18) c = dark;                                    // outline
    else if (t < 0.5) c = mix(A, mix(A, [0, 0, 0], 0.35), 1 - (t - 0.18) / 0.32 > 0.5 ? 1 : 0);   // streaks: accent, 2 tones
    else c = t > 0.85 ? light : mix(M, light, (t - 0.5) / 0.35 * 0.5);
    out.d.set([...c, 255], i * 4);
  }
  writePng(OUT + name + '_spawn_egg.png', out);
}
// Ceremonial Bell: vanilla bell, bone-white yoke and an antique green-gold bell
const bell = readPng(SRC + '/bell.png');
for (let i = 0; i < bell.w * bell.h; i++) {
  if (!bell.d[i * 4 + 3]) continue;
  const [r, g, b] = bell.d.subarray(i * 4, i * 4 + 3), L = lum(r, g, b);
  let c;
  if (r > g + 40 && b < 60 && L < 110) c = mix([90, 80, 64], [236, 228, 204], Math.min(1, (L - 30) / 80));   // brown yoke -> bone
  else c = mix([r, g, b], [r * 0.85, g * 0.9, b * 0.6 + 20], 0.6);                                        // aged gold
  bell.d.set([...c.map(v => Math.max(0, Math.min(255, Math.round(v)))), 255], i * 4);
}
writePng(OUT + 'ceremonial_bell.png', bell);
console.log('eggs + bell written');
