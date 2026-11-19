// Rebuilds each mob in Blockbench (scripts from build_mobs.js) and saves a screenshot per mob.
// Usage: node tools/mobs/bb_preview.mjs <dir with *.bb.js> <outDir> [name filter]
import fs from 'node:fs';
import path from 'node:path';
const URL_ = 'http://127.0.0.1:39287/bb-mcp';
const H = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };
async function post(body, sid) { const r = await fetch(URL_, { method: 'POST', headers: sid ? { ...H, 'mcp-session-id': sid } : H, body: JSON.stringify(body) }); return { sid: r.headers.get('mcp-session-id'), text: await r.text() }; }
const parse = t => { const m = t.match(/^data: (.*)$/m); return JSON.parse(m ? m[1] : t); };
const init = await post({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'spirecraft-preview', version: '1' } } });
const sid = init.sid;
await post({ jsonrpc: '2.0', method: 'notifications/initialized' }, sid);
let id = 10;
const call = async (name, args) => parse((await post({ jsonrpc: '2.0', id: id++, method: 'tools/call', params: { name, arguments: args } }, sid)).text);

const [dir, out, filter] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const views = { front: [[-24, 20, -30], [0, 8, 0]], side: [[-34, 14, 2], [0, 8, 0]] };
for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.bb.js') && (!filter || f.includes(filter)))) {
  const name = file.replace('.bb.js', '');
  await call('create_project', { name, format: 'free' });
  const r = await call('risky_eval', { code: fs.readFileSync(path.join(dir, file), 'utf8') });
  const msg = JSON.stringify(r.result ?? r.error).slice(0, 200);
  const size = name === 'ceremonial_beast' ? 2.0 : name === 'byrdonis' ? 1.6 : 1;
  for (const [v, [pos, target]] of Object.entries(views)) {
    await call('set_camera_angle', { position: pos.map(n => n * size), target: target.map(n => n * size), projection: 'perspective' });
    const shot = await call('capture_screenshot', {});
    const img = (shot.result?.content || []).find(c => c.type === 'image');
    if (img) fs.writeFileSync(path.join(out, `${name}_${v}.png`), Buffer.from(img.data, 'base64'));
  }
  console.log(name, msg);
}
