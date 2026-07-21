import { test, expect } from "../fixtures/authenticated.fixture";
import { goToHouseholdOverview } from "../helpers/navigation.helper";
import { loadGuardianPersonaState } from "../helpers/personas.helper";

import { GuardianCriticalSkipError } from "../helpers/skip-policy";

test.describe("COLLABORATION — proposition opportunité", () => {
  test("Proposer → confirmation → annuler", async ({ page, networkGuardian }) => {
    const state = loadGuardianPersonaState();

    if (!state?.serviceRoleAvailable) {
      throw new GuardianCriticalSkipError(
        "GUARDIAN_SUPABASE_SERVICE_ROLE_KEY requis pour préparer un foyer 2 membres et une opportunité déterministe.",
      );
    }

    networkGuardian.setStep("household-collaboration");
    await goToHouseholdOverview(page);

    const opportunitiesSection = page.getByTestId("household-opportunities-section");
    const proposeButton = opportunitiesSection.getByRole("button", { name: /^Proposer$/i }).first();
    await expect(proposeButton).toBeVisible({ timeout: 20_000 });

    await proposeButton.click();

    const collaborationModal = page.getByTestId("household-collaboration-modal");
    await expect(
      collaborationModal.getByRole("heading", {
        name: /souhaitez-vous préparer cette action/i,
      }),
    ).toBeVisible();

    await collaborationModal.getByRole("button", { name: /^Annuler$/i }).click();

    await expect(collaborationModal).not.toBeVisible();

    await expect(page.getByTestId("household-page-title")).toBeVisible();
  });
});
