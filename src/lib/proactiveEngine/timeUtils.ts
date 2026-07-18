/**
 * Utilitaires temporels UTC pour le moteur proactif.
 * Les calculs de durée utilisent des timestamps ISO ; les heures de journée
 * sont lues en UTC pour rester déterministes (vitest TZ=UTC).
 */

export function minutesBetween(startsAt: string, endsAt: string): number {
  const startMs = Date.parse(startsAt);
  const endMs = Date.parse(endsAt);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return 0;
  }
  return Math.round((endMs - startMs) / 60_000);
}

/** Minutes depuis minuit UTC pour une date ISO. */
export function minutesOfDayUtc(iso: string): number {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 0;
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

export function formatDurationLabel(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes}`;
}

export function formatDurationHours(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes.toString().padStart(2, "0")}`;
}

export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  const aStartMs = Date.parse(aStart);
  const aEndMs = Date.parse(aEnd);
  const bStartMs = Date.parse(bStart);
  const bEndMs = Date.parse(bEnd);
  if (
    !Number.isFinite(aStartMs) ||
    !Number.isFinite(aEndMs) ||
    !Number.isFinite(bStartMs) ||
    !Number.isFinite(bEndMs)
  ) {
    return false;
  }
  return aStartMs < bEndMs && bStartMs < aEndMs;
}

const STRUCTURAL_CATEGORIES = new Set([
  "sleep",
  "wake",
  "structural",
  "rest_day",
  "buffer",
  "free",
]);

export function isCountablePlannedItem(category?: string | null): boolean {
  if (!category) return true;
  return !STRUCTURAL_CATEGORIES.has(category.toLowerCase());
}
