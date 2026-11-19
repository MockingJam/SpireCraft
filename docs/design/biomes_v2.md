# 群系 v2（用户要求重排群系）

> 用户原话要点：群系改为 **石林暗港、沙滩暗港、污染海域、瀑布、墨泉洞穴、密林、迷雾密林、蘑菇密林、巢穴洞穴、稀疏巢穴洞穴、虫卵巢穴洞穴、流沙洞**；巢穴类全部是洞穴，不在地表；流沙洞在沙漠地下。
> 本文档是实现前的设计，确认后再动手（同阶段 7 的流程）。只影响**新建的世界**。

## 一、群系总表与放置

地表群系仍用阶段 7 的方法：datagen 读取原版 `OverworldBiomeBuilder` 的气候参数点，从宿主群系切一条交给我们的群系，再覆盖 `minecraft:normal` 世界预设。
**洞穴群系**用原版洞穴群系（繁茂洞穴、溶洞、深暗之域）同样的办法：参数点的 `depth` 取地下区间（约 0.2–0.9），这样只在地下出现、不会出现在地表。

| 注册名 | 中文名 | 类型 | 宿主（从哪里切） | 一句话 |
|---|---|---|---|---|
| `stone_forest_docks` | 石林暗港 | 地表 | 沼泽/红树林近海部分（原 `underdocks`） | 大小藤壶岩石锥林立、水坑、污染水 |
| `beach_docks` | 沙滩暗港 | 地表 | 海滩最湿部分（原 `sunken_wharf`） | 沙地上倒伏的腐木、枯灌木、芦苇、石堆、污染水 |
| `polluted_sea` | 污染海域 | 地表（海洋） | 温水/普通海洋靠近暗港一侧的一部分 | 被污染的珊瑚礁、污染海草和海带、污染水 |
| `waterfalls` | 瀑布 | 地表 | 繁茂的山地/风袭森林的高处一部分 | 陡崖上大量水源泉涌出形成瀑布，苔藓岩 |
| `ink_spring_caves` | 墨泉洞穴 | 洞穴 | 主世界地下（类似溶洞，偏湿处） | 墨泉（黑色流体池）、墨泡方块 |
| `overgrowth` | 密林 | 地表 | 丛林的一部分（原密林） | 高大弯曲的盘根木形成穹顶，地势平坦，蘑菇/草/发光灌木 |
| `misty_overgrowth` | 迷雾密林 | 地表 | 密林切片中更湿的一部分（原 `fog_hollow` 改名） | 同密林 + 浓雾，能见度低 |
| `mushroom_overgrowth` | 蘑菇密林 | 地表 | 密林切片中另一部分 | 同密林 + 巨型蘑菇，蘑菇比例高 |
| `hive_caves` | 巢穴洞穴 | 洞穴 | 热带草原/恶地下方的地下 | 巢岩墙壁，巢块堆（空心/实心），刷怪笼、巢穴储藏块 |
| `sparse_hive_caves` | 稀疏巢穴洞穴 | 洞穴 | 巢穴洞穴边缘 | 巢块少，长特殊蘑菇 |
| `egg_hive_caves` | 虫卵巢穴洞穴 | 洞穴 | 巢穴洞穴内部一部分 | 巢块 + 遍地直飞产卵虫（Ovicopter）的硬壳虫卵 |
| `quicksand_caves` | 流沙洞 | 洞穴 | **沙漠**下方的地下 | 砂岩洞壁、流沙方块 |

旧群系 `hive`、`hive_pits`（地表巢穴、千孔原）**删除**——巢穴改到地下。旧 ID `underdocks`/`sunken_wharf`/`fog_hollow` 改名为上表的新 ID（反正只对新世界生效）。

## 二、各群系细节

### 1. 暗港两种（石林暗港 / 沙滩暗港）+ 污染海域：共用“污染水”
- **污染水**：不新做流体（成本高、与原版水交互复杂），而是**按群系判定**：玩家/生物站在这三个群系的水里时获得 **虚弱 I（6 秒，持续刷新）**；群系水色为暗紫灰、水雾更浓，看起来就是脏水。原版水的所有功能保持不变。
- **石林暗港**：
  - 大型石锥：3–12 格高的藤壶岩尖柱（上下都有，像原版溶洞的大型滴水石柱）；小型石锥：现有的藤壶岩柱方块（`barnacle_spire`，可叠）成簇生成；
  - 地面泥 + 淤泥斑块，散布 2–4 格的浅水坑。
