/**
 * EPIC 5A — Internal Planning API facade.
 */

import type { PlanningCalendarEngine } from "../engine/planningCalendarEngine";
import { defaultPlanningCalendarEngine } from "../engine/planningCalendarEngine";
import type {
  CalendarConflict,
  CalendarItem,
  CalendarSourceInfo,
  FreeSlot,
  PlanningCalendarQuery,
  PlanningCalendarSnapshot,
  Timeline,
} from "../types/calendarItem";

export class PlanningCalendarApi {
  private readonly engine: PlanningCalendarEngine;

  constructor(engine: PlanningCalendarEngine = defaultPlanningCalendarEngine) {
    this.engine = engine;
  }

  getTimeline(query: PlanningCalendarQuery): Promise<Timeline> {
    return this.engine.getTimeline(query);
  }

  getEvents(query: PlanningCalendarQuery): Promise<readonly CalendarItem[]> {
    return this.engine.getEvents(query);
  }

  getToday(input: {
    userId: string;
    householdId?: string | null;
    date: string;
    timezone?: string;
  }): Promise<PlanningCalendarSnapshot> {
    return this.engine.getToday(input);
  }

  getWeek(input: {
    userId: string;
    householdId?: string | null;
    date: string;
    timezone?: string;
  }): Promise<PlanningCalendarSnapshot> {
    return this.engine.getWeek(input);
  }

  findFreeSlots(
    query: PlanningCalendarQuery,
    minDurationMinutes?: number,
  ): Promise<readonly FreeSlot[]> {
    return this.engine.findFreeSlots(query, minDurationMinutes);
  }

  detectConflicts(query: PlanningCalendarQuery): Promise<readonly CalendarConflict[]> {
    return this.engine.detectConflicts(query);
  }

  getSources(snapshot: PlanningCalendarSnapshot): readonly CalendarSourceInfo[] {
    return this.engine.getSourcesFromSnapshot(snapshot);
  }

  buildSnapshot(query: PlanningCalendarQuery): Promise<PlanningCalendarSnapshot> {
    return this.engine.buildSnapshot(query);
  }
}

export const planningCalendarApi = new PlanningCalendarApi();
