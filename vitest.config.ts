import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    setupFiles: ["./vitest.setup.ts"],
    environment: "node",
    include: ["src/**/*.test.ts"],
    environmentMatchGlobs: [
      ["src/contexts/WorkoutPlayerContext.test.ts", "happy-dom"],
      ["src/calendarSyncEngine/**/*.test.ts", "happy-dom"],
    ],
  },
});
