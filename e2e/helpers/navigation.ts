import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Atteint l'accueil même si Daily State Engine redirige vers le check-in
 * (préférence activée par défaut tant qu'aucun skip / check-in du jour).
 */
export async function dismissDailyCheckinIfPresent(page: Page): Promise<void> {
  const checkinPage = page.getByTestId("daily-checkin-page");
  const skip = page.getByTestId("daily-checkin-skip");

  const onCheckin =
    /\/daily-check-in/.test(page.url()) ||
    (await checkinPage.isVisible().catch(() => false));

  if (!onCheckin) return;

  await expect(skip).toBeVisible({ timeout: 10_000 });
  await skip.click();
  await expect(page).toHaveURL(/\/home(?:\?|$)/, { timeout: 15_000 });
}

export async function goToHome(page: Page): Promise<void> {
  await page.goto("/home");

  const home = page.locator("main.home-page-clean");
  const checkin = page.getByTestId("daily-checkin-page");

  await Promise.race([
    home.waitFor({ state: "visible", timeout: 30_000 }),
    checkin.waitFor({ state: "visible", timeout: 30_000 }),
  ]);

  await dismissDailyCheckinIfPresent(page);
  await expect(home).toBeVisible({ timeout: 30_000 });
}

export async function goToPlanning(page: Page): Promise<void> {
  await page.goto("/planning");
  await expect(page.locator("main.planning-page")).toBeVisible();
}

export async function getPlanningDateLabel(page: Page): Promise<string> {
  return page.locator(".planning-header-main h1").innerText();
}

export function getSidebar(page: Page): Locator {
  return page.getByRole("complementary", { name: "Navigation principale" });
}
