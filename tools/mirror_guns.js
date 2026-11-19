// Guns in hand (v2.3, user): the held model uses the sprite mirrored left-right so the muzzle points forward
// (handheld items point the sprite's left edge away from the player). Writes textures/item/<name>_held.png.
// Usage: node tools/mirror_guns.js
const { readPng, writePng } = require('./png');
const T = 'D:/MCmodev/SpireCraft/src/main/resources/assets/spirecraft/textures/item/';
for (const name of ['flak_cannon', 'rocket_punch', 'rocket_punch_empty']) {
  const s = readPng(T + name + '.png'), o = { w: s.w, h: s.h, d: new Uint8Array(s.d.length) };
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
    const i = (y * s.w + x) * 4, j = (y * s.w + (s.w - 1 - x)) * 4;
    for (let c = 0; c < 4; c++) o.d[j + c] = s.d[i + c];
  }
  writePng(T + name + '_held.png', o);
}
console.log('ok');
