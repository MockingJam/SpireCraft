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
| bronze_scales | 铜制鳞片 | 普通 | 战斗开始时获得 3 荆棘 | 战斗开始时 +1 层荆棘（30 秒；每被近战击中反弹 1 点） |
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
| 铜制鳞片 | 铜锭 ×3 + 犰狳鳞甲 ×3 | 金属鳞片 |
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
| 异常光滑的石头 | 平滑石 | 蜜脾 |
| 青铜鳞片 | 犰狳鳞甲 | 铜块 |
| 水银沙漏 | 时钟 | 下界石英 |
| 弹珠袋 | 收纳袋 | 绿色玻璃 |
| 红面具 | 皮革帽子 | 红色染料 |
| 血瓶 | 玻璃瓶 | 闪烁的西瓜片 |
| 红颅骨 | 骷髅头颅 | 烈焰粉 |
| 钢笔尖 | 羽毛 | 金锭 |
| 燃烧之血 | 血瓶 | 岩浆膏 |

其他补充的配方：5 个 Boss 召唤道具；破裂核心水晶块、破裂墨石（熔炼）；巢脾（2 蜜脾 + 2 巢土 → 2）；巢蜜储藏（巢脾 + 蜂蜜瓶）；巢菌毯（2 巢菌土 → 3）；萤光苔毯（2 苔藓地毯 + 发光浆果 → 2）；自动机合金的锈蚀（合金块 + 水桶 → 锈蚀 → 废弃）；墨泡（黏液球 + 墨囊 → 2）。矿石、原木、植物、珊瑚、结构专属方块与原版一样不需要配方。

## 第二批遗物设计稿（#11，35 件，2026-11-20）

> 范围：[relics_triage.md](relics_triage.md) 里标 🟢 的 35 件，都能用现有钩子（战斗开始/结束、受伤、攻击、击杀、致命伤、战斗中定时）和已有效果实现。**这是设计稿，还没实现，数值待试玩调整。** 中文名是暂定的，以游戏官方译名为准再改。
>
> 换算沿用第一批：STS2 的 1 回合 ≈ 战斗中 3 秒；格挡 ÷2.5 ≈ 伤害吸收点数（锚 10 → 4）；伤害和治疗大约 ÷3（水银沙漏 3 → 1，燃烧之血 6 → 4）；“第 N 回合开始”= 战斗开始后 3×(N−1) 秒。
> 下文的“伤害吸收 N 点”都持续 15 秒（同锚），“+N 力量/敏捷”都持续 30 秒（同金刚杵），除非另有说明。“敌对生物”和第一批一样指原版 Enemy。

### 效果

