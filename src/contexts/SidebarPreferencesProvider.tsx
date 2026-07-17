import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_LAYOUT_PREFERENCES,
  type LayoutPreferences,
} from "../types/layoutPreferences";
import {
  loadLayoutPreferences,
  saveLayoutPreferences,
} from "../services/layoutPreferencesService";
import { useAuth } from "../hooks/useAuth";

type SidebarPreferencesContextValue = {
  sidebarCollapsed: boolean;
  showSaintCalendar: boolean;
  loading: boolean;
  saving: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
  reload: () => Promise<void>;
};

const SidebarPreferencesContext =
  createContext<SidebarPreferencesContextValue | null>(null);

export function SidebarPreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
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

  const toggleCollapsed = useCallback(() => {
    if (!userId) return;

    const previous = preferences;
    const nextCollapsed = !preferences.sidebarCollapsed;

    setPreferences((current) => ({
      ...current,
      sidebarCollapsed: nextCollapsed,
    }));

    void (async () => {
      try {
        setSaving(true);
        const saved = await saveLayoutPreferences({
          userId,
          preferences: { ...previous, sidebarCollapsed: nextCollapsed },
        });
        setPreferences(saved);
      } catch {
        setPreferences(previous);
      } finally {
        setSaving(false);
      }
    })();
  }, [userId, preferences]);

  const setCollapsed = useCallback(
    (collapsed: boolean) => {
      if (!userId || collapsed === preferences.sidebarCollapsed) return;

      const previous = preferences;
      setPreferences((current) => ({ ...current, sidebarCollapsed: collapsed }));

      void (async () => {
        try {
          setSaving(true);
          const saved = await saveLayoutPreferences({
            userId,
            preferences: { ...previous, sidebarCollapsed: collapsed },
          });
          setPreferences(saved);
        } catch {
          setPreferences(previous);
        } finally {
          setSaving(false);
        }
      })();
    },
    [userId, preferences],
  );

  const value = useMemo<SidebarPreferencesContextValue>(
    () => ({
      sidebarCollapsed: preferences.sidebarCollapsed,
      showSaintCalendar: preferences.showSaintCalendar,
      loading,
      saving,
      toggleCollapsed,
      setCollapsed,
      reload,
    }),
    [
      preferences.sidebarCollapsed,
      preferences.showSaintCalendar,
      loading,
      saving,
      toggleCollapsed,
      setCollapsed,
      reload,
    ],
  );

  return (
    <SidebarPreferencesContext.Provider value={value}>
      {children}
    </SidebarPreferencesContext.Provider>
  );
}

export function useSidebarPreferencesFromContext(): SidebarPreferencesContextValue {
  const context = useContext(SidebarPreferencesContext);
  if (!context) {
    throw new Error(
      "useSidebarPreferences must be used within SidebarPreferencesProvider",
    );
  }
  return context;
}
