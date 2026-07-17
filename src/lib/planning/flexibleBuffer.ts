import { getDurationMinutes } from "../time/daySchedule";
import type { DayTimelineEntry } from "./displayedDayTimeline";
import type { FlexibleBuffer } from "../../types/flexibleBuffer";

export function timelineEntryToFlexibleBuffer(
  entry: DayTimelineEntry,
  minimumRemainingMinutes = 10,
): FlexibleBuffer | null {
  if (entry.blockKind !== "free_slot" && entry.visualType !== "free") {
    return null;
  }

  const durationMinutes = getDurationMinutes(entry.startsAt, entry.endsAt);

  return {
    id: entry.id,
    startsAt: entry.startsAt,
    endsAt: entry.endsAt,
    durationMinutes,
    absorbable: true,
    minimumRemainingMinutes,
    preferredUse: entry.freeSlotKind === "evening_available" ? "recovery" : "free_time",
    source: entry.isEngineMargin ? "margin" : "computed",
  };
}

export function extractFlexibleBuffers(
  entries: DayTimelineEntry[],
  minimumRemainingMinutes = 10,
): FlexibleBuffer[] {
  return entries
    .map((entry) => timelineEntryToFlexibleBuffer(entry, minimumRemainingMinutes))
    .filter((buffer): buffer is FlexibleBuffer => buffer !== null);
}
