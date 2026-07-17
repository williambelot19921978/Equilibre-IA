export type WorkoutSessionType =
  | "full_body"
  | "upper_body"
  | "lower_body"
  | "core"
  | "mobility"
  | "yoga"
  | "cardio"
  | "hiit"
  | "tabata"
  | "run"
  | "active_walk"
  | "recovery"
  | "stretching";

export type WorkoutLevel = "beginner" | "intermediate" | "advanced";

export type WorkoutIntensity = "gentle" | "moderate" | "dynamic";

export type WorkoutExerciseDetail = {
  name: string;
  repetitions?: string;
  durationSeconds?: number;
  restSeconds?: number;
  instructions?: string;
  easierVariation?: string;
  harderVariation?: string;
  targetAreas?: string[];
};

export type WorkoutBlock = {
  label: string;
  exercises: WorkoutExerciseDetail[];
  rounds?: number;
  workSeconds?: number;
  restSeconds?: number;
};

export type WorkoutSession = {
  id: string;
  title: string;
  type: WorkoutSessionType;
  level: WorkoutLevel;
  durationMinutes: number;
  estimatedCalories?: number;
  equipment: string;
  intensity: WorkoutIntensity;
  warmup: WorkoutExerciseDetail[];
  blocks: WorkoutBlock[];
  exercises: WorkoutExerciseDetail[];
  rounds?: WorkoutBlock[];
  workSeconds?: number;
  restSeconds?: number;
  cooldown: WorkoutExerciseDetail[];
  instructions?: string;
  alternatives?: string[];
  safetyNotes?: string[];
  generatedReason: string;
  generationSeed: string;
  createdAt: string;
  /** Compatibilité Sprint 4.4 */
  safetyNote?: string;
};

export const WORKOUT_SESSION_TYPE_LABELS: Record<WorkoutSessionType, string> = {
  full_body: "Renforcement complet",
  upper_body: "Haut du corps",
  lower_body: "Bas du corps",
  core: "Abdominaux / gainage",
  mobility: "Mobilité",
  yoga: "Yoga",
  cardio: "Cardio",
  hiit: "HIIT",
  tabata: "Tabata",
  run: "Course",
  active_walk: "Marche active",
  recovery: "Récupération",
  stretching: "Étirements",
};

export const WORKOUT_LEVEL_LABELS: Record<WorkoutLevel, string> = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Confirmé",
};
