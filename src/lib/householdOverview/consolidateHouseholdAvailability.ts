/**
 * EPIC3-A — Consolidate availability windows across household members.
 */

import type { DayTimelineEntry } from "../planning/displayedDayTimeline";
import type { HouseholdAvailabilityWindow } from "../../types/householdOverview";

type TimeBucket = {
  readonly id: string;
  readonly label: string;
  readonly startHour: number;
  readonly endHour: number;
};

const TIME_BUCKETS: readonly TimeBucket[] = [
  { id: "morning", label: "Matin (6 h – 12 h)", startHour: 6, endHour: 12 },
  {
    id: "afternoon",
    label: "Après-midi (12 h – 18 h)",
    startHour: 12,
    endHour: 18,
  },
  { id: "evening", label: "Soir (18 h – 22 h)", startHour: 18, endHour: 22 },
];

const MIN_FREE_MINUTES = 30;
const BUSY_SCHEDULED_MINUTES = 60;

function entryMinutes(entry: DayTimelineEntry): number {
  return Math.max(
    0,
    Math.round(
      (new Date(entry.endsAt).getTime() - new Date(entry.startsAt).getTime()) /
        60_000,
    ),
  );
}

function overlapsBucket(
  entry: DayTimelineEntry,
  bucket: TimeBucket,
): boolean {
  const startHour = new Date(entry.startsAt).getHours();
  return startHour >= bucket.startHour && startHour < bucket.endHour;
}

function analyzeMemberBucket(
  timeline: readonly DayTimelineEntry[],
  bucket: TimeBucket,
): { freeMinutes: number; scheduledMinutes: number } {
  let freeMinutes = 0;
  let scheduledMinutes = 0;

  for (const entry of timeline) {
    if (!overlapsBucket(entry, bucket)) continue;

    if (entry.blockKind === "free_slot" && !entry.completed) {
      freeMinutes += entryMinutes(entry);
      continue;
    }

    if (
      entry.blockKind !== "structural" &&
      entry.blockKind !== "free_slot" &&
      !entry.completed
    ) {
      scheduledMinutes += entryMinutes(entry);
    }
  }

  return { freeMinutes, scheduledMinutes };
}

function isMemberFreeInBucket(
  timeline: readonly DayTimelineEntry[],
  bucket: TimeBucket,
): boolean {
  const { freeMinutes, scheduledMinutes } = analyzeMemberBucket(
    timeline,
    bucket,
  );

  return (
    freeMinutes >= MIN_FREE_MINUTES ||
    (scheduledMinutes < BUSY_SCHEDULED_MINUTES && freeMinutes > 0)
  );
}

export function consolidateHouseholdAvailability(
  members: ReadonlyArray<{
    displayName: string;
    timeline: readonly DayTimelineEntry[];
    dataAvailable: boolean;
  }>,
): HouseholdAvailabilityWindow[] {
  const availableMembers = members.filter((member) => member.dataAvailable);

  if (availableMembers.length === 0) {
    return TIME_BUCKETS.map((bucket) => ({
      id: bucket.id,
      label: bucket.label,
      allMembersBusy: false,
      freeMemberNames: [],
    }));
  }

  return TIME_BUCKETS.map((bucket) => {
    const freeMemberNames = availableMembers
      .filter((member) => isMemberFreeInBucket(member.timeline, bucket))
      .map((member) => member.displayName);

    return {
      id: bucket.id,
      label: bucket.label,
      allMembersBusy: freeMemberNames.length === 0,
      freeMemberNames,
    };
  });
}

export function deriveHouseholdAvailabilitySummary(
  windows: readonly HouseholdAvailabilityWindow[],
  members: ReadonlyArray<{ freeMinutesRemaining: number; dataAvailable: boolean }>,
): { allMembersBusy: boolean; someoneFree: boolean } {
  const availableMembers = members.filter((member) => member.dataAvailable);
  const someoneFreeFromMembers = availableMembers.some(
    (member) => member.freeMinutesRemaining >= MIN_FREE_MINUTES,
  );
  const someoneFreeFromWindows = windows.some(
    (window) => window.freeMemberNames.length > 0,
  );

  const allMembersBusy =
    availableMembers.length > 0 &&
    availableMembers.every(
      (member) => member.freeMinutesRemaining < MIN_FREE_MINUTES,
    ) &&
    windows.every((window) => window.allMembersBusy);

  return {
    allMembersBusy,
    someoneFree: someoneFreeFromMembers || someoneFreeFromWindows,
  };
}
