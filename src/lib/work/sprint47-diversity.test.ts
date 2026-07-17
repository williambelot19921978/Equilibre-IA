import { describe, expect, it } from "vitest";

import { generateWorkoutSession } from "../../ai/workoutGenerationEngine";
import { MAX_SLOT_SUGGESTIONS } from "../../config/activityRepeatRules";
import { adaptWorkoutSessionDuration } from "../planning/adaptWorkoutSessionDuration";
import {
  canProposeCategoryAutomatically,
  resolveDailyActivityUsage,
} from "../planning/dailyActivityCompletionState";
import { generateFreeTimeSuggestionsFromLifeContext } from "../planning/lifeProposalAdapter";
import {
  resolveRecommendedSportDuration,
  snapSportDuration,
  sportDurationOptionsForType,
} from "../planning/resolveSportDuration";
import { generateSlotActivitySuggestions } from "../planning/slotActivitySuggestionEngine";
import type { PlanningContext } from "../../ai/memoryEngine";
import type { LifeContext } from "../../types/lifeContext";

const date = "2026-07-20";

function makeLifeContext(overrides: Partial<LifeContext> = {}): LifeContext {
  return {
    date,
    dayType: "WORKDAY",
    dayTypeReason: "test",
    workDay: true,
    vacation: false,
    restDay: false,
    travelDay: false,
    familySituation: "normal",
    availableMinutes: 180,
    lockedMinutes: 600,
    energyPrediction: "medium",
    childrenPresent: true,
    partnerPresent: true,
    sportPossible: true,
    studyPossible: true,
    freeEvening: true,
    workoutCompletedToday: false,
    workoutMinutesCompletedToday: 0,
    workoutTypeCompletedToday: null,
    priority: "studies",
    reasoning: [],
    freeSlots: [],
    proposals: [],
    maxFillRatio: 0.8,
    ...overrides,
  };
}

function makeContext(lifeContext: LifeContext): PlanningContext {
  return {
    targetDate: date,
    currentUserId: "user-1",
    householdId: "house-1",
    childrenCount: 1,
    workStart: "09:00",
    workEnd: "17:00",
    bedTime: "23:00",
    wakeTime: "07:00",
    mainPriority: "studies",
    eveningPlanningMode: "suggestions_only",
    profile: {
      afterWorkEnergy: "medium",
      studiesActive: true,
      faithImportance: "important",
      restPreferences: ["lecture"],
      preferredFocusMinutes: 25,
    },
    familyContext: {
      activePeriods: [],
      unavailableUserIds: [],
      maxFillRatio: 0.8,
      onlyMicroTasks: false,
      userVacation: false,
      childrenVacation: false,
      childSick: false,
      childcareMode: null,
    },
    lifeContext,
  } as PlanningContext;
}

function makeUsage(overrides: Partial<ReturnType<typeof baseUsage>> = {}) {
  return { ...baseUsage(), ...overrides };
}

function baseUsage() {
  return {
    workoutDone: false,
    studyDone: false,
    spiritualDone: false,
    familyTimeDone: false,
    coupleTimeDone: false,
    restDone: false,
    priorityTaskDone: false,
    sportAutomaticCount: 0,
    studyCount: 0,
    lastStudyAt: null,
    readingCount: 0,
    calmCount: 0,
    lastCalmAt: null,
    spiritualCount: 0,
    coupleCount: 0,
    familyCount: 0,
    leisureCount: 0,
    restCount: 0,
  };
}

const slot = {
  id: "slot-1",
  startsAt: `${date}T14:00:00.000Z`,
  endsAt: `${date}T15:00:00.000Z`,
  durationMinutes: 60,
  slotKind: "day" as const,
};

