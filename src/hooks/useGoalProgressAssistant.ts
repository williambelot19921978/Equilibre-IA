import { useMemo } from "react";

import {
  isGoalProgressAssistantEnabled,
  isGoalsEnabled,
} from "../config/featureFlags";
import { computeGoalProgressSummary } from "../lib/goals/computeGoalProgress";
import {
  resolveGoalNextAction,
  resolvePrimaryGoalNextAction,
} from "../lib/goals/resolveGoalNextAction";
import type { TaskRecord } from "../services/tasksService";
import type {
  GoalNextAction,
  GoalProgressSummary,
  UserGoal,
} from "../types/goal";

export function useGoalProgressAssistant({
  goals,
  tasks,
}: {
  goals: UserGoal[];
  tasks: TaskRecord[];
}) {
  const enabled = isGoalsEnabled() && isGoalProgressAssistantEnabled();

  const primaryNextAction = useMemo(() => {
    if (!enabled || goals.length === 0) return null;
    return resolvePrimaryGoalNextAction(goals, tasks);
  }, [enabled, goals, tasks]);

  const progressByGoalId = useMemo(() => {
    const map = new Map<string, GoalProgressSummary>();
    if (!enabled) return map;

    for (const goal of goals) {
      map.set(goal.id, computeGoalProgressSummary(goal, tasks));
    }

    return map;
  }, [enabled, goals, tasks]);

  const resolveNextActionForGoal = useMemo(
    () => (goalId: string): GoalNextAction | null => {
      if (!enabled) return null;
      const goal = goals.find((item) => item.id === goalId);
      if (!goal) return null;
      return resolveGoalNextAction(goal, tasks);
    },
    [enabled, goals, tasks],
  );

  return {
    enabled,
    primaryNextAction,
    progressByGoalId,
    resolveNextActionForGoal,
  };
}
