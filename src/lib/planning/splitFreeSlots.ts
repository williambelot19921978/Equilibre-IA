const MIN_GAP_MINUTES = 15;
const MAX_FREE_CHUNK_MINUTES = 120;

function durationMinutes(startsAt: string, endsAt: string): number {
  return Math.round(
    (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60_000,
  );
}

function mergeBlockingIntervals(
  intervals: Array<{ startsAt: string; endsAt: string }>,
): Array<{ startsAt: string; endsAt: string }> {
  const sorted = [...intervals].sort(
    (a, b) =>
      new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  const merged: Array<{ startsAt: string; endsAt: string }> = [];

  for (const interval of sorted) {
    const last = merged[merged.length - 1];

    if (!last) {
      merged.push({ ...interval });
      continue;
    }

    if (new Date(interval.startsAt).getTime() <= new Date(last.endsAt).getTime()) {
      if (new Date(interval.endsAt).getTime() > new Date(last.endsAt).getTime()) {
        last.endsAt = interval.endsAt;
      }
      continue;
    }

    merged.push({ ...interval });
  }

  return merged;
}

function splitInterval(
  startsAt: string,
  endsAt: string,
  maxChunkMinutes: number,
): Array<{ startsAt: string; endsAt: string }> {
  const total = durationMinutes(startsAt, endsAt);

  if (total <= maxChunkMinutes) {
    return [{ startsAt, endsAt }];
  }

  const chunks: Array<{ startsAt: string; endsAt: string }> = [];
  let cursor = new Date(startsAt);

  while (durationMinutes(cursor.toISOString(), endsAt) > maxChunkMinutes) {
    const chunkEnd = new Date(cursor.getTime() + maxChunkMinutes * 60_000);
    chunks.push({
      startsAt: cursor.toISOString(),
      endsAt: chunkEnd.toISOString(),
    });
    cursor = chunkEnd;
  }

  if (cursor.getTime() < new Date(endsAt).getTime()) {
    chunks.push({
      startsAt: cursor.toISOString(),
      endsAt,
    });
  }

  return chunks;
}

export function splitLargeFreeGaps({
  occupied,
  dayStart,
  dayEnd,
  minMinutes = MIN_GAP_MINUTES,
  maxChunkMinutes = MAX_FREE_CHUNK_MINUTES,
}: {
  occupied: Array<{ startsAt: string; endsAt: string }>;
  dayStart: string;
  dayEnd: string;
  minMinutes?: number;
  maxChunkMinutes?: number;
}): Array<{
  startsAt: string;
  endsAt: string;
  slotKind?: "day" | "evening_available";
}> {
  const blocking = mergeBlockingIntervals(
    occupied.filter((item) => durationMinutes(item.startsAt, item.endsAt) > 0),
  );

  const gaps: Array<{
    startsAt: string;
    endsAt: string;
    slotKind?: "day" | "evening_available";
  }> = [];

  let cursor = dayStart;

  for (const block of blocking) {
    const gapMinutes = durationMinutes(cursor, block.startsAt);

    if (gapMinutes >= minMinutes) {
      for (const chunk of splitInterval(cursor, block.startsAt, maxChunkMinutes)) {
        gaps.push({
          ...chunk,
          slotKind: "day",
        });
      }
    }

    if (new Date(block.endsAt).getTime() > new Date(cursor).getTime()) {
      cursor = block.endsAt;
    }
  }

  const tailMinutes = durationMinutes(cursor, dayEnd);

  if (tailMinutes >= minMinutes) {
    for (const chunk of splitInterval(cursor, dayEnd, maxChunkMinutes)) {
      gaps.push({
        ...chunk,
        slotKind: "day",
      });
    }
  }

  return gaps;
}

export function formatFreeSlotTitle(startsAt: string, endsAt: string): string {
  const minutes = durationMinutes(startsAt, endsAt);
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours > 0 && remainder > 0) return `Temps libre — ${hours} h ${remainder} min`;
  if (hours > 0) return `Temps libre — ${hours} h`;
  return `Temps libre — ${minutes} min`;
}

export { MAX_FREE_CHUNK_MINUTES, MIN_GAP_MINUTES };
