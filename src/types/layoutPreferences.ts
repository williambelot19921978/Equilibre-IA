import type { EveningPlanningMode } from "./eveningPlanning";
import { DEFAULT_EVENING_PLANNING_MODE } from "./eveningPlanning";

export type LayoutPreferences = {
  sidebarCollapsed: boolean;
  /** Afficher le saint du jour même si la spiritualité est désactivée */
  showSaintCalendar: boolean;
  eveningPlanningMode: EveningPlanningMode;
};

export const DEFAULT_LAYOUT_PREFERENCES: LayoutPreferences = {
  sidebarCollapsed: false,
  showSaintCalendar: true,
  eveningPlanningMode: DEFAULT_EVENING_PLANNING_MODE,
};
