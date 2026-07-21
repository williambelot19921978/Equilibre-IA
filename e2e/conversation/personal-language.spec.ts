import { test, expect } from "../../fixtures/base.fixture";
import { hasTestCredentials } from "../helpers/auth";
import { goToHome } from "../helpers/navigation";
import {
  cleanupE2ePersonalLanguageArtifacts,
  E2E_EXPRESSION,
  isPersonalLanguageTableAvailable,
  loadE2ePersonalLanguageExpression,
} from "../helpers/personalLanguage";

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

test.describe("CONVERSATION — apprentissage langage personnel", () => {
  test.skip(
    !hasTestCredentials(),
    "PLAYWRIGHT_TEST_EMAIL et PLAYWRIGHT_TEST_PASSWORD requis",
  );

  let tableAvailable = false;

  test.beforeAll(async () => {
    tableAvailable = await isPersonalLanguageTableAvailable();
  });

  test.beforeEach(async () => {
    test.skip(!tableAvailable, "Migration 00019 non appliquée sur Supabase");
    await cleanupE2ePersonalLanguageArtifacts(E2E_EXPRESSION);
  });

  test.afterEach(async () => {
    if (!tableAvailable) return;
    await cleanupE2ePersonalLanguageArtifacts(E2E_EXPRESSION);
  });

  test("flux sec → confirmation → mémorisation → réutilisation", async ({ page }) => {
    await goToHome(page);
    await openConversation(page);

    await sendConversationMessage(page, "Je suis sec aujourd'hui");

    const assistantMessages = page.locator(".floating-conversation-message-assistant");
    await expect(assistantMessages.last()).toContainText(/fatigu/i, { timeout: 20_000 });
    await expect(assistantMessages.last()).toContainText(/est-ce bien cela/i);

    await sendConversationMessage(page, "oui");

    await expect(assistantMessages.last()).not.toContainText(/est-ce bien cela/i, {
      timeout: 20_000,
    });

    const afterConfirm = (await assistantMessages.last().innerText()).toLowerCase();
    if (
      afterConfirm.includes("je le fais") ||
      afterConfirm.includes("alléger") ||
      afterConfirm.includes("décal")
    ) {
      await sendConversationMessage(page, "non");
      await expect(assistantMessages.last()).toBeVisible({ timeout: 20_000 });
    }

    const stored = await loadE2ePersonalLanguageExpression(E2E_EXPRESSION);
    expect(stored).not.toBeNull();
    expect(stored?.confirmationCount).toBeGreaterThanOrEqual(1);

    await sendConversationMessage(page, "Je suis sec");

    await expect(assistantMessages.last()).toBeVisible({ timeout: 20_000 });
    const secondReply = (await assistantMessages.last().innerText()).toLowerCase();
    expect(secondReply).not.toContain("est-ce bien cela");
    expect(secondReply.length).toBeGreaterThan(8);

    const storedAfterReuse = await loadE2ePersonalLanguageExpression(E2E_EXPRESSION);
    expect(storedAfterReuse?.confirmationCount).toBeGreaterThanOrEqual(1);
    expect((storedAfterReuse?.confidence ?? 0)).toBeGreaterThanOrEqual(stored?.confidence ?? 0);
  });
});
