import { useCallback, useEffect, useState } from "react";

import { Button } from "../ui/Button";
import {
  EVENING_PLANNING_MODE_LABELS,
  type EveningPlanningMode,
} from "../../types/eveningPlanning";
import { DEFAULT_LAYOUT_PREFERENCES } from "../../types/layoutPreferences";
import {
  loadLayoutPreferences,
  saveLayoutPreferences,
} from "../../services/layoutPreferencesService";

type EveningPlanningPreferenceProps = {
  userId: string;
};

export function EveningPlanningPreference({
  userId,
}: EveningPlanningPreferenceProps) {
  const [mode, setMode] = useState<EveningPlanningMode>("suggestions_only");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const prefs = await loadLayoutPreferences(userId);
      setMode(
        prefs?.eveningPlanningMode ??
          DEFAULT_LAYOUT_PREFERENCES.eveningPlanningMode,
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Impossible de charger tes préférences du soir.",
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleSave() {
    try {
      setSaving(true);
      setMessage("");
      setError("");
      const prefs = (await loadLayoutPreferences(userId)) ?? DEFAULT_LAYOUT_PREFERENCES;
      await saveLayoutPreferences({
        userId,
        preferences: { ...prefs, eveningPlanningMode: mode },
      });
      setMessage("Préférence du soir enregistrée.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Impossible d'enregistrer la préférence du soir.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p>Chargement des préférences du soir…</p>;
  }

  return (
    <section className="evening-planning-preference">
      <h4>Planification du soir</h4>
      <p className="profile-section-hint">
        Après le coucher des enfants, le moteur peut proposer des activités
        adaptées sans remplir tout ton temps libre.
      </p>

      <fieldset className="evening-planning-mode-picker">
        {(Object.keys(EVENING_PLANNING_MODE_LABELS) as EveningPlanningMode[]).map(
          (value) => (
            <label key={value} className="evening-planning-mode-option">
              <input
                type="radio"
                name={`evening-planning-${userId}`}
                checked={mode === value}
                onChange={() => setMode(value)}
              />
              <span>{EVENING_PLANNING_MODE_LABELS[value]}</span>
            </label>
          ),
        )}
      </fieldset>

      {error && <div className="message message-error">{error}</div>}
      {message && <div className="message message-success">{message}</div>}

      <Button loading={saving} onClick={() => void handleSave()}>
        Enregistrer
      </Button>
    </section>
  );
}
