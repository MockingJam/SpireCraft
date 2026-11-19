// Minimal MCP-over-HTTP client for the Blockbench plugin. Usage: node bb.mjs list | node bb.mjs call <tool> <jsonArgsFile>
import fs from 'node:fs';
const URL_ = 'http://127.0.0.1:39287/bb-mcp';
const H = {'Content-Type':'application/json','Accept':'application/json, text/event-stream'};
async function post(body, sid){ const r = await fetch(URL_,{method:'POST',headers:sid?{...H,'mcp-session-id':sid}:H,body:JSON.stringify(body)}); const t = await r.text(); return {sid:r.headers.get('mcp-session-id'), text:t}; }
function parse(t){ const m = t.match(/^data: (.*)$/m); return JSON.parse(m?m[1]:t); }
const init = await post({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'claude-code-script',version:'1'}}});
const sid = init.sid; await post({jsonrpc:'2.0',method:'notifications/initialized'}, sid);
const [cmd, a, b] = process.argv.slice(2);
if (cmd==='list'){ const r = parse((await post({jsonrpc:'2.0',id:2,method:'tools/list'},sid)).text); for (const t of r.result.tools){ if(!a || a.split(',').includes(t.name)) console.log(a? JSON.stringify(t,null,1) : t.name); } }
else { const args = b ? JSON.parse(fs.readFileSync(b,'utf8')) : {}; const r = parse((await post({jsonrpc:'2.0',id:3,method:'tools/call',params:{name:a,arguments:args}},sid)).text); console.log(JSON.stringify(r.result ?? r.error, null, 1).slice(0, 4000)); }
