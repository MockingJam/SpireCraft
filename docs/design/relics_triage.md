# 遗物分拣：还需要设计的遗物（#11）

> 资料：slaythespire.wiki.gg 的 Slay_the_Spire_2:Relics_List，2026-11-19 版，共 315 件；已做 14 件（见 [relics.md](relics.md)），这里是剩下的 301 件。
> 名字先用英文原名，中文名实现时再定。“STS2 效果”是 wiki 原效果的中文概括。

## 分类

| 标记 | 含义 | 设计工作量 |
|---|---|---|
| 🟢 直接做 | 现有 `RelicEvents` 钩子（战斗开始/结束、受伤、攻击、击杀、致命伤、战斗中定时）加上已有效果（力量、敏捷、荆棘、虚弱、易伤、中毒、伤害吸收……）就能实现 | 只需定数值 |
| 🟡 新机制 | MC 里有对应的概念，但要先加钩子或系统：喝药水、睡床（休息）、商人、绿宝石（金币）、精英/Boss 战判定、拾取时一次性效果、永久生命上限、附魔、充能球、奥斯提、飞刀 | 先定机制，再定数值 |
| 🔴 重新设计 | 效果建立在抽牌、能量、卡组、卡牌升级/变化/删除、卡牌奖励、地图、? 房间上，MC 没有对应 | 只能保留主题另起效果，或不做 |
| ⚪ 已有/已规划 | 已经在别处做成了食物、材料或武器，或在其他设计文档里规划好了 | 决定还要不要遗物版 |
| ⚫ 第一版不做 | 第一版范围外（PLAN.md：不做新角色愚者；consumables.md：茶类事件遗物归阶段 11 爬塔模式） | 暂不处理 |

分拣时用的换算（沿用 relics.md）：STS2 的 1 回合 ≈ 战斗中 3 秒（同水银沙漏）；格挡 = 伤害吸收；休息 = 睡床；金币 = 绿宝石；牌的附魔 = MC 附魔；诅咒牌 = 诅咒附魔（商人的“移除服务”已这样对应）。

## 汇总

| 稀有度 | 🟢 | 🟡 | 🔴 | ⚪ | ⚫ | 合计 |
|---|---|---|---|---|---|---|
| 初始 | 1 | 3 | 4 | 1 | 2 | 11 |
| 普通 | 2 | 7 | 11 | 2 | 1 | 23 |
| 罕见 | 11 | 10 | 14 | 3 | 1 | 39 |
| 稀有 | 6 | 11 | 28 | 2 | 4 | 51 |
| 商店 | 2 | 10 | 16 | 2 | 1 | 31 |
| 事件 | 9 | 11 | 10 | 0 | 13 | 43 |
| 先古 | 3 | 17 | 81 | 1 | 0 | 102 |
| 特殊 | 1 | 0 | 0 | 0 | 0 | 1 |
| **合计** | **35** | **69** | **164** | **11** | **22** | **301** |

先做 🟢 的 35 件最省事（设计稿见 [relics.md](relics.md) 的“第二批遗物设计稿”）；🟡 里“睡床”“精英/Boss 判定”“拾取时一次性效果”“绿宝石”几个机制各自能解锁好几件，值得先定。

## 初始（11）

| 遗物 | 角色 | STS2 效果 | 分类 | 备注 |
|---|---|---|---|---|
| Black Blood | 铁甲战士 | 战斗结束回 12 生命 | 🟢 | 燃烧之血的先古升级版 |
| Ring of the Snake | 静默猎手 | 每场战斗开始多抽 2 张 | 🔴 | |
| Ring of the Drake | 静默猎手 | 前 3 回合各多抽 2 张 | 🔴 | 上一件的升级版 |
| Divine Right | 储君 | 战斗开始获得 3 星 | 🔴 | 辉星资源已取消（weapons.md v2） |
| Divine Destiny | 储君 | 战斗开始获得 7 星 | 🔴 | 同上，升级版 |
| Bound Phylactery | 亡灵契约师 | 回合开始召唤 1 | 🟡 | 接奥斯提（阶段 8） |
| Phylactery Unbound | 亡灵契约师 | 战斗开始召唤 5，回合开始召唤 2 | 🟡 | 升级版 |
| Cracked Core | 故障机器人 | 战斗开始生成 1 个闪电球 | ⚪ | 已做成武器能量核心 `energy_core` |
| Infused Core | 故障机器人 | 战斗开始生成 3 个闪电球；闪电球 +1 伤害 | 🟡 | 接充能球 |
| Song Bow | 愚者 | 战斗开始 6 层瞄准 | ⚫ | |
| Storyteller | 愚者 | 战斗开始 12 层瞄准，回合结束 +3 | ⚫ | |

## 普通（23）

