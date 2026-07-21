/**
 * EPIC3-A — Household overview types (read-only consolidated view).
 */

import type { DayTimelineEntry } from "../lib/planning/displayedDayTimeline";
import type { TaskRecord } from "./database";
import type { UserGoal } from "./goal";

export type HouseholdAvailabilityWindow = {
  readonly id: string;
  readonly label: string;
  readonly allMembersBusy: boolean;
  readonly freeMemberNames: readonly string[];
};

export type MemberWorkloadSummary = {
  readonly memberId: string;
  readonly displayName: string;
  readonly scheduledMinutesToday: number;
  readonly freeMinutesRemaining: number;
  readonly activeTaskCount: number;
  readonly loadLabel: string;
  readonly dataAvailable: boolean;
};

export type MemberGoalsOverview = {
  readonly memberId: string;
  readonly displayName: string;
  readonly activeGoals: readonly UserGoal[];
};

export type HouseholdOverviewSummary = {
  readonly headline: string;
  readonly allMembersBusy: boolean;
  readonly someoneFree: boolean;
  readonly memberCount: number;
};

export type HouseholdOverview = {
  readonly householdId: string;
  readonly date: string;
  readonly summary: HouseholdOverviewSummary;
  readonly availabilityWindows: readonly HouseholdAvailabilityWindow[];
  readonly members: readonly MemberWorkloadSummary[];
  readonly memberGoals: readonly MemberGoalsOverview[];
  readonly planningNotes: readonly string[];
};

export type MemberOverviewSnapshot = {
  readonly memberId: string;
  readonly displayName: string;
  readonly timeline: readonly DayTimelineEntry[];
  readonly tasks: readonly TaskRecord[];
  readonly goals: readonly UserGoal[];
  readonly dataAvailable: boolean;
};
