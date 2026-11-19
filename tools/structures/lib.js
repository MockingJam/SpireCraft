// Structure toolkit (phase 9, docs/design/structures.md): builds block templates in code, writes them as vanilla
// structure .nbt files (the same format a structure block saves), and writes the jigsaw / structure set / template
// pool / biome tag / loot table JSON that place them.  Usage: see build.js.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '../..');
const DATA = path.join(ROOT, 'src/main/resources/data/spirecraft');
const DATA_VERSION = 4556;   // SharedConstants.WORLD_VERSION for 1.21.10

// ------------------------------------------------------------------ NBT (big-endian, gzip)
const T = { byte: 1, short: 2, int: 3, long: 4, float: 5, double: 6, string: 8, list: 9, compound: 10, intArray: 11 };
const int = v => ({ t: T.int, v }), dbl = v => ({ t: T.double, v }), byte = v => ({ t: T.byte, v }), str = v => ({ t: T.string, v });
const float = v => ({ t: T.float, v });
const list = (type, items) => ({ t: T.list, type, v: items });
const cmp = obj => ({ t: T.compound, v: obj });

/** Plain JS -> tagged NBT: numbers are ints, strings strings, booleans bytes, arrays lists, objects compounds. */
function tag(x) {
  if (x && typeof x === 'object' && 't' in x && 'v' in x) return x;
  if (typeof x === 'number') return Number.isInteger(x) ? int(x) : dbl(x);
  if (typeof x === 'string') return str(x);
  if (typeof x === 'boolean') return byte(x ? 1 : 0);
  if (Array.isArray(x)) {
    const items = x.map(tag);
    return list(items.length ? items[0].t : 0, items);
  }
  const o = {};
  for (const k of Object.keys(x)) o[k] = tag(x[k]);
  return cmp(o);
}

function encode(root) {
  const parts = [];
  const u8 = n => { const b = Buffer.alloc(1); b.writeInt8(n); parts.push(b); };
  const i16 = n => { const b = Buffer.alloc(2); b.writeInt16BE(n); parts.push(b); };
  const i32 = n => { const b = Buffer.alloc(4); b.writeInt32BE(n); parts.push(b); };
  const s = v => { const b = Buffer.from(v, 'utf8'); i16(b.length); parts.push(b); };
  const payload = x => {
    switch (x.t) {
      case T.byte: u8(x.v); break;
      case T.short: i16(x.v); break;
      case T.int: i32(x.v); break;
      case T.long: { const b = Buffer.alloc(8); b.writeBigInt64BE(BigInt(x.v)); parts.push(b); break; }
      case T.float: { const b = Buffer.alloc(4); b.writeFloatBE(x.v); parts.push(b); break; }
      case T.double: { const b = Buffer.alloc(8); b.writeDoubleBE(x.v); parts.push(b); break; }
      case T.string: s(x.v); break;
      case T.list: u8(x.v.length ? x.type : 0); i32(x.v.length); for (const e of x.v) payload(e); break;
      case T.compound: for (const k of Object.keys(x.v)) { u8(x.v[k].t); s(k); payload(x.v[k]); } u8(0); break;
      case T.intArray: i32(x.v.length); for (const n of x.v) i32(n); break;
      default: throw new Error('nbt type ' + x.t);
    }
  };
  u8(T.compound); s(''); payload(root);
  return zlib.gzipSync(Buffer.concat(parts));
}

// ------------------------------------------------------------------ random
function rng(seed) {
  let a = seed >>> 0;
  const next = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  next.int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
  next.pick = arr => arr[Math.floor(next() * arr.length)];
  next.chance = p => next() < p;
  return next;
}

// ------------------------------------------------------------------ templates
function parseState(s) {
  const m = /^([a-z0-9_:.\/-]+)(?:\[(.*)\])?$/.exec(s);
  if (!m) throw new Error('bad block ' + s);
  const name = m[1].includes(':') ? m[1] : 'minecraft:' + m[1];
  const props = {};
  if (m[2]) for (const kv of m[2].split(',')) { const [k, v] = kv.split('='); props[k.trim()] = v.trim(); }
  return { name, props };
}

const FACINGS = ['north', 'east', 'south', 'west'];