| 遗物 | 角色 | STS2 效果 | 分类 | 备注 |
|---|---|---|---|---|
| Amethyst Aubergine | | 敌人多掉 15 金币 | ⚪ | 已做成食物紫水晶茄子（财运） |
| Bag of Preparation | | 战斗开始多抽 2 张 | 🔴 | |
| Book of Five Rings | | 每往牌组加 5 张牌，回 20 生命 | 🔴 | |
| Centennial Puzzle | | 每场首次失去生命时抽 3 张 | 🔴 | 触发条件能做（受伤钩子），效果要另想 |
| Festive Popper | | 战斗开始对所有敌人造成 9 伤害 | 🟢 | |
| Gorget | | 战斗开始获得 4 层覆甲 | 🟡 | 要新效果“覆甲”（逐回合衰减的格挡） |
| Happy Flower | | 每 3 回合获得 1 能量 | 🔴 | |
| Juzu Bracelet | | ? 房间不再遇到普通战斗 | 🔴 | |
| Lantern | | 战斗开始多 1 能量 | 🔴 | |
| Meal Ticket | | 进商店时回 15 生命 | 🟡 | 与商人交易时回血 |
| Pendulum | | 每 3 回合抽 1 张 | 🔴 | |
| Potion Belt | | 拾取时 +2 药水栏 | 🔴 | MC 没有药水栏 |
| Regal Pillow | | 休息时多回 15 生命 | 🟡 | 睡床 |
| Strawberry | | 拾取时 +7 最大生命 | ⚪ | 已做成食物草莓 |
| Strike Dummy | | 名字带“打击”的牌 +3 伤害 | 🟢 | 对应“打击”类入门武器（剑、刀）+伤害 |
| Venerable Tea Set | | 进休息处后，下场战斗多 2 能量 | 🔴 | 触发能用睡床，效果要另想 |
| War Paint | | 拾取时升级 2 张随机技能 | 🔴 | |
| Whetstone | | 拾取时升级 2 张随机攻击 | 🔴 | |
| Snecko Skull | 静默猎手 | 施加中毒时多施加 1 层 | 🟡 | 要“施加效果”钩子（中毒已有） |
| Fencing Manual | 储君 | 战斗开始锻造 10 | 🟡 | 接储君的锻造（君王之剑） |
| Bone Flute | 亡灵契约师 | 奥斯提攻击时获得 2 格挡 | 🟡 | 接奥斯提 |
| Data Disk | 故障机器人 | 战斗开始 +1 集中 | 🟡 | 要新效果“集中”（加强充能球） |
| Exercise Mat | 愚者 | 战斗开始 6 层伸展 | ⚫ | |

## 罕见（39）

