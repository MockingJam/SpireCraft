# 遗物（阶段 5）

> 资料：slaythespire.wiki.gg 的 STS2 遗物列表（Slay_the_Spire_2:Relics_List，2026-10-28 版，共 298 件）。
> 数值不照搬 STS2，而是按 Minecraft 原版平衡：1 点 STS 格挡 ≈ 原版的伤害吸收；STS“回合”在 MC 里没有对应，统一换算成“战斗”或秒数。

## 携带方式：遗物袋

- **遗物袋**（relic_pouch）：原版收纳袋的变种。合成：收纳袋居中，上下左右各一个金锭。
- 右键打开，9 格，只能放遗物，同名遗物只能放一件。
- **遗物只有放在遗物袋里、遗物袋在背包里（含副手）时才生效**；背包里有多个遗物袋时，同名遗物只算一次。
- 打开时，手里的遗物袋被锁住，不能拿起或用数字键换走。

## 战斗的定义

- 玩家**攻击敌对生物**（原版 Enemy：僵尸、骷髅、苦力怕……）或其他玩家，或**被它们攻击**，就算处在战斗中。
- **战斗开始**：距离上一次战斗动作已超过 10 秒，又发生了战斗动作。STS2 的“战斗开始时”效果在此触发。
- **战斗结束**：10 秒内没有任何战斗动作。STS2 的“战斗结束时”效果在此触发。

## 第一批遗物（13 件）

| 注册名 | 中文名 | 稀有度 | STS2 原效果 | Minecraft 效果 |
|---|---|---|---|---|
| burning_blood | 燃烧之血 | 初始（铁甲战士） | 战斗结束时回复 6 生命 | 战斗结束时，若这场战斗击杀过敌对生物，回复 4 生命（2❤） |
| anchor | 锚 | 普通 | 战斗开始时获得 10 格挡 | 战斗开始时获得 4 点伤害吸收（原版伤害吸收 I，持续 15 秒） |
| vajra | 金刚杵 | 普通 | 战斗开始时获得 1 力量 | 战斗开始时 +1 层力量（30 秒，可与其他来源叠加） |
| oddly_smooth_stone | 意外光滑的石头 | 普通 | 战斗开始时获得 1 敏捷 | 战斗开始时 +1 层敏捷（30 秒） |
| bag_of_marbles | 弹珠袋 | 普通 | 战斗开始时给所有敌人 1 层易伤 | 战斗开始时，8 格内的敌对生物获得易伤（6 秒） |
| red_mask | 红面具 | 普通 | 战斗开始时给所有敌人 1 层虚弱 | 战斗开始时，8 格内的敌对生物获得虚弱（6 秒） |
| bronze_scales | 铜质鳞片 | 普通 | 战斗开始时获得 3 荆棘 | 战斗开始时 +1 层荆棘（30 秒；每被近战击中反弹 1 点） |
| blood_vial | 小血瓶 | 普通 | 战斗开始时回复 2 生命 | 战斗开始时回复 2 生命（1❤） |
| red_skull | 红头骨 | 普通（铁甲战士） | 生命 ≤50% 时 +3 力量 | 生命 ≤50% 时攻击 +2 力量（不占药水效果栏） |
| pen_nib | 钢笔尖 | 罕见 | 每打出第 10 张攻击牌伤害翻倍 | 每第 10 次攻击（近战或弹射物）伤害翻倍；计数跨战斗保留 |
| mercury_hourglass | 水银沙漏 | 罕见 | 回合开始时对所有敌人造成 3 伤害 | 战斗中每 3 秒对 6 格内所有敌对生物造成 1 点魔法伤害 |
| shuriken | 手里剑 | 稀有 | 一回合内每打出 3 张攻击牌获得 1 力量 | 3 秒内连续攻击 3 次：+1 层力量（30 秒，最多 3 层） |
| lizard_tail | 蜥蜴尾巴 | 稀有 | 将要死亡时回复至 50% 生命（一次） | 受到致命伤害时改为回复至 50% 生命上限；之后需要 1 个游戏日（20 分钟）重新长出来。原版不死图腾优先结算 |
| tungsten_rod | 钨合金棍 | 稀有 | 失去生命时少失去 1 点 | 每次失去生命少 1 点（已实现；现在需要放进遗物袋） |

## 获取

