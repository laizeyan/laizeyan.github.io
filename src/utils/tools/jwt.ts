// src/utils/tools/jwt.ts
// JWT 令牌纯前端解析与状态检测 (零服务端依赖，支持 UTF-8)

export interface JwtParsedResult {
  header: Record<string, any>;
  payload: Record<string, any>;
  alg: string;
  typ: string;
  expText: string;
  iatText: string;
  statusText: string;
  statusClass: "jwt-pill-valid" | "jwt-pill-expired" | "jwt-pill-perm";
}

export function b64UrlDecode(str: string): string {
  let output = str.replace(/-/g, "+").replace(/_/g, "/");
  switch (output.length % 4) {
    case 0: break;
    case 2: output += "=="; break;
    case 3: output += "="; break;
    default: throw new Error("非法 Base64URL 格式");
  }
  const bin = atob(output);
  const bytes = Uint8Array.from(bin, (m) => m.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function parseJwt(token: string): JwtParsedResult {
  const parts = token.trim().split(".");
  if (parts.length < 2) {
    throw new Error("无效的 JWT 令牌格式（必须包含 Header 与 Payload）");
  }

  const headerStr = b64UrlDecode(parts[0]);
  const payloadStr = b64UrlDecode(parts[1]);

  const header = JSON.parse(headerStr);
  const payload = JSON.parse(payloadStr);

  const alg = header.alg || "none";
  const typ = header.typ || "JWT";

  const nowSec = Math.floor(Date.now() / 1000);
  let expText = "未设置 (永久有效)";
  let statusText = "无过期时间";
  let statusClass: JwtParsedResult["statusClass"] = "jwt-pill-perm";

  if (payload.exp && typeof payload.exp === "number") {
    const expDate = new Date(payload.exp * 1000);
    const isExpired = payload.exp < nowSec;
    const diffSec = Math.abs(payload.exp - nowSec);
    const days = Math.floor(diffSec / 86400);
    const hours = Math.floor((diffSec % 86400) / 3600);
    const diffDesc = days > 0 ? `${days}天${hours}小时` : `${hours}小时`;

    expText = `${expDate.toLocaleString("zh-CN")} (${isExpired ? "已过期 " + diffDesc : "剩余 " + diffDesc})`;
    statusText = isExpired ? "已过期" : "有效 (未过期)";
    statusClass = isExpired ? "jwt-pill-expired" : "jwt-pill-valid";
  }

  let iatText = "未设置";
  if (payload.iat && typeof payload.iat === "number") {
    const iatDate = new Date(payload.iat * 1000);
    iatText = iatDate.toLocaleString("zh-CN");
  }

  return {
    header,
    payload,
    alg,
    typ,
    expText,
    iatText,
    statusText,
    statusClass,
  };
}
