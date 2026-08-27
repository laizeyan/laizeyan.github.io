---
title: "Astro 7 的几个上手坑"
description: "记录从 Gatsby/Hexo 迁移到 Astro 7 时踩到的几个真实坑：内容集合的 glob loader、render(entry) 的调用方式，以及本地预览的端口问题。"
pubDate: 2026-08-15
tags: ["Astro", "前端"]
---

## 内容集合要用 glob loader，而不是旧版的 defineCollection 写法

升级到 Astro 7 之后，内容集合的写法变了。早年 `src/content/<collection>` 下放 Markdown 的约定被废弃，现在推荐在 `src/content.config.ts` 里用 `glob` loader 显式声明来源目录。我一开始照着旧文档写，结果 `getCollection` 永远返回空数组，排查了半天才发现是 loader 没配。

```js
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { blog };
```

## render(entry) 必须拿到「entry」而非「data」

另一个常见坑是渲染正文。Astro 7 里 Markdown 的渲染函数签名变成了 `render(entry)`，参数是整个 entry（包含 `id`、`body`、`data`），而不是早期版本里解出来的 `data`。我最初写成 `render(post.data)`，页面直接白屏，控制台报的是「render expects a content entry」。

```js
import { getCollection, render } from "astro:content";

export async function getStaticPaths() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post); // 注意：传 post，不是 post.data
```

## 小结

真正上手之后，Astro 的「零 JS 默认 + 按需岛屿」思路很舒服：文章页几乎不带脚本，只有搜索、主题切换这类交互才注水。把上面的两个坑记牢，迁移成本其实比想象中低得多。
