import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { test, expect } from "../../fixtures/base.fixture";
import { hasTestCredentials } from "../helpers/auth";
import { goToHome } from "../helpers/navigation";
import { getCurrentDeviceDate } from "../../src/lib/time/deviceClock";

const authFile = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../playwright/.auth/user.json",
);

const isProduction =
  (process.env.PLAYWRIGHT_BASE_URL ?? "").includes("equilibre-ia.netlify.app");

async function openConversation(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: /parler à aura/i }).click();
  await expect(page.locator("#conversation-header-panel")).toBeVisible();
}

async function sendConversationMessage(
  page: import("@playwright/test").Page,
  text: string,
) {
  const input = page.locator(".floating-conversation-input");
  await input.fill(text);
  await page.getByRole("button", { name: /^envoyer$/i }).click();
}

test.describe("CONVERSATION — fatigue et décalage des tâches", () => {
  test.skip(
    !hasTestCredentials(),
    "PLAYWRIGHT_TEST_EMAIL et PLAYWRIGHT_TEST_PASSWORD requis",
  );
  test.skip(!existsSync(authFile), "Fichier playwright/.auth/user.json absent");
  test.skip(isProduction, "Spec local uniquement — utiliser fatigue-reschedule.prod.spec.ts");

  test("formulation explicite déclenche un décalage réel", async ({ page }) => {
    test.setTimeout(120_000);

    await goToHome(page);
    await openConversation(page);

    await sendConversationMessage(
      page,
      "Je suis fatigué, décale ce qui n'est pas urgent",
    );

    const assistantMessages = page.locator(".floating-conversation-message-assistant");
    await expect(assistantMessages.last()).toBeVisible({ timeout: 30_000 });
    const reply = (await assistantMessages.last().innerText()).toLowerCase();
    expect(reply.includes("c'est fait") || reply.includes("décalé")).toBe(true);
    expect(reply).not.toContain("je n'ai pas reconnu");
  });
});

test.describe("CONVERSATION — production fatigue reschedule", () => {
  test.skip(
    !isProduction,
    "Uniquement contre https://equilibre-ia.netlify.app",
  );
  test.skip(
    !hasTestCredentials(),
    "PLAYWRIGHT_TEST_EMAIL et PLAYWRIGHT_TEST_PASSWORD requis",
  );
  test.skip(!existsSync(authFile), "Fichier playwright/.auth/user.json absent");

  test("production — fatigue puis décalage", async ({ page }) => {
    test.setTimeout(180_000);
    const today = getCurrentDeviceDate();

    await goToHome(page);
    await openConversation(page);

    await sendConversationMessage(page, "Je suis vraiment crevé aujourd'hui");
    const assistantMessages = page.locator(".floating-conversation-message-assistant");
    await expect(assistantMessages.last()).toBeVisible({ timeout: 30_000 });

    const firstReply = (await assistantMessages.last().innerText()).toLowerCase();
    if (firstReply.includes("est-ce bien cela")) {
      await sendConversationMessage(page, "oui");
      await expect(assistantMessages.last()).toBeVisible({ timeout: 30_000 });
    }

    const proposal = (await assistantMessages.last().innerText()).toLowerCase();
    if (proposal.includes("je le fais")) {
      await sendConversationMessage(page, "décale");
      await expect(assistantMessages.last()).toBeVisible({ timeout: 30_000 });
      const finalReply = (await assistantMessages.last().innerText()).toLowerCase();
      expect(finalReply.includes("c'est fait") || finalReply.includes("décalé")).toBe(true);
    }

    await page.reload();
    await expect(page.locator("main.home-page-clean")).toBeVisible({ timeout: 30_000 });
    void today;
  });
});
