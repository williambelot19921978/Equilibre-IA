import { AppRoutes, ONBOARDING_ROUTES, POST_ONBOARDING_ROUTES, type AppRoute } from "./routes";
import type { UserProgressState } from "./types";

/**
 * Point unique de décision : où envoyer l'utilisateur selon son avancement.
 * Utilisé après connexion, inscription, fin d'onboarding ou ouverture de `/`.
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

  if (!progress.hasHousehold) {
    return AppRoutes.HOUSEHOLD;
  }

  if (!progress.hasChildren) {
    return AppRoutes.CHILDREN;
  }

  if (!progress.hasBaseProfile) {
    return AppRoutes.PROFILE;
  }

  if (!progress.discoveryComplete) {
    return AppRoutes.DISCOVERY;
  }

  return AppRoutes.HOME;
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
  if (currentPath === resolvedRoute) {
    return true;
  }

  if (progress.onboardingCompleted) {
    return POST_ONBOARDING_ROUTES.includes(currentPath as AppRoute);
  }

  return ONBOARDING_ROUTES.includes(currentPath as AppRoute) &&
    currentPath === resolvedRoute;
}

export function shouldRedirectAuthenticatedRoot(
  pathname: string,
): boolean {
  return pathname === "/";
}
