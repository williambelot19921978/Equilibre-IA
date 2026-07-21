import { describe, expect, it } from "vitest";

import { buildHumanModel } from "../../humanModelFoundation";
import { buildReadOnlyAssistantResponse } from "./responseBuilder";
import type { AssistantConversationContext } from "../types/assistantContext";
import { DISABLED_ADAPTIVE_INTELLIGENCE, DISABLED_DAILY_STATE, DISABLED_LIFE_KNOWLEDGE, DISABLED_PERSONAL_COACH, DISABLED_PLANNING_CALENDAR, DISABLED_PROACTIVE_INTELLIGENCE, DISABLED_SEMANTIC_PLANNING } from "../testing/planningCalendarTestUtils";

function minimalContext(): AssistantConversationContext {
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
      planningContext: {
        dailyCheckin: {
          id: "c1",
          user_id: "user-1",
          household_id: "hh-1",
          checkin_date: "2026-07-20",
          energy_level: "low",
          fatigue_level: "high",
          stress_level: "medium",
          mood: "tired",
          intensity: 4,
          note: null,
          created_at: "",
          updated_at: "",
        },
      } as AssistantConversationContext["planning"]["planningContext"],
      dayPlan: null,
      blockCount: 6,
      hasLoadedPlan: true,
    },
    planningCalendar: DISABLED_PLANNING_CALENDAR,
    semanticPlanning: DISABLED_SEMANTIC_PLANNING,
    adaptiveIntelligence: DISABLED_ADAPTIVE_INTELLIGENCE,
    proactiveIntelligence: DISABLED_PROACTIVE_INTELLIGENCE,
    dailyState: DISABLED_DAILY_STATE,
    personalCoach: DISABLED_PERSONAL_COACH,
    lifeKnowledge: DISABLED_LIFE_KNOWLEDGE,
    tasks: { total: 3, todo: 3, done: 0, topTitles: [] },
    goals: { enabled: false, activeCount: 0, goals: [] },
    dailyBrief: { enabled: false, brief: null },
    memory: { livingMemory: null, habitProfile: null, knownFactsCount: 0 },
    sources: [],
    gaps: [],
  };
}

describe("EPIC4-B Conversation + HumanModel integration", () => {
  it("utilise HumanModel pour répondre à une intention fatigue", () => {
    const context = minimalContext();
    const humanModel = buildHumanModel(context);

    const response = buildReadOnlyAssistantResponse({
      context,
      humanModel,
      classification: {
        intent: "fatigue",
        confidence: 0.9,
        matchedKeywords: ["fatigué"],
        reason: "mot fatigue",
      },
    });

    expect(response.text).toMatch(/énergie/i);
    expect(response.text).toMatch(/Fatigué|Très fatigué/);
    expect(response.explanation.humanModelReasons?.energy.length).toBeGreaterThan(0);
  });

  it("utilise HumanModel pour motivation", () => {
    const context = minimalContext();
    const humanModel = buildHumanModel(context);

    const response = buildReadOnlyAssistantResponse({
      context,
      humanModel,
      classification: {
        intent: "motivation",
        confidence: 0.85,
        matchedKeywords: ["motivation"],
        reason: "mot motivation",
      },
    });

    expect(response.text).toMatch(/motivation/i);
  });
});
