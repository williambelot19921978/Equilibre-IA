import type { WorkoutExerciseDetail, WorkoutLevel } from "../types/workoutSession";

type ExerciseTemplate = {
  name: string;
  targetAreas: string[];
  beginner: { reps?: string; durationSeconds?: number; note: string };
  intermediate: { reps?: string; durationSeconds?: number; note: string };
  advanced: { reps?: string; durationSeconds?: number; note: string };
};

export const EXERCISE_LIBRARY: ExerciseTemplate[] = [
  {
    name: "Squats",
    targetAreas: ["legs", "glutes"],
    beginner: { reps: "10 lents", note: "Chaise imaginaire, dos droit" },
    intermediate: { reps: "12", note: "Cuisses parallèles au sol" },
    advanced: { reps: "15 tempo lent", note: "Pause 2 s en bas" },
  },
  {
    name: "Pompes",
    targetAreas: ["chest", "arms"],
    beginner: { reps: "8 mur ou genoux", note: "Mains largeur épaules" },
    intermediate: { reps: "8", note: "Corps aligné" },
    advanced: { reps: "10 déclinées", note: "Pieds surélevés ou tempo" },
  },
  {
    name: "Fentes alternées",
    targetAreas: ["legs"],
    beginner: { reps: "8 / jambe", note: "Appui chaise si besoin" },
    intermediate: { reps: "10 / jambe", note: "Genou arrière près du sol" },
    advanced: { reps: "12 / jambe", note: "Sans appui" },
  },
  {
    name: "Gainage",
    targetAreas: ["core"],
    beginner: { durationSeconds: 20, note: "Genoux au sol possible" },
    intermediate: { durationSeconds: 30, note: "Corps gainé" },
    advanced: { durationSeconds: 45, note: "Épaules au-dessus des coudes" },
  },
  {
    name: "Montées de genoux",
    targetAreas: ["cardio", "legs"],
    beginner: { durationSeconds: 30, note: "Rythme modéré" },
    intermediate: { durationSeconds: 40, note: "Bras actifs" },
    advanced: { durationSeconds: 45, note: "Impact léger contrôlé" },
  },
  {
    name: "Mobilité hanches",
    targetAreas: ["hips", "mobility"],
    beginner: { durationSeconds: 30, note: "Cercles lents" },
    intermediate: { durationSeconds: 40, note: "Amplitude progressive" },
    advanced: { durationSeconds: 45, note: "Contrôle complet" },
  },
  {
    name: "Rotations épaules",
    targetAreas: ["shoulders", "mobility"],
    beginner: { durationSeconds: 30, note: "Petits cercles" },
    intermediate: { durationSeconds: 35, note: "Avant et arrière" },
    advanced: { durationSeconds: 40, note: "Bras tendus si confortable" },
  },
  {
    name: "Crunchs doux",
    targetAreas: ["core"],
    beginner: { reps: "10", note: "Mains derrière la tête sans tirer" },
    intermediate: { reps: "15", note: "Expiration à la montée" },
    advanced: { reps: "20", note: "Pieds décollés" },
  },
  {
    name: "Superman",
    targetAreas: ["back", "core"],
    beginner: { reps: "8", note: "Montée courte" },
    intermediate: { reps: "10", note: "Pause 2 s en haut" },
    advanced: { reps: "12", note: "Bras et jambes tendus" },
  },
  {
    name: "Step-ups",
    targetAreas: ["legs"],
    beginner: { reps: "10 / jambe", note: "Marche basse" },
    intermediate: { reps: "12 / jambe", note: "Contrôle à la descente" },
    advanced: { reps: "14 / jambe", note: "Sans élan" },
  },
];

export function pickExerciseForLevel(
  template: ExerciseTemplate,
  level: WorkoutLevel,
): WorkoutExerciseDetail {
  const variant = template[level];
  return {
    name: template.name,
    repetitions: variant.reps,
    durationSeconds: variant.durationSeconds,
    instructions: variant.note,
    easierVariation: template.beginner.note,
    harderVariation: template.advanced.note,
    targetAreas: template.targetAreas,
  };
}

export const WARMUP_TEMPLATES: Record<WorkoutLevel, WorkoutExerciseDetail[]> = {
  beginner: [
    { name: "Marche dynamique", durationSeconds: 45 },
    { name: "Rotations épaules", durationSeconds: 30 },
    { name: "Squats lents", repetitions: "8" },
  ],
  intermediate: [
    { name: "Marche dynamique", durationSeconds: 45 },
    { name: "Rotations épaules", durationSeconds: 30 },
    { name: "Squats lents", repetitions: "10" },
    { name: "Mobilité hanches", durationSeconds: 30 },
  ],
  advanced: [
    { name: "Montée de genoux légère", durationSeconds: 40 },
    { name: "Rotations épaules", durationSeconds: 30 },
    { name: "Squats", repetitions: "12" },
    { name: "Mobilité hanches", durationSeconds: 35 },
  ],
};

export const COOLDOWN_TEMPLATES: WorkoutExerciseDetail[] = [
  { name: "Respiration lente", durationSeconds: 45, instructions: "4 temps inspire, 6 expire" },
  { name: "Étirement jambes", durationSeconds: 30 },
  { name: "Étirement épaules", durationSeconds: 30 },
];
