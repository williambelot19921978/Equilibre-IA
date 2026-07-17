import type { FlexibleBuffer } from "../../types/flexibleBuffer";
import type { SchedulableBlock } from "./absorbDurationChangeWithFreeTime";
import { absorbDurationChangeWithFreeTime } from "./absorbDurationChangeWithFreeTime";
import { computeFreedMinutes } from "./evaluateCompletionTiming";

export type EarlyFinishReleaseResult = {
  nextEndsAt: string;
  freedMinutes: number;
  explanation: string;
  absorptionExplanation: string[];
};

export function releaseEarlyFinishTime({
  blocks,
  buffers,
  targetBlockId,
  scheduledEndsAt,
  actualCompletedAt,
}: {
  blocks: SchedulableBlock[];
  buffers: FlexibleBuffer[];
  targetBlockId: string;
  scheduledEndsAt: string;
  actualCompletedAt: string;
}): EarlyFinishReleaseResult {
  const freedMinutes = computeFreedMinutes({
    scheduledEndsAt,
    actualCompletedAt,
  });

  if (freedMinutes <= 0) {
    return {
      nextEndsAt: scheduledEndsAt,
      freedMinutes: 0,
      explanation: "",
      absorptionExplanation: [],
    };
  }

  const target = blocks.find((block) => block.id === targetBlockId);
  if (!target) {
    return {
      nextEndsAt: actualCompletedAt,
      freedMinutes,
      explanation: `Tu as terminé ${freedMinutes} minutes en avance.`,
      absorptionExplanation: [],
    };
  }

  const nextEndsAt = actualCompletedAt;
  const absorption = absorbDurationChangeWithFreeTime({
    blocks,
    buffers,
    targetBlockId,
    nextStartsAt: target.startsAt,
    nextEndsAt,
  });

  return {
    nextEndsAt,
    freedMinutes,
    explanation: `Tu as terminé ${freedMinutes} minutes en avance. Je garde ce temps libre, sauf si tu souhaites avancer la suite.`,
    absorptionExplanation: [
      ...absorption.explanation,
      `Créneau libre de ${freedMinutes} min après « ${target.title} ».`,
    ],
  };
}

export function buildFreedTimeFollowUp(freedMinutes: number): string {
  if (freedMinutes <= 0) return "";
  return `Tu peux garder ces ${freedMinutes} min libres, prendre une pause ou avancer une petite priorité.`;
}
