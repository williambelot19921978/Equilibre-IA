import { useCallback, useEffect, useState } from "react";

import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { useAuth } from "../hooks/useAuth";
import { getCurrentDeviceDate } from "../lib/time/deviceClock";
import {
  loadLivingMemory,
  saveLivingInsightFeedback,
} from "../services/livingMemoryService";
import type {
  AdaptiveSuggestion,
  EvolvingGoalSuggestion,
  HabitTrend,
  LivingInsight,
  LivingInsightStatus,
  LivingMemory,
} from "../types/livingMemory";

function formatConfidence(value: number): string {
  return `${Math.round(value)} %`;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function LivingInsightCard({
  insight,
  saving,
  onFeedback,
}: {
  insight: LivingInsight;
  saving: boolean;
  onFeedback: (status: LivingInsightStatus) => void;
}) {
  return (
    <article className="my-ai-insight-card">
      <div className="my-ai-insight-main">
        <p className="my-ai-insight-label">{insight.category}</p>
        <h3>{insight.label}</h3>
        <p className="my-ai-insight-detail">{insight.detail}</p>
        <p className="my-ai-insight-reasoning">{insight.reasoning}</p>
        {insight.evidence.length > 0 && (
          <ul className="my-ai-evidence-list">
            {insight.evidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="my-ai-insight-meta">
        <p>
          Confiance : <strong>{formatConfidence(insight.confidence)}</strong>
        </p>
        <p>Première observation : {formatDate(insight.firstSeen)}</p>
        <p>Dernière confirmation : {formatDate(insight.lastConfirmed)}</p>
        {insight.status === "confirmed" && (
          <p className="my-ai-insight-status">Confirmé par toi</p>
        )}
        {insight.status === "deferred" && (
          <p className="my-ai-insight-deferred">Reporté — j'approfondirai plus tard</p>
        )}
        {insight.trend && (
          <p className="my-ai-insight-trend">Tendance : {insight.trend}</p>
        )}
      </div>
      <div className="my-ai-insight-actions">
        <Button
          size="sm"
          variant="secondary"
          disabled={saving}
          onClick={() => onFeedback("confirmed")}
        >
          Exact
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={saving}
          onClick={() => onFeedback("rejected")}
        >
          Faux
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={saving}
          onClick={() => onFeedback("deferred")}
        >
          Plus tard
        </Button>
      </div>
    </article>
  );
}

function InsightSection({
  title,
  description,
  insights,
}: {
  title: string;
  description: string;
  insights: LivingInsight[];
}) {
  if (insights.length === 0) return null;

  return (
    <section className="my-ai-section">
      <header className="my-ai-section-header">
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
      <div className="my-ai-insights-grid">
        {insights.map((insight) => (
          <article key={insight.id} className="my-ai-insight-card my-ai-insight-summary">
            <h3>{insight.label}</h3>
            <p>{insight.detail}</p>
            <p className="my-ai-insight-meta">
              Confiance : {formatConfidence(insight.confidence)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function TrendList({ trends }: { trends: HabitTrend[] }) {
  if (trends.length === 0) return null;

  return (
    <section className="my-ai-section">
      <header className="my-ai-section-header">
        <h2>Tendances détectées</h2>
        <p>Ce qui s'améliore, se dégrade ou se stabilise dans ton rythme.</p>
      </header>
      <div className="my-ai-trends-grid">
        {trends.map((trend) => (
          <article key={trend.id} className={`my-ai-trend-card is-${trend.direction}`}>
            <p className="my-ai-trend-direction">{trend.direction}</p>
            <h3>{trend.label}</h3>
            <p>{trend.detail}</p>
            <ul className="my-ai-evidence-list">
              {trend.evidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function AdaptiveList({ items }: { items: AdaptiveSuggestion[] }) {
  if (items.length === 0) return null;

  return (
    <section className="my-ai-section">
      <header className="my-ai-section-header">
        <h2>Adaptations automatiques</h2>
        <p>Ce que je modifie progressivement dans mes propositions — toujours avec explication.</p>
      </header>
      <div className="my-ai-adapt-grid">
        {items.map((item) => (
          <article key={item.id} className="my-ai-adapt-card">
            <p className="my-ai-adapt-domain">{item.domain}</p>
            <p>{item.message}</p>
            <p className="my-ai-insight-meta">
              {item.previousValue} → {item.suggestedValue}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function GoalList({ items }: { items: EvolvingGoalSuggestion[] }) {
  if (items.length === 0) return null;

  return (
    <section className="my-ai-section">
      <header className="my-ai-section-header">
        <h2>Objectifs évolutifs</h2>
        <p>Des suggestions d'ajustement — jamais imposées.</p>
      </header>
      <div className="my-ai-goals-grid">
        {items.map((item) => (
          <article key={item.id} className="my-ai-goal-card">
            <h3>{item.title}</h3>
            <p>{item.explanation}</p>
            <ul className="my-ai-evidence-list">
              {item.evidence.map((evidence) => (
                <li key={evidence}>{evidence}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

export function MyAiPage() {
  const { user } = useAuth();
  const [memory, setMemory] = useState<LivingMemory | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const loaded = await loadLivingMemory({
        userId: user.id,
        referenceDate: getCurrentDeviceDate(),
      });
      setMemory(loaded);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Impossible de charger ce que j'ai appris.",
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleFeedback = async (
    insightId: string,
    status: LivingInsightStatus,
  ) => {
    if (!user || !memory) return;
    try {
      setSavingId(insightId);
      const updated = await saveLivingInsightFeedback({
        userId: user.id,
        insightId,
        status,
        memory,
      });
      setMemory(updated);
    } catch (feedbackError) {
      setError(
        feedbackError instanceof Error
          ? feedbackError.message
          : "Impossible d'enregistrer ton retour.",
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="my-ai-page">
      <header className="my-ai-header">
        <div>
          <p className="card-label">Mon IA</p>
          <h1>Ce que j'apprends sur toi</h1>
          <p className="my-ai-subtitle">
            Ma mémoire évolue avec toi. Corrige mes conclusions pour m'affiner —
            sans jamais imposer une activité.
          </p>
        </div>
      </header>

      {loading && <p>Chargement…</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && memory && (
        <>
          <section className="my-ai-knowledge-panel">
            <div className="my-ai-knowledge-main">
              <p className="my-ai-knowledge-label">Niveau de connaissance</p>
              <h2>{memory.knowledgeLevel.label}</h2>
              <p>{memory.coachPersonality}</p>
            </div>
            <div className="my-ai-knowledge-stats">
              <div>
                <strong>{formatConfidence(memory.globalConfidence)}</strong>
                <span>Confiance globale</span>
              </div>
              <div>
                <strong>{formatConfidence(memory.knowledgeLevel.progressPercent)}</strong>
                <span>Progression</span>
              </div>
              {memory.knowledgeLevel.nextLabel && (
                <p className="my-ai-knowledge-next">
                  Prochain palier : {memory.knowledgeLevel.nextLabel}
                </p>
              )}
            </div>
          </section>

          {memory.dailyMission && (
            <section className="my-ai-mission-card">
              <p className="my-ai-mission-label">Mission du jour</p>
              <h2>{memory.dailyMission.description}</h2>
              <p>{memory.dailyMission.reasoning}</p>
            </section>
          )}

          {memory.weeklyMission && (
            <section className="my-ai-mission-card is-weekly">
              <p className="my-ai-mission-label">{memory.weeklyMission.title}</p>
              <h2>{memory.weeklyMission.description}</h2>
              <p>{memory.weeklyMission.reasoning}</p>
            </section>
          )}

          <InsightSection
            title="Ce que j'ai appris récemment"
            description="Observations solides, confirmées par ton historique."
            insights={memory.recentlyLearned}
          />
          <InsightSection
            title="Ce que j'apprends encore"
            description="Pistes en cours de consolidation."
            insights={memory.stillLearning}
          />
          <InsightSection
            title="Ce dont je ne suis pas certain"
            description="Faible confiance ou en attente de ta validation."
            insights={memory.uncertain}
          />

          <TrendList trends={memory.trends} />
          <AdaptiveList items={memory.adaptiveSuggestions} />
          <GoalList items={memory.goalSuggestions} />

          {memory.insights.length === 0 ? (
            <EmptyState
              aura="discovery"
              title="Pas encore assez de données"
              description="Termine, annule ou planifie quelques activités — j'apprendrai progressivement ton rythme naturel."
            />
          ) : (
            <section className="my-ai-section">
              <header className="my-ai-section-header">
                <h2>Valider mes observations</h2>
                <p>Chaque retour affine ma mémoire. Un « Faux » réduit immédiatement ma confiance.</p>
              </header>
              <div className="my-ai-insights-grid">
                {memory.insights.map((insight) => (
                  <LivingInsightCard
                    key={insight.id}
                    insight={insight}
                    saving={savingId === insight.id}
                    onFeedback={(status) => void handleFeedback(insight.id, status)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
