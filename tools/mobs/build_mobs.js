// Builds the phase 8 mob models from tools/mobs/specs.js:
//   * src/main/java/.../client/model/MobLayers.java  (LayerDefinitions, vanilla Java entity model API)
//   * src/main/resources/assets/spirecraft/textures/entity/<mob>.png (+ <mob>_glow.png for emissive parts)
//   * <outDir>/<mob>.bb.js — a Blockbench risky_eval script that rebuilds the model for a preview screenshot
// Usage: node tools/mobs/build_mobs.js [bbOutDir] [name filter]
const fs = require('fs');
const path = require('path');
const { writePng } = require('../png');
const specs = require('./specs');

const ROOT = 'D:/MCmodev/SpireCraft/';
const TEX = ROOT + 'src/main/resources/assets/spirecraft/textures/entity/';
const JAVA = ROOT + 'src/main/java/com/mockingjam/spirecraft/client/model/MobLayers.java';
const [bbOut, filter] = process.argv.slice(2);

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const hash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2246822519) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const f = n => (Number.isInteger(n) ? n.toFixed(1) : String(n)) + 'F';

/** Shelf-packs every cube's box-UV rectangle; returns texture size. */
function pack(cubes) {
  for (const c of cubes) if (c.size.some(v => !Number.isInteger(v))) throw new Error('cube sizes must be whole pixels (box UV): ' + JSON.stringify(c.size) + ' at ' + JSON.stringify(c.from));
  const rects = cubes.map(c => { const [w, h, d] = c.size; return { c, w: 2 * (d + w), h: d + h }; });
  const order = rects.slice().sort((a, b) => b.h - a.h || b.w - a.w);
  for (const W of [64, 128, 256, 512]) {
    let x = 0, y = 0, rowH = 0, ok = true;
    for (const r of order) {
      if (r.w > W) { ok = false; break; }
      if (x + r.w > W) { x = 0; y += rowH; rowH = 0; }
      r.c.uv = [x, y]; x += r.w; rowH = Math.max(rowH, r.h);
    }
    const H = Math.pow(2, Math.ceil(Math.log2(Math.max(16, y + rowH))));
    if (ok && H <= W) return [W, H];
  }
  throw new Error('texture too big');
}

/** Box-UV faces of a cube: [name, u, v, width, height]. 'up' is the world top (vanilla quirk: model y points down). */
function faces(c) {
  const [w, h, d] = c.size, [u, v] = c.uv;
  return [['up', u + d, v, w, d], ['down', u + d + w, v, w, d], ['east', u, v + d, d, h], ['north', u + d, v + d, w, h],
    ['west', u + d + w, v + d, d, h], ['south', u + 2 * d + w, v + d, w, h]];
}

function paint(name, spec) {
  const cubes = spec.bones.flatMap(b => b.cubes);
  const [W, H] = pack(cubes);
  const img = { w: W, h: H, d: new Uint8Array(W * H * 4) }, glow = { w: W, h: H, d: new Uint8Array(W * H * 4) };
  let hasGlow = false;
  // Deliberate entity shading (Blockbench style guide): top and front brighter than sides, back and bottom darker;
  // side faces get a 1-px lit top edge and a darker lower band. No random noise.
  const BASE = { up: 0, north: 1, east: 2, west: 2, south: 3, down: 4 };
  for (const c of cubes) {
    for (const [face, u0, v0, fw, fh] of faces(c)) {
      if (fw <= 0 || fh <= 0) continue;
      const mat = (c.faceMat && c.faceMat[face]) || c.mat;
      const n = mat.ramp.length, plane = c.size.includes(0);
      const mirror = face === 'south' || face === 'west';
      for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
        const mx = mirror ? fw - 1 - x : x;
        if (c.mask && !c.mask(face, mx, y, fw, fh)) continue;   // transparent
        // both faces of a plane occupy the same spot (drawn no-cull): they must be identical or they z-fight
        let step = plane ? 1 : BASE[face];
        // v4: a smooth top-to-bottom gradient on every vertical face (and on planes, identically on both sides),
        // plus a lit top edge on solid faces — layered shading instead of flat blocks
        if (face !== 'up' && face !== 'down' && fh >= 3) {
          step += (y / (fh - 1) - 0.4) * (plane ? 1.2 : 1.6);
          if (!plane && y === 0) step -= 0.7;
        }
        let col = null;
        const det = c.detail && c.detail[plane ? (face === 'south' ? 'north' : face === 'west' ? 'east' : face) : face];
        if (det) col = det(plane ? mx : x, y, fw, fh);
        if (!col && mat.pattern) {
          const pat = mat.pattern(plane ? (face === 'south' ? 'north' : face === 'west' ? 'east' : face) : face, plane ? mx : x, y, fw, fh);
          if (typeof pat === 'string') col = pat; else step += pat;
        }
        if (!col) col = mat.ramp[Math.max(0, Math.min(n - 1, Math.round(step * (n - 1) / 4)))];
        const i = ((v0 + y) * W + u0 + x) * 4;
        img.d.set([...hex(col), mat.alpha || 255], i);
        if (mat.emissive) { glow.d.set([...hex(col), 255], i); hasGlow = true; }
      }
    }
  }
  fs.mkdirSync(TEX, { recursive: true });
  writePng(TEX + name + '.png', img);
  if (hasGlow) writePng(TEX + name + '_glow.png', glow);
  return { W, H, hasGlow, img };
}

