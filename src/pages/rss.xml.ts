import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { marked } from "marked";

export async function GET(context: any) {
  const site = context.site;
  const posts = (await getCollection("blog", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );

  const items = await Promise.all(
    posts.map(async (p) => {
      // 把正文 markdown 渲染为 HTML（全文订阅）
      const content = await marked.parse(p.body ?? "");
      return {
        title: p.data.title,
        description: p.data.description,
        pubDate: p.data.pubDate,
        // 更新时间：若 updatedDate 晚于 pubDate（跨天）则体现
        customData: p.data.updatedDate
          ? `<updated>${p.data.updatedDate.toISOString()}</updated>`
          : undefined,
        // 按标签生成 <category>
        categories: p.data.tags,
        link: new URL(`/blog/${p.id}/`, site).toString(),
        content,
      };
    }),
  );

  return rss({
    title: "Ze'Yan · 博客",
    description: "技术文章与随笔",
    site,
    items,
    customData: `<language>zh-cn</language>`,
  });
}
