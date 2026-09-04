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

1. 将仓库命名（或重命名）为 `<你的用户名>.github.io`。
2. 修改 `astro.config.mjs`，把 `site` 改成 `https://<你的用户名>.github.io`
   （当前为占位值 `https://example.github.io`）。
   `base` 保持留空，适配用户页根路径 `/`。
3. 在仓库 **Settings > Pages** 中，Source 选择 **GitHub Actions**。
4. 推送（或手动 `workflow_dispatch`）到 `main` 分支，
   触发 `.github/workflows/deploy.yml` 自动构建并部署。

> 注意：`sitemap` 集成依赖正确的 `site` 才能生成绝对链接，上线前务必改好。
