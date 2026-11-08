import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify("test"),
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    globals: true,
  },
});
//
