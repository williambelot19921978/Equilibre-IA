import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_LAYOUT_PREFERENCES,
  type LayoutPreferences,
} from "../types/layoutPreferences";
import {
  loadLayoutPreferences,
  saveLayoutPreferences,
} from "../services/layoutPreferencesService";

export function useSidebarPreferences(userId: string | undefined) {
  const [preferences, setPreferences] = useState<LayoutPreferences>(
    DEFAULT_LAYOUT_PREFERENCES,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    if (!userId) {
      setPreferences(DEFAULT_LAYOUT_PREFERENCES);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const loaded = await loadLayoutPreferences(userId);
      setPreferences(loaded);
    } catch {
      setPreferences(DEFAULT_LAYOUT_PREFERENCES);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const toggleCollapsed = useCallback(async () => {
    if (!userId) return;

    const next = {
      ...preferences,
      sidebarCollapsed: !preferences.sidebarCollapsed,
    };

    try {
      setSaving(true);
      const saved = await saveLayoutPreferences({ userId, preferences: next });
      setPreferences(saved);
    } finally {
      setSaving(false);
    }
  }, [userId, preferences]);

  const setCollapsed = useCallback(
    async (collapsed: boolean) => {
      if (!userId || collapsed === preferences.sidebarCollapsed) return;

      const next = { ...preferences, sidebarCollapsed: collapsed };
      try {
        setSaving(true);
        const saved = await saveLayoutPreferences({ userId, preferences: next });
        setPreferences(saved);
      } finally {
        setSaving(false);
      }
    },
    [userId, preferences],
  );

  return {
    sidebarCollapsed: preferences.sidebarCollapsed,
    showSaintCalendar: preferences.showSaintCalendar,
    loading,
    saving,
    toggleCollapsed,
    setCollapsed,
    reload,
  };
}
