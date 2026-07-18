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
  readSidebarCollapsedFromStorage,
  writeSidebarCollapsedToStorage,
} from "../lib/layout/sidebarPreferencesStorage";
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

function mergeWithCachedSidebarState(
  userId: string,
  loaded: LayoutPreferences | null,
  current: LayoutPreferences,
): LayoutPreferences {
  const cachedCollapsed = readSidebarCollapsedFromStorage(userId);

  if (loaded) {
    return loaded;
  }

  return {
    ...DEFAULT_LAYOUT_PREFERENCES,
    showSaintCalendar: current.showSaintCalendar,
    eveningPlanningMode: current.eveningPlanningMode,
    sidebarCollapsed: cachedCollapsed ?? current.sidebarCollapsed,
  };
}

export function SidebarPreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [preferences, setPreferences] = useState<LayoutPreferences>(
    DEFAULT_LAYOUT_PREFERENCES,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const hydrateCachedSidebarState = useCallback((targetUserId: string) => {
    const cachedCollapsed = readSidebarCollapsedFromStorage(targetUserId);
    if (cachedCollapsed === null) return;

    setPreferences((current) => ({
      ...current,
      sidebarCollapsed: cachedCollapsed,
    }));
  }, []);

  const reload = useCallback(async () => {
    if (!userId) {
      setLoading(Boolean(user));
      return;
    }

    hydrateCachedSidebarState(userId);

    try {
      setLoading(true);
      const loaded = await loadLayoutPreferences(userId);
      setPreferences((current) => {
        const merged = mergeWithCachedSidebarState(userId, loaded, current);
        writeSidebarCollapsedToStorage(userId, merged.sidebarCollapsed);
        return merged;
      });
    } catch {
      const cachedCollapsed = readSidebarCollapsedFromStorage(userId);
      if (cachedCollapsed !== null) {
        setPreferences((current) => ({
          ...current,
          sidebarCollapsed: cachedCollapsed,
        }));
      }
    } finally {
      setLoading(false);
    }
  }, [userId, user, hydrateCachedSidebarState]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const toggleCollapsed = useCallback(() => {
    if (!userId) return;

    const previous = preferences;
    const nextCollapsed = !preferences.sidebarCollapsed;

    writeSidebarCollapsedToStorage(userId, nextCollapsed);
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
        writeSidebarCollapsedToStorage(userId, saved.sidebarCollapsed);
      } catch {
        writeSidebarCollapsedToStorage(userId, previous.sidebarCollapsed);
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

      writeSidebarCollapsedToStorage(userId, collapsed);
      setPreferences((current) => ({ ...current, sidebarCollapsed: collapsed }));

      void (async () => {
        try {
          setSaving(true);
          const saved = await saveLayoutPreferences({
            userId,
            preferences: { ...previous, sidebarCollapsed: collapsed },
          });
          setPreferences(saved);
          writeSidebarCollapsedToStorage(userId, saved.sidebarCollapsed);
        } catch {
          writeSidebarCollapsedToStorage(userId, previous.sidebarCollapsed);
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