| 注册名 | 暂定中文名 | 稀有度 | STS2 原效果 | Minecraft 效果 |
|---|---|---|---|---|
| black_blood | 黑色之血 | 初始（铁甲战士） | 战斗结束回 12 生命 | 战斗结束时，若这场战斗击杀过敌对生物，回复 8 生命（4❤）。和燃烧之血同时在袋里时只算黑色之血 |
| festive_popper | 节日拉炮 | 普通 | 战斗开始对所有敌人造成 9 伤害 | 战斗开始时，8 格内的敌对生物各受 3 点伤害（烟花粒子和音效，不破坏方块，不伤友方） |
| strike_dummy | 打击木人 | 普通 | 名字带“打击”的牌 +3 伤害 | 用“打击”类武器近战时 +1 伤害：王之剑 `regent_strike`、刀 `cleaver` 和原版各种剑（新物品标签 `spirecraft:strikes`） |
| akabeko | 赤牛 | 罕见 | 战斗开始获得 8 活力（下一次攻击加伤） | 每场战斗的第一次攻击 +3 伤害 |
| horn_cleat | 角形系缆桩 | 罕见 | 第 2 回合开始获得 14 格挡 | 战斗开始 3 秒后获得 6 点伤害吸收 |
| kusarigama | 锁镰 | 罕见 | 一回合打 3 张攻击，对随机敌人造成 6 伤害 | 3 秒内连续攻击 3 次时，对 6 格内随机一个敌对生物造成 2 点伤害（计数方式同手里剑） |
| miniature_cannon | 迷你加农炮 | 罕见 | 升级过的攻击牌 +3 伤害 | 弹射物攻击（弓、弩、三叉戟、模组投掷武器）+1 伤害。“升级过的牌”在 MC 没有对应，取“炮”的主题；附魔武器加伤留给神秘打火机 |
| ornamental_fan | 精致折扇 | 罕见 | 一回合打 3 张攻击，获得 4 格挡 | 3 秒内连续攻击 3 次时获得 2 点伤害吸收，可叠加，最多 6 点 |
| parrying_shield | 招架盾 | 罕见 | 回合结束格挡 ≥10 时，对随机敌人造成 6 伤害 | 战斗中每 3 秒检查一次：伤害吸收 ≥4 点时，对 6 格内随机一个敌对生物造成 2 点伤害 |
| ripple_basin | 涟漪水盆 | 罕见 | 回合内没打攻击时获得 4 格挡 | 战斗中连续 3 秒没有攻击，获得 2 点伤害吸收，最多 6 点 |
| sparkling_rouge | 闪耀胭脂 | 罕见 | 第 3 回合开始 +1 力量 +1 敏捷 | 战斗开始 6 秒后 +1 力量 +1 敏捷 |
| paper_phrog | 纸蛙 | 罕见（铁甲战士） | 易伤敌人多受 75% 而不是 50% | 你攻击带易伤的敌人时，易伤倍率从 ×1.5 提到 ×1.75（只对你自己的攻击生效） |
| self_forming_clay | 自成型黏土 | 罕见（铁甲战士） | 失去生命时，下回合获得 3 格挡 | 每次失去生命，3 秒后获得 1 点伤害吸收，最多 4 点 |
| twisted_funnel | 扭曲漏斗 | 罕见（静默猎手） | 战斗开始给所有敌人 4 层中毒 | 战斗开始时，8 格内的敌对生物获得 2 层中毒（模组的中毒效果） |
| beating_remnant | 跳动的残骸 | 稀有 | 一回合内最多失去 20 生命 | 任意 3 秒内最多失去生命上限的 25%（默认 5 点），超出的部分抵消。在护甲和伤害吸收之后结算；虚空、`/kill` 不受影响 |
| captains_wheel | 舵轮 | 稀有 | 第 3 回合开始获得 18 格挡 | 战斗开始 6 秒后获得 8 点伤害吸收 |
| kunai | 苦无 | 稀有 | 一回合打 3 张攻击 +1 敏捷 | 3 秒内连续攻击 3 次：+1 敏捷，最多 3 层（同手里剑，给的是敏捷） |
| stone_calendar | 石制日历 | 稀有 | 第 7 回合结束对所有敌人造成 52 伤害 | 一场战斗持续满 21 秒时，对 8 格内所有敌对生物造成 10 点伤害，每场战斗一次 |
| demon_tongue | 恶魔之舌 | 稀有（铁甲战士） | 每回合首次在自己回合失去生命时，回复等量生命 | 失去生命时回复等量生命（最多 4 点），之后 10 秒内不再触发 |
| paper_krane | 纸鹤 | 稀有（静默猎手） | 虚弱敌人伤害 −40% 而不是 −25% | 带虚弱的敌人对你造成的伤害从 ×0.75 降到 ×0.6（只对你生效） |
| belt_buckle | 皮带扣 | 商店 | 身上没有药水时 +2 敏捷 | 背包里没有任何药水（含喷溅、滞留、模组药水）时 +2 敏捷，常驻，不占效果栏（做法同红头骨） |
| mystic_lighter | 神秘打火机 | 商店 | 附魔过的攻击牌 +9 伤害 | 用附魔过的武器攻击时 +1 伤害，并点燃目标 2 秒。MC 武器大多有附魔，所以只给 +1 |
| daughter_of_the_wind | 风之女 | 事件 | 打出攻击时获得 1 格挡 | 每次攻击命中获得 1 点伤害吸收，最多 4 点；每秒最多触发一次 |
| mr_struggles | 挣扎先生 | 事件 | 回合开始对所有敌人造成等于回合数的伤害 | 战斗中每 3 秒对 6 格内所有敌对生物造成伤害：开始时 1 点，每过 15 秒 +1，最多 3 点 |
| mighty_wings | 强力之翼 | 事件 | 单次攻击伤害 ≥30 时 +2 力量 | 单次攻击造成 ≥10 点伤害时 +2 力量，最多 4 层 |
| royal_poison | 皇家毒药 | 事件 | 战斗开始失去 4 生命 | 战斗开始失去 2 生命。负面遗物：放进遗物袋后取不出来，要付绿宝石请商人“移除服务”拿掉；和玉剑放在同一个箱子里，作为它的代价（见获取） |
| sword_of_jade | 玉剑 | 事件 | 战斗开始 +3 力量 | 战斗开始 +2 力量 |
| bath_towel | 浴巾 | 事件 | 战斗开始回 8 生命 | 战斗开始回 3 生命 |
| the_boot | 靴子 | 事件 | 未被格挡的攻击伤害 ≤4 时提高到 5 | 你的攻击伤害低于 3 点时提高到 3 点（受无敌帧限制，连点不会无限叠） |
| wongo_badge | 汪戈顾客感谢徽章 | 事件 | 没有效果 | 没有效果，纯收藏 |
| wongos_mystery_ticket | 汪戈神秘彩票 | 事件 | 5 场战斗后获得 3 件随机遗物 | 放进遗物袋后完成 5 场战斗，彩票消失，在脚下掉出 3 件随机遗物（普通池 2 件 + 罕见池 1 件） |
| diamond_diadem | 钻石冠冕 | 先古 | 战斗开始 20 格挡，第 2 回合不清空 | 战斗开始获得 8 点伤害吸收，持续到战斗结束（最长 60 秒） |
| sai | 铁尺 | 先古 | 回合开始获得 7 格挡 | 战斗中每 3 秒获得 2 点伤害吸收，最多 4 点 |
| throwing_axe | 飞斧 | 先古 | 每场第一张牌打两次 | 每场战斗的第一次攻击伤害翻倍（同钢笔尖的翻倍） |
| circlet | 头环 | 特殊 | 没有效果（遗物池抽空时的占位） | 没有效果，纯收藏 |

