import type {
  WorkoutLevel,
  WorkoutSessionType,
} from "./workoutSession";

export type SportPreferences = {
  level: WorkoutLevel;
  preferredTypes: WorkoutSessionType[];
  avoidedTypes: WorkoutSessionType[];
  availableEquipment: string[];
  preferredDurationMinutes: number;
  minimumDurationMinutes: number;
  intensity: "gentle" | "moderate" | "dynamic";
  preferredZones: string[];
  weeklyFrequencyGoal: number;
  location: "indoor" | "outdoor" | "both";
};

export const DEFAULT_SPORT_PREFERENCES: SportPreferences = {
  level: "intermediate",
  preferredTypes: ["full_body", "mobility", "active_walk"],
  avoidedTypes: ["hiit", "tabata"],
  availableEquipment: [],
  preferredDurationMinutes: 20,
  minimumDurationMinutes: 10,
  intensity: "moderate",
  preferredZones: [],
  weeklyFrequencyGoal: 3,
  location: "both",
};

export const SPORT_PREFERENCE_TYPE_OPTIONS: Array<{
  value: WorkoutSessionType;
  label: string;
}> = [
  { value: "full_body", label: "Renforcement complet" },
  { value: "upper_body", label: "Haut du corps" },
  { value: "lower_body", label: "Bas du corps" },
  { value: "core", label: "Abdominaux / gainage" },
  { value: "mobility", label: "Mobilité" },
  { value: "yoga", label: "Yoga" },
  { value: "cardio", label: "Cardio" },
  { value: "hiit", label: "HIIT" },
  { value: "tabata", label: "Tabata" },
  { value: "run", label: "Course" },
  { value: "active_walk", label: "Marche active" },
  { value: "recovery", label: "Récupération" },
  { value: "stretching", label: "Étirements" },
];
