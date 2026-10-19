// scripts/fetch-trending.js
// 抓取 GitHub Trending 每周热门开源项目并沉淀为 JSON 数据
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TRENDING_URL = "https://github.com/trending";
const OUTPUT_FILE = path.join(__dirname, "..", "src", "data", "trending-data.json");

// 统一用 UTC 计算周一零点：日期区间是「纯日期」，若混用本地零点再 toISOString()
// 会在 UTC+8 等时区整体提前一天（曾导致 W42 被记成 10-11 ~ 10-17）。
function getWeekStart(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayOfWeek = d.getUTCDay(); // 0 = 周日
  d.setUTCDate(d.getUTCDate() - ((dayOfWeek + 6) % 7));
  return d;
}

// ISO 8601 周编号：包含周四的那一周属于该周所在的年份，
// 因此跨年周（如 2026-01-01）不会被算成上一年的 W53。
function getWeekId(date) {
  const monday = getWeekStart(date);
  const thursday = new Date(monday);
  thursday.setUTCDate(monday.getUTCDate() + 3);
  const year = thursday.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const weekNumber = Math.floor((thursday - yearStart) / 86400000 / 7) + 1;
  return `${year}-W${String(weekNumber).padStart(2, "0")}`;
}

function getWeekDateRange(date) {
  const monday = getWeekStart(date);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return {
    startDate: monday.toISOString().split("T")[0],
    endDate: sunday.toISOString().split("T")[0],
  };
}

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

async function main() {
  const html = await fetchTrending();
  const repos = parseTrending(html);

  if (repos.length === 0) {
    console.warn("[Trending] 警告: 未解析到任何仓库，保持现有数据不变。");
    return;
  }

  const now = new Date();
  const weekId = getWeekId(now);
  const { startDate, endDate } = getWeekDateRange(now);

  let existingData = { weeks: [] };
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      existingData = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
    } catch {
      console.log("[Trending] 现有数据文件无效，重新初始化。");
    }
  }

  const existingWeekIndex = existingData.weeks.findIndex((w) => w.weekId === weekId);
  const weekData = {
    weekId,
    startDate,
    endDate,
    fetchedAt: now.toISOString(),
    repos,
  };

  if (existingWeekIndex >= 0) {
    existingData.weeks[existingWeekIndex] = weekData;
    console.log(`[Trending] 已成功更新第 ${weekId} 周数据 (${repos.length} 个项目)`);
  } else {
    existingData.weeks.unshift(weekData);
    console.log(`[Trending] 已成功新增第 ${weekId} 周数据 (${repos.length} 个项目)`);
  }

  // 按周ID倒序排列
  existingData.weeks.sort((a, b) => b.weekId.localeCompare(a.weekId));

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(existingData, null, 2));
  console.log(`[Trending] 保存完毕，历史总周数: ${existingData.weeks.length}`);
}

main().catch((err) => {
  console.error("[Trending] 运行出错:", err.message);
  process.exit(1);
});
