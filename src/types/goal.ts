export type GoalImportance = "low" | "medium" | "high";

export type GoalStep = {
  readonly id: string;
  readonly title: string;
  readonly order: number;
  readonly taskIds: readonly string[];
};

export type UserGoal = {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly targetDate: string | null;
  readonly importance: GoalImportance;
  readonly estimatedMinutes: number | null;
  readonly steps: readonly GoalStep[];
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type GoalProgress = {
  readonly goalId: string;
  readonly completedTasks: number;
  readonly totalTasks: number;
  readonly percent: number;
  readonly daysSinceLastProgress: number | null;
};

/** EPIC2-B — Extended deterministic progress summary. */
export type GoalProgressSummary = GoalProgress & {
  readonly remainingTasks: number;
  readonly remainingSteps: number;
  readonly remainingMinutes: number;
};

export type GoalNextActionStatus =
  | "empty"
  | "no_tasks"
  | "ready"
  | "completed";

export type GoalNextAction = {
  readonly status: GoalNextActionStatus;
  readonly goalId: string;
  readonly goalName: string;
  readonly stepId: string | null;
  readonly stepTitle: string | null;
  readonly taskId: string | null;
  readonly taskTitle: string | null;
  readonly estimatedMinutes: number | null;
};

export type GoalAssociation = {
  readonly goalId: string;
  readonly goalName: string;
  readonly stepTitle: string;
};

export type CreateGoalInput = {
  name: string;
  category: string;
  targetDate?: string | null;
  importance: GoalImportance;
  estimatedMinutes?: number | null;
};

export type UpdateGoalInput = Partial<CreateGoalInput> & {
  steps?: GoalStep[];
};
