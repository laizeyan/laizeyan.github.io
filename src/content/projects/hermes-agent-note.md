---
title: "Hermes Agent 使用笔记"
description: "记录我把 Hermes Agent 接入日常开发流的一些心得：代码审查、长任务拆步、以及它不适合做的事。"
url: "https://github.com/laizeyan"
repo: "https://github.com/laizeyan"
tags: ["AI", "工具"]
date: 2026-08-15
featured: true
---

Hermes Agent 是我最近在折腾的一个智能体，目前主要拿它做两件省心的事：一是替我跑第一遍代码审查，把明显的类型与边界问题先揪出来；二是把「长任务」拆成可验收的小步，避免一口气写出一大坨难以回滚的改动。

一点经验：把上下文收拢干净、给它明确的「验收标准」，产出会稳定很多。它不适合代替人做架构决策——那种需要权衡取舍的判断，我还是自己拍板。后续会把配置与提示词整理进我的 dotfiles 仓库。
