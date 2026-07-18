import { test, expect } from "../../fixtures/base.fixture";
import { getTestCredentials, hasTestCredentials } from "../helpers/auth";

test.describe("AUTH — connexion", () => {
  test.skip(
    !hasTestCredentials(),
    "PLAYWRIGHT_TEST_EMAIL et PLAYWRIGHT_TEST_PASSWORD requis",
  );

  test("connexion avec identifiants valides", async ({ page }) => {
    const { email, password } = getTestCredentials();

    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: /bon retour/i }),
    ).toBeVisible();

    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: /se connecter/i }).click();

    await page.waitForURL(/\/(home|onboarding|discovery|tasks|planning)/, {
      timeout: 30_000,
    });
    await expect(page).not.toHaveURL(/\/login$/);
  });
});
