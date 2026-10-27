---
title: "开源雷达 Vol. 03：大厂官方下场，技能开始有校验器了"
description: "复盘 2026 年第 44 周 GitHub Trending：15 个席位 8 进 7 留，前两名分别是 Cloudflare 与 Anthropic 的官方仓库；Cloudflare 把安全审计拆成六阶段流水线加两个校验器，Google 用 eval 结果决定 Android 技能写什么——技能正从「提示词技巧」变成「带验收标准的制品」。同时本周总星第一是个停更 190 天的 markdown 文件，星数第一次公开失灵。"
pubDate: 2026-10-27
tags: ["开源", "GitHub", "趋势", "Agent", "工程"]
---

上一期（[Vol. 02](/blog/github-trending-weekly-2026-w43)）的结论是：Agent 扩展生态正从「野生 Skills」走向「有清单的市场」。一周之后，**做清单的人换了一批**——本周榜单前两名，一个是 Cloudflare 的安全审计技能，一个是 Anthropic 的官方插件库。

个人作者还在写技能，但话语权正在快速向机构转移。而机构带来的不只是资源，是一套**验收方式**。

> 数据快照：2026-10-27 抓取的 [GitHub 每周热榜](/trending) 周榜（W44 为周内快照，周五前榜单仍会变动），星数为当时值。

## 一、换人：8 进 7 留，注意力明显分散

先纠正一个容易看错的地方：这周并没有「全榜换血」。15 个席位里 7 个上周就在：

| 类型 | 数量 | 项目 |
| :--- | ---: | :--- |
| 连续在榜 | 7 | `ruflo`、`opencode`、`orca`、`android/skills`、`ai-memory`、`ComfyUI`、`hyperframes` |
| 历史首次 | 7 | `security-audit-skill`、`graphify`、`andrej-karpathy-skills`、`TradingAgents`、`wshobson/agents`、`claude-seo`、`t3code` |
| 回流 | 1 | `knowledge-work-plugins`（W38–W39 在榜，缺席四周） |

完整榜单：

| 项目 | 语言 | 星数 | 周增 | 说明 |
| :--- | :--- | ---: | ---: | :--- |
| **`security-audit-skill`** | JavaScript | 48.8k | **+16.6k** | Cloudflare 官方，六阶段安全审计 |
| `knowledge-work-plugins` | Python | 33.3k | +2.8k | Anthropic 官方，面向知识工作者 |
| `ruflo` | TypeScript | 79.6k | +2.7k | 多 Agent 集群编排 harness |
| `opencode` | TypeScript | 222.0k | +5.1k | 开源编码 Agent |
| `orca` | TypeScript | 107.2k | +9.2k | 多 Agent 控制台 |
| `graphify` | Python | 136.3k | +7.2k | 代码库 → 知识图谱 |
| `android/skills` | Kotlin | 9.9k | +823 | Google 官方，Android 技能 |
| `ai-memory` | Rust | 13.9k | +2.8k | 跨 Agent 长期记忆 |
| `andrej-karpathy-skills` | — | 224.8k | +3.3k | 单个 CLAUDE.md 文件 |
| `TradingAgents` | Python | 116.4k | +3.4k | 多 Agent 金融交易框架 |
| `wshobson/agents` | Python | 41.8k | +689 | 多客户端插件市场 |
| `hyperframes` | TypeScript | 73.2k | +5.5k | HTML 直出视频 |
| `claude-seo` | Python | 22.2k | +2.5k | SEO 技能包（26 子技能） |
| `ComfyUI` | Python | 143.3k | +4.1k | 扩散模型 GUI（2023 年建仓） |
| `t3code` | TypeScript | 30.5k | +1.9k | Agent 控制面 |

语言分布：Python 6、TypeScript 5、JavaScript 1、Kotlin 1、Rust 1，另有 1 个**纯 Markdown 仓库**（无代码语言）。

### 热度确实降了，但没榜首数字那么吓人

两期榜单都是 15 项，可以直接对比：

| 指标 | W43 | W44 | 变化 |
| :--- | ---: | ---: | :--- |
| 榜首周增 | 106,341（`rea`） | 16,593 | **−84.4%** |
| 周增合计 | 176,631 | 68,741 | −61.1% |
| 剔除榜首后合计 | 70,290 | 52,148 | −25.8% |
| 中位周增 | 4,375 | 3,286 | −24.9% |
| 前三名占总增量 | 73.2% | 48.0% | 注意力分散 |

上周 60.2% 的增量由 `rea` 一家贡献，本周它直接掉出榜单。剔除这个异常值后，总量仍降了 25.8%——**降温是真的，只是没有 −84% 那么戏剧化**。

