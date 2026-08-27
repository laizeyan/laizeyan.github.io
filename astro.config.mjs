import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
export default defineConfig({
  // GitHub 用户页：base 留空；上线前把 site 改成 https://<你的用户名>.github.io
  base: "",
  site: "https://laizeyan.github.io",
  integrations: [sitemap()],
});
