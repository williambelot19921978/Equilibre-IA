export const AppRoutes = {
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  HOUSEHOLD: "/onboarding/household",
  CHILDREN: "/onboarding/children",
  PROFILE: "/onboarding/profile",
  DISCOVERY: "/discovery",
  HOME: "/home",
  TASKS: "/tasks",
  USER_PROFILE: "/profile",
  PLANNING: "/planning",
  DAILY_ROUTINE: "/daily-routine",
  CALENDAR: "/calendar",
  FAMILY_CONTEXT: "/family-context",
  SPIRITUAL: "/spiritual",
  LEISURE: "/leisure",
  STATISTICS: "/statistics",
  MY_AI: "/my-ai",
} as const;

export type AppRoute = (typeof AppRoutes)[keyof typeof AppRoutes];

export const ONBOARDING_ROUTES: AppRoute[] = [
  AppRoutes.HOUSEHOLD,
  AppRoutes.CHILDREN,
  AppRoutes.PROFILE,
  AppRoutes.DISCOVERY,
];

/** Routes applicatives — shell global + barre conversation. */
export const APPLICATION_ROUTES: AppRoute[] = [
  AppRoutes.HOME,
  AppRoutes.TASKS,
  AppRoutes.USER_PROFILE,
  AppRoutes.PLANNING,
  AppRoutes.DAILY_ROUTINE,
  AppRoutes.CALENDAR,
  AppRoutes.FAMILY_CONTEXT,
  AppRoutes.SPIRITUAL,
  AppRoutes.LEISURE,
  AppRoutes.STATISTICS,
  AppRoutes.MY_AI,
];

export const APPLICATION_ROUTE_TITLES: Partial<Record<AppRoute, string>> = {
  [AppRoutes.HOME]: "Accueil",
  [AppRoutes.PLANNING]: "Planning",
  [AppRoutes.CALENDAR]: "Calendrier",
  [AppRoutes.TASKS]: "Tâches",
  [AppRoutes.DAILY_ROUTINE]: "Mon quotidien",
  [AppRoutes.FAMILY_CONTEXT]: "Contexte familial",
  [AppRoutes.USER_PROFILE]: "Mon profil",
  [AppRoutes.SPIRITUAL]: "Espace spirituel",
  [AppRoutes.LEISURE]: "Loisirs",
  [AppRoutes.STATISTICS]: "Statistiques",
  [AppRoutes.MY_AI]: "Mon IA",
};

export function isOnboardingRoute(pathname: string): boolean {
  return ONBOARDING_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isApplicationRoute(pathname: string): boolean {
  return APPLICATION_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/** Routes accessibles librement une fois l'onboarding terminé. */
export const POST_ONBOARDING_ROUTES: AppRoute[] = [
  ...APPLICATION_ROUTES,
  AppRoutes.DISCOVERY,
];
