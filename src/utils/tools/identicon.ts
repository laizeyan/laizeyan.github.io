// src/utils/tools/identicon.ts
// GitHub 风格 5x5 对称像素头像 (Identicon) 渲染器

export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function renderIdenticonToCanvas(
  canvas: HTMLCanvasElement,
  username: string,
  bgColor = "#f7f5ed"
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const val = username.trim() || "guest";
  const hash = hashString(val);

  const hue = hash % 360;
  const fgColor = `hsl(${hue}, 65%, 45%)`;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const gridSize = 5;
  const cellSize = canvas.width / (gridSize + 2);
  ctx.fillStyle = fgColor;

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < Math.ceil(gridSize / 2); c++) {
      const bit = (hash >> (r * 3 + c)) & 1;
      if (bit === 1) {
        const x1 = (c + 1) * cellSize;
        const x2 = (gridSize - c) * cellSize;
        const y = (r + 1) * cellSize;
        ctx.fillRect(x1, y, cellSize, cellSize);
        ctx.fillRect(x2, y, cellSize, cellSize);
      }
    }
  }
}
