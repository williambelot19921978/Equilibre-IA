import { parseClarificationTimeResponse } from "../../lib/nlp/parseClarificationTimeResponse";
import {
  buildPartialClarificationMessage,
  computeMissingWorkEntities,
  mergePendingEntities,
  type PendingConversationAction,
  type PendingMissingEntity,
} from "../../lib/nlp/pendingConversationAction";
import type { NlpEntity } from "../../types/nlp";

export function resolvePendingClarificationResponse({
  text,
  pending,
}: {
  text: string;
  pending: PendingConversationAction;
}): {
  mergedEntities: NlpEntity;
  stillMissing: PendingMissingEntity[];
  followUpMessage: string | null;
} {
  const timeResponse = parseClarificationTimeResponse(text);
  const patch: Partial<NlpEntity> = {
    times: timeResponse.times,
  };

  if (timeResponse.startTime) {
    patch.workTimeStart = timeResponse.startTime;
  }
  if (timeResponse.endTime) {
    patch.workTimeEnd = timeResponse.endTime;
  }

  if (
    pending.collectedEntities.workExceptionKind === "work_morning_only" ||
    pending.collectedEntities.workExceptionKind === "work_afternoon_only"
  ) {
    patch.workExceptionKind = pending.collectedEntities.workExceptionKind;
  }

  if (pending.targetDate) {
    patch.dates = [pending.targetDate];
  }

  const mergedEntities = mergePendingEntities(
    pending.collectedEntities,
    patch,
  );

  const stillMissing = computeMissingWorkEntities(mergedEntities);
  const followUpMessage = buildPartialClarificationMessage(stillMissing);

  return {
    mergedEntities,
    stillMissing,
    followUpMessage,
  };
}