| 来源 | 遗物池 | 每个箱子的概率 |
|---|---|---|
| 地牢、废弃矿井、沙漠神殿、丛林神庙、沉船宝箱、埋藏的宝藏、废弃传送门 | 普通（不含红头骨） | 12% |
| 要塞走廊/图书馆、掠夺者前哨站、林地府邸 | 罕见 | 10% |
| 下界要塞 | 燃烧之血、红头骨（铁甲战士主题：火与血） | 15% |
| 堡垒遗迹（普通箱） | 罕见 + 红头骨 | 10% |
| 远古城市、末地城、堡垒遗迹宝藏室 | 稀有（不含钨合金棍） | 8% |
| 钨合金棍 | 合成（见 materials.md） | — |

## 合成配方

普通/罕见遗物可以用讲得通“来历”的原版材料合成，成本约等于一件钻石工具；稀有的手里剑、蜥蜴尾巴只能从宝箱获得。

| 遗物 | 配方 | 理由 |
|---|---|---|
| 锚 | 铁锭 ×4 + 铁块 + 线 ×2（锚形） | 铁锚 + 缠绕的绳子 |
| 金刚杵 | 金锭 ×4 围绕避雷针 | 金刚杵即“雷电杵” |
| 意外光滑的石头 | 平滑石头 ×8 + 蜜脾 | 打蜡抛光 |
| 铜质鳞片 | 铜锭 ×3 + 犰狳鳞甲 ×3 | 金属鳞片 |
| 水银沙漏 | 铜锭 ×6 + 玻璃 ×2 + 时钟 | 计时器 |
| 弹珠袋 | 皮革 + 线 + 绿色染色玻璃 ×3（无序） | 布袋装玻璃珠 |
| 红面具 | 皮革 ×2 + 红色染料 ×2 + 线（无序） | |
| 小血瓶 | 玻璃瓶 + 闪烁的西瓜片 + 绯红菌 + 蜜脾（无序） | 治疗药水原料 + “血”色菌 + 蜡封 |
| 红头骨 | 骷髅头颅 + 红色染料 ×2 + 烈焰粉（无序） | 铁甲战士的火与血 |
| 钢笔尖 | 金锭 ×2 + 墨囊 + 羽毛（无序） | 金笔尖 + 墨水 + 羽毛笔 |
| 燃烧之血 | 小血瓶 + 烈焰粉 + 岩浆膏（无序） | 把血点燃：由小血瓶升级而来 |

## 已知限制 / 后续

- 遗物袋界面沿用原版单行箱子的界面；客户端可能短暂显示放入了非遗物物品，服务端会立即纠正。
- 后续批次：铁甲战士/静默猎手/储君/亡灵契约师/故障机器人的初始与专属遗物、Boss 遗物（先古之民）、商店遗物（阶段 10 NPC 交易）。

## 遗物合成改为锻造（2026-11-18）/ Relics are forged now

用户：遗物比较稀有，不应在工作台随手合成。现在可合成的遗物都在**锻造台**上锻造：模板是新物品**遗物残片**（只有精英 30% 掉落、Boss 掉 2–3 个），底料是遗物“长出来”的原版物品，添加物是讲故事的材料。手里剑、蜥蜴尾巴仍然只能从宝箱获得。

| 遗物 | 底料 | 添加物 |
|---|---|---|
| 锚 | 铁块 | 铁链 |
| 金刚杵 | 避雷针 | 金块 |
| 意外光滑的石头 | 平滑石 | 蜜脾 |
| 铜质鳞片 | 犰狳鳞甲 | 铜块 |
| 水银沙漏 | 时钟 | 下界石英 |
| 弹珠袋 | 收纳袋 | 绿色玻璃 |
| 红面具 | 皮革帽子 | 红色染料 |
| 小血瓶 | 玻璃瓶 | 闪烁的西瓜片 |
| 红头骨 | 骷髅头颅 | 烈焰粉 |
| 钢笔尖 | 羽毛 | 金锭 |
| 燃烧之血 | 小血瓶 | 岩浆膏 |

其他补充的配方：5 个 Boss 召唤道具；破裂核心水晶块、破裂墨石（熔炼）；巢脾（2 蜜脾 + 2 巢土 → 2）；巢蜜储藏（巢脾 + 蜂蜜瓶）；巢菌毯（2 巢菌土 → 3）；萤光苔毯（2 苔藓地毯 + 发光浆果 → 2）；自动机合金的锈蚀（合金块 + 水桶 → 锈蚀 → 废弃）；墨泡（黏液球 + 墨囊 → 2）。矿石、原木、植物、珊瑚、结构专属方块与原版一样不需要配方。

## 第二批遗物设计稿（#11，35 件，2026-11-20）

