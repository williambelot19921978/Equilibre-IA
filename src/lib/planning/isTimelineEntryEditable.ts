import type { DayDisplayMode } from "./dayDisplayMode";
import type { DayTimelineEntry } from "./displayedDayTimeline";
import { isComputedFreeSlot } from "./applyTimelineEdit";

export function isTimelineEntryEditable(entry: DayTimelineEntry): boolean {
  if (entry.visualType === "wake" || entry.visualType === "sleep") {
    return false;
  }

  if (isComputedFreeSlot(entry)) {
    return true;
  }

  if (entry.calendarItemId && entry.origin === "persisted") {
    return true;
  }

  if (entry.origin === "computed" && entry.blockKind === "structural") {
    return true;
  }

  if (entry.blockKind === "override") {
    return true;
  }

  return false;
}

export function canEditTimelineOnDate(displayMode: DayDisplayMode): boolean {
  return displayMode === "live" || displayMode === "future";
}

export function canModifyTimelineEntry(
  entry: DayTimelineEntry,
  displayMode: DayDisplayMode,
): boolean {
  return canEditTimelineOnDate(displayMode) && isTimelineEntryEditable(entry);
}