### 获取

普通、罕见遗物和第一批一样：宝箱 + 锻造台锻造（模板都是遗物残片）。稀有遗物只能从宝箱、精英和 Boss 拿到，不能锻造。

**加进现有遗物池**（`RelicEvents` 里的列表；精英 50% 掉普通池，Boss 必掉稀有池，也会跟着变）：

| 池 | 现有 | 新增 |
|---|---|---|
| 普通 | 7 件 | 节日拉炮、打击木人 → 9 件 |
| 罕见 | 2 件 | 赤牛、角形系缆桩、锁镰、迷你加农炮、精致折扇、招架盾、涟漪水盆、闪耀胭脂 → 10 件 |
| 稀有 | 2 件 | 跳动的残骸、舵轮、苦无、石制日历 → 6 件 |
| 下界要塞（铁甲战士） | 燃烧之血、红头骨 | 纸蛙、自成型黏土 |
| 堡垒遗迹宝藏室 | 稀有池 | 另加恶魔之舌（单独的池，只在宝藏室） |
| **新：静默猎手**（丛林神庙宝箱，15%，取代丛林神庙原来的普通池） | — | 扭曲漏斗、纸鹤；以后的静默猎手遗物也放这里 |

每个箱子出遗物的总概率不变（代码按池子大小自动算空权重），所以罕见池从 2 件变成 10 件后，单件罕见遗物的概率是原来的 1/5。

**锻造**（遗物残片 + 底料 + 添加物）：