> 范围：[relics_triage.md](relics_triage.md) 里标 🟢 的 35 件，都能用现有钩子（战斗开始/结束、受伤、攻击、击杀、致命伤、战斗中定时）和已有效果实现。**这是设计稿，还没实现，数值待试玩调整。** 中文名取自游戏的简体中文本地化（`SlayTheSpire2.pck` 里的 `localization/zhs/relics.json`）。
>
> 换算沿用第一批：STS2 的 1 回合 ≈ 战斗中 3 秒；格挡 ÷2.5 ≈ 伤害吸收点数（锚 10 → 4）；伤害和治疗大约 ÷3（水银沙漏 3 → 1，燃烧之血 6 → 4）；“第 N 回合开始”= 战斗开始后 3×(N−1) 秒。
> 下文的“伤害吸收 N 点”都持续 15 秒（同锚），“+N 力量/敏捷”都持续 30 秒（同金刚杵），除非另有说明。“敌对生物”和第一批一样指原版 Enemy。

### 效果

| 注册名 | 暂定中文名 | 稀有度 | STS2 原效果 | Minecraft 效果 |
|---|---|---|---|---|
| black_blood | 黑暗之血 | 初始（铁甲战士） | 战斗结束回 12 生命 | 战斗结束时，若这场战斗击杀过敌对生物，回复 8 生命（4❤）。和燃烧之血同时在袋里时只算黑暗之血 |
| festive_popper | 节日拉炮 | 普通 | 战斗开始对所有敌人造成 9 伤害 | 战斗开始时，8 格内的敌对生物各受 3 点伤害（烟花粒子和音效，不破坏方块，不伤友方） |
| strike_dummy | 打击木偶 | 普通 | 名字带“打击”的牌 +3 伤害 | 用“打击”类武器近战时 +1 伤害：王之剑 `regent_strike`、刀 `cleaver` 和原版各种剑（新物品标签 `spirecraft:strikes`） |
| akabeko | 赤牛 | 罕见 | 战斗开始获得 8 活力（下一次攻击加伤） | 每场战斗的第一次攻击 +3 伤害 |
| horn_cleat | 船夹板 | 罕见 | 第 2 回合开始获得 14 格挡 | 战斗开始 3 秒后获得 6 点伤害吸收 |
| kusarigama | 锁镰 | 罕见 | 一回合打 3 张攻击，对随机敌人造成 6 伤害 | 3 秒内连续攻击 3 次时，对 6 格内随机一个敌对生物造成 2 点伤害（计数方式同手里剑） |
| miniature_cannon | 微型大炮 | 罕见 | 升级过的攻击牌 +3 伤害 | 弹射物攻击（弓、弩、三叉戟、模组投掷武器）+1 伤害。“升级过的牌”在 MC 没有对应，取“炮”的主题；附魔武器加伤留给神秘打火机 |
| ornamental_fan | 精致折扇 | 罕见 | 一回合打 3 张攻击，获得 4 格挡 | 3 秒内连续攻击 3 次时获得 2 点伤害吸收，可叠加，最多 6 点 |
| parrying_shield | 招架盾 | 罕见 | 回合结束格挡 ≥10 时，对随机敌人造成 6 伤害 | 战斗中每 3 秒检查一次：伤害吸收 ≥4 点时，对 6 格内随机一个敌对生物造成 2 点伤害 |
| ripple_basin | 波纹水盆 | 罕见 | 回合内没打攻击时获得 4 格挡 | 战斗中连续 3 秒没有攻击，获得 2 点伤害吸收，最多 6 点 |
| sparkling_rouge | 闪亮口红 | 罕见 | 第 3 回合开始 +1 力量 +1 敏捷 | 战斗开始 6 秒后 +1 力量 +1 敏捷 |
| paper_phrog | 纸蛙 | 罕见（铁甲战士） | 易伤敌人多受 75% 而不是 50% | 你攻击带易伤的敌人时，易伤倍率从 ×1.5 提到 ×1.75（只对你自己的攻击生效） |
| self_forming_clay | 自成型黏土 | 罕见（铁甲战士） | 失去生命时，下回合获得 3 格挡 | 每次失去生命，3 秒后获得 1 点伤害吸收，最多 4 点 |
| twisted_funnel | 扭曲漏斗 | 罕见（静默猎手） | 战斗开始给所有敌人 4 层中毒 | 战斗开始时，8 格内的敌对生物获得 2 层中毒（模组的中毒效果） |
| beating_remnant | 律动残余 | 稀有 | 一回合内最多失去 20 生命 | 任意 3 秒内最多失去生命上限的 25%（默认 5 点），超出的部分抵消。在护甲和伤害吸收之后结算；虚空、`/kill` 不受影响 |
| captains_wheel | 舵盘 | 稀有 | 第 3 回合开始获得 18 格挡 | 战斗开始 6 秒后获得 8 点伤害吸收 |
| kunai | 苦无 | 稀有 | 一回合打 3 张攻击 +1 敏捷 | 3 秒内连续攻击 3 次：+1 敏捷，最多 3 层（同手里剑，给的是敏捷） |
| stone_calendar | 历石 | 稀有 | 第 7 回合结束对所有敌人造成 52 伤害 | 一场战斗持续满 21 秒时，对 8 格内所有敌对生物造成 10 点伤害，每场战斗一次 |
| demon_tongue | 恶魔之舌 | 稀有（铁甲战士） | 每回合首次在自己回合失去生命时，回复等量生命 | 失去生命时回复等量生命（最多 4 点），之后 10 秒内不再触发 |
| paper_krane | 纸鹤 | 稀有（静默猎手） | 虚弱敌人伤害 −40% 而不是 −25% | 带虚弱的敌人对你造成的伤害从 ×0.75 降到 ×0.6（只对你生效） |
| belt_buckle | 腰带扣 | 商店 | 身上没有药水时 +2 敏捷 | 背包里没有任何药水（含喷溅、滞留、模组药水）时 +2 敏捷，常驻，不占效果栏（做法同红头骨） |
| mystic_lighter | 神秘打火机 | 商店 | 附魔过的攻击牌 +9 伤害 | 用附魔过的武器攻击时 +1 伤害，并点燃目标 2 秒。MC 武器大多有附魔，所以只给 +1 |
| daughter_of_the_wind | 风的女儿 | 事件 | 打出攻击时获得 1 格挡 | 每次攻击命中获得 1 点伤害吸收，最多 4 点；每秒最多触发一次 |
| mr_struggles | 抱抱先生 | 事件 | 回合开始对所有敌人造成等于回合数的伤害 | 战斗中每 3 秒对 6 格内所有敌对生物造成伤害：开始时 1 点，每过 15 秒 +1，最多 3 点 |
| mighty_wings | 强悍翅膀 | 事件 | 单次攻击伤害 ≥30 时 +2 力量 | 单次攻击造成 ≥10 点伤害时 +2 力量，最多 4 层 |
| royal_poison | 王室猛毒 | 事件 | 战斗开始失去 4 生命 | 战斗开始失去 2 生命。负面遗物：放进遗物袋后取不出来，要付绿宝石请商人“移除服务”拿掉；和玉之剑放在同一个箱子里，作为它的代价（见获取） |
| sword_of_jade | 玉之剑 | 事件 | 战斗开始 +3 力量 | 战斗开始 +2 力量 |
| bath_towel | 浴巾 | 事件 | 战斗开始回 8 生命 | 战斗开始回 3 生命 |
| the_boot | 发条靴 | 事件 | 未被格挡的攻击伤害 ≤4 时提高到 5 | 你的攻击伤害低于 3 点时提高到 3 点（受无敌帧限制，连点不会无限叠） |
| wongo_badge | 旺购客户感恩徽章 | 事件 | 没有效果 | 没有效果，纯收藏 |
| wongos_mystery_ticket | 旺购神秘券 | 事件 | 5 场战斗后获得 3 件随机遗物 | 放进遗物袋后完成 5 场战斗，彩票消失，在脚下掉出 3 件随机遗物（普通池 2 件 + 罕见池 1 件） |
| diamond_diadem | 钻石头冠 | 先古 | 战斗开始 20 格挡，第 2 回合不清空 | 战斗开始获得 8 点伤害吸收，持续到战斗结束（最长 60 秒） |
| sai | 钗 | 先古 | 回合开始获得 7 格挡 | 战斗中每 3 秒获得 2 点伤害吸收，最多 4 点 |
| throwing_axe | 投斧 | 先古 | 每场第一张牌打两次 | 每场战斗的第一次攻击伤害翻倍（同钢笔尖的翻倍） |
| circlet | 头环 | 特殊 | 没有效果（遗物池抽空时的占位） | 没有效果，纯收藏 |

