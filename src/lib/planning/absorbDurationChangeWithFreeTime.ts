import { addMinutesToIso, getDurationMinutes, rangesOverlap } from "../time/daySchedule";
import type { FlexibleBuffer } from "../../types/flexibleBuffer";

export type SchedulableBlock = {
  id: string;
  calendarItemId?: string;
  startsAt: string;
  endsAt: string;
  locked: boolean;
  flexible: boolean;
  title: string;
};

export type AbsorptionChange = {
  blockId: string;
  calendarItemId?: string;
  previousStartsAt: string;
  previousEndsAt: string;
  nextStartsAt: string;
  nextEndsAt: string;
  reason: string;
};

export type AbsorptionResult = {
  blocks: SchedulableBlock[];
  buffers: FlexibleBuffer[];
  changes: AbsorptionChange[];
  explanation: string[];
};

function cloneBlock(block: SchedulableBlock): SchedulableBlock {
  return { ...block };
}

function cloneBuffer(buffer: FlexibleBuffer): FlexibleBuffer {
  return { ...buffer };
}

function sortBlocks(blocks: SchedulableBlock[]): SchedulableBlock[] {
  return [...blocks].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
}

function sortBuffers(buffers: FlexibleBuffer[]): FlexibleBuffer[] {
  return [...buffers].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
}

function pushBlock(
  blocks: SchedulableBlock[],
  blockId: string,
  deltaMinutes: number,
  reason: string,
  changes: AbsorptionChange[],
): void {
  const index = blocks.findIndex((block) => block.id === blockId);
  if (index === -1 || !blocks[index].flexible || blocks[index].locked) return;

  const block = blocks[index];
  const previousStartsAt = block.startsAt;
  const previousEndsAt = block.endsAt;
  const nextStartsAt = addMinutesToIso(block.startsAt, deltaMinutes);
  const nextEndsAt = addMinutesToIso(block.endsAt, deltaMinutes);

  blocks[index] = {
    ...block,
    startsAt: nextStartsAt,
    endsAt: nextEndsAt,
  };

  changes.push({
    blockId: block.id,
    calendarItemId: block.calendarItemId,
    previousStartsAt,
    previousEndsAt,
    nextStartsAt,
    nextEndsAt,
    reason,
  });
}

function shrinkBufferAfter(
  buffers: FlexibleBuffer[],
  anchorEnd: string,
  minutes: number,
  minimumRemainingMinutes: number,
): number {
  const index = buffers.findIndex(
    (buffer) =>
      buffer.absorbable &&
      new Date(buffer.startsAt).getTime() >= new Date(anchorEnd).getTime(),
  );
  if (index === -1) return minutes;

  const buffer = buffers[index];
  const reducible = Math.max(
    0,
    buffer.durationMinutes -
      Math.max(buffer.minimumRemainingMinutes, minimumRemainingMinutes),
  );
  const consumed = Math.min(minutes, reducible);
  if (consumed <= 0) return minutes;

  buffers[index] = {
    ...buffer,
    startsAt: addMinutesToIso(buffer.startsAt, consumed),
    durationMinutes: buffer.durationMinutes - consumed,
    endsAt: addMinutesToIso(buffer.endsAt, 0),
  };
  buffers[index].endsAt = addMinutesToIso(buffers[index].startsAt, buffers[index].durationMinutes);

  return minutes - consumed;
}

function shrinkBufferBefore(
  buffers: FlexibleBuffer[],
  anchorStart: string,
  minutes: number,
  minimumRemainingMinutes: number,
): number {
  const candidates = buffers
    .map((buffer, index) => ({ buffer, index }))
    .filter(
      ({ buffer }) =>
        buffer.absorbable &&
        new Date(buffer.endsAt).getTime() <= new Date(anchorStart).getTime(),
    )
    .sort(
      (a, b) =>
        new Date(b.buffer.endsAt).getTime() - new Date(a.buffer.endsAt).getTime(),
    );

  if (candidates.length === 0) return minutes;

  const { buffer, index } = candidates[0];
  const reducible = Math.max(
    0,
    buffer.durationMinutes -
      Math.max(buffer.minimumRemainingMinutes, minimumRemainingMinutes),
  );
  const consumed = Math.min(minutes, reducible);
  if (consumed <= 0) return minutes;

  buffers[index] = {
    ...buffer,
    durationMinutes: buffer.durationMinutes - consumed,
    endsAt: addMinutesToIso(buffer.endsAt, -consumed),
  };

  return minutes - consumed;
}

