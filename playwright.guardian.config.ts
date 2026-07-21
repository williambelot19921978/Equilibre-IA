import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvLocal(): void {
  const envPath = path.join(__dirname, ".env.local");
  if (!existsSync(envPath)) return;

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

  if (existsSync(path.join(__dirname, ".env.guardian"))) {
    for (const line of readFileSync(path.join(__dirname, ".env.guardian"), "utf8").split("\n")) {
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

const guardianWebEnv = {
  VITE_GOALS: "true",
  VITE_HOUSEHOLD_OVERVIEW: "true",
  VITE_HOUSEHOLD_OPPORTUNITIES: "true",
  VITE_HOUSEHOLD_COLLABORATION: "true",
  VITE_DAILY_BRIEF: "true",
  VITE_EXPLAINABLE_AI: "true",
  VITE_DYNAMIC_DAILY_BRIEF: "true",
  VITE_GOAL_PROGRESS_ASSISTANT: "true",
  VITE_APP_ORIGIN: "http://localhost:5173",
  PLAYWRIGHT_BASE_URL: "http://localhost:5173",
};

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120_000,
  expect: {
    timeout: 20_000,
    toHaveScreenshot: {
      pathTemplate: "{testDir}/screenshots/baselines/{arg}{ext}",
    },
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "tests/e2e/reports/html" }],
    ["json", { outputFile: "tests/e2e/reports/results.json" }],
    ["./tests/e2e/helpers/guardian-reporter.mjs"],
  ],
  outputDir: "tests/e2e/test-results",
  use: {
    baseURL,
    actionTimeout: 25_000,
    navigationTimeout: 35_000,
    trace: "retain-on-failure",
    screenshot: "off",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "guardian-setup",
      testMatch: "**/auth/guardian.setup.ts",
    },
    {
      name: "guardian-guest",
      testMatch: [
        "**/auth/signup.spec.ts",
        "**/auth/login.spec.ts",
        "**/onboarding/full-flow.spec.ts",
        "**/rls/**/*.spec.ts",
      ],
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "guardian-authenticated",
      testMatch: [
        "**/onboarding/profile.spec.ts",
        "**/planning/**/*.spec.ts",
        "**/dailyBrief/**/*.spec.ts",
        "**/goals/**/*.spec.ts",
        "**/household/**/*.spec.ts",
      ],
      dependencies: ["guardian-setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
    },
    {
      name: "guardian-collaboration",
      testMatch: ["**/collaboration/**/*.spec.ts"],
      dependencies: ["guardian-setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
    },
    {
      name: "guardian-session",
      testMatch: ["**/zz-session/**/*.spec.ts"],
      dependencies: ["guardian-setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: "node scripts/dev-guardian.mjs",
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          ...process.env,
          ...guardianWebEnv,
        },
      },
});
