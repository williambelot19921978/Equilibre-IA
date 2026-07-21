import { test, expect } from "../fixtures/authenticated.fixture";
import { clearDailyBriefPresentation } from "../helpers/auth.helper";
import { goToHome, goToPlanning } from "../helpers/navigation.helper";
import { assertVisualRegression } from "../helpers/visual.helper";
import { GuardianCriticalSkipError } from "../helpers/skip-policy";

test.describe("DAILY BRIEF — affichage et lecture", () => {
  test("affichage, recommandation et fermeture", async ({ page, networkGuardian }) => {
    networkGuardian.setStep("planning-bootstrap");
    await goToPlanning(page);
    await page.waitForLoadState("networkidle");

    networkGuardian.setStep("seeded-home");
    await goToHome(page);

    await clearDailyBriefPresentation(page);
    await page.reload();
    await page.waitForLoadState("networkidle");

    const modal = page.locator(".daily-brief-modal");
    const section = page.locator(".daily-brief-section");

    const modalVisible = await modal.isVisible().catch(() => false);
    const sectionVisible = await section.isVisible().catch(() => false);

    if (!modalVisible && !sectionVisible) {
      throw new GuardianCriticalSkipError(
        "Daily Brief non affiché malgré données seed — vérifier VITE_DAILY_BRIEF et le planning du jour.",
      );
    }

    const recommendation = page.locator(
      ".daily-brief-card, .daily-brief-recommendation",
    );
    await expect(recommendation.first()).toBeVisible({ timeout: 30_000 });

    if (modalVisible) {
      await assertVisualRegression(page, "daily-brief-modal");

      const whyButton = page.getByRole("button", { name: /pourquoi\s*\?/i });
      if (await whyButton.isVisible().catch(() => false)) {
        await whyButton.first().click();
        await expect(
          page.locator(".explainability-panel, .daily-brief-explanation, .recommendation-why-panel").first(),
        ).toBeVisible();
      }

      await modal.getByRole("button", { name: /^Compris$/i }).click();
      await expect(modal).not.toBeVisible({ timeout: 10_000 });
    }

    if (await section.isVisible().catch(() => false)) {
      await expect(section).toBeVisible();
    }
  });
});
