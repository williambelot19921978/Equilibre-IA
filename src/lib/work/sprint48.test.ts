import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildMorningRoutineConstraints } from "../planning/buildMorningRoutineConstraints";
import {
  isMorningSlotBeforeWork,
  resolveMorningWorkoutAutomaticallyAllowed,
} from "../planning/resolveMorningWorkoutAutomaticallyAllowed";
import { shouldAttachSportProposal } from "../planning/sportProposalAttachment";
import { extractEntities } from "../../ai/nlp/entityExtractor";
import { resolveActions } from "../../ai/nlp/actionResolver";
import { detectClarificationNeeded } from "../../ai/nlp/nlpClarification";
import { detectIntent } from "../../ai/nlp/intentEngine";
import { getPeriodBounds } from "../time/periodBounds";
import { aggregateWorkoutStatistics } from "../statistics/aggregateWorkoutStatistics";
import { aggregateStudyStatistics } from "../statistics/aggregateStudyStatistics";
import { aggregateCompletionStatistics } from "../statistics/aggregateCompletionStatistics";
import { getStatisticsForPeriod } from "../statistics/getStatisticsForPeriod";
import type { LifeContext } from "../../types/lifeContext";
import type { PlanningContext } from "../../ai/memoryEngine";
import { AppRoutes } from "../navigation/routes";

function readSrc(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), "src", relativePath), "utf8");
}

function makeLifeContext(overrides: Partial<LifeContext> = {}): LifeContext {
  return {
    date: "2026-07-20",
    dayType: "WORKDAY",
    dayTypeReason: "test",
    workDay: true,
    vacation: false,
    restDay: false,
    travelDay: false,
    familySituation: "normal",
    availableMinutes: 120,
    lockedMinutes: 300,
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
    ...overrides,
  };
}

