import type { Page } from "@playwright/test";

import { logoutGuardianUser } from "./auth.helper";

/**
 * Best-effort UI cleanup — never touches application engines.
 */
export async function cleanupGuardianSession(
  page: Page,
  options?: { markLogout?: () => void },
): Promise<void> {
  try {
    if (page.url().includes("/login")) return;
    await logoutGuardianUser(page, options);
  } catch {
    // Session may already be closed.
  }
}

export async function clearBrowserStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}
