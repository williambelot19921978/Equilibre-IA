/**
 * EPIC 5C — Action Engine semantic guards.
 */

import type { SemanticCalendarItem } from "../types/semanticCalendarItem";

export function isFixedMedicalEvent(item: SemanticCalendarItem): boolean {
  return item.category === "sante" && item.flexibility === "fixe";
}

export function isSportEvent(item: SemanticCalendarItem): boolean {
  return item.category === "sport";
}

/** Ne jamais proposer de déplacer un RDV médical avant une séance de sport. */
export function shouldBlockMedicalBeforeSport(input: {
  readonly source: SemanticCalendarItem;
  readonly target: SemanticCalendarItem;
}): boolean {
  if (!isFixedMedicalEvent(input.source)) return false;
  if (!isSportEvent(input.target)) return false;

  const sourceStart = new Date(input.source.start).getTime();
  const targetStart = new Date(input.target.start).getTime();
  return targetStart < sourceStart;
}

export function canRescheduleSemantically(item: SemanticCalendarItem): boolean {
  if (item.flexibility === "fixe") return false;
  if (item.category === "sante") return false;
  if (item.importance >= 5 && item.flexibility !== "flexible") return false;
  return item.editable !== false;
}

export function rescheduleConfidenceFromSemantic(item: SemanticCalendarItem): number {
  if (!canRescheduleSemantically(item)) return 0.15;
  if (item.flexibility === "flexible") return 0.85;
  if (item.flexibility === "deplacable") return 0.65;
  return 0.4;
}

export function shouldProposeReorganizeDay(input: {
  readonly mentalLoad: number;
  readonly blockCount: number;
  readonly eventCount: number;
}): boolean {
  return (
    input.mentalLoad >= 60 ||
    input.blockCount >= 5 ||
    input.eventCount >= 8
  );
}
