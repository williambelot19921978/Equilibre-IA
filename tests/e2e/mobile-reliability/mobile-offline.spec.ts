import { test, expect } from "@playwright/test";

test.describe("EPIC 7B — Mobile reliability", () => {
  test("manifest PWA accessible", async ({ page }) => {
    const response = await page.goto("/manifest.webmanifest");
    expect(response?.ok()).toBeTruthy();
    const body = await response?.text();
    expect(body).toContain("Aura");
  });

  test("page notifications settings accessible", async ({ page }) => {
    test.skip(!process.env.GUARDIAN_E2E, "Nécessite session authentifiée");

    await page.goto("/settings/notifications");
    await expect(page.getByRole("heading", { name: /vos préférences/i })).toBeVisible();
    await expect(page.getByTestId("notification-level-important")).toBeVisible();
  });

  test("indicateur sync visible quand authentifié", async ({ page }) => {
    test.skip(!process.env.GUARDIAN_E2E, "Nécessite session authentifiée");

    await page.goto("/home");
    await expect(page.getByTestId("sync-status-indicator")).toBeVisible();
  });
});
