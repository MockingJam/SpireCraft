// §11 boss calling tokens, recoloured from vanilla 1.21.10 item art (vanilla shapes, our colours): each source pixel's
// brightness picks a shade from a hue-shifted ramp (dark → light), keeping the vanilla shading and outline.
// Usage: node tools/mobs/summon_items.js <vanilla item texture dir>
const { readPng, writePng } = require('../png');
const SRC = process.argv[2];
const OUT = __dirname + '/../../src/main/resources/assets/spirecraft/textures/item/';
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const ITEMS = {
  black_quill: ['feather', ['#0c0a12', '#1e1a28', '#34304a', '#4e4868', '#6e6a8c', '#c8c070']],    // an ink-black feather, a gold-tinted tip highlight
  kin_idol: ['totem_of_undying', ['#2a2410', '#4a4420', '#6e6a34', '#9a924c', '#c8bc70', '#e8dca0']], // a straw-and-moss idol
  steam_whistle: ['goat_horn', ['#3a1c10', '#6a3420', '#a0583a', '#c87a50', '#e8a070', '#f8d0a8']],  // a copper whistle
  slumber_horn: ['nautilus_shell', ['#3a1a10', '#7a3a1c', '#c06a30', '#e89850', '#f8c890', '#fff0d8']], // an orange crab-shell horn
  relic_fragment: ['echo_shard', ['#3a2208', '#7a4c14', '#b8802a', '#e0b048', '#f8dc80', '#fff8d8']], // a shard of old gold
  sand_lure: ['slime_ball', ['#5a4420', '#8a6c34', '#b89850', '#d8bc74', '#f0d8a0', '#fff0d0']],       // a ball of bait rolled in sand
};
for (const [name, [src, ramp]] of Object.entries(ITEMS)) {
  const img = readPng(`${SRC}/${src}.png`), out = { w: img.w, h: img.h, d: new Uint8Array(img.d) };
  const L = [];
  for (let i = 0; i < img.w * img.h; i++) if (img.d[i * 4 + 3]) L.push(lum(...img.d.subarray(i * 4, i * 4 + 3)));
  const lo = Math.min(...L), hi = Math.max(...L), R = ramp.map(hex);
  for (let i = 0; i < img.w * img.h; i++) {
    if (!img.d[i * 4 + 3]) continue;
    const t = (lum(...img.d.subarray(i * 4, i * 4 + 3)) - lo) / Math.max(1, hi - lo);
    out.d.set(R[Math.min(R.length - 1, Math.round(t * (R.length - 1)))], i * 4);
  }
  writePng(OUT + name + '.png', out);
}
console.log('summon items written');
