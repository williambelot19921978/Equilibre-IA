import { addMinutesToIso } from "../time/daySchedule";
import type { NlpEntity, NlpIntent } from "../../types/nlp";

export type PendingMissingEntity =
  | "startTime"
  | "endTime"
  | "date"
  | "duration"
  | "time";

export type PendingConversationAction = {
  id: string;
  intent: NlpIntent;
  originalText: string;
  missingEntities: PendingMissingEntity[];
  collectedEntities: Partial<NlpEntity>;
  targetDate?: string;
  createdAt: string;
  expiresAt: string;
  confirmationRequired: boolean;
};

const PENDING_TTL_MINUTES = 30;

export function createPendingConversationAction({
  intent,
  originalText,
  missingEntities,
  collectedEntities,
  targetDate,
  confirmationRequired = false,
}: {
  intent: NlpIntent;
  originalText: string;
  missingEntities: PendingMissingEntity[];
  collectedEntities: Partial<NlpEntity>;
  targetDate?: string;
  confirmationRequired?: boolean;
}): PendingConversationAction {
  const createdAt = new Date().toISOString();
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    intent,
    originalText,
    missingEntities,
    collectedEntities,
    targetDate,
    createdAt,
    expiresAt: addMinutesToIso(createdAt, PENDING_TTL_MINUTES),
    confirmationRequired,
  };
}

export function isPendingActionExpired(
  action: PendingConversationAction,
  nowIso = new Date().toISOString(),
): boolean {
  return nowIso >= action.expiresAt;
}

export function isPendingCancellationPhrase(text: string): boolean {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();

  return (
    /^(annule|annuler|laisse tomber|laisse|finalement non|non finalement|oublie|oublie ca|oublie ça|laisse ca|laisse ça)$/.test(
      normalized,
    ) ||
    /\b(annule|laisse tomber|finalement non|oublie)\b/.test(normalized)
  );
}

export function computeMissingWorkEntities(
  entities: NlpEntity,
): PendingMissingEntity[] {
  const missing: PendingMissingEntity[] = [];

  if (entities.workExceptionKind === "work_morning_only") {
    if (!entities.workTimeStart && entities.times.length < 1) {
      missing.push("startTime");
    }
    if (!entities.workTimeEnd && entities.times.length < 2) {
      missing.push("endTime");
    }
    return missing;
  }

  if (entities.workExceptionKind === "work_afternoon_only") {
    if (!entities.workTimeStart && entities.times.length < 1) {
      missing.push("startTime");
    }
    return missing;
  }

  if (entities.workExceptionKind === "half_morning") {
    if (!entities.workTimeStart && entities.times.length < 1) {
      missing.push("startTime");
    }
    return missing;
  }

  if (entities.workExceptionKind === "half_afternoon") {
    if (!entities.workTimeEnd && entities.times.length < 1) {
      missing.push("endTime");
    }
    return missing;
  }

  return missing;
}

export function mergePendingEntities(
  collected: Partial<NlpEntity>,
  patch: Partial<NlpEntity>,
): NlpEntity {
  const dates =
    patch.dates && patch.dates.length > 0
      ? patch.dates
      : collected.dates ?? [];

  const times = [...new Set([...(collected.times ?? []), ...(patch.times ?? [])])];

  return {
    dates,
    dateRange: patch.dateRange ?? collected.dateRange,
    times,
    durationMinutes: patch.durationMinutes ?? collected.durationMinutes,
    durationDeltaMinutes:
      patch.durationDeltaMinutes ?? collected.durationDeltaMinutes,
    weekday: patch.weekday ?? collected.weekday,
    weekdays: patch.weekdays ?? collected.weekdays,
    person: patch.person ?? collected.person,
    childName: patch.childName ?? collected.childName,
    location: patch.location ?? collected.location,
    activity: patch.activity ?? collected.activity,
    workTimeStart: patch.workTimeStart ?? collected.workTimeStart ?? times[0],
    workTimeEnd:
      patch.workTimeEnd ??
      collected.workTimeEnd ??
      (times.length >= 2 ? times[1] : undefined),
    workExceptionKind:
      patch.workExceptionKind ?? collected.workExceptionKind,
    scope: patch.scope ?? collected.scope ?? "punctual",
    recurring: patch.recurring ?? collected.recurring ?? false,
  };
}

export function buildPartialClarificationMessage(
  missing: PendingMissingEntity[],
): string | null {
  if (missing.includes("startTime") && missing.includes("endTime")) {
    return "À quelle heure commences-tu et à quelle heure termines-tu ?";
  }
  if (missing.includes("startTime")) {
    return "À quelle heure commences-tu ?";
  }
  if (missing.includes("endTime")) {
    return "À quelle heure termines-tu ?";
  }
  return null;
}
