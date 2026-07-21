import { Button } from "../ui/Button";
import { clearHouseholdPlanningCollaborationDraft } from "../../lib/householdCollaboration/householdCollaborationDraftStorage";
import type { HouseholdPlanningCollaborationDraft } from "../../types/householdCollaboration";

type HouseholdPlanningPrefillBannerProps = {
  draft: HouseholdPlanningCollaborationDraft | null;
  onDismiss: () => void;
};

export function HouseholdPlanningPrefillBanner({
  draft,
  onDismiss,
}: HouseholdPlanningPrefillBannerProps) {
  if (!draft) return null;

  function handleDismiss() {
    clearHouseholdPlanningCollaborationDraft();
    onDismiss();
  }

  return (
    <section
      className="household-collaboration-prefill-banner"
      aria-live="polite"
    >
      <div>
        <p className="card-label">Suggestion du foyer</p>
        <h2>{draft.headline}</h2>
        <p>{draft.hint}</p>
        {draft.windowLabel && (
          <p className="household-collaboration-prefill-window">
            Créneau proposé : {draft.windowLabel}
          </p>
        )}
      </div>
      <Button variant="secondary" size="sm" onClick={handleDismiss}>
        Compris
      </Button>
    </section>
  );
}
