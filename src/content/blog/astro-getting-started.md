---
title: "Astro 上手：从零搭建个人站点"
description: "记录使用 Astro 7 搭建个人站点的第一步，包括内容集合与页面生成。"
pubDate: 2026-08-10
tags: ["前端", "Astro"]
---

## 为什么选择 Astro

Astro 以内容为中心，默认零 JS，非常适合个人博客与技术站点。它的内容集合（Content Collections）让 Markdown 写作与类型安全兼得。

下面是一个简单的组件引入示例：

```js
import { getCollection } from "astro:content";

const posts = await getCollection("blog");
console.log(`共 ${posts.length} 篇文章`);
```

上手之后，你会发现构建速度很快，开发体验也很顺滑。
