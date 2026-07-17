import { describe, expect, it } from "vitest";

import {
  buildDayConstraints,
  buildSegmentsToTry,
  findAvailableSlots,
  generateDayPlan,
  hasOverlapInPlan,
  splitTaskIfNeeded,
} from "../ai/planningEngine";
import type { PlanningContext } from "../ai/memoryEngine";
import type { ResolvedFamilyContext } from "../types/familyContext";
import type { TaskRecord } from "../types";

function makeFamilyContext(
  overrides: Partial<ResolvedFamilyContext> = {},
): ResolvedFamilyContext {
  return {
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
    ...overrides,
  };
}

const baseContext: PlanningContext = {
  householdId: "household-1",
  children: [
    {
      id: "child-1",
      household_id: "household-1",
      first_name: "Léa",
      birth_date: null,
    },
  ],
  childrenCount: 1,
  wakeTime: "06:30",
  bedTime: "22:00",
  workStart: "09:00",
  workEnd: "17:00",
  mainPriority: "studies",
  onboardingCompleted: true,
  profile: {
    morningDurationMinutes: 60,
    childrenDepartureTime: "08:00",
    eveningRoutine: ["homework", "meal"],
    workDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    commuteMinutes: 30,
    afterWorkEnergy: "low",
    studiesActive: true,
    studyWeeklyHours: 6,
    studyBestPeriod: "morning",
    procrastinationCauses: [],
    preferredFocusMinutes: 25,
    sleepNeededHours: 8,
    sleepProblems: [],
    sportInterests: [],
    sportMinimumMinutes: 15,
    sportMusic: [],
    restPreferences: [],
    faithImportance: "disabled",
    faithContent: [],
  },
  childRoutines: [
    {
      id: "routine-1",
      child_id: "child-1",
      household_id: "household-1",
      bedtime_weekday: "20:00",
      bedtime_weekend: "21:00",
      evening_routine_minutes: 45,
      wake_time: null,
      school_days: null,
      created_at: "",
      updated_at: "",
    },
  ],
  householdEvening: {
    eveningRoutineStart: null,
    eveningRoutineManager: null,
    averageEveningRoutineMinutes: 45,
  },
  familyContext: makeFamilyContext(),
  familyContextPeriods: [],
  targetDate: "2026-07-13",
  currentUserId: "user-1",
};

