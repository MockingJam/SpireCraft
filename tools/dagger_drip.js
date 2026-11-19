// Dagger liquid states (v2.1). The accepted v11 sprites show liquid oozing off the blade; the user wants:
//   idle   = liquid still coats the blade, but nothing seeps out      -> textures/item/<name>.png
//   active = the liquid seeps out and drips (attacking; Bloodletting: self-harm) -> <name>_drip.png (animated strip)
// The v11 sprite is the source (kept in art/dagger_src/). "Ooze" pixels are those outside the blade core
// (perpendicular distance from the 45° blade axis x + y = 31) inside a per-dagger region; idle erases them and
// re-outlines the blade, the drip frames grow them back and let drops fall from their lowest points.
// Usage: node tools/dagger_drip.js
const fs = require('fs');
const { readPng, writePng } = require('./png');
const ROOT = 'D:/MCmodev/SpireCraft/';
const TEX = ROOT + 'src/main/resources/assets/spirecraft/textures/item/';
const SRC = ROOT + 'art/dagger_src/';
const DAGGERS = {
  // core: max distance from the axis that is still blade; region: where ooze may be erased
  poisoned_dagger: { ooze: (x, y, d) => y < 17 && d > 4.0 },
  // v2.3: also the blobs hanging under the right side of the blade (rows 10-21), which v2.2 left as stubs
  ink_dagger: { ooze: (x, y, d) => (y < 21 && d > 4.4) || (x + y >= 36 && y >= 10 && y <= 21) },
  // the blood runs off the tip: everything above row 3 (the overflowing drop)
  bloodletting_dagger: { ooze: (x, y) => y <= 2 && x >= 26 },
};
const FRAMES = 8;
fs.mkdirSync(SRC, { recursive: true });
const lum = p => 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2];

for (const [name, cfg] of Object.entries(DAGGERS)) {
  if (!fs.existsSync(SRC + name + '.png')) fs.copyFileSync(TEX + name + '.png', SRC + name + '.png');
  const src = readPng(SRC + name + '.png'), N = src.w;
  const get = (img, x, y) => (x < 0 || y < 0 || x >= N || y >= N) ? null : img.d.subarray((y * N + x) * 4, (y * N + x) * 4 + 4);
  const opaque = (img, x, y) => { const p = get(img, x, y); return p && p[3] > 0; };
  // darkest outline colour of the sprite
  let outline = null;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const p = get(src, x, y); if (p[3] && (!outline || lum(p) < lum(outline))) outline = [...p]; }
  // ooze pixels, ordered by how far they stick out (growth order)
  const ooze = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (!opaque(src, x, y)) continue;
    const d = Math.abs(x + y - (N - 1)) / Math.SQRT2;
    if (cfg.ooze(x, y, d)) ooze.push({ x, y, d: name === 'bloodletting_dagger' ? 3 - y : d });
  }
  // anything the cut leaves disconnected from the blade is ooze too (no floating specks in the idle sprite)
  {
    const cut = new Set(ooze.map(o => o.y * N + o.x)), seen = new Set(), start = [Math.floor(N / 2), Math.floor(N / 2) - 1];
    const stack = [start];
    while (stack.length) {
      const [x, y] = stack.pop(), k = y * N + x;
      if (seen.has(k) || !opaque(src, x, y) || cut.has(k)) continue;
      seen.add(k);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) stack.push([x + dx, y + dy]);
    }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const k = y * N + x;
      if (opaque(src, x, y) && !cut.has(k) && !seen.has(k)) ooze.push({ x, y, d: 9 });
    }
  }
  ooze.sort((a, b) => a.d - b.d);
  const dMin = ooze.length ? ooze[0].d : 0, dMax = ooze.length ? ooze[ooze.length - 1].d : 1;

  /** The sprite with only the ooze pixels whose growth key <= limit; the cut is re-outlined. */
  function frame(limit) {
    const img = { w: N, h: N, d: new Uint8Array(src.d) };
    const removed = new Set();
    for (const o of ooze) if (o.d > limit) { get(img, o.x, o.y).set([0, 0, 0, 0]); removed.add(o.y * N + o.x); }
    // stray single pixels left by the cut go too
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (!opaque(img, x, y)) continue;
      const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => opaque(img, x + dx, y + dy)).length;
      if (n <= 1 && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => removed.has((y + dy) * N + x + dx))) { get(img, x, y).set([0, 0, 0, 0]); removed.add(y * N + x); }
    }
    // blade pixels now facing the cut get the outline colour (vanilla items are always outlined)
    const edge = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (!opaque(img, x, y)) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => removed.has((y + dy) * N + x + dx)) && lum(get(img, x, y)) > lum(outline) + 25) edge.push([x, y]);
    }
    for (const [x, y] of edge) get(img, x, y).set(outline);
    return img;
  }

  const idle = frame(-Infinity);
  writePng(TEX + name + '.png', idle);
  // drip strip: grow out over 4 frames, then drops fall from the lowest ooze tips
  const strip = { w: N, h: N * FRAMES, d: new Uint8Array(N * N * FRAMES * 4) };
  const tips = [];
  for (const o of ooze) if (!ooze.some(p => p.x === o.x && p.y === o.y + 1)) tips.push(o);
  tips.sort((a, b) => b.y - a.y);
  // drop colour: the commonest bright ooze colour (not the outline)
  const counts = {};
  for (const o of ooze) { const c = get(src, o.x, o.y); if (lum(c) > lum(outline) + 40) { const k = [c[0], c[1], c[2]].join(); counts[k] = (counts[k] || 0) + 1; } }
  const liquid = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '200,30,30').split(',').map(Number);
  // v2.3 (user): the drip uses the drawing's own big drops - each blob of liquid the idle sprite lost appears where
  // the drawing has it, hangs, then lets go and falls (behind the blade where it passes it), in 10 frames of 2 ticks.
  const blobOffsets = [null, 0, 0, 1, 2, 4, 7, 11, 16, null];
  const DF = blobOffsets.length, dstrip = { w: N, h: N * DF, d: new Uint8Array(N * N * DF * 4) };
  for (let f = 0; f < DF; f++) {
    const img = { w: N, h: N, d: new Uint8Array(idle.d) };
    const off = blobOffsets[f];
    if (off !== null) for (const o of ooze) {
      const y = o.y + off;
      if (y < N && !opaque(img, o.x, y)) get(img, o.x, y).set(get(src, o.x, o.y));
    }
    dstrip.d.set(img.d, f * N * N * 4);
  }
  writePng(TEX + name + '_drip.png', dstrip);
  fs.writeFileSync(TEX + name + '_drip.png.mcmeta', JSON.stringify({ animation: { frametime: 2 } }, null, 2) + '\n');
  // inventory icon: the original drawing with its drops (the user's choice)
  writePng(TEX + name + '_icon.png', src);
  console.log(name, 'ooze px', ooze.length);
}
