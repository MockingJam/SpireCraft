// Builds a Blockbench eval payload (a.json) that draws the 18x18 mob effect icons with a shaded, bevelled look.
// Usage: node tools/draw_effect_icons.js  then  node tools/bb.mjs call risky_eval a.json
// Shapes are 16x16 char maps. Upper-case letters are shaded regions (5-step ramp: shadow..highlight),
// lower-case letters are flat colours (cracks, eyes, speculars). Outline and drop shadow are generated.
// Shading per pixel: bevel from region edges (lit from top-left) + a diagonal gradient across the shape.
const fs = require('fs');

const circle = (r, ch, spec) => {
  const rows = [];
  for (let y = 0; y < 16; y++) {
    let s = '';
    for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x - 7.5, y - 7.5);
      s += spec.some(([sx, sy]) => sx === x && sy === y) ? 'w' : d <= r ? ch : '.';
    }
    rows.push(s);
  }
  return rows;
};

const R = {
  steel: ['#4a4f5c', '#7d8494', '#aeb5c2', '#d9dee6', '#ffffff'],
  gold: ['#6b4a0c', '#a87414', '#d9a521', '#f2cf5b', '#fff3b8'],
  goldLight: ['#a87414', '#d9a521', '#f2cf5b', '#ffe58f', '#fffbe0'],
  goldDark: ['#3d2905', '#6b4a0c', '#a87414', '#d9a521', '#f2cf5b'],
  red: ['#4a0d0d', '#7d1717', '#b52626', '#e04a3a', '#ff8a73'],
  green: ['#16401f', '#25693a', '#3c9a52', '#6cc77a', '#b4f0b4'],
  leather: ['#2e1a0c', '#4f2e16', '#734522', '#93613a', '#b88a5e'],
  feather: ['#7a8aa0', '#aab8cc', '#d6e0ec', '#f0f5fa', '#ffffff'],
  blue: ['#173e73', '#265ea6', '#3f86d4', '#79b6f0', '#d2ecff'],
  thornBall: ['#2b1b0b', '#4d3218', '#73502a', '#9c7444', '#c9a476'],
  bone: ['#6e6250', '#9c8f78', '#cfc3a8', '#ebe2cc', '#ffffff'],
  dullSteel: ['#3a3446', '#5d5570', '#857c99', '#aaa2bd', '#d4cde3'],
  dullGuard: ['#2e2638', '#4a3d5a', '#66557d', '#85739e', '#a897bf'],
  dullGrip: ['#241b2b', '#3b2c47', '#54405f', '#6f5880', '#8f78a0'],
  orange: ['#5c1f05', '#9c3a0b', '#d9591a', '#f5893d', '#ffc28a'],
  stone: ['#3c3a36', '#5e5b55', '#85817a', '#aaa69e', '#d3cfc6'],
  poison: ['#173d0c', '#2c6b17', '#4c9e26', '#7fd04a', '#c8f59a'],
  lilac: ['#2d1840', '#4f2d6b', '#7d5a9c', '#a88bc4', '#d8c8ea'],
  ghost: ['#5b6b85', '#8fa0bd', '#c4d2e8', '#e6eef9', '#ffffff'],
  blood: ['#3d0610', '#6e0d1d', '#a8172f', '#d6344c', '#ff8a9a'],
};

/** A coin: bright rim (C) around a face (D). */
function coin() {
  const rows = [];
  for (let y = 0; y < 16; y++) {
    let s = '';
    for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x - 7.5, y - 7.5);
      s += d <= 4.2 ? 'D' : d <= 6.6 ? 'C' : '.';
    }
    rows.push(s);
  }
  return rows;
}

