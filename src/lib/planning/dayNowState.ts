import type { DayTimelineEntry } from "./displayedDayTimeline";

export type DayNowState = {
  currentEntry: DayTimelineEntry | null;
  nextEntry: DayTimelineEntry | null;
  minutesUntilNext: number | null;
  nowMs: number;
};

function sortByStart(entries: DayTimelineEntry[]): DayTimelineEntry[] {
  return [...entries].sort(
    (a, b) =>
      new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
}

export function computeDayNowState(
  entries: DayTimelineEntry[],
  now: Date = new Date(),
): DayNowState {
  const nowMs = now.getTime();
  const sorted = sortByStart(
    entries.filter(
      (entry) =>
        entry.blockKind !== "free_slot" &&
        new Date(entry.endsAt).getTime() > new Date(entry.startsAt).getTime(),
    ),
  );

  const currentEntry =
    sorted.find(
      (entry) =>
        new Date(entry.startsAt).getTime() <= nowMs &&
        new Date(entry.endsAt).getTime() > nowMs,
    ) ?? null;

  const nextEntry =
    sorted.find((entry) => new Date(entry.startsAt).getTime() > nowMs) ?? null;

  const minutesUntilNext = nextEntry
    ? Math.max(
        0,
        Math.round(
          (new Date(nextEntry.startsAt).getTime() - nowMs) / 60_000,
        ),
      )
    : null;

  return {
    currentEntry,
    nextEntry,
    minutesUntilNext,
    nowMs,
  };
}

export type TimelineSegment = {
  kind: "past" | "current" | "future" | "now_marker";
  entries: DayTimelineEntry[];
};

export function splitTimelineForLiveDay(
  entries: DayTimelineEntry[],
  now: Date = new Date(),
  showPast: boolean,
): {
  pastEntries: DayTimelineEntry[];
  visibleEntries: DayTimelineEntry[];
  nowMarkerIndex: number | null;
} {
  const nowMs = now.getTime();
  const pastEntries: DayTimelineEntry[] = [];
  const visibleEntries: DayTimelineEntry[] = [];
  let nowMarkerIndex: number | null = null;

  for (const entry of entries) {
    const endMs = new Date(entry.endsAt).getTime();
    const startMs = new Date(entry.startsAt).getTime();

    if (endMs <= nowMs) {
      pastEntries.push(entry);
      continue;
    }

    if (startMs <= nowMs && endMs > nowMs) {
      visibleEntries.push(entry);
      continue;
    }

    visibleEntries.push(entry);
  }

  if (!showPast) {
    return { pastEntries, visibleEntries, nowMarkerIndex: null };
  }

  const merged = [...pastEntries, ...visibleEntries];
  const firstFutureIndex = merged.findIndex(
    (entry) => new Date(entry.startsAt).getTime() > nowMs,
  );

  if (firstFutureIndex > 0) {
    nowMarkerIndex = firstFutureIndex;
  } else if (pastEntries.length > 0 && visibleEntries.length > 0) {
    nowMarkerIndex = pastEntries.length;
  }

  return {
    pastEntries,
    visibleEntries: showPast ? merged : visibleEntries,
    nowMarkerIndex,
  };
}

export function getNowMarkerPercent(
  entries: DayTimelineEntry[],
  now: Date = new Date(),
): number | null {
  if (entries.length === 0) return null;

  const nowMs = now.getTime();
  const startMs = new Date(entries[0].startsAt).getTime();
  const endMs = new Date(entries[entries.length - 1].endsAt).getTime();

  if (nowMs < startMs || nowMs > endMs) return null;

  return ((nowMs - startMs) / (endMs - startMs)) * 100;
}
