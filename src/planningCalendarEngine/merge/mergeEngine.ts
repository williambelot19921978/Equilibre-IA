/**
 * EPIC 5A — Merge Engine.
 * Fuses provider outputs into a single timeline — provider-agnostic ordering.
 */

import type { CalendarItem, Timeline } from "../types/calendarItem";

function sortByStart(items: readonly CalendarItem[]): CalendarItem[] {
  return [...items].sort(
    (left, right) => new Date(left.start).getTime() - new Date(right.start).getTime(),
  );
}

function dedupeItems(items: readonly CalendarItem[]): CalendarItem[] {
  const byKey = new Map<string, CalendarItem>();

  for (const item of items) {
    const key = item.id;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, item);
      continue;
    }

    const existingUpdated = String(existing.metadata.updatedAt ?? "");
    const nextUpdated = String(item.metadata.updatedAt ?? "");
    if (nextUpdated >= existingUpdated) {
      byKey.set(key, item);
    }
  }

  return sortByStart([...byKey.values()]);
}

export function mergeCalendarItems(input: {
  readonly items: readonly CalendarItem[];
  readonly rangeStart: string;
  readonly rangeEnd: string;
  readonly timezone: string;
}): Timeline {
  return {
    items: dedupeItems(input.items),
    rangeStart: input.rangeStart,
    rangeEnd: input.rangeEnd,
    timezone: input.timezone,
  };
}

export function countMergedEvents(timeline: Timeline): number {
  return timeline.items.filter(
    (item) => item.type !== "free" && item.status !== "cancelled",
  ).length;
}
