import { useState } from "react";

import { BlockActionButton } from "./BlockActionButton";
import { Button } from "../ui/Button";
import type { DayTimelineEntry } from "../../lib/planning/displayedDayTimeline";
import type { NoTimeChoice, RescheduleOption } from "../../types/taskActivity";
import { isHardConstraint } from "../../lib/planning/blockActionHelpers";
import {
  isSportTimelineEntry,
} from "../../lib/workout/openWorkoutSessionForBlock";
import type { WorkoutAvailabilityResult } from "../../lib/planning/resolveWorkoutAvailability";

type BlockActionsMenuProps = {
  entry: DayTimelineEntry;
  onReschedule: (option: RescheduleOption) => void;
  onNoTime: (choice: NoTimeChoice) => void;
  onModify: () => void;
  canModify?: boolean;
  showCompleteButton?: boolean;
  completing?: boolean;
  cancelling?: boolean;
  onComplete: () => void;
  onCancel: () => void;
  onViewWorkout?: () => void;
  onStartWorkout?: () => void;
  onGenerateWorkout?: () => void;
  onRegenerateWorkout?: () => void;
  onOpenTodayWorkout?: () => void;
  onMoveWorkoutToToday?: () => void;
  workoutAvailability?: WorkoutAvailabilityResult | null;
  openingWorkout?: boolean;
  compact?: boolean;
};

