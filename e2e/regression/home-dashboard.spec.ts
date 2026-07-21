import { test, expect } from "../../fixtures/base.fixture";
import { hasTestCredentials } from "../helpers/auth";
import { goToHome } from "../helpers/navigation";

test.describe("HOME — tableau de bord", () => {
  test.skip(
    !hasTestCredentials(),
    "PLAYWRIGHT_TEST_EMAIL et PLAYWRIGHT_TEST_PASSWORD requis",
  );

  test("ouverture du tableau de bord", async ({ page }) => {
    await goToHome(page);
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.locator("main.home-page-clean")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /bonjour/i }).first(),
    ).toBeVisible();
  });

  test("widgets principaux présents", async ({ page }) => {
    await goToHome(page);

    await expect(page.locator(".home-widgets-stack")).toBeVisible();
    await expect(page.locator(".home-widget-checkin")).toBeVisible();
    await expect(page.locator(".home-widget-timeline")).toBeVisible();
    await expect(
      page
        .locator(".home-widget-timeline")
        .getByText("Aujourd'hui", { exact: true }),
    ).toBeVisible();
    await expect(page.locator(".home-widget-next")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /prochaine activité/i }),
    ).toBeVisible();
  });
});
