// Fogcap v2 (2026-11-26, user: "change the fogcap texture a little"): drawn by hand instead of recoloured from the red
// mushroom - a domed misty cap, lit from the upper left and fading to a dark rim, two pale fog spots, a line of gills
// under the rim, a short pale stem. Same blue-grey family as before. Usage: node tools/fogcap_v2.js
const path = require('path');
const { writePng } = require('./png');
const out = path.resolve(__dirname, '../src/main/resources/assets/spirecraft/textures/block/fogcap.png');
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const P = { L: '#c4d8d4', A: '#a2bab8', B: '#86a0a0', C: '#6c8688', D: '#566e72', E: '#40555a', F: '#2c3c40', g: '#93a6a2', S: '#e2ebe5', s: '#b6c4bd' };
const rows = [
  '................', '................', '................', '................', '................', '................', '................',
  '................',
  '......LLAA......',
  '....LAALABBB....',
  '...AALAABBBCC...',
  '..ABAABBBLBCDD..',
  '..BBBCCCCDDDEE..',
  '...EEFFgggFFE...',
  '......SSs.......',
  '......SSs.......'];
const o = { w: 16, h: 16, d: new Uint8Array(16 * 16 * 4) };
rows.forEach((r, y) => [...r].forEach((c, x) => { if (c !== '.') o.d.set([...hex(P[c]), 255], (y * 16 + x) * 4); }));
writePng(out, o);
console.log('wrote fogcap');
