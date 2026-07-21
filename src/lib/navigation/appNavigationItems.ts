import { AppRoutes, type AppRoute } from "./routes";
import {
  isAssistantIaEnabled,
  isGoalsEnabled,
  isHouseholdOverviewEnabled,
  isHumanModelEnabled,
  isPlanningCalendarEngineEnabled,
  isSemanticPlanningEngineEnabled,
  isAdaptiveIntelligenceEnabled,
  isDailyStateEngineEnabled,
  isLifeKnowledgeEngineEnabled,
  isPersonalCoachEngineEnabled,
  isProactiveIntelligenceEnabled,
} from "../../config/featureFlags";
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
    id: "assistant-ia",
    label: "Assistant IA",
    icon: "💬",
    route: AppRoutes.ASSISTANT,
    section: "organisation",
    space: "my-ai",
    desktopVisible: true,
    mobileVisible: false,
    drawerVisible: true,
  },
  {
    id: "ai-profile",
    label: "Mon Profil IA",
    icon: "🪞",
    route: AppRoutes.AI_PROFILE,
    section: "organisation",
    space: "my-ai",
    desktopVisible: true,
    mobileVisible: false,
    drawerVisible: true,
  },
  {
    id: "planning-engine",
    label: "Planning Engine",
    icon: "🧭",
    route: AppRoutes.PLANNING_ENGINE,
    section: "organisation",
    space: "planning",
    desktopVisible: false,
    mobileVisible: false,
    drawerVisible: true,
  },
  {
    id: "semantic-planning",
    label: "Compréhension IA",
    icon: "🔮",
    route: AppRoutes.SEMANTIC_PLANNING,
    section: "organisation",
    space: "planning",
    desktopVisible: false,
    mobileVisible: false,
    drawerVisible: true,
  },
  {
    id: "adaptive-intelligence",
    label: "Apprentissage IA",
    icon: "🧠",
    route: AppRoutes.ADAPTIVE_INTELLIGENCE,
    section: "organisation",
    space: "planning",
    desktopVisible: false,
    mobileVisible: false,
    drawerVisible: true,
  },
  {
    id: "proactive-intelligence",
    label: "IA proactive",
    icon: "💡",
    route: AppRoutes.PROACTIVE_INTELLIGENCE,
    section: "organisation",
    space: "planning",
    desktopVisible: false,
    mobileVisible: false,
    drawerVisible: true,
  },
  {
    id: "daily-state-history",
    label: "Historique ressenti",
    icon: "🌤️",
    route: AppRoutes.DAILY_STATE_HISTORY,
    section: "organisation",
    space: "home",
    desktopVisible: false,
    mobileVisible: false,
    drawerVisible: true,
  },
  {
    id: "personal-coach",
    label: "Coach personnel",
    icon: "🎯",
    route: AppRoutes.PERSONAL_COACH,
    section: "organisation",
    space: "my-ai",
    desktopVisible: false,
    mobileVisible: false,
    drawerVisible: true,
  },
  {
    id: "life-knowledge",
    label: "Ce que l'IA sait sur moi",
    icon: "📚",
    route: AppRoutes.LIFE_KNOWLEDGE,
    section: "organisation",
    space: "my-ai",
    desktopVisible: false,
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
    id: "goals",
    label: "Objectifs",
    icon: "🏁",
    route: AppRoutes.GOALS,
    section: "organisation",
    space: "goals",
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
    id: "household-overview",
    label: "Foyer",
    icon: "🏡",
    route: AppRoutes.HOUSEHOLD_OVERVIEW,
    section: "organisation",
    space: "household",
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
    id: "settings",
    label: "Paramètres",
    icon: "⚙️",
    route: AppRoutes.SETTINGS,
    section: "personalisation",
    space: "profile",
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
  return APP_NAVIGATION_ITEMS.filter(
    (item) =>
      item.desktopVisible &&
      (item.id !== "assistant-ia" || isAssistantIaEnabled()) &&
      (item.id !== "ai-profile" || isHumanModelEnabled()),
  );
}

export function getMobileBottomNavItems(): AppNavigationItem[] {
  return APP_NAVIGATION_ITEMS.filter((item) => item.mobileVisible);
}

export function getDrawerSections(): Array<{
  title: string;
  items: AppNavigationItem[];
}> {
  const organisation = APP_NAVIGATION_ITEMS.filter(
    (item) =>
      item.drawerVisible &&
      item.section === "organisation" &&
      (item.id !== "goals" || isGoalsEnabled()) &&
      (item.id !== "household-overview" || isHouseholdOverviewEnabled()) &&
      (item.id !== "assistant-ia" || isAssistantIaEnabled()) &&
      (item.id !== "ai-profile" || isHumanModelEnabled()) &&
      (item.id !== "planning-engine" || isPlanningCalendarEngineEnabled()) &&
      (item.id !== "semantic-planning" || isSemanticPlanningEngineEnabled()) &&
      (item.id !== "adaptive-intelligence" || isAdaptiveIntelligenceEnabled()) &&
      (item.id !== "proactive-intelligence" || isProactiveIntelligenceEnabled()) &&
      (item.id !== "daily-state-history" || isDailyStateEngineEnabled()) &&
      (item.id !== "personal-coach" || isPersonalCoachEngineEnabled()) &&
      (item.id !== "life-knowledge" || isLifeKnowledgeEngineEnabled()),
  );
  const personalisation = APP_NAVIGATION_ITEMS.filter(
    (item) => item.drawerVisible && item.section === "personalisation",
  );

  return [
    { title: "Organisation", items: organisation },
    { title: "Personnalisation", items: personalisation },
  ];
}
