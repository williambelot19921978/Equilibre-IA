import { test, expect } from "../../fixtures/base.fixture";
import { getTestCredentials, hasTestCredentials } from "../helpers/auth";

test.describe("AUTH — mot de passe oublié", () => {
  test.skip(
    !hasTestCredentials(),
    "PLAYWRIGHT_TEST_EMAIL et PLAYWRIGHT_TEST_PASSWORD requis",
  );

  test("soumission du formulaire de réinitialisation", async ({ page }) => {
    const { email } = getTestCredentials();

    await page.goto("/forgot-password");
    await expect(
      page.getByRole("heading", { name: /mot de passe oublié/i }),
    ).toBeVisible();

    await page.locator('input[type="email"]').fill(email);
    await page.getByRole("button", { name: /envoyer le lien/i }).click();

    await expect(
      page
        .getByText(/si un compte existe/i)
        .or(page.getByText(/trop de tentatives/i)),
    ).toBeVisible({
      timeout: 15_000,
    });
  });
});
