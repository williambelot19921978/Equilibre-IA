import { useMemo, useState } from "react";

import { CALENDAR_COLORS } from "../../config/calendarColors";
import { formatDeviceTime } from "../../lib/time/deviceClock";
import { computeDayNowState } from "../../lib/planning/dayNowState";
import { resolveVisualTypeColor } from "../../lib/planning/resolveCalendarColor";
import type { DayDisplayMode } from "../../lib/planning/dayDisplayMode";
import { BlockActionsMenu } from "./BlockActionsMenu";
import { SportProposalCard } from "./SportProposalCard";
import { WorkoutSessionPanel } from "./WorkoutSessionPanel";
import {
  isSportProposalEntry,
  isSportTimelineEntry,
  resolveWorkoutSessionForEntry,
} from "../../lib/workout/openWorkoutSessionForBlock";
import {
  MOVE_FUTURE_WORKOUT_CONFIRM_MESSAGE,
  resolveWorkoutAvailability,
} from "../../lib/planning/resolveWorkoutAvailability";
import { getCurrentDeviceDate } from "../../lib/time/deviceClock";
import type { NoTimeChoice, RescheduleOption } from "../../types/taskActivity";
import type {
  WorkoutLevel,
  WorkoutSession,
  WorkoutSessionType,
} from "../../types/workoutSession";
import { Button } from "../ui/Button";
import type { DayTimelineEntry } from "../../lib/planning/displayedDayTimeline";
import { canModifyTimelineEntry } from "../../lib/planning/isTimelineEntryEditable";
import { isTimelineEntryCompletable } from "../../lib/planning/isTimelineEntryCompletable";
import {
  DAY_TIMELINE_TYPE_LABELS,
} from "../../lib/planning/displayedDayTimeline";

function formatTimeRange(startsAt: string, endsAt: string): string {
  if (startsAt === endsAt) {
    return formatDeviceTime(startsAt);
  }

  return `${formatDeviceTime(startsAt)} – ${formatDeviceTime(endsAt)}`;
}

function getStatusLabel(entry: DayTimelineEntry): string | null {
  if (entry.completed && entry.completionStatusLabel) {
    return entry.completionStatusLabel;
  }
  if (!entry.status) return null;
  if (entry.status === "proposed") return "Proposé";
  if (entry.status === "accepted") return "Confirmé";
  if (entry.status === "completed") return entry.completionStatusLabel ?? "Terminé";
  return entry.status;
}

function getCompletionHint(entry: DayTimelineEntry): string | null {
  if (!entry.completed) return null;
  if (entry.completionTiming === "early" && entry.freedMinutes) {
    return `${entry.freedMinutes} min en avance`;
  }
  if (entry.completionTiming === "early" && entry.completionDeltaMinutes) {
    return `${Math.abs(entry.completionDeltaMinutes)} min en avance`;
  }
  if (entry.completionTiming === "late") return "Terminé après l'horaire prévu";
  return null;
}

const TIMELINE_ICONS: Record<DayTimelineEntry["visualType"], string> = {
  wake: "☀️",
  sleep: "🌙",
  children_routine: "👶",
  work: "💼",
  commute: "🚗",
  appointment: "📅",
  task: "✅",
  sport: "🏃",
  rest: "🛋️",
  rest_day: "🛋️",
  vacation: "🏖️",
  travel: "✈️",
  buffer: "⏳",
  free: "🕊️",
};

