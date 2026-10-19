---
title: "开源雷达 Vol. 02：Agent 插件市场的圈地运动与上下文工程学"
description: "复盘 2026 年第 43 周 GitHub Trending：Anthropic 官方插件目录首次进榜、Cursor 插件规范连续在榜、context-mode 以 17 平台统一路由重回前十，标志 Agent 扩展生态正从「野生 Skills」走向「有清单的市场」；Ghidra 连续两周增长，印证逆向工程正被 Agent 重新激活。"
pubDate: 2026-10-19
tags: ["开源", "GitHub", "趋势", "Agent", "工程"]
---

上一期（[Vol. 01](/blog/github-trending-weekly-2026-w42)）我关注的是智能体如何**向下扎进二进制**——`rea` 用假设驱动的方式接管逆向工程。一周过去，榜单的画风出现了一个明确的转折：**Anthropic 的官方插件目录首次挤进前十**，而一个专门**阻止工具输出进入上下文窗口**的中间件（`context-mode`）在缺席四周（W39–W42）后重回榜单，直接站上第 5。

这说明竞争重心正在从「模型能做什么」转向「**第三方能力如何被分发、被治理，以及什么有资格占用上下文预算**」。

> 数据快照：2026-10-19 抓取的 [GitHub 每周热榜](/trending) 周榜，星数为当时值，一周内仍会继续变动。

---

## 一、本周结构性变化：插件开始有「清单」了

先看榜单。本周 Top 10 中有 6 个是上周的原班人马（`rea`、`AnyPS5`、`hyperframes`、`diagram-design`、`ghidra`、`cursor/plugins`），四个新面孔是 `artcraft`、`claude-plugins-official`、`context-mode` 与 `ai-job-search`。而上周还在榜的 `mattpocock/skills`、`billion-context`、`text-to-cad` 等已退出——**榜单换血集中在「Agent 周边设施」，而非模型本身**。

| 项目 | 语言 | 星数 | 本周新增 | 定位 |
| :--- | :--- | ---: | ---: | :--- |
| `morluto/rea` | TypeScript | 327.7k | +229k | Agent 逆向工程 MCP |
| `NationalSecurityAgency/ghidra` | Java | 91.1k | +7.6k | 老牌逆向框架（连续第二周在榜） |
| `heygen-com/hyperframes` | TypeScript | 67.1k | +5.9k | HTML 直出视频 |
| `cathrynlavery/diagram-design` | HTML | 58.0k | +7.9k | 44 种编辑级图表技能 |
| `MadsLorentzen/ai-job-search` | Python | 54.5k | +5.7k | Claude Code 求职工作流 |
| `boykopovar/AnyPS5` | C++ | 43.6k | +14.2k | PS5 可执行文件跨平台转译 |
| **`anthropics/claude-plugins-official`** | Python | **42.9k** | **+4.8k** | **官方插件目录（新）** |
| `storytold/artcraft` | Rust | 33.1k | +16.4k | 面向创作者的 AI 影像 IDE |
| **`mksglu/context-mode`** | TypeScript | **30.9k** | **+4.1k** | **上下文优化 MCP（新）** |
| **`cursor/plugins`** | TypeScript | **12.9k** | **+1.7k** | **Cursor 插件规范** |

两个「官方目录」同台，不是巧合。Anthropic 的目录是**新建**（首次进榜），Cursor 的规范则是**连续第三周在榜**（W41 第 5、W42 第 11、W43 第 9）——一条典型的「先有规范，再有市场」的爬坡曲线。

### 1.1 `anthropics/claude-plugins-official`：把插件变成有版本契约的制品

这个仓库最值得读的不是插件列表，而是它的**目录结构约定**：

```
plugin-name/
├── .claude-plugin/
│   └── plugin.json      # 元数据（必需）
├── .mcp.json            # MCP 服务器配置（可选）
├── commands/            # 斜杠命令（可选）
├── agents/              # 子代理定义（可选）
├── skills/              # 技能定义（可选）
└── README.md
```

`commands / agents / skills` 三个目录的并列，其实是在给「Agent 能力」做一次**分层抽象**：命令是用户的显式入口，代理是并行的执行单元，技能是可复用的知识片段。三者解耦后，插件就能像 npm 包一样被组合。

