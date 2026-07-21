import { describe, expect, it } from "vitest";

import { buildHumanModel } from "../../ai/humanModelFoundation";
import { buildReadOnlyAssistantResponse } from "../../ai/conversationFoundation/conversation/responseBuilder";
import type { AssistantConversationContext } from "../../ai/conversationFoundation/types/assistantContext";
import {
  DISABLED_ADAPTIVE_INTELLIGENCE,
  DISABLED_DAILY_STATE,
  DISABLED_LIFE_KNOWLEDGE,
  DISABLED_PERSONAL_COACH,
  DISABLED_PLANNING_CALENDAR,
  DISABLED_PROACTIVE_INTELLIGENCE,
  DISABLED_SEMANTIC_PLANNING,
} from "../../ai/conversationFoundation/testing/planningCalendarTestUtils";

function contextWithCoach(): AssistantConversationContext {
  return {
    builtAt: "2026-07-20T12:00:00.000Z",
    date: "2026-07-20",
    user: {
      userId: "user-1",
      firstName: "William",
      profile: null,
      onboardingCompleted: true,
    },
    household: { householdId: "hh-1", members: [], childrenCount: 0, memory: null },
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
    lifeKnowledge: DISABLED_LIFE_KNOWLEDGE,
    personalCoach: {
      enabled: true,
      lifePriority: "wellbeing",
      todayCount: 2,
      opportunityCount: 1,
      recoveryCount: 1,
      successCount: 1,
      hasWeeklyReview: false,
      hasMonthlyReflection: false,
      hasProposedSession: true,
      phrasingHints: ["Je reste à tes côtés — on peut alléger cette journée ensemble."],
    },
    tasks: { total: 0, todo: 0, done: 0, topTitles: [] },
    goals: { enabled: false, activeCount: 0, goals: [] },
    dailyBrief: { enabled: false, brief: null },
    memory: { livingMemory: null, habitProfile: null, knownFactsCount: 0 },
    sources: [],
    gaps: [],
  };
}

describe("Conversation — Personal Coach phrasing", () => {
  it("injecte le hint du coach", () => {
    const context = contextWithCoach();
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

    expect(response.text).toContain("alléger");
  });
});
