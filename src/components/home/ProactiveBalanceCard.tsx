import { useEffect, useState } from "react";

import { explainBalanceLevel } from "../../lib/proactiveEngine/explainBalanceScore";
import type { ProactiveAnalysisResult } from "../../lib/proactiveEngine/types";
import type { DayTimelineEntry } from "../../lib/planning/displayedDayTimeline";
import {
  analyzeDayProactively,
  buildDayAnalysisInput,
  loadTaskSkipCountsByIds,
  collectTaskIdsFromItems,
} from "../../services/proactiveAnalysisService";
import type { CalendarItemRecord, ProfileFactRecord } from "../../types";

type ProactiveBalanceCardProps = {
  userId: string;
  date: string;
  timeline: DayTimelineEntry[];
  items: CalendarItemRecord[];
  profileFacts?: ProfileFactRecord[];
  loadingPlan?: boolean;
};

async function loadAnalysis({
  userId,
  date,
  timeline,
  items,
  profileFacts,
}: Omit<ProactiveBalanceCardProps, "loadingPlan">): Promise<ProactiveAnalysisResult> {
  try {
    const taskIds = collectTaskIdsFromItems(items);
    const tasksById =
      taskIds.length > 0 ? await loadTaskSkipCountsByIds(userId, taskIds) : new Map();

    const input = buildDayAnalysisInput({
      date,
      timeline,
      items,
      tasksById,
      profileFacts,
    });

    return analyzeDayProactively(input);
  } catch {
    return {
      date,
      balanceScore: null,
      overload: null,
      postponements: null,
      insights: [],
      hasSufficientData: false,
    };
  }
}

export function ProactiveBalanceCard({
  userId,
  date,
  timeline,
  items,
  profileFacts,
  loadingPlan = false,
}: ProactiveBalanceCardProps) {
  const [analysis, setAnalysis] = useState<ProactiveAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void loadAnalysis({
      userId,
      date,
      timeline,
      items,
      profileFacts,
    })
      .then((result) => {
        if (!cancelled) setAnalysis(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, date, timeline, items, profileFacts]);

  const isLoading = loading || loadingPlan;
  const hasData = analysis?.hasSufficientData && analysis.balanceScore;
  const primaryInsight = analysis?.insights[0];
  const secondaryInsights = analysis?.insights.slice(1) ?? [];

  return (
    <section
      className="home-widget home-widget-balance"
      data-testid="proactive-balance-card"
      aria-labelledby="balance-score-heading"
      aria-busy={isLoading}
    >
      <div className="balance-card-header">
        <div>
          <p className="card-label">Conseil du jour</p>
          <h2 id="balance-score-heading">Score Équilibre</h2>
        </div>
        {hasData && analysis.balanceScore && (
          <div
            className="balance-score-badge"
            aria-label={`Score ${analysis.balanceScore.score} sur 100`}
          >
            <span className="balance-score-value">{analysis.balanceScore.score}</span>
            <span className="balance-score-max">/100</span>
          </div>
        )}
      </div>

      {isLoading && (
        <p className="balance-card-neutral">Analyse de ta journée en cours…</p>
      )}

      {!isLoading && !hasData && (
        <p className="balance-card-neutral">
          Données insuffisantes pour analyser cette journée. Génère ou consulte un
          planning pour obtenir un score.
        </p>
      )}

      {!isLoading && hasData && analysis.balanceScore && (
        <>
          <p className="balance-level-label">
            {explainBalanceLevel(analysis.balanceScore.level)}
          </p>

          {primaryInsight ? (
            <div className="balance-primary-insight">
              <p className="balance-insight-title">{primaryInsight.title}</p>
              <p className="balance-insight-message">{primaryInsight.message}</p>
              {primaryInsight.suggestedAction && (
                <p className="balance-suggested-action">
                  Suggestion : {primaryInsight.suggestedAction.label}
                </p>
              )}
            </div>
          ) : (
            <p className="balance-card-neutral">
              Ta journée semble globalement cohérente avec tes préférences.
            </p>
          )}

          {secondaryInsights.length > 0 && (
            <ul className="balance-insights-list">
              {secondaryInsights.map((insight) => (
                <li key={insight.id}>
                  <strong>{insight.title}</strong>
                  <span>{insight.message}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
