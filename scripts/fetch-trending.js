// scripts/fetch-trending.js
// 抓取 GitHub Trending 每周热门开源项目并沉淀为 JSON 数据。
//
// 发布即冻结：某周一旦有了周报（手写或自动），该周快照不再被后续抓取覆盖。
// 否则会出现「文章写周一快照、页面显示周五快照」的双份事实——W43 就踩过。
// 因此周内重跑会创建/更新当周数据，但只有在定稿抓取（每周五的工作流）之后
// 才会生成周报；生成之后的任何重跑都直接跳过。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import { getWeekId, getWeekDateRange, normalizeWeek } from "./lib/week.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TRENDING_URL = "https://github.com/trending";
const OUTPUT_FILE = path.join(__dirname, "..", "src", "data", "trending-data.json");
const BLOG_DIR = path.join(__dirname, "..", "src", "content", "blog");
const WEEKLY_POST_PREFIX = "github-trending-weekly-";

async function fetchTrending() {
  const url = `${TRENDING_URL}?since=weekly`;
  console.log(`[Trending] 正在从 GitHub 抓取数据: ${url}`);

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8",
    },
  });

  if (!res.ok) {
    throw new Error(`抓取失败: ${res.status} ${res.statusText}`);
  }

  return res.text();
}

function parseTrending(html) {
  const $ = cheerio.load(html);
  const repos = [];

  $("article.Box-row").each((_, article) => {
    const $article = $(article);

    const nameLink = $article.find("h2.h3 a");
    const repoPath = nameLink.attr("href") || "";
    const parts = repoPath.trim().split("/").filter(Boolean);
    if (parts.length < 2) return;

    const owner = parts[0];
    const repo = parts[1];

    const description = $article.find("p.col-9").text().trim() || "";
    const language = $article.find('span[itemprop="programmingLanguage"]').text().trim() || "";

    const colorStyle = $article.find("span.repo-language-color").attr("style") || "";
    const colorMatch = colorStyle.match(/background-color:\s*(#[0-9a-fA-F]+)/);
    const langColor = colorMatch ? colorMatch[1] : "#8b949e";

    const starsText = $article.find('a[href$="/stargazers"]').text().trim().replace(/,/g, "") || "0";
    const stars = parseInt(starsText, 10) || 0;

    const forksText = $article.find('a[href$="/forks"]').text().trim().replace(/,/g, "") || "0";
    const forks = parseInt(forksText, 10) || 0;

    const todayText = $article.find("span.d-inline-block.float-sm-right").text().trim();
    const todayMatch = todayText.match(/([\d,]+)\s+stars?\s+(today|this week|this month)/);
    const todayStars = todayMatch ? parseInt(todayMatch[1].replace(/,/g, ""), 10) || 0 : 0;

    repos.push({
      owner,
      repo,
      url: `https://github.com${repoPath}`,
      description,
      language,
      langColor,
      stars,
      forks,
      todayStars,
    });
  });

  return repos;
}

function loadExisting() {
  if (!fs.existsSync(OUTPUT_FILE)) return { weeks: [] };
  try {
    const data = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
    if (!Array.isArray(data.weeks)) return { weeks: [] };
    return data;
  } catch {
    console.log("[Trending] 现有数据文件无效，重新初始化。");
    return { weeks: [] };
  }
}

/**
 * 该周是否已「发布」——以是否存在同名周报为标志（手写稿与自动稿同等对待）。
 *
 * 发布即冻结：周报里的数字必须与 /trending 页面永久一致，否则文章写的是
 * 周一快照、页面显示周五快照，读者两边对不上。历史上 W43 就踩过这个坑。
 */
function isPublished(weekId) {
  const file = path.join(BLOG_DIR, `${WEEKLY_POST_PREFIX}${weekId.toLowerCase()}.md`);
  return fs.existsSync(file);
}

/** 把现有数据写回磁盘（校正结果也要落盘）。 */
function persist(data) {
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
}

async function main() {
  const now = new Date();
  const weekId = getWeekId(now);
  const { startDate, endDate } = getWeekDateRange(now);

  const existingData = loadExisting();

  // 顺带校正历史周次的 ISO 对齐：早期版本用本地时区计算，
  // 在 UTC+8 下会把区间整体提前一天（W42 曾是 10-11~10-17）。
  // 已发布周次不动：改日期会让文章里的区间与页面不一致。
  let repaired = 0;
  for (const week of existingData.weeks) {
    if (isPublished(week.weekId)) {
      // 用副本探测，避免真的改到已发布的数据
      if (normalizeWeek({ ...week })) {
        console.warn(
          `[Trending] ${week.weekId} 已发布周报但日期不符合 ISO 口径，为保证文章与页面一致，跳过校正。`
        );
      }
      continue;
    }
    if (normalizeWeek(week)) {
      repaired += 1;
      console.log(`[Trending] 已校正历史周次: ${week.weekId} (${week.startDate} ~ ${week.endDate})`);
    }
  }

  // 本周已发布 → 快照冻结，连网络请求都不必发。
  // 这条分支同时也是「周报只在数据定稿后生成」的保障：
  // 任何周内重跑都不会再改动已见报的数字。
  if (existingData.weeks.some((w) => w.weekId === weekId) && isPublished(weekId)) {
    console.log(`[Trending] ${weekId} 的周报已发布，本周快照冻结，跳过抓取与覆盖。`);
    if (repaired > 0) persist(existingData);
    return { weekId, updated: false, frozen: true, repaired, total: existingData.weeks.length };
  }

  let html;
  try {
    html = await fetchTrending();
  } catch (err) {
    // 抓取失败也要把历史校正写回去，否则修复永远落不了盘
    if (repaired > 0) {
      persist(existingData);
      console.log(`[Trending] 抓取失败，但已写回 ${repaired} 条历史校正。`);
    }
    throw err;
  }

  const repos = parseTrending(html);

  if (repos.length === 0) {
    console.warn("[Trending] 警告: 未解析到任何仓库，保持现有数据不变。");
    if (repaired > 0) persist(existingData);
    return { weekId, updated: false, frozen: false, repaired, total: existingData.weeks.length };
  }

  const weekData = {
    weekId,
    startDate,
    endDate,
    fetchedAt: now.toISOString(),
    repos,
  };

  const existingWeekIndex = existingData.weeks.findIndex((w) => w.weekId === weekId);
  if (existingWeekIndex >= 0) {
    existingData.weeks[existingWeekIndex] = weekData;
    console.log(`[Trending] 已成功更新第 ${weekId} 周数据 (${repos.length} 个项目)`);
  } else {
    existingData.weeks.unshift(weekData);
    console.log(`[Trending] 已成功新增第 ${weekId} 周数据 (${repos.length} 个项目)`);
  }

  // 按周ID倒序排列
  existingData.weeks.sort((a, b) => b.weekId.localeCompare(a.weekId));

  persist(existingData);
  console.log(`[Trending] 保存完毕，历史总周数: ${existingData.weeks.length}`);

  return { weekId, updated: true, frozen: false, repaired, total: existingData.weeks.length };
}

main()
  .then((result) => {
    // 供工作流读取（GitHub Actions 会解析 $GITHUB_OUTPUT）
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(
        process.env.GITHUB_OUTPUT,
        `week_id=${result.weekId}\nupdated=${result.updated}\nfrozen=${result.frozen}\nrepaired=${result.repaired}\n`
      );
    }
  })
  .catch((err) => {
    console.error("[Trending] 运行出错:", err.message);
    process.exit(1);
  });
