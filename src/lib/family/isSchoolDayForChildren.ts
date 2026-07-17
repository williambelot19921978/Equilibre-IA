import { getWeekdayKey } from "../time/daySchedule";

export type SchoolDayContext = {
  childrenCount: number;
  childrenVacation?: boolean;
  disableSchoolDeparture?: boolean;
  schoolClosed?: boolean;
  isWeekend?: boolean;
};

const WEEKEND_DAYS = new Set(["saturday", "sunday"]);

export function isSchoolDayForChildren(
  date: string,
  context: SchoolDayContext,
): boolean {
  if (context.childrenCount <= 0) {
    return false;
  }

  if (context.childrenVacation || context.disableSchoolDeparture) {
    return false;
  }

  if (context.schoolClosed) {
    return false;
  }

  const weekday = getWeekdayKey(date);
  if (context.isWeekend ?? WEEKEND_DAYS.has(weekday)) {
    return false;
  }

  return true;
}
