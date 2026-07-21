import type { TrustDashboardSnapshot } from "../../trustCenter";

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

type TrustDashboardProps = {
  snapshot: TrustDashboardSnapshot;
};

export function TrustDashboard({ snapshot }: TrustDashboardProps) {
  return (
    <section className="trust-dashboard" data-testid="trust-dashboard">
      <h2 className="aura-h2">Vue d&apos;ensemble</h2>
      <ul className="trust-dashboard-grid">
        <li className="trust-dashboard-card aura-glass">
          <span className="trust-dashboard-label">Données utilisées aujourd&apos;hui</span>
          <strong>{snapshot.dataCategoriesUsedToday.join(", ") || "Aucune"}</strong>
        </li>
        <li className="trust-dashboard-card aura-glass">
          <span className="trust-dashboard-label">Dernier check-in</span>
          <strong>{formatWhen(snapshot.lastCheckinAt)}</strong>
        </li>
        <li className="trust-dashboard-card aura-glass">
          <span className="trust-dashboard-label">Dernière synchronisation</span>
          <strong>{formatWhen(snapshot.lastSyncAt)}</strong>
        </li>
        <li className="trust-dashboard-card aura-glass">
          <span className="trust-dashboard-label">Connaissances mémorisées</span>
          <strong>{snapshot.knowledgeCount}</strong>
        </li>
        <li className="trust-dashboard-card aura-glass">
          <span className="trust-dashboard-label">Recommandations générées</span>
          <strong>{snapshot.recommendationsCount}</strong>
        </li>
        <li className="trust-dashboard-card aura-glass">
          <span className="trust-dashboard-label">Dernière sauvegarde</span>
          <strong>{formatWhen(snapshot.lastBackupAt)}</strong>
        </li>
      </ul>
    </section>
  );
}
