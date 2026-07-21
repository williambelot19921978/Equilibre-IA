import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import {
  acceptPreference,
  buildAdaptiveDiagnostics,
  rejectPreference,
  recordPreferenceValidated,
  type AdaptiveDiagnostics,
} from "../adaptiveIntelligenceEngine";
import {
  isAdaptiveIntelligenceEnabled,
  isPlanningCalendarEngineEnabled,
} from "../config/featureFlags";
import { useAppPageTitle } from "../hooks/useAppPageTitle";
import { useAuth } from "../hooks/useAuth";
import { getCurrentDeviceDate } from "../lib/time/deviceClock";
import { AppRoutes } from "../lib/navigation/routes";

type FilterStatus = "all" | "pending" | "accepted" | "rejected";

export function AdaptiveIntelligencePage() {
  useAppPageTitle("Apprentissage IA");
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<AdaptiveDiagnostics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

  const allowed =
    isAdaptiveIntelligenceEnabled() && isPlanningCalendarEngineEnabled();

  const reload = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await buildAdaptiveDiagnostics({
        userId: user.id,
        date: getCurrentDeviceDate(),
      });
      setDiagnostics(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erreur diagnostic.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!allowed || !user?.id) {
      setLoading(false);
      return;
    }
    void reload();
  }, [allowed, reload, user?.id]);

  const filteredProposals = useMemo(() => {
    if (!diagnostics) return [];
    const query = search.trim().toLowerCase();
    return diagnostics.proposals.filter((prop) => {
      if (statusFilter !== "all" && prop.status !== statusFilter) return false;
      if (!query) return true;
      return (
        prop.label.toLowerCase().includes(query) ||
        prop.proposedValue.toLowerCase().includes(query) ||
        prop.kind.toLowerCase().includes(query)
      );
    });
  }, [diagnostics, search, statusFilter]);

  const filteredObservations = useMemo(() => {
    if (!diagnostics) return [];
    const query = search.trim().toLowerCase();
    if (!query) return diagnostics.observations.slice(0, 50);
    return diagnostics.observations
      .filter(
        (obs) =>
          obs.label.toLowerCase().includes(query) ||
          obs.type.toLowerCase().includes(query) ||
          obs.source.toLowerCase().includes(query),
      )
      .slice(0, 50);
  }, [diagnostics, search]);

  async function handleAccept(proposalId: string) {
    if (!user?.id) return;
    const accepted = acceptPreference(user.id, proposalId);
    if (accepted) {
      recordPreferenceValidated(user.id, accepted, true);
    }
    await reload();
  }

  async function handleReject(proposalId: string) {
    if (!user?.id) return;
    const rejected = rejectPreference(user.id, proposalId);
    if (rejected) {
      recordPreferenceValidated(user.id, rejected, false);
    }
    await reload();
  }

  if (!allowed) {
    return <Navigate to={AppRoutes.HOME} replace />;
  }

  return (
    <main className="adaptive-intelligence-page" data-testid="adaptive-intelligence-page">
      <header className="planning-engine-diagnostics-header">
        <p className="planning-engine-diagnostics-eyebrow">Organisation</p>
        <h1>Apprentissage IA</h1>
        <p>
          EPIC 6A — observation, détection d&apos;habitudes et propositions de préférences.
          Aucune adaptation silencieuse : vous validez toujours.
        </p>
      </header>

      <section className="adaptive-intelligence-filters">
        <label>
          Recherche
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filtrer observations, habitudes, préférences…"
            data-testid="adaptive-search"
          />
        </label>
        <label>
          Statut préférences
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as FilterStatus)}
            data-testid="adaptive-status-filter"
          >
            <option value="all">Toutes</option>
            <option value="pending">En attente</option>
            <option value="accepted">Validées</option>
            <option value="rejected">Refusées</option>
          </select>
        </label>
      </section>

      {loading && <p role="status">Analyse adaptative en cours…</p>}
      {error && (
        <p className="planning-engine-diagnostics-error" role="alert">
          {error}
        </p>
      )}

      {diagnostics && (
        <>
          <section className="planning-engine-diagnostics-metrics">
            <article>
              <h2>Observations</h2>
              <p>{diagnostics.observationCount}</p>
            </article>
            <article>
              <h2>Habitudes</h2>
              <p>{diagnostics.habitCount}</p>
            </article>
            <article>
              <h2>En attente</h2>
              <p>{diagnostics.pendingCount}</p>
            </article>
            <article>
              <h2>Validées</h2>
              <p>{diagnostics.validatedCount}</p>
            </article>
          </section>

          <section className="adaptive-observations">
            <h2>Observations ({filteredObservations.length})</h2>
            <ul>
              {filteredObservations.map((obs) => (
                <li key={obs.id}>
                  {obs.label} — {obs.type} ({obs.source}) — confiance{" "}
                  {Math.round(obs.confidence * 100)}%
                </li>
              ))}
            </ul>
          </section>

          <section className="adaptive-habits">
            <h2>Habitudes détectées ({diagnostics.habits.length})</h2>
            <ul>
              {diagnostics.habits.map((habit) => (
                <li key={habit.id}>
                  <strong>{habit.label}</strong>
                  {habit.preferredTime ? ` — ${habit.preferredTime}` : ""} — score {habit.score} —
                  fréquence {habit.frequency} — stabilité {Math.round(habit.stability * 100)}% —
                  évolution {habit.evolution}
                </li>
              ))}
            </ul>
          </section>

          <section className="adaptive-proposals">
            <h2>Préférences ({filteredProposals.length})</h2>
            <ul>
              {filteredProposals.map((prop) => (
                <li key={prop.id} data-testid={`preference-${prop.id}`}>
                  <strong>{prop.label}</strong> — {prop.status} — confiance{" "}
                  {Math.round(prop.confidence * 100)}%
                  <div className="adaptive-explainability">
                    <p>Pourquoi : {prop.explainability.why}</p>
                    <p>Observations : {prop.explainability.observationCount}</p>
                    <p>Période : {prop.explainability.periodDays} jour(s)</p>
                    <p>Données : {prop.explainability.dataUsed.join(", ") || "—"}</p>
                    <p>Formule : {prop.explainability.formula}</p>
                  </div>
                  {prop.status === "pending" && (
                    <div className="adaptive-validation-actions">
                      <button type="button" onClick={() => void handleAccept(prop.id)}>
                        Valider
                      </button>
                      <button type="button" onClick={() => void handleReject(prop.id)}>
                        Refuser
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {diagnostics.validatedPreferences.length > 0 && (
            <section className="adaptive-validated">
              <h2>Préférences validées</h2>
              <ul>
                {diagnostics.validatedPreferences.map((prop) => (
                  <li key={prop.id}>
                    {prop.label} — {prop.proposedValue}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="adaptive-timeline">
            <h2>Historique d&apos;apprentissage</h2>
            <ul>
              {diagnostics.timeline.slice(0, 30).map((entry) => (
                <li key={entry.id}>
                  {entry.timestamp.slice(0, 16)} — {entry.message}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
