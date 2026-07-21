/**
 * EPIC3-A — Household overview data loading (read-only).
 */

import { getUserGoals } from "./goalsService";
import { loadDisplayedDayPlan } from "./planningService";
import { getUserTasks } from "./tasksService";
import {
  getCurrentHouseholdId,
  getHouseholdMembers,
} from "./householdService";
import { buildHouseholdOverview } from "../lib/householdOverview/buildHouseholdOverview";
import { buildHouseholdOpportunities } from "../lib/householdOpportunities/buildHouseholdOpportunities";
import { presentHouseholdOpportunities } from "../lib/householdOpportunities/presentHouseholdOpportunity";
import { enrichHouseholdOpportunitiesWithCollaboration } from "../lib/householdCollaboration/enrichHouseholdOpportunitiesWithCollaboration";
import type { HouseholdOverview } from "../types/householdOverview";
import type { MemberOverviewSnapshot } from "../types/householdOverview";
import type { PresentedHouseholdOpportunityWithCollaboration } from "../types/householdCollaboration";
import {
  isGoalsEnabled,
  isHouseholdCollaborationEnabled,
  isHouseholdOpportunitiesEnabled,
} from "../config/featureFlags";

async function loadMemberSnapshot(
  member: { user_id: string; display_name: string },
  date: string,
): Promise<MemberOverviewSnapshot> {
  try {
    const [displayed, tasks] = await Promise.all([
      loadDisplayedDayPlan({ userId: member.user_id, date }),
      getUserTasks(member.user_id),
    ]);

    const goals = isGoalsEnabled() ? getUserGoals(member.user_id) : [];

    return {
      memberId: member.user_id,
      displayName: member.display_name,
      timeline: displayed?.timeline ?? [],
      tasks,
      goals,
      dataAvailable: Boolean(displayed),
    };
  } catch {
    return {
      memberId: member.user_id,
      displayName: member.display_name,
      timeline: [],
      tasks: [],
      goals: isGoalsEnabled() ? getUserGoals(member.user_id) : [],
      dataAvailable: false,
    };
  }
}

export type HouseholdOverviewBundle = {
  overview: HouseholdOverview;
  memberSnapshots: MemberOverviewSnapshot[];
  opportunities: PresentedHouseholdOpportunityWithCollaboration[];
};

export async function loadHouseholdOverviewBundle(
  userId: string,
  date: string,
): Promise<HouseholdOverviewBundle | null> {
  try {
    const householdId = await getCurrentHouseholdId(userId);
    const members = await getHouseholdMembers(householdId);

    const snapshots = await Promise.all(
      members.map((member) => loadMemberSnapshot(member, date)),
    );

    const overview = buildHouseholdOverview({
      householdId,
      date,
      members: snapshots,
    });

    const rawOpportunities = isHouseholdOpportunitiesEnabled()
      ? buildHouseholdOpportunities({
          overview,
          memberSnapshots: snapshots,
        })
      : [];

    const presented = presentHouseholdOpportunities(rawOpportunities);

    return {
      overview,
      memberSnapshots: snapshots,
      opportunities: enrichHouseholdOpportunitiesWithCollaboration(presented, {
        overview,
        memberSnapshots: snapshots,
        date,
        collaborationEnabled: isHouseholdCollaborationEnabled(),
      }),
    };
  } catch {
    return null;
  }
}

export async function loadHouseholdOverview(
  userId: string,
  date: string,
): Promise<HouseholdOverview | null> {
  const bundle = await loadHouseholdOverviewBundle(userId, date);
  return bundle?.overview ?? null;
}
