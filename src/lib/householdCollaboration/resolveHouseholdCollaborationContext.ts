/**
 * EPIC3-C — Resolve actionable context from existing opportunities + overview.
 * Reuses EPIC3-A/B data — no new detection rules.
 */

import { isGoalsEnabled } from "../../config/featureFlags";
import { computeGoalProgress } from "../goals/computeGoalProgress";
import { computeGoalWeightsFromUserGoals } from "../goals/goalEnginePort";
import type {
  HouseholdOverview,
  MemberOverviewSnapshot,
} from "../../types/householdOverview";
import type { HouseholdOpportunityKind } from "../../types/householdOpportunity";

const HEAVY_SCHEDULED_MINUTES = 240;
const LOW_FREE_MINUTES = 60;
const SIGNIFICANT_FREE_MINUTES = 90;
const STALE_GOAL_DAYS = 5;

function isMemberHeavyLoad(member: {
  scheduledMinutesToday: number;
  loadLabel: string;
  dataAvailable: boolean;
}): boolean {
  if (!member.dataAvailable) return false;

  return (
    member.scheduledMinutesToday >= HEAVY_SCHEDULED_MINUTES ||
    member.loadLabel === "Journée chargée"
  );
}

function isMemberLowFree(member: {
  freeMinutesRemaining: number;
  dataAvailable: boolean;
}): boolean {
  return member.dataAvailable && member.freeMinutesRemaining < LOW_FREE_MINUTES;
}

function isMemberSignificantlyFree(member: {
  freeMinutesRemaining: number;
  dataAvailable: boolean;
}): boolean {
  return (
    member.dataAvailable && member.freeMinutesRemaining >= SIGNIFICANT_FREE_MINUTES
  );
}

export type LoadImbalanceContext = {
  readonly busyMemberId: string;
  readonly busyMemberName: string;
  readonly freeMemberId: string;
  readonly freeMemberName: string;
};

export type SharedFreeTimeContext = {
  readonly windowId: string;
  readonly windowLabel: string;
};

export type StaleGoalSupportContext = {
  readonly ownerId: string;
  readonly ownerName: string;
  readonly goalId: string;
  readonly goalName: string;
  readonly supportMemberId: string;
  readonly supportMemberName: string;
};

export function resolveLoadImbalanceContext(
  overview: HouseholdOverview,
): LoadImbalanceContext | null {
  const available = overview.members.filter((member) => member.dataAvailable);
  if (available.length < 2) return null;

  for (const busyMember of available) {
    if (!isMemberHeavyLoad(busyMember) && !isMemberLowFree(busyMember)) {
      continue;
    }

    const freeMember = available.find(
      (candidate) =>
        candidate.memberId !== busyMember.memberId &&
        isMemberSignificantlyFree(candidate),
    );

    if (!freeMember) continue;

    return {
      busyMemberId: busyMember.memberId,
      busyMemberName: busyMember.displayName,
      freeMemberId: freeMember.memberId,
      freeMemberName: freeMember.displayName,
    };
  }

  return null;
}

export function resolveSharedFreeTimeContext(
  overview: HouseholdOverview,
): SharedFreeTimeContext | null {
  const available = overview.members.filter((member) => member.dataAvailable);
  if (available.length < 2) return null;

  const sharedWindow = overview.availabilityWindows.find(
    (window) =>
      window.freeMemberNames.length >= 2 &&
      window.freeMemberNames.length === available.length,
  );

  if (!sharedWindow) return null;

  return {
    windowId: sharedWindow.id,
    windowLabel: sharedWindow.label,
  };
}

export function resolveStaleGoalSupportContext(
  overview: HouseholdOverview,
  snapshots: readonly MemberOverviewSnapshot[],
): StaleGoalSupportContext | null {
  if (!isGoalsEnabled()) return null;

  const available = overview.members.filter((member) => member.dataAvailable);
  if (available.length < 2) return null;

  const supportMember = available.find((member) =>
    isMemberSignificantlyFree(member),
  );
  if (!supportMember) return null;

  let bestGoal: StaleGoalSupportContext | null = null;
  let bestWeight = -1;

  for (const memberGoals of overview.memberGoals) {
    if (memberGoals.memberId === supportMember.memberId) continue;

    const snapshot = snapshots.find(
      (item) => item.memberId === memberGoals.memberId,
    );
    if (!snapshot) continue;

    const goals = memberGoals.activeGoals;
    if (goals.length === 0) continue;

    const weights = computeGoalWeightsFromUserGoals(goals, snapshot.tasks);

    for (const goal of goals) {
      const progress = computeGoalProgress(goal, [...snapshot.tasks]);
      const staleDays = progress.daysSinceLastProgress;

      if (
        staleDays === null ||
        staleDays < STALE_GOAL_DAYS ||
        progress.percent >= 100
      ) {
        continue;
      }

      const weight = weights.weights[goal.id] ?? 0;
      if (weight <= bestWeight) continue;

      bestWeight = weight;
      bestGoal = {
        ownerId: memberGoals.memberId,
        ownerName: memberGoals.displayName,
        goalId: goal.id,
        goalName: goal.name,
        supportMemberId: supportMember.memberId,
        supportMemberName: supportMember.displayName,
      };
    }
  }

  return bestGoal;
}

export function resolveOpportunityContext(
  kind: HouseholdOpportunityKind,
  overview: HouseholdOverview,
  snapshots: readonly MemberOverviewSnapshot[],
):
  | LoadImbalanceContext
  | SharedFreeTimeContext
  | StaleGoalSupportContext
  | { kind: "both_busy" }
  | null {
  switch (kind) {
    case "load_imbalance":
      return resolveLoadImbalanceContext(overview);
    case "shared_free_time":
      return resolveSharedFreeTimeContext(overview);
    case "both_busy":
      return { kind: "both_busy" };
    case "stale_goal_support":
      return resolveStaleGoalSupportContext(overview, snapshots);
    default:
      return null;
  }
}
