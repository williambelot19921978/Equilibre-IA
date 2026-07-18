import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { test, expect } from "../../fixtures/base.fixture";
import { hasTestCredentials } from "../helpers/auth";
import { goToHome } from "../helpers/navigation";

const authFile = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../playwright/.auth/user.json",
);

test.describe("HOME — Score Équilibre", () => {
  test.skip(
    !hasTestCredentials(),
    "PLAYWRIGHT_TEST_EMAIL et PLAYWRIGHT_TEST_PASSWORD requis",
  );
  test.skip(!existsSync(authFile), "Fichier playwright/.auth/user.json absent");

  test("carte Score Équilibre ou état neutre visible", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    const criticalResponses: string[] = [];
    page.on("response", (response) => {
      if (response.status() >= 500) {
        criticalResponses.push(`${response.status()} ${response.url()}`);
      }
    });

    await goToHome(page);

    const balanceCard = page.getByTestId("proactive-balance-card");
    await expect(balanceCard).toBeVisible({ timeout: 20_000 });
    await expect(
      balanceCard.getByRole("heading", { name: /score équilibre/i }),
    ).toBeVisible();

    const hasScore = await balanceCard.locator(".balance-score-badge").isVisible();
    const hasNeutral = await balanceCard.locator(".balance-card-neutral").isVisible();
    const hasLevel = await balanceCard.locator(".balance-level-label").isVisible();

    expect(hasScore || hasNeutral).toBe(true);
    if (hasScore) {
      await expect(balanceCard.locator(".balance-score-value")).toHaveText(/^\d+$/);
      expect(hasLevel).toBe(true);
    }

    await expect(balanceCard).toBeVisible();
    const box = await balanceCard.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(200);

    expect(criticalResponses).toEqual([]);
    expect(
      consoleErrors.filter(
        (error) =>
          !error.includes("favicon") &&
          !error.includes("404") &&
          !error.includes("Failed to load resource"),
      ),
    ).toEqual([]);
  });
});
