import { isManualCalendarSource } from "../../config/calendarSources";
import {
  CALENDAR_ITEM_TYPES,
  isManualCalendarItemType,
} from "../../config/calendarItemTypes";
import type { CalendarItemRecord } from "../../types/database";
import type { DayConstraint } from "../../types/planning";
import {
  combineDateAndTime,
  getDurationMinutes,
} from "../time/daySchedule";

export type NormalizeConstraintResult =
  | { success: true; constraint: DayConstraint }
  | { success: false; reason: string; entityId: string };

export type IgnoredCalendarItem = {
  id: string;
  title: string;
  reason: string;
};

const ALLOWED_ITEM_TYPES = new Set<string>(CALENDAR_ITEM_TYPES);

export function getCalendarDayBounds(targetDate: string): {
  dayStart: string;
  dayEnd: string;
} {
  return {
    dayStart: new Date(`${targetDate}T00:00:00`).toISOString(),
    dayEnd: new Date(`${targetDate}T23:59:59.999`).toISOString(),
  };
}

function parseIsoDate(iso: string | null | undefined): Date | null {
  if (!iso) {
    return null;
  }

  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function validateCalendarItemForPlanning(
  item: CalendarItemRecord,
): { valid: true } | { valid: false; reason: string } {
  if (!item.id) {
    return { valid: false, reason: "Identifiant absent." };
  }

  if (!item.household_id) {
    return { valid: false, reason: "Foyer manquant." };
  }

  if (!item.user_id) {
    return { valid: false, reason: "Utilisateur manquant." };
  }

  const title = item.title?.trim() ?? "";

  if (!title) {
    return { valid: false, reason: "Titre vide." };
  }

  if (!ALLOWED_ITEM_TYPES.has(item.item_type)) {
    return { valid: false, reason: `Type « ${item.item_type} » non autorisé.` };
  }

  if (isManualCalendarSource(item.source)) {
    if (!item.locked) {
      return {
        valid: false,
        reason: "Un rendez-vous manuel doit être verrouillé (locked=true).",
      };
    }

    if (!isManualCalendarItemType(item.item_type)) {
      return {
        valid: false,
        reason: "Un rendez-vous manuel doit être de type event.",
      };
    }
  }

  const startDate = parseIsoDate(item.starts_at);
  const endDate = parseIsoDate(item.ends_at);

  if (!startDate) {
    return { valid: false, reason: "Une contrainte du calendrier contient une date de début invalide." };
  }

  if (!endDate) {
    return { valid: false, reason: "Une contrainte du calendrier contient une date de fin invalide." };
  }

  if (endDate.getTime() <= startDate.getTime()) {
    return {
      valid: false,
      reason: `Le rendez-vous « ${title} » se termine avant ou à son heure de début.`,
    };
  }

  if (item.details !== null && typeof item.details !== "object") {
    return { valid: false, reason: "Le champ details n’est pas un objet JSON valide." };
  }

  return { valid: true };
}

export function normalizeCalendarItemToConstraint(
  item: CalendarItemRecord,
  targetDate: string,
  options?: {
    wakeTime?: string;
    bedTime?: string;
  },
): NormalizeConstraintResult {
  const validation = validateCalendarItemForPlanning(item);

  if (!validation.valid) {
    return {
      success: false,
      reason: validation.reason,
      entityId: item.id ?? "unknown",
    };
  }

  const title = item.title.trim();
  const startDate = parseIsoDate(item.starts_at)!;
  const endDate = parseIsoDate(item.ends_at)!;
  const { dayStart, dayEnd } = getCalendarDayBounds(targetDate);
  const dayStartMs = new Date(dayStart).getTime();
  const dayEndMs = new Date(dayEnd).getTime();
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();

  if (endMs <= dayStartMs || startMs >= dayEndMs) {
    return {
      success: false,
      reason: "Hors de la date ciblée.",
      entityId: item.id,
    };
  }

  let clippedStartMs = Math.max(startMs, dayStartMs);
  let clippedEndMs = Math.min(endMs, dayEndMs);

  if (options?.wakeTime && options?.bedTime) {
    const wakeMs = new Date(
      combineDateAndTime(targetDate, options.wakeTime),
    ).getTime();
    const bedMs = new Date(
      combineDateAndTime(targetDate, options.bedTime),
    ).getTime();
    clippedStartMs = Math.max(clippedStartMs, wakeMs);
    clippedEndMs = Math.min(clippedEndMs, bedMs);
  }

  const clippedStart = new Date(clippedStartMs).toISOString();
  const clippedEnd = new Date(clippedEndMs).toISOString();

  if (
    clippedEndMs <= clippedStartMs ||
    getDurationMinutes(clippedStart, clippedEnd) <= 0
  ) {
    return {
      success: false,
      reason: `Le rendez-vous « ${title} » n’a aucune durée utile sur cette journée.`,
      entityId: item.id,
    };
  }

  const constraintLabel =
    item.details?.constraintType &&
    typeof item.details.constraintType === "string"
      ? item.details.constraintType
      : "manual";

  return {
    success: true,
    constraint: {
      id: item.id,
      type: "manual",
      title,
      startsAt: clippedStart,
      endsAt: clippedEnd,
      locked: true,
      source: isManualCalendarSource(item.source) ? "manual" : "engine",
      incompleteReason:
        constraintLabel !== "manual"
          ? `Contrainte manuelle : ${constraintLabel}.`
          : clippedStartMs > startMs || clippedEndMs < endMs
            ? "Durée ajustée aux limites de la journée."
            : undefined,
    },
  };
}

export function normalizeCalendarItemsForPlanning({
  items,
  targetDate,
  wakeTime,
  bedTime,
}: {
  items: CalendarItemRecord[];
  targetDate: string;
  wakeTime?: string;
  bedTime?: string;
}): {
  constraints: DayConstraint[];
  ignored: IgnoredCalendarItem[];
} {
  const constraints: DayConstraint[] = [];
  const ignored: IgnoredCalendarItem[] = [];

  for (const item of items) {
    if (!item.locked) {
      continue;
    }

    const result = normalizeCalendarItemToConstraint(item, targetDate, {
      wakeTime,
      bedTime,
    });

    if (result.success) {
      constraints.push(result.constraint);
      continue;
    }

    ignored.push({
      id: result.entityId,
      title: item.title?.trim() || item.id,
      reason: result.reason,
    });
  }

  return { constraints, ignored };
}
