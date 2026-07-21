import { describe, expect, it } from "vitest";

import { buildHumanModel } from "../../ai/humanModelFoundation";
import { buildReadOnlyAssistantResponse } from "../../ai/conversationFoundation/conversation/responseBuilder";
import type { AssistantConversationContext } from "../../ai/conversationFoundation/types/assistantContext";
import {
  DISABLED_ADAPTIVE_INTELLIGENCE,
  DISABLED_PLANNING_CALENDAR,
  DISABLED_LIFE_KNOWLEDGE,
  DISABLED_PERSONAL_COACH,
  DISABLED_PROACTIVE_INTELLIGENCE,
  DISABLED_SEMANTIC_PLANNING,
} from "../../ai/conversationFoundation/testing/planningCalendarTestUtils";

function contextWithDailyState(
  overrides: Partial<AssistantConversationContext["dailyState"]> = {},
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
    dailyState: {
      enabled: true,
      hasCheckinToday: true,
      today: {
        date: "2026-07-20",
        mood: "tired",
        energy: 3,
        stress: 6,
        sleepQuality: 2,
        specialDay: "normal",
        confidence: 0.9,
      },
      shouldRemind: false,
      phrasingHints: ["Nous allons essayer de rendre cette journée plus légère."],
      trendEnergy7d: 5,
      trendStress7d: 5,
      ...overrides,
    },
    personalCoach: DISABLED_PERSONAL_COACH,
    lifeKnowledge: DISABLED_LIFE_KNOWLEDGE,
    tasks: { total: 0, todo: 0, done: 0, topTitles: [] },
    goals: { enabled: false, activeCount: 0, goals: [] },
    dailyBrief: { enabled: false, brief: null },
    memory: { livingMemory: null, habitProfile: null, knownFactsCount: 0 },
    sources: [],
    gaps: [],
  };
}

describe("Conversation — DailyState phrasing", () => {
  it("injecte le hint de ton adapté à l'énergie", () => {
    const context = contextWithDailyState();
    const humanModel = buildHumanModel(context);
    const response = buildReadOnlyAssistantResponse({
      context,
      humanModel,
      classification: {
        intent: "general",
        confidence: 0.8,
        matchedKeywords: [],
        reason: "test",
      },
      message: "Bonjour",
    });

    expect(response.text).toContain("plus légère");
  });
});
