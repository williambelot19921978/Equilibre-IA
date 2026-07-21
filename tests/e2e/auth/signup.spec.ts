import { test, expect } from "../fixtures/guardian.fixture";
import { signupGuardianUser } from "../helpers/auth.helper";
import { buildGuardianEmail, GUARDIAN_PERSONAS } from "../fixtures/users";
import { assertUiPersonaNotPreProvisioned } from "../helpers/ui-persona.guard";
import { GuardianCriticalSkipError } from "../helpers/skip-policy";

test.describe("AUTH — création compte", () => {
  test("inscription Utilisateur Solo via l'interface", async ({ page }) => {
    const runId = process.env.GUARDIAN_RUN_ID ?? `${Date.now()}`;
    const persona = GUARDIAN_PERSONAS.soloSignup;
    const email = buildGuardianEmail(persona, runId);

    await assertUiPersonaNotPreProvisioned(email);

    const result = await signupGuardianUser(page, persona, email);

    if (result.outcome === "rate_limited") {
      throw new GuardianCriticalSkipError(
        "Supabase email rate limit — réessayer plus tard ou utiliser un projet de test dédié.",
      );
    }

    expect(result.outcome === "redirect" || result.outcome === "email_confirmation").toBeTruthy();
  });
});
