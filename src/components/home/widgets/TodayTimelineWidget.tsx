import { DayNowStatus } from "../../planning/DayNowStatus";
import { DayTimeline } from "../../planning/DayTimeline";
import { Button } from "../../ui/Button";
import { EmptyState } from "../../ui/EmptyState";
import { hasGeneratedPlanning } from "../../../lib/planning/displayedDayTimeline";
import type { HomeWidgetContext } from "./types";

export function TodayTimelineWidget({ context }: { context: HomeWidgetContext }) {
  const hasGenerated = hasGeneratedPlanning(context.timeline);
  const showEmpty =
    !context.loadingPlan && context.timeline.length === 0;

  return (
    <section className="home-widget home-widget-timeline">
      <div className="section-heading">
        <div>
          <p className="card-label">Aujourd&apos;hui</p>
          <h2>{context.formatDateLabel(context.selectedDate)}</h2>
        </div>
      </div>

      {context.planError && (
        <div className="message message-error">{context.planError}</div>
      )}

      {context.loadingPlan ? (
        <p>Chargement de ta journée…</p>
      ) : showEmpty ? (
        <EmptyState
          aura="empty"
          title="Ta journée n'est pas encore organisée."
          description="Génère une première proposition pour voir ta timeline."
          className="home-empty-plan"
        >
          <Button
            onClick={() => void context.generatePlan()}
            disabled={context.generating}
            loading={context.generating}
            fullWidth
          >
            Générer ma journée
          </Button>
        </EmptyState>
      ) : (
        <>
          <DayNowStatus
            entries={context.timeline}
            now={context.now}
            show={context.isLiveToday}
          />

          <DayTimeline
            entries={context.timeline}
            compact
            displayMode={context.displayMode}
            now={context.now}
            collapsePastByDefault={context.isLiveToday}
            onSuggestEntry={
              context.canRegenerate ? context.onSuggestEntry : undefined
            }
            onEditEntry={context.onEditEntry}
            onRescheduleEntry={context.onRescheduleEntry}
            onNoTimeEntry={context.onNoTimeEntry}
            onCompleteEntry={context.onCompleteEntry}
            completingEntryId={context.completingEntryId}
            cancellingEntryId={context.cancellingEntryId}
            onCancelEntry={context.onCancelEntry}
            getWorkoutSession={context.getWorkoutSession}
            onAcceptSportProposal={context.onAcceptSportProposal}
            onRegenerateSportProposal={context.onRegenerateSportProposal}
            onChangeSportLevel={context.onChangeSportLevel}
            onChangeSportType={context.onChangeSportType}
            onChangeSportDuration={context.onChangeSportDuration}
            sportAlternateEntryId={context.sportAlternateEntryId}
            onDismissSportAlternate={context.onDismissSportAlternate}
            sportSaving={context.sportSaving}
            onRegenerateWorkout={context.onRegenerateWorkout}
            onStartWorkout={context.onStartWorkout}
            onGenerateWorkout={context.onGenerateWorkout}
            openingWorkout={context.openingWorkout}
            workoutCompletedToday={context.workoutCompletedToday}
          />

          {context.canRegenerate && (
            <div className="home-plan-actions">
              <Button
                onClick={() => void context.regeneratePlan()}
                disabled={context.generating}
                loading={context.generating}
              >
                Régénérer ma journée
              </Button>
              <Button variant="secondary" onClick={context.onOpenPlanning}>
                Modifier ma journée
              </Button>
            </div>
          )}

          {!hasGenerated && context.canRegenerate && (
            <p className="planning-hint">
              Contraintes visibles — génère la journée pour les tâches proposées.
            </p>
          )}
        </>
      )}
    </section>
  );
}