| 遗物 | 底料 | 添加物 | 理由 |
|---|---|---|---|
| 黑色之血 | 燃烧之血 | 凋零骷髅头颅 | 燃烧之血被凋零染黑：由燃烧之血升级而来 |
| 节日拉炮 | 烟花火箭 | 火药 | 拉炮 |
| 打击木人 | 盔甲架 | 干草块 | 稻草练习假人 |
| 赤牛 | 红色陶瓦 | 金粒 | 红漆陶牛，金色花纹 |
| 角形系缆桩 | 山羊角 | 铜块 | 船上的铜系缆桩 |
| 锁镰 | 铁锄 | 铁链 | 镰 + 链 |
| 迷你加农炮 | 发射器 | 铁块 | 小炮 |
| 精致折扇 | 纸 | 竹子 | 竹骨纸扇 |
| 招架盾 | 盾牌 | 铁锭 | 包铁的盾 |
| 涟漪水盆 | 炼药锅 | 海晶碎片 | 盛水的盆 |
| 闪耀胭脂 | 红色染料 | 萤石粉 | 发亮的胭脂 |
| 纸蛙 | 纸 | 睡莲叶 | 折纸青蛙 |
| 自成型黏土 | 黏土块 | 下界疣 | 会长肉的黏土 |
| 扭曲漏斗 | 漏斗 | 发酵蛛眼 | 毒液漏斗 |

**商人**（阶段 9 的商人，用绿宝石）：皮带扣、神秘打火机进商人的遗物货单，价位按罕见算；汪戈两件（徽章、彩票）也由商人给——买任意一件遗物时 10% 附赠徽章，彩票单独出售，价格低于罕见遗物。

**模组结构的箱子**（事件遗物；这些战利品表在 `spirecraft` 命名空间，直接写进各自的 `chests/*.json`，不走 `onLootLoad`）：

| 遗物 | 结构 | 概率 | 理由 |
|---|---|---|---|
| 风之女 | 灯塔 `lighthouse` | 8% | 海边大风 |
| 挣扎先生 | 遗迹堆 `ruin_pile` | 5% | 对应 STS2 的垃圾堆事件 |
| 强力之翼 | 巨鸟巢 `byrdonis_nest` | 10% | 鸟 |
| 玉剑 + 皇家毒药 | 沉没宝库 `sunken_treasury` | 6% | 王室宝藏，一起出现：拿剑就得背上毒药 |
| 浴巾 | 涌泉 `wellspring` | 8% | 泡澡 |
| 靴子 | 营地 `camp` | 5% | 旅人的旧靴子 |

**先古**（暂定，等先古之民 NPC 定下来再改）：钻石冠冕、铁尺、飞斧放进新的“先古池”，Boss 除了必掉的稀有遗物外，另有 20% 掉一件先古池遗物。

**头环**：不进任何池，只能 `/give` 或创造模式拿到。低优先级。

### 实现备注

- 新的计时类效果（“战斗开始 N 秒后”、石制日历、挣扎先生、铁尺、招架盾、涟漪水盆）都放进 `RelicEvents.tick`，在 `Combat` 里记战斗开始时间。
- 连击类（锁镰、精致折扇、苦无）和手里剑共用 `Combat.streak`，要改成每件遗物各自计数，或者在同一个 3 次连击里一起触发。
- 纸蛙、纸鹤改的是 `SpireEffectEvents` 里易伤、虚弱的倍率，需要能按攻击者/受害者带的遗物换倍率。
- 皮带扣的常驻敏捷需要一个和 `extraStrength` 对称的 `extraDexterity` 钩子。
- 皇家毒药“取不出来”要改遗物袋界面；商人的“移除服务”要能移除它。
- 汪戈神秘彩票要在玩家数据里存已完成的战斗数。

## 还没做的遗物（#11，2026-11-20 对照）

