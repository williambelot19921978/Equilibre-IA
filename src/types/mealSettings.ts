export type BreakfastSettings = {
  enabled: boolean;
  durationMinutes: number;
  usualTime?: string | null;
  mode?: "solo" | "family";
};

export type DinnerSettings = {
  durationMinutes: number;
  usualTime?: string | null;
  beforeEveningRoutine: boolean;
};

export type MealSettings = {
  breakfast: BreakfastSettings;
  dinner: DinnerSettings;
};

export const DEFAULT_MEAL_SETTINGS: MealSettings = {
  breakfast: {
    enabled: true,
    durationMinutes: 20,
    usualTime: null,
    mode: "family",
  },
  dinner: {
    durationMinutes: 30,
    usualTime: null,
    beforeEveningRoutine: true,
  },
};
