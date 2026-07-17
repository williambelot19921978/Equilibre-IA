export type HomeWidgetId =
  | "motivation"
  | "calendar"
  | "today_timeline"
  | "next_activity"
  | "important_tasks"
  | "family_context"
  | "vacations"
  | "ai_suggestions"
  | "spiritual_space"
  | "profile_progress"
  | "memory_insights"
  | "weather"
  | "week_summary";

export type CalendarWidgetPosition = "hidden" | "header_right" | "drawer";

export type HomePreferences = {
  visibleWidgets: HomeWidgetId[];
  widgetOrder: HomeWidgetId[];
  compactMode: boolean;
  calendarWidgetPosition: CalendarWidgetPosition;
  calendarWidgetPositionMobile: CalendarWidgetPosition;
};

export const ALL_HOME_WIDGETS: HomeWidgetId[] = [
  "motivation",
  "calendar",
  "today_timeline",
  "next_activity",
  "important_tasks",
  "family_context",
  "vacations",
  "ai_suggestions",
  "spiritual_space",
  "profile_progress",
  "memory_insights",
  "weather",
  "week_summary",
];

export const DEFAULT_HOME_PREFERENCES: HomePreferences = {
  visibleWidgets: ["motivation", "today_timeline", "next_activity"],
  widgetOrder: [
    "motivation",
    "today_timeline",
    "next_activity",
    "calendar",
    "important_tasks",
    "family_context",
    "vacations",
    "ai_suggestions",
    "spiritual_space",
    "profile_progress",
    "memory_insights",
    "weather",
    "week_summary",
  ],
  compactMode: true,
  calendarWidgetPosition: "drawer",
  calendarWidgetPositionMobile: "drawer",
};

export const CALENDAR_WIDGET_POSITION_LABELS: Record<CalendarWidgetPosition, string> = {
  hidden: "Masqué",
  header_right: "En haut à droite",
  drawer: "Menu latéral",
};

export const HOME_WIDGET_LABELS: Record<HomeWidgetId, string> = {
  motivation: "Motivation / citation",
  calendar: "Petit calendrier",
  today_timeline: "Planning du jour",
  next_activity: "Prochaine activité",
  important_tasks: "Tâches importantes",
  family_context: "Contexte familial",
  vacations: "Vacances",
  ai_suggestions: "Suggestions IA",
  spiritual_space: "Espace spirituel",
  profile_progress: "Progression profil",
  memory_insights: "Analyses mémoire",
  weather: "Météo",
  week_summary: "Résumé semaine",
};
