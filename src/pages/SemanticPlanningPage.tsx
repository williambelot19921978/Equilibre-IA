import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import {
  buildSemanticDiagnostics,
  type SemanticDiagnostics,
} from "../semanticPlanningEngine";
import {
  isPlanningCalendarEngineEnabled,
  isSemanticPlanningEngineEnabled,
} from "../config/featureFlags";
import { useAppPageTitle } from "../hooks/useAppPageTitle";
import { useAuth } from "../hooks/useAuth";
import { getCurrentDeviceDate } from "../lib/time/deviceClock";
import { AppRoutes } from "../lib/navigation/routes";
import { getHouseholdMembership } from "../services/householdService";

const CATEGORY_LABELS: Record<string, string> = {
  sante: "Santé",
  travail: "Travail",
  sport: "Sport",
  famille: "Famille",
  deplacement: "Déplacement",
  etudes: "Études",
  personnel: "Personnel",
  social: "Social",
  spirituel: "Spirituel",
  repos: "Repos",
  autre: "Autre",
};

export function SemanticPlanningPage() {
  useAppPageTitle("Compréhension IA");
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<SemanticDiagnostics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const allowed =
    isSemanticPlanningEngineEnabled() && isPlanningCalendarEngineEnabled();

  useEffect(() => {
    if (!allowed || !user?.id) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const membership = await getHouseholdMembership(user!.id);
        const result = await buildSemanticDiagnostics({
          userId: user!.id,
          householdId: membership?.household_id ?? null,
          date: getCurrentDeviceDate(),
          childrenCount: 0,
          memberCount: membership ? 2 : 1,
        });
        if (!cancelled) setDiagnostics(result);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Erreur diagnostic.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [allowed, user?.id]);

  if (!allowed) {
    return <Navigate to={AppRoutes.HOME} replace />;
  }

  return (
    <main className="semantic-planning-page" data-testid="semantic-planning-page">
      <header className="planning-engine-diagnostics-header">
        <p className="planning-engine-diagnostics-eyebrow">Organisation</p>
        <h1>Compréhension IA</h1>
        <p>
          Couche sémantique EPIC 5C — enrichissement des événements sans modifier le Planning
          Engine.
        </p>
      </header>

      {loading && <p role="status">Analyse sémantique en cours…</p>}
      {error && (
        <p className="planning-engine-diagnostics-error" role="alert">
          {error}
        </p>
      )}

      {diagnostics && (
        <>
          <section className="planning-engine-diagnostics-metrics">
            <article>
              <h2>Charge quotidienne</h2>
              <p>{diagnostics.dailyLoad.mentalLoad}/100</p>
            </article>
            <article>
              <h2>Équilibre</h2>
              <p>{diagnostics.balance.daily.score}/100</p>
            </article>
            <article>
              <h2>Confiance IA</h2>
              <p>{Math.round(diagnostics.averageConfidence * 100)}%</p>
            </article>
            <article>
              <h2>Stress (moy.)</h2>
              <p>
                {diagnostics.items.length > 0
                  ? Math.round(
                      diagnostics.items.reduce((sum, item) => sum + item.stressLevel, 0) /
                        diagnostics.items.length,
                    )
                  : 0}
              </p>
            </article>
          </section>

          <section className="semantic-category-distribution">
            <h2>Répartition des catégories</h2>
            <ul>
              {Object.entries(diagnostics.categoryDistribution).map(([key, count]) =>
                count > 0 ? (
                  <li key={key}>
                    {CATEGORY_LABELS[key] ?? key} : {count}
                  </li>
                ) : null,
              )}
            </ul>
          </section>

          <section className="semantic-load-breakdown">
            <h2>Charge détaillée</h2>
            <ul>
              <li>Temps travail : {diagnostics.dailyLoad.workMinutes} min</li>
              <li>Temps famille : {diagnostics.dailyLoad.familyMinutes} min</li>
              <li>Temps personnel : {diagnostics.dailyLoad.personalMinutes} min</li>
              <li>Temps santé : {diagnostics.dailyLoad.healthMinutes} min</li>
              <li>Concentration : {diagnostics.dailyLoad.focusMinutes} min</li>
              <li>Déplacements : {diagnostics.dailyLoad.travelMinutes} min</li>
            </ul>
          </section>

          <section className="semantic-household">
            <h2>Vision foyer</h2>
            <ul>
              <li>Temps ensemble : {diagnostics.household.togetherMinutes} min</li>
              <li>Temps libre commun : {diagnostics.household.sharedFreeMinutes} min</li>
              <li>Temps parents : {diagnostics.household.parentMinutes} min</li>
              <li>Temps enfants : {diagnostics.household.childrenMinutes} min</li>
              <li>Temps individuel : {diagnostics.household.individualMinutes} min</li>
            </ul>
          </section>

          {diagnostics.insights.length > 0 && (
            <section className="semantic-insights">
              <h2>Insights</h2>
              <ul>
                {diagnostics.insights.map((insight) => (
                  <li key={insight.id}>
                    <strong>{insight.message}</strong>
                    <p>{insight.explainability.why}</p>
                    <p>Données : {insight.explainability.dataUsed.join(", ")}</p>
                    <p>Calcul : {insight.explainability.calculation}</p>
                    <p>Confiance : {Math.round(insight.confidence * 100)}%</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {diagnostics.items.length > 0 && (
            <section className="semantic-items">
              <h2>Événements enrichis ({diagnostics.items.length})</h2>
              <ul>
                {diagnostics.items.map((entry) => (
                  <li key={entry.id}>
                    {entry.title} — {entry.category}/{entry.subcategory} — importance{" "}
                    {entry.importance} — flexibilité {entry.flexibility}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}
