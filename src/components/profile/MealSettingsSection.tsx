import { useCallback, useEffect, useState } from "react";

import { Button } from "../ui/Button";
import {
  DEFAULT_MEAL_SETTINGS,
  type MealSettings,
} from "../../types/mealSettings";
import { loadMealSettings, saveMealSettings } from "../../services/homePreferencesService";

type MealSettingsSectionProps = {
  userId: string;
};

export function MealSettingsSection({ userId }: MealSettingsSectionProps) {
  const [settings, setSettings] = useState<MealSettings>(DEFAULT_MEAL_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setSettings(await loadMealSettings(userId));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Impossible de charger les repas.",
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
      await saveMealSettings({ userId, mealSettings: settings });
      setMessage("Repas enregistrés.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Impossible d'enregistrer les repas.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Chargement des repas…</p>;

  return (
    <section className="meal-settings-section">
      <h4>Repas principaux</h4>
      <p className="profile-section-hint">
        Le planning placera le petit déjeuner après le réveil et le dîner avant la routine du soir.
      </p>

      <fieldset>
        <legend>Petit déjeuner</legend>
        <label>
          <input
            type="checkbox"
            checked={settings.breakfast.enabled}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                breakfast: { ...s.breakfast, enabled: e.target.checked },
              }))
            }
          />
          Activé
        </label>
        <label>
          Durée (minutes)
          <input
            type="number"
            min={5}
            max={60}
            value={settings.breakfast.durationMinutes}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                breakfast: {
                  ...s.breakfast,
                  durationMinutes: Number(e.target.value),
                },
              }))
            }
          />
        </label>
        <label>
          Mode
          <select
            value={settings.breakfast.mode ?? "family"}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                breakfast: {
                  ...s.breakfast,
                  mode: e.target.value as "solo" | "family",
                },
              }))
            }
          >
            <option value="family">Familial</option>
            <option value="solo">Adulte seul</option>
          </select>
        </label>
        <label>
          Horaire habituel (facultatif)
          <input
            type="time"
            value={settings.breakfast.usualTime ?? ""}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                breakfast: {
                  ...s.breakfast,
                  usualTime: e.target.value || null,
                },
              }))
            }
          />
        </label>
      </fieldset>

      <fieldset>
        <legend>Dîner</legend>
        <label>
          Durée (minutes)
          <input
            type="number"
            min={10}
            max={90}
            value={settings.dinner.durationMinutes}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                dinner: { ...s.dinner, durationMinutes: Number(e.target.value) },
              }))
            }
          />
        </label>
        <label>
          Horaire habituel (facultatif)
          <input
            type="time"
            value={settings.dinner.usualTime ?? ""}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                dinner: { ...s.dinner, usualTime: e.target.value || null },
              }))
            }
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.dinner.beforeEveningRoutine}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                dinner: {
                  ...s.dinner,
                  beforeEveningRoutine: e.target.checked,
                },
              }))
            }
          />
          Avant la routine du soir
        </label>
      </fieldset>

      {error && <div className="message message-error">{error}</div>}
      {message && <div className="message message-success">{message}</div>}

      <Button loading={saving} onClick={() => void handleSave()}>
        Enregistrer les repas
      </Button>
    </section>
  );
}
