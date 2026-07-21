import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  isRouteAllowed,
  resolveNavigationRoute,
} from "../lib/navigation/navigationEngine";
import type { AppRoute } from "../lib/navigation/routes";
import type { UserProgressState } from "../lib/navigation/types";
import { EMPTY_USER_PROGRESS } from "../lib/navigation/types";
import { loadUserProgress } from "../services/userProgressService";
import { resolveUserProgressLoading } from "../lib/navigation/protectedRouteLoading";
import { useAuth } from "../hooks/useAuth";
import { UserProgressContext } from "./userProgressContext";

export function UserProgressProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [progress, setProgress] =
    useState<UserProgressState>(EMPTY_USER_PROGRESS);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);

  const refreshProgress = useCallback(async (): Promise<UserProgressState> => {
    if (!user) {
      setProgress(EMPTY_USER_PROGRESS);
      setLoadedUserId(null);
      setProgressError(null);
      return EMPTY_USER_PROGRESS;
    }

    try {
      const nextProgress = await loadUserProgress(user.id);
      setProgress(nextProgress);
      setLoadedUserId(user.id);
      setProgressError(null);
      return nextProgress;
    } catch {
      const fallback = { ...EMPTY_USER_PROGRESS };
      setProgress(fallback);
      setLoadedUserId(user.id);
      setProgressError(
        "Connexion instable ou service indisponible. Vérifie ta connexion puis réessaie.",
      );
      return fallback;
    }
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setProgress(EMPTY_USER_PROGRESS);
      setLoadedUserId(null);
      setProgressError(null);
      return;
    }

    if (loadedUserId === user.id) {
      return;
    }

    let cancelled = false;

    void loadUserProgress(user.id)
      .then((nextProgress) => {
        if (!cancelled) {
          setProgress(nextProgress);
          setLoadedUserId(user.id);
          setProgressError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProgress({ ...EMPTY_USER_PROGRESS });
          setLoadedUserId(user.id);
          setProgressError(
            "Connexion instable ou service indisponible. Vérifie ta connexion puis réessaie.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading, loadedUserId]);

  const loading = resolveUserProgressLoading({
    authLoading,
    userId: user?.id,
    loadedUserId,
  });

  const resolvedRoute: AppRoute = useMemo(
    () => resolveNavigationRoute(progress),
    [progress],
  );

  const isCurrentRouteAllowed = useCallback(
    (pathname: string) =>
      isRouteAllowed({
        currentPath: pathname,
        resolvedRoute,
        progress,
      }),
    [resolvedRoute, progress],
  );

  const value = useMemo(
    () => ({
      progress,
      resolvedRoute,
      loading,
      progressError,
      refreshProgress,
      isCurrentRouteAllowed,
    }),
    [progress, resolvedRoute, loading, progressError, refreshProgress, isCurrentRouteAllowed],
  );

  return (
    <UserProgressContext.Provider value={value}>
      {children}
    </UserProgressContext.Provider>
  );
}
