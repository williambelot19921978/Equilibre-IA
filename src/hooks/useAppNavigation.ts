import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { resolveNavigationRoute } from "../lib/navigation/navigationEngine";
import { AppRoutes, type AppRoute } from "../lib/navigation/routes";
import { completeOnboarding } from "../services/profileService";
import { useAuth } from "./useAuth";
import { useUserProgress } from "./useUserProgress";

export function useAppNavigation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshProgress } = useUserProgress();

  const goToResolvedRoute = useCallback(async () => {
    const progress = await refreshProgress();
    const route = resolveNavigationRoute(progress);
    navigate(route, { replace: true });
  }, [navigate, refreshProgress]);

  const goToLogin = useCallback(() => {
    navigate(AppRoutes.LOGIN, { replace: true });
  }, [navigate]);

  const goToRoute = useCallback(
    (route: AppRoute) => {
      navigate(route);
    },
    [navigate],
  );

  const completeDiscoveryAndContinue = useCallback(async () => {
    if (!user) return;

    const progress = await refreshProgress();

    if (progress.discoveryComplete && !progress.onboardingCompleted) {
      await completeOnboarding(user.id);
    }

    const updatedProgress = await refreshProgress();
    const route = resolveNavigationRoute(updatedProgress);
    navigate(route, { replace: true });
  }, [user, refreshProgress, navigate]);

  return {
    AppRoutes,
    goToResolvedRoute,
    goToLogin,
    goToRoute,
    completeDiscoveryAndContinue,
  };
}
