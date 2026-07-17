import { addDaysToDate } from "./deviceClock";
import { addMinutesToIso, combineDateAndTime, parseTimeToMinutes } from "./daySchedule";

const LATE_NIGHT_CUTOFF_MINUTES = 6 * 60;

/**
 * Résout l'heure de coucher sur le bon jour calendaire.
 * « 00:00 » ou toute heure avant 06:00 = fin de soirée (jour suivant).
 */
export function resolveBedDate(date: string, bedTime: string): string {
  const minutes = parseTimeToMinutes(bedTime);
  if (minutes === null) return date;
  if (minutes < LATE_NIGHT_CUTOFF_MINUTES) {
    return addDaysToDate(date, 1);
  }
  return date;
}

/** ISO du coucher adulte (avec gestion minuit). */
export function resolveBedTimeIso(date: string, bedTime: string): string {
  const bedDate = resolveBedDate(date, bedTime);
  return combineDateAndTime(bedDate, bedTime);
}

/** Fin du créneau utilisable du soir (coucher − marge de préparation). */
export function resolveBedWindDownEnd({
  date,
  bedTime,
  windDownMinutes = 30,
}: {
  date: string;
  bedTime: string;
  windDownMinutes?: number;
}): string {
  const bedIso = resolveBedTimeIso(date, bedTime);
  return addMinutesToIso(bedIso, -windDownMinutes);
}
