import {
  isBlockingCalendarItemType,
  isMarginCalendarItem,
} from "../../config/calendarItemTypes";
import type { CalendarItemRecord } from "../../types";

export type FreeSlotSummary = {
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
} | null;

export function computeNextFreeSlot(
  items: CalendarItemRecord[],
  now: Date = new Date(),
): FreeSlotSummary {
  const blocking = items
    .filter((item) => isBlockingCalendarItemType(item.item_type))
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );

  const nowMs = now.getTime();

  if (blocking.length === 0) {
    return null;
  }

  for (let index = 0; index < blocking.length; index += 1) {
    const blockStart = new Date(blocking[index].starts_at).getTime();
    const gapStart = index === 0 ? nowMs : new Date(blocking[index - 1].ends_at).getTime();
    const effectiveStart = Math.max(gapStart, nowMs);

    if (blockStart > effectiveStart) {
      const durationMinutes = Math.round(
        (blockStart - effectiveStart) / 60_000,
      );

      if (durationMinutes >= 10) {
        return {
          startsAt: new Date(effectiveStart).toISOString(),
          endsAt: blocking[index].starts_at,
          durationMinutes,
        };
      }
    }
  }

  const lastEnd = new Date(blocking[blocking.length - 1].ends_at).getTime();

  if (lastEnd > nowMs) {
    const durationMinutes = Math.round((lastEnd - nowMs) / 60_000);

    if (durationMinutes >= 10) {
      return {
        startsAt: new Date(lastEnd).toISOString(),
        endsAt: new Date(lastEnd + durationMinutes * 60_000).toISOString(),
        durationMinutes,
      };
    }
  }

  return null;
}

export function computeFillPercentage(items: CalendarItemRecord[]): number {
  const taskMinutes = items
    .filter((item) => item.item_type === "task")
    .reduce(
      (sum, item) =>
        sum +
        Math.round(
          (new Date(item.ends_at).getTime() -
            new Date(item.starts_at).getTime()) /
            60_000,
        ),
      0,
    );

  const marginItem = items.find((item) => isMarginCalendarItem(item));
  const freeMinutes = marginItem
    ? Math.round(
        (new Date(marginItem.ends_at).getTime() -
          new Date(marginItem.starts_at).getTime()) /
          60_000,
      )
    : 0;

  const total = taskMinutes + freeMinutes;

  if (total <= 0) {
    return 0;
  }

  return Math.round((taskMinutes / total) * 100);
}
