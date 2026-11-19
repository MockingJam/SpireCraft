// Renders SpireCraft textures (tools/pixel_art_defs.js) in Blockbench, following docs/design/art_style.md.
// Usage (from a scratch dir): node <repo>/tools/draw_pixel_art.js <extracted client-extra.jar dir> [name-filter]
//                            node <repo>/tools/bb.mjs call risky_eval a.json
//
// Job kinds
//   map      { rows:[16], regions:{A:ramp}, flat:{a:'#hex'}, outline:'tint'|'none', base?, noise? }
//            Upper-case = shaded region, lower-case = flat colour, '.' = empty. Ramps: 5–9 colours, dark → light.
//            shade:'volume' (default for items) lights each region as a rounded surface: a height field from the distance
//            to the region edge gives per-pixel normals, lit from the top-left with diffuse + a soft specular lobe, so
//            highlights are gradients spread over several pixels. Options: kd, ks, shin, amb, depth, volumeBy:'shape'
//            (one dome for the whole object, e.g. faceted crystals), grad (extra top-left → bottom-right gradient).
//            shade:'flat' keeps the older bevel shading (used for tiling blocks).
//   reshade  { src, select, ramp, overlay?, flat?, pattern?, bg?, diffBase?, gamma? }
//            Uses a vanilla texture of the same category as shape + light/shadow (luminance) and maps the selected pixels
//            onto `ramp`; unselected pixels stay (wooden handles, bones, host rock). select: all | metal (grey) | sat
//            (colourful) | ore (coloured/bright specks on grey rock) | diff (pixels differing from diffBase) | red.
//            bg: paint the recoloured selection onto another texture (ore pattern on a different host rock).
//            overlay: extra detail drawn only on opaque pixels.
const fs = require('fs');
const path = require('path');
const V = process.argv[2] + '/assets/minecraft/textures/';
const filter = process.argv[3];
const OUT = 'D:/MCmodev/SpireCraft/src/main/resources/assets/spirecraft/textures/';
const b64 = p => fs.readFileSync(V + p).toString('base64').split('/').join('_');

const jobs = require(path.join(__dirname, 'pixel_art_defs.js'))
  .filter(j => !filter || j.name.includes(filter))
  .map(j => {
    const copy = { ...j };
    for (const key of ['base', 'src', 'bg', 'diffBase', 'tex']) if (j[key]) copy[key] = b64(j[key]);
    if (j.rows) for (const r of j.rows) if (r.length !== j.rows.length) throw new Error(j.name + ': row length ' + r.length + ' "' + r + '"');
    return copy;
  });

