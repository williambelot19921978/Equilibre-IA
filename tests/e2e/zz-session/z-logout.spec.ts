import { test, expect } from "../fixtures/guardian.fixture";
import {
  getStablePrimaryCredentials,
  hasStablePrimaryCredentials,
  loginGuardianUser,
  logoutGuardianUser,
} from "../helpers/auth.helper";
import { assertCriticalPrecondition } from "../helpers/skip-policy";

test.describe("AUTH — déconnexion", () => {
  test("déconnexion depuis le menu utilisateur", async ({
    page,
    consoleGuardian,
    networkGuardian,
  }) => {
    assertCriticalPrecondition(
      hasStablePrimaryCredentials(),
      "PLAYWRIGHT_TEST_EMAIL et PLAYWRIGHT_TEST_PASSWORD requis",
    );

    await page.goto("/home");
    await page.getByRole("button", { name: "Menu utilisateur" }).click();
    consoleGuardian.markLogoutStarted();
    networkGuardian.markLogoutStarted();
    await page.getByRole("menuitem", { name: /se déconnecter/i }).click();
    await expect(page).toHaveURL(/\/login$/, { timeout: 15_000 });
  });
});

test.describe("AUTH — changement utilisateur", () => {
  test("déconnexion puis reconnexion avec le même compte", async ({
    page,
    consoleGuardian,
    networkGuardian,
  }) => {
    assertCriticalPrecondition(
      hasStablePrimaryCredentials(),
      "PLAYWRIGHT_TEST_EMAIL et PLAYWRIGHT_TEST_PASSWORD requis",
    );

    await page.goto("/home");
    await expect(page.locator("main.home-page-clean, main.dashboard-page")).toBeVisible();

    await logoutGuardianUser(page, {
      markLogout: () => {
        consoleGuardian.markLogoutStarted();
        networkGuardian.markLogoutStarted();
      },
    });

    const credentials = getStablePrimaryCredentials()!;
    await loginGuardianUser(page, credentials);

    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page.locator("main.home-page-clean, main.dashboard-page")).toBeVisible();
  });
});
