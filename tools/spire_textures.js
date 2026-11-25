// Harbour rock spire textures (2026-11-25): vanilla pointed dripstone's shapes (block: up/down x tip_merge/tip/frustum/
// middle/base, plus the item), recoloured by brightness onto harbour_rock's own ramp so the spire matches the rock it
// grows from. Usage: node tools/spire_textures.js <dir with the vanilla pointed_dripstone pngs>
const path = require('path');
const { readPng, writePng } = require('./png');
const V = process.argv[2], A = path.resolve(__dirname, '../src/main/resources/assets/spirecraft/textures/');
const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const RAMP = (() => { const a = readPng(path.join(A, 'block/harbour_rock.png')), px = []; for (let i = 0; i < a.d.length; i += 4) px.push([a.d[i], a.d[i + 1], a.d[i + 2]]); px.sort((p, q) => lum(...p) - lum(...q)); return [0.03, 0.2, 0.4, 0.6, 0.8, 0.97].map(t => px[Math.floor(t * (px.length - 1))]); })();
function recolor(src) {
  const out = { w: src.w, h: src.h, d: new Uint8Array(src.d.length) };
  let lo = 255, hi = 0;
  for (let i = 0; i < src.d.length; i += 4) { if (src.d[i + 3] < 10) continue; const L = lum(src.d[i], src.d[i + 1], src.d[i + 2]); lo = Math.min(lo, L); hi = Math.max(hi, L); }
  for (let i = 0; i < src.d.length; i += 4) {
    const t = (lum(src.d[i], src.d[i + 1], src.d[i + 2]) - lo) / Math.max(1, hi - lo);
    out.d.set([...RAMP[Math.max(0, Math.min(RAMP.length - 1, Math.round(t * (RAMP.length - 1))))], src.d[i + 3]], i);
  }
  return out;
}
const names = [];
for (const dir of ['up', 'down']) for (const t of ['tip_merge', 'tip', 'frustum', 'middle', 'base']) {
  writePng(path.join(A, `block/harbour_rock_spire_${dir}_${t}.png`), recolor(readPng(path.join(V, `pointed_dripstone_${dir}_${t}.png`))));
  names.push(dir + '_' + t);
}
writePng(path.join(A, 'item/harbour_rock_spire.png'), recolor(readPng(path.join(V, 'pointed_dripstone.png'))));
console.log('wrote', names.length, 'block textures + item');
