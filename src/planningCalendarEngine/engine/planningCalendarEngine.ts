/**
 * EPIC 5A — Planning & Calendar Engine orchestrator.
 */

import { getLocalDayBounds } from "../../lib/time/dayBounds";
import { getLocalWeekBounds } from "../../lib/time/weekBounds";
import { detectCalendarConflicts } from "../conflict/conflictEngine";
import { findFreeSlots, sumFreeMinutes } from "../freeSlot/freeSlotEngine";
import { mergeCalendarItems, countMergedEvents } from "../merge/mergeEngine";
import type {
  CalendarItem,
  CalendarSourceInfo,
  PlanningCalendarQuery,
  PlanningCalendarSnapshot,
  Timeline,
} from "../types/calendarItem";
import type { PlanningCalendarEngineDependencies } from "./planningCalendarEngineDependencies";
import { defaultPlanningCalendarEngineDependencies } from "./planningCalendarEngineDependencies";
import type { PlanningCalendarOperation } from "../../ai/actionEngine/planning/planningCalendarContract";
import {
  PLANNING_CALENDAR_NOT_IMPLEMENTED,
  type PlanningCalendarCommand,
  type PlanningCalendarResult,
} from "../../ai/actionEngine/planning/planningCalendarContract";

export type ReorganizeDayInput = {
  readonly userId: string;
  readonly date: string;
  readonly calendarItemIds?: readonly string[];
};

export class PlanningCalendarEngine {
  private readonly deps: PlanningCalendarEngineDependencies;

  constructor(deps: PlanningCalendarEngineDependencies = defaultPlanningCalendarEngineDependencies) {
    this.deps = deps;
  }

  getProviders(): readonly { id: string; label: string }[] {
    return this.deps.providers.map((provider) => ({
      id: provider.id,
      label: provider.label,
    }));
  }

  async buildSnapshot(query: PlanningCalendarQuery): Promise<PlanningCalendarSnapshot> {
    const timezone = query.timezone ?? this.deps.defaultTimezone;
    const normalizedQuery: PlanningCalendarQuery = { ...query, timezone };

    const providerResults = await Promise.all(
      this.deps.providers.map(async (provider) => {
        const result = await provider.fetchItems(normalizedQuery);
        return { provider, result };
      }),
    );

    const allItems: CalendarItem[] = [];
    const sources: CalendarSourceInfo[] = [];

    for (const { provider, result } of providerResults) {
      allItems.push(...result.items);
      sources.push({
        id: provider.id,
        label: provider.label,
        available: result.available,
        itemCount: result.items.length,
        syncState: result.syncState,
      });
    }

    const timeline = mergeCalendarItems({
      items: allItems,
      rangeStart: query.start,
      rangeEnd: query.end,
      timezone,
    });

    const conflicts = detectCalendarConflicts(timeline.items);
    const freeSlots = findFreeSlots({
      items: timeline.items,
      rangeStart: query.start,
      rangeEnd: query.end,
      minDurationMinutes: 15,
    });

    return {
      timeline,
      conflicts,
      freeSlots,
      sources,
      generatedAt: new Date().toISOString(),
    };
  }

  async getTimeline(query: PlanningCalendarQuery): Promise<Timeline> {
    const snapshot = await this.buildSnapshot(query);
    return snapshot.timeline;
  }

  async getEvents(query: PlanningCalendarQuery): Promise<readonly CalendarItem[]> {
    const timeline = await this.getTimeline(query);
    return timeline.items;
  }

  async getToday(input: {
    userId: string;
    householdId?: string | null;
    date: string;
    timezone?: string;
  }): Promise<PlanningCalendarSnapshot> {
    const bounds = getLocalDayBounds(input.date);
    return this.buildSnapshot({
      userId: input.userId,
      householdId: input.householdId,
      start: bounds.start,
      end: bounds.end,
      timezone: input.timezone,
    });
  }

  async getWeek(input: {
    userId: string;
    householdId?: string | null;
    date: string;
    timezone?: string;
  }): Promise<PlanningCalendarSnapshot> {
    const bounds = getLocalWeekBounds(input.date);
    return this.buildSnapshot({
      userId: input.userId,
      householdId: input.householdId,
      start: bounds.start,
      end: bounds.end,
      timezone: input.timezone,
    });
  }

  async findFreeSlots(
    query: PlanningCalendarQuery,
    minDurationMinutes = 15,
  ): Promise<PlanningCalendarSnapshot["freeSlots"]> {
    const snapshot = await this.buildSnapshot(query);
    return findFreeSlots({
      items: snapshot.timeline.items,
      rangeStart: query.start,
      rangeEnd: query.end,
      minDurationMinutes,
    });
  }

  async detectConflicts(query: PlanningCalendarQuery): Promise<PlanningCalendarSnapshot["conflicts"]> {
    const snapshot = await this.buildSnapshot(query);
    return snapshot.conflicts;
  }

  getSourcesFromSnapshot(snapshot: PlanningCalendarSnapshot): readonly CalendarSourceInfo[] {
    return snapshot.sources;
  }

  /** Charge mentale dérivée — utilisée par Human Model. */
  deriveLoadMetrics(snapshot: PlanningCalendarSnapshot): {
    eventCount: number;
    conflictCount: number;
    freeMinutes: number;
    busyMinutes: number;
  } {
    const eventCount = countMergedEvents(snapshot.timeline);
    const rangeMs =
      new Date(snapshot.timeline.rangeEnd).getTime() -
      new Date(snapshot.timeline.rangeStart).getTime();
    const freeMinutes = sumFreeMinutes(snapshot.freeSlots);
    const busyMinutes = Math.max(0, Math.round(rangeMs / 60_000) - freeMinutes);

    return {
      eventCount,
      conflictCount: snapshot.conflicts.length,
      freeMinutes,
      busyMinutes,
    };
  }

  async reorganizeDay(input: ReorganizeDayInput): Promise<{ summary: string; movedCount: number }> {
    const result = await this.deps.rescheduleNonUrgentTasks({
      userId: input.userId,
      date: input.date,
      calendarItemIds: input.calendarItemIds ? [...input.calendarItemIds] : undefined,
    });
    return { summary: result.summary, movedCount: result.moved.length };
  }

  async executePlanningCommand(
    command: PlanningCalendarCommand,
  ): Promise<PlanningCalendarResult> {
    const operation = command.target.operation as PlanningCalendarOperation;

    switch (operation) {
      case "reorganizeDay":
      case "rescheduleEvent": {
        if (operation === "rescheduleEvent") {
          return {
            success: false,
            message: PLANNING_CALENDAR_NOT_IMPLEMENTED,
            scope: command.target.scope,
          };
        }
        const result = await this.reorganizeDay({
          userId: command.userId,
          date: command.target.date ?? String(command.payload.date ?? ""),
          calendarItemIds: command.payload.calendarItemIds
            ? (command.payload.calendarItemIds as string[])
            : undefined,
        });
        return {
          success: true,
          message: result.summary,
          scope: command.target.scope,
          data: { movedCount: result.movedCount },
        };
      }
      case "createEvent":
      case "updateEvent":
      case "deleteEvent":
      case "createReminder":
        return {
          success: false,
          message: PLANNING_CALENDAR_NOT_IMPLEMENTED,
          scope: command.target.scope,
        };
      default:
        return {
          success: false,
          message: `Opération non prise en charge : ${operation}`,
          scope: command.target.scope,
        };
    }
  }
}

export const defaultPlanningCalendarEngine = new PlanningCalendarEngine();
