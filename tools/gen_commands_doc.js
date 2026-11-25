// Writes docs/COMMANDS.md: /locate and /place commands for every structure and biome the mod registers, read from the
// data itself (so the list never names an abandoned structure or biome). Run after tools/structures/build.js / runData.
// Usage: node tools/gen_commands_doc.js
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), D = path.join(ROOT, 'src/main/resources/data/spirecraft'), GEN = path.join(ROOT, 'src/generated/resources/data/spirecraft');
const ZH = {
  automaton_factory: '机器人生产厂（故障机器人）', beekeeper: '养蜂人窑洞', beekeeper_hollow: '养蜂人树洞', bowlbug_nest: '盛碗虫巢', byrdonis_nest: '多尼斯异鸟巢',
  camp_desert: '营地（沙漠）', camp_plains: '营地（平原）', camp_savanna: '营地（稀树草原）', camp_snowy: '营地（雪原）', camp_taiga: '营地（针叶林）',
  ceremonial_ruins: '仪式遗迹', defect_station: '冰原散热站（故障机器人）', dock_house: '暗港小屋', dock_pier: '暗港码头', forbidden_library: '禁书库（亡灵契约师，末地）',
  ironclad_camp: '铁甲军团营地（铁甲战士）', ironclad_ruin: '铁甲军团营地遗迹（铁甲战士）', jungle_tribe: '丛林部落（静默猎手）', kaiser_crab_cave: '帝王蟹洞', kin_village: '同族村落',
  lighthouse: '灯塔', man_sized_holes: '人形坑洞', mycelium_shrine: '盘根冥想室', necrobinder_giant: '巨人遗骸（亡灵契约师）', overgrowth_camp: '密林营地',
  overgrowth_ruin_pile: '密林遗迹堆', regent_crater: '陨石坑（储君）', regent_starship: '坠落的飞碟（储君）', ruin_pile: '遗迹堆', sailboat: '帆船', sand_pit: '流沙坑（无厌沙虫）',
  scrap_pile: '废弃机械堆', sea_ruins: '海底遗迹', silent_gathering: '猎人的聚集地（静默猎手，红树林）', sunken_statue: '沉没雕像', web_nest: '盘丝巢穴', wellspring: '泉源', wood_carvings: '木雕',
};
const BIOME_ZH = {
  beach_docks: '暗港海滩', egg_hive_caves: '虫卵巢穴洞穴', hive_caves: '巢穴洞穴', ink_spring_caves: '墨泉洞穴', misty_overgrowth: '雾密林', mushroom_overgrowth: '蘑菇密林',
  overgrowth: '密林', polluted_sea: '污染海域', sparse_hive_caves: '稀疏巢穴洞穴', stone_forest_docks: '石林暗港', waterfalls: '瀑布',
};
const structures = fs.readdirSync(path.join(D, 'worldgen/structure')).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)).sort();
const biomes = fs.readdirSync(path.join(GEN, 'worldgen/biome')).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)).sort();
const where = id => { try { return require(path.join(D, 'tags/worldgen/biome/has_structure', id + '.json')).values.join('、').replace(/minecraft:|spirecraft:/g, ''); } catch { return ''; } };
const kind = id => { const j = require(path.join(D, 'worldgen/structure', id + '.json')); return j.type === 'spirecraft:carved' ? 'carved' : j.type === 'spirecraft:cave_template' ? 'template' : 'jigsaw'; };
const templates = id => { const j = require(path.join(D, 'worldgen/structure', id + '.json')); return j.templates ? j.templates.map(t => t.replace('spirecraft:', '')) : []; };
let md = `# 测试指令 Commands

由 \`tools/gen_commands_doc.js\` 根据模组数据生成（${structures.length} 个结构、${biomes.length} 个群系）。新增或删除结构、群系后重新运行即可，列表里不会有已删除的内容。

在游戏里需要作弊权限（创造模式世界或 \`/op\`）。

## 结构 Structures

- \`/locate structure <id>\`：找最近的一座（稀有结构可能要等十几秒到几分钟）。
- \`/place structure <id>\`：在脚下按正常规则生成一座（地形不合适时会失败，例如营地要平地、陨石坑要干燥平地）。
- \`/place template <模板>\`：不管地形，直接把模板放在脚下（只适用于“模板”类结构；“雕刻”类是直接挖地形，没有模板）。

| 结构 | 中文名 | 群系 | 类型 | locate |
|---|---|---|---|---|
${structures.map(id => `| \`spirecraft:${id}\` | ${ZH[id] || ''} | ${where(id)} | ${{ carved: '雕刻', template: '模板', jigsaw: '拼图' }[kind(id)]} | \`/locate structure spirecraft:${id}\` |`).join('\n')}

### 模板（/place template）

${structures.filter(id => templates(id).length).map(id => `- ${ZH[id] || id}：${templates(id).map(t => `\`/place template spirecraft:${t}\``).join('、')}`).join('\n')}

## 群系 Biomes

| 群系 | 中文名 | locate |
|---|---|---|
${biomes.map(b => `| \`spirecraft:${b}\` | ${BIOME_ZH[b] || ''} | \`/locate biome spirecraft:${b}\` |`).join('\n')}

## 开发用

- 自测：\`powershell -File tools/selftest.ps1\`（开一个测试世界跑全部自动检查，日志里 \`[SelfTest] DONE\`）。
- 截图：\`powershell -File tools/shots.ps1 <脚本>\`（见 \`dev/ClientShots.java\` 的脚本命令），图片在 \`run/screenshots/\`。
- 重新生成结构模板与战利品表：\`node tools/structures/build.js\`；重新生成本文件：\`node tools/gen_commands_doc.js\`。
`;
fs.writeFileSync(path.join(ROOT, 'docs/COMMANDS.md'), md);
console.log('docs/COMMANDS.md:', structures.length, 'structures,', biomes.length, 'biomes');
