import type { DayTimelineEntry } from "./displayedDayTimeline";
import type {
  AdjustmentScope,
  ManualBlockAdjustment,
} from "../../types/manualBlockAdjustment";

export function validateScopeForEdit(scope: AdjustmentScope): string | null {
  if (scope === "period") {
    return "Les modifications de période se font dans « Contexte familial » pour l’instant.";
  }

  if (scope === "recurring") {
    return "Les modifications habituelles se font dans « Mon quotidien » pour l’instant.";
  }

  return null;
}

export function isoToTimeInput(iso: string): string {
  const date = new Date(iso);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function combineDateAndLocalTime(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

export function buildManualBlockAdjustment({
  entry,
  startsAt,
  endsAt,
  userId,
  scope,
  reason,
}: {
  entry: DayTimelineEntry;
  startsAt: string;
  endsAt: string;
  userId: string;
  scope: AdjustmentScope;
  reason?: string;
}): ManualBlockAdjustment {
  return {
    blockId: entry.calendarItemId ?? entry.id,
    originalStartsAt: entry.startsAt,
    originalEndsAt: entry.endsAt,
    newStartsAt: startsAt,
    newEndsAt: endsAt,
    reason,
    scope,
    createdBy: userId,
    createdAt: new Date().toISOString(),
  };
}
