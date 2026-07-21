import { test, expect } from "../fixtures/authenticated.fixture";
import { goToHouseholdOverview } from "../helpers/navigation.helper";
import { assertVisualRegression } from "../helpers/visual.helper";
import { loadGuardianPersonaState } from "../helpers/personas.helper";

test.describe("HOUSEHOLD — vue Foyer", () => {
  test("ouvrir Foyer, membres, charge et opportunités", async ({ page, networkGuardian }) => {
    const state = loadGuardianPersonaState();

    await page.setViewportSize({ width: 1280, height: 900 });

    networkGuardian.setStep("household-overview");
    await goToHouseholdOverview(page);

    await expect(
      page.locator(".household-workload-list, .household-overview-card h2").first(),
    ).toBeVisible({
      timeout: 30_000,
    });

    await expect(page.getByText(/construction de la vue foyer/i)).not.toBeVisible({
      timeout: 15_000,
    });

    await assertVisualRegression(page, "household-overview", {
      viewport: { width: 1280, height: 900 },
    });

    await expect(page.getByTestId("household-page-title")).toBeVisible();
    await expect(
      page.locator(".household-overview-layout, .household-overview-card").first(),
    ).toBeVisible();

    await expect(
      page.getByText(/vue consolidée|disponibilités, charge et objectifs|membre actif/i).first(),
    ).toBeVisible();

    const workload = page.locator(".household-overview-card", {
      hasText: /charge estimée/i,
    });
    await expect(workload.first()).toBeVisible();

    if (state?.serviceRoleAvailable) {
      await expect(page.getByText(/William|Madeline/i).first()).toBeVisible();
    } else {
      test.info().annotations.push({
        type: "optional",
        description: "Service role absent — un seul membre visible.",
      });
    }
  });
});
