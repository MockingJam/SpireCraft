# 交接 / Handoff（2026-11-18）

## 当前任务（用户原话要点）
模型太简陋，要重做：体型越大越不能几个方块了事——细看并调整每个部位（大小腿粗细、眼睛牙齿耳朵嘴巴大小、毛发/羽毛、胸颈肩腹背腰胯、手掌）；人形不要做成原版人形，要贴合 STS2 原著；先列每个生物的特征再建模和做动画。
补充：**不要阶梯/锯齿状**，同一部位也可用**斜方块**拼接，尤其 Boss、精英、大型怪。

## 已完成
- `tools/mobs/kit.js`：建模工具。`loft`（截面拼接，阶梯状——尽量少用）、`figure`（可调比例人形）、`limb`、`fin`、`eyeDetail`、`fringe`、**`rotBox`（单个斜块）**、**`octo`（八角棱柱，四条棱用 45° 斜块倒角，axis 'x'/'y'/'z'，核心块不重叠）**。
- `tools/mobs/specs_v7.js`（在 specs.js 末尾 Object.assign 覆盖旧模型）：8 个 Boss（灵魂异鱼、帝王蟹、知识恶魔、墨魇、同族祭司、瀑布巨人、拉格夫林女族长、贪食者）、11 个人形、7 个精英、16 个普通怪已按特征重做——但大多仍用 `loft` 阶梯拼法。
- Boss 绘制比例已改：帝王蟹 1.5、知识恶魔 1.4、灵魂鱼 1.8（`client/mob/SpireMobRenderer.java`）；数据驱动 Boss 的比例在 `mob/ScriptedDefs.java` 的 `.size(w, h, scale)`。

## 下一步
1. 用 `octo` / `rotBox` 把 Boss、精英、大型怪身体的阶梯 `loft` 换成斜块：灵魂异鱼身体（`octo` axis 'x'，侧面轮廓倒角；头部前额/下巴用斜块）、帝王蟹甲壳与钳、知识恶魔躯干与盘腿、墨魇身体、瀑布巨人（随机倾斜的岩块）、女族长石壳（倾斜卵石）、贪食者（环节 octo + 喇叭口用一圈外翻斜片）、寄生棱晶（斜面拼成四面体）、蛙形寄生虫囊、撕咬兽躯干、十节蜈蚣体节。
2. 其余普通怪（inklet、eye_with_teeth、snapping_jaxfruit、slithering_strangler、cubex_construct、wriggler、living_fog、gas_bomb、tough_egg、hatchling、parafright、四种盛碗虫、外骨骼虫、咬咬机、螨）也按特征细化。
3. 检查动画骨骼名仍匹配（`client/mob/SpireMobModel.java`；数据驱动怪用通用动画 `scripted()`，按骨骼名 body/head/jaw/arm_l/arm_r/leg_*/tail*/seg_*/wing_*/tent_*/orbit/cape 驱动）。
4. 文档：在 `docs/design/mobs.md` 末尾加“十二、模型 v7/v8”小节（中英双语）。

## 命令
- 生成模型与贴图：`node tools/mobs/build_mobs.js`（会写 `client/model/MobLayers.java` 和 `textures/entity/*.png`；方块尺寸必须是整数）
- 离线预览：`node tools/mobs/render.js <out.png> <名字> --views=front,side,back`
- 编译+数据：`JAVA_HOME=D:/MCmodev/Forge1.21.10-Lazypack/runtime/jdk-21.0.9+10 ./gradlew.bat compileJava runData --offline --no-daemon "-Dnet.minecraftforge.gradle.check.certs=false" -g ../Forge1.21.10-Lazypack/.gradle_repo`
- 自测：`powershell -File tools/selftest.ps1`（应为 0 failure）
- 游戏截图：`powershell -File tools/shots.ps1 <脚本.txt>` → `run/screenshots/`
- 参考原画：`https://slaythespire.wiki.gg/images/StS2_<Name>.png`

## 规则
不要动 `D:\MCmodev\Forge1.21.10-Lazypack`；不要杀所有 java 进程；不要提交；bash 里不要用 heredoc 写文件（会卡住），用 Write 工具。
