---
title: "laizeyan.github.io：Astro 个人站点"
description: "用 Astro 7 构建的编辑杂志风个人数字花园：集成 13 款高频离线开发工作台、GitHub 每周热榜 Bento 网格、流体水波主题切换、全文检索与内容集合。"
slug: "laizeyan-github-io"
repo: "https://github.com/laizeyan/laizeyan.github.io"
url: "https://laizeyan.github.io"
tags: ["Astro", "Web", "前端", "工程", "工具"]
date: 2026-10-17
featured: true
---

你现在正在看的这个站点。基于 Astro 7 的静态个人博客与开发者工作台，用「编辑杂志风」作为视觉语言：暖纸白底、墨黑字、赭石红强调，标题用衬线体，搭配边框线、纸纹理与四层景深体系。

## 核心系统与功能

- **开发者工具箱 (`/tools`)**：内置 13 款高频日常开发小件（JSON 格式化/压缩/转义、Base64、URL 编解码与 Query 参数解析、Unicode、JWT 令牌校验、哈希散列计算、UUID 与随机强密码生成、Unix 时间戳、字数统计、LCS 文本差异对比、正则表达式测试、WCAG 颜色转换与色板、GitHub 像素头像）。全部基于浏览器本地沙盒运行，数据零服务端泄露。
- **GitHub 每周热榜 (`/trending`)**：采用杂志 Bento Grid 布局，自动追踪本周 GitHub 社区最热门的开源项目，按总星数、本周增长与编程语言分类呈现。
- **流体水波主题切换**：基于原生 View Transitions API 与 GPU 隔离，实现从点击光标处呈同心圆扩散的平滑日夜交替，辅以平滑变形的 SVG 太阳/月亮图标。
- **内容集合与知识管理**：`blog` 与 `projects` 两组结构化集合，配合 glob loader 与严格的 Zod Schema 校验，新增文章与项目只需丢入一个 Markdown 文件。
- **静态全文检索**：集成 Pagefind，在静态构建阶段生成增量全文索引，零运行时外部网络开销与侵入性。
- **双重视角布局**：针对开发工作台与对比排版，支持在「宽屏左右并排」与「长文上下堆叠」之间无缝切换。

## 技术取舍

我们始终遵循「以内容和实用为中心」的克制原则：不引入庞大冗余的第三方 UI 库，哈希计算依托硬件加速的 Web Crypto API 与纯前端算法，动画优先交由浏览器原生合成器（Compositor），让整个站点既有印刷刊物般的排版质感，又具备现代化全栈工程师随手取用的实用生产力。