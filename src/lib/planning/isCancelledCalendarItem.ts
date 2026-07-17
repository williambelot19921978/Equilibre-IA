import type { CalendarItemRecord } from "../../types/database";

export function isCancelledCalendarItem(item: CalendarItemRecord): boolean {
  const status = item.details?.status as string | undefined;
  return (
    status === "cancelled" ||
    status === "cancelled_for_today" ||
    item.details?.cancelledForToday === true
  );
}