function javaFor(name, spec, W, H) {
  const byName = Object.fromEntries(spec.bones.map(b => [b.name, b]));
  const lines = [`    public static LayerDefinition ${camel(name)}() {`, '        MeshDefinition mesh = new MeshDefinition();', '        PartDefinition root = mesh.getRoot();'];
  for (const b of spec.bones) {
    const P = b.pivot, parent = b.parent ? byName[b.parent] : null;
    const off = parent ? [P[0] - parent.pivot[0], parent.pivot[1] - P[1], P[2] - parent.pivot[2]] : [P[0], 24 - P[1], P[2]];
    const cubes = b.cubes.map(c => {
      const [w, h, d] = c.size;
      const box = [c.from[0] - P[0], P[1] - (c.from[1] + h), c.from[2] - P[2], w, h, d].map(f).join(', ');
      return `.texOffs(${c.uv[0]}, ${c.uv[1]}).addBox(${box}${c.inflate ? `, new CubeDeformation(${f(c.inflate)})` : ''})`;
    }).join('\n                ');
    const rot = b.rot ? b.rot.map(a => f(+(a * Math.PI / 180).toFixed(5))) : null;
    const pose = rot ? `PartPose.offsetAndRotation(${off.map(f).join(', ')}, ${rot.join(', ')})` : `PartPose.offset(${off.map(f).join(', ')})`;
    lines.push(`        PartDefinition ${camel(b.name)} = ${parent ? camel(parent.name) : 'root'}.addOrReplaceChild("${b.name}", CubeListBuilder.create()\n                ${cubes}, ${pose});`);
  }
  lines.push(`        return LayerDefinition.create(mesh, ${W}, ${H});`, '    }');
  return lines.join('\n');
}
const camel = s => s.replace(/-/g, 'm').replace(/_([a-z0-9])/g, (m, c) => c.toUpperCase());   // bone names like 'eye-1' become valid Java names

/** A Blockbench script that rebuilds the model (Blockbench coordinates = spec coordinates) for a screenshot. */
function bbScript(name, spec, W, H, img) {
  const png = require('zlib');   // reuse writePng into a buffer
  const tmp = path.join(require('os').tmpdir(), name + '_bbtex.png');
  writePng(tmp, img);
  const b64 = fs.readFileSync(tmp).toString('base64').split('/').join('_');
  const groups = spec.bones.map(b => ({ name: b.name, parent: b.parent || null, origin: b.pivot, rotation: b.rot ? [-b.rot[0], b.rot[1], -b.rot[2]] : [0, 0, 0],
    cubes: b.cubes.map(c => ({ from: c.from, to: [c.from[0] + c.size[0], c.from[1] + c.size[1], c.from[2] + c.size[2]], uv: c.uv, inflate: c.inflate || 0 })) }));
  return `(async () => {
const G = ${JSON.stringify(groups)};
Project.texture_width = ${W}; Project.texture_height = ${H};
Outliner.root.slice().forEach(n => n.remove && n.remove());
Texture.all.slice().forEach(t => t.remove && t.remove());
const tex = new Texture({ name: '${name}' }).fromDataURL('data:image/png;base64,' + '${b64}'.split('_').join(String.fromCharCode(47))).add(false);
const made = {};
for (const g of G) {
  const grp = new Group({ name: g.name, origin: g.origin, rotation: g.rotation });
  grp.addTo(g.parent ? made[g.parent] : undefined).init();
  made[g.name] = grp;
  for (const c of g.cubes) new Cube({ name: g.name, from: c.from, to: c.to, origin: g.origin, box_uv: true, uv_offset: c.uv, inflate: c.inflate }).addTo(grp).init().applyTexture(tex, true);
}
Canvas.updateAll();
return '${name} built';
})()`;
}

const names = Object.keys(specs).filter(n => !filter || n.includes(filter));
const javaParts = [], meta = [];
for (const name of Object.keys(specs)) {
  const spec = specs[name];
  const { W, H, hasGlow, img } = paint(name, spec);
  javaParts.push(javaFor(name, spec, W, H));
  meta.push({ name, translucent: spec.render === 'translucent', glow: hasGlow });
  if (bbOut && names.includes(name)) fs.writeFileSync(path.join(bbOut, name + '.bb.js'), bbScript(name, spec, W, H, img));
  console.log(name, W + 'x' + H, hasGlow ? '(glow)' : '');
}
fs.mkdirSync(path.dirname(JAVA), { recursive: true });
fs.writeFileSync(JAVA, `package com.mockingjam.spirecraft.client.model;

import net.minecraft.client.model.geom.PartPose;
import net.minecraft.client.model.geom.builders.CubeDeformation;
import net.minecraft.client.model.geom.builders.CubeListBuilder;
import net.minecraft.client.model.geom.builders.LayerDefinition;
import net.minecraft.client.model.geom.builders.MeshDefinition;
import net.minecraft.client.model.geom.builders.PartDefinition;

/** GENERATED by tools/mobs/build_mobs.js from tools/mobs/specs.js — do not edit by hand. */
@SuppressWarnings("unused")
public final class MobLayers {
    private MobLayers() {}

${javaParts.join('\n\n')}

    /** Every layer by mob name, and which are see-through / have a glowing layer (used by the data-driven monsters). */
    public static final java.util.Map<String, java.util.function.Supplier<LayerDefinition>> BY_NAME = java.util.Map.ofEntries(
${meta.map(m => `            java.util.Map.entry("${m.name}", MobLayers::${camel(m.name)})`).join(',\n')});
    public static final java.util.Set<String> TRANSLUCENT = java.util.Set.of(${meta.filter(m => m.translucent).map(m => '"' + m.name + '"').join(', ')});
    public static final java.util.Set<String> GLOW = java.util.Set.of(${meta.filter(m => m.glow).map(m => '"' + m.name + '"').join(', ')});
}
`);
console.log('wrote', JAVA);
