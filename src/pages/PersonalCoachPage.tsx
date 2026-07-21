import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { WhyRecommendationButton } from "../components/trust/WhyRecommendationButton";
import {
  buildPersonalCoachDiagnostics,
  getLifePriority,
  LIFE_PRIORITY_OPTIONS,
  recordDismissedAdvice,
  setLifePriority,
  type CoachAdvice,
  type LifePriority,
  type PersonalCoachDiagnostics,
} from "../personalCoachEngine";
import {
  trackCoachAdviceIgnored,
  trackCoachAdviceShown,
  trackInsightEvent,
} from "../auraInsights";
import type { RecommendationWhyDetails } from "../trustCenter";
import { isPersonalCoachEngineEnabled } from "../config/featureFlags";
import { useAppPageTitle } from "../hooks/useAppPageTitle";
import { useAuth } from "../hooks/useAuth";
import { getCurrentDeviceDate } from "../lib/time/deviceClock";
import { AppRoutes } from "../lib/navigation/routes";

function buildCoachWhyDetails(advice: CoachAdvice, onDismiss?: () => void): RecommendationWhyDetails {
  return {
    dataUsed: ["Check-in", "Objectifs", "Priorité de vie"],
    why: [advice.explainability.why, advice.explainability.whyToday],
    goalName: advice.explainability.goalName,
    confidenceLabel: `${Math.round(advice.explainability.confidence * 100)} %`,
    canIgnore: Boolean(onDismiss),
    onIgnore: onDismiss,
  };
}

function CoachAdviceCard({
  advice,
  onDismiss,
}: {
  readonly advice: CoachAdvice;
  readonly onDismiss?: () => void;
}) {
  return (
    <article className="personal-coach-advice" data-testid={`coach-advice-${advice.id}`}>
      <h3>{advice.title}</h3>
      <p>{advice.message}</p>
      {advice.suggestion && <p className="personal-coach-suggestion">{advice.suggestion}</p>}
      <WhyRecommendationButton details={buildCoachWhyDetails(advice, onDismiss)} />
      {onDismiss && (
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Pas maintenant
        </Button>
      )}
    </article>
  );
}

export function PersonalCoachPage() {
  useAppPageTitle("Coach personnel");
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<PersonalCoachDiagnostics | null>(null);
  const [priority, setPriority] = useState<LifePriority>("balance");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const result = await buildPersonalCoachDiagnostics({
      userId: user.id,
      date: getCurrentDeviceDate(),
      firstName:
        user.user_metadata?.first_name?.toString() ??
        user.email?.split("@")[0] ??
        undefined,
    });
    setDiagnostics(result);
    setPriority(result.lifePriority);
    trackInsightEvent(user.id, "coach_opened", { feature: "coach" });
    const adviceCount =
      result.todayInsights.length +
      result.opportunities.length +
      result.recovery.length +
      result.successes.length;
    for (let index = 0; index < adviceCount; index += 1) {
      trackCoachAdviceShown(user.id, "general");
    }
    setLoading(false);
  }, [user?.id, user?.email]);

  useEffect(() => {
    if (!isPersonalCoachEngineEnabled() || !user?.id) {
      setLoading(false);
      return;
    }
    setPriority(getLifePriority(user.id));
    void reload();
  }, [reload, user?.id]);

  function handlePriorityChange(next: LifePriority) {
    if (!user?.id) return;
    setLifePriority(user.id, next);
    setPriority(next);
    void reload();
  }

  function handleDismiss(adviceId: string) {
    if (!user?.id) return;
    trackCoachAdviceIgnored(user.id, "general");
    recordDismissedAdvice(user.id, adviceId);
    void reload();
  }

  if (!isPersonalCoachEngineEnabled()) {
    return <Navigate to={AppRoutes.HOME} replace />;
  }

  return (
    <main className="personal-coach-page" data-testid="personal-coach-page">
      <header className="planning-engine-diagnostics-header">
        <p className="planning-engine-diagnostics-eyebrow">Organisation</p>
        <h1>Coach personnel</h1>
        <p>Accompagnement bienveillant — suggestions uniquement, jamais d&apos;action automatique.</p>
      </header>

      <section data-testid="coach-priority-section">
        <h2>Priorité actuelle</h2>
        <div className="personal-coach-priority-options">
          {LIFE_PRIORITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={priority === option.value ? "selected" : ""}
              onClick={() => handlePriorityChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {loading && <p>Chargement…</p>}

      {diagnostics && !loading && (
        <>
          <section data-testid="coach-today-section">
            <h2>Aujourd&apos;hui</h2>
            {diagnostics.todayInsights.map((advice) => (
              <CoachAdviceCard
                key={advice.id}
                advice={advice}
                onDismiss={() => handleDismiss(advice.id)}
              />
            ))}
            {diagnostics.todayInsights.length === 0 && (
              <p>Rien d&apos;urgent — profite de ta journée à ton rythme.</p>
            )}
          </section>

          <section data-testid="coach-opportunities-section">
            <h2>Opportunités</h2>
            {diagnostics.opportunities.map((advice) => (
              <CoachAdviceCard key={advice.id} advice={advice} />
            ))}
          </section>

          <section data-testid="coach-recovery-section">
            <h2>Récupération</h2>
            {diagnostics.recovery.map((advice) => (
              <CoachAdviceCard key={advice.id} advice={advice} />
            ))}
            {diagnostics.recovery.length === 0 && <p>Pas de signal de surcharge aujourd&apos;hui.</p>}
          </section>

          <section data-testid="coach-success-section">
            <h2>Réussites</h2>
            {diagnostics.successes.map((advice) => (
              <CoachAdviceCard key={advice.id} advice={advice} />
            ))}
          </section>

          {diagnostics.weeklyReview && (
            <section data-testid="coach-weekly-section">
              <h2>Revue hebdomadaire</h2>
              <CoachAdviceCard advice={diagnostics.weeklyReview} />
            </section>
          )}

          {diagnostics.monthlyReflection && (
            <section data-testid="coach-monthly-section">
              <h2>Revue mensuelle</h2>
              <CoachAdviceCard advice={diagnostics.monthlyReflection} />
            </section>
          )}

          {diagnostics.proposedSession && (
            <section data-testid="coach-session-section">
              <h2>Session proposée (~{diagnostics.proposedSession.estimatedSeconds}s)</h2>
              <p>{diagnostics.proposedSession.title} — facultative</p>
            </section>
          )}
        </>
      )}
    </main>
  );
}
