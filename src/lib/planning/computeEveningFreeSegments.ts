import type { DayTimelineEntry } from "./displayedDayTimeline";
import { formatFreeSlotTitle } from "./splitFreeSlots";

function durationMinutes(startsAt: string, endsAt: string): number {
  return Math.round(
    (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60_000,
  );
}

function overlapsRange(
  startsAt: string,
  endsAt: string,
  rangeStart: string,
  rangeEnd: string,
): boolean {
  return (
    new Date(startsAt).getTime() < new Date(rangeEnd).getTime() &&
    new Date(endsAt).getTime() > new Date(rangeStart).getTime()
  );
}

function isOccupyingEveningBlock(entry: DayTimelineEntry): boolean {
  if (entry.blockKind === "free_slot") return false;
  if (entry.visualType === "free") return false;
  if (entry.isEngineMargin) return false;
  if (entry.origin === "persisted" || entry.calendarItemId) return true;
  if (entry.blockKind === "task" || entry.blockKind === "override") return true;
  if (
    entry.visualType === "task" ||
    entry.visualType === "sport" ||
    entry.visualType === "appointment"
  ) {
    return Boolean(entry.calendarItemId);
  }
  return false;
}

export function computeEveningFreeSegments({
  occupiedEntries,
  eveningStart,
  eveningEnd,
  minMinutes = 15,
}: {
  occupiedEntries: DayTimelineEntry[];
  eveningStart: string;
  eveningEnd: string;
  minMinutes?: number;
}): DayTimelineEntry[] {
  const blockers = occupiedEntries
    .filter(
      (entry) =>
        isOccupyingEveningBlock(entry) &&
        overlapsRange(entry.startsAt, entry.endsAt, eveningStart, eveningEnd),
    )
    .map((entry) => ({
      startsAt:
        new Date(entry.startsAt).getTime() < new Date(eveningStart).getTime()
          ? eveningStart
          : entry.startsAt,
      endsAt:
        new Date(entry.endsAt).getTime() > new Date(eveningEnd).getTime()
          ? eveningEnd
          : entry.endsAt,
    }))
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );

  const merged: Array<{ startsAt: string; endsAt: string }> = [];
  for (const blocker of blockers) {
    const last = merged[merged.length - 1];
    if (
      last &&
      new Date(blocker.startsAt).getTime() <= new Date(last.endsAt).getTime()
    ) {
      if (new Date(blocker.endsAt).getTime() > new Date(last.endsAt).getTime()) {
        last.endsAt = blocker.endsAt;
      }
      continue;
    }
    merged.push({ ...blocker });
  }

  const segments: DayTimelineEntry[] = [];
  let cursor = eveningStart;

  for (const blocker of merged) {
    const gapMinutes = durationMinutes(cursor, blocker.startsAt);
    if (gapMinutes >= minMinutes) {
      segments.push({
        id: `evening-available-${cursor}`,
        visualType: "free",
        title: formatFreeSlotTitle(cursor, blocker.startsAt),
        startsAt: cursor,
        endsAt: blocker.startsAt,
        locked: false,
        origin: "computed",
        blockKind: "free_slot",
        freeSlotKind: "evening_available",
        explanation:
          "Créneau utile après le coucher des enfants, avant ton coucher.",
      });
    }
    if (new Date(blocker.endsAt).getTime() > new Date(cursor).getTime()) {
      cursor = blocker.endsAt;
    }
  }

  const tailMinutes = durationMinutes(cursor, eveningEnd);
  if (tailMinutes >= minMinutes) {
    segments.push({
      id: `evening-available-${cursor}`,
      visualType: "free",
      title: formatFreeSlotTitle(cursor, eveningEnd),
      startsAt: cursor,
      endsAt: eveningEnd,
      locked: false,
      origin: "computed",
      blockKind: "free_slot",
      freeSlotKind: "evening_available",
      explanation:
        "Créneau utile après le coucher des enfants, avant ton coucher.",
    });
  }

  return segments;
}
