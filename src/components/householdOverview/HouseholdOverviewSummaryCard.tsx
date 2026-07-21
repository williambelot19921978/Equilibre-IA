import type { HouseholdOverviewSummary } from "../../types/householdOverview";

type HouseholdOverviewSummaryCardProps = {
  summary: HouseholdOverviewSummary;
};

export function HouseholdOverviewSummaryCard({
  summary,
}: HouseholdOverviewSummaryCardProps) {
  return (
    <section className="household-overview-card">
      <p className="card-label">Vue d&apos;ensemble</p>
      <h2>{summary.headline}</h2>
      <ul className="household-overview-badges">
        <li>{summary.memberCount} membre{summary.memberCount > 1 ? "s" : ""}</li>
        {summary.allMembersBusy && <li>Tout le monde est occupé</li>}
        {summary.someoneFree && <li>Au moins une personne est libre</li>}
      </ul>
    </section>
  );
}
