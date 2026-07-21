import { test, expect } from "../fixtures/authenticated.fixture";
import { goToHome } from "../helpers/navigation.helper";
import { assertVisualRegression } from "../helpers/visual.helper";
import { dismissDailyBriefIfVisible } from "../helpers/auth.helper";

test.describe("ONBOARDING — création profil", () => {
  test("accès au profil utilisateur depuis l'application", async ({ page, networkGuardian }) => {
    networkGuardian.setStep("home");
    await goToHome(page);
    await assertVisualRegression(page, "home", {
      dismissDailyBrief: true,
      scope: ".home-compact-header",
    });
    await dismissDailyBriefIfVisible(page);

    await page.getByRole("button", { name: "Menu utilisateur" }).click();
    await page.getByRole("menuitem", { name: /mon profil/i }).click();

    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByText("Mon profil").first()).toBeVisible();
  });
});
