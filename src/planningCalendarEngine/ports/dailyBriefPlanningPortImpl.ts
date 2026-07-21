/**
 * EPIC 5A — Daily Brief port implementation via PlanningCalendarEngine.
 */

import type { PlanningCalendarEngine } from "../engine/planningCalendarEngine";
import { defaultPlanningCalendarEngine } from "../engine/planningCalendarEngine";
import type { IDailyBriefPlanningPort } from "./dailyBriefPlanningPort";

export function createDailyBriefPlanningPort(
  engine: PlanningCalendarEngine = defaultPlanningCalendarEngine,
): IDailyBriefPlanningPort {
  return {
    async loadPlanningForBrief(input) {
      const snapshot = await engine.getToday({
        userId: input.userId,
        householdId: input.householdId,
        date: input.date,
      });
      const metrics = engine.deriveLoadMetrics(snapshot);

      return {
        timeline: snapshot.timeline.items,
        conflicts: snapshot.conflicts,
        freeSlots: snapshot.freeSlots,
        eventCount: metrics.eventCount,
        freeMinutes: metrics.freeMinutes,
      };
    },
  };
}
