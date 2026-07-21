import { expect, test, type Page } from "../../fixtures/base.fixture";
import { hasTestCredentials } from "../helpers/auth";
import { goToPlanning } from "../helpers/navigation";
import {
  cleanupE2eSportSessions,
  createE2eSportSession,
  fetchE2eSportSession,
  type E2eSportSession,
} from "../helpers/sportSession";

async function openWorkoutPlayer(page: Page, sessionTitle: string) {
  await goToPlanning(page);

  const showPastButton = page.getByRole("button", {
    name: "Afficher les moments passés",
  });
  if (await showPastButton.isVisible()) {
    await showPastButton.click();
  }

  const sessionHeading = page.getByRole("heading", { name: sessionTitle });
  await expect(sessionHeading).toBeVisible({ timeout: 20_000 });

  const startButton = page
    .getByRole("button", { name: /faire (cette )?la séance/i })
    .first();
  await expect(startButton).toBeVisible({ timeout: 20_000 });
  await startButton.click();

  const player = page.getByRole("dialog", { name: "Séance en cours" });
  await expect(player).toBeVisible();
  return player;
}

async function startWorkoutTimer(page: Page) {
  await page.getByRole("button", { name: "Démarrer" }).click();
  await expect(page.locator(".workout-player-time")).not.toHaveText("00:00");
}

test.describe("SPORT — player de séance", () => {
  test.describe.configure({ mode: "serial" });

  test.skip(
    !hasTestCredentials(),
    "PLAYWRIGHT_TEST_EMAIL et PLAYWRIGHT_TEST_PASSWORD requis",
  );

  let e2eSession: E2eSportSession;

  test.beforeAll(async () => {
    await cleanupE2eSportSessions();
    e2eSession = await createE2eSportSession();
  });

  test.afterAll(async () => {
    await cleanupE2eSportSessions();
  });

  test("A — ouverture du player", async ({ page }) => {
    const player = await openWorkoutPlayer(page, e2eSession.title);
    await expect(page.getByText("Séance en cours")).toBeVisible();
    await expect(page.getByRole("button", { name: "Démarrer" })).toBeVisible();
    await expect(page.locator(".workout-player-time")).toBeVisible();
    await player.getByRole("button", { name: "Fermer" }).click();
    await expect(player).toBeHidden();
  });

  test("B — démarrage et timer actif", async ({ page }) => {
    await openWorkoutPlayer(page, e2eSession.title);
    const timer = page.locator(".workout-player-time");
    const before = await timer.innerText();
    await startWorkoutTimer(page);
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
    await page.waitForTimeout(1_500);
    await expect(timer).not.toHaveText(before);
  });

  test("C — reload restaure le player", async ({ page }) => {
    await openWorkoutPlayer(page, e2eSession.title);
    await startWorkoutTimer(page);
    await page.reload();
    await expect(page.getByRole("dialog", { name: "Séance en cours" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: /pause|reprendre/i })).toBeVisible();
  });

  test("D — changement d’onglet puis retour", async ({ page, context }) => {
    await openWorkoutPlayer(page, e2eSession.title);
    await startWorkoutTimer(page);
    const timerBefore = page.locator(".workout-player-time");
    const valueBefore = await timerBefore.innerText();

    const otherPage = await context.newPage();
    await otherPage.goto("/calendar");
    await page.bringToFront();

    await expect(page.getByRole("dialog", { name: "Séance en cours" })).toBeVisible();
    await page.waitForTimeout(1_500);
    await expect(timerBefore).not.toHaveText(valueBefore);
    await otherPage.close();
  });

  test("E — arrêt anticipé avec continuation puis abandon", async ({ page }) => {
    await openWorkoutPlayer(page, e2eSession.title);
    await startWorkoutTimer(page);

    await page.getByRole("button", { name: "Arrêter" }).click();
    await expect(page.getByRole("dialog", { name: "Arrêt anticipé" })).toBeVisible();
    await page.getByRole("button", { name: "Continuer la séance" }).click();
    await expect(page.getByRole("dialog", { name: "Séance en cours" })).toBeVisible();

    await page.getByRole("button", { name: "Arrêter" }).click();
    await page.getByRole("button", { name: "Interrompu" }).click();
    await expect(page.getByRole("dialog", { name: "Séance en cours" })).toBeHidden();
    await expect(page.getByRole("heading", { name: e2eSession.title })).toBeVisible();
  });

  test("F — finalisation complète de la séance", async ({ page }) => {
    await cleanupE2eSportSessions();
    e2eSession = await createE2eSportSession(`${Date.now()}-finish`);

    await openWorkoutPlayer(page, e2eSession.title);
    await startWorkoutTimer(page);

    for (let step = 0; step < 40; step += 1) {
      const completed = page.getByText(/bravo — séance terminée/i);
      if (await completed.isVisible().catch(() => false)) {
        break;
      }
      const skip = page.getByRole("button", { name: "Passer" });
      if (await skip.isVisible().catch(() => false)) {
        await skip.click();
        continue;
      }
      await page.waitForTimeout(300);
    }

    await expect(page.getByText(/bravo — séance terminée/i)).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole("button", { name: "Séance terminée" }).click();
    await expect(page.getByRole("dialog", { name: "Séance en cours" })).toBeHidden();

    await expect
      .poll(async () => (await fetchE2eSportSession(e2eSession.calendarItemId)).details?.status)
      .toBe("completed");

    const persisted = await fetchE2eSportSession(e2eSession.calendarItemId);
    expect(persisted.details?.actual_completed_at).toBeTruthy();

    await page.reload();
    await goToPlanning(page);

    const afterReload = await fetchE2eSportSession(e2eSession.calendarItemId);
    expect(afterReload.details?.status).toBe("completed");
    expect(afterReload.details?.actual_completed_at).toBeTruthy();
    expect(afterReload.details?.completion_status_label).toBeTruthy();
  });
});
