/**
 * EPIC 4B certification — E2E avec VITE_ASSISTANT_IA + VITE_HUMAN_MODEL activés.
 */

import { test, expect } from "../fixtures/authenticated.fixture";
import {
  getStablePrimaryCredentials,
  loginGuardianUser,
  logoutGuardianUser,
  dismissDailyBriefIfVisible,
} from "../helpers/auth.helper";
import { GUARDIAN_PERSONAS } from "../fixtures/users";
import {
  getProvisionedPersona,
  loadGuardianPersonaState,
} from "../helpers/personas.helper";
import { guardianTaskTitle } from "../helpers/seed-data.helper";
import { GuardianCriticalSkipError } from "../helpers/skip-policy";

const MAIN_FIELD_IDS = [
  "currentState",
  "energy",
  "mentalLoad",
  "motivation",
  "availability",
  "dominantGoal",
] as const;

const BROKEN_VALUE_PATTERN = /\bundefined\b|\bNaN\b|\[object Object\]/i;

async function openAiProfile(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/ai-profile");
  await expect(page.getByTestId("ai-profile-page-title")).toBeVisible();
  await page.waitForLoadState("networkidle");
}

async function assertGridHasNoBrokenValues(page: import("@playwright/test").Page): Promise<void> {
  const grid = page.getByTestId("ai-profile-grid");
  await expect(grid).toBeVisible({ timeout: 30_000 });
  const text = await grid.innerText();
  expect(text).not.toMatch(BROKEN_VALUE_PATTERN);
}

async function openFirstWhyModal(page: import("@playwright/test").Page): Promise<void> {
  const whyButton = page
    .locator(".human-model-card")
    .first()
    .getByRole("button", { name: /pourquoi\s*\?/i });
  await expect(whyButton).toBeVisible();
  await whyButton.click();
  await expect(page.locator(".human-model-modal")).toBeVisible();
  await expect(page.locator(".human-model-modal")).toContainText(/confiance/i);
  await page.locator(".human-model-modal").getByRole("button", { name: /fermer/i }).click();
  await expect(page.locator(".human-model-modal")).not.toBeVisible();
}

test.describe("EPIC4B-A — Mon Profil IA", () => {
  test("desktop — cartes, confiance, Pourquoi ?, données manquantes", async ({
    page,
    networkGuardian,
  }) => {
    networkGuardian.setStep("ai-profile-desktop");
    await dismissDailyBriefIfVisible(page);
    await openAiProfile(page);

    for (const fieldId of MAIN_FIELD_IDS) {
      await expect(page.getByTestId(`ai-profile-field-${fieldId}`)).toBeVisible();
    }

    await assertGridHasNoBrokenValues(page);
    await openFirstWhyModal(page);

    const missingSection = page.locator(".ai-profile-missing");
    await expect(missingSection).toBeVisible();
    await expect(missingSection.getByRole("heading", { name: /Ce qui manque/i })).toBeVisible();
  });
});

test.describe("EPIC4B-A mobile — Mon Profil IA", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("viewport mobile — grille stable", async ({ page, networkGuardian }) => {
    networkGuardian.setStep("ai-profile-mobile");
    await dismissDailyBriefIfVisible(page);
    await openAiProfile(page);
    await assertGridHasNoBrokenValues(page);
    await expect(page.getByTestId("ai-profile-page-title")).toBeVisible();
  });
});

test.describe("EPIC4B-B — Assistant + fatigue", () => {
  test("réponse fondée sur HumanModel sans invention", async ({ page, networkGuardian }) => {
    networkGuardian.setStep("assistant-fatigue");
    await dismissDailyBriefIfVisible(page);
    await page.goto("/assistant");
    await expect(page.getByTestId("assistant-page-title")).toBeVisible();

    await page.locator("#assistant-message-input").fill("Je suis fatigué ce soir");
    await page.getByRole("button", { name: /^Envoyer$/i }).click();

    const assistantBubble = page
      .locator(".assistant-message-assistant .assistant-message-content")
      .last();
    await expect(assistantBubble).toBeVisible({ timeout: 30_000 });

    const reply = await assistantBubble.innerText();
    expect(reply).toMatch(/énergie|fatigué|reposé/i);
    expect(reply).not.toMatch(BROKEN_VALUE_PATTERN);
    expect(reply).not.toMatch(/réunion fictive|sommeil de \d+h|tâche « inexistante/i);

    const meta = page.locator(".assistant-response-meta").last();
    await expect(meta).toBeVisible();
    await expect(meta).toContainText(/Intention/i);
  });
});

