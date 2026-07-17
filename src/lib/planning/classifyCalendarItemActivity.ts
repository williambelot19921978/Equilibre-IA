import {
  mapActivityTypeToVisualType,
  type ActivityType,
} from "../../config/activityTypes";
import {
  mapCalendarItemTypeToPlannedBlockType,
} from "../../config/calendarItemTypes";
import { isManualCalendarSource } from "../../config/calendarSources";
import type { CalendarItemRecord } from "../../types/database";
import type { DayTimelineVisualType } from "./displayedDayTimeline";

export type CalendarActivityCategory =
  | "sport"
  | "study"
  | "work"
  | "task"
  | "appointment"
  | "rest"
  | "commute"
  | "children"
  | "spiritual"
  | "leisure"
  | "structural"
  | "free"
  | "other";

export type ClassifiedCalendarItemActivity = {
  activityCategory: CalendarActivityCategory;
  isSport: boolean;
  sportType: string | null;
  isManual: boolean;
  isEditable: boolean;
  isCancellable: boolean;
  isMovable: boolean;
  isCompletable: boolean;
  visualType: DayTimelineVisualType;
  hasWorkoutSession: boolean;
};

const HARD_CONSTRAINT_TYPES = new Set([
  "wake",
  "sleep",
  "work",
  "commute_out",
  "commute_in",
  "morning_routine",
  "evening_routine",
]);

function normalizeSportType(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.trim().length === 0) return null;
  return raw;
}

function resolveActivityCategory(
  item: CalendarItemRecord,
  details: Record<string, unknown>,
): CalendarActivityCategory {
  if (details.businessType === "sport" || details.category === "sport") {
    return "sport";
  }

  if (details.constraintType === "sport") return "sport";

  if (details.businessType === "study") return "study";
  if (details.activityType === "revision") return "study";

  if (typeof details.activityType === "string") {
    const activity = details.activityType as ActivityType;
    if (activity === "sport") return "sport";
    if (activity === "work") return "work";
    if (activity === "task") return "task";
    if (activity === "rest") return "rest";
    if (activity === "commute") return "commute";
    if (activity === "children") return "children";
    if (activity === "appointment" || activity === "personal_event") {
      return "appointment";
    }
    if (details.suggestionType === "spiritual") return "spiritual";
    if (details.suggestionType === "leisure") return "leisure";
  }

  if (typeof details.suggestionType === "string") {
    if (details.suggestionType === "sport") return "sport";
    if (details.suggestionType === "study") return "study";
    if (details.suggestionType === "leisure") return "leisure";
  }

  if (details.workoutSession) return "sport";

  const constraintType = details.constraintType;
  if (typeof constraintType === "string") {
    if (constraintType === "sport") return "sport";
    if (constraintType === "work") return "work";
    if (
      constraintType === "morning_routine" ||
      constraintType === "evening_routine"
    ) {
      return "children";
    }
    if (constraintType === "commute_out" || constraintType === "commute_in") {
      return "commute";
    }
    if (constraintType === "wake" || constraintType === "sleep") {
      return "structural";
    }
  }

  const blockType = mapCalendarItemTypeToPlannedBlockType(
    item.item_type,
    details,
  );
  if (blockType === "margin") return "free";
  if (blockType === "buffer") return "task";
  if (blockType === "task") return "task";

  const title = item.title.toLowerCase();
  if (title.includes("sport") || title.includes("séance")) return "sport";

  return "appointment";
}

export function classifyCalendarItemActivity(
  item: CalendarItemRecord,
): ClassifiedCalendarItemActivity {
  const details = (item.details ?? {}) as Record<string, unknown>;
  const activityCategory = resolveActivityCategory(item, details);
  const isSport = activityCategory === "sport";
  const isManual =
    isManualCalendarSource(item.source) ||
    details.origin === "calendar_ui" ||
    details.origin === "timeline_edit" ||
    Boolean(details.modifiedByUser);

  const constraintType =
    typeof details.constraintType === "string" ? details.constraintType : null;
  const isHard =
    constraintType !== null && HARD_CONSTRAINT_TYPES.has(constraintType);

  const visualType =
    typeof details.visualType === "string"
      ? (details.visualType as DayTimelineVisualType)
      : typeof details.activityType === "string"
        ? mapActivityTypeToVisualType(details.activityType as ActivityType)
        : isSport
          ? "sport"
          : activityCategory === "work"
            ? "work"
            : activityCategory === "task"
              ? "task"
              : "appointment";

  const sportType =
    normalizeSportType(details.sportType) ??
    (isSport ? "workout" : null);

  const hasWorkoutSession = Boolean(details.workoutSession);

  return {
    activityCategory,
    isSport,
    sportType,
    isManual,
    isEditable: !isHard || isSport || isManual,
    isCancellable: !isHard,
    isMovable: !isHard || isSport,
    isCompletable: activityCategory !== "structural" && activityCategory !== "free",
    visualType,
    hasWorkoutSession,
  };
}

export function isSportCalendarItem(item: CalendarItemRecord): boolean {
  return classifyCalendarItemActivity(item).isSport;
}
