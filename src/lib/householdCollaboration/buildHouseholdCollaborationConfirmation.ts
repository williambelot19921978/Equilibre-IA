/**
 * EPIC3-C — Confirmation prompts (ActionProposalEngine-aligned, no execution).
 */

import type { HouseholdCollaborationProposal } from "../../types/householdCollaboration";

export const HOUSEHOLD_COLLABORATION_CONFIRMATION_PROMPT =
  "Souhaitez-vous préparer cette action ?";

export function buildHouseholdCollaborationConfirmation(
  proposal: HouseholdCollaborationProposal,
): string {
  return proposal.confirmationDetail;
}

export function buildHouseholdCollaborationConfirmationPrompt(
  _proposals: readonly HouseholdCollaborationProposal[],
): string {
  return HOUSEHOLD_COLLABORATION_CONFIRMATION_PROMPT;
}