### 获取

普通、罕见遗物和第一批一样：宝箱 + 锻造台锻造（模板都是遗物残片）。稀有遗物只能从宝箱、精英和 Boss 拿到，不能锻造。

**加进现有遗物池**（`RelicEvents` 里的列表；精英 50% 掉普通池，Boss 必掉稀有池，也会跟着变）：

| 池 | 现有 | 新增 |
|---|---|---|
| 普通 | 7 件 | 节日拉炮、打击木偶 → 9 件 |
| 罕见 | 2 件 | 赤牛、船夹板、锁镰、微型大炮、精致折扇、招架盾、波纹水盆、闪亮口红 → 10 件 |
| 稀有 | 2 件 | 律动残余、舵盘、苦无、历石 → 6 件 |
| 下界要塞（铁甲战士） | 燃烧之血、红头骨 | 纸蛙、自成型黏土 |
| 堡垒遗迹宝藏室 | 稀有池 | 另加恶魔之舌（单独的池，只在宝藏室） |
| **新：静默猎手**（丛林神庙宝箱，15%，取代丛林神庙原来的普通池） | — | 扭曲漏斗、纸鹤；以后的静默猎手遗物也放这里 |

每个箱子出遗物的总概率不变（代码按池子大小自动算空权重），所以罕见池从 2 件变成 10 件后，单件罕见遗物的概率是原来的 1/5。

