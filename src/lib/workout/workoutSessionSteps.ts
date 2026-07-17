import type { WorkoutSession } from "../../types/workoutSession";

export type WorkoutTimerStepKind = "work" | "rest";

export type WorkoutTimerStep = {
  id: string;
  label: string;
  kind: WorkoutTimerStepKind;
  durationSeconds: number;
  exerciseName: string;
  round?: number;
  totalRounds?: number;
  instructions?: string;
};

function exerciseDurationSeconds(
  exercise: WorkoutSession["warmup"][number],
  fallback = 30,
): number {
  if (exercise.durationSeconds) return exercise.durationSeconds;
  if (exercise.repetitions) return 45;
  return fallback;
}

export function buildWorkoutTimerSteps(session: WorkoutSession): WorkoutTimerStep[] {
  const steps: WorkoutTimerStep[] = [];

  session.warmup.forEach((exercise, index) => {
    steps.push({
      id: `warmup-${index}`,
      label: "Échauffement",
      kind: "work",
      durationSeconds: exerciseDurationSeconds(exercise, 30),
      exerciseName: exercise.name,
      instructions: exercise.instructions,
    });
  });

  session.blocks.forEach((block, blockIndex) => {
    const rounds = block.rounds ?? 1;
    for (let round = 1; round <= rounds; round += 1) {
      block.exercises.forEach((exercise, exerciseIndex) => {
        steps.push({
          id: `block-${blockIndex}-r${round}-e${exerciseIndex}`,
          label: block.label,
          kind: "work",
          durationSeconds: exerciseDurationSeconds(exercise, 40),
          exerciseName: exercise.name,
          round,
          totalRounds: rounds,
          instructions: exercise.instructions,
        });
      });

      if (block.restSeconds && round < rounds) {
        steps.push({
          id: `block-${blockIndex}-r${round}-rest`,
          label: "Récupération",
          kind: "rest",
          durationSeconds: block.restSeconds,
          exerciseName: "Repos entre les tours",
          round,
          totalRounds: rounds,
        });
      }
    }
  });

  session.cooldown.forEach((exercise, index) => {
    steps.push({
      id: `cooldown-${index}`,
      label: "Retour au calme",
      kind: "work",
      durationSeconds: exerciseDurationSeconds(exercise, 30),
      exerciseName: exercise.name,
      instructions: exercise.instructions,
    });
  });

  return steps;
}

export function estimateWorkoutTimerSeconds(session: WorkoutSession): number {
  return buildWorkoutTimerSteps(session).reduce(
    (sum, step) => sum + step.durationSeconds,
    0,
  );
}
