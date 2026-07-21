import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { resolveNavigationRoute } from "../lib/navigation/navigationEngine";
import { AppRoutes, type AppRoute } from "../lib/navigation/routes";
import { trackInsightEvent } from "../auraInsights/eventStore";
import { endPerfMark, startPerfMark } from "../auraInsights/performanceMonitor";
import {
  patchOnboardingUxProgress,
  type OnboardingUxProgress,
} from "../lib/onboarding/onboardingProgressStore";
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

  const advanceOnboardingStep = useCallback(
    async (
      patch: Partial<OnboardingUxProgress>,
      nextRoute?: AppRoute,
    ) => {
      if (user?.id) {
        patchOnboardingUxProgress(user.id, patch);
      }
      const progress = await refreshProgress();
      const route = nextRoute ?? resolveNavigationRoute(progress);
      navigate(route, { replace: true });
    },
    [navigate, refreshProgress, user?.id],
  );

  const completeDiscoveryAndContinue = useCallback(async () => {
    if (!user) return;

    const progress = await refreshProgress();

    if (progress.discoveryComplete && !progress.onboardingCompleted) {
      startPerfMark("onboarding");
      await completeOnboarding(user.id);
      endPerfMark(user.id, "onboarding");
      trackInsightEvent(user.id, "onboarding_completed", {});
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
    advanceOnboardingStep,
    completeDiscoveryAndContinue,
  };
}