**锻造**（遗物残片 + 底料 + 添加物）：

| 遗物 | 底料 | 添加物 | 理由 |
|---|---|---|---|
| 黑暗之血 | 燃烧之血 | 凋零骷髅头颅 | 燃烧之血被凋零染黑：由燃烧之血升级而来 |
| 节日拉炮 | 烟花火箭 | 火药 | 拉炮 |
| 打击木偶 | 盔甲架 | 干草块 | 稻草练习假人 |
| 赤牛 | 红色陶瓦 | 金粒 | 红漆陶牛，金色花纹 |
| 船夹板 | 山羊角 | 铜块 | 船上的铜系缆桩 |
| 锁镰 | 铁锄 | 铁链 | 镰 + 链 |
| 微型大炮 | 发射器 | 铁块 | 小炮 |
| 精致折扇 | 纸 | 竹子 | 竹骨纸扇 |
| 招架盾 | 盾牌 | 铁锭 | 包铁的盾 |
| 波纹水盆 | 炼药锅 | 海晶碎片 | 盛水的盆 |
| 闪亮口红 | 红色染料 | 萤石粉 | 发亮的胭脂 |
| 纸蛙 | 纸 | 睡莲叶 | 折纸青蛙 |
| 自成型黏土 | 黏土块 | 下界疣 | 会长肉的黏土 |
| 扭曲漏斗 | 漏斗 | 发酵蛛眼 | 毒液漏斗 |

**商人**（阶段 9 的商人，用绿宝石）：腰带扣、神秘打火机进商人的遗物货单，价位按罕见算；旺购两件（徽章、彩票）也由商人给——买任意一件遗物时 10% 附赠徽章，彩票单独出售，价格低于罕见遗物。

**模组结构的箱子**（事件遗物；这些战利品表在 `spirecraft` 命名空间，直接写进各自的 `chests/*.json`，不走 `onLootLoad`）：

| 遗物 | 结构 | 概率 | 理由 |
|---|---|---|---|
| 风的女儿 | 灯塔 `lighthouse` | 8% | 海边大风 |
| 抱抱先生 | 遗迹堆 `ruin_pile` | 5% | 对应 STS2 的垃圾堆事件 |
| 强悍翅膀 | 巨鸟巢 `byrdonis_nest` | 10% | 鸟 |
| 玉之剑 + 王室猛毒 | 沉没宝库 `sunken_treasury` | 6% | 王室宝藏，一起出现：拿剑就得背上毒药 |
| 浴巾 | 涌泉 `wellspring` | 8% | 泡澡 |
| 发条靴 | 营地 `camp` | 5% | 旅人落下的发条靴 |

**先古**（暂定，等先古之民 NPC 定下来再改）：钻石头冠、钗、投斧放进新的“先古池”，Boss 除了必掉的稀有遗物外，另有 20% 掉一件先古池遗物。

**头环**：不进任何池，只能 `/give` 或创造模式拿到。低优先级。

### 实现备注

- 新的计时类效果（“战斗开始 N 秒后”、历石、抱抱先生、钗、招架盾、波纹水盆）都放进 `RelicEvents.tick`，在 `Combat` 里记战斗开始时间。
- 连击类（锁镰、精致折扇、苦无）和手里剑共用 `Combat.streak`，要改成每件遗物各自计数，或者在同一个 3 次连击里一起触发。
- 纸蛙、纸鹤改的是 `SpireEffectEvents` 里易伤、虚弱的倍率，需要能按攻击者/受害者带的遗物换倍率。
- 腰带扣的常驻敏捷需要一个和 `extraStrength` 对称的 `extraDexterity` 钩子。
- 王室猛毒“取不出来”要改遗物袋界面；商人的“移除服务”要能移除它。
- 旺购神秘券要在玩家数据里存已完成的战斗数。

## 还没做的遗物（#11，2026-11-20 对照）

