/**
 * EPIC 5A — Task provider (scheduled / due tasks as temporal items).
 */

import type { TaskRecord } from "../../types/database";
import type { ICalendarProvider, ProviderFetchResult } from "./calendarProvider";
import type { PlanningCalendarQuery } from "../types/calendarItem";
import { taskToCalendarItem } from "./mappers";

export type TaskProviderDeps = {
  readonly getUserTasks: (userId: string) => Promise<TaskRecord[]>;
};

export function createTaskProvider(deps: TaskProviderDeps): ICalendarProvider {
  return {
    id: "tasks",
    label: "Tâches planifiées",
    async fetchItems(query: PlanningCalendarQuery): Promise<ProviderFetchResult> {
      try {
        const tasks = await deps.getUserTasks(query.userId);
        const timezone = query.timezone ?? "America/Montreal";
        const startMs = new Date(query.start).getTime();
        const endMs = new Date(query.end).getTime();

        const items = tasks
          .map((task) => taskToCalendarItem(task, timezone))
          .filter((item): item is NonNullable<typeof item> => item !== null)
          .filter((item) => {
            const itemStart = new Date(item.start).getTime();
            const itemEnd = new Date(item.end).getTime();
            return itemEnd > startMs && itemStart < endMs;
          });

        return { items, syncState: "local", available: true };
      } catch (error) {
        return {
          items: [],
          syncState: "error",
          available: false,
          error: error instanceof Error ? error.message : "Erreur tâches.",
        };
      }
    },
  };
}