更值得注意的是最后一行：前三名占比从 73.2% 掉到 48.0%。榜单从「一条大鱼带九条小鱼」变成了「十五条差不多大的鱼」。

> 口径说明：Trending 的「本周新增」是滚动 7 天窗口，不是自然周。上周快照取自周五（10-23），本周取自周二（10-27），窗口并不完全对齐，因此合计数只能看方向，不能当精确同比。

## 二、大厂官方下场：技能开始有「验收标准」

如果只看名字，本周一半项目都叫 `xxx-skill` / `xxx-plugins`，很容易当成又一轮概念炒作。但把两个官方仓库拆开看，内容是一套工程规范。

### 2.1 `security-audit-skill`：把审计拆成六个阶段

它不是「一段让模型找漏洞的提示词」，而是一条流水线：

| 阶段 | 产物 | 门禁 |
| :--- | :--- | :--- |
| 1 侦察 | `architecture.md`、`coverage-ledger.json` | 每阶段后跑 `validate-coverage-ledger.cjs` |
| 2 覆盖度驱动狩猎 | 每个 hunter 的检查记录 | 用 coverage critic 找覆盖缺口 |
| 3 候选验证 | 候选清单 | **每个候选交给全新 verifier 去证伪** |
| 4 结构化输出 | `findings.json` | 对照 `report-schema.json` 校验 |
| 5 独立记录校验 | 复核后的记录 | 记录被替换时，**再过一次独立校验** |
| 6 目标无关报告 | `REPORT.md` 等三份文档 | 由已验证记录推导，不重写结论 |

三个判定互斥且定义明确：`confirmed`（有完整来源链和可复现结果）、`needs_validation`（有一个确定未解决的事实，**且不给严重级别**）、`rejected`（已被证伪）。多次运行是叠加的——用历史 ledger 找缺口、只重验改动过的源码。

这套东西的来源也说明问题：它原本是 Cloudflare 内部漏洞发现 harness 的雏形，那套 harness 后来长成多阶段、全舰队系统，而开源出来的是它「长大的起点」。

> 关键词是**纪律**：拒绝把「疑似」当「确认」，也拒绝在证据不全时给 CVSS 分。这是安全团队被误报折磨多年后形成的规矩，现在被写进了技能里。

### 2.2 `android/skills`：用 eval 决定「写什么」

Google 官方的 Android 技能仓库，两条信息值得注意：

```bash
android skills add r8-analyzer --project=.
```

- **有安装器了**。技能按 `SKILL.md` 这个开放标准组织，可以通过 CLI 装进某个项目目录——形状完全等同于包管理器。
- **选题由评测驱动**。README 明说：只做「评测显示 LLM 表现不佳」的用例和工作流，不重复 LLM 已经擅长的部分（比如基础 Compose 最佳实践）。

第二条比第一条更重要。它意味着技能内容不再由「谁想写什么」决定，而由**能力缺口的测量结果**决定。

### 2.3 三个共同点

| 特征 | 早期 Skills（2026 上半年） | 本周这批 |
| :--- | :--- | :--- |
| 交付形态 | 一段提示词 / 一个 md 文件 | 目录 + 安装器 + 版本 |
| 输出 | 给人读的散文 | 带 schema 的机器可读记录 |
| 质量判断 | 看作者名气 | 校验器 + eval 结果 |
| 失败处理 | 模型自由发挥 | 显式 `needs_validation` 状态 |

上周是**上架**（清单、版本、目录），这周是**验收**（schema、状态机、复验）。货架之后，紧接着来的是质检。

## 三、上下文：从「拦下来」到「抽出来，再带走」

上周的 `context-mode` 是减法：拦住工具输出，别让它进上下文（315 KB 压到 5.4 KB）。这周的两个项目走的是另一条路。

**`graphify`：把仓库编译成图，而不是塞进向量库。**

- 代码用 tree-sitter 做 AST 解析，**确定性、纯本地、不调用模型**；
- 每条边都带来源标签：`EXTRACTED`（源码里明写）或 `INFERRED`（工具推断）；
- README 直接写明「不是向量索引，没有 embedding，没有向量库」。

这是刻意的取舍：向量检索给你「相似」，图给你「路径」。排查一个跨三层的调用链，你需要的是后者。

**`ai-memory`：把上下文变成可移交的协议。**

- 20 多个 harness（Claude Code、Codex、Cursor、Gemini CLI、OpenCode、Grok……）共享同一份记忆；
- handoff 是**类型化协议**，每个 handoff 有 owner，且**只能被认领一次**——这是分布式系统里的租约（lease）语义，用来防止两个 Agent 同时接着干同一件事；
- `ai-memory run codex` 能把整个会话带过去，而不只是一段摘要；
- 远程服务只收 harness 和 session 标识，**不收本地 transcript 的路径和内容**。