> 资料：slaythespire.wiki.gg 的 Slay_the_Spire_2:Relics_List，2026-11-19 版，共 315 件。比开头的 298 件多，是因为 beta 版新增了角色 Fool 和它的遗物。
> 已做 14 件：燃烧之血、锚、金刚杵、意外光滑的石头、弹珠袋、红面具、铜制鳞片、小血瓶、红头骨、钢笔尖、水银沙漏、手里剑、蜥蜴尾巴、钨合金棍。下面是剩下的 301 件，名字先用英文原名，中文名在实现时再定。
> 每件做之前要先定 MC 效果（挂到 `RelicEvents` 的哪个钩子）和获取途径。抽牌、能量、金币、卡组、药水栏、地图这类效果在 MC 里没有直接对应，要单独换算或跳过。
> 每件的 STS2 效果和设计难度分拣（直接做 / 新机制 / 重新设计 / 已有 / 第一版不做）见 [relics_triage.md](relics_triage.md)。

### 初始（还差 11 / 共 12）

- 铁甲战士：Black Blood
- 静默猎手：Ring of the Snake、Ring of the Drake
- 储君：Divine Right、Divine Destiny
- 亡灵契约师：Bound Phylactery、Phylactery Unbound
- 故障机器人：Cracked Core、Infused Core
- Fool：Song Bow、Storyteller

### 普通（还差 23 / 共 31）

- 通用：Amethyst Aubergine、Bag of Preparation、Book of Five Rings、Centennial Puzzle、Festive Popper、Gorget、Happy Flower、Juzu Bracelet、Lantern、Meal Ticket、Pendulum、Potion Belt、Regal Pillow、Strawberry、Strike Dummy、Venerable Tea Set、War Paint、Whetstone
- 静默猎手：Snecko Skull
- 储君：Fencing Manual
- 亡灵契约师：Bone Flute
- 故障机器人：Data Disk
- Fool：Exercise Mat

### 罕见（还差 39 / 共 41）

- 通用：Akabeko、Bowler Hat、Candelabra、Eternal Feather、Gremlin Horn、Horn Cleat、Joss Paper、Kusarigama、Lasting Candy、Letter Opener、Lucky Fysh、Miniature Cannon、Nunchaku、Orichalcum、Ornamental Fan、Pantograph、Parrying Shield、Pear、Permafrost、Petrified Toad、Planisphere、Reptile Trinket、Ripple Basin、Sparkling Rouge、Stone Cracker、Tiny Mailbox、Tuning Fork、Vambrace
- 铁甲战士：Paper Phrog、Self-Forming Clay
- 静默猎手：Tingsha、Twisted Funnel
- 储君：Galactic Dust、Regalite
- 亡灵契约师：Book Repair Knife、Funerary Mask
- 故障机器人：Gold-Plated Cables、Symbiotic Virus
- Fool：Ocarina

### 稀有（还差 51 / 共 54）

- 通用：Art of War、Beating Remnant、Bellows、Captain's Wheel、Chandelier、Cloak Clasp、Frozen Egg、Gambling Chip、Game Piece、Girya、Ice Cream、Intimidating Helmet、Kunai、Mango、Meat on the Bone、Molten Egg、Mummified Hand、Old Coin、Pocketwatch、Prayer Wheel、Rainbow Ring、Razor Tooth、Shovel、Stone Calendar、Sturdy Clamp、The Courier、Toxic Egg、Unceasing Top、Unsettling Lamp、Vexing Puzzlebox、White Beast Statue、White Star
- 铁甲战士：Charon's Ashes、Demon Tongue、Ruined Helmet
- 静默猎手：Helical Dart、Paper Krane、Tough Bandages
- 储君：Lunar Pastry、Mini Regent、Orange Dough
- 亡灵契约师：Big Hat、Bookmark、Ivory Tile
- 故障机器人：Emotion Chip、Metronome、Power Cell
- Fool：Conductor's Baton、Fertilizer、Twine、Whittling Knife

### 商店（还差 31 / 共 31）

商店遗物的获取途径要等阶段 10 的 NPC 交易。

