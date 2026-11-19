// Checks that every bone an animation in client/mob/SpireMobModel.java looks up exists in that mob's model
// (tools/mobs/specs.js). Hand-written kinds call p("name") without null checks, so a missing bone is a crash at render
// time; the data-driven monsters (Kind.SCRIPTED) only need a 'body' or 'head' root.
// Usage: node tools/mobs/check_bones.js   (exit code 1 on a problem)
const fs = require('fs');
const specs = require('./specs');
const ROOT = 'D:/MCmodev/SpireCraft/src/main/java/com/mockingjam/spirecraft/';
const model = fs.readFileSync(ROOT + 'client/mob/SpireMobModel.java', 'utf8');
const renderer = fs.readFileSync(ROOT + 'client/mob/SpireMobRenderer.java', 'utf8');

const kindOf = {};
for (const m of renderer.matchAll(/new Spec\("([a-z_0-9]+)", SpireMobModel\.Kind\.([A-Z_]+)/g)) kindOf[m[1]] = m[2];
const fnOf = {};
for (const m of model.matchAll(/case ([A-Z_]+) -> ([a-zA-Z]+)\(/g)) fnOf[m[1]] = m[2];
const body = fn => { const i = model.indexOf('private void ' + fn + '('); const j = model.indexOf('\n    private ', i + 10); return model.slice(i, j < 0 ? undefined : j); };

let bad = 0;
for (const [name, kind] of Object.entries(kindOf)) {
  const spec = specs[name];
  if (!spec) { console.log('no model for', name); bad++; continue; }
  const have = new Set(spec.bones.map(b => b.name));
  if (kind === 'SCRIPTED') continue;
  const src = body(fnOf[kind]);
  const guarded = new Set([...src.matchAll(/hasPart\("([a-z_0-9]+)"\)/g)].map(m => m[1]));
  // for (String twig : new String[] {"a", "b"}) { if (hasPart(twig)) ... } - optional parts
  for (const m of src.matchAll(/for \(String (\w+) : new String\[\] \{([^}]*)\}\)[^\n]*\n?[^\n]*hasPart\(\1\)/g)) for (const q of m[2].matchAll(/"([a-z_0-9]+)"/g)) guarded.add(q[1]);
  const need = new Set();
  // every whole string literal in an animation is a part name (p("x"), quadLegs(.., "leg_fl", ..), String[] {..})
  for (const m of src.matchAll(/"([a-z][a-z_0-9]*)"(?! \+)/g)) if (!guarded.has(m[1]) && !src.includes('"' + m[1] + '" +')) need.add(m[1]);
  // p("leg_l" + i) style lookups inside for (int i = 0; i < N; i++) loops
  for (const m of src.matchAll(/for \(int i = (\d+); i <=? (\d+); i\+\+\)[^\n]*\n?([\s\S]*?)(?=\n        [a-z}])/g)) {
    const hi = src.slice(m.index).match(/i <(=?) (\d+)/), n = +hi[2] + (hi[1] ? 1 : 0);
    for (const q of m[0].matchAll(/p\("([a-z_0-9]+)" \+ i(?: \+ "([a-z_0-9]+)")?\)/g)) for (let i = +m[1]; i < n; i++) need.add(q[1] + i + (q[2] || ''));
  }
  if (process.env.CHECK_DEBUG) console.log(name, [...need].join(' '));
  const missing = [...need].filter(n => !have.has(n));
  // the main-body lookups are also used with "!= null" checks in some kinds; report, a human decides
  if (missing.length) { console.log(name + ' (' + kind + '): missing ' + missing.join(', ')); bad++; }
}
for (const [name, kind] of Object.entries(kindOf)) if (kind === 'SCRIPTED' && specs[name] && !specs[name].bones.some(b => b.name === 'body' || b.name === 'head')) { console.log(name + ': no body/head root'); bad++; }
// scripted monsters are listed in mob/ScriptedDefs.java, not as Specs
const defs = fs.readFileSync(ROOT + 'mob/ScriptedDefs.java', 'utf8');
for (const m of defs.matchAll(/def\("([a-z_0-9]+)"/g)) {
  const s = specs[m[1]];
  if (!s) { console.log('scripted ' + m[1] + ': no model'); bad++; }
  else if (!s.bones.some(b => b.name === 'body' || b.name === 'head')) { console.log('scripted ' + m[1] + ': no body/head root'); bad++; }
}
// duplicate bone names break the generated model
for (const [name, s] of Object.entries(specs)) { const seen = new Set(); for (const b of s.bones) { if (seen.has(b.name)) { console.log(name + ': duplicate bone ' + b.name); bad++; } seen.add(b.name); }
  for (const b of s.bones) if (b.parent && !seen.has(b.parent)) { console.log(name + ': ' + b.name + ' has unknown parent ' + b.parent); bad++; } }
console.log(bad ? bad + ' problem(s)' : 'bones OK (' + Object.keys(kindOf).length + ' hand-animated specs checked, scripted roots checked)');
process.exit(bad ? 1 : 0);
