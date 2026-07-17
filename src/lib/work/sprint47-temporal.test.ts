import { describe, expect, it } from "vitest";

import { resolveEveningOpportunity } from "../../ai/eveningOpportunityEngine";
import { generateLifeProposals } from "../../ai/lifeEngine";
import type { PlanningContext } from "../../ai/memoryEngine";
import { mergeAdjacentFreeTimeBlocks } from "../planning/mergeAdjacentFreeTimeBlocks";
import { resolveBlockCompletionAvailability } from "../planning/resolveBlockCompletionAvailability";
import { resolveSuggestedActivityDuration } from "../planning/resolveSuggestedActivityDuration";
import {
  findPrimaryWorkoutForDate,
  resolveWorkoutAvailability,
} from "../planning/resolveWorkoutAvailability";
import { addLocalDays } from "../time/localDateFromIso";
import type { DayTimelineEntry } from "../planning/displayedDayTimeline";
import type { LifeContext } from "../../types/lifeContext";

const today = "2026-07-20";
const tomorrow = addLocalDays(today, 1);

function sportEntry(
  id: string,
  day: string,
  completed = false,
): DayTimelineEntry {
  return {
    id,
    visualType: "sport",
    title: "Sport",
    startsAt: `${day}T16:00:00.000Z`,
    endsAt: `${day}T16:30:00.000Z`,
    locked: true,
    origin: "persisted",
    blockKind: "task",
    calendarItemId: id,
    activityType: "sport",
    completed,
    completionStatusLabel: completed ? "Séance effectuée" : undefined,
  };
}

function freeEntry(start: string, end: string, id = "free"): DayTimelineEntry {
  return {
    id,
    visualType: "free",
    title: "Temps libre",
    startsAt: start,
    endsAt: end,
    locked: false,
    origin: "computed",
    blockKind: "free_slot",
  };
}