export function absorbDurationChangeWithFreeTime({
  blocks,
  buffers,
  targetBlockId,
  nextStartsAt,
  nextEndsAt,
  minimumFreeMinutes = 10,
}: {
  blocks: SchedulableBlock[];
  buffers: FlexibleBuffer[];
  targetBlockId: string;
  nextStartsAt: string;
  nextEndsAt: string;
  minimumFreeMinutes?: number;
}): AbsorptionResult {
  const workingBlocks = sortBlocks(blocks.map(cloneBlock));
  const workingBuffers = sortBuffers(buffers.map(cloneBuffer));
  const changes: AbsorptionChange[] = [];
  const explanation: string[] = [];

  const targetIndex = workingBlocks.findIndex((block) => block.id === targetBlockId);
  if (targetIndex === -1) {
    return { blocks: workingBlocks, buffers: workingBuffers, changes, explanation };
  }

  const target = workingBlocks[targetIndex];
  const previousDuration = getDurationMinutes(target.startsAt, target.endsAt);
  const nextDuration = getDurationMinutes(nextStartsAt, nextEndsAt);
  const delta = nextDuration - previousDuration;

  workingBlocks[targetIndex] = {
    ...target,
    startsAt: nextStartsAt,
    endsAt: nextEndsAt,
  };

  changes.push({
    blockId: target.id,
    calendarItemId: target.calendarItemId,
    previousStartsAt: target.startsAt,
    previousEndsAt: target.endsAt,
    nextStartsAt,
    nextEndsAt,
    reason: delta >= 0 ? "Durée augmentée" : "Durée réduite",
  });

  if (delta <= 0) {
    explanation.push(`« ${target.title} » a été raccourcie.`);
    return { blocks: workingBlocks, buffers: workingBuffers, changes, explanation };
  }

  let remaining = delta;

  remaining = shrinkBufferAfter(
    workingBuffers,
    target.startsAt,
    remaining,
    minimumFreeMinutes,
  );
  if (remaining < delta) {
    explanation.push("Le temps libre suivant a absorbé une partie du dépassement.");
  }

  if (remaining > 0) {
    remaining = shrinkBufferBefore(
      workingBuffers,
      target.endsAt,
      remaining,
      minimumFreeMinutes,
    );
    if (remaining < delta) {
      explanation.push("Le temps libre précédent a aussi été réduit.");
    }
  }

  if (remaining > 0) {
    const nextFlexible = workingBlocks
      .slice(targetIndex + 1)
      .find((block) => block.flexible && !block.locked);

    if (nextFlexible) {
      pushBlock(
        workingBlocks,
        nextFlexible.id,
        remaining,
        "Décalé pour laisser place au bloc rallongé",
        changes,
      );
      explanation.push(`« ${nextFlexible.title} » a été décalée.`);
      remaining = 0;
    }
  }

  if (remaining > 0) {
    explanation.push(
      "Impossible d'absorber entièrement le dépassement sans chevauchement — report recommandé.",
    );
  } else {
    explanation.push(`« ${target.title} » tient dans la journée sans chevauchement.`);
  }

  for (let i = 0; i < workingBlocks.length; i += 1) {
    for (let j = i + 1; j < workingBlocks.length; j += 1) {
      if (
        rangesOverlap(
          workingBlocks[i].startsAt,
          workingBlocks[i].endsAt,
          workingBlocks[j].startsAt,
          workingBlocks[j].endsAt,
        )
      ) {
        explanation.push("Attention : chevauchement détecté après absorption.");
        break;
      }
    }
  }

  return {
    blocks: sortBlocks(workingBlocks),
    buffers: sortBuffers(workingBuffers),
    changes,
    explanation,
  };
}
