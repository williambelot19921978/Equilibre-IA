import type { DayTimelineEntry } from "./displayedDayTimeline";
import { isHardConstraint } from "./blockActionHelpers";

export function isTimelineEntryCancellable(entry: DayTimelineEntry): boolean {
  if (entry.visualType === "wake" || entry.visualType === "sleep") {
    return false;
  }

  if (entry.completed) {
    return false;
  }

  if (entry.blockKind === "free_slot") {
    return false;
  }

  if (isHardConstraint(entry)) {
    return false;
  }

  return true;
}
