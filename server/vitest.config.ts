import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@dealdesk/shared": new URL("../shared/src/index.ts", import.meta.url).pathname
    }
  },
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["src/tests/setup.ts"],
    testTimeout: 30000
  }
});