- **沙滩暗港**：
  - 地表沙子 + 沙砾斑块；
  - **腐木**（新木材套，替代潮木的“枯树”角色，深灰褐、带霉斑）：立着的枯树桩、**倒伏的腐木**（横放 3–6 格原木，上面长苔藓/蘑菇）；
  - **枯灌木**（新，比原版枯萎的灌木更大、带腐木色）；**芦苇**（新，两格高，长在水边/浅水里）；
  - **石堆**：原版圆石 + 安山岩 + 凝灰岩 + 苔石混合的小乱石堆（不新做石头，复用原版，符合“复用原版”原则）；
  - 腐木**没有树苗、不会自然长出**，但可以合成：原版任意原木 ×4 + 腐肉 → 腐木原木 ×4（“泡烂了的木头”）。
- **污染海域**：
  - **污染珊瑚**（新，3 种：管状/扇状/块状，偏紫褐灰，像半死的珊瑚）组成礁；**污染海草**、**污染海带**（原版海草/海带的污染配色版本，行为同原版）；
  - 后续阶段把暗港生物（腐尸蛞蝓、污泥纺工等）放进来。

### 2. 瀑布
- 从山地高处切出；地表苔藓块 + 石头 + 少量盘根木；
- 地物：大量“崖壁泉眼”（原版 `spring_water` 地物的高密度版本，只在陡峭处）→ 形成多条瀑布；瀑布底部积水潭；水边蕨丛和苔藓地毯。

### 3. 墨泉洞穴
- **墨泉**：洞底的黑色“墨”池。实现为新流体太重，改为**墨块池**：不可流动的“墨泉方块”（像细雪：可以陷进去，进入获得失明 2 秒并减速；桶可舀起变“墨桶”，可倒出）——如果你希望墨泉像水一样流动，请说明，我改为真正的新流体（工作量大很多）。
- **墨泡**（新方块）：贴在墨泉附近的岩壁/地面，黑紫色半透明气泡；一碰就破（实体碰撞、被攻击都会破）。破裂时：**40% 掉落“墨泡”物品**（可投掷，命中目标施加失明 + 虚弱，类似墨刀的效果）；**10% 冒出一只“墨宝”**（STS2 密林怪物 Inklet，第二批生物里补做模型和 AI；在它做好之前暂时只掉落物品）。
- 洞壁：深灰黑色石头 + 原版深板岩，墨泉周围是**墨染石**（新，石材套）。

### 4. 密林 / 迷雾密林 / 蘑菇密林（共用一套地物）
- **地势平坦**：只从宿主群系“侵蚀度高（平地）”的参数点切片，避免山坡（无法 100% 保证，原版地形噪声仍可能有小起伏；我会只取最平的侵蚀区间）。
- **高大弯曲的盘根木**：高度与黑橡树相当（2×2 粗干，高 10–16 格），树干中段弯折（`bending_trunk_placer` 风格的自写树干放置器），大而扁的冠层（`dark_oak` 冠层加宽），**大量垂下的萤光藤与原版藤蔓**；生成密度高，冠层相连形成“穹顶”，林下偏暗。
- 地面：草、蕨丛、**多种蘑菇**、**发光灌木**等发光植物：
  - 新蘑菇 4 种（都不像原版蘑菇）：**灯笼菇**（黄色、伞盖下发光，亮度 8）、**珊瑚菇**（橙红色、分叉的珊瑚状）、**层孔菇**（长在树干侧面的半圆层叠菌）、**蓝铃菇**（细长柄、铃铛形蓝色伞，成簇）。原有的雾菇保留。
  - **发光灌木**（新，低矮灌木，夜间点点萤光，亮度 10）；**萤苔**地毯（新，发微光的苔藓地毯，亮度 4）。
- **迷雾密林**：在密林基础上加**浓雾**：客户端在该群系中把雾的起止距离拉近到约 12–28 格（像原版下界的雾感），雾色青灰；白天也很暗。
- **蘑菇密林**：密林地物 + 巨型蘑菇（巨型雾菇 + 新的**巨型灯笼菇**），地面植物里蘑菇占一半以上；树稍稀，让出空间给巨型蘑菇。

