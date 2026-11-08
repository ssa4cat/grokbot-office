import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(rootDir, "package.json"), "utf-8")) as { version: string };

// Relative base keeps assets working on GitHub Pages project sites
// (for example /grokbot-office/) and when opened from a subfolder.
// Override with VITE_BASE=/grokbot-office/ if you want an absolute base.
const base = process.env.VITE_BASE || "./";

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(rootDir, "./src"),
    },
  },
  server: {
    port: 5180,
    strictPort: true,
  },
  preview: {
    port: 5180,
    strictPort: true,
  },
});