type DayTimelineProps = {
  entries: DayTimelineEntry[];
  emptyMessage?: string;
  compact?: boolean;
  workIncompleteMessage?: string | null;
  dailyRoutineHref?: string;
  displayMode?: DayDisplayMode;
  now?: Date;
  onEditEntry?: (entry: DayTimelineEntry) => void;
  onSuggestEntry?: (entry: DayTimelineEntry) => void;
  onRescheduleEntry?: (entry: DayTimelineEntry, option: RescheduleOption) => void;
  onNoTimeEntry?: (entry: DayTimelineEntry, choice: NoTimeChoice) => void;
  onCannotDoNowEntry?: (entry: DayTimelineEntry) => void;
  canOfferSmartReschedule?: (entry: DayTimelineEntry) => boolean;
  onCompleteEntry?: (entry: DayTimelineEntry) => void;
  onCancelEntry?: (entry: DayTimelineEntry) => void;
  getWorkoutSession?: (entry: DayTimelineEntry) => WorkoutSession | null;
  onAcceptSportProposal?: (entry: DayTimelineEntry, session: WorkoutSession) => void;
  onRegenerateSportProposal?: (entry: DayTimelineEntry) => void;
  onChangeSportLevel?: (entry: DayTimelineEntry, level: WorkoutLevel) => void;
  onChangeSportType?: (entry: DayTimelineEntry, type: WorkoutSessionType) => void;
  onChangeSportDuration?: (entry: DayTimelineEntry, durationMinutes: number) => void;
  sportAlternateEntryId?: string | null;
  onDismissSportAlternate?: () => void;
  sportSaving?: boolean;
  onStartWorkout?: (entry: DayTimelineEntry) => void;
  onGenerateWorkout?: (entry: DayTimelineEntry) => void;
  onRegenerateWorkout?: (entry: DayTimelineEntry) => void;
  openingWorkout?: boolean;
  workoutCompletedToday?: boolean;
  completingEntryId?: string | null;
  cancellingEntryId?: string | null;
  allEntries?: DayTimelineEntry[];
  collapsePastByDefault?: boolean;
};

