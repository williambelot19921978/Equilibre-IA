import { test, expect } from "@playwright/test";

test.describe("EPIC 7A — Mode démo", () => {
  test("active et quitte le mode démo depuis les paramètres", async ({ page }) => {
    test.skip(!process.env.GUARDIAN_E2E, "Nécessite session authentifiée");

    await page.goto("/settings");
    await page.getByTestId("settings-demo-enable").click();
    await expect(page.getByTestId("demo-mode-banner")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /quitter la démo/i }).click();
    await expect(page.getByTestId("demo-mode-banner")).not.toBeVisible();
  });
});

test.describe("EPIC 7A — Daily check-in UX", () => {
  test("propose toujours Passer pour aujourd'hui", async ({ page }) => {
    test.skip(!process.env.GUARDIAN_E2E, "Nécessite session authentifiée");

    await page.goto("/daily-check-in");
    await expect(page.getByTestId("daily-checkin-skip")).toContainText(/passer pour aujourd'hui/i);
  });
});
