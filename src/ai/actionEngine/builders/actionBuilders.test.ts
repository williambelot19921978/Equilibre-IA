import { describe, expect, it } from "vitest";

import {
  createTaskBuilder,
  createReminderBuilder,
  modifyTaskBuilder,
  deleteTaskBuilder,
  moveTaskBuilder,
  rescheduleEventBuilder,
  resolveActionBuilders,
} from "../builders/actionBuilders";
import type { ActionBuilderContext } from "../types/actionBuilder";

function createContext(overrides: Partial<ActionBuilderContext> = {}): ActionBuilderContext {
  return {
    userId: "user-1",
    firstName: "William",
    date: "2026-07-20",
    message: "créer une tâche appeler le médecin",
    classification: {
      intent: "organization",
      confidence: 0.8,
      reason: "organisation",
    },
    humanModel: {
      confidence: 0.7,
      availability: { value: "Modérée", confidence: 0.6, reasons: ["Planning chargé"] },
      mentalLoad: { value: "Charge modérée", confidence: 0.6, reasons: [] },
      dominantGoal: { value: null, confidence: 0.5, reasons: [] },
      familyPressure: { value: null, confidence: 0.5, reasons: [] },
    } as ActionBuilderContext["humanModel"],
    context: {
      date: "2026-07-20",
      user: { id: "user-1", firstName: "William" },
      tasks: { todo: 2, topTitles: ["Courses"], enabled: true },
      goals: { enabled: true, activeCount: 1, goals: [{ id: "g1", name: "Sport" }] },
      planning: { blockCount: 3, hasLoadedPlan: true },
      household: { members: [], childrenCount: 0 },
    } as ActionBuilderContext["context"],
    ...overrides,
  };
}

describe("EPIC4C ActionBuilders", () => {
  it("createTaskBuilder détecte une demande de création", () => {
    const ctx = createContext();
    expect(createTaskBuilder.canBuild(ctx)).toBe(true);
    const draft = createTaskBuilder.build(ctx);
    expect(draft.type).toBe("createTask");
    expect(draft.payload.title).toBeTruthy();
    expect(draft.requiresConfirmation).toBe(true);
    expect(draft.preview.before.length).toBeGreaterThan(0);
  });

  it("createReminderBuilder détecte un rappel", () => {
    const ctx = createContext({ message: "créer un rappel prendre médicament" });
    expect(createReminderBuilder.canBuild(ctx)).toBe(true);
    expect(createReminderBuilder.build(ctx).type).toBe("createReminder");
  });

  it("modifyTaskBuilder nécessite une tâche existante", () => {
    const ctx = createContext({ message: "modifier ma tâche prioritaire" });
    expect(modifyTaskBuilder.canBuild(ctx)).toBe(true);
    const draft = modifyTaskBuilder.build(ctx);
    expect(draft.payload.title).toBe("Courses");
  });

  it("deleteTaskBuilder produit un risque élevé", () => {
    const ctx = createContext({ message: "supprimer la tâche courses" });
    expect(deleteTaskBuilder.canBuild(ctx)).toBe(true);
    expect(deleteTaskBuilder.build(ctx).riskLevel).toBe("high");
  });

  it("moveTaskBuilder inclut l'explicabilité timing", () => {
    const ctx = createContext({
      message: "déplacer ma tâche demain",
      classification: {
        intent: "planning",
        confidence: 0.75,
        reason: "planning",
      },
    });
    expect(moveTaskBuilder.canBuild(ctx)).toBe(true);
    const draft = moveTaskBuilder.build(ctx);
    expect(draft.explainability.whyTiming.length).toBeGreaterThan(0);
  });

  it("resolveActionBuilders retourne au plus les builders pertinents", () => {
    const ctx = createContext();
    const builders = resolveActionBuilders(ctx);
    expect(builders.length).toBeGreaterThan(0);
    expect(builders.some((builder) => builder.type === "createTask")).toBe(true);
  });

  it("replanifier un événement cible rescheduleEvent, pas moveTask", () => {
    const ctx = createContext({
      message: "replanifier un événement du planning",
      classification: {
        intent: "planning",
        confidence: 0.95,
        reason: "planning",
      },
      context: {
        date: "2026-07-20",
        user: { id: "user-1", firstName: "William" },
        tasks: { todo: 2, topTitles: ["Courses"], enabled: true },
        goals: { enabled: true, activeCount: 1, goals: [{ id: "g1", name: "Sport" }] },
        planning: { blockCount: 9, hasLoadedPlan: true },
        household: { members: [], childrenCount: 0 },
      } as ActionBuilderContext["context"],
      humanModel: {
        confidence: 0.73,
        availability: { value: "Faible", confidence: 0.73, reasons: ["Planning chargé"] },
        mentalLoad: { value: "Charge forte", confidence: 0.8, reasons: [] },
        dominantGoal: { value: null, confidence: 0.5, reasons: [] },
        familyPressure: { value: null, confidence: 0.5, reasons: [] },
      } as ActionBuilderContext["humanModel"],
    });

    expect(moveTaskBuilder.canBuild(ctx)).toBe(false);
    expect(rescheduleEventBuilder.canBuild(ctx)).toBe(true);

    const builders = resolveActionBuilders(ctx);
    expect(builders).toHaveLength(1);
    expect(builders[0]?.type).toBe("rescheduleEvent");
    expect(rescheduleEventBuilder.build(ctx).payload.entryId).toBe("");
  });
});