> 资料：slaythespire.wiki.gg 的 Slay_the_Spire_2:Relics_List，2026-11-19 版，共 315 件。比开头的 298 件多，是因为 beta 版新增了角色 Fool 和它的遗物。
> 已做 14 件：燃烧之血、锚、金刚杵、意外光滑的石头、弹珠袋、红面具、铜质鳞片、小血瓶、红头骨、钢笔尖、水银沙漏、手里剑、蜥蜴尾巴、钨合金棍。下面是剩下的 301 件，英文名后的括号里是游戏官方简体中文名。
> 每件做之前要先定 MC 效果（挂到 `RelicEvents` 的哪个钩子）和获取途径。抽牌、能量、金币、卡组、药水栏、地图这类效果在 MC 里没有直接对应，要单独换算或跳过。
> 每件的 STS2 效果和设计难度分拣（直接做 / 新机制 / 重新设计 / 已有 / 第一版不做）见 [relics_triage.md](relics_triage.md)。

### 初始（还差 11 / 共 12）

- 铁甲战士：Black Blood（黑暗之血）
- 静默猎手：Ring of the Snake（蛇之戒指）、Ring of the Drake（长蛇戒指）
- 储君：Divine Right（天赋君权）、Divine Destiny（天命所归）
- 亡灵契约师：Bound Phylactery（缚魂命匣）、Phylactery Unbound（无界命匣）
- 故障机器人：Cracked Core（破损核心）、Infused Core（注能核心）
- Fool：Song Bow（歌曲之弓）、Storyteller（说书人）

### 普通（还差 23 / 共 31）

- 通用：Amethyst Aubergine（紫水晶茄子）、Bag of Preparation（准备背包）、Book of Five Rings（五轮书）、Centennial Puzzle（百年积木）、Festive Popper（节日拉炮）、Gorget（护喉甲）、Happy Flower（开心小花）、Juzu Bracelet（佛珠手链）、Lantern（灯笼）、Meal Ticket（餐券）、Pendulum（摆动球）、Potion Belt（药水腰带）、Regal Pillow（皇家枕头）、Strawberry（草莓）、Strike Dummy（打击木偶）、Venerable Tea Set（古茶具套装）、War Paint（战纹涂料）、Whetstone（磨刀石）
- 静默猎手：Snecko Skull（异蛇头骨）
- 储君：Fencing Manual（击剑指南）
- 亡灵契约师：Bone Flute（骨笛）
- 故障机器人：Data Disk（数据磁盘）
- Fool：Exercise Mat（健身垫）

### 罕见（还差 39 / 共 41）

- 通用：Akabeko（赤牛）、Bowler Hat（圆顶礼帽）、Candelabra（烛台）、Eternal Feather（永恒羽毛）、Gremlin Horn（地精之角）、Horn Cleat（船夹板）、Joss Paper（金纸）、Kusarigama（锁镰）、Lasting Candy（吃不完的糖）、Letter Opener（开信刀）、Lucky Fysh（招财异鱼）、Miniature Cannon（微型大炮）、Nunchaku（双截棍）、Orichalcum（奥利哈钢）、Ornamental Fan（精致折扇）、Pantograph（缩放仪）、Parrying Shield（招架盾）、Pear（梨子）、Permafrost（永冻冰晶）、Petrified Toad（石化蟾蜍）、Planisphere（活动星图）、Reptile Trinket（爬行动物饰品）、Ripple Basin（波纹水盆）、Sparkling Rouge（闪亮口红）、Stone Cracker（碎石钻）、Tiny Mailbox（小邮箱）、Tuning Fork（音叉）、Vambrace（臂甲）
- 铁甲战士：Paper Phrog（纸蛙）、Self-Forming Clay（自成型黏土）
- 静默猎手：Tingsha（铜钹）、Twisted Funnel（扭曲漏斗）
- 储君：Galactic Dust（星系尘埃）、Regalite（君王矿石）
- 亡灵契约师：Book Repair Knife（修书小刀）、Funerary Mask（葬礼面具）
- 故障机器人：Gold-Plated Cables（镀金缆线）、Symbiotic Virus（共生病毒）
- Fool：Ocarina（陶笛）

### 稀有（还差 51 / 共 54）

