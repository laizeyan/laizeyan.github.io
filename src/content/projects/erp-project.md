---
title: "erp-project：Python 企业应用（私有）"
description: "基于 Python 的企业资源计划（ERP）系统，正在用多 Agent 协作流程推进开发。"
repo: "https://github.com/laizeyan/erp-project"
tags: ["Python", "后端", "AI"]
date: 2026-08-20
featured: false
---

一个基于 Python 的企业资源计划（ERP）系统，仓库为私有。项目正在探索**多 Agent 协作的开发方式**：通过 planner / reviewer 等多个专用 subagent 分工推进，把规划、编码、审查与提交拆成职责清晰的环节。

## 协作流程

- **planner**：读设计文档，把任务拆成可验收的实施步骤
- **实现**：按计划编码，保持最小改动
- **reviewer**：审查正确性、安全、风格与测试覆盖，修复标记的阻塞问题
- **测试验证**：每个变更必须跑通测试与 lint，汇报真实结果

这套流程的目标是让 AI 在协作中更少猜测、更少犯错——把「项目规范看得见、改动有验证」落到日常开发里。因涉及未开源的业务内容，此处暂不展开实现细节。