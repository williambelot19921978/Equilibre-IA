/**
 * EPIC 6B — Jeux de données pour tests proactifs.
 */

import type { CalendarEventInput } from "../types/proactiveTypes";

const BASE_DATE = "2026-07-20";

export function meetingEvent(startHour: number): CalendarEventInput {
  return {
    id: `meeting-${startHour}`,
    title: "Réunion Sprint",
    start: `${BASE_DATE}T${String(startHour).padStart(2, "0")}:00:00.000Z`,
    end: `${BASE_DATE}T${String(startHour + 1).padStart(2, "0")}:00:00.000Z`,
    category: "travail",
  };
}

export function sportEvent(startHour: number): CalendarEventInput {
  return {
    id: `sport-${startHour}`,
    title: "Basic Fit",
    start: `${BASE_DATE}T${String(startHour).padStart(2, "0")}:00:00.000Z`,
    end: `${BASE_DATE}T${String(startHour + 1).padStart(2, "0")}:00:00.000Z`,
    category: "sport",
  };
}

export function focusEvent(): CalendarEventInput {
  return {
    id: "focus-1",
    title: "Deep work — révision",
    start: `${BASE_DATE}T14:00:00.000Z`,
    end: `${BASE_DATE}T16:00:00.000Z`,
    category: "etudes",
  };
}

export function vacationEvent(): CalendarEventInput {
  return {
    id: "vacation-1",
    title: "Vacances été",
    start: `${BASE_DATE}T00:00:00.000Z`,
    end: `${BASE_DATE}T23:59:00.000Z`,
    category: "personnel",
  };
}

export const EMPTY_DAY_INPUT = {
  userId: "proactive-test",
  date: BASE_DATE,
  now: `${BASE_DATE}T10:00:00.000Z`,
  calendarEvents: [] as CalendarEventInput[],
  mentalLoad: 30,
  balanceScore: 60,
  freeMinutes: 180,
  conflictCount: 0,
  taskTodoCount: 1,
};

export const BUSY_DAY_INPUT = {
  ...EMPTY_DAY_INPUT,
  mentalLoad: 85,
  balanceScore: 35,
  freeMinutes: 20,
  conflictCount: 2,
  taskTodoCount: 8,
  calendarEvents: [meetingEvent(9), meetingEvent(11), sportEvent(18)],
};

export const SLEEP_HOUR_NOW = `${BASE_DATE}T23:30:00.000Z`;

export const MEETING_NOW = `${BASE_DATE}T09:30:00.000Z`;

export const FOCUS_NOW = `${BASE_DATE}T15:00:00.000Z`;

export const VACATION_INPUT = {
  ...EMPTY_DAY_INPUT,
  onVacation: true,
  calendarEvents: [vacationEvent()],
};

export const ALL_SCENARIOS = [
  { id: "empty", label: "Journée vide", input: EMPTY_DAY_INPUT },
  { id: "busy", label: "Journée chargée", input: BUSY_DAY_INPUT },
  { id: "vacation", label: "Vacances", input: VACATION_INPUT },
] as const;
