import { test, expect } from "../../fixtures/base.fixture";
import { hasTestCredentials } from "../helpers/auth";
import { getPlanningDateLabel, goToPlanning } from "../helpers/navigation";

test.describe("PLANNING — navigation semaine", () => {
  test.skip(
    !hasTestCredentials(),
    "PLAYWRIGHT_TEST_EMAIL et PLAYWRIGHT_TEST_PASSWORD requis",
  );

  test("parcours de 7 jours via la barre de navigation", async ({ page }) => {
    await goToPlanning(page);

    const startDate = await getPlanningDateLabel(page);
    const visitedDates = new Set([startDate]);

    for (let day = 0; day < 7; day += 1) {
      await page.getByRole("button", { name: /jour suivant/i }).click();
      const currentDate = await getPlanningDateLabel(page);
      visitedDates.add(currentDate);
    }

    expect(visitedDates.size).toBeGreaterThanOrEqual(2);

    for (let day = 0; day < 7; day += 1) {
      await page.getByRole("button", { name: /jour précédent/i }).click();
    }

    await expect(page.locator(".planning-header-main h1")).toHaveText(
      startDate,
    );
  });
});
