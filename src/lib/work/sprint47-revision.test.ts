import { describe, expect, it } from "vitest";

import { MAX_SLOT_SUGGESTIONS } from "../../config/activityRepeatRules";
import {
  canProposeCategoryAutomatically,
  resolveDailyActivityUsage,
} from "../planning/dailyActivityCompletionState";
import { ensurePrimarySuggestionInList } from "../planning/ensurePrimarySuggestionInList";
import {
  formatStudyMinutesLabel,
  getWeeklyStudyProgress,
} from "../planning/getWeeklyStudyProgress";
import { generateFreeTimeSuggestionsFromLifeContext } from "../planning/lifeProposalAdapter";
import { generateSlotActivitySuggestions } from "../planning/slotActivitySuggestionEngine";
import type { PlanningContext } from "../../ai/memoryEngine";
import type { CalendarItemRecord } from "../../types/database";
import type { TaskActivityEventRecord } from "../../types/taskActivity";
import type { LifeContext } from "../../types/lifeContext";
import type { FreeTimeSuggestion } from "../../types/freeTimeSuggestion";

const date = "2026-07-20";
const userId = "user-1";

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
    currentUserId: userId,
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
      studyWeeklyHours: 4,
      faithImportance: "important",
      restPreferences: ["lecture"],
      preferredFocusMinutes: 30,
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
    familyContextPeriods: [],
    householdEvening: { adultBedTime: "23:00", childBedTime: "20:30" },
    childRoutines: [],
    children: [],
    onboardingCompleted: true,
    lifeContext,
  };
}

const slot = {
  id: "slot-evening",
  startsAt: `${date}T20:00:00`,
  endsAt: `${date}T23:00:00`,
  durationMinutes: 180,
  slotKind: "evening_available" as const,
};

const primaryStudy = {
  id: "evening-study",
  category: "study",
  title: "Révision",
  description: "Je te propose 30 minutes de révision car ta formation est ta priorité actuelle.",
  durationMinutes: 30,
  reason: "Je te propose 30 minutes de révision car ta formation est ta priorité actuelle.",
};