### 5. 巢穴洞穴三种 + 流沙洞（全部地下）
- **巢岩**（新，石材套：巢岩、磨制巢岩、巢岩砖）：琥珀褐色、蜂窝状孔洞的岩石，作为巢穴洞穴的洞壁（替换洞穴里的石头/深板岩）。
- **巢块堆**：用现有的蜂蜡六角砖、甲壳、眼甲壳和新的**巢块**（`hive_comb`，蜂巢状的琥珀色块）堆成的土丘/靠墙的堆。每个堆 50% 空心：
  - 空心内部：60% 一个**刷怪笼**（暂时刷原版蠹虫/洞穴蜘蛛，第三批巢穴生物做好后改为巢穴怪物），40% 一个**巢穴储藏块**（新，像可疑的沙子一样不能用刷子，**直接打破**即掉落一份战利品：骨头、蜂蜜、金粒、废料、偶尔遗物/药水）；
- **稀疏巢穴洞穴**：巢块堆数量约为普通的 1/4；地面长**巢菇**（新，只在这里生成的特殊蘑菇：淡黄色、带甲壳纹的蘑菇，可作酿造材料）。
- **虫卵巢穴洞穴**：普通数量的巢块堆 + 地面/墙角遍布**硬壳虫卵**（现有的虫卵方块升级为 STS2 的 Tough Egg：1–4 个一组；后续 Ovicopter 生物做好后可孵化）。
- **流沙洞**：只在沙漠正下方；洞壁砂岩/沙子；**流沙**方块（新）：像细雪一样会让实体缓慢下陷、移动极慢，完全陷进去会窒息受伤；流沙池分布在洞底；地表沙漠不受影响。

## 三、新方块 / 物品清单（估算）

| 类别 | 内容 | 数量 |
|---|---|---|
| 木材 | 腐木全套（无树苗、无树叶；含倒伏原木用的横向原木） | 约 13 |
| 石材 | 墨染石套、巢岩/磨制巢岩/巢岩砖套 | 约 16 |
| 植物 | 芦苇、腐枯灌木、污染珊瑚 ×3（+ 珊瑚扇/块）、污染海草、污染海带、4 种新蘑菇（+ 灯笼菇方块/巨型用菌柄）、发光灌木、萤苔地毯、巢菇 | 约 20 |
| 功能方块 | 墨泉方块、墨泡、巢块、巢穴储藏块、流沙；硬壳虫卵（替换旧虫卵） | 6 |
| 物品 | 墨泡（投掷物）、墨桶 | 2 |
| 删除 | 旧地表巢穴的蜂蜡土地表用途（方块保留作装饰）、千孔原竖洞地物 | — |

贴图：按项目像素风规则（`docs/design/art_style.md` + spirecraft-pixel-art 技能），能从原版改的从原版改（腐木←深色橡木/云杉、巢岩←凝灰岩/蜜脾、流沙←沙子+细雪、污染珊瑚←原版死珊瑚+配色、芦苇←甘蔗/高草），新蘑菇按描述手绘。

## 四、实现顺序（确认后）

1. 群系框架：12 个群系注册 + 预设切片（含洞穴 depth 切片与沙漠下方的流沙洞），删除旧巢穴地表群系；自测 `/locate biome` 能找到全部 12 个。
2. 暗港三群系：腐木、芦苇、枯灌木、石堆、大小石锥、水坑、污染珊瑚/海草/海带、污染水虚弱效果。
3. 密林三群系：弯曲高树与穹顶、新蘑菇与发光植物、巨型灯笼菇、迷雾。
4. 洞穴：墨泉洞穴（墨泉、墨泡）、巢穴三种（巢岩、巢块堆、刷怪笼、储藏块、巢菇、硬壳虫卵）、流沙洞（流沙）。
5. 瀑布。
6. 贴图、语言、配方、标签、自测与客户端检查；更新 PLAN.md 与生物刷新表（第一批生物改到新群系：密林三种刷密林怪，雾菇人主要在迷雾/蘑菇密林）。

## 五、用户确认（2026-11-15）

- 迷雾密林**不要很暗**，白色浓雾即可（白天正常亮度，只是雾近、雾色偏白）。
- 暗港总体色调**偏蓝黑**（天空、雾、水、腐木、石头都往蓝黑靠）。
- 沙滩暗港**不用沙子**，地表用淤泥（+ 泥、少量沙砾）。
- 墨泉做成**真正的流体**，流动规律参考岩浆（流得慢、扩散距离短）。
- 巨型蘑菇可以**新发明几种**。
- 其余按设计：墨宝 = Inklet；污染水按群系判定；刷怪笼暂用原版蠹虫/洞穴蜘蛛。