| 遗物 | 角色 | STS2 效果 | 分类 | 备注 |
|---|---|---|---|---|
| Akabeko | | 战斗开始获得 8 活力（下一次攻击加伤） | 🟢 | 每场首击加伤，同钢笔尖的攻击钩子 |
| Bowler Hat | | 金币收入 +25% | 🟡 | 绿宝石 |
| Candelabra | | 第 2 回合开始 +2 能量 | 🔴 | |
| Eternal Feather | | 每 5 张牌，进休息处时回 3 生命 | 🔴 | |
| Gremlin Horn | | 敌人死亡时 +1 能量并抽 1 张 | 🔴 | 触发能做（击杀钩子），效果要另想 |
| Horn Cleat | | 第 2 回合开始获得 14 格挡 | 🟢 | 战斗开始约 3 秒后给伤害吸收 |
| Joss Paper | | 每消耗 5 张牌抽 1 张 | 🔴 | |
| Kusarigama | | 一回合打出 3 张攻击，对随机敌人造成 6 伤害 | 🟢 | 同手里剑的连击窗口 |
| Lasting Candy | | 隔一场战斗，卡牌奖励多一张能力牌 | 🔴 | |
| Letter Opener | | 一回合打出 3 张技能，对所有敌人造成 5 伤害 | 🔴 | MC 没有“技能牌” |
| Lucky Fysh | | 每往牌组加一张牌，获得 15 金币 | 🔴 | |
| Miniature Cannon | | 升级过的攻击牌 +3 伤害 | 🟢 | “升级过”≈附魔过的武器；和 Mystic Lighter 重叠 |
| Nunchaku | | 每打出 10 张攻击 +1 能量 | 🔴 | 计数能做（同钢笔尖），效果要另想 |
| Orichalcum | | 回合结束时若没有格挡，获得 6 格挡 | ⚪ | materials.md 已规划为奥利哈钢遗物 |
| Ornamental Fan | | 一回合打出 3 张攻击，获得 4 格挡 | 🟢 | 同手里剑窗口，给伤害吸收 |
| Pantograph | | Boss 战开始回 25 生命 | 🟡 | Boss 战判定 |
| Parrying Shield | | 回合结束格挡 ≥10 时，对随机敌人造成 6 伤害 | 🟢 | 战斗中定时：伤害吸收 ≥X 时反击 |
| Pear | | 拾取时 +10 最大生命 | ⚪ | 已做成食物梨 |
| Permafrost | | 每场首次打出能力牌，获得 7 格挡 | 🔴 | |
| Petrified Toad | | 战斗开始获得一瓶“药水形状的石头” | 🟡 | 战斗开始给物品（可投掷的石头） |
| Planisphere | | 进入 ? 房间时回 5 生命 | 🟡 | ? 房间≈结构；要“进入结构”钩子 |
| Reptile Trinket | | 使用药水时本回合 +3 力量 | 🟡 | 喝药水钩子 |
| Ripple Basin | | 回合内没打攻击时获得 4 格挡 | 🟢 | 战斗中 3 秒没攻击就给伤害吸收 |
| Sparkling Rouge | | 第 3 回合开始 +1 力量 +1 敏捷 | 🟢 | |
| Stone Cracker | | 战斗开始升级抽牌堆里 2 张牌 | 🔴 | |
| Tiny Mailbox | | 休息时获得 2 瓶随机药水 | 🟡 | 睡床 |
| Tuning Fork | | 每打出 10 张技能，获得 7 格挡 | 🔴 | MC 没有“技能牌” |
| Vambrace | | 每场首次从牌获得的格挡翻倍 | 🟡 | 要“获得伤害吸收”钩子 |
| Paper Phrog | 铁甲战士 | 易伤增伤从 50% 提到 75% | 🟢 | 易伤已有，改倍率 |
| Self-Forming Clay | 铁甲战士 | 失去生命时，下回合获得 3 格挡 | 🟢 | |
| Tingsha | 静默猎手 | 回合内每弃一张牌，对随机敌人造成 3 伤害 | 🔴 | MC 没有弃牌 |
| Twisted Funnel | 静默猎手 | 战斗开始给所有敌人 4 层中毒 | 🟢 | |
| Galactic Dust | 储君 | 每花 10 星获得 10 格挡 | ⚪ | materials.md 已规划为星系尘埃遗物 |
| Regalite | 储君 | 每回合首次创造牌，获得 4 格挡 | 🔴 | |
| Book Repair Knife | 亡灵契约师 | 非仆从敌人死于灾厄时回 3 生命 | 🟡 | 要灾厄处决钩子（灾厄已有） |
| Funerary Mask | 亡灵契约师 | 战斗开始往抽牌堆加 3 张灵魂 | 🔴 | |
| Gold-Plated Cables | 故障机器人 | 最右边的充能球被动多触发一次 | 🟡 | 接充能球 |
| Symbiotic Virus | 故障机器人 | 战斗开始生成 1 个暗黑球 | 🟡 | 暗黑球已有（暗影之盾） |
| Ocarina | 愚者 | 战斗开始随机加一张 Wah/Cho/Ki 牌 | ⚫ | |

## 稀有（51）

