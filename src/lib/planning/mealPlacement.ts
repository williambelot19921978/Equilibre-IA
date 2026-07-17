import { addMinutesToIso, combineDateAndTime, getDurationMinutes, minutesToTime, parseTimeToMinutes } from "../time/daySchedule";
import type { MealSettings } from "../../types/mealSettings";

export type MealPlacementResult = {
  breakfast?: { startsAt: string; endsAt: string };
  dinner?: { startsAt: string; endsAt: string };
  transition?: { startsAt: string; endsAt: string };
  conflicts: string[];
};

export function placeBreakfast({
  date,
  wakeTime,
  morningRoutineStart,
  settings,
}: {
  date: string;
  wakeTime: string;
  morningRoutineStart?: string | null;
  settings: MealSettings["breakfast"];
}): { startsAt: string; endsAt: string } | null {
  if (!settings.enabled) return null;

  const wakeMinutes = parseTimeToMinutes(wakeTime);
  if (wakeMinutes === null) return null;

  const startMinutes =
    settings.usualTime && parseTimeToMinutes(settings.usualTime) !== null
      ? Math.max(wakeMinutes + 5, parseTimeToMinutes(settings.usualTime)!)
      : wakeMinutes + 10;

  const startTime = minutesToTime(startMinutes);
  const startsAt = combineDateAndTime(date, startTime);
  const endsAt = addMinutesToIso(startsAt, settings.durationMinutes);

  if (morningRoutineStart) {
    const routineStart = combineDateAndTime(date, morningRoutineStart);
    if (new Date(endsAt).getTime() > new Date(routineStart).getTime()) {
      return null;
    }
  }

  return { startsAt, endsAt };
}

export function placeDinner({
  date,
  eveningRoutineStart,
  afterWorkEnd,
  settings,
}: {
  date: string;
  eveningRoutineStart: string;
  afterWorkEnd?: string | null;
  settings: MealSettings["dinner"];
}): { startsAt: string; endsAt: string; conflicts: string[] } | null {
  const conflicts: string[] = [];
  const routineStart = combineDateAndTime(date, eveningRoutineStart);
  const duration = settings.durationMinutes;

  let startsAt: string;

  if (settings.usualTime) {
    startsAt = combineDateAndTime(date, settings.usualTime);
  } else if (afterWorkEnd) {
    startsAt = afterWorkEnd;
  } else {
    const routineMinutes = parseTimeToMinutes(eveningRoutineStart);
    if (routineMinutes === null) return null;
    startsAt = combineDateAndTime(date, minutesToTime(routineMinutes - duration - 15));
  }

  const endsAt = addMinutesToIso(startsAt, duration);

  if (new Date(endsAt).getTime() > new Date(routineStart).getTime()) {
    conflicts.push(
      "Le dîner chevauche la routine du soir — ajuste les horaires dans Mon quotidien.",
    );
    return null;
  }

  if (afterWorkEnd && new Date(startsAt).getTime() < new Date(afterWorkEnd).getTime()) {
    startsAt = afterWorkEnd;
  }

  const finalEndsAt = addMinutesToIso(startsAt, duration);
  if (new Date(finalEndsAt).getTime() > new Date(routineStart).getTime()) {
    conflicts.push(
      "Pas assez de temps entre le retour et la routine enfants — vérifie Mon quotidien.",
    );
    return null;
  }

  return { startsAt, endsAt: finalEndsAt, conflicts };
}

export function validateMealSchedule(result: MealPlacementResult): string[] {
  const issues: string[] = [...result.conflicts];

  if (result.breakfast && result.dinner) {
    const gap = getDurationMinutes(result.breakfast.endsAt, result.dinner.startsAt);
    if (gap < 60) {
      issues.push("Le petit déjeuner et le dîner sont très proches — horaires à vérifier.");
    }
  }

  return issues;
}
