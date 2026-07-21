type HouseholdPlanningSectionProps = {
  notes: readonly string[];
};

export function HouseholdPlanningSection({
  notes,
}: HouseholdPlanningSectionProps) {
  return (
    <section className="household-overview-card">
      <p className="card-label">Planning commun</p>
      <h2>Observations du jour</h2>
      <p className="household-planning-hint">
        Les plannings individuels restent inchangés. Cette section est purement
        informative.
      </p>

      {notes.length === 0 ? (
        <p>Aucune observation disponible pour cette journée.</p>
      ) : (
        <ul className="household-planning-notes">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
