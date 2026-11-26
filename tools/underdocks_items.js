// Batch 2 item icons (docs/design/mobs.md §9), recoloured from vanilla item art (vanilla style, no new shapes):
//   beckoning_soul    - the ghast tear as a pale teal soul with two dark eye holes
//   soul_bait         - rotten flesh with a ghostly teal sheen
//   soul_fysh_bladder - the slime ball as a translucent teal bladder with an orange core
// Usage: node tools/underdocks_items.js <vanilla item texture dir>
const REPO_ROOT = require('path').resolve(__dirname, '..').split(require('path').sep).join('/') + '/';   // this checkout (was hard-coded to D:/MCmodev/SpireCraft)
const { readPng, writePng } = require('./png');
const SRC = process.argv[2] + '/', OUT = REPO_ROOT + 'src/main/resources/assets/spirecraft/textures/item/';
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
function recolor(name, ramp, alpha) {
  const img = readPng(SRC + name + '.png'), ls = [];
  for (let i = 0; i < img.d.length; i += 4) if (img.d[i + 3]) ls.push(lum(img.d[i], img.d[i + 1], img.d[i + 2]));
  const lo = Math.min(...ls), hi = Math.max(...ls);
  for (let i = 0; i < img.d.length; i += 4) {
    if (!img.d[i + 3]) continue;
    const t = (lum(img.d[i], img.d[i + 1], img.d[i + 2]) - lo) / Math.max(1, hi - lo);
    img.d.set([...hex(ramp[Math.round(t * (ramp.length - 1))]), alpha ?? img.d[i + 3]], i);
  }
  return img;
}
const put = (img, x, y, c) => img.d.set([...hex(c), 255], (y * img.w + x) * 4);
const soul = recolor('ghast_tear', ['#2e807c', '#42a09a', '#62c0b6', '#8edcd2', '#c8f4ee', '#ecfffb']);
put(soul, 6, 8, '#103030'); put(soul, 9, 8, '#103030');
writePng(OUT + 'beckoning_soul.png', soul);
const bait = recolor('rotten_flesh', ['#2a3a3a', '#3e5654', '#567a74', '#74a098', '#9ac8bc']);
writePng(OUT + 'soul_bait.png', bait);
const bladder = recolor('slime_ball', ['#2e807c', '#42a09a', '#62c0b6', '#8edcd2', '#bff4ec'], 220);
for (const [x, y] of [[7, 7], [8, 7], [7, 8], [8, 8]]) put(bladder, x, y, '#f08a50');
writePng(OUT + 'soul_fysh_bladder.png', bladder);
console.log('beckoning_soul, soul_bait, soul_fysh_bladder written');
