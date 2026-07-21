/**
 * EPIC3-C — Map existing household opportunities to collaboration proposals.
 * No new business rules — derives actions from EPIC3-B opportunities only.
 */

import type {
  HouseholdOverview,
  MemberOverviewSnapshot,
} from "../../types/householdOverview";
import type { HouseholdOpportunity } from "../../types/householdOpportunity";
import type { HouseholdCollaborationProposal } from "../../types/householdCollaboration";
import { HOUSEHOLD_COLLABORATION_CONFIRMATION_PROMPT } from "./buildHouseholdCollaborationConfirmation";
import {
  resolveLoadImbalanceContext,
  resolveOpportunityContext,
  resolveSharedFreeTimeContext,
  resolveStaleGoalSupportContext,
  type LoadImbalanceContext,
  type SharedFreeTimeContext,
  type StaleGoalSupportContext,
} from "./resolveHouseholdCollaborationContext";

function buildLoadImbalanceProposal(
  opportunity: HouseholdOpportunity,
  context: LoadImbalanceContext,
  date: string,
): HouseholdCollaborationProposal {
  const title = `Coup de main pour ${context.busyMemberName}`;
  const description = `Proposition de soutien — ${context.freeMemberName} pourrait aider ${context.busyMemberName} aujourd'hui.`;

  return {
    proposalId: `household-collab-${opportunity.id}`,
    opportunityId: opportunity.id,
    opportunityKind: opportunity.kind,
    buttonLabel: "Proposer",
    confirmationPrompt: HOUSEHOLD_COLLABORATION_CONFIRMATION_PROMPT,
    confirmationDetail:
      "Une tâche collaborative sera préparée en brouillon — vous pourrez la valider ou l'ajuster avant toute création.",
    actionKind: "collaborative_task_draft",
    proposedAction: {
      type: "create_household_support_task",
      payload: {
        busyMemberId: context.busyMemberId,
        freeMemberId: context.freeMemberId,
        title,
        description,
        date,
        category: "family",
        estimatedMinutes: 30,
        priority: 3,
      },
    },
    navigation: { route: "/tasks", date },
  };
}

function buildSharedFreeTimeProposal(
  opportunity: HouseholdOpportunity,
  context: SharedFreeTimeContext,
  date: string,
): HouseholdCollaborationProposal {
  return {
    proposalId: `household-collab-${opportunity.id}`,
    opportunityId: opportunity.id,
    opportunityKind: opportunity.kind,
    buttonLabel: "Proposer",
    confirmationPrompt: HOUSEHOLD_COLLABORATION_CONFIRMATION_PROMPT,
    confirmationDetail: `Le planning s'ouvrira avec le créneau « ${context.windowLabel} » en suggestion — aucun bloc ne sera ajouté automatiquement.`,
    actionKind: "shared_planning_window",
    proposedAction: {
      type: "open_household_planning_window",
      payload: {
        date,
        windowId: context.windowId,
        windowLabel: context.windowLabel,
      },
    },
    navigation: { route: "/planning", date },
  };
}

function buildBothBusyProposal(
  opportunity: HouseholdOpportunity,
  date: string,
): HouseholdCollaborationProposal {
  return {
    proposalId: `household-collab-${opportunity.id}`,
    opportunityId: opportunity.id,
    opportunityKind: opportunity.kind,
    buttonLabel: "Proposer",
    confirmationPrompt: HOUSEHOLD_COLLABORATION_CONFIRMATION_PROMPT,
    confirmationDetail:
      "Le planning s'ouvrira pour revoir la journée — aucun engagement ne sera modifié sans votre validation.",
    actionKind: "planning_density_review",
    proposedAction: {
      type: "open_household_planning_review",
      payload: { date, reviewKind: "density" },
    },
    navigation: { route: "/planning", date },
  };
}

function buildStaleGoalSupportProposal(
  opportunity: HouseholdOpportunity,
  context: StaleGoalSupportContext,
  date: string,
): HouseholdCollaborationProposal {
  const title = `Soutien — ${context.goalName}`;
  const description = `Proposition de soutien pour l'objectif « ${context.goalName} » de ${context.ownerName}.`;

  return {
    proposalId: `household-collab-${opportunity.id}`,
    opportunityId: opportunity.id,
    opportunityKind: opportunity.kind,
    buttonLabel: "Proposer",
    confirmationPrompt: HOUSEHOLD_COLLABORATION_CONFIRMATION_PROMPT,
    confirmationDetail:
      "Une tâche de soutien sera préparée en brouillon — vous pourrez la valider ou l'ajuster avant toute création.",
    actionKind: "goal_support_task_draft",
    proposedAction: {
      type: "create_household_goal_support_task",
      payload: {
        goalId: context.goalId,
        goalName: context.goalName,
        ownerId: context.ownerId,
        supportMemberId: context.supportMemberId,
        supportMemberName: context.supportMemberName,
        title,
        description,
        date,
        category: "family",
        estimatedMinutes: 30,
        priority: 4,
      },
    },
    navigation: { route: "/tasks", date },
  };
}

export function buildHouseholdCollaborationProposal(input: {
  opportunity: HouseholdOpportunity;
  overview: HouseholdOverview;
  memberSnapshots: readonly MemberOverviewSnapshot[];
  date: string;
}): HouseholdCollaborationProposal | null {
  const { opportunity, overview, memberSnapshots, date } = input;

  const context = resolveOpportunityContext(
    opportunity.kind,
    overview,
    memberSnapshots,
  );
  if (!context) return null;

  switch (opportunity.kind) {
    case "load_imbalance":
      return buildLoadImbalanceProposal(
        opportunity,
        context as LoadImbalanceContext,
        date,
      );
    case "shared_free_time":
      return buildSharedFreeTimeProposal(
        opportunity,
        context as SharedFreeTimeContext,
        date,
      );
    case "both_busy":
      return buildBothBusyProposal(opportunity, date);
    case "stale_goal_support":
      return buildStaleGoalSupportProposal(
        opportunity,
        context as StaleGoalSupportContext,
        date,
      );
    default:
      return null;
  }
}

export function buildHouseholdCollaborationProposals(input: {
  opportunities: readonly HouseholdOpportunity[];
  overview: HouseholdOverview;
  memberSnapshots: readonly MemberOverviewSnapshot[];
  date: string;
}): HouseholdCollaborationProposal[] {
  return input.opportunities
    .map((opportunity) =>
      buildHouseholdCollaborationProposal({
        opportunity,
        overview: input.overview,
        memberSnapshots: input.memberSnapshots,
        date: input.date,
      }),
    )
    .filter((proposal): proposal is HouseholdCollaborationProposal =>
      Boolean(proposal),
    );
}

/** @internal exported for tests — verify context still resolves for a kind */
export {
  resolveLoadImbalanceContext,
  resolveSharedFreeTimeContext,
  resolveStaleGoalSupportContext,
};
