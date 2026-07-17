import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_HOME_PREFERENCES,
  type HomePreferences,
} from "../types/homePreferences";
import {
  getOrderedVisibleWidgets,
  loadHomePreferences,
  saveHomePreferences,
} from "../services/homePreferencesService";

export function useHomePreferences(userId: string | undefined) {
  const [preferences, setPreferences] = useState<HomePreferences>(
    DEFAULT_HOME_PREFERENCES,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!userId) {
      setPreferences(DEFAULT_HOME_PREFERENCES);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const loaded = await loadHomePreferences(userId);
      setPreferences(loaded);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Impossible de charger tes préférences d'accueil.",
      );
      setPreferences(DEFAULT_HOME_PREFERENCES);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const updatePreferences = useCallback(
    async (next: HomePreferences) => {
      if (!userId) return;

      try {
        setSaving(true);
        setError("");
        const saved = await saveHomePreferences({ userId, preferences: next });
        setPreferences(saved);
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Impossible d'enregistrer tes préférences.",
        );
        throw saveError;
      } finally {
        setSaving(false);
      }
    },
    [userId],
  );

  const orderedVisibleWidgets = getOrderedVisibleWidgets(preferences);

  return {
    preferences,
    orderedVisibleWidgets,
    loading,
    saving,
    error,
    reload,
    updatePreferences,
    resetToDefault: () => updatePreferences(DEFAULT_HOME_PREFERENCES),
  };
}
