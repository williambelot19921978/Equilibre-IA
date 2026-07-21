/**
 * DecisionEngine core — Sprint A3.
 * Pure validation logic aligned with legacy `decisionEngine.ts` (reference until parity validated).
 */

import type { PlanningContext } from "../../memoryEngine";
import type { PlannedBlock } from "../../../types/planning";
import { getBedTime, getWakeTime } from "../../memoryEngine";
import { combineDateAndTime, rangesOverlap } from "../../../lib/time/daySchedule";

const MAX_FILL_RATIO = 0.8;
const MAX_TASKS_PER_HALF_DAY = 3;

export function getMaxFillRatio(context: PlanningContext): number {
  return context.familyContext?.maxFillRatio ?? MAX_FILL_RATIO;
}

export type ValidatePlannedBlockInput = {
  block: PlannedBlock;
  context: PlanningContext;
  existingBlocks: PlannedBlock[];
  totalFreeMinutes: number;
  plannedMinutes: number;
};

export type BlockValidationResult = {
  valid: boolean;
  reason: string;
};

function countHalfDayTasks(
  blocks: PlannedBlock[],
  block: PlannedBlock,
): { morning: number; afternoon: number } {
  const blockMinutes =
    new Date(block.startsAt).getHours() * 60 +
    new Date(block.startsAt).getMinutes();
  const midday = 13 * 60;

  let morning = 0;
  let afternoon = 0;

  for (const existing of blocks) {
    if (existing.blockType !== "task") continue;

    const minutes =
      new Date(existing.startsAt).getHours() * 60 +
      new Date(existing.startsAt).getMinutes();

    if (minutes < midday) {
      morning += 1;
    } else {
      afternoon += 1;
    }
  }

  if (blockMinutes < midday) {
    morning += 1;
  } else {
    afternoon += 1;
  }

  return { morning, afternoon };
}

export function validatePlannedBlockCore(
  input: ValidatePlannedBlockInput,
): BlockValidationResult {
  const { block, context, existingBlocks, totalFreeMinutes, plannedMinutes } =
    input;

  if (block.blockType !== "task") {
    return { valid: true, reason: "" };
  }

  const wakeTime = getWakeTime(context);
  const bedTime = getBedTime(context);
  const dayStart = combineDateAndTime(block.startsAt.slice(0, 10), wakeTime);
  const dayEnd = combineDateAndTime(block.startsAt.slice(0, 10), bedTime);

  if (new Date(block.startsAt).getTime() < new Date(dayStart).getTime()) {
    return {
      valid: false,
      reason: "La tâche ne peut pas commencer avant le réveil.",
    };
  }

  if (new Date(block.endsAt).getTime() > new Date(dayEnd).getTime()) {
    return {
      valid: false,
      reason: "Le sommeil est protégé — aucune tâche après le coucher.",
    };
  }

  for (const existing of existingBlocks) {
    if (existing.blockType === "constraint" || existing.locked) {
      if (
        rangesOverlap(
          block.startsAt,
          block.endsAt,
          existing.startsAt,
          existing.endsAt,
        )
      ) {
        return {
          valid: false,
          reason: `Chevauchement avec la contrainte « ${existing.title} ».`,
        };
      }
    }
  }

  for (const existing of existingBlocks) {
    if (
      existing.blockType === "task" &&
      rangesOverlap(
        block.startsAt,
        block.endsAt,
        existing.startsAt,
        existing.endsAt,
      )
    ) {
      return {
        valid: false,
        reason: "Chevauchement avec une autre tâche déjà placée.",
      };
    }
  }

  const durationMinutes = Math.round(
    (new Date(block.endsAt).getTime() - new Date(block.startsAt).getTime()) /
      60_000,
  );

  if (
    block.category === "spirituality" &&
    context.profile.faithImportance === "disabled"
  ) {
    return {
      valid: false,
      reason: "Aucune proposition spirituelle car faith_importance=disabled.",
    };
  }

  if (
    block.energyLevel === "low" &&
    durationMinutes > 45 &&
    (block.category === "studies" || block.category === "work")
  ) {
    return {
      valid: false,
      reason:
        "Tâche longue refusée sur un créneau à énergie faible (estimation).",
    };
  }

  const halfDayCounts = countHalfDayTasks(existingBlocks, block);

  if (
    halfDayCounts.morning > MAX_TASKS_PER_HALF_DAY ||
    halfDayCounts.afternoon > MAX_TASKS_PER_HALF_DAY
  ) {
    return {
      valid: false,
      reason: "Maximum 3 tâches par demi-journée atteint.",
    };
  }

  if (
    plannedMinutes + durationMinutes >
    totalFreeMinutes * getMaxFillRatio(context)
  ) {
    return {
      valid: false,
      reason: `Limite de remplissage à ${Math.round(getMaxFillRatio(context) * 100)} % du temps libre atteinte.`,
    };
  }

  return { valid: true, reason: "" };
}

export function validateDayPlanCore({
  blocks,
  context,
  totalFreeMinutes,
}: {
  blocks: PlannedBlock[];
  context: PlanningContext;
  totalFreeMinutes: number;
}): BlockValidationResult[] {
  const results: BlockValidationResult[] = [];
  const taskBlocks = blocks.filter((block) => block.blockType === "task");
  let cumulativeMinutes = 0;

  for (const block of taskBlocks) {
    const result = validatePlannedBlockCore({
      block,
      context,
      existingBlocks: blocks.filter((item) => item.id !== block.id),
      totalFreeMinutes,
      plannedMinutes: cumulativeMinutes,
    });

    if (!result.valid) {
      results.push(result);
    }

    cumulativeMinutes += Math.round(
      (new Date(block.endsAt).getTime() - new Date(block.startsAt).getTime()) /
        60_000,
    );
  }

  return results;
}
