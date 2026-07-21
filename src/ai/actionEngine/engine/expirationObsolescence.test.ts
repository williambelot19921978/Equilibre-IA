import { beforeEach, describe, expect, it, vi } from "vitest";

import { SecureActionEngine } from "../engine/actionEngine";
import { createTestActionEngineDeps } from "../testing/actionEngineTestUtils";
import { finalizeSecureAction } from "../types/secureAction";
import { enrichDraftMetadata } from "../builders/actionBuilders";
import { getAuditEntriesForAction } from "../audit/auditLog";

function createDeps(
  overrides: Parameters<typeof createTestActionEngineDeps>[0] = {},
) {
  return createTestActionEngineDeps(overrides);
}

function buildCreateTaskAction() {
  const draft = enrichDraftMetadata({
    type: "createTask",
    description: "Créer",
    summary: "Créer tâche",
    target: "tasks",
    payload: { userId: "user-1", title: "Test" },
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
  });

  return finalizeSecureAction(draft, { valid: true, issues: [] });
}

describe("EPIC4C expiration et obsolescence", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      store: {} as Record<string, string>,
      getItem(key: string) {
        return this.store[key] ?? null;
      },
      setItem(key: string, value: string) {
        this.store[key] = value;
      },
      removeItem(key: string) {
        delete this.store[key];
      },
      clear() {
        this.store = {};
      },
      key: () => null,
      length: 0,
    });
  });

  it("refuse une action expirée", async () => {
    const engine = new SecureActionEngine(createDeps());
    const action = {
      ...buildCreateTaskAction(),
      expiresAt: new Date(Date.now() - 1_000).toISOString(),
    };
    const { savePendingAction } = await import("../store/pendingActionStore");
    savePendingAction("user-1", action);

    await expect(engine.confirmAction("user-1", action.id)).rejects.toThrow(/expirée/i);
    expect(getAuditEntriesForAction("user-1", action.id).some((e) => e.status === "expired")).toBe(
      true,
    );
  });

  it("refuse si la tâche a disparu avant exécution", async () => {
    const deps = createDeps({
      getUserTasks: vi.fn(async () => []),
    });
    const engine = new SecureActionEngine(deps);
    const action = finalizeSecureAction(
      enrichDraftMetadata({
        type: "deleteTask",
        description: "Supprimer",
        summary: "Supprimer tâche",
        target: "tasks",
        payload: { userId: "user-1", taskId: "gone-task", title: "X" },
        riskLevel: "high",
        requiresConfirmation: true,
        estimatedImpact: "Suppression",
        sourceIntent: "organization",
        origin: "assistant",
        preview: {
          title: "Supprimer",
          before: [],
          after: [],
          impact: "i",
          affectedItems: [],
          confidence: 0.5,
          risk: "high",
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

    const { savePendingAction } = await import("../store/pendingActionStore");
    savePendingAction("user-1", action);

    await expect(engine.confirmAction("user-1", action.id)).rejects.toThrow(/introuvable|existe plus/i);
    expect(deps.updateTaskStatus).not.toHaveBeenCalled();
  });

  it("refuse si permission collaboration retirée avant exécution", async () => {
    const deps = createDeps({
      isHouseholdCollaborationEnabled: vi.fn(() => false),
    });
    const engine = new SecureActionEngine(deps);
    const action = finalizeSecureAction(
      enrichDraftMetadata({
        type: "notifyHousehold",
        description: "Notifier",
        summary: "Notifier foyer",
        target: "household",
        payload: { userId: "user-1", message: "Bonjour" },
        riskLevel: "high",
        requiresConfirmation: true,
        estimatedImpact: "Notification",
        sourceIntent: "family",
        origin: "assistant",
        preview: {
          title: "Notifier",
          before: [],
          after: [],
          impact: "i",
          affectedItems: [],
          confidence: 0.5,
          risk: "high",
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

    const { savePendingAction } = await import("../store/pendingActionStore");
    savePendingAction("user-1", action);

    await expect(engine.confirmAction("user-1", action.id)).rejects.toThrow(
      /pas encore disponible|collaboration/i,
    );
  });

  it("refuse si userId ne correspond pas", async () => {
    const engine = new SecureActionEngine(createDeps());
    const action = buildCreateTaskAction();
    const { savePendingAction } = await import("../store/pendingActionStore");
    savePendingAction("user-1", action);

    await expect(engine.confirmAction("other-user", action.id)).rejects.toThrow(
      /introuvable|non autorisée|permission/i,
    );
  });
});
