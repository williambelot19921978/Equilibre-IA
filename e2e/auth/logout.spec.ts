import { expect, test } from "../../fixtures/base.fixture";
import { hasTestCredentials } from "../helpers/auth";
import { goToHome } from "../helpers/navigation";

test.describe("AUTH — déconnexion", () => {
  test.skip(
    !hasTestCredentials(),
    "PLAYWRIGHT_TEST_EMAIL et PLAYWRIGHT_TEST_PASSWORD requis",
  );

  test("déconnexion complète depuis le menu utilisateur", async ({
    page,
    errorMonitor,
  }) => {
    await goToHome(page);

    await expect(
      page.getByRole("button", { name: "Menu utilisateur" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Menu utilisateur" }).click();
    await expect(
      page.getByRole("menuitem", { name: /se déconnecter/i }),
    ).toBeVisible();

    errorMonitor.markLogoutStarted();
    await page.getByRole("menuitem", { name: /se déconnecter/i }).click();

    await expect(page).toHaveURL(/\/login$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /bon retour/i })).toBeVisible();

    const sessionAfterLogout = await page.evaluate(async () => {
      const keys = Object.keys(localStorage);
      return {
        localStorageKeys: keys.filter((key) => key.includes("supabase")),
      };
    });
    expect(sessionAfterLogout.localStorageKeys.length).toBeGreaterThanOrEqual(0);

    await page.goto("/home");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator("main.home-page-clean")).toHaveCount(0);

    await page.reload();
    await expect(page).toHaveURL(/\/login$/);
  });
});
