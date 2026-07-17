import type { DayTimelineEntry } from "./displayedDayTimeline";
import type { NoTimeChoice } from "../../types/taskActivity";

export function isHardConstraint(entry: DayTimelineEntry): boolean {
  return (
    entry.locked &&
    (entry.constraintType === "work" ||
      entry.constraintType === "commute_out" ||
      entry.constraintType === "commute_in" ||
      entry.visualType === "wake" ||
      entry.visualType === "sleep")
  );
}

export function buildNoTimeExplanation(
  choice: NoTimeChoice,
  title: string,
  recoveryReason?: string,
): string {
  if (choice === "cancel_today") {
    return `« ${title} » est annulée pour aujourd'hui.${recoveryReason ? ` ${recoveryReason}` : ""}`;
  }
  if (choice === "postpone") {
    return `« ${title} » est reportée — je recalcule ta journée.${recoveryReason ? ` ${recoveryReason}` : ""}`;
  }
  if (choice === "shorten_10" || choice === "shorten_15") {
    const minutes = choice === "shorten_10" ? 10 : 15;
    return `« ${title} » est réduite à ${minutes} minutes.${recoveryReason ? ` ${recoveryReason}` : ""}`;
  }
  return `« ${title} » est conservée.`;
}