| 遗物 | 角色 | STS2 效果 | 分类 | 备注 |
|---|---|---|---|---|
| Art of War | | 回合内没打攻击，下回合 +1 能量 | 🔴 | |
| Beating Remnant | | 一回合内最多失去 20 生命 | 🟢 | 换成“3 秒内最多失去 X 生命”，受伤钩子 |
| Bellows | | 每场第一手牌全部升级 | 🔴 | |
| Captain's Wheel | | 第 3 回合开始获得 18 格挡 | 🟢 | |
| Chandelier | | 第 3 回合开始 +3 能量 | 🔴 | |
| Cloak Clasp | | 回合结束时手里每张牌 1 格挡 | 🔴 | |
| Frozen Egg | | 加入牌组的能力牌自动升级 | 🔴 | |
| Gambling Chip | | 战斗开始弃任意张再抽同样多 | 🔴 | |
| Game Piece | | 打出能力牌时抽 1 张 | 🔴 | |
| Girya | | 可在休息处获得力量（最多 3 次） | 🟡 | 睡床时永久 +力量，限 3 次 |
| Ice Cream | | 能量跨回合保留 | 🔴 | |
| Intimidating Helmet | | 打出 2 费以上的牌时获得 4 格挡 | 🟡 | 可对应满蓄力/重武器一击给伤害吸收 |
| Kunai | | 一回合打出 3 张攻击 +1 敏捷 | 🟢 | 同手里剑 |
| Mango | | 拾取时 +14 最大生命 | ⚪ | 已做成食物芒果 |
| Meat on the Bone | | 战斗结束时生命 ≤50% 则回 12 | ⚪ | 已做成食物带骨肉；遗物版本身是 🟢 |
| Molten Egg | | 加入牌组的攻击牌自动升级 | 🔴 | |
| Mummified Hand | | 打出能力牌时手里随机一张本回合免费 | 🔴 | |
| Old Coin | | 拾取时获得 300 金币 | 🟡 | 拾取时给绿宝石 |
| Pocketwatch | | 回合内打出 ≤3 张牌，下回合多抽 3 张 | 🔴 | |
| Prayer Wheel | | 普通敌人多给一份卡牌奖励 | 🔴 | 可改成普通敌人额外掉落 |
| Rainbow Ring | | 每回合首次各打出攻击、技能、能力，+1 力量 +1 敏捷 | 🔴 | |
| Razor Tooth | | 打出的攻击/技能本场战斗内升级 | 🔴 | |
| Shovel | | 可在休息处挖出随机遗物 | 🟡 | 睡床或挖掘时小概率出遗物 |
| Stone Calendar | | 第 7 回合结束对所有敌人造成 52 伤害 | 🟢 | 战斗约 21 秒后爆发一次 |
| Sturdy Clamp | | 最多 10 点格挡跨回合保留 | 🔴 | MC 的伤害吸收本来就不按回合清零 |
| The Courier | | 商人不断货，价格 −20% | 🟡 | 商人 |
| Toxic Egg | | 加入牌组的技能牌自动升级 | 🔴 | |
| Unceasing Top | | 回合内手牌打空时抽 1 张 | 🔴 | |
| Unsettling Lamp | | 每场首次施加减益时效果翻倍 | 🟡 | 要“施加效果”钩子 |
| Vexing Puzzlebox | | 战斗开始加一张随机牌，本回合免费 | 🔴 | |
| White Beast Statue | | 战斗奖励必出药水 | 🟡 | 可改成精英/Boss 必掉药水 |
| White Star | | 精英多给一份稀有卡牌奖励 | 🔴 | |
| Charon's Ashes | 铁甲战士 | 消耗一张牌时对所有敌人造成 3 伤害 | 🔴 | |
| Demon Tongue | 铁甲战士 | 每回合首次在自己回合失去生命，回等量生命 | 🟢 | 受伤钩子 + 冷却 |
| Ruined Helmet | 铁甲战士 | 每场首次获得力量时翻倍 | 🟡 | 要“获得效果”钩子 |
| Helical Dart | 静默猎手 | 打出小刀时本回合 +1 敏捷 | 🟡 | 接飞刀 `throwing_knife` |
| Paper Krane | 静默猎手 | 虚弱敌人的减伤从 25% 提到 40% | 🟢 | 虚弱已有，改倍率 |
| Tough Bandages | 静默猎手 | 回合内每弃一张牌获得 3 格挡 | 🔴 | MC 没有弃牌 |
| Lunar Pastry | 储君 | 回合结束获得 1 星 | 🔴 | 辉星已取消 |
| Mini Regent | 储君 | 每回合首次花星时 +1 力量 | 🔴 | 辉星已取消 |
| Orange Dough | 储君 | 战斗开始加 2 张随机无色牌 | 🔴 | |
| Big Hat | 亡灵契约师 | 战斗开始加 2 张随机虚无牌 | 🔴 | |
| Bookmark | 亡灵契约师 | 回合结束随机一张保留牌费用 −1 | 🔴 | |
| Ivory Tile | 亡灵契约师 | 打出 3 费以上的牌时 +1 能量 | 🔴 | |
| Emotion Chip | 故障机器人 | 上回合失去过生命，回合开始触发所有充能球被动 | 🟡 | 接充能球 |
| Metronome | 故障机器人 | 每场首次累计生成 7 个充能球，对所有敌人造成 30 伤害 | 🟡 | 接充能球（上限 3，按累计计数） |
| Power Cell | 故障机器人 | 战斗开始从抽牌堆拿 2 张 0 费牌到手里 | 🔴 | |
| Conductor's Baton | 愚者 | 集齐旋律时受到的攻击伤害 −25% | ⚫ | |
| Fertilizer | 愚者 | 产生悲伤时 +1 力量 | ⚫ | |
| Twine | 愚者 | 拔出箭时获得 4 格挡 | ⚫ | |
| Whittling Knife | 愚者 | 洗抽牌堆时 +5 瞄准 | ⚫ | |

## 商店（31）

获取途径都是阶段 10 的商人（用绿宝石交易）。