- 通用：Art of War（孙子兵法）、Beating Remnant（律动残余）、Bellows（风箱）、Captain's Wheel（舵盘）、Chandelier（吊灯）、Cloak Clasp（斗篷扣）、Frozen Egg（冻结之蛋）、Gambling Chip（赌博筹码）、Game Piece（棋子）、Girya（壶铃）、Ice Cream（冰淇淋）、Intimidating Helmet（骇人头盔）、Kunai（苦无）、Mango（芒果）、Meat on the Bone（带骨肉）、Molten Egg（熔火之蛋）、Mummified Hand（干瘪之手）、Old Coin（古钱币）、Pocketwatch（怀表）、Prayer Wheel（转经轮）、Rainbow Ring（彩虹戒指）、Razor Tooth（剃刀牙）、Shovel（铲子）、Stone Calendar（历石）、Sturdy Clamp（坚固钳子）、The Courier（送货员）、Toxic Egg（毒素之蛋）、Unceasing Top（不休陀螺）、Unsettling Lamp（不安油灯）、Vexing Puzzlebox（烦人机关盒）、White Beast Statue（白兽雕像）、White Star（白星）
- 铁甲战士：Charon's Ashes（卡戎之灰）、Demon Tongue（恶魔之舌）、Ruined Helmet（损毁头盔）
- 静默猎手：Helical Dart（螺线飞镖）、Paper Krane（纸鹤）、Tough Bandages（结实绷带）
- 储君：Lunar Pastry（月亮糕点）、Mini Regent（迷你储君）、Orange Dough（橙色团块）
- 亡灵契约师：Big Hat（大帽子）、Bookmark（书签）、Ivory Tile（象牙麻将牌）
- 故障机器人：Emotion Chip（情感芯片）、Metronome（节拍器）、Power Cell（能量电池）
- Fool：Conductor's Baton（指挥棒）、Fertilizer（肥料）、Twine（合股线）、Whittling Knife（削木刀）

### 商店（还差 31 / 共 31）

商店遗物的获取途径要等阶段 10 的 NPC 交易。

- 通用：Belt Buckle（腰带扣）、Bread（面包）、Burning Sticks（燃烧木棍）、Cauldron（大锅）、Chemical X（化学物X）、Dingy Rug（肮脏地毯）、Dolly's Mirror（多利之镜）、Dragon Fruit（火龙果）、Ghost Seed（幽灵种子）、Gnarled Hammer（扭曲锤子）、Kifuda（木札）、Lava Lamp（熔岩灯）、Lee's Waffle（李家华夫饼）、Membership Card（会员卡）、Miniature Tent（微型帐篷）、Mystic Lighter（神秘打火机）、Orrery（星系仪）、Punch Dagger（拳刃）、Ringing Triangle（三角铃鼓）、Royal Stamp（王室印章）、Screaming Flagon（尖叫酒壶）、Sling of Courage（勇气投石索）、The Abacus（算盘）、Toolbox（工具箱）、Wing Charm（羽翼护符）
- 铁甲战士：Brimstone（硫磺；注册名会和已有的材料 `brimstone` 撞，需要另起名）
- 静默猎手：Ninja Scroll（忍术卷轴）
- 储君：Vitruvian Minion（维特鲁威仆从）
- 亡灵契约师：Undying Sigil（不死符文）
- 故障机器人：Runic Capacitor（符文电容器）
- Fool：Bizarre Lamp（奇怪的灯）

### 事件（还差 43 / 共 43）

- Byrdpip（异鸟宝宝）、Byrdine（小异鸟）、Pollinous Core（花粉核心）、Bing Bong（宾邦）、Daughter of the Wind（风的女儿）、Mr. Struggles（抱抱先生）、Fresnel Lens（菲涅耳透镜）、Forgotten Soul（遗忘之魂）、Big Mushroom（大蘑菇）、Fragrant Mushroom（芳香蘑菇）、Obsidian Vice（黑曜石钳子）、Thumbscrew（拇指夹）、Tormentous Collar（苦痛项圈）、The Chosen Cheese（天选芝士）、Mighty Wings（强悍翅膀）、Bone Tea（骨茶）、Ember Tea（余烬茶）、Tea of Discourtesy（无礼之茶）、Lost Wisp（迷失鬼火）、Royal Poison（王室猛毒）、Sword of Jade（玉之剑）、Sword of Stone（石之剑）、Bath Robes（浴袍）、Bath Towel（浴巾）、Darkstone Periapt（黑石护符）、Dream Catcher（捕梦网）、Hand Drill（手钻）、Maw Bank（巨口储蓄罐）、The Boot（发条靴）、History Course（历史课）、Wongo Customer Appreciation Badge（旺购客户感恩徽章）、Wongo's Mystery Ticket（旺购神秘券）、Wuppy（瓦皮）
- 带“???”的变种（原遗物的变体）：Anchor???（锚？？？）、Blood Vial???（小血瓶？？？）、Happy Flower???（开心小花？？？）、Lee's Waffle???（李家华夫饼？？？）、Mango???（芒果？？？）、Orichalcum???（奥利哈钢？？？）、Snecko Eye???（异蛇之眼？？？）、Strike Dummy???（打击木偶？？？）、The Merchant's Rug???（商人的地毯？？？）、Venerable Tea Set???（古茶具套装？？？）

