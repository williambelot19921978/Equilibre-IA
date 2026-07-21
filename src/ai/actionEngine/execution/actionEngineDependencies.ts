/** EPIC 4C — Injectable service dependencies (no direct Supabase in engine). */

import {
  createTask,
  getUserTasks,
  updateTaskStatus,
} from "../../../services/tasksService";
import {
  getUserGoals,
  updateUserGoal,
} from "../../../services/goalsService";
import { rescheduleNonUrgentTasks } from "../../../services/rescheduleNonUrgentTasksService";
import {
  isCalendarSyncEngineEnabled,
  isGoalsEnabled,
  isHouseholdCollaborationEnabled,
  isPlanningCalendarEngineEnabled,
  isSecureActionEngineEnabled,
} from "../../../config/featureFlags";
import { defaultSynchronizationEngine } from "../../../calendarSyncEngine";
import type { PlanningCalendarEngine } from "../../../planningCalendarEngine";
import { defaultPlanningCalendarEngine } from "../../../planningCalendarEngine";
import type {
  PlanningCalendarCommand,
  PlanningCalendarResult,
} from "../planning/planningCalendarContract";

export type ActionEngineDependencies = {
  readonly getUserTasks: typeof getUserTasks;
  readonly createTask: typeof createTask;
  readonly updateTaskStatus: typeof updateTaskStatus;
  readonly getUserGoals: typeof getUserGoals;
  readonly updateUserGoal: typeof updateUserGoal;
  readonly rescheduleNonUrgentTasks: typeof rescheduleNonUrgentTasks;
  readonly isGoalsEnabled: typeof isGoalsEnabled;
  readonly isHouseholdCollaborationEnabled: typeof isHouseholdCollaborationEnabled;
  readonly isSecureActionEngineEnabled: typeof isSecureActionEngineEnabled;
  readonly isPlanningCalendarEngineEnabled: typeof isPlanningCalendarEngineEnabled;
  readonly isCalendarSyncEngineEnabled: typeof isCalendarSyncEngineEnabled;
  readonly planningCalendarEngine: PlanningCalendarEngine;
  readonly executePlanningCommand: (
    command: PlanningCalendarCommand,
  ) => Promise<PlanningCalendarResult>;
  readonly reorganizePlanningDay: (input: {
    userId: string;
    date: string;
    calendarItemIds?: readonly string[];
  }) => ReturnType<PlanningCalendarEngine["reorganizeDay"]>;
};

export const defaultActionEngineDependencies: ActionEngineDependencies = {
  getUserTasks,
  createTask,
  updateTaskStatus,
  getUserGoals,
  updateUserGoal,
  rescheduleNonUrgentTasks,
  isGoalsEnabled,
  isHouseholdCollaborationEnabled,
  isSecureActionEngineEnabled,
  isPlanningCalendarEngineEnabled,
  isCalendarSyncEngineEnabled,
  planningCalendarEngine: defaultPlanningCalendarEngine,
  executePlanningCommand: (command) =>
    isCalendarSyncEngineEnabled() && isPlanningCalendarEngineEnabled()
      ? defaultSynchronizationEngine.executePlanningCommand(command)
      : defaultPlanningCalendarEngine.executePlanningCommand(command),
  reorganizePlanningDay: (input) =>
    isCalendarSyncEngineEnabled() && isPlanningCalendarEngineEnabled()
      ? defaultSynchronizationEngine.reorganizeDay(input)
      : defaultPlanningCalendarEngine.reorganizeDay(input),
};
