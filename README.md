# 🚀 Minecraft 模组开发 AI 极速入门懒人包

### —— 你的创意，交给 AI 来实现

这是一个专为“有想法、没基础”的创作者准备的 Minecraft 模组开发环境。本项目剥离了冗长的传统编程教学，核心思路是：**利用 AI 作为你的首席程序员，而你只需要负责灵感和指令**。

---

## 🌟 核心亮点

* **零代码起步**：不需要系统学习 Java 语法。通过预设的 AI 提示词（Prompt），你可以通过描述文字生成模组功能。
* **环境全集成**：内置已调试完毕的开发环境，跳过最枯燥的配环境步骤，直接进入创作环节。
* **高效复用模板**：提供高度解耦的底层代码模板。你只需要修改材质和基础参数，即可快速产出属于自己的模组。
* **AI 深度适配**：本工具包专门针对 ChatGPT、Claude、Cursor 等主流 AI 进行了代码优化，确保 AI 生成的代码兼容性更高。

## 📦 包含内容

1. **万能模组模板代码**：支持快速修改注册、属性和交互逻辑。
2. **AI 提问指令库（Prompt List）**：教你如何精准喂给 AI 指令，让它产出直接可用的代码。
3. **极简操作指南**：3 分钟内完成环境启动。

## 开发版本与构建

本工程面向 Minecraft **1.21.10**，使用 Forge **60.1.0**、Java **21**、Gradle Wrapper **8.12.1** 和 ForgeGradle **6.0.54**。
映射使用 Mojang 官方 `1.21.10`，移除了原先浮动选择开发快照且仓库连接失败的 Parchment/Librarian 依赖。切换后请重新同步 Gradle 项目。
EventBus 及其注解处理器均为 `7.0-beta.12`，升级 Forge 时需一并核对。

- 模组仅声明兼容 Minecraft `1.21.10`，Forge 范围为 `[60.1.0,61)`；其他游戏版本需重新适配和验证。
- `pack.mcmeta` 的 `69–88` 范围同时覆盖本版本的资源格式 `69` 和数据格式 `88`，不可将资源格式误写成仅支持 `88`。
- Windows 内置 JDK 位于 `runtime/jdk-21.0.9+10`。IntelliJ 请将项目 SDK 设为此 JDK 21，Gradle JVM 使用项目 SDK；VS Code 的 Gradle 导入已指向内置 JDK 和 `.gradle_repo`。
- WSL/Linux 需要单独安装 Linux JDK 21，内置 Windows JDK 无法由 Linux `gradlew` 直接使用。

Windows PowerShell 手动构建：

```powershell
$env:JAVA_HOME = "$PWD/runtime/jdk-21.0.9+10"
./gradlew.bat build --no-daemon -g ./.gradle_repo
```

首次构建需要联网解析插件和依赖。当前版本的产物位于 `build/libs/spirecraft-0.1.0.jar`。

向 `main` 提交 PR 或推送后，[SpireCraft CI](https://github.com/MockingJam/SpireCraft/actions/workflows/ci.yml) 会并行检查资源 JSON（含 `.mcmeta`）和构建 Forge 模组。在运行详情的 **Artifacts** 中可直接下载 JAR，产物保留 14 天。

## 🛠️ 快速上手

1. **解压**本项目到本地目录。
2. **启动**开发工具（推荐使用 Cursor 或 IntelliJ IDEA）。
3. **投喂**：使用我的前置 `Prompt` 指令，将你的创意告诉 AI。
4. **编译**：点击运行脚本，见证你的第一个 Minecraft 模组诞生！

## 💡 为什么选择这种方式？

传统的模组开发周期长、门槛高。本项目的核心竞争力是**效率**。我们不提倡死磕硬核技术，而是教你如何成为“比观众多懂一步”的**AI 创作官**。

---

## 🤝 交流与进阶

* **加入社区**：获取更多高阶 Prompt 库与源码包。
* **教程支持**：在 B站 和 抖音 搜索我的频道，看我如何用 AI 10 分钟内复刻离谱模组！

---