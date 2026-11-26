// Glory G4 textures (2026-11-26): Wither Sand - a little heap of dark sea-green sand with grey-black grains of wither and a
// few pale glints, poured from the Aeonglass. Usage: node tools/glory_g4_textures.js
const path = require('path');
const { writePng } = require('./png');
const T = path.resolve(__dirname, '../src/main/resources/assets/spirecraft/textures/');
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rows = [
  '................', '................', '................', '................',
  '.......a........', '......abA.......', '.....abbcA......', '....abbcbcA.....',
  '...abbcdbbcA....', '..abbcbbdcbcA...', '..bcbbdcbbccbA..', '.abbdcbccbdcbbA.',
  '.bcbbcbbdcbbcbc.', '.ccbcddcbccbdcc.', '..cddccddcccdd..', '................'];
const pal = { a: '#c8f4e8', A: '#8ad8c4', b: '#5ab4a0', c: '#3a8a7a', d: '#1e3a36' };
const o = { w: 16, h: 16, d: new Uint8Array(16 * 16 * 4) };
for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
  const c = rows[y][x];
  if (c !== '.') o.d.set([...hex(pal[c]), 255], (y * 16 + x) * 4);
}
writePng(path.join(T, 'item/wither_sand.png'), o);
console.log('wrote wither_sand');
