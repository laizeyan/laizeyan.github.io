// src/scripts/tools-controller.ts
// 实用工具箱交互控制器：Tab 切换、全局快捷键、时钟与 13 款工具的事件调度

import {
  escapeHtml,
  showStatus,
  copyWithFeedback,
  attachStats
} from "../utils/tools/common";
import {
  calcMd5,
  calcSha,
  generateUuidV4,
  generateStrongPassword
} from "../utils/tools/crypto";
import {
  parseJwt
} from "../utils/tools/jwt";
import {
  computeLcsDiff
} from "../utils/tools/diff";
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  getLuminance,
  getContrast,
  presetColors
} from "../utils/tools/color";
import {
  renderIdenticonToCanvas
} from "../utils/tools/identicon";

let clockInterval: ReturnType<typeof setInterval> | null = null;
let globalKeydownListener: ((e: KeyboardEvent) => void) | null = null;

    function initToolbox() {
      const toolboxPanel = document.getElementById("toolbox-active-panel");
      if (!toolboxPanel) {
        if (clockInterval) {
          clearInterval(clockInterval);
          clockInterval = null;
        }
        if (globalKeydownListener) {
          document.removeEventListener("keydown", globalKeydownListener);
          globalKeydownListener = null;
        }
        return;
      }

      // 清除旧的定时器与监听器，避免 SPA 页面跳转累加
      if (clockInterval) {
        clearInterval(clockInterval);
        clockInterval = null;
      }
      if (globalKeydownListener) {
        document.removeEventListener("keydown", globalKeydownListener);
        globalKeydownListener = null;
      }

      // 通用辅助函数直接使用 ../utils/tools/common 导入

      // ----------------------------------------------------
      // 1. Tab 切换与侧边栏搜索筛选
      // ----------------------------------------------------
      const toolButtons = document.querySelectorAll<HTMLElement>(".tool-btn");
      const toolSections = document.querySelectorAll<HTMLElement>(".tool-section");
      const searchInput = document.getElementById("tool-search-input") as HTMLInputElement | null;
      const catGroups = document.querySelectorAll<HTMLElement>(".tool-cat-group");

      function activateTool(targetId: string) {
        toolSections.forEach((sec) => (sec.style.display = "none"));
        toolButtons.forEach((btn) => btn.classList.remove("active"));

        const activeSec = document.getElementById(`section-${targetId}`);
        const activeBtn = document.getElementById(`btn-${targetId}`) || document.querySelector(`[data-tool-target="${targetId}"]`);
        if (activeSec) activeSec.style.display = "block";
        if (activeBtn) activeBtn.classList.add("active");

        history.replaceState(null, "", `#${targetId}`);

        // 切换后按需触发初始逻辑
        if (targetId === "uuid") {
          const uuidOut = document.getElementById("uuid-output") as HTMLTextAreaElement | null;
          if (uuidOut && !uuidOut.value) document.getElementById("btn-gen-uuid")?.click();
          const pwdOut = document.getElementById("pwd-single-output") as HTMLInputElement | null;
          if (pwdOut && !pwdOut.value) document.getElementById("btn-gen-pwd")?.click();
        } else if (targetId === "color") {
          updateColorFromHex("#b4452e");
        }
      }

      toolButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const target = btn.getAttribute("data-tool-target");
          if (target) activateTool(target);
        });
      });

      function filterTools(query: string) {
        const q = query.trim().toLowerCase();
        catGroups.forEach((group) => {
          let hasVisibleInGroup = false;
          const btns = group.querySelectorAll<HTMLElement>(".tool-btn");
          btns.forEach((btn) => {
            const name = (btn.getAttribute("data-tool-name") || btn.textContent || "").toLowerCase();
            const target = (btn.getAttribute("data-tool-target") || "").toLowerCase();
            const cat = (btn.getAttribute("data-tool-cat") || "").toLowerCase();
            const match = !q || name.includes(q) || target.includes(q) || cat.includes(q);
            btn.style.display = match ? "flex" : "none";
            if (match) hasVisibleInGroup = true;
          });
          group.style.display = hasVisibleInGroup ? "block" : "none";
        });
      }

      searchInput?.addEventListener("input", () => {
        filterTools(searchInput.value);
      });

      // 全局快捷键 (/ 聚焦搜索，Esc 清空，Ctrl/Cmd+Enter 触发当前工具)
      function triggerActiveToolAction() {
        const activeSec = document.querySelector<HTMLElement>(".tool-section:not([style*='display: none'])");
        if (!activeSec) return;
        const id = activeSec.id.replace("section-", "");
        switch (id) {
          case "json": document.getElementById("btn-json-format")?.click(); break;
          case "base64": document.getElementById("btn-b64-encode")?.click(); break;
          case "url": document.getElementById("btn-url-encode")?.click(); break;
          case "unicode": document.getElementById("btn-uni-to-u")?.click(); break;
          case "jwt": document.getElementById("btn-jwt-parse")?.click(); break;
          case "hash": computeHashes(); break;
          case "uuid": document.getElementById("btn-gen-uuid")?.click(); break;
          case "timestamp": document.getElementById("btn-ts-to-date")?.click(); break;
          case "wordcount": document.getElementById("wc-input")?.dispatchEvent(new Event("input")); break;
          case "diff": document.getElementById("btn-run-diff")?.click(); break;
          case "regex": document.getElementById("regex-pattern")?.dispatchEvent(new Event("input")); break;
          case "avatar": document.getElementById("btn-avatar-random")?.click(); break;
        }
      }

      globalKeydownListener = (e: KeyboardEvent) => {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        const isInput = activeTag === "input" || activeTag === "textarea" || (document.activeElement as HTMLElement)?.isContentEditable;
        
        if (e.key === "/" && !isInput) {
          e.preventDefault();
          searchInput?.focus();
          searchInput?.select();
        } else if (e.key === "Escape" && document.activeElement === searchInput) {
          if (searchInput) {
            searchInput.value = "";
            filterTools("");
            searchInput.blur();
          }
        } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          triggerActiveToolAction();
        }
      };
      document.addEventListener("keydown", globalKeydownListener);

            // 时间戳快捷复制按钮
      document.querySelectorAll(".btn-copy-chip").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const targetId = btn.getAttribute("data-copy");
          if (!targetId) return;
          const targetEl = document.getElementById(targetId);
          const text = targetEl?.textContent?.trim();
          if (text && text !== "--") {
            copyWithFeedback(e.currentTarget as HTMLElement, text);
          }
        });
      });

      // 布局切换 (左右并排 / 上下堆叠)
      document.querySelectorAll(".btn-layout-toggle").forEach((btn) => {
        btn.addEventListener("click", () => {
          const sec = btn.closest(".tool-section");
          const grid = sec?.querySelector(".editor-grid");
          if (grid) {
            grid.classList.toggle("is-stacked");
            const isStacked = grid.classList.contains("is-stacked");
            btn.textContent = isStacked ? "堆叠 ➔ 并排" : "并排 ⇄ 堆叠";
          }
        });
      });

      // 默认激活路由对应工具或 JSON
      const hash = window.location.hash.replace("#", "");
      if (hash && document.getElementById(`section-${hash}`)) {
        activateTool(hash);
      } else {
        activateTool("json");
      }

      // ==========================================
      // 1. JSON 格式化、压缩与转义
      // ==========================================
      const jsonIn = document.getElementById("json-input") as HTMLTextAreaElement | null;
      const jsonOut = document.getElementById("json-output");
      const jsonIndent = document.getElementById("json-indent") as HTMLSelectElement | null;
      const jsonFileInput = document.getElementById("json-file-input") as HTMLInputElement | null;

      attachStats(jsonIn, "json-input-stats");
      attachStats(jsonOut, "json-output-stats");

      document.getElementById("btn-json-sample")?.addEventListener("click", () => {
        if (!jsonIn) return;
        jsonIn.value = JSON.stringify(
          {
            project: "laizeyan.github.io",
            author: "Ze'Yan",
            theme: "Minimal Magazine Style",
            tags: ["Astro", "TypeScript", "Engineering"],
            features: {
              trending: true,
              toolbox: true,
              offlineReady: true,
            },
            stats: { stars: 128, version: "2.4.0" }
          },
          null,
          2
        );
        jsonIn.dispatchEvent(new Event("input"));
        document.getElementById("btn-json-format")?.click();
      });

      document.getElementById("btn-json-format")?.addEventListener("click", () => {
        if (!jsonIn || !jsonOut) return;
        const raw = jsonIn.value.trim();
        if (!raw) {
          showStatus("json-status", "请输入需要格式化的 JSON 内容，或点击「示例」", true);
          return;
        }
        try {
          const parsed = JSON.parse(raw);
          const space = jsonIndent && jsonIndent.value === "tabs" ? "	" : parseInt(jsonIndent?.value || "2", 10);
          jsonOut.textContent = JSON.stringify(parsed, null, space);
          jsonOut.dispatchEvent(new Event("input"));
          showStatus("json-status", "格式化成功！");
        } catch (e: any) {
          showStatus("json-status", `JSON 语法解析错误: ${e.message}`, true);
        }
      });

      document.getElementById("btn-json-minify")?.addEventListener("click", () => {
        if (!jsonIn || !jsonOut) return;
        const raw = jsonIn.value.trim();
        if (!raw) {
          showStatus("json-status", "请输入需要压缩的 JSON 内容", true);
          return;
        }
        try {
          const parsed = JSON.parse(raw);
          jsonOut.textContent = JSON.stringify(parsed);
          jsonOut.dispatchEvent(new Event("input"));
          showStatus("json-status", "单行压缩成功！");
        } catch (e: any) {
          showStatus("json-status", `JSON 语法解析错误: ${e.message}`, true);
        }
      });

      document.getElementById("btn-json-escape")?.addEventListener("click", () => {
        if (!jsonIn || !jsonOut) return;
        const raw = jsonIn.value;
        if (!raw) {
          showStatus("json-status", "请输入需要转义的字符串", true);
          return;
        }
        jsonOut.textContent = JSON.stringify(raw);
        jsonOut.dispatchEvent(new Event("input"));
        showStatus("json-status", "已转义为合法的 JSON 字符串！");
      });

      document.getElementById("btn-json-unescape")?.addEventListener("click", () => {
        if (!jsonIn || !jsonOut) return;
        const raw = jsonIn.value.trim();
        if (!raw) {
          showStatus("json-status", "请输入需要去除转义的内容", true);
          return;
        }
        try {
          if (raw.startsWith('"') && raw.endsWith('"')) {
            jsonOut.textContent = JSON.parse(raw);
          } else {
            jsonOut.textContent = JSON.parse(`"${raw}"`);
          }
          jsonOut.dispatchEvent(new Event("input"));
          showStatus("json-status", "去除转义成功！");
        } catch {
          // 降级使用正则替换反斜杠
          jsonOut.textContent = raw.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\\\/g, '\\');
          jsonOut.dispatchEvent(new Event("input"));
          showStatus("json-status", "已按常规反斜杠规则去除转义");
        }
      });

      document.getElementById("btn-json-copy")?.addEventListener("click", (e) => {
        if (jsonOut && jsonOut.textContent) {
          copyWithFeedback(e.currentTarget as HTMLElement, jsonOut.textContent, "json-status", "已复制 JSON 结果！");
        }
      });

      document.getElementById("btn-json-clear")?.addEventListener("click", () => {
        if (jsonIn) { jsonIn.value = ""; jsonIn.dispatchEvent(new Event("input")); }
        if (jsonOut) { jsonOut.textContent = ""; jsonOut.dispatchEvent(new Event("input")); }
        showStatus("json-status", "已清空内容");
      });

      // 文件导入与拖拽
      jsonFileInput?.addEventListener("change", () => {
        const file = jsonFileInput.files?.[0];
        if (!file || !jsonIn) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          jsonIn.value = e.target?.result as string || "";
          jsonIn.dispatchEvent(new Event("input"));
          document.getElementById("btn-json-format")?.click();
        };
        reader.readAsText(file);
      });

      jsonIn?.addEventListener("dragover", (e) => e.preventDefault());
      jsonIn?.addEventListener("drop", (e) => {
        e.preventDefault();
        const file = e.dataTransfer?.files?.[0];
        if (!file || !jsonIn) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          jsonIn.value = ev.target?.result as string || "";
          jsonIn.dispatchEvent(new Event("input"));
          document.getElementById("btn-json-format")?.click();
        };
        reader.readAsText(file);
      });

      // ==========================================
      // 2. Base64 编解码 (UTF-8 安全)
      // ==========================================
      const b64In = document.getElementById("b64-input") as HTMLTextAreaElement | null;
      const b64Out = document.getElementById("b64-output") as HTMLTextAreaElement | null;
      const b64FileInput = document.getElementById("b64-file-input") as HTMLInputElement | null;

      attachStats(b64In, "b64-input-stats");
      attachStats(b64Out, "b64-output-stats");

      document.getElementById("btn-b64-sample")?.addEventListener("click", () => {
        if (b64In) {
          b64In.value = "你好，世界！Hello World 🚀 专注极简杂志美学设计";
          b64In.dispatchEvent(new Event("input"));
        }
      });

      document.getElementById("btn-b64-encode")?.addEventListener("click", () => {
        if (!b64In || !b64Out) return;
        if (!b64In.value.trim()) {
          showStatus("b64-status", "请输入需要编码的明文，或点击「示例」", true);
          return;
        }
        try {
          const bytes = new TextEncoder().encode(b64In.value);
          let binString = "";
          for (let i = 0; i < bytes.length; i++) {
            binString += String.fromCharCode(bytes[i]);
          }
          b64Out.value = btoa(binString);
          b64Out.dispatchEvent(new Event("input"));
          showStatus("b64-status", "Base64 编码成功！");
        } catch (e: any) {
          showStatus("b64-status", `编码错误: ${e.message}`, true);
        }
      });

      document.getElementById("btn-b64-decode")?.addEventListener("click", () => {
        if (!b64In || !b64Out) return;
        const raw = b64In.value.trim();
        if (!raw) {
          showStatus("b64-status", "请输入需要解码的 Base64 字符串", true);
          return;
        }
        try {
          const binString = atob(raw);
          const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
          b64Out.value = new TextDecoder().decode(bytes);
          b64Out.dispatchEvent(new Event("input"));
          showStatus("b64-status", "Base64 解码成功！");
        } catch {
          showStatus("b64-status", "解码失败：输入内容不是合法的 Base64 字符串", true);
        }
      });

      document.getElementById("btn-b64-copy")?.addEventListener("click", (e) => {
        if (b64Out && b64Out.value) {
          copyWithFeedback(e.currentTarget as HTMLElement, b64Out.value, "b64-status", "已复制 Base64 结果！");
        }
      });

      b64FileInput?.addEventListener("change", () => {
        const file = b64FileInput.files?.[0];
        if (!file || !b64Out) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          const res = e.target?.result as string || "";
          b64Out.value = res;
          b64Out.dispatchEvent(new Event("input"));
          showStatus("b64-status", `已导入文件「${file.name}」并转为 DataURL Base64`);
        };
        reader.readAsDataURL(file);
      });

      document.getElementById("btn-b64-clear")?.addEventListener("click", () => {
        if (b64In) { b64In.value = ""; b64In.dispatchEvent(new Event("input")); }
        if (b64Out) { b64Out.value = ""; b64Out.dispatchEvent(new Event("input")); }
      });

      // ==========================================
      // 3. URL 编解码与 Query 参数解析
      // ==========================================
      const urlIn = document.getElementById("url-input") as HTMLTextAreaElement | null;
      const urlOut = document.getElementById("url-output") as HTMLTextAreaElement | null;

      attachStats(urlIn, "url-input-stats");
      attachStats(urlOut, "url-output-stats");

      document.getElementById("btn-url-sample")?.addEventListener("click", () => {
        if (urlIn) {
          urlIn.value = "https://laizeyan.github.io/tools?category=dev&sort=desc&page=1&tags=astro&tags=typescript&keyword=极简杂志风";
          urlIn.dispatchEvent(new Event("input"));
        }
      });

      document.getElementById("btn-url-encode")?.addEventListener("click", () => {
        if (!urlIn || !urlOut) return;
        if (!urlIn.value.trim()) {
          showStatus("url-status", "请输入需要编码的 URL 或参数文本", true);
          return;
        }
        urlOut.value = encodeURIComponent(urlIn.value);
        urlOut.dispatchEvent(new Event("input"));
        showStatus("url-status", "URL 编码完成！");
      });

      document.getElementById("btn-url-decode")?.addEventListener("click", () => {
        if (!urlIn || !urlOut) return;
        if (!urlIn.value.trim()) {
          showStatus("url-status", "请输入需要解码的 URL 或参数文本", true);
          return;
        }
        try {
          urlOut.value = decodeURIComponent(urlIn.value);
          urlOut.dispatchEvent(new Event("input"));
          showStatus("url-status", "URL 解码完成！");
        } catch (e: any) {
          showStatus("url-status", `解码失败: ${e.message}`, true);
        }
      });

      document.getElementById("btn-url-parse-params")?.addEventListener("click", () => {
        if (!urlIn || !urlOut) return;
        const val = urlIn.value.trim();
        if (!val) {
          showStatus("url-status", "请输入包含 Query 参数的 URL 或查询串", true);
          return;
        }
        try {
          let queryPart = val;
          if (queryPart.includes("?")) {
            queryPart = queryPart.split("?")[1].split("#")[0];
          }
          const params = new URLSearchParams(queryPart);
          const obj: Record<string, any> = {};
          params.forEach((v, k) => {
            if (k in obj) {
              if (Array.isArray(obj[k])) {
                obj[k].push(v);
              } else {
                obj[k] = [obj[k], v];
              }
            } else {
              obj[k] = v;
            }
          });
          urlOut.value = JSON.stringify(obj, null, 2);
          urlOut.dispatchEvent(new Event("input"));
          showStatus("url-status", "已解析 Query 参数为结构化 JSON！");
        } catch (e: any) {
          showStatus("url-status", `参数解析错误: ${e.message}`, true);
        }
      });

      document.getElementById("btn-url-copy")?.addEventListener("click", (e) => {
        if (urlOut && urlOut.value) {
          copyWithFeedback(e.currentTarget as HTMLElement, urlOut.value, "url-status", "已复制 URL 处理结果！");
        }
      });

      document.getElementById("btn-url-clear")?.addEventListener("click", () => {
        if (urlIn) { urlIn.value = ""; urlIn.dispatchEvent(new Event("input")); }
        if (urlOut) { urlOut.value = ""; urlOut.dispatchEvent(new Event("input")); }
      });

      // ==========================================
      // 4. Unicode 转换
      // ==========================================
      const uniIn = document.getElementById("uni-input") as HTMLTextAreaElement | null;
      const uniOut = document.getElementById("uni-output") as HTMLTextAreaElement | null;

      attachStats(uniIn, "uni-input-stats");
      attachStats(uniOut, "uni-output-stats");

      document.getElementById("btn-uni-sample")?.addEventListener("click", () => {
        if (uniIn) {
          uniIn.value = "优雅永不过时 · Minimal Magazine Design 🚀";
          uniIn.dispatchEvent(new Event("input"));
        }
      });

      document.getElementById("btn-uni-to-u")?.addEventListener("click", () => {
        if (!uniIn || !uniOut) return;
        if (!uniIn.value.trim()) {
          showStatus("uni-status", "请输入需要转换的文本内容", true);
          return;
        }
        uniOut.value = uniIn.value
          .split("")
          .map((c) => {
            const code = c.charCodeAt(0);
            return code > 127 ? "\\u" + code.toString(16).padStart(4, "0") : c;
          })
          .join("");
        uniOut.dispatchEvent(new Event("input"));
        showStatus("uni-status", "转为 Unicode 编码完成！");
      });

      document.getElementById("btn-u-to-text")?.addEventListener("click", () => {
        if (!uniIn || !uniOut) return;
        if (!uniIn.value.trim()) {
          showStatus("uni-status", "请输入包含 \\uXXXX 的 Unicode 编码文本", true);
          return;
        }
        try {
          uniOut.value = uniIn.value.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
            String.fromCharCode(parseInt(hex, 16))
          );
          uniOut.dispatchEvent(new Event("input"));
          showStatus("uni-status", "解码为明文完成！");
        } catch (e: any) {
          showStatus("uni-status", `转换失败: ${e.message}`, true);
        }
      });

      document.getElementById("btn-uni-copy")?.addEventListener("click", (e) => {
        if (uniOut && uniOut.value) {
          copyWithFeedback(e.currentTarget as HTMLElement, uniOut.value, "uni-status", "已复制 Unicode 结果！");
        }
      });

      document.getElementById("btn-uni-clear")?.addEventListener("click", () => {
        if (uniIn) { uniIn.value = ""; uniIn.dispatchEvent(new Event("input")); }
        if (uniOut) { uniOut.value = ""; uniOut.dispatchEvent(new Event("input")); }
      });

      // ==========================================
      // 5. JWT 令牌解析与校验
      // ==========================================
      const jwtIn = document.getElementById("jwt-input") as HTMLTextAreaElement | null;
      const jwtHeaderOut = document.getElementById("jwt-header-out");
      const jwtPayloadOut = document.getElementById("jwt-payload-out");
      const jwtInfoCard = document.getElementById("jwt-info-card");
      const jwtStatusPill = document.getElementById("jwt-status-pill");
      const jwtAlg = document.getElementById("jwt-alg");
      const jwtTyp = document.getElementById("jwt-typ");
      const jwtExp = document.getElementById("jwt-exp");
      const jwtIat = document.getElementById("jwt-iat");

      attachStats(jwtIn, "jwt-input-stats");

      function handleParseJwt() {
        if (!jwtIn || !jwtHeaderOut || !jwtPayloadOut) return;
        const token = jwtIn.value.trim();
        if (!token) {
          showStatus("jwt-status", "请输入 JWT 令牌内容，或点击「示例」", true);
          return;
        }

        try {
          const res = parseJwt(token);

          jwtHeaderOut.textContent = JSON.stringify(res.header, null, 2);
          jwtPayloadOut.textContent = JSON.stringify(res.payload, null, 2);

          if (jwtInfoCard) jwtInfoCard.style.display = "block";
          if (jwtAlg) jwtAlg.textContent = res.alg;
          if (jwtTyp) jwtTyp.textContent = res.typ;
          if (jwtExp) jwtExp.textContent = res.expText;
          if (jwtIat) jwtIat.textContent = res.iatText;
          if (jwtStatusPill) {
            jwtStatusPill.textContent = res.statusText;
            jwtStatusPill.className = `jwt-status-pill ${res.statusClass}`;
          }

          showStatus("jwt-status", "JWT 令牌解析成功！");
        } catch (e: any) {
          showStatus("jwt-status", `JWT 解析错误: ${e.message}`, true);
        }
      }

      document.getElementById("btn-jwt-parse")?.addEventListener("click", handleParseJwt);

      document.getElementById("btn-jwt-copy-payload")?.addEventListener("click", (e) => {
        if (jwtPayloadOut && jwtPayloadOut.textContent) {
          copyWithFeedback(e.currentTarget as HTMLElement, jwtPayloadOut.textContent, "jwt-status", "已复制 Payload 数据！");
        }
      });

      document.getElementById("btn-jwt-sample")?.addEventListener("click", () => {
        if (!jwtIn) return;
        const now = Math.floor(Date.now() / 1000);
        // 生成一个有效期7天的合法测试 JWT (Header: {"alg":"HS256","typ":"JWT"})
        const h = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
        const pObj = {
          sub: "185807be-60a2-4e00-8610",
          name: "Ze'Yan",
          role: "admin",
          iss: "https://laizeyan.github.io",
          iat: now,
          exp: now + 7 * 86400,
          permissions: ["read", "write", "manage"]
        };
        const pBytes = new TextEncoder().encode(JSON.stringify(pObj));
        let pBin = "";
        for (let i = 0; i < pBytes.length; i++) pBin += String.fromCharCode(pBytes[i]);
        const p = btoa(pBin)
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");
        const s = "sZk6xM2O_4k8V_TestSignatureMockOnlyDoNotVerify";
        jwtIn.value = `${h}.${p}.${s}`;
        jwtIn.dispatchEvent(new Event("input"));
        handleParseJwt();
      });

      document.getElementById("btn-jwt-clear")?.addEventListener("click", () => {
        if (jwtIn) { jwtIn.value = ""; jwtIn.dispatchEvent(new Event("input")); }
        if (jwtHeaderOut) jwtHeaderOut.textContent = "";
        if (jwtPayloadOut) jwtPayloadOut.textContent = "";
        if (jwtInfoCard) jwtInfoCard.style.display = "none";
        showStatus("jwt-status", "已清空内容");
      });

      // ==========================================
      // 6. 哈希散列计算 (MD5 / SHA 系列)
      // ==========================================
      const hashIn = document.getElementById("hash-input") as HTMLTextAreaElement | null;
      const hashUpper = document.getElementById("hash-uppercase") as HTMLInputElement | null;
      const hashCompareIn = document.getElementById("hash-compare-input") as HTMLInputElement | null;
      const hashCompareResult = document.getElementById("hash-compare-result");

      const valMd5 = document.getElementById("val-md5");
      const valSha1 = document.getElementById("val-sha1");
      const valSha256 = document.getElementById("val-sha256");
      const valSha512 = document.getElementById("val-sha512");

      attachStats(hashIn, "hash-input-stats");

      async function computeHashes() {
        if (!hashIn) return;
        const text = hashIn.value;
        const isUpper = !!hashUpper?.checked;

        if (!text) {
          if (valMd5) valMd5.textContent = "--";
          if (valSha1) valSha1.textContent = "--";
          if (valSha256) valSha256.textContent = "--";
          if (valSha512) valSha512.textContent = "--";
          checkHashMatch();
          return;
        }

        try {
          let hMd5 = calcMd5(text);
          let hSha1 = await calcSha("SHA-1", text);
          let hSha256 = await calcSha("SHA-256", text);
          let hSha512 = await calcSha("SHA-512", text);

          if (isUpper) {
            hMd5 = hMd5.toUpperCase();
            hSha1 = hSha1.toUpperCase();
            hSha256 = hSha256.toUpperCase();
            hSha512 = hSha512.toUpperCase();
          }

          if (valMd5) valMd5.textContent = hMd5;
          if (valSha1) valSha1.textContent = hSha1;
          if (valSha256) valSha256.textContent = hSha256;
          if (valSha512) valSha512.textContent = hSha512;

          checkHashMatch();
        } catch (e: any) {
          showStatus("hash-status", `哈希计算异常: ${e.message}`, true);
        }
      }

      function checkHashMatch() {
        if (!hashCompareIn || !hashCompareResult) return;
        const target = hashCompareIn.value.trim().toLowerCase();
        
        document.querySelectorAll(".hash-row").forEach((r) => r.classList.remove("hash-row-highlight"));

        if (!target) {
          hashCompareResult.textContent = "";
          hashCompareResult.className = "hash-match-pill";
          return;
        }

        const m5 = (valMd5?.textContent || "").toLowerCase();
        const s1 = (valSha1?.textContent || "").toLowerCase();
        const s256 = (valSha256?.textContent || "").toLowerCase();
        const s512 = (valSha512?.textContent || "").toLowerCase();

        let matchAlgo = "";
        if (target === m5 && m5 !== "--") { matchAlgo = "MD5"; document.getElementById("row-md5")?.classList.add("hash-row-highlight"); }
        else if (target === s1 && s1 !== "--") { matchAlgo = "SHA-1"; document.getElementById("row-sha1")?.classList.add("hash-row-highlight"); }
        else if (target === s256 && s256 !== "--") { matchAlgo = "SHA-256"; document.getElementById("row-sha256")?.classList.add("hash-row-highlight"); }
        else if (target === s512 && s512 !== "--") { matchAlgo = "SHA-512"; document.getElementById("row-sha512")?.classList.add("hash-row-highlight"); }

        if (matchAlgo) {
          hashCompareResult.textContent = `✓ 校验匹配: ${matchAlgo}`;
          hashCompareResult.className = "hash-match-pill match-found";
        } else {
          hashCompareResult.textContent = "✕ 未匹配当前文本的任何散列";
          hashCompareResult.className = "hash-match-pill match-not-found";
        }
      }

      hashIn?.addEventListener("input", computeHashes);
      hashUpper?.addEventListener("change", computeHashes);
      hashCompareIn?.addEventListener("input", checkHashMatch);

      document.querySelectorAll(".btn-copy-hash").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const targetId = btn.getAttribute("data-target");
          if (!targetId) return;
          const valEl = document.getElementById(targetId);
          if (valEl && valEl.textContent && valEl.textContent !== "--") {
            copyWithFeedback(e.currentTarget as HTMLElement, valEl.textContent, "hash-status", "已复制哈希值！");
          }
        });
      });

      document.getElementById("btn-hash-sample")?.addEventListener("click", () => {
        if (!hashIn) return;
        hashIn.value = "Hello, World! Minimal Magazine Style 2026";
        hashIn.dispatchEvent(new Event("input"));
      });

      document.getElementById("btn-hash-clear")?.addEventListener("click", () => {
        if (hashIn) { hashIn.value = ""; hashIn.dispatchEvent(new Event("input")); }
        if (hashCompareIn) hashCompareIn.value = "";
        checkHashMatch();
      });

      // ==========================================
      // 7. UUID 与安全强密码生成器
      // ==========================================
      const uuidCount = document.getElementById("uuid-count") as HTMLSelectElement | null;
      const uuidUpper = document.getElementById("uuid-upper") as HTMLInputElement | null;
      const uuidNoHyphen = document.getElementById("uuid-nohyphen") as HTMLInputElement | null;
      const uuidOut = document.getElementById("uuid-output") as HTMLTextAreaElement | null;

      // generateUuidV4 使用 ../utils/tools/crypto 导入

      function runGenerateUuid() {
        if (!uuidOut) return;
        const count = parseInt(uuidCount?.value || "5", 10);
        const upper = !!uuidUpper?.checked;
        const noHyphen = !!uuidNoHyphen?.checked;

        const list: string[] = [];
        for (let i = 0; i < count; i++) {
          let u = generateUuidV4();
          if (noHyphen) u = u.replace(/-/g, "");
          if (upper) u = u.toUpperCase();
          list.push(u);
        }
        uuidOut.value = list.join("\n");
        showStatus("uuid-status", `已批量生成 ${count} 条 UUID v4`);
      }

      document.getElementById("btn-gen-uuid")?.addEventListener("click", runGenerateUuid);

      document.getElementById("btn-copy-uuid")?.addEventListener("click", (e) => {
        if (uuidOut && uuidOut.value) {
          copyWithFeedback(e.currentTarget as HTMLElement, uuidOut.value, "uuid-status", "已复制全部 UUID！");
        }
      });

      // 密码生成器
      const pwdLen = document.getElementById("pwd-len") as HTMLInputElement | null;
      const pwdLenVal = document.getElementById("pwd-len-val");
      const pwdUpper = document.getElementById("pwd-upper") as HTMLInputElement | null;
      const pwdLower = document.getElementById("pwd-lower") as HTMLInputElement | null;
      const pwdDigits = document.getElementById("pwd-digits") as HTMLInputElement | null;
      const pwdSymbols = document.getElementById("pwd-symbols") as HTMLInputElement | null;
      const pwdNoAmbig = document.getElementById("pwd-no-ambig") as HTMLInputElement | null;
      const pwdOut = document.getElementById("pwd-single-output") as HTMLInputElement | null;
      const strengthFill = document.getElementById("strength-fill");
      const strengthText = document.getElementById("strength-text");

      pwdLen?.addEventListener("input", () => {
        if (pwdLenVal && pwdLen) pwdLenVal.textContent = pwdLen.value;
        runGeneratePassword();
      });

      [pwdUpper, pwdLower, pwdDigits, pwdSymbols, pwdNoAmbig].forEach((chk) => {
        chk?.addEventListener("change", runGeneratePassword);
      });

      function runGeneratePassword() {
        if (!pwdOut) return;
        const len = parseInt(pwdLen?.value || "16", 10);
        const { password, entropy, strengthText: sText } = generateStrongPassword({
          length: len,
          upper: !!pwdUpper?.checked,
          lower: !!pwdLower?.checked,
          digits: !!pwdDigits?.checked,
          symbols: !!pwdSymbols?.checked,
          noAmbiguous: !!pwdNoAmbig?.checked,
        });

        pwdOut.value = password;

        if (strengthFill && strengthText) {
          strengthText.textContent = sText;
          if (entropy < 45) {
            strengthFill.style.width = "25%";
            strengthFill.style.backgroundColor = "#e53935";
          } else if (entropy < 65) {
            strengthFill.style.width = "50%";
            strengthFill.style.backgroundColor = "#f59e0b";
          } else if (entropy < 85) {
            strengthFill.style.width = "75%";
            strengthFill.style.backgroundColor = "#10b981";
          } else {
            strengthFill.style.width = "100%";
            strengthFill.style.backgroundColor = "#06b6d4";
          }
        }
      }

      document.getElementById("btn-gen-pwd")?.addEventListener("click", runGeneratePassword);

      document.getElementById("btn-copy-pwd")?.addEventListener("click", (e) => {
        if (pwdOut && pwdOut.value) {
          copyWithFeedback(e.currentTarget as HTMLElement, pwdOut.value, "uuid-status", "已复制随机安全密码！");
        }
      });

      // ==========================================
      // 8. Unix 时间戳与时区时钟
      // ==========================================
      const liveSec = document.getElementById("live-ts-sec");
      const liveMs = document.getElementById("live-ts-ms");
      let clockRunning = true;

      function updateLiveClock() {
        if (!clockRunning) return;
        const now = Date.now();
        if (liveSec) liveSec.textContent = Math.floor(now / 1000).toString();
        if (liveMs) liveMs.textContent = now.toString();
      }
      updateLiveClock();
      clockInterval = setInterval(updateLiveClock, 500);

      const toggleClockBtn = document.getElementById("btn-toggle-clock");
      toggleClockBtn?.addEventListener("click", () => {
        clockRunning = !clockRunning;
        if (toggleClockBtn) {
          toggleClockBtn.textContent = clockRunning ? "暂停时钟" : "恢复时钟";
        }
      });

      // 时间戳 -> 日期
      const tsInput = document.getElementById("ts-to-date-input") as HTMLInputElement | null;
      const convertTsToDate = () => {
        if (!tsInput) return;
        const val = tsInput.value.trim();
        if (!val) return;
        let ts = parseInt(val, 10);
        if (isNaN(ts)) return;
        if (val.length === 10) ts *= 1000;
        const d = new Date(ts);
        if (isNaN(d.getTime())) return;

        const bjEl = document.getElementById("res-bj");
        const utcEl = document.getElementById("res-utc");
        const isoEl = document.getElementById("res-iso");
        if (bjEl) {
          bjEl.textContent = d.toLocaleString("zh-CN", {
            timeZone: "Asia/Shanghai",
            hour12: false,
          });
        }
        if (utcEl) utcEl.textContent = d.toUTCString();
        if (isoEl) isoEl.textContent = d.toISOString();
      };

      document.getElementById("btn-ts-to-date")?.addEventListener("click", convertTsToDate);

      document.getElementById("btn-ts-fill-now")?.addEventListener("click", () => {
        if (tsInput) {
          tsInput.value = Math.floor(Date.now() / 1000).toString();
          convertTsToDate();
        }
      });

      // 相对时间快速调整按钮
      document.querySelectorAll(".btn-time-quick").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (!tsInput) return;
          const offset = btn.getAttribute("data-offset");
          const now = Date.now();
          let targetMs = now;

          if (offset === "midnight") {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            targetMs = today.getTime();
          } else if (offset === "+1h") {
            targetMs = now + 3600 * 1000;
          } else if (offset === "+1d") {
            targetMs = now + 86400 * 1000;
          } else if (offset === "+7d") {
            targetMs = now + 7 * 86400 * 1000;
          } else if (offset === "-1d") {
            targetMs = now - 86400 * 1000;
          }

          tsInput.value = Math.floor(targetMs / 1000).toString();
          convertTsToDate();
        });
      });

      // 日期 -> 时间戳
      const dateInput = document.getElementById("date-to-ts-input") as HTMLInputElement | null;
      const convertDateToTs = () => {
        if (!dateInput || !dateInput.value) return;
        const d = new Date(dateInput.value);
        const ms = d.getTime();
        if (isNaN(ms)) return;
        const secEl = document.getElementById("res-sec");
        const msEl = document.getElementById("res-ms");
        if (secEl) secEl.textContent = Math.floor(ms / 1000).toString();
        if (msEl) msEl.textContent = ms.toString();
      };

      document.getElementById("btn-date-to-ts")?.addEventListener("click", convertDateToTs);

      document.getElementById("btn-date-fill-now")?.addEventListener("click", () => {
        if (dateInput) {
          const now = new Date();
          const pad = (n: number) => n.toString().padStart(2, "0");
          dateInput.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
          convertDateToTs();
        }
      });

      if (tsInput && !tsInput.value) {
        tsInput.value = Math.floor(Date.now() / 1000).toString();
        convertTsToDate();
      }
      if (dateInput && !dateInput.value) {
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, "0");
        dateInput.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        convertDateToTs();
      }

      // ==========================================
      // 9. 字数与阅读统计
      // ==========================================
      const wcIn = document.getElementById("wc-input") as HTMLTextAreaElement | null;
      const wcFileInput = document.getElementById("wc-file-input") as HTMLInputElement | null;

      attachStats(wcIn, "wc-input-stats");

      function calcWordCount() {
        if (!wcIn) return;
        const str = wcIn.value;
        const totalChars = str.length;
        const nonSpace = str.replace(/\s/g, "").length;
        const cjk = (str.match(/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g) || []).length;
        const words = (str.match(/[a-zA-Z0-9_-]+/g) || []).length;
        const lines = str ? str.split(/\r\n|\r|\n/).length : 0;
        const paragraphs = str ? str.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length : 0;
        const estMin = Math.ceil((cjk + words) / 350);

        const tc = document.getElementById("stat-total-chars");
        const ns = document.getElementById("stat-non-space");
        const ck = document.getElementById("stat-cjk");
        const wd = document.getElementById("stat-words");
        const ln = document.getElementById("stat-lines");
        const pg = document.getElementById("stat-paragraphs");
        const rt = document.getElementById("stat-reading-time");

        if (tc) tc.textContent = totalChars.toLocaleString();
        if (ns) ns.textContent = nonSpace.toLocaleString();
        if (ck) ck.textContent = cjk.toLocaleString();
        if (wd) wd.textContent = words.toLocaleString();
        if (ln) ln.textContent = lines.toLocaleString();
        if (pg) pg.textContent = paragraphs.toLocaleString();
        if (rt) rt.textContent = `${estMin} 分钟`;
      }

      wcIn?.addEventListener("input", calcWordCount);

      wcFileInput?.addEventListener("change", () => {
        const file = wcFileInput.files?.[0];
        if (!file || !wcIn) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          wcIn.value = e.target?.result as string || "";
          wcIn.dispatchEvent(new Event("input"));
          calcWordCount();
        };
        reader.readAsText(file);
      });

      document.getElementById("btn-wc-sample")?.addEventListener("click", () => {
        if (!wcIn) return;
        wcIn.value = `## 设计的本质是减法\n\n好的设计不仅在于添加了什么，更在于去掉了什么。在这座数字花园中，我们追求像纸质刊物一样的宁静与排版韵味。\n\nEvery line of code and every stroke of design should serve a clear purpose. Zero clutter, pure focus.`;
        wcIn.dispatchEvent(new Event("input"));
        calcWordCount();
      });

      document.getElementById("btn-wc-clear")?.addEventListener("click", () => {
        if (wcIn) {
          wcIn.value = "";
          wcIn.dispatchEvent(new Event("input"));
          calcWordCount();
        }
      });

      // ==========================================
      // 10. 文本差异对比 (Diff，LCS 算法)
      // ==========================================
      const diffOrig = document.getElementById("diff-original") as HTMLTextAreaElement | null;
      const diffMod = document.getElementById("diff-modified") as HTMLTextAreaElement | null;
      const resBox = document.getElementById("diff-result");
      const diffSummary = document.getElementById("diff-summary");

      attachStats(diffOrig, "diff-orig-stats");
      attachStats(diffMod, "diff-mod-stats");

      // computeLcsDiff 使用 ../utils/tools/diff 导入

      function runDiff() {
        if (!diffOrig || !diffMod || !resBox) return;
        const origText = diffOrig.value;
        const modText = diffMod.value;

        if (!origText && !modText) {
          resBox.innerHTML = '<p class="diff-placeholder">请输入需要对比的文本或点击「填入对比示例」。</p>';
          if (diffSummary) diffSummary.innerHTML = "";
          return;
        }

        const origLines = origText ? origText.split(/\r\n|\r|\n/) : [];
        const modLines = modText ? modText.split(/\r\n|\r|\n/) : [];
        const diffItems = computeLcsDiff(origLines, modLines);

        let addCount = 0;
        let delCount = 0;
        let eqCount = 0;

        let html = '<div class="diff-lines">';
        diffItems.forEach((item) => {
          if (item.type === "add") {
            addCount++;
            html += `<div class="diff-line diff-add"><span class="diff-num">+</span>${escapeHtml(item.text)}</div>`;
          } else if (item.type === "del") {
            delCount++;
            html += `<div class="diff-line diff-del"><span class="diff-num">-</span>${escapeHtml(item.text)}</div>`;
          } else {
            eqCount++;
            html += `<div class="diff-line diff-eq"><span class="diff-num"> </span>${escapeHtml(item.text)}</div>`;
          }
        });
        html += "</div>";
        resBox.innerHTML = html;

        if (diffSummary) {
          diffSummary.innerHTML = `
            <span class="diff-stat-add">+${addCount} 行新增</span>
            <span class="diff-stat-del">-${delCount} 行删除</span>
            <span class="diff-stat-eq">${eqCount} 行未变</span>
          `;
        }
      }

      document.getElementById("btn-run-diff")?.addEventListener("click", runDiff);

      document.getElementById("btn-diff-sample")?.addEventListener("click", () => {
        if (!diffOrig || !diffMod) return;
        diffOrig.value = `// 版本 1.0\nconst user = {\n  name: "Ze'Yan",\n  role: "guest",\n  theme: "light"\n};`;
        diffMod.value = `// 版本 2.0\nconst user = {\n  name: "Ze'Yan",\n  role: "admin",\n  theme: "dark",\n  verified: true\n};`;
        diffOrig.dispatchEvent(new Event("input"));
        diffMod.dispatchEvent(new Event("input"));
        runDiff();
      });

      document.getElementById("btn-diff-clear")?.addEventListener("click", () => {
        if (diffOrig) { diffOrig.value = ""; diffOrig.dispatchEvent(new Event("input")); }
        if (diffMod) { diffMod.value = ""; diffMod.dispatchEvent(new Event("input")); }
        if (resBox) resBox.innerHTML = '<p class="diff-placeholder">点击「比较差异」开始对比左右两段文本。</p>';
        if (diffSummary) diffSummary.innerHTML = "";
      });

      // ==========================================
      // 11. 正则表达式测试与替换
      // ==========================================
      const regPattern = document.getElementById("regex-pattern") as HTMLInputElement | null;
      const regFlags = document.getElementById("regex-flags") as HTMLInputElement | null;
      const regReplaceIn = document.getElementById("regex-replace-input") as HTMLInputElement | null;
      const regText = document.getElementById("regex-text") as HTMLTextAreaElement | null;
      const regBox = document.getElementById("regex-matches-box");

      attachStats(regText, "regex-text-stats");

      function runRegex() {
        if (!regPattern || !regFlags || !regText || !regBox) return;
        const pattern = regPattern.value;
        const flags = regFlags.value;
        const text = regText.value;

        if (!pattern || !text) {
          regBox.innerHTML = '<p class="text-muted">请输入正则表达式和测试文本...</p>';
          return;
        }

        try {
          const reg = new RegExp(pattern, flags);
          const matches: Array<{ match: string; index: number; groups: string[] }> = [];
          if (flags.includes("g")) {
            let m: RegExpExecArray | null;
            let guard = 0;
            while ((m = reg.exec(text)) !== null && guard < 1000) {
              matches.push({ match: m[0], index: m.index, groups: m.slice(1) });
              if (reg.lastIndex === m.index) reg.lastIndex++;
              guard++;
            }
          } else {
            const m = reg.exec(text);
            if (m) matches.push({ match: m[0], index: m.index, groups: m.slice(1) });
          }

          if (matches.length === 0) {
            regBox.innerHTML = '<p class="status-msg status-err">未匹配到任何结果。</p>';
            return;
          }

          let outHtml = `<div class="match-summary">匹配到 <strong>${matches.length}</strong> 处结果:</div>`;
          matches.forEach((item, idx) => {
            outHtml += `
              <div class="match-card">
                <span class="match-idx">#${idx + 1}</span>
                <span class="match-str">${escapeHtml(item.match)}</span>
                ${item.groups.length ? `<span class="match-groups">捕获组: [${item.groups.map((g) => `"${escapeHtml(g)}"`).join(", ")}]</span>` : ""}
              </div>
            `;
          });
          regBox.innerHTML = outHtml;
        } catch (e: any) {
          regBox.innerHTML = `<p class="status-msg status-err">正则表达式语法错误: ${escapeHtml(e.message)}</p>`;
        }
      }

      regPattern?.addEventListener("input", runRegex);
      regFlags?.addEventListener("input", runRegex);
      regText?.addEventListener("input", runRegex);

      document.getElementById("btn-regex-replace")?.addEventListener("click", () => {
        if (!regPattern || !regFlags || !regText || !regBox) return;
        const pattern = regPattern.value;
        const flags = regFlags.value;
        const text = regText.value;
        const repVal = regReplaceIn?.value ?? "";

        try {
          const reg = new RegExp(pattern, flags);
          const replaced = text.replace(reg, repVal);
          regBox.innerHTML = `
            <div class="match-summary">替换执行结果:</div>
            <pre class="match-replaced-box">${escapeHtml(replaced)}</pre>
          `;
        } catch (e: any) {
          regBox.innerHTML = `<p class="status-msg status-err">正则替换错误: ${escapeHtml(e.message)}</p>`;
        }
      });

      document.querySelectorAll(".preset-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (!regPattern || !regFlags || !regText) return;
          regPattern.value = btn.getAttribute("data-reg") || "";
          regFlags.value = btn.getAttribute("data-flags") || "g";
          const sample = btn.getAttribute("data-sample");
          if (sample) regText.value = sample;
          regText.dispatchEvent(new Event("input"));
          runRegex();
        });
      });

      if (regPattern && regPattern.value && regText && regText.value) {
        runRegex();
      }

      // ==========================================
      // 12. 颜色转换、取色器与调色板
      // ==========================================
      const nativePicker = document.getElementById("native-color-picker") as HTMLInputElement | null;
      const colorHex = document.getElementById("color-hex") as HTMLInputElement | null;
      const colorRgb = document.getElementById("color-rgb") as HTMLInputElement | null;
      const colorHsl = document.getElementById("color-hsl") as HTMLInputElement | null;
      const colorSwatch = document.getElementById("color-swatch");
      const paletteContainer = document.getElementById("palette-chips-container");

      // hexToRgb, rgbToHex, rgbToHsl, getLuminance, getContrast 使用 ../utils/tools/color 导入

      function updateColorFromRgb(r: number, g: number, b: number) {
        const hex = rgbToHex(r, g, b);
        const hsl = rgbToHsl(r, g, b);

        if (nativePicker) nativePicker.value = hex;
        if (colorHex) colorHex.value = hex;
        if (colorRgb) colorRgb.value = `rgb(${r}, ${g}, ${b})`;
        if (colorHsl) colorHsl.value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
        if (colorSwatch) colorSwatch.style.backgroundColor = hex;

        // 对比度计算
        const lum = getLuminance(r, g, b);
        const vsWhite = getContrast(lum, 1.0);
        const vsBlack = getContrast(lum, 0.0);

        const wLevel = vsWhite >= 7.0 ? "AAA" : vsWhite >= 4.5 ? "AA" : vsWhite >= 3.0 ? "AA Large" : "Fail";
        const bLevel = vsBlack >= 7.0 ? "AAA" : vsBlack >= 4.5 ? "AA" : vsBlack >= 3.0 ? "AA Large" : "Fail";

        const wEl = document.querySelector(".swatch-contrast-w");
        const bEl = document.querySelector(".swatch-contrast-b");
        if (wEl) wEl.textContent = `白色对比: ${vsWhite.toFixed(2)}:1 (${wLevel})`;
        if (bEl) bEl.textContent = `黑色对比: ${vsBlack.toFixed(2)}:1 (${bLevel})`;
      }

      function updateColorFromHex(hexStr: string) {
        const rgb = hexToRgb(hexStr);
        if (rgb) updateColorFromRgb(rgb.r, rgb.g, rgb.b);
      }

      nativePicker?.addEventListener("input", () => {
        if (nativePicker) updateColorFromHex(nativePicker.value);
      });

      colorHex?.addEventListener("input", () => {
        if (colorHex) updateColorFromHex(colorHex.value);
      });

      colorRgb?.addEventListener("input", () => {
        if (!colorRgb) return;
        const m = colorRgb.value.match(/\d+/g);
        if (m && m.length >= 3) {
          updateColorFromRgb(parseInt(m[0], 10), parseInt(m[1], 10), parseInt(m[2], 10));
        }
      });

      document.querySelectorAll(".btn-copy-color").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const srcId = btn.getAttribute("data-source");
          if (!srcId) return;
          const inputEl = document.getElementById(srcId) as HTMLInputElement | null;
          if (inputEl && inputEl.value) {
            copyWithFeedback(e.currentTarget as HTMLElement, inputEl.value, "color-status", "已复制颜色值！");
          }
        });
      });

      // 预设色板使用 ../utils/tools/color 导入

      if (paletteContainer) {
        paletteContainer.innerHTML = "";
        presetColors.forEach((c) => {
          const chip = document.createElement("button");
          chip.type = "button";
          chip.className = "palette-chip";
          chip.innerHTML = `<span class="palette-chip-dot" style="background-color: ${c.hex};"></span><span>${c.name}</span>`;
          chip.addEventListener("click", () => updateColorFromHex(c.hex));
          paletteContainer.appendChild(chip);
        });
      }

      // ==========================================
      // 13. GitHub 像素头像生成器 (Identicon)
      // ==========================================
      const avInput = document.getElementById("avatar-input") as HTMLInputElement | null;
      const canvas = document.getElementById("avatar-canvas") as HTMLCanvasElement | null;

      function renderAvatar() {
        if (!canvas || !avInput) return;
        renderIdenticonToCanvas(canvas, avInput.value || "guest");
      }

      avInput?.addEventListener("input", renderAvatar);

      document.getElementById("btn-avatar-random")?.addEventListener("click", () => {
        if (!avInput) return;
        avInput.value = "user-" + Math.random().toString(36).substring(2, 8);
        renderAvatar();
      });

      document.getElementById("btn-avatar-download")?.addEventListener("click", () => {
        if (!canvas || !avInput) return;
        const link = document.createElement("a");
        link.download = `avatar-${avInput.value || "identicon"}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      });

      renderAvatar();
    }

    // 绑定 Astro 页面加载与路由切换事件

// 绑定页面首次加载与 Astro View Transitions 切换事件
document.addEventListener("astro:page-load", initToolbox);
