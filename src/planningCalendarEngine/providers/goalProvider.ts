/**
 * EPIC 5A — Goal provider (goal steps with target dates).
 */

import type { UserGoal } from "../../types/goal";
import type { ICalendarProvider, ProviderFetchResult } from "./calendarProvider";
import type { PlanningCalendarQuery } from "../types/calendarItem";
import { goalToCalendarItem } from "./mappers";
import { isGoalsEnabled } from "../../config/featureFlags";

export type GoalProviderDeps = {
  readonly getUserGoals: (userId: string) => UserGoal[] | Promise<UserGoal[]>;
};

export function createGoalProvider(deps: GoalProviderDeps): ICalendarProvider {
  return {
    id: "goals",
    label: "Objectifs planifiés",
    async fetchItems(query: PlanningCalendarQuery): Promise<ProviderFetchResult> {
      if (!isGoalsEnabled()) {
        return { items: [], syncState: "local", available: false };
      }

      try {
        const goals = await deps.getUserGoals(query.userId);
        const timezone = query.timezone ?? "America/Montreal";
        const startMs = new Date(query.start).getTime();
        const endMs = new Date(query.end).getTime();

        const items = goals
          .map((goal) => goalToCalendarItem(goal, query.userId, timezone))
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
          error: error instanceof Error ? error.message : "Erreur objectifs.",
        };
      }
    },
  };
}
