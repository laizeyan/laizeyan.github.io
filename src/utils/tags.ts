// src/utils/tags.ts
// 标签索引的唯一数据源：博客与项目共用一套标签，
// 避免首页/项目卡片链到未生成的 /tags/xxx 页面（曾产生 4 个 404）。
import { getCollection } from "astro:content";

export interface TagSummary {
  tag: string;
  blogCount: number;
  projectCount: number;
  total: number;
}

/** 汇总所有已发布博客与项目的标签，按名称排序。 */
export async function getTagSummaries(): Promise<TagSummary[]> {
  const [posts, projects] = await Promise.all([
    getCollection("blog", ({ data }) => !data.draft),
    getCollection("projects"),
  ]);

  const counts = new Map<string, { blogCount: number; projectCount: number }>();
  const bump = (tag: string, key: "blogCount" | "projectCount") => {
    const entry = counts.get(tag) ?? { blogCount: 0, projectCount: 0 };
    entry[key] += 1;
    counts.set(tag, entry);
  };

  for (const post of posts) {
    for (const tag of new Set(post.data.tags)) bump(tag, "blogCount");
  }
  for (const project of projects) {
    for (const tag of new Set(project.data.tags)) bump(tag, "projectCount");
  }

  return Array.from(counts.entries())
    .map(([tag, { blogCount, projectCount }]) => ({
      tag,
      blogCount,
      projectCount,
      total: blogCount + projectCount,
    }))
    .sort((a, b) => a.tag.localeCompare(b.tag, "zh-CN"));
}
