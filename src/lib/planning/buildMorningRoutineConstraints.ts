import type { ConstraintType } from "../../types/planning";
import type { BreakfastSettings } from "../../types/mealSettings";
import {
  combineDateAndTime,
  minutesToTime,
  parseTimeToMinutes,
} from "../time/daySchedule";
import { placeBreakfast } from "./mealPlacement";

export type MorningRoutineBlock = {
  type: ConstraintType;
  title: string;
  startsAt: string;
  endsAt: string;
};

export type MorningRoutineInput = {
  date: string;
  wakeTime: string;
  breakfast?: BreakfastSettings | null;
  personalPrepMinutes?: number | null;
  childrenDepartureTime?: string | null;
  childrenPrepMinutes?: number | null;
  hasChildren: boolean;
  skipChildrenDeparture?: boolean;
};

export type MorningRoutineResult = {
  blocks: MorningRoutineBlock[];
  alerts: string[];
  suggestions: string[];
  departureTime: string | null;
};

function breakfastTitle(settings: BreakfastSettings): string {
  if (settings.mode === "family") return "Petit déjeuner familial";
  return "Petit déjeuner";
}

function isoToMinutes(iso: string): number | null {
  const time = iso.slice(11, 16);
  return parseTimeToMinutes(time);
}

export function buildMorningRoutineConstraints(
  input: MorningRoutineInput,
): MorningRoutineResult {
  const blocks: MorningRoutineBlock[] = [];
  const alerts: string[] = [];
  const suggestions: string[] = [];

  const wakeMinutes = parseTimeToMinutes(input.wakeTime);
  if (wakeMinutes === null) {
    alerts.push("Heure de réveil invalide — routine matin non planifiée.");
    return { blocks, alerts, suggestions, departureTime: null };
  }

  const wakeIso = combineDateAndTime(input.date, input.wakeTime);
  blocks.push({
    type: "wake",
    title: "Réveil",
    startsAt: wakeIso,
    endsAt: wakeIso,
  });

  const personalPrepMinutes = Math.max(0, input.personalPrepMinutes ?? 0);
  const childrenPrepMinutes = Math.max(0, input.childrenPrepMinutes ?? 0);
  const breakfastMinutes =
    input.breakfast?.enabled === true ? input.breakfast.durationMinutes : 0;

  const hasDeparture =
    input.hasChildren &&
    !input.skipChildrenDeparture &&
    Boolean(input.childrenDepartureTime);

  let departureTime: string | null = null;
  let departureMinutes: number | null = null;

  if (hasDeparture) {
    departureTime = input.childrenDepartureTime ?? null;
    departureMinutes = departureTime ? parseTimeToMinutes(departureTime) : null;

    if (!departureTime || departureMinutes === null) {
      alerts.push(
        "Heure de départ des enfants inconnue — routine matin non planifiée.",
      );
      return { blocks, alerts, suggestions, departureTime: null };
    }

    if (!childrenPrepMinutes) {
      alerts.push(
        "Durée de préparation des enfants inconnue — routine matin non planifiée.",
      );
      return { blocks, alerts, suggestions, departureTime };
    }

    const childrenStartMinutes = departureMinutes - childrenPrepMinutes;
    const personalStartMinutes = childrenStartMinutes - personalPrepMinutes;
    const availableMinutes = departureMinutes - wakeMinutes - 5;

    const requiredMinutes = breakfastMinutes + personalPrepMinutes + childrenPrepMinutes;

    if (requiredMinutes > availableMinutes) {
      alerts.push(
        `Le matin nécessite ${requiredMinutes} min mais seulement ${availableMinutes} min sont disponibles avant le départ (${departureTime}).`,
      );
      suggestions.push("Avance ton heure de réveil.");
      suggestions.push("Réduis une durée (petit déjeuner, préparation personnelle ou enfants).");
      return { blocks, alerts, suggestions, departureTime };
    }

    let cursorMinutes = wakeMinutes + 5;

    if (input.breakfast?.enabled) {
      const breakfastBoundary = minutesToTime(
        personalPrepMinutes > 0 ? personalStartMinutes : childrenStartMinutes,
      );
      const breakfast = placeBreakfast({
        date: input.date,
        wakeTime: input.wakeTime,
        morningRoutineStart: breakfastBoundary,
        settings: input.breakfast,
      });

      if (!breakfast) {
        alerts.push(
          "Le petit déjeuner ne peut pas tenir avant le départ — avance le réveil ou réduis une durée.",
        );
        suggestions.push("Avance ton heure de réveil de 15 minutes.");
        suggestions.push("Réduis la durée du petit déjeuner.");
        return { blocks, alerts, suggestions, departureTime };
      }

      const breakfastEndMinutes = isoToMinutes(breakfast.endsAt);
      if (breakfastEndMinutes !== null && breakfastEndMinutes > personalStartMinutes) {
        alerts.push(
          "Le petit déjeuner chevauche la préparation — ajuste les durées dans Mon quotidien.",
        );
        return { blocks, alerts, suggestions, departureTime };
      }

      blocks.push({
        type: "breakfast",
        title: breakfastTitle(input.breakfast),
        startsAt: breakfast.startsAt,
        endsAt: breakfast.endsAt,
      });
      cursorMinutes = breakfastEndMinutes ?? cursorMinutes;
    }

    if (personalPrepMinutes > 0) {
      if (personalStartMinutes < cursorMinutes) {
        alerts.push(
          "Pas assez de temps pour la préparation personnelle avant le départ.",
        );
        suggestions.push("Réduis la préparation personnelle ou avance le réveil.");
        return { blocks, alerts, suggestions, departureTime };
      }

      blocks.push({
        type: "personal_prep",
        title: "Préparation personnelle",
        startsAt: combineDateAndTime(input.date, minutesToTime(personalStartMinutes)),
        endsAt: combineDateAndTime(input.date, minutesToTime(childrenStartMinutes)),
      });
    }

    blocks.push({
      type: "morning_routine",
      title: "Préparation des enfants",
      startsAt: combineDateAndTime(input.date, minutesToTime(childrenStartMinutes)),
      endsAt: combineDateAndTime(input.date, departureTime),
    });

    return { blocks, alerts, suggestions, departureTime };
  }

  let cursorMinutes = wakeMinutes + 5;

  if (input.breakfast?.enabled && input.breakfast) {
    const breakfast = placeBreakfast({
      date: input.date,
      wakeTime: input.wakeTime,
      morningRoutineStart: null,
      settings: input.breakfast,
    });

    if (breakfast) {
      blocks.push({
        type: "breakfast",
        title: breakfastTitle(input.breakfast),
        startsAt: breakfast.startsAt,
        endsAt: breakfast.endsAt,
      });
      const breakfastEndMinutes = isoToMinutes(breakfast.endsAt);
      if (breakfastEndMinutes !== null) {
        cursorMinutes = breakfastEndMinutes;
      }
    }
  }

  if (personalPrepMinutes > 0) {
    const personalStart = cursorMinutes;
    const personalEnd = personalStart + personalPrepMinutes;
    blocks.push({
      type: "personal_prep",
      title: "Préparation personnelle",
      startsAt: combineDateAndTime(input.date, minutesToTime(personalStart)),
      endsAt: combineDateAndTime(input.date, minutesToTime(personalEnd)),
    });
  }

  return { blocks, alerts, suggestions, departureTime: null };
}
