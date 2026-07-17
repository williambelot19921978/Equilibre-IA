import { useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "../ui/Button";
import type { SpiritualScheduleOption } from "../../types/spiritual";
import { getCurrentDeviceDate } from "../../lib/time/deviceClock";

type AddToDayModalProps = {
  open: boolean;
  title: string;
  defaultDuration: number;
  onClose: () => void;
  onConfirm: (options: {
    schedule: SpiritualScheduleOption;
    durationMinutes: number;
    customStartTime?: string;
  }) => Promise<void>;
};

export function AddToDayModal({
  open,
  title,
  defaultDuration,
  onClose,
  onConfirm,
}: AddToDayModalProps) {
  const [schedule, setSchedule] =
    useState<SpiritualScheduleOption>("now");
  const [durationMinutes, setDurationMinutes] = useState(defaultDuration);
  const [customStartTime, setCustomStartTime] = useState("20:00");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleSubmit() {
    try {
      setSaving(true);
      setError("");
      await onConfirm({
        schedule,
        durationMinutes,
        customStartTime: schedule === "custom" ? customStartTime : undefined,
      });
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Impossible d'ajouter à la journée.",
      );
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div
      className="modal-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="modal-card spiritual-add-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="spiritual-add-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="spiritual-add-title">Ajouter à ma journée</h2>
        <p className="planning-hint">{title}</p>

        <label>
          <span>Quand ?</span>
          <select
            value={schedule}
            onChange={(event) =>
              setSchedule(event.target.value as SpiritualScheduleOption)
            }
          >
            <option value="now">Maintenant</option>
            <option value="next_free">Prochain temps libre</option>
            <option value="custom">Heure personnalisée</option>
          </select>
        </label>

        {schedule === "custom" && (
          <label>
            <span>Heure</span>
            <input
              type="time"
              value={customStartTime}
              onChange={(event) => setCustomStartTime(event.target.value)}
            />
          </label>
        )}

        <label>
          <span>Durée (minutes)</span>
          <select
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(Number(event.target.value))}
          >
            {[5, 10, 15, 20, 30].map((value) => (
              <option key={value} value={value}>
                {value} min
              </option>
            ))}
          </select>
        </label>

        <p className="planning-hint">
          Date : {getCurrentDeviceDate()} — le planning se réorganisera autour
          de ce moment.
        </p>

        {error && <div className="message message-error">{error}</div>}

        <div className="spiritual-modal-actions">
          <Button type="button" onClick={() => void handleSubmit()} loading={saving}>
            Confirmer
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
