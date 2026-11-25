# 测试指令 Commands

由 `tools/gen_commands_doc.js` 根据模组数据生成（38 个结构、11 个群系）。新增或删除结构、群系后重新运行即可，列表里不会有已删除的内容。

在游戏里需要作弊权限（创造模式世界或 `/op`）。

## 结构 Structures

- `/locate structure <id>`：找最近的一座（稀有结构可能要等十几秒到几分钟）。
- `/place structure <id>`：在脚下按正常规则生成一座（地形不合适时会失败，例如营地要平地、陨石坑要干燥平地）。
- `/place template <模板>`：不管地形，直接把模板放在脚下（只适用于“模板”类结构；“雕刻”类是直接挖地形，没有模板）。

| 结构 | 中文名 | 群系 | 类型 | locate |
|---|---|---|---|---|
| `spirecraft:automaton_factory` | 机器人生产厂（故障机器人） | #is_overworld | 模板 | `/locate structure spirecraft:automaton_factory` |
| `spirecraft:beekeeper` | 养蜂人窑洞 | hive_caves、egg_hive_caves | 模板 | `/locate structure spirecraft:beekeeper` |
| `spirecraft:beekeeper_hollow` | 养蜂人树洞 | hive_caves、egg_hive_caves | 雕刻 | `/locate structure spirecraft:beekeeper_hollow` |
| `spirecraft:bowlbug_nest` | 盛碗虫巢 | hive_caves、egg_hive_caves | 模板 | `/locate structure spirecraft:bowlbug_nest` |
| `spirecraft:byrdonis_nest` | 多尼斯异鸟巢 | overgrowth、misty_overgrowth、mushroom_overgrowth | 拼图 | `/locate structure spirecraft:byrdonis_nest` |
| `spirecraft:camp_desert` | 营地（沙漠） | desert | 拼图 | `/locate structure spirecraft:camp_desert` |
| `spirecraft:camp_plains` | 营地（平原） | plains、sunflower_plains、meadow、forest、birch_forest、flower_forest | 拼图 | `/locate structure spirecraft:camp_plains` |
| `spirecraft:camp_savanna` | 营地（稀树草原） | savanna、savanna_plateau、badlands、wooded_badlands | 拼图 | `/locate structure spirecraft:camp_savanna` |
| `spirecraft:camp_snowy` | 营地（雪原） | snowy_plains、snowy_taiga、grove | 拼图 | `/locate structure spirecraft:camp_snowy` |
| `spirecraft:camp_taiga` | 营地（针叶林） | taiga、old_growth_pine_taiga、old_growth_spruce_taiga、windswept_forest | 拼图 | `/locate structure spirecraft:camp_taiga` |
| `spirecraft:ceremonial_ruins` | 仪式遗迹 | overgrowth、misty_overgrowth、mushroom_overgrowth | 拼图 | `/locate structure spirecraft:ceremonial_ruins` |
| `spirecraft:defect_station` | 冰原散热站（故障机器人） | snowy_plains、ice_spikes、snowy_taiga | 模板 | `/locate structure spirecraft:defect_station` |
| `spirecraft:dock_house` | 暗港小屋 | stone_forest_docks、beach_docks | 拼图 | `/locate structure spirecraft:dock_house` |
| `spirecraft:dock_pier` | 暗港码头 | stone_forest_docks、beach_docks | 模板 | `/locate structure spirecraft:dock_pier` |
| `spirecraft:forbidden_library` | 禁书库（亡灵契约师，末地） | end_highlands、end_midlands | 模板 | `/locate structure spirecraft:forbidden_library` |
| `spirecraft:ironclad_camp` | 铁甲军团营地（铁甲战士） | badlands、eroded_badlands、wooded_badlands、savanna、savanna_plateau | 模板 | `/locate structure spirecraft:ironclad_camp` |
| `spirecraft:ironclad_ruin` | 铁甲军团营地遗迹（铁甲战士） | badlands、eroded_badlands、wooded_badlands、savanna、savanna_plateau、windswept_savanna | 模板 | `/locate structure spirecraft:ironclad_ruin` |
| `spirecraft:jungle_tribe` | 丛林部落（静默猎手） | jungle、bamboo_jungle | 模板 | `/locate structure spirecraft:jungle_tribe` |
| `spirecraft:kaiser_crab_cave` | 帝王蟹洞 | hive_caves、egg_hive_caves、sparse_hive_caves | 雕刻 | `/locate structure spirecraft:kaiser_crab_cave` |
| `spirecraft:kin_village` | 同族村落 | overgrowth、mushroom_overgrowth | 拼图 | `/locate structure spirecraft:kin_village` |
| `spirecraft:lighthouse` | 灯塔 | stone_forest_docks、beach_docks | 拼图 | `/locate structure spirecraft:lighthouse` |
| `spirecraft:man_sized_holes` | 人形坑洞 | hive_caves、egg_hive_caves、sparse_hive_caves | 模板 | `/locate structure spirecraft:man_sized_holes` |
| `spirecraft:mycelium_shrine` | 盘根冥想室 | sparse_hive_caves、hive_caves | 雕刻 | `/locate structure spirecraft:mycelium_shrine` |
| `spirecraft:necrobinder_giant` | 巨人遗骸（亡灵契约师） | pale_garden、old_growth_spruce_taiga、old_growth_pine_taiga | 模板 | `/locate structure spirecraft:necrobinder_giant` |
| `spirecraft:overgrowth_camp` | 密林营地 | overgrowth、misty_overgrowth、mushroom_overgrowth | 拼图 | `/locate structure spirecraft:overgrowth_camp` |
| `spirecraft:overgrowth_ruin_pile` | 密林遗迹堆 | overgrowth、misty_overgrowth、mushroom_overgrowth | 拼图 | `/locate structure spirecraft:overgrowth_ruin_pile` |
| `spirecraft:regent_crater` | 陨石坑（储君） | desert、meadow | 雕刻 | `/locate structure spirecraft:regent_crater` |
| `spirecraft:regent_starship` | 坠落的飞碟（储君） | plains | 模板 | `/locate structure spirecraft:regent_starship` |
| `spirecraft:ruin_pile` | 遗迹堆 | plains、forest、birch_forest、taiga、savanna、desert、meadow | 拼图 | `/locate structure spirecraft:ruin_pile` |
| `spirecraft:sailboat` | 帆船 | polluted_sea | 拼图 | `/locate structure spirecraft:sailboat` |
| `spirecraft:sand_pit` | 流沙坑（无厌沙虫） | desert | 雕刻 | `/locate structure spirecraft:sand_pit` |
| `spirecraft:scrap_pile` | 废弃机械堆 | hive_caves、egg_hive_caves | 模板 | `/locate structure spirecraft:scrap_pile` |
| `spirecraft:sea_ruins` | 海底遗迹 | polluted_sea | 拼图 | `/locate structure spirecraft:sea_ruins` |
| `spirecraft:silent_gathering` | 猎人的聚集地（静默猎手，红树林） | mangrove_swamp | 模板 | `/locate structure spirecraft:silent_gathering` |
| `spirecraft:sunken_statue` | 沉没雕像 | polluted_sea | 拼图 | `/locate structure spirecraft:sunken_statue` |
| `spirecraft:web_nest` | 盘丝巢穴 | hive_caves、egg_hive_caves、sparse_hive_caves | 雕刻 | `/locate structure spirecraft:web_nest` |
| `spirecraft:wellspring` | 泉源 | overgrowth、misty_overgrowth、mushroom_overgrowth | 拼图 | `/locate structure spirecraft:wellspring` |
| `spirecraft:wood_carvings` | 木雕 | overgrowth、misty_overgrowth、mushroom_overgrowth | 拼图 | `/locate structure spirecraft:wood_carvings` |

