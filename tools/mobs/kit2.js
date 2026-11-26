// Glory v2 modelling kit (2026-11-26). The user's notes on the first glory models:
//   * humanoids must stand straight (no whole-body lean), heads not long, eyes not tiny, people not all thin - each body
//     part its own proportion, armour with real detail;
//   * textures: no per-pixel noise, no flat single colours - smooth gradients and shine, stripes, big soft spots and
//     patches with colour transitions;
//   * mostly cuboids - no octagonal tubes built from many boxes (joining and turning boxes is fine).
// These helpers make "smooth" materials (blended ramps, see build_mobs.js rampAt) and the patterns that go on them.
const { B, rotBox } = require('./kit');

/** A smooth material from a light -> dark ramp (blended, with soft shaded rims). */
const S = (...ramp) => ({ ramp, smooth: true });
const sm = m => ({ ...m, smooth: true });
const pat = (m, pattern) => ({ ...m, pattern });
const glow = m => ({ ...m, emissive: true });
const h = (x, y, s = 0) => { let v = (x * 374761393 + y * 668265263 + s * 2246822519) ^ 0x5bd1e995; v = Math.imul(v ^ (v >>> 13), 1274126177); return ((v ^ (v >>> 16)) >>> 0) / 4294967296; };
const smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);

/** Combine patterns: numbers add up; the first colour / mix wins. */
function all(...ps) {
  return (f, x, y, w, hh) => {
    let step = 0, out = null;
    for (const p of ps) {
      const r = p(f, x, y, w, hh);
      if (typeof r === 'number') step += r;
      else if (typeof r === 'string') return r;
      else if (r && typeof r === 'object') { if (r.step) step += r.step; if (r.color && !out) out = r; }
    }
    return out ? { ...out, step } : step;
  };
}

/**
 * Big soft spots of another colour, blended in with a smooth falloff: one blob per cell (jittered), radius r.
 * Only on faces in `faces` (default all but the underside).
 */
function spots(color, { cell = 6, r = 2.2, seed = 1, amount = 0.85, faces } = {}) {
  return (f, x, y) => {
    if (faces ? !faces.includes(f) : f === 'down') return 0;
    const fs = f.charCodeAt(0) * 7 + seed;
    const cx = Math.floor(x / cell), cy = Math.floor(y / cell);
    let best = 1e9;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      const gx = cx + i, gy = cy + j;
      if (h(gx, gy, fs + 3) < 0.35) continue;   // not every cell has a spot
      const px = gx * cell + h(gx, gy, fs) * cell, py = gy * cell + h(gx, gy, fs + 1) * cell;
      const rr = r * (0.7 + 0.6 * h(gx, gy, fs + 2));
      best = Math.min(best, Math.hypot(x + 0.5 - px, y + 0.5 - py) / rr);
    }
    const t = smooth(1.25 - best);
    return t > 0.02 ? { color, t: t * amount } : 0;
  };
}

/** Stripes across a face (axis 'y' = horizontal bands, 'x' = vertical): a band of `color` blended at the edges. */
function stripes(color, { period = 5, width = 2, axis = 'y', amount = 0.8, offset = 0, faces } = {}) {
  return (f, x, y) => {
    if (faces ? !faces.includes(f) : (f === 'up' || f === 'down')) return 0;
    const v = ((axis === 'y' ? y : x) + offset) % period;
    if (v >= width) return 0;
    const edge = width > 2 && (v === 0 || v === width - 1) ? 0.55 : 1;
    return { color, t: amount * edge };
  };
}

/** A highlight band (shine) running down a face at about a third of its width, softly. */
const shine = (strength = 1.1, at = 0.3) => (f, x, y, w) => {
  if (f === 'up' || f === 'down' || w < 3) return 0;
  const d = Math.abs(x + 0.5 - w * at) / Math.max(1, w * 0.18);
  return -strength * smooth(1 - d);
};

/** Polished armour plate: bright top rim, a dark seam every `rows` (with a lit lip under it), rivets at the corners,
 *  a soft shine band, darker side edges. */
