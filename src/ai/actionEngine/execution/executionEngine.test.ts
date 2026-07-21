import { describe, expect, it, vi } from "vitest";

import { ActionExecutionEngine } from "../execution/executionEngine";
import { createTestActionEngineDeps } from "../testing/actionEngineTestUtils";
import { finalizeSecureAction } from "../types/secureAction";
import { enrichDraftMetadata } from "../builders/actionBuilders";

function createDeps(
  overrides: Parameters<typeof createTestActionEngineDeps>[0] = {},
) {
  return createTestActionEngineDeps(overrides);
}

function createAction(type: "createTask" | "modifyTask") {
  const base = {
    type,
    description: "d",
    summary: "s",
    target: "tasks",
    payload:
      type === "createTask"
        ? { userId: "user-1", title: "Epic4C Task" }
        : { userId: "user-1", taskId: "t1", status: "done" },
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
      confidence: 0.8,
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

  return finalizeSecureAction(enrichDraftMetadata(base), { valid: true, issues: [] });
}

describe("EPIC4C ExecutionEngine", () => {
  it("exécute createTask via le service injecté", async () => {
    const deps = createDeps();
    const engine = new ActionExecutionEngine(deps);
    const action = createAction("createTask");

    const report = await engine.executeConfirmedAction(action, "user-1");

    expect(report.success).toBe(true);
    expect(deps.createTask).toHaveBeenCalledOnce();
    expect(report.message).toMatch(/créée/i);
  });

  it("refuse l'exécution si statut invalide", async () => {
    const engine = new ActionExecutionEngine(createDeps());
    const action = { ...createAction("createTask"), status: "cancelled" as const };

    const report = await engine.executeConfirmedAction(action, "user-1");
    expect(report.success).toBe(false);
    expect(report.error).toBe("validation_failed");
  });

  it("exécute modifyTask via updateTaskStatus", async () => {
    const deps = createDeps({
      getUserTasks: vi.fn(async () => [{ id: "t1", title: "Task" }]),
    });
    const engine = new ActionExecutionEngine(deps);
    const action = createAction("modifyTask");

    const report = await engine.executeConfirmedAction(action, "user-1");
    expect(report.success).toBe(true);
    expect(deps.updateTaskStatus).toHaveBeenCalledWith({
      taskId: "t1",
      status: "done",
    });
  });
});