- 通用：Belt Buckle、Bread、Burning Sticks、Cauldron、Chemical X、Dingy Rug、Dolly's Mirror、Dragon Fruit、Ghost Seed、Gnarled Hammer、Kifuda、Lava Lamp、Lee's Waffle、Membership Card、Miniature Tent、Mystic Lighter、Orrery、Punch Dagger、Ringing Triangle、Royal Stamp、Screaming Flagon、Sling of Courage、The Abacus、Toolbox、Wing Charm
- 铁甲战士：Brimstone（注册名会和已有的材料 `brimstone` 撞，需要另起名）
- 静默猎手：Ninja Scroll
- 储君：Vitruvian Minion
- 亡灵契约师：Undying Sigil
- 故障机器人：Runic Capacitor
- Fool：Bizarre Lamp

### 事件（还差 43 / 共 43）

- Byrdpip、Byrdine、Pollinous Core、Bing Bong、Daughter of the Wind、Mr. Struggles、Fresnel Lens、Forgotten Soul、Big Mushroom、Fragrant Mushroom、Obsidian Vice、Thumbscrew、Tormentous Collar、The Chosen Cheese、Mighty Wings、Bone Tea、Ember Tea、Tea of Discourtesy、Lost Wisp、Royal Poison、Sword of Jade、Sword of Stone、Bath Robes、Bath Towel、Darkstone Periapt、Dream Catcher、Hand Drill、Maw Bank、The Boot、History Course、Wongo Customer Appreciation Badge、Wongo's Mystery Ticket、Wuppy
- 带“???”的变种（原遗物的变体）：Anchor???、Blood Vial???、Happy Flower???、Lee's Waffle???、Mango???、Orichalcum???、Snecko Eye???、Strike Dummy???、The Merchant's Rug???、Venerable Tea Set???

### 先古（还差 102 / 共 102）

按给出遗物的先古之民分组。Boss 遗物（先古之民）的获取途径还没定。

- **Neow**（30）：Arcane Scroll、Booming Conch、Cursed Pearl、Dowsing Rod、Fishing Rod、Golden Pearl、Hefty Tablet、Kaleidoscope、Large Capsule、Lava Rock、Lead Paperweight、Leafy Poultice、Lost Coffer、Massive Scroll、Neow's Bones、Neow's Sacrifice、Neow's Talisman、Neow's Torment、New Leaf、Nutritious Oyster、Phial Holster、Pomander、Precarious Shears、Precise Scissors、Scroll Boxes、Silken Tress、Silver Crucible、Small Capsule、Stone Humidifier、Winged Boots
- **Orobas**（10）：Alchemical Coffer、Archaic Tooth、Driftwood、Electric Shrymp、Glass Eye、Prismatic Gem、Radiant Pearl、Sand Castle、Sea Glass、Touch of Orobas
- **Pael**（10）：Pael's Blood、Pael's Claw、Pael's Eye、Pael's Flesh、Pael's Growth、Pael's Horn、Pael's Legion、Pael's Tears、Pael's Tooth、Pael's Wing
- **Tezcatara**（10）：Biiig Hug、Golden Compass、Nutritious Soup、Pumpkin Candle、Seal of Gold、Storybook、Toasty Mittens、Toy Box、Very Hot Cocoa、Yummy Cookie
- **Nonupeipe**（10）：Beautiful Bracelet、Blessed Antler、Brilliant Scarf、Delicate Frond、Diamond Diadem、Fur Coat、Glitter、Jewelry Box、Looming Fruit、Signet Ring
- **Tanx**（10）：Claws、Crossbow、Iron Club、Meat Cleaver、Sai、Spiked Gauntlets、Tanx's Whistle、Throwing Axe、Tri-Boomerang、War Hammer
- **Vakuu**（10）：Blood-Soaked Rose、Choices Paradox、Distinguished Cape、Fiddle、Jeweled Mask、Lord's Parasol、Music Box、Preserved Fog、Sere Talon、Whispering Earring
- **Darv**（12）：Astrolabe、Black Star、Calling Bell、Dusty Tome、Ectoplasm、Empty Cage、Pandora's Box、Philosopher's Stone、Runic Pyramid、Snecko Eye、Sozu、Velvet Choker

### 特殊（还差 1 / 共 1）

- Circlet
