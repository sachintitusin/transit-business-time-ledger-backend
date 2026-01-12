import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ["tests/e2e/setup.ts"],
    environment: "node",
    // ✅ Run tests sequentially (no parallelization)
    fileParallelism: false,
    maxConcurrency: 1,
    // ✅ Don't isolate in threads (causes DB connection issues)
    pool: 'forks',
  },
});
