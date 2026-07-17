import type { ProfileFactRecord } from "../../types";

const VALID_WEEKDAYS = new Set([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
  "variable",
]);

/**
 * Extrait work_days depuis profile_facts, quelle que soit la forme stockée.
 * Source unique pour le calendrier (compact + complet).
 */
export function extractWorkDaysFromFacts(
  facts: ProfileFactRecord[],
): string[] {
  const fact = facts.find((entry) => entry.fact_key === "work_days");
  if (!fact) return [];

  const raw = fact.fact_value;
  const candidates: unknown[] = [raw?.value, raw];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(
        (day): day is string =>
          typeof day === "string" && VALID_WEEKDAYS.has(day),
      );
    }

    if (
      candidate &&
      typeof candidate === "object" &&
      "value" in candidate &&
      Array.isArray((candidate as { value: unknown }).value)
    ) {
      return (candidate as { value: string[] }).value.filter(
        (day): day is string =>
          typeof day === "string" && VALID_WEEKDAYS.has(day),
      );
    }
  }

  return [];
}