describe("Correctif — suggestions diversifiées & durées sport", () => {
  it("A. révision proposée même si déjà faite une fois", () => {
    const usage = makeUsage({ studyCount: 1, lastStudyAt: `${date}T09:00:00.000Z` });
    expect(
      canProposeCategoryAutomatically({
        category: "study",
        usage,
        slotStartsAt: slot.startsAt,
      }),
    ).toBe(true);
  });

  it("B. deuxième révision autorisée", () => {
    const usage = makeUsage({ studyCount: 1, lastStudyAt: `${date}T09:00:00.000Z` });
    const proposals = generateSlotActivitySuggestions({
      slot,
      lifeContext: makeLifeContext(),
      context: makeContext(makeLifeContext()),
      usage,
    });
    expect(proposals.some((item) => item.category === "study")).toBe(true);
  });

  it("C. sport non proposé après séance réalisée", () => {
    const usage = makeUsage({ workoutDone: true, sportAutomaticCount: 1 });
    const proposals = generateSlotActivitySuggestions({
      slot,
      lifeContext: makeLifeContext({ sportPossible: false, workoutCompletedToday: true }),
      context: makeContext(makeLifeContext()),
      usage,
    });
    expect(proposals.some((item) => item.category === "sport")).toBe(false);
  });

  it("D. moment en couple proposé si conjoint présent", () => {
    const eveningSlot = {
      ...slot,
      id: "evening",
      startsAt: `${date}T20:30:00.000Z`,
      endsAt: `${date}T23:30:00.000Z`,
      durationMinutes: 180,
      slotKind: "evening_available" as const,
    };
    const proposals = generateSlotActivitySuggestions({
      slot: eveningSlot,
      lifeContext: makeLifeContext({ partnerPresent: true }),
      context: makeContext(makeLifeContext()),
      usage: makeUsage(),
    });
    expect(proposals.some((item) => item.category === "couple")).toBe(true);
  });

  it("E. options multiples affichées", () => {
    const proposals = generateSlotActivitySuggestions({
      slot,
      lifeContext: makeLifeContext(),
      context: makeContext(makeLifeContext()),
      usage: makeUsage(),
    });
    const activities = proposals.filter((item) => item.category !== "keep_free");
    expect(activities.length).toBeGreaterThan(1);
  });

  it("F. maximum 5 suggestions", () => {
    const proposals = generateSlotActivitySuggestions({
      slot,
      lifeContext: makeLifeContext(),
      context: makeContext(makeLifeContext()),
      usage: makeUsage(),
    });
    expect(proposals.length).toBeLessThanOrEqual(MAX_SLOT_SUGGESTIONS);
  });

  it("G. sport 10 min", () => {
    expect(snapSportDuration(10, "full_body")).toBe(10);
  });

  it("H. sport 25 min", () => {
    expect(snapSportDuration(25, "mobility")).toBe(25);
  });

  it("I. sport 40 min", () => {
    expect(snapSportDuration(40, "full_body")).toBe(40);
  });

  it("J. course minimum 20 min", () => {
    expect(snapSportDuration(10, "run")).toBe(20);
  });

  it("K. course 30/40/50/60", () => {
    expect(snapSportDuration(30, "run")).toBe(30);
    expect(snapSportDuration(40, "run")).toBe(40);
    expect(snapSportDuration(50, "run")).toBe(50);
    expect(snapSportDuration(60, "run")).toBe(60);
  });

  it("L. adaptation 20 → 30 min par ajout de rounds", () => {
    const base = generateWorkoutSession({
      durationMinutes: 20,
      type: "full_body",
      slotHour: 16,
      level: "intermediate",
    });
    const initialRounds = base.blocks[0]?.rounds ?? 0;
    const adapted = adaptWorkoutSessionDuration(base, 30);
    expect(adapted.durationMinutes).toBe(30);
    expect(adapted.blocks[0]?.rounds ?? 0).toBeGreaterThanOrEqual(initialRounds);
    expect(adapted.type).toBe(base.type);
  });

  it("M. adaptation 20 → 40 min cohérente", () => {
    const base = generateWorkoutSession({
      durationMinutes: 20,
      type: "full_body",
      slotHour: 16,
      level: "intermediate",
    });
    const adapted = adaptWorkoutSessionDuration(base, 40);
    expect(adapted.durationMinutes).toBe(40);
    expect(adapted.type).toBe(base.type);
    expect(adapted.warmup.length).toBeGreaterThan(0);
  });

  it("N. durée exacte respectée", () => {
    const session = generateWorkoutSession({
      durationMinutes: 35,
      type: "core",
      slotHour: 15,
      level: "intermediate",
    });
    expect(session.durationMinutes).toBe(35);
  });

  it("O. pas de séance plus longue que le créneau", () => {
    const duration = resolveRecommendedSportDuration({
      slotMinutes: 25,
      energy: "medium",
      type: "full_body",
    });
    expect(duration).toBeLessThanOrEqual(25);
    expect(sportDurationOptionsForType("full_body", 25)).not.toContain(40);
  });

  it("P. alternatives autres que sport visibles", () => {
    const suggestions = generateFreeTimeSuggestionsFromLifeContext({
      slot,
      lifeContext: makeLifeContext({ sportPossible: false, workoutCompletedToday: true }),
      planningContext: makeContext(
        makeLifeContext({ sportPossible: false, workoutCompletedToday: true }),
      ),
    });
    expect(suggestions.some((item) => item.type === "sport")).toBe(false);
    expect(
      suggestions.some(
        (item) => item.type === "study" || item.type === "calm" || item.type === "keep_free",
      ),
    ).toBe(true);
  });
});

describe("resolveDailyActivityUsage", () => {
  it("compte les révisions sans bloquer les suivantes", () => {
    const usage = resolveDailyActivityUsage({
      userId: "user-1",
      date,
      calendarItems: [
        {
          id: "study-1",
          household_id: "h1",
          user_id: "user-1",
          task_id: "t1",
          title: "Révision maths",
          item_type: "task",
          starts_at: `${date}T09:00:00.000Z`,
          ends_at: `${date}T09:30:00.000Z`,
          locked: false,
          source: "user",
          details: {
            suggestionType: "study",
            status: "completed",
            actual_completed_at: `${date}T09:28:00.000Z`,
          },
          created_at: `${date}T08:00:00.000Z`,
          updated_at: `${date}T09:28:00.000Z`,
        },
      ],
    });
    expect(usage.studyCount).toBe(1);
    expect(
      canProposeCategoryAutomatically({
        category: "study",
        usage,
        slotStartsAt: `${date}T14:00:00.000Z`,
      }),
    ).toBe(true);
  });
});
