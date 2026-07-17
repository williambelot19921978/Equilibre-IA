import { useCallback, useEffect, useState } from "react";

import { Button } from "../ui/Button";
import {
  loadSportSettings,
  saveSportSettings,
} from "../../services/homePreferencesService";
import {
  DEFAULT_SPORT_PREFERENCES,
  SPORT_PREFERENCE_TYPE_OPTIONS,
  type SportPreferences,
} from "../../types/sportPreferences";
import {
  WORKOUT_LEVEL_LABELS,
  type WorkoutLevel,
  type WorkoutSessionType,
} from "../../types/workoutSession";

type SportSettingsSectionProps = {
  userId: string;
};

const DURATION_OPTIONS = [5, 10, 15, 20, 25, 30];
const EQUIPMENT_OPTIONS = ["Tapis", "Élastiques", "Haltères", "Chaise", "Mur"];

export function SportSettingsSection({ userId }: SportSettingsSectionProps) {
  const [settings, setSettings] = useState<SportPreferences>(
    DEFAULT_SPORT_PREFERENCES,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    void loadSportSettings(userId)
      .then((loaded) => {
        if (active) setSettings(loaded);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const toggleType = useCallback(
    (list: "preferredTypes" | "avoidedTypes", type: WorkoutSessionType) => {
      setSettings((current) => {
        const selected = new Set(current[list]);
        if (selected.has(type)) {
          selected.delete(type);
        } else {
          selected.add(type);
        }
        return { ...current, [list]: Array.from(selected) };
      });
    },
    [],
  );

  const toggleEquipment = useCallback((item: string) => {
    setSettings((current) => {
      const selected = new Set(current.availableEquipment);
      if (selected.has(item)) {
        selected.delete(item);
      } else {
        selected.add(item);
      }
      return { ...current, availableEquipment: Array.from(selected) };
    });
  }, []);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setMessage("");
      await saveSportSettings({ userId, settings });
      setMessage("Préférences sport enregistrées.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer les préférences sport.",
      );
    } finally {
      setSaving(false);
    }
  }, [userId, settings]);

  if (loading) {
    return <p>Chargement des préférences sport…</p>;
  }

  return (
    <div className="sport-settings-section">
      <p className="profile-section-hint">
        Ces réglages guident les séances proposées automatiquement dans ton
        planning.
      </p>

      <label className="profile-field">
        Niveau
        <select
          value={settings.level}
          onChange={(event) =>
            setSettings((current) => ({
              ...current,
              level: event.target.value as WorkoutLevel,
            }))
          }
        >
          {(Object.keys(WORKOUT_LEVEL_LABELS) as WorkoutLevel[]).map((level) => (
            <option key={level} value={level}>
              {WORKOUT_LEVEL_LABELS[level]}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="sport-settings-fieldset">
        <legend>Types préférés</legend>
        <div className="sport-settings-checkboxes">
          {SPORT_PREFERENCE_TYPE_OPTIONS.map((option) => (
            <label key={`pref-${option.value}`}>
              <input
                type="checkbox"
                checked={settings.preferredTypes.includes(option.value)}
                onChange={() => toggleType("preferredTypes", option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="sport-settings-fieldset">
        <legend>Types à éviter</legend>
        <div className="sport-settings-checkboxes">
          {SPORT_PREFERENCE_TYPE_OPTIONS.map((option) => (
            <label key={`avoid-${option.value}`}>
              <input
                type="checkbox"
                checked={settings.avoidedTypes.includes(option.value)}
                onChange={() => toggleType("avoidedTypes", option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="sport-settings-fieldset">
        <legend>Matériel disponible</legend>
        <div className="sport-settings-checkboxes">
          {EQUIPMENT_OPTIONS.map((item) => (
            <label key={item}>
              <input
                type="checkbox"
                checked={settings.availableEquipment.includes(item)}
                onChange={() => toggleEquipment(item)}
              />
              {item}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="sport-settings-row">
        <label className="profile-field">
          Durée préférée (min)
          <select
            value={settings.preferredDurationMinutes}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                preferredDurationMinutes: Number(event.target.value),
              }))
            }
          >
            {DURATION_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} min
              </option>
            ))}
          </select>
        </label>

        <label className="profile-field">
          Durée minimale (min)
          <select
            value={settings.minimumDurationMinutes}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                minimumDurationMinutes: Number(event.target.value),
              }))
            }
          >
            {DURATION_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} min
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="profile-field">
        Intensité
        <select
          value={settings.intensity}
          onChange={(event) =>
            setSettings((current) => ({
              ...current,
              intensity: event.target.value as SportPreferences["intensity"],
            }))
          }
        >
          <option value="gentle">Douce</option>
          <option value="moderate">Modérée</option>
          <option value="dynamic">Dynamique</option>
        </select>
      </label>

      <label className="profile-field">
        Lieu
        <select
          value={settings.location}
          onChange={(event) =>
            setSettings((current) => ({
              ...current,
              location: event.target.value as SportPreferences["location"],
            }))
          }
        >
          <option value="indoor">Intérieur</option>
          <option value="outdoor">Extérieur</option>
          <option value="both">Les deux</option>
        </select>
      </label>

      <label className="profile-field">
        Fréquence hebdomadaire souhaitée
        <input
          type="number"
          min={0}
          max={7}
          value={settings.weeklyFrequencyGoal}
          onChange={(event) =>
            setSettings((current) => ({
              ...current,
              weeklyFrequencyGoal: Number(event.target.value) || 0,
            }))
          }
        />
      </label>

      <div className="profile-edit-actions">
        <Button loading={saving} onClick={() => void handleSave()}>
          Enregistrer les préférences sport
        </Button>
      </div>

      {message && <p className="profile-save-message">{message}</p>}
    </div>
  );
}
