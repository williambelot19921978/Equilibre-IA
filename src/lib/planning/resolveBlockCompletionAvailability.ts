import type { DayTimelineEntry } from "./displayedDayTimeline";
import { getLocalDateFromIso } from "../time/localDateFromIso";

export type BlockCompletionAvailabilityResult = {
  allowed: boolean;
  message: string;
};

export function resolveBlockCompletionAvailability({
  entry,
  currentLocalDate,
  actualCompletedAt = new Date().toISOString(),
  allowEarlyCompletion = false,
}: {
  entry: DayTimelineEntry;
  currentLocalDate: string;
  actualCompletedAt?: string;
  allowEarlyCompletion?: boolean;
}): BlockCompletionAvailabilityResult {
  const blockDate = getLocalDateFromIso(entry.startsAt);

  if (blockDate > currentLocalDate) {
    return {
      allowed: false,
      message:
        "Cette activité est prévue plus tard. Tu ne peux pas la terminer avant son jour.",
    };
  }

  if (blockDate < currentLocalDate) {
    return {
      allowed: false,
      message: "Cette activité appartient à un jour passé et ne peut plus être modifiée ici.",
    };
  }

  if (
    !allowEarlyCompletion &&
    new Date(actualCompletedAt).getTime() < new Date(entry.startsAt).getTime()
  ) {
    return {
      allowed: false,
      message:
        "Cette activité n'a pas encore commencé. Attends son horaire ou décale-la si besoin.",
    };
  }

  if (entry.completed) {
    return {
      allowed: false,
      message: "Cette activité est déjà enregistrée comme terminée.",
    };
  }

  return {
    allowed: true,
    message: "",
  };
}
