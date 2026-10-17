// src/utils/tools/common.ts
// 工具箱通用辅助函数：HTML 转义、字节大小格式化、字符统计、状态提示与复制反馈

export function escapeHtml(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function countTextStats(text: string): { chars: number; lines: number; bytes: number } {
  const chars = text.length;
  const lines = text ? text.split(/\r\n|\r|\n/).length : 0;
  const bytes = new TextEncoder().encode(text).length;
  return { chars, lines, bytes };
}

export function showStatus(elemId: string, msg: string, isError = false): void {
  const el = document.getElementById(elemId);
  if (!el) return;
  el.textContent = msg;
  el.className = `status-msg ${isError ? "status-err" : "status-ok"}`;
  setTimeout(() => {
    if (el && el.textContent === msg) el.textContent = "";
  }, 3500);
}

export function copyWithFeedback(
  button: HTMLElement | null,
  text: string,
  statusId?: string,
  msg = "已复制到剪贴板！"
): void {
  if (!button || !text) return;
  navigator.clipboard.writeText(text).then(() => {
    const originalText = button.textContent;
    button.textContent = "已复制 ✓";
    button.classList.add("copied");
    if (statusId) showStatus(statusId, msg);
    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove("copied");
    }, 1800);
  }).catch((err) => {
    console.error("复制失败:", err);
    if (statusId) showStatus(statusId, "复制失败，请手动选取复制", true);
  });
}

export function attachStats(
  inputEl: HTMLTextAreaElement | HTMLElement | null,
  statsId: string
): void {
  if (!inputEl) return;
  const statsEl = document.getElementById(statsId);
  if (!statsEl) return;

  const update = () => {
    const val = (inputEl as HTMLTextAreaElement).value !== undefined
      ? (inputEl as HTMLTextAreaElement).value
      : inputEl.textContent || "";
    const { chars, lines, bytes } = countTextStats(val);
    statsEl.textContent = `${chars.toLocaleString()} 字符 | ${lines.toLocaleString()} 行 | ${formatByteSize(bytes)}`;
  };

  inputEl.addEventListener("input", update);
  update();
}