const blade = '.......SSSS.....';
const ICONS = {
  strength: { regions: { S: R.steel, G: R.gold, R: R.red }, rows: [
    '........SS......', blade, blade, blade, blade, blade, blade, blade, blade,
    '....GGGGGGGGGG..', '........RR......', '........RR......', '........RR......', '.......GGGG.....'] },
  dexterity: { regions: { G: R.green, D: R.leather, W: R.feather }, rows: [
    '.....GGGG.......', '.....GGGG..WW...', '.....GGGG.WWW...', '.....GGGGWWWW...', '.....GGGGWWW....', '.....GGGGWW.....',
    '.....GGGG.......', '.....GGGGG......', '.....GGGGGGG....', '.....GGGGGGGGG..', '.....GGGGGGGGGG.', '.....DDDDDDDDDD.'] },
  buffer: { regions: { B: R.blue }, flat: { w: '#ffffff' }, rows: circle(6.6, 'B', [[4, 4], [5, 4], [4, 5]]) },
  artifact: { regions: { L: R.goldLight, Y: R.gold, D: R.goldDark }, flat: { w: '#ffffff' }, rows: [
    '....LLLLLLLL....', '...YLwLLLLLLY...', '..YYLLLLLLLLYY..', '.YYYYYYYYYYYYYY.', '..DDDYYYYYYDDD..',
    '...DDDYYYYDDD...', '....DDDYYDDD....', '.....DDYYDD.....', '......DYYD......', '.......YY.......'] },
  thorns: { regions: { T: R.thornBall, S: R.bone }, rows: [
    '.......S........', '.......S........', '..S...TTT...S...', '...STTTTTTTS....', '...TTTTTTTTT....', '..TTTTTTTTTTT...',
    'SSTTTTTTTTTTTSS.', '..TTTTTTTTTTT...', '...TTTTTTTTT....', '...STTTTTTTS....', '..S...TTT...S...', '.......S........', '.......S........'] },
  weak: { regions: { S: R.dullSteel, G: R.dullGuard, R: R.dullGrip }, rows: [
    '.........SS.....', '........SSSS....', '........SSS.....', '................', '.......SS.S.....', blade, blade, blade,
    '....GGGGGGGGGG..', '........RR......', '........RR......', '........RR......', '.......GGGG.....'] },
  vulnerable: { regions: { O: R.orange }, flat: { c: '#2a0f04' }, rows: [
    '..OOOOOOOOOOOO..', '..OOOOOcOOOOOO..', '..OOOOOOcOOOOO..', '..OOOOOcOOOOOO..', '..OOOOOOccOOOO..', '..OOOOOOOcOOOO..',
    '...OOOOOcOOOO...', '...OOOOOOcOOO...', '....OOOOcOOO....', '.....OOOOcO.....', '......OOOO......', '.......OO.......'] },
  frail: { regions: { O: R.stone }, flat: { c: '#1e1d1b' }, rows: [
    '..OOOOOOOO......', '..OOOOOOOOO..O..', '..OOOOOOOOcO....', '..OOOOOOOcOOO.O.', '..OOOOOOOcOOOO..', '..OOOOOOcOOOOO..',
    '...OOOOOcOOOO...', '...OOOOOOOOOO...', '....OOOOOOOO....', '.....OOOOOO.....', '......OOOO......', '.......OO.......'] },
  poison: { regions: { P: R.poison }, flat: { w: '#ecffd9' }, rows: [
    '.......P........', '.......PP.......', '......PPPP......', '......PPPP......', '.....PPPPPP.....', '....PPPPPPPP....',
    '...PPwPPPPPPP...', '...PwPPPPPPPP...', '..PPwPPPPPPPPP..', '..PPPPPPPPPPPP..', '..PPPPPPPPPPPP..', '...PPPPPPPPPP...',
    '....PPPPPPPP....', '......PPPP......'] },
  intangible: { regions: { G: R.ghost }, flat: { e: '#1b2233', n: '#1b2233' }, rows: [
    '.....GGGGGG.....', '...GGGGGGGGGG...', '..GGGGGGGGGGGG..', '..GGeeGGGGeeGG..', '..GGeeGGGGeeGG..', '..GGGGGGGGGGGG..',
    '..GGGGGnnGGGGG..', '..GGGGGnnGGGGG..', '..GGGGGGGGGGGG..', '..GGGGGGGGGGGG..', '..GGG.GGGG.GGG..', '..GG...GG...GG..'] },
  prosperity: { regions: { C: R.goldLight, D: R.gold }, rows: coin() },
  blood_heal: { regions: { P: R.blood }, flat: { w: '#ffffff' }, rows: [
    '.......P........', '.......PP.......', '......PPPP......', '......PPPP......', '.....PPPPPP.....', '....PPPPPPPP....',
    '...PPPPPPPPPP...', '...PPPPPPPPPP...', '..PPPPPwPPPPPP..', '..PPPPwwwPPPPP..', '..PPPPPwPPPPPP..', '...PPPPPPPPPP...',
    '....PPPPPPPP....', '......PPPP......'] },
  doom: { regions: { K: R.lilac }, flat: { e: '#e04dff', n: '#1a0a24', t: '#1a0a24' }, rows: [
    '....KKKKKKKK....', '...KKKKKKKKKK...', '..KKKKKKKKKKKK..', '..KKKKKKKKKKKK..', '..KKeeKKKKeeKK..', '..KeeeKKKKeeeK..',
    '..KeeeKKKKeeeK..', '..KKKKKnnKKKKK..', '...KKKKnnKKKK...', '....KKKKKKKK....', '....KtKtKtKt....', '.....KKKKKK.....'] },
};

