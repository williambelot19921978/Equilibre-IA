import type { CalendarColorCategory } from "../../config/calendarColors";
import type { CalendarItemRecord } from "../../types";
import type { DayTimelineVisualType } from "./displayedDayTimeline";
import type { FamilyContextPeriodRecord } from "../../types/familyContext";

export function resolveVisualTypeColor(
  visualType: DayTimelineVisualType,
): CalendarColorCategory {
  if (visualType === "work") return "work";
  if (visualType === "vacation") return "vacation";
  if (visualType === "travel") return "commute";
  if (visualType === "rest_day") return "rest";
  if (visualType === "appointment") return "appointment";
  if (visualType === "children_routine") return "children";
  if (visualType === "sport") return "sport";
  if (visualType === "task") return "study";
  if (visualType === "rest" || visualType === "buffer") return "rest";
  if (visualType === "commute") return "commute";
  if (visualType === "free") return "free";
  return "personal";
}

export function resolveCalendarItemColor(
  item: CalendarItemRecord,
): CalendarColorCategory {
  const details = item.details ?? {};

  if (typeof details.activityType === "string") {
    const activity = details.activityType;
    if (activity === "work") return "work";
    if (activity === "sport") return "sport";
    if (activity === "study") return "study";
    if (activity === "spiritual") return "spiritual";
    if (activity === "family_outing" || activity === "children") return "family";
    if (activity === "calm" || activity === "rest") return "rest";
    if (activity === "commute") return "commute";
    if (activity === "appointment") return "appointment";
    return "personal";
  }

  if (typeof details.visualType === "string") {
    return resolveVisualTypeColor(details.visualType as DayTimelineVisualType);
  }

  if (typeof details.constraintType === "string") {
    const constraint = details.constraintType;
    if (constraint === "work") return "work";
    if (constraint === "morning_routine" || constraint === "evening_routine") {
      return "children";
    }
    if (constraint === "commute_out" || constraint === "commute_in") {
      return "commute";
    }
    if (constraint === "appointment") return "appointment";
  }

  if (item.item_type === "task") return "study";
  if (item.item_type === "event") return "appointment";
  return "personal";
}

export function resolveVacationColor(
  period: FamilyContextPeriodRecord,
): CalendarColorCategory {
  if (period.context_type === "children_vacation") return "vacation";
  if (period.context_type === "user_vacation") return "vacation";
  return "vacation";
}

export function formatShortEventLabel(title: string, maxLength = 14): string {
  if (title.length <= maxLength) return title;
  return `${title.slice(0, maxLength - 1)}…`;
}
