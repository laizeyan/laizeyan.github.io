# Personal Site

Astro 个人站点，部署到 GitHub Pages 用户页（`<user>.github.io`）。

## 技术栈

- [Astro](https://astro.build) 静态站点生成
- [pagefind](https://pagefind.app) 站内搜索（构建时生成索引）
- 包管理：pnpm

## 本地开发

```bash
pnpm install
pnpm dev
```

构建产物输出到 `dist/`（`astro build` 产物 + pagefind 搜索索引）：

```bash
pnpm build
```

## 视觉规范（编辑杂志风）

站点采用「编辑杂志」气质：暖纸白底 + 墨黑正文 + 赭石红点缀，标题 serif、正文黑体。设计 token 集中在 `src/styles/global.css`：

- `--bg:#faf8f3`（纸）、`--text:#16140f`（墨）、`--accent:#b4452e`（赭石），暗色在 `[data-theme="dark"]` 块
- `--maxw:1100px` 页面宽 / `--readw:680px` 阅读宽 / `--serif` 标题字体
- 动效 token：`--t-fast:0.15s` / `--t-base:0.2s` / `--t-slow:0.6s`；所有位移只用 `transform`/`opacity`，`prefers-reduced-motion` 下撤位移仅留颜色反馈

约定与注意点：

- **改交互/动效时**：保持 `:focus-visible` 可见环、`:active` 按压反馈、reduced-motion 纪律（`global.css`）。
- **代码块**：用 Shiki 双主题（`astro.config.mjs` 的 `shikiConfig`），背景固定纸张色 `--bg-elevated`，语法高亮色随 `[data-theme]` 切换——不要改回固定单主题。
- **TOC（文章页目录）**：目录链接由 JS 动态创建，**样式必须用 `:global()`**（见 `src/pages/blog/[...slug].astro`），否则 scoped CSS 不会命中动态元素，激活高亮会静默失效。

验证：改样式后跑 `npx astro check`（须 0 errors/0 warnings）与 `pnpm build`，并用浏览器实测（桌面/平板/移动视口）确认无回归、无横向溢出。

## 部署到 GitHub Pages 用户页

线上地址：<https://laizeyan.github.io/>（用户页，`base` 保持留空）。

- `astro.config.mjs` 的 `site` 已设为 `https://laizeyan.github.io`，
  `sitemap` / `robots.txt` / RSS 均依赖它生成绝对链接，换域名时须同步修改。
- 仓库 **Settings > Pages** 的 Source 已是 **GitHub Actions**（`build_type=workflow`）。
  若被改回 `Deploy from a branch`，每次 push 会额外触发一次必然失败的 Jekyll 构建
  （报 `Invalid YAML front matter in *.astro`），且与 Actions 部署互相覆盖。
- 推送 `main` 即触发 `.github/workflows/deploy.yml` 构建并部署；也可手动
  `gh workflow run deploy.yml`。

## 自动化任务

| 工作流 | 触发 | 作用 |
| :--- | :--- | :--- |
| `deploy.yml` | push `main` / 手动 / trending 更新完成后 | `pnpm build` + 部署 Pages |
| `update-trending.yml` | 每周五 UTC 00:00（北京 08:00）/ 手动 | 抓取 Trending、校正历史周次、自动补写周报并冻结该周，然后提交 |

### Trending 数据与周报

两个脚本分工明确，可单独运行：

```bash
node scripts/fetch-trending.js        # 抓取并写入 src/data/trending-data.json
node scripts/generate-weekly-post.js  # 依据数据补写当周周报
```

**周次口径**：全部按 **ISO 8601**（周一为一周起点，周四决定归属年份），
时间统一用 UTC 计算（`scripts/lib/week.js`）。这是刻意的选择——Actions 跑在 UTC、
本地开发在 UTC+8，混用本地时区会让日期区间整体提前一天（W42 曾被记成 `10-11~10-17`）。

`fetch-trending.js` 每次运行都会顺带**校正历史周次**：以 `fetchedAt` 为唯一事实来源
重算 `weekId` / `startDate` / `endDate`，因此历史脏数据会在下一次运行时自愈，
抓取失败也会把已完成的校正写回。

**周报生成策略**：`generate-weekly-post.js` 只写数据能证明的事实（排名变化、
Star 增量、语言分布、连续在榜周数），不臆测项目价值。**已存在的周报一律跳过**，
所以手写稿永远优先于自动生成——想人工接管某一期，只需手动创建同名文件。

**发布即冻结（重要）**：某周一旦有了周报，该周快照就不再被后续抓取覆盖。
原因是周报里的数字必须和 `/trending` 页面永久一致——否则会出现「文章写周一快照、
页面显示周五快照」的两份事实（W43 就踩过这个坑：周一抓 10 项、周五抓 15 项，
而文章还停留在 10 项）。因此：

| 场景 | 行为 |
| :--- | :--- |
| 每周五定时任务 | 抓当周 → 生成周报 → 该周冻结 |
| 周中手动触发（默认） | 只更新当周数据，**不发布**（周五会被定稿覆盖） |
| 手动触发并勾选 `publish` | 等同于定稿：生成周报并冻结 |
| 本周已冻结后再跑 | 直接跳过，连网络请求都不发 |

冻结只影响「已发布」的周次，历史周次的 ISO 校正照常进行。

## 维护检查清单

```bash
npx astro check      # 须 0 errors / 0 warnings / 0 hints
pnpm build           # 含 pagefind 索引
pnpm audit           # 无 high 及以上漏洞
```

标签索引由 `src/utils/tags.ts` 统一汇总 **博客 + 项目** 的标签，
新增标签无需改动页面；不要在页面里另建一份标签来源，否则会出现
`/tags/xxx` 死链。

> 长文章（> 约 7000px）请务必实测首屏：`.reveal` 动画的 IntersectionObserver
> 若把 threshold 调高，超长文章的可视比例永远达不到阈值，会整页停在 `opacity:0`。