| 遗物 | 角色 | STS2 效果 | 分类 | 备注 |
|---|---|---|---|---|
| Belt Buckle | | 身上没有药水时 +2 敏捷 | 🟢 | 定时检查背包 |
| Bread | | 第 1 回合 −2 能量，之后每回合 +1 | 🔴 | |
| Burning Sticks | | 每场首次消耗技能牌时复制一张到手里 | 🔴 | |
| Cauldron | | 拾取时酿出 5 瓶随机药水 | 🟡 | 拾取时一次性 |
| Chemical X | | X 费牌效果 +2 | 🔴 | |
| Dingy Rug | | 卡牌奖励可以出无色牌 | 🔴 | |
| Dolly's Mirror | | 拾取时复制牌组里一张牌 | 🔴 | |
| Dragon Fruit | | 获得金币时 +1 最大生命 | 🟡 | 绿宝石 + 永久生命上限（水果机制已有），要设上限 |
| Ghost Seed | | 打击和防御获得虚无 | 🔴 | |
| Gnarled Hammer | | 拾取时给最多 3 张攻击附魔“锋利 3” | 🟡 | 改成给武器附魔 |
| Kifuda | | 拾取时给最多 3 张牌附魔“灵巧” | 🟡 | 同上 |
| Lava Lamp | | 战斗没受伤时卡牌奖励全部升级 | 🔴 | |
| Lee's Waffle | | 拾取时 +7 最大生命并回满 | ⚪ | consumables.md 已规划为商人卖的食物 |
| Membership Card | | 商品半价 | 🟡 | 商人 |
| Miniature Tent | | 休息处可以选任意多个选项 | 🔴 | |
| Mystic Lighter | | 附魔过的攻击牌 +9 伤害 | 🟢 | 附魔过的武器 +伤害（攻击钩子查附魔） |
| Orrery | | 拾取时获得 5 份卡牌奖励 | 🔴 | |
| Punch Dagger | | 拾取时给一张攻击附魔“动量 5” | 🟡 | 改成给武器附魔 |
| Ringing Triangle | | 第一回合保留手牌 | 🔴 | |
| Royal Stamp | | 拾取时给一张攻击/技能附魔“御准” | 🟡 | 改成给武器附魔 |
| Screaming Flagon | | 回合结束手牌为空时对所有敌人造成 20 伤害 | 🔴 | |
| Sling of Courage | | 精英战开始 +2 力量 | 🟡 | 精英战判定 |
| The Abacus | | 洗抽牌堆时获得 6 格挡 | 🔴 | |
| Toolbox | | 战斗开始三选一无色牌加到手里 | 🔴 | |
| Wing Charm | | 每份卡牌奖励随机一张附魔“迅捷 1” | 🔴 | |
| Brimstone | 铁甲战士 | 回合开始 +2 力量，所有敌人 +1 力量 | ⚪ | materials.md 已规划为硫磺遗物；注册名和材料 `brimstone` 冲突 |
| Ninja Scroll | 静默猎手 | 战斗开始加 3 张小刀到手里 | 🟡 | 战斗开始给飞刀 |
| Vitruvian Minion | 储君 | 带“仆从”的牌伤害和格挡翻倍 | 🔴 | |
| Undying Sigil | 亡灵契约师 | 灾厄 ≥ 生命的敌人伤害 −50% | 🔴 | MC 里灾厄 ≥ 生命会直接处决，这个状态不存在 |
| Runic Capacitor | 故障机器人 | 战斗开始 +3 充能球槽 | 🟡 | 充能球上限 3 → 6 |
| Bizarre Lamp | 愚者 | 战斗开始加一张喜悦和一张悲伤到手里 | ⚫ | |

## 事件（43）

