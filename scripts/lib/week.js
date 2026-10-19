// scripts/lib/week.js
// ISO 8601 周工具（周一为一周起点，周四决定归属年份）。
//
// 全部基于 UTC 计算：周编号与日期区间都是「纯日期」语义，
// 一旦混入本地时区，在 UTC+8 构建时会整体提前一天
// （2026-W42 曾被记成 10-11~10-17）。GitHub Actions 跑在 UTC，
// 本地开发在 UTC+8，只有统一用 UTC 才能保证两端产出完全一致。

/** 取给定时刻所在 ISO 周的周一（UTC 零点）。 */
export function getWeekStart(date) {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const dayOfWeek = d.getUTCDay(); // 0 = 周日
  d.setUTCDate(d.getUTCDate() - ((dayOfWeek + 6) % 7));
  return d;
}

/** 计算 ISO 周编号，如 2026-W43。跨年周按周四归属年份。 */
export function getWeekId(date) {
  const monday = getWeekStart(date);
  const thursday = new Date(monday);
  thursday.setUTCDate(monday.getUTCDate() + 3);
  const year = thursday.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const weekNumber = Math.floor((thursday - yearStart) / 86400000 / 7) + 1;
  return `${year}-W${String(weekNumber).padStart(2, "0")}`;
}

/** 取 ISO 周的起止日期（周一 ~ 周日，YYYY-MM-DD）。 */
export function getWeekDateRange(date) {
  const monday = getWeekStart(date);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return {
    startDate: monday.toISOString().split("T")[0],
    endDate: sunday.toISOString().split("T")[0],
  };
}

/**
 * 由周编号反推起止日期，如 2026-W43 → { startDate: 2026-10-19, endDate: 2026-10-25 }。
 * 用于校正历史数据中与周编号不一致的区间。
 */
export function getRangeFromWeekId(weekId) {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekId);
  if (!match) return null;

  const year = Number(match[1]);
  const week = Number(match[2]);
  // ISO 第 1 周 = 包含 1 月 4 日的那一周
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const firstMonday = getWeekStart(jan4);
  const monday = new Date(firstMonday);
  monday.setUTCDate(firstMonday.getUTCDate() + (week - 1) * 7);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return {
    startDate: monday.toISOString().split("T")[0],
    endDate: sunday.toISOString().split("T")[0],
  };
}

/**
 * 校正单周记录的 weekId 与起止日期，使其严格符合 ISO 8601。
 * 以 fetchedAt（真实抓取时刻）为唯一事实来源，避免沿用错误的历史字段。
 * 返回是否发生了修改。
 */
export function normalizeWeek(week) {
  const fetchedAt = new Date(week.fetchedAt);
  if (Number.isNaN(fetchedAt.getTime())) return false;

  const weekId = getWeekId(fetchedAt);
  const { startDate, endDate } = getWeekDateRange(fetchedAt);

  const changed =
    week.weekId !== weekId ||
    week.startDate !== startDate ||
    week.endDate !== endDate;

  week.weekId = weekId;
  week.startDate = startDate;
  week.endDate = endDate;
  return changed;
}
