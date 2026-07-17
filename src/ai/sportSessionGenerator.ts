import type { SportIntensity, SportType } from "./sportSessionGenerator.types";
import { generateLegacySportSession } from "./workoutGenerationEngine";
import type { WorkoutSession } from "../types/workoutSession";

export type { SportType, SportIntensity } from "./sportSessionGenerator.types";
export { isIntenseSportBlocked, isLateEveningSlot } from "./sportSessionGenerator.types";

export function generateWorkoutSession(args: {
  durationMinutes: number;
  sportType: SportType;
  intensity: SportIntensity;
  equipment?: string;
  slotHour: number;
  afterWorkEnergy?: string;
  fatigueLevel?: string;
  generationSeed?: string;
  recentSeeds?: string[];
  forceDifferent?: boolean;
}): WorkoutSession | null {
  return generateLegacySportSession({
    ...args,
    recentSeeds: args.recentSeeds,
    forceDifferent: args.forceDifferent,
    generationSeed: args.generationSeed,
  });
}

/** @deprecated Utiliser generateWorkoutSession */
export function generateSportSession(args: {
  durationMinutes: number;
  sportType: SportType;
  intensity: SportIntensity;
  equipment?: string;
  slotHour: number;
  afterWorkEnergy?: string;
}): {
  title: string;
  durationMinutes: number;
  sportType: string;
  intensity: string;
  steps: string[];
  equipment?: string;
} | null {
  const session = generateWorkoutSession(args);
  if (!session) return null;

  const steps = [
    `Échauffement — ${session.warmup.map((e) => e.name).join(", ")}`,
    ...(session.blocks.map((block) => `${block.label}: ${block.exercises.map((e) => e.name).join(", ")}`)),
    `Retour au calme — ${session.cooldown.map((e) => e.name).join(", ")}`,
  ];

  return {
    title: session.title,
    durationMinutes: session.durationMinutes,
    sportType: session.type,
    intensity: session.intensity,
    steps,
    equipment: session.equipment,
  };
}
