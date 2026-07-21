import { useMemo, useState } from "react";

import { buildHealthDashboard, FUNNEL_STEP_ORDER, type HealthDashboardSnapshot } from "../auraInsights";
import { Card } from "../components/ui/Card";
import { PageContainer } from "../components/ui/PageContainer";
import { SectionHeader } from "../components/ui/SectionHeader";
import { useAppPageTitle } from "../hooks/useAppPageTitle";

type InsightsTab = "adoption" | "coach" | "checkin" | "notifications" | "performance" | "errors";

const TAB_LABELS: Record<InsightsTab, string> = {
  adoption: "Adoption",
  coach: "Coach",
  checkin: "Check-in",
  notifications: "Notifications",
  performance: "Performance",
  errors: "Erreurs",
};

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <li className="insights-metric aura-glass">
      <span className="insights-metric-label">{label}</span>
      <strong>{value}</strong>
    </li>
  );
}

function AdoptionSection({ data }: { data: HealthDashboardSnapshot }) {
  return (
    <section data-testid="insights-adoption">
      <ul className="insights-metrics-grid">
        <MetricCard label="Utilisateurs actifs (7j)" value={data.activeUsers} />
        <MetricCard label="Check-ins aujourd'hui" value={data.dailyCheckins} />
        <MetricCard label="Conseils acceptés" value={data.adviceAccepted} />
        <MetricCard label="Conseils ignorés" value={data.adviceIgnored} />
        <MetricCard label="Taux d'acceptation" value={`${data.adviceAcceptRate} %`} />
        <MetricCard label="Temps moyen onboarding" value={data.avgOnboardingMs ?? "—"} />
        <MetricCard label="Temps moyen session" value={data.avgSessionMs ?? "—"} />
      </ul>

      <h3 className="aura-h3">Entonnoir bêta</h3>
      <ol className="insights-funnel">
        {FUNNEL_STEP_ORDER.map((step) => (
          <li key={step}>
            <span>{step.replace(/_/g, " ")}</span>
            <strong>{data.funnel.steps[step]}</strong>
            {data.funnel.conversionRates[step] != null && (
              <em>{data.funnel.conversionRates[step]} %</em>
            )}
          </li>
        ))}
      </ol>

      <h3 className="aura-h3">Fonctions les plus utilisées</h3>
      <ul>
        {data.topFeatures.map((item) => (
          <li key={item.feature}>
            {item.feature} — {item.count}
          </li>
        ))}
      </ul>
    </section>
  );
}

function CoachSection({ data }: { data: HealthDashboardSnapshot }) {
  return (
    <section data-testid="insights-coach">
      <table className="insights-table">
        <thead>
          <tr>
            <th>Domaine</th>
            <th>Affichés</th>
            <th>Acceptés</th>
            <th>Ignorés</th>
            <th>Reportés</th>
            <th>Taux</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data.coachByDomain).map(([domain, stats]) => {
            const total = stats.accepted + stats.ignored + stats.deferred;
            const rate = total > 0 ? Math.round((stats.accepted / total) * 100) : 0;
            return (
              <tr key={domain}>
                <td>{domain}</td>
                <td>{stats.shown}</td>
                <td>{stats.accepted}</td>
                <td>{stats.ignored}</td>
                <td>{stats.deferred}</td>
                <td>{rate} %</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export function AuraInsightsAdminPage() {
  useAppPageTitle("Aura Insights");
  const [tab, setTab] = useState<InsightsTab>("adoption");
  const data = useMemo(() => buildHealthDashboard(), [tab]);

  return (
    <PageContainer>
      <SectionHeader
        label="Admin"
        title="Aura Insights"
        subtitle="Métriques anonymisées — mode local (bêta privée)."
      />

      <div className="aura-insights-admin" data-testid="aura-insights-admin">
        <nav className="insights-tabs" aria-label="Sections Aura Insights">
          {(Object.keys(TAB_LABELS) as InsightsTab[]).map((key) => (
            <button
              key={key}
              type="button"
              className={tab === key ? "insights-tab active" : "insights-tab"}
              onClick={() => setTab(key)}
            >
              {TAB_LABELS[key]}
            </button>
          ))}
        </nav>

        <Card className="insights-panel aura-glass">
          {tab === "adoption" && <AdoptionSection data={data} />}
          {tab === "coach" && <CoachSection data={data} />}
          {tab === "checkin" && (
            <section data-testid="insights-checkin">
              <ul className="insights-metrics-grid">
                <MetricCard label="Check-ins complétés" value={data.dailyState.completed} />
                <MetricCard label="Check-ins ignorés" value={data.dailyState.skipped} />
                <MetricCard label="Temps moyen" value={data.dailyState.avgDurationMs ?? "—"} />
                <MetricCard label="Mode rapide" value={data.dailyState.byMode.quick} />
                <MetricCard label="Mode standard" value={data.dailyState.byMode.standard} />
                <MetricCard label="Mode complet" value={data.dailyState.byMode.complete} />
              </ul>
            </section>
          )}
          {tab === "notifications" && (
            <section data-testid="insights-notifications">
              <ul className="insights-metrics-grid">
                <MetricCard label="Envoyées" value={data.notifications.sent} />
                <MetricCard label="Ouvertes" value={data.notifications.opened} />
                <MetricCard label="Ignorées" value={data.notifications.dismissed} />
                <MetricCard label="Désactivées" value={data.notifications.disabled} />
              </ul>
            </section>
          )}
          {tab === "performance" && (
            <section data-testid="insights-performance">
              <ul className="insights-metrics-grid">
                <MetricCard label="Ouverture app (ms)" value={data.performance.avgAppOpenMs ?? "—"} />
                <MetricCard label="Navigation (ms)" value={data.performance.avgNavigationMs ?? "—"} />
                <MetricCard label="Onboarding (ms)" value={data.performance.avgOnboardingMs ?? "—"} />
              </ul>
            </section>
          )}
          {tab === "errors" && (
            <section data-testid="insights-errors">
              <h3 className="aura-h3">Error Dashboard</h3>
              <ul className="insights-metrics-grid">
                <MetricCard label="Erreurs JS" value={data.errors.js} />
                <MetricCard label="Timeouts" value={data.errors.timeout} />
                <MetricCard label="Offline" value={data.errors.offline} />
                <MetricCard label="Échecs sync" value={data.errors.syncFailed} />
              </ul>
              <p className="aura-caption">Total événements stockés : {data.totalEvents}</p>
            </section>
          )}
        </Card>

        <p className="aura-caption">
          Généré le {data.generatedAt.slice(0, 16).replace("T", " ")} — données locales anonymisées.
        </p>
      </div>
    </PageContainer>
  );
}
