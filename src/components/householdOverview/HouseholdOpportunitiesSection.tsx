import { isHouseholdOpportunitiesEnabled } from "../../config/featureFlags";
import type { PresentedHouseholdOpportunityWithCollaboration } from "../../types/householdCollaboration";
import type { HouseholdCollaborationProposal } from "../../types/householdCollaboration";
import { HouseholdOpportunityCard } from "./HouseholdOpportunityCard";

type HouseholdOpportunitiesSectionProps = {
  opportunities: readonly PresentedHouseholdOpportunityWithCollaboration[];
  onPropose?: (proposal: HouseholdCollaborationProposal) => void;
};

export function HouseholdOpportunitiesSection({
  opportunities,
  onPropose,
}: HouseholdOpportunitiesSectionProps) {
  if (!isHouseholdOpportunitiesEnabled()) {
    return null;
  }

  return (
    <section className="household-overview-card" data-testid="household-opportunities-section">
      <p className="card-label">Opportunités du jour</p>
      <h2>Suggestions pour le foyer</h2>
      <p className="household-opportunities-hint">
        L&apos;IA observe et suggère — vous choisissez. Aucune action
        automatique.
      </p>

      {opportunities.length === 0 ? (
        <p>Aucune opportunité particulière détectée pour cette journée.</p>
      ) : (
        <div className="household-opportunities-cards">
          {opportunities.map((opportunity) => (
            <HouseholdOpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              onPropose={
                opportunity.collaborationProposal && onPropose
                  ? () => onPropose(opportunity.collaborationProposal!)
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
