import { describe, expect, it } from "vitest";

import { buildHumanModel } from "../../humanModelFoundation";
import { buildReadOnlyAssistantResponse } from "../conversation/responseBuilder";
import type { AssistantConversationContext } from "../types/assistantContext";
import { DISABLED_ADAPTIVE_INTELLIGENCE, DISABLED_DAILY_STATE, DISABLED_LIFE_KNOWLEDGE, DISABLED_PERSONAL_COACH, DISABLED_PLANNING_CALENDAR, DISABLED_PROACTIVE_INTELLIGENCE, DISABLED_SEMANTIC_PLANNING } from "../testing/planningCalendarTestUtils";

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

describe("EPIC4-A Response contract", () => {
  it("produit une réponse structurée en lecture seule", () => {
    const context = minimalContext();
    const humanModel = buildHumanModel(context);
    const response = buildReadOnlyAssistantResponse({
      context,
      humanModel,
      classification: {
        intent: "planning",
        confidence: 0.82,
        matchedKeywords: ["planning"],
        reason: "test",
      },
    });

    expect(response.readOnly).toBe(true);
    expect(response.intent).toBe("planning");
    expect(response.text).toMatch(/planning/i);
    expect(response.proposedActions.every((action) => action.status === "not_implemented")).toBe(
      true,
    );
    expect(response.explanation.sources).toBeDefined();
  });

  it("signale explicitement les données manquantes", () => {
    const context = minimalContext();
    const humanModel = buildHumanModel(context);
    const response = buildReadOnlyAssistantResponse({
      context,
      humanModel,
      classification: {
        intent: "planning",
        confidence: 0.8,
        matchedKeywords: ["planning"],
        reason: "test",
      },
    });

    expect(response.warning).toMatch(/planning/i);
  });
});
