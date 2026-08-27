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

## 部署到 GitHub Pages 用户页

1. 将仓库命名（或重命名）为 `<你的用户名>.github.io`。
2. 修改 `astro.config.mjs`，把 `site` 改成 `https://<你的用户名>.github.io`
   （当前为占位值 `https://example.github.io`）。
   `base` 保持留空，适配用户页根路径 `/`。
3. 在仓库 **Settings > Pages** 中，Source 选择 **GitHub Actions**。
4. 推送（或手动 `workflow_dispatch`）到 `main` 分支，
   触发 `.github/workflows/deploy.yml` 自动构建并部署。

> 注意：`sitemap` 集成依赖正确的 `site` 才能生成绝对链接，上线前务必改好。