class Struct {
  constructor(w, h, d) {
    this.w = w; this.h = h; this.d = d;
    this.cells = new Map();     // "x,y,z" -> { state, nbt }
    this.entities = [];
  }
  key(x, y, z) { return x + ',' + y + ',' + z; }
  inside(x, y, z) { return x >= 0 && y >= 0 && z >= 0 && x < this.w && y < this.h && z < this.d; }
  /** Set a block ('stone_bricks', 'oak_stairs[facing=north]', 'air'); `null` clears the cell (keeps the world's block). */
  set(x, y, z, state, nbt) {
    if (!this.inside(x, y, z)) return this;
    if (state == null) this.cells.delete(this.key(x, y, z));
    else this.cells.set(this.key(x, y, z), { state, nbt });
    return this;
  }
  get(x, y, z) { const c = this.cells.get(this.key(x, y, z)); return c ? c.state : null; }
  fill(x0, y0, z0, x1, y1, z1, state) {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
        for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) this.set(x, y, z, typeof state === 'function' ? state(x, y, z) : state);
    return this;
  }
  /** Fill only where something is already set (or only where nothing is, with `empty`). */
  replace(x0, y0, z0, x1, y1, z1, fn) {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
      const cur = this.get(x, y, z);
      const n = fn(cur, x, y, z);
      if (n !== undefined) this.set(x, y, z, n);
    }
    return this;
  }
  /** A hollow box: walls of `wall`, inside air. */
  room(x0, y0, z0, x1, y1, z1, wall, inside = 'air') {
    this.fill(x0, y0, z0, x1, y1, z1, wall);
    if (inside) this.fill(x0 + 1, y0 + 1, z0 + 1, x1 - 1, y1 - 1, z1 - 1, inside);
    return this;
  }
  /** A disc (or ring with `inner`) in the xz plane. */
  disc(cx, y, cz, r, state, inner = -1) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) for (let z = Math.floor(cz - r); z <= Math.ceil(cz + r); z++) {
      const d = Math.hypot(x - cx, z - cz);
      if (d <= r + 0.01 && d > inner) this.set(x, y, z, typeof state === 'function' ? state(x, y, z, d) : state);
    }
    return this;
  }
  chest(x, y, z, facing, loot, type = 'chest') {
    return this.set(x, y, z, `${type}[facing=${facing}]`, { id: 'minecraft:' + type, LootTable: 'spirecraft:chests/' + loot });
  }
  barrel(x, y, z, facing, loot) {
    return this.set(x, y, z, `barrel[facing=${facing}]`, { id: 'minecraft:barrel', LootTable: 'spirecraft:chests/' + loot });
  }
  /** A mob spawner block (`entity` is a full id, e.g. 'spirecraft:corpse_slug'). */
  spawner(x, y, z, entity) {
    return this.set(x, y, z, 'spawner', { id: 'minecraft:mob_spawner', SpawnData: { entity: { id: entity } }, Delay: 20 });
  }
  /** A jigsaw connector (docs: name/target/pool, facing out of this piece). */
  jigsaw(x, y, z, orientation, { name, target = 'minecraft:empty', pool = 'minecraft:empty', final = 'minecraft:air', joint = 'rollable' }) {
    return this.set(x, y, z, `jigsaw[orientation=${orientation}]`, {
      id: 'minecraft:jigsaw', name, target, pool, final_state: final, joint, selection_priority: 0, placement_priority: 0,
    });
  }
  /** An entity at block position (nbt must include `id`). */
  entity(x, y, z, nbt) { this.entities.push({ x, y, z, nbt }); return this; }

  /** Mirror/rotate helpers for symmetric builds. */
  forEach(fn) { for (const [k, c] of this.cells) { const [x, y, z] = k.split(',').map(Number); fn(x, y, z, c.state, c.nbt); } }

  /** Fences, panes, bars and walls: set their side connections from the neighbours (templates may skip shape updates). */
  connect() {
    const isConn = st => /(_fence|_pane|iron_bars|_wall)$/.test(st) && !/_fence_gate$/.test(st);
    const solid = st => st && st !== 'air' && !/torch|lantern|carpet|ladder|flower|sapling|grass|fern|button|slab|stairs|candle|campfire|chain|cobweb|water|lever|rod|banner|sign|egg|_bed|door|trapdoor|bell|pot|head|skull|shroom(?!_block)|fungus|kelp|seagrass|coral|reed|vine|lichen|barnacles|snow/.test(st);
    const D = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
    for (const [k, c] of this.cells) {
      const base = c.state.split('[')[0];
      if (!isConn(base)) continue;
      const [x, y, z] = k.split(',').map(Number);
      const wall = /_wall$/.test(base);
      const props = [];
      for (const [d, [dx, dz]] of Object.entries(D)) {
        const n = this.get(x + dx, y, z + dz);
        const nb = n ? n.split('[')[0] : null;
        const on = !!n && (isConn(nb) || /_fence_gate$/.test(nb) || solid(n));
        props.push(d + '=' + (wall ? (on ? 'low' : 'none') : on));
      }
      if (wall) { const lows = props.filter(q => q.endsWith('low')).map(q => q.split('=')[0]); const straight = lows.length === 2 && ((lows.includes('north') && lows.includes('south')) || (lows.includes('east') && lows.includes('west'))); const up = this.get(x, y + 1, z); props.push('up=' + (!straight || !!(up && up !== 'air'))); }
      c.state = base + '[' + props.join(',') + ']';
    }
  }

  toNbt() {
    this.connect();
    const palette = [], index = new Map(), blocks = [];
    // the game sorts blocks itself; full blocks first is how structure blocks save them, which keeps attachments happy
    const cells = [...this.cells.entries()].map(([k, c]) => ({ p: k.split(',').map(Number), ...c }));
    const attached = s => /torch|lantern|button|ladder|vine|carpet|rail|pressure_plate|sign|banner|candle|chain|lever|flower_pot|_bed|door|cobweb|glow_lichen|sea_pickle|seagrass|kelp|moss_carpet|snow\b|item_frame/.test(s);
    cells.sort((a, b) => (attached(a.state) - attached(b.state)) || (a.p[1] - b.p[1]));
    for (const c of cells) {
      if (!index.has(c.state)) {
        index.set(c.state, palette.length);
        const { name, props } = parseState(c.state);
        const e = { Name: name };
        if (Object.keys(props).length) e.Properties = props;
        palette.push(e);
      }
      const b = { pos: c.p, state: index.get(c.state) };
      if (c.nbt) b.nbt = c.nbt;
      blocks.push(b);
    }
    const ents = this.entities.map(e => ({
      pos: list(T.double, [dbl(e.x + 0.5), dbl(e.y), dbl(e.z + 0.5)]),
      blockPos: [e.x, e.y, e.z],
      nbt: e.nbt,
    }));
    return tag({
      DataVersion: DATA_VERSION,
      size: [this.w, this.h, this.d],
      palette,
      blocks: blocks.length ? blocks : list(T.compound, []),
      entities: ents.length ? ents : list(T.compound, []),
    });
  }

  save(id) {
    const file = path.join(DATA, 'structure', id + '.nbt');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, encode(this.toNbt()));
    return 'spirecraft:' + id;
  }
}