function createTask(overrides: Partial<TaskRecord> = {}): TaskRecord {
  return {
    id: "task-1",
    household_id: "household-1",
    assigned_to: "user-1",
    created_by: "user-1",
    title: "Module naturopathie",
    description: null,
    category: "studies",
    estimated_minutes: 120,
    due_at: null,
    priority: 4,
    splittable: true,
    status: "todo",
    skip_count: 0,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("planningEngine", () => {
  it("calcule les contraintes dures pour une journée de travail avec enfants", () => {
    const { constraints, incompleteData } = buildDayConstraints({
      date: "2026-07-13",
      context: baseContext,
    });

    const types = constraints.map((constraint) => constraint.type);

    expect(types).toContain("morning_routine");
    expect(
      types.some((type) =>
        ["work", "commute_out", "commute_in"].includes(type),
      ),
    ).toBe(true);
    expect(types).toContain("evening_routine");
    expect(types).toContain("sleep");
    expect(incompleteData).toHaveLength(0);
  });

  it("A — vacances : aucune contrainte travail habituelle", () => {
    const { constraints } = buildDayConstraints({
      date: "2026-07-13",
      context: {
        ...baseContext,
        familyContext: makeFamilyContext({
          disableWork: true,
          userVacation: true,
        }),
      },
    });

    const types = constraints.map((constraint) => constraint.type);

    expect(types).not.toContain("work");
    expect(types).not.toContain("commute_out");
    expect(types).not.toContain("commute_in");
  });

  it("B — William absent : aucune tâche assignée à William", () => {
    const result = generateDayPlan({
      date: "2026-07-13",
      context: {
        ...baseContext,
        familyContext: makeFamilyContext({
          unavailableUserIds: ["william-id"],
        }),
      },
      tasks: [
        createTask({ id: "t-william", assigned_to: "william-id" }),
        createTask({ id: "t-user", assigned_to: "user-1", title: "Tâche user" }),
      ],
    });

    const assignedIds = result.plan.blocks
      .filter((block) => block.blockType === "task")
      .map((block) => block.taskId);

    expect(assignedIds).not.toContain("t-william");
    expect(assignedIds).toContain("t-user");
  });

  it("C — parent seul : remplissage maximum 60 %", () => {
    const result = generateDayPlan({
      date: "2026-07-13",
      context: {
        ...baseContext,
        familyContext: makeFamilyContext({
          maxFillRatio: 0.6,
          soloParentWithChildren: true,
        }),
      },
      tasks: Array.from({ length: 10 }, (_, index) =>
        createTask({
          id: `task-${index}`,
          title: `Tâche ${index}`,
          estimated_minutes: 45,
          priority: 5,
        }),
      ),
    });

    expect(result.plan.fillPercentage).toBeLessThanOrEqual(60);
  });

  it("D — vacances enfants : aucun départ école automatique", () => {
    const { constraints } = buildDayConstraints({
      date: "2026-07-13",
      context: {
        ...baseContext,
        familyContext: makeFamilyContext({
          disableSchoolDeparture: true,
          childrenVacation: true,
        }),
      },
    });

    const types = constraints.map((constraint) => constraint.type);
    expect(types).not.toContain("morning_routine");
  });

  it("détecte les créneaux libres sans chevauchement", () => {
    const { constraints } = buildDayConstraints({
      date: "2026-07-13",
      context: baseContext,
    });

    const slots = findAvailableSlots({
      date: "2026-07-13",
      context: baseContext,
      constraints,
    });

    expect(slots.length).toBeGreaterThan(0);

    for (const slot of slots) {
      expect(slot.durationMinutes).toBeGreaterThan(0);
    }

    for (let index = 0; index < slots.length - 1; index += 1) {
      expect(
        new Date(slots[index].endsAt).getTime() <=
          new Date(slots[index + 1].startsAt).getTime(),
      ).toBe(true);
    }
  });

  it("protège le sommeil — aucune tâche après le coucher", () => {
    const result = generateDayPlan({
      date: "2026-07-13",
      context: baseContext,
      tasks: [
        createTask({
          estimated_minutes: 180,
          splittable: false,
        }),
      ],
    });

    const bedTime = new Date("2026-07-13T22:00:00").getTime();
    const taskBlocks = result.plan.blocks.filter(
      (block) => block.blockType === "task",
    );

    for (const block of taskBlocks) {
      expect(new Date(block.endsAt).getTime()).toBeLessThanOrEqual(bedTime);
    }
  });

  it("découpe une tâche splittable de 120 minutes", () => {
    const segments = splitTaskIfNeeded(
      createTask({ estimated_minutes: 120, splittable: true }),
      baseContext,
    );

    expect(segments.length).toBeGreaterThan(1);
    expect(segments[0].title).toContain("partie 1/");
    expect(
      segments.reduce((sum, segment) => sum + segment.durationMinutes, 0),
    ).toBe(120);
  });

  it("propose une session courte pour skip_count >= 3", () => {
    const segments = splitTaskIfNeeded(
      createTask({ skip_count: 3 }),
      baseContext,
    );

    expect(segments).toHaveLength(1);
    expect(segments[0].durationMinutes).toBeGreaterThanOrEqual(10);
    expect(segments[0].durationMinutes).toBeLessThanOrEqual(20);
    expect(segments[0].isRestartSession).toBe(true);
  });

  it("place une tâche non splittable longue via micro-session", () => {
    const result = generateDayPlan({
      date: "2026-07-13",
      context: baseContext,
      tasks: [
        createTask({
          estimated_minutes: 600,
          splittable: false,
          priority: 4,
        }),
      ],
    });

    const taskBlocks = result.plan.blocks.filter(
      (block) => block.blockType === "task",
    );

    expect(taskBlocks.length).toBe(1);
    expect(taskBlocks[0].explanation.summary.length).toBeGreaterThan(10);
  });

  it("respecte la limite de remplissage à 80 %", () => {
    const result = generateDayPlan({
      date: "2026-07-13",
      context: baseContext,
      tasks: Array.from({ length: 10 }, (_, index) =>
        createTask({
          id: `task-${index}`,
          title: `Tâche ${index}`,
          estimated_minutes: 45,
          priority: 5,
        }),
      ),
    });

    expect(result.plan.fillPercentage).toBeLessThanOrEqual(80);
  });

  it("ne génère pas de chevauchement dans le plan", () => {
    const result = generateDayPlan({
      date: "2026-07-13",
      context: baseContext,
      tasks: [
        createTask({ id: "t1", title: "Tâche 1" }),
        createTask({ id: "t2", title: "Tâche 2", category: "home" }),
        createTask({ id: "t3", title: "Tâche 3", category: "sport" }),
      ],
    });

    expect(hasOverlapInPlan(result.plan.blocks)).toBe(false);
  });

  it("propose des segments fallback 20, 15 et 10 minutes", () => {
    const segments = buildSegmentsToTry(
      createTask({ estimated_minutes: 120, splittable: false }),
      baseContext,
    );

    const durations = segments.map((segment) => segment.durationMinutes);

    expect(durations).toContain(120);
    expect(durations).toContain(20);
    expect(durations).toContain(15);
    expect(durations).toContain(10);
  });

  it("explique précisément une tâche non planifiable", () => {
    const result = generateDayPlan({
      date: "2026-07-13",
      context: baseContext,
      tasks: [
        createTask({
          category: "spirituality",
          title: "Lecture biblique",
        }),
      ],
    });

    expect(result.plan.unplannableTasks).toHaveLength(1);
    expect(result.plan.unplannableTasks[0]?.reason).toContain(
      "faith_importance=disabled",
    );
  });
});
