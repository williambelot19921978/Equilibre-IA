import { expect, type Locator, type Page } from "@playwright/test";

export async function goToHome(page: Page): Promise<void> {
  await page.goto("/home");
  await expect(page.locator("main.home-page-clean")).toBeVisible();
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
