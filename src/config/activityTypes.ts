import type { DayTimelineVisualType } from "../lib/planning/displayedDayTimeline";
import type { CalendarItemType } from "./calendarItemTypes";

export const ACTIVITY_TYPES = [
  { label: "Travail", value: "work" },
  { label: "Rendez-vous", value: "appointment" },
  { label: "Tâche", value: "task" },
  { label: "Enfants", value: "children" },
  { label: "Sport", value: "sport" },
  { label: "Repos", value: "rest" },
  { label: "Trajet", value: "commute" },
  { label: "Événement personnel", value: "personal_event" },
  { label: "Autre", value: "other" },
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number]["value"];

export function defaultTitleForActivity(activityType: ActivityType): string {
  const match = ACTIVITY_TYPES.find((item) => item.value === activityType);
  return match?.label ?? "Activité";
}

export function mapActivityTypeToVisualType(
  activityType: ActivityType,
): DayTimelineVisualType {
  if (activityType === "work") return "work";
  if (activityType === "appointment") return "appointment";
  if (activityType === "task") return "task";
  if (activityType === "children") return "children_routine";
  if (activityType === "sport") return "sport";
  if (activityType === "rest") return "rest";
  if (activityType === "commute") return "commute";
  return "appointment";
}

export function mapActivityTypeToCalendarItemType(
  activityType: ActivityType,
): CalendarItemType {
  if (activityType === "task" || activityType === "sport") {
    return "task";
  }

  return "event";
}

export function mapActivityTypeToConstraintType(
  activityType: ActivityType,
): string {
  if (activityType === "work") return "work";
  if (activityType === "commute") return "commute_out";
  if (activityType === "children") return "evening_routine";
  if (activityType === "appointment") return "appointment";
  if (activityType === "personal_event") return "free_event";
  return activityType;
}