## 六、（原）需要确认的点

1. **“墨宝”我理解为 STS2 密林怪物 Inklet**（墨泡破裂时有概率冒出来）。如果“墨宝”指的是别的东西（例如一种掉落物/宝物），请告诉我。
2. **墨泉**按“不流动的墨池方块（可舀起）”来做，还是要做成会流动的新流体？
3. **污染水**按“在这三个群系的水里就会虚弱”来做（不新做流体），可以吗？
4. 刷怪笼在巢穴生物做好前先刷原版蠹虫/洞穴蜘蛛，可以吗？

## 七、实现记录（v2 第一版）

- 代码：`worldgen/ModBiomes`（12 个群系、`polluted_water` 群系标签）、`worldgen/V2Features`（石锥、水坑、倒伏腐木、腐木桩、石堆、污染珊瑚礁、芦苇、高大弯曲盘根木、三种新巨型蘑菇、洞穴岩石替换、墨池、巢块堆、流沙池、崖壁泉眼）、`worldgen/BiomeEffects`（污染水虚弱、墨的失明+缓慢）、`client/BiomeFog`（迷雾密林白雾）、`fluid/ModFluids`（墨：刻速 30、扩散 2、每格降 2 级，同岩浆）、`block/`（SpirePlantBlock、ShelfFungusBlock、HarbourPlants、QuicksandBlock、InkBubbleBlock）。
- 放置（`datagen/WorldPresetProvider`）：地表切片——沼泽/红树林近海→石林暗港，海滩最湿→沙滩暗港，普通/温水海洋最湿→污染海域，风袭森林/风袭丘陵最湿→瀑布，丛林最湿→密林（其中侵蚀度最低、最多山的部分还给丛林，保持平坦），密林怪异度两端→迷雾密林/蘑菇密林，竹林最湿→迷雾密林；洞穴——溶洞的一部分→墨泉洞穴，沙漠下方→流沙洞，热带草原/高原/恶地下方→巢穴洞穴（其怪异度两端→稀疏/虫卵巢穴洞穴）。自测在新世界中能 `locate` 到全部 12 个群系。
- 新巨型蘑菇：巨型灯笼菇（细白柄 + 发光的黄色钟形菌盖，下方中空）、巨型珊瑚菇（短干分出 3–4 根斜枝，枝头一簇橙色菌盖）、巨型蓝铃菇（高柄顶端弯折，挂一只下垂的蓝色铃铛，常 2–3 株一起），加原有的巨型雾菇。
- 贴图：`node tools/biome_v2_textures.js <原版 client-extra 解压目录> [预览.png]`。
- 未做/后续：墨宝（Inklet）生物；巢穴刷怪笼目前刷洞穴蜘蛛/蠹虫；污染海域的暗港生物。

## 八、第二版修订（2026-11-15，用户反馈） / Revision 2

