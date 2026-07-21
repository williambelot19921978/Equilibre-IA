import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { buildPlanningDiagnostics, type PlanningDiagnostics } from "../planningCalendarEngine";
import { isPlanningCalendarEngineEnabled } from "../config/featureFlags";
import { useAppPageTitle } from "../hooks/useAppPageTitle";
import { useAuth } from "../hooks/useAuth";
import { getCurrentDeviceDate } from "../lib/time/deviceClock";
import { AppRoutes } from "../lib/navigation/routes";
import { getHouseholdMembership } from "../services/householdService";

export function PlanningEngineDiagnosticsPage() {
  useAppPageTitle("Planning Engine");
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<PlanningDiagnostics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const allowed = import.meta.env.DEV && isPlanningCalendarEngineEnabled();

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
        const result = await buildPlanningDiagnostics({
          userId: user!.id,
          householdId: membership?.household_id ?? null,
          date: getCurrentDeviceDate(),
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
    <main className="planning-engine-diagnostics" data-testid="planning-engine-diagnostics">
      <header className="planning-engine-diagnostics-header">
        <p className="planning-engine-diagnostics-eyebrow">Organisation · Développement</p>
        <h1>Planning & Calendar Engine</h1>
        <p>Diagnostic EPIC 5A — timeline unifiée, providers, conflits et créneaux libres.</p>
      </header>

      {loading && <p role="status">Chargement du diagnostic…</p>}
      {error && (
        <p className="planning-engine-diagnostics-error" role="alert">
          {error}
        </p>
      )}

      {diagnostics && (
        <>
          <section className="planning-engine-diagnostics-metrics">
            <article>
              <h2>Événements</h2>
              <p>{diagnostics.metrics.eventCount}</p>
            </article>
            <article>
              <h2>Providers</h2>
              <p>{diagnostics.metrics.providerCount}</p>
            </article>
            <article>
              <h2>Conflits</h2>
              <p>{diagnostics.metrics.conflictCount}</p>
            </article>
            <article>
              <h2>Temps libre (min)</h2>
              <p>{diagnostics.metrics.freeMinutes}</p>
            </article>
          </section>

          <section>
            <h2>Sources</h2>
            <ul>
              {diagnostics.snapshot.sources.map((source) => (
                <li key={source.id}>
                  {source.label} — {source.itemCount} élément(s) — {source.syncState}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2>Timeline fusionnée</h2>
            <ul className="planning-engine-diagnostics-timeline">
              {diagnostics.snapshot.timeline.items.map((item) => (
                <li key={item.id}>
                  <strong>{item.title}</strong> ({item.type}) — {item.start.slice(11, 16)} →{" "}
                  {item.end.slice(11, 16)}
                </li>
              ))}
              {diagnostics.snapshot.timeline.items.length === 0 && (
                <li>Aucun événement sur la période.</li>
              )}
            </ul>
          </section>

          <section>
            <h2>Conflits détectés</h2>
            <ul>
              {diagnostics.snapshot.conflicts.map((conflict) => (
                <li key={conflict.id}>
                  [{conflict.kind}] {conflict.message}
                </li>
              ))}
              {diagnostics.snapshot.conflicts.length === 0 && <li>Aucun conflit.</li>}
            </ul>
          </section>

          <section>
            <h2>Créneaux libres</h2>
            <ul>
              {diagnostics.snapshot.freeSlots.slice(0, 8).map((slot) => (
                <li key={slot.id}>
                  {slot.start.slice(11, 16)} → {slot.end.slice(11, 16)} ({slot.durationMinutes}{" "}
                  min)
                </li>
              ))}
              {diagnostics.snapshot.freeSlots.length === 0 && <li>Aucun créneau libre ≥ 15 min.</li>}
            </ul>
          </section>

          <section>
            <h2>Synchronisations externes</h2>
            <ul>
              {diagnostics.connectors.map((connector) => (
                <li key={connector.id}>
                  {connector.label} — {connector.status}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
