import { describe, expect, it } from "vitest";

import type { AssistantConversationContext } from "../../conversationFoundation/types/assistantContext";
import { DISABLED_ADAPTIVE_INTELLIGENCE, DISABLED_DAILY_STATE, DISABLED_LIFE_KNOWLEDGE, DISABLED_PERSONAL_COACH, DISABLED_PLANNING_CALENDAR, DISABLED_PROACTIVE_INTELLIGENCE, DISABLED_SEMANTIC_PLANNING } from "../../conversationFoundation/testing/planningCalendarTestUtils";
import { buildHumanModel } from "../engine/humanModelEngine";

function minimalContext(
  overrides: Partial<AssistantConversationContext> = {},
): AssistantConversationContext {
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
    goals: { enabled: false, activeCount: 0, goals: [] },
    dailyBrief: { enabled: false, brief: null },
    memory: { livingMemory: null, habitProfile: null, knownFactsCount: 0 },
    sources: [],
    gaps: ["Planning du jour non chargé."],
    ...overrides,
  };
}

describe("EPIC4-B HumanModelEngine", () => {
  it("produit un modèle valide même avec peu de données", () => {
    const model = buildHumanModel(minimalContext());

    expect(model.identity.userId).toBe("user-1");
    expect(model.lastUpdated).toBeTruthy();
    expect(model.confidence).toBeGreaterThan(0);
    expect(model.missingData.length).toBeGreaterThan(0);
    expect(model.familyPressure.value).toBe("Pression faible");
  });

  it("interprète énergie et charge avec check-in et activité", () => {
    const model = buildHumanModel(
      minimalContext({
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
              mood: "tired",
              intensity: 4,
              note: null,
              created_at: "",
              updated_at: "",
            },
          } as AssistantConversationContext["planning"]["planningContext"],
          dayPlan: { date: "2026-07-20", blocks: new Array(8).fill({ id: "b" }) } as never,
          blockCount: 8,
          hasLoadedPlan: true,
        },
        tasks: { total: 10, todo: 10, done: 0, topTitles: ["Courses"] },
      }),
    );

    expect(model.energy.value).toMatch(/Fatigué|Très fatigué/);
    expect(model.mentalLoad.value).toBe("Charge forte");
    expect(model.currentState.value?.label.length).toBeGreaterThan(0);
    expect(model.energy.reasons.length).toBeGreaterThan(0);
  });
});
