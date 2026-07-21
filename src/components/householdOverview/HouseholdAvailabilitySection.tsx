import type { HouseholdAvailabilityWindow } from "../../types/householdOverview";

type HouseholdAvailabilitySectionProps = {
  windows: readonly HouseholdAvailabilityWindow[];
};

export function HouseholdAvailabilitySection({
  windows,
}: HouseholdAvailabilitySectionProps) {
  return (
    <section className="household-overview-card">
      <p className="card-label">Disponibilités</p>
      <h2>Créneaux du foyer</h2>

      <ul className="household-availability-list">
        {windows.map((window) => (
          <li key={window.id} className="household-availability-item">
            <div className="household-availability-header">
              <strong>{window.label}</strong>
              <span>
                {window.allMembersBusy
                  ? "Tout le monde est occupé"
                  : "Au moins une personne est libre"}
              </span>
            </div>
            {!window.allMembersBusy && window.freeMemberNames.length > 0 && (
              <p className="household-availability-members">
                Libres : {window.freeMemberNames.join(", ")}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