test.describe("EPIC4B-C — Données insuffisantes", () => {
  test("profil reconnaît les inconnues + assistant ne fabrique pas", async ({
    page,
    consoleGuardian,
    networkGuardian,
  }) => {
    const state = loadGuardianPersonaState();
    const householdB = getProvisionedPersona(state, "rlsHouseholdB");

    if (!state?.serviceRoleAvailable || !householdB?.email || householdB.email.startsWith("(")) {
      throw new GuardianCriticalSkipError(
        "GUARDIAN_SUPABASE_SERVICE_ROLE_KEY requis pour persona Foyer B (données pauvres).",
      );
    }

    networkGuardian.setStep("logout-primary");
    await logoutGuardianUser(page, {
      markLogout: () => {
        consoleGuardian.markLogoutStarted();
        networkGuardian.markLogoutStarted();
      },
    });

    networkGuardian.setStep("login-household-b-sparse");
    await loginGuardianUser(page, {
      email: householdB.email,
      password: GUARDIAN_PERSONAS.rlsHouseholdB.password,
    });

    await dismissDailyBriefIfVisible(page);
    await openAiProfile(page);
    await assertGridHasNoBrokenValues(page);

    const missingSection = page.locator(".ai-profile-missing");
    await expect(missingSection).toBeVisible();

    networkGuardian.setStep("assistant-impossible-estimation");
    await page.goto("/assistant");
    await page.locator("#assistant-message-input").fill(
      "Estime précisément mon sommeil et ma fatigue sans check-in",
    );
    await page.getByRole("button", { name: /^Envoyer$/i }).click();

    const assistantBubble = page
      .locator(".assistant-message-assistant .assistant-message-content")
      .last();
    await expect(assistantBubble).toBeVisible({ timeout: 30_000 });
    const reply = await assistantBubble.innerText();
    expect(reply).toMatch(/données|check-in|pas encore|indisponible|confiance/i);
    expect(reply).not.toMatch(/7 heures de sommeil|vous avez dormi/i);
  });
});

test.describe("EPIC4B-D — Identités distinctes", () => {
  test("isolation William vs Foyer B sur profil IA", async ({
    page,
    consoleGuardian,
    networkGuardian,
  }) => {
    test.setTimeout(240_000);

    const state = loadGuardianPersonaState();
    const householdB = getProvisionedPersona(state, "rlsHouseholdB");

    if (!state?.serviceRoleAvailable || !householdB?.email || householdB.email.startsWith("(")) {
      throw new GuardianCriticalSkipError(
        "GUARDIAN_SUPABASE_SERVICE_ROLE_KEY requis pour isolation EPIC4B-D.",
      );
    }

    const stable = getStablePrimaryCredentials()!;
    const williamSeedTask = guardianTaskTitle(state.runId);

    networkGuardian.setStep("william-ai-profile");
    await dismissDailyBriefIfVisible(page);
    await openAiProfile(page);
    const williamGrid = await page.getByTestId("ai-profile-grid").innerText();
    expect(williamGrid).not.toContain(williamSeedTask);

    networkGuardian.setStep("logout-william");
    await logoutGuardianUser(page, {
      markLogout: () => {
        consoleGuardian.markLogoutStarted();
        networkGuardian.markLogoutStarted();
      },
    });

    networkGuardian.setStep("household-b-ai-profile");
    await loginGuardianUser(page, {
      email: householdB.email,
      password: GUARDIAN_PERSONAS.rlsHouseholdB.password,
    });
    await dismissDailyBriefIfVisible(page);
    await openAiProfile(page);
    const householdBGrid = await page.getByTestId("ai-profile-grid").innerText();

    expect(householdBGrid).not.toContain(williamSeedTask);
    expect(householdBGrid).not.toMatch(BROKEN_VALUE_PATTERN);
    expect(williamGrid).not.toEqual(householdBGrid);
  });
});
