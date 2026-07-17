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
import { useAuth } from "../hooks/useAuth";
import { UserProgressContext } from "./userProgressContext";

export function UserProgressProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [progress, setProgress] =
    useState<UserProgressState>(EMPTY_USER_PROGRESS);
  const [fetchingProgress, setFetchingProgress] = useState(false);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);

  const refreshProgress = useCallback(async (): Promise<UserProgressState> => {
    if (!user) {
      setProgress(EMPTY_USER_PROGRESS);
      setLoadedUserId(null);
      return EMPTY_USER_PROGRESS;
    }

    setFetchingProgress(true);

    try {
      const nextProgress = await loadUserProgress(user.id);
      setProgress(nextProgress);
      setLoadedUserId(user.id);
      return nextProgress;
    } finally {
      setFetchingProgress(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setProgress(EMPTY_USER_PROGRESS);
      setLoadedUserId(null);
      return;
    }

    let cancelled = false;
    setFetchingProgress(true);

    void loadUserProgress(user.id)
      .then((nextProgress) => {
        if (!cancelled) {
          setProgress(nextProgress);
          setLoadedUserId(user.id);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setFetchingProgress(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const loading =
    authLoading ||
    fetchingProgress ||
    (!!user && loadedUserId !== user.id);

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
      refreshProgress,
      isCurrentRouteAllowed,
    }),
    [progress, resolvedRoute, loading, refreshProgress, isCurrentRouteAllowed],
  );

  return (
    <UserProgressContext.Provider value={value}>
      {children}
    </UserProgressContext.Provider>
  );
}
