import type { CalendarActivityCategory } from "./classifyCalendarItemActivity";

export function resolveCompletionStatusLabel({
  activityCategory,
  isWorkout = false,
  title = "",
}: {
  activityCategory: CalendarActivityCategory;
  isWorkout?: boolean;
  title?: string;
}): string {
  if (isWorkout || activityCategory === "sport") {
    return "Séance effectuée";
  }

  if (activityCategory === "spiritual") {
    return "Temps spirituel réalisé";
  }

  const lower = title.toLowerCase();
  if (
    activityCategory === "task" &&
    (lower.includes("révis") || lower.includes("revision") || lower.includes("étude"))
  ) {
    return "Session de révision terminée";
  }

  if (activityCategory === "work") {
    return "Tâche terminée";
  }

  if (activityCategory === "leisure") {
    return "Activité réalisée";
  }

  if (activityCategory === "children") {
    return "Objectif familial réalisé";
  }

  return "Effectué";
}
