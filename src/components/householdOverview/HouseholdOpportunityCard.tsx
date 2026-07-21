import { useState } from "react";

import { Button } from "../ui/Button";
import { RecommendationWhyPanel } from "../explainability/RecommendationWhyPanel";
import { isHouseholdCollaborationEnabled } from "../../config/featureFlags";
import type { PresentedHouseholdOpportunityWithCollaboration } from "../../types/householdCollaboration";

type HouseholdOpportunityCardProps = {
  opportunity: PresentedHouseholdOpportunityWithCollaboration;
  onPropose?: () => void;
};

export function HouseholdOpportunityCard({
  opportunity,
  onPropose,
}: HouseholdOpportunityCardProps) {
  const [whyOpen, setWhyOpen] = useState(false);
  const canShowWhy = opportunity.whyReasons.length > 0;
  const collaborationEnabled = isHouseholdCollaborationEnabled();
  const proposal = opportunity.collaborationProposal;

  return (
    <article className="household-opportunity-card">
      <h3>{opportunity.title}</h3>
      <p>{opportunity.explanation}</p>

      {canShowWhy && (
        <div className="household-opportunity-why">
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={whyOpen}
            onClick={() => setWhyOpen((value) => !value)}
          >
            {whyOpen ? "Masquer" : "Pourquoi ?"}
          </Button>
          {whyOpen && (
            <RecommendationWhyPanel reasons={[...opportunity.whyReasons]} />
          )}
        </div>
      )}

      {collaborationEnabled && proposal && onPropose && (
        <div className="household-opportunity-actions">
          <Button variant="secondary" size="sm" onClick={onPropose}>
            {proposal.buttonLabel}
          </Button>
        </div>
      )}
    </article>
  );
}
