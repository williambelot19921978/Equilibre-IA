import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

import type { Page, TestInfo } from "@playwright/test";

function sanitizeFileName(value: string): string {
  return value.replace(/[^\w.-]+/g, "_").slice(0, 120);
}

export async function saveFailureArtifacts(
  page: Page,
  testInfo: TestInfo,
): Promise<void> {
  if (testInfo.status === testInfo.expectedStatus) {
    return;
  }

  mkdirSync("screenshots", { recursive: true });
  mkdirSync("videos", { recursive: true });

  const baseName = sanitizeFileName(
    `${testInfo.project.name}-${testInfo.title}`,
  );
  const screenshotPath = path.join("screenshots", `${baseName}.png`);

  await page.screenshot({ path: screenshotPath, fullPage: true });
  await testInfo.attach("screenshot", {
    path: screenshotPath,
    contentType: "image/png",
  });

  const videoAttachment = testInfo.attachments.find(
    (attachment) => attachment.name === "video",
  );
  if (videoAttachment?.path && existsSync(videoAttachment.path)) {
    const videoPath = path.join("videos", `${baseName}.webm`);
    copyFileSync(videoAttachment.path, videoPath);
    await testInfo.attach("video-copy", {
      path: videoPath,
      contentType: "video/webm",
    });
  }
}