for (const [name, def] of Object.entries(ICONS)) {
  for (const row of def.rows) if (row.length !== 16) throw new Error(name + ': row length ' + row.length + ' "' + row + '"');
}

const OUT = 'D:/MCmodev/SpireCraft/src/main/resources/assets/spirecraft/textures/mob_effect/';
const code = `(() => {
const ICONS = ${JSON.stringify(ICONS)};
const OUT = ${JSON.stringify(OUT)};
const OUTLINE = '#140c10';
const done = [];
for (const [name, def] of Object.entries(ICONS)) {
  const rows = def.rows, H = rows.length;
  let minX = 99, maxX = -1;
  rows.forEach(r => [...r].forEach((c, x) => { if (c !== '.') { minX = Math.min(minX, x); maxX = Math.max(maxX, x); } }));
  const W = maxX - minX + 1;
  const ox = Math.floor((18 - W) / 2) - minX, oy = Math.floor((18 - H) / 2);
  const at = (x, y) => (y >= 0 && y < H && x >= 0 && x < 16) ? rows[y][x] : '.';
  const cv = document.createElement('canvas'); cv.width = 18; cv.height = 18;
  const ctx = cv.getContext('2d');
  const filled = (x, y) => at(x, y) !== '.';
  for (let y = -1; y <= H; y++) for (let x = -1; x <= 16; x++) {
    if (filled(x, y)) continue;
    if (filled(x - 1, y - 1) && !filled(x - 1, y) && !filled(x, y - 1)) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + ox, y + oy, 1, 1); }
    else if (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) {
      ctx.fillStyle = OUTLINE; ctx.fillRect(x + ox, y + oy, 1, 1);
      if (!filled(x + 1, y + 1) && x + 1 + ox < 18 && y + 1 + oy < 18 && !(filled(x + 2, y + 1) || filled(x + 1, y + 2) || filled(x + 1, y) || filled(x, y + 1))) {
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 1 + ox, y + 1 + oy, 1, 1);
      }
    }
  }
  rows.forEach((r, y) => [...r].forEach((c, x) => {
    if (c === '.') return;
    let col;
    if (def.flat && def.flat[c]) col = def.flat[c];
    else {
      const ramp = def.regions[c];
      const same = (dx, dy) => at(x + dx, y + dy) === c;
      let v = 2;
      if (!same(0, -1)) v += 1.3;
      if (!same(-1, 0)) v += 0.8;
      if (!same(0, 1)) v -= 1.3;
      if (!same(1, 0)) v -= 0.8;
      v += 0.7 - 1.4 * (((x - minX) / Math.max(1, W - 1)) + (y / Math.max(1, H - 1))) / 2;
      col = ramp[Math.max(0, Math.min(4, Math.round(v)))];
    }
    ctx.fillStyle = col; ctx.fillRect(x + ox, y + oy, 1, 1);
  }));
  const url = cv.toDataURL('image/png');
  const old = Texture.all.find(t => t.name === name); if (old) old.remove(true);
  new Texture({name, path: OUT + name + '.png'}).fromDataURL(url).add(false);
  Blockbench.writeFile(OUT + name + '.png', {content: url, savetype: 'image'});
  done.push(name);
}
const p = 'D:/MCmodev/SpireCraft/art/effects/mob_effect_icons.bbmodel';
Blockbench.writeFile(p, {content: Codecs.project.compile({compressed: false})});
Project.save_path = p; Project.saved = true;
return done.join(',');
})()`;
if (code.includes('//')) throw new Error('payload contains // which risky_eval rejects');
fs.writeFileSync('a.json', JSON.stringify({ code }));
console.log('payload written');
