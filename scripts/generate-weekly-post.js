// scripts/generate-weekly-post.js
// 依据 src/data/trending-data.json 自动生成每周热榜文章。
//
// 设计原则：
// 1. 只写「数据能证明的事实」——排名变化、Star 增量、语言分布、连续在榜周数，
//    不对项目做超出其 description 的臆测，避免生成空洞的套话。
// 2. 已存在的周报不覆盖：手写稿（如 Vol.01/Vol.02）优先，自动生成只在缺失时补位。
// 3. 幂等：同一天重复运行产出相同内容，便于 CI 判断 git diff。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DATA_FILE = path.join(ROOT, "src", "data", "trending-data.json");
const BLOG_DIR = path.join(ROOT, "src", "content", "blog");

const WEEKLY_POST_PREFIX = "github-trending-weekly-";

function formatNum(num) {
  if (!Number.isFinite(num)) return "0";
  if (num >= 10000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return num.toLocaleString("en-US");
}

function formatDelta(num) {
  if (!Number.isFinite(num) || num === 0) return "—";
  const sign = num > 0 ? "+" : "−";
  return sign + formatNum(Math.abs(num));
}

/** 读取所有已存在的周报，返回 { weekIds:Set, maxVol:number } */
function scanExistingPosts() {
  const weekIds = new Set();
  let maxVol = 0;

  if (!fs.existsSync(BLOG_DIR)) return { weekIds, maxVol };

  for (const file of fs.readdirSync(BLOG_DIR)) {
    if (!file.startsWith(WEEKLY_POST_PREFIX) || !file.endsWith(".md")) continue;
    // 周编号统一转小写比较：历史上手写稿用 `-2026-w42.md`，
    // 生成器若用大写 `-2026-W43.md` 会导致去重失效并生成重复文章。
    const weekId = file.slice(WEEKLY_POST_PREFIX.length, -3).toUpperCase();
    weekIds.add(weekId);

    const body = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const volMatch = /Vol\.\s*(\d+)/.exec(body);
    if (volMatch) maxVol = Math.max(maxVol, Number(volMatch[1]));
  }

  return { weekIds, maxVol };
}

/** 计算相对上一周的排名变化 */
function computeRankChange(repoKey, currentRank, prevWeek) {
  if (!prevWeek) return { label: "NEW", kind: "new" };
  const prevIndex = prevWeek.repos.findIndex(
    (r) => `${r.owner}/${r.repo}` === repoKey
  );
  if (prevIndex < 0) return { label: "NEW", kind: "new" };

  const delta = prevIndex + 1 - currentRank;
  if (delta === 0) return { label: "—", kind: "same" };
  return {
    label: delta > 0 ? `↑${delta}` : `↓${Math.abs(delta)}`,
    kind: delta > 0 ? "up" : "down",
  };
}

/** 连续在榜周数（含本周） */
function consecutiveWeeks(repoKey, weeksAsc, currentWeekId) {
  let count = 0;
  for (let i = weeksAsc.length - 1; i >= 0; i -= 1) {
    const week = weeksAsc[i];
    const present = week.repos.some((r) => `${r.owner}/${r.repo}` === repoKey);
    if (!present) break;
    count += 1;
    if (week.weekId === currentWeekId) continue;
  }
  return count;
}

function buildPost(week, prevWeek, weeksAsc, vol) {
  const repos = week.repos;
  const top = repos[0];

  // 语言分布
  const langCounts = new Map();
  for (const repo of repos) {
    const lang = repo.language || "其他";
    langCounts.set(lang, (langCounts.get(lang) || 0) + 1);
  }
  const langs = [...langCounts.entries()].sort((a, b) => b[1] - a[1]);

  // 排名变化表
  const rows = repos.map((repo, i) => {
    const key = `${repo.owner}/${repo.repo}`;
    const rank = i + 1;
    const change = computeRankChange(key, rank, prevWeek);
    const prevRepo = prevWeek?.repos.find((r) => `${r.owner}/${r.repo}` === key);
    const starDelta = prevRepo ? repo.stars - prevRepo.stars : null;
    return { repo, key, rank, change, starDelta, prevRepo };
  });

  const newEntrants = rows.filter((r) => r.change.kind === "new");
  const risers = rows
    .filter((r) => r.change.kind === "up")
    .sort((a, b) => Number(b.change.label.slice(1)) - Number(a.change.label.slice(1)));
  const fallers = rows.filter((r) => r.change.kind === "down");
  const stayed = rows.filter((r) => r.change.kind === "same");

  // 本周增长冠军（todayStars 最大）
  const growthLeader = [...repos].sort((a, b) => b.todayStars - a.todayStars)[0];

  // 连续在榜
  const streaks = rows
    .map((r) => ({ ...r, streak: consecutiveWeeks(r.key, weeksAsc, week.weekId) }))
    .filter((r) => r.streak >= 3)
    .sort((a, b) => b.streak - a.streak);

  const title = `开源雷达 Vol. ${String(vol).padStart(2, "0")}：${week.weekId} GitHub 热榜数据快照`;

  // 年份从 weekId 推导，避免跨年时写死 2026
  const weekYear = week.weekId.slice(0, 4);
  const weekNumber = Number(week.weekId.split("W")[1]);
  const descriptionParts = [
    `${weekYear} 年第 ${weekNumber} 周 GitHub Trending 榜单`,
    `共 ${repos.length} 个项目`,
    !prevWeek
      ? "首期快照"
      : newEntrants.length > 0
        ? `${newEntrants.length} 个新晋`
        : "无新晋项目",
    `${langs[0][0]} 以 ${langs[0][1]} 个席位居首`,
  ];

  const lines = [];
  const push = (s = "") => lines.push(s);

  push("---");
  push(`title: "${title}"`);
  push(`description: "${descriptionParts.join("，")}。"`);
  push(`pubDate: ${week.fetchedAt.slice(0, 10)}`);
  push('tags: ["开源", "GitHub", "趋势", "工程"]');
  push("---");
  push();
  push(
    `本周（${week.weekId}，${week.startDate} ~ ${week.endDate}）的 GitHub Trending 周榜共记录 ${repos.length} 个项目。本文由抓取数据自动生成，只陈述排名、增量与分布等可核验的事实，不对项目做主观评价。`
  );
  push();
  push("---");
  push();
  push("## 一、完整榜单");
  push();
  push("| # | 项目 | 语言 | 总 Star | 本周新增 | 排名变化 |");
  push("| ---: | :--- | :--- | ---: | ---: | :--- |");
  for (const row of rows) {
    const { repo, rank, change } = row;
    push(
      `| ${rank} | [\`${row.key}\`](${repo.url}) | ${repo.language || "—"} | ${formatNum(repo.stars)} | ${
        repo.todayStars > 0 ? "+" + formatNum(repo.todayStars) : "—"
      } | ${change.label} |`
    );
  }
  push();

  if (prevWeek) {
    push(
      `> 「本周新增」为 GitHub Trending 页面给出的周增量；「排名变化」对比上一周（${prevWeek.weekId}）的位次。`
    );
    push();
  }

  push("## 二、本周数据特征");
  push();

  if (newEntrants.length > 0) {
    push("### 新晋项目");
    push();
    for (const row of newEntrants) {
      push(
        `- **\`${row.key}\`**（第 ${row.rank} 名，${row.repo.language || "未知语言"}，★ ${formatNum(
          row.repo.stars
        )}）—— ${row.repo.description || "（无描述）"}`
      );
    }
    push();
  } else if (prevWeek) {
    push(
      `本周 ${repos.length} 个上榜项目全部在上周（${prevWeek.weekId}）已经出现过，没有新项目进入榜单。`
    );
    push();
  }

  if (!prevWeek) {
    push("这是本系列的第一期数据快照，暂无可对比的上一周，因此不展示排名变化。");
    push();
  }

  if (risers.length > 0) {
    push("### 排名上升");
    push();
    for (const row of risers) {
      push(
        `- **\`${row.key}\`** ${row.change.label}，现居第 ${row.rank} 名${
          row.starDelta !== null ? `，总 Star 较上周 ${formatDelta(row.starDelta)}` : ""
        }`
      );
    }
    push();
  }

  if (fallers.length > 0) {
    push("### 排名下降");
    push();
    for (const row of fallers) {
      push(
        `- **\`${row.key}\`** ${row.change.label}，现居第 ${row.rank} 名${
          row.starDelta !== null ? `，总 Star 较上周 ${formatDelta(row.starDelta)}` : ""
        }`
      );
    }
    push();
  }

  if (stayed.length > 0) {
    push("### 位次不变");
    push();
    push(
      stayed
        .map((row) => `\`${row.key}\`（第 ${row.rank} 名）`)
        .join("、")
    );
    push();
  }
  push("### 语言分布");
  push();
  push("| 语言 | 项目数 | 占比 |");
  push("| :--- | ---: | ---: |");
  for (const [lang, count] of langs) {
    push(`| ${lang} | ${count} | ${Math.round((count / repos.length) * 100)}% |`);
  }
  push();

  if (streaks.length > 0) {
    push("### 连续在榜");
    push();
    for (const row of streaks) {
      push(`- **\`${row.key}\`** 已连续 ${row.streak} 周在榜`);
    }
    push();
  }

  push("## 三、本周增长冠军");
  push();
  if (growthLeader && growthLeader.todayStars > 0) {
    push(
      `**\`${growthLeader.owner}/${growthLeader.repo}\`** 以单周 +${formatNum(
        growthLeader.todayStars
      )} Star 位列本周增量第一，当前总 Star ${formatNum(growthLeader.stars)}。`
    );
    push();
    if (growthLeader.description) {
      push(`> ${growthLeader.description}`);
      push();
    }
  } else {
    push("本周数据未包含 Star 增量信息。");
    push();
  }

  if (top) {
    push("## 四、榜首项目");
    push();
    push(`**\`${top.owner}/${top.repo}\`**（${top.language || "未知语言"}）`);
    push();
    push(`- 仓库：${top.url}`);
    push(`- 总 Star：${formatNum(top.stars)}　Fork：${formatNum(top.forks)}`);
    if (top.description) push(`- 简介：${top.description}`);
    push();
  }

  push("---");
  push();
  push(
    `本文由 \`scripts/generate-weekly-post.js\` 依据 [GitHub 每周热榜](/trending) 的抓取数据自动生成于 ${week.fetchedAt.slice(
      0,
      10
    )}。完整历史周次与语言筛选可在热榜页面交互查看。`
  );
  push();

  return { content: lines.join("\n"), weekId: week.weekId };
}

function main() {
  if (!fs.existsSync(DATA_FILE)) {
    console.error("[Post] 数据文件不存在，跳过生成。");
    return { generated: false };
  }

  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  const weeks = Array.isArray(data.weeks) ? data.weeks : [];
  if (weeks.length === 0) {
    console.error("[Post] 数据为空，跳过生成。");
    return { generated: false };
  }

  const weeksAsc = [...weeks].sort((a, b) => a.weekId.localeCompare(b.weekId));
  const latest = weeksAsc[weeksAsc.length - 1];
  const prev = weeksAsc[weeksAsc.length - 2] || null;

  const { weekIds, maxVol } = scanExistingPosts();
  if (weekIds.has(latest.weekId)) {
    console.log(`[Post] ${latest.weekId} 已有周报（手写或此前生成），跳过。`);
    return { generated: false, weekId: latest.weekId };
  }

  const vol = maxVol + 1;
  const { content } = buildPost(latest, prev, weeksAsc, vol);

  const outFile = path.join(
    BLOG_DIR,
    `${WEEKLY_POST_PREFIX}${latest.weekId.toLowerCase()}.md`
  );
  fs.mkdirSync(BLOG_DIR, { recursive: true });
  fs.writeFileSync(outFile, content);

  console.log(`[Post] 已生成 ${path.relative(ROOT, outFile)}（Vol. ${String(vol).padStart(2, "0")}）`);
  return { generated: true, weekId: latest.weekId };
}

try {
  const result = main();
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `post_generated=${result.generated}\npost_week_id=${result.weekId || ""}\n`
    );
  }
} catch (err) {
  console.error("[Post] 生成失败:", err.message);
  process.exit(1);
}
