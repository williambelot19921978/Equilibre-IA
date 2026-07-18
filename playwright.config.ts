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
}

loadEnvLocal();

const authFile = path.join(__dirname, "playwright/.auth/user.json");
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";

const guestTestMatch = [
  "**/auth/login.spec.ts",
  "**/auth/forgot-password.spec.ts",
];

const authenticatedTestMatch = [
  "**/regression/**/*.spec.ts",
  "**/planning/**/*.spec.ts",
  "**/workout/**/*.spec.ts",
];

const authenticatedLogoutMatch = ["**/auth/logout.spec.ts"];

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "reports" }],
    ["json", { outputFile: "reports/results.json" }],
  ],
  outputDir: "test-results",
  use: {
    baseURL,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: "**/auth/auth.setup.ts",
    },
    {
      name: "guest",
      testMatch: guestTestMatch,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "authenticated",
      testMatch: authenticatedTestMatch,
      dependencies: ["setup"],
      fullyParallel: false,
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
    },
    {
      name: "authenticated-logout",
      testMatch: authenticatedLogoutMatch,
      dependencies: ["authenticated"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