function plate({ rows = 0, rivet = true, rim = true, shineAt = 0.3 } = {}) {
  const sh = shine(1.0, shineAt);
  return (f, x, y, w, hh) => {
    let s = sh(f, x, y, w, hh);
    if (rim && y === 0 && f !== 'up' && f !== 'down') s -= 1.0;
    if (rows && f !== 'up' && f !== 'down') { const m = y % rows; if (m === rows - 1 && y < hh - 1) s += 1.3; else if (m === 0 && y > 0) s -= 0.6; }
    if (rivet && w >= 5 && hh >= 4 && f !== 'down' && (x === 1 || x === w - 2) && (y === 1 || y === hh - 2)) s -= 1.6;
    return s;
  };
}

/** Chain mail / scale rows: alternate lit and dark pixels in offset rows. */
const mail = (f, x, y) => ((x + (y % 2)) % 2 === 0 ? -0.5 : 0.4);

/** Cloth folds: soft vertical folds every `period` pixels, and a darker hem at the bottom. */
const folds = (period = 4) => (f, x, y, w, hh) => {
  if (f === 'up' || f === 'down') return 0;
  const p = (x % period) / period;
  return Math.cos(p * Math.PI * 2) * 0.45 + (y >= hh - 2 ? 0.7 : 0);
};

/** Leather: a stitched seam near the edges. */
const stitched = (f, x, y, w, hh) => (f !== 'up' && f !== 'down' && (x === 1 || x === w - 2) && y % 2 === 0 ? 0.9 : 0);

/**
 * Big eyes for a head's north face: each a white (or coloured) eye `size` px with a dark pupil and a glint, under an
 * optional brow line. o = { y, gap (px between), size (2 | 3), white, iris, pupil, brow, glint }.
 */
function eyes(o = {}) {
  const { y: ey = 2, gap = 2, size = 2, white = '#f4f2ea', iris = '#3a6a8a', pupil = '#14141a', brow, glint = '#ffffff', lid } = o;
  return (x, y, w) => {
    const total = size * 2 + gap, x0 = Math.floor((w - total) / 2);
    for (const ex of [x0, x0 + size + gap]) {
      if (brow && y === ey - 1 && x >= ex - (o.browOut ? 1 : 0) && x < ex + size + (o.browOut ? 1 : 0)) return brow;
      if (x >= ex && x < ex + size && y >= ey && y < ey + size) {
        const lx = x - ex, ly = y - ey, inner = ex === x0 ? size - 1 : 0;
        if (lid && ly === 0) return lid;
        if (size === 2) return lx === inner && ly === 1 ? pupil : lx !== inner && ly === 0 && glint ? glint : lx === inner ? iris : white;
        if (lx === 1 && ly === 1) return pupil;
        if (lx === 0 && ly === 0 && glint) return glint;
        return (lx === 1 || ly === 1) ? iris : white;
      }
    }
    return null;
  };
}
/** The first non-null of several face details. */
const face = (...ds) => (x, y, w, hh) => { for (const d of ds) { const r = d(x, y, w, hh); if (r) return r; } return null; };
/** A mouth line (and teeth) across the face at row y. */
const mouth = (y0, w0, { color = '#3a1a1c', teeth, tooth = '#f4f0e0' } = {}) => (x, y, w) => {
  const x0 = Math.floor((w - w0) / 2);
  if (y === y0 && x >= x0 && x < x0 + w0) return color;
  if (teeth && y === y0 - 1 && teeth.includes(x - x0)) return tooth;
  return null;
};

/** A box with a slightly smaller box on each of its six faces' middle - reads round without any 45-degree tubes. */
function rounded(name, parent, c, size, inset, mat, rot) {
  const [w, hh, d] = size, [cx, cy, cz] = c, i = inset;
  return { name, parent, pivot: c, rot, cubes: [
    B([cx - w / 2, cy - hh / 2 + i * 2, cz - d / 2 + i * 2], [w, Math.max(1, hh - 4 * i), Math.max(1, d - 4 * i)], mat),
    B([cx - w / 2 + i * 2, cy - hh / 2, cz - d / 2 + i * 2], [Math.max(1, w - 4 * i), hh, Math.max(1, d - 4 * i)], mat),
    B([cx - w / 2 + i * 2, cy - hh / 2 + i * 2, cz - d / 2], [Math.max(1, w - 4 * i), Math.max(1, hh - 4 * i), d], mat),
  ] };
}

module.exports = { S, sm, pat, glow, h, smooth, all, spots, stripes, shine, plate, mail, folds, stitched, eyes, face, mouth, rounded, B, rotBox };