### 先古（还差 102 / 共 102）

按给出遗物的先古之民分组。Boss 遗物（先古之民）的获取途径还没定。

- **Neow**（30）：Arcane Scroll（奥术卷轴）、Booming Conch（轰鸣海螺）、Cursed Pearl（诅咒珍珠）、Dowsing Rod（寻龙尺）、Fishing Rod（钓鱼竿）、Golden Pearl（金色珍珠）、Hefty Tablet（沉重石板）、Kaleidoscope（万花筒）、Large Capsule（巨大扭蛋）、Lava Rock（熔岩石）、Lead Paperweight（铅制镇纸）、Leafy Poultice（树叶药膏）、Lost Coffer（失物盒）、Massive Scroll（巨大卷轴）、Neow's Bones（涅奥骨骰）、Neow's Sacrifice（涅奥的牺牲）、Neow's Talisman（涅奥的护符）、Neow's Torment（涅奥的苦痛）、New Leaf（新叶）、Nutritious Oyster（营养牡蛎）、Phial Holster（药瓶皮套）、Pomander（橙型香盒）、Precarious Shears（松动羊毛剪）、Precise Scissors（精准剪刀）、Scroll Boxes（卷轴箱）、Silken Tress（华美发束）、Silver Crucible（白银熔炉）、Small Capsule（小型扭蛋）、Stone Humidifier（石炉加湿器）、Winged Boots（羽翼之靴）
- **Orobas**（10）：Alchemical Coffer（炼金箱）、Archaic Tooth（古老牙齿）、Driftwood（浮木）、Electric Shrymp（放电异虾）、Glass Eye（玻璃眼珠）、Prismatic Gem（棱彩宝石）、Radiant Pearl（发光珍珠）、Sand Castle（沙堡）、Sea Glass（海玻璃）、Touch of Orobas（欧洛巴斯之触）
- **Pael**（10）：Pael's Blood（佩尔之血）、Pael's Claw（佩尔之爪）、Pael's Eye（佩尔之眼）、Pael's Flesh（佩尔之肉）、Pael's Growth（佩尔的增生组织）、Pael's Horn（佩尔之角）、Pael's Legion（佩尔的士兵）、Pael's Tears（佩尔之泪）、Pael's Tooth（佩尔之牙）、Pael's Wing（佩尔之翼）
- **Tezcatara**（10）：Biiig Hug（大～抱抱）、Golden Compass（黄金罗盘）、Nutritious Soup（营养汤）、Pumpkin Candle（南瓜蜡烛）、Seal of Gold（黄金印）、Storybook（故事书）、Toasty Mittens（烘焙手套）、Toy Box（玩具盒）、Very Hot Cocoa（烫嘴可可）、Yummy Cookie（美味饼干）
- **Nonupeipe**（10）：Beautiful Bracelet（华美手镯）、Blessed Antler（赐福鹿角）、Brilliant Scarf（艳丽围巾）、Delicate Frond（娇嫩蕨草）、Diamond Diadem（钻石头冠）、Fur Coat（皮草大衣）、Glitter（亮片）、Jewelry Box（珠宝盒）、Looming Fruit（布质果实）、Signet Ring（图章戒指）
- **Tanx**（10）：Claws（利爪）、Crossbow（十字弓）、Iron Club（铁棒）、Meat Cleaver（切肉刀）、Sai（钗）、Spiked Gauntlets（带刺手甲）、Tanx's Whistle（坦克斯的哨子）、Throwing Axe（投斧）、Tri-Boomerang（三刃回旋镖）、War Hammer（战锤）
- **Vakuu**（10）：Blood-Soaked Rose（血染玫瑰）、Choices Paradox（选择悖论）、Distinguished Cape（卓越斗篷）、Fiddle（小提琴）、Jeweled Mask（宝石面具）、Lord's Parasol（领主阳伞）、Music Box（音乐盒）、Preserved Fog（腌制活雾）、Sere Talon（原初之爪）、Whispering Earring（低语耳环）
- **Darv**（12）：Astrolabe（星盘）、Black Star（黑星）、Calling Bell（召唤铃铛）、Dusty Tome（尘封魔典）、Ectoplasm（灵体外质）、Empty Cage（空鸟笼）、Pandora's Box（潘多拉魔盒）、Philosopher's Stone（贤者之石）、Runic Pyramid（符文金字塔）、Snecko Eye（异蛇之眼）、Sozu（添水）、Velvet Choker（天鹅绒颈圈）

### 特殊（还差 1 / 共 1）

- Circlet（头环）
