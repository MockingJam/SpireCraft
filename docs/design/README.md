# 内容设计表

每类内容一张表。新内容**先登记在表里，再写代码**。状态列：`构思` → `已确认` → `已实现` → `已贴图` → `游戏内验证`。

| 文件 | 内容 | 对应阶段 |
|---|---|---|
| [effects.md](effects.md) | 尖塔状态效果 | 2 |
| [items.md](items.md) | 材料、矿物、食物、药水、遗物、武器工具 | 3–6 |
| [blocks.md](blocks.md) | 方块 | 3、7 |
| [biomes.md](biomes.md) | 群系 | 7 |
| [mobs.md](mobs.md) | 生物 | 8 |
| [structures.md](structures.md) | 结构 | 9 |

## 规则

- **注册名**：英文小写下划线（`burning_blood`），尽量用 STS2 英文原名直译。
- **中文名**：采用 STS2 官方中文译名；自创内容在“出处”列写“自创”。
- **出处核对**：STS2 原有内容需在 wiki 核对名称与形态（sts2.huijiwiki.com 拒绝自动访问，目前用 slaythespire.wiki.gg），核对后在“核对”列打 ✓。
- **贴图**：16×16 原版风格像素画，规则见 [art_style.md](art_style.md)（项目技能 spirecraft-pixel-art）。除工具/盔甲外形外，不拿原版贴图简单改色充当新物品。

## 贴图方法（按内容选择）

| 内容 | 方法 |
|---|---|
| STS2 中有图标的（遗物、药水、水果等） | 以 STS2 图标为参考：保留其轮廓、配色和标志性细节，按 16×16 重新手绘（不是直接缩小，直接缩小会糊） |
| 自创内容（粗矿、作物等） | 参考现实（如黑钨矿是黑色板状晶体、硫磺是黄色晶簇），按原版物品的画风自行设计 |
| 工具、盔甲物品 | **外形直接沿用原版**（同类原版物品的轮廓与明暗），只换材质配色并加细节（如钨合金的铆钉） |
| 矿石方块 | 原版母岩 + 自绘矿点（形状多变、大小一致、彼此分离、各自有金属/晶体光泽） |
| 穿戴盔甲 | 沿用原版的 UV 布局和内部明暗，换材质并加细节（钨合金铆钉、奥利哈钢金边） |
| 与原版物品同源的（如紫水晶茄子由紫水晶合成） | 直接用原版材质的纹理（原版紫水晶块） |

## 美术工作流

1. 打开 Blockbench（MCP 插件自动在 39287 端口启动服务）。
2. 贴图定义在 `tools/pixel_art_defs.js`（几何形状生成或以原版同类贴图为底），由 `tools/draw_pixel_art.js` 在 Blockbench 中渲染（体积光照、渐变混色、原版纹理叠加），规则见 [art_style.md](art_style.md)：
   - `node tools/draw_pixel_art.js <原版资源解压目录> [名称过滤]`，然后 `node tools/bb.mjs call risky_eval a.json`
   - 效果图标：`tools/draw_effect_icons.js`
   - 本会话的 MCP 工具未连接时，`node tools/bb.mjs list / call <工具名> <参数.json>` 可直接调用 Blockbench。
3. 贴图写入 `src/main/resources/assets/spirecraft/textures/<item|block|entity|mob_effect>/`，Blockbench 工程存 `art/`。
4. 在 datagen（`ModModelProvider`、`ModLanguageProvider`）登记，运行 runData，再 runClient 检查。
- [relics.md](relics.md) — 遗物袋与遗物（阶段 5）
- [weapons.md](weapons.md) — 角色武器（阶段 6，草案）
