import { describe, expect, it } from "vitest";

import { aggregateBehaviorSignals } from "./aggregateBehaviorSignals";
import {
  buildLanguageMemoryContext,
  buildDeclarativeSnapshot,
} from "./buildLanguageMemoryContext";
import {
  enrichAssistantWithLanguageMemory,
  shouldEnrichWithLanguageMemory,
} from "./enrichAssistantWithMemory";
import { selectLanguageMemoryHints } from "./selectLanguageMemoryHints";
import type { TaskActivityEventRecord } from "../../types/taskActivity";

const REFERENCE_DATE = "2026-07-20";

function baseInput() {
  return {
    userId: "user-1",
    referenceDate: REFERENCE_DATE,
    baseProfile: {
      workSchedule: { start: "09:00", end: "17:00" },
      sleepSchedule: { wakeTime: "07:00", bedTime: "23:00" },
      mainPriority: "family",
    },
    profile: {
      eveningRoutine: [],
      workDays: ["monday", "friday"],
      procrastinationCauses: [],
      sleepNeededHours: 8,
      sleepProblems: [],
      sportInterests: [],
      sportMusic: [],
      restPreferences: [],
      faithContent: [],
      spiritualThemesAvoid: [],
    },
    onboardingCompleted: true,
    discovery: {
      percentage: 60,
      answeredCount: 12,
      applicableCount: 20,
      remainingCount: 8,
      isComplete: false,
    },
    living: {
      knowledgeLevel: {
        id: "understanding" as const,
        label: "Je commence à te comprendre",
        score: 45,
        progressPercent: 45,
      },
      globalConfidence: 0.62,
      coachPersonality: "bienveillant",
      insights: [
        {
          id: "ins-1",
          category: "sport",
          label: "Sport le matin",
          detail: "Tu termines souvent tes séances le matin.",
          reasoning: "3 séances observées",
          evidence: ["event-1"],
          confidence: 0.8,
          firstSeen: REFERENCE_DATE,
          lastConfirmed: REFERENCE_DATE,
          evidenceCount: 3,
          status: "learned" as const,
        },
      ],
      dailyMissionTitle: "Accorder une pause",
    },
    behavior: {
      windowDays: 30,
      counts: {
        completed: 8,
        skipped: 4,
        cancelled: 1,
        moved: 2,
        planned: 3,
        total: 18,
      },
      skipRatePercent: 33,
      completionRatePercent: 67,
    },
  };
}

function event(
  type: TaskActivityEventRecord["event_type"],
  at: string,
): TaskActivityEventRecord {
  return {
    id: `${type}-${at}`,
    household_id: "h1",
    user_id: "u1",
    task_id: "t1",
    calendar_item_id: null,
    event_type: type,
    occurred_at: at,
    metadata: {},
    created_at: at,
  };
}

