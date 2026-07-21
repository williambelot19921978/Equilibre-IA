/**
 * EPIC1-C — Timeline fingerprint for significant planning changes.
 * Derived from displayed timeline (task add/remove/move/complete/cancel all mutate entries).
 */

import type { DayTimelineEntry } from "../planning/displayedDayTimeline";

export function buildDailyBriefTimelineSignature(
  timeline: DayTimelineEntry[],
): string {
  return timeline
    .filter((entry) => entry.blockKind !== "structural")
    .map(
      (entry) =>
        [
          entry.id,
          entry.startsAt,
          entry.endsAt,
          entry.completed ? "1" : "0",
          entry.blockKind,
          entry.activityType ?? "",
        ].join(":"),
    )
    .sort()
    .join("|");
}
