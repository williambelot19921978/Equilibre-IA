import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvLocal(): void {
  const envPath = path.join(__dirname, ".env.local");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) continue;
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }

  for (const fileName of [".env.guardian", ".env.guardian.local"]) {
    const guardianPath = path.join(__dirname, fileName);
    if (!existsSync(guardianPath)) continue;

    for (const line of readFileSync(guardianPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) continue;
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";
const authFile = path.join(__dirname, "tests/e2e/.auth/william-admin.json");

const epic4cWebEnv = {
  VITE_GOALS: "true",
  VITE_HOUSEHOLD_OVERVIEW: "true",
  VITE_HOUSEHOLD_OPPORTUNITIES: "true",
  VITE_HOUSEHOLD_COLLABORATION: "false",
  VITE_DAILY_BRIEF: "true",
  VITE_EXPLAINABLE_AI: "true",
  VITE_DYNAMIC_DAILY_BRIEF: "true",
  VITE_GOAL_PROGRESS_ASSISTANT: "true",
  VITE_ASSISTANT_IA: "true",
  VITE_HUMAN_MODEL: "true",
  VITE_SECURE_ACTION_ENGINE: "true",
  VITE_APP_ORIGIN: "http://localhost:5173",
  PLAYWRIGHT_BASE_URL: "http://localhost:5173",
};

export default defineConfig({
  testDir: "./tests/e2e/actionEngine",
  timeout: 120_000,
  expect: {
    timeout: 25_000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ["list"],
    ["json", { outputFile: "tests/e2e/reports/epic4c-results.json" }],
  ],
  outputDir: "tests/e2e/test-results/epic4c",
  use: {
    baseURL,
    actionTimeout: 25_000,
    navigationTimeout: 35_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "epic4c-setup",
      testMatch: "**/auth/guardian.setup.ts",
      testDir: "./tests/e2e",
    },
    {
      name: "epic4c-desktop",
      testMatch: "**/actionEngine/secure-action-engine.spec.ts",
      dependencies: ["epic4c-setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: "node scripts/dev-epic4c.mjs",
        url: baseURL,
        reuseExistingServer: false,
        timeout: 180_000,
        env: {
          ...process.env,
          ...epic4cWebEnv,
        },
      },
});
