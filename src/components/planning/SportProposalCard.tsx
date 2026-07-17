import { BlockActionButton } from "./BlockActionButton";
import { Button } from "../ui/Button";
import {
  WORKOUT_LEVEL_LABELS,
  WORKOUT_SESSION_TYPE_LABELS,
  type WorkoutSession,
} from "../../types/workoutSession";
import type { WorkoutLevel, WorkoutSessionType } from "../../types/workoutSession";
import { sportDurationOptionsForType } from "../../lib/planning/resolveSportDuration";

type SportProposalCardProps = {
  session: WorkoutSession;
  onViewSession: () => void;
  onStartSession: () => void;
  onAnotherSession: () => void;
  onChangeType?: (type: WorkoutSessionType) => void;
  onChangeDuration?: (durationMinutes: number) => void;
  maxDurationMinutes?: number;
  onChangeLevel?: (level: WorkoutLevel) => void;
  onReschedule?: () => void;
  onNoTime?: () => void;
  showAlternatePanel?: boolean;
  onChooseSession?: () => void;
  onCancelAlternate?: () => void;
  saving?: boolean;
};

export function SportProposalCard({
  session,
  onViewSession,
  onStartSession,
  onAnotherSession,
  onChangeType,
  onChangeDuration,
  maxDurationMinutes,
  onChangeLevel,
  onReschedule,
  onNoTime,
  showAlternatePanel = false,
  onChooseSession,
  onCancelAlternate,
  saving = false,
}: SportProposalCardProps) {
  return (
    <div className="sport-proposal-card">
      <p className="sport-proposal-label">Activité sportive proposée</p>

      <div className="sport-proposal-preview">
        <h4>{session.title}</h4>
        <ul className="sport-proposal-meta">
          <li>{WORKOUT_LEVEL_LABELS[session.level]}</li>
          <li>{session.durationMinutes} min</li>
          <li>{WORKOUT_SESSION_TYPE_LABELS[session.type]}</li>
          <li>{session.equipment}</li>
        </ul>
        <p className="sport-proposal-reason">{session.generatedReason}</p>
        {onChangeDuration && (
          <label className="sport-proposal-duration">
            Durée
            <select
              value={session.durationMinutes}
              onChange={(event) => onChangeDuration(Number(event.target.value))}
              disabled={saving}
            >
              {sportDurationOptionsForType(session.type, maxDurationMinutes).map((value) => (
                <option key={value} value={value}>
                  {value} min
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="sport-proposal-actions">
        <BlockActionButton icon="👁" label="Voir la séance" onClick={onViewSession} />
        <BlockActionButton
          icon="▶"
          label="Faire cette séance"
          tone="primary"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onStartSession();
          }}
          disabled={saving}
        />
        <BlockActionButton
          icon="↻"
          label="Proposer une autre séance"
          onClick={onAnotherSession}
          disabled={saving}
        />
        {onReschedule && (
          <BlockActionButton icon="⏱" label="Décaler" onClick={onReschedule} />
        )}
        {onNoTime && (
          <BlockActionButton icon="⏳" label="Je n'ai pas le temps" onClick={onNoTime} />
        )}
      </div>

      {showAlternatePanel && (
        <div className="sport-proposal-alternate" role="dialog" aria-label="Autre proposition">
          <p className="sport-proposal-alternate-title">Voici une autre proposition</p>
          <div className="sport-proposal-alternate-actions">
            <BlockActionButton
              icon="✓"
              label="Choisir cette séance"
              tone="primary"
              fullWidth
              onClick={onChooseSession}
            />
            <BlockActionButton
              icon="↻"
              label="Encore une autre"
              fullWidth
              onClick={onAnotherSession}
            />
            {onChangeType && (
              <BlockActionButton
                icon="🏷"
                label="Changer le type"
                fullWidth
                onClick={() => onChangeType("mobility")}
              />
            )}
            {onChangeLevel && (
              <BlockActionButton
                icon="📶"
                label="Changer le niveau"
                fullWidth
                onClick={() =>
                  onChangeLevel(
                    session.level === "beginner"
                      ? "intermediate"
                      : session.level === "intermediate"
                        ? "advanced"
                        : "beginner",
                  )
                }
              />
            )}
            <Button type="button" size="sm" variant="ghost" fullWidth onClick={onCancelAlternate}>
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