describe("Sprint 4.7 — révision & cohérence suggestions", () => {
  it("A. recommandation principale révision visible dans la liste", () => {
    const lifeContext = makeLifeContext();
    const context = makeContext(lifeContext);
    const usage = resolveDailyActivityUsage({
      userId,
      date,
      calendarItems: [],
    });

    const raw = generateSlotActivitySuggestions({
      slot,
      lifeContext,
      context,
      usage,
      tasks: [],
    });

    const withoutStudy = raw.filter((item) => item.category !== "study");

    const suggestions = ensurePrimarySuggestionInList({
      suggestions: withoutStudy.map((proposal) => ({
        id: proposal.id,
        type: proposal.category === "couple" ? "personal_task" : "calm",
        title: proposal.title,
        description: proposal.description,
        recommendedDuration: proposal.durationMinutes,
        reason: proposal.reason,
        priority: proposal.priority,
        action: "open_calm",
      })) as FreeTimeSuggestion[],
      primarySuggestion: primaryStudy,
      slot,
    });

    expect(suggestions.some((item) => item.type === "study")).toBe(true);
  });

  it("B. révision injectée avant limite de 5", () => {
    const base: FreeTimeSuggestion[] = [
      { id: "1", type: "calm", title: "Calme", description: "", recommendedDuration: 20, reason: "", priority: "high", action: "open_calm" },
      { id: "2", type: "personal_task", title: "Couple", description: "", recommendedDuration: 120, reason: "", priority: "high", action: "create_task" },
      { id: "3", type: "personal_task", title: "Lecture", description: "", recommendedDuration: 25, reason: "", priority: "medium", action: "create_task" },
      { id: "4", type: "spiritual", title: "Spirituel", description: "", recommendedDuration: 15, reason: "", priority: "medium", action: "show_spiritual" },
      { id: "5", type: "leisure", title: "Loisir", description: "", recommendedDuration: 30, reason: "", priority: "low", action: "add_leisure" },
      { id: "keep", type: "keep_free", title: "Garder", description: "", recommendedDuration: 0, reason: "", priority: "high", action: "keep_free" },
    ];

    const result = ensurePrimarySuggestionInList({
      suggestions: base,
      primarySuggestion: primaryStudy,
      slot,
    });

    expect(result.length).toBeLessThanOrEqual(MAX_SLOT_SUGGESTIONS);
    expect(result[0]?.type).toBe("study");
  });

  it("C. ajout au planning — mapping study/revision dans l'adaptateur", () => {
    const lifeContext = makeLifeContext();
    const context = makeContext(lifeContext);

    const suggestions = generateFreeTimeSuggestionsFromLifeContext({
      slot,
      lifeContext,
      planningContext: context,
      tasks: [
        {
          id: "task-study-1",
          household_id: "house-1",
          user_id: userId,
          title: "Formation naturopathie",
          category: "studies",
          status: "todo",
          priority: 4,
          due_at: null,
          skip_count: 0,
          cancellation_count: 0,
          consecutive_cancellations: 0,
          created_at: "",
          updated_at: "",
        },
      ],
      primarySuggestion: primaryStudy,
    });

    const study = suggestions.find((item) => item.type === "study");
    expect(study).toBeDefined();
    expect(study?.action).toBe("assign_study");
    expect(study?.optionalContent?.taskId).toBe("task-study-1");
  });

  it("D. session liée à une tâche d'étude", () => {
    const suggestions = generateFreeTimeSuggestionsFromLifeContext({
      slot,
      lifeContext: makeLifeContext(),
      planningContext: makeContext(makeLifeContext()),
      tasks: [
        {
          id: "task-study-2",
          household_id: "house-1",
          user_id: userId,
          title: "Formation naturopathie",
          category: "studies",
          status: "todo",
          priority: 4,
          due_at: null,
          skip_count: 0,
          cancellation_count: 0,
          consecutive_cancellations: 0,
          created_at: "",
          updated_at: "",
        },
      ],
    });

    const study = suggestions.find((item) => item.type === "study");
    expect(study?.studyProgress?.taskTitle).toBe("Formation naturopathie");
    expect(study?.optionalContent?.taskId).toBe("task-study-2");
  });

  it("E. session libre sans tâche", () => {
    const suggestions = generateFreeTimeSuggestionsFromLifeContext({
      slot,
      lifeContext: makeLifeContext(),
      planningContext: makeContext(makeLifeContext()),
      tasks: [],
    });

    const study = suggestions.find((item) => item.type === "study");
    expect(study?.studyProgress?.isFreeRevision).toBe(true);
    expect(study?.studyProgress?.taskTitle).toBe("Révision libre");
  });

  it("F. temps planifié hebdomadaire", () => {
    const items: CalendarItemRecord[] = [
      {
        id: "ci-1",
        household_id: "house-1",
        user_id: userId,
        task_id: null,
        title: "Révision",
        item_type: "task",
        starts_at: `${date}T09:00:00`,
        ends_at: `${date}T09:30:00`,
        locked: true,
        source: "manual",
        details: { businessType: "study", activityType: "revision" },
        created_at: "",
        updated_at: "",
      },
    ];

    const progress = getWeeklyStudyProgress({
      userId,
      referenceDate: date,
      calendarItems: items,
      taskActivityEvents: [],
      studyWeeklyHours: 4,
    });

    expect(progress.plannedMinutes).toBe(30);
    expect(progress.completedMinutes).toBe(0);
  });

  it("G. temps effectué après terminaison", () => {
    const events: TaskActivityEventRecord[] = [
      {
        id: "evt-1",
        household_id: "house-1",
        user_id: userId,
        task_id: "task-1",
        calendar_item_id: "ci-1",
        event_type: "completed",
        occurred_at: `${date}T10:00:00`,
        metadata: { studySession: true, durationCompleted: 30 },
        created_at: "",
      },
    ];

    const progress = getWeeklyStudyProgress({
      userId,
      referenceDate: date,
      calendarItems: [],
      taskActivityEvents: events,
      studyWeeklyHours: 4,
    });

    expect(progress.completedMinutes).toBe(30);
  });

  it("H. aucun double comptage", () => {
    const items: CalendarItemRecord[] = [
      {
        id: "ci-1",
        household_id: "house-1",
        user_id: userId,
        task_id: null,
        title: "Révision",
        item_type: "task",
        starts_at: `${date}T09:00:00`,
        ends_at: `${date}T09:30:00`,
        locked: true,
        source: "manual",
        details: {
          businessType: "study",
          activityType: "revision",
          status: "completed",
          actual_completed_at: `${date}T09:28:00`,
        },
        created_at: "",
        updated_at: "",
      },
    ];

    const events: TaskActivityEventRecord[] = [
      {
        id: "evt-1",
        household_id: "house-1",
        user_id: userId,
        task_id: null,
        calendar_item_id: "ci-1",
        event_type: "completed",
        occurred_at: `${date}T09:28:00`,
        metadata: { studySession: true, durationCompleted: 28 },
        created_at: "",
      },
    ];

    const progress = getWeeklyStudyProgress({
      userId,
      referenceDate: date,
      calendarItems: items,
      taskActivityEvents: events,
      studyWeeklyHours: 4,
    });

    expect(progress.completedMinutes).toBe(28);
  });

  it("I. deuxième révision autorisée après le gap", () => {
    const usage = resolveDailyActivityUsage({
      userId,
      date,
      calendarItems: [
        {
          id: "ci-study",
          household_id: "house-1",
          user_id: userId,
          task_id: null,
          title: "Révision matin",
          item_type: "task",
          starts_at: `${date}T08:00:00`,
          ends_at: `${date}T08:30:00`,
          locked: true,
          source: "manual",
          details: {
            businessType: "study",
            activityType: "revision",
            status: "completed",
            actual_completed_at: `${date}T08:25:00`,
          },
          created_at: "",
          updated_at: "",
        },
      ],
    });

    expect(usage.studyCount).toBe(1);
    expect(
      canProposeCategoryAutomatically({
        category: "study",
        usage,
        slotStartsAt: `${date}T10:30:00`,
      }),
    ).toBe(true);
  });

  it("J. affichage objectif hebdomadaire", () => {
    const progress = getWeeklyStudyProgress({
      userId,
      referenceDate: date,
      calendarItems: [],
      taskActivityEvents: [
        {
          id: "evt-2",
          household_id: "house-1",
          user_id: userId,
          task_id: null,
          calendar_item_id: null,
          event_type: "completed",
          occurred_at: `${date}T11:00:00`,
          metadata: { studySession: true, durationCompleted: 80 },
          created_at: "",
        },
      ],
      studyWeeklyHours: 4,
    });

    expect(progress.weeklyGoalMinutes).toBe(240);
    expect(formatStudyMinutesLabel(progress.completedMinutes)).toBe("1 h 20 min");
    expect(progress.progressPercent).toBe(33);
  });
});
