import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./vitest.setup.ts"],
    environment: "node",
    include: ["src/**/*.test.ts"],
    environmentMatchGlobs: [
      ["src/contexts/WorkoutPlayerContext.test.ts", "happy-dom"],
    ],
  },
});
