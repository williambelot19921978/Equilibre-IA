import { test, expect } from "../fixtures/guardian.fixture";
import {
  buildGuardianEmail,
  GUARDIAN_PERSONAS,
} from "../fixtures/users";
import { signupGuardianUser } from "../helpers/auth.helper";
import {
  completeMinimalOnboarding,
  goToHome,
} from "../helpers/navigation.helper";
import { assertUiPersonaNotPreProvisioned } from "../helpers/ui-persona.guard";
import { GuardianCriticalSkipError } from "../helpers/skip-policy";

test.describe("ONBOARDING — parcours complet jetable", () => {
  test("inscription → profil → foyer → accueil", async ({ page, networkGuardian }) => {
    test.setTimeout(240_000);
    const runId = process.env.GUARDIAN_RUN_ID ?? `${Date.now()}`;
    const persona = GUARDIAN_PERSONAS.onboardingDisposable;
    const email = buildGuardianEmail(persona, runId);

    await assertUiPersonaNotPreProvisioned(email);

    networkGuardian.setStep("signup");
    const signup = await signupGuardianUser(page, persona, email);

    if (signup.outcome === "rate_limited") {
      throw new GuardianCriticalSkipError(
        "Rate limit Supabase — impossible de tester l'onboarding complet.",
      );
    }

    if (signup.outcome === "email_confirmation") {
      throw new GuardianCriticalSkipError(
        "Confirmation email requise — désactiver la confirmation pour le projet Guardian.",
      );
    }

    networkGuardian.setStep("onboarding");
    await completeMinimalOnboarding(page, {
      profileMode: "family",
      partnerName: persona.partnerName ?? "Partenaire Test",
      householdName: persona.householdName ?? `Famille Test ${runId}`,
      displayName: persona.firstName,
      credentials: { email, password: persona.password },
    });

    networkGuardian.setStep("home");
    await goToHome(page);
    await expect(page.locator("main.home-page-clean, main.dashboard-page")).toBeVisible();
  });
});