describe("ai-core-language-memory-v1", () => {
  it("01 — buildLanguageMemoryContext fusionne déclaratif, living et discovery", () => {
    const context = buildLanguageMemoryContext(baseInput());
    expect(context.declarative.workStart).toBe("09:00");
    expect(context.living?.knowledgeLevelLabel).toContain("comprendre");
    expect(context.discovery.remainingCount).toBe(8);
    expect(context.hasSufficientData).toBe(true);
  });

  it("02 — aggregateBehaviorSignals calcule skipRate sur fenêtre glissante", () => {
    const summary = aggregateBehaviorSignals({
      referenceDate: REFERENCE_DATE,
      events: [
        event("completed", "2026-07-18T10:00:00.000Z"),
        event("completed", "2026-07-19T10:00:00.000Z"),
        event("skipped", "2026-07-19T12:00:00.000Z"),
        event("skipped", "2026-07-20T08:00:00.000Z"),
      ],
    });
    expect(summary.counts.total).toBe(4);
    expect(summary.skipRatePercent).toBe(50);
  });

  it("03 — selectLanguageMemoryHints priorise mission et insights", () => {
    const hints = selectLanguageMemoryHints(buildLanguageMemoryContext(baseInput()));
    expect(hints.length).toBeGreaterThan(0);
    expect(hints.length).toBeLessThanOrEqual(3);
    expect(hints[0].type).toBe("mission");
  });

  it("04 — enrichAssistantWithLanguageMemory enrichit ask_question", () => {
    const enriched = enrichAssistantWithLanguageMemory({
      message: "Voici ce que je peux te proposer.",
      intent: "ask_question",
      languageMemory: buildLanguageMemoryContext(baseInput()),
    });
    expect(enriched).toContain("Mission du jour");
    expect(enriched).toContain("Voici ce que je peux te proposer.");
  });

  it("05 — enrichAssistantWithLanguageMemory n'enrichit pas modify_work", () => {
    const message = "C'est fait.";
    const enriched = enrichAssistantWithLanguageMemory({
      message,
      intent: "modify_work",
      languageMemory: buildLanguageMemoryContext(baseInput()),
    });
    expect(enriched).toBe(message);
  });

  it("06 — shouldEnrichWithLanguageMemory couvre les questions ouvertes uniquement", () => {
    expect(shouldEnrichWithLanguageMemory("unknown")).toBe(false);
    expect(shouldEnrichWithLanguageMemory("declare_fatigue")).toBe(false);
    expect(shouldEnrichWithLanguageMemory("ask_question")).toBe(true);
    expect(shouldEnrichWithLanguageMemory("request_suggestion")).toBe(true);
    expect(shouldEnrichWithLanguageMemory("modify_sport")).toBe(false);
  });

  it("07 — données vides — hasSufficientData false", () => {
    const context = buildLanguageMemoryContext({
      ...baseInput(),
      discovery: {
        percentage: 0,
        answeredCount: 0,
        applicableCount: 0,
        remainingCount: 0,
        isComplete: false,
      },
      living: null,
      behavior: null,
    });
    expect(context.hasSufficientData).toBe(false);
    expect(selectLanguageMemoryHints(context)).toHaveLength(0);
  });

  it("08 — hint discovery si questions restantes", () => {
    const hints = selectLanguageMemoryHints(
      buildLanguageMemoryContext({
        ...baseInput(),
        living: null,
        behavior: null,
      }),
    );
    expect(hints.some((hint) => hint.type === "discovery")).toBe(true);
  });

  it("09 — hint behavior skip rate élevé", () => {
    const hints = selectLanguageMemoryHints(buildLanguageMemoryContext(baseInput()));
    expect(hints.some((hint) => hint.id === "behavior-skip-rate")).toBe(true);
  });

  it("10 — pas de doublons dans les hints", () => {
    const hints = selectLanguageMemoryHints(buildLanguageMemoryContext(baseInput()));
    const ids = hints.map((hint) => hint.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("11 — buildDeclarativeSnapshot lit baseProfile et profile", () => {
    const declarative = buildDeclarativeSnapshot(
      baseInput().baseProfile,
      baseInput().profile,
      true,
    );
    expect(declarative.sleepNeededHours).toBe(8);
    expect(declarative.bedTime).toBe("23:00");
  });

  it("12 — événements hors fenêtre ignorés (UTC)", () => {
    const summary = aggregateBehaviorSignals({
      referenceDate: REFERENCE_DATE,
      windowDays: 7,
      events: [event("skipped", "2026-06-01T10:00:00.000Z")],
    });
    expect(summary.counts.total).toBe(0);
  });

  it("13 — insight rejeté exclu des hints living", () => {
    const context = buildLanguageMemoryContext({
      ...baseInput(),
      living: {
        ...baseInput().living!,
        insights: [
          {
            ...baseInput().living!.insights[0],
            status: "rejected",
          },
        ],
        dailyMissionTitle: null,
      },
    });
    const hints = selectLanguageMemoryHints(context);
    expect(hints.some((hint) => hint.type === "living_insight")).toBe(false);
  });
});
