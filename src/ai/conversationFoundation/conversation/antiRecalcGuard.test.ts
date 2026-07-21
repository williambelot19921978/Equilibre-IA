/**
 * EPIC 4B certification — garde anti-recalcul Conversation Engine.
 * Le moteur conversationnel doit consommer exclusivement le HumanModel injecté.
 */

import { describe, expect, it } from "vitest";

import type { HumanModel } from "../../humanModelFoundation";
import { buildHumanModel } from "../../humanModelFoundation";
import { buildReadOnlyAssistantResponse } from "./responseBuilder";
import type { AssistantConversationContext } from "../types/assistantContext";
import { DISABLED_ADAPTIVE_INTELLIGENCE, DISABLED_DAILY_STATE, DISABLED_LIFE_KNOWLEDGE, DISABLED_PERSONAL_COACH, DISABLED_PLANNING_CALENDAR, DISABLED_PROACTIVE_INTELLIGENCE, DISABLED_SEMANTIC_PLANNING } from "../testing/planningCalendarTestUtils";

function richExhaustedContext(): AssistantConversationContext {
  return {
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
      childrenCount: 4,
      memory: null,
    },
    planning: {
      date: "2026-07-20",
      planningContext: {
        dailyCheckin: {
          id: "c1",
          user_id: "user-1",
          household_id: "hh-1",
          checkin_date: "2026-07-20",
          energy_level: "low",
          fatigue_level: "high",
          stress_level: "high",
          mood: "exhausted",
          intensity: 5,
          note: null,
          created_at: "",
          updated_at: "",
        },
      } as AssistantConversationContext["planning"]["planningContext"],
      dayPlan: { date: "2026-07-20", blocks: new Array(10).fill({ id: "b" }) } as never,
      blockCount: 10,
      hasLoadedPlan: true,
    },
    planningCalendar: DISABLED_PLANNING_CALENDAR,
    semanticPlanning: DISABLED_SEMANTIC_PLANNING,
    adaptiveIntelligence: DISABLED_ADAPTIVE_INTELLIGENCE,
    proactiveIntelligence: DISABLED_PROACTIVE_INTELLIGENCE,
    dailyState: DISABLED_DAILY_STATE,
    personalCoach: DISABLED_PERSONAL_COACH,
    lifeKnowledge: DISABLED_LIFE_KNOWLEDGE,
    tasks: { total: 20, todo: 20, done: 0, topTitles: ["Tâche brute"] },
    goals: {
      enabled: true,
      activeCount: 1,
      goals: [{ id: "raw-goal", name: "Objectif brut", progressPercent: 10 }],
    },
    dailyBrief: { enabled: false, brief: null },
    memory: { livingMemory: null, habitProfile: null, knownFactsCount: 0 },
    sources: [],
    gaps: [],
  };
}

function injectedOppositeModel(context: AssistantConversationContext): HumanModel {
  const baseline = buildHumanModel(context);

  return {
    ...baseline,
    energy: {
      value: "Très reposé",
      confidence: 0.99,
      explanation: "INJECTÉ — énergie artificiellement haute pour test anti-recalcul.",
      reasons: ["Valeur injectée — ne pas recalculer depuis le check-in exhausted."],
    },
    stress: {
      value: "Stress faible",
      confidence: 0.99,
      explanation: "INJECTÉ — stress artificiellement bas.",
      reasons: ["Injection test anti-recalcul stress."],
    },
    mentalLoad: {
      value: "Charge légère",
      confidence: 0.99,
      explanation: "INJECTÉ — charge artificiellement légère.",
      reasons: ["Injection test anti-recalcul charge."],
    },
    motivation: {
      value: "Motivation bonne",
      confidence: 0.99,
      explanation: "INJECTÉ — motivation artificiellement haute.",
      reasons: ["Injection test anti-recalcul motivation."],
    },
    availability: {
      value: "Bonne",
      confidence: 0.99,
      explanation: "INJECTÉ — disponibilité artificiellement bonne.",
      reasons: ["Injection test anti-recalcul disponibilité."],
    },
    familyPressure: {
      value: "Pression faible",
      confidence: 0.99,
      explanation: "INJECTÉ — pression familiale artificiellement faible.",
      reasons: ["Injection test anti-recalcul foyer."],
    },
    dominantGoal: {
      value: { id: "injected-goal", name: "Objectif injecté", progressPercent: 88 },
      confidence: 0.99,
      explanation: "INJECTÉ — objectif dominant forcé.",
      reasons: ["Injection test objectif dominant."],
    },
    currentState: {
      value: {
        energy: "Très reposé",
        stress: "Stress faible",
        mentalLoad: "Charge légère",
        availability: "Bonne",
        label: "INJECTÉ — état global artificiel",
      },
      confidence: 0.99,
      explanation: "INJECTÉ — synthèse forcée.",
      reasons: ["Injection test état global."],
    },
    confidence: 0.99,
  };
}

