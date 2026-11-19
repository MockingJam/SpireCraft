// Silk hive (phase 9, web nests): vanilla white wool recoloured to a warm grey, with a few lighter silk strands
// wrapped across it (diagonal, gently curving, wrapping round the tile so it stays seamless) and three isolated
// darker pits. One hue, moderate contrast (docs/design/art_style.md texture rules).
// Usage: node tools/silk_hive.js <vfull dir>
const { readPng, writePng } = require('./png');
const V = process.argv[2];
const wool = readPng(V + '/assets/minecraft/textures/block/white_wool.png');
const out = { w: 16, h: 16, d: new Uint8Array(16 * 16 * 4) };
// warm grey ramp, dark -> light
const ramp = [[150, 144, 134], [172, 166, 155], [190, 184, 173], [206, 201, 190], [220, 216, 206], [232, 229, 220]];
const lum = i => (wool.d[i] + wool.d[i + 1] + wool.d[i + 2]) / 3;
let lo = 255, hi = 0;
for (let i = 0; i < 256; i++) { const l = lum(i * 4); lo = Math.min(lo, l); hi = Math.max(hi, l); }
const tone = new Float32Array(256);
for (let i = 0; i < 256; i++) tone[i] = 1.3 + 1.7 * (lum(i * 4) - lo) / (hi - lo);   // wool grain on steps 0.6..3.2
// strands: three wraps, each a sine band running across the tile (period 16 so it tiles)
const strands = [{ a: 3, ph: 0.0, slope: 0.5 }, { a: 11, ph: 2.1, slope: 0.5 }, { a: 7, ph: 4.0, slope: -0.75 }];
for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
  for (const s of strands) {
    const c = ((s.a + s.slope * x + 1.2 * Math.sin((x / 16) * Math.PI * 2 + s.ph)) % 16 + 16) % 16;
    const dy = Math.min(Math.abs(y - c), 16 - Math.abs(y - c));
    if (dy < 0.6) tone[y * 16 + x] = Math.max(tone[y * 16 + x], 4.6);
    else if (dy < 1.3) tone[y * 16 + x] = Math.max(tone[y * 16 + x], 3.6);
    else if (dy < 1.9 && (s.slope > 0 ? y > c : y < c)) tone[y * 16 + x] = Math.min(tone[y * 16 + x], 1.4);   // the strand's shadow side
  }
}
for (const [x, y] of [[4, 6], [12, 13], [9, 1]]) tone[y * 16 + x] = 0;   // a few isolated pits
for (let i = 0; i < 256; i++) {
  const t = Math.max(0, Math.min(5, Math.round(tone[i]))), c = ramp[t];
  out.d.set([c[0], c[1], c[2], 255], i * 4);
}
writePng('src/main/resources/assets/spirecraft/textures/block/silk_hive.png', out);
console.log('ok');
