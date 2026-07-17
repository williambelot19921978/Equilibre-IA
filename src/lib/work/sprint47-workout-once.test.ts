import { describe, expect, it } from "vitest";

import { generateFreeTimeSuggestions } from "../../ai/freeTimeSuggestionEngine";
import { generateLifeProposals } from "../../ai/lifeEngine";
import type { PlanningContext } from "../../ai/memoryEngine";
import {
  attachSportProposalsToTimeline,
  shouldAttachSportProposal,
} from "../planning/sportProposalAttachment";
import {
  confirmAdditionalWorkout,
  hasCompletedWorkoutForDate,
  resolveWorkoutCompletionForDate,
  shouldConfirmAdditionalWorkout,
} from "../planning/hasCompletedWorkoutForDate";
import { generateFreeTimeSuggestionsFromLifeContext } from "../planning/lifeProposalAdapter";
import type { DayTimelineEntry } from "../planning/displayedDayTimeline";
import type { CalendarItemRecord } from "../../types/database";
import type { LifeContext } from "../../types/lifeContext";
import type { TaskActivityEventRecord } from "../../types/taskActivity";

const date = "2026-07-20";
const yesterday = "2026-07-19";
const userId = "user-1";

function freeSlotEntry(minutes: number, hour = 14): DayTimelineEntry {
  const start = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00`);
  const end = new Date(start.getTime() + minutes * 60_000);
  return {
    id: `free-${hour}-${minutes}`,
    visualType: "free",
    title: "Temps libre",
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    locked: false,
    origin: "computed",
    blockKind: "free_slot",
    activityType: "free",
  };
}

function sportItem({
  id,
  day = date,
  completed = true,
  partial = false,
}: {
  id: string;
  day?: string;
  completed?: boolean;
  partial?: boolean;
}): CalendarItemRecord {
  return {
    id,
    household_id: "house-1",
    user_id: userId,
    task_id: null,
    title: "Sport",
    item_type: "task",
    starts_at: `${day}T16:00:00.000Z`,
    ends_at: `${day}T16:30:00.000Z`,
    locked: true,
    source: "user",
    details: {
      businessType: "sport",
      activityType: "workout",
      constraintType: "sport",
      sportType: "renforcement",
      workoutSession: { type: "renforcement", status: completed ? "completed" : "planned" },
      ...(completed
        ? {
            status: "completed",
            actual_completed_at: `${day}T16:25:00.000Z`,
            completion_timing: partial ? "on_time" : "early",
          }
        : {}),
    },
    created_at: `${day}T08:00:00.000Z`,
    updated_at: `${day}T16:25:00.000Z`,
  };
}

function makeLifeContext(overrides: Partial<LifeContext> = {}): LifeContext {
  return {
    date,
    dayType: "WORKDAY",
    dayTypeReason: "Journée de travail",
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
    priority: "sport",
    reasoning: [],
    freeSlots: [
      {
        id: "slot-1",
        startsAt: `${date}T14:00:00.000Z`,
        endsAt: `${date}T15:00:00.000Z`,
        durationMinutes: 60,
        slotKind: "day",
        score: 80,
        scoreReason: "Créneau favorable",
      },
    ],
    proposals: [
      {
        id: "sport-1",
        category: "sport",
        title: "Séance courte",
        description: "Sport",
        durationMinutes: 20,
        reason: "Bouger",
        priority: "medium",
      },
      {
        id: "calm-1",
        category: "calm",
        title: "Temps calme",
        description: "Repos",
        durationMinutes: 15,
        reason: "Pause",
        priority: "medium",
      },
    ],
    maxFillRatio: 0.8,
    ...overrides,
  };
}

function minimalPlanningContext(
  lifeContext: LifeContext,
): PlanningContext {
  return {
    targetDate: date,
    currentUserId: userId,
    householdId: "house-1",
    childrenCount: 1,
    workStart: "09:00",
    workEnd: "17:00",
    bedTime: "23:00",
    wakeTime: "07:00",
    mainPriority: "sport",
    eveningPlanningMode: "suggestions_only",
    profile: {
      afterWorkEnergy: "medium",
      studiesActive: true,
      faithImportance: "disabled",
      restPreferences: [],
      sportMinimumMinutes: 15,
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

describe("Correctif — une seule séance sportive proposée par jour", () => {
  it("A. aucune séance réalisée → sport proposé", () => {
    expect(
      shouldAttachSportProposal({
        entry: freeSlotEntry(30),
        lifeContext: makeLifeContext(),
      }),
    ).toBe(true);
  });

  it("B. séance terminée → plus de sport proposé", () => {
    const items = [sportItem({ id: "sport-done" })];
    expect(
      hasCompletedWorkoutForDate({ userId, date, calendarItems: items }),
    ).toBe(true);

    const timeline = attachSportProposalsToTimeline({
      entries: [freeSlotEntry(30), freeSlotEntry(30, 17)],
      lifeContext: makeLifeContext({
        workoutCompletedToday: true,
        sportPossible: false,
        proposals: [],
      }),
    });

    expect(timeline.every((entry) => !entry.proposedWorkoutSession)).toBe(true);
  });

  it("C. séance terminée en avance → plus de sport proposé", () => {
    const summary = resolveWorkoutCompletionForDate({
      userId,
      date,
      calendarItems: [sportItem({ id: "sport-early" })],
    });
    expect(summary.workoutCompletedToday).toBe(true);
    expect(summary.workoutMinutesCompletedToday).toBeGreaterThan(0);
  });

  it("D. séance manuelle terminée → plus de sport proposé", () => {
    const manual = sportItem({ id: "manual-sport" });
    expect(
      hasCompletedWorkoutForDate({ userId, date, calendarItems: [manual] }),
    ).toBe(true);
  });

  it("E. séance partielle considérée suffisante → plus de sport proposé", () => {
    const partialItem = sportItem({ id: "partial", partial: true });
    const event: TaskActivityEventRecord = {
      id: "evt-1",
      household_id: "house-1",
      user_id: userId,
      task_id: null,
      calendar_item_id: partialItem.id,
      event_type: "completed",
      occurred_at: `${date}T16:20:00.000Z`,
      metadata: { partialCompletion: true, durationCompleted: 12 },
      created_at: `${date}T16:20:00.000Z`,
    };

    expect(
      hasCompletedWorkoutForDate({
        userId,
        date,
        calendarItems: [partialItem],
        taskActivityEvents: [event],
      }),
    ).toBe(true);
  });

  it("F. séance annulée → sport peut encore être proposé", () => {
    const cancelled = sportItem({ id: "cancelled", completed: false });
    expect(
      hasCompletedWorkoutForDate({ userId, date, calendarItems: [cancelled] }),
    ).toBe(false);
    expect(
      shouldAttachSportProposal({
        entry: freeSlotEntry(30),
        lifeContext: makeLifeContext(),
      }),
    ).toBe(true);
  });

  it("G. séance réalisée hier → sport possible aujourd'hui", () => {
    expect(
      hasCompletedWorkoutForDate({
        userId,
        date,
        calendarItems: [sportItem({ id: "yesterday", day: yesterday })],
      }),
    ).toBe(false);
  });

  it("H. ajout manuel d'une deuxième séance après confirmation", () => {
    expect(shouldConfirmAdditionalWorkout(true)).toBe(true);
    expect(shouldConfirmAdditionalWorkout(false)).toBe(false);
    expect(confirmAdditionalWorkout(false)).toBe(true);
  });

  it("I. suppression immédiate des suggestions sport après terminaison", () => {
    const proposals = generateLifeProposals({
      lifeContext: makeLifeContext({
        workoutCompletedToday: true,
        sportPossible: false,
      }),
      context: minimalPlanningContext(
        makeLifeContext({ workoutCompletedToday: true, sportPossible: false }),
      ),
    });

    expect(proposals.some((proposal) => proposal.category === "sport")).toBe(false);
    expect(
      proposals.some(
        (proposal) =>
          proposal.category !== "keep_free" && proposal.category !== "sport",
      ),
    ).toBe(true);
  });

  it("J. persistance après F5 via calendar_items.details", () => {
    const persisted = sportItem({ id: "persisted" });
    const details = persisted.details ?? {};
    expect(details.status).toBe("completed");
    expect(details.actual_completed_at).toBeTruthy();
    expect(
      hasCompletedWorkoutForDate({ userId, date, calendarItems: [persisted] }),
    ).toBe(true);
  });

  it("K. autres suggestions toujours disponibles", () => {
    const lifeContext = makeLifeContext({
      workoutCompletedToday: true,
      sportPossible: false,
    });

    const suggestions = generateFreeTimeSuggestionsFromLifeContext({
      slot: {
        id: "slot-1",
        startsAt: `${date}T14:00:00.000Z`,
        endsAt: `${date}T15:00:00.000Z`,
        durationMinutes: 60,
      },
      lifeContext,
    });

    expect(suggestions.some((item) => item.type === "sport")).toBe(false);
    expect(suggestions.some((item) => item.type === "calm")).toBe(true);

    const legacy = generateFreeTimeSuggestions({
      slot: {
        id: "slot-2",
        startsAt: `${date}T15:00:00.000Z`,
        endsAt: `${date}T16:00:00.000Z`,
        durationMinutes: 45,
      },
      date,
      planningContext: minimalPlanningContext(lifeContext),
    });

    expect(legacy.some((item) => item.type === "sport")).toBe(false);
    expect(legacy.some((item) => item.type === "calm")).toBe(true);
  });
});
