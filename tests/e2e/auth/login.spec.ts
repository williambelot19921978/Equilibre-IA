import { test, expect } from "../fixtures/guardian.fixture";
import {
  getStablePrimaryCredentials,
  hasStablePrimaryCredentials,
  loginGuardianUser,
} from "../helpers/auth.helper";
import { assertCriticalPrecondition } from "../helpers/skip-policy";
import { assertVisualRegression } from "../helpers/visual.helper";

test.describe("AUTH — connexion", () => {
  test("connexion avec identifiants valides", async ({ page, networkGuardian }) => {
    assertCriticalPrecondition(
      hasStablePrimaryCredentials(),
      "PLAYWRIGHT_TEST_EMAIL et PLAYWRIGHT_TEST_PASSWORD requis.",
    );

    const credentials = getStablePrimaryCredentials()!;

    await page.goto("/login");
    networkGuardian.setStep("login-page");
    await assertVisualRegression(page, "login");
    await expect(
      page.getByRole("heading", { name: /bon retour/i }),
    ).toBeVisible();

    await loginGuardianUser(page, credentials);
    await expect(page).not.toHaveURL(/\/login$/);
  });
});