describe("EPIC4-B Anti-recalc guard — Conversation Engine", () => {
  it("fatigue : respecte l'énergie injectée, ignore le check-in exhausted", () => {
    const context = richExhaustedContext();
    const computed = buildHumanModel(context);
    expect(computed.energy.value).toMatch(/Fatigué|Très fatigué/);

    const injected = injectedOppositeModel(context);
    const response = buildReadOnlyAssistantResponse({
      context,
      humanModel: injected,
      classification: {
        intent: "fatigue",
        confidence: 0.9,
        matchedKeywords: ["fatigué"],
        reason: "test anti-recalc",
      },
    });

    expect(response.text).toContain("Très reposé");
    expect(response.text).not.toMatch(/Très fatigué|Fatigué/);
    expect(response.explanation.humanModelReasons?.energy[0]).toMatch(/injectée|INJECTÉ/i);
  });

  it("motivation : respecte la motivation injectée", () => {
    const context = richExhaustedContext();
    const injected = injectedOppositeModel(context);

    const response = buildReadOnlyAssistantResponse({
      context,
      humanModel: injected,
      classification: {
        intent: "motivation",
        confidence: 0.9,
        matchedKeywords: ["motivation"],
        reason: "test anti-recalc",
      },
    });

    expect(response.text).toContain("Motivation bonne");
    expect(response.text).not.toContain("Motivation faible");
  });

  it("organization : respecte la charge mentale injectée", () => {
    const context = richExhaustedContext();
    const injected = injectedOppositeModel(context);

    const response = buildReadOnlyAssistantResponse({
      context,
      humanModel: injected,
      classification: {
        intent: "organization",
        confidence: 0.85,
        matchedKeywords: ["organiser"],
        reason: "test anti-recalc",
      },
    });

    expect(response.text).toContain("Charge légère");
    expect(response.text).not.toContain("Charge forte");
  });

  it("planning : respecte la disponibilité injectée", () => {
    const context = richExhaustedContext();
    const injected = injectedOppositeModel(context);

    const response = buildReadOnlyAssistantResponse({
      context,
      humanModel: injected,
      classification: {
        intent: "planning",
        confidence: 0.85,
        matchedKeywords: ["planning"],
        reason: "test anti-recalc",
      },
    });

    expect(response.text).toContain("Bonne");
    expect(response.text).not.toContain("Faible");
  });

  it("family : respecte la pression familiale injectée", () => {
    const context = richExhaustedContext();
    const injected = injectedOppositeModel(context);

    const response = buildReadOnlyAssistantResponse({
      context,
      humanModel: injected,
      classification: {
        intent: "family",
        confidence: 0.85,
        matchedKeywords: ["foyer"],
        reason: "test anti-recalc",
      },
    });

    expect(response.text).toContain("Pression faible");
    expect(response.text).not.toContain("Pression élevée");
  });

  it("goals : respecte l'objectif dominant injecté", () => {
    const context = richExhaustedContext();
    const injected = injectedOppositeModel(context);

    const response = buildReadOnlyAssistantResponse({
      context,
      humanModel: injected,
      classification: {
        intent: "goals",
        confidence: 0.85,
        matchedKeywords: ["objectif"],
        reason: "test anti-recalc",
      },
    });

    expect(response.text).toContain("Objectif injecté");
    expect(response.text).not.toContain("Objectif brut");
  });

  it("default : utilise le label d'état injecté", () => {
    const context = richExhaustedContext();
    const injected = injectedOppositeModel(context);

    const response = buildReadOnlyAssistantResponse({
      context,
      humanModel: injected,
      classification: {
        intent: "general",
        confidence: 0.7,
        matchedKeywords: [],
        reason: "test anti-recalc",
      },
    });

    expect(response.text).toContain("INJECTÉ — état global artificiel");
  });
});