| 遗物 | STS2 效果 | 分类 | 备注 |
|---|---|---|---|
| Byrdpip | 获得牌“鸟俯冲”，一只小鸟随行；打出 6 次后可在休息处进化 | 🟡 | 随从宠物（新生物） |
| Byrdine | 把“鸟俯冲”变成“神鸟”，进化后的鸟随行 | 🟡 | 同上，进化版 |
| Pollinous Core | 每 4 回合多抽 2 张 | 🔴 | |
| Bing Bong | 每往牌组加一张牌，多加一张复制 | 🔴 | |
| Daughter of the Wind | 打出攻击时获得 1 格挡 | 🟢 | 每次攻击给少量伤害吸收 |
| Mr. Struggles | 回合开始对所有敌人造成等于回合数的伤害 | 🟢 | 战斗中定时、伤害递增（类似水银沙漏） |
| Fresnel Lens | 加入牌组的格挡牌附魔“灵活 2” | 🔴 | |
| Forgotten Soul | 消耗牌时对随机敌人造成 1 伤害 | 🔴 | |
| Big Mushroom | 拾取时 +20 最大生命；战斗开始少抽 2 张 | 🟡 | 生命上限能做，缺点要另想 |
| Fragrant Mushroom | 拾取时失去 15 生命，升级 2 张随机牌 | 🔴 | |
| Obsidian Vice | 回合结束手里每张牌对随机敌人造成 1 伤害 | 🔴 | |
| Thumbscrew | 多段攻击多打一次 | 🟡 | 可对应多发射击（多重射击、散射炮）多一发 |
| Tormentous Collar | 精英战开始给所有敌人 2 层虚弱 | 🟡 | 精英战判定 |
| The Chosen Cheese | 战斗结束 +1 最大生命 | 🟡 | 永久生命上限，要设上限 |
| Mighty Wings | 单次造成 ≥30 攻击伤害时 +2 力量 | 🟢 | 攻击钩子，阈值按 MC 伤害缩放 |
| Bone Tea | 下场战斗起手牌全部升级 | ⚫ | consumables.md 归到阶段 11 |
| Ember Tea | 接下来 5 场战斗开始 +2 力量 | ⚫ | 同上 |
| Tea of Discourtesy | 下场战斗往抽牌堆洗入 2 张晕眩 | ⚫ | 同上 |
| Lost Wisp | 打出能力牌时对所有敌人造成 8 伤害 | 🔴 | |
| Royal Poison | 战斗开始失去 4 生命 | 🟢 | 负面遗物 |
| Sword of Jade | 战斗开始 +3 力量 | 🟢 | |
| Sword of Stone | 击败 5 个精英后变成强力遗物 | 🟡 | 精英击杀计数 |
| Bath Robes | 下一场 Boss 战开始回满生命 | 🟡 | Boss 战判定 |
| Bath Towel | 战斗开始回 8 生命 | 🟢 | |
| Darkstone Periapt | 获得诅咒时 +6 最大生命 | 🟡 | 诅咒≈诅咒附魔 |
| Dream Catcher | 休息时可以加一张牌 | 🔴 | |
| Hand Drill | 打破敌人格挡时施加 2 层易伤 | 🟡 | 可对应打掉盾牌（斧击破盾） |
| Maw Bank | 每爬一层 +12 金币，在商店花钱后失效 | 🔴 | |
| The Boot | 未被格挡的攻击伤害 ≤4 时提高到 5 | 🟢 | 攻击钩子 |
| History Course | 回合开始重打上一张攻击 | 🔴 | |
| Wongo Customer Appreciation Badge | 没有效果 | 🟢 | 无效果，纯收藏 |
| Wongo's Mystery Ticket | 5 场战斗后获得 3 件随机遗物 | 🟢 | 战斗结束计数 + 抽遗物战利品表 |
| Wuppy | Wuppy 有自己的血量，替你承受所有攻击伤害 | 🟡 | 随从/护盾实体 |
| Anchor??? | 战斗开始 4 格挡 | ⚫ | 带“???”的都是原遗物的弱化变种，建议不单独做 |
| Blood Vial??? | 战斗开始回 1 生命 | ⚫ | 同上 |
| Happy Flower??? | 每 5 回合 +1 能量 | ⚫ | 同上 |
| Lee's Waffle??? | 拾取时回 10% 生命 | ⚫ | 同上 |
| Mango??? | 拾取时 +3 最大生命 | ⚫ | 同上 |
| Orichalcum??? | 回合结束没有格挡时获得 3 格挡 | ⚫ | 同上 |
| Snecko Eye??? | 战斗开始混乱 | ⚫ | 同上 |
| Strike Dummy??? | 带“打击”的牌 +1 伤害 | ⚫ | 同上 |
| The Merchant's Rug??? | 拙劣的仿制品，没有效果 | ⚫ | 同上 |
| Venerable Tea Set??? | 进休息处后下场战斗多 1 能量 | ⚫ | 同上 |

> “???”变种标 ⚫ 是本文的建议，不是 PLAN.md 的决定。

## 先古（102）

按给出遗物的先古之民分组。先古遗物大多是开局一次性改牌组，或“每回合 +1 能量 + 一个缺点”，在 MC 里基本要重新设计；获取途径（先古之民 NPC 或 Boss）也还没定。

