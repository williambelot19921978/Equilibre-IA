import type { MemberWorkloadSummary } from "../../types/householdOverview";

type HouseholdWorkloadSectionProps = {
  members: readonly MemberWorkloadSummary[];
};

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`;
}

export function HouseholdWorkloadSection({
  members,
}: HouseholdWorkloadSectionProps) {
  return (
    <section className="household-overview-card">
      <p className="card-label">Charge</p>
      <h2>Charge estimée par membre</h2>

      {members.length === 0 ? (
        <p>Aucun membre à afficher.</p>
      ) : (
        <ul className="household-workload-list">
          {members.map((member) => (
            <li key={member.memberId} className="household-workload-item">
              <div className="household-workload-header">
                <strong>{member.displayName}</strong>
                <span>{member.loadLabel}</span>
              </div>
              <dl className="household-workload-metrics">
                <div>
                  <dt>Temps planifié</dt>
                  <dd>{formatMinutes(member.scheduledMinutesToday)}</dd>
                </div>
                <div>
                  <dt>Temps libre restant</dt>
                  <dd>{formatMinutes(member.freeMinutesRemaining)}</dd>
                </div>
                <div>
                  <dt>Tâches actives</dt>
                  <dd>{member.activeTaskCount}</dd>
                </div>
              </dl>
              {!member.dataAvailable && (
                <p className="household-data-unavailable">
                  Données partielles pour ce membre.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
