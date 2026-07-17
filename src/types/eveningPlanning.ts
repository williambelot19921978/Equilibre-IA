export type EveningPlanningMode =
  | "automatic"
  | "suggestions_only"
  | "disabled";

export type EveningActivityType =
  | "transition"
  | "study"
  | "sport"
  | "calm"
  | "reading"
  | "spiritual"
  | "prep_tomorrow"
  | "couple"
  | "leisure"
  | "social_media"
  | "wind_down"
  | "keep_free";

export type EveningActivityBlock = {
  id: string;
  type: EveningActivityType;
  title: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  reason: string;
  suggested: boolean;
};

export type EveningOpportunityResult = {
  totalMinutes: number;
  plannedMinutes: number;
  keptFreeMinutes: number;
  fillRatio: number;
  blocks: EveningActivityBlock[];
  summary: string;
};

export const DEFAULT_EVENING_PLANNING_MODE: EveningPlanningMode =
  "suggestions_only";

export const EVENING_PLANNING_MODE_LABELS: Record<EveningPlanningMode, string> =
  {
    automatic: "Ajout automatique au planning",
    suggestions_only: "Suggestions uniquement (par défaut)",
    disabled: "Désactivé — soirée libre",
  };
