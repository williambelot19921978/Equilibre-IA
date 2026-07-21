/**
 * EPIC 4B certification — profils globaux buildHumanModel (A–I).
 */

import { describe, expect, it } from "vitest";

import type { AssistantConversationContext } from "../../conversationFoundation/types/assistantContext";
import { DISABLED_ADAPTIVE_INTELLIGENCE, DISABLED_DAILY_STATE, DISABLED_LIFE_KNOWLEDGE, DISABLED_PERSONAL_COACH, DISABLED_PLANNING_CALENDAR, DISABLED_PROACTIVE_INTELLIGENCE, DISABLED_SEMANTIC_PLANNING } from "../../conversationFoundation/testing/planningCalendarTestUtils";
import { buildHumanModel } from "../engine/humanModelEngine";
import { makeCheckin } from "../testing/ruleTestUtils";
import type { HumanModel } from "../types/humanModel";

function baseContext(
  overrides: Partial<AssistantConversationContext> = {},
): AssistantConversationContext {
  const context: AssistantConversationContext = {
    builtAt: "2026-07-20T12:00:00.000Z",
    date: "2026-07-20",
    user: {
      userId: "user-1",
      firstName: "William",
      profile: null,
      onboardingCompleted: true,
    },
    household: {
      householdId: "hh-1",
      members: [],
      childrenCount: 0,
      memory: null,
    },
    planning: {
      date: "2026-07-20",
      planningContext: null,
      dayPlan: null,
      blockCount: 0,
      hasLoadedPlan: false,
    },
    planningCalendar: DISABLED_PLANNING_CALENDAR,
    semanticPlanning: DISABLED_SEMANTIC_PLANNING,
    adaptiveIntelligence: DISABLED_ADAPTIVE_INTELLIGENCE,
    proactiveIntelligence: DISABLED_PROACTIVE_INTELLIGENCE,
    dailyState: DISABLED_DAILY_STATE,
    personalCoach: DISABLED_PERSONAL_COACH,
    lifeKnowledge: DISABLED_LIFE_KNOWLEDGE,
    tasks: { total: 0, todo: 0, done: 0, topTitles: [] },
    goals: { enabled: true, activeCount: 0, goals: [] },
    dailyBrief: { enabled: true, brief: null },
    memory: { livingMemory: null, habitProfile: null, knownFactsCount: 0 },
    sources: [],
    gaps: [],
    ...overrides,
  };
  return context;
}

