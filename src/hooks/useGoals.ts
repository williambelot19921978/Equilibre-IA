import { useCallback, useEffect, useState } from "react";

import { isGoalsEnabled } from "../config/featureFlags";
import {
  addGoalStep,
  createUserGoal,
  deleteUserGoal,
  getUserGoals,
  removeGoalStep,
  updateGoalStep,
  updateUserGoal,
} from "../services/goalsService";
import { getUserTasks, type TaskRecord } from "../services/tasksService";
import type {
  CreateGoalInput,
  UpdateGoalInput,
  UserGoal,
} from "../types/goal";

export function useGoals(userId: string | undefined) {
  const enabled = isGoalsEnabled();
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!userId || !enabled) {
      setGoals([]);
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const loadedTasks = await getUserTasks(userId);
      setTasks(loadedTasks);
      setGoals(getUserGoals(userId));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Impossible de charger les objectifs.",
      );
    } finally {
      setLoading(false);
    }
  }, [userId, enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const refreshGoals = useCallback(() => {
    if (!userId || !enabled) return;
    setGoals(getUserGoals(userId));
  }, [userId, enabled]);

  const createGoal = useCallback(
    (input: CreateGoalInput) => {
      if (!userId || !enabled) return null;
      const goal = createUserGoal(userId, input);
      refreshGoals();
      return goal;
    },
    [userId, enabled, refreshGoals],
  );

  const updateGoal = useCallback(
    (goalId: string, input: UpdateGoalInput) => {
      if (!userId || !enabled) return null;
      const goal = updateUserGoal(userId, goalId, input);
      refreshGoals();
      return goal;
    },
    [userId, enabled, refreshGoals],
  );

  const deleteGoal = useCallback(
    (goalId: string) => {
      if (!userId || !enabled) return false;
      const deleted = deleteUserGoal(userId, goalId);
      refreshGoals();
      return deleted;
    },
    [userId, enabled, refreshGoals],
  );

  const addStep = useCallback(
    (goalId: string, title: string) => {
      if (!userId || !enabled) return null;
      const goal = addGoalStep(userId, goalId, title);
      refreshGoals();
      return goal;
    },
    [userId, enabled, refreshGoals],
  );

  const updateStep = useCallback(
    (
      goalId: string,
      stepId: string,
      patch: { title?: string; taskIds?: string[] },
    ) => {
      if (!userId || !enabled) return null;
      const goal = updateGoalStep(userId, goalId, stepId, patch);
      refreshGoals();
      return goal;
    },
    [userId, enabled, refreshGoals],
  );

  const removeStep = useCallback(
    (goalId: string, stepId: string) => {
      if (!userId || !enabled) return null;
      const goal = removeGoalStep(userId, goalId, stepId);
      refreshGoals();
      return goal;
    },
    [userId, enabled, refreshGoals],
  );

  return {
    enabled,
    goals,
    tasks,
    loading,
    error,
    reload,
    createGoal,
    updateGoal,
    deleteGoal,
    addStep,
    updateStep,
    removeStep,
  };
}
