import { test, expect } from "../fixtures/authenticated.fixture";
import { goToGoals } from "../helpers/navigation.helper";
import { assertVisualRegression } from "../helpers/visual.helper";
import { guardianGoalName } from "../helpers/seed-data.helper";

const GOAL_NAME = guardianGoalName();
const STEP_TITLE = "Étape Guardian QA";

test.describe("GOALS — cycle de vie objectif", () => {
  test("créer objectif, ajouter étape, vérifier progression", async ({ page, networkGuardian }) => {
    networkGuardian.setStep("goals-page");
    await goToGoals(page);
    await assertVisualRegression(page, "goals", { scope: ".dashboard-header" });

    await page.getByRole("button", { name: /créer un objectif/i }).first().click();
    await page
      .locator(".goal-form")
      .locator("label")
      .filter({ hasText: /nom de l'objectif/i })
      .locator("input")
      .fill(GOAL_NAME);
    await page.getByRole("button", { name: /créer l'objectif/i }).click();

    await expect(page.getByText("Objectif créé.")).toBeVisible();
    await expect(page.getByText(GOAL_NAME).first()).toBeVisible();

    await page.locator(".goal-add-step input").fill(STEP_TITLE);
    await page.getByRole("button", { name: /ajouter une étape/i }).click();

    await expect(page.getByText(STEP_TITLE).first()).toBeVisible();
    await expect(page.locator(".goal-progress").first()).toBeVisible();

    const nextAction = page.locator(".goal-next-action-card, .goal-progress-assistant");
    if (await nextAction.isVisible().catch(() => false)) {
      await expect(nextAction.first()).toBeVisible();
    }
  });
});
