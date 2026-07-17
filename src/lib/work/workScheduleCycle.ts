import { addDaysToDate } from "../time/deviceClock";
import { getWeekdayKey } from "../time/daySchedule";
import type { WeekdayKey } from "../../types/workSchedule";

/** Retourne le lundi de la semaine calendaire contenant `date`. */
export function getMondayOfWeek(date: string): string {
  const weekday = getWeekdayKey(date);
  const offsets: Record<WeekdayKey, number> = {
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4,
    saturday: 5,
    sunday: 6,
  };
  return addDaysToDate(date, -offsets[weekday]);
}

/** Index de semaine dans le cycle (0-based), ancré sur referenceWeek. */
export function getCycleWeekIndex({
  date,
  referenceWeek,
  cycleLengthWeeks,
}: {
  date: string;
  referenceWeek: string;
  cycleLengthWeeks: number;
}): number {
  if (cycleLengthWeeks <= 1) return 0;

  const refMonday = getMondayOfWeek(referenceWeek);
  const dateMonday = getMondayOfWeek(date);
  const refMs = new Date(`${refMonday}T12:00:00`).getTime();
  const dateMs = new Date(`${dateMonday}T12:00:00`).getTime();
  const weeksDiff = Math.round((dateMs - refMs) / (7 * 24 * 60 * 60 * 1000));
  return ((weeksDiff % cycleLengthWeeks) + cycleLengthWeeks) % cycleLengthWeeks;
}

export function getDateForWeekdayInWeek(
  weekMonday: string,
  weekday: WeekdayKey,
): string {
  const offsets: Record<WeekdayKey, number> = {
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4,
    saturday: 5,
    sunday: 6,
  };
  return addDaysToDate(weekMonday, offsets[weekday]);
}
