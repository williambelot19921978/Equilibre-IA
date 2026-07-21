import { beforeEach, describe, expect, it, vi } from "vitest";

import { SecureActionEngine } from "../engine/actionEngine";
import { createTestActionEngineDeps } from "../testing/actionEngineTestUtils";
import type { ActionBuilderContext } from "../types/actionBuilder";
import { getAuditEntriesForAction } from "../audit/auditLog";

function createDeps(
  overrides: Parameters<typeof createTestActionEngineDeps>[0] = {},
) {
  return createTestActionEngineDeps(overrides);
}

function createContext(): ActionBuilderContext {
  return {
    userId: "user-1",
    firstName: "William",
    date: "2026-07-20",
    message: "créer une tâche epic4c anti double clic",
    classification: {
      intent: "organization",
      confidence: 0.85,
      reason: "organisation",
    },
    humanModel: {
      confidence: 0.7,
      availability: { value: "Modérée", confidence: 0.6, reasons: [] },
      mentalLoad: { value: "Charge modérée", confidence: 0.6, reasons: [] },
      dominantGoal: { value: null, confidence: 0.5, reasons: [] },
      familyPressure: { value: null, confidence: 0.5, reasons: [] },
    } as ActionBuilderContext["humanModel"],
    context: {
      date: "2026-07-20",
      user: { id: "user-1", firstName: "William" },
      tasks: { todo: 0, topTitles: [], enabled: true },
      goals: { enabled: false, activeCount: 0, goals: [] },
      planning: { blockCount: 0, hasLoadedPlan: false },
      household: { members: [], childrenCount: 0 },
    } as ActionBuilderContext["context"],
  };
}

describe("EPIC4C anti-double-clic", () => {
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

  it("deux confirmations simultanées ne provoquent qu'une seule écriture", async () => {
    const deps = createDeps();
    const engine = new SecureActionEngine(deps);
    const { actions } = await engine.prepareActions(createContext());
    const actionId = actions[0]?.id;
    expect(actionId).toBeTruthy();

    const results = await Promise.allSettled([
      engine.confirmAction("user-1", actionId!),
      engine.confirmAction("user-1", actionId!),
    ]);

    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(deps.createTask).toHaveBeenCalledTimes(1);

    const auditExecuted = getAuditEntriesForAction("user-1", actionId!).filter(
      (entry) => entry.status === "executed",
    );
    expect(auditExecuted).toHaveLength(1);
  });
});
