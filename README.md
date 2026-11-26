# SpireCraft

[![SpireCraft CI](https://github.com/MockingJam/SpireCraft/actions/workflows/ci.yml/badge.svg)](https://github.com/MockingJam/SpireCraft/actions/workflows/ci.yml)

以《杀戮尖塔2》（Slay the Spire 2，下称 STS2）为题材的 Minecraft Forge 模组：把 STS2 的群系、怪物、Boss、遗物、药水、状态效果和五位角色的武器与建筑，按 Minecraft 原版的玩法和数值融进主世界、下界和末地。

> 非官方同人作品，与 Mega Crit 无关。

*English summary: a Forge 1.21.10 mod that brings Slay the Spire 2's biomes, monsters, bosses, relics, potions, status effects and character weapons into a regular Minecraft world. Work in progress; the first release is the "adventure" mode only.*

| 项目 | 值 |
|---|---|
| Minecraft | 1.21.10 |
| Forge | 60.1.0（兼容范围 `[60.1.0,61)`） |
| Java | 21 |
| 模组 ID / 包名 | `spirecraft` / `com.mockingjam.spirecraft` |
| 版本 | 0.1.0（开发中，尚未发布） |

## 第一版范围

2026-11-18 定下的第一版范围（见 [docs/PLAN.md](docs/PLAN.md)）：**只做冒险模式**，也就是在原版世界里扩展内容，新世界开档即可玩。

第一版**不做**：

- 爬塔模式（独立的尖塔岛屿、节点地图、逐层挑战）
- STS2 新角色“愚者”及其机制
- 恐怖模式

项目的几条总原则：

- 数值按原版同级内容平衡，STS2 只提供效果的形态。
- 尽量复用原版方块、物品和机制。
- 用 STS2 官方简体中文名。
- 生物用原版 Java 实体模型加程序动画，不依赖 GeckoLib。
- 遗物放在随身的遗物袋里才生效。Forge 1.21 没有 Curios，所以不依赖饰品栏。

## 内容一览

以下数量来自代码和已提交的资源，统计于 `main` @ `bcebfbf`。

| 类别 | 数量 | 说明 |
|---|---|---|
| 群系 | 11 | 地表 7 个：石林暗港、沙滩暗港、污染海域、瀑布、密林、迷雾密林、蘑菇密林。洞穴 4 个：墨泉洞穴、巢穴洞穴、稀疏巢穴洞穴、虫卵巢穴洞穴。原版黑森林在新世界里会被换成密林 |
| 生物 | 102 | 普通怪 72、精英 14、Boss 13，另有 3 种非敌对生物：奥斯提（亡灵契约师的随从）、商人、犀角甲虫（可驯服的坐骑） |
| 结构 | 50 | 各群系的营地、遗迹、村落、码头、灯塔、巢穴等；五位角色的建筑 9 处；荣耀（Glory）建筑 13 处，分布在主世界、下界和末地 |
| 状态效果 | 28 | 力量、敏捷、缓冲、人工制品、荆棘、虚弱、易伤、脆弱、中毒、灾厄、无实体，以及三种充能球、荣耀的诅咒类效果等 |
| 药水 | 21 个注册 | 约 14 种基础药水及其延长版、强化版，走原版酿造台；喷溅、滞留、药箭都能用 |
| 遗物 | 14 件 + 遗物袋 | STS2 共 315 件，其余的分拣见 [relics_triage.md](docs/design/relics_triage.md) |
| 武器 | 28 件 | 铁甲战士 6、静默猎手 6、储君 5、亡灵契约师 5、故障机器人 6，多数带右键技能 |
| 材料与装备 | 4 种矿石 | 黑钨矿（主世界）、奥利哈钢矿（深层）、硫磺矿（下界）、熔岩石；钨合金和奥利哈钢两套盔甲，一套奥利哈钢工具；星系尘埃、橙色团块、核心晶体等 |
| 食物 | 5 种 | 草莓、梨、芒果（第一次吃会永久提高生命上限）、带骨肉、紫水晶茄子 |
| 方块 | 约 183 种 | 各群系的木材和石材套件（台阶、楼梯、墙、门等）、植物、矿石和材料方块、功能方块 |
| NPC | 1 种 | 商人：类似原版流浪商人，会随机来访 |

各幕生物：

| 区域 | 普通 | 精英 | Boss |
|---|---|---|---|
| 密林 Overgrowth | 21 | 3 | 3：仪式兽、墨影幻灵、同族神官 |
| 暗港 Underdocks | 16 | 3 | 3：灵魂异鱼、瀑布巨兽、乐加维林族母 |
| 巢穴 Hive | 18 | 3 | 3：帝王蟹、知识恶魔、无厌沙虫 |
| 荣耀 Glory | 17 | 5 | 4：女王、火炬头融合体、实验体（下界）、永世沙漏（末地） |

完整的设计和实现记录在 [docs/design/](docs/design/)。

## 安装与游玩

1. 安装 Forge 1.21.10（60.1.0 或更高的 60.x 版本），把 `spirecraft-0.1.0.jar` 放进游戏目录的 `mods/` 文件夹。
   - 开发版的 jar 可以在 [CI 的运行记录](https://github.com/MockingJam/SpireCraft/actions/workflows/ci.yml) 里，从对应运行的 **Artifacts** 下载（保留 14 天）。
   - 也可以自己构建，见下一节。
2. **新建一个世界，世界类型选“默认”。**
   - 群系和结构只会出现在新生成的区块里，旧世界里已经生成的区域不会变。
   - 模组覆盖的是默认世界类型（`minecraft:normal`）。“巨型生物群系”和“放大化”世界里没有本模组的群系，也就没有绑定这些群系的结构和怪物。
   - 如果另一个模组也修改默认世界类型，两者会互相覆盖。
3. **找内容**：所有物品都在创造模式的 8 个“尖塔工艺”物品栏里。生存模式下，可以用 `/locate biome spirecraft:<id>` 和 `/locate structure spirecraft:<id>` 找群系和建筑（需要作弊权限），全部 id 见 [docs/COMMANDS.md](docs/COMMANDS.md)。
4. **遗物**：
   - 遗物袋的配方是收纳袋放中间，上下左右各放一个金锭。
   - 遗物放进背包或副手里的遗物袋才生效，同名遗物只算一件。
   - 遗物来自宝箱、精英（有几率掉落）和 Boss（必掉）。
5. **Boss**：
   - 前三幕的 Boss 大多用召唤物在对应的群系里召唤：仪式之铃（仪式兽）、乌羽笔（墨影幻灵）、同族神像（同族神官）、灵魂异鱼饵（灵魂异鱼）、蒸汽汽笛（瀑布巨兽）、安眠号角（乐加维林族母）、流沙诱饵（无厌沙虫，在沙漠用）。
   - 知识恶魔要在盘根冥想室中央的虫尸上献一本书；帝王蟹住在巢穴洞穴深处的帝王蟹洞里。
   - 荣耀的 Boss 沉睡在各自的建筑里，玩家走进房间就会醒来，门会关上，打完才开。

## 从源码构建

需要 **JDK 21**。第一次构建要联网，下载 Gradle 8.12.1 和 Forge 工具链。

### 一键脚本（Windows，Lazypack 目录布局）

根目录的三个 `.bat` 来自 Forge 1.21.10 懒人包模板。它们要求本仓库旁边有一个同级的 `Forge1.21.10-Lazypack` 目录，放 JDK 和 Gradle 缓存：

```text
<父目录>/
├── Forge1.21.10-Lazypack/
│   ├── runtime/<JDK 21 目录>/
│   └── .gradle_repo/          Gradle 缓存（构建时自动填充）
└── SpireCraft/                本仓库
```

| 脚本 | 作用 |
|---|---|
| `1.双击构建环境.bat` | `gradlew build`，第一次运行时下载依赖 |
| `2.双击启动游戏.bat` | `gradlew runClient`，启动开发客户端，工作目录是 `run/`。**第一次运行会先删除 `build/` 目录** |
| `3.双击打包模组.bat` | `gradlew build -x test`，成功后打开 `build/libs/` |

### 命令行

有别的 JDK 21 也可以直接用 Gradle，不需要 `runtime/`：

```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.x.x-hotspot"   # 换成你的 JDK 21 路径
.\gradlew.bat build --no-daemon -g ..\Forge1.21.10-Lazypack\.gradle_repo
```

- 产物是 `build/libs/spirecraft-0.1.0.jar`。
- Gradle 缓存已经下载好以后，可以加 `--offline`。
- **在 git worktree 里**（或任何不跟 `Forge1.21.10-Lazypack` 同级的目录里）构建时，`-g` 要写**绝对路径**。`gradle.properties` 用相对路径设置了 `gradle.user.home=../Forge1.21.10-Lazypack/.gradle_repo`，在 worktree 里这个路径会指向一个不存在的位置，Gradle 会新建一个空缓存，然后报“找不到 `net.minecraftforge.gradle` 插件”。
- `gradle.properties` 关闭了 ForgeGradle 的证书校验（`net.minecraftforge.gradle.check.certs=false`），这是为了绕开某个开发网络上的证书问题。
- Gradle Wrapper 默认从腾讯云镜像下载。在海外可以临时把 `gradle/wrapper/gradle-wrapper.properties` 里的地址换成 `services.gradle.org`（CI 就是这么做的），但不要提交这个改动。

Linux / WSL 需要另装 Linux 版的 JDK 21（Windows 版的 JDK 不能给 Linux 的 `gradlew` 用），然后执行 `sh ./gradlew build`。

### 其他 Gradle 任务

| 任务 | 用途 |
|---|---|
| `runClient` | 开发客户端，工作目录 `run/` |
| `runServer` | 专用服务端（`--nogui`）。环境变量 `SPIRECRAFT_RUN_DIR` 可以改工作目录 |
| `runData` | 重新生成 `src/generated/resources`：语言文件、模型、配方、战利品表、标签、群系和世界预设。生成结果要一起提交 |

### CI

`.github/workflows/ci.yml` 在向 `main` 提交 PR 或推送时运行，两个任务并行：

- 检查所有已提交的 JSON 和 `.mcmeta` 能否解析；
- 构建模组 jar，并作为 Artifact 上传，保留 14 天。

CI 不会运行游戏，也不检查 `src/generated` 是否和 datagen 一致。

## 开发工具

`tools/` 下的脚本用 Node.js（`.js`/`.mjs`）或 PowerShell 7（`.ps1`）运行。常用的入口：

| 命令 | 作用 |
|---|---|
| `node tools/mobs/build_mobs.js` | 根据 `tools/mobs/specs*.js` 生成生物模型 `client/model/MobLayers.java` 和实体贴图，**不要手改这些生成结果** |
| `node tools/structures/build.js` | 生成结构 NBT 模板和战利品表，写入 `src/main/resources` |
| `node tools/gen_commands_doc.js` | 根据模组数据重新生成 [docs/COMMANDS.md](docs/COMMANDS.md) |
| `pwsh tools/selftest.ps1` | 用 `runServer` 在临时目录里运行 `dev/SelfTest`（环境变量 `SPIRECRAFT_SELFTEST=1`） |
| `pwsh tools/shots.ps1 <脚本>` | 用 `runClient` 按脚本自动截图（`dev/ClientShots`，环境变量 `SPIRECRAFT_SHOTS`），输出到 `run/screenshots/` |

**生成文件不要手改**，改生成它们的源头，然后重新运行：

| 文件 | 由谁生成 |
|---|---|
| `src/generated/resources/**` | `runData`（源码在 `datagen/`） |
| `client/model/MobLayers.java`、`textures/entity/*.png` | `tools/mobs/build_mobs.js` |
| `src/main/resources/data/spirecraft/structure/**`（NBT 模板），以及同目录下 `worldgen/structure`、`worldgen/structure_set`、`worldgen/template_pool`、`tags/worldgen/biome/has_structure`、`loot_table/chests` 里的 JSON | `tools/structures/build.js` |
| `docs/COMMANDS.md` | `tools/gen_commands_doc.js` |

其他说明：

- 两个 `.ps1` 也写死了 Lazypack 里的 JDK 路径。
- 贴图类脚本（`biome_v*_textures.js`、`weapon_*.js` 等）有多个历史版本，部分要用到本机解压的原版资源和不入库的参考图（`art/refs/`），目前不能保证在别的机器上复现。
- 新开的 worktree 第一次运行 `runClient` 前，要先关掉 `run/options.txt` 里的首次启动引导界面，否则客户端会停在标题界面，`ClientShots` 不会开始。

## 目录结构

```text
src/main/java/com/mockingjam/spirecraft/
  effect/  relic/  item/  alchemy/      状态效果、遗物、材料与食物、药水
  weapon/  weapon/projectile/           角色武器、技能、充能球、投射物
  mob/                                  怪物、精英、Boss（ScriptedDefs 数据驱动 + 手写类）、商人
  worldgen/  datagen/                   群系、地物、结构；数据生成（含世界预设）
  registry/  block/  fluid/  network/   注册与创造栏、方块、墨水流体、网络包
  client/                               渲染、动画、迷雾（client/model/MobLayers.java 是生成文件）
  dev/                                  开发辅助：SelfTest、ClientShots（只有设置了环境变量才运行）
src/main/resources/                     贴图、结构 NBT 模板、数据包、mods.toml（部分由 tools/ 脚本生成，见下）
src/generated/resources/                runData 的输出（已提交，打进 jar，不要手改）
tools/                                  模型、贴图、结构、文档的生成脚本，以及自测和截图脚本
art/                                    Blockbench 工程和历次贴图预览
docs/                                   设计与开发文档（中文）
```

## 文档

| 文档 | 内容 |
|---|---|
| [docs/PLAN.md](docs/PLAN.md) | 开发计划、总原则、各阶段进度、第一版范围 |
| [docs/design/](docs/design/) | 内容设计表：[效果](docs/design/effects.md)、[材料](docs/design/materials.md)、[药水与食物](docs/design/consumables.md)、[遗物](docs/design/relics.md)（及[分拣表](docs/design/relics_triage.md)）、[武器](docs/design/weapons.md)、[群系 v2](docs/design/biomes_v2.md)、[生物](docs/design/mobs.md)、[结构](docs/design/structures.md)、[荣耀](docs/design/glory.md)、[世界观](docs/design/lore.md)、[贴图风格](docs/design/art_style.md) |
| [docs/COMMANDS.md](docs/COMMANDS.md) | 全部结构和群系的 `/locate`、`/place` 命令（由脚本生成） |
| [docs/MODELING.md](docs/MODELING.md) | 生物建模规范 |
| [docs/REVIEW-2026-11-27.md](docs/REVIEW-2026-11-27.md) | 阶段性代码 Review：已知问题、文档矛盾、待 owner 拍板的问题 |
| [docs/ARCHITECT.md](docs/ARCHITECT.md) | 最早的策划案。其中的爬塔模式、Curios 饰品栏等已被 PLAN.md 取代，**以 PLAN.md 为准** |
| [docs/HANDOFF.md](docs/HANDOFF.md)、[docs/design/biomes.md](docs/design/biomes.md) | 历史记录：2026-11-18 的交接和群系 v1，已过期 |

## 参与开发

- **issue**：按批次组织，标题前缀如 `[第一批][内容]`、`[第三批][美术]`、`[怪物建模 N/9]`。机制换算的总表在 [#26](https://github.com/MockingJam/SpireCraft/issues/26)。
- **分支和 PR**：一个 issue 一个分支，分支名形如 `structures/36-regent-crater`、`relics/11-triage`、`fix/elite-relic-drops`。PR 标题写成“中文主题（#issue 号）”，合并到 `main`。
- **先设计，再写代码**：新内容先在 `docs/design/` 的对应文档里登记名称、出处、效果、配方和获取方式，再实现。
- **datagen 优先**：模型、语言、配方、战利品表、标签都在 `datagen/` 里写，然后运行 `runData` 并提交 `src/generated`，不要手改生成的 JSON。
- **命名**：注册名用英文小写加下划线，尽量取 STS2 英文原名；中文名用官方译名，自创内容在设计表里注明“自创”。
- **美术**：16×16 原版风格像素画，规则见 [art_style.md](docs/design/art_style.md)。生物外形以 STS2 原画为准，按 [MODELING.md](docs/MODELING.md) 和 `art_style.md` 的生物模型一节建模。
- **风格**：古代欧式奇幻，不出现现代元素。

## 许可与致谢

- **许可证还没定**：`mods.toml` 目前声明的是 All Rights Reserved。根目录的 `LICENSE.txt`、`CREDITS.txt`、`changelog.txt` 是 Forge MDK 模板自带的文件，不是本模组的授权或更新记录，等项目所有者确定许可证后再替换。
- 《杀戮尖塔2》及其角色、名称归 Mega Crit 所有；Minecraft 归 Mojang Studios / Microsoft 所有。本模组的贴图按 STS2 的形象重新绘制为像素风，部分方块贴图由原版贴图重新着色生成。
- 资料来源：[Slay the Spire Wiki](https://slaythespire.wiki.gg/)、[灰机 wiki](https://sts2.huijiwiki.com/)。
