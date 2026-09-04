import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
export default defineConfig({
  // GitHub 用户页：base 留空；上线前把 site 改成 https://<你的用户名>.github.io
  base: "",
  site: "https://laizeyan.github.io",
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      // 代码块随站点主题切换（亮/暗），而非固定 github-dark
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      defaultColor: false,
    },
  },
});