更值得玩味的是它对**命名不可变性**的强制约束：`plugin.json` 里的 `name` 是不可变 slug，一旦发布就禁止重命名，因为用户已经以该 slug 安装；要改展示名只能动 `displayName`；如果非要重命名，必须在顶层维护一张 `renames` 映射表，由加载器在下次同步时透明迁移。

这套设计背后是血的教训。**凡是能被安装的东西，其标识符就变成了公共 API**。Python 包、npm 包、Docker 镜像都在这上面栽过跟头，Agent 插件市场在诞生第一年就把这条规则写进了规范，算是后发优势。

同时它明确划清了责任边界：Anthropic 不控制插件内含的 MCP 服务器与文件，也不保证其行为不会变更，安装前需自行审查。这句话出现在官方目录的 README 顶部，比任何安全白皮书都诚实。

### 1.2 `cursor/plugins`：另一套规范的正面竞争

Cursor 走的是并行路线，用 `.cursor-plugin/plugin.json` 作为清单，仓库里既有自研插件（`thermos` 分支审查、`orchestrate` 云代理编排、`ralph-loop` 自指循环），也有第三方集成（Gmail、Google Drive、Salesforce 系列）。

其中 `cli-for-agent` 这个插件描述了一类很有意思的设计知识：**如何设计命令行工具，让编码 Agent 能可靠地驱动它**——显式 flag、带示例的 help、管道友好、错误可读、幂等、`--dry-run`。这份清单本质上是把「人机双读的 CLI 契约」写成了规范。

而 `continual-learning` 只做一件小事：把会话记录增量提炼成高信号的 AGENTS.md 条目。**用最少的话把经验写进常驻上下文**——这恰好是下一个话题。

两套规范并存，短期内不会统一。但方向已经清楚：**插件清单会成为 Agent 时代仅次于 `package.json` 的第二份元数据**。

---

## 二、上下文工程：从「塞更多」到「少放点」

`mksglu/context-mode` 是本周最值得工程团队细读的项目。它给出的数字非常刺眼：

| 操作 | 原始体积 | 进入上下文 |
| :--- | ---: | ---: |
| Playwright 页面快照 | 56 KB | — |
| 20 条 GitHub issue | 59 KB | — |
| 单份访问日志 | 45 KB | — |
| 典型工具调用聚合 | 315 KB | **5.4 KB** |

官方口径是 **98% 的上下文削减**。它靠的不是摘要模型，而是三件更朴素的事：

1. **工具输出沙箱化**：原始数据落在磁盘/SQLite，只有结论进入窗口。
2. **会话连续性用索引而非回放**：每次文件编辑、git 操作、任务状态、用户决策都落库，压缩后不重新灌回上下文，而是建 FTS5 索引，按 BM25 检索相关片段。
3. **Think in Code**：不要让模型当数据处理器，让它写脚本处理数据。

第三条最容易被忽略，但收益最大。举个例子——统计 `src` 下每个 TS 文件的行数：

```js
// 反模式：47 次 Read() ≈ 700 KB 进窗口
// 正模式：1 次脚本执行 ≈ 3.6 KB 进窗口
const files = fs.readdirSync('src').filter(f => f.endsWith('.ts'));
files.forEach(f => console.log(f + ': ' + fs.readFileSync('src/' + f, 'utf8').split('\n').length + ' lines'));
```

**「读文件」和「分析文件」是两种不同的动作，前者消耗上下文，后者消耗 CPU。** 我们长期把两者混为一谈，只是因为早期的 Agent 没有可靠的代码执行能力。

还有一个设计取舍值得称赞：它明确**不规定模型该怎么说话**。项目 README 里直接引用了「过度简洁的提示词会拉低编码与推理基准」的研究结论，把路由规则限定在「数据往哪走」，而不是「话该怎么说」。这是一个成熟的基础设施应有的克制——**优化吞吐，而不是改造人格**。

它通过 MCP + hooks 覆盖 17 个平台（Claude Code、Codex、Cursor、OpenCode、Zed、Copilot、Kiro、Pi 等），这本身也说明了当下的现实：**没有任何一家能独占 Agent 运行时，跨平台适配层是刚需**。

