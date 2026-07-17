import { AppRoutes, type AppRoute } from "./routes";
import type { SpaceId } from "../../design-system/spaceThemes";

export type NavigationSection = "primary" | "organisation" | "personalisation";

export type AppNavigationItem = {
  id: string;
  label: string;
  icon: string;
  route: AppRoute;
  section: NavigationSection;
  space: SpaceId;
  desktopVisible: boolean;
  mobileVisible: boolean;
  drawerVisible: boolean;
};

export const APP_NAVIGATION_ITEMS: AppNavigationItem[] = [
  {
    id: "home",
    label: "Accueil",
    icon: "🏠",
    route: AppRoutes.HOME,
    section: "primary",
    space: "home",
    desktopVisible: true,
    mobileVisible: true,
    drawerVisible: false,
  },
  {
    id: "planning",
    label: "Planning",
    icon: "📋",
    route: AppRoutes.PLANNING,
    section: "primary",
    space: "planning",
    desktopVisible: true,
    mobileVisible: true,
    drawerVisible: false,
  },
  {
    id: "calendar",
    label: "Calendrier",
    icon: "📅",
    route: AppRoutes.CALENDAR,
    section: "primary",
    space: "calendar",
    desktopVisible: true,
    mobileVisible: true,
    drawerVisible: false,
  },
  {
    id: "my-ai",
    label: "Mon IA",
    icon: "🧠",
    route: AppRoutes.MY_AI,
    section: "organisation",
    space: "my-ai",
    desktopVisible: true,
    mobileVisible: false,
    drawerVisible: true,
  },
  {
    id: "statistics",
    label: "Statistiques",
    icon: "📊",
    route: AppRoutes.STATISTICS,
    section: "organisation",
    space: "statistics",
    desktopVisible: true,
    mobileVisible: false,
    drawerVisible: true,
  },
  {
    id: "leisure",
    label: "Loisirs",
    icon: "🎯",
    route: AppRoutes.LEISURE,
    section: "primary",
    space: "leisure",
    desktopVisible: true,
    mobileVisible: true,
    drawerVisible: false,
  },
  {
    id: "spiritual",
    label: "Spirituel",
    icon: "✦",
    route: AppRoutes.SPIRITUAL,
    section: "primary",
    space: "spiritual",
    desktopVisible: true,
    mobileVisible: true,
    drawerVisible: false,
  },
  {
    id: "profile",
    label: "Profil",
    icon: "👤",
    route: AppRoutes.USER_PROFILE,
    section: "primary",
    space: "profile",
    desktopVisible: true,
    mobileVisible: true,
    drawerVisible: false,
  },
  {
    id: "tasks",
    label: "Tâches",
    icon: "✅",
    route: AppRoutes.TASKS,
    section: "organisation",
    space: "tasks",
    desktopVisible: false,
    mobileVisible: false,
    drawerVisible: true,
  },
  {
    id: "daily-routine",
    label: "Mon quotidien",
    icon: "☀️",
    route: AppRoutes.DAILY_ROUTINE,
    section: "organisation",
    space: "daily-routine",
    desktopVisible: false,
    mobileVisible: false,
    drawerVisible: true,
  },
  {
    id: "family-context",
    label: "Contexte familial",
    icon: "👨‍👩‍👧",
    route: AppRoutes.FAMILY_CONTEXT,
    section: "organisation",
    space: "family",
    desktopVisible: false,
    mobileVisible: false,
    drawerVisible: true,
  },
  {
    id: "vacation",
    label: "Vacances",
    icon: "🏖️",
    route: AppRoutes.CALENDAR,
    section: "organisation",
    space: "calendar",
    desktopVisible: false,
    mobileVisible: false,
    drawerVisible: true,
  },
  {
    id: "children",
    label: "Enfants",
    icon: "👶",
    route: AppRoutes.CHILDREN,
    section: "organisation",
    space: "family",
    desktopVisible: false,
    mobileVisible: false,
    drawerVisible: true,
  },
  {
    id: "discovery",
    label: "Découverte",
    icon: "🔍",
    route: AppRoutes.DISCOVERY,
    section: "personalisation",
    space: "home",
    desktopVisible: false,
    mobileVisible: false,
    drawerVisible: true,
  },
  {
    id: "user-profile-settings",
    label: "Paramètres profil",
    icon: "⚙️",
    route: AppRoutes.USER_PROFILE,
    section: "personalisation",
    space: "profile",
    desktopVisible: false,
    mobileVisible: false,
    drawerVisible: true,
  },
];

export function getDesktopSidebarItems(): AppNavigationItem[] {
  return APP_NAVIGATION_ITEMS.filter((item) => item.desktopVisible);
}

export function getMobileBottomNavItems(): AppNavigationItem[] {
  return APP_NAVIGATION_ITEMS.filter((item) => item.mobileVisible);
}

export function getDrawerSections(): Array<{
  title: string;
  items: AppNavigationItem[];
}> {
  const organisation = APP_NAVIGATION_ITEMS.filter(
    (item) => item.drawerVisible && item.section === "organisation",
  );
  const personalisation = APP_NAVIGATION_ITEMS.filter(
    (item) => item.drawerVisible && item.section === "personalisation",
  );

  return [
    { title: "Organisation", items: organisation },
    { title: "Personnalisation", items: personalisation },
  ];
}