- **巢穴洞穴 Hive caves**：蜂巢块按 3D 噪声成大块 / 不均匀条带（横向拉伸），内部挖出弯曲通道和穴室，部分穴室放刷怪笼（洞穴蜘蛛 / 蠹虫）或巢穴储藏。绿色甲壳土堆已移除。洞内所有石头（安山岩、花岗岩、闪长岩、凝灰岩、沙砾、泥土…）统一替换为巢岩（深层替换为深层巢岩）。Comb forms big lumps and bands with tunnels and chambers; every stone type becomes hive rock / deep hive rock; the green mounds are gone.
- **洞穴矿石 Cave ores**：巢穴洞穴和墨泉洞穴里的矿石换成所在石头的变种（巢岩 / 深层巢岩 / 墨染石 / 深层墨石 × 煤、铁、铜、金、红石、青金石、钻石、绿宝石、黑钨、奥利哈钢（仅深层））。掉落、经验、工具等级、熔炼都与原版矿石一致。Ores in these caves become variants of their stone; drops, XP, tool tiers and smelting match vanilla.
- **硬壳虫卵 Tough eggs**：像海龟蛋一样每格 1–4 个，浅蓝半透明，不会孵化。Stack 1–4 per block like turtle eggs; pale blue, translucent; never hatch.
- **藤壶岩尖 Barnacle spire**：像滴水石锥那样分 底座 / 中段 / 锥台 / 尖端 四种形态，叠起来自动变形。石林的大石锥只用藤壶岩，不再用磨制石头。Shaped like pointed dripstone (base / middle / frustum / tip). Big spikes use plain barnacle rock, no polished stone.
- **暗港 Underdocks**：石林面积缩小（沼泽 25%、红树林沼泽 15%）；没有活树，只有草本（金黄色芦苇等），保留腐木桩；沙滩暗港地面只用淤泥 / 泥巴，石堆改用深色石头（深板岩圆石、苔石、黑石）。The stone forest is smaller; no living trees, only herbs (golden reeds); dark ground and dark stone piles only.
- **污染海域 Polluted sea**：整片温水海洋（含深海）加普通海洋最湿润的一半，连成大片；海底泥巴 / 淤泥；污染海带密集生成（每区块 48 次尝试），珊瑚礁和海草加倍。Covers whole lukewarm oceans plus half the wettest plain oceans; mud floor; dense kelp; twice the reefs and seagrass.
- **密林 Overgrowth**：不再依附丛林，改由黑森林（大部分）和最湿润的森林切出。树更密（每区块 9 棵）、更矮（8–12 格），树冠更宽（半径 7–8），形成黑森林式的封闭穹顶。地面是草、大片灰化土、苔藓块和苔藓地毯，没有菌丝；菌丝只出现在蘑菇密林。密林原木加了绿色青苔条纹。It now forms from dark forests and the wettest forests, not jungles; trees are denser, lower and wider-crowned for a closed canopy; the ground is grass, big podzol patches, moss blocks and moss carpets. Mycelium only grows in the mushroom overgrowth; logs carry green moss streaks.

## 九、第三版修订（2026-11-15，用户反馈） / Revision 3

- **面积 Sizes**：石林暗港再缩小（沼泽 15%、红树林 10%）；巢穴洞穴和流沙洞只在宿主群系的 40% 下方生成；墨泉洞穴 30%；污染海域减小（温水海洋 65%、普通海洋 30%）；密林增大（黑森林 90%、森林 50%、白桦林 30%）。Stone forest, cave biomes and the polluted sea are smaller; the overgrowth is bigger.
- **巢穴 Hive caves**：蜂巢不再作为墙壁，而是贴在墙上/顶上的几何体巢：圆形巢（直径 7–11）和长条巢（长 13–25），都有空心内部和朝向洞穴的开口，里面有卵，部分有刷怪笼或巢穴储藏。洞穴里不再长树和花。Comb grows as hollow nests stuck to walls and ceilings (round or long), with eggs inside; no more trees or flowers in caves.
- **墨泉洞穴 Ink spring caves**：墙壁恢复原版石头和深板岩；只在墨池周围几格变成墨染石/深层墨石，那里没有矿石（取消墨石矿石变种）。墨池更大（6–12 宽，中间深 3），池底有墨泉喷口：冒泡、冒烟、偶尔喷墨，正上方的生物每秒受 2 点伤害并被托起；墨池其余位置只有缓慢、失明、虚弱，不扣血。洞内有紫黑色雾和飘落的灰烬。墨水更黑。Vanilla walls; dark rock (no ores) only around the bigger ink pools; vents scald, the rest of the ink only slows/blinds/weakens; violet-black haze and ash motes; blacker ink.
- **流沙洞 Quicksand caves**：流沙颜色变浅；新增砂岩矿石变种（任何深度）。Lighter quicksand; sandstone ore variants.
- **石林 Stone forest**：四种石柱（带平台的倾斜高柱、2–3 根的石柱群、蘑菇顶悬垂石柱、矮巨石），轮廓不规则；藤壶岩尖像滴水石锥一样在各个高度生长（顶上、平台上、倒挂在悬垂和平台下面、柱脚）。暗港只用藤壶岩，地表全部是泥巴/暗沙/淤泥（向下 5 格，裸露的石头和沙砾也覆盖），石头只出现在突出的石柱和巨石上。芦苇改为草绿色、更密的“井”字模型，成片生长。Four pillar shapes; spires at every height incl. hanging; barnacle rock only; ground of mud/dark sand/sludge; green reeds in dense beds.
- **污染海域 Polluted sea**：海底遗迹的石砖/砂岩/圆石换成深板岩对应方块。Ocean ruins rebuilt in deepslate.
- **瀑布 Waterfalls**：在山坡/悬崖上开出 1–3 格宽的泉眼，水沿坡面落下，落点有小水潭。Visible springs pour down slopes into plunge pools.
- **密林 Overgrowth**：苔藓地毯只铺在地面方块上（不在草上、不在树叶上）；树脚周围成堆长高草和大型蕨；地面植物不再生成在树冠上。Moss carpets only on ground blocks; tall grass and ferns crowd around tree feet.
- **蘑菇 Mushrooms**：灯笼菇、珊瑚菇、蓝铃菇可用骨粉催熟成巨型蘑菇（40% 成功率，同原版）；巢菇骨粉后在周围蔓延。Bone meal grows the giant caps; the hive shroom spreads.

