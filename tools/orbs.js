// Defect orb icons (v2.1): animated 18×18 pixel-art spheres instead of the old octagons.
// Sphere: 1-px dark outline, 4-step hue-shifted ramp lit from the top-left, a fixed specular glint (style guide:
// no noise). Each orb has a moving interior: Lightning — a flickering bolt; Frost — a slowly turning snowflake;
// Dark — a swirling vortex. Writes textures/mob_effect/<orb>.png (+ .mcmeta animation).
// Usage: node tools/orbs.js [previewOut.png]
const fs = require('fs');
const { writePng } = require('./png');
const OUT = 'D:/MCmodev/SpireCraft/src/main/resources/assets/spirecraft/textures/mob_effect/';
const S = 18, C = 8.5, R = 7.25, FRAMES = 8;
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const ORBS = {
  // outline, ramp dark -> light, accent, accent bright
  lightning_orb: { outline: '#4a3010', ramp: ['#b07810', '#e0a828', '#f6d24a', '#fff2a0'], a: '#6a3a00', b: '#ffffff' },
  frost_orb: { outline: '#1d3a4a', ramp: ['#2a6f8f', '#3f97b8', '#6cc4dc', '#a8e6f2'], a: '#ffffff', b: '#e8fdff' },
  dark_orb: { outline: '#12081e', ramp: ['#24103e', '#3e1e66', '#6a3aa0', '#a77ad8'], a: '#c99cff', b: '#f0dcff' },
};
const L = (() => { const v = [-0.55, -0.65, 0.52]; const n = Math.hypot(...v); return v.map(x => x / n); })();

function sphere(o) {
  const inside = (x, y) => { const dx = (x + 0.5 - C - 0.5) / R, dy = (y + 0.5 - C - 0.5) / R; return x >= 0 && y >= 0 && x < S && y < S && dx * dx + dy * dy <= 1; };
  const px = [];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    if (!inside(x, y)) continue;
    const dx = (x + 0.5 - C - 0.5) / R, dy = (y + 0.5 - C - 0.5) / R, d2 = dx * dx + dy * dy;
    const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !inside(x + a, y + b));
    const nz = Math.sqrt(Math.max(0, 1 - d2)), lit = Math.max(0, dx * L[0] + dy * L[1] + nz * L[2]);
    const step = Math.min(3, Math.floor(lit * 4.2));
    px.push({ x, y, dx, dy, edge, col: edge ? hex(o.outline) : hex(o.ramp[step]) });
  }
  return px;
}

function drawFrame(name, o, f) {
  const img = new Map();
  for (const p of sphere(o)) img.set(p.y * S + p.x, { ...p });
  const set = (x, y, c) => { const p = img.get(y * S + x); if (p && !p.edge) p.col = c; };
  const t = f / FRAMES, A = hex(o.a), B = hex(o.b);
  if (name === 'lightning_orb') {
    // a zigzag bolt across the middle; it flips and flickers between frames
    const flip = f % 2 ? -1 : 1, bright = f % 4 < 2;
    const pts = [[4, 5], [8, 8], [7, 9], [12, 12], [10, 9], [11, 8], [14, 6]].map(([x, y]) => flip > 0 ? [x, y] : [17 - x, y]);
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let k = 0; k <= n; k++) set(Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n), bright ? B : A);
    }
  } else if (name === 'frost_orb') {
    // a six-armed snowflake turning slowly
    const rot = t * Math.PI / 3;
    for (let arm = 0; arm < 6; arm++) {
      const a = rot + arm * Math.PI / 3;
      for (let r = 0; r <= 4.6; r += 0.5) set(Math.round(C + Math.cos(a) * r), Math.round(C + Math.sin(a) * r), r > 3.5 ? B : A);
    }
    set(Math.round(C), Math.round(C), A);
  } else {
    // a two-armed spiral swirling round the core
    const rot = t * Math.PI * 2;
    for (let arm = 0; arm < 2; arm++) for (let r = 1; r <= 5.5; r += 0.35) {
      const a = rot + arm * Math.PI + r * 0.9;
      set(Math.round(C + Math.cos(a) * r), Math.round(C + Math.sin(a) * r), r < 3 ? B : A);
    }
  }
  // specular glint (top-left) always on top
  for (const [x, y] of [[5, 4], [4, 5], [5, 5]]) { const p = img.get(y * S + x); if (p && !p.edge) p.col = [255, 255, 255]; }
  return img;
}

const preview = process.argv[2];
const sheet = { w: S * FRAMES, h: S * 3, d: new Uint8Array(S * FRAMES * S * 3 * 4) };
Object.entries(ORBS).forEach(([name, o], row) => {
  const strip = { w: S, h: S * FRAMES, d: new Uint8Array(S * S * FRAMES * 4) };
  for (let f = 0; f < FRAMES; f++) {
    for (const p of drawFrame(name, o, f).values()) {
      strip.d.set([...p.col, 255], ((f * S + p.y) * S + p.x) * 4);
      sheet.d.set([...p.col, 255], ((row * S + p.y) * sheet.w + f * S + p.x) * 4);
    }
  }
  writePng(OUT + name + '.png', strip);
  fs.writeFileSync(OUT + name + '.png.mcmeta', JSON.stringify({ animation: { frametime: name === 'lightning_orb' ? 2 : 3 } }, null, 2) + '\n');
});
// Capacity effect icon: three orb sockets in a bronze bar (one lit)
{
  const img = { w: S, h: S, d: new Uint8Array(S * S * 4) };
  const set = (x, y, c) => img.d.set([...hex(c), 255], (y * S + x) * 4);
  for (let x = 1; x < 17; x++) for (let y = 6; y < 12; y++) set(x, y, y === 6 ? '#e8c060' : y === 11 ? '#6a4818' : '#b08030');
  for (let x = 1; x < 17; x++) { set(x, 5, '#3a2810'); set(x, 12, '#3a2810'); }
  for (let y = 5; y < 13; y++) { set(0, y, '#3a2810'); set(17, y, '#3a2810'); }
  [[4, '#f6d24a'], [9, '#2a1a08'], [14, '#2a1a08']].forEach(([cx, c]) => {
    for (let y = 7; y < 11; y++) for (let x = cx - 2; x < cx + 2; x++) if ((x - cx + 0.5) ** 2 + (y - 8.5) ** 2 <= 4.2) set(x, y, c);
  });
  set(3, 7, '#fffbe0');
  writePng(OUT + 'capacity.png', img);
}
if (preview) writePng(preview, sheet);
console.log('orbs written');
