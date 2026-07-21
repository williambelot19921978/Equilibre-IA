import { test, expect } from "../fixtures/guardian.fixture";
import {
  getStablePrimaryCredentials,
  loginGuardianUser,
  logoutGuardianUser,
} from "../helpers/auth.helper";
import {
  goToTasks,
} from "../helpers/navigation.helper";
import {
  getProvisionedPersona,
  loadGuardianPersonaState,
} from "../helpers/personas.helper";
import {
  guardianTaskTitle,
  guardianTaskTitleHouseholdB,
} from "../helpers/seed-data.helper";
import { GUARDIAN_PERSONAS } from "../fixtures/users";
import { GuardianCriticalSkipError } from "../helpers/skip-policy";

test.describe("RLS — isolation des données", () => {
  test("foyer A ne voit pas les tâches seed du foyer B", async ({
    page,
    consoleGuardian,
    networkGuardian,
  }) => {
    test.setTimeout(240_000);
    const state = loadGuardianPersonaState();
    const householdB = getProvisionedPersona(state, "rlsHouseholdB");

    if (!state?.serviceRoleAvailable || !householdB?.email || householdB.email.startsWith("(")) {
      throw new GuardianCriticalSkipError(
        "GUARDIAN_SUPABASE_SERVICE_ROLE_KEY requis pour provisionner le Foyer B (mode API).",
      );
    }

    const stable = getStablePrimaryCredentials()!;
    const runId = state.runId;
    const williamTask = guardianTaskTitle(runId);
    const householdBTask = guardianTaskTitleHouseholdB(runId);

    networkGuardian.setStep("login-william");
    await loginGuardianUser(page, stable);
    await goToTasks(page);
    await expect(page.getByRole("heading", { name: williamTask }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: householdBTask })).not.toBeVisible();

    networkGuardian.setStep("logout-william");
    await logoutGuardianUser(page, {
      markLogout: () => {
        consoleGuardian.markLogoutStarted();
        networkGuardian.markLogoutStarted();
      },
    });

    networkGuardian.setStep("login-household-b");
    await loginGuardianUser(page, {
      email: householdB.email,
      password: GUARDIAN_PERSONAS.rlsHouseholdB.password,
    });

    networkGuardian.setStep("household-b-tasks");
    await goToTasks(page);
    await expect(page.getByRole("heading", { name: williamTask })).not.toBeVisible();
    await expect(page.getByRole("heading", { name: householdBTask }).first()).toBeVisible();
  });

  test("URL protégée sans session redirige vers connexion", async ({ page, networkGuardian }) => {
    networkGuardian.setStep("clear-session");
    await page.goto("/login");
    await page.context().clearCookies();
    await page.goto("/home");
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });

  test("accès direct /goals sans authentification", async ({ page, networkGuardian }) => {
    networkGuardian.setStep("guest-goals");
    await page.context().clearCookies();
    await page.goto("/goals");
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });
});
