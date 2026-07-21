import { describe, expect, it, vi } from "vitest";

import {
  formatValidationErrors,
  validateActionDraft,
  validateActionForExecution,
} from "../validation/validationEngine";
import { createTestActionEngineDeps } from "../testing/actionEngineTestUtils";
import { finalizeSecureAction } from "../types/secureAction";
import { enrichDraftMetadata } from "../builders/actionBuilders";

function createDeps(
  overrides: Parameters<typeof createTestActionEngineDeps>[0] = {},
) {
  return createTestActionEngineDeps({
    getUserTasks: vi.fn(async () => [{ id: "t1", title: "Courses" }]),
    getUserGoals: vi.fn(() => [{ id: "g1", name: "Sport" }]),
    ...overrides,
  });
}

describe("EPIC4C ValidationEngine", () => {
  it("rejette un createTask sans titre", async () => {
    const draft = {
      type: "createTask" as const,
      description: "test",
      summary: "test",
      target: "tasks",
      payload: { userId: "user-1", title: "  " },
      riskLevel: "low" as const,
      requiresConfirmation: true as const,
      estimatedImpact: "impact",
      sourceIntent: "organization" as const,
      origin: "assistant" as const,
      preview: {
        title: "t",
        before: [],
        after: [],
        impact: "i",
        affectedItems: [],
        confidence: 0.5,
        risk: "low" as const,
        why: [],
      },
      explainability: {
        summary: "s",
        whyAction: [],
        whyTarget: [],
        whyTiming: [],
      },
    };

    const result = await validateActionDraft(draft, createDeps());
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "missing_title")).toBe(true);
  });

  it("rejette modifyTask si tâche absente", async () => {
    const draft = {
      type: "modifyTask" as const,
      description: "test",
      summary: "test",
      target: "tasks",
      payload: { userId: "user-1", taskId: "missing", title: "X" },
      riskLevel: "medium" as const,
      requiresConfirmation: true as const,
      estimatedImpact: "impact",
      sourceIntent: "organization" as const,
      origin: "assistant" as const,
      preview: {
        title: "t",
        before: [],
        after: [],
        impact: "i",
        affectedItems: [],
        confidence: 0.5,
        risk: "medium" as const,
        why: [],
      },
      explainability: {
        summary: "s",
        whyAction: [],
        whyTarget: [],
        whyTiming: [],
      },
    };

    const result = await validateActionDraft(draft, createDeps());
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "task_not_found")).toBe(true);
  });

  it("refuse l'exécution sans confirmation", () => {
    const action = finalizeSecureAction(
      enrichDraftMetadata({
        type: "createTask",
        description: "d",
        summary: "Créer tâche",
        target: "tasks",
        payload: { userId: "user-1", title: "Test" },
        riskLevel: "low",
        requiresConfirmation: true,
        estimatedImpact: "impact",
        sourceIntent: "organization",
        origin: "assistant",
        preview: {
          title: "t",
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

    const cancelled = { ...action, status: "cancelled" as const };
    const result = validateActionForExecution(cancelled, "user-1");
    expect(result.valid).toBe(false);
    expect(formatValidationErrors(result)).toMatch(/statut/i);
  });

  it("refuse notifyHousehold si collaboration désactivée", async () => {
    const draft = {
      type: "notifyHousehold" as const,
      description: "test",
      summary: "test",
      target: "household",
      payload: { userId: "user-1", message: "Bonjour" },
      riskLevel: "high" as const,
      requiresConfirmation: true as const,
      estimatedImpact: "impact",
      sourceIntent: "family" as const,
      origin: "assistant" as const,
      preview: {
        title: "t",
        before: [],
        after: [],
        impact: "i",
        affectedItems: [],
        confidence: 0.5,
        risk: "high" as const,
        why: [],
      },
      explainability: {
        summary: "s",
        whyAction: [],
        whyTarget: [],
        whyTiming: [],
      },
    };

    const result = await validateActionDraft(
      draft,
      createDeps({ isHouseholdCollaborationEnabled: vi.fn(() => false) }),
    );
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "collaboration_disabled")).toBe(true);
  });
});
