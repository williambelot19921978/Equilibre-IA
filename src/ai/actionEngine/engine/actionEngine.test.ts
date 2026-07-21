import { beforeEach, describe, expect, it, vi } from "vitest";

import { SecureActionEngine } from "../engine/actionEngine";
import { createTestActionEngineDeps } from "../testing/actionEngineTestUtils";
import type { ActionBuilderContext } from "../types/actionBuilder";

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
    message: "créer une tâche epic4c test",
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

describe("EPIC4C SecureActionEngine", () => {
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

  it("prepareActions produit une action en attente de confirmation", async () => {
    const engine = new SecureActionEngine(createDeps());
    const { actions, errors } = await engine.prepareActions(createContext());

    expect(errors).toEqual([]);
    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0]?.status).toBe("pending_confirmation");
    expect(actions[0]?.requiresConfirmation).toBe(true);
  });

  it("confirmAction exécute après validation", async () => {
    const deps = createDeps();
    const engine = new SecureActionEngine(deps);
    const { actions } = await engine.prepareActions(createContext());
    const actionId = actions[0]?.id;
    expect(actionId).toBeTruthy();

    const result = await engine.confirmAction("user-1", actionId!);
    expect(result.report.success).toBe(true);
    expect(deps.createTask).toHaveBeenCalled();
  });

  it("cancelAction abandonne sans exécuter", async () => {
    const deps = createDeps();
    const engine = new SecureActionEngine(deps);
    const { actions } = await engine.prepareActions(createContext());
    const actionId = actions[0]?.id;
    expect(actionId).toBeTruthy();
    if (!actionId) return;

    const cancelled = engine.cancelAction("user-1", actionId);
    expect(cancelled.status).toBe("cancelled");
    expect(deps.createTask).not.toHaveBeenCalled();
  });

  it("ne prépare rien si moteur désactivé", async () => {
    const engine = new SecureActionEngine({
      ...createDeps(),
      isSecureActionEngineEnabled: () => false,
    });
    expect(engine.isEnabled()).toBe(false);
    const { actions, errors } = await engine.prepareActions(createContext());
    expect(actions).toEqual([]);
    expect(errors).toContain("Action Engine désactivé.");
  });
});
