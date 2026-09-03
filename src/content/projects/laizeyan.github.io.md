---
title: "laizeyan.github.io：Astro 个人站点"
description: "本站点：用 Astro 7 构建的编辑杂志风个人博客，含内容集合、站内搜索、RSS 与标签体系，通过 GitHub Actions 部署到 Pages。"
repo: "https://github.com/laizeyan/laizeyan.github.io"
url: "https://laizeyan.github.io"
tags: ["Astro", "Web", "前端"]
date: 2026-08-27
featured: true
---

你现在正在看的这个站点。基于 Astro 7 的静态个人博客，用「编辑杂志风」作为视觉语言：暖纸白底、墨黑字、赭石红强调，标题用衬线体。

## 技术要点

- **内容集合**：`blog` 与 `projects` 两组集合，配合 glob loader 与 Zod schema 做结构化管理，新增一篇文章只需丢一个 Markdown 文件
- **站内搜索**：接入 pagefind，构建时生成全文索引，零运行时负担
- **SEO**：`@astrojs/sitemap` 生成站点地图，配合 RSS 订阅
- **标签体系**：文章/项目按标签分类，提供 `/tags/<tag>` 归档页
- **部署**：GitHub Actions 在 push 到 main 时自动构建并部署到 GitHub Pages，pnpm 版本在工作流中固化

## 设计取舍

默认零 JavaScript、以内容为中心——个人博客不该背负一整套运行时。阅读压、浅色护眼主题是打磨细节，404 页与阅读时长也做了处理。