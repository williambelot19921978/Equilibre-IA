const WEEKDAY_LABELS = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
] as const;

export function hourBucket(
  iso: string,
): "morning" | "afternoon" | "evening" {
  const hour = new Date(iso).getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export function weekdayLabel(iso: string): string {
  return WEEKDAY_LABELS[new Date(iso).getDay()] ?? "jour";
}

export function hourFromIso(iso: string): number {
  return new Date(iso).getHours();
}

export function clampConfidence(value: number): number {
  return Math.max(5, Math.min(98, Math.round(value)));
}

export function roundDuration(minutes: number): number {
  return Math.max(5, Math.round(minutes / 5) * 5);
}

export function metric<T>(
  value: T,
  sampleSize: number,
  confidence: number,
): {
  value: T;
  confidence: number;
  sampleSize: number;
  updatedAt: string;
} {
  return {
    value,
    confidence: clampConfidence(confidence),
    sampleSize,
    updatedAt: new Date().toISOString(),
  };
}

export function isSportEvent(metadata: Record<string, unknown>): boolean {
  return metadata.workoutCompleted === true || metadata.category === "sport";
}

export function isStudyEvent(metadata: Record<string, unknown>): boolean {
  return (
    metadata.businessType === "study" ||
    /révis|étude/i.test(String(metadata.title ?? ""))
  );
}

export function isCoupleEvent(metadata: Record<string, unknown>): boolean {
  const title = String(metadata.title ?? "").toLowerCase();
  return /couple|partenaire|date/.test(title);
}

export function isCalmEvent(metadata: Record<string, unknown>): boolean {
  const title = String(metadata.title ?? "").toLowerCase();
  return /calme|respiration|pause|médit/.test(title);
}

export function isLeisureEvent(metadata: Record<string, unknown>): boolean {
  const title = String(metadata.title ?? "").toLowerCase();
  return /loisir|lecture|promenade|film|jeu/.test(title);
}

export function isAdminEvent(metadata: Record<string, unknown>): boolean {
  const title = String(metadata.title ?? "").toLowerCase();
  return /admin|paperasse|courrier|impôt|démarche/.test(title);
}

export { WEEKDAY_LABELS };