### 模板（/place template）

- 机器人生产厂（故障机器人）：`/place template spirecraft:automaton_factory/1`
- 养蜂人窑洞：`/place template spirecraft:hive/beekeeper_1`、`/place template spirecraft:hive/beekeeper_2`
- 盛碗虫巢：`/place template spirecraft:hive/bowlbug_nest_1`、`/place template spirecraft:hive/bowlbug_nest_2`、`/place template spirecraft:hive/bowlbug_nest_3`
- 冰原散热站（故障机器人）：`/place template spirecraft:defect_station/1`
- 暗港码头：`/place template spirecraft:dock_pier/1`、`/place template spirecraft:dock_pier/2`、`/place template spirecraft:dock_pier/3`
- 禁书库（亡灵契约师，末地）：`/place template spirecraft:forbidden_library/1`
- 铁甲军团营地（铁甲战士）：`/place template spirecraft:ironclad_camp/1`
- 铁甲军团营地遗迹（铁甲战士）：`/place template spirecraft:ironclad_ruin/1`
- 丛林部落（静默猎手）：`/place template spirecraft:jungle_tribe/1`
- 人形坑洞：`/place template spirecraft:hive/holes_1`、`/place template spirecraft:hive/holes_2`
- 巨人遗骸（亡灵契约师）：`/place template spirecraft:necrobinder_giant/1`
- 坠落的飞碟（储君）：`/place template spirecraft:regent_starship/1`、`/place template spirecraft:regent_starship/2`、`/place template spirecraft:regent_starship/3`
- 废弃机械堆：`/place template spirecraft:hive/scrap_pile_1`、`/place template spirecraft:hive/scrap_pile_2`
- 猎人的聚集地（静默猎手，红树林）：`/place template spirecraft:silent_gathering/1`

## 群系 Biomes

| 群系 | 中文名 | locate |
|---|---|---|
| `spirecraft:beach_docks` | 暗港海滩 | `/locate biome spirecraft:beach_docks` |
| `spirecraft:egg_hive_caves` | 虫卵巢穴洞穴 | `/locate biome spirecraft:egg_hive_caves` |
| `spirecraft:hive_caves` | 巢穴洞穴 | `/locate biome spirecraft:hive_caves` |
| `spirecraft:ink_spring_caves` | 墨泉洞穴 | `/locate biome spirecraft:ink_spring_caves` |
| `spirecraft:misty_overgrowth` | 雾密林 | `/locate biome spirecraft:misty_overgrowth` |
| `spirecraft:mushroom_overgrowth` | 蘑菇密林 | `/locate biome spirecraft:mushroom_overgrowth` |
| `spirecraft:overgrowth` | 密林 | `/locate biome spirecraft:overgrowth` |
| `spirecraft:polluted_sea` | 污染海域 | `/locate biome spirecraft:polluted_sea` |
| `spirecraft:sparse_hive_caves` | 稀疏巢穴洞穴 | `/locate biome spirecraft:sparse_hive_caves` |
| `spirecraft:stone_forest_docks` | 石林暗港 | `/locate biome spirecraft:stone_forest_docks` |
| `spirecraft:waterfalls` | 瀑布 | `/locate biome spirecraft:waterfalls` |

## 开发用

- 自测：`powershell -File tools/selftest.ps1`（开一个测试世界跑全部自动检查，日志里 `[SelfTest] DONE`）。
- 截图：`powershell -File tools/shots.ps1 <脚本>`（见 `dev/ClientShots.java` 的脚本命令），图片在 `run/screenshots/`。
- 重新生成结构模板与战利品表：`node tools/structures/build.js`；重新生成本文件：`node tools/gen_commands_doc.js`。
