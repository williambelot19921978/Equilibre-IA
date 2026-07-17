import { useEffect, useState, type ReactNode } from "react";

import { Button } from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { getCurrentDeviceDate } from "../lib/time/deviceClock";
import { formatStudyMinutesLabel } from "../lib/planning/getWeeklyStudyProgress";
import {
  loadStatisticsForPeriod,
  type EnrichedPeriodStatistics,
  type StatisticsPeriod,
} from "../services/statisticsService";

const PERIOD_OPTIONS: Array<{ value: StatisticsPeriod; label: string }> = [
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
  { value: "year", label: "Année" },
];

function StatCard({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <section className="statistics-card">
      <header className="statistics-card-header">
        <h2>{title}</h2>
        <p>{summary}</p>
      </header>
      <div className="statistics-card-body">{children}</div>
    </section>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="statistics-metric-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function StatisticsPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<StatisticsPeriod>("week");
  const [stats, setStats] = useState<EnrichedPeriodStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    async function load() {
      if (!user) return;
      try {
        setLoading(true);
        setError("");
        const result = await loadStatisticsForPeriod({
          userId: user.id,
          referenceDate: getCurrentDeviceDate(),
          period,
        });
        setStats(result);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Impossible de charger les statistiques.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [user, period]);

  return (
    <div className="statistics-page">
      <header className="statistics-page-header">
        <div>
          <h1>Statistiques</h1>
          <p className="statistics-page-subtitle">
            Vue d'ensemble de ton équilibre — sans interprétation médicale.
          </p>
        </div>
        <div className="statistics-period-switch" role="tablist" aria-label="Période">
          {PERIOD_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={period === option.value ? "primary" : "secondary"}
              onClick={() => setPeriod(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </header>

      {loading && <p>Chargement des statistiques…</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && stats && !stats.hasData && (
        <p className="statistics-empty">
          Pas encore assez de données pour cette période ({stats.label}).
        </p>
      )}

      {!loading && stats && (
        <>
          <section className="statistics-summary-banner">
            <h2>{stats.label}</h2>
            <p>
              {stats.hasData
                ? `${stats.completion.completedCount} activités terminées · taux de réalisation ${stats.completion.realizationRate} %`
                : "Les statistiques apparaîtront au fur et à mesure de tes activités."}
            </p>
          </section>

          <section className="statistics-balance-panel">
            <h2>Tableau de bord équilibre</h2>
            <div className="statistics-balance-global">
              <strong>{stats.balance.globalScore}</strong>
              <p>Score global sur 100 — basé sur tes activités réelles de la période.</p>
            </div>
            <div className="statistics-balance-grid">
              {stats.balance.categories.map((category) => (
                <article key={category.category} className="statistics-balance-card">
                  <h3>{category.label}</h3>
                  <p>
                    <strong>{category.score}/100</strong>
                  </p>
                  <p>{category.summary}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="statistics-card">
            <header className="statistics-card-header">
              <h2>Tendances & régularité</h2>
              <p>Évolution qualitative — sans interprétation médicale.</p>
            </header>
            <div className="statistics-card-body statistics-trends-grid">
              <MetricRow label="Tendance complétion" value={stats.trends.completionTrend} />
              <MetricRow label="Tendance révision" value={stats.trends.studyTrend} />
              <MetricRow label="Tendance sport" value={stats.trends.sportTrend} />
              <MetricRow label="Régularité" value={`${stats.trends.regularityScore} %`} />
              <MetricRow label="Temps gagné (estimé)" value={`${stats.trends.timeGainedMinutes} min`} />
              <MetricRow label="Temps perdu (estimé)" value={`${stats.trends.timeLostMinutes} min`} />
              <MetricRow label="Reports" value={String(stats.trends.postponementCount)} />
              <MetricRow label="Annulations" value={String(stats.trends.cancellationCount)} />
              <MetricRow label="Accomplissements" value={String(stats.trends.accomplishmentCount)} />
              <MetricRow label="Objectifs atteints" value={String(stats.trends.goalsReachedCount)} />
            </div>
          </section>

          <div className="statistics-grid">
            <StatCard
              title="Sport"
              summary={
                stats.workout.sessionCount > 0
                  ? `${stats.workout.completedSessions} séances · ${formatStudyMinutesLabel(stats.workout.totalMinutes)} au total`
                  : "Pas encore de séance enregistrée."
              }
            >
              <MetricRow
                label="Durée moyenne"
                value={
                  stats.workout.completedSessions > 0
                    ? `${stats.workout.averageMinutes} min`
                    : "—"
                }
              />
              <MetricRow
                label="Course à pied"
                value={formatStudyMinutesLabel(stats.workout.runningMinutes)}
              />
              <MetricRow
                label="Renforcement"
                value={formatStudyMinutesLabel(stats.workout.strengthMinutes)}
              />
              <MetricRow
                label="Yoga"
                value={formatStudyMinutesLabel(stats.workout.yogaMinutes)}
              />
              <MetricRow
                label="Mobilité"
                value={formatStudyMinutesLabel(stats.workout.mobilityMinutes)}
              />
              <MetricRow
                label="Marche"
                value={formatStudyMinutesLabel(stats.workout.walkingMinutes)}
              />
              <MetricRow
                label="Séances annulées"
                value={String(stats.workout.cancelledSessions)}
              />
              {stats.workout.hasDistanceData ? (
                <MetricRow
                  label="Distance courue"
                  value={`${stats.workout.totalDistanceKm} km`}
                />
              ) : (
                <MetricRow label="Distance courue" value="Non renseignée" />
              )}
            </StatCard>

            <StatCard
              title="Révision"
              summary={
                stats.study.sessionCount > 0
                  ? `${formatStudyMinutesLabel(stats.study.completedMinutes)} effectués sur ${formatStudyMinutesLabel(stats.study.plannedMinutes)} planifiés`
                  : "Pas encore de session d'étude."
              }
            >
              <MetricRow
                label="Objectif période"
                value={
                  stats.study.weeklyGoalMinutes > 0
                    ? formatStudyMinutesLabel(stats.study.weeklyGoalMinutes)
                    : "Non défini"
                }
              />
              <MetricRow
                label="Progression"
                value={
                  stats.study.weeklyGoalMinutes > 0
                    ? `${stats.study.progressPercent} %`
                    : "—"
                }
              />
              <MetricRow
                label="Sessions"
                value={String(stats.study.sessionCount)}
              />
              <MetricRow
                label="Reportées / annulées"
                value={`${stats.study.postponedSessions} / ${stats.study.cancelledSessions}`}
              />
            </StatCard>

            <StatCard
              title="Accomplissements"
              summary={`${stats.completion.completedCount} terminées · ${stats.completion.completedEarlyCount} en avance`}
            >
              <MetricRow
                label="Taux de réalisation"
                value={`${stats.completion.realizationRate} %`}
              />
              <MetricRow
                label="Reportées"
                value={String(stats.completion.postponedCount)}
              />
              <MetricRow
                label="Annulées"
                value={String(stats.completion.cancelledCount)}
              />
              <MetricRow
                label="Charge planifiée"
                value={formatStudyMinutesLabel(stats.completion.plannedMinutes)}
              />
              <MetricRow
                label="Charge réalisée"
                value={formatStudyMinutesLabel(stats.completion.completedMinutes)}
              />
            </StatCard>

            <StatCard
              title="Ressenti"
              summary={
                stats.wellness.hasEnoughData
                  ? "Moyennes calculées sur tes check-ins."
                  : "Pas encore assez de données de ressenti."
              }
            >
              <MetricRow
                label="Énergie moyenne"
                value={
                  stats.wellness.averageEnergy !== null
                    ? `${stats.wellness.averageEnergy} / 5`
                    : "—"
                }
              />
              <MetricRow
                label="Fatigue moyenne"
                value={
                  stats.wellness.averageFatigue !== null
                    ? `${stats.wellness.averageFatigue} / 5`
                    : "—"
                }
              />
              <MetricRow
                label="Jours stressés"
                value={String(stats.wellness.stressedDays)}
              />
            </StatCard>

            <StatCard
              title="Spiritualité"
              summary={
                stats.spiritual.momentCount > 0
                  ? `${stats.spiritual.momentCount} moments · ${formatStudyMinutesLabel(stats.spiritual.totalMinutes)}`
                  : "Aucun moment spirituel enregistré."
              }
            >
              <MetricRow label="Prières" value={String(stats.spiritual.prayerCount)} />
              <MetricRow label="Lectures" value={String(stats.spiritual.readingCount)} />
              <MetricRow label="Gratitude" value={String(stats.spiritual.gratitudeCount)} />
              <MetricRow label="Calme" value={String(stats.spiritual.calmCount)} />
            </StatCard>

            <StatCard
              title="Loisirs"
              summary={
                stats.leisure.totalMinutes > 0
                  ? `${formatStudyMinutesLabel(stats.leisure.totalMinutes)} au total`
                  : "Pas encore de loisir enregistré."
              }
            >
              <MetricRow label="Lecture" value={formatStudyMinutesLabel(stats.leisure.readingMinutes)} />
              <MetricRow label="Musique" value={formatStudyMinutesLabel(stats.leisure.musicMinutes)} />
              <MetricRow label="Promenade" value={formatStudyMinutesLabel(stats.leisure.walkMinutes)} />
              <MetricRow label="Cinéma" value={formatStudyMinutesLabel(stats.leisure.cinemaMinutes)} />
              <MetricRow label="Jeux" value={formatStudyMinutesLabel(stats.leisure.gamesMinutes)} />
            </StatCard>
          </div>
        </>
      )}
    </div>
  );
}
