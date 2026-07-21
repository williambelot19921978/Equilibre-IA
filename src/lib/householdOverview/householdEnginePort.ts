/**
 * EPIC3-A — Household contract bridge (no new motor).
 * Maps overview data → MemberAvailabilityHint contract shape.
 */

import type { MemberAvailabilityHint } from "../../ai/contracts/engines/household-engine.contract";
import { asMemberId } from "../../ai/contracts/common/ids";
import type { MemberWorkloadSummary } from "../../types/householdOverview";

export function buildMemberAvailabilityHints(
  members: readonly MemberWorkloadSummary[],
): MemberAvailabilityHint[] {
  return members
    .filter((member) => member.dataAvailable)
    .map((member) => ({
      memberId: asMemberId(member.memberId),
      hint: `${member.displayName} — ${member.loadLabel.toLowerCase()} (${member.freeMinutesRemaining} min libres, ${member.activeTaskCount} tâches actives).`,
    }));
}