export function BlockActionsMenu({
  entry,
  onReschedule,
  onNoTime,
  onModify,
  canModify = true,
  showCompleteButton = true,
  completing = false,
  cancelling = false,
  onComplete,
  onCancel,
  onViewWorkout,
  onStartWorkout,
  onGenerateWorkout,
  onRegenerateWorkout,
  onOpenTodayWorkout,
  onMoveWorkoutToToday,
  workoutAvailability = null,
  openingWorkout = false,
  compact = false,
}: BlockActionsMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [noTimeOpen, setNoTimeOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const hard = isHardConstraint(entry);
  const isSportEntry = isSportTimelineEntry(entry);
  const hasWorkoutSession = Boolean(
    entry.workoutSession || entry.proposedWorkoutSession,
  );
  const workoutBlocked = Boolean(workoutAvailability && !workoutAvailability.canStart);
  const workoutCanComplete = workoutAvailability
    ? workoutAvailability.canComplete
    : true;
  const canShowComplete = showCompleteButton && workoutCanComplete;

  if (entry.visualType === "wake" || entry.visualType === "sleep") {
    return null;
  }

  if (entry.completed) {
    return (
      <div className="block-actions block-actions-completed">
        <span className="block-actions-completed-label">Accomplissement enregistré</span>
      </div>
    );
  }

  const actionButtons = (
    <>
      {workoutBlocked && workoutAvailability?.message && (
        <p className="block-actions-workout-message">{workoutAvailability.message}</p>
      )}
      {workoutBlocked && workoutAvailability?.todayWorkoutEntryId && onOpenTodayWorkout && (
        <BlockActionButton
          icon="🏃"
          label="Voir la séance d'aujourd'hui"
          tone="primary"
          onClick={onOpenTodayWorkout}
        />
      )}
      {workoutAvailability?.status === "future_workout" && onMoveWorkoutToToday && (
        <BlockActionButton
          icon="↦"
          label="Faire aujourd'hui exceptionnellement"
          onClick={onMoveWorkoutToToday}
        />
      )}
      <BlockActionButton
        icon="⏱"
        label="Décaler"
        onClick={() => setRescheduleOpen((value) => !value)}
      />
      <BlockActionButton
        icon="⏳"
        label="Je n'ai pas le temps"
        onClick={() => setNoTimeOpen((value) => !value)}
      />
      {canModify && (
        <BlockActionButton
          icon="✎"
          label="Modifier"
          onClick={onModify}
        />
      )}
      {canShowComplete && (
        <BlockActionButton
          icon="✓"
          label={completing ? "Terminaison…" : "Terminer"}
          tone="primary"
          onClick={() => {
            if (completing) return;
            onComplete();
          }}
          disabled={completing}
        />
      )}
      {!hard && (
        <BlockActionButton
          icon="✕"
          label={cancelling ? "Annulation…" : "Annuler"}
          tone="danger"
          onClick={() => {
            if (cancelling) return;
            onCancel();
          }}
          disabled={cancelling}
        />
      )}
      {hasWorkoutSession && onViewWorkout && (
        <BlockActionButton
          icon="🏃"
          label="Voir la séance"
          onClick={onViewWorkout}
        />
      )}
      {isSportEntry && onStartWorkout && !workoutBlocked && (
        <BlockActionButton
          icon="▶"
          label={openingWorkout ? "Ouverture…" : "Faire la séance"}
          tone="primary"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onStartWorkout();
          }}
          disabled={openingWorkout}
        />
      )}
      {isSportEntry && !hasWorkoutSession && onGenerateWorkout && (
        <BlockActionButton
          icon="✨"
          label="Générer une séance"
          onClick={onGenerateWorkout}
        />
      )}
      {isSportEntry && hasWorkoutSession && onRegenerateWorkout && (
        <BlockActionButton
          icon="↻"
          label="Proposer une autre séance"
          onClick={onRegenerateWorkout}
        />
      )}
    </>
  );

  return (
    <div className={`block-actions${compact ? " block-actions-compact" : ""}`}>
      {!compact && <div className="block-actions-row">{actionButtons}</div>}

      {compact && (
        <>
          <BlockActionButton
            icon="⋯"
            label="Actions"
            onClick={() => setMenuOpen((value) => !value)}
          />
          {menuOpen && (
            <div className="block-actions-menu" role="menu">
              <div className="block-actions-row block-actions-row-stacked">
                {actionButtons}
              </div>
            </div>
          )}
        </>
      )}

      {noTimeOpen && (
        <div className="block-actions-sheet" role="dialog" aria-label="Que veux-tu faire ?">
          <p className="block-actions-sheet-title">Que veux-tu faire ?</p>
          <div className="block-actions-sheet-actions">
            <BlockActionButton
              icon="✕"
              label="Annuler pour aujourd'hui"
              tone="danger"
              fullWidth
              onClick={() => {
                onNoTime("cancel_today");
                setNoTimeOpen(false);
              }}
            />
            <BlockActionButton
              icon="→"
              label="Reporter"
              fullWidth
              onClick={() => {
                onNoTime("postpone");
                setNoTimeOpen(false);
              }}
            />
            <BlockActionButton
              icon="10"
              label="Réduire à 10 minutes"
              fullWidth
              onClick={() => {
                onNoTime("shorten_10");
                setNoTimeOpen(false);
              }}
            />
            <BlockActionButton
              icon="15"
              label="Réduire à 15 minutes"
              fullWidth
              onClick={() => {
                onNoTime("shorten_15");
                setNoTimeOpen(false);
              }}
            />
            <BlockActionButton
              icon="↩"
              label="Garder finalement"
              tone="ghost"
              fullWidth
              onClick={() => {
                onNoTime("keep");
                setNoTimeOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {rescheduleOpen && (
        <div className="block-actions-sheet" role="dialog" aria-label="Décaler l'activité">
          <p className="block-actions-sheet-title">Décaler « {entry.title} »</p>
          <div className="block-actions-sheet-actions">
            <BlockActionButton
              icon="⏱"
              label="Plus tard aujourd'hui"
              tone="primary"
              fullWidth
              onClick={() => {
                onReschedule("later_today");
                setRescheduleOpen(false);
              }}
            />
            <BlockActionButton
              icon="📅"
              label="Demain"
              fullWidth
              onClick={() => {
                onReschedule("tomorrow");
                setRescheduleOpen(false);
              }}
            />
            <Button type="button" size="sm" variant="ghost" fullWidth onClick={() => setRescheduleOpen(false)}>
              Fermer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
