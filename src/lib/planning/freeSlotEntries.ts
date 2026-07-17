import type { DayTimelineEntry } from "./displayedDayTimeline";
import {
  formatFreeSlotTitle,
} from "./splitFreeSlots";
import { resolveBedWindDownEnd } from "../time/bedTime";
import { computeEveningFreeSegments } from "./computeEveningFreeSegments";

const MIN_FREE_SLOT_MINUTES = 15;
const EVENING_WIND_DOWN_MINUTES = 30;

function durationMinutes(startsAt: string, endsAt: string): number {
  return Math.round(
    (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60_000,
  );
}

function formatDurationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (hours > 0 && remainder > 0) {
    return `${hours} h ${remainder} min`;
  }

  if (hours > 0) {
    return `${hours} h`;
  }

  return `${minutes} min`;
}

function sortByStart(entries: DayTimelineEntry[]): DayTimelineEntry[] {
  return [...entries].sort(
    (a, b) =>
      new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
}

function mergeBlockingIntervals(
  entries: DayTimelineEntry[],
): Array<{ startsAt: string; endsAt: string }> {
  const intervals = entries
    .filter((entry) => durationMinutes(entry.startsAt, entry.endsAt) > 0)
    .map((entry) => ({
      startsAt: entry.startsAt,
      endsAt: entry.endsAt,
    }))
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );

  const merged: Array<{ startsAt: string; endsAt: string }> = [];

  for (const interval of intervals) {
    const last = merged[merged.length - 1];

    if (!last) {
      merged.push(interval);
      continue;
    }

    if (new Date(interval.startsAt).getTime() <= new Date(last.endsAt).getTime()) {
      if (new Date(interval.endsAt).getTime() > new Date(last.endsAt).getTime()) {
        last.endsAt = interval.endsAt;
      }
      continue;
    }

    merged.push(interval);
  }

  return merged;
}

export function computeEveningAvailableSlot({
  occupiedEntries,
  adultBedTime,
  date,
  windDownMinutes = EVENING_WIND_DOWN_MINUTES,
}: {
  occupiedEntries: DayTimelineEntry[];
  adultBedTime: string;
  date: string;
  windDownMinutes?: number;
}): DayTimelineEntry | null {
  const eveningRoutine = occupiedEntries.find(
    (entry) => entry.constraintType === "evening_routine",
  );

  if (!eveningRoutine) {
    return null;
  }

  const startsAt = eveningRoutine.endsAt;
  const endsAt = resolveBedWindDownEnd({
    date,
    bedTime: adultBedTime,
    windDownMinutes,
  });
  const minutes = durationMinutes(startsAt, endsAt);

  if (minutes < MIN_FREE_SLOT_MINUTES) {
    return null;
  }

  return {
    id: `evening-available-${startsAt}`,
    visualType: "free",
    title: `Temps disponible — ${formatDurationLabel(minutes)}`,
    startsAt,
    endsAt,
    locked: false,
    origin: "computed",
    blockKind: "free_slot",
    freeSlotKind: "evening_available",
    explanation:
      "Créneau utile après le coucher des enfants, avant ton coucher.",
  };
}

export function computeFreeSlotEntries({
  occupiedEntries,
  dayStart,
  dayEnd,
  minMinutes = MIN_FREE_SLOT_MINUTES,
  eveningSlot,
}: {
  occupiedEntries: DayTimelineEntry[];
  dayStart: string;
  dayEnd: string;
  minMinutes?: number;
  eveningSlot?: DayTimelineEntry | null;
}): DayTimelineEntry[] {
  const blocking = mergeBlockingIntervals(
    occupiedEntries.filter(
      (entry) =>
        entry.blockKind !== "free_slot" &&
        entry.visualType !== "free" &&
        !entry.isEngineMargin,
    ),
  );

  const freeSlots: DayTimelineEntry[] = [];
  let cursor = dayStart;

  for (const block of blocking) {
    const gapMinutes = durationMinutes(cursor, block.startsAt);

    if (gapMinutes >= minMinutes) {
      const isEveningOverlap =
        eveningSlot &&
        new Date(cursor).getTime() >= new Date(eveningSlot.startsAt).getTime() &&
        new Date(block.startsAt).getTime() <= new Date(eveningSlot.endsAt).getTime();

      if (!isEveningOverlap) {
        freeSlots.push({
          id: `free-slot-${cursor}-${block.startsAt}`,
          visualType: "free",
          title: formatFreeSlotTitle(cursor, block.startsAt),
          startsAt: cursor,
          endsAt: block.startsAt,
          locked: false,
          origin: "computed",
          blockKind: "free_slot",
          freeSlotKind: "day",
        });
      }
    }

    if (new Date(block.endsAt).getTime() > new Date(cursor).getTime()) {
      cursor = block.endsAt;
    }
  }

  const tailMinutes = durationMinutes(cursor, dayEnd);

  if (tailMinutes >= minMinutes) {
    const overlapsEvening =
      eveningSlot &&
      new Date(cursor).getTime() < new Date(eveningSlot.endsAt).getTime() &&
      new Date(dayEnd).getTime() > new Date(eveningSlot.startsAt).getTime();

    if (!overlapsEvening) {
      freeSlots.push({
        id: `free-slot-${cursor}-${dayEnd}`,
        visualType: "free",
        title: formatFreeSlotTitle(cursor, dayEnd),
        startsAt: cursor,
        endsAt: dayEnd,
        locked: false,
        origin: "computed",
        blockKind: "free_slot",
        freeSlotKind: "day",
      });
    }
  }

  const slots = eveningSlot
    ? [
        ...freeSlots,
        ...computeEveningFreeSegments({
          occupiedEntries,
          eveningStart: eveningSlot.startsAt,
          eveningEnd: eveningSlot.endsAt,
          minMinutes,
        }),
      ]
    : freeSlots;

  return sortByStart(slots);
}

export function formatTimeRangeLabel(startsAt: string, endsAt: string): string {
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${formatter.format(new Date(startsAt))}–${formatter.format(new Date(endsAt))}`;
}
