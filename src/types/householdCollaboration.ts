/**
 * EPIC3-C — Household collaboration proposals (prepare only, user confirms).
 */

import type { HouseholdOpportunityKind } from "./householdOpportunity";
import type { PresentedHouseholdOpportunity } from "./householdOpportunity";

export type HouseholdCollaborationActionKind =
  | "collaborative_task_draft"
  | "shared_planning_window"
  | "planning_density_review"
  | "goal_support_task_draft";

export type HouseholdCollaborationRoute =
  | "/tasks"
  | "/planning"
  | "/goals";

export type HouseholdCollaborationNavigation = {
  readonly route: HouseholdCollaborationRoute;
  readonly date?: string;
};

export type HouseholdCollaborationProposal = {
  readonly proposalId: string;
  readonly opportunityId: string;
  readonly opportunityKind: HouseholdOpportunityKind;
  readonly buttonLabel: "Proposer";
  readonly confirmationPrompt: string;
  readonly confirmationDetail: string;
  readonly actionKind: HouseholdCollaborationActionKind;
  readonly proposedAction: {
    readonly type: string;
    readonly payload: Record<string, unknown>;
  };
  readonly navigation: HouseholdCollaborationNavigation;
};

export type PresentedHouseholdOpportunityWithCollaboration =
  PresentedHouseholdOpportunity & {
    readonly collaborationProposal: HouseholdCollaborationProposal | null;
  };

export type HouseholdTaskCollaborationDraft = {
  readonly proposalId: string;
  readonly opportunityId: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly estimatedMinutes: number;
  readonly priority: number;
  readonly splittable: boolean;
  readonly dueDate?: string;
  readonly goalId?: string;
  readonly goalName?: string;
  readonly supportMemberName?: string;
  readonly source: "household_collaboration";
};

export type HouseholdPlanningCollaborationDraft = {
  readonly proposalId: string;
  readonly opportunityId: string;
  readonly date: string;
  readonly windowId?: string;
  readonly windowLabel?: string;
  readonly headline: string;
  readonly hint: string;
  readonly kind: "shared_window" | "density_review";
  readonly source: "household_collaboration";
};

export type HouseholdCollaborationPrepareResult = {
  readonly prepared: true;
  readonly navigation: HouseholdCollaborationNavigation;
  readonly draftKind: "task" | "planning";
};
