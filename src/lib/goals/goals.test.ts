import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlanningContext } from "../../ai/memoryEngine";
import { buildDailyBrief } from "../dailyBrief/buildDailyBrief";
import { buildGoalBriefInsight } from "./buildGoalBriefInsight";
import { computeGoalProgress } from "./computeGoalProgress";
import {
  clearGoalsForTests,
  createGoalId,
  createStepId,
} from "./goalsStorage";
import {
  addGoalStep,
  createUserGoal,
  deleteUserGoal,
  getUserGoals,
  updateGoalStep,
  updateUserGoal,
} from "../../services/goalsService";
import { isGoalsEnabled } from "../../config/featureFlags";
import type { TaskRecord } from "../../types";
import type { UserGoal } from "../../types/goal";

function readSrc(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), "src", relativePath), "utf8");
}

const USER_ID = "user-goals-test";

function installLocalStorageMock(): void {
  vi.stubGlobal("localStorage", {
    store: {} as Record<string, string>,
    getItem(key: string) {
      return this.store[key] ?? null;
    },
    setItem(key: string, value: string) {
      this.store[key] = value;
    },
    removeItem(key: string) {
      delete this.store[key];
    },
    key(index: number) {
      return Object.keys(this.store)[index] ?? null;
    },
    get length() {
      return Object.keys(this.store).length;
    },
    clear() {
      this.store = {};
    },
  });
}

function makeTask(
  id: string,
  status: TaskRecord["status"],
  lastCompletedAt?: string | null,
): TaskRecord {
  return {
    id,
    household_id: "household-1",
    assigned_to: USER_ID,
    created_by: USER_ID,
    title: `Tâche ${id}`,
    description: null,
    category: "studies",
    estimated_minutes: 30,
    due_at: null,
    priority: 3,
    splittable: true,
    status,
    skip_count: 0,
    created_at: "2026-07-01T10:00:00.000Z",
    updated_at: "2026-07-10T10:00:00.000Z",
    last_completed_at: lastCompletedAt ?? null,
  };
}

function makeGoalWithTasks(
  taskStatuses: Array<{ id: string; status: TaskRecord["status"] }>,
): { goal: UserGoal; tasks: TaskRecord[] } {
  const goal = createUserGoal(USER_ID, {
    name: "Formation",
    category: "studies",
    importance: "high",
  });

  const withStep = addGoalStep(USER_ID, goal.id, "Module 1");
  if (!withStep) throw new Error("step missing");

  const step = withStep.steps[0];
  const taskIds = taskStatuses.map((item) => item.id);

  const updated = updateGoalStep(USER_ID, withStep.id, step.id, { taskIds });
  if (!updated) throw new Error("goal update failed");

  const tasks = taskStatuses.map((item) => makeTask(item.id, item.status));

  return { goal: updated, tasks };
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
  currentUserId: USER_ID,
};

describe("EPIC2-A goals service", () => {
  beforeEach(() => {
    installLocalStorageMock();
    clearGoalsForTests();
  });

  it("creates a goal with metadata", () => {
    const goal = createUserGoal(USER_ID, {
      name: "Certification naturopathie",
      category: "studies",
      targetDate: "2026-12-01",
      importance: "high",
      estimatedMinutes: 1200,
    });

    expect(goal.name).toBe("Certification naturopathie");
    expect(goal.category).toBe("studies");
    expect(goal.targetDate).toBe("2026-12-01");
    expect(goal.importance).toBe("high");
    expect(goal.estimatedMinutes).toBe(1200);
    expect(goal.steps).toEqual([]);
    expect(getUserGoals(USER_ID)).toHaveLength(1);
  });

  it("updates a goal", () => {
    const created = createUserGoal(USER_ID, {
      name: "Formation",
      category: "studies",
      importance: "medium",
    });

    const updated = updateUserGoal(USER_ID, created.id, {
      name: "Formation avancée",
      importance: "high",
    });

    expect(updated?.name).toBe("Formation avancée");
    expect(updated?.importance).toBe("high");
  });

  it("adds steps and links existing tasks", () => {
    const goal = createUserGoal(USER_ID, {
      name: "Formation",
      category: "studies",
      importance: "medium",
    });

    const withStep = addGoalStep(USER_ID, goal.id, "Module 1");
    expect(withStep?.steps).toHaveLength(1);

    const stepId = withStep!.steps[0].id;
    const linked = updateGoalStep(USER_ID, goal.id, stepId, {
      taskIds: ["task-1", "task-2"],
    });

    expect(linked?.steps[0].taskIds).toEqual(["task-1", "task-2"]);
  });

  it("deletes a goal", () => {
    const goal = createUserGoal(USER_ID, {
      name: "Formation",
      category: "studies",
      importance: "medium",
    });

    expect(deleteUserGoal(USER_ID, goal.id)).toBe(true);
    expect(getUserGoals(USER_ID)).toHaveLength(0);
  });
});

