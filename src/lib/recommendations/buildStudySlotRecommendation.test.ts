import { describe, expect, it, beforeEach, vi } from "vitest";

import {
  buildStudySlotRecommendation,
  findFirstStudyFreeSlot,
} from "./buildStudySlotRecommendation";
import {
  formatStudyRecommendationMessage,
  resolveStudyActivityLabel,
} from "./formatStudyRecommendationMessage";
import {
  presentStudyRecommendation,
  dismissStudyRecommendationAction,
} from "./studySlotRecommendationService";
import type { PlanningContext } from "../../ai/memoryEngine";
import type { DayTimelineEntry } from "../planning/displayedDayTimeline";
import type { TaskRecord } from "../../types";
import {
  resetOutcomeObservationRuntime,
  getOutcomeObservationRuntime,
} from "../../ai/outcome/outcomeObservationRuntime";
import { isPersonalSignal } from "../../ai/contracts/privacy/personal-signal.ts";

function makeFreeSlotEntry(
  overrides: Partial<DayTimelineEntry> = {},
): DayTimelineEntry {
  return {
    id: "free-slot-1",
    visualType: "free",
    title: "Temps libre",
    startsAt: "2026-07-13T14:00:00.000Z",
    endsAt: "2026-07-13T15:00:00.000Z",
    locked: false,
    origin: "computed",
    blockKind: "free_slot",
    freeSlotKind: "day",
    ...overrides,
  };
}

const baseContext: PlanningContext = {
  householdId: "household-1",
  children: [],
  childrenCount: 0,
  wakeTime: "06:30",
  bedTime: "22:00",
  workStart: "09:00",
  workEnd: "17:00",
  mainPriority: "studies",
  onboardingCompleted: true,
  profile: {
    eveningRoutine: [],
    workDays: ["monday"],
    procrastinationCauses: [],
    sleepProblems: [],
    sportInterests: [],
    sportMusic: [],
    restPreferences: [],
    faithImportance: "disabled",
    faithContent: [],
    studiesActive: true,
    preferredFocusMinutes: 30,
  },
  childRoutines: [],
  householdEvening: {
    eveningRoutineStart: null,
    eveningRoutineManager: null,
    averageEveningRoutineMinutes: 45,
  },
  familyContext: {
    activePeriods: [],
    disableWork: false,
    disableSchoolDeparture: false,
    maxFillRatio: 0.8,
    soloParentWithChildren: false,
    childSick: false,
    onlyMicroTasks: false,
    childrenVacation: false,
    userVacation: false,
    unavailableUserIds: [],
    adaptations: [],
    warnings: [],
  },
  familyContextPeriods: [],
  targetDate: "2026-07-13",
  currentUserId: "user-1",
};

const studyTask: TaskRecord = {
  id: "task-study-1",
  household_id: "household-1",
  user_id: "user-1",
  title: "cours de naturopathie",
  category: "studies",
  status: "todo",
  priority: "medium",
  estimated_minutes: 45,
  created_at: "",
  updated_at: "",
};

describe("formatStudyRecommendationMessage", () => {
  it("formats P1 example copy", () => {
    const message = formatStudyRecommendationMessage({
      slotMinutes: 35,
      activityLabel: resolveStudyActivityLabel("cours de naturopathie"),
      timingHint: "C'est probablement le meilleur moment aujourd'hui.",
    });

    expect(message).toContain("35 minutes");
    expect(message).toContain("naturopathie");
    expect(message).toContain("meilleur moment");
  });
});

describe("buildStudySlotRecommendation — vertical pipeline", () => {
  it("finds first exploitable study free slot", () => {
    const timeline = [
      makeFreeSlotEntry({ id: "short", endsAt: "2026-07-13T14:10:00.000Z" }),
      makeFreeSlotEntry({ id: "good" }),
    ];

    expect(findFirstStudyFreeSlot(timeline)?.id).toBe("good");
  });

  it("builds recommendation with decision approval", () => {
    const recommendation = buildStudySlotRecommendation({
      entry: makeFreeSlotEntry(),
      date: "2026-07-13",
      planningContext: baseContext,
      tasks: [studyTask],
    });

    expect(recommendation).not.toBeNull();
    expect(recommendation?.suggestion.type).toBe("study");
    expect(recommendation?.decisionApproved).toBe(true);
    expect(recommendation?.message).toContain("minutes");
  });

  it("returns null when slot too short", () => {
    const recommendation = buildStudySlotRecommendation({
      entry: makeFreeSlotEntry({
        endsAt: "2026-07-13T14:05:00.000Z",
      }),
      date: "2026-07-13",
      planningContext: baseContext,
      tasks: [studyTask],
    });

    expect(recommendation).toBeNull();
  });
});

describe("P1 outcome loop — planning → interaction → personal signal", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ENABLE_OUTCOME_OBSERVATION", "true");
    resetOutcomeObservationRuntime();
  });

  it("present → dismiss produces personal signal without universal route", () => {
    const recommendation = buildStudySlotRecommendation({
      entry: makeFreeSlotEntry(),
      date: "2026-07-13",
      planningContext: baseContext,
      tasks: [studyTask],
    });

    expect(recommendation).not.toBeNull();
    if (!recommendation) return;

    presentStudyRecommendation(recommendation, "user-1", "household-1");
    dismissStudyRecommendationAction(
      recommendation,
      "user-1",
      "household-1",
      "2026-07-13",
    );

    const runtime = getOutcomeObservationRuntime();
    const metrics = runtime.observability.snapshot();
    const signals = runtime.signalSink.listAll();

    expect(metrics.eventsReceived).toBeGreaterThanOrEqual(2);
    expect(metrics.personalSignalsProduced).toBeGreaterThan(0);
    expect(signals.every((signal) => isPersonalSignal(signal))).toBe(true);
    expect(signals.every((signal) => signal.route === "personal_only")).toBe(
      true,
    );
    expect(runtime.engine.emitAnonymizedCandidates({
      batchId: "b1",
      from: "2026-01-01",
      to: "2026-12-31",
    })).toEqual([]);
  });
});