function assertValidHumanModel(model: HumanModel, source: AssistantConversationContext): void {
  expect(model.identity.userId).toBe(source.user.userId);
  expect(model.identity.firstName).toBe(source.user.firstName);
  expect(model.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  expect(model.confidence).toBeGreaterThanOrEqual(0);
  expect(model.confidence).toBeLessThanOrEqual(1);
  expect(Number.isNaN(model.confidence)).toBe(false);
  expect(Array.isArray(model.missingData)).toBe(true);

  for (const field of [
    model.currentState,
    model.energy,
    model.mentalLoad,
    model.focus,
    model.sleep,
    model.motivation,
    model.availability,
    model.familyPressure,
    model.stress,
    model.dominantGoal,
    model.dominantConcern,
  ]) {
    expect(field.confidence).toBeGreaterThanOrEqual(0);
    expect(field.confidence).toBeLessThanOrEqual(1);
    expect(Number.isNaN(field.confidence)).toBe(false);
    expect(typeof field.explanation).toBe("string");
    expect(field.explanation.length).toBeGreaterThan(0);
  }
}

describe("EPIC4-B HumanModel global profiles", () => {
  it("A — contexte riche, journée légère", () => {
    const context = baseContext({
      planning: {
        date: "2026-07-20",
        planningContext: {
          dailyCheckin: makeCheckin("good", { energy_level: "high", fatigue_level: "low" }),
          profile: { preferredFocusMinutes: 45, sleepNeededHours: 8 },
        } as never,
        dayPlan: { date: "2026-07-20", blocks: [{ id: "b1" }, { id: "b2" }] } as never,
        blockCount: 2,
        hasLoadedPlan: true,
      },
      tasks: { total: 2, todo: 2, done: 0, topTitles: ["Lecture"] },
      goals: {
        enabled: true,
        activeCount: 1,
        goals: [{ id: "g1", name: "Sport", progressPercent: 40 }],
      },
      dailyBrief: {
        enabled: true,
        brief: {
          greeting: "Bonjour William",
          synthesis: "Journée calme.",
          recommendations: [],
          insights: [],
        } as never,
      },
    });

    const model = buildHumanModel(context);
    assertValidHumanModel(model, context);
    expect(model.mentalLoad.value).toBe("Charge légère");
    expect(model.dominantGoal.value?.name).toBe("Sport");
  });

  it("B — contexte riche, journée très chargée", () => {
    const context = baseContext({
      planning: {
        date: "2026-07-20",
        planningContext: {
          dailyCheckin: makeCheckin("tired", {
            fatigue_level: "high",
            stress_level: "high",
          }),
        } as never,
        dayPlan: { date: "2026-07-20", blocks: new Array(10).fill({ id: "b" }) } as never,
        blockCount: 10,
        hasLoadedPlan: true,
      },
      tasks: { total: 15, todo: 15, done: 0, topTitles: ["A", "B", "C"] },
      household: { householdId: "hh-1", members: [], childrenCount: 2, memory: null },
    });

    const model = buildHumanModel(context);
    assertValidHumanModel(model, context);
    expect(model.mentalLoad.value).toBe("Charge forte");
    expect(model.energy.value).toMatch(/Fatigué|Très fatigué/);
  });

  it("C — très peu de données", () => {
    const context = baseContext({
      gaps: ["Planning du jour non chargé.", "Aucune tâche disponible."],
      goals: { enabled: true, activeCount: 0, goals: [] },
    });

    const model = buildHumanModel(context);
    assertValidHumanModel(model, context);
    expect(model.missingData.length).toBeGreaterThan(0);
    expect(model.energy.value).toBeNull();
    expect(model.dominantGoal.value).toBeNull();
  });

  it("D — aucune donnée exploitable", () => {
    const context = baseContext({
      goals: { enabled: false, activeCount: 0, goals: [] },
      gaps: ["Aucun foyer associé.", "Contexte planning indisponible."],
    });

    const model = buildHumanModel(context);
    assertValidHumanModel(model, context);
    expect(model.sleep.value).toBeNull();
    expect(model.motivation.value).toBeNull();
    expect(model.dominantConcern.value).toMatch(/foyer|planning/i);
  });

  it("E — données contradictoires (humeur great + fatigue élevée déclarée)", () => {
    const context = baseContext({
      planning: {
        date: "2026-07-20",
        planningContext: {
          dailyCheckin: makeCheckin("great", {
            fatigue_level: "high",
            energy_level: "low",
          }),
        } as never,
        dayPlan: null,
        blockCount: 0,
        hasLoadedPlan: false,
      },
    });

    const model = buildHumanModel(context);
    assertValidHumanModel(model, context);
    expect(model.energy.value).toBeTruthy();
    expect(model.energy.reasons.length).toBeGreaterThan(1);
  });

  it("F — utilisateur avec enfants", () => {
    const context = baseContext({
      household: {
        householdId: "hh-family",
        members: [{ id: "m1" }, { id: "m2" }] as never,
        childrenCount: 3,
        memory: null,
      },
    });

    const model = buildHumanModel(context);
    assertValidHumanModel(model, context);
    expect(model.familyPressure.value).toBe("Pression élevée");
    expect(model.familyPressure.reasons.some((reason) => reason.includes("enfant"))).toBe(true);
  });

  it("G — utilisateur sans enfant", () => {
    const context = baseContext({
      household: {
        householdId: "hh-solo",
        members: [],
        childrenCount: 0,
        memory: null,
      },
    });

    const model = buildHumanModel(context);
    assertValidHumanModel(model, context);
    expect(model.familyPressure.value).toBe("Pression faible");
  });

  it("H — aucun objectif actif", () => {
    const context = baseContext({
      goals: { enabled: true, activeCount: 0, goals: [] },
    });

    const model = buildHumanModel(context);
    assertValidHumanModel(model, context);
    expect(model.dominantGoal.value).toBeNull();
    expect(model.dominantGoal.explanation).toMatch(/objectif/i);
  });

  it("I — plusieurs objectifs actifs", () => {
    const context = baseContext({
      goals: {
        enabled: true,
        activeCount: 3,
        goals: [
          { id: "g1", name: "Lecture", progressPercent: 10 },
          { id: "g2", name: "Sport", progressPercent: 55 },
          { id: "g3", name: "Projet", progressPercent: 30 },
        ],
      },
    });

    const model = buildHumanModel(context);
    assertValidHumanModel(model, context);
    expect(model.dominantGoal.value?.name).toBe("Sport");
    expect(model.dominantGoal.value?.id).toBe("g2");
  });

  it("ne mute pas le contexte source", () => {
    const context = baseContext({
      tasks: { total: 1, todo: 1, done: 0, topTitles: ["Immutable"] },
    });
    const snapshot = structuredClone(context);
    buildHumanModel(context);
    expect(context).toEqual(snapshot);
  });
});
