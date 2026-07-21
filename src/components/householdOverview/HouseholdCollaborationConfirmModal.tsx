import { Button } from "../ui/Button";
import { HOUSEHOLD_COLLABORATION_CONFIRMATION_PROMPT } from "../../lib/householdCollaboration/buildHouseholdCollaborationConfirmation";
import type { HouseholdCollaborationProposal } from "../../types/householdCollaboration";

type HouseholdCollaborationConfirmModalProps = {
  proposal: HouseholdCollaborationProposal | null;
  preparing?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function HouseholdCollaborationConfirmModal({
  proposal,
  preparing = false,
  onConfirm,
  onCancel,
}: HouseholdCollaborationConfirmModalProps) {
  if (!proposal) return null;

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={onCancel}
      onKeyDown={(event) => {
        if (event.key === "Escape") onCancel();
      }}
    >
      <div
        className="modal-card household-collaboration-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="household-collaboration-title"
        data-testid="household-collaboration-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="card-label">Proposition collaborative</p>
        <h2 id="household-collaboration-title">
          {HOUSEHOLD_COLLABORATION_CONFIRMATION_PROMPT}
        </h2>
        <p>{proposal.confirmationDetail}</p>

        <div className="modal-footer">
          <Button variant="secondary" disabled={preparing} onClick={onCancel}>
            Annuler
          </Button>
          <Button loading={preparing} onClick={onConfirm}>
            Oui
          </Button>
        </div>
      </div>
    </div>
  );
}
