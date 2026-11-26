// Rocket Punch v2.1 art: the launcher with its fist fired (rocket_punch_empty) and the fist's own 16×16 texture
// (used by the 3D rocket_fist item model the projectile renders). Colours come from rocket_punch.png.
// Usage: node tools/rocket_fist.js
const REPO_ROOT = require('path').resolve(__dirname, '..').split(require('path').sep).join('/') + '/';   // this checkout (was hard-coded to D:/MCmodev/SpireCraft)
const { readPng, writePng } = require('./png');
const T = REPO_ROOT + 'src/main/resources/assets/spirecraft/textures/item/';
const src = readPng(T + 'rocket_punch.png');
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const at = (img, x, y) => img.d.subarray((y * img.w + x) * 4, (y * img.w + x) * 4 + 4);
const tan = ([r, g, b]) => r > 120 && r > b + 50;          // the golden fist (and its red flame edge)
const red = ([r, g, b]) => r > 150 && g < 80;
// --- empty launcher (v2.2): the golden fist is gone and the launcher's front shows a round black socket.
// Everything right of the socket goes; the socket is an ellipse (the barrel seen at an angle) with a metal rim.
const HX = 19, HY = 15, RX = 2.4, RY = 4.8;
const e = { w: src.w, h: src.h, d: new Uint8Array(src.d) };
const J0 = hex('#373b4a'), OUT = hex('#16151d'), RIM = hex('#545965'), RIM2 = hex('#373b4a'), HOLE = hex('#08080c'), GLOW = hex('#31edeb');
const inEll = (x, y, grow = 0) => ((x - HX) / (RX + grow)) ** 2 + ((y - HY) / (RY + grow)) ** 2 <= 1;
for (let y = 0; y < e.h; y++) for (let x = 0; x < e.w; x++) {
  const p = at(e, x, y);
  if (!p[3]) continue;
  // the fist: everything in front of the socket, and its golden pixels just behind it
  if ((x > HX && !inEll(x, y, 1)) || (x >= 15 && (tan(p) || red(p)) && !inEll(x, y, 1))) p.set([0, 0, 0, 0]);
}
for (let y = 0; y < e.h; y++) for (let x = 0; x < e.w; x++) {
  if (!inEll(x, y, 1)) continue;
  const inner = inEll(x, y, -0.7), mid = inEll(x, y);
  const c = inner ? HOLE : mid ? (y < HY ? RIM : RIM2) : OUT;
  at(e, x, y).set([...c, 255]);
}
// a faint cyan glint deep in the socket (the launcher's lights)
at(e, HX - 1, HY + 1).set([...GLOW.map(v => v >> 1), 255]);
// thin leftovers (fewer than 2 opaque neighbours) go
for (let changed = true; changed;) {
  changed = false;
  for (let y = 0; y < e.h; y++) for (let x = 0; x < e.w; x++) {
    if (!at(e, x, y)[3]) continue;
    const n = [[0, -1], [1, 0], [0, 1], [-1, 0]].filter(([dx, dy]) => x + dx >= 0 && y + dy >= 0 && x + dx < e.w && y + dy < e.h && at(e, x + dx, y + dy)[3]).length;
    if (n < 2) { at(e, x, y).set([0, 0, 0, 0]); changed = true; }
  }
}
// v2.3: the fist cut left a notch in the launcher's top edge (rows 9-10, x 15-17): close the outline over it
for (let x = 15; x <= 17; x++) { at(e, x, 9).set([...OUT, 255]); at(e, x, 10).set([...(x === 15 ? hex('#be884b') : J0), 255]); }
writePng(T + 'rocket_punch_empty.png', e);

// --- fist texture (16×16, box UV for the rocket_fist JSON model): knuckles, fingers, thumb, cuff, flame
const K = hex('#e1b368'), L = hex('#d39c52'), O = hex('#be884b'), C = hex('#996f43'), D = hex('#62483a'),
  N = hex('#545965'), J = hex('#373b4a'), R = hex('#282a38'), F = hex('#c92c21'), Y = hex('#f2a12b'), W = hex('#ffe08a');
const f = { w: 16, h: 16, d: new Uint8Array(16 * 16 * 4) };
const put = (x, y, c) => f.d.set([...c, 255], (y * 16 + x) * 4);
// rows 0-7: fist skin (lit top rows, finger grooves every 2 px, shaded bottom)
for (let y = 0; y < 8; y++) for (let x = 0; x < 16; x++) {
  let c = y < 2 ? K : y < 5 ? L : y < 7 ? O : C;
  if (x % 4 === 3 && y > 1 && y < 7) c = C;          // gaps between fingers
  if (y === 1 && x % 4 === 1) c = hex('#f4d39a');    // knuckle highlight
  put(x, y, c);
}
// rows 8-11: metal cuff
for (let y = 8; y < 12; y++) for (let x = 0; x < 16; x++) put(x, y, y === 8 ? N : y === 11 ? R : (x % 5 === 2 ? hex('#31edeb') : J));
// rows 12-15: rocket flame (bright core, orange, red edge)
for (let y = 12; y < 16; y++) for (let x = 0; x < 16; x++) {
  const edge = Math.min(x, 15 - x);
  put(x, y, edge < 2 ? F : edge < 5 ? Y : W);
}
writePng(T + 'rocket_fist.png', f);
console.log('rocket_punch_empty + rocket_fist written');