## 十、第四版修订（2026-11-15，用户反馈） / Revision 4

- **洞穴岩石纹理 Cave rock textures**：巢岩、深层巢岩重画为大条纹（波浪状地层）加大斑块，不再在原版石头上点缀小像素和亮点；藤壶岩为大斑块底色加 4 个均匀分布的大藤壶。Drawn from scratch with broad wavy strata and big patches; four big, evenly spaced barnacles.
- **卵 Eggs**：必须放在实心方块上（之前补丁会把卵放在半空）；颜色加深，没有斑点。Eggs need solid ground; deeper blue, no spots.
- **盾牌 Shields**：肉盾正反面都是金色金属；引雷针护盾是半透明黄色同心圆环。Tank Shield is gold; Lightning Rod is translucent yellow rings.
- **墨泉洞穴 Ink caves**：去掉了让环境变红的雾和灰烬；只在墨泉喷口上方飘一点白烟。No haze; a little white smoke above the vents.
- **迷雾密林 Misty overgrowth**：雾变淡（6–64 格）。Lighter mist.
- **密林 Overgrowth**：所有黑森林都变成密林（林地府邸只在黑森林/苍白之园生成，所以密林旁边不会有府邸）。Every dark forest becomes overgrowth.
- **瀑布 Waterfalls**：两种——垂直瀑布（悬崖上开泉眼直落，背后山体有小洞穴）和阶梯瀑布（坡上一级级石头围成的小水池，每级有缺口让水流到下一级）；底部都有石头围成的水池（池底沙砾/沙子/黏土，长海草），池边长蕨、草、甘蔗和兰花。Vertical and stepped waterfalls, both ending in stone-rimmed pools with plants.
- **巨型巢菇 Giant hive shroom**：蘑菇巢穴（稀疏巢穴）里生成巨型巢菇；巢菇用骨粉可长成巨型巢菇。Giant hive shrooms grow in the sparse hive caves and from bone meal.
- **石林 Stone forest**：所有石锥都是上小下大（去掉蘑菇顶石柱和倒挂岩尖），藤壶岩尖朝上随机生成在石头各处。Every cone tapers upward; spires point up at random spots.

## 十一、第五版修订（2026-11-15，用户反馈） / Revision 5

- **石林 Stone forest**：石柱逐层生成时，每一格必须下方也有石头，所以任何部分都不会比下面宽；去掉了平台。新增**港岩**（和藤壶岩纹理相近、没有藤壶，含楼梯/台阶/墙），石柱和石堆主要用港岩，藤壶岩只做点缀（水线附近最多）。藤壶改为 3 个带六片壳板、壳缝和口盖的大藤壶。No layer is wider than the one below; new Harbour Rock is the main stone, barnacle rock only patches (most at the waterline); detailed barnacles.
- **巢穴 Hive caves**：墙壁是巢岩加大片巢土（原来的波浪条纹改得更紧密、层次更多，用在巢土上；巢岩重新画成同风格但更像石头的厚岩层）。巢土上长更多巢菇。巢里放蜂蜜块和巢穴储藏，不再放卵；卵成堆（6–16 个）产在地面上，另有零散的卵。Walls of hive rock and big hive-soil patches; more hive shrooms; nests hold honey and caches; eggs lie in clutches and singly.
- **阶梯瀑布 Stepped falls**：只选较缓的坡；一串形状不规则、彼此相接的水池，每级低 1–3 格，水直接溢到下一级；池底沙砾/沙子/黏土加海草，最底下的水池最大。Gentler slopes; a continuous chain of irregular pools, the bottom one biggest.
- **暗港水域 Harbour water**：海草和海带全部是污染品种（替换掉原版的，并在暗港里生成污染海草/海带）。Seagrass and kelp are polluted.
- **墨泉洞穴 Ink caves**：墨染石和深层墨石重画为被墨烧裂的暗色岩石（大斑块加带焦边的裂缝）；墨泡只长在墨石上，颜色全黑带白色高光；喷口是一个纯黑的洞。Burnt, cracked ink stone; bubbles only on it, black with white highlights; the vent is a black hole.
- **盾牌 Shields**：引雷针护盾去掉握把，加上从中心伸出的金色针；肉盾握把改小。Lightning Rod: no grip, a gold needle; smaller Tank Shield grip.
- **密林 Overgrowth**：再扩大（森林 80%、白桦林 60%），接近一片红树林沼泽的大小。Bigger again.

