import { describe, expect, it } from "vitest";

import { mergeSecureActionsIntoResponse, secureActionToProposed } from "../bridge/assistantActionBridge";
import { finalizeSecureAction } from "../types/secureAction";
import { enrichDraftMetadata } from "../builders/actionBuilders";
import type { AssistantResponse } from "../../conversationFoundation/types/responseContract";

const baseResponse: AssistantResponse = {
  text: "Bonjour",
  confidence: 0.8,
  intent: "organization",
  reasoning: "org",
  suggestions: [],
  proposedActions: [],
  explanation: {
    summary: "s",
    reasoning: "r",
    sources: [],
    missingData: [],
  },
  readOnly: true,
};

describe("EPIC4C assistantActionBridge", () => {
  it("mappe une SecureAction vers ProposedAssistantAction exécutable", () => {
    const action = finalizeSecureAction(
      enrichDraftMetadata({
        type: "createTask",
        description: "Créer",
        summary: "Créer tâche Test",
        target: "tasks",
        payload: { userId: "u1", title: "Test" },
        riskLevel: "low",
        requiresConfirmation: true,
        estimatedImpact: "Ajout",
        sourceIntent: "organization",
        origin: "assistant",
        preview: {
          title: "Créer",
          before: ["Avant"],
          after: ["Après"],
          impact: "Impact",
          affectedItems: ["Test"],
          confidence: 0.8,
          risk: "low",
          why: [],
        },
        explainability: {
          summary: "s",
          whyAction: ["Pourquoi"],
          whyTarget: [],
          whyTiming: [],
        },
      }),
      { valid: true, issues: [] },
    );

    const proposed = secureActionToProposed(action);
    expect(proposed.executable).toBe(true);
    expect(proposed.status).toBe("pending_confirmation");
    expect(proposed.actionId).toBe(action.id);
  });

  it("mergeSecureActionsIntoResponse enrichit le texte", () => {
    const action = finalizeSecureAction(
      enrichDraftMetadata({
        type: "createTask",
        description: "Créer",
        summary: "Créer tâche",
        target: "tasks",
        payload: { userId: "u1", title: "Test" },
        riskLevel: "low",
        requiresConfirmation: true,
        estimatedImpact: "Ajout",
        sourceIntent: "organization",
        origin: "assistant",
        preview: {
          title: "Créer",
          before: [],
          after: [],
          impact: "i",
          affectedItems: [],
          confidence: 0.8,
          risk: "low",
          why: [],
        },
        explainability: {
          summary: "s",
          whyAction: [],
          whyTarget: [],
          whyTiming: [],
        },
      }),
      { valid: true, issues: [] },
    );

    const merged = mergeSecureActionsIntoResponse(baseResponse, [action]);
    expect(merged.proposedActions).toHaveLength(1);
    expect(merged.text).toMatch(/confirme/i);
  });
});
