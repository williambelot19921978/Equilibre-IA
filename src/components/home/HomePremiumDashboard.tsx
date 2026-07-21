import type { ReactNode } from "react";

import { Badge } from "../ui/Badge";
import { AuraStar } from "../aura/AuraStar";
import { Card } from "../ui/Card";
import { SkeletonCard } from "../ui/Skeleton";
import { buildDemoSnapshot, isDemoModeActive } from "../../demo/demoMode";
import type { DayTimelineEntry } from "../../lib/planning/displayedDayTimeline";

const PRIORITY_LABELS: Record<string, string> = {
  family: "Famille",
  study: "Études",
  sleep: "Sommeil",
  sport: "Sport",
  personal_time: "Temps personnel",
  work: "Travail",
};

type HomePremiumDashboardProps = {
  firstName: string;
  priorityKey?: string | null;
  coachTip?: ReactNode;
  dailyStateWidget?: ReactNode;
  loading?: boolean;
  nextActivity?: DayTimelineEntry | null;
  planningBlockCount?: number;
  freeSlotLabel?: string | null;
  onOpenPlanning?: () => void;
  onOpenCoach?: () => void;
};

export function HomePremiumDashboard({
  firstName,
  priorityKey,
  coachTip,
  dailyStateWidget,
  loading,
  nextActivity,
  planningBlockCount = 0,
  freeSlotLabel,
  onOpenPlanning,
  onOpenCoach,
}: HomePremiumDashboardProps) {
  const demo = isDemoModeActive() ? buildDemoSnapshot() : null;
  const priorityLabel =
    demo?.priorityLabel ??
    (priorityKey ? PRIORITY_LABELS[priorityKey] ?? priorityKey : "Non définie");

  if (loading) {
    return (
      <section className="home-premium-dashboard" aria-busy="true">
        <SkeletonCard />
        <SkeletonCard />
      </section>
    );
  }

  return (
    <section className="home-premium-dashboard aura-home" data-testid="home-premium-dashboard">
      <Card variant="elevated" className="home-premium-hero aura-home-hero aura-glass ds-animate-in">
        <p className="ds-label">Aujourd&apos;hui</p>
        <div className="aura-home-greeting">
          <AuraStar variant="coach" size="md" />
          <h2 className="aura-h2">Bonjour {firstName}</h2>
        </div>
        <div className="home-premium-hero-meta">
          <Badge variant="info">Priorité : {priorityLabel}</Badge>
          {planningBlockCount > 0 && (
            <Badge variant="muted">{planningBlockCount} blocs planifiés</Badge>
          )}
        </div>
      </Card>

      <div className="home-premium-grid">
        <Card className="home-premium-panel ds-animate-in">
          <h3>État du jour</h3>
          {dailyStateWidget ?? (
            <p className="home-premium-muted">
              {demo?.dailyStateDetail ?? "Faites votre check-in pour affiner vos recommandations."}
            </p>
          )}
        </Card>

        <Card className="home-premium-panel aura-home-panel aura-glass ds-animate-in">
          <h3 className="aura-h3">
            <AuraStar variant="coach" size="sm" decorative />
            Conseil du coach
          </h3>
          <p>{coachTip ?? demo?.coachTip ?? "Votre coach personnalisé sera bientôt disponible ici."}</p>
          {onOpenCoach && (
            <button type="button" className="home-premium-link" onClick={onOpenCoach}>
              Voir le coach
            </button>
          )}
        </Card>

        <Card className="home-premium-panel ds-animate-in">
          <h3>Prochaine action</h3>
          {nextActivity ? (
            <p>
              <strong>{nextActivity.title}</strong>
              {nextActivity.startsAt ? ` — ${formatTime(nextActivity.startsAt)}` : ""}
            </p>
          ) : (
            <p>{demo?.nextAction ?? "Aucune activité planifiée pour le moment."}</p>
          )}
        </Card>

        <Card className="home-premium-panel ds-animate-in">
          <h3>Résumé planning</h3>
          <p>{freeSlotLabel ?? demo?.planningSummary ?? "Consultez votre planning pour la journée."}</p>
          {onOpenPlanning && (
            <button type="button" className="home-premium-link" onClick={onOpenPlanning}>
              Ouvrir le planning
            </button>
          )}
        </Card>
      </div>
    </section>
  );
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
