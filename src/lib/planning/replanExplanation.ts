import {
  defaultTitleForActivity,
  type ActivityType,
} from "../../config/activityTypes";
import type { CalendarItemRecord } from "../../types/database";
import type { ManualBlockAdjustment } from "../../types/manualBlockAdjustment";
import type { TimelineEditStrategy } from "./applyTimelineEdit";
import { formatTimeRangeLabel } from "./freeSlotEntries";
import type { DayTimelineEntry } from "./displayedDayTimeline";

function durationMinutes(startsAt: string, endsAt: string): number {
  return Math.round(
    (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60_000,
  );
}

export function buildReplanExplanation({
  adjustment,
  previousItems,
  nextItems,
  activityType,
  strategy,
  entry,
}: {
  adjustment: ManualBlockAdjustment;
  previousItems: CalendarItemRecord[];
  nextItems: CalendarItemRecord[];
  activityType?: ActivityType;
  strategy?: TimelineEditStrategy;
  entry?: DayTimelineEntry;
}): string {
  const originalDuration = durationMinutes(
    adjustment.originalStartsAt,
    adjustment.originalEndsAt,
  );
  const newDuration = durationMinutes(
    adjustment.newStartsAt,
    adjustment.newEndsAt,
  );
  const durationDelta = newDuration - originalDuration;

  const movedTasks = nextItems
    .filter((item) => item.item_type === "task" && item.source === "ai")
    .filter((next) => {
      const previous = previousItems.find((item) => item.id === next.id);
      return previous && previous.starts_at !== next.starts_at;
    })
    .map((item) => item.title);

  const parts: string[] = [];

  if (
    strategy === "create_manual_item" &&
    (entry?.blockKind === "free_slot" || entry?.visualType === "free")
  ) {
    const label = activityType
      ? defaultTitleForActivity(activityType).toLowerCase()
      : "activité";
    parts.push(
      `Le créneau ${formatTimeRangeLabel(adjustment.newStartsAt, adjustment.newEndsAt)} est maintenant réservé au ${label}.`,
    );
    parts.push(
      "J’ai réorganisé les autres tâches autour de cette contrainte.",
    );
  } else if (durationDelta > 0) {
    parts.push(
      `Ce bloc dure maintenant ${durationDelta} minute${durationDelta > 1 ? "s" : ""} de plus.`,
    );
  } else if (durationDelta < 0) {
    parts.push(
      `Ce bloc a été raccourci de ${Math.abs(durationDelta)} minute${Math.abs(durationDelta) > 1 ? "s" : ""}.`,
    );
  } else if (adjustment.originalStartsAt !== adjustment.newStartsAt) {
    parts.push("L’horaire de ce bloc a été déplacé.");
  }

  if (movedTasks.length > 0) {
    parts.push(`J’ai déplacé : ${movedTasks.join(", ")}.`);
  } else if (
    parts.length === 0 ||
    (!parts.some((part) => part.includes("réorganisé")) &&
      (durationDelta !== 0 ||
        adjustment.originalStartsAt !== adjustment.newStartsAt))
  ) {
    parts.push("Le reste de la journée a été recalculé autour de ce changement.");
  }

  if (adjustment.reason) {
    parts.push(adjustment.reason);
  }

  return parts.join(" ") || "Modification enregistrée.";
}