## 十二、第六版修订 / Revision 6 (textures)

- 港岩、藤壶岩、巢岩、深层巢岩、巢土、墨石的过渡改为渐变：色调先连续计算再柔化，颜色在色阶之间插值，并保留细微颗粒，不再有生硬的色块边界。Graded transitions: tones are softened and colours blended between ramp steps, with a fine grain.
- 墨染石/深层墨石的裂纹改用原版裂纹（裂纹石砖 / 裂纹深板岩砖与完整砖的差异），裂纹保持清晰，旁边一圈焦边。Ink stone cracks are vanilla's cracked-brick cracks, kept crisp, with a scorched lip.
- 藤壶中心保持一个黑色圆形口。Each barnacle keeps a round black mouth.

## 十三、第七版修订 / Revision 7

- **墨泉 Ink pools**：墨染石/深层墨石不再有裂纹；只有紧贴墨水的池壁和池底（约 60%）变成新的**裂纹墨石**——均匀细小的热裂纹网（细线、带一点受热的亮边、偶有断口）。墨泡也可长在裂纹墨石上；墨泡全黑。Only the rock touching the ink cracks (new Cracked Ink Stone, fine even heat-crazing); bubbles all black.
- **巢岩 Hive rock**：在波浪岩层上用明暗做出块状感：每层分成几块，每块亮度略不同，上/左边缘受光、下/右边缘阴影，不加表面斑点。Blocky feel from light and shadow only.
- **港岩 Harbour rock**：叠加原版安山岩的明暗颗粒（颜色保持不变），不再过于光滑；藤壶岩底色同样处理。Andesite-like grain, same colours.
- **暗港海草 Harbour seagrass**：只生成在水里（原版海草方块本身不检查水）。Seagrass only in water.
- **瀑布 Waterfalls**：池边石头必须下方两格内有地面并向下补实，否则不放；泉眼两侧不再往崖面上贴石头。No floating or hanging stones.
- **流沙洞 Quicksand caves**：只在沙漠下方的 20% 处生成。Fewer, under deserts only.
- **蘑菇巢穴 Mushroom hives**：新增蘑菇林（巢土地面上铺满巢菇，中间 2–4 个巨型巢菇）；巨型巢菇有四种形态：宽平顶、细高小圆顶、钟形、小簇。Shroom groves; giant hive shrooms in four forms.

## 十四、第八版修订 / Revision 8

- **藤壶 Barnacles**：改为贴在石头表面的薄层方块（类似发光地衣），在港岩石柱上成片生长（水线附近最多）；用锄头挖掉掉落骨粉，精准采集才能得到藤壶本身。石柱不再生成藤壶岩。Barnacles are a layer block on rock faces; hoe → bone meal, silk touch → barnacles.
- **巢菌土 Hive Mycelium**：蘑菇巢穴中露天的巢土长出淡色菌丝；蘑菇林地面也是巢菌土；巢菇可以长在上面。Mycelium-covered hive soil in the mushroom hives.
- **污染珊瑚 Polluted coral**：成簇生成（每处 3–6 块），簇之间有空地，总体更少。Coral in clusters, fewer overall.
- **芦苇 Reeds**：仍然成片，但片数减半；颜色改为黄绿色。Fewer reed beds; yellow-green.
- **引雷针护盾 Lightning Rod**：手持时周围冒电火花，格挡时更多。Electric sparks around it.

## 十五、第九版修订 / Revision 9 (textures)

