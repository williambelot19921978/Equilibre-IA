import { CALENDAR_ITEM_SOURCES, isCalendarItemSource } from "../../config/calendarSources";
import {
  formatAllowedCalendarItemTypes,
  isCalendarItemType,
  type CalendarItemType,
} from "../../config/calendarItemTypes";
import { PlanningGenerationError } from "../../types/planningGenerationError";

export type CalendarInsertPayload = {
  household_id: string;
  user_id: string;
  task_id?: string | null;
  title: string;
  item_type: string;
  starts_at: string;
  ends_at: string;
  locked: boolean;
  source: string;
  details?: Record<string, unknown> | null;
  updated_at?: string;
};

function parseIsoDate(iso: string | null | undefined): Date | null {
  if (!iso) {
    return null;
  }

  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function validateCalendarInsertPayload(
  payload: CalendarInsertPayload,
): void {
  if (!payload.household_id) {
    throw new PlanningGenerationError({
      code: "INVALID_HOUSEHOLD",
      userMessage: "Impossible d’enregistrer le calendrier : foyer manquant.",
      technicalDetails: "household_id is empty",
      step: "save",
    });
  }

  if (!payload.user_id) {
    throw new PlanningGenerationError({
      code: "INVALID_USER",
      userMessage: "Impossible d’enregistrer le calendrier : utilisateur manquant.",
      technicalDetails: "user_id is empty",
      step: "save",
    });
  }

  const title = payload.title?.trim() ?? "";

  if (!title) {
    throw new PlanningGenerationError({
      code: "INVALID_TITLE",
      userMessage: "Impossible d’enregistrer le calendrier : titre vide.",
      technicalDetails: "title is empty",
      step: "save",
    });
  }

  if (!isCalendarItemType(payload.item_type)) {
    throw new PlanningGenerationError({
      code: "INVALID_ITEM_TYPE",
      userMessage: `Le type de bloc « ${payload.item_type} » n’est pas autorisé par calendar_items. Valeurs acceptées : ${formatAllowedCalendarItemTypes()}.`,
      technicalDetails: `Rejected item_type=${payload.item_type}`,
      step: "save",
    });
  }

  if (!isCalendarItemSource(payload.source)) {
    throw new PlanningGenerationError({
      code: "INVALID_SOURCE",
      userMessage: `La source « ${payload.source} » n’est pas autorisée par calendar_items. Valeurs acceptées : ${CALENDAR_ITEM_SOURCES.join(", ")}.`,
      technicalDetails: `Rejected source=${payload.source}`,
      step: "save",
    });
  }

  const startsAt = parseIsoDate(payload.starts_at);
  const endsAt = parseIsoDate(payload.ends_at);

  if (!startsAt) {
    throw new PlanningGenerationError({
      code: "INVALID_STARTS_AT",
      userMessage: "Une contrainte du calendrier contient une date de début invalide.",
      technicalDetails: `starts_at=${payload.starts_at}`,
      step: "save",
    });
  }

  if (!endsAt) {
    throw new PlanningGenerationError({
      code: "INVALID_ENDS_AT",
      userMessage: "Une contrainte du calendrier contient une date de fin invalide.",
      technicalDetails: `ends_at=${payload.ends_at}`,
      step: "save",
    });
  }

  if (endsAt.getTime() <= startsAt.getTime()) {
    throw new PlanningGenerationError({
      code: "INVALID_DATE_RANGE",
      userMessage: `Le bloc « ${title} » se termine avant ou à son heure de début.`,
      technicalDetails: `starts_at=${payload.starts_at}, ends_at=${payload.ends_at}`,
      step: "save",
    });
  }
}

export function buildValidatedCalendarInsert(
  payload: CalendarInsertPayload,
): CalendarInsertPayload & { item_type: CalendarItemType } {
  validateCalendarInsertPayload(payload);
  return {
    ...payload,
    title: payload.title.trim(),
    item_type: payload.item_type as CalendarItemType,
  };
}
