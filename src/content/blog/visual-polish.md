---
title: "给个人站点做视觉打磨：两轮、两个隐蔽 bug"
description: "记录我用两轮打磨把站点的交互、响应式与动效细节收紧的过程，其中两个真正影响体验的 bug —— 代码块主题跟随与 TOC 激活高亮失效 —— 都藏在 scoped CSS 与静态生成的缝隙里。"
pubDate: 2026-09-04
tags: ["设计", "前端"]
---

这个站的视觉打磨分了两轮。第一轮做粗粒度：交互状态、响应式断点、入场动效与首页节奏；第二轮做细颗粒：选中色、正文链接质感、列表 marker、代码块与目录（TOC）的体验细节。重点往往不在「加了什么」，而在「修好了哪些本该工作却悄悄坏掉的东西」。

## 先定一个「编辑杂志」的气质

站点的视觉基调没有改：暖纸白底、墨黑正文、赭石红点缀，标题走 serif（Playfair Display / Noto Serif SC）。所有打磨都在这套 token 里进行，不推翻、不另起炉灶。

```css
--bg: #faf8f3;      /* 纸 */
--text: #16140f;    /* 墨 */
--accent: #b4452e;  /* 赭石 */
--serif: "Playfair Display", "Noto Serif SC", Georgia, serif;
```

克制不是不做，而是每做一点都回答「它凭什么站在这里」。

## 第一轮：把「可交互」做扎实

第一轮集中在四类粗粒度问题上。

**键盘焦点可见环。** 原站几乎没有任何 `:focus-visible`，键盘用户根本看不见焦点在哪。补了一套全局规则，导航、卡片、按钮、链接全覆盖：

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

**按压反馈。** 按钮、卡片、导航项按下时微缩放 `scale(0.98)`，让「按下」有实体感。

**平板断点挤压。** 原来只有一个 720px 断点，768–900px 平板区间里精选项目网格保持两列，卡片被压到 337px 宽、263px 高，很难看。补一个 900px 断点折叠成单列后，卡片回到舒适的 705px 宽、110px 高。这是可度量的改善，不是感觉。

**入场动效的交错感。** 首页几个 `.reveal` 区块原来同时进场，改成用 `--reveal-delay` 做 0 / 80ms / 160ms 的错落，而不是齐步走。

动效上有一条硬纪律：**所有位移只用 `transform`/`opacity`**，不碰会触发重排的布局属性；并且 `prefers-reduced-motion` 时一律撤掉位移、只留颜色反馈。

## 第二轮：两个真正隐蔽的 bug

细颗粒轮最有价值的不是「装饰」，而是挖出了两个代码层面正确、但实际从来没生效的东西。

**Bug 一：代码块主题没有跟随。** Astro 默认用 Shiki，且写死 `github-dark`——结果是无论站是亮是暗，代码块永远是深色底。在亮色的纸张页面里嵌一块深色块，明显刺眼。改成 Shiki 双主题（light/dark），并把代码块背景固定成纸张色 `--bg-elevated`，只让语法高亮色随主题切换：

```js
// astro.config.mjs
shikiConfig: {
  themes: { light: "github-light", dark: "github-dark" },
  defaultColor: false,
}
```

```css
.astro-code { background-color: var(--bg-elevated); color: var(--shiki-light); }
[data-theme="dark"] .astro-code { color: var(--shiki-dark); }
```

**Bug 二：TOC 的激活高亮从来没显示。** 目录项是文章页用 JS 动态创建的 `<a>`。Astro 默认把所有 `<style>` 都 scoped 到组件的 `data-astro-cid-*` 属性上，而**动态创建的元素没有那个属性**——于是 `.toc-list a.active` 这类规则从未命中。激活章节时，高亮的左边框和颜色变化不存在。修法是给动态部分用 `:global()`：

```css
.toc-list :global(a.active) { color: var(--accent); border-left-color: var(--accent); }
```

这两个例子有个共同点：**代码没有报错、构建也通过，但功能从未真正生效。** 这类问题只能靠打开浏览器实测才能暴露——写在这里，是提醒未来的自己。

第二轮其余是细颗粒的整理：`::selection` 用赭石色、正文链接改成 hover 时 1px→2px 生长的编辑式下划线、`.prose` 列表 marker 染色、友链页的空状态从一句裸提示改成有设计的居中文案块。

## 反直觉的结论

- 两轮改动里，最容易出问题的不是「样式做得花不花」，而是 **scoped CSS 遇上运行时生成的 DOM**。
- 视觉打磨的最大风险，往往来自「看起来能跑其实没生效」的规则，而不是审美本身。
- 所以我坚持每改一批就 `astro check` + 构建 + 浏览器实地量一次（网格列数、卡片尺寸、focus 环的 computed style、reduced-motion 模拟），用客观数据而不是「感觉」来验收。

视觉打磨不是一次性的，而是给站点持续地把细节磨顺的过程。它不会让你一眼惊艳，但会让每一次浏览都少一点「哪里不对劲但又说不上来」的刺。