function TimelineEntryCard({
  entry,
  displayMode,
  onEditEntry,
  onSuggestEntry,
  onRescheduleEntry,
  onNoTimeEntry,
  onCannotDoNowEntry,
  canOfferSmartReschedule,
  onCompleteEntry,
  onCancelEntry,
  getWorkoutSession,
  onRegenerateSportProposal,
  onChangeSportLevel,
  onChangeSportType,
  onChangeSportDuration,
  sportAlternateEntryId,
  onDismissSportAlternate,
  sportSaving,
  onStartWorkout,
  onGenerateWorkout,
  onRegenerateWorkout,
  openingWorkout,
  compact,
  workoutCompletedToday = false,
  completingEntryId = null,
  cancellingEntryId = null,
  allEntries = [],
}: {
  entry: DayTimelineEntry;
  displayMode: DayDisplayMode;
  onEditEntry?: (entry: DayTimelineEntry) => void;
  onSuggestEntry?: (entry: DayTimelineEntry) => void;
  onRescheduleEntry?: (entry: DayTimelineEntry, option: RescheduleOption) => void;
  onNoTimeEntry?: (entry: DayTimelineEntry, choice: NoTimeChoice) => void;
  onCannotDoNowEntry?: (entry: DayTimelineEntry) => void;
  canOfferSmartReschedule?: (entry: DayTimelineEntry) => boolean;
  onCompleteEntry?: (entry: DayTimelineEntry) => void;
  onCancelEntry?: (entry: DayTimelineEntry) => void;
  getWorkoutSession?: (entry: DayTimelineEntry) => WorkoutSession | null;
  onRegenerateSportProposal?: (entry: DayTimelineEntry) => void;
  onChangeSportLevel?: (entry: DayTimelineEntry, level: WorkoutLevel) => void;
  onChangeSportType?: (entry: DayTimelineEntry, type: WorkoutSessionType) => void;
  onChangeSportDuration?: (entry: DayTimelineEntry, durationMinutes: number) => void;
  sportAlternateEntryId?: string | null;
  onDismissSportAlternate?: () => void;
  sportSaving?: boolean;
  onStartWorkout?: (entry: DayTimelineEntry) => void;
  onGenerateWorkout?: (entry: DayTimelineEntry) => void;
  onRegenerateWorkout?: (entry: DayTimelineEntry) => void;
  openingWorkout?: boolean;
  compact?: boolean;
  workoutCompletedToday?: boolean;
  completingEntryId?: string | null;
  cancellingEntryId?: string | null;
  allEntries?: DayTimelineEntry[];
}) {
  const statusLabel = getStatusLabel(entry);
  const completionHint = getCompletionHint(entry);
  const colorCategory = resolveVisualTypeColor(entry.visualType);
  const colors = CALENDAR_COLORS[colorCategory];
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const isProposal = isSportProposalEntry(entry);
  const workoutSession = resolveWorkoutSessionForEntry(
    entry,
    getWorkoutSession?.(entry) ?? null,
  );
  const proposedSession = isProposal ? entry.proposedWorkoutSession ?? null : null;
  const showSportProposalCard = Boolean(
    proposedSession && isProposal && entry.blockKind !== "free_slot",
  );
  const showTitleAndActions = !showSportProposalCard;
  const showActions =
    entry.blockKind !== "free_slot" &&
    (onRescheduleEntry ||
      onNoTimeEntry ||
      onEditEntry ||
      onCompleteEntry ||
      onCancelEntry);
  const entryCanModify =
    Boolean(onEditEntry) && canModifyTimelineEntry(entry, displayMode);
  const entryCanComplete =
    Boolean(onCompleteEntry) && isTimelineEntryCompletable(entry);
  const isSportEntry = isSportTimelineEntry(entry);
  const workoutAvailability = isSportEntry
    ? resolveWorkoutAvailability({
        entry,
        currentLocalDate: getCurrentDeviceDate(),
        workoutCompletedToday,
        scheduledSportEntries: allEntries,
      })
    : null;
  const todayWorkoutEntry = workoutAvailability?.todayWorkoutEntryId
    ? allEntries.find((item) => item.id === workoutAvailability.todayWorkoutEntryId)
    : null;

  return (
    <article
      className={`day-timeline-entry day-timeline-${entry.visualType}${entry.completed ? " day-timeline-completed" : ""}`}
      style={{
        borderLeftColor: colors.border,
        background: colors.background,
      }}
    >
      <div
        className="day-timeline-icon-wrap"
        aria-hidden="true"
      >
        {TIMELINE_ICONS[entry.visualType]}
      </div>

      <div className="day-timeline-body">
      <div className="day-timeline-time">
        {formatTimeRange(entry.startsAt, entry.endsAt)}
      </div>

      <div className="day-timeline-content">
        <div className="day-timeline-meta">
          <span
            className="day-timeline-type"
            style={{ color: colors.text, background: colors.background }}
          >
            {DAY_TIMELINE_TYPE_LABELS[entry.visualType]}
          </span>
          {entry.locked && (
            <span className="day-timeline-locked">🔒 Verrouillé</span>
          )}
          {statusLabel && (
            <span className={`day-timeline-status${entry.completed ? " day-timeline-status-completed" : ""}`}>
              {entry.completed ? "✔ " : ""}
              {statusLabel}
            </span>
          )}
          {completionHint && (
            <span className="day-timeline-completion-hint">{completionHint}</span>
          )}
        </div>

        <div className="day-timeline-title-row">
          {showTitleAndActions && <h3>{entry.title}</h3>}
          <div className="day-timeline-actions">
            {showTitleAndActions && (
              <>
                {entry.blockKind === "free_slot" && onSuggestEntry && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onSuggestEntry(entry)}
                  >
                    Me proposer une activité
                  </Button>
                )}
                {showActions && (
                  <BlockActionsMenu
                    entry={entry}
                    compact={compact}
                    openingWorkout={openingWorkout}
                    onViewWorkout={
                      workoutSession ? () => setWorkoutOpen(true) : undefined
                    }
                    onModify={() => {
                      if (import.meta.env.DEV) {
                        console.log("[EDIT BLOCK CLICK]", {
                          blockId: entry.id,
                          source: entry.origin,
                          visualType: entry.visualType,
                          calendarItemId: entry.calendarItemId,
                          editable: entryCanModify,
                        });
                      }
                      onEditEntry?.(entry);
                    }}
                    canModify={entryCanModify}
                    showCompleteButton={entryCanComplete}
                    completing={completingEntryId === entry.id}
                    cancelling={cancellingEntryId === entry.id}
                    onReschedule={(option) => onRescheduleEntry?.(entry, option)}
                    onNoTime={(choice) => onNoTimeEntry?.(entry, choice)}
                    showSmartReschedule={canOfferSmartReschedule?.(entry) ?? false}
                    onCannotDoNow={() => onCannotDoNowEntry?.(entry)}
                    onComplete={() => onCompleteEntry?.(entry)}
                    onCancel={() => onCancelEntry?.(entry)}
                    onStartWorkout={() => onStartWorkout?.(entry)}
                    onGenerateWorkout={() => onGenerateWorkout?.(entry)}
                    onRegenerateWorkout={() => onRegenerateWorkout?.(entry)}
                    workoutAvailability={workoutAvailability}
                    onOpenTodayWorkout={
                      todayWorkoutEntry
                        ? () => onStartWorkout?.(todayWorkoutEntry)
                        : undefined
                    }
                    onMoveWorkoutToToday={
                      workoutAvailability?.status === "future_workout"
                        ? () => {
                            if (
                              !window.confirm(MOVE_FUTURE_WORKOUT_CONFIRM_MESSAGE)
                            ) {
                              return;
                            }
                            onRescheduleEntry?.(entry, "later_today");
                          }
                        : undefined
                    }
                  />
                )}
              </>
            )}
          </div>
        </div>

        {showSportProposalCard && proposedSession && (
          <SportProposalCard
            session={proposedSession}
            saving={sportSaving || openingWorkout}
            showAlternatePanel={sportAlternateEntryId === entry.id}
            onViewSession={() => setWorkoutOpen(true)}
            onStartSession={() => onStartWorkout?.(entry)}
            onAnotherSession={() => onRegenerateSportProposal?.(entry)}
            onChooseSession={() => onDismissSportAlternate?.()}
            onCancelAlternate={() => onDismissSportAlternate?.()}
            onChangeLevel={(level) => onChangeSportLevel?.(entry, level)}
            onChangeType={(type) => onChangeSportType?.(entry, type)}
            onChangeDuration={(duration) => onChangeSportDuration?.(entry, duration)}
            maxDurationMinutes={Math.round(
              (new Date(entry.endsAt).getTime() - new Date(entry.startsAt).getTime()) /
                60_000,
            )}
            onReschedule={() => onRescheduleEntry?.(entry, "later_today")}
            onNoTime={() => onNoTimeEntry?.(entry, "postpone")}
          />
        )}

        {workoutOpen && workoutSession && (
          <WorkoutSessionPanel
            session={workoutSession}
            onClose={() => setWorkoutOpen(false)}
          />
        )}

        {entry.achievementMessage && entry.completed && (
          <p className="day-timeline-achievement">{entry.achievementMessage}</p>
        )}

        {entry.actualCompletedAt && entry.completed && (
          <p className="day-timeline-actual-end">
            Terminé à {formatDeviceTime(entry.actualCompletedAt)}
          </p>
        )}

        {entry.comment && (
          <p className="day-timeline-comment">{entry.comment}</p>
        )}

        {entry.primarySuggestion && (
          <div className="day-timeline-primary-suggestion">
            <p className="day-timeline-primary-suggestion-label">Suggestion</p>
            <p className="day-timeline-primary-suggestion-title">
              {entry.primarySuggestion.title}
            </p>
            <p className="day-timeline-primary-suggestion-reason">
              {entry.primarySuggestion.reason}
            </p>
          </div>
        )}

        {entry.explanation && (
          <p className="day-timeline-explanation">{entry.explanation}</p>
        )}
      </div>
      </div>
    </article>
  );
}