describe("EPIC2-A goal progress", () => {
  beforeEach(() => {
    installLocalStorageMock();
    clearGoalsForTests();
  });

  it("computes completed tasks over total linked tasks", () => {
    const { goal, tasks } = makeGoalWithTasks([
      { id: "task-1", status: "done" },
      { id: "task-2", status: "todo" },
    ]);

    const progress = computeGoalProgress(goal, tasks);

    expect(progress.completedTasks).toBe(1);
    expect(progress.totalTasks).toBe(2);
    expect(progress.percent).toBe(50);
  });

  it("returns zero percent when no tasks are linked", () => {
    const goal = createUserGoal(USER_ID, {
      name: "Formation",
      category: "studies",
      importance: "medium",
    });

    const progress = computeGoalProgress(goal, []);

    expect(progress.totalTasks).toBe(0);
    expect(progress.percent).toBe(0);
  });
});

describe("EPIC2-A Daily Brief goal insight", () => {
  beforeEach(() => {
    installLocalStorageMock();
    clearGoalsForTests();
    vi.unstubAllEnvs();
  });

  it("mentions advancing toward the goal when recent progress exists", () => {
    const { goal, tasks } = makeGoalWithTasks([
      {
        id: "task-1",
        status: "done",
      },
    ]);

    const now = new Date("2026-07-12T12:00:00.000Z");
    tasks[0] = makeTask("task-1", "done", "2026-07-12T09:00:00.000Z");

    const insight = buildGoalBriefInsight([goal], tasks, now);

    expect(insight).toContain("Tu avances vers ton objectif");
    expect(insight).toContain("Formation");
  });

  it("reports stale progress without guilt wording", () => {
    const { goal, tasks } = makeGoalWithTasks([
      {
        id: "task-1",
        status: "done",
      },
    ]);

    tasks[0] = makeTask("task-1", "done", "2026-07-01T09:00:00.000Z");
    const now = new Date("2026-07-12T12:00:00.000Z");

    const insight = buildGoalBriefInsight([goal], tasks, now);

    expect(insight).toContain("Aucune progression n'a été enregistrée depuis");
    expect(insight).not.toContain("retard");
    expect(insight).not.toContain("échec");
  });

  it("adds goalInsight to Daily Brief when flag enabled", () => {
    vi.stubEnv("VITE_GOALS", "true");

    const goal: UserGoal = {
      id: createGoalId(),
      name: "Formation",
      category: "studies",
      targetDate: null,
      importance: "high",
      estimatedMinutes: null,
      steps: [
        {
          id: createStepId(),
          title: "Module 1",
          order: 0,
          taskIds: [],
        },
      ],
      createdAt: "2026-07-01T10:00:00.000Z",
      updatedAt: "2026-07-01T10:00:00.000Z",
    };

    const brief = buildDailyBrief({
      firstName: "William",
      date: "2026-07-13",
      timeline: [],
      planningContext: baseContext,
      goals: [goal],
      tasks: [],
    });

    expect(brief?.goalInsight).toContain("Formation");
  });
});

describe("EPIC2-A boundaries", () => {
  it("feature flag defaults to disabled", () => {
    vi.stubEnv("VITE_GOALS", undefined);
    expect(isGoalsEnabled()).toBe(false);
  });

  it("Goals UI does not import orchestrator engines directly", () => {
    const page = readSrc("pages/GoalsPage.tsx");
    const form = readSrc("components/goals/GoalForm.tsx");

    expect(page).not.toContain("buildDailyBrief");
    expect(page).not.toContain("validatePlannedBlockCore");
    expect(form).not.toContain("generateFreeTimeSuggestions");
  });

  it("does not create a new motor", () => {
    const service = readSrc("services/goalsService.ts");
    expect(service).not.toContain("goalEngine");
    expect(service).not.toContain("createEngine");
  });

  it("reuses existing task records for progress", () => {
    const progress = readSrc("lib/goals/computeGoalProgress.ts");
    expect(progress).toContain('task.status === "done"');
  });

  it("P1, P2 and Daily Brief files remain present", () => {
    expect(readSrc("lib/recommendations/buildStudySlotRecommendation.ts")).toContain(
      "buildStudySlotRecommendation",
    );
    expect(readSrc("lib/rescheduling/buildStudyRescheduleProposal.ts")).toContain(
      "buildStudyRescheduleProposal",
    );
    expect(readSrc("lib/dailyBrief/buildDailyBrief.ts")).toContain("buildDailyBrief");
  });
});
