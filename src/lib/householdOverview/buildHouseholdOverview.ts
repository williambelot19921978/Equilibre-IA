/**
 * EPIC3-A — Read-only household overview orchestrator (no new motor).
 */

import { isGoalsEnabled } from "../../config/featureFlags";
import { computeGoalProgress } from "../goals/computeGoalProgress";
import type {
  HouseholdOverview,
  MemberOverviewSnapshot,
} from "../../types/householdOverview";
import { computeMemberWorkload } from "./computeMemberWorkload";
import {
  consolidateHouseholdAvailability,
  deriveHouseholdAvailabilitySummary,
} from "./consolidateHouseholdAvailability";

function buildSummaryHeadline(input: {
  memberCount: number;
  allMembersBusy: boolean;
  someoneFree: boolean;
}): string {
  if (input.memberCount === 0) {
    return "Aucun membre dans le foyer pour l'instant.";
  }

  if (input.memberCount === 1) {
    return "Vue consolidée de ton foyer — un membre actif.";
  }

  if (input.allMembersBusy) {
    return "Le foyer est globalement occupé aujourd'hui.";
  }

  if (input.someoneFree) {
    return "Au moins une personne du foyer dispose de créneaux libres.";
  }

  return "Vue d'ensemble du foyer pour cette journée.";
}

function buildPlanningNotes(
  members: MemberOverviewSnapshot[],
): string[] {
  const notes: string[] = [];

  for (const member of members) {
    if (!member.dataAvailable) {
      notes.push(
        `Planning de ${member.displayName} non disponible dans cette session.`,
      );
      continue;
    }

    const meaningfulBlocks = member.timeline.filter(
      (entry) =>
        entry.blockKind !== "free_slot" &&
        entry.blockKind !== "structural" &&
        !entry.completed,
    );

    if (meaningfulBlocks.length === 0) {
      notes.push(`${member.displayName} n'a pas de bloc planifié pour ce jour.`);
      continue;
    }

    const firstBlock = meaningfulBlocks[0];
    notes.push(
      `${member.displayName} — premier bloc : « ${firstBlock.title} ».`,
    );
  }

  return notes;
}

export function buildHouseholdOverview(input: {
  householdId: string;
  date: string;
  members: readonly MemberOverviewSnapshot[];
}): HouseholdOverview {
  const memberWorkloads = input.members.map((member) =>
    computeMemberWorkload({
      memberId: member.memberId,
      displayName: member.displayName,
      timeline: member.timeline,
      tasks: member.tasks,
      dataAvailable: member.dataAvailable,
    }),
  );

  const availabilityWindows = consolidateHouseholdAvailability(
    input.members.map((member) => ({
      displayName: member.displayName,
      timeline: member.timeline,
      dataAvailable: member.dataAvailable,
    })),
  );

  const availabilitySummary = deriveHouseholdAvailabilitySummary(
    availabilityWindows,
    memberWorkloads,
  );

  const memberGoals = input.members.map((member) => ({
    memberId: member.memberId,
    displayName: member.displayName,
    activeGoals: isGoalsEnabled()
      ? member.goals.filter((goal) => {
          const progress = computeGoalProgress(goal, [...member.tasks]);
          return progress.percent < 100;
        })
      : [],
  }));

  const memberCount = input.members.length;

  return {
    householdId: input.householdId,
    date: input.date,
    summary: {
      headline: buildSummaryHeadline({
        memberCount,
        ...availabilitySummary,
      }),
      allMembersBusy: availabilitySummary.allMembersBusy,
      someoneFree: availabilitySummary.someoneFree,
      memberCount,
    },
    availabilityWindows,
    members: memberWorkloads,
    memberGoals,
    planningNotes: buildPlanningNotes([...input.members]),
  };
}
