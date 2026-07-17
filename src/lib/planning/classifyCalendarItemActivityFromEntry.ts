import type { DayTimelineEntry } from "./displayedDayTimeline";
import type { ClassifiedCalendarItemActivity } from "./classifyCalendarItemActivity";

export function classifyCalendarItemActivityFromEntry(
  entry: DayTimelineEntry,
): ClassifiedCalendarItemActivity {
  if (entry.sportClassification) {
    return entry.sportClassification;
  }

  const activityType = entry.activityType as string | undefined;

  const isSport =
    entry.visualType === "sport" ||
    activityType === "sport" ||
    activityType === "workout";

  let activityCategory: ClassifiedCalendarItemActivity["activityCategory"] = "task";
  if (isSport) activityCategory = "sport";
  else if (entry.visualType === "work") activityCategory = "work";
  else if (activityType === "revision" || activityType === "study") activityCategory = "study";
  else if (activityType === "spiritual") activityCategory = "spiritual";
  else if (activityType === "leisure") activityCategory = "leisure";
  else if (entry.visualType === "children_routine") activityCategory = "children";
  else if (entry.visualType === "appointment") activityCategory = "appointment";

  return {
    activityCategory,
    isSport,
    sportType: null,
    isManual: entry.origin === "persisted",
    isEditable: true,
    isCancellable: !entry.locked,
    isMovable: !entry.locked,
    isCompletable: true,
    visualType: entry.visualType,
    hasWorkoutSession: Boolean(entry.workoutSession),
  };
}
