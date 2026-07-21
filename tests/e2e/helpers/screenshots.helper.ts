import { mkdirSync } from "node:fs";
import path from "node:path";

import type { Page, TestInfo } from "@playwright/test";

export type ScreenshotPhase = "before" | "after" | "failure";

function sanitize(value: string): string {
  return value.replace(/[^\w.-]+/g, "_").slice(0, 100);
}

function runDirectory(testInfo: TestInfo): string {
  const runId =
    process.env.GUARDIAN_RUN_ID ??
    new Date().toISOString().replace(/[:.]/g, "-");
  const suite = sanitize(testInfo.project.name);
  const scenario = sanitize(testInfo.title);

  return path.join(
    "tests",
    "e2e",
    "screenshots",
    "runs",
    runId,
    suite,
    scenario,
  );
}

export async function captureGuardianScreenshot(
  page: Page,
  testInfo: TestInfo,
  phase: ScreenshotPhase,
): Promise<string> {
  const directory = runDirectory(testInfo);
  mkdirSync(directory, { recursive: true });

  const filePath = path.join(directory, `${phase}.png`);
  await page.screenshot({ path: filePath, fullPage: true });

  if (phase === "failure" || process.env.GUARDIAN_ATTACH_SCREENSHOTS === "1") {
    await testInfo.attach(`guardian-${phase}`, {
      path: filePath,
      contentType: "image/png",
    });
  }

  return filePath;
}

export async function captureFailureScreenshot(
  page: Page,
  testInfo: TestInfo,
): Promise<void> {
  if (testInfo.status === testInfo.expectedStatus) return;
  await captureGuardianScreenshot(page, testInfo, "failure");
}