- 墨染石、深层墨石、裂纹墨石、喷口颜色稍微调浅。Ink rocks a little lighter.
- 裂纹墨石的裂缝重画：三条长裂缝各自保持一个主方向、平缓弯曲并偶有折角，可跨到相邻方块；中段可加宽到两格、两端收细，并分出几条细支裂。Long, thin, bending cracks with kinks, uneven width and fine branches.
- 巢菌土：底层是地衣般的大片浅色斑，上面是密集分叉的细菌丝；侧面顶部一圈绒毛，向下垂出根须状菌丝（参考地衣和盘根泥土，但不照抄）。Denser mycelium: lichen-like patches under a mat of fine branching threads; rootlet threads on the side.

## 十六、第十版修订 / Revision 10 (textures)

- 墨染石、深层墨石、裂纹墨石、喷口改为“块状石头”风格：九块圆润的石块（可平铺的泰森多边形），每块深浅不同，左上受光、右下阴影，石块之间有暗缝（类似圆石但不照抄）。裂纹墨石在每块石头上各有一条细而略弯的裂纹，从缝到缝，分布均匀。Ink rocks are chunky rounded stones with dark seams; the cracked kind has one thin bent crack per stone, evenly spread.
- 巢菌土：去掉大片浅色覆盖，只在巢土上画出一根根 1 像素的菌丝（会分叉，交叉处略亮），土壤底色保持可见；侧面顶边一圈菌丝和几条下垂的根须。Mycelium is distinct single threads over visible soil.

## 十七、第十一版修订 / Revision 11

- 巢菌土顶面改为整面白偏黄的细密颗粒纹理（参照原版菌丝/草方块顶面的颗粒，重新着色），侧面是原版菌丝侧面的垂边纹样改色后叠在巢土上。Hive mycelium top: an all-over cream-white grain like vanilla mycelium; side: vanilla's fringe, recoloured, over hive soil.
- 巢菌土只在蘑菇周围成片出现：每株巢菇和巨型巢菇周围半径 2–3 的地面（巢土/巢岩，露天的）变成巢菌土，边缘参差；不再铺满蘑菇巢穴的所有巢土。蘑菇林地面仍是巢菌土。Mycelium only in patches around the mushrooms.
- 墨石的九块石头改为随机点经多次松弛（Lloyd）后的布局：大小一致，但横竖都不成排。Ink stones: even sizes, irregular layout (no rows or columns).

## 十八、第十二版修订 / Revision 12 (v3.2)

- **藤壶岩删除**：藤壶只作为覆盖层方块（`barnacles`）长在港岩上；原“磨制藤壶岩”改名为**磨制港岩**。Barnacle rock removed; its polished form is now polished harbour rock.
- **巢穴洞穴变少**：只在热带草原/恶地下方 15% 的气候区生成，密度与繁茂洞穴相近。Hive caves about as common as lush caves (15% slices).
- **芦苇**：每区块 4 次尝试（原来每 2 区块 1 次），但只在 5 格内有水的地方长成片，因此集中在海边/水边。Reeds: more beds, only within 5 blocks of water.
- **流沙洞删除**，改为**地表流沙坑**：沙漠里约每 4 区块一个流沙坑（Forge 群系修改器 `add_desert_quicksand` 加到原版沙漠），只在平地（周围高差 ≤1）生成，不会埋进沙丘里。Quicksand caves removed; flat quicksand pits on the desert surface instead.
- **裂纹墨石**：只有约一半石块有裂纹，裂纹只比石头暗两档、比石缝浅（对比度降低）。Fewer, softer cracks on cracked ink stone.

## 十九、第十三版修订 / Revision 13 (v3.3)

- 删除潮汐木全套和藤壶岩尖（石林里不再长藤壶岩尖）。Tidewood and barnacle spires removed.
- 港砖：烧过的泥砖（原版泥砖重新着色），港砖物品由压实泥巴烧制。Dock bricks are fired mud bricks.
- 流沙：橙黄色，受重力下落。Quicksand: orange-yellow, falls.
- 瀑布：更大的瀑布和水池，水池一定被石头围住，池底沙砾/沙子/黏土 + 海草，最底部的池子更大更深。Bigger waterfalls; stone-ringed pools.
- 新的巢穴建材：压实巢土、巢土砖、裂纹/錾制巢岩砖、丝结巢土。New hive building blocks.
