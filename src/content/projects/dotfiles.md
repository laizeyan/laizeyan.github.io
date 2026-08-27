---
title: "我的 dotfiles 配置"
description: "一套跨机器的 dotfiles：zsh、Ghostty、Hyprland 与 Neovim 的统一配色与键位，用 Git 管理、一键同步。"
repo: "https://github.com/laizeyan"
tags: ["配置"]
date: 2026-07-20
featured: false
---

这套 dotfiles 负责把我所有机器的开发环境拉到同一套审美与肌肉记忆上：终端用 Ghostty + zsh，窗口管理用 Hyprland 平铺，编辑器是 Neovim 与 VS Code 共用一套配色。

核心思路是「一份真理来源」——所有配置进 Git，换机时 `git clone` 后跑一个 bootstrap 脚本即可恢复。赭石红被我设成了贯穿终端、编辑器到浏览器的强调色，这样无论切到哪个工具，视觉上下文都不会断。
