/**
 * EPIC 6B — Quiet Hours Policy.
 */

import type { CalendarEventInput } from "../types/proactiveTypes";
import { detectSensitivePeriod, PERIOD_LABELS } from "../policy/interventionPolicy";

export type QuietHoursConfig = {
  readonly sleepHours: readonly { readonly start: string; readonly end: string }[];
  readonly familyBlocks: readonly CalendarEventInput[];
  readonly deepWorkBlocks: readonly CalendarEventInput[];
  readonly onVacation: boolean;
  readonly absent: boolean;
};

export const DEFAULT_QUIET_HOURS: QuietHoursConfig = {
  sleepHours: [{ start: "22:00", end: "07:00" }],
  familyBlocks: [],
  deepWorkBlocks: [],
  onVacation: false,
  absent: false,
};

function isWithinSleepWindow(now: Date, sleepHours: QuietHoursConfig["sleepHours"]): boolean {
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();
  const currentMinutes = hour * 60 + minute;

  for (const window of sleepHours) {
    const [startH, startM] = window.start.split(":").map(Number);
    const [endH, endM] = window.end.split(":").map(Number);
    const startMinutes = (startH ?? 0) * 60 + (startM ?? 0);
    const endMinutes = (endH ?? 0) * 60 + (endM ?? 0);

    if (startMinutes > endMinutes) {
      if (currentMinutes >= startMinutes || currentMinutes < endMinutes) return true;
    } else if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      return true;
    }
  }

  return false;
}

export function evaluateQuietHours(input: {
  readonly now: string;
  readonly config: QuietHoursConfig;
  readonly calendarEvents: readonly CalendarEventInput[];
}): { readonly isQuiet: boolean; readonly reason?: string; readonly deferUntil?: string } {
  const nowDate = new Date(input.now);

  if (input.config.absent) {
    return { isQuiet: true, reason: "Absence — suggestions différées." };
  }

  if (input.config.onVacation) {
    return { isQuiet: true, reason: "Vacances — suggestions différées." };
  }

  if (isWithinSleepWindow(nowDate, input.config.sleepHours)) {
    const deferUntil = new Date(nowDate);
    deferUntil.setUTCHours(7, 30, 0, 0);
    if (deferUntil <= nowDate) deferUntil.setUTCDate(deferUntil.getUTCDate() + 1);
    return {
      isQuiet: true,
      reason: "Heures de sommeil.",
      deferUntil: deferUntil.toISOString(),
    };
  }

  const sensitive = detectSensitivePeriod({
    calendarEvents: input.calendarEvents,
    now: input.now,
    onVacation: input.config.onVacation,
  });

  if (sensitive) {
    return {
      isQuiet: true,
      reason: `Période sensible : ${PERIOD_LABELS[sensitive.kind]}.`,
      deferUntil: sensitive.event.end,
    };
  }

  return { isQuiet: false };
}
