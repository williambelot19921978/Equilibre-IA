import { test, expect } from "../../fixtures/base.fixture";
import { hasTestCredentials } from "../helpers/auth";
import { getPlanningDateLabel, goToPlanning } from "../helpers/navigation";

test.describe("PLANNING — navigation jour", () => {
  test.skip(
    !hasTestCredentials(),
    "PLAYWRIGHT_TEST_EMAIL et PLAYWRIGHT_TEST_PASSWORD requis",
  );

  test("navigation jour précédent et jour suivant", async ({ page }) => {
    await goToPlanning(page);

    const initialDate = await getPlanningDateLabel(page);

    await page.getByRole("button", { name: /jour suivant/i }).click();
    await expect(page.locator(".planning-header-main h1")).not.toHaveText(
      initialDate,
    );

    const nextDate = await getPlanningDateLabel(page);
    await page.getByRole("button", { name: /jour précédent/i }).click();
    await expect(page.locator(".planning-header-main h1")).toHaveText(
      initialDate,
    );

    await page.getByRole("button", { name: /aujourd/i }).click();
    await expect(page.locator(".planning-header-main h1")).not.toHaveText(
      nextDate,
    );
  });
});
