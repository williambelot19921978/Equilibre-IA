import { test, expect } from "../fixtures/authenticated.fixture";
import { goToTasks } from "../helpers/navigation.helper";
import { assertVisualRegression } from "../helpers/visual.helper";

const TASK_TITLE = `Guardian QA tâche UI ${Date.now()}`;

test.describe("PLANNING — tâches via interface", () => {
  test("créer, modifier l'état et retirer une tâche", async ({ page, networkGuardian }) => {
    networkGuardian.setStep("tasks-page");
    await goToTasks(page);
    await assertVisualRegression(page, "planning", { scope: ".task-form-card" });

    await page
      .locator("label")
      .filter({ hasText: /^Nom de la tâche$/ })
      .locator("input")
      .fill(TASK_TITLE);
    await page
      .locator("label")
      .filter({ hasText: /^Durée estimée$/ })
      .locator("input")
      .fill("30");
    await page.getByRole("button", { name: /ajouter intelligemment/i }).click();

    await expect(page.getByText("Tâche ajoutée avec succès.")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("heading", { name: TASK_TITLE }).first()).toBeVisible();

    const taskCard = page.locator(".task-card", { hasText: TASK_TITLE });
    await taskCard.getByRole("button", { name: /reporter/i }).click();
    await expect(page.getByText(/tâche reportée/i)).toBeVisible();

    await taskCard.getByRole("button", { name: /terminer/i }).click();
    await expect(taskCard.getByText(/tâche terminée/i).first()).toBeVisible();
  });
});