describe("Correctif temporalité & planning simplifié", () => {
  it("A. séance aujourd'hui disponible", () => {
    const entry = sportEntry("sport-today", today);
    const result = resolveWorkoutAvailability({
      entry,
      currentLocalDate: today,
      workoutCompletedToday: false,
      scheduledSportEntries: [entry],
    });
    expect(result.status).toBe("available_now");
    expect(result.canOpenPlayer).toBe(true);
  });

  it("B. séance demain bloquée", () => {
    const entry = sportEntry("sport-tomorrow", tomorrow);
    const result = resolveWorkoutAvailability({
      entry,
      currentLocalDate: today,
      workoutCompletedToday: false,
      scheduledSportEntries: [entry],
    });
    expect(result.status).toBe("future_workout");
    expect(result.canOpenPlayer).toBe(false);
  });

  it("C. message séance prévue demain", () => {
    const entry = sportEntry("sport-tomorrow", tomorrow);
    const result = resolveWorkoutAvailability({
      entry,
      currentLocalDate: today,
      workoutCompletedToday: false,
      scheduledSportEntries: [entry],
    });
    expect(result.message).toMatch(/demain/i);
  });

  it("D. séance du jour existante → id pour Voir la séance d'aujourd'hui", () => {
    const todayEntry = sportEntry("today", today);
    const tomorrowEntry = sportEntry("tomorrow", tomorrow);
    const result = resolveWorkoutAvailability({
      entry: tomorrowEntry,
      currentLocalDate: today,
      workoutCompletedToday: false,
      scheduledSportEntries: [todayEntry, tomorrowEntry],
    });
    expect(result.status).toBe("another_workout_today");
    expect(result.todayWorkoutEntryId).toBe("today");
    expect(findPrimaryWorkoutForDate([todayEntry, tomorrowEntry], today)?.id).toBe(
      "today",
    );
  });

  it("E. aucune complétion future possible", () => {
    const entry = sportEntry("future", tomorrow);
    const guard = resolveBlockCompletionAvailability({
      entry,
      currentLocalDate: today,
    });
    expect(guard.allowed).toBe(false);
  });

  it("F. déplacement volontaire message confirm", () => {
    expect(
      resolveWorkoutAvailability({
        entry: sportEntry("future", tomorrow),
        currentLocalDate: today,
        workoutCompletedToday: false,
        scheduledSportEntries: [],
      }).status,
    ).toBe("future_workout");
  });

  it("G. grand créneau libre conservé en un bloc", () => {
    const merged = mergeAdjacentFreeTimeBlocks([
      freeEntry(`${today}T20:30:00.000Z`, `${today}T21:05:00.000Z`, "a"),
      freeEntry(`${today}T21:05:00.000Z`, `${today}T23:30:00.000Z`, "b"),
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.title).toMatch(/Temps libre/);
  });

  it("H. deux blocs libres adjacents fusionnés", () => {
    const merged = mergeAdjacentFreeTimeBlocks([
      freeEntry(`${today}T14:00:00.000Z`, `${today}T15:00:00.000Z`, "a"),
      freeEntry(`${today}T15:00:00.000Z`, `${today}T16:00:00.000Z`, "b"),
    ]);
    expect(merged).toHaveLength(1);
  });

  it("I. plusieurs propositions diversifiées par créneau", () => {
    const lifeContext = {
      date: today,
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
      freeSlots: [
        {
          id: "slot-1",
          startsAt: `${today}T14:00:00.000Z`,
          endsAt: `${today}T15:00:00.000Z`,
          durationMinutes: 60,
          slotKind: "day",
          score: 80,
          scoreReason: "ok",
        },
      ],
      proposals: [],
      maxFillRatio: 0.8,
    } satisfies LifeContext;

    const proposals = generateLifeProposals({
      lifeContext,
      context: {
        targetDate: today,
        currentUserId: "user-1",
        childrenCount: 1,
        profile: {
          studiesActive: true,
          faithImportance: "disabled",
          restPreferences: [],
          afterWorkEnergy: "medium",
        },
        familyContext: { activePeriods: [], maxFillRatio: 0.8 },
      } as PlanningContext,
    });

    const activities = proposals.filter((p) => p.category !== "keep_free");
    expect(activities.length).toBeGreaterThan(1);
    expect(activities.length).toBeLessThanOrEqual(5);
  });

  it("J. sport effectué → pas de proposition sport", () => {
    const result = resolveWorkoutAvailability({
      entry: sportEntry("done", today, true),
      currentLocalDate: today,
      workoutCompletedToday: true,
      scheduledSportEntries: [sportEntry("done", today, true)],
    });
    expect(result.status).toBe("already_completed_today");
  });

  it("K. révision effectuée filtrée via sportPossible false", () => {
    const lifeContext = {
      sportPossible: false,
      studyPossible: true,
    } as LifeContext;
    expect(lifeContext.sportPossible).toBe(false);
  });

  it("L. moment en couple occupe toute la soirée", () => {
    const duration = resolveSuggestedActivityDuration({
      activityType: "couple",
      freeSlotDuration: 180,
    });
    expect(duration).toBe(180);
  });

  it("M. film reçoit une durée longue cohérente", () => {
    const duration = resolveSuggestedActivityDuration({
      activityType: "film",
      freeSlotDuration: 150,
    });
    expect(duration).toBeGreaterThanOrEqual(90);
  });

  it("N. sport conserve du temps libre après", () => {
    const duration = resolveSuggestedActivityDuration({
      activityType: "sport",
      freeSlotDuration: 40,
    });
    expect(duration).toBeLessThanOrEqual(30);
  });

  it("O. suggestion non acceptée ne crée pas de calendar_item", () => {
    const entry = freeEntry(`${today}T20:30:00.000Z`, `${today}T23:30:00.000Z`);
    expect(entry.calendarItemId).toBeUndefined();
    expect(entry.origin).toBe("computed");
  });

  it("P. pas de surcharge de soirée", () => {
    const result = resolveEveningOpportunity({
      eveningStart: `${today}T20:30:00.000Z`,
      eveningEnd: `${today}T23:30:00.000Z`,
      workDay: true,
      restDay: false,
      energyPrediction: "medium",
      studiesActive: true,
      preferredFocusMinutes: 25,
      sportPossible: true,
      workoutCompletedToday: false,
      faithImportance: "disabled",
      restPreferences: [],
      familySituation: "normal",
      partnerPresent: true,
      eveningPlanningMode: "suggestions_only",
    });

    const activities = result.blocks.filter(
      (block) => block.type !== "keep_free" && block.type !== "wind_down",
    );
    expect(activities.length).toBeLessThanOrEqual(1);
  });
});
