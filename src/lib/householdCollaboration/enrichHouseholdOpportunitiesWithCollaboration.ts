/**
 * EPIC3-C — Attach collaboration proposals to presented opportunities.
 */

import type { PresentedHouseholdOpportunity } from "../../types/householdOpportunity";
import type {
  HouseholdCollaborationProposal,
  PresentedHouseholdOpportunityWithCollaboration,
} from "../../types/householdCollaboration";
import type {
  HouseholdOverview,
  MemberOverviewSnapshot,
} from "../../types/householdOverview";
import { isHouseholdCollaborationEnabled } from "../../config/featureFlags";
import { buildHouseholdCollaborationProposal } from "./buildHouseholdCollaborationProposal";

export function enrichHouseholdOpportunityWithCollaboration(
  opportunity: PresentedHouseholdOpportunity,
  input: {
    overview: HouseholdOverview;
    memberSnapshots: readonly MemberOverviewSnapshot[];
    date: string;
    collaborationEnabled?: boolean;
  },
): PresentedHouseholdOpportunityWithCollaboration {
  const enabled = input.collaborationEnabled ?? isHouseholdCollaborationEnabled();

  if (!enabled) {
    return { ...opportunity, collaborationProposal: null };
  }

  const proposal = buildHouseholdCollaborationProposal({
    opportunity,
    overview: input.overview,
    memberSnapshots: input.memberSnapshots,
    date: input.date,
  });

  return {
    ...opportunity,
    collaborationProposal: proposal,
  };
}

export function enrichHouseholdOpportunitiesWithCollaboration(
  opportunities: readonly PresentedHouseholdOpportunity[],
  input: {
    overview: HouseholdOverview;
    memberSnapshots: readonly MemberOverviewSnapshot[];
    date: string;
    collaborationEnabled?: boolean;
  },
): PresentedHouseholdOpportunityWithCollaboration[] {
  return opportunities.map((opportunity) =>
    enrichHouseholdOpportunityWithCollaboration(opportunity, input),
  );
}

export function findCollaborationProposal(
  opportunities: readonly PresentedHouseholdOpportunityWithCollaboration[],
  proposalId: string,
): HouseholdCollaborationProposal | null {
  return (
    opportunities.find(
      (item) => item.collaborationProposal?.proposalId === proposalId,
    )?.collaborationProposal ?? null
  );
}
