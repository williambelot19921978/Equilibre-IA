/** @vitest-environment happy-dom */
import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

import { AssistantActionCard } from "./AssistantActionCard";
import type { ProposedAssistantAction } from "../../ai/conversationFoundation";

const action: ProposedAssistantAction = {
  type: "createTask",
  label: "Créer la tâche « Test EPIC4C »",
  description: "Créer une tâche",
  payload: { title: "Test EPIC4C" },
  executable: true,
  status: "pending_confirmation",
  actionId: "action-123",
  riskLevel: "low",
  estimatedImpact: "Ajout d'une tâche",
  validationValid: true,
  executionAvailable: true,
  preview: {
    title: "Créer une tâche",
    before: ["Aucune tâche"],
    after: ["Tâche Test EPIC4C"],
    impact: "Ajout",
    affectedItems: ["Test EPIC4C"],
    confidence: 0.8,
    risk: "low",
    why: [],
  },
  explainability: {
    summary: "Organisation",
    whyAction: ["Intent organisation"],
    whyTarget: ["Titre proposé"],
    whyTiming: [],
  },
};

describe("AssistantActionCard", () => {
  it("affiche résumé, impact et boutons Confirmer/Annuler", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(AssistantActionCard, {
          action,
          onConfirm,
          onCancel,
        }),
      );
    });

    expect(container.querySelector('[data-testid="assistant-action-card-action-123"]')).toBeTruthy();
    expect(container.textContent).toMatch(/Créer la tâche/i);
    expect(container.textContent).toMatch(/Impact/i);

    const confirmButton = container.querySelector(
      '[data-testid="assistant-action-confirm-action-123"]',
    ) as HTMLButtonElement;
    const cancelButton = container.querySelector(
      '[data-testid="assistant-action-cancel-action-123"]',
    ) as HTMLButtonElement;

    expect(confirmButton).toBeTruthy();
    expect(cancelButton).toBeTruthy();

    await act(async () => {
      confirmButton.click();
      cancelButton.click();
    });

    expect(onConfirm).toHaveBeenCalledWith("action-123");
    expect(onCancel).toHaveBeenCalledWith("action-123");
  });
});