---

## 三、逆向工程的第二春

`NationalSecurityAgency/ghidra` 以 91.1k 星、单周 +7.6k 连续第二周留在榜上，这是一件颇有象征意义的事——一个 2019 年开源的 Java 逆向框架，在 2026 年因为 Agent 的接入重新获得增长（本周 +7.6k 甚至高于上周的 +6.6k）。

原因不难理解。`rea` 这类工具的定位是**编排层**：它把 Ghidra、Hopper、IDA、Frida、JADX 当作可调用的分析引擎，自己负责提出假设、注入动态探针、验证边界条件、迭代重构伪代码。引擎越强，编排层的产出质量越高，于是老牌工具被重新拉回聚光灯下。

我在自己的环境里跑通了这条链路（`rea-agents` + Ghidra 12.1.4 + JDK 21），一个必须记下来的坑是：**Ghidra 官方发行包在 Linux ARM64 上不含预编译反编译器**，需要自行进入 `Decompiler/src/decompile/cpp` 编译：

```bash
make ghidra_opt ARCH_TYPE= OSDIR=linux_arm_64
# 产物安装到 Ghidra 的 os/linux_arm_64/decompile 目录
```

这类「官方包缺架构支持」的坑，在没有 Agent 的年代往往要耗掉半天；现在可以让 Agent 读构建日志、比对 Makefile 目标、逐步试错——**这正是 Agent 最擅长、也最容易被低估的场景：不是写新代码，而是把别人的构建系统跑通。**

---

## 四、其余值得一看

- **`storytold/artcraft`（Rust，+16.4k）**：自称「艺术家的 IDE」，把 AI 图像/视频生成放进一个可精确控制的 2D/3D 合成工作台。核心思路是**先搭场景再生成**——用虚拟演员、镜头位、深度图层替代纯提示词抽卡。生成式内容要进入生产流程，可控性比想象力更重要。
- **`heygen-com/hyperframes`（TypeScript，+5.9k）**：HTML + CSS + 可寻址动画 → 确定性 MP4。把 Puppeteer、GSAP、FFmpeg 缝成一条可复现的渲染管线。「确定性」是关键词：同样的输入必须产出逐帧一致的输出，否则无法进 CI。
- **`MadsLorentzen/ai-job-search`（Python，+5.7k）**：作者是地球物理学家，2025 年底被裁后写了这套 Claude Code 工作流，69 份定制申请、20 次一面、1 份合同，2026 年 6 月入职 AI 工程师。仓库本身就是一份完整的「用 Agent 重构个人工作流」的实证。
- **`cathrynlavery/diagram-design`（HTML，+7.9k）**：44 种编辑级图表模板，自包含 HTML + SVG，README 里那句 "No shadows. No Mermaid slop." 说出了很多人的心声——**图表的美学下限，不该由绘图库的默认主题决定**。

---

## 五、小结：基础设施正在收敛

把两周的榜单连起来看，脉络其实很清晰：

| 阶段 | 特征 | 代表 |
| :--- | :--- | :--- |
| 2025 | 单点工具爆发，各家自己造轮子 | 早期 MCP 服务器 |
| 2026 上半年 | 技能（Skills）标准化，知识可复用 | `mattpocock/skills` |
| **2026 Q4** | **插件市场 + 上下文治理 + 跨平台路由** | `claude-plugins-official`、`context-mode` |

模型能力的边际提升正在放缓，而**围绕模型的工程约束正在快速成型**：插件要有清单和不可变标识，上下文要有预算和路由，工具输出要有沙盒和索引，跨平台要有适配层。

值得留意的是，本周星数增量最大的仍是 `rea`（+22.9 万），但**它上周就在榜（W42 +23.9 万），属于存量爆发而非新晋**；真正反映趋势转向的是新进入者的构成——四个新面孔里，两个是分发基础设施，一个是上下文中间件，剩下一个是具体应用场景（求职）。**当工具层开始给自己立规矩时，说明这一层已经过了野蛮生长期。**

---

本周的完整榜单（含历史周次、语言分布与增长排序）在 [GitHub 每周热榜](/trending)，每周五自动更新。

如果只能从这期带走一句话，我希望是这句：**上下文不是仓库，是预算。**
