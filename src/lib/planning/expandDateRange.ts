import { addDaysToDate } from "../time/deviceClock";

/** Liste toutes les dates incluses entre start et end (inclus). */
export function expandDateRange(start: string, end: string): string[] {
  if (start > end) return [start, end];

  const dates: string[] = [];
  let current = start;
  let guard = 0;

  while (current <= end && guard < 400) {
    dates.push(current);
    current = addDaysToDate(current, 1);
    guard += 1;
  }

  return dates;
}
