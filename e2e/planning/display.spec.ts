import { test, expect } from "../../fixtures/base.fixture";
import { hasTestCredentials } from "../helpers/auth";
import { goToPlanning } from "../helpers/navigation";

test.describe("PLANNING — affichage", () => {
  test.skip(
    !hasTestCredentials(),
    "PLAYWRIGHT_TEST_EMAIL et PLAYWRIGHT_TEST_PASSWORD requis",
  );

  test("page planning chargée avec navigation journalière", async ({ page }) => {
    await goToPlanning(page);

    await expect(page).toHaveURL(/\/planning$/);
    await expect(page.getByText("Planning vivant")).toBeVisible();
    await expect(page.locator(".planning-header-main h1")).toBeVisible();
    await expect(page.locator(".day-navigation-bar")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Timeline du jour" }),
    ).toBeVisible();
  });
});