export function DayTimeline({
  entries,
  emptyMessage = "Aucun bloc à afficher pour cette journée.",
  compact = false,
  workIncompleteMessage = null,
  dailyRoutineHref,
  displayMode = "live",
  now = new Date(),
  collapsePastByDefault = false,
  onEditEntry,
  onSuggestEntry,
  onRescheduleEntry,
  onNoTimeEntry,
  onCannotDoNowEntry,
  canOfferSmartReschedule,
  onCompleteEntry,
  onCancelEntry,
  getWorkoutSession,
  onRegenerateSportProposal,
  onChangeSportLevel,
  onChangeSportType,
  onChangeSportDuration,
  sportAlternateEntryId,
  onDismissSportAlternate,
  sportSaving,
  onStartWorkout,
  onGenerateWorkout,
  onRegenerateWorkout,
  openingWorkout,
  workoutCompletedToday = false,
  completingEntryId = null,
  cancellingEntryId = null,
}: DayTimelineProps) {
  const nowMs = now.getTime();
  const [showPast, setShowPast] = useState(false);

  const { pastEntries, currentAndFutureEntries } = useMemo(() => {
    if (displayMode !== "live") {
      return { pastEntries: [], currentAndFutureEntries: entries };
    }

    const past: DayTimelineEntry[] = [];
    const currentFuture: DayTimelineEntry[] = [];

    for (const entry of entries) {
      if (new Date(entry.endsAt).getTime() <= nowMs) {
        past.push(entry);
      } else {
        currentFuture.push(entry);
      }
    }

    return { pastEntries: past, currentAndFutureEntries: currentFuture };
  }, [entries, displayMode, nowMs]);

  const pastCollapsed =
    collapsePastByDefault &&
    displayMode === "live" &&
    pastEntries.length > 0 &&
    !showPast;

  const nowState = useMemo(
    () => computeDayNowState(entries, now),
    [entries, now],
  );

  if (entries.length === 0 && !workIncompleteMessage) {
    return <p className="timeline-empty">{emptyMessage}</p>;
  }

  return (
    <div className={`day-timeline${compact ? " day-timeline-compact" : ""}`}>
      {workIncompleteMessage && (
        <div className="timeline-alert">
          <p>{workIncompleteMessage}</p>
          {dailyRoutineHref && (
            <a className="timeline-alert-link" href={dailyRoutineHref}>
              Compléter Mon quotidien
            </a>
          )}
        </div>
      )}

      {displayMode === "historical" && (
        <p className="timeline-mode-hint">Journée passée — archive enregistrée</p>
      )}

      {displayMode === "live" && pastCollapsed && (
        <div className="timeline-past-collapsed">
          <p>{pastEntries.length} moment(s) déjà passé(s)</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPast(true)}
          >
            Afficher les moments passés
          </Button>
        </div>
      )}

      {displayMode === "live" && showPast && pastEntries.length > 0 && (
        <section className="timeline-past-section">
          <h3>Déjà passé</h3>
          {pastEntries.map((entry) => (
            <TimelineEntryCard
              key={entry.id}
              entry={entry}
              displayMode={displayMode}
              compact={compact}
              onEditEntry={onEditEntry}
              onSuggestEntry={onSuggestEntry}
              onRescheduleEntry={onRescheduleEntry}
              onNoTimeEntry={onNoTimeEntry}
              onCannotDoNowEntry={onCannotDoNowEntry}
              canOfferSmartReschedule={canOfferSmartReschedule}
              onCompleteEntry={onCompleteEntry}
              onCancelEntry={onCancelEntry}
              getWorkoutSession={getWorkoutSession}
              onRegenerateSportProposal={onRegenerateSportProposal}
              onChangeSportLevel={onChangeSportLevel}
              onChangeSportType={onChangeSportType}
              onChangeSportDuration={onChangeSportDuration}
              sportAlternateEntryId={sportAlternateEntryId}
              onDismissSportAlternate={onDismissSportAlternate}
              sportSaving={sportSaving}
              onStartWorkout={onStartWorkout}
              onGenerateWorkout={onGenerateWorkout}
              onRegenerateWorkout={onRegenerateWorkout}
              openingWorkout={openingWorkout}
              workoutCompletedToday={workoutCompletedToday}
              completingEntryId={completingEntryId}
              cancellingEntryId={cancellingEntryId}
              allEntries={entries}
            />
          ))}
        </section>
      )}

      {displayMode === "live" && (
        <div className="timeline-now-marker" aria-label="Maintenant">
          <span>Maintenant</span>
          <span className="timeline-now-time">{formatDeviceTime(now.toISOString())}</span>
        </div>
      )}

       {(displayMode === "live" ? currentAndFutureEntries : entries).map(
         (entry) => (
           <TimelineEntryCard
             key={entry.id}
             entry={entry}
             displayMode={displayMode}
             compact={compact}
             onEditEntry={onEditEntry}
             onSuggestEntry={onSuggestEntry}
             onRescheduleEntry={onRescheduleEntry}
             onNoTimeEntry={onNoTimeEntry}
             onCannotDoNowEntry={onCannotDoNowEntry}
             canOfferSmartReschedule={canOfferSmartReschedule}
             onCompleteEntry={onCompleteEntry}
             onCancelEntry={onCancelEntry}
             getWorkoutSession={getWorkoutSession}
             onRegenerateSportProposal={onRegenerateSportProposal}
             onChangeSportLevel={onChangeSportLevel}
             onChangeSportType={onChangeSportType}
             sportAlternateEntryId={sportAlternateEntryId}
             onDismissSportAlternate={onDismissSportAlternate}
             sportSaving={sportSaving}
             onStartWorkout={onStartWorkout}
             onGenerateWorkout={onGenerateWorkout}
             onRegenerateWorkout={onRegenerateWorkout}
             openingWorkout={openingWorkout}
             workoutCompletedToday={workoutCompletedToday}
             completingEntryId={completingEntryId}
             cancellingEntryId={cancellingEntryId}
             allEntries={entries}
           />
         ),
       )}

      {displayMode === "live" && nowState.currentEntry && (
        <p className="timeline-now-caption">
          En cours : {nowState.currentEntry.title}
        </p>
      )}
    </div>
  );
}
