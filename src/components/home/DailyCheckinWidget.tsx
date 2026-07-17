import { useState } from "react";

import { BlockActionButton } from "../planning/BlockActionButton";
import { Button } from "../ui/Button";
import {
  DAILY_CHECKIN_MOOD_OPTIONS,
  resolveCheckinPlanningImpact,
  type DailyCheckinMood,
  type DailyCheckinRecord,
} from "../../types/dailyCheckin";

type DailyCheckinWidgetProps = {
  date: string;
  checkin: DailyCheckinRecord | null;
  saving?: boolean;
  onSave: (mood: DailyCheckinMood, intensity: number | null) => Promise<void>;
};

export function DailyCheckinWidget({
  checkin,
  saving = false,
  onSave,
}: DailyCheckinWidgetProps) {
  const [open, setOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<DailyCheckinMood | null>(
    checkin?.mood ?? null,
  );
  const [intensity, setIntensity] = useState<number>(checkin?.intensity ?? 3);

  const currentMood = selectedMood ?? checkin?.mood ?? null;
  const currentLabel = DAILY_CHECKIN_MOOD_OPTIONS.find(
    (option) => option.value === currentMood,
  );

  return (
    <section className="home-widget home-widget-checkin">
      <div className="daily-checkin-compact">
        <div>
          <p className="card-label">Ressenti</p>
          <h2>Comment te sens-tu ?</h2>
          {currentLabel ? (
            <p className="daily-checkin-current">
              {currentLabel.emoji} {currentLabel.label}
            </p>
          ) : (
            <p className="daily-checkin-current">Pas encore renseigné aujourd’hui.</p>
          )}
        </div>
        <Button type="button" size="sm" onClick={() => setOpen((value) => !value)}>
          {open ? "Fermer" : "Répondre"}
        </Button>
      </div>

      {open && (
        <div className="daily-checkin-panel">
          <div className="daily-checkin-options">
            {DAILY_CHECKIN_MOOD_OPTIONS.map((option) => (
              <BlockActionButton
                key={option.value}
                icon={option.emoji}
                label={option.label}
                tone={selectedMood === option.value ? "primary" : "ghost"}
                onClick={() => setSelectedMood(option.value)}
              />
            ))}
          </div>

          <label className="daily-checkin-intensity">
            Intensité ressentie (facultatif) : {intensity}/5
            <input
              type="range"
              min={1}
              max={5}
              value={intensity}
              onChange={(event) => setIntensity(Number(event.target.value))}
            />
          </label>

          {selectedMood && (
            <p className="daily-checkin-impact">
              {resolveCheckinPlanningImpact(selectedMood, intensity).adaptations[0] ??
                "Merci — ta journée sera adaptée en conséquence."}
            </p>
          )}

          <Button
            type="button"
            fullWidth
            loading={saving}
            disabled={!selectedMood || saving}
            onClick={() =>
              selectedMood
                ? void onSave(selectedMood, intensity).then(() => setOpen(false))
                : undefined
            }
          >
            Enregistrer mon ressenti
          </Button>
        </div>
      )}
    </section>
  );
}
