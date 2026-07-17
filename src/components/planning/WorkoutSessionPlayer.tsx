import { useState } from "react";

import { useWorkoutTimer } from "../../hooks/useWorkoutTimer";
import { buildWorkoutTimerSteps } from "../../lib/workout/workoutSessionSteps";
import type { WorkoutSession } from "../../types/workoutSession";
import {
  WORKOUT_LEVEL_LABELS,
  WORKOUT_SESSION_TYPE_LABELS,
} from "../../types/workoutSession";
import { BlockActionButton } from "./BlockActionButton";
import { Button } from "../ui/Button";

export type WorkoutCompletionOutcome =
  | "completed"
  | "partial"
  | "interrupted"
  | "too_hard"
  | "no_time";

type WorkoutSessionPlayerProps = {
  session: WorkoutSession;
  onClose: () => void;
  onComplete: (outcome: WorkoutCompletionOutcome) => void;
  onTimerStart?: () => void;
};

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function WorkoutSessionPlayer({
  session,
  onClose,
  onComplete,
  onTimerStart,
}: WorkoutSessionPlayerProps) {
  const steps = buildWorkoutTimerSteps(session);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(false);
  const [showStopSheet, setShowStopSheet] = useState(false);

  const timer = useWorkoutTimer({
    sessionId: session.id,
    steps,
    soundEnabled,
    vibrationEnabled,
  });

  const progress =
    timer.totalSteps > 0
      ? Math.round(((timer.stepIndex + 1) / timer.totalSteps) * 100)
      : 0;

  return (
    <div className="workout-player-overlay" role="dialog" aria-label="Séance en cours">
      <div className="workout-player">
        <header className="workout-player-header">
          <div>
            <p className="card-label">Séance en cours</p>
            <h2>{session.title}</h2>
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            Fermer
          </Button>
        </header>

        <ul className="workout-player-meta">
          <li>{WORKOUT_LEVEL_LABELS[session.level]}</li>
          <li>{session.durationMinutes} min</li>
          <li>{WORKOUT_SESSION_TYPE_LABELS[session.type]}</li>
          <li>{session.equipment}</li>
        </ul>

        <div className="workout-player-timer">
          <p className="workout-player-phase">{timer.currentStep?.label ?? "Prêt"}</p>
          <p className="workout-player-time">{formatClock(timer.remainingSeconds)}</p>
          <p className="workout-player-exercise">
            {timer.currentStep?.exerciseName ?? "Appuie sur Démarrer pour commencer"}
          </p>
          {timer.currentStep?.round && timer.currentStep.totalRounds ? (
            <p className="workout-player-round">
              Tour {timer.currentStep.round} / {timer.currentStep.totalRounds}
            </p>
          ) : null}
          {timer.nextStep && (
            <p className="workout-player-next">Suivant : {timer.nextStep.exerciseName}</p>
          )}
          <div className="workout-player-progress" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="workout-player-preferences">
          <label>
            <input
              type="checkbox"
              checked={vibrationEnabled}
              onChange={(event) => setVibrationEnabled(event.target.checked)}
            />
            Vibration
          </label>
          <label>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(event) => setSoundEnabled(event.target.checked)}
            />
            Signal sonore
          </label>
        </div>

        <div className="workout-player-actions">
          {timer.status === "idle" && (
            <BlockActionButton
              icon="▶"
              label="Démarrer"
              tone="primary"
              onClick={() => {
                onTimerStart?.();
                timer.start();
              }}
            />
          )}
          {timer.status === "running" && (
            <BlockActionButton icon="⏸" label="Pause" onClick={timer.pause} />
          )}
          {timer.status === "paused" && (
            <BlockActionButton icon="▶" label="Reprendre" tone="primary" onClick={timer.resume} />
          )}
          {(timer.status === "running" || timer.status === "paused") && (
            <>
              <BlockActionButton icon="⏭" label="Passer" onClick={timer.skip} />
              <BlockActionButton icon="⏮" label="Précédent" onClick={timer.previous} />
              <BlockActionButton
                icon="⏹"
                label="Arrêter"
                tone="danger"
                onClick={() => setShowStopSheet(true)}
              />
            </>
          )}
          {timer.status === "completed" && (
            <>
              <p className="workout-player-success">Bravo — séance terminée.</p>
              <BlockActionButton
                icon="✓"
                label="Séance terminée"
                tone="primary"
                onClick={() => onComplete("completed")}
              />
              <BlockActionButton
                icon="🧘"
                label="Récupération courte"
                onClick={() => onComplete("completed")}
              />
            </>
          )}
        </div>

        {showStopSheet && (
          <div className="workout-player-stop-sheet" role="dialog" aria-label="Arrêt anticipé">
            <p>Comment s’est passée la séance ?</p>
            <div className="workout-player-stop-actions">
              <BlockActionButton
                icon="½"
                label="Terminé partiellement"
                fullWidth
                onClick={() => {
                  setShowStopSheet(false);
                  onComplete("partial");
                }}
              />
              <BlockActionButton
                icon="⏹"
                label="Interrompu"
                fullWidth
                onClick={() => {
                  setShowStopSheet(false);
                  onComplete("interrupted");
                }}
              />
              <BlockActionButton
                icon="📈"
                label="Trop difficile"
                fullWidth
                onClick={() => {
                  setShowStopSheet(false);
                  onComplete("too_hard");
                }}
              />
              <BlockActionButton
                icon="⏳"
                label="Manque de temps"
                fullWidth
                onClick={() => {
                  setShowStopSheet(false);
                  onComplete("no_time");
                }}
              />
              <Button type="button" variant="ghost" fullWidth onClick={() => setShowStopSheet(false)}>
                Continuer la séance
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
