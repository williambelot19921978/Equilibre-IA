import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlanningContext } from "../../ai/memoryEngine";
import { buildDailyBrief } from "../dailyBrief/buildDailyBrief";
import { buildDailyBriefRecommendations } from "../dailyBrief/buildDailyBriefRecommendations";
import { buildGoalProgressInsight } from "./buildGoalProgressInsight";
import {
  computeGoalProgress,
  computeGoalProgressSummary,
} from "./computeGoalProgress";
import { enrichRecommendationsWithGoalContext } from "./enrichRecommendationsWithGoalContext";
import { computeGoalWeightsFromUserGoals } from "./goalEnginePort";
import {
  clearGoalsForTests,
  createGoalId,
  createStepId,
} from "./goalsStorage";
import {
  addGoalStep,
  createUserGoal,
  updateGoalStep,
} from "../../services/goalsService";
import {
  isGoalProgressAssistantEnabled,
  isGoalsEnabled,
} from "../../config/featureFlags";
import type { TaskRecord } from "../../types";
import type { UserGoal } from "../../types/goal";
import {
  resolveGoalNextAction,
  resolvePrimaryGoalNextAction,
} from "./resolveGoalNextAction";
import { resolveGoalAssociationForTask } from "./resolveGoalAssociation";

function readSrc(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), "src", relativePath), "utf8");
}

const USER_ID = "user-goal-progress-test";

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
  options: Partial<TaskRecord> = {},
): TaskRecord {
  return {
    id,
    household_id: "household-1",
    assigned_to: USER_ID,
    created_by: USER_ID,
    title: options.title ?? `Tâche ${id}`,
    description: null,
    category: options.category ?? "studies",
    estimated_minutes: options.estimated_minutes ?? 35,
    due_at: null,
    priority: 3,
    splittable: true,
    status,
    skip_count: 0,
    created_at: "2026-07-01T10:00:00.000Z",
    updated_at: "2026-07-10T10:00:00.000Z",
    last_completed_at: options.last_completed_at ?? null,
    ...options,
  };
}

function buildGoalWithSteps(
  name: string,
  steps: Array<{ title: string; taskIds: string[] }>,
): UserGoal {
  const goal = createUserGoal(USER_ID, {
    name,
    category: "studies",
    importance: "high",
  });

  let current = goal;
  for (const step of steps) {
    const withStep = addGoalStep(USER_ID, current.id, step.title);
    if (!withStep) throw new Error("missing step");
    const createdStep = withStep.steps[withStep.steps.length - 1];
    const linked = updateGoalStep(USER_ID, current.id, createdStep.id, {
      taskIds: step.taskIds,
    });
    if (!linked) throw new Error("missing linked goal");
    current = linked;
  }

  return current;
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

describe("EPIC2-B next action", () => {
  beforeEach(() => {
    installLocalStorageMock();
    clearGoalsForTests();
  });

  it("returns empty status for goal without steps", () => {
    const goal = createUserGoal(USER_ID, {
      name: "Formation",
      category: "studies",
      importance: "medium",
    });

    const action = resolveGoalNextAction(goal, []);

    expect(action.status).toBe("empty");
    expect(action.goalName).toBe("Formation");
  });

  it("returns completed status when all linked tasks are done", () => {
    const goal = buildGoalWithSteps("Formation", [
      { title: "Module 1", taskIds: ["task-1"] },
    ]);
    const tasks = [makeTask("task-1", "done")];

    const action = resolveGoalNextAction(goal, tasks);

    expect(action.status).toBe("completed");
  });

  it("returns the first incomplete task as next action", () => {
    const goal = buildGoalWithSteps("Formation naturopathie", [
      { title: "Module 3", taskIds: ["task-1", "task-2"] },
    ]);
    const tasks = [
      makeTask("task-1", "done", { title: "Chapitre 4" }),
      makeTask("task-2", "todo", { title: "Lire le chapitre 5" }),
    ];

    const action = resolveGoalNextAction(goal, tasks);

    expect(action.status).toBe("ready");
    expect(action.stepTitle).toBe("Module 3");
    expect(action.taskTitle).toBe("Lire le chapitre 5");
    expect(action.estimatedMinutes).toBe(35);
  });

  it("picks one primary next action across multiple goals", () => {
    const high = buildGoalWithSteps("Formation A", [
      { title: "Module 1", taskIds: ["task-a"] },
    ]);
    const low = createUserGoal(USER_ID, {
      name: "Formation B",
      category: "studies",
      importance: "low",
    });
    const withStep = addGoalStep(USER_ID, low.id, "Module 1");
    const linked = updateGoalStep(USER_ID, low.id, withStep!.steps[0].id, {
      taskIds: ["task-b"],
    });

    const tasks = [
      makeTask("task-a", "todo", { title: "Action A" }),
      makeTask("task-b", "todo", { title: "Action B" }),
    ];

    const action = resolvePrimaryGoalNextAction([linked!, high], tasks);

    expect(action?.goalName).toBe("Formation A");
    expect(action?.status).toBe("ready");
  });
});

describe("EPIC2-B progress summary", () => {
  beforeEach(() => {
    installLocalStorageMock();
    clearGoalsForTests();
  });

  it("computes remaining tasks, steps and minutes", () => {
    const goal = buildGoalWithSteps("Formation", [
      { title: "Module 1", taskIds: ["task-1", "task-2"] },
      { title: "Module 2", taskIds: ["task-3"] },
    ]);
    const tasks = [
      makeTask("task-1", "done", { estimated_minutes: 20 }),
      makeTask("task-2", "todo", { estimated_minutes: 35 }),
      makeTask("task-3", "todo", { estimated_minutes: 45 }),
    ];

    const summary = computeGoalProgressSummary(goal, tasks);

    expect(summary.completedTasks).toBe(1);
    expect(summary.totalTasks).toBe(3);
    expect(summary.remainingTasks).toBe(2);
    expect(summary.remainingSteps).toBe(2);
    expect(summary.remainingMinutes).toBe(80);
  });

  it("keeps existing percent calculation unchanged", () => {
    const goal = buildGoalWithSteps("Formation", [
      { title: "Module 1", taskIds: ["task-1", "task-2"] },
    ]);
    const tasks = [makeTask("task-1", "done"), makeTask("task-2", "todo")];

    const base = computeGoalProgress(goal, tasks);
    const summary = computeGoalProgressSummary(goal, tasks);

    expect(summary.percent).toBe(base.percent);
    expect(summary.completedTasks).toBe(base.completedTasks);
  });
});

describe("EPIC2-B Daily Brief enrichment", () => {
  beforeEach(() => {
    installLocalStorageMock();
    clearGoalsForTests();
    vi.unstubAllEnvs();
  });

  it("builds enriched goal insight when assistant flag is ON", () => {
    vi.stubEnv("VITE_GOALS", "true");
    vi.stubEnv("VITE_GOAL_PROGRESS_ASSISTANT", "true");

    const goal = buildGoalWithSteps("Formation", [
      { title: "Module 1", taskIds: ["task-1"] },
    ]);
    const tasks = [
      makeTask("task-1", "done", {
        last_completed_at: "2026-07-12T09:00:00.000Z",
      }),
    ];

    const insight = buildGoalProgressInsight([goal], tasks, new Date("2026-07-13T10:00:00.000Z"));

    expect(insight).toContain("📈");
    expect(insight).toContain("Formation");
  });

  it("uses buildGoalProgressInsight in Daily Brief when assistant ON", () => {
    vi.stubEnv("VITE_GOALS", "true");
    vi.stubEnv("VITE_GOAL_PROGRESS_ASSISTANT", "true");

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
          taskIds: ["task-1"],
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
      tasks: [makeTask("task-1", "todo", { title: "Lire le chapitre 5" })],
    });

    expect(brief?.goalInsight).toContain("🎯");
  });

  it("adds associated goal on study recommendations", () => {
    const goal = buildGoalWithSteps("Formation naturopathie", [
      { title: "Module 3", taskIds: ["task-1"] },
    ]);
    const tasks = [makeTask("task-1", "todo")];
    const recommendations = buildDailyBriefRecommendations({
      timeline: [],
      date: "2026-07-13",
      planningContext: baseContext,
      tasks,
      goals: [goal],
    });

    const enriched = enrichRecommendationsWithGoalContext(
      recommendations,
      [goal],
      tasks,
      resolvePrimaryGoalNextAction([goal], tasks),
    );

    const study = enriched.find((item) => item.kind === "study");
    if (study) {
      expect(study.associatedGoalName).toBe("Formation naturopathie");
      expect(study.associatedStepTitle).toBe("Module 3");
    }
  });
});

