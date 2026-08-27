---
title: "我的命令行工作流"
description: "分享我在 Arch + Hyprland 下的一套终端别名与函数：从快速跳转项目、一键起预览，到 Git 速记，让重复动作消失在日常里。"
pubDate: 2026-08-03
tags: ["工具", "效率"]
---

## 把重复的动作藏进别名

命令行最让我上瘾的地方，是「把今天烦过一次的重复，变成以后永远不用再想」。下面是我 `.zshrc` 里最常驻的几个别名，纯占位示例，但都是真在用思路。

```sh
# 项目间瞬移
alias pj="cd ~/Projects"
alias site="cd ~/Projects/personal-site && pnpm dev"

# Git 速记
alias gs="git status -sb"
alias gc="git commit -m"
alias gl="git log --oneline -10"

# 一键起本地预览（Astro）
alias pv="pnpm build && pnpm preview"
```

## 再进一步：用函数替我记步骤

当别名不够（需要参数或顺序）时，就用函数。比如一个 `mkpost` 帮我在对的位置新建带 frontmatter 的草稿：

```sh
mkpost() {
  local dir=~/Projects/personal-site/src/content/blog
  local file="$dir/$1.md"
  [[ -f "$file" ]] && { echo "已存在：$file"; return 1; }
  cat > "$file" <<EOF
---
title: "$1"
description: "待补"
pubDate: $(date +%F)
tags: []
---
EOF
  $EDITOR "$file"
}
```

工作流的本质，不是炫耀命令多花哨，而是让「想做的事」和「敲下的键」之间几乎没有距离。当工具隐入背景，注意力才真正回到创造本身。
