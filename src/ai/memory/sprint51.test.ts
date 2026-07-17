import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildLivingMemory } from "../../ai/memory/livingMemoryEngine";
import { buildLivingHabitProfile } from "../../ai/memory/buildLivingHabitProfile";
import { detectHabitTrends } from "../../ai/memory/habitTrendEngine";
import {
  applyLivingInsightFeedback,
  partitionInsights,
} from "../../ai/memory/generateLivingInsights";
import {
  resolveAdaptiveSportDuration,
  buildAdaptiveSuggestions,
} from "../../ai/memory/adaptiveDurationEngine";
import {
  computeKnowledgeScore,
  resolveKnowledgeLevel,
  resolveCoachPersonality,
} from "../../ai/memory/knowledgeLevelEngine";
import { generateDailyMission } from "../../ai/memory/dailyMissionEngine";
import { generateWeeklyMission } from "../../ai/memory/weeklyMissionEngine";
import { getStatisticsForPeriod } from "../../lib/statistics/getStatisticsForPeriod";
import type { LifeContext } from "../../types/lifeContext";
import type { TaskActivityEventRecord } from "../../types/taskActivity";

function readSrc(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), "src", relativePath), "utf8");
}

function sportEvent(at: string, extra: Record<string, unknown> = {}): TaskActivityEventRecord {
  return {
    id: `sport-${at}`,
    household_id: "h1",
    user_id: "u1",
    task_id: null,
    calendar_item_id: null,
    event_type: "completed",
    occurred_at: at,
    metadata: { workoutCompleted: true, category: "sport", ...extra },
    created_at: at,
  };
}

function studyEvent(at: string): TaskActivityEventRecord {
  return sportEvent(at, { businessType: "study", title: "Révision" });
}

function cancelledEvent(at: string): TaskActivityEventRecord {
  return {
    ...sportEvent(at),
    id: `cancel-${at}`,
    event_type: "cancelled",
  };
}

function baseLifeContext(): LifeContext {
  return {
    date: "2026-07-20",
    dayType: "WORKDAY",
    dayTypeReason: "Journée travaillée",
    workDay: true,
    vacation: false,
    restDay: false,
    travelDay: false,
    familySituation: "normal",
    availableMinutes: 120,
    lockedMinutes: 480,
    energyPrediction: "medium",
    childrenPresent: true,
    partnerPresent: true,
    sportPossible: true,
    morningWorkoutAutomaticallyAllowed: false,
    studyPossible: true,
    freeEvening: true,
    workoutCompletedToday: false,
    workoutMinutesCompletedToday: 0,
    workoutTypeCompletedToday: null,
    priority: null,
    reasoning: [],
    freeSlots: [],
    proposals: [],
    maxFillRatio: 0.8,
  };
}

