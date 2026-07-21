/**
 * EPIC 5A — Daily Brief migration port (interfaces only).
 */

import type {
  CalendarConflict,
  CalendarItem,
  FreeSlot,
} from "../types/calendarItem";

export type DailyBriefPlanningInput = {
  readonly timeline: readonly CalendarItem[];
  readonly conflicts: readonly CalendarConflict[];
  readonly freeSlots: readonly FreeSlot[];
  readonly eventCount: number;
  readonly freeMinutes: number;
};

export type IDailyBriefPlanningPort = {
  loadPlanningForBrief(input: {
    userId: string;
    householdId?: string | null;
    date: string;
  }): Promise<DailyBriefPlanningInput | null>;
};
