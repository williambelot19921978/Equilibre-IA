import { expect, type Page } from "@playwright/test";

import { finalizeGuardianOnboardingForUser } from "./supabase.helper";

export type OnboardingOptions = {
  householdName?: string;
  displayName?: string;
  profileMode?: "solo" | "family";
  partnerName?: string;
  credentials?: { email: string; password: string };
};

function onboardingPathname(page: Page): string {
  try {
    return new URL(page.url()).pathname;
  } catch {
    return page.url();
  }
}

export async function completeMinimalOnboarding(
  page: Page,
  options: OnboardingOptions = {},
): Promise<void> {
  const householdName = options.householdName ?? `Guardian Foyer ${Date.now()}`;
  const displayName = options.displayName ?? "Guardian";
  const deadline = Date.now() + 200_000;
  let lastStepKey = "";
  let repeatedSteps = 0;

  while (Date.now() < deadline) {
    const url = page.url();
    if (/\/home(?:\?|#|$)/.test(url)) return;

    const finishChildrenButton = page.getByRole("button", {
      name: /continuer|je n'ai pas d'enfant/i,
    });
    const createHouseholdButton = page.getByRole("button", {
      name: /créer le foyer/i,
    });
    const saveProfileButton = page.getByRole("button", {
      name: /enregistrer mon profil/i,
    });
    const welcomeContinue = page.getByTestId("onboarding-welcome-continue");
    const introContinue = page.getByTestId("onboarding-intro-continue");
    const checkinLater = page.getByTestId("onboarding-checkin-later");
    const priorityContinue = page.getByRole("button", { name: /^continuer$/i });

    const stepKey = [
      onboardingPathname(page),
      await welcomeContinue.isVisible().catch(() => false),
      await introContinue.isVisible().catch(() => false),
      await finishChildrenButton.isVisible().catch(() => false),
      await createHouseholdButton.isVisible().catch(() => false),
      await saveProfileButton.isVisible().catch(() => false),
      await checkinLater.isVisible().catch(() => false),
      await priorityContinue.isVisible().catch(() => false),
    ].join("|");

    if (stepKey === lastStepKey) {
      repeatedSteps += 1;
      if (repeatedSteps >= 4) {
        throw new Error(
          `Onboarding bloqué sans progression sur ${page.url()} — vérifier l'état Supabase ou les prérequis de l'étape.`,
        );
      }
      await page.waitForTimeout(2_000);
    } else {
      lastStepKey = stepKey;
      repeatedSteps = 0;
    }

    if (await welcomeContinue.isVisible().catch(() => false)) {
      await welcomeContinue.click();
      await page.waitForURL(/\/onboarding\/(intro|household)/, { timeout: 30_000 });
      continue;
    }

    if (await introContinue.isVisible().catch(() => false)) {
      await introContinue.click();
      await page.waitForURL(/\/onboarding\/household/, { timeout: 30_000 });
      continue;
    }

    if (
      onboardingPathname(page) === "/onboarding/children" &&
      (await finishChildrenButton.isVisible().catch(() => false))
    ) {
      const childNameInput = page
        .locator("label")
        .filter({ hasText: /prénom de l.enfant/i })
        .locator("input");
      const addChildButton = page.getByRole("button", { name: /ajouter l.enfant/i });

      if (
        (await childNameInput.isVisible().catch(() => false)) &&
        (await page.locator("ul li").count()) === 0
      ) {
        await childNameInput.fill("Guardian Enfant");
        await addChildButton.click();
        await page
          .getByText(/enfant ajouté/i)
          .waitFor({ timeout: 15_000 })
          .catch(() => undefined);
      }

      await finishChildrenButton.click();
      await page.waitForURL(/\/onboarding\/(profile|check-in|priority|goals|discovery)|\/home/, {
        timeout: 30_000,
      });
      continue;
    }

    if (await createHouseholdButton.isVisible().catch(() => false)) {
      await page
        .locator("label")
        .filter({ hasText: /nom du foyer/i })
        .locator("input")
        .fill(householdName);
      await page
        .locator("label")
        .filter({ hasText: /prénom dans le foyer/i })
        .locator("input")
        .fill(displayName);
      await createHouseholdButton.click();
      await page.waitForURL(/\/(onboarding|discovery|home)/, { timeout: 30_000 });
      continue;
    }

    if (await saveProfileButton.isVisible().catch(() => false)) {
      if (options.profileMode === "family") {
        const partner = options.partnerName ?? "Partenaire Test";
        await page
          .locator("label")
          .filter({ hasText: /conjoint/i })
          .locator("input")
          .fill(partner);
      }

      await saveProfileButton.click();
      await page.waitForURL(/\/onboarding\/(check-in|priority|goals|discovery)|\/home/, {
        timeout: 30_000,
      });
      continue;
    }

    if (await checkinLater.isVisible().catch(() => false)) {
      await checkinLater.click();
      await page.waitForURL(/\/onboarding\/(priority|goals|discovery)|\/home/, {
        timeout: 30_000,
      });
      continue;
    }

    if (onboardingPathname(page) === "/onboarding/priority") {
      const prioritySelect = page.locator("#main-priority");
      if (await prioritySelect.isVisible().catch(() => false)) {
        await prioritySelect.selectOption(options.profileMode === "family" ? "family" : "work");
        await page.getByRole("button", { name: /^continuer$/i }).click();
        await page.waitForURL(/\/onboarding\/(goals|discovery)|\/home/, { timeout: 30_000 });
        continue;
      }
    }

    if (onboardingPathname(page) === "/onboarding/goals") {
      const skipGoals = page.getByRole("button", { name: /passer cette étape|continuer/i });
      if (await skipGoals.isVisible().catch(() => false)) {
        await skipGoals.first().click();
        await page.waitForURL(/\/discovery|\/home/, { timeout: 30_000 });
        continue;
      }
    }

    if (onboardingPathname(page) === "/discovery" || page.url().includes("/discovery")) {
      if (options.credentials) {
        await finalizeGuardianOnboardingForUser(
          options.credentials.email,
          options.credentials.password,
        );
        await page.goto("/home");
        await page.waitForLoadState("networkidle");
        continue;
      }

      const discoveryDeadline = Date.now() + 90_000;

      while (page.url().includes("/discovery") && Date.now() < discoveryDeadline) {
        const homeButton = page.getByRole("button", { name: /revenir à l'accueil/i });
        if (await homeButton.isVisible().catch(() => false)) {
          await homeButton.click();
          await page.waitForURL(/\/home/, { timeout: 20_000 });
          break;
        }

        const continueButton = page.getByRole("button", { name: /^Continuer$/i });
        const skipButton = page.getByRole("button", { name: /continuer un autre jour/i });
        const choices = page.locator(".choice-button");

        if ((await choices.count()) > 0) {
          await choices.first().click();
          if (await continueButton.isVisible().catch(() => false)) {
            await continueButton.click();
            await page.waitForLoadState("networkidle").catch(() => undefined);
            continue;
          }
        }

        const textInput = page
          .locator(".auth-form input[type='text'], .auth-form input[type='number'], .auth-form textarea")
          .first();
        if (await textInput.isVisible().catch(() => false)) {
          await textInput.fill("Guardian");
          if (await continueButton.isVisible().catch(() => false)) {
            await continueButton.click();
            await page.waitForLoadState("networkidle").catch(() => undefined);
            continue;
          }
        }

        if (await skipButton.isVisible().catch(() => false)) {
          await skipButton.click();
          await page.waitForURL(/\/home/, { timeout: 20_000 }).catch(() => undefined);
        }

        if (page.url().includes("/home")) break;
        await page.waitForTimeout(700);
      }

      continue;
    }

    await page.waitForTimeout(400);
  }

  if (!page.url().includes("/home")) {
    if (
      options.credentials &&
      (page.url().includes("/discovery") || page.url().includes("/onboarding"))
    ) {
      await finalizeGuardianOnboardingForUser(
        options.credentials.email,
        options.credentials.password,
      );
      await page.goto("/home");
      await page.waitForLoadState("networkidle");
    }
  }

  if (!page.url().includes("/home")) {
    throw new Error(`Onboarding incomplet — URL finale : ${page.url()}`);
  }
}

export async function dismissDailyCheckinIfPresent(page: Page): Promise<void> {
  const checkinPage = page.getByTestId("daily-checkin-page");
  const skip = page.getByTestId("daily-checkin-skip");

  const onCheckin =
    /\/daily-check-in/.test(page.url()) ||
    (await checkinPage.isVisible().catch(() => false));

  if (!onCheckin) return;

  await expect(skip).toBeVisible({ timeout: 10_000 });
  await skip.click();
  await expect(page).toHaveURL(/\/home(?:\?|$)/, { timeout: 15_000 });
}

export async function goToHome(page: Page): Promise<void> {
  await page.goto("/home");

  const home = page.locator("main.home-page-clean, main.dashboard-page");
  const checkin = page.getByTestId("daily-checkin-page");

  await Promise.race([
    home.waitFor({ state: "visible", timeout: 30_000 }),
    checkin.waitFor({ state: "visible", timeout: 30_000 }),
  ]);

  await dismissDailyCheckinIfPresent(page);
  await expect(home).toBeVisible({ timeout: 30_000 });
}

export async function goToTasks(page: Page): Promise<void> {
  await page.goto("/tasks");
  await expect(page.getByRole("heading", { name: /mes tâches/i })).toBeVisible({
    timeout: 30_000,
  });
}

export async function goToPlanning(page: Page): Promise<void> {
  await page.goto("/planning");
  await expect(page.locator("main.planning-page")).toBeVisible();
}

export async function goToGoals(page: Page): Promise<void> {
  await page.goto("/goals");
  await page.waitForLoadState("networkidle");

  if (await page.getByRole("heading", { name: /page introuvable/i }).isVisible().catch(() => false)) {
    throw new Error("ROUTE_NOT_FOUND:/goals");
  }

  if (page.url().includes("/home")) {
    throw new Error("GOALS_FEATURE_DISABLED: redirection vers l'accueil");
  }

  await expect(page.getByRole("heading", { name: /^Objectifs$/i }).first()).toBeVisible();
}

export async function goToHouseholdOverview(page: Page): Promise<void> {
  await page.goto("/household-overview");
  await page.waitForLoadState("networkidle");

  if (await page.getByRole("heading", { name: /page introuvable/i }).isVisible().catch(() => false)) {
    throw new Error("ROUTE_NOT_FOUND:/household-overview");
  }

  if (page.url().includes("/home")) {
    throw new Error("HOUSEHOLD_FEATURE_DISABLED: redirection vers l'accueil");
  }

  await expect(page.getByTestId("household-page-title")).toBeVisible({
    timeout: 15_000,
  });

  await expect(page.getByText(/construction de la vue foyer/i)).not.toBeVisible({
    timeout: 30_000,
  });
}

export async function openSidebarRoute(
  page: Page,
  label: string | RegExp,
): Promise<void> {
  const sidebar = page.getByRole("complementary", {
    name: "Navigation principale",
  });
  await sidebar.getByRole("link", { name: label }).click();
}
