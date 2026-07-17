import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { reasonAboutLifeProposal } from "../../ai/reasoning/lifeReasoner";
import { buildHabitProfileFromHistory } from "../../ai/habits/buildHabitProfile";
import { generateWeeklyReview, isWeeklyReviewDay } from "../../ai/reasoning/weeklyReviewEngine";
import { generateProactiveCoachMessage } from "../../ai/coach/proactiveCoachEngine";
import { computeBalanceScore, computeStatisticsTrends } from "../../lib/statistics/computeBalanceAndTrends";
import { getStatisticsForPeriod } from "../../lib/statistics/getStatisticsForPeriod";
import type { LifeProposal } from "../../types/lifeContext";
import type { LifeContext } from "../../types/lifeContext";

function readSrc(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), "src", relativePath), "utf8");
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
    workoutCompletedToday: true,
    workoutMinutesCompletedToday: 30,
    workoutTypeCompletedToday: "run",
    priority: null,
    reasoning: [],
    freeSlots: [],
    proposals: [],
    maxFillRatio: 0.8,
  };
}

const studyProposal: LifeProposal = {
  id: "study-1",
  category: "study",
  title: "Révision",
  description: "Session courte",
  durationMinutes: 30,
  reason: "Tu n'as pas encore révisé aujourd'hui.",
  priority: "high",
};

describe("Sprint 5.0 — coach explicable", () => {
  it("A. lifeReasoner existe", () => {
    expect(readSrc("ai/reasoning/lifeReasoner.ts")).toContain("reasonAboutLifeProposal");
  });

  it("B. LifeDecision avec confiance et explication", () => {
    const decision = reasonAboutLifeProposal({
      proposal: studyProposal,
      lifeContext: baseLifeContext(),
      slot: {
        id: "slot-1",
        startsAt: "2026-07-20T19:00:00",
        endsAt: "2026-07-20T20:30:00",
        durationMinutes: 90,
        slotKind: "evening_available",
        score: 80,
        scoreReason: "Soirée libre",
      },
      statistics: getStatisticsForPeriod({
        referenceDate: "2026-07-20",
        period: "week",
        calendarItems: [],
        taskActivityEvents: [],
        checkins: [],
        studyWeeklyHours: 5,
      }),
    });

    expect(decision.confidence).toBeGreaterThan(0);
    expect(decision.explanation.fullText).toMatch(/révision/i);
    expect(decision.factors.length).toBeGreaterThan(0);
  });

  it("C. propositions passent par slotActivitySuggestionEngine", () => {
    expect(readSrc("lib/planning/slotActivitySuggestionEngine.ts")).toContain(
      "reasonAboutProposals",
    );
  });

  it("D. HabitProfile construit depuis historique", () => {
    const profile = buildHabitProfileFromHistory({
      userId: "u1",
      calendarItems: [],
      taskActivityEvents: [
        {
          id: "1",
          household_id: "h",
          user_id: "u1",
          task_id: null,
          calendar_item_id: null,
          event_type: "completed",
          occurred_at: "2026-07-20T08:30:00",
          metadata: { businessType: "study", title: "Révision" },
          created_at: "",
        },
        {
          id: "2",
          household_id: "h",
          user_id: "u1",
          task_id: null,
          calendar_item_id: null,
          event_type: "completed",
          occurred_at: "2026-07-21T09:00:00",
          metadata: { businessType: "study", title: "Révision" },
          created_at: "",
        },
      ],
    });

    expect(profile.insights.some((item) => item.kind === "revision_morning")).toBe(
      true,
    );
  });

  it("E. page Mon IA", () => {
    expect(readSrc("pages/MyAiPage.tsx")).toContain("Ce que j'ai appris");
    expect(readSrc("lib/navigation/appNavigationItems.ts")).toContain("Mon IA");
  });

  it("F. feedback Exact / Faux", () => {
    expect(readSrc("pages/MyAiPage.tsx")).toContain("Exact");
    expect(readSrc("services/habitProfileService.ts")).toContain(
      "saveHabitInsightFeedback",
    );
  });

  it("G. WeeklyReviewEngine", () => {
    const stats = getStatisticsForPeriod({
      referenceDate: "2026-07-20",
      period: "week",
      calendarItems: [],
      taskActivityEvents: [],
      checkins: [],
      studyWeeklyHours: 5,
    });
    const review = generateWeeklyReview(stats);
    expect(review.successes.length).toBe(3);
    expect(review.advice.length).toBe(3);
    expect(review.priority).toBeTruthy();
  });

  it("H. bilan dimanche", () => {
    expect(isWeeklyReviewDay("2026-07-19")).toBe(true);
  });

  it("I. statistiques enrichies balance + trends", () => {
    const stats = getStatisticsForPeriod({
      referenceDate: "2026-07-20",
      period: "week",
      calendarItems: [],
      taskActivityEvents: [],
      checkins: [],
    });
    const balance = computeBalanceScore(stats);
    const trends = computeStatisticsTrends(stats);
    expect(balance.globalScore).toBeGreaterThanOrEqual(0);
    expect(trends.regularityScore).toBeGreaterThanOrEqual(0);
  });

  it("J. StatisticsPage affiche équilibre", () => {
    expect(readSrc("pages/StatisticsPage.tsx")).toContain("Tableau de bord équilibre");
  });

  it("K. proactive coach matin", () => {
    const message = generateProactiveCoachMessage({
      firstName: "William",
      referenceDate: "2026-07-20",
      hour: 8,
      lifeContext: baseLifeContext(),
    });
    expect(message?.greeting).toMatch(/Bonjour William/);
  });

  it("L. proactive coach soir", () => {
    const message = generateProactiveCoachMessage({
      firstName: "William",
      referenceDate: "2026-07-20",
      hour: 20,
      lifeContext: baseLifeContext(),
    });
    expect(message?.greeting).toMatch(/Bonsoir William/);
  });

  it("M. confiance visible dans modal suggestion", () => {
    expect(readSrc("components/planning/FreeTimeSuggestionModal.tsx")).toContain(
      "suggestion.confidence",
    );
  });

  it("N. explication jamais imposer", () => {
    const decision = reasonAboutLifeProposal({
      proposal: studyProposal,
      lifeContext: baseLifeContext(),
    });
    expect(decision.explanation.fullText).toMatch(/libre d'accepter/i);
  });
});
