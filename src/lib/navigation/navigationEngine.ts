import {
  AppRoutes,
  ONBOARDING_ROUTES,
  POST_ONBOARDING_ROUTES,
  type AppRoute,
} from "./routes";
import type { UserProgressState } from "./types";

/** Routes always reachable after onboarding (outside main app shell layout). */
export const BYPASS_PROGRESS_ROUTES: AppRoute[] = [
  AppRoutes.DAILY_CHECK_IN,
  AppRoutes.ADMIN_INSIGHTS,
];

/** Allowed while repairing a missing household after onboarding flag. */
export const HOUSEHOLD_REPAIR_ROUTES: AppRoute[] = [
  AppRoutes.HOUSEHOLD,
  AppRoutes.CHILDREN,
  AppRoutes.PROFILE,
  AppRoutes.SETTINGS,
  AppRoutes.TRUST_CENTER,
  AppRoutes.HOW_AURA_WORKS,
  AppRoutes.NOTIFICATION_SETTINGS,
  AppRoutes.USER_PROFILE,
];

/**
 * Point unique de décision : où envoyer l'utilisateur selon son avancement.
 * EPIC 7A — flux onboarding premium (< 3 min).
 */
export function resolveNavigationRoute(
  progress: UserProgressState,
): AppRoute {
  if (progress.onboardingCompleted) {
    if (!progress.hasHousehold) {
      return AppRoutes.HOUSEHOLD;
    }

    return AppRoutes.HOME;
  }

  if (!progress.welcomeSeen) {
    return AppRoutes.ONBOARDING_WELCOME;
  }

  if (!progress.introSeen) {
    return AppRoutes.ONBOARDING_INTRO;
  }

  if (!progress.hasHousehold) {
    return AppRoutes.HOUSEHOLD;
  }

  if (!progress.childrenStepDone) {
    return AppRoutes.CHILDREN;
  }

  if (!progress.profileBasicsDone) {
    return AppRoutes.PROFILE;
  }

  if (!progress.checkinChoiceDone) {
    return AppRoutes.ONBOARDING_CHECKIN;
  }

  if (!progress.hasBaseProfile) {
    return AppRoutes.ONBOARDING_PRIORITY;
  }

  if (!progress.goalsStepDone) {
    return AppRoutes.ONBOARDING_GOALS;
  }

  if (!progress.discoveryComplete) {
    return AppRoutes.DISCOVERY;
  }

  return AppRoutes.HOME;
}

export function getOnboardingRouteIndex(route: AppRoute): number {
  return ONBOARDING_ROUTES.indexOf(route);
}

/** During onboarding, allow the resolved step and all previously completed steps (back navigation). */
export function isOnboardingRouteAccessible(
  currentPath: AppRoute,
  progress: UserProgressState,
): boolean {
  if (!ONBOARDING_ROUTES.includes(currentPath)) {
    return false;
  }

  const resolvedRoute = resolveNavigationRoute(progress);
  const currentIndex = getOnboardingRouteIndex(currentPath);
  const resolvedIndex = getOnboardingRouteIndex(resolvedRoute);

  if (currentIndex === -1 || resolvedIndex === -1) {
    return currentPath === resolvedRoute;
  }

  return currentIndex <= resolvedIndex;
}

export function isRouteAllowed({
  currentPath,
  resolvedRoute,
  progress,
}: {
  currentPath: string;
  resolvedRoute: AppRoute;
  progress: UserProgressState;
}): boolean {
  const path = currentPath as AppRoute;

  if (path === resolvedRoute) {
    return true;
  }

  if (BYPASS_PROGRESS_ROUTES.includes(path)) {
    return progress.onboardingCompleted && progress.hasHousehold;
  }

  if (progress.onboardingCompleted) {
    if (!progress.hasHousehold) {
      return HOUSEHOLD_REPAIR_ROUTES.includes(path);
    }

    return POST_ONBOARDING_ROUTES.includes(path);
  }

  return isOnboardingRouteAccessible(path, progress);
}

export function shouldRedirectAuthenticatedRoot(
  pathname: string,
): boolean {
  return pathname === "/";
}