/**
 * A turned frame inside a template: local (x, y, z) with the front towards local -z, placed at (ox, oy, oz) and turned
 * `turns` quarter turns clockwise (seen from above). Block states' facing / axis / rotation turn with it.
 */
class Frame {
  constructor(s, ox, oy, oz, turns = 0) { this.s = s; this.o = [ox, oy, oz]; this.t = ((turns % 4) + 4) % 4; }
  pos(x, z) {
    switch (this.t) { case 1: return [-z, x]; case 2: return [-x, -z]; case 3: return [z, -x]; default: return [x, z]; }
  }
  state(st) {
    if (!st) return st;
    const order = ['north', 'east', 'south', 'west'];
    return st.replace(/facing=(north|east|south|west)/, (m, f) => 'facing=' + order[(order.indexOf(f) + this.t) % 4])
      .replace(/axis=(x|z)/, (m, a) => 'axis=' + (this.t % 2 ? (a === 'x' ? 'z' : 'x') : a))
      .replace(/rotation=(\d+)/, (m, r) => 'rotation=' + ((+r + this.t * 4) % 16))
      .replace(/orientation=(north|east|south|west)_up/, (m, f) => 'orientation=' + order[(order.indexOf(f) + this.t) % 4] + '_up');
  }
  set(x, y, z, st, nbt) { const [a, b] = this.pos(x, z); this.s.set(this.o[0] + a, this.o[1] + y, this.o[2] + b, this.state(st), nbt); return this; }
  fill(x0, y0, z0, x1, y1, z1, st) {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
      for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) this.set(x, y, z, typeof st === 'function' ? st(x, y, z) : st);
    return this;
  }
  chest(x, y, z, facing, loot) { return this.set(x, y, z, `chest[facing=${facing}]`, { id: 'minecraft:chest', LootTable: 'spirecraft:chests/' + loot }); }
}
/** The facing that points from (x, z) towards (cx, cz), to the nearest quarter. */
function facingTo(x, z, cx, cz) {
  const dx = cx - x, dz = cz - z;
  return Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'east' : 'west') : (dz > 0 ? 'south' : 'north');
}
const TURNS = { north: 0, east: 1, south: 2, west: 3 };   // turns that make a frame's front (-z) face this way

