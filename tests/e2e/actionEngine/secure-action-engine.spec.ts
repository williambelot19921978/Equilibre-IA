/**
 * EPIC 4C — Secure Action Engine E2E (certification).
 */

import { test, expect } from "../fixtures/authenticated.fixture";
import { dismissDailyBriefIfVisible } from "../helpers/auth.helper";

async function openAssistant(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/assistant");
  await expect(page.getByTestId("assistant-page-title")).toBeVisible();
  await page.waitForLoadState("networkidle");
}

async function sendAssistantMessage(
  page: import("@playwright/test").Page,
  message: string,
): Promise<void> {
  await page.locator("#assistant-message-input").fill(message);
  await page.getByRole("button", { name: /^Envoyer$/i }).click();
  await expect(page.locator(".assistant-loading")).toBeHidden({ timeout: 30_000 });
}

async function readAuditEntries(page: import("@playwright/test").Page): Promise<
  Array<{ status: string; actionId: string; actionType: string }>
> {
  return page.evaluate(() => {
    const prefix = "action-engine-audit:";
    const keys = Object.keys(localStorage).filter((key) => key.startsWith(prefix));
    const entries: Array<{ status: string; actionId: string; actionType: string }> = [];
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as Array<{
        status: string;
        actionId: string;
        actionType: string;
      }>;
      entries.push(...parsed);
    }
    return entries;
  });
}

test.describe("EPIC4C — Secure Action Engine", () => {
  test.beforeEach(async ({ page, networkGuardian }) => {
    networkGuardian.setStep("assistant-action-engine");
    await dismissDailyBriefIfVisible(page);
    await openAssistant(page);
  });

  test("1 — Création d'une tâche proposée avec preview", async ({ page }) => {
    const taskTitle = `EPIC4C propose ${Date.now()}`;
    await sendAssistantMessage(page, `créer une tâche ${taskTitle}`);

    const actionCard = page.locator(".assistant-action-card").first();
    await expect(actionCard).toBeVisible({ timeout: 20_000 });
    await expect(actionCard).toContainText(/Créer|tâche/i);
    await expect(actionCard.locator(".assistant-action-preview")).toBeVisible();
    await expect(actionCard.getByRole("button", { name: /^Confirmer$/i })).toBeVisible();
    await expect(actionCard.getByRole("button", { name: /^Annuler$/i })).toBeVisible();
  });

  test("2 — Confirmation et écriture réelle", async ({ page }) => {
    const taskTitle = `EPIC4C confirm ${Date.now()}`;
    await sendAssistantMessage(page, `créer une tâche ${taskTitle}`);

    const actionCard = page.locator(".assistant-action-card").first();
    await expect(actionCard).toBeVisible({ timeout: 20_000 });
    await actionCard.getByRole("button", { name: /^Confirmer$/i }).click();

    await expect(page.locator(".assistant-message-assistant").last()).toContainText(
      /Action réalisée/i,
      { timeout: 20_000 },
    );

    const audit = await readAuditEntries(page);
    expect(audit.some((entry) => entry.status === "prepared")).toBe(true);
    expect(audit.some((entry) => entry.status === "confirmed")).toBe(true);
    expect(audit.some((entry) => entry.status === "executed")).toBe(true);
  });

  test("3 — Annulation sans écriture", async ({ page }) => {
    await sendAssistantMessage(page, "créer une tâche epic4c cancel e2e");

    const actionCard = page.locator(".assistant-action-card").first();
    await expect(actionCard).toBeVisible({ timeout: 20_000 });
    await actionCard.getByRole("button", { name: /^Annuler$/i }).click();

    await expect(page.locator(".assistant-message-assistant").last()).toContainText(
      /abandonnée/i,
      { timeout: 15_000 },
    );
    await expect(page.getByText(/Action réalisée/i)).toHaveCount(0);

    const audit = await readAuditEntries(page);
    expect(audit.some((entry) => entry.status === "cancelled")).toBe(true);
    expect(audit.filter((entry) => entry.status === "executed").length).toBe(0);
  });

  test("4 — Déplacer une tâche — proposition planning", async ({ page }) => {
    await sendAssistantMessage(page, "déplacer ma tâche non urgente demain");

    const actionCard = page.locator(".assistant-action-card").first();
    await expect(actionCard).toBeVisible({ timeout: 20_000 });
    await expect(actionCard).toContainText(/Déplacer|Reporter/i);
    await expect(actionCard.locator(".assistant-action-scope")).toContainText(/Planning interne/i);
  });

  test("5 — Payload invalide refusé", async ({ page }) => {
    await sendAssistantMessage(page, "replanifier un événement du planning");

    const actionCard = page
      .locator(".assistant-action-card")
      .filter({ hasText: /Reporter un événement|Reporter un bloc/i })
      .first();
    await expect(actionCard).toBeVisible({ timeout: 20_000 });

    const validationError = actionCard.locator(".assistant-action-validation-error");
    const notAvailable = actionCard.locator(".assistant-action-not-available");
    const confirmButton = actionCard.getByRole("button", { name: /^Confirmer$/i });

    const hasValidationError = await validationError.isVisible().catch(() => false);
    const isNotAvailable = await notAvailable.isVisible().catch(() => false);
    const confirmVisible = await confirmButton.isVisible().catch(() => false);

    expect(hasValidationError || isNotAvailable || !confirmVisible).toBe(true);
    await expect(page.getByText(/Action réalisée/i)).toHaveCount(0);
  });

  test("6 — Permission insuffisante refusée", async ({ page }) => {
    await sendAssistantMessage(page, "informer mon foyer de mon retard");

    const actionCard = page.locator(".assistant-action-card").first();
    await expect(actionCard).toBeVisible({ timeout: 20_000 });

    const validationError = actionCard.locator(".assistant-action-validation-error");
    const notAvailable = actionCard.locator(".assistant-action-not-available");

    if (await validationError.isVisible()) {
      await expect(validationError).toContainText(/collaboration|permission|impossible/i);
    } else {
      await expect(notAvailable.or(actionCard.getByRole("button", { name: /^Confirmer$/i }))).toBeVisible();
      await expect(actionCard.getByRole("button", { name: /^Confirmer$/i })).toHaveCount(0);
    }
  });

  test("7 — Anti-double-clic sur Confirmer", async ({ page }) => {
    const taskTitle = `EPIC4C double ${Date.now()}`;
    await sendAssistantMessage(page, `créer une tâche ${taskTitle}`);

    const actionCard = page.locator(".assistant-action-card").first();
    await expect(actionCard).toBeVisible({ timeout: 20_000 });
    const confirmButton = actionCard.getByRole("button", { name: /^Confirmer$/i });
    await expect(confirmButton).toBeEnabled();

    // Deux clics synchrones côté navigateur — simule un double-clic utilisateur réel.
    await confirmButton.evaluate((button) => {
      button.click();
      button.click();
    });

    await expect(page.locator(".assistant-message-assistant").last()).toContainText(
      /Action réalisée|Erreur|déjà en cours|déjà traitée/i,
      { timeout: 20_000 },
    );

    const audit = await readAuditEntries(page);
    const executed = audit.filter((entry) => entry.status === "executed");
    expect(executed.length).toBeLessThanOrEqual(1);
  });
});