const code = `(async () => {
const jobs = ${JSON.stringify(jobs)};
const OUT = ${JSON.stringify(OUT)};
const load = u => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = 'data:image/png;base64,' + u.split('_').join(String.fromCharCode(47)); });
const pixels = async u => { const img = await load(u); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, c.width, c.height); };
const hex = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
const css = c => 'rgb(' + c.join(',') + ')';
const scale = (c, f) => c.map(v => Math.max(0, Math.min(255, Math.round(v * f))));
const lum = (r,g,b) => 0.299*r + 0.587*g + 0.114*b;
const sat = (r,g,b) => { const mx = Math.max(r,g,b), mn = Math.min(r,g,b); return mx === 0 ? 0 : (mx-mn)/mx; };
const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const pick = (ramp, t) => hex(ramp[Math.max(0, Math.min(ramp.length - 1, Math.round(t * (ramp.length - 1))))]);
const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0]/l, v[1]/l, v[2]/l]; };
const LIGHT = norm([-0.55, -0.7, 0.6]);
const HALF = norm([LIGHT[0], LIGHT[1], LIGHT[2] + 1]);
const done = [];

for (const j of jobs) {
  let cv, ctx;
  if (j.kind === 'reshade') {
    const src = await pixels(j.src);
    const W = src.width, H = src.height, d = src.data;
    const dbase = j.diffBase ? (await pixels(j.diffBase)).data : null;
    const outImg = j.bg ? await pixels(j.bg) : new ImageData(new Uint8ClampedArray(d), W, H);
    const out = outImg.data;
    const on = (x, y) => x >= 0 && y >= 0 && x < W && y < H && d[(y*W+x)*4+3] > 0;
    const sel = i => {
      if (d[i+3] === 0) return false;
      const r = d[i], g = d[i+1], b = d[i+2];
      switch (j.select) {
        case 'all': return true;
        case 'metal': return sat(r,g,b) < 0.22;
        case 'sat': return sat(r,g,b) >= 0.22;
        case 'ore': return (Math.max(r,g,b) - Math.min(r,g,b)) > 12 || lum(r,g,b) > 175;
        case 'diff': return Math.abs(r-dbase[i]) + Math.abs(g-dbase[i+1]) + Math.abs(b-dbase[i+2]) > 30;
        case 'red': return r > g * 1.2 && r > b * 0.9 && r > 50;
      }
      return false;
    };
    let lo = 255, hi = 0;
    for (let i = 0; i < d.length; i += 4) if (sel(i)) { const L = lum(d[i],d[i+1],d[i+2]); lo = Math.min(lo, L); hi = Math.max(hi, L); }
    const [sx0, sy0] = j.shift || [0, 0];
    const dest = (x, y) => { const tx = ((j.mirror ? W - 1 - x : x) + sx0 + W) % W, ty = ((j.flipY ? H - 1 - y : y) + sy0 + H) % H; return (ty*W+tx)*4; };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y*W+x)*4;
      if (!sel(i)) continue;
      let t = hi > lo ? (lum(d[i],d[i+1],d[i+2]) - lo) / (hi - lo) : 0.5;
      if (j.gamma) t = Math.pow(t, j.gamma);
      if (j.range) t = j.range[0] + t * (j.range[1] - j.range[0]);
      let ramp = j.ramp;
      const edge = !on(x, y-1) || !on(x-1, y) || !on(x, y+1) || !on(x+1, y);
      if (j.pattern === 'trim' && edge) ramp = j.trim;
      if (j.pattern === 'rivets' && !edge && x % 4 === 1 && y % 4 === 1) { ramp = j.rivet; t = 0.9; }
      if (j.sheen) t += j.sheen * (1 - (x + y) / (W + H - 2) * 2);
      if (j.pattern === 'seams' && !edge && y % 4 === 2) t -= 0.14;
      if (j.pattern === 'plates2' && !edge) {
        if (y % 4 === 2) t -= 0.16;
        else if ((x + y) % 6 === 0) t += 0.2;
      }
      if (j.pattern === 'engrave' && !edge) {
        if ((x * 2 + y) % 7 === 0) t += 0.16;
        else if ((x + y * 3) % 11 === 0) t -= 0.12;
      }
      if (j.noise) t += j.noise * (hash(x, y) - 0.5) * 2;
      const c = pick(ramp, t);
      const o = (j.mirror || j.flipY || j.shift) ? dest(x, y) : i;
      out[o] = c[0]; out[o+1] = c[1]; out[o+2] = c[2]; out[o+3] = 255;
    }
    if (j.overlay) j.overlay.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch === '.' || !j.flat[ch] || (!on(x, y) && !j.overlayAny)) return;
      const i = (y*W+x)*4; const c = hex(j.flat[ch]);
      out[i] = c[0]; out[i+1] = c[1]; out[i+2] = c[2]; out[i+3] = 255;
    }));
    cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    ctx = cv.getContext('2d'); ctx.putImageData(outImg, 0, 0);
  } else {
    const rows = j.rows;
    const N = rows.length;
    cv = document.createElement('canvas'); cv.width = N; cv.height = N;
    ctx = cv.getContext('2d');
    if (j.base) ctx.drawImage(await load(j.base), 0, 0, N, N);
    const at = (x, y) => (y >= 0 && y < N && x >= 0 && x < N) ? rows[y][x] : '.';
    const filled = (x, y) => at(x, y) !== '.';
    let minX = N, maxX = 0, minY = N, maxY = 0;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (filled(x, y)) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    const rampOf = c => (j.regions && j.regions[c]) || null;
    const isFlat = c => !!(j.flat && j.flat[c]);

    const shadeMode = j.shade || 'volume';
    const byShape = j.volumeBy === 'shape';
    const grp = c => (j.groups && j.groups[c]) || (byShape ? '*' : c);
    const H = [];
    if (shadeMode === 'volume' || shadeMode === 'glow' || j.regionShade) {
      const member = (c, x, y) => filled(x, y) && grp(at(x, y)) === grp(c);
      const dist = [];
      for (let y = 0; y < N; y++) { dist.push([]); for (let x = 0; x < N; x++) {
        const c = at(x, y);
        if (c === '.') { dist[y].push(0); continue; }
        let best = 99;
        for (let yy = -1; yy <= N; yy++) for (let xx = -1; xx <= N; xx++) {
          if (member(c, xx, yy)) continue;
          const dd = Math.hypot(xx - x, yy - y);
          if (dd < best) best = dd;
        }
        dist[y].push(best - 0.5);
      } }
      const maxBy = {};
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const key = grp(at(x, y)); maxBy[key] = Math.max(maxBy[key] || 0, dist[y][x]); }
      const depth = j.depth || 2.4;
      for (let y = 0; y < N; y++) { H.push([]); for (let x = 0; x < N; x++) {
        const c = at(x, y);
        if (c === '.') { H[y].push(0); continue; }
        const R = Math.max(1, Math.min(maxBy[grp(c)], j.radius || 99));
        const sN = Math.min(1, dist[y][x] / R), dep = j.bulge ? j.bulge * R : depth;
        H[y].push(j.profile === 'round' ? dep * Math.sqrt(1 - (1 - sN) * (1 - sN)) : dep * Math.sin(sN * Math.PI / 2));
      } }
      for (let pass = 0; pass < (j.smoothH || 0); pass++) {
        const S = H.map(row => row.slice());
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          const c = at(x, y); if (c === '.') continue;
          let sum = H[y][x] * 2, n = 2;
          for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx > N - 1 || yy > N - 1 || at(xx, yy) === '.' || grp(at(xx, yy)) !== grp(c)) continue; sum += H[yy][xx]; n++; }
          S[y][x] = sum / n;
        }
        for (let y = 0; y < N; y++) H[y] = S[y];
      }
    }
    const h = (x, y, c) => {
      if (x < 0 || y < 0 || x > N - 1 || y > N - 1) return 0;
      if (!filled(x, y)) return 0;
      return grp(at(x, y)) === grp(c) ? H[y][x] : H[y][x] * 0.6;
    };

    if (j.outline !== 'none') {
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        if (filled(x, y)) continue;
        const dirs = [[0,-1,'b'],[-1,0,'b'],[1,0,'t'],[0,1,'t']];
        let c = null, lit = false;
        for (const [dx, dy, side] of dirs) { const n = at(x+dx, y+dy); if (n !== '.') { c = n; if (side === 't') lit = true; } }
        if (!c) continue;
        const ramp = rampOf(c);
        const base = ramp ? hex(ramp[j.outlineIdx || 0]) : scale(hex(j.flat[c]), 0.45);
        ctx.fillStyle = css(scale(base, lit ? 1.12 : 0.85)); ctx.fillRect(x, y, 1, 1);
      }
    }
    let texLum = null;
    if (j.tex) {
      const td = (await pixels(j.tex)).data; texLum = [];
      let lo = 255, hi = 0;
      for (let i = 0; i < 256; i++) { const L = lum(td[i*4], td[i*4+1], td[i*4+2]); texLum.push(L); lo = Math.min(lo, L); hi = Math.max(hi, L); }
      texLum = texLum.map(L => (L - lo) / Math.max(1, hi - lo));
    }
    const mix = (a, b, f) => '#' + hex(a).map((v, k) => Math.round(v + (hex(b)[k] - v) * f).toString(16).padStart(2, '0')).join('');
    const blendAt = fr => { const rs = j.blend.ramps, st = j.blend.stops || rs.map((_, i) => i / (rs.length - 1));
      let k = 0; while (k < rs.length - 2 && fr > st[k + 1]) k++;
      const lf = Math.max(0, Math.min(1, (fr - st[k]) / (st[k + 1] - st[k])));
      return rs[k].map((c0, i) => mix(c0, rs[k + 1][i], lf)); };
    const blendRamps = j.blend ? Array.from({ length: (j.blend.steps || 4) + 1 }, (_, k) => blendAt(k / (j.blend.steps || 4))) : null;
    const BAYER = [[0, 0.5], [0.75, 0.25]];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const c = at(x, y);
      if (c === '.') continue;
      let col;
      if (isFlat(c)) col = hex(j.flat[c]);
      else {
        let ramp = rampOf(c);
        if (!ramp) throw new Error(j.name + ': no ramp for ' + c);
        if (blendRamps && j.blend.regions.includes(c)) {
          const [x0, y0] = j.blend.p0, [x1, y1] = j.blend.p1, vx = x1 - x0, vy = y1 - y0;
          let f = Math.max(0, Math.min(1, ((x + 0.5 - x0) * vx + (y + 0.5 - y0) * vy) / (vx * vx + vy * vy)));
          const steps = blendRamps.length - 1;
          ramp = blendRamps[Math.max(0, Math.min(steps, Math.floor(f * steps + BAYER[y % 2][x % 2])))];
        }
        const u = (((x - minX) / Math.max(1, maxX - minX)) + ((y - minY) / Math.max(1, maxY - minY))) / 2;
        let t;
        const mode = (j.regionShade && j.regionShade[c]) || shadeMode;
        if (mode === 'volume') {
          const hx = (h(x + 1, y, c) - h(x - 1, y, c)) / 2;
          const hy = (h(x, y + 1, c) - h(x, y - 1, c)) / 2;
          const n = norm([-hx, -hy, 1]);
          const diff = Math.max(0, n[0]*LIGHT[0] + n[1]*LIGHT[1] + n[2]*LIGHT[2]);
          const spec = Math.pow(Math.max(0, n[0]*HALF[0] + n[1]*HALF[1] + n[2]*HALF[2]), j.shin || 10);
          t = (j.amb ?? 0.05) + (j.kd ?? 0.8) * diff + (j.ks ?? 0.3) * spec + (j.grad ?? 0.18) * (0.5 - u);
          if (j.rim) t += j.rim * Math.max(0, -(n[0] * LIGHT[0] + n[1] * LIGHT[1]) / Math.hypot(LIGHT[0], LIGHT[1])) * (1 - n[2]);
          if (texLum && (!j.texRegions || j.texRegions.includes(c))) t = t * (1 - (j.texMix ?? 0.45)) + (j.texMix ?? 0.45) * texLum[y * N + x];
        } else if (mode === 'glow') {
          t = (j.amb ?? 0.2) + (1 - (j.amb ?? 0.2)) * H[y][x] / (j.depth || 2.4);
        } else {
          t = 0.55 + (j.gradient === false ? 0 : (j.gradient || 0.5)) * (0.5 - u);
          const out = (dx, dy) => !filled(x + dx, y + dy);
          if (out(0, -1)) t += 0.22; if (out(-1, 0)) t += 0.14; if (out(0, 1)) t -= 0.24; if (out(1, 0)) t -= 0.16;
          const other = (dx, dy) => !j.soft && filled(x + dx, y + dy) && at(x + dx, y + dy) !== c;
          if (other(0, -1) || other(-1, 0)) t += 0.1;
          if (other(0, 1) || other(1, 0)) t -= 0.12;
        }
        if (j.innerGlow && j.innerGlow.regions.includes(c)) {
          let dmin = 99;
          for (let yy = 0; yy < N; yy++) for (let xx = 0; xx < N; xx++) if (j.innerGlow.from.includes(at(xx, yy))) dmin = Math.min(dmin, Math.hypot(xx - x, yy - y));
          t += j.innerGlow.strength * Math.exp(-dmin / j.innerGlow.radius);
        }
        if (j.noise) t += j.noise * (hash(x, y) - 0.5) * 2;
        col = pick(ramp, t);
      }
      ctx.fillStyle = css(col); ctx.fillRect(x, y, 1, 1);
    }
  }
  const url = cv.toDataURL('image/png');
  const old = Texture.all.find(t => t.name === j.name); if (old) old.remove(true);
  new Texture({name: j.name, path: OUT + j.out}).fromDataURL(url).add(false);
  Blockbench.writeFile(OUT + j.out, {content: url, savetype: 'image'});
  done.push(j.name);
}
const p = 'D:/MCmodev/SpireCraft/art/pixel_art.bbmodel';
Blockbench.writeFile(p, {content: Codecs.project.compile({compressed: false})});
Project.save_path = p; Project.saved = true;
return done.length + ' textures: ' + done.join(',');
})()`;
if (code.includes('//')) throw new Error('payload contains // which risky_eval rejects');
fs.writeFileSync('a.json', JSON.stringify({ code }));
console.log(jobs.length + ' jobs written to a.json');
