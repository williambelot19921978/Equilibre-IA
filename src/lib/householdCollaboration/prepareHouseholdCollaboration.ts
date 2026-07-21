/**
 * EPIC3-C — Prepare collaboration after explicit user confirmation.
 * Stores drafts and returns navigation — never mutates planning/tasks directly.
 */

import type {
  HouseholdCollaborationPrepareResult,
  HouseholdCollaborationProposal,
  HouseholdPlanningCollaborationDraft,
  HouseholdTaskCollaborationDraft,
} from "../../types/householdCollaboration";
import {
  saveHouseholdPlanningCollaborationDraft,
  saveHouseholdTaskCollaborationDraft,
} from "./householdCollaborationDraftStorage";

function prepareTaskDraft(
  proposal: HouseholdCollaborationProposal,
): HouseholdTaskCollaborationDraft {
  const payload = proposal.proposedAction.payload;

  return {
    proposalId: proposal.proposalId,
    opportunityId: proposal.opportunityId,
    title: String(payload.title ?? ""),
    description: String(payload.description ?? ""),
    category: String(payload.category ?? "family"),
    estimatedMinutes: Number(payload.estimatedMinutes ?? 30),
    priority: Number(payload.priority ?? 3),
    splittable: true,
    dueDate: typeof payload.date === "string" ? payload.date : undefined,
    goalId: typeof payload.goalId === "string" ? payload.goalId : undefined,
    goalName:
      typeof payload.goalName === "string" ? payload.goalName : undefined,
    supportMemberName:
      typeof payload.supportMemberName === "string"
        ? payload.supportMemberName
        : undefined,
    source: "household_collaboration",
  };
}

function prepareSharedWindowDraft(
  proposal: HouseholdCollaborationProposal,
  date: string,
): HouseholdPlanningCollaborationDraft {
  const payload = proposal.proposedAction.payload;
  const windowLabel = String(payload.windowLabel ?? "créneau libre");

  return {
    proposalId: proposal.proposalId,
    opportunityId: proposal.opportunityId,
    date,
    windowId:
      typeof payload.windowId === "string" ? payload.windowId : undefined,
    windowLabel,
    headline: "Moment partagé suggéré",
    hint: `Vous pourriez bloquer du temps ensemble — ${windowLabel.toLowerCase()}.`,
    kind: "shared_window",
    source: "household_collaboration",
  };
}

function prepareDensityReviewDraft(
  proposal: HouseholdCollaborationProposal,
  date: string,
): HouseholdPlanningCollaborationDraft {
  return {
    proposalId: proposal.proposalId,
    opportunityId: proposal.opportunityId,
    date,
    headline: "Journée dense — revue suggérée",
    hint: "Il pourrait être utile de limiter de nouveaux engagements. Aucun changement ne sera appliqué automatiquement.",
    kind: "density_review",
    source: "household_collaboration",
  };
}

export function prepareHouseholdCollaboration(
  proposal: HouseholdCollaborationProposal,
): HouseholdCollaborationPrepareResult {
  const date =
    proposal.navigation.date ??
    (typeof proposal.proposedAction.payload.date === "string"
      ? proposal.proposedAction.payload.date
      : undefined);

  switch (proposal.actionKind) {
    case "collaborative_task_draft":
    case "goal_support_task_draft": {
      const draft = prepareTaskDraft(proposal);
      saveHouseholdTaskCollaborationDraft(draft);
      return {
        prepared: true,
        navigation: proposal.navigation,
        draftKind: "task",
      };
    }
    case "shared_planning_window": {
      const planningDate = date ?? "";
      const draft = prepareSharedWindowDraft(proposal, planningDate);
      saveHouseholdPlanningCollaborationDraft(draft);
      return {
        prepared: true,
        navigation: { route: "/planning", date: planningDate },
        draftKind: "planning",
      };
    }
    case "planning_density_review": {
      const planningDate = date ?? "";
      const draft = prepareDensityReviewDraft(proposal, planningDate);
      saveHouseholdPlanningCollaborationDraft(draft);
      return {
        prepared: true,
        navigation: { route: "/planning", date: planningDate },
        draftKind: "planning",
      };
    }
    default:
      throw new Error("Unsupported household collaboration action");
  }
}
