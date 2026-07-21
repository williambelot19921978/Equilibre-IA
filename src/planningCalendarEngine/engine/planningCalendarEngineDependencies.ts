/**
 * EPIC 5A — Injectable dependencies for PlanningCalendarEngine.
 */

import {
  isCalendarSyncEngineEnabled,
  isGoogleCalendarEnabled,
} from "../../config/featureFlags";
import { createGoogleCalendarProvider } from "../../calendarSyncEngine/providers/googleCalendarProvider";
import { loadCalendarItemsForDate } from "../../services/planningService";
import {
  getGoogleCalendarConnection,
  loadExternalEventsForDate,
} from "../../services/googleCalendarService";
import { getUserTasks } from "../../services/tasksService";
import { getUserGoals } from "../../services/goalsService";
import { rescheduleNonUrgentTasks } from "../../services/rescheduleNonUrgentTasksService";
import { createGoalProvider } from "../providers/goalProvider";
import { createInternalPlanningProvider } from "../providers/internalPlanningProvider";
import { createTaskProvider } from "../providers/taskProvider";
import {
  futureAppleProvider,
  futureGoogleCalendarProvider,
  futureOutlookProvider,
} from "../providers/futureExternalProviders";
import type { ICalendarProvider } from "../providers/calendarProvider";

export type PlanningCalendarEngineDependencies = {
  readonly providers: readonly ICalendarProvider[];
  readonly rescheduleNonUrgentTasks: typeof rescheduleNonUrgentTasks;
  readonly defaultTimezone: string;
};

export function createDefaultProviders(): ICalendarProvider[] {
  const providers: ICalendarProvider[] = [
    createInternalPlanningProvider({ loadCalendarItems: loadCalendarItemsForDate }),
    createTaskProvider({ getUserTasks }),
    createGoalProvider({ getUserGoals }),
  ];

  if (isGoogleCalendarEnabled() && isCalendarSyncEngineEnabled()) {
    providers.push(
      createGoogleCalendarProvider({
        loadExternalEventsForDate: loadExternalEventsForDate,
        getConnectionStatus: async ({ userId, householdId }) => {
          const connection = await getGoogleCalendarConnection(userId, householdId);
          return connection?.status ?? "disconnected";
        },
      }),
    );
  } else {
    providers.push(futureGoogleCalendarProvider);
  }

  providers.push(futureOutlookProvider, futureAppleProvider);
  return providers;
}

export const defaultPlanningCalendarEngineDependencies: PlanningCalendarEngineDependencies =
  {
    providers: createDefaultProviders(),
    rescheduleNonUrgentTasks,
    defaultTimezone: "America/Montreal",
  };