// ------------------------------------------------------------------ JSON
function writeJson(rel, obj) {
  const file = path.join(DATA, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n');
}

let saltBase = 20261117;
/**
 * A single-piece (or connected, if the templates hold jigsaw blocks) jigsaw structure.
 * opts: id, biomes (array of biome ids/#tags), templates [[id, weight]], step, terrain, heightmap, offset,
 *       spacing, separation, size, maxDist, pools (extra pools: {name: [[id, weight]]}), spawn (overrides)
 */
function jigsaw(o) {
  const id = o.id;
  writeJson(`tags/worldgen/biome/has_structure/${id}.json`, { values: o.biomes });
  const pool = (name, entries) => writeJson(`worldgen/template_pool/${name}.json`, {
    fallback: 'minecraft:empty',
    elements: entries.map(([loc, weight, projection]) => ({
      weight: weight || 1,
      element: { element_type: 'minecraft:single_pool_element', location: loc, projection: projection || 'rigid', processors: 'minecraft:empty' },
    })),
  });
  pool(`${id}/start`, o.templates);
  for (const [name, entries] of Object.entries(o.pools || {})) pool(name, entries);
  writeJson(`worldgen/structure/${id}.json`, {
    type: o.dry ? 'spirecraft:dry_jigsaw' : 'minecraft:jigsaw',
    biomes: `#spirecraft:has_structure/${id}`,
    step: o.step || 'surface_structures',
    spawn_overrides: o.spawn || {},
    terrain_adaptation: o.terrain || 'beard_thin',
    start_pool: `spirecraft:${id}/start`,
    size: o.size || 1,
    start_height: { absolute: o.offset || 0 },
    project_start_to_heightmap: o.heightmap === null ? undefined : (o.heightmap || 'WORLD_SURFACE_WG'),
    max_distance_from_center: o.maxDist || 48,
    use_expansion_hack: false,
  });
  writeJson(`worldgen/structure_set/${id}.json`, {
    structures: [{ structure: `spirecraft:${id}`, weight: 1 }],
    placement: { type: 'minecraft:random_spread', spacing: o.spacing, separation: o.separation || Math.floor(o.spacing / 3), salt: o.salt || (saltBase += 7919) },
  });
}

/** A loot table: pools = [{rolls:[min,max], items:[[id, weight, min, max]]}] */
function loot(name, pools) {
  writeJson(`loot_table/chests/${name}.json`, {
    type: 'minecraft:chest',
    pools: pools.map(p => ({
      rolls: Array.isArray(p.rolls) ? { type: 'minecraft:uniform', min: p.rolls[0], max: p.rolls[1] } : p.rolls,
      entries: p.items.map(([item, weight, min, max, extra]) => {
        if (item === 'empty') return { type: 'minecraft:empty', weight };
        if (item.startsWith('#loot:')) return { type: 'minecraft:loot_table', value: item.slice(6), weight };
        const e = { type: 'minecraft:item', name: item.includes(':') ? item : 'minecraft:' + item, weight };
        const fns = [];
        if (min !== undefined && (min !== 1 || max !== 1)) fns.push({ function: 'minecraft:set_count', count: { type: 'minecraft:uniform', min, max } });
        if (extra && extra.potion) fns.push({ function: 'minecraft:set_potion', id: extra.potion });
        if (extra && extra.enchant) fns.push({ function: 'minecraft:enchant_randomly' });
        if (fns.length) e.functions = fns;
        return e;
      }),
    })),
  });
}

module.exports = { Struct, Frame, facingTo, TURNS, rng, jigsaw, loot, writeJson, FACINGS, DATA, ROOT, tag, encode };
