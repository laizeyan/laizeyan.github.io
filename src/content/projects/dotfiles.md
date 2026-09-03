---
title: "dotfiles：跨机器一键还原的开发环境"
description: "用 Git 管理的整套开发环境配置：shell、Hyprland 桌面、Neovim、终端与工具链，install.sh 一键导入，私密内容自动剥离。"
repo: "https://github.com/laizeyan/dotfiles"
tags: ["配置", "Linux", "工具"]
date: 2026-09-03
featured: true
---

一套用 Git 管理的跨机器开发环境配置。重装系统后 `git clone` 拉下来，跑一个 `install.sh` 就能把 shell、桌面、编辑器与常见工具链恢复到同一套审美与肌肉记忆——我的目标是「一份真理来源」，让换机成本趋近于零。

## 覆盖范围

- **shell**：bash / zsh 的 `rc`、`profile` 与输入法合成（XCompose）
- **桌面**：Hyprland 窗口管理（hypr/）、omarchy 自定义层，以及 alacritty / foot / ghostty / kitty 四套终端配置
- **工具**：Neovim（LazyVim）、tmux、btop、fcitx5 输入法、mise 工具链版本清单，以及 opencode / claude / codex 的编辑器与 AI 工作流配置

## 关键设计

**install.sh 一键导入**：支持 `--dry-run`（预览不动手）与 `--overwrite`（覆盖已存在配置），默认跳过已存在的文件，避免误伤。

**敏感内容绝不入库**：像 `auth.json`、`antigravity-accounts.json`、`supermemory.json`、SSH 私钥这类含密钥与 Token 的文件，通过 `.gitignore` 多层防御硬性剥离，并提供 `secrets.template.md` 说明重装后如何手动恢复鉴权。

**幽灵文件剔除**：归档时特意去掉了指向 omarchy 运行时状态的符号链接（如动态生成的主题文件），它们应由系统重新生成，而不是当作配置导入。

> 仓库设为私有，仅用于个人换机与备份；配置始终可复现，密钥始终留在本地。