describe("Sprint 4.8 — matin réaliste, travail, temps libre, stats", () => {
  it("A. petit déjeuner distinct de la préparation enfants", () => {
    const result = buildMorningRoutineConstraints({
      date: "2026-07-20",
      wakeTime: "06:30",
      breakfast: {
        enabled: true,
        durationMinutes: 20,
        mode: "family",
      },
      personalPrepMinutes: 15,
      childrenDepartureTime: "08:00",
      childrenPrepMinutes: 30,
      hasChildren: true,
    });

    const types = result.blocks.map((block) => block.type);
    expect(types).toContain("breakfast");
    expect(types).toContain("personal_prep");
    expect(types).toContain("morning_routine");
    expect(result.blocks.find((block) => block.type === "morning_routine")?.title).toBe(
      "Préparation des enfants",
    );
  });

  it("B. aucun faux créneau libre si routine matin impossible", () => {
    const result = buildMorningRoutineConstraints({
      date: "2026-07-20",
      wakeTime: "07:30",
      breakfast: { enabled: true, durationMinutes: 30, mode: "solo" },
      personalPrepMinutes: 30,
      childrenDepartureTime: "08:00",
      childrenPrepMinutes: 45,
      hasChildren: true,
    });

    expect(result.alerts.length).toBeGreaterThan(0);
    expect(result.blocks.some((block) => block.type === "morning_routine")).toBe(
      false,
    );
  });

  it("C. sport automatique interdit matin workday", () => {
    expect(
      resolveMorningWorkoutAutomaticallyAllowed({
        workDay: true,
        vacation: false,
        restDay: false,
        dayType: "WORKDAY",
        energyPrediction: "high",
      }),
    ).toBe(false);

    expect(
      shouldAttachSportProposal({
        entry: {
          id: "free-1",
          blockKind: "free_slot",
          startsAt: "2026-07-20T07:00:00",
          endsAt: "2026-07-20T07:30:00",
        } as never,
        lifeContext: makeLifeContext(),
        planningContext: { workStart: "09:00" } as PlanningContext,
      }),
    ).toBe(false);
  });

  it("D. sport manuel autorisé matin workday via slot non bloqué après travail", () => {
    expect(
      isMorningSlotBeforeWork({
        slotStartsAt: "2026-07-20T17:30:00",
        workStartTime: "09:00",
        date: "2026-07-20",
      }),
    ).toBe(false);

    expect(
      shouldAttachSportProposal({
        entry: {
          id: "free-2",
          blockKind: "free_slot",
          startsAt: "2026-07-20T17:30:00",
          endsAt: "2026-07-20T18:00:00",
        } as never,
        lifeContext: makeLifeContext({ morningWorkoutAutomaticallyAllowed: false }),
        planningContext: { workStart: "09:00", mainPriority: "sport" } as PlanningContext,
      }),
    ).toBe(true);
  });

  it("E. bloc Temps libre avec un seul bouton principal", () => {
    const timeline = readSrc("components/planning/DayTimeline.tsx");
    expect(timeline).toContain('entry.blockKind !== "free_slot"');
    expect(timeline).toContain("Me proposer une activité");
  });

  it("F. activité acceptée conserve ses actions", () => {
    const timeline = readSrc("components/planning/DayTimeline.tsx");
    expect(timeline).toContain("BlockActionsMenu");
    expect(timeline).toContain('entry.blockKind !== "free_slot"');
  });

  it("G. « demain je ne travaille pas »", () => {
    const entities = extractEntities({
      text: "Finalement demain je ne travaille pas.",
      referenceDate: "2026-07-19",
    });
    expect(entities.workExceptionKind).toBe("cancel");
    const actions = resolveActions({
      parseResult: {
        intent: "modify_work",
        confidence: 0.9,
        entities,
        rawText: "Finalement demain je ne travaille pas.",
      },
      referenceDate: "2026-07-19",
    }).actions;
    expect(actions.some((action) => action.type === "MarkRestDay")).toBe(true);
  });

  it("H. « demain j'ai mon après-midi » demande clarification", () => {
    const entities = extractEntities({
      text: "Demain j'ai mon après-midi.",
      referenceDate: "2026-07-19",
    });
    expect(entities.workExceptionKind).toBe("half_afternoon");
    const clarification = detectClarificationNeeded({
      intent: "modify_work",
      confidence: 0.9,
      entities,
      rawText: "Demain j'ai mon après-midi.",
    });
    expect(clarification.needsClarification).toBe(true);
  });

  it("I. « demain j'ai ma matinée » demande clarification", () => {
    const entities = extractEntities({
      text: "Demain j'ai ma matinée.",
      referenceDate: "2026-07-19",
    });
    expect(entities.workExceptionKind).toBe("half_morning");
    const clarification = detectClarificationNeeded({
      intent: "modify_work",
      confidence: 0.9,
      entities,
      rawText: "Demain j'ai ma matinée.",
    });
    expect(clarification.needsClarification).toBe(true);
  });

  it("J. travail seulement 8 h–12 h", () => {
    const entities = extractEntities({
      text: "Je travaille seulement de 8 h à 12 h demain.",
      referenceDate: "2026-07-19",
    });
    expect(entities.workTimeStart).toBeTruthy();
    expect(entities.workTimeEnd).toBeTruthy();
    const actions = resolveActions({
      parseResult: {
        intent: detectIntent("Je travaille seulement de 8 h à 12 h demain.").intent,
        confidence: 0.9,
        entities,
        rawText: "Je travaille seulement de 8 h à 12 h demain.",
      },
      referenceDate: "2026-07-19",
    }).actions;
    expect(actions.some((action) => action.type === "MarkWorkDay")).toBe(true);
  });

  it("K. clarification si horaire absent", () => {
    const clarification = detectClarificationNeeded({
      intent: "modify_work",
      confidence: 0.9,
      entities: extractEntities({
        text: "Demain j'ai mon après-midi.",
        referenceDate: "2026-07-19",
      }),
      rawText: "Demain j'ai mon après-midi.",
    });
    expect(clarification.needsClarification).toBe(true);
    expect(clarification.message).toMatch(/matinée de travail/i);
  });

  it("L. statistiques semaine", () => {
    const bounds = getPeriodBounds("2026-07-20", "week");
    expect(bounds.period).toBe("week");
    const stats = getStatisticsForPeriod({
      referenceDate: "2026-07-20",
      period: "week",
      calendarItems: [],
      taskActivityEvents: [],
      checkins: [],
    });
    expect(stats.period).toBe("week");
  });

  it("M. statistiques mois", () => {
    const stats = getStatisticsForPeriod({
      referenceDate: "2026-07-20",
      period: "month",
      calendarItems: [],
      taskActivityEvents: [],
      checkins: [],
    });
    expect(stats.period).toBe("month");
    expect(stats.label).toContain("07");
  });

  it("N. statistiques année", () => {
    const stats = getStatisticsForPeriod({
      referenceDate: "2026-07-20",
      period: "year",
      calendarItems: [],
      taskActivityEvents: [],
      checkins: [],
    });
    expect(stats.period).toBe("year");
    expect(stats.label).toBe("2026");
  });

  it("O. temps couru", () => {
    const stats = aggregateWorkoutStatistics({
      events: [
        {
          id: "e1",
          household_id: "h",
          user_id: "u",
          task_id: null,
          calendar_item_id: "c1",
          event_type: "completed",
          occurred_at: "2026-07-20T08:00:00",
          metadata: {
            workoutCompleted: true,
            sportType: "running",
            durationCompleted: 30,
          },
          created_at: "",
        },
      ],
      calendarItems: [],
    });
    expect(stats.runningMinutes).toBe(30);
    expect(stats.completedSessions).toBe(1);
  });

  it("P. temps révisé planifié vs effectué", () => {
    const stats = aggregateStudyStatistics({
      periodStart: "2026-07-20T00:00:00",
      periodEnd: "2026-07-20T23:59:59",
      calendarItems: [
        {
          id: "ci-1",
          household_id: "h",
          user_id: "u",
          task_id: null,
          title: "Révision",
          item_type: "task",
          starts_at: "2026-07-20T20:30:00",
          ends_at: "2026-07-20T21:00:00",
          locked: true,
          source: "user",
          details: { businessType: "study", activityType: "revision" },
          created_at: "",
          updated_at: "",
        },
      ],
      taskActivityEvents: [
        {
          id: "evt-1",
          household_id: "h",
          user_id: "u",
          task_id: null,
          calendar_item_id: "ci-1",
          event_type: "completed",
          occurred_at: "2026-07-20T21:00:00",
          metadata: { studySession: true, durationCompleted: 28 },
          created_at: "",
        },
      ],
      studyWeeklyHours: 4,
    });

    expect(stats.plannedMinutes).toBe(30);
    expect(stats.completedMinutes).toBe(28);
  });

  it("Q. aucune double comptabilisation", () => {
    const stats = aggregateStudyStatistics({
      periodStart: "2026-07-20T00:00:00",
      periodEnd: "2026-07-20T23:59:59",
      calendarItems: [
        {
          id: "ci-1",
          household_id: "h",
          user_id: "u",
          task_id: null,
          title: "Révision",
          item_type: "task",
          starts_at: "2026-07-20T20:30:00",
          ends_at: "2026-07-20T21:00:00",
          locked: true,
          source: "user",
          details: { businessType: "study", status: "completed" },
          created_at: "",
          updated_at: "",
        },
      ],
      taskActivityEvents: [
        {
          id: "evt-1",
          household_id: "h",
          user_id: "u",
          task_id: null,
          calendar_item_id: "ci-1",
          event_type: "completed",
          occurred_at: "2026-07-20T21:00:00",
          metadata: { studySession: true, durationCompleted: 30 },
          created_at: "",
        },
      ],
    });

    expect(stats.completedMinutes).toBe(30);
  });

  it("R. taux de réalisation", () => {
    const stats = aggregateCompletionStatistics({
      calendarItems: [
        {
          id: "ci-1",
          household_id: "h",
          user_id: "u",
          task_id: null,
          title: "Sport",
          item_type: "task",
          starts_at: "2026-07-20T18:00:00",
          ends_at: "2026-07-20T18:30:00",
          locked: true,
          source: "user",
          details: { userAccepted: true },
          created_at: "",
          updated_at: "",
        },
      ],
      events: [
        {
          id: "evt-1",
          household_id: "h",
          user_id: "u",
          task_id: null,
          calendar_item_id: "ci-1",
          event_type: "completed",
          occurred_at: "2026-07-20T18:30:00",
          metadata: { workoutCompleted: true, durationCompleted: 30 },
          created_at: "",
        },
      ],
    });

    expect(stats.realizationRate).toBe(100);
  });

  it("S. données absentes affichées honnêtement", () => {
    const page = readSrc("pages/StatisticsPage.tsx");
    expect(page).toContain("Pas encore assez de données");
    expect(page).toContain("Non renseignée");
  });

  it("T. route Statistiques visible dans la navigation", () => {
    expect(AppRoutes.STATISTICS).toBe("/statistics");
    const nav = readSrc("lib/navigation/appNavigationItems.ts");
    expect(nav).toContain("Statistiques");
    expect(nav).toContain("AppRoutes.STATISTICS");
    const sidebar = readSrc("components/navigation/AppSidebar.tsx");
    expect(sidebar).toContain("getDesktopSidebarItems");
  });
});
