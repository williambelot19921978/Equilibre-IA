import type { WorkoutBlock, WorkoutSession } from "../../types/workoutSession";
import { WORKOUT_SESSION_TYPE_LABELS } from "../../types/workoutSession";
import { snapSportDuration } from "./resolveSportDuration";

function allocateMinutes(total: number): {
  warmup: number;
  main: number;
  cooldown: number;
} {
  const warmup = total <= 10 ? 2 : total <= 15 ? 3 : 4;
  const cooldown = total <= 10 ? 2 : total <= 15 ? 2 : 3;
  const main = Math.max(3, total - warmup - cooldown);
  return { warmup, main, cooldown };
}

function scaleCircuitBlock(block: WorkoutBlock, targetMainMinutes: number): WorkoutBlock {
  const currentRounds = block.rounds ?? 1;
  const exerciseCount = Math.max(1, block.exercises.length);
  const restSeconds = block.restSeconds ?? 30;
  const workSecondsPerExercise = 40;
  const roundDurationSeconds =
    exerciseCount * workSecondsPerExercise + Math.max(0, currentRounds - 1) * restSeconds;
  const currentMainSeconds = currentRounds * roundDurationSeconds;
  const targetMainSeconds = targetMainMinutes * 60;
  const ratio = targetMainSeconds / Math.max(currentMainSeconds, 1);
  const nextRounds = Math.max(currentRounds, Math.round(currentRounds * ratio));

  return {
    ...block,
    rounds: nextRounds,
    label: block.label.replace(/\d+ tours/, `${nextRounds} tours`).includes("tours")
      ? block.label.replace(/\d+ tours/, `${nextRounds} tours`)
      : `${block.label.split("—")[0]?.trim() ?? "Circuit"} — ${nextRounds} tours`,
  };
}

function scaleContinuousBlock(block: WorkoutBlock, targetMainMinutes: number): WorkoutBlock {
  return {
    ...block,
    exercises: block.exercises.map((exercise, index) =>
      index === 0
        ? {
            ...exercise,
            durationSeconds: targetMainMinutes * 60,
          }
        : exercise,
    ),
  };
}

function scaleHiitBlock(block: WorkoutBlock, targetMainMinutes: number): WorkoutBlock {
  const work = block.workSeconds ?? 30;
  const rest = block.restSeconds ?? 20;
  const cycle = work + rest;
  const nextRounds = Math.min(
    10,
    Math.max(block.rounds ?? 4, Math.floor((targetMainMinutes * 60) / cycle)),
  );
  return { ...block, rounds: nextRounds };
}

function scaleBlocks(session: WorkoutSession, targetMainMinutes: number): WorkoutBlock[] {
  return session.blocks.map((block) => {
    if (
      block.workSeconds !== undefined ||
      block.label.toLowerCase().includes("hiit") ||
      block.label.toLowerCase().includes("tabata")
    ) {
      return scaleHiitBlock(block, targetMainMinutes);
    }
    if (block.rounds && block.rounds > 0) {
      return scaleCircuitBlock(block, targetMainMinutes);
    }
    return scaleContinuousBlock(block, targetMainMinutes);
  });
}

export function adaptWorkoutSessionDuration(
  session: WorkoutSession,
  targetDuration: number,
  maxMinutes?: number,
): WorkoutSession {
  const durationMinutes = snapSportDuration(targetDuration, session.type, {
    maxMinutes: maxMinutes ?? targetDuration,
  });

  if (durationMinutes === session.durationMinutes) {
    return session;
  }

  const targetMain = allocateMinutes(durationMinutes).main;
  const blocks = scaleBlocks(session, targetMain);
  const title = `${WORKOUT_SESSION_TYPE_LABELS[session.type]} — ${durationMinutes} min`;

  return {
    ...session,
    durationMinutes,
    title,
    blocks,
    rounds: blocks,
    generationSeed: `${session.generationSeed}-dur${durationMinutes}`,
  };
}
