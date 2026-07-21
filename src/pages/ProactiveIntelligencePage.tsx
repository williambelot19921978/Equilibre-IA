import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import {
  acceptSuggestion,
  buildProactiveDiagnostics,
  dismissSuggestion,
  recordSuggestionLifecycle,
  recordSuggestionOutcome,
  recordSuggestionDismissed,
  type ProactiveDiagnostics,
} from "../proactiveIntelligenceEngine";
import {
  isPlanningCalendarEngineEnabled,
  isProactiveIntelligenceEnabled,
} from "../config/featureFlags";
import { useAppPageTitle } from "../hooks/useAppPageTitle";
import { useAuth } from "../hooks/useAuth";
import { getCurrentDeviceDate } from "../lib/time/deviceClock";
import { AppRoutes } from "../lib/navigation/routes";
import {
  trackCoachAdviceAccepted,
  trackCoachAdviceIgnored,
} from "../auraInsights";

type StatusFilter = "all" | "displayed" | "scheduled" | "accepted" | "dismissed";

export function ProactiveIntelligencePage() {
  useAppPageTitle("IA proactive");
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<ProactiveDiagnostics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const allowed =
    isProactiveIntelligenceEnabled() && isPlanningCalendarEngineEnabled();

  const reload = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await buildProactiveDiagnostics({
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

  const filteredSuggestions = useMemo(() => {
    if (!diagnostics) return [];
    const query = search.trim().toLowerCase();
    return diagnostics.suggestions.filter((suggestion) => {
      if (statusFilter !== "all" && suggestion.status !== statusFilter) return false;
      if (!query) return true;
      return (
        suggestion.title.toLowerCase().includes(query) ||
        suggestion.kind.toLowerCase().includes(query) ||
        suggestion.reason.toLowerCase().includes(query)
      );
    });
  }, [diagnostics, search, statusFilter]);

  async function handleAccept(suggestionId: string) {
    if (!user?.id || !diagnostics) return;
    const suggestion = diagnostics.suggestions.find((item) => item.id === suggestionId);
    const accepted = acceptSuggestion(user.id, suggestionId);
    if (accepted && suggestion) {
      trackCoachAdviceAccepted(user.id, "general");
      recordSuggestionLifecycle(user.id, accepted, "suggestion_accepted");
      recordSuggestionOutcome(user.id, true);
    }
    await reload();
  }

  async function handleDismiss(suggestionId: string) {
    if (!user?.id || !diagnostics) return;
    const suggestion = diagnostics.suggestions.find((item) => item.id === suggestionId);
    const dismissed = dismissSuggestion(user.id, suggestionId);
    if (dismissed && suggestion) {
      trackCoachAdviceIgnored(user.id, "general");
      recordSuggestionLifecycle(user.id, dismissed, "suggestion_dismissed");
      recordSuggestionDismissed(user.id, suggestion.kind);
      recordSuggestionOutcome(user.id, false);
    }
    await reload();
  }

  if (!allowed) {
    return <Navigate to={AppRoutes.HOME} replace />;
  }

  return (
    <main className="proactive-intelligence-page" data-testid="proactive-intelligence-page">
      <header className="planning-engine-diagnostics-header">
        <p className="planning-engine-diagnostics-eyebrow">Organisation</p>
        <h1>IA proactive</h1>
        <p>
          EPIC 6B — suggestions contextuelles, jamais envahissantes. Le moteur propose, vous
          décidez. Aucune action automatique.
        </p>
      </header>

      <section className="proactive-intelligence-filters">
        <label>
          Recherche
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filtrer suggestions…"
            data-testid="proactive-search"
          />
        </label>
        <label>
          Statut
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          >
            <option value="all">Toutes</option>
            <option value="displayed">Affichées</option>
            <option value="scheduled">Planifiées</option>
            <option value="accepted">Acceptées</option>
            <option value="dismissed">Ignorées</option>
          </select>
        </label>
      </section>

      {loading && <p role="status">Analyse proactive en cours…</p>}
      {error && (
        <p className="planning-engine-diagnostics-error" role="alert">
          {error}
        </p>
      )}

      {diagnostics && (
        <>
          <section className="planning-engine-diagnostics-metrics">
            <article>
              <h2>Affichables</h2>
              <p>{diagnostics.displayableCount}</p>
            </article>
            <article>
              <h2>Planifiées</h2>
              <p>{diagnostics.scheduledCount}</p>
            </article>
            <article>
              <h2>Acceptées</h2>
              <p>{diagnostics.acceptedCount}</p>
            </article>
            <article>
              <h2>Ignorées</h2>
              <p>{diagnostics.dismissedCount}</p>
            </article>
          </section>

          <section className="proactive-behavior">
            <h2>Comportement observé</h2>
            <ul>
              <li>
                Tolérance interruption :{" "}
                {Math.round(diagnostics.behaviorMetrics.interruptionTolerance * 100)}%
              </li>
              <li>Préférence notifications : {diagnostics.behaviorMetrics.notificationPreference}</li>
              <li>
                Taux acceptation : {Math.round(diagnostics.behaviorMetrics.acceptanceRate * 100)}%
              </li>
              <li>Taux refus : {Math.round(diagnostics.behaviorMetrics.dismissRate * 100)}%</li>
              <li>
                Moments préférés :{" "}
                {diagnostics.behaviorMetrics.preferredMoments.join(", ") || "—"}
              </li>
            </ul>
          </section>

          {diagnostics.digests.length > 0 && (
            <section className="proactive-digests">
              <h2>Digest</h2>
              <ul>
                {diagnostics.digests.map((digest) => (
                  <li key={digest.id}>
                    <strong>{digest.title}</strong> — {digest.summary}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="proactive-suggestions">
            <h2>Suggestions ({filteredSuggestions.length})</h2>
            <ul>
              {filteredSuggestions.map((suggestion) => (
                <li key={suggestion.id} data-testid={`suggestion-${suggestion.id}`}>
                  <strong>{suggestion.title}</strong> — {suggestion.kind} — score{" "}
                  {Math.round(suggestion.score * 100)}% — confiance{" "}
                  {Math.round(suggestion.confidence * 100)}% — {suggestion.status}
                  <div className="proactive-explainability">
                    <p>Pourquoi : {suggestion.explainability.why}</p>
                    <p>Pourquoi maintenant : {suggestion.explainability.whyNow}</p>
                    <p>Pourquoi pas plus tard : {suggestion.explainability.whyNotLater}</p>
                    <p>Raison : {suggestion.reason}</p>
                    <p>Impact : {suggestion.impact}</p>
                    {suggestion.preparedAction && (
                      <p>Action préparée (sans exécution) : {suggestion.preparedAction}</p>
                    )}
                  </div>
                  {(suggestion.status === "displayed" || suggestion.status === "scheduled") && (
                    <div className="proactive-validation-actions">
                      <button type="button" onClick={() => void handleAccept(suggestion.id)}>
                        Accepter
                      </button>
                      <button type="button" onClick={() => void handleDismiss(suggestion.id)}>
                        Ignorer
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {diagnostics.lifeTransitions.length > 0 && (
            <section className="proactive-transitions">
              <h2>Changements de vie détectés</h2>
              <ul>
                {diagnostics.lifeTransitions.map((signal) => (
                  <li key={signal.id}>
                    {signal.message} (confiance {Math.round(signal.confidence * 100)}%)
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="proactive-timeline">
            <h2>Historique</h2>
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