| 遗物 | 先古之民 | STS2 效果 | 分类 | 备注 |
|---|---|---|---|---|
| Arcane Scroll | Neow | 拾取时获得一张随机稀有牌 | 🔴 | |
| Booming Conch | Neow | 精英战开始多抽 2 张、+1 能量 | 🔴 | |
| Cursed Pearl | Neow | 拾取时获得诅咒“贪婪”，+333 金币 | 🟡 | 诅咒附魔 + 绿宝石 |
| Dowsing Rod | Neow | 拾取时加入任务牌“探寻” | 🔴 | |
| Fishing Rod | Neow | 每 3 场普通战斗升级一张随机牌 | 🔴 | |
| Golden Pearl | Neow | 拾取时获得 150 金币 | 🟡 | 拾取时给绿宝石 |
| Hefty Tablet | Neow | 三选一稀有牌，加入诅咒“伤病” | 🔴 | |
| Kaleidoscope | Neow | 拾取时获得 2 份其他角色的卡牌奖励 | 🔴 | |
| Large Capsule | Neow | 拾取时获得 2 件随机遗物，加一张打击一张防御 | 🟡 | 拾取时给遗物 |
| Lava Rock | Neow | 第一幕 Boss 掉 2 件遗物 | ⚪ | materials.md 已规划为熔岩石遗物 |
| Lead Paperweight | Neow | 拾取时二选一无色牌 | 🔴 | |
| Leafy Poultice | Neow | 变化一张打击一张防御，−12 最大生命 | 🔴 | |
| Lost Coffer | Neow | 一份卡牌奖励 + 一瓶随机药水 | 🔴 | |
| Massive Scroll | Neow | 三选一多人牌 | 🔴 | |
| Neow's Bones | Neow | 获得 2 件随机尼奥遗物，加一张随机诅咒 | 🟡 | 拾取时给遗物 + 诅咒附魔 |
| Neow's Sacrifice | Neow | 获得龙涎香和诅咒“内疚” | 🔴 | |
| Neow's Talisman | Neow | 升级一张打击一张防御 | 🔴 | |
| Neow's Torment | Neow | 加入“尼奥之怒” | 🔴 | |
| New Leaf | Neow | 变化一张牌 | 🔴 | |
| Nutritious Oyster | Neow | 拾取时 +11 最大生命 | 🟡 | 同水果的生命上限机制 |
| Phial Holster | Neow | +1 药水栏，获得 2 瓶随机药水 | 🔴 | MC 没有药水栏 |
| Pomander | Neow | 升级一张牌 | 🔴 | |
| Precarious Shears | Neow | 删 2 张牌，受到 16 伤害 | 🔴 | |
| Precise Scissors | Neow | 删 1 张牌 | 🔴 | |
| Scroll Boxes | Neow | 二选一卡包 | 🔴 | |
| Silken Tress | Neow | 失去所有金币，第一份卡牌奖励全部附魔“华丽” | 🔴 | |
| Silver Crucible | Neow | 前 3 份卡牌奖励已升级；第一个宝箱是空的 | 🔴 | |
| Small Capsule | Neow | 拾取时获得一件随机遗物 | 🟡 | 拾取时给遗物 |
| Stone Humidifier | Neow | 在休息处休息时 +5 最大生命 | 🟡 | 睡床 + 生命上限，要设上限 |
| Winged Boots | Neow | 3 次可以不按路线选下一个房间 | 🔴 | |
| Alchemical Coffer | Orobas | +4 药水栏并装满随机药水 | 🔴 | |
| Archaic Tooth | Orobas | 把一张初始牌变成先古版 | 🔴 | |
| Driftwood | Orobas | 每份卡牌奖励可以重抽一次 | 🔴 | |
| Electric Shrymp | Orobas | 给一张技能附魔“灌注” | 🔴 | |
| Glass Eye | Orobas | 获得 2 普通、2 罕见、1 稀有牌 | 🔴 | |
| Prismatic Gem | Orobas | 每回合 +1 能量；卡牌奖励含其他颜色 | 🔴 | |
| Radiant Pearl | Orobas | 战斗开始加一张“辉光”到手里 | 🔴 | |
| Sand Castle | Orobas | 升级 6 张随机牌 | 🔴 | |
| Sea Glass | Orobas | 看 15 张其他角色的牌，任选加入 | 🔴 | |
| Touch of Orobas | Orobas | 把初始遗物换成先古版 | 🟡 | 燃烧之血 → Black Blood 等，要先做先古版初始遗物 |
| Pael's Blood | Pael | 回合开始多抽 1 张 | 🔴 | |
| Pael's Claw | Pael | 所有防御附魔“黏稠” | 🔴 | |
| Pael's Eye | Pael | 每场首次不出牌结束回合时，消耗手牌并多一个回合 | 🔴 | |
| Pael's Flesh | Pael | 第 3 回合起每回合 +1 能量 | 🔴 | |
| Pael's Growth | Pael | 给一张牌附魔“克隆” | 🔴 | |
| Pael's Horn | Pael | 加入 2 张“放松” | 🔴 | |
| Pael's Legion | Pael | 一次从牌获得的格挡翻倍，然后沉睡 2 回合 | 🟡 | 要“获得伤害吸收”钩子 + 冷却 |
| Pael's Tears | Pael | 回合结束有剩余能量时，下回合 +2 能量 | 🔴 | |
| Pael's Tooth | Pael | 删 5 张牌，每场战斗后随机加回一张升级版 | 🔴 | |
| Pael's Wing | Pael | 可以把卡牌奖励献给 Pael，每献 2 次得一件遗物 | 🔴 | |
| Biiig Hug | Tezcatara | 删 4 张牌；洗抽牌堆时加一张烟灰 | 🔴 | |
| Golden Compass | Tezcatara | 第二幕地图换成一条特殊路线 | 🔴 | |
| Nutritious Soup | Tezcatara | 所有打击附魔“特斯卡塔拉之焰” | 🔴 | |
| Pumpkin Candle | Tezcatara | 每回合 +1 能量；5 场战斗后熄灭，可在休息处重新点燃 | 🔴 | |
| Seal of Gold | Tezcatara | 回合开始花 3 金币换 1 能量 | 🔴 | |
| Storybook | Tezcatara | 加入“最亮之焰” | 🔴 | |
| Toasty Mittens | Tezcatara | 回合开始消耗一张手牌，+1 力量 | 🔴 | |
| Toy Box | Tezcatara | 获得 5 件蜡制遗物，每 3 场战斗融化最左边一件 | 🟡 | 限时遗物（按战斗数失效） |
| Very Hot Cocoa | Tezcatara | 战斗开始 +4 能量 | 🔴 | |
| Yummy Cookie | Tezcatara | 升级 4 张牌 | 🔴 | |
| Beautiful Bracelet | Nonupeipe | 4 张随机牌附魔“迅捷 2” | 🔴 | |
| Blessed Antler | Nonupeipe | 每回合 +1 能量；战斗开始洗入 3 张晕眩 | 🔴 | |
| Brilliant Scarf | Nonupeipe | 每回合第 6 张牌免费 | 🔴 | |
| Delicate Frond | Nonupeipe | 战斗开始把空药水栏装满 | 🟡 | 改成战斗开始给一瓶随机药水 |
| Diamond Diadem | Nonupeipe | 战斗开始 20 格挡，第 2 回合不清空 | 🟢 | 战斗开始给伤害吸收 |
| Fur Coat | Nonupeipe | 标记 8 场战斗，其中敌人只有 1 生命 | 🔴 | |
| Glitter | Nonupeipe | 所有卡牌奖励附魔“华丽” | 🔴 | |
| Jewelry Box | Nonupeipe | 加入“神化” | 🔴 | |
| Looming Fruit | Nonupeipe | 拾取时 +31 最大生命 | 🟡 | 同水果的生命上限机制 |
| Signet Ring | Nonupeipe | 拾取时获得 888 金币 | 🟡 | 拾取时给绿宝石 |
| Claws | Tanx | 最多 6 张牌变成“撕咬” | 🔴 | |
| Crossbow | Tanx | 回合开始加一张随机攻击，本回合免费 | 🔴 | |
| Iron Club | Tanx | 每打出 4 张牌抽 1 张 | 🔴 | |
| Meat Cleaver | Tanx | 可在休息处烹饪 | 🟡 | 可对应营火烹饪加成 |
| Sai | Tanx | 回合开始获得 7 格挡 | 🟢 | 战斗中每 3 秒给伤害吸收 |
| Spiked Gauntlets | Tanx | 每回合 +1 能量；能力牌 +1 费 | 🔴 | |
| Tanx's Whistle | Tanx | 加入“口哨” | 🔴 | |
| Throwing Axe | Tanx | 每场第一张牌打两次 | 🟢 | 每场首击伤害结算两次 |
| Tri-Boomerang | Tanx | 选 3 张攻击附魔“本能” | 🔴 | |
| War Hammer | Tanx | 击杀精英时升级 4 张随机牌 | 🔴 | 触发能做（精英击杀），效果要另想 |
| Blood-Soaked Rose | Vakuu | 加入诅咒“着迷”；每回合 +1 能量 | 🔴 | |
| Choices Paradox | Vakuu | 战斗开始五选一加到手里并保留 | 🔴 | |
| Distinguished Cape | Vakuu | 加 2 张随机诅咒和 3 张“幻影” | 🔴 | |
| Fiddle | Vakuu | 回合开始多抽 2 张；回合内不能再抽牌 | 🔴 | |
| Jeweled Mask | Vakuu | 战斗开始从抽牌堆拿一张能力牌到手里，本场免费 | 🔴 | |
| Lord's Parasol | Vakuu | 遇到商人时直接获得他卖的所有东西 | 🟡 | 商人 |
| Music Box | Vakuu | 每回合第一张攻击生成一张虚无复制 | 🔴 | |
| Preserved Fog | Vakuu | 删 3 张牌，加入诅咒“愚行” | 🔴 | |
| Sere Talon | Vakuu | −9 最大生命，加入 3 张“愿望” | 🔴 | |
| Whispering Earring | Vakuu | 每回合 +1 能量；第一回合由 Vakuu 代打 | 🔴 | |
| Astrolabe | Darv | 变化 3 张牌并升级 | 🔴 | |
| Black Star | Darv | 精英多掉一件遗物 | 🟡 | 精英判定 + 掉落 |
| Calling Bell | Darv | 获得一个独特诅咒和 3 件遗物 | 🟡 | 拾取时给遗物 + 诅咒附魔 |
| Dusty Tome | Darv | 获得一张先古牌 | 🔴 | |
| Ectoplasm | Darv | 不能再获得金币；每回合 +1 能量 | 🔴 | |
| Empty Cage | Darv | 删 2 张牌 | 🔴 | |
| Pandora's Box | Darv | 变化所有打击和防御 | 🔴 | |
| Philosopher's Stone | Darv | 每回合 +1 能量；所有敌人开局 +1 力量 | 🔴 | |
| Runic Pyramid | Darv | 回合结束不再弃手牌 | 🔴 | |
| Snecko Eye | Darv | 回合开始多抽 2 张；战斗开始混乱 | 🔴 | |
| Sozu | Darv | 每回合 +1 能量；不能再获得药水 | 🔴 | |
| Velvet Choker | Darv | 每回合 +1 能量；每回合最多打 6 张牌 | 🔴 | |

## 特殊（1）

| 遗物 | STS2 效果 | 分类 | 备注 |
|---|---|---|---|
| Circlet | 没有效果（遗物池抽空时的占位） | 🟢 | 可作为遗物战利品表抽空时的保底 |