describe("EPIC2-B associations and goal engine port", () => {
  beforeEach(() => {
    installLocalStorageMock();
    clearGoalsForTests();
  });

  it("resolves goal association for linked task", () => {
    const goal = buildGoalWithSteps("Formation naturopathie", [
      { title: "Module 3", taskIds: ["task-1"] },
    ]);

    const association = resolveGoalAssociationForTask("task-1", [goal]);

    expect(association?.goalName).toBe("Formation naturopathie");
    expect(association?.stepTitle).toBe("Module 3");
  });

  it("maps user goals to GoalWeights contract shape", () => {
    const goal = buildGoalWithSteps("Formation", [
      { title: "Module 1", taskIds: ["task-1"] },
    ]);
    const weights = computeGoalWeightsFromUserGoals(
      [goal],
      [makeTask("task-1", "todo")],
    );

    expect(weights.weights[goal.id]).toBeGreaterThan(0);
  });
});

describe("EPIC2-B boundaries", () => {
  it("assistant feature flag defaults to disabled", () => {
    vi.stubEnv("VITE_GOAL_PROGRESS_ASSISTANT", undefined);
    expect(isGoalProgressAssistantEnabled()).toBe(false);
  });

  it("goals feature flag still defaults to disabled", () => {
    vi.stubEnv("VITE_GOALS", undefined);
    expect(isGoalsEnabled()).toBe(false);
  });

  it("UI does not embed business logic from orchestrators", () => {
    const card = readSrc("components/goals/GoalNextActionCard.tsx");
    const assistant = readSrc("components/goals/GoalProgressAssistant.tsx");

    expect(card).not.toContain("resolveGoalNextAction");
    expect(assistant).not.toContain("computeGoalProgressSummary");
  });

  it("does not create a new motor", () => {
    const hook = readSrc("hooks/useGoalProgressAssistant.ts");
    expect(hook).not.toContain("createEngine");
    expect(hook).toContain("resolvePrimaryGoalNextAction");
  });

  it("does not modify engine contracts", () => {
    const contract = readSrc("ai/contracts/engines/goal-engine.contract.ts");
    expect(contract).toContain("IGoalEngine");
    expect(contract).not.toContain("GoalProgressAssistant");
  });

  it("non-regression EPIC1 Daily Brief files remain present", () => {
    expect(readSrc("lib/dailyBrief/buildDailyBrief.ts")).toContain("buildDailyBrief");
    expect(readSrc("lib/explainability/presentDailyBrief.ts")).toContain(
      "presentDailyBrief",
    );
  });

  it("non-regression EPIC2-A goals files remain present", () => {
    expect(readSrc("services/goalsService.ts")).toContain("createUserGoal");
    expect(readSrc("lib/goals/buildGoalBriefInsight.ts")).toContain(
      "buildGoalBriefInsight",
    );
  });
});
