/**
 * EPIC 5A — Test fixtures for Planning & Calendar Engine.
 */

import type { CalendarItem } from "../types/calendarItem";

const TZ = "America/Montreal";

export function item(
  overrides: Partial<CalendarItem> & Pick<CalendarItem, "id" | "title" | "start" | "end">,
): CalendarItem {
  return {
    type: "event",
    description: undefined,
    timezone: TZ,
    allDay: false,
    owner: "user-1",
    household: "hh-1",
    participants: [],
    status: "confirmed",
    priority: 3,
    origin: "internal",
    syncState: "local",
    source: "internal-planning",
    editable: true,
    metadata: {},
    ...overrides,
  };
}

export const FIXTURE_EMPTY: readonly CalendarItem[] = [];

export const FIXTURE_SIMPLE: readonly CalendarItem[] = [
  item({
    id: "evt-1",
    title: "Réunion matin",
    start: "2026-07-20T09:00:00.000Z",
    end: "2026-07-20T10:00:00.000Z",
    type: "appointment",
  }),
  item({
    id: "evt-2",
    title: "Tâche courses",
    start: "2026-07-20T14:00:00.000Z",
    end: "2026-07-20T15:00:00.000Z",
    type: "task",
  }),
];

export const FIXTURE_BUSY: readonly CalendarItem[] = [
  ...FIXTURE_SIMPLE,
  item({
    id: "evt-3",
    title: "Sport",
    start: "2026-07-20T11:00:00.000Z",
    end: "2026-07-20T12:00:00.000Z",
  }),
  item({
    id: "evt-4",
    title: "Appel client",
    start: "2026-07-20T16:00:00.000Z",
    end: "2026-07-20T17:00:00.000Z",
    type: "appointment",
  }),
];

export const FIXTURE_OVERLAPS: readonly CalendarItem[] = [
  item({
    id: "overlap-a",
    title: "Bloc A",
    start: "2026-07-20T09:00:00.000Z",
    end: "2026-07-20T10:30:00.000Z",
  }),
  item({
    id: "overlap-b",
    title: "Bloc B",
    start: "2026-07-20T10:00:00.000Z",
    end: "2026-07-20T11:00:00.000Z",
  }),
];

export const FIXTURE_GOAL_APPOINTMENT: readonly CalendarItem[] = [
  item({
    id: "goal-1",
    title: "Objectif sport",
    start: "2026-07-20T09:00:00.000Z",
    end: "2026-07-20T10:00:00.000Z",
    type: "goal",
  }),
  item({
    id: "appt-1",
    title: "Médecin",
    start: "2026-07-20T09:30:00.000Z",
    end: "2026-07-20T10:30:00.000Z",
    type: "appointment",
  }),
];

export const FIXTURE_RECURRING: readonly CalendarItem[] = [
  item({
    id: "rec-1",
    title: "Stand-up quotidien",
    start: "2026-07-20T08:00:00.000Z",
    end: "2026-07-20T08:30:00.000Z",
    recurrence: { frequency: "daily", interval: 1 },
  }),
];

export const FIXTURE_MULTI_PROVIDER: readonly CalendarItem[] = [
  ...FIXTURE_SIMPLE,
  item({
    id: "task-provider-1",
    title: "Tâche due",
    start: "2026-07-20T18:00:00.000Z",
    end: "2026-07-20T19:00:00.000Z",
    type: "task",
    source: "tasks",
    origin: "task",
  }),
  item({
    id: "goal-provider-1",
    title: "Objectif lecture",
    start: "2026-07-20T20:00:00.000Z",
    end: "2026-07-20T21:00:00.000Z",
    type: "goal",
    source: "goals",
    origin: "goal",
  }),
];

export const DAY_START = "2026-07-20T00:00:00.000Z";
export const DAY_END = "2026-07-20T23:59:59.999Z";
