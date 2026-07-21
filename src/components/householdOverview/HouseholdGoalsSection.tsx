import type { MemberGoalsOverview } from "../../types/householdOverview";

type HouseholdGoalsSectionProps = {
  memberGoals: readonly MemberGoalsOverview[];
  goalsEnabled: boolean;
};

export function HouseholdGoalsSection({
  memberGoals,
  goalsEnabled,
}: HouseholdGoalsSectionProps) {
  if (!goalsEnabled) {
    return (
      <section className="household-overview-card">
        <p className="card-label">Objectifs</p>
        <h2>Objectifs actifs</h2>
        <p>Les objectifs ne sont pas activés pour ce foyer.</p>
      </section>
    );
  }

  return (
    <section className="household-overview-card">
      <p className="card-label">Objectifs</p>
      <h2>Objectifs actifs par membre</h2>

      <ul className="household-goals-list">
        {memberGoals.map((entry) => (
          <li key={entry.memberId} className="household-goals-member">
            <strong>{entry.displayName}</strong>
            {entry.activeGoals.length === 0 ? (
              <p>Aucun objectif actif.</p>
            ) : (
              <ul>
                {entry.activeGoals.map((goal) => (
                  <li key={goal.id}>{goal.name}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
