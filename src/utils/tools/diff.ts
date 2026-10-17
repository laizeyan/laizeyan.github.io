// src/utils/tools/diff.ts
// 文本差异对比：基于最长公共子序列 (LCS) 动态规划算法的差分实现

export interface DiffItem {
  type: "eq" | "add" | "del";
  text: string;
  origNum?: number;
  modNum?: number;
}

export interface DiffResult {
  items: DiffItem[];
  addCount: number;
  delCount: number;
  eqCount: number;
}

/**
 * 计算行级 LCS 差分结果
 */
export function computeLcsDiff(origLines: string[], modLines: string[]): DiffItem[] {
  const m = origLines.length;
  const n = modLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (origLines[i] === modLines[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const result: DiffItem[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origLines[i - 1] === modLines[j - 1]) {
      result.unshift({ type: "eq", text: origLines[i - 1], origNum: i, modNum: j });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "add", text: modLines[j - 1], modNum: j });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({ type: "del", text: origLines[i - 1], origNum: i });
      i--;
    }
  }

  return result;
}

/**
 * 运行两段文本的差异对比
 */
export function diffTexts(origText: string, modText: string): DiffResult {
  const origLines = origText ? origText.split(/\r\n|\r|\n/) : [];
  const modLines = modText ? modText.split(/\r\n|\r|\n/) : [];
  const items = computeLcsDiff(origLines, modLines);

  let addCount = 0;
  let delCount = 0;
  let eqCount = 0;

  for (const item of items) {
    if (item.type === "add") addCount++;
    else if (item.type === "del") delCount++;
    else eqCount++;
  }

  return { items, addCount, delCount, eqCount };
}
