import {
  computeTrends,
  consecutiveSkipDays,
  getDailyState,
  getStateHistory,
} from "../../dailyStateEngine";
import { getUserGoals } from "../../services/goalsService";
import { getUserTasks } from "../../services/tasksService";
import { getLifePriority } from "../store/coachStore";
import type { PersonalCoachInput } from "../types/personalCoachTypes";

export type BuildPersonalCoachInputOptions = {
  readonly firstName?: string;
  readonly childrenCount?: number;
};

function activeGoalsForCoach(userId: string): { id: string; name: string }[] {
  return getUserGoals(userId)
    .slice(0, 8)
    .map((goal) => ({ id: goal.id, name: goal.name }));
}

export async function buildPersonalCoachInputFromUser(
  userId: string,
  date: string,
  options: BuildPersonalCoachInputOptions = {},
): Promise<PersonalCoachInput> {
  const dailyState = getDailyState(userId, date);
  const history = getStateHistory(userId);
  const trends = computeTrends({
    states: history,
    period: "7d",
    untilDate: date,
  });
  const skipStreak = consecutiveSkipDays(userId, date);

  let taskTodoCount = 0;
  try {
    const tasks = await getUserTasks(userId);
    taskTodoCount = tasks.filter((task) =>
      task.status === "todo" || task.status === "planned" || task.status === "in_progress",
    ).length;
  } catch {
    taskTodoCount = 0;
  }

  const stress = dailyState?.stress;
  const mentalLoad =
    stress !== undefined ? Math.min(100, Math.round(stress * 10)) : undefined;

  return {
    userId,
    date,
    now: new Date().toISOString(),
    firstName: options.firstName,
    lifePriority: getLifePriority(userId),
    dailyEnergy: dailyState?.energy,
    dailyStress: dailyState?.stress,
    dailyMood: dailyState?.mood,
    mentalLoad,
    balanceScore: dailyState
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round((dailyState.energy / 10) * 100 - (stress ?? 0) * 5),
          ),
        )
      : undefined,
    taskTodoCount,
    activeGoals: activeGoalsForCoach(userId),
    trendEnergy7d: trends.averageEnergy,
    trendStress7d: trends.averageStress,
    skipStreak,
    childrenCount: options.childrenCount,
  };
}