describe("Sprint 5.1 — mémoire vivante", () => {
  it("A. livingMemoryEngine existe", () => {
    expect(readSrc("ai/memory/livingMemoryEngine.ts")).toContain("buildLivingMemory");
  });

  it("B. LivingHabitProfile évolue depuis l'historique", () => {
    const events = [
      sportEvent("2026-07-10T07:30:00", { durationMinutes: 25 }),
      sportEvent("2026-07-12T07:45:00", { durationMinutes: 25 }),
      sportEvent("2026-07-14T08:00:00", { durationMinutes: 30 }),
      studyEvent("2026-07-11T08:30:00"),
      studyEvent("2026-07-13T09:00:00"),
    ];

    const profile = buildLivingHabitProfile({
      calendarItems: [],
      taskActivityEvents: events,
      checkins: [],
    });

    expect(profile.preferredWorkoutDuration?.value).toBe(25);
    expect(profile.preferredStudyTime?.value).toBe("morning");
    expect(profile.averageWorkoutDuration?.sampleSize).toBeGreaterThanOrEqual(2);
  });

  it("C. habitTrendEngine détecte amélioration et dégradation", () => {
    const events = [
      studyEvent("2026-07-01T08:00:00"),
      studyEvent("2026-07-03T08:30:00"),
      studyEvent("2026-07-05T09:00:00"),
      studyEvent("2026-07-10T08:15:00"),
      studyEvent("2026-07-12T08:45:00"),
      cancelledEvent("2026-07-15T21:00:00"),
      cancelledEvent("2026-07-16T21:30:00"),
      cancelledEvent("2026-07-17T20:45:00"),
    ];

    const habitProfile = buildLivingHabitProfile({
      calendarItems: [],
      taskActivityEvents: events,
      checkins: [],
    });

    const trends = detectHabitTrends({
      calendarItems: [],
      taskActivityEvents: events,
      habitProfile,
    });

    expect(trends.some((trend) => trend.direction === "improving")).toBe(true);
    expect(trends.some((trend) => trend.id === "trend-sport-late-evening")).toBe(true);
  });

  it("D. insight faux perd immédiatement en confiance", () => {
    const insights = applyLivingInsightFeedback(
      [
        {
          id: "test",
          category: "sport",
          label: "sport le matin",
          detail: "Test",
          reasoning: "Test",
          evidence: ["1"],
          confidence: 80,
          firstSeen: "2026-07-01T00:00:00",
          lastConfirmed: "2026-07-01T00:00:00",
          evidenceCount: 3,
          status: "learned",
        },
      ],
      "test",
      "rejected",
    );

    expect(insights).toHaveLength(0);
  });

  it("E. validation utilisateur confirm augmente la confiance", () => {
    const [updated] = applyLivingInsightFeedback(
      [
        {
          id: "test",
          category: "study",
          label: "réviser le matin",
          detail: "Test",
          reasoning: "Test",
          evidence: ["2"],
          confidence: 60,
          firstSeen: "2026-07-01T00:00:00",
          lastConfirmed: "2026-07-01T00:00:00",
          evidenceCount: 2,
          status: "learned",
        },
      ],
      "test",
      "confirmed",
    );

    expect(updated?.confidence).toBeGreaterThan(60);
    expect(updated?.status).toBe("confirmed");
  });

  it("F. niveau de connaissance progresse avec les données", () => {
    const sparse = resolveKnowledgeLevel({
      dataPointCount: 5,
      accountAgeDays: 3,
      confirmedInsights: 0,
      insights: [],
    });
    const rich = resolveKnowledgeLevel({
      dataPointCount: 80,
      accountAgeDays: 90,
      confirmedInsights: 4,
      insights: [
        {
          id: "1",
          category: "sport",
          label: "test",
          detail: "test",
          reasoning: "test",
          evidence: [],
          confidence: 85,
          firstSeen: "",
          lastConfirmed: "",
          evidenceCount: 5,
          status: "confirmed",
        },
      ],
    });

    expect(sparse.id).toBe("starting");
    expect(rich.score).toBeGreaterThan(sparse.score);
    expect(resolveCoachPersonality(rich)).toMatch(/anticiper|connais/i);
  });

  it("G. une seule mission du jour", () => {
    const events = [sportEvent("2026-07-19T07:00:00")];
    const memory = buildLivingMemory({
      userId: "u1",
      referenceDate: "2026-07-20",
      calendarItems: [],
      taskActivityEvents: events,
      checkins: [],
      lifeContext: baseLifeContext(),
      accountAgeDays: 14,
    });

    expect(memory.dailyMission).not.toBeNull();
    expect(memory.dailyMission?.title).toBe("Mission du jour");
  });

  it("H. mission hebdomadaire facultative", () => {
    const events = [
      sportEvent("2026-07-14T07:00:00"),
      sportEvent("2026-07-16T07:00:00"),
    ];
    const statistics = getStatisticsForPeriod({
      referenceDate: "2026-07-20",
      period: "week",
      calendarItems: [],
      taskActivityEvents: events,
      checkins: [],
      studyWeeklyHours: 4,
    });

    const habitProfile = buildLivingHabitProfile({
      calendarItems: [],
      taskActivityEvents: events,
      checkins: [],
    });

    const weekly = generateWeeklyMission({
      referenceDate: "2026-07-20",
      habitProfile,
      trends: [],
      statistics,
    });

    expect(weekly?.optional).toBe(true);
    expect(weekly?.title).toMatch(/facultative/i);
  });

  it("I. adaptation automatique des durées sport", () => {
    const profile = buildLivingHabitProfile({
      calendarItems: [],
      taskActivityEvents: [
        sportEvent("2026-07-10T07:00:00", { durationMinutes: 25 }),
        sportEvent("2026-07-12T07:00:00", { durationMinutes: 25 }),
      ],
      checkins: [],
    });

    expect(resolveAdaptiveSportDuration(profile, 25)).toBe(25);
    const suggestions = buildAdaptiveSuggestions(profile);
    expect(suggestions.some((item) => item.domain === "sport")).toBe(true);
  });

  it("J. partition insights récemment / incertain", () => {
    const parts = partitionInsights([
      {
        id: "a",
        category: "sport",
        label: "a",
        detail: "a",
        reasoning: "a",
        evidence: [],
        confidence: 82,
        firstSeen: "",
        lastConfirmed: "",
        evidenceCount: 4,
        status: "learned",
      },
      {
        id: "b",
        category: "study",
        label: "b",
        detail: "b",
        reasoning: "b",
        evidence: [],
        confidence: 40,
        firstSeen: "",
        lastConfirmed: "",
        evidenceCount: 1,
        status: "learned",
      },
    ]);

    expect(parts.recentlyLearned).toHaveLength(1);
    expect(parts.uncertain).toHaveLength(1);
  });

  it("K. buildLivingMemory produit insights avec preuves", () => {
    const memory = buildLivingMemory({
      userId: "u1",
      referenceDate: "2026-07-20",
      calendarItems: [],
      taskActivityEvents: [
        studyEvent("2026-07-18T08:00:00"),
        studyEvent("2026-07-19T08:30:00"),
        cancelledEvent("2026-07-19T21:00:00"),
        cancelledEvent("2026-07-18T21:30:00"),
      ],
      checkins: [
        {
          id: "c1",
          user_id: "u1",
          household_id: "h1",
          checkin_date: "2026-07-19",
          energy_level: "high",
          fatigue_level: "low",
          stress_level: "low",
          mood: "good",
          intensity: 4,
          note: null,
          created_at: "",
          updated_at: "",
        },
      ],
      accountAgeDays: 30,
    });

    expect(memory.insights.length).toBeGreaterThan(0);
    expect(memory.insights[0]?.evidence.length).toBeGreaterThan(0);
    expect(memory.globalConfidence).toBeGreaterThan(0);
    expect(memory.knowledgeLevel.label).toBeTruthy();
  });

  it("L. dailyMissionEngine priorise repos si fatigue", () => {
    const mission = generateDailyMission({
      referenceDate: "2026-07-20",
      lifeContext: { ...baseLifeContext(), energyPrediction: "low" },
      habitProfile: {},
      insights: [],
      trends: [],
      checkins: [
        {
          id: "c1",
          user_id: "u1",
          household_id: "h1",
          checkin_date: "2026-07-20",
          energy_level: "low",
          fatigue_level: "high",
          stress_level: "medium",
          mood: "tired",
          intensity: 2,
          note: null,
          created_at: "",
          updated_at: "",
        },
      ],
    });

    expect(mission?.category).toBe("rest");
  });

  it("M. score connaissance augmente avec confirmations", () => {
    const base = computeKnowledgeScore({
      dataPointCount: 20,
      accountAgeDays: 14,
      confirmedInsights: 0,
      insights: [],
    });
    const confirmed = computeKnowledgeScore({
      dataPointCount: 20,
      accountAgeDays: 14,
      confirmedInsights: 3,
      insights: [],
    });

    expect(confirmed).toBeGreaterThan(base);
  });

  it("N. fichiers Sprint 5.1 présents", () => {
    expect(readSrc("ai/memory/habitTrendEngine.ts")).toContain("detectHabitTrends");
    expect(readSrc("ai/memory/dailyMissionEngine.ts")).toContain("generateDailyMission");
    expect(readSrc("ai/memory/weeklyMissionEngine.ts")).toContain("generateWeeklyMission");
    expect(readSrc("pages/MyAiPage.tsx")).toContain("Ce que j'apprends encore");
    expect(readSrc("services/livingMemoryService.ts")).toContain("loadLivingMemory");
  });
});
