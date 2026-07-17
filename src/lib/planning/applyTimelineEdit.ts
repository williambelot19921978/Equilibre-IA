import { isMarginCalendarItem } from "../../config/calendarItemTypes";
import type { DayTimelineEntry } from "./displayedDayTimeline";

export type TimelineEditStrategy =
  | "create_manual_item"
  | "update_existing_item"
  | "create_daily_override";

export function isComputedFreeSlot(entry: DayTimelineEntry): boolean {
  return entry.blockKind === "free_slot" || entry.visualType === "free";
}

export function isEngineMarginEntry(entry: DayTimelineEntry): boolean {
  return Boolean(entry.isEngineMargin);
}

export function resolveTimelineEditStrategy(
  entry: DayTimelineEntry,
): TimelineEditStrategy {
  if (isComputedFreeSlot(entry) || isEngineMarginEntry(entry)) {
    return "create_manual_item";
  }

  if (
    entry.calendarItemId &&
    entry.origin === "persisted" &&
    !entry.isEngineMargin
  ) {
    return "update_existing_item";
  }

  if (entry.origin === "computed" && entry.blockKind === "structural") {
    return "create_daily_override";
  }

  return "create_manual_item";
}

export function shouldCreateInsteadOfUpdate(
  entry: DayTimelineEntry,
): boolean {
  return resolveTimelineEditStrategy(entry) !== "update_existing_item";
}

export function isMarginCalendarRecord(
  item: Parameters<typeof isMarginCalendarItem>[0],
): boolean {
  return isMarginCalendarItem(item);
}