| 策略 | 代表 | 手段 | 代价 |
| :--- | :--- | :--- | :--- |
| 拦截 | `context-mode` | 压缩工具输出 | 丢细节 |
| 索引 | `graphify` | AST 图 + 边来源标注 | 语义部分仍需模型 |
| 移交 | `ai-memory` | 类型化 handoff | 需要跨工具约定协议 |

三种方案都不再问「窗口还有多大」，而是在问：**什么值得进去，以及谁负责证明它是对的。**

## 四、控制台战争：把「订阅」从模型里解耦

`orca`（第 5）和 `t3code`（第 15）在做同一件事，卖点高度一致：

- `orca`：「用**你自己的订阅**跑任意编码 Agent」，桌面 / 移动 / 远程 runtime；
- `t3code`：自称「agent harness control surface」，控制你机器上已有的 Agent，提供 iOS / Android / web / Electron 四个入口，并特意声明「我们不卖你任何东西」。

支持清单几乎重合：Claude Code、Codex、Cursor、Grok Build、OpenCode、Antigravity。`wshobson/agents` 的插件市场列了 7 个客户端，`ai-memory` 说 20 多个。

背后是一个很实际的转变：**模型和客户端解耦后，订阅变成了资产**，而资产需要调度面板。你在手机上点一下就能让家里的 Claude Code 接着跑——这已经跟「用哪个模型」无关了。

这也解释了 `opencode` 这类开源编码 Agent 为什么能反复在榜（222k 星）：它同时是这些控制台的**被调度对象**，控制台越多，被支持的 harness 收益越大。

### 一个不算结论的规律

把 7 个留存项目摊开看：3 个 harness / 控制台（`ruflo`、`opencode`、`orca`），2 个底层能力（`ai-memory`、`android/skills`），2 个垂直应用（`hyperframes`、`ComfyUI`）。

而 8 个新面孔里，**6 个是技能或插件制品**，只有 2 个是应用或控制台。

**技能在快速轮换，基础设施在慢慢沉淀。** 单周样本不足以说明趋势，但这个方向符合直觉：技能的成本低到一周能写出十个，基础设施没人愿意重写第二遍。

## 五、泼一盆冷水：22.4 万星的那份 markdown

本周总星数第一的不是什么框架，是 `multica-ai/andrej-karpathy-skills`：**22.48 万星，内容是单个 CLAUDE.md 文件，没有代码语言，最后一次提交是 2026-04-20**——距今 190 天，本周仍涨了 3,286 星。

它比排在第 4 的 `opencode`（222.0k）还高。

这条数据不该被当成「技能市场繁荣」的证据，恰恰相反，它说明：

- **星数测的是「被引用的共识」，不是工程量**。一份总结 Karpathy 关于 LLM 编码陷阱的笔记，价值在于被引用，而不在于代码行数；
- **榜单是注意力采样，不是质量排名**。停更半年的仓库能和日更的框架同台，说明 Trending 度量的是「本周被谁谈论」，而不是「本周谁在干活」。

同时回归的两个「老家伙」提供了另一个侧面：`ComfyUI`（2023 年 1 月建仓）和 `TradingAgents`（2024 年 12 月，附 arXiv 论文）。垂直应用没有被技能潮吞掉，反而是技能最好的落地场景——**技能负责让 Agent 会做，垂直项目负责让 Agent 有事可做。**

## 六、小结：货架之后是质检

把三周连起来看：

| 阶段 | 特征 | 代表 |
| :--- | :--- | :--- |
| 2025 | 单点工具爆发，各家造轮子 | 早期 MCP 服务器 |
| 2026 上半年 | 技能标准化，知识可复用 | `mattpocock/skills`、`karpathy-skills` |
| 2026 Q3 | 插件市场，有清单和版本契约 | `claude-plugins-official`、`cursor/plugins` |
| **2026 Q4** | **产物有 schema，结论有状态机，大厂带规范进场** | `security-audit-skill`、`android/skills`、`graphify` |

三周前大家在比「能装多少插件」，这周在比「装上去的东西怎么被验」。Cloudflare 把误报纪律写成 `needs_validation` 状态，Google 用 eval 决定写哪个技能，`graphify` 给每条边标 `EXTRACTED`/`INFERRED`——**它们都在回答同一个问题：怎么知道它是对的。**

如果只能带走一句话：**技能不缺创意，缺的是验收。**

---

本周完整榜单（含历史周次、语言筛选与增长排序）在 [GitHub 每周热榜](/trending)，每周五自动更新。
