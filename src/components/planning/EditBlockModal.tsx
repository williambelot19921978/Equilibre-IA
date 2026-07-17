import { useEffect, useMemo, useState } from "react";

import { Button } from "../ui/Button";
import {
  ACTIVITY_TYPES,
  defaultTitleForActivity,
  type ActivityType,
} from "../../config/activityTypes";
import { isComputedFreeSlot } from "../../lib/planning/applyTimelineEdit";
import type { DayTimelineEntry } from "../../lib/planning/displayedDayTimeline";
import { DAY_TIMELINE_TYPE_LABELS } from "../../lib/planning/displayedDayTimeline";
import {
  buildManualBlockAdjustment,
  combineDateAndLocalTime,
  isoToTimeInput,
} from "../../lib/planning/blockAdjustmentHelpers";
import type { AdjustmentScope } from "../../types/manualBlockAdjustment";

type EditBlockModalProps = {
  entry: DayTimelineEntry;
  date: string;
  userId: string;
  saving?: boolean;
  onClose: () => void;
  onSave: (payload: {
    title: string;
    startsAt: string;
    endsAt: string;
    locked: boolean;
    comment?: string;
    scope: AdjustmentScope;
    activityType: ActivityType;
    adjustment: ReturnType<typeof buildManualBlockAdjustment>;
    confirmLockedEdit: boolean;
    confirmCompletedEdit: boolean;
  }) => Promise<void>;
  onComplete?: () => Promise<void>;
  canComplete?: boolean;
  completing?: boolean;
};

function durationFromTimes(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);
  return endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
}

export function EditBlockModal({
  entry,
  date,
  userId,
  saving = false,
  onClose,
  onSave,
  onComplete,
  canComplete = false,
  completing = false,
}: EditBlockModalProps) {
  const isFreeSlot = isComputedFreeSlot(entry);

  const [activityType, setActivityType] = useState<ActivityType>(
    entry.activityType ?? "work",
  );
  const [title, setTitle] = useState(
    isFreeSlot ? defaultTitleForActivity("work") : entry.title,
  );
  const [startTime, setStartTime] = useState(isoToTimeInput(entry.startsAt));
  const [endTime, setEndTime] = useState(isoToTimeInput(entry.endsAt));
  const [locked, setLocked] = useState(isFreeSlot ? true : entry.locked);
  const [comment, setComment] = useState(entry.comment ?? "");
  const [scope, setScope] = useState<AdjustmentScope>("today");
  const [confirmLockedEdit, setConfirmLockedEdit] = useState(false);
  const [confirmCompletedEdit, setConfirmCompletedEdit] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, saving]);

  const durationMinutes = useMemo(
    () => durationFromTimes(startTime, endTime),
    [startTime, endTime],
  );

  const needsLockedConfirmation = entry.locked && !confirmLockedEdit;
  const needsCompletedConfirmation =
    entry.completed && !confirmCompletedEdit;
  const showScopeChoice = Boolean(entry.habitSource) || isFreeSlot;

  function handleActivityTypeChange(nextType: ActivityType) {
    setActivityType(nextType);

    if (isFreeSlot || title === entry.title || title === "Temps libre") {
      setTitle(defaultTitleForActivity(nextType));
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (durationMinutes <= 0) {
      setError("L’heure de fin doit être après l’heure de début.");
      return;
    }

    if (needsLockedConfirmation) {
      setError("Confirme la modification de ce bloc verrouillé.");
      return;
    }

    if (needsCompletedConfirmation) {
      setError("Confirme la modification de ce bloc terminé.");
      return;
    }

    const startsAt = combineDateAndLocalTime(date, startTime);
    const endsAt = combineDateAndLocalTime(date, endTime);
    const adjustment = buildManualBlockAdjustment({
      entry,
      startsAt,
      endsAt,
      userId,
      scope,
      reason: comment.trim() || undefined,
    });

    try {
      await onSave({
        title: title.trim() || defaultTitleForActivity(activityType),
        startsAt,
        endsAt,
        locked,
        comment: comment.trim() || undefined,
        scope,
        activityType,
        adjustment,
        confirmLockedEdit,
        confirmCompletedEdit,
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Impossible d’enregistrer la modification.",
      );
    }
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-card edit-block-modal"
        role="dialog"
        aria-labelledby="edit-block-title"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <p className="card-label">
              {isFreeSlot
                ? "Créneau libre"
                : DAY_TIMELINE_TYPE_LABELS[entry.visualType]}
            </p>
            <h2 id="edit-block-title">
              {isFreeSlot
                ? "Ajouter une activité dans ce créneau"
                : "Modifier le bloc"}
            </h2>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Fermer
          </Button>
        </header>

        <form className="edit-block-form" onSubmit={(event) => void handleSubmit(event)}>
          <label>
            Type d’activité
            <select
              value={activityType}
              onChange={(event) =>
                handleActivityTypeChange(event.target.value as ActivityType)
              }
            >
              {ACTIVITY_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Titre
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>

          <div className="edit-block-time-row">
            <label>
              Début
              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                required
              />
            </label>

            <label>
              Fin
              <input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                required
              />
            </label>

            <label>
              Durée
              <input type="text" value={`${durationMinutes} min`} readOnly />
            </label>
          </div>

          <label className="edit-block-checkbox">
            <input
              type="checkbox"
              checked={locked}
              onChange={(event) => setLocked(event.target.checked)}
            />
            Verrouiller ce bloc pour la journée
          </label>

          <label>
            Description (facultatif)
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={3}
            />
          </label>

          {showScopeChoice && (
            <fieldset className="edit-block-scope">
              <legend>Cette modification concerne-t-elle :</legend>
              <label>
                <input
                  type="radio"
                  name="scope"
                  value="today"
                  checked={scope === "today"}
                  onChange={() => setScope("today")}
                />
                Aujourd’hui seulement
              </label>
              <label>
                <input
                  type="radio"
                  name="scope"
                  value="period"
                  checked={scope === "period"}
                  onChange={() => setScope("period")}
                />
                Cette période (contexte familial)
              </label>
              <label>
                <input
                  type="radio"
                  name="scope"
                  value="recurring"
                  checked={scope === "recurring"}
                  onChange={() => setScope("recurring")}
                />
                Mon quotidien habituel
              </label>
            </fieldset>
          )}

          {entry.locked && !isFreeSlot && (
            <label className="edit-block-checkbox edit-block-warning">
              <input
                type="checkbox"
                checked={confirmLockedEdit}
                onChange={(event) => setConfirmLockedEdit(event.target.checked)}
              />
              Je confirme modifier un bloc verrouillé
            </label>
          )}

          {entry.completed && (
            <label className="edit-block-checkbox edit-block-warning">
              <input
                type="checkbox"
                checked={confirmCompletedEdit}
                onChange={(event) =>
                  setConfirmCompletedEdit(event.target.checked)
                }
              />
              Je confirme modifier un bloc déjà terminé
            </label>
          )}

          {error && <div className="message message-error">{error}</div>}

          <footer className="modal-footer edit-block-modal-footer">
            {canComplete && onComplete && (
              <Button
                type="button"
                variant="primary"
                fullWidth
                loading={completing}
                disabled={completing || saving}
                onClick={() => void onComplete()}
              >
                Terminer
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={onClose}
              disabled={saving || completing}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant={canComplete ? "secondary" : "primary"}
              fullWidth
              loading={saving}
              disabled={saving || completing}
            >
              {isFreeSlot
                ? "Ajouter et replanifier"
                : "Enregistrer et replanifier"}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
}
