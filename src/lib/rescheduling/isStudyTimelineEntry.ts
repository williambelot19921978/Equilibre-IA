import type { DayTimelineEntry } from "../planning/displayedDayTimeline";
import { classifyCalendarItemActivityFromEntry } from "../planning/classifyCalendarItemActivityFromEntry";
import { isHardConstraint } from "../planning/blockActionHelpers";

export function isStudyTimelineEntry(entry: DayTimelineEntry): boolean {
  if (entry.completed) return false;
  if (isHardConstraint(entry)) return false;
  if (entry.blockKind === "free_slot") return false;

  const classified = classifyCalendarItemActivityFromEntry(entry);
  return classified.activityCategory === "study";
}
